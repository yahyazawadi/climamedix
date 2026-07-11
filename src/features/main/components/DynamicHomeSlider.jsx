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
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides]);

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

  return (
    <div style={{ maxWidth: '1440px', width: '100%', margin: '20px auto', padding: '0 30px' }}>
    <div className="geometric-carousel" style={{ position: 'relative', height: '520px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
      
      {/* Background Image */}
      {slides.map((slide, idx) => (
        <img 
          key={slide.id}
          src={slide.image_url} 
          style={{ 
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
            objectFit: 'cover', zIndex: 1, 
            opacity: idx === activeIndex ? 0.95 : 0,
            transition: 'opacity 0.8s ease-in-out'
          }} 
          alt={lang === 'ar' ? slide.title_ar : slide.title_en} 
        />
      ))}

      {/* Triangular Geometric Overlay */}
      <div style={{
        position: 'absolute', top: 0, right: 0, width: '33.33%', minWidth: '380px', height: '100%',
        background: 'linear-gradient(135deg, rgba(11, 40, 73, 0.98) 20%, rgba(21, 180, 122, 0.9) 100%)',
        clipPath: 'polygon(12% 0%, 100% 0%, 100% 100%, 0% 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start',
        padding: '40px 80px 40px 40px', color: '#fff', zIndex: 2, direction: lang === 'ar' ? 'rtl' : 'ltr'
      }}>
        
        {/* Type Badge */}
        <span style={{ 
          fontSize: '12px', background: 'rgba(21, 180, 122, 0.2)', border: '1px solid #15b47a', 
          color: '#15b47a', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold', 
          marginBottom: '15px', width: 'fit-content', textTransform: 'uppercase'
        }}>
          {currentSlide.entity_type}
        </span>
        
        {/* Title */}
        <h3 style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff', marginBottom: '15px', lineHeight: '1.4', textAlign: lang === 'ar' ? 'right' : 'left' }}>
          {lang === 'ar' ? currentSlide.title_ar : currentSlide.title_en}
        </h3>
        
        {/* Action Button */}
        {currentSlide.link_url && (
          <button
            onClick={() => window.location.href = currentSlide.link_url}
            style={{ 
              background: '#15b47a', color: '#fff', border: 'none', padding: '12px 30px', 
              borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s',
              marginTop: '20px'
            }}
            onMouseEnter={(e) => e.target.style.boxShadow = '0 0 15px #15b47a'}
            onMouseLeave={(e) => e.target.style.boxShadow = 'none'}
          >
            {(() => {
              const type = currentSlide.entity_type ? currentSlide.entity_type.toLowerCase() : '';
              if (lang === 'ar') {
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
            })()}
          </button>
        )}
      </div>

      {/* Navigation Arrows — Left & Right */}
      {/* if you change the arrows position i will kill you */}
      {slides.length > 1 && (
        <>
          <button className="carousel-nav-btn prev" onClick={handlePrev}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <button className="carousel-nav-btn next" onClick={handleNext}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </>
      )}
    </div>
    </div>
  );
}
