import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { ResearchDetailPage } from '../features/research-center/components/ResearchDetailPage';
import { ResearchHubPage } from '../features/research-center/components/ResearchHubPage';
import { ResearchUploadPage } from '../features/research-center/components/ResearchUploadPage';
import { supabase } from '../utils/supabaseClient';
import * as s3Client from '../utils/s3Client';

// Mock s3Client
vi.mock('../utils/s3Client', () => ({
  uploadFileToR2: vi.fn()
}));

// Mock useAuth
const mockUser = { id: 'usr-research-99', email: 'researcher@climamedix.org' };
let mockPermissions = ['write:research', 'view:free_content', 'view:all_courses'];
let mockAuthLoading = false;

vi.mock('../features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    userProfile: { role: 'researcher', full_name: 'Dr. Researcher' },
    hasPermission: vi.fn((perm) => mockPermissions.includes(perm)),
    authLoading: mockAuthLoading
  })
}));

const samplePubs = [
  {
    id: 'pub-1',
    title_ar: 'تأثير درجات الحرارة المرتفعة على أمراض الكلى',
    title_en: 'Impact of High Temperatures on Kidney Disease in MENA',
    authors: 'د. يحيى زوادي، د. أحمد المنصوري',
    abstract_ar: 'تبحث هذه الدراسة الارتباط الوثيق بين الإجهاد الحراري والقصور الكلوي الحاد.',
    abstract_en: 'This study investigates the close correlation between heat stress and acute kidney disease.',
    category: 'health',
    year: '2026',
    pdf_url: 'https://r2.climamedix.org/research/heat_kidney_2026.pdf',
    teaser_permission_key: 'view:public_content',
    full_access_permission_key: 'view:free_content',
    created_at: '2026-03-15T10:00:00Z'
  },
  {
    id: 'pub-2',
    title_ar: 'سياسات التكيف المناخي في النظم الصحية العربية',
    title_en: 'Climate Adaptation Policies in Arab Health Systems',
    authors: 'د. سارة خليل',
    abstract_ar: 'مراجعة شاملة لخطط التكيف الوطنية المنشورة بين 2020 و 2025.',
    abstract_en: 'Comprehensive review of national adaptation plans published between 2020 and 2025.',
    category: 'policy',
    year: '2025',
    pdf_url: 'https://r2.climamedix.org/research/adaptation_policy_doc.docx',
    teaser_permission_key: 'view:public_content',
    full_access_permission_key: 'view:all_courses', // requires paid subscription
    created_at: '2026-02-10T14:30:00Z'
  },
  {
    id: 'pub-3',
    title_ar: 'أطلس الهشاشة المناخية للأوبئة التنفسية',
    title_en: 'Climate Vulnerability Atlas for Respiratory Epidemics',
    authors: 'فريق كلايما ميدكس البحثي',
    abstract_ar: 'بيانات ونماذج مكانية متقدمة لتوقع انتشار الفيروسات التنفسية.',
    abstract_en: null,
    category: 'climate',
    year: '2026',
    pdf_url: 'https://r2.climamedix.org/research/respiratory_atlas.pptx',
    teaser_permission_key: 'view:all_courses', // restricted teaser
    full_access_permission_key: 'view:all_courses',
    created_at: '2026-01-20T08:00:00Z'
  },
  {
    id: 'pub-4',
    title_ar: 'قاعدة بيانات انبعاثات المستشفيات الإقليمية',
    title_en: 'Regional Hospital Emissions Dataset',
    authors: 'مركز الاستدامة الصحية',
    abstract_ar: 'جداول حساب البصمة الكربونية لمؤسسات الرعاية الصحية.',
    abstract_en: 'Carbon footprint accounting spreadsheets for healthcare facilities.',
    category: 'research',
    year: '2024',
    pdf_url: 'https://r2.climamedix.org/research/emissions_data.xlsx',
    teaser_permission_key: 'view:public_content',
    full_access_permission_key: null, // open to anyone
    created_at: '2025-12-01T12:00:00Z'
  },
  {
    id: 'pub-5',
    title_ar: 'تقرير بيئي عام بدون مرفق ملف',
    title_en: 'General Environmental Report Without Attached File',
    authors: 'لجنة البيئة والمجتمع',
    abstract_ar: 'ملخص موجز للنقاشات البيئية العامة.',
    abstract_en: 'Executive summary of public discussions.',
    category: 'all',
    year: '2023',
    pdf_url: null, // No file
    teaser_permission_key: 'view:public_content',
    full_access_permission_key: null,
    created_at: '2025-05-01T09:00:00Z'
  }
];

describe('Research Center, Publications & Two-Tier Security Suite', () => {
  let originalLocation;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    mockPermissions = ['write:research', 'view:free_content', 'view:all_courses'];
    mockAuthLoading = false;
    window.scrollTo = vi.fn();

    originalLocation = window.location;
    delete window.location;
    window.location = {
      search: '?id=pub-1',
      href: 'https://climamedix.org/research-detail?id=pub-1'
    };
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  // =========================================================================
  // 1. RESEARCH DETAIL PAGE (16 tests)
  // =========================================================================
  describe('ResearchDetailPage Component', () => {
    it('shows loading spinner initially while fetching publication', () => {
      // Mock pending supabase promise
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => new Promise(() => {}) // never resolves
          })
        })
      });

      render(<ResearchDetailPage lang="ar" onNavigate={vi.fn()} />);
      expect(screen.getByText('جاري التحميل...')).toBeInTheDocument();
    });

    it('shows loading spinner in English when lang is en', () => {
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => new Promise(() => {})
          })
        })
      });

      render(<ResearchDetailPage lang="en" onNavigate={vi.fn()} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders "البحث غير موجود" when query returns error or null', async () => {
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') })
          })
        })
      });

      render(<ResearchDetailPage lang="ar" onNavigate={vi.fn()} />);
      expect(await screen.findByText('البحث غير موجود')).toBeInTheDocument();
      expect(screen.getByText('العودة للأبحاث')).toBeInTheDocument();
    });

    it('renders "Publication Not Found" in English with Back button', async () => {
      const navMock = vi.fn();
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      });

      render(<ResearchDetailPage lang="en" onNavigate={navMock} />);
      const notFoundTitle = await screen.findByText('Publication Not Found');
      expect(notFoundTitle).toBeInTheDocument();

      const backBtn = screen.getByText('Back to Research');
      fireEvent.click(backBtn);
      expect(navMock).toHaveBeenCalledWith('research');
    });

    it('renders publication details in Arabic', async () => {
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({ data: samplePubs[0], error: null })
          })
        })
      });

      render(<ResearchDetailPage lang="ar" onNavigate={vi.fn()} />);
      expect(await screen.findByText('تأثير درجات الحرارة المرتفعة على أمراض الكلى')).toBeInTheDocument();
      expect(screen.getByText('Impact of High Temperatures on Kidney Disease in MENA')).toBeInTheDocument();
      expect(screen.getByText('د. يحيى زوادي، د. أحمد المنصوري')).toBeInTheDocument();
      expect(screen.getByText('تبحث هذه الدراسة الارتباط الوثيق بين الإجهاد الحراري والقصور الكلوي الحاد.')).toBeInTheDocument();
    });

    it('renders publication details in English', async () => {
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({ data: samplePubs[0], error: null })
          })
        })
      });

      render(<ResearchDetailPage lang="en" onNavigate={vi.fn()} />);
      expect(await screen.findByText('Impact of High Temperatures on Kidney Disease in MENA')).toBeInTheDocument();
      expect(screen.getByText('Authors')).toBeInTheDocument();
      expect(screen.getByText('Abstract')).toBeInTheDocument();
    });

    it('renders collapsible alternate abstract in Arabic mode', async () => {
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({ data: samplePubs[0], error: null })
          })
        })
      });

      render(<ResearchDetailPage lang="ar" onNavigate={vi.fn()} />);
      expect(await screen.findByText('عرض الملخص بالإنجليزية')).toBeInTheDocument();
    });

    it('renders collapsible alternate abstract in English mode', async () => {
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({ data: samplePubs[0], error: null })
          })
        })
      });

      render(<ResearchDetailPage lang="en" onNavigate={vi.fn()} />);
      expect(await screen.findByText('Show Arabic abstract')).toBeInTheDocument();
    });

    it('identifies PDF file extension correctly in download card', async () => {
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({ data: samplePubs[0], error: null })
          })
        })
      });

      render(<ResearchDetailPage lang="ar" onNavigate={vi.fn()} />);
      expect(await screen.findByText('PDF')).toBeInTheDocument();
      expect(screen.getByText('تحميل')).toBeInTheDocument();
    });

    it('identifies Word file extension (.docx) correctly in download card', async () => {
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({ data: samplePubs[1], error: null })
          })
        })
      });

      render(<ResearchDetailPage lang="ar" onNavigate={vi.fn()} />);
      expect(await screen.findByText('Word')).toBeInTheDocument();
    });

    it('identifies PowerPoint file extension (.pptx) correctly in download card', async () => {
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({ data: samplePubs[2], error: null })
          })
        })
      });

      render(<ResearchDetailPage lang="ar" onNavigate={vi.fn()} />);
      expect(await screen.findByText('PowerPoint')).toBeInTheDocument();
    });

    it('identifies Excel file extension (.xlsx) correctly in download card', async () => {
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({ data: samplePubs[3], error: null })
          })
        })
      });

      render(<ResearchDetailPage lang="ar" onNavigate={vi.fn()} />);
      expect(await screen.findByText('Excel')).toBeInTheDocument();
    });

    it('renders active download link when user satisfies full_access_permission_key', async () => {
      mockPermissions = ['view:free_content'];
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({ data: samplePubs[0], error: null })
          })
        })
      });

      render(<ResearchDetailPage lang="ar" onNavigate={vi.fn()} />);
      const downloadLink = await screen.findByText('تحميل');
      expect(downloadLink.closest('a')).toHaveAttribute('href', samplePubs[0].pdf_url);
    });

    it('renders disabled "مطلوب ترقية الحساب" when user lacks full_access_permission_key', async () => {
      mockPermissions = []; // Has no permissions
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({ data: samplePubs[1], error: null })
          })
        })
      });

      render(<ResearchDetailPage lang="ar" onNavigate={vi.fn()} />);
      expect(await screen.findByText('مطلوب ترقية الحساب')).toBeInTheDocument();
    });

    it('renders disabled "Upgrade to Download" in English mode when unauthorized', async () => {
      mockPermissions = [];
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({ data: samplePubs[1], error: null })
          })
        })
      });

      render(<ResearchDetailPage lang="en" onNavigate={vi.fn()} />);
      expect(await screen.findByText('Upgrade to Download')).toBeInTheDocument();
    });

    it('back button triggers onNavigate with "research"', async () => {
      const navMock = vi.fn();
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({ data: samplePubs[0], error: null })
          })
        })
      });

      render(<ResearchDetailPage lang="ar" onNavigate={navMock} />);
      const backBtn = await screen.findByText('جميع الأبحاث');
      fireEvent.click(backBtn);
      expect(navMock).toHaveBeenCalledWith('research');
    });
  });

  // =========================================================================
  // 2. RESEARCH HUB PAGE (17 tests)
  // =========================================================================
  describe('ResearchHubPage Component: Directory, Cards & Permissions', () => {
    it('shows loading indicator while fetching publications', () => {
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          order: () => new Promise(() => {})
        })
      });

      render(<ResearchHubPage lang="ar" onNavigate={vi.fn()} />);
      expect(screen.getByText('جاري التحميل...')).toBeInTheDocument();
    });

    it('shows empty state when publications table has 0 rows in Arabic', async () => {
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          order: vi.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      render(<ResearchHubPage lang="ar" onNavigate={vi.fn()} />);
      expect(await screen.findByText('لا توجد أبحاث منشورة حالياً.')).toBeInTheDocument();
    });

    it('shows empty state in English when publications table has 0 rows', async () => {
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          order: vi.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      render(<ResearchHubPage lang="en" onNavigate={vi.fn()} />);
      expect(await screen.findByText('No research published yet.')).toBeInTheDocument();
    });

    it('renders "+ رفع بحث جديد" button when user has "write:research" in Arabic', async () => {
      mockPermissions = ['write:research'];
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          order: vi.fn().mockResolvedValue({ data: samplePubs, error: null })
        })
      });

      render(<ResearchHubPage lang="ar" onNavigate={vi.fn()} />);
      expect(await screen.findByText('رفع بحث جديد')).toBeInTheDocument();
    });

    it('renders "+ Upload Research" button in English when user has "write:research"', async () => {
      mockPermissions = ['write:research'];
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          order: vi.fn().mockResolvedValue({ data: samplePubs, error: null })
        })
      });

      render(<ResearchHubPage lang="en" onNavigate={vi.fn()} />);
      expect(await screen.findByText('Upload Research')).toBeInTheDocument();
    });

    it('hides upload button when user lacks "write:research"', async () => {
      mockPermissions = [];
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          order: vi.fn().mockResolvedValue({ data: samplePubs, error: null })
        })
      });

      render(<ResearchHubPage lang="ar" onNavigate={vi.fn()} />);
      await screen.findByText('تأثير درجات الحرارة المرتفعة على أمراض الكلى');
      expect(screen.queryByText('رفع بحث جديد')).not.toBeInTheDocument();
      expect(screen.queryByText('Upload Research')).not.toBeInTheDocument();
    });

    it('clicking upload research button calls onNavigate with "research-upload"', async () => {
      const navMock = vi.fn();
      mockPermissions = ['write:research'];
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          order: vi.fn().mockResolvedValue({ data: samplePubs, error: null })
        })
      });

      render(<ResearchHubPage lang="ar" onNavigate={navMock} />);
      const uploadBtn = await screen.findByText('رفع بحث جديد');
      fireEvent.click(uploadBtn);
      expect(navMock).toHaveBeenCalledWith('research-upload');
    });

    it('filters out publications where teaser_permission_key is not met by user', async () => {
      // User only has public access, does not have 'view:all_courses'
      mockPermissions = ['view:free_content'];
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          order: vi.fn().mockResolvedValue({ data: samplePubs, error: null })
        })
      });

      render(<ResearchHubPage lang="ar" onNavigate={vi.fn()} />);
      expect(await screen.findByText('تأثير درجات الحرارة المرتفعة على أمراض الكلى')).toBeInTheDocument();
      // pub-3 requires 'view:all_courses' for teaser, so it must not be rendered
      expect(screen.queryByText('أطلس الهشاشة المناخية للأوبئة التنفسية')).not.toBeInTheDocument();
    });

    it('shows restricted teaser publication when user has the required permission', async () => {
      mockPermissions = ['view:all_courses'];
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          order: vi.fn().mockResolvedValue({ data: samplePubs, error: null })
        })
      });

      render(<ResearchHubPage lang="ar" onNavigate={vi.fn()} />);
      expect(await screen.findByText('أطلس الهشاشة المناخية للأوبئة التنفسية')).toBeInTheDocument();
    });

    it('renders category badge translated into Arabic', async () => {
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          order: vi.fn().mockResolvedValue({ data: [samplePubs[0]], error: null })
        })
      });

      render(<ResearchHubPage lang="ar" onNavigate={vi.fn()} />);
      expect(await screen.findByText('صحة')).toBeInTheDocument();
    });

    it('renders category badge translated into English', async () => {
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          order: vi.fn().mockResolvedValue({ data: [samplePubs[0]], error: null })
        })
      });

      render(<ResearchHubPage lang="en" onNavigate={vi.fn()} />);
      expect(await screen.findByText('Health')).toBeInTheDocument();
    });

    it('renders "لا يوجد ملف" / "No file" when publication has null pdf_url', async () => {
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          order: vi.fn().mockResolvedValue({ data: [samplePubs[4]], error: null })
        })
      });

      const { rerender } = render(<ResearchHubPage lang="ar" onNavigate={vi.fn()} />);
      expect(await screen.findByText('لا يوجد ملف')).toBeInTheDocument();

      rerender(<ResearchHubPage lang="en" onNavigate={vi.fn()} />);
      expect(screen.getByText('No file')).toBeInTheDocument();
    });

    it('renders download button with PDF label when authorized', async () => {
      mockPermissions = ['view:free_content'];
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          order: vi.fn().mockResolvedValue({ data: [samplePubs[0]], error: null })
        })
      });

      render(<ResearchHubPage lang="ar" onNavigate={vi.fn()} />);
      expect(await screen.findByText(/PDF.*تحميل/)).toBeInTheDocument();
    });

    it('renders download button with Word label for .docx files', async () => {
      mockPermissions = ['view:all_courses'];
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          order: vi.fn().mockResolvedValue({ data: [samplePubs[1]], error: null })
        })
      });

      render(<ResearchHubPage lang="ar" onNavigate={vi.fn()} />);
      expect(await screen.findByText(/Word.*تحميل/)).toBeInTheDocument();
    });

    it('renders "Upgrade to Download" on card when unauthorized', async () => {
      mockPermissions = []; // No permissions
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          order: vi.fn().mockResolvedValue({ data: [samplePubs[1]], error: null })
        })
      });

      render(<ResearchHubPage lang="en" onNavigate={vi.fn()} />);
      expect(await screen.findByText('Upgrade to Download')).toBeInTheDocument();
    });

    it('clicking card navigates to "research-detail" with publication ID', async () => {
      const navMock = vi.fn();
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          order: vi.fn().mockResolvedValue({ data: [samplePubs[0]], error: null })
        })
      });

      render(<ResearchHubPage lang="ar" onNavigate={navMock} />);
      const cardTitle = await screen.findByText('تأثير درجات الحرارة المرتفعة على أمراض الكلى');
      fireEvent.click(cardTitle.closest('.rhp-card'));
      expect(navMock).toHaveBeenCalledWith('research-detail', 'pub-1');
    });

    it('clicking download button does not trigger card navigation', async () => {
      const navMock = vi.fn();
      mockPermissions = ['view:free_content'];
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          order: vi.fn().mockResolvedValue({ data: [samplePubs[0]], error: null })
        })
      });

      render(<ResearchHubPage lang="ar" onNavigate={navMock} />);
      const downloadBtn = await screen.findByText(/PDF.*تحميل/);
      fireEvent.click(downloadBtn);
      expect(navMock).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 3. RESEARCH UPLOAD PAGE (17 tests)
  // =========================================================================
  describe('ResearchUploadPage Component: Permissions, R2 & Supabase Insertion', () => {
    it('shows checking permissions state when authLoading is true', () => {
      mockAuthLoading = true;
      render(<ResearchUploadPage lang="ar" onNavigate={vi.fn()} />);
      expect(screen.getByText('جاري التحقق من الصلاحيات...')).toBeInTheDocument();
    });

    it('shows checking permissions state in English when authLoading is true', () => {
      mockAuthLoading = true;
      render(<ResearchUploadPage lang="en" onNavigate={vi.fn()} />);
      expect(screen.getByText('Checking Permissions...')).toBeInTheDocument();
    });

    it('shows "غير مصرح بالوصول" / "Access Denied" if user lacks "write:research"', () => {
      mockPermissions = [];
      render(<ResearchUploadPage lang="ar" onNavigate={vi.fn()} />);
      expect(screen.getByText('غير مصرح بالوصول')).toBeInTheDocument();
      expect(screen.getByText('ليس لديك صلاحية لرفع الأبحاث.')).toBeInTheDocument();
    });

    it('shows "Access Denied" in English if user lacks "write:research"', () => {
      mockPermissions = [];
      render(<ResearchUploadPage lang="en" onNavigate={vi.fn()} />);
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText('You do not have permission to upload research.')).toBeInTheDocument();
    });

    it('clicking back button in Access Denied view calls onNavigate with "home"', () => {
      const navMock = vi.fn();
      mockPermissions = [];
      render(<ResearchUploadPage lang="ar" onNavigate={navMock} />);
      const backBtn = screen.getByText('العودة');
      fireEvent.click(backBtn);
      expect(navMock).toHaveBeenCalledWith('home');
    });

    it('renders form fields when user has "write:research" permission', () => {
      mockPermissions = ['write:research'];
      render(<ResearchUploadPage lang="ar" onNavigate={vi.fn()} />);
      expect(screen.getByText('إضافة بحث أو مستند جديد')).toBeInTheDocument();
      expect(screen.getByText('العنوان بالعربية *')).toBeInTheDocument();
      expect(screen.getByText('العنوان بالإنجليزية')).toBeInTheDocument();
      expect(screen.getByText('المؤلفون')).toBeInTheDocument();
      expect(screen.getByText('الملخص (عربي)')).toBeInTheDocument();
      expect(screen.getByText('الملخص (إنجليزي)')).toBeInTheDocument();
      expect(screen.getByText('ملف البحث')).toBeInTheDocument();
      expect(screen.getByText('صلاحيات الوصول')).toBeInTheDocument();
      expect(screen.getByText('حفظ ونشر')).toBeInTheDocument();
    });

    it('renders form labels in English when lang is en', () => {
      mockPermissions = ['write:research'];
      render(<ResearchUploadPage lang="en" onNavigate={vi.fn()} />);
      expect(screen.getByText('Upload New Research or Document')).toBeInTheDocument();
      expect(screen.getByText('Title (Arabic) *')).toBeInTheDocument();
      expect(screen.getByText('Title (English)')).toBeInTheDocument();
      expect(screen.getByText('Authors')).toBeInTheDocument();
      expect(screen.getByText('Abstract (Arabic)')).toBeInTheDocument();
      expect(screen.getByText('Abstract (English)')).toBeInTheDocument();
      expect(screen.getByText('Research File')).toBeInTheDocument();
      expect(screen.getByText('Access Permissions')).toBeInTheDocument();
      expect(screen.getByText('Save & Publish')).toBeInTheDocument();
    });

    it('validates required Arabic title on submission', async () => {
      mockPermissions = ['write:research'];
      render(<ResearchUploadPage lang="ar" onNavigate={vi.fn()} />);
      const saveBtn = screen.getByText('حفظ ونشر');
      fireEvent.click(saveBtn);
      expect(await screen.findByText('العنوان مطلوب')).toBeInTheDocument();
      expect(s3Client.uploadFileToR2).not.toHaveBeenCalled();
    });

    it('validates required title in English mode', async () => {
      mockPermissions = ['write:research'];
      render(<ResearchUploadPage lang="en" onNavigate={vi.fn()} />);
      const saveBtn = screen.getByText('Save & Publish');
      fireEvent.click(saveBtn);
      expect(await screen.findByText('Title is required')).toBeInTheDocument();
      expect(s3Client.uploadFileToR2).not.toHaveBeenCalled();
    });

    it('validates required attached research file when title is provided', async () => {
      mockPermissions = ['write:research'];
      render(<ResearchUploadPage lang="ar" onNavigate={vi.fn()} />);

      const titleInput = screen.getByPlaceholderText('عنوان البحث...');
      fireEvent.input(titleInput, { target: { value: 'بحث بيئي استثنائي' } });

      const saveBtn = screen.getByText('حفظ ونشر');
      fireEvent.click(saveBtn);

      expect(await screen.findByText('يجب إرفاق ملف البحث')).toBeInTheDocument();
      expect(s3Client.uploadFileToR2).not.toHaveBeenCalled();
    });

    it('attaches file via file input and displays file name and size', () => {
      mockPermissions = ['write:research'];
      const { container } = render(<ResearchUploadPage lang="ar" onNavigate={vi.fn()} />);

      const file = new File(['mock content in pdf'], 'climate_report.pdf', { type: 'application/pdf' });
      const hiddenInput = container.querySelector('input[type="file"]');

      fireEvent.change(hiddenInput, { target: { files: [file] } });

      expect(screen.getByText('climate_report.pdf')).toBeInTheDocument();
      expect(screen.getByText('إزالة')).toBeInTheDocument();
    });

    it('removes attached file when clicking "إزالة" / "Remove"', () => {
      mockPermissions = ['write:research'];
      const { container } = render(<ResearchUploadPage lang="ar" onNavigate={vi.fn()} />);

      const file = new File(['mock'], 'paper.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const hiddenInput = container.querySelector('input[type="file"]');
      fireEvent.change(hiddenInput, { target: { files: [file] } });

      expect(screen.getByText('paper.docx')).toBeInTheDocument();
      const removeBtn = screen.getByText('إزالة');
      fireEvent.click(removeBtn);

      expect(screen.queryByText('paper.docx')).not.toBeInTheDocument();
      expect(screen.getByText('اضغط لرفع الملف')).toBeInTheDocument();
    });

    it('successfully uploads file to R2 and inserts record into Supabase', async () => {
      mockPermissions = ['write:research'];
      s3Client.uploadFileToR2.mockResolvedValueOnce('https://r2.climamedix.org/research/paper_123.pdf');

      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from = vi.fn().mockReturnValue({ insert: mockInsert });

      const { container } = render(<ResearchUploadPage lang="ar" onNavigate={vi.fn()} />);

      const titleInput = screen.getByPlaceholderText('عنوان البحث...');
      fireEvent.input(titleInput, { target: { value: 'دراسة تلوث الهواء في المدن' } });

      const file = new File(['pdf data'], 'air_pollution.pdf', { type: 'application/pdf' });
      const hiddenInput = container.querySelector('input[type="file"]');
      fireEvent.change(hiddenInput, { target: { files: [file] } });

      const saveBtn = screen.getByText('حفظ ونشر');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(s3Client.uploadFileToR2).toHaveBeenCalledWith(file, 'research_publications');
        expect(supabase.from).toHaveBeenCalledWith('publications');
        expect(mockInsert).toHaveBeenCalledWith([
          expect.objectContaining({
            title_ar: 'دراسة تلوث الهواء في المدن',
            pdf_url: 'https://r2.climamedix.org/research/paper_123.pdf',
            created_by: 'usr-research-99'
          })
        ]);
        expect(screen.getByText('تم رفع البحث بنجاح')).toBeInTheDocument();
      });
    });

    it('displays success message in English when lang is en', async () => {
      mockPermissions = ['write:research'];
      s3Client.uploadFileToR2.mockResolvedValueOnce('https://r2.climamedix.org/research/paper_123.pdf');
      supabase.from = vi.fn().mockReturnValue({ insert: vi.fn().mockResolvedValue({ error: null }) });

      const { container } = render(<ResearchUploadPage lang="en" onNavigate={vi.fn()} />);

      const titleInput = screen.getByPlaceholderText('Research Title...');
      fireEvent.input(titleInput, { target: { value: 'English Study Title' } });

      const file = new File(['pdf data'], 'study.pdf', { type: 'application/pdf' });
      const hiddenInput = container.querySelector('input[type="file"]');
      fireEvent.change(hiddenInput, { target: { files: [file] } });

      const saveBtn = screen.getByText('Save & Publish');
      fireEvent.click(saveBtn);

      expect(await screen.findByText('Research uploaded successfully')).toBeInTheDocument();
    });

    it('handles R2 upload failure gracefully and renders error banner', async () => {
      mockPermissions = ['write:research'];
      s3Client.uploadFileToR2.mockRejectedValueOnce(new Error('Cloudflare S3 Timeout'));

      const { container } = render(<ResearchUploadPage lang="ar" onNavigate={vi.fn()} />);

      const titleInput = screen.getByPlaceholderText('عنوان البحث...');
      fireEvent.input(titleInput, { target: { value: 'دراسة مناخية' } });

      const file = new File(['pdf data'], 'climate.pdf', { type: 'application/pdf' });
      const hiddenInput = container.querySelector('input[type="file"]');
      fireEvent.change(hiddenInput, { target: { files: [file] } });

      const saveBtn = screen.getByText('حفظ ونشر');
      fireEvent.click(saveBtn);

      expect(await screen.findByText('Cloudflare S3 Timeout')).toBeInTheDocument();
    });

    it('handles Supabase insertion failure gracefully and renders error banner', async () => {
      mockPermissions = ['write:research'];
      s3Client.uploadFileToR2.mockResolvedValueOnce('https://r2.climamedix.org/research/paper.pdf');
      supabase.from = vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: new Error('Postgres schema error') })
      });

      const { container } = render(<ResearchUploadPage lang="ar" onNavigate={vi.fn()} />);

      const titleInput = screen.getByPlaceholderText('عنوان البحث...');
      fireEvent.input(titleInput, { target: { value: 'دراسة مناخية' } });

      const file = new File(['pdf data'], 'climate.pdf', { type: 'application/pdf' });
      const hiddenInput = container.querySelector('input[type="file"]');
      fireEvent.change(hiddenInput, { target: { files: [file] } });

      const saveBtn = screen.getByText('حفظ ونشر');
      fireEvent.click(saveBtn);

      expect(await screen.findByText('Postgres schema error')).toBeInTheDocument();
    });

    it('clicking back button navigates to "research"', () => {
      const navMock = vi.fn();
      mockPermissions = ['write:research'];
      render(<ResearchUploadPage lang="ar" onNavigate={navMock} />);

      const backBtn = screen.getByText('رجوع إلى الأبحاث');
      fireEvent.click(backBtn);

      expect(navMock).toHaveBeenCalledWith('research');
    });
  });
});
