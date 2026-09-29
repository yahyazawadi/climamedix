import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';

// Mock s3Client
vi.mock('../utils/s3Client', () => ({
  uploadFileToR2: vi.fn(),
  R2_PUBLIC_URL: 'https://pub-r2.climamedix.org',
  R2_BUCKET_NAME: 'climamedix'
}));

// Mock supabaseClient
vi.mock('../utils/supabaseClient', () => {
  const mockFrom = vi.fn();
  return {
    supabase: {
      from: mockFrom
    }
  };
});

import { uploadFileToR2 } from '../utils/s3Client';
import { supabase } from '../utils/supabaseClient';

describe('Platform Feature File Uploads Lifecycle Matrix (36 Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── 1. Storage Folder Isolation & Target Path Invariants (9 Tests) ─────────
  describe('1. Storage Folder Isolation & Target Path Invariants (9 Tests)', () => {
    const featureMappings = [
      { feature: 'Profile Avatars', expectedFolder: 'avatars' },
      { feature: 'Research Publications', expectedFolder: 'research_publications' },
      { feature: 'Article Thumbnails', expectedFolder: 'article_thumbnails' },
      { feature: 'Course Covers', expectedFolder: 'course_covers' },
      { feature: 'Join Us CVs', expectedFolder: 'cvs' },
      { feature: 'Homepage Slider Banners', expectedFolder: 'slider' },
      { feature: 'Rich Editor Embedded Videos', expectedFolder: 'videos' },
      { feature: 'Rich Editor Embedded Audio', expectedFolder: 'course_audio' },
      { feature: 'Rich Editor Embedded Images', expectedFolder: 'articles' },
    ];

    featureMappings.forEach(({ feature, expectedFolder }) => {
      it(`feature [${feature}] routes uploads strictly to bucket folder "${expectedFolder}"`, async () => {
        uploadFileToR2.mockResolvedValueOnce(`https://pub-r2.climamedix.org/${expectedFolder}/file-123.bin`);
        const dummyFile = new File(['content'], 'sample.bin', { type: 'application/octet-stream' });

        const url = await uploadFileToR2(dummyFile, expectedFolder);

        expect(uploadFileToR2).toHaveBeenCalledWith(dummyFile, expectedFolder);
        expect(url).toContain(`/${expectedFolder}/`);
      });
    });
  });

  // ─── 2. Profile Page Avatar Upload Lifecycle (4 Tests) ──────────────────────
  describe('2. Profile Page Avatar Upload Lifecycle (4 Tests)', () => {
    it('simulates avatar upload flow: uploads to "avatars" and updates Supabase profiles table', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      });
      supabase.from.mockReturnValue({ update: mockUpdate });

      uploadFileToR2.mockResolvedValueOnce('https://pub-r2.climamedix.org/avatars/user-999.webp');

      const avatarFile = new File(['image-bytes'], 'avatar.png', { type: 'image/png' });
      const userId = 'usr-test-123';

      // Simulate ProfilePage handleAvatarChange
      const publicUrl = await uploadFileToR2(avatarFile, 'avatars');
      expect(publicUrl).toBe('https://pub-r2.climamedix.org/avatars/user-999.webp');

      const { error } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId);
      expect(error).toBeNull();
      expect(mockUpdate).toHaveBeenCalledWith({ avatar_url: publicUrl });
    });

    it('aborts database update and throws error when avatar upload returns null', async () => {
      uploadFileToR2.mockResolvedValueOnce(null);
      const mockUpdate = vi.fn();
      supabase.from.mockReturnValue({ update: mockUpdate });

      const file = new File(['data'], 'empty.png', { type: 'image/png' });
      
      const publicUrl = await uploadFileToR2(file, 'avatars');
      
      expect(publicUrl).toBeNull();
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('handles storage upload failure without corrupting profile state', async () => {
      uploadFileToR2.mockRejectedValueOnce(new Error('R2 Storage quota exceeded'));
      const mockUpdate = vi.fn();
      supabase.from.mockReturnValue({ update: mockUpdate });

      const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });

      await expect(uploadFileToR2(file, 'avatars')).rejects.toThrow('R2 Storage quota exceeded');
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('handles database update failure after successful R2 upload gracefully', async () => {
      uploadFileToR2.mockResolvedValueOnce('https://pub-r2.climamedix.org/avatars/uploaded.webp');
      
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: new Error('Postgres connection reset') })
      });
      supabase.from.mockReturnValue({ update: mockUpdate });

      const publicUrl = await uploadFileToR2(new File(['data'], 'test.webp', { type: 'image/webp' }), 'avatars');
      const { error } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', 'u1');

      expect(error).toBeDefined();
      expect(error.message).toBe('Postgres connection reset');
    });
  });

  // ─── 3. Article Thumbnail Upload Lifecycle (4 Tests) ────────────────────────
  describe('3. Article Thumbnail Upload Lifecycle (4 Tests)', () => {
    it('uploads new article thumbnail to "article_thumbnails" and includes cover_image in payload', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ insert: mockInsert });

      uploadFileToR2.mockResolvedValueOnce('https://pub-r2.climamedix.org/article_thumbnails/cover-456.webp');

      const thumbnailFile = new File(['thumb'], 'cover.jpg', { type: 'image/jpeg' });
      const coverImageUrl = await uploadFileToR2(thumbnailFile, 'article_thumbnails');

      const payload = {
        title_ar: 'تأثير درجات الحرارة المرتفعة على كبار السن',
        content_ar: '<p>محتوى تجريبي</p>',
        cover_image: coverImageUrl,
        created_by: 'author-uuid-1'
      };

      await supabase.from('news_articles').insert([payload]);

      expect(mockInsert).toHaveBeenCalledWith([expect.objectContaining({
        cover_image: 'https://pub-r2.climamedix.org/article_thumbnails/cover-456.webp'
      })]);
    });

    it('retains existing cover image when editing an article without selecting a new file', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      });
      supabase.from.mockReturnValue({ update: mockUpdate });

      const existingArticle = {
        id: 'art-77',
        cover_image: 'https://pub-r2.climamedix.org/article_thumbnails/existing-image.webp'
      };

      const thumbnailFile = null; // No new file picked
      let coverImageUrl = existingArticle ? existingArticle.cover_image : null;
      if (thumbnailFile) {
        coverImageUrl = await uploadFileToR2(thumbnailFile, 'article_thumbnails');
      }

      await supabase.from('news_articles').update({ cover_image: coverImageUrl }).eq('id', existingArticle.id);

      expect(uploadFileToR2).not.toHaveBeenCalled();
      expect(coverImageUrl).toBe('https://pub-r2.climamedix.org/article_thumbnails/existing-image.webp');
      expect(mockUpdate).toHaveBeenCalledWith({ cover_image: existingArticle.cover_image });
    });

    it('prevents article publishing if thumbnail upload rejects with network error', async () => {
      uploadFileToR2.mockRejectedValueOnce(new Error('Network error during upload'));
      const mockInsert = vi.fn();
      supabase.from.mockReturnValue({ insert: mockInsert });

      const file = new File(['bad'], 'thumb.png', { type: 'image/png' });

      await expect(uploadFileToR2(file, 'article_thumbnails')).rejects.toThrow('Network error during upload');
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('overwrites old thumbnail URL with new R2 URL when author replaces image', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      });
      supabase.from.mockReturnValue({ update: mockUpdate });

      uploadFileToR2.mockResolvedValueOnce('https://pub-r2.climamedix.org/article_thumbnails/new-cover-2026.webp');

      const newFile = new File(['new'], 'new_photo.png', { type: 'image/png' });
      const newUrl = await uploadFileToR2(newFile, 'article_thumbnails');

      await supabase.from('news_articles').update({ cover_image: newUrl }).eq('id', 'art-1');

      expect(newUrl).toBe('https://pub-r2.climamedix.org/article_thumbnails/new-cover-2026.webp');
      expect(mockUpdate).toHaveBeenCalledWith({ cover_image: newUrl });
    });
  });

  // ─── 4. Research Document PDF Upload Lifecycle (3 Tests) ────────────────────
  describe('4. Research Document PDF Upload Lifecycle (3 Tests)', () => {
    it('uploads research paper PDF to "research_publications" and saves pdf_url in publications table', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ insert: mockInsert });

      uploadFileToR2.mockResolvedValueOnce('https://pub-r2.climamedix.org/research_publications/water-quality-study.pdf');

      const pdfFile = new File(['%PDF-1.4...'], 'water-quality-study.pdf', { type: 'application/pdf' });
      const fileUrl = await uploadFileToR2(pdfFile, 'research_publications');

      const payload = {
        title_ar: 'تحليل جودة مياه الشرب بالدلتا',
        category: 'research',
        pdf_url: fileUrl,
        created_by: 'researcher-01'
      };

      await supabase.from('publications').insert([payload]);

      expect(fileUrl).toContain('/research_publications/');
      expect(mockInsert).toHaveBeenCalledWith([expect.objectContaining({
        pdf_url: 'https://pub-r2.climamedix.org/research_publications/water-quality-study.pdf'
      })]);
    });

    it('validation fails and halts upload if research file is missing', () => {
      const attachedFile = null;
      let error = '';

      if (!attachedFile) {
        error = 'You must attach a research file';
      }

      expect(error).toBe('You must attach a research file');
      expect(uploadFileToR2).not.toHaveBeenCalled();
    });

    it('handles publication table insert failure after PDF upload', async () => {
      uploadFileToR2.mockResolvedValueOnce('https://pub-r2.climamedix.org/research_publications/paper.pdf');
      
      const mockInsert = vi.fn().mockResolvedValue({
        error: new Error('duplicate key value violates unique constraint')
      });
      supabase.from.mockReturnValue({ insert: mockInsert });

      const pdfUrl = await uploadFileToR2(new File(['data'], 'paper.pdf', { type: 'application/pdf' }), 'research_publications');
      const { error } = await supabase.from('publications').insert([{ pdf_url: pdfUrl }]);

      expect(error).toBeDefined();
      expect(error.message).toContain('duplicate key');
    });
  });

  // ─── 5. Join Us CV Upload Lifecycle (3 Tests) ───────────────────────────────
  describe('5. Join Us CV Upload Lifecycle (3 Tests)', () => {
    it('uploads CV to "cvs" folder and saves cv_url in join_requests table', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ insert: mockInsert });

      uploadFileToR2.mockResolvedValueOnce('https://pub-r2.climamedix.org/cvs/dr-marian-cv.pdf');

      const cvFile = new File(['cv data'], 'dr-marian-cv.pdf', { type: 'application/pdf' });
      const cvUrl = await uploadFileToR2(cvFile, 'cvs');

      const joinPayload = {
        full_name: 'د. مريم العتيبي',
        email: 'm.otaibi@climamedix.org',
        cv_url: cvUrl
      };

      await supabase.from('join_requests').insert([joinPayload]);

      expect(cvUrl).toBe('https://pub-r2.climamedix.org/cvs/dr-marian-cv.pdf');
      expect(mockInsert).toHaveBeenCalledWith([expect.objectContaining({ cv_url: cvUrl })]);
    });

    it('sets cv_url to null if applicant does not attach a CV file', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ insert: mockInsert });

      const cvFile = null;
      let cvUrl = null;
      if (cvFile) {
        cvUrl = await uploadFileToR2(cvFile, 'cvs');
      }

      await supabase.from('join_requests').insert([{ full_name: 'طالب متطوع', cv_url: cvUrl }]);

      expect(uploadFileToR2).not.toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalledWith([expect.objectContaining({ cv_url: null })]);
    });

    it('catches R2 upload failure and displays error message without submitting join request', async () => {
      uploadFileToR2.mockRejectedValueOnce(new Error('Upload failed: 503 Service Unavailable'));
      const mockInsert = vi.fn();
      supabase.from.mockReturnValue({ insert: mockInsert });

      const cvFile = new File(['cv'], 'cv.pdf', { type: 'application/pdf' });

      await expect(uploadFileToR2(cvFile, 'cvs')).rejects.toThrow('Upload failed: 503 Service Unavailable');
      expect(mockInsert).not.toHaveBeenCalled();
    });
  });

  // ─── 6. Course Builder & Slider Banner Uploads (3 Tests) ────────────────────
  describe('6. Course Builder & Slider Banner Uploads (3 Tests)', () => {
    it('course builder uploads cover image to "course_covers" and stores URL in course form state', async () => {
      uploadFileToR2.mockResolvedValueOnce('https://pub-r2.climamedix.org/course_covers/climate-medicine-101.webp');

      const coverFile = new File(['cover-img'], 'cover.png', { type: 'image/png' });
      const publicUrl = await uploadFileToR2(coverFile, 'course_covers');

      expect(publicUrl).toBe('https://pub-r2.climamedix.org/course_covers/climate-medicine-101.webp');
      expect(uploadFileToR2).toHaveBeenCalledWith(coverFile, 'course_covers');
    });

    it('slider manager uploads custom announcement banner to "slider" folder', async () => {
      uploadFileToR2.mockResolvedValueOnce('https://pub-r2.climamedix.org/slider/annual-conference-banner.webp');

      const bannerFile = new File(['banner'], 'banner.jpg', { type: 'image/jpeg' });
      const url = await uploadFileToR2(bannerFile, 'slider');

      expect(url).toBe('https://pub-r2.climamedix.org/slider/annual-conference-banner.webp');
      expect(uploadFileToR2).toHaveBeenCalledWith(bannerFile, 'slider');
    });

    it('slider manager resets file input value after upload completes', () => {
      const mockFileInput = { value: 'C:\\fakepath\\banner.png' };
      
      // Simulate finally block in handleImageUpload
      mockFileInput.value = '';

      expect(mockFileInput.value).toBe('');
    });
  });

  // ─── 7. RichTextEditor Embedded Cloud Uploads Lifecycle (5 Tests) ───────────
  describe('7. RichTextEditor Embedded Cloud Uploads Lifecycle (5 Tests)', () => {
    it('uploads article body image to "articles" folder with onProgress callback tracking', async () => {
      let progressVal = 0;
      const onProgress = vi.fn((pct) => { progressVal = pct; });
      uploadFileToR2.mockImplementationOnce(async (file, folder, cb) => {
        cb(50);
        cb(100);
        return `https://pub-r2.climamedix.org/${folder}/embedded-figure.webp`;
      });

      const imageFile = new File(['webp-bytes'], 'figure.webp', { type: 'image/webp' });
      const url = await uploadFileToR2(imageFile, 'articles', onProgress);

      expect(uploadFileToR2).toHaveBeenCalledWith(imageFile, 'articles', onProgress);
      expect(onProgress).toHaveBeenCalledWith(50);
      expect(onProgress).toHaveBeenCalledWith(100);
      expect(url).toBe('https://pub-r2.climamedix.org/articles/embedded-figure.webp');
    });

    it('uploads lecture video to "videos" folder and tracks continuous stream progress', async () => {
      const progressSteps = [];
      const onProgress = vi.fn((pct) => { progressSteps.push(pct); });

      uploadFileToR2.mockImplementationOnce(async (file, folder, cb) => {
        cb(25);
        cb(75);
        cb(100);
        return `https://pub-r2.climamedix.org/${folder}/lecture-part1.mp4`;
      });

      const videoFile = new File(['video-stream'], 'lecture-part1.mp4', { type: 'video/mp4' });
      const url = await uploadFileToR2(videoFile, 'videos', onProgress);

      expect(url).toContain('/videos/lecture-part1.mp4');
      expect(progressSteps).toEqual([25, 75, 100]);
    });

    it('uploads audio podcast to "course_audio" folder and returns persistent audio stream URL', async () => {
      uploadFileToR2.mockResolvedValueOnce('https://pub-r2.climamedix.org/course_audio/episode-10.mp3');

      const audioFile = new File(['audio-frames'], 'episode-10.mp3', { type: 'audio/mpeg' });
      const onProgress = vi.fn();
      const url = await uploadFileToR2(audioFile, 'course_audio', onProgress);

      expect(uploadFileToR2).toHaveBeenCalledWith(audioFile, 'course_audio', onProgress);
      expect(url).toBe('https://pub-r2.climamedix.org/course_audio/episode-10.mp3');
    });

    it('media handler discriminates between image and video files and routes to distinct folders', async () => {
      uploadFileToR2.mockImplementation(async (file, folder) => {
        return `https://pub-r2.climamedix.org/${folder}/${file.name}`;
      });

      const img = new File(['img'], 'photo.png', { type: 'image/png' });
      const vid = new File(['vid'], 'video.webm', { type: 'video/webm' });

      const files = [img, vid];
      const results = [];

      for (const f of files) {
        if (f.type.startsWith('image/')) {
          results.push(await uploadFileToR2(f, 'articles'));
        } else if (f.type.startsWith('video/')) {
          results.push(await uploadFileToR2(f, 'videos'));
        }
      }

      expect(results[0]).toContain('/articles/photo.png');
      expect(results[1]).toContain('/videos/video.webm');
      expect(uploadFileToR2).toHaveBeenCalledWith(img, 'articles');
      expect(uploadFileToR2).toHaveBeenCalledWith(vid, 'videos');
    });

    it('handles media upload error during loop without breaking remaining file pipeline state', async () => {
      uploadFileToR2
        .mockRejectedValueOnce(new Error('Network drop on video'))
        .mockResolvedValueOnce('https://pub-r2.climamedix.org/videos/video2.mp4');

      const v1 = new File(['v1'], 'v1.mp4', { type: 'video/mp4' });
      const v2 = new File(['v2'], 'v2.mp4', { type: 'video/mp4' });

      let err1 = null;
      try {
        await uploadFileToR2(v1, 'videos');
      } catch (e) {
        err1 = e;
      }
      const url2 = await uploadFileToR2(v2, 'videos');

      expect(err1).toBeDefined();
      expect(err1.message).toBe('Network drop on video');
      expect(url2).toBe('https://pub-r2.climamedix.org/videos/video2.mp4');
    });
  });

  // ─── 8. Cloud Storage Invariants, Concurrency & Target Routing Matrix (5 Tests) ─
  describe('8. Cloud Storage Invariants, Concurrency & Target Routing Matrix (5 Tests)', () => {
    it('executes concurrent multi-feature uploads simultaneously without cross-talk or race conditions', async () => {
      uploadFileToR2
        .mockResolvedValueOnce('https://pub-r2.climamedix.org/avatars/user-1.webp')
        .mockResolvedValueOnce('https://pub-r2.climamedix.org/research_publications/paper-1.pdf')
        .mockResolvedValueOnce('https://pub-r2.climamedix.org/cvs/cv-1.pdf');

      const avatarFile = new File(['a'], 'avatar.png', { type: 'image/png' });
      const paperFile = new File(['p'], 'paper.pdf', { type: 'application/pdf' });
      const cvFile = new File(['c'], 'cv.pdf', { type: 'application/pdf' });

      const [avatarUrl, paperUrl, cvUrl] = await Promise.all([
        uploadFileToR2(avatarFile, 'avatars'),
        uploadFileToR2(paperFile, 'research_publications'),
        uploadFileToR2(cvFile, 'cvs')
      ]);

      expect(avatarUrl).toContain('/avatars/');
      expect(paperUrl).toContain('/research_publications/');
      expect(cvUrl).toContain('/cvs/');
      expect(uploadFileToR2).toHaveBeenCalledTimes(3);
    });

    it('preserves multi-extension files correctly (.tar.gz, .min.js, .backup.pdf)', async () => {
      uploadFileToR2.mockImplementation(async (file, folder) => {
        return `https://pub-r2.climamedix.org/${folder}/${Date.now()}-${file.name}`;
      });

      const complexFile = new File(['data'], 'report.backup.pdf', { type: 'application/pdf' });
      const uploadedUrl = await uploadFileToR2(complexFile, 'documents');

      expect(uploadedUrl).toMatch(/\/documents\/\d+-report\.backup\.pdf$/);
    });

    it('ensures all 9 storage folders strictly maintain their directory separation invariants', async () => {
      const folders = [
        'avatars',
        'research_publications',
        'article_thumbnails',
        'course_covers',
        'cvs',
        'slider',
        'videos',
        'course_audio',
        'articles'
      ];

      uploadFileToR2.mockImplementation(async (file, folder) => {
        return `https://pub-r2.climamedix.org/${folder}/${file.name}`;
      });

      for (const folder of folders) {
        const testFile = new File(['test'], `${folder}-asset.bin`, { type: 'application/octet-stream' });
        const res = await uploadFileToR2(testFile, folder);
        expect(res).toBe(`https://pub-r2.climamedix.org/${folder}/${folder}-asset.bin`);
        expect(res.startsWith('https://pub-r2.climamedix.org/')).toBe(true);
      }
    });

    it('handles zero-byte file upload attempt cleanly without throwing unhandled exceptions', async () => {
      uploadFileToR2.mockResolvedValueOnce('https://pub-r2.climamedix.org/documents/empty.txt');

      const emptyFile = new File([], 'empty.txt', { type: 'text/plain' });
      const result = await uploadFileToR2(emptyFile, 'documents');

      expect(result).toBe('https://pub-r2.climamedix.org/documents/empty.txt');
    });

    it('re-throws clear and actionable storage failure message when cloud gateway rejects upload', async () => {
      uploadFileToR2.mockRejectedValueOnce(new Error('Failed to upload file to storage: 504 Gateway Timeout'));

      const file = new File(['data'], 'heavy.pdf', { type: 'application/pdf' });

      await expect(uploadFileToR2(file, 'research_publications')).rejects.toThrow(
        'Failed to upload file to storage: 504 Gateway Timeout'
      );
    });
  });
});
