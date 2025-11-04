# 🚀 Get Started with Text Wingman

Welcome! Your complete Text Wingman AI agent is ready. Follow these steps to launch.

## ⚡ Quick Start (5 minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Minimum Config
Create `.env` file with just your OpenAI key:

```env
OPENAI_API_KEY=sk-your-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
FREE_USAGE_LIMIT=5
```

### Step 3: Run
```bash
npm run dev
```

Visit: **http://localhost:3000**

🎉 **You're live!** The app will work for testing the UI. For full functionality, continue below.

---

## 📋 What You Built

### ✅ Complete Features
- **Landing Page** (`/`) - Hero, pricing, CTA
- **AI Generator** (`/app`) - Main reply generation interface
- **Test Page** (`/test`) - Debug OpenAI integration
- **5 API Routes**:
  - `/api/generate` - Generate AI replies
  - `/api/checkout` - Stripe subscription
  - `/api/webhooks/stripe` - Handle Stripe events
  - `/api/metrics` - Usage statistics
  - `/api/share` - Share cards (placeholder)

### 🎨 UI Components
- Responsive mobile-first design
- shadcn/ui components (Button, Card, Toast, Dialog)
- Tailwind CSS styling
- Apple-level clean UI

### 🔧 Tech Stack
- **Frontend**: Next.js 14 + TypeScript + React
- **AI**: OpenAI GPT-4o-mini
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe
- **Styling**: Tailwind CSS + shadcn/ui
- **Hosting**: Ready for Vercel

---

## 🎯 Next Steps

### For Testing (No Setup Required)
1. ✅ Already done - app runs with just OpenAI key
2. Go to `/test` to try AI generation
3. See landing page at `/`
4. View app UI at `/app`

### For Full Functionality

#### Add Supabase (5 min)
1. Create project at [supabase.com](https://supabase.com)
2. Run SQL from `supabase/schema.sql`
3. Add keys to `.env`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**What this enables:**
- ✅ Usage tracking & rate limiting
- ✅ Subscription management
- ✅ User data storage

#### Add Stripe (10 min)
1. Create account at [stripe.com](https://stripe.com)
2. Create 2 products:
   - Monthly: $7/month
   - Annual: $29/year
3. Add to `.env`:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_ANNUAL=price_...
```

**What this enables:**
- ✅ Paid subscriptions
- ✅ Unlimited replies for subscribers
- ✅ Automatic billing

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| `README.md` | Full project documentation |
| `SETUP_GUIDE.md` | Step-by-step setup instructions |
| `DEPLOYMENT.md` | Deploy to Vercel production |
| `CONTRIBUTING.md` | Contribution guidelines |
| `GET_STARTED.md` | This file - quick start |

---

## 🗂️ Project Structure

```
text-wingman/
├── app/
│   ├── page.tsx              # Landing page
│   ├── app/page.tsx          # Main AI generator
│   ├── test/page.tsx         # Debug page
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   └── api/
│       ├── generate/         # AI reply generation
│       ├── checkout/         # Stripe checkout
│       ├── metrics/          # Usage stats
│       ├── share/            # Share cards
│       └── webhooks/stripe/  # Stripe webhooks
├── components/ui/            # shadcn/ui components
├── lib/
│   ├── openai.ts            # OpenAI integration
│   ├── stripe.ts            # Stripe config
│   ├── supabase.ts          # Supabase client
│   └── utils.ts             # Utilities
├── supabase/
│   └── schema.sql           # Database schema
└── [config files]
```

---

## 🧪 Testing the App

### Test AI Generation
1. Go to **http://localhost:3000/test**
2. Paste a test message
3. Click "Test Generate"
4. See 3 AI replies (Shorter, Spicier, Softer)

### Test Main App
1. Go to **http://localhost:3000/app**
2. Paste any message
3. Click "Generate Replies"
4. Copy your favorite reply

### Test Landing Page
1. Go to **http://localhost:3000**
2. Check responsive design
3. Click "Try It Free"
4. View pricing section

---

## 🐛 Troubleshooting

### TypeScript Errors?
**Normal!** They'll disappear after `npm install`.

### OpenAI Not Working?
- Check API key is valid
- Ensure you have credits
- Visit [OpenAI status](https://status.openai.com)

### Port 3000 In Use?
```bash
# Use different port
PORT=3001 npm run dev
```

### Need Help?
1. Check `SETUP_GUIDE.md` for detailed setup
2. See `README.md` for full docs
3. Check `DEPLOYMENT.md` for production issues

---

## 🚀 Deploy to Production

Ready to go live? See `DEPLOYMENT.md` for full guide:

```bash
# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git push

# Then import to Vercel
```

**What you need:**
- GitHub account
- Vercel account (free)
- Production Stripe keys
- Production Supabase project

---

## 🎨 Customization

### Change AI Prompts
Edit `lib/openai.ts` to customize reply generation.

### Adjust Pricing
Update Stripe products and `.env` variables.

### Change Styling
Edit Tailwind config and component styles.

### Add Features
See `CONTRIBUTING.md` for development guidelines.

---

## 💡 Tips

### Development
- Use `/test` page for quick AI testing
- Check browser console for errors
- Monitor OpenAI usage in dashboard
- Test mobile view with responsive mode

### Production
- Start with Stripe test mode
- Monitor costs (OpenAI, Supabase, Vercel)
- Set up error tracking (Sentry)
- Add analytics (Vercel Analytics)

### Scaling
- Add Redis for rate limiting
- Implement user authentication
- Add conversation history
- Create mobile app

---

## 📊 What's Included

✅ **Pages**
- Landing page with pricing
- Main AI generator app
- Debug/test page

✅ **Features**
- 3 reply tones (Shorter, Spicier, Softer)
- Copy to clipboard
- Usage rate limiting
- Stripe subscriptions
- Mobile responsive

✅ **API Routes**
- AI generation endpoint
- Stripe checkout
- Webhook handling
- Usage metrics
- Share card (placeholder)

✅ **Database**
- Usage logs table
- Subscriptions table
- Users table (optional)

✅ **Documentation**
- Setup guides
- Deployment guide
- API documentation
- Contributing guide

---

## 🎯 Success Checklist

- [ ] Installed dependencies (`npm install`)
- [ ] Added OpenAI API key
- [ ] App runs locally (`npm run dev`)
- [ ] Tested AI generation at `/test`
- [ ] (Optional) Set up Supabase
- [ ] (Optional) Set up Stripe
- [ ] Ready to deploy!

---

**You're all set! 🎉**

Start with testing locally, then add Supabase and Stripe when ready for full features.

Questions? Check the other docs or open an issue.

Happy building! 🚀
