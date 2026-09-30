// Pure SVG Arab World Map — replaces Mapbox on the home page.
// No WebGL GPU context, no 600 KB Mapbox JS, no map tile fetches.
// RAM cost: ~3–5 MB (browser SVG rasteriser) vs ~50 MB (Mapbox WebGL).

// Equirectangular projection helper
// Viewport: 900 x 500, centred on Arab world (lng 10–60, lat 10–38)
const LNG_MIN = -10, LNG_MAX = 62, LAT_MIN = 8, LAT_MAX = 40;
const W = 900, H = 500;

function project(lng, lat) {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * W;
  const y = H - ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * H;
  return [x, y];
}

const CITIES = [
  { id: 'cairo',    name_ar: 'القاهرة',   name_en: 'Cairo',     lat: 30.0444, lng: 31.2357 },
  { id: 'riyadh',   name_ar: 'الرياض',    name_en: 'Riyadh',    lat: 24.7136, lng: 46.6753 },
  { id: 'baghdad',  name_ar: 'بغداد',     name_en: 'Baghdad',   lat: 33.3152, lng: 44.3661 },
  { id: 'amman',    name_ar: 'عمان',      name_en: 'Amman',     lat: 31.9522, lng: 35.9331 },
  { id: 'beirut',   name_ar: 'بيروت',     name_en: 'Beirut',    lat: 33.8938, lng: 35.5018 },
  { id: 'damascus', name_ar: 'دمشق',      name_en: 'Damascus',  lat: 33.5138, lng: 36.2765 },
  { id: 'tunis',    name_ar: 'تونس',      name_en: 'Tunis',     lat: 36.8065, lng: 10.1815 },
  { id: 'algiers',  name_ar: 'الجزائر',   name_en: 'Algiers',   lat: 36.7538, lng: 3.0588  },
  { id: 'rabat',    name_ar: 'الرباط',    name_en: 'Rabat',     lat: 34.0209, lng: -6.8416 },
  { id: 'sanaa',    name_ar: 'صنعاء',     name_en: 'Sanaa',     lat: 15.3694, lng: 44.1910 },
  { id: 'muscat',   name_ar: 'مسقط',      name_en: 'Muscat',    lat: 23.5859, lng: 58.4059 },
  { id: 'doha',     name_ar: 'الدوحة',    name_en: 'Doha',      lat: 25.2854, lng: 51.5310 },
  { id: 'kuwait',   name_ar: 'الكويت',    name_en: 'Kuwait',    lat: 29.3759, lng: 47.9774 },
  { id: 'tripoli',  name_ar: 'طرابلس',    name_en: 'Tripoli',   lat: 32.8872, lng: 13.1913 },
  { id: 'khartoum', name_ar: 'الخرطوم',   name_en: 'Khartoum',  lat: 15.5007, lng: 32.5599 },
];

// Pre-project all cities
const PROJECTED = CITIES.map(c => ({ ...c, pos: project(c.lng, c.lat) }));

// Connection lines between nearby cities (< 1500 km)
function dist(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lng - a.lng) * Math.PI / 180;
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

const LINES = [];
for (let i = 0; i < CITIES.length; i++) {
  for (let j = i + 1; j < CITIES.length; j++) {
    const isCairoTripoli =
      (CITIES[i].id === 'cairo' && CITIES[j].id === 'tripoli') ||
      (CITIES[i].id === 'tripoli' && CITIES[j].id === 'cairo');
    if (dist(CITIES[i], CITIES[j]) < 1500 || isCairoTripoli) {
      LINES.push([PROJECTED[i], PROJECTED[j]]);
    }
  }
}

// Simplified country outlines as SVG paths (equirectangular projected onto the viewport above).
// These are approximated polygons — enough to give context without a full GeoJSON renderer.
const COUNTRY_PATHS = [
  // Egypt
  'M 562,75 L 575,78 L 580,98 L 578,130 L 560,145 L 545,148 L 530,140 L 528,120 L 535,95 Z',
  // Libya
  'M 453,75 L 560,75 L 545,148 L 500,155 L 460,150 L 440,130 L 438,105 Z',
  // Tunisia
  'M 385,55 L 413,52 L 420,70 L 418,100 L 400,108 L 383,100 L 378,80 Z',
  // Algeria
  'M 290,45 L 385,45 L 385,55 L 383,100 L 400,108 L 418,100 L 420,130 L 370,165 L 310,170 L 278,145 L 270,110 L 275,80 Z',
  // Morocco (+ Western Sahara rough)
  'M 218,50 L 288,45 L 275,80 L 270,110 L 250,135 L 228,175 L 210,178 L 198,160 L 195,130 L 205,95 L 200,65 Z',
  // Sudan
  'M 535,150 L 578,150 L 590,190 L 585,235 L 560,250 L 530,250 L 518,220 L 520,180 Z',
  // Saudi Arabia
  'M 598,120 L 660,115 L 700,140 L 710,175 L 690,215 L 640,230 L 590,225 L 575,195 L 580,155 Z',
  // Yemen
  'M 590,225 L 640,230 L 690,215 L 720,230 L 700,260 L 640,265 L 600,255 Z',
  // Oman
  'M 710,175 L 740,155 L 770,175 L 760,215 L 720,230 L 690,215 Z',
  // UAE + Qatar + Bahrain (combined simplified)
  'M 710,155 L 740,150 L 745,165 L 730,175 L 710,175 Z',
  // Kuwait
  'M 660,115 L 678,108 L 685,122 L 668,128 Z',
  // Iraq
  'M 598,80 L 640,72 L 660,90 L 660,115 L 638,128 L 610,130 L 598,120 Z',
  // Syria
  'M 548,68 L 598,60 L 600,82 L 598,80 L 598,98 L 568,105 L 548,98 Z',
  // Lebanon + Israel/Palestine + Jordan (combined small)
  'M 540,85 L 548,80 L 558,88 L 555,115 L 540,118 L 532,108 Z',
];

export function ArabWorldMapSVG({ lang = 'ar' }) {
  return (
    <div
      className="arab-world-map-svg-container"
      style={{
        width: '100%',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(11, 40, 73, 0.08)',
        background: '#014C6D',
        position: 'relative',
      }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', display: 'block' }}
        aria-label={lang === 'ar' ? 'خريطة العالم العربي' : 'Arab World Map'}
        role="img"
      >
        <defs>
          {/* Ocean / background */}
          <radialGradient id="oceanGrad" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#01608A" />
            <stop offset="100%" stopColor="#014C6D" />
          </radialGradient>

          {/* Pulse animation per city (staggered) */}
          {CITIES.map((c, i) => (
            <radialGradient key={`rg-${c.id}`} id={`glow-${c.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4dff82" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#4dff82" stopOpacity="0" />
            </radialGradient>
          ))}

          <filter id="blur2">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        {/* Ocean background */}
        <rect width={W} height={H} fill="url(#oceanGrad)" />

        {/* Country fills */}
        {COUNTRY_PATHS.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="#2FAD78"
            stroke="#014C6D"
            strokeWidth="1.5"
            opacity="0.85"
          />
        ))}

        {/* Connection lines */}
        {LINES.map(([a, b], i) => (
          <line
            key={i}
            x1={a.pos[0]} y1={a.pos[1]}
            x2={b.pos[0]} y2={b.pos[1]}
            stroke="#EEF6FC"
            strokeWidth="0.6"
            strokeOpacity="0.25"
          />
        ))}

        {/* City markers */}
        {PROJECTED.map((city, i) => {
          const [cx, cy] = city.pos;
          const delay = (i * 0.4) % 3;
          return (
            <g key={city.id}>
              {/* Pulse ring */}
              <circle
                cx={cx} cy={cy}
                r="10"
                fill="none"
                stroke="#4dff82"
                strokeWidth="1.5"
                opacity="0"
              >
                <animate
                  attributeName="r" from="4" to="18"
                  dur="2.5s" begin={`${delay}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity" from="0.7" to="0"
                  dur="2.5s" begin={`${delay}s`}
                  repeatCount="indefinite"
                />
              </circle>
              {/* Core dot */}
              <circle cx={cx} cy={cy} r="4" fill="#4dff82" />
              {/* City label */}
              <text
                x={cx + 7} y={cy + 4}
                fontSize="10"
                fill="#EEF6FC"
                fontFamily="Tajawal, Arial, sans-serif"
                fontWeight="600"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {lang === 'ar' ? city.name_ar : city.name_en}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Inline keyframes for pulse */}
      <style>{`
        .arab-world-map-svg-container svg circle {
          will-change: auto;
        }
      `}</style>
    </div>
  );
}
