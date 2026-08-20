import { useState, useEffect } from 'react';
import { HelpCircle, RefreshCw, Wand2, Loader2, ArrowLeft, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import api from '../api';
import GenerationProgressBar from './GenerationProgressBar';

export default function Quizzes({ subjectId }) {
  const [history, setHistory] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(null); // attemptId being loaded

  useEffect(() => {
    fetchHistory();
  }, [subjectId]);

  const fetchHistory = async () => {
    try {
      const { data } = await api.get(`/quiz/${subjectId}/history`);
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch quiz history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post(`/quiz/${subjectId}/generate`);
      setActiveQuiz(data);
      setCurrentQuestionIdx(0);
      setAnswers({});
      setQuizResult(null);
    } catch (err) {
      console.error('Failed to generate quiz:', err);
      alert('Failed to generate quiz. Please ensure you have uploaded documents.');
    } finally {
      setGenerating(false);
    }
  };

  const handleViewAttempt = async (attemptId) => {
    setReviewLoading(attemptId);
    try {
      const { data } = await api.get(`/quiz/attempt/${attemptId}`);
      setActiveQuiz(null);
      setQuizResult(data);
    } catch (err) {
      console.error('Failed to load attempt:', err);
      alert('Could not load the selected quiz attempt. Please try again.');
    } finally {
      setReviewLoading(null);
    }
  };

  const handleSelectOption = (option) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIdx]: option
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    const formattedAnswers = Object.entries(answers).map(([idx, selectedAnswer]) => ({
      questionIndex: parseInt(idx),
      selectedAnswer
    }));

    try {
      const { data } = await api.post(`/quiz/${activeQuiz._id}/submit`, { answers: formattedAnswers });
      setQuizResult(data);
      fetchHistory();
    } catch (err) {
      console.error('Failed to submit quiz:', err);
      alert('Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-fade-in text-blue" size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>;
  }

  // Quiz Taking View
  if (activeQuiz && !quizResult) {
    const question = activeQuiz.questions[currentQuestionIdx];
    const hasAnsweredAll = Object.keys(answers).length === activeQuiz.questions.length;
    
    return (
      <div className="mx-auto animate-fade-in" style={{ maxWidth: '800px', paddingBottom: '2rem' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{activeQuiz.title}</h2>
          <span className="text-secondary">Question {currentQuestionIdx + 1} of {activeQuiz.questions.length}</span>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '0.5rem', borderRadius: '9999px', marginBottom: '2rem', overflow: 'hidden' }}>
          <div 
            style={{ 
              background: 'var(--accent-primary)', 
              height: '100%', 
              transition: 'width 0.3s ease',
              width: `${((currentQuestionIdx + 1) / activeQuiz.questions.length) * 100}%` 
            }}
          ></div>
        </div>

        <div className="glass-panel mb-8">
          <h3 className="text-xl font-medium mb-6">{question.questionText}</h3>
          
          <div className="flex flex-col gap-3">
            {question.options.map((option, idx) => {
              const isSelected = answers[currentQuestionIdx] === option;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(option)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid',
                    transition: 'all 0.3s ease',
                    background: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(0,0,0,0.2)',
                    borderColor: isSelected ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                    color: isSelected ? 'white' : 'var(--text-secondary)',
                    boxShadow: isSelected ? '0 0 15px rgba(59,130,246,0.3)' : 'none'
                  }}
                  onMouseOver={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(0,0,0,0.2)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    }
                  }}
                >
                  <span style={{ display: 'inline-block', width: '1.5rem', color: 'var(--text-muted)' }}>{String.fromCharCode(65 + idx)}.</span> {option}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between">
          <button 
            className="btn btn-secondary"
            style={{ width: 'auto' }}
            onClick={() => setCurrentQuestionIdx(Math.max(0, currentQuestionIdx - 1))}
            disabled={currentQuestionIdx === 0}
          >
            Previous
          </button>
          
          {currentQuestionIdx === activeQuiz.questions.length - 1 ? (
            <button 
              className="btn btn-primary"
              style={{ width: 'auto' }}
              onClick={handleSubmit}
              disabled={!hasAnsweredAll || submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          ) : (
            <button 
              className="btn btn-primary"
              style={{ width: 'auto' }}
              onClick={() => setCurrentQuestionIdx(Math.min(activeQuiz.questions.length - 1, currentQuestionIdx + 1))}
              disabled={!answers[currentQuestionIdx]}
            >
              Next
            </button>
          )}
        </div>
      </div>
    );
  }

  // Quiz Results View
  if (quizResult) {
    const score = quizResult.attempt?.score ?? quizResult.score ?? 0;
    const totalQuestions = quizResult.attempt?.totalQuestions ?? quizResult.totalQuestions ?? 0;
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const reviewList = quizResult.review || [];

    const handleBackToQuizzes = () => {
      setActiveQuiz(null);
      setQuizResult(null);
    };

    return (
      <div className="mx-auto animate-fade-in" style={{ maxWidth: '800px', paddingBottom: '3rem' }}>
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={handleBackToQuizzes}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              padding: '0.5rem 1rem',
              borderRadius: '0.75rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
              e.currentTarget.style.borderColor = '#60a5fa';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
          >
            <ArrowLeft size={16} /> Back to Quizzes
          </button>

          <button 
            onClick={() => handleGenerate()}
            className="btn btn-primary"
            style={{ width: 'auto', fontSize: '0.825rem', padding: '0.5rem 1rem' }}
          >
            <Wand2 size={15} /> Take Another Quiz
          </button>
        </div>

        {/* Score Card Dashboard */}
        <div className="glass-panel text-center mb-8 relative overflow-hidden" style={{ padding: '2.5rem 2rem' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '0.5rem', background: 'var(--accent-gradient)' }}></div>
          <h2 className="text-3xl font-bold mb-2">Quiz Completed!</h2>
          <div style={{ 
            fontSize: '4.5rem', 
            fontWeight: 800, 
            marginBottom: '0.5rem', 
            color: percentage >= 70 ? '#10b981' : percentage >= 40 ? '#f59e0b' : '#ef4444' 
          }}>
            {percentage}%
          </div>
          <p className="text-secondary text-base mb-6">
            You scored <span className="font-bold text-white">{score}</span> out of <span className="font-bold text-white">{totalQuestions}</span> questions correctly.
          </p>

          <div className="flex justify-center gap-3">
            <button 
              className="btn btn-secondary"
              style={{ width: 'auto', padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
              onClick={handleBackToQuizzes}
            >
              <ArrowLeft size={16} /> Back to Quizzes List
            </button>
          </div>
        </div>

        {/* Detailed Review Section */}
        {reviewList.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4">Question Review ({reviewList.length})</h3>
            <div className="flex flex-col gap-4">
              {reviewList.map((item, idx) => (
                <div 
                  key={idx} 
                  className="glass-panel p-5"
                  style={{
                    border: '1px solid',
                    borderColor: item.isCorrect ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                    background: item.isCorrect ? 'rgba(16, 185, 129, 0.04)' : 'rgba(239, 68, 68, 0.04)'
                  }}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h4 className="font-semibold text-base text-white">
                      {idx + 1}. {item.questionText}
                    </h4>
                    <span 
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '0.35rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: item.isCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: item.isCorrect ? '#10b981' : '#ef4444',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {item.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                  </div>

                  <div className="text-xs flex flex-col gap-1.5 mt-2">
                    <p style={{ color: item.isCorrect ? '#10b981' : '#ef4444' }}>
                      <span className="text-secondary font-medium">Your answer:</span> {item.selectedAnswer || 'Not answered'}
                    </p>
                    {!item.isCorrect && (
                      <p style={{ color: '#10b981' }}>
                        <span className="text-secondary font-medium">Correct answer:</span> {item.correctAnswer}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center gap-4 pt-2">
          <button 
            className="btn btn-secondary"
            style={{ width: 'auto' }}
            onClick={handleBackToQuizzes}
          >
            <ArrowLeft size={16} /> Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  // History & Start View
  return (
    <div className="mx-auto animate-fade-in" style={{ maxWidth: '1000px', paddingBottom: '2rem' }}>
      <GenerationProgressBar 
        isOpen={generating}
        title="Generating Multiple-Choice Quiz"
        subtitle="Analyzing subject documents & creating questions..."
        stages={[
          'Scanning lecture notes & document content',
          'Generating question stems & 4 options',
          'Validating distractors & answer keys',
          'Finalizing quiz suite'
        ]}
      />

      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold mb-2">Quizzes</h2>
          <p className="text-secondary">Test your knowledge with AI-generated quizzes.</p>
        </div>
        <button 
          className="btn btn-primary"
          style={{ width: 'auto' }}
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? (
            <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</>
          ) : (
            <><Wand2 size={16} /> Generate New Quiz</>
          )}
        </button>
      </div>

      <h3 className="text-lg font-medium mb-4">Past Attempts ({history.length})</h3>
      
      {history.length === 0 ? (
        <div className="glass-panel text-center flex flex-col items-center justify-center p-8" style={{ border: '2px dashed var(--border-hover)' }}>
          <HelpCircle size={64} className="text-muted mb-4" />
          <h3 className="text-xl font-semibold mb-2">No quizzes taken yet</h3>
          <p className="text-secondary">Generate your first quiz to start testing your knowledge.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {history.map(attempt => {
            const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
            const scoreColor = percentage >= 70 ? '#10b981' : percentage >= 40 ? '#f59e0b' : '#ef4444';
            const isLoading = reviewLoading === attempt._id;
            return (
              <div
                key={attempt._id}
                onClick={() => !isLoading && handleViewAttempt(attempt._id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.25rem',
                  borderRadius: '0.875rem',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                  cursor: isLoading ? 'wait' : 'pointer',
                  transition: 'all 0.2s ease',
                  gap: '1rem',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.25)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Left: score ring + date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                  {/* Score circle */}
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: `rgba(${scoreColor === '#10b981' ? '16,185,129' : scoreColor === '#f59e0b' ? '245,158,11' : '239,68,68'}, 0.12)`,
                    border: `2px solid ${scoreColor}`,
                  }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{percentage}%</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                      {attempt.quizId?.title || 'Quiz Attempt'}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {new Date(attempt.createdAt).toLocaleString()} &nbsp;·&nbsp;
                      <span style={{ color: scoreColor }}>{attempt.score}/{attempt.totalQuestions} correct</span>
                    </p>
                  </div>
                </div>

                {/* Right: Review button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  {isLoading ? (
                    <Loader2 size={18} style={{ color: '#60a5fa', animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      fontSize: '0.78rem', fontWeight: 600, color: '#60a5fa',
                      padding: '0.3rem 0.75rem', borderRadius: '0.5rem',
                      background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)',
                    }}>
                      Review <ChevronRight size={14} />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
