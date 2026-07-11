import { useState } from 'preact/hooks'
import { Button } from '../../shared/components/Button'
import { GlassCard } from '../../shared/components/GlassCard'
import { HomeNewsWidget } from '../../news-blog/components/HomeNewsWidget'
import { ArabWorldMap } from './ArabWorldMap'
import { translations } from '../../../i18n/translations'

import doctorImg from '../../../assets/bg_3.png'
import whiteLogo from '../../../assets/footer_logo.svg'
import research1 from '../../../assets/research_1.png'
import research2 from '../../../assets/research_2.png'
import research3 from '../../../assets/research_3.png'
import research4 from '../../../assets/bg_1.png'
import training1 from '../../../assets/training_1.png'
import training2 from '../../../assets/training_2.png'
import training3 from '../../../assets/training_3.png'
import training4 from '../../../assets/training_4.png'
import upcoming1 from '../../../assets/upcoming_1.png'
import upcoming2 from '../../../assets/upcoming_2.png'

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

export function OldHomePage({ lang, setOpenedModal, setCurrentView }) {
  const t = translations[lang] || translations.ar;
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

  return (
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
  );
}
