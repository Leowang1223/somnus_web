
import { getProducts } from "@/lib/db";
import UniversalSectionBuilder from "@/components/admin/UniversalSectionBuilder";
import { updateProductSectionsAction } from "@/app/actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AdminProductBuilderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const products = await getProducts();
    const product = products.find((p: any) => p.id === id);

    if (!product) return <div className="p-10 text-white">Product not found</div>;

    // Server Action Wrapper for Client Component
    const handleSave = async (sections: any[]) => {
        'use server';
        await updateProductSectionsAction(id, sections);
    };

    return (
        <div className="max-w-5xl">
            <header className="mb-12 flex justify-between items-start">
                <div>
                    <Link href="/admin/products" className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs uppercase tracking-widest mb-4">
                        <ArrowLeft size={14} /> Back to Products
                    </Link>
                    <h1 className="font-display text-4xl text-white mb-2">{product.name}</h1>
                    <p className="text-[#d8aa5b] text-sm uppercase tracking-widest font-mono">Product Layout Designer</p>
                </div>
            </header>

            <div className="bg-[#111] border border-white/5 p-8 rounded-sm">
                <ProductBuilderClient id={id} initialSections={product.sections || []} />
            </div>
        </div>
    );
}

// Client Helper Component
import ProductBuilderClient from "./ProductBuilderClient";
