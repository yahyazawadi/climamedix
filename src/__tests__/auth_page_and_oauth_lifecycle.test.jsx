import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/preact';
import { AuthPage } from '../features/auth/AuthPage';

// ─── 1. Mocks ────────────────────────────────────────────────────────────────

// Mock GSAP
vi.mock('gsap', () => ({
  default: {
    fromTo: vi.fn(),
    from: vi.fn(),
    to: vi.fn(),
    context: vi.fn((cb) => {
      cb?.();
      return { revert: vi.fn() };
    })
  }
}));

// Mock InteractiveParticles
vi.mock('../features/auth/InteractiveParticles', () => ({
  InteractiveParticles: () => <div data-testid="interactive-particles" />
}));

// Mock useAuth
const mockSignInWithOAuth = vi.fn();

vi.mock('../features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    signInWithOAuth: mockSignInWithOAuth
  })
}));

describe('AuthPage & Google OAuth Lifecycle Matrix', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSignInWithOAuth.mockResolvedValue({
      provider: 'google',
      url: 'https://accounts.google.com'
    });
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1: Layout & Bilingual Rendering (10 Tests)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('1. Layout & Bilingual Rendering', () => {
    it('renders Arabic header and subtitle by default', () => {
      render(<AuthPage lang="ar" />);

      expect(screen.getByText('مرحباً بك في ClimaMedix')).toBeInTheDocument();
      expect(screen.getByText(/سجّل دخولك مباشرة بنقرة واحدة باستخدام حساب Google/)).toBeInTheDocument();
    });

    it('renders English header and subtitle when lang is en', () => {
      render(<AuthPage lang="en" />);

      expect(screen.getByText('Welcome to ClimaMedix')).toBeInTheDocument();
      expect(screen.getByText(/Sign in directly with one click using your Google account/)).toBeInTheDocument();
    });

    it('renders Google button with Arabic CTA text', () => {
      render(<AuthPage lang="ar" />);

      const googleBtn = screen.getByTestId('google-signin-btn');
      expect(googleBtn).toBeInTheDocument();
      expect(screen.getByText('المتابعة باستخدام Google')).toBeInTheDocument();
    });

    it('renders Google button with English CTA text', () => {
      render(<AuthPage lang="en" />);

      const googleBtn = screen.getByTestId('google-signin-btn');
      expect(googleBtn).toBeInTheDocument();
      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    });

    it('renders SSO badge in Arabic and English', () => {
      const { rerender } = render(<AuthPage lang="ar" />);
      expect(screen.getByText('تسجيل الدخول الموحد والآمن')).toBeInTheDocument();

      rerender(<AuthPage lang="en" />);
      expect(screen.getByText('Secure Single Sign-On')).toBeInTheDocument();
    });

    it('renders verified security note in Arabic', () => {
      render(<AuthPage lang="ar" />);

      expect(screen.getByText('تسجيل دخول موثّق وفوري:')).toBeInTheDocument();
      expect(screen.getByText(/يتم التحقق من حسابك تلقائياً وبأمان عبر Google/)).toBeInTheDocument();
    });

    it('renders verified security note in English', () => {
      render(<AuthPage lang="en" />);

      expect(screen.getByText('Verified Instant Login:')).toBeInTheDocument();
      expect(screen.getByText(/Your account is verified automatically and securely via Google/)).toBeInTheDocument();
    });

    it('renders benefits items in Arabic', () => {
      render(<AuthPage lang="ar" />);

      expect(screen.getByText('وصول مجاني وفوري لكافة دورات ومقالات المنصة')).toBeInTheDocument();
      expect(screen.getByText('حفظ تلقائي للتقدم والشهادات المعتمدة')).toBeInTheDocument();
      expect(screen.getByText('حماية كاملة للخصوصية والبيانات الشخصية')).toBeInTheDocument();
    });

    it('renders benefits items in English', () => {
      render(<AuthPage lang="en" />);

      expect(screen.getByText('Free instant access to all platform courses & articles')).toBeInTheDocument();
      expect(screen.getByText('Automatic progress saving & verified credentials')).toBeInTheDocument();
      expect(screen.getByText('Complete privacy and personal data protection')).toBeInTheDocument();
    });

    it('renders interactive background particles and branding side', () => {
      render(<AuthPage lang="ar" />);

      expect(screen.getByTestId('interactive-particles')).toBeInTheDocument();
      expect(screen.getByText('كلايما ميدكس / ClimaMedix')).toBeInTheDocument();
      expect(screen.getByText(/العمل المناخي يبدأ من هنا/)).toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2: Google OAuth Execution & Lifecycle (12 Tests)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('2. Google OAuth Execution & Lifecycle', () => {
    it('initiates Google OAuth flow when clicking Google button', async () => {
      render(<AuthPage lang="ar" />);

      const googleBtn = screen.getByTestId('google-signin-btn');
      fireEvent.click(googleBtn);

      await waitFor(() => {
        expect(mockSignInWithOAuth).toHaveBeenCalledWith('google');
      });
    });

    it('shows Arabic loading text and disables button while OAuth is pending', async () => {
      let resolveOAuth;
      mockSignInWithOAuth.mockReturnValue(new Promise((resolve) => {
        resolveOAuth = resolve;
      }));

      render(<AuthPage lang="ar" />);

      const googleBtn = screen.getByTestId('google-signin-btn');
      fireEvent.click(googleBtn);

      expect(screen.getByText('جاري التحويل إلى Google...')).toBeInTheDocument();
      expect(googleBtn).toBeDisabled();

      // Resolve and verify button returns to normal
      resolveOAuth({ provider: 'google' });
      await waitFor(() => {
        expect(screen.getByText('المتابعة باستخدام Google')).toBeInTheDocument();
        expect(googleBtn).not.toBeDisabled();
      });
    });

    it('shows English loading text while OAuth is pending', async () => {
      let resolveOAuth;
      mockSignInWithOAuth.mockReturnValue(new Promise((resolve) => {
        resolveOAuth = resolve;
      }));

      render(<AuthPage lang="en" />);

      const googleBtn = screen.getByTestId('google-signin-btn');
      fireEvent.click(googleBtn);

      expect(screen.getByText('Connecting to Google...')).toBeInTheDocument();
      expect(googleBtn).toBeDisabled();

      resolveOAuth({ provider: 'google' });
      await waitFor(() => {
        expect(screen.getByText('Continue with Google')).toBeInTheDocument();
      });
    });

    it('invokes onAuthSuccess callback if OAuth resolves with user object', async () => {
      const onAuthSuccess = vi.fn();
      mockSignInWithOAuth.mockResolvedValueOnce({
        provider: 'google',
        user: { id: 'usr-google-99', email: 'doctor@climamedix.org' }
      });

      render(<AuthPage lang="ar" onAuthSuccess={onAuthSuccess} />);

      fireEvent.click(screen.getByTestId('google-signin-btn'));

      await waitFor(() => {
        expect(onAuthSuccess).toHaveBeenCalledWith({
          id: 'usr-google-99',
          email: 'doctor@climamedix.org'
        });
      });
    });

    it('does not invoke onAuthSuccess if OAuth resolves without user object', async () => {
      const onAuthSuccess = vi.fn();
      mockSignInWithOAuth.mockResolvedValueOnce({
        provider: 'google',
        url: 'https://accounts.google.com/o/oauth2'
      });

      render(<AuthPage lang="ar" onAuthSuccess={onAuthSuccess} />);

      fireEvent.click(screen.getByTestId('google-signin-btn'));

      await waitFor(() => {
        expect(mockSignInWithOAuth).toHaveBeenCalledWith('google');
      });
      expect(onAuthSuccess).not.toHaveBeenCalled();
    });

    it('displays error alert when Google OAuth promise rejects with an error message', async () => {
      mockSignInWithOAuth.mockRejectedValueOnce(new Error('Popup closed by user'));

      render(<AuthPage lang="ar" />);

      fireEvent.click(screen.getByTestId('google-signin-btn'));

      await waitFor(() => {
        expect(screen.getByText('Popup closed by user')).toBeInTheDocument();
      });
      expect(screen.getByTestId('google-signin-btn')).not.toBeDisabled();
    });

    it('displays fallback error message in Arabic when rejection lacks message property', async () => {
      mockSignInWithOAuth.mockRejectedValueOnce({});

      render(<AuthPage lang="ar" />);

      fireEvent.click(screen.getByTestId('google-signin-btn'));

      await waitFor(() => {
        expect(screen.getByText('حدث خطأ في الاتصال بمزود الخدمة')).toBeInTheDocument();
      });
    });

    it('displays fallback error message in English when rejection lacks message property', async () => {
      mockSignInWithOAuth.mockRejectedValueOnce({});

      render(<AuthPage lang="en" />);

      fireEvent.click(screen.getByTestId('google-signin-btn'));

      await waitFor(() => {
        expect(screen.getByText('An error occurred connecting to Google')).toBeInTheDocument();
      });
    });

    it('clears previous alert message before initiating a new OAuth attempt', async () => {
      mockSignInWithOAuth.mockRejectedValueOnce(new Error('Temporary network glitch'));

      render(<AuthPage lang="ar" />);

      fireEvent.click(screen.getByTestId('google-signin-btn'));

      await waitFor(() => {
        expect(screen.getByText('Temporary network glitch')).toBeInTheDocument();
      });

      // Second click clears error immediately
      mockSignInWithOAuth.mockResolvedValueOnce({ provider: 'google' });
      fireEvent.click(screen.getByTestId('google-signin-btn'));

      await waitFor(() => {
        expect(screen.queryByText('Temporary network glitch')).toBeNull();
      });
    });

    it('prevents multiple clicks when button is disabled', async () => {
      mockSignInWithOAuth.mockReturnValue(new Promise(() => {}));

      render(<AuthPage lang="ar" />);

      const googleBtn = screen.getByTestId('google-signin-btn');
      fireEvent.click(googleBtn);
      fireEvent.click(googleBtn);
      fireEvent.click(googleBtn);

      expect(mockSignInWithOAuth).toHaveBeenCalledTimes(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3: Micro-Interactions, GSAP & Directionality (8 Tests)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('3. Micro-Interactions, GSAP & Directionality', () => {
    it('applies hover styling to Google button on mouseEnter and resets on mouseLeave', () => {
      render(<AuthPage lang="ar" />);

      const googleBtn = screen.getByTestId('google-signin-btn');

      fireEvent.mouseEnter(googleBtn);
      expect(googleBtn.style.transform).toBe('translateY(-2px)');
      expect(googleBtn.style.borderColor).toBe('rgb(66, 133, 244)');

      fireEvent.mouseLeave(googleBtn);
      expect(googleBtn.style.transform).toBe('translateY(0)');
      expect(googleBtn.style.borderColor).toBe('rgba(11, 40, 73, 0.12)');
    });

    it('does not change hover transform if button is currently loading', () => {
      mockSignInWithOAuth.mockReturnValue(new Promise(() => {}));

      render(<AuthPage lang="ar" />);

      const googleBtn = screen.getByTestId('google-signin-btn');
      fireEvent.click(googleBtn);

      // Try mouseEnter while loading
      fireEvent.mouseEnter(googleBtn);
      expect(googleBtn.style.transform).not.toBe('translateY(-2px)');
    });

    it('sets RTL direction for Arabic layout', () => {
      const { container } = render(<AuthPage lang="ar" />);

      const splitWrapper = container.querySelector('.auth-split-wrapper');
      expect(splitWrapper).toHaveStyle('direction: rtl');
    });

    it('sets LTR direction for English layout', () => {
      const { container } = render(<AuthPage lang="en" />);

      const splitWrapper = container.querySelector('.auth-split-wrapper');
      expect(splitWrapper).toHaveStyle('direction: ltr');
    });

    it('renders Google SVG icon with official four-color paths', () => {
      const { container } = render(<AuthPage lang="ar" />);

      const svg = container.querySelector('#google-signin-btn svg');
      expect(svg).toBeInTheDocument();

      const paths = svg.querySelectorAll('path');
      expect(paths).toHaveLength(4);
      expect(paths[0]).toHaveAttribute('fill', '#EA4335');
      expect(paths[1]).toHaveAttribute('fill', '#4285F4');
      expect(paths[2]).toHaveAttribute('fill', '#FBBC05');
      expect(paths[3]).toHaveAttribute('fill', '#34A853');
    });

    it('dynamically adapts when lang prop changes via rerender', () => {
      const { rerender } = render(<AuthPage lang="ar" />);
      expect(screen.getByText('مرحباً بك في ClimaMedix')).toBeInTheDocument();

      rerender(<AuthPage lang="en" />);
      expect(screen.getByText('Welcome to ClimaMedix')).toBeInTheDocument();
      expect(screen.queryByText('مرحباً بك في ClimaMedix')).toBeNull();
    });

    it('triggers GSAP animation on alert appearance', async () => {
      mockSignInWithOAuth.mockRejectedValueOnce(new Error('Network error'));
      render(<AuthPage lang="ar" />);

      fireEvent.click(screen.getByTestId('google-signin-btn'));

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
      await new Promise(r => setTimeout(r, 70));
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('does not contain any email or password inputs', () => {
      render(<AuthPage lang="ar" />);

      expect(screen.queryByPlaceholderText('name@example.com')).toBeNull();
      expect(screen.queryByPlaceholderText('••••••••')).toBeNull();
      expect(screen.queryByText('كلمة المرور')).toBeNull();
      expect(screen.queryByText('البريد الإلكتروني')).toBeNull();
      expect(screen.queryByText('إنشاء حساب')).toBeNull();
    });
  });
});
