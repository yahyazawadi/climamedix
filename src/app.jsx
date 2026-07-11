import { useState, useEffect } from 'preact/hooks'
import './app.css'
// Import newly created Header & Footer components
import { Header } from './features/main/components/Header'
import { Footer } from './features/main/components/Footer'
import { TopBackground } from './features/main/components/TopBackground'
import { NeatScripples } from './features/main/components/NeatScripples'
import { ColoredBackground } from './features/main/components/ColoredBackground'
import { Button } from './features/shared/components/Button'
import { GlassCard } from './features/shared/components/GlassCard'
import { HomeNewsWidget } from './features/news-blog/components/HomeNewsWidget'
import { ArabWorldMap } from './features/main/components/ArabWorldMap'
import { AppRouter, useAppRouting } from './AppRouter'
import { AuthProvider, useAuth } from './features/auth/hooks/useAuth'
import { translations } from './i18n/translations'
import doctorImg from './assets/bg_3.png'
import whiteLogo from './assets/footer_logo.svg'
// Import section assets
import research1 from './assets/research_1.png'
import research2 from './assets/research_2.png'
import research3 from './assets/research_3.png'
import research4 from './assets/bg_1.png'
import training1 from './assets/training_1.png'
import training2 from './assets/training_2.png'
import training3 from './assets/training_3.png'
import training4 from './assets/training_4.png'
import upcoming1 from './assets/upcoming_1.png'
import upcoming2 from './assets/upcoming_2.png'
import iconHome from './assets/icon_home.svg'
import iconAbout from './assets/icon_about.svg'
import iconFavorite from './assets/icon_favorite.svg'
import iconResearch from './assets/icon_research.svg'
import iconTraining from './assets/icon_training.svg'
import iconContact from './assets/icon_contact.svg'

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
function AppContent() {
  const [theme, setTheme] = useState('light');
  const [lang, setLang] = useState(() => {
    return document.documentElement.getAttribute('lang') || 'ar';
  });
  const [activeSection, setActiveSection] = useState('home');
  const [openedModal, setOpenedModal] = useState(null); // 'join', 'policy'
  const [currentView, setCurrentView] = useState('newhome'); // 'newhome', 'home', or others
  const { user, userProfile, signOut } = useAuth();
  const handleLogout = async () => {
    await signOut();
    setCurrentView('home');
  };
  
  const toggleLanguage = () => {
    const newLang = lang === 'ar' ? 'en' : 'ar';
    setLang(newLang);
    document.documentElement.setAttribute('lang', newLang);
    document.documentElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
  };
  // Form States for Header/Footer modal triggers
  const [joinForm, setJoinForm] = useState({ name: '', email: '', profession: '' });
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [joinSubmitting, setJoinSubmitting] = useState(false);
  const t = translations[lang] || translations.ar;
  // Theme Sync on Mount + Path Routing
  useEffect(() => {
    // Force light theme
    setTheme('light');
    document.body.classList.remove('dark-mode');
  }, []);

  const { navigate } = useAppRouting(currentView, setCurrentView, setOpenedModal);
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
      const sections = document.querySelectorAll('section[id], footer[id]');
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
    <div style={{ position: 'relative', overflowX: 'hidden', minHeight: '100vh' }}>
      {/* Background components */}
      {currentView === 'home' || currentView === 'newhome' ? (
        <>
          <TopBackground />
          <NeatScripples />
          <ColoredBackground />
        </>
      ) : null}
      {/* Header component */}
      <Header 
        theme={theme} 
        toggleTheme={toggleTheme} 
        activeSection={activeSection} 
        currentView={currentView}
        user={user}
        userProfile={userProfile}
        onLogout={handleLogout}
        lang={lang}
        toggleLanguage={toggleLanguage}
        onNavigate={navigate}
        onJoinClick={() => navigate('join')} 
      />
            <AppRouter 
        currentView={currentView}
        setCurrentView={setCurrentView}
        lang={lang}
        setOpenedModal={setOpenedModal}
        navigate={navigate}
      />
      {/* Footer component */}
      <Footer 
        lang={lang}
        currentView={currentView}
        onJoinClick={() => { setOpenedModal('join'); window.history.pushState({}, '', '/join'); }} 
        onPolicyClick={() => setOpenedModal('policy')} 
        onNavigate={navigate}
      />
      {/* ==========================================================================
         MODALS
         ========================================================================== */}
      
      {/* Join Modal */}
      <div class={`modal-overlay ${openedModal === 'join' ? 'open' : ''}`}>
        <div class="modal-card">
          <div class="modal-header">
            <h3>{lang === 'ar' ? 'الانضمام لفريق ClimaMedix' : 'Join the ClimaMedix Team'}</h3>
            <button onClick={() => setOpenedModal(null)} class="close-modal-btn">&times;</button>
          </div>
          {joinSuccess ? (
            <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
              <h4 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>{lang === 'ar' ? 'تم إرسال طلبك بنجاح!' : 'Your request was sent successfully!'}</h4>
              <p style={{ color: 'var(--text-secondary)' }}>{lang === 'ar' ? 'سيتواصل معك منسق الفريق عبر البريد الإلكتروني في غضون 48 ساعة.' : 'The team coordinator will contact you via email within 48 hours.'}</p>
            </div>
          ) : (
            <form class="modal-form" onSubmit={handleJoinSubmit}>
              <p class="form-intro">{lang === 'ar' ? 'سجل بياناتك للانضمام إلى قائمة الباحثين والمسعفين المتطوعين في دراسات المناخ والصحة.' : 'Register your details to join the team of volunteer researchers and medical staff.'}</p>
              
              <div class="form-group">
                <label>{lang === 'ar' ? 'الاسم الكامل *' : 'Full Name *'}</label>
                <input 
                  type="text" 
                  required 
                  placeholder={lang === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                  value={joinForm.name} 
                  onInput={(e) => setJoinForm({ ...joinForm, name: e.target.value })}
                />
              </div>
              <div class="form-group">
                <label>{lang === 'ar' ? 'البريد الإلكتروني *' : 'Email *'}</label>
                <input 
                  type="email" 
                  required 
                  placeholder="name@example.com" 
                  value={joinForm.email}
                  onInput={(e) => setJoinForm({ ...joinForm, email: e.target.value })}
                />
              </div>
              <div class="form-group">
                <label>{lang === 'ar' ? 'التخصص المهني *' : 'Professional Specialty *'}</label>
                <select 
                  required 
                  value={joinForm.profession}
                  onChange={(e) => setJoinForm({ ...joinForm, profession: e.target.value })}
                >
                  <option value="" disabled selected>{lang === 'ar' ? 'اختر تخصصك' : 'Select your specialty'}</option>
                  <option value="doctor">{lang === 'ar' ? 'طبيب / ممارس صحي' : 'Doctor / Health Practitioner'}</option>
                  <option value="researcher">{lang === 'ar' ? 'باحث بيئي / علمي' : 'Environmental / Scientific Researcher'}</option>
                  <option value="student">{lang === 'ar' ? 'طالب علوم صحية' : 'Health Sciences Student'}</option>
                  <option value="other">{lang === 'ar' ? 'أخرى' : 'Other'}</option>
                </select>
              </div>
              <button type="submit" disabled={joinSubmitting} class="btn btn-primary btn-full">
                {joinSubmitting ? (lang === 'ar' ? 'جاري إرسال طلبك...' : 'Submitting your request...') : (lang === 'ar' ? 'إرسال طلب الانضمام' : 'Submit Join Request')}
              </button>
            </form>
          )}
        </div>
      </div>
      {/* Use Policy Modal */}
      <div class={`modal-overlay ${openedModal === 'policy' ? 'open' : ''}`}>
        <div class="modal-card">
          <div class="modal-header">
            <h3>{lang === 'ar' ? 'سياسة الاستخدام وحماية البيانات' : 'Terms of Use & Data Protection'}</h3>
            <button onClick={() => setOpenedModal(null)} class="close-modal-btn">&times;</button>
          </div>
          <div class="modal-body" style={{ lineHeight: '1.8', fontSize: '0.95rem', color: 'var(--text-secondary)', textAlign: lang === 'ar' ? 'right' : 'left' }}>
            <p style={{ marginBottom: '1rem' }}>{lang === 'ar' ? 'نحن في ClimaMedix نلتزم بأعلى معايير السرية والأمان البيولوجي والرقمي للمعلومات السريرية أو الشخصية:' : 'At ClimaMedix, we are committed to the highest standards of confidentiality and digital safety for all clinical and personal information:'}</p>
            <ul style={{ paddingRight: lang === 'ar' ? '1.5rem' : '0', paddingLeft: lang === 'en' ? '1.5rem' : '0', marginBottom: '1.5rem' }}>
              <li>{lang === 'ar' ? 'يتم جمع البيانات عبر نماذج التسجيل حصراً لغرض الاتصال بخصوص أبحاثنا وتدريباتنا.' : 'Data is collected via registration forms solely for communications regarding our research.'}</li>
              <li>{lang === 'ar' ? 'لا نقوم بمشاركة أي بيانات شخصية مع أطراف ثالثة لأغراض تجارية على الإطلاق.' : 'We never share any personal data with third parties for commercial purposes.'}</li>
              <li>{lang === 'ar' ? 'تلتزم أبحاثنا الميدانية ببروتوكولات الموافقة المسبقة المستنيرة للمشاركين.' : 'Our field research strictly complies with informed consent protocols.'}</li>
            </ul>
            <p>{lang === 'ar' ? 'لأي استفسارات إضافية، يرجى مراسلة مكتب التنسيق الطبي التابع للمبادرة.' : 'For any further inquiries, please contact the coordinator office of the initiative.'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
