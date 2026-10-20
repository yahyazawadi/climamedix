import { createClient } from '@supabase/supabase-js';

// Server-side Cloudflare Pages Function endpoint: /api/admin-course-analytics
// Enforces STRICT Superadmin authentication & RLS
export async function onRequestGet(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Content-Type': 'application/json'
  };

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');
    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

    // 1. Verify caller user identity
    const sbUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: userError } = await sbUserClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), { status: 401, headers: corsHeaders });
    }

    // 2. Strict RLS / Superadmin validation
    const sbAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { data: profile, error: profError } = await sbAdmin
      .from('profiles')
      .select('id, role, full_name, email')
      .eq('id', user.id)
      .single();

    if (profError || !profile || profile.role !== 'superadmin') {
      return new Response(JSON.stringify({ 
        error: 'Forbidden: Only superadmins are allowed to view complete course student progress and analytics.' 
      }), { status: 403, headers: corsHeaders });
    }

    // 3. Fetch Course ID from query params or default course
    const url = new URL(request.url);
    const courseId = url.searchParams.get('courseId') || '0509ec71-4043-43d4-9865-b3bca0510458';

    // 4. Load Course, Lessons & Modules
    const [courseRes, modulesRes] = await Promise.all([
      sbAdmin.from('courses').select('id, title_ar, title_en').eq('id', courseId).single(),
      sbAdmin.from('modules').select('id, sequence_order, title_ar, lessons(id, title_ar, sequence_order)').eq('course_id', courseId).order('sequence_order', { ascending: true })
    ]);

    const course = courseRes.data;
    const modules = modulesRes.data || [];
    const allLessons = modules.flatMap(m => (m.lessons || []));
    const totalLessons = allLessons.length;

    // 5. Fetch all Enrollments with Profiles
    const { data: enrollments } = await sbAdmin
      .from('enrollments')
      .select('user_id, status, enrolled_at')
      .eq('course_id', courseId)
      .order('enrolled_at', { ascending: false });

    // 6. Fetch completions AND watch telemetry for this course to dynamically normalize completion state
    const lessonIds = allLessons.map(l => l.id);
    const [completionsRes, watchMetricsRes] = await Promise.all([
      sbAdmin.from('lesson_completions').select('user_id, lesson_id, completed_at').in('lesson_id', lessonIds),
      sbAdmin.from('lesson_watch_metrics').select('user_id, lesson_id, max_percentage_watched, actual_play_duration_seconds, updated_at').in('lesson_id', lessonIds)
    ]);

    const completions = completionsRes.data || [];
    const watchMetrics = watchMetricsRes.data || [];

    // Group progress per user dynamically
    const userCompletionsMap = new Map();

    const getOrCreateUser = (uid, defaultDate) => {
      if (!userCompletionsMap.has(uid)) {
        userCompletionsMap.set(uid, {
          completedLessonIds: new Set(),
          manualCompletedLessonIds: new Set(),
          watchNormalizedLessonIds: new Set(),
          totalWatchTimeSeconds: 0,
          lastActiveAt: defaultDate || null
        });
      }
      return userCompletionsMap.get(uid);
    };

    // A. Add explicit completions
    completions.forEach(c => {
      const u = getOrCreateUser(c.user_id, c.completed_at);
      u.completedLessonIds.add(c.lesson_id);
      u.manualCompletedLessonIds.add(c.lesson_id);
      if (!u.lastActiveAt || new Date(c.completed_at) > new Date(u.lastActiveAt)) {
        u.lastActiveAt = c.completed_at;
      }
    });

    // B. Dynamically normalize with watch telemetry (video completed if watched >= 85%)
    watchMetrics.forEach(w => {
      const u = getOrCreateUser(w.user_id, w.updated_at);
      u.totalWatchTimeSeconds += (w.actual_play_duration_seconds || 0);

      const maxPct = Number(w.max_percentage_watched) || 0;
      if (maxPct >= 85) {
        if (!u.completedLessonIds.has(w.lesson_id)) {
          u.watchNormalizedLessonIds.add(w.lesson_id);
        }
        u.completedLessonIds.add(w.lesson_id);
      }

      if (w.updated_at && (!u.lastActiveAt || new Date(w.updated_at) > new Date(u.lastActiveAt))) {
        u.lastActiveAt = w.updated_at;
      }
    });

    // 7. Fetch Profiles and Auth data for all enrolled users
    const userIds = (enrollments || []).map(e => e.user_id);
    const [profilesRes, authUsersRes] = await Promise.all([
      sbAdmin.from('profiles').select('id, full_name, email, phone, country, role, created_at').in('id', userIds),
      sbAdmin.auth.admin.listUsers({ perPage: 1000 }).catch(() => ({ data: { users: [] } }))
    ]);

    const profilesMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
    const authUsersMap = new Map((authUsersRes.data?.users || []).map(u => [u.id, u]));

    // 8. Assemble structured student analytics records
    const students = (enrollments || []).map(enr => {
      const p = profilesMap.get(enr.user_id) || {};
      const authUser = authUsersMap.get(enr.user_id) || {};
      const comp = userCompletionsMap.get(enr.user_id) || {
        completedLessonIds: new Set(),
        manualCompletedLessonIds: new Set(),
        watchNormalizedLessonIds: new Set(),
        totalWatchTimeSeconds: 0,
        lastActiveAt: null
      };

      const completedCount = comp.completedLessonIds.size;
      const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

      // First activity / initial registration timestamp
      const firstSignInAt = authUser.created_at || p.created_at || enr.enrolled_at;
      const lastSignInAt = authUser.last_sign_in_at || null;

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
        lastSignInAt,
        completedLessonsCount: completedCount,
        manualCompletedCount: comp.manualCompletedLessonIds.size,
        watchNormalizedCount: comp.watchNormalizedLessonIds.size,
        totalWatchTimeSeconds: Math.round(comp.totalWatchTimeSeconds),
        totalLessons,
        progressPercent,
        isCompleted: completedCount >= totalLessons && totalLessons > 0,
        lastActiveAt: comp.lastActiveAt || lastSignInAt || enr.enrolled_at,
        completedLessonIds: Array.from(comp.completedLessonIds)
      };
    });

    // Sort by progress descending, then by watch time
    students.sort((a, b) => b.completedLessonsCount - a.completedLessonsCount || b.totalWatchTimeSeconds - a.totalWatchTimeSeconds);

    const summary = {
      courseId,
      courseTitle: course?.title_ar || course?.title_en || 'المساق التدريبي',
      totalEnrolled: students.length,
      activeLearners: students.filter(s => s.completedLessonsCount > 0 || s.totalWatchTimeSeconds > 0).length,
      fullyCompleted: students.filter(s => s.isCompleted).length,
      averageProgress: students.length > 0 ? Math.round(students.reduce((acc, s) => acc + s.progressPercent, 0) / students.length) : 0,
      totalNormalizedViaTelemetry: students.reduce((acc, s) => acc + s.watchNormalizedCount, 0),
      totalLessons
    };

    return new Response(JSON.stringify({ summary, students }), { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error('Course Analytics Endpoint Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { status: 500, headers: corsHeaders });
  }
}
