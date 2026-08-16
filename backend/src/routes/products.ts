import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '../middleware/auth';
import Product from '../models/Product';

const router = Router();

// Hook native hard disk
const storageDir = path.join(__dirname, '../../uploads/ai-training');
if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, storageDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'crop_' + uniqueSuffix + '.png');
    }
});
const upload = multer({ storage });

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
            currentStock: Number(stockLevel) || 0,
            reorderLevel: 5
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
        const search = req.query.search as string;

        let query: any = { tenantId };
        if (search) {
            query.name = { $regex: new RegExp(search, 'i') };
        }

        const products = await Product.find(query).limit(search ? 15 : 100).sort({ createdAt: -1 });
        res.status(200).json(products);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/products/ai-ingest
router.post('/ai-ingest', requireAuth, upload.single('image'), async (req: Request, res: Response): Promise<void> => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { name, sku, category } = req.body;

        if (!name) {
            res.status(400).json({ error: 'Valid Name required.' });
            return;
        }

        const imagePath = req.file ? `/uploads/ai-training/${req.file.filename}` : null;

        // Prefer explicit SKU if forced, otherwise generate
        const targetSku = sku || `SKU-AI-${Math.floor(Math.random() * 90000) + 10000}`;
        let product = await Product.findOne({ tenantId, sku: targetSku });

        if (!product) {
            product = await Product.create({
                tenantId,
                name,
                sku: targetSku,
                category: category || 'General-Scanned',
                purchasePrice: 0,
                sellingPrice: 0,
                currentStock: 1,
                aiTrainingImages: imagePath ? [imagePath] : []
            });
        } else if (imagePath) {
            if (!product.aiTrainingImages) {
                product.aiTrainingImages = [];
            }
            product.aiTrainingImages.push(imagePath);
            product.currentStock += 1; // Native counting increment
            await product.save();
        }

        if (imagePath) {
            try {
                await fetch('http://127.0.0.1:8002/api/v2/embeddings/enroll', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image_path: imagePath, sku: product.sku, name: product.name })
                });
            } catch (err: any) {
                console.warn("Failed to instantly cache RAG Embedding:", err.message);
            }
        }

        res.status(201).json(product);
    } catch (e: any) {
        console.error("AI Ingest Fault:", e);
        res.status(500).json({ error: e.message });
    }
});

// GET /api/products/bootstrap-ai
router.get('/bootstrap-ai', async (req: Request, res: Response): Promise<void> => {
    try {
        const products = await Product.find({ aiTrainingImages: { $exists: true, $not: { $size: 0 } } });
        let count = 0;
        for (const p of products) {
            if (p.aiTrainingImages && p.aiTrainingImages.length > 0) {
                for (const img of p.aiTrainingImages) {
                    try {
                        await fetch('http://127.0.0.1:8002/api/v2/embeddings/enroll', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ image_path: img, sku: p.sku, name: p.name })
                        });
                        count++;
                    } catch (e) { }
                }
            }
        }
        res.status(200).json({ status: "Success", cached: count });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
