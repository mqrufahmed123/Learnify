import { useState } from 'react';
import { Flame, Calendar, Trophy, Zap, TrendingUp } from 'lucide-react';

// ── Streak Milestone Tiers ──────────────────────────────────────────────────
const STREAK_TIERS = [
  { min: 60, label: 'Legendary', emoji: '👑', color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' },
  { min: 30, label: 'Diamond',   emoji: '💎', color: '#60a5fa', glow: 'rgba(96, 165, 250, 0.4)' },
  { min: 14, label: 'Electric',  emoji: '⚡', color: '#a78bfa', glow: 'rgba(167, 139, 250, 0.4)' },
  { min: 7,  label: 'On Fire',   emoji: '🔥', color: '#f97316', glow: 'rgba(249, 115, 22, 0.4)' },
  { min: 1,  label: 'Seedling',  emoji: '🌱', color: '#34d399', glow: 'rgba(52, 211, 153, 0.3)' },
];

function getTier(streak) {
  if (streak <= 0) return null;
  return STREAK_TIERS.find(t => streak >= t.min) || STREAK_TIERS[STREAK_TIERS.length - 1];
}

// ── Cell intensity levels (0–4) ─────────────────────────────────────────────
function getIntensity(count) {
  if (count >= 20) return 4;
  if (count >= 9)  return 3;
  if (count >= 4)  return 2;
  if (count >= 1)  return 1;
  return 0;
}

const INTENSITY_STYLES = [
  { bg: '#161b22', border: 'rgba(255, 255, 255, 0.03)', glow: 'none' },
  { bg: '#0e4429', border: 'rgba(0, 0, 0, 0.15)',      glow: 'none' },
  { bg: '#006d32', border: 'rgba(0, 0, 0, 0.15)',      glow: 'none' },
  { bg: '#26a641', border: 'rgba(0, 0, 0, 0.15)',      glow: 'none' },
  { bg: '#39d353', border: 'rgba(0, 0, 0, 0.15)',      glow: 'none' },
];

// ── Tooltip Component ────────────────────────────────────────────────────────
function Tooltip({ day }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: 'calc(100% + 8px)',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(15, 20, 35, 0.97)',
      border: '1px solid #30363d',
      borderRadius: '0.55rem',
      padding: '0.45rem 0.7rem',
      whiteSpace: 'nowrap',
      zIndex: 50,
      pointerEvents: 'none',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
        {day.weekdayName}, {day.monthName} {day.dayNumber}
      </p>
      <p style={{ fontSize: '0.7rem', color: day.count > 0 ? '#39d353' : '#7d8590', margin: '2px 0 0', fontWeight: 600 }}>
        {day.count > 0 ? `${day.count} review${day.count !== 1 ? 's' : ''}` : 'No activity'}
      </p>
      {/* Tooltip arrow */}
      <div style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft: '5px solid transparent',
        borderRight: '5px solid transparent',
        borderTop: '5px solid #30363d',
      }} />
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function StudyStreakHeatmap({ streak = 0, longestStreak = 0, activity = [], lastStudyDate }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const today = new Date();
  const yy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yy}-${mm}-${dd}`;
  const isStudiedToday = lastStudyDate === todayStr;
  const tier = getTier(streak);

  // Build activity map
  const activityMap = {};
  if (Array.isArray(activity)) {
    activity.forEach(item => { activityMap[item.date] = item.count; });
  }

  // ── Build 26-week (182-day) GitHub-style week-column grid ──────────────────
  // Align so the rightmost column always ends on today's weekday
  const DAYS = 182;
  const todayDow = today.getDay(); // 0=Sun … 6=Sat  (today is declared above)

  // total cells = DAYS, padded on the left so col 0 starts on a Sunday
  const startPadding = todayDow; // cells before the 182-day window to complete the first row
  const totalCells = DAYS + startPadding;

  const allCells = [];
  for (let i = totalCells - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const ddStr = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yy}-${mm}-${ddStr}`;
    // A cell is a real day when it falls inside the 182-day window.
    // i counts backward from totalCells-1 (oldest padding) to 0 (today).
    // The first `startPadding` iterations (i >= DAYS) are left-padding cells.
    const isPast = i < DAYS;
    allCells.push({
      dateStr: isPast ? dateStr : null,
      dayNumber: d.getDate(),
      monthName: d.toLocaleDateString('en-US', { month: 'short' }),
      weekdayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      count: isPast ? (activityMap[dateStr] || 0) : -1,
      isToday: isPast && dateStr === todayStr,
      isPast,
    });
  }

  // How many columns = Math.ceil(totalCells / 7)
  const numCols = Math.ceil(totalCells / 7);

  // Month labels: detect when a new month starts in the first row of a column, avoiding overlap (min 3 weeks gap)
  const monthLabels = [];
  let lastPrintedCol = -10;
  for (let col = 0; col < numCols; col++) {
    const firstCellIdx = col * 7;
    const cell = allCells[firstCellIdx];
    if (cell && cell.isPast) {
      const prevCell = col > 0 ? allCells[(col - 1) * 7] : null;
      const isNewMonth = !prevCell || !prevCell.isPast || new Date(prevCell.dateStr).getMonth() !== new Date(cell.dateStr).getMonth();
      if (isNewMonth && (col - lastPrintedCol >= 3)) {
        monthLabels.push(cell.monthName);
        lastPrintedCol = col;
      } else {
        monthLabels.push('');
      }
    } else {
      monthLabels.push('');
    }
  }

  // Stats
  const todayCount = activityMap[todayStr] || 0;
  const activeDaysCount = Object.values(activityMap).filter(c => c > 0).length;

  // Flame color from tier or default
  const flameColor = tier ? tier.color : '#94a3b8';

  return (
    <div
      className="glass-panel p-6 mb-8 animate-fade-in"
      style={{ border: '1px solid #30363d', background: 'rgba(15, 20, 35, 0.85)' }}
    >
      {/* ── Header ── */}
      <div
        className="flex flex-col md:flex-row md:items-start justify-between gap-5 mb-6 pb-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Left: Icon + Title + Badge */}
        <div className="flex items-center gap-4">
          <div style={{
            padding: '0.8rem',
            background: streak > 0
              ? `linear-gradient(135deg, rgba(249,115,22,0.25) 0%, rgba(239,68,68,0.2) 100%)`
              : 'rgba(255,255,255,0.06)',
            borderRadius: '1rem',
            border: streak > 0 ? '1px solid rgba(249,115,22,0.5)' : '1px solid rgba(255,255,255,0.1)',
            boxShadow: streak > 0 ? `0 0 20px rgba(249,115,22,0.35)` : 'none',
            animation: streak > 0 ? 'flamePulse 2s ease-in-out infinite' : 'none',
          }}>
            <Flame size={28} style={{ color: flameColor }} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-white">Daily Study Streak</h3>
              {/* Active Today / Due badge */}
              <span style={{
                fontSize: '0.72rem', fontWeight: 700,
                padding: '0.15rem 0.65rem', borderRadius: '9999px',
                background: isStudiedToday ? 'rgba(16,185,129,0.18)' : 'rgba(245,158,11,0.18)',
                color: isStudiedToday ? '#34d399' : '#fbbf24',
                border: isStudiedToday ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(245,158,11,0.4)',
              }}>
                {isStudiedToday ? 'Active Today ✅' : 'Review Due ⏳'}
              </span>
              {/* Tier badge */}
              {tier && (
                <span style={{
                  fontSize: '0.72rem', fontWeight: 700,
                  padding: '0.15rem 0.65rem', borderRadius: '9999px',
                  background: `rgba(${tier.color.slice(1).match(/../g).map(h=>parseInt(h,16)).join(',')}, 0.15)`,
                  color: tier.color,
                  border: `1px solid ${tier.glow.replace('rgba','rgba').replace(', 0.', ', 0.5,')}`,
                }}>
                  {tier.emoji} {tier.label}
                </span>
              )}
            </div>
            <p className="text-xs text-secondary mt-1">
              Review your flashcards daily to build long-term memory retention
            </p>
          </div>
        </div>

        {/* Right: 4 Premium Stat Cards */}
        <div className="flex items-center gap-3.5 flex-wrap">
          <StatCard label="Current Streak" value={`${streak} ${streak === 1 ? 'Day' : 'Days'}`} icon={<Flame size={18} />} color="#f97316" glowColor="249, 115, 22" />
          <StatCard label="Longest Streak" value={`${longestStreak} ${longestStreak === 1 ? 'Day' : 'Days'}`} icon={<Trophy size={18} />} color="#f59e0b" glowColor="245, 158, 11" />
          <StatCard label="Active Days" value={`${activeDaysCount} ${activeDaysCount === 1 ? 'Day' : 'Days'}`} icon={<TrendingUp size={18} />} color="#34d399" glowColor="52, 211, 153" />
          <StatCard label="Today's Reviews" value={todayCount} icon={<Zap size={18} />} color="#60a5fa" glowColor="96, 165, 250" />
        </div>
      </div>

      {/* ── Heatmap ── */}
      <div>
        {/* Title + Legend */}
        <div className="flex items-center justify-between mb-4 text-xs text-secondary">
          <span className="font-semibold flex items-center gap-1.5 text-white">
            <Calendar size={14} className="text-emerald-400" style={{ color: '#39d353' }} /> Last 6 Months (26 Weeks)
          </span>
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: '0.7rem', color: '#7d8590' }}>Less</span>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} style={{
                width: '12px', height: '12px', borderRadius: '2px',
                background: INTENSITY_STYLES[i].bg,
                border: `1px solid ${INTENSITY_STYLES[i].border}`,
              }} />
            ))}
            <span style={{ fontSize: '0.7rem', color: '#7d8590' }}>More</span>
          </div>
        </div>

        {/* Heatmap body container (centered, wraps tightly) */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          background: 'rgba(0, 0, 0, 0.2)',
          padding: '1.25rem',
          borderRadius: '1.25rem',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          boxShadow: 'inset 0 4px 20px rgba(0, 0, 0, 0.3)',
          width: 'max-content',
          maxWidth: '100%',
          margin: '0 auto',
        }}>

          {/* Weekday labels (S M T W T F S) — vertical */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '22px', flexShrink: 0 }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <span key={i} style={{
                fontSize: '0.625rem', color: '#7d8590',
                width: '18px', height: '18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700,
              }}>{d}</span>
            ))}
          </div>

          {/* Right: scrollable month labels + grid */}
          <div style={{ overflowX: 'auto', flex: 1, paddingBottom: '4px' }}>
            {/* Month labels */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${numCols}, 18px)`,
              gap: '4px',
              marginBottom: '6px',
              width: 'max-content',
            }}>
              {monthLabels.map((label, ci) => (
                <span key={ci} style={{
                  width: '18px',
                  fontSize: '0.65rem', color: label ? '#7d8590' : 'transparent',
                  fontWeight: 700, textAlign: 'left', userSelect: 'none',
                  letterSpacing: '0.03em',
                  whiteSpace: 'nowrap',
                }}>
                  {label || '.'}
                </span>
              ))}
            </div>

            {/* Grid — column-major */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${numCols}, 18px)`,
              gridTemplateRows: 'repeat(7, 18px)',
              gridAutoFlow: 'column',
              gap: '4px',
              width: 'max-content',
            }}>
              {allCells.map((day, idx) => {
                if (!day.isPast) {
                  return <div key={idx} style={{ width: '18px', height: '18px', borderRadius: '2px', background: 'transparent' }} />;
                }

                const intensity = getIntensity(day.count);
                const s = INTENSITY_STYLES[intensity];
                const isHovered = hoveredIdx === idx;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    style={{
                      position: 'relative',
                      width: '18px',
                      height: '18px',
                      borderRadius: '2px',
                      background: s.bg,
                      border: day.isToday
                        ? '1.5px solid #58a6ff'
                        : (isHovered ? '1px solid rgba(255, 255, 255, 0.85)' : `1px solid ${s.border}`),
                      boxShadow: day.isToday
                        ? '0 0 8px rgba(88, 166, 255, 0.4)'
                        : 'none',
                      transform: isHovered ? 'scale(1.15) translateY(-0.5px)' : 'scale(1)',
                      transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      zIndex: isHovered ? 10 : 1,
                    }}
                  >
                    {isHovered && <Tooltip day={day} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic keyframes & classes (injected inline) */}
      <style>{`
        @keyframes flamePulse {
          0%, 100% { box-shadow: 0 0 20px rgba(249,115,22,0.35); }
          50% { box-shadow: 0 0 35px rgba(249,115,22,0.65); }
        }
        .hover-card-glow {
          position: relative;
        }
        .hover-card-glow:hover {
          background: rgba(255, 255, 255, 0.05) !important;
          border-color: rgba(255, 255, 255, 0.12) !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35) !important;
        }
      `}</style>
    </div>
  );
}

// ── Helper sub-components ────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, glowColor }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '0.75rem',
      padding: '0.65rem 1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      minWidth: '135px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }}
    className="hover-card-glow"
    >
      <div style={{
        padding: '0.5rem',
        background: `rgba(${glowColor}, 0.12)`,
        borderRadius: '0.5rem',
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 0 10px rgba(${glowColor}, 0.12)`
      }}>
        {icon}
      </div>
      <div>
        <span style={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', lineHeight: '1.2' }}>{value}</span>
      </div>
    </div>
  );
}
