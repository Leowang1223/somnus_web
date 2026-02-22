import { getArticles } from "@/lib/db";
import ArticleBuilderClient from "./ArticleBuilderClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminArticleBuilderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const articles = await getArticles();
    const article = articles.find((a: any) => a.id === id);

    if (!article) return <div className="p-10 text-white">找不到文章</div>;

    return (
        <div className="max-w-5xl">
            <header className="mb-12 flex justify-between items-start">
                <div>
                    <Link href="/admin/journal" className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs uppercase tracking-widest mb-4">
                        <ArrowLeft size={14} /> 回到日誌管理
                    </Link>
                    <h1 className="font-display text-4xl text-white mb-2">{article.title}</h1>
                    <p className="text-[#d8aa5b] text-sm uppercase tracking-widest font-mono">文章區塊編輯器</p>
                </div>
            </header>

            <div className="bg-[#111] border border-white/5 p-8 rounded-sm">
                <ArticleBuilderClient id={id} initialSections={article.sections || []} article={article} />
            </div>
        </div>
    );
}
