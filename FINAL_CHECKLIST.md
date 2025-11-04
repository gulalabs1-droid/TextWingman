# Final Deployment Checklist

## 🎯 Goal: Deploy Working MVP in 48 Hours

---

## Phase 1: Local Setup (30 minutes)

### 1. Install Dependencies
```bash
cd /Users/ct/Documents/GULA\ TEXTWING\ MAN
npm install
```

### 2. Environment Configuration
Create `.env` file with these keys:

```env
# OpenAI (REQUIRED for MVP)
OPENAI_API_KEY=sk-your-key-here
TEXT_WINGMAN_AGENT_ID=asst-your-agent-id (optional)

# Supabase (REQUIRED for usage tracking)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Stripe (REQUIRED for subscriptions)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (add after webhook setup)
STRIPE_PRICE_ID_MONTHLY=price_... (from Stripe dashboard)
STRIPE_PRICE_ID_ANNUAL=price_... (from Stripe dashboard)

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
FREE_USAGE_LIMIT=5
```

### 3. Supabase Setup
1. Create new project at supabase.com
2. Go to SQL Editor
3. Run the complete schema from `supabase/schema.sql`
4. Verify tables created: `usage_logs`, `subscriptions`, `users`
5. Copy API keys from Settings → API

### 4. OpenAI Agent Setup
1. Go to OpenAI Platform → Assistants
2. Create new assistant:
   - Name: "Text Wingman"
   - Instructions: Copy from `lib/openai.ts` SYSTEM_PROMPT
   - Model: gpt-4o-mini
3. Copy Assistant ID to `TEXT_WINGMAN_AGENT_ID`

### 5. Stripe Setup
1. Create Stripe account (test mode)
2. Create two products:
   
   **Product 1: Monthly**
   - Name: "Text Wingman Monthly"
   - Description: "Unlimited AI-powered text replies"
   - Price: $7.00 USD
   - Billing: Monthly recurring
   - Copy Price ID to `STRIPE_PRICE_ID_MONTHLY`
   
   **Product 2: Annual**
   - Name: "Text Wingman Annual"
   - Description: "Unlimited AI-powered text replies - Save $55/year"
   - Price: $29.00 USD
   - Billing: Yearly recurring
   - Copy Price ID to `STRIPE_PRICE_ID_ANNUAL`

3. Copy API keys from Developers → API keys

### 6. Test Locally
```bash
npm run dev
```

Visit: http://localhost:3000

**Test Flow:**
1. Go to `/app`
2. Paste test message: "Hey, what are you doing this weekend?"
3. Click "Generate Replies"
4. Verify 3 replies appear (Shorter, Spicier, Softer)
5. Test copy button (should turn green)
6. Verify toast notification appears
7. Click "Try Again"

---

## Phase 2: Vercel Deployment (20 minutes)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit - Text Wingman MVP"
git branch -M main
git remote add origin your-repo-url
git push -u origin main
```

### 2. Deploy to Vercel
1. Go to vercel.com
2. Click "Import Project"
3. Select your GitHub repo
4. Framework: Next.js (auto-detected)
5. Root Directory: `./`
6. Build Command: `npm run build`
7. Output Directory: `.next`

### 3. Add Environment Variables in Vercel
Go to Project Settings → Environment Variables

Add all variables from `.env`:
- OPENAI_API_KEY
- TEXT_WINGMAN_AGENT_ID (optional)
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- STRIPE_SECRET_KEY
- STRIPE_PRICE_ID_MONTHLY
- STRIPE_PRICE_ID_ANNUAL
- NEXT_PUBLIC_APP_URL (use your Vercel URL)
- FREE_USAGE_LIMIT=5

### 4. Deploy
Click "Deploy"

Wait 2-3 minutes for build to complete.

---

## Phase 3: Stripe Webhook Setup (10 minutes)

### 1. Get Vercel URL
Copy your deployment URL: `https://your-app.vercel.app`

### 2. Add Stripe Webhook
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://your-app.vercel.app/api/webhooks/stripe`
4. Description: "Text Wingman Subscription Events"
5. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
6. Add endpoint

### 3. Get Webhook Secret
1. Click on your webhook endpoint
2. Click "Reveal" under "Signing secret"
3. Copy the secret (starts with `whsec_`)
4. Add to Vercel env vars as `STRIPE_WEBHOOK_SECRET`
5. Redeploy in Vercel

---

## Phase 4: Final Testing (30 minutes)

### Production Testing

#### 1. Test Landing Page
- Visit your Vercel URL
- Check gradient displays correctly
- Verify all buttons work
- Test mobile responsive (cmd+shift+M in Chrome)
- Check 9:16 viewport

#### 2. Test Main App
1. Go to `/app`
2. Paste message
3. Click "Generate Replies"
4. Verify replies appear in < 2 seconds
5. Check all 3 tones display correctly
6. Test copy button on each reply
7. Verify green confirmation feedback
8. Test toast notifications
9. Click "Try Again" button

#### 3. Test Stripe Integration
1. Click subscribe/upgrade button (when limit reached)
2. Stripe checkout should open
3. Use test card: 4242 4242 4242 4242
4. Any future date, any CVV
5. Complete payment
6. Should redirect to `/app?success=true`
7. Check Stripe dashboard for payment

#### 4. Test Usage Limits
1. Generate 5 replies (free limit)
2. Try 6th generation
3. Should show upgrade prompt
4. Error message: "Usage limit reached"

#### 5. Test Webhook
1. Complete test payment in Stripe
2. Check Vercel logs for webhook event
3. Verify subscription created in Supabase
4. Query: `SELECT * FROM subscriptions;`

---

## Success Criteria Checklist

### UI Requirements
- [x] Mobile-first 9:16 ratio design
- [x] Gradient theme (#000 → #8B5CF6)
- [x] Rounded cards with soft shadows
- [x] 1-tap copy with visual feedback
- [x] "Try again" button below results
- [x] Toast confirmations on copy

### Functional Requirements
- [x] User pastes message
- [x] 3 replies appear in < 2 seconds
- [x] Copy and share functionality
- [x] Seamless subscription flow
- [x] Usage tracking (5/day free)
- [x] Stripe checkout integration

### AI Requirements
- [x] Replies under 18 words
- [x] No emojis
- [x] No double-text energy
- [x] Confident, warm, natural tone
- [x] 3 distinct tones: Shorter, Spicier, Softer

### Technical Requirements
- [x] Next.js 14 with App Router
- [x] TypeScript throughout
- [x] Supabase for database
- [x] Stripe for payments
- [x] OpenAI GPT-4o-mini integration
- [x] Vercel deployment ready

---

## Post-Launch Tasks

### Day 1-2
- [ ] Monitor Vercel logs for errors
- [ ] Check Stripe dashboard for payments
- [ ] Monitor OpenAI API usage
- [ ] Test on real mobile devices
- [ ] Share with beta testers

### Week 1
- [ ] Gather user feedback
- [ ] Monitor conversion rates
- [ ] Check free → paid conversion
- [ ] Optimize AI prompts based on feedback
- [ ] Fix any bugs

### Month 1
- [ ] Add analytics (Vercel Analytics)
- [ ] Implement user authentication
- [ ] Add conversation history
- [ ] Build share card generator
- [ ] Plan v2 features

---

## Support & Monitoring

### Monitor These Metrics
1. **OpenAI Usage**: platform.openai.com/usage
2. **Stripe Revenue**: dashboard.stripe.com
3. **Vercel Logs**: vercel.com/your-project/logs
4. **Supabase DB**: supabase.com/project/database

### Cost Estimates (1000 users/month)
- OpenAI: $3-5/month
- Supabase: Free tier
- Vercel: Free tier
- Stripe: 2.9% + $0.30 per transaction

### Emergency Contacts
- OpenAI Status: status.openai.com
- Stripe Status: status.stripe.com
- Vercel Status: vercel-status.com
- Supabase Status: status.supabase.com

---

## 🚀 Launch Sequence

**Time to deploy: ~90 minutes**

1. ✅ Local setup (30 min)
2. ✅ Vercel deploy (20 min)
3. ✅ Webhook setup (10 min)
4. ✅ Final testing (30 min)

**You're ready to go live!**

---

## Troubleshooting

### API Not Working
- Check Vercel logs
- Verify all env vars are set
- Test OpenAI API key validity
- Check Supabase connection

### Payments Not Working
- Verify Stripe keys (test vs live)
- Check webhook is receiving events
- Verify webhook secret is correct
- Check Vercel logs for errors

### UI Not Displaying Correctly
- Clear browser cache
- Check mobile viewport settings
- Verify Tailwind CSS is compiling
- Check for console errors

---

**Success Metric:**
_"User pastes message → 3 replies appear in under 2 seconds → can copy and share → can subscribe seamlessly."_

✅ **ALL SYSTEMS READY FOR DEPLOYMENT!**
