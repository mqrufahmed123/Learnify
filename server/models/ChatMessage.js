const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, default: '' },
    attachments: [
      {
        filename: String,
        fileType: { type: String, enum: ['image', 'document'] },
        url: String,
        mimeType: String
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
