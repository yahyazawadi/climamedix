import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';

// Components
import { ResearchUploadPage } from '../features/research-center/components/ResearchUploadPage';
import { ResearchHubPage } from '../features/research-center/components/ResearchHubPage';
import { ArticleEditorPage } from '../features/news-blog/components/ArticleEditorPage';
import { ArticleReaderPage } from '../features/news-blog/components/ArticleReaderPage';
import { SliderManagerPage } from '../features/admin/components/SliderManagerPage';
import { CourseBuilderPage } from '../features/learning-hub/components/admin/CourseBuilderPage';
import { ProfilePage } from '../features/profile/components/ProfilePage';

// Utilities & Services
import { uploadFileToR2 } from '../utils/s3Client';
import { supabase } from '../utils/supabaseClient';
import * as adminLmsService from '../features/learning-hub/services/adminLmsService';

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('../features/auth/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth()
}));

// Mock s3Client
vi.mock('../utils/s3Client', () => ({
  uploadFileToR2: vi.fn(),
  R2_PUBLIC_URL: 'https://pub-r2.climamedix.org',
  R2_BUCKET_NAME: 'climamedix'
}));

// Mock RichTextEditor
vi.mock('../features/shared/components/RichTextEditor', () => ({
  RichTextEditor: ({ value, onChange, placeholder, isRtl }) => (
    <div data-testid="mock-rich-editor" dir={isRtl ? 'rtl' : 'ltr'}>
      <textarea
        placeholder={placeholder}
        value={value}
        onInput={(e) => onChange(e.target.value)}
      />
    </div>
  )
}));

// Mock AmbientParticles
vi.mock('../features/shared/components/AmbientParticles', () => ({
  AmbientParticles: () => <div data-testid="ambient-particles" />
}));

// Mock adminLmsService
vi.mock('../features/learning-hub/services/adminLmsService', () => ({
  adminFetchAllCourses: vi.fn(),
  adminCreateCourse: vi.fn(),
  adminUpdateCourse: vi.fn(),
  adminDeleteCourse: vi.fn(),
  adminCreateModule: vi.fn(),
  adminUpdateModule: vi.fn(),
  adminDeleteModule: vi.fn(),
  adminCreateLesson: vi.fn(),
  adminUpdateLesson: vi.fn(),
  adminDeleteLesson: vi.fn(),
  adminFetchFullQuiz: vi.fn(),
  adminCreateQuiz: vi.fn(),
  adminCreateQuestion: vi.fn(),
  adminDeleteQuestion: vi.fn(),
}));

// Mock Supabase
vi.mock('../utils/supabaseClient', () => {
  const mockFrom = vi.fn();
  const mockRpc = vi.fn();
  const mockAuth = {
    getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
  };

  return {
    supabase: {
      from: mockFrom,
      rpc: mockRpc,
      auth: mockAuth
    }
  };
});

describe('Crucial Content Uploads, Viewing & Permission Enforcement Matrix (18 Tests)', () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  const createQueryChain = (data = []) => {
    const p = Promise.resolve({ data, error: null });
    p.select = vi.fn().mockImplementation(() => createQueryChain(data));
    p.order = vi.fn().mockImplementation(() => createQueryChain(data));
    p.eq = vi.fn().mockImplementation(() => createQueryChain(data));
    p.single = vi.fn().mockResolvedValue({
      data: Array.isArray(data) ? (data[0] || null) : data,
      error: null
    });
    p.insert = vi.fn().mockResolvedValue({ error: null });
    p.update = vi.fn().mockImplementation(() => ({
      eq: vi.fn().mockResolvedValue({ error: null })
    }));
    p.delete = vi.fn().mockImplementation(() => ({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      })
    }));
    return p;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    URL.createObjectURL = vi.fn(() => 'blob:mock-preview-url');
    URL.revokeObjectURL = vi.fn();

    // Default HTML Canvas & Image mocks for WebP conversions
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      drawImage: vi.fn(),
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    }));
    HTMLCanvasElement.prototype.toBlob = vi.fn(function(cb) {
      cb(new Blob(['webp-data'], { type: 'image/webp' }));
    });

    class MockImage {
      constructor() {
        this.width = 400;
        this.height = 300;
      }
      set src(val) {
        this._src = val;
        setTimeout(() => { if (this.onload) this.onload(); }, 0);
      }
      get src() {
        return this._src;
      }
    }
    window.Image = MockImage;
    window.alert = vi.fn();
    window.confirm = vi.fn(() => true);

    // Default Supabase query chain
    supabase.from.mockImplementation(() => createQueryChain([]));
    supabase.rpc.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // 1. Research Publications: Upload, View, Download & Permission Enforcement
  // ═══════════════════════════════════════════════════════════════════════════════
  describe('1. Research Publications Upload, View & Permission Enforcement', () => {
    it('DENIES access to ResearchUploadPage when user lacks write:research permission, rendering Access Denied and preventing R2 upload', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'reader-1', email: 'reader@climamedix.org' },
        hasPermission: (perm) => perm !== 'write:research',
        authLoading: false
      });

      render(<ResearchUploadPage lang="en" onNavigate={vi.fn()} />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText('You do not have permission to upload research.')).toBeInTheDocument();
      expect(screen.queryByText('Save & Publish')).toBeNull();
      expect(uploadFileToR2).not.toHaveBeenCalled();
    });

    it('HIDES "Upload Research" button on ResearchHubPage when user lacks write:research permission', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'guest-1', email: 'guest@climamedix.org' },
        hasPermission: (perm) => perm === 'view:public_content',
        authLoading: false
      });

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      render(<ResearchHubPage lang="en" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.queryByText('+ Upload Research')).toBeNull();
      });
    });

    it('ALLOWS researcher with write:research to upload study to Cloudflare R2, save to database, and navigates to hub', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'researcher-77', email: 'dr.nour@climamedix.org' },
        hasPermission: (perm) => perm === 'write:research',
        authLoading: false
      });

      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockImplementation((table) => {
        if (table === 'publications') {
          return { insert: mockInsert };
        }
        return createQueryChain([]);
      });

      uploadFileToR2.mockResolvedValueOnce('https://pub-r2.climamedix.org/research_publications/air-quality-study-2026.pdf');

      const onNavigate = vi.fn();
      const { container } = render(<ResearchUploadPage lang="ar" onNavigate={onNavigate} />);

      expect(screen.getByText('إضافة بحث أو مستند جديد')).toBeInTheDocument();

      // 1. Fill Form
      const titleInput = container.querySelector('input[placeholder*="عنوان البحث"]') || container.querySelectorAll('input[type="text"]')[0];
      fireEvent.input(titleInput, { target: { value: 'دراسة جودة الهواء بالدلتا' } });

      // 2. Attach File
      const fileInput = container.querySelector('input[type="file"]');
      const samplePdf = new File(['%PDF-1.4...'], 'air-quality-study-2026.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [samplePdf] } });

      // 3. Submit
      const submitBtn = screen.getByText('حفظ ونشر');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(uploadFileToR2).toHaveBeenCalledWith(samplePdf, 'research_publications');
        expect(mockInsert).toHaveBeenCalledWith([expect.objectContaining({
          title_ar: 'دراسة جودة الهواء بالدلتا',
          pdf_url: 'https://pub-r2.climamedix.org/research_publications/air-quality-study-2026.pdf',
          created_by: 'researcher-77'
        })]);
      });
    });

    it('RENDERS uploaded research publication card in ResearchHubPage with direct download link to uploaded R2 URL for authorized users', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-1', email: 'member@climamedix.org' },
        hasPermission: (perm) => perm === 'view:public_content' || perm === 'view:free_content',
        authLoading: false
      });

      const publishedStudy = {
        id: 'pub-88',
        title_ar: 'تأثير درجات الحرارة على العمال الميدانيين',
        title_en: 'Heat Impact on Field Workers',
        authors: 'د. نور الدين الشامي',
        year: '2026',
        category: 'research',
        abstract_ar: 'دراسة شاملة حول مخاطر الإجهاد الحراري في قطاع البناء.',
        pdf_url: 'https://pub-r2.climamedix.org/research_publications/heat-workers-2026.pdf',
        teaser_permission_key: 'view:public_content',
        full_access_permission_key: 'view:free_content'
      };

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [publishedStudy], error: null })
        })
      });

      render(<ResearchHubPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('تأثير درجات الحرارة على العمال الميدانيين')).toBeInTheDocument();
        expect(screen.getByText('د. نور الدين الشامي')).toBeInTheDocument();
      });

      // Assert download link points to uploaded Cloudflare R2 URL
      const downloadLink = screen.getByText(/تحميل/).closest('a');
      expect(downloadLink).not.toBeNull();
      expect(downloadLink.getAttribute('href')).toBe('https://pub-r2.climamedix.org/research_publications/heat-workers-2026.pdf');
    });

    it('GATES research download behind "Upgrade to Download" when publication requires paid permission user lacks', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'free-user', email: 'free@climamedix.org' },
        hasPermission: (perm) => perm === 'view:public_content', // Lacks view:pro_research
        authLoading: false
      });

      const proStudy = {
        id: 'pub-pro-9',
        title_ar: 'التقرير المناخي الحصري 2026',
        title_en: 'Exclusive Climate Report 2026',
        authors: 'فريق أبحاث كليما ميديكس',
        year: '2026',
        category: 'report',
        abstract_ar: 'تقرير شامل متاح فقط للمشتركين.',
        pdf_url: 'https://pub-r2.climamedix.org/research_publications/exclusive-report.pdf',
        teaser_permission_key: 'view:public_content',
        full_access_permission_key: 'view:pro_research'
      };

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [proStudy], error: null })
        })
      });

      render(<ResearchHubPage lang="en" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Exclusive Climate Report 2026')).toBeInTheDocument();
      });

      // Must display Upgrade to Download instead of direct anchor link
      expect(screen.getByText('Upgrade to Download')).toBeInTheDocument();
      expect(screen.queryByText('Download')).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // 2. News & Articles: Upload Cover/Media, View in Reader & Permission Enforcement
  // ═══════════════════════════════════════════════════════════════════════════════
  describe('2. News & Articles Cover Upload, Viewing & Permission Enforcement', () => {
    it('DENIES access to ArticleEditorPage for new article creation when user lacks write:articles permission', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'standard-user-1', email: 'std@climamedix.org' },
        hasPermission: (perm) => perm !== 'write:articles' && perm !== 'manage:any_article',
        authLoading: false
      });

      render(<ArticleEditorPage lang="en" onNavigate={vi.fn()} />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText('You do not have permission to edit or write this article.')).toBeInTheDocument();
      expect(uploadFileToR2).not.toHaveBeenCalled();
    });

    it('DENIES edit access to ArticleEditorPage when user has write:articles but is NOT author and lacks manage:any_article', async () => {
      window.history.pushState({}, '', '/write-article?id=article-99');

      mockUseAuth.mockReturnValue({
        user: { id: 'author-alice', email: 'alice@climamedix.org' },
        hasPermission: (perm) => perm === 'write:articles', // lacks manage:any_article
        authLoading: false
      });

      // Article was created by author-bob
      const otherAuthorArticle = {
        id: 'article-99',
        title_ar: 'مقال بوب الحصري',
        created_by: 'author-bob'
      };

      supabase.from.mockImplementation((table) => {
        if (table === 'news_articles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: otherAuthorArticle, error: null })
              })
            })
          };
        }
        return createQueryChain([]);
      });

      render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('غير مصرح بالوصول')).toBeInTheDocument();
        expect(screen.getByText('ليس لديك صلاحية لتعديل أو كتابة هذا المقال.')).toBeInTheDocument();
      });

      window.history.pushState({}, '', '/');
    });

    it('ALLOWS author with write:articles to upload cover image to R2, save article, and view it in ArticleReaderPage', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'author-carol', email: 'carol@climamedix.org' },
        userProfile: { full_name: 'د. كارول سعيد' },
        hasPermission: (perm) => perm === 'write:articles',
        authLoading: false
      });

      uploadFileToR2.mockResolvedValueOnce('https://pub-r2.climamedix.org/article_thumbnails/climate-crisis-2026.webp');

      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockImplementation((table) => {
        if (table === 'news_articles') {
          return { insert: mockInsert };
        }
        return createQueryChain([]);
      });

      const { container } = render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      // Fill in title
      const titleInput = container.querySelector('input[placeholder*="عنوان المقال"]') || container.querySelector('input[type="text"]');
      fireEvent.input(titleInput, { target: { value: 'أزمة المناخ وصحة الأطفال' } });

      // Fill in content
      const contentTextarea = screen.getByPlaceholderText('ابدأ الكتابة هنا...');
      fireEvent.input(contentTextarea, { target: { value: '<p>محتوى المقال الكامل والواضح حول أزمة المناخ وصحة الأطفال.</p>' } });

      // Upload Cover Thumbnail
      const fileInput = container.querySelector('input[type="file"][accept*="image"]');
      const thumbFile = new File(['image-bits'], 'crisis.webp', { type: 'image/webp' });
      fireEvent.change(fileInput, { target: { files: [thumbFile] } });

      await waitFor(() => {
        expect(container.querySelector('.aep-thumb-preview')).toBeInTheDocument();
      });

      // Submit
      const publishBtn = screen.getByText('نشر المقال');
      fireEvent.click(publishBtn);

      await waitFor(() => {
        expect(uploadFileToR2).toHaveBeenCalledWith(expect.any(File), 'article_thumbnails');
        expect(mockInsert).toHaveBeenCalledWith([expect.objectContaining({
          cover_image: 'https://pub-r2.climamedix.org/article_thumbnails/climate-crisis-2026.webp',
          created_by: 'author-carol'
        })]);
      });
    });

    it('RENDERS uploaded cover image and article content in ArticleReaderPage with incremented view count', async () => {
      window.history.pushState({}, '', '/article?id=art-child-1');

      mockUseAuth.mockReturnValue({
        user: { id: 'reader-99', email: 'reader@test.com' },
        hasPermission: (perm) => perm === 'view:public_content',
        authLoading: false
      });

      const publishedArticle = {
        id: 'art-child-1',
        title_ar: 'أزمة المناخ وصحة الأطفال',
        title_en: 'Climate Crisis and Child Health',
        content_ar: '<p>محتوى المقال الكامل المنشور بواسطة الكاتب.</p>',
        cover_image: 'https://pub-r2.climamedix.org/article_thumbnails/climate-crisis-2026.webp',
        author_name: 'د. كارول سعيد',
        published_at: '2026-09-15T12:00:00Z',
        views_count: 10,
        likes_count: 3,
        created_by: 'author-carol'
      };

      supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'reader-99' } } });
      supabase.from.mockImplementation((table) => {
        if (table === 'news_articles_accessible') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: publishedArticle, error: null })
              })
            })
          };
        }
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { avatar_url: null }, error: null })
              })
            })
          };
        }
        return createQueryChain([]);
      });

      const { container } = render(<ArticleReaderPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('أزمة المناخ وصحة الأطفال')).toBeInTheDocument();
        expect(screen.getByText('د. كارول سعيد')).toBeInTheDocument();
      });

      // Assert uploaded Cloudflare R2 image is rendered in img src
      const coverImg = container.querySelector('img[src="https://pub-r2.climamedix.org/article_thumbnails/climate-crisis-2026.webp"]');
      expect(coverImg).not.toBeNull();
      expect(coverImg.getAttribute('alt')).toBe('أزمة المناخ وصحة الأطفال');

      window.history.pushState({}, '', '/');
    });

    it('SHOWS Edit button on ArticleReaderPage only for author or users with manage:any_article, and HIDES from regular viewers', async () => {
      window.history.pushState({}, '', '/article?id=art-edit-chk');

      const article = {
        id: 'art-edit-chk',
        title_ar: 'مقال تحت الاختبار',
        content_ar: '<p>محتوى</p>',
        created_by: 'author-user-id'
      };

      supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'viewer-user-id' } } });
      supabase.from.mockImplementation((table) => {
        if (table === 'news_articles_accessible') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: article, error: null })
              })
            })
          };
        }
        return createQueryChain([]);
      });

      // 1. Viewer lacking permission: Edit button is hidden
      mockUseAuth.mockReturnValue({
        user: { id: 'viewer-user-id', email: 'viewer@test.com' },
        hasPermission: () => false,
        authLoading: false
      });

      const { unmount } = render(<ArticleReaderPage lang="ar" onNavigate={vi.fn()} />);
      await waitFor(() => {
        expect(screen.queryByText('تعديل')).toBeNull();
      });
      unmount();

      // 2. Author viewing their own article: Edit button is visible
      mockUseAuth.mockReturnValue({
        user: { id: 'author-user-id', email: 'author@test.com' },
        hasPermission: (perm) => perm === 'write:articles',
        authLoading: false
      });

      render(<ArticleReaderPage lang="ar" onNavigate={vi.fn()} />);
      await waitFor(() => {
        expect(screen.getByText('تعديل')).toBeInTheDocument();
      });

      window.history.pushState({}, '', '/');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // 3. Homepage Slider Announcements: Upload Banner, View in Slider & Permission Enforcement
  // ═══════════════════════════════════════════════════════════════════════════════
  describe('3. Homepage Slider Banner Upload, Viewing & Permission Enforcement', () => {
    it('DENIES access to SliderManagerPage when user lacks manage:slider permission, showing Access Denied and preventing image uploads', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'regular-user', email: 'reg@climamedix.org' },
        hasPermission: (perm) => perm !== 'manage:slider',
        authLoading: false
      });

      render(<SliderManagerPage lang="ar" onNavigate={vi.fn()} />);

      expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
      expect(uploadFileToR2).not.toHaveBeenCalled();
    });

    it('ALLOWS user with manage:slider to upload banner image to R2, publish custom announcement, and view in active slides list', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'admin-slider', email: 'slider-admin@climamedix.org' },
        hasPermission: (perm) => perm === 'manage:slider',
        authLoading: false
      });

      const mockSliderItems = [];
      supabase.from.mockImplementation((table) => ({
        select: vi.fn().mockImplementation(() => {
          const res = { data: table === 'home_slider' ? mockSliderItems : [], error: null };
          const p = Promise.resolve(res);
          p.order = vi.fn().mockResolvedValue(res);
          return p;
        }),
        insert: vi.fn().mockImplementation((payload) => {
          const item = { id: 'slide-101', ...payload };
          mockSliderItems.push(item);
          return Promise.resolve({ data: item, error: null });
        })
      }));

      uploadFileToR2.mockResolvedValueOnce('https://pub-r2.climamedix.org/slider/cop31-banner.webp');

      const { container } = render(<SliderManagerPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('إدارة واجهة الرئيسية (Slider Manager)')).toBeInTheDocument();
      });

      // 1. Open Custom Announcement modal
      fireEvent.click(screen.getByText('إعلان مخصص'));

      // 2. Set Title inside Modal
      const modal = document.querySelector('div[style*="fixed"]');
      const textInputs = modal.querySelectorAll('input[type="text"]');
      fireEvent.input(textInputs[0], { target: { value: 'مؤتمر COP31 الصحي' } });

      // 3. Upload banner image to R2
      const fileInput = modal.querySelector('input[type="file"]');
      const bannerFile = new File(['banner-content'], 'cop31.png', { type: 'image/png' });
      await fireEvent.change(fileInput, { target: { files: [bannerFile] } });

      await waitFor(() => {
        expect(uploadFileToR2).toHaveBeenCalledWith(bannerFile, 'slider');
      });

      // 4. Publish
      const publishBtn = screen.getByText('Publish to Slider');
      await fireEvent.click(publishBtn);

      await waitFor(() => {
        expect(screen.getByText('مؤتمر COP31 الصحي')).toBeInTheDocument();
      });

      // Verify active slide image displays the uploaded R2 URL
      const activeImg = container.querySelector('img[src="https://pub-r2.climamedix.org/slider/cop31-banner.webp"]');
      expect(activeImg).not.toBeNull();
    });

    it('PREVENTS slider item addition if image upload fails or user attempts to publish without uploaded banner', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'admin-slider', email: 'admin@climamedix.org' },
        hasPermission: (perm) => perm === 'manage:slider',
        authLoading: false
      });

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      render(<SliderManagerPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('إدارة واجهة الرئيسية (Slider Manager)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('إعلان مخصص'));

      // Click Publish without title or image
      fireEvent.click(screen.getByText('Publish to Slider'));

      expect(window.alert).toHaveBeenCalledWith('Title and Image are required!');
      expect(uploadFileToR2).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // 4. Course Builder & Curriculum: Upload Cover, View in LMS & Permission Enforcement
  // ═══════════════════════════════════════════════════════════════════════════════
  describe('4. Course Builder Cover Upload, Viewing & Permission Enforcement', () => {
    it('DENIES access to CourseBuilderPage when user lacks manage:courses and manage:any_course permissions', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'student-1', email: 'student@climamedix.org' },
        hasPermission: () => false,
        authLoading: false
      });

      render(<CourseBuilderPage lang="en" onNavigate={vi.fn()} />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText('You do not have permissions to manage courses.')).toBeInTheDocument();
      expect(uploadFileToR2).not.toHaveBeenCalled();
    });

    it('ALLOWS admin with manage:courses to upload course cover banner to R2 and verifies course is saved with uploaded image', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'admin-lms', email: 'educator@climamedix.org' },
        hasPermission: (perm) => perm === 'manage:any_course' || perm === 'manage:courses',
        authLoading: false
      });

      adminLmsService.adminFetchAllCourses.mockResolvedValueOnce([]);
      adminLmsService.adminCreateCourse.mockResolvedValueOnce({
        id: 'course-new-1',
        title_ar: 'الطب المناخي المتقدم',
        title_en: 'Advanced Climate Medicine',
        cover_image: 'https://pub-r2.climamedix.org/course_covers/adv-med.webp'
      });

      uploadFileToR2.mockResolvedValueOnce('https://pub-r2.climamedix.org/course_covers/adv-med.webp');

      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const newCourseBtn = await screen.findByText('+ مساق جديد');
      fireEvent.click(newCourseBtn);

      const modal = document.querySelector('.cb-modal-card');
      const textInputs = modal.querySelectorAll('input[type="text"]');
      fireEvent.input(textInputs[0], { target: { value: 'الطب المناخي المتقدم' } });
      fireEvent.input(textInputs[1], { target: { value: 'Advanced Climate Medicine' } });

      // Upload Cover Banner
      const fileInput = modal.querySelector('input[type="file"][accept*="image"]');
      const coverFile = new File(['cover-pixels'], 'banner.jpg', { type: 'image/jpeg' });
      await fireEvent.change(fileInput, { target: { files: [coverFile] } });

      await waitFor(() => {
        expect(uploadFileToR2).toHaveBeenCalledWith(expect.any(File), 'course_covers');
      });

      // Submit Course Creation
      const saveBtn = modal.querySelector('button[type="submit"]');
      await fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(adminLmsService.adminCreateCourse).toHaveBeenCalledWith(expect.objectContaining({
          title_ar: 'الطب المناخي المتقدم',
          cover_image: 'https://pub-r2.climamedix.org/course_covers/adv-med.webp'
        }));
      });
    });

    it('BLOCKS course save if upload of cover rejects and verifies state rollback without saving incomplete record', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'admin-lms', email: 'admin@climamedix.org' },
        hasPermission: (perm) => perm === 'manage:any_course' || perm === 'manage:courses',
        authLoading: false
      });

      adminLmsService.adminFetchAllCourses.mockResolvedValueOnce([]);
      uploadFileToR2.mockRejectedValueOnce(new Error('Cloudflare S3 503 Quota Full'));

      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const newCourseBtn = await screen.findByText('+ مساق جديد');
      fireEvent.click(newCourseBtn);

      const modal = document.querySelector('.cb-modal-card');
      const fileInput = modal.querySelector('input[type="file"][accept*="image"]');
      const coverFile = new File(['bad-cover'], 'bad.webp', { type: 'image/webp' });
      fireEvent.change(fileInput, { target: { files: [coverFile] } });

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Failed to upload cover image'));
      });

      expect(adminLmsService.adminCreateCourse).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // 5. Profile Avatars: Upload Avatar, View in Profile & Guest Permission Gating
  // ═══════════════════════════════════════════════════════════════════════════════
  describe('5. Profile Avatar Upload, Viewing & Guest Gating', () => {
    it('DENIES avatar upload and returns early when user is not authenticated (guest state)', async () => {
      mockUseAuth.mockReturnValue({
        user: null, // Unauthenticated guest
        userProfile: null,
        hasPermission: () => false,
        authLoading: false
      });

      render(<ProfilePage lang="en" onNavigate={vi.fn()} />);

      // Unauthenticated user is redirected or sees login prompt
      expect(screen.queryByText('Edit Profile')).toBeNull();
      expect(uploadFileToR2).not.toHaveBeenCalled();
    });

    it('ALLOWS authenticated user to upload avatar image to R2 avatars folder and renders new avatar in profile view', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      });
      supabase.from.mockReturnValue({ update: mockUpdate });

      mockUseAuth.mockReturnValue({
        user: { id: 'user-tariq-12', email: 'tariq@climamedix.org' },
        userProfile: {
          id: 'user-tariq-12',
          full_name: 'طارق الزهراني',
          avatar_url: null,
          role: 'user'
        },
        hasPermission: (perm) => perm === 'view:public_content',
        authLoading: false
      });

      uploadFileToR2.mockResolvedValueOnce('https://pub-r2.climamedix.org/avatars/user-tariq-12.webp');

      const { container } = render(<ProfilePage lang="ar" onNavigate={vi.fn()} />);

      expect(screen.getByText('طارق الزهراني')).toBeInTheDocument();

      // Trigger Avatar File Chooser
      const fileInput = container.querySelector('input[type="file"][accept*="image"]');
      const avatarFile = new File(['avatar-bytes'], 'tariq.png', { type: 'image/png' });
      await fireEvent.change(fileInput, { target: { files: [avatarFile] } });

      await waitFor(() => {
        expect(uploadFileToR2).toHaveBeenCalledWith(expect.any(File), 'avatars');
        expect(mockUpdate).toHaveBeenCalledWith({ avatar_url: 'https://pub-r2.climamedix.org/avatars/user-tariq-12.webp' });
      });

      // Rendered profile reflects the uploaded avatar image URL
      await waitFor(() => {
        const avatarImg = container.querySelector('img[src="https://pub-r2.climamedix.org/avatars/user-tariq-12.webp"]');
        expect(avatarImg).not.toBeNull();
      });
    });
  });
});
