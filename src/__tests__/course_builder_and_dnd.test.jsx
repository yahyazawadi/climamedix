import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { renderHook, act } from '@testing-library/preact';
import { CourseBuilderPage } from '../features/learning-hub/components/admin/CourseBuilderPage';
import { useLmsDragDrop } from '../features/learning-hub/hooks/useLmsDragDrop';
import * as adminLmsService from '../features/learning-hub/services/adminLmsService';

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
vi.mock('../utils/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: [{ perm_key: 'view:all_courses' }, { perm_key: 'view:free_content' }], error: null })
      })
    })
  }
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
  });
});
