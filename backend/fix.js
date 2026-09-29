const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
mongoose.connect('mongodb://localhost:27017/stockai').then(async () => {
    const db = mongoose.connection.db;
    const hash = await bcrypt.hash('password123', 10);
    await db.collection('users').updateMany({}, { $set: { password: hash } });
    console.log('Passwords cleanly resolved natively');
    process.exit(0);
});
