# Text Wingman 🚀

AI-powered text message reply generator that helps you craft perfect responses. Get 3 instant reply options: **Shorter**, **Spicier**, or **Softer**.

## Features

- 🎯 **AI-Powered Replies**: Generate 3 different reply options using GPT-4o-mini
- 🎨 **Three Tone Options**: 
  - **Shorter** - Brief & casual (5-10 words)
  - **Spicier** - Playful & flirty with personality
  - **Softer** - Warm & genuine, shows care
- 📱 **Mobile-First Design**: Clean, Apple-level UI built with Tailwind & shadcn/ui
- 💳 **Stripe Integration**: $7/month or $29/year subscriptions
- 📊 **Usage Tracking**: Free tier with 5 daily replies
- 🔒 **Secure**: Supabase backend with proper rate limiting

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4o-mini or custom Agent
- **Payments**: Stripe Checkout & Webhooks
- **Hosting**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key
- Supabase account and project
- Stripe account (for payments)

### Installation

1. **Clone and install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env
```

Fill in your environment variables in `.env`:
```env
# OpenAI
OPENAI_API_KEY=sk-...
TEXT_WINGMAN_AGENT_ID=asst_... # Optional, for custom agent

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_ANNUAL=price_...

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
FREE_USAGE_LIMIT=5
```

3. **Set up Supabase database**:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy the contents of `supabase/schema.sql`
   - Execute the SQL to create tables

4. **Set up Stripe**:
   - Create products in Stripe dashboard:
     - Monthly: $7/month subscription
     - Annual: $29/year subscription
   - Copy the price IDs to your `.env` file
   - Set up webhook endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Copy webhook secret to `.env`

5. **Run development server**:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── page.tsx                 # Landing page
│   ├── app/page.tsx            # Main AI reply generator
│   ├── test/page.tsx           # Debug/testing page
│   ├── api/
│   │   ├── generate/route.ts   # AI reply generation
│   │   ├── checkout/route.ts   # Stripe checkout
│   │   ├── metrics/route.ts    # Usage statistics
│   │   ├── share/route.ts      # Share card generation
│   │   └── webhooks/
│   │       └── stripe/route.ts # Stripe webhooks
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles
├── components/
│   └── ui/                     # shadcn/ui components
├── lib/
│   ├── openai.ts               # OpenAI integration
│   ├── stripe.ts               # Stripe configuration
│   ├── supabase.ts             # Supabase client
│   └── utils.ts                # Utility functions
├── supabase/
│   └── schema.sql              # Database schema
└── package.json
```

## Usage

### For Users

1. Visit the landing page at `/`
2. Click "Try It Free" to access the app
3. Paste any message you received
4. Click "Generate Replies"
5. Get 3 options: Shorter, Spicier, Softer
6. Copy your favorite and send!

### API Routes

#### POST `/api/generate`
Generate AI replies for a message.

**Request**:
```json
{
  "message": "Hey, what are you up to this weekend?"
}
```

**Response**:
```json
{
  "replies": [
    { "tone": "shorter", "text": "Not much, you?" },
    { "tone": "spicier", "text": "Depends... what did you have in mind? 😏" },
    { "tone": "softer", "text": "Nothing set yet! Would love to hear what you're thinking though" }
  ]
}
```

#### POST `/api/checkout`
Create Stripe checkout session.

**Request**:
```json
{
  "plan": "monthly" // or "annual"
}
```

#### GET `/api/metrics`
Get usage statistics for the current user.

**Response**:
```json
{
  "today": {
    "count": 3,
    "limit": 5,
    "remaining": 2
  },
  "allTime": {
    "count": 47
  }
}
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables Setup

Make sure to add all environment variables from `.env.example` to your Vercel project settings.

### Stripe Webhooks

After deployment, update your Stripe webhook endpoint to:
```
https://your-domain.vercel.app/api/webhooks/stripe
```

## Customization

### Adjusting AI Prompts

Edit the system prompt in `lib/openai.ts`:

```typescript
const SYSTEM_PROMPT = `Your custom prompt here...`;
```

### Changing Usage Limits

Update `FREE_USAGE_LIMIT` in your environment variables.

### Styling

All styles use Tailwind CSS. Customize colors in `tailwind.config.ts` and `app/globals.css`.

## Development

### Testing API Endpoints

Visit `/test` to test the AI generation locally without building the full UI flow.

### Debugging

- Check Supabase logs for database issues
- Check Stripe dashboard for payment issues
- Use browser console for frontend errors
- Check Vercel logs for production issues

## Roadmap

- [ ] User authentication (Supabase Auth)
- [ ] Share card image generation
- [ ] More tone options (Professional, Funny, etc.)
- [ ] Conversation history
- [ ] Mobile app (React Native)
- [ ] Chrome extension

## Contributing

Pull requests are welcome! For major changes, please open an issue first.

## License

MIT License - see LICENSE file for details

## Support

- Email: support@textwingman.com
- Discord: [Join our community]
- Twitter: [@textwingman]

---

Built with ❤️ using Next.js, OpenAI, and Supabase
