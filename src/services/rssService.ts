import Parser from 'rss-parser';
import { Article } from '../types';

const parser = new Parser();

export const fetchRssFeed = async (url: string, sourceName: string): Promise<Article[]> => {
  try {
    const feed = await parser.parseURL(url);
    return feed.items.map(item => ({
      title: item.title || 'No Title',
      link: item.link || '',
      content: item.contentSnippet || item.content || '',
      pubDate: item.pubDate,
      source: sourceName
    }));
  } catch (error) {
    console.error(`Error fetching RSS feed from ${url}:`, error);
    return [];
  }
};
