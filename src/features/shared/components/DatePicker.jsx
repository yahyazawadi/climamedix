import { useState, useEffect, useRef } from 'preact/hooks';
import './DatePicker.css';

const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_AR  = ['ن','ث','ر','خ','ج','س','ح'];
const DAYS_EN  = ['Mo','Tu','We','Th','Fr','Sa','Su'];

function parseDate(val) {
  if (!val) return null;
  const d = new Date(val + 'T00:00:00');
  return isNaN(d) ? null : d;
}

function toISODate(d) {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// Monday-first: returns 0 for Mon … 6 for Sun
function startDayOfMonth(year, month) {
  const day = new Date(year, month, 1).getDay(); // 0=Sun
  return (day === 0) ? 6 : day - 1;
}

export function DatePicker({ value, onChange, lang = 'ar', required = false, id }) {
  const isAr = lang === 'ar';
  const MONTHS = isAr ? MONTHS_AR : MONTHS_EN;
  const DAYS   = isAr ? DAYS_AR   : DAYS_EN;

  const today = new Date();
  const selected = parseDate(value);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear]   = useState(selected ? selected.getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected ? selected.getMonth()    : today.getMonth());
  const [yearPicker, setYearPicker] = useState(false);

  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setYearPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectDay = (day) => {
    const d = new Date(viewYear, viewMonth, day);
    onChange(toISODate(d));
    setOpen(false);
    setYearPicker(false);
  };

  const selectYear = (yr) => {
    setViewYear(yr);
    setYearPicker(false);
  };

  // Build calendar grid
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const startDay    = startDayOfMonth(viewYear, viewMonth);
  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isSelected = (d) => d && selected &&
    selected.getDate() === d &&
    selected.getMonth() === viewMonth &&
    selected.getFullYear() === viewYear;

  const isToday = (d) => d &&
    today.getDate() === d &&
    today.getMonth() === viewMonth &&
    today.getFullYear() === viewYear;

  // Year range: 1940 → current year
  const yearRange = [];
  for (let y = today.getFullYear(); y >= 1940; y--) yearRange.push(y);

  const displayValue = selected
    ? `${String(selected.getDate()).padStart(2,'0')} / ${String(selected.getMonth()+1).padStart(2,'0')} / ${selected.getFullYear()}`
    : '';

  return (
    <div className="dp-root" ref={containerRef} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Trigger input */}
      <button
        type="button"
        id={id}
        className={`dp-trigger ${open ? 'dp-trigger--open' : ''}`}
        onClick={() => { setOpen(o => !o); setYearPicker(false); }}
      >
        <svg className="dp-cal-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span className={displayValue ? 'dp-trigger-value' : 'dp-trigger-placeholder'}>
          {displayValue || (isAr ? 'اختر تاريخ الميلاد' : 'Select birth date')}
        </span>
        <svg className={`dp-chevron ${open ? 'dp-chevron--up' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="dp-panel">
          
          {yearPicker ? (
            /* Year selector grid */
            <div className="dp-year-grid">
              {yearRange.map(yr => (
                <button
                  key={yr}
                  type="button"
                  className={`dp-year-cell ${yr === viewYear ? 'dp-year-cell--active' : ''}`}
                  onClick={() => selectYear(yr)}
                >
                  {yr}
                </button>
              ))}
            </div>
          ) : (
            <>
              {/* Header: nav + month/year — always LTR so arrows are positionally correct */}
              <div className="dp-header" style={{ direction: 'ltr' }}>
                <button type="button" className="dp-nav-btn" onClick={prevMonth}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>

                <button
                  type="button"
                  className="dp-month-year-btn"
                  onClick={() => setYearPicker(true)}
                  style={{ direction: isAr ? 'rtl' : 'ltr' }}
                >
                  {MONTHS[viewMonth]} {viewYear}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style={{ marginInlineStart: '4px' }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                <button type="button" className="dp-nav-btn" onClick={nextMonth}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>

              {/* Day labels */}
              <div className="dp-day-labels">
                {DAYS.map(d => <span key={d} className="dp-day-label">{d}</span>)}
              </div>

              {/* Calendar grid */}
              <div className="dp-grid">
                {cells.map((day, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={!day}
                    onClick={() => day && selectDay(day)}
                    className={[
                      'dp-day',
                      !day       ? 'dp-day--empty'    : '',
                      isToday(day)    ? 'dp-day--today'    : '',
                      isSelected(day) ? 'dp-day--selected' : '',
                    ].join(' ').trim()}
                  >
                    {day || ''}
                  </button>
                ))}
              </div>

              {/* Footer: today shortcut + clear */}
              <div className="dp-footer">
                <button type="button" className="dp-footer-btn" onClick={() => {
                  setViewYear(today.getFullYear());
                  setViewMonth(today.getMonth());
                }}>
                  {isAr ? 'الشهر الحالي' : 'Today'}
                </button>
                {value && (
                  <button type="button" className="dp-footer-btn dp-footer-btn--clear" onClick={() => { onChange(''); setOpen(false); }}>
                    {isAr ? 'مسح' : 'Clear'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
