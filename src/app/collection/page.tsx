
import { getPublicProducts } from "@/lib/db";
import ProductListClient from "./ProductListClient";

// Force dynamic rendering since we use Supabase cookies
export const dynamic = 'force-dynamic';

export default async function CollectionPage() {
    const products = await getPublicProducts();

    return (
        <main className="min-h-screen pt-28 md:pt-32 px-4 md:px-6 pb-20">
            <div className="container mx-auto">
                <ProductListClient initialProducts={products} />
            </div>
        </main>
    );
}
