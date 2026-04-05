"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function OTPPage() {
    const router = useRouter();
    const [otp, setOtp] = useState('');
    const [debugOtp, setDebugOtp] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        generateOtp();
    }, []);

    const generateOtp = () => {
        // Generate a random 6-digit OTP
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        setDebugOtp(newOtp);
        console.log('Debug OTP:', newOtp);
    };

    const handleChange = (e) => {
        setOtp(e.target.value);
        setError('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (otp !== debugOtp) {
            setError('Incorrect OTP. Please try again.');
            return;
        }

        // Mock verification success
        console.log('OTP Verified');
        localStorage.setItem('isLoggedIn', 'true');
        
        const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        if (profile.role !== 'admin' && !profile.kycVerified) {
            window.location.href = '/kyc';
        } else {
            window.location.href = '/portfolio';
        }
    };

    const handleResend = () => {
        generateOtp();
        setOtp('');
        setError('');
        toast.success(`New OTP sent! (Debug: ${debugOtp})`);
    };

    return (
        <div className="bg-gray-50 flex flex-row">
            {/* Left Side - Interactive Visual */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-12 flex-col justify-center relative overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute bottom-[20%] right-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                
                <div className="relative z-10 w-full max-w-lg mx-auto text-white">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur border border-white/20 rounded-2xl flex items-center justify-center mb-8 shadow-2xl">
                        <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h1 className="text-5xl font-extrabold mb-6 leading-tight">Secure Your<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Account Access</span></h1>
                    <p className="text-xl text-blue-100/80 mb-12 leading-relaxed">Enterprise-grade security ensuring your portfolio and algorithmic predictions remain exclusively yours.</p>
                    
                    <div className="space-y-6">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 flex items-center space-x-4 border border-white/10 transform transition-all hover:scale-105 hover:bg-white/20 cursor-pointer">
                            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-bold">2FA</div>
                            <div>
                                <h4 className="font-bold">Two-Factor Auth</h4>
                                <p className="text-sm text-blue-200">Bank-level encryption standards.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative">
                <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-gray-100 relative z-10 animate-in fade-in duration-500 slide-in-from-bottom-5">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Verification</h1>
                        <p className="text-gray-600">Enter the OTP sent to your email</p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5 mb-8 text-center shadow-sm">
                        <p className="text-sm text-yellow-800 font-medium">Debug Mode</p>
                        <p className="text-xs text-yellow-600 mt-1">Use this OTP to login:</p>
                        <p className="text-3xl font-mono font-extrabold text-yellow-900 mt-2 tracking-widest">{debugOtp}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">One-Time Password</label>
                            <input
                                type="text"
                                name="otp"
                                required
                                maxLength="6"
                                className="w-full px-4 py-4 text-center text-3xl tracking-[0.4em] rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 font-mono text-gray-800"
                                placeholder={"••••••"}
                                value={otp}
                                onChange={handleChange}
                            />
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-xl border border-red-100 font-medium">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                            Verify & Proceed
                        </button>
                    </form>

                    <div className="mt-8 text-center border-t border-gray-100 pt-6">
                        <p className="text-gray-600 text-sm mb-2">Didn't receive the code?</p>
                        <button
                            onClick={handleResend}
                            className="text-sm text-blue-600 hover:text-blue-800 font-bold hover:underline transition-colors focus:outline-none"
                        >
                            Resend OTP
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
