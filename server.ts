import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { apiRouter } from './server/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Mount API routes
app.use('/api', apiRouter);

// Serve static frontend files from dist
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

// Fallback for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Gemini Image Bot server running on http://0.0.0.0:${PORT}`);
});
