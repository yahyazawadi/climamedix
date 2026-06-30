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
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSpeedSlider, setShowSpeedSlider] = useState(false);

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
    setShowSpeedSlider(false);
    setShowVolumeSlider(false);
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
    if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
      videoRef.current.volume = volume || 1;
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  }

  function handleVolumeChange(newVal) {
    setVolume(newVal);
    if (videoRef.current) {
      videoRef.current.volume = newVal;
      const isCurrentlyMuted = newVal === 0;
      videoRef.current.muted = isCurrentlyMuted;
      setIsMuted(isCurrentlyMuted);
    }
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
                                color: '#ffffff'
                              }}
                              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                              >
                                {isPlaying ? (
                                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                                ) : (
                                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '4px' }}><path d="M8 5v14l11-7z"/></svg>
                                )}
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
                                      background: 'none', border: 'none', color: '#fff', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center'
                                    }}
                                  >
                                    {isPlaying ? (
                                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                                    ) : (
                                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                    )}
                                  </button>

                                  {/* Time Indicator */}
                                  <span style={{ fontSize: '13px', fontFamily: 'monospace' }}>
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                  </span>
                                </div>

                                {/* Speed, Volume / Mute and Fullscreen buttons */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                  
                                  {/* Custom Speed Selection Slider */}
                                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    {showSpeedSlider && (
                                      <div style={{
                                        position: 'absolute',
                                        bottom: 'calc(100% + 10px)',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: 'rgba(11, 40, 73, 0.95)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        borderRadius: '8px',
                                        padding: '12px 8px',
                                        zIndex: 10,
                                        height: '120px',
                                        minWidth: '46px',
                                        boxSizing: 'border-box',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.5)',
                                        gap: '8px'
                                      }}>
                                        <span style={{ fontSize: '11px', color: '#15b47a', fontWeight: 'bold', fontFamily: 'monospace', textAlign: 'center' }}>
                                          {playbackSpeed.toFixed(1)}x
                                        </span>
                                        <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                          <input 
                                            type="range"
                                            min="0.5"
                                            max="2.0"
                                            step="0.1"
                                            value={playbackSpeed}
                                            onInput={(e) => changeSpeed(parseFloat(e.target.value))}
                                            className="custom-range-slider"
                                          />
                                        </div>
                                      </div>
                                    )}
                                    <button
                                      onClick={() => { setShowSpeedSlider(!showSpeedSlider); setShowVolumeSlider(false); }}
                                      style={{
                                        background: 'rgba(255, 255, 255, 0.12)',
                                        border: '1px solid rgba(255, 255, 255, 0.25)',
                                        color: '#ffffff',
                                        borderRadius: '6px',
                                        padding: '4px 8px',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minWidth: '40px',
                                        outline: 'none',
                                        lineHeight: '1'
                                      }}
                                    >
                                      <span>{playbackSpeed.toFixed(1)}x</span>
                                    </button>
                                  </div>

                                  {/* Custom Volume Selection Slider */}
                                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    {showVolumeSlider && (
                                      <div style={{
                                        position: 'absolute',
                                        bottom: 'calc(100% + 10px)',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: 'rgba(11, 40, 73, 0.95)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        borderRadius: '8px',
                                        padding: '12px 8px',
                                        zIndex: 10,
                                        height: '120px',
                                        minWidth: '46px',
                                        boxSizing: 'border-box',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.5)',
                                        gap: '8px'
                                      }}>
                                        <span style={{ fontSize: '10px', color: '#15b47a', fontWeight: 'bold', fontFamily: 'monospace', textAlign: 'center' }}>
                                          {Math.round((isMuted ? 0 : volume) * 100)}%
                                        </span>
                                        <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                          <input 
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.05"
                                            value={isMuted ? 0 : volume}
                                            onInput={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                            className="custom-range-slider"
                                          />
                                        </div>
                                      </div>
                                    )}
                                    <button 
                                      onClick={() => { setShowVolumeSlider(!showVolumeSlider); setShowSpeedSlider(false); }}
                                      style={{ background: 'none', border: 'none', color: '#fff', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                    >
                                      {isMuted || volume === 0 ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                                      ) : volume < 0.5 ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                                      ) : (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                                      )}
                                    </button>
                                  </div>

                                  <button 
                                    onClick={toggleFullscreen}
                                    style={{ background: 'none', border: 'none', color: '#fff', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                  >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                                  </button>
                                </div>
                              </div>

                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexDirection: 'column', gap: '8px', opacity: 0.6 }}>
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{ marginBottom: '8px' }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
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
