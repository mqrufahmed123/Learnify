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

module.exports = {
  generateFlashcards,
  createFlashcard,
  getFlashcards,
  updateFlashcard,
  deleteFlashcard
};
