'use client';

export default function AdminDashboard() {
    return (
        <div>
            <header className="mb-12">
                <h1 className="font-display text-4xl text-white mb-2">儀表板</h1>
                <p className="text-gray-500 text-sm">歡迎回來，建築師。</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#111] border border-white/5 p-8 rounded-sm">
                    <span className="text-[#d8aa5b] text-xs uppercase tracking-widest block mb-4">總收入</span>
                    <div className="text-4xl text-white font-display mb-2">$12,450</div>
                    <div className="text-green-400 text-xs flex items-center gap-1">▲ 較上一週期增長 12%</div>
                </div>

                <div className="bg-[#111] border border-white/5 p-8 rounded-sm">
                    <span className="text-[#d8aa5b] text-xs uppercase tracking-widest block mb-4">進行中訂單</span>
                    <div className="text-4xl text-white font-display mb-2">24</div>
                    <div className="text-gray-500 text-xs">等待履行中</div>
                </div>

                <div className="bg-[#111] border border-white/5 p-8 rounded-sm">
                    <span className="text-[#d8aa5b] text-xs uppercase tracking-widest block mb-4">日誌瀏覽量</span>
                    <div className="text-4xl text-white font-display mb-2">1,208</div>
                    <div className="text-green-400 text-xs flex items-center gap-1">▲ 互動率增長 5%</div>
                </div>
            </div>
        </div>
    );
}
