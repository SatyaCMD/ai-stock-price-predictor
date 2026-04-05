const fs = require('fs');
const path = require('path');

const pagesToCreate = [
    { dir: 'privacy-policy', title: 'Privacy Policy', desc: 'Understanding how we protect and manage your data.' },
    { dir: 'terms', title: 'Terms of Service', desc: 'The rules and guidelines for using TradeMind AI.' },
    { dir: 'cookies', title: 'Cookie Settings', desc: 'Manage your privacy and tracking preferences.' },
    { dir: 'documentation', title: 'Documentation', desc: 'Comprehensive guides to mastering the platform.' },
    { dir: 'api-reference', title: 'API Reference', desc: 'Integrate institutional-grade AI metrics using our REST hooks.' },
    { dir: 'market-status', title: 'Global Market Status', desc: 'Real-time tracking of trading session uptime and liquidity schedules.' },
    { dir: 'help-center', title: 'Help Center', desc: 'Get support and answers from the TradeMind AI team.' }
];

const template = (title, desc) => `import Navbar from '../../components/Navbar';

export default function Page() {
    return (
        <div className="bg-gray-50 flex flex-col">
            <Navbar />
            <div className="pt-32 pb-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-grow">
                <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 p-8 md:p-12 border border-gray-100">
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">${title}</h1>
                    <p className="text-lg text-slate-500 mb-8 border-b border-gray-100 pb-8">${desc}</p>
                    
                    <div className="prose prose-blue max-w-none text-slate-600 space-y-6">
                        <p>
                            Welcome to the ${title} page for TradeMind AI. We are currently finalizing the 
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
}`;

pagesToCreate.forEach(page => {
    const dirPath = path.join(__dirname, 'app', page.dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
    const filePath = path.join(dirPath, 'page.js');
    fs.writeFileSync(filePath, template(page.title, page.desc));
    console.log('Created: ', filePath);
});
