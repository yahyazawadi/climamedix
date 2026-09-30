import { Button } from '../../shared/components/Button';

export function ArticleCard({ id, title, category, date, author, summary, image, onClick, onEdit, canEdit, views_count = 0, likes_count = 0, lang = 'ar' }) {
  return (
    <div 
      className="figma-item-card article-card" 
      data-article-id={id || title}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {image && (
        <div className="figma-item-card-image-wrap">
          <img src={image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <div className="figma-item-card-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ 
              background: '#e2effa', 
              color: '#004c6d', 
              padding: '3px 10px', 
              borderRadius: '20px', 
              fontSize: '11px', 
              fontWeight: 'bold',
              whiteSpace: 'nowrap'
            }}>
              {category}
            </span>
          {canEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#0ea5e9',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'background 0.2s',
              }}
              title={lang === 'ar' ? 'تعديل المقال' : 'Edit Article'}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(14, 165, 233, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: 'rgba(11, 40, 73, 0.5)', fontSize: '11.5px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title={lang === 'ar' ? 'المشاهدات' : 'Views'}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            {views_count}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title={lang === 'ar' ? 'الإعجابات' : 'Likes'}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            {likes_count}
          </span>
          <span>{date}</span>
        </div>
      </div>
      
      <h3 className="figma-item-card-title">{title}</h3>
      <p style={{ margin: 0, color: 'rgba(11, 40, 73, 0.7)', fontSize: '13.5px', lineHeight: '1.6', flexGrow: 1 }}>
        {summary}
      </p>
      
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid rgba(11, 40, 73, 0.08)', paddingTop: '12px' }}>
          <span style={{ fontSize: '11.5px', color: '#004c6d', fontWeight: '500' }}>{lang === 'ar' ? 'بواسطة:' : 'By:'} {author}</span>
          <Button variant="text" onClick={onClick} style={{ padding: 0, fontSize: '12px', fontWeight: 'bold' }}>
            {lang === 'ar' ? 'اقرأ المزيد' : 'Read More'}
          </Button>
        </div>
      </div>
    </div>
  );
}
