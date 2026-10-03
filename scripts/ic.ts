#!/usr/bin/env bun
import fs from 'fs';
import path from 'path';

interface AssetFile {
  relativePath: string;
  absolutePath: string;
  fileName: string;
  nameWithoutExt: string;
  ext: string;
  type: 'svg' | 'png' | 'webp' | 'ico' | 'raster';
  sizeBytes: number;
  sizeFormatted: string;
  viewBox?: string;
  dimensions?: string;
  pathCount?: number;
  references: { file: string; line: number; snippet: string }[];
}

interface InlineSvgMatch {
  file: string;
  line: number;
  col: number;
  viewBox?: string;
  width?: string;
  height?: string;
  snippet: string;
}

interface IconComponentMatch {
  file: string;
  line: number;
  componentName: string;
  sourceLibrary: string;
}

const ASSET_EXTENSIONS = new Set(['.svg', '.png', '.webp', '.ico', '.jpg', '.jpeg']);
const CODE_EXTENSIONS = new Set(['.tsx', '.ts', '.jsx', '.js', '.html', '.css', '.scss', '.vue', '.svelte']);
const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.cache', '.agents', '.system_generated'
]);

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function parseArgs() {
  const args = process.argv.slice(2);
  let verbose = false;
  let svgOnly = false;
  let pngOnly = false;
  let unusedOnly = false;
  let inlineOnly = false;
  let iconsOnly = false;
  let searchQuery = '';
  const targets: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);
    } else if (arg === '--version') {
      console.log('IC (Icon, SVG & Asset Locator) version 1.0.0');
      process.exit(0);
    } else if (arg === '-v' || arg === '--verbose') {
      verbose = true;
    } else if (arg === '-s' || arg === '--svg' || arg === '--svg-only') {
      svgOnly = true;
    } else if (arg === '-p' || arg === '--png' || arg === '--png-only') {
      pngOnly = true;
    } else if (arg === '-u' || arg === '--unused' || arg === '--orphans') {
      unusedOnly = true;
    } else if (arg === '--inline') {
      inlineOnly = true;
    } else if (arg === '-i' || arg === '--icons') {
      iconsOnly = true;
    } else if (arg === '-q' || arg === '--query' || arg === '--search') {
      searchQuery = args[++i] || '';
    } else if (!arg.startsWith('-')) {
      if (!searchQuery && !fs.existsSync(arg)) {
        // If argument does not exist as path on disk, treat as search query!
        searchQuery = arg;
      } else {
        targets.push(arg);
      }
    }
  }

  if (targets.length === 0) {
    targets.push('.');
  }

  return { verbose, svgOnly, pngOnly, unusedOnly, inlineOnly, iconsOnly, searchQuery, targets };
}

function printHelp() {
  console.log(`\x1b[1mIC (Icon, SVG & Asset Locator)\x1b[0m — Universal Asset Finder, Auditor & Icon Scanner CLI
Scans, locates, and audits SVG vectors, PNG/WebP images, inline <svg> tags, and icon components.
Detects where assets are imported, finds orphaned/unused files, and traces icon usage.

\x1b[1mUSAGE:\x1b[0m
  ic [options] [query] [paths...]

\x1b[1mEXAMPLES:\x1b[0m
  ic                             # Scan workspace & show complete asset inventory
  ic globe                       # Search for any asset or icon matching "globe"
  ic src/ -v                     # Verbose scan of src folder with line numbers & usages
  ic -s                          # Show only SVG assets and vector files
  ic -p                          # Show only PNG and raster images
  ic -u                          # Audit unused/orphaned assets (never referenced in code)
  ic --inline                    # Scan and locate all inline <svg> elements in UI code
  ic -i                          # List all icon files and component usages (Lucide, etc.)
  ic calendar src/               # Search for calendar icons and imports inside src/

\x1b[1mOPTIONS:\x1b[0m
  [query]                        Search keyword to filter assets by name, path, or content
  -s, --svg                      Filter for SVG vector files only
  -p, --png                      Filter for PNG / raster images only
  -u, --unused                   Audit mode: list only orphaned assets with 0 code references
  --inline                       Scan and display inline <svg> elements in JSX/HTML
  -i, --icons                    Display icon assets and icon component imports (e.g. Lucide)
  -v, --verbose                  Show full paths, dimensions, file size, and line references
  -h, --help                     Display this help menu
  --version                      Display tool version

\x1b[1mSUITE OF COMPANION TOOLS:\x1b[0m
  ic                             Icon, SVG & Asset Locator (Universal Asset Finder & Auditor)
  fd                             Font & Text Detector (Typography & Text Instance Scanner)
  er                             Emoji Remover (Universal Emoji Detector & Purger CLI)
  bc                             Barber Checker (Design System & Color Contrast Auditor)`);
}

function collectAllFiles(targetPath: string): { assetFiles: string[]; codeFiles: string[] } {
  const assetFiles: string[] = [];
  const codeFiles: string[] = [];

  function recurse(current: string) {
    if (!fs.existsSync(current)) return;
    const stat = fs.statSync(current);
    if (stat.isFile()) {
      const ext = path.extname(current).toLowerCase();
      if (ASSET_EXTENSIONS.has(ext)) assetFiles.push(current);
      if (CODE_EXTENSIONS.has(ext)) codeFiles.push(current);
      return;
    }

    if (stat.isDirectory()) {
      const base = path.basename(current);
      if (IGNORED_DIRS.has(base)) return;

      try {
        const entries = fs.readdirSync(current, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(current, entry.name);
          if (entry.isDirectory()) {
            if (!IGNORED_DIRS.has(entry.name)) {
              recurse(full);
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (ASSET_EXTENSIONS.has(ext)) assetFiles.push(full);
            if (CODE_EXTENSIONS.has(ext)) codeFiles.push(full);
          }
        }
      } catch {
        // Skip inaccessible folders
      }
    }
  }

  recurse(targetPath);
  return { assetFiles, codeFiles };
}

function parseSvgMetadata(content: string): { viewBox?: string; dimensions?: string; pathCount: number } {
  let viewBox: string | undefined;
  let dimensions: string | undefined;

  const vbMatch = content.match(/viewBox\s*=\s*["']([^"']+)["']/i);
  if (vbMatch) viewBox = vbMatch[1];

  const wMatch = content.match(/width\s*=\s*["']([^"']+)["']/i);
  const hMatch = content.match(/height\s*=\s*["']([^"']+)["']/i);
  if (wMatch && hMatch) {
    dimensions = `${wMatch[1]}x${hMatch[1]}`;
  }

  const paths = (content.match(/<(path|circle|rect|polygon|polyline|ellipse|line)\b/gi) || []).length;
  return { viewBox, dimensions, pathCount: paths };
}

function analyzeAssetFile(filePath: string): AssetFile {
  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath);
  const nameWithoutExt = path.parse(filePath).name;
  const relativePath = path.relative(process.cwd(), filePath) || filePath;

  let type: AssetFile['type'] = 'raster';
  if (ext === '.svg') type = 'svg';
  else if (ext === '.png') type = 'png';
  else if (ext === '.webp') type = 'webp';
  else if (ext === '.ico') type = 'ico';

  let viewBox: string | undefined;
  let dimensions: string | undefined;
  let pathCount: number | undefined;

  if (type === 'svg') {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const meta = parseSvgMetadata(content);
      viewBox = meta.viewBox;
      dimensions = meta.dimensions;
      pathCount = meta.pathCount;
    } catch {}
  }

  return {
    relativePath,
    absolutePath: filePath,
    fileName,
    nameWithoutExt,
    ext,
    type,
    sizeBytes: stat.size,
    sizeFormatted: formatBytes(stat.size),
    viewBox,
    dimensions,
    pathCount,
    references: [],
  };
}

function scanCodeForAssetReferences(
  codeFiles: string[],
  assets: AssetFile[]
): {
  inlineSvgs: InlineSvgMatch[];
  iconComponents: IconComponentMatch[];
} {
  const inlineSvgs: InlineSvgMatch[] = [];
  const iconComponents: IconComponentMatch[] = [];

  const assetLookup = new Map<string, AssetFile>();
  for (const asset of assets) {
    assetLookup.set(asset.fileName.toLowerCase(), asset);
  }

  for (const codeFile of codeFiles) {
    let content = '';
    try {
      content = fs.readFileSync(codeFile, 'utf8');
    } catch {
      continue;
    }

    const relCodePath = path.relative(process.cwd(), codeFile) || codeFile;
    const lines = content.split(/\r?\n/);

    // Match icon component imports (e.g. lucide-react, lucide-preact)
    const iconImportRegex = /import\s*\{([^}]+)\}\s*from\s*['"](lucide-react|lucide-preact|react-icons[^'"]*)['"]/g;
    let iconMatch;
    while ((iconMatch = iconImportRegex.exec(content)) !== null) {
      const rawIcons = iconMatch[1];
      const library = iconMatch[2];
      const lineNum = content.slice(0, iconMatch.index).split(/\r?\n/).length;
      const icons = rawIcons
        .split(',')
        .map(s => s.trim().split(/\s+as\s+/)[0].replace(/[\r\n]/g, ''))
        .filter(s => s.length > 0 && /^[A-Z]/.test(s));

      for (const icon of icons) {
        iconComponents.push({
          file: relCodePath,
          line: lineNum,
          componentName: icon,
          sourceLibrary: library,
        });
      }
    }

    // 1. Scan for inline SVGs and asset references line by line
    lines.forEach((lineText, idx) => {
      const lineNum = idx + 1;
      const svgTagMatch = lineText.match(/<svg\b([^>]*)>/i);
      if (svgTagMatch) {
        const tagAttributes = svgTagMatch[1];
        const vb = tagAttributes.match(/viewBox=["']([^"']+)["']/i)?.[1];
        const w = tagAttributes.match(/width=["']([^"']+)["']/i)?.[1];
        const h = tagAttributes.match(/height=["']([^"']+)["']/i)?.[1];
        inlineSvgs.push({
          file: relCodePath,
          line: lineNum,
          col: (svgTagMatch.index || 0) + 1,
          viewBox: vb,
          width: w,
          height: h,
          snippet: lineText.trim().slice(0, 100),
        });
      }

      // 3. Scan for asset file references
      for (const asset of assets) {
        // Fast checks: check if file name or stem appears in line
        if (lineText.includes(asset.fileName)) {
          asset.references.push({
            file: relCodePath,
            line: lineNum,
            snippet: lineText.trim(),
          });
        }
      }
    });
  }

  return { inlineSvgs, iconComponents };
}

function main() {
  const opts = parseArgs();

  let allAssetPaths: string[] = [];
  let allCodePaths: string[] = [];

  for (const t of opts.targets) {
    const { assetFiles, codeFiles } = collectAllFiles(t);
    allAssetPaths.push(...assetFiles);
    allCodePaths.push(...codeFiles);
  }

  allAssetPaths = Array.from(new Set(allAssetPaths));
  allCodePaths = Array.from(new Set(allCodePaths));

  console.log(`\x1b[1m[ic]\x1b[0m Scanning ${allAssetPaths.length} asset files and ${allCodePaths.length} code files...`);

  // Analyze all assets
  const assets: AssetFile[] = allAssetPaths.map(analyzeAssetFile);

  // Scan code for references, inline SVGs, and icon components
  const { inlineSvgs, iconComponents } = scanCodeForAssetReferences(allCodePaths, assets);

  // Filter based on options
  let filteredAssets = assets;

  if (opts.svgOnly) {
    filteredAssets = filteredAssets.filter(a => a.type === 'svg');
  } else if (opts.pngOnly) {
    filteredAssets = filteredAssets.filter(a => a.type === 'png' || a.type === 'webp');
  }

  if (opts.unusedOnly) {
    filteredAssets = filteredAssets.filter(a => a.references.length === 0);
  }

  if (opts.iconsOnly) {
    filteredAssets = filteredAssets.filter(
      a => a.relativePath.includes('icon') || a.fileName.toLowerCase().includes('icon') || a.type === 'svg'
    );
  }

  if (opts.searchQuery) {
    const q = opts.searchQuery.toLowerCase();
    filteredAssets = filteredAssets.filter(
      a => a.fileName.toLowerCase().includes(q) || a.relativePath.toLowerCase().includes(q)
    );
  }

  // Display Inline SVGs if requested or if query matches
  let matchedInlineSvgs = inlineSvgs;
  if (opts.searchQuery) {
    const q = opts.searchQuery.toLowerCase();
    matchedInlineSvgs = inlineSvgs.filter(s => s.file.toLowerCase().includes(q) || s.snippet.toLowerCase().includes(q));
  }

  // Display Icon Components if requested or if query matches
  let matchedIconComponents = iconComponents;
  if (opts.searchQuery) {
    const q = opts.searchQuery.toLowerCase();
    matchedIconComponents = iconComponents.filter(
      ic => ic.componentName.toLowerCase().includes(q) || ic.file.toLowerCase().includes(q)
    );
  }

  // OUTPUT RESULTS
  if (!opts.inlineOnly) {
    if (filteredAssets.length === 0) {
      if (opts.unusedOnly) {
        console.log(`\n\x1b[32m✔ Excellent: No orphaned or unused assets detected! All assets are referenced in code.\x1b[0m`);
      } else {
        console.log(`\n\x1b[33mNo asset files matched the search criteria.\x1b[0m`);
      }
    } else {
      console.log(`\n\x1b[1mASSET FILES (${filteredAssets.length} found):\x1b[0m`);

      // Group by directory
      const grouped = new Map<string, AssetFile[]>();
      for (const a of filteredAssets) {
        const dir = path.dirname(a.relativePath) || '.';
        if (!grouped.has(dir)) grouped.set(dir, []);
        grouped.get(dir)!.push(a);
      }

      for (const [dir, dirAssets] of grouped) {
        console.log(`\n\x1b[36m${dir}/\x1b[0m`);
        for (const a of dirAssets) {
          const typeBadge = a.type === 'svg'
            ? `\x1b[35m[svg]\x1b[0m`
            : a.type === 'png'
            ? `\x1b[34m[png]\x1b[0m`
            : `\x1b[33m[${a.type}]\x1b[0m`;

          const metaStr = a.dimensions
            ? `\x1b[90m(${a.dimensions}, ${a.sizeFormatted})\x1b[0m`
            : a.viewBox
            ? `\x1b[90m(viewBox="${a.viewBox}", ${a.sizeFormatted})\x1b[0m`
            : `\x1b[90m(${a.sizeFormatted})\x1b[0m`;

          const refCountStr = a.references.length === 0
            ? `\x1b[31m[UNUSED / ORPHAN]\x1b[0m`
            : `\x1b[32m[${a.references.length} reference${a.references.length > 1 ? 's' : ''}]\x1b[0m`;

          console.log(`  ${typeBadge} \x1b[1m${a.fileName}\x1b[0m ${metaStr} ${refCountStr}`);

          if (opts.verbose && a.references.length > 0) {
            for (const ref of a.references) {
              console.log(`    \x1b[90m↳\x1b[0m \x1b[36m${ref.file}\x1b[0m:\x1b[33m${ref.line}\x1b[0m \x1b[90m${ref.snippet.slice(0, 80)}\x1b[0m`);
            }
          }
        }
      }
    }
  }

  // Display Inline SVGs if flagged or verbose
  if (opts.inlineOnly || (opts.verbose && matchedInlineSvgs.length > 0)) {
    console.log(`\n\x1b[1mINLINE <svg> ELEMENTS (${matchedInlineSvgs.length} detected):\x1b[0m`);
    for (const isvg of matchedInlineSvgs.slice(0, 30)) {
      const vbStr = isvg.viewBox ? ` viewBox="${isvg.viewBox}"` : '';
      const dimStr = isvg.width && isvg.height ? ` ${isvg.width}x${isvg.height}` : '';
      console.log(`  \x1b[36m${isvg.file}\x1b[0m:\x1b[33m${isvg.line}:${isvg.col}\x1b[0m \x1b[35m<svg>\x1b[0m\x1b[90m${vbStr}${dimStr}\x1b[0m`);
    }
    if (matchedInlineSvgs.length > 30) {
      console.log(`  \x1b[90m... and ${matchedInlineSvgs.length - 30} more inline SVGs\x1b[0m`);
    }
  }

  // Display Icon Components if flagged or verbose or query matched
  if (opts.iconsOnly || (opts.searchQuery && matchedIconComponents.length > 0) || opts.verbose) {
    if (matchedIconComponents.length > 0) {
      console.log(`\n\x1b[1mICON COMPONENT USAGES (${matchedIconComponents.length} imports):\x1b[0m`);
      const componentCounts = new Map<string, number>();
      for (const ic of matchedIconComponents) {
        componentCounts.set(ic.componentName, (componentCounts.get(ic.componentName) || 0) + 1);
      }
      for (const [comp, count] of Array.from(componentCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20)) {
        console.log(`  \x1b[32m<${comp} />\x1b[0m \x1b[90m— imported ${count} time${count > 1 ? 's' : ''}\x1b[0m`);
      }
    }
  }

  // SUMMARY BOX
  const totalAssets = assets.length;
  const totalSvg = assets.filter(a => a.type === 'svg').length;
  const totalPng = assets.filter(a => a.type === 'png').length;
  const totalWebp = assets.filter(a => a.type === 'webp').length;
  const totalUnused = assets.filter(a => a.references.length === 0).length;
  const totalDiskBytes = assets.reduce((sum, a) => sum + a.sizeBytes, 0);

  console.log(`\n\x1b[1m[ic SUMMARY]\x1b[0m`);
  console.log(`  Total Asset Files:    ${totalAssets}`);
  console.log(`  - SVGs:               ${totalSvg}`);
  console.log(`  - PNGs:               ${totalPng}`);
  console.log(`  - WebPs:              ${totalWebp}`);
  console.log(`  Inline <svg> in code: ${inlineSvgs.length}`);
  console.log(`  Icon Components:      ${iconComponents.length}`);
  console.log(`  Total Asset Footprint:${formatBytes(totalDiskBytes)}`);
  if (totalUnused > 0) {
    console.log(`  \x1b[31mUnused / Orphaned:    ${totalUnused} files (run 'ic -u' to list them)\x1b[0m`);
  } else {
    console.log(`  \x1b[32mUnused / Orphaned:    0 files (100% asset hygiene!)\x1b[0m`);
  }
  console.log(`\x1b[90mTip: Run 'ic <query>' to locate any icon, 'ic -v' for verbose, or 'ic -u' for orphan audit.\x1b[0m\n`);
}

main();
