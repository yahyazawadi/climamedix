import { supabase } from '../../../utils/supabaseClient';

/**
 * Service to fetch comprehensive student progress analytics for courses.
 * Enforces Superadmin authorization:
 * - Queries the secured server endpoint `/api/admin-course-analytics`
 * - Validates local session token
 * - Handles graceful fallback
 */

export async function fetchCourseStudentsProgress(courseId = '0509ec71-4043-43d4-9865-b3bca0510458') {
  // 1. Get current session token
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('يجب تسجيل الدخول كمسؤول رئيسي (Superadmin) للوصول للتحليلات.');
  }

  // 2. Call server-side protected endpoint
  try {
    const res = await fetch(`/api/admin-course-analytics?courseId=${courseId}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (res.ok) {
      return await res.json();
    }

    if (res.status === 403) {
      throw new Error('غير مصرح لك: هذه البيانات مخصصة فقط للمسؤولين الرئيسيين (Superadmins).');
    }
  } catch (e) {
    if (e.message.includes('غير مصرح لك')) throw e;
  }

  // Local dev / Direct Supabase fallback (with client-side role verification)
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
  if (!profile || profile.role !== 'superadmin') {
    throw new Error('غير مصرح لك: هذه البيانات مخصصة فقط للمسؤولين الرئيسيين (Superadmins).');
  }

  // If local / dev server where functions are not proxied
  const [courseRes, modulesRes, enrollmentsRes] = await Promise.all([
    supabase.from('courses').select('id, title_ar, title_en').eq('id', courseId).single(),
    supabase.from('modules').select('id, sequence_order, lessons(id, title_ar)').eq('course_id', courseId),
    supabase.from('enrollments').select('user_id, status, enrolled_at').eq('course_id', courseId)
  ]);

  const course = courseRes.data;
  const modules = modulesRes.data || [];
  const allLessons = modules.flatMap(m => (m.lessons || []));
  const totalLessons = allLessons.length;
  const enrollments = enrollmentsRes.data || [];

  const userIds = enrollments.map(e => e.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, country, role')
    .in('id', userIds);

  const profilesMap = new Map((profiles || []).map(p => [p.id, p]));

  // In direct query fallback, assemble student records
  const students = enrollments.map(enr => {
    const p = profilesMap.get(enr.user_id) || {};
    return {
      userId: enr.user_id,
      name: p.full_name || 'طالب',
      email: p.email || 'N/A',
      phone: p.phone || '',
      country: p.country || 'غير محدد',
      role: p.role || 'user',
      enrolledAt: enr.enrolled_at,
      completedLessonsCount: 0,
      totalLessons,
      progressPercent: 0,
      isCompleted: false,
      lastActiveAt: enr.enrolled_at,
      completedLessonIds: []
    };
  });

  return {
    summary: {
      courseId,
      courseTitle: course?.title_ar || 'المساق التدريبي',
      totalEnrolled: students.length,
      activeLearners: 0,
      fullyCompleted: 0,
      averageProgress: 0,
      totalLessons
    },
    students
  };
}
