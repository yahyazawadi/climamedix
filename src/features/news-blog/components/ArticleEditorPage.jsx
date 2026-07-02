import { useState, useRef, useCallback, useEffect } from 'preact/hooks';
import { RichTextEditor } from '../../shared/components/RichTextEditor';
import { useAuth } from '../../auth/hooks/useAuth';
import { uploadFileToR2 } from '../../../utils/s3Client';
import { supabase } from '../../../utils/supabaseClient';
import './ArticleEditorPage.css';

const CATEGORIES = [
  { value: 'climate_health', ar: 'المناخ والصحة', en: 'Climate & Health' },
  { value: 'research',       ar: 'أبحاث',          en: 'Research'         },
  { value: 'opportunities',  ar: 'فرص',             en: 'Opportunities'    },
  { value: 'events',         ar: 'فعاليات',         en: 'Events'           },
];

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

export function ArticleEditorPage({ lang, onNavigate }) {
  const { user, userProfile, hasPermission } = useAuth();
  const thumbnailInputRef = useRef(null);

  const [form, setForm] = useState({
    title_ar: '', title_en: '',
    category: 'climate_health',
    author_name: '',
    teaser_permission_key: 'view:public_content',
    full_access_permission_key: 'view:free_content',
  });
  
  // Auto-fill author name when profile loads
  useEffect(() => {
    if (userProfile?.full_name && !form.author_name) {
      setForm(prev => ({ ...prev, author_name: userProfile.full_name }));
    }
  }, [userProfile, form.author_name]);
  
  const [content, setContent] = useState('');
  
  const [thumbnailFile, setThumbnailFile] = useState(null); 
  const [thumbnailPreview, setThumbnailPreview] = useState(null); 
  const [thumbnailDragOver, setThumbnailDragOver] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isRtl = lang === 'ar';

  const canWrite = hasPermission && hasPermission('write:articles');

  const applyThumbnailFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const webpFile = await convertToWebP(file);
      setThumbnailFile(webpFile);
      const objectUrl = URL.createObjectURL(webpFile);
      setThumbnailPreview(objectUrl);
    } catch(err) {
      console.error("Error converting thumbnail:", err);
    }
  };

  const handleThumbnailPaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        applyThumbnailFile(item.getAsFile());
        return;
      }
    }
  }, []);

  const handleThumbnailKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      navigator.clipboard.read().then(items => {
        for (const item of items) {
          const imgType = item.types.find(t => t.startsWith('image/'));
          if (imgType) {
            item.getType(imgType).then(blob => {
               const file = new File([blob], "pasted_image.png", {type: blob.type});
               applyThumbnailFile(file);
            });
            return;
          }
        }
      }).catch(() => {});
    }
  };

  const handleThumbnailDrop = (e) => {
    e.preventDefault();
    setThumbnailDragOver(false);
    const file = e.dataTransfer.files?.[0];
    applyThumbnailFile(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (uploadingMedia) {
      alert(isRtl ? 'جاري رفع الملفات، يرجى الانتظار.' : 'Media is still uploading, please wait.');
      return;
    }

    if (!form.title_ar) { setSaveError(isRtl ? 'العنوان العربي مطلوب' : 'Arabic title is required'); return; }
    
    let finalContent = content;

    if (!content || content === '<p><br></p>') { setSaveError(isRtl ? 'محتوى المقال مطلوب' : 'Article content is required'); return; }
    setSaving(true);

    setSaveError('');
    try {
      let coverImageUrl = null;
      if (thumbnailFile) {
         coverImageUrl = await uploadFileToR2(thumbnailFile, 'article_thumbnails');
      }

      const payload = {
        ...form,
        content_ar: finalContent,
        content_en: finalContent,
        cover_image: coverImageUrl,
        created_by: user?.id,
      };
      
      const { error } = await supabase.from('news_articles').insert([payload]);
      if (error) throw error;
      setSaveSuccess(true);
      setTimeout(() => { setSaveSuccess(false); onNavigate?.('news-blog'); }, 2000);
    } catch (err) {
      setSaveError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!canWrite) {
    return (
      <div className="aep-no-access" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="aep-no-access-card">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <h2>{isRtl ? 'غير مصرح بالوصول' : 'Access Denied'}</h2>
          <p>{isRtl ? 'تحتاج إلى صلاحية write:articles لكتابة المقالات.' : 'You need the write:articles permission to create articles.'}</p>
          <button className="aep-btn-primary" onClick={() => onNavigate?.('home')}>
            {isRtl ? 'العودة للرئيسية' : 'Back to Home'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="aep-root" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="aep-banner">
        <div className="aep-banner-inner">
          <h1>{isRtl ? 'كتابة مقال جديد' : 'Write New Article'}</h1>
          <p>{isRtl ? 'قم بإنشاء مقال منسق مع الصور والملفات' : 'Create a richly formatted article with images and files'}</p>
        </div>
      </div>

      <div className="aep-layout">
        <div className="aep-editor-panel">
          <div className="aep-section">
            <label className="aep-label">{isRtl ? 'العنوان بالعربية *' : 'Title (Arabic) *'}</label>
            <input className="aep-input aep-title-input" dir="rtl" placeholder="عنوان المقال بالعربية..."
              value={form.title_ar} onInput={e => setForm({ ...form, title_ar: e.target.value })} />
          </div>
          <div className="aep-section">
            <label className="aep-label">{isRtl ? 'العنوان بالإنجليزية' : 'Title (English)'}</label>
            <input className="aep-input aep-title-input" dir="ltr" placeholder="Article title in English..."
              value={form.title_en} onInput={e => setForm({ ...form, title_en: e.target.value })} />
          </div>

          <div className="aep-section" style={{ marginTop: '10px' }}>
            {/* Editor Area Wrap */}
            <div className="aep-editor-wrap" dir={isRtl ? 'rtl' : 'ltr'}>
              <RichTextEditor 
                value={content} 
                onChange={setContent} 
                isRtl={isRtl}
                placeholder={isRtl ? 'ابدأ الكتابة هنا...' : 'Start writing here...'}
                onUploadingMedia={setUploadingMedia}
                imageBucketFolder="article_images"
              />
            </div>
          </div>
        </div>

        <div className="aep-sidebar">
          <div className="aep-sidebar-card">
            <h3 className="aep-sidebar-title">{isRtl ? 'صورة الغلاف' : 'Cover Thumbnail'}</h3>
            <div
              className={`aep-thumb-zone${thumbnailDragOver ? ' drag-over' : ''}${thumbnailPreview ? ' has-image' : ''}`}
              tabIndex={0}
              onDragOver={e => { e.preventDefault(); setThumbnailDragOver(true); }}
              onDragLeave={() => setThumbnailDragOver(false)}
              onDrop={handleThumbnailDrop}
              onPaste={handleThumbnailPaste}
              onKeyDown={handleThumbnailKeyDown}
              onClick={() => thumbnailInputRef.current?.click()}
            >
              {thumbnailPreview ? (
                <>
                  <img src={thumbnailPreview} alt="thumbnail" className="aep-thumb-preview" />
                  <button className="aep-thumb-remove" onClick={e => { e.stopPropagation(); setThumbnailFile(null); setThumbnailPreview(null); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </>
              ) : (
                <div className="aep-thumb-placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <span>{isRtl ? 'ألصق أو اسحب صورة هنا' : 'Paste or drag image here'}</span>
                  <small>{isRtl ? 'أو انقر للرفع' : 'or click to upload'}</small>
                </div>
              )}
            </div>
            <input ref={thumbnailInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => applyThumbnailFile(e.target.files?.[0])} />
          </div>

          <div className="aep-sidebar-card">
            <h3 className="aep-sidebar-title">{isRtl ? 'بيانات المقال' : 'Article Details'}</h3>
            <label className="aep-label">{isRtl ? 'التصنيف' : 'Category'}</label>
            <select className="aep-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{isRtl ? c.ar : c.en}</option>)}
            </select>
            <label className="aep-label" style={{ marginTop: '14px' }}>{isRtl ? 'بيانات الكاتب' : 'Author Details'}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
              {userProfile?.avatar_url ? (
                <img src={userProfile.avatar_url} alt="Author avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #e2e8f0' }} />
              ) : (
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: 'bold', fontSize: '16px', border: '1.5px solid #e2e8f0' }}>
                  {form.author_name ? form.author_name.charAt(0).toUpperCase() : '?'}
                </div>
              )}
              <input className="aep-input" style={{ flex: 1 }} placeholder={isRtl ? 'اسم الكاتب...' : 'Author name...'}
                value={form.author_name} onInput={e => setForm({ ...form, author_name: e.target.value })} />
            </div>
          </div>

          <div className="aep-sidebar-card">
            <h3 className="aep-sidebar-title">{isRtl ? 'صلاحيات الوصول' : 'Access Permissions'}</h3>
            <label className="aep-label">{isRtl ? 'من يرى الإعلان؟' : 'Who sees the teaser?'}</label>
            <select className="aep-select" value={form.teaser_permission_key} onChange={e => setForm({ ...form, teaser_permission_key: e.target.value })}>
              <option value="view:public_content">{isRtl ? 'الجميع (زوار + مسجلون)' : 'Everyone (guests + users)'}</option>
              <option value="view:free_content">{isRtl ? 'المسجلون فقط' : 'Registered users only'}</option>
              <option value="view:all_courses">{isRtl ? 'المشتركون فقط' : 'Subscribers only'}</option>
            </select>
            <label className="aep-label" style={{ marginTop: '14px' }}>{isRtl ? 'من يقرأ المقال كاملاً؟' : 'Who reads the full article?'}</label>
            <select className="aep-select" value={form.full_access_permission_key} onChange={e => setForm({ ...form, full_access_permission_key: e.target.value })}>
              <option value="view:public_content">{isRtl ? 'الجميع' : 'Everyone'}</option>
              <option value="view:free_content">{isRtl ? 'المسجلون فقط' : 'Registered users only'}</option>
              <option value="view:all_courses">{isRtl ? 'المشتركون فقط' : 'Subscribers only'}</option>
            </select>
          </div>

          {saveError && <div className="aep-error">{saveError}</div>}
          {saveSuccess && <div className="aep-success">{isRtl ? 'تم نشر المقال بنجاح!' : 'Article published successfully!'}</div>}

          <button className="aep-btn-publish" disabled={saving || uploadingMedia} onClick={handleSave}>
            {(saving || uploadingMedia) ? <span className="aep-spinner" /> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
            {isRtl ? 'نشر المقال' : 'Publish Article'}
          </button>
          <button className="aep-btn-secondary" disabled={saving || uploadingMedia} onClick={() => onNavigate?.('news-blog')}>
            {isRtl ? 'إلغاء' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
