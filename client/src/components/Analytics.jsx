import { useState, useEffect } from 'react';
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { BarChart2, Brain, Zap, Trophy, AlertTriangle, Loader2, BookOpen, RefreshCw } from 'lucide-react';
import api from '../api';

// ── Small stat card ──────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={{
      flex: 1, minWidth: '130px',
      padding: '1.1rem 1.2rem',
      borderRadius: '1rem',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', flexDirection: 'column', gap: '0.4rem',
      transition: 'all 0.2s ease',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ color, opacity: 0.85, display: 'flex' }}>{icon}</span>
        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#7d8590', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      </div>
      <span style={{ fontSize: '1.75rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
      {sub && <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{sub}</span>}
    </div>
  );
}

// ── Custom Recharts Tooltip ───────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, suffix = '%', labelKey }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(15, 20, 35, 0.97)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '0.6rem', padding: '0.6rem 0.9rem',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.3rem' }}>
        {labelKey ? payload[0]?.payload?.[labelKey] : label}
      </p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: '0.85rem', fontWeight: 700, color: p.color, margin: 0 }}>
          {p.name}: {p.value}{suffix}
        </p>
      ))}
    </div>
  );
}

// ── Card state colours ────────────────────────────────────────────────────────
const STATE_META = {
  new:        { label: 'New',        color: '#60a5fa', bg: 'rgba(96,165,250,0.15)'  },
  learning:   { label: 'Learning',   color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  review:     { label: 'Review',     color: '#39d353', bg: 'rgba(57,211,83,0.15)'  },
  relearning: { label: 'Relearning', color: '#ef4444', bg: 'rgba(239,68,68,0.15)'  },
};

// ── Main component ────────────────────────────────────────────────────────────
export default function Analytics({ subjectId }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: d } = await api.get(`/analytics/${subjectId}`);
      setData(d);
    } catch (err) {
      setError('Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, [subjectId]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '1rem' }}>
        <Loader2 size={36} style={{ color: '#60a5fa', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Crunching your learning data…</p>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '1rem' }}>
        <AlertTriangle size={36} style={{ color: '#f59e0b' }} />
        <p style={{ color: '#94a3b8' }}>{error}</p>
        <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={fetchAnalytics}>
          <RefreshCw size={15} /> Retry
        </button>
      </div>
    );
  }

  const {
    quizTrend, cardStates, forgettingCurve,
    avgStability, avgInterval, totalCards, masteredCards,
    quizCount, avgScore, bestScore,
  } = data;

  const totalStateCards = Object.values(cardStates).reduce((s, v) => s + v, 0);
  // The "next review" vertical marker on the forgetting curve
  const nextReviewDay = Math.min(avgInterval, 30);
  // Retention at the scheduled review point
  const retentionAtReview = forgettingCurve.find(p => p.day === nextReviewDay)?.retention ?? 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in" style={{ maxWidth: '960px', paddingBottom: '3rem' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
          <BarChart2 size={22} style={{ color: '#60a5fa' }} /> Learning Analytics
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
          Performance over time · Forgetting curve · Card mastery
        </p>
      </div>

      {/* ── Stat Cards Row ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
        <StatCard label="Total Cards"   value={totalCards}                   icon={<BookOpen size={15} />}  color="#60a5fa" />
        <StatCard label="Mastered"      value={masteredCards}                 icon={<Trophy size={15} />}    color="#39d353" sub={`${totalCards ? Math.round((masteredCards/totalCards)*100) : 0}% of deck`} />
        <StatCard label="Avg Quiz Score" value={`${avgScore}%`}              icon={<Zap size={15} />}       color={avgScore >= 70 ? '#39d353' : avgScore >= 40 ? '#f59e0b' : '#ef4444'} sub={`Best: ${bestScore}%`} />
        <StatCard label="Quizzes Taken"  value={quizCount}                   icon={<BarChart2 size={15} />}  color="#a78bfa" />
        <StatCard label="Memory Stability" value={`${avgStability}d`}        icon={<Brain size={15} />}     color="#f472b6" sub="Avg FSRS stability" />
      </div>

      {/* ── Quiz Score Trend ─────────────────────────────────────────────── */}
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '1.25rem', padding: '1.5rem', marginBottom: '1.5rem',
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.3rem' }}>
          📈 Quiz Score Trend
        </h3>
        <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1.25rem' }}>
          Your quiz performance over all {quizCount} attempt{quizCount !== 1 ? 's' : ''}
        </p>

        {quizTrend.length < 2 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 0', color: '#64748b' }}>
            <BarChart2 size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.85rem' }}>Take at least 2 quizzes to see your score trend.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={quizTrend} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <RechartsTooltip content={<ChartTooltip labelKey="label" />} />
              {/* 70% passing threshold */}
              <ReferenceLine y={70} stroke="#39d353" strokeDasharray="4 3" strokeOpacity={0.5}
                label={{ value: 'Pass 70%', position: 'right', fontSize: 10, fill: '#39d353', opacity: 0.7 }} />
              <Line
                type="monotone" dataKey="percentage" name="Score"
                stroke="#60a5fa" strokeWidth={2.5} dot={{ r: 4, fill: '#60a5fa', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#60a5fa', stroke: 'rgba(96,165,250,0.3)', strokeWidth: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Ebbinghaus Forgetting Curve ──────────────────────────────────── */}
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '1.25rem', padding: '1.5rem', marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.3rem' }}>
              🧠 Ebbinghaus Forgetting Curve
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '520px' }}>
              Estimated memory retention over time using your average FSRS stability of&nbsp;
              <strong style={{ color: '#f472b6' }}>{avgStability} days</strong>.
              Formula: <code style={{ color: '#a78bfa', fontSize: '0.7rem' }}>R(t) = e<sup>−t/S</sup></code>&nbsp;
              — the vertical line shows when SRS schedules your next review.
            </p>
          </div>
          {/* Mini stats */}
          <div style={{ display: 'flex', gap: '1rem', flexShrink: 0 }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f472b6' }}>{retentionAtReview}%</p>
              <p style={{ fontSize: '0.68rem', color: '#64748b' }}>retention at review</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#60a5fa' }}>Day {nextReviewDay}</p>
              <p style={{ fontSize: '0.68rem', color: '#64748b' }}>next SRS review</p>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={forgettingCurve} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
            <defs>
              <linearGradient id="retentionGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false}
              tickFormatter={v => v === 0 ? 'Now' : `Day ${v}`}
              ticks={[0, 5, 10, 15, 20, 25, 30]}
            />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
            <RechartsTooltip content={<ChartTooltip labelKey="day" suffix="%" />}
              formatter={(val, name, props) => [`${val}%`, 'Retention']}
              labelFormatter={l => l === 0 ? 'Right after review' : `Day ${l}`}
            />
            {/* 80% retention threshold */}
            <ReferenceLine y={80} stroke="#39d353" strokeDasharray="4 3" strokeOpacity={0.5}
              label={{ value: '80%', position: 'right', fontSize: 10, fill: '#39d353', opacity: 0.7 }} />
            {/* 50% retention threshold */}
            <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="4 3" strokeOpacity={0.5}
              label={{ value: '50%', position: 'right', fontSize: 10, fill: '#f59e0b', opacity: 0.7 }} />
            {/* Next scheduled review */}
            {nextReviewDay > 0 && nextReviewDay <= 30 && (
              <ReferenceLine x={nextReviewDay} stroke="#60a5fa" strokeWidth={1.5} strokeDasharray="5 3" strokeOpacity={0.8}
                label={{ value: 'Review', position: 'top', fontSize: 10, fill: '#60a5fa' }} />
            )}
            <Area type="monotone" dataKey="retention" name="Retention"
              stroke="#a78bfa" strokeWidth={2.5} fill="url(#retentionGrad)"
              dot={false} activeDot={{ r: 5, fill: '#a78bfa', stroke: 'rgba(167,139,250,0.3)', strokeWidth: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Ebbinghaus explanation card */}
        <div style={{
          marginTop: '1rem', padding: '0.85rem 1rem',
          background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)',
          borderRadius: '0.75rem', fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.6,
        }}>
          <strong style={{ color: '#a78bfa' }}>📖 About this chart: </strong>
          Psychologist Hermann Ebbinghaus (1885) showed that memory decays exponentially without review.
          The FSRS spaced-repetition algorithm in this app uses your <em>stability S</em> — a per-card
          measure of how long a memory lasts — to schedule reviews at the optimal moment before
          significant forgetting occurs, maximising long-term retention with minimum effort.
        </div>
      </div>

      {/* ── Card State Distribution ──────────────────────────────────────── */}
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '1.25rem', padding: '1.5rem',
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.3rem' }}>
          🃏 Card Mastery Breakdown
        </h3>
        <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1.25rem' }}>
          Distribution of your {totalCards} card{totalCards !== 1 ? 's' : ''} across SRS states
        </p>

        {totalStateCards === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem 0' }}>
            No flashcards yet. Create some to see your mastery breakdown.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Stacked progress bar */}
            <div style={{ display: 'flex', borderRadius: '0.5rem', overflow: 'hidden', height: '14px', gap: '2px' }}>
              {Object.entries(cardStates).map(([state, count]) => {
                const pct = totalStateCards > 0 ? (count / totalStateCards) * 100 : 0;
                if (pct === 0) return null;
                return (
                  <div key={state} style={{ width: `${pct}%`, background: STATE_META[state].color, transition: 'width 0.5s ease' }} title={`${STATE_META[state].label}: ${count}`} />
                );
              })}
            </div>

            {/* Legend rows */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.25rem' }}>
              {Object.entries(cardStates).map(([state, count]) => {
                const { label, color, bg } = STATE_META[state];
                const pct = totalStateCards > 0 ? Math.round((count / totalStateCards) * 100) : 0;
                return (
                  <div key={state} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.4rem 0.8rem', borderRadius: '0.5rem',
                    background: bg, border: `1px solid ${color}30`,
                    flex: '1 1 140px',
                  }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', flex: 1 }}>{label}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color }}>{count}</span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
