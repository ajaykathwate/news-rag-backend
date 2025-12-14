# Code Walkthrough & Architecture

This document provides a detailed explanation of the **News RAG Chatbot** architecture, covering the end-to-end flow from data ingestion to user interaction.

## 1. End-to-End Flow

### Part A: Data Ingestion (The "Knowledge" Build)
Before the user can ask questions, we build the knowledge base. This happens automatically on server startup (`src/scripts/ingestNews.ts`).

1.  **Fetching**: We use `rss-parser` to get the latest headlines from BBC and TechCrunch RSS feeds.
2.  **Scraping**: Since RSS feeds only provide short snippets, we use `axios` + `cheerio` to visit the actual article URL and scrape the full text content. This ensures high-quality context for the AI.
3.  **Chunking**: Large articles are split into smaller segments (approx. 500 words) using a sliding window approach in `src/services/textService.ts`. This ensures we don't exceed token limits.
4.  **Embedding**: Each text chunk is sent to **Jina AI Embeddings API**. This converts the text into a vector (a list of numbers representing meaning).
5.  **Indexing**: The vectors and their metadata (Title, URL, Text) are stored in **Qdrant**, a high-performance vector database.

### Part B: The RAG Chat Loop (Run-Time)
When a user asks a question in the frontend:

1.  **Request**: The frontend sends the user's message and `sessionId` to `POST /api/chat`.
2.  **Session History**: We fetch the conversation history from **Redis** to give the AI awareness of previous turns.
3.  **Vector Search**:
    *   The user's query is converted into a vector (using Jina).
    *   We query **Qdrant** for the "Nearest Neighbors"—the 5 chunks of news effectively most similar to the user's question.
4.  **Prompt Construction**:
    *   We create a system prompt that includes the **Context** (retrieved news chunks) and strict instructions for the AI.
    *   *Instruction Example*: "Answer based ONLY on the provided context. Be concise and professional."
5.  **Generation**: The prompt is sent to **Google Gemini (Flash Model)** through the `GoogleGenerativeAI` SDK.
6.  **Response**: The AI generates an answer. We store this interaction in Redis and send the reply back to the user.

---

## 2. Key Components & Tech Stack

### Backend (`/news-rag-backend`)
*   **Runtime**: Node.js & TypeScript.
*   **Web Framework**: Express.js.
*   **Vector Database**: Qdrant (Cloud/Docker).
    *   *Why?* Extremely fast, easy to set up, and excellent TypeScript client support.
*   **Embeddings**: Jina AI.
    *   *Why?* State-of-the-art text embeddings optimized for retrieval tasks.
*   **LLM**: Google Gemini (via `google-generative-ai`).
    *   *Why?* Fast inference and generous free tier for development.
*   **Caching/Session**: Redis (via `ioredis`).
    *   *Why?* Standard for high-speed, in-memory session management with TTL support.
*   **Scraping**: Cheerio.
    *   *Why?* Lightweight server-side HTML parsing (faster than Puppeteer for simple text extraction).

### Frontend (`/news-rag-frontend`)
*   **Framework**: React (Vite).
*   **Language**: TypeScript.
*   **Styling**: SCSS (Custom responsive design, no heavy CSS frameworks).
*   **State**: React Hooks (`useState`, `useEffect`).
*   **HTTP Client**: Axios.

---

## 3. Notable Design Decisions

1.  **Full Article Scraping**:
    *   *Decision*: We chose to scrape full text instead of relying on RSS descriptions.
    *   *Reason*: RSS snippets (e.g., "Read more about X...") provide insufficient context for RAG. Scraping enables the bot to answer detailed questions.

2.  **Strict "I Don't Know" Policy**:
    *   *Decision*: The system prompt explicitly forbids using outside knowledge.
    *   *Reason*: In a RAG system, "hallucination" (making things up) is the enemy. It is better for the bot to admit missing data than to invent fake news.

3.  **In-Memory Session Caching (Redis)**:
    *   *Decision*: specific `sessionId` keys with a 24-hour TTL (Time-To-Live).
    *   *Reason*: Ensures privacy and saves memory by automatically expiring old conversations.

4.  **Graceful Degrdation**:
    *   *Decision*: Specific handling for `429 Too Many Requests` from Gemini.
    *   *Reason*: AI APIs often rate-limit. Handling this gracefully improves User Experience significantly compared to a generic "Server Error".

---

## 4. Potential Improvements
1.  **Hybrid Search**: Combine Vector Search with Keyword Search (BM25) for better precision on specific entity names.
2.  **Streaming Responses**: Stream the AI response token-by-token to the frontend for a snappier feel.
3.  **Source Filters**: Allow users to select "Only show news from BBC" via metadata filtering in Qdrant.
