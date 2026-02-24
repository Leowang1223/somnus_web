'use client';

import { useEffect, useState } from 'react';
import { getRefundsAction, createRefundAction, getAllOrdersAction } from '@/app/actions';
import { DollarSign, Plus, X, RefreshCw, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const statusBadge: Record<string, { label: string; class: string }> = {
    pending:    { label: '待處理',  class: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20' },
    processing: { label: '處理中',  class: 'bg-blue-500/20 text-blue-400 border-blue-500/20' },
    completed:  { label: '已退款',  class: 'bg-green-500/20 text-green-400 border-green-500/20' },
    failed:     { label: '失敗',    class: 'bg-red-500/20 text-red-400 border-red-500/20' },
};

export default function AdminRefundsPage() {
    const [refunds, setRefunds] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [orderId, setOrderId] = useState('');
    const [refundAmount, setRefundAmount] = useState('');
    const [refundReason, setRefundReason] = useState('');
    const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
    const [invoiceAction, setInvoiceAction] = useState<'void' | 'credit_note'>('void');

    const load = async () => {
        setLoading(true);
        const [refundRes, orderRes] = await Promise.all([
            getRefundsAction(),
            getAllOrdersAction(),
        ]);
        if (refundRes.success) setRefunds(refundRes.refunds);
        if (orderRes.success) setOrders(orderRes.orders);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    // Auto-fill refund amount when order is selected
    const handleOrderSelect = (id: string) => {
        setOrderId(id);
        const order = orders.find((o: any) => o.id === id);
        if (order && refundType === 'full') {
            setRefundAmount(String(order.total_amount || order.total || ''));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const result = await createRefundAction({
            order_id: orderId,
            refund_amount: Number(refundAmount),
            refund_reason: refundReason,
            refund_type: refundType,
            invoice_action: invoiceAction,
        });

        if (result.success) {
            setShowForm(false);
            setOrderId(''); setRefundAmount(''); setRefundReason('');
            await load();
        } else {
            alert('退款建立失敗，請重試');
        }
        setSubmitting(false);
    };

    const totalPending  = refunds.filter(r => r.refund_status === 'pending').reduce((s, r) => s + (r.refund_amount || 0), 0);
    const totalDone     = refunds.filter(r => r.refund_status === 'completed').reduce((s, r) => s + (r.refund_amount || 0), 0);

    return (
        <div className="text-white">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-display">退款管理</h1>
                <div className="flex gap-3">
                    <button onClick={load} className="flex items-center gap-2 text-white/60 hover:text-white border border-white/10 px-4 py-2 rounded-sm text-xs uppercase tracking-wider transition-colors">
                        <RefreshCw size={14} /> 重整
                    </button>
                    <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-[#d8aa5b] text-black px-4 py-2 rounded-sm text-xs uppercase tracking-wider font-bold hover:bg-white transition-colors">
                        <Plus size={14} /> 新增退款
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-[#111] border border-white/5 rounded-sm p-5">
                    <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">退款筆數</p>
                    <p className="text-2xl font-display">{refunds.length}</p>
                </div>
                <div className="bg-[#111] border border-yellow-500/10 rounded-sm p-5">
                    <p className="text-xs uppercase tracking-widest text-yellow-500/60 mb-1">待處理金額</p>
                    <p className="text-2xl font-display text-yellow-400">NT${totalPending.toLocaleString()}</p>
                </div>
                <div className="bg-[#111] border border-green-500/10 rounded-sm p-5">
                    <p className="text-xs uppercase tracking-widest text-green-500/60 mb-1">已退款金額</p>
                    <p className="text-2xl font-display text-green-400">NT${totalDone.toLocaleString()}</p>
                </div>
            </div>

            {/* Refund List */}
            {loading ? (
                <div className="text-center py-20 text-white/40">載入中...</div>
            ) : refunds.length === 0 ? (
                <div className="text-center py-20 text-white/40">尚無退款記錄</div>
            ) : (
                <div className="space-y-3">
                    {refunds.map((r: any) => {
                        const badge = statusBadge[r.refund_status] || statusBadge.pending;
                        return (
                            <div key={r.id} className="bg-[#111] border border-white/5 rounded-sm p-5 flex flex-col md:flex-row md:items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="font-mono text-sm text-white/80">{r.id}</span>
                                        <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm border ${badge.class}`}>{badge.label}</span>
                                        <span className="text-[10px] uppercase tracking-widest text-gray-600 px-2 py-0.5 rounded-sm border border-white/5">
                                            {r.refund_type === 'full' ? '全額退款' : '部分退款'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-1">訂單：<span className="text-white/60">{r.order_id}</span></p>
                                    {r.refund_reason && <p className="text-xs text-gray-600">原因：{r.refund_reason}</p>}
                                </div>
                                <div className="text-right md:text-right flex md:flex-col gap-4 md:gap-1 items-center md:items-end">
                                    <p className="text-lg font-display text-red-400">-NT${(r.refund_amount || 0).toLocaleString()}</p>
                                    {r.refund_fee > 0 && <p className="text-xs text-gray-600">手續費 NT${r.refund_fee}</p>}
                                    <p className="text-xs text-gray-600">{r.created_at ? new Date(r.created_at).toLocaleDateString('zh-TW') : ''}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* New Refund Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
                    <div className="w-full max-w-lg bg-[#111] border border-white/10 rounded-sm p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-display text-lg">新增退款</h2>
                            <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-[#d8aa5b] mb-2">選擇訂單 *</label>
                                <select
                                    value={orderId}
                                    onChange={e => handleOrderSelect(e.target.value)}
                                    required
                                    className="w-full bg-[#050505] border border-white/10 p-3 text-white text-sm focus:outline-none focus:border-[#d8aa5b] rounded-sm"
                                >
                                    <option value="">-- 選擇訂單 --</option>
                                    {orders.filter((o: any) => o.status !== 'cancelled' && o.status !== 'refunded').map((o: any) => (
                                        <option key={o.id} value={o.id}>
                                            {o.id} — NT${(o.total_amount || o.total || 0).toLocaleString()} ({o.status})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-[#d8aa5b] mb-2">退款類型</label>
                                    <select
                                        value={refundType}
                                        onChange={e => setRefundType(e.target.value as 'full' | 'partial')}
                                        className="w-full bg-[#050505] border border-white/10 p-3 text-white text-sm focus:outline-none focus:border-[#d8aa5b] rounded-sm"
                                    >
                                        <option value="full">全額退款</option>
                                        <option value="partial">部分退款</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-[#d8aa5b] mb-2">退款金額 (NT$)</label>
                                    <input
                                        type="number"
                                        value={refundAmount}
                                        onChange={e => setRefundAmount(e.target.value)}
                                        required
                                        min="1"
                                        className="w-full bg-[#050505] border border-white/10 p-3 text-white text-sm focus:outline-none focus:border-[#d8aa5b] rounded-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-widest text-[#d8aa5b] mb-2">退款原因</label>
                                <input
                                    type="text"
                                    value={refundReason}
                                    onChange={e => setRefundReason(e.target.value)}
                                    placeholder="例：商品瑕疵、客訴、取消訂單"
                                    className="w-full bg-[#050505] border border-white/10 p-3 text-white text-sm focus:outline-none focus:border-[#d8aa5b] rounded-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-widest text-[#d8aa5b] mb-2">發票處理</label>
                                <select
                                    value={invoiceAction}
                                    onChange={e => setInvoiceAction(e.target.value as 'void' | 'credit_note')}
                                    className="w-full bg-[#050505] border border-white/10 p-3 text-white text-sm focus:outline-none focus:border-[#d8aa5b] rounded-sm"
                                >
                                    <option value="void">作廢原發票</option>
                                    <option value="credit_note">開立折讓單</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowForm(false)}
                                    className="flex-1 border border-white/10 text-white/60 py-3 text-xs uppercase tracking-wider rounded-sm hover:border-white/30 transition-colors">
                                    取消
                                </button>
                                <button type="submit" disabled={submitting}
                                    className="flex-1 bg-red-500 text-white py-3 text-xs uppercase tracking-wider font-bold rounded-sm hover:bg-red-400 transition-colors disabled:opacity-50">
                                    {submitting ? '建立中...' : '確認建立退款'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
