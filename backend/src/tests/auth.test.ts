import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../app';
import Tenant from '../models/Tenant';
import User from '../models/User';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await mongoose.connection.dropDatabase();
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'refresh-secret';
    process.env.NODE_ENV = 'test';
});

describe('Authentication Flow & Session Management', () => {

    it('should generate secure HttpOnly Access & Refresh cookies on valid login', async () => {
        const tenant = await Tenant.create({ tenantId: 'T1', businessName: 'Test Biz', subscriptionStatus: 'active' });
        await User.create({ email: 'test@example.com', passwordHash: 'password123', name: 'Bob', tenantId: tenant.tenantId });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'password123' });

        expect(res.status).toBe(200);
        // Expect token cookies
        const cookies = res.headers['set-cookie'] as unknown as string[];
        expect(cookies).toBeDefined();
        expect(cookies.some((c: string) => c.includes('accessToken='))).toBeTruthy();
        expect(cookies.some((c: string) => c.includes('refreshToken='))).toBeTruthy();

        // Assert json body has stripped tokens
        expect(res.body.token).toBeUndefined();
        expect(res.body.user.tenantId).toBe('T1');
    });

    it('should lock the account for 2 minutes after 3 consecutive failed attempts', async () => {
        const tenant = await Tenant.create({ tenantId: 'T2', businessName: 'Test Biz', subscriptionStatus: 'active' });
        await User.create({ email: 'lock@example.com', passwordHash: 'password123', name: 'Bob', tenantId: tenant.tenantId });

        // Attempt 1: Failed
        await request(app).post('/api/auth/login').send({ email: 'lock@example.com', password: 'wrong' }).expect(401);

        // Attempt 2: Failed
        await request(app).post('/api/auth/login').send({ email: 'lock@example.com', password: 'wrong' }).expect(401);

        // Attempt 3: Failed (Triggers Lock)
        await request(app).post('/api/auth/login').send({ email: 'lock@example.com', password: 'wrong' }).expect(401);

        // Attempt 4: Should return 429 Too Many Requests (Brute force protection)
        const lockedRes = await request(app).post('/api/auth/login').send({ email: 'lock@example.com', password: 'wrong' });
        expect(lockedRes.status).toBe(429);
        expect(lockedRes.body.error).toContain('Maximum login attempts exceeded');

        // Verify lock is persisting in memory even if password magically is guessed currently
        const lockedCorrectRes = await request(app).post('/api/auth/login').send({ email: 'lock@example.com', password: 'password123' });
        expect(lockedCorrectRes.status).toBe(429);
    });

    it('should cleanly reset attempts upon successful login before hitting the max-lock threshold', async () => {
        const tenant = await Tenant.create({ tenantId: 'T3', businessName: 'Test Biz', subscriptionStatus: 'active' });
        await User.create({ email: 'reset@example.com', passwordHash: 'password123', name: 'Bob', tenantId: tenant.tenantId });

        // Fail 2 times
        await request(app).post('/api/auth/login').send({ email: 'reset@example.com', password: 'wrong' }).expect(401);
        await request(app).post('/api/auth/login').send({ email: 'reset@example.com', password: 'wrong' }).expect(401);

        // Succeed on 3rd time
        await request(app).post('/api/auth/login').send({ email: 'reset@example.com', password: 'password123' }).expect(200);

        // Verify DB resets logic
        const user = await User.findOne({ email: 'reset@example.com' });
        expect(user?.loginAttempts).toBe(0);
        expect(user?.lockUntil).toBeUndefined();
    });

});
