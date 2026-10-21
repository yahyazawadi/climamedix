import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase environment variables missing (VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Inspect a user's full activity:
 * - Profile details (email, name, role)
 * - Enrollments
 * - Completed lessons count
 * - Discussion comments & answers
 * - Certificate requests
 * - Assignment submissions (if any in Supabase)
 *
 * Usage:
 *   node scripts/inspect-user.mjs "نعمة"
 *   node scripts/inspect-user.mjs "nimahmonim@gmail.com"
 *   node scripts/inspect-user.mjs "+249"
 *   node scripts/inspect-user.mjs "1279b906-acbd-4f0e-af9b-74276c5b60ab"
 */
export async function inspectUser(query) {
  if (!query) {
    console.log('Usage: node scripts/inspect-user.mjs <query (name, email, phone, or UUID)>');
    return null;
  }

  console.log(`\n======================================================`);
  console.log(`🔎 Searching for user matching: "${query}"`);
  console.log(`======================================================`);

  // 1. Fetch matching profiles
  const { data: allProfiles, error: profileErr } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, role, created_at');

  if (profileErr) {
    console.error('Failed to query profiles:', profileErr.message);
    return null;
  }

  const qLower = query.toLowerCase().trim();
  const matchedProfiles = (allProfiles || []).filter(p => {
    const idMatch = p.id?.toLowerCase() === qLower;
    const nameMatch = p.full_name?.toLowerCase().includes(qLower);
    const emailMatch = p.email?.toLowerCase().includes(qLower);
    const phoneMatch = p.phone?.includes(query.trim());
    return idMatch || nameMatch || emailMatch || phoneMatch;
  });

  if (matchedProfiles.length === 0) {
    console.log(`❌ No user found matching "${query}".`);
    return null;
  }

  console.log(`✅ Found ${matchedProfiles.length} matching profile(s):\n`);

  for (const profile of matchedProfiles) {
    console.log(`👤 User: ${profile.full_name || 'N/A'}`);
    console.log(`   ID:    ${profile.id}`);
    console.log(`   Email: ${profile.email}`);
    console.log(`   Phone: ${profile.phone || 'N/A'}`);
    console.log(`   Role:  ${profile.role || 'user'}`);
    console.log(`   Registered: ${profile.created_at || 'N/A'}`);

    // 2. Enrollments
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('id, course_id, status, enrolled_at')
      .eq('user_id', profile.id);
    console.log(`\n   📚 Enrollments (${enrollments?.length || 0}):`);
    for (const e of (enrollments || [])) {
      const { data: c } = await supabase.from('courses').select('title_ar, title_en').eq('id', e.course_id).maybeSingle();
      console.log(`      - [${e.status}] ${c?.title_ar || c?.title_en || e.course_id} (Enrolled: ${e.enrolled_at})`);
    }

    // 3. Completed Lessons
    const { count: completedCount } = await supabase
      .from('lesson_completions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id);
    console.log(`\n   ✅ Completed Lessons Count: ${completedCount || 0}`);

    // 4. Comments & Interactive Session Answers
    const { data: comments } = await supabase
      .from('lesson_comments')
      .select('id, course_id, lesson_id, content, created_at, is_anonymous')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: true });

    console.log(`\n   💬 Discussion & Interactive Answers (${comments?.length || 0}):`);
    if (comments && comments.length > 0) {
      comments.forEach((c, idx) => {
        console.log(`      [${idx + 1}] (${c.created_at}) Lesson: ${c.lesson_id}`);
        console.log(`          "${c.content.replace(/\n+/g, ' ')}"`);
      });
    } else {
      console.log(`      (No comments submitted)`);
    }

    // 5. Certificate Requests
    const { data: certs } = await supabase
      .from('certificate_requests')
      .select('id, requested_name_ar, requested_name_en, status, requested_at')
      .eq('user_id', profile.id);
    console.log(`\n   📜 Certificate Requests (${certs?.length || 0}):`);
    (certs || []).forEach(cr => {
      console.log(`      - [${cr.status}] Name: ${cr.requested_name_ar} / ${cr.requested_name_en} (${cr.requested_at})`);
    });

    // 6. Assignment Submissions (Database table check)
    try {
      const { data: subs } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('user_id', profile.id);
      console.log(`\n   📝 Database Assignment Submissions: ${subs?.length || 0}`);
    } catch {}

    console.log(`\n------------------------------------------------------\n`);
  }

  return matchedProfiles;
}

// If invoked from CLI directly
const queryArg = process.argv.slice(2).join(' ');
if (queryArg) {
  inspectUser(queryArg).catch(console.error);
}
