import { useEffect } from 'preact/hooks';
import { lazy, Suspense } from 'preact/compat';
import { useAuth } from './features/auth/hooks/useAuth';
import { HomePage, NewHomePage } from './features/main/components/NewHomePage';

// Route-level code-splitting: lazy load heavy secondary pages
const AboutUsPage = lazy(() => import('./features/about-us/AboutUsPage').then(m => ({ default: m.AboutUsPage })));
const AuthPage = lazy(() => import('./features/auth/AuthPage').then(m => ({ default: m.AuthPage })));
const JoinUsPage = lazy(() => import('./features/join-us/JoinUsPage').then(m => ({ default: m.JoinUsPage })));
const OpportunitiesPage = lazy(() => import('./features/opportunities/components/OpportunitiesPage').then(m => ({ default: m.OpportunitiesPage })));
const EventsPage = lazy(() => import('./features/events/EventsPage').then(m => ({ default: m.EventsPage })));
const ArticleEditorPage = lazy(() => import('./features/news-blog/components/ArticleEditorPage').then(m => ({ default: m.ArticleEditorPage })));
const NewsPage = lazy(() => import('./features/news-blog/components/NewsPage').then(m => ({ default: m.NewsPage })));
const ArticleReaderPage = lazy(() => import('./features/news-blog/components/ArticleReaderPage').then(m => ({ default: m.ArticleReaderPage })));
const ProfilePage = lazy(() => import('./features/profile/components/ProfilePage').then(m => ({ default: m.ProfilePage })));
const LearningHubPage = lazy(() => import('./features/learning-hub/components/student/LearningHubPage').then(m => ({ default: m.LearningHubPage })));
const UserManagementDashboard = lazy(() => import('./features/admin/components/UserManagementDashboard').then(m => ({ default: m.UserManagementDashboard })));
const UserStatsDashboard = lazy(() => import('./features/admin/components/UserStatsDashboard').then(m => ({ default: m.UserStatsDashboard })));
const CourseBuilderPage = lazy(() => import('./features/learning-hub/components/admin/CourseBuilderPage').then(m => ({ default: m.CourseBuilderPage })));
const CertificateAuditDashboard = lazy(() => import('./features/admin/components/CertificateAuditDashboard').then(m => ({ default: m.CertificateAuditDashboard })));
const ResearchHubPage = lazy(() => import('./features/research-center/components/ResearchHubPage').then(m => ({ default: m.ResearchHubPage })));
const ResearchUploadPage = lazy(() => import('./features/research-center/components/ResearchUploadPage').then(m => ({ default: m.ResearchUploadPage })));
const ResearchDetailPage = lazy(() => import('./features/research-center/components/ResearchDetailPage').then(m => ({ default: m.ResearchDetailPage })));
const CertificateVerificationPage = lazy(() => import('./features/learning-hub/components/certificates/CertificateVerificationPage').then(m => ({ default: m.CertificateVerificationPage })));
const SliderManagerPage = lazy(() => import('./features/admin/components/SliderManagerPage').then(m => ({ default: m.SliderManagerPage })));

const ROUTE_ALIASES = {
  // Public Pages
  'newhome': ['/newhome', '/home', '/index', '/main', '/'],
  'about': ['/about', '/about-us', '/info', '/who-we-are'],
  'auth': ['/login', '/auth', '/signin', '/register', '/signup'],
  'join': ['/join', '/apply', '/membership', '/register-network'],
  'profile': ['/profile', '/account', '/me', '/settings'],
  
  // Content & Hubs
  'news': ['/news', '/blog', '/feed', '/articles'],
  'article': ['/article', '/post', '/read', '/story'],
  'opportunities': ['/opportunities', '/jobs', '/careers', '/grants'],
  'events': ['/events', '/calendar', '/activities', '/webinars'],
  'courses': ['/courses', '/lms', '/learning', '/hub', '/dashboard'],
  
  // Research Center
  'research': ['/research', '/publications', '/papers', '/studies'],
  'research-detail': ['/research-detail', '/paper', '/study'],
  'research-upload': ['/research-upload', '/upload-research', '/submit-research', '/new-research'],
  
  // Admin & Creators
  'write-article': ['/write-article', '/new-article', '/editor', '/publish'],
  'admin-users': ['/admin/users', '/admin/members', '/admin/people'],
  'admin-stats': ['/admin/stats', '/admin/analytics', '/admin/dashboard'],
  'admin-courses': ['/admin/courses', '/admin/lms', '/admin/builder'],
  'admin-certificates': ['/admin/certificates', '/admin/certs', '/admin/audit'],
  'admin-slider': ['/admin/slider', '/admin/homepage-slider']
};

export const getViewFromPath = (path) => {
  let p = path.replace(/\/$/, "");
  if (!p) p = '/';

  // Exact matching against all aliases
  for (const [view, aliases] of Object.entries(ROUTE_ALIASES)) {
    if (aliases.includes(p)) return view;
  }

  // Dynamic parameterized routes
  if (p.startsWith('/verify/') || p.startsWith('/certificate/') || p.startsWith('/cert/')) {
    return 'verify';
  }
  if (p.startsWith('/course/') || p.startsWith('/courses/')) {
    return 'courses';
  }
  if (p.startsWith('/research-detail/') || p.startsWith('/research/')) {
    return 'research-detail';
  }
  if (p.startsWith('/article/') || p.startsWith('/news/')) {
    return 'article';
  }
  
  return 'newhome'; // Default fallback
};

export const isKnownPath = (path) => {
  let p = path.replace(/\/$/, "");
  if (!p) return true;

  for (const aliases of Object.values(ROUTE_ALIASES)) {
    if (aliases.includes(p)) return true;
  }

  if (
    p.startsWith('/verify/') || p.startsWith('/certificate/') || p.startsWith('/cert/') ||
    p.startsWith('/course/') || p.startsWith('/courses/') ||
    p.startsWith('/research-detail/') || p.startsWith('/research/') ||
    p.startsWith('/article/') || p.startsWith('/news/')
  ) {
    return true;
  }

  return false;
};

export const getPathFromView = (view) => {
  // The first alias in the array is treated as the "canonical" or primary URL for that view
  return ROUTE_ALIASES[view] ? ROUTE_ALIASES[view][0] : '/newhome';
};

export function useAppRouting(currentView, setCurrentView, setOpenedModal) {
  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname.replace(/\/$/, "");
      setOpenedModal(null);
      if (!isKnownPath(p)) {
        window.history.replaceState({}, '', '/');
      }
      setCurrentView(getViewFromPath(p));
    };
    
    // Initial load
    handlePopState();
    
    // Scroll to segment if matching home section
    const segment = window.location.pathname.substring(1);
    if (['about', 'research', 'training', 'upcoming'].includes(segment)) {
      setTimeout(() => {
        const el = document.getElementById(segment);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (currentView === 'auth') {
      window.scrollTo(0, 0);
    }
  }, [currentView]);

  const navigate = (view, sectionId, extraParam = '') => {
    if (view) {
      setCurrentView(view);
    }

    if (extraParam) {
      window.history.pushState({}, '', `${getPathFromView(view)}?${extraParam}`);
    } else if (sectionId) {
      window.history.pushState({}, '', '/' + sectionId);
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      window.history.pushState({}, '', getPathFromView(view));
    }
  };

  return { navigate };
}

function ProtectedRoute({ permission, children, lang = 'ar', onNavigate }) {
  const { hasPermission, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#0b2849', fontFamily: 'Tajawal, sans-serif' }}>
          {lang === 'ar' ? 'جاري التحقق من الصلاحيات...' : 'Verifying permissions...'}
        </p>
      </div>
    );
  }

  const isMock = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mock') === '1';

  const isAllowed = isMock || (Array.isArray(permission) 
    ? permission.some(p => hasPermission(p))
    : hasPermission(permission));

  if (!isAllowed) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h2 style={{ color: '#0b2849', marginBottom: '8px', fontSize: '22px', fontWeight: 'bold', fontFamily: 'Tajawal, sans-serif' }}>
          {lang === 'ar' ? 'غير مصرح بالدخول' : 'Access Denied'}
        </h2>
        <p style={{ color: 'rgba(11, 40, 73, 0.7)', maxWidth: '400px', marginBottom: '24px', lineHeight: '1.6', fontSize: '14px', fontFamily: 'Tajawal, sans-serif' }}>
          {lang === 'ar' ? 'ليس لديك الصلاحيات الكافية للوصول إلى هذه الصفحة أو إدارة محتواها.' : 'You do not have sufficient permissions to access or manage this page.'}
        </p>
        <button 
          onClick={() => onNavigate('home')}
          style={{ background: '#0b2849', color: '#ffffff', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', fontFamily: 'Tajawal, sans-serif' }}
        >
          {lang === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
        </button>
      </div>
    );
  }

  return children;
}

export function AppRouter({ currentView, setCurrentView, lang, setOpenedModal, navigate }) {
  const simpleNav = (view) => navigate(view);
  const paramNav = (view, idName, id) => navigate(view, null, `${idName}=${id}`);

  const renderView = () => {
    if (currentView === 'home' || currentView === 'newhome' || currentView === 'debug') return <NewHomePage lang={lang} setCurrentView={setCurrentView} setOpenedModal={setOpenedModal} onNavigate={simpleNav} />;
    if (currentView === 'about') return <AboutUsPage lang={lang} onJoinClick={() => navigate('join')} onNavigate={(view, sectionId) => navigate(view, sectionId)} />;
    if (currentView === 'auth') return <AuthPage lang={lang} onAuthSuccess={() => setCurrentView('newhome')} />;
    if (currentView === 'opportunities') return <OpportunitiesPage lang={lang} onNavigate={simpleNav} />;
    if (currentView === 'join') return <JoinUsPage lang={lang} onNavigate={navigate} />;
    if (currentView === 'write-article') return (
      <ProtectedRoute permission={['write:articles', 'manage:any_article']} lang={lang} onNavigate={simpleNav}>
        <ArticleEditorPage lang={lang} onNavigate={simpleNav} />
      </ProtectedRoute>
    );
    if (currentView === 'profile') return <ProfilePage lang={lang} onNavigate={simpleNav} />;
    if (currentView === 'events') return <EventsPage lang={lang} onNavigate={simpleNav} />;
    
    if (currentView === 'news') return <NewsPage lang={lang} onNavigate={(v, id) => {
      if (v === 'article') paramNav('article', 'id', id); 
      else if (v === 'write-article' && id) navigate('write-article', null, id);
      else simpleNav(v);
    }} />;
    
    if (currentView === 'article') return <ArticleReaderPage lang={lang} onNavigate={(v, id) => {
      if (v === 'write-article' && id) navigate('write-article', null, id);
      else simpleNav(v);
    }} />;
    if (currentView === 'courses') return <LearningHubPage lang={lang} onNavigate={simpleNav} />;
    
    // Guarded Admin Portals
    if (currentView === 'admin-users') return (
      <ProtectedRoute permission={['manage:system', 'approve:users']} lang={lang} onNavigate={simpleNav}>
        <UserManagementDashboard lang={lang} onNavigate={simpleNav} />
      </ProtectedRoute>
    );
    if (currentView === 'admin-stats') return (
      <ProtectedRoute permission="view:user_stats" lang={lang} onNavigate={simpleNav}>
        <UserStatsDashboard lang={lang} onNavigate={simpleNav} />
      </ProtectedRoute>
    );
    if (currentView === 'admin-courses') return (
      <ProtectedRoute permission={['manage:any_course', 'manage:courses', 'write:courses']} lang={lang} onNavigate={simpleNav}>
        <CourseBuilderPage lang={lang} onNavigate={simpleNav} />
      </ProtectedRoute>
    );
    if (currentView === 'admin-certificates') return (
      <ProtectedRoute permission={['issue:certs', 'manage:system']} lang={lang} onNavigate={simpleNav}>
        <CertificateAuditDashboard lang={lang} onNavigate={simpleNav} />
      </ProtectedRoute>
    );
    if (currentView === 'admin-slider') return (
      <ProtectedRoute permission="manage:slider" lang={lang} onNavigate={simpleNav}>
        <SliderManagerPage lang={lang} onNavigate={simpleNav} />
      </ProtectedRoute>
    );
    
    if (currentView === 'research') return <ResearchHubPage lang={lang} onNavigate={(v, id) => {
      if (v === 'research-detail') paramNav('research-detail', 'id', id); else simpleNav(v);
    }} />;
    
    if (currentView === 'research-upload') return (
      <ProtectedRoute permission="write:research" lang={lang} onNavigate={simpleNav}>
        <ResearchUploadPage lang={lang} onNavigate={simpleNav} />
      </ProtectedRoute>
    );
    if (currentView === 'research-detail') return <ResearchDetailPage lang={lang} onNavigate={simpleNav} />;
    
    if (currentView === 'verify') return <CertificateVerificationPage lang={lang} certId={window.location.pathname.split('/').pop()} />;
    
    return <NewHomePage lang={lang} setCurrentView={setCurrentView} setOpenedModal={setOpenedModal} onNavigate={simpleNav} />;
  };

  return (
    <Suspense fallback={
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #E2EFFA', borderTopColor: '#0b2849', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      {renderView()}
    </Suspense>
  );
}
