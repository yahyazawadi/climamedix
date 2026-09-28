import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/preact';
import { DatePicker } from '../features/shared/components/DatePicker';
import { ShareActionButtons } from '../features/shared/components/ShareActionButtons';
import { RichTextRenderer } from '../features/shared/components/RichTextRenderer';
import { AboutUsPage } from '../features/about-us/AboutUsPage';

// ─── 1. Mocks ────────────────────────────────────────────────────────────────

// Mock CustomVideoPlayer & CustomAudioPlayer for RichTextRenderer
vi.mock('../features/learning-hub/components/player/CustomVideoPlayer', () => ({
  CustomVideoPlayer: ({ videoUrl }) => <div data-testid="custom-video-player" data-src={videoUrl} />
}));

vi.mock('../features/shared/components/CustomAudioPlayer', () => ({
  CustomAudioPlayer: ({ src, title }) => <div data-testid="custom-audio-player" data-src={src} data-title={title} />
}));

describe('Shared UI Components & Public Pages Exhaustive Matrix (36 Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1: DatePicker Custom Popover & Navigation (14 Tests)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('1. DatePicker Custom Popover & Navigation', () => {
    it('renders placeholder text when value is empty in Arabic', () => {
      render(<DatePicker value="" onChange={vi.fn()} lang="ar" />);

      expect(screen.getByText('اختر تاريخ الميلاد')).toBeInTheDocument();
    });

    it('renders placeholder text when value is empty in English', () => {
      render(<DatePicker value="" onChange={vi.fn()} lang="en" />);

      expect(screen.getByText('Select birth date')).toBeInTheDocument();
    });

    it('renders formatted date when valid ISO value is passed', () => {
      render(<DatePicker value="2026-09-15" onChange={vi.fn()} lang="ar" />);

      expect(screen.getByText('15 / 09 / 2026')).toBeInTheDocument();
    });

    it('opens dropdown panel on trigger button click', () => {
      render(<DatePicker value="" onChange={vi.fn()} lang="ar" />);

      const triggerBtn = screen.getByRole('button');
      expect(document.querySelector('.dp-panel')).toBeNull();

      fireEvent.click(triggerBtn);
      expect(document.querySelector('.dp-panel')).toBeInTheDocument();
    });

    it('closes dropdown panel on second trigger click', () => {
      render(<DatePicker value="" onChange={vi.fn()} lang="ar" />);

      const triggerBtn = screen.getByRole('button');
      fireEvent.click(triggerBtn);
      expect(document.querySelector('.dp-panel')).toBeInTheDocument();

      fireEvent.click(triggerBtn);
      expect(document.querySelector('.dp-panel')).toBeNull();
    });

    it('closes dropdown on outside mousedown click', () => {
      render(
        <div>
          <DatePicker value="" onChange={vi.fn()} lang="ar" />
          <div data-testid="outside-element">Outside</div>
        </div>
      );

      fireEvent.click(screen.getByText('اختر تاريخ الميلاد'));
      expect(document.querySelector('.dp-panel')).toBeInTheDocument();

      fireEvent.mouseDown(screen.getByTestId('outside-element'));
      expect(document.querySelector('.dp-panel')).toBeNull();
    });

    it('navigates to next and previous months', () => {
      render(<DatePicker value="2026-05-10" onChange={vi.fn()} lang="en" />);

      fireEvent.click(screen.getByText('10 / 05 / 2026'));
      expect(screen.getByText(/May 2026/)).toBeInTheDocument();

      // Next month
      const navButtons = document.querySelectorAll('.dp-nav-btn');
      fireEvent.click(navButtons[1]); // Next
      expect(screen.getByText(/June 2026/)).toBeInTheDocument();

      // Previous month
      fireEvent.click(navButtons[0]); // Back to May
      expect(screen.getByText(/May 2026/)).toBeInTheDocument();

      fireEvent.click(navButtons[0]); // Back to April
      expect(screen.getByText(/April 2026/)).toBeInTheDocument();
    });

    it('wraps year when navigating past December or before January', () => {
      render(<DatePicker value="2026-12-01" onChange={vi.fn()} lang="en" />);

      fireEvent.click(screen.getByText('01 / 12 / 2026'));
      expect(screen.getByText(/December 2026/)).toBeInTheDocument();

      const navButtons = document.querySelectorAll('.dp-nav-btn');
      // Forward to Jan 2027
      fireEvent.click(navButtons[1]);
      expect(screen.getByText(/January 2027/)).toBeInTheDocument();

      // Back to Dec 2026
      fireEvent.click(navButtons[0]);
      expect(screen.getByText(/December 2026/)).toBeInTheDocument();
    });

    it('selects day and triggers onChange with formatted ISO string', () => {
      const onChange = vi.fn();
      render(<DatePicker value="2026-07-01" onChange={onChange} lang="en" />);

      fireEvent.click(screen.getByText('01 / 07 / 2026'));

      // Find day button for 20th
      const day20 = screen.getAllByRole('button').find(b => b.textContent?.trim() === '20');
      fireEvent.click(day20);

      expect(onChange).toHaveBeenCalledWith('2026-07-20');
      expect(document.querySelector('.dp-panel')).toBeNull();
    });

    it('toggles Year Picker grid and selects a different year', () => {
      render(<DatePicker value="2026-03-01" onChange={vi.fn()} lang="en" />);

      fireEvent.click(screen.getByText('01 / 03 / 2026'));

      // Click month/year header button to open year grid
      const monthYearBtn = document.querySelector('.dp-month-year-btn');
      fireEvent.click(monthYearBtn);

      expect(document.querySelector('.dp-year-grid')).toBeInTheDocument();
      expect(screen.getByText('1995')).toBeInTheDocument();

      // Select 1995
      fireEvent.click(screen.getByText('1995'));

      // Back to day grid with year 1995
      expect(document.querySelector('.dp-year-grid')).toBeNull();
      expect(screen.getByText(/March 1995/)).toBeInTheDocument();
    });

    it('jumps to current month and year on Today shortcut click', () => {
      const currentYear = new Date().getFullYear();
      render(<DatePicker value="1990-01-01" onChange={vi.fn()} lang="en" />);

      fireEvent.click(screen.getByText('01 / 01 / 1990'));
      expect(screen.getByText(/January 1990/)).toBeInTheDocument();

      const todayBtn = screen.getByText('Today');
      fireEvent.click(todayBtn);

      expect(screen.getByText(new RegExp(`${currentYear}`))).toBeInTheDocument();
    });

    it('shows Clear button when value is present and clears date on click', () => {
      const onChange = vi.fn();
      render(<DatePicker value="2026-08-10" onChange={onChange} lang="ar" />);

      fireEvent.click(screen.getByText('10 / 08 / 2026'));

      const clearBtn = screen.getByText('مسح');
      expect(clearBtn).toBeInTheDocument();

      fireEvent.click(clearBtn);
      expect(onChange).toHaveBeenCalledWith('');
      expect(document.querySelector('.dp-panel')).toBeNull();
    });

    it('hides Clear button when value is empty', () => {
      render(<DatePicker value="" onChange={vi.fn()} lang="ar" />);

      fireEvent.click(screen.getByText('اختر تاريخ الميلاد'));
      expect(screen.queryByText('مسح')).toBeNull();
    });

    it('handles invalid date values gracefully without crashing', () => {
      render(<DatePicker value="not-a-valid-date" onChange={vi.fn()} lang="en" />);

      expect(screen.getByText('Select birth date')).toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2: ShareActionButtons Suite (8 Tests)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('2. ShareActionButtons Suite', () => {
    beforeEach(() => {
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined)
        },
        share: vi.fn().mockResolvedValue(undefined)
      });
    });

    it('renders Copy Link and Share buttons with default styles', () => {
      render(<ShareActionButtons lang="ar" title="Climate Article" url="https://climamedix.org/article/1" />);

      expect(screen.getByTitle('نسخ الرابط')).toBeInTheDocument();
      expect(screen.getByTitle('مشاركة عبر...')).toBeInTheDocument();
    });

    it('renders English title tooltips when lang is en', () => {
      render(<ShareActionButtons lang="en" title="Climate Article" url="https://climamedix.org/article/1" />);

      expect(screen.getByTitle('Copy Link')).toBeInTheDocument();
      expect(screen.getByTitle('Share via...')).toBeInTheDocument();
    });

    it('copies URL to clipboard and shows checkmark feedback', async () => {
      render(<ShareActionButtons lang="ar" title="Test Title" url="https://climamedix.org/article/test" />);

      const copyBtn = screen.getByTitle('نسخ الرابط');
      fireEvent.click(copyBtn);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://climamedix.org/article/test');

      // Checkmark polyline is rendered
      await waitFor(() => {
        expect(document.querySelector('polyline')).toBeInTheDocument();
      });
    });

    it('falls back to window.location.href when url prop is omitted', () => {
      render(<ShareActionButtons lang="ar" title="Test Title" />);

      const copyBtn = screen.getByTitle('نسخ الرابط');
      fireEvent.click(copyBtn);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(window.location.href);
    });

    it('invokes navigator.share when available on device', async () => {
      render(<ShareActionButtons lang="ar" title="Great Paper" url="https://climamedix.org/paper/42" />);

      const shareBtn = screen.getByTitle('مشاركة عبر...');
      fireEvent.click(shareBtn);

      expect(navigator.share).toHaveBeenCalledWith({
        title: 'Great Paper',
        url: 'https://climamedix.org/paper/42'
      });
    });

    it('falls back to clipboard copy when navigator.share is undefined', async () => {
      delete navigator.share;
      render(<ShareActionButtons lang="ar" title="Great Paper" url="https://climamedix.org/paper/fallback" />);

      const shareBtn = screen.getByTitle('مشاركة عبر...');
      fireEvent.click(shareBtn);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://climamedix.org/paper/fallback');
    });

    it('renders Edit button when onEdit callback is provided', () => {
      const onEdit = vi.fn();
      render(<ShareActionButtons lang="ar" onEdit={onEdit} />);

      const editBtn = screen.getByTitle('تعديل المقال');
      expect(editBtn).toBeInTheDocument();

      fireEvent.click(editBtn);
      expect(onEdit).toHaveBeenCalled();
    });

    it('hides Edit button when onEdit callback is not provided', () => {
      render(<ShareActionButtons lang="ar" />);

      expect(screen.queryByTitle('تعديل المقال')).toBeNull();
      expect(screen.queryByTitle('Edit Article')).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3: RichTextRenderer Suite (8 Tests)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('3. RichTextRenderer Suite', () => {
    it('returns null if html content is empty or null', () => {
      const { container } = render(<RichTextRenderer html="" />);
      expect(container.firstChild).toBeNull();
    });

    it('renders standard paragraphs and text nodes correctly', () => {
      const html = '<p>هذا نص تجريبي عن الصحة البيئية.</p>';
      render(<RichTextRenderer html={html} lang="ar" />);

      expect(screen.getByText('هذا نص تجريبي عن الصحة البيئية.')).toBeInTheDocument();
    });

    it('intercepts <video> tags and embeds CustomVideoPlayer', () => {
      const html = '<p>شاهد المحاضرة:</p><video src="https://cdn.climamedix.org/lecture.mp4"></video>';
      render(<RichTextRenderer html={html} lang="ar" userId="usr-1" lessonId="les-1" courseId="crs-1" />);

      const videoPlayer = screen.getByTestId('custom-video-player');
      expect(videoPlayer).toBeInTheDocument();
      expect(videoPlayer).toHaveAttribute('data-src', 'https://cdn.climamedix.org/lecture.mp4');
    });

    it('intercepts <audio> tags and embeds CustomAudioPlayer with extracted title', () => {
      const html = '<audio src="https://cdn.climamedix.org/podcasts/climate-podcast-ep1.mp3"></audio>';
      render(<RichTextRenderer html={html} lang="ar" userId="usr-1" lessonId="les-1" />);

      const audioPlayer = screen.getByTestId('custom-audio-player');
      expect(audioPlayer).toBeInTheDocument();
      expect(audioPlayer).toHaveAttribute('data-src', 'https://cdn.climamedix.org/podcasts/climate-podcast-ep1.mp3');
      expect(audioPlayer).toHaveAttribute('data-title', 'climate-podcast-ep1');
    });

    it('parses inline CSS styles and applies them as camelCase props', () => {
      const html = '<div style="color: red; font-size: 18px; margin-top: 10px;">نص منسق</div>';
      render(<RichTextRenderer html={html} lang="ar" />);

      const styledElement = screen.getByText('نص منسق');
      expect(styledElement).toBeInTheDocument();
      expect(styledElement.style.color).toBe('red');
      expect(styledElement.style.fontSize).toBe('18px');
      expect(styledElement.style.marginTop).toBe('10px');
    });

    it('maps class attribute to className and for attribute to htmlFor', () => {
      const html = '<label for="inp-test" class="my-custom-label">Label Test</label>';
      render(<RichTextRenderer html={html} lang="ar" />);

      const label = screen.getByText('Label Test');
      expect(label).toHaveAttribute('for', 'inp-test');
      expect(label.className).toContain('my-custom-label');
    });

    it('renders nested elements hierarchy properly (lists, headings, bold)', () => {
      const html = `
        <h3>قائمة التوصيات:</h3>
        <ul>
          <li><strong>التوصية الأولى:</strong> تقليل الانبعاثات.</li>
          <li><strong>التوصية الثانية:</strong> حماية الغابات.</li>
        </ul>
      `;
      render(<RichTextRenderer html={html} lang="ar" />);

      expect(screen.getByText('قائمة التوصيات:')).toBeInTheDocument();
      expect(screen.getByText('التوصية الأولى:')).toBeInTheDocument();
      expect(screen.getByText('تقليل الانبعاثات.')).toBeInTheDocument();
    });

    it('applies ltr or rtl wrapper class based on lang prop', () => {
      const { container: containerAr } = render(<RichTextRenderer html="<p>عربي</p>" lang="ar" />);
      expect(containerAr.querySelector('.rich-text-renderer.rtl')).toBeInTheDocument();

      const { container: containerEn } = render(<RichTextRenderer html="<p>English</p>" lang="en" />);
      expect(containerEn.querySelector('.rich-text-renderer.ltr')).toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4: AboutUsPage Suite (6 Tests)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('4. AboutUsPage Suite', () => {
    it('renders all key sections (Vision, Mission, Values, Partnerships, History, Commitment) in Arabic', () => {
      render(<AboutUsPage lang="ar" onJoinClick={vi.fn()} />);

      expect(screen.getByText('رؤيتنا')).toBeInTheDocument();
      expect(screen.getByText('مهمتنا')).toBeInTheDocument();
      expect(screen.getByText('قيمنا')).toBeInTheDocument();
      expect(screen.getByText('شراكاتنا')).toBeInTheDocument();
      expect(screen.getByText('تاريخنا')).toBeInTheDocument();
      expect(screen.getByText('التزامنا تجاه المجتمع')).toBeInTheDocument();
    });

    it('renders all key sections in English when lang is en', () => {
      render(<AboutUsPage lang="en" onJoinClick={vi.fn()} />);

      expect(screen.getByText('Our Vision')).toBeInTheDocument();
      expect(screen.getByText('Our Mission')).toBeInTheDocument();
      expect(screen.getByText('Our Values')).toBeInTheDocument();
      expect(screen.getByText('Our Partnerships')).toBeInTheDocument();
      expect(screen.getByText('Our History')).toBeInTheDocument();
      expect(screen.getByText('Our Commitment to Community')).toBeInTheDocument();
    });

    it('renders the 5 core value cards descriptions', () => {
      render(<AboutUsPage lang="ar" onJoinClick={vi.fn()} />);

      expect(screen.getByText('الابتكار:')).toBeInTheDocument();
      expect(screen.getByText('البحث العلمي:')).toBeInTheDocument();
      expect(screen.getByText('التأثير المجتمعي:')).toBeInTheDocument();
    });

    it('triggers onJoinClick callback when clicking Join Research Team button', () => {
      const onJoinClick = vi.fn();
      render(<AboutUsPage lang="ar" onJoinClick={onJoinClick} />);

      const joinBtn = screen.getByText('انضم لفريق البحث');
      fireEvent.click(joinBtn);

      expect(onJoinClick).toHaveBeenCalled();
    });

    it('triggers onJoinClick callback in English when lang is en', () => {
      const onJoinClick = vi.fn();
      render(<AboutUsPage lang="en" onJoinClick={onJoinClick} />);

      const joinBtn = screen.getByText('Join the Research Team');
      fireEvent.click(joinBtn);

      expect(onJoinClick).toHaveBeenCalled();
    });

    it('renders background illustration with aria-hidden="true"', () => {
      render(<AboutUsPage lang="ar" onJoinClick={vi.fn()} />);

      const bgWrap = document.querySelector('.au-bg-wrap');
      expect(bgWrap).toBeInTheDocument();
      expect(bgWrap).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
