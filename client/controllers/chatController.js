const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const Document = require('../models/Document');
const ChatMessage = require('../models/ChatMessage');
const Subject = require('../models/Subject');
const { generateContent } = require('../services/aiProvider');
const { chatSystemPrompt } = require('../services/promptTemplates');
const asyncHandler = require('../utils/asyncHandler');

// Ensure uploads/chat directory exists
const uploadsDir = path.join(__dirname, '../uploads/chat');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Pulls every document's extracted text for a subject and concatenates it into
// one context blob.
async function buildSubjectContext(subjectId) {
  const documents = await Document.find({ subjectId }).select('filename extractedText');
  return documents
    .map((doc) => `--- ${doc.filename} ---\n${doc.extractedText}`)
    .join('\n\n');
}

// POST /api/chat/:subjectId
const sendMessage = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  const question = req.body.question || '';
  const file = req.file;

  if (!question.trim() && !file) {
    return res.status(400).json({ message: 'Question or file attachment is required' });
  }

  const subject = await Subject.findOne({ _id: subjectId, userId: req.user.id });
  if (!subject) return res.status(404).json({ message: 'Subject not found' });

  const context = await buildSubjectContext(subjectId);

  // last 6 messages give the model conversational continuity without blowing up token usage
  const recentHistory = await ChatMessage.find({ subjectId })
    .sort({ createdAt: -1 })
    .limit(6)
    .then((msgs) => msgs.reverse());

  const promptText = chatSystemPrompt(
    subject.name, 
    context, 
    question || 'Please analyze this attached file.', 
    recentHistory
  );

  let parts = [{ text: promptText }];
  let attachments = [];

  if (file) {
    const isImage = file.mimetype.startsWith('image/');
    
    // Save file to server/uploads/chat/ so it can be served statically
    const uniqueFilename = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadsDir, uniqueFilename);
    fs.writeFileSync(filePath, file.buffer);
    
    const fileUrl = `/uploads/chat/${uniqueFilename}`;

    if (isImage) {
      const base64Data = file.buffer.toString('base64');

      attachments.push({
        filename: file.originalname,
        fileType: 'image',
        url: fileUrl,
        mimeType: file.mimetype
      });

      parts[0].text += `\n\n[NOTE: The student attached an image (${file.originalname}) with this message. Analyze the visual contents of the attached image to answer their question.]`;

      // Pass image directly to Gemini Multimodal API
      parts.push({
        inlineData: {
          mimeType: file.mimetype,
          data: base64Data
        }
      });
    } else {
      let docText = '';
      try {
        if (file.mimetype === 'application/pdf') {
          const parsed = await pdfParse(file.buffer);
          docText = parsed.text;
        } else {
          docText = file.buffer.toString('utf-8');
        }
      } catch (err) {
        console.error('Failed to parse attached document:', err);
      }

      attachments.push({
        filename: file.originalname,
        fileType: 'document',
        url: fileUrl,
        mimeType: file.mimetype
      });

      if (docText) {
        parts[0].text += `\n\n=== ATTACHED FILE CONTENT (${file.originalname}) ===\n${docText.slice(0, 10000)}`;
      }
    }
  }

  const aiResponse = await generateContent(parts);

  const [userMessage, assistantMessage] = await Promise.all([
    ChatMessage.create({
      subjectId,
      userId: req.user.id,
      role: 'user',
      content: question,
      attachments
    }),
    ChatMessage.create({
      subjectId,
      userId: req.user.id,
      role: 'assistant',
      content: aiResponse
    })
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
