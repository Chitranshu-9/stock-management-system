import mongoose, { Document, Schema } from 'mongoose';

export interface ISupplierProduct extends Document {
    tenantId: string;
    supplierId: mongoose.Types.ObjectId | string;
    productId: mongoose.Types.ObjectId | string;
    supplierSku?: string;
    supplierProductName?: string;
    supplierPurchasePrice: number;
    currency: string;
    minimumOrderQuantity: number;
    packSize?: string;
    leadTimeDays?: number;
    isPreferred: boolean;
    isActive: boolean;
    lastPurchasedPrice?: number;
    lastPurchasedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const SupplierProductSchema = new Schema<ISupplierProduct>({
    tenantId: { type: String, required: true, index: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    supplierSku: { type: String, trim: true },
    supplierProductName: { type: String, trim: true },
    supplierPurchasePrice: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    minimumOrderQuantity: { type: Number, default: 1, min: 1 },
    packSize: { type: String },
    leadTimeDays: { type: Number, default: 0, min: 0 },
    isPreferred: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastPurchasedPrice: { type: Number, min: 0 },
    lastPurchasedAt: { type: Date }
}, {
    timestamps: true
});

// A product should only be mapped to a specific supplier once intrinsically
SupplierProductSchema.index({ tenantId: 1, supplierId: 1, productId: 1 }, { unique: true });

export default mongoose.models.SupplierProduct || mongoose.model<ISupplierProduct>('SupplierProduct', SupplierProductSchema);
