# 📋 ClimaMedix Manual Testing Checklist & Progress Tracker

> **Application URL:** [http://localhost:9090](http://localhost:9090)  
> **Tester Instructions:** Use this document to track your page-by-page manual inspection. Check off boxes (`[x]`) as you test, and log any findings, glitches, or visual bugs in the notes section of each page.

---

## 📊 Testing Progress Overview

- [ ] **1. Public & Core Visitor Pages** (3/5 Completed)
- [x] **2. Content Hubs & Community Pages** (4/4 Completed: News, Article Reader, Opportunities, Events)
- [ ] **3. Learning Hub (LMS) & Research Center** (0/3 Completed)
- [ ] **4. User Account & Contributor Authoring Portals** (0/3 Completed)
- [ ] **5. Administration & Management Portals** (0/5 Completed)
- [ ] **6. Developer & Debug Tooling** (0/1 Completed)

---

## 🌐 1. Public & Core Visitor Pages

### Page 1: Home Page
- **URL:** [http://localhost:9090/](http://localhost:9090/) *(or `/home`, `/index`, `/main`)*
- **Access Level:** Public (All visitors & guests)
- **Checklist:**
  - [ ] **Hero Slider Autoplay:** Slides advance smoothly every 7 seconds.
  - [ ] **Hero Slider Controls:** Next/Prev arrows and dot pagination bullets work seamlessly.
  - [ ] **Hero Slider CTA Button:** "انضم للدورة التدريبية" / "Join the Course" forwards directly to the selected material.
  - [ ] **Language Switcher (AR/EN):** Header toggle flips writing direction (RTL ⇄ LTR) and translates all headings without clipping.
  - [ ] **Latest News Widget:** Article cards render cover images, titles, and tags without broken layouts.
  - [ ] **Publications Preview:** Research list loads properly with PDF/format badges.
  - [ ] **Calendar Drawer:** Floating/sidebar calendar widget toggles open/close smoothly without horizontal scroll leak.
  - [ ] **Community & CTA:** "انضم لفريق البحث" button navigates directly to `/join`.
  - [ ] **Navbar Anchor Scrolling:** Clicking `#about`, `#research`, `#community` scrolls smoothly to each section.
- **Notes / Bugs Found:**
  - 

---

### Page 2: About Us
- **URL:** [http://localhost:9090/about](http://localhost:9090/about) *(or `/about-us`, `/info`)*
- **Access Level:** Public (All)
- **Checklist:**
  - [x] **Mission, Vision & Core Values:** Cards render with clean glassmorphic borders and legible typography.
  - [x] **Team Members Grid:** Avatars, roles, and bios display correctly.
  - [x] **Strategic Partners Grid:** Partner logos render without distortion.
  - [x] **Join Team CTA:** Action button triggers navigation to `/join`.
- **Notes / Bugs Found:**
  - Mobile layout was broken due to SVG background clipping and conflicting CSS. Replaced SVG with ambient CSS gradient, added glassmorphic section cards, removed all shadows, fixed RTL/LTR accent bar and checklist direction bugs, and removed conflicting duplicate `.au-container` override.

---

### Page 3: Login / Authentication
- **URL:** [http://localhost:9090/login](http://localhost:9090/login) *(or `/auth`, `/signin`)*
- **Access Level:** Public / Guests
- **Checklist:**
  - [x] **Primary Route & Aliases:** Canonical URL `/login` works seamlessly alongside `/auth`, `/signin`, and `/register`.
  - [x] **Google OAuth Button:** "Sign in with Google" / "تسجيل الدخول عبر Google" triggers popup/redirect.
  - [x] **Loading Spinner State:** Displays feedback while session initializes.
  - [x] **Already Logged In:** If already authenticated, redirects directly to `/home`.
  - [x] **Bilingual Messaging:** Security badges, benefit bullet points, and disclaimer translate cleanly in AR/EN.
- **Notes / Bugs Found:**
  - Verified route mapping: canonical route updated to `/login` with full backwards compatibility for `/auth`.
  - Passed visual & functional inspection.

---

### Page 4: Join Us / Membership Application
- **URL:** [http://localhost:9090/join](http://localhost:9090/join) *(or `/apply`, `/membership`)*
- **Access Level:** Public / Registered Users
- **Checklist:**
  - [x] **Track Selector:** Switching between "Researcher" (باحث) and "Educator" (مدرب/ناشط) updates dynamic sub-fields.
  - [x] **Form Validation:** Submitting empty required fields triggers localized validation alerts.
  - [x] **CV File Upload:** Drag-and-drop or file picker accepts PDF and DOCX files.
  - [x] **File Size Indicator:** Shows selected file name and size in MB.
  - [x] **Remove / Replace CV:** Remove button deselects file without bubbling or reopening file chooser.
  - [x] **Submission State:** Button disables, displays spinner and "جاري إرسال طلبك..." until complete.
  - [x] **Success Banner:** Localized confirmation banner displays upon successful submission.
- **Notes / Bugs Found:**
  - Verified visual rendering on desktop and mobile.
  - Track cards icons updated to bold Lucide icons (`Microscope` & `Stethoscope`) with header-matched mint green color `#15b47a` and stroke width.
  - Bottom footer CTA ("انضم إلينا في رحلتنا... / انضم الآن") conditionally hidden when visiting `/join` to prevent redundant CTA.
  - Subfooter bottom boundary gap fixed for mobile viewport.

---

### Page 5: Certificate Verification
- **URL:** [http://localhost:9090/verify](http://localhost:9090/verify) *(or `/verify/:id`, `/certificate/:id`)*
- **Access Level:** Public (All)
- **Checklist:**
  - [ ] **Serial Input:** Search field accepts certificate serial ID.
  - [ ] **Validation Lookup:** Querying a valid ID renders student name, course title, and issuance date.
  - [ ] **Invalid ID Handling:** Querying non-existent serial displays clean "Invalid / Unverified" error banner.
  - [ ] **Canvas Certificate Rendering:** Generates certificate preview on high-resolution HTML5 canvas.
  - [ ] **PNG Export:** "تحميل الشهادة" downloads PNG with sanitized ASCII/Arabic filename.
- **Notes / Bugs Found:**
  - 

---

## 📰 2. Content Hubs & Community Pages

### Page 6: News & Climate Feed
- **URL:** [http://localhost:9090/news](http://localhost:9090/news) *(or `/blog`, `/feed`)*
- **Access Level:** Public (All)
- **Checklist:**
  - [x] **Article Grid:** Cards render thumbnails, publication dates, and category tags.
  - [x] **Category Filter Chips:** Dynamically generated from available articles; filters grid smoothly with GSAP animation.
  - [x] **Search Bar:** Real-time query filtering for title, summary, and author with clear (X) button; RTL-aware padding prevents collision with right-aligned magnifying glass.
  - [x] **Geospatial News Map View:** Toggling to "Map View" renders interactive node pins and severity radius circles.
- **Notes / Bugs Found:**
  - Replaced hardcoded category tags with dynamic category chip derivation from active articles.
  - Categories are ordered descending by number of articles and capped at 4 maximum; if more categories exist, a 5th "أخرى" / "Other" filter chip is appended to group remaining categories. Empty categories with 0 articles are omitted from the filter bar, preventing dead ends.
  - Added bilingual category resolution (`KNOWN_CATEGORIES` & `categoriesMatch`) so custom or localized categories map accurately in both Arabic and English.
  - Added real-time search bar above category filters. Configured bidirectional layout: in RTL, magnifying glass is pinned right with `paddingRight: 46px` preventing collision; in LTR, icon is pinned left with `paddingLeft: 46px`.
  - Added instant clear (X) button and bilingual empty search state (`لا توجد مقالات تطابق بحثك حالياً`).
  - Fixed mobile responsive breakage: converted full-screen blocking drawer into a modern responsive bottom-sheet docked at `top: 38%` with rounded top corners and a dedicated close button.
  - Implemented auto-panning (`map.flyTo` with offset `[0, -100]`) so clicked nodes remain centered in the visible upper half of the viewport on mobile devices.
  - Fixed race condition where edit button flickered or disappeared during auth hydration by caching role in `sessionStorage` and evaluating admin metadata.
  - Replaced disappearing state with a sleek floating helper pill (`📍 انقر على الخريطة لتحديد الموقع`) when in Add Mode.
  - Isolated touch and click event propagation on the drawer container (`stopPropagation`) to prevent Mapbox canvas coordinate jumping.
  - Decoupled Mapbox DOM marker lifecycle from form keystrokes: updating radius/text now updates GeoJSON directly without tearing down and recreating DOM markers on every keystroke.
  - Synchronized Mapbox canvas resizing with drawer expansion via timed `map.resize()` calls.
  - Removed all `box-shadow` styles across custom map controls per design system guidelines. 

---

### Page 7: Article Reader
- **URL:** [http://localhost:9090/article?id=...](http://localhost:9090/article) *(or `/post`, `/read`)*
- **Access Level:** Public (All)
- **Checklist:**
  - [x] **Article Layout:** Headline, author card, publication date, and cover image render properly.
  - [x] **Rich Content:** Quill-formatted text, embedded videos, audio clips, and images load correctly.
  - [x] **View Counter:** Auto-increments view counter upon article opening.
  - [x] **Likes & Engagement:** Authenticated users can toggle like; guests receive prompt to sign in.
  - [x] **Author Edit Button:** "تعديل" appears ONLY for the author or users with `manage:any_article`.
  - [x] **Share Buttons:** Web Share API / Copy Link action works with feedback toast.
- **Notes / Bugs Found:**
  - Fixed raw `\n` escaping bug: seeded database records contained literal `\n\n` characters and raw Markdown syntax (`##`, `###`, `*`), which rendered as literal text strings instead of formatted paragraphs and headings inside the Quill HTML container.
  - Converted existing database articles (`news_articles`) to clean semantic HTML.
  - Created resilient formatting utility [`formatArticleContent`](file:///c:/Users/CLICK/Desktop/climamedix-pwa/src/utils/contentFormatter.js) to unescape literal `\n` sequences and automatically parse Markdown into semantic HTML elements (`<h2>`, `<h3>`, `<ul>`, `<ol>`, `<p>`) for any incoming articles.
  - Created [`extractSnippet`](file:///c:/Users/CLICK/Desktop/climamedix-pwa/src/utils/contentFormatter.js) utility used in `NewsPage` and `HomeNewsWidget` to strip Markdown markers and unescape newlines before generating card preview snippets.
  - Fixed text alignment and list direction (RTL): Quill Snow stylesheet defaults to `text-align: left` and forces left padding/negative margins on list elements (`.ql-editor ul li:not(.ql-direction-rtl)`). Added dynamic `dir={isRtl ? 'rtl' : 'ltr'}` and `ql-direction-rtl` class to the reader card, with scoped CSS enforcing `direction: rtl`, `text-align: right`, proper list indentation (`padding-inline-start: 1.8em`), and native right-aligned bullets (`•`).
  - Fixed like counter badge centering: The badge number "1" was previously pushed towards the top/left edge due to Arabic font metrics (`Tajawal`). Set font family to `'Outfit', system-ui, sans-serif`, added `direction: ltr`, and calibrated badge dimensions/padding to ensure mathematical and visual centering.
  - Aligned action buttons bar: Separated the Love icon (with like count) to the right (start) and grouped the share/utility icons (`[Edit]`, `[Copy Link]`, `[Share]`) to the left (end) using a full-width flex container (`justify-content: space-between`).
  - Removed redundant top "تعديل" (Edit) pill button next to `→ العودة للأخبار` since a dedicated edit icon button is integrated directly in the action bar.
  - Fixed top padding below fixed navbar: Increased `paddingTop` to `clamp(120px, 12vw, 140px)` so the back button row has 24px–44px clear breathing room and never tucks beneath the 96px fixed header.
  - Fixed background particles leaking over footer: Scoped `AmbientParticles` from a viewport `position: fixed` overlay to a container-scoped `position: absolute; inset: 0` element inside `overflow: hidden`, and set `.figma-footer` to `position: relative; z-index: 20` to guarantee complete separation.

---

### Page 8: Opportunities & Grants Hub
- **URL:** [http://localhost:9090/opportunities](http://localhost:9090/opportunities) *(or `/jobs`, `/grants`)*
- **Access Level:** Public (All)
- **Checklist:**
  - [x] **Category Filters:** Filter by Fellowship, Scholarship, Grant, Internship, or Conference.
  - [x] **Column-Masking Guard:** Unauthenticated guests see "سجل لعرض الرابط" (Sign in to Apply) instead of raw link.
  - [x] **Opportunity Modal:** Clicking card opens modal with full requirements, deadline, and eligibility.
  - [x] **External Apply Link:** Authenticated users see direct "Apply Now" button opening external URL in new tab.
- **Notes / Bugs Found:**
  - Fixed dead action button ("تقديم الطلب" / "Apply Now") on opportunity cards: links lacking protocol (e.g. `raw.example.com`) are automatically prepended with `https://` before opening in a secure new tab.
  - Built responsive [`OpportunityDetailModal`](file:///c:/Users/CLICK/Desktop/climamedix-pwa/src/features/opportunities/components/OpportunityDetailModal.jsx) inspired by the `/join` aesthetic (top mint-to-navy gradient accent, glassmorphic backdrop blur, responsive card sizing, and key info grid). Clicking any opportunity card opens the detail modal displaying full eligibility criteria, long description, deadline, and direct application action.
  - Integrated `onNavigate` prop from `AppRouter` down through `OpportunitiesPage`, `OpportunitiesGrid`, and `OpportunityCard`, replacing raw unhandled popstate events with seamless SPA routing to `/login` when unauthenticated users attempt to apply.
  - All 59 tests in opportunities test suite passing.

---

### Page 9: Events Calendar
- **URL:** [http://localhost:9090/events](http://localhost:9090/events) *(or `/calendar`, `/webinars`)*
- **Access Level:** Public (All)
- **Checklist:**
  - [x] **Calendar Grid:** Current month days render with event indicator dot markers.
  - [x] **Month Navigation:** Previous and Next buttons switch months seamlessly.
  - [x] **Event Selection:** Clicking an active day highlights matching events in the agenda list.
  - [x] **Event Detail Inspect:** Clicking event shows time, location/online link, speaker info, and RSVP action.
- **Notes / Bugs Found:**
  - Fixed mobile layout off-centering bug: on narrow screens and inside the mobile calendar sidebar drawer, the calendar month grid card (`.events-calendar-month-card`) was misaligned. Updated CSS grid minmax column constraint (`minmax(min(100%, 320px), 1fr))`, added responsive card max-width (`360px`) and `margin: 0 auto` with `justify-content: center` to ensure mathematical and visual centering.
  - Removed `transform: scale(0.95)` on `CalendarSidebarWidget` drawer content which caused content shift and clipping on small mobile viewports.
  - Centered view switcher header (`.events-calendar-header`) on mobile displays when toggle buttons wrap.


---

## 🎓 3. Learning Hub (LMS) & Research Center

### Page 10: Learning Hub & Student LMS
- **URL:** [http://localhost:9090/courses](http://localhost:9090/courses) *(or `/lms`, `/learning`, `/hub`)*
- **Access Level:** Registered Users *(Guest displays login prompt)*
- **Checklist:**
  - [ ] **Guest Guard:** Unauthenticated visitor sees "تسجيل الدخول مطلوب" prompt.
  - [ ] **Catalog Browsing:** Course cards display cover image, duration, category, and Free/Paid access badge.
  - [ ] **Course Auto-Open:** Navigating to `/courses?courseId=...` or `/courses/:id` automatically launches course modal.
  - [ ] **Unlocked Course (Proper Permission):** Full access user can browse syllabus, watch videos, read lessons, and mark complete.
  - [ ] **Locked Course (Improper Permission):** Shows "هذا المساق مغلق" / "This Course is Locked" banner with Upgrade CTA button.
  - [ ] **Interactive Quiz:** Students can take quizzes, submit answers, and receive instant pass/fail grading.
  - [ ] **Progress Persistence:** Enrolled courses track completion percentage (0–100%) in "تعلمي" (My Learning) tab.
  - [ ] **Certificate Claim:** Completing 100% of lessons unlocks "طلب الشهادة المعتمدة" submission form.
- **Notes / Bugs Found:**
  - 

---

### Page 11: Research Hub
- **URL:** [http://localhost:9090/research](http://localhost:9090/research) *(or `/publications`, `/papers`)*
- **Access Level:** Public / Users
- **Checklist:**
  - [ ] **Publications Directory:** Search bar and topic tags filter published papers.
  - [ ] **Format Badges:** PDF, Word, and PPT badges render accurately.
  - [ ] **Upload Button Visibility:** "+ أضف بحثاً" button appears ONLY for users with `write:research`.
  - [ ] **Teaser vs Full Access:** Abstract displays for all; download link enforces permission checks.
- **Notes / Bugs Found:**
  - 

---

### Page 12: Research Detail
- **URL:** [http://localhost:9090/research-detail?id=...](http://localhost:9090/research-detail) *(or `/paper`)*
- **Access Level:** Public / Users
- **Checklist:**
  - [ ] **Publication Metadata:** Title, authors, abstract, publication date, and citation DOI render clearly.
  - [ ] **Download Trigger:** Verified users can download the attached R2 document.
  - [ ] **Related Papers:** Sidebar lists related publications within the same category.
- **Notes / Bugs Found:**
  - 

---

## 👤 4. User Account & Contributor Authoring Portals

### Page 13: User Profile & Account Settings
- **URL:** [http://localhost:9090/profile](http://localhost:9090/profile) *(or `/account`, `/settings`)*
- **Access Level:** Signed-in User *(Requires authentication)*
- **Checklist:**
  - [ ] **Personal Information:** Editing name, bio, and country persists to database.
  - [ ] **Avatar Upload:** Uploading photo converts to WebP and displays loading spinner overlay.
  - [ ] **Location Detection:** Clicking "تحديد الموقع" queries geolocation and populates country field.
  - [ ] **Enrolled Courses List:** Displays active enrolled courses with progress bars and quick-resume links.
  - [ ] **Earned Certificates:** Lists issued certificates with view/download buttons.
  - [ ] **Sign Out:** Clicking "تسجيل الخروج" clears session and redirects to `/home`.
- **Notes / Bugs Found:**
  - 

---

### Page 14: Write / Edit Article
- **URL:** [http://localhost:9090/write-article](http://localhost:9090/write-article) *(or `/editor`, `/publish`)*
- **Access Level:** `write:articles` or `manage:any_article`
- **Checklist:**
  - [ ] **Permission Guard:** Denies access with "غير مصرح بالدخول" if permission is missing.
  - [ ] **Quill Rich Editor:** Formatting toolbar (bold, italics, headers, lists, quotes) works smoothly.
  - [ ] **Media Embeds:** Inserting image, video URL, or audio clip injects custom embeds properly.
  - [ ] **Empty Content Validation:** Rejects empty content or ghost tags (`<p><br></p>`).
  - [ ] **Cover Image Dropzone:** Uploads image to R2 `article_thumbnails/` with WebP compression.
  - [ ] **Draft vs Publish:** Toggling publish status updates visibility in public feed.
- **Notes / Bugs Found:**
  - 

---

### Page 15: Submit Research Document
- **URL:** [http://localhost:9090/research-upload](http://localhost:9090/research-upload) *(or `/upload-research`)*
- **Access Level:** `write:research`
- **Checklist:**
  - [ ] **Permission Guard:** Blocks unauthorized users with Access Denied screen.
  - [ ] **Document Metadata:** Title, abstract, authors, and category fields validate properly.
  - [ ] **File Dropzone:** Accepts PDF/DOCX/PPTX, displays file name, and shows size in MB.
  - [ ] **Upload Progress:** Shows upload progress stream (0–100%) to Cloudflare R2 bucket.
  - [ ] **Successful Submission:** Displays success banner and redirects back to research hub.
- **Notes / Bugs Found:**
  - 

---

## 🛡️ 5. Administration & Management Portals

### Page 16: Course Builder (LMS Admin)
- **URL:** [http://localhost:9090/admin/courses](http://localhost:9090/admin/courses) *(or `/admin/lms`, `/admin/builder`)*
- **Access Level:** `write:courses` or `manage:courses`
- **Checklist:**
  - [ ] **Course Catalog Management:** Add new course modal, edit course metadata, or delete course.
  - [ ] **Cover Banner Upload:** Uploads course cover image to R2 `course_covers/`.
  - [ ] **Module & Lesson Hierarchy:** Create modules and add video, reading, or exam lessons.
  - [ ] **Quiz Authoring:** Build interactive quizzes with options and designate correct answers.
  - [ ] **Drag & Drop Reordering:** Dragging lessons/modules reorders syllabus and updates database order.
  - [ ] **Publish / Unpublish:** Toggling course publication updates student catalog visibility.
- **Notes / Bugs Found:**
  - 

---

### Page 17: User Management Dashboard
- **URL:** [http://localhost:9090/admin/users](http://localhost:9090/admin/users) *(or `/admin/members`)*
- **Access Level:** `approve:users` or `manage:system`
- **Checklist:**
  - [ ] **User Directory Search:** Search by name or email, and filter by role.
  - [ ] **Role Modification:** Promoting user (e.g. `user` ➔ `researcher` / `educator`) updates permissions instantly.
  - [ ] **Membership Applications Review:** Review pending "Join Us" applications with applicant CV preview.
  - [ ] **Application Decision:** Approve or reject applications with automatic role elevation.
- **Notes / Bugs Found:**
  - 

---

### Page 18: User Stats & Analytics
- **URL:** [http://localhost:9090/admin/stats](http://localhost:9090/admin/stats) *(or `/admin/analytics`)*
- **Access Level:** `view:user_stats`
- **Checklist:**
  - [ ] **Engagement Charts:** Daily active users, signup curves, and course completion metrics render cleanly.
  - [ ] **Video Watch Telemetry:** Aggregated watch times and anti-cheat indicators load properly.
  - [ ] **Responsive Visuals:** Charts scale properly without overflowing on smaller screens.
- **Notes / Bugs Found:**
  - 

---

### Page 19: Certificate Audit Dashboard
- **URL:** [http://localhost:9090/admin/certificates](http://localhost:9090/admin/certificates) *(or `/admin/audit`)*
- **Access Level:** `issue:certs` or `manage:system`
- **Checklist:**
  - [x] **Pending Claims Queue:** Displays student certificate claim requests.
  - [x] **Anti-Cheat Inspection:** Flags suspicious video scrubbing warnings (`⚠️ نشاط مشبوه`).
  - [x] **Approval Workflow:** One-click approval issues valid certificate with verifiable serial ID.
  - [x] **Rejection Feedback:** Rejecting request requires reason and alerts student in modal.
- **Notes / Bugs Found:**
  - Tested via `?mock=1` bypass with two mock requests (req-mock-001 clean, req-mock-002 suspicious).
  - Added real-time search bar (by Arabic/English name) and custom course dropdown filter.
  - Fixed mobile layout: master/detail pattern — list and detail panels no longer overlap on small screens. Back button returns to list.
  - Removed all `box-shadow` from cards and header banner (zero shadows).
  - Replaced native OS `<select>` dropdown with custom styled dropdown (no OS overlay covering content).
  - Rejection input is now full-width and stacked vertically (no overflow on mobile).
  - Approve/Reject in mock mode auto-returns to list view on mobile after action.


---

### Page 20: Homepage Slider Manager
- **URL:** [http://localhost:9090/admin/slider](http://localhost:9090/admin/slider) *(or `/admin/homepage-slider`)*
- **Access Level:** `manage:slider`
- **Checklist:**
  - [ ] **Active Slides List:** Lists current slides with sequence numbers and thumbnail previews.
  - [ ] **Add Custom Slide:** Upload banner image to R2 `slider/`, enter titles (AR/EN), and configure target URL.
  - [ ] **Sequence Reordering:** Move slide up/down adjusts ordering on public homepage slider.
  - [ ] **Active Toggle:** Switching slide off hides it immediately from the public homepage hero.
- **Notes / Bugs Found:**
  - 

---

