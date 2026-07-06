import { useState, useEffect, useRef } from 'preact/hooks';
import { Button } from '../../../shared/components/Button';
import { supabase } from '../../../../utils/supabaseClient';
import { QuizWidget } from '../quizzes/QuizWidget';
import { RichTextRenderer } from '../../../shared/components/RichTextRenderer';
import { AmbientParticles } from '../../../shared/components/AmbientParticles';
import { ShareActionButtons } from '../../../shared/components/ShareActionButtons';
import { CustomVideoPlayer } from '../player/CustomVideoPlayer';
import {
  fetchCourseSyllabus,
  fetchCompletedLessons,
  markLessonComplete,
  unmarkLessonComplete,
  fetchQuiz,
  submitQuizAttempt,
  fetchPassedAttempt
} from '../../services/lmsService';

export function CourseDetailModal({ lang = 'ar', course, userId, isLocked, onUpgrade, onClose, onLessonCompleted, onCourseCompleted, onDownloadCertificate }) {
  const [modules, setModules] = useState([]);
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [completedSet, setCompletedSet] = useState(new Set());
  const [quizData, setQuizData] = useState(null);
  const [quizMode, setQuizMode] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [lastQuizScore, setLastQuizScore] = useState(null);
  const [collapsedModules, setCollapsedModules] = useState(new Set());

  const [loading, setLoading] = useState(true);

  // Certificate Request State
  const [certRequest, setCertRequest] = useState(null);
  const [certRequestLoading, setCertRequestLoading] = useState(false);
  const [certNameAr, setCertNameAr] = useState('');
  const [certNameEn, setCertNameEn] = useState('');


  if (!course) return null;

  const allLessons = modules.flatMap(m => m.lessons || []);
  const activeLesson = allLessons.find(l => l.id === activeLessonId) || allLessons[0];

  // ─── Body Scroll Lock ─────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // ─── Load Syllabus + Progress ─────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [syllabus, { completedSet }] = await Promise.all([
          fetchCourseSyllabus(course.id),
          fetchCompletedLessons(userId, course.id),
        ]);
        setModules(syllabus || []);
        setCompletedSet(completedSet);

        const params = new URLSearchParams(window.location.search);
        const urlLessonId = params.get('lesson');

        let targetLessonId = null;
        if (urlLessonId) {
          const exists = (syllabus || []).some(m => m.lessons?.some(l => l.id === urlLessonId));
          if (exists) targetLessonId = urlLessonId;
        }
        
        if (!targetLessonId) {
          targetLessonId = (syllabus?.[0]?.lessons || [])[0]?.id;
        }

        if (targetLessonId) setActiveLessonId(targetLessonId);
      } catch (err) {
        console.error('CourseDetailModal load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [course.id, userId]);

  useEffect(() => {
    async function loadCertRequest() {
      if (allLessons.length > 0 && completedSet.size === allLessons.length) {
        setCertRequestLoading(true);
        const { data, error } = await supabase
          .from('certificate_requests')
          .select('*')
          .eq('course_id', course.id)
          .eq('user_id', userId)
          .single();
        if (data) {
          setCertRequest(data);
          if (data.requested_name_ar) setCertNameAr(data.requested_name_ar);
          if (data.requested_name_en) setCertNameEn(data.requested_name_en);
        }
        setCertRequestLoading(false);
      }
    }
    loadCertRequest();
  }, [completedSet.size, allLessons.length, course.id, userId]);

  async function handleSubmitCertRequest() {
    if (!certNameAr || !certNameEn) {
      alert(lang === 'ar' ? 'يرجى إدخال اسمك باللغتين العربية والإنجليزية.' : 'Please enter your name in both Arabic and English.');
      return;
    }
    setCertRequestLoading(true);
    const payload = {
      course_id: course.id,
      user_id: userId,
      requested_name_ar: certNameAr,
      requested_name_en: certNameEn,
      status: 'pending',
      rejection_reason: null,
      requested_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('certificate_requests')
      .upsert(payload, { onConflict: 'user_id, course_id' })
      .select()
      .single();

    if (!error && data) {
      setCertRequest(data);
    } else {
      console.error('Submit Cert Request Error:', error);
      alert(lang === 'ar' ? 'حدث خطأ أثناء تقديم الطلب.' : 'An error occurred while submitting the request.');
    }
    setCertRequestLoading(false);
  }

  // ─── URL Syncing ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeLessonId) return;
    const url = new URL(window.location);
    url.searchParams.set('course', course.id);
    url.searchParams.set('lesson', activeLessonId);
    window.history.replaceState({}, '', url);
  }, [course.id, activeLessonId]);

  // ─── Load Quiz + Video when lesson changes ────────────────────────────────
  useEffect(() => {
    if (!activeLessonId) return;
    setQuizData(null);
    setQuizMode(false);
    async function loadLessonData() {
      try {
        // Check quiz
        const quiz = await fetchQuiz(course.id, activeLessonId);
        setQuizData(quiz);

        // Check if already passed
        if (quiz) {
          const attempt = await fetchPassedAttempt(userId, quiz.id);
          if (attempt) {
            setQuizPassed(true);
            setLastQuizScore(attempt.score);
            // Retroactively ensure this lesson is in the completedSet
            setCompletedSet(prev => {
              if (!prev.has(activeLessonId)) {
                const newSet = new Set([...prev, activeLessonId]);
                // Try to sync it with DB just in case it was missing
                markLessonComplete(userId, activeLessonId).catch(console.error);
                return newSet;
              }
              return prev;
            });
          } else {
            setQuizPassed(false);
            setLastQuizScore(null);
          }
        } else {
          setQuizPassed(false);
          setLastQuizScore(null);
        }
      } catch (err) {
        console.error('Lesson data load error:', err);
      }
    }

    loadLessonData();
  }, [activeLessonId]);

  // ─── Quiz Completion ──────────────────────────────────────────────────────
  async function handleQuizFinished(score, passed, quizId) {
    setLastQuizScore(score);
    // Persist the attempt
    try {
      await submitQuizAttempt(userId, quizId, score, passed);
    } catch (err) {
      console.error('Quiz submit error:', err);
    }

    if (passed) {
      setQuizPassed(true);

      // Mark lesson complete
      try {
        await markLessonComplete(userId, activeLessonId);
        const newSet = new Set([...completedSet, activeLessonId]);
        setCompletedSet(newSet);

        const completedCount = newSet.size;
        const total = allLessons.length;
        const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
        const remaining = total - completedCount;

        if (onLessonCompleted) onLessonCompleted(course.id, pct, remaining);
      } catch (err) {
        console.error('Mark complete error:', err);
        if (err.code === '42501' || err.message?.includes('violates row-level security')) {
          // Teaser user or no DB permission: keep it in memory
          const newSet = new Set([...completedSet, activeLessonId]);
          setCompletedSet(newSet);
          
          const completedCount = newSet.size;
          const total = allLessons.length;
          const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
          const remaining = total - completedCount;
          if (onLessonCompleted) onLessonCompleted(course.id, pct, remaining);
        }
      }
    }
  }

  // Mark complete without quiz (for text lessons without a quiz)
  async function handleMarkComplete() {
    if (completedSet.has(activeLessonId)) return;
    try {
      await markLessonComplete(userId, activeLessonId);
      const newSet = new Set([...completedSet, activeLessonId]);
      setCompletedSet(newSet);

      const completedCount = newSet.size;
      const total = allLessons.length;
      const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
      const remaining = total - completedCount;

      if (onLessonCompleted) onLessonCompleted(course.id, pct, remaining);
    } catch (err) {
      console.error('Mark complete error:', err);
      if (err.code === '42501' || err.message?.includes('violates row-level security')) {
        const newSet = new Set([...completedSet, activeLessonId]);
        setCompletedSet(newSet);
        const completedCount = newSet.size;
        const total = allLessons.length;
        const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
        const remaining = total - completedCount;
        if (onLessonCompleted) onLessonCompleted(course.id, pct, remaining);
      }
    }
  }

  async function handleUnmarkComplete() {
    if (!completedSet.has(activeLessonId)) return;
    try {
      await unmarkLessonComplete(userId, activeLessonId);
      const newSet = new Set(completedSet);
      newSet.delete(activeLessonId);
      setCompletedSet(newSet);

      const completedCount = newSet.size;
      const total = allLessons.length;
      const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
      const remaining = total - completedCount;

      if (onLessonCompleted) onLessonCompleted(course.id, pct, remaining);
    } catch (err) {
      console.error('Unmark complete error:', err);
    }
  }


  const lessonTitle = activeLesson
    ? (lang === 'ar' ? activeLesson.title_ar : (activeLesson.title_en || activeLesson.title_ar))
    : '';
  const lessonContent = activeLesson
    ? (lang === 'ar' ? activeLesson.content_ar : (activeLesson.content_en || activeLesson.content_ar))
    : '';

  const isCurrentCompleted = completedSet.has(activeLessonId);

  function toggleModuleCollapse(modId) {
    setCollapsedModules(prev => {
      const next = new Set(prev);
      if (next.has(modId)) next.delete(modId);
      else next.add(modId);
      return next;
    });
  }

  return (
    <>
      <div style={{
        position: 'fixed', inset: 0,
        background: '#ffffff',
        zIndex: 1000,
        direction: lang === 'ar' ? 'rtl' : 'ltr',
        textAlign: lang === 'ar' ? 'right' : 'left',
      display: 'flex', flexDirection: 'column',
      width: '100vw', height: '100vh',
      overflow: 'hidden'
    }}>
      <div style={{
        background: 'transparent',
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '32px 32px 24px 32px', borderBottom: '1px solid rgba(11,40,73,0.08)', background: '#ffffff', flexShrink: 0 }}>
          <div>
            <span style={{ fontSize: '11px', color: isLocked ? '#ffb300' : '#15b47a', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>
              {isLocked 
                ? (lang === 'ar' ? 'معاينة المساق' : 'Course Preview')
                : (lang === 'ar' ? 'مساق نشط' : 'Active Course')
              }
            </span>
            <h2 style={{ color: '#0b2849', fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
              {lang === 'ar' ? course.title_ar : (course.title_en || course.title_ar)}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {!isLocked && (
              <span style={{ fontSize: '13px', color: '#15b47a', fontWeight: 'bold' }}>
                {allLessons.length > 0 ? Math.round((completedSet.size / allLessons.length) * 100) : 0}% {lang === 'ar' ? 'مكتمل' : 'complete'}
              </span>
            )}
            
            <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
              <ShareActionButtons lang={lang} title={lang === 'ar' ? course.title_ar : (course.title_en || course.title_ar)} />

              <button 
                onClick={onClose} 
                style={{ background: 'rgba(11,40,73,0.06)', border: 'none', fontSize: '20px', color: '#0b2849', cursor: 'pointer', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                title={lang === 'ar' ? 'إغلاق' : 'Close'}
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(11,40,73,0.5)' }}>
            {lang === 'ar' ? 'جاري تحميل المنهج...' : 'Loading syllabus...'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexGrow: 1, minHeight: 0, height: 'calc(100vh - 80px)' }}>

            {/* Sidebar: Module + Lesson List */}
            {!isLocked && (
              <div style={{ width: '300px', borderInlineEnd: '1px solid rgba(11,40,73,0.08)', overflowY: 'auto', padding: '24px 20px', flexShrink: 0, background: '#f8fafc' }}>
              {modules.map(mod => {
                const isCollapsed = collapsedModules.has(mod.id);
                return (
                  <div key={mod.id} style={{ marginBottom: '20px' }}>
                    <button 
                      onClick={() => toggleModuleCollapse(mod.id)}
                      style={{ 
                        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: 'none', border: 'none', cursor: 'pointer', padding: '4px', 
                        textAlign: lang === 'ar' ? 'right' : 'left', marginBottom: '4px'
                      }}
                    >
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#004c6d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {lang === 'ar' ? mod.title_ar : (mod.title_en || mod.title_ar)}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#004c6d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isCollapsed ? (lang === 'ar' ? 'rotate(90deg)' : 'rotate(-90deg)') : 'rotate(0deg)', transition: 'transform 0.2s', opacity: 0.6 }}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </button>
                    
                    {!isCollapsed && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', marginTop: '8px' }}>
                        
                        {(mod.lessons || []).map((les, index) => {
                      const isActive = activeLessonId === les.id;
                      const isDone = completedSet.has(les.id);
                      const title = lang === 'ar' ? les.title_ar : (les.title_en || les.title_ar);
                      return (
                        <div key={les.id} style={{ display: 'flex', position: 'relative', zIndex: 2 }}>
                          
                          {/* Timeline Progress Node Container */}
                          <div style={{ 
                            width: '30px', 
                            display: 'flex', 
                            justifyContent: 'center',
                            flexShrink: 0,
                            position: 'relative'
                          }}>
                            {/* Top Line (from previous lesson) */}
                            {index !== 0 && (
                              <div style={{
                                position: 'absolute',
                                top: '-4px', // Reach into half of the 8px gap
                                height: 'calc(50% + 4px)',
                                width: '2px',
                                background: completedSet.has(mod.lessons[index - 1].id) ? '#15b47a' : 'rgba(11, 40, 73, 0.08)',
                                zIndex: 1
                              }} />
                            )}

                            {/* Bottom Line (to next lesson) */}
                            {index !== mod.lessons.length - 1 && (
                              <div style={{
                                position: 'absolute',
                                top: '50%',
                                height: 'calc(50% + 4px)',
                                width: '2px',
                                background: isDone ? '#15b47a' : 'rgba(11, 40, 73, 0.08)',
                                zIndex: 1
                              }} />
                            )}

                            {/* The Dot */}
                            <div style={{
                              width: '14px', height: '14px', borderRadius: '50%',
                              background: isDone ? '#15b47a' : (isActive ? '#004c6d' : '#ffffff'),
                              border: `2px solid ${isDone ? '#15b47a' : (isActive ? '#004c6d' : 'rgba(11, 40, 73, 0.2)')}`,
                              boxShadow: isActive ? '0 0 0 4px rgba(0, 76, 109, 0.15)' : (isDone ? '0 0 0 4px rgba(21, 180, 122, 0.15)' : 'none'),
                              transition: 'all 0.2s ease',
                              position: 'absolute',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              zIndex: 3,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {isDone && (
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              )}
                            </div>
                          </div>

                          {/* The Card */}
                          <div
                            onClick={() => { setActiveLessonId(les.id); setQuizMode(false); }}
                            style={{
                              flexGrow: 1,
                              padding: '12px 14px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px',
                              background: isActive ? '#004c6d' : 'transparent',
                              color: isActive ? '#fff' : '#0b2849',
                              border: '1px solid rgba(11,40,73,0.07)',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              fontWeight: isActive ? 'bold' : 'normal', transition: 'all 0.15s',
                              gap: '12px'
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flexGrow: 1 }}>
                              <span>{title}</span>
                              {les.duration && (
                                <span style={{ fontSize: '11px', opacity: isActive ? 0.8 : 0.5, fontWeight: 'normal' }}>
                                  {les.duration} {lang === 'ar' ? 'دقيقة' : 'mins'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {modules.length === 0 && (
                <p style={{ fontSize: '13px', color: 'rgba(11,40,73,0.4)', textAlign: 'center', padding: '20px 0' }}>
                  {lang === 'ar' ? 'لا توجد وحدات بعد.' : 'No modules yet.'}
                </p>
              )}
              
              {/* Virtual Certificate Module */}
              {allLessons.length > 0 && completedSet.size === allLessons.length && (
                 <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px dashed rgba(11,40,73,0.1)' }}>
                   <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#15b47a', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                     {lang === 'ar' ? 'الوحدة النهائية' : 'Final Module'}
                   </span>
                   <div style={{ display: 'flex', marginTop: '12px' }}>
                     <div
                        onClick={() => { setActiveLessonId('CERTIFICATE_MODULE'); setQuizMode(false); }}
                        style={{
                          flexGrow: 1,
                          padding: '12px 14px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px',
                          background: activeLessonId === 'CERTIFICATE_MODULE' ? '#15b47a' : 'transparent',
                          color: activeLessonId === 'CERTIFICATE_MODULE' ? '#fff' : '#0b2849',
                          border: `1px solid ${activeLessonId === 'CERTIFICATE_MODULE' ? '#15b47a' : 'rgba(21,180,122,0.3)'}`,
                          display: 'flex', gap: '12px', alignItems: 'center', fontWeight: 'bold'
                        }}
                     >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15l-2 5l9-5-9-5-2 5z"/></svg>
                        {certRequest?.status === 'approved' 
                          ? (lang === 'ar' ? 'عرض الشهادة المعتمدة' : 'View Official Certificate')
                          : (lang === 'ar' ? 'طلب الشهادة المعتمدة' : 'Official Certificate Request')}
                     </div>
                   </div>
                 </div>
              )}
            </div>
            )}

            {/* Main Content Panel Wrapper */}
            <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
              <AmbientParticles />
              {/* Main Content Panel */}
              <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '40px', zIndex: 1 }}>
                {isLocked ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                  {course.cover_image ? (
                    <img src={course.cover_image} alt={course.title_en || course.title_ar} style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '20px', marginBottom: '32px', boxShadow: '0 16px 40px rgba(0,76,109,0.15)' }} />
                  ) : (
                    <div style={{ width: '100%', height: '300px', background: 'linear-gradient(135deg, #0b2849, #004c6d)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
                      <svg width="84" height="84" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
                      </svg>
                    </div>
                  )}
                  <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#0b2849', marginBottom: '16px' }}>
                    {lang === 'ar' ? course.title_ar : (course.title_en || course.title_ar)}
                  </h2>
                  <p style={{ fontSize: '18px', color: 'rgba(11,40,73,0.7)', lineHeight: '1.8', marginBottom: '40px', maxWidth: '600px' }}>
                    {lang === 'ar' ? course.description_ar : (course.description_en || course.description_ar)}
                  </p>
                  
                  <div style={{ background: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255,193,7,0.3)', padding: '24px 40px', borderRadius: '16px', display: 'inline-block' }}>
                    <div style={{ marginBottom: '16px', color: '#ffb300', display: 'flex', justifyContent: 'center' }}>
                      <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </div>
                    <h3 style={{ fontSize: '20px', color: '#0b2849', marginBottom: '12px', fontWeight: 'bold' }}>
                      {lang === 'ar' ? 'هذا المساق مغلق' : 'This Course is Locked'}
                    </h3>
                    <p style={{ color: 'rgba(11,40,73,0.6)', marginBottom: '24px' }}>
                      {lang === 'ar' ? 'يرجى ترقية حسابك للحصول على صلاحية الوصول الكاملة.' : 'Please upgrade your account to get full access to this course.'}
                    </p>
                    <Button variant="gradient" onClick={onUpgrade}>
                      {lang === 'ar' ? 'ترقية الحساب الآن' : 'Upgrade Account Now'}
                    </Button>
                  </div>
                </div>
              ) : quizMode && quizData ? (
                <QuizWidget
                  lang={lang}
                  quizData={quizData}
                  onQuizFinished={handleQuizFinished}
                  onClose={() => setQuizMode(false)}
                />
              ) : activeLessonId === 'CERTIFICATE_MODULE' ? (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '700px', margin: '0 auto', textAlign: lang === 'ar' ? 'right' : 'left' }}>
                  <h3 style={{ color: '#0b2849', fontSize: '26px', fontWeight: 'bold', marginBottom: '16px' }}>
                    {lang === 'ar' ? 'تهانينا على إتمام المساق!' : 'Congratulations on completing the course!'}
                  </h3>
                  <p style={{ color: 'rgba(11,40,73,0.7)', fontSize: '16px', marginBottom: '32px', lineHeight: '1.6' }}>
                    {lang === 'ar' ? 'لقد أكملت جميع الدروس واجتزت المتطلبات. يمكنك الآن تقديم طلب للحصول على شهادتك المعتمدة ليتم مراجعتها من قبل الإدارة وإصدارها رسمياً.' : 'You have completed all lessons and requirements. You can now submit a request for your official certificate to be reviewed and issued.'}
                  </p>
                  
                  {certRequest?.status === 'approved' ? (
                    <div style={{ padding: '30px', background: 'rgba(21, 180, 122, 0.1)', borderRadius: '16px', border: '1px solid rgba(21, 180, 122, 0.3)', textAlign: 'center' }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#15b47a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', margin: '0 auto' }}><polyline points="20 6 9 17 4 12"/></svg>
                      <h4 style={{ fontSize: '20px', color: '#15b47a', fontWeight: 'bold', marginBottom: '12px' }}>
                        {lang === 'ar' ? 'تم اعتماد شهادتك بنجاح!' : 'Certificate Approved!'}
                      </h4>
                      <Button 
                        variant="gradient" 
                        onClick={() => {
                          if (onDownloadCertificate) onDownloadCertificate(certRequest);
                        }}
                        style={{ marginTop: '16px', margin: '0 auto', display: 'flex' }}
                      >
                        {lang === 'ar' ? 'تحميل الشهادة' : 'Download Certificate'}
                      </Button>
                    </div>
                  ) : certRequest?.status === 'pending' ? (
                    <div style={{ padding: '30px', background: 'rgba(255, 179, 0, 0.1)', borderRadius: '16px', border: '1px solid rgba(255, 179, 0, 0.3)', textAlign: 'center' }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ffb300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', margin: '0 auto' }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <h4 style={{ fontSize: '20px', color: '#ffb300', fontWeight: 'bold', marginBottom: '12px' }}>
                        {lang === 'ar' ? 'طلبك قيد المراجعة' : 'Request Pending Review'}
                      </h4>
                      <p style={{ color: 'rgba(11,40,73,0.7)', maxWidth: '500px', margin: '0 auto' }}>
                        {lang === 'ar' ? 'يقوم فريقنا بمراجعة سجل الحضور وتقدمك في المساق للتأكد من استيفاء جميع الشروط. سيتم إشعارك فور الاعتماد.' : 'Our team is reviewing your attendance and progress to ensure all requirements are met. You will be notified upon approval.'}
                      </p>
                    </div>
                  ) : (
                    <div style={{ background: '#ffffff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 24px rgba(11,40,73,0.06)' }}>
                      {certRequest?.status === 'rejected' && (
                        <div style={{ padding: '20px', background: 'rgba(255, 77, 77, 0.1)', border: '1px solid rgba(255, 77, 77, 0.3)', borderRadius: '12px', marginBottom: '24px' }}>
                          <h4 style={{ color: '#ff4d4d', fontWeight: 'bold', marginBottom: '8px' }}>
                            {lang === 'ar' ? 'تنبيه: تم رفض الطلب لوجود خلل' : 'Alert: Request Denied'}
                          </h4>
                          <p style={{ color: '#ff4d4d', fontSize: '14px', margin: 0 }}>
                            {certRequest.rejection_reason || (lang === 'ar' ? 'لم يتم استيفاء معايير الحضور وتخطي الفيديوهات.' : 'Course attendance criteria not met.')}
                          </p>
                        </div>
                      )}
                      
                      <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#0b2849' }}>
                          {lang === 'ar' ? 'الاسم الثلاثي باللغة العربية' : 'Full Name in Arabic'}
                        </label>
                        <input 
                          type="text" 
                          value={certNameAr}
                          onInput={e => setCertNameAr(e.target.value)}
                          placeholder="مثال: د. محمد أحمد عبدلله"
                          style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(11,40,73,0.15)', fontSize: '15px' }}
                        />
                      </div>
                      
                      <div style={{ marginBottom: '32px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#0b2849' }}>
                          {lang === 'ar' ? 'الاسم الثلاثي باللغة الإنجليزية' : 'Full Name in English'}
                        </label>
                        <input 
                          type="text" 
                          value={certNameEn}
                          onInput={e => setCertNameEn(e.target.value)}
                          placeholder="Example: Dr. Mohammed Ahmed Abdullah"
                          style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(11,40,73,0.15)', fontSize: '15px' }}
                        />
                      </div>
                      
                      <Button variant="gradient" onClick={handleSubmitCertRequest} disabled={certRequestLoading} style={{ width: '100%', justifyContent: 'center' }}>
                        {certRequestLoading ? '...' : (certRequest?.status === 'rejected' ? (lang === 'ar' ? 'إعادة تقديم الطلب' : 'Resubmit Request') : (lang === 'ar' ? 'تقديم الطلب للتدقيق' : 'Submit for Audit'))}
                      </Button>
                    </div>
                  )}
                </div>
              ) : activeLesson ? (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '100%', margin: '0 auto' }}>
                  <h3 style={{ color: '#0b2849', fontSize: '22px', fontWeight: 'bold', marginBottom: '24px', lineHeight: '1.4' }}>
                    {lessonTitle}
                  </h3>

                  {/* Dedicated Video Player for lesson.video_url */}
                  {activeLesson.video_url && (
                    <div style={{ marginBottom: '32px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(11,40,73,0.08)' }}>
                      <CustomVideoPlayer videoUrl={activeLesson.video_url} lang={lang} userId={userId} lessonId={activeLessonId} courseId={course?.id} />
                    </div>
                  )}

                  {/* Unified Rich Text Content (Contains Native Audio/Video) */}
                  {lessonContent && (
                    <div style={{ 
                      background: '#ffffff',
                      padding: '40px',
                      borderRadius: '16px',
                      boxShadow: '0 4px 24px rgba(11,40,73,0.04)',
                      color: 'rgba(11,40,73,0.8)', 
                      fontSize: '16px', 
                      lineHeight: '1.9', 
                      marginBottom: '32px', 
                      flexGrow: 1 
                    }}>
                      <RichTextRenderer html={lessonContent} lang={lang} userId={userId} lessonId={activeLessonId} courseId={course?.id} />
                    </div>
                  )}

                  {/* Display Result Hero if Quiz is Passed or Attempted */}
                  {quizData && lastQuizScore !== null && (
                    <div style={{ marginTop: '20px', flexGrow: 1 }}>
                      <QuizWidget
                        lang={lang}
                        quizData={quizData}
                        reviewMode={true}
                        pastScore={lastQuizScore}
                        onQuizFinished={handleQuizFinished}
                        onClose={() => setQuizMode(false)}
                      />
                    </div>
                  )}

                  {/* Action Bar */}
                  <div style={{ borderTop: '1px solid rgba(11,40,73,0.08)', paddingTop: '24px', paddingBottom: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: 'auto' }}>
                    {isCurrentCompleted ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {lastQuizScore !== null && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: lastQuizScore >= (quizData?.passing_score ?? 80) ? 'rgba(21,180,122,0.1)' : 'rgba(255,77,77,0.1)',
                            border: `1px solid ${lastQuizScore >= (quizData?.passing_score ?? 80) ? '#15b47a' : '#ff4d4d'}`,
                            borderRadius: '10px', padding: '8px 16px'
                          }}>
                            <span style={{ fontSize: '20px', fontWeight: 'bold', color: lastQuizScore >= (quizData?.passing_score ?? 80) ? '#15b47a' : '#ff4d4d' }}>
                              {lastQuizScore}%
                            </span>
                            <span style={{ fontSize: '12px', color: 'rgba(11,40,73,0.6)' }}>
                              {lang === 'ar' ? 'درجتك' : 'Your Score'}
                            </span>
                          </div>
                        )}
                        <button 
                          onClick={handleUnmarkComplete}
                          title={lang === 'ar' ? 'اضغط للتراجع (غير مكتمل)' : 'Click to unmark as incomplete'}
                          style={{ 
                            background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0',
                            color: '#15b47a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14.5px',
                            transition: 'opacity 0.2s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}><polyline points="20 6 9 17 4 12"/></svg>
                          {quizData 
                            ? (lang === 'ar' ? 'تم اجتياز الاختبار بنجاح!' : 'Quiz passed successfully!')
                            : (lang === 'ar' ? 'تم إتمام هذا الدرس بنجاح!' : 'Lesson completed!')}
                        </button>
                      </div>
                    ) : quizData ? (
                      <Button variant="gradient" onClick={() => setQuizMode(true)}>
                        {lastQuizScore !== null
                          ? (lang === 'ar' ? 'إعادة خوض الاختبار' : 'Retake Quiz')
                          : (lang === 'ar' ? 'خوض اختبار الدرس لقفل التقدم' : 'Take Lesson Quiz')}
                      </Button>
                    ) : (
                      <Button variant="gradient" onClick={handleMarkComplete}>
                        {lang === 'ar' ? 'تحديد الدرس كمكتمل' : 'Mark as Complete'}
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(11,40,73,0.4)' }}>
                  {lang === 'ar' ? 'اختر درساً من القائمة' : 'Select a lesson from the list'}
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
    </>
  );
}
