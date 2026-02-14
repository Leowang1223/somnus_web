'use client';

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getOrderAction, trackShipmentAction } from "@/app/actions";
import { Loader2, Search, CheckCircle, Package, Truck, Home, AlertCircle, Clock, MapPin, ArrowRight, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

function TrackingContent() {
    const searchParams = useSearchParams();
    const initialId = searchParams.get('id') || '';
    const [searchInput, setSearchInput] = useState(initialId);
    const [order, setOrder] = useState<any>(null);
    const [shipment, setShipment] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchMode, setSearchMode] = useState<'order' | 'tracking'>('order');

    useEffect(() => {
        if (initialId) handleSearch(initialId);
    }, [initialId]);

    const handleSearch = async (id: string) => {
        if (!id.trim()) return;
        setLoading(true);
        setError('');
        setOrder(null);
        setShipment(null);

        // Try order ID first
        const orderResult = await getOrderAction(id.trim());
        if (orderResult.success && orderResult.order) {
            setOrder(orderResult.order);
            setSearchMode('order');
            setLoading(false);
            return;
        }

        // Try tracking number
        const trackResult = await trackShipmentAction(id.trim());
        if (trackResult.success) {
            setShipment(trackResult.shipment);
            if (trackResult.order) {
                const fullOrder = await getOrderAction(trackResult.order.id);
                if (fullOrder.success) setOrder(fullOrder.order);
            }
            setSearchMode('tracking');
            setLoading(false);
            return;
        }

        setError('找不到此訂單或追蹤碼。請確認您的訂單編號或物流追蹤碼。');
        setLoading(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch(searchInput);
    };

    const getStatusStep = (status: string) => {
        switch (status) {
            case 'paid': return 1;
            case 'processing': return 2;
            case 'shipped': return 3;
            case 'delivered': return 4;
            case 'preorder_confirmed': return 0.5;
            case 'preorder_ready': return 1;
            case 'cancelled': return -1;
            case 'refunded': return -1;
            default: return 0;
        }
    };

    const steps = [
        { label: '訂單確認', icon: CheckCircle },
        { label: '準備出貨', icon: Package },
        { label: '運送中', icon: Truck },
        { label: '已送達', icon: Home }
    ];

    const currentStep = order ? getStatusStep(order.status) : 0;
    const isCancelledOrRefunded = order && (order.status === 'cancelled' || order.status === 'refunded');

    const shipmentStatusUpdates = shipment?.status_updates || [];

    const getShipmentStatusLabel = (status: string) => {
        const map: Record<string, string> = {
            preparing: '準備中',
            picked_up: '已取件',
            in_transit: '運送中',
            out_for_delivery: '配送中',
            delivered: '已送達',
            failed: '配送失敗',
            returned: '已退回',
        };
        return map[status] || status;
    };

    const getShipmentStatusColor = (status: string) => {
        const map: Record<string, string> = {
            preparing: 'text-gray-400',
            picked_up: 'text-blue-400',
            in_transit: 'text-purple-400',
            out_for_delivery: 'text-[#d8aa5b]',
            delivered: 'text-green-400',
            failed: 'text-red-400',
            returned: 'text-orange-400',
        };
        return map[status] || 'text-gray-400';
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white pt-32 pb-12 px-6">
            <div className="container mx-auto max-w-3xl">
                <div className="text-center mb-16">
                    <h1 className="font-display text-4xl mb-4">追蹤您的訂單</h1>
                    <p className="text-gray-500 font-light">輸入訂單編號或物流追蹤碼來查看配送狀態。</p>
                </div>

                {/* Search Box */}
                <div className="flex gap-4 mb-16 max-w-xl mx-auto">
                    <input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="訂單編號 SOM-... 或物流追蹤碼"
                        className="flex-1 bg-[#111] border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b] rounded-sm font-mono tracking-wider"
                    />
                    <button
                        onClick={() => handleSearch(searchInput)}
                        disabled={loading}
                        className="bg-[#d8aa5b] text-black px-8 font-bold uppercase tracking-widest hover:bg-white transition-colors rounded-sm disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Search />}
                    </button>
                </div>

                {error && (
                    <div className="bg-red-900/20 border border-red-500/20 p-4 text-red-400 text-center mb-12 rounded-sm flex items-center justify-center gap-2">
                        <AlertCircle size={18} /> {error}
                    </div>
                )}

                {order && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        {/* Order Header */}
                        <div className="bg-[#111] border border-white/5 rounded-sm p-8 md:p-12 relative overflow-hidden">
                            {/* Preorder Banner */}
                            {order.has_preorder && order.status === 'preorder_confirmed' && (
                                <div className="mb-8 bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-sm flex items-center gap-3">
                                    <Clock size={18} className="text-cyan-400 flex-shrink-0" />
                                    <div>
                                        <p className="text-cyan-400 text-sm font-bold">預購訂單</p>
                                        <p className="text-gray-400 text-xs">
                                            預計出貨日期：{order.preorder_info?.expectedShipDate
                                                ? new Date(order.preorder_info.expectedShipDate).toLocaleDateString('zh-TW')
                                                : '待確認'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Cancelled / Refunded Banner */}
                            {isCancelledOrRefunded && (
                                <div className="mb-8 bg-red-500/10 border border-red-500/20 p-4 rounded-sm flex items-center gap-3">
                                    <XCircle size={18} className="text-red-400 flex-shrink-0" />
                                    <div>
                                        <p className="text-red-400 text-sm font-bold">
                                            {order.status === 'cancelled' ? '訂單已取消' : '訂單已退款'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Status Bar (only if not cancelled) */}
                            {!isCancelledOrRefunded && (
                                <div className="relative mb-16">
                                    <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 -translate-y-1/2 z-0"></div>
                                    <div
                                        className="absolute top-1/2 left-0 h-1 bg-[#d8aa5b] -translate-y-1/2 z-0 transition-all duration-1000"
                                        style={{ width: `${Math.max(0, ((currentStep - 1) / (steps.length - 1)) * 100)}%` }}
                                    ></div>

                                    <div className="relative z-10 flex justify-between">
                                        {steps.map((step, idx) => {
                                            const isActive = idx + 1 <= currentStep;
                                            const isCurrent = idx + 1 === Math.ceil(currentStep);

                                            return (
                                                <div key={idx} className="flex flex-col items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 bg-[#111] ${isActive ? 'border-[#d8aa5b] text-[#d8aa5b]' : 'border-white/20 text-white/20'} ${isCurrent ? 'shadow-[0_0_20px_rgba(216,170,91,0.5)] scale-110' : ''}`}>
                                                        <step.icon size={18} />
                                                    </div>
                                                    <span className={`text-[10px] uppercase tracking-widest font-bold ${isActive ? 'text-white' : 'text-white/20'}`}>{step.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Order Info & Logistics */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-white/10 pt-12">
                                <div>
                                    <h3 className="text-[#d8aa5b] text-xs uppercase tracking-widest font-bold mb-6">物流資訊</h3>
                                    {order.trackingInfo?.trackingNumber ? (
                                        <div className="space-y-4">
                                            <div>
                                                <span className="text-gray-500 text-xs block mb-1">追蹤碼</span>
                                                <span className="text-white font-mono text-lg">{order.trackingInfo.trackingNumber}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 text-xs block mb-1">物流商</span>
                                                <span className="text-white">{order.trackingInfo.carrier}</span>
                                            </div>
                                            {shipment?.current_location && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={14} className="text-[#d8aa5b]" />
                                                    <span className="text-gray-400 text-sm">{shipment.current_location}</span>
                                                </div>
                                            )}
                                            {order.estimated_delivery_date && (
                                                <div>
                                                    <span className="text-gray-500 text-xs block mb-1">預計送達</span>
                                                    <span className="text-white">{new Date(order.estimated_delivery_date).toLocaleDateString('zh-TW')}</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 italic text-sm">物流追蹤資訊將在出貨後顯示。</p>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-[#d8aa5b] text-xs uppercase tracking-widest font-bold mb-6">收件資訊</h3>
                                    <p className="text-white text-lg mb-2">{order.shippingInfo?.fullName}</p>
                                    <p className="text-gray-400 leading-relaxed text-sm">
                                        {order.shippingInfo?.addressLine1}<br />
                                        {order.shippingInfo?.city}, {order.shippingInfo?.postalCode}<br />
                                        {order.shippingInfo?.country}
                                    </p>
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="mt-8 pt-8 border-t border-white/10">
                                <h3 className="text-[#d8aa5b] text-xs uppercase tracking-widest font-bold mb-4">訂單明細</h3>
                                <div className="space-y-2 mb-4">
                                    {order.items?.map((item: any, i: number) => (
                                        <div key={i} className="flex justify-between text-sm">
                                            <span className="text-gray-400 flex items-center gap-2">
                                                {item.quantity}x {item.name}
                                                {item.is_preorder && <span className="text-[10px] text-cyan-400 uppercase px-1.5 py-0.5 bg-cyan-500/10 rounded">預購</span>}
                                            </span>
                                            <span className="text-white font-mono">NT${(item.price * item.quantity).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-white/10 pt-3 space-y-1">
                                    {order.subtotal && (
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>小計</span>
                                            <span>NT${order.subtotal.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {order.tax_amount > 0 && (
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>稅額</span>
                                            <span>NT${order.tax_amount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {order.shipping_fee > 0 && (
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>運費</span>
                                            <span>NT${order.shipping_fee.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-bold pt-2">
                                        <span className="text-gray-300">總計</span>
                                        <span className="text-[#d8aa5b] font-display text-lg">NT${(order.total_amount || order.total || 0).toLocaleString()}</span>
                                    </div>
                                    {order.has_preorder && order.deposit_amount > 0 && (
                                        <div className="flex justify-between text-xs text-cyan-400 pt-1">
                                            <span>已付訂金</span>
                                            <span>NT${order.deposit_amount.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Shipment Timeline (if available) */}
                        {shipmentStatusUpdates.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-[#111] border border-white/5 rounded-sm p-8"
                            >
                                <h3 className="text-white text-xs uppercase tracking-widest font-bold mb-6 flex items-center gap-2">
                                    <Truck size={16} className="text-[#d8aa5b]" /> 物流追蹤時間軸
                                </h3>
                                <div className="space-y-0">
                                    {shipmentStatusUpdates.slice().reverse().map((update: any, i: number) => (
                                        <div key={i} className="flex gap-4 relative">
                                            {/* Timeline line */}
                                            {i < shipmentStatusUpdates.length - 1 && (
                                                <div className="absolute left-[7px] top-6 w-0.5 h-full bg-white/10" />
                                            )}
                                            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 relative z-10 bg-[#111] ${i === 0 ? 'border-[#d8aa5b]' : 'border-white/20'}`} />
                                            <div className="pb-6">
                                                <p className={`text-sm font-bold ${i === 0 ? 'text-white' : 'text-gray-400'}`}>
                                                    <span className={getShipmentStatusColor(update.status)}>
                                                        {getShipmentStatusLabel(update.status)}
                                                    </span>
                                                </p>
                                                {update.description && (
                                                    <p className="text-xs text-gray-500 mt-1">{update.description}</p>
                                                )}
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] text-gray-600 font-mono">{new Date(update.timestamp).toLocaleString('zh-TW')}</span>
                                                    {update.location && (
                                                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                                            <MapPin size={10} /> {update.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Order Activity Log */}
                        {order.timeline && order.timeline.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-[#111] border border-white/5 rounded-sm p-8"
                            >
                                <h3 className="text-white text-xs uppercase tracking-widest font-bold mb-4">訂單歷程</h3>
                                <div className="space-y-4">
                                    {order.timeline.slice().reverse().map((log: any, i: number) => (
                                        <div key={i} className="flex gap-4 text-sm">
                                            <span className="text-gray-600 font-mono text-xs w-36 whitespace-nowrap flex-shrink-0">
                                                {new Date(log.date).toLocaleString('zh-TW')}
                                            </span>
                                            <span className="text-gray-300">{log.note}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Can Cancel Notice */}
                        {order.can_cancel_until && new Date(order.can_cancel_until) > new Date() && !isCancelledOrRefunded && (
                            <div className="text-center text-gray-500 text-xs">
                                可在 {new Date(order.can_cancel_until).toLocaleString('zh-TW')} 前取消訂單
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
}

export default function TrackOrderPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">Loading...</div>}>
            <TrackingContent />
        </Suspense>
    );
}
