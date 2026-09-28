import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/preact';
import { AuthProvider, useAuth, ROLE_PERMISSIONS, ALL_SYSTEM_PERMISSIONS, evaluatePermission } from '../features/auth/hooks/useAuth';

describe('Custom Permissions Override Matrix (75 Tests across 25 Permissions)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  ALL_SYSTEM_PERMISSIONS.forEach(permission => {
    describe(`Permission: "${permission}"`, () => {
      const isBaseUserPerm = (ROLE_PERMISSIONS.user || []).includes(permission);

      // Test 1: Explicit Grant via custom_permissions
      it(`[Grant] overrides base role and allows "${permission}" when explicitly granted in custom_permissions`, () => {
        // Direct evaluation
        const directGranted = evaluatePermission(permission, 'user', [permission], []);
        expect(directGranted).toBe(true);

        // Hook & Provider evaluation
        const initialProfile = {
          id: 'custom-grant-user',
          email: 'custom@climamedix.org',
          role: 'user',
          custom_permissions: [permission]
        };

        const wrapper = ({ children }) => (
          <AuthProvider initialProfile={initialProfile}>
            {children}
          </AuthProvider>
        );

        const { result } = renderHook(() => useAuth(), { wrapper });
        expect(result.current.hasPermission(permission)).toBe(true);
      });

      // Test 2: Standard Baseline without custom_permissions
      it(`[Baseline] denies elevated access for "${permission}" when custom_permissions is empty`, () => {
        const directDefault = evaluatePermission(permission, 'user', [], []);
        expect(directDefault).toBe(isBaseUserPerm);

        const initialProfile = {
          id: 'standard-user',
          email: 'standard@climamedix.org',
          role: 'user',
          custom_permissions: []
        };

        const wrapper = ({ children }) => (
          <AuthProvider initialProfile={initialProfile}>
            {children}
          </AuthProvider>
        );

        const { result } = renderHook(() => useAuth(), { wrapper });
        expect(result.current.hasPermission(permission)).toBe(isBaseUserPerm);
      });

      // Test 3: Revocation lifecycle
      it(`[Revocation] immediately revokes access for "${permission}" when removed from custom_permissions`, () => {
        // Initial state with grant
        let currentCustomPerms = [permission];
        expect(evaluatePermission(permission, 'user', currentCustomPerms, [])).toBe(true);

        // Revoke permission: simulate profile update where permission was removed
        currentCustomPerms = [];
        const afterRevocation = evaluatePermission(permission, 'user', currentCustomPerms, []);
        expect(afterRevocation).toBe(isBaseUserPerm);
      });
    });
  });
});
