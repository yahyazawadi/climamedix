import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { OpportunitiesPage } from '../features/opportunities/components/OpportunitiesPage';
import { OpportunitiesGrid, CATEGORY_MAP } from '../features/opportunities/components/OpportunitiesGrid';
import { OpportunityCard } from '../features/opportunities/components/OpportunityCard';
import * as oppService from '../features/opportunities/services/opportunityService';
import { useOpportunities } from '../features/opportunities/hooks/useOpportunities';
import { supabase } from '../utils/supabaseClient';

// Mock GSAP to prevent animation issues in JSDOM
vi.mock('gsap', () => ({
  default: {
    context: vi.fn((cb) => {
      cb();
      return { revert: vi.fn() };
    }),
    fromTo: vi.fn()
  }
}));

// Mock useAuth
const mockUser = { id: 'usr-opp-123', email: 'opp@climamedix.org' };
let mockPermissions = ['write:opportunities'];
let mockHasPermission = vi.fn((perm) => mockPermissions.includes(perm));

vi.mock('../features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    userProfile: { role: 'admin', full_name: 'Dr. Opp' },
    hasPermission: mockHasPermission
  })
}));

// Mock useOpportunities for page tests
const mockSampleOpps = [
  {
    id: 'opp-1',
    title_ar: 'زمالة أبحاث صحة المناخ',
    title_en: 'Climate Health Fellowship',
    type: 'fellowship',
    description_ar: 'برنامج تدريبي متقدم لدراسة آثار التغير المناخي على الصحة العامة.',
    description_en: 'Advanced fellowship program studying climate health impacts.',
    eligibility_ar: 'مفتوح للأطباء والباحثين في الشرق الأوسط',
    eligibility_en: 'Open to physicians and researchers in MENA',
    deadline: '2026-12-31T23:59:59Z',
    apply_link: 'https://climamedix.org/apply/fellowship-2026'
  },
  {
    id: 'opp-2',
    title_ar: 'منحة تعليمية لدراسة الأوبئة',
    title_en: 'Epidemiology Masters Scholarship',
    type: 'scholarship',
    description_ar: 'منحة كاملة لدراسة الماجستير.',
    description_en: 'Full scholarship for MSc studies.',
    eligibility_ar: 'شهادة بكالوريوس في الطب أو العلوم الصحية',
    eligibility_en: 'Bachelor degree in Medicine or Health Sciences',
    deadline: '2027-01-15T00:00:00Z',
    apply_link: null // Masked for guests / free users
  },
  {
    id: 'opp-3',
    title_ar: 'مؤتمر الشرق الأوسط للطب البيئي',
    title_en: 'Middle East Environmental Medicine Conference',
    type: 'conference',
    description_ar: 'مؤتمر دولي سنوي.',
    description_en: 'Annual international conference.',
    eligibility_ar: null,
    eligibility_en: null,
    deadline: null, // Open deadline
    apply_link: 'https://climamedix.org/conference-2026'
  },
  {
    id: 'opp-4',
    title_ar: 'تدريب سريري صيفي',
    title_en: 'Summer Clinical Internship',
    type: 'internship',
    description_ar: 'تدريب عملي في المستشفيات الميدانية.',
    description_en: 'Practical internship at field hospitals.',
    eligibility_ar: 'طلاب السنوات الأخيرة في كليات الطب',
    eligibility_en: 'Final year medical students',
    deadline: '2026-06-01T00:00:00Z',
    apply_link: 'https://climamedix.org/apply/internship'
  },
  {
    id: 'opp-5',
    title_ar: 'منحة بحثية لدعم مشاريع التكيف',
    title_en: 'Climate Adaptation Research Grant',
    type: 'grant',
    description_ar: 'تمويل أبحاث التكيف حتى 50,000 دولار.',
    description_en: 'Adaptation research funding up to $50,000.',
    eligibility_ar: 'مجموعات بحثية معتمدة',
    eligibility_en: 'Accredited research groups',
    deadline: '2026-11-30T00:00:00Z',
    apply_link: null
  }
];

let mockHookOpportunities = [...mockSampleOpps];
let mockHookLoading = false;
let mockHookError = null;
let mockRefresh = vi.fn();

vi.mock('../features/opportunities/hooks/useOpportunities', () => ({
  useOpportunities: () => ({
    opportunities: mockHookOpportunities,
    loading: mockHookLoading,
    error: mockHookError,
    refreshOpportunities: mockRefresh
  })
}));

describe('Opportunities & Grants Engine Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    mockPermissions = ['write:opportunities'];
    mockHookOpportunities = [...mockSampleOpps];
    mockHookLoading = false;
    mockHookError = null;
    mockRefresh = vi.fn().mockResolvedValue([]);
    window.alert = vi.fn();
    window.scrollTo = vi.fn();
    window.open = vi.fn();
  });

  // =========================================================================
  // 1. CATEGORY_MAP & CONSTANTS TESTS (6 tests)
  // =========================================================================
  describe('Category Mapping & Localization Constants', () => {
    it('defines correct Arabic and English label for "all"', () => {
      expect(CATEGORY_MAP.all.ar).toBe('الكل');
      expect(CATEGORY_MAP.all.en).toBe('All');
    });

    it('defines correct Arabic and English label for "fellowship"', () => {
      expect(CATEGORY_MAP.fellowship.ar).toBe('زمالة دراسية');
      expect(CATEGORY_MAP.fellowship.en).toBe('Fellowship');
    });

    it('defines correct Arabic and English label for "scholarship"', () => {
      expect(CATEGORY_MAP.scholarship.ar).toBe('منحة تعليمية');
      expect(CATEGORY_MAP.scholarship.en).toBe('Scholarship');
    });

    it('defines correct Arabic and English label for "conference"', () => {
      expect(CATEGORY_MAP.conference.ar).toBe('مؤتمر علمي');
      expect(CATEGORY_MAP.conference.en).toBe('Conference');
    });

    it('defines correct Arabic and English label for "internship"', () => {
      expect(CATEGORY_MAP.internship.ar).toBe('تدريب عملي');
      expect(CATEGORY_MAP.internship.en).toBe('Internship');
    });

    it('defines correct Arabic and English label for "grant"', () => {
      expect(CATEGORY_MAP.grant.ar).toBe('منحة مالية / دعم');
      expect(CATEGORY_MAP.grant.en).toBe('Grant');
    });
  });

  // =========================================================================
  // 2. OPPORTUNITY CARD COMPONENT (14 tests)
  // =========================================================================
  describe('OpportunityCard Component: Display, Formatting & Security Masking', () => {
    it('renders Arabic title and description by default when lang is ar', () => {
      render(<OpportunityCard {...mockSampleOpps[0]} lang="ar" />);
      expect(screen.getByText('زمالة أبحاث صحة المناخ')).toBeInTheDocument();
      expect(screen.getByText('برنامج تدريبي متقدم لدراسة آثار التغير المناخي على الصحة العامة.')).toBeInTheDocument();
    });

    it('renders English title and description when lang is en', () => {
      render(<OpportunityCard {...mockSampleOpps[0]} lang="en" />);
      expect(screen.getByText('Climate Health Fellowship')).toBeInTheDocument();
      expect(screen.getByText('Advanced fellowship program studying climate health impacts.')).toBeInTheDocument();
    });

    it('falls back to Arabic title if English title is missing', () => {
      const oppWithoutEn = { ...mockSampleOpps[0], title_en: '' };
      render(<OpportunityCard {...oppWithoutEn} lang="en" />);
      expect(screen.getByText('زمالة أبحاث صحة المناخ')).toBeInTheDocument();
    });

    it('falls back to Arabic description if English description is missing', () => {
      const oppWithoutEnDesc = { ...mockSampleOpps[0], description_en: '' };
      render(<OpportunityCard {...oppWithoutEnDesc} lang="en" />);
      expect(screen.getByText('برنامج تدريبي متقدم لدراسة آثار التغير المناخي على الصحة العامة.')).toBeInTheDocument();
    });

    it('renders eligibility section when provided in Arabic', () => {
      render(<OpportunityCard {...mockSampleOpps[0]} lang="ar" />);
      expect(screen.getByText('الأهلية والشروط:')).toBeInTheDocument();
      expect(screen.getByText('مفتوح للأطباء والباحثين في الشرق الأوسط')).toBeInTheDocument();
    });

    it('renders eligibility section in English with correct header', () => {
      render(<OpportunityCard {...mockSampleOpps[0]} lang="en" />);
      expect(screen.getByText('Eligibility Requirements:')).toBeInTheDocument();
      expect(screen.getByText('Open to physicians and researchers in MENA')).toBeInTheDocument();
    });

    it('does not render eligibility container when eligibility is null', () => {
      render(<OpportunityCard {...mockSampleOpps[2]} lang="ar" />);
      expect(screen.queryByText('الأهلية والشروط:')).not.toBeInTheDocument();
      expect(screen.queryByText('Eligibility Requirements:')).not.toBeInTheDocument();
    });

    it('formats ISO deadline date in Arabic locale when lang is ar', () => {
      render(<OpportunityCard {...mockSampleOpps[0]} lang="ar" />);
      expect(screen.getByText('الموعد النهائي')).toBeInTheDocument();
      // Date should not be raw ISO string
      expect(screen.queryByText('2026-12-31T23:59:59Z')).not.toBeInTheDocument();
    });

    it('formats ISO deadline date in English locale when lang is en', () => {
      render(<OpportunityCard {...mockSampleOpps[0]} lang="en" />);
      expect(screen.getByText('Deadline')).toBeInTheDocument();
      expect(screen.queryByText('2026-12-31T23:59:59Z')).not.toBeInTheDocument();
    });

    it('renders "مفتوح" when deadline is null and lang is ar', () => {
      render(<OpportunityCard {...mockSampleOpps[2]} lang="ar" />);
      expect(screen.getByText('مفتوح')).toBeInTheDocument();
    });

    it('renders "Open" when deadline is null and lang is en', () => {
      render(<OpportunityCard {...mockSampleOpps[2]} lang="en" />);
      expect(screen.getByText('Open')).toBeInTheDocument();
    });

    it('shows "تقديم الطلب" and opens external window when apply_link is present', () => {
      render(<OpportunityCard {...mockSampleOpps[0]} lang="ar" />);
      const applyBtn = screen.getByText('تقديم الطلب');
      expect(applyBtn).toBeInTheDocument();

      fireEvent.click(applyBtn);
      expect(window.open).toHaveBeenCalledWith(
        'https://climamedix.org/apply/fellowship-2026',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('shows "Apply Now" in English when apply_link is present', () => {
      render(<OpportunityCard {...mockSampleOpps[0]} lang="en" />);
      const applyBtn = screen.getByText('Apply Now');
      expect(applyBtn).toBeInTheDocument();

      fireEvent.click(applyBtn);
      expect(window.open).toHaveBeenCalledWith(
        'https://climamedix.org/apply/fellowship-2026',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('shows "سجل لعرض الرابط" / "Sign in to Apply" and redirects to /auth when apply_link is masked/null', () => {
      const pushStateSpy = vi.spyOn(window.history, 'pushState');
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      const { rerender } = render(<OpportunityCard {...mockSampleOpps[1]} lang="ar" />);
      const signInBtnAr = screen.getByText('سجل لعرض الرابط');
      expect(signInBtnAr).toBeInTheDocument();

      fireEvent.click(signInBtnAr);
      expect(pushStateSpy).toHaveBeenCalledWith({}, '', '/auth');
      expect(dispatchSpy).toHaveBeenCalledWith(expect.any(PopStateEvent));

      rerender(<OpportunityCard {...mockSampleOpps[1]} lang="en" />);
      const signInBtnEn = screen.getByText('Sign in to Apply');
      expect(signInBtnEn).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 3. OPPORTUNITIES GRID COMPONENT (10 tests)
  // =========================================================================
  describe('OpportunitiesGrid Component: Filtering & Empty States', () => {
    it('renders all opportunities when activeCategory is "all"', () => {
      const { container } = render(<OpportunitiesGrid opportunities={mockSampleOpps} activeCategory="all" lang="ar" />);
      const cards = container.querySelectorAll('.opportunity-card-wrapper');
      expect(cards.length).toBe(5);
      cards.forEach(card => {
        expect(card.style.display).toBe('flex');
      });
    });

    it('hides non-matching opportunities when filtered by "fellowship"', () => {
      const { container } = render(<OpportunitiesGrid opportunities={mockSampleOpps} activeCategory="fellowship" lang="ar" />);
      const cards = container.querySelectorAll('.opportunity-card-wrapper');
      expect(cards[0].style.display).toBe('flex'); // fellowship
      expect(cards[1].style.display).toBe('none'); // scholarship
      expect(cards[2].style.display).toBe('none'); // conference
      expect(cards[3].style.display).toBe('none'); // internship
      expect(cards[4].style.display).toBe('none'); // grant
    });

    it('filters properly for "scholarship"', () => {
      const { container } = render(<OpportunitiesGrid opportunities={mockSampleOpps} activeCategory="scholarship" lang="ar" />);
      const cards = container.querySelectorAll('.opportunity-card-wrapper');
      expect(cards[0].style.display).toBe('none');
      expect(cards[1].style.display).toBe('flex');
    });

    it('filters properly for "conference"', () => {
      const { container } = render(<OpportunitiesGrid opportunities={mockSampleOpps} activeCategory="conference" lang="ar" />);
      const cards = container.querySelectorAll('.opportunity-card-wrapper');
      expect(cards[2].style.display).toBe('flex');
    });

    it('filters properly for "internship"', () => {
      const { container } = render(<OpportunitiesGrid opportunities={mockSampleOpps} activeCategory="internship" lang="ar" />);
      const cards = container.querySelectorAll('.opportunity-card-wrapper');
      expect(cards[3].style.display).toBe('flex');
    });

    it('filters properly for "grant"', () => {
      const { container } = render(<OpportunitiesGrid opportunities={mockSampleOpps} activeCategory="grant" lang="ar" />);
      const cards = container.querySelectorAll('.opportunity-card-wrapper');
      expect(cards[4].style.display).toBe('flex');
    });

    it('displays empty state in Arabic when category has 0 matches', () => {
      const onlyConferences = [mockSampleOpps[2]];
      render(<OpportunitiesGrid opportunities={onlyConferences} activeCategory="fellowship" lang="ar" />);
      expect(screen.getByText('لا توجد فرص متاحة حالياً')).toBeInTheDocument();
      expect(screen.getByText('يرجى التحقق من تصنيف آخر أو العودة لاحقاً.')).toBeInTheDocument();
    });

    it('displays empty state in English when category has 0 matches', () => {
      const onlyConferences = [mockSampleOpps[2]];
      render(<OpportunitiesGrid opportunities={onlyConferences} activeCategory="fellowship" lang="en" />);
      expect(screen.getByText('No opportunities available currently')).toBeInTheDocument();
      expect(screen.getByText('Please check another category or try again later.')).toBeInTheDocument();
    });

    it('handles empty opportunities list gracefully', () => {
      render(<OpportunitiesGrid opportunities={[]} activeCategory="all" lang="ar" />);
      expect(screen.getByText('لا توجد فرص متاحة حالياً')).toBeInTheDocument();
    });

    it('sets RTL direction on cards when lang is ar', () => {
      const { container } = render(<OpportunitiesGrid opportunities={[mockSampleOpps[0]]} activeCategory="all" lang="ar" />);
      const card = container.querySelector('.opportunity-card');
      expect(card.style.direction).toBe('rtl');
    });
  });

  // =========================================================================
  // 4. OPPORTUNITIES PAGE: PERMISSIONS & UI CONTROLS (10 tests)
  // =========================================================================
  describe('OpportunitiesPage: Permission Gating & Tab Controls', () => {
    it('shows "+ إضافة فرصة جديدة" button when user has "write:opportunities" in Arabic', () => {
      mockPermissions = ['write:opportunities'];
      render(<OpportunitiesPage lang="ar" />);
      expect(screen.getByText('إضافة فرصة جديدة')).toBeInTheDocument();
    });

    it('shows "+ Post New Opportunity" button when user has "write:opportunities" in English', () => {
      mockPermissions = ['write:opportunities'];
      render(<OpportunitiesPage lang="en" />);
      expect(screen.getByText('Post New Opportunity')).toBeInTheDocument();
    });

    it('hides add opportunity button when user lacks "write:opportunities"', () => {
      mockPermissions = [];
      render(<OpportunitiesPage lang="ar" />);
      expect(screen.queryByText('إضافة فرصة جديدة')).not.toBeInTheDocument();
      expect(screen.queryByText('Post New Opportunity')).not.toBeInTheDocument();
    });

    it('scrolls to top on mount', () => {
      render(<OpportunitiesPage lang="ar" />);
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });
    });

    it('renders all 6 category filter buttons in Arabic', () => {
      render(<OpportunitiesPage lang="ar" />);
      expect(screen.getByRole('button', { name: 'الكل' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'زمالة دراسية' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'منحة تعليمية' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'مؤتمر علمي' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'تدريب عملي' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'منحة مالية / دعم' })).toBeInTheDocument();
    });

    it('renders all 6 category filter buttons in English', () => {
      render(<OpportunitiesPage lang="en" />);
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Fellowship' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Scholarship' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Conference' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Internship' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Grant' })).toBeInTheDocument();
    });

    it('updates activeCategory state when clicking a category tab', () => {
      const { container } = render(<OpportunitiesPage lang="ar" />);
      const grantBtn = screen.getByRole('button', { name: 'منحة مالية / دعم' });
      fireEvent.click(grantBtn);

      expect(grantBtn.className).toContain('active');
      // Only the grant item should be visible in the grid
      const cards = container.querySelectorAll('.opportunity-card-wrapper');
      expect(cards[4].style.display).toBe('flex'); // grant
      expect(cards[0].style.display).toBe('none'); // fellowship
    });

    it('shows loading spinner when useOpportunities returns loading=true', () => {
      mockHookLoading = true;
      render(<OpportunitiesPage lang="ar" />);
      expect(screen.getByText('جاري تحميل الفرص...')).toBeInTheDocument();
    });

    it('shows error banner when useOpportunities returns error', () => {
      mockHookError = 'Network connection failed';
      render(<OpportunitiesPage lang="ar" />);
      expect(screen.getByText('عذراً، حدث خطأ أثناء تحميل البيانات')).toBeInTheDocument();
      expect(screen.getByText('Network connection failed')).toBeInTheDocument();
      expect(screen.getByText('إعادة المحاولة')).toBeInTheDocument();
    });

    it('shows error banner in English when lang is en', () => {
      mockHookError = 'Database timeout';
      render(<OpportunitiesPage lang="en" />);
      expect(screen.getByText('Sorry, an error occurred while loading data')).toBeInTheDocument();
      expect(screen.getByText('Database timeout')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 5. OPPORTUNITY CREATION MODAL & VALIDATION (9 tests)
  // =========================================================================
  describe('Opportunity Creation Modal: Form Validation & Security Stimuli', () => {
    it('opens creation modal when clicking post opportunity button', () => {
      render(<OpportunitiesPage lang="ar" />);
      const openBtn = screen.getByText('إضافة فرصة جديدة');
      fireEvent.click(openBtn);

      expect(screen.getByText('إضافة فرصة جديدة لقاعدة البيانات')).toBeInTheDocument();
      expect(screen.getByText('نشر الفرصة الآن')).toBeInTheDocument();
    });

    it('closes modal when clicking close "×" button', () => {
      render(<OpportunitiesPage lang="ar" />);
      fireEvent.click(screen.getByText('إضافة فرصة جديدة'));
      expect(screen.getByText('إضافة فرصة جديدة لقاعدة البيانات')).toBeInTheDocument();

      const closeBtn = screen.getByText('×');
      fireEvent.click(closeBtn);
      expect(screen.queryByText('إضافة فرصة جديدة لقاعدة البيانات')).not.toBeInTheDocument();
    });

    it('closes modal when clicking "إلغاء" / "Cancel" button', () => {
      render(<OpportunitiesPage lang="ar" />);
      fireEvent.click(screen.getByText('إضافة فرصة جديدة'));
      expect(screen.getByText('إضافة فرصة جديدة لقاعدة البيانات')).toBeInTheDocument();

      const cancelBtn = screen.getByText('إلغاء');
      fireEvent.click(cancelBtn);
      expect(screen.queryByText('إضافة فرصة جديدة لقاعدة البيانات')).not.toBeInTheDocument();
    });

    it('validates required Arabic title on submission', async () => {
      const { container } = render(<OpportunitiesPage lang="ar" />);
      fireEvent.click(screen.getByText('إضافة فرصة جديدة'));

      const form = container.querySelector('form');
      fireEvent.submit(form);

      expect(await screen.findByText('العنوان العربي مطلوب')).toBeInTheDocument();
    });

    it('validates required apply_link when title is provided', async () => {
      const { container } = render(<OpportunitiesPage lang="ar" />);
      fireEvent.click(screen.getByText('إضافة فرصة جديدة'));

      const titleInput = screen.getByPlaceholderText('مثال: زمالة أبحاث صحة المناخ');
      fireEvent.change(titleInput, { target: { value: 'فرصة تدريب جديدة' } });

      const form = container.querySelector('form');
      fireEvent.submit(form);

      expect(await screen.findByText('رابط التقديم مطلوب')).toBeInTheDocument();
    });

    it('validates error messages in English when lang is en', async () => {
      const { container } = render(<OpportunitiesPage lang="en" />);
      fireEvent.click(screen.getByText('Post New Opportunity'));

      const form = container.querySelector('form');
      fireEvent.submit(form);

      expect(await screen.findByText('Arabic title is required')).toBeInTheDocument();
    });

    it('successfully creates opportunity and refreshes list', async () => {
      const createSpy = vi.spyOn(oppService, 'createOpportunity').mockResolvedValueOnce({ id: 'opp-new-999' });

      const { container } = render(<OpportunitiesPage lang="ar" />);
      fireEvent.click(screen.getByText('إضافة فرصة جديدة'));

      const titleInput = screen.getByPlaceholderText('مثال: زمالة أبحاث صحة المناخ');
      const linkInput = screen.getByPlaceholderText('https://example.com/apply');

      fireEvent.change(titleInput, { target: { value: 'زمالة جامعة أكسفورد' } });
      fireEvent.change(linkInput, { target: { value: 'https://oxford.edu/apply' } });

      const form = container.querySelector('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(createSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            title_ar: 'زمالة جامعة أكسفورد',
            apply_link: 'https://oxford.edu/apply',
            created_by: 'usr-opp-123'
          })
        );
        expect(mockRefresh).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalledWith('تم إضافة الفرصة بنجاح!');
      });
      createSpy.mockRestore();
    });

    it('renders security stimulus options for teaser and full access keys', () => {
      render(<OpportunitiesPage lang="ar" />);
      fireEvent.click(screen.getByText('إضافة فرصة جديدة'));

      expect(screen.getByText('مستويات صلاحيات الأمان والتحكم (RLS permissions & Stimuli)')).toBeInTheDocument();
      expect(screen.getByText('مستوى رؤية الإعلان (Teaser Visibility):')).toBeInTheDocument();
      expect(screen.getByText('مستوى الوصول للرابط الفعلي (Apply Link Access):')).toBeInTheDocument();
    });

    it('handles server failure during creation gracefully', async () => {
      const createSpy = vi.spyOn(oppService, 'createOpportunity').mockRejectedValueOnce(new Error('Postgres RLS violation'));

      const { container } = render(<OpportunitiesPage lang="ar" />);
      fireEvent.click(screen.getByText('إضافة فرصة جديدة'));

      const titleInput = screen.getByPlaceholderText('مثال: زمالة أبحاث صحة المناخ');
      const linkInput = screen.getByPlaceholderText('https://example.com/apply');

      fireEvent.change(titleInput, { target: { value: 'زمالة جامعة أكسفورد' } });
      fireEvent.change(linkInput, { target: { value: 'https://oxford.edu/apply' } });

      const form = container.querySelector('form');
      fireEvent.submit(form);

      expect(await screen.findByText('Postgres RLS violation')).toBeInTheDocument();
      expect(screen.getByText('إضافة فرصة جديدة لقاعدة البيانات')).toBeInTheDocument(); // modal stays open
      createSpy.mockRestore();
    });
  });

  // =========================================================================
  // 6. SERVICE DATA LAYER (oppService) (6 tests)
  // =========================================================================
  describe('opportunityService Data Layer Direct Tests', () => {
    it('fetchOpportunities queries "opportunities_accessible" view ordered by deadline', async () => {
      const mockOrder = vi.fn().mockResolvedValue({ data: [{ id: '1' }], error: null });
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
      supabase.from = mockFrom;

      const result = await oppService.fetchOpportunities();
      expect(mockFrom).toHaveBeenCalledWith('opportunities_accessible');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOrder).toHaveBeenCalledWith('deadline', { ascending: true });
      expect(result).toEqual([{ id: '1' }]);
    });

    it('fetchOpportunities throws and logs error on query failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockOrder = vi.fn().mockResolvedValue({ data: null, error: new Error('Query failed') });
      supabase.from = vi.fn().mockReturnValue({ select: () => ({ order: mockOrder }) });

      await expect(oppService.fetchOpportunities()).rejects.toThrow('Query failed');
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching opportunities:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('createOpportunity inserts data into "opportunities" table and returns data[0]', async () => {
      const mockSelect = vi.fn().mockResolvedValue({ data: [{ id: 'opp-100', title_ar: 'اختبار' }], error: null });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      supabase.from = vi.fn().mockReturnValue({ insert: mockInsert });

      const payload = { title_ar: 'اختبار', type: 'fellowship' };
      const res = await oppService.createOpportunity(payload);

      expect(supabase.from).toHaveBeenCalledWith('opportunities');
      expect(mockInsert).toHaveBeenCalledWith([payload]);
      expect(res).toEqual({ id: 'opp-100', title_ar: 'اختبار' });
    });

    it('createOpportunity throws and logs error on insertion failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockSelect = vi.fn().mockResolvedValue({ data: null, error: new Error('Insert violation') });
      supabase.from = vi.fn().mockReturnValue({ insert: () => ({ select: mockSelect }) });

      await expect(oppService.createOpportunity({})).rejects.toThrow('Insert violation');
      expect(consoleSpy).toHaveBeenCalledWith('Error creating opportunity:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('createOpportunity correctly passes teaser and full_access permission keys', async () => {
      const mockSelect = vi.fn().mockResolvedValue({ data: [{ id: 'opp-200' }], error: null });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      supabase.from = vi.fn().mockReturnValue({ insert: mockInsert });

      const payload = {
        title_ar: 'منحة خاصة',
        teaser_permission_key: 'view:free_content',
        full_access_permission_key: 'view:all_courses'
      };
      await oppService.createOpportunity(payload);

      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          teaser_permission_key: 'view:free_content',
          full_access_permission_key: 'view:all_courses'
        })
      ]);
    });

    it('fetchOpportunities preserves empty array result if no opportunities exist', async () => {
      const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });
      supabase.from = vi.fn().mockReturnValue({ select: () => ({ order: mockOrder }) });

      const res = await oppService.fetchOpportunities();
      expect(res).toEqual([]);
    });
  });
});
