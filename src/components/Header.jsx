import { useState } from 'preact/hooks'
import logo from '../assets/logo.svg'
import iconHome from '../assets/icon_home.svg'
import iconContact from '../assets/icon_contact.svg'
import iconTraining from '../assets/icon_training.svg'
import iconResearch from '../assets/icon_research.svg'
import iconFavorite from '../assets/icon_favorite.svg'
import iconAbout from '../assets/icon_about.svg'
import iconSearch from '../assets/icon_search.svg'
import iconHamburger from '../assets/icon_hamburger.svg'

export function Header({ activeSection, currentView, onNavigate }) {
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
            <img src={logo} class="figma-logo-img" alt="كليما ميديكس" />
          </a>

          {/* Center-Right: Navigation Items (RTL order) */}
          <nav class="figma-nav-menu">
            
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

            {/* 3. المفضلة (Commented out)
            <a href="#pillars" class={`figma-nav-item ${activeSection === 'pillars' ? 'active' : ''}`}>
              <img src={iconFavorite} class="figma-nav-icon" alt="المفضلة" />
              <span class="figma-nav-text">المفضلة</span>
            </a>
            */}

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
          <a href="#home" onClick={(e) => { e.preventDefault(); onNavigate('home', 'home'); setDrawerOpen(false); }} class="drawer-link">الرئيسية</a>
          <a href="#about" onClick={(e) => { e.preventDefault(); onNavigate('home', 'about'); setDrawerOpen(false); }} class="drawer-link">من نحن</a>
          {/* <a href="#pillars" onClick={(e) => { e.preventDefault(); onNavigate('home', 'pillars'); setDrawerOpen(false); }} class="drawer-link">المفضلة</a> */}
          <a href="#research" onClick={(e) => { e.preventDefault(); onNavigate('home', 'research'); setDrawerOpen(false); }} class="drawer-link">أبحاث</a>
          <a href="#training" onClick={(e) => { e.preventDefault(); onNavigate('home', 'training'); setDrawerOpen(false); }} class="drawer-link">دورات تدريبية</a>
          <a href="#contact" onClick={(e) => { e.preventDefault(); onNavigate('home', 'contact'); setDrawerOpen(false); }} class="drawer-link">اتصل بنا</a>
        </nav>
      </div>
      <div onClick={() => setDrawerOpen(false)} class={`drawer-overlay ${drawerOpen ? 'open' : ''}`}></div>
    </>
  );
}
