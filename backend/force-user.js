const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost:27017/stockai').then(async () => {
    try {
        const db = mongoose.connection.db;
        const tenant = await db.collection('tenants').findOne({});
        let tenantId = tenant ? tenant._id.toString() : 'tenant-999';

        if (!tenant) {
            await db.collection('tenants').insertOne({ _id: 'tenant-999', name: 'Fallback Tenant' });
        }

        const hash = await bcrypt.hash('password123', 10);

        // Reset all rate-limiting natively
        await db.collection('users').updateMany({}, { $set: { loginAttempts: 0, lockUntil: 0 } });

        // Upsert exact match admin
        await db.collection('users').updateOne(
            { email: 'admin@example.com' },
            {
                $set: {
                    tenantId,
                    passwordHash: hash,
                    name: 'Supreme Admin',
                    role: 'admin',
                    loginAttempts: 0,
                    lockUntil: 0
                }
            },
            { upsert: true }
        );

        console.log('Force-seeded admin@example.com with password123 successfully!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
});
