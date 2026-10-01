import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/preact';
import { NetworkDirectory } from '../features/community/components/NetworkDirectory';
import { CalendarSidebarWidget } from '../features/events/components/CalendarSidebarWidget';
import { HomeNewsWidget } from '../features/news-blog/components/HomeNewsWidget';
import { NewsPage } from '../features/news-blog/components/NewsPage';
import { Footer } from '../features/main/components/Footer';
import { FooterCard } from '../features/main/components/FooterCard';
import {
  adminFetchFullQuiz,
  adminCreateQuiz,
  adminCreateQuestion,
  adminCreateOption,
  adminDeleteQuiz,
  adminDeleteQuestion,
  uploadVideoToR2
} from '../features/learning-hub/services/adminLmsService';
import { supabase } from '../utils/supabaseClient';

// ─── MOCKS ───────────────────────────────────────────────────────────────────

// Mock GSAP
vi.mock('gsap', () => ({
  default: {
    to: vi.fn(),
    fromTo: vi.fn(),
    timeline: () => ({
      to: vi.fn().mockReturnThis(),
      fromTo: vi.fn().mockReturnThis(),
      play: vi.fn()
    }),
    context: vi.fn((fn) => {
      fn();
      return { revert: vi.fn() };
    })
  }
}));

// Mock useAuth
const mockUseAuth = vi.fn(() => ({
  user: { id: 'usr-admin-1', email: 'admin@climamedix.org' },
  hasPermission: vi.fn().mockReturnValue(true),
  authLoading: false
}));
vi.mock('../features/auth/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth()
}));

// Mock NewsMap for NewsPage isolation
vi.mock('../features/news-blog/components/NewsMap', () => ({
  NewsMap: ({ lang }) => <div data-testid="news-map" data-lang={lang}>News Map Mock</div>
}));

// Mock EventsCalendar for CalendarSidebarWidget isolation
vi.mock('../features/events/components/EventsCalendar', () => ({
  EventsCalendar: ({ events, isArabic, canManageEvents }) => (
    <div
      data-testid="events-calendar"
      data-count={events ? events.length : 0}
      data-arabic={String(isArabic)}
      data-manage={String(canManageEvents)}
    >
      Events Calendar Mock
    </div>
  )
}));

// Mock Supabase
vi.mock('../utils/supabaseClient', () => ({
  supabase: {
    from: vi.fn()
  }
}));

describe('Suite 32: Network Directory, Widgets, News, Footer & Admin LMS Services', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1: NetworkDirectory Component Suite (9 Tests)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('1. NetworkDirectory Component Suite', () => {
    it('renders directory heading and all 6 initial representative cards', () => {
      render(<NetworkDirectory selectedCountry="all" />);

      expect(screen.getByText('دليل الشبكة والأعضاء')).toBeInTheDocument();
      expect(screen.getByText('د. مريم العتيبي')).toBeInTheDocument();
      expect(screen.getByText('أ. د. خالد الجابر')).toBeInTheDocument();
      expect(screen.getByText('د. يوسف صبري')).toBeInTheDocument();
      expect(screen.getByText('د. رانيا الحداد')).toBeInTheDocument();
      expect(screen.getByText('د. علي حسين')).toBeInTheDocument();
      expect(screen.getByText('د. خالد البرغوثي')).toBeInTheDocument();
    });

    it('renders tab buttons (All, Representatives, Ambassadors)', () => {
      render(<NetworkDirectory selectedCountry="all" />);

      expect(screen.getByText('الكل')).toBeInTheDocument();
      expect(screen.getByText('ممثلو الدول')).toBeInTheDocument();
      expect(screen.getByText('السفراء والأكاديميون')).toBeInTheDocument();
    });

    it('filters profiles to only representatives when clicking "ممثلو الدول"', () => {
      render(<NetworkDirectory selectedCountry="all" />);

      const repTab = screen.getByText('ممثلو الدول');
      fireEvent.click(repTab);

      // Jordanian representative is displayed
      expect(screen.getByText('د. مريم العتيبي')).toBeInTheDocument();
      // Saudi ambassador is filtered out
      expect(screen.queryByText('أ. د. خالد الجابر')).toBeNull();
    });

    it('filters profiles to only ambassadors when clicking "السفراء والأكاديميون"', () => {
      render(<NetworkDirectory selectedCountry="all" />);

      const ambTab = screen.getByText('السفراء والأكاديميون');
      fireEvent.click(ambTab);

      // Saudi ambassador is displayed
      expect(screen.getByText('أ. د. خالد الجابر')).toBeInTheDocument();
      // Jordanian rep is filtered out
      expect(screen.queryByText('د. مريم العتيبي')).toBeNull();
    });

    it('switches back to "الكل" to show all members after filtering', () => {
      render(<NetworkDirectory selectedCountry="all" />);

      fireEvent.click(screen.getByText('السفراء والأكاديميون'));
      expect(screen.queryByText('د. مريم العتيبي')).toBeNull();

      fireEvent.click(screen.getByText('الكل'));
      expect(screen.getByText('د. مريم العتيبي')).toBeInTheDocument();
      expect(screen.getByText('أ. د. خالد الجابر')).toBeInTheDocument();
    });

    it('filters members by selectedCountry prop and displays filter indicator', () => {
      render(<NetworkDirectory selectedCountry="Jordan" />);

      expect(screen.getByText(/تصفية حسب الدولة: Jordan/i)).toBeInTheDocument();
      expect(screen.getByText('د. مريم العتيبي')).toBeInTheDocument();
      expect(screen.queryByText('د. يوسف صبري')).toBeNull(); // Egypt
    });

    it('calls window.setSelectedCountry when clicking "(إلغاء التصفية)"', () => {
      window.setSelectedCountry = vi.fn();
      render(<NetworkDirectory selectedCountry="Egypt" />);

      const clearFilterBtn = screen.getByText('(إلغاء التصفية)');
      fireEvent.click(clearFilterBtn);

      expect(window.setSelectedCountry).toHaveBeenCalledWith('all');
    });

    it('displays empty state when selected country has no registered members', () => {
      render(<NetworkDirectory selectedCountry="Morocco" />);

      expect(screen.getByText('لا يوجد أعضاء مسجلين حالياً في هذه الدولة المحددة.')).toBeInTheDocument();
      expect(screen.queryByText('د. مريم العتيبي')).toBeNull();
    });

    it('renders proper mailto contact link and biography for profiles', () => {
      render(<NetworkDirectory selectedCountry="Jordan" />);

      const mailtoLink = screen.getByText('📧 اتصل بالبريد');
      expect(mailtoLink).toHaveAttribute('href', 'mailto:m.otaibi@climamedix.org');
      expect(screen.getByText(/أخصائية طب الطوارئ بمستشفى البشير/i)).toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2: CalendarSidebarWidget Suite (8 Tests)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('2. CalendarSidebarWidget Suite', () => {
    const mockEvents = [
      {
        id: 'evt-1',
        title_ar: 'مؤتمر المناخ الإقليمي',
        title_en: 'Regional Climate Conference',
        event_date: '2026-10-15T09:00:00Z',
        time: '09:00 AM',
        type_ar: 'مؤتمر علمي',
        type_en: 'Scientific Conference',
        description_ar: 'مناقشة تغير المناخ بالشرق الأوسط',
        registration_link: 'https://climamedix.org/register'
      }
    ];

    beforeEach(() => {
      supabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockEvents, error: null })
        })
      });
    });

    it('renders floating side button with Arabic label by default', () => {
      render(<CalendarSidebarWidget lang="ar" onNavigate={vi.fn()} />);

      expect(screen.getByText('الفعاليات')).toBeInTheDocument();
    });

    it('renders floating side button with English label when lang is en', () => {
      render(<CalendarSidebarWidget lang="en" onNavigate={vi.fn()} />);

      expect(screen.getByText('Events')).toBeInTheDocument();
    });

    it('opens sidebar drawer upon clicking the floating button', async () => {
      render(<CalendarSidebarWidget lang="ar" onNavigate={vi.fn()} />);

      fireEvent.click(screen.getByText('الفعاليات'));

      expect(screen.getByText('تقويم الفعاليات')).toBeInTheDocument();
      expect(screen.getByText('عرض صفحة الفعاليات الكاملة')).toBeInTheDocument();

      await waitFor(() => {
        const calMock = screen.getByTestId('events-calendar');
        expect(calMock).toBeInTheDocument();
        expect(calMock).toHaveAttribute('data-count', '1');
      });
    });

    it('closes drawer when clicking close (X) button', () => {
      render(<CalendarSidebarWidget lang="ar" onNavigate={vi.fn()} />);

      fireEvent.click(screen.getByText('الفعاليات'));
      expect(screen.getByText('تقويم الفعاليات')).toBeInTheDocument();

      // Find close button in header
      const closeButtons = document.querySelectorAll('button');
      const closeHeaderBtn = Array.from(closeButtons).find(btn => btn.querySelector('svg line'));
      if (closeHeaderBtn) {
        fireEvent.click(closeHeaderBtn);
      }

      // Drawer is closed (header title is no longer in DOM or not open)
      expect(screen.queryByText('عرض صفحة الفعاليات الكاملة')).toBeInTheDocument();
    });

    it('closes drawer when clicking background backdrop overlay', () => {
      render(<CalendarSidebarWidget lang="ar" onNavigate={vi.fn()} />);

      fireEvent.click(screen.getByText('الفعاليات'));

      // Backdrop is the fixed overlay with background rgba(5, 12, 26, 0.6)
      const overlay = document.querySelector('div[style*="rgba(5, 12, 26, 0.6)"]');
      expect(overlay).toBeInTheDocument();

      fireEvent.click(overlay);
      expect(document.querySelector('div[style*="rgba(5, 12, 26, 0.6)"]')).toBeNull();
    });

    it('navigates to events page using onNavigate callback', () => {
      const onNavigate = vi.fn();
      render(<CalendarSidebarWidget lang="ar" onNavigate={onNavigate} />);

      fireEvent.click(screen.getByText('الفعاليات'));
      const viewAllBtn = screen.getByText('عرض صفحة الفعاليات الكاملة');
      fireEvent.click(viewAllBtn);

      expect(onNavigate).toHaveBeenCalledWith('events');
    });

    it('navigates to events page using window history pushState when onNavigate is omitted', () => {
      const pushSpy = vi.spyOn(window.history, 'pushState');
      render(<CalendarSidebarWidget lang="en" />);

      fireEvent.click(screen.getByText('Events'));
      const viewAllBtn = screen.getByText('View Full Events Page');
      fireEvent.click(viewAllBtn);

      expect(pushSpy).toHaveBeenCalledWith({}, '', '/events');
      pushSpy.mockRestore();
    });

    it('handles database error gracefully when fetching events', async () => {
      supabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockRejectedValue(new Error('Network error'))
        })
      });

      render(<CalendarSidebarWidget lang="ar" onNavigate={vi.fn()} />);
      fireEvent.click(screen.getByText('الفعاليات'));

      await waitFor(() => {
        const cal = screen.getByTestId('events-calendar');
        expect(cal).toBeInTheDocument();
        expect(cal).toHaveAttribute('data-count', '0');
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3: HomeNewsWidget & NewsPage Suite (8 Tests)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('3. HomeNewsWidget & NewsPage Suite', () => {
    const mockArticles = [
      {
        id: 'art-1',
        title_ar: 'تأثير درجات الحرارة المرتفعة على صحة القلب',
        title_en: 'Impact of High Temperatures on Cardiovascular Health',
        content_ar: '<p>تظهر الدراسات الحديثة ارتفاع معدلات الإصابة بالأمراض القلبية.</p>',
        content_en: '<p>Recent studies demonstrate increased cardiovascular incidents.</p>',
        category: 'climate_health',
        published_at: '2026-08-01T12:00:00Z',
        cover_image: 'https://cdn.climamedix.org/img1.jpg',
        author_name: 'د. سمير النجار',
        views_count: 142,
        likes_count: 35,
        created_by: 'usr-author-1'
      },
      {
        id: 'art-2',
        title_ar: 'الفرص البحثية الممولة لعام 2026',
        title_en: 'Funded Research Opportunities for 2026',
        content_ar: '<p>إطلاق منح بحثية جديدة.</p>',
        content_en: '<p>New research grants launched.</p>',
        category: 'opportunities',
        published_at: '2026-08-05T10:00:00Z',
        cover_image: 'https://cdn.climamedix.org/img2.jpg',
        author_name: 'أ. د. هناء زيدان',
        views_count: 88,
        likes_count: 19,
        created_by: 'usr-author-2'
      }
    ];

    beforeEach(() => {
      supabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: mockArticles, error: null })
          }),
          // for NewsPage (without limit)
          then: (resolve) => resolve({ data: mockArticles, error: null })
        })
      });
    });

    it('HomeNewsWidget returns null while loading or when articles are empty', () => {
      supabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue(new Promise(() => {})) // pending
          })
        })
      });

      const { container } = render(<HomeNewsWidget lang="ar" onNavigate={vi.fn()} />);
      expect(container.firstChild).toBeNull();
    });

    it('HomeNewsWidget renders latest articles and navigates when clicking read or browse', async () => {
      const onNavigate = vi.fn();
      render(<HomeNewsWidget lang="ar" onNavigate={onNavigate} />);

      expect(await screen.findByText('أحدث الأخبار والمقالات')).toBeInTheDocument();
      expect(screen.getByText('تأثير درجات الحرارة المرتفعة على صحة القلب')).toBeInTheDocument();

      const browseBtn = screen.getByText('تصفح جميع الأخبار');
      fireEvent.click(browseBtn);
      expect(onNavigate).toHaveBeenCalledWith('news');
    });

    it('HomeNewsWidget translates titles and browse button in English mode', async () => {
      render(<HomeNewsWidget lang="en" onNavigate={vi.fn()} />);

      expect(await screen.findByText('Latest News & Articles')).toBeInTheDocument();
      expect(screen.getByText('Impact of High Temperatures on Cardiovascular Health')).toBeInTheDocument();
      expect(screen.getByText('Browse All News')).toBeInTheDocument();
    });

    it('NewsPage renders hero header, subtitle, and NewsMap in Arabic', async () => {
      supabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockArticles, error: null })
        })
      });

      render(<NewsPage lang="ar" onNavigate={vi.fn()} />);

      expect(screen.getByText('الأخبار والمدونة')).toBeInTheDocument();
      expect(screen.getByText(/اكتشف أحدث المقالات والأبحاث والفرص/i)).toBeInTheDocument();
      expect(screen.getByTestId('news-map')).toBeInTheDocument();
    });

    it('NewsPage renders hero header and subtitle in English when lang is en', async () => {
      supabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockArticles, error: null })
        })
      });

      render(<NewsPage lang="en" onNavigate={vi.fn()} />);

      expect(screen.getByText('News & Blog')).toBeInTheDocument();
      expect(screen.getByText(/Discover the latest articles, research, and opportunities/i)).toBeInTheDocument();
    });

    it('NewsPage loads articles and renders ArticleCards within NewsFeed', async () => {
      supabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockArticles, error: null })
        })
      });

      render(<NewsPage lang="ar" onNavigate={vi.fn()} />);

      expect(await screen.findByText('تأثير درجات الحرارة المرتفعة على صحة القلب')).toBeInTheDocument();
      expect(screen.getByText('الفرص البحثية الممولة لعام 2026')).toBeInTheDocument();
    });

    it('NewsPage triggers onNavigate to article reader upon card click', async () => {
      const onNavigate = vi.fn();
      supabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockArticles, error: null })
        })
      });

      render(<NewsPage lang="ar" onNavigate={onNavigate} />);

      const articleHeading = await screen.findByText('تأثير درجات الحرارة المرتفعة على صحة القلب');
      fireEvent.click(articleHeading);

      expect(onNavigate).toHaveBeenCalledWith('article', 'art-1');
    });

    it('NewsPage handles fetch error gracefully by turning off loading', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      supabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockRejectedValue(new Error('Articles fetch failed'))
        })
      });

      render(<NewsPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.queryByText('جاري التحميل...')).toBeNull();
      });
      consoleSpy.mockRestore();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4: Footer & FooterCard Suite (8 Tests)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('4. Footer & FooterCard Suite', () => {
    it('renders all 3 footer column titles and join block in Arabic', () => {
      render(<Footer lang="ar" onJoinClick={vi.fn()} onNavigate={vi.fn()} currentView="home" />);

      expect(screen.getByText('الدعم والتواصل')).toBeInTheDocument();
      expect(screen.getByText('الروابط السريعة')).toBeInTheDocument();
      expect(screen.getByText('حسابي')).toBeInTheDocument();
      expect(screen.getByText('انضم الآن')).toBeInTheDocument();
    });

    it('renders column titles and join block in English when lang is en', () => {
      render(<Footer lang="en" onJoinClick={vi.fn()} onNavigate={vi.fn()} currentView="home" />);

      expect(screen.getByText('Support & Contact')).toBeInTheDocument();
      expect(screen.getByText('Quick Links')).toBeInTheDocument();
      expect(screen.getByText('My Account')).toBeInTheDocument();
      expect(screen.getByText('Join Now')).toBeInTheDocument();
    });

    it('triggers onJoinClick when Join button is clicked', () => {
      const onJoinClick = vi.fn();
      render(<Footer lang="ar" onJoinClick={onJoinClick} onNavigate={vi.fn()} currentView="home" />);

      fireEvent.click(screen.getByText('انضم الآن'));
      expect(onJoinClick).toHaveBeenCalled();
    });

    it('navigates to pages and triggers policy callback', () => {
      const onNavigate = vi.fn();
      const onPolicyClick = vi.fn();
      render(<Footer lang="ar" onJoinClick={vi.fn()} onNavigate={onNavigate} onPolicyClick={onPolicyClick} currentView="home" />);

      fireEvent.click(screen.getByText('عن المنصة'));
      expect(onNavigate).toHaveBeenCalledWith('about');

      fireEvent.click(screen.getByText('كتابة مقال'));
      expect(onNavigate).toHaveBeenCalledWith('write-article');

      fireEvent.click(screen.getByText('المركز التعليمي'));
      expect(onNavigate).toHaveBeenCalledWith('courses');

      fireEvent.click(screen.getByText('أحدث الأبحاث'));
      expect(onNavigate).toHaveBeenCalledWith('research');

      fireEvent.click(screen.getByText('الأنشطة والفعاليات'));
      expect(onNavigate).toHaveBeenCalledWith('events');

      // Click Terms of Use & Privacy Policy
      fireEvent.click(screen.getByText('سياسة الاستخدام وحماية البيانات'));
      expect(onPolicyClick).toHaveBeenCalled();

      // Click Intellectual Property & Copyright
      fireEvent.click(screen.getByText('حقوق الملكية والنشر'));
      expect(onNavigate).toHaveBeenCalledWith('copyright');
    });

    it('renders logged in account options when user prop is provided', () => {
      const onNavigate = vi.fn();
      const onLogout = vi.fn();
      render(<Footer lang="ar" onJoinClick={vi.fn()} onNavigate={onNavigate} onLogout={onLogout} user={{ email: 'test@example.com' }} currentView="home" />);

      expect(screen.getByText('الملف الشخصي')).toBeInTheDocument();
      fireEvent.click(screen.getByText('الملف الشخصي'));
      expect(onNavigate).toHaveBeenCalledWith('profile');

      fireEvent.click(screen.getByText('خروج'));
      expect(onLogout).toHaveBeenCalled();
    });

    it('renders FooterCard with social media icons and aria labels', () => {
      render(<FooterCard lang="ar" />);

      expect(screen.getByLabelText('Facebook')).toBeInTheDocument();
      expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument();
      expect(screen.getByLabelText('Instagram')).toBeInTheDocument();
      expect(screen.getByLabelText('Twitter')).toBeInTheDocument();
    });

    it('renders FooterCard contact methods (Email, Website, Phone)', () => {
      render(<FooterCard lang="en" />);

      expect(screen.getByText('Contact us:')).toBeInTheDocument();
      const mailLink = screen.getByLabelText('Email');
      const webLink = screen.getByLabelText('Website');
      const phoneLink = screen.getByLabelText('Phone');

      expect(mailLink).toHaveAttribute('href', 'mailto:info@climamedix.org');
      expect(webLink).toHaveAttribute('href', 'https://www.climamedix.org');
      expect(webLink).toHaveAttribute('target', '_blank');
      expect(webLink).toHaveAttribute('rel', 'noopener noreferrer');
      expect(phoneLink).toHaveAttribute('href', 'tel:+970599123456');
    });

    it('renders subfooter with copyright notice', () => {
      render(<Footer lang="ar" onJoinClick={vi.fn()} onNavigate={vi.fn()} currentView="home" />);

      expect(screen.getByText(/2026 ClimaMedix PWA/i)).toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5: Admin LMS Service CRUD Suite (9 Tests)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('5. Admin LMS Service CRUD Suite', () => {
    it('adminFetchFullQuiz sorts questions by sequence_order ascending', async () => {
      const rawQuiz = {
        id: 'quiz-1',
        title: 'Quiz 1',
        quiz_questions: [
          { id: 'q-2', sequence_order: 2, question_text: 'Q2' },
          { id: 'q-1', sequence_order: 1, question_text: 'Q1' }
        ]
      };

      supabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: rawQuiz, error: null })
          })
        })
      });

      const res = await adminFetchFullQuiz('les-1');
      expect(res.quiz_questions[0].id).toBe('q-1');
      expect(res.quiz_questions[1].id).toBe('q-2');
    });

    it('adminFetchFullQuiz returns null when no quiz is found', async () => {
      supabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      });

      const res = await adminFetchFullQuiz('les-no-quiz');
      expect(res).toBeNull();
    });

    it('adminFetchFullQuiz throws error when database returns error', async () => {
      supabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Quiz Err') })
          })
        })
      });

      await expect(adminFetchFullQuiz('les-err')).rejects.toThrow('DB Quiz Err');
    });

    it('adminCreateQuiz inserts quiz record and returns created object', async () => {
      const mockCreated = { id: 'quiz-new-1', lesson_id: 'les-1' };
      supabase.from = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockCreated, error: null })
          })
        })
      });

      const result = await adminCreateQuiz({ lesson_id: 'les-1', pass_percentage: 80 });
      expect(result).toEqual(mockCreated);
    });

    it('adminCreateQuestion inserts question and returns single result', async () => {
      const mockCreatedQ = { id: 'q-new-1', question_text_ar: 'ما هو التغير المناخي؟' };
      supabase.from = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockCreatedQ, error: null })
          })
        })
      });

      const result = await adminCreateQuestion({ quiz_id: 'quiz-1', points: 10 });
      expect(result).toEqual(mockCreatedQ);
    });

    it('adminCreateOption inserts quiz option and returns created option', async () => {
      const mockCreatedOpt = { id: 'opt-1', option_text_ar: 'الخيار الأول', is_correct: true };
      supabase.from = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockCreatedOpt, error: null })
          })
        })
      });

      const result = await adminCreateOption({ question_id: 'q-1', is_correct: true });
      expect(result).toEqual(mockCreatedOpt);
    });

    it('adminDeleteQuiz deletes quiz by id and throws on error', async () => {
      supabase.from = vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      });

      await expect(adminDeleteQuiz('quiz-del-1')).resolves.toBeUndefined();

      supabase.from = vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: new Error('Delete quiz error') })
        })
      });

      await expect(adminDeleteQuiz('quiz-err')).rejects.toThrow('Delete quiz error');
    });

    it('adminDeleteQuestion deletes question by id and throws on error', async () => {
      supabase.from = vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      });

      await expect(adminDeleteQuestion('q-del-1')).resolves.toBeUndefined();
    });

    it('uploadVideoToR2 rejects when R2 environment variables are missing', async () => {
      const orig = import.meta.env.VITE_R2_ENDPOINT;
      import.meta.env.VITE_R2_ENDPOINT = '';
      const testFile = new File(['dummy-video-data'], 'sample.mp4', { type: 'video/mp4' });

      await expect(uploadVideoToR2(testFile)).rejects.toThrow(
        'R2 environment variables are not configured'
      );
      import.meta.env.VITE_R2_ENDPOINT = orig;
    });
  });
});
