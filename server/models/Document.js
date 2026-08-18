const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    extractedText: { type: String, required: true }, // full text pulled from the PDF, used as chat/flashcard/quiz context
    pageCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);
