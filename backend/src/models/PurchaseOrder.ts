import mongoose, { Document, Schema } from 'mongoose';

export type POStatus = 'DRAFT' | 'SUBMITTED' | 'CONFIRMED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';

export interface IPOItem {
    productId: mongoose.Types.ObjectId | string;
    productNameSnapshot: string;
    skuSnapshot: string;
    quantityOrdered: number;
    unitPrice: number; // Final negotiated supplier cost
    taxAmount: number;
    discountAmount: number;
    lineTotal: number;
    quantityReceived: number;
    quantityPending: number;
}

export interface IPurchaseOrder extends Document {
    tenantId: string;
    supplierId: mongoose.Types.ObjectId | string;
    poNumber: string;
    status: POStatus;
    orderDate: Date;
    expectedDeliveryDate?: Date;
    items: IPOItem[];
    subtotal: number;
    totalTax: number;
    totalDiscount: number;
    grandTotal: number;
    notes?: string;
    createdBy: string;
    approvedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

const POItemSchema = new Schema<IPOItem>({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productNameSnapshot: { type: String, required: true },
    skuSnapshot: { type: String, required: true },
    quantityOrdered: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
    quantityReceived: { type: Number, default: 0, min: 0 },
    quantityPending: { type: Number, required: true, min: 0 }
});

const PurchaseOrderSchema = new Schema<IPurchaseOrder>({
    tenantId: { type: String, required: true, index: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    poNumber: { type: String, required: true },
    status: {
        type: String,
        enum: ['DRAFT', 'SUBMITTED', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'],
        default: 'DRAFT',
        index: true
    },
    orderDate: { type: Date, required: true, default: Date.now },
    expectedDeliveryDate: { type: Date },
    items: [POItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    totalTax: { type: Number, default: 0, min: 0 },
    totalDiscount: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    notes: { type: String },
    createdBy: { type: String, required: true },
    approvedBy: { type: String }
}, {
    timestamps: true
});

PurchaseOrderSchema.index({ tenantId: 1, poNumber: 1 }, { unique: true });
PurchaseOrderSchema.index({ tenantId: 1, supplierId: 1, createdAt: -1 });

export default mongoose.models.PurchaseOrder || mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
