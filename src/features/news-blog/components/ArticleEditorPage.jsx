import { useState, useRef, useCallback, useEffect } from 'preact/hooks';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useAuth } from '../../auth/hooks/useAuth';
import { uploadFileToR2 } from '../../../utils/s3Client';
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
  const quillRef = useRef(null);
  const thumbnailInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title_ar: '', title_en: '',
    category: 'climate_health',
    author_name: userProfile?.full_name || '',
    teaser_permission_key: 'view:public_content',
    full_access_permission_key: 'view:free_content',
  });
  
  const [content, setContent] = useState('');
  const [inputType, setInputType] = useState('editor'); // 'editor' | 'file'
  const [attachedFile, setAttachedFile] = useState(null);
  
  const [thumbnailFile, setThumbnailFile] = useState(null); 
  const [thumbnailPreview, setThumbnailPreview] = useState(null); 
  const [thumbnailDragOver, setThumbnailDragOver] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isRtl = lang === 'ar';

  // Add tooltips to Quill toolbar
  useEffect(() => {
    if (inputType !== 'editor') return;
    
    const tooltips = {
      '.ql-header[value="1"]': isRtl ? 'عنوان رئيسي 1' : 'Heading 1',
      '.ql-header[value="2"]': isRtl ? 'عنوان فرعي 2' : 'Heading 2',
      '.ql-header[value="3"]': isRtl ? 'عنوان أصغر 3' : 'Heading 3',
      '.ql-header': isRtl ? 'فقرة عادية' : 'Normal Text',
      '.ql-bold': isRtl ? 'عريض (Bold)' : 'Bold',
      '.ql-italic': isRtl ? 'مائل (Italic)' : 'Italic',
      '.ql-underline': isRtl ? 'تسطير (Underline)' : 'Underline',
      '.ql-strike': isRtl ? 'يتوسطه خط (Strike)' : 'Strikethrough',
      '.ql-list[value="ordered"]': isRtl ? 'قائمة رقمية' : 'Numbered List',
      '.ql-list[value="bullet"]': isRtl ? 'قائمة نقطية' : 'Bullet List',
      '.ql-align': isRtl ? 'محاذاة النص' : 'Text Alignment',
      '.ql-link': isRtl ? 'إدراج رابط (Ctrl+K)' : 'Insert Link (Ctrl+K)',
      '.ql-image': isRtl ? 'إدراج صورة' : 'Insert Image',
      '.ql-clean': isRtl ? 'مسح التنسيق' : 'Clear Formatting',
      '.ql-color': isRtl ? 'لون النص' : 'Text Color',
      '.ql-background': isRtl ? 'لون الخلفية' : 'Background Color'
    };

    const timer = setTimeout(() => {
      Object.entries(tooltips).forEach(([selector, title]) => {
        const els = document.querySelectorAll(selector);
        els.forEach(el => el.setAttribute('title', title));
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [inputType, isRtl]);

  const canWrite = userProfile && (
    userProfile.role === 'admin' ||
    userProfile.role === 'superadmin' ||
    userProfile.role === 'researcher' ||
    (hasPermission && hasPermission('write:articles'))
  );

  const uploadAndInsertImage = async (file) => {
    try {
      setUploadingMedia(true);
      const webpFile = await convertToWebP(file);
      const url = await uploadFileToR2(webpFile, 'article_images');
      
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection(true);
      quill.insertEmbed(range.index, 'image', url);
      quill.setSelection(range.index + 1);
    } catch (err) {
      console.error("Failed to upload image:", err);
      alert(isRtl ? "فشل رفع الصورة." : "Failed to upload image.");
    } finally {
      setUploadingMedia(false);
    }
  };

  const uploadAndInsertFile = async (file) => {
    setAttachedFile(file);
  };

  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        uploadAndInsertImage(file);
      }
    };
  }, []);

  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    }
  };

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

    if (inputType === 'file') {
      if (!attachedFile) {
        setSaveError(isRtl ? 'يجب إرفاق ملف المستند' : 'You must attach a document file'); 
        return;
      }
      setSaving(true);
      try {
        const fileUrl = await uploadFileToR2(attachedFile, 'article_attachments');
        // Generate an HTML stub that acts as the article content
        finalContent = `
          <div class="aep-document-embed" style="text-align: center; padding: 40px; background: #f8fafc; border-radius: 12px; border: 2px dashed #cbd5e1; margin: 20px 0;">
            <div style="margin-bottom: 15px; color: #64748b;">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <h3 style="color: #0b2849; margin-bottom: 15px; font-family: inherit;">${attachedFile.name}</h3>
            <a href="${fileUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #15b47a, #0c8774); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-family: inherit;">
              ${isRtl ? 'تحميل / عرض المستند' : 'Download / View Document'}
            </a>
          </div>
        `;
      } catch (err) {
        setSaveError(isRtl ? "فشل رفع المستند" : "Failed to upload document");
        setSaving(false);
        return;
      }
    } else {
      if (!content || content === '<p><br></p>') { setSaveError(isRtl ? 'محتوى المقال مطلوب' : 'Article content is required'); return; }
      setSaving(true);
    }

    setSaveError('');
    try {
      let coverImageUrl = null;
      if (thumbnailFile) {
         coverImageUrl = await uploadFileToR2(thumbnailFile, 'article_thumbnails');
      }

      const { supabase } = await import('../../../utils/supabaseClient');
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
      <input 
        type="file" 
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" 
        style={{ display: 'none' }} 
        ref={fileInputRef} 
        onChange={(e) => {
          if (e.target.files?.[0]) uploadAndInsertFile(e.target.files[0]);
          e.target.value = null; // reset
        }} 
      />

      <div className="aep-banner">
        <div className="aep-banner-inner">
          <button className="aep-back-btn" onClick={() => onNavigate?.('news-blog')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points={isRtl ? '9 18 15 12 9 6' : '15 18 9 12 15 6'}/></svg>
            {isRtl ? 'رجوع' : 'Back'}
          </button>
          <h1>{isRtl ? 'كتابة مقال جديد' : 'Write New Article'}</h1>
          <p>{isRtl ? 'أنشئ مقالاً غنياً بالمحتوى ودعمه بالصور والملفات' : 'Create a richly formatted article with images and files'}</p>
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
            
            <div className="aep-type-toggle">
              <button 
                type="button" 
                className={inputType === 'editor' ? 'active' : ''} 
                onClick={() => setInputType('editor')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                {isRtl ? 'كتابة المقال يدوياً' : 'Write Article'}
              </button>
              <button 
                type="button" 
                className={inputType === 'file' ? 'active' : ''} 
                onClick={() => setInputType('file')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                {isRtl ? 'رفع ملف (PDF, Word)' : 'Upload Document'}
              </button>
            </div>
            
            {/* Editor Area Wrap */}
            <div className="aep-editor-wrap" dir={isRtl ? 'rtl' : 'ltr'}>
              {inputType === 'editor' ? (
                <ReactQuill 
                  ref={quillRef}
                  theme="snow" 
                  value={content} 
                  onChange={setContent} 
                  modules={modules}
                  placeholder={isRtl ? 'ابدأ الكتابة هنا...' : 'Start writing here...'}
                />
              ) : (
                <div className="aep-file-upload-zone" onClick={() => fileInputRef.current?.click()}>
                  {attachedFile ? (
                    <div className="aep-file-selected">
                      <div className="aep-file-icon" style={{ color: '#64748b' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      </div>
                      <div className="aep-file-name">{attachedFile.name}</div>
                      <div className="aep-file-size">{(attachedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                      <button className="aep-btn-secondary" style={{ marginTop: '15px' }} onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                        {isRtl ? 'تغيير الملف' : 'Change File'}
                      </button>
                    </div>
                  ) : (
                    <div className="aep-file-prompt">
                      <div className="aep-file-icon" style={{ opacity: 0.5, color: '#15b47a' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                      </div>
                      <h3>{isRtl ? 'اضغط هنا لاختيار ملف' : 'Click here to select a file'}</h3>
                      <p>{isRtl ? 'يدعم PDF, Word (DOCX), PowerPoint (PPTX)' : 'Supports PDF, Word (DOCX), PowerPoint (PPTX)'}</p>
                    </div>
                  )}
                </div>
              )}
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
            <label className="aep-label" style={{ marginTop: '14px' }}>{isRtl ? 'اسم الكاتب' : 'Author Name'}</label>
            <input className="aep-input" placeholder={isRtl ? 'اسم الكاتب...' : 'Author name...'}
              value={form.author_name} onInput={e => setForm({ ...form, author_name: e.target.value })} />
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
