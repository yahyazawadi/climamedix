import { useState, useRef, useEffect, useCallback } from 'preact/hooks';
import { useAuth } from '../../auth/hooks/useAuth';
import { uploadFileToR2 } from '../../../utils/s3Client';
import './ArticleEditorPage.css';

const CATEGORIES = [
  { value: 'climate_health', ar: 'المناخ والصحة', en: 'Climate & Health' },
  { value: 'research',       ar: 'أبحاث',          en: 'Research'         },
  { value: 'opportunities',  ar: 'فرص',             en: 'Opportunities'    },
  { value: 'events',         ar: 'فعاليات',         en: 'Events'           },
];

const TOOLBAR_ACTIONS = [
  { cmd: 'bold',          label: 'B',   title: 'Bold',         style: { fontWeight: 'bold' } },
  { cmd: 'italic',        label: 'I',   title: 'Italic',       style: { fontStyle: 'italic' } },
  { cmd: 'underline',     label: 'U',   title: 'Underline',    style: { textDecoration: 'underline' } },
  { cmd: 'strikeThrough', label: 'S',   title: 'Strikethrough',style: { textDecoration: 'line-through' } },
  { sep: true },
  { cmd: 'formatBlock', arg: 'H1',     label: 'H1',  title: 'Heading 1' },
  { cmd: 'formatBlock', arg: 'H2',     label: 'H2',  title: 'Heading 2' },
  { cmd: 'formatBlock', arg: 'H3',     label: 'H3',  title: 'Heading 3' },
  { cmd: 'formatBlock', arg: 'P',      label: '¶',   title: 'Paragraph' },
  { sep: true },
  { cmd: 'insertUnorderedList', label: '• List',  title: 'Bullet list' },
  { cmd: 'insertOrderedList',   label: '1. List', title: 'Numbered list' },
  { sep: true },
  { cmd: 'justifyLeft',   label: '⬛ L', title: 'Align left'   },
  { cmd: 'justifyCenter', label: '⬛ C', title: 'Align center' },
  { cmd: 'justifyRight',  label: '⬛ R', title: 'Align right'  },
  { sep: true },
  { cmd: 'createLink',    label: 'Link', title: 'Insert link (Ctrl+K)', special: 'link' },
  { cmd: 'insertImage',   label: 'Image',title: 'Insert image', special: 'image' },
  { cmd: 'attachFile',    label: 'File', title: 'Attach file', special: 'file' },
  { sep: true },
  { cmd: 'undo',  label: '↩', title: 'Undo' },
  { cmd: 'redo',  label: '↪', title: 'Redo' },
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
      }, "image/webp", 0.85); // 85% quality
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
  const editorRef = useRef(null);
  const thumbnailInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title_ar: '', title_en: '',
    category: 'climate_health',
    author_name: userProfile?.full_name || '',
    teaser_permission_key: 'view:public_content',
    full_access_permission_key: 'view:free_content',
  });
  
  // We'll keep local object URLs for thumbnail preview, but upload on save.
  const [thumbnailFile, setThumbnailFile] = useState(null); 
  const [thumbnailPreview, setThumbnailPreview] = useState(null); 
  const [thumbnailDragOver, setThumbnailDragOver] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeFormats, setActiveFormats] = useState({});

  const isRtl = lang === 'ar';

  const canWrite = userProfile && (
    userProfile.role === 'admin' ||
    userProfile.role === 'superadmin' ||
    userProfile.role === 'researcher' ||
    (hasPermission && hasPermission('write:articles'))
  );

  const updateActiveFormats = useCallback(() => {
    const cmds = ['bold','italic','underline','strikeThrough','insertUnorderedList','insertOrderedList','justifyLeft','justifyCenter','justifyRight'];
    const next = {};
    cmds.forEach(cmd => { try { next[cmd] = document.queryCommandState(cmd); } catch(_) {} });
    setActiveFormats(next);
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', updateActiveFormats);
    return () => document.removeEventListener('selectionchange', updateActiveFormats);
  }, [updateActiveFormats]);

  const insertLinkPrompt = () => {
    let url = prompt('Enter URL:');
    if (url) {
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
      document.execCommand('createLink', false, url);
    }
  };

  const execCmd = (cmd, arg, special) => {
    if (special === 'link') {
      insertLinkPrompt();
      return;
    }
    if (special === 'image') {
      imageInputRef.current?.click();
      return;
    }
    if (special === 'file') {
      fileInputRef.current?.click();
      return;
    }
    document.execCommand(cmd, false, arg || null);
    editorRef.current?.focus();
    updateActiveFormats();
  };

  const handleEditorKeyDown = (e) => {
    // Ctrl+K for links
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      insertLinkPrompt();
    }
    
    // Auto-link on space or enter
    if (e.key === ' ' || e.key === 'Enter') {
      const selection = window.getSelection();
      if (!selection.isCollapsed) return;
      
      const range = selection.getRangeAt(0);
      const node = range.startContainer;
      
      // Only process text nodes that aren't already inside a link
      if (node.nodeType === Node.TEXT_NODE && !node.parentNode.closest('a')) {
        const text = node.textContent;
        const cursorOffset = range.startOffset;
        const textBeforeCursor = text.substring(0, cursorOffset);
        
        // Regex to find a URL right before the cursor
        const urlRegex = /(?:^|\s)((?:https?:\/\/)?[\w.-]+\.[a-zA-Z]{2,}(?:\/\S*)?)$/i;
        const match = textBeforeCursor.match(urlRegex);
        
        if (match) {
          const urlText = match[1];
          let href = urlText;
          if (!/^https?:\/\//i.test(href)) {
            href = 'https://' + href;
          }
          
          const urlStartOffset = cursorOffset - urlText.length;
          
          // Create the link node
          const a = document.createElement('a');
          a.href = href;
          a.textContent = urlText;
          a.target = '_blank';
          
          // Replace the text with the link
          const beforeLink = document.createTextNode(text.substring(0, urlStartOffset));
          const afterLink = document.createTextNode(text.substring(cursorOffset));
          
          const parent = node.parentNode;
          parent.insertBefore(beforeLink, node);
          parent.insertBefore(a, node);
          parent.insertBefore(afterLink, node);
          parent.removeChild(node);
          
          // Restore cursor position
          const newRange = document.createRange();
          // if we typed space, we want the cursor after the space in the afterLink text node
          // wait, the keydown happens BEFORE the space is inserted. 
          // So we should just set cursor to the start of afterLink
          newRange.setStart(afterLink, 0);
          newRange.setEnd(afterLink, 0);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
    }
    
    updateActiveFormats();
  };

  const uploadAndInsertImage = async (file) => {
    try {
      setUploadingMedia(true);
      const webpFile = await convertToWebP(file);
      const url = await uploadFileToR2(webpFile, 'article_images');
      document.execCommand('insertImage', false, url);
    } catch (err) {
      console.error("Failed to upload image:", err);
      alert(isRtl ? "فشل رفع الصورة." : "Failed to upload image.");
    } finally {
      setUploadingMedia(false);
    }
  };

  const uploadAndInsertFile = async (file) => {
    try {
      setUploadingMedia(true);
      const url = await uploadFileToR2(file, 'article_attachments');
      const html = `<br><a href="${url}" target="_blank" class="aep-attachment">📎 ${file.name}</a><br>`;
      document.execCommand('insertHTML', false, html);
    } catch (err) {
      console.error("Failed to upload file:", err);
      alert(isRtl ? "فشل رفع الملف." : "Failed to upload file.");
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleEditorPaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        uploadAndInsertImage(file);
        return;
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
               // convert blob to file
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

    const content = editorRef.current?.innerHTML || '';
    if (!form.title_ar) { setSaveError(isRtl ? 'العنوان العربي مطلوب' : 'Arabic title is required'); return; }
    if (!content || content === '<br>') { setSaveError(isRtl ? 'محتوى المقال مطلوب' : 'Article content is required'); return; }

    setSaving(true);
    setSaveError('');
    try {
      let coverImageUrl = null;
      if (thumbnailFile) {
         coverImageUrl = await uploadFileToR2(thumbnailFile, 'article_thumbnails');
      }

      const { supabase } = await import('../../../utils/supabaseClient');
      const payload = {
        ...form,
        content_ar: content,
        content_en: content,
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
      {/* Hidden Inputs for Editor Toolbar */}
      <input 
        type="file" 
        accept="image/*" 
        style={{ display: 'none' }} 
        ref={imageInputRef} 
        onChange={(e) => {
          if (e.target.files?.[0]) uploadAndInsertImage(e.target.files[0]);
          e.target.value = null; // reset
        }} 
      />
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

          <div className="aep-section">
            <label className="aep-label">
              {isRtl ? 'محتوى المقال' : 'Article Content'}
              {uploadingMedia && <span className="aep-uploading-text">{isRtl ? ' (جاري رفع ملف...)' : ' (Uploading file...)'}</span>}
            </label>
            <div className="aep-editor-wrap">
              <div className="aep-toolbar" onMouseDown={e => e.preventDefault()}>
                {TOOLBAR_ACTIONS.map((btn, i) =>
                  btn.sep
                    ? <div key={i} className="aep-tb-sep" />
                    : <button
                        key={i}
                        className={`aep-tb-btn${activeFormats[btn.cmd] ? ' active' : ''}`}
                        title={btn.title}
                        style={btn.style}
                        onClick={() => execCmd(btn.cmd, btn.arg, btn.special)}
                      >{btn.label}</button>
                )}
              </div>
              <div className="aep-doc-scroll">
                <div
                  ref={editorRef}
                  className="aep-doc-page"
                  contentEditable
                  suppressContentEditableWarning
                  dir={isRtl ? 'rtl' : 'ltr'}
                  onPaste={handleEditorPaste}
                  onKeyDown={handleEditorKeyDown}
                  onMouseUp={updateActiveFormats}
                  data-placeholder={isRtl ? 'ابدأ الكتابة هنا...' : 'Start writing here...'}
                />
              </div>
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
