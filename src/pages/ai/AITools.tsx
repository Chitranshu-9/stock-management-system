import React, { useState } from 'react';
import { Camera, Image as ImageIcon, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AITools() {
    const [scanning, setScanning] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [aiResults, setAiResults] = useState<any>(null);
    const [error, setError] = useState<string>('');
    const [previewUrl, setPreviewUrl] = useState<string>('');

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // UX Reflection - Allow user to see what they actually uploaded
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(file));

        setScanning(true);
        setScanned(false);
        setError('');
        setAiResults(null);

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch('/api/ai/scan', {
                method: 'POST',
                body: formData // Content-Type omitted dynamically for Multer boundaries
            });

            if (!res.ok) {
                // Inversion Protection: Vite proxy might return 502/504 HTML if backend crashes.
                // Blindly awaiting res.json() here throws a SyntaxError and crashes React fetch handler!
                const textStr = await res.text();
                let errMessage = `HTTP ${res.status}: Failed to process image.`;
                try {
                    const parsed = JSON.parse(textStr);
                    errMessage = parsed.error || errMessage;
                } catch (e) {
                    if (textStr.includes('ECONNREFUSED') || textStr.includes('504')) {
                        errMessage = 'Critical: Backend Node Server is offline or proxy failed.';
                    } else if (res.status === 413) {
                        errMessage = 'File too large (exceeds 5MB limits).';
                    }
                }

                setError(errMessage);
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
            // Optionally clear file input so user can re-select same file:
            e.target.value = '';
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">AI Product Scanner</h1>
                <p className="text-muted-foreground text-sm mt-1">Upload or capture product images to automatically identify and update inventory.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upload/Camera Zone */}
                <div className="border border-border bg-card rounded-xl shadow-sm overflow-hidden flex flex-col h-[500px]">
                    <div className="p-4 border-b border-border bg-secondary/50">
                        <h2 className="font-semibold flex items-center gap-2">
                            <Camera className="w-5 h-5 text-primary" />
                            Capture Mode
                        </h2>
                    </div>

                    <div className="flex-1 p-6 flex flex-col items-center justify-center bg-muted/30 relative">
                        {scanning ? (
                            <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden">
                                <div className="relative w-64 h-64 bg-card rounded-lg border-2 border-primary/50 shadow-2xl flex items-center justify-center overflow-hidden">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Scan Target" className="w-full h-full object-cover opacity-70" />
                                    ) : (
                                        <PackagePlaceholder />
                                    )}
                                    {/* Scanning Animation */}
                                    <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_15px_rgba(79,70,229,0.8)] animate-pulse" style={{ animation: 'scan 2s ease-in-out infinite alternate' }} />
                                </div>
                                <p className="mt-6 text-primary font-medium flex items-center gap-2 animate-pulse">
                                    <Sparkles className="w-4 h-4" /> Analyzing visual features...
                                </p>
                                <style>{`
                  @keyframes scan {
                    0% { top: 0; }
                    100% { top: 100%; }
                  }
                `}</style>
                            </div>
                        ) : scanned && previewUrl ? (
                            <div className="w-full h-full flex flex-col items-center justify-center relative">
                                <div className="relative w-64 h-64 bg-card rounded-lg border-2 border-success/50 shadow-md flex items-center justify-center overflow-hidden">
                                    <img src={previewUrl} alt="Scanned Result" className="w-full h-full object-cover" />
                                    {error && <div className="absolute inset-0 bg-destructive/20" />}
                                </div>
                                <div className="mt-6 flex gap-3">
                                    <input type="file" accept="image/jpeg, image/png" capture="environment" onChange={handleImageUpload} className="hidden" id="camera-upload-retry" />
                                    <label htmlFor="camera-upload-retry" className="px-5 py-2 cursor-pointer border border-border bg-card text-foreground font-medium rounded-full shadow-sm flex items-center gap-2 hover:bg-muted transition-all active:scale-95">
                                        <Camera className="w-4 h-4" /> Scan Another
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 text-center">
                                <div className="w-24 h-24 bg-card border border-dashed border-border rounded-xl flex items-center justify-center mx-auto shadow-sm">
                                    <ImageIcon className="w-10 h-10 text-muted-foreground" />
                                </div>
                                <div>
                                    <input
                                        type="file"
                                        accept="image/jpeg, image/png"
                                        capture="environment"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        id="camera-upload"
                                    />
                                    <label htmlFor="camera-upload" className="px-4 py-2 cursor-pointer bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors shadow-sm inline-flex items-center">
                                        Scan using Camera
                                    </label>
                                    <p className="mt-3 text-xs text-muted-foreground max-w-[200px] mx-auto">
                                        Take a picture or upload an image for SmolVLM processing.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Results Zone */}
                <div className="border border-border bg-card rounded-xl shadow-sm flex flex-col h-[500px]">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                        <h2 className="font-semibold flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            AI Identification
                        </h2>
                        {scanned && <span className="text-xs bg-success/15 text-success px-2 py-1 rounded-full font-medium">Scan Complete</span>}
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto bg-muted/10">
                        {!scanned && !scanning && (
                            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                                <Sparkles className="w-12 h-12 mb-3 text-muted" />
                                <p>Awaiting image capture...</p>
                            </div>
                        )}
                        {scanning && (
                            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-3">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm">Querying vector database...</p>
                            </div>
                        )}
                        {scanned && aiResults && !error && (
                            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                                <div className="p-4 rounded-lg border border-border bg-background shadow-sm hover:border-primary/50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-semibold text-lg">{aiResults.aiIdentification?.productName || 'Unknown Product'}</div>
                                        <span className={`flex items-center gap-1 text-sm font-medium px-2.5 py-0.5 rounded-full ${aiResults.aiIdentification?.confidence > 0.85 ? 'bg-success/15 text-success' : 'bg-amber-500/15 text-amber-500'}`}>
                                            <CheckCircle2 className="w-4 h-4" /> {Math.round((aiResults.aiIdentification?.confidence || 0) * 100)}% Match
                                        </span>
                                    </div>
                                    <div className="text-sm text-muted-foreground mb-4">
                                        Provider: {aiResults.inferenceProvider}
                                    </div>

                                    <div className="border-t border-border pt-4">
                                        <h3 className="text-xs uppercase font-semibold text-muted-foreground mb-3">Live Catalog Matches ({aiResults.catalogMatches?.length || 0})</h3>

                                        {aiResults.catalogMatches?.map((match: any) => (
                                            <div key={match._id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                                                <div>
                                                    <p className="font-medium text-sm">{match.name}</p>
                                                    <p className="text-xs text-muted-foreground">SKU: {match.sku} | Unit: {match.unit}</p>
                                                </div>
                                                <button className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-md text-xs font-medium transition-colors">
                                                    Select
                                                </button>
                                            </div>
                                        ))}

                                        {aiResults.catalogMatches?.length === 0 && (
                                            <div className="text-sm text-muted-foreground italic p-2 bg-muted rounded">
                                                No DB products matched this AI scan snippet.
                                                <button className="text-primary underline block mt-2 font-medium">Create New Product</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
                                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-6 rounded-xl max-w-sm">
                                    <h3 className="font-semibold mb-2">AI Processing Failed</h3>
                                    <p className="text-sm opacity-90">{error}</p>
                                    <button onClick={() => setError('')} className="mt-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-md text-sm font-medium">
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function PackagePlaceholder() {
    return (
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
            <path d="m7.5 4.27 9 5.15" />
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
        </svg>
    )
}
