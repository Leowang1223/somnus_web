-- ==========================================
-- 建立 get_my_role() 函數（繞過 RLS）
-- ==========================================
-- 此函數使用 SECURITY DEFINER 在資料庫層執行，
-- 完全繞過 RLS 政策，可正確處理 public.users.id ≠ auth.uid() 的情況

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_role TEXT;
  user_email TEXT;
BEGIN
  -- 先用 auth.uid() 直接查（一般情況，最快）
  SELECT role INTO user_role
  FROM public.users
  WHERE id = auth.uid();

  IF user_role IS NOT NULL THEN
    RETURN user_role;
  END IF;

  -- Fallback：從 auth.users 取得 email，再用 email 查 public.users
  -- 這處理了 public.users.id ≠ auth.uid() 的帳號 ID 不一致情況
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = auth.uid();

  IF user_email IS NOT NULL THEN
    SELECT role INTO user_role
    FROM public.users
    WHERE email = user_email;
  END IF;

  RETURN COALESCE(user_role, 'consumer');
END;
$$;

-- 授予 authenticated 使用者執行此函數的權限
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- ==========================================
-- 修復 admin 帳號的 ID 不一致問題
-- ==========================================
-- 如果 public.users 有 email 相同但 id 不同的舊記錄，
-- 先刪除舊記錄，再用正確的 auth UID 建立新記錄

DO $$
DECLARE
  auth_uid UUID;
  old_public_id UUID;
BEGIN
  -- 取得 admin@somnus.com 的 auth UID
  SELECT id INTO auth_uid FROM auth.users WHERE email = 'admin@somnus.com';

  IF auth_uid IS NULL THEN
    RAISE NOTICE '⚠️ admin@somnus.com 不存在於 auth.users，請先建立此帳號';
    RETURN;
  END IF;

  RAISE NOTICE '✅ auth UID: %', auth_uid;

  -- 確認 public.users 的 id 是否已正確
  IF EXISTS (SELECT 1 FROM public.users WHERE id = auth_uid) THEN
    -- 已有正確 id 的記錄，只確保 role 正確
    UPDATE public.users SET role = 'owner', updated_at = NOW() WHERE id = auth_uid;
    RAISE NOTICE '✅ 已更新 role = owner（ID 正確）';
    RETURN;
  END IF;

  -- 查找 email 相同但 id 不同的舊記錄
  SELECT id INTO old_public_id FROM public.users WHERE email = 'admin@somnus.com';

  IF old_public_id IS NOT NULL THEN
    RAISE NOTICE '⚠️ 發現 ID 不一致的舊記錄 (old_id: %, auth_uid: %)', old_public_id, auth_uid;
    -- 刪除舊記錄（其他表用 user_email 欄位存 email，不依賴 FK）
    DELETE FROM public.users WHERE id = old_public_id;
    RAISE NOTICE '✅ 已刪除舊記錄';
  END IF;

  -- 建立正確 ID 的新記錄
  INSERT INTO public.users (id, email, name, role, created_at, updated_at)
  VALUES (auth_uid, 'admin@somnus.com', 'Admin', 'owner', NOW(), NOW());

  RAISE NOTICE '✅ 已建立正確記錄 (id = auth_uid, role = owner)';
END $$;

-- 驗證結果
SELECT
  au.id AS auth_uid,
  pu.id AS public_uid,
  pu.email,
  pu.role,
  CASE WHEN au.id = pu.id THEN '✅ ID 一致' ELSE '❌ ID 不一致' END AS id_check
FROM auth.users au
LEFT JOIN public.users pu ON pu.email = au.email
WHERE au.email = 'admin@somnus.com';
