import { Request, Response } from 'express';
import { getEmbeddings } from '../services/jinaService';
import { searchSimilar } from '../services/qdrantService';
import { generateAnswer } from '../services/geminiService';
import { addMessageToHistory, getSessionHistory, clearSessionHistory, ChatMessage } from '../services/redisService';

export const chatHandler = async (req: Request, res: Response): Promise<void> => {
  const { sessionId, message } = req.body;

  if (!sessionId || !message) {
    res.status(400).json({ error: 'sessionId and message are required' });
    return;
  }

  try {
    // 1. Add User Message to History
    const userMsg: ChatMessage = { role: 'user', content: message, timestamp: Date.now() };
    await addMessageToHistory(sessionId, userMsg);

    // 2. Embed Query
    const [queryVector] = await getEmbeddings([message]);

    // 3. Search Context
    const searchResults = await searchSimilar(queryVector, 3);
    const context = searchResults.map(r => r.payload?.text).join('\n\n');
    const references = searchResults.map(r => ({
      title: r.payload?.title,
      url: r.payload?.url,
      source: r.payload?.source
    }));

    // 4. Build Prompt
    // Fetch recent history for context (optional, let's keep it simple or take last 2 messages)
    const history = await getSessionHistory(sessionId);
    // Construct a context-aware prompt
    const systemPrompt = `You are a helpful news assistant. 
    
    Rules:
    1. If the user asks a general question (e.g., "Hi", "Who are you?", "How can you help?"), answer politely describing yourself as a News RAG bot.
    2. For specific questions, answer based ONLY on the provided context below.
    3. If the answer is not in the context, say "I couldn't find relevant news about that in my database."
    
    Context:
    ${context}
    
    User Query: ${message}
    `;

    // 5. Generate Answer
    const answer = await generateAnswer(systemPrompt);

    // 6. Save Bot Answer
    const botMsg: ChatMessage = { role: 'bot', content: answer, timestamp: Date.now() };
    await addMessageToHistory(sessionId, botMsg);

    res.json({ reply: answer, references });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
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
