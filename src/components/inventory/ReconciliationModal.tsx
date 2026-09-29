import { useState } from 'react';
import { X, Save, KeyRound } from 'lucide-react';
import { useNetworkQueue } from '../../contexts/NetworkQueueContext';
import { API_ENDPOINTS } from '../../config/endpoints';

interface Props {
    product: {
        _id: string;
        name: string;
        currentStock: number;
    };
    onClose: () => void;
    onSuccess: () => void;
}

export default function ReconciliationModal({ product, onClose, onSuccess }: Props) {
    const [physicalCount, setPhysicalCount] = useState(product.currentStock.toString());
    const [reason, setReason] = useState('Adjustment');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { enqueueJob } = useNetworkQueue();

    const variance = Number(physicalCount) - product.currentStock;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const idempotencyKey = `ADJ-${product._id}-${Date.now()}`;

        enqueueJob(
            API_ENDPOINTS.INVENTORY.ADJUST,
            'POST',
            {
                productId: product._id,
                physicalCount: Number(physicalCount),
                reason,
                notes,
                idempotencyKey
            },
            {
                onSuccess: () => {
                    setIsSubmitting(false);
                    onSuccess();
                },
                onError: (err) => {
                    setIsSubmitting(false);
                    alert("Adjustment encountered an error: " + err.message);
                }
            }
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="bg-card w-full max-w-lg rounded-xl shadow-lg border border-border p-6 flex flex-col relative">
                <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold tracking-tight mb-1">Stock Reconciliation</h2>
                <p className="text-sm text-muted-foreground mb-6">Modify stock implicitly creating an Immutable Audit Ledger bounded directly to this action.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Product</label>
                        <input className="w-full h-10 mt-1 px-3 border border-input rounded-md bg-secondary text-foreground text-sm cursor-not-allowed" disabled value={product.name} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">System Quantity</label>
                            <input className="w-full h-10 mt-1 px-3 border border-input rounded-md bg-secondary text-foreground text-sm font-bold cursor-not-allowed" disabled value={product.currentStock} />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Physical Count</label>
                            <input type="number" required className="w-full h-10 mt-1 px-3 border border-input rounded-md bg-background focus:ring-1 focus:ring-primary focus:border-primary text-sm font-bold" value={physicalCount} onChange={e => setPhysicalCount(e.target.value)} />
                        </div>
                    </div>

                    <div className={`p-4 rounded-lg flex items-center justify-between border ${variance > 0 ? 'bg-success/10 border-success/20' : variance < 0 ? 'bg-destructive/10 border-destructive/20' : 'bg-secondary border-border'}`}>
                        <span className="text-sm font-medium">Calculated Variance</span>
                        <span className={`text-lg font-bold ${variance > 0 ? 'text-success' : variance < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {variance > 0 ? '+' : ''}{variance}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">Reason Code</label>
                            <select
                                className="w-full h-10 px-3 border border-input bg-background rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                                value={reason} onChange={e => setReason(e.target.value)}
                            >
                                <option value="Adjustment">Standard Adjustment</option>
                                <option value="Damage">Damaged Goods</option>
                                <option value="Wastage">Wastage / Lost</option>
                                <option value="Opening_Stock">Found / Opening Stock</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">Audit Notes</label>
                            <input type="text" placeholder="Required for Audit..." required className="w-full h-10 px-3 border border-input bg-background rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary" value={notes} onChange={e => setNotes(e.target.value)} />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-border mt-4">
                        <span className="flex-1 flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                            <KeyRound className="w-3 h-3" /> Immutable Audit Artifact
                        </span>
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium border border-input bg-background hover:bg-secondary rounded-md ml-auto disabled:opacity-50">Cancel</button>
                        <button type="submit" disabled={variance === 0 || isSubmitting} className="flex items-center gap-2 px-6 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md disabled:opacity-50">
                            <Save className="w-4 h-4" />
                            {isSubmitting ? 'Applying...' : 'Apply Variance'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
