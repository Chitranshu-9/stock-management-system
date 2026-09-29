import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, Building2, Phone, Mail, Edit, Loader2 } from 'lucide-react';
import { API_ENDPOINTS } from '../../config/endpoints';

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({ businessName: '', contactPerson: '', phone: '', email: '', gstin: '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const fetchSuppliers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(API_ENDPOINTS.SUPPLIERS.BASE, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch master suppliers layer natively.');
            const data = await res.json();
            setSuppliers(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(API_ENDPOINTS.SUPPLIERS.BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to generate record naturally.');
            }
            await fetchSuppliers();
            setIsCreateOpen(false);
            setFormData({ businessName: '', contactPerson: '', phone: '', email: '', gstin: '' });
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const filtered = suppliers.filter(s => s.businessName.toLowerCase().includes(search.toLowerCase()) || (s.email && s.email.toLowerCase().includes(search.toLowerCase())));

    if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Truck className="w-6 h-6 text-primary" /> Supplier Directory
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage vendor networks and baseline procurement entities</p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" /> Add Vendor
                </button>
            </div>

            {error && <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">{error}</div>}

            {/* Header / Search Controls */}
            <div className="flex bg-card border border-border p-4 rounded-xl items-center shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="search"
                        placeholder="Search vendors linearly..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
            </div>

            {/* Grid display natively */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(s => (
                    <div key={s._id} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground truncate pr-4">{s.businessName}</h3>
                                    <span className="text-xs text-muted-foreground">{s.isActive ? 'Active Boundary' : 'Inactive'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3 mt-4 text-sm bg-secondary/30 p-4 rounded-lg">
                            <div className="flex items-center gap-3 text-foreground/80">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <span>{s.phone || '—'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-foreground/80">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <span className="truncate">{s.email || '—'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-foreground/80">
                                <div className="font-semibold text-xs text-muted-foreground ml-1">GST</div>
                                <span className="font-mono text-xs">{s.gstin || '—'}</span>
                            </div>
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground bg-secondary/20 rounded-xl border border-dashed border-border">
                        <Truck className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                        <p>No vendor directories located conforming to boundaries.</p>
                    </div>
                )}
            </div>

            {/* Native Modal for Draft */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-0 backdrop-blur-sm">
                    <div className="bg-card rounded-xl max-w-lg w-full shadow-2xl overflow-hidden border border-border animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-border bg-secondary/30">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> Formulate Supplier Connection</h2>
                        </div>

                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-foreground">Registered Business Name *</label>
                                <input required type="text" value={formData.businessName} onChange={e => setFormData({ ...formData, businessName: e.target.value })} className="w-full p-2.5 bg-background border border-border rounded-lg text-sm" placeholder="Enterprise Inc." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Contact Leader</label>
                                    <input type="text" value={formData.contactPerson} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} className="w-full p-2.5 bg-background border border-border rounded-lg text-sm" placeholder="John Doe" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Tax GSTIN</label>
                                    <input type="text" value={formData.gstin} onChange={e => setFormData({ ...formData, gstin: e.target.value })} className="w-full p-2.5 bg-background border border-border rounded-lg text-sm" placeholder="22AAAAA0000A1Z5" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Primary Phone</label>
                                    <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full p-2.5 bg-background border border-border rounded-lg text-sm" placeholder="+91..." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Email Bridge</label>
                                    <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full p-2.5 bg-background border border-border rounded-lg text-sm" placeholder="ops@enterprise.com" />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
                                <button type="button" onClick={() => setIsCreateOpen(false)} className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary rounded-lg transition-colors">
                                    Scrap Draft
                                </button>
                                <button disabled={submitting} type="submit" className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-semibold transition-colors disabled:opacity-50 min-w-[120px]">
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Instantiate Master Data'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
