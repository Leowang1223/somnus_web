import { getProducts } from "@/lib/db";
import SectionRenderer from "@/components/sections/SectionRenderer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";
import { cookies } from "next/headers";
import en from '@/dictionaries/en.json';
import zh from '@/dictionaries/zh.json';
import jp from '@/dictionaries/jp.json';
import ko from '@/dictionaries/ko.json';

export const dynamic = 'force-dynamic';

const dicts: Record<string, any> = { en, zh, jp, ko };

function loc(value: any, lang: string): string {
    if (!value && value !== 0) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && !Array.isArray(value)) {
        return String(value[lang] || value.en || Object.values(value).find(v => v) || '');
    }
    return String(value);
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const cookieStore = await cookies();
    const lang = cookieStore.get('language')?.value || 'en';
    const dict = dicts[lang] || dicts.en;
    const t = (key: string) => (dict as any)[key] || (dicts.en as any)[key] || key;

    // In static export, we re-fetch to get data. This is efficient at build time.
    const products = await getProducts();
    const product = products.find((p: any) => p.slug === slug);

    if (!product) {
        return <div className="min-h-screen flex items-center justify-center text-white">{t('product.notFound')}</div>;
    }

    return (
        <main className="min-h-screen bg-[#050505] text-white">
            {/* Back Button Overlay */}
            <div className="fixed top-28 left-8 z-[60]">
                <Link href="/collection" className="flex items-center gap-2 text-white/30 hover:text-[#d8aa5b] transition-colors uppercase text-[10px] tracking-widest font-bold">
                    <ArrowLeft size={14} /> {t('product.back')}
                </Link>
            </div>

            {/* If product has sections, use renderer, otherwise show empty state with default purchase block */}
            <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
                {product.sections && product.sections.length > 0 ? (
                    <SectionRenderer
                        sections={product.sections}
                        productContext={product}
                        noSnap={true}
                    />
                ) : (
                    <div className="pt-40 pb-20 px-8 flex flex-col items-center">
                        <h1 className="text-white font-display text-5xl mb-12">{loc(product.name, lang)}</h1>
                        <SectionRenderer
                            sections={[{
                                id: 'default-purchase',
                                type: 'purchase',
                                content: {},
                                isEnabled: true
                            }]}
                            productContext={product}
                        />
                        <p className="mt-20 text-gray-600 italic text-sm">{t('product.noRitual')}</p>
                    </div>
                )}
            </Suspense>
        </main>
    );
}
