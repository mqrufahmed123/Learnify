const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  getSubjectStats
} = require('../controllers/subjectController');

router.use(protect);

router.post('/', createSubject);
router.get('/', getSubjects);
router.get('/:id', getSubjectById);
router.put('/:id', updateSubject);
router.delete('/:id', deleteSubject);
router.get('/:id/stats', getSubjectStats);

module.exports = router;
