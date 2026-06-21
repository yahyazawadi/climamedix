import { useState, useEffect } from 'preact/hooks'
import './app.css'

// Import newly created Header & Footer components
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { TopBackground } from './components/TopBackground'
import { NeatScripples } from './components/NeatScripples'
import { ColoredBackground } from './components/ColoredBackground'

export function App() {
  const [theme, setTheme] = useState('light');
  const [activeSection, setActiveSection] = useState('home');
  const [openedModal, setOpenedModal] = useState(null); // 'join', 'policy'
  
  // Form States for Header/Footer modal triggers
  const [joinForm, setJoinForm] = useState({ name: '', email: '', profession: '' });
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [joinSubmitting, setJoinSubmitting] = useState(false);

  // Theme Sync on Mount
  useEffect(() => {
    // Force light theme by default to match the Figma design
    const initialTheme = 'light';
    setTheme(initialTheme);
    document.body.classList.remove('dark-mode');
  }, []);

  // Theme Switch handler
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  // Scroll Spy for active section styling
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section[id]');
      const scrollY = window.scrollY;
      let currentSection = 'home';
      
      sections.forEach((section) => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 150;
        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
          currentSection = section.getAttribute('id');
        }
      });
      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Join form submission
  const handleJoinSubmit = (e) => {
    e.preventDefault();
    setJoinSubmitting(true);
    setTimeout(() => {
      setJoinSubmitting(false);
      setJoinSuccess(true);
      setTimeout(() => {
        setJoinForm({ name: '', email: '', profession: '' });
        setJoinSuccess(false);
        setOpenedModal(null);
      }, 2000);
    }, 1000);
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
      {/* Background components */}
      <TopBackground />
      <NeatScripples />
      <ColoredBackground />

      {/* Header component */}
      <Header 
        theme={theme} 
        toggleTheme={toggleTheme} 
        activeSection={activeSection} 
        onJoinClick={() => setOpenedModal('join')} 
      />

      {/* Bare Bones Sections */}
      <main style={{ paddingTop: '129px', minHeight: 'calc(100vh - 129px)' }}>
        <section id="home" style={{ padding: '80px 0', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div class="container text-center">
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>كليما ميديكس PWA</h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
              مرحبا بكم في الصفحة التجريبية الأساسية. تم تفعيل المكونات الرئيسية (الهيدر والتذييل) بنجاح.
            </p>
          </div>
        </section>

        <section id="about" style={{ padding: '80px 0', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div class="container text-center">
            <h2 style={{ color: 'var(--text-primary)' }}>عن المبادرة</h2>
            <p style={{ color: 'var(--text-secondary)' }}>محتوى تجريبي لقسم "عن المبادرة".</p>
          </div>
        </section>

        <section id="pillars" style={{ padding: '80px 0', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div class="container text-center">
            <h2 style={{ color: 'var(--text-primary)' }}>الركائز</h2>
            <p style={{ color: 'var(--text-secondary)' }}>محتوى تجريبي لقسم "الركائز".</p>
          </div>
        </section>

        <section id="research" style={{ padding: '80px 0', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div class="container text-center">
            <h2 style={{ color: 'var(--text-primary)' }}>أحدث الأبحاث</h2>
            <p style={{ color: 'var(--text-secondary)' }}>محتوى تجريبي لقسم "أحدث الأبحاث".</p>
          </div>
        </section>

        <section id="training" style={{ padding: '80px 0', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div class="container text-center">
            <h2 style={{ color: 'var(--text-primary)' }}>الدورات التدريبية</h2>
            <p style={{ color: 'var(--text-secondary)' }}>محتوى تجريبي لقسم "الدورات التدريبية".</p>
          </div>
        </section>

        <section id="upcoming" style={{ padding: '80px 0', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div class="container text-center">
            <h2 style={{ color: 'var(--text-primary)' }}>المشاريع القادمة</h2>
            <p style={{ color: 'var(--text-secondary)' }}>محتوى تجريبي لقسم "المشاريع القادمة".</p>
          </div>
        </section>
      </main>

      {/* Footer component */}
      <Footer 
        onJoinClick={() => setOpenedModal('join')} 
        onPolicyClick={() => setOpenedModal('policy')} 
      />

      {/* ==========================================================================
         MODALS
         ========================================================================== */}
      
      {/* Join Modal */}
      <div class={`modal-overlay ${openedModal === 'join' ? 'open' : ''}`}>
        <div class="modal-card">
          <div class="modal-header">
            <h3>الانضمام لفريق ClimaMedix</h3>
            <button onClick={() => setOpenedModal(null)} class="close-modal-btn">&times;</button>
          </div>
          {joinSuccess ? (
            <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
              <h4 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>تم إرسال طلبك بنجاح!</h4>
              <p style={{ color: 'var(--text-secondary)' }}>سيتواصل معك منسق الفريق عبر البريد الإلكتروني في غضون 48 ساعة.</p>
            </div>
          ) : (
            <form class="modal-form" onSubmit={handleJoinSubmit}>
              <p class="form-intro">سجل بياناتك للانضمام إلى قائمة الباحثين والمسعفين المتطوعين في دراسات المناخ والصحة.</p>
              
              <div class="form-group">
                <label>الاسم الكامل *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="أدخل اسمك الكامل" 
                  value={joinForm.name} 
                  onInput={(e) => setJoinForm({ ...joinForm, name: e.target.value })}
                />
              </div>
              <div class="form-group">
                <label>البريد الإلكتروني *</label>
                <input 
                  type="email" 
                  required 
                  placeholder="name@example.com" 
                  value={joinForm.email}
                  onInput={(e) => setJoinForm({ ...joinForm, email: e.target.value })}
                />
              </div>
              <div class="form-group">
                <label>التخصص المهني *</label>
                <select 
                  required 
                  value={joinForm.profession}
                  onChange={(e) => setJoinForm({ ...joinForm, profession: e.target.value })}
                >
                  <option value="" disabled selected>اختر تخصصك</option>
                  <option value="doctor">طبيب / ممارس صحي</option>
                  <option value="researcher">باحث بيئي / علمي</option>
                  <option value="student">طالب علوم صحية</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
              <button type="submit" disabled={joinSubmitting} class="btn btn-primary btn-full">
                {joinSubmitting ? 'جاري إرسال طلبك...' : 'إرسال طلب الانضمام'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Use Policy Modal */}
      <div class={`modal-overlay ${openedModal === 'policy' ? 'open' : ''}`}>
        <div class="modal-card">
          <div class="modal-header">
            <h3>سياسة الاستخدام وحماية البيانات</h3>
            <button onClick={() => setOpenedModal(null)} class="close-modal-btn">&times;</button>
          </div>
          <div class="modal-body" style={{ lineHeight: '1.8', fontSize: '0.95rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
            <p style={{ marginBottom: '1rem' }}>نحن في ClimaMedix نلتزم بأعلى معايير السرية والأمان البيولوجي والرقمي للمعلومات السريرية أو الشخصية:</p>
            <ul style={{ paddingRight: '1.5rem', marginBottom: '1.5rem' }}>
              <li>يتم جمع البيانات عبر نماذج التسجيل حصراً لغرض الاتصال بخصوص أبحاثنا وتدريباتنا.</li>
              <li>لا نقوم بمشاركة أي بيانات شخصية مع أطراف ثالثة لأغراض تجارية على الإطلاق.</li>
              <li>تلتزم أبحاثنا الميدانية ببروتوكولات الموافقة المسبقة المستنيرة للمشاركين.</li>
            </ul>
            <p>لأي استفسارات إضافية، يرجى مراسلة مكتب التنسيق الطبي التابع للمبادرة.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
