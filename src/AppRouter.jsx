import { useEffect } from 'preact/hooks';
import { AboutUsPage } from './features/about-us/AboutUsPage';
import { DebugUIPage } from './features/debug-ui/DebugUIPage';
import { AuthPage } from './features/auth/AuthPage';
import { JoinUsPage } from './features/join-us/JoinUsPage';
import { OpportunitiesPage } from './features/opportunities/components/OpportunitiesPage';
import { EventsPage } from './features/events/EventsPage';
import { ArticleEditorPage } from './features/news-blog/components/ArticleEditorPage';
import { NewsPage } from './features/news-blog/components/NewsPage';
import { ArticleReaderPage } from './features/news-blog/components/ArticleReaderPage';
import { ProfilePage } from './features/profile/components/ProfilePage';
import { LearningHubPage } from './features/learning-hub/components/student/LearningHubPage';
import { NewHomePage } from './features/main/components/NewHomePage';
import { OldHomePage } from './features/main/components/OldHomePage';
import { UserManagementDashboard } from './features/admin/components/UserManagementDashboard';
import { UserStatsDashboard } from './features/admin/components/UserStatsDashboard';
import { CourseBuilderPage } from './features/learning-hub/components/admin/CourseBuilderPage';
import { CertificateAuditDashboard } from './features/admin/components/CertificateAuditDashboard';
import { ResearchHubPage } from './features/research-center/components/ResearchHubPage';
import { ResearchUploadPage } from './features/research-center/components/ResearchUploadPage';
import { ResearchDetailPage } from './features/research-center/components/ResearchDetailPage';
import { CertificateVerificationPage } from './features/learning-hub/components/certificates/CertificateVerificationPage';

const ROUTE_ALIASES = {
  // Public Pages
  'newhome': ['/newhome', '/home', '/index', '/main', '/'],
  'oldhome': ['/oldhome', '/legacy'],
  'about': ['/about', '/about-us', '/info', '/who-we-are'],
  'auth': ['/auth', '/login', '/signin', '/register', '/signup'],
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
  
  // Utilities
  'debug': ['/debug', '/test', '/ui-test']
};

export const getViewFromPath = (path) => {
  let p = path.replace(/\/$/, "");
  if (!p) p = '/';

  // Dynamic parameterized routes
  if (p.startsWith('/verify/') || p.startsWith('/certificate/') || p.startsWith('/cert/')) {
    return 'verify';
  }

  // Exact matching against all aliases
  for (const [view, aliases] of Object.entries(ROUTE_ALIASES)) {
    if (aliases.includes(p)) return view;
  }
  
  return 'newhome'; // Default fallback
};

export const getPathFromView = (view) => {
  // The first alias in the array is treated as the "canonical" or primary URL for that view
  return ROUTE_ALIASES[view] ? ROUTE_ALIASES[view][0] : '/newhome';
};

export function useAppRouting(currentView, setCurrentView, setOpenedModal) {
  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname.replace(/\/$/, "");
      if (p === '/join' || p === '/apply' || p === '/membership' || p === '/register-network') {
        setOpenedModal('join');
      } else {
        setOpenedModal(null);
        setCurrentView(getViewFromPath(p));
      }
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
    if (view === 'join') {
      setOpenedModal('join');
      window.history.pushState({}, '', '/join');
      return;
    }

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

export function AppRouter({ currentView, setCurrentView, lang, setOpenedModal, navigate }) {
  const simpleNav = (view) => navigate(view);
  const paramNav = (view, idName, id) => navigate(view, null, `${idName}=${id}`);

  if (currentView === 'home' || currentView === 'newhome') return <NewHomePage lang={lang} setCurrentView={setCurrentView} setOpenedModal={setOpenedModal} />;
  if (currentView === 'about') return <AboutUsPage lang={lang} onJoinClick={() => navigate('join')} onNavigate={(view, sectionId) => navigate(view, sectionId)} />;
  if (currentView === 'debug') return <DebugUIPage />;
  if (currentView === 'auth') return <AuthPage lang={lang} onAuthSuccess={() => setCurrentView('newhome')} />;
  if (currentView === 'opportunities') return <OpportunitiesPage lang={lang} onNavigate={simpleNav} />;
  if (currentView === 'join') return <JoinUsPage lang={lang} onNavigate={simpleNav} />;
  if (currentView === 'write-article') return <ArticleEditorPage lang={lang} onNavigate={simpleNav} />;
  if (currentView === 'profile') return <ProfilePage lang={lang} onNavigate={simpleNav} />;
  if (currentView === 'events') return <EventsPage lang={lang} onNavigate={simpleNav} />;
  
  if (currentView === 'news') return <NewsPage lang={lang} onNavigate={(v, id) => {
    if (v === 'article') paramNav('article', 'id', id); else simpleNav(v);
  }} />;
  
  if (currentView === 'article') return <ArticleReaderPage lang={lang} onNavigate={simpleNav} />;
  if (currentView === 'courses') return <LearningHubPage lang={lang} onNavigate={simpleNav} />;
  if (currentView === 'admin-users') return <UserManagementDashboard lang={lang} onNavigate={simpleNav} />;
  if (currentView === 'admin-stats') return <UserStatsDashboard lang={lang} onNavigate={simpleNav} />;
  if (currentView === 'admin-courses') return <CourseBuilderPage lang={lang} onNavigate={simpleNav} />;
  if (currentView === 'admin-certificates') return <CertificateAuditDashboard lang={lang} onNavigate={simpleNav} />;
  
  if (currentView === 'research') return <ResearchHubPage lang={lang} onNavigate={(v, id) => {
    if (v === 'research-detail') paramNav('research-detail', 'id', id); else simpleNav(v);
  }} />;
  
  if (currentView === 'research-upload') return <ResearchUploadPage lang={lang} onNavigate={simpleNav} />;
  if (currentView === 'research-detail') return <ResearchDetailPage lang={lang} onNavigate={simpleNav} />;
  
  if (currentView === 'newhome' || currentView === 'home') return <NewHomePage lang={lang} setCurrentView={setCurrentView} setOpenedModal={setOpenedModal} />;
  
  if (currentView === 'oldhome') return <OldHomePage lang={lang} setOpenedModal={setOpenedModal} setCurrentView={setCurrentView} />;
  
  if (currentView === 'verify') return <CertificateVerificationPage lang={lang} certId={window.location.pathname.split('/').pop()} />;
  
  
  return <NewHomePage lang={lang} setCurrentView={setCurrentView} setOpenedModal={setOpenedModal} />; // Default fallback if no view matched
}
