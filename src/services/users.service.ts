import { z } from 'zod';
import { getAdminPb } from '../pb/client.js';
import type { UserRole } from '../auth/jwt.js';

const usersEnv = z
  .object({
    PB_USERS_COLLECTION: z.string().default('users'),
  })
  .parse(process.env);

export type PbUser = {
  id: string;
  email?: string;
  phone?: string;
  role?: UserRole;
};

export async function authenticateWithEmailPassword(email: string, password: string): Promise<PbUser> {
  const pb = await getAdminPb();

  // Assumption: users live in PB collection `users` and can auth with password.
  // We use PB collection auth to validate password, then fetch record for role.
  const auth = await pb.collection(usersEnv.PB_USERS_COLLECTION).authWithPassword(email, password);
  const record = auth.record as any;

  return {
    id: record.id,
    email: record.email,
    phone: record.phone,
    role: (record.role as UserRole | undefined) ?? 'member',
  };
}

export async function findOrCreateUserByPhone(phone: string): Promise<PbUser> {
  const pb = await getAdminPb();
  const col = pb.collection(usersEnv.PB_USERS_COLLECTION);

  try {
    const record: any = await col.getFirstListItem(`phone="${phone}"`);
    return {
      id: record.id,
      email: record.email,
      phone: record.phone,
      role: (record.role as UserRole | undefined) ?? 'member',
    };
  } catch {
    const created: any = await col.create({ phone, role: 'member' });
    return {
      id: created.id,
      email: created.email,
      phone: created.phone,
      role: (created.role as UserRole | undefined) ?? 'member',
    };
  }
}

export async function getUserById(id: string): Promise<PbUser> {
  const pb = await getAdminPb();
  const record: any = await pb.collection(usersEnv.PB_USERS_COLLECTION).getOne(id);
  return {
    id: record.id,
    email: record.email,
    phone: record.phone,
    role: (record.role as UserRole | undefined) ?? 'member',
  };
}

