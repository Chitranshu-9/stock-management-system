import React from 'react';
import { Package, TrendingUp, AlertTriangle, IndianRupee } from 'lucide-react';

export default function Dashboard() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Real-time insights for your business operations and inventory.
                    </p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card
                    title="Total Inventory Value"
                    value="₹ 14.5L"
                    icon={<IndianRupee className="w-5 h-5 text-primary" />}
                    trend="+5.2% from last month"
                    goodTrend={true}
                />
                <Card
                    title="Products in Stock"
                    value="1,245"
                    icon={<Package className="w-5 h-5 text-blue-500" />}
                    trend="85 low stock alerts"
                    goodTrend={false}
                />
                <Card
                    title="Today's Sales"
                    value="₹ 32,450"
                    icon={<TrendingUp className="w-5 h-5 text-success" />}
                    trend="+12% vs avg tuesday"
                    goodTrend={true}
                />
                <Card
                    title="Critical Alerts"
                    value="3"
                    icon={<AlertTriangle className="w-5 h-5 text-destructive" />}
                    trend="Require immediate action"
                    goodTrend={false}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart Area */}
                <div className="lg:col-span-2 border border-border bg-card rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-4">Sales & Adjustments Trend</h2>
                    <div className="h-64 flex items-center justify-center border-2 border-dashed border-border rounded-lg bg-secondary/20">
                        <span className="text-muted-foreground text-sm font-medium">Chart visualization area (e.g. Recharts)</span>
                    </div>
                </div>

                {/* AI Insight Assistant Summary */}
                <div className="border border-border bg-card rounded-xl shadow-sm p-6 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-primary text-xs font-bold font-mono">AI</span>
                        </div>
                        <h2 className="text-lg font-semibold">StockAI Insights</h2>
                    </div>

                    <div className="flex-1 space-y-4">
                        <div className="bg-secondary/50 rounded-lg p-3 text-sm">
                            <p className="font-medium text-foreground">Action Required</p>
                            <p className="text-muted-foreground mt-1">12 products are below their reorder levels. Recommend initiating a PO to 'Fresh Mart Suppliers'.</p>
                        </div>
                        <div className="bg-secondary/50 rounded-lg p-3 text-sm">
                            <p className="font-medium text-foreground">Trend Analysis</p>
                            <p className="text-muted-foreground mt-1">'Organic Honey 1L' sales are up 40% this week. Consider moving it to frontend display.</p>
                        </div>
                    </div>
                    <button className="mt-4 w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                        Ask AI Assistant
                    </button>
                </div>
            </div>
        </div>
    );
}

function Card({ title, value, icon, trend, goodTrend }: { title: string, value: string, icon: React.ReactNode, trend: string, goodTrend: boolean }) {
    return (
        <div className="border border-border bg-card rounded-xl shadow-sm p-5 hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
                <div className="p-2 rounded-lg bg-secondary">
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
                <p className={`text-xs mt-1 ${goodTrend ? 'text-success' : 'text-destructive/80'}`}>
                    {trend}
                </p>
            </div>
        </div>
    );
}
