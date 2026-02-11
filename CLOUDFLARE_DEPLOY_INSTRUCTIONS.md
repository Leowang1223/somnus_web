# ☁️ Cloudflare Pages 部署指南 (關鍵步驟)

您之所以會看到部署錯誤，是因為 Cloudflare 預設不知道如何處理 Next.js 16 的動態功能。我已經為您安裝了適配器，並上傳了修復代碼。

## ⚠️ 請務必執行以下設置：

請登入 Cloudflare Dashboard，進入您的 Pages 專案 > **Settings** > **Builds & deployments**，點擊 **Edit settings** 並修改：

### 1. Build Command (構建指令)
把原來的 `npm run build` 改為：
```bash
npm run pages:build
```
*(或者直接填 `npx @cloudflare/next-on-pages`)*

### 2. Build output directory (輸出目錄)
把原來的 `.next` (或 `out`) 改為：
```bash
.vercel/output/static
```
*(注意：必須完全精確，這是適配器生成的特殊目錄)*

### 3. Compatibility Flags (相容性標誌)
在 Settings > **Functions** > **Compatibility flags** 中：
- 添加：`nodejs_compat`

---

## 🚀 重新部署
修改完以上設置後：
1. 去 **Deployments** 分頁。
2. 找到最新的那次部署（可能顯示失敗）。
3. 點擊 **Retry deployment**。

這樣應該就能成功了！

### 📋 為什麼要這樣做？
- 原本的 `npm run build` 只能生成 Node.js 伺服器代碼，Cloudflare Pages 跑不動。
- 我們新加的 `npm run pages:build` 會把 Next.js 轉換成 Cloudflare Workers 能懂的格式。
- `wrangler deploy` 失敗是因為那是手動部署指令，Cloudflare Pages 的 Git 集成不需要它，只要目錄對了它自己會抓。
