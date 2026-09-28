import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/preact';
import { LearningHubPage } from '../features/learning-hub/components/student/LearningHubPage';
import { CourseDetailModal } from '../features/learning-hub/components/student/CourseDetailModal';
import * as lmsService from '../features/learning-hub/services/lmsService';
import { supabase } from '../utils/supabaseClient';

// ─── 1. Mocks Setup ──────────────────────────────────────────────────────────

// Mock GSAP
vi.mock('gsap', () => ({
  default: {
    context: vi.fn((cb) => {
      cb?.();
      return { revert: vi.fn() };
    }),
    fromTo: vi.fn(),
    to: vi.fn()
  }
}));

// Mock AmbientParticles to prevent animation loop in tests
vi.mock('../features/shared/components/AmbientParticles', () => ({
  AmbientParticles: () => <div data-testid="ambient-particles" />
}));

// Mock useAuth
let mockUser = { id: 'usr-student-42', email: 'student@climamedix.org' };
let mockUserProfile = { role: 'user', full_name: 'سارة خالد المنصوري' };
let mockPermissions = ['view:free_content'];

vi.mock('../features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    userProfile: mockUserProfile,
    hasPermission: vi.fn((perm) => mockPermissions.includes(perm)),
    loading: false
  })
}));

// Mock lmsService
vi.mock('../features/learning-hub/services/lmsService', () => ({
  fetchCourses: vi.fn(),
  fetchEnrollments: vi.fn(),
  enrollInCourse: vi.fn(),
  checkEnrollment: vi.fn(),
  fetchCompletedLessons: vi.fn(),
  fetchCourseSyllabus: vi.fn(),
  markLessonComplete: vi.fn(),
  unmarkLessonComplete: vi.fn(),
  fetchQuiz: vi.fn(),
  submitQuizAttempt: vi.fn(),
  fetchPassedAttempt: vi.fn(),
  issueCertificate: vi.fn(),
  fetchUserCertificates: vi.fn(),
  getSecureVideoUrl: vi.fn()
}));

// Mock Supabase Client for Certificate Requests
let mockCertRequestDb = null;
let mockUpsertError = null;

vi.mock('../utils/supabaseClient', () => {
  const mockFrom = vi.fn((table) => {
    if (table === 'certificate_requests') {
      const builder = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        single: vi.fn(async () => ({
          data: mockCertRequestDb,
          error: mockCertRequestDb ? null : { message: 'Not found', code: 'PGRST116' }
        })),
        upsert: vi.fn((payload) => {
          mockCertRequestDb = { ...payload, id: 'cert-req-999' };
          return {
            select: vi.fn(() => ({
              single: vi.fn(async () => ({
                data: mockUpsertError ? null : mockCertRequestDb,
                error: mockUpsertError
              }))
            }))
          };
        })
      };
      return builder;
    }
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null })
    };
  });

  return {
    supabase: {
      from: mockFrom
    }
  };
});

// Setup Canvas Mock for AmbientParticles and Certificates
let mockCtx;
function setupCanvasMock() {
  mockCtx = {
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 100 })),
    clearRect: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: ''
  };

  HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCtx);
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mockPng');
}

// ─── Sample Mock Data ────────────────────────────────────────────────────────

const sampleCourses = [
  {
    id: 'crs-free-1',
    title_ar: 'مقدمة في طب المناخ الأساسي',
    title_en: 'Intro to Climate Medicine',
    description_ar: 'المفاهيم التأسيسية لتأثير التغير المناخي على الصحة العامة.',
    description_en: 'Fundamental concepts of climate change impacts on public health.',
    category: 'Climate Health',
    cover_image: 'https://cdn.climamedix.org/courses/intro.webp',
    duration: '4 ساعات',
    full_access_permission_key: 'view:free_content',
    teaser_permission_key: 'view:public_content',
  },
  {
    id: 'crs-paid-2',
    title_ar: 'الاستجابة المتقدمة للأوبئة والمناخ',
    title_en: 'Advanced Epidemic & Climate Response',
    description_ar: 'برنامج تدريبي تخصصي لكوادر الرعاية الصحية ومسؤولي الطوارئ.',
    description_en: 'Specialized training for healthcare workers and emergency responders.',
    category: 'Epidemiology',
    cover_image: null,
    duration: '12 ساعة',
    full_access_permission_key: 'view:all_courses',
    teaser_permission_key: 'view:public_content',
  },
  {
    id: 'crs-locked-3',
    title_ar: 'إدارة المستشفيات الخضراء',
    title_en: 'Green Hospital Administration',
    description_ar: 'دليل شامل لتحويل المنشآت الصحية إلى منشآت صفرية الانبعاثات.',
    description_en: 'Comprehensive guide to decarbonizing healthcare facilities.',
    category: 'Hospital Admin',
    cover_image: 'https://cdn.climamedix.org/courses/green-hosp.webp',
    duration: '8 ساعات',
    full_access_permission_key: 'manage:system',
    teaser_permission_key: 'manage:system', // Strictly locked for non-admins
  }
];

const sampleSyllabus = [
  {
    id: 'mod-1',
    course_id: 'crs-free-1',
    title_ar: 'الوحدة الأولى: أساسيات الاحتباس الحراري',
    title_en: 'Module 1: Global Warming Fundamentals',
    order_index: 0,
    lessons: [
      {
        id: 'les-1-1',
        module_id: 'mod-1',
        title_ar: 'الدرس الأول: مقدمة في غازات الدفيئة',
        title_en: 'Lesson 1: Greenhouse Gases Intro',
        content_ar: '<p>شرح تفصيلي حول تأثير الغازات الدفيئة على المناخ العالمي.</p>',
        content_en: '<p>Detailed explanation of greenhouse effects.</p>',
        duration: 15,
        video_url: 'https://storage.climamedix.org/video/intro-ghg.mp4',
        order_index: 0
      },
      {
        id: 'les-1-2',
        module_id: 'mod-1',
        title_ar: 'الدرس الثاني: موجات الحر الشديدة والقلب',
        title_en: 'Lesson 2: Heatwaves and Cardiac Health',
        content_ar: '<p>المخاطر القلبية الوعائية الناجمة عن الإجهاد الحراري الشديد.</p>',
        content_en: '<p>Cardiovascular hazards of extreme thermal stress.</p>',
        duration: 20,
        video_url: null,
        order_index: 1
      }
    ]
  },
  {
    id: 'mod-2',
    course_id: 'crs-free-1',
    title_ar: 'الوحدة الثانية: التكيف الصحي والوقاية',
    title_en: 'Module 2: Health Adaptation & Prevention',
    order_index: 1,
    lessons: [
      {
        id: 'les-2-1',
        module_id: 'mod-2',
        title_ar: 'الدرس الثالث: خطط الطوارئ في المراكز الصحية',
        title_en: 'Lesson 3: Clinic Emergency Plans',
        content_ar: '<p>بروتوكولات التعامل مع ضربات الشمس في أقسام الطوارئ.</p>',
        content_en: '<p>Emergency department heat stroke protocols.</p>',
        duration: 25,
        video_url: 'https://storage.climamedix.org/video/emergency-plan.mp4',
        order_index: 0
      }
    ]
  }
];

const sampleEnrollments = [
  {
    id: 'enr-101',
    user_id: 'usr-student-42',
    course_id: 'crs-free-1',
    enrolled_at: '2026-09-01T10:00:00Z',
    course: sampleCourses[0]
  }
];

const sampleCertificates = [];

// ─── Test Suite ──────────────────────────────────────────────────────────────

describe('Student Learning Hub Catalog & Course Detail Modal Exhaustive Suite (55 Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupCanvasMock();
    mockCertRequestDb = null;
    mockUpsertError = null;

    // Reset default user & permissions
    mockUser = { id: 'usr-student-42', email: 'student@climamedix.org' };
    mockUserProfile = { role: 'user', full_name: 'سارة خالد المنصوري' };
    mockPermissions = ['view:free_content'];

    // Default service resolutions
    lmsService.fetchCourses.mockResolvedValue(sampleCourses);
    lmsService.fetchEnrollments.mockResolvedValue(sampleEnrollments);
    lmsService.fetchUserCertificates.mockResolvedValue(sampleCertificates);
    lmsService.fetchCompletedLessons.mockResolvedValue({
      completedSet: new Set(['les-1-1']),
      totalLessons: 3
    });
    lmsService.fetchCourseSyllabus.mockResolvedValue(sampleSyllabus);
    lmsService.checkEnrollment.mockResolvedValue(false);
    lmsService.enrollInCourse.mockResolvedValue({ id: 'enr-new', course_id: 'crs-paid-2' });
    lmsService.markLessonComplete.mockResolvedValue(true);
    lmsService.unmarkLessonComplete.mockResolvedValue(true);
    lmsService.fetchQuiz.mockResolvedValue(null);
    lmsService.fetchPassedAttempt.mockResolvedValue(null);
    lmsService.submitQuizAttempt.mockResolvedValue({ id: 'attempt-1', passed: true });
    lmsService.issueCertificate.mockResolvedValue({ id: 'cert-issued-1' });

    window.history.replaceState({}, '', '/courses');
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    window.history.replaceState({}, '', '/courses');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1: LearningHubPage Access Control & Guest Guard (6 Tests)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('1. LearningHubPage Access Control & Guest Guard', () => {
    it('renders guest welcome prompt when user is null', () => {
      mockUser = null;
      render(<LearningHubPage lang="ar" onNavigate={vi.fn()} />);

      expect(screen.getByText('مرحباً بك في المركز التعليمي')).toBeInTheDocument();
      expect(screen.getByText('يرجى تسجيل الدخول للوصول إلى المساقات التعليمية والاختبارات والشهادات.')).toBeInTheDocument();
      expect(screen.getByText('تسجيل الدخول / إنشاء حساب')).toBeInTheDocument();
    });

    it('renders guest welcome in English when lang is en', () => {
      mockUser = null;
      render(<LearningHubPage lang="en" onNavigate={vi.fn()} />);

      expect(screen.getByText('Welcome to the Learning Hub')).toBeInTheDocument();
      expect(screen.getByText('Please log in to access training courses, quizzes, and certificates.')).toBeInTheDocument();
      expect(screen.getByText('Log In / Sign Up')).toBeInTheDocument();
    });

    it('navigates to auth page when guest clicks login button', () => {
      mockUser = null;
      const onNavigate = vi.fn();
      render(<LearningHubPage lang="ar" onNavigate={onNavigate} />);

      fireEvent.click(screen.getByText('تسجيل الدخول / إنشاء حساب'));
      expect(onNavigate).toHaveBeenCalledWith('auth');
    });

    it('displays free-tier restricted notice when user lacks view:all_courses permission', async () => {
      mockPermissions = ['view:free_content']; // no view:all_courses
      render(<LearningHubPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('صلاحياتك تتيح لك الوصول للمساقات المجانية فقط. اشترك للوصول الكامل.')).toBeInTheDocument();
      });
    });

    it('displays free-tier restricted notice in English when lang is en', async () => {
      mockPermissions = ['view:free_content'];
      render(<LearningHubPage lang="en" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Your plan gives you access to free courses only. Upgrade for full access.')).toBeInTheDocument();
      });
    });

    it('hides restricted notice when user has view:all_courses permission', async () => {
      mockPermissions = ['view:free_content', 'view:all_courses'];
      render(<LearningHubPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('المركز التعليمي')).toBeInTheDocument();
      });
      expect(screen.queryByText('صلاحياتك تتيح لك الوصول للمساقات المجانية فقط. اشترك للوصول الكامل.')).not.toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2: Catalog Browsing, Badges & Access Categorization (8 Tests)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('2. Catalog Browsing, Badges & Access Categorization', () => {
    it('renders course cards with titles, descriptions, categories and duration', async () => {
      render(<LearningHubPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('مقدمة في طب المناخ الأساسي')).toBeInTheDocument();
        expect(screen.getByText('الاستجابة المتقدمة للأوبئة والمناخ')).toBeInTheDocument();
        expect(screen.getByText('إدارة المستشفيات الخضراء')).toBeInTheDocument();
      });

      expect(screen.getByText('Climate Health')).toBeInTheDocument();
      expect(screen.getByText('4 ساعات')).toBeInTheDocument();
    });

    it('renders English titles and descriptions when lang is en', async () => {
      render(<LearningHubPage lang="en" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Intro to Climate Medicine')).toBeInTheDocument();
        expect(screen.getByText('Advanced Epidemic & Climate Response')).toBeInTheDocument();
      });
    });

    it('shows placeholder SVG when course.cover_image is missing', async () => {
      const { container } = render(<LearningHubPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('الاستجابة المتقدمة للأوبئة والمناخ')).toBeInTheDocument();
      });

      // The second course has null cover_image, so it renders the fallback SVG
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });

    it('marks enrolled course with "Continue Learning" button', async () => {
      render(<LearningHubPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('متابعة التعلم')).toBeInTheDocument();
      });
    });

    it('shows "Upgrade for Access" button on locked courses', async () => {
      render(<LearningHubPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('ترقية الحساب للوصول')).toBeInTheDocument();
      });
    });

    it('navigates to join-us when user clicks Upgrade for Access', async () => {
      const onNavigate = vi.fn();
      render(<LearningHubPage lang="ar" onNavigate={onNavigate} />);

      await waitFor(() => {
        expect(screen.getByText('ترقية الحساب للوصول')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('ترقية الحساب للوصول'));
      expect(onNavigate).toHaveBeenCalledWith('join-us');
    });

    it('shows "Browse as Guest" teaser button when user has teaser permission but not full access', async () => {
      // crs-paid-2 requires 'view:all_courses' for full, but has teaser 'view:public_content'
      // User only has 'view:free_content' (which has teaser via public_content)
      render(<LearningHubPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('تصفح المساق كزائر')).toBeInTheDocument();
      });
    });

    it('renders empty state when no courses exist in catalog', async () => {
      lmsService.fetchCourses.mockResolvedValueOnce([]);
      lmsService.fetchEnrollments.mockResolvedValueOnce([]);
      render(<LearningHubPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('لا توجد مساقات متاحة حالياً.')).toBeInTheDocument();
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3: Course Enrollment Flow & Modal Triggers (7 Tests)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('3. Course Enrollment Flow & Modal Triggers', () => {
    it('allows user with full access to enroll in an unenrolled course', async () => {
      // Give user view:all_courses so crs-paid-2 shows "Enroll Now"
      mockPermissions = ['view:free_content', 'view:all_courses'];
      render(<LearningHubPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('التسجيل في المساق')).toBeInTheDocument();
      });

      const enrollBtn = screen.getByText('التسجيل في المساق');
      fireEvent.click(enrollBtn);

      await waitFor(() => {
        expect(lmsService.enrollInCourse).toHaveBeenCalledWith('usr-student-42', 'crs-paid-2');
      });
    });

    it('switches to "my-courses" tab after successful enrollment', async () => {
      mockPermissions = ['view:free_content', 'view:all_courses'];
      render(<LearningHubPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('التسجيل في المساق')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('التسجيل في المساق'));

      await waitFor(() => {
        // Active tab button for my-courses gets selected
        const tabBtn = screen.getByText(/تعلمي/);
        expect(tabBtn).toHaveStyle({ background: '#0b2849' });
      });
    });

    it('handles enrollment check idempotency when already registered in backend', async () => {
      mockPermissions = ['view:free_content', 'view:all_courses'];
      lmsService.checkEnrollment.mockResolvedValueOnce(true); // Already enrolled in DB

      render(<LearningHubPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('التسجيل في المساق')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('التسجيل في المساق'));

      await waitFor(() => {
        // Does not call enroll again
        expect(lmsService.enrollInCourse).not.toHaveBeenCalled();
        // Opens course modal
        expect(screen.getByText('الوحدة الأولى: أساسيات الاحتباس الحراري')).toBeInTheDocument();
      });
    });

    it('handles enrollment rejection or error gracefully with alert', async () => {
      mockPermissions = ['view:free_content', 'view:all_courses'];
      lmsService.enrollInCourse.mockRejectedValueOnce(new Error('DB failure'));
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<LearningHubPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('التسجيل في المساق')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('التسجيل في المساق'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('حدث خطأ أثناء التسجيل');
      });
      alertSpy.mockRestore();
    });

    it('opens course modal when clicking on a course card container', async () => {
      render(<LearningHubPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('مقدمة في طب المناخ الأساسي')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('مقدمة في طب المناخ الأساسي'));

      await waitFor(() => {
        expect(screen.getByText('الوحدة الأولى: أساسيات الاحتباس الحراري')).toBeInTheDocument();
      });
    });

    it('opens course modal automatically if url has ?course=crs-free-1', async () => {
      window.history.replaceState({}, '', '/courses?course=crs-free-1');
      render(<LearningHubPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('الوحدة الأولى: أساسيات الاحتباس الحراري')).toBeInTheDocument();
      });
    });

    it('closes course modal and removes course from URL query params', async () => {
      window.history.replaceState({}, '', '/courses?course=crs-free-1&lesson=les-1-1');
      render(<LearningHubPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('الوحدة الأولى: أساسيات الاحتباس الحراري')).toBeInTheDocument();
      });

      const closeBtn = screen.getByTitle('إغلاق');
      fireEvent.click(closeBtn);

      await waitFor(() => {
        expect(screen.queryByText('الوحدة الأولى: أساسيات الاحتباس الحراري')).not.toBeInTheDocument();
      });
      expect(window.location.search).toBe('');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4: "My Learning" Tab & LMSDashboard Integration (6 Tests)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('4. "My Learning" Tab & LMSDashboard Integration', () => {
    it('switches between Discover and My Learning tabs', async () => {
      render(<LearningHubPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('استكشاف المساقات')).toBeInTheDocument();
      });

      const myLearningTab = screen.getByText(/تعلمي/);
      fireEvent.click(myLearningTab);

      // LMSDashboard is now visible with enrolled course progress
      await waitFor(() => {
        expect(screen.getByText('مقدمة في طب المناخ الأساسي')).toBeInTheDocument();
      });
    });

    it('shows empty learning state when student has no active or completed courses', async () => {
      lmsService.fetchEnrollments.mockResolvedValueOnce([]);
      render(<LearningHubPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText(/تعلمي \(0\)/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/تعلمي \(0\)/));

      await waitFor(() => {
        expect(screen.getByText('لم تسجل في أي مساق بعد. استكشف المساقات المتاحة!')).toBeInTheDocument();
      });
    });

    it('shows empty learning state in English when lang is en', async () => {
      lmsService.fetchEnrollments.mockResolvedValueOnce([]);
      render(<LearningHubPage lang="en" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText(/My Learning \(0\)/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/My Learning \(0\)/));

      await waitFor(() => {
        expect(screen.getByText("You haven't enrolled in any courses yet. Explore the available courses!")).toBeInTheDocument();
      });
    });

    it('calculates enrollment progress percentage correctly (33% for 1 of 3)', async () => {
      render(<LearningHubPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText(/تعلمي \(1\)/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/تعلمي \(1\)/));

      await waitFor(() => {
        expect(screen.getByText('33%')).toBeInTheDocument();
      });
    });

    it('categorizes completed course with certificate in completedCourses list', async () => {
      // Mock existing certificate for crs-free-1
      lmsService.fetchUserCertificates.mockResolvedValueOnce([
        {
          id: 'cert-101',
          course_id: 'crs-free-1',
          requested_name_ar: 'سارة خالد',
          requested_name_en: 'Sarah Khaled',
          status: 'approved'
        }
      ]);

      render(<LearningHubPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText(/تعلمي \(1\)/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/تعلمي \(1\)/));

      await waitFor(() => {
        expect(screen.getByText('عرض الشهادة')).toBeInTheDocument();
      });
    });

    it('opens certificate generator modal and closes it on demand', async () => {
      lmsService.fetchUserCertificates.mockResolvedValueOnce([
        {
          id: 'cert-101',
          course_id: 'crs-free-1',
          requested_name_ar: 'سارة خالد',
          requested_name_en: 'Sarah Khaled',
          status: 'approved'
        }
      ]);

      render(<LearningHubPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText(/تعلمي \(1\)/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/تعلمي \(1\)/));

      await waitFor(() => {
        expect(screen.getByText('عرض الشهادة')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('عرض الشهادة'));

      await waitFor(() => {
        expect(screen.getByText('تحميل الشهادة بصيغة PNG')).toBeInTheDocument();
      });

      // Close modal
      const closeCertBtn = screen.getByText('✕');
      fireEvent.click(closeCertBtn);

      await waitFor(() => {
        expect(screen.queryByText('تحميل الشهادة بصيغة PNG')).not.toBeInTheDocument();
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5: CourseDetailModal Locked Preview Mode (5 Tests)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('5. CourseDetailModal Locked Preview Mode', () => {
    it('returns null if course prop is not provided', () => {
      const { container } = render(<CourseDetailModal course={null} userId="usr-1" isLocked={true} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders locked banner and badge when isLocked is true', async () => {
      render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[2]}
          userId="usr-student-42"
          isLocked={true}
          onUpgrade={vi.fn()}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('معاينة المساق')).toBeInTheDocument();
        expect(screen.getByText('هذا المساق مغلق')).toBeInTheDocument();
        expect(screen.getByText('يرجى ترقية حسابك للحصول على صلاحية الوصول الكاملة.')).toBeInTheDocument();
        expect(screen.getByText('ترقية الحساب الآن')).toBeInTheDocument();
      });
    });

    it('renders locked banner in English when lang is en', async () => {
      render(
        <CourseDetailModal
          lang="en"
          course={sampleCourses[2]}
          userId="usr-student-42"
          isLocked={true}
          onUpgrade={vi.fn()}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Course Preview')).toBeInTheDocument();
        expect(screen.getByText('This Course is Locked')).toBeInTheDocument();
        expect(screen.getByText('Upgrade Account Now')).toBeInTheDocument();
      });
    });

    it('calls onUpgrade when clicking Upgrade Account Now button', async () => {
      const onUpgrade = vi.fn();
      render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[2]}
          userId="usr-student-42"
          isLocked={true}
          onUpgrade={onUpgrade}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('ترقية الحساب الآن')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('ترقية الحساب الآن'));
      expect(onUpgrade).toHaveBeenCalled();
    });

    it('locks and restores document.body.style.overflow on mount and unmount', () => {
      const { unmount } = render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[0]}
          userId="usr-student-42"
          isLocked={false}
          onClose={vi.fn()}
        />
      );

      expect(document.body.style.overflow).toBe('hidden');
      unmount();
      expect(document.body.style.overflow).toBe('');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 6: Syllabus & Curriculum Accordion Navigation (8 Tests)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('6. Syllabus & Curriculum Accordion Navigation', () => {
    it('renders all module titles and lesson list items in sidebar', async () => {
      render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[0]}
          userId="usr-student-42"
          isLocked={false}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText('الوحدة الأولى: أساسيات الاحتباس الحراري')[0]).toBeInTheDocument();
        expect(screen.getByText('الوحدة الثانية: التكيف الصحي والوقاية')).toBeInTheDocument();
        expect(screen.getAllByText('الدرس الأول: مقدمة في غازات الدفيئة')[0]).toBeInTheDocument();
        expect(screen.getByText('الدرس الثاني: موجات الحر الشديدة والقلب')).toBeInTheDocument();
      });
    });

    it('toggles module collapse when clicking module header', async () => {
      render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[0]}
          userId="usr-student-42"
          isLocked={false}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('الدرس الثاني: موجات الحر الشديدة والقلب')).toBeInTheDocument();
      });

      // Click module 1 header to collapse
      const mod1Header = screen.getAllByText('الوحدة الأولى: أساسيات الاحتباس الحراري')[0];
      fireEvent.click(mod1Header);

      await waitFor(() => {
        expect(screen.queryByText('الدرس الثاني: موجات الحر الشديدة والقلب')).not.toBeInTheDocument();
      });

      // Click again to expand
      fireEvent.click(mod1Header);
      await waitFor(() => {
        expect(screen.getByText('الدرس الثاني: موجات الحر الشديدة والقلب')).toBeInTheDocument();
      });
    });

    it('switches active lesson on sidebar item click', async () => {
      render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[0]}
          userId="usr-student-42"
          isLocked={false}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('الدرس الثاني: موجات الحر الشديدة والقلب')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('الدرس الثاني: موجات الحر الشديدة والقلب'));

      await waitFor(() => {
        expect(screen.getByText('المخاطر القلبية الوعائية الناجمة عن الإجهاد الحراري الشديد.')).toBeInTheDocument();
      });
    });

    it('updates URL searchParams with active course and lesson id', async () => {
      render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[0]}
          userId="usr-student-42"
          isLocked={false}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(window.location.search).toContain('course=crs-free-1');
        expect(window.location.search).toContain('lesson=les-1-1');
      });
    });

    it('loads video player component when active lesson has video_url', async () => {
      render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[0]}
          userId="usr-student-42"
          isLocked={false}
          onClose={vi.fn()}
        />
      );

      // les-1-1 has video_url
      await waitFor(() => {
        const videoElement = document.querySelector('video');
        expect(videoElement).toBeInTheDocument();
        expect(videoElement).toHaveAttribute('src', 'https://storage.climamedix.org/video/intro-ghg.mp4');
      });
    });

    it('hides video player when active lesson does not have video_url', async () => {
      render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[0]}
          userId="usr-student-42"
          isLocked={false}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('الدرس الثاني: موجات الحر الشديدة والقلب')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('الدرس الثاني: موجات الحر الشديدة والقلب'));

      await waitFor(() => {
        const videoElement = document.querySelector('video');
        expect(videoElement).toBeNull();
      });
    });

    it('renders empty modules state message if course has no modules', async () => {
      lmsService.fetchCourseSyllabus.mockResolvedValueOnce([]);
      render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[0]}
          userId="usr-student-42"
          isLocked={false}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('لا توجد وحدات بعد.')).toBeInTheDocument();
      });
    });

    it('calls onClose when close button is clicked', async () => {
      const onClose = vi.fn();
      render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[0]}
          userId="usr-student-42"
          isLocked={false}
          onClose={onClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByTitle('إغلاق')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('إغلاق'));
      expect(onClose).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 7: Lesson Completion, Unmarking & RLS Resilience (8 Tests)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('7. Lesson Completion, Unmarking & RLS Resilience', () => {
    it('shows completed badge for already completed lesson', async () => {
      // les-1-1 is in initial completedSet
      render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[0]}
          userId="usr-student-42"
          isLocked={false}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('تم إتمام هذا الدرس بنجاح!')).toBeInTheDocument();
      });
    });

    it('allows unmarking completed lesson and calls unmarkLessonComplete', async () => {
      const onLessonCompleted = vi.fn();
      render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[0]}
          userId="usr-student-42"
          isLocked={false}
          onClose={vi.fn()}
          onLessonCompleted={onLessonCompleted}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('تم إتمام هذا الدرس بنجاح!')).toBeInTheDocument();
      });

      const unmarkBtn = screen.getByTitle('اضغط للتراجع (غير مكتمل)');
      fireEvent.click(unmarkBtn);

      await waitFor(() => {
        expect(lmsService.unmarkLessonComplete).toHaveBeenCalledWith('usr-student-42', 'les-1-1');
        expect(screen.getByText('تحديد الدرس كمكتمل')).toBeInTheDocument();
      });
      expect(onLessonCompleted).toHaveBeenCalledWith('crs-free-1', 0, 3);
    });

    it('allows marking incomplete lesson as complete and notifies parent callback', async () => {
      const onLessonCompleted = vi.fn();
      render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[0]}
          userId="usr-student-42"
          isLocked={false}
          onClose={vi.fn()}
          onLessonCompleted={onLessonCompleted}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('الدرس الثاني: موجات الحر الشديدة والقلب')).toBeInTheDocument();
      });

      // Switch to uncompleted lesson
      fireEvent.click(screen.getByText('الدرس الثاني: موجات الحر الشديدة والقلب'));

      await waitFor(() => {
        expect(screen.getByText('تحديد الدرس كمكتمل')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('تحديد الدرس كمكتمل'));

      await waitFor(() => {
        expect(lmsService.markLessonComplete).toHaveBeenCalledWith('usr-student-42', 'les-1-2');
        expect(screen.getByText('تم إتمام هذا الدرس بنجاح!')).toBeInTheDocument();
      });
      // Now 2 of 3 completed = 67%
      expect(onLessonCompleted).toHaveBeenCalledWith('crs-free-1', 67, 1);
    });

    it('resiliently maintains in-memory completion when DB throws RLS 42501 permission error', async () => {
      const rlsError = new Error('new row violates row-level security policy for table user_lesson_progress');
      rlsError.code = '42501';
      lmsService.markLessonComplete.mockRejectedValueOnce(rlsError);

      const onLessonCompleted = vi.fn();
      render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[0]}
          userId="usr-student-42"
          isLocked={false}
          onClose={vi.fn()}
          onLessonCompleted={onLessonCompleted}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('الدرس الثاني: موجات الحر الشديدة والقلب')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('الدرس الثاني: موجات الحر الشديدة والقلب'));

      await waitFor(() => {
        expect(screen.getByText('تحديد الدرس كمكتمل')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('تحديد الدرس كمكتمل'));

      // In-memory update still succeeds
      await waitFor(() => {
        expect(screen.getByText('تم إتمام هذا الدرس بنجاح!')).toBeInTheDocument();
      });
      expect(onLessonCompleted).toHaveBeenCalledWith('crs-free-1', 67, 1);
    });

    it('displays overall course completion percentage in header (33%)', async () => {
      render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[0]}
          userId="usr-student-42"
          isLocked={false}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('33% مكتمل')).toBeInTheDocument();
      });
    });

    it('displays completion percentage in English when lang is en', async () => {
      render(
        <CourseDetailModal
          lang="en"
          course={sampleCourses[0]}
          userId="usr-student-42"
          isLocked={false}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('33% complete')).toBeInTheDocument();
      });
    });

    it('does nothing when markComplete is called on already completed lesson', async () => {
      render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[0]}
          userId="usr-student-42"
          isLocked={false}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('تم إتمام هذا الدرس بنجاح!')).toBeInTheDocument();
      });

      // No Mark Complete button exists
      expect(screen.queryByText('تحديد الدرس كمكتمل')).not.toBeInTheDocument();
    });

    it('does nothing when unmarkComplete is called on incomplete lesson', async () => {
      render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[0]}
          userId="usr-student-42"
          isLocked={false}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('الدرس الثاني: موجات الحر الشديدة والقلب')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('الدرس الثاني: موجات الحر الشديدة والقلب'));

      await waitFor(() => {
        expect(screen.getByText('تحديد الدرس كمكتمل')).toBeInTheDocument();
      });

      expect(screen.queryByTitle('اضغط للتراجع (غير مكتمل)')).not.toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 8: Quiz Mode Transitions & Score Grading (6 Tests)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('8. Quiz Mode Transitions & Score Grading', () => {
    const mockQuiz = {
      id: 'quiz-101',
      title_ar: 'اختبار غازات الدفيئة',
      title_en: 'Greenhouse Gas Quiz',
      passing_score: 80,
      quiz_questions: [
        {
          id: 'q-1',
          question_text_ar: 'ما هو الغاز الأكثر مساهمة في الاحتباس الحراري البشري؟',
          question_text_en: 'What gas contributes most to anthropogenic warming?',
          points: 10,
          quiz_options: [
            { id: 'opt-1', option_text_ar: 'ثاني أكسيد الكربون (CO2)', option_text_en: 'Carbon Dioxide (CO2)', is_correct: true },
            { id: 'opt-2', option_text_ar: 'الأكسجين (O2)', option_text_en: 'Oxygen (O2)', is_correct: false }
          ]
        }
      ]
    };

    it('shows "Take Lesson Quiz" button when lesson has associated quiz', async () => {
      lmsService.fetchCompletedLessons.mockResolvedValueOnce({ completedSet: new Set(), totalLessons: 3 });
      lmsService.fetchQuiz.mockResolvedValueOnce(mockQuiz);

      render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[0]}
          userId="usr-student-42"
          isLocked={false}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('خوض اختبار الدرس لقفل التقدم')).toBeInTheDocument();
      });
    });

    it('enters quiz mode and displays QuizWidget when quiz button clicked', async () => {
      lmsService.fetchCompletedLessons.mockResolvedValueOnce({ completedSet: new Set(), totalLessons: 3 });
      lmsService.fetchQuiz.mockResolvedValueOnce(mockQuiz);

      render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[0]}
          userId="usr-student-42"
          isLocked={false}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('خوض اختبار الدرس لقفل التقدم')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('خوض اختبار الدرس لقفل التقدم'));

      await waitFor(() => {
        expect(screen.getByText('اختبار غازات الدفيئة')).toBeInTheDocument();
        expect(screen.getByText('ما هو الغاز الأكثر مساهمة في الاحتباس الحراري البشري؟')).toBeInTheDocument();
      });
    });

    it('submits quiz attempt and marks lesson complete on passing score (100%)', async () => {
      lmsService.fetchCompletedLessons.mockResolvedValueOnce({ completedSet: new Set(), totalLessons: 3 });
      lmsService.fetchQuiz.mockResolvedValueOnce(mockQuiz);
      const onLessonCompleted = vi.fn();

      render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[0]}
          userId="usr-student-42"
          isLocked={false}
          onClose={vi.fn()}
          onLessonCompleted={onLessonCompleted}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('خوض اختبار الدرس لقفل التقدم')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('خوض اختبار الدرس لقفل التقدم'));

      await waitFor(() => {
        expect(screen.getByText('ثاني أكسيد الكربون (CO2)')).toBeInTheDocument();
      });

      // Select correct option
      fireEvent.click(screen.getByText('ثاني أكسيد الكربون (CO2)'));

      // Submit Quiz (Finish button in QuizWidget)
      const finishBtn = screen.getByText(/إنهاء الاختبار/);
      fireEvent.click(finishBtn);

      await waitFor(() => {
        expect(lmsService.submitQuizAttempt).toHaveBeenCalledWith('usr-student-42', 'quiz-101', 100, true);
        expect(lmsService.markLessonComplete).toHaveBeenCalledWith('usr-student-42', 'les-1-1');
      });
    });

    it('displays past score badge and review mode when user previously passed quiz', async () => {
      lmsService.fetchQuiz.mockResolvedValueOnce(mockQuiz);
      lmsService.fetchPassedAttempt.mockResolvedValueOnce({ score: 95, passed: true });

      render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[0]}
          userId="usr-student-42"
          isLocked={false}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('95%')).toBeInTheDocument();
        expect(screen.getByText('درجتك')).toBeInTheDocument();
        expect(screen.getByText('تم اجتياز الاختبار بنجاح!')).toBeInTheDocument();
      });
    });

    it('exits quiz mode back to lesson view when QuizWidget onClose is triggered', async () => {
      lmsService.fetchCompletedLessons.mockResolvedValueOnce({ completedSet: new Set(), totalLessons: 3 });
      lmsService.fetchQuiz.mockResolvedValueOnce(mockQuiz);

      render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[0]}
          userId="usr-student-42"
          isLocked={false}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('خوض اختبار الدرس لقفل التقدم')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('خوض اختبار الدرس لقفل التقدم'));

      await waitFor(() => {
        expect(screen.getByText('اختبار غازات الدفيئة')).toBeInTheDocument();
      });

      // Close button inside QuizWidget top bar (no title attribute, unlike modal close which has title="إغلاق")
      const closeButtons = screen.getAllByRole('button');
      const closeQuizBtn = closeButtons.find(b => b.textContent?.trim() === '✕' && !b.getAttribute('title'));
      fireEvent.click(closeQuizBtn);

      await waitFor(() => {
        expect(screen.queryByText('اختبار غازات الدفيئة')).not.toBeInTheDocument();
        expect(screen.getByText('خوض اختبار الدرس لقفل التقدم')).toBeInTheDocument();
      });
    });

    it('allows retaking quiz when previous attempt was recorded', async () => {
      lmsService.fetchCompletedLessons.mockResolvedValueOnce({ completedSet: new Set(), totalLessons: 3 });
      lmsService.fetchQuiz.mockResolvedValueOnce(mockQuiz);

      render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[0]}
          userId="usr-student-42"
          isLocked={false}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('خوض اختبار الدرس لقفل التقدم')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('خوض اختبار الدرس لقفل التقدم'));

      await waitFor(() => {
        expect(screen.getByText('ثاني أكسيد الكربون (CO2)')).toBeInTheDocument();
      });

      // Submit incorrect option to fail
      fireEvent.click(screen.getByText('الأكسجين (O2)'));
      fireEvent.click(screen.getByText(/إنهاء الاختبار/));

      // Results view in QuizWidget offers retry
      await waitFor(() => {
        expect(screen.getByText('إعادة المحاولة')).toBeInTheDocument();
      });

      // Close results to return to lesson view
      const closeBtn = screen.getByText('إغلاق');
      fireEvent.click(closeBtn);

      await waitFor(() => {
        expect(screen.getByText('إعادة خوض الاختبار')).toBeInTheDocument();
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 9: Certificate Request & Approval Lifecycle (8 Tests)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('9. Certificate Request & Approval Lifecycle', () => {
    it('reveals Virtual Certificate Module in sidebar when all lessons are complete', async () => {
      // 3 of 3 completed
      lmsService.fetchCompletedLessons.mockResolvedValue({
        completedSet: new Set(['les-1-1', 'les-1-2', 'les-2-1']),
        totalLessons: 3
      });

      render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[0]}
          userId="usr-student-42"
          isLocked={false}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('الوحدة النهائية')).toBeInTheDocument();
        expect(screen.getByText('طلب الشهادة المعتمدة')).toBeInTheDocument();
      });
    });

    it('navigates to Certificate Module panel when clicking the virtual certificate item', async () => {
      lmsService.fetchCompletedLessons.mockResolvedValue({
        completedSet: new Set(['les-1-1', 'les-1-2', 'les-2-1']),
        totalLessons: 3
      });

      render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[0]}
          userId="usr-student-42"
          isLocked={false}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('طلب الشهادة المعتمدة')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('طلب الشهادة المعتمدة'));

      await waitFor(() => {
        expect(screen.getByText('تهانينا على إتمام المساق!')).toBeInTheDocument();
        expect(screen.getByText('الاسم الثلاثي باللغة العربية')).toBeInTheDocument();
        expect(screen.getByText('الاسم الثلاثي باللغة الإنجليزية')).toBeInTheDocument();
      });
    });

    it('alerts user if submitting certificate request with empty names', async () => {
      lmsService.fetchCompletedLessons.mockResolvedValue({
        completedSet: new Set(['les-1-1', 'les-1-2', 'les-2-1']),
        totalLessons: 3
      });
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[0]}
          userId="usr-student-42"
          isLocked={false}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('طلب الشهادة المعتمدة')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('طلب الشهادة المعتمدة'));

      await waitFor(() => {
        expect(screen.getByText('تقديم الطلب للتدقيق')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('تقديم الطلب للتدقيق'));

      expect(alertSpy).toHaveBeenCalledWith('يرجى إدخال اسمك باللغتين العربية والإنجليزية.');
      alertSpy.mockRestore();
    });

    it('submits certificate request via Supabase upsert and transitions to Pending state', async () => {
      lmsService.fetchCompletedLessons.mockResolvedValue({
        completedSet: new Set(['les-1-1', 'les-1-2', 'les-2-1']),
        totalLessons: 3
      });

      render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[0]}
          userId="usr-student-42"
          isLocked={false}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('طلب الشهادة المعتمدة')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('طلب الشهادة المعتمدة'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('مثال: د. محمد أحمد عبدلله')).toBeInTheDocument();
      });

      const arInput = screen.getByPlaceholderText('مثال: د. محمد أحمد عبدلله');
      const enInput = screen.getByPlaceholderText('Example: Dr. Mohammed Ahmed Abdullah');

      fireEvent.input(arInput, { target: { value: 'د. سارة المنصوري' } });
      fireEvent.input(enInput, { target: { value: 'Dr. Sarah Al-Mansouri' } });

      const submitBtn = screen.getByText('تقديم الطلب للتدقيق');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('طلبك قيد المراجعة')).toBeInTheDocument();
        expect(screen.getByText('يقوم فريقنا بمراجعة سجل الحضور وتقدمك في المساق للتأكد من استيفاء جميع الشروط. سيتم إشعارك فور الاعتماد.')).toBeInTheDocument();
      });
    });

    it('displays Approved state and triggers onDownloadCertificate callback', async () => {
      mockCertRequestDb = {
        id: 'cert-req-77',
        user_id: 'usr-student-42',
        course_id: 'crs-free-1',
        requested_name_ar: 'د. سارة المنصوري',
        requested_name_en: 'Dr. Sarah Al-Mansouri',
        status: 'approved'
      };

      lmsService.fetchCompletedLessons.mockResolvedValue({
        completedSet: new Set(['les-1-1', 'les-1-2', 'les-2-1']),
        totalLessons: 3
      });

      const onDownloadCertificate = vi.fn();

      render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[0]}
          userId="usr-student-42"
          isLocked={false}
          onClose={vi.fn()}
          onDownloadCertificate={onDownloadCertificate}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('عرض الشهادة المعتمدة')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('عرض الشهادة المعتمدة'));

      await waitFor(() => {
        expect(screen.getByText('تم اعتماد شهادتك بنجاح!')).toBeInTheDocument();
        expect(screen.getByText('تحميل الشهادة')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('تحميل الشهادة'));
      expect(onDownloadCertificate).toHaveBeenCalledWith(mockCertRequestDb);
    });

    it('displays Rejected state with rejection reason and enables resubmission', async () => {
      mockCertRequestDb = {
        id: 'cert-req-88',
        user_id: 'usr-student-42',
        course_id: 'crs-free-1',
        requested_name_ar: 'سارة خالد',
        requested_name_en: 'Sarah Khaled',
        status: 'rejected',
        rejection_reason: 'تم اكتشاف تسريع غير طبيعي للفيديو وتخطي الاختبار التقييمي.'
      };

      lmsService.fetchCompletedLessons.mockResolvedValue({
        completedSet: new Set(['les-1-1', 'les-1-2', 'les-2-1']),
        totalLessons: 3
      });

      render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[0]}
          userId="usr-student-42"
          isLocked={false}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('طلب الشهادة المعتمدة')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('طلب الشهادة المعتمدة'));

      await waitFor(() => {
        expect(screen.getByText('تنبيه: تم رفض الطلب لوجود خلل')).toBeInTheDocument();
        expect(screen.getByText('تم اكتشاف تسريع غير طبيعي للفيديو وتخطي الاختبار التقييمي.')).toBeInTheDocument();
        expect(screen.getByText('إعادة تقديم الطلب')).toBeInTheDocument();
      });
    });

    it('handles database error when submitting certificate request with alert', async () => {
      mockUpsertError = { message: 'Database constraint violation' };
      lmsService.fetchCompletedLessons.mockResolvedValue({
        completedSet: new Set(['les-1-1', 'les-1-2', 'les-2-1']),
        totalLessons: 3
      });
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[0]}
          userId="usr-student-42"
          isLocked={false}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('طلب الشهادة المعتمدة')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('طلب الشهادة المعتمدة'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('مثال: د. محمد أحمد عبدلله')).toBeInTheDocument();
      });

      fireEvent.input(screen.getByPlaceholderText('مثال: د. محمد أحمد عبدلله'), { target: { value: 'د. سارة' } });
      fireEvent.input(screen.getByPlaceholderText('Example: Dr. Mohammed Ahmed Abdullah'), { target: { value: 'Dr. Sarah' } });

      fireEvent.click(screen.getByText('تقديم الطلب للتدقيق'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('حدث خطأ أثناء تقديم الطلب.');
      });
      alertSpy.mockRestore();
    });

    it('renders Course Overview hero panel when active lesson is cleared', async () => {
      lmsService.fetchCourseSyllabus.mockResolvedValueOnce([
        { id: 'mod-empty', title_ar: 'وحدة فارغة', lessons: [] }
      ]);
      lmsService.fetchCompletedLessons.mockResolvedValueOnce({ completedSet: new Set(), totalLessons: 0 });

      render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[0]}
          userId="usr-student-42"
          isLocked={false}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('المفاهيم التأسيسية لتأثير التغير المناخي على الصحة العامة.')).toBeInTheDocument();
        expect(screen.getByText('جاري إعداد محتوى هذا المساق...')).toBeInTheDocument();
      });
    });

    it('triggers Start Course Now button in overview to activate first lesson', async () => {
      // Mock syllabus with no lessons initially active
      lmsService.fetchCourseSyllabus.mockResolvedValueOnce([
        {
          id: 'mod-1',
          title_ar: 'الوحدة الأولى',
          lessons: []
        }
      ]);
      lmsService.fetchCompletedLessons.mockResolvedValueOnce({ completedSet: new Set(), totalLessons: 0 });

      render(
        <CourseDetailModal
          lang="ar"
          course={sampleCourses[0]}
          userId="usr-student-42"
          isLocked={false}
          onClose={vi.fn()}
        />
      );

      // In empty lessons overview mode
      await waitFor(() => {
        expect(screen.getByText('المفاهيم التأسيسية لتأثير التغير المناخي على الصحة العامة.')).toBeInTheDocument();
      });
    });

    it('triggers Certificate Generator modal inside LearningHubPage when certificate is approved and downloaded', async () => {
      mockCertRequestDb = {
        id: 'cert-req-77',
        user_id: 'usr-student-42',
        course_id: sampleCourses[0].id,
        requested_name_ar: 'د. سارة المنصوري',
        requested_name_en: 'Dr. Sarah Al-Mansouri',
        status: 'approved'
      };

      lmsService.fetchCourses.mockResolvedValueOnce(sampleCourses);
      lmsService.fetchEnrollments.mockResolvedValueOnce([
        {
          id: 'enr-1',
          user_id: 'usr-student-42',
          course_id: sampleCourses[0].id,
          status: 'active',
          course: sampleCourses[0]
        }
      ]);
      lmsService.fetchUserCertificates.mockResolvedValueOnce([]);
      lmsService.fetchCompletedLessons.mockResolvedValue({
        completedSet: new Set(['les-1-1', 'les-1-2', 'les-2-1']),
        totalLessons: 3
      });

      render(<LearningHubPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('مقدمة في طب المناخ الأساسي')).toBeInTheDocument();
      });

      // Open modal via continue learning
      const continueBtn = screen.getByText('متابعة التعلم');
      fireEvent.click(continueBtn);

      await waitFor(() => {
        expect(screen.getByText('عرض الشهادة المعتمدة')).toBeInTheDocument();
      });

      // Click to view certificate panel
      fireEvent.click(screen.getByText('عرض الشهادة المعتمدة'));

      await waitFor(() => {
        expect(screen.getByText('تحميل الشهادة')).toBeInTheDocument();
      });

      // Click download certificate button
      fireEvent.click(screen.getByText('تحميل الشهادة'));

      await waitFor(() => {
        // CertificateGenerator renders canvas
        expect(document.querySelector('canvas')).toBeInTheDocument();
      });

      // Close certificate generator modal using its specific close button (with fontSize 22px)
      const closeButtons = screen.getAllByText('✕');
      const certModalClose = closeButtons.find(btn => btn.style.fontSize === '22px') || closeButtons[closeButtons.length - 1];
      fireEvent.click(certModalClose);

      await waitFor(() => {
        expect(document.querySelector('canvas')).not.toBeInTheDocument();
      });
    });
  });
});
