import { createApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { seedIfEmpty } from './utils/seedData';

async function bootstrap(): Promise<void> {
  await connectDB();
  if (env.seedOnStart) {
    await seedIfEmpty();
  }
  const app = createApp();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] EMS API listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[server] failed to start', err);
  process.exit(1);
});
