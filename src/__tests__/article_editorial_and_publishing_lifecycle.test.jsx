import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { ArticleEditorPage } from '../features/news-blog/components/ArticleEditorPage';
import { NewsPage } from '../features/news-blog/components/NewsPage';
import { NewsFeed } from '../features/news-blog/components/NewsFeed';
import { ArticleCard } from '../features/news-blog/components/ArticleCard';
import { evaluatePermission } from '../features/auth/hooks/useAuth';

// ─── MOCKS ───────────────────────────────────────────────────────────────────

let currentAuth = {
  user: null,
  userProfile: null,
  hasPermission: () => false,
  authLoading: false
};

vi.mock('../features/auth/hooks/useAuth', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAuth: () => currentAuth
  };
});

// Mock S3
let mockUploadFileToR2 = vi.fn().mockImplementation((file, folder) => {
  return Promise.resolve(`https://cdn.climamedix.org/${folder}/${file.name || 'image.webp'}`);
});

vi.mock('../utils/s3Client', () => ({
  uploadFileToR2: (file, folder) => mockUploadFileToR2(file, folder)
}));

// Mock RichTextEditor
vi.mock('../features/shared/components/RichTextEditor', () => ({
  RichTextEditor: ({ value, onChange, placeholder, isRtl, onUploadingMedia }) => (
    <div data-testid="mock-rich-editor" dir={isRtl ? 'rtl' : 'ltr'}>
      <textarea
        data-testid="editor-textarea"
        placeholder={placeholder}
        value={value}
        onInput={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        data-testid="trigger-media-uploading"
        onClick={() => onUploadingMedia?.(true)}
      >
        Start Media Upload
      </button>
      <button
        type="button"
        data-testid="stop-media-uploading"
        onClick={() => onUploadingMedia?.(false)}
      >
        Stop Media Upload
      </button>
    </div>
  )
}));

// Mock GSAP
vi.mock('gsap', () => ({
  default: {
    context: (cb) => {
      cb();
      return { revert: vi.fn() };
    },
    fromTo: vi.fn()
  }
}));

// Mock Supabase
let mockInsertArticle = vi.fn();
let mockUpdateArticle = vi.fn();
let mockArticleRecords = {};
let mockAccessibleArticles = [];

vi.mock('../utils/supabaseClient', () => ({
  supabase: {
    from: (table) => ({
      select: vi.fn().mockImplementation(() => ({
        eq: vi.fn().mockImplementation((col, val) => ({
          single: vi.fn().mockResolvedValue({
            data: mockArticleRecords[val] || null,
            error: null
          })
        })),
        order: vi.fn().mockImplementation(() => ({
          then: (cb) => cb({ data: mockAccessibleArticles, error: null })
        }))
      })),
      insert: vi.fn().mockImplementation((rows) => {
        mockInsertArticle(rows);
        return Promise.resolve({ error: null });
      }),
      update: vi.fn().mockImplementation((payload) => ({
        eq: vi.fn().mockImplementation((col, val) => {
          mockUpdateArticle(payload, val);
          return Promise.resolve({ error: null });
        })
      }))
    })
  }
}));

// Helper to setup auth
function setMockAuth({ role = 'admin', userId = 'usr-admin-1', fullName = 'د. سامي العلمي' } = {}) {
  const profile = {
    id: userId,
    email: `${role}@climamedix.org`,
    role,
    full_name: fullName,
    avatar_url: 'https://cdn.climamedix.org/avatars/sami.webp'
  };

  currentAuth = {
    user: { id: userId, email: profile.email },
    userProfile: profile,
    authLoading: false,
    hasPermission: (perm) => evaluatePermission(perm, role)
  };
}

describe('Article Editorial & Publishing Lifecycle Test Suite (55 Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockArticleRecords = {};
    mockAccessibleArticles = [];
    window.alert = vi.fn();

    // Default: Authenticated Admin
    setMockAuth({ role: 'admin' });

    // Mock ObjectURL
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:https://climamedix.org/mock-image-blob');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState({}, '', '/');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Access Control & Permissions Gating (10 Tests)
  // ──────────────────────────────────────────────────────────────────────────
  describe('1. Access Control & Permissions Gating (10 Tests)', () => {
    it('denies guest without write:articles and renders access denied card in Arabic', () => {
      currentAuth = { user: null, userProfile: null, hasPermission: () => false, authLoading: false };

      render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      expect(screen.getByText('غير مصرح بالوصول')).toBeDefined();
      expect(screen.getByText('ليس لديك صلاحية لتعديل أو كتابة هذا المقال.')).toBeDefined();
      expect(screen.getByText('العودة للرئيسية')).toBeDefined();
    });

    it('denies user without write:articles in English', () => {
      setMockAuth({ role: 'user' }); // standard user lacks write:articles

      render(<ArticleEditorPage lang="en" onNavigate={vi.fn()} />);

      expect(screen.getByText('Access Denied')).toBeDefined();
      expect(screen.getByText('You do not have permission to edit or write this article.')).toBeDefined();
      expect(screen.getByText('Back to Home')).toBeDefined();
    });

    it('clicking "العودة للرئيسية" on access denied screen navigates to home', () => {
      setMockAuth({ role: 'user' });
      const onNavigate = vi.fn();

      render(<ArticleEditorPage lang="ar" onNavigate={onNavigate} />);

      const homeBtn = screen.getByText('العودة للرئيسية');
      fireEvent.click(homeBtn);

      expect(onNavigate).toHaveBeenCalledWith('home');
    });

    it('allows researcher with write:articles to open editor for new article', () => {
      setMockAuth({ role: 'researcher' });

      render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      expect(screen.getByText('كتابة مقال جديد')).toBeDefined();
      expect(screen.queryByText('غير مصرح بالوصول')).toBeNull();
    });

    it('allows author with write:articles to edit their own article', async () => {
      setMockAuth({ role: 'researcher', userId: 'usr-author-1' });
      mockArticleRecords['art-own'] = {
        id: 'art-own',
        created_by: 'usr-author-1',
        title_ar: 'مقالتي البيئية',
        content_ar: 'محتوى المقال'
      };

      window.history.replaceState({}, '', '/?id=art-own');

      render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('تعديل المقال')).toBeDefined();
      });
    });

    it('blocks author with write:articles from editing someone else\'s article', async () => {
      setMockAuth({ role: 'researcher', userId: 'usr-author-1' });
      mockArticleRecords['art-other'] = {
        id: 'art-other',
        created_by: 'usr-author-999', // different author
        title_ar: 'مقال لشخص آخر',
        content_ar: 'محتوى'
      };

      window.history.replaceState({}, '', '/?id=art-other');

      render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('غير مصرح بالوصول')).toBeDefined();
      });
    });

    it('allows admin with manage:any_article to edit any article regardless of author', async () => {
      setMockAuth({ role: 'admin', userId: 'usr-admin-1' });
      mockArticleRecords['art-foreign'] = {
        id: 'art-foreign',
        created_by: 'usr-someone-else',
        title_ar: 'تقرير صحي',
        content_ar: 'محتوى التقرير'
      };

      window.history.replaceState({}, '', '/?id=art-foreign');

      render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('تعديل المقال')).toBeDefined();
      });
    });

    it('displays loading indicator while authLoading is true', () => {
      currentAuth = { user: null, userProfile: null, hasPermission: () => false, authLoading: true };

      render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      expect(screen.getByText('جاري التحميل...')).toBeDefined();
    });

    it('ArticleCard renders edit button when canEdit is true and handles mouse hover', () => {
      const onEdit = vi.fn();
      render(
        <ArticleCard
          title="مقال تجريبي"
          category="المناخ"
          canEdit={true}
          onEdit={onEdit}
          lang="ar"
        />
      );

      const editBtn = screen.getByTitle('تعديل المقال');
      expect(editBtn).not.toBeNull();
      fireEvent.mouseEnter(editBtn);
      expect(editBtn.style.background).toBe('rgba(14, 165, 233, 0.1)');
      fireEvent.mouseLeave(editBtn);
      expect(editBtn.style.background).toBe('transparent');
      fireEvent.click(editBtn);
      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it('ArticleCard renders English edit button title when lang is en', () => {
      render(
        <ArticleCard
          title="Test Article"
          category="Climate"
          canEdit={true}
          onEdit={vi.fn()}
          lang="en"
        />
      );

      expect(screen.getByTitle('Edit Article')).toBeInTheDocument();
    });

    it('ArticleCard hides edit button when canEdit is false', () => {
      render(
        <ArticleCard
          title="مقال تجريبي"
          category="المناخ"
          canEdit={false}
        />
      );

      expect(screen.queryByTitle('تعديل المقال')).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Article Form State & Field Binding (10 Tests)
  // ──────────────────────────────────────────────────────────────────────────
  describe('2. Article Form State & Field Binding (10 Tests)', () => {
    it('auto-populates author_name from userProfile.full_name', () => {
      setMockAuth({ role: 'admin', fullName: 'البروفيسور خالد المحمود' });

      render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      expect(screen.getByDisplayValue('البروفيسور خالد المحمود')).toBeDefined();
    });

    it('editing title_ar updates state and input value', () => {
      render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      const titleArInput = screen.getByPlaceholderText('عنوان المقال بالعربية...');
      fireEvent.input(titleArInput, { target: { value: 'تأثير موجات الحر على الجهاز التنفسي' } });

      expect(titleArInput.value).toBe('تأثير موجات الحر على الجهاز التنفسي');
    });

    it('editing title_en updates state and input value', () => {
      render(<ArticleEditorPage lang="en" onNavigate={vi.fn()} />);

      const titleEnInput = screen.getByPlaceholderText('Article title in English...');
      fireEvent.input(titleEnInput, { target: { value: 'Heatwaves Impact on Respiratory Health' } });

      expect(titleEnInput.value).toBe('Heatwaves Impact on Respiratory Health');
    });

    it('selecting category updates form state in Arabic', () => {
      const { container } = render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      const categorySelect = container.querySelector('select.aep-select');
      fireEvent.change(categorySelect, { target: { value: 'research' } });

      expect(categorySelect.value).toBe('research');
    });

    it('category dropdown options render in English when lang is en', () => {
      render(<ArticleEditorPage lang="en" onNavigate={vi.fn()} />);

      expect(screen.getByText('Climate & Health')).toBeDefined();
      expect(screen.getByText('Research')).toBeDefined();
      expect(screen.getByText('Opportunities')).toBeDefined();
      expect(screen.getByText('Events')).toBeDefined();
    });

    it('selecting teaser permission dropdown updates teaser_permission_key', () => {
      const { container } = render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      const selects = container.querySelectorAll('select.aep-select');
      const teaserSelect = selects[1]; // second select is teaser permissions

      fireEvent.change(teaserSelect, { target: { value: 'view:free_content' } });
      expect(teaserSelect.value).toBe('view:free_content');
    });

    it('selecting full access permission dropdown updates full_access_permission_key', () => {
      const { container } = render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      const selects = container.querySelectorAll('select.aep-select');
      const fullAccessSelect = selects[2]; // third select is full access

      fireEvent.change(fullAccessSelect, { target: { value: 'view:all_courses' } });
      expect(fullAccessSelect.value).toBe('view:all_courses');
    });

    it('renders banner header in English when lang is en', () => {
      render(<ArticleEditorPage lang="en" onNavigate={vi.fn()} />);

      expect(screen.getByText('Write New Article')).toBeDefined();
      expect(screen.getByText('Edit and update your article content')).toBeDefined();
    });

    it('clicking "إلغاء" button navigates to news-blog', () => {
      const onNavigate = vi.fn();
      render(<ArticleEditorPage lang="ar" onNavigate={onNavigate} />);

      const cancelBtn = screen.getByText('إلغاء');
      fireEvent.click(cancelBtn);

      expect(onNavigate).toHaveBeenCalledWith('news-blog');
    });

    it('displays user profile avatar in author details block if available', () => {
      setMockAuth({ role: 'admin' });

      const { container } = render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      const avatarImg = container.querySelector('img[alt="Author avatar"]');
      expect(avatarImg).not.toBeNull();
      expect(avatarImg.src).toBe('https://cdn.climamedix.org/avatars/sami.webp');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. RichTextEditor Integration & Validation (8 Tests)
  // ──────────────────────────────────────────────────────────────────────────
  describe('3. RichTextEditor Integration & Validation (8 Tests)', () => {
    it('validates that Arabic title is required before publishing', () => {
      render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      const publishBtn = screen.getByText('نشر المقال');
      fireEvent.click(publishBtn);

      expect(screen.getByText('العنوان العربي مطلوب')).toBeDefined();
      expect(mockInsertArticle).not.toHaveBeenCalled();
    });

    it('validates that article content is required before publishing', () => {
      render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      const titleArInput = screen.getByPlaceholderText('عنوان المقال بالعربية...');
      fireEvent.input(titleArInput, { target: { value: 'عنوان تجريبي' } });

      const publishBtn = screen.getByText('نشر المقال');
      fireEvent.click(publishBtn);

      expect(screen.getByText('محتوى المقال مطلوب')).toBeDefined();
      expect(mockInsertArticle).not.toHaveBeenCalled();
    });

    it('rejects Quill empty paragraph "<p><br></p>" as empty content', () => {
      render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      const titleArInput = screen.getByPlaceholderText('عنوان المقال بالعربية...');
      fireEvent.input(titleArInput, { target: { value: 'عنوان تجريبي' } });

      const editor = screen.getByTestId('editor-textarea');
      fireEvent.input(editor, { target: { value: '<p><br></p>' } });

      const publishBtn = screen.getByText('نشر المقال');
      fireEvent.click(publishBtn);

      expect(screen.getByText('محتوى المقال مطلوب')).toBeDefined();
    });

    it('displays alert if user attempts to publish while media is uploading', () => {
      render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      // Simulate media upload in progress
      const startUploadBtn = screen.getByTestId('trigger-media-uploading');
      fireEvent.click(startUploadBtn);

      const publishBtn = screen.getByText('نشر المقال');
      fireEvent.click(publishBtn);

      expect(window.alert).toHaveBeenCalledWith('جاري رفع الملفات، يرجى الانتظار.');
      expect(mockInsertArticle).not.toHaveBeenCalled();
    });

    it('displays alert in English if user attempts to publish while media is uploading with lang=en', () => {
      render(<ArticleEditorPage lang="en" onNavigate={vi.fn()} />);

      const startUploadBtn = screen.getByTestId('trigger-media-uploading');
      fireEvent.click(startUploadBtn);

      const publishBtn = screen.getByText('Publish Article');
      fireEvent.click(publishBtn);

      expect(window.alert).toHaveBeenCalledWith('Media is still uploading, please wait.');
    });

    it('RichTextEditor textarea updates content state correctly', () => {
      render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      const editor = screen.getByTestId('editor-textarea');
      fireEvent.input(editor, { target: { value: '<p>تحديثات مؤتمر المناخ والصحة السنوي</p>' } });

      expect(editor.value).toBe('<p>تحديثات مؤتمر المناخ والصحة السنوي</p>');
    });

    it('renders RichTextEditor with rtl direction when lang is ar', () => {
      render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      const editorWrap = screen.getByTestId('mock-rich-editor');
      expect(editorWrap.getAttribute('dir')).toBe('rtl');
    });

    it('renders RichTextEditor with ltr direction when lang is en', () => {
      render(<ArticleEditorPage lang="en" onNavigate={vi.fn()} />);

      const editorWrap = screen.getByTestId('mock-rich-editor');
      expect(editorWrap.getAttribute('dir')).toBe('ltr');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Cover Image / Thumbnail Upload Lifecycle (10 Tests)
  // ──────────────────────────────────────────────────────────────────────────
  describe('4. Cover Image / Thumbnail Upload Lifecycle (10 Tests)', () => {
    it('displays dropzone placeholder "ألصق أو اسحب صورة هنا" when no thumbnail is loaded', () => {
      render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      expect(screen.getByText('ألصق أو اسحب صورة هنا')).toBeDefined();
      expect(screen.getByText('أو انقر للرفع')).toBeDefined();
    });

    it('clicking dropzone triggers click on hidden file input', () => {
      const { container } = render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      const fileInput = container.querySelector('input[type="file"]');
      const clickSpy = vi.spyOn(fileInput, 'click');

      const dropZone = container.querySelector('.aep-thumb-zone');
      fireEvent.click(dropZone);

      expect(clickSpy).toHaveBeenCalledTimes(1);
    });

    it('selecting an image file sets thumbnail preview', async () => {
      const { container } = render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      const fileInput = container.querySelector('input[type="file"]');
      const fakeImage = new File(['bits'], 'cover.webp', { type: 'image/webp' });

      fireEvent.change(fileInput, { target: { files: [fakeImage] } });

      await waitFor(() => {
        const preview = container.querySelector('img.aep-thumb-preview');
        expect(preview).not.toBeNull();
        expect(preview.src).toContain('blob:');
      });
    });

    it('dragging over dropzone adds drag-over class and dragLeave removes it', () => {
      const { container } = render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      const dropZone = container.querySelector('.aep-thumb-zone');

      fireEvent.dragOver(dropZone);
      expect(dropZone.classList.contains('drag-over')).toBe(true);

      fireEvent.dragLeave(dropZone);
      expect(dropZone.classList.contains('drag-over')).toBe(false);
    });

    it('dropping an image file updates thumbnail preview', async () => {
      const { container } = render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      const dropZone = container.querySelector('.aep-thumb-zone');
      const fakeImage = new File(['bits'], 'dropped.webp', { type: 'image/webp' });

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [fakeImage] }
      });

      await waitFor(() => {
        const preview = container.querySelector('img.aep-thumb-preview');
        expect(preview).not.toBeNull();
      });
    });

    it('dropping non-image file is ignored', async () => {
      const { container } = render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      const dropZone = container.querySelector('.aep-thumb-zone');
      const textFile = new File(['text'], 'notes.txt', { type: 'text/plain' });

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [textFile] }
      });

      expect(container.querySelector('img.aep-thumb-preview')).toBeNull();
    });

    it('pasting image file from clipboard updates thumbnail preview', async () => {
      const { container } = render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      const dropZone = container.querySelector('.aep-thumb-zone');
      const fakeImage = new File(['bits'], 'pasted.webp', { type: 'image/webp' });

      fireEvent.paste(dropZone, {
        clipboardData: {
          items: [{
            type: 'image/webp',
            getAsFile: () => fakeImage
          }]
        }
      });

      await waitFor(() => {
        expect(container.querySelector('img.aep-thumb-preview')).not.toBeNull();
      });
    });

    it('clicking remove thumbnail button clears preview and file state', async () => {
      const { container } = render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      const fileInput = container.querySelector('input[type="file"]');
      const fakeImage = new File(['bits'], 'cover.webp', { type: 'image/webp' });
      fireEvent.change(fileInput, { target: { files: [fakeImage] } });

      await waitFor(() => {
        expect(container.querySelector('img.aep-thumb-preview')).not.toBeNull();
      });

      const removeBtn = container.querySelector('button.aep-thumb-remove');
      fireEvent.click(removeBtn);

      expect(container.querySelector('img.aep-thumb-preview')).toBeNull();
      expect(screen.getByText('ألصق أو اسحب صورة هنا')).toBeDefined();
    });

    it('publishing with thumbnail uploads image to R2 "article_thumbnails" folder', async () => {
      const { container } = render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      // Fill required fields
      fireEvent.input(screen.getByPlaceholderText('عنوان المقال بالعربية...'), {
        target: { value: 'عنوان مع صورة' }
      });
      fireEvent.input(screen.getByTestId('editor-textarea'), {
        target: { value: '<p>محتوى المقال الكامل مع صورة توضيحية</p>' }
      });

      // Attach thumbnail
      const fileInput = container.querySelector('input[type="file"]');
      const fakeImage = new File(['bits'], 'cover-photo.webp', { type: 'image/webp' });
      fireEvent.change(fileInput, { target: { files: [fakeImage] } });

      await waitFor(() => {
        expect(container.querySelector('img.aep-thumb-preview')).not.toBeNull();
      });

      const publishBtn = screen.getByText('نشر المقال');
      fireEvent.click(publishBtn);

      await waitFor(() => {
        expect(mockUploadFileToR2).toHaveBeenCalledWith(expect.any(File), 'article_thumbnails');
      });
    });

    it('displays error if thumbnail upload to R2 fails', async () => {
      mockUploadFileToR2.mockRejectedValueOnce(new Error('Cloudflare S3 Network Timeout'));

      const { container } = render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      fireEvent.input(screen.getByPlaceholderText('عنوان المقال بالعربية...'), {
        target: { value: 'عنوان تجريبي' }
      });
      fireEvent.input(screen.getByTestId('editor-textarea'), {
        target: { value: '<p>محتوى المقال</p>' }
      });

      const fileInput = container.querySelector('input[type="file"]');
      const fakeImage = new File(['bits'], 'cover.webp', { type: 'image/webp' });
      fireEvent.change(fileInput, { target: { files: [fakeImage] } });

      await waitFor(() => {
        expect(container.querySelector('img.aep-thumb-preview')).not.toBeNull();
      });

      const publishBtn = screen.getByText('نشر المقال');
      fireEvent.click(publishBtn);

      await waitFor(() => {
        expect(screen.getByText('Cloudflare S3 Network Timeout')).toBeDefined();
      });
    });

    it('blocks publishing when media is still uploading, disables publish button and shows spinner', async () => {
      const { container } = render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      fireEvent.input(screen.getByPlaceholderText('عنوان المقال بالعربية...'), {
        target: { value: 'مقال قيد الرفع' }
      });
      fireEvent.input(screen.getByTestId('editor-textarea'), {
        target: { value: '<p>محتوى قيد الرفع</p>' }
      });

      // Simulate media upload in progress
      fireEvent.click(screen.getByTestId('trigger-media-uploading'));

      const publishBtn = container.querySelector('.aep-btn-publish');
      expect(publishBtn).toBeDisabled();
      expect(container.querySelector('.aep-spinner')).toBeInTheDocument();

      // Stop uploading and verify publish is now unblocked
      fireEvent.click(screen.getByTestId('stop-media-uploading'));
      expect(publishBtn).not.toBeDisabled();
      expect(container.querySelector('.aep-spinner')).toBeNull();

      fireEvent.click(publishBtn);

      await waitFor(() => {
        expect(mockInsertArticle).toHaveBeenCalledTimes(1);
      });
    });

    it('supports Ctrl+V paste interaction on dropzone with image clipboard data', async () => {
      const clipboardBlob = new Blob(['pasted-img-data'], { type: 'image/webp' });
      const readSpy = vi.fn().mockResolvedValue([
        {
          types: ['image/webp'],
          getType: vi.fn().mockResolvedValue(clipboardBlob)
        }
      ]);
      Object.assign(navigator, {
        clipboard: { read: readSpy }
      });

      const { container } = render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);
      const dropZone = container.querySelector('.aep-thumb-zone');

      fireEvent.keyDown(dropZone, { key: 'v', ctrlKey: true });

      await waitFor(() => {
        expect(readSpy).toHaveBeenCalled();
        expect(container.querySelector('img.aep-thumb-preview')).not.toBeNull();
      });
    });

    it('retains existing cover image when editing an existing article without selecting a new thumbnail', async () => {
      setMockAuth({ role: 'admin', userId: 'usr-editor-1' });
      mockArticleRecords['art-with-thumb'] = {
        id: 'art-with-thumb',
        title_ar: 'مقال قديم مع صورة',
        title_en: 'Old Article With Photo',
        content_ar: '<p>محتوى قديم</p>',
        content_en: '<p>Old content</p>',
        category: 'general',
        cover_image: 'https://cdn.climamedix.org/article_thumbnails/retained-image.webp',
        created_by: 'usr-editor-1'
      };

      window.history.replaceState({}, '', '/?id=art-with-thumb');

      render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      await screen.findByDisplayValue('مقال قديم مع صورة');

      const publishBtn = screen.getByText('حفظ التعديلات');
      fireEvent.click(publishBtn);

      await waitFor(() => {
        expect(mockUpdateArticle).toHaveBeenCalledTimes(1);
      });

      // R2 upload was NOT triggered since no new file was chosen
      expect(mockUploadFileToR2).not.toHaveBeenCalled();
      const updatedData = mockUpdateArticle.mock.calls[0][0];
      expect(updatedData.cover_image).toBe('https://cdn.climamedix.org/article_thumbnails/retained-image.webp');
    });

    it('replaces existing cover image when editing an article and selecting a new thumbnail', async () => {
      setMockAuth({ role: 'admin', userId: 'usr-editor-1' });
      mockArticleRecords['art-replace-thumb'] = {
        id: 'art-replace-thumb',
        title_ar: 'مقال لتغيير الصورة',
        title_en: 'Article To Replace Photo',
        content_ar: '<p>محتوى</p>',
        content_en: '<p>Content</p>',
        category: 'general',
        cover_image: 'https://cdn.climamedix.org/article_thumbnails/old.webp',
        created_by: 'usr-editor-1'
      };

      window.history.replaceState({}, '', '/?id=art-replace-thumb');

      const { container } = render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);
      await screen.findByDisplayValue('مقال لتغيير الصورة');

      // Pick new image
      const fileInput = container.querySelector('input[type="file"]');
      const newImage = new File(['new-bits'], 'brand_new_cover.webp', { type: 'image/webp' });
      fireEvent.change(fileInput, { target: { files: [newImage] } });

      await waitFor(() => {
        expect(container.querySelector('img.aep-thumb-preview')).not.toBeNull();
      });

      const publishBtn = screen.getByText('حفظ التعديلات');
      fireEvent.click(publishBtn);

      await waitFor(() => {
        expect(mockUploadFileToR2).toHaveBeenCalledWith(expect.any(File), 'article_thumbnails');
        expect(mockUpdateArticle).toHaveBeenCalledTimes(1);
      });

      const updatedData = mockUpdateArticle.mock.calls[0][0];
      expect(updatedData.cover_image).toContain('article_thumbnails');
    });

    it('renders English placeholders and upload text when lang is en', () => {
      render(<ArticleEditorPage lang="en" onNavigate={vi.fn()} />);

      expect(screen.getByText('Paste or drag image here')).toBeInTheDocument();
      expect(screen.getByText('or click to upload')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Article title in English...')).toBeInTheDocument();
      expect(screen.getByText('Publish Article')).toBeInTheDocument();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Database Mutation & Publishing (Supabase) (10 Tests)
  // ──────────────────────────────────────────────────────────────────────────
  describe('5. Database Mutation & Publishing (Supabase) (10 Tests)', () => {
    it('creates new article with created_by=user.id in Supabase news_articles', async () => {
      setMockAuth({ role: 'admin', userId: 'usr-admin-123', fullName: 'د. ياسمين' });

      render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      fireEvent.input(screen.getByPlaceholderText('عنوان المقال بالعربية...'), {
        target: { value: 'التغير المناخي وأثره الصحي' }
      });
      fireEvent.input(screen.getByPlaceholderText('Article title in English...'), {
        target: { value: 'Climate Change Health Impact' }
      });
      fireEvent.input(screen.getByTestId('editor-textarea'), {
        target: { value: '<p>تحليل شامل لأثر درجات الحرارة</p>' }
      });

      const publishBtn = screen.getByText('نشر المقال');
      fireEvent.click(publishBtn);

      await waitFor(() => {
        expect(mockInsertArticle).toHaveBeenCalledTimes(1);
        const [rows] = mockInsertArticle.mock.calls[0];
        expect(rows[0].title_ar).toBe('التغير المناخي وأثره الصحي');
        expect(rows[0].title_en).toBe('Climate Change Health Impact');
        expect(rows[0].created_by).toBe('usr-admin-123');
        expect(rows[0].author_name).toBe('د. ياسمين');
      });
    });

    it('updating an existing article calls supabase update and filters by id', async () => {
      setMockAuth({ role: 'admin', userId: 'usr-admin-1' });
      mockArticleRecords['art-to-update'] = {
        id: 'art-to-update',
        title_ar: 'العنوان القديم',
        content_ar: '<p>المحتوى القديم</p>',
        created_by: 'usr-original-creator'
      };

      window.history.replaceState({}, '', '/?id=art-to-update');

      render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('العنوان القديم')).toBeDefined();
      });

      const titleInput = screen.getByPlaceholderText('عنوان المقال بالعربية...');
      fireEvent.input(titleInput, { target: { value: 'العنوان الجديد والمحدث' } });

      const saveBtn = screen.getByText('حفظ التعديلات');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockUpdateArticle).toHaveBeenCalledTimes(1);
        const [payload, articleId] = mockUpdateArticle.mock.calls[0];
        expect(articleId).toBe('art-to-update');
        expect(payload.title_ar).toBe('العنوان الجديد والمحدث');
        expect(payload.created_by).toBeUndefined(); // preserves original creator
      });
    });

    it('displays "تم نشر المقال بنجاح!" banner upon successful creation', async () => {
      render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      fireEvent.input(screen.getByPlaceholderText('عنوان المقال بالعربية...'), {
        target: { value: 'عنوان جديد' }
      });
      fireEvent.input(screen.getByTestId('editor-textarea'), {
        target: { value: '<p>محتوى المقال</p>' }
      });

      const publishBtn = screen.getByText('نشر المقال');
      fireEvent.click(publishBtn);

      await waitFor(() => {
        expect(screen.getByText('تم نشر المقال بنجاح!')).toBeDefined();
      });
    });

    it('displays "Article published successfully!" in English', async () => {
      render(<ArticleEditorPage lang="en" onNavigate={vi.fn()} />);

      fireEvent.input(screen.getByPlaceholderText('عنوان المقال بالعربية...'), {
        target: { value: 'عنوان عربي' }
      });
      fireEvent.input(screen.getByTestId('editor-textarea'), {
        target: { value: '<p>English Article Content</p>' }
      });

      const publishBtn = screen.getByText('Publish Article');
      fireEvent.click(publishBtn);

      await waitFor(() => {
        expect(screen.getByText('Article published successfully!')).toBeDefined();
      });
    });

    it('displays "تم تحديث المقال بنجاح!" when updating an existing article', async () => {
      mockArticleRecords['art-123'] = {
        id: 'art-123',
        title_ar: 'مقال منشور',
        content_ar: '<p>المحتوى الأصلي</p>',
        created_by: 'usr-admin-1'
      };
      window.history.replaceState({}, '', '/?id=art-123');

      render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('مقال منشور')).toBeDefined();
      });

      const saveBtn = screen.getByText('حفظ التعديلات');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText('تم تحديث المقال بنجاح!')).toBeDefined();
      });
    });

    it('displays spinner and disables publish button while saving=true', async () => {
      mockInsertArticle.mockImplementationOnce(() => new Promise(() => {})); // pending

      const { container } = render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      fireEvent.input(screen.getByPlaceholderText('عنوان المقال بالعربية...'), {
        target: { value: 'عنوان قيد الحفظ' }
      });
      fireEvent.input(screen.getByTestId('editor-textarea'), {
        target: { value: '<p>محتوى المقال</p>' }
      });

      const publishBtn = screen.getByText('نشر المقال');
      fireEvent.click(publishBtn);

      await waitFor(() => {
        expect(publishBtn.hasAttribute('disabled')).toBe(true);
        expect(container.querySelector('.aep-spinner')).not.toBeNull();
      });
    });

    it('displays database error message if Supabase insert fails', async () => {
      mockInsertArticle.mockImplementationOnce(() => {
        throw new Error('Database RLS Policy Violation');
      });

      render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      fireEvent.input(screen.getByPlaceholderText('عنوان المقال بالعربية...'), {
        target: { value: 'عنوان تجريبي' }
      });
      fireEvent.input(screen.getByTestId('editor-textarea'), {
        target: { value: '<p>محتوى المقال</p>' }
      });

      const publishBtn = screen.getByText('نشر المقال');
      fireEvent.click(publishBtn);

      await waitFor(() => {
        expect(screen.getByText('Database RLS Policy Violation')).toBeDefined();
      });
    });

    it('navigates to news page after successful publishing', async () => {
      vi.useFakeTimers();
      const onNavigate = vi.fn();

      render(<ArticleEditorPage lang="ar" onNavigate={onNavigate} />);

      fireEvent.input(screen.getByPlaceholderText('عنوان المقال بالعربية...'), {
        target: { value: 'عنوان النشر' }
      });
      fireEvent.input(screen.getByTestId('editor-textarea'), {
        target: { value: '<p>محتوى مقال جديد</p>' }
      });

      const publishBtn = screen.getByText('نشر المقال');
      fireEvent.click(publishBtn);

      // Fast-forward success timer
      await vi.advanceTimersByTimeAsync(2100);

      expect(onNavigate).toHaveBeenCalledWith('news');
      vi.useRealTimers();
    });

    it('payload includes both content_ar and content_en', async () => {
      render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      fireEvent.input(screen.getByPlaceholderText('عنوان المقال بالعربية...'), {
        target: { value: 'عنوان ثنائي' }
      });
      fireEvent.input(screen.getByTestId('editor-textarea'), {
        target: { value: '<p>محتوى مشترك</p>' }
      });

      const publishBtn = screen.getByText('نشر المقال');
      fireEvent.click(publishBtn);

      await waitFor(() => {
        const [rows] = mockInsertArticle.mock.calls[0];
        expect(rows[0].content_ar).toBe('<p>محتوى مشترك</p>');
        expect(rows[0].content_en).toBe('<p>محتوى مشترك</p>');
      });
    });

    it('payload includes permission keys for teaser and full access', async () => {
      render(<ArticleEditorPage lang="ar" onNavigate={vi.fn()} />);

      fireEvent.input(screen.getByPlaceholderText('عنوان المقال بالعربية...'), {
        target: { value: 'عنوان الصلاحيات' }
      });
      fireEvent.input(screen.getByTestId('editor-textarea'), {
        target: { value: '<p>محتوى الصلاحيات</p>' }
      });

      const publishBtn = screen.getByText('نشر المقال');
      fireEvent.click(publishBtn);

      await waitFor(() => {
        const [rows] = mockInsertArticle.mock.calls[0];
        expect(rows[0].teaser_permission_key).toBe('view:public_content');
        expect(rows[0].full_access_permission_key).toBe('view:free_content');
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. NewsFeed & Category Filtering (7 Tests)
  // ──────────────────────────────────────────────────────────────────────────
  describe('6. NewsFeed & Category Filtering (7 Tests)', () => {
    const mockArticles = [
      {
        id: 'art-1',
        title: 'أثر موجات الحر على الربو',
        summary: 'دراسة حديثة في الأردن...',
        categoryKey: 'المناخ والصحة',
        category: 'المناخ والصحة',
        author: 'د. خالد',
        date: '2026-05-10',
        views_count: 140,
        likes_count: 25,
        created_by: 'usr-1'
      },
      {
        id: 'art-2',
        title: 'منحة بحثية في التغير المناخي',
        summary: 'فرصة تمويل لأبحاث البيئة والصحة...',
        categoryKey: 'فرص وتطوير',
        category: 'فرص وتطوير',
        author: 'د. رانيا',
        date: '2026-06-01',
        views_count: 95,
        likes_count: 18,
        created_by: 'usr-2'
      }
    ];

    it('NewsFeed dynamically renders category filter buttons matching available articles', () => {
      render(<NewsFeed articles={mockArticles} lang="ar" onReadArticle={vi.fn()} />);

      expect(screen.getByText('الكل')).toBeDefined();
      expect(screen.getAllByText('المناخ والصحة').length).toBeGreaterThan(0);
      expect(screen.getAllByText('فرص وتطوير').length).toBeGreaterThan(0);
      // Categories with 0 articles are NOT rendered dynamically
      expect(screen.queryByText('الأبحاث والابتكار')).toBeNull();
      expect(screen.queryByText('فعاليات ومؤتمرات')).toBeNull();
    });

    it('dynamically generates category filter chips when new article category is added', () => {
      const articlesWithResearch = [
        ...mockArticles,
        {
          id: 'art-3',
          title: 'بحث جديد في الطاقة والبيئة',
          summary: 'ملخص البحث...',
          categoryKey: 'الأبحاث والابتكار',
          category: 'الأبحاث والابتكار',
          author: 'د. سامي',
          date: '2026-06-15',
          views_count: 50,
          likes_count: 10,
          created_by: 'usr-3'
        }
      ];
      render(<NewsFeed articles={articlesWithResearch} lang="ar" onReadArticle={vi.fn()} />);
      expect(screen.getAllByText('الأبحاث والابتكار').length).toBeGreaterThanOrEqual(2);
    });

    it('renders all articles when "الكل" filter is active', () => {
      render(<NewsFeed articles={mockArticles} lang="ar" onReadArticle={vi.fn()} />);

      expect(screen.getByText('أثر موجات الحر على الربو')).toBeDefined();
      expect(screen.getByText('منحة بحثية في التغير المناخي')).toBeDefined();
    });

    it('clicking "فرص وتطوير" filters to only opportunities articles', () => {
      render(<NewsFeed articles={mockArticles} lang="ar" onReadArticle={vi.fn()} />);

      const oppsBtn = screen.getAllByText('فرص وتطوير')[0];
      fireEvent.click(oppsBtn);

      expect(screen.getByText('منحة بحثية في التغير المناخي')).toBeDefined();
      expect(screen.queryByText('أثر موجات الحر على الربو')).toBeNull();
    });

    it('typing query in search bar filters articles by title', () => {
      render(<NewsFeed articles={mockArticles} lang="ar" onReadArticle={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText('ابحث في الأخبار والمقالات...');
      fireEvent.input(searchInput, { target: { value: 'الربو' } });

      expect(screen.getByText('أثر موجات الحر على الربو')).toBeDefined();
      expect(screen.queryByText('منحة بحثية في التغير المناخي')).toBeNull();
    });

    it('displays empty state placeholder when search query finds 0 matches', () => {
      render(<NewsFeed articles={mockArticles} lang="ar" onReadArticle={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText('ابحث في الأخبار والمقالات...');
      fireEvent.input(searchInput, { target: { value: 'استعلام غير موجود' } });

      expect(screen.getByText('لا توجد مقالات تطابق بحثك حالياً.')).toBeDefined();
    });

    it('displays empty state placeholder in English when lang is en and search finds 0 matches', () => {
      render(<NewsFeed articles={mockArticles} lang="en" onReadArticle={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText('Search news & articles...');
      fireEvent.input(searchInput, { target: { value: 'nonexistent query' } });

      expect(screen.getByText('No articles match your search.')).toBeDefined();
    });

    it('allows searching in Arabic when English is selected as the language', () => {
      const bilingualArticles = [
        {
          id: 'art-en-1',
          title: 'Impact of Heatwaves on Asthma',
          title_ar: 'أثر موجات الحر على الربو',
          title_en: 'Impact of Heatwaves on Asthma',
          summary: 'A study conducted in Jordan...',
          content_ar: 'دراسة حديثة في الأردن عن موجات الحر...',
          content_en: 'A study conducted in Jordan about heatwaves...',
          categoryKey: 'المناخ والصحة',
          category: 'Climate & Health',
          author: 'Dr. Khaled',
          date: '2026-05-10',
          created_by: 'usr-1'
        },
        {
          id: 'art-en-2',
          title: 'Climate Change Grant',
          title_ar: 'منحة بحثية في التغير المناخي',
          title_en: 'Climate Change Grant',
          summary: 'Funding opportunity...',
          content_ar: 'فرصة تمويل لأبحاث البيئة...',
          content_en: 'Funding opportunity for environmental research...',
          categoryKey: 'فرص وتطوير',
          category: 'Opportunities & Dev',
          author: 'Dr. Rania',
          date: '2026-06-01',
          created_by: 'usr-2'
        }
      ];

      render(<NewsFeed articles={bilingualArticles} lang="en" onReadArticle={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText('Search news & articles...');
      // Type Arabic query in English mode
      fireEvent.input(searchInput, { target: { value: 'موجات' } });

      // Should find the heatwaves article
      expect(screen.getByText('Impact of Heatwaves on Asthma')).toBeDefined();
      expect(screen.queryByText('Climate Change Grant')).toBeNull();
    });

    it('normalizes Arabic characters (hamza, taa marbuta) during search', () => {
      const bilingualArticles = [
        {
          id: 'art-norm-1',
          title: 'تأثير درجات الحرارة على الصحة',
          title_ar: 'تأثير درجات الحرارة على الصحة',
          title_en: 'Temperature effect on health',
          summary: 'دراسة شاملة...',
          categoryKey: 'المناخ والصحة',
          category: 'المناخ والصحة',
          author: 'د. يوسف',
          date: '2026-05-10'
        }
      ];

      render(<NewsFeed articles={bilingualArticles} lang="ar" onReadArticle={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText('ابحث في الأخبار والمقالات...');
      // Query without hamza: "تاثير" matches "تأثير"
      fireEvent.input(searchInput, { target: { value: 'تاثير' } });
      expect(screen.getByText('تأثير درجات الحرارة على الصحة')).toBeDefined();

      // Query with haa instead of taa marbuta: "الصحه" matches "الصحة"
      fireEvent.input(searchInput, { target: { value: 'الصحه' } });
      expect(screen.getByText('تأثير درجات الحرارة على الصحة')).toBeDefined();
    });

    it('clicking article card triggers onReadArticle with article object', () => {
      const onRead = vi.fn();
      render(<NewsFeed articles={mockArticles} lang="ar" onReadArticle={onRead} />);

      const readMoreBtn = screen.getAllByText('اقرأ المزيد')[0];
      fireEvent.click(readMoreBtn);

      expect(onRead).toHaveBeenCalledWith(mockArticles[0]);
    });

    it('ArticleCard renders views and likes counts with icons', () => {
      render(
        <ArticleCard
          title="مقال إحصائيات"
          category="المناخ والصحة"
          views_count={350}
          likes_count={42}
          author="د. سامي"
          date="15 مايو 2026"
        />
      );

      expect(screen.getByText('350')).toBeDefined();
      expect(screen.getByText('42')).toBeDefined();
      expect(screen.getByText('بواسطة: د. سامي')).toBeDefined();
    });

    it('orders categories by number of articles descending and caps at 4 with 5th as "أخرى"', () => {
      const multiCategoryArticles = [
        // Category A: 4 articles
        { id: '1', title: 'A1', summary: 's', categoryKey: 'المناخ والصحة', category: 'المناخ والصحة', author: 'a', date: 'd' },
        { id: '2', title: 'A2', summary: 's', categoryKey: 'المناخ والصحة', category: 'المناخ والصحة', author: 'a', date: 'd' },
        { id: '3', title: 'A3', summary: 's', categoryKey: 'المناخ والصحة', category: 'المناخ والصحة', author: 'a', date: 'd' },
        { id: '4', title: 'A4', summary: 's', categoryKey: 'المناخ والصحة', category: 'المناخ والصحة', author: 'a', date: 'd' },
        // Category B: 3 articles
        { id: '5', title: 'B1', summary: 's', categoryKey: 'الأبحاث والابتكار', category: 'الأبحاث والابتكار', author: 'a', date: 'd' },
        { id: '6', title: 'B2', summary: 's', categoryKey: 'الأبحاث والابتكار', category: 'الأبحاث والابتكار', author: 'a', date: 'd' },
        { id: '7', title: 'B3', summary: 's', categoryKey: 'الأبحاث والابتكار', category: 'الأبحاث والابتكار', author: 'a', date: 'd' },
        // Category C: 2 articles
        { id: '8', title: 'C1', summary: 's', categoryKey: 'فرص وتطوير', category: 'فرص وتطوير', author: 'a', date: 'd' },
        { id: '9', title: 'C2', summary: 's', categoryKey: 'فرص وتطوير', category: 'فرص وتطوير', author: 'a', date: 'd' },
        // Category D: 2 articles
        { id: '10', title: 'D1', summary: 's', categoryKey: 'فعاليات ومؤتمرات', category: 'فعاليات ومؤتمرات', author: 'a', date: 'd' },
        { id: '11', title: 'D2', summary: 's', categoryKey: 'فعاليات ومؤتمرات', category: 'فعاليات ومؤتمرات', author: 'a', date: 'd' },
        // Category E: 1 article (should be grouped under "أخرى")
        { id: '12', title: 'E1', summary: 's', categoryKey: 'السياسات البيئية', category: 'السياسات البيئية', author: 'a', date: 'd' },
        // Category F: 1 article (should be grouped under "أخرى")
        { id: '13', title: 'F1', summary: 's', categoryKey: 'المدن المستدامة', category: 'المدن المستدامة', author: 'a', date: 'd' },
      ];

      const { container } = render(<NewsFeed articles={multiCategoryArticles} lang="ar" onReadArticle={vi.fn()} />);

      const filterButtons = Array.from(container.querySelectorAll('.search-filter-tag')).map(b => b.textContent.trim());
      expect(filterButtons).toEqual([
        'الكل',
        'المناخ والصحة',
        'الأبحاث والابتكار',
        'فرص وتطوير',
        'فعاليات ومؤتمرات',
        'أخرى'
      ]);

      expect(filterButtons.includes('السياسات البيئية')).toBe(false);
      expect(filterButtons.includes('المدن المستدامة')).toBe(false);
    });

    it('clicking "أخرى" filters to articles in the 5th and subsequent categories', () => {
      const multiCategoryArticles = [
        { id: '1a', title: 'مقال مناخ رئيسي 1', summary: 's', categoryKey: 'المناخ والصحة', category: 'المناخ والصحة', author: 'a', date: 'd' },
        { id: '1b', title: 'مقال مناخ رئيسي 2', summary: 's', categoryKey: 'المناخ والصحة', category: 'المناخ والصحة', author: 'a', date: 'd' },
        { id: '2a', title: 'مقال بحث علمي 1', summary: 's', categoryKey: 'الأبحاث والابتكار', category: 'الأبحاث والابتكار', author: 'a', date: 'd' },
        { id: '2b', title: 'مقال بحث علمي 2', summary: 's', categoryKey: 'الأبحاث والابتكار', category: 'الأبحاث والابتكار', author: 'a', date: 'd' },
        { id: '3a', title: 'مقال فرص عمل 1', summary: 's', categoryKey: 'فرص وتطوير', category: 'فرص وتطوير', author: 'a', date: 'd' },
        { id: '3b', title: 'مقال فرص عمل 2', summary: 's', categoryKey: 'فرص وتطوير', category: 'فرص وتطوير', author: 'a', date: 'd' },
        { id: '4a', title: 'مقال مؤتمر بيئي 1', summary: 's', categoryKey: 'فعاليات ومؤتمرات', category: 'فعاليات ومؤتمرات', author: 'a', date: 'd' },
        { id: '4b', title: 'مقال مؤتمر بيئي 2', summary: 's', categoryKey: 'فعاليات ومؤتمرات', category: 'فعاليات ومؤتمرات', author: 'a', date: 'd' },
        { id: '5', title: 'مقال سياسات خضراء نادرة', summary: 's', categoryKey: 'السياسات البيئية', category: 'السياسات البيئية', author: 'a', date: 'd' },
      ];

      render(<NewsFeed articles={multiCategoryArticles} lang="ar" onReadArticle={vi.fn()} />);

      const otherBtn = screen.getByText('أخرى');
      fireEvent.click(otherBtn);

      expect(screen.getByText('مقال سياسات خضراء نادرة')).toBeDefined();
      expect(screen.queryByText('مقال مناخ رئيسي 1')).toBeNull();
    });

    it('renders "Other" for 5th category tag when lang is en', () => {
      const multiCategoryArticles = [
        { id: '1', title: 'A1', summary: 's', categoryKey: 'climate_health', category: 'Climate & Health', author: 'a', date: 'd' },
        { id: '2', title: 'B1', summary: 's', categoryKey: 'research', category: 'Research & Innovation', author: 'a', date: 'd' },
        { id: '3', title: 'C1', summary: 's', categoryKey: 'opportunities', category: 'Opportunities & Dev', author: 'a', date: 'd' },
        { id: '4', title: 'D1', summary: 's', categoryKey: 'events', category: 'Events & Conferences', author: 'a', date: 'd' },
        { id: '5', title: 'E1', summary: 's', categoryKey: 'policy', category: 'Policy', author: 'a', date: 'd' },
      ];

      render(<NewsFeed articles={multiCategoryArticles} lang="en" onReadArticle={vi.fn()} />);

      expect(screen.getByText('Other')).toBeDefined();
    });
  });
});
