import { User, Store, Shield, Bell } from 'lucide-react';

export default function Settings() {
    return (
        <div className="space-y-6 max-w-5xl">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground text-sm mt-1">Manage your account settings and business preferences.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-64 space-y-1">
                    <button className="w-full flex items-center gap-3 px-3 py-2 bg-primary/10 text-primary rounded-md text-sm font-medium transition-colors">
                        <Store className="w-4 h-4" /> Business Profile
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-muted-foreground rounded-md text-sm font-medium hover:bg-secondary hover:text-foreground transition-colors">
                        <User className="w-4 h-4" /> Account
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-muted-foreground rounded-md text-sm font-medium hover:bg-secondary hover:text-foreground transition-colors">
                        <Shield className="w-4 h-4" /> Tax & GST
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-muted-foreground rounded-md text-sm font-medium hover:bg-secondary hover:text-foreground transition-colors">
                        <Bell className="w-4 h-4" /> Notifications
                    </button>
                </div>

                <div className="flex-1 bg-card border border-border rounded-xl shadow-sm p-6 space-y-6">
                    <div>
                        <h2 className="text-lg font-semibold">Business Information</h2>
                        <p className="text-sm text-muted-foreground">Update your store details and GST configuration.</p>
                    </div>

                    <div className="border-t border-border pt-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Business Name</label>
                                <input type="text" defaultValue="Super Store" className="w-full h-10 px-3 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">GSTIN</label>
                                <input type="text" defaultValue="29ABCDE1234F1Z5" className="w-full h-10 px-3 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Registered Address</label>
                            <textarea rows={3} defaultValue="123 Market Road, Tech Hub&#10;Bengaluru, Karnataka 560100" className="w-full p-3 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Invoice Prefix</label>
                                <input type="text" defaultValue="INV-2026/" className="w-full h-10 px-3 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
