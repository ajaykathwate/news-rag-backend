import { Article, Chunk } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const cleanText = (text: string): string => {
  // Remove HTML tags
  let cleaned = text.replace(/<[^>]*>?/gm, '');
  // Remove excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
};

export const chunkArticle = (article: Article, chunkSize: number = 500): Chunk[] => {
  const cleanedContent = cleanText(article.content);
  const words = cleanedContent.split(' ');
  const chunks: Chunk[] = [];
  
  let currentChunkWords: string[] = [];
  let chunkIndex = 0;

  for (const word of words) {
    currentChunkWords.push(word);
    
    // deeply simplified token estimation (1 word ~= 1.3 tokens usually, but let's stick to word count for simplicity here)
    if (currentChunkWords.length >= chunkSize) {
      chunks.push({
        id: uuidv4(),
        text: currentChunkWords.join(' '),
        metadata: {
          articleId: uuidv4(), // In real app, hash url or something
          title: article.title,
          url: article.link,
          pubDate: article.pubDate,
          source: article.source,
          chunkIndex
        }
      });
      currentChunkWords = [];
      chunkIndex++;
    }
  }

  // Add remaining words
  if (currentChunkWords.length > 0) {
    chunks.push({
      id: uuidv4(),
      text: currentChunkWords.join(' '),
      metadata: {
        articleId: uuidv4(),
        title: article.title,
        url: article.link,
        pubDate: article.pubDate,
        source: article.source,
        chunkIndex
      }
    });
  }

  return chunks;
};
