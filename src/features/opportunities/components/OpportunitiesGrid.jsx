import { useLayoutEffect, useRef } from 'preact/hooks';
import gsap from 'gsap';
import { OpportunityCard } from './OpportunityCard';

export const CATEGORY_MAP = {
  all: { ar: 'الكل', en: 'All' },
  fellowship: { ar: 'زمالة دراسية', en: 'Fellowship' },
  scholarship: { ar: 'منحة تعليمية', en: 'Scholarship' },
  conference: { ar: 'مؤتمر علمي', en: 'Conference' },
  internship: { ar: 'تدريب عملي', en: 'Internship' },
  grant: { ar: 'منحة مالية / دعم', en: 'Grant' }
};

export function OpportunitiesGrid({ opportunities = [], activeCategory = 'all', lang = 'ar' }) {
  const gridRef = useRef(null);

  useLayoutEffect(() => {
    if (opportunities.length === 0) return;
    let ctx = gsap.context(() => {
      gsap.fromTo('.opportunity-card', 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' }
      );
    }, gridRef);

    return () => ctx.revert();
  }, [opportunities.length]);

  const matchingOpps = opportunities.filter(
    opp => activeCategory === 'all' || opp.type === activeCategory
  );

  return (
    <div ref={gridRef} className="opportunities-directory" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Grid Layout (fully responsive) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', 
        gap: '24px',
        padding: '0 10px'
      }}>
        {opportunities.map((opp, idx) => {
          const isVisible = activeCategory === 'all' || opp.type === activeCategory;
          return (
            <div 
              key={`${opp.id || idx}`} 
              className="opportunity-card-wrapper"
              style={{ 
                display: isVisible ? 'flex' : 'none',
                alignItems: 'stretch'
              }}
            >
              <OpportunityCard 
                {...opp} 
                lang={lang}
              />
            </div>
          );
        })}
        {matchingOpps.length === 0 && (
          <div style={{ 
            gridColumn: '1 / -1', 
            textAlign: 'center', 
            padding: '60px 20px', 
            color: 'rgba(11, 40, 73, 0.6)', 
            background: '#ffffff', 
            borderRadius: '20px', 
            boxShadow: '0 10px 30px rgba(11, 40, 73, 0.04)',
            border: '1px dashed rgba(11,40,73,0.18)',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#0b2849', fontSize: '18px', fontWeight: 'bold' }}>
              {lang === 'ar' ? 'لا توجد فرص متاحة حالياً' : 'No opportunities available currently'}
            </h4>
            <p style={{ margin: 0, fontSize: '14px' }}>
              {lang === 'ar' ? 'يرجى التحقق من تصنيف آخر أو العودة لاحقاً.' : 'Please check another category or try again later.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
