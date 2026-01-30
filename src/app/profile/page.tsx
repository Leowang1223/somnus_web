'use client';

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Package, Heart, LogOut } from "lucide-react";

export default function ProfilePage() {
    const { role, logout, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated || role !== 'consumer') {
            router.push('/login');
        }
    }, [role, isAuthenticated, router]);

    if (!isAuthenticated || role !== 'consumer') {
        return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">Authenticating...</div>
    }

    return (
        <main className="min-h-screen bg-[#050505] pt-32 px-6 pb-20">
            <div className="container mx-auto max-w-4xl">
                <header className="flex justify-between items-end mb-12 border-b border-white/10 pb-8">
                    <div>
                        <span className="text-[#d8aa5b] text-xs uppercase tracking-widest block mb-4">Sanctuary</span>
                        <h1 className="font-display text-4xl text-white">Welcome Back</h1>
                    </div>
                    <button onClick={logout} className="text-white/50 hover:text-white flex items-center gap-2 text-xs uppercase tracking-widest transition-colors">
                        <LogOut size={14} /> Disconnect
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Recent Rituals (Orders) */}
                    <div>
                        <h3 className="flex items-center gap-3 text-white font-display text-xl mb-6">
                            <Package size={20} className="text-[#d8aa5b]" />
                            Recent Rituals
                        </h3>
                        <div className="space-y-4">
                            {/* Mock Order */}
                            <div className="bg-[#111] border border-white/5 p-6 rounded-sm group hover:border-white/10 transition-colors">
                                <div className="flex justify-between mb-4">
                                    <span className="text-white/50 text-xs">#ORD-3921</span>
                                    <span className="text-[#d8aa5b] text-xs">Delivered</span>
                                </div>
                                <h4 className="text-white font-display text-lg mb-1">Midnight Ritual Kit</h4>
                                <p className="text-gray-500 text-sm mb-4">3 items • Jan 24, 2026</p>
                                <button className="text-white/40 text-[10px] uppercase tracking-widest hover:text-white transition-colors">View Details</button>
                            </div>
                        </div>
                    </div>

                    {/* Saved (Wishlist) */}
                    <div>
                        <h3 className="flex items-center gap-3 text-white font-display text-xl mb-6">
                            <Heart size={20} className="text-[#d8aa5b]" />
                            Saved
                        </h3>
                        <div className="bg-[#111] border border-white/5 p-8 text-center rounded-sm">
                            <p className="text-gray-500 text-sm">Your saved rituals will appear here.</p>
                            <Link href="/collection" className="inline-block mt-4 text-[#d8aa5b] text-xs uppercase tracking-widest border-b border-transparent hover:border-[#d8aa5b] transition-colors">
                                Explore Collection
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
