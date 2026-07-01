import { useState } from 'preact/hooks';
import { Button } from '../../shared/components/Button';
import { GlassCard } from '../../shared/components/GlassCard';

/**
 * QuizWidget — works with real Supabase quiz data.
 * 
 * @prop {object} quizData - Full quiz object from lmsService.fetchQuiz():
 *   { id, title_ar, title_en, passing_score, quiz_questions: [{ id, question_text_ar, question_text_en, points, quiz_options: [{ id, option_text_ar, option_text_en, is_correct }] }] }
 * @prop {function} onQuizFinished(score: number, passed: boolean, quizId: string)
 * @prop {function} onClose
 * @prop {string} lang - 'ar' | 'en'
 */
export function QuizWidget({ quizData, onQuizFinished, onClose, lang = 'ar' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIds, setSelectedOptionIds] = useState({}); // questionId -> [optionId1, optionId2]
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);

  if (!quizData || !quizData.quiz_questions || quizData.quiz_questions.length === 0) return null;

  const questions = quizData.quiz_questions;
  const currentQuestion = questions[currentIndex];
  const passingScore = quizData.passing_score ?? 80;

  const handleSelectOption = (optionId) => {
    setSelectedOptionIds(prev => {
      const currentSelected = prev[currentQuestion.id] || [];
      if (currentSelected.includes(optionId)) {
        return { ...prev, [currentQuestion.id]: currentSelected.filter(id => id !== optionId) };
      } else {
        return { ...prev, [currentQuestion.id]: [...currentSelected, optionId] };
      }
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Calculate score
      let totalPoints = 0;
      let earnedPoints = 0;

      questions.forEach(q => {
        const pts = q.points ?? 1;
        totalPoints += pts;
        const selectedIds = selectedOptionIds[q.id] || [];
        const correctOptions = (q.quiz_options || []).filter(o => o.is_correct).map(o => o.id);
        
        // Exact match of arrays (regardless of order)
        const isExactlyCorrect = 
          selectedIds.length === correctOptions.length && 
          selectedIds.every(id => correctOptions.includes(id));

        if (isExactlyCorrect) {
          earnedPoints += pts;
        }
      });

      const finalScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      const didPass = finalScore >= passingScore;

      setScore(finalScore);
      setPassed(didPass);
      setShowResults(true);

      if (onQuizFinished) {
        onQuizFinished(finalScore, didPass, quizData.id);
      }
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedOptionIds({});
    setShowResults(false);
    setScore(0);
    setPassed(false);
  };

  const quizTitle = lang === 'ar' ? quizData.title_ar : (quizData.title_en || quizData.title_ar);
  const questionText = lang === 'ar'
    ? currentQuestion.question_text_ar
    : (currentQuestion.question_text_en || currentQuestion.question_text_ar);

  return (
    <GlassCard style={{ padding: '30px', maxWidth: '620px', width: '100%', margin: '0 auto', direction: lang === 'ar' ? 'rtl' : 'ltr', textAlign: lang === 'ar' ? 'right' : 'left' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(11,40,73,0.1)', paddingBottom: '14px', marginBottom: '22px' }}>
        <h4 style={{ color: '#0b2849', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
          {quizTitle || (lang === 'ar' ? 'اختبار تقييم الدرس' : 'Lesson Quiz')}
        </h4>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#ff4d4d', lineHeight: 1 }}>✕</button>
        )}
      </div>

      {!showResults ? (
        <div>
          {/* Progress */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(11,40,73,0.5)', marginBottom: '8px' }}>
            <span>{lang === 'ar' ? `السؤال ${currentIndex + 1} من ${questions.length}` : `Question ${currentIndex + 1} of ${questions.length}`}</span>
            <span>{lang === 'ar' ? `درجة الاجتياز: ${passingScore}%` : `Passing score: ${passingScore}%`}</span>
          </div>
          <div style={{ width: '100%', height: '4px', background: 'rgba(11,40,73,0.08)', borderRadius: '2px', marginBottom: '24px', overflow: 'hidden' }}>
            <div style={{ width: `${((currentIndex + 1) / questions.length) * 100}%`, height: '100%', background: '#004c6d', borderRadius: '2px', transition: 'width 0.25s' }} />
          </div>

          {/* Question */}
          <h3 style={{ color: '#0b2849', fontSize: '17px', fontWeight: 'bold', marginBottom: '20px', lineHeight: '1.5' }}>
            {questionText}
          </h3>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
            {(currentQuestion.quiz_options || []).map((opt) => {
              const optText = lang === 'ar' ? opt.option_text_ar : (opt.option_text_en || opt.option_text_ar);
              const isSelected = (selectedOptionIds[currentQuestion.id] || []).includes(opt.id);
              return (
                <div
                  key={opt.id}
                  onClick={() => handleSelectOption(opt.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: isSelected ? 'rgba(0,76,109,0.08)' : 'rgba(255,255,255,0.6)',
                    border: isSelected ? '2.5px solid #004c6d' : '1px solid rgba(11,40,73,0.13)',
                    borderRadius: '12px', padding: '15px 18px', cursor: 'pointer',
                    fontSize: '14px', color: '#0b2849',
                    fontWeight: isSelected ? 'bold' : 'normal',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: isSelected ? 'none' : '1.5px solid rgba(11,40,73,0.3)', background: isSelected ? '#004c6d' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isSelected && <span style={{ color: 'white', fontSize: '12px' }}>✓</span>}
                  </div>
                  {optText}
                </div>
              );
            })}
          </div>

          {/* Nav */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={handleBack} disabled={currentIndex === 0} style={{ background: 'none', border: 'none', color: currentIndex === 0 ? 'rgba(11,40,73,0.25)' : '#004c6d', cursor: currentIndex === 0 ? 'default' : 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
              {lang === 'ar' ? 'السابق' : 'Back'}
            </button>
            <Button onClick={handleNext} disabled={!(selectedOptionIds[currentQuestion.id] && selectedOptionIds[currentQuestion.id].length > 0)} variant="gradient" style={{ padding: '9px 26px', fontSize: '13.5px' }}>
              {currentIndex === questions.length - 1
                ? (lang === 'ar' ? 'إنهاء الاختبار' : 'Finish Quiz')
                : (lang === 'ar' ? 'التالي' : 'Next')}
            </Button>
          </div>
        </div>
      ) : (
        /* Results */
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>{passed ? '🎉' : '⚠️'}</div>
          <h3 style={{ color: '#0b2849', fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>
            {passed
              ? (lang === 'ar' ? 'تهانينا! لقد اجتزت الاختبار' : 'Congratulations! You passed!')
              : (lang === 'ar' ? 'لم تتجاوز الحد الأدنى للاجتياز' : 'You did not reach the passing score')}
          </h3>
          <p style={{ color: 'rgba(11,40,73,0.6)', fontSize: '14px', margin: '0 0 8px 0' }}>
            {lang === 'ar' ? 'درجتك:' : 'Your score:'}{' '}
            <strong style={{ color: passed ? '#15b47a' : '#ff4d4d', fontSize: '22px' }}>{score}%</strong>
          </p>
          <p style={{ color: 'rgba(11,40,73,0.45)', fontSize: '13px', marginBottom: '28px' }}>
            {lang === 'ar' ? `الحد الأدنى للاجتياز: ${passingScore}%` : `Passing score: ${passingScore}%`}
          </p>
          {passed && (
            <p style={{ fontSize: '13px', color: '#15b47a', marginBottom: '24px', fontWeight: 'bold' }}>
              {lang === 'ar' ? '✓ تم تسجيل إتمام هذا الدرس وتحديث تقدمك التعليمي.' : '✓ Lesson completion has been recorded.'}
            </p>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            {!passed && (
              <Button variant="gradient" onClick={handleRetry} style={{ padding: '10px 24px', fontSize: '13px' }}>
                {lang === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
              </Button>
            )}
            <Button variant="outline" onClick={onClose} style={{ padding: '10px 24px', fontSize: '13px', borderColor: '#004c6d', color: '#004c6d' }}>
              {lang === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
