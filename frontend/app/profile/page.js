"use client";
import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { formatCurrency } from '../../utils/currency';
import { Download, User, Mail, Calendar, TrendingUp, TrendingDown, Clock, ArrowUpRight, ArrowDownRight, LogOut, Settings, Shield, ShieldCheck } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MARKETS, STOCK_NAMES } from '../../utils/constants';
import SettingsModal from '../../components/SettingsModal';
import { getLogoDataUrl, addInteractiveLogoToPage } from '../../utils/pdfHelper';
import { toast } from 'react-hot-toast';

export default function Profile() {
    const [transactions, setTransactions] = useState([]);
    const [user, setUser] = useState({
        userId: 'USR-XXXXXX-XXXX',
        name: 'User',
        email: 'user@example.com',
        joinDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    });
    const [downloadRange, setDownloadRange] = useState('all');
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        // Backfill transactions if empty but portfolio exists
        const savedTransactions = localStorage.getItem('userTransactions');
        let currentTransactions = [];
        if (savedTransactions) {
            currentTransactions = JSON.parse(savedTransactions);
            // Fix missing names in existing transactions
            currentTransactions = currentTransactions.map(t => ({
                ...t,
                name: t.name || STOCK_NAMES[t.ticker] || t.ticker
            }));
            setTransactions(currentTransactions);
        }

        const savedPortfolio = localStorage.getItem('userPortfolio');
        if (savedPortfolio && currentTransactions.length === 0) {
            const portfolio = JSON.parse(savedPortfolio);
            if (portfolio.length > 0) {
                console.log("Backfilling transaction history in Profile...");
                const initialTransactions = portfolio.map((stock, index) => ({
                    id: Date.now() + index,
                    orderId: stock.orderId || `ORD-INIT-${index}`,
                    date: stock.dateAdded || new Date().toISOString(),
                    type: 'BUY',
                    market: MARKETS.find(m => m.id === stock.market)?.name || stock.market,
                    ticker: stock.ticker,
                    name: stock.name || STOCK_NAMES[stock.ticker] || stock.ticker,
                    price: stock.buyPrice,
                    quantity: stock.quantity,
                    total: stock.buyPrice * stock.quantity,
                    currency: stock.currency
                }));
                localStorage.setItem('userTransactions', JSON.stringify(initialTransactions));
                setTransactions(initialTransactions);
            }
        }

        const savedProfile = localStorage.getItem('userProfile');
        if (savedProfile) {
            const profile = JSON.parse(savedProfile);
            setUser(prev => ({
                ...prev,
                ...profile,
                userId: profile.userId || prev.userId,
                name: profile.name || 'User',
                email: profile.email || 'user@example.com',
                joinDate: profile.joinDate || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                kycVerified: profile.kycVerified || false,
                kycDetails: profile.kycDetails || null
            }));
            
            // Try to find the exact join date from the registeredUsers list
            const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            const userIndex = registeredUsers.findIndex(u => u.email === profile.email);
            if (userIndex !== -1) {
                const userAccount = registeredUsers[userIndex];
                let changed = false;
                const updateProps = {};

                if (userAccount.createdAt) {
                    const dateObj = new Date(userAccount.createdAt);
                    updateProps.joinDate = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                    changed = true;
                }
                
                // Backwards compatibility: give older users an ID if they don't have one
                if (!userAccount.userId) {
                    const newId = 'USR-' + Math.floor(100000 + Math.random() * 900000) + '-' + Math.floor(1000 + Math.random() * 9000);
                    registeredUsers[userIndex].userId = newId;
                    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
                    updateProps.userId = newId;
                    changed = true;
                } else if (!profile.userId) {
                    updateProps.userId = userAccount.userId;
                    changed = true;
                }

                if (changed) {
                    setUser(prev => ({ ...prev, ...updateProps }));
                    localStorage.setItem('userProfile', JSON.stringify({ ...profile, ...updateProps }));
                }
            }
        }
    }, []);

    const handleDeleteAccount = () => {
        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex flex-col ring-1 ring-black ring-opacity-5 overflow-hidden border border-red-100 transform transition-all`}>
                <div className="p-5">
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="bg-red-100 p-2 rounded-full">
                            <LogOut className="w-5 h-5 text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Delete Account?</h3>
                    </div>
                    <p className="text-sm text-gray-600">Are you sure you want to delete your account and clear all mock history? This action cannot be undone.</p>
                </div>
                <div className="bg-gray-50 px-5 py-3 flex space-x-3 justify-end border-t border-gray-100">
                    <button onClick={() => toast.dismiss(t.id)} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                    <button onClick={() => { 
                        toast.dismiss(t.id); 
                        localStorage.clear(); 
                        window.location.href = '/'; 
                    }} className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm shadow-red-600/20">Delete Forever</button>
                </div>
            </div>
        ), { duration: Infinity, position: 'top-center' });
    };

    const handleUpdateProfile = (updatedData) => {
        const newProfile = { ...user, ...updatedData };
        setUser(newProfile);

        // Update localStorage
        const savedProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        localStorage.setItem('userProfile', JSON.stringify({ ...savedProfile, ...updatedData }));

        // Also update registeredUsers if applicable (mock DB)
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        // Use savedProfile.email if the user changed it during this session
        const matchingEmail = savedProfile.email || user.email;
        const userIndex = registeredUsers.findIndex(u => u.email === matchingEmail);
        if (userIndex !== -1) {
            registeredUsers[userIndex] = { ...registeredUsers[userIndex], ...updatedData };
            localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
        }

        // Dispatch authChange to update Navbar immediately
        window.dispatchEvent(new Event('authChange'));
    };

    const downloadHistoryPDF = async () => {
        const doc = new jsPDF();
        
        // Add interactive logo
        const pageWidth = doc.internal.pageSize.getWidth();
        const logoDataUrl = await getLogoDataUrl();
        addInteractiveLogoToPage(doc, pageWidth, logoDataUrl);

        // Filter transactions based on range
        const now = new Date();
        const filteredTransactions = transactions.filter(t => {
            if (downloadRange === 'all') return true;
            const txDate = new Date(t.date);
            const diffTime = Math.abs(now - txDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (downloadRange === '7d') return diffDays <= 7;
            if (downloadRange === '30d') return diffDays <= 30;
            if (downloadRange === '3m') return diffDays <= 90;
            if (downloadRange === '1y') return diffDays <= 365;
            return true;
        });

        // Title
        doc.setFontSize(22);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(30, 58, 138); // Text-blue-900
        doc.text("Transaction History Report", 14, 32);

        // Divider Line
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(14, 38, pageWidth - 14, 38);

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100);
        doc.text(`Investor: ${user.name} (ID: ${user.userId || 'N/A'})`, 14, 46);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 51);

        // Summary Box
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(14, 56, pageWidth - 28, 18, 3, 3, 'FD');

        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`Email: ${user.email}   |   Time Range: ${downloadRange === 'all' ? 'All Time' : `Last ${downloadRange.replace('d', ' Days').replace('m', ' Months').replace('y', ' Year')}`}`, 20, 67);

        // Table
        const tableData = filteredTransactions.map(t => [
            new Date(t.date).toLocaleString(),
            t.type.replace(/_/g, ' '),
            t.market,
            t.name || STOCK_NAMES[t.ticker] || t.ticker, // Use name if available
            formatCurrency(t.price, t.currency),
            t.quantity.toString(),
            formatCurrency(t.total, t.currency)
        ]);

        autoTable(doc, {
            startY: 82,
            head: [['Date/Time', 'Type', 'Market', 'Asset', 'Price', 'Qty', 'Total Value']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
            bodyStyles: { textColor: 50 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            styles: { fontSize: 8, cellPadding: 5 },
        });

        doc.save(`Transaction_History_${downloadRange}.pdf`);
    };

    const downloadKYC = async () => {
        const doc = new jsPDF();
        
        // Add interactive logo
        const pageWidth = doc.internal.pageSize.getWidth();
        const logoDataUrl = await getLogoDataUrl();
        addInteractiveLogoToPage(doc, pageWidth, logoDataUrl);
        
        // Title
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(30, 58, 138); // Text-blue-900
        doc.text("KYC Verification Certificate", 14, 32);

        // Divider Line
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(14, 38, pageWidth - 14, 38);

        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text("Personal Profile Details", 14, 50);

        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(80);
        doc.text(`Full Legal Name: ${user.kycDetails?.fullName || user.name}`, 14, 60);
        doc.text(`Date of Birth: ${user.kycDetails?.dob || 'N/A'}`, 14, 68);
        doc.text(`Mobile Number: ${user.kycDetails?.mobile || 'N/A'}`, 14, 76);
        doc.text(`Email Address: ${user.email}`, 14, 84);
        doc.text(`Govt ID Number: ${user.kycDetails?.idNumber || 'N/A'}`, 14, 92);
        
        doc.text(`Residential Address:`, 14, 106);
        doc.setFontSize(10);
        const splitAddress = doc.splitTextToSize(user.kycDetails?.address || 'N/A', 180);
        doc.text(splitAddress, 14, 112);
        
        // Verification Box
        doc.setFillColor(240, 253, 244); // green-50
        doc.setDrawColor(187, 247, 208); // green-200
        doc.roundedRect(14, 130, pageWidth - 28, 24, 3, 3, 'FD');
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(22, 163, 74); // text-green-600
        doc.text(`Status: FULLY KYC VERIFIED`, 20, 140);
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100);
        if(user.kycDetails?.verifiedDate) {
            doc.text(`Verification Date: ${new Date(user.kycDetails?.verifiedDate).toLocaleString()}`, 20, 148);
        }

        doc.save(`KYC_Document_${user.name.replace(/\\s+/g, '_')}.pdf`);
    };

    const getTypeStyle = (type) => {
        if (type === 'BUY') return 'bg-blue-100 text-blue-700';
        if (type === 'SELL') return 'bg-green-100 text-green-700';
        if (type.includes('AUTO')) return 'bg-orange-100 text-orange-700';
        return 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-20">
            <Navbar />
            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                user={user}
                onUpdateProfile={handleUpdateProfile}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">My Profile</h1>
                        <p className="text-gray-500 mt-1">Manage your account and view trading history.</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center space-x-4">
                        <select
                            value={downloadRange}
                            onChange={(e) => setDownloadRange(e.target.value)}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Time</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="3m">Last 3 Months</option>
                            <option value="1y">Last 1 Year</option>
                        </select>
                        <button
                            onClick={downloadHistoryPDF}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                        >
                            <Download className="w-4 h-4" />
                            <span>Download History</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* User Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/50 sticky top-24">
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4">
                                    <User className="w-10 h-10" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 flex items-center justify-center">
                                    {user.name}
                                    {user.role === 'admin' ? (
                                        <ShieldCheck className="w-5 h-5 text-purple-500 ml-2 shadow-sm rounded-full bg-purple-50" title="Admin Auth" />
                                    ) : user.kycVerified && (
                                        <ShieldCheck className="w-5 h-5 text-green-500 ml-2 shadow-sm rounded-full bg-green-50" title="KYC Verified" />
                                    )}
                                </h2>
                                <p className="text-gray-500 text-sm">{user.email}</p>
                                
                                {user.kycVerified && user.role !== 'admin' && (
                                    <button onClick={downloadKYC} className="mt-3 text-xs text-blue-600 font-bold hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors flex items-center">
                                        <Download className="w-3 h-3 mr-1.5" /> Download KYC Details
                                    </button>
                                )}
                                
                                <div className="mt-3 inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-xs font-mono font-medium rounded-full border border-gray-200">
                                    ID: <span className="ml-1 tracking-wider select-all">{user.userId}</span>
                                </div>

                                <button
                                    onClick={() => setShowSettings(true)}
                                    className="mt-4 flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
                                >
                                    <Settings className="w-4 h-4 mr-2" />
                                    Settings
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                                    <Mail className="w-5 h-5 text-gray-400 mr-3" />
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wider">Email</p>
                                        <p className="text-sm font-medium text-gray-900">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                                    <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wider">Joined</p>
                                        <p className="text-sm font-medium text-gray-900">{user.joinDate}</p>
                                    </div>
                                </div>
                                <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                                    <TrendingUp className="w-5 h-5 text-gray-400 mr-3" />
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wider">Total Trades</p>
                                        <p className="text-sm font-medium text-gray-900">{transactions.length}</p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <button
                                        onClick={handleDeleteAccount}
                                        className="w-full flex items-center justify-center p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium"
                                    >
                                        <LogOut className="w-4 h-4 mr-2" />
                                        Delete Account
                                    </button>
                                </div>
                            </div>

                            {/* Subscription Details */}
                            <div className="mt-8 border-t border-gray-100 pt-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                    <Shield className="w-5 h-5 text-purple-600 mr-2" />
                                    Subscription details
                                </h3>
                                
                                {user.isSubscribed ? (
                                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-100">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-sm font-semibold text-purple-900 border-b border-purple-200 pb-0.5">Premium Plan <span className="text-xs uppercase ml-1 px-1.5 py-0.5 rounded-md bg-purple-100/50 text-purple-600">{user.subscriptionPlan || 'Monthly'}</span></span>
                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Active</span>
                                        </div>
                                        <div className="space-y-2 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Subscribed on:</span>
                                                <span className="font-medium text-gray-900">{user.subscriptionStartDate ? new Date(user.subscriptionStartDate).toLocaleDateString() : new Date().toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Next billing cycle:</span>
                                                <span className="font-medium text-gray-900">{user.subscriptionNextDate ? new Date(user.subscriptionNextDate).toLocaleDateString() : 'Active'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                                        <div className="text-gray-500 font-medium mb-3">
                                            {user.paymentPending ? 'Payment Pending Review' : 'Free Basic Plan'}
                                        </div>
                                        {!user.paymentPending && (
                                            <a href="/upgrade" className="block w-full py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-colors">
                                                Upgrade to Premium
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Transaction History */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/50 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                    <Clock className="w-5 h-5 mr-2 text-blue-600" />
                                    Transaction History
                                </h3>
                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    {transactions.length} Records
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50/50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Market</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Asset</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {transactions.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                                    No transactions yet. Start trading to see your history!
                                                </td>
                                            </tr>
                                        ) : (
                                            transactions.map((t) => (
                                                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-900 font-medium">
                                                            {new Date(t.date).toLocaleDateString()}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            {new Date(t.date).toLocaleTimeString()}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getTypeStyle(t.type)}`}>
                                                            {t.type.replace(/_/g, ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-gray-600">{t.market}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-gray-900">{t.name || STOCK_NAMES[t.ticker] || t.ticker}</span>
                                                            {(t.name !== t.ticker || STOCK_NAMES[t.ticker]) && (
                                                                <span className="text-xs text-gray-400">{t.ticker}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="text-sm text-gray-900">
                                                            {formatCurrency(t.price, t.currency)}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            Qty: {t.quantity}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-sm font-bold text-gray-900">
                                                            {formatCurrency(t.total, t.currency)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
