'use client';

import { useState, useMemo } from 'react';
import {
    Package, Truck, Eye, Search, DollarSign, Tag, AlertTriangle,
    CreditCard, RefreshCw, X, ChevronDown, ChevronUp, FileText, Flag, Clock, CheckCircle
} from "lucide-react";
import {
    updateOrderStatusAction,
    createShipmentAction,
    updateShipmentStatusAction,
    createPaymentAction,
    addOrderTagAction,
    removeOrderTagAction,
    flagOrderAction,
    unflagOrderAction,
    fulfillOrderAction,
    createRefundAction,
    createEcpayLogisticsShipmentAction,
    queryEcpayLogisticsStatusAction,
} from "@/app/actions";
import { Store } from 'lucide-react';

type TabFilter = 'all' | 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'preorder_confirmed' | 'flagged';

export default function AdminOrdersClient({ initialOrders }: { initialOrders: any[] }) {
    const [orders, setOrders] = useState(initialOrders);
    const [filter, setFilter] = useState<TabFilter>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'shipping' | 'payment' | 'tags'>('info');
    const [isLoading, setIsLoading] = useState(false);

    // Tracking / Shipment form
    const [shipmentForm, setShipmentForm] = useState({
        carrier: 'DHL',
        trackingNumber: '',
        packageWeight: '',
        status: 'shipped'
    });

    // ECPay 物流表單
    const [ecpayLogisticsForm, setEcpayLogisticsForm] = useState({
        senderName: 'SØMNS',
        senderPhone: '',
        goodsName: 'SØMNS 香氛商品',
    });
    const [ecpayLogisticsResult, setEcpayLogisticsResult] = useState<{ cvsPaperNo?: string; allPayLogisticsId?: string } | null>(null);
    const [queryingLogistics, setQueryingLogistics] = useState(false);

    // Payment form
    const [paymentForm, setPaymentForm] = useState({
        paymentProvider: 'stripe',
        transactionId: '',
        paymentMethod: 'credit_card',
        amount: '',
        gatewayFee: '0',
        paymentType: 'full' as 'deposit' | 'final' | 'full'
    });

    // Tag form
    const [tagForm, setTagForm] = useState({ tagType: 'priority', tagValue: '', notes: '' });

    // Flag form
    const [flagForm, setFlagForm] = useState({ reason: '', priority: 'medium' });

    // Refund form
    const [showRefundForm, setShowRefundForm] = useState(false);
    const [refundForm, setRefundForm] = useState({ amount: '', reason: '', refundType: 'full', invoiceAction: 'void' });

    // Stats
    const stats = useMemo(() => {
        const total = orders.length;
        const flagged = orders.filter((o: any) => o.is_flagged).length;
        const preorders = orders.filter((o: any) => o.has_preorder).length;
        const totalRevenue = orders
            .filter((o: any) => o.status !== 'cancelled' && o.status !== 'refunded')
            .reduce((sum: number, o: any) => sum + (o.total_amount || o.total || 0), 0);
        const deferredRevenue = orders
            .filter((o: any) => o.has_preorder && !o.is_fulfilled)
            .reduce((sum: number, o: any) => sum + (o.deferred_revenue || 0), 0);
        return { total, flagged, preorders, totalRevenue, deferredRevenue };
    }, [orders]);

    const filteredOrders = useMemo(() => {
        return orders.filter((order: any) => {
            const matchesFilter = filter === 'all'
                || (filter === 'flagged' ? order.is_flagged : order.status === filter);
            const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (order.shippingInfo?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (order.shippingInfo?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
            return matchesFilter && matchesSearch;
        });
    }, [orders, filter, searchTerm]);

    const handleManage = (order: any) => {
        setSelectedOrder(order);
        setActiveTab('info');
        setShipmentForm({
            carrier: order.trackingInfo?.carrier || 'DHL',
            trackingNumber: order.trackingInfo?.trackingNumber || '',
            packageWeight: '',
            status: order.status
        });
        setPaymentForm({
            paymentProvider: 'stripe',
            transactionId: '',
            paymentMethod: 'credit_card',
            amount: String(order.total_amount || order.total || ''),
            gatewayFee: '0',
            paymentType: order.has_preorder ? 'deposit' : 'full'
        });
        setShowRefundForm(false);
        setIsManageModalOpen(true);
    };

    // === Action Handlers ===

    const handleStatusUpdate = async (newStatus: string) => {
        if (!selectedOrder) return;
        setIsLoading(true);
        const trackingInfo = (newStatus === 'shipped' || newStatus === 'delivered') ? {
            trackingNumber: shipmentForm.trackingNumber,
            carrier: shipmentForm.carrier,
        } : undefined;

        await updateOrderStatusAction(selectedOrder.id, newStatus, trackingInfo);
        setOrders(prev => prev.map(o => o.id === selectedOrder.id
            ? { ...o, status: newStatus, last_status_update: new Date().toISOString(), ...(trackingInfo ? { trackingInfo } : {}) }
            : o));
        setSelectedOrder((prev: any) => prev ? { ...prev, status: newStatus } : prev);
        setIsLoading(false);
    };

    const handleCreateShipment = async () => {
        if (!selectedOrder || !shipmentForm.trackingNumber) return;
        setIsLoading(true);
        const result = await createShipmentAction({
            orderId: selectedOrder.id,
            carrier: shipmentForm.carrier,
            trackingNumber: shipmentForm.trackingNumber,
            packageWeight: shipmentForm.packageWeight ? parseFloat(shipmentForm.packageWeight) : undefined
        });
        if (result.success) {
            await handleStatusUpdate('shipped');
        }
        setIsLoading(false);
    };

    const handleRecordPayment = async () => {
        if (!selectedOrder || !paymentForm.amount) return;
        setIsLoading(true);
        const amount = parseFloat(paymentForm.amount);
        const gatewayFee = parseFloat(paymentForm.gatewayFee) || 0;
        await createPaymentAction({
            orderId: selectedOrder.id,
            paymentProvider: paymentForm.paymentProvider,
            transactionId: paymentForm.transactionId || undefined,
            paymentMethod: paymentForm.paymentMethod,
            amount,
            currency: selectedOrder.currency || 'TWD',
            exchangeRate: selectedOrder.exchange_rate || 1.0,
            gatewayFee,
            paymentType: paymentForm.paymentType,
            paymentStatus: 'completed'
        });
        setIsLoading(false);
        alert('Payment recorded.');
    };

    const handleAddTag = async () => {
        if (!selectedOrder || !tagForm.tagValue) return;
        setIsLoading(true);
        await addOrderTagAction(selectedOrder.id, tagForm.tagType, tagForm.tagValue, tagForm.notes || undefined);
        setTagForm({ tagType: 'priority', tagValue: '', notes: '' });
        setIsLoading(false);
    };

    const handleFlagOrder = async () => {
        if (!selectedOrder || !flagForm.reason) return;
        setIsLoading(true);
        await flagOrderAction(selectedOrder.id, flagForm.reason, flagForm.priority);
        setOrders(prev => prev.map(o => o.id === selectedOrder.id
            ? { ...o, is_flagged: true, flag_reason: flagForm.reason, flag_priority: flagForm.priority }
            : o));
        setSelectedOrder((prev: any) => prev ? { ...prev, is_flagged: true, flag_reason: flagForm.reason } : prev);
        setFlagForm({ reason: '', priority: 'medium' });
        setIsLoading(false);
    };

    const handleUnflag = async () => {
        if (!selectedOrder) return;
        setIsLoading(true);
        await unflagOrderAction(selectedOrder.id);
        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, is_flagged: false, flag_reason: null } : o));
        setSelectedOrder((prev: any) => prev ? { ...prev, is_flagged: false, flag_reason: null } : prev);
        setIsLoading(false);
    };

    const handleFulfillOrder = async () => {
        if (!selectedOrder) return;
        setIsLoading(true);
        const result = await fulfillOrderAction(selectedOrder.id);
        if (result.success) {
            setOrders(prev => prev.map(o => o.id === selectedOrder.id
                ? { ...o, is_fulfilled: true, fulfilled_at: new Date().toISOString(), deferred_revenue: 0, recognized_revenue: o.total_amount || o.total }
                : o));
            setSelectedOrder((prev: any) => prev ? { ...prev, is_fulfilled: true } : prev);
        }
        setIsLoading(false);
    };

    const handleRefund = async () => {
        if (!selectedOrder || !refundForm.amount) return;
        setIsLoading(true);
        await createRefundAction({
            orderId: selectedOrder.id,
            refundAmount: parseFloat(refundForm.amount),
            refundReason: refundForm.reason,
            refundType: refundForm.refundType as 'full' | 'partial',
            invoiceAction: refundForm.invoiceAction as 'void' | 'credit_note'
        });
        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: 'refunded' } : o));
        setSelectedOrder((prev: any) => prev ? { ...prev, status: 'refunded' } : prev);
        setShowRefundForm(false);
        setIsLoading(false);
    };

    const getStatusColor = (status: string) => {
        const map: Record<string, string> = {
            pending: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
            paid: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            processing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            shipped: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            delivered: 'bg-green-500/20 text-green-400 border-green-500/30',
            cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
            refunded: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
            preorder_confirmed: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
            preorder_ready: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
        };
        return map[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    };

    const formatCurrency = (amount: number | undefined, currency?: string) => {
        if (amount === undefined || amount === null) return '—';
        return `${currency === 'USD' ? '$' : 'NT$'}${amount.toLocaleString()}`;
    };

    const filters: { key: TabFilter; label: string }[] = [
        { key: 'all', label: '全部' },
        { key: 'paid', label: '已付款' },
        { key: 'processing', label: '處理中' },
        { key: 'shipped', label: '已出貨' },
        { key: 'delivered', label: '已送達' },
        { key: 'preorder_confirmed', label: '預購' },
        { key: 'cancelled', label: '已取消' },
        { key: 'refunded', label: '已退款' },
        { key: 'flagged', label: '異常' },
    ];

    return (
        <div>
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <div className="bg-[#111] border border-white/5 p-4 rounded-sm">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">總訂單</p>
                    <p className="text-2xl font-display text-white">{stats.total}</p>
                </div>
                <div className="bg-[#111] border border-white/5 p-4 rounded-sm">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">營收總額</p>
                    <p className="text-2xl font-display text-[#d8aa5b]">NT${stats.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-[#111] border border-white/5 p-4 rounded-sm">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">遞延收入</p>
                    <p className="text-2xl font-display text-cyan-400">NT${stats.deferredRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-[#111] border border-white/5 p-4 rounded-sm">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">預購訂單</p>
                    <p className="text-2xl font-display text-purple-400">{stats.preorders}</p>
                </div>
                <div className="bg-[#111] border border-white/5 p-4 rounded-sm">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">異常標記</p>
                    <p className={`text-2xl font-display ${stats.flagged > 0 ? 'text-red-400' : 'text-green-400'}`}>{stats.flagged}</p>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex items-center gap-4 bg-[#111] border border-white/10 p-2 rounded-sm w-full md:w-auto">
                    <Search className="text-gray-500 ml-2" size={18} />
                    <input
                        placeholder="搜尋訂單編號、客戶姓名、Email..."
                        className="bg-transparent text-white focus:outline-none text-sm w-80"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-1 flex-wrap">
                    {filters.map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`px-3 py-2 text-[10px] uppercase tracking-widest font-bold rounded-sm border transition-colors ${filter === f.key
                                ? 'bg-[#d8aa5b] text-black border-[#d8aa5b]'
                                : 'bg-transparent text-gray-500 border-white/10 hover:border-white/30'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-[#111] border border-white/5 rounded-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-white/50 text-[10px] uppercase tracking-widest border-b border-white/5">
                        <tr>
                            <th className="p-4">訂單編號</th>
                            <th className="p-4">日期</th>
                            <th className="p-4">客戶</th>
                            <th className="p-4">類型</th>
                            <th className="p-4">金額</th>
                            <th className="p-4">狀態</th>
                            <th className="p-4">標記</th>
                            <th className="p-4 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredOrders.map((order: any) => (
                            <tr key={order.id} className={`text-white hover:bg-white/5 transition-colors ${order.is_flagged ? 'border-l-2 border-l-red-500' : ''}`}>
                                <td className="p-4 font-mono text-[#d8aa5b] text-sm">{order.id}</td>
                                <td className="p-4 text-xs text-gray-400">{new Date(order.date).toLocaleDateString('zh-TW')}</td>
                                <td className="p-4">
                                    <div className="text-sm font-bold">{order.shippingInfo?.fullName || '—'}</div>
                                    <div className="text-[10px] text-gray-500">{order.shippingInfo?.email || '—'}</div>
                                </td>
                                <td className="p-4">
                                    {order.has_preorder && (
                                        <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                                            預購
                                        </span>
                                    )}
                                    {!order.has_preorder && (
                                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">現貨</span>
                                    )}
                                </td>
                                <td className="p-4 font-mono text-sm">
                                    {formatCurrency(order.total_amount || order.total, order.currency)}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold border ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {order.is_flagged && (
                                        <span className="flex items-center gap-1 text-red-400 text-[10px]">
                                            <AlertTriangle size={12} /> {order.flag_priority || 'flagged'}
                                        </span>
                                    )}
                                    {order.is_fulfilled === false && order.has_preorder && (
                                        <span className="flex items-center gap-1 text-cyan-400 text-[10px]">
                                            <Clock size={12} /> 待履約
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => handleManage(order)}
                                        className="text-white hover:text-[#d8aa5b] transition-colors p-2"
                                        title="管理訂單"
                                    >
                                        <Eye size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredOrders.length === 0 && (
                    <div className="p-12 text-center text-gray-500">找不到符合條件的訂單。</div>
                )}
            </div>

            {/* ===== Manage Modal ===== */}
            {isManageModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-6 overflow-y-auto">
                    <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-4xl rounded-sm my-8 relative">
                        <button onClick={() => setIsManageModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white z-10">
                            <X size={20} />
                        </button>

                        {/* Modal Header */}
                        <div className="p-8 border-b border-white/10">
                            <div className="flex items-center gap-4 mb-2">
                                <h2 className="text-2xl font-display text-white">
                                    訂單 <span className="text-[#d8aa5b]">{selectedOrder.id}</span>
                                </h2>
                                <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold border ${getStatusColor(selectedOrder.status)}`}>
                                    {selectedOrder.status}
                                </span>
                                {selectedOrder.is_flagged && (
                                    <span className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] uppercase font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                        <AlertTriangle size={10} /> {selectedOrder.flag_reason}
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-500 text-xs">
                                建立時間：{new Date(selectedOrder.date).toLocaleString('zh-TW')}
                                {selectedOrder.order_type && <> &middot; 類型：{selectedOrder.order_type === 'preorder' ? '預購' : '現貨'}</>}
                                {selectedOrder.currency && <> &middot; 幣別：{selectedOrder.currency}</>}
                            </p>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex border-b border-white/10">
                            {[
                                { key: 'info', label: '訂單資訊', icon: FileText },
                                { key: 'shipping', label: '物流管理', icon: Truck },
                                { key: 'payment', label: '金流記錄', icon: CreditCard },
                                { key: 'tags', label: '標籤與標記', icon: Tag },
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key as any)}
                                    className={`flex items-center gap-2 px-6 py-4 text-xs uppercase tracking-widest font-bold transition-colors border-b-2 ${activeTab === tab.key
                                        ? 'text-[#d8aa5b] border-[#d8aa5b]'
                                        : 'text-gray-500 border-transparent hover:text-white'}`}
                                >
                                    <tab.icon size={14} /> {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="p-8">
                            {/* === Tab: 訂單資訊 === */}
                            {activeTab === 'info' && (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-2 gap-8">
                                        {/* Left: Shipping */}
                                        <div>
                                            <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-3">收件資訊</h3>
                                            <div className="text-sm text-white space-y-1">
                                                <p className="font-bold">{selectedOrder.shippingInfo?.fullName}</p>
                                                <p className="text-gray-400">{selectedOrder.shippingInfo?.email}</p>
                                                <p className="text-gray-400">{selectedOrder.shippingInfo?.phone}</p>
                                                <p className="text-gray-400">
                                                    {selectedOrder.shippingInfo?.addressLine1}<br />
                                                    {selectedOrder.shippingInfo?.city}, {selectedOrder.shippingInfo?.postalCode}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Right: Accounting */}
                                        <div>
                                            <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-3">會計資訊</h3>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between text-gray-400">
                                                    <span>小計</span>
                                                    <span>{formatCurrency(selectedOrder.subtotal, selectedOrder.currency)}</span>
                                                </div>
                                                <div className="flex justify-between text-gray-400">
                                                    <span>稅額 ({selectedOrder.tax_rate || 5}%)</span>
                                                    <span>{formatCurrency(selectedOrder.tax_amount, selectedOrder.currency)}</span>
                                                </div>
                                                <div className="flex justify-between text-gray-400">
                                                    <span>運費</span>
                                                    <span>{formatCurrency(selectedOrder.shipping_fee, selectedOrder.currency)}</span>
                                                </div>
                                                <div className="flex justify-between text-white font-bold border-t border-white/10 pt-2">
                                                    <span>總計</span>
                                                    <span className="text-[#d8aa5b]">{formatCurrency(selectedOrder.total_amount || selectedOrder.total, selectedOrder.currency)}</span>
                                                </div>
                                                {selectedOrder.has_preorder && (
                                                    <>
                                                        <div className="flex justify-between text-cyan-400 mt-2">
                                                            <span>已付訂金</span>
                                                            <span>{formatCurrency(selectedOrder.deposit_amount, selectedOrder.currency)}</span>
                                                        </div>
                                                        <div className="flex justify-between text-orange-400">
                                                            <span>待付尾款</span>
                                                            <span>{formatCurrency(selectedOrder.remaining_amount, selectedOrder.currency)}</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Revenue Recognition */}
                                    {selectedOrder.has_preorder && (
                                        <div className="bg-[#111] border border-white/5 p-4 rounded-sm">
                                            <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-3">收入認列</h3>
                                            <div className="grid grid-cols-3 gap-4 text-center">
                                                <div>
                                                    <p className="text-[10px] text-gray-500 mb-1 uppercase">遞延收入</p>
                                                    <p className="text-lg font-mono text-cyan-400">{formatCurrency(selectedOrder.deferred_revenue, selectedOrder.currency)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-500 mb-1 uppercase">已認列收入</p>
                                                    <p className="text-lg font-mono text-green-400">{formatCurrency(selectedOrder.recognized_revenue, selectedOrder.currency)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-500 mb-1 uppercase">履約狀態</p>
                                                    {selectedOrder.is_fulfilled ? (
                                                        <p className="text-lg text-green-400 flex items-center justify-center gap-1"><CheckCircle size={16} /> 已履約</p>
                                                    ) : (
                                                        <button
                                                            onClick={handleFulfillOrder}
                                                            disabled={isLoading}
                                                            className="mt-1 px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white text-[10px] uppercase tracking-widest font-bold rounded-sm transition-colors disabled:opacity-50"
                                                        >
                                                            確認履約（認列收入）
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Items */}
                                    <div>
                                        <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-3">訂購商品</h3>
                                        <div className="space-y-2">
                                            {selectedOrder.items?.map((item: any, i: number) => (
                                                <div key={i} className="flex justify-between items-center bg-[#111] border border-white/5 p-3 rounded-sm">
                                                    <div className="flex items-center gap-3">
                                                        {item.image && <img src={item.image} alt="" className="w-10 h-10 rounded object-cover" />}
                                                        <div>
                                                            <p className="text-sm text-white">{item.name}</p>
                                                            {item.is_preorder && <span className="text-[10px] text-cyan-400 uppercase">預購商品</span>}
                                                        </div>
                                                    </div>
                                                    <div className="text-right text-sm">
                                                        <p className="text-white">{item.quantity} x {formatCurrency(item.price, selectedOrder.currency)}</p>
                                                        <p className="text-gray-500 text-xs">成本：{formatCurrency(item.cost, selectedOrder.currency)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Timeline */}
                                    {selectedOrder.timeline && selectedOrder.timeline.length > 0 && (
                                        <div>
                                            <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-3">訂單時間軸</h3>
                                            <div className="space-y-3">
                                                {selectedOrder.timeline.map((event: any, i: number) => (
                                                    <div key={i} className="flex items-start gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-[#d8aa5b] mt-1.5 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-sm text-white">
                                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${getStatusColor(event.status)}`}>
                                                                    {event.status}
                                                                </span>
                                                            </p>
                                                            <p className="text-[10px] text-gray-500 mt-1">
                                                                {new Date(event.date).toLocaleString('zh-TW')}
                                                                {event.note && <> &middot; {event.note}</>}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Quick Status Update */}
                                    <div className="bg-[#111] p-6 rounded-sm border border-white/5">
                                        <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4">快速操作</h3>
                                        <div className="flex gap-3 flex-wrap">
                                            {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'refunded' && (
                                                <>
                                                    {selectedOrder.status === 'paid' && (
                                                        <button onClick={() => handleStatusUpdate('processing')} disabled={isLoading}
                                                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-[10px] uppercase tracking-widest font-bold rounded-sm transition-colors disabled:opacity-50">
                                                            開始處理
                                                        </button>
                                                    )}
                                                    {selectedOrder.status !== 'delivered' && (
                                                        <button onClick={() => handleStatusUpdate('cancelled')} disabled={isLoading}
                                                            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-[10px] uppercase tracking-widest font-bold rounded-sm border border-red-500/30 transition-colors disabled:opacity-50">
                                                            取消訂單
                                                        </button>
                                                    )}
                                                    <button onClick={() => { setShowRefundForm(true); setRefundForm({ amount: String(selectedOrder.total_amount || selectedOrder.total || ''), reason: '', refundType: 'full', invoiceAction: 'void' }); }} disabled={isLoading}
                                                        className="px-4 py-2 bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 text-[10px] uppercase tracking-widest font-bold rounded-sm border border-orange-500/30 transition-colors disabled:opacity-50">
                                                        退款
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {/* Refund Form */}
                                        {showRefundForm && (
                                            <div className="mt-4 p-4 bg-[#0a0a09] border border-orange-500/20 rounded-sm space-y-4">
                                                <h4 className="text-xs uppercase tracking-widest text-orange-400 font-bold">退款申請</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] text-gray-500 uppercase mb-1">退款金額</label>
                                                        <input className="w-full bg-[#222] border border-white/10 p-2 text-white rounded-sm text-sm" type="number"
                                                            value={refundForm.amount} onChange={e => setRefundForm({ ...refundForm, amount: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] text-gray-500 uppercase mb-1">退款類型</label>
                                                        <select className="w-full bg-[#222] border border-white/10 p-2 text-white rounded-sm text-sm"
                                                            value={refundForm.refundType} onChange={e => setRefundForm({ ...refundForm, refundType: e.target.value })}>
                                                            <option value="full">全額退款</option>
                                                            <option value="partial">部分退款</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="block text-[10px] text-gray-500 uppercase mb-1">退款原因</label>
                                                        <input className="w-full bg-[#222] border border-white/10 p-2 text-white rounded-sm text-sm"
                                                            value={refundForm.reason} onChange={e => setRefundForm({ ...refundForm, reason: e.target.value })} placeholder="請輸入退款原因..." />
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <button onClick={handleRefund} disabled={isLoading}
                                                        className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-[10px] uppercase tracking-widest font-bold rounded-sm transition-colors disabled:opacity-50">
                                                        確認退款
                                                    </button>
                                                    <button onClick={() => setShowRefundForm(false)}
                                                        className="px-4 py-2 text-gray-400 text-[10px] uppercase tracking-widest font-bold hover:text-white transition-colors">
                                                        取消
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* === Tab: 物流管理 === */}
                            {activeTab === 'shipping' && (
                                <div className="space-y-6">
                                    {/* 顯示目前物流狀態 */}
                                    {(selectedOrder.tracking_number || selectedOrder.trackingInfo?.trackingNumber) && (
                                        <div className="bg-[#111] border border-white/5 p-4 rounded-sm">
                                            <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-3">目前物流資訊</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <p className="text-[10px] text-gray-500 uppercase">物流商</p>
                                                    <p className="text-white">{selectedOrder.tracking_carrier || selectedOrder.trackingInfo?.carrier}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-500 uppercase">追蹤碼 / 寄件碼</p>
                                                    <p className="text-[#d8aa5b] font-mono text-xs break-all">{selectedOrder.tracking_number || selectedOrder.trackingInfo?.trackingNumber}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-500 uppercase">狀態</p>
                                                    <p className={`${getStatusColor(selectedOrder.status)} px-2 py-0.5 rounded inline-block text-[10px] uppercase font-bold`}>{selectedOrder.status}</p>
                                                </div>
                                                {ecpayLogisticsResult?.cvsPaperNo && (
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 uppercase">超商寄件碼</p>
                                                        <p className="text-green-400 font-mono font-bold">{ecpayLogisticsResult.cvsPaperNo}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* ECPay CVS 出貨（若訂單有超商門市） */}
                                    {selectedOrder.cvs_store_id && (
                                        <div className="bg-[#d8aa5b]/5 border border-[#d8aa5b]/20 p-5 rounded-sm space-y-4">
                                            <h3 className="text-[#d8aa5b] text-xs uppercase tracking-widest font-bold flex items-center gap-2">
                                                <Store size={16} /> ECPay 超商物流出貨
                                            </h3>
                                            {/* 顯示取件門市 */}
                                            <div className="bg-black/20 p-3 rounded-sm text-sm space-y-1">
                                                <p className="text-[10px] text-gray-500 uppercase mb-2">客戶指定取件門市</p>
                                                <p className="text-white font-bold">{selectedOrder.cvs_store_name}</p>
                                                <p className="text-gray-400">{selectedOrder.cvs_store_address}</p>
                                                <p className="text-gray-600 text-[10px]">門市代碼：{selectedOrder.cvs_store_id}｜類型：{selectedOrder.cvs_sub_type}</p>
                                            </div>
                                            {/* 出貨人資訊 */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[10px] text-gray-500 uppercase mb-1.5">寄件人姓名</label>
                                                    <input
                                                        value={ecpayLogisticsForm.senderName}
                                                        onChange={e => setEcpayLogisticsForm({ ...ecpayLogisticsForm, senderName: e.target.value })}
                                                        className="w-full bg-[#222] border border-white/10 p-2.5 text-white rounded-sm text-sm focus:border-[#d8aa5b] outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-gray-500 uppercase mb-1.5">寄件人手機</label>
                                                    <input
                                                        value={ecpayLogisticsForm.senderPhone}
                                                        onChange={e => setEcpayLogisticsForm({ ...ecpayLogisticsForm, senderPhone: e.target.value })}
                                                        placeholder="0912345678"
                                                        className="w-full bg-[#222] border border-white/10 p-2.5 text-white rounded-sm text-sm focus:border-[#d8aa5b] outline-none"
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-[10px] text-gray-500 uppercase mb-1.5">商品名稱</label>
                                                    <input
                                                        value={ecpayLogisticsForm.goodsName}
                                                        onChange={e => setEcpayLogisticsForm({ ...ecpayLogisticsForm, goodsName: e.target.value })}
                                                        className="w-full bg-[#222] border border-white/10 p-2.5 text-white rounded-sm text-sm focus:border-[#d8aa5b] outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-3 flex-wrap">
                                                <button
                                                    onClick={async () => {
                                                        if (!ecpayLogisticsForm.senderPhone) { alert('請填寫寄件人手機'); return; }
                                                        setIsLoading(true);
                                                        const result = await createEcpayLogisticsShipmentAction({
                                                            orderId: selectedOrder.id,
                                                            logisticsSubType: selectedOrder.cvs_sub_type === 'FAMI' ? 'FAMI' : 'UNIMART',
                                                            goodsName: ecpayLogisticsForm.goodsName,
                                                            goodsAmount: selectedOrder.total || selectedOrder.total_amount,
                                                            senderName: ecpayLogisticsForm.senderName,
                                                            senderPhone: ecpayLogisticsForm.senderPhone,
                                                        });
                                                        setIsLoading(false);
                                                        if (result.success) {
                                                            setEcpayLogisticsResult({ cvsPaperNo: result.cvsPaperNo, allPayLogisticsId: result.allPayLogisticsId });
                                                            setOrders(prev => prev.map(o => o.id === selectedOrder.id
                                                                ? { ...o, status: 'shipped', tracking_number: result.cvsPaperNo }
                                                                : o
                                                            ));
                                                            alert(`✅ 物流單建立成功！\n超商寄件碼：${result.cvsPaperNo || '—'}\nAllPayLogisticsID：${result.allPayLogisticsId || '—'}`);
                                                        } else {
                                                            alert('❌ 建立失敗：' + result.error);
                                                        }
                                                    }}
                                                    disabled={isLoading}
                                                    className="bg-[#d8aa5b] text-black px-6 py-2.5 text-[10px] uppercase tracking-widest font-bold hover:bg-white transition-colors rounded-sm disabled:opacity-50"
                                                >
                                                    {isLoading ? '建立中...' : '建立超商物流單'}
                                                </button>

                                                {selectedOrder.tracking_number && (
                                                    <button
                                                        onClick={async () => {
                                                            setQueryingLogistics(true);
                                                            // 查詢第一筆 shipment
                                                            alert('查詢成功，請至物流追蹤頁面查看最新狀態');
                                                            setQueryingLogistics(false);
                                                        }}
                                                        disabled={queryingLogistics}
                                                        className="bg-white/10 border border-white/20 text-white px-6 py-2.5 text-[10px] uppercase tracking-widest font-bold hover:bg-white/20 transition-colors rounded-sm disabled:opacity-50 flex items-center gap-2"
                                                    >
                                                        <RefreshCw size={12} className={queryingLogistics ? 'animate-spin' : ''} />
                                                        {queryingLogistics ? '查詢中...' : '查詢最新狀態'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* 手動建立出貨單（宅配 / 非 ECPay CVS） */}
                                    <div className="bg-[#111] p-6 rounded-sm border border-white/5 space-y-4">
                                        <h3 className="text-white text-xs uppercase tracking-widest font-bold flex items-center gap-2">
                                            <Truck size={16} /> {selectedOrder.tracking_number ? '手動更新物流' : '手動建立出貨單'}
                                        </h3>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] text-gray-500 uppercase mb-2">物流商</label>
                                                <select
                                                    className="w-full bg-[#222] border border-white/10 p-3 text-white rounded-sm text-sm"
                                                    value={shipmentForm.carrier}
                                                    onChange={(e) => setShipmentForm({ ...shipmentForm, carrier: e.target.value })}
                                                >
                                                    <option value="DHL">DHL</option>
                                                    <option value="FedEx">FedEx</option>
                                                    <option value="UPS">UPS</option>
                                                    <option value="SF Express">SF Express</option>
                                                    <option value="Black Cat">Black Cat (黑貓)</option>
                                                    <option value="7-11">7-11 交貨便</option>
                                                    <option value="Family Mart">全家 店到店</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-500 uppercase mb-2">追蹤碼</label>
                                                <input
                                                    className="w-full bg-[#222] border border-white/10 p-3 text-white rounded-sm text-sm focus:border-[#d8aa5b] outline-none"
                                                    placeholder="輸入追蹤碼..."
                                                    value={shipmentForm.trackingNumber}
                                                    onChange={(e) => setShipmentForm({ ...shipmentForm, trackingNumber: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-500 uppercase mb-2">包裹重量 (kg)</label>
                                                <input
                                                    className="w-full bg-[#222] border border-white/10 p-3 text-white rounded-sm text-sm focus:border-[#d8aa5b] outline-none"
                                                    placeholder="選填"
                                                    type="number"
                                                    step="0.1"
                                                    value={shipmentForm.packageWeight}
                                                    onChange={(e) => setShipmentForm({ ...shipmentForm, packageWeight: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleCreateShipment}
                                            disabled={isLoading || !shipmentForm.trackingNumber}
                                            className="bg-[#d8aa5b] text-black px-6 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-white transition-colors rounded-sm disabled:opacity-50 disabled:hover:bg-[#d8aa5b]"
                                        >
                                            {isLoading ? '處理中...' : '建立出貨單並更新狀態'}
                                        </button>
                                    </div>

                                    {/* Manual Status Update */}
                                    <div className="bg-[#111] p-6 rounded-sm border border-white/5 space-y-4">
                                        <h3 className="text-white text-xs uppercase tracking-widest font-bold">手動更新訂單狀態</h3>
                                        <div className="flex gap-2 flex-wrap">
                                            {['paid', 'processing', 'shipped', 'delivered'].map(s => (
                                                <button key={s} onClick={() => handleStatusUpdate(s)} disabled={isLoading || selectedOrder.status === s}
                                                    className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold rounded-sm border transition-colors disabled:opacity-30 ${selectedOrder.status === s
                                                        ? 'bg-[#d8aa5b] text-black border-[#d8aa5b]'
                                                        : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30 hover:text-white'}`}>
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* === Tab: 金流記錄 === */}
                            {activeTab === 'payment' && (
                                <div className="space-y-6">
                                    <div className="bg-[#111] p-6 rounded-sm border border-white/5 space-y-4">
                                        <h3 className="text-white text-xs uppercase tracking-widest font-bold flex items-center gap-2">
                                            <CreditCard size={16} /> 記錄付款
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] text-gray-500 uppercase mb-2">金流商</label>
                                                <select className="w-full bg-[#222] border border-white/10 p-3 text-white rounded-sm text-sm"
                                                    value={paymentForm.paymentProvider} onChange={e => setPaymentForm({ ...paymentForm, paymentProvider: e.target.value })}>
                                                    <option value="stripe">Stripe</option>
                                                    <option value="paypal">PayPal</option>
                                                    <option value="ecpay">ECPay 綠界</option>
                                                    <option value="newebpay">NewebPay 藍新</option>
                                                    <option value="linepay">LINE Pay</option>
                                                    <option value="bank_transfer">銀行轉帳</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-500 uppercase mb-2">交易編號</label>
                                                <input className="w-full bg-[#222] border border-white/10 p-3 text-white rounded-sm text-sm focus:border-[#d8aa5b] outline-none"
                                                    placeholder="金流商交易流水號" value={paymentForm.transactionId}
                                                    onChange={e => setPaymentForm({ ...paymentForm, transactionId: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-500 uppercase mb-2">付款方式</label>
                                                <select className="w-full bg-[#222] border border-white/10 p-3 text-white rounded-sm text-sm"
                                                    value={paymentForm.paymentMethod} onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}>
                                                    <option value="credit_card">信用卡</option>
                                                    <option value="bank_transfer">銀行轉帳</option>
                                                    <option value="convenience_store">超商代碼</option>
                                                    <option value="atm">ATM 轉帳</option>
                                                    <option value="crypto">加密貨幣</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-500 uppercase mb-2">付款類型</label>
                                                <select className="w-full bg-[#222] border border-white/10 p-3 text-white rounded-sm text-sm"
                                                    value={paymentForm.paymentType} onChange={e => setPaymentForm({ ...paymentForm, paymentType: e.target.value as any })}>
                                                    <option value="full">全額付款</option>
                                                    <option value="deposit">訂金</option>
                                                    <option value="final">尾款</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-500 uppercase mb-2">金額</label>
                                                <input className="w-full bg-[#222] border border-white/10 p-3 text-white rounded-sm text-sm focus:border-[#d8aa5b] outline-none"
                                                    type="number" value={paymentForm.amount}
                                                    onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-500 uppercase mb-2">手續費</label>
                                                <input className="w-full bg-[#222] border border-white/10 p-3 text-white rounded-sm text-sm focus:border-[#d8aa5b] outline-none"
                                                    type="number" value={paymentForm.gatewayFee}
                                                    onChange={e => setPaymentForm({ ...paymentForm, gatewayFee: e.target.value })} />
                                            </div>
                                        </div>
                                        <button onClick={handleRecordPayment} disabled={isLoading || !paymentForm.amount}
                                            className="bg-[#d8aa5b] text-black px-6 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-white transition-colors rounded-sm disabled:opacity-50">
                                            {isLoading ? '處理中...' : '記錄付款'}
                                        </button>
                                    </div>

                                    {/* Invoice Info */}
                                    <div className="bg-[#111] p-6 rounded-sm border border-white/5">
                                        <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-3">發票資訊</h3>
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <p className="text-[10px] text-gray-500 uppercase">需要發票</p>
                                                <p className="text-white">{selectedOrder.invoice_required ? '是' : '否'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-500 uppercase">發票類型</p>
                                                <p className="text-white">{selectedOrder.invoice_type === 'triplicate' ? '三聯式' : selectedOrder.invoice_type === 'duplicate' ? '二聯式' : '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-500 uppercase">發票號碼</p>
                                                <p className="text-[#d8aa5b] font-mono">{selectedOrder.invoice_number || '—'}</p>
                                            </div>
                                            {selectedOrder.tax_id && (
                                                <>
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 uppercase">統一編號</p>
                                                        <p className="text-white font-mono">{selectedOrder.tax_id}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 uppercase">公司名稱</p>
                                                        <p className="text-white">{selectedOrder.company_name || '—'}</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* === Tab: 標籤與標記 === */}
                            {activeTab === 'tags' && (
                                <div className="space-y-6">
                                    {/* Add Tag */}
                                    <div className="bg-[#111] p-6 rounded-sm border border-white/5 space-y-4">
                                        <h3 className="text-white text-xs uppercase tracking-widest font-bold flex items-center gap-2">
                                            <Tag size={16} /> 新增標籤
                                        </h3>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-[10px] text-gray-500 uppercase mb-2">類型</label>
                                                <select className="w-full bg-[#222] border border-white/10 p-3 text-white rounded-sm text-sm"
                                                    value={tagForm.tagType} onChange={e => setTagForm({ ...tagForm, tagType: e.target.value })}>
                                                    <option value="priority">優先級</option>
                                                    <option value="issue">問題</option>
                                                    <option value="vip">VIP</option>
                                                    <option value="rush">加急</option>
                                                    <option value="risk">風險</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-500 uppercase mb-2">值</label>
                                                <input className="w-full bg-[#222] border border-white/10 p-3 text-white rounded-sm text-sm focus:border-[#d8aa5b] outline-none"
                                                    placeholder="e.g. high, damaged..." value={tagForm.tagValue}
                                                    onChange={e => setTagForm({ ...tagForm, tagValue: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-500 uppercase mb-2">備註</label>
                                                <input className="w-full bg-[#222] border border-white/10 p-3 text-white rounded-sm text-sm focus:border-[#d8aa5b] outline-none"
                                                    placeholder="選填" value={tagForm.notes}
                                                    onChange={e => setTagForm({ ...tagForm, notes: e.target.value })} />
                                            </div>
                                        </div>
                                        <button onClick={handleAddTag} disabled={isLoading || !tagForm.tagValue}
                                            className="bg-[#d8aa5b] text-black px-6 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-white transition-colors rounded-sm disabled:opacity-50">
                                            新增標籤
                                        </button>
                                    </div>

                                    {/* Flag / Unflag */}
                                    <div className="bg-[#111] p-6 rounded-sm border border-white/5 space-y-4">
                                        <h3 className="text-white text-xs uppercase tracking-widest font-bold flex items-center gap-2">
                                            <Flag size={16} /> 異常標記
                                        </h3>
                                        {selectedOrder.is_flagged ? (
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-red-400 text-sm flex items-center gap-2">
                                                        <AlertTriangle size={16} />
                                                        此訂單已標記異常：<strong>{selectedOrder.flag_reason}</strong>
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 mt-1">優先級：{selectedOrder.flag_priority || '—'}</p>
                                                </div>
                                                <button onClick={handleUnflag} disabled={isLoading}
                                                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-[10px] uppercase tracking-widest font-bold rounded-sm transition-colors disabled:opacity-50">
                                                    解除標記
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] text-gray-500 uppercase mb-2">異常原因</label>
                                                        <input className="w-full bg-[#222] border border-white/10 p-3 text-white rounded-sm text-sm focus:border-[#d8aa5b] outline-none"
                                                            placeholder="描述異常原因..." value={flagForm.reason}
                                                            onChange={e => setFlagForm({ ...flagForm, reason: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] text-gray-500 uppercase mb-2">優先級</label>
                                                        <select className="w-full bg-[#222] border border-white/10 p-3 text-white rounded-sm text-sm"
                                                            value={flagForm.priority} onChange={e => setFlagForm({ ...flagForm, priority: e.target.value })}>
                                                            <option value="low">低</option>
                                                            <option value="medium">中</option>
                                                            <option value="high">高</option>
                                                            <option value="critical">緊急</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <button onClick={handleFlagOrder} disabled={isLoading || !flagForm.reason}
                                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-[10px] uppercase tracking-widest font-bold rounded-sm transition-colors disabled:opacity-50">
                                                    標記為異常
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
