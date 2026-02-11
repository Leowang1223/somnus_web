'use client';

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getOrderAction } from "@/app/actions";
import { Loader2, Search, CheckCircle, Package, Truck, Home, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

function TrackingContent() {
    const searchParams = useSearchParams();
    const initialId = searchParams.get('id') || '';
    const [orderId, setOrderId] = useState(initialId);
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (initialId) handleSearch(initialId);
    }, [initialId]);

    const handleSearch = async (id: string) => {
        if (!id) return;
        setLoading(true);
        setError('');
        const result = await getOrderAction(id);
        if (result.success) {
            setOrder(result.order);
        } else {
            setError('Order not found. Please check your Order ID.');
            setOrder(null);
        }
        setLoading(false);
    };

    const getStatusStep = (status: string) => {
        switch (status) {
            case 'paid': return 1;
            case 'processing': return 2;
            case 'shipped': return 3;
            case 'delivered': return 4;
            default: return 0;
        }
    };

    const steps = [
        { label: 'Order Confirmed', icon: CheckCircle },
        { label: 'Processing', icon: Package },
        { label: 'In Transit', icon: Truck },
        { label: 'Delivered', icon: Home }
    ];

    const currentStep = order ? getStatusStep(order.status) : 0;

    return (
        <div className="min-h-screen bg-[#050505] text-white pt-32 pb-12 px-6">
            <div className="container mx-auto max-w-3xl">
                <div className="text-center mb-16">
                    <h1 className="font-display text-4xl mb-4">Track Your Ritual</h1>
                    <p className="text-gray-500 font-light">Enter your Order ID to see the status of your journey.</p>
                </div>

                {/* Search Box */}
                <div className="flex gap-4 mb-16 max-w-xl mx-auto">
                    <input
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        placeholder="e.g. SOM-240201-1234"
                        className="flex-1 bg-[#111] border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b] rounded-sm font-mono tracking-wider"
                    />
                    <button
                        onClick={() => handleSearch(orderId)}
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
                        className="bg-[#111] border border-white/5 rounded-sm p-8 md:p-12 relative overflow-hidden"
                    >
                        {/* Status Bar */}
                        <div className="relative mb-16">
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 -translate-y-1/2 z-0"></div>
                            <div
                                className="absolute top-1/2 left-0 h-1 bg-[#d8aa5b] -translate-y-1/2 z-0 transition-all duration-1000"
                                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                            ></div>

                            <div className="relative z-10 flex justify-between">
                                {steps.map((step, idx) => {
                                    const isActive = idx + 1 <= currentStep;
                                    const isCurrent = idx + 1 === currentStep;

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

                        {/* Order Details & Logistics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-white/10 pt-12">
                            <div>
                                <h3 className="text-[#d8aa5b] text-xs uppercase tracking-widest font-bold mb-6">Logistics Info</h3>
                                {order.trackingInfo ? (
                                    <div className="space-y-4">
                                        <div>
                                            <span className="text-gray-500 text-xs block mb-1">Tracking Number</span>
                                            <span className="text-white font-mono text-lg">{order.trackingInfo.trackingNumber}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 text-xs block mb-1">Carrier</span>
                                            <span className="text-white">{order.trackingInfo.carrier}</span>
                                        </div>
                                        {order.trackingInfo.trackingUrl && (
                                            <a href={order.trackingInfo.trackingUrl} target="_blank" className="inline-block text-[#d8aa5b] underline text-xs mt-2 uppercase tracking-widest">
                                                View on Carrier Website
                                            </a>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic">Tracking details will be available once shipped.</p>
                                )}
                            </div>

                            <div>
                                <h3 className="text-[#d8aa5b] text-xs uppercase tracking-widest font-bold mb-6">Shipping To</h3>
                                <p className="text-white text-lg mb-2">{order.shippingInfo.fullName}</p>
                                <p className="text-gray-400 leading-relaxed">
                                    {order.shippingInfo.addressLine1}<br />
                                    {order.shippingInfo.city}, {order.shippingInfo.postalCode}<br />
                                    {order.shippingInfo.country}
                                </p>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="mt-12 bg-white/5 p-6 rounded-sm">
                            <h3 className="text-white text-xs uppercase tracking-widest font-bold mb-4">Activity Log</h3>
                            <div className="space-y-4">
                                {order.timeline?.slice().reverse().map((log: any, i: number) => (
                                    <div key={i} className="flex gap-4 text-sm">
                                        <span className="text-gray-500 font-mono text-xs w-32 whitespace-nowrap">{new Date(log.date).toLocaleString()}</span>
                                        <span className="text-gray-300">{log.note}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
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
