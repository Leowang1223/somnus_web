'use client';

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CMSArticle } from "@/types/cms";

export default function JournalListClient({ initialArticles }: { initialArticles: CMSArticle[] }) {
    const [activeCategory, setActiveCategory] = useState('all');

    const published = useMemo(
        () => initialArticles.filter(a => a.status === 'published' || !a.status),
        [initialArticles]
    );

    const categories = useMemo(() => {
        const cats = new Set(published.map(a => a.category).filter(Boolean));
        return ['all', ...Array.from(cats)];
    }, [published]);

    const filtered = useMemo(() => {
        if (activeCategory === 'all') return published;
        return published.filter(a => a.category === activeCategory);
    }, [published, activeCategory]);

    return (
        <div>
            {/* Category Filter */}
            {categories.length > 2 && (
                <div className="flex gap-2 flex-wrap mb-10 justify-center">
                    {categories.map(c => (
                        <button
                            key={c}
                            onClick={() => setActiveCategory(c)}
                            className={`px-5 py-2 text-[10px] uppercase tracking-widest font-bold rounded-sm border transition-colors ${activeCategory === c ? 'bg-[#d8aa5b] text-black border-[#d8aa5b]' : 'bg-transparent text-gray-500 border-white/10 hover:border-white/30'}`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                {filtered.map((article) => (
                    <Link href={`/journal/${article.slug}`} key={article.id} className="group">
                        <article className="cursor-pointer">
                            <div className="relative aspect-video bg-[#111] overflow-hidden rounded-sm mb-6 border border-white/5 shadow-2xl">
                                {article.image ? (
                                    <img
                                        src={article.image}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                        alt=""
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-white/5 font-display text-8xl">
                                        {article.title.charAt(0)}
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                            </div>

                            <div className="space-y-3">
                                <span className="text-[#d8aa5b] text-[10px] uppercase tracking-widest block">{article.category}</span>
                                <h3 className="font-display text-2xl text-white group-hover:text-[#d8aa5b] transition-colors">{article.title}</h3>
                                <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">
                                    {article.snippet}
                                </p>
                                <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest group-hover:text-white transition-colors">
                                    Read Article <ArrowRight size={10} />
                                </div>
                            </div>
                        </article>
                    </Link>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="py-20 text-center text-gray-500">No articles found.</div>
            )}
        </div>
    );
}
