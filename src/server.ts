import 'dotenv/config';

import { z } from 'zod';
import { createApp } from './app.js';

const env = z
  .object({
    PORT: z.coerce.number().int().positive().default(3000),
    NODE_ENV: z.string().default('development'),
  })
  .parse(process.env);

const app = createApp();

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Listening on :${env.PORT}`);
});

