-- 診斷腳本：檢查 admin@somnus.com 的完整狀態
-- 在 Supabase Dashboard > SQL Editor 執行此腳本

-- 1. 檢查 auth.users 中是否存在
SELECT 
  '1. Auth User Check' as step,
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'admin@somnus.com';

-- 2. 檢查 public.users 中是否存在
SELECT 
  '2. Public User Check' as step,
  id,
  email,
  role,
  name,
  created_at
FROM public.users 
WHERE email = 'admin@somnus.com';

-- 3. 檢查是否有 ID 不匹配的問題
SELECT 
  '3. ID Match Check' as step,
  au.id as auth_id,
  pu.id as public_id,
  au.email as auth_email,
  pu.email as public_email,
  pu.role,
  CASE 
    WHEN au.id = pu.id THEN '✅ IDs Match'
    ELSE '❌ IDs DO NOT Match'
  END as id_status
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.email = pu.email
WHERE au.email = 'admin@somnus.com' OR pu.email = 'admin@somnus.com';

-- 4. 測試 RLS 權限（模擬前端查詢）
-- 這個查詢會顯示前端能否讀取到資料
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.email TO 'admin@somnus.com';

SELECT 
  '4. RLS Permission Test' as step,
  id,
  email,
  role
FROM public.users 
WHERE email = 'admin@somnus.com';

RESET ROLE;

-- 5. 列出所有 users 表的 RLS 策略
SELECT 
  '5. RLS Policies' as step,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'users';
