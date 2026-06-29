import { Button } from '../../shared/components/Button';
import { GlassCard } from '../../shared/components/GlassCard';

export function ArticleCard({ title, category, date, author, summary, image, onClick }) {
  return (
    <GlassCard 
      className="article-card" 
      onClick={onClick}
      style={{ 
        padding: '20px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '15px', 
        height: '100%', 
        opacity: 0,
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(11, 40, 73, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none'; // GlassCard default
      }}
    >
      {image && (
        <div style={{ width: '100%', height: '180px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(11, 40, 73, 0.1)' }}>
          <img src={image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ 
          background: 'rgba(21, 180, 122, 0.1)', 
          color: '#15b47a', 
          padding: '3px 10px', 
          borderRadius: '20px', 
          fontSize: '11px', 
          fontWeight: 'bold',
          whiteSpace: 'nowrap'
        }}>
          {category}
        </span>
        <span style={{ fontSize: '11.5px', color: 'rgba(11, 40, 73, 0.5)' }}>{date}</span>
      </div>
      
      <h3 style={{ margin: 0, color: '#0b2849', fontSize: '17px', fontWeight: 'bold', lineHeight: '1.4' }}>{title}</h3>
      <p style={{ margin: 0, color: 'rgba(11, 40, 73, 0.7)', fontSize: '13.5px', lineHeight: '1.6', flexGrow: 1 }}>
        {summary}
      </p>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', borderTop: '1px solid rgba(11, 40, 73, 0.08)', paddingTop: '12px' }}>
        <span style={{ fontSize: '11.5px', color: '#004c6d', fontWeight: '500' }}>بواسطة: {author}</span>
        <Button variant="text" onClick={onClick} style={{ padding: 0, fontSize: '12px', fontWeight: 'bold' }}>
          اقرأ المزيد
        </Button>
      </div>
    </GlassCard>
  );
}
