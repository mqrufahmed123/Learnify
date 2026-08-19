const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const {
  generateFlashcards,
  createFlashcard,
  getFlashcards,
  getDueFlashcards,
  reviewFlashcard,
  getCardPreviews,
  updateFlashcard,
  deleteFlashcard
} = require('../controllers/flashcardController');

router.use(protect);

router.post('/:subjectId/generate', generateFlashcards);
router.get('/:subjectId/due', getDueFlashcards);
router.post('/:subjectId', createFlashcard);
router.get('/:subjectId', getFlashcards);
router.post('/card/:id/review', reviewFlashcard);
router.get('/card/:id/preview', getCardPreviews);
router.put('/card/:id', updateFlashcard);
router.delete('/card/:id', deleteFlashcard);

module.exports = router;
