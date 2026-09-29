import mongoose, { Document, Schema } from 'mongoose';

export interface IReceiptItem {
    productId: mongoose.Types.ObjectId | string;
    productNameSnapshot: string;
    quantityReceived: number;
    costIncurred: number;
}

export interface IPurchaseReceipt extends Document {
    tenantId: string;
    purchaseOrderId: mongoose.Types.ObjectId | string;
    supplierId: mongoose.Types.ObjectId | string;
    receiptNumber: string;
    receivedDate: Date;
    receivedItems: IReceiptItem[];
    notes?: string;
    receivedBy: string;
    createdAt: Date;
    updatedAt: Date;
}

const ReceiptItemSchema = new Schema<IReceiptItem>({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productNameSnapshot: { type: String, required: true },
    quantityReceived: { type: Number, required: true, min: 1 },
    costIncurred: { type: Number, required: true, min: 0 }
});

const PurchaseReceiptSchema = new Schema<IPurchaseReceipt>({
    tenantId: { type: String, required: true, index: true },
    purchaseOrderId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true, index: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    receiptNumber: { type: String, required: true },
    receivedDate: { type: Date, required: true, default: Date.now },
    receivedItems: [ReceiptItemSchema],
    notes: { type: String },
    receivedBy: { type: String, required: true }
}, {
    timestamps: true
});

PurchaseReceiptSchema.index({ tenantId: 1, receiptNumber: 1 }, { unique: true });

export default mongoose.models.PurchaseReceipt || mongoose.model<IPurchaseReceipt>('PurchaseReceipt', PurchaseReceiptSchema);
