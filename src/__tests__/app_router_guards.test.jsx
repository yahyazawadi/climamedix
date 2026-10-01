import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { AppRouter, getViewFromPath, getPathFromView, useAppRouting } from '../AppRouter';
import * as AuthModule from '../features/auth/hooks/useAuth';
import { ROLE_PERMISSIONS } from '../features/auth/hooks/useAuth';

// Mock child pages as lightweight stubs to keep router test lightning-fast and focused on routing & permissions
vi.mock('../features/about-us/AboutUsPage', () => ({
  AboutUsPage: ({ lang, onJoinClick, onNavigate }) => (
    <div data-testid="page-about">
      <span>AboutUsPage-{lang}</span>
      <button onClick={onJoinClick}>JoinBtn</button>
      <button onClick={() => onNavigate('opportunities', 'section1')}>NavBtn</button>
    </div>
  )
}));

vi.mock('../features/auth/AuthPage', () => ({
  AuthPage: ({ lang, onAuthSuccess }) => (
    <div data-testid="page-auth">
      <span>AuthPage-{lang}</span>
      <button onClick={onAuthSuccess}>AuthSuccessBtn</button>
    </div>
  )
}));

vi.mock('../features/join-us/JoinUsPage', () => ({
  JoinUsPage: ({ lang, onNavigate }) => (
    <div data-testid="page-join">
      <span>JoinUsPage-{lang}</span>
      <button onClick={() => onNavigate('home')}>JoinNavBtn</button>
    </div>
  )
}));

vi.mock('../features/opportunities/components/OpportunitiesPage', () => ({
  OpportunitiesPage: ({ lang, onNavigate }) => (
    <div data-testid="page-opportunities">
      <span>OpportunitiesPage-{lang}</span>
      <button onClick={() => onNavigate('home')}>OppNavBtn</button>
    </div>
  )
}));

vi.mock('../features/events/EventsPage', () => ({
  EventsPage: ({ lang, onNavigate }) => (
    <div data-testid="page-events">
      <span>EventsPage-{lang}</span>
      <button onClick={() => onNavigate('home')}>EventsNavBtn</button>
    </div>
  )
}));

vi.mock('../features/news-blog/components/ArticleEditorPage', () => ({
  ArticleEditorPage: ({ lang, onNavigate }) => (
    <div data-testid="page-write-article">
      <span>ArticleEditorPage-{lang}</span>
      <button onClick={() => onNavigate('news')}>EditorNavBtn</button>
    </div>
  )
}));

vi.mock('../features/news-blog/components/NewsPage', () => ({
  NewsPage: ({ lang, onNavigate }) => (
    <div data-testid="page-news">
      <span>NewsPage-{lang}</span>
      <button onClick={() => onNavigate('article', 'art-123')}>OpenArticleBtn</button>
      <button onClick={() => onNavigate('write-article', 'art-123')}>EditArticleBtn</button>
      <button onClick={() => onNavigate('home')}>SimpleNavBtn</button>
    </div>
  )
}));

vi.mock('../features/news-blog/components/ArticleReaderPage', () => ({
  ArticleReaderPage: ({ lang, onNavigate }) => (
    <div data-testid="page-article">
      <span>ArticleReaderPage-{lang}</span>
      <button onClick={() => onNavigate('write-article', 'art-999')}>ReaderEditBtn</button>
      <button onClick={() => onNavigate('news')}>ReaderNewsBtn</button>
    </div>
  )
}));

vi.mock('../features/profile/components/ProfilePage', () => ({
  ProfilePage: ({ lang, onNavigate }) => (
    <div data-testid="page-profile">
      <span>ProfilePage-{lang}</span>
      <button onClick={() => onNavigate('home')}>ProfileNavBtn</button>
    </div>
  )
}));

vi.mock('../features/learning-hub/components/student/LearningHubPage', () => ({
  LearningHubPage: ({ lang, onNavigate }) => (
    <div data-testid="page-courses">
      <span>LearningHubPage-{lang}</span>
      <button onClick={() => onNavigate('home')}>CoursesNavBtn</button>
    </div>
  )
}));

vi.mock('../features/main/components/NewHomePage', () => ({
  NewHomePage: ({ lang, setCurrentView, setOpenedModal, onNavigate }) => (
    <div data-testid="page-newhome">
      <span>NewHomePage-{lang}</span>
      {setCurrentView && <button onClick={() => setCurrentView('news')}>ChangeViewBtn</button>}
      {setOpenedModal && <button onClick={() => setOpenedModal('search')}>ModalBtn</button>}
      {onNavigate && <button onClick={() => onNavigate('about')}>HomeNavBtn</button>}
    </div>
  )
}));

vi.mock('../features/admin/components/UserManagementDashboard', () => ({
  UserManagementDashboard: ({ lang, onNavigate }) => (
    <div data-testid="page-admin-users">
      <span>UserManagementDashboard-{lang}</span>
      <button onClick={() => onNavigate('home')}>UsersNavBtn</button>
    </div>
  )
}));

vi.mock('../features/admin/components/UserStatsDashboard', () => ({
  UserStatsDashboard: ({ lang, onNavigate }) => (
    <div data-testid="page-admin-stats">
      <span>UserStatsDashboard-{lang}</span>
      <button onClick={() => onNavigate('home')}>StatsNavBtn</button>
    </div>
  )
}));

vi.mock('../features/learning-hub/components/admin/CourseBuilderPage', () => ({
  CourseBuilderPage: ({ lang, onNavigate }) => (
    <div data-testid="page-admin-courses">
      <span>CourseBuilderPage-{lang}</span>
      <button onClick={() => onNavigate('home')}>CourseBuilderNavBtn</button>
    </div>
  )
}));

vi.mock('../features/admin/components/CertificateAuditDashboard', () => ({
  CertificateAuditDashboard: ({ lang, onNavigate }) => (
    <div data-testid="page-admin-certificates">
      <span>CertificateAuditDashboard-{lang}</span>
      <button onClick={() => onNavigate('home')}>CertsNavBtn</button>
    </div>
  )
}));

vi.mock('../features/admin/components/SliderManagerPage', () => ({
  SliderManagerPage: ({ lang, onNavigate }) => (
    <div data-testid="page-admin-slider">
      <span>SliderManagerPage-{lang}</span>
      <button onClick={() => onNavigate('home')}>SliderNavBtn</button>
    </div>
  )
}));

vi.mock('../features/research-center/components/ResearchHubPage', () => ({
  ResearchHubPage: ({ lang, onNavigate }) => (
    <div data-testid="page-research">
      <span>ResearchHubPage-{lang}</span>
      <button onClick={() => onNavigate('research-detail', 'pub-456')}>OpenPubBtn</button>
      <button onClick={() => onNavigate('home')}>ResearchNavBtn</button>
    </div>
  )
}));

vi.mock('../features/research-center/components/ResearchUploadPage', () => ({
  ResearchUploadPage: ({ lang, onNavigate }) => (
    <div data-testid="page-research-upload">
      <span>ResearchUploadPage-{lang}</span>
      <button onClick={() => onNavigate('research')}>UploadNavBtn</button>
    </div>
  )
}));

vi.mock('../features/research-center/components/ResearchDetailPage', () => ({
  ResearchDetailPage: ({ lang, onNavigate }) => (
    <div data-testid="page-research-detail">
      <span>ResearchDetailPage-{lang}</span>
      <button onClick={() => onNavigate('research')}>DetailNavBtn</button>
    </div>
  )
}));

vi.mock('../features/learning-hub/components/certificates/CertificateVerificationPage', () => ({
  CertificateVerificationPage: ({ lang, certId }) => (
    <div data-testid="page-verify">
      <span>CertificateVerificationPage-{lang}-{certId}</span>
    </div>
  )
}));

// Helper to mock auth state for different roles
const mockRole = (role, loading = false) => {
  const perms = role ? (ROLE_PERMISSIONS[role] || []) : [];
  vi.spyOn(AuthModule, 'useAuth').mockReturnValue({
    hasPermission: (perm) => perms.includes(perm),
    loading,
    user: role ? { id: `user-${role}`, email: `${role}@test.com` } : null,
    userProfile: role ? { role, full_name: `${role} user` } : null,
  });
};

describe('AppRouter Comprehensive Permission Matrix & Routing Suite', () => {
  let mockNavigate;
  let mockSetCurrentView;
  let mockSetOpenedModal;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockNavigate = vi.fn();
    mockSetCurrentView = vi.fn();
    mockSetOpenedModal = vi.fn();
  });

  describe('1. Loading State in ProtectedRoute', () => {
    it('shows Arabic loading message when auth is resolving', () => {
      mockRole(null, true);

      render(
        <AppRouter
          currentView="admin-users"
          lang="ar"
          setCurrentView={mockSetCurrentView}
          setOpenedModal={mockSetOpenedModal}
          navigate={mockNavigate}
        />
      );

      expect(screen.getByText('جاري التحقق من الصلاحيات...')).toBeInTheDocument();
      expect(screen.queryByTestId('page-admin-users')).toBeNull();
    });

    it('shows English loading message when auth is resolving', () => {
      mockRole(null, true);

      render(
        <AppRouter
          currentView="write-article"
          lang="en"
          setCurrentView={mockSetCurrentView}
          setOpenedModal={mockSetOpenedModal}
          navigate={mockNavigate}
        />
      );

      expect(screen.getByText('Verifying permissions...')).toBeInTheDocument();
      expect(screen.queryByTestId('page-write-article')).toBeNull();
    });
  });

  describe('2. Protected Routes Matrix Across All 7 Protected Views', () => {
    const protectedViews = [
      { view: 'write-article', testId: 'page-write-article' },
      { view: 'admin-users', testId: 'page-admin-users' },
      { view: 'admin-stats', testId: 'page-admin-stats' },
      { view: 'admin-courses', testId: 'page-admin-courses' },
      { view: 'admin-certificates', testId: 'page-admin-certificates' },
      { view: 'admin-slider', testId: 'page-admin-slider' },
      { view: 'research-upload', testId: 'page-research-upload' },
    ];

    describe('Guest / Unauthenticated Users', () => {
      protectedViews.forEach(({ view, testId }) => {
        it(`blocks guest from accessing [${view}] and displays Arabic Access Denied`, () => {
          mockRole(null);

          const { unmount } = render(
            <AppRouter
              currentView={view}
              lang="ar"
              setCurrentView={mockSetCurrentView}
              setOpenedModal={mockSetOpenedModal}
              navigate={mockNavigate}
            />
          );

          expect(screen.getByText('غير مصرح بالدخول')).toBeInTheDocument();
          expect(screen.getByText('ليس لديك الصلاحيات الكافية للوصول إلى هذه الصفحة أو إدارة محتواها.')).toBeInTheDocument();
          expect(screen.queryByTestId(testId)).toBeNull();

          const backBtn = screen.getByText('العودة للرئيسية');
          fireEvent.click(backBtn);
          expect(mockNavigate).toHaveBeenCalledWith('home');

          unmount();
        });

        it(`blocks guest from accessing [${view}] and displays English Access Denied`, () => {
          mockRole(null);

          const { unmount } = render(
            <AppRouter
              currentView={view}
              lang="en"
              setCurrentView={mockSetCurrentView}
              setOpenedModal={mockSetOpenedModal}
              navigate={mockNavigate}
            />
          );

          expect(screen.getByText('Access Denied')).toBeInTheDocument();
          expect(screen.getByText('You do not have sufficient permissions to access or manage this page.')).toBeInTheDocument();
          expect(screen.queryByTestId(testId)).toBeNull();

          const backBtn = screen.getByText('Back to Home');
          fireEvent.click(backBtn);
          expect(mockNavigate).toHaveBeenCalledWith('home');

          unmount();
        });
      });
    });

    describe('Standard User Role ("user")', () => {
      protectedViews.forEach(({ view, testId }) => {
        it(`blocks normal user from protected view [${view}]`, () => {
          mockRole('user');

          const { unmount } = render(
            <AppRouter
              currentView={view}
              lang="ar"
              setCurrentView={mockSetCurrentView}
              setOpenedModal={mockSetOpenedModal}
              navigate={mockNavigate}
            />
          );

          expect(screen.getByText('غير مصرح بالدخول')).toBeInTheDocument();
          expect(screen.queryByTestId(testId)).toBeNull();
          unmount();
        });
      });
    });

    describe('Subscriber Role ("subscriber")', () => {
      protectedViews.forEach(({ view, testId }) => {
        it(`blocks subscriber from protected view [${view}]`, () => {
          mockRole('subscriber');

          const { unmount } = render(
            <AppRouter
              currentView={view}
              lang="en"
              setCurrentView={mockSetCurrentView}
              setOpenedModal={mockSetOpenedModal}
              navigate={mockNavigate}
            />
          );

          expect(screen.getByText('Access Denied')).toBeInTheDocument();
          expect(screen.queryByTestId(testId)).toBeNull();
          unmount();
        });
      });
    });

    describe('Educator Role ("educator")', () => {
      it('allows educator to access write-article (has write:articles)', () => {
        mockRole('educator');

        const { unmount } = render(
          <AppRouter
            currentView="write-article"
            lang="ar"
            setCurrentView={mockSetCurrentView}
            setOpenedModal={mockSetOpenedModal}
            navigate={mockNavigate}
          />
        );

        expect(screen.getByTestId('page-write-article')).toBeInTheDocument();
        expect(screen.getByText('ArticleEditorPage-ar')).toBeInTheDocument();
        expect(screen.queryByText('غير مصرح بالدخول')).toBeNull();
        unmount();
      });

      it('blocks educator from admin portals (admin-users, admin-stats, admin-slider, admin-certificates, admin-courses, research-upload)', () => {
        mockRole('educator');

        ['admin-users', 'admin-stats', 'admin-slider', 'admin-certificates', 'admin-courses', 'research-upload'].forEach((view) => {
          const { unmount } = render(
            <AppRouter
              currentView={view}
              lang="ar"
              setCurrentView={mockSetCurrentView}
              setOpenedModal={mockSetOpenedModal}
              navigate={mockNavigate}
            />
          );
          expect(screen.getByText('غير مصرح بالدخول')).toBeInTheDocument();
          unmount();
        });
      });
    });

    describe('Researcher Role ("researcher")', () => {
      it('allows researcher to access research-upload (has write:research)', () => {
        mockRole('researcher');

        const { unmount } = render(
          <AppRouter
            currentView="research-upload"
            lang="ar"
            setCurrentView={mockSetCurrentView}
            setOpenedModal={mockSetOpenedModal}
            navigate={mockNavigate}
          />
        );

        expect(screen.getByTestId('page-research-upload')).toBeInTheDocument();
        expect(screen.getByText('ResearchUploadPage-ar')).toBeInTheDocument();
        expect(screen.queryByText('غير مصرح بالدخول')).toBeNull();
        unmount();
      });

      it('allows researcher to access write-article (has write:articles) and admin-courses (has write:courses)', () => {
        mockRole('researcher');

        const { unmount: u1 } = render(
          <AppRouter
            currentView="write-article"
            lang="en"
            setCurrentView={mockSetCurrentView}
            setOpenedModal={mockSetOpenedModal}
            navigate={mockNavigate}
          />
        );
        expect(screen.getByTestId('page-write-article')).toBeInTheDocument();
        expect(screen.getByText('ArticleEditorPage-en')).toBeInTheDocument();
        expect(screen.queryByText('Access Denied')).toBeNull();
        u1();

        const { unmount: u2 } = render(
          <AppRouter
            currentView="admin-courses"
            lang="en"
            setCurrentView={mockSetCurrentView}
            setOpenedModal={mockSetOpenedModal}
            navigate={mockNavigate}
          />
        );
        expect(screen.getByTestId('page-admin-courses')).toBeInTheDocument();
        expect(screen.getByText('CourseBuilderPage-en')).toBeInTheDocument();
        expect(screen.queryByText('Access Denied')).toBeNull();
        u2();
      });

      it('blocks researcher from system admin portals (admin-users, admin-stats, admin-slider, admin-certificates)', () => {
        mockRole('researcher');

        ['admin-users', 'admin-stats', 'admin-slider', 'admin-certificates'].forEach((view) => {
          const { unmount } = render(
            <AppRouter
              currentView={view}
              lang="ar"
              setCurrentView={mockSetCurrentView}
              setOpenedModal={mockSetOpenedModal}
              navigate={mockNavigate}
            />
          );
          expect(screen.getByText('غير مصرح بالدخول')).toBeInTheDocument();
          unmount();
        });
      });
    });

    describe('Admin Role ("admin")', () => {
      const adminAllowedViews = [
        { view: 'write-article', testId: 'page-write-article', label: 'ArticleEditorPage-ar' },
        { view: 'admin-courses', testId: 'page-admin-courses', label: 'CourseBuilderPage-ar' },
        { view: 'admin-certificates', testId: 'page-admin-certificates', label: 'CertificateAuditDashboard-ar' },
        { view: 'admin-slider', testId: 'page-admin-slider', label: 'SliderManagerPage-ar' },
        { view: 'research-upload', testId: 'page-research-upload', label: 'ResearchUploadPage-ar' },
        { view: 'admin-users', testId: 'page-admin-users', label: 'UserManagementDashboard-ar' },
      ];

      adminAllowedViews.forEach(({ view, testId, label }) => {
        it(`allows admin to successfully open and render [${view}]`, () => {
          mockRole('admin');

          const { unmount } = render(
            <AppRouter
              currentView={view}
              lang="ar"
              setCurrentView={mockSetCurrentView}
              setOpenedModal={mockSetOpenedModal}
              navigate={mockNavigate}
            />
          );
          expect(screen.getByTestId(testId)).toBeInTheDocument();
          expect(screen.getByText(label)).toBeInTheDocument();
          expect(screen.queryByText('غير مصرح بالدخول')).toBeNull();
          unmount();
        });
      });

      it('blocks admin from admin-stats if view:user_stats is superadmin-exclusive', () => {
        // admin does NOT have view:user_stats in ROLE_PERMISSIONS (only superadmin does)
        mockRole('admin');

        render(
          <AppRouter
            currentView="admin-stats"
            lang="ar"
            setCurrentView={mockSetCurrentView}
            setOpenedModal={mockSetOpenedModal}
            navigate={mockNavigate}
          />
        );
        expect(screen.getByText('غير مصرح بالدخول')).toBeInTheDocument();
      });
    });

    describe('Superadmin Role ("superadmin")', () => {
      const superadminViews = [
        { view: 'write-article', testId: 'page-write-article', label: 'ArticleEditorPage-en' },
        { view: 'admin-users', testId: 'page-admin-users', label: 'UserManagementDashboard-en' },
        { view: 'admin-stats', testId: 'page-admin-stats', label: 'UserStatsDashboard-en' },
        { view: 'admin-courses', testId: 'page-admin-courses', label: 'CourseBuilderPage-en' },
        { view: 'admin-certificates', testId: 'page-admin-certificates', label: 'CertificateAuditDashboard-en' },
        { view: 'admin-slider', testId: 'page-admin-slider', label: 'SliderManagerPage-en' },
        { view: 'research-upload', testId: 'page-research-upload', label: 'ResearchUploadPage-en' },
      ];

      superadminViews.forEach(({ view, testId, label }) => {
        it(`allows superadmin unrestricted access and loads [${view}]`, () => {
          mockRole('superadmin');

          const { unmount } = render(
            <AppRouter
              currentView={view}
              lang="en"
              setCurrentView={mockSetCurrentView}
              setOpenedModal={mockSetOpenedModal}
              navigate={mockNavigate}
            />
          );
          expect(screen.getByTestId(testId)).toBeInTheDocument();
          expect(screen.getByText(label)).toBeInTheDocument();
          expect(screen.queryByText('Access Denied')).toBeNull();
          unmount();
        });
      });
    });
  });

  describe('3. Public and Unguarded Application Routes', () => {
    beforeEach(() => {
      mockRole(null); // Guest is allowed on all public routes
    });

    it('renders NewHomePage for home, newhome, and debug views', () => {
      ['home', 'newhome', 'debug'].forEach((v) => {
        const { unmount } = render(
          <AppRouter
            currentView={v}
            lang="ar"
            setCurrentView={mockSetCurrentView}
            setOpenedModal={mockSetOpenedModal}
            navigate={mockNavigate}
          />
        );
        expect(screen.getByTestId('page-newhome')).toBeInTheDocument();
        fireEvent.click(screen.getByText('HomeNavBtn'));
        expect(mockNavigate).toHaveBeenCalledWith('about');
        unmount();
      });
    });

    it('renders AboutUsPage and connects onJoinClick and onNavigate', () => {
      render(
        <AppRouter
          currentView="about"
          lang="ar"
          setCurrentView={mockSetCurrentView}
          setOpenedModal={mockSetOpenedModal}
          navigate={mockNavigate}
        />
      );

      expect(screen.getByTestId('page-about')).toBeInTheDocument();
      fireEvent.click(screen.getByText('JoinBtn'));
      expect(mockNavigate).toHaveBeenCalledWith('join');

      fireEvent.click(screen.getByText('NavBtn'));
      expect(mockNavigate).toHaveBeenCalledWith('opportunities', 'section1');
    });

    it('renders AuthPage and handles onAuthSuccess', () => {
      render(
        <AppRouter
          currentView="auth"
          lang="ar"
          setCurrentView={mockSetCurrentView}
          setOpenedModal={mockSetOpenedModal}
          navigate={mockNavigate}
        />
      );

      expect(screen.getByTestId('page-auth')).toBeInTheDocument();
      fireEvent.click(screen.getByText('AuthSuccessBtn'));
      expect(mockSetCurrentView).toHaveBeenCalledWith('newhome');
    });

    it('renders OpportunitiesPage and triggers onNavigate', () => {
      render(
        <AppRouter
          currentView="opportunities"
          lang="ar"
          setCurrentView={mockSetCurrentView}
          setOpenedModal={mockSetOpenedModal}
          navigate={mockNavigate}
        />
      );

      expect(screen.getByTestId('page-opportunities')).toBeInTheDocument();
      fireEvent.click(screen.getByText('OppNavBtn'));
      expect(mockNavigate).toHaveBeenCalledWith('home');
    });

    it('renders JoinUsPage and triggers onNavigate', () => {
      render(
        <AppRouter
          currentView="join"
          lang="ar"
          setCurrentView={mockSetCurrentView}
          setOpenedModal={mockSetOpenedModal}
          navigate={mockNavigate}
        />
      );

      expect(screen.getByTestId('page-join')).toBeInTheDocument();
      fireEvent.click(screen.getByText('JoinNavBtn'));
      expect(mockNavigate).toHaveBeenCalledWith('home');
    });

    it('renders ProfilePage and triggers onNavigate', () => {
      render(
        <AppRouter
          currentView="profile"
          lang="ar"
          setCurrentView={mockSetCurrentView}
          setOpenedModal={mockSetOpenedModal}
          navigate={mockNavigate}
        />
      );

      expect(screen.getByTestId('page-profile')).toBeInTheDocument();
      fireEvent.click(screen.getByText('ProfileNavBtn'));
      expect(mockNavigate).toHaveBeenCalledWith('home');
    });

    it('renders EventsPage and triggers onNavigate', () => {
      render(
        <AppRouter
          currentView="events"
          lang="ar"
          setCurrentView={mockSetCurrentView}
          setOpenedModal={mockSetOpenedModal}
          navigate={mockNavigate}
        />
      );

      expect(screen.getByTestId('page-events')).toBeInTheDocument();
      fireEvent.click(screen.getByText('EventsNavBtn'));
      expect(mockNavigate).toHaveBeenCalledWith('home');
    });

    it('renders LearningHubPage for courses view and triggers onNavigate', () => {
      render(
        <AppRouter
          currentView="courses"
          lang="ar"
          setCurrentView={mockSetCurrentView}
          setOpenedModal={mockSetOpenedModal}
          navigate={mockNavigate}
        />
      );

      expect(screen.getByTestId('page-courses')).toBeInTheDocument();
      fireEvent.click(screen.getByText('CoursesNavBtn'));
      expect(mockNavigate).toHaveBeenCalledWith('home');
    });

    it('renders ResearchDetailPage and triggers onNavigate', () => {
      render(
        <AppRouter
          currentView="research-detail"
          lang="ar"
          setCurrentView={mockSetCurrentView}
          setOpenedModal={mockSetOpenedModal}
          navigate={mockNavigate}
        />
      );

      expect(screen.getByTestId('page-research-detail')).toBeInTheDocument();
      fireEvent.click(screen.getByText('DetailNavBtn'));
      expect(mockNavigate).toHaveBeenCalledWith('research');
    });

    it('renders CertificateVerificationPage on verify view with certId from URL', () => {
      delete window.location;
      window.location = new URL('http://localhost:3000/verify/CERT-12345');

      render(
        <AppRouter
          currentView="verify"
          lang="en"
          setCurrentView={mockSetCurrentView}
          setOpenedModal={mockSetOpenedModal}
          navigate={mockNavigate}
        />
      );

      expect(screen.getByTestId('page-verify')).toBeInTheDocument();
      expect(screen.getByText('CertificateVerificationPage-en-CERT-12345')).toBeInTheDocument();
    });

    it('falls back to NewHomePage when currentView is unrecognized', () => {
      render(
        <AppRouter
          currentView="nonexistent-random-view"
          lang="ar"
          setCurrentView={mockSetCurrentView}
          setOpenedModal={mockSetOpenedModal}
          navigate={mockNavigate}
        />
      );

      expect(screen.getByTestId('page-newhome')).toBeInTheDocument();
    });
  });

  describe('4. Parameterized Navigation Handlers (News, Article, Research Hub)', () => {
    beforeEach(() => {
      mockRole(null);
    });

    it('handles NewsPage navigation callbacks (article with id, write-article with id, simple view)', () => {
      render(
        <AppRouter
          currentView="news"
          lang="ar"
          setCurrentView={mockSetCurrentView}
          setOpenedModal={mockSetOpenedModal}
          navigate={mockNavigate}
        />
      );

      fireEvent.click(screen.getByText('OpenArticleBtn'));
      expect(mockNavigate).toHaveBeenCalledWith('article', null, 'id=art-123');

      fireEvent.click(screen.getByText('EditArticleBtn'));
      expect(mockNavigate).toHaveBeenCalledWith('write-article', null, 'art-123');

      fireEvent.click(screen.getByText('SimpleNavBtn'));
      expect(mockNavigate).toHaveBeenCalledWith('home');
    });

    it('handles ArticleReaderPage navigation callbacks (write-article with id, news)', () => {
      render(
        <AppRouter
          currentView="article"
          lang="ar"
          setCurrentView={mockSetCurrentView}
          setOpenedModal={mockSetOpenedModal}
          navigate={mockNavigate}
        />
      );

      fireEvent.click(screen.getByText('ReaderEditBtn'));
      expect(mockNavigate).toHaveBeenCalledWith('write-article', null, 'art-999');

      fireEvent.click(screen.getByText('ReaderNewsBtn'));
      expect(mockNavigate).toHaveBeenCalledWith('news');
    });

    it('handles ResearchHubPage navigation callbacks (research-detail with id, simple view)', () => {
      render(
        <AppRouter
          currentView="research"
          lang="ar"
          setCurrentView={mockSetCurrentView}
          setOpenedModal={mockSetOpenedModal}
          navigate={mockNavigate}
        />
      );

      fireEvent.click(screen.getByText('OpenPubBtn'));
      expect(mockNavigate).toHaveBeenCalledWith('research-detail', null, 'id=pub-456');

      fireEvent.click(screen.getByText('ResearchNavBtn'));
      expect(mockNavigate).toHaveBeenCalledWith('home');
    });
  });

  describe('5. Route Aliases & Canonical Path Mapping (getViewFromPath & getPathFromView)', () => {
    it('resolves root and public page paths correctly', () => {
      expect(getViewFromPath('/')).toBe('newhome');
      expect(getViewFromPath('/home')).toBe('newhome');
      expect(getViewFromPath('/index/')).toBe('newhome');
      expect(getViewFromPath('/about-us')).toBe('about');
      expect(getViewFromPath('/info')).toBe('about');
      expect(getViewFromPath('/login')).toBe('auth');
      expect(getViewFromPath('/signup/')).toBe('auth');
      expect(getViewFromPath('/apply')).toBe('join');
      expect(getViewFromPath('/membership')).toBe('join');
      expect(getViewFromPath('/settings')).toBe('profile');
      expect(getViewFromPath('/account')).toBe('profile');
    });

    it('resolves content hubs and admin routes correctly', () => {
      expect(getViewFromPath('/blog')).toBe('news');
      expect(getViewFromPath('/articles')).toBe('news');
      expect(getViewFromPath('/post')).toBe('article');
      expect(getViewFromPath('/jobs')).toBe('opportunities');
      expect(getViewFromPath('/calendar')).toBe('events');
      expect(getViewFromPath('/lms')).toBe('courses');
      expect(getViewFromPath('/publications')).toBe('research');
      expect(getViewFromPath('/paper')).toBe('research-detail');
      expect(getViewFromPath('/upload-research')).toBe('research-upload');
      expect(getViewFromPath('/new-article')).toBe('write-article');
      expect(getViewFromPath('/admin/users')).toBe('admin-users');
      expect(getViewFromPath('/admin/stats')).toBe('admin-stats');
      expect(getViewFromPath('/admin/courses')).toBe('admin-courses');
      expect(getViewFromPath('/admin/certificates')).toBe('admin-certificates');
      expect(getViewFromPath('/admin/slider')).toBe('admin-slider');
    });

    it('resolves dynamic certificate verification parameterized paths', () => {
      expect(getViewFromPath('/verify/ABC-123')).toBe('verify');
      expect(getViewFromPath('/certificate/DEF-456')).toBe('verify');
      expect(getViewFromPath('/cert/GHI-789')).toBe('verify');
    });

    it('falls back to newhome for unmapped paths', () => {
      expect(getViewFromPath('/some/unknown/route')).toBe('newhome');
      expect(getViewFromPath('')).toBe('newhome');
    });

    it('returns canonical path for known views and falls back to /newhome', () => {
      expect(getPathFromView('newhome')).toBe('/newhome');
      expect(getPathFromView('about')).toBe('/about');
      expect(getPathFromView('auth')).toBe('/login');
      expect(getPathFromView('join')).toBe('/join');
      expect(getPathFromView('profile')).toBe('/profile');
      expect(getPathFromView('news')).toBe('/news');
      expect(getPathFromView('admin-users')).toBe('/admin/users');
      expect(getPathFromView('admin-stats')).toBe('/admin/stats');
      expect(getPathFromView('admin-courses')).toBe('/admin/courses');
      expect(getPathFromView('admin-certificates')).toBe('/admin/certificates');
      expect(getPathFromView('admin-slider')).toBe('/admin/slider');
      expect(getPathFromView('write-article')).toBe('/write-article');
      expect(getPathFromView('research-upload')).toBe('/research-upload');
      expect(getPathFromView('unknown-view')).toBe('/newhome');
    });
  });

  describe('6. useAppRouting Hook Mechanics', () => {
    function TestRoutingComponent({ currentView }) {
      const [view, setView] = PreactHooks.useState(currentView);
      const [modal, setModal] = PreactHooks.useState(null);
      const activeView = currentView !== undefined ? currentView : view;
      const { navigate } = useAppRouting(activeView, setView, setModal);

      return (
        <div>
          <span data-testid="current-v">{view}</span>
          <span data-testid="modal-state">{modal || 'no-modal'}</span>
          <button onClick={() => navigate('news')}>NavToNews</button>
          <button onClick={() => navigate('article', null, 'id=42')}>NavWithParam</button>
          <button onClick={() => navigate('home', 'about')}>NavWithSection</button>
        </div>
      );
    }

    // Import useState from preact/hooks
    let PreactHooks;

    beforeEach(async () => {
      PreactHooks = await import('preact/hooks');
      delete window.location;
      window.location = new URL('http://localhost:3000/news');
      window.history.pushState = vi.fn();
      window.history.replaceState = vi.fn();
      window.scrollTo = vi.fn();
    });

    it('initializes routing, handles popstate, and supports navigate helper with scrolling', async () => {
      vi.useFakeTimers();
      delete window.location;
      window.location = new URL('http://localhost:3000/about');
      const mockElem = { scrollIntoView: vi.fn() };
      vi.spyOn(document, 'getElementById').mockReturnValue(mockElem);

      const { unmount } = render(<TestRoutingComponent currentView="news" />);

      // Advance timer for initial segment scroll
      vi.advanceTimersByTime(200);
      expect(mockElem.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });

      // On popstate
      window.location.pathname = '/about';
      fireEvent(window, new Event('popstate'));
      expect(screen.getByTestId('current-v').textContent).toBe('about');

      // Navigate to normal view
      fireEvent.click(screen.getByText('NavToNews'));
      expect(window.history.pushState).toHaveBeenCalledWith({}, '', '/news');

      // Navigate with query params
      fireEvent.click(screen.getByText('NavWithParam'));
      expect(window.history.pushState).toHaveBeenCalledWith({}, '', '/article?id=42');

      // Navigate with section scroll
      mockElem.scrollIntoView.mockClear();
      fireEvent.click(screen.getByText('NavWithSection'));
      expect(window.history.pushState).toHaveBeenCalledWith({}, '', '/about');
      vi.advanceTimersByTime(150);
      expect(mockElem.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });

      unmount();
      vi.useRealTimers();
    });

    it('scrolls to top when entering auth view', () => {
      const { rerender } = render(<TestRoutingComponent currentView="home" />);
      rerender(<TestRoutingComponent currentView="auth" />);
      expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    });

    it('auto-scrolls to footer when hash is #footer or path is /footer', () => {
      vi.useFakeTimers();
      delete window.location;
      window.location = new URL('http://localhost:3000/#footer');
      const footerElem = { scrollIntoView: vi.fn() };
      vi.spyOn(document, 'getElementById').mockImplementation((id) => {
        if (id === 'footer') return footerElem;
        return null;
      });

      const { unmount } = render(<TestRoutingComponent currentView="newhome" />);
      vi.advanceTimersByTime(200);
      expect(footerElem.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });

      // Test hashchange
      footerElem.scrollIntoView.mockClear();
      window.location.hash = '#footer';
      fireEvent(window, new Event('hashchange'));
      vi.advanceTimersByTime(200);
      expect(footerElem.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });

      unmount();
      vi.useRealTimers();
    });

    it('pushes to top on link navigation and restores scroll position on popstate back arrow', () => {
      vi.useFakeTimers();
      const mockElem = { scrollIntoView: vi.fn() };
      vi.spyOn(document, 'getElementById').mockImplementation(() => mockElem);
      window.scrollY = 2500;

      const { unmount } = render(<TestRoutingComponent currentView="newhome" />);

      // Clicking link should navigate and push scroll to top (0)
      fireEvent.click(screen.getByText('NavToNews'));
      expect(window.history.replaceState).toHaveBeenCalledWith(
        expect.objectContaining({ scrollY: 2500 }),
        ''
      );
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });

      // Returning via back button with popstate event carrying state
      window.location.pathname = '/';
      const popStateEvent = new PopStateEvent('popstate', { state: { scrollY: 2500 } });
      window.dispatchEvent(popStateEvent);

      vi.advanceTimersByTime(150);
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 2500, behavior: 'smooth' });

      unmount();
      vi.useRealTimers();
    });
  });
});
