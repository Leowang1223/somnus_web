/**
 * 會計與財務相關的類型定義
 */

// 付款狀態
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// 入帳狀態
export type PayoutStatus = 'pending' | 'paid_out';

// 付款類型（預購）
export type PaymentType = 'deposit' | 'final' | 'full';

// 付款記錄
export interface Payment {
  id: string;
  order_id: string;

  // 金流核心
  payment_provider: string;
  transaction_id?: string;
  payment_method?: string;

  // 金額
  amount: number;
  currency: string;
  exchange_rate: number;
  amount_twd?: number;

  // 手續費
  gateway_fee: number;
  net_amount: number;

  // 狀態
  payment_status: PaymentStatus;
  paid_at?: string;
  payout_status: PayoutStatus;
  payout_at?: string;
  payout_batch_id?: string;

  // 類型
  payment_type: PaymentType;

  // 元數據
  metadata?: Record<string, any>;
  raw_response?: Record<string, any>;

  created_at: string;
  updated_at: string;
}

// 退款狀態
export type RefundStatus = 'pending' | 'processing' | 'completed' | 'failed';

// 退款類型
export type RefundType = 'full' | 'partial';

// 發票處理方式
export type InvoiceAction = 'void' | 'credit_note';

// 退款記錄
export interface Refund {
  id: string;
  order_id: string;
  payment_id?: string;

  // 退款資訊
  refund_amount: number;
  refund_fee: number;
  net_refund: number;
  refund_reason?: string;
  refund_type: RefundType;

  // 發票處理
  invoice_action?: InvoiceAction;
  credit_note_number?: string;

  // 狀態
  refund_status: RefundStatus;
  refund_provider?: string;
  refund_transaction_id?: string;
  refunded_at?: string;

  // 審核
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;

  created_at: string;
  updated_at: string;
}

// 訂單類型
export type OrderType = 'stock' | 'preorder';

// 客戶類型
export type CustomerType = 'B2B' | 'B2C';

// 稅務類型
export type TaxType = 'taxable' | 'exempt' | 'zero_rated';

// 發票類型
export type InvoiceType = 'duplicate' | 'triplicate'; // 二聯式 / 三聯式

// 會計相關的訂單欄位（擴充 Order 類型用）
export interface AccountingOrderFields {
  // 訂單類型
  order_type: OrderType;

  // 幣別與匯率
  currency: string;
  exchange_rate: number;

  // 金額明細
  subtotal: number;
  tax_amount: number;
  shipping_fee: number;
  total_amount: number;

  // 客戶資訊
  customer_country: string;
  customer_type: CustomerType;
  tax_id?: string;
  company_name?: string;

  // 發票資訊
  invoice_required: boolean;
  invoice_type?: InvoiceType;
  invoice_number?: string;
  invoice_issued_at?: string;
  tax_rate: number;
  tax_type: TaxType;

  // 預購履約（會計關鍵）
  is_fulfilled: boolean;
  fulfilled_at?: string;
  deferred_revenue: number;
  recognized_revenue: number;
  preorder_batch_id?: string;
}

// 營收報表（每日）
export interface DailyRevenueReport {
  report_date: string;
  total_orders: number;
  stock_orders: number;
  preorder_orders: number;
  gross_revenue: number;
  recognized_revenue: number;
  deferred_revenue: number;
  total_tax: number;
  total_shipping: number;
}

// 遞延收入追蹤
export interface DeferredRevenueItem {
  order_id: string;
  customer_email: string;
  deposit_amount: number;
  total_amount: number;
  deferred_revenue: number;
  recognized_revenue: number;
  is_fulfilled: boolean;
  expected_ship_date: string;
  preorder_batch_id?: string;
  days_until_fulfillment: number;
  fulfillment_status: 'fulfilled' | 'overdue' | 'upcoming' | 'pending';
}

// 金流對帳
export interface PaymentReconciliation {
  payment_provider: string;
  payment_date: string;
  transaction_count: number;
  gross_amount: number;
  total_fees: number;
  net_amount: number;
  paid_out: number;
  pending_payout: number;
}
