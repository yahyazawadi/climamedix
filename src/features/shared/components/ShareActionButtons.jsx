import { useState } from 'preact/hooks';

export function ShareActionButtons({ 
  lang = 'ar', 
  title = '', 
  url = '', 
  onEdit, 
  onLike, 
  userLiked = false, 
  likesCount = 0 
}) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareSpinning, setShareSpinning] = useState(false);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    setShareSpinning(true);
    setTimeout(() => setShareSpinning(false), 2000);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: shareUrl
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const btnStyle = {
    background: 'rgba(11,40,73,0.06)',
    border: 'none',
    color: '#0b2849',
    cursor: 'pointer',
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    transition: 'background 0.2s'
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: onLike ? 'space-between' : 'flex-end', 
      width: onLike ? '100%' : 'auto',
      position: 'relative' 
    }}>
      {/* Heart / Like button (placed on the start/right side in RTL) */}
      {onLike && (
        <button
          onClick={onLike}
          style={{
            ...btnStyle,
            backgroundColor: userLiked ? 'rgba(230, 57, 70, 0.1)' : 'rgba(11, 40, 73, 0.06)',
            color: userLiked ? '#e63946' : '#0b2849'
          }}
          title={lang === 'ar' ? 'الإعجاب بالمقال' : 'Like Article'}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = userLiked ? 'rgba(230, 57, 70, 0.18)' : 'rgba(11, 40, 73, 0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = userLiked ? 'rgba(230, 57, 70, 0.1)' : 'rgba(11, 40, 73, 0.06)'; }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill={userLiked ? '#e63946' : 'none'} stroke={userLiked ? '#e63946' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'fill 0.2s ease, stroke 0.2s ease' }}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span style={{
            position: 'absolute',
            top: '-4px',
            [lang === 'ar' ? 'left' : 'right']: '-4px',
            background: userLiked ? '#e63946' : '#0b2849',
            color: '#ffffff',
            fontFamily: "'Outfit', system-ui, -apple-system, sans-serif",
            fontSize: '11px',
            fontWeight: '700',
            minWidth: '18px',
            height: '18px',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: likesCount > 9 ? '0 5px' : '0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            pointerEvents: 'none',
            boxSizing: 'border-box',
            lineHeight: 1,
            direction: 'ltr'
          }}>
            {likesCount}
          </span>
        </button>
      )}

      {/* Action / Share buttons group (placed on the opposite/left side) */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {/* Edit button — only shown when onEdit is provided */}
        {onEdit && (
          <button
            onClick={onEdit}
            style={{ ...btnStyle }}
            title={lang === 'ar' ? 'تعديل المقال' : 'Edit Article'}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(11, 40, 73, 0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(11, 40, 73, 0.06)'; }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        )}

        <button 
          onClick={handleCopyLink} 
          style={btnStyle}
          title={lang === 'ar' ? 'نسخ الرابط' : 'Copy Link'}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(11, 40, 73, 0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(11, 40, 73, 0.06)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', transform: linkCopied ? 'rotate(360deg)' : 'rotate(0deg)', transition: 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
            {linkCopied ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15b47a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            )}
          </div>
        </button>

        <button 
          onClick={handleNativeShare}
          style={btnStyle}
          title={lang === 'ar' ? 'مشاركة عبر...' : 'Share via...'}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(11, 40, 73, 0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(11, 40, 73, 0.06)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', transform: shareSpinning ? 'rotate(360deg)' : 'rotate(0deg)', transition: 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
          </div>
        </button>
      </div>
    </div>
  );
}
