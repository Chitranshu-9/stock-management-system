export const API_ENDPOINTS = {
    AI: {
        SINGLE_SCAN: '/api/ai/scan',
        HARDWARE_SCAN: '/api/ai/hardware-scan'
    },
    PRODUCTS: {
        BASE: '/api/products',
        PURCHASE_HISTORY: '/api/products/purchase-history',
        BOOTSTRAP_AI: '/api/products/bootstrap-ai',
        AI_INGEST: '/api/products/ai-ingest'
    },
    SALES: {
        LOGS: '/api/sales'
    },
    INVENTORY: {
        LEDGER: '/api/inventory/ledger',
        OVERVIEW: '/api/inventory/overview',
        INVOICES: '/api/inventory/invoices',
        CHECKOUT: '/api/inventory/checkout'
    },
    AUTH: {
        LOGIN: '/api/auth/login',
        VERIFY: '/api/auth/verify',
        SIGNUP: '/api/auth/signup',
        LOGOUT: '/api/auth/logout'
    },
    SUPPLIERS: {
        BASE: '/api/suppliers'
    },
    PURCHASES: {
        BASE: '/api/purchases'
    }
};
