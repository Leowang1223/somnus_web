'use client';

import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Truck, Clock, Package } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getOrderAction } from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";

export default function OrderConfirmationPage() {
    const params = useParams();
    const orderId = params.id as string;
    const { t, currency } = useLanguage();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchOrder() {
            const result = await getOrderAction(orderId);
            if (result.success && result.order) {
                setOrder(result.order);
            }
            setLoading(false);
        }
        fetchOrder();
    }, [orderId]);

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 md:p-6 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-lg w-full"
            >
                <div className="flex justify-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className={`w-24 h-24 rounded-full flex items-center justify-center ${order?.status === 'paid' ? 'bg-green-500/20 text-green-500' : 'bg-[#d8aa5b]/20 text-[#d8aa5b]'}`}
                    >
                        {order?.status === 'paid' ? (
                            <CheckCircle size={48} strokeWidth={1.5} />
                        ) : (
                            <Clock size={48} strokeWidth={1.5} />
                        )}
                    </motion.div>
                </div>

                <h1 className="font-display text-3xl md:text-4xl text-white mb-4">
                    {order?.status === 'paid' ? t('orderConfirmation.paid') : t('orderConfirmation.placed')}
                </h1>
                <p className="text-gray-400 mb-8 font-light leading-relaxed text-sm md:text-base">
                    Your order <span className="text-white font-mono text-xs md:text-sm">{orderId}</span> has been {order?.status === 'paid' ? 'confirmed' : 'placed'}.
                    <br />
                    {order?.status === 'paid'
                        ? t('orderConfirmation.confirmedMsg')
                        : t('orderConfirmation.pendingMsg')}
                </p>

                {/* Order Details */}
                {!loading && order && (
                    <div className="bg-[#111] border border-white/5 rounded-sm p-5 md:p-6 mb-8 text-left">
                        <h3 className="text-xs uppercase tracking-widest text-[#d8aa5b] font-bold mb-4">{t('orderConfirmation.summary')}</h3>
                        <div className="space-y-3 mb-4">
                            {order.items?.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between text-sm">
                                    <span className="text-gray-400 truncate mr-4">{item.quantity || 1}x {item.name}</span>
                                    <span className="text-white shrink-0">{currency}{item.price}</span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-white/10 pt-3 flex justify-between">
                            <span className="text-gray-500 text-sm">{t('orderConfirmation.total')}</span>
                            <span className="text-[#d8aa5b] font-display text-lg">{currency}{order.total}</span>
                        </div>
                        {order.shippingInfo && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <span className="text-xs uppercase tracking-widest text-gray-500 block mb-2">{t('orderConfirmation.shippingTo')}</span>
                                <p className="text-white text-sm">{order.shippingInfo.fullName}</p>
                                <p className="text-gray-500 text-xs">{order.shippingInfo.addressLine1}, {order.shippingInfo.city}</p>
                            </div>
                        )}
                        <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
                            <Package size={14} className="text-gray-500" />
                            <span className={`text-xs uppercase tracking-widest font-bold ${order.status === 'paid' ? 'text-green-500' : order.status === 'pending' ? 'text-yellow-500' : 'text-gray-500'}`}>
                                {order.status}
                            </span>
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="text-gray-500 text-sm mb-8 animate-pulse">{t('common.loading')}</div>
                )}

                <div className="space-y-4">
                    <Link
                        href={`/track-order?id=${orderId}`}
                        className="w-full bg-[#111] border border-white/10 hover:border-[#d8aa5b] text-white h-14 font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 rounded-sm group"
                    >
                        <Truck size={18} className="text-gray-500 group-hover:text-[#d8aa5b] transition-colors" />
                        {t('orderConfirmation.track')}
                    </Link>

                    <Link
                        href="/"
                        className="block text-gray-600 hover:text-white text-xs uppercase tracking-widest transition-colors py-4"
                    >
                        {t('orderConfirmation.returnHome')}
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
