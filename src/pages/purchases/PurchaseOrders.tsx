import { ShoppingBag, Plus, Filter, MoreHorizontal } from 'lucide-react';

const mockOrders = [
    { id: 'PO-2026-045', supplier: 'Fresh Mart Suppliers', date: '14 Aug 2026', total: '₹ 45,000', status: 'Pending Delivery' },
    { id: 'PO-2026-044', supplier: 'Agro Distributors', date: '12 Aug 2026', total: '₹ 12,400', status: 'Received' },
    { id: 'PO-2026-043', supplier: 'Global Imports', date: '10 Aug 2026', total: '₹ 89,000', status: 'Received' },
];

export default function PurchaseOrders() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage incoming stock and supplier orders.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
                    <Plus className="w-4 h-4" />
                    Create Order
                </button>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/30">
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-3 py-1.5 border border-input bg-background rounded-md text-sm font-medium hover:bg-secondary transition-colors">
                            <Filter className="w-4 h-4" />
                            Filter Status
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-secondary/50 text-muted-foreground font-medium uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">Order ID</th>
                                <th className="px-6 py-4">Supplier</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4 text-right">Total Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {mockOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                                    <td className="px-6 py-4 font-mono font-medium">{order.id}</td>
                                    <td className="px-6 py-4 font-medium flex items-center gap-2">
                                        <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                                        {order.supplier}
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">{order.date}</td>
                                    <td className="px-6 py-4 font-medium text-right">{order.total}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${order.status === 'Received' ? 'bg-success/15 text-success' : 'bg-orange-500/15 text-orange-600'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-muted-foreground hover:text-foreground p-1 transition-colors">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
