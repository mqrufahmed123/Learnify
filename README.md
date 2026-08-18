# 🎓 Learnify — AI-Powered Personal Learning Assistant

Learnify is a full-stack, AI-driven educational platform designed to transform raw study documents into interactive study decks, practice quizzes, and an intelligent AI Tutor. Powered by **Google Gemini 1.5 Flash**, Learnify provides a personalized, fast, and structured learning environment.

---

## ✨ Features

- **🔐 Dual Authentication**: Sign in using traditional Email/Password or 1-click **Google OAuth 2.0**.
- **📚 Subject & Workspace Management**: Organize your learning materials by custom subject categories.
- **📄 AI Document Processing**: Upload PDFs and text documents to automatically extract knowledge and contextual information.
- **💬 AI Tutor Chat**:
  - Ask context-aware questions directly based on your uploaded study materials.
  - **Rich Markdown Formatting** with hierarchical headings, lists, bold text, and math/code support.
  - **VS Code Syntax Highlighting** (`vscDarkPlus` theme) with language badges (`PYTHON`, `JAVASCRIPT`, `CPP`, etc.) and 1-click **Copy Code** functionality.
- **🗂️ Flashcard Deck System**:
  - Topic-wise deck generation and flashcard management.
  - Grid layout with deck calculator metrics (cards per deck, active decks count).
- **📝 Interactive AI Quizzes**:
  - Automatically generated multi-choice quizzes based on your study subjects.
  - Instant scoring with percentage visualizers.
  - Detailed post-quiz **Question Review Breakdown** highlighting correct/incorrect answers and explanations.
- **🎨 Glassmorphism UX/UI**: Designed with modern dark-mode aesthetic, micro-animations, and fluid transitions.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: React 19 + Vite
- **Routing**: React Router DOM v7
- **Styling**: Modern CSS Glassmorphic Design System
- **Icons**: Lucide React
- **Markdown & Code Rendering**: `react-markdown`, `react-syntax-highlighter`
- **Authentication**: `@react-oauth/google`

### **Backend**
- **Runtime**: Node.js & Express
- **Database**: MongoDB (Mongoose ORM)
- **AI Engine**: Google Gemini API (`@google/genai`)
- **Authentication**: JWT (JSON Web Tokens), `bcryptjs`, Google Token Verification
- **File Uploads**: Multer & `pdf-parse`

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) (Local or MongoDB Atlas Cluster)
- [Google Gemini API Key](https://aistudio.google.com/)
- [Google Cloud OAuth Client ID](https://console.cloud.google.com/apis/credentials)

---

### 📥 Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/mqrufahmed123/Learnify.git
   cd Learnify
   ```

2. **Backend Setup (`/server`)**:
   ```bash
   cd server
   npm install
   ```
   Create a `.env` file inside the `server/` directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/ai-learning-assistant
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   GEMINI_API_KEY=your_google_gemini_api_key
   GEMINI_MODEL=gemini-2.5-flash
   CLIENT_URL=http://localhost:5173
   ```

3. **Frontend Setup (`/client`)**:
   ```bash
   cd ../client
   npm install
   ```
   Create a `.env` file inside the `client/` directory:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   ```

---

### 🏃 Running the Application

1. **Start the Backend Server**:
   ```bash
   cd server
   npm run dev
   ```
   *(Runs on `http://localhost:5000`)*

2. **Start the Frontend Client**:
   ```bash
   cd client
   npm run dev
   ```
   *(Runs on `http://localhost:5173`)*

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Email/Password login |
| `POST` | `/api/auth/google` | Google OAuth token login |
| `GET` | `/api/subject` | Get user subjects |
| `POST` | `/api/chat/:subjectId` | Query AI Tutor for subject |
| `GET` | `/api/flashcard/decks/:subjectId` | Get flashcard decks & metrics |
| `POST` | `/api/quiz/generate` | Generate AI Quiz for subject |
| `POST` | `/api/quiz/submit` | Submit Quiz answers & receive score breakdown |

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).
