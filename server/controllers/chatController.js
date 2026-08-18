const Document = require('../models/Document');
const ChatMessage = require('../models/ChatMessage');
const Subject = require('../models/Subject');
const { generateContent } = require('../services/aiProvider');
const { chatSystemPrompt } = require('../services/promptTemplates');
const asyncHandler = require('../utils/asyncHandler');

// Pulls every document's extracted text for a subject and concatenates it into
// one context blob. No chunking/embeddings in this version - fine for a handful
// of lecture-note-sized PDFs per subject.
async function buildSubjectContext(subjectId) {
  const documents = await Document.find({ subjectId }).select('filename extractedText');
  return documents
    .map((doc) => `--- ${doc.filename} ---\n${doc.extractedText}`)
    .join('\n\n');
}

// POST /api/chat/:subjectId  { question }
const sendMessage = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  const { question } = req.body;

  if (!question || !question.trim()) {
    return res.status(400).json({ message: 'Question is required' });
  }

  const subject = await Subject.findOne({ _id: subjectId, userId: req.user.id });
  if (!subject) return res.status(404).json({ message: 'Subject not found' });

  const context = await buildSubjectContext(subjectId);

  // last 6 messages give the model conversational continuity without blowing up token usage
  const recentHistory = await ChatMessage.find({ subjectId })
    .sort({ createdAt: -1 })
    .limit(6)
    .then((msgs) => msgs.reverse());

  const prompt = chatSystemPrompt(subject.name, context, question, recentHistory);
  const aiResponse = await generateContent(prompt);

  const [userMessage, assistantMessage] = await Promise.all([
    ChatMessage.create({ subjectId, userId: req.user.id, role: 'user', content: question }),
    ChatMessage.create({ subjectId, userId: req.user.id, role: 'assistant', content: aiResponse })
  ]);

  res.status(201).json({ userMessage, assistantMessage });
});

// GET /api/chat/:subjectId
const getChatHistory = asyncHandler(async (req, res) => {
  const messages = await ChatMessage.find({
    subjectId: req.params.subjectId,
    userId: req.user.id
  }).sort({ createdAt: 1 });

  res.json(messages);
});

module.exports = { sendMessage, getChatHistory };
