import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';
import { Chunk } from '../types';

dotenv.config();

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const COLLECTION_NAME = 'news_articles';
const VECTOR_SIZE = 768; // Jina v2 base size

const client = new QdrantClient({ url: QDRANT_URL });

export const initQdrant = async () => {
  try {
    const collections = await client.getCollections();
    const exists = collections.collections.some(
      (c) => c.name === COLLECTION_NAME
    );

    if (!exists) {
      await createCollection();
    } else {
      console.log(`Collection ${COLLECTION_NAME} already exists.`);
    }
  } catch (error) {
    console.error("Error initializing Qdrant:", error);
  }
};

export const resetCollection = async () => {
  try {
    console.log(`Deleting collection ${COLLECTION_NAME}...`);
    // Ignore error if collection doesn't exist
    try {
      await client.deleteCollection(COLLECTION_NAME);
    } catch (e) {
      /* ignore */
    }

    await createCollection();
  } catch (error) {
    console.error("Error resetting Qdrant collection:", error);
  }
};

const createCollection = async () => {
  await client.createCollection(COLLECTION_NAME, {
    vectors: {
      size: VECTOR_SIZE,
      distance: "Cosine",
    },
  });
  console.log(`Collection ${COLLECTION_NAME} created.`);
};

export const storeChunks = async (chunks: Chunk[]) => {
  if (chunks.length === 0) return;

  const points = chunks.map((chunk) => ({
    id: chunk.id,
    vector: chunk.vector!,
    payload: {
      ...chunk.metadata,
      text: chunk.text,
    },
  }));

  try {
    await client.upsert(COLLECTION_NAME, {
      points,
    });
    console.log(`Stored ${chunks.length} chunks in Qdrant.`);
  } catch (error) {
    console.error("Error storing chunks in Qdrant:", error);
  }
};

export const searchSimilar = async (
  queryVector: number[],
  limit: number = 3
) => {
  try {
    const results = await client.search(COLLECTION_NAME, {
      vector: queryVector,
      limit,
      with_payload: true,
    });
    return results;
  } catch (error) {
    console.error("Error searching Qdrant:", error);
    return [];
  }
};
export const getAllArticles = async () => {
  try {
    const result = await client.scroll(COLLECTION_NAME, {
      limit: 100,
      with_payload: true,
      with_vector: false,
    });

    // Dedup by title
    const seen = new Set();
    const unique: any[] = [];

    result.points.forEach((p) => {
      const title = p.payload?.title;
      if (!seen.has(title)) {
        seen.add(title);
        unique.push({
          title,
          source: p.payload?.source,
          snippet: (p.payload?.text as string)?.slice(0, 100),
        });
      }
    });

    return unique;
  } catch (error) {
    console.error("Error fetching articles:", error);
    return [];
  }
};
