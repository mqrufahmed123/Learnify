import { useState, useEffect } from 'react';
import { Flame, Calendar, Award, Zap, TrendingUp, CheckCircle2 } from 'lucide-react';

export default function StudyStreakHeatmap({ streak = 0, activity = [], lastStudyDate }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const isStudiedToday = lastStudyDate === todayStr;

  // Build last 35 days grid array
  const daysGrid = [];
  const today = new Date();

  // Create map of date -> count
  const activityMap = {};
  if (Array.isArray(activity)) {
    activity.forEach(item => {
      activityMap[item.date] = item.count;
    });
  }

  for (let i = 34; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const count = activityMap[dateStr] || 0;
    
    daysGrid.push({
      dateStr,
      dayNumber: d.getDate(),
      monthName: d.toLocaleDateString('en-US', { month: 'short' }),
      weekdayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      count,
      isToday: dateStr === todayStr
    });
  }

  const todayCount = activityMap[todayStr] || 0;
  const activeDaysCount = Object.keys(activityMap).filter(k => activityMap[k] > 0).length;

  return (
    <div className="glass-panel p-6 mb-8 animate-fade-in" style={{ border: '1px solid rgba(139, 92, 246, 0.35)', background: 'rgba(15, 20, 35, 0.85)' }}>
      {/* Header & Streak Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div className="flex items-center gap-3.5">
          <div 
            style={{ 
              padding: '0.75rem', 
              background: streak > 0 ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(239, 68, 68, 0.25) 100%)' : 'rgba(255,255,255,0.06)', 
              borderRadius: '1rem', 
              border: streak > 0 ? '1px solid rgba(249, 115, 22, 0.5)' : '1px solid rgba(255,255,255,0.1)',
              boxShadow: streak > 0 ? '0 0 20px rgba(249, 115, 22, 0.35)' : 'none'
            }}
          >
            <Flame size={28} style={{ color: streak > 0 ? '#f97316' : '#94a3b8' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white">Daily Study Streak</h3>
              <span 
                style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 700, 
                  padding: '0.15rem 0.6rem', 
                  borderRadius: '9999px',
                  background: isStudiedToday ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: isStudiedToday ? '#34d399' : '#fbbf24',
                  border: isStudiedToday ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)'
                }}
              >
                {isStudiedToday ? 'Active Today ✅' : 'Review Due Today ⏳'}
              </span>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Review your flashcards daily to build long-term memory retention
            </p>
          </div>
        </div>

        {/* Highlight Metrics */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-secondary block font-medium">Current Streak</span>
            <span className="text-2xl font-extrabold text-white flex items-center justify-end gap-1">
              <Flame size={20} className="text-orange-500" />
              {streak} {streak === 1 ? 'Day' : 'Days'}
            </span>
          </div>

          <div style={{ height: '32px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />

          <div className="text-right">
            <span className="text-xs text-secondary block font-medium">Today's Reviews</span>
            <span className="text-2xl font-extrabold text-blue-400">
              {todayCount}
            </span>
          </div>
        </div>
      </div>

      {/* GitHub-style Heatmap Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 text-xs text-secondary">
          <span className="font-semibold flex items-center gap-1.5 text-white">
            <Calendar size={14} className="text-purple-400" /> Last 35 Days Activity
          </span>
          <div className="flex items-center gap-1.5 text-xs">
            <span>Less</span>
            <div style={{ width: '11px', height: '11px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ width: '11px', height: '11px', borderRadius: '3px', background: 'rgba(139, 92, 246, 0.35)' }} />
            <div style={{ width: '11px', height: '11px', borderRadius: '3px', background: 'rgba(139, 92, 246, 0.7)' }} />
            <div style={{ width: '11px', height: '11px', borderRadius: '3px', background: '#8b5cf6', boxShadow: '0 0 6px rgba(139, 92, 246, 0.8)' }} />
            <span>More</span>
          </div>
        </div>

        {/* Grid Blocks */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: '0.45rem',
            padding: '0.85rem',
            background: 'rgba(0, 0, 0, 0.25)',
            borderRadius: '0.85rem',
            border: '1px solid rgba(255,255,255,0.05)'
          }}
        >
          {daysGrid.map((day, idx) => {
            let bg = 'rgba(255,255,255,0.06)';
            let borderColor = 'rgba(255,255,255,0.05)';
            let glow = 'none';

            if (day.count >= 9) {
              bg = '#8b5cf6';
              borderColor = '#a78bfa';
              glow = '0 0 10px rgba(139, 92, 246, 0.75)';
            } else if (day.count >= 4) {
              bg = 'rgba(139, 92, 246, 0.65)';
              borderColor = 'rgba(139, 92, 246, 0.8)';
            } else if (day.count >= 1) {
              bg = 'rgba(139, 92, 246, 0.35)';
              borderColor = 'rgba(139, 92, 246, 0.45)';
            }

            return (
              <div
                key={idx}
                title={`${day.weekdayName}, ${day.monthName} ${day.dayNumber}: ${day.count} flashcard review${day.count === 1 ? '' : 's'}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '46px',
                  borderRadius: '0.55rem',
                  background: bg,
                  border: day.isToday ? '2px solid #60a5fa' : `1px solid ${borderColor}`,
                  boxShadow: day.isToday ? '0 0 12px rgba(96, 165, 250, 0.5)' : glow,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                <span style={{ fontSize: '0.65rem', fontWeight: 600, opacity: 0.8, color: day.count > 0 ? '#ffffff' : '#94a3b8' }}>
                  {day.monthName} {day.dayNumber}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: day.count > 0 ? '#ffffff' : '#64748b' }}>
                  {day.count > 0 ? `${day.count}x` : '-'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
