import { useState, useEffect } from 'preact/hooks'
import logo from '../../../assets/logo.svg'
import iconHome from '../../../assets/icon_home.svg'
import iconContact from '../../../assets/icon_contact.svg'
import iconTraining from '../../../assets/icon_training.svg'
import iconResearch from '../../../assets/icon_research.svg'
import iconAbout from '../../../assets/icon_about.svg'
import iconSearch from '../../../assets/icon_search.svg'
import iconProfile from '../../../assets/icon_profile.svg'
import iconGlobe from '../../../assets/icon_globe.svg'
import { translations } from '../../../i18n/translations'

export function Header({ activeSection, currentView, onNavigate, user, userProfile, onLogout, lang, toggleLanguage }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  
  const t = translations[lang] || translations.ar;

  // Close dropdown on click outside
  useEffect(() => {
    if (!showLangDropdown) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.language-toggle-btn') && !e.target.closest('.lang-dropdown-menu')) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [showLangDropdown]);

  return (
    <>
      <header class="figma-header">
        <div class="figma-header-container">
          
          {/* Left Side: Brand Logo */}
          <a 
            href="#home" 
            onClick={(e) => {
              e.preventDefault();
              onNavigate('home', 'home');
            }}
            class="figma-logo-link"
          >
            <img src={logo} class="figma-logo-img" alt="كلايما ميدكس" />
          </a>

          {/* Center-Right: Navigation Items (RTL order) */}
          <nav class="figma-nav-menu">
            
            {/* Language Toggle with Dropdown */}
            <div style={{ position: 'relative', display: 'flex', alignSelf: 'center', alignItems: 'center' }}>
              <button 
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                class={`figma-nav-item language-toggle-btn ${showLangDropdown ? 'active' : ''}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 8px', outline: 'none' }}
                title="Select Language / اختيار اللغة"
              >
                <img src={iconGlobe} class="figma-nav-icon" alt="Language" />
              </button>

              {showLangDropdown && (
                <div 
                  class="lang-dropdown-menu" 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translate(-50%, 0)',
                    marginTop: '12px',
                    background: '#04223f',
                    border: '1.5px solid rgba(225, 239, 250, 0.15)',
                    borderRadius: '32px',
                    padding: '14px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    zIndex: 1000,
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  {/* AR Circle */}
                  <button
                    onClick={() => {
                      if (lang !== 'ar') toggleLanguage();
                      setShowLangDropdown(false);
                    }}
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      border: lang === 'ar' ? '2px solid rgba(225, 239, 250, 0.45)' : '2px solid rgba(225, 239, 250, 0.15)',
                      background: lang === 'ar' ? 'rgba(225, 239, 250, 0.18)' : 'transparent',
                      color: lang === 'ar' ? '#ffffff' : 'rgba(225, 239, 250, 0.55)',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'Tajawal, sans-serif',
                      outline: 'none'
                    }}
                    class="lang-circle-btn"
                  >
                    AR
                  </button>

                  {/* EN Circle */}
                  <button
                    onClick={() => {
                      if (lang !== 'en') toggleLanguage();
                      setShowLangDropdown(false);
                    }}
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      border: lang === 'en' ? '2px solid rgba(225, 239, 250, 0.45)' : '2px solid rgba(225, 239, 250, 0.15)',
                      background: lang === 'en' ? 'rgba(225, 239, 250, 0.18)' : 'transparent',
                      color: lang === 'en' ? '#ffffff' : 'rgba(225, 239, 250, 0.55)',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'Tajawal, sans-serif',
                      outline: 'none'
                    }}
                    class="lang-circle-btn"
                  >
                    EN
                  </button>
                </div>
              )}
            </div>

            {/* Auth Item */}
            {user ? (
              <a 
                href="#logout" 
                onClick={(e) => {
                  e.preventDefault();
                  onLogout();
                }}
                class="figma-nav-item"
                style={{ color: '#ff4d4d' }}
              >
                <img src={iconProfile} class="figma-nav-icon" alt="الملف الشخصي" />
                <span class="figma-nav-text">{t.logout} ({userProfile?.full_name || user.email})</span>
              </a>
            ) : (
              <a 
                href="#auth" 
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('auth');
                }}
                class={`figma-nav-item ${currentView === 'auth' ? 'active' : ''}`}
              >
                <img src={iconProfile} class="figma-nav-icon" alt="دخول / Login" />
                <span class="figma-nav-text">{t.login}</span>
              </a>
            )}

            {/* Admin Dashboard link */}
            {userProfile && userProfile.role === 'admin' && (
              <a 
                href="#debug" 
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('debug');
                }}
                class={`figma-nav-item ${currentView === 'debug' ? 'active' : ''}`}
              >
                <span class="figma-nav-text">{t.admin}</span>
              </a>
            )}

            {/* 6. اتصل بنا */}
            <a 
              href="#contact" 
              onClick={(e) => {
                e.preventDefault();
                onNavigate('home', 'contact');
              }}
              class={`figma-nav-item ${activeSection === 'contact' && currentView === 'home' ? 'active' : ''}`}
            >
              <img src={iconContact} class="figma-nav-icon" alt="اتصل بنا" />
              <span class="figma-nav-text">{t.contact}</span>
            </a>

            {/* 5. دورات تدريبية */}
            <a 
              href="#training" 
              onClick={(e) => {
                e.preventDefault();
                onNavigate('home', 'training');
              }}
              class={`figma-nav-item ${activeSection === 'training' && currentView === 'home' ? 'active' : ''}`}
            >
              <img src={iconTraining} class="figma-nav-icon" alt="دورات تدريبية" />
              <span class="figma-nav-text">{t.training}</span>
            </a>

            {/* 4. أبحاث */}
            <a 
              href="#research" 
              onClick={(e) => {
                e.preventDefault();
                onNavigate('home', 'research');
              }}
              class={`figma-nav-item ${activeSection === 'research' && currentView === 'home' ? 'active' : ''}`}
            >
              <img src={iconResearch} class="figma-nav-icon" alt="أبحاث" />
              <span class="figma-nav-text">{t.research}</span>
            </a>

            {/* 2. من نحن */}
            <a 
              href="#about" 
              onClick={(e) => {
                e.preventDefault();
                onNavigate('home', 'about');
              }}
              class={`figma-nav-item ${activeSection === 'about' && currentView === 'home' ? 'active' : ''}`}
            >
              <img src={iconAbout} class="figma-nav-icon" alt="من نحن" />
              <span class="figma-nav-text">{t.about}</span>
            </a>

            {/* Middle Search Input Container */}
            <div class="figma-search-container">
              <input 
                type="text" 
                placeholder={t.search}
                value={searchQuery}
                onInput={(e) => setSearchQuery(e.target.value)}
                class="figma-search-input"
              />
              <img src={iconSearch} class="figma-search-icon" alt="بحث" />
            </div>

            {/* 1. الرئيسية */}
            <a 
              href="#home" 
              onClick={(e) => {
                e.preventDefault();
                onNavigate('home', 'home');
              }}
              class={`figma-nav-item ${activeSection === 'home' && currentView === 'home' ? 'active' : ''}`}
            >
              <img src={iconHome} class="figma-nav-icon" alt="الرئيسية" />
              <span class="figma-nav-text">{t.home}</span>
            </a>

          </nav>

          {/* Far Right: Hamburger Trigger — animates into X when open */}
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            class={`figma-hamburger-trigger ${drawerOpen ? 'is-open' : ''}`}
            aria-label="القائمة"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

        </div>
      </header>

      {/* Mobile Drawer */}
      <div class={`mobile-drawer ${drawerOpen ? 'open' : ''}`}>
        <nav class="drawer-nav">
          <a href="#lang" onClick={(e) => { e.preventDefault(); toggleLanguage(); setDrawerOpen(false); }} class="drawer-link" style={{ color: '#15b47a', fontWeight: 'bold' }}>
            {lang === 'ar' ? 'English (EN)' : 'العربية (AR)'}
          </a>
          {user ? (
            <a href="#logout" onClick={(e) => { e.preventDefault(); onLogout(); setDrawerOpen(false); }} class="drawer-link" style={{ color: '#ff4d4d' }}>{t.logout} ({userProfile?.full_name || user.email})</a>
          ) : (
            <a href="#auth" onClick={(e) => { e.preventDefault(); onNavigate('auth'); setDrawerOpen(false); }} class="drawer-link" style={{ color: '#15b47a' }}>{t.login}</a>
          )}
          {userProfile && userProfile.role === 'admin' && (
            <a href="#debug" onClick={(e) => { e.preventDefault(); onNavigate('debug'); setDrawerOpen(false); }} class="drawer-link" style={{ color: '#15b47a', fontWeight: 'bold' }}>{t.admin}</a>
          )}
          <a href="#home" onClick={(e) => { e.preventDefault(); onNavigate('home', 'home'); setDrawerOpen(false); }} class="drawer-link">{t.home}</a>
          <a href="#about" onClick={(e) => { e.preventDefault(); onNavigate('home', 'about'); setDrawerOpen(false); }} class="drawer-link">{t.about}</a>
          <a href="#research" onClick={(e) => { e.preventDefault(); onNavigate('home', 'research'); setDrawerOpen(false); }} class="drawer-link">{t.research}</a>
          <a href="#training" onClick={(e) => { e.preventDefault(); onNavigate('home', 'training'); setDrawerOpen(false); }} class="drawer-link">{t.training}</a>
          <a href="#contact" onClick={(e) => { e.preventDefault(); onNavigate('home', 'contact'); setDrawerOpen(false); }} class="drawer-link">{t.contact}</a>
        </nav>
      </div>
      <div onClick={() => setDrawerOpen(false)} class={`drawer-overlay ${drawerOpen ? 'open' : ''}`}></div>
    </>
  );
}
