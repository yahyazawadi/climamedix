import { useState, useEffect } from 'preact/hooks';
import './LoadingViewerPage.css';
import './LoadingPlanet.css';

const CONTINENTS_PATH =
  'M-12.6,116.5c-1.7-3.3,3.1-5.1,5.6-7.6c3.1-3.3,9.8-8.7,9-10.7C1.2,96-5.6,90-9.3,91.4c-0.8,0-5.1,4.8-6.1,5.6c0-1.7-0.3-2.6-0.3-4.2c0-1.1-2.2-2-2-2.8c0.2-1.9,4.8-5.4,5.9-6.8c-0.9-0.6-4-2.8-4.8-2.5c-2,1.1-4.5,1.9-6.7,2.8c0-0.8-0.2-1.6-0.3-2c4.2-2.2,8.7-3.7,13.4-4.8l4.2,1.6l3.1,3.3l3.1,2.9c0,0,1.9,0.8,2.6,0.8c0.9-0.2,3.9-4,3.9-4l-1.2-2.9l-0.2-2.6c8.4,0.8,16.1,3.3,23.1,7.6c-1.1,0.2-2.6,0.3-4,0.8c-0.6-0.3-3.9,0.3-3.7,1.7c0.2,1.1,5.9,5.7,8.4,9.8c2.5,4.2,9.5,6.8,10.7,11.5c1.2,5.4-0.8,12.4,0.2,18.9c0.9,6.4,7.9,13,7.9,13s3.1,0.9,5.6,0.3c-1.9,9.5-6.1,18.2-12.6,25.6c-7.3,8.2-16.5,14-26.9,16.5c1.2-3.7,3.7-7.3,6.1-9.3c2-1.9,4.5-5.1,5.4-7.6c0.9-2.6,2.2-4.8,3.7-7.3c1.9-3.3-5.7-7.9-8.2-8.7c-5.6-2-9.8-4.8-14.6-7.9c-3.6-2.2-14.3,2.8-18.3,1.2c-5.4-2-7.3-3.7-12.1-6.8c-5-3.3-3.6-10.2-3.9-15.4c3.7,0,8.8-1.6,11.5,1.2c0.8,0.9,3.7,4.8,5.4,3.3C-9.2,122.3-12,117.6-12.6,116.5z M-42.4,97.4c0.3,2.6,1.7,4.7,1.7,6.5c0,7.3-0.6,11.6,4,17.4c1.9,2.2,2.5,5.6,3.3,8.4c0.9,2.6,4,3.9,6.4,5.4c4.5,2.9,8.8,6.7,13.7,9.3c3.1,1.7,5,2.6,4.5,6.4c-0.6,2.9-0.6,4.8-2,7.6c-0.3,0.9,2.2,5.9,2.9,6.5c2.5,2,4.8,4,7.5,5.9c4,2.9,0,7.3-1.6,11.8c-11.8-0.8-23.1-5.4-32.3-13.4c-10.7-9.5-17.1-22.7-18-36.8C-53.3,119.5-50.2,107.5-42.4,97.4z';

export function LoadingViewerPage({ lang = 'ar' }) {
  const [size, setSize] = useState(200); // Stage diameter in px
  const [showBorder, setShowBorder] = useState(true);
  const [borderWidth, setBorderWidth] = useState(1.4);
  const [borderOpacity, setBorderOpacity] = useState(0.8);
  const [progress, setProgress] = useState(65);
  const [isDark, setIsDark] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  const ORBIT_RADIUS = 73;

  // Animated telemetry demo
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => (p >= 100 ? 15 : p + 5));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`loading-test-screen ${isDark ? 'dark-mode' : ''}`}>
      {/* ─── Exact Genuine ClimaMedix Loading Screen ─── */}
      <div className="climamedix-loader-inner">
        {/* Orbital SVG Planet with Dynamic Size */}
        <div
          className="loader-planet-stage"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            marginBottom: `${Math.max(1.2, size * 0.009)}rem`,
          }}
        >
          <svg
            className="loader-planet-svg"
            viewBox="-86 42 174 174"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <radialGradient id="cmTestOceanGrad" cx="35%" cy="35%" r="70%">
                <stop offset="0%" stopColor="#016c7f" />
                <stop offset="60%" stopColor="#004c6d" />
                <stop offset="100%" stopColor="#08294a" />
              </radialGradient>

              <linearGradient id="cmTestLandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#15b47a" />
                <stop offset="100%" stopColor="#2fad78" />
              </linearGradient>

              <clipPath id="cmTestGlobeClip">
                <circle cx="1" cy="129" r="60.6" />
              </clipPath>
            </defs>

            {/* Static Outer Track Guide */}
            <circle
              cx="1"
              cy="129"
              r={ORBIT_RADIUS}
              className="loader-orbit-track"
            />

            {/* GPU Composited Orbit Spinner Ring + Beacon */}
            <g className="loader-orbit-group">
              <circle
                cx="1"
                cy="129"
                r={ORBIT_RADIUS}
                className="loader-orbit-spinner"
              />
              <circle
                cx="1"
                cy={129 - ORBIT_RADIUS}
                r="3.5"
                className="loader-orbit-beacon"
              />
            </g>

            {/* Continuously Rotating Earth Globe */}
            <g className="loader-globe-spinner">
              {/* Globe Base Ocean Sphere */}
              <circle cx="1" cy="129" r="60.6" fill="url(#cmTestOceanGrad)" />

              {/* Enlarged Continents clipped cleanly to the sphere edge */}
              <g clipPath="url(#cmTestGlobeClip)">
                <g transform="translate(1, 129) scale(1.135) translate(-1, -129)">
                  <circle cx="1" cy="129" r="60.6" fill="url(#cmTestLandGrad)" />
                  <path d={CONTINENTS_PATH} fill="url(#cmTestOceanGrad)" />
                </g>
              </g>

              {/* Slim Elegant Planet Border */}
              {showBorder && (
                <circle
                  cx="1"
                  cy="129"
                  r="60.6"
                  fill="none"
                  stroke="#15b47a"
                  strokeWidth={borderWidth}
                  opacity={borderOpacity}
                />
              )}
            </g>
          </svg>
        </div>

        {/* Centralized Brand Box */}
        <div className="climamedix-loader-brand-box">
          <span className="climamedix-loader-dot" aria-hidden="true" />
          <h2 className="climamedix-loader-title">
            CLIMA<span className="climamedix-loader-accent">MEDIX</span>
          </h2>
        </div>

        {/* Description / Subtitle */}
        <div className="climamedix-loader-subtitle">
          {lang === 'ar'
            ? 'المبادرة الإقليمية لتغير المناخ والصحة'
            : 'Regional Climate & Health Initiative'}
        </div>

        {/* Telemetry Progress Bar */}
        <div className="climamedix-loader-track">
          <div
            className="climamedix-loader-bar"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status Ticker & Percentage */}
        <div className="climamedix-loader-meta">
          <span className="climamedix-loader-ticker">
            {lang === 'ar' ? 'تحميل ومعالجة البيانات...' : 'Loading and syncing data...'}
          </span>
          <span className="climamedix-loader-pct">
            {String(progress).padStart(3, '0')}%
          </span>
        </div>
      </div>

      {/* ─── Floating Bottom Controls Bar ─── */}
      <aside className={`test-controls-dock ${panelCollapsed ? 'collapsed' : ''}`}>
        <div className="dock-handle-bar" onClick={() => setPanelCollapsed(!panelCollapsed)}>
          <span className="dock-title">
            ⚙️ <strong>{size}px</strong> &bull; {showBorder ? `Border: ${borderWidth}px` : 'No Border'}
          </span>
          <button type="button" className="dock-collapse-btn">
            {panelCollapsed ? '▲ Expand' : '▼ Collapse'}
          </button>
        </div>

        {!panelCollapsed && (
          <div className="dock-content">
            {/* Size Slider */}
            <div className="dock-row">
              <label>
                <span>Planet Size:</span>
                <strong className="dock-val">{size}px</strong>
              </label>
              <input
                type="range"
                min="100"
                max="360"
                step="5"
                value={size}
                onInput={(e) => setSize(Number(e.currentTarget.value))}
                className="dock-slider"
              />
              <div className="dock-presets">
                <button onClick={() => setSize(120)}>120px</button>
                <button onClick={() => setSize(160)}>160px</button>
                <button onClick={() => setSize(200)}>200px</button>
                <button onClick={() => setSize(240)}>240px</button>
                <button onClick={() => setSize(300)}>300px</button>
              </div>
            </div>

            {/* Border Toggle & Thickness */}
            <div className="dock-row">
              <div className="dock-split">
                <label>
                  <span>Border Ring:</span>
                </label>
                <button
                  type="button"
                  className={`dock-toggle ${showBorder ? 'active' : ''}`}
                  onClick={() => setShowBorder(!showBorder)}
                >
                  {showBorder ? 'ON' : 'OFF'}
                </button>

                {showBorder && (
                  <div className="dock-inline-inputs">
                    <span>Width: <strong>{borderWidth}px</strong></span>
                    <input
                      type="range"
                      min="0.5"
                      max="4"
                      step="0.1"
                      value={borderWidth}
                      onInput={(e) => setBorderWidth(Number(e.currentTarget.value))}
                      className="dock-slider-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Dark Mode & Reset */}
            <div className="dock-row dock-row-bottom">
              <button
                type="button"
                className="dock-btn-secondary"
                onClick={() => setIsDark(!isDark)}
              >
                {isDark ? '☀️ Light Background' : '🌙 Dark Background'}
              </button>
              <div className="dock-code-hint">
                Current style: <code>width: {size}px; height: {size}px;</code>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
