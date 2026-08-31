import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Fingerprint, FileText, User, Camera, Grid, Plus, Minus, ScanLine, X, AlertTriangle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { AlertModal, Modal } from '../../components/ui/AlertModal';
import { useNavigate } from 'react-router-dom';
import { useNetworkQueue } from '../../contexts/NetworkQueueContext';
import { API_ENDPOINTS } from '../../config/endpoints';

type POSScanSession = {
    id: string;
    previewUrl: string;
    scanning: boolean;
    scanned: boolean;
    aiResults: any;
    error: string;
};

export default function POS() {
    const navigate = useNavigate();
    const { enqueueJob } = useNetworkQueue();
    const [viewMode, setViewMode] = useState<'scanner' | 'grid'>('scanner');
    const [products, setProducts] = useState<any[]>([]);

    // Auto-Carting Concurrent Carousel Sessions
    const [sessions, setSessions] = useState<POSScanSession[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const activeSession = sessions[currentIndex] || null;

    const imageRef = useRef<HTMLImageElement>(null);
    const [imgRenderBounds, setImgRenderBounds] = useState({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 });

    const getBoxStyle = (bbox: number[]) => {
        if (imgRenderBounds.naturalWidth === 0) return {};
        const scaleX = imgRenderBounds.width / imgRenderBounds.naturalWidth;
        const scaleY = imgRenderBounds.height / imgRenderBounds.naturalHeight;
        return {
            left: bbox[0] * scaleX,
            top: bbox[1] * scaleY,
            width: (bbox[2] - bbox[0]) * scaleX,
            height: (bbox[3] - bbox[1]) * scaleY,
        };
    };

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch(API_ENDPOINTS.PRODUCTS.BASE);
                if (res.ok) {
                    const data = await res.json();
                    setProducts(data);
                }
            } catch (err) {
                // Background fail
            }
        };
        fetchProducts();
    }, []);

    const [cart, setCart] = useState<any[]>([]);

    const updateQty = (id: number, delta: number) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                return { ...item, qty: Math.max(1, item.qty + delta) };
            }
            return item;
        }));
    };

    const removeItem = (id: number) => {
        setCart(cart.filter(item => item.id !== id));
    };

    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerGstin, setCustomerGstin] = useState('');
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [errorModal, setErrorModal] = useState<string | null>(null);

    const [oversellWarning, setOversellWarning] = useState<any[] | null>(null);

    const executeCheckout = async () => {
        setOversellWarning(null);
        setIsCheckingOut(true);
        try {
            const res = await fetch(API_ENDPOINTS.INVENTORY.CHECKOUT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: cart, customerName, customerPhone, customerGstin })
            });

            if (res.ok) {
                const invoiceData = await res.json();
                navigate('/sales/invoice', { state: { invoiceData } });
            } else {
                const errJson = await res.json().catch(() => null);
                setErrorModal(errJson?.error || 'Server Error processing Native Payload Checkout.');
            }
        } catch (e) {
            setErrorModal('Network latency blocked checkout. Please verify connection bounds.');
        } finally {
            setIsCheckingOut(false);
        }
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        // Inversion Priority: Soft-Locks > Hard-Locks
        const overSoldItems = cart.filter(item => {
            const p = products.find(prod => prod._id === item.id);
            return p && item.qty > (p.currentStock || 0);
        });

        if (overSoldItems.length > 0) {
            setOversellWarning(overSoldItems);
            return;
        }

        executeCheckout();
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const maxAllowed = 10;
        const available = maxAllowed - sessions.length;
        if (available <= 0) {
            setErrorModal(`Limit reached: max ${maxAllowed} simultaneous POS scans.`);
            return;
        }

        const toProcess = files.slice(0, available);

        const newSessions = toProcess.map(file => ({
            id: `session_${Date.now()}_${Math.random().toString(36).substring(2)}`,
            file,
            previewUrl: URL.createObjectURL(file),
            scanning: true,
            scanned: false,
            aiResults: null,
            error: ''
        }));

        setSessions(prev => [...prev, ...newSessions.map(ns => ({ ...ns, file: undefined }))]);
        if (sessions.length === 0) setCurrentIndex(0);

        newSessions.forEach(session => {
            const formData = new FormData();
            formData.append('image', session.file);

            enqueueJob(API_ENDPOINTS.AI.HARDWARE_SCAN, 'POST', formData, {
                onSuccess: (data) => {
                    setSessions(prev => prev.map(s => {
                        if (s.id !== session.id) return s;
                        let errString = '';
                        // AI extracted uncatalogued primitives natively
                        if (!data.catalogMatches?.length && data.items?.length > 0) {
                            errString = `Isolated ${data.items.length} unbound metric models.`;
                        }
                        return { ...s, aiResults: data, scanned: true, scanning: false, error: errString };
                    }));

                    // AUTO-CART PIPELINE INJECTION NATIVELY!
                    if (data.catalogMatches && data.catalogMatches.length > 0) {
                        data.catalogMatches.forEach((match: any) => {
                            setCart(prevCart => {
                                const existingItem = prevCart.find((item: any) => item.id === match._id);
                                if (existingItem) {
                                    return prevCart.map(item => item.id === match._id ? { ...item, qty: item.qty + 1 } : item);
                                } else {
                                    return [...prevCart, { id: match._id, name: match.name, price: match.sellingPrice || 0, qty: 1, image: match.aiTrainingImages?.[0] || null }];
                                }
                            });
                        });
                    }
                },
                onError: (err) => {
                    setSessions(prev => prev.map(s => s.id === session.id ? { ...s, error: `Connectivity fail: ${err.message}`, scanning: false } : s));
                }
            });
        });

        // Clear input to permit re-selection organically natively
        e.target.value = '';
    };

    const handleImageLoad = () => {
        if (imageRef.current) {
            const { width, height, naturalWidth, naturalHeight } = imageRef.current;
            if (naturalWidth && naturalHeight) setImgRenderBounds({ width, height, naturalWidth, naturalHeight });
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
                        <div className="absolute inset-0 flex items-center justify-center bg-black/5 flex-col p-4">
                            <div className="relative w-full max-w-[400px] h-64 md:h-96 mt-4 flex items-center justify-center border border-border shadow-md rounded-xl bg-black overflow-hidden group">
                                {activeSession ? (
                                    <>
                                        <img
                                            ref={imageRef}
                                            src={activeSession.previewUrl}
                                            alt="POS Scanner Preview"
                                            onLoad={handleImageLoad}
                                            className={`max-w-full max-h-full object-contain ${activeSession.scanning ? 'opacity-50 blur-sm' : ''} transition-all`}
                                        />

                                        {!activeSession.scanning && activeSession.scanned && activeSession.aiResults?.items && imgRenderBounds.width > 0 && (
                                            <div className="absolute inset-0 m-auto pointer-events-none" style={{ width: imgRenderBounds.width, height: imgRenderBounds.height }}>
                                                {activeSession.aiResults.items.map((item: any, idx: number) => {
                                                    const matchColor = item.sku ? 'border-primary bg-primary/20' : 'border-destructive bg-destructive/10';
                                                    const textColor = item.sku ? 'bg-primary' : 'bg-destructive';
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={`absolute border-2 ${matchColor}`}
                                                            style={getBoxStyle(item.bbox)}
                                                        >
                                                            <span className={`absolute -top-6 left-0 ${textColor} text-white text-xs px-2 py-0.5 rounded shadow whitespace-nowrap`}>
                                                                {item.category} {(item.confidence && `(${(item.confidence * 100).toFixed(0)}%)`)}
                                                            </span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}

                                        {activeSession.scanning && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-primary font-medium animate-pulse bg-background/50 backdrop-blur-sm z-10">
                                                <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary" />
                                                <p className="shadow-sm bg-background/80 px-2 py-1 rounded">RAG Pipeline Iterating...</p>
                                            </div>
                                        )}

                                        {!activeSession.scanning && activeSession.error && (
                                            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                                <p className="text-xs text-destructive bg-destructive/20 border border-destructive/50 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md max-w-[80%] text-center">{activeSession.error}</p>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl m-4" />
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl m-4" />

                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 pointer-events-none">
                                            <ScanLine className="w-12 h-12 text-primary opacity-50" />
                                            <p className="text-sm font-medium text-muted-foreground bg-background/80 px-2 py-1 rounded">Position product in frame</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {activeSession && (
                                <div className="mt-6 flex flex-col items-center gap-2">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                                            disabled={currentIndex === 0}
                                            className="p-2 border border-border bg-card/90 backdrop-blur rounded-full shadow-md text-foreground disabled:opacity-30 transition-all hover:bg-muted"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>

                                        <span className="text-sm font-semibold text-muted-foreground px-4 py-1 rounded-full border border-border/50 bg-secondary/30">
                                            Checkout Batch {currentIndex + 1} of {sessions.length}
                                        </span>

                                        <button
                                            onClick={() => setCurrentIndex(prev => Math.min(sessions.length - 1, prev + 1))}
                                            disabled={currentIndex === sessions.length - 1}
                                            className="p-2 border border-border bg-card/90 backdrop-blur rounded-full shadow-md text-foreground disabled:opacity-30 transition-all hover:bg-muted"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => { setSessions([]); setCurrentIndex(0); }}
                                        className="text-[10px] text-muted-foreground hover:text-destructive underline mt-2"
                                    >
                                        Clear Frame Array
                                    </button>
                                </div>
                            )}

                            <div className="mt-8 flex flex-col items-center">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/jpeg, image/png"
                                    capture="environment"
                                    onChange={handleImageUpload}
                                    id="pos-camera-upload"
                                    disabled={sessions.length >= 10}
                                />
                                <label htmlFor="pos-camera-upload" className={`px-6 py-3 bg-secondary border border-border text-foreground font-medium rounded-full shadow-sm flex items-center gap-2 transition-all ${sessions.length >= 10 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted cursor-pointer active:scale-95'}`}>
                                    <Camera className="w-4 h-4" /> Capture Product
                                </label>
                                <p className="mt-4 text-xs text-muted-foreground bg-background/50 px-3 py-1.5 rounded-full border border-border">
                                    💡 <strong className="text-foreground">Tip:</strong> For tiny items (nails, screws), bring the camera closer!
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 p-6 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto">
                            {products.length === 0 && <p className="col-span-full text-center text-muted-foreground mt-10">Loading Live Catalog...</p>}
                            {products.map((p) => (
                                <div key={p._id} onClick={() => {
                                    const existingItem = cart.find(item => item.id === p._id);
                                    if (existingItem) {
                                        updateQty(existingItem.id, 1);
                                    } else {
                                        setCart([...cart, { id: p._id, name: p.name, price: p.sellingPrice || 0, qty: 1, image: p.aiTrainingImages?.[0] || null }]);
                                    }
                                }} className="border border-border bg-card rounded-xl p-3 flex flex-col gap-2 hover:border-primary/50 hover:bg-muted/30 cursor-pointer transition-colors active:scale-95 group">
                                    <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                                        {p.aiTrainingImages && p.aiTrainingImages.length > 0 ? (
                                            <img src={p.aiTrainingImages[0]} alt={p.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-muted-foreground text-xs font-mono">No Image</span>
                                        )}
                                        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm line-clamp-2">{p.name}</h3>
                                        <p className="text-success font-medium flex items-center mt-1">₹ {p.sellingPrice?.toFixed(2) || '0.00'}</p>
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
                        <input value={customerName} onChange={e => setCustomerName(e.target.value)} type="text" placeholder="Customer Name" className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                        <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} type="text" placeholder="Phone" className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                    <input value={customerGstin} onChange={e => setCustomerGstin(e.target.value)} type="text" placeholder="Customer GSTIN (Optional)" className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cart.map((item) => {
                        const productRef = products.find(p => p._id === item.id);
                        const isOversold = productRef && item.qty > (productRef.currentStock || 0);

                        return (
                            <div key={item.id} className={`flex items-center gap-3 bg-background border p-3 rounded-lg shadow-sm transition-colors ${isOversold ? 'border-destructive/50 bg-destructive/5' : 'border-border'}`}>
                                <div className="w-12 h-12 bg-muted rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden border border-border">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-muted-foreground text-[10px]">No Image</span>
                                    )}
                                </div>
                                <div className="flex-1 flex flex-col">
                                    <span className="font-semibold text-sm line-clamp-1">{item.name}</span>
                                    <span className="text-muted-foreground text-xs font-medium mb-1">₹ {item.price.toFixed(2)}</span>
                                    {isOversold && (
                                        <span className="text-[10px] text-destructive font-semibold bg-destructive/10 px-1 py-0.5 rounded w-max">Out of Stock ({productRef?.currentStock || 0})</span>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="flex items-center gap-1 border border-input rounded-md px-1 py-1 bg-secondary/50">
                                        <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:bg-background hover:text-foreground rounded transition-colors bg-secondary shadow-sm active:scale-95"><Minus className="w-3 h-3" /></button>
                                        <span className={`w-6 text-center text-sm font-medium ${isOversold ? 'text-destructive font-bold' : ''}`}>{item.qty}</span>
                                        <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:bg-background hover:text-foreground rounded transition-colors bg-secondary shadow-sm active:scale-95"><Plus className="w-3 h-3" /></button>
                                    </div>
                                </div>
                                <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive p-1 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
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
                        <span className="font-semibold text-lg text-foreground">Total</span>
                        <span className="font-bold text-xl text-primary">₹ {total.toFixed(2)}</span>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={isCheckingOut || cart.length === 0}
                        className={`w-full py-4 mt-2 font-bold text-base rounded-xl transition-all shadow-md flex items-center justify-center gap-2
                            ${(isCheckingOut || cart.length === 0) ? 'bg-secondary text-muted-foreground shadow-none cursor-not-allowed' : 'bg-[#29226B] hover:bg-primary text-white shadow-primary/25 hover:shadow-lg active:scale-95'}`}
                    >
                        {isCheckingOut ? (
                            <><FileText className="w-5 h-5 animate-spin" /> Processing...</>
                        ) : (
                            <><FileText className="w-5 h-5" /> Generate GST Invoice</>
                        )}
                    </button>
                </div>
            </div>

            {/* Custom Oversell Warning Modal */}
            <Modal
                isOpen={!!oversellWarning}
                onClose={() => setOversellWarning(null)}
                title="Oversell Warning"
                icon={<AlertTriangle className="w-6 h-6" />}
                maxWidth="md"
            >
                <div>
                    <p className="text-sm text-foreground/80 mb-5 leading-relaxed">
                        You are about to sell quantities that physically exceed the tracked digital ledger bounds. Do you wish to continue and mathematically insert these variants into negative boundaries?
                    </p>

                    <div className="bg-secondary/40 border border-border/50 rounded-lg p-3 space-y-3 mb-6 max-h-[180px] overflow-y-auto">
                        {oversellWarning?.map((item, idx) => {
                            const prod = products.find(p => p._id === item.id);
                            return (
                                <div key={idx} className="flex justify-between items-center text-sm border-b border-border/30 last:border-0 pb-2 last:pb-0">
                                    <span className="font-medium text-foreground pr-4 line-clamp-1">{item.name}</span>
                                    <div className="flex select-none flex-col items-end whitespace-nowrap">
                                        <span className="text-destructive font-semibold">Selling: {item.qty}</span>
                                        <span className="text-muted-foreground text-xs font-mono">Stock: {prod?.currentStock || 0}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => setOversellWarning(null)}
                            className="px-5 py-2.5 bg-secondary text-foreground hover:bg-secondary/80 rounded-xl text-sm font-semibold transition-colors active:scale-95 border border-border"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={executeCheckout}
                            className="px-5 py-2.5 bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[0_4px_14px_0_rgba(239,68,68,0.39)] rounded-xl text-sm font-semibold transition-all active:scale-95"
                        >
                            Override & Execute
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Universal Error Overlay */}
            <AlertModal
                isOpen={!!errorModal}
                title="Error Encountered"
                message={errorModal || ''}
                type="error"
                onClose={() => setErrorModal(null)}
            />
        </div>
    );
}
