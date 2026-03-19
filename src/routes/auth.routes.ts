import { Router, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';

import { signAccessToken } from '../auth/jwt.js';
import { authenticateWithEmailPassword, findOrCreateUserByPhone } from '../services/users.service.js';
import { checkPhoneVerification, startPhoneVerification } from '../twilio/verify.js';
import { getAdminPb } from '../pb/client.js';
import { sha256Hex } from '../utils/crypto.js';
import { z } from 'zod';

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post('/login', loginLimiter, async (req: Request, res: Response) => {
  const body = z
    .object({
      email: z.string().email(),
      password: z.string().min(1),
    })
    .parse(req.body);

  const user = await authenticateWithEmailPassword(body.email, body.password);
  const token = signAccessToken({
    sub: user.id,
    role: user.role ?? 'member',
    email: user.email,
    phone: user.phone,
  });

  res.json({ token, user });
});

authRouter.post('/phone/request', loginLimiter, async (req: Request, res: Response) => {
  const body = z.object({ phone: z.string().min(6) }).parse(req.body);

  // Twilio Verify holds OTP state; PocketBase remains source of truth for users.
  await startPhoneVerification(body.phone);
  res.json({ ok: true });
});

authRouter.post('/phone/verify', loginLimiter, async (req: Request, res: Response) => {
  const body = z.object({ phone: z.string().min(6), code: z.string().min(3) }).parse(req.body);

  const result = await checkPhoneVerification(body.phone, body.code);
  if (result.status !== 'approved') {
    return res.status(401).json({ error: 'invalid_code' });
  }

  const user = await findOrCreateUserByPhone(body.phone);
  const token = signAccessToken({
    sub: user.id,
    role: user.role ?? 'member',
    phone: user.phone,
    email: user.email,
  });

  res.json({ token, user });
});

authRouter.post('/reception/verify', loginLimiter, async (req: Request, res: Response) => {
  const body = z.object({ code: z.string().min(4) }).parse(req.body);
  const codeHash = sha256Hex(body.code.trim());

  const pb = await getAdminPb();
  const codesCollection = process.env.PB_RECEPTION_CODES_COLLECTION ?? 'reception_codes';

  const record: any = await pb
    .collection(codesCollection)
    .getFirstListItem(`codeHash="${codeHash}"`);

  const usedAt = record.usedAt ?? record.used_at;
  if (usedAt) return res.status(401).json({ error: 'code_used' });

  const expiresAtRaw = record.expiresAt ?? record.expires_at;
  if (expiresAtRaw) {
    const exp = new Date(expiresAtRaw).getTime();
    if (Number.isFinite(exp) && Date.now() > exp) return res.status(401).json({ error: 'code_expired' });
  }

  const phone = (record.phone as string | undefined) ?? undefined;
  const userId = (record.user as string | undefined) ?? (record.userId as string | undefined);
  if (!phone && !userId) return res.status(400).json({ error: 'code_not_bound' });

  let user;
  if (phone) user = await findOrCreateUserByPhone(phone);
  else user = { id: userId!, role: 'member' as const };

  await pb.collection(codesCollection).update(record.id, { usedAt: new Date().toISOString() });

  const token = signAccessToken({
    sub: user.id,
    role: (user as any).role ?? 'member',
    phone: (user as any).phone,
    email: (user as any).email,
  });

  res.json({ token, user });
});

