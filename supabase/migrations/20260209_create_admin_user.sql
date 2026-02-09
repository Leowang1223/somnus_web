-- 建立測試用的 Admin 帳號
-- 注意：這個腳本需要在 Supabase Dashboard 的 SQL Editor 中執行
-- 因為它需要存取 auth.users 表

-- 1. 先檢查帳號是否已存在，如果存在就刪除
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- 查找是否有這個 email 的使用者
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@somnus.com';
    
    -- 如果存在，先從 public.users 刪除（因為有外鍵約束）
    IF admin_user_id IS NOT NULL THEN
        DELETE FROM public.users WHERE id = admin_user_id;
        -- 注意：auth.users 的刪除需要透過 Supabase Auth API，這裡我們只清理 public.users
    END IF;
END $$;

-- 2. 插入到 auth.users (這個步驟通常需要透過 Supabase Dashboard 或 API)
-- 由於直接操作 auth.users 需要特殊權限，建議使用以下方式：

-- 方法 A: 透過 Supabase Dashboard
-- 1. 前往 Authentication > Users
-- 2. 點擊 "Add User"
-- 3. Email: admin@somnus.com
-- 4. Password: 12345678
-- 5. 勾選 "Auto Confirm User"

-- 方法 B: 使用此腳本（需要 service_role 權限）
-- 注意：以下程式碼僅在您有完整權限時才能執行

-- 如果您的 Supabase 版本支援，可以嘗試：
-- INSERT INTO auth.users (
--     instance_id,
--     id,
--     aud,
--     role,
--     email,
--     encrypted_password,
--     email_confirmed_at,
--     created_at,
--     updated_at,
--     confirmation_token,
--     recovery_token
-- ) VALUES (
--     '00000000-0000-0000-0000-000000000000',
--     gen_random_uuid(),
--     'authenticated',
--     'authenticated',
--     'admin@somnus.com',
--     crypt('12345678', gen_salt('bf')),
--     NOW(),
--     NOW(),
--     NOW(),
--     '',
--     ''
-- ) ON CONFLICT (email) DO NOTHING
-- RETURNING id;

-- 3. 確保 public.users 中有對應的 owner 記錄
-- 這個部分可以安全執行，會在使用者登入後自動觸發
-- 或者您可以手動執行 sync-admin.ts 腳本

COMMENT ON TABLE public.users IS '請先在 Supabase Dashboard > Authentication > Users 建立 admin@somnus.com (密碼: 12345678)，然後執行 sync-admin.ts 腳本';
