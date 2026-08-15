import React, { useState } from 'react';
import { ShoppingCart, Fingerprint, FileText, User, Camera, Grid, Plus, Minus, ScanLine, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function POS() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'scanner' | 'grid'>('scanner');

    const [cart, setCart] = useState([
        { id: 1, name: 'Premium Cooking Oil 1L', price: 450, qty: 1 }
    ]);

    const updateQty = (id: number, delta: number) => {
        setCart(cart.map(item => item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item));
    };

    const removeItem = (id: number) => {
        setCart(cart.filter(item => item.id !== id));
    };

    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState('');

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanning(true);
        setScanError('');

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch('/api/ai/scan', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const textStr = await res.text();
                let errMessage = `HTTP ${res.status}: Failed`;
                try {
                    const parsed = JSON.parse(textStr);
                    errMessage = parsed.error || errMessage;
                } catch (e) {
                    if (textStr.includes('ECONNREFUSED') || textStr.includes('504')) {
                        errMessage = 'Backend Offline';
                    } else if (res.status === 413) {
                        errMessage = 'File too large';
                    }
                }
                setScanError(errMessage);
                return;
            }

            const data = await res.json();

            if (data.catalogMatches && data.catalogMatches.length > 0) {
                const match = data.catalogMatches[0];
                const existingItem = cart.find(item => item.id === match._id);

                if (existingItem) {
                    updateQty(existingItem.id, 1);
                } else {
                    setCart([...cart, {
                        id: match._id || Date.now(),
                        name: match.name,
                        price: match.sellingPrice || 0,
                        qty: 1
                    }]);
                }
            } else {
                setScanError('Product not recognized in catalog');
            }
        } catch (err) {
            setScanError('Network error to AI engine');
        } finally {
            setIsScanning(false);
        }
    };

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    return (
        <div className="h-auto lg:h-[calc(100vh-8rem)] min-h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6 -m-4 sm:m-0">
            {/* Left Pane: Scanner or Grid */}
            <div className="flex-1 min-h-[450px] lg:min-h-0 flex flex-col bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between gap-4">
                    <h2 className="font-semibold text-lg">Product Entry</h2>
                    <div className="flex bg-background border border-input rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('scanner')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium text-sm transition-colors ${viewMode === 'scanner' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary'}`}
                        >
                            <Camera className="w-4 h-4" /> Scanner
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium text-sm transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary'}`}
                        >
                            <Grid className="w-4 h-4" /> Manual
                        </button>
                    </div>
                </div>

                <div className="flex-1 relative overflow-hidden bg-muted/10">
                    {viewMode === 'scanner' ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/5 flex-col">
                            <div className="relative w-64 h-64 md:w-96 md:h-96">
                                {/* Scanner Frame */}
                                <div className="absolute inset-0 border-2 border-primary/50 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.1)]">
                                    <div className="w-full h-1 bg-primary shadow-[0_0_15px_#4338ca] animate-[ping_3s_ease-in-out_infinite]" />
                                    <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                                </div>
                                {/* Viewfinder corners */}
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />

                                {isScanning ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/50 backdrop-blur-sm z-10">
                                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                        <p className="text-sm font-medium text-primary shadow-sm">AI Engine Scanning...</p>
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                                        <ScanLine className="w-12 h-12 text-primary opacity-50" />
                                        <p className="text-sm font-medium text-muted-foreground">Position product in frame</p>
                                        {scanError && <p className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">{scanError}</p>}
                                    </div>
                                )}
                            </div>

                            <div className="mt-8">
                                <input
                                    type="file"
                                    accept="image/jpeg, image/png"
                                    capture="environment"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="pos-camera-upload"
                                    disabled={isScanning}
                                />
                                <label htmlFor="pos-camera-upload" className={`px-6 py-3 bg-secondary border border-border text-foreground font-medium rounded-full shadow-sm flex items-center gap-2 transition-all ${isScanning ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted cursor-pointer active:scale-95'}`}>
                                    <Camera className="w-4 h-4" /> Capture Product
                                </label>
                            </div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 p-6 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <div key={i} onClick={() => { }} className="border border-border bg-card rounded-xl p-3 flex flex-col gap-2 hover:border-primary/50 hover:bg-muted/30 cursor-pointer transition-colors active:scale-95 group">
                                    <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                                        <span className="text-muted-foreground text-xs font-mono">Image</span>
                                        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm line-clamp-2">Product Item #{i}</h3>
                                        <p className="text-success font-medium flex items-center mt-1">₹ 249.00</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Cart & Checkout */}
            <div className="w-full lg:w-[400px] flex flex-col bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border bg-secondary/30 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold text-lg">Current Sale</h2>
                </div>

                <div className="px-4 pt-4 pb-3 border-b border-border bg-muted/20 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                        <User className="w-4 h-4" /> Customer Details
                    </div>
                    <div className="flex gap-2">
                        <input type="text" placeholder="Customer Name" className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                        <input type="text" placeholder="Phone" className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                    <input type="text" placeholder="Customer GSTIN (Optional)" className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cart.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 bg-background border border-border p-3 rounded-lg shadow-sm">
                            <div className="w-12 h-12 bg-muted rounded-md flex-shrink-0" />
                            <div className="flex-1 flex flex-col">
                                <span className="font-semibold text-sm line-clamp-1">{item.name}</span>
                                <span className="text-muted-foreground text-xs font-medium">₹ {item.price.toFixed(2)}</span>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-1 border border-input rounded-md px-1 py-1 bg-secondary/50">
                                    <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:bg-background hover:text-foreground rounded transition-colors bg-secondary shadow-sm active:scale-95"><Minus className="w-3 h-3" /></button>
                                    <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                                    <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:bg-background hover:text-foreground rounded transition-colors bg-secondary shadow-sm active:scale-95"><Plus className="w-3 h-3" /></button>
                                </div>
                            </div>
                            <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive p-1 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {cart.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-2">
                            <ShoppingCart className="w-12 h-12" />
                            <p className="text-sm">Scan items to begin sale.</p>
                        </div>
                    )}
                </div>

                {/* Totals */}
                <div className="p-4 border-t border-border bg-secondary/10 space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">₹ {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">GST (18%)</span>
                        <span className="font-medium">₹ {tax.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-border pt-3 mt-3 flex justify-between items-center pb-2">
                        <span className="font-bold text-lg">Total</span>
                        <span className="font-bold text-2xl text-primary">₹ {total.toFixed(2)}</span>
                    </div>

                    <button
                        onClick={() => navigate('/sales/invoice')}
                        disabled={cart.length === 0}
                        className="w-full h-14 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:active:scale-100 text-primary-foreground rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md mt-2">
                        <FileText className="w-5 h-5" />
                        Generate GST Invoice
                    </button>
                </div>
            </div>
        </div>
    );
}
