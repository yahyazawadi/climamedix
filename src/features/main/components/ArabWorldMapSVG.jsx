/**
 * ArabWorldMapStatic — lightweight static map for the home page.
 *
 * Strategy:
 *  • Background: pre-rendered WebP screenshots of the styled Mapbox base map
 *    (no WebGL GPU context needed — just an <img> tag)
 *  • Foreground: SVG overlay with city dots, connection lines, and CSS pulse
 *    animations, positioned via Mapbox mercator projection math
 *
 * RAM cost: ~3 MB (image decode + layout) vs ~50 MB (Mapbox WebGL context)
 */

// ─── Projection helpers ────────────────────────────────────────────────────────
// Mapbox GL uses Web Mercator (EPSG:3857). For a given center + zoom + tile-size
// we can project lng/lat → fractional tile → pixel.
const TILE_SIZE = 512; // Mapbox GL default

function lngLatToWorld(lng, lat) {
  // Convert to Web Mercator normalised world coordinates [0..1]
  const x = (lng + 180) / 360;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y = 0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI);
  return [x, y];
}

function worldToPixel(worldX, worldY, centerLng, centerLat, zoom, viewW, viewH) {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const [cx, cy] = lngLatToWorld(centerLng, centerLat);
  const px = (worldX - cx) * scale + viewW / 2;
  const py = (worldY - cy) * scale + viewH / 2;
  return [px, py];
}

function project(lng, lat, centerLng, centerLat, zoom, viewW, viewH) {
  const [wx, wy] = lngLatToWorld(lng, lat);
  return worldToPixel(wx, wy, centerLng, centerLat, zoom, viewW, viewH);
}

// ─── Map configs (must match the screenshots) ──────────────────────────────────
const DESKTOP = { centerLng: 22.5, centerLat: 26.0, zoom: 3.8, w: 1440, h: 700 };
const MOBILE  = { centerLng: 21.5, centerLat: 23.0, zoom: 1.85, w: 390,  h: 240 };

// ─── Cities ────────────────────────────────────────────────────────────────────
const CITIES = [
  { id: 'cairo',    ar: 'القاهرة',  en: 'Cairo',     lat: 30.0444, lng: 31.2357 },
  { id: 'riyadh',   ar: 'الرياض',   en: 'Riyadh',    lat: 24.7136, lng: 46.6753 },
  { id: 'baghdad',  ar: 'بغداد',    en: 'Baghdad',   lat: 33.3152, lng: 44.3661 },
  { id: 'amman',    ar: 'عمان',     en: 'Amman',     lat: 31.9522, lng: 35.9331 },
  { id: 'beirut',   ar: 'بيروت',   en: 'Beirut',    lat: 33.8938, lng: 35.5018 },
  { id: 'damascus', ar: 'دمشق',     en: 'Damascus',  lat: 33.5138, lng: 36.2765 },
  { id: 'tunis',    ar: 'تونس',     en: 'Tunis',     lat: 36.8065, lng: 10.1815 },
  { id: 'algiers',  ar: 'الجزائر',  en: 'Algiers',   lat: 36.7538, lng: 3.0588  },
  { id: 'rabat',    ar: 'الرباط',   en: 'Rabat',     lat: 34.0209, lng: -6.8416 },
  { id: 'sanaa',    ar: 'صنعاء',    en: 'Sanaa',     lat: 15.3694, lng: 44.1910 },
  { id: 'muscat',   ar: 'مسقط',     en: 'Muscat',    lat: 23.5859, lng: 58.4059 },
  { id: 'doha',     ar: 'الدوحة',   en: 'Doha',      lat: 25.2854, lng: 51.5310 },
  { id: 'kuwait',   ar: 'الكويت',   en: 'Kuwait',    lat: 29.3759, lng: 47.9774 },
  { id: 'tripoli',  ar: 'طرابلس',   en: 'Tripoli',   lat: 32.8872, lng: 13.1913 },
  { id: 'khartoum', ar: 'الخرطوم',  en: 'Khartoum',  lat: 15.5007, lng: 32.5599 },
];

// Distance between two cities in km
function dist(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lng - a.lng) * Math.PI / 180;
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

// Pairs of city indices that are connected
const CONNECTIONS = [];
for (let i = 0; i < CITIES.length; i++) {
  for (let j = i + 1; j < CITIES.length; j++) {
    const isCairoTripoli =
      (CITIES[i].id === 'cairo' && CITIES[j].id === 'tripoli') ||
      (CITIES[i].id === 'tripoli' && CITIES[j].id === 'cairo');
    if (dist(CITIES[i], CITIES[j]) < 1500 || isCairoTripoli) {
      CONNECTIONS.push([i, j]);
    }
  }
}

// ─── SVG overlay builder ───────────────────────────────────────────────────────
function MapOverlay({ cfg, lang, id }) {
  const { centerLng, centerLat, zoom, w, h } = cfg;

  const pts = CITIES.map(c => ({
    ...c,
    pos: project(c.lng, c.lat, centerLng, centerLat, zoom, w, h),
  }));

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      <defs>
        {/* Glow filter matching original 0 0 12px rgba(77, 255, 130, 0.8) */}
        <filter id={`cityGlow-${id}`} x="-100%" y="-100%" width="300%" height="300%">
          <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#4dff82" floodOpacity="0.8" />
        </filter>

        <style>{`
          @keyframes dashMove {
            to {
              stroke-dashoffset: -44;
            }
          }
          @keyframes originalRingPulse {
            0% {
              r: 5px;
              opacity: 0.8;
            }
            100% {
              r: 18px;
              opacity: 0;
            }
          }
          .network-traveling-line {
            stroke: #4dff82;
            stroke-width: 1.5;
            stroke-opacity: 0.45;
            stroke-dasharray: 12 10;
            animation: dashMove 3.2s linear infinite;
          }
        `}</style>
      </defs>

      {/* Connection lines with traveling dashes */}
      {CONNECTIONS.map(([i, j], k) => {
        const a = pts[i].pos;
        const b = pts[j].pos;
        return (
          <line
            key={k}
            className="network-traveling-line"
            x1={a[0]}
            y1={a[1]}
            x2={b[0]}
            y2={b[1]}
          />
        );
      })}

      {/* City markers - solid glowing dots and pulsing rings */}
      {pts.map((city, i) => {
        const [cx, cy] = city.pos;
        const delay = `${(i * 0.25) % 2.0}s`;

        return (
          <g key={city.id}>
            {/* Outer expanding pulsing ring */}
            <circle
              cx={cx}
              cy={cy}
              r="6"
              fill="none"
              stroke="#4dff82"
              strokeWidth="1.5"
            >
              <animate
                attributeName="r"
                from="6"
                to="20"
                dur="2s"
                begin={delay}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                from="0.7"
                to="0"
                dur="2s"
                begin={delay}
                repeatCount="indefinite"
              />
            </circle>

            {/* Glowing solid white core */}
            <circle
              cx={cx}
              cy={cy}
              r="5.5"
              fill="#FFFFFF"
              stroke="#2FAD78"
              strokeWidth="2"
              filter={`url(#cityGlow-${id})`}
            />
          </g>
        );
      })}
    </svg>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────
import desktopWebP from '../../../assets/arab_world_map_desktop.webp';
import mobileWebP  from '../../../assets/arab_world_map_mobile.webp';

export function ArabWorldMapSVG({ lang = 'ar' }) {
  return (
    <div
      style={{
        width: '100%',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(11, 40, 73, 0.08)',
        position: 'relative',
        lineHeight: 0,
      }}
    >
      {/* Base map image — responsive: desktop by default, mobile via CSS */}
      <picture>
        <source media="(max-width: 768px)" srcSet={mobileWebP} />
        <img
          src={desktopWebP}
          alt={lang === 'ar' ? 'خريطة شبكة كلايما ميدكس الإقليمية' : 'ClimaMedix Regional Network Map'}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          loading="lazy"
          decoding="async"
        />
      </picture>

      {/* SVG city marker overlay — desktop */}
      <span style={{ display: 'block' }} className="arab-map-overlay-desktop">
        <MapOverlay cfg={DESKTOP} lang={lang} id="desktop" />
      </span>

      {/* SVG city marker overlay — mobile */}
      <span style={{ display: 'none' }} className="arab-map-overlay-mobile">
        <MapOverlay cfg={MOBILE} lang={lang} id="mobile" />
      </span>

      <style>{`
        @media (max-width: 768px) {
          .arab-map-overlay-desktop { display: none !important; }
          .arab-map-overlay-mobile  { display: block !important; position: absolute; inset: 0; }
        }
        .arab-map-overlay-desktop {
          position: absolute;
          inset: 0;
        }
      `}</style>
    </div>
  );
}
