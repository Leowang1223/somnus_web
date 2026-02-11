# 🚀 SØMNS 完整部署指南

本指南将帮助你快速部署 SØMNS 到 **Vercel** 或 **Cloudflare Pages**。

---

## 📋 部署前准备

### 1. 确保代码已推送到 GitHub
```bash
git status  # 确认所有更改已提交
git push origin master  # 推送到 GitHub
```

### 2. 准备环境变量
你需要准备以下信息：
- ✅ Supabase 项目的 URL 和 API Keys
- ✅ Google OAuth 凭据（可选，用于登录功能）

---

## 🎯 选择部署平台

### Option A: Vercel（推荐，最简单）
- ✅ 零配置，自动识别 Next.js
- ✅ 免费版足够使用
- ✅ 自带 SSL 证书
- ✅ 全球 CDN 加速

### Option B: Cloudflare Pages
- ✅ 完全免费，无限流量
- ✅ 更快的全球访问速度
- ⚠️ 需要额外配置 Next.js 适配器

---

## 🟢 Option A: 部署到 Vercel

### 步骤 1: 连接 GitHub 仓库

1. 访问 [vercel.com](https://vercel.com)
2. 点击 **"Add New Project"**
3. 选择 **"Import Git Repository"**
4. 找到并选择 `Leowang1223/somnus_web`
5. 点击 **"Import"**

### 步骤 2: 配置项目

Vercel 会自动检测到这是 Next.js 项目，保持默认设置：
- **Framework Preset**: Next.js ✅
- **Root Directory**: `./` ✅
- **Build Command**: `npm run build` ✅
- **Output Directory**: `.next` ✅

### 步骤 3: 添加环境变量

在部署前，点击 **"Environment Variables"**，添加以下变量：

#### 必需的环境变量：
```bash
# Supabase 配置（如果你有的话）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# 服务端密钥（仅 Production）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# 应用 URL
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

#### 可选的环境变量：
```bash
# Google OAuth（用于登录功能）
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret

# Node 环境
NODE_ENV=production
```

**💡 提示：**
- 如果暂时没有 Supabase 配置，可以留空，网站仍可正常显示
- 环境变量要应用到所有环境：**Production**, **Preview**, **Development**

### 步骤 4: 部署

1. 确认所有配置正确
2. 点击 **"Deploy"**
3. 等待构建完成（约 2-3 分钟）
4. 部署成功后，你会看到 🎉 **Congratulations!**

### 步骤 5: 访问你的网站

点击 **"Visit"** 或复制部署 URL：
```
https://somnus-web.vercel.app
```

---

## 🟠 Option B: 部署到 Cloudflare Pages

### 步骤 1: 连接 GitHub 仓库

1. 访问 [dash.cloudflare.com](https://dash.cloudflare.com)
2. 进入 **"Pages"** → **"Create a project"**
3. 点击 **"Connect to Git"**
4. 选择 GitHub 并授权 Cloudflare
5. 选择 `Leowang1223/somnus_web` 仓库

### 步骤 2: 配置构建设置

**⚠️ 重要：Cloudflare 需要特殊配置来支持 Next.js**

填写以下设置：

| 配置项 | 值 |
|--------|-----|
| **Production branch** | `master` |
| **Build command** | `npm run pages:build` |
| **Build output directory** | `.vercel/output/static` |
| **Root directory** | `./` |

### 步骤 3: 添加环境变量

点击 **"Environment variables"**，添加与 Vercel 相同的变量：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# 应用 URL
NEXT_PUBLIC_APP_URL=https://somnus-web.pages.dev

# Google OAuth（可选）
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret

# Node 版本
NODE_VERSION=20
```

### 步骤 4: 设置兼容性标志

**这一步很重要！**

1. 保存并部署后，进入 **Settings** → **Functions**
2. 找到 **"Compatibility flags"**
3. 添加：`nodejs_compat`
4. 保存

### 步骤 5: 开始构建

1. 点击 **"Save and Deploy"**
2. 等待构建完成（约 3-5 分钟）
3. 如果第一次构建失败，检查：
   - Build command 是否为 `npm run pages:build`
   - Output directory 是否为 `.vercel/output/static`
   - 添加了 `nodejs_compat` 兼容性标志

### 步骤 6: 访问你的网站

部署成功后，访问：
```
https://somnus-web.pages.dev
```

---

## 🔧 部署后配置

### 1. 验证网站功能

访问你的网站，检查：
- ✅ 首页能正常加载
- ✅ 购物车按钮显示正常
- ✅ LOGIN/PROFILE 按钮显示正常
- ✅ 导航栏功能正常

### 2. 配置自定义域名（可选）

#### Vercel:
1. 进入项目 → **Settings** → **Domains**
2. 添加你的域名（如 `somnus.com`）
3. 根据提示配置 DNS

#### Cloudflare Pages:
1. 进入项目 → **Custom domains**
2. 添加你的域名
3. 如果域名在 Cloudflare，会自动配置

### 3. 更新 OAuth 重定向 URL

如果使用 Google 登录，需要更新重定向 URL：

1. 访问 [Google Cloud Console](https://console.cloud.google.com)
2. 进入 **APIs & Services** → **Credentials**
3. 编辑你的 OAuth 2.0 客户端
4. 添加新的 **Authorized redirect URIs**：
   ```
   https://your-domain.vercel.app
   https://your-domain.pages.dev
   ```

---

## 🐛 常见问题

### Q1: 构建失败怎么办？

**Vercel:**
```bash
# 检查本地构建是否成功
npm run build

# 查看 Vercel 构建日志，通常是：
# - TypeScript 错误
# - 环境变量缺失
# - 依赖安装失败
```

**Cloudflare:**
```bash
# 确保使用正确的构建命令
npm run pages:build

# 检查是否添加了 nodejs_compat 标志
```

### Q2: 按钮还是不显示？

这是因为 Supabase 配置缺失。解决方案：
1. 等待 3 秒，按钮会自动显示（超时保护机制）
2. 或者配置 Supabase 环境变量

### Q3: 如何回滚到上一个版本？

**Vercel:**
1. 进入 **Deployments**
2. 找到之前成功的部署
3. 点击 **Promote to Production**

**Cloudflare:**
1. 进入 **Deployments**
2. 找到之前的部署
3. 点击 **Rollback to this deployment**

### Q4: 如何查看部署日志？

**Vercel:**
- 进入 **Deployments** → 点击部署 → **Function Logs** 或 **Build Logs**

**Cloudflare:**
- 进入 **Deployments** → 点击部署 → 查看 **Build log**

---

## 📊 性能优化建议

### 1. 启用图片优化
- Vercel: 自动启用
- Cloudflare: 使用 Cloudflare Images

### 2. 启用分析
- **Vercel Analytics**: Settings → Analytics → Enable
- **Cloudflare Web Analytics**: 免费，无限流量

### 3. 配置缓存
- 在 `next.config.ts` 中配置 `stale-while-revalidate`

---

## 🎯 下一步

- [ ] 配置自定义域名
- [ ] 设置 Supabase 数据库
- [ ] 启用 Google OAuth 登录
- [ ] 配置邮件通知
- [ ] 添加监控告警

---

## 📞 需要帮助？

- **Vercel 文档**: https://vercel.com/docs
- **Cloudflare Pages 文档**: https://developers.cloudflare.com/pages
- **Next.js 文档**: https://nextjs.org/docs
- **项目 Issues**: https://github.com/Leowang1223/somnus_web/issues

---

**🎉 恭喜！你的网站已成功部署！**

访问你的网站开始使用吧：
- Vercel: `https://somnus-web.vercel.app`
- Cloudflare: `https://somnus-web.pages.dev`