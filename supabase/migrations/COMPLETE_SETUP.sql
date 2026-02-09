-- ==========================================
-- SØMNUS 完整資料庫設定（一次貼上即可）
-- 在 Supabase Dashboard > SQL Editor 執行
-- 冪等設計：可重複執行不會出錯
-- ==========================================

-- 1. 啟用 UUID 擴充功能
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. 建立所有資料表
-- ==========================================

-- Users 使用者表 (核心權限)
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
  status TEXT DEFAULT 'draft',
  aspect_ratio TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  focus_point JSONB,
  sections JSONB DEFAULT '[]'::jsonb,
  variants JSONB DEFAULT '[]'::jsonb,
  supplier JSONB DEFAULT '{}'::jsonb,
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
  status TEXT DEFAULT 'paid',
  tracking_carrier TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  timeline JSONB DEFAULT '[]'::jsonb,
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Articles 文章表 (Journal)
CREATE TABLE IF NOT EXISTS public.articles (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  snippet TEXT,
  cover_image TEXT,
  author TEXT,
  date TIMESTAMPTZ,
  status TEXT DEFAULT 'draft',
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

-- 確保 tickets 有所有需要的欄位（舊 schema 可能缺少）
DO $$
BEGIN
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
END $$;

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

-- ==========================================
-- 3. 啟用 Row Level Security (RLS)
-- ==========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_layout ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. Users RLS Policies（無循環依賴）
-- ==========================================

-- 清除所有舊 policy
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

-- 已認證使用者可以讀取自己的記錄
CREATE POLICY "authenticated_select_own"
  ON public.users FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- 已認證使用者可以插入自己的記錄（OAuth callback 使用）
CREATE POLICY "authenticated_insert_own"
  ON public.users FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- 已認證使用者可以更新自己的記錄
CREATE POLICY "authenticated_update_own"
  ON public.users FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role 完整權限（server-side actions 使用）
CREATE POLICY "service_role_all"
  ON public.users FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ⚠️ 不加入 owners_manage_users — 會造成 RLS 循環依賴
-- Owner 管理使用者改由 server-side (service_role) 處理

-- ==========================================
-- 5. Products RLS Policies
-- ==========================================
DROP POLICY IF EXISTS "public_view_published_products" ON public.products;
CREATE POLICY "public_view_published_products"
  ON public.products FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "admins_manage_products" ON public.products;
CREATE POLICY "admins_manage_products"
  ON public.products FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('owner', 'support')));

-- ==========================================
-- 6. Orders RLS Policies
-- ==========================================
DROP POLICY IF EXISTS "admins_manage_orders" ON public.orders;
CREATE POLICY "admins_manage_orders"
  ON public.orders FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('owner', 'support')));

DROP POLICY IF EXISTS "anyone_create_orders" ON public.orders;
CREATE POLICY "anyone_create_orders"
  ON public.orders FOR INSERT TO anon
  WITH CHECK (true);

-- ==========================================
-- 7. Articles RLS Policies
-- ==========================================
DROP POLICY IF EXISTS "public_view_published_articles" ON public.articles;
CREATE POLICY "public_view_published_articles"
  ON public.articles FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "admins_manage_articles" ON public.articles;
CREATE POLICY "admins_manage_articles"
  ON public.articles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('owner', 'support')));

-- ==========================================
-- 8. Tickets RLS Policies
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

-- 已認證使用者可以建立 ticket
CREATE POLICY "authenticated_insert_tickets"
  ON public.tickets FOR INSERT TO authenticated
  WITH CHECK (true);

-- 使用者可以查看自己的 tickets
CREATE POLICY "users_view_own_tickets"
  ON public.tickets FOR SELECT TO authenticated
  USING (user_email = auth.jwt() ->> 'email');

-- 使用者可以更新自己的 tickets（發送訊息）
CREATE POLICY "users_update_own_tickets"
  ON public.tickets FOR UPDATE TO authenticated
  USING (user_email = auth.jwt() ->> 'email');

-- Admin (owner/support) 可以管理所有 tickets
CREATE POLICY "admins_manage_tickets"
  ON public.tickets FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('owner', 'support')
    )
  );

-- Service role 完整權限
CREATE POLICY "service_role_tickets"
  ON public.tickets FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ==========================================
-- 9. Analytics & Homepage RLS Policies
-- ==========================================
DROP POLICY IF EXISTS "public_view_analytics" ON public.analytics;
CREATE POLICY "public_view_analytics"
  ON public.analytics FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "admins_update_analytics" ON public.analytics;
CREATE POLICY "admins_update_analytics"
  ON public.analytics FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('owner', 'support')));

DROP POLICY IF EXISTS "public_view_homepage" ON public.homepage_layout;
CREATE POLICY "public_view_homepage"
  ON public.homepage_layout FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "owners_update_homepage" ON public.homepage_layout;
CREATE POLICY "owners_update_homepage"
  ON public.homepage_layout FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'owner'));

-- ==========================================
-- 10. Storage Policies（圖片上傳權限）
-- ==========================================

-- 允許認證用戶上傳到 somnus bucket
DROP POLICY IF EXISTS "authenticated_upload" ON storage.objects;
CREATE POLICY "authenticated_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'somnus');

-- 允許認證用戶更新檔案
DROP POLICY IF EXISTS "authenticated_update" ON storage.objects;
CREATE POLICY "authenticated_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'somnus');

-- 允許所有人讀取 somnus bucket（public）
DROP POLICY IF EXISTS "public_read_somnus" ON storage.objects;
CREATE POLICY "public_read_somnus"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'somnus');

-- 允許認證用戶刪除檔案
DROP POLICY IF EXISTS "authenticated_delete" ON storage.objects;
CREATE POLICY "authenticated_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'somnus');

-- 移除 somnus bucket 的 MIME type 限制
UPDATE storage.buckets
SET allowed_mime_types = NULL
WHERE id = 'somnus';

-- ==========================================
-- 11. Triggers（自動更新時間戳記）
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
  END LOOP;
END;
$$;

-- ==========================================
-- 12. 初始化基礎資料
-- ==========================================
INSERT INTO public.analytics (id, total_visitors, daily_visits)
VALUES (1, 0, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.homepage_layout (id, sections)
VALUES (1, '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 13. 確保 admin 帳號角色正確
-- ==========================================
DO $$
DECLARE
  admin_uid UUID;
BEGIN
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'admin@somnus.com';

  IF admin_uid IS NOT NULL THEN
    INSERT INTO public.users (id, email, name, role)
    VALUES (admin_uid, 'admin@somnus.com', 'Admin', 'owner')
    ON CONFLICT (id) DO UPDATE SET role = 'owner', updated_at = NOW();

    RAISE NOTICE '✅ admin@somnus.com 已設定為 owner (ID: %)', admin_uid;
  ELSE
    RAISE NOTICE '⚠️ admin@somnus.com 不存在於 auth.users — 請先在 Authentication 建立此帳號';
  END IF;
END $$;

-- ==========================================
-- 驗證結果
-- ==========================================
SELECT '--- Users Policies ---' AS section;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users' ORDER BY policyname;

SELECT '--- Tickets Policies ---' AS section;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'tickets' ORDER BY policyname;

SELECT '--- Storage Policies ---' AS section;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'objects' ORDER BY policyname;

SELECT '--- Admin Account ---' AS section;
SELECT id, email, role FROM public.users WHERE email = 'admin@somnus.com';
