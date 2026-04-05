"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, CheckCircle, XCircle, Search, Clock } from 'lucide-react';

export default function AdminDashboard() {
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        if (profile.role !== 'admin') {
            router.push('/');
        } else {
            setIsAdmin(true);
            const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            setUsers(registeredUsers);
        }
    }, [router]);

    const handleToggleSubscription = (email) => {
        const updatedUsers = users.map(user => {
            if (user.email === email) {
                const isSubbing = !user.isSubscribed;
                
                let durationDays = 30;
                if (user.paymentPendingType === 'yearly') durationDays = 365;
                if (user.paymentPendingType === 'quarterly') durationDays = 90;

                const newDates = isSubbing ? {
                    subscriptionStartDate: new Date().toISOString(),
                    subscriptionNextDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
                    subscriptionPlan: user.paymentPendingType || 'monthly'
                } : {};
                return { ...user, isSubscribed: isSubbing, paymentPending: false, ...newDates };
            }
            return user;
        });
        setUsers(updatedUsers);
        localStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));
        
        // Also update the current session if the admin toggles themselves
        const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        if (profile.email === email) {
            const isSubbing = !profile.isSubscribed;
            profile.isSubscribed = isSubbing;
            profile.paymentPending = false;
            
            // if granting access
            if (isSubbing) {
                let durationDays = 30;
                if (profile.paymentPendingType === 'yearly') durationDays = 365;
                if (profile.paymentPendingType === 'quarterly') durationDays = 90;

                profile.subscriptionStartDate = new Date().toISOString();
                profile.subscriptionNextDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
                profile.subscriptionPlan = profile.paymentPendingType || 'monthly';
            }

            localStorage.setItem('userProfile', JSON.stringify(profile));
            window.dispatchEvent(new Event('authChange'));
        }
    };

    const handleKYCAction = (email, action) => {
        const currentUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const userIndex = currentUsers.findIndex(u => u.email === email);
        if (userIndex !== -1) {
            if (action === 'approve') {
                currentUsers[userIndex].kycStatus = 'verified';
                currentUsers[userIndex].kycVerified = true;
                if (currentUsers[userIndex].kycDetails) {
                    currentUsers[userIndex].kycDetails.verifiedDate = new Date().toISOString();
                }
            } else if (action === 'suspend') {
                currentUsers[userIndex].kycStatus = 'suspended';
                currentUsers[userIndex].kycVerified = false;
            }
            
            localStorage.setItem('registeredUsers', JSON.stringify(currentUsers));
            setUsers(currentUsers);
            
            // Update local session if it's the active user
            const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            if (profile.email === email) {
                profile.kycStatus = currentUsers[userIndex].kycStatus;
                profile.kycVerified = currentUsers[userIndex].kycVerified;
                if (profile.kycDetails && action === 'approve') {
                    profile.kycDetails.verifiedDate = currentUsers[userIndex].kycDetails.verifiedDate;
                }
                localStorage.setItem('userProfile', JSON.stringify(profile));
                window.dispatchEvent(new Event('authChange'));
            }
        }
    };

    const isTrialActive = (trialStart) => {
        if (!trialStart) return false;
        const start = new Date(trialStart);
        const now = new Date();
        const diffHours = (now - start) / (1000 * 60 * 60);
        return diffHours < 24;
    };

    const filteredUsers = users.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isAdmin) return null;

    return (
        <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900">
                        <Shield className="h-8 w-8 text-blue-600" />
                        Admin Dashboard
                    </h1>
                    <p className="text-gray-600 mt-2">Manage user subscriptions and access control</p>
                </div>
                <div className="mt-4 md:mt-0 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search users..." 
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl w-full md:w-64 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="p-4 font-semibold text-gray-600">User</th>
                                <th className="p-4 font-semibold text-gray-600">Role</th>
                                <th className="p-4 font-semibold text-gray-600">KYC Status</th>
                                <th className="p-4 font-semibold text-gray-600">Trial Status</th>
                                <th className="p-4 font-semibold text-gray-600">Subscription</th>
                                <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user, idx) => {
                                const trialActive = isTrialActive(user.trialStart);
                                return (
                                    <tr key={idx} className={`border-b ${user.paymentPending ? 'bg-amber-50/30' : 'border-gray-50 hover:bg-gray-50/50'} transition-colors`}>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{user.name}</p>
                                                    <p className="text-sm text-gray-500">{user.email}</p>
                                                </div>
                                                {user.paymentPending && (
                                                    <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-200 animate-pulse flex items-center whitespace-nowrap">
                                                        <Clock className="w-3 h-3 mr-1" /> Payment Pending
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {user.role || 'user'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {user.kycStatus === 'pending' ? (
                                                 <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full animate-pulse border border-amber-200">Pending Review</span>
                                            ) : user.kycStatus === 'verified' || user.kycVerified ? (
                                                 <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">Verified</span>
                                            ) : user.kycStatus === 'suspended' ? (
                                                 <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-200">Suspended</span>
                                            ) : (
                                                 <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">Unverified</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {trialActive ? (
                                                <span className="flex items-center text-sm font-medium text-amber-600">
                                                    <Clock className="w-4 h-4 mr-1" /> Active (24h)
                                                </span>
                                            ) : (
                                                <span className="text-sm text-gray-400">Expired</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {user.isSubscribed ? (
                                                <span className="flex items-center text-sm font-medium text-green-600">
                                                    <CheckCircle className="w-4 h-4 mr-1" /> Paid Access
                                                </span>
                                            ) : (
                                                <span className="flex items-center text-sm font-medium text-red-500">
                                                    <XCircle className="w-4 h-4 mr-1" /> Unpaid
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 items-center">
                                                {user.kycStatus === 'pending' && (
                                                    <div className="flex gap-2 mr-4 border-r pr-4 border-gray-200">
                                                        <button 
                                                            onClick={() => handleKYCAction(user.email, 'approve')}
                                                            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow transition-colors"
                                                        >
                                                            Approve KYC
                                                        </button>
                                                        <button 
                                                            onClick={() => handleKYCAction(user.email, 'suspend')}
                                                            className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition-colors border border-red-200"
                                                        >
                                                            Suspend
                                                        </button>
                                                    </div>
                                                )}
                                                <button 
                                                    onClick={() => handleToggleSubscription(user.email)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${user.isSubscribed ? 'bg-red-50 text-red-600 hover:bg-red-100' : (user.paymentPending ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 hover:bg-amber-600 hover:-translate-y-0.5' : 'bg-blue-600 text-white hover:bg-blue-700')}`}
                                                >
                                                    {user.isSubscribed ? 'Revoke Access' : (user.paymentPending ? 'Approve Payment' : 'Grant Access')}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
