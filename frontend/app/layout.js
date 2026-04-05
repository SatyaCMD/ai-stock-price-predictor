import { Inter } from "next/font/google";
import "./globals.css";
import ToastProvider from '../components/ToastProvider';

import HideNextjsLogo from '../components/HideNextjsLogo';
import Footer from '../components/Footer';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: "AI Stock Price Predictor",
    description: "Real-time AI-powered financial market analysis",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={`${inter.className} flex flex-col min-h-screen`}>
                <HideNextjsLogo />
                <ToastProvider />
                <main className="flex-grow">
                    {children}
                </main>
                <Footer />
            </body>
        </html>
    );
}
