import { verifyAccessToken } from '../auth/jwt.js';
export function requireAuth(req, res, next) {
    const header = req.header('authorization');
    if (!header?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'unauthorized' });
    }
    const token = header.slice('Bearer '.length).trim();
    try {
        req.auth = verifyAccessToken(token);
        return next();
    }
    catch {
        return res.status(401).json({ error: 'unauthorized' });
    }
}
