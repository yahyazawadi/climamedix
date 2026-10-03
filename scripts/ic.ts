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
  stroke?: string;
  fill?: string;
  ariaLabel?: string;
  context?: string;
  shapes?: string;
  snippet: string;
  rawContent: string;
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

  // 1. Running ic with no arguments displays help menu (ic = ic --help)
  if (args.length === 0) {
    printHelp();
    process.exit(0);
  }

  let verbose = false;
  let svgOnly = false;
  let pngOnly = false;
  let unusedOnly = false;
  let inlineOnly = false;
  let iconsOnly = false;
  let noIcons = false;
  let searchQuery = '';
  const targets: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);
    } else if (arg === '--version') {
      console.log('IC (Icon, SVG & Asset Locator) version 1.1.0');
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
    } else if (arg === '--no-icons' || arg === '--exclude-icons') {
      noIcons = true;
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

  return { verbose, svgOnly, pngOnly, unusedOnly, inlineOnly, iconsOnly, noIcons, searchQuery, targets };
}

function printHelp() {
  console.log(`\x1b[1mIC (Icon, SVG & Asset Locator)\x1b[0m — Universal Asset Finder, Auditor & Inline <svg> Scanner CLI
Scans, locates, and audits SVG vectors, inline <svg> tags, PNG/WebP images, and icon components.
Detects where assets are imported, finds orphaned/unused files, and locates <svg> tags wherever they are.

\x1b[1mUSAGE:\x1b[0m
  ic [options] [query] [paths...]

\x1b[1mEXAMPLES:\x1b[0m
  ic .                           # Scan workspace for all assets and inline <svg> tags
  ic globe                       # Search for any asset, inline <svg>, or icon matching "globe"
  ic cap                         # Search for graduation cap, hat, or course SVGs
  ic svg                         # Locate all SVG assets and inline <svg> elements
  ic src/ -v                     # Verbose scan of src folder with line numbers & snippets
  ic -s                          # Show only SVG assets and inline <svg> tags
  ic -p                          # Show only PNG and raster images
  ic -u                          # Audit unused/orphaned assets (never referenced in code)
  ic -i                          # List all icon files and component usages (Lucide, etc.)
  ic calendar src/               # Search for calendar icons and <svg> tags inside src/

\x1b[1mOPTIONS:\x1b[0m
  [query]                        Search keyword to filter assets and inline <svg> tags
  -s, --svg                      Filter for SVG vector files and inline <svg> elements
  -p, --png                      Filter for PNG / raster images only
  -u, --unused                   Audit mode: list only orphaned assets with 0 code references
  --inline                       Display only inline <svg> tags found across UI code
  -i, --icons                    Display icon assets and icon component imports (e.g. Lucide)
  -v, --verbose                  Show full paths, dimensions, file size, context, and code snippets
  -h, --help                     Display this help menu
  --version                      Display tool version

\x1b[1mSUITE OF COMPANION TOOLS:\x1b[0m
  ic                             Icon, SVG & Asset Locator (Universal Asset Finder & <svg> Scanner)
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

  for (const codeFile of codeFiles) {
    let content = '';
    try {
      content = fs.readFileSync(codeFile, 'utf8');
    } catch {
      continue;
    }

    const relCodePath = path.relative(process.cwd(), codeFile) || codeFile;
    const lines = content.split(/\r?\n/);

    // 1. Match icon component imports (e.g. lucide-react, lucide-preact)
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

    // 2. Scan for ALL inline <svg> tags wherever they appear (single-line or multi-line)
    const svgRegex = /<svg\b([^>]*)>([\s\S]*?)<\/svg>/gi;
    let svgTagMatch;
    while ((svgTagMatch = svgRegex.exec(content)) !== null) {
      const tagAttributes = svgTagMatch[1];
      const innerContent = svgTagMatch[2];
      const fullMatch = svgTagMatch[0];
      const matchIndex = svgTagMatch.index;

      const prefix = content.slice(0, matchIndex);
      const linesBefore = prefix.split(/\r?\n/);
      const lineNum = linesBefore.length;
      const colNum = linesBefore[linesBefore.length - 1].length + 1;

      const vb = tagAttributes.match(/viewBox=["']([^"']+)["']/i)?.[1];
      const w = tagAttributes.match(/width=["']([^"']+)["']/i)?.[1];
      const h = tagAttributes.match(/height=["']([^"']+)["']/i)?.[1];
      const stroke = tagAttributes.match(/stroke=["']([^"']+)["']/i)?.[1];
      const fill = tagAttributes.match(/fill=["']([^"']+)["']/i)?.[1];
      const ariaLabel = tagAttributes.match(/aria-label=["']([^"']+)["']/i)?.[1];

      // Extract preceding context (comments or parent component elements within preceding lines)
      const contextLines = linesBefore.slice(-3).map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('<div')).join(' ');

      // Extract shape breakdown
      const shapes = (innerContent.match(/<(path|circle|rect|polygon|polyline|line)\b/gi) || []).map(s => s.replace('<', '')).join(', ');

      inlineSvgs.push({
        file: relCodePath,
        line: lineNum,
        col: colNum,
        viewBox: vb,
        width: w,
        height: h,
        stroke,
        fill,
        ariaLabel,
        context: contextLines || undefined,
        shapes: shapes || undefined,
        snippet: fullMatch.slice(0, 150).replace(/\s+/g, ' '),
        rawContent: `${relCodePath} ${tagAttributes} ${innerContent} ${contextLines}`,
      });
    }

    // 3. Scan for asset file references line by line
    lines.forEach((lineText, idx) => {
      const lineNum = idx + 1;
      for (const asset of assets) {
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

  console.log(`\x1b[1m[ic]\x1b[0m Scanning ${allAssetPaths.length} asset files and ${allCodePaths.length} code files for assets & <svg> tags...`);

  // Analyze all assets
  const assets: AssetFile[] = allAssetPaths.map(analyzeAssetFile);

  // Scan code for references, inline <svg> tags wherever they are, and icon components
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

  if (opts.noIcons) {
    filteredAssets = filteredAssets.filter(
      a => !a.relativePath.toLowerCase().includes('icon')
    );
  }

  if (opts.searchQuery) {
    const q = opts.searchQuery.toLowerCase();
    filteredAssets = filteredAssets.filter(
      a => a.fileName.toLowerCase().includes(q) || a.relativePath.toLowerCase().includes(q)
    );
  }

  // Filter Inline <svg> tags: matches query against file path, tag attributes, inner paths, or context
  let matchedInlineSvgs = inlineSvgs;
  if (opts.searchQuery) {
    const q = opts.searchQuery.toLowerCase();
    if (q === 'svg' || q === '<svg>' || q === '<svg') {
      matchedInlineSvgs = inlineSvgs;
    } else {
      matchedInlineSvgs = inlineSvgs.filter(s => s.rawContent.toLowerCase().includes(q));
    }
  }

  // Display Icon Components if requested or if query matches
  let matchedIconComponents = iconComponents;
  if (opts.searchQuery) {
    const q = opts.searchQuery.toLowerCase();
    matchedIconComponents = iconComponents.filter(
      ic => ic.componentName.toLowerCase().includes(q) || ic.file.toLowerCase().includes(q)
    );
  }

  // 1. OUTPUT ASSET FILES (unless user asked for inline only)
  if (!opts.inlineOnly && !opts.pngOnly && filteredAssets.length > 0) {
    console.log(`\n\x1b[1mASSET FILES (${filteredAssets.length} found):\x1b[0m`);

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

  // 2. OUTPUT INLINE <svg> TAGS (ALWAYS DISPLAY WHEN SEARCHING OR REQUESTED)
  if (!opts.pngOnly && !opts.unusedOnly) {
    if (matchedInlineSvgs.length > 0) {
      console.log(`\n\x1b[1mINLINE <svg> TAGS LOCATED (${matchedInlineSvgs.length} tags found):\x1b[0m`);

      // Group inline SVGs by file
      const svgGrouped = new Map<string, InlineSvgMatch[]>();
      for (const s of matchedInlineSvgs) {
        if (!svgGrouped.has(s.file)) svgGrouped.set(s.file, []);
        svgGrouped.get(s.file)!.push(s);
      }

      for (const [file, items] of svgGrouped) {
        console.log(`\n\x1b[36m${file}\x1b[0m:`);
        for (const item of items) {
          const vbStr = item.viewBox ? ` viewBox="${item.viewBox}"` : '';
          const dimStr = item.width && item.height ? ` ${item.width}x${item.height}` : '';
          const contextStr = item.context ? ` \x1b[90m[${item.context.slice(0, 60)}]\x1b[0m` : '';
          const shapesStr = item.shapes ? ` \x1b[33m(${item.shapes})\x1b[0m` : '';

          console.log(`  \x1b[33mline ${item.line}:${item.col}\x1b[0m \x1b[35m<svg>\x1b[0m\x1b[90m${vbStr}${dimStr}\x1b[0m${shapesStr}${contextStr}`);
          if (opts.verbose) {
            console.log(`    \x1b[90m↳ ${item.snippet}\x1b[0m`);
          }
        }
      }
    } else if (opts.searchQuery && (opts.searchQuery.includes('svg') || opts.inlineOnly)) {
      console.log(`\n\x1b[33mNo inline <svg> tags matched the search criteria.\x1b[0m`);
    }
  }

  // 3. OUTPUT ICON COMPONENTS
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
  console.log(`  - SVGs on disk:       ${totalSvg}`);
  console.log(`  - PNGs on disk:       ${totalPng}`);
  console.log(`  - WebPs on disk:      ${totalWebp}`);
  console.log(`  \x1b[35mInline <svg> in code: ${inlineSvgs.length} tags located\x1b[0m`);
  console.log(`  Icon Components:      ${iconComponents.length} imports`);
  console.log(`  Total Asset Footprint:${formatBytes(totalDiskBytes)}`);
  if (totalUnused > 0) {
    console.log(`  \x1b[31mUnused / Orphaned:    ${totalUnused} files (run 'ic -u' to list them)\x1b[0m`);
  } else {
    console.log(`  \x1b[32mUnused / Orphaned:    0 files (100% asset hygiene!)\x1b[0m`);
  }
  console.log(`\x1b[90mTip: Run 'ic <query>' to locate any icon/tag, 'ic -v' for verbose, or 'ic -s' for SVGs.\x1b[0m\n`);
}

main();
