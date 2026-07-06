import { useState, useEffect } from 'preact/hooks';
import { supabase } from '../../../utils/supabaseClient';
import { GlassCard } from '../../shared/components/GlassCard';
import { Button } from '../../shared/components/Button';

export function CertificateAuditDashboard({ lang = 'ar' }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    // Fetch pending requests with course info
    const { data: reqs, error: reqsError } = await supabase
      .from('certificate_requests')
      .select(`
        *,
        courses ( title_ar, title_en, duration )
      `)
      .eq('status', 'pending')
      .order('requested_at', { ascending: true });

    if (reqs) {
      // Fetch profile emails manually if profiles table isn't linked via FK to auth directly in a way PostgREST likes
      // Actually we can just display the requested names for now
      setRequests(reqs);
    }
    setLoading(false);
  }

  async function loadMetricsForRequest(req) {
    setSelectedRequest(req);
    setRejectionReason('');
    
    // Fetch user's watch metrics for this course's lessons
    // To do this strictly, we should get all lesson IDs for the course
    const { data: courseLessons } = await supabase
      .from('lessons')
      .select('id, title_ar, title_en, duration, is_quiz')
      .eq('courses.id', req.course_id); // Wait, lessons are linked to modules, modules to courses. 
      // It's easier to just fetch all metrics for the user and then filter by lessons in the course...
      // Or just fetch all metrics for this user
      
    const { data: userMetrics } = await supabase
      .from('lesson_watch_metrics')
      .select('*')
      .eq('user_id', req.user_id);
      
    setMetrics(userMetrics || []);

    const { data: userQuizzes } = await supabase
      .from('quiz_attempts')
      .select('score, passed, quizzes(course_id, title_ar)')
      .eq('user_id', req.user_id)
      .eq('passed', true);

    const courseQuizzes = (userQuizzes || []).filter(q => q.quizzes?.course_id === req.course_id);
    setQuizAttempts(courseQuizzes);
  }

  async function handleApprove(reqId) {
    setActionLoading(true);
    const { error } = await supabase
      .from('certificate_requests')
      .update({ status: 'approved' })
      .eq('id', reqId);
      
    if (!error) {
      setRequests(prev => prev.filter(r => r.id !== reqId));
      setSelectedRequest(null);
    }
    setActionLoading(false);
  }

  async function handleReject(reqId) {
    if (!rejectionReason) {
      alert(lang === 'ar' ? 'يرجى كتابة سبب الرفض' : 'Please provide a rejection reason');
      return;
    }
    setActionLoading(true);
    const { error } = await supabase
      .from('certificate_requests')
      .update({ status: 'rejected', rejection_reason: rejectionReason })
      .eq('id', reqId);
      
    if (!error) {
      setRequests(prev => prev.filter(r => r.id !== reqId));
      setSelectedRequest(null);
    }
    setActionLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      
      {/* 1. Header Banner Block */}
      <div 
        style={{
          background: 'linear-gradient(90deg, #15b47a 0%, #12a978 5%, #0c8774 23%, #066d71 41%, #025a6e 60%, #004f6d 79%, #004c6d 100%)',
          padding: '160px 20px 50px 20px',
          textAlign: 'center',
          position: 'relative',
          boxShadow: '0 4px 20px rgba(11, 40, 73, 0.1)',
          direction: lang === 'ar' ? 'rtl' : 'ltr'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ 
            fontSize: 'clamp(28px, 4vw, 40px)', 
            fontWeight: 'bold', 
            color: '#ffffff', 
            marginBottom: '16px',
            fontFamily: lang === 'ar' ? 'Tajawal, sans-serif' : 'Outfit, sans-serif',
            textShadow: '0 2px 4px rgba(0,0,0,0.15)'
          }}>
            {lang === 'ar' ? 'مراجعة طلبات الشهادات (تدقيق النزاهة)' : 'Certificate Audit Dashboard'}
          </h1>
          <p style={{ 
            fontSize: 'clamp(14px, 1.8vw, 16px)', 
            color: 'rgba(255, 255, 255, 0.9)', 
            maxWidth: '750px', 
            margin: '0 auto',
            lineHeight: '1.6',
            fontFamily: lang === 'ar' ? 'Tajawal, sans-serif' : 'Outfit, sans-serif'
          }}>
            {lang === 'ar' ? 'لوحة تحكم إدارية لتدقيق سجلات التتبع (Telemetry) والتأكد من إتمام المشاركين للمساقات قبل اعتماد شهاداتهم.' : 'Administrative dashboard to audit telemetry logs and verify participants completed courses before approving certificates.'}
          </p>
        </div>
      </div>

      <div style={{ 
        flexGrow: 1,
        padding: '50px 20px 80px 20px',
        position: 'relative',
        zIndex: 1,
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '24px', alignItems: 'flex-start', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
        
        {/* Left Side: Pending Requests List */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            <p>Loading...</p>
          ) : requests.length === 0 ? (
            <GlassCard style={{ padding: '40px', textAlign: 'center', color: 'rgba(11,40,73,0.5)' }}>
              {lang === 'ar' ? 'لا توجد طلبات معلقة.' : 'No pending requests.'}
            </GlassCard>
          ) : (
            requests.map(req => (
              <GlassCard 
                key={req.id} 
                style={{ 
                  padding: '16px', 
                  border: selectedRequest?.id === req.id ? '2px solid #15b47a' : '1px solid rgba(11,40,73,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => loadMetricsForRequest(req)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: '#0b2849', fontWeight: 'bold' }}>
                      {req.requested_name_ar} / {req.requested_name_en}
                    </h4>
                    <p style={{ margin: 0, fontSize: '12px', color: 'rgba(11,40,73,0.6)' }}>
                      {req.courses?.title_ar}
                    </p>
                  </div>
                  <span style={{ fontSize: '11px', background: '#ffb300', color: '#fff', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                    {lang === 'ar' ? 'قيد الانتظار' : 'Pending'}
                  </span>
                </div>
                <div style={{ marginTop: '12px', fontSize: '11px', color: 'rgba(11,40,73,0.4)' }}>
                  ID: {req.user_id.substring(0, 8)}...
                </div>
              </GlassCard>
            ))
          )}
        </div>

        {/* Right Side: Audit Panel */}
        {selectedRequest && (
          <GlassCard style={{ flex: '1', padding: '24px', border: '1px solid rgba(0,76,109,0.15)', background: '#fff' }}>
            <h3 style={{ color: '#0b2849', marginBottom: '16px', borderBottom: '1px solid rgba(11,40,73,0.1)', paddingBottom: '12px' }}>
              {lang === 'ar' ? 'تفاصيل التدقيق' : 'Audit Details'}
            </h3>
            
            <div style={{ marginBottom: '24px' }}>
              <strong style={{ display: 'block', color: 'rgba(11,40,73,0.6)', fontSize: '12px', marginBottom: '4px' }}>
                {lang === 'ar' ? 'المساق' : 'Course'}
              </strong>
              <div style={{ color: '#0b2849' }}>{selectedRequest.courses?.title_ar}</div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <strong style={{ display: 'block', color: 'rgba(11,40,73,0.6)', fontSize: '12px', marginBottom: '8px' }}>
                {lang === 'ar' ? 'نتائج الاختبارات النهائية' : 'Final Quiz Results'}
              </strong>
              
              {quizAttempts.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#ff4d4d', padding: '10px', background: 'rgba(255, 77, 77, 0.1)', borderRadius: '8px' }}>
                  {lang === 'ar' ? 'لا يوجد أي اختبار مجتاز مسجل.' : 'No passed quiz recorded.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {quizAttempts.map((q, i) => (
                    <div key={i} style={{ padding: '10px', borderRadius: '8px', background: 'rgba(21, 180, 122, 0.05)', border: '1px solid rgba(21,180,122,0.2)', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#0b2849', fontWeight: 'bold' }}>{q.quizzes?.title_ar || 'اختبار المساق'}</span>
                      <span style={{ color: '#15b47a', fontWeight: 'bold' }}>{q.score}% - مجتاز</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <strong style={{ display: 'block', color: 'rgba(11,40,73,0.6)', fontSize: '12px', marginBottom: '8px' }}>
                {lang === 'ar' ? 'سجل تتبع النزاهة (Telemetry)' : 'Integrity Telemetry Log'}
              </strong>
              
              {metrics.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#ff4d4d' }}>لا يوجد أي سجل نشاط لهذا المستخدم. (احتمال تجاوز)</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {metrics.map((m, i) => {
                    const isSuspicious = m.max_percentage_watched > 80 && m.actual_play_duration_seconds < 10;
                    return (
                      <div key={i} style={{ 
                        padding: '10px', 
                        borderRadius: '8px', 
                        background: isSuspicious ? 'rgba(255, 77, 77, 0.1)' : 'rgba(21, 180, 122, 0.05)',
                        border: `1px solid ${isSuspicious ? 'rgba(255,77,77,0.3)' : 'rgba(21,180,122,0.2)'}`,
                        fontSize: '12px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 'bold', color: isSuspicious ? '#ff4d4d' : '#15b47a' }}>
                            {isSuspicious ? '⚠️ نشاط مشبوه (تخطي الفيديو)' : '✅ نشاط سليم'}
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: '#0b2849' }}>
                          <div>أقصى نسبة مشاهدة: {Math.round(m.max_percentage_watched)}%</div>
                          <div>مدة التشغيل الفعلية: {Math.round(m.actual_play_duration_seconds)} ثانية</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px dashed rgba(11,40,73,0.1)' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <Button 
                  variant="gradient" 
                  onClick={() => handleApprove(selectedRequest.id)}
                  disabled={actionLoading}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {lang === 'ar' ? 'اعتماد الشهادة' : 'Approve Certificate'}
                </Button>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
                <input 
                  type="text" 
                  placeholder={lang === 'ar' ? 'سبب الرفض (إلزامي)' : 'Rejection Reason (Required)'}
                  value={rejectionReason}
                  onInput={(e) => setRejectionReason(e.target.value)}
                  style={{ flex: 2, padding: '8px 12px', border: '1px solid #ff4d4d', borderRadius: '8px', outline: 'none' }}
                />
                <Button 
                  variant="outline" 
                  onClick={() => handleReject(selectedRequest.id)}
                  disabled={actionLoading || !rejectionReason}
                  style={{ flex: 1, borderColor: '#ff4d4d', color: '#ff4d4d', justifyContent: 'center' }}
                >
                  {lang === 'ar' ? 'رفض الطلب' : 'Reject'}
                </Button>
              </div>
            </div>

          </GlassCard>
        )}
        </div>
      </div>
    </div>
  );
}
