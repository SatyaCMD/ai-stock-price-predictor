"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import SuccessModal from '../../components/SuccessModal';

export default function SignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        captcha: ''
    });
    const [captchaProblem, setCaptchaProblem] = useState({ num1: 0, num2: 0 });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        generateCaptcha();
    }, []);

    const generateCaptcha = () => {
        const num1 = Math.floor(Math.random() * 10);
        const num2 = Math.floor(Math.random() * 10);
        setCaptchaProblem({ num1, num2 });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        router.push('/login');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const sum = captchaProblem.num1 + captchaProblem.num2;

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (parseInt(formData.captcha) !== sum) {
            setError('Incorrect captcha. Please try again.');
            generateCaptcha();
            setFormData(prev => ({ ...prev, captcha: '' }));
            return;
        }

        // Mock signup success
        console.log('Signup successful', formData);

        // Create new user object
        const newUser = {
            userId: 'USR-' + Math.floor(100000 + Math.random() * 900000) + '-' + Math.floor(1000 + Math.random() * 9000),
            name: formData.name,
            email: formData.email,
            password: formData.password, // In a real app, never store plain text passwords!
            joinDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), // e.g., "Jan 2024"
            createdAt: new Date().toISOString(),
            role: formData.email.toLowerCase() === 'admin@trademind.com' ? 'admin' : 'user',
            trialStart: new Date().toISOString(),
            isSubscribed: false
        };

        // Save to "Database" (registeredUsers)
        const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        localStorage.setItem('registeredUsers', JSON.stringify([...existingUsers, newUser]));

        // Store user info for Navbar (auto-login)
        localStorage.setItem('userProfile', JSON.stringify({
            userId: newUser.userId,
            name: newUser.name,
            email: newUser.email,
            joinDate: newUser.joinDate,
            role: newUser.role,
            trialStart: newUser.trialStart,
            isSubscribed: newUser.isSubscribed
        }));

        // Notify other components
        window.dispatchEvent(new Event('authChange'));

        setShowSuccessModal(true);
    };
    return (
        <div className="bg-gray-50 flex flex-row-reverse">
            <SuccessModal
                isOpen={showSuccessModal}
                onClose={handleSuccessClose}
                title="Account Created!"
                message="Your account has been successfully created. Please log in to continue."
                buttonText="Go to Login"
                onButtonClick={handleSuccessClose}
            />

            {/* Right Side - Interactive Visual */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-12 flex-col justify-center relative overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute bottom-[20%] right-[-10%] w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                
                <div className="relative z-10 w-full max-w-lg mx-auto text-white">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur border border-white/20 rounded-2xl flex items-center justify-center mb-8 shadow-2xl">
                        <svg className="w-8 h-8 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                    </div>
                    <h1 className="text-5xl font-extrabold mb-6 leading-tight">Master the<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">Financial Markets</span></h1>
                    <p className="text-xl text-purple-100/80 mb-12 leading-relaxed">Start your 1-day free trial today. Get unlimited access to advanced forecasting models and intelligent portfolio analysis.</p>
                    
                    <div className="space-y-6">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 flex items-center space-x-4 border border-white/10 transform transition-all hover:scale-105 hover:bg-white/20 cursor-pointer">
                            <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 font-bold">1 Day</div>
                            <div>
                                <h4 className="font-bold">Free Premium Trial</h4>
                                <p className="text-sm text-purple-200">Full access, no credit card required.</p>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 flex items-center space-x-4 border border-white/10 transform transition-all hover:scale-105 hover:bg-white/20 cursor-pointer">
                            <div className="w-12 h-12 bg-pink-500/20 rounded-full flex items-center justify-center text-pink-400 font-bold">PDF</div>
                            <div>
                                <h4 className="font-bold">Automated Reports</h4>
                                <p className="text-sm text-purple-200">Generate professional stock analysis instantly.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Left Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative">
                <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-gray-100 relative z-10 animate-in fade-in duration-500 slide-in-from-bottom-5">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
                    <p className="text-gray-600">Join us to start your journey</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            required
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white/50 backdrop-blur-sm"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            required
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white/50 backdrop-blur-sm"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                required
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white/50 backdrop-blur-sm pr-10"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                required
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white/50 backdrop-blur-sm pr-10"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            >
                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white/30 p-4 rounded-lg border border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Security Check: What is {captchaProblem.num1} + {captchaProblem.num2}?
                        </label>
                        <input
                            type="number"
                            name="captcha"
                            required
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white/50"
                            placeholder="Enter the sum"
                            value={formData.captcha}
                            onChange={handleChange}
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        Sign Up
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium hover:underline">
                        Sign in
                    </Link>
                </div>
            </div>
            </div>
        </div>
    );
}
