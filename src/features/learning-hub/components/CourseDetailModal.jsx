import { useState, useEffect, useRef } from 'preact/hooks';
import { Button } from '../../shared/components/Button';
import { QuizWidget } from './QuizWidget';
import { CustomVideoPlayer } from './CustomVideoPlayer';
import {
  fetchCourseSyllabus,
  fetchCompletedLessons,
  markLessonComplete,
  fetchQuiz,
  submitQuizAttempt,
  fetchPassedAttempt,
  getSecureVideoUrl,
} from '../services/lmsService';

export function CourseDetailModal({ lang = 'ar', course, userId, onClose, onLessonCompleted, onCourseCompleted }) {
  const [modules, setModules] = useState([]);
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [completedSet, setCompletedSet] = useState(new Set());
  const [quizData, setQuizData] = useState(null);
  const [quizMode, setQuizMode] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Video URL loaded for the active lesson


  if (!course) return null;

  const allLessons = modules.flatMap(m => m.lessons || []);
  const activeLesson = allLessons.find(l => l.id === activeLessonId) || allLessons[0];

  // ─── Load Syllabus + Progress ─────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [syllabus, completed] = await Promise.all([
          fetchCourseSyllabus(course.id),
          fetchCompletedLessons(userId, course.id),
        ]);
        setModules(syllabus || []);
        setCompletedSet(completed);

        const first = (syllabus?.[0]?.lessons || [])[0];
        if (first) setActiveLessonId(first.id);
      } catch (err) {
        console.error('CourseDetailModal load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [course.id, userId]);

  // ─── Load Quiz + Video when lesson changes ────────────────────────────────
  useEffect(() => {
    if (!activeLessonId) return;
    setQuizData(null);
    setQuizMode(false);
    setVideoUrl(null);
    setVideoUrl(null);


    async function loadLessonData() {
      try {
        // Check quiz
        const quiz = await fetchQuiz(course.id, activeLessonId);
        setQuizData(quiz);

        // Check if already passed
        if (quiz) {
          const passed = await fetchPassedAttempt(userId, quiz.id);
          setQuizPassed(!!passed);
        } else {
          setQuizPassed(false);
        }

        // Load video if lesson has one
        if (activeLesson?.video_url) {
          setVideoLoading(true);
          try {
            const url = await getSecureVideoUrl(activeLessonId, course.id);
            setVideoUrl(url);
          } catch (e) {
            console.error('Video URL error:', e);
            setVideoUrl(null);
          } finally {
            setVideoLoading(false);
          }
        }
      } catch (err) {
        console.error('Lesson data load error:', err);
      }
    }

    loadLessonData();
  }, [activeLessonId]);

  // ─── Quiz Completion ──────────────────────────────────────────────────────
  async function handleQuizFinished(score, passed, quizId) {
    // Persist the attempt
    try {
      await submitQuizAttempt(userId, quizId, score, passed);
    } catch (err) {
      console.error('Quiz submit error:', err);
    }

    if (passed) {
      setQuizPassed(true);
      setQuizMode(false);

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

        // If all lessons done, trigger certificate
        if (completedCount >= total && onCourseCompleted) {
          onCourseCompleted(course);
        }
      } catch (err) {
        console.error('Mark complete error:', err);
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
      if (completedCount >= total && onCourseCompleted) onCourseCompleted(course);
    } catch (err) {
      console.error('Mark complete error:', err);
    }
  }


  const lessonTitle = activeLesson
    ? (lang === 'ar' ? activeLesson.title_ar : (activeLesson.title_en || activeLesson.title_ar))
    : '';
  const lessonContent = activeLesson
    ? (lang === 'ar' ? activeLesson.content_ar : (activeLesson.content_en || activeLesson.content_ar))
    : '';

  const isCurrentCompleted = completedSet.has(activeLessonId);

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-range-slider {
          -webkit-appearance: none;
          width: 80px;
          height: 4px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          outline: none;
          transform: rotate(-90deg);
          transform-origin: center;
          margin: 38px -38px;
        }
        .custom-range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #15b47a;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
          transition: transform 0.15s ease;
        }
        .custom-range-slider::-webkit-slider-thumb:hover {
          transform: scale(1.3);
        }
        `
      }} />
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
        background: '#ffffff',
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden'
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 28px', borderBottom: '1px solid rgba(11,40,73,0.08)', background: '#ffffff', flexShrink: 0 }}>
          <div>
            <span style={{ fontSize: '11px', color: '#15b47a', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>
              {lang === 'ar' ? 'مساق نشط' : 'Active Course'}
            </span>
            <h2 style={{ color: '#0b2849', fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
              {lang === 'ar' ? course.title_ar : (course.title_en || course.title_ar)}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '13px', color: '#15b47a', fontWeight: 'bold' }}>
              {allLessons.length > 0 ? Math.round((completedSet.size / allLessons.length) * 100) : 0}% {lang === 'ar' ? 'مكتمل' : 'complete'}
            </span>
            <button onClick={onClose} style={{ background: 'rgba(11,40,73,0.06)', border: 'none', fontSize: '20px', color: '#0b2849', cursor: 'pointer', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✕
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(11,40,73,0.5)' }}>
            {lang === 'ar' ? 'جاري تحميل المنهج...' : 'Loading syllabus...'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexGrow: 1, minHeight: 0, height: 'calc(100vh - 80px)' }}>

            {/* Sidebar: Module + Lesson List */}
            <div style={{ width: '300px', borderInlineEnd: '1px solid rgba(11,40,73,0.08)', overflowY: 'auto', padding: '24px 20px', flexShrink: 0, background: '#f8fafc' }}>
              {modules.map(mod => (
                <div key={mod.id} style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#004c6d', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 4px' }}>
                    {lang === 'ar' ? mod.title_ar : (mod.title_en || mod.title_ar)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(mod.lessons || []).map((les) => {
                      const isActive = activeLessonId === les.id;
                      const isDone = completedSet.has(les.id);
                      const title = lang === 'ar' ? les.title_ar : (les.title_en || les.title_ar);
                      return (
                        <div
                          key={les.id}
                          onClick={() => { setActiveLessonId(les.id); setQuizMode(false); }}
                          style={{
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
                                {les.duration}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            {isDone && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isActive ? '#fff' : '#15b47a'} stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            )}
                            {les.video_url && !isDone && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.6 }}>
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {modules.length === 0 && (
                <p style={{ fontSize: '13px', color: 'rgba(11,40,73,0.4)', textAlign: 'center', padding: '20px 0' }}>
                  {lang === 'ar' ? 'لا توجد وحدات بعد.' : 'No modules yet.'}
                </p>
              )}
            </div>

            {/* Main Content Panel */}
            <div style={{ flexGrow: 1, overflowY: 'auto', padding: '40px' }}>
              {quizMode && quizData ? (
                <QuizWidget
                  lang={lang}
                  quizData={quizData}
                  onQuizFinished={handleQuizFinished}
                  onClose={() => setQuizMode(false)}
                />
              ) : activeLesson ? (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '880px', margin: '0 auto' }}>
                  <h3 style={{ color: '#0b2849', fontSize: '22px', fontWeight: 'bold', marginBottom: '24px', lineHeight: '1.4' }}>
                    {lessonTitle}
                  </h3>

                  {/* Custom Video Player Component */}
                  {activeLesson.video_url && (
                    <CustomVideoPlayer 
                      videoUrl={videoUrl}
                      videoLoading={videoLoading}
                      lessonTitle={lessonTitle}
                      lang={lang}
                    />
                  )}

                  {/* Text Content */}
                  {lessonContent && (
                    <div 
                      style={{ color: 'rgba(11,40,73,0.8)', fontSize: '16px', lineHeight: '1.9', marginBottom: '32px', flexGrow: 1 }}
                      dangerouslySetInnerHTML={{ __html: lessonContent }}
                    />
                  )}

                  {/* Action Bar */}
                  <div style={{ borderTop: '1px solid rgba(11,40,73,0.08)', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: 'auto' }}>
                    {isCurrentCompleted ? (
                      <span style={{ color: '#15b47a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14.5px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style={{ display: 'inline-block' }}><polyline points="20 6 9 17 4 12"/></svg>
                        {lang === 'ar' ? 'تم إتمام هذا الدرس بنجاح!' : 'Lesson completed!'}
                      </span>
                    ) : quizData ? (
                      <Button variant="gradient" onClick={() => setQuizMode(true)} style={{ padding: '12px 28px', fontSize: '13.5px' }}>
                        {lang === 'ar' ? 'خوض اختبار الدرس لقفل التقدم' : 'Take Lesson Quiz'}
                      </Button>
                    ) : (
                      <Button variant="gradient" onClick={handleMarkComplete} style={{ padding: '12px 28px', fontSize: '13.5px' }}>
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
        )}
      </div>
      </div>
    </>
  );
}
