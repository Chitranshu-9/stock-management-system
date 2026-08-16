import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
    tenantId: string;
    sku: string;
    name: string;
    description?: string;
    brand?: string;
    category?: string;
    barcode?: string;
    unit: string;
    packSize?: string;
    purchasePrice: number;
    sellingPrice: number;
    mrp: number;
    gstRate: number;
    currentStock: number;
    reorderLevel: number;
    aiTrainingImages?: string[];
}

const productSchema = new Schema({
    tenantId: { type: String, required: true, index: true },
    sku: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    brand: { type: String },
    category: { type: String },
    barcode: { type: String, trim: true },
    unit: { type: String, required: true, default: 'PCS' },
    packSize: { type: String },
    purchasePrice: { type: Number, required: true, default: 0 },
    sellingPrice: { type: Number, required: true, default: 0 },
    mrp: { type: Number, required: true, default: 0 },
    gstRate: { type: Number, required: true, default: 0 },
    currentStock: { type: Number, required: true, default: 0 },
    reorderLevel: { type: Number, required: true, default: 10 },
    aiTrainingImages: [{ type: String }]
}, {
    timestamps: true
});

productSchema.index({ tenantId: 1, sku: 1 }, { unique: true });
export default mongoose.model<IProduct>('Product', productSchema);
