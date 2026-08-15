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

export function Sidebar() {
    return (
        <aside className="w-64 border-r border-border bg-card flex flex-col h-screen sticky top-0">
            <div className="h-16 flex items-center px-6 border-b border-border">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-lg">S</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight">StockAI</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium",
                                isActive
                                    ? "bg-primary/10 text-primary"
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
                <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-secondary/50">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        A
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold leading-none">Admin</span>
                        <span className="text-xs text-muted-foreground mt-1">Super Store</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
