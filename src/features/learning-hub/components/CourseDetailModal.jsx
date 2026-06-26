import { useState } from 'preact/hooks';
import { Button } from '../../shared/components/Button';
import { QuizWidget } from './QuizWidget';

export function CourseDetailModal({ course, onClose, onLessonCompleted }) {
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [quizMode, setQuizMode] = useState(false);
  const [lessonProgress, setLessonProgress] = useState({}); // lessonIndex -> boolean (completed)

  if (!course) return null;

  const lessons = course.lessons || [
    { 
      title: 'مقدمة في رصد الأوبئة وتأثير الحرارة', 
      content: 'يعد رصد الأوبئة من الركائز الأساسية في مواجهة الأزمات الصحية الطارئة. مع تسارع وتيرة الاحتباس الحراري، تتعرض بعض المناطق لموجات حرارية غير مسبوقة تزيد من حدة انتشار النواقل الحشرية (مثل البعوض والقراد) المسؤولة عن نقل أمراض مثل حمى الضنك والملاريا. يجب على المنشآت الطبية تعزيز الجاهزية والربط المعلوماتي المستمر.',
      quiz: [
        {
          text: 'ما هي النواقل الحشرية الأكثر تأثراً بالاحتباس الحراري في نقل الأوبئة؟',
          options: ['القراد والبعوض', 'القوارض', 'الذباب المنزلي', 'كل ما سبق'],
          correctAnswer: 0
        },
        {
          text: 'ما هو الهدف الأساسي من رصد الأوبئة البيئية؟',
          options: ['قياس درجات الحرارة فقط', 'الإنذار المبكر والوقاية من تفشي المرض', 'كتابة تقارير دورية ميتة', 'لا شيء مما سبق'],
          correctAnswer: 1
        }
      ]
    },
    { 
      title: 'إدارة مخلفات المستشفيات وأثرها الكربوني', 
      content: 'تساهم إدارة النفايات الطبية غير الصحيحة بنسبة كبيرة في انبعاثات الغازات الدفيئة والملوثات السامة. من خلال تطبيق إستراتيجيات التدوير الصديقة للبيئة والتعقيم بالبخار بدلاً من الحرق المباشر، يمكن تقليص البصمة الكربونية للمستشفيات بنسبة تفوق 30% مع المحافظة على سلامة المرضى.',
      quiz: [
        {
          text: 'ما هي الطريقة الأفضل بيئياً للتخلص من النفايات الطبية غير الحادة مقارنة بالحرق؟',
          options: ['الدفن المباشر في التراب', 'التعقيم البخاري (الموصدة)', 'الإلقاء في مجاري المياه', 'الرمي العشوائي'],
          correctAnswer: 1
        }
      ]
    }
  ];

  const currentLesson = lessons[activeLessonIndex];

  const handleQuizFinished = (score) => {
    if (score >= 80) {
      setLessonProgress(prev => {
        const next = { ...prev, [activeLessonIndex]: true };
        
        // Calculate updated course progress percentage
        const completedCount = Object.keys(next).filter(k => next[k]).length;
        const pct = Math.round((completedCount / lessons.length) * 100);
        
        if (onLessonCompleted) {
          onLessonCompleted(course.id, pct, lessons.length - completedCount);
        }
        return next;
      });
      setQuizMode(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 12, 26, 0.6)',
      backdropFilter: 'blur(15px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '28px',
        border: '1px solid rgba(11, 40, 73, 0.15)',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)',
        position: 'relative',
        direction: 'rtl',
        textAlign: 'right',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 30px', borderBottom: '1px solid rgba(11,40,73,0.1)' }}>
          <div>
            <span style={{ fontSize: '12px', color: '#15b47a', fontWeight: 'bold' }}>مساق نشط</span>
            <h2 style={{ color: '#0b2849', fontSize: '20px', fontWeight: 'bold', margin: '4px 0 0 0' }}>{course.title}</h2>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(11, 40, 73, 0.05)',
              border: 'none',
              fontSize: '22px',
              color: '#0b2849',
              cursor: 'pointer',
              fontWeight: 'bold',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            &times;
          </button>
        </div>

        {/* Content Layout */}
        <div style={{ display: 'flex', flexGrow: 1, minHeight: 0, height: '60vh', flexWrap: 'wrap' }}>
          
          {/* Right Sidebar: Lessons list */}
          <div style={{ width: '280px', borderLeft: '1px solid rgba(11,40,73,0.1)', overflowY: 'auto', padding: '20px', flexShrink: 0, background: 'rgba(0,76,109,0.02)' }}>
            <h4 style={{ color: '#0b2849', fontSize: '14px', fontWeight: 'bold', marginBottom: '15px' }}>مؤشر الدروس والتقدم</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {lessons.map((les, idx) => {
                const isActive = activeLessonIndex === idx;
                const isCompleted = lessonProgress[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setActiveLessonIndex(idx);
                      setQuizMode(false);
                    }}
                    style={{
                      padding: '12px 15px',
                      borderRadius: '10px',
                      background: isActive ? '#004c6d' : 'transparent',
                      color: isActive ? '#ffffff' : '#0b2849',
                      border: '1px solid rgba(11,40,73,0.08)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: isActive ? 'bold' : 'normal',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.15s'
                    }}
                  >
                    <span>{les.title}</span>
                    {isCompleted && <span style={{ color: isActive ? '#ffffff' : '#15b47a', fontWeight: 'bold' }}>✓</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Left Panel: Lesson detail or Quiz */}
          <div style={{ flexGrow: 1, flexBasis: '400px', overflowY: 'auto', padding: '30px' }}>
            {quizMode ? (
              <QuizWidget 
                quizQuestions={currentLesson.quiz} 
                onQuizFinished={handleQuizFinished}
                onClose={() => setQuizMode(false)}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <h3 style={{ color: '#0b2849', fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', lineHeight: '1.4' }}>
                  {currentLesson.title}
                </h3>
                
                {/* Simulated Video Player */}
                <div style={{
                  width: '100%',
                  aspectRatio: '16/9',
                  background: '#0b2849',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  marginBottom: '25px',
                  position: 'relative',
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{ zIndex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '40px', cursor: 'pointer', background: 'rgba(21,180,122,0.85)', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', boxShadow: '0 8px 24px rgba(21,180,122,0.4)', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.target.style.transform = 'scale(1.08)'} onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>
                      ▶
                    </div>
                    <span style={{ fontSize: '12px', opacity: 0.8, fontFamily: 'monospace' }}>video_lesson_stream.mp4</span>
                  </div>
                </div>

                <div style={{ color: 'rgba(11, 40, 73, 0.8)', fontSize: '15px', lineHeight: '1.8', marginBottom: '30px', whiteSpace: 'pre-wrap', flexGrow: 1 }}>
                  {currentLesson.content}
                </div>

                <div style={{ borderTop: '1px solid rgba(11,40,73,0.1)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                  {lessonProgress[activeLessonIndex] ? (
                    <span style={{ color: '#15b47a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      ✓ تم اجتياز اختبار هذا الدرس بنجاح!
                    </span>
                  ) : (
                    <Button 
                      variant="gradient"
                      onClick={() => setQuizMode(true)}
                      style={{ padding: '12px 30px', fontSize: '13.5px' }}
                    >
                      خوض اختبار الدرس لقفل التقدم
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
