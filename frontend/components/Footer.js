"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Twitter, Linkedin, Github, Mail, TrendingUp, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function Footer() {
    const pathname = usePathname();
    const [email, setEmail] = useState('');

    // Hide footer conditionally on authentication routes
    const hiddenRoutes = ['/login', '/signup', '/otp'];
    if (hiddenRoutes.includes(pathname)) {
        return null;
    }

    const handleSubscribe = (e) => {
        e.preventDefault();
        if (!email) {
            toast.error("Please enter a valid email to subscribe.");
            return;
        }
        toast.success(`Subscribed ${email} to weekly AI insights!`);
        setEmail('');
    };

    const handleComingSoon = (e) => {
        e.preventDefault();
        toast("This feature is arriving in the next major update!", { icon: '🚀' });
    };
    return (
        <footer className="bg-gray-900 text-gray-300 py-12 border-t border-gray-800 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand Section */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center space-x-2 group">
                            <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20">
                                <TrendingUp className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xl font-bold text-white tracking-tight">TradeMind AI</span>
                        </Link>
                        <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                            Empowering investors with institutional-grade AI analytics, real-time prediction engines, and massive quantitative datasets.
                        </p>
                        <div className="flex space-x-4 pt-2">
                            <a href="#" className="text-gray-400 hover:text-blue-400 transform hover:scale-110 transition-all duration-300">
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-blue-400 transform hover:scale-110 transition-all duration-300">
                                <Linkedin className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-blue-400 transform hover:scale-110 transition-all duration-300">
                                <Github className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 tracking-wide text-sm">Platform</h3>
                        <ul className="space-y-3">
                            {[
                                { name: 'Markets', href: '/markets' },
                                { name: 'Portfolio', href: '/portfolio' },
                                { name: 'Learn', href: '/learn' },
                                { name: 'Premium Options', href: '/upgrade' }
                            ].map((item, idx) => (
                                <li key={idx}>
                                    <Link 
                                        href={item.href}
                                        className="text-sm text-gray-400 hover:text-white hover:translate-x-1 inline-flex transition-all duration-300 group"
                                    >
                                        <ArrowRight className="h-4 w-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 mr-2 transition-all duration-300 text-blue-500" />
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 tracking-wide text-sm">Resources</h3>
                        <ul className="space-y-3">
                            {[
                                { name: 'Documentation', href: '/documentation' },
                                { name: 'API Reference', href: '/api-reference' },
                                { name: 'Market Status', href: '/market-status' },
                                { name: 'Help Center', href: '/help-center' }
                            ].map((item, idx) => (
                                <li key={idx}>
                                    <Link 
                                        href={item.href}
                                        className="text-sm text-gray-400 hover:text-white hover:translate-x-1 inline-flex transition-all duration-300 group"
                                    >
                                        <ArrowRight className="h-4 w-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 mr-2 transition-all duration-300 text-blue-500" />
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter / Interactive Widget */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 tracking-wide text-sm">Stay Updated</h3>
                        <p className="text-sm text-gray-400 mb-4">
                            Get weekly AI market insights compiled directly to your inbox.
                        </p>
                        <form onSubmit={handleSubscribe} className="flex flex-col space-y-2">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email" 
                                    className="block w-full pl-10 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2.5 rounded-lg shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 transition-all duration-300 ease-out active:scale-95"
                            >
                                Subscribe to Newsletter
                            </button>
                        </form>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-gray-500">
                        &copy; {new Date().getFullYear()} TradeMind AI. All rights reserved.
                    </p>
                    <div className="flex space-x-6 text-xs text-gray-500">
                        <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                        <Link href="/cookies" className="hover:text-white transition-colors">Cookie Settings</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
