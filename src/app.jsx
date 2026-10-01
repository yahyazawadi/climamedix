import { useState, useEffect } from 'preact/hooks'
import './app.css'
// Import newly created Header & Footer components
import { Header } from './features/main/components/Header'
import { Footer } from './features/main/components/Footer'
import { TopBackground } from './features/main/components/TopBackground'
import { NeatScripples } from './features/main/components/NeatScripples'
import { ColoredBackground } from './features/main/components/ColoredBackground'
import { AppRouter, useAppRouting } from './AppRouter'
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
  return (
    <div style={{ position: 'relative', overflowX: 'hidden', minHeight: '100vh' }}>
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
