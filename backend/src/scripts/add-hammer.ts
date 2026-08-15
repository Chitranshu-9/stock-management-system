import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product';
import User from '../models/User';

dotenv.config();

async function addHammer() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/stockai');

        const admin = await User.findOne({ email: 'admin@superstore.com' });
        if (!admin) throw new Error('Admin not found, run seed.ts first');

        // Add the hammer ensuring the exact word 'Hammer' or 'Nylon' exists natively
        await Product.create({
            tenantId: admin.tenantId,
            name: "Nylon Hammer 25mm Replaceable Head",
            sku: "TOOL-HMR-001",
            category: "Hardware",
            unit: "Piece",
            purchasePrice: 200,
            sellingPrice: 350,
            stockLevel: 14,
            reorderPoint: 5
        });

        console.log('[SUCCESS] Nylon Hammer specifically bound to SuperStore Tenant Catalog.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

addHammer();
