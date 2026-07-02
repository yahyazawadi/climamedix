import { useState, useEffect } from 'preact/hooks';
import { supabase } from '../../../utils/supabaseClient';
import { useAuth } from '../../auth/hooks/useAuth';
import './ResearchHubPage.css';

export function ResearchHubPage({ lang, onNavigate }) {
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { hasPermission, userProfile } = useAuth();
  const isRtl = lang === 'ar';

  const canWrite = hasPermission && hasPermission('write:research');

  useEffect(() => {
    fetchPublications();
  }, []);

  const fetchPublications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('publications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPublications(data || []);
    } catch (err) {
      console.error("Error fetching publications:", err);
    } finally {
      setLoading(false);
    }
  };

  const getFileExtension = (url) => {
    if (!url) return '';
    return url.split('.').pop().toLowerCase();
  };

  const renderIcon = (url) => {
    const ext = getFileExtension(url);
    if (ext === 'pdf') return 'PDF';
    if (ext === 'doc' || ext === 'docx') return 'Word';
    if (ext === 'ppt' || ext === 'pptx') return 'PPT';
    if (ext === 'xls' || ext === 'xlsx') return 'Excel';
    return 'File';
  };

  const CATEGORY_LABELS = {
    research: { ar: 'أبحاث', en: 'Research' },
    climate: { ar: 'مناخ', en: 'Climate' },
    health: { ar: 'صحة', en: 'Health' },
    policy: { ar: 'سياسات', en: 'Policy' },
    all: { ar: 'عام', en: 'General' },
  };

  const getCategoryLabel = (cat) => {
    const key = cat || 'research';
    return CATEGORY_LABELS[key]?.[lang] || key;
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }} dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Header Banner Block (Green-to-Blue Gradient) */}
      <div 
        style={{
          background: 'linear-gradient(90deg, #15b47a 0%, #12a978 5%, #0c8774 23%, #066d71 41%, #025a6e 60%, #004f6d 79%, #004c6d 100%)',
          padding: '160px 20px 50px 20px',
          textAlign: 'center',
          position: 'relative',
          boxShadow: '0 4px 20px rgba(11, 40, 73, 0.1)',
          direction: isRtl ? 'rtl' : 'ltr'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: isRtl ? 'right' : 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h1 style={{ 
                fontSize: 'clamp(28px, 4vw, 40px)', 
                fontWeight: 'bold', 
                color: '#ffffff', 
                marginBottom: '16px',
                fontFamily: isRtl ? 'Tajawal, sans-serif' : 'Outfit, sans-serif',
                textShadow: '0 2px 4px rgba(0,0,0,0.15)'
              }}>
                {isRtl ? 'مركز الأبحاث والمنشورات' : 'Research & Publications Center'}
              </h1>
              <p style={{ 
                fontSize: 'clamp(14px, 1.8vw, 16px)', 
                color: 'rgba(255, 255, 255, 0.9)', 
                maxWidth: '750px', 
                margin: 0,
                lineHeight: '1.6',
                fontFamily: isRtl ? 'Tajawal, sans-serif' : 'Outfit, sans-serif'
              }}>
                {isRtl ? 'تصفح أحدث الدراسات والأبحاث العلمية في مجالات المناخ والصحة.' : 'Browse the latest scientific studies and research in climate and health.'}
              </p>
            </div>
            
            {canWrite && (
              <button onClick={() => onNavigate?.('research-upload')} style={{
                  background: 'linear-gradient(135deg, #15b47a 0%, #12a978 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 28px',
                  borderRadius: '30px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  fontFamily: isRtl ? 'Tajawal, sans-serif' : 'Outfit, sans-serif',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 20px rgba(21, 180, 122, 0.3)',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                {isRtl ? 'رفع بحث جديد' : 'Upload Research'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="rhp-root" style={{ paddingTop: '20px' }}>

      {loading ? (
        <div className="rhp-loading">
          <div className="rhp-spinner"></div>
          <p>{isRtl ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      ) : publications.length === 0 ? (
        <div className="rhp-empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          <p>{isRtl ? 'لا توجد أبحاث منشورة حالياً.' : 'No research published yet.'}</p>
        </div>
      ) : (
        <div className="rhp-grid">
          {publications.filter(pub => !pub.teaser_permission_key || (hasPermission && hasPermission(pub.teaser_permission_key))).map(pub => {
            const canDownload = !pub.full_access_permission_key || (hasPermission && hasPermission(pub.full_access_permission_key));
            return (
            <div key={pub.id} className="rhp-card" onClick={() => onNavigate?.('research-detail', pub.id)} style={{ cursor: 'pointer' }}>
              <div className="rhp-card-badge">{getCategoryLabel(pub.category)}</div>
              <h3 className="rhp-card-title">{isRtl ? pub.title_ar : (pub.title_en || pub.title_ar)}</h3>
              <div className="rhp-card-meta">
                <span>{pub.authors}</span>
              </div>
              <div className="rhp-card-date">{pub.year}</div>
              <p className="rhp-card-abstract">
                {isRtl ? pub.abstract_ar : (pub.abstract_en || pub.abstract_ar)}
              </p>
              
              <div className="rhp-card-footer">
                {pub.pdf_url ? (
                  canDownload ? (
                    <a href={pub.pdf_url} target="_blank" rel="noreferrer" className="rhp-download-btn" onClick={e => e.stopPropagation()}>
                      {renderIcon(pub.pdf_url)} {isRtl ? 'تحميل' : 'Download'}
                    </a>
                  ) : (
                    <button className="rhp-download-btn" style={{ background: '#e2e8f0', color: '#64748b', cursor: 'not-allowed' }} onClick={e => e.stopPropagation()}>
                      {isRtl ? 'مطلوب ترقية الحساب' : 'Upgrade to Download'}
                    </button>
                  )
                ) : (
                  <span className="rhp-no-file">{isRtl ? 'لا يوجد ملف' : 'No file'}</span>
                )}
              </div>
            </div>
          )})}
        </div>
      )}
      </div>
    </div>
  );
}
