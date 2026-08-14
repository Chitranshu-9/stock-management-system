import React from 'react';
import { Search, Bell, Moon, Sun } from 'lucide-react';

export function Header() {
    // Hardcoded for mockup purposes
    const isDark = false;

    return (
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-[2px] sticky top-0 z-40 flex items-center justify-between px-6">
            <div className="flex items-center flex-1">
                <div className="relative w-96 hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search products, orders (Ctrl+K)"
                        className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-shadow"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="w-9 h-9 rounded-md flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors relative">
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
                </button>
                <button className="w-9 h-9 rounded-md flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
            </div>
        </header>
    );
}
