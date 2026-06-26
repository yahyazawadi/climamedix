import { Button } from '../../shared/components/Button';
import { GlassCard } from '../../shared/components/GlassCard';

export function EventCard({ title, date, time, type, desc, onRegister, isRegistered }) {
  // Format Arabic Date representation (e.g. 15 يوليو 2026)
  const formattedDate = new Date(date).toLocaleDateString('ar-EG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Extract day and month for the calendar icon
  const day = new Date(date).getDate();
  const month = new Date(date).toLocaleDateString('ar-EG', { month: 'short' });

  return (
    <GlassCard className="event-card" style={{ padding: '24px', display: 'flex', gap: '20px', alignItems: 'center', opacity: 0, height: '100%' }}>
      {/* Calendar Icon Sheet */}
      <div style={{
        width: '65px',
        height: '75px',
        background: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 8px 20px rgba(0, 76, 109, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid rgba(11, 40, 73, 0.1)',
        flexShrink: 0
      }}>
        <div style={{ background: '#004c6d', color: '#ffffff', fontSize: '11px', fontWeight: 'bold', padding: '4px 0', textAlign: 'center', textTransform: 'uppercase' }}>
          {month}
        </div>
        <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', color: '#0b2849' }}>
          {day}
        </div>
      </div>

      {/* Content */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ margin: 0, color: '#0b2849', fontSize: '17px', fontWeight: 'bold', lineHeight: '1.4' }}>{title}</h3>
          <span style={{ 
            background: 'rgba(21, 180, 122, 0.1)', 
            color: '#15b47a', 
            padding: '3px 10px', 
            borderRadius: '20px', 
            fontSize: '11px', 
            fontWeight: 'bold',
            whiteSpace: 'nowrap'
          }}>
            {type}
          </span>
        </div>

        <p style={{ margin: 0, color: 'rgba(11, 40, 73, 0.7)', fontSize: '13.5px', lineHeight: '1.6' }}>
          {desc}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', borderTop: '1px solid rgba(11, 40, 73, 0.08)', paddingTop: '12px' }}>
          <div style={{ display: 'flex', gap: '15px', color: 'rgba(11, 40, 73, 0.5)', fontSize: '12px' }}>
            <span>{formattedDate}</span>
            <span>{time}</span>
          </div>

          <Button 
            variant={isRegistered ? "outline" : "gradient"} 
            onClick={onRegister}
            style={{ 
              padding: '6px 16px', 
              fontSize: '12px',
              borderColor: isRegistered ? '#15b47a' : undefined,
              color: isRegistered ? '#15b47a' : undefined
            }}
          >
            {isRegistered ? '✓ مسجل' : 'سجل الآن'}
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}
