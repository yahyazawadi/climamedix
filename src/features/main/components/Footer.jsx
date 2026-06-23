import { FooterCard } from './FooterCard'

export function Footer({ onJoinClick, onNavigate }) {
  return (
    <footer id="contact" class="figma-footer">
      <div class="figma-footer-container">
        
        {/* Right Side: Columns & Join Box (rendered first in HTML so it displays on the right in RTL) */}
        <div class="figma-footer-content">
          
          {/* Columns Grid */}
          <div class="figma-columns-grid">
            
            {/* Column 1: الدعم والتواصل (rightmost in RTL layout) */}
            <div class="figma-col">
              <h4>الدعم والتواصل</h4>
              <ul>
                <li><a href="#about" onClick={(e) => { e.preventDefault(); onNavigate('home', 'about'); }}>عن المنصة</a></li>
                <li><a href="#training" onClick={(e) => { e.preventDefault(); onNavigate('home', 'contact'); }}>تواصل معنا</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); }}>سياسة الاستخدام</a></li>
                <li><a href="#">حقوق الملكية</a></li>
                <li><a href="#">الأسئلة الشائعة</a></li>
              </ul>
            </div>

            {/* Column 2: الروابط السريعة (middle in RTL layout) */}
            <div class="figma-col">
              <h4>الروابط السريعة</h4>
              <ul>
                {/* <li><a href="#pillars">الأقسام</a></li> */}
                <li><a href="#training" onClick={(e) => { e.preventDefault(); onNavigate('home', 'training'); }}>الدورات التدريبية</a></li>
                <li><a href="#about" onClick={(e) => { e.preventDefault(); onNavigate('home', 'about'); }}>من نحن</a></li>
                <li><a href="#research" onClick={(e) => { e.preventDefault(); onNavigate('home', 'research'); }}>أحدث الأبحاث</a></li>
                <li><a href="#upcoming" onClick={(e) => { e.preventDefault(); onNavigate('home', 'upcoming'); }}>المشاريع</a></li>
                <li><a href="#upcoming" onClick={(e) => { e.preventDefault(); onNavigate('home', 'upcoming'); }}>الأنشطة القادمة</a></li>
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
        <FooterCard />

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
