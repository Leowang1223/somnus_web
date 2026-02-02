'use client';

import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Users, CheckCircle, DollarSign, Activity, TrendingUp } from 'lucide-react';
import React, { useMemo } from 'react';

import { useAuth } from '@/context/AuthContext';

export default function DashboardClient({ data }: { data: any }) {
    const { isOwner } = useAuth();
    const { orders = [], users = [], analytics = { totalVisitors: 0, dailyVisits: {} } } = data;

    // 1. Calculate Metrics
    const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);

    const totalProfit = orders.reduce((sum: number, order: any) => {
        const orderCost = order.items?.reduce((c: number, item: any) => c + ((item.cost || 0) * (item.quantity || 1)), 0) || 0;
        return sum + ((order.total || 0) - orderCost);
    }, 0);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyOrders = orders.filter((o: any) => {
        const d = new Date(o.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const monthlyRevenue = monthlyOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);

    const conversionRate = analytics.totalVisitors > 0
        ? ((orders.length / analytics.totalVisitors) * 100).toFixed(1)
        : '0.0';

    // 2. Prepare Chart Data (Last 12 Months)
    const chartData = useMemo(() => {
        const result = [];
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const month = date.toLocaleString('default', { month: 'short' });
            const year = date.getFullYear();

            // Find orders for this month
            const monthTotal = orders
                .filter((o: any) => {
                    const d = new Date(o.date);
                    return d.getMonth() === date.getMonth() && d.getFullYear() === year;
                })
                .reduce((sum: number, o: any) => sum + (o.total || 0), 0);

            result.push({ name: `${month}`, value: monthTotal });
        }
        return result;
    }, [orders]);

    const maxChartValue = Math.max(...chartData.map(d => d.value)) || 100;

    return (
        <div className="space-y-8">
            <header className="mb-12 flex justify-between items-end">
                <div>
                    <h1 className="font-display text-4xl text-white mb-2">儀表板</h1>
                    {isOwner ? (
                        <p className="text-gray-500 text-sm">歡迎回來，建築師。監測您的數位帝國。</p>
                    ) : (
                        <p className="text-gray-500 text-sm">歡迎回來，客服專員。準備好開始這一天的儀式了嗎？</p>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-[#d8aa5b] text-xs uppercase tracking-widest font-bold">資料來源：Somnus 核心資料庫</p>
                </div>
            </header>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {isOwner && (
                    <>
                        <MetricCard
                            title="總營收"
                            value={`$${totalRevenue.toLocaleString()}`}
                            subvalue="生命週期總銷售額"
                            icon={<DollarSign size={20} className="text-[#d8aa5b]" />}
                        />
                        <MetricCard
                            title="本月營收"
                            value={`$${monthlyRevenue.toLocaleString()}`}
                            subvalue="當前週期"
                            icon={<Activity size={20} className="text-blue-400" />}
                        />
                        <MetricCard
                            title="淨利潤"
                            value={`$${totalProfit.toLocaleString()}`}
                            subvalue="總營收 - 產品成本"
                            icon={<TrendingUp size={20} className="text-green-400" />}
                        />
                    </>
                )}
                {!isOwner && (
                    <>
                        <MetricCard
                            title="今日新訂單"
                            value={orders.filter((o: any) => new Date(o.date).toDateString() === new Date().toDateString()).length}
                            subvalue="待處理"
                            icon={<DollarSign size={20} className="text-gray-400" />}
                        />
                        <MetricCard
                            title="待回覆工單"
                            value="0"
                            subvalue="客服中心"
                            icon={<Activity size={20} className="text-blue-400" />}
                        />
                        <MetricCard
                            title="庫存警示"
                            value="0"
                            subvalue="需要關注"
                            icon={<TrendingUp size={20} className="text-red-400" />}
                        />
                    </>
                )}
                <MetricCard
                    title="轉化率"
                    value={`${conversionRate}%`}
                    subvalue={`${orders.length} 訂單 / ${analytics.totalVisitors.toLocaleString()} 訪客`}
                    icon={<ArrowUp size={20} className="text-purple-400" />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart Area - Only for Owner */}
                {isOwner ? (
                    <div className="lg:col-span-2 bg-[#111] border border-white/5 p-8 rounded-sm">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-white font-display text-xl">年度營收趨勢</h3>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <div className="w-2 h-2 rounded-full bg-[#d8aa5b]"></div> 營收
                                </div>
                            </div>
                        </div>

                        {/* Responsive Container for SVG Chart */}
                        <div className="h-64 w-full relative group">
                            <div className="absolute inset-0 flex items-end justify-between px-2">
                                {chartData.map((d, i) => (
                                    <div key={i} className="flex flex-col items-center justify-end h-full gap-2 group/bar w-full relative">
                                        <div className="w-[1px] h-full bg-white/5 absolute top-0 z-0"></div>
                                        <div className="relative z-10 w-full flex justify-center items-end h-full px-1">
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${(d.value / maxChartValue) * 100}%` }}
                                                transition={{ duration: 1, ease: "circOut", delay: i * 0.05 }}
                                                className="w-full max-w-[40px] bg-gradient-to-t from-[#d8aa5b]/20 to-[#d8aa5b] opacity-80 hover:opacity-100 transition-opacity rounded-t-sm relative"
                                            >
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-2 py-1 rounded-sm opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                                                    ${d.value}
                                                </div>
                                            </motion.div>
                                        </div>
                                        <span className="text-[10px] text-gray-600 uppercase tracking-widest mt-2">{d.name}</span>
                                    </div>
                                ))}
                            </div>
                            {/* Grid Lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                {[100, 75, 50, 25, 0].map((p) => (
                                    <div key={p} className="w-full h-[1px] bg-white/5 relative">
                                        <span className="absolute -left-8 -top-2 text-[8px] text-gray-700">{Math.round((maxChartValue * p) / 100)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="lg:col-span-2 bg-[#111] border border-white/5 p-8 rounded-sm flex items-center justify-center">
                        <div className="text-center text-gray-600">
                            <p className="text-sm">財務數據僅供管理員查看。</p>
                            <p className="text-xs mt-2">請專注於提供卓越的客戶體驗。</p>
                        </div>
                    </div>
                )}

                {/* Side Stats */}
                <div className="space-y-6">
                    <div className="bg-[#111] border border-white/5 p-8 rounded-sm">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <span className="text-gray-500 text-xs uppercase tracking-widest block mb-1">註冊用戶</span>
                                <div className="text-3xl text-white font-display flex items-baseline gap-2">
                                    {users.length} <span className="text-sm text-gray-600 font-sans tracking-normal">Users</span>
                                </div>
                            </div>
                            <Users className="text-gray-600" size={24} />
                        </div>
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full w-[70%]"></div>
                        </div>
                        <p className="mt-4 text-[10px] text-gray-500">
                            較上月新增 <span className="text-white">+2</span> 位
                        </p>
                    </div>

                    <div className="bg-[#111] border border-white/5 p-8 rounded-sm">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <span className="text-gray-500 text-xs uppercase tracking-widest block mb-1">訂單完成率</span>
                                <div className="text-3xl text-white font-display flex items-baseline gap-2">
                                    92<span className="text-sm text-gray-600 font-sans tracking-normal">%</span>
                                </div>
                            </div>
                            <CheckCircle className="text-gray-600" size={24} />
                        </div>
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-full w-[92%]"></div>
                        </div>
                        <p className="mt-4 text-[10px] text-gray-500">
                            系統運作正常
                        </p>
                    </div>

                    <div className="bg-[#111] border border-white/5 p-8 rounded-sm">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <span className="text-gray-500 text-xs uppercase tracking-widest block mb-1">退貨率</span>
                                <div className="text-3xl text-white font-display flex items-baseline gap-2">
                                    0.0<span className="text-sm text-gray-600 font-sans tracking-normal">%</span>
                                </div>
                            </div>
                            <Activity className="text-red-500" size={24} />
                        </div>
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <div className="bg-red-500 h-full w-[0%]"></div>
                        </div>
                        <p className="mt-4 text-[10px] text-gray-500">
                            基於總訂單計算
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, subvalue, icon }: any) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-[#111] border border-white/5 p-8 rounded-sm relative group overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
                {icon}
            </div>
            <span className="text-[#d8aa5b] text-xs uppercase tracking-widest block mb-4 font-bold">{title}</span>
            <div className="text-3xl lg:text-4xl text-white font-display mb-2">{value}</div>
            <div className="text-gray-500 text-xs flex items-center gap-1">{subvalue}</div>
        </motion.div>
    );
}
