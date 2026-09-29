const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost:27017/stockai').then(async () => {
    try {
        const db = mongoose.connection.db;

        // Let's get the legit tenant or create one
        let tenant = await db.collection('tenants').findOne({});
        let realTenantIdStr = '';

        if (!tenant || !tenant.tenantId) {
            realTenantIdStr = 'tenant-master';
            await db.collection('tenants').insertOne({
                tenantId: realTenantIdStr,
                businessName: 'Master Enterprise',
                subscriptionStatus: 'active'
            });
        } else {
            realTenantIdStr = tenant.tenantId;
            // Ensure it's active
            await db.collection('tenants').updateOne(
                { _id: tenant._id },
                { $set: { subscriptionStatus: 'active' } }
            );
        }

        const hash = await bcrypt.hash('password123', 10);

        await db.collection('users').updateMany({}, { $set: { loginAttempts: 0, lockUntil: 0 } });

        await db.collection('users').updateOne(
            { email: 'admin@example.com' },
            {
                $set: {
                    tenantId: realTenantIdStr,
                    passwordHash: hash,
                    name: 'Supreme Admin',
                    role: 'admin',
                    loginAttempts: 0,
                    lockUntil: 0
                }
            },
            { upsert: true }
        );

        console.log('Fixed tenant string mismatch! admin@example.com / password123 is mapped correctly to literal: ' + realTenantIdStr);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
});
