import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, CheckCircle2, Loader2 } from 'lucide-react';

export default function GenerationProgressBar({
  isOpen,
  title = 'Generating Content with AI',
  subtitle = 'Analyzing lecture notes and synthesizing concepts...',
  stages = [
    'Reading uploaded documents & context',
    'Analyzing key concepts & definitions',
    'Structuring card decks & QA pairs',
    'Finalizing format & saving'
  ]
}) {
  const [progress, setProgress] = useState(5);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setProgress(5);
      setCurrentStageIdx(0);
      return;
    }

    // Simulate steady progress steps during AI call
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return 92; // hold at 92 until request completes
        const increment = Math.floor(Math.random() * 8) + 4;
        const next = Math.min(prev + increment, 92);
        
        // Update stage based on progress threshold
        const stageProgress = (next / 92) * (stages.length - 1);
        setCurrentStageIdx(Math.floor(stageProgress));
        
        return next;
      });
    }, 600);

    return () => clearInterval(progressInterval);
  }, [isOpen, stages.length]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-backdrop animate-fade-in">
      <div 
        className="glass-panel w-full max-w-md p-8 relative overflow-hidden"
        style={{
          border: '1px solid rgba(59, 130, 246, 0.4)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(59, 130, 246, 0.2)'
        }}
      >
        {/* Top Gradient Accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--accent-gradient)' }}></div>

        <div className="flex items-center gap-3 mb-4">
          <div style={{ padding: '0.6rem', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '0.75rem', color: 'var(--accent-primary)' }}>
            <Sparkles size={24} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="text-xs text-secondary">{subtitle}</p>
          </div>
        </div>

        {/* Progress Bar Track */}
        <div className="my-6">
          <div className="flex justify-between items-center text-xs font-semibold mb-2">
            <span style={{ color: 'var(--accent-primary)' }}>AI Synthesis Progress</span>
            <span className="text-secondary">{Math.round(progress)}%</span>
          </div>
          
          <div style={{ width: '100%', height: '0.65rem', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div 
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
                borderRadius: '9999px',
                transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 0 12px rgba(139, 92, 246, 0.6)'
              }}
            />
          </div>
        </div>

        {/* Stages Checklist */}
        <div className="flex flex-col gap-3 mt-6">
          {stages.map((stage, idx) => {
            const isDone = idx < currentStageIdx;
            const isCurrent = idx === currentStageIdx;
            
            return (
              <div 
                key={idx} 
                className="flex items-center gap-3 text-sm"
                style={{
                  opacity: isDone || isCurrent ? 1 : 0.4,
                  transition: 'opacity 0.3s ease'
                }}
              >
                {isDone ? (
                  <CheckCircle2 size={18} style={{ color: 'var(--success)', minWidth: '18px' }} />
                ) : isCurrent ? (
                  <Loader2 size={18} className="animate-spin text-blue" style={{ minWidth: '18px', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px dashed rgba(255,255,255,0.3)', minWidth: '18px' }} />
                )}
                <span className={isCurrent ? 'font-medium text-white' : isDone ? 'text-secondary' : 'text-muted'}>
                  {stage}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
