-- 1. 啟用 UUID 擴充功能
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. Users 使用者表 (核心權限)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT CHECK (role IN ('owner', 'support', 'consumer')) DEFAULT 'consumer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. Products 產品表
-- ==========================================
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

-- ==========================================
-- 4. Orders 訂單表
-- ==========================================
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

-- ==========================================
-- 5. Articles 文章表 (Journal)
-- ==========================================
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

-- ==========================================
-- 6. Tickets 客服工單表
-- ==========================================
CREATE TABLE IF NOT EXISTS public.tickets (
  id TEXT PRIMARY KEY,
  type TEXT,
  department TEXT,
  status TEXT DEFAULT 'pending',
  order_id TEXT,
  messages JSONB DEFAULT '[]'::jsonb,
  user_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure user_email column exists (for migration from older schema)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'user_email') THEN
        ALTER TABLE public.tickets ADD COLUMN user_email TEXT;
    END IF;
END $$;

-- ==========================================
-- 7. Analytics & Layout 其他設定表
-- ==========================================
CREATE TABLE IF NOT EXISTS public.analytics (
  id SERIAL PRIMARY KEY,
  total_visitors INTEGER DEFAULT 0,
  daily_visits JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.homepage_layout (
  id SERIAL PRIMARY KEY,
  sections JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 8. Enable Row Level Security (RLS)
-- ==========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_layout ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 9. RLS Policies (權限設定)
-- ==========================================

-- Users Policies (Fixed for Circular Dependency)
DROP POLICY IF EXISTS "authenticated_select_own" ON public.users;
CREATE POLICY "authenticated_select_own" ON public.users FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "authenticated_insert_own" ON public.users;
CREATE POLICY "authenticated_insert_own" ON public.users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "authenticated_update_own" ON public.users;
CREATE POLICY "authenticated_update_own" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "service_role_all" ON public.users;
CREATE POLICY "service_role_all" ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ⚠️ 不加入 owners_manage_users policy — 會造成 RLS 循環依賴
-- Owner 管理其他使用者的功能改由 server-side (service_role) 處理
DROP POLICY IF EXISTS "owners_manage_users" ON public.users;

-- Products Policies
DROP POLICY IF EXISTS "public_view_published_products" ON public.products;
CREATE POLICY "public_view_published_products" ON public.products FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "admins_manage_products" ON public.products;
CREATE POLICY "admins_manage_products" ON public.products FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('owner', 'support')));

-- Orders Policies
DROP POLICY IF EXISTS "admins_manage_orders" ON public.orders;
CREATE POLICY "admins_manage_orders" ON public.orders FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('owner', 'support')));

DROP POLICY IF EXISTS "anyone_create_orders" ON public.orders;
CREATE POLICY "anyone_create_orders" ON public.orders FOR INSERT TO anon WITH CHECK (true);

-- Articles Policies
DROP POLICY IF EXISTS "public_view_published_articles" ON public.articles;
CREATE POLICY "public_view_published_articles" ON public.articles FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "admins_manage_articles" ON public.articles;
CREATE POLICY "admins_manage_articles" ON public.articles FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('owner', 'support')));

-- Tickets Policies
DROP POLICY IF EXISTS "users_view_own_tickets" ON public.tickets;
CREATE POLICY "users_view_own_tickets" ON public.tickets FOR SELECT TO authenticated USING (user_email = auth.jwt() ->> 'email');

DROP POLICY IF EXISTS "anyone_insert_tickets" ON public.tickets;
CREATE POLICY "anyone_insert_tickets" ON public.tickets FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admins_manage_tickets" ON public.tickets;
CREATE POLICY "admins_manage_tickets" ON public.tickets FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('owner', 'support')));

-- Analytics & Homepage
DROP POLICY IF EXISTS "public_view_analytics" ON public.analytics;
CREATE POLICY "public_view_analytics" ON public.analytics FOR SELECT USING (true);

DROP POLICY IF EXISTS "admins_update_analytics" ON public.analytics;
CREATE POLICY "admins_update_analytics" ON public.analytics FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('owner', 'support')));

DROP POLICY IF EXISTS "public_view_homepage" ON public.homepage_layout;
CREATE POLICY "public_view_homepage" ON public.homepage_layout FOR SELECT USING (true);

DROP POLICY IF EXISTS "owners_update_homepage" ON public.homepage_layout;
CREATE POLICY "owners_update_homepage" ON public.homepage_layout FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'owner'));

-- ==========================================
-- 10. Triggers (自動更新時間戳記)
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
-- 11. 初始化基礎資料
-- ==========================================
INSERT INTO public.analytics (id, total_visitors, daily_visits) VALUES (1, 0, '{}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.homepage_layout (id, sections) VALUES (1, '[]'::jsonb) ON CONFLICT (id) DO NOTHING;
