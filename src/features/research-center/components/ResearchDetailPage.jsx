import { useState, useEffect } from 'preact/hooks';
import { supabase } from '../../../utils/supabaseClient';
import { useAuth } from '../../auth/hooks/useAuth';
import './ResearchDetailPage.css';

export function ResearchDetailPage({ lang, onNavigate }) {
  const [pub, setPub] = useState(null);
  const [loading, setLoading] = useState(true);
  const { hasPermission } = useAuth();
  const isRtl = lang === 'ar';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) fetchPublication(id);
  }, []);

  const fetchPublication = async (id) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('publications')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setPub(data);
    } catch (err) {
      console.error('Error fetching publication:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFileType = (url) => {
    if (!url) return 'File';
    const ext = url.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'PDF';
    if (ext === 'doc' || ext === 'docx') return 'Word';
    if (ext === 'ppt' || ext === 'pptx') return 'PowerPoint';
    if (ext === 'xls' || ext === 'xlsx') return 'Excel';
    return 'File';
  };

  if (loading) {
    return (
      <div className="rdp-loading" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="rdp-spinner"></div>
        <p>{isRtl ? 'جاري التحميل...' : 'Loading...'}</p>
      </div>
    );
  }

  if (!pub) {
    return (
      <div className="rdp-not-found" dir={isRtl ? 'rtl' : 'ltr'}>
        <h2>{isRtl ? 'البحث غير موجود' : 'Publication Not Found'}</h2>
        <button className="rdp-btn" onClick={() => onNavigate?.('research')}>
          {isRtl ? 'العودة للأبحاث' : 'Back to Research'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }} dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Banner */}
      <div style={{
        background: 'linear-gradient(90deg, #15b47a 0%, #12a978 5%, #0c8774 23%, #066d71 41%, #025a6e 60%, #004f6d 79%, #004c6d 100%)',
        padding: '160px 20px 50px 20px',
        position: 'relative',
        boxShadow: '0 4px 20px rgba(11, 40, 73, 0.1)',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <button className="rdp-back-btn" onClick={() => onNavigate?.('research')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points={isRtl ? '9 18 15 12 9 6' : '15 18 9 12 15 6'}/></svg>
            {isRtl ? 'جميع الأبحاث' : 'All Research'}
          </button>
          <div className="rdp-badge-row">
            <span className="rdp-badge">{pub.category || 'research'}</span>
            <span className="rdp-year">{pub.year}</span>
          </div>
          <h1 className="rdp-title">{isRtl ? pub.title_ar : (pub.title_en || pub.title_ar)}</h1>
          {pub.title_en && pub.title_ar && (
            <p className="rdp-alt-title">{isRtl ? pub.title_en : pub.title_ar}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="rdp-content">
        <div className="rdp-main">
          
          {/* Authors */}
          <div className="rdp-section">
            <h3 className="rdp-section-title">{isRtl ? 'المؤلفون' : 'Authors'}</h3>
            <p className="rdp-authors">{pub.authors}</p>
          </div>

          {/* Abstract */}
          {(pub.abstract_ar || pub.abstract_en) && (
            <div className="rdp-section">
              <h3 className="rdp-section-title">{isRtl ? 'الملخص' : 'Abstract'}</h3>
              <div className="rdp-abstract">
                {isRtl ? pub.abstract_ar : (pub.abstract_en || pub.abstract_ar)}
              </div>
              {pub.abstract_en && pub.abstract_ar && (
                <details className="rdp-alt-abstract">
                  <summary>{isRtl ? 'عرض الملخص بالإنجليزية' : 'Show Arabic abstract'}</summary>
                  <div className="rdp-abstract" style={{ marginTop: '12px' }}>
                    {isRtl ? pub.abstract_en : pub.abstract_ar}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="rdp-sidebar">
          {/* Download Card */}
          {pub.pdf_url && (() => {
            const canDownload = !pub.full_access_permission_key || (hasPermission && hasPermission(pub.full_access_permission_key));
            return (
              <div className="rdp-card">
                <h4>{isRtl ? 'تحميل الملف' : 'Download File'}</h4>
                <div className="rdp-file-type">{getFileType(pub.pdf_url)}</div>
                {canDownload ? (
                  <a href={pub.pdf_url} target="_blank" rel="noreferrer" className="rdp-download-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    {isRtl ? 'تحميل' : 'Download'}
                  </a>
                ) : (
                  <button className="rdp-download-btn" style={{ background: '#e2e8f0', color: '#64748b', cursor: 'not-allowed', border: 'none' }}>
                    {isRtl ? 'مطلوب ترقية الحساب' : 'Upgrade to Download'}
                  </button>
                )}
              </div>
            );
          })()}

          {/* Info Card */}
          <div className="rdp-card">
            <h4>{isRtl ? 'معلومات النشر' : 'Publication Info'}</h4>
            <div className="rdp-info-row">
              <span className="rdp-info-label">{isRtl ? 'السنة' : 'Year'}</span>
              <span className="rdp-info-value">{pub.year}</span>
            </div>
            <div className="rdp-info-row">
              <span className="rdp-info-label">{isRtl ? 'التصنيف' : 'Category'}</span>
              <span className="rdp-info-value">{pub.category || '—'}</span>
            </div>
            <div className="rdp-info-row">
              <span className="rdp-info-label">{isRtl ? 'تاريخ الإضافة' : 'Added'}</span>
              <span className="rdp-info-value">{new Date(pub.created_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
