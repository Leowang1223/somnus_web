-- ==========================================
-- SØMNUS 完整資料庫設定（整合所有 Migrations）
-- 最後更新：2026-02-24
-- 在 Supabase Dashboard > SQL Editor 執行
-- 冪等設計：可重複執行不會出錯
-- ==========================================

-- ==========================================
-- 1. 啟用擴充功能
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. 建立所有資料表
-- ==========================================

-- Users 使用者表（核心權限）
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT CHECK (role IN ('owner', 'support', 'consumer')) DEFAULT 'consumer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products 產品表
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  cost NUMERIC(10, 2) DEFAULT 0,
  category TEXT,
  description TEXT,
  image TEXT,
  hover_video TEXT,
  status TEXT DEFAULT 'draft',
  aspect_ratio TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  focus_point JSONB,
  sections JSONB DEFAULT '[]'::jsonb,
  variants JSONB DEFAULT '[]'::jsonb,
  supplier JSONB DEFAULT '{}'::jsonb,
  name_zh TEXT,
  name_jp TEXT,
  name_ko TEXT,
  description_zh TEXT,
  description_jp TEXT,
  description_ko TEXT,
  -- 預購欄位
  is_preorder BOOLEAN DEFAULT false,
  preorder_start_date TIMESTAMPTZ,
  preorder_end_date TIMESTAMPTZ,
  expected_ship_date TIMESTAMPTZ,
  preorder_limit INTEGER,
  preorder_sold INTEGER DEFAULT 0,
  preorder_deposit_percentage INTEGER DEFAULT 100,
  preorder_status TEXT DEFAULT 'upcoming',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders 訂單表
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address JSONB NOT NULL,
  items JSONB NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending',
  tracking_carrier TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  timeline JSONB DEFAULT '[]'::jsonb,
  -- 預購欄位
  has_preorder BOOLEAN DEFAULT false,
  preorder_info JSONB DEFAULT '{}'::jsonb,
  deposit_amount NUMERIC(10, 2) DEFAULT 0,
  remaining_amount NUMERIC(10, 2) DEFAULT 0,
  expected_ship_date TIMESTAMPTZ,
  -- 會計欄位
  order_type TEXT DEFAULT 'stock',
  currency TEXT DEFAULT 'TWD',
  exchange_rate NUMERIC(10, 6) DEFAULT 1.0,
  subtotal NUMERIC(10, 2),
  tax_amount NUMERIC(10, 2) DEFAULT 0,
  shipping_fee NUMERIC(10, 2) DEFAULT 0,
  total_amount NUMERIC(10, 2),
  -- 客戶與稅務
  customer_country TEXT DEFAULT 'TW',
  customer_type TEXT DEFAULT 'B2C',
  tax_id TEXT,
  company_name TEXT,
  -- 發票
  invoice_required BOOLEAN DEFAULT false,
  invoice_type TEXT,
  invoice_number TEXT,
  invoice_issued_at TIMESTAMPTZ,
  tax_rate NUMERIC(5, 2) DEFAULT 5.0,
  tax_type TEXT DEFAULT 'taxable',
  -- 預購履約
  is_fulfilled BOOLEAN DEFAULT false,
  fulfilled_at TIMESTAMPTZ,
  deferred_revenue NUMERIC(10, 2) DEFAULT 0,
  recognized_revenue NUMERIC(10, 2) DEFAULT 0,
  preorder_batch_id TEXT,
  -- 訂單追蹤
  estimated_delivery_date TIMESTAMPTZ,
  last_status_update TIMESTAMPTZ DEFAULT NOW(),
  notification_sent JSONB DEFAULT '[]'::jsonb,
  can_cancel_until TIMESTAMPTZ,
  customer_notes TEXT,
  modification_requests JSONB DEFAULT '[]'::jsonb,
  -- 異常追蹤
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  flag_priority TEXT,
  assigned_to TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Articles 文章表（Journal）
CREATE TABLE IF NOT EXISTS public.articles (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  snippet TEXT,
  cover_image TEXT,
  category TEXT,
  author TEXT,
  date TIMESTAMPTZ,
  status TEXT DEFAULT 'draft',
  read_time TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  sections JSONB DEFAULT '[]'::jsonb,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tickets 客服工單表
CREATE TABLE IF NOT EXISTS public.tickets (
  id TEXT PRIMARY KEY,
  type TEXT,
  department TEXT DEFAULT 'General',
  status TEXT DEFAULT 'pending',
  order_id TEXT,
  messages JSONB DEFAULT '[]'::jsonb,
  user_email TEXT,
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics 分析表
CREATE TABLE IF NOT EXISTS public.analytics (
  id SERIAL PRIMARY KEY,
  total_visitors INTEGER DEFAULT 0,
  daily_visits JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Homepage Layout 首頁佈局表
CREATE TABLE IF NOT EXISTS public.homepage_layout (
  id SERIAL PRIMARY KEY,
  sections JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments 金流追蹤表
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_provider TEXT NOT NULL,
  transaction_id TEXT UNIQUE,
  payment_method TEXT,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'TWD',
  exchange_rate NUMERIC(10, 6) DEFAULT 1.0,
  amount_twd NUMERIC(10, 2),
  gateway_fee NUMERIC(10, 2) DEFAULT 0,
  net_amount NUMERIC(10, 2),
  payment_status TEXT DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  payout_status TEXT DEFAULT 'pending',
  payout_at TIMESTAMPTZ,
  payout_batch_id TEXT,
  payment_type TEXT DEFAULT 'full',
  metadata JSONB DEFAULT '{}'::jsonb,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipments 物流追蹤表
CREATE TABLE IF NOT EXISTS public.shipments (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
  carrier TEXT NOT NULL,
  tracking_number TEXT UNIQUE NOT NULL,
  tracking_url TEXT,
  package_weight NUMERIC(10, 2),
  package_dimensions JSONB,
  package_count INTEGER DEFAULT 1,
  shipment_status TEXT DEFAULT 'pending',
  current_location TEXT,
  status_updates JSONB DEFAULT '[]'::jsonb,
  shipped_at TIMESTAMPTZ,
  estimated_delivery TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  recipient_name TEXT,
  signature_url TEXT,
  delivery_photo_url TEXT,
  delivery_notes TEXT,
  is_delayed BOOLEAN DEFAULT false,
  delay_reason TEXT,
  exception_count INTEGER DEFAULT 0,
  last_exception TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refunds 退款追蹤表
CREATE TABLE IF NOT EXISTS public.refunds (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_id TEXT REFERENCES public.payments(id),
  refund_amount NUMERIC(10, 2) NOT NULL,
  refund_fee NUMERIC(10, 2) DEFAULT 0,
  net_refund NUMERIC(10, 2),
  refund_reason TEXT,
  refund_type TEXT DEFAULT 'full',
  invoice_action TEXT,
  credit_note_number TEXT,
  refund_status TEXT DEFAULT 'pending',
  refund_provider TEXT,
  refund_transaction_id TEXT,
  refunded_at TIMESTAMPTZ,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Tags 訂單標籤表
CREATE TABLE IF NOT EXISTS public.order_tags (
  id SERIAL PRIMARY KEY,
  order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
  tag_type TEXT NOT NULL,
  tag_value TEXT NOT NULL,
  tag_color TEXT,
  created_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, tag_type, tag_value)
);

-- ==========================================
-- 3. 補充欄位（舊 schema 相容，ADD COLUMN IF NOT EXISTS）
-- ==========================================

DO $$
BEGIN
  -- Products 多語系欄位
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'hover_video') THEN
    ALTER TABLE public.products ADD COLUMN hover_video TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'name_zh') THEN
    ALTER TABLE public.products ADD COLUMN name_zh TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'name_jp') THEN
    ALTER TABLE public.products ADD COLUMN name_jp TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'name_ko') THEN
    ALTER TABLE public.products ADD COLUMN name_ko TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'description_zh') THEN
    ALTER TABLE public.products ADD COLUMN description_zh TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'description_jp') THEN
    ALTER TABLE public.products ADD COLUMN description_jp TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'description_ko') THEN
    ALTER TABLE public.products ADD COLUMN description_ko TEXT;
  END IF;

  -- Products 預購欄位
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_preorder') THEN
    ALTER TABLE public.products ADD COLUMN is_preorder BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'preorder_start_date') THEN
    ALTER TABLE public.products ADD COLUMN preorder_start_date TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'preorder_end_date') THEN
    ALTER TABLE public.products ADD COLUMN preorder_end_date TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'expected_ship_date') THEN
    ALTER TABLE public.products ADD COLUMN expected_ship_date TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'preorder_limit') THEN
    ALTER TABLE public.products ADD COLUMN preorder_limit INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'preorder_sold') THEN
    ALTER TABLE public.products ADD COLUMN preorder_sold INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'preorder_deposit_percentage') THEN
    ALTER TABLE public.products ADD COLUMN preorder_deposit_percentage INTEGER DEFAULT 100;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'preorder_status') THEN
    ALTER TABLE public.products ADD COLUMN preorder_status TEXT DEFAULT 'upcoming';
  END IF;

  -- Articles 欄位
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'category') THEN
    ALTER TABLE public.articles ADD COLUMN category TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'read_time') THEN
    ALTER TABLE public.articles ADD COLUMN read_time TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'tags') THEN
    ALTER TABLE public.articles ADD COLUMN tags JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Tickets 欄位
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'type') THEN
    ALTER TABLE public.tickets ADD COLUMN type TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'department') THEN
    ALTER TABLE public.tickets ADD COLUMN department TEXT DEFAULT 'General';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'order_id') THEN
    ALTER TABLE public.tickets ADD COLUMN order_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'user_email') THEN
    ALTER TABLE public.tickets ADD COLUMN user_email TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'assigned_to') THEN
    ALTER TABLE public.tickets ADD COLUMN assigned_to TEXT;
  END IF;

  -- Orders 預購欄位
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'has_preorder') THEN
    ALTER TABLE public.orders ADD COLUMN has_preorder BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'preorder_info') THEN
    ALTER TABLE public.orders ADD COLUMN preorder_info JSONB DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'deposit_amount') THEN
    ALTER TABLE public.orders ADD COLUMN deposit_amount NUMERIC(10, 2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'remaining_amount') THEN
    ALTER TABLE public.orders ADD COLUMN remaining_amount NUMERIC(10, 2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'expected_ship_date') THEN
    ALTER TABLE public.orders ADD COLUMN expected_ship_date TIMESTAMPTZ;
  END IF;

  -- Orders 會計欄位
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'order_type') THEN
    ALTER TABLE public.orders ADD COLUMN order_type TEXT DEFAULT 'stock';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'currency') THEN
    ALTER TABLE public.orders ADD COLUMN currency TEXT DEFAULT 'TWD';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'exchange_rate') THEN
    ALTER TABLE public.orders ADD COLUMN exchange_rate NUMERIC(10, 6) DEFAULT 1.0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'subtotal') THEN
    ALTER TABLE public.orders ADD COLUMN subtotal NUMERIC(10, 2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'tax_amount') THEN
    ALTER TABLE public.orders ADD COLUMN tax_amount NUMERIC(10, 2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_fee') THEN
    ALTER TABLE public.orders ADD COLUMN shipping_fee NUMERIC(10, 2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'total_amount') THEN
    ALTER TABLE public.orders ADD COLUMN total_amount NUMERIC(10, 2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_country') THEN
    ALTER TABLE public.orders ADD COLUMN customer_country TEXT DEFAULT 'TW';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_type') THEN
    ALTER TABLE public.orders ADD COLUMN customer_type TEXT DEFAULT 'B2C';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'tax_id') THEN
    ALTER TABLE public.orders ADD COLUMN tax_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'company_name') THEN
    ALTER TABLE public.orders ADD COLUMN company_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'invoice_required') THEN
    ALTER TABLE public.orders ADD COLUMN invoice_required BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'invoice_type') THEN
    ALTER TABLE public.orders ADD COLUMN invoice_type TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'invoice_number') THEN
    ALTER TABLE public.orders ADD COLUMN invoice_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'invoice_issued_at') THEN
    ALTER TABLE public.orders ADD COLUMN invoice_issued_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'tax_rate') THEN
    ALTER TABLE public.orders ADD COLUMN tax_rate NUMERIC(5, 2) DEFAULT 5.0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'tax_type') THEN
    ALTER TABLE public.orders ADD COLUMN tax_type TEXT DEFAULT 'taxable';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'is_fulfilled') THEN
    ALTER TABLE public.orders ADD COLUMN is_fulfilled BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'fulfilled_at') THEN
    ALTER TABLE public.orders ADD COLUMN fulfilled_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'deferred_revenue') THEN
    ALTER TABLE public.orders ADD COLUMN deferred_revenue NUMERIC(10, 2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'recognized_revenue') THEN
    ALTER TABLE public.orders ADD COLUMN recognized_revenue NUMERIC(10, 2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'preorder_batch_id') THEN
    ALTER TABLE public.orders ADD COLUMN preorder_batch_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'estimated_delivery_date') THEN
    ALTER TABLE public.orders ADD COLUMN estimated_delivery_date TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'last_status_update') THEN
    ALTER TABLE public.orders ADD COLUMN last_status_update TIMESTAMPTZ DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'notification_sent') THEN
    ALTER TABLE public.orders ADD COLUMN notification_sent JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'can_cancel_until') THEN
    ALTER TABLE public.orders ADD COLUMN can_cancel_until TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_notes') THEN
    ALTER TABLE public.orders ADD COLUMN customer_notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'modification_requests') THEN
    ALTER TABLE public.orders ADD COLUMN modification_requests JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'is_flagged') THEN
    ALTER TABLE public.orders ADD COLUMN is_flagged BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'flag_reason') THEN
    ALTER TABLE public.orders ADD COLUMN flag_reason TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'flag_priority') THEN
    ALTER TABLE public.orders ADD COLUMN flag_priority TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'assigned_to') THEN
    ALTER TABLE public.orders ADD COLUMN assigned_to TEXT;
  END IF;
END $$;

-- ==========================================
-- 4. 索引
-- ==========================================

-- Products 索引
CREATE INDEX IF NOT EXISTS idx_products_preorder
  ON public.products(is_preorder, preorder_start_date, preorder_end_date);
CREATE INDEX IF NOT EXISTS idx_products_preorder_status
  ON public.products(preorder_status) WHERE is_preorder = true;

-- Orders 索引
CREATE INDEX IF NOT EXISTS idx_orders_preorder
  ON public.orders(has_preorder) WHERE has_preorder = true;
CREATE INDEX IF NOT EXISTS idx_orders_preorder_info
  ON public.orders USING GIN (preorder_info);
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON public.orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_currency ON public.orders(currency);
CREATE INDEX IF NOT EXISTS idx_orders_customer_country ON public.orders(customer_country);
CREATE INDEX IF NOT EXISTS idx_orders_is_fulfilled ON public.orders(is_fulfilled);
CREATE INDEX IF NOT EXISTS idx_orders_is_flagged
  ON public.orders(is_flagged) WHERE is_flagged = true;
CREATE INDEX IF NOT EXISTS idx_orders_invoice_number ON public.orders(invoice_number);

-- Payments 索引
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_status ON public.payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_payout_status ON public.payments(payout_status);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON public.payments(paid_at);

-- Shipments 索引
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON public.shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_shipment_status ON public.shipments(shipment_status);
CREATE INDEX IF NOT EXISTS idx_shipments_carrier ON public.shipments(carrier);
CREATE INDEX IF NOT EXISTS idx_shipments_is_delayed
  ON public.shipments(is_delayed) WHERE is_delayed = true;

-- Refunds 索引
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON public.refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON public.refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_refund_status ON public.refunds(refund_status);

-- Order Tags 索引
CREATE INDEX IF NOT EXISTS idx_order_tags_order_id ON public.order_tags(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tags_tag_type ON public.order_tags(tag_type);

-- ==========================================
-- 5. 啟用 Row Level Security (RLS)
-- ==========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_layout ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tags ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 6. Users RLS Policies（無循環依賴）
-- ==========================================
DROP POLICY IF EXISTS "authenticated_select_own" ON public.users;
DROP POLICY IF EXISTS "authenticated_insert_own" ON public.users;
DROP POLICY IF EXISTS "authenticated_update_own" ON public.users;
DROP POLICY IF EXISTS "service_role_all" ON public.users;
DROP POLICY IF EXISTS "owners_manage_users" ON public.users;
DROP POLICY IF EXISTS "Allow auth callback to insert users" ON public.users;
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Owners can manage users" ON public.users;
DROP POLICY IF EXISTS "Owners can view all users" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;

-- 已認證使用者讀取自己的記錄
CREATE POLICY "authenticated_select_own"
  ON public.users FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- 已認證使用者插入自己的記錄（OAuth callback 使用）
CREATE POLICY "authenticated_insert_own"
  ON public.users FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- 已認證使用者更新自己的記錄
CREATE POLICY "authenticated_update_own"
  ON public.users FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role 完整權限
CREATE POLICY "service_role_all"
  ON public.users FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ⚠️ 不加 owners_manage_users — 會造成 RLS 循環依賴
-- Owner 管理使用者改由 server-side (service_role) 處理

-- ==========================================
-- 7. Products RLS Policies
-- ==========================================
DROP POLICY IF EXISTS "public_view_published_products" ON public.products;
DROP POLICY IF EXISTS "admins_manage_products" ON public.products;

CREATE POLICY "public_view_published_products"
  ON public.products FOR SELECT
  USING (status = 'published');

CREATE POLICY "admins_manage_products"
  ON public.products FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('owner', 'support')
  ));

-- ==========================================
-- 8. Orders RLS Policies
-- ==========================================
DROP POLICY IF EXISTS "admins_manage_orders" ON public.orders;
DROP POLICY IF EXISTS "anyone_create_orders" ON public.orders;

CREATE POLICY "admins_manage_orders"
  ON public.orders FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('owner', 'support')
  ));

CREATE POLICY "anyone_create_orders"
  ON public.orders FOR INSERT TO anon
  WITH CHECK (true);

-- ==========================================
-- 9. Articles RLS Policies
-- ==========================================
DROP POLICY IF EXISTS "public_view_published_articles" ON public.articles;
DROP POLICY IF EXISTS "admins_manage_articles" ON public.articles;

CREATE POLICY "public_view_published_articles"
  ON public.articles FOR SELECT
  USING (status = 'published');

CREATE POLICY "admins_manage_articles"
  ON public.articles FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('owner', 'support')
  ));

-- ==========================================
-- 10. Tickets RLS Policies
-- ==========================================
DROP POLICY IF EXISTS "users_view_own_tickets" ON public.tickets;
DROP POLICY IF EXISTS "anyone_insert_tickets" ON public.tickets;
DROP POLICY IF EXISTS "authenticated_insert_tickets" ON public.tickets;
DROP POLICY IF EXISTS "users_update_own_tickets" ON public.tickets;
DROP POLICY IF EXISTS "admins_manage_tickets" ON public.tickets;
DROP POLICY IF EXISTS "service_role_tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow authenticated to insert tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow users to view own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Service role full access tickets" ON public.tickets;

CREATE POLICY "authenticated_insert_tickets"
  ON public.tickets FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "users_view_own_tickets"
  ON public.tickets FOR SELECT TO authenticated
  USING (user_email = auth.jwt() ->> 'email');

CREATE POLICY "users_update_own_tickets"
  ON public.tickets FOR UPDATE TO authenticated
  USING (user_email = auth.jwt() ->> 'email');

CREATE POLICY "admins_manage_tickets"
  ON public.tickets FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('owner', 'support')
  ));

CREATE POLICY "service_role_tickets"
  ON public.tickets FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ==========================================
-- 11. Payments / Shipments / Refunds / Order Tags RLS
-- ==========================================

-- Payments
DROP POLICY IF EXISTS "admins_manage_payments" ON public.payments;
DROP POLICY IF EXISTS "service_role_payments" ON public.payments;

CREATE POLICY "admins_manage_payments"
  ON public.payments FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('owner', 'support')
  ));

CREATE POLICY "service_role_payments"
  ON public.payments FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Shipments
DROP POLICY IF EXISTS "admins_manage_shipments" ON public.shipments;
DROP POLICY IF EXISTS "service_role_shipments" ON public.shipments;

CREATE POLICY "admins_manage_shipments"
  ON public.shipments FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('owner', 'support')
  ));

CREATE POLICY "service_role_shipments"
  ON public.shipments FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Refunds
DROP POLICY IF EXISTS "admins_manage_refunds" ON public.refunds;
DROP POLICY IF EXISTS "service_role_refunds" ON public.refunds;

CREATE POLICY "admins_manage_refunds"
  ON public.refunds FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('owner', 'support')
  ));

CREATE POLICY "service_role_refunds"
  ON public.refunds FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Order Tags
DROP POLICY IF EXISTS "admins_manage_order_tags" ON public.order_tags;
DROP POLICY IF EXISTS "service_role_order_tags" ON public.order_tags;

CREATE POLICY "admins_manage_order_tags"
  ON public.order_tags FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('owner', 'support')
  ));

CREATE POLICY "service_role_order_tags"
  ON public.order_tags FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ==========================================
-- 12. Analytics & Homepage RLS Policies
-- ==========================================
DROP POLICY IF EXISTS "public_view_analytics" ON public.analytics;
DROP POLICY IF EXISTS "admins_update_analytics" ON public.analytics;
DROP POLICY IF EXISTS "public_view_homepage" ON public.homepage_layout;
DROP POLICY IF EXISTS "owners_update_homepage" ON public.homepage_layout;

CREATE POLICY "public_view_analytics"
  ON public.analytics FOR SELECT
  USING (true);

CREATE POLICY "admins_update_analytics"
  ON public.analytics FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('owner', 'support')
  ));

CREATE POLICY "public_view_homepage"
  ON public.homepage_layout FOR SELECT
  USING (true);

CREATE POLICY "owners_update_homepage"
  ON public.homepage_layout FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'owner'
  ));

-- ==========================================
-- 13. Storage Policies（圖片上傳權限）
-- ==========================================
DROP POLICY IF EXISTS "authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "public_read_somnus" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_delete" ON storage.objects;

CREATE POLICY "authenticated_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'somnus');

CREATE POLICY "authenticated_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'somnus');

CREATE POLICY "public_read_somnus"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'somnus');

CREATE POLICY "authenticated_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'somnus');

-- 移除 MIME type 限制
UPDATE storage.buckets
SET allowed_mime_types = NULL
WHERE id = 'somnus';

-- ==========================================
-- 14. Functions & Triggers
-- ==========================================

-- 自動更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 預購狀態自動更新
CREATE OR REPLACE FUNCTION update_preorder_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_preorder = true THEN
    IF NEW.preorder_start_date IS NOT NULL AND NEW.preorder_end_date IS NOT NULL THEN
      IF NOW() < NEW.preorder_start_date THEN
        NEW.preorder_status := 'upcoming';
      ELSIF NOW() >= NEW.preorder_start_date AND NOW() <= NEW.preorder_end_date THEN
        NEW.preorder_status := 'active';
      ELSIF NOW() > NEW.preorder_end_date THEN
        NEW.preorder_status := 'ended';
      END IF;
    END IF;
    IF NEW.preorder_limit IS NOT NULL AND NEW.preorder_sold >= NEW.preorder_limit THEN
      NEW.preorder_status := 'ended';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 套用 updated_at trigger 到所有 public 表
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I',
      t, t
    );
    -- 只對有 updated_at 欄位的表建立 trigger
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = 'updated_at'
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
        t, t
      );
    END IF;
  END LOOP;
END;
$$;

-- Products 預購狀態 trigger
DROP TRIGGER IF EXISTS trigger_update_preorder_status ON public.products;
CREATE TRIGGER trigger_update_preorder_status
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION update_preorder_status();

-- ==========================================
-- 15. Views（報表與快捷查詢）
-- ==========================================

-- 進行中預購商品
CREATE OR REPLACE VIEW active_preorders AS
SELECT
  id, slug, name, price, image,
  is_preorder, preorder_start_date, preorder_end_date, expected_ship_date,
  preorder_limit, preorder_sold, preorder_deposit_percentage, preorder_status,
  CASE
    WHEN preorder_limit IS NOT NULL
    THEN ROUND((preorder_sold::numeric / preorder_limit::numeric) * 100, 2)
    ELSE NULL
  END AS preorder_progress,
  CASE
    WHEN preorder_limit IS NOT NULL
    THEN (preorder_limit - preorder_sold)
    ELSE NULL
  END AS preorder_remaining
FROM public.products
WHERE is_preorder = true AND status = 'published'
ORDER BY preorder_start_date DESC;

-- 每日營收報表
CREATE OR REPLACE VIEW daily_revenue_report AS
SELECT
  DATE(created_at) AS report_date,
  COUNT(*) AS total_orders,
  COUNT(*) FILTER (WHERE order_type = 'stock') AS stock_orders,
  COUNT(*) FILTER (WHERE order_type = 'preorder') AS preorder_orders,
  SUM(total_amount) AS gross_revenue,
  SUM(CASE WHEN is_fulfilled = true THEN recognized_revenue ELSE 0 END) AS recognized_revenue,
  SUM(CASE WHEN is_fulfilled = false AND has_preorder = true THEN deferred_revenue ELSE 0 END) AS deferred_revenue,
  SUM(tax_amount) AS total_tax,
  SUM(shipping_fee) AS total_shipping
FROM public.orders
WHERE status NOT IN ('cancelled', 'refunded')
GROUP BY DATE(created_at)
ORDER BY report_date DESC;

-- 遞延收入追蹤（預購）
CREATE OR REPLACE VIEW deferred_revenue_tracker AS
SELECT
  o.id AS order_id,
  o.customer_email,
  o.deposit_amount,
  o.total_amount,
  o.deferred_revenue,
  o.recognized_revenue,
  o.is_fulfilled,
  o.expected_ship_date,
  o.preorder_batch_id,
  EXTRACT(DAY FROM o.expected_ship_date - NOW()) AS days_until_fulfillment,
  CASE
    WHEN o.is_fulfilled = true THEN 'fulfilled'
    WHEN o.expected_ship_date < NOW() THEN 'overdue'
    WHEN EXTRACT(DAY FROM o.expected_ship_date - NOW()) <= 7 THEN 'upcoming'
    ELSE 'pending'
  END AS fulfillment_status
FROM public.orders o
WHERE o.has_preorder = true AND o.status NOT IN ('cancelled', 'refunded')
ORDER BY o.expected_ship_date;

-- 金流對帳
CREATE OR REPLACE VIEW payment_reconciliation AS
SELECT
  p.payment_provider,
  DATE(p.paid_at) AS payment_date,
  COUNT(*) AS transaction_count,
  SUM(p.amount) AS gross_amount,
  SUM(p.gateway_fee) AS total_fees,
  SUM(p.net_amount) AS net_amount,
  SUM(CASE WHEN p.payout_status = 'paid_out' THEN p.net_amount ELSE 0 END) AS paid_out,
  SUM(CASE WHEN p.payout_status = 'pending' THEN p.net_amount ELSE 0 END) AS pending_payout
FROM public.payments p
WHERE p.payment_status = 'completed'
GROUP BY p.payment_provider, DATE(p.paid_at)
ORDER BY payment_date DESC;

-- 物流異常報表
CREATE OR REPLACE VIEW shipment_exceptions AS
SELECT
  s.id, s.order_id, s.tracking_number, s.carrier,
  s.shipment_status, s.is_delayed, s.delay_reason,
  s.exception_count, s.last_exception, s.estimated_delivery,
  o.customer_email, o.customer_phone
FROM public.shipments s
JOIN public.orders o ON s.order_id = o.id
WHERE s.is_delayed = true
   OR s.exception_count > 0
   OR s.shipment_status IN ('failed', 'returned')
ORDER BY s.exception_count DESC, s.updated_at DESC;

-- ==========================================
-- 16. get_my_role()：SECURITY DEFINER（繞過 RLS）
-- ==========================================
-- 解決 public.users.id ≠ auth.uid() 的 ID 不一致問題
-- 先用 auth.uid() 查，失敗則 JOIN auth.users by email

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_role  TEXT;
  v_email TEXT;
BEGIN
  -- 嘗試 1：直接用 auth.uid() 比對 public.users.id
  SELECT role INTO v_role
  FROM public.users
  WHERE id = auth.uid();

  IF v_role IS NOT NULL THEN
    RETURN v_role;
  END IF;

  -- 嘗試 2：從 auth.users 取 email，再查 public.users
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = auth.uid();

  IF v_email IS NOT NULL THEN
    SELECT role INTO v_role
    FROM public.users
    WHERE email = v_email;
  END IF;

  RETURN COALESCE(v_role, 'consumer');
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- ==========================================
-- 17. 初始化基礎資料
-- ==========================================
INSERT INTO public.analytics (id, total_visitors, daily_visits)
VALUES (1, 0, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.homepage_layout (id, sections)
VALUES (1, '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 18. 修復 admin 帳號角色與 ID 不一致
-- ==========================================
-- 處理 public.users.id ≠ auth.users.id 的情況（不同帳號建立方式導致）

DO $$
DECLARE
  v_auth_uid   UUID;
  v_public_id  UUID;
BEGIN
  -- 從 auth.users 取得真正的 UID
  SELECT id INTO v_auth_uid
  FROM auth.users
  WHERE email = 'admin@somnus.com';

  IF v_auth_uid IS NULL THEN
    RAISE NOTICE '⚠️  admin@somnus.com 不存在於 auth.users，請先在 Authentication 頁面建立此帳號';
    RETURN;
  END IF;

  -- 查看 public.users 目前狀況
  SELECT id INTO v_public_id
  FROM public.users
  WHERE email = 'admin@somnus.com';

  IF v_public_id IS NULL THEN
    -- 不存在 → 直接插入
    INSERT INTO public.users (id, email, name, role)
    VALUES (v_auth_uid, 'admin@somnus.com', 'Admin', 'owner');
    RAISE NOTICE '✅ 已新增 admin@somnus.com (ID: %)', v_auth_uid;

  ELSIF v_public_id = v_auth_uid THEN
    -- ID 一致 → 只更新 role
    UPDATE public.users
    SET role = 'owner', updated_at = NOW()
    WHERE id = v_auth_uid;
    RAISE NOTICE '✅ admin@somnus.com role 已更新為 owner (ID: %)', v_auth_uid;

  ELSE
    -- ID 不一致 → 刪舊記錄，用正確 UID 重新插入
    RAISE NOTICE '⚠️  ID 不一致：public.users.id=%, auth.uid=% → 修正中', v_public_id, v_auth_uid;
    DELETE FROM public.users WHERE id = v_public_id;
    INSERT INTO public.users (id, email, name, role)
    VALUES (v_auth_uid, 'admin@somnus.com', 'Admin', 'owner');
    RAISE NOTICE '✅ admin@somnus.com 已修正為正確 ID: %', v_auth_uid;
  END IF;
END $$;

-- ==========================================
-- 19. 商家設定表（金流隨插即用）
-- ==========================================

-- merchant_settings：儲存金流服務商 API 金鑰
-- 只有一筆記錄（id=1），所有欄位皆為加密儲存建議（目前明文，可接 Vault）
CREATE TABLE IF NOT EXISTS public.merchant_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,

  -- 啟用的金流服務商
  payment_provider TEXT NOT NULL DEFAULT 'manual'
    CHECK (payment_provider IN ('manual', 'ecpay', 'stripe', 'tappay')),

  -- ECPay 綠界
  ecpay_merchant_id     TEXT,
  ecpay_hash_key        TEXT,
  ecpay_hash_iv         TEXT,
  ecpay_test_mode       BOOLEAN DEFAULT TRUE,

  -- Stripe
  stripe_publishable_key TEXT,
  stripe_secret_key      TEXT,
  stripe_webhook_secret  TEXT,

  -- TapPay
  tappay_partner_key  TEXT,
  tappay_merchant_id  TEXT,
  tappay_test_mode    BOOLEAN DEFAULT TRUE,

  -- 通用設定
  payment_currency TEXT DEFAULT 'TWD',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 確保只有一筆記錄（id=1）
INSERT INTO public.merchant_settings (id, payment_provider)
VALUES (1, 'manual')
ON CONFLICT (id) DO NOTHING;

-- RLS：只有 owner/support 可讀寫，一般用戶不可存取
ALTER TABLE public.merchant_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "merchant_settings_owner_read" ON public.merchant_settings;
CREATE POLICY "merchant_settings_owner_read" ON public.merchant_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('owner', 'support')
    )
  );

DROP POLICY IF EXISTS "merchant_settings_owner_write" ON public.merchant_settings;
CREATE POLICY "merchant_settings_owner_write" ON public.merchant_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'owner'
    )
  );

-- ==========================================
-- 20. 驗證結果
-- ==========================================
SELECT '=== Users Policies ===' AS section;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users' ORDER BY policyname;

SELECT '=== Tickets Policies ===' AS section;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'tickets' ORDER BY policyname;

SELECT '=== Storage Policies ===' AS section;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'objects' ORDER BY policyname;

SELECT '=== get_my_role() Function ===' AS section;
SELECT proname, prosecdef FROM pg_proc WHERE proname = 'get_my_role';

SELECT '=== Admin Account ===' AS section;
SELECT u.id AS public_id, a.id AS auth_id, u.email, u.role,
  (u.id = a.id) AS id_matches
FROM public.users u
LEFT JOIN auth.users a ON a.email = u.email
WHERE u.email = 'admin@somnus.com';
