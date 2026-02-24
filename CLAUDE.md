# Claude Code 規則

## 語言規則
- **對話一律使用繁體中文**，包含說明、分析、提問、回應等所有輸出

## 專案背景
- Next.js 15 + Supabase + Tailwind CSS 的電商網站（SØMNS 香氛品牌）
- 多語系支援：en / zh / jp / ko，語言設定同時儲存於 localStorage 和 cookie（供 server component 讀取）
- Auth：Supabase SSR，角色分 owner / support / consumer

## 重要架構注意事項
- Server action 使用 `createServerClient`（HTTP-only cookies），browser client 使用 `createBrowserClient`（in-memory session cache）
- 登入後需呼叫 AuthContext 的 `syncSession()` 方法，在同一個 supabase 實例上呼叫 `setSession()`，才能正確更新 `currentSession` 快取並觸發 `onAuthStateChange`
- CMS 欄位多語系格式：`{ en: string, zh: string, jp: string, ko: string }`，使用 `loc(field, lang)` helper 解析（同時相容純字串舊格式）
- Server component 讀取語言：從 cookie `language` 取得，再載入對應 dictionary

## SQL 異動規則
- **每次新增或修改任何資料庫相關功能**（新增欄位、修改 RLS、新增 Function、新增 Table 等），**必須同步更新 `supabase/migrations/COMPLETE_SETUP.sql`**，確保該檔案始終是完整、最新、可直接在 Supabase SQL Editor 一次貼上執行的腳本
- COMPLETE_SETUP.sql 設計原則：冪等（可重複執行）、`IF NOT EXISTS` / `DROP ... IF EXISTS` 全面使用、包含所有 Table、Column、Index、RLS、Function、Trigger、View、初始資料、Admin 帳號修復
- 修改完成後，提供完整的 COMPLETE_SETUP.sql 內容供使用者確認，並 commit + push

## End-to-End 驗證協議（每次 deploy 後必須執行）

每次推送 commit 並觸發 Vercel deploy 後，**按以下清單逐一驗證**。
未通過任何一項，必須立即找原因修復，不可繼續其他任務。

### Auth 驗證（電腦瀏覽器，無痕視窗）
1. 前往 `/login`，用 owner 帳號 email/password 登入
2. 確認：Navbar 顯示「Admin」（不是「Profile」）
3. 前往 `/admin` → 確認：左側 sidebar 正常顯示，無「驗証中...」迴圈
4. 確認 sidebar 包含：訂單管理、預購管理、金流對帳
5. 登出 → 確認 Navbar 顯示「Login」

### Auth 驗證（手機瀏覽器）
6. 手機瀏覽器前往 `/login` 登入（owner 帳號）
7. 確認：Navbar hamburger 選單內有「Admin」連結
8. 前往 `/admin` → 確認：頂部手機版導航列顯示，可展開 sidebar
9. 確認：展開 sidebar 後可看到預購管理、金流對帳

### 前台 UI 驗證
10. 前往首頁，手機模式確認 Hero 標題不壓縮、不亂行
11. 瀏覽器縮至 768px–1023px，確認 Navbar 無文字重疊
12. 確認手機版 hamburger 正常，全螢幕選單可開關

### DevTools 驗證
13. Application → Cookies → 確認 `sb-access-token`、`sb-refresh-token` 存在
14. Console → 確認無紅色 error（特別是 `get_my_role` RPC 相關錯誤）
