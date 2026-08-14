import { Search, Filter, Plus, FileDown, MoreHorizontal } from 'lucide-react';

const mockProducts = [
    { id: 1, sku: 'OIL-001', name: 'Premium Cooking Oil', category: 'Grocery', price: '₹450', stock: 120, status: 'In Stock' },
    { id: 2, sku: 'SHMP-200', name: 'Herbal Shampoo 200ml', category: 'Personal Care', price: '₹140', stock: 8, status: 'Low Stock' },
    { id: 3, sku: 'RCE-05', name: 'Basmati Rice 5kg', category: 'Grocery', price: '₹550', stock: 45, status: 'In Stock' },
    { id: 4, sku: 'SNK-CH', name: 'Chocolate Cookies', category: 'Snacks', price: '₹80', stock: 0, status: 'Out of Stock' },
    { id: 5, sku: 'DRK-CL', name: 'Cola Drink 2L', category: 'Beverages', price: '₹95', stock: 65, status: 'In Stock' },
];

export default function ProductList() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Products & Inventory</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage your product catalog, pricing, and stock levels.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 border border-input bg-card text-foreground rounded-md text-sm font-medium hover:bg-secondary transition-colors">
                        <FileDown className="w-4 h-4" />
                        Export
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
                        <Plus className="w-4 h-4" />
                        Add Product
                    </button>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
                {/* Toolbar */}
                <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by product name, SKU, or barcode..."
                            className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-background/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button className="flex items-center gap-2 px-3 py-1.5 border border-input bg-background rounded-md text-sm font-medium hover:bg-secondary transition-colors w-full sm:w-auto justify-center">
                            <Filter className="w-4 h-4" />
                            Category
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 border border-input bg-background rounded-md text-sm font-medium hover:bg-secondary transition-colors w-full sm:w-auto justify-center">
                            <Filter className="w-4 h-4" />
                            Stock Status
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-secondary/50 text-muted-foreground font-medium uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">Product Details</th>
                                <th className="px-6 py-4">SKU</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Price</th>
                                <th className="px-6 py-4">Stock</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {mockProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-muted/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center border border-border">
                                                <span className="text-muted-foreground text-xs font-mono">IMG</span>
                                            </div>
                                            <div className="font-medium text-foreground">{product.name}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-muted-foreground">{product.sku}</td>
                                    <td className="px-6 py-4">{product.category}</td>
                                    <td className="px-6 py-4 font-medium">{product.price}</td>
                                    <td className="px-6 py-4">{product.stock}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${product.status === 'In Stock' ? 'bg-success/15 text-success' :
                                                product.status === 'Low Stock' ? 'bg-orange-500/15 text-orange-600' :
                                                    'bg-destructive/15 text-destructive'
                                            }`}>
                                            {product.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-muted-foreground hover:text-foreground p-1 transition-colors">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Mock */}
                <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
                    <div>Showing 1 to 5 of 120 products</div>
                    <div className="flex gap-1">
                        <button className="px-3 py-1 border border-input rounded-md hover:bg-secondary transition-colors" disabled>Previous</button>
                        <button className="px-3 py-1 border border-input rounded-md bg-secondary text-foreground font-medium">1</button>
                        <button className="px-3 py-1 border border-input rounded-md hover:bg-secondary transition-colors">2</button>
                        <button className="px-3 py-1 border border-input rounded-md hover:bg-secondary transition-colors">3</button>
                        <button className="px-3 py-1 border border-input rounded-md hover:bg-secondary transition-colors">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
