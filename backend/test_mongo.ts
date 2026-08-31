import mongoose from 'mongoose';
import Product from './src/models/Product';
import StockMovement from './src/models/StockMovement';
import Invoice from './src/models/Invoice';
import Tenant from './src/models/Tenant';

async function debug() {
    process.env.MONGO_URI = 'mongodb://localhost:27017/stockai';
    await mongoose.connect(process.env.MONGO_URI);

    try {
        const tenant = await Tenant.findOne();
        if (!tenant) {
            console.log('No tenant found. Cannot test.');
            process.exit(1);
        }
        const tenantId = tenant._id.toString();

        let product = await Product.findOne({ tenantId });
        if (!product) {
            console.log('No product found, creating generic Product.');
            product = await Product.create({ tenantId, name: 'Generic Test', sku: 'GT-1', currentStock: 10, sellingPrice: 100 });
        }

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

    } catch (e: any) {
        console.error("MONGOOSE TRACE ERROR:", e.message);
    }
    process.exit(0);
}
debug();
