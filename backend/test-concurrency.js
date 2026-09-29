const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const http = require('http');
require('dotenv').config();

function post(path, body, headers) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 5005,
            path: path,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers }
        }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch (e) { resolve({ error: data }); }
            });
        });
        req.on('error', reject);
        req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTests() {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-development';

    await mongoose.connect('mongodb://localhost:27017/stockai');
    const db = mongoose.connection.db;

    const admin = await db.collection('users').findOne({ email: 'admin@example.com' });
    if (!admin) {
        console.error('Testing Error: Supreme Admin missing natively.');
        process.exit(1);
    }

    const token = jwt.sign(
        { userId: admin._id, tenantId: admin.tenantId, role: admin.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    const headers = { 'Cookie': `accessToken=${token}` };

    console.log('--- STARTING CONCURRENCY TESTS --- \n');

    const mockId = new mongoose.Types.ObjectId();
    const mockProduct = {
        _id: mockId,
        tenantId: admin.tenantId,
        sku: 'TEST-CONC-2',
        name: 'Math Atomicity Tester',
        category: 'Testing',
        unit: 'pcs',
        currentStock: 10,
        sellingPrice: 100,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    await db.collection('products').insertOne(mockProduct);

    console.log('[CONCURRENCY TEST] Injecting parallel checkouts (ReqA=7, ReqB=5)...');
    const cartA = { items: [{ id: mockId.toString(), qty: 7, name: 'Tester' }] };
    const cartB = { items: [{ id: mockId.toString(), qty: 5, name: 'Tester' }] };

    const responses = await Promise.all([
        post('/api/inventory/checkout', cartA, headers),
        post('/api/inventory/checkout', cartB, headers)
    ]);

    for (const data of responses) {
        console.log('Response:', data.message || data.error);
    }

    const postOverProduct = await db.collection('products').findOne({ _id: mockId });
    console.log(`[CONCURRENCY BOUND] Final Stock: ${postOverProduct.currentStock}`);

    console.log('\n[IDEMPOTENCY TEST] Simulating Replay...');
    const idempotencyKey = `ADJ-QUEUE-${Date.now()}`;
    const adjustPayload = {
        productId: mockId.toString(),
        physicalCount: postOverProduct.currentStock + 5,
        reason: 'Opening_Stock',
        notes: 'Offline Replay Test',
        idempotencyKey
    };

    const res1 = await post('/api/inventory/adjust', adjustPayload, headers);
    console.log('Hit 1:', res1.message || res1.error);

    const res2 = await post('/api/inventory/adjust', adjustPayload, headers);
    console.log('Hit 2:', res2.message || res2.error);

    const finalProduct = await db.collection('products').findOne({ _id: mockId });
    console.log(`[FINAL STOCK] Size (Expected ${postOverProduct.currentStock + 5}): ${finalProduct.currentStock}`);

    console.log('\n--- TESTS COMPLETED SECURELY ---');
    process.exit(0);
}

runTests();
