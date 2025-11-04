# ⚡ Deploy in 3 Commands

## You're Ready! Here's what's done:

✅ Git initialized  
✅ All files committed  
✅ `.env.local` created (add your keys)  
✅ Vercel config ready  
✅ Documentation complete  

---

## Next: Get Your Live URL in 15 Minutes

### 1️⃣ Add Your API Keys (`.env.local`)

Open `.env.local` and replace the placeholders:

**Required:**
- `OPENAI_API_KEY` - Get from https://platform.openai.com/api-keys
- `NEXT_PUBLIC_SUPABASE_URL` - From your Supabase project
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - From Supabase Settings → API
- `SUPABASE_SERVICE_ROLE_KEY` - From Supabase Settings → API

**For Payments:**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - From Stripe dashboard
- `STRIPE_SECRET_KEY` - From Stripe dashboard
- `STRIPE_PRICE_ID_MONTHLY` - Create $7/mo product in Stripe
- `STRIPE_PRICE_ID_ANNUAL` - Create $29/yr product in Stripe

### 2️⃣ Test Locally

```bash
npm run dev
# Visit http://localhost:3000/app
# Test the AI generation
```

### 3️⃣ Deploy to Vercel

**Option A: Via GitHub (Recommended)**

```bash
# 1. Create repo on GitHub
# 2. Run these commands:

git remote add origin https://github.com/YOUR-USERNAME/text-wingman.git
git push -u origin main

# 3. Go to vercel.com → Import → Select your repo
# 4. Add environment variables from .env.local
# 5. Deploy!
```

**Option B: Direct Deploy**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts, it auto-detects Next.js
```

---

## 🎯 After Deployment

1. **Copy your Vercel URL** (e.g., `https://text-wingman.vercel.app`)

2. **Update these env vars in Vercel:**
   - `NEXT_PUBLIC_APP_URL` → Your Vercel URL

3. **Set up Stripe Webhook:**
   - Stripe Dashboard → Webhooks
   - Add endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.*`
   - Copy webhook secret → Add to Vercel as `STRIPE_WEBHOOK_SECRET`

4. **Redeploy** in Vercel (to pick up new env vars)

---

## ✅ Success!

Your app is live! Test:
- Visit `/app` and generate replies
- Try the copy buttons
- Test subscription flow

---

## 📚 Full Documentation

- `DEPLOY_NOW.md` - Detailed deployment guide
- `FINAL_CHECKLIST.md` - Complete 48-hour checklist
- `README.md` - Full project documentation
- `GET_STARTED.md` - Quick start guide

---

**Need the keys?**

1. **OpenAI**: https://platform.openai.com/api-keys (5 min)
2. **Supabase**: https://supabase.com (5 min + run `supabase/schema.sql`)
3. **Stripe**: https://dashboard.stripe.com (5 min)

**Total Time: ~25 minutes to live! 🚀**
