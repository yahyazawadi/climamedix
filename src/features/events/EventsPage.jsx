import { useState, useEffect } from 'preact/hooks';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../auth/hooks/useAuth';
import { Button } from '../shared/components/Button';
import { translations } from '../../i18n/translations';
import { EventsCalendar } from './components/EventsCalendar';

export function EventsPage({ lang, onNavigate }) {
  const t = translations[lang] || translations.ar;
  const isArabic = lang === 'ar';
  
  const { hasPermission } = useAuth();
  const canManageEvents = hasPermission('write:events') || hasPermission('manage:any_event');

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registeredEvents, setRegisteredEvents] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title_ar: '',
    title_en: '',
    description_ar: '',
    description_en: '',
    event_date: '',
    time: '',
    type: '',
    registration_link: ''
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    fetchEvents();
  }, [lang]);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });
      
    if (data && !error) {
      const mapped = data.map(db => ({
        id: db.id,
        title: isArabic ? db.title_ar : (db.title_en || db.title_ar),
        date: db.event_date ? db.event_date.split('T')[0] : '', 
        time: db.time,
        type: db.type,
        desc: isArabic ? db.description_ar : (db.description_en || db.description_ar),
        link: db.registration_link
      }));
      setEvents(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleRegisterCalendarEvent = (eventId) => {
    setRegisteredEvents(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    const dateObj = new Date(formData.event_date);
    const isoDate = dateObj.toISOString();

    const { error } = await supabase.from('events').insert([{
      title_ar: formData.title_ar,
      title_en: formData.title_en,
      description_ar: formData.description_ar,
      description_en: formData.description_en,
      event_date: isoDate,
      time: formData.time,
      type: formData.type,
      registration_link: formData.registration_link
    }]);

    setSubmitting(false);
    if (!error) {
      setIsModalOpen(false);
      setFormData({
        title_ar: '', title_en: '', description_ar: '', description_en: '',
        event_date: '', time: '', type: '', registration_link: ''
      });
      fetchEvents();
    } else {
      alert("Error saving event: " + error.message);
    }
  };
  
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      {/* 1. Header Banner Block */}
      <div 
        className="opportunities-banner"
        style={{
          background: 'linear-gradient(90deg, #15b47a 0%, #12a978 5%, #0c8774 23%, #066d71 41%, #025a6e 60%, #004f6d 79%, #004c6d 100%)',
          padding: '160px 20px 60px 20px',
          textAlign: 'center',
          position: 'relative',
          boxShadow: '0 4px 20px rgba(11, 40, 73, 0.1)',
          direction: isArabic ? 'rtl' : 'ltr'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ 
            fontSize: 'clamp(28px, 4vw, 40px)', 
            fontWeight: 'bold', 
            color: '#ffffff', 
            marginBottom: '16px',
            fontFamily: isArabic ? 'Tajawal, sans-serif' : 'Outfit, sans-serif',
            textShadow: '0 2px 4px rgba(0,0,0,0.15)'
          }}>
            {isArabic ? 'تقويم الفعاليات والندوات' : 'Events Calendar'}
          </h1>
          <p style={{ 
            fontSize: 'clamp(14px, 1.8vw, 16px)', 
            color: 'rgba(255, 255, 255, 0.9)', 
            maxWidth: '700px', 
            margin: '0 auto',
            lineHeight: '1.6',
            fontFamily: isArabic ? 'Tajawal, sans-serif' : 'Outfit, sans-serif'
          }}>
            {isArabic ? 'تقويم تفاعلي يعرض الفعاليات والندوات الطبية البيئية' : 'Interactive calendar for environmental medical events'}
          </p>
        </div>
      </div>

      {/* 2. Content Block */}
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
          textAlign: isArabic ? 'right' : 'left', 
          direction: isArabic ? 'rtl' : 'ltr' 
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 10px 30px rgba(11, 40, 73, 0.06)',
            border: '1px solid rgba(11, 40, 73, 0.08)',
            padding: '40px 35px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '5px',
              background: 'linear-gradient(90deg, #15b47a, #004c6d)'
            }}></div>
            
            {canManageEvents && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                <Button variant="gradient" onClick={() => setIsModalOpen(true)}>
                  {isArabic ? '+ إضافة فعالية جديدة' : '+ Add New Event'}
                </Button>
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#0b2849' }}>
                {isArabic ? 'جاري تحميل الفعاليات...' : 'Loading events...'}
              </div>
            ) : (
              <EventsCalendar 
                events={events} 
                onRegisterEvent={handleRegisterCalendarEvent} 
                registeredEvents={registeredEvents} 
                isArabic={isArabic}
              />
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(5, 12, 26, 0.5)', backdropFilter: 'blur(5px)', padding: '20px'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto',
            padding: '30px', position: 'relative', direction: isArabic ? 'rtl' : 'ltr'
          }}>
            <button onClick={() => setIsModalOpen(false)} style={{
              position: 'absolute', top: '20px', [isArabic ? 'left' : 'right']: '20px',
              background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#0b2849'
            }}>&times;</button>
            <h3 style={{ color: '#0b2849', fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
              {isArabic ? 'إضافة فعالية جديدة' : 'Add New Event'}
            </h3>
            
            <form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#0b2849', display: 'block', marginBottom: '8px' }}>
                  {isArabic ? 'العنوان (بالعربية)' : 'Title (Arabic)'}
                </label>
                <input required type="text" value={formData.title_ar} onChange={e => setFormData({...formData, title_ar: e.target.value})} 
                  style={{ width: '100%', padding: '10px 15px', borderRadius: '10px', border: '1px solid rgba(11,40,73,0.15)', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#0b2849', display: 'block', marginBottom: '8px' }}>
                  {isArabic ? 'العنوان (بالإنجليزية)' : 'Title (English)'}
                </label>
                <input type="text" value={formData.title_en} onChange={e => setFormData({...formData, title_en: e.target.value})} 
                  style={{ width: '100%', padding: '10px 15px', borderRadius: '10px', border: '1px solid rgba(11,40,73,0.15)', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#0b2849', display: 'block', marginBottom: '8px' }}>
                    {isArabic ? 'التاريخ' : 'Date'}
                  </label>
                  <input required type="date" value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})} 
                    style={{ width: '100%', padding: '10px 15px', borderRadius: '10px', border: '1px solid rgba(11,40,73,0.15)', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#0b2849', display: 'block', marginBottom: '8px' }}>
                    {isArabic ? 'الوقت' : 'Time'}
                  </label>
                  <input required type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} 
                    style={{ width: '100%', padding: '10px 15px', borderRadius: '10px', border: '1px solid rgba(11,40,73,0.15)', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#0b2849', display: 'block', marginBottom: '8px' }}>
                    {isArabic ? 'النوع (ورشة، مؤتمر..)' : 'Type'}
                  </label>
                  <input required type="text" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} 
                    style={{ width: '100%', padding: '10px 15px', borderRadius: '10px', border: '1px solid rgba(11,40,73,0.15)', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#0b2849', display: 'block', marginBottom: '8px' }}>
                    {isArabic ? 'رابط التسجيل' : 'Registration Link'}
                  </label>
                  <input type="url" value={formData.registration_link} onChange={e => setFormData({...formData, registration_link: e.target.value})} 
                    style={{ width: '100%', padding: '10px 15px', borderRadius: '10px', border: '1px solid rgba(11,40,73,0.15)', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#0b2849', display: 'block', marginBottom: '8px' }}>
                  {isArabic ? 'التفاصيل (بالعربية)' : 'Description (Arabic)'}
                </label>
                <textarea rows="3" value={formData.description_ar} onChange={e => setFormData({...formData, description_ar: e.target.value})} 
                  style={{ width: '100%', padding: '10px 15px', borderRadius: '10px', border: '1px solid rgba(11,40,73,0.15)', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#0b2849', display: 'block', marginBottom: '8px' }}>
                  {isArabic ? 'التفاصيل (بالإنجليزية)' : 'Description (English)'}
                </label>
                <textarea rows="3" value={formData.description_en} onChange={e => setFormData({...formData, description_en: e.target.value})} 
                  style={{ width: '100%', padding: '10px 15px', borderRadius: '10px', border: '1px solid rgba(11,40,73,0.15)', boxSizing: 'border-box' }} />
              </div>
              
              <div style={{ marginTop: '10px' }}>
                <Button variant="gradient" type="submit" disabled={submitting} style={{ width: '100%' }}>
                  {submitting ? (isArabic ? 'جاري الحفظ...' : 'Saving...') : (isArabic ? 'حفظ الفعالية' : 'Save Event')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
