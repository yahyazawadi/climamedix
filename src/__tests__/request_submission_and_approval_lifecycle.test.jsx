import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { JoinUsPage } from '../features/join-us/JoinUsPage';
import { CertificateAuditDashboard } from '../features/admin/components/CertificateAuditDashboard';
import { AdminCRUD } from '../features/admin/components/AdminCRUD';
import * as AuthModule from '../features/auth/hooks/useAuth';
import { ROLE_PERMISSIONS } from '../features/auth/hooks/useAuth';

// Mock s3Client for JoinUs CV upload to Cloudflare R2
let mockUploadFileToR2 = vi.fn();
vi.mock('../utils/s3Client', () => ({
  uploadFileToR2: (file, folder) => mockUploadFileToR2(file, folder)
}));

// Mock Supabase with granular table queries
let supabaseTables = {};

const createMockQueryBuilder = (tableName) => {
  let selectFields = '*';
  let filters = [];
  let updatePayload = null;
  let insertPayload = null;
  let isDelete = false;

  const builder = {
    select: vi.fn((fields = '*') => {
      selectFields = fields;
      return builder;
    }),
    order: vi.fn(() => builder),
    eq: vi.fn((column, value) => {
      filters.push({ column, value });
      return builder;
    }),
    maybeSingle: vi.fn(async () => {
      const records = supabaseTables[tableName] || [];
      const match = records.find(r => filters.every(f => r[f.column] === f.value));
      return { data: match || null, error: null };
    }),
    insert: vi.fn(async (payload) => {
      insertPayload = payload;
      if (!supabaseTables[tableName]) supabaseTables[tableName] = [];
      const created = Array.isArray(payload) ? payload : [payload];
      created.forEach(item => {
        const withId = { id: item.id || `gen-${Date.now()}-${Math.random()}`, ...item };
        supabaseTables[tableName].push(withId);
      });
      return { data: created, error: null };
    }),
    update: vi.fn((payload) => {
      updatePayload = payload;
      return builder;
    }),
    delete: vi.fn(() => {
      isDelete = true;
      return builder;
    }),
    then: (resolve) => {
      let records = supabaseTables[tableName] ? [...supabaseTables[tableName]] : [];
      
      // Apply filters
      if (filters.length > 0) {
        records = records.filter(r => filters.every(f => r[f.column] === f.value));
      }

      if (isDelete) {
        supabaseTables[tableName] = (supabaseTables[tableName] || []).filter(
          r => !filters.every(f => r[f.column] === f.value)
        );
        return resolve({ data: records, error: null });
      }

      if (updatePayload) {
        supabaseTables[tableName] = (supabaseTables[tableName] || []).map(r => {
          if (filters.every(f => r[f.column] === f.value)) {
            return { ...r, ...updatePayload };
          }
          return r;
        });
        return resolve({ data: updatePayload, error: null });
      }

      return resolve({ data: records, error: null });
    }
  };

  return builder;
};

vi.mock('../utils/supabaseClient', () => ({
  supabase: {
    from: vi.fn((table) => createMockQueryBuilder(table))
  }
}));

// Helper to set current logged in user & role
const setAuthRole = (role, loading = false) => {
  const perms = role ? (ROLE_PERMISSIONS[role] || []) : [];
  vi.spyOn(AuthModule, 'useAuth').mockReturnValue({
    hasPermission: (perm) => perms.includes(perm),
    loading,
    user: role ? { id: `usr-${role}`, email: `${role}@climamedix.org` } : null,
    userProfile: role ? { role, full_name: `${role} Officer` } : null,
  });
};

describe('End-to-End Submission & Permission Review Lifecycle Matrix', () => {
  let originalAlert;
  let originalConfirm;
  let alertMessages = [];
  let confirmReturn = true;

  beforeEach(() => {
    vi.clearAllMocks();
    alertMessages = [];
    originalAlert = window.alert;
    originalConfirm = window.confirm;
    window.alert = vi.fn((msg) => alertMessages.push(msg));
    window.confirm = vi.fn(() => confirmReturn);

    // Default Supabase in-memory DB state
    supabaseTables = {
      join_requests: [],
      profiles: [],
      certificate_requests: [],
      courses: [],
      lesson_watch_metrics: [],
      quiz_attempts: []
    };

    // Default mock R2 URL
    mockUploadFileToR2.mockImplementation(async (file, folder) => {
      return `https://pub-r2.climamedix.org/${folder}/${file.name || 'test.pdf'}`;
    });

    // Mock geolocation fetch
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ city: 'Amman', country_name: 'Jordan' })
    });
  });

  afterEach(() => {
    window.alert = originalAlert;
    window.confirm = originalConfirm;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. JOIN US MEMBERSHIP REQUEST: SUBMISSION -> AUDIT -> APPROVAL WITH ROLE PROMOTION
  // ═══════════════════════════════════════════════════════════════════════════
  describe('1. Membership Application: Submission, Permission Gating & Role Promotion', () => {
    
    it('allows a public user to submit a Join Us request with CV upload to Cloudflare R2', async () => {
      setAuthRole(null); // Anonymous applicant
      const mockNavigate = vi.fn();

      render(<JoinUsPage lang="ar" onNavigate={mockNavigate} />);

      // Select Research Track (trackResearch: 'مسار البحث العلمي')
      const researchTrackCard = screen.getByText('مسار البحث العلمي');
      fireEvent.click(researchTrackCard);

      // Fill in application form fields matching exact translations
      fireEvent.input(screen.getByPlaceholderText('أدخل اسمك الكامل'), {
        target: { value: 'د. سامية الشريف' }
      });
      fireEvent.input(screen.getByPlaceholderText('name@example.com'), {
        target: { value: 'samia.sharif@university.edu' }
      });
      fireEvent.input(screen.getByPlaceholderText('اختر تخصصك'), {
        target: { value: 'أخصائية وبائيات مناخية' }
      });
      fireEvent.input(screen.getByPlaceholderText('اذكر اسم جامعتك أو المنظمة التي تنتمي إليها'), {
        target: { value: 'جامعة اليرموك' }
      });

      // Upload CV file
      const cvFile = new File(['%PDF-1.4 Mock CV Content'], 'samia_cv.pdf', { type: 'application/pdf' });
      const fileInput = document.querySelector('input[type="file"]');
      fireEvent.change(fileInput, { target: { files: [cvFile] } });

      // Submit Form
      const submitBtn = screen.getByRole('button', { name: /إرسال طلب الانضمام/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockUploadFileToR2).toHaveBeenCalledWith(cvFile, 'cvs');
      });

      // Verify record in Supabase join_requests table
      expect(supabaseTables.join_requests.length).toBe(1);
      const submitted = supabaseTables.join_requests[0];
      expect(submitted.full_name).toBe('د. سامية الشريف');
      expect(submitted.email).toBe('samia.sharif@university.edu');
      expect(submitted.track).toBe('research');
      expect(submitted.cv_url).toContain('https://pub-r2.climamedix.org/cvs/samia_cv.pdf');
    });

    it('denies standard user or subscriber from viewing or reviewing join requests list', () => {
      setAuthRole('subscriber');
      render(<JoinUsPage lang="ar" onNavigate={vi.fn()} />);

      // Subscriber lacks view:join_requests
      expect(screen.queryByText('طلبات الانضمام المعلقة للمراجعة والتدقيق الإداري')).toBeNull();
    });

    it('allows Admin with view:join_requests to review pending request and approve it, promoting applicant to "researcher"', async () => {
      // Seed applicant join request
      supabaseTables.join_requests = [
        {
          id: 'req-samia-101',
          full_name: 'د. سامية الشريف',
          email: 'samia.sharif@university.edu',
          profession: 'أخصائية وبائيات مناخية',
          track: 'research',
          university_org: 'جامعة اليرموك',
          bio: 'باحثة في التغير المناخي والربو القصبي',
          cv_url: 'https://pub-r2.climamedix.org/cvs/samia_cv.pdf',
          created_at: new Date().toISOString()
        }
      ];

      // Seed applicant registered user profile in Supabase
      supabaseTables.profiles = [
        {
          id: 'user-samia-uuid',
          email: 'samia.sharif@university.edu',
          role: 'user', // Initial base role
          full_name: 'د. سامية الشريف'
        }
      ];

      // Login as Admin (who has view:join_requests and approve:users)
      setAuthRole('admin');
      const mockNavigate = vi.fn();

      render(<JoinUsPage lang="ar" onNavigate={mockNavigate} />);

      // Admin sees the request review table
      await waitFor(() => {
        expect(screen.getByText('د. سامية الشريف')).toBeInTheDocument();
      });

      // Click "قبول وترقية العضو"
      const approveBtn = screen.getByRole('button', { name: /قبول وترقية العضو/i });
      fireEvent.click(approveBtn);

      await waitFor(() => {
        // Assert user profile was promoted to 'researcher' based on the track
        const updatedProfile = supabaseTables.profiles.find(p => p.id === 'user-samia-uuid');
        expect(updatedProfile.role).toBe('researcher');
        expect(updatedProfile.profession).toBe('أخصائية وبائيات مناخية');
        expect(updatedProfile.university_or_org).toBe('جامعة اليرموك');

        // Assert navigation to permission assignment page
        expect(mockNavigate).toHaveBeenCalledWith('admin-users', null, 'id=user-samia-uuid');
      });
    });

    it('shows alert warning when admin tries to approve an applicant who has not yet registered an account', async () => {
      supabaseTables.join_requests = [
        {
          id: 'req-ghost-99',
          full_name: 'مجهول الهوية',
          email: 'not.registered@hospital.org',
          track: 'education',
          profession: 'محاضر'
        }
      ];
      supabaseTables.profiles = []; // No registered account exists

      setAuthRole('admin');
      render(<JoinUsPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('مجهول الهوية')).toBeInTheDocument();
      });

      const approveBtn = screen.getByRole('button', { name: /قبول وترقية العضو/i });
      fireEvent.click(approveBtn);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          expect.stringContaining('لم يتم العثور على مستخدم مسجل بهذا البريد الإلكتروني')
        );
      });
    });

    it('allows Admin to delete/reject an illegitimate membership request', async () => {
      supabaseTables.join_requests = [
        {
          id: 'req-spam-1',
          full_name: 'Spam User',
          email: 'spam@bot.net',
          track: 'research',
          profession: 'bot'
        }
      ];

      setAuthRole('admin');
      confirmReturn = true;

      render(<JoinUsPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Spam User')).toBeInTheDocument();
      });

      const deleteBtn = screen.getByRole('button', { name: /حذف الطلب/i });
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalled();
        expect(supabaseTables.join_requests.length).toBe(0);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. CERTIFICATE AUDIT & ISSUANCE: TELEMETRY VERIFICATION, APPROVE & REJECT
  // ═══════════════════════════════════════════════════════════════════════════
  describe('2. Certificate Request Audit Lifecycle: Watch Telemetry & Integrity Verification', () => {

    it('blocks unauthorized users (guest, user, educator) from CertificateAuditDashboard', () => {
      setAuthRole('educator'); // Lacks issue:certs or manage:system
      render(<CertificateAuditDashboard lang="ar" />);

      expect(screen.getByText('غير مصرح بالدخول')).toBeInTheDocument();
      expect(screen.getByText('ليس لديك صلاحيات لتدقيق الشهادات.')).toBeInTheDocument();
    });

    it('allows Admin/Superadmin with "issue:certs" to inspect pending certificate and telemetric integrity', async () => {
      // Seed Course
      supabaseTables.courses = [
        { id: 'course-clim-1', title_ar: 'دبلوم طب الكوارث المناخية', duration: '20 ساعة' }
      ];

      // Seed Certificate Request
      supabaseTables.certificate_requests = [
        {
          id: 'cert-req-001',
          user_id: 'student-tariq-777',
          course_id: 'course-clim-1',
          requested_name_ar: 'طارق عبد الله الزهراني',
          requested_name_en: 'Tariq Al-Zahrani',
          status: 'pending',
          requested_at: new Date().toISOString(),
          courses: { title_ar: 'دبلوم طب الكوارث المناخية' }
        }
      ];

      // Seed Student Telemetry Watch Metrics (genuine 95% completion, genuine duration)
      supabaseTables.lesson_watch_metrics = [
        {
          user_id: 'student-tariq-777',
          max_percentage_watched: 98,
          actual_play_duration_seconds: 1250
        }
      ];

      // Seed Passed Quiz
      supabaseTables.quiz_attempts = [
        {
          user_id: 'student-tariq-777',
          score: 95,
          passed: true,
          quizzes: { course_id: 'course-clim-1', title_ar: 'الاختبار الشامل النهائي' }
        }
      ];

      setAuthRole('admin'); // Has issue:certs
      render(<CertificateAuditDashboard lang="ar" />);

      await waitFor(() => {
        expect(screen.getByText('طارق عبد الله الزهراني / Tariq Al-Zahrani')).toBeInTheDocument();
      });

      // Click card to open Audit Details
      const card = screen.getByText('طارق عبد الله الزهراني / Tariq Al-Zahrani');
      fireEvent.click(card);

      await waitFor(() => {
        expect(screen.getByText('تفاصيل التدقيق')).toBeInTheDocument();
        expect(screen.getByText('✅ نشاط سليم')).toBeInTheDocument();
        expect(screen.getByText('95% - مجتاز')).toBeInTheDocument();
      });

      // Click Approve Certificate
      const approveBtn = screen.getByRole('button', { name: /اعتماد الشهادة/i });
      fireEvent.click(approveBtn);

      await waitFor(() => {
        const approvedReq = supabaseTables.certificate_requests.find(c => c.id === 'cert-req-001');
        expect(approvedReq.status).toBe('approved');
      });
    });

    it('detects suspicious telemetry (fast-forward skipping) and allows auditor to REJECT certificate with mandatory reason', async () => {
      supabaseTables.courses = [
        { id: 'course-clim-2', title_ar: 'إدارة أزمات الفيضانات' }
      ];

      supabaseTables.certificate_requests = [
        {
          id: 'cert-req-fraud-002',
          user_id: 'cheater-999',
          course_id: 'course-clim-2',
          requested_name_ar: 'مستمع متخطي',
          requested_name_en: 'Skipping User',
          status: 'pending',
          requested_at: new Date().toISOString(),
          courses: { title_ar: 'إدارة أزمات الفيضانات' }
        }
      ];

      // Suspicious Telemetry: 100% watched reported, but only 3 seconds played!
      supabaseTables.lesson_watch_metrics = [
        {
          user_id: 'cheater-999',
          max_percentage_watched: 95,
          actual_play_duration_seconds: 4 // Fast-forwarded/skipped
        }
      ];

      setAuthRole('admin');
      render(<CertificateAuditDashboard lang="ar" />);

      await waitFor(() => {
        expect(screen.getByText('مستمع متخطي / Skipping User')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('مستمع متخطي / Skipping User'));

      await waitFor(() => {
        expect(screen.getByText('⚠️ نشاط مشبوه (تخطي الفيديو)')).toBeInTheDocument();
      });

      // Try rejecting without reason -> should trigger validation alert
      const rejectBtn = screen.getByRole('button', { name: /رفض الطلب/i });
      fireEvent.click(rejectBtn);

      expect(window.alert).toHaveBeenCalledWith('يرجى كتابة سبب الرفض');

      // Enter rejection reason
      const reasonInput = screen.getByPlaceholderText('سبب الرفض (إلزامي)');
      fireEvent.input(reasonInput, { target: { value: 'تم تخطي مقاطع الفيديو دون مشاهدة فعلية (3 ثوان فقط)' } });

      // Click Reject again
      fireEvent.click(rejectBtn);

      await waitFor(() => {
        const rejectedReq = supabaseTables.certificate_requests.find(c => c.id === 'cert-req-fraud-002');
        expect(rejectedReq.status).toBe('rejected');
        expect(rejectedReq.rejection_reason).toBe('تم تخطي مقاطع الفيديو دون مشاهدة فعلية (3 ثوان فقط)');
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. AdminCRUD PLATFORM CONTENT & JOIN REQUESTS SYNC
  // ═══════════════════════════════════════════════════════════════════════════
  describe('3. AdminCRUD Dashboard: Navigation, Moderation & Tab Switching', () => {
    
    it('renders and allows tab switching between LMS courses, events, opps, and join requests', async () => {
      setAuthRole('admin'); // Has approve:users

      render(<AdminCRUD />);

      // Default tab: courses
      expect(screen.getByText('زمالة طب الكوارث المناخية')).toBeInTheDocument();

      // Switch to Events tab
      const eventsTabBtn = screen.getByText('إدارة الفعاليات');
      fireEvent.click(eventsTabBtn);
      expect(screen.getByText('ورشة عمل: تقييم الأثر البيئي')).toBeInTheDocument();

      // Switch to Opportunities tab
      const oppsTabBtn = screen.getByText('إدارة الفرص والمنح');
      fireEvent.click(oppsTabBtn);
      expect(screen.getByText('زمالة VSCHEF للأبحاث البيئية')).toBeInTheDocument();

      // Switch to Join Requests tab
      const joinRequestsTabBtn = screen.getByText('طلبات الانضمام');
      fireEvent.click(joinRequestsTabBtn);

      // Verify mock join request is displayed
      await waitFor(() => {
        expect(screen.getByText('د. مريم العتيبي')).toBeInTheDocument();
      });

      // Test approving a request in AdminCRUD
      const approveButtons = screen.getAllByRole('button', { name: /قبول/i });
      fireEvent.click(approveButtons[0]);

      expect(window.alert).toHaveBeenCalledWith('تم قبول طلب العضو وإضافته إلى دليل الأعضاء بنجاح!');
    });

    it('creates new items and deletes existing ones', () => {
      setAuthRole('admin');
      render(<AdminCRUD />);

      // Delete existing course
      expect(screen.getByText('إدارة مخلفات المستشفيات الخضراء')).toBeInTheDocument();
      const deleteButtons = screen.getAllByRole('button', { name: /حذف السجل/i });
      fireEvent.click(deleteButtons[1]);
      expect(screen.queryByText('إدارة مخلفات المستشفيات الخضراء')).toBeNull();

      // Add a new course
      const titleInput = document.querySelector('form input[required]');
      const categoryInput = screen.getByPlaceholderText('مثال: طبي بيئي');
      fireEvent.input(titleInput, { target: { value: 'كورس جودة الهواء المتقدم' } });
      fireEvent.input(categoryInput, { target: { value: 'صحي' } });

      const submitBtn = screen.getByRole('button', { name: /نشر وتخزين السجل/i });
      fireEvent.click(submitBtn);

      expect(screen.getByText('كورس جودة الهواء المتقدم')).toBeInTheDocument();
    });
  });
});
