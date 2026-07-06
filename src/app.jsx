import { useState, useEffect } from 'preact/hooks'
import './app.css'
// Import newly created Header & Footer components
import { Header } from './features/main/components/Header'
import { Footer } from './features/main/components/Footer'
import { TopBackground } from './features/main/components/TopBackground'
import { NeatScripples } from './features/main/components/NeatScripples'
import { ColoredBackground } from './features/main/components/ColoredBackground'
import { Button } from './features/shared/components/Button'
import { GlassCard } from './features/shared/components/GlassCard'
import { AboutUsPage } from './features/about-us/AboutUsPage'
import { DebugUIPage } from './features/debug-ui/DebugUIPage'
import { AuthPage } from './features/auth/AuthPage'
import { JoinUsPage } from './features/join-us/JoinUsPage'
import { OpportunitiesPage } from './features/opportunities/components/OpportunitiesPage'
import { EventsPage } from './features/events/EventsPage'
import { ArticleEditorPage } from './features/news-blog/components/ArticleEditorPage'
import { NewsPage } from './features/news-blog/components/NewsPage'
import { ArticleReaderPage } from './features/news-blog/components/ArticleReaderPage'
import { HomeNewsWidget } from './features/news-blog/components/HomeNewsWidget'
import { ArabWorldMap } from './features/main/components/ArabWorldMap'
import { ProfilePage } from './features/profile/components/ProfilePage'
import { LearningHubPage } from './features/learning-hub/components/student/LearningHubPage'
import { NewHomePage } from './features/main/components/NewHomePage'
import { UserManagementDashboard } from './features/admin/components/UserManagementDashboard'
import { UserStatsDashboard } from './features/admin/components/UserStatsDashboard'
import { CourseBuilderPage } from './features/learning-hub/components/admin/CourseBuilderPage'
import { CertificateAuditDashboard } from './features/admin/components/CertificateAuditDashboard'
import { ResearchHubPage } from './features/research-center/components/ResearchHubPage'
import { ResearchUploadPage } from './features/research-center/components/ResearchUploadPage'
import { ResearchDetailPage } from './features/research-center/components/ResearchDetailPage'
import { CertificateVerificationPage } from './features/learning-hub/components/certificates/CertificateVerificationPage'
import { AuthProvider, useAuth } from './features/auth/hooks/useAuth'
import { translations } from './i18n/translations'
import doctorImg from './assets/bg_3.png'
import whiteLogo from './assets/footer_logo.svg'
// Import section assets
import research1 from './assets/research_1.png'
import research2 from './assets/research_2.png'
import research3 from './assets/research_3.png'
import research4 from './assets/bg_1.png'
import training1 from './assets/training_1.png'
import training2 from './assets/training_2.png'
import training3 from './assets/training_3.png'
import training4 from './assets/training_4.png'
import upcoming1 from './assets/upcoming_1.png'
import upcoming2 from './assets/upcoming_2.png'
import iconHome from './assets/icon_home.svg'
import iconAbout from './assets/icon_about.svg'
import iconFavorite from './assets/icon_favorite.svg'
import iconResearch from './assets/icon_research.svg'
import iconTraining from './assets/icon_training.svg'
import iconContact from './assets/icon_contact.svg'
const DISCOVERY_ITEMS = [
  {
    id: 'disc-1',
    category: 'course',
    badge: { ar: 'مسار تدريبي', en: 'Training Course' },
    title: { 
      ar: 'زمالة VSCHEF المتخصصة للمناخ والصحة في المنطقة العربية', 
      en: 'VSCHEF Fellowship for Climate & Health in the Arab Region' 
    },
    image: training1,
    views: 1450,
    likes: 382,
    comments: 45
  },
  {
    id: 'disc-2',
    category: 'research',
    badge: { ar: 'بحث علمي', en: 'Scientific Research' },
    title: { 
      ar: 'أثر تلوث الهواء على الأمراض التنفسية في المناطق الحضرية المزدحمة', 
      en: 'Impact of urban air pollution on acute respiratory illnesses' 
    },
    image: research1,
    views: 980,
    likes: 215,
    comments: 18
  },
  {
    id: 'disc-3',
    category: 'article',
    badge: { ar: 'مقال طبي', en: 'Medical Article' },
    title: { 
      ar: 'أزمة المياه وتأثيرها المباشر على الصحة العامة في العراق', 
      en: 'Water crisis and its direct impact on public health in Iraq' 
    },
    image: research2,
    views: 654,
    likes: 198,
    comments: 29
  },
  {
    id: 'disc-4',
    category: 'post',
    badge: { ar: 'منشور / نشاط', en: 'Activity Post' },
    title: { 
      ar: 'الاستجابة الطبية الطارئة للكوارث المناخية والبيئية المتسارعة', 
      en: 'Emergency medical response to climate disasters' 
    },
    image: training2,
    views: 520,
    likes: 142,
    comments: 15
  },
  {
    id: 'disc-5',
    category: 'course',
    badge: { ar: 'مسار تدريبي', en: 'Training Course' },
    title: { 
      ar: 'مبادئ الصحة العامة البيئية وتطبيقاتها السريرية للمستشفيات', 
      en: 'Principles of environmental public health and clinical applications' 
    },
    image: training3,
    views: 1102,
    likes: 294,
    comments: 38
  }
];
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
  const [currentView, setCurrentView] = useState('home'); // 'home' or 'about'
  const { user, userProfile, signOut } = useAuth();
  const [discoveryIndex, setDiscoveryIndex] = useState(0);
  const [likedItems, setLikedItems] = useState({});
  const itemsPerView = window.innerWidth < 600 ? 1 : window.innerWidth < 992 ? 2 : 3;
  const handleNextDiscovery = () => {
    setDiscoveryIndex((prev) => (prev + 1) % (DISCOVERY_ITEMS.length - itemsPerView + 1));
  };
  const handlePrevDiscovery = () => {
    setDiscoveryIndex((prev) => 
      prev === 0 ? DISCOVERY_ITEMS.length - itemsPerView : prev - 1
    );
  };
  const handleLike = (id) => {
    setLikedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
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
  // Form States for Header/Footer modal triggers
  const [joinForm, setJoinForm] = useState({ name: '', email: '', profession: '' });
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [joinSubmitting, setJoinSubmitting] = useState(false);
  const t = translations[lang] || translations.ar;
  // Theme Sync on Mount + Path Routing
  useEffect(() => {
    // Force light theme
    setTheme('light');
    document.body.classList.remove('dark-mode');
    // Set initial view from URL path
    const path = window.location.pathname.replace(/\/$/, "");
    if (path === '/about') {
      setCurrentView('about');
    } else if (path === '/debug') {
      setCurrentView('debug');
    } else if (path === '/auth') {
      setCurrentView('auth');
    } else if (path === '/opportunities') {
      setCurrentView('opportunities');
    } else if (path === '/join') {
      setOpenedModal('join');
    } else if (path === '/events') {
      setCurrentView('events');
    } else if (path === '/write-article') {
      setCurrentView('write-article');
    } else if (path === '/profile') {
      setCurrentView('profile');
    } else if (path === '/news') {
      setCurrentView('news');
    } else if (path === '/article') {
      setCurrentView('article');
    } else if (path === '/courses') {
      setCurrentView('courses');
    } else if (path === '/admin/users') {
      setCurrentView('admin-users');
    } else if (path === '/admin/stats') {
      setCurrentView('admin-stats');
    } else if (path === '/admin/courses') {
      setCurrentView('admin-courses');
    } else if (path === '/admin/certificates') {
      setCurrentView('admin-certificates');
    } else if (path === '/research') {
      setCurrentView('research');
    } else if (path === '/research-upload') {
      setCurrentView('research-upload');
    } else if (path === '/research-detail') {
      setCurrentView('research-detail');
    } else if (path.startsWith('/verify/')) {
      setCurrentView('verify');
    } else if (path === '/newhome') {
      setCurrentView('newhome');
    } else {
      setCurrentView('home');
      // Scroll to segment if matching home section
      const segment = window.location.pathname.substring(1);
      if (['about', 'research', 'training', 'upcoming'].includes(segment)) {
        setTimeout(() => {
          const el = document.getElementById(segment);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    }
    // Listen for path changes (browser back/forward)
    const handlePopState = () => {
      const p = window.location.pathname.replace(/\/$/, "");
      if (p === '/about') {
        setCurrentView('about');
      } else if (p === '/debug') {
        setCurrentView('debug');
      } else if (p === '/auth') {
        setCurrentView('auth');
      } else if (p === '/opportunities') {
        setCurrentView('opportunities');
      } else if (p === '/join') {
        setOpenedModal('join');
      } else if (p === '/events') {
        setCurrentView('events');
      } else if (p === '/write-article') {
        setCurrentView('write-article');
      } else if (p === '/profile') {
        setCurrentView('profile');
      } else if (p === '/news') {
        setCurrentView('news');
      } else if (p === '/article') {
        setCurrentView('article');
      } else if (p === '/courses') {
        setCurrentView('courses');
      } else if (p === '/admin/users') {
        setCurrentView('admin-users');
      } else if (p === '/admin/stats') {
        setCurrentView('admin-stats');
      } else if (p === '/admin/courses') {
        setCurrentView('admin-courses');
      } else if (p === '/admin/certificates') {
        setCurrentView('admin-certificates');
      } else if (p === '/research') {
        setCurrentView('research');
      } else if (p === '/research-upload') {
        setCurrentView('research-upload');
      } else if (p === '/research-detail') {
        setCurrentView('research-detail');
      } else if (p.startsWith('/verify/')) {
        setCurrentView('verify');
      } else if (p === '/newhome') {
        setCurrentView('newhome');
      } else {
        setCurrentView('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  // Scroll to top when navigating to auth view
  useEffect(() => {
    if (currentView === 'auth') {
      window.scrollTo(0, 0);
    }
  }, [currentView]);
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
  // Scroll Spy for active section styling
  useEffect(() => {
    const handleScroll = () => {
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
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  // Join form submission
  const handleJoinSubmit = (e) => {
    e.preventDefault();
    setJoinSubmitting(true);
    setTimeout(() => {
      setJoinSubmitting(false);
      setJoinSuccess(true);
      setTimeout(() => {
        setJoinForm({ name: '', email: '', profession: '' });
        setJoinSuccess(false);
        setOpenedModal(null);
      }, 2000);
    }, 1000);
  };
  return (
    <div style={{ position: 'relative', overflowX: 'hidden', minHeight: '100vh' }}>
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
        onNavigate={(view, sectionId) => {
          if (view !== 'join') setCurrentView(view);
          if (view === 'about') {
            window.history.pushState({}, '', '/about');
          } else if (view === 'debug') {
            window.history.pushState({}, '', '/debug');
          } else if (view === 'auth') {
            window.history.pushState({}, '', '/auth');
          } else if (view === 'opportunities') {
            window.history.pushState({}, '', '/opportunities');
          } else if (view === 'join') {
            setOpenedModal('join');
            window.history.pushState({}, '', '/join');
          } else if (view === 'events') {
            window.history.pushState({}, '', '/events');
          } else if (view === 'news') {
            window.history.pushState({}, '', '/news');
          } else if (view === 'courses') {
            window.history.pushState({}, '', '/courses');
          } else if (view === 'admin-users') {
            window.history.pushState({}, '', '/admin/users');
          } else if (view === 'admin-stats') {
            window.history.pushState({}, '', '/admin/stats');
          } else if (view === 'admin-courses') {
            window.history.pushState({}, '', '/admin/courses');
          } else if (view === 'admin-certificates') {
            window.history.pushState({}, '', '/admin/certificates');
          } else if (view === 'research') {
            window.history.pushState({}, '', '/research');
          } else if (view === 'research-upload') {
            window.history.pushState({}, '', '/research-upload');
          } else if (view === 'newhome') {
            window.history.pushState({}, '', '/newhome');
          } else if (sectionId) {
            window.history.pushState({}, '', '/' + sectionId);
            setTimeout(() => {
              const el = document.getElementById(sectionId);
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          } else {
            window.history.pushState({}, '', '/');
          }
        }}
        onJoinClick={() => { setOpenedModal('join'); window.history.pushState({}, '', '/join'); }} 
      />
      {currentView === 'home' ? (
        <main className="figma-main-content">
        <section id="home" className="figma-hero-section">
          <div className="figma-hero-container">
            {/* Frame 43 */}
            <div className="figma-frame-43">
              
              {/* Left Side: Doctor Image Circle */}
              <div className="figma-hero-doctor-wrap">
                <img src={doctorImg} className="figma-hero-doctor-img" alt="ممارس صحي" />
              </div>
              
              {/* Right Side: Text Column */}
              <div className="figma-hero-text-col">
                <div className="figma-hero-white-text-group">
                  <img src={whiteLogo} className="figma-hero-white-logo" alt="كلايما ميدكس" />
                  <h2 className="figma-hero-subtitle">{t.heroSubtitle}</h2>
                </div>
                <p className="figma-hero-description">
                  <span className="figma-hero-desc-top">{t.heroDescTop}</span>
                  {" "}
                  <span className="figma-hero-desc-bottom">{t.heroDescBottom}</span>
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* Home News Widget inserted right after Hero */}
        <HomeNewsWidget 
          lang={lang} 
          onNavigate={(view, articleId) => {
            if (view === 'article') {
              setCurrentView('article');
              window.history.pushState({}, '', '/article?id=' + articleId);
            } else {
              setCurrentView(view);
              window.history.pushState({}, '', '/' + (view === 'home' ? '' : view));
            }
          }} 
        />
        {/* Dynamic Discovery Carousel Section */}
        <section className="figma-discovery-section">
          <div className="discovery-container">
            <div className="discovery-header">
              <h2 className="discovery-title">
                {lang === 'ar' ? 'منصة الاكتشاف الموحدة' : 'Unified Discovery Showcase'}
              </h2>
              <p className="discovery-subtitle">
                {lang === 'ar' 
                  ? 'استكشف أحدث المقالات العلمية، الأبحاث الطبية، والمسارات التدريبية في مكان واحد' 
                  : 'Explore the latest articles, medical research, and training courses in one place'}
              </p>
            </div>
            <div className="discovery-carousel-outer">
              <div 
                className="discovery-carousel-inner"
                style={{ 
                  transform: `translateX(${lang === 'ar' ? (discoveryIndex * (100 / itemsPerView)) : (-discoveryIndex * (100 / itemsPerView))}%)` 
                }}
              >
                {DISCOVERY_ITEMS.map((item) => (
                  <div key={item.id} className="discovery-card">
                    <div className="discovery-thumb-wrap">
                      <span className={`discovery-badge ${item.category}`}>
                        {item.badge[lang]}
                      </span>
                      <img src={item.image} className="discovery-thumb" alt={item.title[lang]} />
                    </div>
                    <div className="discovery-card-body">
                      <h3 className="discovery-card-title">
                        {item.title[lang]}
                      </h3>
                      <div className="discovery-metrics-row">
                        <div className="discovery-metric-item">
                          👁️ {item.views}
                        </div>
                        <div className="discovery-metric-item" onClick={() => handleLike(item.id)} style={{ cursor: 'pointer', transition: 'color 0.2s', color: likedItems[item.id] ? '#15b47a' : 'inherit' }}>
                          ❤️ {item.likes + (likedItems[item.id] ? 1 : 0)}
                        </div>
                        <div className="discovery-metric-item">
                          💬 {item.comments}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Navigation buttons */}
              <button className="discovery-nav-btn prev" onClick={handlePrevDiscovery}>
                {lang === 'ar' ? '←' : '→'}
              </button>
              <button className="discovery-nav-btn next" onClick={handleNextDiscovery}>
                {lang === 'ar' ? '→' : '←'}
              </button>
            </div>
          </div>
        </section>
        {/* About Section */}
        <section id="about" className="figma-about-section">
          <div className="figma-section-container">
            <GlassCard className="figma-about-intro-box">
              <h2 className="figma-about-box-title">{t.whoWeAre}</h2>
              <p className="figma-about-intro-text">
                {t.aboutIntroText}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                <Button variant="gradient" onClick={() => setCurrentView('about')}>
                  {t.viewMore}
                </Button>
              </div>
            </GlassCard>
            
            <div className="figma-vision-mission-grid">
              <GlassCard className="figma-vision-card">
                <div className="figma-vision-card-header">
                  <h3>{t.vision}</h3>
                </div>
                <p>{t.visionText}</p>
              </GlassCard>
              <GlassCard className="figma-mission-card">
                <div className="figma-vision-card-header">
                  <h3>{t.mission}</h3>
                </div>
                <p>{t.missionText}</p>
              </GlassCard>
            </div>
          </div>
        </section>
        {/* Research Section */}
        <section id="research" className="figma-research-section">
          <div className="figma-section-container">
            <h2 className="figma-section-title-main">{t.latestResearch}</h2>
            
            <div className="figma-cards-grid-4">
              {/* Card 1 */}
              <div className="figma-item-card">
                <div className="figma-item-card-image-wrap">
                  <img src={research1} alt="أثر تلوث الهواء" />
                </div>
                <div className="figma-item-card-content">
                  <span className="figma-item-card-location">{lang === 'ar' ? 'الموقع: فلسطين' : 'Location: Palestine'}</span>
                  <h3 className="figma-item-card-title">{lang === 'ar' ? 'أثر تلوث الهواء على الأمراض التنفسية في المناطق الحضرية.' : 'Impact of air pollution on respiratory diseases in urban areas.'}</h3>
                  <div className="figma-item-card-progress-wrap">
                    <span className="figma-item-card-progress-text">{lang === 'ar' ? 'التقدم: 85%' : 'Progress: 85%'}</span>
                    <div className="figma-item-card-progress-bar">
                      <div className="figma-item-card-progress-fill" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  <Button variant="more" onClick={() => setOpenedModal('policy')}>{lang === 'ar' ? 'المزيد' : 'More'}</Button>
                </div>
              </div>
              {/* Card 2 */}
              <div className="figma-item-card">
                <div className="figma-item-card-image-wrap">
                  <img src={research2} alt="تغير المناخ والأمراض المدارية" />
                </div>
                <div className="figma-item-card-content">
                  <span className="figma-item-card-location">{lang === 'ar' ? 'الموقع: الأردن' : 'Location: Jordan'}</span>
                  <h3 className="figma-item-card-title">{lang === 'ar' ? 'تغير المناخ وانتشار الأمراض المدارية في البحر الأبيض المتوسط.' : 'Climate change and vector-borne diseases in the Mediterranean.'}</h3>
                  <div className="figma-item-card-progress-wrap">
                    <span className="figma-item-card-progress-text">{lang === 'ar' ? 'التقدم: 60%' : 'Progress: 60%'}</span>
                    <div className="figma-item-card-progress-bar">
                      <div className="figma-item-card-progress-fill" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                  <Button variant="more" onClick={() => setOpenedModal('policy')}>{lang === 'ar' ? 'المزيد' : 'More'}</Button>
                </div>
              </div>
              {/* Card 3 */}
              <div className="figma-item-card">
                <div className="figma-item-card-image-wrap">
                  <img src={research3} alt="الاستدامة في المستشفيات" />
                </div>
                <div className="figma-item-card-content">
                  <span className="figma-item-card-location">{lang === 'ar' ? 'الموقع: مصر' : 'Location: Egypt'}</span>
                  <h3 className="figma-item-card-title">{lang === 'ar' ? 'تقييم الاستدامة البيئية في المستشفيات والمراكز الطبية.' : 'Environmental sustainability assessment in hospitals & medical centers.'}</h3>
                  <div className="figma-item-card-progress-wrap">
                    <span className="figma-item-card-progress-text">{lang === 'ar' ? 'التقدم: 40%' : 'Progress: 40%'}</span>
                    <div className="figma-item-card-progress-bar">
                      <div className="figma-item-card-progress-fill" style={{ width: '40%' }}></div>
                    </div>
                  </div>
                  <Button variant="more" onClick={() => setOpenedModal('policy')}>{lang === 'ar' ? 'المزيد' : 'More'}</Button>
                </div>
              </div>
              {/* Card 4 */}
              <div className="figma-item-card">
                <div className="figma-item-card-image-wrap">
                  <img src={research4} alt="درجات الحرارة والعمال" />
                </div>
                <div className="figma-item-card-content">
                  <span className="figma-item-card-location">{lang === 'ar' ? 'الموقع: الخليج العربي' : 'Location: Arab Gulf'}</span>
                  <h3 className="figma-item-card-title">{lang === 'ar' ? 'تأثير درجات الحرارة المرتفعة على صحة العمال في قطاع البناء.' : 'Impact of extreme high temperatures on construction worker health.'}</h3>
                  <div className="figma-item-card-progress-wrap">
                    <span className="figma-item-card-progress-text">{lang === 'ar' ? 'التقدم: 95%' : 'Progress: 95%'}</span>
                    <div className="figma-item-card-progress-bar">
                      <div className="figma-item-card-progress-fill" style={{ width: '95%' }}></div>
                    </div>
                  </div>
                  <Button variant="more" onClick={() => setOpenedModal('policy')}>{lang === 'ar' ? 'المزيد' : 'More'}</Button>
                </div>
              </div>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <Button variant="gradient" style={{ padding: '14px 36px' }} onClick={() => { setCurrentView('research'); window.history.pushState({}, '', '/research'); }}>
                {lang === 'ar' ? 'تصفح جميع الأبحاث' : 'Browse All Research'}
              </Button>
            </div>
          </div>
        </section>
        {/* Newsletter/Join CTA Block (Frame 45) */}
        <section className="figma-newsletter-cta-section">
          <div className="figma-cta-section-wrap">
            <h3 className="figma-cta-title">{lang === 'ar' ? 'ابقَ على اطلاع بأحدث الأبحاث!' : 'Stay updated with the latest research!'}</h3>
            <p className="figma-cta-description">
              {lang === 'ar' ? 'نحن نخطط لإطلاق عدد من المشاريع البحثية الجديدة قريبًا. إذا كنت مهتمًا بالمشاركة، يمكنك التقديم عبر نموذج التسجيل أدناه.' : 'We plan to launch several new research projects soon. If you are interested in participating, you can apply via the registration form below.'}
            </p>
            <Button variant="gradient" onClick={() => { setCurrentView('join'); window.history.pushState({}, '', '/join'); }}>
              {lang === 'ar' ? 'انضم لفريق البحث' : 'Join the Research Team'}
            </Button>
          </div>
        </section>
        {/* Community Network Map Section */}
        <section id="community" className="figma-training-section" style={{ background: '#f8fafc', position: 'relative', zIndex: 5 }}>
          <div className="figma-section-container">
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 className="figma-section-title-main" style={{ color: '#0b2849', marginBottom: '10px' }}>
                {lang === 'ar' ? 'شبكة كلايما ميدكس الإقليمية' : 'ClimaMedix Regional Network'}
              </h2>
              <p style={{ color: 'rgba(11, 40, 73, 0.7)', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }}>
                {lang === 'ar' 
                  ? 'تربط شبكتنا الخبراء والباحثين وسفراء الصحة البيئية في جميع أنحاء العالم العربي لتعزيز التعاون والابتكار الإقليمي.' 
                  : 'Our network connects experts, researchers, and environmental health ambassadors across the Arab world to foster regional collaboration.'}
              </p>
            </div>
            
            <ArabWorldMap lang={lang} />
            
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <Button variant="gradient" style={{ padding: '14px 36px' }} onClick={() => { setCurrentView('join'); window.history.pushState({}, '', '/join'); }}>
                {lang === 'ar' ? 'استعرض دليل السفراء والأعضاء' : 'Browse Network Directory'}
              </Button>
            </div>
          </div>
        </section>
        {/* Training Section */}
        <section id="training" className="figma-training-section">
          <div className="figma-section-container">
            <h2 className="figma-section-title-main">{t.trainingCourses}</h2>
            
            <div className="figma-cards-grid-4">
              {/* Card 1 */}
              <div className="figma-item-card">
                <div className="figma-item-card-image-wrap">
                  <img src={training1} alt="دورات البحوث العلمية" />
                </div>
                <div className="figma-item-card-content">
                  <h3 className="figma-item-card-title">{lang === 'ar' ? 'دورات البحوث العلمية المتخصصة في قطاع الصحة والبيئة.' : 'Specialized research training courses in the health and environment sector.'}</h3>
                  <span className="figma-item-card-trainees">{lang === 'ar' ? '+1308 متدرب' : '+1308 Trainees'}</span>
                  <Button variant="more" onClick={() => { setCurrentView('join'); window.history.pushState({}, '', '/join'); }}>{lang === 'ar' ? 'سجل الآن' : 'Register Now'}</Button>
                </div>
              </div>
              {/* Card 2 */}
              <div className="figma-item-card">
                <div className="figma-item-card-image-wrap">
                  <img src={training2} alt="الاستجابة الطبية الطارئة" />
                </div>
                <div className="figma-item-card-content">
                  <h3 className="figma-item-card-title">{lang === 'ar' ? 'الاستجابة الطبية الطارئة للكوارث المناخية والبيئية.' : 'Emergency medical response to climate and environmental disasters.'}</h3>
                  <span className="figma-item-card-trainees">{lang === 'ar' ? '+850 متدرب' : '+850 Trainees'}</span>
                  <Button variant="more" onClick={() => { setCurrentView('join'); window.history.pushState({}, '', '/join'); }}>{lang === 'ar' ? 'سجل الآن' : 'Register Now'}</Button>
                </div>
              </div>
              {/* Card 3 */}
              <div className="figma-item-card">
                <div className="figma-item-card-image-wrap">
                  <img src={training3} alt="مبادئ الصحة العامة البيئية" />
                </div>
                <div className="figma-item-card-content">
                  <h3 className="figma-item-card-title">{lang === 'ar' ? 'مبادئ الصحة العامة البيئية وتطبيقاتها السريرية.' : 'Principles of environmental public health and clinical applications.'}</h3>
                  <span className="figma-item-card-trainees">{lang === 'ar' ? '+1120 متدرب' : '+1120 Trainees'}</span>
                  <Button variant="more" onClick={() => { setCurrentView('join'); window.history.pushState({}, '', '/join'); }}>{lang === 'ar' ? 'سجل الآن' : 'Register Now'}</Button>
                </div>
              </div>
              {/* Card 4 */}
              <div className="figma-item-card">
                <div className="figma-item-card-image-wrap">
                  <img src={training4} alt="مهارات الكتابة العلمية" />
                </div>
                <div className="figma-item-card-content">
                  <h3 className="figma-item-card-title">{lang === 'ar' ? 'مهارات الكتابة العلمية للأبحاث الطبية والبيئية.' : 'Scientific writing skills for medical and environmental research.'}</h3>
                  <span className="figma-item-card-trainees">{lang === 'ar' ? '+950 متدرب' : '+950 Trainees'}</span>
                  <Button variant="more" onClick={() => { setCurrentView('join'); window.history.pushState({}, '', '/join'); }}>{lang === 'ar' ? 'سجل الآن' : 'Register Now'}</Button>
                </div>
              </div>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <Button variant="gradient" style={{ padding: '14px 36px' }} onClick={() => { setCurrentView('join'); window.history.pushState({}, '', '/join'); }}>
                {lang === 'ar' ? 'تصفح جميع الدورات' : 'Browse All Courses'}
              </Button>
            </div>
          </div>
        </section>
        {/* Upcoming Section */}
        <section id="upcoming" className="figma-upcoming-section">
          <div className="figma-section-container">
            <h2 className="figma-section-title-main">{lang === 'ar' ? 'الأنشطة القادمة' : 'UPCOMING ACTIVITIES'}</h2>
            
            <div className="figma-vision-mission-grid">
              {/* Upcoming Card 1 */}
              <div className="figma-item-card" style={{ flexDirection: 'row-reverse', height: '180px' }}>
                <div className="figma-item-card-image-wrap" style={{ width: '40%', height: '100%', borderRadius: '0 18px 18px 0' }}>
                  <img src={upcoming1} alt="دراسة وطنية شاملة" style={{ height: '100%' }} />
                </div>
                <div className="figma-item-card-content" style={{ padding: '24px', justifyContent: 'center' }}>
                  <span className="figma-item-card-trainees" style={{ backgroundColor: '#e2effa', color: '#004c6d', padding: '4px 10px', borderRadius: '20px', width: 'fit-content', fontSize: '12px' }}>{lang === 'ar' ? 'سبتمبر 2026' : 'September 2026'}</span>
                  <h3 className="figma-item-card-title" style={{ fontSize: '18px', marginTop: '10px' }}>{lang === 'ar' ? 'دراسة وطنية شاملة حول جودة الهواء والصحة العامة.' : 'A comprehensive national study on air quality and public health.'}</h3>
                </div>
              </div>
              {/* Upcoming Card 2 */}
              <div className="figma-item-card" style={{ flexDirection: 'row-reverse', height: '180px' }}>
                <div className="figma-item-card-image-wrap" style={{ width: '40%', height: '100%', borderRadius: '0 18px 18px 0' }}>
                  <img src={upcoming2} alt="برنامج تدريبي متكامل" style={{ height: '100%' }} />
                </div>
                <div className="figma-item-card-content" style={{ padding: '24px', justifyContent: 'center' }}>
                  <span className="figma-item-card-trainees" style={{ backgroundColor: '#e2effa', color: '#004c6d', padding: '4px 10px', borderRadius: '20px', width: 'fit-content', fontSize: '12px' }}>{lang === 'ar' ? 'نوفمبر 2026' : 'November 2026'}</span>
                  <h3 className="figma-item-card-title" style={{ fontSize: '18px', marginTop: '10px' }}>{lang === 'ar' ? 'برنامج تدريبي متكامل لإعداد قيادات العمل المناخي الصحي.' : 'An integrated training program to prepare healthcare climate leaders.'}</h3>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      ) : currentView === 'debug' ? (
        <DebugUIPage />
      ) : currentView === 'auth' ? (
        <AuthPage lang={lang} onAuthSuccess={() => { setCurrentView('home'); }} />
      ) : currentView === 'opportunities' ? (
        <OpportunitiesPage lang={lang} onNavigate={(view) => {
          setCurrentView(view);
          window.history.pushState({}, '', '/' + (view === 'home' ? '' : view));
        }} />
      ) : currentView === 'join' ? (
        <JoinUsPage lang={lang} onNavigate={(view) => {
          setCurrentView(view);
          window.history.pushState({}, '', '/' + (view === 'home' ? '' : view));
        }} />
      ) : currentView === 'write-article' ? (
        <ArticleEditorPage lang={lang} onNavigate={(view) => {
          setCurrentView(view);
          window.history.pushState({}, '', '/' + (view === 'home' ? '' : view));
        }} />
      ) : currentView === 'profile' ? (
        <ProfilePage lang={lang} onNavigate={(view) => {
          setCurrentView(view);
          window.history.pushState({}, '', '/' + (view === 'home' ? '' : view));
        }} />
      ) : currentView === 'events' ? (
        <EventsPage lang={lang} onNavigate={(view) => {
          setCurrentView(view);
          window.history.pushState({}, '', '/' + (view === 'home' ? '' : view));
        }} />
      ) : currentView === 'news' ? (
        <NewsPage lang={lang} onNavigate={(view, articleId) => {
          if (view === 'article') {
            setCurrentView('article');
            window.history.pushState({}, '', '/article?id=' + articleId);
          } else {
            setCurrentView(view);
            window.history.pushState({}, '', '/' + (view === 'home' ? '' : view));
          }
        }} />
      ) : currentView === 'article' ? (
        <ArticleReaderPage lang={lang} onNavigate={(view) => {
          setCurrentView(view);
          window.history.pushState({}, '', '/' + (view === 'home' ? '' : view));
        }} />
      ) : currentView === 'courses' ? (
        <LearningHubPage lang={lang} onNavigate={(view) => {
          setCurrentView(view);
          window.history.pushState({}, '', '/' + (view === 'home' ? '' : view));
        }} />
      ) : currentView === 'admin-users' ? (
        <UserManagementDashboard lang={lang} onNavigate={(view) => {
          setCurrentView(view);
          window.history.pushState({}, '', '/' + (view === 'home' ? '' : view));
        }} />
      ) : currentView === 'admin-stats' ? (
        <UserStatsDashboard lang={lang} onNavigate={(view) => {
          setCurrentView(view);
          window.history.pushState({}, '', '/' + (view === 'home' ? '' : view));
        }} />
      ) : currentView === 'admin-courses' ? (
        <CourseBuilderPage lang={lang} onNavigate={(view) => {
          setCurrentView(view);
          window.history.pushState({}, '', '/' + (view === 'home' ? '' : view));
        }} />
      ) : currentView === 'admin-certificates' ? (
        <CertificateAuditDashboard lang={lang} onNavigate={(view) => {
          setCurrentView(view);
          window.history.pushState({}, '', '/' + (view === 'home' ? '' : view));
        }} />
      ) : currentView === 'research' ? (
        <ResearchHubPage lang={lang} onNavigate={(view, pubId) => {
          if (view === 'research-detail') {
            setCurrentView('research-detail');
            window.history.pushState({}, '', '/research-detail?id=' + pubId);
          } else {
            setCurrentView(view);
            window.history.pushState({}, '', '/' + (view === 'home' ? '' : view));
          }
        }} />
      ) : currentView === 'research-upload' ? (
        <ResearchUploadPage lang={lang} onNavigate={(view) => {
          setCurrentView(view);
          window.history.pushState({}, '', '/' + (view === 'home' ? '' : view));
        }} />
      ) : currentView === 'research-detail' ? (
        <ResearchDetailPage lang={lang} onNavigate={(view) => {
          setCurrentView(view);
          window.history.pushState({}, '', '/' + (view === 'home' ? '' : view));
        }} />
      ) : currentView === 'newhome' ? (
        <NewHomePage lang={lang} setCurrentView={setCurrentView} setOpenedModal={setOpenedModal} />
      ) : currentView === 'verify' ? (
        <CertificateVerificationPage 
          lang={lang} 
          certId={window.location.pathname.split('/').pop()} 
        />
      ) : (
        <AboutUsPage
          lang={lang}
          onJoinClick={() => { setOpenedModal('join'); window.history.pushState({}, '', '/join'); }}
          onNavigate={(view, sectionId) => {
            if (view !== 'join') setCurrentView(view);
            if (view === 'about') {
              window.history.pushState({}, '', '/about');
            } else if (view === 'debug') {
              window.history.pushState({}, '', '/debug');
            } else if (view === 'opportunities') {
              window.history.pushState({}, '', '/opportunities');
            } else if (view === 'join') {
              setOpenedModal('join');
              window.history.pushState({}, '', '/join');
            } else if (view === 'events') {
              window.history.pushState({}, '', '/events');
            } else if (view === 'news') {
              window.history.pushState({}, '', '/news');
            } else if (sectionId) {
              window.history.pushState({}, '', '/' + sectionId);
              setTimeout(() => {
                const el = document.getElementById(sectionId);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            } else {
              window.history.pushState({}, '', '/');
            }
          }}
        />
      )}
      {/* Footer component */}
      <Footer 
        lang={lang}
        currentView={currentView}
        onJoinClick={() => { setOpenedModal('join'); window.history.pushState({}, '', '/join'); }} 
        onPolicyClick={() => setOpenedModal('policy')} 
        onNavigate={(view, sectionId) => {
            if (view !== 'join') setCurrentView(view);
            if (view === 'about-us') {
              window.history.pushState({}, '', '/about-us');
            } else if (view === 'opportunities') {
              window.history.pushState({}, '', '/opportunities');
            } else if (view === 'join') {
              setOpenedModal('join');
              window.history.pushState({}, '', '/join');
            } else if (view === 'events') {
              window.history.pushState({}, '', '/events');
            } else if (view === 'news') {
              window.history.pushState({}, '', '/news');
            } else if (sectionId) {
              window.history.pushState({}, '', '/' + sectionId);
              setTimeout(() => {
                const el = document.getElementById(sectionId);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            } else {
              window.history.pushState({}, '', '/');
            }
          }}
      />
      {/* ==========================================================================
         MODALS
         ========================================================================== */}
      
      {/* Join Modal */}
      <div class={`modal-overlay ${openedModal === 'join' ? 'open' : ''}`}>
        <div class="modal-card">
          <div class="modal-header">
            <h3>{lang === 'ar' ? 'الانضمام لفريق ClimaMedix' : 'Join the ClimaMedix Team'}</h3>
            <button onClick={() => setOpenedModal(null)} class="close-modal-btn">&times;</button>
          </div>
          {joinSuccess ? (
            <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
              <h4 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>{lang === 'ar' ? 'تم إرسال طلبك بنجاح!' : 'Your request was sent successfully!'}</h4>
              <p style={{ color: 'var(--text-secondary)' }}>{lang === 'ar' ? 'سيتواصل معك منسق الفريق عبر البريد الإلكتروني في غضون 48 ساعة.' : 'The team coordinator will contact you via email within 48 hours.'}</p>
            </div>
          ) : (
            <form class="modal-form" onSubmit={handleJoinSubmit}>
              <p class="form-intro">{lang === 'ar' ? 'سجل بياناتك للانضمام إلى قائمة الباحثين والمسعفين المتطوعين في دراسات المناخ والصحة.' : 'Register your details to join the team of volunteer researchers and medical staff.'}</p>
              
              <div class="form-group">
                <label>{lang === 'ar' ? 'الاسم الكامل *' : 'Full Name *'}</label>
                <input 
                  type="text" 
                  required 
                  placeholder={lang === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                  value={joinForm.name} 
                  onInput={(e) => setJoinForm({ ...joinForm, name: e.target.value })}
                />
              </div>
              <div class="form-group">
                <label>{lang === 'ar' ? 'البريد الإلكتروني *' : 'Email *'}</label>
                <input 
                  type="email" 
                  required 
                  placeholder="name@example.com" 
                  value={joinForm.email}
                  onInput={(e) => setJoinForm({ ...joinForm, email: e.target.value })}
                />
              </div>
              <div class="form-group">
                <label>{lang === 'ar' ? 'التخصص المهني *' : 'Professional Specialty *'}</label>
                <select 
                  required 
                  value={joinForm.profession}
                  onChange={(e) => setJoinForm({ ...joinForm, profession: e.target.value })}
                >
                  <option value="" disabled selected>{lang === 'ar' ? 'اختر تخصصك' : 'Select your specialty'}</option>
                  <option value="doctor">{lang === 'ar' ? 'طبيب / ممارس صحي' : 'Doctor / Health Practitioner'}</option>
                  <option value="researcher">{lang === 'ar' ? 'باحث بيئي / علمي' : 'Environmental / Scientific Researcher'}</option>
                  <option value="student">{lang === 'ar' ? 'طالب علوم صحية' : 'Health Sciences Student'}</option>
                  <option value="other">{lang === 'ar' ? 'أخرى' : 'Other'}</option>
                </select>
              </div>
              <button type="submit" disabled={joinSubmitting} class="btn btn-primary btn-full">
                {joinSubmitting ? (lang === 'ar' ? 'جاري إرسال طلبك...' : 'Submitting your request...') : (lang === 'ar' ? 'إرسال طلب الانضمام' : 'Submit Join Request')}
              </button>
            </form>
          )}
        </div>
      </div>
      {/* Use Policy Modal */}
      <div class={`modal-overlay ${openedModal === 'policy' ? 'open' : ''}`}>
        <div class="modal-card">
          <div class="modal-header">
            <h3>{lang === 'ar' ? 'سياسة الاستخدام وحماية البيانات' : 'Terms of Use & Data Protection'}</h3>
            <button onClick={() => setOpenedModal(null)} class="close-modal-btn">&times;</button>
          </div>
          <div class="modal-body" style={{ lineHeight: '1.8', fontSize: '0.95rem', color: 'var(--text-secondary)', textAlign: lang === 'ar' ? 'right' : 'left' }}>
            <p style={{ marginBottom: '1rem' }}>{lang === 'ar' ? 'نحن في ClimaMedix نلتزم بأعلى معايير السرية والأمان البيولوجي والرقمي للمعلومات السريرية أو الشخصية:' : 'At ClimaMedix, we are committed to the highest standards of confidentiality and digital safety for all clinical and personal information:'}</p>
            <ul style={{ paddingRight: lang === 'ar' ? '1.5rem' : '0', paddingLeft: lang === 'en' ? '1.5rem' : '0', marginBottom: '1.5rem' }}>
              <li>{lang === 'ar' ? 'يتم جمع البيانات عبر نماذج التسجيل حصراً لغرض الاتصال بخصوص أبحاثنا وتدريباتنا.' : 'Data is collected via registration forms solely for communications regarding our research.'}</li>
              <li>{lang === 'ar' ? 'لا نقوم بمشاركة أي بيانات شخصية مع أطراف ثالثة لأغراض تجارية على الإطلاق.' : 'We never share any personal data with third parties for commercial purposes.'}</li>
              <li>{lang === 'ar' ? 'تلتزم أبحاثنا الميدانية ببروتوكولات الموافقة المسبقة المستنيرة للمشاركين.' : 'Our field research strictly complies with informed consent protocols.'}</li>
            </ul>
            <p>{lang === 'ar' ? 'لأي استفسارات إضافية، يرجى مراسلة مكتب التنسيق الطبي التابع للمبادرة.' : 'For any further inquiries, please contact the coordinator office of the initiative.'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
