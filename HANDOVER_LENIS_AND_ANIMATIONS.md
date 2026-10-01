# Handover & Master Plan: Luxury Pinned Side-Scroll, Lenis Inertia & Scroll Experiences

**Date**: 2026-10-01  
**Repository**: `yahyazawadi/climamedix` (`c:\Users\CLICK\Desktop\climamedix-pwa`)  
**Design Target**: Ultra-Premium / Award-Winning (Awwwards / Apple-grade)  

---

## 1. Status Update & Completed Items
- [x] **ClimaMedix Brand Loading Spinner**: `LoadingPlanet.jsx` + `LoadingPlanet.css` integrated and tested.
- [x] **Loading Planet Color Inversion**: Resolved (Continents / Ocean fill geometry verified and matched).
- [x] **Mobile Scroll & Render Throttling**: Scroll spy throttled with `window.requestAnimationFrame` and passive listeners.

---

## 2. Feature Specification: Pinned Horizontal Side-Scroll ("Scroll to the Side")

### What It Is
When the user scrolls vertically down the page and enters this section, the viewport **pins seamlessly in place** (`position: sticky; top: 0; height: 100vh;`).  
As the user continues their vertical scroll (trackpad or mouse wheel), the container **smoothly translates horizontally to the side**, unveiling luxury interactive cards across the screen. Once the horizontal carousel finishes sliding, vertical page scrolling naturally unpins and resumes downward to the next section.

### Showcase Subject: "Strategic Pillars of Climate Medicine in the Arab World"
To feel truly premium and authoritative, this section will showcase the **5 Flagship Impact Pillars of ClimaMedix**:
1. **01 / Extreme Heat & Cardiovascular Resilience** (مقاومة الإجهاد الحراري وصحة القلب والأوعية)  
   *Visual*: Deep solar amber & teal gradient card, thermal stress metrics, clinical protocols.
2. **02 / Dust Storms & Respiratory Precision Health** (العواصف الغبارية وطب الجهاز التنفسي الدقيق)  
   *Visual*: Atmospheric mist effect, real-time AQI tracking, particulate matter research cards.
3. **03 / Vector-Borne Epidemiology & Flood Surveillance** (الأمراض المنقولة بالنواقل والرصد الوبائي)  
   *Visual*: Bioluminescent geospatial data nodes, regional early-warning alert systems.
4. **04 / Green & Decarbonized Healthcare Facilities** (المنشآت الصحية الخضراء وإزالة الكربون الطبي)  
   *Visual*: Emerald glassmorphic architecture, renewable hospital energy metrics.
5. **05 / Arab Physician Leadership & Climate Curriculum** (تمكين القيادات الطبية وأكاديمية طب المناخ)  
   *Visual*: Royal sapphire glass, Arab medical board accredited credentials, fellowship badges.

---

## 3. Engineering Architecture & Mechanics

### A. The Pure-CSS Sticky Pin + GPU Transform Pipeline
No heavy third-party carousel libraries needed. We leverage pure GPU-accelerated transforms (`translate3d`) driven by scroll progress:

```
┌─────────────────────────────────────────────────────────────┐
│ Outer Container (.horizontal-scroll-container)             │
│ height: 350vh (Provides vertical scroll track & friction)   │
│                                                             │
│   ┌───────────────────────────────────────────────────────┐ │
│   │ Sticky Viewport (.horizontal-scroll-sticky)           │ │
│   │ position: sticky; top: 0; height: 100vh;              │ │
│   │ overflow: hidden; display: flex; align-items: center; │ │
│   │                                                       │ │
│   │   ┌── Progress Header (Sticky Title + 01/05 Counter) ┐│ │
│   │   │                                                  ││ │
│   │   ├── Horizontal Track (.horizontal-scroll-track) ───┤│ │
│   │   │   [ Card 01 ] ── [ Card 02 ] ── [ Card 03 ] ... ││ │
│   │   │   will-change: transform; translate3d(x, 0, 0)   ││ │
│   │   │                                                  ││ │
│   │   └── Glowing Progress Scrub Rail (Bottom) ──────────┘│ │
│   └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### B. Mathematical Scroll Calculation & RTL Normalization
```javascript
// Calculate progress strictly between 0 and 1
const containerRect = containerRef.current.getBoundingClientRect();
const windowHeight = window.innerHeight;
const totalScrollableDistance = containerRect.height - windowHeight;
const currentScrolled = -containerRect.top;

// Clamp progress [0, 1]
const progress = Math.max(0, Math.min(1, currentScrolled / totalScrollableDistance));

// Calculate horizontal travel distance
const track = trackRef.current;
const maxHorizontalShift = track.scrollWidth - window.innerWidth + (window.innerWidth * 0.16);

// Handle RTL vs LTR:
// In Arabic (RTL), shift moves positively or smoothly with direction:
const isRTL = document.documentElement.getAttribute('dir') === 'rtl';
const shiftX = isRTL ? (progress * maxHorizontalShift) : -(progress * maxHorizontalShift);

track.style.transform = `translate3d(${shiftX}px, 0, 0)`;
```

### C. Desktop Lenis Integration for Buttery Inertia
When Lenis is active on desktop, we bind the horizontal update directly to `lenis.on('scroll')`. This provides silky, weighted deceleration curves that make the cards feel like floating luxury glass panels.

---

## 4. UI/UX Design System for the Cards (Luxury Aesthetics)

| Element | Specification |
| :--- | :--- |
| **Card Dimensions** | Desktop: `min-width: 480px`, `max-width: 540px`, `height: 520px` |
| **Glassmorphism** | `backdrop-filter: blur(24px); background: linear-gradient(145deg, rgba(255,255,255,0.75), rgba(240,248,255,0.45));` (Dark mode: deep obsidian glass) |
| **Border Glow** | `border: 1px solid rgba(255,255,255,0.8); box-shadow: 0 20px 50px -10px rgba(11, 40, 73, 0.12);` |
| **Micro-Interactions** | Card scale `1.02` on hover, floating ambient colored glow behind active slide, magnetic "استكشف المبادرة" pill button |
| **Scrub Rail** | Slim 3px glowing accent line at the bottom with a pulsing indicator bead reflecting exact scroll percentage |

---

## 5. Mobile & Responsive Adaptation (Zero Scroll-Traps)

- **Mobile Viewports (< 992px or Touch Pointers)**:
  - Sticky-scroll hijacking on touch screens can frustrate mobile users if not tuned properly.
  - **Graceful Switch**: On touch devices, the container automatically transitions from `height: 350vh` to native height (`auto`), and the track becomes a smooth **CSS Scroll-Snap Carousel** (`overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;`).
  - Cards snap cleanly into place with finger swipes, accompanied by interactive slide dots and a subtle "اسحب لليسار / Swipe to explore" hint pill.
  - Zero performance overhead, zero touch lag, and 100% native momentum.

---

## 6. Implementation Step-by-Step Plan

1. **Step 1: Install Lenis**  
   - Install `lenis` via npm (`npm i lenis`).
   - Create a clean initialization module `src/features/shared/hooks/useLenisScroll.js` that activates strictly for desktop pointers (`!window.matchMedia('(pointer: coarse)').matches && window.innerWidth >= 1024`).

2. **Step 2: Build the Component `HorizontalShowcaseSection.jsx` & `HorizontalShowcaseSection.css`**  
   - Create `src/features/main/components/HorizontalShowcaseSection.jsx`.
   - Implement the sticky container, sliding track, dynamic card data (with bilingual AR/EN support), progress indicator, and RTL-safe matrix transforms.
   - Include ambient background glow orbs with parallax translation.

3. **Step 3: Integrate into `HomePage.jsx`**  
   - Insert the section into `PAGE_LAYOUT` (ideally between the Hero/Slider and Training/Research, or as a flagship highlight section).
   - Add scroll spy anchor (`id="pillars"` or `id="initiatives"`) so navigation in the header highlights accurately.

4. **Step 4: Polish & Performance Verification**  
   - Test 120 FPS render performance on desktop with smooth trackpad and wheel scrolling.
   - Verify mobile touch swipe fallback on phone viewports (ensuring no vertical scroll lock or jitter).
   - Test RTL/LTR toggle to ensure transforms flip directions seamlessly.

---

## 7. Key Files Reference
- `src/features/main/components/HorizontalShowcaseSection.jsx` (New component to build)
- `src/features/main/components/HorizontalShowcaseSection.css` (Luxury styling & animations)
- `src/features/shared/hooks/useLenisScroll.js` (Desktop smooth scroll controller)
- `src/features/main/components/HomePage.jsx` (Integration into page layout)
- `src/app.jsx` (Global scroll and theme context)
