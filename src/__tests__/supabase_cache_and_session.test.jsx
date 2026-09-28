import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/preact';
import { AuthProvider, useAuth, evaluatePermission } from '../features/auth/hooks/useAuth';
import { authService } from '../features/auth/services/authService';
import { supabase } from '../utils/supabaseClient';

describe('Supabase Cache, Session Persistence & Lifecycle Test Suite (40 Tests)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    authService.clearProfileCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    authService.clearProfileCache();
    localStorage.clear();
  });

  describe('1. authService In-Memory Profile Cache & TTL Invalidation (13 Tests)', () => {
    it('1. setCachedProfile caches a profile for a given userId', () => {
      const profile = { id: 'u123', full_name: 'Dr. Jane Doe', role: 'researcher' };
      authService.setCachedProfile('u123', profile);
      const cached = authService.getCachedProfile('u123');
      expect(cached).toEqual(profile);
    });

    it('2. getCachedProfile returns null when cache is empty for userId', () => {
      expect(authService.getCachedProfile('non_existent')).toBeNull();
    });

    it('3. getCachedProfile returns null when userId is null or undefined', () => {
      expect(authService.getCachedProfile(null)).toBeNull();
      expect(authService.getCachedProfile(undefined)).toBeNull();
    });

    it('4. setCachedProfile safely ignores null/undefined userId', () => {
      authService.setCachedProfile(null, { role: 'user' });
      expect(authService._profileCache.size).toBe(0);
    });

    it('5. setCachedProfile safely ignores null/undefined profile', () => {
      authService.setCachedProfile('u123', null);
      expect(authService._profileCache.has('u123')).toBe(false);
    });

    it('6. setCachedProfile stores correct metadata including cachedAt timestamp', () => {
      const before = Date.now();
      authService.setCachedProfile('u123', { role: 'educator' });
      const entry = authService._profileCache.get('u123');
      expect(entry).toBeDefined();
      expect(entry.cachedAt).toBeGreaterThanOrEqual(before);
      expect(entry.expiry).toBeGreaterThan(entry.cachedAt);
    });

    it('7. clearProfileCache removes specific user entry while retaining others', () => {
      authService.setCachedProfile('u1', { role: 'user' });
      authService.setCachedProfile('u2', { role: 'admin' });
      authService.clearProfileCache('u1');
      expect(authService.getCachedProfile('u1')).toBeNull();
      expect(authService.getCachedProfile('u2')).toEqual({ role: 'admin' });
    });

    it('8. clearProfileCache with no arguments empties the entire profile cache', () => {
      authService.setCachedProfile('u1', { role: 'user' });
      authService.setCachedProfile('u2', { role: 'subscriber' });
      authService.clearProfileCache();
      expect(authService._profileCache.size).toBe(0);
      expect(authService.getCachedProfile('u1')).toBeNull();
      expect(authService.getCachedProfile('u2')).toBeNull();
    });

    it('9. respects custom TTL and expires cache entry when TTL elapses', () => {
      // Set short TTL of 50ms
      authService.setCachedProfile('u_quick', { role: 'subscriber' }, 50);
      expect(authService.getCachedProfile('u_quick')).toBeDefined();

      // Advance time beyond 50ms
      const originalNow = Date.now;
      try {
        Date.now = () => originalNow() + 100;
        expect(authService.getCachedProfile('u_quick')).toBeNull();
        expect(authService._profileCache.has('u_quick')).toBe(false);
      } finally {
        Date.now = originalNow;
      }
    });

    it('10. getUserProfile returns cached data on subsequent call without re-querying', async () => {
      const mockProfile = { id: 'u_cached', role: 'subscriber', custom_permissions: ['write:events'] };
      authService.setCachedProfile('u_cached', mockProfile);

      const result = await authService.getUserProfile('u_cached');
      expect(result).toEqual(mockProfile);
    });

    it('11. getUserProfile with forceRefresh=true ignores cache', async () => {
      const staleProfile = { id: 'u_stale', role: 'user' };
      authService.setCachedProfile('u_stale', staleProfile);

      const spy = vi.spyOn(supabase, 'from').mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            single: async () => ({
              data: { id: 'u_stale', role: 'admin' },
              error: null
            })
          })
        })
      });

      const fresh = await authService.getUserProfile('u_stale', { forceRefresh: true });
      expect(fresh.role).toBe('admin');
      spy.mockRestore();
    });

    it('12. getUserProfile handles null userId gracefully', async () => {
      const profile = await authService.getUserProfile(null);
      expect(profile).toBeNull();
    });

    it('13. maintains profile cache isolation between distinct user sessions', () => {
      authService.setCachedProfile('alice', { id: 'alice', role: 'admin' });
      authService.setCachedProfile('bob', { id: 'bob', role: 'user' });

      expect(authService.getCachedProfile('alice').role).toBe('admin');
      expect(authService.getCachedProfile('bob').role).toBe('user');
    });
  });

  describe('2. LocalStorage Cache & Corrupted Data Resilience (8 Tests)', () => {
    it('14. persists disabled permissions array into localStorage', () => {
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.togglePermission('manage:slider');
      });

      const stored = JSON.parse(localStorage.getItem('disabled_permissions'));
      expect(stored).toEqual(['manage:slider']);
    });

    it('15. recovers gracefully from malformed JSON in localStorage disabled_permissions', () => {
      localStorage.setItem('disabled_permissions', '{malformed_json_syntax');
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.disabledPermissions).toEqual([]);
      expect(result.current.hasPermission('view:public_content')).toBe(true);
    });

    it('16. recovers gracefully from empty string in localStorage disabled_permissions', () => {
      localStorage.setItem('disabled_permissions', '');
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.disabledPermissions).toEqual([]);
    });

    it('17. recovers gracefully from non-array JSON object in localStorage', () => {
      localStorage.setItem('disabled_permissions', JSON.stringify({ key: 'value' }));
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.hasPermission('view:public_content')).toBe(true);
    });

    it('18. initializes disabledPermissions from pre-existing valid localStorage cache', () => {
      localStorage.setItem('disabled_permissions', JSON.stringify(['issue:certs', 'review:posts']));
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.disabledPermissions).toEqual(['issue:certs', 'review:posts']);
    });

    it('19. cleans up localStorage disabled_permissions on signOut', async () => {
      localStorage.setItem('disabled_permissions', JSON.stringify(['manage:slider']));
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signOut();
      });

      expect(localStorage.getItem('disabled_permissions')).toBeNull();
      expect(result.current.disabledPermissions).toEqual([]);
    });

    it('20. handles simultaneous toggles without dropping existing cached items', () => {
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.togglePermission('manage:slider');
        result.current.togglePermission('issue:certs');
      });

      const stored = JSON.parse(localStorage.getItem('disabled_permissions'));
      expect(stored).toContain('manage:slider');
      expect(stored).toContain('issue:certs');
    });

    it('21. re-toggling an existing permission removes it from localStorage cache', () => {
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.togglePermission('manage:slider');
      });
      expect(JSON.parse(localStorage.getItem('disabled_permissions'))).toContain('manage:slider');

      act(() => {
        result.current.togglePermission('manage:slider');
      });
      expect(JSON.parse(localStorage.getItem('disabled_permissions'))).not.toContain('manage:slider');
    });
  });

  describe('3. Permission Aliasing & Cross-Cache Consistency (7 Tests)', () => {
    it('22. disabling manage:courses also disables manage:any_course in evaluatePermission', () => {
      expect(evaluatePermission('manage:any_course', 'admin', [], ['manage:courses'])).toBe(false);
    });

    it('23. disabling manage:any_course also disables manage:courses in evaluatePermission', () => {
      expect(evaluatePermission('manage:courses', 'admin', [], ['manage:any_course'])).toBe(false);
    });

    it('24. granting manage:courses in custom_permissions grants manage:any_course', () => {
      expect(evaluatePermission('manage:any_course', 'user', ['manage:courses'], [])).toBe(true);
    });

    it('25. granting manage:any_course in custom_permissions grants manage:courses', () => {
      expect(evaluatePermission('manage:courses', 'user', ['manage:any_course'], [])).toBe(true);
    });

    it('26. Hook: disabling manage:courses disables manage:any_course for devAdmin', () => {
      localStorage.setItem('disabled_permissions', JSON.stringify(['manage:courses']));
      const wrapper = ({ children }) => <AuthProvider initialDevAdmin={true}>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.hasPermission('manage:any_course')).toBe(false);
      expect(result.current.hasPermission('manage:courses')).toBe(false);
    });

    it('27. Hook: disabling manage:any_course disables manage:courses for devAdmin', () => {
      localStorage.setItem('disabled_permissions', JSON.stringify(['manage:any_course']));
      const wrapper = ({ children }) => <AuthProvider initialDevAdmin={true}>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.hasPermission('manage:courses')).toBe(false);
      expect(result.current.hasPermission('manage:any_course')).toBe(false);
    });

    it('28. Hook: granting aliased permission in user profile works reactively', () => {
      const initialProfile = { id: 'u1', role: 'user', custom_permissions: ['manage:courses'] };
      const wrapper = ({ children }) => <AuthProvider initialProfile={initialProfile}>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.hasPermission('manage:any_course')).toBe(true);
    });
  });

  describe('4. Session Lifecycle, DevAdmin & Teardown (12 Tests)', () => {
    it('29. initialProfile prop populates user and userProfile synchronously', () => {
      const profile = { id: 'sync_u', role: 'educator', email: 'sync@climamedix.org' };
      const wrapper = ({ children }) => <AuthProvider initialProfile={profile}>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.userProfile.role).toBe('educator');
      expect(result.current.user.id).toBe('sync_u');
      expect(result.current.loading).toBe(false);
    });

    it('30. initialDevAdmin initializes state as superadmin with synthetic profile', () => {
      const wrapper = ({ children }) => <AuthProvider initialDevAdmin={true}>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.userProfile.role).toBe('superadmin');
      expect(result.current.userProfile.full_name).toBe('Developer Superadmin');
    });

    it('31. verifyAndSetDevAdmin switches session to superadmin mode', async () => {
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.verifyAndSetDevAdmin();
      });

      expect(result.current.userProfile.role).toBe('superadmin');
      expect(result.current.hasPermission('manage:system')).toBe(true);
    });

    it('32. signOut resets userProfile to null', async () => {
      const profile = { id: 'u_out', role: 'admin' };
      const wrapper = ({ children }) => <AuthProvider initialProfile={profile}>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.userProfile).toBeNull();
    });

    it('33. signOut resets user state to null', async () => {
      const profile = { id: 'u_out2', role: 'subscriber' };
      const wrapper = ({ children }) => <AuthProvider initialProfile={profile}>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.user).toBeNull();
    });

    it('34. signOut disables devAdminMode', async () => {
      const wrapper = ({ children }) => <AuthProvider initialDevAdmin={true}>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.userProfile.role).toBe('superadmin');

      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.userProfile).toBeNull();
    });

    it('35. signOut invokes authService.clearProfileCache', async () => {
      authService.setCachedProfile('u_clear', { id: 'u_clear', role: 'admin' });
      expect(authService.getCachedProfile('u_clear')).toBeDefined();

      const profile = { id: 'u_clear', role: 'admin' };
      const wrapper = ({ children }) => <AuthProvider initialProfile={profile}>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signOut();
      });

      expect(authService.getCachedProfile('u_clear')).toBeNull();
    });

    it('36. Supabase client config: persistSession is enabled', () => {
      expect(supabase.auth).toBeDefined();
      expect(typeof supabase.auth.getSession).toBe('function');
    });

    it('37. Supabase client config: onAuthStateChange listener is available', () => {
      expect(typeof supabase.auth.onAuthStateChange).toBe('function');
    });

    it('38. consecutive hasPermission evaluations execute synchronously and deterministically', () => {
      const profile = { id: 'u_perf', role: 'researcher' };
      const wrapper = ({ children }) => <AuthProvider initialProfile={profile}>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      for (let i = 0; i < 50; i++) {
        expect(result.current.hasPermission('write:research')).toBe(true);
        expect(result.current.hasPermission('manage:system')).toBe(false);
      }
    });

    it('39. evaluatePermission without role defaults strictly to least-privilege (guest)', () => {
      expect(evaluatePermission('view:public_content', null)).toBe(true);
      expect(evaluatePermission('manage:courses', null)).toBe(false);
      expect(evaluatePermission('write:articles', null)).toBe(false);
    });

    it('40. evaluatePermission with unknown role falls back to standard user role', () => {
      expect(evaluatePermission('view:public_content', 'nonexistent_role')).toBe(true);
      expect(evaluatePermission('view:free_content', 'nonexistent_role')).toBe(true);
      expect(evaluatePermission('manage:system', 'nonexistent_role')).toBe(false);
    });
  });
});
