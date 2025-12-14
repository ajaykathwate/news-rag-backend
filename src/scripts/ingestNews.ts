import { fetchRssFeed } from '../services/rssService';
import { chunkArticle } from '../services/textService';
import { getEmbeddings } from '../services/jinaService';
import { resetCollection, storeChunks } from "../services/qdrantService";
import { Chunk } from "../types";

const FEEDS = [
  {
    url: "http://feeds.bbci.co.uk/news/technology/rss.xml",
    source: "BBC Technology",
  },
  { url: "http://feeds.bbci.co.uk/news/world/rss.xml", source: "BBC World" },
  { url: "https://techcrunch.com/feed/", source: "TechCrunch" },
];

const main = async () => {
  console.log("Starting ingestion...");

  // 1. Reset Vector DB (Clean old/bad data)
  await resetCollection();

  let allChunks: Chunk[] = [];

  // 2. Fetch and Chunk Articles
  for (const feed of FEEDS) {
    console.log(`Fetching ${feed.source}...`);
    const articles = await fetchRssFeed(feed.url, feed.source);
    console.log(`Fetched ${articles.length} articles from ${feed.source}`);

    for (const article of articles) {
      const chunks = chunkArticle(article);
      allChunks = [...allChunks, ...chunks];
    }
  }

  console.log(`Total chunks created: ${allChunks.length}`);

  // 3. Embed and Store
  // Process in batches to respect API limits (e.g. 20 chunks at a time)
  const BATCH_SIZE = 20;

  for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
    const batch = allChunks.slice(i, i + BATCH_SIZE);
    const texts = batch.map((c) => c.text);

    console.log(`Embedding batch ${i / BATCH_SIZE + 1}...`);
    try {
      const vectors = await getEmbeddings(texts);

      // Assign vectors to chunks
      batch.forEach((chunk, idx) => {
        chunk.vector = vectors[idx];
      });

      await storeChunks(batch);
    } catch (err) {
      console.error(`Failed to file batch starting index ${i}`, err);
    }

    // Simple rate limiting delay
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log("Ingestion complete!");
  process.exit(0);
};

main();
