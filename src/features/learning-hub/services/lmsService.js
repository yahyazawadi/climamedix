import { supabase } from '../../../utils/supabaseClient';

// ─── COURSES ────────────────────────────────────────────────────────────────

/**
 * Fetch all courses visible to the current user.
 * RLS handles filtering: teaser_permission_key or full_access_permission_key must match.
 */
export async function fetchCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// ─── ENROLLMENTS ─────────────────────────────────────────────────────────────

/**
 * Fetch all enrollments for the current user, with course data joined.
 */
export async function fetchEnrollments(userId) {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      course:courses(*)
    `)
    .eq('user_id', userId)
    .order('enrolled_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Enroll the current user in a course.
 */
export async function enrollInCourse(userId, courseId) {
  const { data, error } = await supabase
    .from('enrollments')
    .insert({ user_id: userId, course_id: courseId, status: 'active' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Check if a user is already enrolled in a specific course.
 */
export async function checkEnrollment(userId, courseId) {
  const { data, error } = await supabase
    .from('enrollments')
    .select('id, status')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (error) throw error;
  return data; // null if not enrolled
}

// ─── SYLLABUS (MODULES + LESSONS) ────────────────────────────────────────────

/**
 * Fetch a course's full syllabus: modules ordered by sequence_order,
 * each with their lessons ordered by sequence_order.
 * RLS on lessons enforces that only users with full_access_permission_key can read them.
 */
export async function fetchCourseSyllabus(courseId) {
  const { data, error } = await supabase
    .from('modules')
    .select(`
      *,
      lessons(*)
    `)
    .eq('course_id', courseId)
    .order('sequence_order', { ascending: true });

  if (error) throw error;

  // Sort lessons within each module
  return data.map(module => ({
    ...module,
    lessons: (module.lessons || []).sort((a, b) => (a.sequence_order ?? 0) - (b.sequence_order ?? 0))
  }));
}

// ─── LESSON PROGRESS ─────────────────────────────────────────────────────────

/**
 * Fetch all completed lesson IDs for a user within a course.
 * Returns a Set of lesson UUIDs for O(1) lookup.
 */
export async function fetchCompletedLessons(userId, courseId) {
  // Get all lesson IDs in the course first
  const { data: modules, error: modError } = await supabase
    .from('modules')
    .select('lessons(id)')
    .eq('course_id', courseId);

  if (modError) throw modError;

  const allLessonIds = modules.flatMap(m => (m.lessons || []).map(l => l.id));
  if (allLessonIds.length === 0) return new Set();

  const { data, error } = await supabase
    .from('lesson_completions')
    .select('lesson_id')
    .eq('user_id', userId)
    .in('lesson_id', allLessonIds);

  if (error) throw error;
  return new Set(data.map(r => r.lesson_id));
}

/**
 * Mark a single lesson as complete for the current user.
 * Uses upsert to avoid duplicate key errors if called twice.
 */
export async function markLessonComplete(userId, lessonId) {
  const { error } = await supabase
    .from('lesson_completions')
    .upsert({ user_id: userId, lesson_id: lessonId }, { onConflict: 'user_id,lesson_id' });

  if (error) throw error;
}

// ─── QUIZZES ─────────────────────────────────────────────────────────────────

/**
 * Fetch a quiz for a specific lesson (or course), including all questions and options.
 * Returns null if no quiz is linked.
 */
export async function fetchQuiz(courseId, lessonId = null) {
  let query = supabase
    .from('quizzes')
    .select(`
      *,
      quiz_questions(
        *,
        quiz_options(*)
      )
    `)
    .eq('course_id', courseId);

  if (lessonId) {
    query = query.eq('lesson_id', lessonId);
  } else {
    query = query.is('lesson_id', null);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) return null;

  // Sort questions and options by sequence_order
  data.quiz_questions = (data.quiz_questions || [])
    .sort((a, b) => (a.sequence_order ?? 0) - (b.sequence_order ?? 0))
    .map(q => ({
      ...q,
      quiz_options: (q.quiz_options || []).sort((a, b) => a.option_text_ar.localeCompare(b.option_text_ar))
    }));

  return data;
}

/**
 * Submit a quiz attempt result.
 * @param {string} userId
 * @param {string} quizId
 * @param {number} score - 0 to 100
 * @param {boolean} passed
 */
export async function submitQuizAttempt(userId, quizId, score, passed) {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .insert({ user_id: userId, quiz_id: quizId, score, passed })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Check if user already passed a specific quiz.
 */
export async function fetchPassedAttempt(userId, quizId) {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('id, score, passed')
    .eq('user_id', userId)
    .eq('quiz_id', quizId)
    .eq('passed', true)
    .maybeSingle();

  if (error) throw error;
  return data; // null if not passed yet
}

// ─── SECURE VIDEO URL ─────────────────────────────────────────────────────────

/**
 * Request a short-lived presigned URL for a lesson video from the Supabase Edge Function.
 * The Edge Function verifies enrollment before generating the URL.
 * @param {string} lessonId - The lesson UUID
 * @param {string} courseId - The course UUID (for enrollment check)
 * @returns {Promise<string>} - The presigned video URL
 */
export async function getSecureVideoUrl(lessonId, courseId) {
  try {
    const { data, error } = await supabase.functions.invoke('get-video-url', {
      body: { lessonId, courseId }
    });

    if (error) throw error;
    if (data?.url) return data.url;
  } catch (err) {
    console.warn('Secure video URL fetch failed, trying direct public URL fallback:', err);
  }

  // Fallback: Query database directly for video_url and construct the public R2 URL
  const { data: lesson, error: dbErr } = await supabase
    .from('lessons')
    .select('video_url')
    .eq('id', lessonId)
    .single();

  if (dbErr || !lesson?.video_url) {
    throw new Error('Lesson video not found in database');
  }

  const videoKey = lesson.video_url;
  if (videoKey.startsWith('http://') || videoKey.startsWith('https://')) {
    return videoKey;
  }

  const publicUrl = import.meta.env.VITE_R2_PUBLIC_URL || 'https://pub-4bc58eedbff74d8bafb3dea5edd751f5.r2.dev';
  return `${publicUrl}/${videoKey}`;
}

// ─── CERTIFICATES ─────────────────────────────────────────────────────────────

/**
 * Issue a certificate for a completed course.
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.courseId
 * @param {string} params.userName - Display name for the certificate
 * @param {string} params.courseTitle - Course title for the certificate
 * @param {string} params.userEmail
 */
export async function issueCertificate({ userId, courseId, userName, courseTitle, userEmail }) {
  // Generate a unique, verifiable certificate ID
  const certId = `CERT-${courseId.slice(0, 8).toUpperCase()}-${userId.slice(0, 8).toUpperCase()}-${Date.now()}`;

  const { data, error } = await supabase
    .from('certificates')
    .insert({
      id: certId,
      user_id: userId,
      course: courseTitle,
      name: userName,
      email: userEmail,
    })
    .select()
    .single();

  if (error) {
    // If cert already exists (unique constraint), return it
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', userId)
        .eq('course', courseTitle)
        .maybeSingle();
      return existing;
    }
    throw error;
  }
  return data;
}

/**
 * Fetch all certificates issued to a user.
 */
export async function fetchUserCertificates(userId) {
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', userId)
    .order('issued_at', { ascending: false });

  if (error) throw error;
  return data;
}
