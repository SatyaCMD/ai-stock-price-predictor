"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import SubscriptionGuard from '../../components/SubscriptionGuard';
import { TrendingUp, TrendingDown, Globe, Activity, RefreshCw, X, Download, BarChart2, FileText, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import StockChart from '../../components/StockChart';
import { getMarketStatus } from '../../utils/marketStatus';
import { getLogoDataUrl, addInteractiveLogoToPage } from '../../utils/pdfHelper';

const MARKET_INDICES = [
    { name: 'S&P 500', ticker: '^GSPC', region: 'US' },
    { name: 'Nasdaq 100', ticker: '^NDX', region: 'US' },
    { name: 'Dow Jones (US30)', ticker: '^DJI', region: 'US' },
    { name: 'Nifty 50', ticker: '^NSEI', region: 'India' },
    { name: 'Sensex', ticker: '^BSESN', region: 'India' },
    { name: 'FTSE 100', ticker: '^FTSE', region: 'Europe' },
    { name: 'DAX', ticker: '^GDAXI', region: 'Europe' },
    { name: 'Nikkei 225', ticker: '^N225', region: 'Japan' },
    { name: 'Bitcoin', ticker: 'BTC-USD', region: 'Crypto' },
    { name: 'Ethereum', ticker: 'ETH-USD', region: 'Crypto' },
    { name: 'EUR/USD', ticker: 'EURUSD=X', region: 'Forex' },
    { name: 'GBP/USD', ticker: 'GBPUSD=X', region: 'Forex' },
    { name: 'USD/JPY', ticker: 'JPY=X', region: 'Forex' },
    { name: 'Gold', ticker: 'GC=F', region: 'Commodities' },
    { name: 'Silver', ticker: 'SI=F', region: 'Commodities' },
    { name: 'Crude Oil', ticker: 'CL=F', region: 'Commodities' },
    { name: 'Natural Gas', ticker: 'NG=F', region: 'Commodities' },
    { name: 'Copper', ticker: 'HG=F', region: 'Commodities' },
];

export default function Markets() {
    const [marketData, setMarketData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [selectedMarket, setSelectedMarket] = useState(null);
    const [analysisData, setAnalysisData] = useState(null);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    const fetchMarketData = async () => {
        setLoading(true);
        try {
            const data = await Promise.all(MARKET_INDICES.map(async (index) => {
                try {
                    const res = await axios.get(`/api/v1/stock/${index.ticker}`, {
                        params: { period: '5d', interval: '1d' }
                    });
                    const info = res.data.info;
                    const history = res.data.history;

                    // Calculate change if not directly available
                    let changePercent = 0;
                    let currentPrice = info.currentPrice || info.regularMarketPrice;

                    if (history && history.length >= 2) {
                        const close = history[history.length - 1].Close;
                        const prevClose = history[history.length - 2].Close;
                        currentPrice = close;
                        changePercent = ((close - prevClose) / prevClose) * 100;
                    }

                    return {
                        ...index,
                        price: currentPrice,
                        change: changePercent,
                        currency: info.currency,
                        marketState: info.marketState, // Capture market state
                        lastPrice: currentPrice // Track last price for blink direction
                    };
                } catch (err) {
                    console.error(`Failed to fetch data for ${index.ticker}`, err);
                    // For Forex, if it fails, try to return a fallback or keep error true
                    // But for now, let's just log it.
                    return { ...index, error: true };
                }
            }));
            setMarketData(data);
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Error fetching market data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarketClick = async (market) => {
        setSelectedMarket(market);
        setLoadingAnalysis(true);
        setAnalysisData(null);
        setActiveTab('overview');

        try {
            const res = await axios.get(`/api/v1/predict/${market.ticker}`);
            setAnalysisData(res.data);
        } catch (error) {
            console.error("Error fetching analysis:", error);
        } finally {
            setLoadingAnalysis(false);
        }
    };

    const closeAnalysis = () => {
        setSelectedMarket(null);
        setAnalysisData(null);
    };

    const downloadReport = async () => {
        if (!selectedMarket || !analysisData) return;

        const doc = new jsPDF();

        // Add interactive logo
        const pageWidth = doc.internal.pageSize.getWidth();
        const logoDataUrl = await getLogoDataUrl();
        addInteractiveLogoToPage(doc, pageWidth, logoDataUrl);

        // Header
        doc.setFontSize(22);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(30, 58, 138);
        doc.text(`${selectedMarket.name} AI Analysis`, 14, 32);

        // Divider
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(14, 38, pageWidth - 14, 38);

        // Add User Info
        const savedProfile = localStorage.getItem('userProfile');
        let userName = 'Guest';
        let userId = 'N/A';
        if (savedProfile) {
            const profile = JSON.parse(savedProfile);
            if (profile.name) userName = profile.name;
            if (profile.userId) userId = profile.userId;
        }

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100);
        doc.text(`Investor: ${userName} (ID: ${userId})`, 14, 46);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 51);

        // Metadata Box
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(14, 56, pageWidth - 28, 18, 3, 3, 'FD');

        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`Ticker: ${selectedMarket.ticker}   |   Region: ${selectedMarket.region}   |   Classification: Global Market`, 20, 67);

        // Market Verdict
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(30, 58, 138);
        doc.text("AI Market Verdict", 14, 85);

        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(60);
        const splitVerdict = doc.splitTextToSize(analysisData.lstm.analysis, 180);
        doc.text(splitVerdict, 14, 93);

        let yPos = 93 + (splitVerdict.length * 5) + 10;

        // Technical Analysis Table
        autoTable(doc, {
            startY: yPos,
            head: [['Execution Model', 'Confidence', 'Technical Analysis Details']],
            body: [
                ['Linear Regression (Trend)', `${analysisData.linear_regression.confidence.toFixed(1)}%`, analysisData.linear_regression.analysis],
                ['LSTM (Pattern Matching)', `${analysisData.lstm.confidence.toFixed(1)}%`, analysisData.lstm.analysis],
                ['Logistic Regression (Dir)', `${analysisData.logistic_regression.confidence.toFixed(1)}%`, analysisData.logistic_regression.analysis],
            ],
            theme: 'striped',
            headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
            bodyStyles: { textColor: 50 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: {
                0: { cellWidth: 45, fontStyle: 'bold' },
                1: { cellWidth: 25, halign: 'center' },
                2: { cellWidth: 'auto' }
            },
            styles: { fontSize: 9, cellPadding: 5 }
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('TradeMind AI - Automated Market Intelligence', 14, doc.internal.pageSize.height - 10);
        }

        doc.save(`${selectedMarket.name}_Analysis_Report.pdf`);
    };

    useEffect(() => {
        fetchMarketData();
        // Auto-refresh data from API every 5 minutes
        const interval = setInterval(fetchMarketData, 300000);
        return () => clearInterval(interval);
    }, []);

    // Real-time Simulation Effect
    useEffect(() => {
        const simulationInterval = setInterval(() => {
            setMarketData(prevData => {
                return prevData.map(market => {
                    // Only fluctuate if market is OPEN (Time-based or API-based)
                    const status = getMarketStatus(market.region);
                    if (!status.isOpen || (market.marketState && market.marketState !== 'REGULAR' && market.marketState !== 'OPEN')) return market;

                    // 50% chance to update price this tick
                    if (Math.random() > 0.5) return market;

                    const volatility = 0.0005; // 0.05% volatility
                    const changeFactor = 1 + (Math.random() * volatility * 2 - volatility);
                    const newPrice = market.price * changeFactor;

                    // Recalculate change percent based on original open/prevClose (approximated here by keeping base consistent or just updating relative to now)
                    // Better: Update price and let the change % drift slightly too.
                    // We need to know the 'base' price to calculate true change, but for visual effect, we just update the displayed change slightly.
                    const newChange = market.change + ((newPrice - market.price) / market.price) * 100;

                    return {
                        ...market,
                        price: newPrice,
                        change: newChange,
                        lastPrice: market.price, // Store previous price to determine blink color
                        blink: newPrice > market.price ? 'green' : 'red',
                        blinkKey: Date.now() // Force re-render of animation
                    };
                });
            });
        }, 1000); // Update every 1 second for smooth countdown clock

        return () => clearInterval(simulationInterval);
    }, []);

    const getRegionColor = (region) => {
        switch (region) {
            case 'US': return 'bg-blue-100 text-blue-800';
            case 'India': return 'bg-orange-100 text-orange-800';
            case 'Europe': return 'bg-indigo-100 text-indigo-800';
            case 'Japan': return 'bg-red-100 text-red-800';
            case 'Crypto': return 'bg-yellow-100 text-yellow-800';
            case 'Forex': return 'bg-emerald-100 text-emerald-800';
            case 'Commodities': return 'bg-amber-100 text-amber-900';
            default: return 'bg-gray-100 text-gray-800';
        }
    };



    return (
        <SubscriptionGuard>
            <div className="bg-gray-50 pb-20">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28">
                    <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900">
                            <Globe className="h-8 w-8 text-blue-600" />
                            Global Markets
                        </h1>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center space-x-4">
                        {lastUpdated && (
                            <span className="text-sm text-gray-400">
                                Updated: {lastUpdated.toLocaleTimeString()}
                            </span>
                        )}
                        <button
                            onClick={fetchMarketData}
                            disabled={loading}
                            className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-all shadow-sm"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {marketData.map((market, index) => (
                        <div
                            key={index}
                            onClick={() => handleMarketClick(market)}
                            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/50 hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                        <h3 className="text-lg font-bold text-gray-900">{market.name}</h3>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRegionColor(market.region)}`}>
                                            {market.region}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-400">{market.ticker}</p>
                                </div>
                                {market.error ? (
                                    <Activity className="w-6 h-6 text-gray-300" />
                                ) : (
                                    <div className={`p-2 rounded-lg ${market.change >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                                        {market.change >= 0 ?
                                            <TrendingUp className="w-5 h-5 text-green-600" /> :
                                            <TrendingDown className="w-5 h-5 text-red-600" />
                                        }
                                    </div>
                                )}
                            </div>

                            {market.error ? (
                                <div className="text-center py-4 text-gray-400 text-sm">
                                    Data Unavailable
                                </div>
                            ) : (
                                <div>
                                    <div
                                        key={market.blinkKey} // Restart animation on update
                                        className={`text-3xl font-bold text-gray-900 mb-1 transition-colors duration-500 inline-block
                                            ${market.blink === 'green' ? 'blink-text-green' : ''}
                                            ${market.blink === 'red' ? 'blink-text-red' : ''}
                                        `}
                                    >
                                        {market.price ? market.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'Loading...'}
                                        <span className="text-sm text-gray-400 font-normal ml-1">{market.currency}</span>
                                    </div>
                                    <div className={`text-sm font-medium ${market.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {market.change >= 0 ? '+' : ''}{market.change ? market.change.toFixed(2) : '0.00'}%
                                        {market.marketState && market.marketState !== 'REGULAR' && (
                                            <span className="ml-2 text-xs text-gray-400 border border-gray-200 px-1 rounded">
                                                {market.marketState}
                                            </span>
                                        )}
                                    </div>
                                    {/* Market Timing Status */}
                                    <div className="mt-2 text-xs font-medium flex items-center">
                                        <div className={`w-2 h-2 rounded-full mr-1.5 ${getMarketStatus(market.region).isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`}></div>
                                        <span className={getMarketStatus(market.region).isOpen ? 'text-green-700' : 'text-red-600'}>
                                            {getMarketStatus(market.region).status}
                                        </span>
                                        <span className="text-gray-400 ml-1">
                                            • {getMarketStatus(market.region).detail}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div >

            {/* Analysis Modal */}
            {
                selectedMarket && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-20">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{selectedMarket.name} Analysis</h2>
                                    <p className="text-sm text-gray-500">AI-Powered Market Insights</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={downloadReport}
                                        className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium focus:outline-none"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span>Download PDF</span>
                                    </button>
                                    <button onClick={closeAnalysis} className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none">
                                        <X className="w-6 h-6 text-gray-500" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6">
                                {loadingAnalysis ? (
                                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-gray-500 animate-pulse">Analyzing massive datasets...</p>
                                    </div>
                                ) : analysisData ? (
                                    <div className="flex flex-col space-y-6">
                                        {/* Tabs */}
                                        <div className="flex space-x-2 border-b border-gray-200 pb-2">
                                            <button 
                                                onClick={() => setActiveTab('overview')}
                                                className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors ${activeTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <FileText className="w-4 h-4" />
                                                    <span>AI Overview</span>
                                                </div>
                                            </button>
                                            <button 
                                                onClick={() => setActiveTab('chart')}
                                                className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors ${activeTab === 'chart' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <BarChart2 className="w-4 h-4" />
                                                    <span>Interactive Chart</span>
                                                </div>
                                            </button>
                                        </div>

                                        {/* Tab Content */}
                                        <div className="animate-in fade-in zoom-in-95 duration-300">
                                            {activeTab === 'overview' && (
                                                <div className="space-y-6">
                                                    {/* Summary Card */}
                                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden group">
                                                        <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                                                            <Activity className="w-32 h-32" />
                                                        </div>
                                                        <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center">
                                                            <CheckCircle2 className="w-5 h-5 mr-2 text-blue-600" />
                                                            Market Verdict
                                                        </h3>
                                                        <p className="text-blue-800 leading-relaxed text-lg relative z-10">
                                                            {analysisData.lstm.analysis}
                                                        </p>
                                                    </div>

                                                    {/* Detailed Points */}
                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
                                                            <Activity className="w-5 h-5 mr-2 text-blue-600" />
                                                            Deep Dive Analytics
                                                        </h3>

                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            {/* Linear Regression */}
                                                            <div className="p-5 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all group cursor-default">
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <span className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">Trend (Linear)</span>
                                                                    <span className="text-xs font-bold px-2 py-1 bg-blue-50 rounded text-blue-700">
                                                                        {analysisData.linear_regression.confidence.toFixed(1)}% Conf.
                                                                    </span>
                                                                </div>
                                                                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                                                                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${analysisData.linear_regression.confidence}%` }}></div>
                                                                </div>
                                                                <p className="text-sm text-gray-600 leading-relaxed">
                                                                    {analysisData.linear_regression.analysis}
                                                                </p>
                                                            </div>

                                                            {/* LSTM */}
                                                            <div className="p-5 bg-white border border-gray-200 rounded-xl hover:border-purple-400 hover:shadow-md transition-all group cursor-default">
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <span className="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors">Pattern (LSTM)</span>
                                                                    <span className="text-xs font-bold px-2 py-1 bg-purple-50 rounded text-purple-700">
                                                                        {analysisData.lstm.confidence.toFixed(1)}% Conf.
                                                                    </span>
                                                                </div>
                                                                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                                                                    <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${analysisData.lstm.confidence}%` }}></div>
                                                                </div>
                                                                <p className="text-sm text-gray-600 leading-relaxed">
                                                                    {analysisData.lstm.analysis}
                                                                </p>
                                                            </div>

                                                            {/* Logistic Regression */}
                                                            <div className="p-5 bg-white border border-gray-200 rounded-xl hover:border-emerald-400 hover:shadow-md transition-all group cursor-default">
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <span className="font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors">Dir (Logistic)</span>
                                                                    <span className="text-xs font-bold px-2 py-1 bg-emerald-50 rounded text-emerald-700">
                                                                        {analysisData.logistic_regression.confidence.toFixed(1)}% Acc.
                                                                    </span>
                                                                </div>
                                                                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                                                                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${analysisData.logistic_regression.confidence}%` }}></div>
                                                                </div>
                                                                <p className="text-sm text-gray-600 leading-relaxed">
                                                                    {analysisData.logistic_regression.analysis}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {activeTab === 'chart' && (
                                                <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden shadow-inner">
                                                    <StockChart ticker={selectedMarket.ticker} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        Could not generate analysis for this market.
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end rounded-b-2xl">
                                <button
                                    onClick={closeAnalysis}
                                    className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors focus:outline-none"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </SubscriptionGuard>
    );
}
