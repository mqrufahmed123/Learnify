import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, RotateCcw, Brain, CheckCircle2, Flame, Sparkles, Layers, Sliders, Tag, Clock } from 'lucide-react';
import api from '../api';

export default function SRSStudyModal({ subjectId, selectedDeckId, isOpen, onClose, onSessionComplete }) {
  const [algorithm, setAlgorithm] = useState('fsrs'); // 'sm2' | 'fsrs'
  const [isCramMode, setIsCramMode] = useState(false);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Session Statistics
  const [sessionStats, setSessionStats] = useState({
    reviewed: 0,
    againCount: 0,
    hardCount: 0,
    goodCount: 0,
    easyCount: 0
  });

  const fetchDueQueue = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/flashcards/${subjectId}/due?algorithm=${algorithm}`;
      if (selectedDeckId && selectedDeckId !== 'all') {
        url += `&deckId=${selectedDeckId}`;
      }
      if (isCramMode) {
        url += `&cram=true`;
      }

      const { data } = await api.get(url);
      setQueue(data);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (err) {
      console.error('Failed to fetch SRS due queue:', err);
    } finally {
      setLoading(false);
    }
  }, [subjectId, selectedDeckId, algorithm, isCramMode]);

  useEffect(() => {
    if (isOpen) {
      fetchDueQueue();
      setSessionStats({ reviewed: 0, againCount: 0, hardCount: 0, goodCount: 0, easyCount: 0 });
    }
  }, [isOpen, fetchDueQueue]);

  // Handle Card Rating Submission
  const handleRating = async (rating) => {
    if (submitting || queue.length === 0 || currentIndex >= queue.length) return;

    const currentCard = queue[currentIndex];
    setSubmitting(true);

    try {
      const { data } = await api.post(`/flashcards/card/${currentCard._id}/review`, {
        rating,
        algorithm
      });

      // Update session statistics
      setSessionStats(prev => ({
        ...prev,
        reviewed: prev.reviewed + 1,
        againCount: rating === 1 ? prev.againCount + 1 : prev.againCount,
        hardCount: rating === 2 ? prev.hardCount + 1 : prev.hardCount,
        goodCount: rating === 3 ? prev.goodCount + 1 : prev.goodCount,
        easyCount: rating === 4 ? prev.easyCount + 1 : prev.easyCount,
      }));

      // If rated 'Again' (1), re-queue card to end of current session
      if (rating === 1 && queue.length < 50) {
        const reQueueCard = { ...data.flashcard, previews: data.previews };
        setQueue(prev => [...prev, reQueueCard]);
      }

      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Keyboard Navigation (Space for flip, 1-4 for ratings)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (isFlipped) {
        if (e.key === '1') handleRating(1);
        if (e.key === '2') handleRating(2);
        if (e.key === '3') handleRating(3);
        if (e.key === '4') handleRating(4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFlipped, currentIndex, queue, submitting]);

  if (!isOpen) return null;

  const currentCard = queue[currentIndex];
  const isFinished = !loading && (queue.length === 0 || currentIndex >= queue.length);

  return createPortal(
    <div className="modal-backdrop animate-fade-in" style={{ zIndex: 1000, background: 'rgba(5, 8, 22, 0.85)', backdropFilter: 'blur(16px)' }}>
      <div 
        className="glass-panel flex flex-col justify-between"
        style={{
          width: '100%',
          maxWidth: '780px',
          minHeight: '580px',
          maxHeight: '90vh',
          borderRadius: '1.5rem',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 15, 30, 0.98) 100%)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
          padding: '1.5rem'
        }}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div className="flex items-center gap-3">
            <div style={{ padding: '0.6rem', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '0.75rem', color: '#60a5fa' }}>
              <Brain size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                SRS Spaced Repetition
                <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: algorithm === 'fsrs' ? 'rgba(139, 92, 246, 0.25)' : 'rgba(59, 130, 246, 0.25)', color: algorithm === 'fsrs' ? '#a78bfa' : '#60a5fa', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {algorithm === 'fsrs' ? 'FSRS-4.5 (Optimized)' : 'SM-2 (Legacy SuperMemo)'}
                </span>
              </h3>
              <p className="text-xs text-secondary">
                {isFinished ? 'Session Finished' : `Card ${currentIndex + 1} of ${queue.length} due`}
              </p>
            </div>
          </div>

          {/* Controls & Switchers */}
          <div className="flex items-center gap-3">
            {/* Algorithm Switcher */}
            <div 
              style={{
                display: 'inline-flex',
                background: 'rgba(0,0,0,0.4)',
                padding: '0.2rem',
                borderRadius: '0.6rem',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <button
                onClick={() => setAlgorithm('fsrs')}
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: '0.45rem',
                  fontSize: '0.725rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: algorithm === 'fsrs' ? 'var(--accent-secondary)' : 'transparent',
                  color: algorithm === 'fsrs' ? '#ffffff' : '#94a3b8'
                }}
              >
                FSRS
              </button>
              <button
                onClick={() => setAlgorithm('sm2')}
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: '0.45rem',
                  fontSize: '0.725rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: algorithm === 'sm2' ? 'var(--accent-primary)' : 'transparent',
                  color: algorithm === 'sm2' ? '#ffffff' : '#94a3b8'
                }}
              >
                SM-2
              </button>
            </div>

            {/* Cram Mode Toggle */}
            <button
              onClick={() => setIsCramMode(prev => !prev)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.35rem 0.65rem',
                borderRadius: '0.6rem',
                fontSize: '0.725rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: isCramMode ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255,255,255,0.06)',
                border: '1px solid',
                borderColor: isCramMode ? '#eab308' : 'rgba(255,255,255,0.1)',
                color: isCramMode ? '#fde047' : '#94a3b8'
              }}
              title="Study all cards regardless of due date"
            >
              <Flame size={13} /> {isCramMode ? 'Cramming All' : 'Due Only'}
            </button>

            {/* Close Button */}
            <button 
              onClick={() => {
                onClose();
                if (onSessionComplete) onSessionComplete();
              }}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.3rem' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col justify-center py-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <RotateCcw className="animate-spin text-blue mb-3" size={32} style={{ animation: 'spin 1s linear infinite' }} />
              <p className="text-sm text-secondary">Fetching due cards and initializing SRS intervals...</p>
            </div>
          ) : isFinished ? (
            /* Finished Session Screen */
            <div className="flex flex-col items-center justify-center text-center py-8 animate-fade-in">
              <div 
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '80px',
                  height: '80px',
                  background: 'rgba(16, 185, 129, 0.15)', 
                  borderRadius: '50%', 
                  marginBottom: '1.25rem', 
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  boxShadow: '0 0 25px rgba(16, 185, 129, 0.25)'
                }}
              >
                <CheckCircle2 size={44} style={{ color: '#10b981' }} />
              </div>

              <h4 className="text-2xl font-bold mb-2 text-white">Study Session Complete! 🎉</h4>
              <p className="text-sm text-secondary mb-6 max-w-md">
                {queue.length === 0 && !isCramMode 
                  ? "Great job! You have no cards due for review right now." 
                  : `You reviewed ${sessionStats.reviewed} flashcards using the ${algorithm.toUpperCase()} scheduler.`}
              </p>

              {/* Stat breakdown */}
              {sessionStats.reviewed > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem', width: '100%', maxWidth: '440px', marginBottom: '1.75rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.15)', padding: '0.75rem 0.5rem', borderRadius: '0.75rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f87171', marginBottom: '0.25rem' }}>Again</span>
                    <span style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff', lineHeight: 1 }}>{sessionStats.againCount}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(245, 158, 11, 0.15)', padding: '0.75rem 0.5rem', borderRadius: '0.75rem', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fbbf24', marginBottom: '0.25rem' }}>Hard</span>
                    <span style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff', lineHeight: 1 }}>{sessionStats.hardCount}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(16, 185, 129, 0.15)', padding: '0.75rem 0.5rem', borderRadius: '0.75rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#34d399', marginBottom: '0.25rem' }}>Good</span>
                    <span style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff', lineHeight: 1 }}>{sessionStats.goodCount}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(59, 130, 246, 0.15)', padding: '0.75rem 0.5rem', borderRadius: '0.75rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#60a5fa', marginBottom: '0.25rem' }}>Easy</span>
                    <span style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff', lineHeight: 1 }}>{sessionStats.easyCount}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {!isCramMode && (
                  <button 
                    onClick={() => { setIsCramMode(true); }}
                    className="btn btn-secondary"
                    style={{ width: 'auto', fontSize: '0.85rem' }}
                  >
                    <Flame size={15} /> Cram All Cards Now
                  </button>
                )}
                <button 
                  onClick={() => { onClose(); if (onSessionComplete) onSessionComplete(); }}
                  className="btn btn-primary"
                  style={{ width: 'auto', fontSize: '0.85rem' }}
                >
                  Return to Flashcards
                </button>
              </div>
            </div>
          ) : (
            /* Active Card Flashcard Review */
            <div className="flex flex-col items-center">
              {/* Card Meta Bar */}
              <div className="w-full flex justify-between items-center mb-3 px-2">
                <div className="flex items-center gap-2">
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '0.35rem',
                    background: currentCard.state === 'new' || currentCard.reps === 0
                      ? 'rgba(59, 130, 246, 0.2)'
                      : currentCard.state === 'relearning' || currentCard.state === 'learning'
                        ? 'rgba(245, 158, 11, 0.2)'
                        : 'rgba(16, 185, 129, 0.2)',
                    color: currentCard.state === 'new' || currentCard.reps === 0
                      ? '#60a5fa'
                      : currentCard.state === 'relearning' || currentCard.state === 'learning'
                        ? '#fbbf24'
                        : '#34d399',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    {currentCard.state || 'New'}
                  </span>

                  {currentCard.topic && (
                    <span className="flex items-center gap-1 text-xs text-secondary" style={{ background: 'rgba(255,255,255,0.06)', padding: '0.15rem 0.45rem', borderRadius: '0.35rem' }}>
                      <Tag size={10} /> {currentCard.topic}
                    </span>
                  )}
                </div>

                {/* SRS Info (Stability / Reps) */}
                <div className="flex items-center gap-3 text-xs text-secondary">
                  {algorithm === 'fsrs' ? (
                    <span>Stability: <strong className="text-white">{currentCard.stability ? `${currentCard.stability}d` : 'New'}</strong></span>
                  ) : (
                    <span>Ease: <strong className="text-white">{Math.round((currentCard.easeFactor || 2.5) * 100)}%</strong></span>
                  )}
                  <span>Reps: <strong className="text-white">{currentCard.reps || 0}</strong></span>
                </div>
              </div>

              {/* 3D Flip Card */}
              <div 
                style={{
                  width: '100%',
                  height: '280px',
                  perspective: '1000px',
                  cursor: 'pointer'
                }}
                onClick={() => setIsFlipped(prev => !prev)}
              >
                <div 
                  style={{
                    width: '100%',
                    height: '100%',
                    transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    transformStyle: 'preserve-3d',
                    position: 'relative',
                    transform: isFlipped ? 'rotateY(180deg)' : 'none'
                  }}
                >
                  {/* Front (Question) */}
                  <div 
                    className="glass-panel flex flex-col items-center justify-center text-center p-6 relative"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backfaceVisibility: 'hidden',
                      borderRadius: '1.25rem',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      background: 'rgba(15, 23, 42, 0.85)',
                      boxShadow: '0 12px 30px rgba(0,0,0,0.4)'
                    }}
                  >
                    <span style={{ position: 'absolute', top: '1rem', left: '1.25rem', fontSize: '0.7rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Question
                    </span>

                    <p className="text-lg font-medium text-white leading-relaxed px-4">
                      {currentCard.question}
                    </p>

                    <span style={{ position: 'absolute', bottom: '1rem', fontSize: '0.725rem', color: '#94a3b8' }}>
                      Click card or press <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.35rem', borderRadius: '0.25rem' }}>Space</kbd> to flip 🔄
                    </span>
                  </div>

                  {/* Back (Answer) */}
                  <div 
                    className="glass-panel flex flex-col items-center justify-center text-center p-6 relative"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      borderRadius: '1.25rem',
                      border: '1px solid rgba(139, 92, 246, 0.4)',
                      background: 'rgba(20, 15, 35, 0.95)',
                      boxShadow: '0 12px 30px rgba(0,0,0,0.5)'
                    }}
                  >
                    <span style={{ position: 'absolute', top: '1rem', left: '1.25rem', fontSize: '0.7rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Answer
                    </span>

                    <p className="text-lg font-medium text-white leading-relaxed px-4">
                      {currentCard.answer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Rating Bar (Shown when Card is Flipped) */}
        {!isFinished && (
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem' }}>
            {!isFlipped ? (
              <button
                onClick={() => setIsFlipped(true)}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem', fontWeight: 600 }}
              >
                Show Answer (Space)
              </button>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                {/* 1: Again (Red) */}
                <button
                  onClick={() => handleRating(1)}
                  disabled={submitting}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.65rem',
                    borderRadius: '0.85rem',
                    background: 'rgba(239, 68, 68, 0.18)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#f87171',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.35)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)'}
                >
                  <span style={{ fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase', fontWeight: 700 }}>
                    {currentCard.previews?.[1]?.label || '<10m'}
                  </span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.1rem' }}>Again (1)</span>
                </button>

                {/* 2: Hard (Orange) */}
                <button
                  onClick={() => handleRating(2)}
                  disabled={submitting}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.65rem',
                    borderRadius: '0.85rem',
                    background: 'rgba(245, 158, 11, 0.18)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    color: '#fbbf24',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.35)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.18)'}
                >
                  <span style={{ fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase', fontWeight: 700 }}>
                    {currentCard.previews?.[2]?.label || '1d'}
                  </span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.1rem' }}>Hard (2)</span>
                </button>

                {/* 3: Good (Green) */}
                <button
                  onClick={() => handleRating(3)}
                  disabled={submitting}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.65rem',
                    borderRadius: '0.85rem',
                    background: 'rgba(16, 185, 129, 0.18)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#34d399',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.35)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.18)'}
                >
                  <span style={{ fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase', fontWeight: 700 }}>
                    {currentCard.previews?.[3]?.label || '3d'}
                  </span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.1rem' }}>Good (3)</span>
                </button>

                {/* 4: Easy (Blue) */}
                <button
                  onClick={() => handleRating(4)}
                  disabled={submitting}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.65rem',
                    borderRadius: '0.85rem',
                    background: 'rgba(59, 130, 246, 0.18)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    color: '#60a5fa',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.35)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.18)'}
                >
                  <span style={{ fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase', fontWeight: 700 }}>
                    {currentCard.previews?.[4]?.label || '7d'}
                  </span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.1rem' }}>Easy (4)</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
