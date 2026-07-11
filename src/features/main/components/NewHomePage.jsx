import { useState, useEffect } from 'preact/hooks'
import { supabase } from '../../../utils/supabaseClient'
import { Button } from '../../shared/components/Button'
import { GlassCard } from '../../shared/components/GlassCard'
import { ArabWorldMap } from './ArabWorldMap'
import { HomeNewsWidget } from '../../news-blog/components/HomeNewsWidget'
import { translations } from '../../../i18n/translations'
import { CalendarSidebarWidget } from '../../events/components/CalendarSidebarWidget'
import { DynamicHomeSlider } from './DynamicHomeSlider'
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

export function NewHomePage({ lang, setCurrentView, setOpenedModal }) {
  const t = translations[lang] || translations.ar;
  const [publications, setPublications] = useState([]);
  const [loadingPubs, setLoadingPubs] = useState(true);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  
  useEffect(() => {
    fetchPublications();
    fetchCoursesList();
  }, []);

  const fetchCoursesList = async () => {
    try {
      setLoadingCourses(true);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);
      if (error) throw error;
      setCourses(data || []);
    } catch (err) {
      console.error("Error fetching courses:", err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchPublications = async () => {
    try {
      setLoadingPubs(true);
      const { data, error } = await supabase
        .from('publications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);
      if (error) throw error;
      setPublications(data || []);
    } catch (err) {
      console.error("Error fetching publications:", err);
    } finally {
      setLoadingPubs(false);
    }
  };



  return (
    <main className="figma-main-content">
        <CalendarSidebarWidget 
          lang={lang} 
          onNavigate={(view) => { 
            setCurrentView(view); 
        />

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
        
        {/* Dynamic Database-driven Slider (managed by Slider Manager) */}
        <DynamicHomeSlider lang={lang} onNavigate={setCurrentView} />
        
        {/* Home News Widget inserted right after Slider */}
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
        
        {/* About Section */}
        <section id="about" className="figma-about-section">
          <div className="figma-section-container">
            <GlassCard className="figma-about-intro-box">
              <h2 className="figma-about-box-title">{t.whoWeAre}</h2>
              <p className="figma-about-intro-text">
                {t.aboutIntroText}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                <Button variant="gradient" onClick={() => { setCurrentView('about-us'); window.history.pushState({}, '', '/about-us'); }}>
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
              {loadingPubs ? (
                <div style={{ textAlign: 'center', width: '100%', padding: '40px', color: '#64748b' }}>
                  {lang === 'ar' ? 'جاري تحميل الأبحاث...' : 'Loading research...'}
                </div>
              ) : publications.length === 0 ? (
                <div style={{ textAlign: 'center', width: '100%', padding: '40px', color: '#64748b' }}>
                  {lang === 'ar' ? 'لا توجد أبحاث حالياً.' : 'No research available.'}
                </div>
              ) : (
                publications.map((pub, idx) => {
                  const fallbackImages = [research1, research2, research3, research4];
                  const pubImage = fallbackImages[idx % fallbackImages.length];
                  
                  return (
                    <div key={pub.id} className="figma-item-card">
                      <div className="figma-item-card-image-wrap">
                        <img src={pubImage} alt={lang === 'ar' ? pub.title_ar : pub.title_en} style={{ objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(21, 180, 122, 0.9)', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                          {pub.category ? (lang === 'ar' ? 'بحث علمي' : 'Research') : (lang === 'ar' ? 'بحث' : 'Research')}
                        </div>
                      </div>
                      <div className="figma-item-card-content">
                        <span className="figma-item-card-location">{pub.authors} • {pub.year}</span>
                        <h3 className="figma-item-card-title">{lang === 'ar' ? pub.title_ar : (pub.title_en || pub.title_ar)}</h3>
                        <div className="figma-item-card-progress-wrap">
                           <p style={{ fontSize: '13px', color: '#64748b', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                             {lang === 'ar' ? pub.abstract_ar : (pub.abstract_en || pub.abstract_ar)}
                           </p>
                        </div>
                        <Button variant="more" onClick={() => {
                          setCurrentView('research-detail');
                          window.history.pushState({}, '', '/research-detail?id=' + pub.id);
                        }}>{lang === 'ar' ? 'المزيد' : 'More'}</Button>
                      </div>
                    </div>
                  );
                })
              )}
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
            <Button variant="gradient" onClick={() => setOpenedModal('join')}>
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
              <Button variant="gradient" style={{ padding: '14px 36px' }} onClick={() => setOpenedModal('join')}>
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
              {loadingCourses ? (
                <div style={{ textAlign: 'center', width: '100%', padding: '40px', color: '#64748b' }}>
                  {lang === 'ar' ? 'جاري تحميل الدورات...' : 'Loading courses...'}
                </div>
              ) : courses.length === 0 ? (
                <div style={{ textAlign: 'center', width: '100%', padding: '40px', color: '#64748b' }}>
                  {lang === 'ar' ? 'لا توجد دورات حالياً.' : 'No courses available.'}
                </div>
              ) : (
                courses.map((course, idx) => {
                  const fallbackImages = [training1, training2, training3, training4];
                  const courseImage = course.cover_image || fallbackImages[idx % fallbackImages.length];
                  
                  return (
                    <div key={course.id} className="figma-item-card">
                      <div className="figma-item-card-image-wrap">
                        <img src={courseImage} alt={lang === 'ar' ? course.title_ar : course.title_en} style={{ objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(21, 180, 122, 0.9)', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                          {course.category || (lang === 'ar' ? 'مسار تدريبي' : 'Training Course')}
                        </div>
                      </div>
                      <div className="figma-item-card-content">
                        <h3 className="figma-item-card-title">{lang === 'ar' ? course.title_ar : (course.title_en || course.title_ar)}</h3>
                        <span className="figma-item-card-trainees">
                          {course.duration ? (lang === 'ar' ? `المدة: ${course.duration}` : `Duration: ${course.duration}`) : (lang === 'ar' ? '+1308 متدرب' : '+1308 Trainees')}
                        </span>
                        <Button variant="more" onClick={() => { 
                          setCurrentView('courses'); 
                          window.history.pushState({}, '', `/courses?courseId=${course.id}`); 
                        }}>
                          {lang === 'ar' ? 'سجل الآن' : 'Register Now'}
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <Button variant="gradient" style={{ padding: '14px 36px' }} onClick={() => { setCurrentView('courses'); window.history.pushState({}, '', '/courses'); }}>
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
