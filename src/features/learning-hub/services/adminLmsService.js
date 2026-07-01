import { supabase } from '../../../utils/supabaseClient';

// ─── ADMIN COURSE CRUD ────────────────────────────────────────────────────────

export async function adminFetchAllCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('*, modules(id, title_ar, sequence_order)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function adminCreateCourse(courseData) {
  const { data, error } = await supabase
    .from('courses')
    .insert(courseData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function adminUpdateCourse(courseId, courseData) {
  const { data, error } = await supabase
    .from('courses')
    .update({ ...courseData, updated_at: new Date().toISOString() })
    .eq('id', courseId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function adminDeleteCourse(courseId) {
  const { error } = await supabase.from('courses').delete().eq('id', courseId);
  if (error) throw error;
}

// ─── ADMIN MODULE CRUD ────────────────────────────────────────────────────────

export async function adminFetchModules(courseId) {
  const { data, error } = await supabase
    .from('modules')
    .select('*, lessons(*)')
    .eq('course_id', courseId)
    .order('sequence_order', { ascending: true });
  if (error) throw error;
  return (data || []).map(m => ({
    ...m,
    lessons: (m.lessons || []).sort((a, b) => (a.sequence_order ?? 0) - (b.sequence_order ?? 0))
  }));
}

export async function adminCreateModule(moduleData) {
  const { data, error } = await supabase
    .from('modules')
    .insert(moduleData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function adminUpdateModule(moduleId, moduleData) {
  const { data, error } = await supabase
    .from('modules')
    .update({ ...moduleData, updated_at: new Date().toISOString() })
    .eq('id', moduleId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function adminDeleteModule(moduleId) {
  const { error } = await supabase.from('modules').delete().eq('id', moduleId);
  if (error) throw error;
}

// ─── ADMIN LESSON CRUD ────────────────────────────────────────────────────────

export async function adminCreateLesson(lessonData) {
  const { data, error } = await supabase
    .from('lessons')
    .insert(lessonData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function adminUpdateLesson(lessonId, lessonData) {
  const { data, error } = await supabase
    .from('lessons')
    .update(lessonData)
    .eq('id', lessonId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function adminDeleteLesson(lessonId) {
  const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
  if (error) throw error;
}

// ─── ADMIN QUIZ CRUD ──────────────────────────────────────────────────────────

export async function adminFetchFullQuiz(lessonId) {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*, quiz_questions(*, quiz_options(*))')
    .eq('lesson_id', lessonId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  data.quiz_questions = (data.quiz_questions || [])
    .sort((a, b) => (a.sequence_order ?? 0) - (b.sequence_order ?? 0));
  return data;
}

export async function adminCreateQuiz(quizData) {
  const { data, error } = await supabase
    .from('quizzes')
    .insert(quizData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function adminCreateQuestion(questionData) {
  const { data, error } = await supabase
    .from('quiz_questions')
    .insert(questionData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function adminCreateOption(optionData) {
  const { data, error } = await supabase
    .from('quiz_options')
    .insert(optionData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function adminDeleteQuiz(quizId) {
  const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
  if (error) throw error;
}

export async function adminDeleteQuestion(questionId) {
  const { error } = await supabase.from('quiz_questions').delete().eq('id', questionId);
  if (error) throw error;
}

// ─── R2 VIDEO UPLOAD ──────────────────────────────────────────────────────────

/**
 * Upload a video file directly to Cloudflare R2 (S3-compatible).
 * Returns the object key (path in bucket).
 */
export async function uploadVideoToR2(file, onProgress) {
  const R2_ENDPOINT = import.meta.env.VITE_R2_ENDPOINT;
  const R2_BUCKET = import.meta.env.VITE_R2_BUCKET_NAME;
  const ACCESS_KEY = import.meta.env.VITE_R2_ACCESS_KEY_ID;
  const SECRET_KEY = import.meta.env.VITE_R2_SECRET_ACCESS_KEY;

  if (!R2_ENDPOINT || !R2_BUCKET || !ACCESS_KEY || !SECRET_KEY) {
    throw new Error('R2 environment variables are not configured');
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'webm';
  const key = `videos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const url = `${R2_ENDPOINT}/${R2_BUCKET}/${key}`;

  // Build AWS4 signature for the PUT request
  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
  const amzDate = now.toISOString().replace(/[:-]/g, '').slice(0, 15) + 'Z';
  const region = 'auto';
  const service = 's3';

  const canonicalHeaders = `content-type:${file.type}\nhost:${new URL(R2_ENDPOINT).host}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'content-type;host;x-amz-date';

  // For simplicity with R2, use pre-signed URL via aws4fetch approach
  // We'll use XMLHttpRequest for progress tracking
  return new Promise(async (resolve, reject) => {
    try {
      // Dynamic import of aws4fetch for signing
      const { AwsClient } = await import('https://esm.sh/aws4fetch@1.0.19');
      const aws = new AwsClient({
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_KEY,
        service,
        region,
      });

      const signed = await aws.sign(new Request(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } }), { aws: { signQuery: false } });

      const xhr = new XMLHttpRequest();
      xhr.open('PUT', signed.url);
      signed.headers.forEach((val, key) => xhr.setRequestHeader(key, val));

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const publicUrl = import.meta.env.VITE_R2_PUBLIC_URL;
          resolve(publicUrl ? `${publicUrl}/${key}` : url);
        }
        else reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText}`));
      };
      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(file);
    } catch (err) {
      reject(err);
    }
  });
}
