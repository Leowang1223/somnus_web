/**
 * POST /api/payment/create
 *
 * 接收訂單資料 → 建立訂單 → 呼叫金流 Adapter → 回傳付款方式
 *
 * Response:
 * - provider === 'manual': { mode: 'manual', orderId }
 * - provider === 'ecpay':  { mode: 'redirect', formHtml, orderId }
 * - provider === 'stripe': { mode: 'redirect', redirectUrl, orderId }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPaymentAdapter } from '@/lib/payment';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { orderId, amount, currency, description, customerEmail } = body;

        if (!orderId || !amount || !customerEmail) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 確認訂單存在
        const supabase = await createClient();
        const { data: order } = await supabase
            .from('orders')
            .select('id, status, total_amount')
            .eq('id', orderId)
            .single();

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // 取得金流 Adapter
        const adapter = await getPaymentAdapter();

        // 無金流設定 → 手動付款模式
        if (!adapter) {
            return NextResponse.json({
                mode: 'manual',
                orderId,
                message: '請依照付款說明完成付款，我們將在確認後更新您的訂單狀態。'
            });
        }

        const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || '';

        const result = await adapter.createPayment({
            orderId,
            amount: Math.round(amount),
            currency: currency || 'TWD',
            description: description || `SØMNS 訂單 ${orderId}`,
            customerEmail,
            returnUrl:  `${origin}/order-confirmation/${orderId}`,
            notifyUrl:  `${origin}/api/webhooks/payment/${adapter.providerName}`,
        });

        if (!result.success) {
            console.error('[Payment] createPayment failed:', result.error);
            return NextResponse.json({ error: result.error || 'Payment creation failed' }, { status: 500 });
        }

        if (result.formHtml) {
            return NextResponse.json({ mode: 'form', formHtml: result.formHtml, orderId });
        }

        if (result.redirectUrl) {
            return NextResponse.json({ mode: 'redirect', redirectUrl: result.redirectUrl, orderId });
        }

        return NextResponse.json({ mode: 'manual', orderId });

    } catch (e: any) {
        console.error('[Payment] /api/payment/create error:', e);
        return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
    }
}
