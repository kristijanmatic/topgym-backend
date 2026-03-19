import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { getUserById } from '../services/users.service.js';

export const meRouter = Router();

meRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  const user = await getUserById(req.auth!.sub);
  res.json({ user });
});

