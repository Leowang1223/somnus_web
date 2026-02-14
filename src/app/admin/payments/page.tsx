import { getPaymentsAction, getRefundsAction, getAllOrdersAction } from "@/app/actions";
import PaymentsClient from "./PaymentsClient";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

export default async function AdminPaymentsPage() {
    const [paymentsResult, refundsResult, ordersResult] = await Promise.all([
        getPaymentsAction(),
        getRefundsAction(),
        getAllOrdersAction()
    ]);

    const payments = paymentsResult.success ? paymentsResult.payments : [];
    const refunds = refundsResult.success ? refundsResult.refunds : [];
    const orders = ordersResult.success ? ordersResult.orders : [];

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="font-display text-4xl text-white mb-2">金流對帳</h1>
                    <p className="text-gray-500 text-sm">Payment reconciliation & financial overview.</p>
                </div>
            </header>

            <Suspense fallback={<div className="text-white">Loading payments...</div>}>
                <PaymentsClient
                    initialPayments={payments}
                    initialRefunds={refunds}
                    initialOrders={orders}
                />
            </Suspense>
        </div>
    );
}
