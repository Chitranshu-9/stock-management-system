const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/stockai').then(async () => {
    try {
        const db = mongoose.connection.db;
        // The business account gets blocked if subscription is suspended
        await db.collection('tenants').updateMany({}, { $set: { subscriptionStatus: 'active' } });
        console.log('Successfully unfrozen all Tenant Accounts globally!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
});
