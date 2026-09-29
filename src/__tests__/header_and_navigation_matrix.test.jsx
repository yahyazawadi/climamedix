import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/preact';
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

describe('Suite 33: Header & Navigation Matrix Test Suite', () => {
  const defaultAuthContext = {
    disabledPermissions: [],
    togglePermission: vi.fn(),
    hasPermission: vi.fn((perm) => true)
  };

  beforeEach(() => {
    mockUseAuth.mockReturnValue(defaultAuthContext);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1: Desktop Navigation Links & Brand Logo (8 Tests)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('1. Desktop Navigation Links & Brand Logo', () => {
    it('navigates to home when clicking the brand logo link', () => {
      const onNavigate = vi.fn();
      render(
        <Header
          lang="ar"
          currentView="home"
          onNavigate={onNavigate}
          toggleLanguage={vi.fn()}
        />
      );

      const logoLink = document.querySelector('.figma-logo-link');
      fireEvent.click(logoLink);

      expect(onNavigate).toHaveBeenCalledWith('home', 'home');
    });

    it('navigates to newhome when clicking the brand logo if currentView is newhome', () => {
      const onNavigate = vi.fn();
      render(
        <Header
          lang="ar"
          currentView="newhome"
          onNavigate={onNavigate}
          toggleLanguage={vi.fn()}
        />
      );

      const logoLink = document.querySelector('.figma-logo-link');
      fireEvent.click(logoLink);

      expect(onNavigate).toHaveBeenCalledWith('newhome', 'home');
    });

    it('renders all primary desktop navigation links in Arabic', () => {
      render(
        <Header
          lang="ar"
          currentView="home"
          onNavigate={vi.fn()}
          toggleLanguage={vi.fn()}
        />
      );

      const desktopNav = document.querySelector('.figma-nav-menu');
      expect(desktopNav.querySelector('a[href="#home"]').textContent).toBe('الرئيسية');
      expect(desktopNav.querySelector('a[href="#news"]').textContent).toBe('الأخبار والمقالات');
      expect(desktopNav.querySelector('a[href="#courses"]').textContent).toBe('المركز التعليمي');
      expect(desktopNav.querySelector('a[href="#research"]').textContent).toBe('أبحاث');
      expect(desktopNav.querySelector('a[href="#opportunities"]').textContent).toBe('الفرص');
      expect(desktopNav.querySelector('a[href="#join-us"]').textContent).toBe('انضم إلينا');
      expect(desktopNav.querySelector('a[href="#about"]').textContent).toBe('من نحن');
    });

    it('renders primary desktop navigation links in English when lang is en', () => {
      render(
        <Header
          lang="en"
          currentView="home"
          onNavigate={vi.fn()}
          toggleLanguage={vi.fn()}
        />
      );

      const desktopNav = document.querySelector('.figma-nav-menu');
      expect(desktopNav.querySelector('a[href="#home"]').textContent).toBe('Home');
      expect(desktopNav.querySelector('a[href="#news"]').textContent).toBe('News & Blog');
      expect(desktopNav.querySelector('a[href="#courses"]').textContent).toBe('Learning Hub');
      expect(desktopNav.querySelector('a[href="#research"]').textContent).toBe('Research');
      expect(desktopNav.querySelector('a[href="#opportunities"]').textContent).toBe('Opportunities');
      expect(desktopNav.querySelector('a[href="#join-us"]').textContent).toBe('Join Us');
      expect(desktopNav.querySelector('a[href="#about"]').textContent).toBe('About Us');
    });

    it('triggers onNavigate when clicking primary navigation links', () => {
      const onNavigate = vi.fn();
      render(
        <Header
          lang="ar"
          currentView="home"
          onNavigate={onNavigate}
          toggleLanguage={vi.fn()}
        />
      );

      const desktopNav = document.querySelector('.figma-nav-menu');
      fireEvent.click(desktopNav.querySelector('a[href="#news"]'));
      expect(onNavigate).toHaveBeenCalledWith('news');

      fireEvent.click(desktopNav.querySelector('a[href="#courses"]'));
      expect(onNavigate).toHaveBeenCalledWith('courses');

      fireEvent.click(desktopNav.querySelector('a[href="#research"]'));
      expect(onNavigate).toHaveBeenCalledWith('research');

      fireEvent.click(desktopNav.querySelector('a[href="#opportunities"]'));
      expect(onNavigate).toHaveBeenCalledWith('opportunities');

      fireEvent.click(desktopNav.querySelector('a[href="#join-us"]'));
      expect(onNavigate).toHaveBeenCalledWith('join');

      fireEvent.click(desktopNav.querySelector('a[href="#about"]'));
      expect(onNavigate).toHaveBeenCalledWith('about');

      fireEvent.click(desktopNav.querySelector('a[href="#home"]'));
      expect(onNavigate).toHaveBeenCalledWith('home');
    });

    it('updates desktop search input value when user types', () => {
      render(
        <Header
          lang="ar"
          currentView="home"
          onNavigate={vi.fn()}
          toggleLanguage={vi.fn()}
        />
      );

      const searchInputs = screen.getAllByPlaceholderText('البحث...');
      expect(searchInputs.length).toBeGreaterThan(0);
      fireEvent.input(searchInputs[0], { target: { value: 'climate changes' } });
      expect(searchInputs[0].value).toBe('climate changes');
    });

    it('renders search input with english placeholder when lang is en', () => {
      render(
        <Header
          lang="en"
          currentView="home"
          onNavigate={vi.fn()}
          toggleLanguage={vi.fn()}
        />
      );

      const searchInputs = screen.getAllByPlaceholderText('Search...');
      expect(searchInputs.length).toBeGreaterThan(0);
    });

    it('applies active class to the current active section', () => {
      render(
        <Header
          lang="ar"
          currentView="courses"
          onNavigate={vi.fn()}
          toggleLanguage={vi.fn()}
        />
      );

      const coursesBtn = document.querySelector('.figma-nav-menu a[href="#courses"]');
      expect(coursesBtn.className).toContain('active');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2: Language Switcher Dropdown (4 Tests)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('2. Language Switcher Dropdown', () => {
    it('opens language dropdown when clicking globe button', () => {
      render(
        <Header
          lang="ar"
          currentView="home"
          onNavigate={vi.fn()}
          toggleLanguage={vi.fn()}
        />
      );

      const langBtn = document.querySelector('.language-toggle-btn');
      fireEvent.click(langBtn);

      expect(document.querySelector('.lang-dropdown-menu')).toBeInTheDocument();
      expect(screen.getByText('AR')).toBeInTheDocument();
      expect(screen.getByText('EN')).toBeInTheDocument();
    });

    it('switches to English when clicking EN button', () => {
      const toggleLanguage = vi.fn();
      render(
        <Header
          lang="ar"
          currentView="home"
          onNavigate={vi.fn()}
          toggleLanguage={toggleLanguage}
        />
      );

      const langBtn = document.querySelector('.language-toggle-btn');
      fireEvent.click(langBtn);

      const enBtn = screen.getByText('EN');
      fireEvent.click(enBtn);

      expect(toggleLanguage).toHaveBeenCalled();
      expect(document.querySelector('.lang-dropdown-menu')).toBeNull();
    });

    it('switches to Arabic when clicking AR button while lang is en', () => {
      const toggleLanguage = vi.fn();
      render(
        <Header
          lang="en"
          currentView="home"
          onNavigate={vi.fn()}
          toggleLanguage={toggleLanguage}
        />
      );

      const langBtn = document.querySelector('.language-toggle-btn');
      fireEvent.click(langBtn);

      const arBtn = screen.getByText('AR');
      fireEvent.click(arBtn);

      expect(toggleLanguage).toHaveBeenCalled();
    });

    it('closes dropdown when clicking outside', () => {
      render(
        <Header
          lang="ar"
          currentView="home"
          onNavigate={vi.fn()}
          toggleLanguage={vi.fn()}
        />
      );

      const langBtn = document.querySelector('.language-toggle-btn');
      fireEvent.click(langBtn);
      expect(document.querySelector('.lang-dropdown-menu')).toBeInTheDocument();

      // Click outside
      fireEvent.click(document.body);
      expect(document.querySelector('.lang-dropdown-menu')).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3: Guest vs Authenticated User Dropdown & Role Badges (9 Tests)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('3. Guest vs Authenticated User Dropdown & Role Badges', () => {
    it('renders Login button when user is null (guest)', () => {
      const onNavigate = vi.fn();
      render(
        <Header
          user={null}
          lang="ar"
          currentView="home"
          onNavigate={onNavigate}
          toggleLanguage={vi.fn()}
        />
      );

      const loginBtn = document.querySelector('.figma-nav-menu a[href="#auth"]');
      expect(loginBtn).toBeInTheDocument();
      expect(loginBtn.textContent).toBe('دخول');

      fireEvent.click(loginBtn);
      expect(onNavigate).toHaveBeenCalledWith('auth');
    });

    it('renders English Login button when user is null and lang is en', () => {
      const onNavigate = vi.fn();
      render(
        <Header
          user={null}
          lang="en"
          currentView="home"
          onNavigate={onNavigate}
          toggleLanguage={vi.fn()}
        />
      );

      const loginBtn = document.querySelector('.figma-nav-menu a[href="#auth"]');
      expect(loginBtn).toBeInTheDocument();
      expect(loginBtn.textContent).toBe('Login');

      fireEvent.click(loginBtn);
      expect(onNavigate).toHaveBeenCalledWith('auth');
    });

    it('renders My Account button when user is authenticated', () => {
      render(
        <Header
          user={{ id: 'usr-1', email: 'test@climamedix.org' }}
          userProfile={{ full_name: 'أحمد محمود', role: 'user' }}
          lang="ar"
          currentView="home"
          onNavigate={vi.fn()}
          toggleLanguage={vi.fn()}
        />
      );

      expect(screen.getByText('حسابي')).toBeInTheDocument();
    });

    it('toggles profile dropdown menu on click', () => {
      render(
        <Header
          user={{ id: 'usr-1', email: 'test@climamedix.org' }}
          userProfile={{ full_name: 'أحمد محمود', role: 'user' }}
          lang="ar"
          currentView="home"
          onNavigate={vi.fn()}
          toggleLanguage={vi.fn()}
        />
      );

      const myAccountItem = screen.getByText('حسابي');
      fireEvent.click(myAccountItem);

      const dropdown = document.querySelector('.premium-profile-dropdown');
      expect(dropdown).toBeInTheDocument();
      expect(dropdown.textContent).toContain('أحمد محمود');
      expect(dropdown.textContent).toContain('test@climamedix.org');
    });

    it('displays Super Admin badge for superadmin role', () => {
      render(
        <Header
          user={{ id: 'usr-super', email: 'super@climamedix.org' }}
          userProfile={{ full_name: 'المدير العام', role: 'superadmin' }}
          lang="ar"
          currentView="home"
          onNavigate={vi.fn()}
          toggleLanguage={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('حسابي'));
      const dropdown = document.querySelector('.premium-profile-dropdown');
      expect(dropdown.textContent).toContain('مسؤول خارق');
    });

    it('displays Admin badge for admin role', () => {
      render(
        <Header
          user={{ id: 'usr-admin', email: 'admin@climamedix.org' }}
          userProfile={{ full_name: 'المشرف', role: 'admin' }}
          lang="en"
          currentView="home"
          onNavigate={vi.fn()}
          toggleLanguage={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText(/Account/i));
      const dropdown = document.querySelector('.premium-profile-dropdown');
      expect(dropdown.textContent).toContain('Admin');
    });

    it('displays Researcher badge for researcher role', () => {
      render(
        <Header
          user={{ id: 'usr-res', email: 'res@climamedix.org' }}
          userProfile={{ full_name: 'د. سامي', role: 'researcher', profession: 'عالم مناخ' }}
          lang="ar"
          currentView="home"
          onNavigate={vi.fn()}
          toggleLanguage={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('حسابي'));
      const dropdown = document.querySelector('.premium-profile-dropdown');
      expect(dropdown.textContent).toContain('باحث علمي');
      expect(dropdown.textContent).toContain('عالم مناخ');
    });

    it('displays Educator badge for educator role', () => {
      render(
        <Header
          user={{ id: 'usr-edu', email: 'edu@climamedix.org' }}
          userProfile={{ full_name: 'أستاذ منير', role: 'educator' }}
          lang="en"
          currentView="home"
          onNavigate={vi.fn()}
          toggleLanguage={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText(/Account/i));
      const dropdown = document.querySelector('.premium-profile-dropdown');
      expect(dropdown.textContent).toContain('Educator');
    });

    it('displays Subscriber badge for subscriber role', () => {
      render(
        <Header
          user={{ id: 'usr-sub', email: 'sub@climamedix.org' }}
          userProfile={{ full_name: 'محمد علي', role: 'subscriber' }}
          lang="ar"
          currentView="home"
          onNavigate={vi.fn()}
          toggleLanguage={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('حسابي'));
      const dropdown = document.querySelector('.premium-profile-dropdown');
      expect(dropdown.textContent).toContain('مشترك');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4: Admin Portals Navigation & Superadmin Kill-Switch (9 Tests)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('4. Admin Portals Navigation & Superadmin Kill-Switch', () => {
    it('navigates to Profile page when clicking My Profile in dropdown', () => {
      const onNavigate = vi.fn();
      render(
        <Header
          user={{ id: 'usr-1', email: 'user@climamedix.org' }}
          userProfile={{ full_name: 'مستخدم عادي', role: 'user' }}
          lang="ar"
          currentView="home"
          onNavigate={onNavigate}
          toggleLanguage={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('حسابي'));
      const profileLink = document.querySelector('.premium-profile-dropdown a[href="#profile"]');
      expect(profileLink).toBeInTheDocument();
      fireEvent.click(profileLink);

      expect(onNavigate).toHaveBeenCalledWith('profile');
    });

    it('renders Course Builder link for course managers', () => {
      const onNavigate = vi.fn();
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        hasPermission: (perm) => perm === 'manage:courses' || perm === 'manage:any_course'
      });

      render(
        <Header
          user={{ id: 'usr-admin', email: 'admin@climamedix.org' }}
          userProfile={{ full_name: 'مدير المساقات', role: 'admin' }}
          lang="ar"
          currentView="home"
          onNavigate={onNavigate}
          toggleLanguage={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('حسابي'));
      const courseBuilderLink = document.querySelector('.premium-profile-dropdown a[href="#admin-courses"]');
      expect(courseBuilderLink).toBeInTheDocument();

      fireEvent.click(courseBuilderLink);
      expect(onNavigate).toHaveBeenCalledWith('admin-courses');
    });

    it('renders Certificate Audit link for cert issuers', () => {
      const onNavigate = vi.fn();
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        hasPermission: (perm) => perm === 'issue:certs'
      });

      render(
        <Header
          user={{ id: 'usr-admin', email: 'admin@climamedix.org' }}
          userProfile={{ full_name: 'مدير الشهادات', role: 'admin' }}
          lang="ar"
          currentView="home"
          onNavigate={onNavigate}
          toggleLanguage={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('حسابي'));
      const certAuditLink = document.querySelector('.premium-profile-dropdown a[href="#admin-certificates"]');
      expect(certAuditLink).toBeInTheDocument();

      fireEvent.click(certAuditLink);
      expect(onNavigate).toHaveBeenCalledWith('admin-certificates');
    });

    it('renders Slider Manager link for slider admins', () => {
      const onNavigate = vi.fn();
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        hasPermission: (perm) => perm === 'manage:slider'
      });

      render(
        <Header
          user={{ id: 'usr-admin', email: 'admin@climamedix.org' }}
          userProfile={{ full_name: 'مدير الشرائح', role: 'admin' }}
          lang="ar"
          currentView="home"
          onNavigate={onNavigate}
          toggleLanguage={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('حسابي'));
      const sliderLink = document.querySelector('.premium-profile-dropdown a[href="#admin-slider"]');
      expect(sliderLink).toBeInTheDocument();

      fireEvent.click(sliderLink);
      expect(onNavigate).toHaveBeenCalledWith('admin-slider');
    });

    it('renders Control Panel link for superadmin', () => {
      const onNavigate = vi.fn();
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        hasPermission: (perm) => perm === 'manage:system'
      });

      render(
        <Header
          user={{ id: 'usr-super', email: 'super@climamedix.org' }}
          userProfile={{ full_name: 'مدير النظام', role: 'superadmin' }}
          lang="ar"
          currentView="home"
          onNavigate={onNavigate}
          toggleLanguage={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('حسابي'));
      const debugLink = document.querySelector('.premium-profile-dropdown a[href="#debug"]');
      expect(debugLink).toBeInTheDocument();
      fireEvent.click(debugLink);
      expect(onNavigate).toHaveBeenCalledWith('debug');
    });

    it('renders Statistics link for users with view:user_stats', () => {
      const onNavigate = vi.fn();
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        hasPermission: (perm) => perm === 'view:user_stats'
      });

      render(
        <Header
          user={{ id: 'usr-super', email: 'super@climamedix.org' }}
          userProfile={{ full_name: 'محلل البيانات', role: 'superadmin' }}
          lang="ar"
          currentView="home"
          onNavigate={onNavigate}
          toggleLanguage={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('حسابي'));
      const statsLink = document.querySelector('.premium-profile-dropdown a[href="#admin-stats"]');
      expect(statsLink).toBeInTheDocument();
      fireEvent.click(statsLink);
      expect(onNavigate).toHaveBeenCalledWith('admin-stats');
    });

    it('handles mouse enter and mouse leave on profile dropdown links', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        hasPermission: () => true
      });

      render(
        <Header
          user={{ id: 'usr-admin', email: 'admin@climamedix.org' }}
          userProfile={{ full_name: 'مدير عام', role: 'superadmin' }}
          lang="ar"
          currentView="home"
          onNavigate={vi.fn()}
          toggleLanguage={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('حسابي'));
      const dropdownLinks = document.querySelectorAll('.premium-profile-dropdown a');
      dropdownLinks.forEach(link => {
        fireEvent.mouseEnter(link);
        fireEvent.mouseLeave(link);
      });
    });

    it('calls onLogout when clicking Logout button in profile dropdown', () => {
      const onLogout = vi.fn();
      render(
        <Header
          user={{ id: 'usr-1', email: 'user@climamedix.org' }}
          userProfile={{ full_name: 'مستخدم', role: 'user' }}
          lang="ar"
          currentView="home"
          onNavigate={vi.fn()}
          onLogout={onLogout}
          toggleLanguage={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('حسابي'));
      const logoutBtn = document.querySelector('.premium-profile-dropdown a[href="#logout"]');
      fireEvent.click(logoutBtn);

      expect(onLogout).toHaveBeenCalled();
    });

    it('expands permissions kill-switch matrix for superadmin and toggles permission', () => {
      const togglePermission = vi.fn();
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        togglePermission,
        hasPermission: (perm) => perm === 'manage:system'
      });

      render(
        <Header
          user={{ id: 'super-1', email: 'super@climamedix.org' }}
          userProfile={{ full_name: 'المدير العام', role: 'superadmin' }}
          lang="ar"
          currentView="home"
          onNavigate={vi.fn()}
          toggleLanguage={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('حسابي'));
      const permsBtn = screen.getByText('صلاحيات الحساب النشطة');
      fireEvent.click(permsBtn);

      const permItem = screen.getByTitle('view:all_courses');
      expect(permItem).toBeInTheDocument();

      fireEvent.click(permItem);
      expect(togglePermission).toHaveBeenCalledWith('view:all_courses');
    });

    it('filters permissions in kill-switch matrix via search input', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        hasPermission: (perm) => perm === 'manage:system'
      });

      render(
        <Header
          user={{ id: 'super-1', email: 'super@climamedix.org' }}
          userProfile={{ full_name: 'المدير العام', role: 'superadmin' }}
          lang="ar"
          currentView="home"
          onNavigate={vi.fn()}
          toggleLanguage={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('حسابي'));
      fireEvent.click(screen.getByText('صلاحيات الحساب النشطة'));

      const searchInput = screen.getByPlaceholderText('بحث في الصلاحيات...');
      fireEvent.input(searchInput, { target: { value: 'slider' } });

      expect(screen.getByTitle('manage:slider')).toBeInTheDocument();
      expect(screen.queryByTitle('view:all_courses')).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5: Mobile Drawer Navigation (7 Tests)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('5. Mobile Drawer Navigation', () => {
    it('opens and closes mobile drawer when clicking hamburger button', () => {
      render(
        <Header
          lang="ar"
          currentView="home"
          onNavigate={vi.fn()}
          toggleLanguage={vi.fn()}
        />
      );

      const hamburgerBtn = document.querySelector('.figma-hamburger-trigger');
      fireEvent.click(hamburgerBtn);

      const drawer = document.querySelector('.mobile-drawer');
      expect(drawer.className).toContain('open');

      // Click hamburger again to close
      fireEvent.click(hamburgerBtn);
      expect(drawer.className).not.toContain('open');
    });

    it('closes mobile drawer when clicking backdrop overlay', () => {
      render(
        <Header
          lang="ar"
          currentView="home"
          onNavigate={vi.fn()}
          toggleLanguage={vi.fn()}
        />
      );

      const hamburgerBtn = document.querySelector('.figma-hamburger-trigger');
      fireEvent.click(hamburgerBtn);

      const overlay = document.querySelector('.drawer-overlay');
      expect(overlay.className).toContain('open');

      fireEvent.click(overlay);
      const drawer = document.querySelector('.mobile-drawer');
      expect(drawer.className).not.toContain('open');
    });

    it('triggers onNavigate and closes drawer when clicking a mobile nav item', () => {
      const onNavigate = vi.fn();
      render(
        <Header
          lang="ar"
          currentView="home"
          onNavigate={onNavigate}
          toggleLanguage={vi.fn()}
        />
      );

      const hamburgerBtn = document.querySelector('.figma-hamburger-trigger');
      fireEvent.click(hamburgerBtn);

      const homeLink = document.querySelector('.mobile-drawer a[href="#home"]');
      fireEvent.click(homeLink);

      expect(onNavigate).toHaveBeenCalledWith('home');
      const drawer = document.querySelector('.mobile-drawer');
      expect(drawer.className).not.toContain('open');
    });

    it('renders Login link in mobile drawer for guests and navigates to auth', () => {
      const onNavigate = vi.fn();
      render(
        <Header
          user={null}
          lang="ar"
          currentView="home"
          onNavigate={onNavigate}
          toggleLanguage={vi.fn()}
        />
      );

      const hamburgerBtn = document.querySelector('.figma-hamburger-trigger');
      fireEvent.click(hamburgerBtn);

      const drawerAuthLink = document.querySelector('.mobile-drawer a[href="#auth"]');
      expect(drawerAuthLink).toBeInTheDocument();
      expect(drawerAuthLink.textContent).toBe('دخول');

      fireEvent.click(drawerAuthLink);
      expect(onNavigate).toHaveBeenCalledWith('auth');
    });

    it('renders logged-in user profile, admin links, and logout in mobile drawer', () => {
      const onLogout = vi.fn();
      const onNavigate = vi.fn();
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        hasPermission: (perm) => ['manage:system', 'approve:users', 'view:user_stats', 'issue:certs', 'manage:courses'].includes(perm)
      });

      render(
        <Header
          user={{ id: 'usr-admin', email: 'admin@climamedix.org' }}
          userProfile={{ full_name: 'مدير عام', role: 'admin' }}
          lang="ar"
          currentView="home"
          onNavigate={onNavigate}
          onLogout={onLogout}
          toggleLanguage={vi.fn()}
        />
      );

      const hamburgerBtn = document.querySelector('.figma-hamburger-trigger');
      fireEvent.click(hamburgerBtn);

      const drawer = document.querySelector('.mobile-drawer');
      expect(drawer.querySelector('a[href="#profile"]')).toBeInTheDocument();
      expect(drawer.querySelector('a[href="#debug"]')).toBeInTheDocument();
      expect(drawer.querySelector('a[href="#admin-users"]')).toBeInTheDocument();
      expect(drawer.querySelector('a[href="#admin-stats"]')).toBeInTheDocument();
      expect(drawer.querySelector('a[href="#admin-certificates"]')).toBeInTheDocument();
      expect(drawer.querySelector('a[href="#admin-courses"]')).toBeInTheDocument();

      // Click drawer logout
      const drawerLogout = drawer.querySelector('a[href="#logout"]');
      fireEvent.click(drawerLogout);
      expect(onLogout).toHaveBeenCalled();
    });

    it('navigates through all mobile drawer navigation items', () => {
      const onNavigate = vi.fn();
      render(
        <Header
          lang="ar"
          currentView="home"
          onNavigate={onNavigate}
          toggleLanguage={vi.fn()}
        />
      );

      const openDrawer = () => {
        const hamburgerBtn = document.querySelector('.figma-hamburger-trigger');
        fireEvent.click(hamburgerBtn);
      };

      openDrawer();
      fireEvent.click(document.querySelector('.mobile-drawer a[href="#about"]'));
      expect(onNavigate).toHaveBeenCalledWith('about');

      openDrawer();
      fireEvent.click(document.querySelector('.mobile-drawer a[href="#learning-hub"]'));
      expect(onNavigate).toHaveBeenCalledWith('courses');

      openDrawer();
      fireEvent.click(document.querySelector('.mobile-drawer a[href="#research"]'));
      expect(onNavigate).toHaveBeenCalledWith('research');

      openDrawer();
      fireEvent.click(document.querySelector('.mobile-drawer a[href="#opportunities"]'));
      expect(onNavigate).toHaveBeenCalledWith('opportunities');

      openDrawer();
      fireEvent.click(document.querySelector('.mobile-drawer a[href="#news"]'));
      expect(onNavigate).toHaveBeenCalledWith('news');

      openDrawer();
      fireEvent.click(document.querySelector('.mobile-drawer a[href="#join-us"]'));
      expect(onNavigate).toHaveBeenCalledWith('join');
    });

    it('navigates through admin quick links in mobile drawer', () => {
      const onNavigate = vi.fn();
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        hasPermission: (perm) => true
      });

      render(
        <Header
          user={{ id: 'usr-admin', email: 'admin@climamedix.org' }}
          userProfile={{ full_name: 'مدير عام', role: 'admin' }}
          lang="ar"
          currentView="home"
          onNavigate={onNavigate}
          toggleLanguage={vi.fn()}
        />
      );

      const openDrawer = () => {
        const hamburgerBtn = document.querySelector('.figma-hamburger-trigger');
        fireEvent.click(hamburgerBtn);
      };

      openDrawer();
      fireEvent.click(document.querySelector('.mobile-drawer a[href="#profile"]'));
      expect(onNavigate).toHaveBeenCalledWith('profile');

      openDrawer();
      fireEvent.click(document.querySelector('.mobile-drawer a[href="#debug"]'));
      expect(onNavigate).toHaveBeenCalledWith('debug');

      openDrawer();
      fireEvent.click(document.querySelector('.mobile-drawer a[href="#admin-users"]'));
      expect(onNavigate).toHaveBeenCalledWith('admin-users');

      openDrawer();
      fireEvent.click(document.querySelector('.mobile-drawer a[href="#admin-stats"]'));
      expect(onNavigate).toHaveBeenCalledWith('admin-stats');

      openDrawer();
      fireEvent.click(document.querySelector('.mobile-drawer a[href="#admin-certificates"]'));
      expect(onNavigate).toHaveBeenCalledWith('admin-certificates');

      openDrawer();
      fireEvent.click(document.querySelector('.mobile-drawer a[href="#admin-courses"]'));
      expect(onNavigate).toHaveBeenCalledWith('admin-courses');
    });

    it('handles avatar image rendering and fallback on error', () => {
      render(
        <Header
          user={{ id: 'usr-avatar', email: 'avatar@climamedix.org' }}
          userProfile={{ full_name: 'صورة المستخدم', avatar_url: 'https://example.com/invalid.jpg', role: 'user' }}
          lang="ar"
          currentView="home"
          onNavigate={vi.fn()}
          toggleLanguage={vi.fn()}
        />
      );

      const navIcons = document.querySelectorAll('.figma-nav-icon');
      navIcons.forEach(icon => {
        fireEvent.error(icon);
      });

      fireEvent.click(screen.getByText('حسابي'));
      const dropdownImg = document.querySelector('.premium-profile-dropdown img');
      if (dropdownImg) {
        fireEvent.error(dropdownImg);
      }
    });

    it('toggles language from mobile drawer', () => {
      const toggleLanguage = vi.fn();
      render(
        <Header
          lang="ar"
          currentView="home"
          onNavigate={vi.fn()}
          toggleLanguage={toggleLanguage}
        />
      );

      const hamburgerBtn = document.querySelector('.figma-hamburger-trigger');
      fireEvent.click(hamburgerBtn);

      const langDrawerLink = screen.getByText('English (EN)');
      fireEvent.click(langDrawerLink);

      expect(toggleLanguage).toHaveBeenCalled();
    });

    it('updates mobile drawer search input value when user types', () => {
      render(
        <Header
          lang="ar"
          currentView="home"
          onNavigate={vi.fn()}
          toggleLanguage={vi.fn()}
        />
      );

      const hamburgerBtn = document.querySelector('.figma-hamburger-trigger');
      fireEvent.click(hamburgerBtn);

      const drawerSearchInput = document.querySelector('.mobile-drawer .figma-search-input');
      expect(drawerSearchInput).toBeInTheDocument();
      fireEvent.input(drawerSearchInput, { target: { value: 'water scarcity' } });
      expect(drawerSearchInput.value).toBe('water scarcity');
    });
  });
});
