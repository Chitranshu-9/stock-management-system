import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import StockMovement from '../models/StockMovement';
import Product from '../models/Product';
import Invoice from '../models/Invoice';

const router = Router();

// GET /api/inventory/ledger
// Fetch the unified accounting ledger for this specific isolated business tenant
router.get('/ledger', requireAuth, requireRole('admin', 'manager'), async (req: Request, res: Response): Promise<void> => {
    try {
        const tenantId = (req as any).user.tenantId;

        // Securely bind strictly to only this Business' Ledger
        const ledger = await StockMovement.find({ tenantId })
            .sort({ createdAt: -1 })
            .limit(100);

        res.status(200).json(ledger);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/inventory/overview
router.get('/overview', requireAuth, requireRole('admin', 'manager'), async (req: Request, res: Response): Promise<void> => {
    try {
        const tenantId = (req as any).user.tenantId;

        // --- 1. Real-time Aggregation of Inventory KPIs ---
        // Inversion Thinking: Don't choke Node.js memory arrays; execute mathematics natively on MongoDB via C++
        const productStats = await Product.aggregate([
            { $match: { tenantId } },
            {
                $project: {
                    safeStock: { $max: [0, "$currentStock"] },
                    price: { $ifNull: ["$sellingPrice", 0] },
                    isLowStock: { $lte: ["$currentStock", { $ifNull: ["$reorderLevel", 10] }] },
                    name: 1, currentStock: 1, reorderLevel: 1
                }
            },
            {
                $group: {
                    _id: null,
                    totalItems: { $sum: "$safeStock" },
                    valuation: { $sum: { $multiply: ["$safeStock", "$price"] } },
                    uniqueSkus: { $sum: 1 },
                    lowStockAlerts: { $sum: { $cond: ["$isLowStock", 1, 0] } },
                    alertDetails: {
                        $push: {
                            $cond: [
                                "$isLowStock",
                                { name: "$name", stock: "$currentStock", limit: { $ifNull: ["$reorderLevel", 10] } },
                                null
                            ]
                        }
                    }
                }
            }
        ]);

        const stats = productStats[0] || { totalItems: 0, valuation: 0, uniqueSkus: 0, lowStockAlerts: 0, alertDetails: [] };

        const insights = stats.alertDetails
            .filter((d: any) => d !== null)
            .slice(0, 3)
            .map((p: any) => ({
                type: 'Action Required',
                message: `'${p.name}' is below reorder level (${p.stock}/${p.limit}). Consider resupplying.`
            }));

        if (insights.length === 0) {
            insights.push({ type: 'Optimization', message: 'All catalog items are securely tracked above active critical bounds natively.' });
        }

        // --- 2. Immutable Financial Reality (Today's Revenue) ---
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayInvoices = await Invoice.aggregate([
            { $match: { tenantId, createdAt: { $gte: today } } },
            { $group: { _id: null, revenue: { $sum: "$totalAmount" } } }
        ]);
        const todaySales = todayInvoices[0]?.revenue || 0;

        // --- 3. 7-Day Chart Aggregations ---
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 6);

        const movements = await StockMovement.aggregate([
            { $match: { tenantId, createdAt: { $gte: lastWeek } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } }, // Native MongoDB grouping by day
                    sales: { $sum: { $cond: [{ $eq: ["$type", "Sale"] }, "$quantityOut", 0] } },
                    additions: { $sum: { $cond: [{ $in: ["$type", ["Purchase", "Adjustment"]] }, "$quantityIn", 0] } }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const chartData = [];
        const moveMap = new Map(movements.map(m => [m._id, m]));

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dataPoint = moveMap.get(dateStr) || { sales: 0, additions: 0 };

            chartData.push({
                name: date.toLocaleDateString('en-US', { weekday: 'short' }),
                sales: dataPoint.sales,
                additions: dataPoint.additions
            });
        }

        res.status(200).json({
            totalItems: stats.totalItems,
            valuation: stats.valuation,
            skus: stats.uniqueSkus,
            lowStockAlerts: stats.lowStockAlerts,
            alertDetails: stats.alertDetails,
            insights,
            todaySales,
            chartData
        });
    } catch (e: any) {
        console.error("Overview Aggregation Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// POST /api/inventory/checkout
// Process a POS sale: generate invoice, deduct stock, structure ledger.
router.post('/checkout', requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const tenantId = (req as any).user?.tenantId;
        const { items, customerName, customerPhone, customerGstin } = req.body;

        if (!items || items.length === 0) {
            res.status(400).json({ error: 'Cart is empty' });
            return;
        }

        // We will execute deductions sequentially to ensure validity. 
        // In a production SQL env this would use transactions, but we emulate it safely here.
        const invoiceNumber = `INV-${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
        let totalValuation = 0;
        const validArtifacts = [];

        // Phase 1: Pre-flight Verification & Aggregation
        for (const item of items) {
            const product = await Product.findOne({ _id: item.id, tenantId });
            if (!product) continue;

            const qty = Math.max(1, Number(item.qty) || 1);
            // ENFORCING SERVER-SIDE PRICE (BUG-004 FIXED)
            const price = Number(product.sellingPrice) || 0;

            // PREVENTING NEGATIVE STOCK (BUG-005 FIXED)
            if (product.currentStock < qty) {
                res.status(400).json({ error: `Insufficient stock for ${product.name}. Available: ${product.currentStock}, Requested: ${qty}` });
                return;
            }

            totalValuation += (qty * price);

            // Removed hard bounds check to support asynchronous physical supply-chain drifts is an obsolete paradigm.
            validArtifacts.push({ product, qty, price, name: item.name, id: item.id });
        }

        if (validArtifacts.length === 0) {
            res.status(400).json({ error: 'No valid catalog items detected in checkout payload' });
            return;
        }

        // Phase 2: Commit Immutable Financial Ledger First (SAGA Inversion)
        await Invoice.create({
            tenantId,
            invoiceNumber,
            totalAmount: totalValuation,
            customerDetails: {
                name: customerName || 'Walk-in Customer',
                phone: customerPhone || '-',
                gstin: customerGstin || '-'
            },
            items: validArtifacts.map((i: any) => ({
                productId: i.id,
                name: i.name,
                qty: i.qty,
                price: i.price
            }))
        });

        // Phase 3: Execute Vulnerable Stock Deductions
        for (const { product, qty, name } of validArtifacts) {
            product.currentStock = product.currentStock - qty;
            await product.save();

            await StockMovement.create({
                tenantId,
                productId: product._id,
                productName: product.name,
                type: 'Sale',
                quantityOut: qty,
                quantityIn: 0,
                balanceAfter: product.currentStock,
                referenceId: invoiceNumber,
                performedBy: (req as any).user?.userId || tenantId,
                notes: `POS Checkout (${customerName || 'Walk-in'})`
            });
        }

        res.status(200).json({
            message: 'Checkout successful',
            invoiceNumber,
            date: new Date().toISOString(),
            items,
            customerDetails: {
                name: customerName || 'Walk-in Customer',
                phone: customerPhone || '-',
                gstin: customerGstin || '-'
            },
            totalValuation
        });

    } catch (e: any) {
        console.error("Checkout Error:", e);
        try { require('fs').appendFileSync('debug.log', new Date().toISOString() + '\\n' + (e.stack || e.message) + '\\n\\n'); } catch (err) { }
        res.status(500).json({ error: 'Internal Server Checkout Error', detail: e.message, stack: e.stack });
    }
});

// GET /api/inventory/invoices
// Fetch all historical invoice ledgers
router.get('/invoices', requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const tenantId = (req as any).user.tenantId;
        const invoices = await Invoice.find({ tenantId })
            .sort({ createdAt: -1 })
            .limit(100);
        res.status(200).json(invoices);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
