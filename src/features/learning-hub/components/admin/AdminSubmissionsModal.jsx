import { useState, useEffect } from 'preact/hooks';
import { fetchAdminSubmissions } from '../../services/assignmentService';
import './AdminSubmissionsModal.css';

/**
 * AdminSubmissionsModal (SOLID: Single Responsibility & Security)
 * 
 * Renders ONLY for users with admin/superadmin roles.
 * Displays student assignment submissions with direct Cloudflare R2 links.
 */
export function AdminSubmissionsModal({ userProfile, courseId, lessonId, onClose, lang = 'ar' }) {
  const isArabic = lang === 'ar';
  const isAdmin = userProfile && (userProfile.role === 'admin' || userProfile.role === 'superadmin');

  // Hard safety guard: Render nothing if caller is not an admin
  if (!isAdmin) {
    return null;
  }

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const data = await fetchAdminSubmissions({ userProfile, courseId, lessonId });
        if (mounted) {
          setSubmissions(data || []);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Failed to load submissions.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [userProfile, courseId, lessonId]);

  return (
    <div className="cmas-modal-overlay" onClick={onClose}>
      <div className="cmas-modal-card" dir={isArabic ? 'rtl' : 'ltr'} onClick={(e) => e.stopPropagation()}>
        <div className="cmas-header">
          <div>
            <h3 className="cmas-title">
              {isArabic ? 'لوحة تسليمات الواجبات (للإدارة فقط)' : 'Assignment Submissions (Admin Only)'}
            </h3>
            <p className="cmas-subtitle">
              {isArabic ? 'مراجعة حلول الطلاب والملفات المرفوعة إلى Cloudflare' : 'Review student solutions & Cloudflare file uploads'}
            </p>
          </div>
          <button className="cmas-close-btn" onClick={onClose} title={isArabic ? 'إغلاق' : 'Close'}>
            ✕
          </button>
        </div>

        <div className="cmas-body">
          <div className="cmas-metrics-row">
            <div className="cmas-metric-card">
              <div className="cmas-metric-label">
                {isArabic ? 'إجمالي التسليمات' : 'Total Submissions'}
              </div>
              <div className="cmas-metric-value">{submissions.length}</div>
            </div>
            <div className="cmas-metric-card">
              <div className="cmas-metric-label">
                {isArabic ? 'موعد إغلاق الكورس' : 'Course Cutoff Date'}
              </div>
              <div className="cmas-metric-value" style={{ fontSize: '16px', color: '#b45309', paddingTop: '4px' }}>
                {isArabic ? '25 الشهر الجاري' : 'October 25, 2026'}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="cmas-empty-state">
              {isArabic ? 'جاري تحميل التسليمات...' : 'Loading submissions...'}
            </div>
          ) : error ? (
            <div style={{ padding: '16px', background: '#fee2e2', color: '#b91c1c', borderRadius: '10px' }}>
              {error}
            </div>
          ) : submissions.length === 0 ? (
            <div className="cmas-empty-state">
              {isArabic ? 'لا توجد تسليمات مسجلة حتى الآن.' : 'No submissions found yet.'}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="cmas-table">
                <thead>
                  <tr>
                    <th>{isArabic ? 'الطالب' : 'Student'}</th>
                    <th>{isArabic ? 'تاريخ التسليم' : 'Date Submitted'}</th>
                    <th>{isArabic ? 'ملف الحل (Cloudflare)' : 'Solution File (Cloudflare)'}</th>
                    <th>{isArabic ? 'الرابط البديل' : 'Alternative URL'}</th>
                    <th>{isArabic ? 'ملاحظات' : 'Notes'}</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => (
                    <tr key={sub.id}>
                      <td>
                        <strong>{sub.user_name || 'Student'}</strong>
                        <div style={{ fontSize: '11.5px', color: 'rgba(11,40,73,0.6)' }}>
                          {sub.user_email || 'N/A'}
                        </div>
                      </td>
                      <td>
                        {new Date(sub.submitted_at).toLocaleString(isArabic ? 'ar-EG' : 'en-US')}
                      </td>
                      <td>
                        {sub.file_url ? (
                          <a 
                            href={sub.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="cmas-btn-file"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            {sub.file_name || (isArabic ? 'تحميل الملف' : 'Download File')}
                          </a>
                        ) : (
                          <span style={{ color: 'rgba(11,40,73,0.4)', fontSize: '12px' }}>
                            {isArabic ? 'لا يوجد ملف مرفق' : 'No file attached'}
                          </span>
                        )}
                      </td>
                      <td>
                        {sub.solution_url ? (
                          <a 
                            href={sub.solution_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ color: '#004c6d', textDecoration: 'underline', fontSize: '12px' }}
                          >
                            {isArabic ? 'فتح الرابط' : 'Open Link'}
                          </a>
                        ) : (
                          <span style={{ color: 'rgba(11,40,73,0.4)', fontSize: '12px' }}>-</span>
                        )}
                      </td>
                      <td style={{ maxWidth: '200px', fontSize: '12px', color: 'rgba(11,40,73,0.8)' }}>
                        {sub.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
