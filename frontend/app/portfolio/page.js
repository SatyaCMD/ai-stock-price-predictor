"use client";
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import { formatCurrency } from '../../utils/currency';
import { getMarketStatus } from '../../utils/marketStatus';
import { Plus, Trash2, RefreshCw, TrendingUp, TrendingDown, DollarSign, PieChart, Download, Filter, ChevronDown, Clock, Minus, Target, AlertOctagon, Info, X } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, Legend } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-hot-toast';
import { getLogoDataUrl, addInteractiveLogoToPage } from '../../utils/pdfHelper';

import { MARKETS } from '../../utils/constants';

export default function Portfolio() {
    const [portfolio, setPortfolio] = useState([]);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasPremiumAccess, setHasPremiumAccess] = useState(false);

    useEffect(() => {
        const checkAccess = () => {
            const profileStr = localStorage.getItem('userProfile');
            if (profileStr) {
                const profile = JSON.parse(profileStr);
                if (profile.role === 'admin' || profile.isSubscribed) {
                    setHasPremiumAccess(true);
                    return;
                }
                if (profile.trialStart) {
                    const hoursLeft = 24 - ((new Date() - new Date(profile.trialStart)) / (1000 * 60 * 60));
                    if (hoursLeft > 0) {
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
    const [totalValue, setTotalValue] = useState(0);
    const [totalPL, setTotalPL] = useState(0);
    const [selectedMarket, setSelectedMarket] = useState('US');

    // Form State
    const [ticker, setTicker] = useState('');
    const [buyPrice, setBuyPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [orderType, setOrderType] = useState('BUY');
    const [targetPrice, setTargetPrice] = useState('');
    const [stopLoss, setStopLoss] = useState('');
    const [market, setMarket] = useState('US');
    const [addError, setAddError] = useState(null);
    const [isMarketDropdownOpen, setIsMarketDropdownOpen] = useState(false);

    // Stock Details State (Recommendation)
    const [stockDetails, setStockDetails] = useState(null);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);

    // Sell Modal State
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    const [sellStock, setSellStock] = useState(null);
    const [sellQuantity, setSellQuantity] = useState('');
    const [sellError, setSellError] = useState(null);

    // Pending Order Modal State
    const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
    const [pendingModalData, setPendingModalData] = useState(null);

    // Execution Success Modal State
    const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);
    const [executedOrders, setExecutedOrders] = useState([]);

    const [isLoaded, setIsLoaded] = useState(false);

    // Load from LocalStorage on mount
    useEffect(() => {
        let parsedPortfolio = [];
        const savedPortfolio = localStorage.getItem('userPortfolio');
        if (savedPortfolio) {
            parsedPortfolio = JSON.parse(savedPortfolio);
        }

        // MIGRATION & RECOVERY 
        // 1. Recover lost stocks from Transaction History
        const savedTx = localStorage.getItem('userTransactions');
        if (savedTx) {
            const txs = JSON.parse(savedTx);
            const balances = {};
            
            // Build current true balances from all transactions
            txs.forEach(tx => {
                let mkId = tx.market;
                const mObj = MARKETS.find(m => m.name === tx.market);
                if (mObj) mkId = mObj.id;

                let txTicker = tx.ticker;
                if (txTicker.endsWith('.NS')) txTicker = txTicker.replace('.NS', '.NSE');
                if (txTicker.endsWith('.BO')) txTicker = txTicker.replace('.BO', '.BSE');

                if (!balances[txTicker]) {
                    balances[txTicker] = {
                        qty: 0,
                        buyPrice: tx.price,
                        market: mkId,
                        ticker: txTicker,
                        currency: tx.currency,
                        name: tx.name
                    };
                }
                if (tx.type === 'BUY') balances[txTicker].qty += tx.quantity;
                else if (tx.type.includes('SELL')) balances[txTicker].qty -= tx.quantity;
            });

            // Recover any missing stocks that have qty > 0
            Object.values(balances).forEach(b => {
                if (b.qty > 0) {
                    const exists = parsedPortfolio.find(p => p.ticker === b.ticker);
                    if (!exists) {
                        parsedPortfolio.push({
                            id: Date.now() + Math.random(),
                            orderId: `REC-${Date.now()}`,
                            ticker: b.ticker,
                            buyPrice: b.buyPrice,
                            quantity: b.qty,
                            targetPrice: null,
                            stopLoss: null,
                            market: b.market,
                            currency: b.currency || 'USD',
                            name: b.name || b.ticker
                        });
                    }
                }
            });
        }

        // 2. Format Tickers & Standardize Market IDs in Portfolio
        parsedPortfolio = parsedPortfolio.map(stock => {
            let newTicker = stock.ticker;
            if (newTicker.endsWith('.NS')) newTicker = newTicker.replace('.NS', '.NSE');
            if (newTicker.endsWith('.BO')) newTicker = newTicker.replace('.BO', '.BSE');
            
            let mkId = stock.market;
            const mObj = MARKETS.find(m => m.name === stock.market);
            if (mObj) mkId = mObj.id;
            
            return { ...stock, ticker: newTicker, market: mkId };
        });

        setPortfolio(parsedPortfolio);

        const savedPending = localStorage.getItem('pendingOrders');
        if (savedPending) {
            let parsedPending = JSON.parse(savedPending);
            // Migration: Update legacy suffixes
            parsedPending = parsedPending.map(order => {
                let newTicker = order.ticker;
                if (newTicker.endsWith('.NS')) newTicker = newTicker.replace('.NS', '.NSE');
                if (newTicker.endsWith('.BO')) newTicker = newTicker.replace('.BO', '.BSE');
                return { ...order, ticker: newTicker };
            });
            setPendingOrders(parsedPending);
        }
        setIsLoaded(true);
    }, []);

    // Save to LocalStorage whenever portfolio changes
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('userPortfolio', JSON.stringify(portfolio));
        }
    }, [portfolio, isLoaded]);

    // Save Pending Orders
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('pendingOrders', JSON.stringify(pendingOrders));
        }
    }, [pendingOrders, isLoaded]);

    // Helper to record transactions
    const recordTransaction = (type, stock, price, qty, total, orderId) => {
        const transaction = {
            id: Date.now() + Math.random(), // Ensure unique ID
            orderId: orderId || `ORD-${Date.now()}`,
            date: new Date().toISOString(),
            type: type,
            market: MARKETS.find(m => m.id === stock.market)?.name || stock.market,
            ticker: stock.ticker,
            name: stock.name || stock.ticker, // Store company name
            price: price,
            quantity: qty,
            total: total,
            currency: stock.currency
        };

        const existingHistory = JSON.parse(localStorage.getItem('userTransactions') || '[]');
        localStorage.setItem('userTransactions', JSON.stringify([transaction, ...existingHistory]));
    };

    // Backfill transactions for existing portfolio items if history is empty
    useEffect(() => {
        if (isLoaded && portfolio.length > 0) {
            const existingHistory = JSON.parse(localStorage.getItem('userTransactions') || '[]');
            if (existingHistory.length === 0) {
                console.log("Backfilling transaction history...");
                const initialTransactions = portfolio.map((stock, index) => ({
                    id: Date.now() + index,
                    orderId: stock.orderId || `ORD-INIT-${index}`,
                    date: stock.dateAdded || new Date().toISOString(),
                    type: 'BUY',
                    market: MARKETS.find(m => m.id === stock.market)?.name || stock.market,
                    ticker: stock.ticker,
                    name: stock.name || stock.ticker,
                    price: stock.buyPrice,
                    quantity: stock.quantity,
                    total: stock.buyPrice * stock.quantity,
                    currency: stock.currency
                }));
                localStorage.setItem('userTransactions', JSON.stringify(initialTransactions));
            }
        }
    }, [isLoaded, portfolio]);

    // Check for executable pending orders
    useEffect(() => {
        const checkPendingOrders = async () => {
            if (pendingOrders.length === 0) return;

            let updatedPending = [...pendingOrders];
            let updatedPortfolio = [...portfolio];
            let hasChanges = false;

            for (let i = 0; i < updatedPending.length; i++) {
                const order = updatedPending[i];
                const status = getMarketStatus(order.market);

                if (status.isOpen) {
                    // Market is open, execute order!
                    try {
                        const res = await axios.get(`/api/v1/stock/${order.ticker}`, {
                            params: { period: '5d', interval: '1d' }
                        });
                        const currentPrice = res.data.info.currentPrice || res.data.info.regularMarketPrice;

                        const executedOrder = {
                            ...order,
                            buyPrice: currentPrice || order.buyPrice, // Update buy price to actual execution price
                            currentPrice: currentPrice,
                            dateAdded: new Date().toISOString()
                        };

                        updatedPortfolio.push(executedOrder);

                        // Record Transaction
                        recordTransaction('BUY', executedOrder, executedOrder.buyPrice, executedOrder.quantity, executedOrder.buyPrice * executedOrder.quantity);

                        updatedPending.splice(i, 1);
                        i--; // Adjust index since we removed an item
                        hasChanges = true;
                    } catch (err) {
                        console.error("Failed to execute pending order", err);
                    }
                }
            }

            if (hasChanges) {
                setPortfolio(updatedPortfolio);
                setPendingOrders(updatedPending);

                // Identify newly executed orders for the modal
                // We can filter updatedPortfolio for items that were in pendingOrders but are now in portfolio
                // Or simpler: just track them in the loop. 
                // Let's refactor the loop slightly to track them.
            }
        };

        // Refactored checkPendingOrders to track executed orders
        const checkPendingOrdersRefactored = async () => {
            if (pendingOrders.length === 0) return;

            let newlyExecuted = [];
            let resolvedOrderIds = [];
            
            // Only process orders where the market is now open
            const ordersToExecute = pendingOrders.filter(o => getMarketStatus(o.market).isOpen);
            if (ordersToExecute.length === 0) return;

            for (let order of ordersToExecute) {
                try {
                    const res = await axios.get(`/api/v1/stock/${order.ticker}`, {
                        params: { period: '5d', interval: '1d' }
                    });
                    const currentPrice = res.data.info.currentPrice || res.data.info.regularMarketPrice;

                    const executedOrder = {
                        ...order,
                        buyPrice: currentPrice || order.buyPrice,
                        currentPrice: currentPrice,
                        dateAdded: new Date().toISOString()
                    };

                    newlyExecuted.push(executedOrder);
                    resolvedOrderIds.push(order.id);

                    recordTransaction('BUY', executedOrder, executedOrder.buyPrice, executedOrder.quantity, executedOrder.buyPrice * executedOrder.quantity, executedOrder.orderId);
                } catch (err) {
                    console.error("Failed to execute pending order", err);
                }
            }

            if (newlyExecuted.length > 0) {
                // IMPORTANT: Use functional state updates to never overwrite concurrent additions
                setPortfolio(prev => [...prev, ...newlyExecuted]);
                setPendingOrders(prev => prev.filter(o => !resolvedOrderIds.includes(o.id)));
                
                setExecutedOrders(newlyExecuted);
                setIsExecutionModalOpen(true);
            }
        };

        // Check every 10 seconds
        const interval = setInterval(checkPendingOrdersRefactored, 10000);
        checkPendingOrdersRefactored(); // Initial check

        return () => clearInterval(interval);
    }, [pendingOrders, portfolio]);

    // Recalculate totals when portfolio or selected market changes
    useEffect(() => {
        calculateTotals();
    }, [portfolio, selectedMarket]);

    // Auto-Refresh Prices & Check Target/SL
    useEffect(() => {
        const interval = setInterval(() => {
            fetchPrices(true); // true = auto mode (suppress loading spinner if desired, or keep it)
        }, 15000); // 15 seconds auto-refresh

        return () => clearInterval(interval);
    }, [portfolio]); // Re-bind if portfolio changes to ensure we have latest data

    // New: Buy Form Dynamic Price Fluctuation (if market is open)
    useEffect(() => {
        if (!stockDetails || !stockDetails.currentPrice) return;
        
        const status = getMarketStatus(market);
        if (!status.isOpen) return;

        const tickInterval = setInterval(() => {
            setStockDetails(prev => {
                if (!prev || !prev.currentPrice) return prev;
                if (Math.random() > 0.6) return prev; // Don't tick every single interval

                const volatility = 0.0003; // Real-world micro volatility
                const changeFactor = 1 + (Math.random() * volatility * 2 - volatility);
                const newPrice = prev.currentPrice * changeFactor;

                // Also dynamically update the Buy Price input exactly if they haven't explicitly started overriding it
                setBuyPrice(prevBuyPrice => {
                    if (prevBuyPrice === '' || prevBuyPrice === undefined) return parseFloat(newPrice.toFixed(2));
                    const numPrev = Number(prevBuyPrice);
                    // Compare mathematically rather than exact string
                    const prevDiff = Math.abs(numPrev - prev.currentPrice);
                    if (prevDiff < 0.05) { // Extremely close to current price, user hasn't overridden limits
                        return parseFloat(newPrice.toFixed(2));
                    }
                    return prevBuyPrice;
                });

                return { ...prev, currentPrice: newPrice };
            });
        }, 1800); // Ticks every 1.8 seconds roughly

        return () => clearInterval(tickInterval);
    }, [market, !!stockDetails]);

    // Real-time Simulation Effect
    useEffect(() => {
        const simulationInterval = setInterval(() => {
            setPortfolio(prevPortfolio => {
                return prevPortfolio.map(stock => {
                    // Only fluctuate if market is OPEN
                    const status = getMarketStatus(stock.market);
                    if (!status.isOpen) return stock;

                    // 50% chance to update price this tick
                    if (Math.random() > 0.5) return stock;

                    const volatility = 0.0005; // 0.05% volatility
                    const changeFactor = 1 + (Math.random() * volatility * 2 - volatility);
                    const currentPrice = stock.currentPrice || stock.buyPrice; // Fallback
                    const newPrice = currentPrice * changeFactor;

                    return {
                        ...stock,
                        currentPrice: newPrice,
                        lastPrice: currentPrice, // Store previous price to determine blink color
                        blink: newPrice > currentPrice ? 'green' : 'red',
                        blinkKey: Date.now() // Force re-render of animation
                    };
                });
            });
        }, 1000); // Update every 1 second for smooth countdown clock

        return () => clearInterval(simulationInterval);
    }, []);

    // Fetch current prices for all stocks
    const fetchPrices = async (isAuto = false) => {
        if (!isAuto) setLoading(true);
        try {
            let removedIds = new Set();
            let finalUpdates = {};
            let localAlerts = [];

            await Promise.all(portfolio.map(async (stock) => {
                try {
                    const res = await axios.get(`/api/v1/stock/${stock.ticker}`, {
                        params: { period: '5d', interval: '1d' }
                    });
                    const info = res.data.info;
                    const cp = info.currentPrice || info.regularMarketPrice;
                    const fetchedName = info.name;
                    const updatedName = fetchedName || stock.name || stock.ticker;

                    // Check Target & Stop Loss
                    if (cp) {
                        if (stock.targetPrice && cp >= stock.targetPrice) {
                            removedIds.add(stock.id);
                            localAlerts.push(`🎯 Target Hit! Sold ${stock.ticker} at ${formatCurrency(cp, stock.currency)}`);
                            recordTransaction('AUTO_SELL_TARGET', stock, cp, stock.quantity, cp * stock.quantity, stock.orderId);
                            handleWalletDeduction(stock.market, cp * stock.quantity, stock.ticker, "SELL", stock.orderId);
                        }
                        else if (stock.stopLoss && cp <= stock.stopLoss) {
                            removedIds.add(stock.id);
                            localAlerts.push(`🛑 Stop Loss Triggered! Sold ${stock.ticker} at ${formatCurrency(cp, stock.currency)}`);
                            recordTransaction('AUTO_SELL_STOP_LOSS', stock, cp, stock.quantity, cp * stock.quantity, stock.orderId);
                            handleWalletDeduction(stock.market, cp * stock.quantity, stock.ticker, "SELL", stock.orderId);
                        } else {
                            finalUpdates[stock.id] = { currentPrice: cp, name: updatedName };
                        }
                    }
                } catch (err) {
                    console.error(`Failed to fetch price for ${stock.ticker}`, err);
                }
            }));

            // Alert for any auto-executed orders
            if (localAlerts.length > 0) {
                localAlerts.forEach(msg => toast.success(msg));
            }

            // IMPORTANT: Use functional state updates to prevent race conditions 
            // from wiping out stocks added simultaneously
            setPortfolio(prevPortfolio => {
                return prevPortfolio.map(stock => {
                    if (finalUpdates[stock.id]) {
                        return { ...stock, ...finalUpdates[stock.id] };
                    }
                    return stock;
                }).filter(stock => !removedIds.has(stock.id));
            });

        } catch (error) {
            console.error("Global fetch error:", error);
        } finally {
            if (!isAuto) setLoading(false);
        }
    };

    // Calculate Totals for Selected Market
    const calculateTotals = () => {
        let val = 0;
        let pl = 0;

        const filteredPortfolio = portfolio.filter(stock => stock.market === selectedMarket);

        filteredPortfolio.forEach(stock => {
            if (stock.currentPrice) {
                const stockValue = stock.currentPrice * stock.quantity;
                val += stockValue;
                pl += (stock.currentPrice - stock.buyPrice) * stock.quantity;
            }
        });
        setTotalValue(val);
        setTotalPL(pl);
    };

    const handleTickerBlur = async () => {
        if (!ticker) return;

        setIsFetchingDetails(true);
        setStockDetails(null);
        setAddError(null);

        let formattedTicker = ticker.toUpperCase().trim();
        // Auto-format ticker based on market
        if (market === 'IN' && !formattedTicker.endsWith('.NSE') && !formattedTicker.endsWith('.BSE')) {
            formattedTicker += '.NSE';
        } else if (market === 'CRYPTO' && !formattedTicker.endsWith('-USD')) {
            formattedTicker += '-USD';
        } else if (market === 'FOREX' && !formattedTicker.endsWith('=X')) {
            formattedTicker += '=X';
        } else if (market === 'COMMODITIES') {
            const alias = { 'GOLD': 'GC=F', 'SILVER': 'SI=F', 'OIL': 'CL=F', 'CRUDE OIL': 'CL=F', 'NATURAL GAS': 'NG=F', 'COPPER': 'HG=F', 'CORN': 'ZC=F', 'WHEAT': 'ZW=F', 'SOYBEAN': 'ZS=F' };
            if (alias[formattedTicker]) formattedTicker = alias[formattedTicker];
            else if (!formattedTicker.endsWith('=F') && !formattedTicker.includes('.')) formattedTicker += '=F';
        }

        if (ticker !== formattedTicker) setTicker(formattedTicker);

        try {
            const res = await axios.get(`/api/v1/stock/${formattedTicker}`, {
                params: { period: '5d', interval: '1d' }
            });
            const info = res.data.info;

            setStockDetails({
                name: info.longName || info.shortName || formattedTicker,
                recommendation: info.recommendationKey,
                targetMeanPrice: info.targetMeanPrice,
                currentPrice: info.currentPrice || info.regularMarketPrice,
                currency: info.currency
            });

            // Auto-fill buy price if empty
            if (!buyPrice && (info.currentPrice || info.regularMarketPrice)) {
                setBuyPrice(info.currentPrice || info.regularMarketPrice);
            }

        } catch (err) {
            // Log as warning without passing the raw Error object to prevent Next.js dev overlay
            console.warn("Stock details not found for:", formattedTicker);
            setAddError("Could not find stock details. Please check the ticker.");
        } finally {
            setIsFetchingDetails(false);
        }
    };

    const handleWalletDeduction = (marketId, amount, ticker, type = "BUY", orderId) => {
        const savedBalances = JSON.parse(localStorage.getItem('demoWalletBalances') || '{}');
        const savedTransactions = JSON.parse(localStorage.getItem('demoWalletTransactionsAll') || '{}');
        let currentBalance = savedBalances[marketId] || 0;
        
        if (!savedTransactions[marketId]) savedTransactions[marketId] = [];
        
        if (type === "BUY") {
            if (currentBalance < amount) return false;
            currentBalance -= amount;
        } else if (type === "SELL") {
            currentBalance += amount;
        }
        
        savedBalances[marketId] = currentBalance;
        savedTransactions[marketId].unshift({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            date: new Date().toLocaleString(),
            type: type === 'BUY' ? 'trade_buy' : 'trade_sell',
            amount: amount,
            balanceAfter: currentBalance,
            currency: MARKETS.find(m => m.id === marketId)?.currency || 'USD',
            description: `${type} ${ticker}`
        });
        
        localStorage.setItem('demoWalletBalances', JSON.stringify(savedBalances));
        localStorage.setItem('demoWalletTransactionsAll', JSON.stringify(savedTransactions));
        window.dispatchEvent(new Event('walletChange'));
        return true;
    };

    const handleAddStock = (e) => {
        e.preventDefault();
        if (!ticker || !buyPrice || !quantity) {
            setAddError("Please fill all fields");
            return;
        }

        let formattedTicker = ticker.toUpperCase().trim();

        // Auto-format ticker based on market
        if (market === 'IN' && !formattedTicker.endsWith('.NSE') && !formattedTicker.endsWith('.BSE')) {
            formattedTicker += '.NSE';
        } else if (market === 'CRYPTO' && !formattedTicker.endsWith('-USD')) {
            formattedTicker += '-USD';
        } else if (market === 'FOREX' && !formattedTicker.endsWith('=X')) {
            formattedTicker += '=X';
        } else if (market === 'COMMODITIES') {
            const alias = { 'GOLD': 'GC=F', 'SILVER': 'SI=F', 'OIL': 'CL=F', 'CRUDE OIL': 'CL=F', 'NATURAL GAS': 'NG=F', 'COPPER': 'HG=F', 'CORN': 'ZC=F', 'WHEAT': 'ZW=F', 'SOYBEAN': 'ZS=F' };
            if (alias[formattedTicker]) formattedTicker = alias[formattedTicker];
            else if (!formattedTicker.endsWith('=F') && !formattedTicker.includes('.')) formattedTicker += '=F';
        }

        const selectedMarketObj = MARKETS.find(m => m.id === market);
        const marketStatus = getMarketStatus(market);

        const newStock = {
            id: Date.now(),
            orderId: `ORD-${Date.now()}`, // Generate Order ID
            ticker: formattedTicker,
            buyPrice: parseFloat(buyPrice),
            quantity: parseFloat(quantity),
            targetPrice: targetPrice ? parseFloat(targetPrice) : null,
            stopLoss: stopLoss ? parseFloat(stopLoss) : null,
            market: market,
            currency: selectedMarketObj.currency,
            currency: selectedMarketObj.currency,
            currentPrice: null, // Will be fetched
            name: stockDetails?.name || formattedTicker,
        };

        if (orderType === 'SELL') {
            const existingStockIndex = portfolio.findIndex(s => s.ticker === formattedTicker && s.market === market);
            if (existingStockIndex === -1) {
                setAddError(`You do not hold any shares of ${formattedTicker} in this market!`);
                return;
            }
            const existingStock = portfolio[existingStockIndex];
            const qtyToSell = parseFloat(quantity);
            if (qtyToSell > existingStock.quantity) {
                setAddError(`You only own ${existingStock.quantity} shares of ${formattedTicker}!`);
                return;
            }
            
            const sellExecPrice = parseFloat(buyPrice);
            const totalSellValue = sellExecPrice * qtyToSell;

            if (marketStatus.isOpen) {
                const updatedPortfolio = [...portfolio];
                if (qtyToSell === existingStock.quantity) {
                    updatedPortfolio.splice(existingStockIndex, 1);
                } else {
                    updatedPortfolio[existingStockIndex] = { ...existingStock, quantity: existingStock.quantity - qtyToSell };
                }
                setPortfolio(updatedPortfolio);
                
                recordTransaction('SELL', existingStock, sellExecPrice, qtyToSell, totalSellValue, `ORD-${Date.now()}`);
                handleWalletDeduction(market, totalSellValue, formattedTicker, "SELL", `ORD-${Date.now()}`);
                toast.success(`Successfully sold ${qtyToSell} shares of ${formattedTicker}!`);
            } else {
                setAddError('Cannot quick-sell while the market is closed. Please wait for market open.');
                return;
            }
            
            setTicker(''); setBuyPrice(''); setQuantity(''); setStockDetails(null); setAddError(null);
            return;
        }

        const totalOrderValue = newStock.buyPrice * newStock.quantity;
        const hasFunds = handleWalletDeduction(newStock.market, totalOrderValue, newStock.ticker, "BUY", newStock.orderId);
        
        if (!hasFunds) {
            setAddError(`Insufficient Demo Wallet balance for ${selectedMarketObj.name}! Needed: ${currentMarketCurrency}${totalOrderValue.toFixed(2)}.`);
            return;
        }

        if (marketStatus.isOpen) {
            // Market Open - Add to Portfolio
            setPortfolio([...portfolio, newStock]);

            // Record Transaction
            recordTransaction('BUY', newStock, newStock.buyPrice, newStock.quantity, newStock.buyPrice * newStock.quantity, newStock.orderId);

            // Fetch price immediately for the new stock
            setTimeout(() => fetchPrices(true), 500);
        } else {
            // Market Closed - Add to Pending Orders
            setPendingOrders([...pendingOrders, newStock]);

            // Show Custom Modal instead of Alert
            setPendingModalData({
                ticker: formattedTicker,
                market: selectedMarketObj.name
            });
            setIsPendingModalOpen(true);
        }

        setTicker('');
        setBuyPrice('');
        setQuantity('');
        setTargetPrice('');
        setStopLoss('');
        setStockDetails(null); // Reset details
        setAddError(null);
    };

    const removeStock = (id) => {
        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex flex-col ring-1 ring-black ring-opacity-5 overflow-hidden border border-red-100 transform transition-all`}>
                <div className="p-5">
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="bg-red-100 p-2 rounded-full">
                            <Trash2 className="w-5 h-5 text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Remove Asset?</h3>
                    </div>
                    <p className="text-sm text-gray-600">Are you sure you want to completely drop this tracker from your portfolio history?</p>
                </div>
                <div className="bg-gray-50 px-5 py-3 flex space-x-3 justify-end border-t border-gray-100">
                    <button onClick={() => toast.dismiss(t.id)} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                    <button onClick={() => { 
                        toast.dismiss(t.id); 
                        setPortfolio(prevPortfolio => prevPortfolio.filter(stock => stock.id !== id)); 
                    }} className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm shadow-red-600/20">Remove Tracker</button>
                </div>
            </div>
        ), { duration: Infinity, position: 'top-center' });
    };

    // Sell Logic
    const openSellModal = (stock) => {
        setSellStock(stock);
        setSellQuantity('');
        setSellError(null);
        setIsSellModalOpen(true);
    };

    const handleSellConfirm = (e) => {
        e.preventDefault();
        if (!sellStock || !sellQuantity) return;

        const qtyToSell = parseFloat(sellQuantity);
        if (qtyToSell <= 0) {
            setSellError("Quantity must be greater than 0");
            return;
        }
        if (qtyToSell > sellStock.quantity) {
            setSellError("You cannot sell more than you own");
            return;
        }

        const updatedPortfolio = portfolio.map(stock => {
            if (stock.id === sellStock.id) {
                return { ...stock, quantity: stock.quantity - qtyToSell };
            }
            return stock;
        }).filter(stock => stock.quantity > 0); // Remove if quantity becomes 0

        setPortfolio(updatedPortfolio);

        // Record Transaction
        const sellPrice = sellStock.currentPrice || sellStock.buyPrice; // Fallback if current price is missing
        recordTransaction('SELL', sellStock, sellPrice, qtyToSell, sellPrice * qtyToSell, sellStock.orderId);
        handleWalletDeduction(sellStock.market, sellPrice * qtyToSell, sellStock.ticker, "SELL", sellStock.orderId);

        setIsSellModalOpen(false);
        setSellStock(null);
        setSellQuantity('');
    };

    const downloadPDF = async () => {
        const doc = new jsPDF();
        
        // Add interactive logo
        const pageWidth = doc.internal.pageSize.getWidth();
        const logoDataUrl = await getLogoDataUrl();
        addInteractiveLogoToPage(doc, pageWidth, logoDataUrl);

        const marketName = MARKETS.find(m => m.id === selectedMarket)?.name || selectedMarket;
        const currency = MARKETS.find(m => m.id === selectedMarket)?.currency || 'USD';

        // Title
        doc.setFontSize(22);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(30, 58, 138); // Text-blue-900
        doc.text(`${marketName} Portfolio Report`, 14, 32);

        // Divider Line
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

        // Summary Box
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(14, 56, 100, 24, 3, 3, 'FD');
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`Total Value: ${formatCurrency(totalValue, currency)}`, 20, 65);
        
        const isProfit = totalPL >= 0;
        doc.setTextColor(isProfit ? 22 : 220, isProfit ? 163 : 38, isProfit ? 74 : 38);
        doc.text(`Total P/L: ${isProfit ? '+' : ''}${formatCurrency(totalPL, currency)}`, 20, 74);

        // Table
        const filteredPortfolio = portfolio.filter(stock => stock.market === selectedMarket);

        const tableData = filteredPortfolio.map(stock => {
            const currentVal = stock.currentPrice ? stock.currentPrice * stock.quantity : 0;
            const costVal = stock.buyPrice * stock.quantity;
            const pl = currentVal - costVal;

            return [
                stock.orderId || '-',
                stock.ticker,
                formatCurrency(stock.buyPrice, stock.currency),
                stock.currentPrice ? formatCurrency(stock.currentPrice, stock.currency) : '-',
                stock.quantity.toString(),
                stock.currentPrice ? formatCurrency(currentVal, stock.currency) : '-',
                stock.currentPrice ? `${pl >= 0 ? '+' : ''}${formatCurrency(pl, stock.currency)}` : '-'
            ];
        });

        autoTable(doc, {
            startY: 86,
            head: [['Order ID', 'Ticker', 'Buy Price', 'Current Price', 'Qty', 'Value', 'P/L']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
            bodyStyles: { textColor: 50 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
        });

        doc.save(`${marketName}_Portfolio.pdf`);
    };

    const currentMarketCurrency = MARKETS.find(m => m.id === selectedMarket)?.currency || 'USD';
    const filteredPortfolio = portfolio.filter(stock => stock.market === selectedMarket);

    const getRecommendationColor = (rec) => {
        if (!rec) return 'bg-gray-100 text-gray-600';
        const r = rec.toLowerCase();
        if (r.includes('buy')) return 'bg-green-100 text-green-700 border-green-200';
        if (r.includes('sell') || r.includes('underperform')) return 'bg-red-100 text-red-700 border-red-200';
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    };

    return (
        <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-20">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28">
                    {/* Header Section */}
                    <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">My Portfolio</h1>
                        <p className="text-gray-500 mt-1">Track your investments and analyze performance.</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center space-x-4">
                        <button
                            onClick={() => fetchPrices(false)}
                            disabled={loading}
                            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-all shadow-sm"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            <span>{loading ? 'Updating...' : 'Refresh Prices'}</span>
                        </button>

                        {hasPremiumAccess ? (
                            <button
                                onClick={downloadPDF}
                                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                            >
                                <Download className="w-4 h-4" />
                                <span>Download Report</span>
                            </button>
                        ) : (
                            <button
                                disabled
                                className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-400 rounded-lg cursor-not-allowed group relative"
                            >
                                <Download className="w-4 h-4" />
                                <span>Download Report</span>
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-max bg-gray-900 text-white text-xs py-1 px-2 rounded">
                                    Subscription required
                                </div>
                            </button>
                        )}
                    </div>
                </div>

                {/* Market Selector Tabs */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-8 w-full max-w-full overflow-x-auto hide-scrollbar">
                    {MARKETS.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => setSelectedMarket(m.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedMarket === m.id
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {m.name}
                        </button>
                    ))}
                </div>

                {/* Portfolio Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl shadow-blue-500/5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <DollarSign className="w-6 h-6 text-blue-600" />
                            </div>
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Value ({currentMarketCurrency})</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalValue, currentMarketCurrency)}</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl shadow-green-500/5">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl ${totalPL >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                                {totalPL >= 0 ?
                                    <TrendingUp className={`w-6 h-6 ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`} /> :
                                    <TrendingDown className={`w-6 h-6 ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                                }
                            </div>
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Profit/Loss</span>
                        </div>
                        <p className={`text-3xl font-bold ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {totalPL >= 0 ? '+' : ''}{formatCurrency(totalPL, currentMarketCurrency)}
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl shadow-purple-500/5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-purple-50 rounded-xl">
                                <PieChart className="w-6 h-6 text-purple-600" />
                            </div>
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Holdings</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{filteredPortfolio.length} <span className="text-lg text-gray-400 font-normal">
                            {selectedMarket === 'CRYPTO' ? 'Coins' : selectedMarket === 'FOREX' ? 'Pairs' : 'Stocks'}
                        </span></p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Add Stock Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/50 sticky top-24">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Buy / Add Stock</h3>
                            <form onSubmit={handleAddStock} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Market</label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setIsMarketDropdownOpen(!isMarketDropdownOpen)}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white flex items-center justify-between"
                                        >
                                            <span className="flex items-center">
                                                <span className="mr-2 text-xl">{MARKETS.find(m => m.id === market)?.flag}</span>
                                                {MARKETS.find(m => m.id === market)?.name}
                                            </span>
                                            <ChevronDown className="w-4 h-4 text-gray-500" />
                                        </button>

                                        {isMarketDropdownOpen && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                                                {MARKETS.map(m => (
                                                    <button
                                                        key={m.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setMarket(m.id);
                                                            setIsMarketDropdownOpen(false);
                                                        }}
                                                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center transition-colors"
                                                    >
                                                        <span className="mr-2 text-xl">{m.flag}</span>
                                                        <span>{m.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ticker Symbol</label>
                                    <input
                                        type="text"
                                        value={ticker}
                                        onChange={(e) => setTicker(e.target.value)}
                                        onBlur={handleTickerBlur}
                                        placeholder="e.g. AAPL"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    />
                                    {isFetchingDetails && (
                                        <p className="text-xs text-blue-500 mt-1 animate-pulse">Checking analysts...</p>
                                    )}
                                    {stockDetails && (
                                        <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500">Recommendation:</span>
                                                <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${getRecommendationColor(stockDetails.recommendation)}`}>
                                                    {(stockDetails.recommendation || 'Unknown').replace('_', ' ').toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500">Analyst Target:</span>
                                                <span className="font-medium text-gray-900">
                                                    {stockDetails.targetMeanPrice ? formatCurrency(stockDetails.targetMeanPrice, stockDetails.currency) : 'N/A'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500">Current Price:</span>
                                                <span className="font-medium text-gray-900">
                                                    {stockDetails.currentPrice ? formatCurrency(stockDetails.currentPrice, stockDetails.currency) : 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Buy Price</label>
                                        <input
                                            type="number"
                                            value={buyPrice}
                                            onChange={(e) => setBuyPrice(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            placeholder="0"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                            <Target className="w-3 h-3 mr-1 text-green-600" /> Target
                                        </label>
                                        <input
                                            type="number"
                                            value={targetPrice}
                                            onChange={(e) => setTargetPrice(e.target.value)}
                                            placeholder="Optional"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                            <AlertOctagon className="w-3 h-3 mr-1 text-red-600" /> Stop Loss
                                        </label>
                                        <input
                                            type="number"
                                            value={stopLoss}
                                            onChange={(e) => setStopLoss(e.target.value)}
                                            placeholder="Optional"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {addError && (
                                    <p className="text-red-500 text-sm">{addError}</p>
                                )}

                                <button
                                    type="submit"
                                    className={`w-full py-3 text-white rounded-xl font-medium transition-all flex items-center justify-center space-x-2 ${
                                        orderType === 'BUY' 
                                        ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20' 
                                        : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20'
                                    }`}
                                >
                                    {orderType === 'BUY' ? (
                                        <>
                                            <Plus className="w-5 h-5" />
                                            <span>Buy / Add Asset</span>
                                        </>
                                    ) : (
                                        <>
                                            <Minus className="w-5 h-5" />
                                            <span>Execute Sell Order</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Stock List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/50 overflow-hidden">
                            <div className="">
                                <table className="w-full">
                                    <thead className="bg-gray-50/50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-3 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticker</th>
                                            <th className="px-3 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                                            <th className="px-3 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg. Cost</th>
                                            <th className="px-3 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Holdings</th>
                                            <th className="px-3 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">P/L</th>
                                            <th className="px-3 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredPortfolio.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                                    No stocks in your {MARKETS.find(m => m.id === selectedMarket)?.name} portfolio yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredPortfolio.map((stock) => {
                                                const currentVal = stock.currentPrice ? stock.currentPrice * stock.quantity : 0;
                                                const costVal = stock.buyPrice * stock.quantity;
                                                const pl = currentVal - costVal;
                                                const plPercent = costVal > 0 ? (pl / costVal) * 100 : 0;

                                                return (
                                                    <tr key={stock.id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-3 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs mr-3">
                                                                    {stock.ticker.substring(0, 2)}
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold text-gray-900">{stock.name || stock.ticker}</div>
                                                                    <div className="text-xs text-gray-500">{stock.ticker}</div>
                                                                    <div className="flex space-x-2 text-[10px] text-gray-400 mt-0.5">
                                                                        {stock.targetPrice && (
                                                                            <span className="flex items-center text-green-600 bg-green-50 px-1 rounded">
                                                                                <Target className="w-3 h-3 mr-0.5" /> {stock.targetPrice}
                                                                            </span>
                                                                        )}
                                                                        {stock.stopLoss && (
                                                                            <span className="flex items-center text-red-600 bg-red-50 px-1 rounded">
                                                                                <AlertOctagon className="w-3 h-3 mr-0.5" /> {stock.stopLoss}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-4 whitespace-nowrap text-right">
                                                            <div
                                                                key={stock.blinkKey}
                                                                className={`text-sm font-medium text-gray-900 transition-colors duration-500
                                                                    ${stock.blink === 'green' ? 'blink-text-green' : ''}
                                                                    ${stock.blink === 'red' ? 'blink-text-red' : ''}
                                                                `}
                                                            >
                                                                {stock.currentPrice ? formatCurrency(stock.currentPrice, stock.currency) : '-'}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-4 whitespace-nowrap text-right">
                                                            <div className="text-sm text-gray-600">
                                                                {formatCurrency(stock.buyPrice, stock.currency)}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-4 whitespace-nowrap text-right">
                                                            <div className="text-sm font-medium text-gray-900">{stock.quantity}</div>
                                                            <div className="text-xs text-gray-400">
                                                                {stock.currentPrice ? formatCurrency(currentVal, stock.currency) : '-'}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-4 whitespace-nowrap text-right">
                                                            {stock.currentPrice ? (
                                                                <div>
                                                                    <div className={`text-sm font-bold ${pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                        {pl >= 0 ? '+' : ''}{formatCurrency(pl, stock.currency)}
                                                                    </div>
                                                                    <div className={`text-xs ${pl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                                        {pl >= 0 ? '+' : ''}{plPercent.toFixed(2)}%
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-400">-</span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-4 whitespace-nowrap text-center">
                                                            <div className="flex items-center justify-center space-x-2">
                                                                <button
                                                                    onClick={() => openSellModal(stock)}
                                                                    className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                                                                    title="Sell Stock"
                                                                >
                                                                    <Minus className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => removeStock(stock.id)}
                                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                                    title="Remove from Portfolio"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pending Orders Section */}
                        {pendingOrders.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                    <Clock className="w-5 h-5 mr-2 text-orange-500" />
                                    Pending Orders (Market Closed)
                                </h3>
                                <div className="bg-white rounded-2xl border border-orange-100 shadow-lg shadow-orange-500/5 overflow-hidden">
                                    <div className="">
                                        <table className="w-full">
                                            <thead className="bg-orange-50/50 border-b border-orange-100">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticker</th>
                                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Est. Price</th>
                                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
                                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Market</th>
                                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {pendingOrders.map((order) => (
                                                    <tr key={order.id} className="hover:bg-orange-50/30 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs mr-3">
                                                                    {order.ticker.substring(0, 2)}
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold text-gray-900">{order.name || order.ticker}</div>
                                                                    <div className="text-xs text-gray-500">{order.ticker}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-4 whitespace-nowrap text-right">
                                                            <div className="text-sm text-gray-600">
                                                                {formatCurrency(order.buyPrice, order.currency)}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-4 whitespace-nowrap text-right">
                                                            <div className="text-sm font-medium text-gray-900">{order.quantity}</div>
                                                        </td>
                                                        <td className="px-3 py-4 whitespace-nowrap text-right">
                                                            <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                                                                {MARKETS.find(m => m.id === order.market)?.name}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-4 whitespace-nowrap text-center">
                                                            <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-full">
                                                                Pending Open
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sell Modal */}
            {isSellModalOpen && sellStock && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Sell {sellStock.ticker}</h3>
                        <p className="text-gray-500 mb-6">How many shares would you like to sell?</p>

                        <div className="bg-gray-50 p-4 rounded-xl mb-6 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Available Quantity:</span>
                                <span className="font-medium text-gray-900">{sellStock.quantity}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Current Price:</span>
                                <span className="font-medium text-gray-900">
                                    {sellStock.currentPrice ? formatCurrency(sellStock.currentPrice, sellStock.currency) : 'N/A'}
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleSellConfirm} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Sell</label>
                                <input
                                    type="number"
                                    value={sellQuantity}
                                    onChange={(e) => setSellQuantity(e.target.value)}
                                    placeholder="0"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    autoFocus
                                />
                            </div>

                            {sellError && (
                                <p className="text-red-500 text-sm">{sellError}</p>
                            )}

                            <div className="flex space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsSellModalOpen(false)}
                                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-lg shadow-red-600/20 transition-colors"
                                >
                                    Confirm Sell
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Pending Order Modal */}
            {isPendingModalOpen && pendingModalData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 transform transition-all scale-100 text-center relative overflow-hidden">
                        {/* Decorative Background */}
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-orange-100 to-amber-50 rounded-b-[50%] -mt-12 z-0"></div>

                        <div className="relative z-10">
                            <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
                                <Clock className="w-8 h-8 text-orange-500" />
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-2">Market is Closed</h3>
                            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                                Order for <span className="font-bold text-gray-900">{pendingModalData.ticker}</span> has been placed in <span className="text-orange-600 font-medium">Pending Orders</span>.
                                <br />It will execute automatically when the <span className="font-medium text-gray-700">{pendingModalData.market}</span> opens.
                            </p>

                            <button
                                onClick={() => setIsPendingModalOpen(false)}
                                className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 transition-all transform hover:scale-[1.02]"
                            >
                                Okay, Got it!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Execution Success Modal */}
            {isExecutionModalOpen && executedOrders.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 transform transition-all scale-100 text-center relative overflow-hidden">
                        {/* Decorative Background */}
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-green-100 to-emerald-50 rounded-b-[50%] -mt-12 z-0"></div>

                        <div className="relative z-10">
                            <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
                                <TrendingUp className="w-8 h-8 text-green-500" />
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-2">Orders Executed!</h3>
                            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                                <span className="font-bold text-gray-900">{executedOrders.length}</span> pending order{executedOrders.length > 1 ? 's' : ''} executed successfully as the market opened.
                            </p>

                            <div className="bg-gray-50 rounded-xl p-3 mb-6 max-h-32 overflow-y-auto text-left">
                                {executedOrders.map((order, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-gray-100 last:border-0">
                                        <span className="font-bold text-gray-700">{order.ticker}</span>
                                        <span className="text-green-600">{formatCurrency(order.buyPrice, order.currency)}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => setIsExecutionModalOpen(false)}
                                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all transform hover:scale-[1.02]"
                            >
                                Awesome!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
