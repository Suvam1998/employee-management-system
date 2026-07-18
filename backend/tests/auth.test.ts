import request from 'supertest';
import { createApp } from '../src/app';
import { createUser } from './helpers';
import { Role } from '../src/types';

const app = createApp();

describe('Auth', () => {
  it('logs in with valid credentials and returns a token', async () => {
    const user = await createUser(Role.SUPER_ADMIN);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'Password@123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('rejects invalid password', async () => {
    const user = await createUser(Role.HR);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('rejects malformed email with 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'x' });
    expect(res.status).toBe(400);
  });

  it('blocks protected route without token', async () => {
    const res = await request(app).get('/api/employees');
    expect(res.status).toBe(401);
  });

  it('returns current user on /me with bearer token', async () => {
    const user = await createUser(Role.EMPLOYEE);
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'Password@123' });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(user.email);
  });
});
