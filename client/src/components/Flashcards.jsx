import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Layers, Wand2, Plus, Loader2, FolderPlus, Trash2, Tag, ArrowLeft, Folder, Sparkles, BookOpen, Brain, Clock, HelpCircle, X } from 'lucide-react';
import api from '../api';
import CardCalculator from './CardCalculator';
import GenerationProgressBar from './GenerationProgressBar';
import SRSStudyModal from './SRSStudyModal';
import SRSAboutGraph from './SRSAboutGraph';

export default function Flashcards({ subjectId }) {
  const [flashcards, setFlashcards] = useState([]);
  const [decks, setDecks] = useState([]);
  const [calculatorStats, setCalculatorStats] = useState(null);
  const [selectedDeckId, setSelectedDeckId] = useState('all'); // 'all', 'uncategorized', or deck ObjectId
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [flippedCards, setFlippedCards] = useState(new Set());

  // Modal controls
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showSRSModal, setShowSRSModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  // Form states
  const [newDeck, setNewDeck] = useState({ name: '', description: '', topic: '' });
  const [generateConfig, setGenerateConfig] = useState({ deckId: '', topic: '', count: 10 });
  const [manualCard, setManualCard] = useState({ question: '', answer: '', deckId: '', topic: '' });

  const fetchCalculatorStats = useCallback(async () => {
    try {
      const { data } = await api.get(`/decks/${subjectId}/calculator`);
      setCalculatorStats(data);
    } catch (err) {
      console.error('Failed to fetch calculator stats:', err);
    }
  }, [subjectId]);

  const fetchDecks = useCallback(async () => {
    try {
      const { data } = await api.get(`/decks/${subjectId}`);
      setDecks(data);
    } catch (err) {
      console.error('Failed to fetch decks:', err);
    }
  }, [subjectId]);

  const fetchFlashcards = useCallback(async () => {
    try {
      const url = selectedDeckId === 'all' 
        ? `/flashcards/${subjectId}`
        : `/flashcards/${subjectId}?deckId=${selectedDeckId}`;
      
      const { data } = await api.get(url);
      setFlashcards(data);
    } catch (err) {
      console.error('Failed to fetch flashcards:', err);
    } finally {
      setLoading(false);
    }
  }, [subjectId, selectedDeckId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchFlashcards(), fetchDecks(), fetchCalculatorStats()]);
  }, [fetchFlashcards, fetchDecks, fetchCalculatorStats]);

  const handleCreateDeck = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/decks/${subjectId}`, newDeck);
      setNewDeck({ name: '', description: '', topic: '' });
      setShowDeckModal(false);
      await Promise.all([fetchDecks(), fetchCalculatorStats()]);
    } catch (err) {
      console.error('Failed to create deck:', err);
      alert('Failed to create deck');
    }
  };

  const handleDeleteDeck = async (deckId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this deck? Cards will be unassigned.')) return;
    try {
      await api.delete(`/decks/${deckId}`);
      if (selectedDeckId === deckId) setSelectedDeckId('all');
      await Promise.all([fetchDecks(), fetchFlashcards(), fetchCalculatorStats()]);
    } catch (err) {
      console.error('Failed to delete deck:', err);
    }
  };

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    setGenerating(true);
    setShowGenerateModal(false);

    try {
      const payload = {
        count: Number(generateConfig.count) || 10,
        deckId: generateConfig.deckId || (selectedDeckId !== 'all' && selectedDeckId !== 'uncategorized' ? selectedDeckId : null),
        topic: generateConfig.topic
      };

      await api.post(`/flashcards/${subjectId}/generate`, payload);
      await Promise.all([fetchFlashcards(), fetchDecks(), fetchCalculatorStats()]);
    } catch (err) {
      console.error('Failed to generate flashcards:', err);
      alert('Failed to generate flashcards. Please ensure you have uploaded documents for this subject.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateManualCard = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...manualCard,
        deckId: manualCard.deckId || (selectedDeckId !== 'all' && selectedDeckId !== 'uncategorized' ? selectedDeckId : null)
      };

      await api.post(`/flashcards/${subjectId}`, payload);
      setManualCard({ question: '', answer: '', deckId: '', topic: '' });
      setShowManualModal(false);
      await Promise.all([fetchFlashcards(), fetchDecks(), fetchCalculatorStats()]);
    } catch (err) {
      console.error('Failed to create manual card:', err);
      alert('Failed to create flashcard');
    }
  };

  const toggleFlip = (id) => {
    setFlippedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Active deck details (if a specific deck is selected)
  const activeDeck = decks.find(d => d._id === selectedDeckId);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-fade-in text-blue" size={32} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in mx-auto" style={{ maxWidth: '1100px', paddingBottom: '3rem' }}>
      {/* Progress Bar Overlay */}
      <GenerationProgressBar 
        isOpen={generating}
        title="Generating Flashcards with AI"
        subtitle={generateConfig.topic ? `Focusing on topic: "${generateConfig.topic}"` : 'Parsing notes and structuring Q&A pairs...'}
        stages={[
          'Reading subject documents & lecture notes',
          generateConfig.topic ? `Filtering context for topic "${generateConfig.topic}"` : 'Extracting core definitions & key concepts',
          'Synthesizing flashcards with Gemini AI',
          'Formatting deck structure & saving'
        ]}
      />

      {/* Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {selectedDeckId !== 'all' && (
              <button 
                onClick={() => setSelectedDeckId('all')} 
                className="flex items-center gap-1 text-xs text-blue font-semibold hover:underline mr-2"
              >
                <ArrowLeft size={14} /> Back to All Decks
              </button>
            )}
            <h2 className="text-2xl font-bold">
              {selectedDeckId === 'all' ? 'Flashcard Decks & Study Cards' : activeDeck ? activeDeck.name : 'Uncategorized Deck'}
            </h2>
          </div>
          <p className="text-secondary text-sm">
            {selectedDeckId === 'all' 
              ? 'Select a deck or generate topic-based flashcards to study.' 
              : activeDeck?.description || 'Reviewing cards for this specific deck.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3.5">
          <button 
            className="btn btn-secondary"
            onClick={() => setShowAboutModal(true)}
            style={{
              width: 'auto',
              height: '42px',
              padding: '0.75rem 1.15rem',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
              borderColor: 'rgba(139, 92, 246, 0.4)',
              color: '#a78bfa',
              background: 'rgba(139, 92, 246, 0.1)'
            }}
          >
            <HelpCircle size={16} /> How SRS Works
          </button>

          <button 
            onClick={() => setShowSRSModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              height: '42px',
              padding: '0.75rem 1.25rem',
              borderRadius: '0.75rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              color: '#ffffff',
              border: 'none',
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.45)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <Brain size={17} /> 
            <span>SRS Study Session</span>
            <span style={{ background: 'rgba(255,255,255,0.25)', padding: '0.15rem 0.55rem', borderRadius: '9999px', fontSize: '0.75rem', marginLeft: '0.15rem' }}>
              {calculatorStats?.dueCardsCount || 0} Due
            </span>
          </button>

          <button 
            className="btn btn-secondary"
            onClick={() => setShowDeckModal(true)}
            style={{ width: 'auto', height: '42px', padding: '0.75rem 1.15rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
          >
            <FolderPlus size={16} /> New Deck
          </button>

          <button 
            className="btn btn-secondary"
            onClick={() => {
              setManualCard(prev => ({
                ...prev,
                deckId: selectedDeckId !== 'all' && selectedDeckId !== 'uncategorized' ? selectedDeckId : ''
              }));
              setShowManualModal(true);
            }}
            style={{ width: 'auto', height: '42px', padding: '0.75rem 1.15rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
          >
            <Plus size={16} /> New Card
          </button>

          <button 
            className="btn btn-primary"
            onClick={() => {
              setGenerateConfig(prev => ({
                ...prev,
                deckId: selectedDeckId !== 'all' && selectedDeckId !== 'uncategorized' ? selectedDeckId : '',
                topic: activeDeck?.topic || ''
              }));
              setShowGenerateModal(true);
            }}
            disabled={generating}
            style={{ width: 'auto', height: '42px', padding: '0.75rem 1.25rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
          >
            <Wand2 size={16} /> Topic AI Generate
          </button>
        </div>
      </div>

      {/* Card Calculator Dashboard Widget */}
      <CardCalculator 
        stats={calculatorStats} 
        selectedDeckId={selectedDeckId} 
        onSelectDeck={(deckId) => setSelectedDeckId(deckId)} 
        onOpenAboutModal={() => setShowAboutModal(true)}
      />

      {/* Decks Folder Grid View (Shown when viewing 'all' decks) */}
      {selectedDeckId === 'all' && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider">Available Decks ({decks.length})</h3>
            <button 
              onClick={() => setShowDeckModal(true)}
              style={{
                background: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: '#60a5fa',
                padding: '0.35rem 0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.2s ease'
              }}
            >
              <FolderPlus size={13} /> + Add New Deck
            </button>
          </div>

          {decks.length === 0 ? (
            <div className="glass-panel p-6 text-center" style={{ border: '1px dashed var(--border-hover)' }}>
              <p className="text-secondary text-sm mb-3">No decks created yet. Create a deck to organize your flashcards by chapter or topic.</p>
              <button 
                onClick={() => setShowDeckModal(true)} 
                className="btn btn-secondary"
                style={{ width: 'auto', margin: '0 auto', fontSize: '0.8rem' }}
              >
                <FolderPlus size={14} /> Create First Deck
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {decks.map((deck) => (
                <div 
                  key={deck._id}
                  onClick={() => setSelectedDeckId(deck._id)}
                  className="glass-panel transition-all hover-scale cursor-pointer relative"
                  style={{
                    padding: '1.25rem',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '1rem',
                    background: 'rgba(15, 23, 42, 0.65)'
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '0.5rem', color: 'var(--accent-primary)' }}>
                        <Folder size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base leading-tight">{deck.name}</h4>
                        {deck.topic && (
                          <span className="text-xs text-secondary flex items-center gap-1 mt-0.5" style={{ color: 'var(--accent-secondary)' }}>
                            <Tag size={10} /> {deck.topic}
                          </span>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={(e) => handleDeleteDeck(deck._id, e)}
                      title="Delete deck"
                      style={{ 
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171',
                        padding: '0.45rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                        e.currentTarget.style.borderColor = '#ef4444';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                        e.currentTarget.style.color = '#f87171';
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {deck.description && (
                    <p className="text-xs text-secondary mb-4 line-clamp-2" style={{ minHeight: '32px' }}>
                      {deck.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-3 text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="font-semibold text-blue">
                      {deck.stats?.totalCards || 0} Flashcards
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDeckId(deck._id);
                          setShowSRSModal(true);
                        }}
                        style={{
                          background: 'rgba(139, 92, 246, 0.2)',
                          border: '1px solid rgba(139, 92, 246, 0.4)',
                          color: '#a78bfa',
                          padding: '0.25rem 0.55rem',
                          borderRadius: '0.4rem',
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          transition: 'all 0.2s ease'
                        }}
                        title="Start SRS review session for this deck"
                      >
                        <Brain size={12} /> Study SRS
                      </button>
                      <span className="text-secondary flex items-center gap-1 font-medium hover:text-white">
                        Open →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cards Header Title */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider">
          {selectedDeckId === 'all' 
            ? `All Flashcards (${flashcards.length})` 
            : activeDeck 
              ? `Cards in "${activeDeck.name}" (${flashcards.length})`
              : `Uncategorized Cards (${flashcards.length})`}
        </h3>
      </div>

      {/* Flashcards Grid (Squarish / Rectangular Compact Cards Layout) */}
      {flashcards.length === 0 ? (
        <div className="glass-panel text-center flex flex-col items-center justify-center p-8" style={{ border: '2px dashed var(--border-hover)' }}>
          <Layers size={48} className="text-muted mb-4" />
          <h3 className="text-lg font-semibold mb-2">No flashcards found</h3>
          <p className="text-secondary mb-6 max-w-md mx-auto text-xs">
            {selectedDeckId === 'all' 
              ? 'Generate your first batch of AI flashcards topic-wise or create custom decks.'
              : 'This deck doesn\'t have any flashcards yet. Click below to generate AI flashcards directly into this deck.'}
          </p>
          <button 
            onClick={() => {
              setGenerateConfig(prev => ({
                ...prev,
                deckId: selectedDeckId !== 'all' && selectedDeckId !== 'uncategorized' ? selectedDeckId : '',
                topic: activeDeck?.topic || ''
              }));
              setShowGenerateModal(true);
            }} 
            disabled={generating} 
            className="btn btn-primary" 
            style={{ width: 'auto', fontSize: '0.85rem' }}
          >
            <Wand2 size={15} /> Generate Cards with AI
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {flashcards.map((card) => {
            const isFlipped = flippedCards.has(card._id);
            return (
              <div 
                key={card._id}
                style={{
                  height: '220px',
                  perspective: '1000px',
                  cursor: 'pointer'
                }}
                onClick={() => toggleFlip(card._id)}
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
                    className="glass-panel flex flex-col items-center justify-center text-center relative"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backfaceVisibility: 'hidden',
                      padding: '1.25rem',
                      borderRadius: '1rem',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      background: 'rgba(15, 23, 42, 0.75)'
                    }}
                  >
                    <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', right: '0.75rem' }} className="flex justify-between items-center">
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--accent-primary)', background: 'rgba(59, 130, 246, 0.15)', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', textTransform: 'uppercase' }}>
                        Question
                      </span>
                      {card.topic && (
                        <span className="flex items-center gap-1 text-xs text-secondary" style={{ background: 'rgba(255,255,255,0.08)', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.65rem' }}>
                          <Tag size={9} /> {card.topic}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm font-medium px-2 leading-snug">{card.question}</p>
                    
                    <div style={{ position: 'absolute', bottom: '0.6rem', left: '0.75rem', right: '0.75rem' }} className="flex justify-between items-center text-xs">
                      <span style={{
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.35rem',
                        borderRadius: '0.25rem',
                        background: !card.dueDate || new Date(card.dueDate) <= new Date()
                          ? 'rgba(239, 68, 68, 0.2)'
                          : 'rgba(16, 185, 129, 0.2)',
                        color: !card.dueDate || new Date(card.dueDate) <= new Date()
                          ? '#f87171'
                          : '#34d399'
                      }}>
                        {!card.dueDate || new Date(card.dueDate) <= new Date() ? '• Due Now' : `Due: ${new Date(card.dueDate).toLocaleDateString()}`}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Click to flip 🔄</span>
                    </div>
                  </div>
                  
                  {/* Back (Answer) */}
                  <div 
                    className="glass-panel flex flex-col items-center justify-center text-center relative"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      padding: '1.25rem',
                      borderRadius: '1rem',
                      border: '1px solid rgba(139, 92, 246, 0.35)',
                      background: 'rgba(20, 15, 35, 0.85)'
                    }}
                  >
                    <span style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', fontSize: '0.65rem', fontWeight: 700, color: 'var(--accent-secondary)', background: 'rgba(139, 92, 246, 0.15)', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', textTransform: 'uppercase' }}>
                      Answer
                    </span>
                    <p className="text-sm font-medium text-white px-2 leading-relaxed">{card.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Deck */}
      {showDeckModal && createPortal(
        <div className="modal-backdrop animate-fade-in">
          <div className="glass-panel max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">Create New Deck</h3>
            <form onSubmit={handleCreateDeck}>
              <div className="form-group mb-4">
                <label>Deck Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Chapter 1: Machine Learning Basics" 
                  value={newDeck.name}
                  onChange={(e) => setNewDeck({ ...newDeck, name: e.target.value })}
                />
              </div>
              <div className="form-group mb-4">
                <label>Topic / Sub-chapter Focus (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Supervised vs Unsupervised Learning" 
                  value={newDeck.topic}
                  onChange={(e) => setNewDeck({ ...newDeck, topic: e.target.value })}
                />
              </div>
              <div className="form-group mb-6">
                <label>Description (Optional)</label>
                <textarea 
                  placeholder="Brief description of this card deck..." 
                  value={newDeck.description}
                  onChange={(e) => setNewDeck({ ...newDeck, description: e.target.value })}
                  style={{ minHeight: '80px' }}
                />
              </div>
              <div className="flex gap-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeckModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Deck</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Topic-Wise AI Generation */}
      {showGenerateModal && createPortal(
        <div className="modal-backdrop animate-fade-in">
          <div className="glass-panel max-w-md w-full">
            <div className="flex items-center gap-2 mb-2">
              <Wand2 className="text-blue" size={24} />
              <h3 className="text-2xl font-bold">Topic AI Flashcards</h3>
            </div>
            <p className="text-xs text-secondary mb-6">Generate targeted flashcards from your uploaded lecture notes focused on specific topics.</p>
            
            <form onSubmit={handleGenerate}>
              <div className="form-group mb-4">
                <label>Select Target Deck (Optional)</label>
                <select 
                  value={generateConfig.deckId} 
                  onChange={(e) => setGenerateConfig({ ...generateConfig, deckId: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }}
                >
                  <option value="">General (No Deck)</option>
                  {decks.map(deck => (
                    <option key={deck._id} value={deck._id}>{deck.name} {deck.topic ? `(${deck.topic})` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="form-group mb-4">
                <label>Topic / Concept Focus (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Gradient Descent & Backpropagation" 
                  value={generateConfig.topic}
                  onChange={(e) => setGenerateConfig({ ...generateConfig, topic: e.target.value })}
                />
                <span className="text-xs text-muted mt-1 block">Leave empty to generate across all concepts in your notes.</span>
              </div>

              <div className="form-group mb-6">
                <label>Number of Cards</label>
                <select 
                  value={generateConfig.count}
                  onChange={(e) => setGenerateConfig({ ...generateConfig, count: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }}
                >
                  <option value={5}>5 Cards</option>
                  <option value={10}>10 Cards</option>
                  <option value={15}>15 Cards</option>
                  <option value={20}>20 Cards</option>
                </select>
              </div>

              <div className="flex gap-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowGenerateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Start AI Generation</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: New Manual Card */}
      {showManualModal && createPortal(
        <div className="modal-backdrop animate-fade-in">
          <div className="glass-panel max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">Create Flashcard</h3>
            <form onSubmit={handleCreateManualCard}>
              <div className="form-group mb-4">
                <label>Target Deck</label>
                <select 
                  value={manualCard.deckId} 
                  onChange={(e) => setManualCard({ ...manualCard, deckId: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }}
                >
                  <option value="">General (No Deck)</option>
                  {decks.map(deck => (
                    <option key={deck._id} value={deck._id}>{deck.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group mb-4">
                <label>Topic Tag (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Definitions" 
                  value={manualCard.topic}
                  onChange={(e) => setManualCard({ ...manualCard, topic: e.target.value })}
                />
              </div>
              <div className="form-group mb-4">
                <label>Question (Front)</label>
                <textarea 
                  required
                  placeholder="Enter flashcard question..." 
                  value={manualCard.question}
                  onChange={(e) => setManualCard({ ...manualCard, question: e.target.value })}
                  style={{ minHeight: '70px' }}
                />
              </div>
              <div className="form-group mb-6">
                <label>Answer (Back)</label>
                <textarea 
                  required
                  placeholder="Enter flashcard answer..." 
                  value={manualCard.answer}
                  onChange={(e) => setManualCard({ ...manualCard, answer: e.target.value })}
                  style={{ minHeight: '70px' }}
                />
              </div>
              <div className="flex gap-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowManualModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Card</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* SRS Interactive Study Modal */}
      <SRSStudyModal
        subjectId={subjectId}
        selectedDeckId={selectedDeckId}
        isOpen={showSRSModal}
        onClose={() => setShowSRSModal(false)}
        onSessionComplete={() => {
          Promise.all([fetchFlashcards(), fetchDecks(), fetchCalculatorStats()]);
        }}
      />

      {/* About SRS & Forgetting Curve Interactive Modal */}
      {showAboutModal && createPortal(
        <div className="modal-backdrop animate-fade-in" style={{ zIndex: 1000, background: 'rgba(5, 8, 22, 0.85)', backdropFilter: 'blur(16px)' }}>
          <div 
            style={{
              width: '100%',
              maxWidth: '860px',
              maxHeight: '92vh',
              overflowY: 'auto',
              borderRadius: '1.5rem',
              position: 'relative'
            }}
          >
            <button 
              onClick={() => setShowAboutModal(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                zIndex: 10,
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>
            <SRSAboutGraph />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
