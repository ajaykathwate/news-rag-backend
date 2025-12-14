import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const SESSION_TTL = 86400; // 24 hours in seconds

export interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  timestamp: number;
}

export const addMessageToHistory = async (sessionId: string, message: ChatMessage) => {
  const key = `chat:${sessionId}`;
  await redis.rpush(key, JSON.stringify(message));
  await redis.expire(key, SESSION_TTL);
};

export const getSessionHistory = async (sessionId: string): Promise<ChatMessage[]> => {
  const key = `chat:${sessionId}`;
  const rawMessages = await redis.lrange(key, 0, -1);
  return rawMessages.map(msg => JSON.parse(msg));
};

export const clearSessionHistory = async (sessionId: string) => {
  const key = `chat:${sessionId}`;
  await redis.del(key);
};
