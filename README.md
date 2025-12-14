# News Q&A Chatbot - Backend

A strictly retrieval-augmented generation (RAG) backend that ingests news from RSS feeds, embeds them into a vector database, and serves a chat API using Google Gemini.

## 📚 Tech Stack

*   **Runtime**: Node.js (v20), TypeScript
*   **Framework**: Express.js
*   **Vector Database**: Qdrant
*   **Caching**: Redis
*   **AI/ML**: 
    *   Text Embeddings: Jina AI
    *   LLM: Google Gemini
*   **Tools**: Docker, Cheerio (Scraping), RSS Parser

## 🚀 Getting Started

### 1. Prerequisites
*   Node.js installed (or Docker)
*   Qdrant instance (Local or Cloud)
*   Redis instance (Local or Cloud)
*   API Keys: Jina AI, Google Gemini

### 2. Environment Variables
Create a `.env` file in this directory:
```env
PORT=3000
JINA_API_KEY=your_jina_key
GEMINI_API_KEY=your_gemini_key

# Local Development
QDRANT_URL=http://localhost:6333
REDIS_URL=redis://localhost:6379

# Or Cloud Deployment
# QDRANT_URL=https://xyz.qdrant.tech
# QDRANT_API_KEY=your_qdrant_key
# REDIS_URL=redis://:password@host:port
```

### 3. Run Locally (Docker - Recommended)
This simulates the exact deployment environment.
```bash
docker build -t news-rag-backend .
docker run -p 3000:3000 --env-file .env news-rag-backend
```

### 4. Run Locally (Node.js)
```bash
# Install dependencies
npm install

# Build
npm run build

# Start (Runs Ingestion + Server)
npm start
```

## 📖 Documentation
*   [Code Walkthrough & Architecture](./CODE_WALKTHROUGH.md) - Detailed explanation of the internal flow.
*   [API Documentation](./README.md#api-endpoints)

## 📡 API Endpoints

### `POST /api/chat`
Ask a question to the bot.
*   Body: `{ "sessionId": "string", "message": "string" }`
*   Response: `{ "reply": "string", "references": [] }`

### `GET /api/chat/:sessionId/history`
Get past messages for a specific session.

### `DELETE /api/chat/:sessionId`
Clear session history.

### `GET /api/articles`
Debug endpoint to see currently ingested news titles.
