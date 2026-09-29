const http = require('http');

async function testAuth() {
    const BASE = 'http://localhost:5005/api';
    console.log('[*] Phase 2: Starting Authentication QA');
    
    async function request(path, method, body=null, headers={}) {
        try {
            const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
            const opts = { method, headers: { 'Content-Type': 'application/json', ...headers } };
            if (body) opts.body = JSON.stringify(body);
            const res = await (await fetch())(${BASE}, opts);
            const text = await res.text();
            let json = null;
            try { json = JSON.parse(text); } catch(e){}
            return { status: res.status, headers: res.headers, data: json || text };
        } catch(e) {
            return { status: 0, error: e.message };
        }
    }

    // 1. Missing credentials
    let res = await request('/auth/login', 'POST', {});
    console.log('1. Missing credentials:', res.status === 400 ? 'PASS' : 'FAIL', res.data);

    // 2. Invalid email format
    res = await request('/auth/login', 'POST', { email: 'bad', password: 'password123' });
    console.log('2. Invalid username:', res.status === 401 ? 'PASS' : 'FAIL', res.data);

    // 3. Nonexistent user
    res = await request('/auth/login', 'POST', { email: 'ghost@superstore.com', password: 'password123' });
    console.log('3. Nonexistent user:', res.status === 401 ? 'PASS' : 'FAIL', res.data);

    // 4. Invalid Password
    res = await request('/auth/login', 'POST', { email: 'admin@superstore.com', password: 'wrongpassword' });
    console.log('4. Invalid password:', res.status === 401 ? 'PASS' : 'FAIL', res.data);
    
    // Test lockout (Max attempts)
    await request('/auth/login', 'POST', { email: 'admin@superstore.com', password: 'wrongpassword' });
    await request('/auth/login', 'POST', { email: 'admin@superstore.com', password: 'wrongpassword' });
    let lockoutRes = await request('/auth/login', 'POST', { email: 'admin@superstore.com', password: 'wrongpassword' });
    console.log('5. Account lockout logic:', lockoutRes.status === 429 ? 'PASS' : 'FAIL', lockoutRes.data);

    // Seed database again to unlock user! (or just use Mongo to clear lock)
    // Wait, if it locks, we can't test valid login! Let's mock a second user or reset.
}
testAuth();
