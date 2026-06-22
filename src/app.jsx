import { useState, useEffect } from 'preact/hooks'
import './app.css'

// Import newly created Header & Footer components
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { TopBackground } from './components/TopBackground'
import { NeatScripples } from './components/NeatScripples'
import { ColoredBackground } from './components/ColoredBackground'
import { Button } from './components/Button'
import { GlassCard } from './components/GlassCard'
import { AboutUsPage } from './features/about-us/AboutUsPage'
import { DebugUIPage } from './features/debug-ui/DebugUIPage'
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

export function App() {
  const [theme, setTheme] = useState('light');
  const [activeSection, setActiveSection] = useState('home');
  const [openedModal, setOpenedModal] = useState(null); // 'join', 'policy'
  const [currentView, setCurrentView] = useState('home'); // 'home' or 'about-us'
  
  // Form States for Header/Footer modal triggers
  const [joinForm, setJoinForm] = useState({ name: '', email: '', profession: '' });
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [joinSubmitting, setJoinSubmitting] = useState(false);

  // Theme Sync on Mount + Hash Routing
  useEffect(() => {
    // Force light theme
    setTheme('light');
    document.body.classList.remove('dark-mode');

    // Set initial view from URL hash
    const hash = window.location.hash;
    if (hash === '#about-us' || hash === '#about') {
      setCurrentView('about-us');
    } else if (hash === '#debug') {
      setCurrentView('debug');
    } else {
      setCurrentView('home');
    }

    // Listen for hash changes (browser back/forward)
    const handleHashChange = () => {
      const h = window.location.hash;
      if (h === '#about-us' || h === '#about') {
        setCurrentView('about-us');
      } else if (h === '#debug') {
        setCurrentView('debug');
      } else {
        setCurrentView('home');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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
    <div style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
      {/* Background components */}
      {currentView === 'home' ? (
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
        onNavigate={(view, sectionId) => {
          setCurrentView(view);
          if (view === 'about-us') {
            window.location.hash = '#about-us';
          } else if (sectionId) {
            window.location.hash = '#' + sectionId;
            setTimeout(() => {
              const el = document.getElementById(sectionId);
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          } else {
            window.location.hash = '#home';
          }
        }}
        onJoinClick={() => setOpenedModal('join')} 
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
                  <img src={whiteLogo} className="figma-hero-white-logo" alt="كليما ميديكس" />
                  <h2 className="figma-hero-subtitle">تمكين مقدمي الرعاية الصحية لأجل العمل المناخي.</h2>
                </div>
                <p className="figma-hero-description">
                  <span className="figma-hero-desc-top">نحن نسعى لتمكين الطاقم</span>
                  {" "}
                  <span className="figma-hero-desc-bottom">الصحي للعمل المناخي من خلال برامج تدريبية، أبحاث، وورش عمل.</span>
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="figma-about-section">
          <div className="figma-section-container">
            <GlassCard className="figma-about-intro-box">
              <h2 className="figma-about-box-title">من نحن؟</h2>
              <p className="figma-about-intro-text">
                في ClimaMedix، نؤمن بأن البحث العلمي هو الأساس لفهم تأثيرات التغير المناخي على الصحة العامة وتطوير الحلول المستدامة. نحن فريق من الباحثين والمتخصصين في المجال الطبي، نعمل على تمكين الطواقم الصحية بالمعرفة، وتزويدهم بالأدوات اللازمة لفهم التغيرات البيئية والتصدي لتحدياتها. نركز بشكل أساسي على دعم البحث العلمي، تمكين المهنيين الصحيين، ونشر التوعية حول العلاقة بين التغير المناخي والصحة.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                <Button variant="gradient" onClick={() => setCurrentView('about-us')}>
                  عرض المزيد
                </Button>
              </div>
            </GlassCard>
            
            <div className="figma-vision-mission-grid">
              <GlassCard className="figma-vision-card">
                <div className="figma-vision-card-header">
                  <h3>الرؤية</h3>
                </div>
                <p>أن نكون المنصة البحثية الرائدة في مجال الصحة والتغير المناخي، من خلال إنتاج أبحاث متقدمة، تمكين الطواقم الطبية بالمعرفة، والمساهمة في بناء سياسات صحية مستدامة لمواجهة التحديات البيئية.</p>
              </GlassCard>
              <GlassCard className="figma-mission-card">
                <div className="figma-vision-card-header">
                  <h3>الرسالة</h3>
                </div>
                <p>نهدف إلى تمكين المهنيين في القطاع الصحي من لعب دور قيادي في الاستجابة العالمية لتغير المناخ، من خلال تعزيز البحث العلمي، تطوير دراسات ميدانية، ودعم الأبحاث التطبيقية التي تساعد في تقديم حلول فعالة. كما نعمل على بناء شبكة عالمية من الباحثين، ونوفر فرصاً للمشاركة في المشاريع البحثية التي تسهم في تحسين الصحة العامة.</p>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* Pillars Section (Commented Out as requested)
        <section id="pillars" className="figma-pillars-section">
          <div className="figma-section-container">
            <h2 className="figma-section-title-main">الركائز الأساسية</h2>
            <div className="figma-pillars-grid">
              <div className="figma-pillar-card">
                <div className="figma-pillar-icon-wrap">
                  <img src={iconFavorite} alt="التمكين" />
                </div>
                <h3>التمكين</h3>
                <p>نوفر الأدوات والتدريب اللازم لتمكين الطاقم الصحية من قيادة التغيير.</p>
              </div>
              <div className="figma-pillar-card">
                <div className="figma-pillar-icon-wrap">
                  <img src={iconResearch} alt="البحث العلمي" />
                </div>
                <h3>البحث العلمي</h3>
                <p>نركز على الأبحاث والدراسات التي توفر حلولاً حقيقية لتحديات الصحة والتغير المناخي.</p>
              </div>
              <div className="figma-pillar-card">
                <div className="figma-pillar-icon-wrap">
                  <img src={iconAbout} alt="الابتكار" />
                </div>
                <h3>الابتكار</h3>
                <p>تطوير منهجيات جديدة لتعزيز دور البحث في دعم الاستدامة الصحية.</p>
              </div>
              <div className="figma-pillar-card">
                <div className="figma-pillar-icon-wrap">
                  <img src={iconTraining} alt="التأثير المجتمعي" />
                </div>
                <h3>التأثير المجتمعي</h3>
                <p>تحويل الأبحاث العلمية إلى حلول عملية تُطبَّق على أرض الواقع.</p>
              </div>
              <div className="figma-pillar-card">
                <div className="figma-pillar-icon-wrap">
                  <img src={iconContact} alt="الشراكات" />
                </div>
                <h3>الشراكات</h3>
                <p>نعمل بالتعاون مع مؤسسات بحثية، جامعات، ومنظمات عالمية لدعم الأبحاث المتخصصة في الصحة البيئية.</p>
              </div>
            </div>
          </div>
        </section>
        */}

        {/* Research Section */}
        <section id="research" className="figma-research-section">
          <div className="figma-section-container">
            <h2 className="figma-section-title-main">أحدث الأبحاث</h2>
            
            <div className="figma-cards-grid-4">
              {/* Card 1 */}
              <div className="figma-item-card">
                <div className="figma-item-card-image-wrap">
                  <img src={research1} alt="أثر تلوث الهواء" />
                </div>
                <div className="figma-item-card-content">
                  <span className="figma-item-card-location">الموقع: فلسطين</span>
                  <h3 className="figma-item-card-title">أثر تلوث الهواء على الأمراض التنفسية في المناطق الحضرية.</h3>
                  <div className="figma-item-card-progress-wrap">
                    <span className="figma-item-card-progress-text">التقدم: 85%</span>
                    <div className="figma-item-card-progress-bar">
                      <div className="figma-item-card-progress-fill" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  <Button variant="more" onClick={() => setOpenedModal('policy')}>المزيد</Button>
                </div>
              </div>

              {/* Card 2 */}
              <div className="figma-item-card">
                <div className="figma-item-card-image-wrap">
                  <img src={research2} alt="تغير المناخ والأمراض المدارية" />
                </div>
                <div className="figma-item-card-content">
                  <span className="figma-item-card-location">الموقع: الأردن</span>
                  <h3 className="figma-item-card-title">تغير المناخ وانتشار الأمراض المدارية في البحر الأبيض المتوسط.</h3>
                  <div className="figma-item-card-progress-wrap">
                    <span className="figma-item-card-progress-text">التقدم: 60%</span>
                    <div className="figma-item-card-progress-bar">
                      <div className="figma-item-card-progress-fill" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                  <Button variant="more" onClick={() => setOpenedModal('policy')}>المزيد</Button>
                </div>
              </div>

              {/* Card 3 */}
              <div className="figma-item-card">
                <div className="figma-item-card-image-wrap">
                  <img src={research3} alt="الاستدامة في المستشفيات" />
                </div>
                <div className="figma-item-card-content">
                  <span className="figma-item-card-location">الموقع: مصر</span>
                  <h3 className="figma-item-card-title">تقييم الاستدامة البيئية في المستشفيات والمراكز الطبية.</h3>
                  <div className="figma-item-card-progress-wrap">
                    <span className="figma-item-card-progress-text">التقدم: 40%</span>
                    <div className="figma-item-card-progress-bar">
                      <div className="figma-item-card-progress-fill" style={{ width: '40%' }}></div>
                    </div>
                  </div>
                  <Button variant="more" onClick={() => setOpenedModal('policy')}>المزيد</Button>
                </div>
              </div>

              {/* Card 4 */}
              <div className="figma-item-card">
                <div className="figma-item-card-image-wrap">
                  <img src={research4} alt="درجات الحرارة والعمال" />
                </div>
                <div className="figma-item-card-content">
                  <span className="figma-item-card-location">الموقع: الخليج العربي</span>
                  <h3 className="figma-item-card-title">تأثير درجات الحرارة المرتفعة على صحة العمال في قطاع البناء.</h3>
                  <div className="figma-item-card-progress-wrap">
                    <span className="figma-item-card-progress-text">التقدم: 95%</span>
                    <div className="figma-item-card-progress-bar">
                      <div className="figma-item-card-progress-fill" style={{ width: '95%' }}></div>
                    </div>
                  </div>
                  <Button variant="more" onClick={() => setOpenedModal('policy')}>المزيد</Button>
                </div>
              </div>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <Button variant="gradient" style={{ padding: '14px 36px' }} onClick={() => setOpenedModal('join')}>
                تصفح جميع الأبحاث
              </Button>
            </div>
          </div>
        </section>

        {/* Newsletter/Join CTA Block (Frame 45) */}
        <section className="figma-newsletter-cta-section">
          <div className="figma-cta-section-wrap">
            <h3 className="figma-cta-title">ابقَ على اطلاع بأحدث الأبحاث!</h3>
            <p className="figma-cta-description">
              نحن نخطط لإطلاق عدد من المشاريع البحثية الجديدة قريبًا. إذا كنت مهتمًا بالمشاركة، يمكنك التقديم عبر نموذج التسجيل أدناه.
            </p>
            <Button variant="gradient" onClick={() => setOpenedModal('join')}>
              انضم لفريق البحث
            </Button>
          </div>
        </section>

        {/* Training Section */}
        <section id="training" className="figma-training-section">
          <div className="figma-section-container">
            <h2 className="figma-section-title-main">الدورات التدريبية</h2>
            
            <div className="figma-cards-grid-4">
              {/* Card 1 */}
              <div className="figma-item-card">
                <div className="figma-item-card-image-wrap">
                  <img src={training1} alt="دورات البحوث العلمية" />
                </div>
                <div className="figma-item-card-content">
                  <h3 className="figma-item-card-title">دورات البحوث العلمية المتخصصة في قطاع الصحة والبيئة.</h3>
                  <span className="figma-item-card-trainees">+1308 متدرب</span>
                  <Button variant="more" onClick={() => setOpenedModal('join')}>سجل الآن</Button>
                </div>
              </div>

              {/* Card 2 */}
              <div className="figma-item-card">
                <div className="figma-item-card-image-wrap">
                  <img src={training2} alt="الاستجابة الطبية الطارئة" />
                </div>
                <div className="figma-item-card-content">
                  <h3 className="figma-item-card-title">الاستجابة الطبية الطارئة للكوارث المناخية والبيئية.</h3>
                  <span className="figma-item-card-trainees">+850 متدرب</span>
                  <Button variant="more" onClick={() => setOpenedModal('join')}>سجل الآن</Button>
                </div>
              </div>

              {/* Card 3 */}
              <div className="figma-item-card">
                <div className="figma-item-card-image-wrap">
                  <img src={training3} alt="مبادئ الصحة العامة البيئية" />
                </div>
                <div className="figma-item-card-content">
                  <h3 className="figma-item-card-title">مبادئ الصحة العامة البيئية وتطبيقاتها السريرية.</h3>
                  <span className="figma-item-card-trainees">+1120 متدرب</span>
                  <Button variant="more" onClick={() => setOpenedModal('join')}>سجل الآن</Button>
                </div>
              </div>

              {/* Card 4 */}
              <div className="figma-item-card">
                <div className="figma-item-card-image-wrap">
                  <img src={training4} alt="مهارات الكتابة العلمية" />
                </div>
                <div className="figma-item-card-content">
                  <h3 className="figma-item-card-title">مهارات الكتابة العلمية للأبحاث الطبية والبيئية.</h3>
                  <span className="figma-item-card-trainees">+950 متدرب</span>
                  <Button variant="more" onClick={() => setOpenedModal('join')}>سجل الآن</Button>
                </div>
              </div>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <Button variant="gradient" style={{ padding: '14px 36px' }} onClick={() => setOpenedModal('join')}>
                تصفح جميع الدورات
              </Button>
            </div>
          </div>
        </section>

        {/* Upcoming Section */}
        <section id="upcoming" className="figma-upcoming-section">
          <div className="figma-section-container">
            <h2 className="figma-section-title-main" style={{ textTransform: 'uppercase' }}>UPCOMING</h2>
            
            <div className="figma-vision-mission-grid">
              {/* Upcoming Card 1 */}
              <div className="figma-item-card" style={{ flexDirection: 'row-reverse', height: '180px' }}>
                <div className="figma-item-card-image-wrap" style={{ width: '40%', height: '100%', borderRadius: '0 18px 18px 0' }}>
                  <img src={upcoming1} alt="دراسة وطنية شاملة" style={{ height: '100%' }} />
                </div>
                <div className="figma-item-card-content" style={{ padding: '24px', justifyContent: 'center' }}>
                  <span className="figma-item-card-trainees" style={{ backgroundColor: '#e2effa', color: '#004c6d', padding: '4px 10px', borderRadius: '20px', width: 'fit-content', fontSize: '12px' }}>سبتمبر 2026</span>
                  <h3 className="figma-item-card-title" style={{ fontSize: '18px', marginTop: '10px' }}>دراسة وطنية شاملة حول جودة الهواء والصحة العامة.</h3>
                </div>
              </div>

              {/* Upcoming Card 2 */}
              <div className="figma-item-card" style={{ flexDirection: 'row-reverse', height: '180px' }}>
                <div className="figma-item-card-image-wrap" style={{ width: '40%', height: '100%', borderRadius: '0 18px 18px 0' }}>
                  <img src={upcoming2} alt="برنامج تدريبي متكامل" style={{ height: '100%' }} />
                </div>
                <div className="figma-item-card-content" style={{ padding: '24px', justifyContent: 'center' }}>
                  <span className="figma-item-card-trainees" style={{ backgroundColor: '#e2effa', color: '#004c6d', padding: '4px 10px', borderRadius: '20px', width: 'fit-content', fontSize: '12px' }}>نوفمبر 2026</span>
                  <h3 className="figma-item-card-title" style={{ fontSize: '18px', marginTop: '10px' }}>برنامج تدريبي متكامل لإعداد قيادات العمل المناخي الصحي.</h3>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      ) : currentView === 'debug' ? (
        <DebugUIPage />
      ) : (
        <AboutUsPage
          onJoinClick={() => setOpenedModal('join')}
          onNavigate={(view, sectionId) => {
            setCurrentView(view);
            if (view === 'about-us') {
              window.location.hash = '#about-us';
            } else if (view === 'debug') {
              window.location.hash = '#debug';
            } else {
              window.location.hash = sectionId ? '#' + sectionId : '#home';
              setTimeout(() => {
                const el = document.getElementById(sectionId);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }
          }}
        />
      )}

      {/* Footer component */}
      <Footer 
        onJoinClick={() => setOpenedModal('join')} 
        onPolicyClick={() => setOpenedModal('policy')} 
        onNavigate={(view, sectionId) => {
            setCurrentView(view);
            if (view === 'about-us') {
              window.location.hash = '#about-us';
            } else if (sectionId) {
              window.location.hash = '#' + sectionId;
              setTimeout(() => {
                const el = document.getElementById(sectionId);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            } else {
              window.location.hash = '#home';
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
            <h3>الانضمام لفريق ClimaMedix</h3>
            <button onClick={() => setOpenedModal(null)} class="close-modal-btn">&times;</button>
          </div>
          {joinSuccess ? (
            <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
              <h4 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>تم إرسال طلبك بنجاح!</h4>
              <p style={{ color: 'var(--text-secondary)' }}>سيتواصل معك منسق الفريق عبر البريد الإلكتروني في غضون 48 ساعة.</p>
            </div>
          ) : (
            <form class="modal-form" onSubmit={handleJoinSubmit}>
              <p class="form-intro">سجل بياناتك للانضمام إلى قائمة الباحثين والمسعفين المتطوعين في دراسات المناخ والصحة.</p>
              
              <div class="form-group">
                <label>الاسم الكامل *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="أدخل اسمك الكامل" 
                  value={joinForm.name} 
                  onInput={(e) => setJoinForm({ ...joinForm, name: e.target.value })}
                />
              </div>
              <div class="form-group">
                <label>البريد الإلكتروني *</label>
                <input 
                  type="email" 
                  required 
                  placeholder="name@example.com" 
                  value={joinForm.email}
                  onInput={(e) => setJoinForm({ ...joinForm, email: e.target.value })}
                />
              </div>
              <div class="form-group">
                <label>التخصص المهني *</label>
                <select 
                  required 
                  value={joinForm.profession}
                  onChange={(e) => setJoinForm({ ...joinForm, profession: e.target.value })}
                >
                  <option value="" disabled selected>اختر تخصصك</option>
                  <option value="doctor">طبيب / ممارس صحي</option>
                  <option value="researcher">باحث بيئي / علمي</option>
                  <option value="student">طالب علوم صحية</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
              <button type="submit" disabled={joinSubmitting} class="btn btn-primary btn-full">
                {joinSubmitting ? 'جاري إرسال طلبك...' : 'إرسال طلب الانضمام'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Use Policy Modal */}
      <div class={`modal-overlay ${openedModal === 'policy' ? 'open' : ''}`}>
        <div class="modal-card">
          <div class="modal-header">
            <h3>سياسة الاستخدام وحماية البيانات</h3>
            <button onClick={() => setOpenedModal(null)} class="close-modal-btn">&times;</button>
          </div>
          <div class="modal-body" style={{ lineHeight: '1.8', fontSize: '0.95rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
            <p style={{ marginBottom: '1rem' }}>نحن في ClimaMedix نلتزم بأعلى معايير السرية والأمان البيولوجي والرقمي للمعلومات السريرية أو الشخصية:</p>
            <ul style={{ paddingRight: '1.5rem', marginBottom: '1.5rem' }}>
              <li>يتم جمع البيانات عبر نماذج التسجيل حصراً لغرض الاتصال بخصوص أبحاثنا وتدريباتنا.</li>
              <li>لا نقوم بمشاركة أي بيانات شخصية مع أطراف ثالثة لأغراض تجارية على الإطلاق.</li>
              <li>تلتزم أبحاثنا الميدانية ببروتوكولات الموافقة المسبقة المستنيرة للمشاركين.</li>
            </ul>
            <p>لأي استفسارات إضافية، يرجى مراسلة مكتب التنسيق الطبي التابع للمبادرة.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
