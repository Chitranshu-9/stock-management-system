import React, { useState } from 'react';
import { Camera, Image as ImageIcon, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AITools() {
    const [scanning, setScanning] = useState(false);
    const [scanned, setScanned] = useState(false);

    const simulateScan = () => {
        setScanning(true);
        setScanned(false);
        setTimeout(() => {
            setScanning(false);
            setScanned(true);
        }, 2500);
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
                                <div className="relative w-64 h-64 bg-card rounded-lg border-2 border-primary/50 shadow-2xl flex items-center justify-center">
                                    <PackagePlaceholder />
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
                        ) : (
                            <div className="space-y-4 text-center">
                                <div className="w-24 h-24 bg-card border border-dashed border-border rounded-xl flex items-center justify-center mx-auto shadow-sm">
                                    <ImageIcon className="w-10 h-10 text-muted-foreground" />
                                </div>
                                <div>
                                    <button onClick={simulateScan} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors shadow-sm">
                                        Capture Shelf
                                    </button>
                                    <p className="mt-3 text-xs text-muted-foreground max-w-[200px] mx-auto">
                                        Drag and drop images, or click to use device camera.
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
                        {scanned && (
                            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                                <div className="p-4 rounded-lg border border-border bg-background shadow-sm hover:border-primary/50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-semibold text-lg">Premium Cooking Oil 1L</div>
                                        <span className="flex items-center gap-1 text-sm font-medium text-success bg-success/10 px-2.5 py-0.5 rounded-full">
                                            <CheckCircle2 className="w-4 h-4" /> 98% Match
                                        </span>
                                    </div>
                                    <div className="text-sm text-muted-foreground flex gap-4 mb-4">
                                        <span>SKU: OIL-001</span>
                                        <span>Category: Grocery</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="flex-1 bg-primary text-primary-foreground py-1.5 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">Confirm & Add Stock</button>
                                        <button className="flex-1 bg-secondary text-foreground border border-input py-1.5 rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors">Edit Match</button>
                                    </div>
                                </div>

                                <div className="p-4 rounded-lg border border-border bg-background shadow-sm hover:border-primary/50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-semibold text-lg">Herbal Shampoo 200ml</div>
                                        <span className="flex items-center gap-1 text-sm font-medium text-blue-500 bg-blue-500/10 px-2.5 py-0.5 rounded-full">
                                            <CheckCircle2 className="w-4 h-4" /> 84% Match
                                        </span>
                                    </div>
                                    <div className="text-sm text-muted-foreground flex gap-4 mb-4">
                                        <span>SKU: SHMP-200</span>
                                        <span>Category: Personal Care</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="flex-1 bg-primary text-primary-foreground py-1.5 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">Confirm & Add Stock</button>
                                        <button className="flex-1 bg-secondary text-foreground border border-input py-1.5 rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors">Edit Match</button>
                                    </div>
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
