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
