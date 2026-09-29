import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import PurchaseOrder, { IPOItem } from '../models/PurchaseOrder';
import PurchaseReceipt from '../models/PurchaseReceipt';
import Product from '../models/Product';
import StockMovement from '../models/StockMovement';
import mongoose from 'mongoose';

const router = Router();

// GET /api/purchases (List Purchase Orders)
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const tenantId = (req as any).user.tenantId;
        const status = req.query.status as string;

        let query: any = { tenantId };
        if (status) query.status = status;

        const pos = await PurchaseOrder.find(query)
            .populate('supplierId', 'businessName contactPerson')
            .sort({ createdAt: -1 })
            .limit(100);

        res.status(200).json(pos);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/purchases (Create new PO)
router.post('/', requireAuth, requireRole('admin', 'manager'), async (req: Request, res: Response): Promise<void> => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { supplierId, expectedDeliveryDate, items, notes } = req.body;

        if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
            res.status(400).json({ error: 'Valid supplier and items array are required.' });
            return;
        }

        let subtotal = 0;
        const poItems: IPOItem[] = [];

        // Validate items securely against native canonical Products
        for (const i of items) {
            const product = await Product.findOne({ _id: i.productId, tenantId });
            if (!product) {
                res.status(404).json({ error: `Product IDs violated isolation scope: ${i.productId}` });
                return;
            }

            const qty = Math.max(1, Number(i.quantity) || 1);
            const price = Number(i.unitPrice);
            if (isNaN(price) || price < 0) {
                res.status(400).json({ error: `Malicious pricing vector identified on ${product.name}` });
                return;
            }

            const lineTotal = qty * price;
            subtotal += lineTotal;

            poItems.push({
                productId: product._id.toString(),
                productNameSnapshot: product.name,
                skuSnapshot: product.sku,
                quantityOrdered: qty,
                unitPrice: price,
                taxAmount: 0,
                discountAmount: 0,
                lineTotal: lineTotal,
                quantityReceived: 0,
                quantityPending: qty
            });
        }

        const poNumber = `PO-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 90 + 10)}`;

        const po = await PurchaseOrder.create({
            tenantId,
            supplierId,
            poNumber,
            status: 'DRAFT',
            expectedDeliveryDate: expectedDeliveryDate || undefined,
            items: poItems,
            subtotal,
            totalTax: 0,
            totalDiscount: 0,
            grandTotal: subtotal,
            notes,
            createdBy: (req as any).user.userId
        });

        res.status(201).json(po);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// PUT /api/purchases/:id/status (Transition PO Status gracefully)
router.put('/:id/status', requireAuth, requireRole('admin', 'manager'), async (req: Request, res: Response): Promise<void> => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { status } = req.body;
        const validStatuses = ['DRAFT', 'SUBMITTED', 'CONFIRMED', 'CANCELLED']; // Prevent explicit force into RECEIVED

        if (!validStatuses.includes(status)) {
            res.status(400).json({ error: 'Unpermitted architectural trace mutation transition requested.' });
            return;
        }

        const po = await PurchaseOrder.findOneAndUpdate(
            { _id: req.params.id, tenantId },
            { $set: { status } },
            { new: true }
        );

        res.status(200).json(po);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});


// POST /api/purchases/:id/receive (Crucial Inventory Receipt Mechanism)
router.post('/:id/receive', requireAuth, requireRole('admin', 'manager'), async (req: Request, res: Response): Promise<void> => {
    // Explicit Idempotency & Transactional limits required!
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const tenantId = (req as any).user.tenantId;
        const poId = req.params.id;
        const { receivingItems, notes } = req.body;
        // receivingItems: [{ productId, qtyToReceive }]

        if (!receivingItems || !Array.isArray(receivingItems)) {
            res.status(400).json({ error: 'Valid payload structure describing {productId, qtyToReceive} limits required.' });
            return;
        }

        const po = await PurchaseOrder.findOne({ _id: poId, tenantId }).session(session);
        if (!po) {
            throw new Error('Purchase Order untracked or outside tenant isolate bounds.');
        }

        if (po.status === 'RECEIVED' || po.status === 'CANCELLED') {
            throw new Error(`Cannot receive securely against constraints: PO is currently ${po.status}`);
        }

        const receiptNumber = `RCV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 90 + 10)}`;
        const receiptItemsPayload = [];

        // Compute mutations over items implicitly modifying MongoDB arrays
        for (const incoming of receivingItems) {
            const incomingQty = Number(incoming.qtyToReceive) || 0;
            if (incomingQty <= 0) continue; // Skip zero deliveries

            // Verify the Item actually tracks natively on the PO schema!
            const idx = po.items.findIndex((existing: any) => existing.productId.toString() === incoming.productId);
            if (idx === -1) {
                throw new Error(`Unauthorized receipt item tracking violation: Product ID ${incoming.productId} not located natively.`);
            }

            const itemBoundary = po.items[idx];

            if (incomingQty > itemBoundary.quantityPending) {
                throw new Error(`Critical over-receipt blocked: ${itemBoundary.productNameSnapshot} restricts merely ${itemBoundary.quantityPending} pending limit capacities.`);
            }

            // Acknowledge Receipt Natively
            itemBoundary.quantityReceived += incomingQty;
            itemBoundary.quantityPending -= incomingQty;

            receiptItemsPayload.push({
                productId: itemBoundary.productId,
                productNameSnapshot: itemBoundary.productNameSnapshot,
                quantityReceived: incomingQty,
                costIncurred: incomingQty * itemBoundary.unitPrice
            });

            // >>> NATIVE STOCK MOVEMENT DRIFT ENFORCIBILITY <<<
            const internalCoreProduct = await Product.findOne({ _id: itemBoundary.productId }).session(session);
            if (internalCoreProduct) {
                internalCoreProduct.currentStock += incomingQty;
                await internalCoreProduct.save({ session }); // Crucial sequential persistence

                // Generate strictly integrated Audit Trail tracking precisely to original systems 
                await StockMovement.create([{
                    tenantId,
                    productId: internalCoreProduct._id,
                    productName: internalCoreProduct.name,
                    type: 'Purchase',
                    quantityIn: incomingQty,
                    quantityOut: 0,
                    balanceAfter: internalCoreProduct.currentStock,
                    referenceId: receiptNumber, // Points strictly to the granular receipt block!
                    performedBy: (req as any).user.userId,
                    notes: notes || `Inbound PO Receipt execution bounds mapping: ${po.poNumber}`
                }], { session });
            }
        }

        if (receiptItemsPayload.length === 0) {
            throw new Error('No valid positive integers identified to execute bounded transactions.');
        }

        // Validate PO Completion Bounds mapping precisely natively 
        const totalPending = po.items.reduce((sum: number, item: any) => sum + item.quantityPending, 0);
        po.status = totalPending === 0 ? 'RECEIVED' : 'PARTIALLY_RECEIVED';

        await po.save({ session });

        // Save chronological audit receipt layer explicitly securing historic arrays natively!
        const receipt = await PurchaseReceipt.create([{
            tenantId,
            purchaseOrderId: po._id,
            supplierId: po.supplierId,
            receiptNumber,
            receivedItems: receiptItemsPayload,
            notes,
            receivedBy: (req as any).user.userId
        }], { session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json(receipt[0]);
    } catch (e: any) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ error: e.message || 'Fatal Transaction Rollback Executed Securely.' });
    }
});

// GET /api/purchases/:id (Fetch Detailed PO explicitly mapping Receipts directly)
router.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const tenantId = (req as any).user.tenantId;
        const po = await PurchaseOrder.findOne({ _id: req.params.id, tenantId })
            .populate('supplierId', 'businessName contactPerson email phone');

        if (!po) {
            res.status(404).json({ error: 'Not Found' });
            return;
        }

        const receipts = await PurchaseReceipt.find({ purchaseOrderId: po._id, tenantId }).sort({ createdAt: -1 });

        res.status(200).json({ po, receipts });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
