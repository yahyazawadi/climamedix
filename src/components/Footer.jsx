import footerLogo from '../assets/footer_logo.svg'
import socialIn from '../assets/social_in.svg'
import socialFb from '../assets/social_fb.svg'
import socialInsta from '../assets/social_insta.svg'
import socialX from '../assets/social_x.svg'
import contactMail from '../assets/contact_mail.svg'
import contactPhone from '../assets/contact_phone.svg'
import contactWeb from '../assets/contact_web.svg'

export function Footer({ onJoinClick }) {
  return (
    <footer class="figma-footer">
      <div class="figma-footer-container">
        
        {/* Right Side: Columns & Join Box (rendered first in HTML so it displays on the right in RTL) */}
        <div class="figma-footer-content">
          
          {/* Columns Grid */}
          <div class="figma-columns-grid">
            
            {/* Column 1: الدعم والتواصل (rightmost in RTL layout) */}
            <div class="figma-col">
              <h4>الدعم والتواصل</h4>
              <ul>
                <li><a href="#about">عن المنصة</a></li>
                <li><a href="#training">تواصل معنا</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); }}>سياسة الاستخدام</a></li>
                <li><a href="#">حقوق الملكية</a></li>
                <li><a href="#">الأسئلة الشائعة</a></li>
              </ul>
            </div>

            {/* Column 2: الروابط السريعة (middle in RTL layout) */}
            <div class="figma-col">
              <h4>الروابط السريعة</h4>
              <ul>
                <li><a href="#pillars">الأقسام</a></li>
                <li><a href="#training">الدورات التدريبية</a></li>
                <li><a href="#about">من نحن</a></li>
                <li><a href="#research">أحدث الأبحاث</a></li>
                <li><a href="#upcoming">المشاريع</a></li>
                <li><a href="#upcoming">الأنشطة القادمة</a></li>
              </ul>
            </div>

            {/* Column 3: حسابي (leftmost in RTL layout) */}
            <div class="figma-col">
              <h4>حسابي</h4>
              <ul>
                <li><a href="#">الدخول</a></li>
                <li><a href="#">حساب جديد</a></li>
                <li><a href="#">نسيت كلمة السر</a></li>
                <li><a href="#">مركز المساعدة</a></li>
              </ul>
            </div>
            
          </div>

          {/* Bottom CTA Block: Text (right) & Join button (left) */}
          <div class="figma-footer-cta-block">
            <div class="figma-cta-border-box">
              <span>انضم إلينا في رحلتنا لدعم الصحة البيئية والتغيير المناخي!</span>
            </div>
            <button onClick={onJoinClick} class="figma-footer-join-btn">
              انضم الآن
            </button>
          </div>

        </div>

        {/* Left Side: Brand Card (rendered second in HTML so it displays on the left in RTL) */}
        <div class="figma-footer-card">
          <div class="figma-footer-logo-wrap">
            <img src={footerLogo} alt="كليما ميديكس" />
          </div>
          
          <div class="figma-footer-section">
            <span class="figma-section-title">تابعونا على مواقع التواصل الاجتماعي:</span>
            <div class="figma-social-row">
              <a href="#" aria-label="Facebook"><img src={socialFb} alt="Facebook" /></a>
              <a href="#" aria-label="LinkedIn"><img src={socialIn} alt="LinkedIn" /></a>
              <a href="#" aria-label="Instagram"><img src={socialInsta} alt="Instagram" /></a>
              <a href="#" aria-label="Twitter"><img src={socialX} alt="Twitter" /></a>
            </div>
          </div>

          <div class="figma-footer-section">
            <span class="figma-section-title">تواصلوا معنا:</span>
            <div class="figma-contact-row">
              <a href="mailto:info@climamedix.org" aria-label="Email"><img src={contactMail} alt="Email" /></a>
              <a href="https://www.climamedix.org" target="_blank" rel="noopener noreferrer" aria-label="Website"><img src={contactWeb} alt="Website" /></a>
              <a href="tel:+970599123456" aria-label="Phone"><img src={contactPhone} alt="Phone" /></a>
            </div>
          </div>
        </div>

      </div>

      {/* Subfooter Copyright */}
      <div class="figma-subfooter">
        <div class="figma-subfooter-container">
          <span>&copy; 2026 ClimaMedix PWA. جميع الحقوق محفوظة.</span>
        </div>
      </div>
    </footer>
  );
}
