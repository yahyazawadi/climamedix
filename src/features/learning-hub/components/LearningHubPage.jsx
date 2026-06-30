import { useState, useEffect } from 'preact/hooks';
import { Button } from '../../shared/components/Button';
import { GlassCard } from '../../shared/components/GlassCard';
import { useAuth } from '../../auth/hooks/useAuth';
import { LMSDashboard } from './LMSDashboard';
import { CourseDetailModal } from './CourseDetailModal';
import { CertificateGenerator } from './CertificateGenerator';
import {
  fetchCourses,
  fetchEnrollments,
  enrollInCourse,
  checkEnrollment,
  fetchCompletedLessons,
  issueCertificate,
  fetchUserCertificates,
} from '../services/lmsService';

export function LearningHubPage({ lang, onNavigate }) {
  const { user, userProfile, hasPermission } = useAuth();

  // ─── State ───────────────────────────────────────────────────────────────
  const [allCourses, setAllCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]); // enriched with progress
  const [completedCourses, setCompletedCourses] = useState([]);
  const [userCerts, setUserCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState(null); // courseId currently being enrolled

  const [selectedCourse, setSelectedCourse] = useState(null); // open CourseDetailModal
  const [showCertFor, setShowCertFor] = useState(null); // course title string for cert generator

  const [activeTab, setActiveTab] = useState('discover'); // 'discover' | 'my-courses'

  // ─── Load Data ───────────────────────────────────────────────────────────
  useEffect(() => {
    window.scrollTo(0, 0);
    if (user) loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      const [courses, enrollments, certs] = await Promise.all([
        fetchCourses(),
        fetchEnrollments(user.id),
        fetchUserCertificates(user.id),
      ]);

      setAllCourses(courses || []);
      setUserCerts(certs || []);

      // Enrich each enrollment with progress data
      const enriched = await Promise.all(
        (enrollments || []).map(async (enr) => {
          const course = enr.course;
          if (!course) return null;

          const completedSet = await fetchCompletedLessons(user.id, course.id);

          // Count total lessons via the syllabus already fetched? 
          // We use a simple count from the completed lessons approach.
          // Total lessons will be fetched inside CourseDetailModal on open.
          return {
            id: course.id,
            title: lang === 'ar' ? course.title_ar : (course.title_en || course.title_ar),
            category: course.category,
            cover_image: course.cover_image,
            duration: course.duration,
            full_access_permission_key: course.full_access_permission_key,
            teaser_permission_key: course.teaser_permission_key,
            enrollmentId: enr.id,
            enrolledAt: enr.enrolled_at,
            completedLessonIds: completedSet,
            progress: 0, // will be updated when syllabus is known
            remainingLessons: '?',
            _raw: course,
          };
        })
      );

      const validEnrolled = enriched.filter(Boolean);

      // Split into completed (100%) vs active
      // We mark as completed if the user has a certificate for that course
      const certCourseTitles = new Set((certs || []).map(c => c.course));
      const completed = validEnrolled.filter(c =>
        certCourseTitles.has(lang === 'ar' ? c._raw.title_ar : (c._raw.title_en || c._raw.title_ar))
      );
      const active = validEnrolled.filter(c =>
        !certCourseTitles.has(lang === 'ar' ? c._raw.title_ar : (c._raw.title_en || c._raw.title_ar))
      );

      setEnrolledCourses(active);
      setCompletedCourses(completed.map(c => ({
        ...c,
        quizScore: null // could be fetched from quiz_attempts if needed
      })));
    } catch (err) {
      console.error('LearningHub loadData error:', err);
    } finally {
      setLoading(false);
    }
  }

  // ─── Enroll Handler ───────────────────────────────────────────────────────
  async function handleEnroll(course) {
    if (!user) { onNavigate('auth'); return; }
    if (enrollingId) return;

    // Check if already enrolled
    const existing = await checkEnrollment(user.id, course.id);
    if (existing) {
      // Just open the course modal
      handleSelectCourse({ ...course, title: lang === 'ar' ? course.title_ar : (course.title_en || course.title_ar) });
      return;
    }

    setEnrollingId(course.id);
    try {
      await enrollInCourse(user.id, course.id);
      await loadData(); // refresh
      setActiveTab('my-courses');
    } catch (err) {
      console.error('Enrollment error:', err);
      alert(lang === 'ar' ? 'حدث خطأ أثناء التسجيل' : 'Error during enrollment');
    } finally {
      setEnrollingId(null);
    }
  }

  // ─── Course Modal ─────────────────────────────────────────────────────────
  function handleSelectCourse(course) {
    setSelectedCourse(course._raw || course);
  }

  // Called by CourseDetailModal when a lesson is completed
  function handleLessonCompleted(courseId, progressPct, remainingLessons) {
    setEnrolledCourses(prev => prev.map(c =>
      c.id === courseId ? { ...c, progress: progressPct, remainingLessons } : c
    ));
  }

  // Called by CourseDetailModal when a course reaches 100%
  async function handleCourseCompleted(course) {
    try {
      const courseTitle = lang === 'ar' ? course.title_ar : (course.title_en || course.title_ar);
      await issueCertificate({
        userId: user.id,
        courseId: course.id,
        userName: userProfile?.full_name || user.email,
        courseTitle,
        userEmail: user.email,
      });
      await loadData();
      setShowCertFor(courseTitle);
    } catch (err) {
      console.error('Certificate error:', err);
    }
  }

  // ─── Access Logic ─────────────────────────────────────────────────────────
  function getCourseAccess(course) {
    if (!user) return 'locked';
    if (hasPermission(course.full_access_permission_key)) return 'full';
    if (hasPermission(course.teaser_permission_key)) return 'teaser';
    return 'locked';
  }

  // ─── Not Logged In ────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8', padding: '20px' }}>
        <GlassCard style={{ padding: '48px', maxWidth: '560px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎓</div>
          <h2 style={{ color: '#0b2849', marginBottom: '16px', fontSize: '24px', fontWeight: 'bold' }}>
            {lang === 'ar' ? 'مرحباً بك في المركز التعليمي' : 'Welcome to the Learning Hub'}
          </h2>
          <p style={{ color: 'rgba(11, 40, 73, 0.65)', marginBottom: '32px', lineHeight: '1.7' }}>
            {lang === 'ar'
              ? 'يرجى تسجيل الدخول للوصول إلى المساقات التعليمية والاختبارات والشهادات.'
              : 'Please log in to access training courses, quizzes, and certificates.'}
          </p>
          <Button variant="gradient" onClick={() => onNavigate('auth')}>
            {lang === 'ar' ? 'تسجيل الدخول / إنشاء حساب' : 'Log In / Sign Up'}
          </Button>
        </GlassCard>
      </div>
    );
  }

  const enrolledCourseIds = new Set([
    ...enrolledCourses.map(c => c.id),
    ...completedCourses.map(c => c.id),
  ]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
      
      {/* 1. Header Banner */}
      <div style={{
        background: 'linear-gradient(90deg, #15b47a 0%, #12a978 5%, #0c8774 23%, #066d71 41%, #025a6e 60%, #004f6d 79%, #004c6d 100%)',
        padding: '160px 20px 50px 20px',
        color: '#ffffff',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '12px', color: '#ffffff' }}>
            {lang === 'ar' ? 'المركز التعليمي' : 'Learning Hub'}
          </h1>
          <p style={{ fontSize: '17px', maxWidth: '700px', margin: '0 auto', lineHeight: '1.7', color: 'rgba(255, 255, 255, 0.85)' }}>
            {lang === 'ar'
              ? 'تصفح المساقات التدريبية، شاهد المحاضرات، واختبر معلوماتك للحصول على شهادة الاعتماد.'
              : 'Browse training courses, watch lectures, and test your knowledge to earn certification.'}
          </p>
          {!hasPermission('view:all_courses') && (
            <div style={{ background: 'rgba(255, 193, 7, 0.15)', color: '#ffd54f', padding: '10px 20px', borderRadius: '10px', marginTop: '20px', display: 'inline-block', fontWeight: 'bold', fontSize: '14px', border: '1px solid rgba(255,193,7,0.3)' }}>
              {lang === 'ar'
                ? 'صلاحياتك تتيح لك الوصول للمساقات المجانية فقط. اشترك للوصول الكامل.'
                : 'Your plan gives you access to free courses only. Upgrade for full access.'}
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Content */}
      <div style={{ flexGrow: 1, padding: '50px 20px 80px 20px', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '36px', background: 'rgba(255,255,255,0.5)', padding: '6px', borderRadius: '14px', width: 'fit-content', border: '1px solid rgba(11,40,73,0.1)' }}>
          {[
            { id: 'discover', label: lang === 'ar' ? 'استكشاف المساقات' : 'Discover Courses' },
            { id: 'my-courses', label: lang === 'ar' ? `تعلمي (${enrolledCourses.length + completedCourses.length})` : `My Learning (${enrolledCourses.length + completedCourses.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 22px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                transition: 'all 0.2s',
                background: activeTab === tab.id ? '#0b2849' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : 'rgba(11,40,73,0.6)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Discover ── */}
        {activeTab === 'discover' && (
          <div>
            {loading ? (
              <LoadingSkeleton />
            ) : allCourses.length === 0 ? (
              <EmptyState lang={lang} message={lang === 'ar' ? 'لا توجد مساقات متاحة حالياً.' : 'No courses available yet.'} />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '28px' }}>
                {allCourses.map(course => {
                  const access = getCourseAccess(course);
                  const isAlreadyEnrolled = enrolledCourseIds.has(course.id);
                  const title = lang === 'ar' ? course.title_ar : (course.title_en || course.title_ar);
                  const desc = lang === 'ar' ? course.description_ar : (course.description_en || course.description_ar);

                  return (
                    <div
                      key={course.id}
                      style={{
                        background: 'rgba(255,255,255,0.7)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '20px',
                        border: `1px solid ${access === 'locked' ? 'rgba(11,40,73,0.1)' : 'rgba(21,180,122,0.25)'}`,
                        boxShadow: '0 8px 24px rgba(0,76,109,0.06)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,76,109,0.12)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,76,109,0.06)'; }}
                    >
                      {/* Cover Image */}
                      <div style={{ position: 'relative', height: '180px', background: '#0b2849', overflow: 'hidden' }}>
                        {course.cover_image
                          ? <img src={course.cover_image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0b2849, #004c6d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>🎓</div>
                        }
                        {access === 'locked' && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: '#fff', fontSize: '28px' }}>🔒</span>
                          </div>
                        )}
                        <span style={{ position: 'absolute', top: '12px', right: lang === 'ar' ? '12px' : 'auto', left: lang === 'ar' ? 'auto' : '12px', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: 'bold' }}>
                          {course.category}
                        </span>
                      </div>

                      {/* Body */}
                      <div style={{ padding: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <h3 style={{ color: '#0b2849', fontSize: '16px', fontWeight: 'bold', margin: 0, lineHeight: '1.4' }}>{title}</h3>
                        {desc && <p style={{ color: 'rgba(11,40,73,0.65)', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>{desc.slice(0, 120)}{desc.length > 120 ? '…' : ''}</p>}
                        {course.duration && (
                          <span style={{ fontSize: '12px', color: '#15b47a', fontWeight: 'bold' }}>
                            ⏱ {course.duration}
                          </span>
                        )}

                        <div style={{ marginTop: 'auto', paddingTop: '14px' }}>
                          {access === 'locked' ? (
                            <Button variant="outline" style={{ width: '100%', borderColor: '#004c6d', color: '#004c6d', fontSize: '13px' }} onClick={() => onNavigate('join-us')}>
                              {lang === 'ar' ? 'ترقية الحساب للوصول' : 'Upgrade for Access'}
                            </Button>
                          ) : isAlreadyEnrolled ? (
                            <Button variant="gradient" style={{ width: '100%', fontSize: '13px' }} onClick={() => handleSelectCourse(course)}>
                              {lang === 'ar' ? 'متابعة التعلم' : 'Continue Learning'}
                            </Button>
                          ) : (
                            <Button
                              variant="gradient"
                              style={{ width: '100%', fontSize: '13px' }}
                              onClick={() => handleEnroll(course)}
                              disabled={enrollingId === course.id}
                            >
                              {enrollingId === course.id
                                ? (lang === 'ar' ? 'جاري التسجيل...' : 'Enrolling...')
                                : (lang === 'ar' ? 'التسجيل في المساق' : 'Enroll Now')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: My Courses ── */}
        {activeTab === 'my-courses' && (
          <div>
            {loading ? (
              <LoadingSkeleton />
            ) : (enrolledCourses.length === 0 && completedCourses.length === 0) ? (
              <EmptyState lang={lang} message={lang === 'ar' ? 'لم تسجل في أي مساق بعد. استكشف المساقات المتاحة!' : 'You haven\'t enrolled in any courses yet. Explore the available courses!'} />
            ) : (
              <LMSDashboard
                lang={lang}
                enrolledCourses={enrolledCourses}
                completedCourses={completedCourses}
                onSelectCourse={handleSelectCourse}
                onGenerateCertificate={(courseTitle) => setShowCertFor(courseTitle)}
              />
            )}
          </div>
        )}

        </div>
      </div>

      {/* ── Course Detail Modal ── */}
      {selectedCourse && (
        <CourseDetailModal
          lang={lang}
          course={selectedCourse}
          userId={user.id}
          onClose={() => setSelectedCourse(null)}
          onLessonCompleted={handleLessonCompleted}
          onCourseCompleted={handleCourseCompleted}
        />
      )}

      {/* ── Certificate Generator ── */}
      {showCertFor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setShowCertFor(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#0b2849' }}>✕</button>
            <CertificateGenerator
              name={userProfile?.full_name || user.email}
              course={showCertFor}
              email={user.email}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '28px' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ height: '340px', borderRadius: '20px', background: 'linear-gradient(90deg, rgba(255,255,255,0.4) 25%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.4) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', border: '1px solid rgba(11,40,73,0.08)' }} />
      ))}
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}

function EmptyState({ lang, message }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px', background: 'rgba(255,255,255,0.5)', borderRadius: '24px', border: '1px dashed rgba(11,40,73,0.2)' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
      <p style={{ color: 'rgba(11,40,73,0.55)', fontSize: '16px' }}>{message}</p>
    </div>
  );
}
