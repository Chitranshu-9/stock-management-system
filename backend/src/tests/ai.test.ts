import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../app';
import Tenant from '../models/Tenant';
import User from '../models/User';
import Product from '../models/Product';
import path from 'path';
import fs from 'fs';

let mongoServer: MongoMemoryServer;
let jwtCookie: string;
let tenantId: string;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    // Seed User & Tenant to extract valid JWT Token
    const tenant = await Tenant.create({ tenantId: 'T1', businessName: 'Biz', subscriptionStatus: 'active' });
    tenantId = tenant.tenantId;

    const user = await User.create({ email: 'ai@test.com', passwordHash: 'pwd', name: 'AI Tester', tenantId });

    process.env.JWT_SECRET = 'test-secret';

    const loginRes = await request(app).post('/api/auth/login').send({ email: 'ai@test.com', password: 'pwd' });
    const cookies = loginRes.headers['set-cookie'] as unknown as string[];
    jwtCookie = cookies.find(c => c.startsWith('accessToken=')) || '';

    // Seed some products
    await Product.create({ tenantId, sku: 'OIL-1', name: 'Demo ABC Cooking Oil 1L', purchasePrice: 50, sellingPrice: 70, unit: 'L' });
    await Product.create({ tenantId, sku: 'OIL-2', name: 'Other Oil', purchasePrice: 20, sellingPrice: 30, unit: 'L' });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('AI Vision Middleware & Inference Fallbacks', () => {

    it('should brutally reject image uploads > 5MB (INVERSION TESTING)', async () => {
        // Create dummy large buffer inside memory mathematically bypassing physical writes
        const largeImage = Buffer.alloc(6 * 1024 * 1024, 'a'); // 6MB

        const res = await request(app)
            .post('/api/ai/scan')
            .set('Cookie', jwtCookie)
            .attach('image', largeImage, 'large.jpg');

        expect(res.status).toBe(413);
        expect(res.body.error).toContain('File Limit Exceeded');
    });

    it('should brutally reject unauthorized mimetypes (INVERSION TESTING)', async () => {
        const textFile = Buffer.from('hello world');

        const res = await request(app)
            .post('/api/ai/scan')
            .set('Cookie', jwtCookie)
            .attach('image', textFile, { filename: 'exploit.exe', contentType: 'application/x-msdownload' });

        expect(res.status).toBe(415);
        expect(res.body.error).toContain('INVALID_MIME');
    });

    it('should successfully parse valid images into the inference endpoint', async () => {
        const validImage = Buffer.from('dummy-image-data-stub');

        // We run without HF_TOKEN, so the Mock inference delay should trigger
        // Because jest timeouts inside tests are strict, we ensure it passes under 5s 
        const res = await request(app)
            .post('/api/ai/scan')
            .set('Cookie', jwtCookie)
            .attach('image', validImage, { filename: 'test.png', contentType: 'image/png' });

        expect(res.status).toBe(200);
        expect(res.body.aiIdentification).toBeDefined();

        // Assert Catalog match functionality
        expect(res.body.catalogMatches).toBeDefined();
        // It matched 'Demo ABC Cooking Oil' based on 'Demo' prefix
        expect(res.body.catalogMatches.length).toBeGreaterThan(0);
        expect(res.body.catalogMatches[0].sku).toBe('OIL-1');
    });
});
