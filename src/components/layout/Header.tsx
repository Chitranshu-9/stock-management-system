import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Moon, Sun, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useTheme } from '../theme-provider';

const mockNotifications = [
    { id: 1, type: 'alert', title: 'Low Stock Alert', desc: 'Premium Cooking Oil is below reorder level.', time: '10m ago', unread: true },
    { id: 2, type: 'success', title: 'PO Received', desc: 'PO-2026-045 has been fully received.', time: '2h ago', unread: true },
    { id: 3, type: 'info', title: 'System Update', desc: 'New AI weights deployed.', time: '1d ago', unread: false },
];

export function Header() {
    const { theme, setTheme } = useTheme();
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState(mockNotifications);
    const notifRef = useRef<HTMLDivElement>(null);

    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-[2px] sticky top-0 z-40 flex items-center justify-between px-6">
            <div className="flex items-center flex-1">
                <div className="relative w-96 hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search products, orders (Ctrl+K)"
                        className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-background/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-shadow"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
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
        </header>
    );
}
