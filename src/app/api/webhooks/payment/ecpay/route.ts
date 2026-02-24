/**
 * POST /api/webhooks/payment/ecpay
 *
 * ECPay ServerReturnURL Webhook
 * ECPay 在用戶付款後，以 POST application/x-www-form-urlencoded 通知此端點
 * 驗證簽章 → 更新訂單狀態 → 回應 "1|OK" 表示接收成功
 *
 * 注意：此端點不需要 Auth，但必須驗證 CheckMacValue 防止偽造
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ECPayAdapter } from '@/lib/payment/ecpay';

export async function POST(req: NextRequest) {
    try {
        // ECPay 使用 form-urlencoded 格式
        const text = await req.text();
        const params: Record<string, string> = {};
        new URLSearchParams(text).forEach((v, k) => { params[k] = v; });

        // 從資料庫取得 ECPay 設定（用來驗證 CheckMacValue）
        const supabase = await createClient();
        const { data: settings } = await supabase
            .from('merchant_settings')
            .select('ecpay_merchant_id, ecpay_hash_key, ecpay_hash_iv, ecpay_test_mode')
            .eq('id', 1)
            .single();

        if (!settings?.ecpay_hash_key || !settings?.ecpay_hash_iv) {
            console.error('[ECPay Webhook] ECPay settings not configured');
            return new NextResponse('0|Error: Settings not found', { status: 200 });
        }

        const adapter = new ECPayAdapter({
            merchantId: settings.ecpay_merchant_id,
            hashKey: settings.ecpay_hash_key,
            hashIv: settings.ecpay_hash_iv,
            testMode: settings.ecpay_test_mode ?? true,
        });

        // 驗證 CheckMacValue
        const verified = await adapter.verifyWebhook(params, text);

        if (!verified.isValid) {
            console.error('[ECPay Webhook] Invalid CheckMacValue', { orderId: verified.orderId });
            return new NextResponse('0|Error: Invalid signature', { status: 200 });
        }

        const { orderId, transactionId, amount, status } = verified;

        // 找到對應訂單
        const { data: order } = await supabase
            .from('orders')
            .select('id, status, timeline, total_amount')
            .eq('id', orderId)
            .single();

        if (!order) {
            // 嘗試用 MerchantTradeNo 查找（無 dash 的版本）
            console.warn('[ECPay Webhook] Order not found:', orderId);
            return new NextResponse('1|OK', { status: 200 }); // 仍回 OK 避免 ECPay 重試
        }

        const now = new Date().toISOString();

        if (status === 'paid') {
            // 更新訂單狀態
            const timeline = order.timeline || [];
            timeline.push({
                status: 'paid',
                date: now,
                note: `ECPay 付款成功｜交易編號：${transactionId}`,
            });

            await supabase.from('orders').update({
                status: 'paid',
                timeline,
                last_status_update: now,
            }).eq('id', orderId);

            // 建立付款記錄
            const dateStr = now.slice(2, 10).replace(/-/g, '');
            const rand = Math.floor(1000 + Math.random() * 9000);
            await supabase.from('payments').upsert({
                id: `PAY-${dateStr}-${rand}`,
                order_id: orderId,
                payment_provider: 'ecpay',
                transaction_id: transactionId,
                payment_method: params.PaymentType || 'Credit',
                amount,
                currency: 'TWD',
                exchange_rate: 1.0,
                amount_twd: amount,
                gateway_fee: 0,
                net_amount: amount,
                payment_status: 'completed',
                paid_at: now,
                payout_status: 'pending',
                payment_type: 'full',
                raw_response: params,
            });

            console.log(`[ECPay Webhook] Order ${orderId} paid ✓`);
        } else {
            // 付款失敗
            const timeline = order.timeline || [];
            timeline.push({
                status: 'pending',
                date: now,
                note: `ECPay 付款失敗｜代碼：${params.RtnCode}｜${params.RtnMsg || ''}`,
            });

            await supabase.from('orders').update({
                status: 'pending',
                timeline,
                last_status_update: now,
            }).eq('id', orderId);

            console.warn(`[ECPay Webhook] Order ${orderId} payment failed, RtnCode=${params.RtnCode}`);
        }

        // ECPay 要求回應 "1|OK" 才算接收成功
        return new NextResponse('1|OK', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' },
        });

    } catch (e: any) {
        console.error('[ECPay Webhook] Exception:', e);
        // 即使出錯也回 1|OK 避免 ECPay 重複通知
        return new NextResponse('1|OK', { status: 200 });
    }
}
