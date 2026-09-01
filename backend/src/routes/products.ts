import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '../middleware/auth';
import Product from '../models/Product';
import StockMovement from '../models/StockMovement';
import { grpcEnrollEmbedding } from '../grpc-client';

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
        res.status(500).json({ error: e.message || 'Creation error' });
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

        // Standard lightweight network query mapping
        const products = await Product.find(query)
            .limit(search ? 15 : 100)
            .sort({ createdAt: -1 });

        res.status(200).json(products);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/products/ai-ingest
router.post('/ai-ingest', requireAuth, upload.single('image'), async (req: Request, res: Response): Promise<void> => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { name, sku, category, quantity } = req.body;

        const numericQty = quantity ? parseInt(quantity, 10) : 1;
        const finalQty = isNaN(numericQty) || numericQty < 1 ? 1 : numericQty;

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
                currentStock: finalQty,
                aiTrainingImages: imagePath ? [imagePath] : []
            });

            // Generate Native Ledger Bootstrap
            await StockMovement.create({
                tenantId,
                productId: product._id,
                productName: product.name,
                type: 'Adjustment',
                referenceId: `AI-BOOT-${Date.now()}`,
                quantityIn: finalQty,
                quantityOut: 0,
                balanceAfter: finalQty,
                performedBy: (req as any).user.email || 'AI'
            });

        } else {
            if (imagePath) {
                if (!product.aiTrainingImages) {
                    product.aiTrainingImages = [];
                }
                product.aiTrainingImages.push(imagePath);
            }

            product.currentStock += finalQty; // Dynamic counting increment independently of imagery
            await product.save();

            // Generate Native Ledger Adjustments
            await StockMovement.create({
                tenantId,
                productId: product._id,
                productName: product.name,
                type: 'Adjustment',
                referenceId: `AI-SCAN-${Date.now()}`,
                quantityIn: finalQty,
                quantityOut: 0,
                balanceAfter: product.currentStock,
                performedBy: (req as any).user.email || 'AI'
            });
        }

        if (imagePath) {
            // Fire-and-Forget Asynchronous gRPC Execution!
            // Do NOT 'await' this gRPC payload. Instantly return a 201 to the React client 
            // and let Node.js resolve the PyTorch Protocol Buffer asynchronously in the background.
            grpcEnrollEmbedding(
                imagePath,
                product.sku,
                product.name,
                product._id.toString(),
                tenantId
            ).catch((err: any) => {
                // Silently drop
            });
        }

        res.status(201).json(product);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/products/bootstrap-ai
router.get('/bootstrap-ai', async (req: Request, res: Response): Promise<void> => {
    try {
        // Query products possessing Native Legacy Images, since ChromaDB stores all vectors persistently.
        const products = await Product.find({
            aiTrainingImages: { $exists: true, $not: { $size: 0 } }
        });

        let count = 0;

        for (const p of products) {
            const hasLegacy = p.aiTrainingImages && p.aiTrainingImages.length > 0;

            if (hasLegacy) {
                for (const img of (p.aiTrainingImages || [])) {
                    try {
                        const enrollRes = await grpcEnrollEmbedding(
                            img,
                            p.sku,
                            p.name,
                            p._id.toString(),
                            p.tenantId
                        );
                        if (enrollRes && enrollRes.status === 'success') count++;
                    } catch (e) { }
                }
            }
        }
        res.status(200).json({ status: "Success", cached: count, vector_db_mode: "ChromaDB" });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
