import { useState, useEffect } from 'preact/hooks';
import { Button } from '../../../shared/components/Button';
import { getAssignmentForLesson, getUserSubmission, submitStudentAssignment } from '../../services/assignmentService';
import './AssignmentWidget.css';

/**
 * AssignmentWidget (SOLID: Interface Segregation & Single Responsibility)
 * 
 * Handles rendering the assignment details, October 25 countdown/status,
 * and user submission form.
 */
export function AssignmentWidget({ lesson, courseId, userId, userProfile, lang = 'ar' }) {
  const isArabic = lang === 'ar';
  const lessonId = lesson?.id || 'live_session_1';

  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [solutionUrl, setSolutionUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Load assignment definition and previous submission
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      const assign = await getAssignmentForLesson(lessonId, courseId);
      const sub = await getUserSubmission(userId, lessonId);
      if (mounted) {
        setAssignment(assign);
        if (sub) {
          setSubmission(sub);
          setSolutionUrl(sub.solution_url || '');
          setNotes(sub.notes || '');
        }
      }
    }
    loadData();
    return () => { mounted = false; };
  }, [lessonId, userId, courseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!solutionUrl.trim()) {
      alert(isArabic ? 'يرجى إدخال رابط الحل أو المستند.' : 'Please enter your solution link or document URL.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitStudentAssignment({
        userId,
        userEmail: userProfile?.email,
        userName: userProfile?.full_name || userProfile?.name,
        lessonId,
        courseId,
        solutionUrl,
        notes
      });
      setSubmission(res);
      setSuccessMessage(isArabic ? 'تم حفظ وتسليم الواجب بنجاح!' : 'Assignment submitted successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error(err);
      alert(isArabic ? 'حدث خطأ أثناء التسليم.' : 'An error occurred while submitting.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!assignment) return null;

  return (
    <div className="cma-widget-wrapper" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="cma-widget-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="cma-badge-live">
            <span className="cma-badge-dot" />
            {isArabic ? 'جلسة تفاعلية مباشرة' : 'Live Interactive Session'}
          </span>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0b2849' }}>
            {isArabic ? 'واجب الجلسة' : 'Session Assignment'}
          </span>
        </div>

        <div className="cma-deadline-alert">
          <span>⏰</span>
          <span>
            {isArabic ? 'الموعد النهائي للتسليم وإغلاق الكورس: 25 الشهر' : 'Submission & Course Closes: Oct 25'}
          </span>
        </div>
      </div>

      <div className="cma-widget-body">
        <h4 className="cma-title">
          {isArabic ? assignment.title_ar : assignment.title_en}
        </h4>
        <div className="cma-instructions">
          {isArabic ? assignment.instructions_ar : assignment.instructions_en}
        </div>

        {submission && (
          <div className="cma-status-box">
            <span style={{ fontSize: '20px' }}>✓</span>
            <div>
              <p className="cma-status-title">
                {isArabic ? 'تم تسليم الواجب بنجاح' : 'Assignment Submitted'}
              </p>
              <p className="cma-status-subtitle">
                {isArabic 
                  ? `تاريخ التسليم: ${new Date(submission.submitted_at).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')} - يمكنك تحديث الرابط في أي وقت قبل 25 الشهر`
                  : `Submitted on: ${new Date(submission.submitted_at).toLocaleDateString()} - You can update before Oct 25`}
              </p>
            </div>
          </div>
        )}

        {successMessage && (
          <div style={{ padding: '10px 14px', background: '#dcfce7', color: '#15803d', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', marginBottom: '16px' }}>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="cma-form-group">
            <label className="cma-form-label">
              {isArabic ? 'رابط الحل (Google Drive / Github / Link):' : 'Solution URL (Google Drive / GitHub / Link):'}
            </label>
            <input 
              type="url" 
              className="cma-input" 
              placeholder="https://..."
              value={solutionUrl}
              onInput={(e) => setSolutionUrl(e.target.value)}
              required
            />
          </div>

          <div className="cma-form-group">
            <label className="cma-form-label">
              {isArabic ? 'ملاحظات إضافية أو ملخص الإجابة (اختياري):' : 'Additional notes or summary (Optional):'}
            </label>
            <textarea 
              rows={3} 
              className="cma-textarea" 
              placeholder={isArabic ? 'أضف أي تفاصيل أو ملاحظات للمدرب هنا...' : 'Add any comments for the instructor...'}
              value={notes}
              onInput={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: isArabic ? 'flex-start' : 'flex-end', gap: '10px' }}>
            <Button 
              type="submit" 
              variant="gradient" 
              disabled={submitting}
              style={{ padding: '8px 24px', fontSize: '13.5px' }}
            >
              {submitting 
                ? (isArabic ? 'جاري الحفظ...' : 'Saving...') 
                : (submission 
                    ? (isArabic ? 'تحديث التسليم' : 'Update Submission') 
                    : (isArabic ? 'تسليم الواجب الآن' : 'Submit Assignment'))}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
