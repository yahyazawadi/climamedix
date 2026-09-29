import { useState, useEffect } from 'preact/hooks';
import { supabase } from '../../../utils/supabaseClient';
import { GlassCard } from '../../shared/components/GlassCard';
import { Button } from '../../shared/components/Button';
import { useAuth } from '../../auth/hooks/useAuth';

// ─── DEV MOCK DATA FOR AUDIT DASHBOARD ────────────────────────────────────────
const MOCK_AUDIT_REQUESTS = [
  {
    id: 'req-mock-001',
    user_id: 'usr-98124-yahya',
    course_id: 'course-clim-01',
    requested_name_ar: 'د. يحيى الزوادي',
    requested_name_en: 'Dr. Yahya Al-Zawadi',
    status: 'pending',
    requested_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    courses: {
      title_ar: 'زمالة طب الكوارث المناخية والبيئية',
      title_en: 'Climate & Environmental Disaster Medicine Fellowship',
      duration: '12 ساعة تدريبية'
    }
  },
  {
    id: 'req-mock-002',
    user_id: 'usr-11029-sara',
    course_id: 'course-clim-02',
    requested_name_ar: 'م. سارة أحمد الشمري',
    requested_name_en: 'Eng. Sara Al-Shammari',
    status: 'pending',
    requested_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    courses: {
      title_ar: 'الرصد الوبائي وتغير المناخ في المناطق الحضرية',
      title_en: 'Epidemiological Surveillance & Urban Climate Change',
      duration: '8 ساعات تدريبية'
    }
  }
];

const MOCK_METRICS = {
  'req-mock-001': [
    { max_percentage_watched: 98, actual_play_duration_seconds: 720 },
    { max_percentage_watched: 100, actual_play_duration_seconds: 940 },
    { max_percentage_watched: 95, actual_play_duration_seconds: 610 }
  ],
  'req-mock-002': [
    { max_percentage_watched: 99, actual_play_duration_seconds: 4 }, // Suspicious!
    { max_percentage_watched: 100, actual_play_duration_seconds: 6 }, // Suspicious!
    { max_percentage_watched: 88, actual_play_duration_seconds: 520 }
  ]
};

const MOCK_QUIZZES = {
  'req-mock-001': [
    { score: 95, passed: true, quizzes: { title_ar: 'الاختبار النهائي لطب الكوارث' } }
  ],
  'req-mock-002': [
    { score: 80, passed: true, quizzes: { title_ar: 'اختبار الرصد الوبائي الشامل' } }
  ]
};
// ─────────────────────────────────────────────────────────────────────────────

export function CertificateAuditDashboard({ lang = 'ar' }) {
  const isMock = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mock') === '1';
  const { hasPermission, loading: authLoading } = useAuth();
  const canAudit = isMock || hasPermission('issue:certs') || hasPermission('manage:system');

  const [requests, setRequests]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [metrics, setMetrics]           = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // ── Search & filter ──────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]   = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // ── Mobile layout ─────────────────────────────────────────────────────────
  const [isMobile, setIsMobile]         = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  const [mobileView, setMobileView]     = useState('list'); // 'list' | 'detail'

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => { loadRequests(); }, []);

  // ── Derived filtered list ─────────────────────────────────────────────────
  const filteredRequests = requests.filter(r => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q
      || r.requested_name_ar?.toLowerCase().includes(q)
      || r.requested_name_en?.toLowerCase().includes(q);
    const matchesCourse = !filterCourse || r.course_id === filterCourse;
    return matchesSearch && matchesCourse;
  });

  // Unique courses for dropdown
  const courseOptions = [...new Map(requests.map(r => [r.course_id, r.courses?.title_ar])).entries()];

  async function loadRequests() {
    setLoading(true);
    if (isMock) {
      setRequests(MOCK_AUDIT_REQUESTS);
      setLoading(false);
      return;
    }
    const { data: reqs } = await supabase
      .from('certificate_requests')
      .select('*, courses(title_ar, title_en, duration)')
      .eq('status', 'pending')
      .order('requested_at', { ascending: true });
    if (reqs) setRequests(reqs);
    setLoading(false);
  }

  async function loadMetricsForRequest(req) {
    setSelectedRequest(req);
    setRejectionReason('');
    if (isMobile) setMobileView('detail');

    if (isMock) {
      setMetrics(MOCK_METRICS[req.id] || []);
      setQuizAttempts(MOCK_QUIZZES[req.id] || []);
      return;
    }

    const { data: userMetrics } = await supabase
      .from('lesson_watch_metrics').select('*').eq('user_id', req.user_id);
    setMetrics(userMetrics || []);

    const { data: userQuizzes } = await supabase
      .from('quiz_attempts')
      .select('score, passed, quizzes(course_id, title_ar)')
      .eq('user_id', req.user_id).eq('passed', true);
    const courseQuizzes = (userQuizzes || []).filter(q => q.quizzes?.course_id === req.course_id);
    setQuizAttempts(courseQuizzes);
  }

  async function handleApprove(reqId) {
    setActionLoading(true);
    if (isMock) {
      setTimeout(() => {
        setRequests(prev => prev.filter(r => r.id !== reqId));
        setSelectedRequest(null);
        setMobileView('list');
        setActionLoading(false);
        alert(lang === 'ar' ? 'تم اعتماد الشهادة بنجاح! يمكن للمتدرب الآن استعراضها وتوثيقها.' : 'Certificate successfully approved!');
      }, 400);
      return;
    }
    const { error } = await supabase
      .from('certificate_requests').update({ status: 'approved' }).eq('id', reqId);
    if (!error) { setRequests(prev => prev.filter(r => r.id !== reqId)); setSelectedRequest(null); }
    setActionLoading(false);
  }

  async function handleReject(reqId) {
    if (!rejectionReason) {
      alert(lang === 'ar' ? 'يرجى كتابة سبب الرفض' : 'Please provide a rejection reason');
      return;
    }
    setActionLoading(true);
    if (isMock) {
      setTimeout(() => {
        setRequests(prev => prev.filter(r => r.id !== reqId));
        setSelectedRequest(null);
        setMobileView('list');
        setActionLoading(false);
        alert(lang === 'ar' ? 'تم رفض طلب الشهادة وإشعار المتدرب بالسبب.' : 'Certificate request rejected.');
      }, 400);
      return;
    }
    const { error } = await supabase
      .from('certificate_requests')
      .update({ status: 'rejected', rejection_reason: rejectionReason }).eq('id', reqId);
    if (!error) { setRequests(prev => prev.filter(r => r.id !== reqId)); setSelectedRequest(null); }
    setActionLoading(false);
  }

  if (authLoading) {
    return (
      <div style={{ padding: '120px 20px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <h2 style={{ color: '#0b2849', fontFamily: 'Tajawal, sans-serif' }}>
          {lang === 'ar' ? 'جاري التحقق من الصلاحيات...' : 'Checking Permissions...'}
        </h2>
      </div>
    );
  }

  if (!canAudit) {
    return (
      <div style={{ padding: '120px 20px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <GlassCard style={{ padding: '40px', textAlign: 'center', color: '#0b2849', boxShadow: 'none' }}>
          <h2>{lang === 'ar' ? 'غير مصرح بالدخول' : 'Access Denied'}</h2>
          <p>{lang === 'ar' ? 'ليس لديك صلاحيات لتدقيق الشهادات.' : 'You do not have permissions to audit certificates.'}</p>
        </GlassCard>
      </div>
    );
  }

  // ── Shared card styles ────────────────────────────────────────────────────
  const cardBase = {
    boxShadow: 'none',
    border: '1px solid rgba(11,40,73,0.1)',
    borderRadius: '12px',
    background: '#fff',
  };

  // ── List panel ────────────────────────────────────────────────────────────
  const ListPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, minWidth: 0 }}>

      {/* Search + Course filter row */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
        {/* Search */}
        <div style={{ flex: 2, minWidth: '160px', position: 'relative' }}>
          <svg style={{
            position: 'absolute', top: '50%',
            [lang === 'ar' ? 'right' : 'left']: '12px',
            transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1
          }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(11,40,73,0.4)" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder={lang === 'ar' ? 'بحث بالاسم...' : 'Search by name...'}
            value={searchQuery}
            onInput={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: lang === 'ar' ? '10px 38px 10px 14px' : '10px 14px 10px 38px',
              border: '1px solid rgba(11,40,73,0.15)', borderRadius: '10px',
              fontSize: '13px', outline: 'none', background: '#fff',
              fontFamily: 'Tajawal, Outfit, sans-serif', color: '#0b2849',
              direction: lang === 'ar' ? 'rtl' : 'ltr',
            }}
          />
        </div>

        {/* Custom course dropdown */}
        <div style={{ flex: 1, minWidth: '160px', position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: '8px', padding: '10px 14px',
              border: `1px solid ${dropdownOpen ? '#15b47a' : 'rgba(11,40,73,0.15)'}`,
              borderRadius: '10px', background: '#fff', cursor: 'pointer',
              fontSize: '13px', color: '#0b2849',
              fontFamily: 'Tajawal, Outfit, sans-serif',
              direction: lang === 'ar' ? 'rtl' : 'ltr',
              outline: 'none',
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {filterCourse
                ? (courseOptions.find(([id]) => id === filterCourse)?.[1] || (lang === 'ar' ? 'كل المساقات' : 'All Courses'))
                : (lang === 'ar' ? 'كل المساقات' : 'All Courses')}
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(11,40,73,0.4)" strokeWidth="2.5"
              style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)',
              [lang === 'ar' ? 'right' : 'left']: 0,
              minWidth: '100%', background: '#fff',
              border: '1px solid rgba(11,40,73,0.12)',
              borderRadius: '10px', zIndex: 999,
              overflow: 'hidden',
            }}>
              {[['', lang === 'ar' ? 'كل المساقات' : 'All Courses'], ...courseOptions].map(([id, title]) => (
                <div
                  key={id}
                  onClick={() => { setFilterCourse(id); setDropdownOpen(false); }}
                  style={{
                    padding: '10px 14px', cursor: 'pointer', fontSize: '13px',
                    fontFamily: 'Tajawal, Outfit, sans-serif',
                    color: filterCourse === id ? '#15b47a' : '#0b2849',
                    background: filterCourse === id ? 'rgba(21,180,122,0.07)' : 'transparent',
                    direction: lang === 'ar' ? 'rtl' : 'ltr',
                    transition: 'background 0.1s',
                  }}
                >
                  {title}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Counter */}
      <div style={{ fontSize: '12px', color: 'rgba(11,40,73,0.45)', fontFamily: 'Tajawal, sans-serif', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
        {filteredRequests.length} {lang === 'ar' ? 'طلب معلق' : 'pending request(s)'}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(11,40,73,0.4)', fontFamily: 'Tajawal, sans-serif' }}>
          {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </div>
      ) : filteredRequests.length === 0 ? (
        <div style={{ ...cardBase, padding: '40px', textAlign: 'center', color: 'rgba(11,40,73,0.4)', fontFamily: 'Tajawal, sans-serif' }}>
          {lang === 'ar' ? 'لا توجد طلبات.' : 'No requests found.'}
        </div>
      ) : filteredRequests.map(req => {
        const isActive = selectedRequest?.id === req.id;
        return (
          <div
            key={req.id}
            onClick={() => loadMetricsForRequest(req)}
            style={{
              ...cardBase,
              padding: '16px',
              border: isActive ? '2px solid #15b47a' : '1px solid rgba(11,40,73,0.1)',
              cursor: 'pointer',
              transition: 'border-color 0.15s',
              direction: lang === 'ar' ? 'rtl' : 'ltr',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', minWidth: 0 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontWeight: 'bold', color: '#0b2849', fontSize: '14px',
                  fontFamily: 'Tajawal, sans-serif',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  marginBottom: '2px'
                }}>
                  {req.requested_name_ar}
                </div>
                <div style={{
                  fontSize: '12px', color: 'rgba(11,40,73,0.5)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  fontFamily: 'Outfit, sans-serif',
                }}>
                  {req.requested_name_en}
                </div>
                <div style={{
                  marginTop: '6px', fontSize: '12px', color: 'rgba(11,40,73,0.55)',
                  fontFamily: 'Tajawal, sans-serif',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {req.courses?.title_ar}
                </div>
              </div>
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <span style={{
                  fontSize: '11px', background: '#ffb300', color: '#fff',
                  padding: '3px 10px', borderRadius: '20px', fontWeight: 'bold',
                  fontFamily: 'Tajawal, sans-serif', whiteSpace: 'nowrap',
                }}>
                  {lang === 'ar' ? 'قيد الانتظار' : 'Pending'}
                </span>
                {isMobile && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="rgba(11,40,73,0.3)" strokeWidth="2">
                    <polyline points={lang === 'ar' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'}/>
                  </svg>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Detail panel ──────────────────────────────────────────────────────────
  const DetailPanel = selectedRequest ? (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Mobile back button */}
      {isMobile && (
        <button
          onClick={() => { setMobileView('list'); setSelectedRequest(null); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#0b2849', fontFamily: 'Tajawal, sans-serif',
            fontSize: '14px', fontWeight: 'bold',
            padding: '0 0 14px 0', direction: lang === 'ar' ? 'rtl' : 'ltr',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points={lang === 'ar' ? '9 18 15 12 9 6' : '15 18 9 12 15 6'}/>
          </svg>
          {lang === 'ar' ? 'رجوع للقائمة' : 'Back to list'}
        </button>
      )}

      <div style={{ ...cardBase, padding: '22px', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
        {/* Header */}
        <div style={{ borderBottom: '1px solid rgba(11,40,73,0.08)', paddingBottom: '14px', marginBottom: '20px' }}>
          <h3 style={{ color: '#0b2849', margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold', fontFamily: 'Tajawal, sans-serif' }}>
            {lang === 'ar' ? 'تفاصيل التدقيق' : 'Audit Details'}
          </h3>
          <div style={{ fontSize: '13px', color: 'rgba(11,40,73,0.6)', fontFamily: 'Tajawal, sans-serif' }}>
            {selectedRequest.requested_name_ar} · {selectedRequest.courses?.title_ar}
          </div>
        </div>

        {/* Course */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'rgba(11,40,73,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px', fontFamily: 'Outfit, sans-serif' }}>
            {lang === 'ar' ? 'المساق' : 'Course'}
          </div>
          <div style={{ color: '#0b2849', fontFamily: 'Tajawal, sans-serif', fontSize: '14px', wordBreak: 'break-word' }}>
            {selectedRequest.courses?.title_ar}
          </div>
        </div>

        {/* Quiz Results */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'rgba(11,40,73,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px', fontFamily: 'Outfit, sans-serif' }}>
            {lang === 'ar' ? 'نتائج الاختبارات' : 'Quiz Results'}
          </div>
          {quizAttempts.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#e53e3e', padding: '10px 14px', background: 'rgba(229,62,62,0.07)', borderRadius: '8px', border: '1px solid rgba(229,62,62,0.2)', fontFamily: 'Tajawal, sans-serif' }}>
              {lang === 'ar' ? 'لا يوجد أي اختبار مجتاز مسجل.' : 'No passed quiz recorded.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {quizAttempts.map((q, i) => (
                <div key={i} style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(21,180,122,0.05)', border: '1px solid rgba(21,180,122,0.2)', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ color: '#0b2849', fontWeight: 'bold', fontFamily: 'Tajawal, sans-serif', wordBreak: 'break-word' }}>{q.quizzes?.title_ar || 'اختبار المساق'}</span>
                  <span style={{ color: '#15b47a', fontWeight: 'bold', fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap' }}>{q.score}% ✓</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Telemetry */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'rgba(11,40,73,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px', fontFamily: 'Outfit, sans-serif' }}>
            {lang === 'ar' ? 'سجل تتبع النزاهة' : 'Integrity Telemetry'}
          </div>
          {metrics.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#e53e3e', fontFamily: 'Tajawal, sans-serif' }}>
              {lang === 'ar' ? 'لا يوجد أي سجل نشاط. (احتمال تجاوز)' : 'No activity log found. (Possible bypass)'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {metrics.map((m, i) => {
                const suspicious = m.max_percentage_watched > 80 && m.actual_play_duration_seconds < 10;
                return (
                  <div key={i} style={{
                    padding: '12px 14px', borderRadius: '8px', fontSize: '12px',
                    background: suspicious ? 'rgba(229,62,62,0.07)' : 'rgba(21,180,122,0.05)',
                    border: `1px solid ${suspicious ? 'rgba(229,62,62,0.2)' : 'rgba(21,180,122,0.2)'}`,
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', color: suspicious ? '#e53e3e' : '#15b47a', fontFamily: 'Tajawal, sans-serif' }}>
                      {suspicious ? '⚠️ نشاط مشبوه (تخطي الفيديو)' : '✅ نشاط سليم'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', color: '#0b2849', fontFamily: 'Outfit, sans-serif' }}>
                      <div>{lang === 'ar' ? 'أقصى مشاهدة:' : 'Max watched:'} <strong>{Math.round(m.max_percentage_watched)}%</strong></div>
                      <div>{lang === 'ar' ? 'وقت التشغيل:' : 'Play time:'} <strong>{Math.round(m.actual_play_duration_seconds)}s</strong></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ borderTop: '1px dashed rgba(11,40,73,0.1)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Button
            variant="gradient"
            onClick={() => handleApprove(selectedRequest.id)}
            disabled={actionLoading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {actionLoading ? '...' : (lang === 'ar' ? 'اعتماد الشهادة ✓' : 'Approve Certificate ✓')}
          </Button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="text"
              placeholder={lang === 'ar' ? 'سبب الرفض (إلزامي)' : 'Rejection reason (required)'}
              value={rejectionReason}
              onInput={e => setRejectionReason(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 14px', border: '1px solid rgba(229,62,62,0.4)',
                borderRadius: '8px', outline: 'none', fontSize: '13px',
                fontFamily: 'Tajawal, Outfit, sans-serif', color: '#0b2849',
                direction: lang === 'ar' ? 'rtl' : 'ltr',
              }}
            />
            <Button
              variant="outline"
              onClick={() => handleReject(selectedRequest.id)}
              disabled={actionLoading || !rejectionReason}
              style={{ width: '100%', justifyContent: 'center', borderColor: '#e53e3e', color: '#e53e3e' }}
            >
              {lang === 'ar' ? 'رفض الطلب' : 'Reject Request'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>

      {/* Header Banner — no shadow */}
      <div style={{
        background: 'linear-gradient(135deg, #15b47a 0%, #0c8774 40%, #004c6d 100%)',
        padding: '130px 20px 44px 20px',
        textAlign: 'center',
        direction: lang === 'ar' ? 'rtl' : 'ltr',
      }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 'bold', color: '#fff',
            marginBottom: '12px', fontFamily: lang === 'ar' ? 'Tajawal, sans-serif' : 'Outfit, sans-serif',
          }}>
            {lang === 'ar' ? 'تدقيق طلبات الشهادات' : 'Certificate Audit Dashboard'}
          </h1>
          <p style={{
            fontSize: 'clamp(13px, 1.6vw, 15px)', color: 'rgba(255,255,255,0.85)',
            maxWidth: '600px', margin: '0 auto', lineHeight: '1.7',
            fontFamily: lang === 'ar' ? 'Tajawal, sans-serif' : 'Outfit, sans-serif',
          }}>
            {lang === 'ar'
              ? 'مراجعة سجلات التتبع والتحقق من إتمام المساقات قبل اعتماد الشهادات رسمياً.'
              : 'Review telemetry logs and verify course completion before issuing official certificates.'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ flexGrow: 1, padding: '32px 16px 80px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '20px',
          alignItems: 'flex-start',
          direction: lang === 'ar' ? 'rtl' : 'ltr',
        }}>
          {/* On mobile: show only the active panel */}
          {(!isMobile || mobileView === 'list') && ListPanel}
          {(!isMobile || mobileView === 'detail') && DetailPanel}
        </div>
      </div>

    </div>
  );
}


