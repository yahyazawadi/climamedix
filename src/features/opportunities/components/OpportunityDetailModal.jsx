import { Button } from '../../shared/components/Button';
import { CATEGORY_MAP } from './OpportunitiesGrid';

export function OpportunityDetailModal({ opportunity, onClose, lang = 'ar', onNavigate }) {
  if (!opportunity) return null;

  const isArabic = lang === 'ar';
  const title = isArabic ? opportunity.title_ar : (opportunity.title_en || opportunity.title_ar);
  const description = isArabic ? opportunity.description_ar : (opportunity.description_en || opportunity.description_ar);
  const eligibility = isArabic ? opportunity.eligibility_ar : (opportunity.eligibility_en || opportunity.eligibility_ar);
  const typeDisplay = CATEGORY_MAP[opportunity.type]?.[lang] || opportunity.type;

  let formattedDeadline = opportunity.deadline;
  if (opportunity.deadline) {
    try {
      const date = new Date(opportunity.deadline);
      formattedDeadline = date.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      formattedDeadline = opportunity.deadline;
    }
  } else {
    formattedDeadline = isArabic ? 'مفتوح للتقديم المستمر' : 'Open for continuous application';
  }

  const handleApplyClick = () => {
    if (opportunity.apply_link) {
      let rawLink = String(opportunity.apply_link).trim();
      
      // 1. If it's a relative path, navigate within current app
      if (rawLink.startsWith('/')) {
        if (onNavigate) {
          const view = rawLink.replace(/^\//, '');
          onNavigate(view);
        } else {
          window.history.pushState({}, '', rawLink);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
        onClose();
        return;
      }

      // 2. Prepend protocol if missing
      let url = rawLink;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      // 3. If link points to current host/port, navigate locally
      try {
        const parsed = new URL(url);
        if (parsed.host === window.location.host) {
          if (onNavigate) {
            onNavigate(parsed.pathname.replace(/^\//, '') || 'newhome', null, parsed.search.replace(/^\?/, ''));
          } else {
            window.history.pushState({}, '', parsed.pathname + parsed.search);
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
          onClose();
          return;
        }
      } catch (err) {
        // Fallback to window.open
      }

      // 4. External third-party link: open in new tab
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      if (onNavigate) {
        onNavigate('auth');
      } else {
        window.history.pushState({}, '', '/auth');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      onClose();
    }
  };

  // Compute preview URL so native browser hover status shows link in bottom-left
  let resolvedHref = null;
  let isExternalLink = false;
  if (opportunity.apply_link) {
    const rawLink = String(opportunity.apply_link).trim();
    if (rawLink.startsWith('/')) {
      resolvedHref = rawLink;
    } else {
      let url = rawLink;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      resolvedHref = url;
      try {
        const parsed = new URL(url);
        isExternalLink = parsed.host !== (typeof window !== 'undefined' ? window.location.host : '');
      } catch (e) {
        isExternalLink = true;
      }
    }
  } else {
    resolvedHref = '/auth';
  }

  return (
    <div 
      className="modal-overlay open"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 12, 26, 0.65)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2500,
        padding: '20px',
        boxSizing: 'border-box'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="opportunity-detail-modal"
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid rgba(11, 40, 73, 0.12)',
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          direction: isArabic ? 'rtl' : 'ltr',
          textAlign: isArabic ? 'right' : 'left',
          boxSizing: 'border-box'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Gradient Bar like /join */}
        <div style={{
          height: '5px',
          width: '100%',
          background: 'linear-gradient(90deg, #15b47a, #004c6d)',
          flexShrink: 0
        }} />

        {/* Modal Header */}
        <div style={{
          padding: '24px 28px 18px 28px',
          borderBottom: '1px solid rgba(11, 40, 73, 0.08)',
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{ 
                background: 'rgba(21, 180, 122, 0.12)', 
                color: '#15b47a', 
                padding: '4px 12px', 
                borderRadius: '20px', 
                fontSize: '12px', 
                fontWeight: 'bold',
                display: 'inline-block'
              }}>
                {typeDisplay}
              </span>
              <span style={{
                background: 'rgba(0, 76, 109, 0.08)',
                color: '#004c6d',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {isArabic ? `الموعد: ${formattedDeadline}` : `Deadline: ${formattedDeadline}`}
              </span>
            </div>
            
            <h2 style={{
              margin: 0,
              color: '#0b2849',
              fontSize: 'clamp(18px, 3vw, 22px)',
              fontWeight: 'bold',
              lineHeight: '1.4',
              fontFamily: isArabic ? 'Tajawal, sans-serif' : 'Outfit, sans-serif'
            }}>
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label={isArabic ? 'إغلاق' : 'Close'}
            style={{
              background: 'rgba(11, 40, 73, 0.06)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#0b2849',
              fontSize: '20px',
              fontWeight: 'bold',
              flexShrink: 0,
              transition: 'background 0.2s ease',
              marginTop: '-4px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(11, 40, 73, 0.12)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(11, 40, 73, 0.06)'}
          >
            &times;
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{
          padding: '24px 28px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          color: '#0b2849'
        }}>
          {/* Detailed Description */}
          <div>
            <h4 style={{
              margin: '0 0 8px 0',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#004c6d',
              fontFamily: isArabic ? 'Tajawal, sans-serif' : 'Outfit, sans-serif'
            }}>
              {isArabic ? 'تفاصيل الفرصة:' : 'Opportunity Details:'}
            </h4>
            <p style={{
              margin: 0,
              color: 'rgba(11, 40, 73, 0.82)',
              fontSize: '14.5px',
              lineHeight: '1.7',
              whiteSpace: 'pre-wrap'
            }}>
              {description || (isArabic ? 'لا توجد تفاصيل إضافية مسجلة.' : 'No additional details provided.')}
            </p>
          </div>

          {/* Eligibility Requirements Box */}
          {eligibility && (
            <div style={{
              padding: '16px 18px',
              background: 'rgba(0, 76, 109, 0.04)',
              borderRadius: '14px',
              borderLeft: isArabic ? 'none' : '4px solid #004c6d',
              borderRight: isArabic ? '4px solid #004c6d' : 'none'
            }}>
              <h4 style={{
                margin: '0 0 6px 0',
                fontSize: '13.5px',
                fontWeight: 'bold',
                color: '#004c6d',
                fontFamily: isArabic ? 'Tajawal, sans-serif' : 'Outfit, sans-serif'
              }}>
                {isArabic ? 'شروط التقديم والأهلية:' : 'Eligibility & Requirements:'}
              </h4>
              <p style={{
                margin: 0,
                fontSize: '13.5px',
                lineHeight: '1.6',
                color: 'rgba(11, 40, 73, 0.85)',
                whiteSpace: 'pre-wrap'
              }}>
                {eligibility}
              </p>
            </div>
          )}

          {/* Key Information Summary Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            background: '#f8fafc',
            padding: '16px',
            borderRadius: '14px',
            border: '1px solid rgba(11, 40, 73, 0.08)'
          }}>
            <div>
              <span style={{ display: 'block', fontSize: '11.5px', color: 'rgba(11, 40, 73, 0.55)', marginBottom: '3px' }}>
                {isArabic ? 'نوع النشاط' : 'Type'}
              </span>
              <strong style={{ fontSize: '13.5px', color: '#0b2849' }}>
                {typeDisplay}
              </strong>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '11.5px', color: 'rgba(11, 40, 73, 0.55)', marginBottom: '3px' }}>
                {isArabic ? 'الموعد النهائي' : 'Deadline'}
              </span>
              <strong style={{ fontSize: '13.5px', color: '#004c6d' }}>
                {formattedDeadline}
              </strong>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '11.5px', color: 'rgba(11, 40, 73, 0.55)', marginBottom: '3px' }}>
                {isArabic ? 'حالة الرابط' : 'Link Status'}
              </span>
              <strong style={{ 
                fontSize: '13.5px', 
                color: opportunity.apply_link ? '#15b47a' : '#d97706' 
              }}>
                {opportunity.apply_link 
                  ? (isArabic ? 'متاح للتقديم المباشر' : 'Direct Link Available') 
                  : (isArabic ? 'يتطلب تسجيل الدخول' : 'Requires Sign-in')}
              </strong>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div style={{
          padding: '16px 28px',
          borderTop: '1px solid rgba(11, 40, 73, 0.08)',
          background: '#fcfdfe',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              color: '#0b2849',
              border: '1px solid rgba(11, 40, 73, 0.1)',
              padding: '10px 22px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '13px',
              fontFamily: isArabic ? 'Tajawal, sans-serif' : 'Outfit, sans-serif'
            }}
          >
            {isArabic ? 'إغلاق' : 'Close'}
          </button>

          {opportunity.apply_link ? (
            <Button
              variant="gradient"
              href={resolvedHref}
              target={isExternalLink ? '_blank' : undefined}
              rel={isExternalLink ? 'noopener noreferrer' : undefined}
              onClick={handleApplyClick}
              style={{
                padding: '10px 24px',
                fontSize: '13.5px',
                fontWeight: 'bold',
                borderRadius: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                textDecoration: 'none'
              }}
            >
              <span>{isArabic ? 'تقديم الطلب (الانتقال للرابط)' : 'Apply Now (External Link)'}</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isArabic ? 'scaleX(-1)' : 'none' }}>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </Button>
          ) : (
            <Button
              variant="gradient"
              href="/auth"
              onClick={handleApplyClick}
              style={{
                padding: '10px 22px',
                fontSize: '13px',
                fontWeight: 'bold',
                borderRadius: '10px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center'
              }}
            >
              {isArabic ? 'سجل لعرض الرابط والتقديم' : 'Sign in to View Link & Apply'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
