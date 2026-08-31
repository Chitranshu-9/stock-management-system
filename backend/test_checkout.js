const http = require('http');
const crypto = require('crypto');

function makeRequest(options, postData) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
        });
        req.on('error', reject);
        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

async function test() {
    try {
        const checkoutData = JSON.stringify({
            items: [{ id: "60c72b2f9b1d8b00155b4f6b", name: "Mock TV", qty: 1, price: 50 }],
            customerName: "Auto Test",
            customerPhone: "123",
            customerGstin: "GSTIN",
            tenantIdOverride: "66d0e808fc13db0011223344"
        });

        const chkRes = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/api/inventory/checkout',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(checkoutData)
            }
        }, checkoutData);

        console.log("STATUS:", chkRes.status);
        console.log("BODY:", chkRes.body);
    } catch (e) {
        console.error(e);
    }
}
test();
