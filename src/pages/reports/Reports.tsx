import { FileText, Download, TrendingUp, Package, Calculator } from 'lucide-react';

const reportTypes = [
    { icon: TrendingUp, title: 'Sales Report', desc: 'Daily, monthly and itemized sales overviews.', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { icon: Package, title: 'Inventory Valuation', desc: 'Current valuation based on purchase rates.', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { icon: Calculator, title: 'GST Summary', desc: 'Input and output tax compilation for filing.', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { icon: FileText, title: 'Purchase History', desc: 'Detailed log of all supplier procurements.', color: 'text-orange-500', bg: 'bg-orange-500/10' },
];

export default function Reports() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Business Reports & Analytics</h1>
                <p className="text-muted-foreground text-sm mt-1">Export critical business data for accounting and analysis.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportTypes.map((report, i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-primary/50 transition-colors shadow-sm group">
                        <div className="flex gap-4 items-center">
                            <div className={`p-3 rounded-lg ${report.bg}`}>
                                <report.icon className={`w-6 h-6 ${report.color}`} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">{report.title}</h3>
                                <p className="text-muted-foreground text-sm mt-1">{report.desc}</p>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 border border-input rounded-md text-sm font-medium hover:bg-secondary transition-colors whitespace-nowrap w-full sm:w-auto justify-center opacity-80 group-hover:opacity-100">
                            <Download className="w-4 h-4" />
                            Generate
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-8 bg-card border border-border rounded-xl p-6 shadow-sm">
                <h2 className="font-semibold mb-4">Export Configuration</h2>
                <div className="max-w-md space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Date Range</label>
                        <select className="w-full h-10 px-3 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                            <option>This Month (August 2026)</option>
                            <option>Last Month (July 2026)</option>
                            <option>Current Financial Year</option>
                            <option>Custom Range...</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Export Format</label>
                        <select className="w-full h-10 px-3 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                            <option>Excel (.xlsx)</option>
                            <option>Comma Separated (.csv)</option>
                            <option>PDF Document (.pdf)</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}
