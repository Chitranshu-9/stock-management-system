import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import Supplier from '../models/Supplier';
import SupplierProduct from '../models/SupplierProduct';
import Product from '../models/Product';

const router = Router();

// GET /api/suppliers (List all valid suppliers)
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const tenantId = (req as any).user.tenantId;
        const suppliers = await Supplier.find({ tenantId }).sort({ businessName: 1 });
        res.status(200).json(suppliers);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/suppliers (Create a new supplier)
router.post('/', requireAuth, requireRole('admin', 'manager'), async (req: Request, res: Response): Promise<void> => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { businessName, contactPerson, phone, email, address, gstin, paymentTerms } = req.body;

        if (!businessName) {
            res.status(400).json({ error: 'Business Name is explicitly required for Master Data creation.' });
            return;
        }

        const supplier = await Supplier.create({
            tenantId,
            businessName,
            contactPerson: contactPerson || undefined,
            phone: phone || undefined,
            email: email || undefined,
            address: address || undefined,
            gstin: gstin || undefined,
            paymentTerms: paymentTerms || undefined,
            createdBy: (req as any).user.userId
        });

        res.status(201).json(supplier);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/suppliers/:id (Fetch singular supplier wrapper)
router.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const tenantId = (req as any).user.tenantId;
        const supplier = await Supplier.findOne({ _id: req.params.id, tenantId });
        if (!supplier) {
            res.status(404).json({ error: 'Supplier not found' });
            return;
        }
        res.status(200).json(supplier);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// PUT /api/suppliers/:id (Update)
router.put('/:id', requireAuth, requireRole('admin', 'manager'), async (req: Request, res: Response): Promise<void> => {
    try {
        const tenantId = (req as any).user.tenantId;
        const body = req.body;
        // Don't modify tenantId dynamically
        delete body.tenantId;

        const supplier = await Supplier.findOneAndUpdate(
            { _id: req.params.id, tenantId },
            { $set: body, updatedBy: (req as any).user.userId },
            { new: true }
        );

        res.status(200).json(supplier);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/suppliers/:id/products (Map canonical Product to Supplier)
router.post('/:id/products', requireAuth, requireRole('admin', 'manager'), async (req: Request, res: Response): Promise<void> => {
    try {
        const tenantId = (req as any).user.tenantId;
        const supplierId = req.params.id;
        const { productId, supplierSku, supplierProductName, supplierPurchasePrice, minimumOrderQuantity } = req.body;

        if (!productId || supplierPurchasePrice === undefined || supplierPurchasePrice < 0) {
            res.status(400).json({ error: 'Valid Product ID and positive cost structure required.' });
            return;
        }

        const canonical = await Product.findOne({ _id: productId, tenantId });
        if (!canonical) {
            res.status(404).json({ error: 'Canonical Core Product not found securely inside tenant bounds.' });
            return;
        }

        let link = await SupplierProduct.findOne({ tenantId, supplierId, productId });
        if (link) {
            link.supplierPurchasePrice = supplierPurchasePrice;
            link.supplierSku = supplierSku;
            link.supplierProductName = supplierProductName;
            link.minimumOrderQuantity = Math.max(1, minimumOrderQuantity || 1);
            await link.save();
        } else {
            link = await SupplierProduct.create({
                tenantId,
                supplierId,
                productId,
                supplierSku,
                supplierProductName,
                supplierPurchasePrice,
                minimumOrderQuantity: Math.max(1, minimumOrderQuantity || 1)
            });
        }

        res.status(201).json(link);
    } catch (e: any) {
        if (e.code === 11000) {
            res.status(409).json({ error: 'Supplier Product relationship identically already tracked natively.' });
        } else {
            res.status(500).json({ error: e.message });
        }
    }
});

// GET /api/suppliers/:id/products (List mappings)
router.get('/:id/products', requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const tenantId = (req as any).user.tenantId;
        const mappings = await SupplierProduct.find({ tenantId, supplierId: req.params.id })
            .populate('productId', 'name sku currentStock unit')
            .sort({ createdAt: -1 });

        res.status(200).json(mappings);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
