import { useState, useEffect } from 'preact/hooks';
import { supabase } from '../../../utils/supabaseClient';
import { EventsCalendar } from './EventsCalendar';
import { Button } from '../../shared/components/Button';
import { translations } from '../../../i18n/translations';

export function CalendarSidebarWidget({ lang = 'ar', onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [sidebarEvents, setSidebarEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const t = translations[lang] || translations.ar;
  const isArabic = lang === 'ar';

  useEffect(() => {
    const fetchRealEvents = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('event_date', { ascending: true });
          
        if (data && !error) {
          const mapped = data.map(db => ({
            id: db.id,
            title: db.title_ar || db.title_en || 'بدون عنوان',
            date: db.event_date ? db.event_date.split('T')[0] : '', 
            time: db.time,
            type: db.type_ar || db.type_en || db.type || 'فعالية',
            desc: db.description_ar || db.description_en || '',
            link: db.registration_link || '#'
          }));
          setSidebarEvents(mapped);
        }
      } catch (e) {
        console.warn('Failed to fetch events:', e);
      }
      setIsLoading(false);
    };
    
    // Only fetch when opened to save bandwidth, or fetch once on mount. 
    // Fetching on mount is fine for now.
    fetchRealEvents();
  }, []);

  return (
    <>
      {/* Floating Side Button */}
      <div 
        style={{
          position: 'fixed',
          top: '50%',
          left: 0,
          transform: 'translateY(-50%)',
          zIndex: 9999,
          background: 'linear-gradient(135deg, #0b2849, #004c6d)',
          color: '#fff',
          padding: '12px 16px',
          borderTopRightRadius: '12px',
          borderBottomRightRadius: '12px',
          cursor: 'pointer',
          boxShadow: '4px 0 15px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 'bold',
          transition: 'all 0.3s ease'
        }}
        onClick={() => setIsOpen(true)}
      >
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </span>
        <span style={{ writingMode: 'vertical-rl', padding: '10px 0', letterSpacing: '2px', transform: 'rotate(180deg)' }}>
          {isArabic ? 'الفعاليات' : 'Events'}
        </span>
      </div>

      {/* Drawer Overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 12, 26, 0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 10000,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}

      {/* Drawer Content */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: isOpen ? 0 : '-450px',
        width: '450px',
        maxWidth: '90vw',
        height: '100vh',
        background: '#f8fafc',
        zIndex: 10001,
        boxShadow: '5px 0 25px rgba(0,0,0,0.2)',
        transition: 'left 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '25px',
          background: 'linear-gradient(135deg, #15b47a, #004c6d)',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          direction: isArabic ? 'rtl' : 'ltr'
        }}>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            {isArabic ? 'تقويم الفعاليات' : 'Events Calendar'}
          </h3>
          <button 
            onClick={() => setIsOpen(false)}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '15px', flexGrow: 1, background: '#f8fafc', transform: 'scale(0.95)', transformOrigin: 'top center', direction: isArabic ? 'rtl' : 'ltr' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#0b2849' }}>
              {isArabic ? 'جاري تحميل الفعاليات...' : 'Loading events...'}
            </div>
          ) : (
            <EventsCalendar 
              events={sidebarEvents} 
              isArabic={isArabic} 
              canManageEvents={false}
            />
          )}
        </div>

        {/* Footer Link */}
        <div style={{ padding: '20px', borderTop: '1px solid rgba(0,0,0,0.05)', textAlign: 'center', background: '#fff', direction: isArabic ? 'rtl' : 'ltr' }}>
          <Button 
            variant="outline" 
            style={{ width: '100%', borderColor: '#004c6d', color: '#004c6d' }}
            onClick={() => {
              setIsOpen(false);
              if (onNavigate) {
                onNavigate('events');
              } else {
                window.history.pushState({}, '', '/events');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }
            }}
          >
            {isArabic ? 'عرض صفحة الفعاليات الكاملة' : 'View Full Events Page'}
          </Button>
        </div>
      </div>
    </>
  );
}
