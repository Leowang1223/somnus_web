'use client';

import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { ShoppingBag, User, Globe, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll } from "framer-motion";

type Language = 'en' | 'zh' | 'jp' | 'ko';

const LANGUAGE_LABELS: Record<Language, string> = {
    en: 'EN',
    zh: '繁中',
    jp: '日本語',
    ko: '한국어',
};

export default function Navbar() {
    const { t, language, setLanguage } = useLanguage();
    const { role, logout, isAuthenticated } = useAuth();
    const { toggleCart, items } = useCart();
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const langRef = useRef<HTMLDivElement>(null);

    const { scrollY } = useScroll();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        return scrollY.onChange((latest) => {
            setIsScrolled(latest > 50);
        });
    }, [scrollY]);

    // Click outside to close user menu
    useEffect(() => {
        if (!showUserMenu) return;
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowUserMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showUserMenu]);

    // Click outside to close lang menu
    useEffect(() => {
        if (!showLangMenu) return;
        function handleClick(e: MouseEvent) {
            if (langRef.current && !langRef.current.contains(e.target as Node)) {
                setShowLangMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showLangMenu]);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileMenuOpen]);

    const currentLang = language || 'en';

    return (
        <>
            <motion.nav
                className={`fixed top-0 w-full z-50 px-4 md:px-8 py-4 md:py-6 flex justify-between items-center transition-all duration-300 ${isScrolled ? 'bg-[#050505]/95 backdrop-blur-md border-b border-white/5' : 'bg-gradient-to-b from-[#050505]/80 to-transparent'}`}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
                {isScrolled && (
                    <div className="absolute inset-0 bg-[#d8aa5b] opacity-[0.02] mix-blend-overlay pointer-events-none"></div>
                )}

                {/* Left Links – hidden on mobile */}
                <div className="hidden md:flex gap-8 text-sm tracking-[0.2em] font-medium uppercase text-white/90">
                    <Link href="/" className="hover:text-[#d8aa5b] transition-colors relative group">
                        {t('nav.home')}
                        <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#d8aa5b] transition-all group-hover:w-full"></span>
                    </Link>
                    <Link href="/collection" className="hover:text-[#d8aa5b] transition-colors relative group">
                        {t('nav.shop')}
                        <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#d8aa5b] transition-all group-hover:w-full"></span>
                    </Link>
                    <Link href="/journal" className="hover:text-[#d8aa5b] transition-colors relative group">
                        {t('nav.journal')}
                        <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#d8aa5b] transition-all group-hover:w-full"></span>
                    </Link>
                </div>

                {/* Mobile: Hamburger placeholder to balance logo */}
                <button
                    className="md:hidden text-white/80 hover:text-[#d8aa5b] transition-colors"
                    onClick={() => setMobileMenuOpen(true)}
                    aria-label={t('nav.menu')}
                >
                    <Menu size={22} />
                </button>

                {/* Center Logo */}
                <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-3 group">
                    <div className="w-2 h-2 md:w-3 md:h-3 bg-[#d8aa5b] shadow-[0_0_15px_rgba(216,170,91,0.5)] group-hover:scale-125 transition-transform duration-500"></div>
                    <span className="font-display text-xl md:text-2xl tracking-[0.2em] text-white group-hover:text-[#d8aa5b] transition-colors">SØMNS</span>
                </Link>

                {/* Right Icons */}
                <div className="flex items-center gap-3 md:gap-6 text-sm tracking-[0.2em] uppercase text-white/90">
                    {/* Language Switcher */}
                    <div className="relative hidden md:block" ref={langRef}>
                        <button
                            onClick={() => setShowLangMenu(!showLangMenu)}
                            className="flex items-center gap-1.5 hover:text-[#d8aa5b] transition-colors text-xs"
                        >
                            <Globe size={15} />
                            <span>{LANGUAGE_LABELS[currentLang]}</span>
                        </button>
                        {showLangMenu && (
                            <div className="absolute right-0 top-full mt-4 bg-[#0a0a09] border border-white/10 rounded-sm min-w-[120px] shadow-2xl overflow-hidden">
                                {(Object.entries(LANGUAGE_LABELS) as [Language, string][]).map(([lang, label]) => (
                                    <button
                                        key={lang}
                                        onClick={() => { setLanguage(lang); setShowLangMenu(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-xs hover:bg-white/5 transition-colors ${currentLang === lang ? 'text-[#d8aa5b]' : 'text-white/70'}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Cart */}
                    <button onClick={toggleCart} className="flex items-center gap-2 hover:text-[#d8aa5b] transition-colors relative group">
                        <ShoppingBag size={18} />
                        <span className="hidden md:inline">{t('nav.cart')} ({itemCount})</span>
                        {itemCount > 0 && (
                            <span className="md:hidden absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#d8aa5b] text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                                {itemCount}
                            </span>
                        )}
                    </button>

                    {/* User – always visible; show profile only when auth confirmed */}
                    {isAuthenticated ? (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-2 hover:text-[#d8aa5b] transition-colors"
                            >
                                <User size={18} />
                                <span className="hidden md:inline">{(role === 'owner' || role === 'support') ? 'Admin' : t('nav.profile')}</span>
                            </button>
                            {showUserMenu && (
                                <div className="absolute right-0 top-full mt-4 bg-[#0a0a09] border border-white/10 rounded-sm min-w-[180px] shadow-2xl overflow-hidden">
                                    {(role === 'owner' || role === 'support') && (
                                        <Link
                                            href="/admin"
                                            onClick={() => setShowUserMenu(false)}
                                            className="block px-6 py-3 text-sm hover:bg-white/5 transition-colors border-b border-white/5"
                                        >
                                            {t('nav.admin')}
                                        </Link>
                                    )}
                                    <Link
                                        href="/profile"
                                        onClick={() => setShowUserMenu(false)}
                                        className="block px-6 py-3 text-sm hover:bg-white/5 transition-colors border-b border-white/5"
                                    >
                                        {t('nav.profile')}
                                    </Link>
                                    <Link
                                        href="/support"
                                        onClick={() => setShowUserMenu(false)}
                                        className="block px-6 py-3 text-sm hover:bg-white/5 transition-colors border-b border-white/5"
                                    >
                                        {t('nav.support')}
                                    </Link>
                                    <button
                                        onClick={() => { logout(); setShowUserMenu(false); }}
                                        className="w-full text-left px-6 py-3 text-sm hover:bg-white/5 transition-colors text-red-400 hover:text-red-300"
                                    >
                                        {t('nav.logout')}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link href="/login" className="flex items-center gap-2 hover:text-[#d8aa5b] transition-colors">
                            <User size={18} />
                            <span className="hidden md:inline">{t('nav.login')}</span>
                        </Link>
                    )}
                </div>
            </motion.nav>

            {/* Mobile Full-Screen Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '-100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '-100%' }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed inset-0 z-[60] bg-[#050505] flex flex-col md:hidden"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center px-6 py-5 border-b border-white/5">
                            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-[#d8aa5b]"></div>
                                <span className="font-display text-xl tracking-[0.2em] text-white">SØMNS</span>
                            </Link>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="text-white/60 hover:text-white transition-colors"
                                aria-label={t('nav.close')}
                            >
                                <X size={22} />
                            </button>
                        </div>

                        {/* Nav Links */}
                        <nav className="flex-1 flex flex-col justify-center px-8 space-y-2">
                            {[
                                { href: '/', label: t('nav.home') },
                                { href: '/collection', label: t('nav.shop') },
                                { href: '/journal', label: t('nav.journal') },
                                { href: '/support', label: t('nav.support') },
                            ].map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="font-display text-4xl text-white/80 hover:text-[#d8aa5b] transition-colors py-3 border-b border-white/5"
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>

                        {/* Bottom: Auth + Language */}
                        <div className="px-8 pb-10 space-y-6 border-t border-white/5 pt-6">
                            {/* Language switcher */}
                            <div>
                                <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">{t('nav.language')}</p>
                                <div className="flex gap-3 flex-wrap">
                                    {(Object.entries(LANGUAGE_LABELS) as [Language, string][]).map(([lang, label]) => (
                                        <button
                                            key={lang}
                                            onClick={() => setLanguage(lang)}
                                            className={`px-3 py-1.5 text-xs border rounded-sm transition-colors ${currentLang === lang ? 'bg-[#d8aa5b] text-black border-[#d8aa5b]' : 'border-white/10 text-white/60 hover:border-white/30'}`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Auth */}
                            {isAuthenticated ? (
                                <div className="flex gap-4">
                                    <Link
                                        href="/profile"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
                                    >
                                        <User size={16} /> {t('nav.profile')}
                                    </Link>
                                    <button
                                        onClick={() => { logout(); setMobileMenuOpen(false); }}
                                        className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                                    >
                                        {t('nav.logout')}
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    href="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-2 text-sm text-white/70 hover:text-[#d8aa5b] transition-colors"
                                >
                                    <User size={16} /> {t('nav.login')}
                                </Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
