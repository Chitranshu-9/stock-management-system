import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import StockMovement from '../models/StockMovement';
import Product from '../models/Product';

const router = Router();

// GET /api/inventory/ledger
// Fetch the unified accounting ledger for this specific isolated business tenant
router.get('/ledger', requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const tenantId = (req as any).user.tenantId;

        // Securely bind strictly to only this Business' Ledger
        const ledger = await StockMovement.find({ tenantId })
            .sort({ createdAt: -1 })
            .limit(100);

        res.status(200).json(ledger);
    } catch (e: any) {
        console.error("Ledger Fetch Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// GET /api/inventory/overview
router.get('/overview', requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const tenantId = (req as any).user.tenantId;
        const products = await Product.find({ tenantId });

        let totalItems = 0;
        let lowStockAlerts = 0;
        let valuation = 0;
        const insights: { type: string, message: string }[] = [];

        products.forEach(p => {
            // INVERSION FIX 1: Negative quantities locked out, unscanned AI items default 0 price 
            const safeStock = Math.max(0, p.currentStock);
            totalItems += safeStock;
            valuation += (safeStock * (p.sellingPrice || 0));

            if (p.currentStock <= (p.reorderLevel || 10)) {
                lowStockAlerts++;
                if (insights.length < 3) {
                    insights.push({
                        type: 'Action Required',
                        message: `'${p.name}' is below reorder level (${p.currentStock}/${p.reorderLevel}). Consider resupplying.`
                    });
                }
            }
        });

        // INVERSION FIX 2 & 3: Filter Today's Sales directly from immutable ledgers over Midnight UTC boundaries
        const today = new Date();
        today.setHours(0, 0, 0, 0); // 00:00:00 Local Context

        const todayMovements = await StockMovement.find({
            tenantId,
            type: 'Sale',
            createdAt: { $gte: today }
        });

        // We estimate Today's Revenue if the exact transacted amount isn't logged natively
        // Since StockMovement lacks financial captures initially, we bind to latest Selling Price
        let todaySales = 0;
        const productMap = new Map(products.map(p => [p._id.toString(), p.sellingPrice || 0]));

        todayMovements.forEach(movement => {
            const price = productMap.get(movement.productId.toString()) || 0;
            todaySales += (movement.quantityOut * price);
        });

        // INVERSION 4: 7-Day Chart Building without empty-hole crashing
        const chartData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const dailyMoves = await StockMovement.find({
                tenantId,
                createdAt: { $gte: date, $lt: nextDate }
            });

            let salesStock = 0;
            let addedStock = 0;

            dailyMoves.forEach(m => {
                if (m.type === 'Sale') salesStock += m.quantityOut;
                if (m.type === 'Purchase' || m.type === 'Adjustment') addedStock += m.quantityIn;
            });

            chartData.push({
                name: date.toLocaleDateString('en-US', { weekday: 'short' }),
                sales: salesStock,
                additions: addedStock
            });
        }

        if (insights.length === 0) {
            insights.push({ type: 'General', message: 'All stock levels are optimal.' });
        }

        res.status(200).json({
            totalItems,
            lowStockAlerts,
            valuation,
            skus: products.length,
            todaySales,
            insights,
            chartData
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
