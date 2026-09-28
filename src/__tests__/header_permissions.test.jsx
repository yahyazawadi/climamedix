import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { Header } from '../features/main/components/Header';
import * as AuthModule from '../features/auth/hooks/useAuth';

describe('Header Permissions & Reactive Menu Test Suite', () => {
  const mockUser = { id: 'usr-123', email: 'admin@climamedix.org' };
  const mockProfile = { id: 'usr-123', full_name: 'Dr. Sarah', role: 'superadmin' };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders all admin links when all permissions are granted for superadmin', () => {
    vi.spyOn(AuthModule, 'useAuth').mockReturnValue({
      disabledPermissions: [],
      togglePermission: vi.fn(),
      hasPermission: (perm) => true,
      user: mockUser,
      userProfile: mockProfile,
    });

    render(
      <Header 
        lang="ar" 
        user={mockUser} 
        userProfile={mockProfile} 
        onNavigate={vi.fn()} 
      />
    );

    // Open profile dropdown by clicking avatar/profile trigger
    const profileTrigger = document.querySelector('.user-profile-dropdown-container');
    fireEvent.click(profileTrigger);

    // Check all admin links are present (in both desktop and mobile drawer)
    expect(screen.getAllByText('إدارة المستخدمين').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('منشئ المساقات').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('إدارة الرئيسية').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('الإحصائيات').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('تدقيق الشهادات').length).toBeGreaterThanOrEqual(1);
  });

  it('instantly hides Course Builder link when manage:any_course is disabled', () => {
    // Simulate manage:any_course being disabled
    vi.spyOn(AuthModule, 'useAuth').mockReturnValue({
      disabledPermissions: ['manage:any_course', 'manage:courses'],
      togglePermission: vi.fn(),
      hasPermission: (perm) => {
        if (perm === 'manage:any_course' || perm === 'manage:courses' || perm === 'write:courses') return false;
        return true;
      },
      user: mockUser,
      userProfile: mockProfile,
    });

    render(
      <Header 
        lang="ar" 
        user={mockUser} 
        userProfile={mockProfile} 
        onNavigate={vi.fn()} 
      />
    );

    const profileTrigger = document.querySelector('.user-profile-dropdown-container');
    fireEvent.click(profileTrigger);

    // Course builder must NOT be present anywhere (desktop or drawer)
    expect(screen.queryAllByText('منشئ المساقات')).toHaveLength(0);
    // Other links should still be visible
    expect(screen.getAllByText('إدارة المستخدمين').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('الإحصائيات').length).toBeGreaterThanOrEqual(1);
  });

  it('instantly hides Statistics link when view:user_stats is disabled', () => {
    vi.spyOn(AuthModule, 'useAuth').mockReturnValue({
      disabledPermissions: ['view:user_stats'],
      togglePermission: vi.fn(),
      hasPermission: (perm) => perm !== 'view:user_stats',
      user: mockUser,
      userProfile: mockProfile,
    });

    render(
      <Header 
        lang="ar" 
        user={mockUser} 
        userProfile={mockProfile} 
        onNavigate={vi.fn()} 
      />
    );

    const profileTrigger = document.querySelector('.user-profile-dropdown-container');
    fireEvent.click(profileTrigger);

    expect(screen.queryAllByText('الإحصائيات')).toHaveLength(0);
    expect(screen.getAllByText('منشئ المساقات').length).toBeGreaterThanOrEqual(1);
  });

  it('instantly hides Cert Audit link when issue:certs and manage:system are disabled', () => {
    vi.spyOn(AuthModule, 'useAuth').mockReturnValue({
      disabledPermissions: ['issue:certs', 'manage:system'],
      togglePermission: vi.fn(),
      hasPermission: (perm) => !['issue:certs', 'manage:system'].includes(perm),
      user: mockUser,
      userProfile: mockProfile,
    });

    render(
      <Header 
        lang="ar" 
        user={mockUser} 
        userProfile={mockProfile}
        onNavigate={vi.fn()} 
      />
    );

    const profileTrigger = document.querySelector('.user-profile-dropdown-container');
    fireEvent.click(profileTrigger);

    expect(screen.queryAllByText('تدقيق الشهادات')).toHaveLength(0);
  });

  describe('Multi-Role Badge Rendering', () => {
    const rolesToTest = [
      { role: 'superadmin', expectedText: 'مسؤول خارق' },
      { role: 'admin', expectedText: 'مسؤول' },
      { role: 'educator', expectedText: 'مثقف صحي' },
      { role: 'researcher', expectedText: 'باحث علمي' },
      { role: 'subscriber', expectedText: 'مشترك' },
      { role: 'user', expectedText: 'مستخدم' }
    ];

    rolesToTest.forEach(({ role, expectedText }) => {
      it(`renders correct badge "${expectedText}" for role "${role}" in desktop dropdown`, () => {
        const testProfile = { ...mockProfile, role };

        vi.spyOn(AuthModule, 'useAuth').mockReturnValue({
          disabledPermissions: [],
          togglePermission: vi.fn(),
          hasPermission: () => true,
          user: mockUser,
          userProfile: testProfile,
        });

        render(
          <Header 
            lang="ar" 
            user={mockUser} 
            userProfile={testProfile} 
            onNavigate={vi.fn()} 
          />
        );

        const profileTrigger = document.querySelector('.user-profile-dropdown-container');
        fireEvent.click(profileTrigger);

        // Both desktop dropdown badge and mobile drawer badge are rendered
        const badges = screen.getAllByText(expectedText);
        expect(badges.length).toBe(2);
      });
    });
  });
});
