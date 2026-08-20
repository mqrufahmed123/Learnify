const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { getSubjectAnalytics } = require('../controllers/analyticsController');

router.use(protect);

router.get('/:subjectId', getSubjectAnalytics);

module.exports = router;
