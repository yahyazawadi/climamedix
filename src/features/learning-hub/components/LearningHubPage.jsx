import { useState, useEffect } from 'preact/hooks';
import { Button } from '../../shared/components/Button';
import { GlassCard } from '../../shared/components/GlassCard';
import { useAuth } from '../../auth/hooks/useAuth';

export function LearningHubPage({ lang, onNavigate }) {
  const { user, userProfile } = useAuth();
  
  // Data for widgets
  const milestones = [
    { title: "الأساسيات البيئية", date: "الأسبوع 1-2", desc: "مقدمة في علوم الغلاف الجوي والتغير المناخي وتأثيرها الأولي على المجتمعات." },
    { title: "الأمراض والنواقل", date: "الأسبوع 3-4", desc: "دراسة عميقة لتأثير الحرارة على انتشار النواقل الحشرية." },
    { title: "الاستدامة الطبية", date: "الأسبوع 5-6", desc: "كيفية بناء وتجهيز مستشفيات خضراء صديقة للبيئة." },
    { title: "المشروع النهائي", date: "الأسبوع 7-8", desc: "تقديم مسودة بحثية عملية." }
  ];
  const [selectedMilestone, setSelectedMilestone] = useState(0);

  const courseLessons = [
    { title: 'رصد الأوبئة وتأثير التغير الحراري', duration: '15 دقيقة' },
    { title: 'الانبعاثات الطبية وإدارة المخلفات السائلة', duration: '22 دقيقة' },
    { title: 'تغير المناخ ومعدلات انتشار الربو الشعبي', duration: '18 دقيقة' }
  ];
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [currentLesson, setCurrentLesson] = useState(courseLessons[0].title);

  const [quizStatus, setQuizStatus] = useState('idle');

  const curriculumModules = [
    { id: 'm1', title: 'الوحدة الأولى: أساسيات المناخ والصحة', desc: 'مقدمة في مسببات التغير المناخي والغازات الدفيئة وعلاقتها المباشرة بتدهور جودة الهواء.' },
    { id: 'm2', title: 'الوحدة الثانية: الأمراض المنقولة بالنواقل', desc: 'دراسة تفصيلية لكيفية تأثير التغيرات الحرارية على دورة حياة النواقل مثل البعوض.' },
    { id: 'm3', title: 'الوحدة الثالثة: بناء المستشفيات الخضراء', desc: 'أساسيات التحول نحو مرافق رعاية صحية مستدامة.' }
  ];
  const [activeAccordion, setActiveAccordion] = useState(curriculumModules[0].id);

  // Permission Logic
  // Unsigned -> Teaser, Unpaid -> Free courses, Subscriber+ -> All courses
  const role = userProfile?.role;
  const isPremiumUser = ['subscriber', 'researcher', 'educator', 'admin', 'superadmin'].includes(role);
  const isFreeUser = role === 'user';
  
  const hasAccess = isPremiumUser || isFreeUser; // for now let's just assume this is a free course for demonstration

  const handleMilestoneClick = (idx) => {
    setSelectedMilestone(idx);
  };

  const handlePlayToggle = () => {
    setIsVideoPlaying(!isVideoPlaying);
  };

  const handleLessonSelect = (lesson) => {
    setCurrentLesson(lesson.title);
    setIsVideoPlaying(true);
  };

  const handleQuizAnswer = (isCorrect) => {
    setQuizStatus(isCorrect ? 'correct' : 'incorrect');
  };

  const handleAccordionClick = (id) => {
    setActiveAccordion(activeAccordion === id ? null : id);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // UI rendering based on permissions
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px' }}>
        <GlassCard style={{ padding: '40px', maxWidth: '600px', textAlign: 'center' }}>
          <h2 style={{ color: '#0b2849', marginBottom: '20px' }}>{lang === 'ar' ? 'مرحباً بك في منصة التعلم' : 'Welcome to the Learning Hub'}</h2>
          <p style={{ color: 'rgba(11, 40, 73, 0.7)', marginBottom: '30px' }}>
            {lang === 'ar' ? 'يرجى تسجيل الدخول للوصول إلى المساقات التعليمية والاختبارات.' : 'Please log in to access training courses and quizzes.'}
          </p>
          <Button variant="gradient" onClick={() => onNavigate('auth')}>
            {lang === 'ar' ? 'تسجيل الدخول / إنشاء حساب' : 'Log In / Sign Up'}
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div style={{ background: '#e0eff5', minHeight: '100vh', padding: '120px 20px 60px', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ color: '#0b2849', fontSize: '36px', fontWeight: 'bold', marginBottom: '15px' }}>
            {lang === 'ar' ? 'المركز التعليمي (Learning Hub)' : 'Learning Hub'}
          </h1>
          <p style={{ color: '#004c6d', fontSize: '18px', maxWidth: '800px', margin: '0 auto' }}>
            {lang === 'ar' ? 'تصفح المساقات التدريبية، شاهد المحاضرات، واختبر معلوماتك لتصل إلى شهادة الاعتماد.' : 'Browse training tracks, watch lectures, and test your knowledge to earn certification.'}
          </p>
          {!isPremiumUser && (
            <div style={{ background: 'rgba(255, 193, 7, 0.2)', color: '#b38600', padding: '10px 20px', borderRadius: '8px', marginTop: '20px', display: 'inline-block', fontWeight: 'bold' }}>
              {lang === 'ar' ? 'تنبيه: صلاحياتك تتيح لك الوصول للمساقات المجانية فقط.' : 'Notice: Your permissions allow access to free courses only.'}
            </div>
          )}
        </div>

        {/* Widgets Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          {/* Row 1: Roadmap & Quiz */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '40px' }}>
            
            {/* Feature Card 1: Roadmap */}
            <div className="imagination-card" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '30px', border: '1px solid rgba(21, 180, 122, 0.3)', boxShadow: '0 15px 35px rgba(0, 76, 109, 0.05)' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px', color: '#0b2849', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="glow-dot" style={{ width: '12px', height: '12px', background: '#15b47a', borderRadius: '50%', boxShadow: '0 0 10px #15b47a' }}></span> 
                {lang === 'ar' ? 'خارطة طريق زمالة المناخ والصحة' : 'Climate & Health Fellowship Roadmap'}
              </h3>
              <p style={{ fontSize: '14px', color: 'rgba(11, 40, 73, 0.7)', marginBottom: '30px' }}>
                {lang === 'ar' ? 'مسار تفاعلي معزز بحركات انتقال سلسة للدروس والوحدات' : 'Interactive track for lessons and modules'}
              </p>

              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 10px', marginBottom: '30px' }}>
                <div style={{ position: 'absolute', top: '50%', left: '10%', right: '10%', height: '2px', background: 'rgba(21, 180, 122, 0.3)', transform: 'translateY(-50%)', zIndex: 0 }}></div>
                {milestones.map((m, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleMilestoneClick(idx)}
                    style={{ 
                      width: '40px', height: '40px', borderRadius: '50%', background: selectedMilestone === idx ? '#15b47a' : '#fff', color: selectedMilestone === idx ? '#fff' : '#004c6d', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', zIndex: 1, border: `2px solid ${selectedMilestone === idx ? '#15b47a' : '#004c6d'}`, cursor: 'pointer', transition: 'all 0.3s' 
                    }}
                  >
                    {idx + 1}
                  </div>
                ))}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.6)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(21, 180, 122, 0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', color: '#004c6d' }}>{milestones[selectedMilestone].title}</span>
                  <span style={{ fontSize: '13px', background: 'rgba(21, 180, 122, 0.12)', color: '#15b47a', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold' }}>
                    {milestones[selectedMilestone].date}
                  </span>
                </div>
                <p style={{ fontSize: '15px', lineHeight: '1.6', margin: 0, color: 'rgba(11, 40, 73, 0.85)' }}>
                  {milestones[selectedMilestone].desc}
                </p>
              </div>
            </div>

            {/* Feature Card 5: Quiz Checkpoint */}
            <div className="imagination-card" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '30px', border: '1px solid rgba(21, 180, 122, 0.3)', boxShadow: '0 15px 35px rgba(0, 76, 109, 0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px', color: '#0b2849' }}>
                  {lang === 'ar' ? 'منصة التعليم والتحقق السريع (Quiz Checkpoint)' : 'Quick Checkpoint Quiz'}
                </h3>
                <p style={{ fontSize: '14px', color: 'rgba(11, 40, 73, 0.7)', marginBottom: '20px' }}>
                  {lang === 'ar' ? 'محاكاة لربط الدرس الطبي باختبار ذكي يتحقق من استيعاب المتدرب للدرس فورياً' : 'Simulated medical lesson quiz checkpoint'}
                </p>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.7)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(11, 40, 73, 0.1)', marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', color: '#004c6d', fontWeight: 'bold', marginBottom: '15px', lineHeight: '1.5' }}>
                  {lang === 'ar' ? 'سؤال الدورة: ما هو العامل المناخي الأسرع تأثيراً على زيادة انتشار ناقلات الملاريا؟' : 'Course Question: What is the fastest climate factor increasing malaria vectors?'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button onClick={() => handleQuizAnswer(false)} style={{ padding: '12px 15px', background: '#fff', border: '1px solid rgba(11,40,73,0.1)', borderRadius: '10px', textAlign: lang === 'ar' ? 'right' : 'left', cursor: 'pointer', color: '#0b2849', transition: 'all 0.2s' }}>
                    {lang === 'ar' ? 'أ. ارتفاع مستويات الضوضاء في المدن' : 'A. High noise levels in cities'}
                  </button>
                  <button onClick={() => handleQuizAnswer(true)} style={{ padding: '12px 15px', background: '#fff', border: '1px solid rgba(11,40,73,0.1)', borderRadius: '10px', textAlign: lang === 'ar' ? 'right' : 'left', cursor: 'pointer', color: '#0b2849', transition: 'all 0.2s' }}>
                    {lang === 'ar' ? 'ب. ارتفاع درجات الحرارة والرطوبة المصاحبة لتقلبات هطول المطر' : 'B. High temperature and humidity'}
                  </button>
                  <button onClick={() => handleQuizAnswer(false)} style={{ padding: '12px 15px', background: '#fff', border: '1px solid rgba(11,40,73,0.1)', borderRadius: '10px', textAlign: lang === 'ar' ? 'right' : 'left', cursor: 'pointer', color: '#0b2849', transition: 'all 0.2s' }}>
                    {lang === 'ar' ? 'ج. زحف التربة والتصحر الجاف' : 'C. Soil erosion and dry desertification'}
                  </button>
                </div>
              </div>

              <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {quizStatus === 'idle' && (
                  <span style={{ fontSize: '14px', color: 'rgba(11, 40, 73, 0.5)', fontStyle: 'italic' }}>
                    {lang === 'ar' ? 'يرجى اختيار إجابة من الأعلى...' : 'Please select an answer...'}
                  </span>
                )}

                {quizStatus === 'correct' && (
                  <div style={{ background: 'rgba(21, 180, 122, 0.12)', border: '1px solid #15b47a', color: '#15b47a', padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', width: '100%', textAlign: 'center' }}>
                    {lang === 'ar' ? 'تم التحقق بنجاح من إجابتك وتسجيل تقدمك.' : 'Answer verified successfully. Progress saved.'}
                  </div>
                )}

                {quizStatus === 'incorrect' && (
                  <div style={{ background: 'rgba(255, 77, 77, 0.1)', border: '1px solid #ff4d4d', color: '#ff4d4d', padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', width: '100%', textAlign: 'center' }}>
                    {lang === 'ar' ? 'إجابة غير صحيحة. حاول مرة أخرى.' : 'Incorrect answer. Try again.'}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Feature Card 13: Video Player */}
          <div className="imagination-card" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '30px', border: '1px solid rgba(21, 180, 122, 0.3)', boxShadow: '0 15px 35px rgba(0, 76, 109, 0.05)' }}>
            <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '10px', color: '#0b2849' }}>
              {lang === 'ar' ? 'مشغل المساقات ونظام متابعة المحاضرات الطبية' : 'Course Player & Tracking System'}
            </h3>
            <p style={{ fontSize: '14px', color: 'rgba(11, 40, 73, 0.7)', marginBottom: '25px' }}>
              {lang === 'ar' ? 'تصفح المحاضرات العلمية وتفاعل مع مشغل الفيديو والروابط التعليمية المصاحبة لكل درس' : 'Browse lectures and interact with the video player'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
              {/* Simulated Video Player */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ position: 'relative', background: '#000', borderRadius: '16px', overflow: 'hidden', aspectRatio: '16/9' }}>
                  {/* Simulated video playback screen */}
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#ffffff', padding: '20px', background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 100%)' }}>
                    <span style={{ fontSize: '14px', background: 'rgba(0,0,0,0.5)', padding: '6px 16px', borderRadius: '20px', marginBottom: '15px' }}>
                      {isVideoPlaying ? (lang === 'ar' ? 'جاري العرض...' : 'Playing...') : (lang === 'ar' ? 'متوقف مؤقتاً' : 'Paused')}
                    </span>
                    <h4 style={{ fontSize: '20px', fontWeight: 'bold', textShadow: '0 2px 10px rgba(0,0,0,0.8)', textAlign: 'center' }}>
                      {currentLesson}
                    </h4>
                  </div>

                  {/* Timeline bar */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '6px', background: 'rgba(255,255,255,0.2)' }}>
                    <div style={{ width: isVideoPlaying ? '45%' : '20%', height: '100%', background: '#15b47a', transition: 'width 0.5s ease' }}></div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button variant="gradient" onClick={handlePlayToggle}>
                    {isVideoPlaying ? (lang === 'ar' ? 'إيقاف مؤقت' : 'Pause') : (lang === 'ar' ? 'تشغيل الدرس' : 'Play Lesson')}
                  </Button>
                  <span style={{ fontSize: '13px', color: 'rgba(11, 40, 73, 0.6)', fontWeight: 'bold' }}>
                    {lang === 'ar' ? 'مدة الدرس الكلية: 22 دقيقة' : 'Total Duration: 22 Mins'}
                  </span>
                </div>
              </div>

              {/* Lessons Sidebar list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#004c6d', marginBottom: '5px' }}>
                  {lang === 'ar' ? 'محتويات وحدة المناخ والصحة (3 دروس)' : 'Climate & Health Module (3 Lessons)'}
                </div>
                {courseLessons.map((lesson, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleLessonSelect(lesson)}
                    style={{
                      padding: '16px', borderRadius: '12px', border: 'none', textAlign: lang === 'ar' ? 'right' : 'left', cursor: 'pointer', transition: 'all 0.2s',
                      background: currentLesson === lesson.title ? '#004c6d' : 'rgba(255,255,255,0.6)',
                      color: currentLesson === lesson.title ? '#fff' : '#0b2849'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: currentLesson === lesson.title ? 'bold' : 'normal' }}>{idx + 1}. {lesson.title}</span>
                      <span style={{ fontSize: '12px', opacity: 0.8 }}>{lesson.duration}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Feature Card 24: Curriculum Accordion */}
          <div className="imagination-card" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '30px', border: '1px solid rgba(21, 180, 122, 0.3)', boxShadow: '0 15px 35px rgba(0, 76, 109, 0.05)' }}>
            <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '20px', color: '#0b2849' }}>
              {lang === 'ar' ? 'المنهج الأكاديمي (Curriculum Accordion)' : 'Curriculum Modules'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {curriculumModules.map((mod) => (
                <div key={mod.id} style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(11, 40, 73, 0.1)', borderRadius: '12px', overflow: 'hidden' }}>
                  <button
                    onClick={() => handleAccordionClick(mod.id)}
                    style={{ width: '100%', padding: '20px', background: 'none', border: 'none', textAlign: lang === 'ar' ? 'right' : 'left', fontWeight: 'bold', color: '#004c6d', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '15px' }}
                  >
                    <span>{mod.title}</span>
                    <span style={{ fontSize: '18px', color: '#15b47a' }}>{activeAccordion === mod.id ? '−' : '+'}</span>
                  </button>
                  {activeAccordion === mod.id && (
                    <div style={{ padding: '0 20px 20px', fontSize: '14px', color: 'rgba(11,40,73,0.8)', lineHeight: '1.6' }}>
                      {mod.desc}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
