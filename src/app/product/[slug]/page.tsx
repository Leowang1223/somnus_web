import { getProducts } from "@/lib/db";
import SectionRenderer from "@/components/sections/SectionRenderer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const products = await getProducts();
    const product = products.find((p: any) => p.slug === slug);

    if (!product) {
        return <div className="min-h-screen flex items-center justify-center text-white">Product not found</div>;
    }

    return (
        <main className="min-h-screen bg-[#050505] text-white">
            {/* Back Button Overlay */}
            <div className="fixed top-28 left-8 z-[60]">
                <Link href="/collection" className="flex items-center gap-2 text-white/30 hover:text-[#d8aa5b] transition-colors uppercase text-[10px] tracking-widest font-bold">
                    <ArrowLeft size={14} /> Back
                </Link>
            </div>

            {/* If product has sections, use renderer, otherwise show empty state with default purchase block */}
            <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
                {product.sections && product.sections.length > 0 ? (
                    <SectionRenderer sections={product.sections} productContext={product} />
                ) : (
                    <div className="pt-40 pb-20 px-8 flex flex-col items-center">
                        <h1 className="text-white font-display text-5xl mb-12">{product.name}</h1>
                        <SectionRenderer
                            sections={[{
                                id: 'default-purchase',
                                type: 'purchase',
                                content: {},
                                isEnabled: true
                            }]}
                            productContext={product}
                        />
                        <p className="mt-20 text-gray-600 italic text-sm">No detailed ritual described yet.</p>
                    </div>
                )}
            </Suspense>
        </main>
    );
}
