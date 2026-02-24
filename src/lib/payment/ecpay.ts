/**
 * ECPay（綠界）金流 Adapter
 *
 * 文件：https://developers.ecpay.com.tw/?p=2866
 * 流程：POST → ECPay AioCheckout → 用戶完成付款 → ECPay POST 到我們的 ServerReturnURL
 */

import * as crypto from 'crypto';
import type { PaymentAdapter, PaymentOrderParams, PaymentResult, WebhookVerifyResult } from './types';

export interface ECPayConfig {
    merchantId: string;
    hashKey: string;
    hashIv: string;
    testMode: boolean;
}

export class ECPayAdapter implements PaymentAdapter {
    readonly providerName = 'ecpay';
    private readonly config: ECPayConfig;

    // ECPay API Endpoints
    private get baseUrl() {
        return this.config.testMode
            ? 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckout/Index'
            : 'https://payment.ecpay.com.tw/Cashier/AioCheckout/Index';
    }

    constructor(config: ECPayConfig) {
        this.config = config;
    }

    async createPayment(params: PaymentOrderParams): Promise<PaymentResult> {
        try {
            const now = new Date();
            const tradeDate = now.toLocaleString('zh-TW', {
                timeZone: 'Asia/Taipei',
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: false,
            }).replace(/\//g, '/').replace(',', '');

            // ECPay 要求的參數（按字母排序計算 CheckMacValue）
            const formData: Record<string, string> = {
                MerchantID:      this.config.merchantId,
                MerchantTradeNo: params.orderId.replace(/-/g, '').slice(0, 20), // 最多20字元
                MerchantTradeDate: tradeDate,
                PaymentType:     'aio',
                TotalAmount:     String(Math.round(params.amount)),
                TradeDesc:       encodeURIComponent(params.description.slice(0, 200)),
                ItemName:        params.description.slice(0, 400),
                ReturnURL:       params.notifyUrl,   // Webhook（Server 對 Server）
                ClientBackURL:   params.returnUrl,   // 用戶付款後跳轉
                ChoosePayment:   'ALL',              // 讓用戶選擇付款方式
                EncryptType:     '1',               // SHA256
                StoreID:         '',
                InvoiceMark:     'N',
                CustomField1:    params.orderId,    // 保留訂單原始 ID
            };

            // 移除空值
            Object.keys(formData).forEach(k => { if (formData[k] === '') delete formData[k]; });

            // 計算 CheckMacValue
            formData.CheckMacValue = this.generateCheckMacValue(formData);

            // 產生 HTML form（自動 submit）
            const inputs = Object.entries(formData)
                .map(([k, v]) => `<input type="hidden" name="${k}" value="${v}" />`)
                .join('');

            const formHtml = `
<!DOCTYPE html>
<html>
<body onload="document.forms[0].submit()">
    <form method="POST" action="${this.baseUrl}">
        ${inputs}
    </form>
    <p style="font-family:sans-serif;text-align:center;margin-top:50px;color:#666">
        正在跳轉至付款頁面，請稍候...
    </p>
</body>
</html>`;

            return { success: true, formHtml };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }

    async verifyWebhook(payload: Record<string, string>): Promise<WebhookVerifyResult> {
        const { CheckMacValue, ...rest } = payload;

        // 重新計算 CheckMacValue 驗證簽章
        const computed = this.generateCheckMacValue(rest);
        const isValid = computed.toUpperCase() === (CheckMacValue || '').toUpperCase();

        // RtnCode === '1' = 付款成功
        const isPaid = payload.RtnCode === '1';

        // CustomField1 儲存的是原始訂單 ID
        const orderId = payload.CustomField1 || payload.MerchantTradeNo;

        return {
            isValid,
            orderId,
            transactionId: payload.TradeNo || '',
            amount: Number(payload.TradeAmt || 0),
            status: isPaid ? 'paid' : 'failed',
            rawData: payload,
        };
    }

    private generateCheckMacValue(params: Record<string, string>): string {
        // 1. 排序（字母順序，不分大小寫）
        const sorted = Object.keys(params)
            .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
            .map(k => `${k}=${params[k]}`)
            .join('&');

        // 2. 加上 HashKey & HashIV
        const raw = `HashKey=${this.config.hashKey}&${sorted}&HashIV=${this.config.hashIv}`;

        // 3. URL Encode（ECPay 特殊格式）
        const encoded = encodeURIComponent(raw).toLowerCase()
            .replace(/%20/g, '+')
            .replace(/%21/g, '!')
            .replace(/%28/g, '(')
            .replace(/%29/g, ')')
            .replace(/%2a/g, '*');

        // 4. SHA256 Hash → 轉大寫
        return crypto.createHash('sha256').update(encoded).digest('hex').toUpperCase();
    }
}

export function createECPayAdapter(config: ECPayConfig): ECPayAdapter {
    return new ECPayAdapter(config);
}
