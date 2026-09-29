import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
    const [status, setStatus] = useState<'loading' | 'authed' | 'unauthed'>('loading');

    useEffect(() => {
        fetch('/api/auth/verify', { credentials: 'include' })
            .then(res => setStatus(res.ok ? 'authed' : 'unauthed'))
            .catch(() => setStatus('unauthed'));
    }, []);

    if (status === 'loading') {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Verifying session...</span>
                </div>
            </div>
        );
    }

    return status === 'authed' ? <Outlet /> : <Navigate to="/login" replace />;
}
