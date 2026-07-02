import { useState, useRef } from 'preact/hooks';
import { useAuth } from '../../auth/hooks/useAuth';
import { uploadFileToR2 } from '../../../utils/s3Client';
import { supabase } from '../../../utils/supabaseClient';
import './ResearchUploadPage.css';

export function ResearchUploadPage({ lang, onNavigate }) {
  const { user, userProfile, hasPermission } = useAuth();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title_ar: '',
    title_en: '',
    abstract_ar: '',
    abstract_en: '',
    authors: '',
    category: 'research',
    year: new Date().getFullYear().toString(),
    teaser_permission_key: 'view:public_content',
    full_access_permission_key: 'view:free_content',
  });

  const [attachedFile, setAttachedFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isRtl = lang === 'ar';

  const canWrite = userProfile && (
    userProfile.role === 'admin' ||
    userProfile.role === 'superadmin' ||
    userProfile.role === 'researcher' ||
    (hasPermission && hasPermission('write:research'))
  );

  const handleSave = async (e) => {
    e.preventDefault();

    if (!form.title_ar) { setSaveError(isRtl ? 'العنوان مطلوب' : 'Title is required'); return; }
    if (!attachedFile) { setSaveError(isRtl ? 'يجب إرفاق ملف البحث' : 'You must attach a research file'); return; }

    setSaving(true);
    setSaveError('');

    try {
      // 1. Upload to Cloudflare R2
      const fileUrl = await uploadFileToR2(attachedFile, 'research_publications');

      // 2. Save to Supabase 'publications' table
      const payload = {
        ...form,
        pdf_url: fileUrl,
        created_by: user?.id,
      };

      const { error } = await supabase.from('publications').insert([payload]);
      if (error) throw error;

      setSaveSuccess(true);
      setTimeout(() => { 
        setSaveSuccess(false); 
        onNavigate?.('research'); 
      }, 2000);
    } catch (err) {
      setSaveError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!canWrite) {
    return (
      <div className="rup-no-access" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="rup-card">
          <h2>{isRtl ? 'غير مصرح بالوصول' : 'Access Denied'}</h2>
          <p>{isRtl ? 'ليس لديك صلاحية لرفع الأبحاث.' : 'You do not have permission to upload research.'}</p>
          <button className="rup-btn-primary" onClick={() => onNavigate?.('home')}>
            {isRtl ? 'العودة' : 'Back'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }} dir={isRtl ? 'rtl' : 'ltr'}>
      <input 
        type="file" 
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" 
        style={{ display: 'none' }} 
        ref={fileInputRef} 
        onChange={(e) => {
          if (e.target.files?.[0]) setAttachedFile(e.target.files[0]);
          e.target.value = null;
        }} 
      />

      <div style={{
          background: 'linear-gradient(90deg, #15b47a 0%, #12a978 5%, #0c8774 23%, #066d71 41%, #025a6e 60%, #004f6d 79%, #004c6d 100%)',
          padding: '160px 20px 50px 20px',
          textAlign: 'center',
          position: 'relative',
          boxShadow: '0 4px 20px rgba(11, 40, 73, 0.1)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: isRtl ? 'right' : 'left' }}>
          <button className="rup-back-btn" onClick={() => onNavigate?.('research')} style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
            {isRtl ? 'رجوع إلى الأبحاث' : 'Back to Research'}
          </button>
          <h1 style={{ 
            fontSize: 'clamp(28px, 4vw, 40px)', 
            fontWeight: 'bold', 
            color: '#ffffff', 
            margin: 0,
            fontFamily: isRtl ? 'Tajawal, sans-serif' : 'Outfit, sans-serif',
            textShadow: '0 2px 4px rgba(0,0,0,0.15)'
          }}>
            {isRtl ? 'إضافة بحث أو مستند جديد' : 'Upload New Research or Document'}
          </h1>
        </div>
      </div>

      <div className="rup-root" style={{ padding: '40px 24px', paddingTop: '40px' }}>

      <div className="rup-content">
        <div className="rup-form-card">
          <div className="rup-form-group">
            <label>{isRtl ? 'العنوان بالعربية *' : 'Title (Arabic) *'}</label>
            <input 
              value={form.title_ar} 
              onInput={e => setForm({...form, title_ar: e.target.value})} 
              placeholder={isRtl ? 'عنوان البحث...' : 'Research Title...'}
            />
          </div>

          <div className="rup-form-group">
            <label>{isRtl ? 'العنوان بالإنجليزية' : 'Title (English)'}</label>
            <input 
              value={form.title_en} 
              onInput={e => setForm({...form, title_en: e.target.value})} 
              dir="ltr"
            />
          </div>

          <div className="rup-form-group">
            <label>{isRtl ? 'المؤلفون' : 'Authors'}</label>
            <input 
              value={form.authors} 
              onInput={e => setForm({...form, authors: e.target.value})} 
              placeholder={isRtl ? 'أسماء المؤلفين...' : 'Author names...'}
            />
          </div>

          <div className="rup-form-group">
            <label>{isRtl ? 'الملخص (عربي)' : 'Abstract (Arabic)'}</label>
            <textarea 
              value={form.abstract_ar} 
              onInput={e => setForm({...form, abstract_ar: e.target.value})} 
              rows="3"
            />
          </div>

          <div className="rup-form-group">
            <label>{isRtl ? 'الملخص (إنجليزي)' : 'Abstract (English)'}</label>
            <textarea 
              value={form.abstract_en} 
              onInput={e => setForm({...form, abstract_en: e.target.value})} 
              rows="3" 
              dir="ltr"
            />
          </div>

          <div className="rup-row">
            <div className="rup-form-group flex-1">
              <label>{isRtl ? 'التصنيف' : 'Category'}</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option value="climate">{isRtl ? 'مناخ' : 'Climate'}</option>
                <option value="health">{isRtl ? 'صحة' : 'Health'}</option>
                <option value="policy">{isRtl ? 'سياسات' : 'Policy'}</option>
                <option value="research">{isRtl ? 'أبحاث' : 'Research'}</option>
                <option value="all">{isRtl ? 'عام' : 'All'}</option>
              </select>
            </div>
            <div className="rup-form-group flex-1">
              <label>{isRtl ? 'سنة النشر' : 'Year'}</label>
              <input type="number" value={form.year} onInput={e => setForm({...form, year: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="rup-sidebar">
          <div className="rup-card">
            <h3>{isRtl ? 'ملف البحث' : 'Research File'}</h3>
            <div className="rup-dropzone" onClick={() => fileInputRef.current?.click()}>
              {attachedFile ? (
                <div className="rup-file-info">
                  <div className="rup-file-name">{attachedFile.name}</div>
                  <div className="rup-file-size">{(attachedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                  <button className="rup-btn-secondary" onClick={(e) => { e.stopPropagation(); setAttachedFile(null); }}>
                    {isRtl ? 'إزالة' : 'Remove'}
                  </button>
                </div>
              ) : (
                <div className="rup-file-prompt">
                  <p>{isRtl ? 'اضغط لرفع الملف' : 'Click to upload file'}</p>
                  <small>PDF, DOCX, PPTX, XLSX</small>
                </div>
              )}
            </div>
          </div>

          <div className="rup-card">
            <h3>{isRtl ? 'صلاحيات الوصول' : 'Access Permissions'}</h3>
            <div className="rup-form-group">
              <label>{isRtl ? 'من يمكنه رؤية الملخص؟' : 'Who can see the abstract?'}</label>
              <select value={form.teaser_permission_key} onChange={e => setForm({...form, teaser_permission_key: e.target.value})}>
                <option value="view:public_content">{isRtl ? 'الجميع' : 'Everyone'}</option>
                <option value="view:free_content">{isRtl ? 'المسجلون' : 'Registered Users'}</option>
              </select>
            </div>
            <div className="rup-form-group">
              <label>{isRtl ? 'من يمكنه تحميل الملف؟' : 'Who can download the file?'}</label>
              <select value={form.full_access_permission_key} onChange={e => setForm({...form, full_access_permission_key: e.target.value})}>
                <option value="view:public_content">{isRtl ? 'الجميع' : 'Everyone'}</option>
                <option value="view:free_content">{isRtl ? 'المسجلون فقط' : 'Registered users only'}</option>
                <option value="view:all_courses">{isRtl ? 'المشتركون فقط' : 'Subscribers only'}</option>
              </select>
            </div>
          </div>

          {saveError && <div className="rup-error">{saveError}</div>}
          {saveSuccess && <div className="rup-success">{isRtl ? 'تم رفع البحث بنجاح' : 'Research uploaded successfully'}</div>}

          <button className="rup-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '...' : (isRtl ? 'حفظ ونشر' : 'Save & Publish')}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
