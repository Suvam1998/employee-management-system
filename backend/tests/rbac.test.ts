import request from 'supertest';
import { createApp } from '../src/app';
import { createUser } from './helpers';
import { Role } from '../src/types';

const app = createApp();

async function tokenFor(role: Role) {
  const user = await createUser(role);
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: 'Password@123' });
  return { token: res.body.token as string, user };
}

describe('RBAC', () => {
  it('lets HR create an employee', async () => {
    const { token } = await tokenFor(Role.HR);
    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'New Person',
        email: 'new.person@ems.com',
        phone: '+1 555 1234',
        department: 'Sales',
        designation: 'Rep',
        salary: 40000,
        joiningDate: '2023-01-01',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.employeeId).toMatch(/^EMP/);
  });

  it('forbids HR from assigning Super Admin role', async () => {
    const { token } = await tokenFor(Role.HR);
    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Sneaky',
        email: 'sneaky@ems.com',
        phone: '+1 555 1234',
        department: 'Sales',
        designation: 'Rep',
        salary: 40000,
        joiningDate: '2023-01-01',
        role: Role.SUPER_ADMIN,
      });
    expect(res.status).toBe(403);
  });

  it('forbids HR from deleting an employee', async () => {
    const { token } = await tokenFor(Role.HR);
    const victim = await createUser(Role.EMPLOYEE);
    const res = await request(app)
      .delete(`/api/employees/${victim._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('allows Super Admin to delete an employee', async () => {
    const { token } = await tokenFor(Role.SUPER_ADMIN);
    const victim = await createUser(Role.EMPLOYEE);
    const res = await request(app)
      .delete(`/api/employees/${victim._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('forbids Employee from listing all employees', async () => {
    const { token } = await tokenFor(Role.EMPLOYEE);
    const res = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('lets Employee view only their own profile', async () => {
    const { token, user } = await tokenFor(Role.EMPLOYEE);
    const other = await createUser(Role.EMPLOYEE);

    const own = await request(app)
      .get(`/api/employees/${user._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(own.status).toBe(200);

    const foreign = await request(app)
      .get(`/api/employees/${other._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(foreign.status).toBe(403);
  });

  it('restricts Employee self-edit to allowed fields only', async () => {
    const { token, user } = await tokenFor(Role.EMPLOYEE);
    const res = await request(app)
      .put(`/api/employees/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Renamed', salary: 999999, role: Role.SUPER_ADMIN });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Renamed');
    expect(res.body.data.salary).toBe(50000); // unchanged
    expect(res.body.data.role).toBe(Role.EMPLOYEE); // unchanged
  });
});
