const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadDocument, getDocuments, deleteDocument } = require('../controllers/documentController');

router.use(protect);

router.post('/:subjectId', upload.single('file'), uploadDocument);
router.get('/:subjectId', getDocuments);
router.delete('/:id', deleteDocument);

module.exports = router;
