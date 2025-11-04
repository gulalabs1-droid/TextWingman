# V2 Launch Guide

## Overview
The V2 teaser page is now live at `/v2` with a waitlist system powered by Supabase.

## What's Included

### 1. V2 Teaser Page (`/app/v2/page.tsx`)
- Hero section with V2 announcement
- Dual-Check AI™ explanation
- V1 vs V2 comparison
- Timeline & roadmap
- FAQ section
- Waitlist signup form with email + optional referral source
- Sticky mobile CTA bar
- Framer Motion animations throughout

### 2. Waitlist API (`/app/api/waitlist/route.ts`)
- POST endpoint to save waitlist signups
- Email validation
- Duplicate detection
- Error handling

### 3. Supabase Setup

#### Database Table
Run this migration to create the waitlist table:
```sql
-- See: supabase/migrations/create_v2_waitlist.sql
```

Or manually create in Supabase SQL Editor:
- Table: `v2_waitlist`
- Columns:
  - `id` (UUID, primary key)
  - `email` (TEXT, unique, required)
  - `referral_source` (TEXT, optional)
  - `created_at` (TIMESTAMP)
  - `notified` (BOOLEAN, default false)
  - `notified_at` (TIMESTAMP)

#### Environment Variables
Ensure these are set in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Homepage Updates
- Added "V2 Preview" link to navigation
- Eye-catching design with violet gradient and pulse animation
- Mobile responsive

## Design Features

### Visual Design
- **Dark Theme**: Black background with violet accents (#8B5CF6)
- **Apple-level aesthetics**: Premium cards, soft shadows, blur effects
- **Animations**: Framer Motion fade-ins, stagger effects
- **Mobile-first**: Responsive layout with sticky bottom bar

### Copy
All copy follows the provided spec exactly:
- Hero headline: "Replies that get it right — because we verify them twice."
- Clear V1 vs V2 differentiation
- Dual-Check AI™ branding throughout
- Friendly, conversational tone

## Testing Checklist

- [ ] Visit `/v2` page loads correctly
- [ ] All sections render properly
- [ ] Waitlist form accepts email
- [ ] Duplicate email shows error
- [ ] Invalid email shows validation error
- [ ] Success state shows after submission
- [ ] Sticky bar appears on mobile
- [ ] Navigation link from homepage works
- [ ] All animations are smooth
- [ ] Page is responsive on mobile/tablet/desktop

## Analytics Events (Optional)

The page is ready for these events:
- `v2_view` - Page view
- `v2_waitlist_submit` - Waitlist signup
- `v2_try_v1_click` - Click to try V1

Add your analytics provider (Google Analytics, Mixpanel, etc.) to track these.

## Deployment

1. **Supabase Setup**
   - Run the migration SQL
   - Verify RLS policies are enabled
   - Test insert from the form

2. **Build & Deploy**
   ```bash
   npm run build
   npm run lint
   git add .
   git commit -m "🚀 Add V2 teaser page with waitlist"
   git push
   ```

3. **Verify Production**
   - Test form submission
   - Check Supabase logs
   - Monitor for errors

## Future Enhancements

- Replace simple alert with proper toast component
- Add analytics tracking
- Email confirmation system
- Admin dashboard to view waitlist
- Export waitlist to CSV
- Batch email invitations

## Support

For issues or questions:
1. Check Supabase logs for API errors
2. Verify environment variables are set
3. Test in incognito mode to rule out caching
