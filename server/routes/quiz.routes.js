const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { generateQuiz, submitQuiz, getQuizHistory } = require('../controllers/quizController');

router.use(protect);

router.post('/:subjectId/generate', generateQuiz);
router.post('/:quizId/submit', submitQuiz);
router.get('/:subjectId/history', getQuizHistory);

module.exports = router;
