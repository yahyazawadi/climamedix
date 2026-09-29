import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/preact';
import { DynamicHomeSlider } from '../features/main/components/DynamicHomeSlider';
import { LearningHubPage } from '../features/learning-hub/components/student/LearningHubPage';
import { supabase } from '../utils/supabaseClient';

// ─── Mocks Setup ─────────────────────────────────────────────────────────────

// Mock GSAP
vi.mock('gsap', () => ({
  default: {
    to: vi.fn(),
    fromTo: vi.fn(),
    context: vi.fn((cb) => {
      cb?.();
      return { revert: vi.fn() };
    })
  }
}));

// Mock useAuth
let mockUser = { id: 'usr-forward-test', email: 'forward@climamedix.org' };
let mockUserProfile = { role: 'user', full_name: 'باحث مناخي' };
let mockPermissions = new Set(['view:public_content', 'view:free_content']);

vi.mock('../features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    userProfile: mockUserProfile,
    hasPermission: (perm) => mockPermissions.has(perm),
    loading: false
  })
}));

// Mock lmsService
const mockCourseFree = {
  id: 'course-free-101',
  title_ar: 'أساسيات تغير المناخ والصحة',
  title_en: 'Fundamentals of Climate and Health',
  description_ar: 'دورة تمهيدية مفتوحة للجميع.',
  description_en: 'Introductory course open to everyone.',
  category: 'Climate & Health',
  duration: '3 hours',
  cover_image: 'https://images.climamedix.org/free-course.webp',
  full_access_permission_key: 'view:free_content',
  teaser_permission_key: 'view:public_content',
  published: true
};

const mockCoursePremium = {
  id: 'course-premium-202',
  title_ar: 'النمذجة الوبائية المتقدمة للمناخ',
  title_en: 'Advanced Climate Epidemiological Modeling',
  description_ar: 'مساق حصري يتطلب اشتراكاً مدفوعاً وصلاحيات متقدمة.',
  description_en: 'Exclusive course requiring paid subscription and advanced permissions.',
  category: 'Epidemiology',
  duration: '12 hours',
  cover_image: 'https://images.climamedix.org/premium-course.webp',
  full_access_permission_key: 'view:all_courses',
  teaser_permission_key: 'manage:any_course',
  published: true
};

vi.mock('../features/learning-hub/services/lmsService', () => ({
  fetchCourses: vi.fn(async () => [mockCourseFree, mockCoursePremium]),
  fetchEnrollments: vi.fn(async () => []),
  enrollInCourse: vi.fn(async () => ({ success: true })),
  checkEnrollment: vi.fn(async () => null),
  fetchCompletedLessons: vi.fn(async () => ({ completedSet: new Set(), totalLessons: 2 })),
  fetchCourseSyllabus: vi.fn(async () => [
    {
      id: 'mod-1',
      title_ar: 'الوحدة الأولى',
      title_en: 'Module 1',
      lessons: [
        { id: 'les-1', title_ar: 'مقدمة المساق', title_en: 'Introduction', type: 'video' },
        { id: 'les-2', title_ar: 'التحليل البيئي', title_en: 'Environmental Analysis', type: 'reading' }
      ]
    }
  ]),
  fetchQuiz: vi.fn(async () => null),
  fetchPassedAttempt: vi.fn(async () => null),
  fetchUserCertificates: vi.fn(async () => []),
  issueCertificate: vi.fn(async () => ({ id: 'cert-1' })),
  markLessonComplete: vi.fn(async () => true),
  unmarkLessonComplete: vi.fn(async () => true),
  submitQuizAttempt: vi.fn(async () => ({ id: 'attempt-1' })),
  getSecureVideoUrl: vi.fn(async (url) => url)
}));

// Mock Supabase
vi.mock('../utils/supabaseClient', () => {
  return {
    supabase: {
      from: vi.fn((table) => {
        if (table === 'home_slider') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({
                data: [
                  {
                    id: 'slide-course-1',
                    entity_type: 'course',
                    entity_id: 'course-free-101',
                    title_ar: 'سجل في دورة أساسيات المناخ',
                    title_en: 'Enroll in Climate Fundamentals Course',
                    image_url: 'https://images.climamedix.org/slider1.webp',
                    link_url: '/courses?courseId=course-free-101',
                    sequence_order: 1
                  },
                  {
                    id: 'slide-course-2',
                    entity_type: 'course',
                    entity_id: 'course-premium-202',
                    title_ar: 'مساق النمذجة الوبائية الحصري',
                    title_en: 'Exclusive Epidemiological Modeling Course',
                    image_url: 'https://images.climamedix.org/slider2.webp',
                    link_url: '/courses?courseId=course-premium-202',
                    sequence_order: 2
                  },
                  {
                    id: 'slide-research',
                    entity_type: 'research',
                    entity_id: 'pub-99',
                    title_ar: 'بحث مناخي جديد',
                    title_en: 'New Climate Research',
                    image_url: 'https://images.climamedix.org/slider3.webp',
                    link_url: '/research-detail?id=pub-99',
                    sequence_order: 3
                  }
                ],
                error: null
              }))
            }))
          };
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
            }))
          }))
        };
      })
    }
  };
});

describe('Slider Material Forwarding & Permission Enforcement Test Suite', () => {
  beforeEach(() => {
    cleanup();
    window.scrollTo = vi.fn();
    vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
    window.history.pushState({}, '', '/courses');
    mockPermissions = new Set(['view:public_content', 'view:free_content']);
    mockUser = { id: 'usr-forward-test', email: 'forward@climamedix.org' };
    mockUserProfile = { role: 'user', full_name: 'باحث مناخي' };
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('1. Slider CTA Route Forwarding Behavior', () => {
    it('accurately resolves course query route and calls onNavigate("courses")', async () => {
      const mockNavigate = vi.fn();
      render(<DynamicHomeSlider lang="ar" onNavigate={mockNavigate} />);

      await waitFor(() => {
        expect(screen.getByText('سجل في دورة أساسيات المناخ')).toBeInTheDocument();
      });

      const ctaBtn = screen.getByText('انضم للدورة التدريبية');
      fireEvent.click(ctaBtn);

      expect(mockNavigate).toHaveBeenCalledWith('courses');
      expect(window.location.pathname).toBe('/courses');
      expect(window.location.search).toBe('?courseId=course-free-101');
    });

    it('accurately resolves research route and calls onNavigate("research-detail")', async () => {
      const mockNavigate = vi.fn();
      render(<DynamicHomeSlider lang="en" onNavigate={mockNavigate} />);

      await waitFor(() => {
        expect(screen.getByText('Enroll in Climate Fundamentals Course')).toBeInTheDocument();
      });

      // Advance to the 3rd slide (research)
      const nextBtn = screen.getByLabelText('Next slide');
      fireEvent.click(nextBtn); // slide 2
      fireEvent.click(nextBtn); // slide 3

      await waitFor(() => {
        expect(screen.getByText('New Climate Research')).toBeInTheDocument();
      });

      const researchBtn = screen.getByText('Read Research');
      fireEvent.click(researchBtn);

      expect(mockNavigate).toHaveBeenCalledWith('research-detail');
      expect(window.location.pathname).toBe('/research-detail');
      expect(window.location.search).toBe('?id=pub-99');
    });
  });

  describe('2. Material Forwarding with PROPER Permissions (Unlocked Course)', () => {
    it('auto-opens course modal in unlocked mode when user has matching view permission', async () => {
      // User has view:free_content permission for mockCourseFree
      mockPermissions = new Set(['view:public_content', 'view:free_content']);
      window.history.pushState({}, '', '/courses?courseId=course-free-101');

      render(<LearningHubPage lang="ar" onNavigate={vi.fn()} />);

      // Verify course detail modal opens automatically
      await waitFor(() => {
        expect(screen.getAllByText('أساسيات تغير المناخ والصحة').length).toBeGreaterThan(0);
      });

      // Verify unlocked state: syllabus modules are visible and accessible
      await waitFor(() => {
        expect(screen.getAllByText('الوحدة الأولى').length).toBeGreaterThan(0);
        expect(screen.getAllByText('مقدمة المساق').length).toBeGreaterThan(0);
      });

      // Must NOT display locked warning
      expect(screen.queryByText('هذا المساق مغلق')).not.toBeInTheDocument();
      expect(screen.queryByText('This Course is Locked')).not.toBeInTheDocument();
    });

    it('auto-opens premium course in unlocked mode when user has view:all_courses permission (e.g. Subscriber / Admin)', async () => {
      mockPermissions = new Set(['view:public_content', 'view:free_content', 'view:all_courses']);
      window.history.pushState({}, '', '/courses?courseId=course-premium-202');

      render(<LearningHubPage lang="en" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getAllByText('Advanced Climate Epidemiological Modeling').length).toBeGreaterThan(0);
      });

      // Syllabus modules loaded
      await waitFor(() => {
        expect(screen.getAllByText('Module 1').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Introduction').length).toBeGreaterThan(0);
      });

      // Must NOT be locked
      expect(screen.queryByText('This Course is Locked')).not.toBeInTheDocument();
    });
  });

  describe('3. Material Forwarding with IMPROPER / INSUFFICIENT Permissions (Locked Course)', () => {
    it('auto-opens course modal in locked mode when user lacks view:all_courses on a premium course', async () => {
      // User only has free content permissions, attempting to access premium course
      mockPermissions = new Set(['view:public_content', 'view:free_content']);
      window.history.pushState({}, '', '/courses?courseId=course-premium-202');

      const mockNavigate = vi.fn();
      render(<LearningHubPage lang="ar" onNavigate={mockNavigate} />);

      // Modal opens
      await waitFor(() => {
        expect(screen.getAllByText('النمذجة الوبائية المتقدمة للمناخ').length).toBeGreaterThan(0);
      });

      // MUST display locked warning banner in Arabic
      await waitFor(() => {
        expect(screen.getByText('هذا المساق مغلق')).toBeInTheDocument();
        expect(screen.getByText(/يرجى ترقية حسابك للحصول على صلاحية الوصول الكاملة/i)).toBeInTheDocument();
      });

      // Clicking upgrade directs user to join-us / subscription
      const upgradeBtn = screen.getByText('ترقية الحساب الآن');
      fireEvent.click(upgradeBtn);
      expect(mockNavigate).toHaveBeenCalledWith('join-us');
    });

    it('displays English locked banner and upgrade action for English interface with improper permissions', async () => {
      mockPermissions = new Set(['view:public_content', 'view:free_content']);
      window.history.pushState({}, '', '/courses?courseId=course-premium-202');

      const mockNavigate = vi.fn();
      render(<LearningHubPage lang="en" onNavigate={mockNavigate} />);

      await waitFor(() => {
        expect(screen.getByText('This Course is Locked')).toBeInTheDocument();
        expect(screen.getByText(/Please upgrade your account to get full access to this course/i)).toBeInTheDocument();
      });

      const upgradeBtn = screen.getByText('Upgrade Account Now');
      fireEvent.click(upgradeBtn);
      expect(mockNavigate).toHaveBeenCalledWith('join-us');
    });
  });

  describe('4. Material Forwarding for Unauthenticated Guest', () => {
    it('shows login / register prompt when guest visits forwarded material url', async () => {
      mockUser = null;
      mockPermissions = new Set(['view:public_content']);
      window.history.pushState({}, '', '/courses?courseId=course-free-101');

      const mockNavigate = vi.fn();
      render(<LearningHubPage lang="ar" onNavigate={mockNavigate} />);

      // Guest banner is rendered
      expect(screen.getByText('مرحباً بك في المركز التعليمي')).toBeInTheDocument();
      const loginBtn = screen.getByText('تسجيل الدخول / إنشاء حساب');
      fireEvent.click(loginBtn);
      expect(mockNavigate).toHaveBeenCalledWith('auth');
    });
  });
});
