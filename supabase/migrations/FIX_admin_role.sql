-- 🔧 一鍵修復 admin@somnus.com 角色問題
-- 在 Supabase Dashboard > SQL Editor 執行此腳本

-- ==========================================
-- 步驟 1: 診斷問題
-- ==========================================

DO $$
DECLARE
  auth_user_id UUID;
  public_user_record RECORD;
  diagnosis TEXT := '';
BEGIN
  RAISE NOTICE '=== 開始診斷 admin@somnus.com ===';
  
  -- 檢查 auth.users
  SELECT id INTO auth_user_id FROM auth.users WHERE email = 'admin@somnus.com';
  
  IF auth_user_id IS NULL THEN
    diagnosis := '❌ 問題：auth.users 中找不到 admin@somnus.com';
    RAISE NOTICE '%', diagnosis;
    RAISE NOTICE '解決方法：請先在 Supabase Dashboard > Authentication > Users 建立此帳號';
    RAISE EXCEPTION '請先建立 Auth 使用者後再執行此腳本';
  ELSE
    RAISE NOTICE '✅ auth.users 中找到使用者，ID: %', auth_user_id;
  END IF;
  
  -- 檢查 public.users
  SELECT * INTO public_user_record FROM public.users WHERE id = auth_user_id;
  
  IF public_user_record IS NULL THEN
    RAISE NOTICE '⚠️ public.users 中找不到對應記錄，將建立新記錄';
  ELSE
    RAISE NOTICE '✅ public.users 中找到記錄，當前角色: %', public_user_record.role;
  END IF;
  
END $$;

-- ==========================================
-- 步驟 2: 修復資料
-- ==========================================

DO $$
DECLARE
  auth_user_id UUID;
BEGIN
  -- 取得 auth.users 的 ID
  SELECT id INTO auth_user_id FROM auth.users WHERE email = 'admin@somnus.com';
  
  IF auth_user_id IS NOT NULL THEN
    -- 插入或更新 public.users
    INSERT INTO public.users (id, email, name, role, created_at, updated_at)
    VALUES (
      auth_user_id,
      'admin@somnus.com',
      'Admin',
      'owner',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) 
    DO UPDATE SET 
      role = 'owner',
      email = 'admin@somnus.com',
      updated_at = NOW();
    
    RAISE NOTICE '✅ 已將 admin@somnus.com 設定為 owner';
  END IF;
END $$;

-- ==========================================
-- 步驟 3: 驗證修復結果
-- ==========================================

DO $$
DECLARE
  user_role TEXT;
  auth_id UUID;
  public_id UUID;
BEGIN
  RAISE NOTICE '=== 驗證修復結果 ===';
  
  -- 檢查 ID 是否匹配
  SELECT au.id, pu.id, pu.role 
  INTO auth_id, public_id, user_role
  FROM auth.users au
  LEFT JOIN public.users pu ON au.id = pu.id
  WHERE au.email = 'admin@somnus.com';
  
  IF auth_id IS NULL THEN
    RAISE NOTICE '❌ auth.users 中找不到使用者';
  ELSIF public_id IS NULL THEN
    RAISE NOTICE '❌ public.users 中找不到使用者';
  ELSIF auth_id != public_id THEN
    RAISE NOTICE '❌ ID 不匹配！auth: %, public: %', auth_id, public_id;
  ELSIF user_role != 'owner' THEN
    RAISE NOTICE '❌ 角色不正確：%（應該是 owner）', user_role;
  ELSE
    RAISE NOTICE '✅ 驗證成功！';
    RAISE NOTICE '   - Auth ID: %', auth_id;
    RAISE NOTICE '   - Public ID: %', public_id;
    RAISE NOTICE '   - Role: %', user_role;
  END IF;
END $$;

-- ==========================================
-- 步驟 4: 測試 RLS 權限（模擬前端查詢）
-- ==========================================

-- 這個查詢模擬前端的查詢方式
-- 如果回傳空結果，表示 RLS 策略有問題

SELECT 
  '=== RLS 權限測試 ===' as test,
  id,
  email,
  role,
  CASE 
    WHEN role = 'owner' THEN '✅ 角色正確'
    ELSE '❌ 角色錯誤：' || role
  END as status
FROM public.users 
WHERE email = 'admin@somnus.com';

-- 如果上面的查詢沒有回傳結果，執行以下修復 RLS 的腳本：

-- ==========================================
-- 步驟 5: 修復 RLS 策略（如果需要）
-- ==========================================

-- 確保 authenticated 使用者可以讀取自己的資料
DROP POLICY IF EXISTS "authenticated_select_own" ON public.users;
CREATE POLICY "authenticated_select_own"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 確保 authenticated 使用者可以插入自己的資料
DROP POLICY IF EXISTS "authenticated_insert_own" ON public.users;
CREATE POLICY "authenticated_insert_own"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 確保 service_role 有完整權限
DROP POLICY IF EXISTS "service_role_all" ON public.users;
CREATE POLICY "service_role_all"
  ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- 完成提示
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== 修復完成 ===';
  RAISE NOTICE '請執行以下步驟測試：';
  RAISE NOTICE '1. 前往您的網站登入頁面';
  RAISE NOTICE '2. 使用 admin@somnus.com / 12345678 登入';
  RAISE NOTICE '3. 檢查是否能看到 Admin 選單';
  RAISE NOTICE '';
  RAISE NOTICE '如果仍然有問題，請檢查瀏覽器 Console 的錯誤訊息';
END $$;
