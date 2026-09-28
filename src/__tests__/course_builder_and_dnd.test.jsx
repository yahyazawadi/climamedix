import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { renderHook, act } from '@testing-library/preact';
import { CourseBuilderPage } from '../features/learning-hub/components/admin/CourseBuilderPage';
import { useLmsDragDrop } from '../features/learning-hub/hooks/useLmsDragDrop';
import * as adminLmsService from '../features/learning-hub/services/adminLmsService';
import { uploadFileToR2 } from '../utils/s3Client';

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('../features/auth/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
  ROLE_PERMISSIONS: {}
}));

// Mock adminLmsService
vi.mock('../features/learning-hub/services/adminLmsService', () => ({
  adminFetchAllCourses: vi.fn(),
  adminCreateCourse: vi.fn(),
  adminUpdateCourse: vi.fn(),
  adminDeleteCourse: vi.fn(),
  adminFetchModules: vi.fn(),
  adminCreateModule: vi.fn(),
  adminUpdateModule: vi.fn(),
  adminDeleteModule: vi.fn(),
  adminCreateLesson: vi.fn(),
  adminUpdateLesson: vi.fn(),
  adminDeleteLesson: vi.fn(),
  adminFetchFullQuiz: vi.fn(),
  adminCreateQuiz: vi.fn(),
  adminCreateQuestion: vi.fn(),
  adminCreateOption: vi.fn(),
  adminDeleteQuestion: vi.fn(),
  adminDeleteQuiz: vi.fn()
}));

// Mock RichTextEditor
vi.mock('../features/shared/components/RichTextEditor', () => ({
  RichTextEditor: ({ value, onChange, placeholder, isRtl }) => (
    <div data-testid="rich-text-editor" data-rtl={String(isRtl)}>
      <textarea
        placeholder={placeholder}
        value={value}
        onInput={(e) => onChange(e.target.value)}
      />
    </div>
  )
}));

// Mock Supabase
const mockSupabaseOrder = vi.fn().mockImplementation(() => 
  Promise.resolve({ data: [{ perm_key: 'view:all_courses' }, { perm_key: 'view:free_content' }], error: null })
);
vi.mock('../utils/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => mockSupabaseOrder()
      })
    })
  }
}));

// Mock S3 / R2 client
vi.mock('../utils/s3Client', () => ({
  uploadFileToR2: vi.fn()
}));

describe('Stage 3: Course Builder & Drag-and-Drop Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Course Builder Authorization Guards', () => {
    it('DENIES access and shows Access Denied message when user lacks manage:any_course / manage:courses', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'u-1', email: 'user@test.com' },
        hasPermission: (perm) => false,
        authLoading: false
      });

      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      expect(screen.getByText('غير مصرح بالدخول')).toBeInTheDocument();
      expect(screen.getByText('ليس لديك صلاحيات لإدارة المساقات.')).toBeInTheDocument();
      expect(screen.queryByText('منشئ ومنظم المساقات')).toBeNull();
    });

    it('DENIES access in English locale when user lacks permission', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'u-1', email: 'user@test.com' },
        hasPermission: (perm) => false,
        authLoading: false
      });

      render(<CourseBuilderPage lang="en" onNavigate={vi.fn()} />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText('You do not have permissions to manage courses.')).toBeInTheDocument();
    });

    it('ALLOWS access when user has manage:any_course permission and fetches courses', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'admin-1', email: 'admin@test.com' },
        hasPermission: (perm) => perm === 'manage:any_course' || perm === 'manage:courses',
        authLoading: false
      });

      adminLmsService.adminFetchAllCourses.mockResolvedValueOnce([
        { id: 'c-1', title_ar: 'دورة تغير المناخ والصحة', title_en: 'Climate Course', modules: [] }
      ]);

      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      expect(screen.getByText('منشئ ومنظم المساقات')).toBeInTheDocument();
      await waitFor(() => {
        expect(adminLmsService.adminFetchAllCourses).toHaveBeenCalledTimes(1);
      });
      expect(await screen.findByText('دورة تغير المناخ والصحة')).toBeInTheDocument();
    });
  });

  describe('2. LMS Drag-and-Drop Hook (useLmsDragDrop)', () => {
    const initialModules = [
      {
        id: 'mod-1',
        title_ar: 'الوحدة الأولى',
        sequence_order: 1,
        lessons: [
          { id: 'les-1', title_ar: 'الدرس 1.1', sequence_order: 1, module_id: 'mod-1' },
          { id: 'les-2', title_ar: 'الدرس 1.2', sequence_order: 2, module_id: 'mod-1' },
          { id: 'les-3', title_ar: 'الدرس 1.3', sequence_order: 3, module_id: 'mod-1' }
        ]
      },
      {
        id: 'mod-2',
        title_ar: 'الوحدة الثانية',
        sequence_order: 2,
        lessons: [
          { id: 'les-4', title_ar: 'الدرس 2.1', sequence_order: 1, module_id: 'mod-2' }
        ]
      }
    ];

    it('Reorders lessons within the SAME module when dragged past halfway point', async () => {
      let stateModules = JSON.parse(JSON.stringify(initialModules));
      const setModules = vi.fn((newMods) => { stateModules = newMods; });
      const selectedCourse = { id: 'c-1' };

      adminLmsService.adminUpdateLesson.mockResolvedValue({ id: 'les-1' });

      const { result } = renderHook(() => 
        useLmsDragDrop({ modules: stateModules, setModules, selectedCourse })
      );

      // Start drag les-1 in mod-1
      const mockDataTransfer = { setData: vi.fn(), effectAllowed: '' };
      act(() => {
        result.current.handleLessonDragStart(
          { dataTransfer: mockDataTransfer },
          'les-1',
          'mod-1'
        );
      });

      expect(result.current.draggedLessonId).toBe('les-1');
      expect(result.current.draggedLessonSourceModId).toBe('mod-1');

      // Drop les-1 on les-2 (below midpoint -> after les-2)
      const mockDropEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        currentTarget: {
          getBoundingClientRect: () => ({ top: 100, height: 50 })
        },
        clientY: 135 // > midpoint (125) -> isAfter = true
      };

      await act(async () => {
        await result.current.handleLessonDrop(mockDropEvent, 'les-2', 'mod-1');
      });

      // Verify setModules was called with new order: les-2 (1), les-1 (2), les-3 (3)
      expect(setModules).toHaveBeenCalled();
      const updatedMod1 = setModules.mock.calls[0][0][0];
      expect(updatedMod1.lessons.map(l => l.id)).toEqual(['les-2', 'les-1', 'les-3']);
      expect(updatedMod1.lessons.map(l => l.sequence_order)).toEqual([1, 2, 3]);

      // adminUpdateLesson should have been called to persist sequence_order
      expect(adminLmsService.adminUpdateLesson).toHaveBeenCalledWith('les-2', { sequence_order: 1, module_id: 'mod-1' });
      expect(adminLmsService.adminUpdateLesson).toHaveBeenCalledWith('les-1', { sequence_order: 2, module_id: 'mod-1' });
    });

    it('Moves a lesson ACROSS modules and updates module_id & sequence_orders in both', async () => {
      let stateModules = JSON.parse(JSON.stringify(initialModules));
      const setModules = vi.fn((newMods) => { stateModules = newMods; });
      const selectedCourse = { id: 'c-1' };

      adminLmsService.adminUpdateLesson.mockResolvedValue({});

      const { result } = renderHook(() => 
        useLmsDragDrop({ modules: stateModules, setModules, selectedCourse })
      );

      // Start dragging les-1 from mod-1
      act(() => {
        result.current.handleLessonDragStart(
          { dataTransfer: { setData: vi.fn(), effectAllowed: '' } },
          'les-1',
          'mod-1'
        );
      });

      // Drop onto les-4 in mod-2 (before midpoint -> before les-4)
      const mockDropEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        currentTarget: {
          getBoundingClientRect: () => ({ top: 200, height: 60 })
        },
        clientY: 210 // < midpoint (230) -> isAfter = false
      };

      await act(async () => {
        await result.current.handleLessonDrop(mockDropEvent, 'les-4', 'mod-2');
      });

      expect(setModules).toHaveBeenCalled();
      const [finalMod1, finalMod2] = setModules.mock.calls[0][0];

      // mod-1 lost les-1: now has [les-2, les-3] with sequence [1, 2]
      expect(finalMod1.lessons.map(l => l.id)).toEqual(['les-2', 'les-3']);
      expect(finalMod1.lessons.map(l => l.sequence_order)).toEqual([1, 2]);

      // mod-2 gained les-1: now has [les-1, les-4] with sequence [1, 2] and module_id: 'mod-2'
      expect(finalMod2.lessons.map(l => l.id)).toEqual(['les-1', 'les-4']);
      expect(finalMod2.lessons[0].module_id).toBe('mod-2');

      // Update call must update module_id for les-1
      expect(adminLmsService.adminUpdateLesson).toHaveBeenCalledWith('les-1', { sequence_order: 1, module_id: 'mod-2' });
    });

    it('Reorders entire MODULES when a module is dragged and dropped', async () => {
      let stateModules = JSON.parse(JSON.stringify(initialModules));
      const setModules = vi.fn((newMods) => { stateModules = newMods; });
      const selectedCourse = { id: 'c-1' };

      adminLmsService.adminUpdateModule.mockResolvedValue({});

      const { result } = renderHook(() => 
        useLmsDragDrop({ modules: stateModules, setModules, selectedCourse })
      );

      // Start drag mod-1
      act(() => {
        result.current.handleModuleDragStart(
          { dataTransfer: { setData: vi.fn(), effectAllowed: '' } },
          'mod-1'
        );
      });

      expect(result.current.draggedModuleId).toBe('mod-1');

      // Drop mod-1 onto mod-2 below midpoint -> insert after mod-2
      const mockDropEvent = {
        preventDefault: vi.fn(),
        currentTarget: {
          getBoundingClientRect: () => ({ top: 300, height: 100 })
        },
        clientY: 380 // > midpoint (350) -> isAfter = true
      };

      await act(async () => {
        await result.current.handleModuleDrop(mockDropEvent, 'mod-2');
      });

      expect(setModules).toHaveBeenCalled();
      const updatedModules = setModules.mock.calls[0][0];
      // mod-2 should now be first (seq 1), mod-1 second (seq 2)
      expect(updatedModules.map(m => m.id)).toEqual(['mod-2', 'mod-1']);
      expect(updatedModules.map(m => m.sequence_order)).toEqual([1, 2]);

      expect(adminLmsService.adminUpdateModule).toHaveBeenCalledWith('mod-2', { sequence_order: 1 });
      expect(adminLmsService.adminUpdateModule).toHaveBeenCalledWith('mod-1', { sequence_order: 2 });
    });

    it('Rolls back module state on server error during module reordering', async () => {
      let stateModules = JSON.parse(JSON.stringify(initialModules));
      const setModules = vi.fn((newMods) => { stateModules = newMods; });
      const selectedCourse = { id: 'c-1' };

      // Simulate network / server error on adminUpdateModule
      adminLmsService.adminUpdateModule.mockRejectedValue(new Error('Network error'));
      adminLmsService.adminFetchModules.mockResolvedValue(initialModules);

      const { result } = renderHook(() => 
        useLmsDragDrop({ modules: stateModules, setModules, selectedCourse })
      );

      act(() => {
        result.current.handleModuleDragStart(
          { dataTransfer: { setData: vi.fn(), effectAllowed: '' } },
          'mod-1'
        );
      });

      await act(async () => {
        await result.current.handleModuleDrop({
          preventDefault: vi.fn(),
          currentTarget: { getBoundingClientRect: () => ({ top: 0, height: 100 }) },
          clientY: 80
        }, 'mod-2');
      });

      // Verify that after rejection, it refetches and rolls back
      expect(adminLmsService.adminFetchModules).toHaveBeenCalledWith('c-1');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3: Course Builder Complete Admin Operations & UI Workflows (16 Tests)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('3. Course Builder Complete Admin Operations & UI Workflows', () => {
    const mockCourses = [
      {
        id: 'c-1',
        title_ar: 'دورة تغير المناخ والصحة',
        title_en: 'Climate Change Course',
        description_ar: 'وصف الدورة',
        description_en: 'Course description',
        category: 'Climate & Health',
        duration: '20 hours',
        full_access_permission_key: 'view:all_courses',
        teaser_permission_key: 'view:free_content'
      }
    ];

    const mockModules = [
      {
        id: 'm-1',
        course_id: 'c-1',
        title_ar: 'الوحدة الأولى: الأساسيات',
        title_en: 'Module 1: Basics',
        sequence_order: 1,
        lessons: [
          {
            id: 'l-1',
            module_id: 'm-1',
            title_ar: 'الدرس الأول: مقدمة',
            title_en: 'Lesson 1: Intro',
            content_ar: '<p>محتوى عربي</p>',
            content_en: '<p>English content</p>',
            duration: '15',
            sequence_order: 1,
            is_quiz: false
          },
          {
            id: 'l-2',
            module_id: 'm-1',
            title_ar: 'اختبار الوحدة الأولى',
            title_en: 'Module 1 Exam',
            duration: '30',
            sequence_order: 2,
            is_quiz: true
          }
        ]
      }
    ];

    const mockQuiz = {
      id: 'quiz-100',
      lesson_id: 'l-2',
      quiz_questions: [
        {
          id: 'qq-1',
          question_text_ar: 'هل التغير المناخي يؤثر على الجهاز التنفسي؟',
          question_text_en: 'Does climate change affect the respiratory system?',
          points: 10,
          sequence_order: 1,
          quiz_options: [
            { id: 'opt-1', option_text_ar: 'نعم', option_text_en: 'Yes', is_correct: true },
            { id: 'opt-2', option_text_ar: 'لا', option_text_en: 'No', is_correct: false }
          ]
        }
      ]
    };

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 'admin-1', email: 'admin@climamedix.org' },
        hasPermission: (perm) => perm === 'manage:any_course' || perm === 'manage:courses',
        authLoading: false
      });

      adminLmsService.adminFetchAllCourses.mockResolvedValue(mockCourses);
      adminLmsService.adminFetchModules.mockResolvedValue(mockModules);
      adminLmsService.adminFetchFullQuiz.mockResolvedValue(mockQuiz);
      adminLmsService.adminCreateCourse.mockResolvedValue({ id: 'c-new', title_ar: 'دورة جديدة' });
      adminLmsService.adminUpdateCourse.mockResolvedValue({ id: 'c-1' });
      adminLmsService.adminDeleteCourse.mockResolvedValue();
      adminLmsService.adminCreateModule.mockResolvedValue({ id: 'm-new', title_ar: 'الوحدة الثانية' });
      adminLmsService.adminUpdateModule.mockResolvedValue({ id: 'm-1' });
      adminLmsService.adminDeleteModule.mockResolvedValue();
      adminLmsService.adminCreateLesson.mockResolvedValue({ id: 'l-new', title_ar: 'درس جديد' });
      adminLmsService.adminUpdateLesson.mockResolvedValue({ id: 'l-1' });
      adminLmsService.adminDeleteLesson.mockResolvedValue();
      adminLmsService.adminCreateQuiz.mockResolvedValue({ id: 'quiz-new' });
      adminLmsService.adminCreateQuestion.mockResolvedValue({ id: 'q-new' });
      adminLmsService.adminCreateOption.mockResolvedValue({ id: 'opt-new' });
      adminLmsService.adminDeleteQuestion.mockResolvedValue();

      vi.spyOn(window, 'confirm').mockReturnValue(true);
      vi.spyOn(window, 'alert').mockImplementation(() => {});
    });

    it('renders course list and unselected prompt initially', async () => {
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      expect(await screen.findByText('دورة تغير المناخ والصحة')).toBeInTheDocument();
      expect(screen.getByText('اختر مساقاً من القائمة للبدء بتنظيم المحتوى')).toBeInTheDocument();
    });

    it('opens New Course modal and submits adminCreateCourse', async () => {
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const newCourseBtn = screen.getByText('+ مساق جديد');
      fireEvent.click(newCourseBtn);

      expect(screen.getByText('مساق جديد')).toBeInTheDocument();

      // Find form inputs
      const form = document.querySelector('form.cb-form');
      const textInputs = form.querySelectorAll('input[type="text"]');
      fireEvent.input(textInputs[0], { target: { value: 'دورة جديدة' } });
      fireEvent.input(textInputs[1], { target: { value: 'New Course' } });

      fireEvent.submit(form);

      await waitFor(() => {
        expect(adminLmsService.adminCreateCourse).toHaveBeenCalledWith(
          expect.objectContaining({
            title_ar: 'دورة جديدة',
            title_en: 'New Course'
          })
        );
      });
    });

    it('selects a course from the list and loads syllabus modules', async () => {
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      await waitFor(() => {
        expect(adminLmsService.adminFetchModules).toHaveBeenCalledWith('c-1');
      });

      expect(await screen.findByText('الوحدة الأولى: الأساسيات')).toBeInTheDocument();
      expect(screen.getByText('الدرس الأول: مقدمة')).toBeInTheDocument();
      expect(screen.getByText('اختبار الوحدة الأولى')).toBeInTheDocument();
    });

    it('opens Course Options menu and submits Edit Course modal', async () => {
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      const optionsBtn = await screen.findByText('خيارات');
      fireEvent.click(optionsBtn);

      const editBtn = screen.getByText('تعديل المساق');
      fireEvent.click(editBtn);

      expect(screen.getByText('تعديل مساق')).toBeInTheDocument();

      const form = document.querySelector('form.cb-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(adminLmsService.adminUpdateCourse).toHaveBeenCalledWith(
          'c-1',
          expect.objectContaining({
            title_ar: 'دورة تغير المناخ والصحة'
          })
        );
      });
    });

    it('deletes a course via Course Options menu with confirmation', async () => {
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      const optionsBtn = await screen.findByText('خيارات');
      fireEvent.click(optionsBtn);

      const deleteBtn = screen.getByText('حذف المساق');
      fireEvent.click(deleteBtn);

      expect(window.confirm).toHaveBeenCalled();
      expect(adminLmsService.adminDeleteCourse).toHaveBeenCalledWith('c-1');
    });

    it('opens Add Module modal and submits adminCreateModule', async () => {
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      const addModuleBtn = await screen.findByText('+ وحدة جديدة');
      fireEvent.click(addModuleBtn);

      expect(screen.getByText('إضافة وحدة')).toBeInTheDocument();

      const form = document.querySelector('form.cb-form');
      const textInputs = form.querySelectorAll('input[type="text"]');
      fireEvent.input(textInputs[0], { target: { value: 'الوحدة الثانية' } });
      fireEvent.input(textInputs[1], { target: { value: 'Module 2' } });

      fireEvent.submit(form);

      await waitFor(() => {
        expect(adminLmsService.adminCreateModule).toHaveBeenCalledWith(
          expect.objectContaining({
            title_ar: 'الوحدة الثانية',
            title_en: 'Module 2',
            course_id: 'c-1'
          })
        );
      });
    });

    it('edits an existing module and submits adminUpdateModule', async () => {
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      await screen.findByText('الوحدة الأولى: الأساسيات');
      const editModuleBtn = screen.getByTitle('Edit Module');
      fireEvent.click(editModuleBtn);

      expect(screen.getByText('تعديل وحدة')).toBeInTheDocument();

      const form = document.querySelector('form.cb-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(adminLmsService.adminUpdateModule).toHaveBeenCalledWith(
          'm-1',
          expect.objectContaining({
            title_ar: 'الوحدة الأولى: الأساسيات'
          })
        );
      });
    });

    it('deletes an existing module with confirmation', async () => {
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      await screen.findByText('الوحدة الأولى: الأساسيات');
      const deleteModuleBtn = screen.getByTitle('Delete Module');
      fireEvent.click(deleteModuleBtn);

      expect(window.confirm).toHaveBeenCalled();
      expect(adminLmsService.adminDeleteModule).toHaveBeenCalledWith('m-1');
    });

    it('opens Lesson modal for regular lesson and submits adminCreateLesson', async () => {
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      await screen.findByText('الوحدة الأولى: الأساسيات');
      const addLessonBtn = screen.getByTitle('Add Lesson');
      fireEvent.click(addLessonBtn);

      expect(screen.getByText('محتوى الدرس (عربي)')).toBeInTheDocument();

      const form = document.querySelector('form.cb-form');
      const titleInput = form.querySelector('input[type="text"]');
      fireEvent.input(titleInput, { target: { value: 'درس جديد' } });

      const saveBtn = screen.getByText('حفظ الدرس');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(adminLmsService.adminCreateLesson).toHaveBeenCalledWith(
          expect.objectContaining({
            title_ar: 'درس جديد',
            module_id: 'm-1',
            is_quiz: false
          })
        );
      });
    });

    it('opens Lesson modal for exam and submits with is_quiz: true', async () => {
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      await screen.findByText('الوحدة الأولى: الأساسيات');
      const addExamBtn = screen.getByTitle('Add Exam');
      fireEvent.click(addExamBtn);

      expect(screen.getByText('عنوان الاختبار (عربي)')).toBeInTheDocument();

      const form = document.querySelector('form.cb-form');
      const titleInput = form.querySelector('input[type="text"]');
      fireEvent.input(titleInput, { target: { value: 'اختبار تجريبي' } });

      const saveBtn = screen.getByText('حفظ الاختبار');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(adminLmsService.adminCreateLesson).toHaveBeenCalledWith(
          expect.objectContaining({
            title_ar: 'اختبار تجريبي',
            module_id: 'm-1',
            is_quiz: true
          })
        );
      });
    });

    it('edits an existing lesson and submits adminUpdateLesson', async () => {
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      const lessonItem = await screen.findByText('الدرس الأول: مقدمة');
      fireEvent.click(lessonItem);

      expect(await screen.findByDisplayValue('الدرس الأول: مقدمة')).toBeInTheDocument();

      const saveBtn = screen.getByText('حفظ الدرس');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(adminLmsService.adminUpdateLesson).toHaveBeenCalledWith(
          'l-1',
          expect.objectContaining({
            title_ar: 'الدرس الأول: مقدمة'
          })
        );
      });
    });

    it('deletes an existing lesson with confirmation', async () => {
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      await screen.findByText('الدرس الأول: مقدمة');
      const deleteButtons = document.querySelectorAll('.cb-lesson-del');
      fireEvent.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalled();
      expect(adminLmsService.adminDeleteLesson).toHaveBeenCalledWith('l-1');
    });

    it('loads quiz questions and adds a new question with options in quiz editor', async () => {
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      const examItem = await screen.findByText('اختبار الوحدة الأولى');
      fireEvent.click(examItem);

      expect(await screen.findByText(/هل التغير المناخي يؤثر على الجهاز التنفسي؟/i)).toBeInTheDocument();

      // Add a question
      const qArInput = screen.getByPlaceholderText('Question Text (AR)');
      const qEnInput = screen.getByPlaceholderText('Question Text (EN)');
      fireEvent.input(qArInput, { target: { value: 'سؤال إضافي' } });
      fireEvent.input(qEnInput, { target: { value: 'Additional Question' } });

      const opt1Input = screen.getByPlaceholderText('Option 1 (AR)');
      fireEvent.input(opt1Input, { target: { value: 'الخيار الأول' } });

      const checkboxes = document.querySelectorAll('.cb-option-input-row input[type="checkbox"]');
      fireEvent.click(checkboxes[0]);

      const addQBtn = screen.getByText('إضافة السؤال للاختبار');
      fireEvent.click(addQBtn);

      await waitFor(() => {
        expect(adminLmsService.adminCreateQuestion).toHaveBeenCalledWith(
          expect.objectContaining({
            quiz_id: 'quiz-100',
            question_text_ar: 'سؤال إضافي'
          })
        );
      });
    });

    it('prefills demo questions in quiz editor', async () => {
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      const examItem = await screen.findByText('اختبار الوحدة الأولى');
      fireEvent.click(examItem);

      const prefillBtn = await screen.findByText('⚡ Prefill Demo Questions (Testing)');
      fireEvent.click(prefillBtn);

      await waitFor(() => {
        expect(adminLmsService.adminCreateQuestion).toHaveBeenCalled();
        expect(adminLmsService.adminCreateOption).toHaveBeenCalled();
      });
    });

    it('removes a question from quiz editor with confirmation', async () => {
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      const examItem = await screen.findByText('اختبار الوحدة الأولى');
      fireEvent.click(examItem);

      await screen.findByText(/هل التغير المناخي يؤثر على الجهاز التنفسي؟/i);
      const deleteQBtn = document.querySelector('.cb-q-del-btn');
      fireEvent.click(deleteQBtn);

      expect(window.confirm).toHaveBeenCalled();
      expect(adminLmsService.adminDeleteQuestion).toHaveBeenCalledWith('qq-1');
    });

    it('renders English interface when lang is en', async () => {
      render(<CourseBuilderPage lang="en" onNavigate={vi.fn()} />);

      expect(await screen.findByText('Course & Curriculum Builder')).toBeInTheDocument();
      expect(screen.getByText('Courses')).toBeInTheDocument();
      expect(screen.getByText('+ New Course')).toBeInTheDocument();
    });

    it('handles cover image upload to R2 during course creation', async () => {
      uploadFileToR2.mockResolvedValue('https://r2.climamedix.org/course_covers/cover.webp');
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const newCourseBtn = await screen.findByText('+ مساق جديد');
      fireEvent.click(newCourseBtn);

      const fileInput = document.querySelector('input[type="file"][accept*="image"]');
      expect(fileInput).toBeInTheDocument();

      // Test with webp image
      const dummyWebpFile = new File(['image-bits'], 'cover.webp', { type: 'image/webp' });
      fireEvent.change(fileInput, { target: { files: [dummyWebpFile] } });

      await waitFor(() => {
        expect(uploadFileToR2).toHaveBeenCalledWith(expect.any(File), 'course_covers');
      });

      // Test with empty files list (returns early)
      fireEvent.change(fileInput, { target: { files: [] } });

      // Test upload error
      uploadFileToR2.mockRejectedValueOnce(new Error('R2 Network Error'));
      fireEvent.change(fileInput, { target: { files: [dummyWebpFile] } });
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Failed to upload cover image'));
      });
    });

    it('cancels Course modal via Cancel button', async () => {
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const newCourseBtn = await screen.findByText('+ مساق جديد');
      fireEvent.click(newCourseBtn);

      expect(screen.getByText('مساق جديد')).toBeInTheDocument();

      const cancelBtn = screen.getByText('إلغاء');
      fireEvent.click(cancelBtn);

      expect(screen.queryByText('مساق جديد')).toBeNull();
    });

    it('handles loadCourses error when adminFetchAllCourses fails', async () => {
      adminLmsService.adminFetchAllCourses.mockRejectedValueOnce(new Error('Database offline'));
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Error fetching courses: Database offline'));
      });
    });

    it('displays empty state when no courses exist', async () => {
      adminLmsService.adminFetchAllCourses.mockResolvedValueOnce([]);
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      expect(await screen.findByText('لا توجد مساقات')).toBeInTheDocument();
    });

    it('handles saveCourse error alert on course creation failure', async () => {
      adminLmsService.adminCreateCourse.mockRejectedValueOnce(new Error('Course title conflict'));
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const newCourseBtn = await screen.findByText('+ مساق جديد');
      fireEvent.click(newCourseBtn);

      const form = document.querySelector('form.cb-form');
      const textInputs = form.querySelectorAll('input[type="text"]');
      fireEvent.input(textInputs[0], { target: { value: 'دورة مكررة' } });
      fireEvent.input(textInputs[1], { target: { value: 'Duplicate Course' } });

      fireEvent.submit(form);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Failed to save course: Course title conflict'));
      });
    });

    it('aborts deleteCourse when user cancels confirmation', async () => {
      vi.spyOn(window, 'confirm').mockReturnValueOnce(false);
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      const optionsBtn = await screen.findByText('خيارات');
      fireEvent.click(optionsBtn);

      const deleteBtn = screen.getByText('حذف المساق');
      fireEvent.click(deleteBtn);

      expect(adminLmsService.adminDeleteCourse).not.toHaveBeenCalled();
    });

    it('handles deleteCourse error when adminDeleteCourse fails', async () => {
      adminLmsService.adminDeleteCourse.mockRejectedValueOnce(new Error('Server error deleting course'));
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      const optionsBtn = await screen.findByText('خيارات');
      fireEvent.click(optionsBtn);

      const deleteBtn = screen.getByText('حذف المساق');
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Failed to delete course: Server error deleting course'));
      });
    });

    it('handles handleSelectCourse error when adminFetchModules fails', async () => {
      adminLmsService.adminFetchModules.mockRejectedValueOnce(new Error('Failed to load modules'));
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      await waitFor(() => {
        expect(adminLmsService.adminFetchModules).toHaveBeenCalledWith('c-1');
      });
    });

    it('CourseSettingsMenu closes on outside click and supports mouse hover effects', async () => {
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      const optionsBtn = await screen.findByText('خيارات');
      fireEvent.click(optionsBtn);

      const editBtn = screen.getByText('تعديل المساق');
      const deleteBtn = screen.getByText('حذف المساق');

      // Test hover styling
      fireEvent.mouseEnter(editBtn);
      expect(editBtn.style.background).toContain('rgba(11, 40, 73, 0.05)');
      fireEvent.mouseLeave(editBtn);
      expect(editBtn.style.background).toBe('none');

      fireEvent.mouseEnter(deleteBtn);
      expect(deleteBtn.style.background).toContain('rgba(255, 77, 77, 0.05)');
      fireEvent.mouseLeave(deleteBtn);
      expect(deleteBtn.style.background).toBe('none');

      // Click outside on window closes dropdown
      fireEvent.click(window);
      expect(screen.queryByText('تعديل المساق')).toBeNull();
    });

    it('shows empty modules notice when course has no modules', async () => {
      adminLmsService.adminFetchModules.mockResolvedValueOnce([]);
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      expect(await screen.findByText('لم يتم إضافة وحدات أو فصول بعد')).toBeInTheDocument();
    });

    it('cancels Module modal via Cancel button', async () => {
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      const addModuleBtn = await screen.findByText('+ وحدة جديدة');
      fireEvent.click(addModuleBtn);

      expect(screen.getByText('إضافة وحدة')).toBeInTheDocument();

      const cancelBtn = screen.getByText('إلغاء');
      fireEvent.click(cancelBtn);

      expect(screen.queryByText('إضافة وحدة')).toBeNull();
    });

    it('handles saveModule error alert when adminCreateModule fails', async () => {
      adminLmsService.adminCreateModule.mockRejectedValueOnce(new Error('Module validation error'));
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      const addModuleBtn = await screen.findByText('+ وحدة جديدة');
      fireEvent.click(addModuleBtn);

      const form = document.querySelector('form.cb-form');
      const textInputs = form.querySelectorAll('input[type="text"]');
      fireEvent.input(textInputs[0], { target: { value: 'وحدة غير صالحة' } });
      fireEvent.input(textInputs[1], { target: { value: 'Invalid Module' } });

      fireEvent.submit(form);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Failed to save module: Module validation error'));
      });
    });

    it('aborts deleteModule when confirm is cancelled', async () => {
      vi.spyOn(window, 'confirm').mockReturnValueOnce(false);
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      await screen.findByText('الوحدة الأولى: الأساسيات');
      const deleteModuleBtn = screen.getByTitle('Delete Module');
      fireEvent.click(deleteModuleBtn);

      expect(adminLmsService.adminDeleteModule).not.toHaveBeenCalled();
    });

    it('handles deleteModule error when adminDeleteModule fails', async () => {
      adminLmsService.adminDeleteModule.mockRejectedValueOnce(new Error('Cannot delete module'));
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      await screen.findByText('الوحدة الأولى: الأساسيات');
      const deleteModuleBtn = screen.getByTitle('Delete Module');
      fireEvent.click(deleteModuleBtn);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Failed to delete module: Cannot delete module'));
      });
    });

    it('shows empty lessons notice when module has no lessons', async () => {
      adminLmsService.adminFetchModules.mockResolvedValueOnce([
        { id: 'mod-empty', title_ar: 'وحدة فارغة', lessons: [] }
      ]);
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      expect(await screen.findByText('لا توجد دروس في هذه الوحدة')).toBeInTheDocument();
    });

    it('closes Lesson modal using Cancel button and close (✕) button', async () => {
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      await screen.findByText('الوحدة الأولى: الأساسيات');
      const addLessonBtn = screen.getByTitle('Add Lesson');
      fireEvent.click(addLessonBtn);

      expect(screen.getByText('محتوى الدرس (عربي)')).toBeInTheDocument();

      // Cancel button
      const cancelBtn = screen.getByText('إلغاء');
      fireEvent.click(cancelBtn);
      expect(screen.queryByText('محتوى الدرس (عربي)')).toBeNull();

      // Open again and close with ✕ button
      fireEvent.click(addLessonBtn);
      expect(screen.getByText('محتوى الدرس (عربي)')).toBeInTheDocument();

      const closeCrossBtn = screen.getByText('✕');
      fireEvent.click(closeCrossBtn);
      expect(screen.queryByText('محتوى الدرس (عربي)')).toBeNull();
    });

    it('switches between AR and EN language tabs in Lesson modal', async () => {
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      await screen.findByText('الوحدة الأولى: الأساسيات');
      const addLessonBtn = screen.getByTitle('Add Lesson');
      fireEvent.click(addLessonBtn);

      // Initially AR tab is active
      expect(screen.getByText('عنوان الدرس (عربي)')).toBeInTheDocument();
      expect(screen.getByText('محتوى الدرس (عربي)')).toBeInTheDocument();

      // Switch to EN tab
      const enTabBtn = screen.getByText('English (EN)');
      fireEvent.click(enTabBtn);
      expect(screen.getByText('عنوان الدرس (إنجليزي)')).toBeInTheDocument();
      expect(screen.getByText('محتوى الدرس (إنجليزي)')).toBeInTheDocument();

      // Switch back to AR tab
      const arTabBtn = screen.getByText('العربية (AR)');
      fireEvent.click(arTabBtn);
      expect(screen.getByText('عنوان الدرس (عربي)')).toBeInTheDocument();
    });

    it('switches between Content and Quiz tabs when editing a regular lesson', async () => {
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      const lessonItem = await screen.findByText('الدرس الأول: مقدمة');
      fireEvent.click(lessonItem);

      expect(await screen.findByText('محتوى الدرس')).toBeInTheDocument();
      const quizTab = screen.getByText('الاختبار (Exam)');
      fireEvent.click(quizTab);

      expect(await screen.findByText('منشئ الاختبار الخاص بالدرس')).toBeInTheDocument();

      const contentTab = screen.getByText('محتوى الدرس');
      fireEvent.click(contentTab);
      expect(screen.getByText('عنوان الدرس (عربي)')).toBeInTheDocument();
    });

    it('handles saveLesson error alert when adminCreateLesson fails', async () => {
      adminLmsService.adminCreateLesson.mockRejectedValueOnce(new Error('Lesson limit exceeded'));
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      await screen.findByText('الوحدة الأولى: الأساسيات');
      const addLessonBtn = screen.getByTitle('Add Lesson');
      fireEvent.click(addLessonBtn);

      const form = document.querySelector('form.cb-form');
      const titleInput = form.querySelector('input[type="text"]');
      fireEvent.input(titleInput, { target: { value: 'درس اختبار الخطأ' } });

      const saveBtn = screen.getByText('حفظ الدرس');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Failed to save lesson: Lesson limit exceeded'));
      });
    });

    it('aborts deleteLesson when confirmation is cancelled', async () => {
      vi.spyOn(window, 'confirm').mockReturnValueOnce(false);
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      await screen.findByText('الدرس الأول: مقدمة');
      const deleteButtons = document.querySelectorAll('.cb-lesson-del');
      fireEvent.click(deleteButtons[0]);

      expect(adminLmsService.adminDeleteLesson).not.toHaveBeenCalled();
    });

    it('handles deleteLesson error when adminDeleteLesson fails', async () => {
      adminLmsService.adminDeleteLesson.mockRejectedValueOnce(new Error('Cannot delete protected lesson'));
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      await screen.findByText('الدرس الأول: مقدمة');
      const deleteButtons = document.querySelectorAll('.cb-lesson-del');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Failed to delete lesson: Cannot delete protected lesson'));
      });
    });

    it('creates a new quiz when lesson has no existing quiz', async () => {
      adminLmsService.adminFetchFullQuiz.mockResolvedValueOnce(null);
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      const lessonItem = await screen.findByText('الدرس الأول: مقدمة');
      fireEvent.click(lessonItem);

      const quizTab = await screen.findByText('الاختبار (Exam)');
      fireEvent.click(quizTab);

      expect(await screen.findByText('لا يوجد اختبار لهذا الدرس.')).toBeInTheDocument();
      const createQuizBtn = screen.getByText('إنشاء اختبار جديد');
      fireEvent.click(createQuizBtn);

      await waitFor(() => {
        expect(adminLmsService.adminCreateQuiz).toHaveBeenCalledWith(
          expect.objectContaining({
            lesson_id: 'l-1',
            course_id: 'c-1',
            title_ar: 'اختبار - الدرس الأول: مقدمة'
          })
        );
      });
    });

    it('handles createQuiz error when adminCreateQuiz fails', async () => {
      adminLmsService.adminFetchFullQuiz.mockResolvedValueOnce(null);
      adminLmsService.adminCreateQuiz.mockRejectedValueOnce(new Error('Quiz creation failed'));
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      const lessonItem = await screen.findByText('الدرس الأول: مقدمة');
      fireEvent.click(lessonItem);

      const quizTab = await screen.findByText('الاختبار (Exam)');
      fireEvent.click(quizTab);

      const createQuizBtn = await screen.findByText('إنشاء اختبار جديد');
      fireEvent.click(createQuizBtn);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Failed to create quiz: Quiz creation failed'));
      });
    });

    it('shows empty quiz questions notice when quiz has no questions', async () => {
      adminLmsService.adminFetchFullQuiz.mockResolvedValueOnce({
        id: 'quiz-empty',
        lesson_id: 'l-2',
        quiz_questions: []
      });
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      const examItem = await screen.findByText('اختبار الوحدة الأولى');
      fireEvent.click(examItem);

      expect(await screen.findByText('لا توجد أسئلة بعد.')).toBeInTheDocument();
    });

    it('validates addQuestionToQuiz requires at least one correct option', async () => {
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      const examItem = await screen.findByText('اختبار الوحدة الأولى');
      fireEvent.click(examItem);

      const qArInput = await screen.findByPlaceholderText('Question Text (AR)');
      fireEvent.input(qArInput, { target: { value: 'سؤال بدون تحديد خيار صحيح' } });

      const addQBtn = screen.getByText('إضافة السؤال للاختبار');
      fireEvent.click(addQBtn);

      expect(window.alert).toHaveBeenCalledWith('يجب تحديد خيار صحيح واحد على الأقل.');
      expect(adminLmsService.adminCreateQuestion).not.toHaveBeenCalled();
    });

    it('ignores addQuestionToQuiz if question text is empty', async () => {
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      const examItem = await screen.findByText('اختبار الوحدة الأولى');
      fireEvent.click(examItem);

      await screen.findByPlaceholderText('Question Text (AR)');
      const checkboxes = document.querySelectorAll('.cb-option-input-row input[type="checkbox"]');
      fireEvent.click(checkboxes[0]);

      // Question text AR is empty
      const addQBtn = screen.getByText('إضافة السؤال للاختبار');
      fireEvent.click(addQBtn);

      expect(adminLmsService.adminCreateQuestion).not.toHaveBeenCalled();
    });

    it('handles addQuestionToQuiz error when adminCreateQuestion fails', async () => {
      adminLmsService.adminCreateQuestion.mockRejectedValueOnce(new Error('Question insert failed'));
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      const examItem = await screen.findByText('اختبار الوحدة الأولى');
      fireEvent.click(examItem);

      const qArInput = await screen.findByPlaceholderText('Question Text (AR)');
      fireEvent.input(qArInput, { target: { value: 'سؤال يسبب خطأ' } });

      const checkboxes = document.querySelectorAll('.cb-option-input-row input[type="checkbox"]');
      fireEvent.click(checkboxes[0]);

      const addQBtn = screen.getByText('إضافة السؤال للاختبار');
      fireEvent.click(addQBtn);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Failed to add question: Question insert failed'));
      });
    });

    it('adds and removes option inputs dynamically in quiz builder', async () => {
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      const examItem = await screen.findByText('اختبار الوحدة الأولى');
      fireEvent.click(examItem);

      await screen.findByPlaceholderText('Question Text (AR)');

      // Initially 4 options
      let optionRows = document.querySelectorAll('.cb-option-input-row');
      expect(optionRows.length).toBe(4);

      // Click "+ إضافة خيار"
      const addOptionBtn = screen.getByText('+ إضافة خيار');
      fireEvent.click(addOptionBtn);

      optionRows = document.querySelectorAll('.cb-option-input-row');
      expect(optionRows.length).toBe(5);

      // Remove the last option
      const removeButtons = screen.getAllByTitle('Remove Option');
      expect(removeButtons.length).toBe(5);
      fireEvent.click(removeButtons[4]);

      optionRows = document.querySelectorAll('.cb-option-input-row');
      expect(optionRows.length).toBe(4);
    });

    it('handles prefillTestQuestions error', async () => {
      adminLmsService.adminCreateQuestion.mockRejectedValueOnce(new Error('Prefill DB Timeout'));
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      const examItem = await screen.findByText('اختبار الوحدة الأولى');
      fireEvent.click(examItem);

      const prefillBtn = await screen.findByText('⚡ Prefill Demo Questions (Testing)');
      fireEvent.click(prefillBtn);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Failed to prefill: Prefill DB Timeout'));
      });
    });

    it('aborts removeQuestion when confirmation is cancelled', async () => {
      vi.spyOn(window, 'confirm').mockReturnValueOnce(false);
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      const examItem = await screen.findByText('اختبار الوحدة الأولى');
      fireEvent.click(examItem);

      await screen.findByText(/هل التغير المناخي يؤثر على الجهاز التنفسي؟/i);
      const deleteQBtn = document.querySelector('.cb-q-del-btn');
      fireEvent.click(deleteQBtn);

      expect(adminLmsService.adminDeleteQuestion).not.toHaveBeenCalled();
    });

    it('handles removeQuestion error when adminDeleteQuestion fails', async () => {
      adminLmsService.adminDeleteQuestion.mockRejectedValueOnce(new Error('Cannot delete quiz question'));
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      const examItem = await screen.findByText('اختبار الوحدة الأولى');
      fireEvent.click(examItem);

      await screen.findByText(/هل التغير المناخي يؤثر على الجهاز التنفسي؟/i);
      const deleteQBtn = document.querySelector('.cb-q-del-btn');
      fireEvent.click(deleteQBtn);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Failed to remove question: Cannot delete quiz question'));
      });
    });

    it('renders checking permissions screen when authLoading is true', () => {
      mockUseAuth.mockReturnValueOnce({
        user: null,
        hasPermission: () => false,
        authLoading: true
      });
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);
      expect(screen.getByText('جاري التحقق من الصلاحيات...')).toBeInTheDocument();
    });

    it('handles loadLessonQuiz error gracefully when adminFetchFullQuiz rejects', async () => {
      adminLmsService.adminFetchFullQuiz.mockRejectedValueOnce(new Error('Quiz network failure'));
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      const examItem = await screen.findByText('اختبار الوحدة الأولى');
      fireEvent.click(examItem);

      // Quiz modal opens and does not throw uncaught error
      expect(await screen.findByText('منشئ الأسئلة')).toBeInTheDocument();
    });

    it('populates and changes all course form fields and selects', async () => {
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const newCourseBtn = await screen.findByText('+ مساق جديد');
      fireEvent.click(newCourseBtn);

      const form = document.querySelector('form.cb-form');
      const textareas = form.querySelectorAll('textarea');
      fireEvent.input(textareas[0], { target: { value: 'وصف تفصيلي بالعربية' } });
      fireEvent.input(textareas[1], { target: { value: 'Detailed English description' } });

      const textInputs = form.querySelectorAll('input[type="text"]');
      // Category input
      fireEvent.input(textInputs[2], { target: { value: 'الصحة العامة' } });
      // Duration input
      fireEvent.input(textInputs[3], { target: { value: '12 hours' } });
      // Cover image input
      fireEvent.input(textInputs[4], { target: { value: 'https://images.climamedix.org/cover.webp' } });

      const selects = form.querySelectorAll('select');
      fireEvent.change(selects[0], { target: { value: 'view:all_courses' } });
      fireEvent.change(selects[1], { target: { value: 'view:free_content' } });

      fireEvent.submit(form);

      await waitFor(() => {
        expect(adminLmsService.adminCreateCourse).toHaveBeenCalledWith(
          expect.objectContaining({
            description_ar: 'وصف تفصيلي بالعربية',
            description_en: 'Detailed English description',
            category: 'الصحة العامة',
            duration: '12 hours',
            cover_image: 'https://images.climamedix.org/cover.webp',
            full_access_permission_key: 'view:all_courses',
            teaser_permission_key: 'view:free_content'
          })
        );
      });
    });

    it('updates sequence_order in module form', async () => {
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      const addModuleBtn = await screen.findByText('+ وحدة جديدة');
      fireEvent.click(addModuleBtn);

      const form = document.querySelector('form.cb-form');
      const numInput = form.querySelector('input[type="number"]');
      fireEvent.input(numInput, { target: { value: '5' } });

      const textInputs = form.querySelectorAll('input[type="text"]');
      fireEvent.input(textInputs[0], { target: { value: 'الوحدة الخامسة' } });
      fireEvent.input(textInputs[1], { target: { value: 'Module 5' } });

      fireEvent.submit(form);

      await waitFor(() => {
        expect(adminLmsService.adminCreateModule).toHaveBeenCalledWith(
          expect.objectContaining({
            sequence_order: 5
          })
        );
      });
    });

    it('interacts with all lesson form fields (RichTextEditor, duration, sequence order, EN tab)', async () => {
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      await screen.findByText('الوحدة الأولى: الأساسيات');
      const addLessonBtn = screen.getByTitle('Add Lesson');
      fireEvent.click(addLessonBtn);

      // AR title
      const form = document.querySelector('form.cb-form');
      const titleArInput = form.querySelector('input[type="text"]');
      fireEvent.input(titleArInput, { target: { value: 'درس شامل' } });

      // AR rich text
      const richEditorTextarea = screen.getByPlaceholderText('ابدأ بكتابة الدرس أو إدراج وسائط...');
      fireEvent.input(richEditorTextarea, { target: { value: 'محتوى الدرس العربي' } });

      // Duration & Sequence
      const numInputs = form.querySelectorAll('input[type="number"]');
      fireEvent.input(numInputs[0], { target: { value: '45' } });
      fireEvent.input(numInputs[1], { target: { value: '3' } });

      // Switch to EN tab and fill
      const enTabBtn = screen.getByText('English (EN)');
      fireEvent.click(enTabBtn);

      const titleEnInput = form.querySelector('input[type="text"]');
      fireEvent.input(titleEnInput, { target: { value: 'Comprehensive Lesson' } });

      const richEditorEnTextarea = screen.getByPlaceholderText('Start writing the lesson or insert media...');
      fireEvent.input(richEditorEnTextarea, { target: { value: 'English Content Body' } });

      const saveBtn = screen.getByText('حفظ الدرس');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(adminLmsService.adminCreateLesson).toHaveBeenCalledWith(
          expect.objectContaining({
            title_ar: 'درس شامل',
            title_en: 'Comprehensive Lesson',
            content_ar: 'محتوى الدرس العربي',
            content_en: 'English Content Body',
            duration: '45',
            sequence_order: 3
          })
        );
      });
    });

    it('interacts with quiz points and option EN inputs', async () => {
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      const examItem = await screen.findByText('اختبار الوحدة الأولى');
      fireEvent.click(examItem);

      const qArInput = await screen.findByPlaceholderText('Question Text (AR)');
      const qEnInput = screen.getByPlaceholderText('Question Text (EN)');
      fireEvent.input(qArInput, { target: { value: 'سؤال متعدد اللغات' } });
      fireEvent.input(qEnInput, { target: { value: 'Multilingual question' } });

      // Points input
      const pointsInput = screen.getByDisplayValue('10');
      fireEvent.input(pointsInput, { target: { value: '25' } });

      // Option 1 inputs
      const opt1Ar = screen.getByPlaceholderText('Option 1 (AR)');
      const opt1En = screen.getByPlaceholderText('Option 1 (EN)');
      fireEvent.input(opt1Ar, { target: { value: 'الخيار 1' } });
      fireEvent.input(opt1En, { target: { value: 'Option 1 EN' } });

      const checkboxes = document.querySelectorAll('.cb-option-input-row input[type="checkbox"]');
      fireEvent.click(checkboxes[0]);

      const addQBtn = screen.getByText('إضافة السؤال للاختبار');
      fireEvent.click(addQBtn);

      await waitFor(() => {
        expect(adminLmsService.adminCreateQuestion).toHaveBeenCalledWith(
          expect.objectContaining({
            points: 25,
            question_text_ar: 'سؤال متعدد اللغات',
            question_text_en: 'Multilingual question'
          })
        );
      });
    });

    it('fires drag and drop events on module and lesson elements in UI', async () => {
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const courseItem = await screen.findByText('دورة تغير المناخ والصحة');
      fireEvent.click(courseItem);

      await screen.findByText('الوحدة الأولى: الأساسيات');

      // Module drag events
      const moduleHeader = document.querySelector('.cb-module-header');
      const moduleSection = document.querySelector('.cb-module-section');
      
      fireEvent.dragStart(moduleHeader, {
        dataTransfer: { setData: vi.fn(), effectAllowed: '' }
      });
      fireEvent.dragOver(moduleSection, {
        preventDefault: vi.fn(),
        dataTransfer: { dropEffect: '' }
      });
      fireEvent.drop(moduleSection, {
        preventDefault: vi.fn(),
        clientY: 100,
        currentTarget: { getBoundingClientRect: () => ({ top: 50, height: 100 }) }
      });

      // Module actions click & dragStart stopPropagation
      const moduleActions = document.querySelector('.cb-module-actions');
      fireEvent.click(moduleActions);
      fireEvent.dragStart(moduleActions);

      // Lesson drag events
      const lessonItem = document.querySelector('.cb-lesson-item');
      const lessonsList = document.querySelector('.cb-lessons-list');

      fireEvent.dragStart(lessonItem, {
        dataTransfer: { setData: vi.fn(), effectAllowed: '' }
      });
      fireEvent.dragOver(lessonsList, {
        preventDefault: vi.fn(),
        dataTransfer: { dropEffect: '' }
      });
      fireEvent.dragOver(lessonItem, {
        preventDefault: vi.fn(),
        dataTransfer: { dropEffect: '' }
      });
      fireEvent.drop(lessonItem, {
        preventDefault: vi.fn(),
        clientY: 80,
        currentTarget: { getBoundingClientRect: () => ({ top: 50, height: 60 }) }
      });
      fireEvent.drop(lessonsList, {
        preventDefault: vi.fn()
      });

      // Lesson meta click & dragStart stopPropagation
      const lessonMeta = document.querySelector('.cb-lesson-meta');
      fireEvent.click(lessonMeta);
      fireEvent.dragStart(lessonMeta);
    });

    it('falls back to default permissions when supabase permissions table returns empty array', async () => {
      mockSupabaseOrder.mockResolvedValueOnce({ data: [], error: null });
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const newCourseBtn = await screen.findByText('+ مساق جديد');
      fireEvent.click(newCourseBtn);

      expect(screen.getAllByText('view:all_courses').length).toBeGreaterThan(0);
    });

    it('falls back to default permissions when supabase permissions query throws error', async () => {
      mockSupabaseOrder.mockResolvedValueOnce({ data: null, error: new Error('Permissions query failed') });
      render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

      const newCourseBtn = await screen.findByText('+ مساق جديد');
      fireEvent.click(newCourseBtn);

      expect(screen.getAllByText('view:all_courses').length).toBeGreaterThan(0);
    });

    it('converts non-webp images (PNG) via canvas to WebP in convertToWebP', async () => {
      const originalImage = globalThis.Image;
      const originalCreateObjectURL = URL.createObjectURL;
      const originalRevokeObjectURL = URL.revokeObjectURL;

      URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/dummy');
      URL.revokeObjectURL = vi.fn();

      class MockImage {
        constructor() {
          this.onload = null;
          this.onerror = null;
          this.width = 120;
          this.height = 120;
        }
        set src(val) {
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      }
      globalThis.Image = MockImage;

      const origGetContext = HTMLCanvasElement.prototype.getContext;
      const origToBlob = HTMLCanvasElement.prototype.toBlob;
      HTMLCanvasElement.prototype.getContext = () => ({
        drawImage: vi.fn()
      });
      HTMLCanvasElement.prototype.toBlob = function(callback) {
        callback(new Blob(['webp-bits'], { type: 'image/webp' }));
      };

      try {
        uploadFileToR2.mockResolvedValueOnce('https://r2.climamedix.org/converted.webp');
        render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

        const newCourseBtn = await screen.findByText('+ مساق جديد');
        fireEvent.click(newCourseBtn);

        const fileInput = document.querySelector('input[type="file"][accept*="image"]');
        const pngFile = new File(['png-bits'], 'graphic.png', { type: 'image/png' });
        fireEvent.change(fileInput, { target: { files: [pngFile] } });

        await waitFor(() => {
          expect(uploadFileToR2).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'image/webp' }),
            'course_covers'
          );
        });
      } finally {
        globalThis.Image = originalImage;
        URL.createObjectURL = originalCreateObjectURL;
        URL.revokeObjectURL = originalRevokeObjectURL;
        HTMLCanvasElement.prototype.getContext = origGetContext;
        HTMLCanvasElement.prototype.toBlob = origToBlob;
      }
    });

    it('handles image loading error in convertToWebP', async () => {
      const originalImage = globalThis.Image;
      const originalCreateObjectURL = URL.createObjectURL;
      const originalRevokeObjectURL = URL.revokeObjectURL;

      URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/dummy-err');
      URL.revokeObjectURL = vi.fn();

      class FailingImage {
        constructor() {
          this.onload = null;
          this.onerror = null;
        }
        set src(val) {
          setTimeout(() => {
            if (this.onerror) this.onerror(new Error('Corrupted image'));
          }, 0);
        }
      }
      globalThis.Image = FailingImage;

      try {
        render(<CourseBuilderPage lang="ar" onNavigate={vi.fn()} />);

        const newCourseBtn = await screen.findByText('+ مساق جديد');
        fireEvent.click(newCourseBtn);

        const fileInput = document.querySelector('input[type="file"][accept*="image"]');
        const corruptedFile = new File(['corrupt'], 'corrupt.jpg', { type: 'image/jpeg' });
        fireEvent.change(fileInput, { target: { files: [corruptedFile] } });

        await waitFor(() => {
          expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Failed to upload cover image'));
        });
      } finally {
        globalThis.Image = originalImage;
        URL.createObjectURL = originalCreateObjectURL;
        URL.revokeObjectURL = originalRevokeObjectURL;
      }
    });
  });
});
