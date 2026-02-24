'use client';

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, ShoppingBag, BookOpen, Home, LogOut, Headphones, Package, Users, Clock, CreditCard, RotateCcw, Settings, Menu, X } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { role, logout, isAuthenticated, isOwner, loading } = useAuth();
    const router = useRouter();
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    useEffect(() => {
        if (!loading && (!isAuthenticated || (role !== 'owner' && role !== 'support'))) {
            router.push('/login');
        }
    }, [loading, role, isAuthenticated, router]);

    if (loading || !isAuthenticated || (role !== 'owner' && role !== 'support')) {
        return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">驗證中...</div>
    }

    const navLinks = (
        <nav className="space-y-2">
            <Link href="/admin" onClick={() => setMobileSidebarOpen(false)} className="flex items-center gap-3 text-white/60 hover:text-white hover:bg-white/5 p-3 rounded-sm transition-colors">
                <LayoutDashboard size={18} />
                <span className="text-sm uppercase tracking-wider">總覽</span>
            </Link>
            <Link href="/admin/products" onClick={() => setMobileSidebarOpen(false)} className="flex items-center gap-3 text-white/60 hover:text-white hover:bg-white/5 p-3 rounded-sm transition-colors">
                <ShoppingBag size={18} />
                <span className="text-sm uppercase tracking-wider">產品管理</span>
            </Link>
            <Link href="/admin/orders" onClick={() => setMobileSidebarOpen(false)} className="flex items-center gap-3 text-white/60 hover:text-white hover:bg-white/5 p-3 rounded-sm transition-colors">
                <Package size={18} />
                <span className="text-sm uppercase tracking-wider">訂單管理</span>
            </Link>
            <Link href="/admin/preorders" onClick={() => setMobileSidebarOpen(false)} className="flex items-center gap-3 text-white/60 hover:text-white hover:bg-white/5 p-3 rounded-sm transition-colors">
                <Clock size={18} />
                <span className="text-sm uppercase tracking-wider">預購管理</span>
            </Link>
            <Link href="/admin/payments" onClick={() => setMobileSidebarOpen(false)} className="flex items-center gap-3 text-white/60 hover:text-white hover:bg-white/5 p-3 rounded-sm transition-colors">
                <CreditCard size={18} />
                <span className="text-sm uppercase tracking-wider">金流對帳</span>
            </Link>
            <Link href="/admin/refunds" onClick={() => setMobileSidebarOpen(false)} className="flex items-center gap-3 text-white/60 hover:text-white hover:bg-white/5 p-3 rounded-sm transition-colors">
                <RotateCcw size={18} />
                <span className="text-sm uppercase tracking-wider">退款管理</span>
            </Link>
            <Link href="/admin/journal" onClick={() => setMobileSidebarOpen(false)} className="flex items-center gap-3 text-white/60 hover:text-white hover:bg-white/5 p-3 rounded-sm transition-colors">
                <BookOpen size={18} />
                <span className="text-sm uppercase tracking-wider">日誌管理</span>
            </Link>
            <Link href="/admin/homepage" onClick={() => setMobileSidebarOpen(false)} className="flex items-center gap-3 text-white/60 hover:text-white hover:bg-white/5 p-3 rounded-sm transition-colors">
                <Home size={18} />
                <span className="text-sm uppercase tracking-wider">首頁佈局</span>
            </Link>
            <Link href="/admin/cs" onClick={() => setMobileSidebarOpen(false)} className="flex items-center gap-3 text-white/60 hover:text-white hover:bg-white/5 p-3 rounded-sm transition-colors">
                <Headphones size={18} />
                <span className="text-sm uppercase tracking-wider">客服中心</span>
            </Link>
            {isOwner && (
                <Link href="/admin/team" onClick={() => setMobileSidebarOpen(false)} className="flex items-center gap-3 text-white/60 hover:text-white hover:bg-white/5 p-3 rounded-sm transition-colors">
                    <Users size={18} />
                    <span className="text-sm uppercase tracking-wider">團隊管理</span>
                </Link>
            )}
            {isOwner && (
                <Link href="/admin/settings" onClick={() => setMobileSidebarOpen(false)} className="flex items-center gap-3 text-white/60 hover:text-white hover:bg-white/5 p-3 rounded-sm transition-colors">
                    <Settings size={18} />
                    <span className="text-sm uppercase tracking-wider">系統設定</span>
                </Link>
            )}
        </nav>
    );

    return (
        <div className="min-h-screen bg-[#050505] flex pt-24">
            {/* 手機版頂部導航列（lg 以下顯示） */}
            <div className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-[#050505] border-b border-white/10 flex items-center px-4 h-12">
                <button
                    onClick={() => setMobileSidebarOpen(true)}
                    className="text-white/70 hover:text-white mr-4 transition-colors"
                    aria-label="開啟選單"
                >
                    <Menu size={20} />
                </button>
                <span className="text-[#d8aa5b] font-display text-sm tracking-widest uppercase">控制台</span>
            </div>

            {/* 手機版 Sidebar 抽屜 */}
            {mobileSidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-50 bg-black/60"
                    onClick={() => setMobileSidebarOpen(false)}
                >
                    <div
                        className="w-64 h-full bg-[#050505] border-r border-white/10 p-6 pt-20 flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-[#d8aa5b] font-display text-lg tracking-widest uppercase">控制台</h2>
                            <button
                                onClick={() => setMobileSidebarOpen(false)}
                                className="text-white/50 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        {navLinks}
                        <div className="mt-auto pt-6">
                            <button onClick={logout} className="w-full flex items-center gap-3 text-red-400 hover:bg-red-400/10 p-3 rounded-sm transition-colors">
                                <LogOut size={18} />
                                <span className="text-sm uppercase tracking-wider">登出</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Sidebar */}
            <aside className="admin-sidebar w-64 border-r border-white/10 p-6 fixed h-full bg-[#050505] z-40">
                <h2 className="text-[#d8aa5b] font-display text-lg mb-8 tracking-widest uppercase">控制台</h2>

                {navLinks}

                <div className="absolute bottom-8 left-6 w-[calc(100%-3rem)]">
                    <button onClick={logout} className="w-full flex items-center gap-3 text-red-400 hover:bg-red-400/10 p-3 rounded-sm transition-colors">
                        <LogOut size={18} />
                        <span className="text-sm uppercase tracking-wider">登出</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main-content flex-1 ml-64 p-10 bg-[#0a0a09]">
                {children}
            </main>
        </div>
    );
}
