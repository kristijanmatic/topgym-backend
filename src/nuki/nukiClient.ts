import { z } from 'zod';

type NukiEnv = {
  NUKI_API_TOKEN: string;
  NUKI_SMARTLOCK_ID: number;
};

let nukiEnv: NukiEnv | null = null;

function getNukiEnv() {
  if (nukiEnv) return nukiEnv;
  nukiEnv = z
    .object({
      NUKI_API_TOKEN: z.string().min(1),
      NUKI_SMARTLOCK_ID: z.coerce.number().int().positive(),
    })
    .parse(process.env);
  return nukiEnv;
}

type NukiAction = 'unlock' | 'unlatch';

export async function nukiLockAction(action: NukiAction) {
  const env = getNukiEnv();
  // Nuki Web API base. Action endpoint expects a lockAction in body.
  const res = await fetch(`https://api.nuki.io/smartlock/${env.NUKI_SMARTLOCK_ID}/action`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.NUKI_API_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ action }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Nuki API error ${res.status}: ${text}`);
  }

  return res.json().catch(() => ({}));
}

