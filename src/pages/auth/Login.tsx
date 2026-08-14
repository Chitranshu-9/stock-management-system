import { PackageSearch } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Login() {
    return (
        <div className="min-h-screen flex text-foreground bg-background">
            <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div>
                        <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-xl shadow-lg">
                            <PackageSearch className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <h2 className="mt-8 text-3xl font-bold tracking-tight">Sign in to StockAI</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Welcome back! Please enter your details.
                        </p>
                    </div>

                    <div className="mt-8">
                        <form action="#" method="POST" className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium">Email address</label>
                                <div className="mt-1">
                                    <input id="email" name="email" type="email" autoComplete="email" required className="block w-full border border-input bg-card rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm" placeholder="admin@example.com" />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium">Password</label>
                                <div className="mt-1">
                                    <input id="password" name="password" type="password" autoComplete="current-password" required className="block w-full border border-input bg-card rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm" placeholder="••••••••" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 bg-card border-input text-primary focus:ring-primary rounded" />
                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-muted-foreground border-border">Remember me</label>
                                </div>

                                <div className="text-sm">
                                    <a href="#" className="font-medium text-primary hover:text-primary/90">Forgot password?</a>
                                </div>
                            </div>

                            <div>
                                <button type="submit" className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
                                    Sign in
                                </button>
                            </div>
                        </form>

                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-background text-muted-foreground">Don't have an account?</span>
                                </div>
                            </div>

                            <div className="mt-6">
                                <Link to="/register" className="w-full flex justify-center py-2.5 px-4 border border-input rounded-md shadow-sm bg-card text-sm font-medium text-foreground hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
                                    Create a new account
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="hidden lg:block relative w-0 flex-1 bg-muted">
                <div className="absolute inset-0 h-full w-full object-cover bg-gradient-to-br from-primary via-blue-700 to-emerald-600 opacity-90 rounded-l-3xl shadow-[-10px_0_20px_rgba(0,0,0,0.1)] flex flex-col justify-center items-center text-white p-12 text-center">
                    <PackageSearch className="w-24 h-24 text-white/50 mb-8" />
                    <h2 className="text-4xl font-bold mb-4">Stock Management, Automated.</h2>
                    <p className="text-lg text-white/80 max-w-md">Instantly identify products with AI, track stock effortlessly, and generate GST invoices on the fly.</p>
                </div>
            </div>
        </div>
    );
}
