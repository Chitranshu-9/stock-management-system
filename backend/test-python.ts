import fs from 'fs';
import path from 'path';

async function testUpload() {
    try {
        console.log('[1] Loading Physical Image Payload...');
        const imageBuffer = fs.readFileSync(path.join(__dirname, '../nylon-hammer-25mm-replaceable-head-india-leather-supply.jpg'));
        const blob = new Blob([new Uint8Array(imageBuffer)], { type: 'image/jpeg' });
        const formData = new FormData();
        formData.append('image', blob, 'hammer.jpg');

        console.log('[2] Blasting payload directly to Python Engine on port 8000...');
        const aiRes = await fetch('http://127.0.0.1:8000/api/analyze-inventory-image', {
            method: 'POST',
            body: formData
        });

        const textStr = await aiRes.text();
        console.log('\n--- PYTHON ENGINE RESPONSE ---');
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
