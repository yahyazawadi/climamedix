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
  const lessonIds = allLessons.map(l => l.id);

  async function fetchAll(table, cols, inCol, inVals) {
    let all = [];
    let from = 0;
    const batchSize = 1000;
    while (true) {
      let q = supabase.from(table).select(cols).range(from, from + batchSize - 1);
      if (inCol && inVals && inVals.length > 0) {
        q = q.in(inCol, inVals);
      }
      const { data, error } = await q;
      if (error) break;
      if (data && data.length > 0) all.push(...data);
      if (!data || data.length < batchSize) break;
      from += batchSize;
    }
    return all;
  }

  const [profilesData, compsData, watchData] = await Promise.all([
    fetchAll('profiles', 'id, full_name, email, phone, country, role, created_at', 'id', userIds),
    fetchAll('lesson_completions', 'user_id, lesson_id, completed_at', 'lesson_id', lessonIds),
    fetchAll('lesson_watch_metrics', 'user_id, lesson_id, max_percentage_watched, actual_play_duration_seconds, updated_at', 'lesson_id', lessonIds)
  ]);

  const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));
  const userProgressMap = new Map();

  (compsData || []).forEach(c => {
    if (!userProgressMap.has(c.user_id)) {
      userProgressMap.set(c.user_id, {
        completedLessonIds: new Set(),
        manualCompletedCount: 0,
        watchNormalizedCount: 0,
        totalWatchTimeSeconds: 0,
        lastActiveAt: c.completed_at
      });
    }
    const u = userProgressMap.get(c.user_id);
    u.completedLessonIds.add(c.lesson_id);
    u.manualCompletedCount++;
    if (!u.lastActiveAt || new Date(c.completed_at) > new Date(u.lastActiveAt)) {
      u.lastActiveAt = c.completed_at;
    }
  });

  (watchRes.data || []).forEach(w => {
    if (!userProgressMap.has(w.user_id)) {
      userProgressMap.set(w.user_id, {
        completedLessonIds: new Set(),
        manualCompletedCount: 0,
        watchNormalizedCount: 0,
        totalWatchTimeSeconds: 0,
        lastActiveAt: w.updated_at
      });
    }
    const u = userProgressMap.get(w.user_id);
    u.totalWatchTimeSeconds += (w.actual_play_duration_seconds || 0);

    if (Number(w.max_percentage_watched) >= 85) {
      if (!u.completedLessonIds.has(w.lesson_id)) {
        u.watchNormalizedCount++;
        u.completedLessonIds.add(w.lesson_id);
      }
    }

    if (w.updated_at && (!u.lastActiveAt || new Date(w.updated_at) > new Date(u.lastActiveAt))) {
      u.lastActiveAt = w.updated_at;
    }
  });

  // Assemble student records
  const students = enrollments.map(enr => {
    const p = profilesMap.get(enr.user_id) || {};
    const comp = userProgressMap.get(enr.user_id) || {
      completedLessonIds: new Set(),
      manualCompletedCount: 0,
      watchNormalizedCount: 0,
      totalWatchTimeSeconds: 0,
      lastActiveAt: null
    };

    const completedCount = comp.completedLessonIds.size;
    const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
    const firstSignInAt = p.created_at || enr.enrolled_at;

    return {
      userId: enr.user_id,
      name: p.full_name || 'طالب',
      email: p.email || 'N/A',
      phone: p.phone || '',
      country: (() => {
        const raw = (p.country || '').trim();
        const lower = raw.toLowerCase();
        if (lower.includes('palestin') || lower.includes('israel') || lower.includes('west bank') || lower.includes('gaza') || lower.includes('فلسطين') || lower.includes('إسرائيل')) {
          return 'فلسطين';
        }
        return raw || 'غير محدد';
      })(),
      role: p.role || 'user',
      enrolledAt: enr.enrolled_at,
      firstSignInAt,
      completedLessonsCount: completedCount,
      manualCompletedCount: comp.manualCompletedCount,
      watchNormalizedCount: comp.watchNormalizedCount,
      totalWatchTimeSeconds: Math.round(comp.totalWatchTimeSeconds),
      totalLessons,
      progressPercent,
      isCompleted: completedCount >= totalLessons && totalLessons > 0,
      lastActiveAt: comp.lastActiveAt || enr.enrolled_at,
      completedLessonIds: Array.from(comp.completedLessonIds)
    };
  });

  students.sort((a, b) => b.completedLessonsCount - a.completedLessonsCount || b.totalWatchTimeSeconds - a.totalWatchTimeSeconds);

  return {
    summary: {
      courseId,
      courseTitle: course?.title_ar || 'المساق التدريبي',
      totalEnrolled: students.length,
      activeLearners: students.filter(s => s.completedLessonsCount > 0 || s.totalWatchTimeSeconds > 0).length,
      fullyCompleted: students.filter(s => s.isCompleted).length,
      averageProgress: students.length > 0 ? Math.round(students.reduce((acc, s) => acc + s.progressPercent, 0) / students.length) : 0,
      totalNormalizedViaTelemetry: students.reduce((acc, s) => acc + s.watchNormalizedCount, 0),
      totalLessons
    },
    students
  };
}
