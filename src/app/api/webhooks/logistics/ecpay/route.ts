/**
 * POST /api/webhooks/logistics/ecpay
 *
 * ECPay 物流狀態更新 Webhook
 * 在 ECPay 物流後台的「ServerReplyURL」填入此 URL
 * ECPay 每次物流狀態變更時會 POST 到此 endpoint
 */

import { createClient } from '@/lib/supabase/server';
import { ECPayLogisticsAdapter, CVS_STATUS_MAP, CVS_RTNCODE_TO_STATUS } from '@/lib/logistics/ecpay-logistics';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const params = Object.fromEntries(formData) as Record<string, string>;

        console.log('[logistics/ecpay webhook] received:', params);

        const supabase = await createClient();

        // 讀取物流憑證
        const { data: settings } = await supabase
            .from('merchant_settings')
            .select('ecpay_logistics_merchant_id, ecpay_logistics_hash_key, ecpay_logistics_hash_iv, ecpay_logistics_test_mode')
            .eq('id', 1)
            .single();

        const adapter = new ECPayLogisticsAdapter({
            merchantId: settings?.ecpay_logistics_merchant_id || '2000132',
            hashKey:    settings?.ecpay_logistics_hash_key    || 'XBERn1YOvpM9nfZc',
            hashIv:     settings?.ecpay_logistics_hash_iv     || 'h1ONHk4P4yqbl5LK',
            testMode:   settings?.ecpay_logistics_test_mode   ?? true,
        });

        // 驗證簽章
        if (!adapter.verifyWebhook(params)) {
            console.warn('[logistics/ecpay webhook] CheckMacValue mismatch');
            return new Response('0|CheckMacValue Error', { status: 200 });
        }

        const merchantTradeNo   = params.MerchantTradeNo;
        const allPayLogisticsId = params.AllPayLogisticsID;
        const rtnCode           = params.RtnCode;
        const rtnMsg            = params.RtnMsg || '';

        if (!merchantTradeNo) {
            return new Response('0|MissingMerchantTradeNo', { status: 200 });
        }

        // 找到對應的 shipment（by logistics_trade_no 或 logistics_id）
        const { data: shipment } = await supabase
            .from('shipments')
            .select('id, order_id, shipment_status, status_updates')
            .or(`logistics_trade_no.eq.${merchantTradeNo},logistics_id.eq.${allPayLogisticsId}`)
            .single() as { data: any };

        if (!shipment) {
            console.warn('[logistics/ecpay webhook] shipment not found for', merchantTradeNo);
            return new Response('1|OK', { status: 200 }); // 仍回傳 OK 避免 ECPay 重試
        }

        // 解析新狀態
        const newStatus     = CVS_RTNCODE_TO_STATUS[rtnCode] || 'in_transit';
        const statusMessage = CVS_STATUS_MAP[rtnCode] || rtnMsg;

        // 追加 status_update 記錄
        const statusUpdates = Array.isArray(shipment.status_updates) ? shipment.status_updates : [];
        const newUpdate = {
            timestamp:   new Date().toISOString(),
            status:      newStatus,
            description: statusMessage,
            operator:    'ECPay',
        };

        const updatedShipment: Record<string, any> = {
            shipment_status:  newStatus,
            status_updates:   [...statusUpdates, newUpdate],
            updated_at:       new Date().toISOString(),
        };

        if (allPayLogisticsId) updatedShipment.logistics_id = allPayLogisticsId;
        if (newStatus === 'delivered') updatedShipment.delivered_at = new Date().toISOString();

        await supabase
            .from('shipments')
            .update(updatedShipment)
            .eq('id', shipment.id);

        // 若已送達超商（out_for_delivery）或已取件（delivered），同步更新訂單狀態
        if (newStatus === 'delivered') {
            await supabase
                .from('orders')
                .update({
                    status: 'delivered',
                    last_status_update: new Date().toISOString(),
                })
                .eq('id', shipment.order_id);
        } else if (newStatus === 'out_for_delivery') {
            // 已到超商，更新訂單 timeline
            const { data: order } = await supabase
                .from('orders')
                .select('timeline')
                .eq('id', shipment.order_id)
                .single() as { data: any };

            if (order) {
                const timeline = Array.isArray(order.timeline) ? order.timeline : [];
                timeline.push({
                    status: 'shipped',
                    date:   new Date().toISOString(),
                    note:   '商品已送達超商，請前往取件',
                });
                await supabase
                    .from('orders')
                    .update({ timeline, last_status_update: new Date().toISOString() })
                    .eq('id', shipment.order_id);
            }
        }

        return new Response('1|OK', { status: 200 });
    } catch (e: any) {
        console.error('[logistics/ecpay webhook] error:', e);
        return new Response('0|Error', { status: 200 }); // ECPay 期望 200
    }
}
