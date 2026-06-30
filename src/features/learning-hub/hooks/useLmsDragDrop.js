import { useState } from 'preact/hooks';
import { adminUpdateModule, adminUpdateLesson, adminFetchModules } from '../services/adminLmsService';

export function useLmsDragDrop({ modules, setModules, selectedCourse }) {
  const [draggedLessonId, setDraggedLessonId] = useState(null);
  const [draggedLessonSourceModId, setDraggedLessonSourceModId] = useState(null);
  const [draggedModuleId, setDraggedModuleId] = useState(null);

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

    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const isAfter = relativeY > (rect.height / 2);

    let updatedModules = JSON.parse(JSON.stringify(modules));

    const srcModIdx = updatedModules.findIndex(m => m.id === draggedLessonSourceModId);
    updatedModules[srcModIdx].lessons = updatedModules[srcModIdx].lessons.filter(l => l.id !== draggedLessonId);

    const targetModIdx = updatedModules.findIndex(m => m.id === targetModuleId);
    const targetLessonIdx = updatedModules[targetModIdx].lessons.findIndex(l => l.id === targetLessonId);

    const insertIdx = isAfter ? targetLessonIdx + 1 : targetLessonIdx;

    updatedModules[targetModIdx].lessons.splice(insertIdx, 0, {
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

    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const isAfter = relativeY > (rect.height / 2);

    let updatedModules = JSON.parse(JSON.stringify(modules));
    updatedModules = updatedModules.filter(m => m.id !== draggedModuleId);

    const targetIdx = updatedModules.findIndex(m => m.id === targetModuleId);
    const insertIdx = isAfter ? targetIdx + 1 : targetIdx;

    updatedModules.splice(insertIdx, 0, draggedModule);

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

  return {
    draggedLessonId,
    draggedLessonSourceModId,
    draggedModuleId,
    handleLessonDragStart,
    handleLessonDragOver,
    handleLessonDrop,
    handleLessonListDrop,
    handleModuleDragStart,
    handleModuleDragOver,
    handleModuleDrop
  };
}
