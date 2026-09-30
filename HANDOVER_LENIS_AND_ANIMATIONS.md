# Handover & Next Steps: Lenis Smooth Scrolling, Scroll Animations & Performance

**Date**: 2026-10-01  
**Repository**: `yahyazawadi/climamedix` (`c:\Users\CLICK\Desktop\climamedix-pwa`)  
**Current Git Commit**: `452446a` (Committed locally on `main`, NOT pushed to remote)

---

## 1. What Was Just Completed
1. **ClimaMedix Brand Loading Spinner**:
   - Created [LoadingPlanet.jsx](file:///c:/Users/CLICK/Desktop/climamedix-pwa/src/features/shared/components/LoadingPlanet.jsx) and [LoadingPlanet.css](file:///c:/Users/CLICK/Desktop/climamedix-pwa/src/features/shared/components/LoadingPlanet.css).
   - Created standalone previewable SVG [climamedix_planet_loader.svg](file:///c:/Users/CLICK/Desktop/climamedix-pwa/src/assets/climamedix_planet_loader.svg).
   - Integrated into [app.jsx](file:///c:/Users/CLICK/Desktop/climamedix-pwa/src/app.jsx) on initial load with auto-dissolve and graceful unmount.
2. **Mobile Scroll & Render Bug Fix**:
   - Throttled the continuous layout-thrashing scroll spy in [app.jsx](file:///c:/Users/CLICK/Desktop/climamedix-pwa/src/app.jsx#L62-L87) using `window.requestAnimationFrame` and passive listeners.
   - Verified that all 10 page sections render down to 6,278px of content on mobile.

---

## 2. Immediate Quick Fix to Start With Next Session
- **Loading Planet Color Inversion**:
  - The SVG paths currently have:
    - Path 0 (`OCEAN_PATH` disc): Filled with `#cmOceanGrad` (Blue)
    - Path 1 & 2 (`CONTINENTS_PATH`): Filled with `#cmLandGrad` (Green)
  - Because the original icon geometry has continent cutouts reversed (the continents are the disc background and the ocean cutout is the top layer), the colors look inverted in the screenshot!
  - **Fix**: Swap the fill IDs in [LoadingPlanet.jsx](file:///c:/Users/CLICK/Desktop/climamedix-pwa/src/features/shared/components/LoadingPlanet.jsx#L182-L198) and [climamedix_planet_loader.svg](file:///c:/Users/CLICK/Desktop/climamedix-pwa/src/assets/climamedix_planet_loader.svg):
    - Set `OCEAN_PATH` to green or blue according to the true map geometry so continents are green and oceans are blue.

---

## 3. Plan: Lenis (Desktop Only) & Scroll Animations

### A. Lenis Setup (Strictly Desktop-Only)
- **Goal**: Give desktop trackpads & mouse wheels luxury inertia and smooth acceleration without touching native mobile touch physics.
- **Dependency**: `npm i lenis`
- **Implementation**:
  ```javascript
  // Only initialize when pointer is fine (mouse/trackpad) and screen >= 768px
  const isTouch = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
  if (!isTouch) {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false // Never hijack mobile touch
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }
  ```
- **Navigation reset**: Call `lenis.scrollTo(0, { immediate: true })` on route change.

### B. Scroll-Triggered Progressive Reveal (Mobile-Friendly)
- **Goal**: Only animate and reveal sections when the user scrolls near them, preventing initial paint lag on phones.
- **Technique 1**: Add CSS `content-visibility: auto; contain-intrinsic-size: auto 500px;` to heavy off-screen sections (News, Training, Research, Activities).
- **Technique 2**: Use an `IntersectionObserver` to trigger `.is-visible` CSS animations (fading in cards, drawing connection lines) only when a section scrolls into view.

### C. ArabWorldMapSVG Optimization on Mobile
- In [ArabWorldMapSVG.jsx](file:///c:/Users/CLICK/Desktop/climamedix-pwa/src/features/main/components/ArabWorldMapSVG.jsx), pause or simplify traveling dash animations (`.network-traveling-line`) and remove `feDropShadow` filter on small screens to ensure solid 60/120 FPS on all mobile devices.

---

## 4. Key Files Reference
- [src/app.jsx](file:///c:/Users/CLICK/Desktop/climamedix-pwa/src/app.jsx) — App root, routing & loader
- [src/features/shared/components/LoadingPlanet.jsx](file:///c:/Users/CLICK/Desktop/climamedix-pwa/src/features/shared/components/LoadingPlanet.jsx) — Brand loader component
- [src/features/shared/components/LoadingPlanet.css](file:///c:/Users/CLICK/Desktop/climamedix-pwa/src/features/shared/components/LoadingPlanet.css) — Loader styles
- [src/features/main/components/ArabWorldMapSVG.jsx](file:///c:/Users/CLICK/Desktop/climamedix-pwa/src/features/main/components/ArabWorldMapSVG.jsx) — Map component
- [src/index.css](file:///c:/Users/CLICK/Desktop/climamedix-pwa/src/index.css) & [src/app.css](file:///c:/Users/CLICK/Desktop/climamedix-pwa/src/app.css) — Global styles
