const mongoose = require('mongoose');

async function debug() {
    process.env.MONGO_URI = 'mongodb://localhost:27017/stockai';
    await mongoose.connect(process.env.MONGO_URI);

    // Load models
    const Product = require('./src/models/Product').default;
    const StockMovement = require('./src/models/StockMovement').default;
    const Invoice = require('./src/models/Invoice').default;
    const Tenant = require('./src/models/Tenant').default;

    try {
        const tenant = await Tenant.findOne();
        if (!tenant) {
            console.log('No tenant found. Cannot test.');
            process.exit(1);
        }
        const tenantId = tenant._id.toString();

        const product = await Product.findOne({ tenantId });
        if (!product) { console.log('No product found'); return; }

        let totalValuation = 0;
        const invoiceNumber = `INV-TEST`;

        totalValuation += (1 * product.sellingPrice || 0);

        console.log('Testing StockMovement...');
        await StockMovement.create({
            tenantId,
            productId: product._id,
            productName: product.name,
            type: 'Sale',
            quantityOut: 1,
            quantityIn: 0,
            balanceAfter: 0,
            referenceId: invoiceNumber,
            performedBy: tenantId,
            notes: 'Test'
        });
        console.log('StockMovement successful.');

        console.log('Testing Invoice...');
        await Invoice.create({
            tenantId,
            invoiceNumber,
            totalAmount: totalValuation,
            customerDetails: { name: 'A', phone: '-', gstin: '-' },
            items: [{
                productId: product._id,
                name: product.name,
                qty: 1,
                price: product.sellingPrice || 0
            }]
        });
        console.log('Invoice successful.');

    } catch (e) {
        console.error(e.message);
    }
    process.exit(0);
}
debug();
