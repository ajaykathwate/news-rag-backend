import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { chatHandler, getHistoryHandler, deleteSessionHandler } from './controllers/chatController';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Allow all for now
app.use(express.json());

// Routes
app.post('/api/chat', chatHandler);
app.get('/api/chat/:sessionId/history', getHistoryHandler);
app.delete('/api/chat/:sessionId', deleteSessionHandler);

// Health check
app.get('/health', (req, res) => {
  res.send('News RAG API is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
