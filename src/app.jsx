import { useState, useEffect } from 'preact/hooks'
import './app.css'
// Import newly created Header & Footer components
import { Header } from './features/main/components/Header'
import { Footer } from './features/main/components/Footer'
import { TopBackground } from './features/main/components/TopBackground'
import { NeatScripples } from './features/main/components/NeatScripples'
import { ColoredBackground } from './features/main/components/ColoredBackground'
import { AppRouter, useAppRouting, getViewFromPath } from './AppRouter'
import { AuthProvider, useAuth } from './features/auth/hooks/useAuth'
import { translations } from './i18n/translations'
import { LoadingPlanet } from './features/shared/components/LoadingPlanet'
import { useLenisScroll } from './features/shared/hooks/useLenisScroll'

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
function AppContent() {
  const [theme, setTheme] = useState('light');
  const [lang, setLang] = useState(() => {
    return document.documentElement.getAttribute('lang') || 'ar';
  });
  const [activeSection, setActiveSection] = useState('home');
  const [openedModal, setOpenedModal] = useState(null); // 'join', 'policy'
  const [currentView, setCurrentView] = useState('newhome'); // 'newhome', 'home', or others
  const [initialLoading, setInitialLoading] = useState(true);
  const { user, userProfile, signOut } = useAuth();

  // Lenis smooth scroll — desktop homepage only; hook self-guards against touch/mobile/other views
  useLenisScroll(currentView);
  const handleLogout = async () => {
    await signOut();
    setCurrentView('home');
  };
  
  const toggleLanguage = () => {
    const newLang = lang === 'ar' ? 'en' : 'ar';
    setLang(newLang);
    document.documentElement.setAttribute('lang', newLang);
    document.documentElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
  };
  const t = translations[lang] || translations.ar;
  // Theme Sync on Mount + Path Routing
  useEffect(() => {
    // Force light theme
    setTheme('light');
    document.body.classList.remove('dark-mode');
  }, []);

  const { navigate } = useAppRouting(currentView, setCurrentView, setOpenedModal);

  // Restore pending target URL after successful login (including OAuth redirects)
  useEffect(() => {
    if (user) {
      try {
        const savedRedirect = sessionStorage.getItem('cm_auth_redirect');
        if (savedRedirect && (savedRedirect.startsWith('/') || savedRedirect.startsWith('http'))) {
          sessionStorage.removeItem('cm_auth_redirect');
          let pathWithQuery = savedRedirect;
          if (savedRedirect.startsWith('http')) {
            try {
              const u = new URL(savedRedirect);
              pathWithQuery = u.pathname + u.search;
            } catch (e) {}
          }
          const [targetPath] = pathWithQuery.split('?');
          const targetView = getViewFromPath(targetPath);
          window.history.replaceState({}, '', pathWithQuery);
          setCurrentView(targetView);
        }
      } catch (e) {
        console.warn('Error restoring auth redirect:', e);
      }
    }
  }, [user]);
  // Theme Switch handler
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };
  // Scroll Spy for active section styling (rAF throttled to prevent mobile jitter & layout thrashing)
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const sections = document.querySelectorAll('section[id], footer[id]');
          const scrollY = window.scrollY;
          let currentSection = 'home';
          
          sections.forEach((section) => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 150;
            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
              currentSection = section.getAttribute('id');
            }
          });
          setActiveSection(currentSection);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Offline / Network Connection Monitor
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div style={{ position: 'relative', overflowX: 'hidden', minHeight: '100vh', paddingTop: isOffline ? '42px' : '0' }}>
      {/* Offline Alert Bar (Zero Emojis, Pure SVG) */}
      {isOffline && (
        <div 
          role="alert"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 99999,
            background: 'linear-gradient(90deg, #991b1b, #b91c1c)',
            color: '#ffffff',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            fontSize: '13.5px',
            fontWeight: '600',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            direction: lang === 'ar' ? 'rtl' : 'ltr'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9"/>
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
            <line x1="12" y1="20" x2="12.01" y2="20"/>
          </svg>
          <span>{lang === 'ar' ? 'لا يوجد اتصال بالإنترنت. يرجى التحقق من اتصال الشبكة.' : 'No internet connection. Please check your network connection.'}</span>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.4)',
              color: '#ffffff',
              padding: '3px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12.5px',
              fontWeight: 'bold',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.35)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          >
            {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      )}

      {/* Brand Planet Loading Screen */}
      {initialLoading && currentView !== 'loading' && (
        <LoadingPlanet
          isReady={false}
          lang={lang}
          onFinished={() => setInitialLoading(false)}
        />
      )}
      {/* Background components */}
      {currentView === 'home' || currentView === 'newhome' ? (
        <>
          <TopBackground />
          <NeatScripples />
          <ColoredBackground />
        </>
      ) : null}
      {/* Header component */}
      <Header 
        theme={theme} 
        toggleTheme={toggleTheme} 
        activeSection={activeSection} 
        currentView={currentView}
        user={user}
        userProfile={userProfile}
        onLogout={handleLogout}
        lang={lang}
        toggleLanguage={toggleLanguage}
        onNavigate={navigate}
        onJoinClick={() => navigate('join')} 
      />
            <AppRouter 
        currentView={currentView}
        setCurrentView={setCurrentView}
        lang={lang}
        setOpenedModal={setOpenedModal}
        navigate={navigate}
      />
      {/* Footer component */}
      <Footer 
        lang={lang}
        currentView={currentView}
        user={user}
        onLogout={handleLogout}
        onJoinClick={() => navigate('join')} 
        onNavigate={navigate}
      />
    </div>
  )
}
