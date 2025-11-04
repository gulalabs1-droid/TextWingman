# Vercel Monorepo Detection Fix

## 🔧 Problem

Vercel was incorrectly detecting the project as a monorepo and trying to run:
```
cd apps/web && pnpm install && pnpm build
```

This caused deployment failures because:
1. There is no `apps/web` directory (this is NOT a monorepo)
2. The project uses `npm`, not `pnpm`

## ✅ Solution Applied

Updated `vercel.json` to explicitly configure the build:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

This tells Vercel:
- ✅ Use `npm` (not pnpm)
- ✅ Project is in root directory (not apps/web)
- ✅ Framework is Next.js
- ✅ Build with standard npm commands

## 🚀 Next Steps in Vercel Dashboard

### 1. Clear All Cached Settings

Go to your Vercel project:

**Settings → General → Build & Development Settings**

1. **Framework Preset**: Should auto-detect as "Next.js" or set manually
2. **Root Directory**: Leave as `.` (dot) - meaning root
3. **Build Command**: Should be `npm run build` or leave empty for auto
4. **Output Directory**: Leave as `.next` or empty for auto
5. **Install Command**: Should be `npm install --legacy-peer-deps`

### 2. Override Detection (If Needed)

If Vercel still detects incorrectly:

1. Go to **Settings → General**
2. Find **Build & Development Settings**
3. Click **Override** on Framework Preset
4. Select **Next.js** from dropdown
5. Click **Save**

### 3. Clear Build Cache

1. Go to **Settings → General**
2. Scroll to **Build & Development Settings**
3. Enable: **"Clear build cache on next deployment"**
4. Click **Save**

### 4. Redeploy

1. Go to **Deployments** tab
2. Click **"..."** on latest failed deployment
3. Click **Redeploy**
4. Wait for build to complete

## 🔍 Verify Correct Detection

In the deployment logs, you should see:

✅ **Correct:**
```
Detected Next.js Framework
Build Command: npm run build
Install Command: npm install --legacy-peer-deps
Output Directory: .next
```

❌ **Wrong (what was happening):**
```
Detected Monorepo
Build Command: cd apps/web && pnpm install && pnpm build
```

## 🛠️ Additional Troubleshooting

### If issue persists:

1. **Delete and reconnect the project:**
   - In Vercel Dashboard, go to Settings → General
   - Scroll to bottom: "Delete Project"
   - Reconnect from GitHub (fresh start clears all cached detection)

2. **Check for conflicting files:**
   - Make sure there's no `pnpm-lock.yaml` in the repo
   - Make sure there's no `turbo.json` or `nx.json` (monorepo markers)
   - Make sure there's no `apps/` or `packages/` directory

3. **Verify package.json:**
   - Should have `"packageManager": "npm@10.2.4"`
   - Should NOT have workspace configurations

## 📋 Checklist

Before deploying:

- [ ] `vercel.json` has explicit build settings
- [ ] No `apps/` directory in project
- [ ] No `pnpm-lock.yaml` file
- [ ] `package.json` specifies npm as package manager
- [ ] Build works locally: `npm install && npm run build`
- [ ] Vercel build cache cleared
- [ ] Framework Preset set to Next.js

## ✅ Expected Result

After applying this fix and redeploying:

- ✅ Vercel detects as standard Next.js app
- ✅ Uses npm (not pnpm)
- ✅ Runs in root directory (not apps/web)
- ✅ Build completes successfully
- ✅ App deploys and runs correctly

## 🎯 Final Note

This project is a **standard Next.js application**, not a monorepo. All source code is in the root directory with the standard Next.js App Router structure.

If Vercel continues to detect it as a monorepo, the issue is with Vercel's cached detection, not the project structure.

---

**Status:** ✅ Fix applied and committed  
**File Modified:** `vercel.json`  
**Action Required:** Redeploy in Vercel Dashboard
