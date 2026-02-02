# SØMNUS Deployment Guide

## Prerequisites

Before deploying, ensure you have:

1. ✅ Supabase project created
2. ✅ Google OAuth credentials configured
3. ✅ All environment variables ready
4. ✅ Data migrated to Supabase

---

## Step 1: Supabase Setup

### 1.1 Create Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. **Project Name**: `somnus-production`
4. **Database Password**: (Set a strong password)
5. **Region**: Singapore (sin1) or closest to your users
6. Wait for project initialization (~2 minutes)

### 1.2 Apply Database Schema

1. In Supabase Dashboard → **SQL Editor**
2. Click **"New Query"**
3. Copy contents from `supabase/migrations/20260202_initial_schema.sql`
4. Paste and click **"Run"**
5. Verify all tables are created under **Database** → **Tables**

### 1.3 Get API Credentials

Navigate to **Project Settings** → **API**:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (⚠️ Keep secret!)
```

---

## Step 2: Google OAuth Configuration

### 2.1 Google Cloud Console

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project or select existing
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Application type: **Web application**
6. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://your-domain.vercel.app
   ```
7. **Authorized redirect URIs**:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
8. Save and copy **Client ID** and **Client Secret**

### 2.2 Configure Supabase Auth

1. Supabase Dashboard → **Authentication** → **Providers**
2. Find **Google** and toggle **Enabled**
3. Paste your **Client ID** and **Client Secret**
4. Save changes

---

## Step 3: Migrate Data

### 3.1 Local Environment Setup

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3.2 Run Migration

```bash
npm run migrate-data
```

Expected output:
```
🚀 Starting data migration to Supabase...

📦 Migrating products...
   ✅ Migrated 5 products
🛒 Migrating orders...
   ✅ Migrated 12 orders
📝 Migrating articles...
   ✅ Migrated 8 articles
...

✅ Migration completed successfully!
```

### 3.3 Verify Data

1. Supabase Dashboard → **Table Editor**
2. Check each table has data
3. Test queries in SQL Editor

---

## Step 4: Deploy to Vercel

### 4.1 Connect Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. **Framework Preset**: Next.js (auto-detected)
4. **Root Directory**: `./`

### 4.2 Environment Variables

Add in Vercel Dashboard → **Settings** → **Environment Variables**:

| Key | Value | Environments |
|-----|-------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` (secret!) | Production only |
| `GOOGLE_CLIENT_ID` | `xxxxx.apps.googleusercontent.com` | Production, Preview |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-xxxxx` (secret!) | Production only |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.vercel.app` | Production |

### 4.3 Deploy

1. Click **Deploy**
2. Wait for build to complete (~2-3 minutes)
3. Visit your deployment URL

---

## Step 5: Post-Deployment Verification

### 5.1 Functional Testing

- [ ] Homepage loads correctly
- [ ] Product pages display with images
- [ ] Google Login works
- [ ] Admin dashboard accessible (owner role)
- [ ] Orders can be created
- [ ] Customer service tickets work

### 5.2 Performance Testing

1. Run Lighthouse audit
2. Check Core Web Vitals
3. Test mobile responsiveness

### 5.3 Security Checklist

- [ ] RLS policies are enabled
- [ ] Service role key not exposed in client
- [ ] CORS configured correctly
- [ ] OAuth redirect URIs whitelisted

---

## Step 6: Custom Domain (Optional)

### 6.1 Add Domain in Vercel

1. Vercel Dashboard → **Settings** → **Domains**
2. Add your domain (e.g., `somnus.com`)
3. Follow DNS configuration instructions

### 6.2 Update OAuth Redirect

1. Google Cloud Console → Update **Authorized redirect URIs**:
   ```
   https://somnus.com
   ```
2. Supabase → **Authentication** → **URL Configuration**:
   - **Site URL**: `https://somnus.com`

---

## Troubleshooting

### Build Fails

```bash
# Check locally first
npm run build

# Common issues:
# 1. Missing environment variables
# 2. TypeScript errors
# 3. Import path issues
```

### OAuth Not Working

1. Check redirect URIs match exactly
2. Verify Google credentials in Supabase
3. Check browser console for errors

### Database Connection Issues

1. Verify Supabase project is active
2. Check API keys are correct
3. Test connection with SQL query

---

## Rollback Plan

If deployment fails:

1. **Vercel**: Redeploy previous successful deployment
2. **Database**: Restore from Supabase backup
3. **DNS**: Revert to old IP/CNAME

---

## Monitoring & Maintenance

### Recommended Tools

- **Analytics**: Vercel Analytics (built-in)
- **Error Tracking**: [sentry.io](https://sentry.io)
- **Uptime**: [uptimerobot.com](https://uptimerobot.com)
- **Logs**: Vercel Logs + Supabase Logs

### Regular Tasks

- Weekly: Review Supabase logs for errors
- Monthly: Database backup
- Quarterly: Security audit of RLS policies

---

## Support

For issues, check:
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)

---

**Last Updated**: 2026-02-02
