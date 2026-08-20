const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => v.length === 4,
        message: 'Each question must have exactly 4 options'
      }
    },
    correctAnswer: { type: String, required: true }
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, default: 'Quiz' },
    questions: { type: [questionSchema], required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quiz', quizSchema);
