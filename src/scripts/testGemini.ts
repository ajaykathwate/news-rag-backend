
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('SERVER ERROR: GEMINI_API_KEY is not set in .env file');
  process.exit(1);
}

const listModels = async () => {
    console.log('Listing available models...');
    try {
        // The SDK doesn't have a direct listModels method on the client instance easily exposed in all versions, 
        // but typically it's under the model manager or confirmed via a direct fetch if SDK fails.
        // However, the node SDK usually exposes it via `getGenerativeModel`? No.
        // Actually the SDK might not expose listModels directly in the main `GoogleGenerativeAI` class in older versions,
        // but let's check if we can just try a generic one or use `axios` if needed.
        // Wait, the SDK definitely supports it. Let's try `genAI.getGenerativeModel` isn't for listing.
        
        // Let's use fetch directly to list models to be 100% sure without SDK wrapper issues.
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.models) {
            console.log('Available Models:');
            data.models.forEach((m: any) => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(`- ${m.name}`);
                }
            });
        } else {
            console.log('No models found or error:', data);
        }

    } catch (error) {
        console.error('Error listing models:', error);
    }
}

listModels();
