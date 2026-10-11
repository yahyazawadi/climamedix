import { useState, useEffect, useRef } from 'preact/hooks';
import { useAuth } from './hooks/useAuth';
import { GlassCard } from '../shared/components/GlassCard';
import { InteractiveParticles } from './InteractiveParticles';
import gsap from 'gsap';

export function AuthPage({ onAuthSuccess, lang = 'ar' }) {
  const { signInWithOAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const isSubmitting = useRef(false);

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
  }, []);

  const handleOAuth = async (provider = 'google') => {
    if (isSubmitting.current || loading) return;
    setMessage({ type: '', text: '' });
    
    // Only Google is enabled
    if (provider !== 'google') {
      showAlert(
        'warning', 
        lang === 'ar' 
          ? 'عذراً، تسجيل الدخول متاح حالياً حصرياً عبر Google.' 
          : 'Login is currently available exclusively via Google.'
      );
      return;
    }

    isSubmitting.current = true;
    setLoading(true);
    try {
      const data = await signInWithOAuth('google');
      if (data?.user && onAuthSuccess) {
        onAuthSuccess(data.user);
      }
    } catch (err) {
      showAlert(
        'error', 
        err.message || (lang === 'ar' ? 'حدث خطأ في الاتصال بمزود الخدمة' : 'An error occurred connecting to Google')
      );
    } finally {
      isSubmitting.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-split-wrapper" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
        <div className="auth-form-side" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
          <GlassCard className="auth-card" style={{ maxWidth: '480px', width: '100%', padding: '44px 32px', color: '#0b2849', position: 'relative', overflow: 'hidden' }}>
            
            {/* Ambient Glow Effects */}
            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(21, 180, 122, 0.22)', filter: 'blur(35px)', pointerEvents: 'none' }}></div>
            <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(66, 133, 244, 0.18)', filter: 'blur(35px)', pointerEvents: 'none' }}></div>

            {/* SSO Badge */}
            <div className="auth-fade-in" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '999px',
                background: 'rgba(21, 180, 122, 0.1)',
                border: '1px solid rgba(21, 180, 122, 0.25)',
                color: '#15b47a',
                fontSize: '13px',
                fontWeight: '700'
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
                <span>{lang === 'ar' ? 'تسجيل الدخول الموحد والآمن' : 'Secure Single Sign-On'}</span>
              </div>
            </div>

            {/* Header Text */}
            <div className="auth-header auth-fade-in" style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#0b2849', marginBottom: '10px', letterSpacing: '-0.02em' }}>
                {lang === 'ar' ? 'مرحباً بك في ClimaMedix' : 'Welcome to ClimaMedix'}
              </h2>
              <p style={{ fontSize: '15px', color: 'rgba(11, 40, 73, 0.65)', lineHeight: '1.5', margin: 0 }}>
                {lang === 'ar' 
                  ? 'سجّل دخولك مباشرة بنقرة واحدة باستخدام حساب Google للوصول إلى كافة المساقات التعليمية والمقالات المعتمدة.' 
                  : 'Sign in directly with one click using your Google account to access all educational courses and verified articles.'}
              </p>
            </div>

            {/* Alert Box */}
            {message.text && (
              <div className="auth-alert" style={{ 
                padding: '12px 16px', 
                borderRadius: '10px', 
                fontSize: '14px', 
                marginBottom: '22px', 
                textAlign: 'center',
                background: message.type === 'success' ? 'rgba(21, 180, 122, 0.1)' : message.type === 'warning' ? 'rgba(255, 189, 46, 0.12)' : 'rgba(255, 77, 77, 0.1)',
                color: message.type === 'success' ? '#15b47a' : message.type === 'warning' ? '#b5840d' : '#ff4d4d',
                border: `1px solid ${message.type === 'success' ? 'rgba(21, 180, 122, 0.25)' : message.type === 'warning' ? 'rgba(255, 189, 46, 0.3)' : 'rgba(255, 77, 77, 0.25)'}`
              }}>
                {message.text}
              </div>
            )}

            {/* Google Single Sign-On Action Button */}
            <div className="auth-fade-in" style={{ marginBottom: '24px' }}>
              <button 
                type="button"
                id="google-signin-btn"
                data-testid="google-signin-btn"
                title="Google"
                disabled={loading}
                onClick={() => handleOAuth('google')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '12px',
                  width: '100%',
                  padding: '16px 20px', 
                  border: '1.5px solid rgba(11, 40, 73, 0.12)', 
                  borderRadius: '12px', 
                  background: '#ffffff', 
                  color: '#0b2849',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer', 
                  boxShadow: '0 4px 14px rgba(11, 40, 73, 0.06)',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity: loading ? 0.75 : 1,
                  fontFamily: 'inherit'
                }}
                onMouseEnter={(e) => { 
                  if (!loading) {
                    e.currentTarget.style.borderColor = '#4285F4'; 
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(66, 133, 244, 0.2)'; 
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => { 
                  if (!loading) {
                    e.currentTarget.style.borderColor = 'rgba(11, 40, 73, 0.12)'; 
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(11, 40, 73, 0.06)'; 
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path fill="#EA4335" d="M12 5.04c1.67 0 3.17.58 4.35 1.7l3.25-3.25C17.63 1.68 15.02 1 12 1 7.37 1 3.42 3.66 1.5 7.54l3.82 2.96C6.22 7.37 8.87 5.04 12 5.04z"/>
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.42 3.57v2.96h3.9c2.28-2.1 3.55-5.19 3.55-8.68z"/>
                  <path fill="#FBBC05" d="M5.32 14.5c-.24-.71-.38-1.47-.38-2.25s.14-1.54.38-2.25L1.5 7.04C.66 8.73.18 10.62.18 12.6s.48 3.87 1.32 5.56l3.82-3.66z"/>
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.9-2.96c-1.08.72-2.47 1.15-4.06 1.15-3.13 0-5.78-2.33-6.73-5.46L1.45 15.78C3.37 19.66 7.31 23 12 23z"/>
                </svg>
                <span>
                  {loading 
                    ? (lang === 'ar' ? 'جاري التحويل إلى Google...' : 'Connecting to Google...') 
                    : (lang === 'ar' ? 'المتابعة باستخدام Google' : 'Continue with Google')}
                </span>
              </button>
            </div>

            {/* Security Notice */}
            <div className="auth-security-box auth-fade-in" style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(21, 180, 122, 0.07)',
              border: '1px solid rgba(21, 180, 122, 0.18)',
              marginBottom: '20px',
              color: '#0b2849'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15b47a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
              <div style={{ fontSize: '13px', lineHeight: '1.5', color: '#1a3a5a' }}>
                <strong>{lang === 'ar' ? 'تسجيل دخول موثّق وفوري:' : 'Verified Instant Login:'}</strong>{' '}
                {lang === 'ar'
                  ? 'يتم التحقق من حسابك تلقائياً وبأمان عبر Google دون الحاجة لكلمة مرور أو خطوات تفعيل البريد الإلكتروني.'
                  : 'Your account is verified automatically and securely via Google without needing a password or email confirmation links.'}
              </div>
            </div>

            {/* Benefits List */}
            <div className="auth-benefits auth-fade-in" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              paddingTop: '8px',
              borderTop: '1px solid rgba(11, 40, 73, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'rgba(11, 40, 73, 0.75)' }}>
                <span style={{ color: '#15b47a', fontWeight: 'bold', fontSize: '14px' }}>✓</span>
                <span>{lang === 'ar' ? 'وصول مجاني وفوري لكافة دورات ومقالات المنصة' : 'Free instant access to all platform courses & articles'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'rgba(11, 40, 73, 0.75)' }}>
                <span style={{ color: '#15b47a', fontWeight: 'bold', fontSize: '14px' }}>✓</span>
                <span>{lang === 'ar' ? 'حفظ تلقائي للتقدم والشهادات المعتمدة' : 'Automatic progress saving & verified credentials'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'rgba(11, 40, 73, 0.75)' }}>
                <span style={{ color: '#15b47a', fontWeight: 'bold', fontSize: '14px' }}>✓</span>
                <span>{lang === 'ar' ? 'حماية كاملة للخصوصية والبيانات الشخصية' : 'Complete privacy and personal data protection'}</span>
              </div>
            </div>

          </GlassCard>
        </div>

        {/* Brand Side */}
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
            <h3 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 12px 0', color: '#0b2849', fontFamily: lang === 'en' ? "'Outfit', sans-serif" : "'Tajawal', sans-serif" }}>
              كلايما ميدكس / ClimaMedix
            </h3>
            <p style={{ fontSize: lang === 'en' ? '18px' : '15px', color: '#4a607a', margin: 0, direction: lang === 'ar' ? 'rtl' : 'ltr', fontFamily: lang === 'en' ? "'Outfit', sans-serif" : "'Tajawal', sans-serif" }}>
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
