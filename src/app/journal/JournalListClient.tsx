'use client';

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CMSArticle } from "@/types/cms";

export default function JournalListClient({ initialArticles }: { initialArticles: CMSArticle[] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            {initialArticles.filter(a => a.status === 'published' || !a.status).map((article, index) => (
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
    );
}
