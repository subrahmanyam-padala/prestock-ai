import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config';
import { HttpError } from './errors';
import { router } from './routes';

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json({ limit: '50kb' }));

const limiter = (limit: number) => rateLimit({ windowMs: 60_000, limit, standardHeaders: true, legacyHeaders: false });
app.use('/api', limiter(120));
app.use('/api/ai', limiter(10));
app.use('/api', router);
app.use('/api', (_req, res) => res.status(404).json({ error: { message: 'Not found', code: 'not_found' } }));

// In production the built React app is served from the same process.
const dist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { message: err.message, code: err.code } });
    return;
  }
  if ((err as { type?: string }).type === 'entity.parse.failed') {
    res.status(400).json({ error: { message: 'Invalid JSON body', code: 'bad_request' } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { message: 'Something went wrong on the server', code: 'internal_error' } });
});

app.listen(config.port, () => {
  console.log(`PreStock AI server listening on http://localhost:${config.port}`);
  if (!config.geminiKey) console.warn('GEMINI_API_KEY is not set: AI analysis will return 503.');
});
