import { useState } from 'preact/hooks';
import { Button } from '../../shared/components/Button';
import { GlassCard } from '../../shared/components/GlassCard';

export function QuizWidget({ quizQuestions = [], onQuizFinished, onClose }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  if (!quizQuestions || quizQuestions.length === 0) return null;

  const currentQuestion = quizQuestions[currentQuestionIndex];

  const handleSelectAnswer = (optionIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: optionIndex
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Calculate score
      let correctCount = 0;
      quizQuestions.forEach((q, idx) => {
        if (selectedAnswers[idx] === q.correctAnswer) {
          correctCount++;
        }
      });
      const finalScore = Math.round((correctCount / quizQuestions.length) * 100);
      setScore(finalScore);
      setShowResults(true);
      if (onQuizFinished) {
        onQuizFinished(finalScore);
      }
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  return (
    <GlassCard style={{ padding: '30px', maxWidth: '600px', width: '100%', margin: '0 auto', direction: 'rtl', textAlign: 'right' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(11,40,73,0.1)', paddingBottom: '12px', marginBottom: '20px' }}>
        <h4 style={{ color: '#0b2849', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
          اختبار تقييم الدرس
        </h4>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#ff4d4d' }}>&times;</button>
        )}
      </div>

      {!showResults ? (
        <div>
          {/* Progress bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(11,40,73,0.5)', marginBottom: '8px' }}>
            <span>السؤال {currentQuestionIndex + 1} من {quizQuestions.length}</span>
            <span>{Math.round(((currentQuestionIndex) / quizQuestions.length) * 100)}% مكتمل</span>
          </div>
          <div style={{ width: '100%', height: '4px', background: 'rgba(11,40,73,0.06)', borderRadius: '2px', marginBottom: '24px', overflow: 'hidden' }}>
            <div style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%`, height: '100%', background: '#004c6d', borderRadius: '2px', transition: 'width 0.2s' }}></div>
          </div>

          {/* Question Title */}
          <h3 style={{ color: '#0b2849', fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', lineHeight: '1.4' }}>
            {currentQuestion.text}
          </h3>

          {/* Options List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
            {currentQuestion.options.map((opt, idx) => {
              const isSelected = selectedAnswers[currentQuestionIndex] === idx;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelectAnswer(idx)}
                  style={{
                    background: isSelected ? 'rgba(0, 76, 109, 0.08)' : 'rgba(255,255,255,0.5)',
                    border: isSelected ? '2.5px solid #004c6d' : '1px solid rgba(11,40,73,0.15)',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#0b2849',
                    fontWeight: isSelected ? 'bold' : 'normal',
                    transition: 'all 0.15s'
                  }}
                >
                  {opt}
                </div>
              );
            })}
          </div>

          {/* Actions Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={handleBack}
              disabled={currentQuestionIndex === 0}
              style={{
                background: 'none',
                border: 'none',
                color: currentQuestionIndex === 0 ? 'rgba(11,40,73,0.3)' : '#004c6d',
                cursor: currentQuestionIndex === 0 ? 'default' : 'pointer',
                fontWeight: 'bold',
                fontSize: '13.5px'
              }}
            >
              السابق
            </button>
            <Button
              onClick={handleNext}
              disabled={selectedAnswers[currentQuestionIndex] === undefined}
              variant="gradient"
              style={{ padding: '8px 24px', fontSize: '13px' }}
            >
              {currentQuestionIndex === quizQuestions.length - 1 ? 'إنهاء الاختبار' : 'التالي'}
            </Button>
          </div>
        </div>
      ) : (
        /* Results view */
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>{score >= 80 ? '🎉' : '⚠️'}</div>
          <h3 style={{ color: '#0b2849', fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
            {score >= 80 ? 'تهانينا! لقد اجتزت الاختبار' : 'لم تتجاوز الحد الأدنى للاجتياز'}
          </h3>
          <p style={{ color: 'rgba(11,40,73,0.6)', fontSize: '14px', margin: '0 0 20px 0' }}>
            درجتك هي: <strong style={{ color: score >= 80 ? '#15b47a' : '#ff4d4d', fontSize: '20px' }}>{score}%</strong> (الحد الأدنى للاجتياز 80%)
          </p>

          {score >= 80 ? (
            <p style={{ fontSize: '13px', color: 'rgba(11,40,73,0.5)', marginBottom: '30px' }}>
              تم تسجيل إتمام هذا الدرس بنجاح، وتحديث شريط تقدمك التعليمي.
            </p>
          ) : (
            <p style={{ fontSize: '13px', color: 'rgba(11,40,73,0.5)', marginBottom: '30px' }}>
              يرجى إعادة قراءة الدرس والتحقق من التفاصيل وإعادة المحاولة.
            </p>
          )}

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            {score < 80 && (
              <Button
                variant="gradient"
                onClick={() => {
                  setCurrentQuestionIndex(0);
                  setSelectedAnswers({});
                  setShowResults(false);
                }}
                style={{ padding: '10px 24px', fontSize: '13px' }}
              >
                إعادة المحاولة
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onClose}
              style={{ padding: '10px 24px', fontSize: '13px', borderColor: '#004c6d', color: '#004c6d' }}
            >
              إغلاق
            </Button>
          </div>
        </div>
      )}

    </GlassCard>
  );
}
