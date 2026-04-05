import Navbar from '../../components/Navbar';

export default function Page() {
    return (
        <div className="bg-gray-50 flex flex-col">
            <Navbar />
            <div className="pt-32 pb-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-grow">
                <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 p-8 md:p-12 border border-gray-100">
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">API Reference</h1>
                    <p className="text-lg text-slate-500 mb-8 border-b border-gray-100 pb-8">Integrate institutional-grade AI metrics using our REST hooks.</p>
                    
                    <div className="prose prose-blue max-w-none text-slate-600 space-y-6">
                        <p>
                            Welcome to the API Reference page for TradeMind AI. We are currently finalizing the 
                            legal and operational documentation for this specific platform tier. 
                        </p>
                        <p>
                            Check back shortly before our upcoming major production rollout to view the 
                            comprehensive guidelines specifically tailored to our institutional algorithms and user workflows.
                        </p>
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mt-8">
                            <h3 className="text-blue-900 font-semibold mb-2">Need immediate assistance?</h3>
                            <p className="text-sm text-blue-700">
                                Feel free to navigate back to the dashboard or reach out to our dedicated support tier via the 
                                contact channels provided in your profile overview.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}