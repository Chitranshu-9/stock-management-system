import { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Loader2 } from 'lucide-react';

interface StockMovement {
    _id: string;
    type: 'Purchase' | 'Sale' | 'Adjustment' | 'Transfer';
    referenceId: string;
    productName: string;
    quantityIn: number;
    quantityOut: number;
    balanceAfter: number;
    performedBy: string;
    createdAt: string;
}

export default function InventoryLedger() {
    const [ledger, setLedger] = useState<StockMovement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/inventory/ledger')
            .then(res => {
                if (!res.ok) throw new Error("Failed to authenticate Ledger access");
                return res.json();
            })
            .then(data => {
                setLedger(data);
                setLoading(false);
            })
            .catch(e => {
                setError(e.message);
                setLoading(false);
            });
    }, []);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Sale': return <ArrowUpRight className="w-4 h-4 text-destructive" />;
            case 'Purchase': return <ArrowDownLeft className="w-4 h-4 text-success" />;
            case 'Adjustment': return <ArrowRightLeft className="w-4 h-4 text-orange-500" />;
            default: return <ArrowRightLeft className="w-4 h-4 text-blue-500" />;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Stock Ledger</h1>
                <p className="text-muted-foreground text-sm mt-1">Detailed history of all stock movements and transactions.</p>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-border flex gap-4">
                    <input
                        type="date"
                        className="px-3 py-1.5 border border-input rounded-md text-sm bg-background text-foreground"
                    />
                    <button className="px-3 py-1.5 border border-input bg-background rounded-md text-sm font-medium hover:bg-secondary transition-colors">
                        Filter by Movement Type
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-secondary/50 text-muted-foreground font-medium uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Transaction ID</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Product</th>
                                <th className="px-6 py-4 text-right text-success">Stock In</th>
                                <th className="px-6 py-4 text-right text-destructive">Stock Out</th>
                                <th className="px-6 py-4 text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-10"><Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" /></td></tr>
                            ) : error ? (
                                <tr><td colSpan={7} className="text-center py-10 text-destructive">{error}</td></tr>
                            ) : ledger.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">No ledger transactions recorded yet.</td></tr>
                            ) : (
                                ledger.map((trx) => (
                                    <tr key={trx._id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4 text-muted-foreground">{new Date(trx.createdAt).toLocaleDateString()} {new Date(trx.createdAt).toLocaleTimeString()}</td>
                                        <td className="px-6 py-4 font-mono font-medium">{trx.referenceId}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {getTypeIcon(trx.type)}
                                                <span>{trx.type}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium">{trx.productName}</td>
                                        <td className="px-6 py-4 text-right text-success font-medium">{trx.quantityIn > 0 ? `+${trx.quantityIn}` : '-'}</td>
                                        <td className="px-6 py-4 text-right text-destructive font-medium">{trx.quantityOut > 0 ? `-${trx.quantityOut}` : '-'}</td>
                                        <td className="px-6 py-4 text-right font-bold">{trx.balanceAfter}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
