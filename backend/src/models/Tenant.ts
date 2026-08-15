import mongoose, { Schema, Document } from 'mongoose';

export interface ITenant extends Document {
    tenantId: string;
    businessName: string;
    gstin?: string;
    subscriptionStatus: 'active' | 'suspended' | 'trial';
    createdAt: Date;
}

const tenantSchema = new Schema({
    tenantId: { type: String, required: true, unique: true, index: true },
    businessName: { type: String, required: true },
    gstin: { type: String },
    subscriptionStatus: { type: String, enum: ['active', 'suspended', 'trial'], default: 'trial' },
}, { timestamps: true });

export default mongoose.model<ITenant>('Tenant', tenantSchema);
