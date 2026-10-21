import { uploadFileToR2 } from '../../../utils/s3Client';
import { supabase } from '../../../utils/supabaseClient';

/**
 * Assignment Storage & Data Service (Connected directly to Cloudflare Pages API + Supabase)
 * 
 * Provides:
 * 1. Assignment specifications
 * 2. Student submissions direct to Supabase
 * 3. File uploads to Cloudflare R2
 * 4. Admin-only submission querying
 */

const DEFAULT_ASSIGNMENTS = {
  'default_live_1': {
    id: 'assign_live_1',
    lesson_id: 'live_session_1',
    title_ar: 'الواجب العملي للجلسة التفاعلية الأولى',
    title_en: 'Live Session 1 Practical Assignment',
    instructions_ar: 'يرجى رفع ملف الحل بصيغة PDF أو مستند، أو إرفاق الرابط وملاحظاتك قبل موعد إغلاق الكورس يوم 25.',
    instructions_en: 'Please upload your solution file (PDF or document) or provide a link and notes before the course closure on Oct 25.',
    due_date: '2026-10-25T23:59:59',
    cutoff_date: '2026-10-25T23:59:59',
    max_score: 100
  }
};

/**
 * Upload assignment file directly to Cloudflare R2
 */
export async function uploadAssignmentFileToR2(file, folder = 'assignments', onProgress = null) {
  if (!file) throw new Error('No file provided for upload.');

  // Enforce 50MB file size limit
  const maxBytes = 50 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error('File exceeds maximum allowed size of 50MB.');
  }

  return await uploadFileToR2(file, folder, onProgress);
}

/**
 * Get assignment details
 */
export async function getAssignmentForLesson(lessonId, courseId) {
  return {
    id: `assign_${lessonId || 'live_1'}`,
    lesson_id: lessonId,
    course_id: courseId,
    title_ar: 'الواجب العملي للجلسة التفاعلية',
    title_en: 'Live Session Practical Assignment',
    instructions_ar: 'يرجى رفع ملف الحل مباشرة أو إرفاق رابط وملاحظاتك قبل الموعد النهائي يوم 25.',
    instructions_en: 'Upload your solution file directly or provide a link and notes before the deadline on October 25.',
    due_date: '2026-10-25T23:59:59',
    cutoff_date: '2026-10-25T23:59:59',
    max_score: 100
  };
}

/**
 * Get user submission from Supabase
 */
export async function getUserSubmission(userId, lessonId) {
  if (!userId) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return null;

    const res = await fetch(`/api/assignments?lessonId=${encodeURIComponent(lessonId || '')}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.submission || null;
  } catch (err) {
    console.warn('Failed to fetch user submission from server:', err);
    return null;
  }
}

/**
 * Submit or update student solution directly to Supabase via serverless function
 */
export async function submitStudentAssignment({ 
  userId, 
  userEmail, 
  userName, 
  lessonId, 
  courseId, 
  fileUrl, 
  fileName, 
  solutionUrl, 
  notes 
}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error('يجب تسجيل الدخول أولاً لتسليم الواجب.');
  }

  const res = await fetch('/api/assignments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      courseId,
      lessonId,
      fileUrl,
      fileName,
      solutionUrl,
      notes
    })
  });

  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error || 'Failed to submit assignment');
  }

  return json.submission;
}

/**
 * ADMIN ONLY: Fetch all submissions from Supabase
 */
export async function fetchAdminSubmissions({ userProfile, courseId, lessonId }) {
  const isAdmin = userProfile && (userProfile.role === 'admin' || userProfile.role === 'superadmin');
  if (!isAdmin) {
    throw new Error('Unauthorized: Only administrators can view student submissions.');
  }

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error('Session expired. Please log in again.');
  }

  let url = '/api/assignments?mode=admin';
  if (courseId) url += `&courseId=${encodeURIComponent(courseId)}`;
  if (lessonId) url += `&lessonId=${encodeURIComponent(lessonId)}`;

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error || 'Failed to fetch admin submissions');
  }

  return json.submissions || [];
}
