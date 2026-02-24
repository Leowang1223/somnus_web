/**
 * ECPay（綠界）物流 Adapter
 *
 * 文件：https://developers.ecpay.com.tw/?p=7468
 * 支援：超商取貨（7-11 UNIMART / 全家 FAMI）
 *
 * 注意：物流 API 的 MerchantID / HashKey / HashIV 與金流 API 獨立，需分別設定。
 */

import * as crypto from 'crypto';

export interface ECPayLogisticsConfig {
    merchantId: string;
    hashKey: string;
    hashIv: string;
    testMode: boolean;
}

export type CVSSubType = 'UNIMART' | 'FAMI';

/** ECPay CVS 物流狀態碼 → 中文說明 */
export const CVS_STATUS_MAP: Record<string, string> = {
    '300':  '已建立物流訂單',
    '310':  '超商門市已接單',
    '3024': '已送達超商，請前往取件',
    '3018': '退件處理中',
    '304':  '超商逾期未取件，退回中',
    '3006': '物流訂單已取消',
    '3022': '包裹已由門市配送至收件地址',
    '3032': '配達完了',
    '3042': '取件完了',
};

/** ECPay CVS RtnCode → shipment status 映射 */
export const CVS_RTNCODE_TO_STATUS: Record<string, string> = {
    '300':  'pending',
    '310':  'in_transit',
    '3024': 'out_for_delivery',
    '3018': 'returned',
    '304':  'failed',
    '3006': 'failed',
    '3042': 'delivered',
};

export class ECPayLogisticsAdapter {
    private readonly config: ECPayLogisticsConfig;

    private get baseUrl() {
        return this.config.testMode
            ? 'https://logistics-stage.ecpay.com.tw'
            : 'https://logistics.ecpay.com.tw';
    }

    constructor(config: ECPayLogisticsConfig) {
        this.config = config;
    }

    /**
     * 產生 CVS 選店表單 HTML（自動 submit）
     * 用戶瀏覽器會被帶到 ECPay CVS 地圖選擇門市
     * 選完後 ECPay 會 POST 到 serverReplyUrl
     */
    getCVSMapFormHtml(params: {
        serverReplyUrl: string;
        logisticsSubType: CVSSubType;
        merchantTradeNo: string;
        extraData?: string;
    }): string {
        const formParams: Record<string, string> = {
            MerchantID: this.config.merchantId,
            MerchantTradeNo: params.merchantTradeNo,
            LogisticsType: 'CVS',
            LogisticsSubType: params.logisticsSubType,
            IsCollection: 'N',
            ServerReplyURL: params.serverReplyUrl,
            ExtraData: params.extraData || '',
            Device: '0', // 0 = PC, 1 = Mobile
        };

        // 移除空值
        Object.keys(formParams).forEach(k => {
            if (formParams[k] === '') delete formParams[k];
        });

        const mapUrl = `${this.baseUrl}/Express/map`;
        const inputs = Object.entries(formParams)
            .map(([k, v]) => `<input type="hidden" name="${k}" value="${v.replace(/"/g, '&quot;')}" />`)
            .join('\n        ');

        return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>選擇門市</title></head>
<body onload="document.forms[0].submit()">
    <form method="POST" action="${mapUrl}">
        ${inputs}
    </form>
    <p style="font-family:sans-serif;text-align:center;margin-top:50px;color:#666">
        正在開啟門市選擇地圖，請稍候...
    </p>
</body>
</html>`;
    }

    /**
     * 建立 CVS 物流訂單（出貨時呼叫）
     * 成功後 ECPay 回傳 AllPayLogisticsID（物流訂單編號）和 CVSPaymentNo（超商寄件碼）
     */
    async createCVSShipment(params: {
        merchantTradeNo: string;       // max 20 chars，英數字
        logisticsSubType: CVSSubType;
        goodsAmount: number;           // 商品金額（整數），1~20000
        goodsName: string;             // max 50 chars
        senderName: string;            // 寄件人姓名 max 10
        senderPhone: string;           // 寄件人電話（市話格式）
        receiverName: string;          // 收件人姓名 max 10
        receiverCellPhone: string;     // 收件人手機（09xxxxxxxx）
        receiverEmail: string;
        receiverStoreId: string;       // CVSStoreID（選店後取得）
        serverReplyUrl: string;        // 物流狀態 Webhook URL
    }): Promise<{
        success: boolean;
        allPayLogisticsId?: string;
        cvsPaperNo?: string;           // 超商寄件碼（托運單號）
        rtnCode?: string;
        rtnMsg?: string;
        error?: string;
    }> {
        try {
            const tradeDate = new Date().toLocaleString('zh-TW', {
                timeZone: 'Asia/Taipei',
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: false,
            }).replace(/\//g, '/').replace(',', '');

            const formData: Record<string, string> = {
                MerchantID:          this.config.merchantId,
                MerchantTradeNo:     params.merchantTradeNo,
                MerchantTradeDate:   tradeDate,
                LogisticsType:       'CVS',
                LogisticsSubType:    params.logisticsSubType,
                GoodsAmount:         String(Math.round(params.goodsAmount)),
                GoodsName:           params.goodsName.slice(0, 50),
                SenderName:          params.senderName.slice(0, 10),
                SenderPhone:         params.senderPhone,
                ReceiverName:        params.receiverName.slice(0, 10),
                ReceiverCellPhone:   params.receiverCellPhone,
                ReceiverEmail:       params.receiverEmail,
                ReceiverStoreID:     params.receiverStoreId,
                IsCollection:        'N',
                ServerReplyURL:      params.serverReplyUrl,
            };

            // 計算 CheckMacValue
            formData.CheckMacValue = this.generateCheckMacValue(formData);

            const body = new URLSearchParams(formData);
            const endpoint = `${this.baseUrl}/GoodsIssuance/create`;

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body.toString(),
                signal: AbortSignal.timeout(15000),
            });

            const text = await res.text();
            const result = Object.fromEntries(new URLSearchParams(text));

            if (result.RtnCode === '1' || result.RtnCode === '300') {
                return {
                    success: true,
                    allPayLogisticsId: result.AllPayLogisticsID,
                    cvsPaperNo: result.CVSPaymentNo || result.BookingNote,
                    rtnCode: result.RtnCode,
                    rtnMsg: result.RtnMsg,
                };
            } else {
                return {
                    success: false,
                    rtnCode: result.RtnCode,
                    rtnMsg: result.RtnMsg,
                    error: `ECPay 物流錯誤 [${result.RtnCode}]: ${result.RtnMsg || text.slice(0, 200)}`,
                };
            }
        } catch (e: any) {
            return { success: false, error: e?.message || String(e) };
        }
    }

    /**
     * 查詢物流訂單狀態
     */
    async queryStatus(merchantTradeNo: string): Promise<{
        success: boolean;
        rtnCode?: string;
        statusMessage?: string;
        goodsAmount?: number;
        logisticsType?: string;
        logisticsSubType?: string;
        error?: string;
    }> {
        try {
            const timestamp = Math.floor(Date.now() / 1000).toString();

            const params: Record<string, string> = {
                MerchantID:      this.config.merchantId,
                MerchantTradeNo: merchantTradeNo,
                TimeStamp:       timestamp,
            };
            params.CheckMacValue = this.generateCheckMacValue(params);

            const body = new URLSearchParams(params);
            const endpoint = `${this.baseUrl}/Helper/QueryLogisticsTradeInfo/V2`;

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body.toString(),
                signal: AbortSignal.timeout(10000),
            });

            const text = await res.text();
            const result = Object.fromEntries(new URLSearchParams(text));

            if (result.RtnCode) {
                return {
                    success: true,
                    rtnCode: result.RtnCode,
                    statusMessage: CVS_STATUS_MAP[result.RtnCode] || result.GoodsStatus || result.RtnMsg,
                    goodsAmount: result.GoodsAmount ? Number(result.GoodsAmount) : undefined,
                    logisticsType: result.LogisticsType,
                    logisticsSubType: result.LogisticsSubType,
                };
            }
            return { success: false, error: `未預期回應: ${text.slice(0, 200)}` };
        } catch (e: any) {
            return { success: false, error: e?.message || String(e) };
        }
    }

    /**
     * 驗證 Webhook 簽章
     */
    verifyWebhook(params: Record<string, string>): boolean {
        const { CheckMacValue, ...rest } = params;
        if (!CheckMacValue) return false;
        const computed = this.generateCheckMacValue(rest);
        return computed.toUpperCase() === CheckMacValue.toUpperCase();
    }

    /**
     * CheckMacValue 計算（與金流相同演算法）
     */
    generateCheckMacValue(params: Record<string, string>): string {
        const sorted = Object.keys(params)
            .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
            .map(k => `${k}=${params[k]}`)
            .join('&');

        const raw = `HashKey=${this.config.hashKey}&${sorted}&HashIV=${this.config.hashIv}`;

        const encoded = encodeURIComponent(raw).toLowerCase()
            .replace(/%20/g, '+')
            .replace(/%21/g, '!')
            .replace(/%28/g, '(')
            .replace(/%29/g, ')')
            .replace(/%2a/g, '*');

        return crypto.createHash('sha256').update(encoded).digest('hex').toUpperCase();
    }
}

export function createECPayLogisticsAdapter(config: ECPayLogisticsConfig): ECPayLogisticsAdapter {
    return new ECPayLogisticsAdapter(config);
}
