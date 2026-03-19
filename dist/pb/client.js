import PocketBase from 'pocketbase';
import { z } from 'zod';
let cached = null;
let lastAuthAt = 0;
let pbEnv = null;
function getPbEnv() {
    if (pbEnv)
        return pbEnv;
    pbEnv = z
        .object({
        POCKETBASE_URL: z.string().url(),
        POCKETBASE_ADMIN_EMAIL: z.string().email(),
        POCKETBASE_ADMIN_PASSWORD: z.string().min(1),
    })
        .parse(process.env);
    return pbEnv;
}
export async function getAdminPb() {
    if (!cached) {
        const env = getPbEnv();
        cached = new PocketBase(env.POCKETBASE_URL);
    }
    // PocketBase admin auth is cookie/token based; refresh periodically.
    const now = Date.now();
    const maxAgeMs = 10 * 60_000;
    if (!cached.authStore.isValid || now - lastAuthAt > maxAgeMs) {
        const env = getPbEnv();
        await cached.admins.authWithPassword(env.POCKETBASE_ADMIN_EMAIL, env.POCKETBASE_ADMIN_PASSWORD);
        lastAuthAt = now;
    }
    return cached;
}
