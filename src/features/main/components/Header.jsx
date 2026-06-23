import { useState } from 'preact/hooks'
import logo from '../../../assets/logo.svg'
import iconHome from '../../../assets/icon_home.svg'
import iconContact from '../../../assets/icon_contact.svg'
import iconTraining from '../../../assets/icon_training.svg'
import iconResearch from '../../../assets/icon_research.svg'
import iconAbout from '../../../assets/icon_about.svg'
import iconSearch from '../../../assets/icon_search.svg'
import iconProfile from '../../../assets/icon_profile.svg'

export function Header({ activeSection, currentView, onNavigate, user, userProfile, onLogout }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
                <span class="figma-nav-text">خروج / Logout ({userProfile?.full_name || user.email})</span>
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
                <span class="figma-nav-text">دخول / Login</span>
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
                <span class="figma-nav-text">لوحة التحكم / Admin</span>
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
              <span class="figma-nav-text">اتصل بنا</span>
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
              <span class="figma-nav-text">دورات تدريبية</span>
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
              <span class="figma-nav-text">أبحاث</span>
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
              <span class="figma-nav-text">من نحن</span>
            </a>

            {/* Middle Search Input Container */}
            <div class="figma-search-container">
              <input 
                type="text" 
                placeholder="البحث..." 
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
              <span class="figma-nav-text">الرئيسية</span>
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
          {user ? (
            <a href="#logout" onClick={(e) => { e.preventDefault(); onLogout(); setDrawerOpen(false); }} class="drawer-link" style={{ color: '#ff4d4d' }}>خروج / Logout ({userProfile?.full_name || user.email})</a>
          ) : (
            <a href="#auth" onClick={(e) => { e.preventDefault(); onNavigate('auth'); setDrawerOpen(false); }} class="drawer-link" style={{ color: '#15b47a' }}>دخول / Login</a>
          )}
          {userProfile && userProfile.role === 'admin' && (
            <a href="#debug" onClick={(e) => { e.preventDefault(); onNavigate('debug'); setDrawerOpen(false); }} class="drawer-link" style={{ color: '#15b47a', fontWeight: 'bold' }}>لوحة التحكم / Admin</a>
          )}
          <a href="#home" onClick={(e) => { e.preventDefault(); onNavigate('home', 'home'); setDrawerOpen(false); }} class="drawer-link">الرئيسية</a>
          <a href="#about" onClick={(e) => { e.preventDefault(); onNavigate('home', 'about'); setDrawerOpen(false); }} class="drawer-link">من نحن</a>
          <a href="#research" onClick={(e) => { e.preventDefault(); onNavigate('home', 'research'); setDrawerOpen(false); }} class="drawer-link">أبحاث</a>
          <a href="#training" onClick={(e) => { e.preventDefault(); onNavigate('home', 'training'); setDrawerOpen(false); }} class="drawer-link">دورات تدريبية</a>
          <a href="#contact" onClick={(e) => { e.preventDefault(); onNavigate('home', 'contact'); setDrawerOpen(false); }} class="drawer-link">اتصل بنا</a>
        </nav>
      </div>
      <div onClick={() => setDrawerOpen(false)} class={`drawer-overlay ${drawerOpen ? 'open' : ''}`}></div>
    </>
  );
}
