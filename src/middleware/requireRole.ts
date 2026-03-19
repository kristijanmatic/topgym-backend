import { type NextFunction, type Request, type Response } from 'express';
import { type UserRole } from '../auth/jwt.js';

export function requireRole(...allowed: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.auth?.role;
    if (!role) return res.status(401).json({ error: 'unauthorized' });
    if (!allowed.includes(role)) return res.status(403).json({ error: 'forbidden' });
    return next();
  };
}

