import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import NameModal from './NameModal';
import { toast } from 'react-hot-toast';
import { getLogoDataUrl, addInteractiveLogoToPage } from '../utils/pdfHelper';

// Helper: Calculate RSI
const calculateRSI = (prices, period = 14) => {
    if (!prices || prices.length < period + 1) return [];
    let gains = 0, losses = 0;
    for (let i = 1; i <= period; i++) {
        const diff = prices[i] - prices[i - 1];
        if (diff >= 0) gains += diff;
        else losses -= diff;
    }
    let avgGain = gains / period;
    let avgLoss = losses / period;
    const rsi = [100 - (100 / (1 + avgGain / avgLoss))];

    for (let i = period + 1; i < prices.length; i++) {
        const diff = prices[i] - prices[i - 1];
        const gain = diff >= 0 ? diff : 0;
        const loss = diff < 0 ? -diff : 0;
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
        rsi.push(100 - (100 / (1 + avgGain / avgLoss)));
    }
    return rsi;
};

// Helper: Calculate SMA
const calculateSMA = (prices, period) => {
    if (!prices || prices.length < period) return [];
    const sma = [];
    for (let i = period - 1; i < prices.length; i++) {
        const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        sma.push(sum / period);
    }
    return sma;
};

// Helper: Convert URL to Data URI
const getDataUrl = (url) => {
    return new Promise((resolve, reject) => {
        if (!url) {
            resolve(null);
            return;
        }
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = url;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(null);
    });
};

export default function DownloadButton({ stockData, predictions }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleDownloadClick = () => {
        setIsModalOpen(true);
    };

    const generatePDF = async (userName) => {
        setIsModalOpen(false);

        try {
            const JsPDF = jsPDF.jsPDF || jsPDF;
            const doc = new JsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const currency = stockData?.info?.currency || 'USD';
            let finalY = 30;

            // Fetch Logo
            const logoUrl = stockData?.info?.logo_url;
            const logoData = await getDataUrl(logoUrl);

            // Fetch App Logo
            const appLogoDataUrl = await getLogoDataUrl();

            // Helper to add new page
            const checkPageBreak = (heightNeeded) => {
                if (finalY + heightNeeded > pageHeight - 20) {
                    doc.addPage();
                    finalY = 40;
                    // Add Header Logo on new pages
                    if (logoData) {
                        doc.addImage(logoData, 'PNG', pageWidth - 25, 10, 15, 15);
                    }
                    addInteractiveLogoToPage(doc, pageWidth, appLogoDataUrl);
                    return true;
                }
                return false;
            };

            // Helper to draw section header
            const addSectionHeader = (title) => {
                checkPageBreak(30);
                doc.setFillColor(240, 240, 240);
                doc.rect(14, finalY, pageWidth - 28, 10, 'F');
                doc.setFontSize(14);
                doc.setTextColor(0, 0, 0);
                doc.setFont(undefined, 'bold');
                doc.text(title, 16, finalY + 7);
                doc.setFont(undefined, 'normal');
                finalY += 20;
            };

            // --- PAGE 1: COVER PAGE ---
            doc.setFillColor(37, 99, 235); // Blue 600
            doc.rect(0, 0, pageWidth, pageHeight, 'F');

            // Logo on Cover
            if (logoData) {
                doc.setFillColor(255, 255, 255);
                doc.circle(pageWidth / 2, pageHeight / 4, 30, 'F');
                doc.addImage(logoData, 'PNG', pageWidth / 2 - 20, pageHeight / 4 - 20, 40, 40);
            }
            addInteractiveLogoToPage(doc, pageWidth, appLogoDataUrl);

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(40);
            doc.text("TradeMind AI", pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });

            doc.setFontSize(24);
            doc.text("Comprehensive Stock Analysis Report", pageWidth / 2, pageHeight / 2 + 10, { align: 'center' });

            doc.setFontSize(16);
            doc.text(`Target Asset: ${stockData?.info?.name || 'Unknown'} (${stockData?.ticker})`, pageWidth / 2, pageHeight / 2 + 30, { align: 'center' });

            let userId = 'N/A';
            const savedProfile = localStorage.getItem('userProfile');
            if (savedProfile) {
                const profile = JSON.parse(savedProfile);
                if (profile.userId) userId = profile.userId;
            }

            doc.setFontSize(14);
            doc.text(`Prepared for: ${userName} (ID: ${userId})`, pageWidth / 2, pageHeight - 40, { align: 'center' });
            doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 30, { align: 'center' });

            doc.addPage();
            finalY = 40;
            if (logoData) doc.addImage(logoData, 'PNG', pageWidth - 25, 10, 15, 15);
            addInteractiveLogoToPage(doc, pageWidth, appLogoDataUrl);

            // --- PAGE 2: EXECUTIVE SUMMARY & PROFILE ---
            doc.setFontSize(22);
            doc.setTextColor(37, 99, 235);
            doc.text("Executive Summary", 14, finalY);
            finalY += 15;

            doc.setFontSize(11);
            doc.setTextColor(60, 60, 60);
            const summaryText = `This report provides a deep-dive analysis of ${stockData?.info?.name}. It combines fundamental financial metrics with advanced technical analysis and AI-driven price predictions. Our models (Linear Regression, LSTM, and Logistic Regression) have analyzed historical price action to forecast future trends.`;
            doc.text(doc.splitTextToSize(summaryText, pageWidth - 28), 14, finalY);
            finalY += 30;

            addSectionHeader("Company Profile");

            const profileData = [
                ['Sector', stockData?.info?.sector || 'N/A'],
                ['Industry', stockData?.info?.industry || 'N/A'],
                ['Employees', stockData?.info?.fullTimeEmployees?.toLocaleString() || 'N/A'],
                ['Website', stockData?.info?.website || 'N/A'],
                ['Headquarters', `${stockData?.info?.city || ''}, ${stockData?.info?.country || ''}`],
            ];

            autoTable(doc, {
                startY: finalY,
                body: profileData,
                theme: 'plain',
                styles: { fontSize: 10, cellPadding: 2 },
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
            });
            finalY = doc.lastAutoTable.finalY + 10;

            doc.setFont(undefined, 'bold');
            doc.text("Business Summary:", 14, finalY);
            finalY += 7;
            doc.setFont(undefined, 'normal');
            doc.setFontSize(9);
            const businessSummary = stockData?.info?.longBusinessSummary || "No summary available.";
            const splitSummary = doc.splitTextToSize(businessSummary, pageWidth - 28);
            doc.text(splitSummary, 14, finalY);
            finalY += splitSummary.length * 4 + 10;

            // --- PAGE 3: FUNDAMENTAL ANALYSIS ---
            doc.addPage();
            finalY = 40;
            if (logoData) doc.addImage(logoData, 'PNG', pageWidth - 25, 10, 15, 15);
            addInteractiveLogoToPage(doc, pageWidth, appLogoDataUrl);

            doc.setFontSize(22);
            doc.setTextColor(37, 99, 235);
            doc.text("Fundamental Analysis", 14, finalY);
            finalY += 15;

            const formatNumber = (num) => {
                if (!num) return 'N/A';
                if (num >= 1.0e+12) return (num / 1.0e+12).toFixed(2) + "T";
                if (num >= 1.0e+9) return (num / 1.0e+9).toFixed(2) + "B";
                if (num >= 1.0e+6) return (num / 1.0e+6).toFixed(2) + "M";
                return num.toLocaleString();
            };

            const fundamentals = [
                ['Market Cap', formatNumber(stockData?.info?.marketCap)],
                ['Enterprise Value', formatNumber(stockData?.info?.enterpriseValue)],
                ['Trailing P/E', stockData?.info?.peRatio?.toFixed(2) || 'N/A'],
                ['Forward P/E', stockData?.info?.forwardPE?.toFixed(2) || 'N/A'],
                ['PEG Ratio', stockData?.info?.pegRatio?.toFixed(2) || 'N/A'],
                ['Price/Sales', stockData?.info?.priceToSalesTrailing12Months?.toFixed(2) || 'N/A'],
                ['Price/Book', stockData?.info?.priceToBook?.toFixed(2) || 'N/A'],
                ['EPS (TTM)', stockData?.info?.eps?.toFixed(2) || 'N/A'],
                ['Revenue Growth', stockData?.info?.revenueGrowth ? (stockData.info.revenueGrowth * 100).toFixed(2) + '%' : 'N/A'],
                ['Profit Margin', stockData?.info?.profitMargins ? (stockData.info.profitMargins * 100).toFixed(2) + '%' : 'N/A'],
                ['Return on Equity', stockData?.info?.returnOnEquity ? (stockData.info.returnOnEquity * 100).toFixed(2) + '%' : 'N/A'],
                ['Total Cash', formatNumber(stockData?.info?.totalCash)],
                ['Total Debt', formatNumber(stockData?.info?.totalDebt)],
                ['Debt/Equity', stockData?.info?.debtToEquity?.toFixed(2) || 'N/A'],
            ];

            autoTable(doc, {
                startY: finalY,
                head: [['Metric', 'Value']],
                body: fundamentals,
                theme: 'grid',
                headStyles: { fillColor: [37, 99, 235] },
            });
            finalY = doc.lastAutoTable.finalY + 20;

            // --- PAGE 4: TECHNICAL ANALYSIS (RSI & SMA) ---
            doc.addPage();
            finalY = 40;
            if (logoData) doc.addImage(logoData, 'PNG', pageWidth - 25, 10, 15, 15);
            addInteractiveLogoToPage(doc, pageWidth, appLogoDataUrl);

            doc.setFontSize(22);
            doc.setTextColor(37, 99, 235);
            doc.text("Technical Analysis", 14, finalY);
            finalY += 15;

            // Calculate Indicators
            const closePrices = (stockData?.history || []).map(d => d.Close);
            const rsiData = calculateRSI(closePrices);
            const currentRSI = rsiData.length > 0 ? rsiData[rsiData.length - 1] : 50;

            addSectionHeader("Relative Strength Index (RSI)");
            doc.setFontSize(10);
            doc.text(`Current RSI (14): ${currentRSI?.toFixed(2)}`, 14, finalY);
            finalY += 7;

            let rsiSignal = "Neutral";
            if (currentRSI > 70) rsiSignal = "Overbought (Potential Sell)";
            else if (currentRSI < 30) rsiSignal = "Oversold (Potential Buy)";

            doc.text(`Signal: ${rsiSignal}`, 14, finalY);
            finalY += 10;

            // Draw RSI Chart (Simple Line)
            const chartH = 40;
            const chartW = pageWidth - 28;
            doc.setDrawColor(200);
            doc.rect(14, finalY, chartW, chartH); // Frame

            // 70/30 Lines
            doc.setDrawColor(255, 0, 0); // Red 70
            doc.setLineWidth(0.2);
            const y70 = finalY + chartH - (chartH * 0.7);
            doc.line(14, y70, 14 + chartW, y70);

            doc.setDrawColor(0, 255, 0); // Green 30
            const y30 = finalY + chartH - (chartH * 0.3);
            doc.line(14, y30, 14 + chartW, y30);

            // Plot RSI
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.5);
            const recentRSI = rsiData.slice(-50); // Last 50 points
            if (recentRSI.length > 1) {
                const stepX = chartW / (recentRSI.length - 1);
                for (let i = 0; i < recentRSI.length - 1; i++) {
                    const y1 = finalY + chartH - (chartH * (recentRSI[i] / 100));
                    const y2 = finalY + chartH - (chartH * (recentRSI[i + 1] / 100));
                    doc.line(14 + (i * stepX), y1, 14 + ((i + 1) * stepX), y2);
                }
            }
            finalY += chartH + 15;

            // SMA Analysis
            addSectionHeader("Moving Averages (SMA)");
            const sma20 = calculateSMA(closePrices, 20);
            const sma50 = calculateSMA(closePrices, 50);
            const currentSMA20 = sma20.length > 0 ? sma20[sma20.length - 1] : 0;
            const currentSMA50 = sma50.length > 0 ? sma50[sma50.length - 1] : 0;
            const currentPrice = stockData?.info?.currentPrice || 0;

            const smaData = [
                ['SMA 20', currentSMA20?.toFixed(2), currentPrice > currentSMA20 ? 'Bullish' : 'Bearish'],
                ['SMA 50', currentSMA50?.toFixed(2), currentPrice > currentSMA50 ? 'Bullish' : 'Bearish'],
            ];

            autoTable(doc, {
                startY: finalY,
                head: [['Indicator', 'Value', 'Signal']],
                body: smaData,
                theme: 'striped',
            });
            finalY = doc.lastAutoTable.finalY + 20;


            // --- PAGE 5-7: AI Model Deep Dive ---
            doc.addPage();
            finalY = 40;
            if (logoData) doc.addImage(logoData, 'PNG', pageWidth - 25, 10, 15, 15);
            addInteractiveLogoToPage(doc, pageWidth, appLogoDataUrl);

            doc.setFontSize(22);
            doc.setTextColor(37, 99, 235);
            doc.text("AI Model Deep Dive", 14, finalY);
            finalY += 15;

            // 1. Linear Regression
            addSectionHeader("1. Linear Regression Model");
            doc.setFontSize(10);
            doc.text("Linear Regression fits a linear equation to observed data. It assumes a linear relationship between the dependent variable (Price) and the independent variable (Time).", 14, finalY, { maxWidth: pageWidth - 28 });
            finalY += 10;

            // Step-by-Step Analysis
            doc.setFont(undefined, 'bold');
            doc.text("Step-by-Step Execution:", 14, finalY);
            doc.setFont(undefined, 'normal');
            finalY += 7;

            const lrSteps = [
                "1. Data Collection: Historical closing prices are fetched.",
                "2. Preprocessing: Dates are converted to ordinal numbers (numerical format).",
                "3. Training: The model calculates the slope (m) and intercept (c) to minimize error.",
                "4. Prediction: Future dates are input into y = mx + c to forecast price."
            ];
            lrSteps.forEach(step => {
                doc.text(step, 20, finalY);
                finalY += 6;
            });
            finalY += 5;

            doc.setFont(undefined, 'bold');
            doc.text(`Prediction: ${formatCurrency(predictions?.linear_regression_prediction, currency)}`, 14, finalY);
            doc.setFont(undefined, 'normal');
            finalY += 10;

            // Graph: Linear Regression
            doc.setDrawColor(0);
            doc.rect(14, finalY, 100, 60);
            // Scatter points
            doc.setFillColor(100);
            for (let i = 0; i < 10; i++) {
                doc.circle(20 + i * 8, finalY + 50 - i * 3 + Math.random() * 10 - 5, 1, 'F');
            }
            // Line
            doc.setDrawColor(37, 99, 235);
            doc.setLineWidth(1);
            doc.line(20, finalY + 50, 100, finalY + 20);
            finalY += 70;

            // 2. LSTM
            checkPageBreak(100);
            addSectionHeader("2. LSTM (Long Short-Term Memory)");
            doc.text("LSTM is a specialized Recurrent Neural Network (RNN) designed to recognize patterns in sequences of data, such as time-series stock prices.", 14, finalY, { maxWidth: pageWidth - 28 });
            finalY += 10;

            // Step-by-Step Analysis
            doc.setFont(undefined, 'bold');
            doc.text("Step-by-Step Execution:", 14, finalY);
            doc.setFont(undefined, 'normal');
            finalY += 7;

            const lstmSteps = [
                "1. Data Normalization: Prices are scaled between 0 and 1 using MinMaxScaler.",
                "2. Windowing: Data is created with a look-back period (e.g., 60 days).",
                "3. Architecture: Input Layer -> LSTM Layers (Memory) -> Dense Layer (Output).",
                "4. Training: The network learns weights via Backpropagation through time.",
                "5. Prediction: The model predicts the next scaled value, which is then inverse-scaled."
            ];
            lstmSteps.forEach(step => {
                doc.text(step, 20, finalY);
                finalY += 6;
            });
            finalY += 5;

            doc.setFont(undefined, 'bold');
            doc.text(`Prediction: ${formatCurrency(predictions?.lstm_prediction, currency)}`, 14, finalY);
            doc.setFont(undefined, 'normal');
            finalY += 10;

            // Graph: LSTM Cell
            doc.setDrawColor(147, 51, 234);
            doc.rect(14, finalY, 100, 60);
            doc.rect(34, finalY + 15, 60, 30); // Cell
            doc.text("LSTM Cell", 50, finalY + 32);
            doc.line(14, finalY + 30, 34, finalY + 30); // In
            doc.line(94, finalY + 30, 114, finalY + 30); // Out
            finalY += 70;

            // 3. Logistic Regression
            checkPageBreak(100);
            addSectionHeader("3. Logistic Regression (Classification)");
            doc.text("Logistic Regression predicts the probability of a binary outcome (Bullish vs Bearish). It uses the Sigmoid function to map predictions between 0 and 1.", 14, finalY, { maxWidth: pageWidth - 28 });
            finalY += 10;

            // Step-by-Step Analysis
            doc.setFont(undefined, 'bold');
            doc.text("Step-by-Step Execution:", 14, finalY);
            doc.setFont(undefined, 'normal');
            finalY += 7;

            const logSteps = [
                "1. Target Creation: '1' if Price goes up tomorrow, '0' if down.",
                "2. Feature Engineering: Moving Averages, RSI, and Volume changes used as inputs.",
                "3. Training: The model learns the optimal weights for each feature.",
                "4. Probability Calculation: Z = w1*x1 + w2*x2 + ... + b.",
                "5. Activation: Probability = 1 / (1 + e^-Z). If > 0.5 -> Bullish."
            ];
            logSteps.forEach(step => {
                doc.text(step, 20, finalY);
                finalY += 6;
            });
            finalY += 5;

            // Graph: Sigmoid
            doc.setDrawColor(234, 88, 12);
            doc.rect(14, finalY, 100, 60);
            // S-Curve using lines
            doc.line(20, finalY + 50, 40, finalY + 50);
            doc.line(40, finalY + 50, 80, finalY + 10);
            doc.line(80, finalY + 10, 100, finalY + 10);
            finalY += 70;

            // --- PAGE 8+: HISTORICAL DATA APPENDIX ---
            doc.addPage();
            if (logoData) doc.addImage(logoData, 'PNG', pageWidth - 25, 10, 15, 15);
            addInteractiveLogoToPage(doc, pageWidth, appLogoDataUrl);
            doc.setFontSize(18);
            doc.text("Appendix: Historical Data", 14, 40);

            const fullHistory = (stockData?.history || []).slice(-30).map(row => [
                new Date(row.Date).toLocaleDateString(),
                row.Open?.toFixed(2),
                row.High?.toFixed(2),
                row.Low?.toFixed(2),
                row.Close?.toFixed(2),
                row.Volume?.toLocaleString()
            ]);

            autoTable(doc, {
                startY: 50,
                head: [['Date', 'Open', 'High', 'Low', 'Close', 'Volume']],
                body: fullHistory,
                theme: 'grid',
                styles: { fontSize: 8 },
            });

            // Disclaimer
            doc.addPage();
            if (logoData) doc.addImage(logoData, 'PNG', pageWidth - 25, 10, 15, 15);
            addInteractiveLogoToPage(doc, pageWidth, appLogoDataUrl);
            doc.setFontSize(14);
            doc.text("Disclaimer", 14, 40);
            doc.setFontSize(10);
            doc.text("This report is generated by AI for informational purposes only. It does not constitute financial advice. Trading stocks involves risk. Please consult a qualified financial advisor before making investment decisions.", 14, 50, { maxWidth: pageWidth - 28 });

            doc.save(`${stockData?.ticker || 'Stock'}_Comprehensive_Report.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error("Failed to generate PDF. Please try again.");
        }
    };

    const handleClose = () => {
        setIsModalOpen(false);
    };

    return (
        <div>
            <button
                onClick={handleDownloadClick}
                className="flex items-center space-x-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm"
            >
                <Download className="h-4 w-4" />
                <span>Download Report</span>
            </button>
            <NameModal
                isOpen={isModalOpen}
                onClose={handleClose}
                onConfirm={generatePDF}
            />
        </div>
    );
}
