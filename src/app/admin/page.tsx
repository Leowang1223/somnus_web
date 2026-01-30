'use client';

export default function AdminDashboard() {
    return (
        <div>
            <header className="mb-12">
                <h1 className="font-display text-4xl text-white mb-2">Dashboard</h1>
                <p className="text-gray-500 text-sm">Welcome back, Architect.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#111] border border-white/5 p-8 rounded-sm">
                    <span className="text-[#d8aa5b] text-xs uppercase tracking-widest block mb-4">Total Revenue</span>
                    <div className="text-4xl text-white font-display mb-2">$12,450</div>
                    <div className="text-green-400 text-xs flex items-center gap-1">▲ 12% from last cycle</div>
                </div>

                <div className="bg-[#111] border border-white/5 p-8 rounded-sm">
                    <span className="text-[#d8aa5b] text-xs uppercase tracking-widest block mb-4">Active Orders</span>
                    <div className="text-4xl text-white font-display mb-2">24</div>
                    <div className="text-gray-500 text-xs">Awaiting fulfillment</div>
                </div>

                <div className="bg-[#111] border border-white/5 p-8 rounded-sm">
                    <span className="text-[#d8aa5b] text-xs uppercase tracking-widest block mb-4">Journal Views</span>
                    <div className="text-4xl text-white font-display mb-2">1,208</div>
                    <div className="text-green-400 text-xs flex items-center gap-1">▲ 5% engagement</div>
                </div>
            </div>
        </div>
    );
}
