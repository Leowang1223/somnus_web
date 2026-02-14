'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Package, DollarSign, TrendingUp, Calendar, AlertCircle, Check, X } from 'lucide-react';
import Link from 'next/link';
import { batchUpdatePreorderStatusAction } from '@/app/actions';
import { useRouter } from 'next/navigation';

function getPreorderStatus(product: any) {
    if (!product.preorder_start_date || !product.preorder_end_date) return 'unknown';

    const now = new Date();
    const start = new Date(product.preorder_start_date);
    const end = new Date(product.preorder_end_date);

    // 檢查是否售罄
    if (product.preorder_limit && (product.preorder_sold || 0) >= product.preorder_limit) {
        return 'soldout';
    }

    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'active';
    if (now > end) return 'ended';

    return 'unknown';
}

function getStatusColor(status: string) {
    const colors = {
        upcoming: 'border-yellow-500/20 text-yellow-400 bg-yellow-500/5',
        active: 'border-blue-500/20 text-blue-400 bg-blue-500/5',
        ended: 'border-gray-500/20 text-gray-400 bg-gray-500/5',
        soldout: 'border-purple-500/20 text-purple-400 bg-purple-500/5',
        unknown: 'border-gray-500/20 text-gray-400 bg-gray-500/5'
    };
    return colors[status as keyof typeof colors] || colors.unknown;
}

function getStatusText(status: string) {
    const texts = {
        upcoming: '即將開始',
        active: '進行中',
        ended: '已結束',
        soldout: '已售罄',
        unknown: '未知'
    };
    return texts[status as keyof typeof texts] || '未知';
}

function formatDate(dateString: string | null) {
    if (!dateString) return '未設定';
    return new Date(dateString).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function Countdown({ targetDate }: { targetDate: string }) {
    const [timeLeft, setTimeLeft] = useState('');

    useMemo(() => {
        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const target = new Date(targetDate).getTime();
            const diff = target - now;

            if (diff <= 0) {
                setTimeLeft('已結束');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            setTimeLeft(`${days}天 ${hours}時 ${minutes}分`);
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 60000); // 每分鐘更新

        return () => clearInterval(interval);
    }, [targetDate]);

    return <span>{timeLeft}</span>;
}

export default function PreordersClient({ products, orders }: { products: any[], orders: any[] }) {
    const router = useRouter();
    const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'ended'>('all');

    // 計算統計數據
    const stats = useMemo(() => {
        const activeCount = products.filter(p => getPreorderStatus(p) === 'active').length;
        const upcomingCount = products.filter(p => getPreorderStatus(p) === 'upcoming').length;

        const totalRevenue = orders.reduce((sum, order) => sum + (order.deposit_amount || 0), 0);
        const totalRemaining = orders.reduce((sum, order) => sum + (order.remaining_amount || 0), 0);

        return {
            activeCount,
            upcomingCount,
            totalRevenue,
            totalRemaining,
            totalOrders: orders.length
        };
    }, [products, orders]);

    // 篩選產品
    const filteredProducts = useMemo(() => {
        if (filter === 'all') return products;

        return products.filter(p => {
            const status = getPreorderStatus(p);
            if (filter === 'active') return status === 'active';
            if (filter === 'upcoming') return status === 'upcoming';
            if (filter === 'ended') return status === 'ended' || status === 'soldout';
            return true;
        });
    }, [products, filter]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="font-display text-4xl text-white mb-2">預購管理</h1>
                    <p className="text-gray-500 text-sm">管理所有預購商品與訂單</p>
                </div>
                <Link
                    href="/admin/products"
                    className="bg-[#d8aa5b] text-black px-6 py-3 text-xs uppercase font-bold tracking-widest hover:bg-white transition-colors rounded-sm"
                >
                    管理產品
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="進行中預購"
                    value={stats.activeCount}
                    icon={<Package size={20} className="text-blue-400" />}
                    trend={`${stats.upcomingCount} 個即將開始`}
                />
                <StatCard
                    title="預購訂金收入"
                    value={`$${stats.totalRevenue.toLocaleString()}`}
                    icon={<DollarSign size={20} className="text-green-400" />}
                    trend={`待收尾款 $${stats.totalRemaining.toLocaleString()}`}
                />
                <StatCard
                    title="預購訂單數"
                    value={stats.totalOrders}
                    icon={<TrendingUp size={20} className="text-purple-400" />}
                    trend="總計"
                />
                <StatCard
                    title="即將開始"
                    value={stats.upcomingCount}
                    icon={<Clock size={20} className="text-yellow-400" />}
                    trend="7天內"
                />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b border-white/10 pb-4">
                {[
                    { key: 'all', label: '全部' },
                    { key: 'active', label: '進行中' },
                    { key: 'upcoming', label: '即將開始' },
                    { key: 'ended', label: '已結束' }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key as any)}
                        className={`px-4 py-2 text-xs uppercase tracking-widest font-bold rounded-sm border transition-colors ${
                            filter === tab.key
                                ? 'bg-[#d8aa5b] text-black border-[#d8aa5b]'
                                : 'bg-transparent text-gray-500 border-white/10 hover:border-white/30'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Products List */}
            <div className="space-y-4">
                {filteredProducts.length === 0 ? (
                    <div className="bg-[#111] border border-white/5 p-12 text-center rounded-sm">
                        <p className="text-gray-500">沒有符合條件的預購商品</p>
                    </div>
                ) : (
                    filteredProducts.map(product => {
                        const status = getPreorderStatus(product);
                        const progress = product.preorder_limit
                            ? Math.min(100, ((product.preorder_sold || 0) / product.preorder_limit) * 100)
                            : 0;

                        return (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-[#111] border border-white/5 p-6 rounded-sm hover:border-white/10 transition-colors"
                            >
                                <div className="flex gap-6">
                                    {/* Product Image */}
                                    <div className="w-24 h-24 bg-white/5 rounded-sm overflow-hidden flex-shrink-0">
                                        {product.image && (
                                            <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
                                        )}
                                    </div>

                                    {/* Product Info */}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-white font-display text-lg mb-1">{product.name}</h3>
                                                <p className="text-gray-500 text-sm">${product.price}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-sm border ${getStatusColor(status)}`}>
                                                    {getStatusText(status)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        {product.preorder_limit && (
                                            <div className="mb-4">
                                                <div className="flex justify-between text-xs text-gray-400 mb-2">
                                                    <span>預購進度</span>
                                                    <span>{product.preorder_sold || 0} / {product.preorder_limit}</span>
                                                </div>
                                                <div className="w-full bg-white/5 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-500 h-2 rounded-full transition-all"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Time Info */}
                                        <div className="grid grid-cols-3 gap-4 text-xs">
                                            <div>
                                                <span className="text-gray-500 block mb-1">預購期間</span>
                                                <span className="text-white">{formatDate(product.preorder_start_date)}</span>
                                                <span className="text-gray-600 mx-1">至</span>
                                                <span className="text-white">{formatDate(product.preorder_end_date)}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 block mb-1">預計出貨</span>
                                                <span className="text-white">{formatDate(product.expected_ship_date)}</span>
                                            </div>
                                            {status === 'active' && product.preorder_end_date && (
                                                <div>
                                                    <span className="text-gray-500 block mb-1">倒數時間</span>
                                                    <span className="text-yellow-400 font-mono">
                                                        <Countdown targetDate={product.preorder_end_date} />
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="mt-4 flex gap-2">
                                            <Link
                                                href={`/admin/products/${product.id}`}
                                                className="text-[#d8aa5b] hover:text-white text-xs uppercase tracking-widest font-bold transition-colors"
                                            >
                                                編輯產品
                                            </Link>
                                            <Link
                                                href={`/product/${product.slug}`}
                                                className="text-gray-500 hover:text-white text-xs uppercase tracking-widest font-bold transition-colors"
                                                target="_blank"
                                            >
                                                前台預覽
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, trend }: { title: string, value: string | number, icon: React.ReactNode, trend: string }) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-[#111] border border-white/5 p-6 rounded-sm relative group overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity">
                {icon}
            </div>
            <span className="text-[#d8aa5b] text-xs uppercase tracking-widest block mb-4 font-bold">{title}</span>
            <div className="text-3xl text-white font-display mb-2">{value}</div>
            <div className="text-gray-500 text-xs">{trend}</div>
        </motion.div>
    );
}
