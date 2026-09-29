import { useState, useEffect, useRef } from 'preact/hooks';
import { supabase } from '../../../utils/supabaseClient';
import { useAuth } from '../../auth/hooks/useAuth';

export function DynamicHomeSlider({ lang, onNavigate }) {
  const { hasPermission, userProfile } = useAuth();
  const [slides, setSlides] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const slideContainerRef = useRef(null);

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from('home_slider')
        .select('*')
        .order('sequence_order', { ascending: true });
        
      if (error) {
        // Table probably doesn't exist yet, silently fail
        console.log("Slider table not found or empty.");
        return;
      }
      setSlides(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (slides.length <= 1) return;
    
    // Clear existing timer and start a new 7-second timer whenever slide changes (manually or automatically)
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % slides.length);
    }, 7000);
    
    return () => clearInterval(interval);
  }, [slides.length, activeIndex]);

  const handlePrev = () => {
    setActiveIndex(prev => (prev - 1 + slides.length) % slides.length);
  };
  
  const handleNext = () => {
    setActiveIndex(prev => (prev + 1) % slides.length);
  };

  if (slides.length === 0) {
    if (!hasPermission('manage:slider')) {
      return null;
    }
    return (
      <div style={{ width: '100%', height: '300px', background: 'rgba(11, 40, 73, 0.05)', border: '2px dashed rgba(21, 180, 122, 0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '20px 0' }}>
        <h3 style={{ color: '#0b2849', marginBottom: '10px' }}>{lang === 'ar' ? 'شريط العرض (Slider) فارغ حالياً' : 'Homepage Slider is currently empty'}</h3>
        <p style={{ color: 'rgba(11, 40, 73, 0.7)' }}>{lang === 'ar' ? 'اذهب إلى (إدارة الرئيسية) من القائمة العلوية لإضافة محتوى هنا.' : 'Go to (Slider Manager) in the top menu to add content here.'}</p>
        <button 
          onClick={() => onNavigate('admin-slider')}
          style={{ background: '#15b47a', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', marginTop: '15px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {lang === 'ar' ? 'إضافة محتوى الآن' : 'Add Content Now'}
        </button>
      </div>
    );
  }

  const currentSlide = slides[activeIndex];

  const getEntityLabel = (entityType, language) => {
    const type = (entityType || '').toLowerCase();
    if (language === 'ar') {
      if (type.includes('course') || type.includes('training')) return 'دورة تدريبية';
      if (type.includes('article') || type.includes('news')) return 'مقال';
      if (type.includes('research')) return 'بحث علمي';
      if (type.includes('event')) return 'فعالية';
      if (type.includes('opportunity')) return 'فرصة';
      if (type.includes('custom')) return 'إعلان';
      return entityType;
    } else {
      if (type.includes('course') || type.includes('training')) return 'Course';
      if (type.includes('article') || type.includes('news')) return 'Article';
      if (type.includes('research')) return 'Research';
      if (type.includes('event')) return 'Event';
      if (type.includes('opportunity')) return 'Opportunity';
      if (type.includes('custom')) return 'Announcement';
      return entityType;
    }
  };

  const getActionLabel = (entityType, language) => {
    const type = (entityType || '').toLowerCase();
    if (language === 'ar') {
      if (type.includes('course') || type.includes('training')) return 'انضم للدورة التدريبية';
      if (type.includes('article') || type.includes('news')) return 'اقرأ المقال';
      if (type.includes('research')) return 'اقرأ البحث';
      if (type.includes('event')) return 'سجل في الفعالية';
      return 'استعرض التفاصيل';
    } else {
      if (type.includes('course') || type.includes('training')) return 'Join the Course';
      if (type.includes('article') || type.includes('news')) return 'Read Article';
      if (type.includes('research')) return 'Read Research';
      if (type.includes('event')) return 'Register for Event';
      return 'View Details';
    }
  };

  const handleActionClick = (linkUrl) => {
    if (!linkUrl) return;
    if (linkUrl.startsWith('/')) {
      // Split pathname and search query
      const [pathOnly, search] = linkUrl.split('?');
      let targetView = 'home';
      
      const cleanPath = pathOnly.replace(/\/$/, '');
      if (cleanPath.startsWith('/course') || cleanPath.startsWith('/training')) {
        targetView = 'courses';
      } else if (cleanPath.startsWith('/research')) {
        targetView = cleanPath.includes('detail') ? 'research-detail' : 'research';
      } else if (cleanPath.startsWith('/article') || cleanPath.startsWith('/news')) {
        targetView = cleanPath.includes('article') ? 'article' : 'news';
      } else if (cleanPath.startsWith('/event')) {
        targetView = 'events';
      } else if (cleanPath.startsWith('/opportunity') || cleanPath.startsWith('/opportunities')) {
        targetView = 'opportunities';
      } else if (cleanPath.startsWith('/join') || cleanPath.startsWith('/apply')) {
        targetView = 'join';
      } else {
        const seg = cleanPath.replace(/^\//, '').split('/')[0];
        targetView = seg || 'home';
      }

      window.history.pushState({}, '', linkUrl);
      if (onNavigate) {
        onNavigate(targetView);
      }
    } else {
      window.location.href = linkUrl;
    }
  };

  return (
    <div className="figma-slider-section">
      <div className="home-hero-slider geometric-carousel">
        {/* Background Slides */}
        {slides.map((slide, idx) => (
          <div 
            key={slide.id}
            className={`home-slider-slide ${idx === activeIndex ? 'active' : ''}`}
          >
            <img 
              src={slide.image_url} 
              className="home-slider-bg-img"
              alt={lang === 'ar' ? slide.title_ar : slide.title_en} 
            />
            {/* Directional Gradient Scrim */}
            <div className="home-slider-scrim" />
          </div>
        ))}

        {/* Content Container Overlay */}
        <div className="home-slider-content-wrap">
          <div className="home-slider-content">
            {/* Entity Badge */}
            <span className="home-slider-badge">
              <span className="home-slider-badge-dot" />
              {getEntityLabel(currentSlide.entity_type, lang)}
            </span>

            {/* Title */}
            <h2 className="home-slider-title">
              {lang === 'ar' ? currentSlide.title_ar : currentSlide.title_en}
            </h2>

            {/* Action CTA Button */}
            {currentSlide.link_url && (
              <button
                className="home-slider-cta-btn"
                onClick={() => handleActionClick(currentSlide.link_url)}
              >
                <span>{getActionLabel(currentSlide.entity_type, lang)}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: lang === 'ar' ? 'rotate(180deg)' : 'none' }}>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Controls Bar (Anchored in bottom corner opposite to text) */}
        {slides.length > 1 && (
          <div className="home-slider-controls">
            {/* Dot Indicators */}
            <div className="home-slider-dots">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  className={`home-slider-dot ${i === activeIndex ? 'active' : ''}`}
                  onClick={() => setActiveIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

            {/* Arrow Buttons */}
            <div className="home-slider-arrows">
              <button className="home-slider-arrow-btn prev" onClick={handlePrev} aria-label="Previous slide">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points={lang === 'ar' ? "9 18 15 12 9 6" : "15 18 9 12 15 6"} />
                </svg>
              </button>
              <button className="home-slider-arrow-btn next" onClick={handleNext} aria-label="Next slide">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points={lang === 'ar' ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
