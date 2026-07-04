# ClimaMedix Testing Roadmap

Here is a comprehensive testing roadmap to validate the core complexities of the platform. Please check off items as they are verified.

### 🧪 Stage 1: Role & Permission Toggling (Super Admin Mode)
*Validates the localized dynamic RLS permissions matrix.*

- [ ] **Interactive Toggling:** Open your user profile menu and click **صلاحيات الحساب النشطة / Active Account Permissions**.
- [ ] **Test UI Reactivity:** Toggle specific permissions off (e.g., `write:opportunities` or `manage:courses`). Confirm they turn gray with a strikethrough, and verify that the corresponding buttons on the site (like the "Post Opportunity" button) instantly disappear/reappear.

### 🎓 Stage 2: The Learning Hub (Student Flow)
*Ensures all edge cases and module workflows for standard users are stable.*

- [ ] **Enrollment Check:** With `view:all_courses` toggled ON, navigate to **Learning Hub** (`/learning-hub` or My Courses), select a course, and click "Enroll".
- [ ] **Media Player Stress Test:** Open a video lesson.
  - [ ] Test the custom volume and speed sliders (double-click speed to reset).
  - [ ] Test the Picture-in-Picture mode.
  - [ ] Test the "Copy Frame" button to ensure Cloudflare R2 CORS isn't blocking it.
- [ ] **Strict Quiz Validation:** Go to the end of a module and take a Quiz.
  - [ ] **Fail Test:** Try selecting only *some* of the correct checkboxes on a multi-select question. Ensure you get 0 points (no partial credit).
  - [ ] **Review Screen Test:** Pass the quiz and open review mode. Verify that ONLY the correct answers you actually clicked highlight green. Confirm that incorrect choices and unselected correct choices are kept completely plain with no hints.

### 🛠️ Stage 3: The Course Builder (Admin Flow)
*Validating the complex state management of the drag-and-drop builder.*

- [ ] **Setup:** Ensure `manage:courses` is toggled ON. Go to the Admin Dashboard -> **Course Builder** (`/admin/courses`).
- [ ] **Drag & Drop:** Try reordering lessons inside a module, moving a lesson across modules, and reordering entire modules. Ensure the UI doesn't crash or lose state.
- [ ] **Quiz Builder:** Add a new Quiz lesson. Create a question, add multiple options, and mark more than one as `is_correct` to test multi-select logic. Save the course.

### 🧪 Stage 4: Content & Engagement Tracking
*Validating tracking systems and content views.*

- [ ] **News & Reactions:** Go to `/news`. Click on a few articles. Verify that the view count increments and test the "Like" button to ensure your reaction strictly maps to your session.
- [ ] **Research Center Layout:** Go to `/research` and check the grid layout.
- [ ] **Forms & Uploads:** If accessible, test the "Join Us" form for the Research Team and upload a CV to ensure the Cloudflare R2 upload interceptor is functioning perfectly.
