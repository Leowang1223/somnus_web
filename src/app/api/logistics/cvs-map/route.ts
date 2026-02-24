/**
 * GET /api/logistics/cvs-map?type=711|fami&merchantTradeNo=TMP-xxx
 *
 * 回傳 ECPay CVS 選店表單 HTML（瀏覽器會自動 submit 到 ECPay 地圖頁面）
 * 前端以 window.open() 開啟此 URL，完成選店後 ECPay 會 POST 到 cvs-callback
 */

import { createClient } from '@/lib/supabase/server';
import { ECPayLogisticsAdapter } from '@/lib/logistics/ecpay-logistics';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // '711' | 'fami'
    const merchantTradeNo = searchParams.get('merchantTradeNo') || `TMP-${Date.now()}`;

    const logisticsSubType = type === 'fami' ? 'FAMI' : 'UNIMART';

    // 從資料庫讀取 ECPay 物流憑證
    const supabase = await createClient();
    const { data } = await supabase
        .from('merchant_settings')
        .select('ecpay_logistics_merchant_id, ecpay_logistics_hash_key, ecpay_logistics_hash_iv, ecpay_logistics_test_mode')
        .eq('id', 1)
        .single();

    const merchantId = data?.ecpay_logistics_merchant_id;
    const hashKey = data?.ecpay_logistics_hash_key;
    const hashIv = data?.ecpay_logistics_hash_iv;
    const testMode = data?.ecpay_logistics_test_mode ?? true;

    // 若未設定憑證，使用測試用憑證
    const adapter = new ECPayLogisticsAdapter({
        merchantId: merchantId || '2000132',
        hashKey:    hashKey    || 'XBERn1YOvpM9nfZc',
        hashIv:     hashIv     || 'h1ONHk4P4yqbl5LK',
        testMode:   merchantId ? testMode : true,
    });

    const serverReplyUrl = `${new URL(req.url).origin}/api/logistics/cvs-callback`;

    const html = adapter.getCVSMapFormHtml({
        serverReplyUrl,
        logisticsSubType,
        merchantTradeNo,
    });

    return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
}
