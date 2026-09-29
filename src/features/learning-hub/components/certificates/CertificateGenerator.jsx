import { useRef, useState } from 'preact/hooks';
import { Button } from '../../../shared/components/Button';
import { GlassCard } from '../../../shared/components/GlassCard';

// ─── Certificate SVG Component ────────────────────────────────────────────────
// Pure SVG: infinitely sharp at any resolution. No canvas quality issues.
// PNG export works by rendering this SVG into an offscreen canvas via Blob URL.
// ─────────────────────────────────────────────────────────────────────────────

const W = 800;
const H = 560;

function CertificateSVG({ recipientName, courseTitle, certId, svgRef }) {
  const today = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      <defs>
        {/* Background gradient */}
        <linearGradient id="bg-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f7fbfc" />
          <stop offset="100%" stopColor="#e9f3f7" />
        </linearGradient>

        {/* Subtle watermark radial */}
        <radialGradient id="watermark" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#15b47a" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#15b47a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ── Background ── */}
      <rect width={W} height={H} fill="url(#bg-grad)" />
      <rect width={W} height={H} fill="url(#watermark)" />

      {/* ── Outer border ── */}
      <rect x="10" y="10" width={W - 20} height={H - 20}
        fill="none" stroke="#0b2849" strokeWidth="14" />

      {/* ── Inner border ── */}
      <rect x="25" y="25" width={W - 50} height={H - 50}
        fill="none" stroke="#15b47a" strokeWidth="1.5" />

      {/* ── Corner accent squares ── */}
      {[
        [10, 10], [W - 50, 10], [10, H - 50], [W - 50, H - 50]
      ].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="40" height="40" fill="#0b2849" />
      ))}

      {/* ── Academy name (Arabic) ── */}
      <text
        x={W / 2} y="82"
        textAnchor="middle"
        fontFamily="'Tajawal', 'Outfit', sans-serif"
        fontWeight="bold"
        fontSize="20"
        fill="#0b2849"
      >
        أكاديمية كلايما ميدكس للمناخ والصحة
      </text>

      {/* ── Academy name (English) ── */}
      <text
        x={W / 2} y="102"
        textAnchor="middle"
        fontFamily="'Outfit', 'Tajawal', sans-serif"
        fontSize="10.5"
        letterSpacing="1.5"
        fill="#0b2849"
        opacity="0.6"
      >
        CLIMAMEDIX ACADEMY FOR CLIMATE &amp; HEALTH
      </text>

      {/* ── Decorative divider line ── */}
      <line x1="200" y1="115" x2={W - 200} y2="115"
        stroke="#15b47a" strokeWidth="0.8" opacity="0.5" />

      {/* ── Main certificate title ── */}
      <text
        x={W / 2} y="168"
        textAnchor="middle"
        fontFamily="'Tajawal', sans-serif"
        fontWeight="bold"
        fontSize="38"
        fill="#15b47a"
      >
        شهادة إتمام معتمدة
      </text>

      {/* ── Body line 1 ── */}
      <text
        x={W / 2} y="222"
        textAnchor="middle"
        fontFamily="'Tajawal', sans-serif"
        fontSize="15"
        fill="#0b2849"
        opacity="0.8"
      >
        تشهد الأكاديمية بأن الباحث / الممارس الصحي
      </text>

      {/* ── Recipient name ── */}
      <text
        x={W / 2} y="272"
        textAnchor="middle"
        fontFamily="'Tajawal', sans-serif"
        fontWeight="bold"
        fontSize="30"
        fill="#004c6d"
      >
        {recipientName}
      </text>

      {/* ── Underline accent for name ── */}
      <line x1={W / 2 - 120} y1="282" x2={W / 2 + 120} y2="282"
        stroke="#15b47a" strokeWidth="1" opacity="0.4" />

      {/* ── Body line 2 ── */}
      <text
        x={W / 2} y="328"
        textAnchor="middle"
        fontFamily="'Tajawal', sans-serif"
        fontSize="15"
        fill="#0b2849"
        opacity="0.8"
      >
        قد أكمل بنجاح متطلبات المساق التدريبي التخصصي:
      </text>

      {/* ── Course title ── */}
      <text
        x={W / 2} y="372"
        textAnchor="middle"
        fontFamily="'Tajawal', sans-serif"
        fontWeight="bold"
        fontSize="21"
        fill="#0b2849"
      >
        {courseTitle}
      </text>

      {/* ── Issue date ── */}
      <text
        x={W / 2} y="428"
        textAnchor="middle"
        fontFamily="'Tajawal', sans-serif"
        fontSize="12"
        fill="#0b2849"
        opacity="0.5"
      >
        {`تاريخ الإصدار: ${today}`}
      </text>

      {/* ── Signature line ── */}
      <line x1="145" y1="480" x2="280" y2="480"
        stroke="#0b2849" strokeWidth="0.8" opacity="0.3" />
      <text
        x="212" y="497"
        textAnchor="middle"
        fontFamily="'Tajawal', sans-serif"
        fontSize="11"
        fill="#0b2849"
        opacity="0.7"
      >
        مدير التدريب الأكاديمي
      </text>

      {/* ── Seal circle ── */}
      <circle cx="580" cy="474" r="30"
        fill="rgba(21,180,122,0.12)" stroke="#15b47a" strokeWidth="1.5" />
      <text
        x="580" y="478"
        textAnchor="middle"
        fontFamily="'Outfit', sans-serif"
        fontWeight="bold"
        fontSize="9"
        letterSpacing="1"
        fill="#15b47a"
      >
        SEAL
      </text>

      {/* ── Verification ID ── */}
      {certId && (
        <text
          x={W / 2} y="518"
          textAnchor="middle"
          fontFamily="'Outfit', monospace"
          fontSize="9"
          fill="#0b2849"
          opacity="0.35"
        >
          {`رقم التوثيق المرجعي: ${certId}`}
        </text>
      )}
    </svg>
  );
}

// ── Shared export: SVG → offscreen canvas → chosen format ───────────────────
const EXPORT_SCALE = 2; // 2× = 1600×1120 px raster output

function svgToCanvas(svgEl) {
  return new Promise((resolve, reject) => {
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = W * EXPORT_SCALE;
      canvas.height = H * EXPORT_SCALE;
      const ctx = canvas.getContext('2d');
      // JPEG needs a white background (transparent → black otherwise)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(EXPORT_SCALE, EXPORT_SCALE);
      ctx.drawImage(img, 0, 0, W, H);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = reject;
    img.src = url;
  });
}

async function exportCertificate(svgEl, format, recipientName) {
  const baseName = `شهادة_كلايما_ميدكس_${recipientName.replace(/\s+/g, '_')}`;
  const canvas = await svgToCanvas(svgEl);

  if (format === 'png' || format === 'jpeg') {
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const quality  = format === 'jpeg' ? 0.92 : 1.0;
    const ext      = format === 'jpeg' ? 'jpg' : 'png';
    const link = document.createElement('a');
    link.download = `${baseName}.${ext}`;
    link.href = canvas.toDataURL(mimeType, quality);
    link.click();
    return;
  }

  if (format === 'pdf') {
    // Lazy-import jsPDF only when needed to keep initial bundle small
    const { jsPDF } = await import('jspdf');
    // A4 landscape fits the certificate nicely
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [W, H] });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', 0, 0, W, H);
    pdf.save(`${baseName}.pdf`);
  }
}
// ─────────────────────────────────────────────────────────────────────────────

export function CertificateGenerator({ recipientName = 'د. مريم العتيبي', courseTitle = 'زمالة طب الكوارث المناخية والبيئية', certId, onClose }) {
  const svgRef = useRef(null);
  const [exporting, setExporting] = useState(null); // 'png' | 'jpeg' | 'pdf' | null

  const handleDownload = async (format) => {
    if (!svgRef.current || exporting) return;
    setExporting(format);
    try {
      await exportCertificate(svgRef.current, format, recipientName);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 12, 26, 0.6)',
      backdropFilter: 'blur(15px)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      overflowY: 'auto',
      zIndex: 1000,
      padding: '20px',
    }}>
      <GlassCard style={{ padding: '30px', maxWidth: '850px', width: '100%', direction: 'rtl', textAlign: 'center', background: '#ffffff', maxHeight: 'none' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(11,40,73,0.1)', paddingBottom: '12px', marginBottom: '20px' }}>
          <h4 style={{ color: '#0b2849', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>مولد الشهادات الرقمي</h4>
          {onClose && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#ff4d4d' }}>&times;</button>
          )}
        </div>

        {/* Certificate SVG Display */}
        <div style={{ overflowX: 'auto', marginBottom: '25px', display: 'flex', justifyContent: 'center', borderRadius: '12px', boxShadow: '0 12px 36px rgba(11,40,73,0.15)', border: '1px solid rgba(11,40,73,0.08)' }}>
          <CertificateSVG
            svgRef={svgRef}
            recipientName={recipientName}
            courseTitle={courseTitle}
            certId={certId}
          />
        </div>

        {/* Verification Link */}
        {certId && (
          <div style={{ marginBottom: '25px', padding: '16px', background: 'rgba(21, 180, 122, 0.05)', border: '1px dashed rgba(21, 180, 122, 0.3)', borderRadius: '12px' }}>
            <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#0b2849', fontWeight: 'bold' }}>رابط التوثيق الرسمي:</h5>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', direction: 'ltr' }}>
              <span style={{ fontSize: '12.5px', color: '#15b47a', fontFamily: 'monospace', userSelect: 'all' }}>
                {window.location.origin}/verify/{certId}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/verify/${certId}`)}
                style={{ background: 'none', border: '1px solid rgba(21,180,122,0.3)', borderRadius: '6px', cursor: 'pointer', padding: '4px 8px', color: '#15b47a', fontSize: '11px' }}>
                نسخ الرابط
              </button>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>

          {/* ── Format download buttons ── */}
          {[
            { fmt: 'png',  label: 'PNG',  title: 'صورة عالية الجودة شفافة الخلفية' },
            { fmt: 'jpeg', label: 'JPEG', title: 'صورة مضغوطة للمشاركة السريعة' },
            { fmt: 'pdf',  label: 'PDF',  title: 'مستند قابل للطباعة — A4 أفقي' },
          ].map(({ fmt, label, title }) => (
            <button
              key={fmt}
              title={title}
              disabled={!!exporting}
              onClick={() => handleDownload(fmt)}
              style={{
                padding: '10px 22px',
                borderRadius: '10px',
                border: '1.5px solid',
                borderColor: exporting === fmt ? '#15b47a' : 'rgba(21,180,122,0.4)',
                background: exporting === fmt ? 'rgba(21,180,122,0.12)' : 'transparent',
                color: '#15b47a',
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 'bold',
                fontSize: '13px',
                letterSpacing: '0.5px',
                cursor: exporting ? 'not-allowed' : 'pointer',
                opacity: exporting && exporting !== fmt ? 0.45 : 1,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {exporting === fmt ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{ animation: 'spin 0.8s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  جاري التصدير...
                </>
              ) : (
                <>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 29.978 29.978"
                    fill="currentColor"
                    style={{ display: 'inline-block', verticalAlign: 'middle' }}
                  >
                    <path d="M25.462,19.105v6.848H4.515v-6.848H0.489v8.861c0,1.111,0.9,2.012,2.016,2.012h24.967c1.115,0,2.016-0.9,2.016-2.012 v-8.861H25.462z" />
                    <path d="M14.62,18.426l-5.764-6.965c0,0-0.877-0.828,0.074-0.828s3.248,0,3.248,0s0-0.557,0-1.416c0-2.449,0-6.906,0-8.723 c0,0-0.129-0.494,0.615-0.494c0.75,0,4.035,0,4.572,0c0.536,0,0.524,0.416,0.524,0.416c0,1.762,0,6.373,0,8.742 c0,0.768,0,1.266,0,1.266s1.842,0,2.998,0c1.154,0,0.285,0.867,0.285,0.867s-4.904,6.51-5.588,7.193 C15.092,18.979,14.62,18.426,14.62,18.426z" />
                  </svg>
                  {label}
                </>
              )}
            </button>
          ))}

        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      </GlassCard>
    </div>
  );
}
