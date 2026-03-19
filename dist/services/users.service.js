import { z } from 'zod';
import { getAdminPb } from '../pb/client.js';
const usersEnv = z
    .object({
    PB_USERS_COLLECTION: z.string().default('users'),
})
    .parse(process.env);
export async function authenticateWithEmailPassword(email, password) {
    const pb = await getAdminPb();
    // Assumption: users live in PB collection `users` and can auth with password.
    // We use PB collection auth to validate password, then fetch record for role.
    const auth = await pb.collection(usersEnv.PB_USERS_COLLECTION).authWithPassword(email, password);
    const record = auth.record;
    return {
        id: record.id,
        email: record.email,
        phone: record.phone,
        role: record.role ?? 'member',
    };
}
export async function findOrCreateUserByPhone(phone) {
    const pb = await getAdminPb();
    const col = pb.collection(usersEnv.PB_USERS_COLLECTION);
    try {
        const record = await col.getFirstListItem(`phone="${phone}"`);
        return {
            id: record.id,
            email: record.email,
            phone: record.phone,
            role: record.role ?? 'member',
        };
    }
    catch {
        const created = await col.create({ phone, role: 'member' });
        return {
            id: created.id,
            email: created.email,
            phone: created.phone,
            role: created.role ?? 'member',
        };
    }
}
export async function getUserById(id) {
    const pb = await getAdminPb();
    const record = await pb.collection(usersEnv.PB_USERS_COLLECTION).getOne(id);
    return {
        id: record.id,
        email: record.email,
        phone: record.phone,
        role: record.role ?? 'member',
    };
}
