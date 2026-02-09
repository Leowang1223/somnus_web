# 生產環境管理員帳號設定指南

## 🎯 目標
在部署到生產環境（Vercel/Railway/Cloudflare）後，能直接使用 `admin@somnus.com` 登入後台。

---

## 📋 設定步驟

### 步驟 1: 在 Supabase Dashboard 建立管理員帳號

1. **登入 Supabase Dashboard**
   - 前往：https://supabase.com/dashboard
   - 選擇您的專案

2. **建立 Admin 使用者**
   - 左側選單：`Authentication` → `Users`
   - 點擊右上角：`Add User`
   - 填寫資料：
     ```
     Email: admin@somnus.com
     Password: 12345678
     ✅ Auto Confirm User (必須勾選)
     ```
   - 點擊 `Create User`

3. **手動設定角色（重要！）**
   
   由於新建立的使用者不會自動加入 `public.users` 表，您需要手動執行 SQL：

   - 前往：`SQL Editor`
   - 貼上以下 SQL：

   ```sql
   -- 取得剛建立的使用者 ID
   -- 先查詢使用者 ID
   SELECT id, email FROM auth.users WHERE email = 'admin@somnus.com';
   
   -- 複製上面查詢到的 UUID，然後執行下面的插入語句
   -- 將 'YOUR_USER_ID_HERE' 替換成實際的 UUID
   INSERT INTO public.users (id, email, name, role, created_at, updated_at)
   VALUES (
     'YOUR_USER_ID_HERE',  -- ⚠️ 替換成上面查到的 UUID
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
   ```

   **或者使用這個一鍵腳本（推薦）：**

   ```sql
   -- 一鍵設定 admin@somnus.com 為 owner
   DO $$
   DECLARE
     admin_user_id UUID;
   BEGIN
     -- 從 auth.users 取得使用者 ID
     SELECT id INTO admin_user_id 
     FROM auth.users 
     WHERE email = 'admin@somnus.com';
     
     -- 如果找到使用者，插入或更新 public.users
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
       
       RAISE NOTICE '✅ Successfully set admin@somnus.com as owner';
     ELSE
       RAISE EXCEPTION '❌ User admin@somnus.com not found in auth.users. Please create it first in Authentication > Users.';
     END IF;
   END $$;
   ```

---

### 步驟 2: 驗證設定

在 Supabase Dashboard 的 SQL Editor 執行：

```sql
-- 驗證使用者角色
SELECT 
  u.id,
  u.email,
  u.role,
  au.email_confirmed_at
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE u.email = 'admin@somnus.com';
```

**預期結果：**
```
role: owner
email_confirmed_at: (有時間戳記，不是 null)
```

---

### 步驟 3: 測試登入

1. **前往您的生產環境網址**
   - 例如：`https://your-app.vercel.app/login`

2. **使用測試帳號登入**
   - 點擊 "Test Admin" 按鈕
   - 或手動輸入：
     - Email: `admin@somnus.com`
     - Password: `12345678`

3. **確認能看到 Admin 選單**
   - 登入後應該會看到導航列有 "Admin" 連結
   - 點擊後能進入後台管理介面

---

## 🔧 進階：使用 Migration 自動化（可選）

如果您希望每次部署都自動確保管理員存在，可以建立一個 Migration：

**檔案：`supabase/migrations/20260209_ensure_admin_role.sql`**

```sql
-- 確保 admin@somnus.com 在 public.users 中有 owner 角色
-- 這個 migration 是冪等的，可以重複執行

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
    RAISE NOTICE '⚠️ admin@somnus.com not found in auth.users - please create manually';
  END IF;
END $$;
```

---

## ❓ 常見問題

### Q1: 登入後沒有看到 Admin 選單？

**可能原因：**
- `public.users` 表中沒有該使用者的記錄
- 角色不是 `owner`

**解決方法：**
重新執行步驟 1 的「一鍵腳本」

---

### Q2: 顯示 "Invalid credentials"？

**檢查清單：**
1. ✅ 在 Supabase Dashboard > Authentication > Users 能看到 `admin@somnus.com`
2. ✅ 該使用者的 `email_confirmed_at` 不是 null（已確認信箱）
3. ✅ 密碼確實是 `12345678`

**解決方法：**
在 Supabase Dashboard > Authentication > Users，找到該使用者，點擊右側 `...` > `Send Magic Link` 或 `Reset Password`

---

### Q3: 如何新增其他管理員？

重複步驟 1-2，但使用不同的 Email。

或者在 SQL Editor 執行：
```sql
-- 替換 'new-admin@example.com' 和對應的 UUID
INSERT INTO public.users (id, email, name, role, created_at, updated_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'new-admin@example.com'),
  'new-admin@example.com',
  'New Admin',
  'owner',
  NOW(),
  NOW()
);
```

---

## 🔐 安全提醒

⚠️ **生產環境注意事項：**

1. **更改預設密碼**
   - `12345678` 僅供測試使用
   - 生產環境請使用強密碼（至少 12 位，包含大小寫、數字、符號）

2. **移除測試按鈕**
   - 編輯 `src/app/login/page.tsx`
   - 移除或註解掉 `fillCredentials` 相關的測試按鈕

3. **啟用 MFA（多因素驗證）**
   - Supabase Dashboard > Authentication > Settings
   - 啟用 `Multi-Factor Authentication`

---

## 📝 總結

**最簡單的方式（推薦）：**

1. Supabase Dashboard > Authentication > Users > Add User
   - Email: `admin@somnus.com`
   - Password: `12345678`
   - ✅ Auto Confirm User

2. Supabase Dashboard > SQL Editor > 執行一鍵腳本：
   ```sql
   DO $$
   DECLARE admin_user_id UUID;
   BEGIN
     SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@somnus.com';
     IF admin_user_id IS NOT NULL THEN
       INSERT INTO public.users (id, email, name, role, created_at, updated_at)
       VALUES (admin_user_id, 'admin@somnus.com', 'Admin', 'owner', NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET role = 'owner', updated_at = NOW();
     END IF;
   END $$;
   ```

3. 前往生產環境測試登入

完成！🎉
