import { Button } from '../../shared/components/Button';
import { GlassCard } from '../../shared/components/GlassCard';
import { CATEGORY_MAP } from './OpportunitiesGrid';

export function OpportunityCard({ 
  title_ar, 
  title_en, 
  type, 
  deadline, 
  description_ar, 
  description_en, 
  eligibility_ar, 
  eligibility_en, 
  apply_link, 
  lang = 'ar',
  style = {} 
}) {
  const title = lang === 'ar' ? title_ar : (title_en || title_ar);
  const description = lang === 'ar' ? description_ar : (description_en || description_ar);
  const eligibility = lang === 'ar' ? eligibility_ar : (eligibility_en || eligibility_ar);
  const typeDisplay = CATEGORY_MAP[type]?.[lang] || type;

  // Format deadline date nicely
  let formattedDeadline = deadline;
  if (deadline) {
    try {
      const date = new Date(deadline);
      formattedDeadline = date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      formattedDeadline = deadline;
    }
  } else {
    formattedDeadline = lang === 'ar' ? 'مفتوح' : 'Open';
  }

  // Handle the action button based on apply_link status (RLS column masking)
  const handleApplyClick = () => {
    if (apply_link) {
      window.open(apply_link, '_blank', 'noopener,noreferrer');
    } else {
      // Redirect to Auth page
      window.history.pushState({}, '', '/auth');
      // Trigger native event so routing catches it
      const navEvent = new PopStateEvent('popstate');
      window.dispatchEvent(navEvent);
    }
  };

  return (
    <GlassCard 
      className="opportunity-card" 
      style={{ 
        padding: '24px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '15px', 
        height: '100%', 
        width: '100%',
        opacity: 0, 
        textAlign: lang === 'ar' ? 'right' : 'left',
        direction: lang === 'ar' ? 'rtl' : 'ltr',
        boxSizing: 'border-box',
        ...style 
      }}
    >
      {/* Card Header: Title and Type Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
        <h3 style={{ 
          margin: 0, 
          color: '#0b2849', 
          fontSize: '17px', 
          fontWeight: 'bold', 
          lineHeight: '1.4',
          fontFamily: lang === 'ar' ? 'Tajawal, sans-serif' : 'Outfit, sans-serif'
        }}>
          {title}
        </h3>
        <span style={{ 
          background: 'rgba(21, 180, 122, 0.1)', 
          color: '#15b47a', 
          padding: '4px 12px', 
          borderRadius: '20px', 
          fontSize: '11px', 
          fontWeight: 'bold',
          whiteSpace: 'nowrap'
        }}>
          {typeDisplay}
        </span>
      </div>
      
      {/* Description */}
      <p style={{ 
        margin: 0, 
        color: 'rgba(11, 40, 73, 0.75)', 
        fontSize: '13.5px', 
        lineHeight: '1.6', 
        flexGrow: 1 
      }}>
        {description}
      </p>

      {/* Eligibility Requirements */}
      {eligibility && (
        <div style={{ 
          marginTop: '5px', 
          padding: '10px 12px', 
          background: 'rgba(0, 76, 109, 0.04)', 
          borderRadius: '8px',
          borderLeft: lang === 'en' ? '3px solid #004c6d' : 'none',
          borderRight: lang === 'ar' ? '3px solid #004c6d' : 'none'
        }}>
          <span style={{ 
            display: 'block', 
            fontSize: '11px', 
            color: '#004c6d', 
            fontWeight: 'bold', 
            marginBottom: '4px' 
          }}>
            {lang === 'ar' ? 'الأهلية والشروط:' : 'Eligibility Requirements:'}
          </span>
          <span style={{ fontSize: '12px', color: 'rgba(11, 40, 73, 0.8)' }}>
            {eligibility}
          </span>
        </div>
      )}
      
      {/* Footer info: Deadline and Action Button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: '10px', 
        borderTop: '1px solid rgba(11, 40, 73, 0.08)', 
        paddingTop: '15px' 
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '10px', color: 'rgba(11, 40, 73, 0.5)', marginBottom: '2px' }}>
            {lang === 'ar' ? 'الموعد النهائي' : 'Deadline'}
          </span>
          <strong style={{ color: '#004c6d', fontSize: '12.5px' }}>
            {formattedDeadline}
          </strong>
        </div>
        
        {apply_link ? (
          <Button 
            variant="outline" 
            onClick={handleApplyClick} 
            style={{ padding: '6px 16px', fontSize: '12.5px', fontWeight: 'bold' }}
          >
            {lang === 'ar' ? 'تقديم الطلب' : 'Apply Now'}
          </Button>
        ) : (
          <Button 
            variant="gradient" 
            onClick={handleApplyClick} 
            style={{ 
              padding: '6px 14px', 
              fontSize: '11.5px', 
              fontWeight: 'bold',
              borderRadius: '8px'
            }}
          >
            {lang === 'ar' ? 'سجل لعرض الرابط' : 'Sign in to Apply'}
          </Button>
        )}
      </div>
    </GlassCard>
  );
}
