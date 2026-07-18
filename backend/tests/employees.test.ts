import request from 'supertest';
import { createApp } from '../src/app';
import { createUser } from './helpers';
import { Role, EmployeeStatus } from '../src/types';

const app = createApp();

async function adminToken() {
  const user = await createUser(Role.SUPER_ADMIN);
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: 'Password@123' });
  return res.body.token as string;
}

describe('Employee CRUD, search, filter, sort, pagination', () => {
  it('rejects invalid payload with 400 and field details', async () => {
    const token = await adminToken();
    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'A', email: 'bad', phone: '1', salary: -5, department: '', designation: '' });
    expect(res.status).toBe(400);
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  it('soft-deletes so the record disappears from listings', async () => {
    const token = await adminToken();
    const victim = await createUser(Role.EMPLOYEE, { name: 'DeleteMe' });
    await request(app)
      .delete(`/api/employees/${victim._id}`)
      .set('Authorization', `Bearer ${token}`);

    const list = await request(app)
      .get('/api/employees?search=DeleteMe')
      .set('Authorization', `Bearer ${token}`);
    expect(list.body.data).toHaveLength(0);
  });

  it('searches by name and email', async () => {
    const token = await adminToken();
    await createUser(Role.EMPLOYEE, { name: 'Alice Wonderland', email: 'alice@ems.com' });
    await createUser(Role.EMPLOYEE, { name: 'Bob Builder', email: 'bob@ems.com' });

    const res = await request(app)
      .get('/api/employees?search=alice')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Alice Wonderland');
  });

  it('filters by status and department', async () => {
    const token = await adminToken();
    await createUser(Role.EMPLOYEE, { department: 'Finance', status: EmployeeStatus.INACTIVE });
    await createUser(Role.EMPLOYEE, { department: 'Sales', status: EmployeeStatus.ACTIVE });

    const res = await request(app)
      .get('/api/employees?department=Finance&status=inactive')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.data.every((e: { department: string }) => e.department === 'Finance')).toBe(true);
  });

  it('sorts by name ascending', async () => {
    const token = await adminToken();
    await createUser(Role.EMPLOYEE, { name: 'Zoe' });
    await createUser(Role.EMPLOYEE, { name: 'Aaron' });

    const res = await request(app)
      .get('/api/employees?sortBy=name&order=asc')
      .set('Authorization', `Bearer ${token}`);
    const names = res.body.data.map((e: { name: string }) => e.name);
    const sorted = [...names].sort();
    expect(names).toEqual(sorted);
  });

  it('paginates results', async () => {
    const token = await adminToken();
    for (let i = 0; i < 5; i++) await createUser(Role.EMPLOYEE);
    const res = await request(app)
      .get('/api/employees?page=1&limit=2')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.totalPages).toBeGreaterThanOrEqual(3);
  });

  it('reports dashboard stats', async () => {
    const token = await adminToken();
    await createUser(Role.EMPLOYEE, { department: 'Finance', status: EmployeeStatus.INACTIVE });
    await createUser(Role.EMPLOYEE, { department: 'Sales', status: EmployeeStatus.ACTIVE });

    const res = await request(app)
      .get('/api/employees/stats')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.totalEmployees).toBeGreaterThanOrEqual(3);
    expect(res.body.data.departmentCount).toBeGreaterThanOrEqual(2);
  });
});
