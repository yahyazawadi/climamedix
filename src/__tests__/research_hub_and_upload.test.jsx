import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { ResearchHubPage } from '../features/research-center/components/ResearchHubPage';
import { ResearchUploadPage } from '../features/research-center/components/ResearchUploadPage';
import { supabase } from '../utils/supabaseClient';
import { uploadFileToR2 } from '../utils/s3Client';

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('../features/auth/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth()
}));

// Mock s3Client
vi.mock('../utils/s3Client', () => ({
  uploadFileToR2: vi.fn()
}));

// Mock Supabase
vi.mock('../utils/supabaseClient', () => {
  const mockFrom = vi.fn();
  return {
    supabase: {
      from: mockFrom
    }
  };
});

describe('Research Center Hub & Research Upload Permissions Test Suite', () => {
  const mockPublicationsList = [
    {
      id: 'pub-1',
      title_ar: 'الآثار الصحية للموجات الحارة في الشرق الأوسط',
      title_en: 'Health Impacts of Heatwaves in the Middle East',
      authors: 'د. أحمد محمود، د. ليلى فهد',
      year: '2026',
      category: 'research',
      abstract_ar: 'دراسة وبائية موسعة حول درجات الحرارة المرتفعة.',
      pdf_url: 'https://r2.climamedix.org/research/heatwaves.pdf',
      teaser_permission_key: 'view:public_content',
      full_access_permission_key: 'view:free_content' // Requires authenticated user
    },
    {
      id: 'pub-2',
      title_ar: 'تقرير متقدم حول التلوث الكربوني والربو الحاد',
      title_en: 'Advanced Report on Carbon Pollution and Asthma',
      authors: 'فريق بحث ClimaMedix',
      year: '2026',
      category: 'reports',
      abstract_ar: 'تقرير سريري متقدم للأعضاء المشتركين.',
      pdf_url: 'https://r2.climamedix.org/research/asthma-report.pdf',
      teaser_permission_key: 'view:public_content',
      full_access_permission_key: 'view:all_courses' // Requires subscriber
    },
    {
      id: 'pub-3',
      title_ar: 'بحث مغلق خاص بالباحثين فقط',
      title_en: 'Researchers Only Confidential Study',
      authors: 'د. سامي',
      year: '2026',
      category: 'research',
      pdf_url: 'https://r2.climamedix.org/research/internal.pdf',
      teaser_permission_key: 'write:research', // Teaser itself is restricted
      full_access_permission_key: 'write:research'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. ResearchHubPage Permissions & Two-Tier Visibility', () => {
    it('HIDES "Upload Research" button from guests and students lacking write:research', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        hasPermission: (perm) => perm === 'view:public_content'
      });

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockPublicationsList,
            error: null
          })
        })
      });

      render(<ResearchHubPage lang="ar" onNavigate={vi.fn()} />);

      expect(await screen.findByText('الآثار الصحية للموجات الحارة في الشرق الأوسط')).toBeInTheDocument();
      // Upload button must be hidden
      expect(screen.queryByText('رفع بحث جديد')).toBeNull();
      expect(screen.queryByText('Upload Research')).toBeNull();
    });

    it('RENDERS "Upload Research" button for users with write:research permission', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'researcher-1' },
        hasPermission: (perm) => ['view:public_content', 'write:research'].includes(perm)
      });

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockPublicationsList,
            error: null
          })
        })
      });

      render(<ResearchHubPage lang="ar" onNavigate={vi.fn()} />);

      expect(await screen.findByText('رفع بحث جديد')).toBeInTheDocument();
    });

    it('Filters out publications whose teaser_permission_key the user does not possess', async () => {
      // Guest only has view:public_content
      mockUseAuth.mockReturnValue({
        user: null,
        hasPermission: (perm) => perm === 'view:public_content'
      });

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockPublicationsList,
            error: null
          })
        })
      });

      render(<ResearchHubPage lang="ar" onNavigate={vi.fn()} />);

      // Pub 1 and Pub 2 have view:public_content -> visible
      expect(await screen.findByText('الآثار الصحية للموجات الحارة في الشرق الأوسط')).toBeInTheDocument();
      expect(screen.getByText('تقرير متقدم حول التلوث الكربوني والربو الحاد')).toBeInTheDocument();

      // Pub 3 requires write:research to even see teaser -> must NOT be in DOM
      expect(screen.queryByText('بحث مغلق خاص بالباحثين فقط')).toBeNull();
    });

    it('Renders disabled "Upgrade to Download" for publications requiring higher tier', async () => {
      // Free user has view:free_content but NOT view:all_courses
      mockUseAuth.mockReturnValue({
        user: { id: 'free-user' },
        hasPermission: (perm) => ['view:public_content', 'view:free_content'].includes(perm)
      });

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockPublicationsList,
            error: null
          })
        })
      });

      render(<ResearchHubPage lang="ar" onNavigate={vi.fn()} />);

      await screen.findByText('الآثار الصحية للموجات الحارة في الشرق الأوسط');

      // Pub 1 has full_access_permission_key: 'view:free_content' -> user has it -> active download link
      const downloadLinks = screen.getAllByText(/تحميل/i);
      expect(downloadLinks.length).toBeGreaterThanOrEqual(1);

      // Pub 2 has full_access_permission_key: 'view:all_courses' -> user lacks it -> upgrade required
      expect(screen.getByText('مطلوب ترقية الحساب')).toBeInTheDocument();
    });
  });

  describe('2. ResearchUploadPage Route Protection & Submission Flow', () => {
    it('DENIES access and shows Access Denied view when user lacks write:research', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'u-1' },
        hasPermission: () => false,
        authLoading: false
      });

      render(<ResearchUploadPage lang="ar" onNavigate={vi.fn()} />);

      expect(screen.getByText('غير مصرح بالوصول')).toBeInTheDocument();
      expect(screen.getByText('ليس لديك صلاحية لرفع الأبحاث.')).toBeInTheDocument();
      expect(screen.queryByText('رفع ونشر بحث علمي')).toBeNull();
    });

    it('ALLOWS access for authorized researcher with write:research and renders upload form', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'researcher-1' },
        hasPermission: (perm) => perm === 'write:research',
        authLoading: false
      });

      render(<ResearchUploadPage lang="ar" onNavigate={vi.fn()} />);

      expect(screen.getByText('إضافة بحث أو مستند جديد')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('عنوان البحث...')).toBeInTheDocument();
    });

    it('Uploads file to Cloudflare R2 and saves publication record into Supabase', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'researcher-1' },
        hasPermission: (perm) => perm === 'write:research',
        authLoading: false
      });

      uploadFileToR2.mockResolvedValueOnce('https://r2.climamedix.org/research/sample-study.pdf');

      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({
        insert: mockInsert
      });

      render(<ResearchUploadPage lang="ar" onNavigate={vi.fn()} />);

      // Fill in title
      const titleInput = screen.getByPlaceholderText('عنوان البحث...');
      fireEvent.input(titleInput, { target: { value: 'دراسة جودة الهواء وأمراض الصدر' } });

      // Attach mock PDF file
      const file = new File(['%PDF-1.4 mock content'], 'sample-study.pdf', { type: 'application/pdf' });
      const fileInput = document.querySelector('input[type="file"]');
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Click save button
      const saveBtn = screen.getByText('حفظ ونشر');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(uploadFileToR2).toHaveBeenCalledTimes(1);
        expect(supabase.from).toHaveBeenCalledWith('publications');
        expect(mockInsert).toHaveBeenCalledTimes(1);
      });

      const payload = mockInsert.mock.calls[0][0][0];
      expect(payload.title_ar).toBe('دراسة جودة الهواء وأمراض الصدر');
      expect(payload.pdf_url).toBe('https://r2.climamedix.org/research/sample-study.pdf');
      expect(payload.created_by).toBe('researcher-1');
    });
  });
});
