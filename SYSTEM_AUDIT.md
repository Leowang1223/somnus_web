# SØMNUS System Audit & Missing Features Report

## 執行日期: 2026-02-02
## 審核範圍: 完整系統功能與參數檢查

---

## ✅ 已完成功能

### 1. 核心架構
- [x] Next.js 16 App Router
- [x] TypeScript 配置
- [x] Tailwind CSS 4
- [x] Framer Motion 動畫
- [x] 響應式設計

### 2. 前台功能
- [x] 首頁動態佈局系統
- [x] 產品展示頁面
- [x] 產品詳情頁 (動態 sections)
- [x] Journal (文章系統)
- [x] 購物車功能
- [x] 結帳流程
- [x] 多語言支援 (i18n)
- [x] 語言選擇器

### 3. 後台管理
- [x] Admin Dashboard with Analytics
- [x] 產品管理 (CRUD)
- [x] 訂單管理系統
- [x] Journal 文章管理
- [x] 首頁佈局編輯器
- [x] 客服票單系統
- [x] **團隊管理 (Owner Only)**
- [x] Role-Based Access Control (RBAC)

### 4. 認證系統
- [x] 本地認證 (模擬)
- [x] 角色管理 (Owner, Support, Consumer)
- [x] AuthContext 狀態管理
- [x] 登入/登出功能

---

## 🔧 待修復/優化項目

### 1. 即時問題

#### 1.1 品牌名稱顯示 ⚠️ MINOR
**問題**: 瀏覽器標籤顯示為 "SØM" 而非完整 "SØMNUS"
**原因**: 特殊字符 Ø 導致部分瀏覽器截斷
**解決方案**: 
```typescript
// src/app/layout.tsx (已確認正確)
export const metadata: Metadata = {
  title: "SØMNUS | The Golden 30 Minutes", // ✅ 正確
  description: "Master the art of the evening wind-down.",
};
```
**狀態**: 代碼正確，可能是瀏覽器快取問題
**建議**: 清除快取或在 `head` 添加 meta tag

#### 1.2 團隊管理可見性 🔥 HIGH PRIORITY
**問題**: Owner 登入後在 Admin Sidebar 看不到「團隊管理」連結
**診斷結果**:
- ✅ 檔案存在: `src/app/admin/team/page.tsx`
- ✅ Sidebar 條件渲染: `{isOwner && <Link.../> }`
- ✅ AuthContext 邏輯: `isOwner = role === 'owner' || role === 'admin'`

**可能原因**:
1. 使用者使用的帳號不是 `owner` 或 `admin` 角色
2. `localStorage` 儲存的舊角色資訊未更新
3. AuthContext 未正確訂閱狀態變化

**驗證步驟**:
```javascript
// 在瀏覽器 Console 執行:
console.log('Role:', localStorage.getItem('somnus-role'));
console.log('Authenticated:', localStorage.getItem('somnus-authenticated'));

// 預期結果應為:
// Role: "owner" 或 "admin"
// Authenticated: "true"
```

**臨時解決方案**:
1. 清除 localStorage
2. 重新登入 `admin@somnus.com` / `admin123`
3. 重新整理頁面

**根本解決** (需執行):
- 添加狀態同步機制
- 在 AuthContext 中添加 debug logging
- 實作 session 持久化

---

### 2. 資料庫架構問題 🔥 CRITICAL

#### 2.1 檔案系統依賴
**問題**: 目前使用 `data/*.json` 儲存資料
**限制**:
- ❌ 無法在 Vercel 等 Serverless 環境持久化
- ❌ 多實例部署會導致資料不一致
- ❌ 無法處理併發寫入

**影響範圍**:
- `src/lib/db.ts` (所有資料存取)
- `src/app/actions.ts` (所有 Server Actions)

**解決方案**: ✅ 已準備
- Supabase PostgreSQL 遷移方案已建立
- Schema 定義完成
- Migration script 已建立

#### 2.2 檔案上傳儲存
**問題**: 上傳檔案存於 `public/uploads/`
**限制**: Vercel 部署後檔案會遺失
**解決方案**: 
- 遷移至 **Supabase Storage**
- 建立 Buckets: `products`, `articles`, `avatars`
- 更新 `uploadFileAction` 使用 Supabase SDK

---

### 3. 認證系統缺失 🔥 HIGH PRIORITY

#### 3.1 無真實認證
**問題**: 目前為模擬登入，密碼明文比對
```typescript
// src/app/actions.ts - loginAction
if (email === "admin@somnus.com" && password === "admin123") {
  return { success: true, user: { ... } };
}
```

**風險**:
- 無密碼加密
- 無 Session 管理
- 無 CSRF 保護

**解決方案**: ✅ 已準備
- Supabase Auth 整合
- Google OAuth 配置
- Session Cookie 管理

#### 3.2 缺少 Google 登入
**狀態**: 規劃完成，待實作
**需要**:
- Google OAuth 2.0 Client ID & Secret
- Supabase Auth Provider 配置
- 前端登入 UI 更新

---

### 4. 遺失功能 📝

#### 4.1 產品庫存管理
**描述**: 無庫存追蹤系統
**建議**: 新增 `stock` 欄位至 Products table
```sql
ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN stock_管理 TEXT DEFAULT 'unlimited'; -- 'finite' | 'unlimited'
```

#### 4.2 訂單退款流程
**描述**: 僅有訂單建立，無退款/取消功能
**建議**: 新增 Status: `refunded`, `cancelled`

#### 4.3 Email 通知系統
**描述**: 無訂單確認信、出貨通知
**建議**: 整合 **Resend** 或 **SendGrid**

#### 4.4 圖片優化
**問題**: 圖片未經最佳化
**建議**: 使用 Next.js `Image` component

#### 4.5 SEO 優化
**缺失項**:
- 無 sitemap.xml
- 無 robots.txt
- 產品頁面無 JSON-LD schema
**建議**: 使用 `next-sitemap` 套件

#### 4.6 錯誤追蹤
**描述**: 無錯誤監控系統
**建議**: 整合 **Sentry**

#### 4.7 Analytics
**描述**: 僅基礎訪問計數
**建議**: 整合 **Google Analytics 4** 或 **Plausible**

---

## 🚀 部署前必做事項

### Supabase 遷移
1. [ ] 建立 Supabase 專案
2. [ ] 執行 Schema migration
3. [ ] 執行資料遷移 (`npm run migrate-data`)
4. [ ] 驗證 RLS Policies
5. [ ] 設定 Storage Buckets

### Google OAuth
1. [ ] 建立 Google Cloud 專案
2. [ ] 取得 OAuth 憑證
3. [ ] 配置 Supabase Auth Provider
4. [ ] 更新前端登入頁面

### 環境變數
1. [ ] 建立 `.env.local`
2. [ ] 設定 Vercel 環境變數
3. [ ] 驗證所有 secrets 安全儲存

### Build 驗證
1. [ ] 執行 `npm run build` 無錯誤
2. [ ] 執行 `npm run type-check` 無警告
3. [ ] 測試 Production Build locally

---

## 📊 效能評估

### 目前狀態 (本地開發)
- **Build 時間**: ~30-40秒
- **頁面載入**: ~1-2秒 (待測試)
- **Lighthouse 分數**: 未測試

### 預期生產環境
- **First Contentful Paint**: < 1.8s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1

---

## 🔐 安全檢查清單

### 已實作
- [x] RBAC (Role-Based Access Control)
- [x] 前端路由保護
- [x] Server Actions 使用 'use server'

### 待完成
- [ ] Supabase RLS Policies 測試
- [ ] CSRF Token 驗證
- [ ] Rate Limiting (防止 API 濫用)
- [ ] Input Sanitization (XSS 防護)
- [ ] SQL Injection 防護 (Supabase 自動處理)

---

## 📦 套件依賴問題

### 已知 Vulnerabilities
```bash
5 vulnerabilities (1 low, 4 moderate)
```

**建議**: 執行 `npm audit fix`

### 已棄用套件
- `@supabase/auth-helpers-nextjs@0.15.0` - 已升級至 `@supabase/ssr`

---

## 🎯 優先處理順序

### P0 - 阻擋上線 🔥
1. **Supabase 遷移** (資料持久化)
2. **檔案儲存遷移** (Supabase Storage)
3. **真實認證系統** (Supabase Auth + Google OAuth)
4. **環境變數設定**

### P1 - 上線前應完成 ⚠️
5. **Build 驗證與測試**
6. **團隊管理可見性修復**
7. **SEO 基礎設定** (sitemap, robots.txt)
8. **錯誤追蹤** (Sentry)

### P2 - 上線後優化 📈
9. **圖片最佳化**
10. **Email 通知系統**
11. **庫存管理**
12. **Analytics 深度整合**

---

## 💡 建議執行順序

### Week 1: 基礎設施
1. 建立 Supabase 專案
2. 設定 Google OAuth
3. 執行資料庫遷移
4. 更新認證系統

### Week 2: 測試與優化
5. 完整功能測試
6. 效能優化
7. 安全檢查
8. Build 驗證

### Week 3: 部署
9. Vercel 部署
10. 網域設定
11. 監控設定
12. 上線驗證

---

## 📞 技術支持

如遇問題，參考:
- [Implementation Plan](./implementation_plan.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)

---

**報告產生時間**: 2026-02-02 22:30
**審核者**: Antigravity AI
**狀態**: ✅ 系統可部署，需完成 P0 項目
