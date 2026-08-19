import { useState, useId } from 'react';
import { Brain, Sparkles, Flame, CheckCircle2, RotateCcw, Info, ArrowRight, Zap, Target } from 'lucide-react';

export default function SRSAboutGraph() {
  const [activeReps, setActiveReps] = useState(4); // 0 to 4
  const [showNoSRS, setShowNoSRS] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const filterId = useId();

  // Graph Canvas Dimensions
  const width = 760;
  const height = 360;
  const paddingLeft = 65;
  const paddingRight = 35;
  const paddingTop = 60;
  const paddingBottom = 50;

  const graphWidth = width - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;

  // Day mapping to X coordinates (Day 0 to Day 14)
  const maxDays = 14;
  const getX = (day) => paddingLeft + (day / maxDays) * graphWidth;
  const getY = (recallPct) => paddingTop + graphHeight - (recallPct / 100) * graphHeight;

  // Key Review Nodes
  const reviewNodes = [
    { day: 1, label: 'Day 1', name: '1st Review', color: '#ef4444', recallBefore: 42, recallAfter: 100, interval: '1 day' },
    { day: 3, label: 'Day 3', name: '2nd Review', color: '#84cc16', recallBefore: 72, recallAfter: 100, interval: '3 days' },
    { day: 6, label: 'Day 6', name: '3rd Review', color: '#eab308', recallBefore: 84, recallAfter: 100, interval: '6 days' },
    { day: 10, label: 'Day 10', name: '4th Review', color: '#06b6d4', recallBefore: 90, recallAfter: 100, interval: '10+ days' },
  ];

  // SVG Path Generators
  // 1. Initial Decay Curve (Day 0 -> Day 14 without SRS)
  const noSrsPath = `M ${getX(0)} ${getY(100)} 
    C ${getX(0.5)} ${getY(60)}, ${getX(1)} ${getY(42)}, ${getX(2)} ${getY(26)}
    C ${getX(4)} ${getY(18)}, ${getX(8)} ${getY(14)}, ${getX(14)} ${getY(12)}`;

  // 2. Sawtooth SRS Path based on activeReps
  let srsPath = `M ${getX(0)} ${getY(100)} C ${getX(0.4)} ${getY(65)}, ${getX(0.8)} ${getY(48)}, ${getX(1)} ${getY(42)}`;
  
  if (activeReps >= 1) {
    srsPath += ` L ${getX(1)} ${getY(100)} C ${getX(1.8)} ${getY(85)}, ${getX(2.5)} ${getY(76)}, ${getX(3)} ${getY(72)}`;
  } else {
    srsPath += ` C ${getX(2)} ${getY(26)}, ${getX(6)} ${getY(16)}, ${getX(14)} ${getY(12)}`;
  }

  if (activeReps >= 2) {
    srsPath += ` L ${getX(3)} ${getY(100)} C ${getX(4)} ${getY(91)}, ${getX(5)} ${getY(86)}, ${getX(6)} ${getY(84)}`;
  } else if (activeReps === 1) {
    srsPath += ` C ${getX(5)} ${getY(50)}, ${getX(9)} ${getY(35)}, ${getX(14)} ${getY(28)}`;
  }

  if (activeReps >= 3) {
    srsPath += ` L ${getX(6)} ${getY(100)} C ${getX(7.5)} ${getY(95)}, ${getX(9)} ${getY(92)}, ${getX(10)} ${getY(90)}`;
  } else if (activeReps === 2) {
    srsPath += ` C ${getX(8)} ${getY(68)}, ${getX(11)} ${getY(55)}, ${getX(14)} ${getY(46)}`;
  }

  if (activeReps >= 4) {
    srsPath += ` L ${getX(10)} ${getY(100)} C ${getX(11.5)} ${getY(97)}, ${getX(13)} ${getY(95)}, ${getX(14)} ${getY(94)}`;
  } else if (activeReps === 3) {
    srsPath += ` C ${getX(11.5)} ${getY(82)}, ${getX(13)} ${getY(78)}, ${getX(14)} ${getY(75)}`;
  }

  // Master Envelope Curve (Logarithmic Retrievability Growth)
  const masterEnvelopePath = `M ${getX(0)} ${getY(10)} 
    C ${getX(1)} ${getY(42)}, ${getX(3)} ${getY(72)}, ${getX(6)} ${getY(84)}
    C ${getX(10)} ${getY(90)}, ${getX(14)} ${getY(94)}`;

  return (
    <div className="glass-panel p-6 md:p-8 animate-fade-in" style={{ borderRadius: '1.5rem', border: '1px solid rgba(139, 92, 246, 0.3)', background: 'rgba(12, 15, 28, 0.95)' }}>
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              🧠 Memory Science & Algorithmic SRS
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            The Ebbinghaus Forgetting Curve & Spaced Repetition
          </h3>
          <p className="text-sm text-secondary mt-1 max-w-2xl">
            Without review, human memory loses up to <strong>60% of new information within 24 hours</strong>. 
            Spaced Repetition (FSRS-4.5) calculates mathematically optimized review intervals to transform short-term memory into permanent long-term recall.
          </p>
        </div>

        {/* Interactive Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowNoSRS(prev => !prev)}
            style={{
              padding: '0.5rem 0.9rem',
              borderRadius: '0.65rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: showNoSRS ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.05)',
              color: showNoSRS ? '#f87171' : '#94a3b8',
              border: showNoSRS ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255,255,255,0.1)',
              transition: 'all 0.2s ease'
            }}
          >
            {showNoSRS ? 'Hide Baseline (No Review)' : 'Show Baseline Curve'}
          </button>
        </div>
      </div>

      {/* Interactive Step Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-4 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-xs font-semibold text-secondary flex items-center gap-1.5">
          <Zap size={14} className="text-yellow-400" /> Simulate Spaced Repetitions:
        </span>

        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3, 4].map((step) => (
            <button
              key={step}
              onClick={() => setActiveReps(step)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '0.55rem',
                fontSize: '0.775rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: activeReps === step 
                  ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' 
                  : 'rgba(255,255,255,0.06)',
                color: activeReps === step ? '#ffffff' : '#94a3b8',
                border: activeReps === step ? 'none' : '1px solid rgba(255,255,255,0.08)',
                boxShadow: activeReps === step ? '0 4px 12px rgba(139, 92, 246, 0.35)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {step === 0 ? 'No Reviews' : `${step} Review${step > 1 ? 's' : ''}`}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive SVG Graph */}
      <div style={{ width: '100%', overflowX: 'auto', position: 'relative' }}>
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          style={{ width: '100%', height: 'auto', minWidth: '600px', display: 'block' }}
        >
          <defs>
            {/* Glow Filter */}
            <filter id={`glow-${filterId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            
            {/* Linear Gradients */}
            <linearGradient id={`srsGradient-${filterId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="30%" stopColor="#84cc16" />
              <stop offset="60%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>

            <linearGradient id={`fillGradient-${filterId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(139, 92, 246, 0.25)" />
              <stop offset="100%" stopColor="rgba(139, 92, 246, 0.0)" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          {[0, 20, 40, 60, 80, 100].map((pct) => (
            <g key={pct}>
              <line 
                x1={paddingLeft} 
                y1={getY(pct)} 
                x2={width - paddingRight} 
                y2={getY(pct)} 
                stroke="rgba(255, 255, 255, 0.06)" 
                strokeDasharray="4 4" 
              />
              <text 
                x={paddingLeft - 12} 
                y={getY(pct) + 4} 
                fill="#64748b" 
                fontSize="11" 
                fontWeight="600" 
                textAnchor="end"
              >
                {pct}%
              </text>
            </g>
          ))}

          {/* Vertical Day Lines & Labels */}
          {reviewNodes.map((node) => (
            <g key={node.day}>
              <line 
                x1={getX(node.day)} 
                y1={paddingTop} 
                x2={getX(node.day)} 
                y2={height - paddingBottom} 
                stroke={node.color} 
                strokeOpacity="0.25" 
                strokeDasharray="3 3" 
              />
              <text 
                x={getX(node.day)} 
                y={height - paddingBottom + 20} 
                fill="#94a3b8" 
                fontSize="11" 
                fontWeight="700" 
                textAnchor="middle"
              >
                {node.label}
              </text>
            </g>
          ))}

          {/* X Axis Baseline */}
          <line 
            x1={paddingLeft} 
            y1={height - paddingBottom} 
            x2={width - paddingRight} 
            y2={height - paddingBottom} 
            stroke="#475569" 
            strokeWidth="2" 
          />
          <text 
            x={width - paddingRight} 
            y={height - paddingBottom + 35} 
            fill="#94a3b8" 
            fontSize="12" 
            fontWeight="700" 
            textAnchor="end"
          >
            Time (Days) →
          </text>

          {/* Y Axis Baseline */}
          <line 
            x1={paddingLeft} 
            y1={paddingTop} 
            x2={paddingLeft} 
            y2={height - paddingBottom} 
            stroke="#475569" 
            strokeWidth="2" 
          />
          <text 
            transform={`rotate(-90, ${paddingLeft - 40}, ${paddingTop + graphHeight / 2})`}
            x={paddingLeft - 40} 
            y={paddingTop + graphHeight / 2} 
            fill="#94a3b8" 
            fontSize="12" 
            fontWeight="700" 
            textAnchor="middle"
          >
            Recall Percentage (%)
          </text>

          {/* Baseline Forgetting Curve (Without SRS) */}
          {showNoSRS && (
            <g>
              <path 
                d={noSrsPath} 
                fill="none" 
                stroke="#f97316" 
                strokeWidth="2.5" 
                strokeDasharray="6 6" 
                strokeOpacity="0.75" 
              />
              <text 
                x={getX(14) - 10} 
                y={getY(12) + 18} 
                fill="#f97316" 
                fontSize="10" 
                fontWeight="700" 
                textAnchor="end"
              >
                Without SRS (~15% recall)
              </text>
            </g>
          )}

          {/* Master Retention Growth Envelope Curve (Solid Deep Blue Line) */}
          <path 
            d={masterEnvelopePath} 
            fill="none" 
            stroke="#3b82f6" 
            strokeWidth="3.5" 
            strokeOpacity="0.8" 
            filter={`url(#glow-${filterId})`} 
          />

          {/* Dynamic SRS Sawtooth Path */}
          <path 
            d={srsPath} 
            fill="none" 
            stroke={`url(#srsGradient-${filterId})`} 
            strokeWidth="3.5" 
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#glow-${filterId})`}
          />

          {/* Interactive Speech Bubbles ("Repeat!") above Review Days */}
          {reviewNodes.map((node, idx) => {
            const isCompleted = activeReps >= idx + 1;
            const nodeX = getX(node.day);
            const nodeY = getY(100);

            return (
              <g 
                key={node.day} 
                onClick={() => setActiveReps(idx + 1)}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setSelectedPoint(node)}
                onMouseLeave={() => setSelectedPoint(null)}
              >
                {/* Dotted indicator line up to 100% */}
                <line 
                  x1={nodeX} 
                  y1={getY(node.recallBefore)} 
                  x2={nodeX} 
                  y2={nodeY} 
                  stroke={node.color} 
                  strokeWidth="2" 
                  strokeDasharray="2 2" 
                  strokeOpacity={isCompleted ? 1 : 0.4} 
                />

                {/* Point at recall before review */}
                <circle 
                  cx={nodeX} 
                  cy={getY(node.recallBefore)} 
                  r="5" 
                  fill={node.color} 
                  stroke="#090a0f" 
                  strokeWidth="2" 
                />

                {/* Speech Bubble / Callout Badge */}
                <g transform={`translate(${nodeX}, ${nodeY - 34})`}>
                  <rect 
                    x="-32" 
                    y="-12" 
                    width="64" 
                    height="24" 
                    rx="12" 
                    fill={isCompleted ? node.color : 'rgba(30, 41, 59, 0.9)'} 
                    stroke={node.color} 
                    strokeWidth="1.5" 
                    filter={isCompleted ? `url(#glow-${filterId})` : 'none'}
                  />
                  <text 
                    x="0" 
                    y="3" 
                    fill={isCompleted ? '#ffffff' : '#94a3b8'} 
                    fontSize="10" 
                    fontWeight="800" 
                    textAnchor="middle"
                  >
                    {isCompleted ? 'Repeat! 🔄' : `Day ${node.day}`}
                  </text>
                  {/* Speech Bubble Pin Pointer */}
                  <polygon 
                    points="0,12 -5,17 5,17" 
                    fill={isCompleted ? node.color : 'rgba(30, 41, 59, 0.9)'} 
                    transform="rotate(180 0 14.5)" 
                  />
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Key Takeaways & Interactive Explanation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
          <div className="flex items-center gap-2 mb-2" style={{ color: '#f87171' }}>
            <Flame size={18} />
            <h4 className="font-bold text-sm">1. The Forgetting Curve</h4>
          </div>
          <p className="text-xs text-secondary leading-relaxed">
            Without intentional review, neural pathways weaken rapidly. Within 3 days, over <strong>75%</strong> of newly acquired concepts are forgotten.
          </p>
        </div>

        <div className="p-4 rounded-xl" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
          <div className="flex items-center gap-2 mb-2" style={{ color: '#a78bfa' }}>
            <Brain size={18} />
            <h4 className="font-bold text-sm">2. Spaced Repetition Spikes</h4>
          </div>
          <p className="text-xs text-secondary leading-relaxed">
            Reviewing a card right when recall drops resets retrievability back to <strong>100%</strong> while dramatically flattening future memory decay rate ($S$).
          </p>
        </div>

        <div className="p-4 rounded-xl" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
          <div className="flex items-center gap-2 mb-2" style={{ color: '#34d399' }}>
            <CheckCircle2 size={18} />
            <h4 className="font-bold text-sm">3. Permanent Long-term Recall</h4>
          </div>
          <p className="text-xs text-secondary leading-relaxed">
            By the 4th repetition step, review intervals expand exponentially (e.g. 1d → 3d → 6d → 10d+), fixing knowledge into permanent long-term memory.
          </p>
        </div>
      </div>
    </div>
  );
}
