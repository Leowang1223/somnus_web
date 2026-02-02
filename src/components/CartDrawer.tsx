'use client';

import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2 } from "lucide-react";

export default function CartDrawer() {
    const { isOpen, toggleCart, items, removeFromCart, updateQuantity, cartTotal } = useCart();
    const { isAuthenticated } = useAuth();
    const router = useRouter();

    const handleCheckout = () => {
        toggleCart();
        router.push('/checkout');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleCart}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full md:w-[450px] bg-[#0a0a09] border-l border-white/10 z-[70] shadow-2xl flex flex-col"
                    >
                        <div className="p-8 border-b border-white/10 flex justify-between items-center">
                            <h2 className="font-display text-2xl text-white">Your Ritual</h2>
                            <button onClick={toggleCart} className="text-white/50 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            {items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-white/30 text-center">
                                    <span className="mb-4 text-4xl">☾</span>
                                    <p className="font-display">Your sanctuary is empty.</p>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <div key={`${item.product.id}-${item.variant?.id || 'base'}`} className="flex gap-4">
                                        <div className="w-20 h-24 bg-[#111] rounded-sm relative overflow-hidden flex-shrink-0">
                                            {item.product.image ? (
                                                <img src={item.product.image} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent)]"></div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="text-white font-display text-lg leading-none mb-1">{item.product.name}</h3>
                                                    {item.variant && (
                                                        <span className="text-xs text-white/40 uppercase tracking-widest">{item.variant.name}</span>
                                                    )}
                                                </div>
                                                <button onClick={() => removeFromCart(item.product.id, item.variant?.id)} className="text-white/30 hover:text-red-400 transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <p className="text-[#d8aa5b] font-display mb-4">${item.product.price}</p>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-3 border border-white/10 px-3 py-1 rounded-sm text-white/60 text-xs">
                                                    <button
                                                        onClick={() => updateQuantity(item.product.id, -1, item.variant?.id)}
                                                        className="hover:text-white transition-colors p-1"
                                                    >
                                                        <Minus size={10} />
                                                    </button>
                                                    <span className="min-w-[1.2rem] text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.product.id, 1, item.variant?.id)}
                                                        className="hover:text-white transition-colors p-1"
                                                    >
                                                        <Plus size={10} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {items.length > 0 && (
                            <div className="p-8 border-t border-white/10 bg-[#0ec09]">
                                <div className="flex justify-between items-end mb-6">
                                    <span className="text-white/50 text-xs uppercase tracking-widest">Total Investment</span>
                                    <span className="text-[#d8aa5b] font-display text-3xl">${cartTotal}</span>
                                </div>
                                <button
                                    onClick={handleCheckout}
                                    className="w-full bg-[#d8aa5b] text-black h-14 font-bold uppercase tracking-widest hover:bg-white transition-colors"
                                >
                                    Proceed to Checkout
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
