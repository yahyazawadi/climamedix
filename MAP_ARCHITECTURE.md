# ClimaMedix Regional Network Map — Architecture & Workflow

## Overview & Rationale

Originally, the home page rendered a live **Mapbox GL JS** canvas. While interactive, it caused significant client-side overhead:
- **RAM Consumption:** ~140 MB to 180 MB per session due to WebGL context allocation, vector tile decoding, and continuous GPU rendering.
- **PWA Performance Impact:** On lower-end mobile devices and slower cellular connections, loading full Mapbox GL JS scripts (~600 KB parsed) alongside map styles degraded performance.
- **Home Map Purpose:** The homepage regional map is purely presentational (decorative network visualization with city pulse dots and traveling dashed connections). Full drag/pan/zoom interactivity is neither needed nor enabled.

To achieve maximum performance and lightweight PWA compliance, the map was replaced with a **hybrid static render architecture**:
1. **Pre-rendered Base Map:** High-DPI (@2x retina) WebP screenshots of the styled Mapbox base map.
2. **Dynamic SVG Overlay:** Mathematically projected Web Mercator SVG layer with animated traveling dashed lines, glowing nodes, and staggered pulse rings.
3. **RAM Footprint:** Reduced to **~3.5 MB JS heap memory** (a ~97% reduction), eliminating WebGL GPU contexts entirely on the homepage.

---

## File Structure & Roles

| File Path | Description |
|---|---|
| [`src/features/main/components/ArabWorldMapSVG.jsx`](src/features/main/components/ArabWorldMapSVG.jsx) | **Active Home Component.** Renders the `<picture>` tag (desktop vs mobile WebP) and the responsive SVG mathematical overlay with animations. |
| [`src/features/main/components/ArabWorldMap.mapbox.jsx`](src/features/main/components/ArabWorldMap.mapbox.jsx) | **Interactive Backup.** Retains the original full Mapbox GL JS implementation for easy reference or restoration if interactive requirements ever return. |
| [`src/assets/arab_world_map_desktop.webp`](src/assets/arab_world_map_desktop.webp) | 2x retina desktop base image (1440×700 px base coordinate space). |
| [`src/assets/arab_world_map_mobile.webp`](src/assets/arab_world_map_mobile.webp) | 2x retina mobile base image (390×240 px base coordinate space). |
| `scripts/capture_map.cjs` | Local Node.js + Playwright utility script to capture clean Mapbox base maps into WebP assets (gitignored to protect tokens). |

---

## Technical Mechanics

### 1. Web Mercator Projection Math
To ensure that SVG coordinates dynamically match the pre-rendered image regardless of resolution or aspect ratio, `ArabWorldMapSVG.jsx` implements standard EPSG:3857 Web Mercator projection:

```javascript
const TILE_SIZE = 512;

function lngLatToWorld(lng, lat) {
  const x = (lng + 180) / 360;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y = 0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI);
  return [x, y];
}

function worldToPixel(worldX, worldY, centerLng, centerLat, zoom, viewW, viewH) {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const [cx, cy] = lngLatToWorld(centerLng, centerLat);
  const px = (worldX - cx) * scale + viewW / 2;
  const py = (worldY - cy) * scale + viewH / 2;
  return [px, py];
}
```

Whenever the center or zoom changes in `capture_map.cjs`, the corresponding constants in `ArabWorldMapSVG.jsx` must match:
- **Desktop:** `centerLng: 22.5`, `centerLat: 26.0`, `zoom: 3.8`, `w: 1440`, `h: 700`
- **Mobile:** `centerLng: 21.5`, `centerLat: 23.0`, `zoom: 1.85`, `w: 390`, `h: 240`

### 2. Camera Framing & Westward Center
- **Why shifted west?** Standard MEA coordinates centered at 38° E cut off Morocco and Western Sahara on the west while including India/Pakistan on the east.
- By centering at `~22° E`, the map spans from Morocco/Western Sahara in the west through to Oman/UAE in the east, capturing the complete Arab World without eastern spillover.

### 3. Visual Styling & Animations
- **Connection Lines:** SVG `<line>` elements with `stroke: #4dff82; stroke-dasharray: 12 10; stroke-opacity: 0.45;` animated via continuous CSS `stroke-dashoffset` linear transition (3.2s cycle).
- **Nodes:** Solid white circles (`#ffffff`) with emerald borders (`#2FAD78`) and `feDropShadow` filter for an emerald ambient glow (`#4dff82`).
- **Pulse Rings:** Outer `<circle>` elements animated with staggered SMIL `<animate>` tags expanding from 6px to 20px with fading opacity.

---

## How to Recapture or Update Maps

If styling, colors, or base boundaries change:
1. Ensure dependencies (`playwright-core` and local Google Chrome) are available.
2. Edit `scripts/capture_map.cjs` with updated theme tokens or viewport configurations.
3. Run:
   ```bash
   node scripts/capture_map.cjs
   ```
4. Verify asset outputs in `src/assets/`.
5. Update `DESKTOP` or `MOBILE` config objects in `src/features/main/components/ArabWorldMapSVG.jsx` to match the capture settings.
6. Verify locally in browser at desktop and mobile breakpoints.
