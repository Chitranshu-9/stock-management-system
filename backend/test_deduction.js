const mongoose = require('mongoose');

async function test() {
    await mongoose.connect('mongodb://localhost:27017/stockai');
    const { Schema } = mongoose;
    const StockMovement = mongoose.models.StockMovement || mongoose.model('StockMovement', new Schema({}, { strict: false }));
    const Product = mongoose.models.Product || mongoose.model('Product', new Schema({}, { strict: false }));
    const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', new Schema({}, { strict: false }));

    console.log("--- INVOICES ---");
    const invs = await Invoice.find().sort({ createdAt: -1 }).limit(3).lean();
    console.dir(invs, { depth: null });

    console.log("--- STOCK MOVEMENTS ---");
    const moves = await StockMovement.find().sort({ createdAt: -1 }).limit(6).lean();
    console.dir(moves, { depth: null });
    process.exit(0);
}
test();
