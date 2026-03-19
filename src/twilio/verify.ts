import { z } from 'zod';
import Twilio from 'twilio';

type TwilioEnv = {
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_VERIFY_SERVICE_SID: string;
};

let twilioEnv: TwilioEnv | null = null;
let client: ReturnType<typeof Twilio> | null = null;

function getTwilioEnv() {
  if (twilioEnv) return twilioEnv;
  twilioEnv = z
    .object({
      TWILIO_ACCOUNT_SID: z.string().min(1),
      TWILIO_AUTH_TOKEN: z.string().min(1),
      TWILIO_VERIFY_SERVICE_SID: z.string().min(1),
    })
    .parse(process.env);
  return twilioEnv;
}

function getClient() {
  if (client) return client;
  const env = getTwilioEnv();
  client = Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  return client;
}

export async function startPhoneVerification(phone: string) {
  const env = getTwilioEnv();
  const c = getClient();
  return c.verify.v2
    .services(env.TWILIO_VERIFY_SERVICE_SID)
    .verifications.create({ to: phone, channel: 'sms' });
}

export async function checkPhoneVerification(phone: string, code: string) {
  const env = getTwilioEnv();
  const c = getClient();
  return c.verify.v2
    .services(env.TWILIO_VERIFY_SERVICE_SID)
    .verificationChecks.create({ to: phone, code });
}

