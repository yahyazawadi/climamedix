import { useState, useLayoutEffect, useRef } from 'preact/hooks';
import gsap from 'gsap';
import { GlassCard } from '../../shared/components/GlassCard';
import { Button } from '../../shared/components/Button';

export function LMSDashboard({ enrolledCourses = [], completedCourses = [], onSelectCourse, onGenerateCertificate }) {
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      gsap.fromTo('.lms-card-anim',
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [enrolledCourses.length, completedCourses.length]);

  const totalCourses = enrolledCourses.length + completedCourses.length;
  const sumProgress = enrolledCourses.reduce((sum, c) => sum + (c.progress || 0), 0) + (completedCourses.length * 100);
  const averageProgress = totalCourses > 0 ? Math.round(sumProgress / totalCourses) : 0;

  return (
    <div ref={containerRef} className="lms-dashboard-component" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', direction: 'rtl', textAlign: 'right' }}>
      
      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '35px' }}>
        <GlassCard className="lms-card-anim" style={{ padding: '20px', border: '1px solid rgba(21, 180, 122, 0.25)', background: 'rgba(21, 180, 122, 0.05)' }}>
          <span style={{ fontSize: '13px', color: 'rgba(11,40,73,0.5)' }}>مساقاتي النشطة</span>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0b2849', marginTop: '5px' }}>{enrolledCourses.length}</div>
        </GlassCard>
        
        <GlassCard className="lms-card-anim" style={{ padding: '20px', border: '1px solid rgba(0, 76, 109, 0.25)', background: 'rgba(0, 76, 109, 0.05)' }}>
          <span style={{ fontSize: '13px', color: 'rgba(11,40,73,0.5)' }}>المساقات المنجزة</span>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0b2849', marginTop: '5px' }}>{completedCourses.length}</div>
        </GlassCard>

        <GlassCard className="lms-card-anim" style={{ padding: '20px', border: '1px solid rgba(11,40,73,0.15)' }}>
          <span style={{ fontSize: '13px', color: 'rgba(11,40,73,0.5)' }}>نسبة التقدم الإجمالية</span>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#15b47a', marginTop: '5px' }}>
            {averageProgress}%
          </div>
        </GlassCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '30px' }}>
        
        {/* Enrolled Courses section */}
        <div>
          <h3 style={{ color: '#0b2849', fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>مساقاتي التعليمية الحالية</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {enrolledCourses.map(course => (
              <GlassCard 
                key={course.id} 
                className="lms-card-anim" 
                style={{ padding: '20px', border: '1px solid rgba(11, 40, 73, 0.1)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', background: 'rgba(0,76,109,0.08)', color: '#004c6d', padding: '2px 8px', borderRadius: '10px' }}>{course.category}</span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#15b47a' }}>{course.progress}% مكتمل</span>
                </div>
                
                <h4 style={{ margin: '0 0 10px 0', color: '#0b2849', fontSize: '16px', fontWeight: 'bold' }}>{course.title}</h4>
                
                {/* Progress Bar */}
                <div style={{ width: '100%', height: '6px', background: 'rgba(11,40,73,0.08)', borderRadius: '3px', marginBottom: '20px', overflow: 'hidden' }}>
                  <div style={{ width: `${course.progress}%`, height: '100%', background: '#15b47a', borderRadius: '3px', transition: 'width 0.3s' }}></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(11,40,73,0.5)' }}>الدروس المتبقية: {course.remainingLessons || 0}</span>
                  <Button 
                    variant="gradient" 
                    onClick={() => onSelectCourse(course)}
                    style={{ padding: '6px 16px', fontSize: '12px' }}
                  >
                    متابعة التعليم
                  </Button>
                </div>
              </GlassCard>
            ))}

            {enrolledCourses.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.4)', borderRadius: '20px', border: '1px dashed rgba(11,40,73,0.2)', color: 'rgba(11, 40, 73, 0.5)' }}>
                لم تقم بالتسجيل في أي مساق بعد.
              </div>
            )}
          </div>
        </div>

        {/* Certificates & Achievements section */}
        <div>
          <h3 style={{ color: '#0b2849', fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>شهاداتي المعتمدة</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {completedCourses.map(course => (
              <GlassCard 
                key={course.id} 
                className="lms-card-anim" 
                style={{ padding: '20px', border: '1px solid rgba(21, 180, 122, 0.2)', background: 'rgba(21, 180, 122, 0.03)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', background: 'rgba(21,180,122,0.1)', color: '#15b47a', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>✓ منجز</span>
                  <span style={{ fontSize: '11px', color: 'rgba(11,40,73,0.5)' }}>درجة الاختبار: {course.quizScore || '90%'}</span>
                </div>

                <h4 style={{ margin: '0 0 15px 0', color: '#0b2849', fontSize: '16px', fontWeight: 'bold' }}>{course.title}</h4>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(11,40,73,0.5)' }}>صدرت في: 2026</span>
                  <Button 
                    variant="outline" 
                    onClick={() => onGenerateCertificate(course.title)}
                    style={{ padding: '6px 16px', fontSize: '12px', borderColor: '#004c6d', color: '#004c6d' }}
                  >
                    عرض وتوليد الشهادة
                  </Button>
                </div>
              </GlassCard>
            ))}

            {completedCourses.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.4)', borderRadius: '20px', border: '1px dashed rgba(11,40,73,0.2)', color: 'rgba(11, 40, 73, 0.5)' }}>
                لا توجد شهادات صادرة لك حالياً. قم بإنهاء مساق بنسبة 100% واجتياز الاختبار النهائي.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
