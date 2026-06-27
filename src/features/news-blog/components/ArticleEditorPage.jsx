import { useState, useRef, useEffect, useCallback } from 'preact/hooks';
import { useAuth } from '../../auth/hooks/useAuth';
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
  { cmd: 'createLink',    label: 'Link', title: 'Insert link', special: 'link' },
  { cmd: 'insertImage',   label: 'Image',title: 'Insert image', special: 'image' },
  { sep: true },
  { cmd: 'undo',  label: '↩', title: 'Undo' },
  { cmd: 'redo',  label: '↪', title: 'Redo' },
];

export function ArticleEditorPage({ lang, onNavigate }) {
  const { user, userProfile, hasPermission } = useAuth();
  const editorRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const [form, setForm] = useState({
    title_ar: '', title_en: '',
    category: 'climate_health',
    author_name: userProfile?.full_name || '',
    teaser_permission_key: 'view:public_content',
    full_access_permission_key: 'view:free_content',
  });
  const [thumbnail, setThumbnail] = useState(null); // base64 or URL
  const [thumbnailDragOver, setThumbnailDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeFormats, setActiveFormats] = useState({});

  const isRtl = lang === 'ar';

  // Permission check
  const canWrite = userProfile && (
    userProfile.role === 'admin' ||
    userProfile.role === 'superadmin' ||
    userProfile.role === 'researcher' ||
    (hasPermission && hasPermission('write:articles'))
  );

  // Update active format states on selection change
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

  // Toolbar button handler
  const execCmd = (cmd, arg, special) => {
    if (special === 'link') {
      const url = prompt('Enter URL:');
      if (url) document.execCommand('createLink', false, url);
      return;
    }
    if (special === 'image') {
      const url = prompt('Enter image URL (or paste an image into the editor directly):');
      if (url) document.execCommand('insertImage', false, url);
      return;
    }
    document.execCommand(cmd, false, arg || null);
    editorRef.current?.focus();
    updateActiveFormats();
  };

  // Handle paste in editor — allow pasting images
  const handleEditorPaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        const reader = new FileReader();
        reader.onload = (ev) => {
          document.execCommand('insertImage', false, ev.target.result);
        };
        reader.readAsDataURL(file);
        return;
      }
    }
  };

  // Thumbnail helpers
  const applyThumbnailFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => setThumbnail(ev.target.result);
    reader.readAsDataURL(file);
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

  // Global paste listener for thumbnail zone when focused
  const handleThumbnailKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      navigator.clipboard.read().then(items => {
        for (const item of items) {
          const imgType = item.types.find(t => t.startsWith('image/'));
          if (imgType) {
            item.getType(imgType).then(blob => applyThumbnailFile(blob));
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
    const content = editorRef.current?.innerHTML || '';
    if (!form.title_ar) { setSaveError(isRtl ? 'العنوان العربي مطلوب' : 'Arabic title is required'); return; }
    if (!content || content === '<br>') { setSaveError(isRtl ? 'محتوى المقال مطلوب' : 'Article content is required'); return; }

    setSaving(true);
    setSaveError('');
    try {
      const { supabase } = await import('../../../utils/supabaseClient');
      const payload = {
        ...form,
        content_ar: content,
        content_en: content,
        cover_image: thumbnail || null,
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

      {/* ── Banner ── */}
      <div className="aep-banner">
        <div className="aep-banner-inner">
          <button className="aep-back-btn" onClick={() => onNavigate?.('news-blog')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points={isRtl ? '9 18 15 12 9 6' : '15 18 9 12 15 6'}/></svg>
            {isRtl ? 'رجوع' : 'Back'}
          </button>
          <h1>{isRtl ? 'كتابة مقال جديد' : 'Write New Article'}</h1>
          <p>{isRtl ? 'أنشئ مقالاً غنياً بالمحتوى ودعمه بالصور والتنسيق الكامل' : 'Create a richly formatted article with full styling and image support'}</p>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="aep-layout">

        {/* Left: Editor panel */}
        <div className="aep-editor-panel">

          {/* Titles */}
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

          {/* Rich Text Editor */}
          <div className="aep-section">
            <label className="aep-label">{isRtl ? 'محتوى المقال' : 'Article Content'}</label>
            <div className="aep-editor-wrap">
              {/* Toolbar */}
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
              {/* Page-like writing area */}
              <div className="aep-doc-scroll">
                <div
                  ref={editorRef}
                  className="aep-doc-page"
                  contentEditable
                  suppressContentEditableWarning
                  dir={isRtl ? 'rtl' : 'ltr'}
                  onPaste={handleEditorPaste}
                  onKeyUp={updateActiveFormats}
                  onMouseUp={updateActiveFormats}
                  data-placeholder={isRtl ? 'ابدأ الكتابة هنا...' : 'Start writing here...'}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Metadata sidebar */}
        <div className="aep-sidebar">

          {/* Thumbnail */}
          <div className="aep-sidebar-card">
            <h3 className="aep-sidebar-title">{isRtl ? 'صورة الغلاف' : 'Cover Thumbnail'}</h3>
            <div
              className={`aep-thumb-zone${thumbnailDragOver ? ' drag-over' : ''}${thumbnail ? ' has-image' : ''}`}
              tabIndex={0}
              onDragOver={e => { e.preventDefault(); setThumbnailDragOver(true); }}
              onDragLeave={() => setThumbnailDragOver(false)}
              onDrop={handleThumbnailDrop}
              onPaste={handleThumbnailPaste}
              onKeyDown={handleThumbnailKeyDown}
              onClick={() => thumbnailInputRef.current?.click()}
            >
              {thumbnail ? (
                <>
                  <img src={thumbnail} alt="thumbnail" className="aep-thumb-preview" />
                  <button className="aep-thumb-remove" onClick={e => { e.stopPropagation(); setThumbnail(null); }}>
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

          {/* Metadata fields */}
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

          {/* Permissions */}
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

          {/* Save */}
          {saveError && <div className="aep-error">{saveError}</div>}
          {saveSuccess && <div className="aep-success">{isRtl ? 'تم نشر المقال بنجاح!' : 'Article published successfully!'}</div>}

          <button className="aep-btn-publish" disabled={saving} onClick={handleSave}>
            {saving ? (
              <span className="aep-spinner" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            )}
            {isRtl ? 'نشر المقال' : 'Publish Article'}
          </button>

          <button className="aep-btn-secondary" disabled={saving} onClick={() => onNavigate?.('news-blog')}>
            {isRtl ? 'إلغاء' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
