import * as jwt from 'jsonwebtoken';
import { z } from 'zod';

let cachedEnv: { JWT_SECRET: string; JWT_EXPIRES_IN: string } | null = null;

function getJwtEnv() {
  if (cachedEnv) return cachedEnv;
  cachedEnv = z
    .object({
      JWT_SECRET: z.string().min(16),
      JWT_EXPIRES_IN: z.string().default('15m'),
    })
    .parse(process.env);
  return cachedEnv;
}

export type UserRole = 'member' | 'admin';

export type JwtClaims = {
  sub: string;
  role: UserRole;
  phone?: string;
  email?: string;
};

export function signAccessToken(claims: JwtClaims) {
  const env = getJwtEnv();
  return jwt.sign(claims, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): JwtClaims {
  const env = getJwtEnv();
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    algorithms: ['HS256'],
  });
  return decoded as JwtClaims;
}

