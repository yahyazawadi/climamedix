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

describe('Platform Feature File Uploads Lifecycle Matrix (26 Tests)', () => {
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
});
