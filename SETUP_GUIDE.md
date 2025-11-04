# Quick Setup Guide

Get Text Wingman running locally in 10 minutes.

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- OpenAI API key ([get one here](https://platform.openai.com))
- Supabase account ([sign up here](https://supabase.com))

## Quick Start

### 1. Install Dependencies (2 min)

```bash
npm install
```

### 2. Set Up Environment Variables (3 min)

Create `.env` file:

```bash
cp .env.example .env
```

Add your OpenAI key (minimum required):

```env
OPENAI_API_KEY=sk-your-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
FREE_USAGE_LIMIT=5
```

For full functionality, also add Supabase and Stripe keys (see below).

### 3. Set Up Supabase (3 min)

1. Create project at [supabase.com](https://supabase.com)
2. Go to SQL Editor
3. Copy & paste contents from `supabase/schema.sql`
4. Execute SQL
5. Go to Settings > API, copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

### 4. Run Development Server (1 min)

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Testing Without Supabase

You can test the AI generation without Supabase by:

1. Commenting out Supabase checks in `app/api/generate/route.ts`
2. Running the app
3. Going to `/test` to try AI generation

## Testing Without Stripe

Stripe is only needed for payments. The app will work without it for testing the AI features.

## Minimum Working Configuration

For basic testing, you only need:

```env
OPENAI_API_KEY=sk-your-key-here
```

This allows you to:
- ✅ Test AI reply generation at `/test`
- ✅ See the UI
- ❌ Cannot track usage (no Supabase)
- ❌ Cannot process payments (no Stripe)

## Full Configuration

For production-ready setup:

```env
# Required for AI
OPENAI_API_KEY=sk-...
TEXT_WINGMAN_AGENT_ID=asst_... # optional

# Required for usage tracking
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Required for payments
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_ANNUAL=price_...

# App config
NEXT_PUBLIC_APP_URL=http://localhost:3000
FREE_USAGE_LIMIT=5
```

## Common Issues

### "Cannot find module" errors
Run `npm install`

### OpenAI API errors
- Check your API key is valid
- Ensure you have credits in your OpenAI account
- Check [OpenAI status page](https://status.openai.com)

### Supabase connection errors
- Verify URLs and keys are correct
- Check Supabase project is active
- Ensure schema.sql was executed

### Port already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

## Next Steps

1. ✅ Get basic app running
2. Test AI generation at `/test`
3. Test main app at `/app`
4. Set up Stripe for payments
5. Deploy to Vercel (see DEPLOYMENT.md)

## Need Help?

Check out:
- Full README.md for detailed docs
- DEPLOYMENT.md for production setup
- OpenAI docs: [platform.openai.com/docs](https://platform.openai.com/docs)
- Supabase docs: [supabase.com/docs](https://supabase.com/docs)
