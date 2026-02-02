'use client';

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, ShoppingBag, BookOpen, Home, LogOut, Headphones, Package, Users } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { role, logout, isAuthenticated, isOwner } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated || (role !== 'admin' && role !== 'owner' && role !== 'support')) {
            router.push('/login');
        }
    }, [role, isAuthenticated, router]);

    if (!isAuthenticated || (role !== 'admin' && role !== 'owner' && role !== 'support')) {
        return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">驗證中...</div>
    }

    return (
        <div className="min-h-screen bg-[#050505] flex pt-24">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/10 p-6 fixed h-full bg-[#050505] z-40">
                <h2 className="text-[#d8aa5b] font-display text-lg mb-8 tracking-widest uppercase">控制台</h2>

                <nav className="space-y-2">
                    <Link href="/admin" className="flex items-center gap-3 text-white/60 hover:text-white hover:bg-white/5 p-3 rounded-sm transition-colors">
                        <LayoutDashboard size={18} />
                        <span className="text-sm uppercase tracking-wider">總覽</span>
                    </Link>
                    <Link href="/admin/products" className="flex items-center gap-3 text-white/60 hover:text-white hover:bg-white/5 p-3 rounded-sm transition-colors">
                        <ShoppingBag size={18} />
                        <span className="text-sm uppercase tracking-wider">產品管理</span>
                    </Link>
                    <Link href="/admin/orders" className="flex items-center gap-3 text-white/60 hover:text-white hover:bg-white/5 p-3 rounded-sm transition-colors">
                        <Package size={18} />
                        <span className="text-sm uppercase tracking-wider">訂單管理</span>
                    </Link>
                    <Link href="/admin/journal" className="flex items-center gap-3 text-white/60 hover:text-white hover:bg-white/5 p-3 rounded-sm transition-colors">
                        <BookOpen size={18} />
                        <span className="text-sm uppercase tracking-wider">日誌管理</span>
                    </Link>
                    <Link href="/admin/homepage" className="flex items-center gap-3 text-white/60 hover:text-white hover:bg-white/5 p-3 rounded-sm transition-colors">
                        <Home size={18} />
                        <span className="text-sm uppercase tracking-wider">首頁佈局</span>
                    </Link>
                    <Link href="/admin/cs" className="flex items-center gap-3 text-white/60 hover:text-white hover:bg-white/5 p-3 rounded-sm transition-colors">
                        <Headphones size={18} />
                        <span className="text-sm uppercase tracking-wider">客服中心</span>
                    </Link>

                    {isOwner && (
                        <Link href="/admin/team" className="flex items-center gap-3 text-white/60 hover:text-white hover:bg-white/5 p-3 rounded-sm transition-colors">
                            <Users size={18} />
                            <span className="text-sm uppercase tracking-wider">團隊管理</span>
                        </Link>
                    )}
                </nav>

                <div className="absolute bottom-8 left-6 w-[calc(100%-3rem)]">
                    <button onClick={logout} className="w-full flex items-center gap-3 text-red-400 hover:bg-red-400/10 p-3 rounded-sm transition-colors">
                        <LogOut size={18} />
                        <span className="text-sm uppercase tracking-wider">登出</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-10 bg-[#0a0a09]">
                {children}
            </main>
        </div>
    );
}
