import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Moon, Sun, AlertTriangle, CheckCircle2, Info, Menu, Command, Box, LayoutDashboard, Crosshair, Package, ArrowRight, RefreshCw, CloudOff } from 'lucide-react';
import { useTheme } from '../theme-provider';
import { useNetworkQueue } from '../../contexts/NetworkQueueContext';

const mockNotifications = [
    { id: 1, type: 'alert', title: 'Low Stock Alert', desc: 'Premium Cooking Oil is below reorder level.', time: '10m ago', unread: true },
    { id: 2, type: 'success', title: 'PO Received', desc: 'PO-2026-045 has been fully received.', time: '2h ago', unread: true },
    { id: 3, type: 'info', title: 'System Update', desc: 'New AI weights deployed.', time: '1d ago', unread: false },
];

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const { activeCount, errorCount } = useNetworkQueue();

    // Notifications State
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState(mockNotifications);
    const notifRef = useRef<HTMLDivElement>(null);

    // Command Search State
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [catalogResults, setCatalogResults] = useState<any[]>([]);
    const searchRef = useRef<HTMLInputElement>(null);

    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        }

        function handleGlobalKey(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(prev => !prev);
            }
            if (e.key === 'Escape') setIsSearchOpen(false);
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleGlobalKey);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleGlobalKey);
        };
    }, []);

    useEffect(() => {
        if (isSearchOpen && searchRef.current) {
            searchRef.current.focus();
        }
    }, [isSearchOpen]);

    useEffect(() => {
        if (!searchTerm) {
            setCatalogResults([]);
            return;
        }

        const delay = setTimeout(() => {
            fetch(`/api/products?search=${encodeURIComponent(searchTerm)}`)
                .then(res => res.json())
                .then(data => setCatalogResults(data.slice(0, 5)))
                .catch(() => { });
        }, 300);

        return () => clearTimeout(delay);
    }, [searchTerm]);

    const unreadCount = notifications.filter(n => n.unread).length;

    const markAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, unread: false })));
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'alert': return <AlertTriangle className="w-4 h-4 text-destructive" />;
            case 'success': return <CheckCircle2 className="w-4 h-4 text-success" />;
            default: return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    return (
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-[2px] sticky top-0 z-40 flex items-center justify-between px-4 md:px-6">
            <div className="flex items-center flex-1 gap-3">
                <button
                    onClick={onMenuClick}
                    className="md:hidden flex items-center justify-center w-10 h-10 text-muted-foreground hover:bg-secondary rounded-md transition-colors"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <div
                    onClick={() => setIsSearchOpen(true)}
                    className="relative w-96 hidden md:flex items-center group cursor-pointer"
                >
                    <Search className="absolute left-3 w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-background/50 flex items-center justify-between group-hover:border-primary/50 transition-colors">
                        <span className="text-sm text-muted-foreground">Search products, orders...</span>
                        <div className="flex gap-1">
                            <kbd className="inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">Ctrl</kbd>
                            <kbd className="inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">K</kbd>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Global Distributed Background Sync Indicator */}
                {(activeCount > 0 || errorCount > 0) && (
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border transition-all duration-300">
                        {activeCount > 0 ? (
                            <>
                                <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" />
                                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Syncing {activeCount} actions</span>
                            </>
                        ) : (
                            <>
                                <CloudOff className="w-3.5 h-3.5 text-destructive" />
                                <span className="text-xs font-medium text-destructive whitespace-nowrap">{errorCount} failed</span>
                            </>
                        )}
                    </div>
                )}

                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="w-9 h-9 rounded-md flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors relative"
                    >
                        <Bell className="w-4 h-4" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                            <div className="p-3 border-b border-border flex justify-between items-center bg-secondary/30">
                                <h3 className="font-semibold text-sm">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button onClick={markAllRead} className="text-xs text-primary hover:underline font-medium">
                                        Mark all read
                                    </button>
                                )}
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length > 0 ? (
                                    <div className="flex flex-col">
                                        {notifications.map((notif) => (
                                            <div key={notif.id} className={`p-4 border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer flex gap-3 ${notif.unread ? 'bg-primary/5' : ''}`}>
                                                <div className="mt-0.5">{getIcon(notif.type)}</div>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <h4 className={`text-sm font-medium ${notif.unread ? 'text-foreground' : 'text-muted-foreground'}`}>{notif.title}</h4>
                                                        <span className="text-xs text-muted-foreground whitespace-nowrap">{notif.time}</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground line-clamp-2">{notif.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-sm text-muted-foreground">
                                        No new notifications
                                    </div>
                                )}
                            </div>
                            <div className="p-2 border-t border-border bg-secondary/30 text-center">
                                <button className="text-xs text-muted-foreground hover:text-foreground font-medium w-full py-1">View all notifications</button>
                            </div>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => setTheme(isDark ? 'light' : 'dark')}
                    className="w-9 h-9 rounded-md flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
            </div>

            {/* Omni-Search Modal */}
            {isSearchOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 sm:pt-32 px-4 backdrop-blur-sm bg-background/50 animate-in fade-in duration-200">
                    <div
                        className="fixed inset-0 w-full h-full"
                        onClick={() => setIsSearchOpen(false)}
                    />
                    <div className="relative w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden shadow-primary/5 flex flex-col max-h-[80vh] animate-in slide-in-from-top-4 duration-300">
                        {/* Search Input Bar */}
                        <div className="flex items-center px-4 py-3 border-b border-border bg-secondary/20">
                            <Search className="w-5 h-5 text-primary mr-3 shrink-0" />
                            <input
                                ref={searchRef}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Type a command or search ledger..."
                                className="flex-1 bg-transparent border-none outline-none text-foreground font-medium placeholder:text-muted-foreground placeholder:font-normal"
                            />
                            <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded bg-muted px-2 font-mono text-xs font-medium text-muted-foreground opacity-70 ml-2">ESC</kbd>
                        </div>

                        {/* Results Body */}
                        <div className="flex-1 overflow-y-auto p-2">
                            {/* Native Application Routing */}
                            {(!searchTerm || "dashboard".includes(searchTerm.toLowerCase()) || "scan".includes(searchTerm.toLowerCase())) && (
                                <div className="mb-4">
                                    <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">System Maps</h3>
                                    <div className="flex flex-col gap-1 mt-1">
                                        <button
                                            onClick={() => { navigate('/'); setIsSearchOpen(false); }}
                                            className="flex items-center justify-between w-full p-3 py-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-3"><LayoutDashboard className="w-4 h-4" /> <span className="font-medium text-sm">Main Dashboard</span></div>
                                            <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                                        </button>
                                        <button
                                            onClick={() => { navigate('/hardware-scan'); setIsSearchOpen(false); }}
                                            className="flex items-center justify-between w-full p-3 py-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-3"><Crosshair className="w-4 h-4" /> <span className="font-medium text-sm">AI Hardware Scanning</span></div>
                                            <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                                        </button>
                                        <button
                                            onClick={() => { navigate('/inventory'); setIsSearchOpen(false); }}
                                            className="flex items-center justify-between w-full p-3 py-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-3"><Package className="w-4 h-4" /> <span className="font-medium text-sm">Core Inventory Management</span></div>
                                            <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Database Live Objects */}
                            {searchTerm && (
                                <div className="mb-2">
                                    <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Catalog Ledger</h3>
                                    <div className="flex flex-col gap-1 mt-1">
                                        {catalogResults.map((product) => (
                                            <button
                                                key={product._id}
                                                onClick={() => { navigate('/inventory'); setIsSearchOpen(false); }}
                                                className="flex items-center justify-between w-full p-3 py-2.5 rounded-lg hover:bg-primary/10 transition-colors text-left group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center border border-border group-hover:border-primary/50 overflow-hidden shadow-sm">
                                                        {product.aiTrainingImages?.[0] ? (
                                                            <img src={product.aiTrainingImages[0]} alt={product.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Box className="w-4 h-4 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-sm group-hover:text-primary transition-colors">{product.name}</span>
                                                        <span className="text-xs text-muted-foreground font-mono">{product.sku} | Block: {product.currentStock} Units</span>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded uppercase hidden sm:block border border-success/20">Rs. {product.sellingPrice}</span>
                                            </button>
                                        ))}

                                        {catalogResults.length === 0 && (
                                            <div className="text-center py-10 px-4 text-muted-foreground">
                                                <Command className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                                <p className="text-sm font-medium text-foreground mb-1">No structures matched</p>
                                                <p className="text-xs">We couldn't locate any products, schemas, or ledgers mapping perfectly to "<span className="font-semibold text-foreground">{searchTerm}</span>".</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
