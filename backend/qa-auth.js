const http = require('http');

const request = (path, method, body = null) => {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 5005,
            path: '/api' + path,
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, data }));
        });
        req.on('error', e => resolve({status: 0, data: e.message}));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
};

async function run() {
    let r;
    // 1. Valid login
    r = await request('/auth/login', 'POST', { email: 'admin@superstore.com', password: 'password123' });
    console.log('[+] 1. Valid Login:', r.status === 200 ? 'PASS' : 'FAIL', r.status);
    
    // Extract token
    let cookies = r.headers['set-cookie'] || [];
    let token = '';
    cookies.forEach(c => { if(c.includes('accessToken=')) token = c.split('accessToken=')[1].split(';')[0]; });

    // 2. Invalid password
    r = await request('/auth/login', 'POST', { email: 'admin@superstore.com', password: 'wrong' });
    console.log('[+] 2. Invalid Password:', r.status === 401 ? 'PASS' : 'FAIL', r.status);

    // 3. Invalid username
    r = await request('/auth/login', 'POST', { email: 'ghost@ghost.com', password: 'wrong' });
    console.log('[+] 3. Nonexistent User:', r.status === 401 ? 'PASS' : 'FAIL', r.status);

    // 4. Missing credentials
    r = await request('/auth/login', 'POST', {});
    console.log('[+] 4. Missing Credentials:', (r.status === 400 || r.status === 401) ? 'PASS' : 'FAIL', r.status);

    // 5. Protected route without auth
    r = await request('/inventory/overview', 'GET');
    console.log('[+] 5. Protected without auth:', r.status === 401 ? 'PASS' : 'FAIL', r.status);

    // 6. Test Login Lockout
    await request('/auth/login', 'POST', { email: 'admin@superstore.com', password: 'wrong' });
    await request('/auth/login', 'POST', { email: 'admin@superstore.com', password: 'wrong' });
    await request('/auth/login', 'POST', { email: 'admin@superstore.com', password: 'wrong' });
    r = await request('/auth/login', 'POST', { email: 'admin@superstore.com', password: 'wrong' });
    console.log('[+] 6. Account lockout (status 429):', r.status === 429 ? 'PASS' : 'FAIL', r.status, r.data);
    
    console.log('\nPHASE 2 AUTHENTICATION SUITE COMPLETE');
}
run();
