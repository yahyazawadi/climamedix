import { useState, useRef, useEffect } from 'preact/hooks';
import './CustomSelect.css';

export function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = '',
  dir = 'rtl',
  id,
  className = '',
  maxHeight = '230px'
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : (placeholder || (options[0]?.label || ''));

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [open]);

  return (
    <div className={`custom-select-root ${className}`} ref={containerRef} dir={dir}>
      {/* Hidden native select to maintain form accessibility and test compatibility */}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        className="custom-select-native-hidden"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* Visible Trigger with strict width and height */}
      <button
        type="button"
        className={`custom-select-trigger ${open ? 'is-open' : ''}`}
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
      >
        <span className="custom-select-value-text">{displayLabel}</span>
        <span className={`custom-select-chevron ${open ? 'is-open' : ''}`}>▼</span>
      </button>

      {/* Dropdown Menu with STRICT width and height constraints */}
      {open && (
        <div className="custom-select-dropdown-menu" style={{ maxHeight }}>
          {options.map(opt => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                className={`custom-select-option-item ${isSelected ? 'is-selected' : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <span className="custom-select-option-text">{opt.label}</span>
                {isSelected && <span className="custom-select-check-icon">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
