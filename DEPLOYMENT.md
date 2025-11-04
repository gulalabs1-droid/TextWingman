# Deployment Guide

Complete deployment guide for Text Wingman to production.

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Supabase database schema applied
- [ ] Stripe products created
- [ ] OpenAI API key valid
- [ ] Domain name ready (optional)

## Step 1: Supabase Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Wait for project to initialize

2. **Run Database Schema**
   - Open SQL Editor in Supabase dashboard
   - Copy contents from `supabase/schema.sql`
   - Execute the SQL

3. **Get API Keys**
   - Go to Settings > API
   - Copy:
     - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
     - `anon` public key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
     - `service_role` key (`SUPABASE_SERVICE_ROLE_KEY`)

4. **Configure RLS (Optional)**
   - Tables are set up with RLS enabled
   - Adjust policies based on your auth needs

## Step 2: OpenAI Setup

1. **Get API Key**
   - Go to [platform.openai.com](https://platform.openai.com)
   - Navigate to API keys
   - Create new secret key
   - Copy key to `OPENAI_API_KEY`

2. **Optional: Create Custom Agent**
   - Go to OpenAI Assistants
   - Create new assistant
   - Configure with custom instructions
   - Copy assistant ID to `TEXT_WINGMAN_AGENT_ID`

3. **Set Usage Limits**
   - Configure usage limits in OpenAI dashboard
   - Set up billing alerts

## Step 3: Stripe Setup

1. **Create Stripe Account**
   - Go to [stripe.com](https://stripe.com)
   - Complete business verification

2. **Create Products**
   
   **Monthly Plan**:
   - Name: "Text Wingman Monthly"
   - Price: $7 USD
   - Recurring: Monthly
   - Copy Price ID to `STRIPE_PRICE_ID_MONTHLY`

   **Annual Plan**:
   - Name: "Text Wingman Annual"
   - Price: $29 USD
   - Recurring: Yearly
   - Copy Price ID to `STRIPE_PRICE_ID_ANNUAL`

3. **Get API Keys**
   - Go to Developers > API keys
   - Copy:
     - Publishable key (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)
     - Secret key (`STRIPE_SECRET_KEY`)

4. **Test Mode First**
   - Use test keys initially
   - Test full payment flow
   - Switch to live keys when ready

## Step 4: Vercel Deployment

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Configure project:
     - Framework: Next.js
     - Root Directory: `./`
     - Build Command: `npm run build`
     - Output Directory: `.next`

3. **Add Environment Variables**

Go to Project Settings > Environment Variables and add:

```
OPENAI_API_KEY=sk-...
TEXT_WINGMAN_AGENT_ID=asst-... (optional)

NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... (add after webhook setup)
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_ANNUAL=price_...

NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
FREE_USAGE_LIMIT=5
```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Get deployment URL

## Step 5: Stripe Webhooks

1. **Add Webhook Endpoint**
   - Go to Stripe Dashboard > Developers > Webhooks
   - Click "Add endpoint"
   - URL: `https://your-domain.vercel.app/api/webhooks/stripe`
   
2. **Select Events**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

3. **Get Webhook Secret**
   - Copy webhook signing secret
   - Add to Vercel env vars as `STRIPE_WEBHOOK_SECRET`
   - Redeploy app

4. **Test Webhook**
   - Use Stripe CLI or dashboard
   - Send test events
   - Check Vercel logs for processing

## Step 6: Custom Domain (Optional)

1. **Add Domain in Vercel**
   - Go to Project Settings > Domains
   - Add your domain
   - Follow DNS configuration instructions

2. **Update Environment Variable**
   - Change `NEXT_PUBLIC_APP_URL` to your domain
   - Redeploy

3. **Update Stripe Webhook**
   - Update webhook URL to use custom domain
   - Update redirect URLs in Stripe settings

## Step 7: Testing Production

1. **Test Landing Page**
   - Visit your domain
   - Check all links work
   - Verify mobile responsiveness

2. **Test Reply Generation**
   - Go to `/app`
   - Paste test message
   - Verify AI generates 3 replies
   - Check rate limiting works

3. **Test Stripe Payment**
   - Click upgrade/subscription CTA
   - Complete test payment (use Stripe test cards)
   - Verify webhook receives events
   - Check Supabase subscription table

4. **Test Usage Limits**
   - Generate replies until limit hit
   - Verify upgrade prompt appears
   - Clear browser/IP and test again

## Step 8: Go Live

1. **Switch to Live Keys**
   - Stripe: Switch from test to live keys
   - Update Vercel environment variables
   - Redeploy

2. **Test Real Payment**
   - Use real credit card (small amount)
   - Verify full flow works
   - Refund test payment

3. **Monitor**
   - Vercel Analytics
   - Stripe Dashboard
   - Supabase Logs
   - OpenAI Usage

## Monitoring & Maintenance

### Regular Checks

- **Daily**: Stripe dashboard for failed payments
- **Weekly**: OpenAI usage and costs
- **Monthly**: Supabase database size
- **Monthly**: User feedback and issues

### Cost Monitoring

- **OpenAI**: ~$0.0001 per reply (3 replies per generation)
- **Supabase**: Free tier for small usage
- **Vercel**: Free for personal projects
- **Stripe**: 2.9% + 30¢ per transaction

### Scaling Considerations

- Add Redis for better rate limiting
- Implement user authentication
- Add CDN for static assets
- Consider edge functions for faster API
- Database connection pooling

## Troubleshooting

### API Not Working

1. Check Vercel logs
2. Verify environment variables
3. Test API routes with `/test`
4. Check OpenAI API status

### Stripe Webhooks Failing

1. Check webhook signing secret
2. Verify endpoint URL
3. Check Stripe logs
4. Test with Stripe CLI

### Database Issues

1. Check Supabase logs
2. Verify RLS policies
3. Check connection limits
4. Test queries in SQL editor

## Security Checklist

- [ ] Use environment variables for all secrets
- [ ] Enable Stripe webhook signature verification
- [ ] Set up Supabase RLS policies
- [ ] Add rate limiting
- [ ] Use HTTPS only
- [ ] Sanitize user inputs
- [ ] Monitor for suspicious activity

## Rollback Plan

If issues occur:

1. **Vercel**: Instant rollback to previous deployment
2. **Database**: Keep backups, Supabase has point-in-time recovery
3. **Stripe**: Can pause subscriptions or refund
4. **DNS**: Keep old DNS records for 24 hours

---

**Need Help?**
- Vercel Support: [vercel.com/support](https://vercel.com/support)
- Stripe Support: [support.stripe.com](https://support.stripe.com)
- Supabase Support: [supabase.com/support](https://supabase.com/support)
