import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { Component } from 'preact';

// Mock react-quill to provide Preact-compatible component rendering and Quill exports
vi.mock('react-quill', async () => {
  const { Component } = await vi.importActual('preact');
  class MockBlockEmbed {
    static create(url) {
      const node = document.createElement('div');
      node.setAttribute('src', url || '');
      return node;
    }
    static value(node) {
      return node.getAttribute('src');
    }
  }

  const mockQuill = {
    registeredBlots: {},
    import: vi.fn((path) => {
      if (path === 'blots/block/embed') return MockBlockEmbed;
      return null;
    }),
    register: vi.fn((blot) => {
      if (blot && blot.blotName) {
        mockQuill.registeredBlots[blot.blotName] = blot;
      }
    }),
  };

  class MockReactQuill extends Component {
    constructor(props) {
      super(props);
      this.editor = {
        getSelection: vi.fn(() => ({ index: 1 })),
        getLength: vi.fn(() => 5),
        insertEmbed: vi.fn(),
        setSelection: vi.fn(),
      };
      MockReactQuill.lastInstance = this;
    }

    getEditor() {
      return this.editor;
    }

    render() {
      const { value, placeholder, modules } = this.props;
      const handlers = modules?.toolbar?.handlers || {};
      return (
        <div className="quill">
          <div className="ql-toolbar">
            <button className="ql-header" value="1" type="button"></button>
            <button className="ql-header" value="2" type="button"></button>
            <button className="ql-header" value="3" type="button"></button>
            <button className="ql-header" type="button"></button>
            <button className="ql-bold" type="button"></button>
            <button className="ql-italic" type="button"></button>
            <button className="ql-underline" type="button"></button>
            <button className="ql-strike" type="button"></button>
            <button className="ql-list" value="ordered" type="button"></button>
            <button className="ql-list" value="bullet" type="button"></button>
            <button className="ql-align" type="button"></button>
            <button className="ql-link" type="button"></button>
            <button className="ql-image" type="button" onClick={() => handlers.image?.()}></button>
            <button className="ql-video" type="button" onClick={() => handlers.video?.()}></button>
            <button className="ql-audio" type="button" onClick={() => handlers.audio?.()}></button>
            <button className="ql-media" type="button" onClick={() => handlers.media?.()}></button>
            <button className="ql-clean" type="button"></button>
            <button className="ql-color" type="button"></button>
            <button className="ql-background" type="button"></button>
          </div>
          <div className="ql-container">
            <div 
              className="ql-editor" 
              contentEditable="true" 
              data-placeholder={placeholder}
            >
              {value}
            </div>
          </div>
        </div>
      );
    }
  }
  MockReactQuill.lastInstance = null;

  return {
    default: MockReactQuill,
    Quill: mockQuill,
  };
});

// Mock uploadFileToR2
vi.mock('../utils/s3Client', () => ({
  uploadFileToR2: vi.fn(),
  R2_PUBLIC_URL: 'https://pub-r2.climamedix.org',
  R2_BUCKET_NAME: 'climamedix'
}));

import ReactQuill, { Quill } from 'react-quill';
import { uploadFileToR2 } from '../utils/s3Client';
import { RichTextEditor } from '../features/shared/components/RichTextEditor';

describe('Media Compression, Custom Blots & RichTextEditor Lifecycle', () => {
  let capturedInputs = [];
  const originalCreateElement = document.createElement.bind(document);
  const originalImage = window.Image;
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    vi.clearAllMocks();
    capturedInputs = [];
    ReactQuill.lastInstance = null;

    vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
      const el = originalCreateElement(tagName, options);
      if (tagName === 'input') {
        capturedInputs.push(el);
      }
      return el;
    });

    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = vi.fn();

    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      drawImage: vi.fn()
    }));
    HTMLCanvasElement.prototype.toBlob = vi.fn(function(callback, type, quality) {
      const blob = new Blob(['mock-bytes'], { type: 'image/webp' });
      callback(blob);
    });

    class MockImage {
      constructor() {
        this.width = 400;
        this.height = 300;
      }
      set src(val) {
        this._src = val;
        setTimeout(() => {
          if (MockImage.shouldFail) {
            if (this.onerror) this.onerror(new Error('Mock image loading failure'));
          } else {
            if (this.onload) this.onload();
          }
        }, 0);
      }
      get src() {
        return this._src;
      }
    }
    MockImage.shouldFail = false;
    window.Image = MockImage;

    uploadFileToR2.mockImplementation(async (file, folder, onProgress) => {
      if (onProgress) onProgress(50);
      return `https://pub-r2.climamedix.org/${folder}/${file.name || 'uploaded_media'}`;
    });
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    window.Image = originalImage;
    vi.restoreAllMocks();
  });

  // ─── 1. Custom Blot Nodes (VideoBlot & AudioBlot) ───────────────────────────
  describe('1. Custom Blot Nodes (VideoBlot & AudioBlot)', () => {
    it('VideoBlot creates a responsive video element with controls and styles and extracts value', () => {
      const VideoBlot = Quill.registeredBlots.video;
      expect(VideoBlot).toBeDefined();

      const videoNode = VideoBlot.create('https://pub-r2.climamedix.org/videos/lecture.mp4');
      expect(videoNode.getAttribute('src')).toBe('https://pub-r2.climamedix.org/videos/lecture.mp4');
      expect(videoNode.hasAttribute('controls')).toBe(true);
      expect(videoNode.style.width).toBe('100%');
      expect(videoNode.style.aspectRatio).toBe('16/9');
      expect(videoNode.style.borderRadius).toBe('8px');
      expect(videoNode.style.backgroundColor).toBe('rgb(0, 0, 0)');

      expect(VideoBlot.value(videoNode)).toBe('https://pub-r2.climamedix.org/videos/lecture.mp4');
    });

    it('AudioBlot creates a responsive audio element with controls and extracts value', () => {
      const AudioBlot = Quill.registeredBlots.audio;
      expect(AudioBlot).toBeDefined();

      const audioNode = AudioBlot.create('https://pub-r2.climamedix.org/course_audio/podcast.mp3');
      expect(audioNode.getAttribute('src')).toBe('https://pub-r2.climamedix.org/course_audio/podcast.mp3');
      expect(audioNode.hasAttribute('controls')).toBe(true);
      expect(audioNode.getAttribute('width')).toBe('100%');
      expect(audioNode.style.marginTop).toBe('10px');

      expect(AudioBlot.value(audioNode)).toBe('https://pub-r2.climamedix.org/course_audio/podcast.mp3');
    });
  });

  // ─── 2. RichTextEditor Toolbar & Tooltips ──────────────────────────────────
  describe('2. RichTextEditor Toolbar & Tooltips', () => {
    it('renders editor container and applies Arabic tooltips when isRtl is true', async () => {
      const { container } = render(
        <RichTextEditor value="<p>Test</p>" onChange={vi.fn()} isRtl={true} placeholder="اكتب هنا..." />
      );

      expect(container.querySelector('.custom-quill-wrapper')).toBeInTheDocument();
      expect(container.querySelector('.ql-editor').getAttribute('data-placeholder')).toBe('اكتب هنا...');

      await waitFor(() => {
        const bold = container.querySelector('.ql-bold');
        expect(bold?.getAttribute('title')).toBe('عريض (Bold)');
        const img = container.querySelector('.ql-image');
        expect(img?.getAttribute('title')).toBe('إدراج صورة');
      });
    });

    it('applies English tooltips when isRtl is false', async () => {
      const { container } = render(
        <RichTextEditor value="" onChange={vi.fn()} isRtl={false} placeholder="Write something..." />
      );

      await waitFor(() => {
        const bold = container.querySelector('.ql-bold');
        expect(bold?.getAttribute('title')).toBe('Bold');
        const img = container.querySelector('.ql-image');
        expect(img?.getAttribute('title')).toBe('Insert Image');
        const audio = container.querySelector('.ql-audio');
        expect(audio?.getAttribute('title')).toBe('Insert Audio');
      });
    });

    it('injects SVG icons into .ql-media and .ql-audio toolbar buttons', async () => {
      const { container } = render(
        <RichTextEditor value="" onChange={vi.fn()} />
      );

      await waitFor(() => {
        const mediaBtn = container.querySelector('.ql-media');
        const audioBtn = container.querySelector('.ql-audio');
        expect(mediaBtn?.innerHTML).toContain('svg');
        expect(audioBtn?.innerHTML).toContain('svg');
      });
    });

    it('clears tooltip timeout on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
      const { unmount } = render(<RichTextEditor value="" onChange={vi.fn()} />);
      unmount();
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  // ─── 3. Media Upload Handlers, Conversions & Insertion ─────────────────────
  describe('3. Media Upload Handlers, Conversions & Insertion', () => {
    it('handles image upload, converts PNG to WebP, updates progress, and inserts embed', async () => {
      const onUploadingMedia = vi.fn();
      const { container } = render(
        <RichTextEditor 
          value="" 
          onChange={vi.fn()} 
          onUploadingMedia={onUploadingMedia} 
          imageBucketFolder="articles"
          isRtl={false}
        />
      );

      const imageBtn = container.querySelector('.ql-image');
      fireEvent.click(imageBtn);

      expect(capturedInputs.length).toBeGreaterThan(0);
      const input = capturedInputs[capturedInputs.length - 1];
      expect(input.getAttribute('type')).toBe('file');
      expect(input.getAttribute('accept')).toBe('image/*');
      expect(input.getAttribute('multiple')).toBe('true');

      const pngFile = new File(['pngdata'], 'sample.png', { type: 'image/png' });
      Object.defineProperty(input, 'files', { value: [pngFile], writable: true });

      await input.onchange();

      expect(onUploadingMedia).toHaveBeenCalledWith(true);
      expect(uploadFileToR2).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'image/webp' }),
        'articles',
        expect.any(Function)
      );

      const quillEditor = ReactQuill.lastInstance.getEditor();
      expect(quillEditor.insertEmbed).toHaveBeenCalledWith(
        1,
        'image',
        expect.stringContaining('https://pub-r2.climamedix.org/articles/sample.webp')
      );
      expect(quillEditor.setSelection).toHaveBeenCalledWith(2);
      expect(onUploadingMedia).toHaveBeenCalledWith(false);
    });

    it('bypasses canvas conversion when image is already image/webp', async () => {
      const { container } = render(
        <RichTextEditor value="" onChange={vi.fn()} isRtl={false} />
      );

      fireEvent.click(container.querySelector('.ql-image'));
      const input = capturedInputs[capturedInputs.length - 1];

      const webpFile = new File(['webpdata'], 'chart.webp', { type: 'image/webp' });
      Object.defineProperty(input, 'files', { value: [webpFile], writable: true });

      await input.onchange();

      expect(uploadFileToR2).toHaveBeenCalledWith(
        webpFile,
        'editor_images',
        expect.any(Function)
      );
      expect(ReactQuill.lastInstance.getEditor().insertEmbed).toHaveBeenCalledWith(
        1,
        'image',
        expect.stringContaining('chart.webp')
      );
    });

    it('falls back to quill.getLength() when selection range is null', async () => {
      const { container } = render(
        <RichTextEditor value="" onChange={vi.fn()} />
      );

      const quillEditor = ReactQuill.lastInstance.getEditor();
      quillEditor.getSelection.mockReturnValueOnce(null);
      quillEditor.getLength.mockReturnValueOnce(9);

      fireEvent.click(container.querySelector('.ql-image'));
      const input = capturedInputs[capturedInputs.length - 1];

      const webpFile = new File(['webpdata'], 'banner.webp', { type: 'image/webp' });
      Object.defineProperty(input, 'files', { value: [webpFile], writable: true });

      await input.onchange();

      expect(quillEditor.insertEmbed).toHaveBeenCalledWith(9, 'image', expect.any(String));
      expect(quillEditor.setSelection).toHaveBeenCalledWith(10);
    });

    it('alerts with Arabic message and stops upload when image conversion or upload fails in RTL', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      window.Image.shouldFail = true;

      const { container } = render(
        <RichTextEditor value="" onChange={vi.fn()} isRtl={true} />
      );

      fireEvent.click(container.querySelector('.ql-image'));
      const input = capturedInputs[capturedInputs.length - 1];

      const badFile = new File(['bad'], 'broken.jpg', { type: 'image/jpeg' });
      Object.defineProperty(input, 'files', { value: [badFile], writable: true });

      await input.onchange();

      expect(alertSpy).toHaveBeenCalledWith('فشل رفع الصورة.');
      alertSpy.mockRestore();
    });

    it('alerts with English message when image upload rejects in LTR', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      uploadFileToR2.mockRejectedValueOnce(new Error('S3 down'));

      const { container } = render(
        <RichTextEditor value="" onChange={vi.fn()} isRtl={false} />
      );

      fireEvent.click(container.querySelector('.ql-image'));
      const input = capturedInputs[capturedInputs.length - 1];

      const webpFile = new File(['data'], 'photo.webp', { type: 'image/webp' });
      Object.defineProperty(input, 'files', { value: [webpFile], writable: true });

      await input.onchange();

      expect(alertSpy).toHaveBeenCalledWith('Failed to upload image.');
      alertSpy.mockRestore();
    });

    it('handles video upload with progress callback and inserts video embed', async () => {
      const onUploadingMedia = vi.fn();
      const { container } = render(
        <RichTextEditor value="" onChange={vi.fn()} onUploadingMedia={onUploadingMedia} isRtl={false} />
      );

      fireEvent.click(container.querySelector('.ql-video'));
      const input = capturedInputs[capturedInputs.length - 1];
      expect(input.getAttribute('accept')).toBe('video/*');

      const videoFile = new File(['videodata'], 'seminar.mp4', { type: 'video/mp4' });
      Object.defineProperty(input, 'files', { value: [videoFile], writable: true });

      await input.onchange();

      expect(uploadFileToR2).toHaveBeenCalledWith(videoFile, 'videos', expect.any(Function));
      expect(ReactQuill.lastInstance.getEditor().insertEmbed).toHaveBeenCalledWith(
        1,
        'video',
        expect.stringContaining('seminar.mp4')
      );
      expect(onUploadingMedia).toHaveBeenCalledWith(true);
      expect(onUploadingMedia).toHaveBeenCalledWith(false);
    });

    it('alerts when video upload fails in RTL and LTR', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      uploadFileToR2.mockRejectedValue(new Error('Video fail'));

      const rtlRender = render(
        <RichTextEditor value="" onChange={vi.fn()} isRtl={true} />
      );

      fireEvent.click(rtlRender.container.querySelector('.ql-video'));
      let input = capturedInputs[capturedInputs.length - 1];
      Object.defineProperty(input, 'files', { value: [new File(['v'], 'v.mp4', { type: 'video/mp4' })], writable: true });
      await input.onchange();
      expect(alertSpy).toHaveBeenCalledWith('فشل رفع الفيديو.');
      rtlRender.unmount();

      const ltrRender = render(
        <RichTextEditor value="" onChange={vi.fn()} isRtl={false} />
      );
      fireEvent.click(ltrRender.container.querySelector('.ql-video'));
      input = capturedInputs[capturedInputs.length - 1];
      Object.defineProperty(input, 'files', { value: [new File(['v'], 'v.mp4', { type: 'video/mp4' })], writable: true });
      await input.onchange();
      expect(alertSpy).toHaveBeenCalledWith('Failed to upload video.');
      ltrRender.unmount();

      alertSpy.mockRestore();
    });

    it('handles audio upload and inserts audio embed in course_audio folder', async () => {
      const { container } = render(
        <RichTextEditor value="" onChange={vi.fn()} isRtl={false} />
      );

      fireEvent.click(container.querySelector('.ql-audio'));
      const input = capturedInputs[capturedInputs.length - 1];
      expect(input.getAttribute('accept')).toBe('audio/*');

      const audioFile = new File(['audiodata'], 'speech.mp3', { type: 'audio/mp3' });
      Object.defineProperty(input, 'files', { value: [audioFile], writable: true });

      await input.onchange();

      expect(uploadFileToR2).toHaveBeenCalledWith(audioFile, 'course_audio', expect.any(Function));
      expect(ReactQuill.lastInstance.getEditor().insertEmbed).toHaveBeenCalledWith(
        1,
        'audio',
        expect.stringContaining('speech.mp3')
      );
    });

    it('alerts when audio upload fails in RTL and LTR', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      uploadFileToR2.mockRejectedValue(new Error('Audio fail'));

      const rtlRender = render(
        <RichTextEditor value="" onChange={vi.fn()} isRtl={true} />
      );

      fireEvent.click(rtlRender.container.querySelector('.ql-audio'));
      let input = capturedInputs[capturedInputs.length - 1];
      Object.defineProperty(input, 'files', { value: [new File(['a'], 'a.mp3', { type: 'audio/mp3' })], writable: true });
      await input.onchange();
      expect(alertSpy).toHaveBeenCalledWith('فشل رفع الملف الصوتي.');
      rtlRender.unmount();

      const ltrRender = render(
        <RichTextEditor value="" onChange={vi.fn()} isRtl={false} />
      );
      fireEvent.click(ltrRender.container.querySelector('.ql-audio'));
      input = capturedInputs[capturedInputs.length - 1];
      Object.defineProperty(input, 'files', { value: [new File(['a'], 'a.mp3', { type: 'audio/mp3' })], writable: true });
      await input.onchange();
      expect(alertSpy).toHaveBeenCalledWith('Failed to upload audio.');
      ltrRender.unmount();

      alertSpy.mockRestore();
    });

    it('mediaHandler delegates to image or video upload based on MIME type', async () => {
      const { container } = render(
        <RichTextEditor value="" onChange={vi.fn()} isRtl={false} />
      );

      fireEvent.click(container.querySelector('.ql-media'));
      const input = capturedInputs[capturedInputs.length - 1];
      expect(input.getAttribute('accept')).toBe('image/*,video/*');

      // 1. Image
      const imgFile = new File(['img'], 'photo.webp', { type: 'image/webp' });
      Object.defineProperty(input, 'files', { value: [imgFile], writable: true });
      await input.onchange();
      expect(uploadFileToR2).toHaveBeenCalledWith(imgFile, 'editor_images', expect.any(Function));

      // 2. Video
      const vidFile = new File(['vid'], 'clip.mp4', { type: 'video/mp4' });
      Object.defineProperty(input, 'files', { value: [vidFile], writable: true });
      await input.onchange();
      expect(uploadFileToR2).toHaveBeenCalledWith(vidFile, 'videos', expect.any(Function));
    });

    it('mediaHandler alerts on video failure in RTL and LTR', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      uploadFileToR2.mockRejectedValue(new Error('Media video fail'));

      const rtlRender = render(
        <RichTextEditor value="" onChange={vi.fn()} isRtl={true} />
      );

      fireEvent.click(rtlRender.container.querySelector('.ql-media'));
      let input = capturedInputs[capturedInputs.length - 1];
      Object.defineProperty(input, 'files', { value: [new File(['vid'], 'clip.mp4', { type: 'video/mp4' })], writable: true });
      await input.onchange();
      expect(alertSpy).toHaveBeenCalledWith('فشل رفع الفيديو.');
      rtlRender.unmount();

      const ltrRender = render(
        <RichTextEditor value="" onChange={vi.fn()} isRtl={false} />
      );
      fireEvent.click(ltrRender.container.querySelector('.ql-media'));
      input = capturedInputs[capturedInputs.length - 1];
      Object.defineProperty(input, 'files', { value: [new File(['vid'], 'clip.mp4', { type: 'video/mp4' })], writable: true });
      await input.onchange();
      expect(alertSpy).toHaveBeenCalledWith('Failed to upload video.');
      ltrRender.unmount();

      alertSpy.mockRestore();
    });

    it('uploads multiple image files in succession and updates editor', async () => {
      const { container } = render(
        <RichTextEditor value="" onChange={vi.fn()} isRtl={false} />
      );

      fireEvent.click(container.querySelector('.ql-image'));
      const input = capturedInputs[capturedInputs.length - 1];

      const img1 = new File(['img1'], 'pic1.webp', { type: 'image/webp' });
      const img2 = new File(['img2'], 'pic2.webp', { type: 'image/webp' });
      Object.defineProperty(input, 'files', { value: [img1, img2], writable: true });

      await input.onchange();

      expect(uploadFileToR2).toHaveBeenCalledTimes(2);
      expect(ReactQuill.lastInstance.getEditor().insertEmbed).toHaveBeenCalledTimes(2);
    });

    it('uploads multiple video files in succession', async () => {
      const { container } = render(
        <RichTextEditor value="" onChange={vi.fn()} isRtl={false} />
      );

      fireEvent.click(container.querySelector('.ql-video'));
      const input = capturedInputs[capturedInputs.length - 1];

      const vid1 = new File(['v1'], 'video1.mp4', { type: 'video/mp4' });
      const vid2 = new File(['v2'], 'video2.mp4', { type: 'video/mp4' });
      Object.defineProperty(input, 'files', { value: [vid1, vid2], writable: true });

      await input.onchange();

      expect(uploadFileToR2).toHaveBeenCalledTimes(2);
      expect(ReactQuill.lastInstance.getEditor().insertEmbed).toHaveBeenCalledTimes(2);
    });

    it('renders progress bar and status text during upload and compression', async () => {
      let resolveUpload;
      uploadFileToR2.mockImplementation((file, folder, onProgress) => {
        onProgress(65);
        return new Promise((resolve) => {
          resolveUpload = () => resolve('https://pub-r2.climamedix.org/editor_images/done.webp');
        });
      });

      const { container } = render(
        <RichTextEditor value="" onChange={vi.fn()} isRtl={false} />
      );

      fireEvent.click(container.querySelector('.ql-image'));
      const input = capturedInputs[capturedInputs.length - 1];
      const webpFile = new File(['data'], 'test.webp', { type: 'image/webp' });
      Object.defineProperty(input, 'files', { value: [webpFile], writable: true });

      // Start onchange without awaiting immediately
      const changePromise = input.onchange();

      await waitFor(() => {
        expect(container.textContent).toContain('Uploading Media... 65%');
      });

      // Finish upload
      resolveUpload();
      await changePromise;

      await waitFor(() => {
        expect(container.textContent).not.toContain('Uploading Media...');
      });
    });

    it('renders Arabic progress bar and status text during upload', async () => {
      let resolveUpload;
      uploadFileToR2.mockImplementation((file, folder, onProgress) => {
        onProgress(80);
        return new Promise((resolve) => {
          resolveUpload = () => resolve('https://pub-r2.climamedix.org/editor_images/done.webp');
        });
      });

      const { container } = render(
        <RichTextEditor value="" onChange={vi.fn()} isRtl={true} />
      );

      fireEvent.click(container.querySelector('.ql-image'));
      const input = capturedInputs[capturedInputs.length - 1];
      const webpFile = new File(['data'], 'test.webp', { type: 'image/webp' });
      Object.defineProperty(input, 'files', { value: [webpFile], writable: true });

      const changePromise = input.onchange();

      await waitFor(() => {
        expect(container.textContent).toContain('جاري رفع الملف... 80%');
      });

      resolveUpload();
      await changePromise;
    });

    it('ignores empty file selections without triggering upload state', async () => {
      const onUploadingMedia = vi.fn();
      const { container } = render(
        <RichTextEditor value="" onChange={vi.fn()} onUploadingMedia={onUploadingMedia} />
      );

      fireEvent.click(container.querySelector('.ql-image'));
      const input = capturedInputs[capturedInputs.length - 1];
      Object.defineProperty(input, 'files', { value: [], writable: true });

      await input.onchange();
      expect(onUploadingMedia).not.toHaveBeenCalled();
      expect(uploadFileToR2).not.toHaveBeenCalled();
    });

    it('uploads multiple audio files in succession to course_audio folder', async () => {
      const { container } = render(
        <RichTextEditor value="" onChange={vi.fn()} isRtl={false} />
      );

      fireEvent.click(container.querySelector('.ql-audio'));
      const input = capturedInputs[capturedInputs.length - 1];

      const audio1 = new File(['a1'], 'podcast1.mp3', { type: 'audio/mp3' });
      const audio2 = new File(['a2'], 'podcast2.mp3', { type: 'audio/mp3' });
      Object.defineProperty(input, 'files', { value: [audio1, audio2], writable: true });

      await input.onchange();

      expect(uploadFileToR2).toHaveBeenCalledTimes(2);
      expect(uploadFileToR2).toHaveBeenNthCalledWith(1, audio1, 'course_audio', expect.any(Function));
      expect(uploadFileToR2).toHaveBeenNthCalledWith(2, audio2, 'course_audio', expect.any(Function));
      expect(ReactQuill.lastInstance.getEditor().insertEmbed).toHaveBeenCalledTimes(2);
    });

    it('respects custom imageBucketFolder prop when uploading via image button', async () => {
      const { container } = render(
        <RichTextEditor value="" onChange={vi.fn()} isRtl={false} imageBucketFolder="news_media" />
      );

      fireEvent.click(container.querySelector('.ql-image'));
      const input = capturedInputs[capturedInputs.length - 1];

      const customImg = new File(['img-content'], 'headline.webp', { type: 'image/webp' });
      Object.defineProperty(input, 'files', { value: [customImg], writable: true });

      await input.onchange();

      expect(uploadFileToR2).toHaveBeenCalledWith(customImg, 'news_media', expect.any(Function));
    });

    it('renders "Compressing Image..." during canvas WebP processing in English mode', async () => {
      let resolveUpload;
      const uploadPromise = new Promise((resolve) => {
        resolveUpload = () => resolve('https://pub-r2.climamedix.org/articles/pic.webp');
      });
      uploadFileToR2.mockReturnValue(uploadPromise);

      const { container } = render(
        <RichTextEditor value="" onChange={vi.fn()} isRtl={false} />
      );

      fireEvent.click(container.querySelector('.ql-image'));
      const input = capturedInputs[capturedInputs.length - 1];
      const rawImg = new File(['raw-bytes'], 'raw.png', { type: 'image/png' });
      Object.defineProperty(input, 'files', { value: [rawImg], writable: true });

      const changePromise = input.onchange();

      // Verify compressing indicator displays
      await waitFor(() => {
        expect(container.textContent).toMatch(/Compressing Image\.\.\.|Uploading Media\.\.\./);
      });

      resolveUpload();
      await changePromise;
    });
  });
});
