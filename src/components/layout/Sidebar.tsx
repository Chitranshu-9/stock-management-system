import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    PackageSearch,
    ScanLine,
    Package,
    History,
    Scan,
    ShoppingCart,
    ShoppingBag,
    PieChart,
    Settings as SettingsIcon,
    X,
    LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Package, label: 'Inventory', path: '/inventory' },
    { icon: History, label: 'Stock Ledger', path: '/inventory/ledger' },
    { icon: Scan, label: 'AI Scanner', path: '/ai-tools' },
    { icon: ShoppingCart, label: 'GST Billing & POS', path: '/sales' },
    { icon: ShoppingBag, label: 'Purchase Orders', path: '/purchases' },
    { icon: PieChart, label: 'Reports', path: '/reports' },
    { icon: SettingsIcon, label: 'Settings', path: '/settings' },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
    return (
        <aside className="w-72 md:w-64 border-r border-border bg-card flex flex-col h-screen sticky top-0 shadow-2xl md:shadow-none">
            <div className="h-16 flex items-center justify-between px-6 border-b border-border">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-lg">S</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight">StockAI</span>
                </div>
                {onClose && (
                    <button onClick={onClose} className="md:hidden p-2 text-muted-foreground hover:bg-secondary rounded-md">
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-3 py-2.5 md:py-2 rounded-md transition-all duration-200 text-[15px] md:text-sm font-medium",
                                isActive
                                    ? "bg-primary/10 text-primary font-semibold"
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            )
                        }
                    >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                    </NavLink>
                ))}
            </div>

            <div className="p-4 border-t border-border">
                <div className="flex items-center justify-between px-3 py-2 rounded-md bg-secondary/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            A
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold leading-none">Admin</span>
                            <span className="text-xs text-muted-foreground mt-1">Super Store</span>
                        </div>
                    </div>
                    <NavLink to="/login" className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded hover:bg-background">
                        <LogOut className="w-4 h-4" />
                    </NavLink>
                </div>
            </div>
        </aside>
    );
}
