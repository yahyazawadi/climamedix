// scripts/generateAssetsManifest.js
import fs from 'fs';
import path from 'path';
import { scanAllAssets } from './assetScanner.js';

export function generateAssetsManifest(rootDir = process.cwd()) {
  const result = scanAllAssets(rootDir);
  const outDir = path.join(rootDir, 'src', 'generated');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outFile = path.join(outDir, 'assets-manifest.json');
  fs.writeFileSync(outFile, JSON.stringify(result, null, 2), 'utf8');
  console.log(`[assets-manifest] Generated ${result.totalAssets} assets into ${outFile}`);
  return result;
}

// Allow direct CLI execution: node scripts/generateAssetsManifest.js
if (process.argv[1] && process.argv[1].endsWith('generateAssetsManifest.js')) {
  generateAssetsManifest();
}
