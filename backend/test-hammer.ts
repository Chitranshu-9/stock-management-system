import fs from 'fs';
import path from 'path';

async function testUpload() {
    try {
        console.log('[1] Initializing physical JWT session by bypassing auth...');

        // We will directly instantiate a mock Express router simulation to isolate the `ai.ts` logic 
        // to bypass needing the authentication header for quick local verification.
        // Wait, since the server is theoretically running on port 5000 (standard backend), we can just login.

        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@superstore.com', password: 'password123' })
        });

        if (!loginRes.ok) {
            const logMsg = await loginRes.text();
            console.error('Login Failed!', logMsg);
            return;
        }

        // Extract strictly HTTP-Only secure cookies from Set-Cookie headers natively
        const cookies = loginRes.headers.get('set-cookie');

        console.log('[2] Loaded JWT Context:', cookies ? 'Valid' : 'Invalid');

        console.log('[3] Loading Physical Image Payload...');
        const imageBuffer = fs.readFileSync(path.join(__dirname, '../nylon-hammer-25mm-replaceable-head-india-leather-supply.jpg'));
        const blob = new Blob([new Uint8Array(imageBuffer)], { type: 'image/jpeg' });
        const formData = new FormData();
        formData.append('image', blob, 'hammer.jpg');

        console.log('[4] Blasting payload to Node.js Pipeline...');
        const aiRes = await fetch('http://localhost:5000/api/ai/scan', {
            method: 'POST',
            headers: {
                'Cookie': cookies || ''
            },
            body: formData
        });

        const textStr = await aiRes.text();
        console.log('\n--- NODE.JS AI ENGINE RESPONSE ---');
        console.log('Status Code:', aiRes.status);
        try {
            console.log(JSON.stringify(JSON.parse(textStr), null, 2));
        } catch (e) {
            console.log(textStr);
        }

    } catch (e) {
        console.error('Test Execution Failed:', e);
    }
}

testUpload();
