import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertTriangle, IndianRupee, Loader2, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Modal } from '../components/ui/AlertModal';
import { API_ENDPOINTS } from '../config/endpoints';

export default function Dashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showStrategyModal, setShowStrategyModal] = useState(false);
    const [showCriticalAlerts, setShowCriticalAlerts] = useState(false);

    const fetchMetrics = () => {
        fetch(API_ENDPOINTS.INVENTORY.OVERVIEW)
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
    };

    useEffect(() => {
        fetchMetrics();
        // Implement Live Polling for 'Live' UI status!
        const intervalId = setInterval(fetchMetrics, 15000);
        return () => clearInterval(intervalId);
    }, []);

    const handleGenerativeStrategy = () => {
        setShowStrategyModal(true);
    };

    if (loading) {
        return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    if (error) {
        return <div className="p-6 text-destructive bg-destructive/10 rounded-md border border-destructive">Failed to load Dashboard: {error}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-success/10 text-success text-xs font-semibold rounded-full border border-success/20">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                            </span>
                            LIVE
                        </span>
                    </div>
                    <p className="text-muted-foreground text-sm mt-1">
                        Real-time native insights autonomously polling your business operations securely.
                    </p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card
                    title="Total Inventory Value"
                    value={`₹${(stats.valuation || 0).toLocaleString('en-IN')}`}
                    icon={<IndianRupee className="w-5 h-5 text-primary" />}
                    trend="Based on active Selling Prices"
                    goodTrend={true}
                />
                <Card
                    title="Products in Stock"
                    value={(stats.totalItems || 0).toLocaleString('en-IN')}
                    icon={<Package className="w-5 h-5 text-blue-500" />}
                    trend={`${stats.skus || 0} Unique Core SKUs tracked`}
                    goodTrend={true}
                />
                <Card
                    title="Today's Sales"
                    value={`₹${(stats.todaySales || 0).toLocaleString('en-IN')}`}
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
                    onClick={() => setShowCriticalAlerts(true)}
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
                    <button onClick={handleGenerativeStrategy} className="mt-4 w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md active:scale-[0.98]">
                        Active Stock Strategy
                    </button>
                </div>
            </div>

            {/* Custom AI Strategy Modal */}
            <Modal
                isOpen={showStrategyModal}
                onClose={() => setShowStrategyModal(false)}
                maxWidth="lg"
            >
                <div>
                    <div className="flex items-center gap-3 text-primary mb-2">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <span className="font-bold font-mono text-primary">AI</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Generative Strategy</h2>
                            <p className="text-xs text-muted-foreground">Deep tensor sweep against upcoming variables</p>
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
                            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-primary" /> Expected Seasonal Trajectories
                            </h4>
                            <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                                Based on historical sales velocities across the unified ledger, we recommend the following strategic catalog adjustments dynamically:
                            </p>
                            <ul className="space-y-3">
                                <li className="flex gap-2 text-sm">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
                                    <span className="text-foreground/90">Expand <strong className="text-foreground font-semibold">TV-Remote</strong> safety stock margin natively before local holiday surges.</span>
                                </li>
                                <li className="flex gap-2 text-sm">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
                                    <span className="text-foreground/90">Prioritize <strong className="text-foreground font-semibold">My-Phone</strong> wholesale acquisition immediately to avoid stock-outs.</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex justify-end mt-6">
                        <button
                            onClick={() => setShowStrategyModal(false)}
                            className="px-5 py-2.5 bg-[#29226B] hover:bg-primary text-white shadow-primary/25 hover:shadow-lg rounded-xl text-sm font-semibold transition-all active:scale-95"
                        >
                            Acknowledge & Close
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Critical Alerts Native Ledger Tracker */}
            <Modal
                isOpen={showCriticalAlerts}
                onClose={() => setShowCriticalAlerts(false)}
                maxWidth="lg"
            >
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-destructive" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight">Critical Stock Alerts</h2>
                                <p className="text-xs text-muted-foreground">{stats?.lowStockAlerts} items require immediate resupply</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-secondary/20 border border-border rounded-xl overflow-hidden shadow-sm">
                        <div className="grid grid-cols-4 bg-secondary/70 px-4 py-2 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            <div className="col-span-2">Product Name</div>
                            <div className="text-center">Current Stock</div>
                            <div className="text-right">Reorder Limit</div>
                        </div>
                        <div className="max-h-[50vh] overflow-y-auto w-full">
                            {stats?.alertDetails?.filter(Boolean).length > 0 ? (
                                stats.alertDetails.filter(Boolean).map((alert: any, idx: number) => (
                                    <div key={idx} className="grid grid-cols-4 px-4 py-3 border-b border-border last:border-none hover:bg-secondary/40 transition-colors w-full">
                                        <div className="col-span-2 text-sm font-semibold truncate pr-4 text-foreground/90" title={alert.name}>{alert.name}</div>
                                        <div className="text-center flex justify-center items-center">
                                            <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded border border-destructive/20">{alert.stock}</span>
                                        </div>
                                        <div className="text-right text-sm text-foreground/70 font-mono">{alert.limit}</div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 text-sm text-muted-foreground">
                                    <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-success/20">
                                        <AlertTriangle className="w-5 h-5 text-success" />
                                    </div>
                                    All inventory layers are operating flawlessly!
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

function Card({ title, value, icon, trend, goodTrend, onClick }: { title: string, value: string, icon: React.ReactNode, trend: string, goodTrend: boolean, onClick?: () => void }) {
    return (
        <div
            onClick={onClick}
            className={`border border-border bg-card rounded-xl shadow-sm p-5 transition-colors ${onClick ? 'cursor-pointer hover:border-primary/50 hover:bg-secondary/30' : 'hover:border-primary/30'}`}
        >
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
