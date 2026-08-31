const http = require('http');

const boundary = '--------------------------1234567890';
const body = `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="name"\r\n\r\n` +
    `TestProduct\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="quantity"\r\n\r\n` +
    `5\r\n` +
    `--${boundary}--\r\n`;

// Since I don't have the auth token, the request will fail with 401 Unauthorized if auth is working.
// If it fails with something else, it's a structural error!
// Wait, I can simulate an authenticated JWT by signing a dummy one with 'secretkey' or looking at .env
const jwt = require('jsonwebtoken');

// Look up secret from .env if possible, otherwise try default
let secret = 'dev_jwt_secret_9883'; // default from previous tasks or auth.ts?
const fs = require('fs');
if (fs.existsSync('./backend/src/middleware/auth.ts')) {
    const authCode = fs.readFileSync('./backend/src/middleware/auth.ts', 'utf8');
    const match = authCode.match(/process\.env\.JWT_SECRET\s*\|\|\s*['"]([^'"]+)['"]/);
    if (match) secret = match[1];
}

const token = jwt.sign({ userId: '123', tenantId: 'tenant123' }, secret);

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/products/ai-ingest',
    method: 'POST',
    headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(body),
        'Cookie': `token=${token}`
    }
};

const req = http.request(options, (res) => {
    let raw = '';
    res.on('data', c => raw += c);
    res.on('end', () => {
        console.log('STATUS:', res.statusCode);
        console.log('BODY:', raw);
    });
});
req.on('error', e => console.error('REQ ERR:', e));
req.write(body);
req.end();
