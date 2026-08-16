import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import Product from './models/Product';
import User from './models/User';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stock-ai');
    console.log("Connected to MongoDB.");

    let tenantId = 'tenant_123';
    const products = await Product.find({});
    if (products.length > 0) {
        tenantId = products[0].tenantId;
        console.log(`Derived Tenant ID from Products: ${tenantId}`);
    } else {
        console.log(`Fallback Tenant ID: ${tenantId}`);
    }

    const sourceDir = 'd:/stock-management-system/test-images';
    const destDir = path.join(__dirname, '../uploads/ai-training');

    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.jpeg') || f.endsWith('.jpg') || f.endsWith('.png'));

    // Attempt to map based on filename patterns or blindly append to a generic product
    // Wait, let's just group them into three Products programmatically

    let phoneImages: string[] = [];
    let toothsiImages: string[] = [];
    let remoteImages: string[] = [];

    for (const file of files) {
        const sourcePath = path.join(sourceDir, file);
        const uniqueName = `seed_${Date.now()}_${file}`;
        const destPath = path.join(destDir, uniqueName);
        fs.copyFileSync(sourcePath, destPath);

        const relativePath = `/uploads/ai-training/${uniqueName}`;

        // Manual sorting based on earlier run tracking
        if (file.includes('10.08') || file.includes('10.28') || file.includes('10.37')) {
            phoneImages.push(relativePath);
        } else if (file.includes('11.45') || file.includes('11.59') || file.includes('12.09') || file.includes('12.15') || file.includes('12.24')) {
            toothsiImages.push(relativePath);
        } else {
            remoteImages.push(relativePath);
        }
    }

    // We update or create the arrays
    const p1 = await Product.findOneAndUpdate(
        { tenantId, name: 'Black Phone' },
        { sku: 'SEED-PHONE-01', $push: { aiTrainingImages: { $each: phoneImages } }, currentStock: 1, category: 'Electronics' },
        { upsert: true, new: true }
    );

    const p2 = await Product.findOneAndUpdate(
        { tenantId, name: 'Toothsi Container' },
        { sku: 'SEED-TTH-01', $push: { aiTrainingImages: { $each: toothsiImages } }, currentStock: 1, category: 'Medical' },
        { upsert: true, new: true }
    );

    const p3 = await Product.findOneAndUpdate(
        { tenantId, name: 'TV Remote' },
        { sku: 'SEED-REM-01', $push: { aiTrainingImages: { $each: remoteImages } }, currentStock: 1, category: 'Electronics' },
        { upsert: true, new: true }
    );

    console.log("Successfully seeded to MongoDB Arrays!");
    console.log(`Phone Variants: ${phoneImages.length}`);
    console.log(`Toothsi Variants: ${toothsiImages.length}`);
    console.log(`Remote Variants: ${remoteImages.length}`);

    process.exit();
}

run().catch(console.error);
