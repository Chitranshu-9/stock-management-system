import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Crosshair, Loader2, AlertTriangle, RefreshCw, X, Box, Scan, ChevronLeft, ChevronRight } from 'lucide-react';
import { AlertModal } from '../../components/ui/AlertModal';
import { useNetworkQueue } from '../../contexts/NetworkQueueContext';
import { API_ENDPOINTS } from '../../config/endpoints';

type ScanSession = {
    id: string;
    previewUrl: string;
    scanning: boolean;
    scanned: boolean;
    aiResults: any;
    error: string;
};

export default function HardwareScanner() {
    const [inputMode, setInputMode] = useState<'scanner' | 'manual'>('scanner');
    const [products, setProducts] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [sessions, setSessions] = useState<ScanSession[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const activeSession = sessions[currentIndex] || null;

    const [errorModal, setErrorModal] = useState<string | null>(null);
    const [savingStates, setSavingStates] = useState<Record<string, boolean | 'SUCCESS'>>({});
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    const { enqueueJob } = useNetworkQueue();

    // Edit & Autocomplete states
    const [editModeId, setEditModeId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);

    const imageRef = useRef<HTMLImageElement>(null);

    // To properly map absolute pixel boxes to CSS relative bounds
    const [imgRenderBounds, setImgRenderBounds] = useState({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 });

    React.useEffect(() => {
        // Cold-Start Injection: Load all existing DB cropped slices into the Python CLIP caching matrix dynamically upon component initialization.
        fetch(API_ENDPOINTS.PRODUCTS.BOOTSTRAP_AI).catch(() => { });

        // Load Complete Product Roster for Native Manual Mode bypass
        fetch(API_ENDPOINTS.PRODUCTS.BASE)
            .then(res => res.json())
            .then(data => setProducts(data))
            .catch(() => { });
    }, []);

    const handleEditChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setEditValue(val);
        if (val.length >= 2) {
            try {
                const res = await fetch(`/api/products?search=${encodeURIComponent(val)}`);
                if (res.ok) setSuggestions(await res.json());
            } catch (e) { }
        } else {
            setSuggestions([]);
        }
    };

    const applyEdit = (item: any, name: string, sku?: string) => {
        if (!activeSession) return;
        const newItems = activeSession.aiResults.items.map((i: any) =>
            i.detection_id === item.detection_id ? { ...i, category: name, sku: sku || i.sku } : i
        );
        setSessions(prev => prev.map((s, idx) => idx === currentIndex ? { ...s, aiResults: { ...s.aiResults, items: newItems } } : s));
        setEditModeId(null);
    };

    const handleManualAdd = (product: any) => {
        if (!activeSession) return;
        const currentItems = activeSession.aiResults?.items || [];
        const existing = currentItems.find((i: any) => i.sku === product.sku && i.isManual);

        if (existing) {
            setQuantities(prev => ({ ...prev, [existing.detection_id]: (prev[existing.detection_id] || 1) + 1 }));
            return;
        }

        const newBox = {
            detection_id: `manual_${Date.now()}_${Math.random()}`,
            category: product.name,
            sku: product.sku,
            confidence: 1,
            bbox: [0, 0, 0, 0],
            isManual: true,
            fallbackImage: product.aiTrainingImages?.[0]
        };

        setSessions(prev => prev.map((s, idx) => idx === currentIndex ? { ...s, aiResults: { ...s.aiResults, items: [...currentItems, newBox] }, scanned: true } : s));
        setQuantities(prev => ({ ...prev, [newBox.detection_id]: 1 }));
    };

    const handleSaveItem = async (item: any) => {
        setSavingStates(prev => ({ ...prev, [item.detection_id]: true }));

        try {
            const formData = new FormData();
            formData.append('name', item.category);
            if (item.sku) formData.append('sku', item.sku);
            formData.append('quantity', String(quantities[item.detection_id] || 1));

            // Execute Native Blob generation strictly if it's an AI Camera Box
            if (!item.isManual) {
                if (!imageRef.current) throw new Error("Image reference decoupled.");
                const [x1, y1, x2, y2] = item.bbox;
                const width = Math.max(1, x2 - x1);
                const height = Math.max(1, y2 - y1);

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error("Canvas ctx failed");

                ctx.drawImage(imageRef.current, x1, y1, width, height, 0, 0, width, height);

                const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png', 0.9));
                if (!blob) throw new Error("Failed to construct binary Blob array.");

                formData.append('image', blob, `crop_${item.detection_id}.png`);
            }

            // Post directly to the dedicated AI-ingest route
            enqueueJob(API_ENDPOINTS.PRODUCTS.AI_INGEST, 'POST', formData, { onError: (e) => setErrorModal('Sync Error: ' + e.message) });
            setSavingStates(prev => ({ ...prev, [item.detection_id]: 'SUCCESS' }));

            // Instantly mutate local rendering catalog echoing native DB ingestion safely without expensive sub-queries.
            setProducts(prev => prev.map(p => {
                if (p.sku === item.sku) {
                    return { ...p, currentStock: p.currentStock + (quantities[item.detection_id] || 1) };
                }
                return p;
            }));

        } catch (e: any) {
            setSavingStates(prev => ({ ...prev, [item.detection_id]: false }));
            setErrorModal("Upload blocked: " + e.message);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const maxAllowed = 10;
        const available = maxAllowed - sessions.length;

        if (available <= 0) {
            setErrorModal(`Limit reached: maximum ${maxAllowed} images per processing batch.`);
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

                        let finalizedData = data;
                        if (data.items && data.items.length > 0) {
                            const initialQuantities: Record<string, number> = {};
                            data.items.forEach((item: any) => {
                                initialQuantities[item.detection_id] = 1;
                            });
                            setQuantities(qPrev => ({ ...qPrev, ...initialQuantities }));
                        } else {
                            finalizedData = { ...data, items: [] };
                        }

                        return { ...s, aiResults: finalizedData, scanned: true, scanning: false };
                    }));
                },
                onError: (err) => {
                    setSessions(prev => prev.map(s => s.id === session.id ? { ...s, error: err.message, scanning: false } : s));
                }
            });
        });

        e.target.value = ''; // Unlock Native UI Input
    };

    const handleClearBatch = () => {
        sessions.forEach(s => URL.revokeObjectURL(s.previewUrl));
        setSessions([]);
        setCurrentIndex(0);
        setSavingStates({});
        setQuantities({});
    };

    const handleImageLoad = () => {
        if (imageRef.current) {
            setImgRenderBounds({
                width: imageRef.current.clientWidth,
                height: imageRef.current.clientHeight,
                naturalWidth: imageRef.current.naturalWidth,
                naturalHeight: imageRef.current.naturalHeight
            });
        }
    };

    // Calculate dynamic scaling for bounding boxes
    const getBoxStyle = (bbox: number[]) => {
        const [x1, y1, x2, y2] = bbox;
        const scaleX = imgRenderBounds.width / imgRenderBounds.naturalWidth;
        const scaleY = imgRenderBounds.height / imgRenderBounds.naturalHeight;

        return {
            left: `${x1 * scaleX}px`,
            top: `${y1 * scaleY}px`,
            width: `${(x2 - x1) * scaleX}px`,
            height: `${(y2 - y1) * scaleY}px`
        };
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Hardware Bounding Box Tracker</h1>
                <p className="text-muted-foreground text-sm mt-1">Multi-object bounding detection leveraging local YOLOv8 extraction.</p>
                <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-md flex items-start gap-3">
                    <span className="text-xl">💡</span>
                    <div>
                        <p className="text-sm font-semibold text-primary">Operator Scanning Tip</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            FastSAM relies on screen proportion. For <strong>micro-objects</strong> like single screws or small drill-bits, bring the camera closer so the item fills at least <strong className="text-primary/80">15-20%</strong> of the screen to prevent it from being filtered out as background noise.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex bg-secondary/30 p-1 rounded-xl mb-4 w-max border border-border">
                <button onClick={() => setInputMode('scanner')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${inputMode === 'scanner' ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-secondary/80 text-muted-foreground'}`}>
                    <Camera className="w-4 h-4" /> Scanner
                </button>
                <button onClick={() => setInputMode('manual')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${inputMode === 'manual' ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-secondary/80 text-muted-foreground'}`}>
                    <Box className="w-4 h-4" /> Manual
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {inputMode === 'scanner' ? (
                    <div className="border border-border bg-card rounded-xl shadow-sm overflow-hidden flex flex-col h-[55vh] min-h-[480px]">
                        <div className="p-4 border-b border-border bg-secondary/50">
                            <h2 className="font-semibold flex items-center gap-2">
                                <Crosshair className="w-5 h-5 text-primary" />
                                Multi-Scan Camera
                            </h2>
                        </div>

                        <div className="flex-1 p-6 flex flex-col items-center justify-center bg-muted/30 relative overflow-hidden">
                            {activeSession ? (
                                <div className="relative border border-primary/20 shadow-xl rounded-md bg-black w-full h-full flex items-center justify-center overflow-hidden">
                                    <img
                                        ref={imageRef}
                                        src={activeSession.previewUrl}
                                        alt="Scan Target"
                                        onLoad={handleImageLoad}
                                        className={`max-w-full max-h-full object-contain ${activeSession.scanning ? 'opacity-50 blur-sm' : ''} transition-all`}
                                    />

                                    {/* Overlay Bounding Boxes */}
                                    {!activeSession.scanning && activeSession.scanned && activeSession.aiResults?.items && imgRenderBounds.width > 0 && (
                                        <div className="absolute inset-0 m-auto pointer-events-none" style={{ width: imgRenderBounds.width, height: imgRenderBounds.height }}>
                                            {activeSession.aiResults.items.map((item: any, idx: number) => {
                                                if (item.isManual) return null; // Prevent coordinate crash
                                                return (
                                                    <div
                                                        key={idx}
                                                        className="absolute border-2 border-green-500 bg-green-500/10"
                                                        style={getBoxStyle(item.bbox)}
                                                    >
                                                        <span className="absolute -top-6 left-0 bg-green-500 text-white text-xs px-2 py-0.5 rounded shadow whitespace-nowrap">
                                                            {item.category} ({(item.confidence * 100).toFixed(0)}%)
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {activeSession.scanning && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-primary font-medium animate-pulse">
                                            <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary" />
                                            Evaluating Object Coordinates...
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4 text-center">
                                    <div className="w-24 h-24 bg-card border border-dashed border-border rounded-xl flex items-center justify-center mx-auto shadow-sm">
                                        <Camera className="w-10 h-10 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <input type="file" multiple accept="image/jpeg, image/png" capture="environment" onChange={handleImageUpload} className="hidden" id="camera-upload" />
                                        <label htmlFor="camera-upload" className="px-4 py-2 cursor-pointer bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors shadow-sm inline-flex items-center">
                                            Open Hardware Camera
                                        </label>
                                    </div>
                                </div>
                            )}

                            {activeSession && (
                                <div className="absolute bottom-4 left-0 w-full flex flex-col items-center gap-2">
                                    <div className="flex justify-center w-full gap-3 px-4 relative max-w-sm">
                                        {/* Swipe Left Arrow */}
                                        <button
                                            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                                            disabled={currentIndex === 0}
                                            className="p-2 border border-border bg-card/90 backdrop-blur rounded-full shadow-md text-foreground disabled:opacity-30 transition-all hover:bg-muted"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>

                                        <div className="flex-1 flex flex-col items-center justify-center">
                                            <span className="text-xs font-semibold bg-accent/90 border border-accent-foreground/20 text-accent-foreground px-4 py-1 rounded-full shadow-lg">
                                                Image {currentIndex + 1} of {sessions.length}
                                            </span>

                                            <input type="file" multiple accept="image/jpeg, image/png" capture="environment" onChange={handleImageUpload} className="hidden" id="camera-upload-retry" />
                                            <label htmlFor="camera-upload-retry" className="mt-2 px-4 py-1.5 cursor-pointer border border-border bg-card/90 text-foreground text-xs font-medium rounded-full shadow-md hover:bg-muted transition-all active:scale-95 flex items-center gap-1.5">
                                                <Camera className="w-3.5 h-3.5" /> Bulk Add More
                                            </label>
                                        </div>

                                        {/* Swipe Right Arrow */}
                                        <button
                                            onClick={() => setCurrentIndex(prev => Math.min(sessions.length - 1, prev + 1))}
                                            disabled={currentIndex === sessions.length - 1}
                                            className="p-2 border border-border bg-card/90 backdrop-blur rounded-full shadow-md text-foreground disabled:opacity-30 transition-all hover:bg-muted"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <button onClick={handleClearBatch} className="text-[10px] text-muted-foreground hover:text-destructive underline mt-1">
                                        Clear Full Batch
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="border border-border bg-card rounded-xl shadow-sm flex flex-col h-[55vh] min-h-[480px] overflow-hidden">
                        <div className="p-4 border-b border-border bg-secondary/50 space-y-3">
                            <h2 className="font-semibold flex items-center gap-2">
                                <Box className="w-5 h-5 text-primary" />
                                Manual Product Catalog
                            </h2>
                            <div className="relative">
                                <Scan className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search exact product names or SKUs..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-background border border-border pl-10 pr-3 py-2 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
                            {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase())).map((product) => (
                                <div
                                    key={product._id}
                                    onClick={() => handleManualAdd(product)}
                                    className="p-3 border border-border rounded-xl bg-card hover:border-primary cursor-pointer transition-all active:scale-[0.98] flex gap-3 shadow-sm hover:shadow-md"
                                >
                                    <div className="w-12 h-12 rounded-lg border border-border bg-muted/50 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                        {product.aiTrainingImages?.[0] ? (
                                            <img src={product.aiTrainingImages[0]} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Box className="w-5 h-5 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="overflow-hidden w-full flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-foreground line-clamp-1">{product.name}</span>
                                            <span className="text-xs text-muted-foreground font-mono">{product.sku} | Stock: {product.currentStock}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {products.length === 0 && (
                                <div className="text-center text-muted-foreground text-sm py-10 italic">Loading ledger blocks...</div>
                            )}
                        </div>
                    </div>
                )}

                <div className="border border-border bg-card rounded-xl shadow-sm flex flex-col overflow-hidden h-[55vh] min-h-[480px]">
                    <div className="p-4 border-b border-border bg-secondary/50 flex justify-between items-center">
                        <h2 className="font-semibold text-foreground">Multi-Target Extractions</h2>
                        {activeSession?.aiResults?.items?.length > 0 && (
                            <span className="text-xs font-semibold px-2 py-1 bg-secondary rounded-md border border-border">Total: {activeSession.aiResults.items.length}</span>
                        )}
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto">
                        {activeSession?.error && <div className="p-4 bg-destructive/10 text-destructive rounded-md mb-4">{activeSession.error}</div>}

                        {!activeSession?.scanned && !activeSession?.error && (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                                Extracted components will appear here.
                            </div>
                        )}

                        {activeSession?.scanned && activeSession?.aiResults?.items?.length === 0 && (
                            <div className="p-4 bg-muted/50 rounded-md border border-border text-center">
                                <p className="font-medium text-destructive">No structurally distinct objects detected.</p>
                                <p className="text-sm text-muted-foreground mt-1 mb-3">YOLOv8 couldn't identify strictly known primitives in this framing.</p>
                                <div className="text-xs text-left bg-background p-3 rounded border border-border">
                                    <span className="font-semibold block mb-1">Troubleshooting:</span>
                                    <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                                        <li>Are the objects transparent? (Use a dark mat underneath)</li>
                                        <li>Are the objects tiny? (Move the camera closer to the object)</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {activeSession?.scanned && activeSession?.aiResults?.items?.length > 0 && (
                            <div className="space-y-3 pb-6">
                                {[...activeSession.aiResults.items].sort((a: any, b: any) => (b.confidence || 0) - (a.confidence || 0)).map((item: any) => (
                                    <div key={item.detection_id} className="p-4 rounded-lg border border-border/50 bg-secondary/20 flex flex-col hover:bg-secondary/40 transition-colors">
                                        <div className="flex justify-between items-center w-full">
                                            <div className="flex-1 mr-4">
                                                {editModeId === item.detection_id ? (
                                                    <div className="relative">
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                autoFocus
                                                                value={editValue}
                                                                onChange={handleEditChange}
                                                                className="w-full text-sm font-medium bg-background border border-primary/50 text-foreground rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-primary"
                                                                placeholder="Type to search Catalog..."
                                                            />
                                                            <button onClick={() => applyEdit(item, editValue)} className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded font-medium">Set</button>
                                                        </div>
                                                        {suggestions.length > 0 && (
                                                            <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-2xl overflow-hidden max-h-40 overflow-y-auto">
                                                                {suggestions.map(sug => (
                                                                    <div key={sug.sku} onClick={() => applyEdit(item, sug.name, sug.sku)} className="px-3 py-2 text-sm hover:bg-secondary cursor-pointer border-b border-border last:border-0 truncate flex items-center justify-between">
                                                                        <span className="font-medium">{sug.name}</span>
                                                                        <span className="text-[10px] text-muted-foreground ml-1">({sug.sku})</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="group cursor-text" onClick={() => { setEditModeId(item.detection_id); setEditValue(item.category); setSuggestions([]); }}>
                                                        <h3 className="font-medium text-foreground capitalize group-hover:text-primary transition-colors inline-block border-b border-transparent group-hover:border-primary/50 border-dashed pb-0.5">{item.category}</h3>
                                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">✏️ Edit Model Label</span>
                                                        <p className="text-xs text-muted-foreground font-mono mt-1">UUID: {item.detection_id} {item.sku && <span className="text-success font-medium ml-1">| Match: {item.sku}</span>}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                <button
                                                    onClick={() => {
                                                        setSessions(prev => prev.map((s, idx) => {
                                                            if (idx === currentIndex) {
                                                                return {
                                                                    ...s,
                                                                    aiResults: {
                                                                        ...s.aiResults,
                                                                        items: s.aiResults.items.filter((i: any) => i.detection_id !== item.detection_id)
                                                                    }
                                                                };
                                                            }
                                                            return s;
                                                        }));
                                                    }}
                                                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors bg-secondary/50 rounded-md hover:bg-destructive/10 mb-2 border border-border/50"
                                                    title="Remove Item"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>

                                                {item.isManual ? (
                                                    <div className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md border border-primary/20 inline-block">
                                                        Manual Entry
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="text-sm font-semibold text-green-600 dark:text-green-400">{(item.confidence * 100).toFixed(1)}% Conf</div>
                                                        <div className="text-xs text-muted-foreground mt-1">[{Math.abs(item.bbox[2] - item.bbox[0]).toFixed(0)}x{Math.abs(item.bbox[3] - item.bbox[1]).toFixed(0)}] px</div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-3 pt-3 border-t border-border/50 flex flex-col items-end">
                                            <div className="flex items-center gap-3">
                                                {!savingStates[item.detection_id] && (
                                                    <div className="flex items-center bg-background border border-border rounded-md px-2 py-1 shadow-sm">
                                                        <span className="text-xs text-muted-foreground mr-2 font-medium">Qty:</span>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={quantities[item.detection_id] || 1}
                                                            onChange={(e) => {
                                                                const val = Math.max(1, parseInt(e.target.value) || 1);
                                                                setQuantities(prev => ({ ...prev, [item.detection_id]: val }));
                                                            }}
                                                            className="w-12 text-sm font-bold bg-transparent outline-none text-center"
                                                        />
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() => handleSaveItem(item)}
                                                    disabled={savingStates[item.detection_id] === true || savingStates[item.detection_id] === 'SUCCESS'}
                                                    className={`text-xs px-4 py-2 font-medium rounded-md transition-all shadow-sm flex items-center justify-center ${savingStates[item.detection_id] === 'SUCCESS'
                                                        ? 'bg-success/20 text-success border border-success/30'
                                                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                                                        } disabled:opacity-70`}
                                                >
                                                    {savingStates[item.detection_id] === 'SUCCESS'
                                                        ? '✓ Saved to Catalog'
                                                        : savingStates[item.detection_id] === true
                                                            ? 'Syncing Core...'
                                                            : `Add ${quantities[item.detection_id] || 1} Stock`}
                                                </button>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground mt-2">Iteratively constructs Image Embeddings (RAG)</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Universal Error Overlay */}
            <AlertModal
                isOpen={!!errorModal}
                title="Diagnostic Alert"
                message={errorModal || ''}
                type="error"
                onClose={() => setErrorModal(null)}
            />
        </div>
    );
}
