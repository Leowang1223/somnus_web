-- ==========================================
-- 會計 + 訂單追蹤完整升級
-- Created: 2026-02-13
-- Purpose: 整合會計邏輯與訂單追蹤功能
-- ==========================================

-- ==========================================
-- PART 1: Orders 表 - 補充會計核心欄位
-- ==========================================

-- 會計核心欄位
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'stock';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'TWD';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(10, 6) DEFAULT 1.0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10, 2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2);

-- 客戶與稅務資訊
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_country TEXT DEFAULT 'TW';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_type TEXT DEFAULT 'B2C';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tax_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS company_name TEXT;

-- 發票欄位
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS invoice_required BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS invoice_type TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS invoice_issued_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5, 2) DEFAULT 5.0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tax_type TEXT DEFAULT 'taxable';

-- 預購履約欄位（會計關鍵）
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_fulfilled BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fulfilled_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deferred_revenue NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS recognized_revenue NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS preorder_batch_id TEXT;

-- 訂單追蹤欄位
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS last_status_update TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notification_sent JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS can_cancel_until TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS modification_requests JSONB DEFAULT '[]'::jsonb;

-- 異常追蹤欄位
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS flag_reason TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS flag_priority TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS assigned_to TEXT;

-- 索引優化
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON public.orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_currency ON public.orders(currency);
CREATE INDEX IF NOT EXISTS idx_orders_customer_country ON public.orders(customer_country);
CREATE INDEX IF NOT EXISTS idx_orders_is_fulfilled ON public.orders(is_fulfilled);
CREATE INDEX IF NOT EXISTS idx_orders_is_flagged ON public.orders(is_flagged) WHERE is_flagged = true;
CREATE INDEX IF NOT EXISTS idx_orders_invoice_number ON public.orders(invoice_number);

-- ==========================================
-- PART 2: Payments 表（金流追蹤）
-- ==========================================

CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,

  -- 金流核心資訊
  payment_provider TEXT NOT NULL,        -- stripe, paypal, ecpay, bmc
  transaction_id TEXT UNIQUE,            -- 金流商交易流水號
  payment_method TEXT,                   -- credit_card, bank_transfer, crypto, cash

  -- 金額資訊
  amount NUMERIC(10, 2) NOT NULL,        -- 付款金額
  currency TEXT DEFAULT 'TWD',           -- 幣別
  exchange_rate NUMERIC(10, 6) DEFAULT 1.0,
  amount_twd NUMERIC(10, 2),             -- 換算台幣

  -- 手續費
  gateway_fee NUMERIC(10, 2) DEFAULT 0,  -- 金流手續費
  net_amount NUMERIC(10, 2),             -- 實收金額（扣除手續費）

  -- 付款狀態
  payment_status TEXT DEFAULT 'pending', -- pending, completed, failed, refunded
  paid_at TIMESTAMPTZ,                   -- 付款成功時間

  -- 入帳狀態
  payout_status TEXT DEFAULT 'pending',  -- pending, paid_out
  payout_at TIMESTAMPTZ,                 -- 實際入帳時間
  payout_batch_id TEXT,                  -- 入帳批次號

  -- 付款類型（預購專用）
  payment_type TEXT DEFAULT 'full',      -- deposit（訂金）, final（尾款）, full（全額）

  -- 元數據
  metadata JSONB DEFAULT '{}'::jsonb,
  raw_response JSONB,                    -- 金流 API 原始回應

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments 索引
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_status ON public.payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_payout_status ON public.payments(payout_status);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON public.payments(paid_at);

-- ==========================================
-- PART 3: Shipments 表（物流追蹤）
-- ==========================================

CREATE TABLE IF NOT EXISTS public.shipments (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,

  -- 物流商資訊
  carrier TEXT NOT NULL,                 -- DHL, FedEx, SF Express, Black Cat
  tracking_number TEXT UNIQUE NOT NULL,
  tracking_url TEXT,

  -- 包裹資訊
  package_weight NUMERIC(10, 2),         -- 重量（kg）
  package_dimensions JSONB,              -- {length, width, height}
  package_count INTEGER DEFAULT 1,       -- 包裹數量

  -- 物流狀態
  shipment_status TEXT DEFAULT 'pending', -- pending, in_transit, out_for_delivery, delivered, failed, returned
  current_location TEXT,                 -- 當前位置
  status_updates JSONB DEFAULT '[]'::jsonb, -- 物流歷程記錄

  -- 時間記錄
  shipped_at TIMESTAMPTZ,
  estimated_delivery TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- 簽收資訊
  recipient_name TEXT,
  signature_url TEXT,                    -- 簽收簽名照片
  delivery_photo_url TEXT,               -- 簽收照片
  delivery_notes TEXT,                   -- 配送備註

  -- 異常記錄
  is_delayed BOOLEAN DEFAULT false,
  delay_reason TEXT,
  exception_count INTEGER DEFAULT 0,
  last_exception TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipments 索引
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON public.shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_shipment_status ON public.shipments(shipment_status);
CREATE INDEX IF NOT EXISTS idx_shipments_carrier ON public.shipments(carrier);
CREATE INDEX IF NOT EXISTS idx_shipments_is_delayed ON public.shipments(is_delayed) WHERE is_delayed = true;

-- ==========================================
-- PART 4: Refunds 表（退款追蹤）
-- ==========================================

CREATE TABLE IF NOT EXISTS public.refunds (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_id TEXT REFERENCES public.payments(id),

  -- 退款資訊
  refund_amount NUMERIC(10, 2) NOT NULL,
  refund_fee NUMERIC(10, 2) DEFAULT 0,   -- 不可退的手續費
  net_refund NUMERIC(10, 2),             -- 實際退款金額

  refund_reason TEXT,
  refund_type TEXT DEFAULT 'full',       -- full, partial

  -- 發票處理
  invoice_action TEXT,                   -- void（作廢）, credit_note（折讓）
  credit_note_number TEXT,

  -- 退款狀態
  refund_status TEXT DEFAULT 'pending',  -- pending, processing, completed, failed
  refund_provider TEXT,                  -- 退款管道
  refund_transaction_id TEXT,
  refunded_at TIMESTAMPTZ,

  -- 審核資訊
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refunds 索引
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON public.refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON public.refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_refund_status ON public.refunds(refund_status);

-- ==========================================
-- PART 5: Order Tags 表（訂單標籤系統）
-- ==========================================

CREATE TABLE IF NOT EXISTS public.order_tags (
  id SERIAL PRIMARY KEY,
  order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,

  tag_type TEXT NOT NULL,                -- priority, issue, vip, rush, risk
  tag_value TEXT NOT NULL,               -- high, low, damaged, fraud, etc.
  tag_color TEXT,                        -- UI 顏色

  created_by TEXT,                       -- 建立者（admin user id）
  notes TEXT,                            -- 標籤備註

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(order_id, tag_type, tag_value)
);

-- Order Tags 索引
CREATE INDEX IF NOT EXISTS idx_order_tags_order_id ON public.order_tags(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tags_tag_type ON public.order_tags(tag_type);

-- ==========================================
-- PART 6: 自動更新 Trigger
-- ==========================================

-- 自動更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shipments_updated_at ON public.shipments;
CREATE TRIGGER update_shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_refunds_updated_at ON public.refunds;
CREATE TRIGGER update_refunds_updated_at
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- PART 7: 會計報表 Views
-- ==========================================

-- 每日營收報表
CREATE OR REPLACE VIEW daily_revenue_report AS
SELECT
  DATE(created_at) as report_date,
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE order_type = 'stock') as stock_orders,
  COUNT(*) FILTER (WHERE order_type = 'preorder') as preorder_orders,
  SUM(total_amount) as gross_revenue,
  SUM(CASE WHEN is_fulfilled = true THEN recognized_revenue ELSE 0 END) as recognized_revenue,
  SUM(CASE WHEN is_fulfilled = false AND has_preorder = true THEN deferred_revenue ELSE 0 END) as deferred_revenue,
  SUM(tax_amount) as total_tax,
  SUM(shipping_fee) as total_shipping
FROM public.orders
WHERE status NOT IN ('cancelled', 'refunded')
GROUP BY DATE(created_at)
ORDER BY report_date DESC;

-- 遞延收入追蹤（預購專用）
CREATE OR REPLACE VIEW deferred_revenue_tracker AS
SELECT
  o.id as order_id,
  o.customer_email,
  o.deposit_amount,
  o.total_amount,
  o.deferred_revenue,
  o.recognized_revenue,
  o.is_fulfilled,
  o.expected_ship_date,
  o.preorder_batch_id,
  EXTRACT(DAY FROM o.expected_ship_date - NOW()) as days_until_fulfillment,
  CASE
    WHEN o.is_fulfilled = true THEN 'fulfilled'
    WHEN o.expected_ship_date < NOW() THEN 'overdue'
    WHEN EXTRACT(DAY FROM o.expected_ship_date - NOW()) <= 7 THEN 'upcoming'
    ELSE 'pending'
  END as fulfillment_status
FROM public.orders o
WHERE o.has_preorder = true
  AND o.status NOT IN ('cancelled', 'refunded')
ORDER BY o.expected_ship_date;

-- 金流對帳表
CREATE OR REPLACE VIEW payment_reconciliation AS
SELECT
  p.payment_provider,
  DATE(p.paid_at) as payment_date,
  COUNT(*) as transaction_count,
  SUM(p.amount) as gross_amount,
  SUM(p.gateway_fee) as total_fees,
  SUM(p.net_amount) as net_amount,
  SUM(CASE WHEN p.payout_status = 'paid_out' THEN p.net_amount ELSE 0 END) as paid_out,
  SUM(CASE WHEN p.payout_status = 'pending' THEN p.net_amount ELSE 0 END) as pending_payout
FROM public.payments p
WHERE p.payment_status = 'completed'
GROUP BY p.payment_provider, DATE(p.paid_at)
ORDER BY payment_date DESC;

-- 物流異常報表
CREATE OR REPLACE VIEW shipment_exceptions AS
SELECT
  s.id,
  s.order_id,
  s.tracking_number,
  s.carrier,
  s.shipment_status,
  s.is_delayed,
  s.delay_reason,
  s.exception_count,
  s.last_exception,
  s.estimated_delivery,
  o.customer_email,
  o.customer_phone
FROM public.shipments s
JOIN public.orders o ON s.order_id = o.id
WHERE s.is_delayed = true
   OR s.exception_count > 0
   OR s.shipment_status IN ('failed', 'returned')
ORDER BY s.exception_count DESC, s.updated_at DESC;

-- ==========================================
-- PART 8: 註釋說明
-- ==========================================

-- Orders 表會計欄位註釋
COMMENT ON COLUMN public.orders.order_type IS '訂單類型：stock（現貨）, preorder（預購）';
COMMENT ON COLUMN public.orders.currency IS '幣別：TWD, USD, EUR, JPY';
COMMENT ON COLUMN public.orders.subtotal IS '小計（未稅）';
COMMENT ON COLUMN public.orders.tax_amount IS '稅額';
COMMENT ON COLUMN public.orders.shipping_fee IS '運費';
COMMENT ON COLUMN public.orders.total_amount IS '訂單總額（含稅含運）';
COMMENT ON COLUMN public.orders.deferred_revenue IS '遞延收入（負債科目）- 預收款項';
COMMENT ON COLUMN public.orders.recognized_revenue IS '已認列收入 - 實際營收';
COMMENT ON COLUMN public.orders.is_fulfilled IS '是否已履約（出貨）- 決定能否認列收入';
COMMENT ON COLUMN public.orders.fulfilled_at IS '履約完成時間 - 收入認列日';

-- Payments 表註釋
COMMENT ON TABLE public.payments IS '付款與金流明細表 - 用於對帳';
COMMENT ON COLUMN public.payments.net_amount IS '實收金額（扣除手續費後）';
COMMENT ON COLUMN public.payments.payout_status IS '入帳狀態：pending（待入帳）, paid_out（已入帳）';

-- Shipments 表註釋
COMMENT ON TABLE public.shipments IS '物流追蹤表 - 獨立管理物流資訊';
COMMENT ON COLUMN public.shipments.status_updates IS '物流歷程記錄（JSONB 陣列）';
