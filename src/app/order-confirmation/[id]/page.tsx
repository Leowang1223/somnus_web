'use client';

import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Truck, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function OrderConfirmationPage() {
    const params = useParams();
    const orderId = params.id as string;

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full"
            >
                <div className="flex justify-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="w-24 h-24 bg-[#d8aa5b]/20 rounded-full flex items-center justify-center text-[#d8aa5b]"
                    >
                        <CheckCircle size={48} strokeWidth={1.5} />
                    </motion.div>
                </div>

                <h1 className="font-display text-4xl text-white mb-4">You have begun the Ritual.</h1>
                <p className="text-gray-400 mb-8 font-light leading-relaxed">
                    Your order <span className="text-white font-mono">{orderId}</span> has been confirmed.
                    <br />
                    We are now preparing your artifacts for their journey.
                </p>

                <div className="space-y-4">
                    <Link
                        href={`/track-order?id=${orderId}`}
                        className="w-full bg-[#111] border border-white/10 hover:border-[#d8aa5b] text-white h-14 font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 rounded-sm group"
                    >
                        <Truck size={18} className="text-gray-500 group-hover:text-[#d8aa5b] transition-colors" />
                        Track Your Order
                    </Link>

                    <Link
                        href="/"
                        className="block text-gray-600 hover:text-white text-xs uppercase tracking-widest transition-colors py-4"
                    >
                        Return Home
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
