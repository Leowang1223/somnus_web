# SØMNS - E-Commerce & Content Management Platform

> 精品睡眠用品電商平台，整合內容管理、訂單系統與客服功能

## 🚀 快速開始

### 本地開發

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 開啟瀏覽器
http://localhost:3000
```

### 預設登入帳號

| 角色 | Email | 密碼 | 權限 |
|------|-------|------|------|
| **Owner** | `admin@somnus.com` | `admin123` | 完整權限 (財務、團隊管理) |
| **Consumer** | `user@somnus.com` | `user123` | 前台瀏覽、購物 |

> ⚠️ **團隊管理**：Support 帳號需由 Owner 在後台建立

---

## 📁 專案結構

```
SØMNUS-web/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── admin/           # 後台管理介面
│   │   ├── login/           # 登入頁面
│   │   ├── collection/      # 產品列表
│   │   ├── products/        # 產品詳情
│   │   └── journal/         # 文章系統
│   ├── components/          # React 元件
│   ├── context/             # 全域狀態 (Auth, Cart, Language)
│   ├── lib/                 # 工具函式與資料庫
│   │   ├── db.ts           # 檔案系統資料存取
│   │   └── supabase/       # Supabase 客戶端 (新)
│   ├── types/               # TypeScript 類型定義
│   └── dictionaries/        # i18n 翻譯檔
├── data/                    # JSON 資料檔案 (臨時)
├── supabase/               # 資料庫遷移腳本
├── scripts/                # 工具腳本 (資料遷移)
└── public/                 # 靜態資源

```

---

## 🎨 核心功能

### 前台 (Consumer)
- ✅ 動態首頁佈局
- ✅ 產品瀏覽與搜尋
- ✅ 購物車系統
- ✅ 結帳流程
- ✅ Journal 閱讀
- ✅ 多語言切換 (EN/ZH/KO)

### 後台 (Admin)
- ✅ Dashboard 數據分析
- ✅ 產品管理 (CRUD)
- ✅ 訂單追蹤系統
- ✅ 文章內容管理
- ✅ 首頁佈局編輯器
- ✅ 客服票單系統
- ✅ **團隊成員管理 (Owner Only)**

### RBAC 權限系統
- **Owner**: 完整權限
  - 查看財務報表 (Revenue, Profit)
  - 編輯產品成本
  - 管理團隊成員
- **Support**: 操作權限
  - 處理訂單
  - 回覆客服
  - 編輯產品內容 (不含成本)
- **Consumer**: 瀏覽與購物

---

## 🔧 技術棧

### 核心框架
- **Next.js 16** (App Router + Server Actions)
- **React 19** 
- **TypeScript 5**
- **Tailwind CSS 4**

### UI & 動畫
- **Framer Motion** - 動態動畫
- **Lucide React** - Icon 圖示
- **DnD Kit** - 拖曳排序

### 資料庫 (進行中)
- **Supabase** - PostgreSQL + Auth + Storage
- 目前: JSON 檔案系統 (臨時方案)

### 認證
- 目前: 模擬登入
- 計畫: **Supabase Auth + Google OAuth**

---

## 🚀 部署流程

> 📖 詳細步驟請參閱 [DEPLOYMENT.md](./DEPLOYMENT.md)

### 前置作業

1. **建立 Supabase 專案**
   ```bash
   # 1. 前往 supabase.com 建立專案
   # 2. 執行 Schema Migration (supabase/migrations/*.sql)
   # 3. 取得 API Keys
   ```

2. **設定 Google OAuth**
   ```bash
   # 1. Google Cloud Console 建立 OAuth 憑證
   # 2. Supabase Dashboard 配置 Provider
   ```

3. **環境變數設定**
   ```bash
   cp .env.example .env.local
   # 填入 Supabase & Google 憑證
   ```

4. **資料遷移**
   ```bash
   npm run migrate-data
   ```

### Vercel 部署

```bash
# 1. 連結 GitHub Repository 至 Vercel
# 2. 設定環境變數
# 3. Deploy
```

---

## 📚 文件索引

| 文件 | 說明 |
|------|------|
| [DEPLOYMENT.md](./DEPLOYMENT.md) | 完整部署指南 (Supabase + Vercel) |
| [SYSTEM_AUDIT.md](./SYSTEM_AUDIT.md) | 系統功能檢查清單與缺失報告 |
| [implementation_plan.md](./.gemini/antigravity/brain/.../implementation_plan.md) | Supabase 遷移實作計畫 |

---

## 🔐 安全性

### 已實作
- ✅ Role-Based Access Control (RBAC)
- ✅ Server Actions (`'use server'`)
- ✅ 環境變數隔離

### 待完成
- ⏳ Supabase Row Level Security (RLS)
- ⏳ CSRF Protection
- ⏳ Rate Limiting
- ⏳ Input Sanitization

---

## 📦 可用指令

```bash
# 開發
npm run dev              # 啟動開發伺服器
npm run build            # 建置生產版本
npm run start            # 啟動生產伺服器
npm run lint             # ESLint 檢查
npm run type-check       # TypeScript 類型檢查

# 資料遷移 (需先設定 Supabase)
npm run migrate-data     # 遷移 JSON 資料至 Supabase
```

---

## 🐛 已知問題

### 1. 瀏覽器標籤顯示
- **問題**: 標籤顯示 "SØM" 而非 "SØMNUS"
- **狀態**: 代碼正確，可能為瀏覽器快取
- **解決**: 清除快取或等待更新

### 2. 團隊管理可見性
- **問題**: 部分 Owner 看不到側邊欄連結
- **診斷**: 
  ```javascript
  // 瀏覽器 Console 檢查:
  localStorage.getItem('somnus-role') // 應為 "owner" 或 "admin"
  ```
- **解決**: 清除 localStorage 並重新登入

### 3. 檔案上傳持久化
- **問題**: Vercel 部署後上傳檔案會遺失
- **解決方案**: 遷移至 Supabase Storage

---

## 🎯 待辦事項

### P0 - 阻擋上線
- [ ] **Supabase 遷移** (資料庫 + Storage)
- [ ] **Google OAuth 整合**
- [ ] **環境變數配置**

### P1 - 上線前應完成
- [ ] **SEO 優化** (sitemap, robots.txt)
- [ ] **圖片最佳化** (Next.js Image)
- [ ] **錯誤追蹤** (Sentry)

### P2 - 後續優化
- [ ] Email 通知系統
- [ ] 庫存管理
- [ ] Analytics 深度整合

---

## 💡 開發團隊

**建立時間**: 2026-01-25  
**最後更新**: 2026-02-02  
**維護者**: Leowang1223  
**AI 協作**: Antigravity (Google DeepMind)

---

## 📞 技術支援

遇到問題？參考這些資源:
- [Next.js 官方文件](https://nextjs.org/docs)
- [Supabase 官方文件](https://supabase.com/docs)
- [Vercel 部署指南](https://vercel.com/docs)

---

## 📄 授權

This project is private and proprietary.

---

**⚡ 準備就緒，即刻上線！**
