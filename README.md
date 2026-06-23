# ClimaMedix (كلايما ميدكس) 🌍🩺

An educational and community platform for Climate & Health in the Arab region. ClimaMedix is designed as a fast-loading, mobile-responsive Progressive Web Application (PWA) with full right-to-left (RTL) Arabic support (default) and left-to-right (LTR) English support.

---

## 📋 Platform Development Todo List

This checklist tracks the current state of implementation, completed features, recent updates, and upcoming development goals.

### 🛠️ Core Infrastructure & Layout
*   [x] **Custom Design System:** Harmonious HSL/RGB palettes, dark mode tokens, and glassmorphism.
*   [x] **Clean Routing:** Zero-hash path-based routing (`/`, `/about-us`, `/auth`, `/debug`).
*   [x] **Mobile Optimization:** Full responsive layout adjustments, viewport scalability, and drawer navigation.
*   [x] **Direction & Fonts Override:** Full RTL structure by default with automatic font overrides (`Tajawal` forced globally).

### 🔐 Authentication Feature (Supabase)
*   [x] **Supabase Auth Integration:** Email authentication (Login/Sign Up) and OAuth (Google) support.
*   [x] **Visual Polish & Spacing:** Balanced header clearance padding adjusted to `180px` on desktop and `135px` on mobile (clearing the fixed navigation bar cleanly).
*   [x] **Password Visibility Toggle:** Interactive show/hide action for form credentials.
*   [x] **Interactive Particles Background (`InteractiveParticles.jsx`):**
    *   [x] **Mitchell's Best-Candidate Spawning:** Particle spawns are mathematically placed in the emptiest regions of the canvas, avoiding edge areas to prevent sudden boundary recycling.
    *   [x] **Center Gravity Pull:** A subtle center-seeking gravity force (`0.00012` per frame) gently drifts free particles inward to keep the network layout cohesive.
    *   [x] **Fluid Physics:** Mouse attraction, heavy viscosity damping (15% frame deceleration on proximity), and Brownian cluster agitation.

### 🏠 Home Page Sections
*   [x] **Hero Section:** Logo integration, responsive title text grid, and main call to actions.
*   [x] **About Intro:** Glassmorphic card summarizing the ClimaMedix mission.
*   [x] **Vision & Mission:** Split card grid detailing organizational values.
*   [x] **Research Showcase:** Cards grid highlighting regional studies, completion progress bars, and modal controls.
*   [x] **Training Courses:** Category indicators, enrollment rates, and interactive CTA buttons.
*   [x] **Upcoming Section:** Schedule layout displaying future research programs.
*   [x] **Newsletter Banner:** Embedded subscription block.

### 🗺️ Community & Map Widget
*   [x] **Concept 32 Map Widget:** Upgraded default map widget to high-performance Mapbox GL JS.
*   [x] **Custom Styling:** Solid dark green landmass rendering (`#004c6d`) paired with crisp white ocean surfaces.
*   [x] **Palestine Label Overlay:** Custom overlay placing Palestine prominently on the region map.
*   *   [x] **Regional Exclusion Masking:** Dynamic boundary masks to hide default country labels.
*   *   [x] **JSON Theme Simulator:** Live state controller allowing color modifications on the fly.

### 🎓 Learning Hub (LMS)
*   [x] **Concept 31 Geometric Course Carousel:** Swipeable cards carousel featuring custom arrow alignments.
*   [ ] **Video Streaming Integration:** Secure video playback with presigned URL authorization.
*   [ ] **PDF Resources:** Secure asset downloader.
*   [ ] **User Dashboard:** Progress counters, completed courses, and quiz records.

### 🧪 Research Center & Opportunities
*   [ ] **Publications abstract registry:** Searchable table of academic documents.
*   [ ] **Opportunities Directory:** Grants, fellowships, and scholarships database.
*   [ ] **Recruitment forms:** Team registration inputs.

### 🛠️ Live Debug & Admin Panel
*   [x] **Concept 32 Theme Configurator:** Real-time color picker interface linking directly to Mapbox layer styles.
*   [ ] **CRUD interfaces:** Admin database loaders for events, opportunities, and courses.

---

## 🛠️ Technology Stack

*   **Frontend:** Preact, Vite (for super-fast loading and minimal bundle size)
*   **Styling:** Vanilla CSS (custom design system)
*   **PWA Support:** Service workers for offline capabilities and installation
*   **Proposed Backend:** 
    *   **Supabase:** Authentication, relational Database (PostgreSQL), and serverless Edge Functions.
    *   **Cloudflare R2:** S3-compatible object storage with **zero egress fees** (ideal for video lessons and PDF resources).

---

## 📂 Folder & Feature Structure

```
src/
├── assets/             # Global media assets, icons, SVGs
├── components/         # Shared global UI components (Buttons, Cards, Header, Footer)
├── context/            # Global context providers (Theme, Auth, Language)
├── i18n/               # Translation dictionaries (Arabic/English)
├── utils/              # Utility helper functions
└── features/           # Feature-specific modules
    ├── main/           # Home Page sections
    ├── about-us/       # Vision, Mission, Core Values, Team, Partners
    ├── programs/       # VSCHEF Fellowship, Climate Health Academy, etc.
    ├── learning-hub/   # LMS: Course categories, lessons, quizzes, certificates
    ├── research-center/# Projects, publications, database registry
    ├── opportunities/  # Fellowships, scholarships, conferences, grants
    ├── community/      # Ambassadors network, interactive Arab countries map
    ├── events/         # Event calendars and registration links
    ├── news-blog/      # Articles, announcements, categorizations
    ├── contact-us/     # Contact forms and social directories
    ├── admin/          # Admin CRUD panels for courses, users, and events
    └── auth/           # Login, registration, student profile tracking
```

---

## 🔒 Storage & Video Streaming Architecture (Supabase + Cloudflare R2)

To keep egress bandwidth costs at **$0**, the platform integrates Cloudflare R2 for file storage alongside Supabase for user session validation:

1.  **Private R2 Bucket:** Videos and PDF resources are stored in a private Cloudflare R2 bucket.
2.  **Authentication & Verification:** When a student requests to watch a lesson, the request passes through a Supabase Edge Function or Cloudflare Worker.
3.  **Enrollment Check:** The function queries the Supabase database to verify if the user is authenticated and enrolled in the course.
4.  **Presigned URL:** If verified, the worker generates a short-lived (e.g., 15 minutes), read-only presigned URL for the video/PDF.
5.  **Stream:** The client receives the presigned URL and streams/downloads the file directly from Cloudflare R2.
