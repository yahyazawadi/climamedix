import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { ProgramDetailModal } from '../features/programs/components/ProgramDetailModal';

describe('ProgramDetailModal Lifecycle & Application Matrix', () => {
  const sampleProgram = {
    id: 'prog-climate-health-1',
    title: 'برنامج دبلوم الصحة وتغير المناخ',
    category: 'برنامج زمالة متقدم',
    image: 'https://cdn.climamedix.org/programs/diploma.webp',
    desc: 'برنامج تدريبي مكثف يهدف إلى بناء قدرات العاملين في القطاع الصحي.',
    duration: '8 أسابيع'
  };

  // 1. Guard & Null Handling
  it('returns null and renders nothing when program prop is null or undefined', () => {
    const { container } = render(<ProgramDetailModal program={null} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();

    const { container: containerUndef } = render(<ProgramDetailModal program={undefined} onClose={vi.fn()} />);
    expect(containerUndef.firstChild).toBeNull();
  });

  // 2. Rendering Content & Fallbacks
  it('renders program title, custom category, custom duration and description', () => {
    render(<ProgramDetailModal program={sampleProgram} onClose={vi.fn()} onApply={vi.fn()} />);

    expect(screen.getByText('برنامج دبلوم الصحة وتغير المناخ')).toBeInTheDocument();
    expect(screen.getByText('برنامج زمالة متقدم')).toBeInTheDocument();
    expect(screen.getByText('8 أسابيع')).toBeInTheDocument();
    expect(screen.getByText('برنامج تدريبي مكثف يهدف إلى بناء قدرات العاملين في القطاع الصحي.')).toBeInTheDocument();
    expect(screen.getByText('كلايما ميدكس')).toBeInTheDocument();
    expect(screen.getByText('الأهداف الإستراتيجية:')).toBeInTheDocument();
    expect(screen.getByText('شروط الأهلية:')).toBeInTheDocument();
  });

  it('renders default category and default duration fallbacks when fields are missing', () => {
    const minimalProgram = {
      id: 'prog-min-2',
      title: 'ورشة عمل التكيف المناخي',
      desc: 'وصف الورشة'
    };

    render(<ProgramDetailModal program={minimalProgram} onClose={vi.fn()} onApply={vi.fn()} />);

    expect(screen.getByText('برنامج مميز')).toBeInTheDocument();
    expect(screen.getByText('6 أسابيع')).toBeInTheDocument();
  });

  it('renders hero image when image URL is provided and renders without image tag when missing', () => {
    const { container: withImg } = render(<ProgramDetailModal program={sampleProgram} onClose={vi.fn()} />);
    const imgEl = withImg.querySelector('img');
    expect(imgEl).not.toBeNull();
    expect(imgEl.src).toBe('https://cdn.climamedix.org/programs/diploma.webp');
    expect(imgEl.alt).toBe('برنامج دبلوم الصحة وتغير المناخ');

    const programNoImg = { ...sampleProgram, image: null };
    const { container: noImg } = render(<ProgramDetailModal program={programNoImg} onClose={vi.fn()} />);
    expect(noImg.querySelector('img')).toBeNull();
  });

  // 3. Modal Close Interactions
  it('triggers onClose callback when clicking the close (×) button', () => {
    const onClose = vi.fn();
    render(<ProgramDetailModal program={sampleProgram} onClose={onClose} onApply={vi.fn()} />);

    const closeBtn = screen.getByText('×');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles mouseEnter and mouseLeave hover states on close button', () => {
    render(<ProgramDetailModal program={sampleProgram} onClose={vi.fn()} />);

    const closeBtn = screen.getByText('×');
    fireEvent.mouseEnter(closeBtn);
    expect(closeBtn.style.background).toBe('rgba(11, 40, 73, 0.1)');

    fireEvent.mouseLeave(closeBtn);
    expect(closeBtn.style.background).toBe('rgba(11, 40, 73, 0.05)');
  });

  // 4. Form State & Inputs
  it('updates form fields on user typing in all inputs', () => {
    const { container } = render(<ProgramDetailModal program={sampleProgram} onClose={vi.fn()} onApply={vi.fn()} />);

    const textInputs = container.querySelectorAll('input[type="text"]');
    const nameInput = textInputs[0];
    const emailInput = container.querySelector('input[type="email"]');
    const institutionInput = textInputs[1];
    const motivationInput = container.querySelector('textarea');

    fireEvent.input(nameInput, { target: { value: 'د. سارة الأحمد' } });
    expect(nameInput.value).toBe('د. سارة الأحمد');

    fireEvent.input(emailInput, { target: { value: 'sara@hospital.org' } });
    expect(emailInput.value).toBe('sara@hospital.org');

    fireEvent.input(institutionInput, { target: { value: 'مستشفى الملك فيصل التخصصي' } });
    expect(institutionInput.value).toBe('مستشفى الملك فيصل التخصصي');

    fireEvent.input(motivationInput, { target: { value: 'أرغب بالمشاركة لتطوير خطة طوارئ مناخية للمستشفى.' } });
    expect(motivationInput.value).toBe('أرغب بالمشاركة لتطوير خطة طوارئ مناخية للمستشفى.');
  });

  // 5. Form Submission Lifecycle & Success Screen
  it('submits form, calls onApply with program.id and form data, and transitions to success view', () => {
    const onApply = vi.fn();
    const { container } = render(<ProgramDetailModal program={sampleProgram} onClose={vi.fn()} onApply={onApply} />);

    const textInputs = container.querySelectorAll('input[type="text"]');
    fireEvent.input(textInputs[0], { target: { value: 'د. أحمد محمود' } });
    fireEvent.input(container.querySelector('input[type="email"]'), { target: { value: 'ahmed@climamedix.org' } });
    fireEvent.input(textInputs[1], { target: { value: 'جامعة القاهرة' } });
    fireEvent.input(container.querySelector('textarea'), { target: { value: 'شغف بالبحث العلمي والتكيف البيئي.' } });

    // Click submit button
    const submitBtn = screen.getByText('إرسال الطلب');
    fireEvent.click(submitBtn);

    // Verify onApply called
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith('prog-climate-health-1', {
      name: 'د. أحمد محمود',
      email: 'ahmed@climamedix.org',
      institution: 'جامعة القاهرة',
      motivation: 'شغف بالبحث العلمي والتكيف البيئي.',
      phone: ''
    });

    // Verify success banner appears
    expect(screen.getByText('تم إرسال طلبك بنجاح!')).toBeInTheDocument();
    expect(screen.getByText(/شكراً لاهتمامك ببرامجنا/)).toBeInTheDocument();
    expect(screen.queryByText('إرسال الطلب')).toBeNull();
  });

  it('submits successfully even if onApply prop is omitted without throwing', () => {
    const { container } = render(<ProgramDetailModal program={sampleProgram} onClose={vi.fn()} />);

    const form = container.querySelector('form');
    expect(() => fireEvent.submit(form)).not.toThrow();
    expect(screen.getByText('تم إرسال طلبك بنجاح!')).toBeInTheDocument();
  });
});
