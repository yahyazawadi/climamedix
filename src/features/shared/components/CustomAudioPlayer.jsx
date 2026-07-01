import { useState, useEffect, useRef } from 'preact/hooks';

export function CustomAudioPlayer({ src, title = 'Audio Track' }) {
  const [peaks, setPeaks] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(true);
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
    <div dir="ltr" className="custom-audio-player-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '20px', width: '100%', maxWidth: '600px', background: 'rgba(255, 255, 255, 0.03)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '14px', marginBottom: '8px' }}>
          <span style={{ fontWeight: 'bold' }}>{title}</span>
          <span style={{ color: '#15b47a', fontWeight: 'bold' }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
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
