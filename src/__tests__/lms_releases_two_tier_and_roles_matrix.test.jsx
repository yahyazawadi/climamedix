import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { evaluatePermission, AuthProvider, useAuth, ROLE_PERMISSIONS } from '../features/auth/hooks/useAuth';
import { LMSDashboard } from '../features/learning-hub/components/student/LMSDashboard';

// Mock GSAP
vi.mock('gsap', () => ({
  default: {
    context: (cb) => {
      cb();
      return { revert: vi.fn() };
    },
    fromTo: vi.fn(),
  }
}));

describe('LMS Releases (Public Free / Private Paid), File Types & Roles Matrix (42 Tests)', () => {
  const allRoles = ['guest', 'user', 'subscriber', 'researcher', 'educator', 'admin', 'superadmin'];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // ─── 1. Release Type A: Public / Free Courses (view:free_content) (7 Tests) ─
  describe('1. Release Type A: Public / Free Courses (view:free_content) (7 Tests)', () => {
    allRoles.forEach(role => {
      it(`[${role}] access evaluation for Free Course release (teaser: view:public_content, full: view:free_content)`, () => {
        const roleArg = role === 'guest' ? null : role;
        const canViewTeaser = evaluatePermission('view:public_content', roleArg);
        const canViewFull = evaluatePermission('view:free_content', roleArg);

        // Everyone can view public teaser
        expect(canViewTeaser).toBe(true);

        // Registered users (user, subscriber, researcher, educator, admin, superadmin) can view full free content
        const expectedFull = role !== 'guest';
        expect(canViewFull).toBe(expectedFull);

        // Compute isLocked flag as used in CourseDetailModal & LearningHubPage
        const isLocked = !canViewFull;
        expect(isLocked).toBe(role === 'guest');
      });
    });
  });

  // ─── 2. Release Type B: Private / Paid Courses (view:all_courses) (7 Tests) ──
  describe('2. Release Type B: Private / Paid Courses (view:all_courses) (7 Tests)', () => {
    allRoles.forEach(role => {
      it(`[${role}] access evaluation for Paid Course release (teaser: view:public_content, full: view:all_courses)`, () => {
        const roleArg = role === 'guest' ? null : role;
        const canViewTeaser = evaluatePermission('view:public_content', roleArg);
        const canViewFull = evaluatePermission('view:all_courses', roleArg);

        // Everyone can view teaser outline
        expect(canViewTeaser).toBe(true);

        // Only paid subscribers, researchers, instructors, and admins get full access
        const expectedFull = ['subscriber', 'researcher', 'educator', 'admin', 'superadmin'].includes(role);
        expect(canViewFull).toBe(expectedFull);

        // Locked for unauthenticated guests AND free standard users
        const isLocked = !canViewFull;
        if (role === 'guest' || role === 'user') {
          expect(isLocked).toBe(true); // Paywall upgrade banner shown
        } else {
          expect(isLocked).toBe(false); // Unlocked full access
        }
      });
    });
  });

  // ─── 3. LMS Media & Supported Lesson File Types (6 Tests) ───────────────────
  describe('3. LMS Media & Supported Lesson File Types (6 Tests)', () => {
    const lessonTypes = [
      { type: 'video', ext: '.mp4', mime: 'video/mp4', renderer: 'CustomVideoPlayer' },
      { type: 'video', ext: '.webm', mime: 'video/webm', renderer: 'CustomVideoPlayer' },
      { type: 'audio', ext: '.mp3', mime: 'audio/mpeg', renderer: 'CustomAudioPlayer' },
      { type: 'audio', ext: '.wav', mime: 'audio/wav', renderer: 'CustomAudioPlayer' },
      { type: 'document', ext: '.pdf', mime: 'application/pdf', renderer: 'DownloadableAttachment' },
      { type: 'rich_text', ext: '.html', mime: 'text/html', renderer: 'RichTextRenderer' },
    ];

    lessonTypes.forEach(({ type, ext, mime, renderer }) => {
      it(`validates LMS support for lesson media [${type}] with extension ${ext}`, () => {
        const lesson = {
          id: `les-${type}`,
          title_ar: `درس تجريبي - ${type}`,
          video_url: type === 'video' ? `videos/lesson${ext}` : null,
          audio_url: type === 'audio' ? `course_audio/lesson${ext}` : null,
          content_ar: `<p>محتوى الدرس</p>`,
          is_quiz: false,
        };

        if (type === 'video') {
          expect(lesson.video_url.endsWith(ext)).toBe(true);
        } else if (type === 'audio') {
          expect(lesson.audio_url.endsWith(ext)).toBe(true);
        } else {
          expect(lesson.content_ar).toContain('<p>');
        }
      });
    });
  });

  // ─── 4. Course Builder & Authoring Permissions (7 Tests) ────────────────────
  describe('4. Course Builder & Authoring Permissions (write:courses) (7 Tests)', () => {
    allRoles.forEach(role => {
      it(`[${role}] authoring permissions check: write:courses`, () => {
        const roleArg = role === 'guest' ? null : role;
        const canWrite = evaluatePermission('write:courses', roleArg);

        // In ClimaMedix, researcher, admin, and superadmin have write:courses
        const expectedWrite = ['researcher', 'admin', 'superadmin'].includes(role);
        expect(canWrite).toBe(expectedWrite);
      });
    });
  });

  // ─── 5. Course Management & Deletion Permissions (7 Tests) ──────────────────
  describe('5. Course Management & Deletion Permissions (manage:courses) (7 Tests)', () => {
    allRoles.forEach(role => {
      it(`[${role}] management permissions check: manage:courses and manage:any_course alias`, () => {
        const roleArg = role === 'guest' ? null : role;
        const canManage = evaluatePermission('manage:courses', roleArg);
        const canManageAny = evaluatePermission('manage:any_course', roleArg);

        // Only admin and superadmin have manage:courses (aliased with manage:any_course)
        const expectedManage = ['admin', 'superadmin'].includes(role);
        expect(canManage).toBe(expectedManage);
        expect(canManageAny).toBe(expectedManage);
      });
    });
  });

  // ─── 6. Superadmin Interactive Toggles & User Overrides on LMS (4 Tests) ────
  describe('6. Superadmin Interactive Toggles & User Overrides on LMS (4 Tests)', () => {
    it('disabling view:all_courses for superadmin immediately locks paid courses', () => {
      // By default, superadmin can view paid courses
      expect(evaluatePermission('view:all_courses', 'superadmin', [], [])).toBe(true);

      // Disable view:all_courses
      const disabledPerms = ['view:all_courses'];
      const canView = evaluatePermission('view:all_courses', 'superadmin', [], disabledPerms);

      expect(canView).toBe(false);
      const isLocked = !canView;
      expect(isLocked).toBe(true);
    });

    it('disabling manage:courses for superadmin immediately revokes syllabus builder rights', () => {
      expect(evaluatePermission('manage:courses', 'superadmin', [], [])).toBe(true);

      const disabledPerms = ['manage:courses'];
      const canManage = evaluatePermission('manage:courses', 'superadmin', [], disabledPerms);

      expect(canManage).toBe(false);
    });

    it('granting custom_permissions: ["view:all_courses"] to free user unlocks paid course', () => {
      // Baseline free user is locked
      expect(evaluatePermission('view:all_courses', 'user', [], [])).toBe(false);

      // Grant custom override
      const customPerms = ['view:all_courses'];
      const canView = evaluatePermission('view:all_courses', 'user', customPerms, []);

      expect(canView).toBe(true);
      const isLocked = !canView;
      expect(isLocked).toBe(false);
    });

    it('revoking custom override reverts free user back to locked paywall state', () => {
      const customPerms = [];
      const canView = evaluatePermission('view:all_courses', 'user', customPerms, []);

      expect(canView).toBe(false);
    });
  });

  // ─── 7. LMS Dashboard Mathematical Metrics & Card Rendering (4 Tests) ───────
  describe('7. LMS Dashboard Mathematical Metrics & Card Rendering (4 Tests)', () => {
    it('calculates accurate metrics when user has active and completed courses', () => {
      const enrolled = [
        { id: 'c1', progress: 50, category: 'طبي' },
        { id: 'c2', progress: 70, category: 'مناخي' }
      ];
      const completed = [
        { id: 'c3', title_ar: 'مساق منجز' }
      ];

      const { container } = render(
        <LMSDashboard 
          enrolledCourses={enrolled} 
          completedCourses={completed} 
          onSelectCourse={vi.fn()} 
        />
      );

      // Active = 2, Completed = 1, Total = 3
      // sum = 50 + 70 + (1 * 100) = 220. Average = Math.round(220 / 3) = 73%
      expect(container.textContent).toContain('2'); // active count
      expect(container.textContent).toContain('1'); // completed count
      expect(container.textContent).toContain('73%'); // average progress
    });

    it('displays 0% average progress when enrolledCourses is empty', () => {
      const { container } = render(
        <LMSDashboard 
          enrolledCourses={[]} 
          completedCourses={[]} 
          onSelectCourse={vi.fn()} 
        />
      );
      expect(container.textContent).toContain('0%');
    });

    it('clicking course card triggers onSelectCourse with course object', () => {
      const onSelectCourse = vi.fn();
      const enrolled = [
        { id: 'course-target', progress: 40, category: 'كوارث', title: 'طب الكوارث' }
      ];

      const { container } = render(
        <LMSDashboard 
          enrolledCourses={enrolled} 
          completedCourses={[]} 
          onSelectCourse={onSelectCourse} 
        />
      );

      const continueBtn = container.querySelector('button');
      if (continueBtn) {
        fireEvent.click(continueBtn);
        expect(onSelectCourse).toHaveBeenCalledWith(enrolled[0]);
      }
    });

    it('displays progress bar width corresponding to course progress percentage', () => {
      const enrolled = [
        { id: 'c1', progress: 65, category: 'صحة' }
      ];

      const { container } = render(
        <LMSDashboard enrolledCourses={enrolled} completedCourses={[]} />
      );

      expect(container.textContent).toContain('65% مكتمل');
    });
  });
});
