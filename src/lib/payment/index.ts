/**
 * 金流 Factory
 * 根據 merchant_settings 的設定，返回對應的 Adapter 實例
 */

import { createClient } from '@/lib/supabase/server';
import { ECPayAdapter } from './ecpay';
import type { PaymentAdapter } from './types';

export type { PaymentAdapter, PaymentOrderParams, PaymentResult, WebhookVerifyResult } from './types';

/**
 * 從資料庫讀取商家設定，回傳對應的金流 Adapter
 * 若未設定或設定不完整，回傳 null（代表手動付款模式）
 */
export async function getPaymentAdapter(): Promise<PaymentAdapter | null> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('merchant_settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (error || !data) return null;

        switch (data.payment_provider) {
            case 'ecpay': {
                if (!data.ecpay_merchant_id || !data.ecpay_hash_key || !data.ecpay_hash_iv) {
                    console.warn('[Payment] ECPay config incomplete');
                    return null;
                }
                return new ECPayAdapter({
                    merchantId: data.ecpay_merchant_id,
                    hashKey: data.ecpay_hash_key,
                    hashIv: data.ecpay_hash_iv,
                    testMode: data.ecpay_test_mode ?? true,
                });
            }

            // Stripe adapter（未來實作）
            case 'stripe': {
                if (!data.stripe_secret_key) return null;
                // TODO: return new StripeAdapter({ secretKey: data.stripe_secret_key, ... });
                console.warn('[Payment] Stripe adapter not yet implemented');
                return null;
            }

            // TapPay adapter（未來實作）
            case 'tappay': {
                if (!data.tappay_partner_key || !data.tappay_merchant_id) return null;
                // TODO: return new TapPayAdapter({ partnerKey: data.tappay_partner_key, ... });
                console.warn('[Payment] TapPay adapter not yet implemented');
                return null;
            }

            default:
                // 'manual' 或未知 provider
                return null;
        }
    } catch (e) {
        console.error('[Payment] getPaymentAdapter error:', e);
        return null;
    }
}
