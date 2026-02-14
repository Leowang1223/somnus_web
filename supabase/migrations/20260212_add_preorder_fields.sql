-- ==========================================
-- 預購功能 Migration
-- Created: 2026-02-12
-- ==========================================

-- ==========================================
-- 1. Products Table - 新增預購欄位
-- ==========================================

-- 新增預購相關欄位
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_preorder BOOLEAN DEFAULT false;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS preorder_start_date TIMESTAMPTZ;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS preorder_end_date TIMESTAMPTZ;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS expected_ship_date TIMESTAMPTZ;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS preorder_limit INTEGER;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS preorder_sold INTEGER DEFAULT 0;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS preorder_deposit_percentage INTEGER DEFAULT 100;

-- 新增預購狀態欄位 (upcoming/active/ended/shipped)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS preorder_status TEXT DEFAULT 'upcoming';

-- 新增索引以加速預購商品查詢
CREATE INDEX IF NOT EXISTS idx_products_preorder
ON public.products(is_preorder, preorder_start_date, preorder_end_date);

CREATE INDEX IF NOT EXISTS idx_products_preorder_status
ON public.products(preorder_status) WHERE is_preorder = true;

-- ==========================================
-- 2. Orders Table - 新增預購訂單支援
-- ==========================================

-- 新增預購訂單標記
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS has_preorder BOOLEAN DEFAULT false;

-- 新增預購詳細資訊 (JSONB格式儲存)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS preorder_info JSONB DEFAULT '{}'::jsonb;

-- 新增訂金與尾款欄位
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10, 2) DEFAULT 0;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC(10, 2) DEFAULT 0;

-- 新增預購訂單索引
CREATE INDEX IF NOT EXISTS idx_orders_preorder
ON public.orders(has_preorder) WHERE has_preorder = true;

CREATE INDEX IF NOT EXISTS idx_orders_preorder_info
ON public.orders USING GIN (preorder_info);

-- ==========================================
-- 3. 建立預購狀態自動更新函數
-- ==========================================

CREATE OR REPLACE FUNCTION update_preorder_status()
RETURNS TRIGGER AS $$
BEGIN
  -- 只處理預購商品
  IF NEW.is_preorder = true THEN
    -- 根據時間自動更新狀態
    IF NEW.preorder_start_date IS NOT NULL AND NEW.preorder_end_date IS NOT NULL THEN
      IF NOW() < NEW.preorder_start_date THEN
        NEW.preorder_status := 'upcoming';
      ELSIF NOW() >= NEW.preorder_start_date AND NOW() <= NEW.preorder_end_date THEN
        NEW.preorder_status := 'active';
      ELSIF NOW() > NEW.preorder_end_date THEN
        NEW.preorder_status := 'ended';
      END IF;
    END IF;

    -- 檢查是否售罄
    IF NEW.preorder_limit IS NOT NULL AND NEW.preorder_sold >= NEW.preorder_limit THEN
      NEW.preorder_status := 'ended';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 建立觸發器
DROP TRIGGER IF EXISTS trigger_update_preorder_status ON public.products;
CREATE TRIGGER trigger_update_preorder_status
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION update_preorder_status();

-- ==========================================
-- 4. 建立預購商品查詢 View
-- ==========================================

CREATE OR REPLACE VIEW active_preorders AS
SELECT
  id,
  slug,
  name,
  price,
  image,
  is_preorder,
  preorder_start_date,
  preorder_end_date,
  expected_ship_date,
  preorder_limit,
  preorder_sold,
  preorder_deposit_percentage,
  preorder_status,
  CASE
    WHEN preorder_limit IS NOT NULL THEN
      ROUND((preorder_sold::numeric / preorder_limit::numeric) * 100, 2)
    ELSE NULL
  END as preorder_progress,
  CASE
    WHEN preorder_limit IS NOT NULL THEN
      (preorder_limit - preorder_sold)
    ELSE NULL
  END as preorder_remaining
FROM public.products
WHERE is_preorder = true
  AND status = 'published'
ORDER BY preorder_start_date DESC;

-- ==========================================
-- 5. 註釋說明
-- ==========================================

COMMENT ON COLUMN public.products.is_preorder IS '是否為預購商品';
COMMENT ON COLUMN public.products.preorder_start_date IS '預購開始時間';
COMMENT ON COLUMN public.products.preorder_end_date IS '預購結束時間';
COMMENT ON COLUMN public.products.expected_ship_date IS '預計出貨日期';
COMMENT ON COLUMN public.products.preorder_limit IS '預購數量上限（NULL = 無限制）';
COMMENT ON COLUMN public.products.preorder_sold IS '已預購數量';
COMMENT ON COLUMN public.products.preorder_deposit_percentage IS '訂金比例（100 = 全額付款）';
COMMENT ON COLUMN public.products.preorder_status IS '預購狀態：upcoming（即將開始）、active（進行中）、ended（已結束）、shipped（已出貨）';

COMMENT ON COLUMN public.orders.has_preorder IS '訂單是否包含預購商品';
COMMENT ON COLUMN public.orders.preorder_info IS '預購詳細資訊（JSON格式）';
COMMENT ON COLUMN public.orders.deposit_amount IS '已支付訂金金額';
COMMENT ON COLUMN public.orders.remaining_amount IS '待支付尾款金額';
