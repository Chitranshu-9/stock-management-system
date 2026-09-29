const mongoose = require('mongoose');
const User = require('./dist/models/User').default;
const Product = require('./dist/models/Product').default;
const Tenant = require('./dist/models/Tenant').default;
const http = require('http');

mongoose.connect('mongodb://localhost:27017/stockai');

const request = (path, method, token, body = null) => {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost', port: 5005, path: '/api' + path, method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }
        };
        const req = http.request(options, (res) => {
            let data = ''; res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        });
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
};

const login = async (email, password) => {
    return new Promise((resolve) => {
        const req = http.request({ hostname: 'localhost', port: 5005, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
            let data = ''; res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data).accessToken || res.headers['set-cookie'][0].split('accessToken=')[1].split(';')[0]));
        });
        req.write(JSON.stringify({ email, password })); req.end();
    });
};

async function run() {
    await Tenant.deleteMany({}); await User.deleteMany({}); await Product.deleteMany({});
    
    // Seed
    await Tenant.create({ tenantId: 'TENANT-A', businessName: 'Store A', subscriptionStatus: 'active' });
    await Tenant.create({ tenantId: 'TENANT-B', businessName: 'Store B', subscriptionStatus: 'active' });

    let tA_Admin = new User({ tenantId: 'TENANT-A', email: 'adminA@t.com', name: 'A', role: 'admin', passwordHash: 'password' }); await tA_Admin.save();
    let tA_Cashier = new User({ tenantId: 'TENANT-A', email: 'cashA@t.com', name: 'C', role: 'cashier', passwordHash: 'password' }); await tA_Cashier.save();
    let tB_Admin = new User({ tenantId: 'TENANT-B', email: 'adminB@t.com', name: 'B', role: 'admin', passwordHash: 'password' }); await tB_Admin.save();

    let tokA_Cashier = await login('cashA@t.com', 'password');
    let tokB_Admin = await login('adminB@t.com', 'password');

    // Test 1: Phase 3 (Roles) -> Cashier creating a product
    let r1 = await request('/products', 'POST', tokA_Cashier, { name: 'Hammer', sku: 'H1' });
    console.log('[Phase 3] Cashier Product Creation:', r1.status === 201 ? 'FAIL (Allowed)' : 'PASS (Blocked)');

    let hammer = await Product.findOne({ sku: 'H1' });

    // Test 2: Phase 4 (Multi-Tenancy) -> Tenant B artificially querying Tenant A's products
    let r3 = await request('/products', 'GET', tokB_Admin);
    let items = JSON.parse(r3.data);
    console.log('[Phase 4] Cross-Tenant Leakage List:', items.length > 0 ? 'FAIL (Leaked)' : 'PASS (Safely Empty)');

    process.exit(0);
}
run();
