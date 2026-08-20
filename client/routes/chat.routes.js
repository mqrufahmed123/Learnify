const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const chatUpload = require('../middleware/chatUpload');
const { sendMessage, getChatHistory } = require('../controllers/chatController');

router.use(protect);

router.post('/:subjectId', chatUpload.single('file'), sendMessage);
router.get('/:subjectId', getChatHistory);

module.exports = router;
