'use client';

import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Heart, LogOut, Loader2 } from "lucide-react";
import { getAllOrdersAction } from "@/app/actions";

export default function ProfilePage() {
    const { user, logout, isAuthenticated, loading } = useAuth();
    const { t, currency } = useLanguage();
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(true);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
        }
    }, [loading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated && user?.email) {
            getAllOrdersAction().then(result => {
                if (result.success) {
                    const userOrders = result.orders.filter(
                        (o: any) => o.shippingInfo?.email === user.email
                    );
                    setOrders(userOrders);
                }
                setOrdersLoading(false);
            });
        }
    }, [isAuthenticated, user]);

    if (loading || !isAuthenticated) {
        return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">{t('profile.authenticating')}</div>
    }

    return (
        <main className="min-h-screen bg-[#050505] pt-28 md:pt-32 px-4 md:px-6 pb-20">
            <div className="container mx-auto max-w-4xl">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 border-b border-white/10 pb-8 gap-4">
                    <div>
                        <span className="text-[#d8aa5b] text-xs uppercase tracking-widest block mb-4">{t('profile.label')}</span>
                        <h1 className="font-display text-4xl text-white">{t('profile.title')}</h1>
                        {user?.email && <p className="text-gray-500 text-sm mt-2">{user.email}</p>}
                    </div>
                    <button onClick={logout} className="text-white/50 hover:text-white flex items-center gap-2 text-xs uppercase tracking-widest transition-colors">
                        <LogOut size={14} /> {t('profile.logout')}
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                    {/* Recent Orders */}
                    <div>
                        <h3 className="flex items-center gap-3 text-white font-display text-xl mb-6">
                            <Package size={20} className="text-[#d8aa5b]" />
                            {t('profile.orders')}
                        </h3>
                        <div className="space-y-4">
                            {ordersLoading ? (
                                <div className="bg-[#111] border border-white/5 p-8 text-center rounded-sm">
                                    <Loader2 className="animate-spin mx-auto text-[#d8aa5b] mb-2" size={24} />
                                    <p className="text-gray-500 text-sm">{t('profile.ordersLoading')}</p>
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="bg-[#111] border border-white/5 p-8 text-center rounded-sm">
                                    <p className="text-gray-500 text-sm">{t('profile.ordersEmpty')}</p>
                                    <Link href="/collection" className="inline-block mt-4 text-[#d8aa5b] text-xs uppercase tracking-widest border-b border-transparent hover:border-[#d8aa5b] transition-colors">
                                        {t('profile.startRitual')}
                                    </Link>
                                </div>
                            ) : (
                                orders.slice(0, 5).map((order: any) => (
                                    <Link key={order.id} href={`/track-order?id=${order.id}`} className="block">
                                        <div className="bg-[#111] border border-white/5 p-6 rounded-sm group hover:border-white/10 transition-colors">
                                            <div className="flex justify-between mb-4">
                                                <span className="text-white/50 text-xs font-mono truncate max-w-[60%]">{order.id}</span>
                                                <span className={`text-xs uppercase tracking-widest font-bold shrink-0 ${order.status === 'delivered' ? 'text-green-500' : order.status === 'shipped' ? 'text-purple-400' : order.status === 'paid' ? 'text-blue-400' : 'text-yellow-500'}`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <p className="text-white text-sm mb-1">
                                                {order.items?.map((i: any) => i.name).join(', ') || 'Order'}
                                            </p>
                                            <div className="flex justify-between items-center">
                                                <p className="text-gray-500 text-xs">{order.items?.length || 0} {t('common.items')} &bull; {new Date(order.date).toLocaleDateString()}</p>
                                                <span className="text-[#d8aa5b] text-sm font-display">{currency}{order.total}</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Saved (Wishlist) */}
                    <div>
                        <h3 className="flex items-center gap-3 text-white font-display text-xl mb-6">
                            <Heart size={20} className="text-[#d8aa5b]" />
                            {t('profile.saved')}
                        </h3>
                        <div className="bg-[#111] border border-white/5 p-8 text-center rounded-sm">
                            <p className="text-gray-500 text-sm">{t('profile.savedEmpty')}</p>
                            <Link href="/collection" className="inline-block mt-4 text-[#d8aa5b] text-xs uppercase tracking-widest border-b border-transparent hover:border-[#d8aa5b] transition-colors">
                                {t('profile.exploreCollection')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
