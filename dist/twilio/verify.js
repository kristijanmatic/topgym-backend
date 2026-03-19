import { z } from 'zod';
import Twilio from 'twilio';
let twilioEnv = null;
let client = null;
function getTwilioEnv() {
    if (twilioEnv)
        return twilioEnv;
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
    if (client)
        return client;
    const env = getTwilioEnv();
    client = Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    return client;
}
export async function startPhoneVerification(phone) {
    const env = getTwilioEnv();
    const c = getClient();
    return c.verify.v2
        .services(env.TWILIO_VERIFY_SERVICE_SID)
        .verifications.create({ to: phone, channel: 'sms' });
}
export async function checkPhoneVerification(phone, code) {
    const env = getTwilioEnv();
    const c = getClient();
    return c.verify.v2
        .services(env.TWILIO_VERIFY_SERVICE_SID)
        .verificationChecks.create({ to: phone, code });
}
