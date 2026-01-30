
import { getProducts } from "@/lib/db";
import AdminProductsClient from "./AdminProductsClient";

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
    const products = await getProducts();

    return (
        <div>
            <header className="flex justify-between items-end mb-12">
                <div>
                    <h1 className="font-display text-4xl text-white mb-2">產品管理</h1>
                    <p className="text-gray-500 text-sm">管理您的產品系列。</p>
                </div>
            </header>

            <AdminProductsClient initialProducts={products} />
        </div>
    );
}
