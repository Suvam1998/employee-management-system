import { connectDB, disconnectDB } from '../config/db';
import { env } from '../config/env';
import { seedDatabase } from './seedData';

async function run(): Promise<void> {
  await connectDB();
  // eslint-disable-next-line no-console
  console.log('[seed] clearing + seeding employees collection...');
  const total = await seedDatabase({ wipe: true });
  // eslint-disable-next-line no-console
  console.log(`[seed] done. ${total} employees created.`);
  console.log(`[seed] Super Admin: ${env.seed.email} / ${env.seed.password}`);
  console.log(`[seed] HR Manager:  hr@ems.com / ${env.seed.password}`);
  console.log(`[seed] Employee:    employee1@ems.com / ${env.seed.password}`);
  await disconnectDB();
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[seed] failed', err);
  process.exit(1);
});
