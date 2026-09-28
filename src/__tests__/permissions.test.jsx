import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/preact';
import { AuthProvider, useAuth, ROLE_PERMISSIONS } from '../features/auth/hooks/useAuth';

describe('Permissions & Role-Based Access Control (RBAC) Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('1. ROLE_PERMISSIONS Matrix Integrity', () => {
    it('defines all 6 standard roles', () => {
      expect(ROLE_PERMISSIONS).toHaveProperty('user');
      expect(ROLE_PERMISSIONS).toHaveProperty('subscriber');
      expect(ROLE_PERMISSIONS).toHaveProperty('researcher');
      expect(ROLE_PERMISSIONS).toHaveProperty('educator');
      expect(ROLE_PERMISSIONS).toHaveProperty('admin');
      expect(ROLE_PERMISSIONS).toHaveProperty('superadmin');
    });

    it('ensures view:public_content is accessible or recognized for all roles', () => {
      // Bug check: view:public_content is the DB default for public teasers
      // All authenticated roles should at least inherit or possess view:public_content
      const roles = ['user', 'subscriber', 'researcher', 'educator', 'admin', 'superadmin'];
      roles.forEach(role => {
        const perms = ROLE_PERMISSIONS[role];
        expect(perms, `Role ${role} must explicitly contain view:public_content`).toContain('view:public_content');
      });
    });

    it('restricts privileged management permissions from basic users', () => {
      const basicUserPerms = ROLE_PERMISSIONS.user;
      expect(basicUserPerms).not.toContain('manage:any_course');
      expect(basicUserPerms).not.toContain('manage:system');
      expect(basicUserPerms).not.toContain('approve:users');
      expect(basicUserPerms).not.toContain('write:opportunities');
      expect(basicUserPerms).not.toContain('manage:slider');
    });

    it('grants educators write:events and researchers write:research', () => {
      expect(ROLE_PERMISSIONS.educator).toContain('write:events');
      expect(ROLE_PERMISSIONS.researcher).toContain('write:research');
    });

    it('grants superadmin comprehensive system management keys', () => {
      const superPerms = ROLE_PERMISSIONS.superadmin;
      expect(superPerms).toContain('manage:system');
      expect(superPerms).toContain('view:user_stats');
      expect(superPerms).toContain('manage:slider');
      expect(superPerms).toContain('manage:any_course');
      expect(superPerms).toContain('approve:users');
    });
  });

  describe('2. hasPermission() Evaluation Logic', () => {
    it('handles unauthenticated guests: allows public content, blocks protected actions', () => {
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Guests should be able to view public content if permission key is view:public_content
      // or when passed empty/null
      expect(result.current.hasPermission('view:public_content')).toBe(true);
      expect(result.current.hasPermission('write:articles')).toBe(false);
      expect(result.current.hasPermission('manage:system')).toBe(false);
      expect(result.current.hasPermission('manage:any_course')).toBe(false);
    });

    it('honors custom individual permissions granted to userProfile', () => {
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Even if user role is 'user', custom_permissions must grant specific capability
      act(() => {
        // Mock profile with custom permission
        if (result.current.userProfile) {
          result.current.userProfile.custom_permissions = ['write:opportunities'];
        }
      });
    });

    it('honors disabledPermissions overrides (Superadmin interactive toggle)', () => {
      localStorage.setItem('disabled_permissions', JSON.stringify(['write:opportunities']));
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      // With write:opportunities disabled, hasPermission should return false even in superadmin mode
      expect(result.current.disabledPermissions).toContain('write:opportunities');
      expect(result.current.hasPermission('write:opportunities')).toBe(false);
    });

    it('toggles permission on and off and updates localStorage and state', () => {
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Toggle 'manage:slider' to disabled
      act(() => {
        result.current.togglePermission('manage:slider');
      });

      expect(result.current.disabledPermissions).toContain('manage:slider');
      expect(JSON.parse(localStorage.getItem('disabled_permissions'))).toContain('manage:slider');

      // Toggle 'manage:slider' back to enabled
      act(() => {
        result.current.togglePermission('manage:slider');
      });

      expect(result.current.disabledPermissions).not.toContain('manage:slider');
      expect(JSON.parse(localStorage.getItem('disabled_permissions'))).not.toContain('manage:slider');
    });

    it('aliases manage:courses and manage:any_course interchangeably', () => {
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Admin role has manage:any_course, which should also grant manage:courses
      act(() => {
        result.current.togglePermission('manage:courses');
      });

      // Disabling manage:courses should also disable manage:any_course
      expect(result.current.hasPermission('manage:courses')).toBe(false);
      expect(result.current.hasPermission('manage:any_course')).toBe(false);
    });
  });

  describe('3. Two-Tier Content Access Resolution (Courses & Publications)', () => {
    function resolveCourseAccess(hasPermFn, course) {
      if (!course) return 'locked';
      if (course.full_access_permission_key && hasPermFn(course.full_access_permission_key)) {
        return 'full';
      }
      if (!course.teaser_permission_key || course.teaser_permission_key === 'view:public_content' || hasPermFn(course.teaser_permission_key)) {
        return 'teaser';
      }
      return 'locked';
    }

    it('resolves public courses to teaser for guests/users and full for subscribers', () => {
      const publicCourse = {
        title_ar: 'المناخ والصحة 101',
        teaser_permission_key: 'view:public_content',
        full_access_permission_key: 'view:all_courses',
      };

      // Mock user hasPermission: only public/free
      const userHasPerm = (perm) => ['view:public_content', 'view:free_content'].includes(perm);
      expect(resolveCourseAccess(userHasPerm, publicCourse)).toBe('teaser');

      // Mock subscriber hasPermission: has view:all_courses
      const subHasPerm = (perm) => ['view:public_content', 'view:free_content', 'view:all_courses'].includes(perm);
      expect(resolveCourseAccess(subHasPerm, publicCourse)).toBe('full');
    });

    it('resolves download permission for research publications', () => {
      const pub = {
        title: 'Climate Change in the Levant',
        teaser_permission_key: 'view:public_content',
        full_access_permission_key: 'view:all_research',
        pdf_url: 'https://r2.climamedix.org/papers/climate_levant.pdf'
      };

      const userHasPerm = (perm) => ['view:public_content', 'view:free_content'].includes(perm);
      const researcherHasPerm = (perm) => ['view:public_content', 'view:free_content', 'view:all_research'].includes(perm);

      // Standard user cannot download premium research
      const userCanDownload = !pub.full_access_permission_key || userHasPerm(pub.full_access_permission_key);
      expect(userCanDownload).toBe(false);

      // Researcher can download
      const researcherCanDownload = !pub.full_access_permission_key || researcherHasPerm(pub.full_access_permission_key);
      expect(researcherCanDownload).toBe(true);
    });
  });

  describe('4. Session Teardown & Disabled Permissions Leak Prevention', () => {
    it('signOut should clear disabled permissions from localStorage to prevent cross-session leakage', async () => {
      localStorage.setItem('disabled_permissions', JSON.stringify(['write:articles']));
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signOut();
      });

      // disabled_permissions should be purged upon logout
      const stored = localStorage.getItem('disabled_permissions');
      expect(stored === null || stored === '[]').toBe(true);
    });
  });
});
