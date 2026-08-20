const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema(
  {
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    deckId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deck', default: null, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    topic: { type: String, default: '' },
    source: { type: String, enum: ['ai', 'manual'], default: 'manual' },

    // Spaced Repetition System (SRS) Fields
    srsAlgorithm: { type: String, enum: ['sm2', 'fsrs'], default: 'fsrs' },
    state: { type: String, enum: ['new', 'learning', 'review', 'relearning'], default: 'new' },
    dueDate: { type: Date, default: Date.now, index: true },
    lastReviewed: { type: Date, default: null },
    reps: { type: Number, default: 0 },
    lapses: { type: Number, default: 0 },
    interval: { type: Number, default: 0 }, // in days
    easeFactor: { type: Number, default: 2.5 }, // SM-2 Ease Factor
    stability: { type: Number, default: 0.4 }, // FSRS Memory Stability S (days)
    difficulty: { type: Number, default: 5.0 } // FSRS Difficulty D (1-10)
  },
  { timestamps: true }
);

module.exports = mongoose.model('Flashcard', flashcardSchema);
