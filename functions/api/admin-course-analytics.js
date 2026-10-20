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

    // 6. Fetch all lesson completions for this course
    const lessonIds = allLessons.map(l => l.id);
    const { data: completions } = await sbAdmin
      .from('lesson_completions')
      .select('user_id, lesson_id, completed_at')
      .in('lesson_id', lessonIds);

    // Group completions per user
    const userCompletionsMap = new Map();
    (completions || []).forEach(c => {
      if (!userCompletionsMap.has(c.user_id)) {
        userCompletionsMap.set(c.user_id, {
          count: 0,
          completedLessonIds: new Set(),
          lastActiveAt: c.completed_at
        });
      }
      const u = userCompletionsMap.get(c.user_id);
      u.count++;
      u.completedLessonIds.add(c.lesson_id);
      if (new Date(c.completed_at) > new Date(u.lastActiveAt)) {
        u.lastActiveAt = c.completed_at;
      }
    });

    // 7. Fetch Profiles for all enrolled users
    const userIds = (enrollments || []).map(e => e.user_id);
    const { data: profiles } = await sbAdmin
      .from('profiles')
      .select('id, full_name, email, phone, country, role, created_at')
      .in('id', userIds);

    const profilesMap = new Map((profiles || []).map(p => [p.id, p]));

    // 8. Assemble structured student analytics records
    const students = (enrollments || []).map(enr => {
      const p = profilesMap.get(enr.user_id) || {};
      const comp = userCompletionsMap.get(enr.user_id) || { count: 0, completedLessonIds: new Set(), lastActiveAt: null };
      const completedCount = comp.count;
      const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

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
        completedLessonsCount: completedCount,
        totalLessons,
        progressPercent,
        isCompleted: completedCount >= totalLessons && totalLessons > 0,
        lastActiveAt: comp.lastActiveAt || enr.enrolled_at,
        completedLessonIds: Array.from(comp.completedLessonIds)
      };
    });

    // Sort by progress descending
    students.sort((a, b) => b.completedLessonsCount - a.completedLessonsCount);

    const summary = {
      courseId,
      courseTitle: course?.title_ar || course?.title_en || 'المساق التدريبي',
      totalEnrolled: students.length,
      activeLearners: students.filter(s => s.completedLessonsCount > 0).length,
      fullyCompleted: students.filter(s => s.isCompleted).length,
      averageProgress: students.length > 0 ? Math.round(students.reduce((acc, s) => acc + s.progressPercent, 0) / students.length) : 0,
      totalLessons
    };

    return new Response(JSON.stringify({ summary, students }), { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error('Course Analytics Endpoint Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { status: 500, headers: corsHeaders });
  }
}
