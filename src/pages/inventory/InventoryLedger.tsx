import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft } from 'lucide-react';

const mockLedger = [
    { id: 'TRX-1092', date: '14 Aug 2026', type: 'Sale', ref: 'INV-8821', product: 'Premium Cooking Oil', qtyIn: 0, qtyOut: 12, balance: 108, user: 'Admin' },
    { id: 'TRX-1091', date: '14 Aug 2026', type: 'Purchase', ref: 'PO-0045', product: 'Herbal Shampoo 200ml', qtyIn: 50, qtyOut: 0, balance: 58, user: 'Warehouse' },
    { id: 'TRX-1090', date: '13 Aug 2026', type: 'Adjustment', ref: 'ADJ-112', product: 'Basmati Rice 5kg', qtyIn: 0, qtyOut: 2, balance: 43, user: 'Manager' },
    { id: 'TRX-1089', date: '13 Aug 2026', type: 'Transfer', ref: 'TRF-009', product: 'Cola Drink 2L', qtyIn: 20, qtyOut: 0, balance: 85, user: 'Manager' },
];

export default function InventoryLedger() {
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
                            {mockLedger.map((trx) => (
                                <tr key={trx.id} className="hover:bg-muted/50 transition-colors">
                                    <td className="px-6 py-4 text-muted-foreground">{trx.date}</td>
                                    <td className="px-6 py-4 font-mono font-medium">{trx.id}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {getTypeIcon(trx.type)}
                                            <span>{trx.type}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium">{trx.product}</td>
                                    <td className="px-6 py-4 text-right text-success font-medium">{trx.qtyIn > 0 ? `+${trx.qtyIn}` : '-'}</td>
                                    <td className="px-6 py-4 text-right text-destructive font-medium">{trx.qtyOut > 0 ? `-${trx.qtyOut}` : '-'}</td>
                                    <td className="px-6 py-4 text-right font-bold">{trx.balance}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
