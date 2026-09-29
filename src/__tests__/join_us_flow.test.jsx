import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/preact';
import { JoinUsPage } from '../features/join-us/JoinUsPage';
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

describe('Stage 4: Join Us Application Form & Admin Requests Comprehensive Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uploadFileToR2.mockReset();
    window.alert = vi.fn();
    window.confirm = vi.fn(() => true);
    window.scrollTo = vi.fn();
    sessionStorage.clear();

    // Mock global fetch for IP location lookup
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ city: 'Riyadh', country_name: 'Saudi Arabia' })
    });

    mockUseAuth.mockReturnValue({
      user: null,
      hasPermission: () => false
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1: Banner & Track Selection Matrix (7 Tests)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('1. Header Banner & Track Selection Matrix', () => {
    it('renders header banner and description in Arabic by default', () => {
      render(<JoinUsPage lang="ar" onNavigate={vi.fn()} />);

      expect(screen.getByText('الانضمام لفريق ClimaMedix')).toBeInTheDocument();
      expect(screen.getByText(/سجل بياناتك للانضمام إلى قائمة الباحثين/)).toBeInTheDocument();
    });

    it('renders header banner and description in English when lang is en', () => {
      render(<JoinUsPage lang="en" onNavigate={vi.fn()} />);

      expect(screen.getByText('Join the ClimaMedix Team')).toBeInTheDocument();
      expect(screen.getByText(/Register your details to join/)).toBeInTheDocument();
    });

    it('renders both track selection cards when no track is selected', () => {
      render(<JoinUsPage lang="ar" onNavigate={vi.fn()} />);

      expect(screen.getByText('مسار البحث العلمي')).toBeInTheDocument();
      expect(screen.getByText('مثقف صحي مجتمعي')).toBeInTheDocument();
    });

    it('selects Research track and reveals the application form', () => {
      render(<JoinUsPage lang="ar" onNavigate={vi.fn()} />);

      const researchCard = screen.getByText('مسار البحث العلمي');
      fireEvent.click(researchCard);

      expect(screen.getByText('مسار البحث العلمي')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('أدخل اسمك الكامل')).toBeInTheDocument();
      expect(screen.getByText('تغيير')).toBeInTheDocument();
    });

    it('selects Educator track and reveals the application form', () => {
      render(<JoinUsPage lang="ar" onNavigate={vi.fn()} />);

      const educatorCard = screen.getByText('مثقف صحي مجتمعي');
      fireEvent.click(educatorCard);

      expect(screen.getByText('مثقف صحي مجتمعي')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('أدخل اسمك الكامل')).toBeInTheDocument();
    });

    it('resets track selection when clicking change button', () => {
      render(<JoinUsPage lang="ar" onNavigate={vi.fn()} />);

      fireEvent.click(screen.getByText('مسار البحث العلمي'));
      expect(screen.getByPlaceholderText('أدخل اسمك الكامل')).toBeInTheDocument();

      const changeBtn = screen.getByText('تغيير');
      fireEvent.click(changeBtn);

      expect(screen.queryByPlaceholderText('أدخل اسمك الكامل')).toBeNull();
      expect(screen.getByText('مسار البحث العلمي')).toBeInTheDocument();
      expect(screen.getByText('مثقف صحي مجتمعي')).toBeInTheDocument();
    });

    it('triggers mouseenter and mouseleave styling on track selection cards', () => {
      render(<JoinUsPage lang="ar" onNavigate={vi.fn()} />);

      const trackCards = document.querySelectorAll('div[style*="cursor: pointer"]');
      expect(trackCards.length).toBeGreaterThan(0);

      trackCards.forEach(card => {
        fireEvent.mouseEnter(card);
        fireEvent.mouseLeave(card);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2: Form Interaction, Dynamic Fields & Focus Styles (8 Tests)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('2. Form Inputs, Dynamic Fields & Focus Effects', () => {
    beforeEach(() => {
      render(<JoinUsPage lang="ar" onNavigate={vi.fn()} />);
      fireEvent.click(screen.getByText('مسار البحث العلمي'));
    });

    it('updates all standard text inputs on user typing', () => {
      const nameInput = screen.getByPlaceholderText('أدخل اسمك الكامل');
      fireEvent.input(nameInput, { target: { value: 'د. يوسف التميمي' } });
      expect(nameInput.value).toBe('د. يوسف التميمي');

      const emailInput = screen.getByPlaceholderText('name@example.com');
      fireEvent.input(emailInput, { target: { value: 'yousef@health.org' } });
      expect(emailInput.value).toBe('yousef@health.org');

      const professionInput = screen.getByPlaceholderText('اختر تخصصك');
      fireEvent.input(professionInput, { target: { value: 'أخصائي أمراض بيئية' } });
      expect(professionInput.value).toBe('أخصائي أمراض بيئية');

      const orgInput = screen.getByPlaceholderText('اذكر اسم جامعتك أو المنظمة التي تنتمي إليها');
      fireEvent.input(orgInput, { target: { value: 'جامعة الملك عبدالعزيز' } });
      expect(orgInput.value).toBe('جامعة الملك عبدالعزيز');

      const workInput = screen.getByPlaceholderText('ما هو مسماك الوظيفي؟');
      fireEvent.input(workInput, { target: { value: 'استشاري وبائيات' } });
      expect(workInput.value).toBe('استشاري وبائيات');

      const bioInput = screen.getByPlaceholderText('حدثنا عن اهتماماتك وخبراتك...');
      fireEvent.input(bioInput, { target: { value: 'اهتمام بأبحاث التغير المناخي والربو.' } });
      expect(bioInput.value).toBe('اهتمام بأبحاث التغير المناخي والربو.');
    });

    it('updates birth date input with DatePicker', () => {
      const dateTrigger = document.querySelector('.dp-trigger');
      expect(dateTrigger).toBeInTheDocument();
      expect(screen.getByText('اختر تاريخ الميلاد')).toBeInTheDocument();
    });

    it('toggles activist checkbox and displays dynamic field', () => {
      const activistCheckbox = document.getElementById('isActivist');
      expect(activistCheckbox).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('اذكر مجال نشاطك')).toBeNull();

      // Check activist
      fireEvent.change(activistCheckbox, { target: { checked: true } });
      const activistField = screen.getByPlaceholderText('اذكر مجال نشاطك');
      expect(activistField).toBeInTheDocument();

      fireEvent.input(activistField, { target: { value: 'النشاط المناخي وحماية الغابات' } });
      expect(activistField.value).toBe('النشاط المناخي وحماية الغابات');

      // Uncheck activist
      fireEvent.change(activistCheckbox, { target: { checked: false } });
      expect(screen.queryByPlaceholderText('اذكر مجال نشاطك')).toBeNull();
    });

    it('toggles researcher checkbox and displays dynamic field', () => {
      const researcherCheckbox = document.getElementById('isResearcher');
      expect(researcherCheckbox).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('اذكر مجال بحثك')).toBeNull();

      // Check researcher
      fireEvent.change(researcherCheckbox, { target: { checked: true } });
      const researcherField = screen.getByPlaceholderText('اذكر مجال بحثك');
      expect(researcherField).toBeInTheDocument();

      fireEvent.input(researcherField, { target: { value: 'التلوث الجوي وأمراض القلب' } });
      expect(researcherField.value).toBe('التلوث الجوي وأمراض القلب');

      // Uncheck researcher
      fireEvent.change(researcherCheckbox, { target: { checked: false } });
      expect(screen.queryByPlaceholderText('اذكر مجال بحثك')).toBeNull();
    });

    it('applies border color transition on focus and blur for inputs', () => {
      const nameInput = screen.getByPlaceholderText('أدخل اسمك الكامل');
      fireEvent.focus(nameInput);
      expect(nameInput.style.borderColor).toBe('rgb(21, 180, 122)');

      fireEvent.blur(nameInput);
      expect(nameInput.style.borderColor).toBe('rgba(11, 40, 73, 0.15)');

      const bioTextarea = screen.getByPlaceholderText('حدثنا عن اهتماماتك وخبراتك...');
      fireEvent.focus(bioTextarea);
      expect(bioTextarea.style.borderColor).toBe('rgb(21, 180, 122)');
      fireEvent.blur(bioTextarea);
      expect(bioTextarea.style.borderColor).toBe('rgba(11, 40, 73, 0.15)');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3: CV File Attachment & R2 Storage Upload (5 Tests)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('3. CV File Attachment & R2 Storage Upload', () => {
    it('shows no file chosen label initially', () => {
      render(<JoinUsPage lang="ar" onNavigate={vi.fn()} />);
      fireEvent.click(screen.getByText('مسار البحث العلمي'));

      expect(screen.getByText('لم يتم اختيار ملف')).toBeInTheDocument();
    });

    it('triggers hidden file input click when clicking upload button', () => {
      render(<JoinUsPage lang="ar" onNavigate={vi.fn()} />);
      fireEvent.click(screen.getByText('مسار البحث العلمي'));

      const fileInput = document.querySelector('input[type="file"]');
      const clickSpy = vi.spyOn(fileInput, 'click');

      const uploadBtn = screen.getByText('رفع الملف');
      fireEvent.click(uploadBtn);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('updates file state and displays chosen file name', () => {
      render(<JoinUsPage lang="ar" onNavigate={vi.fn()} />);
      fireEvent.click(screen.getByText('مسار البحث العلمي'));

      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(['dummy cv content'], 'dr_samir_resume.pdf', { type: 'application/pdf' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(screen.getByText('dr_samir_resume.pdf')).toBeInTheDocument();
      expect(screen.queryByText('لم يتم اختيار ملف')).toBeNull();
    });

    it('renders English file upload label and supported formats when lang is en', () => {
      render(<JoinUsPage lang="en" onNavigate={vi.fn()} />);
      fireEvent.click(screen.getByText('Research Track'));

      expect(screen.getByText('Upload File')).toBeInTheDocument();
      expect(screen.getByText('No file chosen')).toBeInTheDocument();
      expect(screen.getByText('Supported formats: PDF, DOC, DOCX')).toBeInTheDocument();
    });

    it('replaces selected CV when user picks a different file and updates file name display', () => {
      render(<JoinUsPage lang="ar" onNavigate={vi.fn()} />);
      fireEvent.click(screen.getByText('مسار البحث العلمي'));

      const fileInput = document.querySelector('input[type="file"]');
      const file1 = new File(['content1'], 'old_cv.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [file1] } });
      expect(screen.getByText('old_cv.pdf')).toBeInTheDocument();

      const file2 = new File(['content2'], 'updated_curriculum_vitae.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      fireEvent.change(fileInput, { target: { files: [file2] } });

      expect(screen.queryByText('old_cv.pdf')).toBeNull();
      expect(screen.getByText('updated_curriculum_vitae.docx')).toBeInTheDocument();
    });

    it('uploads Word document (.docx) CV to R2 bucket folder "cvs" and stores url in join_requests', async () => {
      uploadFileToR2.mockResolvedValueOnce('https://pub-r2.climamedix.org/cvs/researcher_doc.docx');
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ insert: mockInsert });

      render(<JoinUsPage lang="ar" onNavigate={vi.fn()} />);
      fireEvent.click(screen.getByText('مسار البحث العلمي'));

      fireEvent.input(screen.getByPlaceholderText('أدخل اسمك الكامل'), { target: { value: 'د. هند القاسم' } });
      fireEvent.input(screen.getByPlaceholderText('name@example.com'), { target: { value: 'hind@med.org' } });
      fireEvent.input(screen.getByPlaceholderText('اختر تخصصك'), { target: { value: 'أبحاث بيئية' } });

      const fileInput = document.querySelector('input[type="file"]');
      const wordDoc = new File(['binary-doc-bytes'], 'researcher_doc.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      fireEvent.change(fileInput, { target: { files: [wordDoc] } });

      fireEvent.click(screen.getByText('إرسال طلب الانضمام'));

      await waitFor(() => {
        expect(uploadFileToR2).toHaveBeenCalledWith(wordDoc, 'cvs');
        expect(mockInsert).toHaveBeenCalledTimes(1);
      });

      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          cv_url: 'https://pub-r2.climamedix.org/cvs/researcher_doc.docx'
        })
      ]);
    });

    it('displays loading spinner and disables submit button while CV upload is in flight', async () => {
      let resolveUpload;
      uploadFileToR2.mockReturnValue(new Promise(res => { resolveUpload = res; }));
      supabase.from.mockReturnValue({ insert: vi.fn().mockResolvedValue({ error: null }) });

      render(<JoinUsPage lang="ar" onNavigate={vi.fn()} />);
      fireEvent.click(screen.getByText('مسار البحث العلمي'));

      fireEvent.input(screen.getByPlaceholderText('أدخل اسمك الكامل'), { target: { value: 'كريم عادل' } });
      fireEvent.input(screen.getByPlaceholderText('name@example.com'), { target: { value: 'karim@climamedix.org' } });
      fireEvent.input(screen.getByPlaceholderText('اختر تخصصك'), { target: { value: 'طب بيئي' } });

      const fileInput = document.querySelector('input[type="file"]');
      const cvFile = new File(['data'], 'karim_cv.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [cvFile] } });

      const submitBtn = screen.getByText('إرسال طلب الانضمام').closest('button');
      fireEvent.click(submitBtn);

      // Verify button is disabled and text switched to submitting state
      await waitFor(() => {
        expect(submitBtn).toBeDisabled();
        expect(screen.getByText('جاري إرسال طلبك...')).toBeInTheDocument();
      });

      // Finish upload and await full submission cycle
      resolveUpload('https://r2.climamedix.org/cvs/karim.pdf');
      expect(await screen.findByText('تم إرسال طلبك بنجاح!')).toBeInTheDocument();
    });

    it('handles Cloudflare R2 upload failure, displays error banner, and aborts Supabase submission', async () => {
      uploadFileToR2.mockRejectedValueOnce(new Error('Cloudflare R2 Bucket Connection Timeout'));
      const mockInsert = vi.fn();
      supabase.from.mockReturnValue({ insert: mockInsert });

      render(<JoinUsPage lang="ar" onNavigate={vi.fn()} />);
      fireEvent.click(screen.getByText('مسار البحث العلمي'));

      fireEvent.input(screen.getByPlaceholderText('أدخل اسمك الكامل'), { target: { value: 'طارق زياد' } });
      fireEvent.input(screen.getByPlaceholderText('name@example.com'), { target: { value: 'tariq@climamedix.org' } });
      fireEvent.input(screen.getByPlaceholderText('اختر تخصصك'), { target: { value: 'طاقة متجددة' } });

      const fileInput = document.querySelector('input[type="file"]');
      const cvFile = new File(['data'], 'tariq_cv.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [cvFile] } });

      const submitBtn = screen.getByText('إرسال طلب الانضمام').closest('button');
      fireEvent.click(submitBtn);

      expect(await screen.findByText(/حدث خطأ أثناء الإرسال.*Cloudflare R2 Bucket Connection Timeout/)).toBeInTheDocument();
      expect(mockInsert).not.toHaveBeenCalled();

      // Submit button is re-enabled with normal text
      const buttonAfter = screen.getByText('إرسال طلب الانضمام').closest('button');
      expect(buttonAfter).not.toBeDisabled();
    });

    it('submits with CV file in English mode and verifies English messages and status transitions', async () => {
      uploadFileToR2.mockResolvedValueOnce('https://pub-r2.climamedix.org/cvs/alice_smith.pdf');
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ insert: mockInsert });

      render(<JoinUsPage lang="en" onNavigate={vi.fn()} />);
      fireEvent.click(screen.getByText('Research Track'));

      fireEvent.input(screen.getByPlaceholderText('Enter your full name'), { target: { value: 'Alice Smith' } });
      fireEvent.input(screen.getByPlaceholderText('name@example.com'), { target: { value: 'alice@example.com' } });
      fireEvent.input(screen.getByPlaceholderText('Select your specialty'), { target: { value: 'Epidemiology' } });

      const fileInput = document.querySelector('input[type="file"]');
      const cvFile = new File(['pdf-data'], 'alice_smith.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [cvFile] } });

      const submitBtn = screen.getByText('Submit Join Request');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(uploadFileToR2).toHaveBeenCalledWith(cvFile, 'cvs');
        expect(mockInsert).toHaveBeenCalledTimes(1);
      });

      expect(await screen.findByText('Your request was sent successfully!')).toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4: Submission Lifecycle, Success View & Error Handling (7 Tests)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('4. Submission Lifecycle, Success View & Error Handling', () => {
    it('submits join request successfully with uploaded CV and navigates to home after timeout', async () => {
      const setTimeoutSpy = vi.spyOn(window, 'setTimeout');
      const onNavigate = vi.fn();
      uploadFileToR2.mockResolvedValueOnce('https://r2.climamedix.org/cvs/dr_samir.pdf');

      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ insert: mockInsert });

      render(<JoinUsPage lang="ar" onNavigate={onNavigate} />);
      fireEvent.click(screen.getByText('مسار البحث العلمي'));

      // Fill in details
      fireEvent.input(screen.getByPlaceholderText('أدخل اسمك الكامل'), { target: { value: 'د. سمير النجار' } });
      fireEvent.input(screen.getByPlaceholderText('name@example.com'), { target: { value: 'samir@climamedix.org' } });
      fireEvent.input(screen.getByPlaceholderText('اختر تخصصك'), { target: { value: 'علوم الغلاف الجوي' } });
      fireEvent.input(screen.getByPlaceholderText('اذكر اسم جامعتك أو المنظمة التي تنتمي إليها'), { target: { value: 'جامعة دمشق' } });

      // Attach file
      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(['content'], 'samir_cv.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Submit
      const submitBtn = screen.getByText('إرسال طلب الانضمام');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(uploadFileToR2).toHaveBeenCalledWith(file, 'cvs');
        expect(supabase.from).toHaveBeenCalledWith('join_requests');
        expect(mockInsert).toHaveBeenCalledTimes(1);
      });

      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          full_name: 'د. سمير النجار',
          email: 'samir@climamedix.org',
          profession: 'علوم الغلاف الجوي',
          university_org: 'جامعة دمشق',
          cv_url: 'https://r2.climamedix.org/cvs/dr_samir.pdf',
          track: 'research'
        })
      ]);

      // Success screen should be visible
      expect(await screen.findByText('تم إرسال طلبك بنجاح!')).toBeInTheDocument();
      expect(screen.getByText(/سيتواصل معك منسق الفريق/)).toBeInTheDocument();

      // Trigger the redirect timer callback
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 3500);
      const timerCallback = setTimeoutSpy.mock.calls.find(call => call[1] === 3500)?.[0];
      if (timerCallback) timerCallback();
      expect(onNavigate).toHaveBeenCalledWith('home');
    });

    it('submits without CV file and passes cv_url as null', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ insert: mockInsert });

      render(<JoinUsPage lang="ar" onNavigate={vi.fn()} />);
      fireEvent.click(screen.getByText('مثقف صحي مجتمعي'));

      fireEvent.input(screen.getByPlaceholderText('أدخل اسمك الكامل'), { target: { value: 'مريم حسن' } });
      fireEvent.input(screen.getByPlaceholderText('name@example.com'), { target: { value: 'mariam@health.org' } });
      fireEvent.input(screen.getByPlaceholderText('اختر تخصصك'), { target: { value: 'تثقيف صحي' } });

      fireEvent.click(screen.getByText('إرسال طلب الانضمام'));

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledTimes(1);
      });

      const payload = mockInsert.mock.calls[0][0][0];
      expect(payload.cv_url).toBeNull();
      expect(payload.track).toBe('educator');
      expect(uploadFileToR2).not.toHaveBeenCalled();
    });

    it('displays error message banner when Supabase insert fails', async () => {
      supabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          error: { message: 'Unique constraint on email violated' }
        })
      });

      render(<JoinUsPage lang="ar" onNavigate={vi.fn()} />);
      fireEvent.click(screen.getByText('مسار البحث العلمي'));

      fireEvent.input(screen.getByPlaceholderText('أدخل اسمك الكامل'), { target: { value: 'علي الأحمد' } });
      fireEvent.input(screen.getByPlaceholderText('name@example.com'), { target: { value: 'ali@exists.com' } });
      fireEvent.input(screen.getByPlaceholderText('اختر تخصصك'), { target: { value: 'باحث' } });

      fireEvent.click(screen.getByText('إرسال طلب الانضمام'));

      expect(await screen.findByText(/حدث خطأ أثناء الإرسال.*Unique constraint/)).toBeInTheDocument();
    });

    it('handles IP geolocation fetch failure gracefully without throwing', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

      render(<JoinUsPage lang="ar" onNavigate={vi.fn()} />);
      // Should not throw or crash
      expect(screen.getByText('الانضمام لفريق ClimaMedix')).toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5: Admin Join Requests Management Matrix (8 Tests)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('5. Admin Join Requests Management Matrix (view:join_requests)', () => {
    const mockRequests = [
      {
        id: 'req-101',
        full_name: 'د. منى الشريف',
        email: 'mona@univ.edu',
        profession: 'أستاذة طب المناخ',
        track: 'research',
        created_at: '2026-08-15T10:00:00Z',
        university_org: 'جامعة القاهرة',
        work: 'رئيس قسم الأبحاث',
        city: 'القاهرة',
        country: 'مصر',
        birth_date: '1985-04-12',
        is_activist: true,
        activist_field: 'حملات التوعية بتلوث الهواء',
        is_researcher: true,
        researcher_field: 'الصحة العامة وتغير المناخ',
        bio: 'خبرة ٢٠ عاماً في الأبحاث البيئية الميدانية.',
        cv_url: 'https://r2.climamedix.org/cvs/mona.pdf'
      }
    ];

    it('renders empty pending requests notice when no join requests exist', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'admin-1', email: 'admin@climamedix.org' },
        hasPermission: (perm) => perm === 'view:join_requests'
      });

      supabase.from.mockImplementation((table) => {
        if (table === 'join_requests') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null })
            })
          };
        }
        if (table === 'profiles') {
          return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
        }
        return { select: vi.fn().mockReturnThis() };
      });

      render(<JoinUsPage lang="ar" onNavigate={vi.fn()} />);

      expect(await screen.findByText('طلبات الانضمام')).toBeInTheDocument();
      expect(screen.getByText('لا توجد طلبات انضمام حالياً.')).toBeInTheDocument();
    });

    it('renders complete request card details including badges, bio and CV link', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'admin-1', email: 'admin@climamedix.org' },
        hasPermission: (perm) => perm === 'view:join_requests'
      });

      supabase.from.mockImplementation((table) => {
        if (table === 'join_requests') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockRequests, error: null })
            })
          };
        }
        if (table === 'profiles') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [{ email: 'mona@univ.edu', role: 'user', id: 'prof-mona' }],
              error: null
            })
          };
        }
        return { select: vi.fn().mockReturnThis() };
      });

      render(<JoinUsPage lang="ar" onNavigate={vi.fn()} />);

      expect(await screen.findByText('د. منى الشريف')).toBeInTheDocument();
      expect(screen.getByText(/mona@univ.edu/)).toBeInTheDocument();
      expect(screen.getByText(/أستاذة طب المناخ/)).toBeInTheDocument();
      expect(screen.getByText(/جامعة القاهرة/)).toBeInTheDocument();
      expect(screen.getByText(/رئيس قسم الأبحاث/)).toBeInTheDocument();
      expect(screen.getByText(/القاهرة, مصر/)).toBeInTheDocument();
      expect(screen.getByText(/حملات التوعية بتلوث الهواء/)).toBeInTheDocument();
      expect(screen.getByText(/الصحة العامة وتغير المناخ/)).toBeInTheDocument();
      expect(screen.getByText(/"خبرة ٢٠ عاماً في الأبحاث البيئية الميدانية."/)).toBeInTheDocument();

      const cvLink = screen.getByText('عرض السيرة الذاتية (CV)');
      expect(cvLink).toBeInTheDocument();
      expect(cvLink.getAttribute('href')).toBe('https://r2.climamedix.org/cvs/mona.pdf');
    });

    it('alerts admin when approving a request whose email has no registered user account', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'admin-1', email: 'admin@climamedix.org' },
        hasPermission: (perm) => perm === 'view:join_requests'
      });

      supabase.from.mockImplementation((table) => {
        if (table === 'join_requests') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockRequests, error: null })
            })
          };
        }
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
              })
            })
          };
        }
        return { select: vi.fn().mockReturnThis() };
      });

      render(<JoinUsPage lang="ar" onNavigate={vi.fn()} />);

      const approveBtn = await screen.findByText('قبول وترقية العضو');
      fireEvent.click(approveBtn);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          expect.stringContaining('لم يتم العثور على مستخدم مسجل بهذا البريد الإلكتروني')
        );
      });
    });

    it('approves request, upgrades role to researcher, updates profile, and redirects to admin-users', async () => {
      const onNavigate = vi.fn();
      mockUseAuth.mockReturnValue({
        user: { id: 'admin-1', email: 'admin@climamedix.org' },
        hasPermission: (perm) => perm === 'view:join_requests'
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      });

      supabase.from.mockImplementation((table) => {
        if (table === 'join_requests') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockRequests, error: null })
            })
          };
        }
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'prof-mona' },
                  error: null
                })
              })
            }),
            update: mockUpdate
          };
        }
        return { select: vi.fn().mockReturnThis() };
      });

      render(<JoinUsPage lang="ar" onNavigate={onNavigate} />);

      const approveBtn = await screen.findByText('قبول وترقية العضو');
      fireEvent.click(approveBtn);

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
          role: 'researcher',
          profession: 'أستاذة طب المناخ',
          university_or_org: 'جامعة القاهرة'
        }));
      });

      expect(sessionStorage.getItem('admin_target_user')).toBe('prof-mona');
      expect(onNavigate).toHaveBeenCalledWith('admin-users', null, 'id=prof-mona');
    });

    it('deletes join request when clicking delete button and confirming dialog', async () => {
      window.confirm = vi.fn(() => true);
      mockUseAuth.mockReturnValue({
        user: { id: 'admin-1', email: 'admin@climamedix.org' },
        hasPermission: (perm) => perm === 'view:join_requests'
      });

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      });

      supabase.from.mockImplementation((table) => {
        if (table === 'join_requests') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockRequests, error: null })
            }),
            delete: mockDelete
          };
        }
        if (table === 'profiles') {
          return {
            select: vi.fn().mockResolvedValue({ data: [], error: null })
          };
        }
        return { select: vi.fn().mockReturnThis() };
      });

      render(<JoinUsPage lang="ar" onNavigate={vi.fn()} />);

      const deleteBtn = await screen.findByText('حذف الطلب');
      fireEvent.click(deleteBtn);

      expect(window.confirm).toHaveBeenCalled();
      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalled();
      });
      expect(screen.queryByText('د. منى الشريف')).toBeNull();
    });

    it('does not delete request if admin cancels confirm dialog', async () => {
      window.confirm = vi.fn(() => false);
      mockUseAuth.mockReturnValue({
        user: { id: 'admin-1', email: 'admin@climamedix.org' },
        hasPermission: (perm) => perm === 'view:join_requests'
      });

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      });

      supabase.from.mockImplementation((table) => {
        if (table === 'join_requests') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockRequests, error: null })
            }),
            delete: mockDelete
          };
        }
        if (table === 'profiles') {
          return {
            select: vi.fn().mockResolvedValue({ data: [], error: null })
          };
        }
        return { select: vi.fn().mockReturnThis() };
      });

      render(<JoinUsPage lang="ar" onNavigate={vi.fn()} />);

      const deleteBtn = await screen.findByText('حذف الطلب');
      fireEvent.click(deleteBtn);

      expect(mockDelete).not.toHaveBeenCalled();
      expect(screen.getByText('د. منى الشريف')).toBeInTheDocument();
    });

    it('navigates to user permissions page when clicking approved badge', async () => {
      const onNavigate = vi.fn();
      mockUseAuth.mockReturnValue({
        user: { id: 'admin-1', email: 'admin@climamedix.org' },
        hasPermission: (perm) => perm === 'view:join_requests'
      });

      supabase.from.mockImplementation((table) => {
        if (table === 'join_requests') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockRequests, error: null })
            })
          };
        }
        if (table === 'profiles') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [{ email: 'mona@univ.edu', role: 'researcher', id: 'prof-mona-approved' }],
              error: null
            })
          };
        }
        return { select: vi.fn().mockReturnThis() };
      });

      render(<JoinUsPage lang="ar" onNavigate={onNavigate} />);

      const approvedBtn = await screen.findByText(/موافق عليه ومسجل/);
      expect(approvedBtn).toBeInTheDocument();

      fireEvent.mouseOver(approvedBtn);
      fireEvent.mouseOut(approvedBtn);

      fireEvent.click(approvedBtn);
      expect(sessionStorage.getItem('admin_target_user')).toBe('prof-mona-approved');
      expect(onNavigate).toHaveBeenCalledWith('admin-users', null, 'id=prof-mona-approved');
    });
  });
});
