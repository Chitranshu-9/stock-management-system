import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Tenant from '../models/Tenant';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stockai';

async function seedDatabase() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);

        console.log('Dropping existing data...');
        await User.deleteMany({});
        await Tenant.deleteMany({});

        console.log('Seeding demo Tenant...');
        const demoTenant = await Tenant.create({
            tenantId: 'T-DEMO-1',
            businessName: 'Super Store Demo',
            subscriptionStatus: 'active'
        });

        console.log('Seeding demo Admin Account...');
        // Password hashing is handled by the pre-save hook in User model!
        await User.create({
            tenantId: demoTenant.tenantId,
            email: 'admin@superstore.com',
            passwordHash: 'password123',
            name: 'Demo Admin',
            role: 'admin'
        });

        console.log('Database Seeding Completed Successfully! You can now login with admin@superstore.com / password123');
        process.exit(0);
    } catch (err) {
        console.error('Seeding process failed:', err);
        process.exit(1);
    }
}

seedDatabase();
