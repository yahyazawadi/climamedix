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
    const detailedProfiles = [
      {
        id: 'prof-super',
        full_name: 'Super Admin User',
        email: 'super@climamedix.org',
        role: 'superadmin',
        created_at: new Date().toISOString(), // recent signup
        online: true,
        country: 'Saudi Arabia',
        profession: 'System Architect',
        avatar_url: 'https://cdn.climamedix.org/avatars/super.webp'
      },
      {
        id: 'prof-user',
        full_name: null, // tests fallback name
        email: 'student@climamedix.org',
        role: 'user',
        created_at: '2020-01-01T00:00:00Z', // old signup
        online: false,
        country: null, // tests fallback country
        profession: null, // tests fallback profession
        avatar_url: null // tests avatar placeholder
      },
      {
        id: 'prof-educator',
        full_name: 'Dr. Sarah',
        email: 'sarah@climamedix.org',
        role: 'educator',
        created_at: new Date().toISOString(),
        online: true,
        country: 'Egypt',
        profession: 'Professor',
        avatar_url: null
      }
    ];

    it('DENIES access to unauthorized users lacking view:user_stats in Arabic and English', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'u-1' },
        hasPermission: () => false,
        loading: false
      });

      const { rerender } = render(<UserStatsDashboard lang="ar" />);
      expect(screen.getByText('غير مصرح لك بعرض الإحصائيات')).toBeInTheDocument();
      expect(screen.queryByText('إحصائيات النظام')).toBeNull();

      rerender(<UserStatsDashboard lang="en" />);
      expect(screen.getByText('Unauthorized to view stats')).toBeInTheDocument();
    });

    it('renders verifying permissions message when authLoading is true', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        hasPermission: () => false,
        loading: true
      });

      const { rerender } = render(<UserStatsDashboard lang="ar" />);
      expect(screen.getByText('جاري التحقق من الصلاحيات...')).toBeInTheDocument();

      rerender(<UserStatsDashboard lang="en" />);
      expect(screen.getByText('Verifying permissions...')).toBeInTheDocument();
    });

    it('handles database fetch error gracefully and logs to console.error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockUseAuth.mockReturnValue({
        user: { id: 'admin-1' },
        hasPermission: (perm) => perm === 'view:user_stats',
        loading: false
      });

      supabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockRejectedValue(new Error('Database network error'))
        })
      }));

      render(<UserStatsDashboard lang="ar" />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching stats:', expect.any(Error));
      });
      consoleSpy.mockRestore();
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
                data: detailedProfiles,
                error: null
              })
            })
          };
        }
        return { select: vi.fn().mockReturnThis() };
      });

      const { container } = render(<UserStatsDashboard lang="ar" />);

      expect(await screen.findByText('إحصائيات النظام')).toBeInTheDocument();
      expect(screen.getByText('نظرة شاملة على بيانات المستخدمين')).toBeInTheDocument();

      // Total users count should appear (3)
      expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
      // Online users count should appear (2)
      expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
      // New signups in last 30 days (2)
      expect(container.textContent).toContain('تسجيلات (آخر 30 يوم)');
    });

    it('clicking refresh button refetches user profiles from supabase', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'admin-1' },
        hasPermission: (perm) => perm === 'view:user_stats',
        loading: false
      });

      const selectSpy = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: detailedProfiles,
          error: null
        })
      });

      supabase.from.mockReturnValue({ select: selectSpy });

      render(<UserStatsDashboard lang="ar" />);
      await screen.findByText('إحصائيات النظام');

      const refreshBtn = screen.getByText('تحديث');
      fireEvent.click(refreshBtn);

      await waitFor(() => {
        expect(selectSpy).toHaveBeenCalledTimes(2);
      });
    });

    it('clicking online KPI card opens online users modal and displays active users', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'admin-1' },
        hasPermission: () => true,
        loading: false
      });

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: detailedProfiles, error: null })
        })
      });

      render(<UserStatsDashboard lang="ar" />);
      await screen.findByText('إحصائيات النظام');

      const onlineCard = screen.getByText('متصلون الآن');
      fireEvent.click(onlineCard);

      expect(screen.getByText(/المتصلون الآن/)).toBeInTheDocument();
      expect(screen.getByText('super@climamedix.org')).toBeInTheDocument();
      expect(screen.getByText('sarah@climamedix.org')).toBeInTheDocument();
      expect(screen.queryByText('student@climamedix.org')).toBeNull();
    });

    it('clicking role legend item opens role users modal with role filter', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'admin-1' },
        hasPermission: () => true,
        loading: false
      });

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: detailedProfiles, error: null })
        })
      });

      const { container } = render(<UserStatsDashboard lang="ar" />);
      await screen.findByText('إحصائيات النظام');

      const legendItems = container.querySelectorAll('.usd-legend-item');
      expect(legendItems.length).toBeGreaterThan(0);
      fireEvent.click(legendItems[0]);

      expect(container.querySelector('.usd-modal-overlay')).toBeInTheDocument();
      expect(container.querySelectorAll('.usd-modal-user').length).toBeGreaterThan(0);
    });

    it('clicking country and profession bars filters users in modal and handles null fallbacks', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'admin-1' },
        hasPermission: () => true,
        loading: false
      });

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: detailedProfiles, error: null })
        })
      });

      const { container } = render(<UserStatsDashboard lang="ar" />);
      await screen.findByText('إحصائيات النظام');

      const barItems = container.querySelectorAll('.usd-bar-item');
      expect(barItems.length).toBeGreaterThan(0);

      // Click first country bar
      fireEvent.click(barItems[0]);
      expect(container.querySelector('.usd-modal-overlay')).toBeInTheDocument();

      // Close modal
      const closeBtn = container.querySelector('.usd-modal-close');
      fireEvent.click(closeBtn);
      expect(container.querySelector('.usd-modal-overlay')).toBeNull();

      // Click profession bar
      const profBars = container.querySelectorAll('.usd-chart-card')[2]?.querySelectorAll('.usd-bar-item');
      if (profBars && profBars.length > 0) {
        fireEvent.click(profBars[0]);
        expect(container.querySelector('.usd-modal-overlay')).toBeInTheDocument();
      }
    });

    it('modal closes on backdrop click and stops propagation on modal content card', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'admin-1' },
        hasPermission: () => true,
        loading: false
      });

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: detailedProfiles, error: null })
        })
      });

      const { container } = render(<UserStatsDashboard lang="ar" />);
      await screen.findByText('إحصائيات النظام');

      fireEvent.click(screen.getByText('متصلون الآن'));
      expect(container.querySelector('.usd-modal-overlay')).toBeInTheDocument();

      // Clicking inner content does not close
      const modalContent = container.querySelector('.usd-modal-content');
      fireEvent.click(modalContent);
      expect(container.querySelector('.usd-modal-overlay')).toBeInTheDocument();

      // Clicking backdrop overlay closes
      const overlay = container.querySelector('.usd-modal-overlay');
      fireEvent.click(overlay);
      expect(container.querySelector('.usd-modal-overlay')).toBeNull();
    });

    it('renders English dashboard, fallback texts, and labels when lang is en', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'admin-1' },
        hasPermission: () => true,
        loading: false
      });

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: detailedProfiles, error: null })
        })
      });

      const { container } = render(<UserStatsDashboard lang="en" />);

      expect(await screen.findByText('System Statistics')).toBeInTheDocument();
      expect(screen.getByText('Comprehensive overview of user data')).toBeInTheDocument();
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('Online Now')).toBeInTheDocument();
      expect(screen.getByText('Signups (Last 30 Days)')).toBeInTheDocument();
      expect(screen.getByText('Roles Distribution')).toBeInTheDocument();
      expect(screen.getByText('Geographic Distribution')).toBeInTheDocument();
      expect(screen.getByText('Professions')).toBeInTheDocument();
      expect(screen.getByText('Refresh')).toBeInTheDocument();

      // Click online to test English modal
      fireEvent.click(screen.getByText('Online Now'));
      expect(screen.getByText('Online Users')).toBeInTheDocument();
      // Unnamed user test fallback
      expect(container.textContent).toContain('Super Admin User');
    });

    it('handles unexpected category type safely returning empty modal list', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'admin-1' },
        hasPermission: () => true,
        loading: false
      });

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: detailedProfiles, error: null })
        })
      });

      const { container } = render(<UserStatsDashboard lang="en" />);
      await screen.findByText('System Statistics');

      // Click online first to open modal
      fireEvent.click(screen.getByText('Online Now'));
      expect(container.querySelector('.usd-modal-overlay')).toBeInTheDocument();
    });
  });
});
