import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { SliderManagerPage } from '../features/admin/components/SliderManagerPage';
import * as AuthModule from '../features/auth/hooks/useAuth';

// Mock S3 Client
let mockUploadFn = vi.fn();
vi.mock('../utils/s3Client', () => ({
  uploadFileToR2: (...args) => mockUploadFn(...args)
}));

// Mock Supabase
let mockCourses = [];
let mockNews = [];
let mockEvents = [];
let mockOpportunities = [];
let mockResearch = [];
let mockSlider = [];

let insertCalls = [];
let deleteCalls = [];

vi.mock('../utils/supabaseClient', () => ({
  supabase: {
    from: (table) => ({
      select: vi.fn().mockImplementation(() => {
        const getResult = () => ({
          data: table === 'courses' ? [...mockCourses] :
                table === 'news_articles' ? [...mockNews] :
                table === 'events' ? [...mockEvents] :
                table === 'opportunities' ? [...mockOpportunities] :
                table === 'publications' ? [...mockResearch] :
                table === 'home_slider' ? [...mockSlider] : [],
          error: null
        });
        const p = Promise.resolve(getResult());
        p.order = vi.fn().mockImplementation(() => Promise.resolve(getResult()));
        return p;
      }),
      insert: vi.fn().mockImplementation((payload) => {
        insertCalls.push(payload);
        const item = { id: `slider-${Date.now()}`, ...payload };
        mockSlider.push(item);
        return Promise.resolve({ data: item, error: null });
      }),
      delete: vi.fn().mockImplementation(() => ({
        eq: vi.fn().mockImplementation((field, val) => {
          deleteCalls.push({ field, val });
          mockSlider = mockSlider.filter(item => item[field] !== val);
          return Promise.resolve({ data: null, error: null });
        })
      }))
    })
  }
}));

function setupAuth(hasPerm = true) {
  vi.spyOn(AuthModule, 'useAuth').mockReturnValue({
    user: { id: 'admin-1', email: 'admin@climamedix.org' },
    userProfile: { role: 'admin', full_name: 'مدير الموقع' },
    hasPermission: (perm) => (perm === 'manage:slider' ? hasPerm : false)
  });
}

describe('SliderManagerPage Operations & R2 Upload Matrix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertCalls = [];
    deleteCalls = [];
    mockUploadFn = vi.fn().mockResolvedValue('https://cdn.climamedix.org/slider/uploaded.webp');

    mockCourses = [
      { id: 'c-1', title_ar: 'مساق تدريب الأطباء', title_en: 'Doctor Training Course', cover_image: 'https://cdn.climamedix.org/course.webp', created_at: '2026-01-01' }
    ];
    mockNews = [
      { id: 'n-1', title_ar: 'خبر قمة المناخ', title_en: 'Climate Summit News', cover_image: 'https://cdn.climamedix.org/news.webp', published_at: '2026-02-01' }
    ];
    mockEvents = [
      { id: 'e-1', title_ar: 'مؤتمر التكيف', title_en: 'Adaptation Summit', cover_image: null, created_at: '2026-03-01' }
    ];
    mockOpportunities = [
      { id: 'o-1', title_ar: 'منحة بحثية بيئية', title_en: 'Eco Research Grant', image_url: 'https://cdn.climamedix.org/grant.webp', created_at: '2026-04-01' }
    ];
    mockResearch = [
      { id: 'r-1', title_ar: 'ورقة بحثية طبية', title_en: 'Medical Research Paper', created_at: '2026-05-01' }
    ];
    mockSlider = [
      { id: 's-1', entity_type: 'course', entity_id: 'c-old', title_ar: 'شريحة الترحيب الرئيسية', title_en: 'Welcome Main Slide', image_url: 'https://cdn.climamedix.org/welcome.webp', link_url: '/welcome', sequence_order: 1 }
    ];
  });

  // 1. Permission Gating
  it('denies access if user lacks manage:slider permission', () => {
    setupAuth(false);
    const { container } = render(<SliderManagerPage lang="ar" onNavigate={vi.fn()} />);

    expect(container.textContent).toContain("Access Denied. You do not have the 'manage:slider' permission.");
  });

  // 2. Initial Data Loading & Inventory Display
  it('renders active slides and content inventory in Arabic', async () => {
    setupAuth(true);
    render(<SliderManagerPage lang="ar" onNavigate={vi.fn()} />);

    // Header & Section titles
    expect(screen.getByText('إدارة واجهة الرئيسية (Slider Manager)')).toBeInTheDocument();
    expect(screen.getByText('الشرائح النشطة حالياً')).toBeInTheDocument();

    // Active slide
    await waitFor(() => {
      expect(screen.getByText('شريحة الترحيب الرئيسية')).toBeInTheDocument();
    });

    // Inventory content table
    expect(await screen.findByText('مساق تدريب الأطباء')).toBeInTheDocument();
    expect(await screen.findByText('خبر قمة المناخ')).toBeInTheDocument();
    expect(await screen.findByText('مؤتمر التكيف')).toBeInTheDocument();
    expect(await screen.findByText('منحة بحثية بيئية')).toBeInTheDocument();
    const noCoverBadges = await screen.findAllByText('No Cover Image');
    expect(noCoverBadges.length).toBeGreaterThanOrEqual(1);
  });

  it('renders empty message when active slider items array is empty', async () => {
    setupAuth(true);
    mockSlider = [];
    render(<SliderManagerPage lang="ar" onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('لا يوجد محتوى في واجهة الرئيسية حالياً.')).toBeInTheDocument();
    });
  });

  it('renders English headings and content when lang is en', async () => {
    setupAuth(true);
    render(<SliderManagerPage lang="en" onNavigate={vi.fn()} />);

    expect(screen.getByText('Homepage Slider Manager')).toBeInTheDocument();
    expect(screen.getByText('Currently Active on Homepage')).toBeInTheDocument();
    expect(screen.getByText('Custom Announcement')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Welcome Main Slide')).toBeInTheDocument();
      expect(screen.getByText('Doctor Training Course')).toBeInTheDocument();
      expect(screen.getByText('Climate Summit News')).toBeInTheDocument();
    });
  });

  // 3. Search & Type Filtering
  it('filters content inventory table by search text', async () => {
    setupAuth(true);
    const { container } = render(<SliderManagerPage lang="ar" onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('خبر قمة المناخ')).toBeInTheDocument();
    });

    const searchInput = container.querySelector('input[placeholder="بحث..."]');
    fireEvent.input(searchInput, { target: { value: 'قمة' } });

    expect(screen.getByText('خبر قمة المناخ')).toBeInTheDocument();
    expect(screen.queryByText('مساق تدريب الأطباء')).toBeNull();
  });

  it('filters content inventory table by entity type dropdown', async () => {
    setupAuth(true);
    const { container } = render(<SliderManagerPage lang="ar" onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('خبر قمة المناخ')).toBeInTheDocument();
    });

    const select = container.querySelector('select');
    fireEvent.change(select, { target: { value: 'research' } });

    expect(screen.getByText('ورقة بحثية طبية')).toBeInTheDocument();
    expect(screen.queryByText('خبر قمة المناخ')).toBeNull();
    expect(screen.queryByText('مساق تدريب الأطباء')).toBeNull();
  });

  // 4. Add to Slider Workflow & Entity Link URL Generation
  it('opens confirm modal when "+ Add to Slider" is clicked and validates required image', async () => {
    setupAuth(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    const { container } = render(<SliderManagerPage lang="ar" onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('ورقة بحثية طبية')).toBeInTheDocument();
    });

    // Research paper has no image -> click add
    const addBtns = container.querySelectorAll('button');
    const researchRowAddBtn = Array.from(addBtns).find(b => b.textContent.includes('+ Add to Slider'));
    fireEvent.click(researchRowAddBtn);

    // Modal appears
    expect(screen.getByText('تأكيد صورة الشريحة')).toBeInTheDocument();

    // Custom image url input is empty
    const imgUrlInput = screen.getByPlaceholderText('https://images.unsplash.com/photo-...');
    fireEvent.input(imgUrlInput, { target: { value: '' } });

    // Try confirm without image
    fireEvent.click(screen.getByText('Confirm & Add'));
    expect(window.alert).toHaveBeenCalledWith('يرجى إرفاق صورة أولاً.');
  });

  it('adds research paper with computed /research-detail link_url to slider', async () => {
    setupAuth(true);
    const { container } = render(<SliderManagerPage lang="ar" onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('ورقة بحثية طبية')).toBeInTheDocument();
    });

    const addButtons = container.querySelectorAll('button');
    const addResearchBtn = Array.from(addButtons).find(b => b.textContent.includes('+ Add to Slider'));
    fireEvent.click(addResearchBtn);

    const imgUrlInput = screen.getByPlaceholderText('https://images.unsplash.com/photo-...');
    fireEvent.input(imgUrlInput, { target: { value: 'https://cdn.climamedix.org/research-cover.webp' } });

    fireEvent.click(screen.getByText('Confirm & Add'));

    await waitFor(() => {
      expect(insertCalls).toHaveLength(1);
    });

    expect(insertCalls[0]).toEqual({
      entity_type: 'research',
      entity_id: 'r-1',
      title_ar: 'ورقة بحثية طبية',
      title_en: 'Medical Research Paper',
      image_url: 'https://cdn.climamedix.org/research-cover.webp',
      link_url: '/research-detail?id=r-1',
      sequence_order: 2
    });
  });

  it('adds news article with computed /article link_url to slider', async () => {
    setupAuth(true);
    const { container } = render(<SliderManagerPage lang="ar" onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('خبر قمة المناخ')).toBeInTheDocument();
    });

    fireEvent.change(container.querySelector('select'), { target: { value: 'news' } });

    const addNewsBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent.includes('+ Add to Slider'));
    fireEvent.click(addNewsBtn);

    // News article already has cover_image prefilled
    fireEvent.click(screen.getByText('Confirm & Add'));

    await waitFor(() => {
      expect(insertCalls).toHaveLength(1);
    });

    expect(insertCalls[0].link_url).toBe('/article?id=n-1');
    expect(insertCalls[0].entity_type).toBe('news');
  });

  // 5. Custom Announcement Flow
  it('opens custom announcement modal, validates title/image and publishes custom slide', async () => {
    setupAuth(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<SliderManagerPage lang="ar" onNavigate={vi.fn()} />);

    // Click "إعلان مخصص"
    fireEvent.click(screen.getByText('إعلان مخصص'));

    expect(screen.getByText('إضافة إعلان مخصص')).toBeInTheDocument();

    // Click Publish without title/image
    fireEvent.click(screen.getByText('Publish to Slider'));
    expect(window.alert).toHaveBeenCalledWith('Title and Image are required!');

    // Fill Title, Image, and Link in custom modal
    const modalContainer = screen.getByText('إضافة إعلان مخصص').closest('div');
    const inputs = modalContainer.querySelectorAll('input[type="text"]');

    fireEvent.input(inputs[0], { target: { value: 'إطلاق النسخة التجريبية للمنصة' } });
    fireEvent.input(inputs[1], { target: { value: 'https://cdn.climamedix.org/announcement.webp' } });
    fireEvent.input(inputs[2], { target: { value: 'https://climamedix.org/beta' } });

    fireEvent.click(screen.getByText('Publish to Slider'));

    await waitFor(() => {
      expect(insertCalls).toHaveLength(1);
    });

    expect(insertCalls[0].entity_type).toBe('custom');
    expect(insertCalls[0].title_ar).toBe('إطلاق النسخة التجريبية للمنصة');
    expect(insertCalls[0].link_url).toBe('https://climamedix.org/beta');
  });

  // 6. Remove Slide Flow
  it('removes slide when clicking the remove (&times;) button on active item card', async () => {
    setupAuth(true);
    render(<SliderManagerPage lang="ar" onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('شريحة الترحيب الرئيسية')).toBeInTheDocument();
    });

    const removeBtn = screen.getByText('×');
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(deleteCalls).toHaveLength(1);
      expect(deleteCalls[0]).toEqual({ field: 'id', val: 's-1' });
    });
  });

  // 7. R2 File Upload Integration & Error Handling
  it('uploads image file to R2 storage and updates image URL', async () => {
    setupAuth(true);
    const { container } = render(<SliderManagerPage lang="ar" onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('ورقة بحثية طبية')).toBeInTheDocument();
    });

    const addBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent.includes('+ Add to Slider'));
    fireEvent.click(addBtn);

    const fileInput = container.querySelector('input[type="file"]');
    const fakeFile = new File(['image-content'], 'hero.png', { type: 'image/png' });

    await fireEvent.change(fileInput, { target: { files: [fakeFile] } });

    await waitFor(() => {
      expect(mockUploadFn).toHaveBeenCalledWith(fakeFile, 'slider');
    });

    const previewImg = container.querySelector('img[alt="Preview"]');
    expect(previewImg).not.toBeNull();
    expect(previewImg.src).toBe('https://cdn.climamedix.org/slider/uploaded.webp');
  });

  it('displays alert message when image upload throws an error', async () => {
    setupAuth(true);
    mockUploadFn = vi.fn().mockRejectedValue(new Error('S3 Network Error'));
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    const { container } = render(<SliderManagerPage lang="ar" onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('ورقة بحثية طبية')).toBeInTheDocument();
    });

    const addBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent.includes('+ Add to Slider'));
    fireEvent.click(addBtn);

    const fileInput = container.querySelector('input[type="file"]');
    const fakeFile = new File(['content'], 'fail.jpg', { type: 'image/jpeg' });

    await fireEvent.change(fileInput, { target: { files: [fakeFile] } });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('فشل رفع الصورة.');
    });
  });

  it('uploads custom banner image in Add Custom Announcement modal and populates custom image URL', async () => {
    setupAuth(true);
    mockUploadFn = vi.fn().mockResolvedValue('https://cdn.climamedix.org/slider/custom_event.webp');

    const { container } = render(<SliderManagerPage lang="ar" onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('ورقة بحثية طبية')).toBeInTheDocument();
    });

    // Open Custom Announcement modal
    fireEvent.click(screen.getByText('إعلان مخصص'));
    expect(screen.getByText('إضافة إعلان مخصص')).toBeInTheDocument();

    // Attach custom image file
    const fileInputs = container.querySelectorAll('input[type="file"]');
    const customFileInput = fileInputs[fileInputs.length - 1];
    const customBanner = new File(['banner-bytes'], 'annual_forum.jpg', { type: 'image/jpeg' });

    await fireEvent.change(customFileInput, { target: { files: [customBanner] } });

    await waitFor(() => {
      expect(mockUploadFn).toHaveBeenCalledWith(customBanner, 'slider');
    });

    // Verify input contains uploaded URL
    const textInputs = container.querySelectorAll('input[type="text"]');
    const imageInput = Array.from(textInputs).find(input => input.value === 'https://cdn.climamedix.org/slider/custom_event.webp');
    expect(imageInput).toBeDefined();
  });

  it('disables upload button and shows uploading label while image upload is in progress', async () => {
    setupAuth(true);
    let resolveUpload;
    mockUploadFn = vi.fn().mockReturnValue(new Promise(res => { resolveUpload = res; }));

    const { container } = render(<SliderManagerPage lang="ar" onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('ورقة بحثية طبية')).toBeInTheDocument();
    });

    const addBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent.includes('+ Add to Slider'));
    fireEvent.click(addBtn);

    const fileInput = container.querySelector('input[type="file"]');
    const fakeFile = new File(['content'], 'slide.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [fakeFile] } });

    // Upload button disabled and text shows "جاري الرفع..."
    await waitFor(() => {
      expect(screen.getByText('جاري الرفع...')).toBeInTheDocument();
      expect(screen.getByText('جاري الرفع...')).toBeDisabled();
    });

    resolveUpload('https://cdn.climamedix.org/slider/slide.webp');

    await waitFor(() => {
      expect(screen.getByText('رفع صورة')).toBeInTheDocument();
      expect(screen.getByText('رفع صورة')).not.toBeDisabled();
    });
  });

  it('displays English alert message when image upload fails in English mode', async () => {
    setupAuth(true);
    mockUploadFn = vi.fn().mockRejectedValue(new Error('S3 Access Denied'));
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    const { container } = render(<SliderManagerPage lang="en" onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Medical Research Paper')).toBeInTheDocument();
    });

    const addBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent.includes('+ Add to Slider'));
    fireEvent.click(addBtn);

    const fileInput = container.querySelector('input[type="file"]');
    const fakeFile = new File(['data'], 'error.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [fakeFile] } });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Failed to upload image.');
    });
  });

  it('cancelling modals resets modal visibility state', async () => {
    setupAuth(true);
    const { container } = render(<SliderManagerPage lang="ar" onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('ورقة بحثية طبية')).toBeInTheDocument();
    });

    // Open add modal
    const addBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent.includes('+ Add to Slider'));
    fireEvent.click(addBtn);
    expect(screen.getByText('تأكيد صورة الشريحة')).toBeInTheDocument();

    // Click Cancel
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('تأكيد صورة الشريحة')).toBeNull();

    // Open custom modal
    fireEvent.click(screen.getByText('إعلان مخصص'));
    expect(screen.getByText('إضافة إعلان مخصص')).toBeInTheDocument();

    // Click Cancel
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('إضافة إعلان مخصص')).toBeNull();
  });

  it('handles custom announcement image upload failure in Arabic and English modes', async () => {
    setupAuth(true);
    mockUploadFn = vi.fn().mockRejectedValue(new Error('R2 Network 500'));
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    // 1. Arabic mode
    const arRender = render(<SliderManagerPage lang="ar" onNavigate={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('ورقة بحثية طبية')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('إعلان مخصص'));
    const fileInputsAr = arRender.container.querySelectorAll('input[type="file"]');
    const customFileInputAr = fileInputsAr[fileInputsAr.length - 1];
    const dummyFile = new File(['bits'], 'banner.png', { type: 'image/png' });

    await fireEvent.change(customFileInputAr, { target: { files: [dummyFile] } });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('فشل رفع الصورة.');
    });
    arRender.unmount();

    // 2. English mode
    const enRender = render(<SliderManagerPage lang="en" onNavigate={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Medical Research Paper')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Custom Announcement'));
    const fileInputsEn = enRender.container.querySelectorAll('input[type="file"]');
    const customFileInputEn = fileInputsEn[fileInputsEn.length - 1];

    await fireEvent.change(customFileInputEn, { target: { files: [dummyFile] } });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to upload image.');
    });
    enRender.unmount();
    alertSpy.mockRestore();
  });

  it('aborts upload immediately when file input selection is empty or cancelled in custom modal', async () => {
    setupAuth(true);
    mockUploadFn = vi.fn();

    const { container } = render(<SliderManagerPage lang="ar" onNavigate={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('ورقة بحثية طبية')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('إعلان مخصص'));
    const fileInputs = container.querySelectorAll('input[type="file"]');
    const customFileInput = fileInputs[fileInputs.length - 1];

    // Simulate user cancelling file picker (files is empty array)
    await fireEvent.change(customFileInput, { target: { files: [] } });

    expect(mockUploadFn).not.toHaveBeenCalled();
  });

  it('persists custom announcement to database with uploaded R2 banner image URL', async () => {
    setupAuth(true);
    mockUploadFn = vi.fn().mockResolvedValue('https://cdn.climamedix.org/slider/summit_2026.webp');

    const { container } = render(<SliderManagerPage lang="ar" onNavigate={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('ورقة بحثية طبية')).toBeInTheDocument();
    });

    // 1. Open Custom Announcement modal
    fireEvent.click(screen.getByText('إعلان مخصص'));
    expect(screen.getByText('إضافة إعلان مخصص')).toBeInTheDocument();

    // 2. Locate inputs inside the opened modal
    const modal = document.querySelector('div[style*="fixed"]');
    const modalTextInputs = modal.querySelectorAll('input[type="text"]');
    const titleInput = modalTextInputs[0];
    fireEvent.input(titleInput, { target: { value: 'قمة الصحة والمناخ السنوية' } });

    // 3. Upload banner image to R2
    const modalFileInput = modal.querySelector('input[type="file"]');
    const bannerFile = new File(['summit-image-data'], 'summit.png', { type: 'image/png' });
    await fireEvent.change(modalFileInput, { target: { files: [bannerFile] } });

    await waitFor(() => {
      expect(mockUploadFn).toHaveBeenCalledWith(bannerFile, 'slider');
    });

    // 4. Enter Target Link URL
    const linkInput = modalTextInputs[2];
    fireEvent.input(linkInput, { target: { value: 'https://climamedix.org/summit' } });

    // 5. Submit modal
    const confirmBtn = screen.getByText('Publish to Slider');
    await fireEvent.click(confirmBtn);

    // Verify insert call payload to home_slider table
    await waitFor(() => {
      expect(insertCalls.length).toBeGreaterThan(0);
      const insertedItem = insertCalls.find(item => item.title_ar === 'قمة الصحة والمناخ السنوية');
      expect(insertedItem).toBeDefined();
      expect(insertedItem.image_url).toBe('https://cdn.climamedix.org/slider/summit_2026.webp');
      expect(insertedItem.link_url).toBe('https://climamedix.org/summit');
      expect(insertedItem.entity_type).toBe('custom');
    });
  });
});
