import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import Product from '../models/Product';

const router = Router();

// POST /api/products
router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { name, sku, category, purchasePrice, sellingPrice, stockLevel } = req.body;

        if (!name || !sku) {
            res.status(400).json({ error: 'Name and SKU are required to bind standard catalogs.' });
            return;
        }

        const product = await Product.create({
            tenantId,
            name,
            sku,
            category: category || 'General',
            unit: 'Unit',
            purchasePrice: Number(purchasePrice) || 0,
            sellingPrice: Number(sellingPrice) || 0,
            stockLevel: Number(stockLevel) || 0,
            reorderPoint: 5
        });

        res.status(201).json(product);
    } catch (e: any) {
        console.error("Product Creation Fault:", e);
        res.status(500).json({ error: e.message });
    }
});

// GET /api/products
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const tenantId = (req as any).user.tenantId;
        const products = await Product.find({ tenantId });
        res.status(200).json(products);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
