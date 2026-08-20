const Document = require('../models/Document');
const Subject = require('../models/Subject');
const { extractTextFromPdf } = require('../services/pdfParser');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/documents/:subjectId  (multipart/form-data, field name: "file")
const uploadDocument = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;

  const subject = await Subject.findOne({ _id: subjectId, userId: req.user.id });
  if (!subject) return res.status(404).json({ message: 'Subject not found' });

  if (!req.file) return res.status(400).json({ message: 'No PDF file uploaded' });

  const { text, pageCount } = await extractTextFromPdf(req.file.buffer);

  if (!text || text.length < 20) {
    return res.status(400).json({
      message: 'Could not extract readable text from this PDF (it may be a scanned image without OCR)'
    });
  }

  const document = await Document.create({
    subjectId,
    userId: req.user.id,
    filename: req.file.originalname,
    extractedText: text,
    pageCount
  });

  // Don't send the full extracted text back on upload - the client only needs metadata to list it
  res.status(201).json({
    id: document._id,
    filename: document.filename,
    pageCount: document.pageCount,
    createdAt: document.createdAt
  });
});

// GET /api/documents/:subjectId
const getDocuments = asyncHandler(async (req, res) => {
  const documents = await Document.find({ subjectId: req.params.subjectId, userId: req.user.id })
    .select('-extractedText') // list view doesn't need the full text payload
    .sort({ createdAt: -1 });

  res.json(documents);
});

// DELETE /api/documents/:id
const deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!document) return res.status(404).json({ message: 'Document not found' });
  res.json({ message: 'Document deleted' });
});

module.exports = { uploadDocument, getDocuments, deleteDocument };
