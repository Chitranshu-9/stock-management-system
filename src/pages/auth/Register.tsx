import { PackageSearch } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Register() {
    return (
        <div className="min-h-screen flex text-foreground bg-background">
            <div className="hidden lg:block relative w-0 flex-1 bg-muted">
                <div className="absolute inset-0 h-full w-full object-cover bg-gradient-to-tr from-emerald-600 via-teal-700 to-primary/90 opacity-90 rounded-r-3xl shadow-[10px_0_20px_rgba(0,0,0,0.1)] flex flex-col justify-center items-center text-white p-12 text-center z-10">
                    <PackageSearch className="w-24 h-24 text-white/50 mb-8" />
                    <h2 className="text-4xl font-bold mb-4">Start your journey today.</h2>
                    <p className="text-lg text-white/80 max-w-md">Join thousands of businesses managing their stock with AI-powered insights and GST-ready invoices.</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div>
                        <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-xl shadow-lg">
                            <span className="text-primary-foreground font-bold text-xl">S</span>
                        </div>
                        <h2 className="mt-8 text-3xl font-bold tracking-tight">Create an account</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Sign up to start transforming your inventory management.
                        </p>
                    </div>

                    <div className="mt-8">
                        <form action="#" method="POST" className="space-y-5">
                            <div>
                                <label htmlFor="business" className="block text-sm font-medium">Business Name</label>
                                <div className="mt-1">
                                    <input id="business" name="business" type="text" required className="block w-full border border-input bg-card rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm" placeholder="Super Store" />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium">Email address</label>
                                <div className="mt-1">
                                    <input id="email" name="email" type="email" autoComplete="email" required className="block w-full border border-input bg-card rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm" placeholder="admin@example.com" />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium">Password</label>
                                <div className="mt-1">
                                    <input id="password" name="password" type="password" required className="block w-full border border-input bg-card rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm" placeholder="••••••••" />
                                </div>
                            </div>

                            <div className="pt-2">
                                <button type="submit" className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
                                    Next Step
                                </button>
                            </div>
                        </form>

                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-background text-muted-foreground">Already a user?</span>
                                </div>
                            </div>

                            <div className="mt-6">
                                <Link to="/login" className="w-full flex justify-center py-2.5 px-4 border border-input rounded-md shadow-sm bg-card text-sm font-medium text-foreground hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
                                    Sign in instead
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
