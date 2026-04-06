"use client";
import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { Check, X, CreditCard, ShieldCheck, Lock, ChevronRight, Loader2, Sparkles, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UpgradePage() {
    const [step, setStep] = useState(1); // 1 = Features, 2 = Checkout, 3 = Success
    const [loading, setLoading] = useState(false);
    const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly', 'quarterly', 'yearly'
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvc: '', name: '' });
    const [user, setUser] = useState(null);

    const getPrice = () => {
        if (billingCycle === 'yearly') return '299.99';
        if (billingCycle === 'quarterly') return '79.99';
        return '29.99';
    };

    useEffect(() => {
        const storedProfile = localStorage.getItem('userProfile');
        if (storedProfile) {
            setUser(JSON.parse(storedProfile));
        }
    }, []);

    const handleCheckout = (e) => {
        e.preventDefault();
        setLoading(true);

        // Simulate network payment delay
        setTimeout(() => {
            if (!user) return; // Unauthenticated

            // Mark user profile as paymentPending
            const updatedUser = { 
                ...user, 
                paymentPending: true, 
                paymentPendingType: billingCycle,
                paymentTimestamp: Date.now()
            };
            localStorage.setItem('userProfile', JSON.stringify(updatedUser));

            const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            const userIndex = registeredUsers.findIndex(u => u.email === user.email);
            if (userIndex !== -1) {
                registeredUsers[userIndex].paymentPending = true;
                registeredUsers[userIndex].paymentPendingType = billingCycle;
                registeredUsers[userIndex].paymentTimestamp = updatedUser.paymentTimestamp;
            } else {
                // Ghost user fallback: add them directly
                registeredUsers.push(updatedUser);
            }
            localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

            // Trigger global auth change event
            window.dispatchEvent(new Event('authChange'));

            setStep(3);
            setLoading(false);
        }, 2000);
    };

    return (
        <div className="bg-gray-50 flex flex-col items-center pb-20">
            <Navbar />
            
            <div className="w-full max-w-5xl mx-auto px-4 pt-32">
                
                {/* Step 1: Feature Showcase */}
                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center justify-center p-3 bg-purple-100 rounded-full mb-6">
                                <Sparkles className="w-8 h-8 text-purple-600" />
                            </div>
                            <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
                                Upgrade to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">TradeMind Premium</span>
                            </h1>
                            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                                Unlock the full power of our AI prediction models, unlimited PDF reports, and real-time alerts. Let the algorithm do the heavy lifting.
                            </p>
                        </div>

                        {/* Billing Toggle */}
                        <div className="flex justify-center mb-12 animate-in fade-in duration-700 delay-100">
                            <div className="bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm inline-flex">
                                <button onClick={() => setBillingCycle('monthly')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${billingCycle === 'monthly' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}>Monthly</button>
                                <button onClick={() => setBillingCycle('quarterly')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${billingCycle === 'quarterly' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}>Quarterly</button>
                                <button onClick={() => setBillingCycle('yearly')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${billingCycle === 'yearly' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}>Yearly <span className="ml-2 text-[10px] text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-full uppercase tracking-wider">Save 20%</span></button>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            {/* Free Tier */}
                            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm opacity-60">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Basic</h3>
                                <div className="text-4xl font-extrabold text-gray-900 mb-6">$0</div>
                                <ul className="space-y-4 mb-8">
                                    <li className="flex items-center"><Check className="w-5 h-5 text-green-500 mr-3" /> Basic Dashboard</li>
                                    <li className="flex items-center text-gray-400"><X className="w-5 h-5 mr-3" /> AI Price Predictions</li>
                                    <li className="flex items-center text-gray-400"><X className="w-5 h-5 mr-3" /> PDF Export Engine</li>
                                    <li className="flex items-center text-gray-400"><X className="w-5 h-5 mr-3" /> Learn Module Access</li>
                                </ul>
                                <button disabled className="w-full py-3 bg-gray-100 text-gray-400 font-bold rounded-xl">Current Plan</button>
                            </div>

                            {/* Pro Tier */}
                            <div className="bg-gradient-to-b from-purple-900 to-indigo-900 rounded-3xl p-8 border border-purple-500 shadow-2xl relative transform scale-105">
                                <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 font-bold text-xs px-3 py-1 rounded-bl-lg rounded-tr-3xl uppercase tracking-wider">Most Popular</div>
                                <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
                                <div className="text-4xl font-extrabold text-white mb-2">${getPrice()}<span className="text-lg text-purple-300 font-normal">/{billingCycle === 'yearly' ? 'yr' : (billingCycle === 'quarterly' ? 'qtr' : 'mo')}</span></div>
                                <p className="text-purple-200 text-sm mb-6">Billed {billingCycle}, cancel anytime.</p>
                                <ul className="space-y-4 mb-8 text-indigo-100">
                                    <li className="flex items-center"><Check className="w-5 h-5 text-yellow-400 mr-3" /> Unlimited AI Predictions (LSTM/Reg)</li>
                                    <li className="flex items-center"><Check className="w-5 h-5 text-yellow-400 mr-3" /> Branded PDF Report Generation</li>
                                    <li className="flex items-center"><Check className="w-5 h-5 text-yellow-400 mr-3" /> Market Fundamental Tutorials</li>
                                    <li className="flex items-center"><Check className="w-5 h-5 text-yellow-400 mr-3" /> Real-time Portfolio Tracking</li>
                                </ul>
                                <button 
                                    onClick={() => {
                                        if (user?.isSubscribed) {
                                            toast.custom(
                                                (t) => (
                                                    <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden border-l-8 border-green-500 transform transition-all`}>
                                                        <div className="flex-1 w-0 p-4">
                                                            <div className="flex items-center">
                                                                <div className="flex-shrink-0 bg-green-50 p-3 rounded-full">
                                                                    <CheckCircle className="h-8 w-8 text-green-500" />
                                                                </div>
                                                                <div className="ml-4 flex-1">
                                                                    <p className="text-lg font-extrabold text-gray-900">
                                                                        Already Subscribed!
                                                                    </p>
                                                                    <p className="mt-1 text-sm text-gray-600 font-medium leading-relaxed">
                                                                        You already have access to all Premium active features.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ),
                                                { duration: 5000, position: 'top-center' }
                                            );
                                            return;
                                        }
                                        setStep(2);
                                    }}
                                    className="w-full py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-yellow-900 font-extrabold text-lg rounded-xl flex items-center justify-center transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]">
                                    Proceed to Checkout <ChevronRight className="w-5 h-5 ml-2" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Checkout Form */}
                {step === 2 && (
                    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-right-8 duration-500 flex flex-col items-center">
                        <div className="w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row">
                            
                            {/* Left sidebar for payment methods */}
                            <div className="w-full md:w-1/3 bg-gray-50 border-r border-gray-100 p-6 md:p-8">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Payment Method</h3>
                                <div className="space-y-3">
                                    {['card', 'upi', 'netbanking', 'crypto'].map(method => (
                                        <button
                                            key={method}
                                            onClick={() => setPaymentMethod(method)}
                                            className={`w-full text-left px-5 py-4 rounded-xl font-medium transition-all ${paymentMethod === method ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md hover:scale-105' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'}`}
                                        >
                                            <div className="flex items-center">
                                                {method === 'card' && <CreditCard className="w-5 h-5 mr-3" />}
                                                {method === 'upi' && <span className="font-bold mr-3 border rounded px-1">UPI</span>}
                                                {method === 'netbanking' && <Lock className="w-5 h-5 mr-3" />}
                                                {method === 'crypto' && <span className="font-bold mr-3 border rounded-full px-1">₿</span>}
                                                
                                                {method === 'card' && 'Credit/Debit Card'}
                                                {method === 'upi' && 'UPI'}
                                                {method === 'netbanking' && 'Netbanking'}
                                                {method === 'crypto' && 'Crypto Wallet'}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Right side for payment details */}
                            <div className="w-full md:w-2/3">
                                <div className="bg-white border-b border-gray-100 p-6 md:p-8 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Secure Checkout</h2>
                                        <p className="text-purple-600 font-semibold text-sm">Premium Subscription - ${getPrice()}/{billingCycle === 'yearly' ? 'yr' : (billingCycle === 'quarterly' ? 'qtr' : 'mo')}</p>
                                    </div>
                                    <ShieldCheck className="w-10 h-10 text-green-500" />
                                </div>
                                
                                <form onSubmit={handleCheckout} className="p-6 md:p-8 space-y-6">
                                    
                                    {paymentMethod === 'card' && (
                                        <div className="space-y-5 animate-in fade-in duration-300">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
                                                <input required type="text" value={cardDetails.name} onChange={e => setCardDetails({...cardDetails, name: e.target.value})} className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-gray-50 transition-all font-medium" placeholder="John Doe" />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                                                <div className="relative">
                                                    <input required type="text" value={cardDetails.number} onChange={e => {
                                                        let val = e.target.value.replace(/\D/g, '');
                                                        val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
                                                        setCardDetails({...cardDetails, number: val})
                                                    }} maxLength="19" className="w-full px-5 py-4 pl-12 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-gray-50 transition-all font-mono font-medium tracking-widest text-lg" placeholder="4242 4242 4242 4242" />
                                                    <CreditCard className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                                                    <input required type="text" value={cardDetails.expiry} onChange={e => setCardDetails({...cardDetails, expiry: e.target.value})} maxLength="5" className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none bg-gray-50 transition-all font-mono font-medium tracking-wider text-lg text-center" placeholder="MM/YY" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">CVC</label>
                                                    <input required type="text" value={cardDetails.cvc} onChange={e => setCardDetails({...cardDetails, cvc: e.target.value})} maxLength="3" className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none bg-gray-50 transition-all font-mono font-medium tracking-widest text-lg text-center" placeholder="123" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {paymentMethod === 'upi' && (
                                        <div className="space-y-5 animate-in fade-in duration-300 py-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID / VPA</label>
                                                <input required type="text" className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none bg-gray-50 font-medium text-lg" placeholder="username@upi" />
                                                <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100 flex items-start">
                                                    <Lock className="w-5 h-5 text-purple-600 mr-3 flex-shrink-0 mt-0.5" />
                                                    <p className="text-sm text-purple-800 leading-relaxed text-left">Open your UPI app (GPay, PhonePe, Paytm, BHIM) to approve the pending request after clicking Pay below.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {paymentMethod === 'netbanking' && (
                                        <div className="space-y-5 animate-in fade-in duration-300 py-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Bank</label>
                                                <select required className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none bg-gray-50 cursor-pointer text-lg font-medium text-gray-800">
                                                    <option value="" className="text-gray-400">Choose your bank...</option>
                                                    <option value="sbi">State Bank of India</option>
                                                    <option value="hdfc">HDFC Bank</option>
                                                    <option value="icici">ICICI Bank</option>
                                                    <option value="axis">Axis Bank</option>
                                                    <option value="chase">Chase Bank</option>
                                                    <option value="bofa">Bank of America</option>
                                                </select>
                                                <p className="text-sm text-gray-500 mt-3 text-left">You will be redirected to your bank's secure portal to complete the payment securely.</p>
                                            </div>
                                        </div>
                                    )}

                                    {paymentMethod === 'crypto' && (
                                        <div className="space-y-4 animate-in fade-in duration-300 pt-2">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Network</label>
                                                <select required className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none bg-gray-50 mb-6 cursor-pointer text-base font-bold text-gray-800">
                                                    <option value="erc20">Ethereum (ERC20) - USDT</option>
                                                    <option value="trc20">Tron (TRC20) - USDT</option>
                                                    <option value="solana">Solana (SPL) - USDC</option>
                                                    <option value="bitcoin">Bitcoin (BTC)</option>
                                                </select>
                                                
                                                <div className="p-6 bg-gray-900 rounded-xl text-center shadow-inner relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-2"><Sparkles className="w-4 h-4 text-emerald-400 opacity-50"/></div>
                                                    <p className="text-sm text-gray-400 mb-2">Send exactly <strong className="text-white text-lg">{getPrice()} USDT/USDC</strong> to:</p>
                                                    <p className="font-mono font-bold text-base md:text-lg text-emerald-400 break-all select-all py-3 px-2 bg-black/40 rounded-lg border border-gray-800">
                                                        0x71C7656EC7ab88b09...
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <button 
                                        type="submit" 
                                        disabled={loading}
                                        className="w-full py-5 mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-lg rounded-xl flex items-center justify-center transition-all shadow-xl shadow-purple-600/30 hover:shadow-purple-600/50 hover:-translate-y-1 disabled:opacity-50 disabled:transform-none disabled:shadow-none"
                                    >
                                        {loading ? (
                                            <><Loader2 className="w-6 h-6 animate-spin mr-3" /> Processing Payment...</>
                                        ) : (
                                            `Pay $${getPrice()}`
                                        )}
                                    </button>
                                    
                                    <p className="text-center text-xs text-gray-400 flex items-center justify-center mt-6 pt-2 border-t border-gray-100">
                                        <Lock className="w-3 h-3 mr-1" /> 256-bit SSL Encrypted Transaction via Stripe
                                    </p>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Waiting for Admin Approval */}
                {step === 3 && (
                    <div className="max-w-md mx-auto text-center mt-20 animate-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                            <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-20"></div>
                            <ShieldCheck className="w-12 h-12 text-yellow-600 relative z-10" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Payment Received!</h2>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            Thank you for upgrading! Your transaction is currently <strong>pending review</strong>. An Administrator will verify the transaction and grant you Premium Access shortly.
                        </p>
                        
                        <div className="bg-white p-6 rounded-2xl border border-yellow-200 shadow-sm flex items-center text-left mb-8">
                            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mr-4 flex-shrink-0" />
                            <div>
                                <h4 className="font-bold text-gray-800">Status: Waiting for Approval</h4>
                                <p className="text-sm text-gray-500">Usually takes 1-2 hours.</p>
                            </div>
                        </div>

                        <a href="/" className="inline-block px-8 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-colors">
                            Return to Dashboard
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
