# Vercel Deployment Guide - Text Wingman

## ✅ Quick Fix Applied

The `vercel.json` has been optimized to let Vercel auto-detect Next.js framework settings.

---

## 🚀 Deployment Steps

### 1. **Environment Variables**

Before deploying, ensure all environment variables are set in Vercel Dashboard:

**Required Variables:**
```
OPENAI_API_KEY=your_openai_api_key_here
TEXT_WINGMAN_AGENT_ID=your_agent_id_here (optional)

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STRIPE_PRICE_ID_MONTHLY=price_monthly_id
STRIPE_PRICE_ID_ANNUAL=price_annual_id

NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
FREE_USAGE_LIMIT=5
```

### 2. **Set Environment Variables in Vercel**

1. Go to your project in Vercel Dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable above with your actual values
4. Make sure to select **Production**, **Preview**, and **Development** for each

### 3. **Redeploy**

After setting environment variables:
1. Go to **Deployments** tab
2. Click the **...** menu on the latest deployment
3. Click **Redeploy**
4. Wait for build to complete

---

## 🔧 Troubleshooting

### Issue: "routes-manifest.json couldn't be found"

**Solution Applied:** Simplified `vercel.json` to auto-detect Next.js

**If issue persists:**

1. **Check Node Version**
   - Vercel Settings → General → Node.js Version
   - Set to: **18.x** or **20.x**

2. **Clear Build Cache**
   - In Vercel Dashboard
   - Settings → General → Build & Development Settings
   - Enable "Clear build cache on next deployment"
   - Redeploy

3. **Verify Build Locally**
   ```bash
   npm install --legacy-peer-deps
   npm run build
   ```
   - If this works locally, it should work on Vercel

### Issue: Build Fails

**Check:**
1. All environment variables are set
2. No syntax errors in code
3. All dependencies are installed
4. Build works locally with `npm run build`

### Issue: API Routes 404

**Solution:**
- Ensure `OPENAI_API_KEY` is set in Vercel environment variables
- Check API route files are in `app/api/` directory
- Verify environment variables are available in production

---

## 📋 Vercel Configuration

### Current `vercel.json`:
```json
{
  "installCommand": "npm install --legacy-peer-deps"
}
```

**Why this works:**
- Vercel auto-detects Next.js framework
- Only custom install command is needed for legacy peer deps
- Vercel handles build, output directory, and routing automatically

### Alternative (if auto-detect fails):
```json
{
  "installCommand": "npm install --legacy-peer-deps",
  "framework": "nextjs",
  "buildCommand": "next build"
}
```

---

## ✅ Deployment Checklist

Before deploying, ensure:

- [ ] All environment variables are set in Vercel
- [ ] `npm run build` works locally
- [ ] `.env.local` is NOT committed to Git (it's in .gitignore)
- [ ] `vercel.json` is committed and pushed
- [ ] All changes are pushed to GitHub
- [ ] Repository is connected to Vercel

---

## 🎯 Post-Deployment

### 1. **Test the Deployment**

Visit your deployed URL and test:
- Homepage loads
- App page (`/app`) loads
- Generate replies works
- Copy buttons work
- No console errors

### 2. **Set Custom Domain (Optional)**

1. Vercel Dashboard → Domains
2. Add your domain
3. Follow DNS configuration instructions

### 3. **Monitor**

- Check Vercel Analytics
- Monitor error logs
- Track performance

---

## 🔐 Security

### Stripe Webhook Configuration

After deployment, update Stripe webhook endpoint:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook signing secret
5. Add to Vercel as `STRIPE_WEBHOOK_SECRET`

---

## 📊 Expected Build Output

Successful build should show:
```
✓ Generating static pages (11/11)
✓ Collecting build traces
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    175 B            94 kB
├ ○ /app                                 5.74 kB         107 kB
├ ƒ /api/generate                        0 B                0 B
└ ...
```

---

## 🆘 Still Having Issues?

### Check Vercel Build Logs

1. Go to Deployments in Vercel
2. Click on the failed deployment
3. Review **Build Logs** for specific errors
4. Look for:
   - Missing environment variables
   - Module not found errors
   - TypeScript compilation errors
   - API route issues

### Common Fixes

1. **Module not found:**
   ```bash
   npm install --legacy-peer-deps
   git add package-lock.json
   git commit -m "Update lock file"
   git push
   ```

2. **Environment variable undefined:**
   - Double-check variable names (case-sensitive)
   - Ensure they're set for Production environment
   - Redeploy after setting

3. **Build timeout:**
   - Check for infinite loops in code
   - Optimize build process
   - Contact Vercel support for build time increase

---

## 📝 Notes

- **Build Time:** ~2-3 minutes
- **Cold Start:** First request may be slow
- **Caching:** Static assets are cached by Vercel CDN
- **Auto-scaling:** Vercel handles traffic automatically

---

## ✅ Success Indicators

Your deployment is successful when:
- ✅ Build completes without errors
- ✅ Homepage loads and looks correct
- ✅ App page loads properly
- ✅ API routes respond (test generate endpoint)
- ✅ No console errors in browser
- ✅ Logo appears correctly
- ✅ All buttons and interactions work

---

## 🎉 You're Live!

Once deployed successfully:
1. Share the URL with your team
2. Test all features thoroughly
3. Monitor analytics
4. Collect user feedback
5. Iterate and improve

**Your app is now accessible worldwide! 🌍**
