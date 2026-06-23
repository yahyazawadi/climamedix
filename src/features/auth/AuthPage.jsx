import { useState, useEffect } from 'preact/hooks';
import { useAuth } from './hooks/useAuth';
import { GlassCard } from '../shared/components/GlassCard';
import { Button } from '../shared/components/Button';
import { InteractiveParticles } from './InteractiveParticles';
import gsap from 'gsap';

export function AuthPage({ onAuthSuccess, lang = 'ar' }) {
  const { signIn, signUp, signInWithOAuth } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Renders simple alert
  const showAlert = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => {
      gsap.fromTo('.auth-alert', { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3 });
    }, 50);
  };

  // GSAP animation for initial load
  useEffect(() => {
    gsap.fromTo('.auth-card', 
      { opacity: 0, scale: 0.9, y: 30 },
      { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'power3.out' }
    );
    gsap.from('.auth-fade-in', {
      opacity: 0,
      y: 15,
      stagger: 0.08,
      duration: 0.5,
      delay: 0.2,
      ease: 'power2.out'
    });
  }, [isSignUp]);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (isSignUp) {
        await signUp(email, password);
        showAlert('success', lang === 'ar' ? 'تم إرسال رابط تأكيد الحساب إلى بريدك الإلكتروني!' : 'Confirmation link sent to your email!');
      } else {
        const data = await signIn(email, password);
        showAlert('success', lang === 'ar' ? 'تم تسجيل الدخول بنجاح!' : 'Logged in successfully!');
        if (onAuthSuccess) onAuthSuccess(data.user);
      }
    } catch (err) {
      showAlert('error', err.message || (lang === 'ar' ? 'حدث خطأ ما' : 'An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    setMessage({ type: '', text: '' });
    
    // Currently only Google is configured
    if (provider !== 'google') {
      showAlert('warning', lang === 'ar' ? 'عذراً، طريقة تسجيل الدخول هذه قيد الإعداد حالياً. يرجى استخدام Google أو البريد الإلكتروني.' : 'This login method is currently under setup. Please use Google or Email.');
      return;
    }

    try {
      await signInWithOAuth(provider);
    } catch (err) {
      showAlert('error', err.message || (lang === 'ar' ? 'خطأ في الاتصال بمزود الخدمة' : 'Connection error'));
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-split-wrapper" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
        <div className="auth-form-side" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
          <GlassCard className="auth-card" style={{ maxWidth: '480px', width: '100%', padding: '40px 30px', color: '#0b2849', position: 'relative', overflow: 'hidden' }}>
        
        {/* Glow Effects matching Debug Page */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(21, 180, 122, 0.2)', filter: 'blur(30px)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(0, 76, 109, 0.15)', filter: 'blur(30px)', pointerEvents: 'none' }}></div>

        {/* Tab Toggle */}
        <div className="auth-tabs auth-fade-in" style={{ display: 'flex', background: 'rgba(11, 40, 73, 0.05)', borderRadius: '10px', padding: '4px', marginBottom: '24px', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
          <button 
            onClick={() => setIsSignUp(false)} 
            style={{ flex: 1, padding: '10px', border: 'none', background: !isSignUp ? '#fff' : 'transparent', borderRadius: '8px', color: '#0b2849', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s', boxShadow: !isSignUp ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}
          >
            {lang === 'ar' ? 'تسجيل الدخول' : 'Login'}
          </button>
          <button 
            onClick={() => setIsSignUp(true)} 
            style={{ flex: 1, padding: '10px', border: 'none', background: isSignUp ? '#fff' : 'transparent', borderRadius: '8px', color: '#0b2849', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s', boxShadow: isSignUp ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}
          >
            {lang === 'ar' ? 'إنشاء حساب' : 'Sign Up'}
          </button>
        </div>

        {/* Header Text */}
        <div className="auth-header auth-fade-in" style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0b2849', marginBottom: '8px' }}>
            {isSignUp 
              ? (lang === 'ar' ? 'مرحباً بك في ClimaMedix' : 'Welcome to ClimaMedix') 
              : (lang === 'ar' ? 'مرحباً بعودتك' : 'Welcome back')}
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(11, 40, 73, 0.6)' }}>
            {isSignUp 
              ? (lang === 'ar' ? 'أنشئ حسابك للوصول إلى المنصة والأبحاث' : 'Create your account to access the platform and research') 
              : (lang === 'ar' ? 'سجل الدخول للمتابعة إلى حسابك' : 'Sign in to continue to your account')}
          </p>
        </div>

        {/* Alert Box */}
        {message.text && (
          <div className="auth-alert" style={{ 
            padding: '12px 16px', 
            borderRadius: '8px', 
            fontSize: '12px', 
            marginBottom: '20px', 
            textAlign: 'center',
            background: message.type === 'success' ? 'rgba(21, 180, 122, 0.1)' : message.type === 'warning' ? 'rgba(255, 189, 46, 0.1)' : 'rgba(255, 77, 77, 0.1)',
            color: message.type === 'success' ? '#15b47a' : message.type === 'warning' ? '#b5840d' : '#ff4d4d',
            border: `1px solid ${message.type === 'success' ? 'rgba(21, 180, 122, 0.2)' : message.type === 'warning' ? 'rgba(255, 189, 46, 0.2)' : 'rgba(255, 77, 77, 0.2)'}`
          }}>
            {message.text}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="auth-fade-in">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'rgba(11, 40, 73, 0.8)', textAlign: lang === 'ar' ? 'right' : 'left' }}>
              {lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}
            </label>
            <input 
              type="email" 
              required
              dir="ltr"
              placeholder="name@example.com"
              value={email}
              onInput={(e) => setEmail(e.target.value)}
              style={{ textAlign: 'left', padding: '12px 16px', border: '1px solid rgba(11, 40, 73, 0.1)', borderRadius: '10px', fontSize: '14px', outline: 'none', background: 'rgba(255, 255, 255, 0.7)', transition: 'border-color 0.3s' }}
              onFocus={(e) => e.target.style.borderColor = '#15b47a'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(11, 40, 73, 0.1)'}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'rgba(11, 40, 73, 0.8)', textAlign: lang === 'ar' ? 'right' : 'left' }}>
              {lang === 'ar' ? 'كلمة المرور' : 'Password'}
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                required
                dir="auto"
                placeholder="••••••••"
                value={password}
                onInput={(e) => setPassword(e.target.value)}
                style={{ textAlign: !password || !/[\u0600-\u06FF]/.test(password[0]) ? 'left' : 'right', width: '100%', padding: '12px 16px', paddingLeft: '40px', border: '1px solid rgba(11, 40, 73, 0.1)', borderRadius: '10px', fontSize: '14px', outline: 'none', background: 'rgba(255, 255, 255, 0.7)', transition: 'border-color 0.3s' }}
                onFocus={(e) => e.target.style.borderColor = '#15b47a'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(11, 40, 73, 0.1)'}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', left: '12px', background: 'none', border: 'none', padding: '0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(11, 40, 73, 0.4)', outline: 'none' }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={loading} variant="gradient" style={{ padding: '12px', fontWeight: 'bold', marginTop: '8px' }}>
            {loading 
              ? (lang === 'ar' ? 'جاري التحميل...' : 'Loading...') 
              : isSignUp 
                ? (lang === 'ar' ? 'إنشاء حساب جديد' : 'Sign Up') 
                : (lang === 'ar' ? 'تسجيل الدخول' : 'Log In')}
          </Button>
        </form>

        {/* Divider */}
        <div className="auth-divider auth-fade-in" style={{ display: 'flex', alignItems: 'center', margin: '24px 0', color: 'rgba(11, 40, 73, 0.4)', fontSize: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(11, 40, 73, 0.1)' }}></div>
          <span style={{ padding: '0 10px' }}>
            {lang === 'ar' ? 'أو عبر وسائل التواصل' : 'Or sign in with'}
          </span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(11, 40, 73, 0.1)' }}></div>
        </div>

        {/* OAuth Grid */}
        <div className="auth-oauth-grid auth-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
          {/* Google */}
          <button 
            type="button"
            onClick={() => handleOAuth('google')}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px', border: '1px solid rgba(11, 40, 73, 0.1)', borderRadius: '10px', background: '#fff', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#15b47a'; e.currentTarget.style.background = '#fcfcfc'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(11, 40, 73, 0.1)'; e.currentTarget.style.background = '#fff'; }}
            title="Google"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.67 0 3.17.58 4.35 1.7l3.25-3.25C17.63 1.68 15.02 1 12 1 7.37 1 3.42 3.66 1.5 7.54l3.82 2.96C6.22 7.37 8.87 5.04 12 5.04z"/>
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.42 3.57v2.96h3.9c2.28-2.1 3.55-5.19 3.55-8.68z"/>
              <path fill="#FBBC05" d="M5.32 14.5c-.24-.71-.38-1.47-.38-2.25s.14-1.54.38-2.25L1.5 7.04C.66 8.73.18 10.62.18 12.6s.48 3.87 1.32 5.56l3.82-3.66z"/>
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.9-2.96c-1.08.72-2.47 1.15-4.06 1.15-3.13 0-5.78-2.33-6.73-5.46L1.45 15.78C3.37 19.66 7.31 23 12 23z"/>
            </svg>
          </button>

          {/* Facebook */}
          <button 
            type="button"
            onClick={() => handleOAuth('facebook')}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px', border: '1px solid rgba(11, 40, 73, 0.1)', borderRadius: '10px', background: '#fff', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#15b47a'; e.currentTarget.style.background = '#fcfcfc'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(11, 40, 73, 0.1)'; e.currentTarget.style.background = '#fff'; }}
            title="Facebook"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </button>

          {/* Apple */}
          <button 
            type="button"
            onClick={() => handleOAuth('apple')}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px', border: '1px solid rgba(11, 40, 73, 0.1)', borderRadius: '10px', background: '#fff', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#15b47a'; e.currentTarget.style.background = '#fcfcfc'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(11, 40, 73, 0.1)'; e.currentTarget.style.background = '#fff'; }}
            title="Apple"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#000">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.63.73-1.18 1.87-1.03 2.97 1.12.09 2.27-.56 2.98-1.41z"/>
            </svg>
          </button>

          {/* Instagram */}
          <button 
            type="button"
            onClick={() => handleOAuth('instagram')}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px', border: '1px solid rgba(11, 40, 73, 0.1)', borderRadius: '10px', background: '#fff', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#15b47a'; e.currentTarget.style.background = '#fcfcfc'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(11, 40, 73, 0.1)'; e.currentTarget.style.background = '#fff'; }}
            title="Instagram"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <radialGradient id="ig-grad" cx="30%" cy="107%" r="130%">
                <stop offset="0" stop-color="#fdf497"/>
                <stop offset="0.05" stop-color="#fdf497"/>
                <stop offset="0.45" stop-color="#fd5949"/>
                <stop offset="0.6" stop-color="#d6249f"/>
                <stop offset="0.9" stop-color="#285AEB"/>
              </radialGradient>
              <path fill="url(#ig-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
            </svg>
          </button>

          {/* X (Twitter) */}
          <button 
            type="button"
            onClick={() => handleOAuth('twitter')}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px', border: '1px solid rgba(11, 40, 73, 0.1)', borderRadius: '10px', background: '#fff', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#15b47a'; e.currentTarget.style.background = '#fcfcfc'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(11, 40, 73, 0.1)'; e.currentTarget.style.background = '#fff'; }}
            title="X (Twitter)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#000">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </button>
        </div>
        
      </GlassCard>
        </div>
        <div className="auth-image-side" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr', background: 'transparent', border: 'none', boxShadow: 'none' }}>
          <InteractiveParticles />
          <div style={{
            position: 'absolute',
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0b2849',
            textAlign: 'center',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 12px 0', color: '#0b2849', fontFamily: "'Tajawal', sans-serif" }}>
              كلايما ميدكس / ClimaMedix
            </h3>
            <p style={{ fontSize: '15px', color: '#4a607a', margin: 0, direction: lang === 'ar' ? 'rtl' : 'ltr', fontFamily: "'Tajawal', sans-serif" }}>
              {lang === 'ar' 
                ? 'العمل المناخي يبدأ من هنا. انضم إلى مجتمع الرعاية الصحية المستدامة.' 
                : 'Climate action starts here. Join the sustainable healthcare community.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
