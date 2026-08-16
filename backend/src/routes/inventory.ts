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

        products.forEach(p => {
            totalItems += p.currentStock;
            valuation += (p.currentStock * p.sellingPrice);
            if (p.currentStock <= p.reorderLevel) lowStockAlerts++;
        });

        res.status(200).json({ totalItems, lowStockAlerts, valuation, skus: products.length });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
