import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { CertificateVerificationPage } from '../features/learning-hub/components/certificates/CertificateVerificationPage';
import { CertificateGenerator } from '../features/learning-hub/components/certificates/CertificateGenerator';
import { CertificateAuditDashboard } from '../features/admin/components/CertificateAuditDashboard';
import { supabase } from '../utils/supabaseClient';

// Mock useAuth
const mockUser = { id: 'usr-admin-1', email: 'admin@climamedix.org' };
let mockPermissions = ['issue:certs', 'manage:system'];
let mockAuthLoading = false;

vi.mock('../features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    userProfile: { role: 'admin', full_name: 'Dr. Admin' },
    hasPermission: vi.fn((perm) => mockPermissions.includes(perm)),
    loading: mockAuthLoading
  })
}));

// Setup Canvas 2D Context Mock
let mockCtx;

function setupCanvasMock() {
  mockCtx = {
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    fillText: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: ''
  };

  HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCtx);
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mockCertificateData');
}

const sampleCertRequests = [
  {
    id: 'cert-1',
    user_id: 'usr-student-1',
    course_id: 'crs-101',
    requested_name_ar: 'د. مريم العتيبي',
    requested_name_en: 'Dr. Maryam Al-Otaibi',
    status: 'approved',
    requested_at: '2026-09-10T08:00:00Z',
    courses: {
      title_ar: 'زمالة طب المناخ والكوارث',
      title_en: 'Climate & Disaster Medicine Fellowship',
      duration: 3600
    }
  },
  {
    id: 'cert-pending-1',
    user_id: 'usr-student-2',
    course_id: 'crs-102',
    requested_name_ar: 'د. فاطمة الزهراء',
    requested_name_en: 'Dr. Fatima Zahra',
    status: 'pending',
    requested_at: '2026-09-20T10:00:00Z',
    courses: {
      title_ar: 'مقدمة في صحة المناخ',
      title_en: 'Intro to Climate Health',
      duration: 5400
    }
  },
  {
    id: 'cert-pending-2',
    user_id: 'usr-student-3',
    course_id: 'crs-103',
    requested_name_ar: 'د. طارق السعيد',
    requested_name_en: 'Dr. Tariq Saeed',
    status: 'pending',
    requested_at: '2026-09-21T12:00:00Z',
    courses: {
      title_ar: 'إدارة الكوارث الصحية',
      title_en: 'Health Disaster Management',
      duration: 7200
    }
  }
];

function setupSupabaseMock({ certReqs = sampleCertRequests, metrics = [], quizzes = [] } = {}) {
  supabase.from = vi.fn((table) => {
    if (table === 'certificate_requests') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn((field, val) => {
            if (field === 'id') {
              return {
                eq: vi.fn((statusField, statusVal) => ({
                  single: vi.fn().mockImplementation(async () => {
                    const match = certReqs.find(c => c.id === val && c.status === statusVal);
                    if (match) return { data: match, error: null };
                    return { data: null, error: new Error('Not found') };
                  })
                }))
              };
            }
            // For pending list query: .eq('status', 'pending').order(...)
            return {
              order: vi.fn().mockResolvedValue({
                data: certReqs.filter(c => c.status === val),
                error: null
              })
            };
          })
        })),
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null })
        }))
      };
    }
    if (table === 'lesson_watch_metrics') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: metrics, error: null })
        }))
      };
    }
    if (table === 'quiz_attempts') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ data: quizzes, error: null })
          }))
        }))
      };
    }
    return {
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: [], error: null })
      }))
    };
  });
}

describe('Certificate Verification, Generation & Audit Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    setupCanvasMock();
    mockPermissions = ['issue:certs', 'manage:system'];
    mockAuthLoading = false;
    window.alert = vi.fn();
    setupSupabaseMock();
  });

  // =========================================================================
  // 1. CERTIFICATE VERIFICATION PAGE (15 tests)
  // =========================================================================
  describe('CertificateVerificationPage Component', () => {
    it('displays loading message while verifying in Arabic', () => {
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () => new Promise(() => {}) // pending
            })
          })
        })
      });

      render(<CertificateVerificationPage lang="ar" certId="cert-1" />);
      expect(screen.getByText('جاري التحقق من صحة الشهادة...')).toBeInTheDocument();
    });

    it('displays loading message while verifying in English', () => {
      supabase.from = vi.fn().mockReturnValue({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () => new Promise(() => {})
            })
          })
        })
      });

      render(<CertificateVerificationPage lang="en" certId="cert-1" />);
      expect(screen.getByText('Verifying certificate...')).toBeInTheDocument();
    });

    it('queries certificate_requests for approved cert matching certId', async () => {
      render(<CertificateVerificationPage lang="ar" certId="cert-1" />);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('certificate_requests');
      });
    });

    it('shows "شهادة غير صالحة" in Arabic when certificate is not found', async () => {
      render(<CertificateVerificationPage lang="ar" certId="non-existent-id" />);
      expect(await screen.findByText('شهادة غير صالحة')).toBeInTheDocument();
      expect(screen.getByText('لم يتم العثور على شهادة معتمدة بهذا المعرف')).toBeInTheDocument();
    });

    it('shows "Invalid Certificate" in English when certificate is not found', async () => {
      render(<CertificateVerificationPage lang="en" certId="non-existent-id" />);
      expect(await screen.findByText('Invalid Certificate')).toBeInTheDocument();
      expect(screen.getByText('No approved certificate found with this ID')).toBeInTheDocument();
    });

    it('shows invalid certificate when cert exists but status is pending', async () => {
      render(<CertificateVerificationPage lang="ar" certId="cert-pending-1" />);
      expect(await screen.findByText('شهادة غير صالحة')).toBeInTheDocument();
    });

    it('handles unexpected database exception during verification in Arabic', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      supabase.from = vi.fn().mockImplementation(() => {
        throw new Error('Connection refused');
      });

      render(<CertificateVerificationPage lang="ar" certId="broken-id" />);
      expect(await screen.findByText('حدث خطأ أثناء التحقق')).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalledWith('Verification error:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('handles unexpected database exception in English mode', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      supabase.from = vi.fn().mockImplementation(() => {
        throw new Error('Database down');
      });

      render(<CertificateVerificationPage lang="en" certId="broken-id" />);
      expect(await screen.findByText('Error during verification')).toBeInTheDocument();
      consoleSpy.mockRestore();
    });

    it('renders CertificateGenerator when certificate is successfully verified', async () => {
      render(<CertificateVerificationPage lang="ar" certId="cert-1" />);
      expect(await screen.findByText('تحميل الشهادة بصيغة PNG')).toBeInTheDocument();
      expect(screen.getByText('إغلاق النافذة')).toBeInTheDocument();
    });

    it('draws recipient Arabic name on canvas when verified', async () => {
      render(<CertificateVerificationPage lang="ar" certId="cert-1" />);
      await screen.findByText('تحميل الشهادة بصيغة PNG');
      await waitFor(() => {
        expect(mockCtx.fillText).toHaveBeenCalledWith('د. مريم العتيبي', 400, 280);
      });
    });

    it('draws course title in Arabic when verified', async () => {
      render(<CertificateVerificationPage lang="ar" certId="cert-1" />);
      await screen.findByText('تحميل الشهادة بصيغة PNG');
      await waitFor(() => {
        expect(mockCtx.fillText).toHaveBeenCalledWith('زمالة طب المناخ والكوارث', 400, 380);
      });
    });

    it('draws course title in English when lang is en', async () => {
      render(<CertificateVerificationPage lang="en" certId="cert-1" />);
      await screen.findByText('تحميل الشهادة بصيغة PNG');
      await waitFor(() => {
        expect(mockCtx.fillText).toHaveBeenCalledWith('Climate & Disaster Medicine Fellowship', 400, 380);
      });
    });

    it('does not trigger verifyCert if certId is not provided', () => {
      supabase.from = vi.fn();
      render(<CertificateVerificationPage lang="ar" certId={null} />);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('closes modal and navigates to root "/" when clicking close', async () => {
      delete window.location;
      window.location = { href: 'https://climamedix.org/verify-cert?id=cert-1' };

      render(<CertificateVerificationPage lang="ar" certId="cert-1" />);
      const closeBtn = await screen.findByText('إغلاق النافذة');
      fireEvent.click(closeBtn);
      expect(window.location.href).toBe('/');
    });

    it('sets RTL direction on error container when lang is ar', async () => {
      const { container } = render(<CertificateVerificationPage lang="ar" certId="bad-id" />);
      const errBox = await screen.findByText('شهادة غير صالحة');
      expect(errBox.closest('div[style*="direction"]')).toHaveStyle({ direction: 'rtl' });
    });
  });

  // =========================================================================
  // 2. CERTIFICATE GENERATOR (CANVAS ENGINE) (16 tests)
  // =========================================================================
  describe('CertificateGenerator Component: Canvas Rendering & Export', () => {
    it('sets canvas dimensions to 800x560 for high-res print', () => {
      const { container } = render(
        <CertificateGenerator
          recipientName="د. ريم الناصر"
          courseTitle="طب الطوارئ المناخي"
          certId="CERT-9900"
          onClose={vi.fn()}
        />
      );

      const canvas = container.querySelector('canvas');
      expect(canvas.width).toBe(800);
      expect(canvas.height).toBe(560);
    });

    it('draws linear gradient background on canvas', () => {
      render(
        <CertificateGenerator
          recipientName="د. ريم الناصر"
          courseTitle="طب الطوارئ المناخي"
          certId="CERT-9900"
          onClose={vi.fn()}
        />
      );

      expect(mockCtx.createLinearGradient).toHaveBeenCalledWith(0, 0, 800, 560);
      expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 800, 560);
    });

    it('draws double decorative outer and inner borders', () => {
      render(
        <CertificateGenerator
          recipientName="د. ريم الناصر"
          courseTitle="طب الطوارئ المناخي"
          certId="CERT-9900"
          onClose={vi.fn()}
        />
      );

      // Outer border: (20, 20, 760, 520)
      expect(mockCtx.strokeRect).toHaveBeenCalledWith(20, 20, 760, 520);
      // Inner border: (30, 30, 740, 500)
      expect(mockCtx.strokeRect).toHaveBeenCalledWith(30, 30, 740, 500);
    });

    it('draws 4 corner accent rectangles', () => {
      render(
        <CertificateGenerator
          recipientName="د. ريم الناصر"
          courseTitle="طب الطوارئ المناخي"
          certId="CERT-9900"
          onClose={vi.fn()}
        />
      );

      expect(mockCtx.fillRect).toHaveBeenCalledWith(20, 20, 40, 40);
      expect(mockCtx.fillRect).toHaveBeenCalledWith(740, 20, 40, 40);
      expect(mockCtx.fillRect).toHaveBeenCalledWith(20, 500, 40, 40);
      expect(mockCtx.fillRect).toHaveBeenCalledWith(740, 500, 40, 40);
    });

    it('draws Climamedix Academy Arabic and English headers', () => {
      render(
        <CertificateGenerator
          recipientName="د. ريم الناصر"
          courseTitle="طب الطوارئ المناخي"
          certId="CERT-9900"
          onClose={vi.fn()}
        />
      );

      expect(mockCtx.fillText).toHaveBeenCalledWith('أكاديمية كلايما ميدكس للمناخ والصحة', 400, 85);
      expect(mockCtx.fillText).toHaveBeenCalledWith('CLIMAMEDIX ACADEMY FOR CLIMATE & HEALTH', 400, 105);
    });

    it('draws certificate main title "شهادة إتمام معتمدة"', () => {
      render(
        <CertificateGenerator
          recipientName="د. ريم الناصر"
          courseTitle="طب الطوارئ المناخي"
          certId="CERT-9900"
          onClose={vi.fn()}
        />
      );

      expect(mockCtx.fillText).toHaveBeenCalledWith('شهادة إتمام معتمدة', 400, 170);
    });

    it('draws certificate body intro text', () => {
      render(
        <CertificateGenerator
          recipientName="د. ريم الناصر"
          courseTitle="طب الطوارئ المناخي"
          certId="CERT-9900"
          onClose={vi.fn()}
        />
      );

      expect(mockCtx.fillText).toHaveBeenCalledWith('تشهد الأكاديمية بأن الباحث / الممارس الصحي', 400, 230);
    });

    it('draws recipient name centered with bold 28px font', () => {
      render(
        <CertificateGenerator
          recipientName="د. ريم الناصر"
          courseTitle="طب الطوارئ المناخي"
          certId="CERT-9900"
          onClose={vi.fn()}
        />
      );

      expect(mockCtx.fillText).toHaveBeenCalledWith('د. ريم الناصر', 400, 280);
    });

    it('draws course title centered with bold 20px font', () => {
      render(
        <CertificateGenerator
          recipientName="د. ريم الناصر"
          courseTitle="طب الطوارئ المناخي"
          certId="CERT-9900"
          onClose={vi.fn()}
        />
      );

      expect(mockCtx.fillText).toHaveBeenCalledWith('طب الطوارئ المناخي', 400, 380);
    });

    it('draws issue date text', () => {
      render(
        <CertificateGenerator
          recipientName="د. ريم الناصر"
          courseTitle="طب الطوارئ المناخي"
          certId="CERT-9900"
          onClose={vi.fn()}
        />
      );

      expect(mockCtx.fillText).toHaveBeenCalledWith(expect.stringContaining('تاريخ الإصدار:'), 400, 435);
    });

    it('draws academic signature line and title', () => {
      render(
        <CertificateGenerator
          recipientName="د. ريم الناصر"
          courseTitle="طب الطوارئ المناخي"
          certId="CERT-9900"
          onClose={vi.fn()}
        />
      );

      expect(mockCtx.moveTo).toHaveBeenCalledWith(150, 485);
      expect(mockCtx.lineTo).toHaveBeenCalledWith(280, 485);
      expect(mockCtx.fillText).toHaveBeenCalledWith('مدير التدريب الأكاديمي', 215, 500);
    });

    it('draws circular gold seal with "SEAL" text', () => {
      render(
        <CertificateGenerator
          recipientName="د. ريم الناصر"
          courseTitle="طب الطوارئ المناخي"
          certId="CERT-9900"
          onClose={vi.fn()}
        />
      );

      expect(mockCtx.arc).toHaveBeenCalledWith(580, 475, 30, 0, 2 * Math.PI);
      expect(mockCtx.fillText).toHaveBeenCalledWith('SEAL', 580, 478);
    });

    it('draws reference verification ID when certId is provided', () => {
      render(
        <CertificateGenerator
          recipientName="د. ريم الناصر"
          courseTitle="طب الطوارئ المناخي"
          certId="REF-HASH-9988"
          onClose={vi.fn()}
        />
      );

      expect(mockCtx.fillText).toHaveBeenCalledWith('رقم التوثيق المرجعي: REF-HASH-9988', 400, 520);
    });

    it('does not draw verification ID when certId is null', () => {
      render(
        <CertificateGenerator
          recipientName="د. ريم الناصر"
          courseTitle="طب الطوارئ المناخي"
          certId={null}
          onClose={vi.fn()}
        />
      );

      const calls = mockCtx.fillText.mock.calls.map(c => c[0]);
      const hasRefId = calls.some(text => typeof text === 'string' && text.startsWith('رقم التوثيق المرجعي:'));
      expect(hasRefId).toBe(false);
    });

    it('triggers PNG download with sanitized recipient name in filename', () => {
      const clickMock = vi.fn();
      const origCreateElement = document.createElement.bind(document);
      const createSpy = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
        const el = origCreateElement(tag);
        if (tag === 'a') {
          el.click = clickMock;
        }
        return el;
      });

      render(
        <CertificateGenerator
          recipientName="د. ريم الناصر"
          courseTitle="طب الطوارئ المناخي"
          certId="CERT-9900"
          onClose={vi.fn()}
        />
      );

      const downloadBtn = screen.getByText('تحميل الشهادة بصيغة PNG');
      fireEvent.click(downloadBtn);

      expect(clickMock).toHaveBeenCalled();
      createSpy.mockRestore();
    });

    it('calls onClose callback when clicking "إغلاق النافذة" button', () => {
      const closeMock = vi.fn();
      render(
        <CertificateGenerator
          recipientName="د. ريم الناصر"
          courseTitle="طب الطوارئ المناخي"
          certId="CERT-9900"
          onClose={closeMock}
        />
      );

      const closeBtn = screen.getByText('إغلاق النافذة');
      fireEvent.click(closeBtn);

      expect(closeMock).toHaveBeenCalled();
    });

    it('copies verification URL to clipboard when "نسخ الرابط" is clicked', () => {
      const writeTextMock = vi.fn().mockResolvedValue();
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock
        }
      });

      render(
        <CertificateGenerator
          recipientName="د. ريم الناصر"
          courseTitle="طب الطوارئ المناخي"
          certId="CERT-9900"
          onClose={vi.fn()}
        />
      );

      const copyBtn = screen.getByText('نسخ الرابط');
      fireEvent.click(copyBtn);

      expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('/verify/CERT-9900'));
    });
  });

  // =========================================================================
  // 3. CERTIFICATE AUDIT DASHBOARD (19 tests)
  // =========================================================================
  describe('CertificateAuditDashboard Component: Admin Review, Telemetry & Approval', () => {
    it('shows checking permissions state when authLoading is true', () => {
      mockAuthLoading = true;
      render(<CertificateAuditDashboard lang="ar" />);
      expect(screen.getByText('جاري التحقق من الصلاحيات...')).toBeInTheDocument();
    });

    it('shows checking permissions state in English when authLoading is true', () => {
      mockAuthLoading = true;
      render(<CertificateAuditDashboard lang="en" />);
      expect(screen.getByText('Checking Permissions...')).toBeInTheDocument();
    });

    it('denies access if user lacks both "issue:certs" and "manage:system" in Arabic', () => {
      mockPermissions = [];
      render(<CertificateAuditDashboard lang="ar" />);
      expect(screen.getByText('غير مصرح بالدخول')).toBeInTheDocument();
      expect(screen.getByText('ليس لديك صلاحيات لتدقيق الشهادات.')).toBeInTheDocument();
    });

    it('denies access if user lacks permissions in English', () => {
      mockPermissions = [];
      render(<CertificateAuditDashboard lang="en" />);
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText('You do not have permissions to audit certificates.')).toBeInTheDocument();
    });

    it('permits access if user has only "issue:certs"', async () => {
      mockPermissions = ['issue:certs'];
      render(<CertificateAuditDashboard lang="ar" />);
      expect(await screen.findByText('مراجعة طلبات الشهادات (تدقيق النزاهة)')).toBeInTheDocument();
    });

    it('permits access if user has only "manage:system"', async () => {
      mockPermissions = ['manage:system'];
      render(<CertificateAuditDashboard lang="ar" />);
      expect(await screen.findByText('مراجعة طلبات الشهادات (تدقيق النزاهة)')).toBeInTheDocument();
    });

    it('fetches pending certificate requests on mount', async () => {
      render(<CertificateAuditDashboard lang="ar" />);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('certificate_requests');
      });
    });

    it('renders list of pending student certificate requests in Arabic', async () => {
      render(<CertificateAuditDashboard lang="ar" />);
      expect(await screen.findByText(/د\. فاطمة الزهراء/)).toBeInTheDocument();
      expect(screen.getByText(/د\. طارق السعيد/)).toBeInTheDocument();
      expect(screen.getByText('مقدمة في صحة المناخ')).toBeInTheDocument();
    });

    it('shows empty state when there are 0 pending requests in Arabic', async () => {
      setupSupabaseMock({ certReqs: [] });
      render(<CertificateAuditDashboard lang="ar" />);
      expect(await screen.findByText('لا توجد طلبات معلقة.')).toBeInTheDocument();
    });

    it('shows empty state when there are 0 pending requests in English', async () => {
      setupSupabaseMock({ certReqs: [] });
      render(<CertificateAuditDashboard lang="en" />);
      expect(await screen.findByText('No pending requests.')).toBeInTheDocument();
    });

    it('renders banner title and pending status badge in English', async () => {
      render(<CertificateAuditDashboard lang="en" />);
      expect(await screen.findByText('Certificate Audit Dashboard')).toBeInTheDocument();
      const pendingBadges = screen.getAllByText('Pending');
      expect(pendingBadges.length).toBeGreaterThan(0);
    });

    it('selecting a request opens audit details panel', async () => {
      render(<CertificateAuditDashboard lang="ar" />);
      const card = await screen.findByText(/د\. فاطمة الزهراء/);
      fireEvent.click(card);

      expect(await screen.findByText('تفاصيل التدقيق')).toBeInTheDocument();
      expect(screen.getByText('المساق')).toBeInTheDocument();
      expect(screen.getByText('نتائج الاختبارات النهائية')).toBeInTheDocument();
      expect(screen.getByText('سجل تتبع النزاهة (Telemetry)')).toBeInTheDocument();
    });

    it('displays audit details panel in English', async () => {
      render(<CertificateAuditDashboard lang="en" />);
      const card = await screen.findByText(/Dr\. Fatima Zahra/);
      fireEvent.click(card);

      expect(await screen.findByText('Audit Details')).toBeInTheDocument();
      expect(screen.getByText('Course')).toBeInTheDocument();
      expect(screen.getByText('Final Quiz Results')).toBeInTheDocument();
      expect(screen.getByText('Integrity Telemetry Log')).toBeInTheDocument();
    });

    it('displays "لا يوجد أي اختبار مجتاز مسجل." when user has 0 passed quizzes', async () => {
      setupSupabaseMock({ quizzes: [] });
      render(<CertificateAuditDashboard lang="ar" />);
      const card = await screen.findByText(/د\. فاطمة الزهراء/);
      fireEvent.click(card);

      expect(await screen.findByText('لا يوجد أي اختبار مجتاز مسجل.')).toBeInTheDocument();
    });

    it('displays passed quiz results when user has completed quiz', async () => {
      const mockQuizzes = [
        { score: 92, passed: true, quizzes: { course_id: 'crs-102', title_ar: 'اختبار المناخ والصحة' } }
      ];
      setupSupabaseMock({ quizzes: mockQuizzes });

      render(<CertificateAuditDashboard lang="ar" />);
      const card = await screen.findByText(/د\. فاطمة الزهراء/);
      fireEvent.click(card);

      expect(await screen.findByText('اختبار المناخ والصحة')).toBeInTheDocument();
      expect(screen.getByText('92% - مجتاز')).toBeInTheDocument();
    });

    it('displays "لا يوجد أي سجل نشاط لهذا المستخدم." when watch metrics are empty', async () => {
      setupSupabaseMock({ metrics: [] });
      render(<CertificateAuditDashboard lang="ar" />);
      const card = await screen.findByText(/د\. فاطمة الزهراء/);
      fireEvent.click(card);

      expect(await screen.findByText(/لا يوجد أي سجل نشاط لهذا المستخدم/)).toBeInTheDocument();
    });

    it('flags suspicious video scrubbing telemetry with warning alert', async () => {
      const mockMetrics = [
        { max_percentage_watched: 95, actual_play_duration_seconds: 4 } // skipped!
      ];
      setupSupabaseMock({ metrics: mockMetrics });

      render(<CertificateAuditDashboard lang="ar" />);
      const card = await screen.findByText(/د\. فاطمة الزهراء/);
      fireEvent.click(card);

      expect(await screen.findByText('⚠️ نشاط مشبوه (تخطي الفيديو)')).toBeInTheDocument();
      expect(screen.getByText('أقصى نسبة مشاهدة: 95%')).toBeInTheDocument();
      expect(screen.getByText('مدة التشغيل الفعلية: 4 ثانية')).toBeInTheDocument();
    });

    it('approves certificate request and removes it from pending list', async () => {
      render(<CertificateAuditDashboard lang="ar" />);
      const card = await screen.findByText(/د\. فاطمة الزهراء/);
      fireEvent.click(card);

      const approveBtn = await screen.findByText('اعتماد الشهادة');
      fireEvent.click(approveBtn);

      await waitFor(() => {
        expect(screen.queryByText('تفاصيل التدقيق')).not.toBeInTheDocument();
        expect(screen.queryByText(/د\. فاطمة الزهراء/)).not.toBeInTheDocument();
      });
    });

    it('rejects certificate request when rejection reason is provided', async () => {
      render(<CertificateAuditDashboard lang="ar" />);
      const card = await screen.findByText(/د\. فاطمة الزهراء/);
      fireEvent.click(card);

      const reasonInput = screen.getByPlaceholderText('سبب الرفض (إلزامي)');
      fireEvent.input(reasonInput, { target: { value: 'عدم اكتمال المشاهدة' } });

      const rejectBtn = screen.getByText('رفض الطلب');
      fireEvent.click(rejectBtn);

      await waitFor(() => {
        expect(screen.queryByText('تفاصيل التدقيق')).not.toBeInTheDocument();
        expect(screen.queryByText(/د\. فاطمة الزهراء/)).not.toBeInTheDocument();
      });
    });
  });
});
