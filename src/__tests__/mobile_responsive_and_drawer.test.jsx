import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/preact';
import { Header } from '../features/main/components/Header';

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('../features/auth/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
  ROLE_PERMISSIONS: {
    superadmin: [
      'view:public_content',
      'view:free_content',
      'view:all_courses',
      'view:all_articles',
      'view:all_research',
      'apply:specialized_roles',
      'write:research',
      'write:courses',
      'write:articles',
      'write:events',
      'manage:any_course',
      'manage:courses',
      'manage:any_article',
      'manage:any_publication',
      'approve:users',
      'issue:certs',
      'review:posts',
      'write:opportunities',
      'manage:any_opportunity',
      'manage:any_event',
      'view:join_requests',
      'edit:news_map',
      'manage:slider',
      'manage:system',
      'view:user_stats'
    ]
  }
}));

describe('📱 Suite 34: Mobile Responsive & Drawer Layout Matrix', () => {
  const defaultAuthContext = {
    disabledPermissions: [],
    togglePermission: vi.fn(),
    hasPermission: vi.fn(() => false)
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ ...defaultAuthContext });
    document.body.innerHTML = '';
    window.innerWidth = 390;
    window.innerHeight = 844;
  });

  const renderHeaderMobile = (props = {}) => {
    return render(
      <Header
        currentView="home"
        user={props.user !== undefined ? props.user : null}
        userProfile={props.userProfile !== undefined ? props.userProfile : null}
        onNavigate={props.onNavigate || vi.fn()}
        onOpenModal={props.onOpenModal || vi.fn()}
        lang={props.lang || 'ar'}
        toggleLanguage={props.toggleLanguage || vi.fn()}
        onLogout={props.onLogout || vi.fn()}
        {...props}
      />
    );
  };

  it('1. Renders mobile hamburger trigger and opens drawer on tap', () => {
    renderHeaderMobile();
    const hamburger = document.querySelector('.figma-hamburger-trigger');
    const drawer = document.querySelector('.mobile-drawer');

    expect(hamburger).toBeInTheDocument();
    expect(drawer).not.toHaveClass('open');

    // Click hamburger to open
    fireEvent.click(hamburger);
    expect(drawer).toHaveClass('open');
    expect(hamburger).toHaveClass('is-open');

    // Click backdrop overlay to dismiss
    const overlay = document.querySelector('.drawer-overlay');
    expect(overlay).toHaveClass('open');
    fireEvent.click(overlay);
    expect(drawer).not.toHaveClass('open');
  });

  it('2. Renders SuperAdmin quick links in a wrapped, responsive chip grid without overflow', () => {
    const mockUser = { id: 'super-yahya', email: 'super.yahyaaa@gmail.com' };
    const mockProfile = { full_name: 'Yahya Amoodi', role: 'superadmin', avatar_url: '' };
    mockUseAuth.mockReturnValue({
      disabledPermissions: [],
      togglePermission: vi.fn(),
      hasPermission: vi.fn(() => true)
    });

    renderHeaderMobile({ lang: 'ar', user: mockUser, userProfile: mockProfile });
    const hamburger = document.querySelector('.figma-hamburger-trigger');
    fireEvent.click(hamburger);

    const drawer = document.querySelector('.mobile-drawer');
    expect(drawer).toHaveClass('open');

    // Verify SuperAdmin badge and profile info
    expect(drawer.textContent).toContain('مسؤول خارق');
    expect(drawer.textContent).toContain('Yahya Amoodi');
    expect(drawer.textContent).toContain('super.yahyaaa@gmail.com');

    // Verify all quick action links exist
    const profileLink = drawer.querySelector('a[href="#profile"]');
    const controlLink = drawer.querySelector('a[href="#debug"]');
    const usersLink = drawer.querySelector('a[href="#admin-users"]');
    const statsLink = drawer.querySelector('a[href="#admin-stats"]');
    const certsLink = drawer.querySelector('a[href="#admin-certificates"]');
    const coursesLink = drawer.querySelector('a[href="#admin-courses"]');
    const logoutBtn = drawer.querySelector('a[href="#logout"]');

    expect(profileLink).toBeInTheDocument();
    expect(controlLink).toBeInTheDocument();
    expect(usersLink).toBeInTheDocument();
    expect(statsLink).toBeInTheDocument();
    expect(certsLink).toBeInTheDocument();
    expect(coursesLink).toBeInTheDocument();
    expect(logoutBtn).toBeInTheDocument();

    // Verify the links container has flexWrap: 'wrap' (the fix that prevents clipping!)
    const linksContainer = profileLink.parentElement;
    expect(linksContainer.style.display).toBe('flex');
    expect(linksContainer.style.flexWrap).toBe('wrap');
  });

  it('3. Renders bilingual labels for SuperAdmin in English LTR mode', () => {
    const mockUser = { id: 'super-yahya', email: 'super.yahyaaa@gmail.com' };
    const mockProfile = { full_name: 'Yahya Amoodi', role: 'superadmin', avatar_url: '' };
    mockUseAuth.mockReturnValue({
      disabledPermissions: [],
      togglePermission: vi.fn(),
      hasPermission: vi.fn(() => true)
    });

    renderHeaderMobile({ lang: 'en', user: mockUser, userProfile: mockProfile });
    const hamburger = document.querySelector('.figma-hamburger-trigger');
    fireEvent.click(hamburger);

    const drawer = document.querySelector('.mobile-drawer');
    expect(drawer.textContent).toContain('Super Admin');
    expect(drawer.querySelector('a[href="#profile"]').textContent).toBe('Profile');
    expect(drawer.querySelector('a[href="#debug"]').textContent).toBe('Control');
    expect(drawer.querySelector('a[href="#admin-users"]').textContent).toBe('Users');
    expect(drawer.querySelector('a[href="#admin-stats"]').textContent).toBe('Stats');
    expect(drawer.querySelector('a[href="#admin-certificates"]').textContent).toBe('Certs');
    expect(drawer.querySelector('a[href="#admin-courses"]').textContent).toBe('Course Builder');
  });

  it('4. Closes drawer automatically when navigation links are clicked', () => {
    const onNavigate = vi.fn();
    renderHeaderMobile({ onNavigate });

    const hamburger = document.querySelector('.figma-hamburger-trigger');
    fireEvent.click(hamburger);

    const drawer = document.querySelector('.mobile-drawer');
    expect(drawer).toHaveClass('open');

    // Click Learning Hub link
    const coursesLink = drawer.querySelector('a[href="#learning-hub"]');
    fireEvent.click(coursesLink);

    expect(onNavigate).toHaveBeenCalledWith('courses');
    expect(drawer).not.toHaveClass('open');
  });

  it('5. Allows searching from inside mobile drawer without text-icon collisions', () => {
    renderHeaderMobile({ lang: 'ar' });
    const hamburger = document.querySelector('.figma-hamburger-trigger');
    fireEvent.click(hamburger);

    const drawerSearch = document.querySelector('.mobile-drawer .figma-search-input');
    expect(drawerSearch).toBeInTheDocument();

    fireEvent.input(drawerSearch, { target: { value: 'تغير المناخ' } });
    expect(drawerSearch.value).toBe('تغير المناخ');
  });

  it('6. Language switcher in mobile drawer toggles language and closes drawer', () => {
    const toggleLanguage = vi.fn();
    renderHeaderMobile({ lang: 'ar', toggleLanguage });

    const hamburger = document.querySelector('.figma-hamburger-trigger');
    fireEvent.click(hamburger);

    const langLink = document.querySelector('.mobile-drawer a[href="#lang"]');
    expect(langLink.textContent).toContain('English (EN)');

    fireEvent.click(langLink);
    expect(toggleLanguage).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.mobile-drawer')).not.toHaveClass('open');
  });

  it('7. Triggers onLogout handler when clicking Logout in mobile drawer', () => {
    const onLogout = vi.fn();
    const mockUser = { id: 'test-user', email: 'test@climamedix.org' };
    const mockProfile = { full_name: 'Test Student', role: 'user' };

    renderHeaderMobile({ onLogout, user: mockUser, userProfile: mockProfile });
    const hamburger = document.querySelector('.figma-hamburger-trigger');
    fireEvent.click(hamburger);

    const logoutBtn = document.querySelector('.mobile-drawer a[href="#logout"]');
    expect(logoutBtn).toBeInTheDocument();

    fireEvent.click(logoutBtn);
    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.mobile-drawer')).not.toHaveClass('open');
  });
});
