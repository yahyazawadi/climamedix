import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/preact';
import { AuthProvider, useAuth, evaluatePermission } from '../features/auth/hooks/useAuth';

describe('Two-Tier Content Gating & Security Invariants Matrix (49 Tests)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('1. Two-Tier Content Gating: Articles (7 Tests)', () => {
    const roles = ['guest', 'user', 'subscriber', 'researcher', 'educator', 'admin', 'superadmin'];

    roles.forEach(role => {
      it(`[${role}] article access: teaser view:public_content vs full view:all_articles`, () => {
        const canViewTeaser = evaluatePermission('view:public_content', role === 'guest' ? null : role);
        const canViewFull = evaluatePermission('view:all_articles', role === 'guest' ? null : role);

        // All users and guests can view public teasers
        expect(canViewTeaser).toBe(true);

        // Only paid subscribers, researchers, educators, admins, superadmins can view full articles
        const expectedFull = ['subscriber', 'researcher', 'educator', 'admin', 'superadmin'].includes(role);
        expect(canViewFull).toBe(expectedFull);
      });
    });
  });

  describe('2. Two-Tier Content Gating: Courses (7 Tests)', () => {
    const roles = ['guest', 'user', 'subscriber', 'researcher', 'educator', 'admin', 'superadmin'];

    roles.forEach(role => {
      it(`[${role}] course access: teaser view:public_content vs full view:all_courses`, () => {
        const canViewTeaser = evaluatePermission('view:public_content', role === 'guest' ? null : role);
        const canViewFull = evaluatePermission('view:all_courses', role === 'guest' ? null : role);

        expect(canViewTeaser).toBe(true);
        const expectedFull = ['subscriber', 'researcher', 'educator', 'admin', 'superadmin'].includes(role);
        expect(canViewFull).toBe(expectedFull);
      });
    });
  });

  describe('3. Two-Tier Content Gating: Research Papers (7 Tests)', () => {
    const roles = ['guest', 'user', 'subscriber', 'researcher', 'educator', 'admin', 'superadmin'];

    roles.forEach(role => {
      it(`[${role}] research access: teaser view:public_content vs full view:all_research`, () => {
        const canViewTeaser = evaluatePermission('view:public_content', role === 'guest' ? null : role);
        const canViewFull = evaluatePermission('view:all_research', role === 'guest' ? null : role);

        expect(canViewTeaser).toBe(true);
        const expectedFull = ['subscriber', 'researcher', 'educator', 'admin', 'superadmin'].includes(role);
        expect(canViewFull).toBe(expectedFull);
      });
    });
  });

  describe('4. Free Content vs Public Content Tiering (7 Tests)', () => {
    const roles = ['guest', 'user', 'subscriber', 'researcher', 'educator', 'admin', 'superadmin'];

    roles.forEach(role => {
      it(`[${role}] free content tiering: view:free_content requires at least registered user`, () => {
        const canViewFree = evaluatePermission('view:free_content', role === 'guest' ? null : role);
        // Guests cannot access authenticated free tier, all registered users can
        const expectedFree = role !== 'guest';
        expect(canViewFree).toBe(expectedFree);
      });
    });
  });

  describe('5. Authoring vs Administrative Management Gating (9 Tests)', () => {
    it('1. researcher can author courses but cannot manage any course', () => {
      expect(evaluatePermission('write:courses', 'researcher')).toBe(true);
      expect(evaluatePermission('manage:any_course', 'researcher')).toBe(false);
    });

    it('2. educator can author events but cannot manage any event', () => {
      expect(evaluatePermission('write:events', 'educator')).toBe(true);
      expect(evaluatePermission('manage:any_event', 'educator')).toBe(false);
    });

    it('3. researcher cannot review posts', () => {
      expect(evaluatePermission('review:posts', 'researcher')).toBe(false);
    });

    it('4. educator cannot issue certificates', () => {
      expect(evaluatePermission('issue:certs', 'educator')).toBe(false);
    });

    it('5. admin can approve users but standard user cannot', () => {
      expect(evaluatePermission('approve:users', 'admin')).toBe(true);
      expect(evaluatePermission('approve:users', 'user')).toBe(false);
    });

    it('6. admin can edit news map but standard user cannot', () => {
      expect(evaluatePermission('edit:news_map', 'admin')).toBe(true);
      expect(evaluatePermission('edit:news_map', 'user')).toBe(false);
    });

    it('7. admin can manage slider but researcher cannot', () => {
      expect(evaluatePermission('manage:slider', 'admin')).toBe(true);
      expect(evaluatePermission('manage:slider', 'researcher')).toBe(false);
    });

    it('8. superadmin can manage system root but admin cannot', () => {
      expect(evaluatePermission('manage:system', 'superadmin')).toBe(true);
      expect(evaluatePermission('manage:system', 'admin')).toBe(false);
    });

    it('9. superadmin can view user statistics but admin cannot', () => {
      expect(evaluatePermission('view:user_stats', 'superadmin')).toBe(true);
      expect(evaluatePermission('view:user_stats', 'admin')).toBe(false);
    });
  });

  describe('6. Security Invariants, Input Sanitization & Attack Resistance (12 Tests)', () => {
    it('1. evaluatePermission with null permission returns true (unrestricted component)', () => {
      expect(evaluatePermission(null, 'user')).toBe(true);
    });

    it('2. evaluatePermission with empty string permission returns true', () => {
      expect(evaluatePermission('', 'user')).toBe(true);
    });

    it('3. evaluatePermission with undefined permission returns true', () => {
      expect(evaluatePermission(undefined, 'user')).toBe(true);
    });

    it('4. SQL Injection payload in permission returns false even for superadmin', () => {
      const sqlPayload = "write:articles'; DROP TABLE profiles; --";
      expect(evaluatePermission(sqlPayload, 'superadmin')).toBe(false);
    });

    it('5. XSS Script tag in permission returns false even for superadmin', () => {
      const xssPayload = '<script>alert("xss")</script>';
      expect(evaluatePermission(xssPayload, 'superadmin')).toBe(false);
    });

    it('6. Wildcard permission "*" is denied (no wildcard escalation)', () => {
      expect(evaluatePermission('*', 'superadmin')).toBe(false);
      expect(evaluatePermission('*:*', 'superadmin')).toBe(false);
    });

    it('7. Case sensitivity: uppercase "MANAGE:SYSTEM" is denied (strict naming)', () => {
      expect(evaluatePermission('MANAGE:SYSTEM', 'superadmin')).toBe(false);
    });

    it('8. Arbitrary non-permission string "true" is denied', () => {
      expect(evaluatePermission('true', 'user')).toBe(false);
    });

    it('9. Role prototype pollution payload is safely rejected', () => {
      expect(evaluatePermission('manage:system', '__proto__')).toBe(false);
      expect(evaluatePermission('manage:system', 'constructor')).toBe(false);
    });

    it('10. Passing null custom_permissions does not throw and denies cleanly', () => {
      expect(() => evaluatePermission('manage:system', 'user', null, [])).not.toThrow();
      expect(evaluatePermission('manage:system', 'user', null, [])).toBe(false);
    });

    it('11. Passing null disabledPermissions does not throw and evaluates cleanly', () => {
      expect(() => evaluatePermission('view:public_content', 'user', [], null)).not.toThrow();
      expect(evaluatePermission('view:public_content', 'user', [], null)).toBe(true);
    });

    it('12. Hook layer: malformed permission passed to hasPermission returns false safely', () => {
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.hasPermission('RANDOM_ATTACK_STRING')).toBe(false);
      expect(result.current.hasPermission('../../etc/passwd')).toBe(false);
    });
  });
});
