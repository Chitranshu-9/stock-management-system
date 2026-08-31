import { useEffect, useState } from 'react';
import { FileText, Eye, LogOut, ArrowRight, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/endpoints';

export default function SalesLog({ onScanClick }: { onScanClick?: () => void }) {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const res = await fetch(API_ENDPOINTS.INVENTORY.INVOICES);
                if (res.ok) {
                    const data = await res.json();
                    setInvoices(data);
                }
            } catch (err) {
                // silently fail or rely on UI
            } finally {
                setLoading(false);
            }
        };
        fetchInvoices();
    }, []);

    const viewInvoice = (invoice: any) => {
        // Normalize MongoDB document schema perfectly intercepting frontend receipt template mappings
        const normalizedData = {
            invoiceNumber: invoice.invoiceNumber,
            date: invoice.createdAt,
            totalValuation: invoice.totalAmount,
            customerDetails: invoice.customerDetails,
            items: invoice.items
        };
        navigate('/sales/invoice', { state: { invoiceData: normalizedData } });
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Sales & Invoice History</h1>
                    <p className="text-muted-foreground text-sm mt-1">Track all your unified business billing history.</p>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
                            <tr>
                                <th className="px-6 py-4">Invoice No</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Customer Name</th>
                                <th className="px-6 py-4">Items</th>
                                <th className="px-6 py-4">Total Amount</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                        Loading ledger history...
                                    </td>
                                </tr>
                            ) : invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <FileText className="w-10 h-10 text-muted-foreground/30" />
                                            <p className="text-muted-foreground font-medium">No sales recorded yet.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((inv) => (
                                    <tr key={inv._id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-foreground">
                                            {inv.invoiceNumber}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {new Date(inv.createdAt).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-foreground">{inv.customerDetails?.name || 'Walk-in'}</span>
                                        </td>
                                        <td className="px-6 py-4 max-w-[200px]">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-xs text-foreground">{inv.items?.length || 0} Items</span>
                                                <span className="text-xs text-muted-foreground truncate" title={inv.items?.map((i: any) => i.name).join(', ')}>
                                                    {inv.items?.map((i: any) => i.name).join(', ')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-semibold">
                                            ₹ {inv.totalAmount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => viewInvoice(inv)}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
                                            >
                                                <Eye className="w-4 h-4" /> View Invoice
                                            </button>
                                        </td>
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
