import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type QueueJob = {
    id: string;
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any; // FormData or JSON Object
    status: 'queued' | 'syncing' | 'failed';
    retries: number;
    error?: string;
};

// We store transient callbacks in a ref since they can't be reliably placed in state without causing staleness
type JobCallbacks = {
    [id: string]: {
        onSuccess?: (data: any) => void;
        onError?: (err: Error) => void;
    }
};

interface NetworkQueueContextType {
    queue: QueueJob[];
    enqueueJob: (
        url: string,
        method: QueueJob['method'],
        body?: any,
        callbacks?: { onSuccess?: (data: any) => void, onError?: (err: Error) => void }
    ) => void;
    retryJob: (id: string) => void;
    dismissJob: (id: string) => void;
    activeCount: number;
    errorCount: number;
}

const NetworkQueueContext = createContext<NetworkQueueContextType | undefined>(undefined);

export function NetworkQueueProvider({ children }: { children: React.ReactNode }) {
    const [queue, setQueue] = useState<QueueJob[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);

    // Callback registry disconnected from React render cycles to prevent closure staleness
    const callbacksRef = React.useRef<JobCallbacks>({});

    const enqueueJob = useCallback((
        url: string,
        method: QueueJob['method'],
        body?: any,
        callbacks?: { onSuccess?: (data: any) => void, onError?: (err: Error) => void }
    ) => {
        const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        if (callbacks) {
            callbacksRef.current[id] = callbacks;
        }

        setQueue(prev => [...prev, {
            id,
            url,
            method,
            body,
            status: 'queued',
            retries: 0
        }]);
    }, []);

    const retryJob = useCallback((id: string) => {
        setQueue(prev => prev.map(job =>
            job.id === id ? { ...job, status: 'queued', error: undefined } : job
        ));
    }, []);

    const dismissJob = useCallback((id: string) => {
        setQueue(prev => prev.filter(job => job.id !== id));
        delete callbacksRef.current[id];
    }, []);

    // The Background Sync Worker Loop
    useEffect(() => {
        if (isSyncing) return;

        const nextJob = queue.find(j => j.status === 'queued');
        if (!nextJob) return;

        const processJob = async () => {
            setIsSyncing(true);

            // Mark as syncing natively
            setQueue(prev => prev.map(j => j.id === nextJob.id ? { ...j, status: 'syncing' } : j));

            try {
                const options: RequestInit = { method: nextJob.method };

                if (nextJob.body) {
                    if (nextJob.body instanceof FormData) {
                        options.body = nextJob.body;
                        // Fetch automatically sets the multipart/form-data boundary
                    } else {
                        options.headers = { 'Content-Type': 'application/json' };
                        options.body = JSON.stringify(nextJob.body);
                    }
                }

                const res = await fetch(nextJob.url, options);

                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || res.statusText);
                }

                const data = await res.json().catch(() => ({}));

                // Success! Execute registered onSuccess callbacks
                const cb = callbacksRef.current[nextJob.id]?.onSuccess;
                if (cb) cb(data);

                // Remove from queue natively
                setQueue(prev => prev.filter(j => j.id !== nextJob.id));
                delete callbacksRef.current[nextJob.id];
            } catch (err: any) {
                const cb = callbacksRef.current[nextJob.id]?.onError;
                if (cb) cb(err);

                // Revert to failed state and increment retries
                setQueue(prev => prev.map(j =>
                    j.id === nextJob.id
                        ? { ...j, status: 'failed', error: err.message, retries: j.retries + 1 }
                        : j
                ));
            } finally {
                setIsSyncing(false);
            }
        };

        processJob();
    }, [queue, isSyncing]);

    const activeCount = queue.filter(j => j.status === 'queued' || j.status === 'syncing').length;
    const errorCount = queue.filter(j => j.status === 'failed').length;

    return (
        <NetworkQueueContext.Provider value={{
            queue,
            enqueueJob,
            retryJob,
            dismissJob,
            activeCount,
            errorCount
        }}>
            {children}
        </NetworkQueueContext.Provider>
    );
}

export function useNetworkQueue() {
    const context = useContext(NetworkQueueContext);
    if (context === undefined) {
        throw new Error('useNetworkQueue must be used within a NetworkQueueProvider');
    }
    return context;
}
