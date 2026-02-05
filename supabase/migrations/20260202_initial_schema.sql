-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- Users Table
-- ==========================================
-- Note: This links to Supabase Auth users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT CHECK (role IN ('owner', 'support', 'consumer')) DEFAULT 'consumer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- Products Table
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- Orders Table
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
-- Articles Table (Journal)
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- Tickets Table (Customer Service)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.tickets (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- Analytics Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.analytics (
  id SERIAL PRIMARY KEY,
  total_visitors INTEGER DEFAULT 0,
  daily_visits JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- Homepage Layout Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.homepage_layout (
  id SERIAL PRIMARY KEY,
  sections JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- Indexes for Performance
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON public.orders(date);
CREATE INDEX IF NOT EXISTS idx_orders_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);

-- ==========================================
-- Row Level Security (RLS) Policies
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_layout ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Products Policies
-- ==========================================

DROP POLICY IF EXISTS "Public products are viewable by everyone" ON public.products;
CREATE POLICY "Public products are viewable by everyone"
  ON public.products
  FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
CREATE POLICY "Admins can view all products"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'support')
    )
  );

DROP POLICY IF EXISTS "Owners can manage products" ON public.products;
CREATE POLICY "Owners can manage products"
  ON public.products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'owner'
    )
  );

-- ==========================================
-- Orders Policies
-- ==========================================

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'support')
    )
  );

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'support')
    )
  );

DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders"
  ON public.orders
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- ==========================================
-- Articles Policies
-- ==========================================

DROP POLICY IF EXISTS "Public articles are viewable by everyone" ON public.articles;
CREATE POLICY "Public articles are viewable by everyone"
  ON public.articles
  FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Admins can view all articles" ON public.articles;
CREATE POLICY "Admins can view all articles"
  ON public.articles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'support')
    )
  );

DROP POLICY IF EXISTS "Owners can manage articles" ON public.articles;
CREATE POLICY "Owners can manage articles"
  ON public.articles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'owner'
    )
  );

-- ==========================================
-- Tickets Policies
-- ==========================================

DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
CREATE POLICY "Admins can view all tickets"
  ON public.tickets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'support')
    )
  );

DROP POLICY IF EXISTS "Admins can update tickets" ON public.tickets;
CREATE POLICY "Admins can update tickets"
  ON public.tickets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'support')
    )
  );

DROP POLICY IF EXISTS "Anyone can create tickets" ON public.tickets;
CREATE POLICY "Anyone can create tickets"
  ON public.tickets
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- ==========================================
-- Users Policies
-- ==========================================

DROP POLICY IF EXISTS "Users can view own data" ON public.users;
CREATE POLICY "Users can view own data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Owners can view all users" ON public.users;
CREATE POLICY "Owners can view all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Owners can manage users" ON public.users;
CREATE POLICY "Owners can manage users"
  ON public.users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'owner'
    )
  );

-- ==========================================
-- Analytics & Homepage Policies
-- ==========================================

DROP POLICY IF EXISTS "Public can view analytics" ON public.analytics;
CREATE POLICY "Public can view analytics"
  ON public.analytics
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can update analytics" ON public.analytics;
CREATE POLICY "Admins can update analytics"
  ON public.analytics
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'support')
    )
  );

DROP POLICY IF EXISTS "Public can view homepage" ON public.homepage_layout;
CREATE POLICY "Public can view homepage"
  ON public.homepage_layout
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Owners can update homepage" ON public.homepage_layout;
CREATE POLICY "Owners can update homepage"
  ON public.homepage_layout
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'owner'
    )
  );

-- ==========================================
-- Functions & Triggers
-- ==========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_articles_updated_at ON public.articles;
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tickets_updated_at ON public.tickets;
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_analytics_updated_at ON public.analytics;
CREATE TRIGGER update_analytics_updated_at BEFORE UPDATE ON public.analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_homepage_updated_at ON public.homepage_layout;
CREATE TRIGGER update_homepage_updated_at BEFORE UPDATE ON public.homepage_layout
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- Initial Data
-- ==========================================

-- Insert default analytics record
INSERT INTO public.analytics (id, total_visitors, daily_visits)
VALUES (1, 0, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Insert default homepage layout
INSERT INTO public.homepage_layout (id, sections)
VALUES (1, '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;
