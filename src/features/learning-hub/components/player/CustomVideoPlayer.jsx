import { useState, useRef, useEffect } from 'preact/hooks';
import { supabase } from '../../../../utils/supabaseClient';
import { getSecureVideoUrl } from '../../services/lmsService';
import { parseSubtitles, getActiveCue } from '../../../../utils/subtitleParser';

export function CustomVideoPlayer({ videoUrl, videoLoading, lessonTitle, lang = 'ar', userId, lessonId, courseId, tracks = [] }) {
  const [resolvedUrl, setResolvedUrl] = useState(null);
  const [resolving, setResolving] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  // showControlsRef mirrors showControls synchronously so timer callbacks
  // and click handlers never read a stale closure value.
  const showControlsRef = useRef(true);
  const setControls = (val) => { showControlsRef.current = val; setShowControls(val); };
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedPresets, setShowSpeedPresets] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSpeedSlider, setShowSpeedSlider] = useState(false);
  const [showCCMenu, setShowCCMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // CC Subtitle states
  const [selectedTrackId, setSelectedTrackId] = useState(() => {
    try {
      return localStorage.getItem('lms_cc_pref') || 'off';
    } catch (e) {
      return 'off';
    }
  });
  const [parsedCues, setParsedCues] = useState([]);
  const [activeCue, setActiveCue] = useState(null);

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
    setShowSpeedPresets(false);
    setShowSpeedSlider(false);
    setShowVolumeSlider(false);
    if (videoRef.current) {
      videoRef.current.playbackRate = 1;
    }
    telemetry.current = { maxPercentage: 0, furthestSecond: 0, actualPlayDuration: 0, lastPlayStart: null };
    setVideoError(false);

    // Resolve URL
    if (!videoUrl) {
      setResolvedUrl(null);
      return;
    }

    if (videoUrl.startsWith('http') || videoUrl.startsWith('blob:')) {
      setResolvedUrl(videoUrl);
      return;
    }

    // Direct R2 key resolution fallback
    const r2Base = (import.meta.env.VITE_R2_PUBLIC_URL || '').replace(/\/+$/, '');
    if (r2Base) {
      setResolvedUrl(`${r2Base}/${videoUrl}`);
      return;
    }

    // It's likely an R2 key, resolve it
    if (lessonId && courseId) {
      setResolving(true);
      getSecureVideoUrl(lessonId, courseId)
        .then(url => {
          setResolvedUrl(url || null);
          setResolving(false);
        })
        .catch(err => {
          console.error('Failed to resolve secure video URL:', err);
          setResolving(false);
        });
    } else {
      setResolvedUrl(videoUrl); // fallback
    }

  }, [videoUrl, lessonId, courseId]);

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

  const lockLandscape = async () => {
    try {
      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock('landscape');
      } else if (screen.lockOrientation) {
        screen.lockOrientation('landscape');
      } else if (screen.mozLockOrientation) {
        screen.mozLockOrientation('landscape');
      } else if (screen.msLockOrientation) {
        screen.msLockOrientation('landscape');
      }
    } catch (e) {
      // Orientation lock may fail if device doesn't support it or in desktop browsers; safely ignore
    }
  };

  const unlockOrientation = () => {
    try {
      if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      } else if (screen.unlockOrientation) {
        screen.unlockOrientation();
      } else if (screen.mozUnlockOrientation) {
        screen.mozUnlockOrientation();
      } else if (screen.msUnlockOrientation) {
        screen.msUnlockOrientation();
      }
    } catch (e) {}
  };

  async function toggleFullscreen() {
    const isFull = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
    if (isFull) {
      if (document.exitFullscreen) {
        await document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      unlockOrientation();
    } else {
      const elem = containerRef.current || videoRef.current;
      if (!elem) return;
      try {
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else if (videoRef.current && videoRef.current.webkitEnterFullscreen) {
          videoRef.current.webkitEnterFullscreen();
        }
        // Rotate screen to maximize if video is in landscape format
        await lockLandscape();
      } catch (err) {
        console.error('Fullscreen request error:', err);
      }
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFullscreen(isFull);
      if (!isFull) {
        unlockOrientation();
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  function isTouchDevice() {
    if (typeof window === 'undefined') return false;
    return Boolean(
      (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches) ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(hover: hover)').matches) ||
      (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0 && window.innerWidth <= 768)
    );
  }

  function isMouseDevice() {
    return !isTouchDevice();
  }

  // Auto-close popovers when tapping outside (vital for mobile touch UX)
  useEffect(() => {
    if (!showSpeedSlider && !showVolumeSlider && !showCCMenu) return;
    const handleOutsideInteraction = (e) => {
      if (!e.target.closest || !e.target.closest('.cvp-popover-anchor')) {
        setShowSpeedSlider(false);
        setShowSpeedPresets(false);
        setShowVolumeSlider(false);
        setShowCCMenu(false);
      }
    };
    document.addEventListener('click', handleOutsideInteraction);
    document.addEventListener('touchstart', handleOutsideInteraction);
    return () => {
      document.removeEventListener('click', handleOutsideInteraction);
      document.removeEventListener('touchstart', handleOutsideInteraction);
    };
  }, [showSpeedSlider, showVolumeSlider, showCCMenu]);

  // 2.3-second auto-hide timer for controls and menus during playback
  const controlsTimerRef = useRef(null);

  const resetControlsTimer = () => {
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = null;
    }
    if (videoRef.current && !videoRef.current.paused) {
      controlsTimerRef.current = setTimeout(() => {
        setControls(false);
        setShowCCMenu(false);
        setShowSpeedSlider(false);
        setShowSpeedPresets(false);
        setShowVolumeSlider(false);
      }, 2300);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      resetControlsTimer();
    } else {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
        controlsTimerRef.current = null;
      }
      setControls(true);
    }
    return () => {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    };
  }, [isPlaying]);

  const handleOverlayClick = (e) => {
    // Let bottom controls and popovers handle their own events
    if (e?.target?.closest?.('.cvp-bottom-overlay') || e?.target?.closest?.('.cvp-popover-anchor')) {
      return;
    }
    // Center button uses stopPropagation and handles its own click
    if (e?.target?.closest?.('.cvp-center-play')) {
      return;
    }

    e?.stopPropagation?.();

    // Use the ref (not the stale closure) so we always read the real current value
    const controlsOpen = showControlsRef.current || showCCMenu || showSpeedSlider || showVolumeSlider;

    if (controlsOpen) {
      // Controls are visible — hide everything
      setControls(false);
      setShowCCMenu(false);
      setShowSpeedSlider(false);
      setShowSpeedPresets(false);
      setShowVolumeSlider(false);
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
        controlsTimerRef.current = null;
      }
    } else {
      // Controls are hidden — reveal them
      setControls(true);
      resetControlsTimer();
    }
  };

  const timelineRef = useRef(null);
  const isDraggingTimeline = useRef(false);

  function seekFromEvent(e) {
    if (!videoRef.current || !timelineRef.current) return;
    const dur = duration || videoRef.current.duration || 0;
    if (!dur) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clientX = (e.touches && e.touches.length > 0) ? e.touches[0].clientX : e.clientX;
    if (typeof clientX !== 'number' || isNaN(clientX)) return;

    const offsetX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const targetPct = rect.width > 0 ? offsetX / rect.width : 0;
    const newTime = targetPct * dur;

    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }

  function handleTimelineMouseDown(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    isDraggingTimeline.current = true;
    seekFromEvent(e);

    const handleMouseMove = (moveEvent) => {
      if (!isDraggingTimeline.current) return;
      seekFromEvent(moveEvent);
    };

    const handleMouseUp = (upEvent) => {
      if (!isDraggingTimeline.current) return;
      seekFromEvent(upEvent);
      isDraggingTimeline.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  function handleTimelineTouchStart(e) {
    isDraggingTimeline.current = true;
    seekFromEvent(e);

    const handleTouchMove = (moveEvent) => {
      if (!isDraggingTimeline.current) return;
      seekFromEvent(moveEvent);
    };

    const handleTouchEnd = (upEvent) => {
      if (!isDraggingTimeline.current) return;
      isDraggingTimeline.current = false;
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
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

  // Handle track loading & parsing (supports .vtt, .srt, or inline content)
  useEffect(() => {
    if (selectedTrackId === 'off') {
      setParsedCues([]);
      setActiveCue(null);
      return;
    }

    const currentTrack = tracks.find(t => t.id === selectedTrackId);
    if (!currentTrack) {
      setParsedCues([]);
      setActiveCue(null);
      return;
    }

    // Direct content provided
    if (currentTrack.content) {
      const parsed = parseSubtitles(currentTrack.content);
      setParsedCues(parsed);
      return;
    }

    // Remote or local file (.vtt or .srt)
    if (currentTrack.src) {
      fetch(currentTrack.src)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.text();
        })
        .then(text => {
          const parsed = parseSubtitles(text);
          setParsedCues(parsed);
        })
        .catch(err => {
          console.error('Failed to load subtitle track:', err);
          setParsedCues([]);
        });
    }
  }, [selectedTrackId, tracks]);

  function handleSelectTrack(trackId) {
    setSelectedTrackId(trackId);
    try {
      localStorage.setItem('lms_cc_pref', trackId);
    } catch (e) {
      // Ignore local storage error in private/restricted browsing
    }
    setShowCCMenu(false);
  }

  return (
    <div 
      ref={containerRef}
      onMouseMove={() => {
        if (!showControlsRef.current) {
          setControls(true);
        }
        resetControlsTimer();
      }}
      onMouseEnter={() => {
        setControls(true);
        resetControlsTimer();
      }}
      onMouseLeave={() => {
        if (isPlaying) {
          setControls(false);
          setShowCCMenu(false);
          setShowSpeedSlider(false);
          setShowVolumeSlider(false);
          if (controlsTimerRef.current) {
            clearTimeout(controlsTimerRef.current);
            controlsTimerRef.current = null;
          }
        }
      }}
      className={`cvp-player-container ${isFullscreen ? 'is-fullscreen' : ''}`}
      style={{
        width: isFullscreen ? '100vw' : '100%',
        height: isFullscreen ? '100vh' : 'auto',
        aspectRatio: isFullscreen ? 'auto' : '16/9',
        minHeight: isFullscreen ? '100vh' : '300px',
        flexShrink: 0,
        background: '#000000',
        borderRadius: isFullscreen ? '0' : '16px',
        marginBottom: isFullscreen ? '0' : '32px',
        overflow: 'hidden',
        position: 'relative',
        border: isFullscreen ? 'none' : '1px solid rgba(0, 76, 109, 0.12)',
        cursor: (isPlaying && !showControls) ? 'none' : 'default'
      }}
    >
      <style>{`
        .cvp-player-container:fullscreen,
        .cvp-player-container:-webkit-full-screen {
          width: 100vw !important;
          height: 100vh !important;
          border-radius: 0 !important;
          border: none !important;
          margin: 0 !important;
          aspect-ratio: auto !important;
          background: #000000 !important;
        }
        .cvp-player-container:fullscreen video,
        .cvp-player-container:-webkit-full-screen video {
          width: 100% !important;
          height: 100% !important;
          object-fit: contain !important;
        }
        .custom-video-range-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 70px;
          height: 4px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          outline: none;
          transform: rotate(-90deg);
          transform-origin: center;
          margin: 33px -33px;
        }
        .custom-video-range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #0b2849 !important;
          cursor: pointer;
          border: 2px solid #ffffff !important;
          box-shadow: none !important;
          transition: transform 0.15s ease;
        }
        .custom-video-range-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #0b2849 !important;
          cursor: pointer;
          border: 2px solid #ffffff !important;
          box-shadow: none !important;
          transition: transform 0.15s ease;
        }
        .custom-video-range-slider::-webkit-slider-thumb:hover,
        .custom-video-range-slider::-moz-range-thumb:hover {
          transform: scale(1.25);
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .cvp-caption-container {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 94%;
          pointer-events: none;
          z-index: 4;
          text-align: center;
          transition: bottom 0.2s ease;
          display: flex;
          justify-content: center;
        }
        .cvp-caption-container.has-controls {
          bottom: 80px;
        }
        .cvp-caption-container.no-controls {
          bottom: 24px;
        }
        .cvp-caption-text {
          display: inline-block;
          background: rgba(0, 0, 0, 0.88);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: #ffffff;
          padding: 8px 24px;
          border-radius: 8px;
          font-size: clamp(14px, 2vw, 17px);
          line-height: 1.45;
          font-weight: 600;
          text-align: center;
          white-space: normal;
          min-width: 75%;
          max-width: 100%;
          box-sizing: border-box;
          box-shadow: 0 4px 16px rgba(0,0,0,0.5);
        }
        @media (max-width: 768px) {
          .cvp-top-overlay {
            padding: 10px 14px !important;
          }
          .cvp-top-overlay span {
            font-size: 13px !important;
          }
          .cvp-bottom-overlay {
            padding: 12px 10px 8px 10px !important;
            gap: 8px !important;
          }
          .cvp-center-play {
            width: 48px !important;
            height: 48px !important;
          }
          .cvp-center-play svg {
            width: 20px !important;
            height: 20px !important;
          }
          .cvp-btn-row-left, .cvp-btn-row-right {
            gap: 8px !important;
          }
          .cvp-desktop-only {
            display: none !important;
          }
          .cvp-time-display {
            font-size: 11px !important;
          }
          .cvp-speed-btn {
            font-size: 11px !important;
            padding: 0 2px !important;
          }
          .cvp-caption-container {
            width: 96% !important;
            max-width: 98% !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
          }
          .cvp-caption-container.has-controls {
            bottom: 56px !important;
          }
          .cvp-caption-container.no-controls {
            bottom: 16px !important;
          }
          .cvp-caption-text {
            width: 100% !important;
            min-width: 92% !important;
            max-width: 100% !important;
            font-size: 13.5px !important;
            line-height: 1.4 !important;
            padding: 6px 14px !important;
            white-space: normal !important;
            box-sizing: border-box !important;
            border-radius: 6px !important;
          }
        }
      `}</style>
      {(videoLoading || resolving) ? (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', flexDirection: 'column', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.2)', borderTop: '3px solid #0b2849', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          {lang === 'ar' ? 'جاري تحميل الفيديو...' : 'Loading video...'}
        </div>
      ) : (resolvedUrl && !videoError) ? (
        <>
          <video
            ref={videoRef}
            src={resolvedUrl}
            style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer' }}
            onClick={handleOverlayClick}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={() => {
              if (videoRef.current) {
                const ct = videoRef.current.currentTime;
                const dur = videoRef.current.duration || 0;
                if (!isDraggingTimeline.current) {
                  setCurrentTime(ct);
                }

                if (parsedCues.length > 0) {
                  const cue = getActiveCue(parsedCues, ct);
                  setActiveCue(cue);
                } else if (activeCue) {
                  setActiveCue(null);
                }
                
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
            onError={(e) => {
              console.error('Video load error:', e.target.error);
              setVideoError(true);
            }}
            crossOrigin="anonymous"
          />

          {/* Subtitle / Closed Caption Overlay (Broadcast Standard) */}
          {activeCue && (
            <div 
              className={`cvp-caption-container ${showControls ? 'has-controls' : 'no-controls'}`}
            >
              <div 
                className="cvp-caption-text"
                style={{
                  direction: activeCue.isRtl ? 'rtl' : 'ltr',
                  unicodeBidi: 'plaintext',
                  fontFamily: activeCue.isRtl ? "'Cairo', 'Alexandria', system-ui, sans-serif" : "'Inter', system-ui, sans-serif"
                }}
              >
                {(activeCue.text || '').replace(/\r?\n+/g, ' ')}
              </div>
            </div>
          )}

          {/* Click/touch catcher — ALWAYS rendered so taps never fall through to the native video element.
              Transparent when controls are hidden; dimmed when controls/paused overlay is shown.
              onTouchEnd fires immediately on mobile (no 300ms delay); preventDefault blocks the
              follow-up synthetic click so we never double-fire. */}
          <div
            onClick={handleOverlayClick}
            onTouchEnd={(e) => { e.preventDefault(); handleOverlayClick(e); }}
            style={{
              position: 'absolute',
              inset: 0,
              background: showControls
                ? (isPlaying ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.45)')
                : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 2,
              touchAction: 'manipulation',
            }}
          >
            {/* Center play/pause — visible only when controls are shown or video is paused */}
            {(!isPlaying || showControls) && (
              <div
                className="cvp-center-play"
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  color: '#0b2849',
                  transition: 'background 0.2s ease, color 0.2s ease, transform 0.2s ease',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay(e);
                  setControls(true);
                  resetControlsTimer();
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  togglePlay(e);
                  setControls(true);
                  resetControlsTimer();
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#0b2849';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.transform = 'scale(1.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                  e.currentTarget.style.color = '#0b2849';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {isPlaying ? (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                ) : (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </div>
            )}
          </div>

          {/* Top Overlay details */}
          {showControls && (
            <div className="cvp-top-overlay" style={{
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
              <span style={{ fontSize: '15px', fontWeight: 'bold' }}>
                {lessonTitle}
              </span>
            </div>
          )}

          {/* Bottom Controls Overlay */}
          {showControls && (
            <div 
              className="cvp-bottom-overlay" 
              onClick={(e) => {
                e.stopPropagation();
                resetControlsTimer();
              }}
              style={{
                position: 'absolute',
                bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
                padding: '24px 20px 14px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                direction: 'ltr',
                zIndex: 5
              }}
            >
              
              {/* Timeline seekable slider bar with generous hit area & full drag/click support */}
              <div 
                ref={timelineRef}
                onMouseDown={handleTimelineMouseDown}
                onTouchStart={handleTimelineTouchStart}
                onClick={seekFromEvent}
                style={{
                  width: '100%',
                  padding: '10px 0',
                  margin: '-10px 0',
                  cursor: 'pointer',
                  position: 'relative',
                  direction: 'ltr',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  touchAction: 'none'
                }}
              >
                <div style={{
                  width: '100%',
                  height: '6px',
                  background: 'rgba(255,255,255,0.3)',
                  borderRadius: '3px',
                  position: 'relative',
                  direction: 'ltr',
                  pointerEvents: 'none'
                }}>
                  <div 
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #0b2849, #1b4b7a)',
                      border: '1px solid rgba(255,255,255,0.4)',
                      boxSizing: 'border-box',
                      borderRadius: '3px'
                    }}
                  >
                    {/* Scrubber thumb circle */}
                    <div style={{
                      position: 'absolute',
                      right: '-6px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#0b2849',
                      border: '2px solid #ffffff',
                      boxSizing: 'border-box',
                      pointerEvents: 'none'
                    }} />
                  </div>
                </div>
              </div>

              {/* Controls buttons row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', direction: 'ltr' }}>
                <div className="cvp-btn-row-left" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
                  <span className="cvp-time-display" style={{ fontSize: '13px', fontFamily: 'monospace' }}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Speed, Volume, Tools, and Fullscreen buttons */}
                <div className="cvp-btn-row-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  
                  {/* Copy Frame Button (Desktop Only) */}
                  <button 
                    className="cvp-desktop-only"
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
                    className="cvp-popover-anchor"
                    style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '10px', margin: '-10px' }}
                    onMouseEnter={() => {
                      if (!isTouchDevice()) {
                        setShowSpeedSlider(true);
                        setShowVolumeSlider(false);
                      }
                    }}
                    onMouseLeave={() => {
                      if (!isTouchDevice()) {
                        setShowSpeedSlider(false);
                      }
                    }}
                  >
                    {showSpeedSlider && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: 'absolute',
                          bottom: 'calc(100% - 5px)',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: 'rgba(11, 40, 73, 0.96)',
                          backdropFilter: 'blur(12px)',
                          border: '1px solid rgba(255, 255, 255, 0.18)',
                          borderRadius: '10px',
                          padding: '10px 8px 12px 8px',
                          zIndex: 10,
                          minWidth: '58px',
                          boxSizing: 'border-box',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)'
                        }}
                      >
                        <span style={{ fontSize: '11px', color: '#ffffff', fontWeight: 'bold', fontFamily: 'monospace', textAlign: 'center' }}>
                          {playbackSpeed.toFixed(1)}x
                        </span>

                        {/* Quick preset speed pills toggle (dropmenu bottom arrow) */}
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowSpeedPresets(prev => !prev);
                            }}
                            title={lang === 'ar' ? 'خيارات السرعة' : 'Preset Speeds'}
                            style={{
                              background: showSpeedPresets ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              borderRadius: '4px',
                              color: '#ffffff',
                              padding: '2px 6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '3px',
                              width: '100%',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span style={{ fontSize: '10px', opacity: 0.85 }}>{lang === 'ar' ? 'خيارات' : 'List'}</span>
                            <svg 
                              width="10" 
                              height="10" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2.5" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                              style={{
                                transform: showSpeedPresets ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s ease'
                              }}
                            >
                              <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                          </button>

                          {showSpeedPresets && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '100%', marginTop: '4px' }}>
                              {[0.75, 1.0, 1.25, 1.5, 2.0].map(s => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    changeSpeed(s);
                                    setShowSpeedSlider(false);
                                    setShowSpeedPresets(false);
                                  }}
                                  style={{
                                    background: Math.abs(playbackSpeed - s) < 0.05 ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.08)',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#ffffff',
                                    padding: '3px 6px',
                                    fontSize: '11px',
                                    fontWeight: Math.abs(playbackSpeed - s) < 0.05 ? '700' : '500',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    fontFamily: 'monospace',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  {s.toFixed(2).replace(/\.?0+$/, '')}x
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Fine-tuning range slider */}
                        <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                          <input 
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={playbackSpeed}
                            onInput={(e) => changeSpeed(parseFloat(e.target.value))}
                            onChange={(e) => changeSpeed(parseFloat(e.target.value))}
                            className="custom-video-range-slider"
                          />
                        </div>
                      </div>
                    )}
                    <button
                      className="cvp-speed-btn"
                      title={lang === 'ar' ? 'سرعة التشغيل' : 'Playback Speed'}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSpeedSlider(prev => !prev);
                        setShowVolumeSlider(false);
                        setShowCCMenu(false);
                        resetControlsTimer();
                      }}
                      onDoubleClick={() => changeSpeed(1)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ffffff',
                        padding: '0 4px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        outline: 'none',
                        lineHeight: '1',
                        fontFamily: 'monospace'
                      }}
                    >
                      <span>{playbackSpeed.toFixed(1)}x</span>
                    </button>
                  </div>

                  {/* Volume Selection */}
                  <div 
                    className="cvp-popover-anchor"
                    style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '10px', margin: '-10px' }}
                    onMouseEnter={() => {
                      if (!isTouchDevice()) {
                        setShowVolumeSlider(true);
                        setShowSpeedSlider(false);
                      }
                    }}
                    onMouseLeave={() => {
                      if (!isTouchDevice()) {
                        setShowVolumeSlider(false);
                      }
                    }}
                  >
                    {showVolumeSlider && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: 'absolute',
                          bottom: 'calc(100% - 5px)',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: 'rgba(11, 40, 73, 0.96)',
                          backdropFilter: 'blur(12px)',
                          border: '1px solid rgba(255, 255, 255, 0.18)',
                          borderRadius: '10px',
                          padding: '10px 8px 12px 8px',
                          zIndex: 10,
                          minWidth: '56px',
                          boxSizing: 'border-box',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)'
                        }}
                      >
                        <span style={{ fontSize: '10px', color: '#ffffff', fontWeight: 'bold', fontFamily: 'monospace', textAlign: 'center' }}>
                          {isMuted ? (lang === 'ar' ? 'مكتوم' : 'Muted') : `${Math.round(volume * 100)}%`}
                        </span>

                        {/* Quick Mute / Unmute button inside popover */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMute();
                          }}
                          style={{
                            background: isMuted ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '4px',
                            color: '#ffffff',
                            padding: '3px 6px',
                            fontSize: '10px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {isMuted ? (lang === 'ar' ? 'تشغيل' : 'Unmute') : (lang === 'ar' ? 'كتم' : 'Mute')}
                        </button>

                        <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <input 
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={isMuted ? 0 : volume}
                            onInput={(e) => handleVolumeChange(parseFloat(e.target.value))}
                            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                            className="custom-video-range-slider"
                          />
                        </div>
                      </div>
                    )}
                    <button 
                      title={lang === 'ar' ? 'مستوى الصوت / كتم' : 'Volume / Mute'}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isTouchDevice()) {
                          setShowVolumeSlider(prev => !prev);
                          setShowSpeedSlider(false);
                          setShowCCMenu(false);
                          resetControlsTimer();
                        } else {
                          toggleMute();
                        }
                      }}
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

                  {/* CC Subtitles Selection */}
                  <div 
                    className="cvp-popover-anchor"
                    style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '10px', margin: '-10px' }}
                    onMouseEnter={() => {
                      if (!isTouchDevice()) {
                        setShowCCMenu(true);
                        setShowSpeedSlider(false);
                        setShowVolumeSlider(false);
                      }
                    }}
                    onMouseLeave={() => {
                      if (!isTouchDevice()) {
                        setShowCCMenu(false);
                      }
                    }}
                  >
                    {showCCMenu && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: 'absolute',
                          bottom: 'calc(100% - 5px)',
                          right: '0px',
                          left: 'auto',
                          background: 'rgba(11, 40, 73, 0.96)',
                          backdropFilter: 'blur(12px)',
                          border: '1px solid rgba(255, 255, 255, 0.18)',
                          borderRadius: '10px',
                          padding: '8px',
                          zIndex: 10,
                          minWidth: '140px',
                          maxWidth: '220px',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          boxSizing: 'border-box',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'stretch',
                          gap: '4px',
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
                          direction: lang === 'ar' ? 'rtl' : 'ltr'
                        }}
                      >
                        <div style={{ fontSize: '11px', color: '#ffffff', fontWeight: 'bold', padding: '4px 8px', borderBottom: '1px solid rgba(255, 255, 255, 0.15)', textAlign: lang === 'ar' ? 'right' : 'left' }}>
                          {lang === 'ar' ? 'الترجمة والشرح' : 'Subtitles (CC)'}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectTrack('off');
                            setShowCCMenu(false);
                          }}
                          style={{
                            background: selectedTrackId === 'off' ? 'rgba(255, 255, 255, 0.18)' : 'transparent',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '7px 8px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            textAlign: lang === 'ar' ? 'right' : 'left',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontWeight: selectedTrackId === 'off' ? 'bold' : 'normal',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          <span>{lang === 'ar' ? 'إيقاف الترجمة' : 'Off'}</span>
                          {selectedTrackId === 'off' && <span>✓</span>}
                        </button>
                        {tracks.map(t => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectTrack(t.id);
                              setShowCCMenu(false);
                            }}
                            style={{
                              background: selectedTrackId === t.id ? 'rgba(255, 255, 255, 0.18)' : 'transparent',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '7px 8px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              textAlign: lang === 'ar' ? 'right' : 'left',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontWeight: selectedTrackId === t.id ? 'bold' : 'normal',
                              transition: 'background 0.15s ease'
                            }}
                          >
                            <span>{t.label || t.srclang || t.id}</span>
                            {selectedTrackId === t.id && <span>✓</span>}
                          </button>
                        ))}
                      </div>
                    )}
                    <button 
                      title={lang === 'ar' ? 'الترجمة والشرح (CC)' : 'Closed Captions (CC)'}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCCMenu(prev => !prev);
                        setShowSpeedSlider(false);
                        setShowVolumeSlider(false);
                        resetControlsTimer();
                      }}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: selectedTrackId !== 'off' ? '#ffffff' : 'rgba(255, 255, 255, 0.75)', 
                        padding: '3px 4px', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        position: 'relative'
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="3" ry="3"/>
                        <path d="M10 9H8a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2"/>
                        <path d="M18 9h-2a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2"/>
                      </svg>
                      {selectedTrackId !== 'off' && (
                        <div style={{
                          position: 'absolute',
                          bottom: '-1px',
                          left: '4px',
                          right: '4px',
                          height: '2px',
                          background: '#ffffff',
                          borderRadius: '1px'
                        }} />
                      )}
                    </button>
                  </div>

                  <button 
                    title={lang === 'ar' ? (isFullscreen ? 'تصغير الشاشة' : 'تكبير الشاشة') : (isFullscreen ? 'Exit Fullscreen' : 'Fullscreen')}
                    onClick={toggleFullscreen}
                    style={{ background: 'none', border: 'none', color: '#fff', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    {isFullscreen ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

            </div>
          )}
        </>
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '15px', flexDirection: 'column', gap: '10px', background: 'rgba(11,40,73,0.96)', padding: '20px', textAlign: 'center' }}>
          {!navigator.onLine ? (
            <>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(239,68,68,0.18)', color: '#ef4444', marginBottom: '4px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="1" y1="1" x2="23" y2="23"/>
                  <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
                  <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
                  <path d="M10.71 5.05A16 16 0 0 1 22.58 9"/>
                  <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
                  <line x1="12" y1="20" x2="12.01" y2="20"/>
                </svg>
              </div>
              <span style={{ fontWeight: 'bold' }}>{lang === 'ar' ? 'لا يوجد اتصال بالإنترنت' : 'No Internet Connection'}</span>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', maxWidth: '360px' }}>
                {lang === 'ar' ? 'يرجى التحقق من اتصال الشبكة لاستئناف بث المحاضرة.' : 'Please check your network connection to stream this video lesson.'}
              </span>
              <button 
                onClick={() => {
                  setVideoError(false);
                  setResolving(true);
                  if (lessonId && courseId) {
                    getSecureVideoUrl(lessonId, courseId).then(u => { setResolvedUrl(u); setResolving(false); }).catch(() => setResolving(false));
                  } else {
                    setResolving(false);
                  }
                }}
                style={{ marginTop: '6px', padding: '7px 20px', background: '#0b2849', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
              >
                {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
              </button>
            </>
          ) : (
            <>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{lang === 'ar' ? 'الفيديو غير متوفر أو تعذر تحميله' : 'Video not available or failed to load'}</span>
              <button 
                onClick={() => {
                  setVideoError(false);
                  setResolving(true);
                  setTimeout(() => setResolving(false), 500);
                }}
                style={{ marginTop: '8px', padding: '6px 16px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}
              >
                {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

