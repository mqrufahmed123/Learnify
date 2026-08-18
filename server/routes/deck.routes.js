const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { createDeck, getDecks, deleteDeck, getCalculatorStats } = require('../controllers/deckController');

router.use(protect);

router.post('/:subjectId', createDeck);
router.get('/:subjectId', getDecks);
router.delete('/:id', deleteDeck);
router.get('/:subjectId/calculator', getCalculatorStats);

module.exports = router;
