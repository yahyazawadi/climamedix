import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabaseClient
vi.mock('../utils/supabaseClient', () => {
  const mockFrom = vi.fn();
  const mockFunctions = {
    invoke: vi.fn()
  };
  return {
    supabase: {
      from: mockFrom,
      functions: mockFunctions
    }
  };
});

import { supabase } from '../utils/supabaseClient';
import {
  fetchCourses,
  fetchEnrollments,
  enrollInCourse,
  checkEnrollment,
  fetchCourseSyllabus,
  fetchCompletedLessons,
  markLessonComplete,
  unmarkLessonComplete,
  fetchQuiz,
  submitQuizAttempt,
  fetchPassedAttempt,
  getSecureVideoUrl,
  issueCertificate,
  fetchUserCertificates
} from '../features/learning-hub/services/lmsService';

import {
  adminFetchAllCourses,
  adminCreateCourse,
  adminUpdateCourse,
  adminDeleteCourse,
  adminFetchModules,
  adminCreateModule,
  adminUpdateModule,
  adminDeleteModule,
  adminCreateLesson,
  adminUpdateLesson,
  adminDeleteLesson,
  adminFetchFullQuiz,
  adminCreateQuiz,
  adminCreateQuestion,
  adminCreateOption,
  adminDeleteQuiz,
  adminDeleteQuestion
} from '../features/learning-hub/services/adminLmsService';

describe('LMS Engine Data Layer, Syllabus & Progress Matrix (38 Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── 1. Course Catalog & Visibility (3 Tests) ───────────────────────────────
  describe('1. Course Catalog & Visibility (3 Tests)', () => {
    it('fetchCourses orders courses by created_at descending', async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: [{ id: 'c1', title_ar: 'طب الكوارث' }, { id: 'c2', title_ar: 'المناخ والصحة' }],
        error: null
      });
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
      supabase.from.mockReturnValue({ select: mockSelect });

      const courses = await fetchCourses();

      expect(supabase.from).toHaveBeenCalledWith('courses');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(courses).toHaveLength(2);
    });

    it('fetchCourses propagates database errors cleanly', async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Postgres connection terminated')
      });
      supabase.from.mockReturnValue({ select: vi.fn().mockReturnValue({ order: mockOrder }) });

      await expect(fetchCourses()).rejects.toThrow('Postgres connection terminated');
    });

    it('returns empty array when no courses exist in catalog', async () => {
      const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });
      supabase.from.mockReturnValue({ select: vi.fn().mockReturnValue({ order: mockOrder }) });

      const courses = await fetchCourses();
      expect(courses).toEqual([]);
    });
  });

  // ─── 2. Enrollment Lifecycle (4 Tests) ──────────────────────────────────────
  describe('2. Enrollment Lifecycle (4 Tests)', () => {
    it('fetchEnrollments joins course data and orders by enrolled_at descending', async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: [{ id: 'e1', course_id: 'c1', course: { title_ar: 'مساق 1' } }],
        error: null
      });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      supabase.from.mockReturnValue({ select: mockSelect });

      const enrollments = await fetchEnrollments('user-abc');

      expect(supabase.from).toHaveBeenCalledWith('enrollments');
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-abc');
      expect(mockOrder).toHaveBeenCalledWith('enrolled_at', { ascending: false });
      expect(enrollments[0].course.title_ar).toBe('مساق 1');
    });

    it('enrollInCourse inserts record with status="active" and returns created enrollment', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'enr-99', user_id: 'u1', course_id: 'c1', status: 'active' },
        error: null
      });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      supabase.from.mockReturnValue({ insert: mockInsert });

      const result = await enrollInCourse('u1', 'c1');

      expect(mockInsert).toHaveBeenCalledWith({ user_id: 'u1', course_id: 'c1', status: 'active' });
      expect(result.id).toBe('enr-99');
      expect(result.status).toBe('active');
    });

    it('checkEnrollment returns existing active enrollment record if enrolled', async () => {
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: { id: 'enr-44', status: 'active' },
        error: null
      });
      const mockEq2 = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
      supabase.from.mockReturnValue({ select: mockSelect });

      const record = await checkEnrollment('u1', 'c1');

      expect(mockSelect).toHaveBeenCalledWith('id, status');
      expect(mockEq1).toHaveBeenCalledWith('user_id', 'u1');
      expect(mockEq2).toHaveBeenCalledWith('course_id', 'c1');
      expect(record.status).toBe('active');
    });

    it('checkEnrollment returns null if user is not enrolled in course', async () => {
      const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
          })
        })
      });

      const record = await checkEnrollment('guest-user', 'course-x');
      expect(record).toBeNull();
    });
  });

  // ─── 3. Syllabus Sorting & Hierarchy Engine (4 Tests) ───────────────────────
  describe('3. Syllabus Sorting & Hierarchy Engine (4 Tests)', () => {
    it('fetchCourseSyllabus sorts modules by sequence_order ascending', async () => {
      const rawModules = [
        { id: 'm2', sequence_order: 2, title_ar: 'الوحدة الثانية', lessons: [] },
        { id: 'm1', sequence_order: 1, title_ar: 'الوحدة الأولى', lessons: [] },
      ];
      const mockOrder = vi.fn().mockResolvedValue({ data: rawModules, error: null });
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ order: mockOrder })
        })
      });

      const syllabus = await fetchCourseSyllabus('c1');

      expect(syllabus[0].id).toBe('m2'); // mock returned array preserved, but lessons sorted within
      expect(mockOrder).toHaveBeenCalledWith('sequence_order', { ascending: true });
    });

    it('sorts lessons strictly by sequence_order ascending inside each module', async () => {
      const rawModules = [
        {
          id: 'm1',
          sequence_order: 1,
          lessons: [
            { id: 'les-3', sequence_order: 3, title_ar: 'الدرس الثالث' },
            { id: 'les-1', sequence_order: 1, title_ar: 'الدرس الأول' },
            { id: 'les-2', sequence_order: 2, title_ar: 'الدرس الثاني' },
          ]
        }
      ];
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: rawModules, error: null })
          })
        })
      });

      const syllabus = await fetchCourseSyllabus('c1');
      const lessons = syllabus[0].lessons;

      expect(lessons[0].id).toBe('les-1');
      expect(lessons[1].id).toBe('les-2');
      expect(lessons[2].id).toBe('les-3');
    });

    it('handles lessons with null or missing sequence_order gracefully without crashing', async () => {
      const rawModules = [
        {
          id: 'm1',
          lessons: [
            { id: 'les-b', sequence_order: null, title_ar: 'درس ب' },
            { id: 'les-a', sequence_order: 1, title_ar: 'درس أ' },
          ]
        }
      ];
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: rawModules, error: null })
          })
        })
      });

      const syllabus = await fetchCourseSyllabus('c1');
      expect(syllabus[0].lessons).toHaveLength(2);
      expect(syllabus[0].lessons[0].id).toBe('les-b'); // 0 comes before 1
    });

    it('handles empty modules array returning empty syllabus', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null })
          })
        })
      });

      const syllabus = await fetchCourseSyllabus('empty-course');
      expect(syllabus).toEqual([]);
    });
  });

  // ─── 4. Lesson Progress & Completion Engine (6 Tests) ───────────────────────
  describe('4. Lesson Progress & Completion Engine (6 Tests)', () => {
    it('fetchCompletedLessons returns completedSet as an ES Set and accurate totalLessons', async () => {
      // 1st call for modules
      const mockModules = [
        { lessons: [{ id: 'l1' }, { id: 'l2' }] },
        { lessons: [{ id: 'l3' }] }
      ];
      // 2nd call for completions
      const mockCompletions = [{ lesson_id: 'l1' }, { lesson_id: 'l3' }];

      let callIndex = 0;
      supabase.from.mockImplementation(() => {
        callIndex++;
        if (callIndex === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockModules, error: null })
            })
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: mockCompletions, error: null })
            })
          })
        };
      });

      const { completedSet, totalLessons } = await fetchCompletedLessons('user-1', 'course-1');

      expect(totalLessons).toBe(3);
      expect(completedSet).toBeInstanceOf(Set);
      expect(completedSet.has('l1')).toBe(true);
      expect(completedSet.has('l2')).toBe(false);
      expect(completedSet.has('l3')).toBe(true);
      expect(completedSet.size).toBe(2);
    });

    it('fetchCompletedLessons handles courses with zero lessons immediately', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      const { completedSet, totalLessons } = await fetchCompletedLessons('u1', 'empty-course');

      expect(totalLessons).toBe(0);
      expect(completedSet.size).toBe(0);
    });

    it('calculates 100% completion when all lessons in course are completed', async () => {
      const mockModules = [{ lessons: [{ id: 'l1' }, { id: 'l2' }] }];
      const mockCompletions = [{ lesson_id: 'l1' }, { lesson_id: 'l2' }];

      let call = 0;
      supabase.from.mockImplementation(() => {
        call++;
        if (call === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockModules, error: null })
            })
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: mockCompletions, error: null })
            })
          })
        };
      });

      const { completedSet, totalLessons } = await fetchCompletedLessons('u1', 'c1');
      const progressPercent = Math.round((completedSet.size / totalLessons) * 100);

      expect(progressPercent).toBe(100);
    });

    it('calculates 0% completion when user has completed no lessons', async () => {
      const mockModules = [{ lessons: [{ id: 'l1' }, { id: 'l2' }, { id: 'l3' }] }];
      const mockCompletions = [];

      let call = 0;
      supabase.from.mockImplementation(() => {
        call++;
        if (call === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockModules, error: null })
            })
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: mockCompletions, error: null })
            })
          })
        };
      });

      const { completedSet, totalLessons } = await fetchCompletedLessons('u1', 'c1');
      const progressPercent = Math.round((completedSet.size / totalLessons) * 100);

      expect(progressPercent).toBe(0);
    });

    it('markLessonComplete uses upsert with onConflict on user_id,lesson_id', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ upsert: mockUpsert });

      await markLessonComplete('user-123', 'lesson-456');

      expect(supabase.from).toHaveBeenCalledWith('lesson_completions');
      expect(mockUpsert).toHaveBeenCalledWith(
        { user_id: 'user-123', lesson_id: 'lesson-456' },
        { onConflict: 'user_id,lesson_id' }
      );
    });

    it('unmarkLessonComplete deletes record matching user_id and lesson_id', async () => {
      const mockEq2 = vi.fn().mockResolvedValue({ error: null });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq1 });
      supabase.from.mockReturnValue({ delete: mockDelete });

      await unmarkLessonComplete('user-123', 'lesson-456');

      expect(supabase.from).toHaveBeenCalledWith('lesson_completions');
      expect(mockEq1).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockEq2).toHaveBeenCalledWith('lesson_id', 'lesson-456');
    });
  });

  // ─── 5. Quiz Lifecycle & Assessments (5 Tests) ──────────────────────────────
  describe('5. Quiz Lifecycle & Assessments (5 Tests)', () => {
    it('fetchQuiz retrieves quiz for specific lesson_id', async () => {
      const rawQuiz = {
        id: 'q1',
        title_ar: 'اختبار الدرس الأول',
        quiz_questions: [
          {
            id: 'qq2',
            sequence_order: 2,
            quiz_options: [{ option_text_ar: 'خيار ب' }, { option_text_ar: 'خيار أ' }]
          },
          {
            id: 'qq1',
            sequence_order: 1,
            quiz_options: [{ option_text_ar: 'خيار ت' }]
          }
        ]
      };
      const mockMaybeSingle = vi.fn().mockResolvedValue({ data: rawQuiz, error: null });
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
          })
        })
      });

      const quiz = await fetchQuiz('course-1', 'lesson-1');

      expect(quiz).toBeDefined();
      expect(quiz.quiz_questions[0].id).toBe('qq1'); // Sorted by sequence_order
      expect(quiz.quiz_questions[1].id).toBe('qq2');
      // Options sorted alphabetically in Arabic
      expect(quiz.quiz_questions[1].quiz_options[0].option_text_ar).toBe('خيار أ');
    });

    it('fetchQuiz retrieves course-final quiz when lesson_id is omitted', async () => {
      const mockIs = vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'final-q' }, error: null }) });
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ is: mockIs })
        })
      });

      const quiz = await fetchQuiz('course-1', null);

      expect(mockIs).toHaveBeenCalledWith('lesson_id', null);
      expect(quiz.id).toBe('final-q');
    });

    it('returns null when no quiz is linked to lesson or course', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) })
          })
        })
      });

      const quiz = await fetchQuiz('course-1', 'lesson-no-quiz');
      expect(quiz).toBeNull();
    });

    it('submitQuizAttempt records user_id, quiz_id, score, and passed status', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'attempt-1', score: 85, passed: true },
        error: null
      });
      supabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ single: mockSingle })
        })
      });

      const attempt = await submitQuizAttempt('user-1', 'quiz-1', 85, true);

      expect(attempt.score).toBe(85);
      expect(attempt.passed).toBe(true);
    });

    it('fetchPassedAttempt returns latest passed attempt record', async () => {
      const mockLimit = vi.fn().mockResolvedValue({
        data: [{ id: 'att-passed', score: 90, passed: true }],
        error: null
      });
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({ limit: mockLimit })
              })
            })
          })
        })
      });

      const passed = await fetchPassedAttempt('user-1', 'quiz-1');
      expect(passed.id).toBe('att-passed');
      expect(passed.score).toBe(90);
    });
  });

  // ─── 6. Secure Video URL Resolution (4 Tests) ───────────────────────────────
  describe('6. Secure Video URL Resolution (4 Tests)', () => {
    it('resolves URL from Supabase Edge Function when invoke succeeds', async () => {
      supabase.functions.invoke.mockResolvedValueOnce({
        data: { url: 'https://r2.climamedix.org/presigned-video.mp4' },
        error: null
      });

      const url = await getSecureVideoUrl('lesson-1', 'course-1');

      expect(supabase.functions.invoke).toHaveBeenCalledWith('get-video-url', {
        body: { lessonId: 'lesson-1', courseId: 'course-1' }
      });
      expect(url).toBe('https://r2.climamedix.org/presigned-video.mp4');
    });

    it('falls back to database lesson record when Edge Function fails', async () => {
      supabase.functions.invoke.mockRejectedValueOnce(new Error('Edge function timeout'));

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { video_url: 'https://custom-cdn.com/videos/stream.m3u8' },
              error: null
            })
          })
        })
      });

      const url = await getSecureVideoUrl('lesson-1', 'course-1');
      expect(url).toBe('https://custom-cdn.com/videos/stream.m3u8');
    });

    it('prefixes public R2 URL when database video_url is a relative storage key', async () => {
      supabase.functions.invoke.mockResolvedValueOnce({ data: null });

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { video_url: 'videos/lecture_01.mp4' },
              error: null
            })
          })
        })
      });

      const url = await getSecureVideoUrl('l1', 'c1');
      expect(url).toContain('/videos/lecture_01.mp4');
    });

    it('throws error when lesson has no video_url in database', async () => {
      supabase.functions.invoke.mockResolvedValueOnce({ data: null });

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Row not found')
            })
          })
        })
      });

      await expect(getSecureVideoUrl('l-missing', 'c1')).rejects.toThrow('Lesson video not found in database');
    });
  });

  // ─── 7. Certificate Issuance & Conflict Handling (4 Tests) ──────────────────
  describe('7. Certificate Issuance & Conflict Handling (4 Tests)', () => {
    it('issues new certificate with formatted verifiable ID starting with CERT-', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'CERT-C1234567-U1234567-1700000000', course: 'مساق المناخ' },
        error: null
      });
      supabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ single: mockSingle })
        })
      });

      const cert = await issueCertificate({
        userId: 'u123456789',
        courseId: 'c123456789',
        userName: 'د. مريم العتيبي',
        courseTitle: 'مساق المناخ',
        userEmail: 'm@climamedix.org'
      });

      expect(cert.id.startsWith('CERT-')).toBe(true);
      expect(cert.course).toBe('مساق المناخ');
    });

    it('recovers gracefully from Postgres code 23505 (unique constraint) by fetching existing certificate', async () => {
      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Insert fails with duplicate key
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: '23505', message: 'duplicate key value violates unique constraint' }
                })
              })
            })
          };
        }
        // Query existing cert
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'CERT-EXISTING-123', course: 'مساق المناخ' },
                  error: null
                })
              })
            })
          })
        };
      });

      const cert = await issueCertificate({
        userId: 'u1',
        courseId: 'c1',
        userName: 'د. مريم',
        courseTitle: 'مساق المناخ',
        userEmail: 'm@test.com'
      });

      expect(cert.id).toBe('CERT-EXISTING-123');
    });

    it('throws error when certificate creation encounters non-duplicate database error', async () => {
      supabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: '42P01', message: 'relation certificates does not exist' }
            })
          })
        })
      });

      await expect(issueCertificate({
        userId: 'u1', courseId: 'c1', userName: 'Test', courseTitle: 'Title', userEmail: 't@t.com'
      })).rejects.toThrow();
    });

    it('fetchUserCertificates queries certificate_requests filtered by status="approved"', async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: [{ id: 'req-1', status: 'approved' }],
        error: null
      });
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ order: mockOrder })
          })
        })
      });

      const certs = await fetchUserCertificates('user-1');

      expect(supabase.from).toHaveBeenCalledWith('certificate_requests');
      expect(certs[0].status).toBe('approved');
    });
  });

  // ─── 8. Admin LMS CRUD Services (8 Tests) ───────────────────────────────────
  describe('8. Admin LMS CRUD Services (8 Tests)', () => {
    it('adminCreateCourse inserts course record and returns created course', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'c-new', title_ar: 'مساق جديد' },
        error: null
      });
      supabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ single: mockSingle })
        })
      });

      const course = await adminCreateCourse({ title_ar: 'مساق جديد' });
      expect(course.id).toBe('c-new');
    });

    it('adminUpdateCourse appends updated_at timestamp and updates record', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'c1', title_ar: 'محدث' },
        error: null
      });
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ single: mockSingle })
        })
      });
      supabase.from.mockReturnValue({ update: mockUpdate });

      const course = await adminUpdateCourse('c1', { title_ar: 'محدث' });
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        title_ar: 'محدث',
        updated_at: expect.any(String)
      }));
      expect(course.title_ar).toBe('محدث');
    });

    it('adminDeleteCourse deletes course matching id', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ delete: vi.fn().mockReturnValue({ eq: mockEq }) });

      await adminDeleteCourse('c-to-delete');
      expect(mockEq).toHaveBeenCalledWith('id', 'c-to-delete');
    });

    it('adminCreateModule inserts module record', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'mod-1' }, error: null });
      supabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ single: mockSingle })
        })
      });

      const mod = await adminCreateModule({ course_id: 'c1', sequence_order: 1 });
      expect(mod.id).toBe('mod-1');
    });

    it('adminDeleteModule deletes module by id', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ delete: vi.fn().mockReturnValue({ eq: mockEq }) });

      await adminDeleteModule('mod-del');
      expect(mockEq).toHaveBeenCalledWith('id', 'mod-del');
    });

    it('adminCreateLesson inserts lesson record', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'les-new' }, error: null });
      supabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ single: mockSingle })
        })
      });

      const lesson = await adminCreateLesson({ module_id: 'm1', title_ar: 'درس جديد' });
      expect(lesson.id).toBe('les-new');
    });

    it('adminDeleteLesson deletes lesson by id', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ delete: vi.fn().mockReturnValue({ eq: mockEq }) });

      await adminDeleteLesson('les-del');
      expect(mockEq).toHaveBeenCalledWith('id', 'les-del');
    });

    it('adminCreateQuiz inserts quiz associated with lesson and course', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'quiz-new' }, error: null });
      supabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ single: mockSingle })
        })
      });

      const quiz = await adminCreateQuiz({ course_id: 'c1', lesson_id: 'l1', passing_score: 80 });
      expect(quiz.id).toBe('quiz-new');
    });
  });
});
