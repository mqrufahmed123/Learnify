import { Layers, Sparkles, UserCheck, Calculator, FolderKanban } from 'lucide-react';

export default function CardCalculator({ stats, selectedDeckId, onSelectDeck }) {
  if (!stats) return null;

  const {
    totalCards = 0,
    totalDecks = 0,
    aiCardsCount = 0,
    manualCardsCount = 0,
    uncategorizedCards = 0,
    deckBreakdown = []
  } = stats;

  const aiPercentage = totalCards > 0 ? Math.round((aiCardsCount / totalCards) * 100) : 0;

  return (
    <div className="glass-panel mb-8 p-6 animate-fade-in" style={{ border: '1px solid rgba(59, 130, 246, 0.2)' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '0.5rem', color: 'var(--accent-primary)' }}>
            <Calculator size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Card & Deck Calculator</h3>
            <p className="text-xs text-secondary">Real-time card distribution & deck metrics</p>
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between text-xs text-secondary mb-1">
            <span>Total Cards</span>
            <Layers size={14} className="text-blue" />
          </div>
          <p className="text-2xl font-bold text-primary">{totalCards}</p>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between text-xs text-secondary mb-1">
            <span>Total Decks</span>
            <FolderKanban size={14} style={{ color: 'var(--accent-secondary)' }} />
          </div>
          <p className="text-2xl font-bold text-primary">{totalDecks}</p>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between text-xs text-secondary mb-1">
            <span>AI Generated</span>
            <Sparkles size={14} className="text-purple" />
          </div>
          <p className="text-2xl font-bold text-primary">{aiCardsCount} <span className="text-xs text-secondary font-normal">({aiPercentage}%)</span></p>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between text-xs text-secondary mb-1">
            <span>Manual Cards</span>
            <UserCheck size={14} style={{ color: 'var(--success)' }} />
          </div>
          <p className="text-2xl font-bold text-primary">{manualCardsCount}</p>
        </div>
      </div>

      {/* Deck Selector Tabs / Calculator Pills */}
      <div>
        <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3">Decks & Topics Calculator</h4>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {/* All Cards Option */}
          <button
            onClick={() => onSelectDeck('all')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.55rem 1.1rem',
              borderRadius: '0.85rem',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              background: selectedDeckId === 'all' 
                ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                : 'rgba(255, 255, 255, 0.05)',
              color: selectedDeckId === 'all' ? '#ffffff' : 'var(--text-secondary)',
              border: '1px solid',
              borderColor: selectedDeckId === 'all' ? '#60a5fa' : 'rgba(255, 255, 255, 0.1)',
              boxShadow: selectedDeckId === 'all' ? '0 4px 14px rgba(59, 130, 246, 0.35)' : 'none'
            }}
          >
            <span>All Flashcards</span>
            <span 
              style={{ 
                background: selectedDeckId === 'all' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)', 
                color: '#ffffff',
                fontSize: '0.725rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                marginLeft: '0.25rem'
              }}
            >
              {totalCards}
            </span>
          </button>

          {/* Uncategorized Deck Option if any exist */}
          {uncategorizedCards > 0 && (
            <button
              onClick={() => onSelectDeck('uncategorized')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.55rem 1.1rem',
                borderRadius: '0.85rem',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                background: selectedDeckId === 'uncategorized' 
                  ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                  : 'rgba(255, 255, 255, 0.05)',
                color: selectedDeckId === 'uncategorized' ? '#ffffff' : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: selectedDeckId === 'uncategorized' ? '#60a5fa' : 'rgba(255, 255, 255, 0.1)',
                boxShadow: selectedDeckId === 'uncategorized' ? '0 4px 14px rgba(59, 130, 246, 0.35)' : 'none'
              }}
            >
              <span>General / Uncategorized</span>
              <span 
                style={{ 
                  background: selectedDeckId === 'uncategorized' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)', 
                  color: '#ffffff',
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  marginLeft: '0.25rem'
                }}
              >
                {uncategorizedCards}
              </span>
            </button>
          )}

          {/* Specific Decks */}
          {deckBreakdown.map((deck) => {
            const isSelected = selectedDeckId === deck.deckId;
            return (
              <button
                key={deck.deckId}
                onClick={() => onSelectDeck(deck.deckId)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.55rem 1.1rem',
                  borderRadius: '0.85rem',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  background: isSelected 
                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                    : 'rgba(0, 0, 0, 0.3)',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  border: '1px solid',
                  borderColor: isSelected ? '#60a5fa' : 'rgba(255, 255, 255, 0.1)',
                  boxShadow: isSelected ? '0 4px 14px rgba(59, 130, 246, 0.35)' : 'none'
                }}
              >
                <span>{deck.name}</span>
                {deck.topic && (
                  <span style={{ fontSize: '0.725rem', color: isSelected ? 'rgba(255,255,255,0.85)' : 'var(--accent-secondary)' }}>
                    • {deck.topic}
                  </span>
                )}
                <span 
                  style={{ 
                    background: isSelected ? 'rgba(255, 255, 255, 0.25)' : 'rgba(59, 130, 246, 0.2)', 
                    color: isSelected ? '#ffffff' : '#60a5fa',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px',
                    marginLeft: '0.25rem'
                  }}
                >
                  {deck.totalCards} cards
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
