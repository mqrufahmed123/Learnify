const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { generateQuiz, submitQuiz, getQuizHistory, getQuizAttemptDetails } = require('../controllers/quizController');

router.use(protect);

// Specific static-segment routes first (before :subjectId/:quizId wildcards)
router.get('/attempt/:attemptId', getQuizAttemptDetails);

router.post('/:subjectId/generate', generateQuiz);
router.post('/:quizId/submit', submitQuiz);
router.get('/:subjectId/history', getQuizHistory);

module.exports = router;
