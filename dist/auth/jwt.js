import * as jwt from 'jsonwebtoken';
import { z } from 'zod';
let cachedEnv = null;
function getJwtEnv() {
    if (cachedEnv)
        return cachedEnv;
    cachedEnv = z
        .object({
        JWT_SECRET: z.string().min(16),
        JWT_EXPIRES_IN: z.string().default('15m'),
    })
        .parse(process.env);
    return cachedEnv;
}
export function signAccessToken(claims) {
    const env = getJwtEnv();
    return jwt.sign(claims, env.JWT_SECRET, {
        algorithm: 'HS256',
        expiresIn: env.JWT_EXPIRES_IN,
    });
}
export function verifyAccessToken(token) {
    const env = getJwtEnv();
    const decoded = jwt.verify(token, env.JWT_SECRET, {
        algorithms: ['HS256'],
    });
    return decoded;
}
