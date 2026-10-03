# Client-Side Bundle & Compression Optimization Guide
**Project**: ClimaMedix PWA  
**Stack**: Preact + Vite + Cloudflare (Pages / CDN) + Workbox PWA  
**Status**: Deferred / Backlog (To be implemented when core features are finalized)

---

## 1. Executive Summary & Reality Check

### Can aggressive compression reduce client download size by 50%?
* **On already minified & Brotli-compressed assets:** No. Switching from standard minification to aggressive minifier flags (like Terser with multiple passes and property mangling) only yields **~5% to 10%** in wire transfer savings.
* **On total initial client payload (Initial Load Size):** **YES (40% – 60%+ reduction)**, but primarily through **strategic bundle decomposition (code splitting / dynamic lazy loading)** and **pre-compressed asset delivery**, rather than minifier tweaks alone.

---

## 2. Current Architecture & Existing Baseline

1. **Framework Baseline**:
   - Built on **Preact** (`preact: ^10.29.1` with `@preact/preset-vite`), which already saves ~40 KB compared to standard React.
2. **Bundler & Minifier**:
   - **Vite 8** using default `esbuild` for minification. `esbuild` is extremely fast and effective for whitespace, dead-code elimination, and variable mangling.
3. **Transport / Edge Layer**:
   - **Cloudflare**: Automatically provides edge-level **Brotli (`br`)** and **Gzip** encoding.
4. **Offline / PWA Layer**:
   - **Workbox (`vite-plugin-pwa`)**: Caches static assets up to 3 MB into CacheStorage.

---

## 3. High-Impact Optimization Checklist (Where the 50% Savings Live)

### A. Lazy Loading Heavy Dependencies (Est. Savings: ~350 KB - 500 KB)

| Package | Current Usage | Action Item |
| :--- | :--- | :--- |
| **`jspdf`** (~350 KB min) | Already dynamically imported in [`CertificateGenerator.jsx`](file:///c:/Users/CLICK/Desktop/climamedix-pwa/src/features/learning-hub/components/certificates/CertificateGenerator.jsx#L257) via `await import('jspdf')`. | Keep this pattern; ensure it is never statically imported in index or common utility modules. |
| **`react-quill` + Quill CSS** (~150 KB) | Statically imported in [`RichTextEditor.jsx`](file:///c:/Users/CLICK/Desktop/climamedix-pwa/src/features/shared/components/RichTextEditor.jsx#L2-L3) and [`ArticleReaderPage.jsx`](file:///c:/Users/CLICK/Desktop/climamedix-pwa/src/features/news-blog/components/ArticleReaderPage.jsx#L9). | Lazy load [`RichTextEditor.jsx`](file:///c:/Users/CLICK/Desktop/climamedix-pwa/src/features/shared/components/RichTextEditor.jsx) dynamically with `preact/compat` `lazy()` or dynamic `import()`, so users reading articles don't download the rich editor bundle. |
| **`@aws-sdk/client-s3` & `@aws-sdk/s3-request-presigner`** (~100 KB+) | Statically imported in [`s3Client.js`](file:///c:/Users/CLICK/Desktop/climamedix-pwa/src/utils/s3Client.js#L1-L2). | Only load AWS SDK modules inside client upload dialogs/actions, or delegate presigned URL generation to a Cloudflare Worker / backend endpoint. |

---

### B. Route-Based Code Splitting

Ensure all major view components are loaded with lazy chunks:
```jsx
// Avoid top-level static imports for heavy routes in App.jsx / router:
import { lazy, Suspense } from 'preact/compat';

const AdminHub = lazy(() => import('./features/admin/AdminHub'));
const LearningHub = lazy(() => import('./features/learning-hub/LearningHub'));
const NewsBlog = lazy(() => import('./features/news-blog/NewsBlog'));
```

---

### C. Build-Time Pre-compression (Brotli Level 11 & Gzip Maximum)

While Cloudflare compresses on-the-fly, dynamic edge compression uses a lower Brotli quality level (typically quality 4–6) to minimize latency and CPU overhead on the server.

By pre-compressing static build outputs using **Brotli Quality 11** at build time, you achieve maximum theoretical compression ratio:

1. Install `vite-plugin-compression2`:
   ```bash
   npm i -D vite-plugin-compression2
   ```
2. Configure in [`vite.config.js`](file:///c:/Users/CLICK/Desktop/climamedix-pwa/vite.config.js):
   ```javascript
   import { compression } from 'vite-plugin-compression2';

   export default defineConfig({
     plugins: [
       // ... other plugins
       compression({ algorithm: 'brotliCompress', exclude: [/\.(br)$/, /\.(gz)$/] }),
       compression({ algorithm: 'gzip', exclude: [/\.(br)$/, /\.(gz)$/] })
     ]
   });
   ```
3. Cloudflare Pages automatically serves pre-compressed `.br` files if configured.

---

### D. Advanced Rollup / Minification Tuning in `vite.config.js`

If you want the maximum possible JS mangling without breaking runtime code:

```javascript
// vite.config.js
export default defineConfig({
  build: {
    target: 'es2022', // Modern JS outputs smaller bundles (avoids heavy polyfill helpers)
    cssCodeSplit: true,
    minify: 'terser', // Switch from esbuild to terser if willing to trade build speed for ~5-8% size
    terserOptions: {
      compress: {
        drop_console: true,     // Removes console.log in production
        drop_debugger: true,
        passes: 2,              // Multi-pass compression
        pure_funcs: ['console.info', 'console.debug']
      },
      format: {
        comments: false         // Remove all comment blocks
      }
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-preact')) return 'vendor-icons';
            if (id.includes('gsap') || id.includes('lenis')) return 'vendor-animations';
            if (id.includes('@supabase')) return 'vendor-supabase';
          }
        }
      }
    }
  }
});
```

---

### E. Cloudflare Performance Settings Verification

In your Cloudflare Dashboard (Speed / Optimization):
1. **Brotli**: Verify enabled (default: ON).
2. **Early Hints**: Enable (allows preloading fonts and critical chunks while HTML is processed).
3. **Auto Minify**: Can be kept active for HTML.
4. **Cache Rules**: Ensure static chunks (`/assets/*.js`, `/assets/*.css`) have long `Cache-Control: public, max-age=31536000, immutable` headers.

---

## 4. Verification & Audit Commands

Run bundle inspection and tests after applying these changes:
```bash
# 1. Inspect bundle distribution & chunk sizes
npx vite-bundle-visualizer

# 2. Run standard tests to guarantee no regressions
npm run test

# 3. Check mobile performance audit
npm run audit:mobile
```
