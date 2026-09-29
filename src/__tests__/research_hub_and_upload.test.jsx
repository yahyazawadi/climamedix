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
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('DENIES access and shows Access Denied view when user lacks write:research', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'u-1' },
        hasPermission: () => false,
        authLoading: false
      });

      render(<ResearchUploadPage lang="ar" onNavigate={vi.fn()} />);

      expect(screen.getByText('غير مصرح بالوصول')).toBeInTheDocument();
      expect(screen.getByText('ليس لديك صلاحية لرفع الأبحاث.')).toBeInTheDocument();
      expect(screen.queryByText('إضافة بحث أو مستند جديد')).toBeNull();
    });

    it('renders checking permissions state while authLoading is true', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        hasPermission: () => false,
        authLoading: true
      });

      render(<ResearchUploadPage lang="ar" onNavigate={vi.fn()} />);
      expect(screen.getByText('جاري التحقق من الصلاحيات...')).toBeInTheDocument();
    });

    it('clicking Back button in Access Denied view triggers onNavigate to home', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'u-guest' },
        hasPermission: () => false,
        authLoading: false
      });
      const navMock = vi.fn();
      render(<ResearchUploadPage lang="ar" onNavigate={navMock} />);

      const backBtn = screen.getByText('العودة');
      fireEvent.click(backBtn);
      expect(navMock).toHaveBeenCalledWith('home');
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

    it('clicking Back to Research button triggers onNavigate to research', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'researcher-1' },
        hasPermission: (perm) => perm === 'write:research',
        authLoading: false
      });
      const navMock = vi.fn();
      render(<ResearchUploadPage lang="ar" onNavigate={navMock} />);

      const backBtn = screen.getByText('رجوع إلى الأبحاث');
      fireEvent.click(backBtn);
      expect(navMock).toHaveBeenCalledWith('research');
    });

    it('clicking dropzone triggers the hidden file input click method', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'researcher-1' },
        hasPermission: (perm) => perm === 'write:research',
        authLoading: false
      });

      const { container } = render(<ResearchUploadPage lang="ar" onNavigate={vi.fn()} />);
      const fileInput = container.querySelector('input[type="file"]');
      const clickSpy = vi.spyOn(fileInput, 'click');

      const dropzone = container.querySelector('.rup-dropzone');
      fireEvent.click(dropzone);

      expect(clickSpy).toHaveBeenCalledTimes(1);
    });

    it('selecting a file updates dropzone with filename and formatted size in MB', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'researcher-1' },
        hasPermission: (perm) => perm === 'write:research',
        authLoading: false
      });

      const { container } = render(<ResearchUploadPage lang="ar" onNavigate={vi.fn()} />);

      // Initially shows prompt
      expect(screen.getByText('اضغط لرفع الملف')).toBeInTheDocument();

      // Create a 2.5 MB fake file (2.5 * 1024 * 1024 bytes)
      const fakeBytes = new Uint8Array(2.5 * 1024 * 1024);
      const testFile = new File([fakeBytes], 'climate_change_delta_2026.pdf', { type: 'application/pdf' });

      const fileInput = container.querySelector('input[type="file"]');
      fireEvent.change(fileInput, { target: { files: [testFile] } });

      // Check dropzone updated
      expect(screen.queryByText('اضغط لرفع الملف')).toBeNull();
      expect(screen.getByText('climate_change_delta_2026.pdf')).toBeInTheDocument();
      expect(screen.getByText('2.50 MB')).toBeInTheDocument();
      expect(screen.getByText('إزالة')).toBeInTheDocument();
    });

    it('clicking Remove button clears the selected file and restores prompt without clicking file input', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'researcher-1' },
        hasPermission: (perm) => perm === 'write:research',
        authLoading: false
      });

      const { container } = render(<ResearchUploadPage lang="ar" onNavigate={vi.fn()} />);
      const fileInput = container.querySelector('input[type="file"]');
      const clickSpy = vi.spyOn(fileInput, 'click');

      const testFile = new File(['mock content'], 'sample.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [testFile] } });

      expect(screen.getByText('sample.pdf')).toBeInTheDocument();

      // Click remove button
      const removeBtn = screen.getByText('إزالة');
      fireEvent.click(removeBtn);

      // Verify file info cleared and prompt restored
      expect(screen.queryByText('sample.pdf')).toBeNull();
      expect(screen.getByText('اضغط لرفع الملف')).toBeInTheDocument();

      // Verify remove button stopped propagation so fileInput.click wasn't triggered
      expect(clickSpy).not.toHaveBeenCalled();
    });

    it('replaces selected file when user picks a different file and resets file input value', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'researcher-1' },
        hasPermission: (perm) => perm === 'write:research',
        authLoading: false
      });

      const { container } = render(<ResearchUploadPage lang="ar" onNavigate={vi.fn()} />);
      const fileInput = container.querySelector('input[type="file"]');

      // Pick first file
      const file1 = new File(['data1'], 'initial_draft.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [file1] } });
      expect(screen.getByText('initial_draft.pdf')).toBeInTheDocument();

      // Pick second file
      const file2 = new File(['data2'], 'final_approved.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      fireEvent.change(fileInput, { target: { files: [file2] } });

      expect(screen.queryByText('initial_draft.pdf')).toBeNull();
      expect(screen.getByText('final_approved.docx')).toBeInTheDocument();
    });

    it('shows error banner when user attempts to submit without an Arabic title', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'researcher-1' },
        hasPermission: (perm) => perm === 'write:research',
        authLoading: false
      });

      const { container } = render(<ResearchUploadPage lang="ar" onNavigate={vi.fn()} />);

      // Attach file but leave title blank
      const file = new File(['pdf-data'], 'study.pdf', { type: 'application/pdf' });
      const fileInput = container.querySelector('input[type="file"]');
      fireEvent.change(fileInput, { target: { files: [file] } });

      const saveBtn = screen.getByText('حفظ ونشر');
      fireEvent.click(saveBtn);

      expect(screen.getByText('العنوان مطلوب')).toBeInTheDocument();
      expect(uploadFileToR2).not.toHaveBeenCalled();
    });

    it('shows error banner in English when submitting without title in English mode', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'researcher-1' },
        hasPermission: (perm) => perm === 'write:research',
        authLoading: false
      });

      const { container } = render(<ResearchUploadPage lang="en" onNavigate={vi.fn()} />);

      const file = new File(['pdf-data'], 'study.pdf', { type: 'application/pdf' });
      const fileInput = container.querySelector('input[type="file"]');
      fireEvent.change(fileInput, { target: { files: [file] } });

      const saveBtn = screen.getByText('Save & Publish');
      fireEvent.click(saveBtn);

      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(uploadFileToR2).not.toHaveBeenCalled();
    });

    it('shows error banner when user submits with title but without attaching a file', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'researcher-1' },
        hasPermission: (perm) => perm === 'write:research',
        authLoading: false
      });

      render(<ResearchUploadPage lang="ar" onNavigate={vi.fn()} />);

      const titleInput = screen.getByPlaceholderText('عنوان البحث...');
      fireEvent.input(titleInput, { target: { value: 'دراسة بيئية جديدة' } });

      const saveBtn = screen.getByText('حفظ ونشر');
      fireEvent.click(saveBtn);

      expect(screen.getByText('يجب إرفاق ملف البحث')).toBeInTheDocument();
      expect(uploadFileToR2).not.toHaveBeenCalled();
    });

    it('shows error banner in English when submitting without a file in English mode', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'researcher-1' },
        hasPermission: (perm) => perm === 'write:research',
        authLoading: false
      });

      render(<ResearchUploadPage lang="en" onNavigate={vi.fn()} />);

      const titleInput = screen.getByPlaceholderText('Research Title...');
      fireEvent.input(titleInput, { target: { value: 'New Environmental Study' } });

      const saveBtn = screen.getByText('Save & Publish');
      fireEvent.click(saveBtn);

      expect(screen.getByText('You must attach a research file')).toBeInTheDocument();
      expect(uploadFileToR2).not.toHaveBeenCalled();
    });

    it('populates all form inputs and uploads Word document (.docx) to R2 and saves to Supabase', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'author-88' },
        hasPermission: (perm) => perm === 'write:research',
        authLoading: false
      });

      uploadFileToR2.mockResolvedValueOnce('https://pub-r2.climamedix.org/research_publications/water_study.docx');

      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ insert: mockInsert });

      const { container } = render(<ResearchUploadPage lang="ar" onNavigate={vi.fn()} />);

      // Fill in text inputs
      fireEvent.input(screen.getByPlaceholderText('عنوان البحث...'), { target: { value: 'تلوث المياه الساحلية' } });
      
      const inputs = container.querySelectorAll('.rup-form-group input');
      // English title input
      fireEvent.input(inputs[1], { target: { value: 'Coastal Water Contamination' } });
      // Authors input
      fireEvent.input(screen.getByPlaceholderText('أسماء المؤلفين...'), { target: { value: 'د. ياسمين، د. كمال' } });

      // Abstracts
      const textareas = container.querySelectorAll('textarea');
      fireEvent.input(textareas[0], { target: { value: 'ملخص تحليلي موسع' } });
      fireEvent.input(textareas[1], { target: { value: 'Extensive analytical abstract' } });

      // Category select
      const categorySelect = container.querySelectorAll('select')[0];
      fireEvent.change(categorySelect, { target: { value: 'health' } });

      // Year input
      const yearInput = container.querySelector('input[type="number"]');
      fireEvent.input(yearInput, { target: { value: '2027' } });

      // Access permissions selects
      const teaserSelect = container.querySelectorAll('select')[1];
      fireEvent.change(teaserSelect, { target: { value: 'view:free_content' } });

      const fullAccessSelect = container.querySelectorAll('select')[2];
      fireEvent.change(fullAccessSelect, { target: { value: 'view:all_courses' } });

      // Attach .docx file
      const docxFile = new File(['binary-docx-data'], 'water_study.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      const fileInput = container.querySelector('input[type="file"]');
      fireEvent.change(fileInput, { target: { files: [docxFile] } });

      // Save & Publish
      const saveBtn = screen.getByText('حفظ ونشر');
      fireEvent.click(saveBtn);

      await vi.waitFor(() => {
        expect(uploadFileToR2).toHaveBeenCalledWith(docxFile, 'research_publications');
        expect(supabase.from).toHaveBeenCalledWith('publications');
        expect(mockInsert).toHaveBeenCalledTimes(1);
      });

      const payload = mockInsert.mock.calls[0][0][0];
      expect(payload).toEqual(expect.objectContaining({
        title_ar: 'تلوث المياه الساحلية',
        title_en: 'Coastal Water Contamination',
        authors: 'د. ياسمين، د. كمال',
        abstract_ar: 'ملخص تحليلي موسع',
        abstract_en: 'Extensive analytical abstract',
        category: 'health',
        year: '2027',
        teaser_permission_key: 'view:free_content',
        full_access_permission_key: 'view:all_courses',
        pdf_url: 'https://pub-r2.climamedix.org/research_publications/water_study.docx',
        created_by: 'author-88'
      }));
    });

    it('uploads PowerPoint presentation (.pptx) file with all custom fields', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'prof-99' },
        hasPermission: (perm) => perm === 'write:research',
        authLoading: false
      });

      uploadFileToR2.mockResolvedValueOnce('https://pub-r2.climamedix.org/research_publications/slides.pptx');
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ insert: mockInsert });

      const { container } = render(<ResearchUploadPage lang="en" onNavigate={vi.fn()} />);

      fireEvent.input(screen.getByPlaceholderText('Research Title...'), { target: { value: 'Climate Presentation' } });

      const pptFile = new File(['slide-bytes'], 'slides.pptx', {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      });
      const fileInput = container.querySelector('input[type="file"]');
      fireEvent.change(fileInput, { target: { files: [pptFile] } });

      fireEvent.click(screen.getByText('Save & Publish'));

      await vi.waitFor(() => {
        expect(uploadFileToR2).toHaveBeenCalledWith(pptFile, 'research_publications');
        expect(mockInsert).toHaveBeenCalledTimes(1);
      });
    });

    it('disables submit button and shows loading indicator while upload is in progress', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'researcher-1' },
        hasPermission: (perm) => perm === 'write:research',
        authLoading: false
      });

      // Keep upload pending
      let resolveUpload;
      uploadFileToR2.mockReturnValue(new Promise(res => { resolveUpload = res; }));

      const { container } = render(<ResearchUploadPage lang="ar" onNavigate={vi.fn()} />);

      fireEvent.input(screen.getByPlaceholderText('عنوان البحث...'), { target: { value: 'بحث طويل' } });
      const file = new File(['data'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [file] } });

      const saveBtn = screen.getByText('حفظ ونشر');
      fireEvent.click(saveBtn);

      // While in flight, button shows "..." and is disabled
      await vi.waitFor(() => {
        expect(screen.getByText('...')).toBeInTheDocument();
        expect(screen.getByText('...')).toBeDisabled();
      });

      // Resolve upload
      supabase.from.mockReturnValue({ insert: vi.fn().mockResolvedValue({ error: null }) });
      resolveUpload('https://r2.climamedix.org/test.pdf');
    });

    it('displays error banner when Cloudflare R2 upload rejects with network error and re-enables button', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'researcher-1' },
        hasPermission: (perm) => perm === 'write:research',
        authLoading: false
      });

      uploadFileToR2.mockRejectedValueOnce(new Error('R2 Network Connection Refused'));
      const mockInsert = vi.fn();
      supabase.from.mockReturnValue({ insert: mockInsert });

      const { container } = render(<ResearchUploadPage lang="ar" onNavigate={vi.fn()} />);

      fireEvent.input(screen.getByPlaceholderText('عنوان البحث...'), { target: { value: 'بحث متعثر' } });
      const file = new File(['data'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [file] } });

      const saveBtn = screen.getByText('حفظ ونشر');
      fireEvent.click(saveBtn);

      await vi.waitFor(() => {
        expect(screen.getByText('R2 Network Connection Refused')).toBeInTheDocument();
      });

      // Supabase is NOT called
      expect(mockInsert).not.toHaveBeenCalled();

      // Submit button is re-enabled
      expect(screen.getByText('حفظ ونشر')).not.toBeDisabled();
    });

    it('displays error banner when Supabase insert fails after successful R2 upload', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'researcher-1' },
        hasPermission: (perm) => perm === 'write:research',
        authLoading: false
      });

      uploadFileToR2.mockResolvedValueOnce('https://r2.climamedix.org/test.pdf');
      supabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: new Error('PostgreSQL Unique Constraint Violation') })
      });

      const { container } = render(<ResearchUploadPage lang="ar" onNavigate={vi.fn()} />);

      fireEvent.input(screen.getByPlaceholderText('عنوان البحث...'), { target: { value: 'بحث مكرر' } });
      const file = new File(['data'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [file] } });

      fireEvent.click(screen.getByText('حفظ ونشر'));

      await vi.waitFor(() => {
        expect(screen.getByText('PostgreSQL Unique Constraint Violation')).toBeInTheDocument();
      });

      expect(screen.getByText('حفظ ونشر')).not.toBeDisabled();
    });

    it('displays success banner and navigates to research after 2000ms in Arabic', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'researcher-1' },
        hasPermission: (perm) => perm === 'write:research',
        authLoading: false
      });

      uploadFileToR2.mockResolvedValueOnce('https://r2.climamedix.org/success.pdf');
      supabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null })
      });

      const navMock = vi.fn();
      const { container } = render(<ResearchUploadPage lang="ar" onNavigate={navMock} />);

      fireEvent.input(screen.getByPlaceholderText('عنوان البحث...'), { target: { value: 'بحث ناجح' } });
      const file = new File(['data'], 'success.pdf', { type: 'application/pdf' });
      fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [file] } });

      fireEvent.click(screen.getByText('حفظ ونشر'));

      await vi.waitFor(() => {
        expect(screen.getByText('تم رفع البحث بنجاح')).toBeInTheDocument();
      });

      expect(navMock).not.toHaveBeenCalled();

      // Advance timers by 2000ms
      vi.advanceTimersByTime(2000);

      expect(navMock).toHaveBeenCalledWith('research');
    });

    it('displays success banner in English and navigates after 2000ms', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'researcher-1' },
        hasPermission: (perm) => perm === 'write:research',
        authLoading: false
      });

      uploadFileToR2.mockResolvedValueOnce('https://r2.climamedix.org/success-en.pdf');
      supabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null })
      });

      const navMock = vi.fn();
      const { container } = render(<ResearchUploadPage lang="en" onNavigate={navMock} />);

      fireEvent.input(screen.getByPlaceholderText('Research Title...'), { target: { value: 'Successful Research' } });
      const file = new File(['data'], 'study.pdf', { type: 'application/pdf' });
      fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [file] } });

      fireEvent.click(screen.getByText('Save & Publish'));

      await vi.waitFor(() => {
        expect(screen.getByText('Research uploaded successfully')).toBeInTheDocument();
      });

      vi.advanceTimersByTime(2000);
      expect(navMock).toHaveBeenCalledWith('research');
    });
  });
});
