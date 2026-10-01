import { FooterCard } from './FooterCard'
import { translations } from '../../../i18n/translations'

export function Footer({ onJoinClick, onNavigate, onPolicyClick, lang, currentView, user, onLogout }) {
  const t = translations[lang] || translations.ar;

  const handlePolicy = (e) => {
    e.preventDefault();
    if (onPolicyClick) onPolicyClick();
    if (onNavigate) onNavigate('privacy');
  };

  const handleCopyright = (e) => {
    e.preventDefault();
    if (onNavigate) onNavigate('copyright');
  };

  return (
    <footer id="footer" data-section="contact" class="figma-footer">
      <div class="figma-footer-container">
        
        {/* Right Side: Columns & Join Box (rendered first in HTML so it displays on the right in RTL) */}
        <div class="figma-footer-content">
          
          {/* Columns Grid */}
          <div class="figma-columns-grid">
            
            {/* Column 1: الدعم والتواصل (rightmost in RTL layout) */}
            <div class="figma-col">
              <h4>{t.footerTitle}</h4>
              <ul>
                <li><a href="#about" onClick={(e) => { e.preventDefault(); onNavigate('about'); }}>{lang === 'ar' ? 'عن المنصة' : 'About Platform'}</a></li>
                <li><a href="mailto:info@climamedix.org">{lang === 'ar' ? 'تواصل معنا' : 'Contact Us'}</a></li>
                <li><a href="/privacy" onClick={handlePolicy}>{t.privacyPolicy || (lang === 'ar' ? 'سياسة الاستخدام وحماية البيانات' : 'Terms of Use & Privacy')}</a></li>
                <li><a href="/copyright" onClick={handleCopyright}>{t.intellectualProperty || (lang === 'ar' ? 'حقوق الملكية والنشر' : 'Intellectual Property')}</a></li>
                {/* <li><a href="#help" onClick={(e) => { e.preventDefault(); onNavigate('about'); }}>{lang === 'ar' ? 'مركز المساعدة والأسئلة الشائعة' : 'Help & FAQs'}</a></li> */}
              </ul>
            </div>

            {/* Column 2: الروابط السريعة (middle in RTL layout) */}
            <div class="figma-col">
              <h4>{t.quickLinks}</h4>
              <ul>
                <li><a href="/courses" onClick={(e) => { e.preventDefault(); onNavigate('courses'); }}>{lang === 'ar' ? 'المركز التعليمي' : 'Learning Hub'}</a></li>
                <li><a href="/research" onClick={(e) => { e.preventDefault(); onNavigate('research'); }}>{t.latestResearch}</a></li>
                <li><a href="/news" onClick={(e) => { e.preventDefault(); onNavigate('news'); }}>{lang === 'ar' ? 'الأخبار والمدونة' : 'News & Blog'}</a></li>
                <li><a href="/opportunities" onClick={(e) => { e.preventDefault(); onNavigate('opportunities'); }}>{lang === 'ar' ? 'الفرص والمنح' : 'Opportunities'}</a></li>
                <li><a href="/events" onClick={(e) => { e.preventDefault(); onNavigate('events'); }}>{lang === 'ar' ? 'الأنشطة والفعاليات' : 'Events & Activities'}</a></li>
                <li><a href="/write-article" onClick={(e) => { e.preventDefault(); onNavigate('write-article'); }}>{lang === 'ar' ? 'كتابة مقال' : 'Write Article'}</a></li>
              </ul>
            </div>

            {/* Column 3: حسابي (leftmost in RTL layout) */}
            <div class="figma-col">
              <h4>{t.myAccount}</h4>
              <ul>
                {user ? (
                  <>
                    <li><a href="/profile" onClick={(e) => { e.preventDefault(); onNavigate('profile'); }}>{lang === 'ar' ? 'الملف الشخصي' : 'My Profile'}</a></li>
                    <li><a href="/courses" onClick={(e) => { e.preventDefault(); onNavigate('courses'); }}>{lang === 'ar' ? 'دوراتي التعليمية' : 'My Courses'}</a></li>
                    <li><a href="/join" onClick={(e) => { e.preventDefault(); onNavigate('join'); }}>{lang === 'ar' ? 'بيانات العضوية' : 'Membership Status'}</a></li>
                    {onLogout && (
                      <li><a href="#logout" onClick={(e) => { e.preventDefault(); onLogout(); }} style={{ color: '#ff6b6b' }}>{t.logout || (lang === 'ar' ? 'تسجيل الخروج' : 'Log Out')}</a></li>
                    )}
                  </>
                ) : (
                  <>
                    <li><a href="/auth" onClick={(e) => { e.preventDefault(); onNavigate('auth'); }}>{lang === 'ar' ? 'تسجيل الدخول (Google)' : 'Login (Google)'}</a></li>
                    <li><a href="/join" onClick={(e) => { e.preventDefault(); onNavigate('join'); }}>{lang === 'ar' ? 'الانضمام للشبكة' : 'Join Network'}</a></li>
                    <li><a href="/courses" onClick={(e) => { e.preventDefault(); onNavigate('courses'); }}>{lang === 'ar' ? 'تصفح المساقات' : 'Explore Courses'}</a></li>
                    <li><a href="mailto:support@climamedix.org">{lang === 'ar' ? 'الدعم والمساعدة' : 'Support & Help'}</a></li>
                  </>
                )}
              </ul>
            </div>
            
          </div>

          {/* Bottom CTA Block: Text (right) & Join button (left) - Hidden when already on /join */}
          {currentView !== 'join' && (
            <div class="figma-footer-cta-block">
              <div class="figma-cta-border-box">
                <span>{t.footerCtaText}</span>
              </div>
              <button onClick={onJoinClick} class="figma-footer-join-btn">
                {t.joinNow}
              </button>
            </div>
          )}

        </div>

        {/* Left Side: Brand Card (rendered second in HTML so it displays on the left in RTL) */}
        <FooterCard lang={lang} />

      </div>

      {/* Subfooter Copyright */}
      <div class="figma-subfooter">
        <div class="figma-subfooter-container">
          <span>&copy; 2026 ClimaMedix PWA. {t.copyright}</span>
          <div id="footer-bottom" style={{ height: '1px' }} />
        </div>
      </div>
    </footer>
  );
}
