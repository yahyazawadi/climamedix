import { useState, useRef } from 'preact/hooks';
import { Button } from '../../../shared/components/Button';

export function QuizWidget({ quizData, onQuizFinished, onClose, lang = 'ar', reviewMode = false, pastScore = null }) {
  const passingScore = quizData?.passing_score ?? 80;
  const questions = quizData?.quiz_questions || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIds, setSelectedOptionIds] = useState({});
  const selectionsRef = useRef({});

  // Initialize review mode state if requested
  const initialQuestionResults = reviewMode ? questions.map(q => {
    const correctOptIds = (q.quiz_options || []).filter(opt => opt.is_correct).map(o => o.id);
    return { question: q, selectedIds: correctOptIds, isCorrect: true };
  }) : [];

  const [showResults, setShowResults] = useState(reviewMode);
  const [score, setScore] = useState(reviewMode && pastScore !== null ? pastScore : 0);
  const [passed, setPassed] = useState(reviewMode ? (pastScore >= passingScore) : false);
  const [questionResults, setQuestionResults] = useState(initialQuestionResults);

  if (!quizData || questions.length === 0) return null;

  const currentQuestion = questions[currentIndex];
  const isRTL = lang === 'ar';

  const handleSelectOption = (optionId) => {
    setSelectedOptionIds(prev => {
      const cur = prev[currentQuestion.id] || [];
      const next = cur.includes(optionId)
        ? cur.filter(id => id !== optionId)
        : [...cur, optionId];
      const updated = { ...prev, [currentQuestion.id]: next };
      selectionsRef.current = updated; // always keep ref in sync
      return updated;
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(p => p + 1);
    } else {
      // Use ref for guaranteed latest selections (avoids stale closure)
      const latestSelections = selectionsRef.current;
      let totalPoints = 0, earnedPoints = 0;
      const results = questions.map(q => {
        const pts = q.points ?? 1;
        totalPoints += pts;
        const selectedIds = latestSelections[q.id] || [];
        const correctIds = (q.quiz_options || []).filter(o => o.is_correct).map(o => o.id);
        const isCorrect = selectedIds.length === correctIds.length && selectedIds.every(id => correctIds.includes(id));
        if (isCorrect) earnedPoints += pts;
        return { question: q, selectedIds: [...selectedIds], isCorrect };
      });

      const finalScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      const didPass = finalScore >= passingScore;
      setScore(finalScore);
      setPassed(didPass);
      setQuestionResults(results);
      setShowResults(true);
      if (onQuizFinished) onQuizFinished(finalScore, didPass, quizData.id);
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedOptionIds({});
    selectionsRef.current = {};
    setShowResults(false);
    setScore(0);
    setPassed(false);
    setQuestionResults([]);
  };

  const quizTitle = isRTL ? quizData.title_ar : (quizData.title_en || quizData.title_ar);
  const questionText = isRTL
    ? currentQuestion.question_text_ar
    : (currentQuestion.question_text_en || currentQuestion.question_text_ar);
  const progressPct = ((currentIndex + 1) / questions.length) * 100;

  const correctCount = questionResults.filter(r => r.isCorrect).length;

  return (
    <div style={{
      width: '100%', maxWidth: '680px', margin: '0 auto',
      direction: isRTL ? 'rtl' : 'ltr', textAlign: isRTL ? 'right' : 'left',
      fontFamily: "'Inter', sans-serif"
    }}>
      {!showResults ? (
        /* ─── QUESTION VIEW ─────────────────────────────────────── */
        <div style={{ background: '#ffffff', borderRadius: '20px', boxShadow: '0 4px 32px rgba(11,40,73,0.10)', overflow: 'hidden' }}>

          {/* Top bar */}
          <div style={{ background: 'linear-gradient(135deg, #0b2849 0%, #004c6d 100%)', padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '2px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                {quizTitle || (isRTL ? 'اختبار' : 'Quiz')}
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>
                {isRTL ? `السؤال ${currentIndex + 1} من ${questions.length}` : `Question ${currentIndex + 1} of ${questions.length}`}
              </div>
            </div>
            {onClose && (
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            )}
          </div>

          {/* Progress bar */}
          <div style={{ height: '4px', background: 'rgba(11,40,73,0.08)' }}>
            <div style={{ width: `${progressPct}%`, height: '100%', background: 'linear-gradient(90deg, #15b47a, #004c6d)', transition: 'width 0.35s ease' }} />
          </div>

          {/* Question body */}
          <div style={{ padding: '32px 28px' }}>
            <h3 style={{ color: '#0b2849', fontSize: '18px', fontWeight: '700', marginBottom: '24px', lineHeight: '1.6', margin: '0 0 28px 0' }}>
              {questionText}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
              {(currentQuestion.quiz_options || []).map((opt) => {
                const optText = isRTL ? opt.option_text_ar : (opt.option_text_en || opt.option_text_ar);
                const isSel = (selectedOptionIds[currentQuestion.id] || []).includes(opt.id);
                return (
                  <div key={opt.id} onClick={() => handleSelectOption(opt.id)} style={{
                    display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer',
                    padding: '14px 18px', borderRadius: '12px',
                    background: isSel ? 'rgba(0,76,109,0.07)' : '#f8fafc',
                    border: `2px solid ${isSel ? '#004c6d' : 'rgba(11,40,73,0.1)'}`,
                    transition: 'all 0.15s ease',
                    userSelect: 'none',
                  }}>
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '5px', flexShrink: 0,
                      border: `2px solid ${isSel ? '#004c6d' : 'rgba(11,40,73,0.25)'}`,
                      background: isSel ? '#004c6d' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s'
                    }}>
                      {isSel && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <span style={{ fontSize: '14.5px', color: isSel ? '#0b2849' : '#344054', fontWeight: isSel ? '600' : '400' }}>
                      {optText}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setCurrentIndex(p => p - 1)} disabled={currentIndex === 0}
                style={{ background: 'none', border: '1.5px solid rgba(11,40,73,0.15)', color: currentIndex === 0 ? 'rgba(11,40,73,0.2)' : '#0b2849', cursor: currentIndex === 0 ? 'default' : 'pointer', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: '600', transition: 'all 0.15s' }}>
                {isRTL ? '→ السابق' : '← Back'}
              </button>
              <Button
                onClick={handleNext}
                disabled={!(selectedOptionIds[currentQuestion.id]?.length > 0)}
                variant="gradient"
                style={{ padding: '10px 28px', fontSize: '13.5px', borderRadius: '10px' }}>
                {currentIndex === questions.length - 1
                  ? (isRTL ? 'إنهاء الاختبار ✓' : 'Finish ✓')
                  : (isRTL ? 'التالي ←' : 'Next →')}
              </Button>
            </div>
          </div>
        </div>

      ) : (
        /* ─── RESULTS VIEW ──────────────────────────────────────── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Score hero card */}
          <div style={{
            background: passed
              ? 'linear-gradient(135deg, #0b2849 0%, #005f3c 100%)'
              : 'linear-gradient(135deg, #0b2849 0%, #6b1a1a 100%)',
            borderRadius: '20px', padding: '36px 28px', textAlign: 'center', color: '#fff',
            boxShadow: '0 8px 32px rgba(11,40,73,0.18)'
          }}>
            <div style={{ fontSize: '52px', fontWeight: '800', letterSpacing: '-2px', marginBottom: '4px' }}>
              {score}<span style={{ fontSize: '28px', fontWeight: '600', opacity: 0.8 }}>%</span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: '600', opacity: 0.9, marginBottom: '16px' }}>
              {passed
                ? (isRTL ? 'تهانينا، لقد اجتزت الاختبار!' : 'Congratulations, you passed!')
                : (isRTL ? 'لم تتجاوز درجة الاجتياز بعد' : "You haven't reached the passing score yet")}
            </div>
            {!reviewMode && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '13px', opacity: 0.75 }}>
                <span>{isRTL ? `${correctCount} إجابة صحيحة` : `${correctCount} correct`}</span>
                <span>·</span>
                <span>{isRTL ? `${questions.length - correctCount} إجابة خاطئة` : `${questions.length - correctCount} wrong`}</span>
                <span>·</span>
                <span>{isRTL ? `الحد الأدنى: ${passingScore}%` : `Pass: ${passingScore}%`}</span>
              </div>
            )}
          </div>

          {/* Question review — all questions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {questionResults.map((result, i) => {
              const q = result.question;
              const qText = isRTL ? q.question_text_ar : (q.question_text_en || q.question_text_ar);

              return (
                <div key={q.id} style={{
                  background: '#fff', borderRadius: '16px',
                  border: `1.5px solid ${result.isCorrect ? 'rgba(21,180,122,0.3)' : 'rgba(11,40,73,0.1)'}`,
                  overflow: 'hidden',
                  boxShadow: '0 2px 12px rgba(11,40,73,0.06)'
                }}>
                  {/* Q header */}
                  <div style={{
                    padding: '14px 18px',
                    background: result.isCorrect ? 'rgba(21,180,122,0.06)' : 'rgba(11,40,73,0.02)',
                    borderBottom: `1px solid ${result.isCorrect ? 'rgba(21,180,122,0.15)' : 'rgba(11,40,73,0.07)'}`
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: result.isCorrect ? '#15b47a' : 'rgba(11,40,73,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {isRTL
                        ? (result.isCorrect ? `سؤال ${i + 1} — إجابة صحيحة` : `سؤال ${i + 1}`)
                        : (result.isCorrect ? `Q${i + 1} — Correct` : `Q${i + 1}`)}
                    </div>
                    <div style={{ fontSize: '14px', color: '#0b2849', fontWeight: '600', marginTop: '2px' }}>{qText}</div>
                  </div>

                  {/* Options review */}
                  <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(q.quiz_options || []).map(opt => {
                      const optText = isRTL ? opt.option_text_ar : (opt.option_text_en || opt.option_text_ar);
                      const wasSelected = result.selectedIds.includes(opt.id);
                      const isCorrectOpt = opt.is_correct;

                      let bg = 'transparent', border = 'rgba(11,40,73,0.08)', color = '#344054', icon = null, fw = '400';

                      if (wasSelected && isCorrectOpt) {
                        // Selected and correct → green
                        bg = 'rgba(21,180,122,0.08)'; border = '#15b47a'; color = '#0b5e38'; fw = '600';
                        icon = <span style={{ color: '#15b47a', fontWeight: 'bold', marginInlineStart: 'auto' }}>✓</span>;
                      }
                      // Not selected, or selected but wrong → plain (no hints)

                      return (
                        <div key={opt.id} style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 14px', borderRadius: '8px',
                          background: bg, border: `1.5px solid ${border}`,
                          fontSize: '13.5px', color, fontWeight: fw
                        }}>
                          <span style={{ flex: 1 }}>{optText}</span>
                          {icon}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          {!reviewMode && (
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', paddingBottom: '8px' }}>
              {!passed && (
                <Button variant="gradient" onClick={handleRetry} style={{ padding: '12px 28px', fontSize: '13.5px', borderRadius: '10px' }}>
                  {isRTL ? '↺ إعادة المحاولة' : '↺ Try Again'}
                </Button>
              )}
              <button onClick={onClose} style={{
                padding: '12px 28px', fontSize: '13.5px', borderRadius: '10px', cursor: 'pointer',
                background: 'transparent', border: '1.5px solid rgba(11,40,73,0.2)', color: '#0b2849', fontWeight: '600'
              }}>
                {isRTL ? 'إغلاق' : 'Close'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
