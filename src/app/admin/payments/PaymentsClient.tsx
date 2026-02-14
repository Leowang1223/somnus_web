'use client';

import { useState, useMemo } from 'react';
import {
    DollarSign, CreditCard, TrendingUp, TrendingDown, Search,
    ArrowUpRight, ArrowDownRight, RefreshCw, CheckCircle, Clock, XCircle, Filter
} from 'lucide-react';
import { updatePayoutStatusAction } from '@/app/actions';

type PaymentFilter = 'all' | 'completed' | 'pending' | 'failed' | 'refunded';
type ViewTab = 'payments' | 'refunds' | 'reconciliation';

export default function PaymentsClient({
    initialPayments,
    initialRefunds,
    initialOrders
}: {
    initialPayments: any[];
    initialRefunds: any[];
    initialOrders: any[];
}) {
    const [payments, setPayments] = useState(initialPayments);
    const [refunds] = useState(initialRefunds);
    const [orders] = useState(initialOrders);
    const [filter, setFilter] = useState<PaymentFilter>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeView, setActiveView] = useState<ViewTab>('payments');
    const [isLoading, setIsLoading] = useState(false);

    // === Stats ===
    const stats = useMemo(() => {
        const completedPayments = payments.filter((p: any) => p.payment_status === 'completed');
        const totalGross = completedPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        const totalFees = completedPayments.reduce((sum: number, p: any) => sum + (p.gateway_fee || 0), 0);
        const totalNet = completedPayments.reduce((sum: number, p: any) => sum + (p.net_amount || 0), 0);
        const pendingPayout = completedPayments
            .filter((p: any) => p.payout_status === 'pending')
            .reduce((sum: number, p: any) => sum + (p.net_amount || 0), 0);
        const totalRefunded = refunds
            .filter((r: any) => r.refund_status === 'completed')
            .reduce((sum: number, r: any) => sum + (r.refund_amount || 0), 0);

        // Revenue by provider
        const byProvider: Record<string, { count: number; gross: number; fees: number; net: number }> = {};
        completedPayments.forEach((p: any) => {
            const key = p.payment_provider || 'unknown';
            if (!byProvider[key]) byProvider[key] = { count: 0, gross: 0, fees: 0, net: 0 };
            byProvider[key].count++;
            byProvider[key].gross += p.amount || 0;
            byProvider[key].fees += p.gateway_fee || 0;
            byProvider[key].net += p.net_amount || 0;
        });

        return { totalGross, totalFees, totalNet, pendingPayout, totalRefunded, byProvider };
    }, [payments, refunds]);

    // === Filtered Payments ===
    const filteredPayments = useMemo(() => {
        return payments.filter((p: any) => {
            const matchesFilter = filter === 'all' || p.payment_status === filter;
            const matchesSearch = searchTerm === '' ||
                (p.order_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.transaction_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.payment_provider || '').toLowerCase().includes(searchTerm.toLowerCase());
            return matchesFilter && matchesSearch;
        });
    }, [payments, filter, searchTerm]);

    // === Filtered Refunds ===
    const filteredRefunds = useMemo(() => {
        return refunds.filter((r: any) => {
            return searchTerm === '' ||
                (r.order_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (r.refund_reason || '').toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [refunds, searchTerm]);

    const handlePayoutToggle = async (paymentId: string, currentStatus: string) => {
        setIsLoading(true);
        const newStatus = currentStatus === 'pending' ? 'paid_out' : 'pending';
        await updatePayoutStatusAction(paymentId, newStatus as any);
        setPayments(prev => prev.map((p: any) =>
            p.id === paymentId ? { ...p, payout_status: newStatus, payout_at: newStatus === 'paid_out' ? new Date().toISOString() : null } : p
        ));
        setIsLoading(false);
    };

    const formatCurrency = (amount: number | undefined) => {
        if (amount === undefined || amount === null) return '—';
        return `NT$${amount.toLocaleString()}`;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle size={14} className="text-green-400" />;
            case 'pending': return <Clock size={14} className="text-yellow-400" />;
            case 'failed': return <XCircle size={14} className="text-red-400" />;
            case 'refunded': return <RefreshCw size={14} className="text-orange-400" />;
            default: return <Clock size={14} className="text-gray-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        const map: Record<string, string> = {
            completed: 'bg-green-500/20 text-green-400 border-green-500/30',
            pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            failed: 'bg-red-500/20 text-red-400 border-red-500/30',
            refunded: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
            processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            paid_out: 'bg-green-500/20 text-green-400 border-green-500/30',
        };
        return map[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    };

    return (
        <div>
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <div className="bg-[#111] border border-white/5 p-4 rounded-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign size={14} className="text-[#d8aa5b]" />
                        <p className="text-[10px] uppercase tracking-widest text-gray-500">總收款</p>
                    </div>
                    <p className="text-2xl font-display text-[#d8aa5b]">{formatCurrency(stats.totalGross)}</p>
                </div>
                <div className="bg-[#111] border border-white/5 p-4 rounded-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingDown size={14} className="text-red-400" />
                        <p className="text-[10px] uppercase tracking-widest text-gray-500">手續費</p>
                    </div>
                    <p className="text-2xl font-display text-red-400">{formatCurrency(stats.totalFees)}</p>
                </div>
                <div className="bg-[#111] border border-white/5 p-4 rounded-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={14} className="text-green-400" />
                        <p className="text-[10px] uppercase tracking-widest text-gray-500">實收金額</p>
                    </div>
                    <p className="text-2xl font-display text-green-400">{formatCurrency(stats.totalNet)}</p>
                </div>
                <div className="bg-[#111] border border-white/5 p-4 rounded-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock size={14} className="text-yellow-400" />
                        <p className="text-[10px] uppercase tracking-widest text-gray-500">待入帳</p>
                    </div>
                    <p className="text-2xl font-display text-yellow-400">{formatCurrency(stats.pendingPayout)}</p>
                </div>
                <div className="bg-[#111] border border-white/5 p-4 rounded-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <RefreshCw size={14} className="text-orange-400" />
                        <p className="text-[10px] uppercase tracking-widest text-gray-500">已退款</p>
                    </div>
                    <p className="text-2xl font-display text-orange-400">{formatCurrency(stats.totalRefunded)}</p>
                </div>
            </div>

            {/* Provider Breakdown */}
            {Object.keys(stats.byProvider).length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {Object.entries(stats.byProvider).map(([provider, data]) => (
                        <div key={provider} className="bg-[#111] border border-white/5 p-4 rounded-sm">
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">{provider}</p>
                            <p className="text-lg font-display text-white">{formatCurrency(data.gross)}</p>
                            <div className="flex justify-between text-[10px] text-gray-500 mt-2">
                                <span>{data.count} 筆</span>
                                <span>手續費 {formatCurrency(data.fees)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* View Tabs + Search */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex gap-2">
                    {([
                        { key: 'payments', label: '付款記錄' },
                        { key: 'refunds', label: '退款記錄' },
                        { key: 'reconciliation', label: '對帳總覽' },
                    ] as { key: ViewTab; label: string }[]).map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveView(tab.key)}
                            className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold rounded-sm border transition-colors ${activeView === tab.key
                                ? 'bg-[#d8aa5b] text-black border-[#d8aa5b]'
                                : 'bg-transparent text-gray-500 border-white/10 hover:border-white/30'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-[#111] border border-white/10 p-2 rounded-sm">
                        <Search className="text-gray-500 ml-2" size={16} />
                        <input
                            placeholder="搜尋訂單編號、交易編號..."
                            className="bg-transparent text-white focus:outline-none text-sm w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {activeView === 'payments' && (
                        <div className="flex gap-1">
                            {(['all', 'completed', 'pending', 'failed'] as PaymentFilter[]).map(f => (
                                <button key={f} onClick={() => setFilter(f)}
                                    className={`px-3 py-2 text-[10px] uppercase tracking-widest font-bold rounded-sm border transition-colors ${filter === f
                                        ? 'bg-[#d8aa5b] text-black border-[#d8aa5b]'
                                        : 'bg-transparent text-gray-500 border-white/10 hover:border-white/30'}`}>
                                    {f === 'all' ? '全部' : f}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* === Payments Table === */}
            {activeView === 'payments' && (
                <div className="bg-[#111] border border-white/5 rounded-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-white/50 text-[10px] uppercase tracking-widest border-b border-white/5">
                            <tr>
                                <th className="p-4">ID</th>
                                <th className="p-4">訂單</th>
                                <th className="p-4">金流商</th>
                                <th className="p-4">方式</th>
                                <th className="p-4">類型</th>
                                <th className="p-4">金額</th>
                                <th className="p-4">手續費</th>
                                <th className="p-4">實收</th>
                                <th className="p-4">狀態</th>
                                <th className="p-4">入帳</th>
                                <th className="p-4">時間</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredPayments.map((payment: any) => (
                                <tr key={payment.id} className="text-white hover:bg-white/5 transition-colors text-sm">
                                    <td className="p-4 font-mono text-[10px] text-gray-400">{payment.id}</td>
                                    <td className="p-4 font-mono text-[#d8aa5b] text-xs">{payment.order_id}</td>
                                    <td className="p-4 text-xs">{payment.payment_provider}</td>
                                    <td className="p-4 text-xs text-gray-400">{payment.payment_method || '—'}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${payment.payment_type === 'deposit' ? 'bg-cyan-500/20 text-cyan-400' : payment.payment_type === 'final' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                            {payment.payment_type === 'deposit' ? '訂金' : payment.payment_type === 'final' ? '尾款' : '全額'}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono">{formatCurrency(payment.amount)}</td>
                                    <td className="p-4 font-mono text-red-400 text-xs">{formatCurrency(payment.gateway_fee)}</td>
                                    <td className="p-4 font-mono text-green-400">{formatCurrency(payment.net_amount)}</td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getStatusColor(payment.payment_status)}`}>
                                            {getStatusIcon(payment.payment_status)} {payment.payment_status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => handlePayoutToggle(payment.id, payment.payout_status)}
                                            disabled={isLoading || payment.payment_status !== 'completed'}
                                            className={`px-2 py-1 rounded text-[10px] uppercase font-bold border transition-colors disabled:opacity-30 ${payment.payout_status === 'paid_out'
                                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                                : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30'}`}
                                        >
                                            {payment.payout_status === 'paid_out' ? '已入帳' : '待入帳'}
                                        </button>
                                    </td>
                                    <td className="p-4 text-[10px] text-gray-500">
                                        {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('zh-TW') : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredPayments.length === 0 && (
                        <div className="p-12 text-center text-gray-500">尚無付款記錄。</div>
                    )}
                </div>
            )}

            {/* === Refunds Table === */}
            {activeView === 'refunds' && (
                <div className="bg-[#111] border border-white/5 rounded-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-white/50 text-[10px] uppercase tracking-widest border-b border-white/5">
                            <tr>
                                <th className="p-4">ID</th>
                                <th className="p-4">訂單</th>
                                <th className="p-4">退款金額</th>
                                <th className="p-4">退還手續費</th>
                                <th className="p-4">實退金額</th>
                                <th className="p-4">類型</th>
                                <th className="p-4">原因</th>
                                <th className="p-4">發票處理</th>
                                <th className="p-4">狀態</th>
                                <th className="p-4">時間</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredRefunds.map((refund: any) => (
                                <tr key={refund.id} className="text-white hover:bg-white/5 transition-colors text-sm">
                                    <td className="p-4 font-mono text-[10px] text-gray-400">{refund.id}</td>
                                    <td className="p-4 font-mono text-[#d8aa5b] text-xs">{refund.order_id}</td>
                                    <td className="p-4 font-mono text-orange-400">{formatCurrency(refund.refund_amount)}</td>
                                    <td className="p-4 font-mono text-xs text-gray-400">{formatCurrency(refund.refund_fee)}</td>
                                    <td className="p-4 font-mono text-red-400">{formatCurrency(refund.net_refund)}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${refund.refund_type === 'full' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                            {refund.refund_type === 'full' ? '全額' : '部分'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs text-gray-400 max-w-[200px] truncate">{refund.refund_reason || '—'}</td>
                                    <td className="p-4 text-xs text-gray-400">
                                        {refund.invoice_action === 'void' ? '作廢' : refund.invoice_action === 'credit_note' ? '折讓' : '—'}
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getStatusColor(refund.refund_status)}`}>
                                            {getStatusIcon(refund.refund_status)} {refund.refund_status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-[10px] text-gray-500">
                                        {refund.created_at ? new Date(refund.created_at).toLocaleDateString('zh-TW') : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredRefunds.length === 0 && (
                        <div className="p-12 text-center text-gray-500">尚無退款記錄。</div>
                    )}
                </div>
            )}

            {/* === Reconciliation View === */}
            {activeView === 'reconciliation' && (
                <div className="space-y-6">
                    {/* Net Revenue Summary */}
                    <div className="bg-[#111] border border-white/5 p-6 rounded-sm">
                        <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4">淨營收總覽</h3>
                        <div className="grid grid-cols-4 gap-6 text-center">
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase mb-1">總收款</p>
                                <p className="text-xl font-mono text-white">{formatCurrency(stats.totalGross)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase mb-1">- 手續費</p>
                                <p className="text-xl font-mono text-red-400">{formatCurrency(stats.totalFees)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase mb-1">- 退款</p>
                                <p className="text-xl font-mono text-orange-400">{formatCurrency(stats.totalRefunded)}</p>
                            </div>
                            <div className="border-l border-white/10 pl-6">
                                <p className="text-[10px] text-gray-500 uppercase mb-1">淨收入</p>
                                <p className="text-xl font-mono text-[#d8aa5b]">{formatCurrency(stats.totalNet - stats.totalRefunded)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Deferred Revenue from Orders */}
                    <div className="bg-[#111] border border-white/5 p-6 rounded-sm">
                        <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4">收入認列概覽</h3>
                        {(() => {
                            const totalRecognized = orders
                                .filter((o: any) => o.status !== 'cancelled' && o.status !== 'refunded')
                                .reduce((sum: number, o: any) => sum + (o.recognized_revenue || 0), 0);
                            const totalDeferred = orders
                                .filter((o: any) => o.has_preorder && !o.is_fulfilled)
                                .reduce((sum: number, o: any) => sum + (o.deferred_revenue || 0), 0);
                            const preorderCount = orders.filter((o: any) => o.has_preorder && !o.is_fulfilled).length;

                            return (
                                <div className="grid grid-cols-3 gap-6 text-center">
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase mb-1">已認列收入</p>
                                        <p className="text-xl font-mono text-green-400">{formatCurrency(totalRecognized)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase mb-1">遞延收入（預購）</p>
                                        <p className="text-xl font-mono text-cyan-400">{formatCurrency(totalDeferred)}</p>
                                        <p className="text-[10px] text-gray-500 mt-1">{preorderCount} 筆待履約</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase mb-1">總營收</p>
                                        <p className="text-xl font-mono text-white">{formatCurrency(totalRecognized + totalDeferred)}</p>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Per-Provider Table */}
                    <div className="bg-[#111] border border-white/5 rounded-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-white/50 text-[10px] uppercase tracking-widest border-b border-white/5">
                                <tr>
                                    <th className="p-4">金流商</th>
                                    <th className="p-4">交易筆數</th>
                                    <th className="p-4">總收款</th>
                                    <th className="p-4">手續費</th>
                                    <th className="p-4">實收金額</th>
                                    <th className="p-4">手續費率</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {Object.entries(stats.byProvider).map(([provider, data]) => (
                                    <tr key={provider} className="text-white hover:bg-white/5 transition-colors text-sm">
                                        <td className="p-4 font-bold capitalize">{provider}</td>
                                        <td className="p-4 text-gray-400">{data.count}</td>
                                        <td className="p-4 font-mono">{formatCurrency(data.gross)}</td>
                                        <td className="p-4 font-mono text-red-400">{formatCurrency(data.fees)}</td>
                                        <td className="p-4 font-mono text-green-400">{formatCurrency(data.net)}</td>
                                        <td className="p-4 font-mono text-gray-400">
                                            {data.gross > 0 ? `${((data.fees / data.gross) * 100).toFixed(2)}%` : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {Object.keys(stats.byProvider).length === 0 && (
                            <div className="p-12 text-center text-gray-500">尚無對帳資料。</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
