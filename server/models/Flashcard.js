const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema(
  {
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    deckId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deck', default: null, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    topic: { type: String, default: '' },
    source: { type: String, enum: ['ai', 'manual'], default: 'manual' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Flashcard', flashcardSchema);
