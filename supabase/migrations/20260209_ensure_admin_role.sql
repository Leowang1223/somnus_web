-- 確保 admin@somnus.com 在 public.users 中有 owner 角色
-- 這個 migration 是冪等的，可以重複執行
-- 
-- 使用方式：
-- 1. 先在 Supabase Dashboard > Authentication > Users 建立 admin@somnus.com 帳號
-- 2. 然後在 SQL Editor 執行此腳本

DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- 從 auth.users 取得使用者 ID
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@somnus.com';
  
  -- 如果找到使用者，確保在 public.users 中有正確角色
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.users (id, email, name, role, created_at, updated_at)
    VALUES (
      admin_user_id,
      'admin@somnus.com',
      'Admin',
      'owner',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) 
    DO UPDATE SET 
      role = 'owner',
      updated_at = NOW();
    
    RAISE NOTICE '✅ Admin role ensured for admin@somnus.com';
  ELSE
    RAISE NOTICE '⚠️ admin@somnus.com not found in auth.users';
    RAISE NOTICE 'Please create the user first:';
    RAISE NOTICE '1. Go to Supabase Dashboard > Authentication > Users';
    RAISE NOTICE '2. Click "Add User"';
    RAISE NOTICE '3. Email: admin@somnus.com, Password: 12345678';
    RAISE NOTICE '4. Check "Auto Confirm User"';
    RAISE NOTICE '5. Run this script again';
  END IF;
END $$;
