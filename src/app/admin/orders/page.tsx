import { getAllOrdersAction } from "@/app/actions";
import AdminOrdersClient from "./AdminOrderList";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
    const result = await getAllOrdersAction();
    const orders = result.success ? result.orders : [];

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="font-display text-4xl text-white mb-2">Order Management</h1>
                    <p className="text-gray-500 text-sm">Oversee the fulfillment of rituals.</p>
                </div>
                <div className="text-right">
                    <p className="text-[#d8aa5b] text-xs uppercase tracking-widest font-bold">Total Orders: {orders.length}</p>
                </div>
            </header>

            <Suspense fallback={<div className="text-white">Loading orders...</div>}>
                <AdminOrdersClient initialOrders={orders} />
            </Suspense>
        </div>
    );
}
