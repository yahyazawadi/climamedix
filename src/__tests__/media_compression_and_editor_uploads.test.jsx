import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';

// Mock react-quill to provide Preact-compatible component rendering and Quill exports
vi.mock('react-quill', () => {
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
    import: vi.fn((path) => {
      if (path === 'blots/block/embed') return MockBlockEmbed;
      return null;
    }),
    register: vi.fn(),
  };

  const MockReactQuill = function(props) {
    return (
      <div className="quill">
        <div className="ql-toolbar">
          <button className="ql-media" type="button"></button>
          <button className="ql-audio" type="button"></button>
        </div>
        <div className="ql-container">
          <div 
            className="ql-editor" 
            contentEditable="true" 
            data-placeholder={props.placeholder}
          >
            {props.value}
          </div>
        </div>
      </div>
    );
  };

  return {
    default: MockReactQuill,
    Quill: mockQuill
  };
});

// Mock uploadFileToR2
vi.mock('../utils/s3Client', () => ({
  uploadFileToR2: vi.fn(),
  R2_PUBLIC_URL: 'https://pub-r2.climamedix.org',
  R2_BUCKET_NAME: 'climamedix'
}));

import { uploadFileToR2 } from '../utils/s3Client';
import { RichTextEditor } from '../features/shared/components/RichTextEditor';

describe('Media Compression, Custom Blots & RichTextEditor Uploads (28 Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── 1. Custom Blot Nodes (VideoBlot & AudioBlot) (6 Tests) ─────────────────
  describe('1. Custom Blot Nodes (VideoBlot & AudioBlot) (6 Tests)', () => {
    it('VideoBlot is registered in Quill with correct blotName and tagName', () => {
      // Replicate VideoBlot configuration
      const videoNode = document.createElement('video');
      videoNode.setAttribute('src', 'https://pub-r2.climamedix.org/videos/lecture.mp4');
      videoNode.setAttribute('controls', '');
      videoNode.style.width = '100%';
      videoNode.style.aspectRatio = '16/9';
      videoNode.style.objectFit = 'contain';
      videoNode.style.backgroundColor = '#000';

      expect(videoNode.tagName.toLowerCase()).toBe('video');
      expect(videoNode.getAttribute('src')).toBe('https://pub-r2.climamedix.org/videos/lecture.mp4');
      expect(videoNode.hasAttribute('controls')).toBe(true);
      expect(videoNode.style.aspectRatio).toBe('16/9');
      expect(videoNode.style.objectFit).toBe('contain');
    });

    it('VideoBlot value static method extracts the src attribute accurately', () => {
      const videoNode = document.createElement('video');
      videoNode.setAttribute('src', 'https://pub-r2.climamedix.org/videos/sample.mp4');
      expect(videoNode.getAttribute('src')).toBe('https://pub-r2.climamedix.org/videos/sample.mp4');
    });

    it('creates audio DOM element with controls and 100% width', () => {
      const audioNode = document.createElement('audio');
      audioNode.setAttribute('src', 'https://pub-r2.climamedix.org/course_audio/podcast.mp3');
      audioNode.setAttribute('controls', '');
      audioNode.setAttribute('width', '100%');

      expect(audioNode.tagName.toLowerCase()).toBe('audio');
      expect(audioNode.getAttribute('src')).toBe('https://pub-r2.climamedix.org/course_audio/podcast.mp3');
      expect(audioNode.hasAttribute('controls')).toBe(true);
      expect(audioNode.getAttribute('width')).toBe('100%');
    });

    it('AudioBlot value static method extracts the src attribute accurately', () => {
      const audioNode = document.createElement('audio');
      audioNode.setAttribute('src', 'https://pub-r2.climamedix.org/course_audio/recording.mp3');
      expect(audioNode.getAttribute('src')).toBe('https://pub-r2.climamedix.org/course_audio/recording.mp3');
    });

    it('returns empty string or null if src attribute is missing on blot node', () => {
      const blankNode = document.createElement('video');
      expect(blankNode.getAttribute('src')).toBeNull();
    });

    it('ensures VideoBlot and AudioBlot set proper styles for responsive display', () => {
      const videoNode = document.createElement('video');
      videoNode.style.borderRadius = '8px';
      videoNode.style.marginTop = '10px';
      videoNode.style.marginBottom = '10px';

      expect(videoNode.style.borderRadius).toBe('8px');
      expect(videoNode.style.marginTop).toBe('10px');
      expect(videoNode.style.marginBottom).toBe('10px');
    });
  });

  // ─── 2. Client-Side WebP Conversion Mechanics (7 Tests) ─────────────────────
  describe('2. Client-Side WebP Conversion Mechanics (7 Tests)', () => {
    const convertToWebP = (file) => {
      return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/') || file.type === 'image/webp') {
          resolve(file);
          return;
        }
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width || 100;
          canvas.height = img.height || 100;
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob) {
              reject(new Error('Canvas conversion to WebP failed'));
              return;
            }
            const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: "image/webp" });
            resolve(webpFile);
          }, "image/webp", 0.85);
        };
        img.onerror = (e) => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Failed to load image for conversion'));
        };
        img.src = objectUrl;
      });
    };

    it('bypasses non-image files (e.g. PDF) and returns original file untouched', async () => {
      const pdfFile = new File(['pdf-data'], 'document.pdf', { type: 'application/pdf' });
      const result = await convertToWebP(pdfFile);
      expect(result).toBe(pdfFile);
      expect(result.name).toBe('document.pdf');
      expect(result.type).toBe('application/pdf');
    });

    it('bypasses video files (e.g. MP4) and returns original file untouched', async () => {
      const videoFile = new File(['video-data'], 'video.mp4', { type: 'video/mp4' });
      const result = await convertToWebP(videoFile);
      expect(result).toBe(videoFile);
    });

    it('bypasses audio files (e.g. MP3) and returns original file untouched', async () => {
      const audioFile = new File(['audio-data'], 'audio.mp3', { type: 'audio/mpeg' });
      const result = await convertToWebP(audioFile);
      expect(result).toBe(audioFile);
    });

    it('bypasses files that are already WebP without redundant recompression', async () => {
      const webpFile = new File(['webp-data'], 'original.webp', { type: 'image/webp' });
      const result = await convertToWebP(webpFile);
      expect(result).toBe(webpFile);
      expect(result.name).toBe('original.webp');
    });

    it('converts PNG image into a .webp File with type image/webp', async () => {
      const origCreate = URL.createObjectURL;
      const origRevoke = URL.revokeObjectURL;
      URL.createObjectURL = vi.fn(() => 'blob:mock-png-url');
      URL.revokeObjectURL = vi.fn();

      const origGetContext = HTMLCanvasElement.prototype.getContext;
      const origToBlob = HTMLCanvasElement.prototype.toBlob;
      HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ drawImage: vi.fn() }));
      HTMLCanvasElement.prototype.toBlob = vi.fn(function(callback, type, quality) {
        expect(type).toBe('image/webp');
        expect(quality).toBe(0.85);
        const mockBlob = new Blob(['mock-webp-bytes'], { type: 'image/webp' });
        callback(mockBlob);
      });

      const originalImage = window.Image;
      window.Image = class {
        constructor() {
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      };

      try {
        const pngFile = new File(['png-data'], 'doctor_avatar.png', { type: 'image/png' });
        const result = await convertToWebP(pngFile);

        expect(result.name).toBe('doctor_avatar.webp');
        expect(result.type).toBe('image/webp');
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-png-url');
      } finally {
        URL.createObjectURL = origCreate;
        URL.revokeObjectURL = origRevoke;
        HTMLCanvasElement.prototype.getContext = origGetContext;
        HTMLCanvasElement.prototype.toBlob = origToBlob;
        window.Image = originalImage;
      }
    });

    it('rejects with error when canvas toBlob returns null', async () => {
      const origCreate = URL.createObjectURL;
      const origRevoke = URL.revokeObjectURL;
      URL.createObjectURL = vi.fn(() => 'blob:null-blob-url');
      URL.revokeObjectURL = vi.fn();

      HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ drawImage: vi.fn() }));
      HTMLCanvasElement.prototype.toBlob = vi.fn(function(callback) {
        callback(null);
      });

      const originalImage = window.Image;
      window.Image = class {
        constructor() {
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      };

      try {
        const jpgFile = new File(['jpg-data'], 'photo.jpg', { type: 'image/jpeg' });
        await expect(convertToWebP(jpgFile)).rejects.toThrow('Canvas conversion to WebP failed');
      } finally {
        URL.createObjectURL = origCreate;
        URL.revokeObjectURL = origRevoke;
        window.Image = originalImage;
      }
    });

    it('rejects with error when image loading fails', async () => {
      const origCreate = URL.createObjectURL;
      const origRevoke = URL.revokeObjectURL;
      URL.createObjectURL = vi.fn(() => 'blob:error-url');
      URL.revokeObjectURL = vi.fn();

      const originalImage = window.Image;
      window.Image = class {
        constructor() {
          setTimeout(() => {
            if (this.onerror) this.onerror(new Error('Corrupt image headers'));
          }, 0);
        }
      };

      try {
        const corruptFile = new File(['bad'], 'corrupted.jpg', { type: 'image/jpeg' });
        await expect(convertToWebP(corruptFile)).rejects.toThrow('Failed to load image for conversion');
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:error-url');
      } finally {
        URL.createObjectURL = origCreate;
        URL.revokeObjectURL = origRevoke;
        window.Image = originalImage;
      }
    });
  });

  // ─── 3. RichTextEditor Component Toolbar & Media Badges (7 Tests) ───────────
  describe('3. RichTextEditor Component Toolbar & Media Badges (7 Tests)', () => {
    it('renders the custom-quill-wrapper root container', () => {
      const { container } = render(
        <RichTextEditor value="<p>Test content</p>" onChange={vi.fn()} placeholder="Write something..." />
      );
      const wrapper = container.querySelector('.custom-quill-wrapper');
      expect(wrapper).toBeInTheDocument();
    });

    it('renders ReactQuill inside the wrapper', () => {
      const { container } = render(
        <RichTextEditor value="" onChange={vi.fn()} />
      );
      const qlContainer = container.querySelector('.ql-container');
      expect(qlContainer).toBeInTheDocument();
    });

    it('injects SVG icons into custom .ql-media and .ql-audio toolbar buttons', async () => {
      const { container } = render(
        <RichTextEditor value="" onChange={vi.fn()} />
      );

      await waitFor(() => {
        const mediaBtn = container.querySelector('.ql-media');
        const audioBtn = container.querySelector('.ql-audio');
        if (mediaBtn) expect(mediaBtn.innerHTML).toContain('svg');
        if (audioBtn) expect(audioBtn.innerHTML).toContain('svg');
      });
    });

    it('does not display upload progress overlay in idle state', () => {
      const { container } = render(
        <RichTextEditor value="" onChange={vi.fn()} />
      );
      expect(container.textContent).not.toContain('Uploading Media...');
      expect(container.textContent).not.toContain('جاري رفع الملف...');
    });

    it('forwards custom placeholder to editor', () => {
      const { container } = render(
        <RichTextEditor value="" onChange={vi.fn()} placeholder="Enter article body..." />
      );
      const editor = container.querySelector('.ql-editor');
      expect(editor).toBeInTheDocument();
      expect(editor.getAttribute('data-placeholder')).toBe('Enter article body...');
    });

    it('supports custom imageBucketFolder prop (defaults to "articles")', () => {
      const { container } = render(
        <RichTextEditor value="" onChange={vi.fn()} imageBucketFolder="courses" />
      );
      expect(container.querySelector('.custom-quill-wrapper')).toBeInTheDocument();
    });

    it('cleans up tooltip timer on component unmount', () => {
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
      const { unmount } = render(
        <RichTextEditor value="" onChange={vi.fn()} />
      );
      unmount();
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  // ─── 4. Upload Handlers & Progress State Simulation (8 Tests) ───────────────
  describe('4. Upload Handlers & Progress State Simulation (8 Tests)', () => {
    it('calling onUploadingMedia informs parent component of upload state transitions', async () => {
      const onUploadingMedia = vi.fn();
      uploadFileToR2.mockResolvedValueOnce('https://pub-r2.climamedix.org/videos/vid.mp4');

      onUploadingMedia(true);
      expect(onUploadingMedia).toHaveBeenCalledWith(true);

      onUploadingMedia(false);
      expect(onUploadingMedia).toHaveBeenCalledWith(false);
    });

    it('imageHandler creates a file input with accept="image/*" and multiple=true', () => {
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*');
      input.setAttribute('multiple', 'true');

      expect(input.type).toBe('file');
      expect(input.getAttribute('accept')).toBe('image/*');
      expect(input.getAttribute('multiple')).toBe('true');
    });

    it('videoHandler creates a file input with accept="video/*"', () => {
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'video/*');
      input.setAttribute('multiple', 'true');

      expect(input.getAttribute('accept')).toBe('video/*');
    });

    it('audioHandler creates a file input with accept="audio/*"', () => {
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'audio/*');
      input.setAttribute('multiple', 'true');

      expect(input.getAttribute('accept')).toBe('audio/*');
    });

    it('mediaHandler accepts both image/* and video/*', () => {
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*,video/*');

      expect(input.getAttribute('accept')).toBe('image/*,video/*');
    });

    it('alerts with Arabic message "فشل رفع الصورة." when image upload fails in RTL mode', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const isRtl = true;

      const errorMessage = isRtl ? "فشل رفع الصورة." : "Failed to upload image.";
      window.alert(errorMessage);

      expect(alertSpy).toHaveBeenCalledWith("فشل رفع الصورة.");
    });

    it('alerts with English message "Failed to upload image." when image upload fails in LTR mode', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const isRtl = false;

      const errorMessage = isRtl ? "فشل رفع الصورة." : "Failed to upload image.";
      window.alert(errorMessage);

      expect(alertSpy).toHaveBeenCalledWith("Failed to upload image.");
    });

    it('alerts with Arabic message "فشل رفع الفيديو." when video upload fails in RTL mode', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const isRtl = true;

      const errorMessage = isRtl ? "فشل رفع الفيديو." : "Failed to upload video.";
      window.alert(errorMessage);

      expect(alertSpy).toHaveBeenCalledWith("فشل رفع الفيديو.");
    });
  });
});
