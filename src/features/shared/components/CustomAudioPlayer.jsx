import { useState, useEffect, useRef } from 'preact/hooks';

export function CustomAudioPlayer({ src, title = 'Audio Track' }) {
  const [peaks, setPeaks] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSpeedSlider, setShowSpeedSlider] = useState(false);
  const audioRef = useRef(null);
  const waveformRef = useRef(null);

  // Helper to format time (e.g. 02:15)
  const formatTime = (time) => {
    if (!time || isNaN(time)) return '00:00';
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  useEffect(() => {
    if (!src) return;

    let isMounted = true;
    setLoading(true);

    const generateWaveform = async () => {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        
        if (!isMounted) return;
        
        const channelData = audioBuffer.getChannelData(0); // use first channel
        const samples = 100; // number of bars we want
        const blockSize = Math.floor(channelData.length / samples);
        const newPeaks = [];
        let max = 0;

        for (let i = 0; i < samples; i++) {
          let blockStart = blockSize * i;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[blockStart + j]);
          }
          let peak = sum / blockSize;
          if (peak > max) max = peak;
          newPeaks.push(peak);
        }

        // Normalize peaks to 0..1
        const normalizedPeaks = newPeaks.map(p => (max ? p / max : 0));
        setPeaks(normalizedPeaks);
        setDuration(audioBuffer.duration);
        setLoading(false);
      } catch (err) {
        console.error("Error generating waveform", err);
        setLoading(false);
      }
    };

    generateWaveform();

    return () => {
      isMounted = false;
    };
  }, [src]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const changeSpeed = (speed) => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  const handleVolumeChange = (newVal) => {
    setVolume(newVal);
    if (audioRef.current) {
      audioRef.current.volume = newVal;
      const isCurrentlyMuted = newVal === 0;
      audioRef.current.muted = isCurrentlyMuted;
      setIsMuted(isCurrentlyMuted);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.muted = false;
      setIsMuted(false);
      audioRef.current.volume = volume || 1;
    } else {
      audioRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e) => {
    if (!audioRef.current || duration === 0) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) : 0;
  
  // Calculate how many bars should be highlighted
  const activeBarsCount = Math.floor(progressPercent * peaks.length);

  return (
    <div dir="ltr" className="custom-audio-player-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '24px', width: '100%', maxWidth: '100%', background: '#0b2849', padding: '24px 32px', borderRadius: '16px', boxShadow: '0 8px 30px rgba(11, 40, 73, 0.15)' }}>
      <audio 
        ref={audioRef} 
        src={src} 
        onTimeUpdate={handleTimeUpdate} 
        onEnded={handleEnded} 
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        preload="metadata"
      />
      
      {/* Neon Play Button */}
      <button style={{
        flexShrink: 0, width: '60px', height: '60px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: '2px solid #15b47a',
        boxShadow: '0 0 15px rgba(21, 180, 122, 0.4), inset 0 0 10px rgba(21, 180, 122, 0.2)',
        color: '#15b47a', transition: 'background 0.2s ease, color 0.2s ease, transform 0.2s ease'
      }}
      onClick={togglePlay}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#15b47a'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'scale(1.05)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#15b47a'; e.currentTarget.style.transform = 'scale(1)'; }}>
        {isPlaying ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        )}
      </button>

      {/* Info & Waveform */}
      <div style={{ flexGrow: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', fontSize: '14px', marginBottom: '12px' }}>
          <span style={{ fontWeight: 'bold' }}>{title}</span>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Speed Selection */}
            <div 
              style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '10px', margin: '-10px' }}
              onMouseEnter={() => { setShowSpeedSlider(true); setShowVolumeSlider(false); }}
              onMouseLeave={() => setShowSpeedSlider(false)}
            >
              {showSpeedSlider && (
                <div style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 5px)',
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
                title="Playback Speed"
                onClick={() => { setShowSpeedSlider(!showSpeedSlider); setShowVolumeSlider(false); }}
                onDoubleClick={() => changeSpeed(1)}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  borderRadius: '6px',
                  padding: '2px 6px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '36px',
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
                  bottom: 'calc(100% + 5px)',
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
                title="Volume / Mute"
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
            
            <span style={{ color: '#15b47a', fontWeight: 'bold', fontFamily: 'monospace' }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
        
        {/* Simple Progress Line */}
        <div 
          style={{ width: '100%', height: '2px', background: 'rgba(255,255,255,0.2)', position: 'relative', cursor: 'pointer' }}
          onClick={handleSeek}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${progressPercent * 100}%`, background: '#15b47a', boxShadow: '0 0 8px #15b47a', transition: 'width 0.1s linear' }} />
        </div>
        
        {/* Accurate Waveform */}
        <div 
          ref={waveformRef}
          style={{ display: 'flex', gap: '2px', marginTop: '10px', height: '30px', alignItems: 'flex-end', cursor: 'pointer' }}
          onClick={handleSeek}
        >
          {loading ? (
             <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Generating waveform...</div>
          ) : peaks.length > 0 ? (
            peaks.map((p, i) => {
              const isActive = i < activeBarsCount;
              // Add a minimum height so silence is still a small bar
              const height = Math.max(3, p * 30);
              return (
                <div 
                  key={i} 
                  style={{ 
                    flex: 1, 
                    height: `${height}px`, 
                    background: isActive ? '#15b47a' : 'rgba(255,255,255,0.2)', 
                    borderRadius: '2px',
                    transition: 'background 0.1s linear'
                  }} 
                />
              )
            })
          ) : (
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Waveform not available</div>
          )}
        </div>
      </div>
    </div>
  );
}
