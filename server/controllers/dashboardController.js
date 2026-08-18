const Subject = require('../models/Subject');
const Document = require('../models/Document');
const Flashcard = require('../models/Flashcard');
const QuizAttempt = require('../models/QuizAttempt');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/dashboard/overview
const getOverview = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [subjectCount, documentCount, flashcardCount, quizzesTaken, recentQuizAttempts] = await Promise.all([
    Subject.countDocuments({ userId }),
    Document.countDocuments({ userId }),
    Flashcard.countDocuments({ userId }),
    QuizAttempt.countDocuments({ userId }),
    QuizAttempt.find({ userId }).sort({ createdAt: -1 }).limit(5).populate('subjectId', 'name')
  ]);

  res.json({ subjectCount, documentCount, flashcardCount, quizzesTaken, recentQuizAttempts });
});

module.exports = { getOverview };
