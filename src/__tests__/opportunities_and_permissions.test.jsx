import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { OpportunitiesPage } from '../features/opportunities/components/OpportunitiesPage';
import { OpportunityCard } from '../features/opportunities/components/OpportunityCard';
import * as opportunityService from '../features/opportunities/services/opportunityService';

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('../features/auth/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth()
}));

// Mock opportunityService
vi.mock('../features/opportunities/services/opportunityService', () => ({
  fetchOpportunities: vi.fn(),
  createOpportunity: vi.fn()
}));

describe('Opportunities Permissions & Two-Tier Access Test Suite', () => {
  const mockOpportunitiesList = [
    {
      id: 'opp-1',
      title_ar: 'زمالة أبحاث صحة المناخ العالمية',
      title_en: 'Global Climate Health Fellowship',
      type: 'fellowship',
      deadline: '2026-12-31',
      description_ar: 'زمالة بحثية ممولة بالكامل للأطباء والباحثين.',
      description_en: 'Fully funded research fellowship.',
      apply_link: 'https://apply.climamedix.org/opp-1', // Full access
      teaser_permission_key: 'view:public_content',
      full_access_permission_key: 'view:free_content'
    },
    {
      id: 'opp-2',
      title_ar: 'منحة تدريب صيفي في الأوبئة البيئية',
      title_en: 'Summer Environmental Epidemiology Internship',
      type: 'internship',
      deadline: '2026-11-15',
      description_ar: 'تدريب عملي للطلاب والمهتمين.',
      apply_link: null, // Teaser only / masked by RLS
      teaser_permission_key: 'view:public_content',
      full_access_permission_key: 'view:all_courses'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    window.open = vi.fn();
  });

  describe('1. OpportunitiesPage Post Button Permission Gating', () => {
    it('HIDES "Post New Opportunity" button from regular users lacking write:opportunities', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'u-1', email: 'user@climamedix.org' },
        hasPermission: (perm) => perm !== 'write:opportunities'
      });

      opportunityService.fetchOpportunities.mockResolvedValueOnce(mockOpportunitiesList);

      render(<OpportunitiesPage lang="ar" />);

      // Content loads
      expect(await screen.findByText('زمالة أبحاث صحة المناخ العالمية')).toBeInTheDocument();

      // Post button must not be rendered
      expect(screen.queryByText('إضافة فرصة جديدة')).toBeNull();
      expect(screen.queryByText('Post New Opportunity')).toBeNull();
    });

    it('RENDERS "Post New Opportunity" button for staff with write:opportunities and opens creation modal', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'staff-1', email: 'staff@climamedix.org' },
        hasPermission: (perm) => perm === 'write:opportunities'
      });

      opportunityService.fetchOpportunities.mockResolvedValueOnce(mockOpportunitiesList);
      opportunityService.createOpportunity.mockResolvedValueOnce({ id: 'opp-new' });

      render(<OpportunitiesPage lang="ar" />);

      // Find post button
      const postBtn = await screen.findByText('إضافة فرصة جديدة');
      expect(postBtn).toBeInTheDocument();

      // Click to open modal
      fireEvent.click(postBtn);

      // Modal title should appear
      expect(screen.getByText('إضافة فرصة جديدة لقاعدة البيانات')).toBeInTheDocument();

      // Fill in title
      const titleInput = screen.getByPlaceholderText('مثال: زمالة أبحاث صحة المناخ');
      fireEvent.change(titleInput, { target: { value: 'مؤتمر الصحة والتغير المناخي 2026' } });

      // Fill in link
      const linkInput = screen.getByPlaceholderText('https://example.com/apply');
      fireEvent.input(linkInput, { target: { value: 'https://conference.example.com' } });
      fireEvent.change(linkInput, { target: { value: 'https://conference.example.com' } });

      // Submit form
      const form = document.querySelector('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(opportunityService.createOpportunity).toHaveBeenCalledTimes(1);
      });

      const calledData = opportunityService.createOpportunity.mock.calls[0][0];
      expect(calledData.title_ar).toBe('مؤتمر الصحة والتغير المناخي 2026');
      expect(calledData.apply_link).toBe('https://conference.example.com');
      expect(calledData.teaser_permission_key).toBe('view:public_content');
    });
  });

  describe('2. OpportunityCard Two-Tier Action Button', () => {
    it('Full Access: Renders "Apply Now" button and opens external link when apply_link is present', () => {
      render(
        <OpportunityCard 
          {...mockOpportunitiesList[0]}
          lang="ar"
        />
      );

      const applyBtn = screen.getByText('تقديم الطلب');
      expect(applyBtn).toBeInTheDocument();

      fireEvent.click(applyBtn);
      expect(window.open).toHaveBeenCalledWith('https://apply.climamedix.org/opp-1', '_blank', 'noopener,noreferrer');
    });

    it('Teaser / Masked Access: Renders "Sign in to Apply" button and navigates to /auth when apply_link is null', () => {
      const pushStateSpy = vi.spyOn(window.history, 'pushState');
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

      render(
        <OpportunityCard 
          {...mockOpportunitiesList[1]}
          lang="ar"
        />
      );

      // Because apply_link is null, teaser prompt is shown
      const signinBtn = screen.getByText('سجل لعرض الرابط');
      expect(signinBtn).toBeInTheDocument();

      fireEvent.click(signinBtn);

      expect(pushStateSpy).toHaveBeenCalledWith({}, '', '/auth');
      expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(PopStateEvent));
    });
  });
});
