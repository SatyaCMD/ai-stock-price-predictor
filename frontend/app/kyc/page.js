"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, CheckSquare, Fingerprint, Clock, AlertTriangle } from 'lucide-react';
import Navbar from '../../components/Navbar';

export default function KYCPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: '',
        dob: '',
        countryCode: '+1',
        mobile: '',
        docType: 'SSN',
        idNumber: '',
        address: ''
    });
    const [agreements, setAgreements] = useState({ terms: false, data: false, risk: false });
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedProfile = localStorage.getItem('userProfile');
        if (!storedProfile) {
            router.push('/login');
        } else {
            setUser(JSON.parse(storedProfile));
        }
    }, [router]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleCheckbox = (e) => setAgreements({ ...agreements, [e.target.name]: e.target.checked });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const userIndex = registeredUsers.findIndex(u => u.email === user.email);
        
        const kycData = { ...formData };
        const updatedProfile = { 
            ...user, 
            kycStatus: 'pending', 
            kycSubmittedAt: Date.now(),
            kycDetails: kycData 
        };

        localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
        
        if (userIndex !== -1) {
            registeredUsers[userIndex].kycStatus = 'pending';
            registeredUsers[userIndex].kycSubmittedAt = updatedProfile.kycSubmittedAt;
            registeredUsers[userIndex].kycDetails = kycData;
            localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
        }

        window.dispatchEvent(new Event('authChange'));
        setUser(updatedProfile);
    };

    if (!user) return null;

    if (user.kycStatus === 'pending') {
        return (
            <div className="bg-gray-50 flex flex-col pb-20">
                <Navbar />
                <div className="flex-1 w-full max-w-md mx-auto px-4 pt-48 text-center animate-in fade-in zoom-in duration-500">
                    <div className="bg-amber-100/50 p-6 rounded-full inline-flex mb-6">
                        <Clock className="w-16 h-16 text-amber-600 animate-pulse" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Under Review</h1>
                    <p className="text-gray-600 mb-8">
                        Your submitted KYC documents are currently being securely reviewed by our compliance administrators. You will automatically receive access within 10 minutes if not handled manually.
                    </p>
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-left">
                        <h3 className="font-semibold text-gray-800 mb-2">Submission Details:</h3>
                        <p className="text-sm text-gray-500"><strong>Name:</strong> {user.kycDetails?.fullName}</p>
                        <p className="text-sm text-gray-500"><strong>Document:</strong> {user.kycDetails?.docType} ending in {user.kycDetails?.idNumber?.slice(-4) || 'XXXX'}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (user.kycStatus === 'suspended') {
        return (
            <div className="bg-red-50 flex flex-col pb-20">
                <Navbar />
                <div className="flex-1 w-full max-w-md mx-auto px-4 pt-48 text-center animate-in fade-in zoom-in">
                    <div className="bg-red-100 p-6 rounded-full inline-flex mb-6">
                        <AlertTriangle className="w-16 h-16 text-red-600" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-red-900 mb-4">Account Suspended</h1>
                    <p className="text-red-700">
                        Your KYC documents have been rejected due to invalid or suspicious details. Your account has been permanently suspended.
                    </p>
                </div>
            </div>
        );
    }

    if (user.kycVerified) {
        return (
            <div className="bg-gray-50 flex flex-col pb-20">
                <Navbar />
                <div className="flex-1 w-full max-w-md mx-auto px-4 pt-48 text-center">
                    <ShieldCheck className="w-20 h-20 text-green-500 mx-auto mb-4" />
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Already Verified!</h1>
                    <button onClick={() => router.push('/portfolio')} className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">Go to Dashboard</button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 flex flex-col pb-20">
            <Navbar />
            <div className="flex-1 w-full max-w-3xl mx-auto px-4 pt-32">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-bottom-5">
                    <div className="bg-blue-600 p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-20"><Fingerprint className="w-48 h-48 transform rotate-12" /></div>
                        <div className="relative z-10 flex items-center space-x-4">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm"><Fingerprint className="w-8 h-8 text-white" /></div>
                            <div>
                                <h1 className="text-3xl font-bold">Mandatory KYC Verification</h1>
                                <p className="text-blue-100 mt-1">Please verify your identity to access live trading features.</p>
                            </div>
                        </div>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-8">
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Legal Name</label>
                                    <input required type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 font-medium text-gray-800" placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                    <input required type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 font-medium text-gray-800" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                                    <div className="flex">
                                        <select name="countryCode" value={formData.countryCode} onChange={handleChange} className="px-3 py-3 rounded-l-xl border border-r-0 border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-100 font-medium text-gray-800 border-r border-gray-200">
                                            <option value="+1">+1 (US/CA)</option>
                                            <option value="+44">+44 (UK)</option>
                                            <option value="+91">+91 (IN)</option>
                                            <option value="+61">+61 (AU)</option>
                                            <option value="+86">+86 (CN)</option>
                                        </select>
                                        <input required type="tel" name="mobile" value={formData.mobile} onChange={handleChange} className="w-full px-4 py-3 rounded-r-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 font-medium text-gray-800" placeholder="(555) 000-0000" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Government ID Details</label>
                                    <div className="flex">
                                        <select name="docType" value={formData.docType} onChange={handleChange} className="px-3 py-3 rounded-l-xl border border-r-0 border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-100 font-medium text-gray-800 border-r border-gray-200">
                                            <option value="SSN">SSN</option>
                                            <option value="PAN">PAN</option>
                                            <option value="Passport">Passport</option>
                                            <option value="Driving License">DL</option>
                                        </select>
                                        <input required type="text" name="idNumber" value={formData.idNumber} onChange={handleChange} className="w-full px-4 py-3 rounded-r-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 font-mono text-gray-800 tracking-wider" placeholder="ABCDE1234F" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Residential Address</label>
                                <textarea required name="address" value={formData.address} onChange={handleChange} rows="3" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 font-medium text-gray-800" placeholder="123 Main St..."></textarea>
                            </div>
                        </div>

                        <div className="mt-10 border-t border-gray-100 pt-8 space-y-4">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center"><CheckSquare className="w-5 h-5 mr-2 text-blue-600" /> Declarations from the User</h3>
                            <label className="flex items-start cursor-pointer group">
                                <input required type="checkbox" name="terms" checked={agreements.terms} onChange={handleCheckbox} className="mt-1 mr-3 w-5 h-5 rounded" />
                                <span className="text-sm text-gray-600">I confirm that all details provided above match my official government identity documents.</span>
                            </label>
                            <label className="flex items-start cursor-pointer group">
                                <input required type="checkbox" name="data" checked={agreements.data} onChange={handleCheckbox} className="mt-1 mr-3 w-5 h-5 rounded" />
                                <span className="text-sm text-gray-600">I agree to authorize TradeMind to verify my documents for fraud prevention.</span>
                            </label>
                            <label className="flex items-start cursor-pointer group">
                                <input required type="checkbox" name="risk" checked={agreements.risk} onChange={handleCheckbox} className="mt-1 mr-3 w-5 h-5 rounded" />
                                <span className="text-sm text-gray-600">I accept the Market Risk Disclosure.</span>
                            </label>
                        </div>

                        <div className="mt-10">
                            <button type="submit" disabled={!agreements.terms || !agreements.data || !agreements.risk} className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all flex justify-center items-center">
                                Submit KYC Documents <ShieldCheck className="w-5 h-5 ml-2" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
