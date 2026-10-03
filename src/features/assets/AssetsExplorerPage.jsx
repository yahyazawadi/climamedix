import { useState, useEffect, useMemo } from 'preact/hooks';
import './AssetsExplorerPage.css';
import staticFallbackManifest from '../../generated/assets-manifest.json';

// Dynamically resolve image URLs using Vite's import.meta.glob
const assetModules = import.meta.glob(['/src/assets/**', '/src/assets/icons/**'], {
  eager: true,
  query: '?url',
  import: 'default'
});

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function resolveAssetUrl(assetPath) {
  if (!assetPath) return '';
  // If it's in public folder, it is served from root URL directly (e.g. /favicon.svg)
  if (assetPath.startsWith('public/')) {
    return '/' + assetPath.replace('public/', '');
  }
  // Otherwise resolve from Vite eager asset module glob
  const standardPath = '/' + assetPath.replace(/^\//, '');
  if (assetModules[standardPath]) {
    return assetModules[standardPath];
  }
  return standardPath;
}

export function AssetsExplorerPage({ lang = 'ar', onNavigate }) {
  const [assetData, setAssetData] = useState(() => staticFallbackManifest);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'svg', 'image', 'used', 'unused'
  const [expandedAsset, setExpandedAsset] = useState(null);
  const [copiedPath, setCopiedPath] = useState(null);

  // Fetch real-time data dynamically from live server endpoint if available
  useEffect(() => {
    let isMounted = true;
    const fetchLiveAssets = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/assets', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json?.assets) {
            setAssetData(json);
          }
        }
      } catch (e) {
        // Fallback already pre-loaded from staticFallbackManifest
        console.info('[AssetsExplorer] Using pre-built static manifest.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLiveAssets();
    return () => { isMounted = false; };
  }, []);

  const totalAssets = assetData?.totalAssets || 0;
  const totalReferences = assetData?.totalReferences || 0;

  const usedAssetsCount = useMemo(() => {
    return (assetData?.assets || []).filter(a => a.referencesCount > 0).length;
  }, [assetData]);

  const unusedAssetsCount = totalAssets - usedAssetsCount;

  // Filter & Search
  const filteredAssets = useMemo(() => {
    if (!assetData?.assets) return [];
    const q = search.trim().toLowerCase();

    return assetData.assets.filter(asset => {
      // Type/Status filter
      if (activeFilter === 'svg' && asset.type !== 'svg') return false;
      if (activeFilter === 'image' && asset.type !== 'image') return false;
      if (activeFilter === 'used' && asset.referencesCount === 0) return false;
      if (activeFilter === 'unused' && asset.referencesCount > 0) return false;

      // Keyword search (searches filename, path, or any reference file/snippet)
      if (q) {
        const matchesName = asset.name.toLowerCase().includes(q);
        const matchesPath = asset.path.toLowerCase().includes(q);
        const matchesRef = asset.references.some(r => 
          r.file.toLowerCase().includes(q) || r.snippet.toLowerCase().includes(q)
        );
        return matchesName || matchesPath || matchesRef;
      }
      return true;
    });
  }, [assetData, search, activeFilter]);

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text);
    setCopiedPath(text);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const isRtl = lang === 'ar';

  return (
    <div className="assets-explorer-container" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* ─── Hero Header & Real-time Live Badge ─── */}
      <div className="assets-hero-card">
        <div className="assets-hero-badge">
          <span className="assets-pulse-dot" />
          <span>{isRtl ? 'مستكشف الأصول الديناميكي' : 'Live Dynamic Asset Explorer'}</span>
          {loading && <span style={{ opacity: 0.8, fontSize: '11px' }}>({isRtl ? 'جاري الفحص المباشر...' : 'Scanning live...'})</span>}
        </div>

        <h1 className="assets-hero-title">
          {isRtl ? 'جميع ملفات وأيقونات المنصة واستخداماتها' : 'All Platform Assets & Real-Time Code Usages'}
        </h1>
        <p className="assets-hero-sub">
          {isRtl
            ? 'فهرس رقمي حي يتم إنشاؤه ديناميكياً 100% بدون أي قيم ثابتة. يعرض كل ملف، مساره، حجمه، والأماكن وأسطر الكود البرمجي التي تستدعيه فعلياً في المشروع.'
            : '100% dynamic scanner indexing all workspace media, SVGs, and images with every file location and referencing line of code.'}
        </p>

        {/* Telemetry Stat Pills */}
        <div className="assets-stats-row">
          <div className="assets-stat-pill">
            <span className="assets-stat-num">{totalAssets}</span>
            <span className="assets-stat-label">{isRtl ? 'إجمالي الملفات والأيقونات' : 'Total Registered Assets'}</span>
          </div>

          <div className="assets-stat-pill">
            <span className="assets-stat-num">{usedAssetsCount}</span>
            <span className="assets-stat-label">{isRtl ? 'ملفات مستخدمة في الكود' : 'Active In Codebase'}</span>
          </div>

          <div className="assets-stat-pill">
            <span className="assets-stat-num">{unusedAssetsCount}</span>
            <span className="assets-stat-label">{isRtl ? 'ملفات غير مستخدمة (أرشيف)' : 'Unused / Orphaned'}</span>
          </div>

          <div className="assets-stat-pill">
            <span className="assets-stat-num">{totalReferences}</span>
            <span className="assets-stat-label">{isRtl ? 'إجمالي الاستدعاءات البرمجية' : 'Total Code References'}</span>
          </div>
        </div>
      </div>

      {/* ─── Filter & Search Toolbar ─── */}
      <div className="assets-toolbar">
        <div className="assets-search-wrap">
          <input
            type="text"
            className="assets-search-input"
            placeholder={isRtl ? 'ابحث باسم الملف، المسار، أو المكان المستخدم فيه...' : 'Search by asset name, path, or code reference...'}
            value={search}
            onInput={(e) => setSearch(e.currentTarget.value)}
          />
          <svg className="assets-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>

        <div className="assets-filter-chips">
          <button
            className={`assets-chip ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            <span>{isRtl ? 'الكل' : 'All'}</span>
            <span className="assets-chip-badge">{totalAssets}</span>
          </button>

          <button
            className={`assets-chip ${activeFilter === 'svg' ? 'active' : ''}`}
            onClick={() => setActiveFilter('svg')}
          >
            <span>SVG</span>
            <span className="assets-chip-badge">
              {(assetData?.assets || []).filter(a => a.type === 'svg').length}
            </span>
          </button>

          <button
            className={`assets-chip ${activeFilter === 'image' ? 'active' : ''}`}
            onClick={() => setActiveFilter('image')}
          >
            <span>{isRtl ? 'صور (PNG/WebP)' : 'Images'}</span>
            <span className="assets-chip-badge">
              {(assetData?.assets || []).filter(a => a.type === 'image').length}
            </span>
          </button>

          <button
            className={`assets-chip ${activeFilter === 'used' ? 'active' : ''}`}
            onClick={() => setActiveFilter('used')}
          >
            <span>{isRtl ? 'مستخدمة' : 'Used'}</span>
            <span className="assets-chip-badge">{usedAssetsCount}</span>
          </button>

          <button
            className={`assets-chip ${activeFilter === 'unused' ? 'active' : ''}`}
            onClick={() => setActiveFilter('unused')}
          >
            <span>{isRtl ? 'غير مستخدمة' : 'Unused'}</span>
            <span className="assets-chip-badge">{unusedAssetsCount}</span>
          </button>
        </div>
      </div>

      {/* ─── Assets Grid ─── */}
      <div className="assets-grid">
        {filteredAssets.length === 0 ? (
          <div className="assets-empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <h3>{isRtl ? 'لا توجد أصول مطابقة للبحث' : 'No matching assets found'}</h3>
            <p>{isRtl ? 'جرب البحث باسم ملف آخر أو مسح الفلاتر' : 'Try adjusting your search query or filters'}</p>
          </div>
        ) : (
          filteredAssets.map(asset => {
            const isSvg = asset.type === 'svg';
            const isMedia = asset.type === 'media';
            const resolvedSrc = resolveAssetUrl(asset.path);
            const isExpanded = expandedAsset === asset.path;

            return (
              <div className="asset-card" key={asset.path}>
                
                {/* Visual Preview */}
                <div className={`asset-preview-box ${isSvg || asset.ext === 'png' ? 'checkered' : ''}`}>
                  <span className={`asset-ext-tag ${asset.type}`}>
                    {asset.ext}
                  </span>

                  <span className={`asset-usage-badge ${asset.referencesCount > 0 ? 'active' : 'unused'}`}>
                    {asset.referencesCount > 0 
                      ? `${asset.referencesCount} ${isRtl ? 'استخدام' : 'refs'}`
                      : (isRtl ? 'غير مستخدم' : 'Unused')}
                  </span>

                  {isMedia ? (
                    <div style={{ textAlign: 'center', color: '#64748b' }}>
                      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                      </svg>
                    </div>
                  ) : (
                    <img
                      src={resolvedSrc}
                      alt={asset.name}
                      className="asset-preview-img"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                </div>

                {/* Card Info */}
                <div className="asset-card-body">
                  <div className="asset-name">
                    <span title={asset.name}>{asset.name}</span>
                    <div className="asset-actions-group">
                      {/* Copy Path */}
                      <button
                        onClick={() => handleCopy(asset.path)}
                        className={`asset-action-btn ${copiedPath === asset.path ? 'copied' : ''}`}
                        title={copiedPath === asset.path ? (isRtl ? 'تم النسخ!' : 'Copied!') : (isRtl ? 'نسخ المسار' : 'Copy path')}
                      >
                        {copiedPath === asset.path ? (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        )}
                      </button>

                      {/* Download File */}
                      <a
                        href={resolvedSrc}
                        download={asset.name}
                        className="asset-action-btn"
                        title={isRtl ? 'تحميل الملف' : 'Download file'}
                        onClick={(e) => {
                          if (!resolvedSrc) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </a>
                    </div>
                  </div>

                  <div className="asset-path-code">
                    {asset.path}
                  </div>

                  <div className="asset-meta-row">
                    <span><strong>{isRtl ? 'الحجم:' : 'Size:'}</strong> {formatBytes(asset.sizeBytes)}</span>
                    <span><strong>{isRtl ? 'النوع:' : 'Type:'}</strong> {asset.type.toUpperCase()}</span>
                  </div>

                  {/* References Details */}
                  <div className="asset-references-accordion">
                    {asset.referencesCount > 0 ? (
                      <>
                        <button
                          className="asset-ref-toggle"
                          onClick={() => setExpandedAsset(isExpanded ? null : asset.path)}
                        >
                          <span>
                            {isExpanded 
                              ? (isRtl ? 'إخفاء أماكن الاستخدام' : 'Hide Locations')
                              : (isRtl ? `عرض أماكن الاستخدام (${asset.referencesCount})` : `View Locations (${asset.referencesCount})`)}
                          </span>
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            style={{
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s ease'
                            }}
                          >
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </button>

                        {isExpanded && (
                          <div className="asset-ref-list">
                            {asset.references.map((ref, i) => (
                              <div className="asset-ref-item" key={i}>
                                <div className="asset-ref-file">
                                  <span>📄 {ref.file}</span>
                                  <span className="asset-ref-line">:L{ref.line}</span>
                                  {ref.matchType === 'inline-clone' && (
                                    <span style={{ fontSize: '10px', background: '#fef3c7', color: '#b45309', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                                      {isRtl ? 'كود مضمن (Inline)' : 'Inline Vector'}
                                    </span>
                                  )}
                                </div>
                                {ref.snippet && (
                                  <div className="asset-ref-snippet">
                                    {ref.snippet}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {isRtl ? 'لا توجد استدعاءات برمجية مسجلة في ملفات الكود' : 'No code references found in workspace'}
                      </span>
                    )}
                  </div>

                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
