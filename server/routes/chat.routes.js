const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { sendMessage, getChatHistory } = require('../controllers/chatController');

router.use(protect);

router.post('/:subjectId', sendMessage);
router.get('/:subjectId', getChatHistory);

module.exports = router;
