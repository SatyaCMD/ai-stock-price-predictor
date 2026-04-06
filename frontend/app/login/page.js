"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import SuccessModal from '../../components/SuccessModal';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        captcha: ''
    });
    const [captchaProblem, setCaptchaProblem] = useState({ num1: 0, num2: 0 });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
        router.push('/otp');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const sum = captchaProblem.num1 + captchaProblem.num2;

        if (parseInt(formData.captcha) !== sum) {
            setError('Incorrect captcha. Please try again.');
            generateCaptcha();
            setFormData(prev => ({ ...prev, captcha: '' }));
            return;
        }

        try {
            const response = await axios.post('http://127.0.0.1:8000/api/v1/auth/login', {
                email: formData.email,
                password: formData.password
            });

            // Store authoritative Session Token
            localStorage.setItem('token', response.data.access_token);
            
            // Map MongoDB user document state down to frontend store
            localStorage.setItem('userProfile', JSON.stringify({
                userId: response.data.user.id,
                name: response.data.user.name,
                email: response.data.user.email,
                joinDate: response.data.user.joinDate || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                role: 'user',
                isSubscribed: false,
                portfolio: response.data.user.portfolio
            }));

            // Force global listener sync
            window.dispatchEvent(new Event('authChange'));
            setShowSuccessModal(true);

        } catch (err) {
            setError(err.response?.data?.detail || 'Account not found or invalid credentials.');
            generateCaptcha();
        }
    };
    return (
        <div className="bg-gray-50 flex min-h-screen w-full">
            <SuccessModal
                isOpen={showSuccessModal}
                onClose={handleSuccessClose}
                title="Login Successful!"
                message="Please verify your identity with the OTP sent to your email."
                buttonText="Proceed to Verification"
                onButtonClick={handleSuccessClose}
            />

            {/* Left Side - Interactive Visual */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-12 flex-col justify-center relative overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                
                <div className="relative z-10 w-full max-w-lg mx-auto text-white">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur border border-white/20 rounded-2xl flex items-center justify-center mb-8 shadow-2xl">
                        <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <h1 className="text-5xl font-extrabold mb-6 leading-tight">Welcome to the<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Future of Trading</span></h1>
                    <p className="text-xl text-blue-100/80 mb-12 leading-relaxed">Join thousands of traders using advanced AI to predict market movements before they happen.</p>
                    
                    <div className="space-y-6">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 flex items-center space-x-4 border border-white/10 transform transition-all hover:scale-105 hover:bg-white/20 cursor-pointer">
                            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-bold">92%</div>
                            <div>
                                <h4 className="font-bold">LSTM Accuracy</h4>
                                <p className="text-sm text-blue-200">On US Market Predictions</p>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 flex items-center space-x-4 border border-white/10 transform transition-all hover:scale-105 hover:bg-white/20 cursor-pointer">
                            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-bold">24/7</div>
                            <div>
                                <h4 className="font-bold">Real-time Analysis</h4>
                                <p className="text-sm text-blue-200">Continuous Market Scanning</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative">
                <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-gray-100 relative z-10 animate-in fade-in duration-500 slide-in-from-bottom-5">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
                    <p className="text-gray-600">Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
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
                        Sign In
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link href="/signup" className="text-blue-600 hover:text-blue-800 font-medium hover:underline">
                        Sign up
                    </Link>
                </div>
            </div>
            </div>
        </div>
    );
}
