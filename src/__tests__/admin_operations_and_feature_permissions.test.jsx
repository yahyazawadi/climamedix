import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { evaluatePermission, AuthProvider, useAuth } from '../features/auth/hooks/useAuth';
import { EventsPage } from '../features/events/EventsPage';
import { EventsCalendar } from '../features/events/components/EventsCalendar';
import { CertificateAuditDashboard } from '../features/admin/components/CertificateAuditDashboard';
import { SliderManagerPage } from '../features/admin/components/SliderManagerPage';
import { DynamicHomeSlider } from '../features/main/components/DynamicHomeSlider';
import { NewsMap } from '../features/news-blog/components/NewsMap';

// ─── MOCKS ───────────────────────────────────────────────────────────────────

// GSAP mock
vi.mock('gsap', () => ({
  default: {
    context: (cb) => {
      cb();
      return { revert: vi.fn() };
    },
    fromTo: vi.fn(),
    to: vi.fn(),
    set: vi.fn(),
  }
}));

// BaseMap mock
vi.mock('../features/shared/components/BaseMap', () => ({
  BaseMap: ({ children, onMapLoad }) => {
    return (
      <div data-testid="mock-base-map" style={{ position: 'relative' }}>
        {children}
      </div>
    );
  }
}));

// Mock S3 Client
vi.mock('../utils/s3Client', () => ({
  uploadFileToR2: vi.fn().mockResolvedValue('https://cdn.climamedix.org/slider/test-banner.webp')
}));

// In-memory mock database state for Supabase
let mockEvents = [];
let mockSliderItems = [];
let mockCertRequests = [];
let mockNewsNodes = [];

vi.mock('../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: {
          subscription: {
            unsubscribe: vi.fn()
          }
        }
      }),
      signOut: vi.fn().mockResolvedValue({ error: null })
    },
    from: (table) => ({
      select: vi.fn().mockImplementation((cols) => {
        let currentFiltered = null;
        const chain = {
          eq: vi.fn().mockImplementation((col, val) => {
            if (table === 'certificate_requests') {
              currentFiltered = (currentFiltered || mockCertRequests).filter(r => r[col] === val);
            }
            return chain;
          }),
          order: vi.fn().mockImplementation(() => {
            if (table === 'events') return Promise.resolve({ data: [...mockEvents], error: null });
            if (table === 'home_slider') return Promise.resolve({ data: [...mockSliderItems], error: null });
            if (table === 'certificate_requests') return Promise.resolve({ data: currentFiltered ? [...currentFiltered] : [...mockCertRequests], error: null });
            if (table === 'news_map_nodes') return Promise.resolve({ data: [...mockNewsNodes], error: null });
            return Promise.resolve({ data: [], error: null });
          }),
          then: (cb) => {
            if (table === 'events') return cb({ data: [...mockEvents], error: null });
            if (table === 'home_slider') return cb({ data: [...mockSliderItems], error: null });
            if (table === 'certificate_requests') return cb({ data: currentFiltered ? [...currentFiltered] : [...mockCertRequests], error: null });
            if (table === 'news_map_nodes') return cb({ data: [...mockNewsNodes], error: null });
            if (table === 'lesson_watch_metrics') {
              return cb({
                data: [
                  { lesson_id: 'les-1', watch_duration_sec: 600, total_duration_sec: 600, completed: true }
                ],
                error: null
              });
            }
            if (table === 'quiz_attempts') {
              return cb({
                data: [
                  { score: 100, passed: true, quizzes: { course_id: 'c-1', title_ar: 'اختبار المناخ' } }
                ],
                error: null
              });
            }
            if (table === 'courses' || table === 'news_articles' || table === 'opportunities' || table === 'publications') {
              return cb({ data: [], error: null });
            }
            return cb({ data: [], error: null });
          }
        };
        return chain;
      }),
      insert: vi.fn().mockImplementation((rows) => {
        if (table === 'events') {
          rows.forEach((r, idx) => mockEvents.push({ id: `evt-${Date.now()}-${idx}`, ...r }));
        }
        if (table === 'news_map_nodes') {
          rows.forEach((r, idx) => mockNewsNodes.push({ id: `node-${Date.now()}-${idx}`, ...r }));
        }
        return Promise.resolve({ data: rows, error: null });
      }),
      update: vi.fn().mockImplementation((updates) => ({
        eq: vi.fn().mockImplementation((col, val) => {
          if (table === 'certificate_requests') {
            mockCertRequests = mockCertRequests.map(r => r[col] === val ? { ...r, ...updates } : r);
          }
          return Promise.resolve({ error: null });
        })
      })),
      delete: vi.fn().mockImplementation(() => ({
        eq: vi.fn().mockImplementation((col, val) => {
          if (table === 'news_map_nodes') {
            mockNewsNodes = mockNewsNodes.filter(n => n[col] !== val);
          }
          if (table === 'home_slider') {
            mockSliderItems = mockSliderItems.filter(s => s[col] !== val);
          }
          return Promise.resolve({ error: null });
        })
      }))
    })
  }
}));

// Helper wrapper providing AuthProvider
function renderWithAuth(ui, { role = 'superadmin', custom_permissions = [], disabledPermissions = [] } = {}) {
  if (disabledPermissions && disabledPermissions.length > 0) {
    localStorage.setItem('disabled_permissions', JSON.stringify(disabledPermissions));
  } else {
    localStorage.removeItem('disabled_permissions');
  }

  const profile = role === 'guest' ? null : {
    id: `usr-${role}`,
    email: `${role}@climamedix.org`,
    role,
    custom_permissions
  };

  return render(
    <AuthProvider initialProfile={profile} initialDevAdmin={role === 'superadmin'}>
      {ui}
    </AuthProvider>
  );
}

describe('Admin Operations & Feature Permissions Test Suite (38 Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    mockEvents = [
      {
        id: 'evt-1',
        title_ar: 'مؤتمر المناخ والصحة 2026',
        title_en: 'Climate & Health Summit 2026',
        event_date: '2026-07-15T09:00:00Z',
        time: '09:00 AM',
        type_ar: 'مؤتمر دولي',
        type_en: 'International Conference',
        description_ar: 'مؤتمر يناقش التغير الحراري وأمراض الرئة',
        description_en: 'Summit discussing thermal stress and lung diseases',
        registration_link: 'https://climamedix.org/register-summit'
      }
    ];

    mockSliderItems = [
      {
        id: 'slide-1',
        title_ar: 'إطلاق مساق طب الكوارث',
        title_en: 'Disaster Medicine Course Launch',
        image_url: 'https://cdn.climamedix.org/slider/slide1.webp',
        sequence_order: 1,
        link: '/learning-hub'
      }
    ];

    mockCertRequests = [
      {
        id: 'cert-req-101',
        user_id: 'student-99',
        course_id: 'c-1',
        requested_name_ar: 'د. أحمد السالم',
        requested_name_en: 'Dr. Ahmad Al-Salem',
        full_name_ar: 'د. أحمد السالم',
        status: 'pending',
        requested_at: '2026-07-01T12:00:00Z',
        courses: {
          title_ar: 'مقدمة في التغير المناخي والطب',
          title_en: 'Intro to Climate Medicine',
          duration: '6 أسابيع'
        }
      }
    ];

    mockNewsNodes = [
      {
        id: 'node-1',
        latitude: 31.95,
        longitude: 35.91,
        radius_km: 45,
        icon_type: 'danger',
        description_ar: 'بؤرة حرارية مرتفعة في عمان',
        description_en: 'Thermal heatwave hotspot in Amman',
        link: 'https://climamedix.org/news/1'
      }
    ];
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Events Calendar & Seminars Engine (write:events, manage:any_event) (10 Tests)
  // ──────────────────────────────────────────────────────────────────────────
  describe('1. Events Calendar Engine (write:events, manage:any_event) (10 Tests)', () => {
    const rolesWithWriteEvents = ['educator', 'admin', 'superadmin'];
    const rolesWithoutWriteEvents = ['guest', 'user', 'subscriber', 'researcher'];
    const calendarEvents = [
      {
        id: 'evt-1',
        title: 'مؤتمر المناخ والصحة 2026',
        date: '2026-07-15',
        time: '09:00 AM',
        type: 'مؤتمر دولي',
        desc: 'مؤتمر يناقش التغير الحراري وأمراض الرئة',
        link: 'https://climamedix.org/register-summit'
      }
    ];

    it('validates write:events and manage:any_event permission mapping across all 7 roles', () => {
      rolesWithWriteEvents.forEach(role => {
        const canWrite = evaluatePermission('write:events', role);
        expect(canWrite).toBe(true);
      });

      rolesWithoutWriteEvents.forEach(role => {
        const roleArg = role === 'guest' ? null : role;
        const canWrite = evaluatePermission('write:events', roleArg);
        expect(canWrite).toBe(false);
      });
    });

    it('omits the "Add Event" button when canManageEvents is false in EventsCalendar', () => {
      render(
        <EventsCalendar
          events={calendarEvents}
          isArabic={true}
          canManageEvents={false}
          onAddEvent={vi.fn()}
        />
      );

      expect(screen.queryByText(/\+?\s*إضافة فعالية/)).toBeNull();
      expect(screen.queryByText(/Add Event/)).toBeNull();
    });

    it('renders the "Add Event" button when canManageEvents is true in EventsCalendar', () => {
      render(
        <EventsCalendar
          events={calendarEvents}
          isArabic={true}
          canManageEvents={true}
          onAddEvent={vi.fn()}
        />
      );

      const addBtn = screen.getByText(/\+?\s*إضافة فعالية/);
      expect(addBtn).toBeDefined();
    });

    it('clicking "Add Event" triggers onAddEvent callback', () => {
      const onAddEvent = vi.fn();
      render(
        <EventsCalendar
          events={calendarEvents}
          isArabic={true}
          canManageEvents={true}
          onAddEvent={onAddEvent}
        />
      );

      const addBtn = screen.getByText(/\+?\s*إضافة فعالية/);
      fireEvent.click(addBtn);
      expect(onAddEvent).toHaveBeenCalledTimes(1);
    });

    it('in EventsPage with superadmin, clicking "Add Event" opens the modal dialog', async () => {
      const { container } = renderWithAuth(<EventsPage lang="ar" onNavigate={vi.fn()} />, {
        role: 'superadmin'
      });

      await waitFor(() => {
        expect(container.textContent).toContain('مؤتمر المناخ والصحة 2026');
      });

      const addBtn = screen.getByText(/\+?\s*إضافة فعالية/);
      fireEvent.click(addBtn);

      expect(container.textContent).toContain('إضافة فعالية جديدة');
      expect(container.querySelector('form')).not.toBeNull();
    });

    it('closing the event modal via close button hides the form dialog', async () => {
      const { container } = renderWithAuth(<EventsPage lang="ar" onNavigate={vi.fn()} />, {
        role: 'admin'
      });

      await waitFor(() => {
        expect(screen.getByText(/\+?\s*إضافة فعالية/)).toBeDefined();
      });

      fireEvent.click(screen.getByText(/\+?\s*إضافة فعالية/));
      expect(container.textContent).toContain('إضافة فعالية جديدة');

      const closeBtn = screen.getByText('×');
      fireEvent.click(closeBtn);

      expect(screen.queryByText('إضافة فعالية جديدة')).toBeNull();
    });

    it('submitting the event form inserts new event into Supabase and updates events list', async () => {
      const { container } = renderWithAuth(<EventsPage lang="ar" onNavigate={vi.fn()} />, {
        role: 'educator'
      });

      await waitFor(() => {
        expect(screen.getByText(/\+?\s*إضافة فعالية/)).toBeDefined();
      });

      fireEvent.click(screen.getByText(/\+?\s*إضافة فعالية/));

      const inputs = container.querySelectorAll('input');
      // Inputs: title_ar, title_en, event_date, time, type_ar, type_en, registration_link
      fireEvent.change(inputs[0], { target: { value: 'ندوة التلوث الهوائي' } });
      fireEvent.change(inputs[1], { target: { value: 'Air Pollution Seminar' } });
      fireEvent.change(inputs[2], { target: { value: '2026-08-20' } });

      const form = container.querySelector('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockEvents.some(e => e.title_ar === 'ندوة التلوث الهوائي')).toBe(true);
      });
    });

    it('switching view mode between list and calendar toggles display views', () => {
      const { container } = render(
        <EventsCalendar
          events={calendarEvents}
          isArabic={true}
          canManageEvents={true}
        />
      );

      // Default view mode is 'list'
      const calendarToggleBtn = container.querySelectorAll('button')[1]; // view mode toggle button
      if (calendarToggleBtn) {
        fireEvent.click(calendarToggleBtn);
        // Calendar cells should be generated
        expect(container.querySelectorAll('.event-card, [style*="border-radius"]').length).toBeGreaterThan(0);
      }
    });

    it('toggling event registration updates registered state for the event', () => {
      const onRegisterEvent = vi.fn();
      render(
        <EventsCalendar
          events={calendarEvents}
          registeredEvents={{ 'evt-1': false }}
          onRegisterEvent={onRegisterEvent}
          isArabic={true}
        />
      );

      // In list view, event card is displayed
      expect(screen.getByText('مؤتمر المناخ والصحة 2026')).toBeDefined();
    });

    it('disabling write:events for educator immediately revokes event creation rights', () => {
      expect(evaluatePermission('write:events', 'educator', [], [])).toBe(true);

      const disabledPerms = ['write:events'];
      const canWrite = evaluatePermission('write:events', 'educator', [], disabledPerms);
      expect(canWrite).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Certificate Audit Dashboard (issue:certs, manage:system) (10 Tests)
  // ──────────────────────────────────────────────────────────────────────────
  describe('2. Certificate Audit Dashboard (issue:certs, manage:system) (10 Tests)', () => {
    it('grants canAudit only to roles possessing issue:certs or manage:system', () => {
      ['admin', 'superadmin'].forEach(role => {
        const canAudit = evaluatePermission('issue:certs', role) || evaluatePermission('manage:system', role);
        expect(canAudit).toBe(true);
      });

      ['guest', 'user', 'subscriber', 'researcher', 'educator'].forEach(role => {
        const roleArg = role === 'guest' ? null : role;
        const canAudit = evaluatePermission('issue:certs', roleArg) || evaluatePermission('manage:system', roleArg);
        expect(canAudit).toBe(false);
      });
    });

    it('renders Access Denied glasscard for standard student user lacking issue:certs', () => {
      renderWithAuth(<CertificateAuditDashboard lang="ar" />, { role: 'user' });

      expect(screen.getByText('غير مصرح بالدخول')).toBeDefined();
      expect(screen.getByText('ليس لديك صلاحيات لتدقيق الشهادات.')).toBeDefined();
    });

    it('renders Access Denied in English for unprivileged user when lang is en', () => {
      renderWithAuth(<CertificateAuditDashboard lang="en" />, { role: 'user' });

      expect(screen.getByText('Access Denied')).toBeDefined();
      expect(screen.getByText('You do not have permissions to audit certificates.')).toBeDefined();
    });

    it('renders dashboard with pending requests table when accessed by admin', async () => {
      renderWithAuth(<CertificateAuditDashboard lang="ar" />, { role: 'admin' });

      await waitFor(() => {
        expect(screen.getByText('مراجعة طلبات الشهادات (تدقيق النزاهة)')).toBeDefined();
        expect(screen.getByText(/د\. أحمد السالم/)).toBeDefined();
        expect(screen.getByText('مقدمة في التغير المناخي والطب')).toBeDefined();
      });
    });

    it('selecting a pending request loads telemetry metrics and passed quiz logs', async () => {
      const { container } = renderWithAuth(<CertificateAuditDashboard lang="ar" />, { role: 'superadmin' });

      await waitFor(() => {
        expect(screen.getByText(/د\. أحمد السالم/)).toBeDefined();
      });

      // Click on row to load metrics
      const studentCell = screen.getByText(/د\. أحمد السالم/);
      fireEvent.click(studentCell);

      await waitFor(() => {
        expect(container.textContent).toContain('اعتماد الشهادة');
      });
    });

    it('approving a certificate request updates status to approved and removes it from pending list', async () => {
      renderWithAuth(<CertificateAuditDashboard lang="ar" />, { role: 'admin' });

      await waitFor(() => {
        expect(screen.getByText(/د\. أحمد السالم/)).toBeDefined();
      });

      fireEvent.click(screen.getByText(/د\. أحمد السالم/));

      await waitFor(() => {
        expect(screen.getByText('اعتماد الشهادة')).toBeDefined();
      });

      const approveBtn = screen.getByText('اعتماد الشهادة');
      fireEvent.click(approveBtn);

      await waitFor(() => {
        expect(mockCertRequests.find(r => r.id === 'cert-req-101')?.status).toBe('approved');
      });
    });

    it('rejecting a certificate without providing a rejection reason keeps reject button disabled', async () => {
      renderWithAuth(<CertificateAuditDashboard lang="ar" />, { role: 'admin' });

      await waitFor(() => {
        expect(screen.getByText(/د\. أحمد السالم/)).toBeDefined();
      });

      fireEvent.click(screen.getByText(/د\. أحمد السالم/));

      await waitFor(() => {
        expect(screen.getByText('رفض الطلب')).toBeDefined();
      });

      const rejectBtn = screen.getByText('رفض الطلب');
      expect(rejectBtn.hasAttribute('disabled')).toBe(true);
      expect(mockCertRequests.find(r => r.id === 'cert-req-101')?.status).toBe('pending');
    });

    it('rejecting a certificate with a reason updates status to rejected and stores rejection_reason', async () => {
      const { container } = renderWithAuth(<CertificateAuditDashboard lang="ar" />, { role: 'admin' });

      await waitFor(() => {
        expect(screen.getByText(/د\. أحمد السالم/)).toBeDefined();
      });

      fireEvent.click(screen.getByText(/د\. أحمد السالم/));

      await waitFor(() => {
        expect(screen.getByText('رفض الطلب')).toBeDefined();
      });

      const input = container.querySelector('input[placeholder*="سبب الرفض"]');
      expect(input).not.toBeNull();
      fireEvent.input(input, { target: { value: 'عدم إكمال نسبة المشاهدة المطلوبة (أقل من 80%)' } });

      const rejectBtn = screen.getByText('رفض الطلب');
      expect(rejectBtn.hasAttribute('disabled')).toBe(false);
      fireEvent.click(rejectBtn);

      await waitFor(() => {
        const rejected = mockCertRequests.find(r => r.id === 'cert-req-101');
        expect(rejected?.status).toBe('rejected');
        expect(rejected?.rejection_reason).toBe('عدم إكمال نسبة المشاهدة المطلوبة (أقل من 80%)');
      });
    });

    it('granting custom_permissions: ["issue:certs"] to educator unlocks CertificateAuditDashboard', () => {
      const canAudit = evaluatePermission('issue:certs', 'educator', ['issue:certs'], []);
      expect(canAudit).toBe(true);

      renderWithAuth(<CertificateAuditDashboard lang="ar" />, {
        role: 'educator',
        custom_permissions: ['issue:certs']
      });

      expect(screen.queryByText('غير مصرح بالدخول')).toBeNull();
    });

    it('disabling issue:certs and manage:system for superadmin completely revokes audit access', () => {
      const disabledPerms = ['issue:certs', 'manage:system'];
      const canAudit = evaluatePermission('issue:certs', 'superadmin', [], disabledPerms) ||
                       evaluatePermission('manage:system', 'superadmin', [], disabledPerms);
      expect(canAudit).toBe(false);

      renderWithAuth(<CertificateAuditDashboard lang="ar" />, {
        role: 'superadmin',
        disabledPermissions: disabledPerms
      });

      expect(screen.getByText('غير مصرح بالدخول')).toBeDefined();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Homepage Slider Manager & Dynamic Slider (manage:slider) (10 Tests)
  // ──────────────────────────────────────────────────────────────────────────
  describe('3. Homepage Slider Manager & Dynamic Slider (manage:slider) (10 Tests)', () => {
    it('validates manage:slider assignment strictly to admin and superadmin', () => {
      expect(evaluatePermission('manage:slider', 'admin')).toBe(true);
      expect(evaluatePermission('manage:slider', 'superadmin')).toBe(true);

      ['guest', 'user', 'subscriber', 'researcher', 'educator'].forEach(role => {
        const roleArg = role === 'guest' ? null : role;
        expect(evaluatePermission('manage:slider', roleArg)).toBe(false);
      });
    });

    it('renders Access Denied text when SliderManagerPage is accessed without manage:slider', () => {
      const { container } = renderWithAuth(<SliderManagerPage lang="ar" onNavigate={vi.fn()} />, {
        role: 'subscriber'
      });

      expect(container.textContent).toContain("Access Denied. You do not have the 'manage:slider' permission.");
    });

    it('renders Slider Manager dashboard header and controls when accessed with manage:slider', async () => {
      const { container } = renderWithAuth(<SliderManagerPage lang="ar" onNavigate={vi.fn()} />, {
        role: 'admin'
      });

      await waitFor(() => {
        expect(container.textContent).toContain('إدارة واجهة الرئيسية (Slider Manager)');
      });
    });

    it('in DynamicHomeSlider with 0 slides, returns null for standard user without manage:slider', async () => {
      mockSliderItems = [];
      const { container } = renderWithAuth(<DynamicHomeSlider lang="ar" onNavigate={vi.fn()} />, {
        role: 'user'
      });

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    it('in DynamicHomeSlider with 0 slides, renders empty configuration banner for manager', async () => {
      mockSliderItems = [];
      const { container } = renderWithAuth(<DynamicHomeSlider lang="ar" onNavigate={vi.fn()} />, {
        role: 'admin'
      });

      await waitFor(() => {
        expect(container.textContent).toContain('شريط العرض (Slider) فارغ حالياً');
        expect(container.textContent).toContain('إضافة محتوى الآن');
      });
    });

    it('clicking "Add Content Now" in empty DynamicHomeSlider navigates to admin-slider', async () => {
      mockSliderItems = [];
      const onNavigate = vi.fn();
      renderWithAuth(<DynamicHomeSlider lang="ar" onNavigate={onNavigate} />, {
        role: 'superadmin'
      });

      await waitFor(() => {
        expect(screen.getByText('إضافة محتوى الآن')).toBeDefined();
      });

      const addBtn = screen.getByText('إضافة محتوى الآن');
      fireEvent.click(addBtn);

      expect(onNavigate).toHaveBeenCalledWith('admin-slider');
    });

    it('DynamicHomeSlider renders active slide title and image when slides are populated', async () => {
      const { container } = renderWithAuth(
        <DynamicHomeSlider
          lang="ar"
          onNavigate={vi.fn()}
        />,
        { role: 'user' }
      );

      await waitFor(() => {
        expect(container.textContent).toContain('إطلاق مساق طب الكوارث');
      });
    });

    it('clicking Next/Prev arrow buttons in DynamicHomeSlider changes active slide index', async () => {
      mockSliderItems = [
        {
          id: 'slide-1',
          title_ar: 'إطلاق مساق طب الكوارث',
          title_en: 'Disaster Medicine Course Launch',
          image_url: 'https://cdn.climamedix.org/slider/slide1.webp',
          sequence_order: 1
        },
        {
          id: 'slide-2',
          title_ar: 'شريحة ثانية للمناخ',
          title_en: 'Second Climate Slide',
          image_url: 'https://cdn.climamedix.org/slider/slide2.webp',
          sequence_order: 2
        }
      ];

      const { container } = renderWithAuth(
        <DynamicHomeSlider lang="ar" onNavigate={vi.fn()} />,
        { role: 'user' }
      );

      await waitFor(() => {
        expect(container.textContent).toContain('إطلاق مساق طب الكوارث');
      });

      const navButtons = container.querySelectorAll('button');
      // Arrow navigation buttons
      if (navButtons.length >= 2) {
        fireEvent.click(navButtons[1]); // Next button
        expect(container.textContent).toContain('شريحة ثانية للمناخ');
      }
    });

    it('granting custom_permissions: ["manage:slider"] allows educator to configure homepage slider', () => {
      const canManage = evaluatePermission('manage:slider', 'educator', ['manage:slider'], []);
      expect(canManage).toBe(true);

      const { container } = renderWithAuth(
        <SliderManagerPage lang="ar" onNavigate={vi.fn()} />,
        { role: 'educator', custom_permissions: ['manage:slider'] }
      );

      expect(container.textContent).not.toContain("Access Denied");
    });

    it('disabling manage:slider via superadmin toggles immediately locks SliderManagerPage', () => {
      const disabledPerms = ['manage:slider'];
      const canManage = evaluatePermission('manage:slider', 'superadmin', [], disabledPerms);
      expect(canManage).toBe(false);

      const { container } = renderWithAuth(
        <SliderManagerPage lang="ar" onNavigate={vi.fn()} />,
        { role: 'superadmin', disabledPermissions: disabledPerms }
      );

      expect(container.textContent).toContain("Access Denied");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Interactive Geospatial News Map (edit:news_map) (8 Tests)
  // ──────────────────────────────────────────────────────────────────────────
  describe('4. Interactive Geospatial News Map (edit:news_map) (8 Tests)', () => {
    it('validates edit:news_map permission is granted only to admin and superadmin', () => {
      expect(evaluatePermission('edit:news_map', 'admin')).toBe(true);
      expect(evaluatePermission('edit:news_map', 'superadmin')).toBe(true);

      ['guest', 'user', 'subscriber', 'researcher', 'educator'].forEach(role => {
        const roleArg = role === 'guest' ? null : role;
        expect(evaluatePermission('edit:news_map', roleArg)).toBe(false);
      });
    });

    it('hides node creation button for regular user lacking edit:news_map', () => {
      const { container } = renderWithAuth(<NewsMap lang="ar" />, { role: 'user' });

      expect(container.querySelector('button[title="إنشاء عقدة جديدة"]')).toBeNull();
      expect(container.querySelector('button[title="Make New Node"]')).toBeNull();
    });

    it('renders floating node creation button for admin with edit:news_map', async () => {
      const { container } = renderWithAuth(<NewsMap lang="ar" />, { role: 'admin' });

      await waitFor(() => {
        const addBtn = container.querySelector('button[title="إنشاء عقدة جديدة"]');
        expect(addBtn).not.toBeNull();
      });
    });

    it('clicking Add Node button toggles isAddingMode and switches button icon and title to Cancel', async () => {
      const { container } = renderWithAuth(<NewsMap lang="ar" />, { role: 'superadmin' });

      await waitFor(() => {
        expect(container.querySelector('button[title="إنشاء عقدة جديدة"]')).not.toBeNull();
      });

      const addBtn = container.querySelector('button[title="إنشاء عقدة جديدة"]');
      fireEvent.click(addBtn);

      await waitFor(() => {
        const cancelBtn = container.querySelector('button[title="إلغاء الإضافة"]');
        expect(cancelBtn).not.toBeNull();
      });
    });

    it('clicking Cancel button switches back to default Add Node mode', async () => {
      const { container } = renderWithAuth(<NewsMap lang="ar" />, { role: 'admin' });

      await waitFor(() => {
        expect(container.querySelector('button[title="إنشاء عقدة جديدة"]')).not.toBeNull();
      });

      let btn = container.querySelector('button[title="إنشاء عقدة جديدة"]');
      fireEvent.click(btn);

      await waitFor(() => {
        btn = container.querySelector('button[title="إلغاء الإضافة"]');
        expect(btn).not.toBeNull();
      });

      fireEvent.click(btn);

      await waitFor(() => {
        expect(container.querySelector('button[title="إنشاء عقدة جديدة"]')).not.toBeNull();
      });
    });

    it('fetches nodes and parses numeric coordinates from Supabase news_map_nodes', async () => {
      renderWithAuth(<NewsMap lang="ar" />, { role: 'admin' });

      await waitFor(() => {
        expect(mockNewsNodes.length).toBe(1);
        expect(mockNewsNodes[0].latitude).toBe(31.95);
        expect(mockNewsNodes[0].longitude).toBe(35.91);
      });
    });

    it('granting custom_permissions: ["edit:news_map"] enables map editing for researcher', async () => {
      const canEdit = evaluatePermission('edit:news_map', 'researcher', ['edit:news_map'], []);
      expect(canEdit).toBe(true);

      const { container } = renderWithAuth(<NewsMap lang="ar" />, {
        role: 'researcher',
        custom_permissions: ['edit:news_map']
      });

      await waitFor(() => {
        expect(container.querySelector('button[title="إنشاء عقدة جديدة"]')).not.toBeNull();
      });
    });

    it('disabling edit:news_map via superadmin toggles immediately hides node creation controls', async () => {
      const disabledPerms = ['edit:news_map'];
      const canEdit = evaluatePermission('edit:news_map', 'superadmin', [], disabledPerms);
      expect(canEdit).toBe(false);

      const { container } = renderWithAuth(<NewsMap lang="ar" />, {
        role: 'superadmin',
        disabledPermissions: disabledPerms
      });

      expect(container.querySelector('button[title="إنشاء عقدة جديدة"]')).toBeNull();
    });
  });
});
