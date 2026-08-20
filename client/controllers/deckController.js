const Deck = require('../models/Deck');
const Flashcard = require('../models/Flashcard');
const Subject = require('../models/Subject');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/decks/:subjectId
const createDeck = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  const { name, description, topic } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Deck name is required' });
  }

  const subject = await Subject.findOne({ _id: subjectId, userId: req.user.id });
  if (!subject) return res.status(404).json({ message: 'Subject not found' });

  const deck = await Deck.create({
    subjectId,
    userId: req.user.id,
    name: name.trim(),
    description: description || '',
    topic: topic || ''
  });

  res.status(201).json(deck);
});

// GET /api/decks/:subjectId
const getDecks = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  const decks = await Deck.find({ subjectId, userId: req.user.id }).sort({ createdAt: -1 });

  // Get card stats per deck
  const decksWithStats = await Promise.all(
    decks.map(async (deck) => {
      const [total, aiCount, manualCount] = await Promise.all([
        Flashcard.countDocuments({ deckId: deck._id }),
        Flashcard.countDocuments({ deckId: deck._id, source: 'ai' }),
        Flashcard.countDocuments({ deckId: deck._id, source: 'manual' })
      ]);

      return {
        ...deck.toObject(),
        stats: {
          totalCards: total,
          aiCards: aiCount,
          manualCards: manualCount
        }
      };
    })
  );

  res.json(decksWithStats);
});

// DELETE /api/decks/:id
const deleteDeck = asyncHandler(async (req, res) => {
  const deck = await Deck.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!deck) return res.status(404).json({ message: 'Deck not found' });

  // Unassign cards from deleted deck (or keep them under uncategorized)
  await Flashcard.updateMany({ deckId: deck._id }, { $set: { deckId: null } });

  res.json({ message: 'Deck deleted successfully' });
});

// GET /api/decks/:subjectId/calculator
const getCalculatorStats = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;

  const now = new Date();

  const [
    totalCards, 
    aiCardsCount, 
    manualCardsCount, 
    uncategorizedCards, 
    dueCardsCount,
    learningCardsCount,
    reviewCardsCount,
    newCardsCount,
    decks
  ] = await Promise.all([
    Flashcard.countDocuments({ subjectId, userId: req.user.id }),
    Flashcard.countDocuments({ subjectId, userId: req.user.id, source: 'ai' }),
    Flashcard.countDocuments({ subjectId, userId: req.user.id, source: 'manual' }),
    Flashcard.countDocuments({ subjectId, userId: req.user.id, deckId: null }),
    Flashcard.countDocuments({ subjectId, userId: req.user.id, dueDate: { $lte: now } }),
    Flashcard.countDocuments({ subjectId, userId: req.user.id, state: { $in: ['learning', 'relearning'] } }),
    Flashcard.countDocuments({ subjectId, userId: req.user.id, state: 'review', dueDate: { $gt: now } }),
    Flashcard.countDocuments({ subjectId, userId: req.user.id, $or: [{ state: 'new' }, { reps: 0 }] }),
    Deck.find({ subjectId, userId: req.user.id }).sort({ name: 1 })
  ]);

  const deckBreakdown = await Promise.all(
    decks.map(async (deck) => {
      const [total, ai, manual, due] = await Promise.all([
        Flashcard.countDocuments({ deckId: deck._id }),
        Flashcard.countDocuments({ deckId: deck._id, source: 'ai' }),
        Flashcard.countDocuments({ deckId: deck._id, source: 'manual' }),
        Flashcard.countDocuments({ deckId: deck._id, dueDate: { $lte: now } })
      ]);

      return {
        deckId: deck._id,
        name: deck.name,
        topic: deck.topic,
        totalCards: total,
        aiCards: ai,
        manualCards: manual,
        dueCards: due
      };
    })
  );

  res.json({
    totalCards,
    totalDecks: decks.length,
    aiCardsCount,
    manualCardsCount,
    uncategorizedCards,
    dueCardsCount,
    learningCardsCount,
    reviewCardsCount,
    newCardsCount,
    deckBreakdown
  });
});

module.exports = {
  createDeck,
  getDecks,
  deleteDeck,
  getCalculatorStats
};
