
import { getPublicArticles } from "@/lib/db";
import SectionRenderer from "@/components/sections/SectionRenderer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cookies } from "next/headers";
import en from '@/dictionaries/en.json';
import zh from '@/dictionaries/zh.json';
import jp from '@/dictionaries/jp.json';
import ko from '@/dictionaries/ko.json';

export const dynamic = 'force-dynamic';

const dicts: Record<string, any> = { en, zh, jp, ko };

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const cookieStore = await cookies();
    const lang = cookieStore.get('language')?.value || 'en';
    const dict = dicts[lang] || dicts.en;
    const t = (key: string) => (dict as any)[key] || (dicts.en as any)[key] || key;

    const articles = await getPublicArticles();
    const article = articles.find((a: any) => a.slug === slug);

    if (!article) {
        return <div className="min-h-screen flex items-center justify-center text-white">{t('journal.empty')}</div>;
    }

    return (
        <main className="min-h-screen bg-[#050505] text-white pt-32 pb-24">
            {/* Header / Meta */}
            <div className="container mx-auto px-6 max-w-4xl mb-16">
                <Link href="/journal" className="flex items-center gap-2 text-white/30 hover:text-[#d8aa5b] transition-colors uppercase text-[10px] tracking-widest font-bold mb-8">
                    <ArrowLeft size={14} /> {t('journal.backToJournal')}
                </Link>
                <span className="text-[#d8aa5b] text-xs uppercase tracking-[0.3em] font-medium block mb-4">{article.category}</span>
                <h1 className="font-display text-4xl md:text-6xl text-white mb-6 leading-tight">{article.title}</h1>
                <div className="flex items-center gap-4 text-gray-500 text-xs tracking-widest uppercase">
                    <span>{article.readTime}</span>
                </div>
            </div>

            {/* Content Renderer */}
            {article.sections && article.sections.length > 0 ? (
                <SectionRenderer sections={article.sections} />
            ) : (
                <div className="container mx-auto px-6 max-w-3xl text-gray-500 italic">
                    {article.snippet}
                </div>
            )}
        </main>
    );
}
