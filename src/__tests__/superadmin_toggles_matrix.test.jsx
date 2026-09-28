import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/preact';
import { AuthProvider, useAuth, ALL_SYSTEM_PERMISSIONS, evaluatePermission } from '../features/auth/hooks/useAuth';

describe('Superadmin Interactive Toggles & No-Bypass Matrix (75 Tests across 25 Permissions)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  ALL_SYSTEM_PERMISSIONS.forEach(permission => {
    describe(`Superadmin Toggle: "${permission}"`, () => {
      // Test 1: Active by default in Superadmin
      it(`[Active by Default] superadmin initially possesses "${permission}"`, () => {
        // Direct evaluatePermission check
        expect(evaluatePermission(permission, 'superadmin', [], [])).toBe(true);

        // React Hook & Provider check with initialDevAdmin
        const wrapper = ({ children }) => (
          <AuthProvider initialDevAdmin={true}>
            {children}
          </AuthProvider>
        );

        const { result } = renderHook(() => useAuth(), { wrapper });
        expect(result.current.hasPermission(permission)).toBe(true);
      });

      // Test 2: Disable toggle strictly returns false (No Bypass!)
      it(`[Strict Disable / No Bypass] returns false for "${permission}" when disabled in superadmin panel`, () => {
        // Direct evaluatePermission check
        expect(evaluatePermission(permission, 'superadmin', [], [permission])).toBe(false);

        // React Hook & Provider check with localStorage override
        localStorage.setItem('disabled_permissions', JSON.stringify([permission]));

        const wrapper = ({ children }) => (
          <AuthProvider initialDevAdmin={true}>
            {children}
          </AuthProvider>
        );

        const { result } = renderHook(() => useAuth(), { wrapper });
        expect(result.current.disabledPermissions).toContain(permission);
        expect(result.current.hasPermission(permission)).toBe(false);
      });

      // Test 3: Interactive Re-enable toggles back on
      it(`[Interactive Re-enable] toggling "${permission}" re-activates it and updates localStorage`, () => {
        const wrapper = ({ children }) => (
          <AuthProvider initialDevAdmin={true}>
            {children}
          </AuthProvider>
        );

        const { result } = renderHook(() => useAuth(), { wrapper });

        // Step A: Toggle off
        act(() => {
          result.current.togglePermission(permission);
        });
        expect(result.current.disabledPermissions).toContain(permission);
        expect(result.current.hasPermission(permission)).toBe(false);
        expect(JSON.parse(localStorage.getItem('disabled_permissions') || '[]')).toContain(permission);

        // Step B: Toggle back on
        act(() => {
          result.current.togglePermission(permission);
        });
        expect(result.current.disabledPermissions).not.toContain(permission);
        expect(result.current.hasPermission(permission)).toBe(true);
        expect(JSON.parse(localStorage.getItem('disabled_permissions') || '[]')).not.toContain(permission);
      });
    });
  });
});
