import { useState, useLayoutEffect, useRef } from 'preact/hooks';
import gsap from 'gsap';
import { EventCard } from './EventCard';

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];
const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK_AR = ['أحد', 'إثن', 'ثلاث', 'أربع', 'خميس', 'جمع', 'سبت'];
const DAYS_OF_WEEK_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function EventsCalendar({ events = [], onRegisterEvent, registeredEvents = {}, isArabic = true }) {
  const MONTHS = isArabic ? ARABIC_MONTHS : ENGLISH_MONTHS;
  const DAYS_OF_WEEK = isArabic ? DAYS_OF_WEEK_AR : DAYS_OF_WEEK_EN;
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [currentMonth, setCurrentMonth] = useState(6); // Default: July 2026 (6)
  const [currentYear, setCurrentYear] = useState(2026);
  const [selectedDate, setSelectedDate] = useState(null);

  const containerRef = useRef(null);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      gsap.fromTo('.event-card', 
        { opacity: 0, y: 15 }, 
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [viewMode, currentMonth, selectedDate]);

  // Calendar math
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
    setSelectedDate(null);
  };

  // Generate days array
  const calendarCells = [];
  // Add empty slots for the first day offset
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push({ day: null, dateStr: null, hasEvent: false, events: [] });
  }
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const formattedDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = events.filter(e => e.date === formattedDateStr);
    calendarCells.push({
      day,
      dateStr: formattedDateStr,
      hasEvent: dayEvents.length > 0,
      events: dayEvents
    });
  }

  // Selected date events
  const activeEvents = selectedDate 
    ? events.filter(e => e.date === selectedDate)
    : [];

  return (
    <div ref={containerRef} className="events-calendar-component" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* View Switcher Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px', flexWrap: 'wrap', gap: '15px' }}>
        <h3 style={{ color: '#0b2849', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
          {isArabic ? 'الندوات والفعاليات البيئية' : 'Environmental Events & Seminars'}
        </h3>
        
        <div style={{ display: 'flex', background: 'rgba(0, 76, 109, 0.08)', borderRadius: '12px', padding: '4px', border: '1px solid rgba(11, 40, 73, 0.1)' }}>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              background: viewMode === 'list' ? '#004c6d' : 'transparent',
              color: viewMode === 'list' ? '#ffffff' : '#0b2849',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '13.5px',
              transition: 'all 0.25s'
            }}
          >
            {isArabic ? 'عرض القائمة' : 'List View'}
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              background: viewMode === 'calendar' ? '#004c6d' : 'transparent',
              color: viewMode === 'calendar' ? '#ffffff' : '#0b2849',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '13.5px',
              transition: 'all 0.25s'
            }}
          >
            {isArabic ? 'عرض التقويم' : 'Calendar View'}
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        /* ================== LIST VIEW ================== */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {events.map((e, idx) => (
            <EventCard
              key={e.id}
              {...e}
              onRegister={() => onRegisterEvent(e.id)}
              isRegistered={!!registeredEvents[e.id]}
              isArabic={isArabic}
            />
          ))}
        </div>
      ) : (
        /* ================== CALENDAR VIEW ================== */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', alignItems: 'start' }}>
          
          {/* Month Grid Card */}
          <div style={{ background: 'rgba(255, 255, 255, 0.45)', backdropFilter: 'blur(20px)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.4)', padding: '24px', boxShadow: '0 12px 30px rgba(0, 76, 109, 0.05)' }}>
            
            {/* Header Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', direction: 'ltr' }}>
              <button onClick={handlePrevMonth} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#004c6d', fontWeight: 'bold' }}>&lt;</button>
              <strong style={{ color: '#0b2849', fontSize: '16px' }}>{MONTHS[currentMonth]} {currentYear}</strong>
              <button onClick={handleNextMonth} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#004c6d', fontWeight: 'bold' }}>&gt;</button>
            </div>

            {/* Days of Week Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', fontWeight: 'bold', color: '#0b2849', opacity: 0.6, fontSize: '12px', marginBottom: '10px' }}>
              {DAYS_OF_WEEK.map(d => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* Calendar Cells Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
              {calendarCells.map((cell, idx) => {
                const isSelected = selectedDate === cell.dateStr;
                return (
                  <div
                    key={idx}
                    onClick={() => cell.day && cell.hasEvent && setSelectedDate(cell.dateStr)}
                    style={{
                      aspectRatio: '1',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: cell.day ? 'bold' : 'normal',
                      cursor: cell.hasEvent ? 'pointer' : 'default',
                      background: !cell.day
                        ? '#0b2849' 
                        : isSelected 
                        ? '#004c6d' 
                        : cell.hasEvent 
                          ? 'rgba(21, 180, 122, 0.15)' 
                          : 'transparent',
                      color: isSelected 
                        ? '#ffffff' 
                        : cell.hasEvent 
                          ? '#15b47a' 
                          : cell.day 
                            ? '#0b2849' 
                            : 'transparent',
                      border: cell.hasEvent && !isSelected ? '1px solid rgba(21, 180, 122, 0.4)' : 'none',
                      position: 'relative',
                      transition: 'all 0.2s'
                    }}
                  >
                    {cell.day}
                    
                    {/* Tiny Indicator Dot */}
                    {cell.hasEvent && !isSelected && (
                      <span style={{
                        position: 'absolute',
                        bottom: '4px',
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: '#15b47a'
                      }}></span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Day Events List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {selectedDate ? (
              activeEvents.length > 0 ? (
                activeEvents.map(e => (
                  <EventCard
                    key={e.id}
                    {...e}
                    onRegister={() => onRegisterEvent(e.id)}
                    isRegistered={!!registeredEvents[e.id]}
                    isArabic={isArabic}
                  />
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(11, 40, 73, 0.5)', background: 'rgba(255,255,255,0.4)', borderRadius: '20px', border: '1px dashed rgba(11,40,73,0.2)' }}>
                  {isArabic ? 'لا توجد فعاليات في هذا اليوم.' : 'No events on this day.'}
                </div>
              )
            ) : (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: 'rgba(11, 40, 73, 0.5)', background: 'rgba(255,255,255,0.4)', borderRadius: '20px', border: '1px dashed rgba(11,40,73,0.2)' }}>
                <h4 style={{ margin: '0 0 5px 0', color: '#0b2849', fontSize: '15px' }}>
                  {isArabic ? 'تصفح فعاليات التقويم' : 'Browse Calendar Events'}
                </h4>
                <p style={{ margin: 0, fontSize: '13px' }}>
                  {isArabic ? 'انقر على الأيام الملونة بالأخضر لعرض تفاصيل الفعاليات.' : 'Click on the green highlighted days to view event details.'}
                </p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
