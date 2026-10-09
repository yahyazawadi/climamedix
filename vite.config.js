import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { VitePWA } from 'vite-plugin-pwa'

import { scanAllAssets } from './scripts/assetScanner.js'
import { generateAssetsManifest } from './scripts/generateAssetsManifest.js'

function assetScannerPlugin() {
  return {
    name: 'vite-plugin-asset-scanner',
    buildStart() {
      // Auto-generate fresh manifest on build / start
      try {
        generateAssetsManifest(process.cwd());
      } catch (err) {
        console.warn('[vite-plugin-asset-scanner] Could not generate build-time manifest:', err);
      }
    },
    configureServer(server) {
      server.middlewares.use('/api/assets', (req, res, next) => {
        if (req.method === 'GET') {
          try {
            // Dynamically scan the filesystem on demand for 100% fresh, real-time data
            const data = scanAllAssets(process.cwd());
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Cache-Control', 'no-store');
            res.end(JSON.stringify(data));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }
        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    preact(),
    assetScannerPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg}'],
        maximumFileSizeToCacheInBytes: 3000000,
        navigateFallback: null,
      },
      manifest: {
        name: 'كلايما ميدكس | العمل المناخي والصحة',
        short_name: 'ClimaMedix',
        description: 'تمكين مقدمي الرعاية الصحية لأجل العمل المناخي',
        theme_color: '#0B2849',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'portrait',
        dir: 'rtl',
        lang: 'ar',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  server: {
    port: 9090,
    strictPort: true
  }
})
