import { useState } from 'preact/hooks';
import { Button } from '../shared/components/Button';

export function MockHeaderPage({ lang = 'ar' }) {
  const [activeRoute, setActiveRoute] = useState('/');

  const isArabic = lang === 'ar';

  const NAV_LINKS = [
    { path: '/', labelAr: 'الرئيسية', labelEn: 'Home' },
    { path: '/about', labelAr: 'من نحن', labelEn: 'About Us' },
    { path: '/courses', labelAr: 'المنصة التعليمية', labelEn: 'Learning Hub' },
    { path: '/research', labelAr: 'مركز الأبحاث', labelEn: 'Research' },
    { path: '/opportunities', labelAr: 'الفرص', labelEn: 'Opportunities' },
    { path: '/news', labelAr: 'الأخبار', labelEn: 'News' },
    { path: '/community', labelAr: 'المجتمع', labelEn: 'Community' },
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f1f5f9', 
      fontFamily: "'Tajawal', sans-serif",
      direction: isArabic ? 'rtl' : 'ltr'
    }}>
      {/* The Premium Glass Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        height: '80px',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        zIndex: 1000
      }}>
        {/* Logo Area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', height: '40px', 
            background: 'linear-gradient(135deg, #15b47a, #004c6d)', 
            borderRadius: '8px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 'bold', fontSize: '20px'
          }}>
            C
          </div>
          <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#0b2849' }}>
            {isArabic ? 'كلايما ميدكس' : 'ClimaMedix'}
          </span>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
          {NAV_LINKS.map(link => (
            <a 
              key={link.path}
              href={`#${link.path}`}
              onClick={(e) => {
                e.preventDefault();
                setActiveRoute(link.path);
              }}
              style={{
                textDecoration: 'none',
                color: activeRoute === link.path ? '#15b47a' : '#475569',
                fontWeight: activeRoute === link.path ? '700' : '600',
                fontSize: '16px',
                position: 'relative',
                transition: 'color 0.2s ease',
                padding: '8px 0'
              }}
              onMouseEnter={(e) => { if(activeRoute !== link.path) e.currentTarget.style.color = '#004c6d'; }}
              onMouseLeave={(e) => { if(activeRoute !== link.path) e.currentTarget.style.color = '#475569'; }}
            >
              {isArabic ? link.labelAr : link.labelEn}
              {/* Active Indicator Underline */}
              {activeRoute === link.path && (
                <div style={{
                  position: 'absolute',
                  bottom: '-2px',
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: '#15b47a',
                  borderRadius: '2px',
                  boxShadow: '0 2px 8px rgba(21, 180, 122, 0.4)'
                }} />
              )}
            </a>
          ))}
        </nav>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button style={{
            background: 'transparent',
            border: 'none',
            color: '#0b2849',
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: 'pointer',
            padding: '8px 16px'
          }}>
            {isArabic ? 'تسجيل الدخول' : 'Login'}
          </button>
          
          <Button variant="gradient" style={{ padding: '10px 24px' }}>
            {isArabic ? 'انضم إلينا' : 'Join Us'}
          </Button>
        </div>
      </header>

      {/* Mock Body Content to show scrolling under the glass */}
      <main style={{ padding: '80px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '48px', color: '#0b2849', marginBottom: '20px' }}>
          {isArabic ? 'هذه مسودة تجريبية للشريط العلوي' : 'This is a Mock Header Test'}
        </h1>
        <p style={{ fontSize: '20px', color: '#475569', lineHeight: '1.8', marginBottom: '40px' }}>
          {isArabic 
            ? 'قم بالتمرير للأسفل لترى كيف يعمل تأثير الزجاج (Glassmorphism) بشفافية رائعة تعطي انطباعاً احترافياً وتمنع التشتت أثناء تصفح المستخدم.' 
            : 'Scroll down to see how the glassmorphism effect provides a beautiful blur, giving a premium feel without distracting the user.'}
        </p>

        {/* Filler boxes for scroll */}
        {[1, 2, 3, 4, 5].map(num => (
          <div key={num} style={{
            background: 'white',
            borderRadius: '16px',
            padding: '40px',
            marginBottom: '30px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.02)'
          }}>
            <h2 style={{ color: '#004c6d', marginBottom: '15px' }}>{isArabic ? `قسم المحتوى رقم ${num}` : `Content Section ${num}`}</h2>
            <div style={{ height: '16px', background: '#e2e8f0', borderRadius: '8px', marginBottom: '10px', width: '100%' }} />
            <div style={{ height: '16px', background: '#e2e8f0', borderRadius: '8px', marginBottom: '10px', width: '90%' }} />
            <div style={{ height: '16px', background: '#e2e8f0', borderRadius: '8px', width: '80%' }} />
          </div>
        ))}
      </main>
    </div>
  );
}
