import { FooterCard } from './FooterCard'
import { translations } from '../../../i18n/translations'

export function Footer({ onJoinClick, onNavigate, lang }) {
  const t = translations[lang] || translations.ar;

  return (
    <footer id="contact" class="figma-footer">
      <div class="figma-footer-container">
        
        {/* Right Side: Columns & Join Box (rendered first in HTML so it displays on the right in RTL) */}
        <div class="figma-footer-content">
          
          {/* Columns Grid */}
          <div class="figma-columns-grid">
            
            {/* Column 1: الدعم والتواصل (rightmost in RTL layout) */}
            <div class="figma-col">
              <h4>{t.footerTitle}</h4>
              <ul>
                <li><a href="#about" onClick={(e) => { e.preventDefault(); onNavigate('home', 'about'); }}>{lang === 'ar' ? 'عن المنصة' : 'About Platform'}</a></li>
                <li><a href="#training" onClick={(e) => { e.preventDefault(); onNavigate('home', 'contact'); }}>{lang === 'ar' ? 'تواصل معنا' : 'Contact Us'}</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); }}>{lang === 'ar' ? 'سياسة الاستخدام' : 'Terms of Use'}</a></li>
                <li><a href="#">{lang === 'ar' ? 'حقوق الملكية' : 'Intellectual Property'}</a></li>
                <li><a href="#">{lang === 'ar' ? 'الأسئلة الشائعة' : 'FAQs'}</a></li>
              </ul>
            </div>

            {/* Column 2: الروابط السريعة (middle in RTL layout) */}
            <div class="figma-col">
              <h4>{t.quickLinks}</h4>
              <ul>
                <li><a href="#training" onClick={(e) => { e.preventDefault(); onNavigate('home', 'training'); }}>{t.trainingCourses}</a></li>
                <li><a href="#about" onClick={(e) => { e.preventDefault(); onNavigate('home', 'about'); }}>{t.about}</a></li>
                <li><a href="#research" onClick={(e) => { e.preventDefault(); onNavigate('home', 'research'); }}>{t.latestResearch}</a></li>
                <li><a href="/write-article" onClick={(e) => { e.preventDefault(); onNavigate('write-article'); }}>{lang === 'ar' ? 'كتابة مقال' : 'Write Article'}</a></li>
                <li><a href="#upcoming" onClick={(e) => { e.preventDefault(); onNavigate('home', 'upcoming'); }}>{lang === 'ar' ? 'الأنشطة القادمة' : 'Upcoming Activities'}</a></li>
              </ul>
            </div>

            {/* Column 3: حسابي (leftmost in RTL layout) */}
            <div class="figma-col">
              <h4>{t.myAccount}</h4>
              <ul>
                <li><a href="#">{t.login}</a></li>
                <li><a href="#">{lang === 'ar' ? 'حساب جديد' : 'New Account'}</a></li>
                <li><a href="#">{lang === 'ar' ? 'نسيت كلمة السر' : 'Forgot Password'}</a></li>
                <li><a href="#">{lang === 'ar' ? 'مركز المساعدة' : 'Help Center'}</a></li>
              </ul>
            </div>
            
          </div>

          {/* Bottom CTA Block: Text (right) & Join button (left) */}
          <div class="figma-footer-cta-block">
            <div class="figma-cta-border-box">
              <span>{t.footerCtaText}</span>
            </div>
            <button onClick={onJoinClick} class="figma-footer-join-btn">
              {t.joinNow}
            </button>
          </div>

        </div>

        {/* Left Side: Brand Card (rendered second in HTML so it displays on the left in RTL) */}
        <FooterCard lang={lang} />

      </div>

      {/* Subfooter Copyright */}
      <div class="figma-subfooter">
        <div class="figma-subfooter-container">
          <span>&copy; 2026 ClimaMedix PWA. {t.copyright}</span>
        </div>
      </div>
    </footer>
  );
}
