import React, { useState, useRef } from 'react';
import { Camera, Crosshair, Loader2 } from 'lucide-react';

export default function HardwareScanner() {
    const [scanning, setScanning] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [aiResults, setAiResults] = useState<any>(null);
    const [error, setError] = useState<string>('');
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [savingStates, setSavingStates] = useState<Record<string, boolean | 'SUCCESS'>>({});

    // Edit & Autocomplete states
    const [editModeId, setEditModeId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);

    const imageRef = useRef<HTMLImageElement>(null);

    // To properly map absolute pixel boxes to CSS relative bounds
    const [imgRenderBounds, setImgRenderBounds] = useState({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 });

    React.useEffect(() => {
        // Cold-Start Injection: Load all existing DB cropped slices into the Python CLIP caching matrix dynamically upon component initialization.
        fetch('/api/products/bootstrap-ai').catch(() => { });
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
        const newItems = aiResults.items.map((i: any) =>
            i.detection_id === item.detection_id ? { ...i, category: name, sku: sku || i.sku } : i
        );
        setAiResults({ ...aiResults, items: newItems });
        setEditModeId(null);
    };

    const handleSaveItem = async (item: any) => {
        if (!imageRef.current) return;

        setSavingStates(prev => ({ ...prev, [item.detection_id]: true }));

        try {
            const [x1, y1, x2, y2] = item.bbox;
            const width = Math.max(1, x2 - x1);
            const height = Math.max(1, y2 - y1);

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Canvas ctx failed");

            // Draw cropped image matrix
            ctx.drawImage(imageRef.current, x1, y1, width, height, 0, 0, width, height);

            const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png', 0.9));
            if (!blob) throw new Error("Failed to construct binary Blob array.");

            const formData = new FormData();
            formData.append('image', blob, `crop_${item.detection_id}.png`);
            formData.append('name', item.category);
            if (item.sku) formData.append('sku', item.sku);

            // Post directly to the dedicated AI-ingest route
            const res = await fetch('/api/products/ai-ingest', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error(await res.text());

            setSavingStates(prev => ({ ...prev, [item.detection_id]: 'SUCCESS' }));
        } catch (e: any) {
            console.error("Save failure:", e);
            setSavingStates(prev => ({ ...prev, [item.detection_id]: false }));
            alert("Upload blocked: " + e.message);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(file));

        setScanning(true);
        setScanned(false);
        setError('');
        setAiResults(null);

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch('/api/ai/hardware-scan', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const textStr = await res.text();
                setError(`Detection Failed: ${textStr}`);
                setScanning(false);
                return;
            }

            const data = await res.json();
            setAiResults(data);
            setScanned(true);
        } catch (err: any) {
            setError(`Network level failure: ${err.message}`);
        } finally {
            setScanning(false);
            e.target.value = '';
        }
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-border bg-card rounded-xl shadow-sm overflow-hidden flex flex-col h-[600px]">
                    <div className="p-4 border-b border-border bg-secondary/50">
                        <h2 className="font-semibold flex items-center gap-2">
                            <Crosshair className="w-5 h-5 text-primary" />
                            Multi-Scan Camera
                        </h2>
                    </div>

                    <div className="flex-1 p-6 flex flex-col items-center justify-center bg-muted/30 relative overflow-hidden">
                        {previewUrl ? (
                            <div className="relative border border-primary/20 shadow-xl rounded-md bg-black w-full h-full flex items-center justify-center overflow-hidden">
                                <img
                                    ref={imageRef}
                                    src={previewUrl}
                                    alt="Scan Target"
                                    onLoad={handleImageLoad}
                                    className={`max-w-full max-h-full object-contain ${scanning ? 'opacity-50 blur-sm' : ''} transition-all`}
                                />

                                {/* Overlay Bounding Boxes */}
                                {!scanning && scanned && aiResults?.items && imgRenderBounds.width > 0 && (
                                    <div className="absolute inset-0 m-auto pointer-events-none" style={{ width: imgRenderBounds.width, height: imgRenderBounds.height }}>
                                        {aiResults.items.map((item: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="absolute border-2 border-green-500 bg-green-500/10"
                                                style={getBoxStyle(item.bbox)}
                                            >
                                                <span className="absolute -top-6 left-0 bg-green-500 text-white text-xs px-2 py-0.5 rounded shadow whitespace-nowrap">
                                                    {item.category} ({(item.confidence * 100).toFixed(0)}%)
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {scanning && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-primary font-medium animate-pulse">
                                        <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary" />
                                        Running Multi-Object YOLO Trace...
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4 text-center">
                                <div className="w-24 h-24 bg-card border border-dashed border-border rounded-xl flex items-center justify-center mx-auto shadow-sm">
                                    <Camera className="w-10 h-10 text-muted-foreground" />
                                </div>
                                <div>
                                    <input type="file" accept="image/jpeg, image/png" capture="environment" onChange={handleImageUpload} className="hidden" id="camera-upload" />
                                    <label htmlFor="camera-upload" className="px-4 py-2 cursor-pointer bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors shadow-sm inline-flex items-center">
                                        Open Hardware Camera
                                    </label>
                                </div>
                            </div>
                        )}

                        {scanned && previewUrl && (
                            <div className="absolute bottom-4 left-0 w-full flex justify-center">
                                <input type="file" accept="image/jpeg, image/png" capture="environment" onChange={handleImageUpload} className="hidden" id="camera-upload-retry" />
                                <label htmlFor="camera-upload-retry" className="px-5 py-2 cursor-pointer border border-border bg-card/90 backdrop-blur text-foreground font-medium rounded-full shadow-lg flex items-center gap-2 hover:bg-muted transition-all active:scale-95">
                                    <Camera className="w-4 h-4" /> Next Scan
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                <div className="border border-border bg-card rounded-xl shadow-sm flex flex-col overflow-hidden h-[600px]">
                    <div className="p-4 border-b border-border bg-secondary/50">
                        <h2 className="font-semibold text-foreground">Multi-Target Extractions</h2>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto">
                        {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md mb-4">{error}</div>}

                        {!scanned && !error && (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                                Extracted components will appear here.
                            </div>
                        )}

                        {scanned && aiResults?.items?.length === 0 && (
                            <div className="p-4 bg-muted/50 rounded-md border border-border text-center">
                                <p className="font-medium">No objects detected.</p>
                                <p className="text-sm text-muted-foreground mt-1">YOLOv8 couldn't identify strictly known primitives in this image.</p>
                            </div>
                        )}

                        {scanned && aiResults?.items?.length > 0 && (
                            <div className="space-y-3 pb-6">
                                {aiResults.items.map((item: any) => (
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
                                            <div className="text-right">
                                                <div className="text-sm font-semibold text-green-600 dark:text-green-400">{(item.confidence * 100).toFixed(1)}% Conf</div>
                                                <div className="text-xs text-muted-foreground mt-1">[{Math.abs(item.bbox[2] - item.bbox[0]).toFixed(0)}x{Math.abs(item.bbox[3] - item.bbox[1]).toFixed(0)}] px</div>
                                            </div>
                                        </div>

                                        <div className="mt-3 pt-3 border-t border-border/50, flex flex-col items-end">
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
                                                        : 'Add +1 Stock to DB'}
                                            </button>
                                            <span className="text-[10px] text-muted-foreground mt-2">Iteratively constructs Image Embeddings (RAG)</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
