const Document = require('../models/Document');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Subject = require('../models/Subject');
const { generateContent, extractJson } = require('../services/aiProvider');
const { quizGenerationPrompt } = require('../services/promptTemplates');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/quiz/:subjectId/generate  { count?: number }
const generateQuiz = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  const count = Math.min(Number(req.body.count) || 10, 20);

  const subject = await Subject.findOne({ _id: subjectId, userId: req.user.id });
  if (!subject) return res.status(404).json({ message: 'Subject not found' });

  const documents = await Document.find({ subjectId }).select('extractedText');
  if (documents.length === 0) {
    return res.status(400).json({ message: 'Upload at least one document before generating a quiz' });
  }

  const context = documents.map((d) => d.extractedText).join('\n\n');
  const prompt = quizGenerationPrompt(context, count);
  const rawResponse = await generateContent(prompt);

  let questions;
  try {
    questions = extractJson(rawResponse);
  } catch (err) {
    console.error('Failed to parse quiz JSON:', rawResponse);
    return res.status(502).json({ message: 'AI returned an unexpected format. Please try again.' });
  }

  const quiz = await Quiz.create({
    subjectId,
    userId: req.user.id,
    title: `${subject.name} Quiz`,
    questions
  });

  // Don't leak correctAnswer to the client when serving the quiz to be taken
  const safeQuiz = {
    _id: quiz._id,
    title: quiz.title,
    questions: quiz.questions.map((q) => ({ questionText: q.questionText, options: q.options }))
  };

  res.status(201).json(safeQuiz);
});

// POST /api/quiz/:quizId/submit  { answers: [{ questionIndex, selectedAnswer }] }
const submitQuiz = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const { answers } = req.body;

  const quiz = await Quiz.findOne({ _id: quizId, userId: req.user.id });
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ message: 'Answers are required' });
  }

  let score = 0;
  const gradedAnswers = answers.map(({ questionIndex, selectedAnswer }) => {
    const question = quiz.questions[questionIndex];
    const isCorrect = question && question.correctAnswer === selectedAnswer;
    if (isCorrect) score += 1;
    return { questionIndex, selectedAnswer, isCorrect: !!isCorrect };
  });

  const attempt = await QuizAttempt.create({
    quizId,
    subjectId: quiz.subjectId,
    userId: req.user.id,
    answers: gradedAnswers,
    score,
    totalQuestions: quiz.questions.length
  });

  // Return full quiz (with correct answers) so the UI can show a review screen
  res.status(201).json({
    attempt,
    review: quiz.questions.map((q, i) => ({
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
      selectedAnswer: gradedAnswers[i]?.selectedAnswer || null,
      isCorrect: gradedAnswers[i]?.isCorrect || false
    }))
  });
});

// GET /api/quiz/:subjectId/history
const getQuizHistory = asyncHandler(async (req, res) => {
  const attempts = await QuizAttempt.find({ subjectId: req.params.subjectId, userId: req.user.id })
    .sort({ createdAt: -1 })
    .populate('quizId', 'title');

  res.json(attempts);
});

module.exports = { generateQuiz, submitQuiz, getQuizHistory };
