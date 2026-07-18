import { Employee } from '../src/models/Employee';
import { Role, EmployeeStatus } from '../src/types';

export async function createUser(
  role: Role,
  overrides: Partial<Record<string, unknown>> = {},
) {
  const passwordHash = await Employee.hashPassword('Password@123');
  const suffix = Math.random().toString(36).slice(2, 8);
  return Employee.create({
    employeeId: `EMP-${suffix}`,
    name: `${role} ${suffix}`,
    email: `${role}.${suffix}@ems.com`,
    phone: '+1 555 0000',
    department: 'Engineering',
    designation: 'Engineer',
    salary: 50000,
    joiningDate: new Date('2022-01-01'),
    status: EmployeeStatus.ACTIVE,
    role,
    passwordHash,
    ...overrides,
  });
}
