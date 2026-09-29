import React, { useState, useEffect } from 'react';
import { PackageSearch, FileText, CheckCircle2, Factory, Loader2, Plus, CornerDownRight } from 'lucide-react';
import { API_ENDPOINTS } from '../../config/endpoints';

export default function PurchaseOrders() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Draft Create Flow
    const [isDrafting, setIsDrafting] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState('');
    const [products, setProducts] = useState<any[]>([]);
    const [cart, setCart] = useState<any[]>([]);
    const [searchProductQuery, setSearchProductQuery] = useState('');
    const [draftNotes, setDraftNotes] = useState('');

    // Receiving Flow
    const [receivePO, setReceivePO] = useState<any | null>(null);
    const [receiveQuantities, setReceiveQuantities] = useState<Record<string, number>>({});
    const [isReceiving, setIsReceiving] = useState(false);

    const fetchPOs = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(API_ENDPOINTS.PURCHASES.BASE, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Unresolved mapping onto PO datasets natively.');
            const data = await res.json();
            setOrders(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchDraftPrerequisites = async () => {
        try {
            const token = localStorage.getItem('token');
            const [supRes, prodRes] = await Promise.all([
                fetch(API_ENDPOINTS.SUPPLIERS.BASE, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(API_ENDPOINTS.PRODUCTS.BASE, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            setSuppliers(await supRes.json());
            setProducts(await prodRes.json());
        } catch (e: any) {
            setError('Failed to instantiate prerequisites: ' + e.message);
        }
    };

    useEffect(() => {
        fetchPOs();
    }, []);

    const startDrafting = () => {
        setIsDrafting(true);
        fetchDraftPrerequisites();
    };

    const handleAddProduct = (p: any, priceTarget = 0) => {
        const nativePrice = priceTarget > 0 ? priceTarget : (p.purchasePrice || p.sellingPrice || 0);
        if (cart.find(c => c.productId === p._id)) return;
        setCart([...cart, { productId: p._id, name: p.name, quantity: 1, unitPrice: nativePrice }]);
    };

    const updateCartQty = (id: string, qty: number) => {
        setCart(cart.map(c => c.productId === id ? { ...c, quantity: Math.max(1, qty) } : c));
    };

    const submitPO = async () => {
        if (!selectedSupplierId || cart.length === 0) return;
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(API_ENDPOINTS.PURCHASES.BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    supplierId: selectedSupplierId,
                    items: cart,
                    notes: draftNotes
                })
            });
            if (!res.ok) throw new Error('Transaction block rejected natively upon draft resolution.');
            await fetchPOs();
            setIsDrafting(false);
            setCart([]);
            setSelectedSupplierId('');
            setDraftNotes('');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleExecuteReceipt = async () => {
        if (!receivePO) return;
        setIsReceiving(true);
        setError('');

        try {
            const payloadItems = Object.entries(receiveQuantities)
                .map(([productId, qtyToReceive]) => ({
                    productId,
                    qtyToReceive: Number(qtyToReceive)
                }))
                .filter(item => item.qtyToReceive > 0);

            if (payloadItems.length === 0) throw new Error("No quantities provided natively for receipt interception.");

            const token = localStorage.getItem('token');
            const res = await fetch(`${API_ENDPOINTS.PURCHASES.BASE}/${receivePO._id}/receive`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ receivingItems: payloadItems })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Fatal execution boundary violation on receipt.");
            }

            await fetchPOs();
            setReceivePO(null);
            setReceiveQuantities({});
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsReceiving(false);
        }
    };

    const openReceiveDrawer = (po: any) => {
        setReceivePO(po);
        const defaults: Record<string, number> = {};
        po.items.forEach((item: any) => {
            defaults[item.productId] = 0; // Initialize at 0 natively
        });
        setReceiveQuantities(defaults);
    };

    const getStatusRenderer = (status: string) => {
        switch (status) {
            case 'DRAFT': return <span className="px-2.5 py-1 bg-secondary text-muted-foreground text-xs font-bold rounded-md border border-border">Draft Matrix</span>;
            case 'RECEIVED': return <span className="px-2.5 py-1 bg-success/20 text-success text-xs font-bold rounded-md border border-success/30">Cleared Inventory</span>;
            case 'PARTIALLY_RECEIVED': return <span className="px-2.5 py-1 bg-yellow-500/20 text-yellow-600 text-xs font-bold rounded-md border border-yellow-500/30">Transiting Pipeline</span>;
            case 'CANCELLED': return <span className="px-2.5 py-1 bg-destructive/10 text-destructive text-xs font-bold rounded-md border border-destructive/20">Cancelled</span>;
            default: return <span className="px-2.5 py-1 bg-primary/20 text-primary text-xs font-bold rounded-md border border-primary/30">Action Submitted</span>;
        }
    }

    if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    if (isDrafting) {
        return (
            <div className="space-y-6 max-w-5xl mx-auto pb-10">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                    <button onClick={() => setIsDrafting(false)} className="px-4 py-2 bg-secondary text-muted-foreground rounded-lg hover:bg-secondary/80 font-medium transition-colors">← Discard</button>
                    <h1 className="text-2xl font-bold tracking-tight">Draft Procurement Execution</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
                            <h2 className="text-sm font-semibold mb-3 text-foreground">Attach Destination Supplier Layer</h2>
                            <select value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)} className="w-full p-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/50">
                                <option value="">Select Vendor Entity...</option>
                                {suppliers.map(s => <option key={s._id} value={s._id}>{s.businessName}</option>)}
                            </select>
                        </div>

                        <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
                            <h2 className="text-sm font-semibold mb-3 text-foreground flex justify-between items-center">
                                <span>Cart Matrix Mapping</span>
                                <span className="text-xs text-muted-foreground font-normal">{cart.length} modules attached</span>
                            </h2>
                            {cart.length > 0 ? (
                                <div className="border border-border rounded-lg divide-y divide-border">
                                    {cart.map(c => (
                                        <div key={c.productId} className="p-3 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                                            <div className="flex items-center flex-1">
                                                <div className="font-semibold text-sm text-foreground">{c.name}</div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col text-right">
                                                    <span className="text-xs text-muted-foreground block">Cost Vector</span>
                                                    <span className="text-sm font-mono text-foreground">₹{c.unitPrice}</span>
                                                </div>
                                                <div className="flex items-center border border-border rounded-lg bg-background">
                                                    <button onClick={() => updateCartQty(c.productId, c.quantity - 1)} className="px-3 py-1 text-muted-foreground">-</button>
                                                    <input type="number" readOnly value={c.quantity} className="w-12 text-center bg-transparent text-sm font-medium border-x border-border focus:outline-none" />
                                                    <button onClick={() => updateCartQty(c.productId, c.quantity + 1)} className="px-3 py-1 text-muted-foreground">+</button>
                                                </div>
                                                <button onClick={() => setCart(cart.filter(x => x.productId !== c.productId))} className="text-destructive p-2 hover:bg-destructive/10 rounded-md">✕</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg bg-secondary/10">No modules appended onto the procurement layer.</div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
                            <h2 className="text-sm font-semibold mb-3 text-foreground">Global Registry Scanner</h2>
                            <input
                                type="text"
                                placeholder="Locate Core Products..."
                                value={searchProductQuery}
                                onChange={e => setSearchProductQuery(e.target.value)}
                                className="w-full p-2 text-sm border border-border rounded-lg mb-3 bg-background focus:outline-none focus:ring-1 focus:ring-primary/50"
                            />
                            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                                {products.filter(p => searchProductQuery ? p.name.toLowerCase().includes(searchProductQuery.toLowerCase()) : true).slice(0, 8).map(p => (
                                    <div key={p._id} onClick={() => handleAddProduct(p)} className="p-2.5 border border-border rounded-lg hover:border-primary/50 hover:bg-primary/5 cursor-pointer flex justify-between items-center group transition-colors">
                                        <div className="truncate pr-2">
                                            <div className="text-sm font-medium text-foreground">{p.name}</div>
                                            <div className="text-xs text-muted-foreground flex gap-2"><span>₹{p.purchasePrice || p.sellingPrice || 0}</span> <span>Stk: {p.currentStock}</span></div>
                                        </div>
                                        <Plus className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <span className="font-semibold text-foreground text-sm">Grand Total Projection</span>
                                <span className="font-bold text-lg text-primary font-mono">₹{cart.reduce((s, c) => s + (c.quantity * c.unitPrice), 0).toLocaleString()}</span>
                            </div>
                            <button
                                onClick={submitPO}
                                disabled={submitting || cart.length === 0 || !selectedSupplierId}
                                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Instantiate PO Matrix'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <FileText className="w-6 h-6 text-primary" /> Purchase Order Ledger
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Audit external acquisition supply chains autonomously directly onto natively bounded receipts</p>
                </div>
                <button
                    onClick={startDrafting}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Draft PO Record
                </button>
            </div>

            {error && <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">{error}</div>}

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
                            <tr>
                                <th className="px-6 py-4 font-semibold tracking-wider">Reference Handle</th>
                                <th className="px-6 py-4 font-semibold tracking-wider">Vendor Layer</th>
                                <th className="px-6 py-4 font-semibold tracking-wider">Time Offset</th>
                                <th className="px-6 py-4 font-semibold tracking-wider">Status Bounds</th>
                                <th className="px-6 py-4 font-semibold tracking-wider text-right">Fund Commitment</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {orders.map((po) => (
                                <tr key={po._id} className="hover:bg-secondary/20 transition-colors">
                                    <td className="px-6 py-4 font-mono font-medium text-foreground">{po.poNumber}</td>
                                    <td className="px-6 py-4 font-semibold text-foreground/90">{po.supplierId?.businessName || 'Orphaned'}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{new Date(po.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">{getStatusRenderer(po.status)}</td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-foreground">₹{po.grandTotal.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right">
                                        {(po.status === 'DRAFT' || po.status === 'SUBMITTED' || po.status === 'PARTIALLY_RECEIVED') && (
                                            <button onClick={() => openReceiveDrawer(po)} className="px-3 py-1.5 bg-primary/10 text-primary font-semibold text-xs rounded border border-primary/20 hover:bg-primary/20 transition-colors">
                                                Execute Receipt
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                        No purchase tracking pipelines detected natively. Construct a draft order manually.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Receipt Modal Component */}
            {receivePO && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-0 backdrop-blur-sm">
                    <div className="bg-card rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden border border-border animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-border bg-secondary/30 flex justify-between items-center">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <CornerDownRight className="w-5 h-5 text-primary" /> Execute Receipt: {receivePO.poNumber}
                            </h2>
                            <button onClick={() => setReceivePO(null)} className="text-muted-foreground hover:bg-secondary p-1 rounded-md">✕</button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-secondary/20 border border-border rounded-lg p-4 mb-4">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground uppercase border-b border-border">
                                        <tr>
                                            <th className="pb-3 font-semibold">SKU Native Identity</th>
                                            <th className="pb-3 text-right font-semibold">Pending Capacity</th>
                                            <th className="pb-3 text-right font-semibold min-w-[120px]">Receiving Volume</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {receivePO.items.filter((i: any) => i.quantityPending > 0).map((item: any) => (
                                            <tr key={item.productId}>
                                                <td className="py-3 font-medium text-foreground">{item.productNameSnapshot}</td>
                                                <td className="py-3 text-right font-mono font-bold text-muted-foreground">{item.quantityPending}</td>
                                                <td className="py-3 text-right">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={item.quantityPending}
                                                        value={receiveQuantities[item.productId] || ''}
                                                        onChange={e => setReceiveQuantities({ ...receiveQuantities, [item.productId]: Number(e.target.value) })}
                                                        className="w-24 px-2 py-1 bg-background text-foreground border border-border rounded text-center text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                        placeholder="0"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setReceivePO(null)} className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary rounded-lg transition-colors">
                                    Abort Integrity Layer
                                </button>
                                <button
                                    onClick={handleExecuteReceipt}
                                    disabled={isReceiving || Object.values(receiveQuantities).every(q => !q || q <= 0)}
                                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-semibold transition-colors disabled:opacity-50 min-w-[160px]"
                                >
                                    {isReceiving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Acknowledge Receipt natively'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
