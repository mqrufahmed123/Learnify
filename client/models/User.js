const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String }, // Optional for Google Auth users
    googleId: { type: String, unique: true, sparse: true },
    studyStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastStudyDate: { type: String, default: null }, // 'YYYY-MM-DD'
    studyActivity: [
      {
        date: { type: String, required: true }, // 'YYYY-MM-DD'
        count: { type: Number, default: 1 }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
