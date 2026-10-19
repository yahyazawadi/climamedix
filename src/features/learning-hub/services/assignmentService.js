import { uploadFileToR2 } from '../../../utils/s3Client';

/**
 * Assignment Storage & Data Service (SOLID: Single Responsibility & Role Isolation)
 * 
 * Provides an isolated repository pattern for:
 * 1. Assignment specifications (instructions, deadline, live session meta)
 * 2. Student submissions
 * 3. Direct upload to Cloudflare R2
 * 4. Admin-only submission querying and review
 */

const LOCAL_STORAGE_ASSIGNMENTS_KEY = 'cm_live_assignments_v1';
const LOCAL_STORAGE_SUBMISSIONS_KEY = 'cm_assignment_submissions_v1';

const DEFAULT_ASSIGNMENTS = {
  'default_live_1': {
    id: 'assign_live_1',
    lesson_id: 'live_session_1',
    title_ar: 'واجب الجلسة التفاعلية الأولى (Live Session 1)',
    title_en: 'Live Session 1 Assignment',
    instructions_ar: 'يرجى رفع ملف الحل بصيغة PDF أو مستند، أو إرفاق الرابط وملاحظاتك قبل موعد إغلاق الكورس يوم 25.',
    instructions_en: 'Please upload your solution file (PDF or document) or provide a link and notes before the course closure on Oct 25.',
    due_date: '2026-10-25T23:59:59',
    cutoff_date: '2026-10-25T23:59:59',
    max_score: 100
  }
};

class LocalAssignmentStore {
  getAssignments() {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_ASSIGNMENTS_KEY);
      return raw ? { ...DEFAULT_ASSIGNMENTS, ...JSON.parse(raw) } : { ...DEFAULT_ASSIGNMENTS };
    } catch {
      return { ...DEFAULT_ASSIGNMENTS };
    }
  }

  saveAssignments(data) {
    try {
      localStorage.setItem(LOCAL_STORAGE_ASSIGNMENTS_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  getSubmissions() {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_SUBMISSIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  saveSubmissions(data) {
    try {
      localStorage.setItem(LOCAL_STORAGE_SUBMISSIONS_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }
}

const store = new LocalAssignmentStore();

/**
 * Upload assignment file to Cloudflare R2
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
 * Get assignment configured for a specific lesson or live session
 */
export async function getAssignmentForLesson(lessonId, courseId) {
  const all = store.getAssignments();
  if (all[lessonId]) return all[lessonId];
  
  return {
    id: `assign_${lessonId}`,
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
 * Get user submission for a specific lesson/assignment
 */
export async function getUserSubmission(userId, lessonId) {
  const submissions = store.getSubmissions();
  return submissions.find(s => s.user_id === userId && s.lesson_id === lessonId) || null;
}

/**
 * Submit or update student solution (supports both Cloudflare R2 file and URL)
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
  const submissions = store.getSubmissions();
  const existingIdx = submissions.findIndex(s => s.user_id === userId && s.lesson_id === lessonId);
  
  const now = new Date().toISOString();
  const submissionRecord = {
    id: existingIdx >= 0 ? submissions[existingIdx].id : `sub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    user_id: userId || 'local_user',
    user_email: userEmail || 'student@climamedix.org',
    user_name: userName || 'Student',
    lesson_id: lessonId,
    course_id: courseId,
    file_url: fileUrl || (existingIdx >= 0 ? submissions[existingIdx].file_url : null),
    file_name: fileName || (existingIdx >= 0 ? submissions[existingIdx].file_name : null),
    solution_url: solutionUrl || '',
    notes: notes || '',
    status: 'submitted',
    submitted_at: now,
    updated_at: now
  };

  if (existingIdx >= 0) {
    submissions[existingIdx] = submissionRecord;
  } else {
    submissions.push(submissionRecord);
  }

  store.saveSubmissions(submissions);
  return submissionRecord;
}

/**
 * ADMIN ONLY: Fetch all submissions for a course or specific lesson
 * Strict role guard: non-admin requests will be rejected
 */
export async function fetchAdminSubmissions({ userProfile, courseId, lessonId }) {
  const isAdmin = userProfile && (userProfile.role === 'admin' || userProfile.role === 'superadmin');
  if (!isAdmin) {
    throw new Error('Unauthorized: Only administrators can view student submissions.');
  }

  const submissions = store.getSubmissions();
  return submissions.filter(s => {
    const matchLesson = !lessonId || s.lesson_id === lessonId;
    const matchCourse = !courseId || s.course_id === courseId;
    return matchLesson && matchCourse;
  });
}
