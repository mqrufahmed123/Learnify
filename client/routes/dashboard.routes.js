const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { getOverview } = require('../controllers/dashboardController');

router.use(protect);

router.get('/overview', getOverview);

module.exports = router;
