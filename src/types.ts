export interface Article {
  title: string;
  link: string;
  content: string;
  pubDate?: string;
  source?: string;
}

export interface Chunk {
  id: string; // UUID
  text: string;
  metadata: {
    articleId: string;
    title: string;
    url: string;
    pubDate?: string;
    source?: string;
    chunkIndex: number;
  };
  vector?: number[];
}
