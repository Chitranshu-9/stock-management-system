import { ShoppingCart, Fingerprint, IndianRupee } from 'lucide-react';

export default function POS() {
    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6 -m-4 sm:m-0">
            {/* Product Selection & Scanner */}
            <div className="flex-1 flex flex-col bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border bg-secondary/30 flex items-center gap-4">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Scan Barcode or Search Products..."
                            className="w-full h-12 pl-4 pr-10 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary text-lg"
                        />
                    </div>
                    <button className="h-12 w-12 flex items-center justify-center bg-primary/10 text-primary rounded-lg border border-primary/20 hover:bg-primary/20 transition-colors">
                        <Fingerprint className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 p-6 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto">
                    {/* Product Cards */}
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="border border-border rounded-xl p-3 flex flex-col gap-2 hover:border-primary/50 hover:bg-muted/30 cursor-pointer transition-colors active:scale-95 group">
                            <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                                <span className="text-muted-foreground text-xs font-mono">Image</span>
                                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm line-clamp-2">Product Name Item #{i}</h3>
                                <p className="text-success font-medium flex items-center mt-1">₹ 249.00</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cart & Checkout */}
            <div className="w-full lg:w-[400px] flex flex-col bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border bg-secondary/30 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold text-lg">Current Sale</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Cart Item */}
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-muted rounded-md" />
                        <div className="flex-1 flex flex-col">
                            <span className="font-semibold text-sm">Product Name Item #1</span>
                            <span className="text-muted-foreground text-xs">₹ 249.00</span>
                        </div>
                        <div className="flex items-center gap-2 border border-input rounded-md px-2 py-1">
                            <button className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:bg-secondary rounded font-bold">-</button>
                            <span className="w-6 text-center text-sm font-medium">1</span>
                            <button className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:bg-secondary rounded font-bold">+</button>
                        </div>
                    </div>
                </div>

                {/* Totals */}
                <div className="p-4 border-t border-border bg-secondary/10 space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">₹ 249.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">SGST (9%)</span>
                        <span className="font-medium">₹ 22.41</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">CGST (9%)</span>
                        <span className="font-medium">₹ 22.41</span>
                    </div>
                    <div className="border-t border-border pt-3 mt-3 flex justify-between items-center pb-2">
                        <span className="font-bold text-lg">Total</span>
                        <span className="font-bold text-2xl text-primary">₹ 293.82</span>
                    </div>

                    <button className="w-full h-14 bg-success hover:bg-success/90 text-success-foreground rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md">
                        <IndianRupee className="w-5 h-5" />
                        Checkout Cash
                    </button>
                </div>
            </div>
        </div>
    );
}
