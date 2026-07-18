/**
 * Zero-setup dev entrypoint: boots an in-memory MongoDB, seeds it, and starts
 * the API. Useful when you don't have Docker or a local/Atlas Mongo handy.
 *
 *   npm run dev:mem
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { env } from '../config/env';
import { Employee } from '../models/Employee';
import { Role, EmployeeStatus } from '../types';

async function seedMinimal(): Promise<void> {
  const passwordHash = await Employee.hashPassword(env.seed.password);
  const admin = await Employee.create({
    employeeId: 'EMP0001',
    name: env.seed.name,
    email: env.seed.email,
    phone: '+1 555 0100',
    department: 'Human Resources',
    designation: 'Administrator',
    salary: 200000,
    joiningDate: new Date('2020-01-01'),
    status: EmployeeStatus.ACTIVE,
    role: Role.SUPER_ADMIN,
    passwordHash,
  });
  const hr = await Employee.create({
    employeeId: 'EMP0002',
    name: 'Hannah Reyes',
    email: 'hr@ems.com',
    phone: '+1 555 0101',
    department: 'Human Resources',
    designation: 'HR Manager',
    salary: 120000,
    joiningDate: new Date('2021-03-15'),
    status: EmployeeStatus.ACTIVE,
    role: Role.HR,
    reportingManager: admin._id,
    passwordHash,
  });
  for (let i = 0; i < 12; i++) {
    await Employee.create({
      employeeId: `EMP${String(3 + i).padStart(4, '0')}`,
      name: `Employee ${i + 1}`,
      email: `employee${i + 1}@ems.com`,
      phone: `+1 555 1${String(i).padStart(3, '0')}`,
      department: ['Engineering', 'Sales', 'Finance', 'Marketing'][i % 4],
      designation: 'Associate',
      salary: 60000 + i * 1000,
      joiningDate: new Date(2022, i % 12, (i % 27) + 1),
      status: i % 5 === 0 ? EmployeeStatus.INACTIVE : EmployeeStatus.ACTIVE,
      role: Role.EMPLOYEE,
      reportingManager: hr._id,
      passwordHash,
    });
  }
}

async function main(): Promise<void> {
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  // eslint-disable-next-line no-console
  console.log('[dev:mem] in-memory MongoDB started');
  await seedMinimal();
  // eslint-disable-next-line no-console
  console.log('[dev:mem] seeded. Super Admin:', env.seed.email, '/', env.seed.password);

  const app = createApp();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[dev:mem] EMS API on http://localhost:${env.port}`);
  });

  const shutdown = async () => {
    await mongoose.disconnect();
    await mongo.stop();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[dev:mem] failed', err);
  process.exit(1);
});
