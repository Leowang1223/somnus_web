'use client';

import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { ShoppingBag, User } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, useScroll } from "framer-motion";

export default function Navbar() {
    const { role } = useAuth();
    const { toggleCart, items } = useCart();
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

    const { scrollY } = useScroll();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        return scrollY.onChange((latest) => {
            setIsScrolled(latest > 50);
        });
    }, [scrollY]);

    return (
        <motion.nav
            className={`fixed top-0 w-full z-50 px-8 py-6 flex justify-between items-center transition-all duration-300 ${isScrolled ? 'bg-[#050505]/95 backdrop-blur-md border-b border-white/5' : 'bg-gradient-to-b from-[#050505]/80 to-transparent'}`}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
            {/* Added a distinctive texture overlay for the navbar area if scrolled */}
            {isScrolled && (
                <div className="absolute inset-0 bg-[#d8aa5b] opacity-[0.02] mix-blend-overlay pointer-events-none"></div>
            )}

            {/* Left Links */}
            <div className="flex gap-8 text-sm tracking-[0.2em] font-medium uppercase text-white/90">
                <Link href="/" className="hover:text-[#d8aa5b] transition-colors relative group">
                    Home
                    <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#d8aa5b] transition-all group-hover:w-full"></span>
                </Link>
                <Link href="/collection" className="hover:text-[#d8aa5b] transition-colors relative group">
                    Shop
                    <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#d8aa5b] transition-all group-hover:w-full"></span>
                </Link>
                <Link href="/journal" className="hover:text-[#d8aa5b] transition-colors relative group">
                    Journal
                    <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#d8aa5b] transition-all group-hover:w-full"></span>
                </Link>
            </div>

            {/* Center Logo */}
            <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 group">
                <div className="w-3 h-3 bg-[#d8aa5b] shadow-[0_0_15px_rgba(216,170,91,0.5)] group-hover:scale-125 transition-transform duration-500"></div>
                <span className="font-display text-2xl tracking-[0.2em] text-white group-hover:text-[#d8aa5b] transition-colors">SØMNUS</span>
            </Link>

            {/* Right Icons */}
            <div className="flex items-center gap-8 text-sm tracking-[0.2em] uppercase text-white/90">
                <button onClick={toggleCart} className="flex items-center gap-2 hover:text-[#d8aa5b] transition-colors relative group">
                    <ShoppingBag size={18} />
                    <span className="hidden md:inline">Cart ({itemCount})</span>
                </button>

                {role === 'admin' ? (
                    <Link href="/admin" className="flex items-center gap-2 text-[#d8aa5b] hover:text-white transition-colors">
                        <span className="hidden md:inline border-b border-[#d8aa5b]">Admin Panel</span>
                    </Link>
                ) : (
                    <Link href={role ? "/profile" : "/login"} className="flex items-center gap-2 hover:text-[#d8aa5b] transition-colors">
                        <User size={18} />
                        <span className="hidden md:inline">{role === 'consumer' ? 'Sanctuary' : 'Enter'}</span>
                    </Link>
                )}
            </div>
        </motion.nav>
    );
}
