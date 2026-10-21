import { createClient } from '@supabase/supabase-js';

// Server-side Cloudflare Pages Function endpoint: /api/assignments
// Handles:
// POST: Submit or update student assignment (authenticated users)
// GET: Fetch user's own submission or all submissions (if admin)
export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

    const payload = await request.json();
    const { lessonId, courseId, fileUrl, fileName, solutionUrl, notes } = payload;

    const sbAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Get valid course / lesson UUIDs if client sent non-UUID fallback
    let validLessonId = lessonId;
    if (!validLessonId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(validLessonId)) {
      // Find the lesson for this course
      const { data: modules } = await sbAdmin.from('modules').select('id').eq('course_id', courseId).limit(1);
      if (modules && modules[0]) {
        const { data: lessons } = await sbAdmin.from('lessons').select('id').eq('module_id', modules[0].id).limit(1);
        if (lessons && lessons[0]) validLessonId = lessons[0].id;
      }
    }

    const now = new Date().toISOString();
    const submissionRecord = {
      user_id: user.id,
      course_id: courseId,
      lesson_id: validLessonId,
      file_url: fileUrl || null,
      file_name: fileName || null,
      solution_url: solutionUrl || '',
      notes: notes || '',
      status: 'submitted',
      submitted_at: now,
      updated_at: now
    };

    // Check if previous record exists for this user + lesson
    const { data: existing } = await sbAdmin
      .from('assignment_submissions')
      .select('id')
      .eq('user_id', user.id)
      .eq('lesson_id', validLessonId)
      .maybeSingle();

    let resData;
    if (existing?.id) {
      const { data, error } = await sbAdmin
        .from('assignment_submissions')
        .update(submissionRecord)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      resData = data;
    } else {
      const { data, error } = await sbAdmin
        .from('assignment_submissions')
        .insert(submissionRecord)
        .select()
        .single();
      if (error) throw error;
      resData = data;
    }

    return new Response(JSON.stringify({ success: true, submission: resData }), { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

    // Verify caller
    const sbUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: userError } = await sbUserClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), { status: 401, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const courseId = url.searchParams.get('courseId');
    const lessonId = url.searchParams.get('lessonId');
    const mode = url.searchParams.get('mode'); // 'admin' or 'student'

    const sbAdmin = createClient(supabaseUrl, serviceRoleKey);

    if (mode === 'admin') {
      // Validate admin role
      const { data: profile } = await sbAdmin.from('profiles').select('role').eq('id', user.id).single();
      const isAdmin = profile && (profile.role === 'admin' || profile.role === 'superadmin');
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Forbidden: Admins only' }), { status: 403, headers: corsHeaders });
      }

      let q = sbAdmin.from('assignment_submissions').select('*').order('submitted_at', { ascending: false });
      if (courseId) q = q.eq('course_id', courseId);
      if (lessonId) q = q.eq('lesson_id', lessonId);
      const { data, error } = await q;
      if (error) throw error;

      // Join profile info
      const userIds = [...new Set((data || []).map(d => d.user_id))];
      let profilesMap = {};
      if (userIds.length > 0) {
        const { data: profs } = await sbAdmin.from('profiles').select('id, full_name, email').in('id', userIds);
        (profs || []).forEach(p => { profilesMap[p.id] = p; });
      }

      const enriched = (data || []).map(d => ({
        ...d,
        user_name: profilesMap[d.user_id]?.full_name || 'Student',
        user_email: profilesMap[d.user_id]?.email || 'N/A'
      }));

      return new Response(JSON.stringify({ success: true, submissions: enriched }), { status: 200, headers: corsHeaders });
    }

    // Default: Return user's own submission
    let q = sbAdmin.from('assignment_submissions').select('*').eq('user_id', user.id);
    if (lessonId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lessonId)) {
      q = q.eq('lesson_id', lessonId);
    }
    const { data: subs, error } = await q.maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;

    return new Response(JSON.stringify({ success: true, submission: subs || null }), { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, content-type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    }
  });
}
