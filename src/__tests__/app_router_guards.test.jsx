import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { AppRouter } from '../AppRouter';
import * as AuthModule from '../features/auth/hooks/useAuth';

describe('AppRouter Route Guards Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('blocks unauthorized users from entering Course Builder with Access Denied', () => {
    vi.spyOn(AuthModule, 'useAuth').mockReturnValue({
      hasPermission: (perm) => false,
      loading: false,
      user: null,
      userProfile: null,
    });

    render(
      <AppRouter 
        currentView="admin-courses" 
        lang="ar" 
        setCurrentView={vi.fn()} 
        setOpenedModal={vi.fn()} 
        navigate={vi.fn()} 
      />
    );

    expect(screen.getByText('غير مصرح بالدخول')).toBeInTheDocument();
    expect(screen.getByText('العودة للرئيسية')).toBeInTheDocument();
    expect(screen.queryByText('منشئ ومنظم المساقات')).toBeNull();
  });

  it('allows authorized course managers to view Course Builder', () => {
    vi.spyOn(AuthModule, 'useAuth').mockReturnValue({
      hasPermission: (perm) => ['manage:any_course', 'manage:courses', 'write:courses'].includes(perm),
      loading: false,
      user: { id: 'admin-1' },
      userProfile: { role: 'admin' },
    });

    render(
      <AppRouter 
        currentView="admin-courses" 
        lang="ar" 
        setCurrentView={vi.fn()} 
        setOpenedModal={vi.fn()} 
        navigate={vi.fn()} 
      />
    );

    expect(screen.queryByText('غير مصرح بالدخول')).toBeNull();
    expect(screen.getByText('منشئ ومنظم المساقات')).toBeInTheDocument();
  });

  it('blocks unauthorized users from entering User Management Dashboard', () => {
    vi.spyOn(AuthModule, 'useAuth').mockReturnValue({
      hasPermission: (perm) => false,
      loading: false,
      user: null,
      userProfile: null,
    });

    render(
      <AppRouter 
        currentView="admin-users" 
        lang="ar" 
        setCurrentView={vi.fn()} 
        setOpenedModal={vi.fn()} 
        navigate={vi.fn()} 
      />
    );

    expect(screen.getByText('غير مصرح بالدخول')).toBeInTheDocument();
  });

  it('blocks unauthorized users from entering Statistics Dashboard', () => {
    vi.spyOn(AuthModule, 'useAuth').mockReturnValue({
      hasPermission: (perm) => false,
      loading: false,
      user: null,
      userProfile: null,
    });

    render(
      <AppRouter 
        currentView="admin-stats" 
        lang="ar" 
        setCurrentView={vi.fn()} 
        setOpenedModal={vi.fn()} 
        navigate={vi.fn()} 
      />
    );

    expect(screen.getByText('غير مصرح بالدخول')).toBeInTheDocument();
  });
});
