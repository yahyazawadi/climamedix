import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/preact';
import { AuthProvider, useAuth, ROLE_PERMISSIONS, ALL_SYSTEM_PERMISSIONS, evaluatePermission } from '../features/auth/hooks/useAuth';

/**
 * Exact permissions map per role for ground-truth assertion
 */
const EXPECTED_PERMISSIONS = {
  guest: ['view:public_content'],
  user: ['view:public_content', 'view:free_content', 'apply:specialized_roles'],
  subscriber: ['view:public_content', 'view:free_content', 'view:all_courses', 'view:all_articles', 'view:all_research', 'apply:specialized_roles'],
  researcher: ['view:public_content', 'view:free_content', 'view:all_courses', 'view:all_articles', 'view:all_research', 'write:research', 'write:courses', 'write:articles'],
  educator: ['view:public_content', 'view:free_content', 'view:all_courses', 'view:all_articles', 'view:all_research', 'write:events', 'write:articles'],
  admin: [
    'view:public_content', 'view:free_content', 'view:all_courses', 'view:all_articles', 'view:all_research',
    'write:articles', 'manage:any_course', 'manage:courses', 'manage:any_article', 'manage:any_publication',
    'write:research', 'approve:users', 'issue:certs', 'review:posts', 'write:opportunities', 'manage:any_opportunity',
    'write:events', 'manage:any_event', 'write:courses', 'view:join_requests', 'edit:news_map', 'manage:slider'
  ],
  superadmin: ALL_SYSTEM_PERMISSIONS
};

const ROLES = ['guest', 'user', 'subscriber', 'researcher', 'educator', 'admin', 'superadmin'];

describe('Comprehensive 175-Test Role-Permission Matrix Grid', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // 7 roles x 25 permissions = 175 individually tracked test cases
  ROLES.forEach(role => {
    describe(`Role: ${role.toUpperCase()}`, () => {
      ALL_SYSTEM_PERMISSIONS.forEach(permission => {
        const expectedAllowed = EXPECTED_PERMISSIONS[role].includes(permission);

        it(`[${role}] permission check for "${permission}" -> ${expectedAllowed ? 'ALLOWED' : 'DENIED'}`, () => {
          const roleForEval = role === 'guest' ? null : role;

          // 1. Direct evaluatePermission test
          const directResult = evaluatePermission(permission, roleForEval);
          expect(directResult).toBe(expectedAllowed);

          // 2. React Context & Hook test
          const initialProfile = role === 'guest' ? null : {
            id: `user-${role}`,
            email: `${role}@climamedix.org`,
            role: role
          };

          const wrapper = ({ children }) => (
            <AuthProvider initialProfile={initialProfile}>
              {children}
            </AuthProvider>
          );

          const { result } = renderHook(() => useAuth(), { wrapper });
          expect(result.current.hasPermission(permission)).toBe(expectedAllowed);
        });
      });
    });
  });
});
