import mongoose, { Document, Schema } from 'mongoose';

export interface IStockMovement extends Document {
    tenantId: string;
    productId: mongoose.Types.ObjectId;
    productName: string; // denormalization for fast ledger queries
    type: 'Purchase' | 'Sale' | 'Adjustment' | 'Transfer';
    referenceId: string; // e.g. Invoice Number, PO Number, or System Override ID
    quantityIn: number;
    quantityOut: number;
    balanceAfter: number; // Snapshot of the stock at this exact moment
    performedBy: mongoose.Types.ObjectId | string; // User ID or 'System'
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const StockMovementSchema = new Schema<IStockMovement>({
    tenantId: { type: String, required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    productName: { type: String, required: true },
    type: { type: String, enum: ['Purchase', 'Sale', 'Adjustment', 'Transfer'], required: true },
    referenceId: { type: String, required: true },
    quantityIn: { type: Number, default: 0 },
    quantityOut: { type: Number, default: 0 },
    balanceAfter: { type: Number, required: true },
    performedBy: { type: Schema.Types.Mixed, required: true },
    notes: { type: String }
}, {
    timestamps: true
});

// Compound index for fast chronological fetching per tenant
StockMovementSchema.index({ tenantId: 1, createdAt: -1 });

export default mongoose.models.StockMovement || mongoose.model<IStockMovement>('StockMovement', StockMovementSchema);
