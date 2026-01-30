
import { getProducts } from "@/lib/db";
import ProductListClient from "./ProductListClient";

export const dynamic = 'force-dynamic';

export default async function CollectionPage() {
    const products = await getProducts();

    return (
        <main className="min-h-screen pt-32 px-6 pb-20">
            <div className="container mx-auto">
                <header className="mb-20 flex flex-col md:flex-row justify-between items-end border-b border-white/10 pb-8">
                    <div>
                        <span className="text-[#d8aa5b] text-xs tracking-[0.3em] uppercase block mb-4">The Toolkit</span>
                        <h1 className="font-display text-5xl text-white">Curated Essentials</h1>
                    </div>
                    <div className="text-white/60 text-xs tracking-widest uppercase border-b border-transparent pb-1">
                        {products.length} Artifacts
                    </div>
                </header>

                <ProductListClient initialProducts={products} />
            </div>
        </main>
    );
}
