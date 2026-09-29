import mongoose, { Document, Schema } from 'mongoose';

export interface ISupplier extends Document {
    tenantId: string;
    businessName: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    gstin?: string;
    pan?: string;
    paymentTerms?: string;
    creditLimit?: number;
    notes?: string;
    isActive: boolean;
    createdBy?: string;
    updatedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>({
    tenantId: { type: String, required: true, index: true },
    businessName: { type: String, required: true, trim: true },
    contactPerson: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String },
    gstin: { type: String, trim: true },
    pan: { type: String, trim: true },
    paymentTerms: { type: String },
    creditLimit: { type: Number, default: 0, min: 0 },
    notes: { type: String },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String },
    updatedBy: { type: String }
}, {
    timestamps: true
});

SupplierSchema.index({ tenantId: 1, businessName: 1 });

export default mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema);
