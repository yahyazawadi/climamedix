import { useState, useEffect, useRef } from 'preact/hooks';
import { Button } from '../../../shared/components/Button';
import { 
  getAssignmentForLesson, 
  getUserSubmission, 
  submitStudentAssignment, 
  uploadAssignmentFileToR2 
} from '../../services/assignmentService';
import './AssignmentWidget.css';

/**
 * AssignmentWidget (SOLID: Interface Segregation & Single Responsibility)
 * 
 * Clean, professional, emoji-free user interface supporting:
 * - Direct upload to Cloudflare R2 with progress tracking
 * - Alternative solution link (Google Drive / GitHub)
 * - Deadline notices (October 25)
 */
export function AssignmentWidget({ lesson, courseId, userId, userProfile, lang = 'ar' }) {
  const isArabic = lang === 'ar';
  const lessonId = lesson?.id || 'live_session_1';
  const fileInputRef = useRef(null);

  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [solutionUrl, setSolutionUrl] = useState('');
  const [notes, setNotes] = useState('');
  
  // File upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
          if (sub.file_url) {
            setUploadedFileUrl(sub.file_url);
            setUploadedFileName(sub.file_name || 'Attached_Assignment_File');
          }
        }
      }
    }
    loadData();
    return () => { mounted = false; };
  }, [lessonId, userId, courseId]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setErrorMessage(isArabic ? 'حجم الملف يتجاوز الحد المسموح به (50 ميغابايت).' : 'File size exceeds 50MB limit.');
        return;
      }
      setSelectedFile(file);
      setErrorMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedFile && !uploadedFileUrl && !solutionUrl.trim()) {
      setErrorMessage(isArabic ? 'يرجى رفع ملف الحل أو إدخال رابط المستند.' : 'Please upload a solution file or provide a link.');
      return;
    }

    setSubmitting(true);
    try {
      let finalFileUrl = uploadedFileUrl;
      let finalFileName = uploadedFileName;

      // If user selected a new file, upload it to Cloudflare R2
      if (selectedFile) {
        setUploadProgress(0);
        finalFileUrl = await uploadAssignmentFileToR2(
          selectedFile, 
          `assignments/${courseId || 'general'}`,
          (progress) => setUploadProgress(progress)
        );
        finalFileName = selectedFile.name;
        setUploadedFileUrl(finalFileUrl);
        setUploadedFileName(finalFileName);
        setSelectedFile(null);
        setUploadProgress(null);
      }

      const res = await submitStudentAssignment({
        userId,
        userEmail: userProfile?.email,
        userName: userProfile?.full_name || userProfile?.name,
        lessonId,
        courseId,
        fileUrl: finalFileUrl,
        fileName: finalFileName,
        solutionUrl,
        notes
      });

      setSubmission(res);
      setSuccessMessage(isArabic ? 'تم حفظ وتسليم الواجب بنجاح.' : 'Assignment submitted successfully.');
      setTimeout(() => setSuccessMessage(''), 4500);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || (isArabic ? 'حدث خطأ أثناء رفع الملف أو التسليم.' : 'Error uploading file or submitting.'));
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
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
          <span>
            {isArabic ? 'الموعد النهائي للتسليم وإغلاق المساق: 25 من الشهر الجاري' : 'Course & Submission Cutoff: Oct 25'}
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
            <div className="cma-status-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="cma-status-title">
                {isArabic ? 'تم تسليم الواجب بنجاح' : 'Assignment Submitted'}
              </p>
              <p className="cma-status-subtitle">
                {isArabic 
                  ? `تاريخ التسليم: ${new Date(submission.submitted_at).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')} - يمكنك التعديل قبل الموعد النهائي في 25 الشهر.`
                  : `Submitted on: ${new Date(submission.submitted_at).toLocaleDateString()} - You can modify before the cutoff date on Oct 25.`}
              </p>
              {submission.file_url && (
                <a 
                  href={submission.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="cma-submission-link"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {submission.file_name || (isArabic ? 'عرض الملف المرفق في السحابة' : 'View Uploaded Cloud File')}
                </a>
              )}
            </div>
          </div>
        )}

        {errorMessage && (
          <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', marginBottom: '16px' }}>
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div style={{ padding: '10px 14px', background: '#dcfce7', color: '#15803d', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', marginBottom: '16px' }}>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Direct File Upload to Cloudflare R2 */}
          <div className="cma-form-group">
            <label className="cma-form-label">
              {isArabic ? 'رفع ملف الواجب (Cloudflare Storage):' : 'Upload Assignment File (Cloudflare Storage):'}
            </label>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.rar,.png,.jpg,.jpeg"
            />

            <div 
              className="cma-upload-zone"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="cma-upload-icon-container">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <div className="cma-upload-text">
                {selectedFile 
                  ? selectedFile.name 
                  : (isArabic ? 'اضغط لاختيار ملف من جهازك' : 'Click to select a file from your device')}
              </div>
              <div className="cma-upload-hint">
                {isArabic ? 'صيغ مدعومة: PDF, Word, PowerPoint, ZIP (حتى 50 ميغابايت)' : 'Supported formats: PDF, Word, PowerPoint, ZIP (Up to 50MB)'}
              </div>
            </div>

            {selectedFile && (
              <div className="cma-file-selected-box">
                <span style={{ fontSize: '12.5px', color: '#0b2849', fontWeight: '600' }}>
                  {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
                <button 
                  type="button" 
                  onClick={() => setSelectedFile(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '13px' }}
                >
                  {isArabic ? 'إلغاء' : 'Remove'}
                </button>
              </div>
            )}

            {uploadProgress !== null && (
              <div className="cma-progress-track">
                <div className="cma-progress-bar" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
          </div>

          {/* Alternative Link */}
          <div className="cma-form-group">
            <label className="cma-form-label">
              {isArabic ? 'أو رابط بديل (Google Drive / GitHub / Link):' : 'Or Alternative Link (Google Drive / GitHub / Link):'}
            </label>
            <input 
              type="url" 
              className="cma-input" 
              placeholder="https://..."
              value={solutionUrl}
              onInput={(e) => setSolutionUrl(e.target.value)}
            />
          </div>

          <div className="cma-form-group">
            <label className="cma-form-label">
              {isArabic ? 'ملاحظات إضافية (اختياري):' : 'Additional Notes (Optional):'}
            </label>
            <textarea 
              rows={3} 
              className="cma-textarea" 
              placeholder={isArabic ? 'أضف أي تفاصيل أو ملاحظات للمدرب هنا...' : 'Add any comments for the instructor here...'}
              value={notes}
              onInput={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: isArabic ? 'flex-start' : 'flex-end', gap: '10px' }}>
            <Button 
              type="submit" 
              variant="gradient" 
              disabled={submitting}
              style={{ padding: '9px 26px', fontSize: '13.5px' }}
            >
              {submitting 
                ? (isArabic ? 'جاري رفع الملف والتسليم...' : 'Uploading & Submitting...') 
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
