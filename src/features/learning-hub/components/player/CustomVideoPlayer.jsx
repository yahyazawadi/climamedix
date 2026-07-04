import { useState, useRef, useEffect } from 'preact/hooks';
import { supabase } from '../../../../utils/supabaseClient';

export function CustomVideoPlayer({ videoUrl, videoLoading, lessonTitle, lang = 'ar', userId, lessonId }) {
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

  const telemetry = useRef({
    maxPercentage: 0,
    furthestSecond: 0,
    actualPlayDuration: 0,
    lastPlayStart: null,
  });

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setPlaybackSpeed(1);
    setShowSpeedSlider(false);
    setShowVolumeSlider(false);
    if (videoRef.current) {
      videoRef.current.playbackRate = 1;
    }
    telemetry.current = { maxPercentage: 0, furthestSecond: 0, actualPlayDuration: 0, lastPlayStart: null };
  }, [videoUrl]);

  const flushTelemetry = async () => {
    if (!userId || !lessonId) return;
    const { furthestSecond, maxPercentage, actualPlayDuration } = telemetry.current;
    if (furthestSecond === 0 && actualPlayDuration === 0) return;

    try {
      const { data: existing } = await supabase
        .from('lesson_watch_metrics')
        .select('*')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .single();

      const newFurthest = Math.max(furthestSecond, existing?.furthest_second_reached || 0);
      const newMaxPct = Math.max(maxPercentage, existing?.max_percentage_watched || 0);
      const newActualPlay = (existing?.actual_play_duration_seconds || 0) + actualPlayDuration;

      telemetry.current.actualPlayDuration = 0; 
      telemetry.current.furthestSecond = newFurthest;
      telemetry.current.maxPercentage = newMaxPct;

      await supabase
        .from('lesson_watch_metrics')
        .upsert({
          user_id: userId,
          lesson_id: lessonId,
          furthest_second_reached: newFurthest,
          max_percentage_watched: newMaxPct,
          actual_play_duration_seconds: newActualPlay,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, lesson_id' });
    } catch (err) {
      // Quiet fail if network goes down
    }
  };

  useEffect(() => {
    if (isPlaying) {
      telemetry.current.lastPlayStart = Date.now();
    } else {
      if (telemetry.current.lastPlayStart) {
        const elapsed = (Date.now() - telemetry.current.lastPlayStart) / 1000;
        telemetry.current.actualPlayDuration += elapsed;
        telemetry.current.lastPlayStart = null;
      }
      flushTelemetry();
    }
  }, [isPlaying]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        if (isPlaying && telemetry.current.lastPlayStart) {
          const elapsed = (Date.now() - telemetry.current.lastPlayStart) / 1000;
          telemetry.current.actualPlayDuration += elapsed;
          telemetry.current.lastPlayStart = Date.now();
        }
        flushTelemetry();
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (telemetry.current.lastPlayStart) {
        telemetry.current.actualPlayDuration += (Date.now() - telemetry.current.lastPlayStart) / 1000;
      }
      flushTelemetry();
    };
  }, [isPlaying, userId, lessonId]);

  function togglePlay(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(err => console.error('Play error:', err));
    } else {
      videoRef.current.pause();
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

  async function copyFrame() {
    if (!videoRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        alert(lang === 'ar' ? 'تم نسخ الإطار بنجاح!' : 'Frame copied successfully!');
      }, 'image/png');
    } catch (e) {
      console.error('Failed to copy frame', e);
      alert(lang === 'ar' 
        ? 'تعذر نسخ الإطار. يرجى تفعيل إعدادات CORS في مساحة تخزين Cloudflare R2 الخاصة بك للسماح بقراءة الفيديو.' 
        : 'Error copying frame. Please enable CORS in your Cloudflare R2 bucket.');
    }
  }

  async function togglePip() {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error('PiP failed', error);
      alert(lang === 'ar' ? 'خاصية النافذة المصغرة غير مدعومة هنا.' : 'Picture-in-Picture not supported.');
    }
  }

  return (
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
                const ct = videoRef.current.currentTime;
                const dur = videoRef.current.duration || 0;
                setCurrentTime(ct);
                
                if (ct > telemetry.current.furthestSecond) {
                  telemetry.current.furthestSecond = ct;
                  if (dur > 0) {
                    telemetry.current.maxPercentage = (ct / dur) * 100;
                  }
                }
              }
            }}
            onLoadedMetadata={() => {
              if (videoRef.current) setDuration(videoRef.current.duration);
            }}
            crossOrigin="anonymous"
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: '2px solid #15b47a',
                boxShadow: '0 0 20px rgba(21, 180, 122, 0.5), inset 0 0 15px rgba(21, 180, 122, 0.3)',
                color: '#15b47a',
                transition: 'background 0.2s ease, color 0.2s ease, transform 0.2s ease'
              }}
              onClick={togglePlay}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#15b47a'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#15b47a'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {isPlaying ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}><path d="M8 5v14l11-7z"/></svg>
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
                    title={lang === 'ar' ? (isPlaying ? 'إيقاف مؤقت' : 'تشغيل') : (isPlaying ? 'Pause' : 'Play')}
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

                {/* Speed, Volume, Tools, and Fullscreen buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  
                  {/* Copy Frame Button */}
                  <button 
                    onClick={copyFrame}
                    title={lang === 'ar' ? 'نسخ لقطة من الفيديو' : 'Copy Frame'}
                    style={{ background: 'none', border: 'none', color: '#fff', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                  </button>

                  {/* PiP Button */}
                  <button 
                    onClick={togglePip}
                    title={lang === 'ar' ? 'تشغيل كنافذة مصغرة (Miniplayer)' : 'Picture-in-Picture'}
                    style={{ background: 'none', border: 'none', color: '#fff', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <rect x="12" y="12" width="7" height="6" rx="1" ry="1"></rect>
                    </svg>
                  </button>

                  {/* Speed Selection */}
                  <div 
                    style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '10px', margin: '-10px' }}
                    onMouseEnter={() => { setShowSpeedSlider(true); setShowVolumeSlider(false); }}
                    onMouseLeave={() => setShowSpeedSlider(false)}
                  >
                    {showSpeedSlider && (
                      <div style={{
                        position: 'absolute',
                        bottom: 'calc(100% - 5px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(11, 40, 73, 0.95)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        padding: '12px 8px 15px 8px',
                        zIndex: 10,
                        height: '125px',
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
                      title={lang === 'ar' ? 'سرعة التشغيل' : 'Playback Speed'}
                      onClick={() => { setShowSpeedSlider(!showSpeedSlider); setShowVolumeSlider(false); }}
                      onDoubleClick={() => changeSpeed(1)}
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

                  {/* Volume Selection */}
                  <div 
                    style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '10px', margin: '-10px' }}
                    onMouseEnter={() => { setShowVolumeSlider(true); setShowSpeedSlider(false); }}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                  >
                    {showVolumeSlider && (
                      <div style={{
                        position: 'absolute',
                        bottom: 'calc(100% - 5px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(11, 40, 73, 0.95)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        padding: '12px 8px 15px 8px',
                        zIndex: 10,
                        height: '125px',
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
                      title={lang === 'ar' ? 'مستوى الصوت / كتم' : 'Volume / Mute'}
                      onClick={toggleMute}
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
                    title={lang === 'ar' ? 'تكبير الشاشة' : 'Fullscreen'}
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
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
          {lang === 'ar' ? 'الفيديو غير متوفر' : 'Video unavailable'}
        </div>
      )}
    </div>
  );
}
