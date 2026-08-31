import React from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, icon, children, maxWidth = 'sm' }: ModalProps) {
    if (!isOpen) return null;

    const maxWidthClass = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl'
    }[maxWidth];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className={`bg-card w-full ${maxWidthClass} border border-border shadow-2xl rounded-2xl p-6 relative animate-in fade-in zoom-in duration-200`}>
                <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary">
                    <X className="w-5 h-5" />
                </button>

                {(title || icon) && (
                    <div className="flex items-center gap-3 text-foreground mb-4">
                        {icon && <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 text-primary">{icon}</div>}
                        {title && <h2 className="text-xl font-bold tracking-tight">{title}</h2>}
                    </div>
                )}

                {children}
            </div>
        </div>
    );
}

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'error' | 'warning' | 'info';
}

export function AlertModal({ isOpen, onClose, title, message, type = 'error' }: AlertModalProps) {
    if (!isOpen) return null;

    const isError = type === 'error' || type === 'warning';

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className={`bg-card w-full max-w-sm border shadow-2xl rounded-2xl p-6 relative animate-in fade-in zoom-in duration-200 ${isError ? 'border-destructive/20' : 'border-border'}`}>
                <div className="flex flex-col items-center text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isError ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                        {isError ? <AlertTriangle className="w-6 h-6" /> : <Info className="w-6 h-6" />}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{title}</h3>
                    <p className="text-sm text-foreground/80 mb-6 leading-relaxed">
                        {message}
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-secondary text-foreground hover:bg-secondary/80 rounded-xl text-sm font-semibold transition-colors active:scale-95 border border-border"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
}
