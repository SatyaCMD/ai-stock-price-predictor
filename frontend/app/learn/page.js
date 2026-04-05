"use client";
import { useState } from 'react';
import Navbar from '../../components/Navbar';
import AIAssistant from '../../components/AIAssistant';
import { BookOpen, TrendingUp, Activity, Shield, Globe, FileText, ChevronDown, ChevronUp, Lightbulb, PieChart, Brain, Users, BarChart2, TrendingDown } from 'lucide-react';
import SubscriptionGuard from '../../components/SubscriptionGuard';

export default function Learn() {
    const [expandedModule, setExpandedModule] = useState(null);

    const toggleModule = (id) => {
        setExpandedModule(expandedModule === id ? null : id);
    };

    const modules = [
        {
            id: 1,
            title: "Market Fundamentals",
            icon: <BookOpen className="w-6 h-6 text-blue-600" />,
            color: "bg-blue-50 border-blue-100",
            description: "Understand the core concepts of the stock market and how it functions.",
            content: (
                <div className="space-y-4 text-gray-600">
                    <p>
                        <strong className="text-gray-900">What is a Stock?</strong><br />
                        A stock represents a share in the ownership of a company. When you buy a stock, you become a partial owner (shareholder) of that corporation.
                    </p>
                    <p>
                        <strong className="text-gray-900">How Exchanges Work</strong><br />
                        Stock exchanges (like NYSE, NASDAQ, NSE) are marketplaces where buyers and sellers meet to trade shares. They ensure liquidity and fair pricing.
                    </p>
                    <p>
                        <strong className="text-gray-900">Why Prices Move</strong><br />
                        Prices fluctuate based on supply and demand. Positive news (earnings, growth) drives demand up, while negative news drives it down.
                    </p>
                </div>
            )
        },
        {
            id: 2,
            title: "Trading Mechanics",
            icon: <TrendingUp className="w-6 h-6 text-green-600" />,
            color: "bg-green-50 border-green-100",
            description: "Learn how to execute trades, understand order types, and read market data.",
            content: (
                <div className="space-y-4 text-gray-600">
                    <p>
                        <strong className="text-gray-900">Bid vs. Ask</strong><br />
                        The <em>Bid</em> is the highest price a buyer is willing to pay. The <em>Ask</em> is the lowest price a seller is willing to accept. The difference is the "Spread".
                    </p>
                    <div className="text-gray-600">
                        <strong className="text-gray-900">Order Types</strong><br />
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                            <li><strong>Market Order:</strong> Buy/Sell immediately at the current best price.</li>
                            <li><strong>Limit Order:</strong> Buy/Sell only at a specific price or better.</li>
                        </ul>
                    </div>
                    <p>
                        <strong className="text-gray-900">Volume</strong><br />
                        The number of shares traded in a given period. High volume indicates strong interest and liquidity.
                    </p>
                </div>
            )
        },
        {
            id: 3,
            title: "Analysis 101",
            icon: <Activity className="w-6 h-6 text-purple-600" />,
            color: "bg-purple-50 border-purple-100",
            description: "Master the art of analyzing stocks using Technical and Fundamental methods.",
            content: (
                <div className="space-y-4 text-gray-600">
                    <p>
                        <strong className="text-gray-900">Fundamental Analysis</strong><br />
                        Evaluating a company's intrinsic value by looking at financial statements, earnings, revenue growth, and P/E ratios.
                    </p>
                    <p>
                        <strong className="text-gray-900">Technical Analysis</strong><br />
                        Studying price charts and patterns to predict future movements. Common tools include Moving Averages, RSI, and MACD.
                    </p>
                    <div className="bg-white p-3 rounded-lg border border-purple-100 mt-2">
                        <span className="text-xs font-bold text-purple-600 uppercase">Pro Tip</span>
                        <p className="text-sm mt-1">Combine both methods for the best results. Fundamentals tell you <em>what</em> to buy, Technicals tell you <em>when</em> to buy.</p>
                    </div>
                </div>
            )
        },
        {
            id: 4,
            title: "Risk Management",
            icon: <Shield className="w-6 h-6 text-red-600" />,
            color: "bg-red-50 border-red-100",
            description: "Protect your capital with proven strategies and psychological discipline.",
            content: (
                <div className="space-y-4 text-gray-600">
                    <p>
                        <strong className="text-gray-900">Diversification</strong><br />
                        Don't put all your eggs in one basket. Spread investments across different sectors and asset classes to reduce risk.
                    </p>
                    <p>
                        <strong className="text-gray-900">Stop-Loss Orders</strong><br />
                        A predetermined price at which you sell a stock to limit your loss. Essential for preserving capital.
                    </p>
                    <p>
                        <strong className="text-gray-900">Trading Psychology</strong><br />
                        Fear and Greed are your enemies. Stick to your plan and avoid emotional decision-making.
                    </p>
                </div>
            )
        },
        {
            id: 5,
            title: "Global Markets",
            icon: <Globe className="w-6 h-6 text-indigo-600" />,
            color: "bg-indigo-50 border-indigo-100",
            description: "Explore opportunities beyond stocks: Forex, Crypto, and Indices.",
            content: (
                <div className="space-y-4 text-gray-600">
                    <p>
                        <strong className="text-gray-900">Forex (Foreign Exchange)</strong><br />
                        Trading currency pairs (e.g., EUR/USD). It's the largest market in the world, operating 24/5.
                    </p>
                    <p>
                        <strong className="text-gray-900">Cryptocurrency</strong><br />
                        Digital assets like Bitcoin and Ethereum. Known for high volatility and 24/7 trading.
                    </p>
                    <p>
                        <strong className="text-gray-900">Indices</strong><br />
                        Baskets of stocks representing a market segment (e.g., S&P 500, Nifty 50). Great for gauging overall market health.
                    </p>
                </div>
            )
        },
        {
            id: 6,
            title: "Key Terminology",
            icon: <FileText className="w-6 h-6 text-orange-600" />,
            color: "bg-orange-50 border-orange-100",
            description: "A quick glossary of essential financial terms every trader should know.",
            content: (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="font-bold text-gray-900">Bull Market:</span>
                        <p className="text-gray-600">A market condition where prices are rising or expected to rise.</p>
                    </div>
                    <div>
                        <span className="font-bold text-gray-900">Bear Market:</span>
                        <p className="text-gray-600">A market condition where prices are falling.</p>
                    </div>
                    <div>
                        <span className="font-bold text-gray-900">IPO:</span>
                        <p className="text-gray-600">Initial Public Offering - when a private company goes public.</p>
                    </div>
                    <div>
                        <span className="font-bold text-gray-900">Dividend:</span>
                        <p className="text-gray-600">A portion of company profits distributed to shareholders.</p>
                    </div>
                    <div>
                        <span className="font-bold text-gray-900">Market Cap:</span>
                        <p className="text-gray-600">Total value of a company's outstanding shares.</p>
                    </div>
                    <div>
                        <span className="font-bold text-gray-900">Volatility:</span>
                        <p className="text-gray-600">The rate at which a stock's price increases or decreases.</p>
                    </div>
                </div>
            )
        },
        {
            id: 7,
            title: "Technical Indicators",
            icon: <Activity className="w-6 h-6 text-teal-600" />,
            color: "bg-teal-50 border-teal-100",
            description: "Deep dive into the tools used to predict price movements.",
            content: (
                <div className="space-y-4 text-gray-600">
                    <p>
                        <strong className="text-gray-900">RSI (Relative Strength Index)</strong><br />
                        Measures the speed and change of price movements. RSI &gt; 70 is considered "Overbought" (sell signal), and RSI &lt; 30 is "Oversold" (buy signal).
                    </p>
                    <p>
                        <strong className="text-gray-900">MACD (Moving Average Convergence Divergence)</strong><br />
                        A trend-following momentum indicator. Look for "crossovers" where the MACD line crosses the signal line.
                    </p>
                    <p>
                        <strong className="text-gray-900">Bollinger Bands</strong><br />
                        A set of lines plotted two standard deviations (positively and negatively) away from a simple moving average. Used to measure volatility.
                    </p>
                </div>
            )
        },
        {
            id: 8,
            title: "Trading Strategies",
            icon: <TrendingUp className="w-6 h-6 text-rose-600" />,
            color: "bg-rose-50 border-rose-100",
            description: "Different approaches to participating in the financial markets.",
            content: (
                <div className="space-y-4 text-gray-600">
                    <p>
                        <strong className="text-gray-900">Day Trading</strong><br />
                        Buying and selling securities within the same trading day. High risk, requires constant attention.
                    </p>
                    <p>
                        <strong className="text-gray-900">Swing Trading</strong><br />
                        Holding positions for several days or weeks to capture expected upward or downward shifts.
                    </p>
                    <p>
                        <strong className="text-gray-900">Long-Term Investing</strong><br />
                        Buying and holding assets for years or decades (HODL). Relies on fundamental growth of the asset.
                    </p>
                </div>
            )
        },
        {
            id: 9,
            title: "Economic Indicators",
            icon: <Globe className="w-6 h-6 text-cyan-600" />,
            color: "bg-cyan-50 border-cyan-100",
            description: "Macro-economic factors that drive the entire market.",
            content: (
                <div className="space-y-4 text-gray-600">
                    <p>
                        <strong className="text-gray-900">GDP (Gross Domestic Product)</strong><br />
                        The total value of goods produced and services provided in a country during one year. High GDP growth is bullish.
                    </p>
                    <p>
                        <strong className="text-gray-900">Inflation (CPI)</strong><br />
                        The rate at which prices rise. High inflation erodes purchasing power and often leads to higher interest rates.
                    </p>
                    <p>
                        <strong className="text-gray-900">Interest Rates</strong><br />
                        Set by Central Banks (like the Fed). Higher rates make borrowing expensive, cooling the economy and stocks.
                    </p>
                </div>
            )
        },
        {
            id: 10,
            title: "Crypto Specifics",
            icon: <Shield className="w-6 h-6 text-violet-600" />,
            color: "bg-violet-50 border-violet-100",
            description: "Understanding the unique aspects of the cryptocurrency market.",
            content: (
                <div className="space-y-4 text-gray-600">
                    <p>
                        <strong className="text-gray-900">Blockchain</strong><br />
                        A decentralized, distributed ledger that records transactions across many computers so that the record cannot be altered retroactively.
                    </p>
                    <p>
                        <strong className="text-gray-900">DeFi (Decentralized Finance)</strong><br />
                        Financial services (lending, borrowing, trading) built on blockchain technology without central intermediaries.
                    </p>
                    <p>
                        <strong className="text-gray-900">Wallets (Hot vs. Cold)</strong><br />
                        Hot wallets are connected to the internet (convenient but risky). Cold wallets are offline storage (secure).
                    </p>
                </div>
            )
        },
        {
            id: 11,
            title: "Portfolio Construction",
            icon: <PieChart className="w-6 h-6 text-pink-600" />,
            color: "bg-pink-50 border-pink-100",
            description: "Strategies for building and maintaining a balanced investment portfolio.",
            content: (
                <div className="space-y-4 text-gray-600">
                    <p>
                        <strong className="text-gray-900">Asset Allocation</strong><br />
                        Dividing an investment portfolio among different asset categories, such as stocks, bonds, and cash.
                    </p>
                    <p>
                        <strong className="text-gray-900">Rebalancing</strong><br />
                        The process of realigning the weightings of a portfolio of assets. Buying or selling assets to maintain an original or desired level of asset allocation.
                    </p>
                    <p>
                        <strong className="text-gray-900">Correlation</strong><br />
                        A statistic that measures the degree to which two securities move in relation to each other. Low correlation reduces risk.
                    </p>
                </div>
            )
        },
        {
            id: 12,
            title: "Behavioral Finance",
            icon: <Brain className="w-6 h-6 text-yellow-600" />,
            color: "bg-yellow-50 border-yellow-100",
            description: "Understanding how psychological influences can affect market outcomes.",
            content: (
                <div className="space-y-4 text-gray-600">
                    <p>
                        <strong className="text-gray-900">FOMO (Fear Of Missing Out)</strong><br />
                        The anxiety that an exciting or interesting event may currently be happening elsewhere, often aroused by posts on social media.
                    </p>
                    <p>
                        <strong className="text-gray-900">Confirmation Bias</strong><br />
                        The tendency to search for, interpret, favor, and recall information in a way that confirms or supports one's prior beliefs or values.
                    </p>
                    <p>
                        <strong className="text-gray-900">Loss Aversion</strong><br />
                        The tendency to prefer avoiding losses to acquiring equivalent gains.
                    </p>
                </div>
            )
        },
        {
            id: 13,
            title: "Market Psychology",
            icon: <Users className="w-6 h-6 text-fuchsia-600" />,
            color: "bg-fuchsia-50 border-fuchsia-100",
            description: "The prevailing sentiment of financial market participants at any point in time.",
            content: (
                <div className="space-y-4 text-gray-600">
                    <p>
                        <strong className="text-gray-900">Crowd Psychology</strong><br />
                        How the collective behavior of investors drives market trends, often leading to bubbles or crashes.
                    </p>
                    <p>
                        <strong className="text-gray-900">Greed & Fear</strong><br />
                        The two primary emotions driving markets. Greed drives prices up (bubbles), while fear drives them down (crashes).
                    </p>
                    <p>
                        <strong className="text-gray-900">Contrarian Investing</strong><br />
                        An investment style that goes against prevailing market trends by buying assets that are performing poorly and selling assets that are performing well.
                    </p>
                </div>
            )
        },
        {
            id: 14,
            title: "Market Sentiments",
            icon: <BarChart2 className="w-6 h-6 text-lime-600" />,
            color: "bg-lime-50 border-lime-100",
            description: "Indicators that measure the overall attitude of investors toward a particular security or financial market.",
            content: (
                <div className="space-y-4 text-gray-600">
                    <p>
                        <strong className="text-gray-900">Bullish/Bearish Indicators</strong><br />
                        Signals that suggest whether the market is likely to go up (bullish) or down (bearish).
                    </p>
                    <p>
                        <strong className="text-gray-900">Put/Call Ratio</strong><br />
                        A ratio that measures the trading volume of put options to call options. A high ratio indicates bearish sentiment.
                    </p>
                    <p>
                        <strong className="text-gray-900">VIX (Volatility Index)</strong><br />
                        A real-time market index representing the market's expectations for volatility over the coming 30 days. Often called the "Fear Gauge".
                    </p>
                </div>
            )
        },
        {
            id: 15,
            title: "Market Behaviour",
            icon: <TrendingDown className="w-6 h-6 text-amber-600" />,
            color: "bg-amber-50 border-amber-100",
            description: "Patterns and tendencies of financial markets to move in specific ways.",
            content: (
                <div className="space-y-4 text-gray-600">
                    <p>
                        <strong className="text-gray-900">Trends</strong><br />
                        The general direction in which a market or asset is moving. Can be Up (Bull), Down (Bear), or Sideways.
                    </p>
                    <p>
                        <strong className="text-gray-900">Ranges</strong><br />
                        When a security trades between a consistent high and low price for a period of time.
                    </p>
                    <p>
                        <strong className="text-gray-900">Breakouts</strong><br />
                        When a price moves above a resistance level or below a support level with increased volume.
                    </p>
                </div>
            )
        }
    ];

    return (
        <SubscriptionGuard>
        <div className="bg-gray-50 pb-20">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28">
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
                        <Lightbulb className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-4">
                        Master the Markets
                    </h1>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                        Your journey to financial freedom starts here. Explore our comprehensive modules designed to take you from beginner to pro.
                    </p>
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {modules.map((module) => (
                        <div
                            key={module.id}
                            className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden hover:shadow-xl ${expandedModule === module.id ? 'shadow-lg ring-2 ring-blue-500/20' : 'shadow-sm hover:-translate-y-1'} ${module.color.replace('bg-', 'border-')}`}
                        >
                            <div className="p-6">
                                <div className={`w-12 h-12 rounded-xl ${module.color} flex items-center justify-center mb-4`}>
                                    {module.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{module.title}</h3>
                                <p className="text-gray-500 mb-4 line-clamp-2">
                                    {module.description}
                                </p>
                                <button
                                    onClick={() => toggleModule(module.id)}
                                    className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                    {expandedModule === module.id ? (
                                        <>
                                            Show Less <ChevronUp className="w-4 h-4 ml-1" />
                                        </>
                                    ) : (
                                        <>
                                            Learn More <ChevronDown className="w-4 h-4 ml-1" />
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Expandable Content */}
                            <div
                                className={`bg-gray-50/50 border-t border-gray-100 transition-all duration-500 ease-in-out ${expandedModule === module.id ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                                    } overflow-hidden`}
                            >
                                <div className="p-6 pt-4">
                                    {module.content}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Call to Action */}
                <div className="mt-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 md:p-12 text-center text-white shadow-2xl shadow-blue-600/20">
                    <h2 className="text-3xl font-bold mb-4">Ready to Apply Your Knowledge?</h2>
                    <p className="text-blue-100 mb-8 max-w-xl mx-auto">
                        Put your skills to the test with our real-time market simulator and AI-powered analysis tools.
                    </p>
                    <a
                        href="/markets"
                        className="inline-flex items-center px-8 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg"
                    >
                        Go to Markets <TrendingUp className="w-5 h-5 ml-2" />
                    </a>
                </div>
            </div>

            <AIAssistant />
        </div>
        </SubscriptionGuard>
    );
}
