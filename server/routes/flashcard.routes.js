const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const {
  generateFlashcards,
  createFlashcard,
  getFlashcards,
  updateFlashcard,
  deleteFlashcard
} = require('../controllers/flashcardController');

router.use(protect);

router.post('/:subjectId/generate', generateFlashcards);
router.post('/:subjectId', createFlashcard);
router.get('/:subjectId', getFlashcards);
router.put('/card/:id', updateFlashcard);
router.delete('/card/:id', deleteFlashcard);

module.exports = router;
