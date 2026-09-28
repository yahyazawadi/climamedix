import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { UserManagementDashboard } from '../features/admin/components/UserManagementDashboard';
import { UserStatsDashboard } from '../features/admin/components/UserStatsDashboard';
import { supabase } from '../utils/supabaseClient';

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('../features/auth/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
  ROLE_PERMISSIONS: {
    user: ['view:public_content', 'view:free_content'],
    subscriber: ['view:public_content', 'view:free_content', 'view:all_courses'],
    admin: ['view:public_content', 'view:free_content', 'view:all_courses', 'manage:courses', 'manage:system']
  }
}));

// Mock Supabase
vi.mock('../utils/supabaseClient', () => {
  const mockFrom = vi.fn();
  const mockRpc = vi.fn();
  return {
    supabase: {
      from: mockFrom,
      rpc: mockRpc
    }
  };
});

describe('Stage 1 & Admin: Admin Dashboards Permissions & Safety Guards Test Suite', () => {
  const mockProfiles = [
    {
      id: 'prof-super',
      full_name: 'Super Admin User',
      email: 'super@climamedix.org',
      role: 'superadmin',
      created_at: '2026-01-01T00:00:00Z',
      online: true,
      country: 'Saudi Arabia',
      profession: 'System Architect'
    },
    {
      id: 'prof-user',
      full_name: 'Regular Student',
      email: 'student@climamedix.org',
      role: 'user',
      created_at: '2026-02-01T00:00:00Z',
      online: false,
      country: 'Egypt',
      profession: 'Medical Student'
    }
  ];

  const mockPermissions = [
    { id: 'p-1', perm_key: 'manage:system', description: 'Superadmin control' },
    { id: 'p-2', perm_key: 'manage:courses', description: 'Course management' },
    { id: 'p-3', perm_key: 'view:all_courses', description: 'View courses' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn();
    window.prompt = vi.fn();
  });

  describe('1. UserManagementDashboard (Gated by manage:system)', () => {
    it('DENIES access to unauthorized users lacking manage:system', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'prof-user' },
        hasPermission: (perm) => perm !== 'manage:system',
        loading: false
      });

      render(<UserManagementDashboard lang="ar" onNavigate={vi.fn()} />);

      expect(screen.getByText('غير مصرح لك')).toBeInTheDocument();
      expect(screen.queryByText('إدارة المستخدمين والصلاحيات')).toBeNull();
    });

    it('ALLOWS access to superadmin with manage:system and displays profiles list', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'prof-super' },
        hasPermission: (perm) => perm === 'manage:system',
        loading: false
      });

      supabase.from.mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockProfiles,
                error: null
              })
            })
          };
        }
        if (table === 'permissions') {
          return {
            select: vi.fn().mockResolvedValue({
              data: mockPermissions,
              error: null
            })
          };
        }
        return { select: vi.fn().mockReturnThis() };
      });

      render(<UserManagementDashboard lang="ar" onNavigate={vi.fn()} />);

      expect(await screen.findByText('إدارة المستخدمين والصلاحيات')).toBeInTheDocument();
      expect(screen.getByText('Super Admin User')).toBeInTheDocument();
      expect(screen.getByText('Regular Student')).toBeInTheDocument();
    });

    it('Superadmin Promotion Safety Check: Blocks promotion if confirmation email does not match', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'prof-super' },
        hasPermission: (perm) => perm === 'manage:system',
        loading: false
      });

      supabase.from.mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockProfiles,
                error: null
              })
            })
          };
        }
        if (table === 'permissions') {
          return {
            select: vi.fn().mockResolvedValue({
              data: mockPermissions,
              error: null
            })
          };
        }
        if (table === 'user_permissions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null })
            })
          };
        }
        return { select: vi.fn().mockReturnThis() };
      });

      render(<UserManagementDashboard lang="ar" onNavigate={vi.fn()} />);

      // Wait for table to load
      await screen.findByText('Regular Student');

      // Click on "إدارة الوصول" (Manage Access) for the regular user
      const manageBtn = screen.getByText('إدارة الوصول');
      fireEvent.click(manageBtn);

      // Drawer opens; click on role selector dropdown
      const roleTrigger = document.querySelector('.umd-role-select-trigger');
      fireEvent.click(roleTrigger);

      // Select 'superadmin' role from options
      const superadminOption = screen.getByText('superadmin', { selector: '.umd-role-option span' });
      fireEvent.click(superadminOption);

      // Prompt wrong email
      window.prompt.mockReturnValueOnce('wrong-email@test.com');

      // Click save permissions
      const saveBtn = screen.getByText('حفظ الصلاحيات');
      fireEvent.click(saveBtn);

      // Verification of safety block
      expect(window.prompt).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith('البريد الإلكتروني غير متطابق. تم الإلغاء.');
      // Supabase RPC or update must NOT be called
      expect(supabase.rpc).not.toHaveBeenCalled();
    });
  });

  describe('2. UserStatsDashboard (Gated by view:user_stats)', () => {
    it('DENIES access to unauthorized users lacking view:user_stats', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'u-1' },
        hasPermission: (perm) => false,
        loading: false
      });

      render(<UserStatsDashboard lang="ar" />);

      expect(screen.getByText('غير مصرح لك بعرض الإحصائيات')).toBeInTheDocument();
      expect(screen.queryByText('إحصائيات النظام')).toBeNull();
    });

    it('ALLOWS access and computes metrics when user has view:user_stats', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'admin-1' },
        hasPermission: (perm) => perm === 'view:user_stats',
        loading: false
      });

      supabase.from.mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockProfiles,
                error: null
              })
            })
          };
        }
        return { select: vi.fn().mockReturnThis() };
      });

      render(<UserStatsDashboard lang="ar" />);

      expect(await screen.findByText('إحصائيات النظام')).toBeInTheDocument();
      expect(screen.getByText('نظرة شاملة على بيانات المستخدمين')).toBeInTheDocument();

      // Total users count should appear
      expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
      // Active sessions count should appear
      expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
    });
  });
});
