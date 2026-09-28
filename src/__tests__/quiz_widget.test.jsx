import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { QuizWidget } from '../features/learning-hub/components/quizzes/QuizWidget';

describe('Stage 2: Strict Quiz Validation & Review Mode Test Suite', () => {
  const mockQuizData = {
    id: 'quiz-101',
    title_ar: 'اختبار صحة المناخ',
    title_en: 'Climate Health Quiz',
    passing_score: 80,
    quiz_questions: [
      {
        id: 'q-1',
        question_text_ar: 'ما هي الغازات الدفيئة الرئيسية؟ (اختر كل ما ينطبق)',
        question_text_en: 'What are the main greenhouse gases? (Select all that apply)',
        points: 10,
        quiz_options: [
          { id: 'opt-1', option_text_ar: 'ثاني أكسيد الكربون (CO2)', option_text_en: 'Carbon Dioxide (CO2)', is_correct: true },
          { id: 'opt-2', option_text_ar: 'الميثان (CH4)', option_text_en: 'Methane (CH4)', is_correct: true },
          { id: 'opt-3', option_text_ar: 'الأكسجين (O2)', option_text_en: 'Oxygen (O2)', is_correct: false },
          { id: 'opt-4', option_text_ar: 'أكسيد النيتروز (N2O)', option_text_en: 'Nitrous Oxide (N2O)', is_correct: true }
        ]
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Fail Test: Selecting only SOME correct checkboxes on a multi-select question yields 0 points (no partial credit)', () => {
    const onFinished = vi.fn();

    render(
      <QuizWidget 
        quizData={mockQuizData} 
        onQuizFinished={onFinished} 
        lang="ar" 
      />
    );

    // Question 1 has 3 correct options: opt-1, opt-2, opt-4
    // Select only opt-1 and opt-2 (missing opt-4)
    const opt1 = screen.getByText('ثاني أكسيد الكربون (CO2)');
    const opt2 = screen.getByText('الميثان (CH4)');
    
    fireEvent.click(opt1);
    fireEvent.click(opt2);

    // Submit / finish quiz
    const finishBtn = screen.getByText('إنهاء الاختبار');
    fireEvent.click(finishBtn);

    // Score must be 0% because all-or-nothing strict multi-select grading applies
    expect(onFinished).toHaveBeenCalledWith(0, false, 'quiz-101');
    expect(screen.getByText((_, el) => el?.textContent?.trim() === '0%')).toBeInTheDocument();
    expect(screen.getByText('لم تتخطى درجة الاجتياز بعد')).toBeInTheDocument();
  });

  it('Fail Test: Selecting an incorrect option alongside correct options yields 0 points', () => {
    const onFinished = vi.fn();

    render(
      <QuizWidget 
        quizData={mockQuizData} 
        onQuizFinished={onFinished} 
        lang="ar" 
      />
    );

    // Select opt-1 (correct) and opt-3 (Oxygen - WRONG)
    fireEvent.click(screen.getByText('ثاني أكسيد الكربون (CO2)'));
    fireEvent.click(screen.getByText('الأكسجين (O2)'));

    // Submit quiz
    fireEvent.click(screen.getByText('إنهاء الاختبار'));

    expect(onFinished).toHaveBeenCalledWith(0, false, 'quiz-101');
    expect(screen.getByText((_, el) => el?.textContent?.trim() === '0%')).toBeInTheDocument();
  });

  it('Pass Test: Selecting ALL correct checkboxes awards full points and passes the quiz', () => {
    const onFinished = vi.fn();

    render(
      <QuizWidget 
        quizData={mockQuizData} 
        onQuizFinished={onFinished} 
        lang="ar" 
      />
    );

    // Select all 3 correct options: opt-1, opt-2, opt-4
    fireEvent.click(screen.getByText('ثاني أكسيد الكربون (CO2)'));
    fireEvent.click(screen.getByText('الميثان (CH4)'));
    fireEvent.click(screen.getByText('أكسيد النيتروز (N2O)'));

    // Submit quiz
    fireEvent.click(screen.getByText('إنهاء الاختبار'));

    expect(onFinished).toHaveBeenCalledWith(100, true, 'quiz-101');
    expect(screen.getByText((_, el) => el?.textContent?.trim() === '100%')).toBeInTheDocument();
    expect(screen.getByText('تهانينا، لقد اجتزت الاختبار!')).toBeInTheDocument();
  });

  it('Review Mode Test: ONLY correct answers actually clicked highlight green; unselected correct options stay plain', () => {
    render(
      <QuizWidget 
        quizData={mockQuizData} 
        lang="ar" 
      />
    );

    // Select all 3 correct options and pass
    fireEvent.click(screen.getByText('ثاني أكسيد الكربون (CO2)'));
    fireEvent.click(screen.getByText('الميثان (CH4)'));
    fireEvent.click(screen.getByText('أكسيد النيتروز (N2O)'));
    fireEvent.click(screen.getByText('إنهاء الاختبار'));

    // In review mode:
    // Option 1, 2, 4 must show green checkmark
    const checkmarks = screen.getAllByText('✓');
    expect(checkmarks.length).toBe(3);

    // Oxygen (opt-3) was not correct and not selected, so no checkmark
    const oxygenOption = screen.getByText('الأكسجين (O2)').closest('div');
    expect(oxygenOption.textContent).not.toContain('✓');
  });

  it('Retry resets selections and restarts from question 1', () => {
    render(
      <QuizWidget 
        quizData={mockQuizData} 
        lang="ar" 
      />
    );

    // Select and submit
    fireEvent.click(screen.getByText('ثاني أكسيد الكربون (CO2)'));
    fireEvent.click(screen.getByText('إنهاء الاختبار'));

    expect(screen.getByText((_, el) => el?.textContent?.trim() === '0%')).toBeInTheDocument();

    // Click retry
    const retryBtn = screen.getByText('إعادة المحاولة');
    fireEvent.click(retryBtn);

    // Question view should be restored
    expect(screen.getByText('ما هي الغازات الدفيئة الرئيسية؟ (اختر كل ما ينطبق)')).toBeInTheDocument();
    expect(screen.queryByText((_, el) => el?.textContent?.trim() === '0%')).toBeNull();
  });

  it('allows unselecting an already selected option and navigating between questions via Next and Back', () => {
    const multiQuestionQuiz = {
      ...mockQuizData,
      quiz_questions: [
        mockQuizData.quiz_questions[0],
        {
          id: 'q-2',
          question_text_ar: 'سؤال ثاني',
          question_text_en: 'Question 2',
          points: 10,
          quiz_options: [
            { id: 'opt-2-1', option_text_ar: 'نعم', option_text_en: 'Yes', is_correct: true },
            { id: 'opt-2-2', option_text_ar: 'لا', option_text_en: 'No', is_correct: false }
          ]
        }
      ]
    };

    render(<QuizWidget quizData={multiQuestionQuiz} lang="ar" />);

    const opt = screen.getByText('ثاني أكسيد الكربون (CO2)');
    // Select option
    fireEvent.click(opt);
    // Unselect option (deselection toggle on line 32)
    fireEvent.click(opt);

    // Select again to enable Next
    fireEvent.click(opt);
    const nextBtn = screen.getByText('التالي');
    fireEvent.click(nextBtn);

    // Question 2 is now shown
    expect(screen.getByText('سؤال ثاني')).toBeInTheDocument();

    // Click Previous / Back (line 152)
    const backBtn = screen.getByText('السابق');
    fireEvent.click(backBtn);

    // Question 1 is shown again
    expect(screen.getByText('ما هي الغازات الدفيئة الرئيسية؟ (اختر كل ما ينطبق)')).toBeInTheDocument();
  });
});
