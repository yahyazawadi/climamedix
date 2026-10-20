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
  const [sortKey, setSortKey] = useState('progressPercent'); // 'name' | 'country' | 'completedLessonsCount' | 'totalWatchTimeSeconds' | 'progressPercent' | 'isCompleted' | 'firstSignInAt' | 'lastActiveAt'
  const [sortDir, setSortDir] = useState('desc'); // 'asc' | 'desc'

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

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      // Sensible defaults: text asc, numbers/dates desc
      if (key === 'name' || key === 'country') {
        setSortDir('asc');
      } else {
        setSortDir('desc');
      }
    }
  };

  // Filtered and sorted students list (Instant client-side, ZERO extra DB queries)
  const filteredStudents = useMemo(() => {
    if (!data?.students) return [];

    const list = data.students.filter(student => {
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

    list.sort((a, b) => {
      let valA;
      let valB;

      switch (sortKey) {
        case 'name':
          valA = (a.name || '').toLowerCase();
          valB = (b.name || '').toLowerCase();
          return sortDir === 'asc' ? valA.localeCompare(valB, 'ar') : valB.localeCompare(valA, 'ar');
        case 'country':
          valA = (a.country || '').toLowerCase();
          valB = (b.country || '').toLowerCase();
          return sortDir === 'asc' ? valA.localeCompare(valB, 'ar') : valB.localeCompare(valA, 'ar');
        case 'completedLessonsCount':
          valA = a.completedLessonsCount || 0;
          valB = b.completedLessonsCount || 0;
          break;
        case 'totalWatchTimeSeconds':
          valA = a.totalWatchTimeSeconds || 0;
          valB = b.totalWatchTimeSeconds || 0;
          break;
        case 'progressPercent':
          valA = a.progressPercent || 0;
          valB = b.progressPercent || 0;
          break;
        case 'isCompleted':
          valA = a.isCompleted ? 1 : (a.completedLessonsCount > 0 ? 0.5 : 0);
          valB = b.isCompleted ? 1 : (b.completedLessonsCount > 0 ? 0.5 : 0);
          break;
        case 'firstSignInAt':
          valA = new Date(a.firstSignInAt || a.enrolledAt || 0).getTime();
          valB = new Date(b.firstSignInAt || b.enrolledAt || 0).getTime();
          break;
        case 'lastActiveAt':
          valA = new Date(a.lastActiveAt || 0).getTime();
          valB = new Date(b.lastActiveAt || 0).getTime();
          break;
        default:
          valA = a.progressPercent || 0;
          valB = b.progressPercent || 0;
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [data, searchQuery, filterType, sortKey, sortDir]);

  // Format seconds into readable duration (e.g. 2 س 15 د or 45 د)
  const formatDuration = (totalSec) => {
    if (!totalSec || totalSec <= 0) return '0 دقيقة';
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    if (hrs > 0) {
      return `${hrs} س ${mins} د`;
    }
    return `${mins} دقيقة`;
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredStudents.length) return;

    const headers = ['اسم الطالب', 'البريد الإلكتروني', 'الدولة', 'الدروس المنجزة', 'إجمالي الدروس', 'نسبة الإنجاز', 'وقت المشاهدة الفعلي (ثانية)', 'وقت المشاهدة', 'الحالة', 'أول نشاط (تسجيل الحساب)', 'آخر نشاط'];
    const rows = filteredStudents.map(s => [
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.email}"`,
      `"${s.country}"`,
      s.completedLessonsCount,
      s.totalLessons,
      `${s.progressPercent}%`,
      s.totalWatchTimeSeconds || 0,
      `"${formatDuration(s.totalWatchTimeSeconds)}"`,
      s.isCompleted ? 'مكتمل' : (s.completedLessonsCount > 0 ? 'قيد التقدم' : 'لم يبدأ'),
      `"${s.firstSignInAt ? new Date(s.firstSignInAt).toLocaleString('ar-EG') : 'غير متوفر'}"`,
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
          <div className="cap-stat-label">الطلاب النشطون (حضور أو إنجاز)</div>
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
          <div className="cap-stat-sub">أنهوا الـ {data?.summary?.totalLessons || 30} درساً بنجاح</div>
        </div>

        <div className="cap-stat-card">
          <div className="cap-stat-label">متوسط إنجاز الدفعة</div>
          <div className="cap-stat-value" style={{ color: '#f59e0b' }}>
            {data?.summary?.averageProgress || 0}%
          </div>
          <div className="cap-stat-sub">
            {data?.summary?.totalNormalizedViaTelemetry > 0 
              ? `تم توحيد ${data.summary.totalNormalizedViaTelemetry} درساً من سجلات المشاهدة`
              : 'من كامل مفردات البرنامج'}
          </div>
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
                  <th onClick={() => handleSort('name')} className="cap-sortable-th" title="ترتيب حسب اسم الطالب">
                    <div className="cap-th-content">
                      <span>الطالب</span>
                      <span className={`cap-sort-arrow ${sortKey === 'name' ? 'active' : ''}`}>
                        {sortKey === 'name' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    </div>
                  </th>
                  <th onClick={() => handleSort('country')} className="cap-sortable-th" title="ترتيب حسب الدولة">
                    <div className="cap-th-content">
                      <span>الدولة</span>
                      <span className={`cap-sort-arrow ${sortKey === 'country' ? 'active' : ''}`}>
                        {sortKey === 'country' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    </div>
                  </th>
                  <th onClick={() => handleSort('completedLessonsCount')} className="cap-sortable-th" title="ترتيب حسب عدد الدروس المنجزة">
                    <div className="cap-th-content">
                      <span>الدروس المنجزة</span>
                      <span className={`cap-sort-arrow ${sortKey === 'completedLessonsCount' ? 'active' : ''}`}>
                        {sortKey === 'completedLessonsCount' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    </div>
                  </th>
                  <th onClick={() => handleSort('totalWatchTimeSeconds')} className="cap-sortable-th" title="ترتيب حسب وقت المشاهدة">
                    <div className="cap-th-content">
                      <span>وقت المشاهدة</span>
                      <span className={`cap-sort-arrow ${sortKey === 'totalWatchTimeSeconds' ? 'active' : ''}`}>
                        {sortKey === 'totalWatchTimeSeconds' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    </div>
                  </th>
                  <th onClick={() => handleSort('progressPercent')} className="cap-sortable-th" title="ترتيب حسب نسبة الإنجاز">
                    <div className="cap-th-content">
                      <span>نسبة الإنجاز</span>
                      <span className={`cap-sort-arrow ${sortKey === 'progressPercent' ? 'active' : ''}`}>
                        {sortKey === 'progressPercent' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    </div>
                  </th>
                  <th onClick={() => handleSort('isCompleted')} className="cap-sortable-th" title="ترتيب حسب الحالة">
                    <div className="cap-th-content">
                      <span>الحالة</span>
                      <span className={`cap-sort-arrow ${sortKey === 'isCompleted' ? 'active' : ''}`}>
                        {sortKey === 'isCompleted' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    </div>
                  </th>
                  <th onClick={() => handleSort('firstSignInAt')} className="cap-sortable-th" title="ترتيب حسب أول نشاط">
                    <div className="cap-th-content">
                      <span>أول نشاط (تسجيل الحساب)</span>
                      <span className={`cap-sort-arrow ${sortKey === 'firstSignInAt' ? 'active' : ''}`}>
                        {sortKey === 'firstSignInAt' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    </div>
                  </th>
                  <th onClick={() => handleSort('lastActiveAt')} className="cap-sortable-th" title="ترتيب حسب آخر نشاط">
                    <div className="cap-th-content">
                      <span>آخر نشاط</span>
                      <span className={`cap-sort-arrow ${sortKey === 'lastActiveAt' ? 'active' : ''}`}>
                        {sortKey === 'lastActiveAt' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    </div>
                  </th>
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
                      <div>
                        <strong>{student.completedLessonsCount}</strong>
                        <span style={{ color: 'rgba(11, 40, 73, 0.45)', fontSize: '12px' }}> / {student.totalLessons}</span>
                      </div>
                      {student.watchNormalizedCount > 0 ? (
                        <div style={{ fontSize: '10.5px', color: '#0284c7', marginTop: '2px' }}>
                          +{student.watchNormalizedCount} من سجلات المشاهدة
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#0b2849' }}>
                        {formatDuration(student.totalWatchTimeSeconds)}
                      </span>
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
                        {(() => {
                          const dateVal = student.firstSignInAt || student.enrolledAt || student.lastActiveAt;
                          if (!dateVal) return 'غير محدد';
                          const d = new Date(dateVal);
                          return isNaN(d.getTime()) ? 'غير محدد' : d.toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
                        })()}
                      </span>
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
