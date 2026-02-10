'use client';

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Search } from "lucide-react";
import { CMSProduct } from "@/types/cms";

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'name';

export default function ProductListClient({ initialProducts }: { initialProducts: CMSProduct[] }) {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [sort, setSort] = useState<SortOption>('newest');

    const categories = useMemo(() => {
        const cats = new Set(initialProducts.map(p => p.category).filter(Boolean));
        return ['all', ...Array.from(cats)];
    }, [initialProducts]);

    const filtered = useMemo(() => {
        let result = initialProducts;

        if (search) {
            const q = search.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(q) ||
                (p.category || '').toLowerCase().includes(q) ||
                (p.tags || []).some(t => t.toLowerCase().includes(q))
            );
        }

        if (category !== 'all') {
            result = result.filter(p => p.category === category);
        }

        switch (sort) {
            case 'price-asc': result = [...result].sort((a, b) => a.price - b.price); break;
            case 'price-desc': result = [...result].sort((a, b) => b.price - a.price); break;
            case 'name': result = [...result].sort((a, b) => a.name.localeCompare(b.name)); break;
            default: break; // newest = original order from DB
        }

        return result;
    }, [initialProducts, search, category, sort]);

    return (
        <div>
            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                <div className="flex items-center gap-3 bg-[#111] border border-white/10 px-4 py-2 rounded-sm w-full md:w-auto">
                    <Search className="text-gray-500" size={16} />
                    <input
                        placeholder="Search products..."
                        className="bg-transparent text-white focus:outline-none text-sm w-full md:w-56"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 flex-wrap">
                    {categories.map(c => (
                        <button
                            key={c}
                            onClick={() => setCategory(c)}
                            className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold rounded-sm border transition-colors ${category === c ? 'bg-[#d8aa5b] text-black border-[#d8aa5b]' : 'bg-transparent text-gray-500 border-white/10 hover:border-white/30'}`}
                        >
                            {c}
                        </button>
                    ))}
                </div>

                <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortOption)}
                    className="bg-[#111] border border-white/10 px-4 py-2 text-sm text-white rounded-sm focus:outline-none"
                >
                    <option value="newest">Newest</option>
                    <option value="price-asc">Price: Low → High</option>
                    <option value="price-desc">Price: High → Low</option>
                    <option value="name">Name A-Z</option>
                </select>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {filtered.map((product, index) => (
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

                                {!product.image && !product.hoverVideo && (
                                    <div className="absolute inset-0 flex items-center justify-center text-white/10 font-display text-4xl select-none">
                                        {product.name.charAt(0)}
                                    </div>
                                )}

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

            {filtered.length === 0 && (
                <div className="py-20 text-center text-gray-500">No products found.</div>
            )}
        </div>
    );
}
