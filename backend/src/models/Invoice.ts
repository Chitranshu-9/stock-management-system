import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceItem {
    productId: mongoose.Types.ObjectId;
    name: string;
    qty: number;
    price: number;
}

export interface IInvoice extends Document {
    tenantId: mongoose.Types.ObjectId;
    invoiceNumber: string;
    totalAmount: number;
    customerDetails: {
        name: string;
        phone: string;
        gstin: string;
    };
    items: IInvoiceItem[];
    createdAt: Date;
    updatedAt: Date;
}

const invoiceSchema = new Schema({
    tenantId: { type: String, required: true, index: true },
    invoiceNumber: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    customerDetails: {
        name: { type: String, default: '' },
        phone: { type: String, default: '' },
        gstin: { type: String, default: '' }
    },
    items: [{
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        name: { type: String, required: true },
        qty: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 }
    }]
}, { timestamps: true });

export default mongoose.model<IInvoice>('Invoice', invoiceSchema);
