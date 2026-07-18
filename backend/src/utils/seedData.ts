import { env } from '../config/env';
import { Employee } from '../models/Employee';
import { Role, EmployeeStatus } from '../types';

const departments = ['Engineering', 'Human Resources', 'Sales', 'Marketing', 'Finance'];

const designations: Record<string, string[]> = {
  Engineering: ['Software Engineer', 'Senior Engineer', 'Engineering Manager', 'Tech Lead'],
  'Human Resources': ['HR Executive', 'HR Manager'],
  Sales: ['Sales Rep', 'Sales Manager'],
  Marketing: ['Marketing Associate', 'Marketing Manager'],
  Finance: ['Accountant', 'Finance Manager'],
};

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Populate the database with a Super Admin, an HR Manager, a few managers and
 * a set of employees wired into a reporting hierarchy.
 *
 * @param wipe when true, clears the employees collection first.
 */
export async function seedDatabase({ wipe = true }: { wipe?: boolean } = {}): Promise<number> {
  if (wipe) {
    await Employee.deleteMany({});
  }

  const passwordHash = await Employee.hashPassword(env.seed.password);

  // 1. Super Admin
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

  // 2. HR Manager reporting to admin
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

  // 3. A few managers reporting to admin
  const managers = [];
  for (let i = 0; i < 3; i++) {
    const dept = rand(departments);
    const mgr = await Employee.create({
      employeeId: `EMP${String(3 + i).padStart(4, '0')}`,
      name: `Manager ${i + 1}`,
      email: `manager${i + 1}@ems.com`,
      phone: `+1 555 02${i}0`,
      department: dept,
      designation: rand(designations[dept]),
      salary: 130000 + i * 5000,
      joiningDate: new Date(2021, i, 10),
      status: EmployeeStatus.ACTIVE,
      role: Role.EMPLOYEE,
      reportingManager: admin._id,
      passwordHash,
    });
    managers.push(mgr);
  }

  // 4. Regular employees reporting to random managers
  for (let i = 0; i < 20; i++) {
    const dept = rand(departments);
    const mgr = rand([...managers, hr]);
    await Employee.create({
      employeeId: `EMP${String(6 + i).padStart(4, '0')}`,
      name: `Employee ${i + 1}`,
      email: `employee${i + 1}@ems.com`,
      phone: `+1 555 1${String(i).padStart(3, '0')}`,
      department: dept,
      designation: rand(designations[dept]),
      salary: 60000 + Math.floor(Math.random() * 40000),
      joiningDate: new Date(2022, i % 12, (i % 27) + 1),
      status: Math.random() > 0.2 ? EmployeeStatus.ACTIVE : EmployeeStatus.INACTIVE,
      role: Role.EMPLOYEE,
      reportingManager: mgr._id,
      passwordHash,
    });
  }

  return Employee.countDocuments();
}

/** Seed only if the collection is empty (safe to call on every boot). */
export async function seedIfEmpty(): Promise<void> {
  const count = await Employee.countDocuments();
  if (count > 0) {
    // eslint-disable-next-line no-console
    console.log(`[seed] skipped — ${count} employees already exist`);
    return;
  }
  const total = await seedDatabase({ wipe: false });
  // eslint-disable-next-line no-console
  console.log(`[seed] bootstrapped empty database with ${total} employees`);
}
