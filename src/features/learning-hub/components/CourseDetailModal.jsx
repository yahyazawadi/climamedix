import { useState, useEffect, useRef } from 'preact/hooks';
import { Button } from '../../shared/components/Button';
import { QuizWidget } from './QuizWidget';
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

  // Custom Video Player States
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

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
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setPlaybackSpeed(1);
    if (videoRef.current) {
      videoRef.current.playbackRate = 1;
    }

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

  // Custom Video Player Control Functions
  function togglePlay() {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  }

  function toggleMute() {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  }

  function toggleFullscreen() {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    } else if (videoRef.current.webkitRequestFullscreen) {
      videoRef.current.webkitRequestFullscreen();
    }
  }

  function handleTimelineClick(e) {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * duration;
    videoRef.current.currentTime = newTime;
  }

  function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  function changeSpeed(speed) {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
  }

  const lessonTitle = activeLesson
    ? (lang === 'ar' ? activeLesson.title_ar : (activeLesson.title_en || activeLesson.title_ar))
    : '';
  const lessonContent = activeLesson
    ? (lang === 'ar' ? activeLesson.content_ar : (activeLesson.content_en || activeLesson.content_ar))
    : '';

  const isCurrentCompleted = completedSet.has(activeLessonId);

  return (
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
                            padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px',
                            background: isActive ? '#004c6d' : 'transparent',
                            color: isActive ? '#fff' : '#0b2849',
                            border: '1px solid rgba(11,40,73,0.07)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            fontWeight: isActive ? 'bold' : 'normal', transition: 'all 0.15s',
                          }}
                        >
                          <span>{title}</span>
                          {isDone && <span style={{ color: isActive ? '#fff' : '#15b47a', fontWeight: 'bold', fontSize: '12px' }}>✓</span>}
                          {les.video_url && !isDone && <span style={{ fontSize: '10px', opacity: 0.6 }}>▶</span>}
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

                  {/* Custom Video Player (Concept 13) */}
                  {activeLesson.video_url && (
                    <div 
                      onMouseEnter={() => setShowControls(true)}
                      onMouseLeave={() => setShowControls(false)}
                      style={{
                        width: '100%',
                        aspectRatio: '16/9',
                        background: '#000000',
                        borderRadius: '16px',
                        marginBottom: '32px',
                        overflow: 'hidden',
                        position: 'relative',
                        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8), 0 12px 30px rgba(11, 40, 73, 0.15)',
                        border: '1px solid rgba(0, 76, 109, 0.12)'
                      }}
                    >
                      {videoLoading ? (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.15)', borderTop: '3px solid #15b47a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                          {lang === 'ar' ? 'جاري تحميل الفيديو...' : 'Loading video...'}
                          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        </div>
                      ) : videoUrl ? (
                        <>
                          <video
                            ref={videoRef}
                            src={videoUrl}
                            style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer' }}
                            onClick={togglePlay}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onTimeUpdate={() => {
                              if (videoRef.current) {
                                setCurrentTime(videoRef.current.currentTime);
                              }
                            }}
                            onLoadedMetadata={() => {
                              if (videoRef.current) {
                                setDuration(videoRef.current.duration);
                              }
                            }}
                          />

                          {/* Center Play/Pause Overlay Button */}
                          {(!isPlaying || showControls) && (
                            <div 
                              onClick={togglePlay}
                              style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(0, 0, 0, 0.35)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'opacity 0.25s ease'
                              }}
                            >
                              <div style={{
                                width: '70px',
                                height: '70px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #15b47a, #004c6d)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 8px 25px rgba(21, 180, 122, 0.4)',
                                transform: 'scale(1)',
                                transition: 'transform 0.2s',
                                color: '#ffffff',
                                fontSize: '28px',
                                paddingLeft: !isPlaying ? '6px' : '0px' // Visually center the play icon
                              }}
                              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                              >
                                {isPlaying ? '⏸' : '▶'}
                              </div>
                            </div>
                          )}

                          {/* Top Overlay details */}
                          {showControls && (
                            <div style={{
                              position: 'absolute',
                              top: 0, left: 0, right: 0,
                              background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
                              padding: '20px 24px',
                              color: '#fff',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              pointerEvents: 'none'
                            }}>
                              <span style={{ fontSize: '15px', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                                {lessonTitle}
                              </span>
                            </div>
                          )}

                          {/* Bottom Controls Overlay */}
                          {showControls && (
                            <div style={{
                              position: 'absolute',
                              bottom: 0, left: 0, right: 0,
                              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
                              padding: '24px 20px 14px 20px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px'
                            }}>
                              
                              {/* Timeline seekable slider bar */}
                              <div 
                                onClick={handleTimelineClick}
                                style={{
                                  width: '100%',
                                  height: '6px',
                                  background: 'rgba(255,255,255,0.3)',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  position: 'relative'
                                }}
                              >
                                <div 
                                  style={{
                                    width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                                    height: '100%',
                                    background: '#15b47a',
                                    borderRadius: '3px',
                                    position: 'relative',
                                    boxShadow: '0 0 8px #15b47a'
                                  }}
                                />
                              </div>

                              {/* Controls buttons row */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', direction: 'ltr' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                  <button 
                                    onClick={togglePlay}
                                    style={{
                                      background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center'
                                    }}
                                  >
                                    {isPlaying ? '⏸' : '▶'}
                                  </button>

                                  {/* Time Indicator */}
                                  <span style={{ fontSize: '13px', fontFamily: 'monospace' }}>
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                  </span>
                                </div>

                                {/* Speed, Volume / Mute and Fullscreen buttons */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                  <select
                                    value={playbackSpeed}
                                    onChange={(e) => changeSpeed(parseFloat(e.target.value))}
                                    style={{
                                      background: 'rgba(255, 255, 255, 0.12)',
                                      border: '1px solid rgba(255, 255, 255, 0.25)',
                                      color: '#ffffff',
                                      borderRadius: '6px',
                                      padding: '2px 8px',
                                      fontSize: '12px',
                                      cursor: 'pointer',
                                      outline: 'none',
                                      fontFamily: 'inherit'
                                    }}
                                  >
                                    <option value="0.5" style={{ background: '#0b2849', color: '#fff' }}>0.5x</option>
                                    <option value="1" style={{ background: '#0b2849', color: '#fff' }}>1.0x</option>
                                    <option value="1.25" style={{ background: '#0b2849', color: '#fff' }}>1.25x</option>
                                    <option value="1.5" style={{ background: '#0b2849', color: '#fff' }}>1.5x</option>
                                    <option value="2" style={{ background: '#0b2849', color: '#fff' }}>2.0x</option>
                                  </select>

                                  <button 
                                    onClick={toggleMute}
                                    style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}
                                  >
                                    {isMuted ? '🔇' : '🔊'}
                                  </button>
                                  <button 
                                    onClick={toggleFullscreen}
                                    style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}
                                  >
                                    ⛶
                                  </button>
                                </div>
                              </div>

                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexDirection: 'column', gap: '8px', opacity: 0.6 }}>
                          <span style={{ fontSize: '32px' }}>⚠️</span>
                          <span style={{ fontSize: '13px' }}>{lang === 'ar' ? 'تعذر تحميل الفيديو' : 'Could not load video'}</span>
                        </div>
                      )}
                    </div>
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
                        ✓ {lang === 'ar' ? 'تم إتمام هذا الدرس بنجاح!' : 'Lesson completed!'}
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
  );
}
