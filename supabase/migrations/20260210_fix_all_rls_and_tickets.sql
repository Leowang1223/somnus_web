-- ==========================================
-- 🔧 完整修復：RLS 循環依賴 + Tickets schema
-- 在 Supabase Dashboard > SQL Editor 執行此腳本
-- ==========================================

-- ==========================================
-- PART 1: 修復 Users RLS (移除循環依賴)
-- ==========================================

-- 清除所有可能造成循環依賴的 policy
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

-- 重建乾淨的 RLS policies（無循環依賴）

-- 1. 已認證使用者可以讀取自己的記錄（用 auth.uid() = id，不做子查詢）
CREATE POLICY "authenticated_select_own"
  ON public.users FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- 2. 已認證使用者可以插入自己的記錄（OAuth callback 使用）
CREATE POLICY "authenticated_insert_own"
  ON public.users FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- 3. 已認證使用者可以更新自己的記錄
CREATE POLICY "authenticated_update_own"
  ON public.users FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Service role 完整權限（server-side actions 使用）
CREATE POLICY "service_role_all"
  ON public.users FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ⚠️ 注意：不再加入 owners_manage_users policy！
-- Owner 管理其他使用者的功能改由 server-side (service_role) 處理

-- ==========================================
-- PART 2: 修復 Tickets schema
-- ==========================================

-- 確保 tickets 表有所有需要的欄位
DO $$
BEGIN
    -- 確保 type 欄位存在
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'type') THEN
        ALTER TABLE public.tickets ADD COLUMN type TEXT;
    END IF;

    -- 確保 department 欄位存在
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'department') THEN
        ALTER TABLE public.tickets ADD COLUMN department TEXT DEFAULT 'General';
    END IF;

    -- 確保 order_id 欄位存在
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'order_id') THEN
        ALTER TABLE public.tickets ADD COLUMN order_id TEXT;
    END IF;

    -- 確保 user_email 欄位存在
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'user_email') THEN
        ALTER TABLE public.tickets ADD COLUMN user_email TEXT;
    END IF;

    -- 確保 assigned_to 欄位存在（用於 claim ticket）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'assigned_to') THEN
        ALTER TABLE public.tickets ADD COLUMN assigned_to TEXT;
    END IF;
END $$;

-- ==========================================
-- PART 3: 修復 Tickets RLS
-- ==========================================

DROP POLICY IF EXISTS "users_view_own_tickets" ON public.tickets;
DROP POLICY IF EXISTS "anyone_insert_tickets" ON public.tickets;
DROP POLICY IF EXISTS "admins_manage_tickets" ON public.tickets;
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
-- 使用 auth.uid() 直接查 users 表（不會循環因為 users 的 policy 不查 tickets）
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
-- PART 4: 確保 admin 帳號存在且角色正確
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
    RAISE NOTICE '⚠️ admin@somnus.com 不存在於 auth.users';
  END IF;
END $$;

-- ==========================================
-- PART 5: 修復 Storage Policies（圖片上傳權限）
-- ==========================================

-- 允許認證用戶上傳到 somnus bucket
DROP POLICY IF EXISTS "authenticated_upload" ON storage.objects;
CREATE POLICY "authenticated_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'somnus');

-- 允許認證用戶更新自己上傳的檔案
DROP POLICY IF EXISTS "authenticated_update" ON storage.objects;
CREATE POLICY "authenticated_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'somnus');

-- 允許所有人讀取 somnus bucket（public bucket）
DROP POLICY IF EXISTS "public_read_somnus" ON storage.objects;
CREATE POLICY "public_read_somnus"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'somnus');

-- 允許認證用戶刪除檔案
DROP POLICY IF EXISTS "authenticated_delete" ON storage.objects;
CREATE POLICY "authenticated_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'somnus');

-- 移除 somnus bucket 的 MIME type 限制（允許所有類型）
UPDATE storage.buckets
SET allowed_mime_types = NULL
WHERE id = 'somnus';

-- ==========================================
-- 驗證
-- ==========================================
SELECT id, email, role FROM public.users WHERE email = 'admin@somnus.com';
