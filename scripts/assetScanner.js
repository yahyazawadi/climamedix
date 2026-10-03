// scripts/assetScanner.js
import fs from 'fs';
import path from 'path';

const ASSET_EXTS = new Set(['.svg', '.png', '.webp', '.ico', '.jpg', '.jpeg', '.gif', '.m4a', '.mp4', '.webm', '.pdf']);
const CODE_EXTS = new Set(['.jsx', '.js', '.tsx', '.ts', '.html', '.css', '.scss', '.vue', '.svelte', '.json', '.md']);
const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.cache', '.agents', '.system_generated', '.vitest']);

function walk(dir, rootDir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const item of list) {
    if (IGNORED_DIRS.has(item) || item.startsWith('.')) continue;
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(walk(full, rootDir));
    } else {
      results.push(full);
    }
  }
  return results;
}

// Extract distinctive geometry/path/line signatures for SVGs
function extractSvgSignatures(content) {
  if (!content) return [];
  const sigs = [];

  // 1. Path 'd' attributes
  const dMatches = [...content.matchAll(/\bd\s*=\s*["']([^"']{10,})["']/gi)];
  for (const m of dMatches) {
    sigs.push(m[1].trim());
  }

  // 2. Points attribute (polylines/polygons)
  const ptMatches = [...content.matchAll(/\bpoints\s*=\s*["']([^"']{6,})["']/gi)];
  for (const m of ptMatches) {
    sigs.push(m[1].trim());
  }

  // 3. Line elements with coordinate pairs like x1="8.59" y1="13.51"
  const lineMatches = [...content.matchAll(/<line\b[^>]*\bx1\s*=\s*["']([^"']+)["'][^>]*\by1\s*=\s*["']([^"']+)["'][^>]*\bx2\s*=\s*["']([^"']+)["'][^>]*\by2\s*=\s*["']([^"']+)["']/gi)];
  for (const m of lineMatches) {
    // Unique coordinate substring
    sigs.push(`x1="${m[1]}" y1="${m[2]}" x2="${m[3]}" y2="${m[4]}"`);
  }

  return sigs;
}

export function scanAllAssets(rootDir = process.cwd()) {
  const allFiles = walk(rootDir, rootDir);

  const codeFiles = allFiles.filter(f => CODE_EXTS.has(path.extname(f).toLowerCase()));

  // Scan files from src/assets and public (and any media asset in src)
  const assetFiles = allFiles.filter(f => {
    const ext = path.extname(f).toLowerCase();
    if (!ASSET_EXTS.has(ext)) return false;
    const rel = path.relative(rootDir, f).split(path.sep).join('/');
    return rel.startsWith('src/assets') || rel.startsWith('public');
  });

  // Preload code files into memory
  const codeContents = codeFiles.map(f => ({
    relPath: path.relative(rootDir, f).split(path.sep).join('/'),
    content: fs.readFileSync(f, 'utf8'),
    lines: fs.readFileSync(f, 'utf8').split(/\r?\n/)
  }));

  const assets = assetFiles.map(filePath => {
    const relPath = path.relative(rootDir, filePath).split(path.sep).join('/');
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const stat = fs.statSync(filePath);

    // Escape fileName for RegExp
    const escapedName = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match exact file name surrounded by boundary, quotes, slashes, or end of import string
    const matchRegex = new RegExp(`(?:['"/]|^|\\b)${escapedName}(?:['"?#]|$|\\b)`, 'i');

    const references = [];

    // 1. Direct file name matching across code
    for (const code of codeContents) {
      if (code.relPath.includes('assetScanner') || code.relPath.includes('assets-manifest.json')) continue;
      if (!code.content.includes(fileName)) continue;

      code.lines.forEach((lineText, idx) => {
        if (matchRegex.test(lineText)) {
          references.push({
            file: code.relPath,
            line: idx + 1,
            snippet: lineText.trim().slice(0, 160),
            matchType: 'file'
          });
        }
      });
    }

    // 2. Secondary check for SVGs: check if the exact geometry/lines were inlined directly in JSX/HTML
    let inlineMatches = [];
    if (ext === '.svg') {
      try {
        const svgContent = fs.readFileSync(filePath, 'utf8');
        const signatures = extractSvgSignatures(svgContent);

        for (const sig of signatures) {
          const cleanSig = sig.replace(/\s+/g, ' ');
          if (cleanSig.length < 10) continue;

          for (const code of codeContents) {
            if (code.relPath === relPath || code.relPath.includes('assetScanner') || code.relPath.includes('assets-manifest.json')) continue;
            
            // Check if snippet contains signature
            if (code.content.includes(cleanSig)) {
              code.lines.forEach((lineText, idx) => {
                if (lineText.includes(cleanSig)) {
                  // Avoid duplicate entry for the same file and line
                  const alreadyRecorded = inlineMatches.some(m => m.file === code.relPath && m.line === idx + 1);
                  if (!alreadyRecorded) {
                    inlineMatches.push({
                      file: code.relPath,
                      line: idx + 1,
                      snippet: lineText.trim().slice(0, 160),
                      matchType: 'inline-clone'
                    });
                  }
                }
              });
            }
          }
        }
      } catch {}
    }

    // Combine direct and inline references
    const allRefs = [...references, ...inlineMatches];

    let assetType = 'other';
    if (ext === '.svg') assetType = 'svg';
    else if (['.png', '.webp', '.jpg', '.jpeg', '.gif'].includes(ext)) assetType = 'image';
    else if (['.m4a', '.mp4', '.webm'].includes(ext)) assetType = 'media';

    return {
      name: fileName,
      path: relPath,
      ext: ext.replace('.', ''),
      type: assetType,
      sizeBytes: stat.size,
      directReferencesCount: references.length,
      inlineReferencesCount: inlineMatches.length,
      referencesCount: allRefs.length,
      references: allRefs
    };
  });

  // Sort: most referenced first, or alphabetical
  assets.sort((a, b) => b.referencesCount - a.referencesCount || a.name.localeCompare(b.name));

  return {
    scannedAt: new Date().toISOString(),
    totalAssets: assets.length,
    totalReferences: assets.reduce((acc, a) => acc + a.referencesCount, 0),
    assets
  };
}
