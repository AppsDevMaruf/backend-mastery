import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth e2e', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should reject login with invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'wrong@example.com',
        password: 'wrong-password',
      })
      .expect(401);
  });
  it('should register, login and access protected incomes endpoint', async () => {
    const email = `e2e-${Date.now()}@example.com`;
    const password = 'StrongPassword123!';

    // 1. Register
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'E2E User',
        email,
        password,
      });

    expect([200, 201]).toContain(registerResponse.status);

    // 2. Login
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password,
      });

    expect([200, 201]).toContain(loginResponse.status);

    // 3. Capture access token
    const accessToken = loginResponse.body.data.accessToken;

    expect(accessToken).toBeDefined();
    expect(typeof accessToken).toBe('string');

    // 4. Call protected endpoint
    const incomesResponse = await request(app.getHttpServer())
      .get('/incomes')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(incomesResponse.status).toBe(200);
  });
  it('should reject protected incomes endpoint without access token', async () => {
    await request(app.getHttpServer())
      .get('/incomes')
      .expect(401);
  });
  it('should register, login and access protected incomes endpoint', async () => {
    const email = `e2e-${Date.now()}@example.com`;
    const password = 'StrongPassword123!';

    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'E2E User',
        email,
        password,
      })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password,
      })
      .expect(200);

    const accessToken = loginResponse.body.data.accessToken;

    expect(accessToken).toBeDefined();
    expect(typeof accessToken).toBe('string');

    await request(app.getHttpServer())
      .get('/incomes')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });
  it('should reject normal user from admin endpoint', async () => {
    const email = `e2e-admin-test-${Date.now()}@example.com`;
    const password = 'StrongPassword123!';

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'E2E User',
        email,
        password,
      })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    const accessToken = loginResponse.body.data.accessToken;

    await request(app.getHttpServer())
      .get('/auth/admin-test')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });
  it('should reject admin endpoint without token', async () => {
    await request(app.getHttpServer())
      .get('/auth/admin-test')
      .expect(401);
  });
  it('should rotate refresh token and reject the old refresh token', async () => {
    const email = `refresh-${Date.now()}@example.com`;
    const password = 'StrongPassword123!';

    // 1. Register user
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Refresh E2E User',
        email,
        password,
      })
      .expect(201);

    // 2. Login
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password,
      })
      .expect(200);

    const oldRefreshToken = loginResponse.body.data.refreshToken;

    expect(oldRefreshToken).toBeDefined();
    expect(typeof oldRefreshToken).toBe('string');

    // 3. Use old refresh token once
    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken: oldRefreshToken,
      })
      .expect(200);

    const newAccessToken = refreshResponse.body.data.accessToken;
    const newRefreshToken = refreshResponse.body.data.refreshToken;

    expect(newAccessToken).toBeDefined();
    expect(newRefreshToken).toBeDefined();

    // Rotation means the newly issued refresh token
    // should not be the same as the old one.
    expect(newRefreshToken).not.toBe(oldRefreshToken);

    // 4. Reuse old refresh token
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken: oldRefreshToken,
      })
      .expect(401);
  });
  it('should invalidate refresh token after logout', async () => {
    const email = `logout-${Date.now()}@example.com`;
    const password = 'StrongPassword123!';

    // 1. Register
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Logout E2E User',
        email,
        password,
      })
      .expect(201);

    // 2. Login
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password,
      })
      .expect(200);

    const accessToken = loginResponse.body.data.accessToken;
    const refreshToken = loginResponse.body.data.refreshToken;

    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();

    // 3. Logout using access token
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // 4. Old refresh token should now be invalid
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken,
      })
      .expect(401);
  });
});
