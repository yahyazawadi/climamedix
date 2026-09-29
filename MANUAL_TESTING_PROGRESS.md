# 📋 ClimaMedix Manual Testing Checklist & Progress Tracker

> **Application URL:** [http://localhost:9090](http://localhost:9090)  
> **Tester Instructions:** Use this document to track your page-by-page manual inspection. Check off boxes (`[x]`) as you test, and log any findings, glitches, or visual bugs in the notes section of each page.

---

## 📊 Testing Progress Overview

- [ ] **1. Public & Core Visitor Pages** (2/5 Completed)
- [ ] **2. Content Hubs & Community Pages** (0/4 Completed)
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
  - [ ] **Mission, Vision & Core Values:** Cards render with clean glassmorphic borders and legible typography.
  - [ ] **Team Members Grid:** Avatars, roles, and bios display correctly.
  - [ ] **Strategic Partners Grid:** Partner logos render without distortion.
  - [ ] **Join Team CTA:** Action button triggers navigation to `/join`.
- **Notes / Bugs Found:**
  - 

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
  - [ ] **Article Grid:** Cards render thumbnails, publication dates, and category tags.
  - [ ] **Category Filter Chips:** Filtering by category updates grid smoothly.
  - [ ] **Search Bar:** Typing query filters article titles without colliding with right-aligned magnifying glass in RTL.
  - [ ] **Geospatial News Map View:** Toggling to "Map View" renders interactive node pins and severity radius circles.
- **Notes / Bugs Found:**
  - 

---

### Page 7: Article Reader
- **URL:** [http://localhost:9090/article?id=...](http://localhost:9090/article) *(or `/post`, `/read`)*
- **Access Level:** Public (All)
- **Checklist:**
  - [ ] **Article Layout:** Headline, author card, publication date, and cover image render properly.
  - [ ] **Rich Content:** Quill-formatted text, embedded videos, audio clips, and images load correctly.
  - [ ] **View Counter:** Auto-increments view counter upon article opening.
  - [ ] **Likes & Engagement:** Authenticated users can toggle like; guests receive prompt to sign in.
  - [ ] **Author Edit Button:** "تعديل" appears ONLY for the author or users with `manage:any_article`.
  - [ ] **Share Buttons:** Web Share API / Copy Link action works with feedback toast.
- **Notes / Bugs Found:**
  - 

---

### Page 8: Opportunities & Grants Hub
- **URL:** [http://localhost:9090/opportunities](http://localhost:9090/opportunities) *(or `/jobs`, `/grants`)*
- **Access Level:** Public (All)
- **Checklist:**
  - [ ] **Category Filters:** Filter by Fellowship, Scholarship, Grant, Internship, or Conference.
  - [ ] **Column-Masking Guard:** Unauthenticated guests see "سجل لعرض الرابط" (Sign in to Apply) instead of raw link.
  - [ ] **Opportunity Modal:** Clicking card opens modal with full requirements, deadline, and eligibility.
  - [ ] **External Apply Link:** Authenticated users see direct "Apply Now" button opening external URL in new tab.
- **Notes / Bugs Found:**
  - 

---

### Page 9: Events Calendar
- **URL:** [http://localhost:9090/events](http://localhost:9090/events) *(or `/calendar`, `/webinars`)*
- **Access Level:** Public (All)
- **Checklist:**
  - [ ] **Calendar Grid:** Current month days render with event indicator dot markers.
  - [ ] **Month Navigation:** Previous and Next buttons switch months seamlessly.
  - [ ] **Event Selection:** Clicking an active day highlights matching events in the agenda list.
  - [ ] **Event Detail Inspect:** Clicking event shows time, location/online link, speaker info, and RSVP action.
- **Notes / Bugs Found:**
  - 

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
  - [ ] **Pending Claims Queue:** Displays student certificate claim requests.
  - [ ] **Anti-Cheat Inspection:** Flags suspicious video scrubbing warnings (`⚠️ نشاط مشبوه`).
  - [ ] **Approval Workflow:** One-click approval issues valid certificate with verifiable serial ID.
  - [ ] **Rejection Feedback:** Rejecting request requires reason and alerts student in modal.
- **Notes / Bugs Found:**
  - 

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

## 🔧 6. Developer & Debug Tooling

### Page 21: Debug & UI Test
- **URL:** [http://localhost:9090/debug](http://localhost:9090/debug) *(or `/test`)*
- **Access Level:** Developer / Superadmin
- **Checklist:**
  - [ ] **Component Sandbox:** Test buttons, glass cards, date pickers, and modals in isolation.
  - [ ] **Permissions Override Playground:** Verify dynamic permission toggles and role switching.
- **Notes / Bugs Found:**
  - 
