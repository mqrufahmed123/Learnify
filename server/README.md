# AI Learning Assistant — Backend

MERN backend for a context-aware study assistant. Students upload lecture PDFs per
subject; the AI chat, flashcard generator, and quiz generator all use that subject's
uploaded text as context (Gemini API).

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in:
   - `MONGO_URI` — MongoDB Atlas connection string
   - `JWT_SECRET` — any long random string
   - `GEMINI_API_KEY` — from Google AI Studio

3. Run in dev mode:
   ```
   npm run dev
   ```
   Server starts on `http://localhost:5000` (or your configured PORT).

## API overview

| Area       | Method | Route                              | Notes                          |
|------------|--------|-------------------------------------|---------------------------------|
| Auth       | POST   | /api/auth/register                  |                                  |
| Auth       | POST   | /api/auth/login                     |                                  |
| Auth       | GET    | /api/auth/me                        | requires Bearer token           |
| Subjects   | POST   | /api/subjects                       |                                  |
| Subjects   | GET    | /api/subjects                       |                                  |
| Subjects   | GET    | /api/subjects/:id/stats             | doc/flashcard/quiz counts       |
| Documents  | POST   | /api/documents/:subjectId           | multipart, field name "file"    |
| Documents  | GET    | /api/documents/:subjectId           |                                  |
| Chat       | POST   | /api/chat/:subjectId                | { question }                    |
| Chat       | GET    | /api/chat/:subjectId                | full history                    |
| Flashcards | POST   | /api/flashcards/:subjectId/generate | { count } - AI generated        |
| Flashcards | GET    | /api/flashcards/:subjectId          |                                  |
| Quiz       | POST   | /api/quiz/:subjectId/generate       | { count } - AI generated        |
| Quiz       | POST   | /api/quiz/:quizId/submit            | { answers }                     |
| Quiz       | GET    | /api/quiz/:subjectId/history        |                                  |
| Dashboard  | GET    | /api/dashboard/overview             |                                  |

All routes except register/login require `Authorization: Bearer <token>`.

## Design notes

- **No vector search/RAG in this version** — for a subject's chat/flashcards/quiz,
  all uploaded documents' extracted text is concatenated and passed as full context.
  This is fine for a handful of lecture-note-sized PDFs per subject. Swap in
  MongoDB Atlas Vector Search later without touching controller signatures if you
  outgrow this (see `services/promptTemplates.js` and controllers for the seam).
- **`services/aiProvider.js`** is the single place that calls Gemini — swapping to
  OpenAI later means editing one file, not every controller.
- **No spaced repetition (SM-2) yet** — flashcards are stored flat; a review-scheduling
  field can be added to the `Flashcard` model later without a migration headache
  since Mongoose is schema-flexible.
