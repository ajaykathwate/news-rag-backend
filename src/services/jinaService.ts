import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const JINA_API_KEY = process.env.JINA_API_KEY;
const JINA_API_URL = 'https://api.jina.ai/v1/embeddings';

export const getEmbeddings = async (texts: string[]): Promise<number[][]> => {
  if (!JINA_API_KEY) {
    throw new Error('JINA_API_KEY is not set');
  }

  try {
    const response = await axios.post(
      JINA_API_URL,
      {
        model: 'jina-embeddings-v2-base-en',
        input: texts
      },
      {
        headers: {
          'Authorization': `Bearer ${JINA_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.data.map((item: any) => item.embedding);
  } catch (error) {
    console.error('Error fetching embeddings from Jina:', error);
    throw error;
  }
};
