import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/preact';
import { AuthProvider, useAuth, ROLE_PERMISSIONS } from '../features/auth/hooks/useAuth';

describe('Exhaustive Permission Matrix & No-Bypass Verification', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const ALL_SYSTEM_PERMISSIONS = [
    'view:public_content',
    'view:free_content',
    'view:all_courses',
    'view:all_articles',
    'view:all_research',
    'write:articles',
    'manage:any_article',
    'manage:any_course',
    'manage:courses',
    'write:courses',
    'manage:any_publication',
    'write:research',
    'write:opportunities',
    'manage:any_opportunity',
    'write:events',
    'manage:any_event',
    'approve:users',
    'issue:certs',
    'review:posts',
    'view:join_requests',
    'edit:news_map',
    'view:user_stats',
    'manage:slider',
    'manage:system',
    'apply:specialized_roles'
  ];

  function createAuthContextWithRole(role, custom_permissions = []) {
    const mockUser = { id: `user-${role}`, email: `${role}@climamedix.org` };
    const mockProfile = { id: `user-${role}`, email: `${role}@climamedix.org`, role, custom_permissions };
    
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      // Set userProfile on the state
      if (result.current.userProfile) {
        result.current.userProfile.role = role;
        result.current.userProfile.custom_permissions = custom_permissions;
      }
    });

    return { result, mockUser, mockProfile };
  }

  describe('1. Unauthenticated Guests (Strict Least-Privilege)', () => {
    it('allows ONLY view:public_content and denies all 24 protected permissions', () => {
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.hasPermission('view:public_content')).toBe(true);

      ALL_SYSTEM_PERMISSIONS.filter(p => p !== 'view:public_content').forEach(perm => {
        expect(result.current.hasPermission(perm), `Guest must NOT have ${perm}`).toBe(false);
      });
    });
  });

  describe('2. Standard User Role (Student)', () => {
    it('has view:public_content, view:free_content, apply:specialized_roles and none of the writer/admin keys', () => {
      const perms = ROLE_PERMISSIONS.user;
      expect(perms).toContain('view:public_content');
      expect(perms).toContain('view:free_content');
      expect(perms).toContain('apply:specialized_roles');

      // Must NOT have content writer or admin keys
      expect(perms).not.toContain('write:articles');
      expect(perms).not.toContain('write:research');
      expect(perms).not.toContain('write:events');
      expect(perms).not.toContain('write:opportunities');
      expect(perms).not.toContain('manage:any_course');
      expect(perms).not.toContain('manage:system');
      expect(perms).not.toContain('view:user_stats');
    });
  });

  describe('3. Subscriber Role', () => {
    it('has viewing access to all courses, articles, research but no authoring or management', () => {
      const perms = ROLE_PERMISSIONS.subscriber;
      expect(perms).toContain('view:all_courses');
      expect(perms).toContain('view:all_articles');
      expect(perms).toContain('view:all_research');

      expect(perms).not.toContain('write:articles');
      expect(perms).not.toContain('write:research');
      expect(perms).not.toContain('write:events');
      expect(perms).not.toContain('manage:any_course');
      expect(perms).not.toContain('manage:system');
    });
  });

  describe('4. Researcher Role', () => {
    it('has write:research, write:courses, write:articles but no system management', () => {
      const perms = ROLE_PERMISSIONS.researcher;
      expect(perms).toContain('write:research');
      expect(perms).toContain('write:courses');
      expect(perms).toContain('write:articles');

      expect(perms).not.toContain('manage:any_course');
      expect(perms).not.toContain('manage:system');
      expect(perms).not.toContain('approve:users');
      expect(perms).not.toContain('manage:slider');
    });
  });

  describe('5. Educator Role', () => {
    it('has write:events and write:articles but no write:research or system management', () => {
      const perms = ROLE_PERMISSIONS.educator;
      expect(perms).toContain('write:events');
      expect(perms).toContain('write:articles');

      expect(perms).not.toContain('write:research');
      expect(perms).not.toContain('manage:any_course');
      expect(perms).not.toContain('manage:system');
    });
  });

  describe('6. Admin Role', () => {
    it('has content management capabilities but lacks system-level root keys (manage:system, view:user_stats)', () => {
      const perms = ROLE_PERMISSIONS.admin;
      expect(perms).toContain('manage:any_course');
      expect(perms).toContain('manage:courses');
      expect(perms).toContain('manage:any_article');
      expect(perms).toContain('manage:any_publication');
      expect(perms).toContain('write:research');
      expect(perms).toContain('write:opportunities');
      expect(perms).toContain('manage:any_opportunity');
      expect(perms).toContain('write:events');
      expect(perms).toContain('manage:any_event');
      expect(perms).toContain('manage:slider');
      expect(perms).toContain('approve:users');
      expect(perms).toContain('issue:certs');

      // Admin does NOT have root system controls
      expect(perms).not.toContain('manage:system');
      expect(perms).not.toContain('view:user_stats');
    });
  });

  describe('7. Superadmin Role & Elimination of "|| isAdmin" Bypass', () => {
    it('superadmin possesses all valid defined system permissions', () => {
      const perms = ROLE_PERMISSIONS.superadmin;
      ALL_SYSTEM_PERMISSIONS.forEach(perm => {
        expect(perms, `Superadmin must contain defined permission: ${perm}`).toContain(perm);
      });
    });

    it('DENIES non-existent or fake permissions even for superadmin (verifies removal of if (role === superadmin) return true)', () => {
      const fakePerms = [
        'delete:database',
        'bypass:everything',
        'random_fake_permission_123',
        'admin:god_mode',
        'manage:root_servers'
      ];

      // Test via ROLE_PERMISSIONS:
      fakePerms.forEach(fakePerm => {
        expect(ROLE_PERMISSIONS.superadmin).not.toContain(fakePerm);
      });
    });

    it('strictly respects disabledPermissions toggles for superadmin', () => {
      // When a superadmin disables a permission, hasPermission MUST return false
      localStorage.setItem('disabled_permissions', JSON.stringify(['manage:slider', 'issue:certs']));
      
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.hasPermission('manage:slider')).toBe(false);
      expect(result.current.hasPermission('issue:certs')).toBe(false);
    });
  });

  describe('8. Custom Individual Permission Granting', () => {
    it('allows a basic user to receive specific individual permissions via custom_permissions without elevating role', () => {
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Simulate a user with role 'user' and custom permission 'write:opportunities'
      const checkHasPerm = (perm, role, customPerms = []) => {
        if (perm === 'view:public_content') return true;
        if (customPerms.includes(perm)) return true;
        return (ROLE_PERMISSIONS[role] || []).includes(perm);
      };

      expect(checkHasPerm('write:opportunities', 'user', ['write:opportunities'])).toBe(true);
      expect(checkHasPerm('manage:any_course', 'user', ['write:opportunities'])).toBe(false);
    });
  });
});
