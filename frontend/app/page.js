"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import MarketSelector from '../components/MarketSelector';
import StockChart from '../components/StockChart';
import PredictionCard from '../components/PredictionCard';
import DownloadButton from '../components/DownloadButton';
import FinancialDetails from '../components/FinancialDetails';
import { formatCurrency } from '../utils/currency';
import { TrendingUp, BarChart2, DollarSign, Activity, AlertTriangle, Play, Pause, AlertCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
    const [stockData, setStockData] = useState(null);
    const [predictions, setPredictions] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentTicker, setCurrentTicker] = useState(null);
    const [period, setPeriod] = useState('1Y');
    const [hasPremiumAccess, setHasPremiumAccess] = useState(false);

    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        const checkAccess = () => {
            const profileStr = localStorage.getItem('userProfile');
            if (profileStr) {
                const profile = JSON.parse(profileStr);
                setUserProfile(profile);
                if (profile.role === 'admin' || profile.isSubscribed) {
                    setHasPremiumAccess(true);
                    return;
                }
                if (profile.trialStart) {
                    const diffMs = new Date() - new Date(profile.trialStart);
                    if (24 - (diffMs / (1000 * 60 * 60)) > 0) {
                        setHasPremiumAccess(true);
                        return;
                    }
                }
            }
            setHasPremiumAccess(false);
        };
        checkAccess();
        window.addEventListener('authChange', checkAccess);
        return () => window.removeEventListener('authChange', checkAccess);
    }, []);

    const fetchStockData = async (ticker, selectedPeriod) => {
        setLoading(true);
        setError(null);
        try {
            // Map UI period to API params
            let apiPeriod = '1y';
            let apiInterval = '1d';

            switch (selectedPeriod) {
                case '5M': apiPeriod = '1d'; apiInterval = '5m'; break; // 1 Day view, 5m interval
                case '15M': apiPeriod = '1d'; apiInterval = '15m'; break; // 1 Day view, 15m interval
                case '30M': apiPeriod = '5d'; apiInterval = '30m'; break; // 5 Days view, 30m interval
                case '1H': apiPeriod = '1mo'; apiInterval = '1h'; break; // 1 Month view, 1h interval
                case '1D': apiPeriod = '1d'; apiInterval = '5m'; break; // 1 Day view, 5m interval (Standard intraday)
                case '1W': apiPeriod = '5d'; apiInterval = '15m'; break; // 5 Days view, 15m interval
                case '1M': apiPeriod = '1mo'; apiInterval = '1d'; break; // 1 Month view, Daily
                case '1Y': apiPeriod = '1y'; apiInterval = '1d'; break; // 1 Year view, Daily
                case 'ALL': apiPeriod = 'max'; apiInterval = '1wk'; break; // Max view, Weekly
                default: apiPeriod = '1y'; apiInterval = '1d';
            }

            // Fetch Stock Data
            const stockRes = await axios.get(`/api/v1/stock/${ticker}`, {
                params: { period: apiPeriod, interval: apiInterval }
            });
            setStockData(stockRes.data);

            // Fetch Predictions (only if ticker changed)
            if (ticker !== currentTicker) {
                const predRes = await axios.get(`/api/v1/predict/${ticker}`);
                setPredictions(predRes.data);
                setCurrentTicker(ticker);
            }
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.detail || "Failed to fetch data. Please check the ticker symbol and try again.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleStockSelect = (ticker) => {
        setPeriod('1Y'); // Reset to default on new search
        fetchStockData(ticker, '1Y');
    };

    const handlePeriodChange = (newPeriod) => {
        setPeriod(newPeriod);
        if (currentTicker) {
            fetchStockData(currentTicker, newPeriod);
        }
    };

    return (
        <main className="pb-20 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28">
                {/* Header Section */}
                <div className="mb-10 text-center">
                    <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-500 mb-4 tracking-tight">
                        AI Market Intelligence
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Advanced financial forecasting using Linear Regression, LSTM Deep Learning, and Logistic Regression models.
                    </p>
                </div>

                {/* Market Selector */}
                <MarketSelector onSelect={handleStockSelect} />

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-8 flex items-center animate-in">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        {error}
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col justify-center items-center h-64 animate-in">
                        <div className="relative w-16 h-16">
                            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500/30 rounded-full"></div>
                            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                        </div>
                        <p className="text-gray-400 mt-4 font-medium">Analyzing Market Data...</p>
                    </div>
                )}

                {/* Dashboard Content */}
                {!loading && stockData && (
                    <div className="space-y-6 animate-in fade-in duration-700">
                        {/* Stock Info Header */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white/60 p-6 rounded-2xl border border-gray-200 backdrop-blur-sm shadow-sm">
                            <div className="flex items-center space-x-4">
                                {stockData.info.logo_url && (
                                    <img
                                        src={stockData.info.logo_url}
                                        alt={stockData.info.name}
                                        className="w-12 h-12 rounded-full bg-white p-1 object-contain border border-gray-100"
                                        onError={(e) => { e.target.style.display = 'none' }}
                                    />
                                )}
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{stockData.info.name}</h2>
                                    <div className="flex items-center space-x-3 mt-1">
                                        <span className="text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded text-sm border border-blue-100">
                                            {stockData.ticker}
                                        </span>
                                        <span className="text-gray-500 text-sm">{stockData.info.sector}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right mt-4 md:mt-0 flex flex-col items-end space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Current Price</p>
                                    <p className="text-4xl font-bold text-gray-900 tracking-tight">
                                        {formatCurrency(stockData.info.currentPrice, stockData.info.currency)}
                                    </p>
                                </div>
                                {hasPremiumAccess ? (
                                    <DownloadButton stockData={stockData} predictions={predictions} />
                                ) : (
                                    <div className="text-xs bg-amber-50 text-amber-600 px-3 py-2 rounded-lg border border-amber-200 mt-2 font-medium">
                                        Subscription required for PDF 
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Main Chart */}
                        <div className="mb-6 w-full">
                            <StockChart ticker={currentTicker || stockData.ticker} />
                        </div>

                        {/* Predictions */}
                        {hasPremiumAccess ? (
                            <PredictionCard
                                predictions={predictions}
                                currency={stockData.info.currency}
                                currentPrice={stockData.info.currentPrice}
                            />
                        ) : (
                            <div className="bg-white/60 p-8 rounded-2xl border border-gray-200 backdrop-blur-sm shadow-sm text-center">
                                {userProfile?.paymentPending ? (
                                    <>
                                        <div className="mx-auto w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-4">
                                            <Clock className="w-8 h-8 animate-pulse" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Pending Review</h3>
                                        <p className="text-gray-500 mb-4 max-w-sm mx-auto">Your payment is waiting for approval by an administrator. Please check back shortly.</p>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">Premium AI Analysis</h3>
                                        <p className="text-gray-500 mb-4 max-w-sm mx-auto">You need an active subscription to unlock AI price predictions, LSTM forecasting, and detailed technical analysis metrics.</p>
                                        <Link href="/upgrade" className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-[1.02]">
                                            Upgrade to Premium
                                        </Link>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
