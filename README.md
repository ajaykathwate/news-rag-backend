# News RAG Backend

This is the backend for the News Q&A Chatbot. It handles:
- Ingestion of news from RSS feeds.
- Chunking and embedding using Jina AI.
- Storing vectors in Qdrant.
- Chat API with RAG using Google Gemini.
- Session management using Redis.

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Copy `.env.example` to `.env` and fill in the values:
   - `JINA_API_KEY`: Get from [Jina AI](https://jina.ai/).
   - `GEMINI_API_KEY`: Get from [Google AI Studio](https://aistudio.google.com/).
   - `QDRANT_URL`: Defaults to `http://localhost:6333` (local Docker).
   - `REDIS_URL`: Defaults to `redis://localhost:6379` (local Docker).

3. **Start Infrastructure**:
   Go to the project root (parent directory) and run:
   ```bash
   docker-compose up -d
   ```
   This starts Qdrant (Vector DB) and Redis (Cache).

## Ingestion

Before chatting, you need to ingest news data:

```bash
npm run ingest
```
This script fetches news from RSS feeds, embeds them, and stores them in Qdrant.

## Running the Server

```bash
npm run dev
```
The server will start on `http://localhost:3000`.

## API Endpoints

- `POST /api/chat`: Send a message. Body: `{ sessionId, message }`.
- `GET /api/chat/:sessionId/history`: Get chat history.
- `DELETE /api/chat/:sessionId`: Clear chat session.
# news-rag-backend
