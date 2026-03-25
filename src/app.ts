import express, { type Request, type Response } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { readFileSync } from 'node:fs';

import { authRouter } from './routes/auth.routes.js';
import { meRouter } from './routes/me.routes.js';
import { doorRouter } from './routes/door.routes.js';

function readAppVersion(): string {
  try {
    const packageJsonPath = new URL('../package.json', import.meta.url);
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      version?: string;
    };
    return packageJson.version ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

const appVersion = readAppVersion();

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(
    pinoHttp({
      redact: ['req.headers.authorization'],
    }),
  );

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.get('/', (_req: Request, res: Response) => {
    res.json({ version: appVersion });
  });

  // Basic global limiter (tune per-route as needed)
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use('/auth', authRouter);
  app.use('/me', meRouter);
  app.use('/door', doorRouter);

  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'not_found', path: req.path });
  });

  return app;
}

