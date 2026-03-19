import { Router, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { nukiLockAction } from '../nuki/nukiClient.js';

export const doorRouter = Router();

const doorLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

doorRouter.post('/open', doorLimiter, requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  const body = z
    .object({
      action: z.enum(['unlock', 'unlatch']).default('unlock'),
    })
    .default({})
    .parse(req.body);

  const result = await nukiLockAction(body.action);

  req.log?.info(
    { userId: req.auth?.sub, action: body.action, smartlockId: process.env.NUKI_SMARTLOCK_ID },
    'door_open_requested',
  );

  res.json({ ok: true, result });
});

