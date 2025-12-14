import { Request, Response } from 'express';
import { getEmbeddings } from '../services/jinaService';
import { searchSimilar } from '../services/qdrantService';
import { generateAnswer } from '../services/geminiService';
import { addMessageToHistory, getSessionHistory, clearSessionHistory, ChatMessage } from '../services/redisService';
import { getAllArticles } from "../services/qdrantService";

export const chatHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { sessionId, message } = req.body;

  if (!sessionId || !message) {
    res.status(400).json({ error: "sessionId and message are required" });
    return;
  }

  try {
    // 1. Add User Message to History
    const userMsg: ChatMessage = {
      role: "user",
      content: message,
      timestamp: Date.now(),
    };
    await addMessageToHistory(sessionId, userMsg);

    // 2. Embed Query
    const [queryVector] = await getEmbeddings([message]);

    // 3. Search Context
    const searchResults = await searchSimilar(queryVector, 5); // Increased limit to 5

    console.log("--- DEBUG: Search Results ---");
    searchResults.forEach((r, i) => {
      console.log(`[${i}] Score: ${r.score}, Title: ${r.payload?.title}`);
      console.log(
        `Content Preview: ${(r.payload?.text as string)?.slice(0, 100)}...`
      );
    });

    const context = searchResults.map((r) => r.payload?.text).join("\n\n");
    console.log("--- DEBUG: Final Context ---");
    console.log(context);

    const references = searchResults.map((r) => ({
      title: r.payload?.title,
      url: r.payload?.url,
      source: r.payload?.source,
    }));

    // 4. Build Prompt
    // Fetch recent history for context (optional, let's keep it simple or take last 2 messages)
    const history = await getSessionHistory(sessionId);
    // Construct a context-aware prompt
    const systemPrompt = `You are an expert news analyst. Your goal is to provide **concise, direct, and crisp** answers based on the provided news context.

    Guidelines:
    1. **Length**: Keep answers short (max 2-3 sentences). Get straight to the point.
    2. **Style**: Professional and journalistic, but efficient. Do not ramble.
    3. **Source**: Answer based ONLY on the provided context below.
    4. **Tone**: State facts directly. Do not simply list article titles unless asked.
    5. **Follow-up**: If the topic is complex, summarize the main point and ask if the user wants more details.
    6. **Missing Info**: If the answer is not in the context, say: "I don't have information on that specific topic right now."

    Context Articles:
    ${context}
    
    User Query: ${message}
    `;

    // 5. Generate Answer
    console.log("--- DEBUG: Full System Prompt ---");
    console.log(systemPrompt);
    const answer = await generateAnswer(systemPrompt);

    // 6. Save Bot Answer
    const botMsg: ChatMessage = {
      role: "bot",
      content: answer,
      timestamp: Date.now(),
    };
    await addMessageToHistory(sessionId, botMsg);

    res.json({ reply: answer, references });
  } catch (error: any) {
    console.error("Chat error:", error);

    if (error.message === "RATE_LIMIT") {
      const limitMsg =
        "You have exceeded the API limit. Please wait for a moment and try again.";
      // Optionally save this system message to history or just return it ephemeral
      res.json({ reply: limitMsg, references: [] });
      return;
    }

    res.status(500).json({ error: "Internal server error" });
  }
};

export const getHistoryHandler = async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const history = await getSessionHistory(sessionId);
  res.json({ history });
};

export const deleteSessionHandler = async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  await clearSessionHistory(sessionId);
  res.sendStatus(204);
};

export const getArticlesHandler = async (req: Request, res: Response) => {
  const articles = await getAllArticles();
  res.json({ count: articles.length, articles });
};
