import { Button } from '../../shared/components/Button';
import { GlassCard } from '../../shared/components/GlassCard';

export function EventCard({ title, date, time, type, desc, onRegister, isRegistered, isArabic = true }) {
  const locale = isArabic ? 'ar-EG' : 'en-US';
  
  const day = new Date(date).getDate();
  const month = new Date(date).toLocaleDateString(locale, { month: 'short' });

  return (
    <GlassCard className="event-card" style={{ padding: '24px', opacity: 0, height: '100%', boxSizing: 'border-box' }}>
      <div className="event-card-inner">
        {/* Top Section on Mobile: Title/Type and Date Badge */}
        <div className="event-card-top-row">
          {/* Calendar Date & Time Column */}
          <div className="event-card-date-col">
            <div style={{
              width: '65px',
              height: '75px',
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 4px 15px rgba(0, 76, 109, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid rgba(11, 40, 73, 0.1)'
            }}>
              <div style={{ background: '#004c6d', color: '#ffffff', fontSize: '11px', fontWeight: 'bold', padding: '4px 0', textAlign: 'center', textTransform: 'uppercase' }}>
                {month}
              </div>
              <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', color: '#0b2849' }}>
                {day}
              </div>
            </div>

            {time && (
              <span style={{
                fontSize: '11.5px',
                fontWeight: '600',
                color: 'rgba(11, 40, 73, 0.65)',
                textAlign: 'center',
                maxWidth: '85px',
                lineHeight: '1.3',
                direction: 'ltr',
                display: 'block'
              }}>
                {time}
              </span>
            )}
          </div>

          {/* Title and Type pill */}
          <div className="event-card-title-area">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
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
          </div>
        </div>

        {/* Main Content Area */}
        <div className="event-card-body-area">
          <div className="event-card-desktop-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
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

          <p className="event-card-desc" style={{ margin: 0, color: 'rgba(11, 40, 73, 0.7)', fontSize: '13.5px', lineHeight: '1.6' }}>
            {desc}
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '12px', borderTop: '1px solid rgba(11, 40, 73, 0.08)', paddingTop: '12px' }}>
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
              {isRegistered ? (isArabic ? '✓ مسجل' : '✓ Registered') : (isArabic ? 'سجل الآن' : 'Register Now')}
            </Button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
