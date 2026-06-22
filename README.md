# ClimaMedix (كليما ميديكس)

An educational and community platform for Climate & Health in the Arab region. ClimaMedix is designed as a fast-loading, mobile-responsive Progressive Web Application (PWA) with full right-to-left (RTL) Arabic support (default) and left-to-right (LTR) English support.

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

We organize the codebase using a **feature-based folder structure** under `src/features/`. Each feature contains its respective `components/`, `hooks/`, and `services/` to keep imports modular and highly scalable.

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

## 📋 Platform Specifications & Requirements

### 1. Home Page
*   **Hero Banner:** Main title, short description, and Call-to-Actions (Explore Programs, Join Community).
*   **About ClimaMedix:** Short overview.
*   **Impact Statistics:** Learners count, participating countries, courses, and active projects.
*   **Featured sections:** Latest opportunities, partners, and contact info.

### 2. About Us
*   **Sub-pages / Sections:** Our Story, Vision, Mission, Core Values, Team Members, and Partners.

### 3. Programs
*   **Dynamic Program pages:** Title, Cover Image, Description, Objectives, Duration, Eligibility, and Apply Button.
*   *Examples:* VSCHEF Fellowship, Climate Health Academy, Research Program.

### 4. Learning Hub (LMS)
*   **Course Features:** Categories, Video Lessons (streamed securely), PDF Resources, Quizzes, Progress Tracking, and Certificates.
*   **User Dashboard:** Enrolled courses, completed courses, certificates achieved, and quiz results.

### 5. Research Center
*   **Sections:** Research Projects, Publications (Title, Authors, Abstract, PDF Download), Database, and Apply to Join Research Team.

### 6. Opportunities
*   **Admin-published entries:** Fellowships, Scholarships, Internships, Conferences, and Grants (with description, eligibility, deadline, and application links).

### 7. Community
*   **Sections:** Fellows Network, Ambassadors, Country Representatives.
*   **Visual Map:** Interactive map showing participating Arab countries.

### 8. Events
*   **View:** Calendar View of all upcoming and past events.
*   **Details:** Event Title, Date, Description, and Registration Link.

### 9. News & Blog
*   **Admin-published entries:** Articles, Announcements, News.
*   **Categories:** Climate Health, Research, Opportunities, Events.

### 10. Contact Us
*   **Features:** Contact form, official email, and social media directories.

### 11. Admin Panel
*   **Actions:** Create/Edit/Delete Courses, upload lesson videos/resources, manage certificates, publish opportunities/events/news, and view analytics.

### 12. User Accounts
*   **Actions:** Registration/Login, course enrollment, taking quizzes, downloading certificates, and tracking learning progress.
---

## 🚀 Advanced PWA Features & Planned Enhancements

To deliver a top-tier experience across various network conditions in the Arab region, the platform will implement:

### 13. Offline-First Capability & Background Sync
*   **Service Worker Caching:** Caches core shell assets, translation files, and course metadata via Workbox.
*   **Background Sync API:** Automatically queues quiz answers and contact form submissions when offline, and synchronizes them to Supabase as soon as the device regains connectivity.

### 14. Regional i18n & Automatic Direction Layouts
*   **Unified Context:** Switches language key-value pairs between Arabic (default) and English.
*   **CSS Direction Swap:** Automatically applies `dir="rtl"` or `dir="ltr"` on the root layout with adjustments to flex layouts, spacing parameters, and GSAP transition vectors.

### 15. Healthcare Facility Carbon Calculator
*   **Action:** A simple tool for Arab medical clinics to estimate their greenhouse gas emissions based on grid electricity consumption, medical waste generation, and inhalational anesthetic usage.
*   **Results:** Displays clean comparative charts showing pathways to net-zero healthcare.

### 16. Web Push Notifications
*   **Notifications:** Broadcasts alerts for upcoming webinars, course enrollments, certificate signature updates, and new fellowship calls.

### 17. Client-side PDF Certificate Compiler
*   **Action:** Uses client-side libraries to dynamically generate secure, print-ready PDF certificates with verification QR codes without invoking backend computational assets.

---

## 🔒 Storage & Video Streaming Architecture (Supabase + Cloudflare R2)

To keep egress bandwidth costs at **$0**, the platform integrates Cloudflare R2 for file storage alongside Supabase for user session validation:

1.  **Private R2 Bucket:** Videos and PDF resources are stored in a private Cloudflare R2 bucket.
2.  **Authentication & Verification:** When a student requests to watch a lesson, the request passes through a Supabase Edge Function or Cloudflare Worker.
3.  **Enrollment Check:** The function queries the Supabase database to verify if the user is authenticated and enrolled in the course.
4.  **Presigned URL:** If verified, the worker generates a short-lived (e.g., 15 minutes), read-only presigned URL for the video/PDF.
5.  **Stream:** The client receives the presigned URL and streams/downloads the file directly from Cloudflare R2.
