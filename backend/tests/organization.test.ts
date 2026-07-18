import request from 'supertest';
import { createApp } from '../src/app';
import { createUser } from './helpers';
import { Role } from '../src/types';
import { wouldCreateCycle } from '../src/utils/hierarchy';

const app = createApp();

async function adminToken() {
  const user = await createUser(Role.SUPER_ADMIN);
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: 'Password@123' });
  return res.body.token as string;
}

describe('Organization hierarchy', () => {
  it('assigns a reporting manager via PATCH', async () => {
    const token = await adminToken();
    const manager = await createUser(Role.EMPLOYEE);
    const report = await createUser(Role.EMPLOYEE);

    const res = await request(app)
      .patch(`/api/employees/${report._id}/manager`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reportingManager: manager._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.data.reportingManager._id).toBe(manager._id.toString());
  });

  it('prevents direct self-reporting', async () => {
    const token = await adminToken();
    const emp = await createUser(Role.EMPLOYEE);
    const res = await request(app)
      .patch(`/api/employees/${emp._id}/manager`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reportingManager: emp._id.toString() });
    expect(res.status).toBe(400);
  });

  it('prevents a deeper circular reporting chain', async () => {
    const token = await adminToken();
    // a -> b -> c chain, then try to make a report to c
    const a = await createUser(Role.EMPLOYEE);
    const b = await createUser(Role.EMPLOYEE, { reportingManager: a._id });
    const c = await createUser(Role.EMPLOYEE, { reportingManager: b._id });

    // cycle detection unit check
    await expect(wouldCreateCycle(a._id.toString(), c._id.toString())).resolves.toBe(true);

    const res = await request(app)
      .patch(`/api/employees/${a._id}/manager`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reportingManager: c._id.toString() });
    expect(res.status).toBe(400);
  });

  it('returns direct reportees', async () => {
    const token = await adminToken();
    const manager = await createUser(Role.EMPLOYEE);
    await createUser(Role.EMPLOYEE, { reportingManager: manager._id });
    await createUser(Role.EMPLOYEE, { reportingManager: manager._id });

    const res = await request(app)
      .get(`/api/employees/${manager._id}/reportees`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.reportees).toHaveLength(2);
  });

  it('builds a reporting tree with roots and nested reports', async () => {
    const token = await adminToken();
    const top = await createUser(Role.EMPLOYEE);
    await createUser(Role.EMPLOYEE, { reportingManager: top._id });

    const res = await request(app)
      .get('/api/organization/tree')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const roots = res.body.data as Array<{ _id: string; reports: unknown[] }>;
    const topNode = roots.find((r) => r._id === top._id.toString());
    expect(topNode).toBeDefined();
    expect(topNode!.reports.length).toBeGreaterThanOrEqual(1);
  });
});
