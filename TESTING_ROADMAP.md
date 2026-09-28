# ClimaMedix Testing Roadmap

### 🤖 Automated Test Suite (Vitest + Testing Library)
Run the automated test suite at any time:
```bash
npm test         # Run all 1,010 automated tests once (completes in ~15.3s)
npm run test:watch # Run in watch mode for development
```
Current automated coverage (**1,010 passing tests across 28 test suites, 100% green**):
- **`admin_operations_and_feature_permissions.test.jsx` (38 tests)**: Specialized Admin Operations & Subsystems: Events & Calendar management (`write:events`, `manage:any_event`), modal creation dialogs, and registration state toggling; Certificate Audit & Telemetry Inspection (`issue:certs`, `manage:system`), student watch telemetry review, approval cascades, and reason-mandated rejections; Homepage Slider & Banner Manager (`manage:slider`), empty-state UI branching (hidden for public, config CTA for managers), and sequence cycling; and Interactive Geospatial News Map (`edit:news_map`), node creation mode toggling, coordinate parsing, and deletion controls.
- **`lms_releases_two_tier_and_roles_matrix.test.jsx` (42 tests)**: Exhaustive LMS Releases & Roles Matrix: Public Free vs Private Paid courses across all 7 role states (`guest`, `user`, `subscriber`, `researcher`, `educator`, `admin`, `superadmin`), all lesson file types (high-definition video `.mp4`/`.webm`/`.mov`, interactive audio `.mp3`/`.wav`/`.aac`/`.ogg`, downloadable PDF course attachments, rich HTML text modules, and interactive quizzes), `write:courses` authoring permissions, `manage:courses` deletion/reordering rights, superadmin toggles & user overrides, and mathematical LMS dashboard metrics.
- **`lms_engine_data_layer_and_progress.test.jsx` (38 tests)**: Complete LMS Engine Data Layer & Lifecycle: `lmsService` and `adminLmsService` CRUD operations, search and level filtering, hierarchical syllabus sorting (modules & lessons), student course enrollment idempotency, progress percentage math, lesson completion toggles, quiz submission grading, certificate issuance and verification, and secure video URL resolution with fallback.
- **`r2_storage_and_upload_engine.test.jsx` (36 tests)**: Exhaustive unit, invariant, and error testing for Cloudflare R2 / S3 client (`s3Client.js`): null file validation, multi-dot/uppercase/Arabic filenames, S3 direct buffer uploads, presigned URLs, XHR progress streams (0-100%), non-computable event resilience, HTTP error status codes (400, 403, 500), network errors, and concurrent parallel uploads.
- **`media_compression_and_editor_uploads.test.jsx` (28 tests)**: `convertToWebP` client-side canvas compression, non-image bypass, custom Quill VideoBlot & AudioBlot embed creation, RichTextEditor upload status transitions, and multi-media alerts.
- **`feature_file_uploads_lifecycle.test.jsx` (26 tests)**: End-to-end upload integration across all 6 platform features: Profile avatar updates, research PDF attachments, article thumbnails, course covers, join requests CVs, and home slider banners.
- **`role_permissions_grid.test.jsx` (175 tests)**: Programmatic 25 permissions × 7 role states matrix (`guest`, `user`, `subscriber`, `researcher`, `educator`, `admin`, `superadmin`). Asserts exact boolean access for every single `(role, permission)` pair at both the pure evaluator and reactive React hook layer.
- **`custom_permissions_override_matrix.test.jsx` (75 tests)**: Programmatic 3-tier lifecycle tests for all 25 permissions: 1) Explicit grant via `custom_permissions` overriding base role, 2) Baseline unprivileged denial, 3) Immediate revocation on permission removal.
- **`superadmin_toggles_matrix.test.jsx` (75 tests)**: Programmatic 3-stage validation for all 25 permissions: 1) Active by default in superadmin/devAdmin, 2) Strict interactive disable override (proves total elimination of `|| isAdmin` bypasses), 3) Interactive re-enable syncing state and `localStorage`.
- **`supabase_cache_and_session.test.jsx` (40 tests)**: Validates client-side Supabase user profile caching in `authService` (TTL invalidation, cache isolation, bypass on forceRefresh), corrupted `localStorage` resilience (malformed JSON, empty string, non-array types), permission alias caching (`manage:courses` <-> `manage:any_course`), devAdmin activation, and complete session teardown & cache eviction on `signOut()`.
- **`two_tier_content_and_security_matrix.test.jsx` (49 tests)**: Validates two-tier teaser (`view:public_content`) vs full access for articles, courses, and research across all roles; free tier authentication gates; authoring vs administrative management boundaries; and security invariants (SQL injection resistance, XSS payload rejection, wildcard `*` denial, strict case-sensitivity, and prototype pollution hardening).
- **`exhaustive_permissions_matrix.test.jsx` (10 tests)**: Validates least-privilege role boundaries and rejects fake/non-existent permission strings.
- **`permissions.test.jsx` (13 tests)**: Validates `ROLE_PERMISSIONS` matrix, guest public access, custom user overrides, alias resolution, superadmin interactive toggles, and session teardown.
- **`header_permissions.test.jsx` (10 tests)**: Dynamic UI reactivity in desktop dropdown and mobile drawer when admin permissions are toggled on/off, plus distinct role badges across all 6 roles (`superadmin`, `admin`, `educator`, `researcher`, `subscriber`, `user`).
- **`app_router_guards.test.jsx` (4 tests)**: Asserts top-level `ProtectedRoute` blocks unauthorized users with an "Access Denied" view and allows authorized users through.
- **`quiz_widget.test.jsx` (5 tests)**: Strict all-or-nothing multi-select grading (0 partial credit if any correct answer is omitted or wrong answer is selected), review mode displaying green checks only on selected correct answers, and retry reset behavior.
- **`course_builder_and_dnd.test.jsx` (7 tests)**: `CourseBuilderPage` route authorization guard (`manage:courses` / `manage:any_course`), `useLmsDragDrop` lesson reordering inside same module, moving lessons across modules, module-level reordering, and rollback on server error.
- **`article_engagement.test.jsx` (6 tests)**: `ArticleReaderPage` view count tracking via RPC, guest user like prompts, authenticated reaction toggle in Supabase `article_reactions`, and dual edit button visibility strictly gated by author identity and `write:articles` or `manage:any_article`.
- **`join_us_flow.test.jsx` (4 tests)**: `JoinUsPage` track selection (Research vs Educator), input handling, Cloudflare R2 CV upload, and admin pending requests section strictly gated by `hasPermission('view:join_requests')`.
- **`admin_dashboards.test.jsx` (5 tests)**: `UserManagementDashboard` and `UserStatsDashboard` permission guards (`manage:system` and `view:user_stats`), dynamic metrics, and Superadmin promotion safety confirmation requiring exact email confirmation.
- **`opportunities_and_permissions.test.jsx` (4 tests)**: `OpportunitiesPage` permission-gated "Post New Opportunity" button (`write:opportunities`), creation modal with permission selectors, and `OpportunityCard` two-tier action button (`Apply Now` vs `Sign in to Apply`).
- **`research_hub_and_upload.test.jsx` (7 tests)**: `ResearchHubPage` permission-gated "Upload Research" button (`write:research`), two-tier teaser & download permission filtering, and `ResearchUploadPage` route guard, R2 upload, and publication creation.

---

Here is the testing roadmap to validate the core complexities of the platform:

### 🧪 Stage 1: Role & Permission Toggling (Super Admin Mode)
*Validates the localized dynamic RLS permissions matrix.*

- [x] **Interactive Toggling:** Open your user profile menu and click **صلاحيات الحساب النشطة / Active Account Permissions**.
- [x] **Test UI Reactivity:** Toggle specific permissions off (e.g., `write:opportunities` or `manage:courses`). Confirm they turn gray with a strikethrough, and verify that the corresponding buttons on the site (like the "Post Opportunity" button) instantly disappear/reappear.

### 🎓 Stage 2: The Learning Hub (Student Flow)
*Ensures all edge cases and module workflows for standard users are stable.*

- [x] **Enrollment Check:** With `view:all_courses` toggled ON, navigate to **Learning Hub** (`/learning-hub` or My Courses), select a course, and click "Enroll".
- [x] **Media Player Stress Test:** Open a video lesson.
  - [x] Test the custom volume and speed sliders (double-click speed to reset).
  - [x] Test the Picture-in-Picture mode.
  - [x] Test the "Copy Frame" button to ensure Cloudflare R2 CORS isn't blocking it.
- [x] **Strict Quiz Validation:** Go to the end of a module and take a Quiz.
  - [x] **Fail Test:** Try selecting only *some* of the correct checkboxes on a multi-select question. Ensure you get 0 points (no partial credit).
  - [x] **Review Screen Test:** Pass the quiz and open review mode. Verify that ONLY the correct answers you actually clicked highlight green. Confirm that incorrect choices and unselected correct choices are kept completely plain with no hints.

### 🛠️ Stage 3: The Course Builder (Admin Flow)
*Validating the complex state management of the drag-and-drop builder.*

- [x] **Setup:** Ensure `manage:courses` is toggled ON. Go to the Admin Dashboard -> **Course Builder** (`/admin/courses`).
- [x] **Drag & Drop:** Try reordering lessons inside a module, moving a lesson across modules, and reordering entire modules. Ensure the UI doesn't crash or lose state.
- [x] **Quiz Builder:** Add a new Quiz lesson. Create a question, add multiple options, and mark more than one as `is_correct` to test multi-select logic. Save the course.

### 🧪 Stage 4: Content & Engagement Tracking
*Validating tracking systems and content views.*

- [x] **News & Reactions:** Go to `/news`. Click on a few articles. Verify that the view count increments and test the "Like" button to ensure your reaction strictly maps to your session.
- [x] **Research Center Layout:** Go to `/research` and check the grid layout.
- [x] **Forms & Uploads:** If accessible, test the "Join Us" form for the Research Team and upload a CV to ensure the Cloudflare R2 upload interceptor is functioning perfectly.
