const Subject = require('../models/Subject');
const Document = require('../models/Document');
const Flashcard = require('../models/Flashcard');
const Quiz = require('../models/Quiz');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/subjects
const createSubject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Subject name is required' });

  const subject = await Subject.create({ userId: req.user.id, name, description });
  res.status(201).json(subject);
});

// GET /api/subjects
const getSubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(subjects);
});

// GET /api/subjects/:id
const getSubjectById = asyncHandler(async (req, res) => {
  const subject = await Subject.findOne({ _id: req.params.id, userId: req.user.id });
  if (!subject) return res.status(404).json({ message: 'Subject not found' });
  res.json(subject);
});

// PUT /api/subjects/:id
const updateSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!subject) return res.status(404).json({ message: 'Subject not found' });
  res.json(subject);
});

// DELETE /api/subjects/:id
// Cascades: removing a subject also removes its documents, flashcards, and quizzes
// so orphaned data doesn't pile up in the database.
const deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!subject) return res.status(404).json({ message: 'Subject not found' });

  await Promise.all([
    Document.deleteMany({ subjectId: subject._id }),
    Flashcard.deleteMany({ subjectId: subject._id }),
    Quiz.deleteMany({ subjectId: subject._id })
  ]);

  res.json({ message: 'Subject and related data deleted' });
});

// GET /api/subjects/:id/stats  (per-subject counts for the workspace view)
const getSubjectStats = asyncHandler(async (req, res) => {
  const subjectId = req.params.id;

  const [documentCount, flashcardCount, quizCount] = await Promise.all([
    Document.countDocuments({ subjectId }),
    Flashcard.countDocuments({ subjectId }),
    Quiz.countDocuments({ subjectId })
  ]);

  res.json({ documentCount, flashcardCount, quizCount });
});

module.exports = {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  getSubjectStats
};
