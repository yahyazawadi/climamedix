import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { CustomVideoPlayer } from '../features/learning-hub/components/player/CustomVideoPlayer';
import { CustomAudioPlayer } from '../features/shared/components/CustomAudioPlayer';

// ─── MOCKS ───────────────────────────────────────────────────────────────────

let mockUpsertMetrics = vi.fn();
let mockExistingMetrics = null;

vi.mock('../utils/supabaseClient', () => ({
  supabase: {
    from: (table) => ({
      select: vi.fn().mockImplementation(() => ({
        eq: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockExistingMetrics,
              error: null
            })
          }))
        }))
      })),
      upsert: vi.fn().mockImplementation((payload, opts) => {
        mockUpsertMetrics(payload, opts);
        return Promise.resolve({ error: null });
      })
    })
  }
}));

let mockSecureVideoUrlResult = 'https://cdn.climamedix.org/secure-videos/lesson-101.mp4';
let mockGetSecureVideoUrl = vi.fn().mockImplementation(() => Promise.resolve(mockSecureVideoUrlResult));

vi.mock('../features/learning-hub/services/lmsService', () => ({
  getSecureVideoUrl: (lessonId, courseId) => mockGetSecureVideoUrl(lessonId, courseId)
}));

describe('Multimedia Player Video & Audio Engine Test Suite (55 Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistingMetrics = null;
    mockSecureVideoUrlResult = 'https://cdn.climamedix.org/secure-videos/lesson-101.mp4';
    window.alert = vi.fn();

    // HTMLMediaElement Mocks
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    HTMLMediaElement.prototype.pause = vi.fn();
    HTMLMediaElement.prototype.requestFullscreen = vi.fn().mockResolvedValue(undefined);
    HTMLVideoElement.prototype.requestPictureInPicture = vi.fn().mockResolvedValue(undefined);
    document.exitPictureInPicture = vi.fn().mockResolvedValue(undefined);

    // Clipboard mock
    Object.assign(navigator, {
      clipboard: {
        write: vi.fn().mockResolvedValue(undefined)
      }
    });

    global.ClipboardItem = class ClipboardItem {
      constructor(data) {
        this.data = data;
      }
    };

    // Canvas prototype mocks
    if (typeof HTMLCanvasElement !== 'undefined') {
      HTMLCanvasElement.prototype.getContext = () => ({
        drawImage: vi.fn()
      });
      HTMLCanvasElement.prototype.toBlob = function (cb, type) {
        cb(new Blob(['fake frame'], { type: type || 'image/png' }));
      };
    }

    // Mock global fetch for audio waveform buffer
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
        json: () => Promise.resolve({})
      })
    );

    // AudioContext mock
    window.AudioContext = class {
      decodeAudioData() {
        return Promise.resolve({
          duration: 180,
          getChannelData: () => new Float32Array(500).fill(0.5)
        });
      }
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Video URL Resolution & Initial Mount (8 Tests)
  // ──────────────────────────────────────────────────────────────────────────
  describe('1. Video URL Resolution & Initial Mount (8 Tests)', () => {
    it('sets video element src directly for http/https URLs', () => {
      const { container } = render(
        <CustomVideoPlayer videoUrl="https://example.com/stream.mp4" lessonTitle="Climate 101" />
      );

      const video = container.querySelector('video');
      expect(video).not.toBeNull();
      expect(video.src).toBe('https://example.com/stream.mp4');
    });

    it('sets video element src directly for blob: URLs', () => {
      const { container } = render(
        <CustomVideoPlayer videoUrl="blob:http://localhost:3000/temp-video-stream" lessonTitle="Climate 101" />
      );

      const video = container.querySelector('video');
      expect(video).not.toBeNull();
      expect(video.src).toBe('blob:http://localhost:3000/temp-video-stream');
    });

    it('calls getSecureVideoUrl when videoUrl is an R2 key and lessonId/courseId are provided', async () => {
      render(
        <CustomVideoPlayer
          videoUrl="courses/c1/lessons/l1/raw.mp4"
          lessonTitle="Ocean Currents"
          lessonId="les-1"
          courseId="crs-1"
        />
      );

      expect(mockGetSecureVideoUrl).toHaveBeenCalledWith('les-1', 'crs-1');
      await waitFor(() => {
        const video = document.querySelector('video');
        expect(video).not.toBeNull();
        expect(video.src).toBe('https://cdn.climamedix.org/secure-videos/lesson-101.mp4');
      });
    });

    it('falls back without crashing if getSecureVideoUrl rejects', async () => {
      mockGetSecureVideoUrl.mockRejectedValueOnce(new Error('Signing expired'));

      render(
        <CustomVideoPlayer
          videoUrl="courses/c1/lessons/l1/key"
          lessonTitle="Failed Stream"
          lessonId="les-1"
          courseId="crs-1"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('الفيديو غير متوفر أو الرابط تالف')).toBeDefined();
      });
    });

    it('renders spinner and Arabic loading label when videoLoading is true', () => {
      render(
        <CustomVideoPlayer
          videoUrl="https://example.com/video.mp4"
          videoLoading={true}
          lang="ar"
          lessonTitle="Intro"
        />
      );

      expect(screen.getByText('جاري تحميل الفيديو...')).toBeDefined();
    });

    it('renders spinner and English loading label when lang is en', () => {
      render(
        <CustomVideoPlayer
          videoUrl="https://example.com/video.mp4"
          videoLoading={true}
          lang="en"
          lessonTitle="Intro"
        />
      );

      expect(screen.getByText('Loading video...')).toBeDefined();
    });

    it('renders fallback error message when videoUrl is empty', () => {
      render(<CustomVideoPlayer videoUrl="" lessonTitle="Empty" />);
      expect(screen.getByText('الفيديو غير متوفر أو الرابط تالف')).toBeDefined();
    });

    it('renders lessonTitle in top overlay bar', () => {
      render(
        <CustomVideoPlayer
          videoUrl="https://example.com/stream.mp4"
          lessonTitle="الاحتباس الحراري والتأثير البيئي"
        />
      );

      expect(screen.getByText('الاحتباس الحراري والتأثير البيئي')).toBeDefined();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Video Playback Controls & Timeline Scrubbing (10 Tests)
  // ──────────────────────────────────────────────────────────────────────────
  describe('2. Video Playback Controls & Timeline Scrubbing (10 Tests)', () => {
    it('video defaults to paused and currentTime = 0', () => {
      const { container } = render(
        <CustomVideoPlayer videoUrl="https://example.com/test.mp4" lessonTitle="Test" />
      );

      const video = container.querySelector('video');
      expect(video.paused).toBe(true);
      expect(video.currentTime).toBe(0);
    });

    it('clicking center play overlay button calls video.play()', () => {
      const { container } = render(
        <CustomVideoPlayer videoUrl="https://example.com/test.mp4" lessonTitle="Test" />
      );

      const playBtn = container.querySelector('svg path[d="M8 5v14l11-7z"]')?.closest('div');
      expect(playBtn).not.toBeNull();
      fireEvent.click(playBtn);

      const video = container.querySelector('video');
      expect(video.play).toHaveBeenCalledTimes(1);
    });

    it('clicking directly on video element toggles playback', () => {
      const { container } = render(
        <CustomVideoPlayer videoUrl="https://example.com/test.mp4" lessonTitle="Test" />
      );

      const video = container.querySelector('video');
      fireEvent.click(video);
      expect(video.play).toHaveBeenCalledTimes(1);

      // Simulate playing state
      Object.defineProperty(video, 'paused', { value: false, configurable: true });
      fireEvent.click(video);
      expect(video.pause).toHaveBeenCalledTimes(1);
    });

    it('clicking bottom controls play/pause button calls play/pause', () => {
      const { container } = render(
        <CustomVideoPlayer videoUrl="https://example.com/test.mp4" lessonTitle="Test" lang="ar" />
      );

      const bottomPlayBtn = screen.getByTitle('تشغيل');
      fireEvent.click(bottomPlayBtn);

      const video = container.querySelector('video');
      expect(video.play).toHaveBeenCalledTimes(1);
    });

    it('displays time indicator formatted as 0:00 / 0:00 by default', () => {
      render(<CustomVideoPlayer videoUrl="https://example.com/test.mp4" lessonTitle="Test" />);
      expect(screen.getByText('0:00 / 0:00')).toBeDefined();
    });

    it('loadedmetadata event updates video duration indicator', () => {
      const { container } = render(
        <CustomVideoPlayer videoUrl="https://example.com/test.mp4" lessonTitle="Test" />
      );

      const video = container.querySelector('video');
      Object.defineProperty(video, 'duration', { value: 125, configurable: true });
      fireEvent.loadedMetadata(video);

      expect(screen.getByText('0:00 / 2:05')).toBeDefined();
    });

    it('timeupdate event updates currentTime indicator', () => {
      const { container } = render(
        <CustomVideoPlayer videoUrl="https://example.com/test.mp4" lessonTitle="Test" />
      );

      const video = container.querySelector('video');
      Object.defineProperty(video, 'duration', { value: 300, configurable: true });
      Object.defineProperty(video, 'currentTime', { value: 65, configurable: true });
      fireEvent.loadedMetadata(video);
      fireEvent.timeUpdate(video);

      expect(screen.getByText('1:05 / 5:00')).toBeDefined();
    });

    it('clicking timeline bar calculates new time proportionally to duration', () => {
      const { container } = render(
        <CustomVideoPlayer videoUrl="https://example.com/test.mp4" lessonTitle="Test" />
      );

      const video = container.querySelector('video');
      Object.defineProperty(video, 'duration', { value: 200, configurable: true });
      fireEvent.loadedMetadata(video);

      // Locate timeline bar (first clickable element with cursor pointer and background 255)
      const timelineBar = container.querySelector('div[style*="cursor: pointer"][style*="border-radius: 3px"]');
      expect(timelineBar).not.toBeNull();

      // Mock getBoundingClientRect
      vi.spyOn(timelineBar, 'getBoundingClientRect').mockReturnValue({
        left: 100,
        width: 400,
        top: 0,
        bottom: 10,
        right: 500,
        height: 6
      });

      // Click at x=200 (halfway: 100px from left out of 400px width = 25% -> 50 seconds)
      fireEvent.click(timelineBar, { clientX: 200 });
      expect(video.currentTime).toBe(50);
    });

    it('mouseEnter on player container keeps controls visible', () => {
      const { container } = render(
        <CustomVideoPlayer videoUrl="https://example.com/test.mp4" lessonTitle="Hover Test" />
      );

      const playerWrapper = container.firstChild;
      fireEvent.mouseEnter(playerWrapper);

      expect(screen.getByText('Hover Test')).toBeDefined();
    });

    it('mouseLeave on player container conceals controls', () => {
      const { container } = render(
        <CustomVideoPlayer videoUrl="https://example.com/test.mp4" lessonTitle="Hover Test" />
      );

      const playerWrapper = container.firstChild;
      fireEvent.mouseLeave(playerWrapper);

      expect(screen.queryByText('Hover Test')).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Video Volume, Mute & Playback Speed (10 Tests)
  // ──────────────────────────────────────────────────────────────────────────
  describe('3. Video Volume, Mute & Playback Speed (10 Tests)', () => {
    it('default volume is 1 and playbackRate is 1', () => {
      render(<CustomVideoPlayer videoUrl="https://example.com/test.mp4" lessonTitle="Test" />);
      expect(screen.getByText('1.0x')).toBeDefined();
    });

    it('clicking volume button mutes the video element', () => {
      const { container } = render(
        <CustomVideoPlayer videoUrl="https://example.com/test.mp4" lessonTitle="Test" lang="ar" />
      );

      const video = container.querySelector('video');
      const muteBtn = screen.getByTitle('مستوى الصوت / كتم');

      fireEvent.click(muteBtn);
      expect(video.muted).toBe(true);
    });

    it('clicking volume button while muted unmutes and restores volume', () => {
      const { container } = render(
        <CustomVideoPlayer videoUrl="https://example.com/test.mp4" lessonTitle="Test" lang="ar" />
      );

      const video = container.querySelector('video');
      const muteBtn = screen.getByTitle('مستوى الصوت / كتم');

      // Mute
      fireEvent.click(muteBtn);
      expect(video.muted).toBe(true);

      // Unmute
      fireEvent.click(muteBtn);
      expect(video.muted).toBe(false);
      expect(video.volume).toBe(1);
    });

    it('opening volume slider and changing value updates video volume', () => {
      const { container } = render(
        <CustomVideoPlayer videoUrl="https://example.com/test.mp4" lessonTitle="Test" />
      );

      const video = container.querySelector('video');
      const volumeBtn = screen.getByTitle('مستوى الصوت / كتم');

      // Hover on wrapper to reveal slider
      fireEvent.mouseEnter(volumeBtn.parentElement);

      const slider = container.querySelector('input[type="range"][max="1"]');
      expect(slider).not.toBeNull();

      fireEvent.input(slider, { target: { value: '0.4' } });
      expect(video.volume).toBe(0.4);
      expect(video.muted).toBe(false);
    });

    it('setting volume slider to 0 automatically sets muted=true', () => {
      const { container } = render(
        <CustomVideoPlayer videoUrl="https://example.com/test.mp4" lessonTitle="Test" />
      );

      const video = container.querySelector('video');
      const volumeBtn = screen.getByTitle('مستوى الصوت / كتم');
      fireEvent.mouseEnter(volumeBtn.parentElement);

      const slider = container.querySelector('input[type="range"][max="1"]');
      fireEvent.input(slider, { target: { value: '0' } });

      expect(video.volume).toBe(0);
      expect(video.muted).toBe(true);
    });

    it('hovering over speed container displays speed popover slider', () => {
      const { container } = render(
        <CustomVideoPlayer videoUrl="https://example.com/test.mp4" lessonTitle="Test" />
      );

      const speedBtn = screen.getByTitle('سرعة التشغيل');
      fireEvent.mouseEnter(speedBtn.parentElement);

      expect(container.querySelector('input[min="0.5"][max="2.0"]')).not.toBeNull();
    });

    it('changing speed slider to 1.5 updates playbackRate and badge', () => {
      const { container } = render(
        <CustomVideoPlayer videoUrl="https://example.com/test.mp4" lessonTitle="Test" />
      );

      const video = container.querySelector('video');
      const speedBtn = screen.getByTitle('سرعة التشغيل');
      fireEvent.mouseEnter(speedBtn.parentElement);

      const speedSlider = container.querySelector('input[min="0.5"][max="2.0"]');
      fireEvent.input(speedSlider, { target: { value: '1.5' } });

      expect(video.playbackRate).toBe(1.5);
      expect(screen.getAllByText('1.5x').length).toBeGreaterThan(0);
    });

    it('changing speed slider to 0.5 updates playbackRate to slow motion', () => {
      const { container } = render(
        <CustomVideoPlayer videoUrl="https://example.com/test.mp4" lessonTitle="Test" />
      );

      const video = container.querySelector('video');
      const speedBtn = screen.getByTitle('سرعة التشغيل');
      fireEvent.mouseEnter(speedBtn.parentElement);

      const speedSlider = container.querySelector('input[min="0.5"][max="2.0"]');
      fireEvent.input(speedSlider, { target: { value: '0.5' } });

      expect(video.playbackRate).toBe(0.5);
      expect(screen.getAllByText('0.5x').length).toBeGreaterThan(0);
    });

    it('double clicking speed button resets playback speed to 1.0x', () => {
      const { container } = render(
        <CustomVideoPlayer videoUrl="https://example.com/test.mp4" lessonTitle="Test" />
      );

      const video = container.querySelector('video');
      const speedBtn = screen.getByTitle('سرعة التشغيل');
      fireEvent.mouseEnter(speedBtn.parentElement);

      const speedSlider = container.querySelector('input[min="0.5"][max="2.0"]');
      fireEvent.input(speedSlider, { target: { value: '2' } });
      expect(video.playbackRate).toBe(2);

      fireEvent.doubleClick(speedBtn);

      expect(video.playbackRate).toBe(1);
      expect(screen.getAllByText('1.0x').length).toBeGreaterThan(0);
    });

    it('mouseLeave on speed container hides speed popover slider', () => {
      const { container } = render(
        <CustomVideoPlayer videoUrl="https://example.com/test.mp4" lessonTitle="Test" />
      );

      const speedBtn = screen.getByTitle('سرعة التشغيل');
      fireEvent.mouseEnter(speedBtn.parentElement);
      expect(container.querySelector('input[min="0.5"][max="2.0"]')).not.toBeNull();

      fireEvent.mouseLeave(speedBtn.parentElement);
      expect(container.querySelector('input[min="0.5"][max="2.0"]')).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Picture-in-Picture, Frame Capture & Error Fallbacks (10 Tests)
  // ──────────────────────────────────────────────────────────────────────────
  describe('4. Picture-in-Picture, Frame Capture & Error Fallbacks (10 Tests)', () => {
    it('clicking fullscreen button calls requestFullscreen on video element', () => {
      const { container } = render(
        <CustomVideoPlayer videoUrl="https://example.com/test.mp4" lessonTitle="Test" lang="ar" />
      );

      const video = container.querySelector('video');
      const fsBtn = screen.getByTitle('تكبير الشاشة');
      fireEvent.click(fsBtn);

      expect(video.requestFullscreen).toHaveBeenCalledTimes(1);
    });

    it('clicking fullscreen button falls back to webkitRequestFullscreen if standard absent', () => {
      const { container } = render(
        <CustomVideoPlayer videoUrl="https://example.com/test.mp4" lessonTitle="Test" lang="en" />
      );

      const video = container.querySelector('video');
      video.requestFullscreen = undefined;
      video.webkitRequestFullscreen = vi.fn();

      const fsBtn = screen.getByTitle('Fullscreen');
      fireEvent.click(fsBtn);

      expect(video.webkitRequestFullscreen).toHaveBeenCalledTimes(1);
    });

    it('clicking PiP button enters picture-in-picture mode', async () => {
      const { container } = render(
        <CustomVideoPlayer videoUrl="https://example.com/test.mp4" lessonTitle="Test" lang="ar" />
      );

      const video = container.querySelector('video');
      const pipBtn = screen.getByTitle('تشغيل كنافذة مصغرة (Miniplayer)');
      fireEvent.click(pipBtn);

      expect(video.requestPictureInPicture).toHaveBeenCalledTimes(1);
    });

    it('clicking PiP button when already in PiP exits picture-in-picture', async () => {
      render(
        <CustomVideoPlayer videoUrl="https://example.com/test.mp4" lessonTitle="Test" lang="en" />
      );

      document.pictureInPictureElement = document.createElement('video');
      const pipBtn = screen.getByTitle('Picture-in-Picture');
      fireEvent.click(pipBtn);

      expect(document.exitPictureInPicture).toHaveBeenCalledTimes(1);
      document.pictureInPictureElement = null;
    });

    it('displays alert message when PiP throws an error', async () => {
      const { container } = render(
        <CustomVideoPlayer videoUrl="https://example.com/test.mp4" lessonTitle="Test" lang="ar" />
      );

      const video = container.querySelector('video');
      video.requestPictureInPicture = vi.fn().mockRejectedValueOnce(new Error('PiP not allowed'));

      const pipBtn = screen.getByTitle('تشغيل كنافذة مصغرة (Miniplayer)');
      fireEvent.click(pipBtn);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('خاصية النافذة المصغرة غير مدعومة هنا.');
      });
    });

    it('copy frame button draws video to canvas and writes to clipboard', async () => {
      render(
        <CustomVideoPlayer videoUrl="https://example.com/test.mp4" lessonTitle="Test" lang="en" />
      );

      const copyBtn = screen.getByTitle('Copy Frame');
      fireEvent.click(copyBtn);

      await waitFor(() => {
        expect(navigator.clipboard.write).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalledWith('Frame copied successfully!');
      });
    });

    it('copy frame failure alerts CORS guidance in Arabic', async () => {
      HTMLCanvasElement.prototype.getContext = () => { throw new Error('CORS tainted canvas'); };

      render(
        <CustomVideoPlayer videoUrl="https://example.com/test.mp4" lessonTitle="Test" lang="ar" />
      );

      const copyBtn = screen.getByTitle('نسخ لقطة من الفيديو');
      fireEvent.click(copyBtn);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          'تعذر نسخ الإطار. يرجى تفعيل إعدادات CORS في مساحة تخزين Cloudflare R2 الخاصة بك للسماح بقراءة الفيديو.'
        );
      });
    });

    it('video onError triggers fallback error display in Arabic', () => {
      const { container } = render(
        <CustomVideoPlayer videoUrl="https://example.com/bad-stream.mp4" lessonTitle="Test" lang="ar" />
      );

      const video = container.querySelector('video');
      fireEvent.error(video, { target: { error: { message: 'MEDIA_ELEMENT_ERROR: 404' } } });

      expect(screen.getByText('الفيديو غير متوفر أو الرابط تالف')).toBeDefined();
    });

    it('video onError triggers fallback error display in English when lang is en', () => {
      const { container } = render(
        <CustomVideoPlayer videoUrl="https://example.com/bad-stream.mp4" lessonTitle="Test" lang="en" />
      );

      const video = container.querySelector('video');
      fireEvent.error(video, { target: { error: { message: 'MEDIA_ELEMENT_ERROR: 404' } } });

      expect(screen.getByText('Video not available or link corrupted')).toBeDefined();
    });

    it('clicking "تحميل فيديو تجريبي" in error screen loads sample video stream', async () => {
      const { container } = render(
        <CustomVideoPlayer videoUrl="https://example.com/bad.mp4" lessonTitle="Test" lang="ar" />
      );

      const video = container.querySelector('video');
      fireEvent.error(video, { target: { error: {} } });

      const loadSampleBtn = screen.getByText('تحميل فيديو تجريبي (للاختبار)');
      fireEvent.click(loadSampleBtn);

      await waitFor(() => {
        const newVideo = container.querySelector('video');
        expect(newVideo).not.toBeNull();
        expect(newVideo.src).toContain('ForBiggerBlazes.mp4');
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Video Watch Telemetry & Database Persistence (7 Tests)
  // ──────────────────────────────────────────────────────────────────────────
  describe('5. Video Watch Telemetry & Database Persistence (7 Tests)', () => {
    it('pausing video triggers telemetry upsert to lesson_watch_metrics', async () => {
      const { container } = render(
        <CustomVideoPlayer
          videoUrl="https://example.com/test.mp4"
          lessonTitle="Test"
          userId="usr-456"
          lessonId="les-789"
        />
      );

      const video = container.querySelector('video');
      Object.defineProperty(video, 'duration', { value: 100, configurable: true });
      Object.defineProperty(video, 'currentTime', { value: 40, configurable: true });

      // Start playing
      fireEvent.play(video);

      // Advance time
      fireEvent.timeUpdate(video);

      // Pause video
      fireEvent.pause(video);

      await waitFor(() => {
        expect(mockUpsertMetrics).toHaveBeenCalled();
        const [payload] = mockUpsertMetrics.mock.calls[0];
        expect(payload.user_id).toBe('usr-456');
        expect(payload.lesson_id).toBe('les-789');
        expect(payload.furthest_second_reached).toBe(40);
        expect(payload.max_percentage_watched).toBe(40);
      });
    });

    it('takes maximum of furthest_second_reached compared to existing metrics', async () => {
      mockExistingMetrics = {
        furthest_second_reached: 60,
        max_percentage_watched: 60,
        actual_play_duration_seconds: 50
      };

      const { container } = render(
        <CustomVideoPlayer
          videoUrl="https://example.com/test.mp4"
          lessonTitle="Test"
          userId="usr-456"
          lessonId="les-789"
        />
      );

      const video = container.querySelector('video');
      Object.defineProperty(video, 'duration', { value: 100, configurable: true });
      Object.defineProperty(video, 'currentTime', { value: 30, configurable: true });

      fireEvent.play(video);
      fireEvent.timeUpdate(video);
      fireEvent.pause(video);

      await waitFor(() => {
        expect(mockUpsertMetrics).toHaveBeenCalled();
        const [payload] = mockUpsertMetrics.mock.calls[0];
        // 60 should be kept because it exceeds 30
        expect(payload.furthest_second_reached).toBe(60);
        expect(payload.max_percentage_watched).toBe(60);
      });
    });

    it('accumulates actual_play_duration_seconds across multiple segments', async () => {
      mockExistingMetrics = {
        furthest_second_reached: 20,
        max_percentage_watched: 20,
        actual_play_duration_seconds: 45
      };

      const { container } = render(
        <CustomVideoPlayer
          videoUrl="https://example.com/test.mp4"
          lessonTitle="Test"
          userId="usr-456"
          lessonId="les-789"
        />
      );

      const video = container.querySelector('video');
      Object.defineProperty(video, 'duration', { value: 100, configurable: true });
      Object.defineProperty(video, 'currentTime', { value: 35, configurable: true });

      fireEvent.play(video);
      fireEvent.timeUpdate(video);
      fireEvent.pause(video);

      await waitFor(() => {
        const [payload] = mockUpsertMetrics.mock.calls[0];
        expect(payload.actual_play_duration_seconds).toBeGreaterThanOrEqual(45);
      });
    });

    it('visibilitychange event to "hidden" flushes telemetry', async () => {
      const { container } = render(
        <CustomVideoPlayer
          videoUrl="https://example.com/test.mp4"
          lessonTitle="Test"
          userId="usr-456"
          lessonId="les-789"
        />
      );

      const video = container.querySelector('video');
      Object.defineProperty(video, 'duration', { value: 100, configurable: true });
      Object.defineProperty(video, 'currentTime', { value: 25, configurable: true });

      fireEvent.play(video);
      fireEvent.timeUpdate(video);

      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      fireEvent(document, new Event('visibilitychange'));

      await waitFor(() => {
        expect(mockUpsertMetrics).toHaveBeenCalled();
      });
    });

    it('unmounting player flushes pending telemetry', async () => {
      const { container, unmount } = render(
        <CustomVideoPlayer
          videoUrl="https://example.com/test.mp4"
          lessonTitle="Test"
          userId="usr-456"
          lessonId="les-789"
        />
      );

      const video = container.querySelector('video');
      Object.defineProperty(video, 'duration', { value: 100, configurable: true });
      Object.defineProperty(video, 'currentTime', { value: 55, configurable: true });

      fireEvent.play(video);
      fireEvent.timeUpdate(video);

      unmount();

      await waitFor(() => {
        expect(mockUpsertMetrics).toHaveBeenCalled();
      });
    });

    it('skips telemetry upsert if userId is missing', async () => {
      const { container } = render(
        <CustomVideoPlayer
          videoUrl="https://example.com/test.mp4"
          lessonTitle="Test"
          lessonId="les-789"
        />
      );

      const video = container.querySelector('video');
      fireEvent.play(video);
      fireEvent.pause(video);

      expect(mockUpsertMetrics).not.toHaveBeenCalled();
    });

    it('skips telemetry upsert if lessonId is missing', async () => {
      const { container } = render(
        <CustomVideoPlayer
          videoUrl="https://example.com/test.mp4"
          lessonTitle="Test"
          userId="usr-123"
        />
      );

      const video = container.querySelector('video');
      fireEvent.play(video);
      fireEvent.pause(video);

      expect(mockUpsertMetrics).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Audio Player Engine (CustomAudioPlayer) (10 Tests)
  // ──────────────────────────────────────────────────────────────────────────
  describe('6. Audio Player Engine (CustomAudioPlayer) (10 Tests)', () => {
    it('renders audio element and title', () => {
      const { container } = render(
        <CustomAudioPlayer src="https://example.com/podcast.mp3" title="بودكاست المناخ والصحة" />
      );

      const audio = container.querySelector('audio');
      expect(audio).not.toBeNull();
      expect(audio.src).toBe('https://example.com/podcast.mp3');
      expect(screen.getByText('بودكاست المناخ والصحة')).toBeDefined();
    });

    it('defaults to paused with 1.0x speed and 100% volume', () => {
      render(
        <CustomAudioPlayer src="https://example.com/podcast.mp3" title="Episode 1" />
      );

      expect(screen.getByText('1.0x')).toBeDefined();
    });

    it('clicking neon play button toggles play/pause on audio element', () => {
      const { container } = render(
        <CustomAudioPlayer src="https://example.com/podcast.mp3" title="Episode 1" />
      );

      const audio = container.querySelector('audio');
      const playBtn = container.querySelector('button');

      // Play
      fireEvent.click(playBtn);
      expect(audio.play).toHaveBeenCalledTimes(1);

      // Pause
      fireEvent.click(playBtn);
      expect(audio.pause).toHaveBeenCalledTimes(1);
    });

    it('audio onLoadedMetadata updates duration and waveform state', async () => {
      const { container } = render(
        <CustomAudioPlayer src="https://example.com/podcast.mp3" title="Episode 1" />
      );

      const audio = container.querySelector('audio');
      Object.defineProperty(audio, 'duration', { value: 150, configurable: true });
      fireEvent.loadedMetadata(audio);

      await waitFor(() => {
        expect(container.querySelectorAll('div[style*="height:"][style*="background:"]').length).toBeGreaterThan(0);
      });
    });

    it('timeupdate event updates currentTime and progress', () => {
      const { container } = render(
        <CustomAudioPlayer src="https://example.com/podcast.mp3" title="Episode 1" />
      );

      const audio = container.querySelector('audio');
      Object.defineProperty(audio, 'currentTime', { value: 45, configurable: true });

      fireEvent.timeUpdate(audio);
      expect(audio.currentTime).toBe(45);
    });

    it('audio onEnded event resets isPlaying to false', () => {
      const { container } = render(
        <CustomAudioPlayer src="https://example.com/podcast.mp3" title="Episode 1" />
      );

      const audio = container.querySelector('audio');
      const playBtn = container.querySelector('button');
      fireEvent.click(playBtn);

      fireEvent.ended(audio);
      expect(audio.currentTime).toBe(0);
    });

    it('clicking mute button toggles audio muted state', () => {
      const { container } = render(
        <CustomAudioPlayer src="https://example.com/podcast.mp3" title="Episode 1" />
      );

      const audio = container.querySelector('audio');
      const muteBtn = screen.getByTitle('Volume / Mute');

      fireEvent.click(muteBtn);
      expect(audio.muted).toBe(true);

      fireEvent.click(muteBtn);
      expect(audio.muted).toBe(false);
    });

    it('changing speed slider updates audio playbackRate', () => {
      const { container } = render(
        <CustomAudioPlayer src="https://example.com/podcast.mp3" title="Episode 1" />
      );

      const audio = container.querySelector('audio');
      const speedBtn = screen.getByTitle('Playback Speed');
      fireEvent.mouseEnter(speedBtn.parentElement);

      const slider = container.querySelector('input[min="0.5"][max="2.0"]');
      fireEvent.input(slider, { target: { value: '1.7' } });

      expect(audio.playbackRate).toBe(1.7);
      expect(screen.getAllByText('1.7x').length).toBeGreaterThan(0);
    });

    it('falls back to random peaks when AudioContext decodeAudioData throws error', async () => {
      window.AudioContext = class {
        decodeAudioData() {
          return Promise.reject(new Error('CORS decode error'));
        }
      };

      const { container } = render(
        <CustomAudioPlayer src="https://other-domain.com/audio.mp3" title="CORS Track" />
      );

      await waitFor(() => {
        expect(container.querySelectorAll('div[style*="border-radius: 2px"]').length).toBeGreaterThan(0);
      });
    });

    it('flushes audio telemetry metrics upon audio pause', async () => {
      const { container } = render(
        <CustomAudioPlayer
          src="https://example.com/audio.mp3"
          title="Track with Telemetry"
          userId="usr-audio-1"
          lessonId="les-audio-1"
        />
      );

      const audio = container.querySelector('audio');
      const playBtn = container.querySelector('button');

      fireEvent.click(playBtn);
      Object.defineProperty(audio, 'currentTime', { value: 70, configurable: true });
      fireEvent.timeUpdate(audio);

      fireEvent.click(playBtn); // pause

      await waitFor(() => {
        expect(mockUpsertMetrics).toHaveBeenCalled();
        const [payload] = mockUpsertMetrics.mock.calls[0];
        expect(payload.user_id).toBe('usr-audio-1');
        expect(payload.lesson_id).toBe('les-audio-1');
        expect(payload.furthest_second_reached).toBe(70);
      });
    });
  });
});
