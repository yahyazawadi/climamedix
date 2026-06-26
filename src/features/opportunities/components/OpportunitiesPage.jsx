import { useState, useEffect } from 'preact/hooks';
import { useOpportunities } from '../hooks/useOpportunities';
import { OpportunitiesGrid, CATEGORY_MAP } from './OpportunitiesGrid';
import { translations } from '../../../i18n/translations';

const CATEGORY_KEYS = ['all', 'fellowship', 'scholarship', 'conference', 'internship', 'grant'];

export function OpportunitiesPage({ lang }) {
  const { opportunities, loading, error } = useOpportunities();
  const [activeCategory, setActiveCategory] = useState('all');
  const t = translations[lang] || translations.ar;

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const filteredOpportunities = activeCategory === 'all' 
    ? opportunities 
    : opportunities.filter(opp => opp.type === activeCategory);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      
      {/* 1. Header Banner Block (Green-to-Blue Gradient) */}
      <div 
        className="opportunities-banner"
        style={{
          background: 'linear-gradient(90deg, #15b47a 0%, #12a978 5%, #0c8774 23%, #066d71 41%, #025a6e 60%, #004f6d 79%, #004c6d 100%)',
          padding: '160px 20px 50px 20px',
          textAlign: 'center',
          position: 'relative',
          boxShadow: '0 4px 20px rgba(11, 40, 73, 0.1)',
          direction: lang === 'ar' ? 'rtl' : 'ltr'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Page Title in white for high contrast */}
          <h1 style={{ 
            fontSize: 'clamp(28px, 4vw, 40px)', 
            fontWeight: 'bold', 
            color: '#ffffff', 
            marginBottom: '16px',
            fontFamily: lang === 'ar' ? 'Tajawal, sans-serif' : 'Outfit, sans-serif',
            textShadow: '0 2px 4px rgba(0,0,0,0.15)'
          }}>
            {t.opportunitiesTitle || (lang === 'ar' ? 'فرص التطوير والتمويل' : 'Development & Funding Opportunities')}
          </h1>
          
          {/* Subtitle in semi-transparent white */}
          <p style={{ 
            fontSize: 'clamp(14px, 1.8vw, 16px)', 
            color: 'rgba(255, 255, 255, 0.9)', 
            maxWidth: '750px', 
            margin: '0 auto 35px auto',
            lineHeight: '1.6',
            fontFamily: lang === 'ar' ? 'Tajawal, sans-serif' : 'Outfit, sans-serif'
          }}>
            {t.opportunitiesSubtitle || (lang === 'ar' 
              ? 'استكشف الزمالات، المنح، المؤتمرات، والفرص التدريبية المتاحة لبناء قدراتك في مجال العمل المناخي والصحي' 
              : 'Explore fellowships, scholarships, conferences, and training opportunities available to build your capacity in climate and health action')}
          </p>

          {/* Center Category Filter Tabs */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            flexWrap: 'wrap', 
            justifyContent: 'center',
            width: '100%',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            {CATEGORY_KEYS.map(key => (
              <button
                key={key}
                className={`search-filter-tag ${activeCategory === key ? 'active' : ''}`}
                onClick={() => setActiveCategory(key)}
                style={{ 
                  fontSize: '13.5px', 
                  padding: '8px 22px',
                  border: '1px solid rgba(255,255,255,0.25)'
                }}
              >
                {CATEGORY_MAP[key]?.[lang] || key}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Opportunities Content Block (Below the banner on Light gray background) */}
      <div style={{ 
        flexGrow: 1,
        padding: '50px 20px 80px 20px',
        position: 'relative',
        zIndex: 1,
        background: '#f8fafc',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          textAlign: lang === 'ar' ? 'right' : 'left', 
          direction: lang === 'ar' ? 'rtl' : 'ltr' 
        }}>
          {/* Dynamic States */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '15px' }}>
              <div className="premium-spinner" style={{
                width: '50px',
                height: '50px',
                border: '3px solid rgba(21, 180, 122, 0.1)',
                borderTop: '3px solid #15b47a',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <p style={{ color: 'rgba(11, 40, 73, 0.6)', fontSize: '15px', fontFamily: 'Tajawal, sans-serif' }}>
                {lang === 'ar' ? 'جاري تحميل الفرص...' : 'Loading opportunities...'}
              </p>
            </div>
          ) : error ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '50px 20px', 
              background: '#ffffff', 
              borderRadius: '20px', 
              boxShadow: '0 10px 30px rgba(11, 40, 73, 0.05)',
              border: '1px solid rgba(255, 77, 77, 0.15)', 
              maxWidth: '600px', 
              margin: '0 auto' 
            }}>
              <span style={{ fontSize: '36px', marginBottom: '15px', display: 'block' }}>⚠️</span>
              <h4 style={{ color: '#ff4d4d', margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold' }}>
                {lang === 'ar' ? 'عذراً، حدث خطأ أثناء تحميل البيانات' : 'Sorry, an error occurred while loading data'}
              </h4>
              <p style={{ color: 'rgba(11, 40, 73, 0.7)', fontSize: '14px', margin: '0 0 20px 0' }}>{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                style={{
                  background: '#0b2849',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  fontFamily: 'Tajawal, sans-serif'
                }}
              >
                {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
              </button>
            </div>
          ) : (
            <OpportunitiesGrid opportunities={opportunities} activeCategory={activeCategory} lang={lang} />
          )}
        </div>
      </div>
    </div>
  );
}
