import { useState, useEffect } from 'preact/hooks';
import { supabase } from '../../../utils/supabaseClient';
import { uploadFileToR2 } from '../../../utils/s3Client';
import { GlassCard } from '../../shared/components/GlassCard';
import { Button } from '../../shared/components/Button';
import { useAuth } from '../../auth/hooks/useAuth';
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
  adminDeleteQuestion,
  uploadVideoToR2
} from '../services/adminLmsService';
import './CourseBuilderPage.css';

const convertToWebP = (file) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/') || file.type === 'image/webp') {
      resolve(file); // Don't convert if it's already webp or not an image
      return;
    }
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(objectUrl);
        const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: "image/webp" });
        resolve(webpFile);
      }, "image/webp", 0.85);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(objectUrl);
      reject(e);
    };
    img.src = objectUrl;
  });
};

export function CourseBuilderPage({ lang = 'ar', onNavigate }) {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('manage:any_course');

  // List of courses
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Selected entities for editing/building
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(false);

  // Modal / Form state for Course
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null); // null = new course
  const [courseForm, setCourseForm] = useState({
    title_ar: '',
    title_en: '',
    description_ar: '',
    description_en: '',
    category: 'Climate & Health',
    cover_image: '',
    duration: '',
    full_access_permission_key: 'view:all_courses',
    teaser_permission_key: 'view:free_content'
  });

  // Modal / Form state for Module
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [moduleForm, setModuleForm] = useState({
    title_ar: '',
    title_en: '',
    sequence_order: 1
  });

  // Modal / Form state for Lesson
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonModuleId, setLessonModuleId] = useState(null);
  const [lessonForm, setLessonForm] = useState({
    title_ar: '',
    title_en: '',
    content_ar: '',
    content_en: '',
    video_url: '',
    sequence_order: 1
  });

  // R2 Video Upload State
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);

  // Quiz Builder State (attached to active editing lesson or loaded on demand)
  const [quiz, setQuiz] = useState(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [newQuestionTextAr, setNewQuestionTextAr] = useState('');
  const [newQuestionTextEn, setNewQuestionTextEn] = useState('');
  const [newQuestionPoints, setNewQuestionPoints] = useState(10);
  const [newOptions, setNewOptions] = useState([
    { textAr: '', textEn: '', isCorrect: false },
    { textAr: '', textEn: '', isCorrect: false },
    { textAr: '', textEn: '', isCorrect: false },
    { textAr: '', textEn: '', isCorrect: false }
  ]);

  // ─── Drag & Drop State ───
  const [draggedLessonId, setDraggedLessonId] = useState(null);
  const [draggedLessonSourceModId, setDraggedLessonSourceModId] = useState(null);
  const [draggedModuleId, setDraggedModuleId] = useState(null);

  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    if (canManage) {
      loadCourses();
      loadPermissions();
    }
  }, [canManage]);

  async function loadPermissions() {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('perm_key')
        .order('perm_key', { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) {
        setPermissions(data.map(p => p.perm_key));
      } else {
        setPermissions([
          'view:all_courses',
          'view:free_content',
          'view:public_content',
          'apply:specialized_roles'
        ]);
      }
    } catch (err) {
      console.error(err);
      setPermissions([
        'view:all_courses',
        'view:free_content',
        'view:public_content',
        'apply:specialized_roles'
      ]);
    }
  }

  async function loadCourses() {
    setLoadingCourses(true);
    try {
      const data = await adminFetchAllCourses();
      setCourses(data || []);
    } catch (err) {
      console.error(err);
      alert('Error fetching courses');
    } finally {
      setLoadingCourses(false);
    }
  }

  async function handleSelectCourse(course) {
    setSelectedCourse(course);
    setLoadingModules(true);
    try {
      const data = await adminFetchModules(course.id);
      setModules(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingModules(false);
    }
  }

  // ─── Course Save/Edit ───
  async function saveCourse(e) {
    e.preventDefault();
    try {
      if (editingCourse) {
        await adminUpdateCourse(editingCourse.id, courseForm);
      } else {
        await adminCreateCourse(courseForm);
      }
      setShowCourseModal(false);
      loadCourses();
      setSelectedCourse(null);
      setModules([]);
    } catch (err) {
      console.error(err);
      alert('Failed to save course');
    }
  }

  async function deleteCourse(id) {
    if (!confirm('Are you sure you want to delete this course and all associated modules/lessons/quizzes?')) return;
    try {
      await adminDeleteCourse(id);
      loadCourses();
      if (selectedCourse?.id === id) {
        setSelectedCourse(null);
        setModules([]);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete course');
    }
  }

  function handleEditCourse(course) {
    setEditingCourse(course);
    setCourseForm({
      title_ar: course.title_ar,
      title_en: course.title_en || '',
      description_ar: course.description_ar || '',
      description_en: course.description_en || '',
      category: course.category || 'Climate & Health',
      cover_image: course.cover_image || '',
      duration: course.duration || '',
      full_access_permission_key: course.full_access_permission_key || 'view:all_courses',
      teaser_permission_key: course.teaser_permission_key || 'view:free_content'
    });
    setShowCourseModal(true);
  }

  // ─── Drag & Drop Handlers ───
  function handleLessonDragStart(e, lessonId, moduleId) {
    setDraggedLessonId(lessonId);
    setDraggedLessonSourceModId(moduleId);
    setDraggedModuleId(null);
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'lesson', lessonId, moduleId }));
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleLessonDragOver(e) {
    if (draggedLessonId) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  }

  async function handleLessonDrop(e, targetLessonId, targetModuleId) {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedLessonId) return;

    const sourceModule = modules.find(m => m.id === draggedLessonSourceModId);
    if (!sourceModule) return;
    const draggedLesson = sourceModule.lessons.find(l => l.id === draggedLessonId);
    if (!draggedLesson) return;

    let updatedModules = JSON.parse(JSON.stringify(modules));

    const srcModIdx = updatedModules.findIndex(m => m.id === draggedLessonSourceModId);
    updatedModules[srcModIdx].lessons = updatedModules[srcModIdx].lessons.filter(l => l.id !== draggedLessonId);

    const targetModIdx = updatedModules.findIndex(m => m.id === targetModuleId);
    const targetLessonIdx = updatedModules[targetModIdx].lessons.findIndex(l => l.id === targetLessonId);

    updatedModules[targetModIdx].lessons.splice(targetLessonIdx, 0, {
      ...draggedLesson,
      module_id: targetModuleId
    });

    const updatePromises = [];

    updatedModules[targetModIdx].lessons = updatedModules[targetModIdx].lessons.map((les, idx) => {
      const newOrder = idx + 1;
      if (les.sequence_order !== newOrder || les.module_id !== targetModuleId || les.id === draggedLessonId) {
        updatePromises.push(
          adminUpdateLesson(les.id, { sequence_order: newOrder, module_id: targetModuleId })
        );
      }
      return { ...les, sequence_order: newOrder, module_id: targetModuleId };
    });

    if (targetModuleId !== draggedLessonSourceModId) {
      updatedModules[srcModIdx].lessons = updatedModules[srcModIdx].lessons.map((les, idx) => {
        const newOrder = idx + 1;
        if (les.sequence_order !== newOrder) {
          updatePromises.push(
            adminUpdateLesson(les.id, { sequence_order: newOrder })
          );
        }
        return { ...les, sequence_order: newOrder };
      });
    }

    setModules(updatedModules);
    setDraggedLessonId(null);
    setDraggedLessonSourceModId(null);

    try {
      await Promise.all(updatePromises);
    } catch (err) {
      console.error('Error saving lesson order:', err);
      const data = await adminFetchModules(selectedCourse.id);
      setModules(data || []);
    }
  }

  async function handleLessonListDrop(e, targetModuleId) {
    e.preventDefault();
    if (!draggedLessonId) return;

    const sourceModule = modules.find(m => m.id === draggedLessonSourceModId);
    if (!sourceModule) return;
    const draggedLesson = sourceModule.lessons.find(l => l.id === draggedLessonId);
    if (!draggedLesson) return;

    const targetModule = modules.find(m => m.id === targetModuleId);
    const isSameMod = targetModuleId === draggedLessonSourceModId;
    if (isSameMod && targetModule.lessons.length <= 1) return;

    let updatedModules = JSON.parse(JSON.stringify(modules));

    const srcModIdx = updatedModules.findIndex(m => m.id === draggedLessonSourceModId);
    updatedModules[srcModIdx].lessons = updatedModules[srcModIdx].lessons.filter(l => l.id !== draggedLessonId);

    const targetModIdx = updatedModules.findIndex(m => m.id === targetModuleId);
    if (updatedModules[targetModIdx].lessons.some(l => l.id === draggedLessonId)) return;

    updatedModules[targetModIdx].lessons.push({
      ...draggedLesson,
      module_id: targetModuleId
    });

    const updatePromises = [];

    updatedModules[targetModIdx].lessons = updatedModules[targetModIdx].lessons.map((les, idx) => {
      const newOrder = idx + 1;
      if (les.sequence_order !== newOrder || les.module_id !== targetModuleId || les.id === draggedLessonId) {
        updatePromises.push(
          adminUpdateLesson(les.id, { sequence_order: newOrder, module_id: targetModuleId })
        );
      }
      return { ...les, sequence_order: newOrder, module_id: targetModuleId };
    });

    if (!isSameMod) {
      updatedModules[srcModIdx].lessons = updatedModules[srcModIdx].lessons.map((les, idx) => {
        const newOrder = idx + 1;
        if (les.sequence_order !== newOrder) {
          updatePromises.push(
            adminUpdateLesson(les.id, { sequence_order: newOrder })
          );
        }
        return { ...les, sequence_order: newOrder };
      });
    }

    setModules(updatedModules);
    setDraggedLessonId(null);
    setDraggedLessonSourceModId(null);

    try {
      await Promise.all(updatePromises);
    } catch (err) {
      console.error('Error saving lesson order:', err);
      const data = await adminFetchModules(selectedCourse.id);
      setModules(data || []);
    }
  }

  function handleModuleDragStart(e, moduleId) {
    setDraggedModuleId(moduleId);
    setDraggedLessonId(null);
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'module', moduleId }));
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleModuleDragOver(e) {
    if (draggedModuleId) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  }

  async function handleModuleDrop(e, targetModuleId) {
    e.preventDefault();
    if (!draggedModuleId || draggedModuleId === targetModuleId) return;

    const draggedModule = modules.find(m => m.id === draggedModuleId);
    if (!draggedModule) return;

    let updatedModules = JSON.parse(JSON.stringify(modules));
    updatedModules = updatedModules.filter(m => m.id !== draggedModuleId);

    const targetIdx = updatedModules.findIndex(m => m.id === targetModuleId);
    updatedModules.splice(targetIdx, 0, draggedModule);

    const updatePromises = [];

    updatedModules = updatedModules.map((mod, idx) => {
      const newOrder = idx + 1;
      if (mod.sequence_order !== newOrder) {
        updatePromises.push(
          adminUpdateModule(mod.id, { sequence_order: newOrder })
        );
      }
      return { ...mod, sequence_order: newOrder };
    });

    setModules(updatedModules);
    setDraggedModuleId(null);

    try {
      await Promise.all(updatePromises);
    } catch (err) {
      console.error('Error saving module order:', err);
      const data = await adminFetchModules(selectedCourse.id);
      setModules(data || []);
    }
  }

  // ─── Module Save/Edit ───
  async function saveModule(e) {
    e.preventDefault();
    try {
      if (editingModule) {
        await adminUpdateModule(editingModule.id, moduleForm);
      } else {
        await adminCreateModule({
          ...moduleForm,
          course_id: selectedCourse.id
        });
      }
      setShowModuleModal(false);
      handleSelectCourse(selectedCourse);
    } catch (err) {
      console.error(err);
      alert('Failed to save module');
    }
  }

  async function deleteModule(id) {
    if (!confirm('Delete module and all lessons?')) return;
    try {
      await adminDeleteModule(id);
      handleSelectCourse(selectedCourse);
    } catch (err) {
      console.error(err);
    }
  }

  // ─── Lesson Save/Edit ───
  async function openLessonModalForNew(modId) {
    setEditingLesson(null);
    setLessonModuleId(modId);
    setLessonForm({
      title_ar: '',
      title_en: '',
      content_ar: '',
      content_en: '',
      video_url: '',
      sequence_order: (modules.find(m => m.id === modId)?.lessons?.length || 0) + 1
    });
    setQuiz(null);
    setShowLessonModal(true);
  }

  async function openLessonModalForEdit(lesson, modId) {
    setEditingLesson(lesson);
    setLessonModuleId(modId);
    setLessonForm({
      title_ar: lesson.title_ar,
      title_en: lesson.title_en || '',
      content_ar: lesson.content_ar || '',
      content_en: lesson.content_en || '',
      video_url: lesson.video_url || '',
      sequence_order: lesson.sequence_order || 1
    });
    setShowLessonModal(true);
    loadLessonQuiz(lesson.id);
  }

  async function loadLessonQuiz(lessonId) {
    setLoadingQuiz(true);
    try {
      const q = await adminFetchFullQuiz(lessonId);
      setQuiz(q);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQuiz(false);
    }
  }

  async function saveLesson(e) {
    e.preventDefault();
    try {
      let savedLesson;
      if (editingLesson) {
        savedLesson = await adminUpdateLesson(editingLesson.id, lessonForm);
      } else {
        savedLesson = await adminCreateLesson({
          ...lessonForm,
          module_id: lessonModuleId
        });
      }
      setShowLessonModal(false);
      handleSelectCourse(selectedCourse);
    } catch (err) {
      console.error(err);
      alert('Failed to save lesson');
    }
  }

  async function deleteLesson(id) {
    if (!confirm('Delete lesson?')) return;
    try {
      await adminDeleteLesson(id);
      handleSelectCourse(selectedCourse);
    } catch (err) {
      console.error(err);
    }
  }

  // ─── Video R2 Upload ───
  async function handleVideoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(0);
    setUploadError('');
    try {
      const videoKey = await uploadVideoToR2(file, (progress) => {
        setUploadProgress(progress);
      });
      setLessonForm(prev => ({ ...prev, video_url: videoKey }));
      setUploadProgress(null);
    } catch (err) {
      console.error(err);
      setUploadError('Failed to upload video to Cloudflare R2.');
      setUploadProgress(null);
    }
  }

  async function handleCoverUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const webpFile = await convertToWebP(file);
      const publicUrl = await uploadFileToR2(webpFile, 'course_covers');
      if (publicUrl) {
        setCourseForm(prev => ({ ...prev, cover_image: publicUrl }));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to upload cover image.');
    } finally {
      setUploadingCover(false);
    }
  }

  // ─── Quiz Actions ───
  async function createQuiz() {
    if (!editingLesson) return;
    try {
      const q = await adminCreateQuiz({
        lesson_id: editingLesson.id,
        course_id: selectedCourse.id,
        title_ar: `اختبار - ${editingLesson.title_ar}`,
        title_en: `Quiz - ${editingLesson.title_en || editingLesson.title_ar}`,
        passing_score: 80
      });
      setQuiz({ ...q, quiz_questions: [] });
    } catch (err) {
      console.error(err);
    }
  }

  async function addQuestionToQuiz() {
    if (!quiz) return;
    if (!newQuestionTextAr.trim()) return;

    // Validate options
    const correctCount = newOptions.filter(o => o.isCorrect).length;
    if (correctCount !== 1) {
      alert('You must select exactly one correct option.');
      return;
    }

    try {
      const q = await adminCreateQuestion({
        quiz_id: quiz.id,
        question_text_ar: newQuestionTextAr,
        question_text_en: newQuestionTextEn,
        points: newQuestionPoints,
        sequence_order: (quiz.quiz_questions?.length || 0) + 1
      });

      const optionsToCreate = newOptions.filter(o => o.textAr.trim()).map((o, idx) => ({
        question_id: q.id,
        option_text_ar: o.textAr,
        option_text_en: o.textEn,
        is_correct: o.isCorrect,
        sequence_order: idx + 1
      }));

      const createdOptions = [];
      for (const opt of optionsToCreate) {
        const created = await adminCreateOption(opt);
        createdOptions.push(created);
      }

      const updatedQuestions = [
        ...(quiz.quiz_questions || []),
        { ...q, quiz_options: createdOptions }
      ];

      setQuiz({ ...quiz, quiz_questions: updatedQuestions });

      // Clear input form
      setNewQuestionTextAr('');
      setNewQuestionTextEn('');
      setNewOptions([
        { textAr: '', textEn: '', isCorrect: false },
        { textAr: '', textEn: '', isCorrect: false },
        { textAr: '', textEn: '', isCorrect: false },
        { textAr: '', textEn: '', isCorrect: false }
      ]);
    } catch (err) {
      console.error(err);
      alert('Failed to add question');
    }
  }

  async function removeQuestion(questionId) {
    if (!confirm('Remove this question?')) return;
    try {
      await adminDeleteQuestion(questionId);
      setQuiz({
        ...quiz,
        quiz_questions: quiz.quiz_questions.filter(q => q.id !== questionId)
      });
    } catch (err) {
      console.error(err);
    }
  }

  if (!canManage) {
    return (
      <div style={{ padding: '120px 20px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <GlassCard style={{ padding: '40px', textAlign: 'center', color: '#0b2849' }}>
          <h2>{lang === 'ar' ? 'غير مصرح بالدخول' : 'Access Denied'}</h2>
          <p>{lang === 'ar' ? 'ليس لديك صلاحيات لإدارة المساقات.' : 'You do not have permissions to manage courses.'}</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className={`course-builder-page ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Header Banner */}
      <div className="cb-banner">
        <div className="cb-banner-container">
          <h1>{lang === 'ar' ? 'منشئ ومنظم المساقات' : 'Course & Curriculum Builder'}</h1>
          <p>{lang === 'ar' ? 'إدارة المناهج، الدروس، الفيديوهات والتقييمات' : 'Manage curriculum, lessons, videos, and quizzes'}</p>
        </div>
      </div>

      <div className="cb-container">
        <div className="cb-layout">
          
          {/* ─── Column 1: Courses list ─── */}
          <GlassCard className="cb-card cb-list-card">
            <div className="cb-card-header">
              <h3>{lang === 'ar' ? 'قائمة المساقات' : 'Courses'}</h3>
              <Button variant="gradient" onClick={() => {
                setEditingCourse(null);
                setCourseForm({
                  title_ar: '',
                  title_en: '',
                  description_ar: '',
                  description_en: '',
                  category: 'Climate & Health',
                  cover_image: '',
                  duration: '',
                  full_access_permission_key: 'view:all_courses',
                  teaser_permission_key: 'view:free_content'
                });
                setShowCourseModal(true);
              }} style={{ fontSize: '12.5px', padding: '6px 14px' }}>
                + {lang === 'ar' ? 'مساق جديد' : 'New Course'}
              </Button>
            </div>

            {loadingCourses ? (
              <div className="cb-loading">{lang === 'ar' ? 'جاري التحميل...' : 'Loading courses...'}</div>
            ) : courses.length === 0 ? (
              <div className="cb-empty">{lang === 'ar' ? 'لا توجد مساقات' : 'No courses created yet'}</div>
            ) : (
              <div className="cb-list">
                {courses.map(c => (
                  <div 
                    key={c.id} 
                    className={`cb-list-item ${selectedCourse?.id === c.id ? 'active' : ''}`}
                    onClick={() => handleSelectCourse(c)}
                  >
                    <div className="cb-item-info">
                      <strong>{lang === 'ar' ? c.title_ar : (c.title_en || c.title_ar)}</strong>
                      <span>{c.category} • {c.duration || '?'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* ─── Column 2: Modules and Lessons list ─── */}
          <GlassCard className="cb-card cb-curriculum-card">
            {selectedCourse ? (
              <div>
                <div className="cb-card-header">
                  <div>
                    <span className="cb-badge">{selectedCourse.category}</span>
                    <h3 style={{ marginTop: '4px' }}>{lang === 'ar' ? selectedCourse.title_ar : (selectedCourse.title_en || selectedCourse.title_ar)}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <CourseSettingsMenu 
                      lang={lang} 
                      onEdit={() => handleEditCourse(selectedCourse)} 
                      onDelete={() => deleteCourse(selectedCourse.id)} 
                    />
                    <Button variant="outline" onClick={() => {
                      setEditingModule(null);
                      setModuleForm({
                        title_ar: '',
                        title_en: '',
                        sequence_order: modules.length + 1
                      });
                      setShowModuleModal(true);
                    }} style={{ fontSize: '12px', padding: '6px 14px' }}>
                      + {lang === 'ar' ? 'وحدة جديدة' : 'Add Module'}
                    </Button>
                  </div>
                </div>

                {loadingModules ? (
                  <div className="cb-loading">{lang === 'ar' ? 'جاري تحميل المنهج...' : 'Loading syllabus...'}</div>
                ) : modules.length === 0 ? (
                  <div className="cb-empty">{lang === 'ar' ? 'لم يتم إضافة وحدات أو فصول بعد' : 'No modules or sections added yet.'}</div>
                ) : (
                  <div className="cb-modules-list">
                    {modules.map(mod => (
                      <div 
                        key={mod.id} 
                        className={`cb-module-section ${draggedModuleId === mod.id ? 'dragging' : ''}`}
                        draggable={true}
                        onDragStart={(e) => handleModuleDragStart(e, mod.id)}
                        onDragOver={(e) => handleModuleDragOver(e)}
                        onDrop={(e) => handleModuleDrop(e, mod.id)}
                      >
                        <div className="cb-module-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ cursor: 'grab', opacity: 0.5 }}>
                              <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
                              <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
                            </svg>
                            <h4>
                              {lang === 'ar' ? mod.title_ar : (mod.title_en || mod.title_ar)}
                            </h4>
                          </div>
                          <div className="cb-module-actions" draggable={false} onDragStart={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                            <button onClick={() => openLessonModalForNew(mod.id)} title="Add Lesson" style={{ fontSize: '11px' }}>+ {lang === 'ar' ? 'درس' : 'Lesson'}</button>
                            <button onClick={() => {
                              setEditingModule(mod);
                              setModuleForm({
                                title_ar: mod.title_ar,
                                title_en: mod.title_en || '',
                                sequence_order: mod.sequence_order || 1
                              });
                              setShowModuleModal(true);
                            }} title="Edit Module" style={{ fontSize: '11px' }}>{lang === 'ar' ? 'تعديل' : 'Edit'}</button>
                            <button onClick={() => deleteModule(mod.id)} title="Delete Module" style={{ fontSize: '11px', color: '#ff4d4d' }}>{lang === 'ar' ? 'حذف' : 'Delete'}</button>
                          </div>
                        </div>

                        <div 
                          className="cb-lessons-list"
                          onDragOver={(e) => handleLessonDragOver(e)}
                          onDrop={(e) => handleLessonListDrop(e, mod.id)}
                          style={{ minHeight: '40px' }}
                        >
                          {(mod.lessons || []).map(les => (
                            <div 
                              key={les.id} 
                              className={`cb-lesson-item ${draggedLessonId === les.id ? 'dragging' : ''}`}
                              onClick={() => openLessonModalForEdit(les, mod.id)}
                              draggable={true}
                              onDragStart={(e) => handleLessonDragStart(e, les.id, mod.id)}
                              onDragOver={(e) => handleLessonDragOver(e)}
                              onDrop={(e) => handleLessonDrop(e, les.id, mod.id)}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ cursor: 'grab', opacity: 0.4 }}>
                                  <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
                                  <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
                                </svg>
                                <span>{lang === 'ar' ? les.title_ar : (les.title_en || les.title_ar)}</span>
                              </div>
                              <div className="cb-lesson-meta" draggable={false} onDragStart={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                                {les.video_url && <span className="cb-badge video-badge">Video</span>}
                                <button onClick={(e) => { e.stopPropagation(); deleteLesson(les.id); }} className="cb-lesson-del" style={{ color: '#ff4d4d' }}>{lang === 'ar' ? 'حذف' : 'Delete'}</button>
                              </div>
                            </div>
                          ))}
                          {(mod.lessons || []).length === 0 && (
                            <div className="cb-lessons-empty">{lang === 'ar' ? 'لا توجد دروس في هذه الوحدة' : 'No lessons in this module.'}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="cb-unselected-msg">
                <span>{lang === 'ar' ? 'اختر مساقاً من القائمة للبدء بتنظيم المحتوى' : 'Select a course from the list to start building its content'}</span>
              </div>
            )}
          </GlassCard>

        </div>
      </div>

      {/* ─── MODAL: Course Form ─── */}
      {showCourseModal && (
        <div className="cb-modal-overlay">
          <GlassCard className="cb-modal-card">
            <h4>{editingCourse ? (lang === 'ar' ? 'تعديل مساق' : 'Edit Course') : (lang === 'ar' ? 'مساق جديد' : 'New Course')}</h4>
            <form onSubmit={saveCourse} className="cb-form">
              <div className="cb-form-row">
                <div className="cb-form-group">
                  <label>Title (AR)</label>
                  <input type="text" required value={courseForm.title_ar} onInput={e => setCourseForm({...courseForm, title_ar: e.target.value})} />
                </div>
                <div className="cb-form-group">
                  <label>Title (EN)</label>
                  <input type="text" required value={courseForm.title_en} onInput={e => setCourseForm({...courseForm, title_en: e.target.value})} />
                </div>
              </div>

              <div className="cb-form-group">
                <label>Description (AR)</label>
                <textarea rows={3} value={courseForm.description_ar} onInput={e => setCourseForm({...courseForm, description_ar: e.target.value})} />
              </div>
              <div className="cb-form-group">
                <label>Description (EN)</label>
                <textarea rows={3} value={courseForm.description_en} onInput={e => setCourseForm({...courseForm, description_en: e.target.value})} />
              </div>

              <div className="cb-form-row">
                <div className="cb-form-group">
                  <label>Category</label>
                  <input type="text" value={courseForm.category} onInput={e => setCourseForm({...courseForm, category: e.target.value})} />
                </div>
                <div className="cb-form-group">
                  <label>Duration (e.g. 4 weeks, 10 hours)</label>
                  <input type="text" value={courseForm.duration} onInput={e => setCourseForm({...courseForm, duration: e.target.value})} />
                </div>
              </div>

              <div className="cb-form-group">
                <label>Cover Image URL</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    value={courseForm.cover_image} 
                    onInput={e => setCourseForm({...courseForm, cover_image: e.target.value})} 
                    style={{ flexGrow: 1 }}
                  />
                  <label className="cb-badge" style={{ cursor: 'pointer', padding: '10px 14px', borderRadius: '10px', background: '#004c6d', color: '#ffffff', border: 'none', fontWeight: 'bold', display: 'inline-block', margin: 0 }}>
                    {uploadingCover ? 'Uploading...' : 'Upload Image'}
                    <input type="file" accept="image/*" onChange={handleCoverUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              <div className="cb-form-row">
                <div className="cb-form-group">
                  <label>Full Access Permission Key</label>
                  <select 
                    value={courseForm.full_access_permission_key} 
                    onChange={e => setCourseForm({...courseForm, full_access_permission_key: e.target.value})}
                  >
                    <option value="">Select Permission</option>
                    {permissions.map(perm => (
                      <option key={perm} value={perm}>{perm}</option>
                    ))}
                  </select>
                </div>
                <div className="cb-form-group">
                  <label>Teaser Permission Key</label>
                  <select 
                    value={courseForm.teaser_permission_key} 
                    onChange={e => setCourseForm({...courseForm, teaser_permission_key: e.target.value})}
                  >
                    <option value="">Select Permission</option>
                    {permissions.map(perm => (
                      <option key={perm} value={perm}>{perm}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="cb-form-actions">
                <Button type="button" variant="outline" onClick={() => setShowCourseModal(false)}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
                <Button type="submit" variant="gradient">{lang === 'ar' ? 'حفظ' : 'Save'}</Button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* ─── MODAL: Module Form ─── */}
      {showModuleModal && (
        <div className="cb-modal-overlay">
          <GlassCard className="cb-modal-card">
            <h4>{editingModule ? (lang === 'ar' ? 'تعديل وحدة' : 'Edit Module') : (lang === 'ar' ? 'إضافة وحدة' : 'Add Module')}</h4>
            <form onSubmit={saveModule} className="cb-form">
              <div className="cb-form-group">
                <label>Module Title (AR)</label>
                <input type="text" required value={moduleForm.title_ar} onInput={e => setModuleForm({...moduleForm, title_ar: e.target.value})} />
              </div>
              <div className="cb-form-group">
                <label>Module Title (EN)</label>
                <input type="text" required value={moduleForm.title_en} onInput={e => setModuleForm({...moduleForm, title_en: e.target.value})} />
              </div>
              <div className="cb-form-group">
                <label>Sequence Order</label>
                <input type="number" required value={moduleForm.sequence_order} onInput={e => setModuleForm({...moduleForm, sequence_order: Number(e.target.value)})} />
              </div>

              <div className="cb-form-actions">
                <Button type="button" variant="outline" onClick={() => setShowModuleModal(false)}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
                <Button type="submit" variant="gradient">{lang === 'ar' ? 'حفظ' : 'Save'}</Button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* ─── MODAL: Lesson Form & Quiz Builder ─── */}
      {showLessonModal && (
        <div className="cb-modal-overlay">
          <GlassCard className="cb-modal-card cb-large-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid rgba(11,40,73,0.1)', paddingBottom: '12px' }}>
              <h4>{editingLesson ? (lang === 'ar' ? 'تعديل الدرس ومحتوياته' : 'Edit Lesson & Content') : (lang === 'ar' ? 'درس جديد' : 'New Lesson')}</h4>
              <button onClick={() => setShowLessonModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <div className="cb-lesson-modal-layout">
              {/* Left Column: Lesson Form */}
              <div className="cb-lesson-modal-left">
                <form onSubmit={saveLesson} className="cb-form">
                  <div className="cb-form-row">
                    <div className="cb-form-group">
                      <label>Lesson Title (AR)</label>
                      <input type="text" required value={lessonForm.title_ar} onInput={e => setLessonForm({...lessonForm, title_ar: e.target.value})} />
                    </div>
                    <div className="cb-form-group">
                      <label>Lesson Title (EN)</label>
                      <input type="text" required value={lessonForm.title_en} onInput={e => setLessonForm({...lessonForm, title_en: e.target.value})} />
                    </div>
                  </div>

                  <div className="cb-form-group">
                    <label>Video Key/URL (Cloudflare R2 Key)</label>
                    <input type="text" value={lessonForm.video_url} onInput={e => setLessonForm({...lessonForm, video_url: e.target.value})} placeholder="e.g. videos/my-lecture.webm" />
                    
                    {/* R2 Video Upload Field */}
                    <div className="cb-upload-box">
                      <label className="cb-upload-label">
                        <span>Upload Video to Cloudflare R2</span>
                        <input type="file" accept="video/*" onChange={handleVideoUpload} style={{ display: 'none' }} />
                      </label>
                      {uploadProgress !== null && (
                        <div className="cb-progress-bar">
                          <div className="cb-progress-fill" style={{ width: `${uploadProgress}%` }} />
                          <span className="cb-progress-text">{uploadProgress}% uploaded</span>
                        </div>
                      )}
                      {uploadError && <div className="cb-upload-error">{uploadError}</div>}
                    </div>
                  </div>

                  <div className="cb-form-group">
                    <label>Lesson Content (AR)</label>
                    <textarea rows={6} value={lessonForm.content_ar} onInput={e => setLessonForm({...lessonForm, content_ar: e.target.value})} />
                  </div>
                  <div className="cb-form-group">
                    <label>Lesson Content (EN)</label>
                    <textarea rows={6} value={lessonForm.content_en} onInput={e => setLessonForm({...lessonForm, content_en: e.target.value})} />
                  </div>

                  <div className="cb-form-group">
                    <label>Sequence Order</label>
                    <input type="number" required value={lessonForm.sequence_order} onInput={e => setLessonForm({...lessonForm, sequence_order: Number(e.target.value)})} />
                  </div>

                  <div className="cb-form-actions">
                    <Button type="button" variant="outline" onClick={() => setShowLessonModal(false)}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
                    <Button type="submit" variant="gradient">{lang === 'ar' ? 'حفظ الدرس' : 'Save Lesson'}</Button>
                  </div>
                </form>
              </div>

              {/* Right Column: Quiz Builder */}
              <div className="cb-lesson-modal-right">
                <h5>{lang === 'ar' ? 'منشئ الاختبار الخاص بالدرس' : 'Lesson Quiz Builder'}</h5>
                <hr style={{ border: 'none', borderTop: '1px solid rgba(11,40,73,0.08)', margin: '12px 0' }} />

                {loadingQuiz ? (
                  <div className="cb-loading">{lang === 'ar' ? 'جاري التحميل...' : 'Loading quiz...'}</div>
                ) : !quiz ? (
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <p style={{ fontSize: '13px', color: 'rgba(11,40,73,0.5)', marginBottom: '14px' }}>
                      {lang === 'ar' ? 'لا يوجد اختبار لهذا الدرس.' : 'No quiz created for this lesson yet.'}
                    </p>
                    <Button variant="outline" onClick={createQuiz} disabled={!editingLesson} style={{ fontSize: '12px' }}>
                      {lang === 'ar' ? 'إنشاء اختبار جديد' : 'Create Quiz'}
                    </Button>
                  </div>
                ) : (
                  <div className="cb-quiz-editor">
                    {/* List of existing questions */}
                    <div className="cb-quiz-questions">
                      <h6>{lang === 'ar' ? 'الأسئلة الحالية:' : 'Current Questions:'}</h6>
                      {(quiz.quiz_questions || []).map((q, idx) => (
                        <div key={q.id} className="cb-quiz-q-item">
                          <div>
                            <strong>Q{idx + 1}: {q.question_text_ar}</strong>
                            <div className="cb-quiz-q-options">
                              {(q.quiz_options || []).map(opt => (
                                <span key={opt.id} className={`cb-q-opt-badge ${opt.is_correct ? 'correct' : ''}`}>
                                  {opt.option_text_ar} {opt.is_correct && '✓'}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button onClick={() => removeQuestion(q.id)} className="cb-q-del-btn" style={{ color: '#ff4d4d' }}>{lang === 'ar' ? 'حذف' : 'Delete'}</button>
                        </div>
                      ))}
                      {(quiz.quiz_questions || []).length === 0 && (
                        <p style={{ fontSize: '12px', color: 'rgba(11,40,73,0.4)', margin: '8px 0' }}>
                          {lang === 'ar' ? 'لا توجد أسئلة بعد.' : 'No questions added yet.'}
                        </p>
                      )}
                    </div>

                    {/* Form to add a new question */}
                    <div className="cb-quiz-new-q-form">
                      <h6>{lang === 'ar' ? 'إضافة سؤال جديد' : 'Add Question'}</h6>
                      <div className="cb-form-group" style={{ marginBottom: '8px' }}>
                        <input type="text" placeholder="Question Text (AR)" value={newQuestionTextAr} onInput={e => setNewQuestionTextAr(e.target.value)} style={{ fontSize: '12.5px', padding: '8px' }} />
                      </div>
                      <div className="cb-form-group" style={{ marginBottom: '8px' }}>
                        <input type="text" placeholder="Question Text (EN)" value={newQuestionTextEn} onInput={e => setNewQuestionTextEn(e.target.value)} style={{ fontSize: '12.5px', padding: '8px' }} />
                      </div>
                      <div className="cb-form-group" style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '11px' }}>Points</label>
                        <input type="number" value={newQuestionPoints} onInput={e => setNewQuestionPoints(Number(e.target.value))} style={{ fontSize: '12.5px', padding: '6px' }} />
                      </div>

                      {/* Options */}
                      <label style={{ fontSize: '11px', display: 'block', marginBottom: '6px' }}>Options (Select one correct option):</label>
                      <div className="cb-new-options-list">
                        {newOptions.map((opt, idx) => (
                          <div key={idx} className="cb-option-input-row">
                            <input 
                              type="radio" 
                              name="correctOption" 
                              checked={opt.isCorrect} 
                              onChange={() => {
                                setNewOptions(prev => prev.map((o, i) => ({ ...o, isCorrect: i === idx })));
                              }} 
                            />
                            <input 
                              type="text" 
                              placeholder={`Option ${idx + 1} (AR)`} 
                              value={opt.textAr} 
                              onInput={e => {
                                const val = e.target.value;
                                setNewOptions(prev => prev.map((o, i) => i === idx ? { ...o, textAr: val } : o));
                              }} 
                              style={{ fontSize: '12px', padding: '6px' }}
                            />
                            <input 
                              type="text" 
                              placeholder={`Option ${idx + 1} (EN)`} 
                              value={opt.textEn} 
                              onInput={e => {
                                const val = e.target.value;
                                setNewOptions(prev => prev.map((o, i) => i === idx ? { ...o, textEn: val } : o));
                              }} 
                              style={{ fontSize: '12px', padding: '6px' }}
                            />
                          </div>
                        ))}
                      </div>

                      <Button onClick={addQuestionToQuiz} variant="gradient" style={{ fontSize: '12px', padding: '8px 16px', marginTop: '12px', width: '100%' }}>
                        {lang === 'ar' ? 'إضافة السؤال للاختبار' : 'Add Question'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

function CourseSettingsMenu({ lang, onEdit, onDelete }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleClose = () => setIsOpen(false);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [isOpen]);

  return (
    <div className="cb-settings-menu" style={{ position: 'relative', display: 'inline-block' }} onClick={e => e.stopPropagation()}>
      <Button 
        variant="outline" 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        {lang === 'ar' ? 'خيارات' : 'Options'}
      </Button>
      {isOpen && (
        <div 
          className="cb-settings-dropdown" 
          style={{ 
            position: 'absolute', 
            right: lang === 'ar' ? 'auto' : 0, 
            left: lang === 'ar' ? 0 : 'auto', 
            top: 'calc(100% + 5px)', 
            background: '#ffffff', 
            border: '1px solid rgba(11, 40, 73, 0.1)', 
            borderRadius: '12px', 
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)', 
            zIndex: 10, 
            minWidth: '150px', 
            padding: '6px' 
          }}
        >
          <button 
            type="button"
            onClick={() => { setIsOpen(false); onEdit(); }} 
            style={{ 
              display: 'block', 
              width: '100%', 
              padding: '10px 12px', 
              textAlign: lang === 'ar' ? 'right' : 'left', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              fontSize: '13px', 
              color: '#0b2849', 
              borderRadius: '8px', 
              transition: 'background 0.2s' 
            }}
            onMouseEnter={e => e.target.style.background = 'rgba(11, 40, 73, 0.05)'}
            onMouseLeave={e => e.target.style.background = 'none'}
          >
            {lang === 'ar' ? 'تعديل المساق' : 'Edit Course'}
          </button>
          <button 
            type="button"
            onClick={() => { setIsOpen(false); onDelete(); }} 
            style={{ 
              display: 'block', 
              width: '100%', 
              padding: '10px 12px', 
              textAlign: lang === 'ar' ? 'right' : 'left', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              fontSize: '13px', 
              color: '#ff4d4d', 
              borderRadius: '8px', 
              transition: 'background 0.2s' 
            }}
            onMouseEnter={e => e.target.style.background = 'rgba(255, 77, 77, 0.05)'}
            onMouseLeave={e => e.target.style.background = 'none'}
          >
            {lang === 'ar' ? 'حذف المساق' : 'Delete Course'}
          </button>
        </div>
      )}
    </div>
  );
}
