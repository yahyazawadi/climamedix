import { useState, useEffect, useMemo } from 'preact/hooks';
import { useAuth } from '../../auth/hooks/useAuth';
import { fetchCourseStudentsProgress } from '../services/courseAnalyticsService';
import './CourseAnalyticsPanel.css';

/**
 * CourseAnalyticsPanel (Superadmin Only)
 * 
 * Provides in-depth student attendance, progress, and completion analytics.
 * Strictly gated so only Superadmins can view and export.
 */
export function CourseAnalyticsPanel({ lang = 'ar' }) {
  const isArabic = lang === 'ar';
  const { userProfile, loading: authLoading } = useAuth();
  const isSuperadmin = userProfile?.role === 'superadmin';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'completed' | 'active' | 'not-started'

  useEffect(() => {
    if (!isSuperadmin) return;

    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const result = await fetchCourseStudentsProgress();
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'حدث خطأ أثناء تحميل إحصائيات المساق.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [isSuperadmin]);

  // Filtered students list
  const filteredStudents = useMemo(() => {
    if (!data?.students) return [];

    return data.students.filter(student => {
      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        student.name.toLowerCase().includes(q) || 
        student.email.toLowerCase().includes(q) ||
        student.country.toLowerCase().includes(q);

      if (!matchSearch) return false;

      // Status filter
      if (filterType === 'completed') return student.isCompleted;
      if (filterType === 'active') return student.completedLessonsCount > 0 && !student.isCompleted;
      if (filterType === 'not-started') return student.completedLessonsCount === 0;

      return true;
    });
  }, [data, searchQuery, filterType]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredStudents.length) return;

    const headers = ['اسم الطالب', 'البريد الإلكتروني', 'الدولة', 'الدروس المنجزة', 'إجمالي الدروس', 'نسبة الإنجاز', 'الحالة', 'آخر نشاط'];
    const rows = filteredStudents.map(s => [
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.email}"`,
      `"${s.country}"`,
      s.completedLessonsCount,
      s.totalLessons,
      `${s.progressPercent}%`,
      s.isCompleted ? 'مكتمل' : (s.completedLessonsCount > 0 ? 'قيد التقدم' : 'لم يبدأ'),
      `"${new Date(s.lastActiveAt).toLocaleString('ar-EG')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `كشف_حضور_وإنجاز_الطلاب_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Loading auth state
  if (authLoading) {
    return (
      <div className="cap-container" style={{ textAlign: 'center', padding: '60px' }}>
        <p style={{ color: 'rgba(11, 40, 73, 0.6)' }}>جاري التحقق من صلاحيات المسؤول...</p>
      </div>
    );
  }

  // 2. Strict Security Check: Superadmin ONLY
  if (!isSuperadmin) {
    return (
      <div className="cap-container" style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto', background: '#fee2e2', border: '1px solid #f87171', borderRadius: '16px', padding: '32px' }}>
          <h3 style={{ color: '#991b1b', margin: '0 0 10px 0' }}>غير مصرح بالدخول (Superadmin Only)</h3>
          <p style={{ color: '#7f1d1d', fontSize: '14px', margin: 0 }}>
            هذه الشاشة محمية بالكامل وتتطلب صلاحية المسؤول الرئيسي (Superadmin) لعرض تقدم وسجلات الطلاب.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="cap-container">
      {/* Header */}
      <div className="cap-header">
        <div>
          <span className="cap-badge-superadmin">
            صلاحية المسؤول الرئيسي (Superadmin)
          </span>
          <h2 className="cap-title">
            تحليلات إنجاز وحضور الطلاب: {data?.summary?.courseTitle || 'زمالة المثقف الصحي'}
          </h2>
          <p className="cap-subtitle">
            متابعة دقيقة لكل طالب مسجل، نسبة إتمامه للدروس الـ 30، وآخر موعد تفاعل قبل إغلاق الكورس يوم 25.
          </p>
        </div>

        <button 
          type="button" 
          className="cap-btn-export" 
          onClick={handleExportCSV}
          disabled={!filteredStudents.length}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          تصدير كشف الطلاب (Excel / CSV)
        </button>
      </div>

      {error ? (
        <div style={{ padding: '16px', background: '#fee2e2', color: '#b91c1c', borderRadius: '10px', marginBottom: '24px' }}>
          {error}
        </div>
      ) : null}

      {/* Summary KPI Cards */}
      <div className="cap-stats-grid">
        <div className="cap-stat-card">
          <div className="cap-stat-label">إجمالي الطلاب المسجلين</div>
          <div className="cap-stat-value">{data?.summary?.totalEnrolled || 0}</div>
          <div className="cap-stat-sub">طالب مسجل بالكورس</div>
        </div>

        <div className="cap-stat-card">
          <div className="cap-stat-label">الطلاب النشطون (أنجزوا دروساً)</div>
          <div className="cap-stat-value" style={{ color: '#004c6d' }}>
            {data?.summary?.activeLearners || 0}
          </div>
          <div className="cap-stat-sub">
            {data?.summary?.totalEnrolled ? Math.round((data.summary.activeLearners / data.summary.totalEnrolled) * 100) : 0}% من إجمالي المسجلين
          </div>
        </div>

        <div className="cap-stat-card">
          <div className="cap-stat-label">أتموا الكورس بالكامل (100%)</div>
          <div className="cap-stat-value" style={{ color: '#15b47a' }}>
            {data?.summary?.fullyCompleted || 0}
          </div>
          <div className="cap-stat-sub">أنهوا الـ 30 درساً بنجاح</div>
        </div>

        <div className="cap-stat-card">
          <div className="cap-stat-label">متوسط إنجاز الدفعة</div>
          <div className="cap-stat-value" style={{ color: '#f59e0b' }}>
            {data?.summary?.averageProgress || 0}%
          </div>
          <div className="cap-stat-sub">من كامل مفردات البرنامج</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="cap-controls-bar">
        <input 
          type="text" 
          className="cap-search-input" 
          placeholder="ابحث عن طالب بالاسم، البريد الإلكتروني أو الدولة..."
          value={searchQuery}
          onInput={(e) => setSearchQuery(e.target.value)}
        />

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            type="button" 
            className={`cap-filter-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            الكل ({data?.students?.length || 0})
          </button>
          <button 
            type="button" 
            className={`cap-filter-btn ${filterType === 'completed' ? 'active' : ''}`}
            onClick={() => setFilterType('completed')}
          >
            أتموا 100% ({data?.students?.filter(s => s.isCompleted).length || 0})
          </button>
          <button 
            type="button" 
            className={`cap-filter-btn ${filterType === 'active' ? 'active' : ''}`}
            onClick={() => setFilterType('active')}
          >
            قيد التقدم ({data?.students?.filter(s => s.completedLessonsCount > 0 && !s.isCompleted).length || 0})
          </button>
          <button 
            type="button" 
            className={`cap-filter-btn ${filterType === 'not-started' ? 'active' : ''}`}
            onClick={() => setFilterType('not-started')}
          >
            لم يبدأوا ({data?.students?.filter(s => s.completedLessonsCount === 0).length || 0})
          </button>
        </div>
      </div>

      {/* Main Student Progress Table */}
      <div className="cap-table-wrapper">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(11, 40, 73, 0.5)' }}>
            جاري فحص سجلات Supabase وحساب إنجاز الطلاب...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(11, 40, 73, 0.5)' }}>
            لا يوجد طلاب يطابقون خيارات البحث الحالية.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="cap-table">
              <thead>
                <tr>
                  <th>الطالب</th>
                  <th>الدولة</th>
                  <th>الدروس المنجزة</th>
                  <th>نسبة الإنجاز</th>
                  <th>الحالة</th>
                  <th>آخر نشاط</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.userId}>
                    <td>
                      <div style={{ fontWeight: '700', color: '#0b2849' }}>
                        {student.name}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'rgba(11, 40, 73, 0.55)' }}>
                        {student.email}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '12.5px', color: 'rgba(11, 40, 73, 0.8)' }}>
                        {student.country}
                      </span>
                    </td>
                    <td>
                      <strong>{student.completedLessonsCount}</strong>
                      <span style={{ color: 'rgba(11, 40, 73, 0.45)', fontSize: '12px' }}> / {student.totalLessons}</span>
                    </td>
                    <td>
                      <div className="cap-progress-container">
                        <div className="cap-progress-bar-bg">
                          <div 
                            className="cap-progress-bar-fill" 
                            style={{ width: `${student.progressPercent}%` }}
                          />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '700', minWidth: '36px' }}>
                          {student.progressPercent}%
                        </span>
                      </div>
                    </td>
                    <td>
                      {student.isCompleted ? (
                        <span className="cap-badge-status complete">مكتمل (100%)</span>
                      ) : student.completedLessonsCount > 0 ? (
                        <span className="cap-badge-status in-progress">قيد المتابعة</span>
                      ) : (
                        <span className="cap-badge-status zero">لم يبدأ بعد</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '11.5px', color: 'rgba(11, 40, 73, 0.65)' }}>
                        {new Date(student.lastActiveAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
