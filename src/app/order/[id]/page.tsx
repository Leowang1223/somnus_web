'use client';

import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Truck, Clock, Package, Home, MapPin, ArrowLeft, XCircle, CreditCard, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getOrderAction, trackShipmentAction } from "@/app/actions";

export default function OrderDetailPage() {
    const params = useParams();
    const orderId = params.id as string;
    const [order, setOrder] = useState<any>(null);
    const [shipment, setShipment] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const result = await getOrderAction(orderId);
            if (result.success && result.order) {
                setOrder(result.order);
                // If order has tracking info, fetch shipment details
                if (result.order.trackingInfo?.trackingNumber) {
                    const trackResult = await trackShipmentAction(result.order.trackingInfo.trackingNumber);
                    if (trackResult.success) {
                        setShipment(trackResult.shipment);
                    }
                }
            }
            setLoading(false);
        }
        fetchData();
    }, [orderId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="text-white animate-pulse">載入訂單資料中...</div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center text-center p-6">
                <div>
                    <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
                    <h1 className="font-display text-3xl text-white mb-4">找不到訂單</h1>
                    <p className="text-gray-500 mb-8">訂單編號 <span className="font-mono text-white">{orderId}</span> 不存在。</p>
                    <Link href="/track-order" className="text-[#d8aa5b] text-xs uppercase tracking-widest font-bold hover:text-white transition-colors">
                        前往追蹤頁面
                    </Link>
                </div>
            </div>
        );
    }

    const isCancelled = order.status === 'cancelled' || order.status === 'refunded';
    const isPreorder = order.has_preorder;
    const statusUpdates = shipment?.status_updates || [];

    const getStatusStep = (status: string) => {
        if (isPreorder) {
            switch (status) {
                case 'preorder_confirmed': return 1;
                case 'preorder_ready': return 2;
                case 'paid': return 2;
                case 'processing': return 3;
                case 'shipped': return 4;
                case 'delivered': return 5;
                default: return 0;
            }
        }
        switch (status) {
            case 'paid': return 1;
            case 'processing': return 2;
            case 'shipped': return 3;
            case 'delivered': return 4;
            default: return 0;
        }
    };

    const steps = isPreorder
        ? [
            { label: '預購確認', icon: CheckCircle },
            { label: '備貨中', icon: Clock },
            { label: '準備出貨', icon: Package },
            { label: '運送中', icon: Truck },
            { label: '已送達', icon: Home }
        ]
        : [
            { label: '訂單確認', icon: CheckCircle },
            { label: '準備出貨', icon: Package },
            { label: '運送中', icon: Truck },
            { label: '已送達', icon: Home }
        ];

    const currentStep = getStatusStep(order.status);

    const getShipmentStatusLabel = (status: string) => {
        const map: Record<string, string> = {
            preparing: '準備中', picked_up: '已取件', in_transit: '運送中',
            out_for_delivery: '配送中', delivered: '已送達', failed: '配送失敗', returned: '已退回',
        };
        return map[status] || status;
    };

    const getShipmentStatusColor = (status: string) => {
        const map: Record<string, string> = {
            preparing: 'text-gray-400', picked_up: 'text-blue-400', in_transit: 'text-purple-400',
            out_for_delivery: 'text-[#d8aa5b]', delivered: 'text-green-400', failed: 'text-red-400', returned: 'text-orange-400',
        };
        return map[status] || 'text-gray-400';
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white pt-28 pb-12 px-6">
            <div className="container mx-auto max-w-4xl">
                {/* Back Link */}
                <Link href="/track-order" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 text-xs uppercase tracking-widest">
                    <ArrowLeft size={16} /> 返回追蹤頁面
                </Link>

                {/* Order Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="font-display text-3xl text-white mb-1">
                                訂單 <span className="text-[#d8aa5b]">{order.id}</span>
                            </h1>
                            <p className="text-gray-500 text-sm">
                                下單時間：{new Date(order.date).toLocaleString('zh-TW')}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[#d8aa5b] font-display text-2xl">NT${(order.total_amount || order.total || 0).toLocaleString()}</p>
                            {isPreorder && order.deposit_amount > 0 && (
                                <p className="text-cyan-400 text-xs">已付訂金：NT${order.deposit_amount.toLocaleString()}</p>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Banners */}
                {isCancelled && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-sm flex items-center gap-3">
                        <XCircle size={18} className="text-red-400" />
                        <p className="text-red-400 text-sm font-bold">
                            {order.status === 'cancelled' ? '此訂單已取消' : '此訂單已退款'}
                        </p>
                    </motion.div>
                )}

                {isPreorder && order.status === 'preorder_confirmed' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="mb-6 bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-sm flex items-center gap-3">
                        <Clock size={18} className="text-cyan-400" />
                        <div>
                            <p className="text-cyan-400 text-sm font-bold">預購訂單</p>
                            <p className="text-gray-400 text-xs">
                                預計出貨：{order.preorder_info?.expectedShipDate
                                    ? new Date(order.preorder_info.expectedShipDate).toLocaleDateString('zh-TW')
                                    : '待確認'}
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Status Progress */}
                {!isCancelled && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="bg-[#111] border border-white/5 rounded-sm p-8 mb-6">
                        <div className="relative">
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 -translate-y-1/2 z-0" />
                            <div
                                className="absolute top-1/2 left-0 h-1 bg-[#d8aa5b] -translate-y-1/2 z-0 transition-all duration-1000"
                                style={{ width: `${Math.max(0, ((currentStep - 1) / (steps.length - 1)) * 100)}%` }}
                            />
                            <div className="relative z-10 flex justify-between">
                                {steps.map((step, idx) => {
                                    const isActive = idx + 1 <= currentStep;
                                    const isCurrent = idx + 1 === currentStep;
                                    return (
                                        <div key={idx} className="flex flex-col items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 bg-[#111] transition-all duration-500 ${isActive ? 'border-[#d8aa5b] text-[#d8aa5b]' : 'border-white/20 text-white/20'} ${isCurrent ? 'shadow-[0_0_20px_rgba(216,170,91,0.5)] scale-110' : ''}`}>
                                                <step.icon size={18} />
                                            </div>
                                            <span className={`text-[10px] uppercase tracking-widest font-bold ${isActive ? 'text-white' : 'text-white/20'}`}>{step.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Shipment Timeline */}
                        {statusUpdates.length > 0 && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                className="bg-[#111] border border-white/5 rounded-sm p-8">
                                <h3 className="text-white text-xs uppercase tracking-widest font-bold mb-6 flex items-center gap-2">
                                    <Truck size={16} className="text-[#d8aa5b]" /> 物流追蹤
                                </h3>
                                <div className="space-y-0">
                                    {statusUpdates.slice().reverse().map((update: any, i: number) => (
                                        <div key={i} className="flex gap-4 relative">
                                            {i < statusUpdates.length - 1 && (
                                                <div className="absolute left-[7px] top-6 w-0.5 h-full bg-white/10" />
                                            )}
                                            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 relative z-10 bg-[#111] ${i === 0 ? 'border-[#d8aa5b]' : 'border-white/20'}`} />
                                            <div className="pb-6">
                                                <p className={`text-sm font-bold ${i === 0 ? 'text-white' : 'text-gray-400'}`}>
                                                    <span className={getShipmentStatusColor(update.status)}>
                                                        {getShipmentStatusLabel(update.status)}
                                                    </span>
                                                </p>
                                                {update.description && <p className="text-xs text-gray-500 mt-1">{update.description}</p>}
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] text-gray-600 font-mono">{new Date(update.timestamp).toLocaleString('zh-TW')}</span>
                                                    {update.location && (
                                                        <span className="text-[10px] text-gray-500 flex items-center gap-1"><MapPin size={10} /> {update.location}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Order Timeline */}
                        {order.timeline && order.timeline.length > 0 && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                                className="bg-[#111] border border-white/5 rounded-sm p-8">
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

                        {/* Order Items */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                            className="bg-[#111] border border-white/5 rounded-sm p-8">
                            <h3 className="text-white text-xs uppercase tracking-widest font-bold mb-4">訂購商品</h3>
                            <div className="space-y-3">
                                {order.items?.map((item: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                                        <div className="flex items-center gap-4">
                                            {item.image && <img src={item.image} alt="" className="w-14 h-14 rounded object-cover" />}
                                            <div>
                                                <p className="text-sm text-white">{item.name}</p>
                                                <p className="text-[10px] text-gray-500">數量：{item.quantity}</p>
                                                {item.is_preorder && <span className="text-[10px] text-cyan-400 uppercase">預購商品</span>}
                                            </div>
                                        </div>
                                        <p className="text-white font-mono">NT${(item.price * item.quantity).toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right: Sidebar */}
                    <div className="space-y-6">
                        {/* Payment Summary */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="bg-[#111] border border-white/5 rounded-sm p-6">
                            <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-4 flex items-center gap-2">
                                <CreditCard size={14} /> 付款摘要
                            </h3>
                            <div className="space-y-2 text-sm">
                                {order.subtotal !== undefined && (
                                    <div className="flex justify-between text-gray-400">
                                        <span>小計</span>
                                        <span>NT${order.subtotal.toLocaleString()}</span>
                                    </div>
                                )}
                                {order.tax_amount > 0 && (
                                    <div className="flex justify-between text-gray-400">
                                        <span>稅額</span>
                                        <span>NT${order.tax_amount.toLocaleString()}</span>
                                    </div>
                                )}
                                {order.shipping_fee > 0 && (
                                    <div className="flex justify-between text-gray-400">
                                        <span>運費</span>
                                        <span>NT${order.shipping_fee.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-white font-bold pt-2 border-t border-white/10">
                                    <span>總計</span>
                                    <span className="text-[#d8aa5b]">NT${(order.total_amount || order.total || 0).toLocaleString()}</span>
                                </div>
                                {isPreorder && order.deposit_amount > 0 && (
                                    <>
                                        <div className="flex justify-between text-cyan-400 pt-2">
                                            <span>已付訂金</span>
                                            <span>NT${order.deposit_amount.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-orange-400">
                                            <span>待付尾款</span>
                                            <span>NT${order.remaining_amount?.toLocaleString() || '—'}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>

                        {/* Shipping Info */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                            className="bg-[#111] border border-white/5 rounded-sm p-6">
                            <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-4">收件資訊</h3>
                            <div className="text-sm space-y-1">
                                <p className="text-white font-bold">{order.shippingInfo?.fullName}</p>
                                <p className="text-gray-400">{order.shippingInfo?.email}</p>
                                <p className="text-gray-400">{order.shippingInfo?.phone}</p>
                                <p className="text-gray-400 mt-2">
                                    {order.shippingInfo?.addressLine1}<br />
                                    {order.shippingInfo?.city}, {order.shippingInfo?.postalCode}<br />
                                    {order.shippingInfo?.country}
                                </p>
                            </div>
                        </motion.div>

                        {/* Logistics */}
                        {order.trackingInfo?.trackingNumber && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                                className="bg-[#111] border border-white/5 rounded-sm p-6">
                                <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-4 flex items-center gap-2">
                                    <Truck size={14} /> 物流資訊
                                </h3>
                                <div className="text-sm space-y-2">
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase">物流商</p>
                                        <p className="text-white">{order.trackingInfo.carrier}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase">追蹤碼</p>
                                        <p className="text-[#d8aa5b] font-mono">{order.trackingInfo.trackingNumber}</p>
                                    </div>
                                    {shipment?.current_location && (
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <MapPin size={12} /> {shipment.current_location}
                                        </div>
                                    )}
                                    {order.estimated_delivery_date && (
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase">預計送達</p>
                                            <p className="text-white">{new Date(order.estimated_delivery_date).toLocaleDateString('zh-TW')}</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Cancel Notice */}
                        {order.can_cancel_until && new Date(order.can_cancel_until) > new Date() && !isCancelled && (
                            <div className="text-center text-gray-500 text-[10px] uppercase tracking-wider">
                                可在 {new Date(order.can_cancel_until).toLocaleString('zh-TW')} 前取消
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
