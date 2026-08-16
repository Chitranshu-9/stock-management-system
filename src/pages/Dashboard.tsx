import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertTriangle, IndianRupee, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function Dashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/inventory/overview')
            .then(res => {
                if (!res.ok) throw new Error("Dashboard metrics restricted or offline");
                return res.json();
            })
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(e => {
                setError(e.message);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    if (error) {
        return <div className="p-6 text-destructive bg-destructive/10 rounded-md border border-destructive">Failed to load Dashboard: {error}</div>;
    }

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
                    value={`₹${stats.valuation.toLocaleString('en-IN')}`}
                    icon={<IndianRupee className="w-5 h-5 text-primary" />}
                    trend="Based on active Selling Prices"
                    goodTrend={true}
                />
                <Card
                    title="Products in Stock"
                    value={stats.totalItems.toLocaleString('en-IN')}
                    icon={<Package className="w-5 h-5 text-blue-500" />}
                    trend={`${stats.skus} Unique Core SKUs tracked`}
                    goodTrend={true}
                />
                <Card
                    title="Today's Sales"
                    value={`₹${stats.todaySales.toLocaleString('en-IN')}`}
                    icon={<TrendingUp className="w-5 h-5 text-success" />}
                    trend="Transactions securely verified"
                    goodTrend={true}
                />
                <Card
                    title="Critical Alerts"
                    value={stats.lowStockAlerts.toString()}
                    icon={<AlertTriangle className="w-5 h-5 text-destructive" />}
                    trend={stats.lowStockAlerts > 0 ? "Requires immediate action" : "Operational capacity optimal"}
                    goodTrend={stats.lowStockAlerts === 0}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart Area */}
                <div className="lg:col-span-2 border border-border bg-card rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-4">Sales & Adjustments Trend (Dynamic Volume)</h2>
                    <div className="h-64 flex items-center justify-center rounded-lg">
                        {stats.chartData && stats.chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: '#f3f4f6' }}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="additions" name="Items Added" fill="#4338ca" radius={[4, 4, 0, 0]} barSize={30} />
                                    <Bar dataKey="sales" name="Sales Dispense" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <span className="text-muted-foreground text-sm font-medium">Insufficient timeline data available natively.</span>
                        )}
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
                        {stats.insights && stats.insights.map((insight: any, i: number) => (
                            <div key={i} className="bg-secondary/50 rounded-lg p-3 text-sm">
                                <p className={`font-medium ${insight.type.includes('Required') ? 'text-destructive' : 'text-foreground'}`}>{insight.type}</p>
                                <p className="text-muted-foreground mt-1">{insight.message}</p>
                            </div>
                        ))}
                    </div>
                    <button className="mt-4 w-full h-9 rounded-md bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors border border-border">
                        Generative Stock Strategy
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
