# 管理員帳號設定指南

## 快速設定步驟

### 方法 1: 使用 Supabase Dashboard（推薦）

1. **前往 Supabase Dashboard**
   - 登入您的 Supabase 專案：https://supabase.com/dashboard

2. **建立測試用管理員帳號**
   - 點擊左側選單 `Authentication` > `Users`
   - 點擊右上角 `Add User` 按鈕
   - 填寫資料：
     - **Email**: `admin@somnus.com`
     - **Password**: `12345678`
     - **勾選**: `Auto Confirm User` (自動確認信箱)
   - 點擊 `Create User`

3. **同步使用者角色到資料庫**
   在終端機執行：
   ```bash
   npx tsx scripts/sync-admin.ts
   ```

4. **測試登入**
   - 前往 `http://localhost:3000/login`
   - 點擊 "Test Admin" 按鈕（會自動填入帳密）
   - 或手動輸入：
     - Email: `admin@somnus.com`
     - Password: `12345678`

---

### 方法 2: 使用 Supabase CLI（進階）

如果您已經安裝 Supabase CLI：

```bash
# 1. 登入 Supabase
supabase login

# 2. 連結專案
supabase link --project-ref YOUR_PROJECT_REF

# 3. 使用 SQL 建立使用者（需要在 Dashboard 執行）
# 或者直接在 Dashboard > SQL Editor 執行以下指令
```

然後在 SQL Editor 貼上：
```sql
-- 這個指令會透過 Supabase 的內建函式建立使用者
SELECT extensions.create_user(
  'admin@somnus.com',
  '12345678',
  true  -- auto_confirm
);
```

---

## 驗證設定

### 檢查 Auth 使用者
在 Supabase Dashboard > Authentication > Users 應該能看到 `admin@somnus.com`

### 檢查資料庫角色
在 Supabase Dashboard > SQL Editor 執行：
```sql
SELECT id, email, role FROM public.users WHERE email = 'admin@somnus.com';
```

應該回傳：
```
role: owner
```

---

## 常見問題

### Q: 登入後沒有 Admin 選單？
**A**: 執行 `npx tsx scripts/sync-admin.ts` 確保 `public.users` 表中有正確的 `role = 'owner'` 記錄。

### Q: 顯示 "Invalid credentials"？
**A**: 
1. 確認在 Supabase Dashboard 中已建立該使用者
2. 確認密碼是 `12345678`
3. 確認使用者已被 "Auto Confirm"

### Q: 如何重置密碼？
**A**: 在 Supabase Dashboard > Authentication > Users，找到該使用者，點擊右側 `...` > `Reset Password`

---

## 測試帳號資訊

| 角色 | Email | Password | 用途 |
|------|-------|----------|------|
| Owner (管理員) | admin@somnus.com | 12345678 | 完整後台權限 |
| Consumer (一般使用者) | user@somnus.com | user123 | 前台測試 |

**注意**: 這些是測試帳號，生產環境請使用強密碼並移除測試帳號。
