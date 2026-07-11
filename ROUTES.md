# 🛣️ Routes & Navigation Map

To keep track of the growing application surface area, here is a definitive list of all configured application routes. We use a centralized, multi-alias routing system via `src/AppRouter.jsx`, allowing multiple manual URLs to map to the same view (e.g., `/login` and `/auth` both point to Authentication).

*   **`/` / `/newhome` / `/main`** - New Home Page (Premium Layout)
*   **`/about` / `/about-us` / `/info`** - About Us Page
*   **`/auth` / `/login` / `/register`** - Authentication & Registration
*   **`/profile` / `/account` / `/settings`** - User Profile & Account Settings
*   **`/opportunities` / `/jobs` / `/careers`** - Opportunities Directory *(Posting requires: `write:opportunities`)*
*   **`/events` / `/calendar`** - Events Calendar *(Management requires: `write:events` or `manage:any_event`)*
*   **`/join` / `/apply` / `/membership`** - Membership / Join Network Form *(Admin review requires: `approve:users`)*
*   **`/news` / `/blog` / `/articles`** - News & Blog Feed *(Map editing requires: `edit:news_map`)*
*   **`/article?id=[uuid]`** - Article Reader Page
*   **`/write-article` / `/new-article`** - Article Editor Page *(Requires: `write:articles`)*
*   **`/research` / `/publications`** - Research & Publications Hub
*   **`/research-detail` / `/paper`** - Research Detail Page
*   **`/research-upload` / `/upload-research`** - Research Document Upload Form *(Requires: `write:research`)*
*   **`/courses` / `/lms` / `/dashboard`** - LMS Student Dashboard
*   **`/verify/[id]`** - Certificate Verification Page
*   **`/admin/courses` / `/admin/lms`** - Course Builder Dashboard *(Requires: `manage:any_course`)*
*   **`/admin/users` / `/admin/members`** - User Role Management Dashboard *(Requires: `manage:system`)*
*   **`/admin/stats` / `/admin/analytics`** - Analytics & Statistics Dashboard *(Requires: `view:user_stats`)*
*   **`/admin/certificates` / `/admin/certs`** - Certificate Audit Dashboard *(Requires: `issue:certs`)*
*   **`/debug`** - UI Testing Playground
