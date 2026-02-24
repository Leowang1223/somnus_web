/**
 * 金流通用介面
 * 所有金流 Adapter 皆實作此介面，實現隨插即用（plug-and-play）
 */

export interface PaymentOrderParams {
    orderId: string;       // 訂單編號（e.g. SOM-240201-1234）
    amount: number;        // 金額（TWD 整數）
    currency: string;      // 幣別（TWD / USD）
    description: string;   // 訂單描述
    customerEmail: string; // 購買人 Email
    returnUrl: string;     // 付款成功後跳轉頁面（前台）
    notifyUrl: string;     // Webhook callback URL（後台接收通知）
    isDeposit?: boolean;   // 是否為預購訂金
}

export interface PaymentResult {
    success: boolean;
    // 若為 redirect 型（ECPay），回傳 HTML form 字串讓前端 submit
    formHtml?: string;
    // 若為 redirect URL 型（Stripe Hosted）
    redirectUrl?: string;
    // 錯誤訊息
    error?: string;
}

export interface WebhookVerifyResult {
    isValid: boolean;
    orderId: string;
    transactionId: string;
    amount: number;
    status: 'paid' | 'failed' | 'refunded';
    rawData: Record<string, any>;
}

export interface PaymentAdapter {
    readonly providerName: string;
    createPayment(params: PaymentOrderParams): Promise<PaymentResult>;
    verifyWebhook(payload: Record<string, any>, rawBody: string, signature?: string): Promise<WebhookVerifyResult>;
}
