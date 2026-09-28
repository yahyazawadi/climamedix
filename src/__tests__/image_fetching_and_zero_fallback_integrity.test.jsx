import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/preact';
import { NewHomePage } from '../features/main/components/NewHomePage';
import { ProgramDetailModal } from '../features/programs/components/ProgramDetailModal';
import { HomeNewsWidget } from '../features/news-blog/components/HomeNewsWidget';
import { DynamicHomeSlider } from '../features/main/components/DynamicHomeSlider';
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
let mockUser = { id: 'usr-tester-1', email: 'test@climamedix.org' };
let mockUserProfile = { role: 'user', full_name: 'باحث مناخي' };
let mockPermissions = ['view:public_content', 'view:free_content'];

vi.mock('../features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    userProfile: mockUserProfile,
    hasPermission: vi.fn((perm) => mockPermissions.includes(perm)),
    loading: false
  })
}));

// Mock only map and calendar to keep DOM light and focused on image testing
vi.mock('../features/main/components/ArabWorldMap', () => ({
  ArabWorldMap: () => <div data-testid="mock-arab-world-map" />
}));

vi.mock('../features/events/components/CalendarSidebarWidget', () => ({
  CalendarSidebarWidget: () => <div data-testid="mock-calendar-widget" />
}));

// Mock Supabase
vi.mock('../utils/supabaseClient', () => ({
  supabase: {
    from: vi.fn()
  }
}));

describe('Suite 35: Image Fetching Accuracy & Zero-Fallback Integrity Matrix', () => {
  let mockSupabaseDb = {};

  beforeEach(() => {
    // 2099 future dates so .gte('event_date', today) always matches
    mockSupabaseDb = {
      publications: [
        {
          id: 'pub-live-1',
          title_ar: 'أثر تلوث الهواء على الجهاز التنفسي',
          title_en: 'Impact of Air Pollution on Respiratory Diseases',
          authors: 'د. أحمد الخالدي',
          year: '2025',
          abstract_ar: 'دراسة تحليلية دقيقة لتأثير الانبعاثات الحضرية.',
          abstract_en: 'Analytical study on urban emissions.',
          cover_image: null // Real live schema: no cover image
        },
        {
          id: 'pub-live-2',
          title_ar: 'الأمن المائي في الشرق الأوسط',
          title_en: 'Water Security in the Middle East',
          authors: 'د. ليلى عبد الرحمن',
          year: '2024',
          abstract_ar: 'تحليل جودة المياه وتغير المناخ.',
          abstract_en: 'Water quality analysis.',
          cover_image: 'https://images.unsplash.com/photo-research-real?w=800' // Real DB image when populated
        }
      ],
      courses: [
        {
          id: 'course-live-1',
          title_ar: 'الدبلوم المتقدم في السياسات الصحية وحوكمة المناخ',
          title_en: 'Advanced Diploma in Health Policy & Climate Governance',
          category: 'مسار تدريبي',
          duration: '6 أسابيع',
          cover_image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=1200'
        },
        {
          id: 'course-live-2',
          title_ar: 'إدارة النفايات الطبية الخضراء',
          title_en: 'Green Healthcare Waste Management',
          category: 'تدريب تطبيقي',
          duration: '3 أسابيع',
          cover_image: null // Null cover image in database
        }
      ],
      events: [
        {
          id: 'event-live-1',
          title_ar: 'المؤتمر الإقليمي للجاهزية الطبية وتغير المناخ 2026',
          title_en: 'Regional Conference on Healthcare Readiness 2026',
          description_ar: 'مؤتمر دولي هجين.',
          description_en: 'Hybrid international summit.',
          event_date: '2099-10-15T09:00:00+00:00',
          type_ar: 'مؤتمر سنوي',
          cover_image: null,
          image_url: null
        },
        {
          id: 'event-live-2',
          title_ar: 'ورشة عمل نظم المعلومات الجغرافية الصحية',
          title_en: 'Health GIS Workshop',
          description_ar: 'تدريب تفاعلي على برمجيات Mapbox.',
          description_en: 'Interactive Mapbox workshop.',
          event_date: '2099-11-04T14:00:00+00:00',
          type_ar: 'ورشة تفاعلية',
          cover_image: 'https://images.unsplash.com/photo-event-gis-real?w=1200',
          image_url: null
        }
      ],
      news_articles_accessible: [
        {
          id: 'news-live-1',
          title_ar: 'تقرير منظمة الصحة العالمية الجديد حول موجات الحر',
          title_en: 'New WHO Heatwaves Report',
          content_ar: '<p>تحذيرات عاجلة حول ارتفاع درجات الحرارة القياسية.</p>',
          content_en: '<p>Urgent warnings on record high temperatures.</p>',
          category: 'climate_health',
          cover_image: 'https://images.unsplash.com/photo-news-who?w=800',
          author_name: 'د. خالد الجابر',
          published_at: '2026-09-20T10:00:00Z',
          views_count: 512,
          likes_count: 88
        },
        {
          id: 'news-live-2',
          title_ar: 'إطلاق مبادرة المشافي الخضراء',
          title_en: 'Green Hospitals Initiative Launch',
          content_ar: '<p>مشروع خفض الانبعاثات في المشافي.</p>',
          category: 'research',
          cover_image: null,
          author_name: 'أحمد النجار',
          published_at: '2026-09-22T14:00:00Z',
          views_count: 310,
          likes_count: 45
        }
      ],
      home_slider: [
        {
          id: 'slide-live-1',
          title_ar: 'الريادة في الصحة المناخية',
          title_en: 'Leading Climate Health in the Arab World',
          entity_type: 'course',
          image_url: 'https://images.unsplash.com/photo-slider-real-1?w=1600',
          link_url: '/courses',
          sequence_order: 1
        }
      ]
    };

    // Generic supabase query mock router supporting select, order, gte, limit
    supabase.from.mockImplementation((table) => {
      const records = mockSupabaseDb[table] || [];
      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        limit: vi.fn().mockImplementation((num) => {
          return Promise.resolve({ data: records.slice(0, num), error: null });
        }),
        then: vi.fn().mockImplementation((resolve) => {
          return Promise.resolve(resolve({ data: records, error: null }));
        })
      };
      return queryBuilder;
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. Courses Image Fetching & Zero-Fallback Validation
  // ═══════════════════════════════════════════════════════════════════════════
  describe('1. Courses Cover Image Fetching & Zero-Fallback', () => {
    it('fetches and binds the real database cover_image URL to the img src attribute', async () => {
      render(<NewHomePage lang="ar" setCurrentView={vi.fn()} onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('الدبلوم المتقدم في السياسات الصحية وحوكمة المناخ')).toBeInTheDocument();
      });

      const courseWithImg = screen.getByAltText('الدبلوم المتقدم في السياسات الصحية وحوكمة المناخ');
      expect(courseWithImg).toBeInTheDocument();
      expect(courseWithImg.getAttribute('src')).toBe(
        'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=1200'
      );
    });

    it('does NOT render an img element or fake fallback when course cover_image is null', async () => {
      render(<NewHomePage lang="ar" setCurrentView={vi.fn()} onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('إدارة النفايات الطبية الخضراء')).toBeInTheDocument();
      });

      // No image element should exist for this course
      const nullCourseImg = screen.queryByAltText('إدارة النفايات الطبية الخضراء');
      expect(nullCourseImg).toBeNull();

      // But title, category badge and button must render cleanly
      expect(screen.getByText('إدارة النفايات الطبية الخضراء')).toBeInTheDocument();
      expect(screen.getByText('تدريب تطبيقي')).toBeInTheDocument();
    });

    it('never injects legacy bg_1.png or training1..4 fake assets for courses', async () => {
      const { container } = render(<NewHomePage lang="ar" setCurrentView={vi.fn()} onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('الدبلوم المتقدم في السياسات الصحية وحوكمة المناخ')).toBeInTheDocument();
      });

      const allImgs = container.querySelectorAll('img');
      allImgs.forEach((img) => {
        const src = img.getAttribute('src') || '';
        expect(src).not.toContain('training1');
        expect(src).not.toContain('training2');
        expect(src).not.toContain('training3');
        expect(src).not.toContain('training4');
        expect(src).not.toContain('bg_1.png');
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. Publications (Research) Image Fetching & Zero-Fallback
  // ═══════════════════════════════════════════════════════════════════════════
  describe('2. Publications (Research Papers) Image Fetching & Zero-Fallback', () => {
    it('renders clean document card without any img or broken placeholder when pub.cover_image is null', async () => {
      render(<NewHomePage lang="ar" setCurrentView={vi.fn()} onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('أثر تلوث الهواء على الجهاز التنفسي')).toBeInTheDocument();
      });

      // Zero fake image
      const nullPubImg = screen.queryByAltText('أثر تلوث الهواء على الجهاز التنفسي');
      expect(nullPubImg).toBeNull();

      // Card metadata is honest and complete
      expect(screen.getByText(/د\. أحمد الخالدي/)).toBeInTheDocument();
      expect(screen.getByText(/2025/)).toBeInTheDocument();
      expect(screen.getByText('دراسة تحليلية دقيقة لتأثير الانبعاثات الحضرية.')).toBeInTheDocument();
    });

    it('renders genuine image when pub.cover_image is populated in the database', async () => {
      render(<NewHomePage lang="ar" setCurrentView={vi.fn()} onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('الأمن المائي في الشرق الأوسط')).toBeInTheDocument();
      });

      const pubImg = screen.getByAltText('الأمن المائي في الشرق الأوسط');
      expect(pubImg).toBeInTheDocument();
      expect(pubImg.getAttribute('src')).toBe('https://images.unsplash.com/photo-research-real?w=800');
    });

    it('never injects legacy research1..4 or solid Figma background rectangles', async () => {
      const { container } = render(<NewHomePage lang="ar" setCurrentView={vi.fn()} onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('أثر تلوث الهواء على الجهاز التنفسي')).toBeInTheDocument();
      });

      const allImgs = container.querySelectorAll('img');
      allImgs.forEach((img) => {
        const src = img.getAttribute('src') || '';
        expect(src).not.toContain('research1');
        expect(src).not.toContain('research2');
        expect(src).not.toContain('research3');
        expect(src).not.toContain('research4');
        expect(src).not.toContain('bg_1.png');
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. Events Image Fetching & Zero-Fallback
  // ═══════════════════════════════════════════════════════════════════════════
  describe('3. Events Image Fetching & Zero-Fallback', () => {
    it('renders event card without img element when cover_image and image_url are null', async () => {
      render(<NewHomePage lang="ar" setCurrentView={vi.fn()} onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('المؤتمر الإقليمي للجاهزية الطبية وتغير المناخ 2026')).toBeInTheDocument();
      });

      const nullEventImg = screen.queryByAltText('المؤتمر الإقليمي للجاهزية الطبية وتغير المناخ 2026');
      expect(nullEventImg).toBeNull();

      // Card details render properly
      expect(screen.getByText('مؤتمر سنوي')).toBeInTheDocument();
      expect(screen.getByText('مؤتمر دولي هجين.')).toBeInTheDocument();
    });

    it('binds cover_image correctly when provided in the database', async () => {
      render(<NewHomePage lang="ar" setCurrentView={vi.fn()} onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('ورشة عمل نظم المعلومات الجغرافية الصحية')).toBeInTheDocument();
      });

      const eventImg = screen.getByAltText('ورشة عمل نظم المعلومات الجغرافية الصحية');
      expect(eventImg).toBeInTheDocument();
      expect(eventImg.getAttribute('src')).toBe('https://images.unsplash.com/photo-event-gis-real?w=1200');
    });

    it('never injects upcoming1 or upcoming2 dummy asset fallbacks', async () => {
      const { container } = render(<NewHomePage lang="ar" setCurrentView={vi.fn()} onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('المؤتمر الإقليمي للجاهزية الطبية وتغير المناخ 2026')).toBeInTheDocument();
      });

      const allImgs = container.querySelectorAll('img');
      allImgs.forEach((img) => {
        const src = img.getAttribute('src') || '';
        expect(src).not.toContain('upcoming1');
        expect(src).not.toContain('upcoming2');
        expect(src).not.toContain('bg_1.png');
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. ProgramDetailModal Zero-Fallback Validation
  // ═══════════════════════════════════════════════════════════════════════════
  describe('4. ProgramDetailModal Image Rendering & Zero-Fallback', () => {
    it('renders hero image when program.image is provided', () => {
      const mockProgram = {
        id: 'prog-1',
        title: 'برنامج دبلوم المناخ الصحي',
        category: 'برنامج تدريبي',
        image: 'https://images.unsplash.com/photo-program-real?w=1000',
        content: '<p>تفاصيل البرنامج</p>'
      };

      render(<ProgramDetailModal program={mockProgram} onClose={vi.fn()} />);

      const heroImg = screen.getByAltText('برنامج دبلوم المناخ الصحي');
      expect(heroImg).toBeInTheDocument();
      expect(heroImg.getAttribute('src')).toBe('https://images.unsplash.com/photo-program-real?w=1000');
    });

    it('does NOT render an img element or /assets/bg_1.png fallback when program.image is missing', () => {
      const mockProgram = {
        id: 'prog-2',
        title: 'برنامج السياسات الصحية العامة',
        category: 'مسار تطبيقي',
        image: null,
        content: '<p>تفاصيل البرنامج</p>'
      };

      const { container } = render(<ProgramDetailModal program={mockProgram} onClose={vi.fn()} />);

      const heroImg = screen.queryByAltText('برنامج السياسات الصحية العامة');
      expect(heroImg).toBeNull();

      // Specifically check that /assets/bg_1.png fallback is NEVER present in the modal DOM
      const allImgs = container.querySelectorAll('img');
      allImgs.forEach((img) => {
        expect(img.getAttribute('src')).not.toContain('bg_1.png');
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. News Articles Image Fetching & Rendering
  // ═══════════════════════════════════════════════════════════════════════════
  describe('5. News Articles & HomeNewsWidget Image Binding', () => {
    it('fetches real news cover_image and binds to ArticleCard img', async () => {
      render(<HomeNewsWidget lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('تقرير منظمة الصحة العالمية الجديد حول موجات الحر')).toBeInTheDocument();
      });

      const articleImg = screen.getByAltText('تقرير منظمة الصحة العالمية الجديد حول موجات الحر');
      expect(articleImg).toBeInTheDocument();
      expect(articleImg.getAttribute('src')).toBe('https://images.unsplash.com/photo-news-who?w=800');
    });

    it('does NOT render an img element when news cover_image is null', async () => {
      render(<HomeNewsWidget lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('إطلاق مبادرة المشافي الخضراء')).toBeInTheDocument();
      });

      const nullArticleImg = screen.queryByAltText('إطلاق مبادرة المشافي الخضراء');
      expect(nullArticleImg).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. DynamicHomeSlider Database Image Fetching
  // ═══════════════════════════════════════════════════════════════════════════
  describe('6. DynamicHomeSlider Database Image Binding', () => {
    it('binds image_url from home_slider table directly to carousel img src', async () => {
      render(<DynamicHomeSlider lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('الريادة في الصحة المناخية')).toBeInTheDocument();
      });

      const slideImg = screen.getByAltText('الريادة في الصحة المناخية');
      expect(slideImg).toBeInTheDocument();
      expect(slideImg.getAttribute('src')).toBe('https://images.unsplash.com/photo-slider-real-1?w=1600');
    });

    it('renders null when slider table is empty and user lacks manage permission', async () => {
      mockSupabaseDb.home_slider = [];
      const { container } = render(<DynamicHomeSlider lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });
  });
});
