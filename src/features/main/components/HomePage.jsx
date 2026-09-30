import { useState, useEffect } from 'preact/hooks'
import { supabase } from '../../../utils/supabaseClient'
import { Button } from '../../shared/components/Button'
import { GlassCard } from '../../shared/components/GlassCard'
import { ArabWorldMap } from './ArabWorldMap'
import { HomeNewsWidget } from '../../news-blog/components/HomeNewsWidget'
import { translations } from '../../../i18n/translations'
import { CalendarSidebarWidget } from '../../events/components/CalendarSidebarWidget'
import { DynamicHomeSlider } from './DynamicHomeSlider'
import doctorImg from '../../../assets/bg_3.webp'
import whiteLogo from '../../../assets/footer_logo.svg'

export function HomePage({ lang, setCurrentView, setOpenedModal, onNavigate }) {
  const t = translations[lang] || translations.ar;
  const [publications, setPublications] = useState([]);
  const [loadingPubs, setLoadingPubs] = useState(true);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  
  useEffect(() => {
    fetchPublications();
    fetchCoursesList();
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true })
        .gte('event_date', new Date().toISOString().split('T')[0])
        .limit(2);
      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchCoursesList = async () => {
    try {
      setLoadingCourses(true);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
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
        .limit(3);
      if (error) throw error;
      setPublications(data || []);
    } catch (err) {
      console.error("Error fetching publications:", err);
    } finally {
      setLoadingPubs(false);
    }
  };



  // ==========================================
  // PAGE LAYOUT - Reorder these to change layout
  // ==========================================
  const PAGE_LAYOUT = [
    'hero',
    'slider',
    'training',
    'news',
    'research',
    'upcoming',
    'community',
    'about',
    'newsletter'
  ];

  const renderSection = (sectionId) => {
    switch(sectionId) {
      case 'hero': return (
        <section key="hero" id="home" className="figma-hero-section">
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
      );
      case 'slider': return (
        <DynamicHomeSlider key="slider"
          lang={lang} 
          onNavigate={onNavigate} 
        />
      );
      case 'news': return (
        <HomeNewsWidget key="news"
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
      );
      case 'about': return (
        <section key="about" id="about" className="figma-about-section">
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
      );
      case 'research': return (
        <section key="research" id="research" className="figma-research-section">
          <div className="figma-section-container">
            <h2 className="figma-section-title-main">{t.latestResearch}</h2>
            
            <div className="figma-cards-horizontal-scroll">
              {loadingPubs ? (
                <div style={{ textAlign: 'center', width: '100%', padding: '40px', color: '#64748b' }}>
                  {lang === 'ar' ? 'جاري تحميل الأبحاث...' : 'Loading research...'}
                </div>
              ) : publications.length === 0 ? (
                <div style={{ textAlign: 'center', width: '100%', padding: '40px', color: '#64748b' }}>
                  {lang === 'ar' ? 'لا توجد أبحاث حالياً.' : 'No research available.'}
                </div>
              ) : (
                publications.map((pub) => {
                  return (
                    <div key={pub.id} className="figma-item-card" style={{ display: 'flex', flexDirection: 'column' }}>
                      {pub.cover_image && (
                        <div className="figma-item-card-image-wrap">
                          <img 
                            src={pub.cover_image} 
                            alt={lang === 'ar' ? pub.title_ar : pub.title_en} 
                            style={{ objectFit: 'cover', width: '100%', height: '100%' }} 
                          />
                        </div>
                      )}
                      <div className="figma-item-card-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span className="figma-item-card-location">{pub.authors} • {pub.year}</span>
                        </div>
                        <h3 className="figma-item-card-title">{lang === 'ar' ? pub.title_ar : (pub.title_en || pub.title_ar)}</h3>
                        <div className="figma-item-card-progress-wrap" style={{ flex: 1, marginTop: '8px' }}>
                           <p style={{ fontSize: '13px', color: '#64748b', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                             {lang === 'ar' ? pub.abstract_ar : (pub.abstract_en || pub.abstract_ar)}
                           </p>
                        </div>
                        <div style={{ marginTop: '16px' }}>
                          <Button variant="more" onClick={() => {
                            setCurrentView('research-detail');
                            window.history.pushState({}, '', '/research-detail?id=' + pub.id);
                          }}>{lang === 'ar' ? 'المزيد' : 'More'}</Button>
                        </div>
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
      );
      case 'newsletter': return (
        <section key="newsletter" className="figma-newsletter-cta-section">
          <div className="figma-cta-section-wrap">
            <h3 className="figma-cta-title">{lang === 'ar' ? 'ابقَ على اطلاع بأحدث الأبحاث!' : 'Stay updated with the latest research!'}</h3>
            <p className="figma-cta-description">
              {lang === 'ar' ? 'نحن نخطط لإطلاق عدد من المشاريع البحثية الجديدة قريبًا. إذا كنت مهتمًا بالمشاركة، يمكنك التقديم عبر نموذج التسجيل أدناه.' : 'We plan to launch several new research projects soon. If you are interested in participating, you can apply via the registration form below.'}
            </p>
            <Button variant="gradient" onClick={() => onNavigate('join')}>
              {lang === 'ar' ? 'انضم لفريق البحث' : 'Join the Research Team'}
            </Button>
          </div>
        </section>
      );
      case 'community': return (
        <section key="community" id="community" className="figma-training-section" style={{ position: 'relative', zIndex: 5 }}>
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
              <Button variant="gradient" style={{ padding: '14px 36px' }} onClick={() => onNavigate('join')}>
                {lang === 'ar' ? 'استعرض دليل السفراء والأعضاء' : 'Browse Network Directory'}
              </Button>
            </div>
          </div>
        </section>
      );
      case 'training': return (
        <section key="training" id="training" className="figma-training-section">
          <div className="figma-section-container">
            <h2 className="figma-section-title-main">{t.trainingCourses}</h2>
            
            <div className="figma-cards-horizontal-scroll">
              {loadingCourses ? (
                <div style={{ textAlign: 'center', width: '100%', padding: '40px', color: '#64748b' }}>
                  {lang === 'ar' ? 'جاري تحميل الدورات...' : 'Loading courses...'}
                </div>
              ) : courses.length === 0 ? (
                <div style={{ textAlign: 'center', width: '100%', padding: '40px', color: '#64748b' }}>
                  {lang === 'ar' ? 'لا توجد دورات حالياً.' : 'No courses available.'}
                </div>
              ) : (
                courses.map((course) => {
                  return (
                    <div key={course.id} className="figma-item-card">
                      {course.cover_image && (
                        <div className="figma-item-card-image-wrap">
                          <img 
                            src={course.cover_image} 
                            alt={lang === 'ar' ? course.title_ar : course.title_en} 
                            style={{ objectFit: 'cover', width: '100%', height: '100%' }} 
                          />
                        </div>
                      )}
                      <div className="figma-item-card-content">
                        {!course.cover_image && course.category && (
                          <span style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', width: 'fit-content', marginBottom: '8px' }}>
                            {course.category}
                          </span>
                        )}
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
      );
      case 'upcoming': return (
        <section key="upcoming" id="upcoming" className="figma-upcoming-section">
          <div className="figma-section-container">
            <h2 className="figma-section-title-main">{lang === 'ar' ? 'الأنشطة القادمة' : 'UPCOMING ACTIVITIES'}</h2>
            
            <div className="figma-cards-horizontal-scroll">
              {loadingEvents ? (
                <div style={{ textAlign: 'center', width: '100%', padding: '40px', color: '#64748b' }}>
                  {lang === 'ar' ? 'جاري تحميل الأنشطة...' : 'Loading activities...'}
                </div>
              ) : events.length === 0 ? (
                <div style={{ textAlign: 'center', width: '100%', padding: '40px', color: '#64748b' }}>
                  {lang === 'ar' ? 'لا توجد أنشطة قادمة حالياً.' : 'No upcoming activities.'}
                </div>
              ) : (
                events.map((event) => {
                  const eventDate = new Date(event.event_date);
                  const formattedDate = eventDate.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
                  const eventImg = event.cover_image || event.image_url;
                  
                  return (
                    <div key={event.id} className="figma-item-card" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }} onClick={() => onNavigate('events')}>
                      {eventImg && (
                        <div className="figma-item-card-image-wrap">
                          <img 
                            src={eventImg} 
                            alt={event.title_ar || event.title} 
                            style={{ height: '100%', width: '100%', objectFit: 'cover' }} 
                          />
                        </div>
                      )}
                      <div className="figma-item-card-content" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                          <span className="figma-item-card-trainees" style={{ backgroundColor: '#e2effa', color: '#004c6d', padding: '4px 10px', borderRadius: '20px', fontSize: '12px' }}>
                            {formattedDate}
                          </span>
                          {(event.type_ar || event.type_en) && (
                            <span style={{ backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                              {lang === 'ar' ? (event.type_ar || event.type_en) : (event.type_en || event.type_ar)}
                            </span>
                          )}
                        </div>
                        <h3 className="figma-item-card-title" style={{ fontSize: '16px', margin: '4px 0 8px 0' }}>
                          {lang === 'ar' ? (event.title_ar || event.title) : (event.title_en || event.title)}
                        </h3>
                        {(event.description_ar || event.description_en) && (
                          <p style={{ fontSize: '13px', color: '#64748b', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {lang === 'ar' ? (event.description_ar || event.description_en) : (event.description_en || event.description_ar)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <Button variant="gradient" style={{ padding: '14px 36px' }} onClick={() => { setCurrentView('events'); window.history.pushState({}, '', '/events'); }}>
                {lang === 'ar' ? 'استعرض جميع الفعاليات' : 'Browse All Activities'}
              </Button>
            </div>
          </div>
        </section>
      );
      default: return null;
    }
  };

  return (
    <main className="figma-main-content">
        <CalendarSidebarWidget 
          lang={lang} 
          onNavigate={onNavigate} 
        />
      {PAGE_LAYOUT.map(id => renderSection(id))}
    </main>

  );
}

export const NewHomePage = HomePage;
