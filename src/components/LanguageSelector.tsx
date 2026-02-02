'use client';

import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function LanguageSelector() {
    const { language, setLanguage } = useLanguage();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // If no language is selected (null), show the overlay
        if (language === null) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [language]);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center p-8 text-white"
            >
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center space-y-12 max-w-2xl w-full"
                >
                    <div className="space-y-4">
                        <h1 className="font-display text-4xl tracking-widest uppercase text-[#d8aa5b]">SØMNUS</h1>
                        <p className="text-gray-500 text-sm tracking-widest uppercase">Select Region / 語言選擇 / 言語選択 / 언어 선택</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        <button
                            onClick={() => setLanguage('en')}
                            className="group relative p-8 border border-white/10 hover:border-[#d8aa5b] transition-all duration-500"
                        >
                            <span className="block text-2xl font-light mb-2 group-hover:text-[#d8aa5b] transition-colors">English</span>
                            <span className="text-xs text-gray-500 uppercase tracking-widest">Global</span>
                        </button>

                        <button
                            onClick={() => setLanguage('zh')}
                            className="group relative p-8 border border-white/10 hover:border-[#d8aa5b] transition-all duration-500"
                        >
                            <span className="block text-2xl font-light mb-2 group-hover:text-[#d8aa5b] transition-colors">繁體中文</span>
                            <span className="text-xs text-gray-500 uppercase tracking-widest">Taiwan</span>
                        </button>

                        <button
                            onClick={() => setLanguage('jp')}
                            className="group relative p-8 border border-white/10 hover:border-[#d8aa5b] transition-all duration-500"
                        >
                            <span className="block text-2xl font-light mb-2 group-hover:text-[#d8aa5b] transition-colors">日本語</span>
                            <span className="text-xs text-gray-500 uppercase tracking-widest">Japan</span>
                        </button>

                        <button
                            onClick={() => setLanguage('ko')}
                            className="group relative p-8 border border-white/10 hover:border-[#d8aa5b] transition-all duration-500"
                        >
                            <span className="block text-2xl font-light mb-2 group-hover:text-[#d8aa5b] transition-colors">한국어</span>
                            <span className="text-xs text-gray-500 uppercase tracking-widest">Korea</span>
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
