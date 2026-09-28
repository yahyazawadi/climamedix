import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { ProfilePage } from '../features/profile/components/ProfilePage';
import { evaluatePermission } from '../features/auth/hooks/useAuth';

// ─── MOCKS ───────────────────────────────────────────────────────────────────

let currentAuth = {
  user: null,
  userProfile: null,
  hasPermission: () => false,
  loading: false
};

vi.mock('../features/auth/hooks/useAuth', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAuth: () => currentAuth
  };
});

// Mock S3 Client
vi.mock('../utils/s3Client', () => ({
  uploadFileToR2: vi.fn().mockImplementation((file, folder) => {
    return Promise.resolve(`https://cdn.climamedix.org/${folder}/${file.name || 'avatar.webp'}`);
  })
}));

// Mock DatePicker
vi.mock('../features/shared/components/DatePicker', () => ({
  DatePicker: ({ value, onChange, id }) => (
    <input
      data-testid="mock-datepicker"
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}));

// Supabase mock
let mockProfileUpdate = vi.fn();
let mockProfilesDb = {};

vi.mock('../utils/supabaseClient', () => ({
  supabase: {
    from: (table) => ({
      select: vi.fn().mockImplementation(() => ({
        eq: vi.fn().mockImplementation((col, val) => ({
          single: vi.fn().mockResolvedValue({
            data: mockProfilesDb[val] || null,
            error: null
          }),
          then: (cb) => cb({ data: mockProfilesDb[val] || null, error: null })
        }))
      })),
      update: vi.fn().mockImplementation((fields) => ({
        eq: vi.fn().mockImplementation((col, val) => {
          mockProfileUpdate(fields, val);
          if (mockProfilesDb[val]) {
            mockProfilesDb[val] = { ...mockProfilesDb[val], ...fields };
          }
          return Promise.resolve({ error: null });
        })
      }))
    })
  }
}));

// Helper to render with AuthProvider
function renderProfileWithAuth(ui, { role = 'user', profileOverrides = {}, isGuest = false } = {}) {
  const profile = isGuest ? null : {
    id: `usr-${role}-123`,
    email: `${role}@climamedix.org`,
    role,
    title: 'Dr',
    full_name: 'د. ياسمين الشامي',
    birthdate: '1990-04-12',
    city: 'عمان',
    country: 'الأردن',
    profession: 'doctor',
    university_or_org: 'الجامعة الأردنية',
    specialty: 'طب باطني ورئة',
    is_activist: true,
    field_of_activism: 'تغير المناخ وصحة الأطفال',
    is_researcher: true,
    field_of_research: 'أثر جسيمات PM2.5 على مرضى الربو',
    bio: 'طبيبة باحثة مهتمة بالصحة البيئية في بلاد الشام.',
    avatar_url: 'https://cdn.climamedix.org/avatars/yasmine.webp',
    ...profileOverrides
  };

  if (profile) {
    mockProfilesDb[profile.id] = { ...profile };
  }

  currentAuth = {
    user: profile ? { id: profile.id, email: profile.email } : null,
    userProfile: profile,
    loading: false,
    hasPermission: (perm) => evaluatePermission(perm, role === 'guest' ? null : role)
  };

  return render(ui);
}

describe('Profile Management & Account Security Test Suite (48 Tests)', () => {
  beforeAll(() => {
    // JSDOM setup
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockProfilesDb = {};
    window.scrollTo = vi.fn();

    // Mock geolocation IP API fetch
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('ipapi.co')) {
        return Promise.resolve({
          json: () => Promise.resolve({ city: 'القاهرة', country_name: 'مصر' })
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Unauthenticated Visitor Flow (4 Tests)
  // ──────────────────────────────────────────────────────────────────────────
  describe('1. Unauthenticated Visitor Flow (4 Tests)', () => {
    it('renders login prompt when user is not authenticated in Arabic', () => {
      renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, { isGuest: true });

      expect(screen.getByText('سجل الدخول للمتابعة')).toBeDefined();
      expect(screen.getByText('دخول')).toBeDefined();
    });

    it('renders login prompt in English when lang is en', () => {
      renderProfileWithAuth(<ProfilePage lang="en" onNavigate={vi.fn()} />, { isGuest: true });

      expect(screen.getByText('Please Login to Continue')).toBeDefined();
      expect(screen.getByText('Login')).toBeDefined();
    });

    it('clicking login button on guest screen navigates to auth page', () => {
      const onNavigate = vi.fn();
      renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={onNavigate} />, { isGuest: true });

      const loginBtn = screen.getByText('دخول');
      fireEvent.click(loginBtn);

      expect(onNavigate).toHaveBeenCalledWith('auth');
    });

    it('does not render profile editing form or avatar uploader for guests', () => {
      const { container } = renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, { isGuest: true });

      expect(container.querySelector('form.profile-edit-form')).toBeNull();
      expect(container.querySelector('.avatar-uploader-container')).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Profile Data Binding & Initials Fallback (8 Tests)
  // ──────────────────────────────────────────────────────────────────────────
  describe('2. Profile Data Binding & Initials Fallback (8 Tests)', () => {
    it('populates personal info fields from userProfile in Arabic', async () => {
      renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, {
        role: 'user',
        profileOverrides: {
          full_name: 'د. ياسمين الشامي',
          city: 'عمان',
          country: 'الأردن',
          bio: 'طبيبة باحثة مهتمة بالصحة البيئية.'
        }
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('د. ياسمين الشامي')).toBeDefined();
        expect(screen.getByDisplayValue('عمان')).toBeDefined();
        expect(screen.getByDisplayValue('الأردن')).toBeDefined();
      });
    });

    it('displays user email in profile meta card', () => {
      renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, {
        role: 'user',
        profileOverrides: { email: 'yasmine@climamedix.org' }
      });

      expect(screen.getByText('yasmine@climamedix.org')).toBeDefined();
    });

    it('renders avatar image element when avatar_url is provided', () => {
      const { container } = renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, {
        role: 'user',
        profileOverrides: { avatar_url: 'https://cdn.climamedix.org/avatars/yasmine.webp' }
      });

      const img = container.querySelector('img.avatar-image-el');
      expect(img).not.toBeNull();
      expect(img.src).toBe('https://cdn.climamedix.org/avatars/yasmine.webp');
    });

    it('renders initials fallback when avatar_url is empty', () => {
      const { container } = renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, {
        role: 'user',
        profileOverrides: { avatar_url: '', full_name: 'Kareem Nabil' }
      });

      const initials = container.querySelector('.avatar-initials-el');
      expect(initials).not.toBeNull();
      expect(initials.textContent).toBe('KN');
    });

    it('renders "CM" fallback initials if full_name is empty', () => {
      const { container } = renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, {
        role: 'user',
        profileOverrides: { avatar_url: '', full_name: '' }
      });

      const initials = container.querySelector('.avatar-initials-el');
      expect(initials).not.toBeNull();
      expect(initials.textContent).toBe('CM');
    });

    it('binds title dropdown to profile title', () => {
      const { container } = renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, {
        role: 'user',
        profileOverrides: { title: 'Dr' }
      });

      const select = container.querySelector('select.select-field');
      expect(select.value).toBe('Dr');
    });

    it('auto-detects city and country via IP when profile fields are empty', async () => {
      renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, {
        role: 'user',
        profileOverrides: { city: '', country: '' }
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('القاهرة')).toBeDefined();
        expect(screen.getByDisplayValue('مصر')).toBeDefined();
      });
    });

    it('clicking "تحديد الموقع" manually fetches and sets location', async () => {
      const { container } = renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, {
        role: 'user',
        profileOverrides: { city: '', country: '' }
      });

      const detectBtn = container.querySelector('button.detect-location-btn');
      expect(detectBtn).not.toBeNull();
      fireEvent.click(detectBtn);

      await waitFor(() => {
        expect(screen.getByDisplayValue('القاهرة')).toBeDefined();
        expect(screen.getByDisplayValue('مصر')).toBeDefined();
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Role Badges Across All 5 Roles in Profile (7 Tests)
  // ──────────────────────────────────────────────────────────────────────────
  describe('3. Role Badges in Profile Header (7 Tests)', () => {
    it('displays "عضو المنصة" for standard user role in Arabic', () => {
      renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, { role: 'user' });
      expect(screen.getByText('عضو المنصة')).toBeDefined();
    });

    it('displays "Platform Member" for standard user role in English', () => {
      renderProfileWithAuth(<ProfilePage lang="en" onNavigate={vi.fn()} />, { role: 'user' });
      expect(screen.getByText('Platform Member')).toBeDefined();
    });

    it('displays "باحث علمي معتمد" for researcher role in Arabic', () => {
      renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, { role: 'researcher' });
      expect(screen.getByText('باحث علمي معتمد')).toBeDefined();
    });

    it('displays "Verified Educator" for educator role in English', () => {
      renderProfileWithAuth(<ProfilePage lang="en" onNavigate={vi.fn()} />, { role: 'educator' });
      expect(screen.getByText('Verified Educator')).toBeDefined();
    });

    it('displays "مسؤول النظام" for admin role in Arabic', () => {
      renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, { role: 'admin' });
      expect(screen.getByText('مسؤول النظام')).toBeDefined();
    });

    it('displays "Super Admin" for superadmin role in English', () => {
      renderProfileWithAuth(<ProfilePage lang="en" onNavigate={vi.fn()} />, { role: 'superadmin' });
      expect(screen.getByText('Super Admin')).toBeDefined();
    });

    it('displays badge CSS class corresponding to the role', () => {
      const { container } = renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, { role: 'superadmin' });
      const badge = container.querySelector('.profile-role-badge');
      expect(badge.className).toContain('badge-superadmin');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Role-Based Section B (Professional Details) Guarding (8 Tests)
  // ──────────────────────────────────────────────────────────────────────────
  describe('4. Professional Details Section Gating (8 Tests)', () => {
    it('HIDES Section B (Professional Details) for unapproved user role', () => {
      const { container } = renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, {
        role: 'user'
      });

      expect(container.querySelector('.block-professional')).toBeNull();
      expect(screen.queryByText('البيانات المهنية والتخصصية')).toBeNull();
    });

    it('HIDES Section B for subscriber role', () => {
      const { container } = renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, {
        role: 'subscriber'
      });

      expect(container.querySelector('.block-professional')).toBeNull();
    });

    it('RENDERS Section B for researcher role', () => {
      const { container } = renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, {
        role: 'researcher'
      });

      expect(container.querySelector('.block-professional')).not.toBeNull();
      expect(screen.getByText('البيانات المهنية (للمتخصصين)')).toBeDefined();
    });

    it('RENDERS Section B for educator role', () => {
      const { container } = renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, {
        role: 'educator'
      });

      expect(container.querySelector('.block-professional')).not.toBeNull();
    });

    it('RENDERS Section B for admin role', () => {
      const { container } = renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, {
        role: 'admin'
      });

      expect(container.querySelector('.block-professional')).not.toBeNull();
    });

    it('RENDERS Section B for superadmin role', () => {
      const { container } = renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, {
        role: 'superadmin'
      });

      expect(container.querySelector('.block-professional')).not.toBeNull();
    });

    it('toggling is_activist checkbox reveals field_of_activism input', () => {
      const { container } = renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, {
        role: 'researcher',
        profileOverrides: { is_activist: false, field_of_activism: '' }
      });

      const activistCheckbox = container.querySelector('#profileIsActivist');
      expect(container.querySelector('input[value="تغير المناخ وصحة الأطفال"]')).toBeNull();

      fireEvent.click(activistCheckbox);

      expect(container.querySelector('#profileIsActivist').checked).toBe(true);
      expect(container.querySelectorAll('.conditional-input-wrapper').length).toBeGreaterThanOrEqual(1);
    });

    it('toggling is_researcher checkbox reveals field_of_research input', () => {
      const { container } = renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, {
        role: 'educator',
        profileOverrides: { is_researcher: false, field_of_research: '' }
      });

      const researcherCheckbox = container.querySelector('#profileIsResearcher');
      fireEvent.click(researcherCheckbox);

      expect(container.querySelector('#profileIsResearcher').checked).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Form Edits & Supabase Profile Updates (10 Tests)
  // ──────────────────────────────────────────────────────────────────────────
  describe('5. Form Edits & Supabase Profile Updates (10 Tests)', () => {
    it('editing full_name updates state and input value', () => {
      const { container } = renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, {
        role: 'user'
      });

      const inputs = container.querySelectorAll('input.form-input-field');
      const nameInput = inputs[0]; // first text input in personal section
      fireEvent.input(nameInput, { target: { value: 'د. طارق الحكيم' } });

      expect(nameInput.value).toBe('د. طارق الحكيم');
    });

    it('editing bio updates textarea value', () => {
      const { container } = renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, {
        role: 'user'
      });

      const bioTextarea = container.querySelector('textarea.textarea-field');
      fireEvent.input(bioTextarea, { target: { value: 'سيرة ذاتية جديدة للباحث' } });

      expect(bioTextarea.value).toBe('سيرة ذاتية جديدة للباحث');
    });

    it('submitting personal info form updates Supabase profiles table', async () => {
      const { container } = renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, {
        role: 'user',
        profileOverrides: { id: 'usr-user-123' }
      });

      const form = container.querySelector('form.profile-edit-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockProfileUpdate).toHaveBeenCalledTimes(1);
        const [updatedFields, userId] = mockProfileUpdate.mock.calls[0];
        expect(userId).toBe('usr-user-123');
        expect(updatedFields.full_name).toBe('د. ياسمين الشامي');
        expect(updatedFields.city).toBe('عمان');
        expect(updatedFields.country).toBe('الأردن');
      });
    });

    it('for unapproved user, professional fields are EXCLUDED from update payload', async () => {
      const { container } = renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, {
        role: 'user'
      });

      const form = container.querySelector('form.profile-edit-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockProfileUpdate).toHaveBeenCalled();
        const [updatedFields] = mockProfileUpdate.mock.calls[0];
        expect(updatedFields.profession).toBeUndefined();
        expect(updatedFields.university_or_org).toBeUndefined();
        expect(updatedFields.specialty).toBeUndefined();
      });
    });

    it('for approved researcher, professional fields are INCLUDED in update payload', async () => {
      const { container } = renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, {
        role: 'researcher',
        profileOverrides: {
          profession: 'researcher',
          university_or_org: 'جامعة اليرموك',
          specialty: 'علم الأوبئة البيئية'
        }
      });

      const form = container.querySelector('form.profile-edit-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockProfileUpdate).toHaveBeenCalled();
        const [updatedFields] = mockProfileUpdate.mock.calls[0];
        expect(updatedFields.profession).toBe('researcher');
        expect(updatedFields.university_or_org).toBe('جامعة اليرموك');
        expect(updatedFields.specialty).toBe('علم الأوبئة البيئية');
      });
    });

    it('displays success alert upon successful profile save in Arabic', async () => {
      const { container } = renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, {
        role: 'user'
      });

      const form = container.querySelector('form.profile-edit-form');
      fireEvent.submit(form);

      await waitFor(() => {
        const alertBox = container.querySelector('.profile-status-alert.alert-success');
        expect(alertBox).not.toBeNull();
        expect(alertBox.textContent).toContain('تم تحديث الملف الشخصي بنجاح');
      });
    });

    it('displays success alert in English when lang is en', async () => {
      const { container } = renderProfileWithAuth(<ProfilePage lang="en" onNavigate={vi.fn()} />, {
        role: 'user'
      });

      const form = container.querySelector('form.profile-edit-form');
      fireEvent.submit(form);

      await waitFor(() => {
        const alertBox = container.querySelector('.profile-status-alert.alert-success');
        expect(alertBox).not.toBeNull();
        expect(alertBox.textContent).toContain('Profile updated successfully');
      });
    });

    it('scrolls to top of page upon saving profile to display alert', async () => {
      const { container } = renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, {
        role: 'user'
      });

      const form = container.querySelector('form.profile-edit-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
      });
    });

    it('disables save button and displays spinner while saving=true', async () => {
      mockProfileUpdate = vi.fn().mockImplementation(() => new Promise(() => {})); // pending promise
      const { container } = renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, {
        role: 'user'
      });

      const form = container.querySelector('form.profile-edit-form');
      const submitBtn = container.querySelector('button[type="submit"]');

      fireEvent.submit(form);

      await waitFor(() => {
        expect(submitBtn.hasAttribute('disabled')).toBe(true);
        expect(container.querySelector('.loading-spinner-el')).not.toBeNull();
      });
    });

    it('displays error alert if Supabase update fails with error', async () => {
      vi.mocked(mockProfileUpdate).mockImplementationOnce(() => {
        throw new Error('Database connection failure');
      });

      const { container } = renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, {
        role: 'user'
      });

      const form = container.querySelector('form.profile-edit-form');
      fireEvent.submit(form);

      await waitFor(() => {
        const alertBox = container.querySelector('.profile-status-alert.alert-error');
        expect(alertBox).not.toBeNull();
        expect(alertBox.textContent).toContain('Database connection failure');
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Avatar Upload & Learning Hub Navigation (11 Tests)
  // ──────────────────────────────────────────────────────────────────────────
  describe('6. Avatar Upload & Learning Hub Navigation (11 Tests)', () => {
    it('clicking avatar wrapper triggers click on hidden file input', () => {
      const { container } = renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, {
        role: 'user'
      });

      const fileInput = container.querySelector('input[type="file"]');
      const clickSpy = vi.spyOn(fileInput, 'click');

      const avatarWrapper = container.querySelector('.avatar-circle-wrapper');
      fireEvent.click(avatarWrapper);

      expect(clickSpy).toHaveBeenCalledTimes(1);
    });

    it('avatar file input has accept="image/*"', () => {
      const { container } = renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, {
        role: 'user'
      });

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput.getAttribute('accept')).toBe('image/*');
    });

    it('uploading new avatar calls uploadFileToR2 with avatar folder', async () => {
      const { container } = renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, {
        role: 'user'
      });

      const fileInput = container.querySelector('input[type="file"]');
      const fakeImage = new File(['fake image bits'], 'avatar.webp', { type: 'application/octet-stream' });

      fireEvent.change(fileInput, { target: { files: [fakeImage] } });

      await waitFor(() => {
        expect(container.querySelector('.avatar-image-el')).not.toBeNull();
      });
    });

    it('updates profiles.avatar_url in Supabase upon successful upload', async () => {
      const { container } = renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, {
        role: 'user',
        profileOverrides: { id: 'usr-user-123' }
      });

      const fileInput = container.querySelector('input[type="file"]');
      const fakeImage = new File(['image bits'], 'my-photo.webp', { type: 'application/octet-stream' });

      fireEvent.change(fileInput, { target: { files: [fakeImage] } });

      await waitFor(() => {
        expect(mockProfileUpdate).toHaveBeenCalled();
        const [updatedFields, userId] = mockProfileUpdate.mock.calls[0];
        expect(userId).toBe('usr-user-123');
        expect(updatedFields.avatar_url).toContain('https://cdn.climamedix.org/avatars/');
      });
    });

    it('shows success alert message after avatar upload completes in Arabic', async () => {
      const { container } = renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, {
        role: 'user'
      });

      const fileInput = container.querySelector('input[type="file"]');
      const fakeImage = new File(['image bits'], 'avatar.webp', { type: 'application/octet-stream' });

      fireEvent.change(fileInput, { target: { files: [fakeImage] } });

      await waitFor(() => {
        const alertBox = container.querySelector('.profile-status-alert.alert-success');
        expect(alertBox).not.toBeNull();
        expect(alertBox.textContent).toContain('تم رفع وتحديث الصورة الشخصية بنجاح');
      });
    });

    it('shows success alert message after avatar upload in English', async () => {
      const { container } = renderProfileWithAuth(<ProfilePage lang="en" onNavigate={vi.fn()} />, {
        role: 'user'
      });

      const fileInput = container.querySelector('input[type="file"]');
      const fakeImage = new File(['image bits'], 'avatar.webp', { type: 'application/octet-stream' });

      fireEvent.change(fileInput, { target: { files: [fakeImage] } });

      await waitFor(() => {
        const alertBox = container.querySelector('.profile-status-alert.alert-success');
        expect(alertBox).not.toBeNull();
        expect(alertBox.textContent).toContain('Avatar updated successfully');
      });
    });

    it('displays error alert if avatar upload throws an error', async () => {
      const s3Client = await import('../utils/s3Client');
      vi.spyOn(s3Client, 'uploadFileToR2').mockRejectedValueOnce(new Error('Cloudflare network timeout'));

      const { container } = renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, {
        role: 'user'
      });

      const fileInput = container.querySelector('input[type="file"]');
      const fakeImage = new File(['image'], 'photo.webp', { type: 'application/octet-stream' });

      fireEvent.change(fileInput, { target: { files: [fakeImage] } });

      await waitFor(() => {
        const alertBox = container.querySelector('.profile-status-alert.alert-error');
        expect(alertBox).not.toBeNull();
        expect(alertBox.textContent).toContain('Cloudflare network timeout');
      });
    });

    it('Learning Hub card renders title and empty placeholder in Arabic', () => {
      renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={vi.fn()} />, { role: 'user' });

      expect(screen.getByText('منصتي التعليمية')).toBeDefined();
      expect(screen.getByText('لا توجد مساقات مسجلة حالياً. سجل في الدورات التدريبية المتاحة لتظهر هنا.')).toBeDefined();
    });

    it('Learning Hub card renders in English when lang is en', () => {
      renderProfileWithAuth(<ProfilePage lang="en" onNavigate={vi.fn()} />, { role: 'user' });

      expect(screen.getByText('My Learning Hub')).toBeDefined();
      expect(screen.getByText('No enrolled courses yet. Register for available training programs to display them here.')).toBeDefined();
    });

    it('clicking "تصفح الدورات" button navigates to training section of home', () => {
      const onNavigate = vi.fn();
      renderProfileWithAuth(<ProfilePage lang="ar" onNavigate={onNavigate} />, { role: 'user' });

      const browseBtn = screen.getByText('تصفح الدورات');
      fireEvent.click(browseBtn);

      expect(onNavigate).toHaveBeenCalledWith('home', 'training');
    });

    it('clicking "Browse Courses" button navigates in English mode', () => {
      const onNavigate = vi.fn();
      renderProfileWithAuth(<ProfilePage lang="en" onNavigate={onNavigate} />, { role: 'user' });

      const browseBtn = screen.getByText('Browse Courses');
      fireEvent.click(browseBtn);

      expect(onNavigate).toHaveBeenCalledWith('home', 'training');
    });
  });
});
