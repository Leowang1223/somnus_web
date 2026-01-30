'use client';

import { motion } from "framer-motion";
import Link from "next/link";
import { CMSProduct } from "@/types/cms";

export default function ProductListClient({ initialProducts }: { initialProducts: CMSProduct[] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {initialProducts.map((product, index) => (
                <Link href={`/product/${product.slug}`} key={product.id}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative"
                    >
                        <div
                            className={`bg-[#0a0a09] overflow-hidden rounded-sm relative mb-6 border border-white/5 transition-all duration-700`}
                            style={{
                                aspectRatio: product.aspectRatio === '1:1' ? '1 / 1' : product.aspectRatio === '16:9' ? '16 / 9' : '4 / 5'
                            }}
                        >
                            {/* Product Primary Image */}
                            {product.image && (
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
                                    style={{
                                        objectPosition: product.focusPoint ? `${product.focusPoint.x}% ${product.focusPoint.y}%` : 'center'
                                    }}
                                />
                            )}

                            {/* Hover Media (Animated Video/GIF) */}
                            {product.hoverVideo && (
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-black">
                                    <video
                                        src={product.hoverVideo}
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                        className="w-full h-full object-cover"
                                        style={{
                                            objectPosition: product.focusPoint ? `${product.focusPoint.x}% ${product.focusPoint.y}%` : 'center'
                                        }}
                                    />
                                </div>
                            )}

                            {/* Overlay if no images */}
                            {!product.image && !product.hoverVideo && (
                                <div className="absolute inset-0 flex items-center justify-center text-white/10 font-display text-4xl select-none">
                                    {product.name.charAt(0)}
                                </div>
                            )}

                            {/* Hover glimmer */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>
                        </div>

                        <div className="flex justify-between items-end">
                            <div>
                                <h3 className="text-white font-display text-xl mb-1 group-hover:text-[#d8aa5b] transition-colors duration-300">{product.name}</h3>
                                <p className="text-gray-500 text-[10px] uppercase tracking-wider">{product.category}</p>
                            </div>
                            <span className="text-[#d8aa5b] font-display text-lg">${product.price}</span>
                        </div>
                    </motion.div>
                </Link>
            ))}
        </div>
    );
}
