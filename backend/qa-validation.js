const http = require('http');

const login = async (email, password) => {
    return new Promise((resolve) => {
        const req = http.request({ hostname: 'localhost', port: 5005, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
            let data = ''; res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data).accessToken || (res.headers['set-cookie'] ? res.headers['set-cookie'][0].split('accessToken=')[1].split(';')[0] : null)));
        });
        req.write(JSON.stringify({ email, password })); req.end();
    });
};

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

async function run() {
    let token = await login('adminA@t.com', 'password');
    let r1 = await request('/products', 'POST', token, { name: 'Faulty Pricing', sku: 'BAD-1', purchasePrice: -500, stockLevel: -20 });
    console.log('[Phase 6] Negative Bounds:', r1.status === 201 ? 'FAIL (DB accepts negative pricing and stock!)' : 'PASS (Blocked)');
    process.exit(0);
}
run();
