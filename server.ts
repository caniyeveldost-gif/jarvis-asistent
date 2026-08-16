import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import chatHandler from './api/chat.js';
import ttsHandler from './api/tts.js';
import healthHandler from './api/health.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Forward Express API routes to Vercel Serverless Function handlers
app.all('/api/chat', (req: Request, res: Response) => chatHandler(req, res));
app.all('/api/tts', (req: Request, res: Response) => ttsHandler(req, res));
app.all('/api/health', (req: Request, res: Response) => healthHandler(req, res));

// Server setup: Vite dev middleware vs static production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JARVIS Voice Assistant Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
