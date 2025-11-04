# 🚀 Deploy Text Wingman in 3 Steps

## Step 1: Get Your API Keys (10 minutes)

### OpenAI
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-`)
4. Paste into `.env.local` as `OPENAI_API_KEY`

### Supabase
1. Go to https://supabase.com
2. Create new project (takes 2 minutes)
3. Go to SQL Editor → paste `supabase/schema.sql` → Execute
4. Go to Settings → API
5. Copy these values to `.env.local`:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role → `SUPABASE_SERVICE_ROLE_KEY`

### Stripe
1. Go to https://dashboard.stripe.com
2. Create 2 products:
   - **Monthly**: $7/month → Copy Price ID to `STRIPE_PRICE_ID_MONTHLY`
   - **Annual**: $29/year → Copy Price ID to `STRIPE_PRICE_ID_ANNUAL`
3. Go to Developers → API keys
4. Copy to `.env.local`:
   - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY`

## Step 2: Test Locally (5 minutes)

```bash
# Make sure server is running
npm run dev

# Test at http://localhost:3000/app
# Paste a message and generate replies
```

## Step 3: Deploy to Vercel (10 minutes)

### A. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - Text Wingman"
git branch -M main
# Create repo on GitHub, then:
git remote add origin your-repo-url
git push -u origin main
```

### B. Deploy on Vercel

1. Go to https://vercel.com
2. Click "Import Project"
3. Select your GitHub repo
4. Click "Deploy"

### C. Add Environment Variables

In Vercel dashboard → Settings → Environment Variables

Add all variables from `.env.local`:
```
OPENAI_API_KEY
TEXT_WINGMAN_AGENT_ID (optional)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_PRICE_ID_MONTHLY
STRIPE_PRICE_ID_ANNUAL
NEXT_PUBLIC_APP_URL (use your Vercel URL)
FREE_USAGE_LIMIT=5
```

### D. Set Up Stripe Webhook

1. Copy your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Go to Stripe → Developers → Webhooks
3. Add endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy webhook secret → Add to Vercel as `STRIPE_WEBHOOK_SECRET`
6. Redeploy in Vercel

## ✅ You're Live!

Visit your Vercel URL and test:
- Generate replies
- Try copy buttons
- Test subscription flow

---

## Quick Commands

```bash
# Test locally
npm run dev

# Build for production
npm run build

# Check for errors
npm run build && npm run start
```

## Need Help?

- OpenAI not working? Check API key and credits
- Supabase error? Verify schema.sql ran successfully
- Stripe failing? Ensure webhook URL is correct
- Deployment issues? Check Vercel logs

**Estimated Total Time: 25 minutes** ⚡
