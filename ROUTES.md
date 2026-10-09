# 🛣️ Routes & Navigation Map

To keep track of the growing application surface area, here is a definitive list of all configured application routes. We use a centralized, multi-alias routing system via `src/AppRouter.jsx`, allowing multiple manual URLs to map to the same view (e.g., `/login` and `/auth` both point to Authentication).

### 🌍 Public / General Routes
*   [http://localhost:5174/](http://localhost:5174/) | **`/` / `/newhome` / `/main`** - New Home Page (Premium Layout)
*   [http://localhost:5174/oldhome](http://localhost:5174/oldhome) | **`/oldhome` / `/legacy`** - Old Home Page (Legacy Layout)
*   [http://localhost:5174/about](http://localhost:5174/about) | **`/about` / `/about-us` / `/info`** - About Us Page
*   [http://localhost:5174/auth](http://localhost:5174/auth) | **`/auth` / `/login` / `/register`** - Authentication & Registration
*   [http://localhost:5174/profile](http://localhost:5174/profile) | **`/profile` / `/account` / `/settings`** - User Profile & Account Settings
*   [http://localhost:5174/article](http://localhost:5174/article) | **`/article?id=[uuid]`** - Article Reader Page
*   [http://localhost:5174/research](http://localhost:5174/research) | **`/research` / `/publications`** - Research & Publications Hub
*   [http://localhost:5174/research-detail](http://localhost:5174/research-detail) | **`/research-detail` / `/paper`** - Research Detail Page
*   [http://localhost:5174/courses](http://localhost:5174/courses) | **`/courses` / `/lms` / `/dashboard`** - LMS Student Dashboard
*   [http://localhost:5174/verify](http://localhost:5174/verify) | **`/verify/[id]`** - Certificate Verification Page
*   [http://localhost:5174/debug](http://localhost:5174/debug) | **`/debug`** - UI Testing Playground

### 🔒 Permission-Required Routes
*   [http://localhost:5174/opportunities](http://localhost:5174/opportunities) | **`/opportunities` / `/jobs` / `/careers`** - Opportunities Directory *(Posting requires: `write:opportunities`)*
*   [http://localhost:5174/events](http://localhost:5174/events) | **`/events` / `/calendar`** - Events Calendar *(Management requires: `write:events` or `manage:any_event`)*
*   [http://localhost:5174/join](http://localhost:5174/join) | **`/join` / `/apply` / `/membership`** - Membership / Join Network Form *(Admin review requires: `approve:users`)*
*   [http://localhost:5174/news](http://localhost:5174/news) | **`/news` / `/blog` / `/articles`** - News & Blog Feed *(Map editing requires: `edit:news_map`)*
*   [http://localhost:5174/write-article](http://localhost:5174/write-article) | **`/write-article` / `/new-article`** - Article Editor Page *(Requires: `write:articles`)*
*   [http://localhost:5174/research-upload](http://localhost:5174/research-upload) | **`/research-upload` / `/upload-research`** - Research Document Upload Form *(Requires: `write:research`)*
*   [http://localhost:5174/admin/courses](http://localhost:5174/admin/courses) | **`/admin/courses` / `/admin/lms`** - Course Builder Dashboard *(Requires: `manage:any_course`)*
*   [http://localhost:5174/admin/users](http://localhost:5174/admin/users) | **`/admin/users` / `/admin/members`** - User Role Management Dashboard *(Requires: `manage:system`)*
*   [http://localhost:5174/admin/stats](http://localhost:5174/admin/stats) | **`/admin/stats` / `/admin/analytics`** - Analytics & Statistics Dashboard *(Requires: `view:user_stats`)*
*   [http://localhost:5174/admin/certificates](http://localhost:5174/admin/certificates) | **`/admin/certificates` / `/admin/certs`** - Certificate Audit Dashboard *(Requires: `issue:certs`)*
## Remote SSH Setup  
