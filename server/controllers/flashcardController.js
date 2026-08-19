const Document = require('../models/Document');
const Flashcard = require('../models/Flashcard');
const Subject = require('../models/Subject');
const { generateContent, extractJson } = require('../services/aiProvider');
const { flashcardGenerationPrompt } = require('../services/promptTemplates');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/flashcards/:subjectId/generate  { count?: number, deckId?: string, topic?: string }
const generateFlashcards = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  const { deckId, topic } = req.body;
  const count = Math.min(Number(req.body.count) || 10, 20); // cap to keep prompt/response size sane

  const subject = await Subject.findOne({ _id: subjectId, userId: req.user.id });
  if (!subject) return res.status(404).json({ message: 'Subject not found' });

  const documents = await Document.find({ subjectId }).select('extractedText');
  if (documents.length === 0) {
    return res.status(400).json({ message: 'Upload at least one document before generating flashcards' });
  }

  const context = documents.map((d) => d.extractedText).join('\n\n');
  const prompt = flashcardGenerationPrompt(context, count, topic);
  const rawResponse = await generateContent(prompt);

  let cards;
  try {
    cards = extractJson(rawResponse);
  } catch (err) {
    console.error('Failed to parse flashcard JSON:', rawResponse);
    return res.status(502).json({ message: 'AI returned an unexpected format. Please try again.' });
  }

  const flashcards = await Flashcard.insertMany(
    cards.map((c) => ({
      subjectId,
      deckId: deckId || null,
      userId: req.user.id,
      question: c.question,
      answer: c.answer,
      topic: topic || '',
      source: 'ai'
    }))
  );

  res.status(201).json(flashcards);
});

// POST /api/flashcards/:subjectId  { question, answer, deckId, topic }  (manual create)
const createFlashcard = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  const { question, answer, deckId, topic } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ message: 'Question and answer are required' });
  }

  const flashcard = await Flashcard.create({
    subjectId,
    deckId: deckId || null,
    userId: req.user.id,
    question,
    answer,
    topic: topic || '',
    source: 'manual'
  });

  res.status(201).json(flashcard);
});

// GET /api/flashcards/:subjectId  (?deckId=...)
const getFlashcards = asyncHandler(async (req, res) => {
  const query = { subjectId: req.params.subjectId, userId: req.user.id };
  if (req.query.deckId === 'uncategorized') {
    query.deckId = null;
  } else if (req.query.deckId) {
    query.deckId = req.query.deckId;
  }

  const flashcards = await Flashcard.find(query).sort({ createdAt: -1 });
  res.json(flashcards);
});

// PUT /api/flashcards/card/:id
const updateFlashcard = asyncHandler(async (req, res) => {
  const flashcard = await Flashcard.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!flashcard) return res.status(404).json({ message: 'Flashcard not found' });
  res.json(flashcard);
});

// DELETE /api/flashcards/card/:id
const deleteFlashcard = asyncHandler(async (req, res) => {
  const flashcard = await Flashcard.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!flashcard) return res.status(404).json({ message: 'Flashcard not found' });
  res.json({ message: 'Flashcard deleted' });
});

const { calculateSM2, calculateFSRS, previewNextIntervals } = require('../services/srsEngine');

// GET /api/flashcards/:subjectId/due (?deckId=...&cram=true&algorithm=fsrs)
const getDueFlashcards = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  const { deckId, cram, algorithm = 'fsrs' } = req.query;

  const query = { subjectId, userId: req.user.id };
  if (deckId === 'uncategorized') {
    query.deckId = null;
  } else if (deckId && deckId !== 'all') {
    query.deckId = deckId;
  }

  if (cram !== 'true') {
    query.dueDate = { $lte: new Date() };
  }

  const cards = await Flashcard.find(query).sort({ dueDate: 1 });

  const cardsWithPreviews = cards.map((card) => {
    const cardObj = card.toObject();
    cardObj.previews = previewNextIntervals(card, algorithm);
    return cardObj;
  });

  res.json(cardsWithPreviews);
});

const { recordUserActivity } = require('../services/streakTracker');

// POST /api/flashcards/card/:id/review { rating: 1|2|3|4, algorithm: 'sm2'|'fsrs' }
const reviewFlashcard = asyncHandler(async (req, res) => {
  const { rating, algorithm = 'fsrs' } = req.body;
  if (![1, 2, 3, 4].includes(Number(rating))) {
    return res.status(400).json({ message: 'Rating must be 1 (Again), 2 (Hard), 3 (Good), or 4 (Easy)' });
  }

  const flashcard = await Flashcard.findOne({ _id: req.params.id, userId: req.user.id });
  if (!flashcard) return res.status(404).json({ message: 'Flashcard not found' });

  const updatedStats = algorithm === 'sm2' 
    ? calculateSM2(flashcard, Number(rating)) 
    : calculateFSRS(flashcard, Number(rating));

  Object.assign(flashcard, updatedStats);
  await flashcard.save();

  // Record daily study activity & update streak
  const streakInfo = await recordUserActivity(req.user.id);

  const nextPreviews = previewNextIntervals(flashcard, algorithm);

  res.json({
    flashcard,
    previews: nextPreviews,
    streakInfo
  });
});

// GET /api/flashcards/card/:id/preview (?algorithm=fsrs)
const getCardPreviews = asyncHandler(async (req, res) => {
  const algorithm = req.query.algorithm || 'fsrs';
  const flashcard = await Flashcard.findOne({ _id: req.params.id, userId: req.user.id });
  if (!flashcard) return res.status(404).json({ message: 'Flashcard not found' });

  const previews = previewNextIntervals(flashcard, algorithm);
  res.json(previews);
});

module.exports = {
  generateFlashcards,
  createFlashcard,
  getFlashcards,
  getDueFlashcards,
  reviewFlashcard,
  getCardPreviews,
  updateFlashcard,
  deleteFlashcard
};
