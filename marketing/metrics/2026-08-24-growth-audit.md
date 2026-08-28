# Growth Audit - 2026-08-24

This is a public-profile and first-party admin snapshot. It is not a substitute for native retention exports from YouTube, TikTok, or Instagram.

## Channel snapshot

### YouTube - @gulatextwingman

- 3 subscribers and 77 Shorts.
- Strong visible Shorts: `Your Text Was Not Too Honest. It Was Too Intense` (1.5K), `The Reply That Stops You From Sounding Desperate` (1.1K), `When They Text "We Need To Talk" With No Context` (1K), `"You Up?" At 1:07 AM Is Not A Conversation` (965), `When "I Had Fun" Sounds Like Goodbye` (891), and `Not Looking For Anything Serious... But Texts Every Morning` (642).
- Winning pattern: a recognizable text, an immediate social stake, and a concrete next move. Product-first ads and abstract coach intros are weaker.

### TikTok - @gulatextwingman

- 0 followers and 51 likes.
- Strong visible posts: `I'm bored` (293), `I don't know what I want` (285), `Hey` (283), `I had fun` (279), and the extra-paragraph reply (264).
- Winning pattern is similar to YouTube, but follower conversion is currently the bottleneck: reach is not becoming an audience.

### Instagram - @textwingmangula

- 52 posts, 0 followers, and 1 following.
- The current desktop profile editor has the Website field disabled and says links must be edited in the Instagram mobile app. The bio currently contains a raw URL in text, not a verified website-field link.
- Native Reel reach is not exposed in the public profile snapshot; use Instagram Insights in the mobile app for plays, watch time, profile visits, and follows.

## First-party funnel evidence

### `/admin/people` (30-day range)

- 15 people reached the product; all 15 were anonymous.
- 0 registered, 0 activated, and 0 replies.
- Sources: direct 7, YouTube 4, Facebook 2, site referrer 1, Bing 1.
- Devices: desktop 14, mobile 1. Countries: US 11, India 2, Ukraine 1, Ireland 1.

### `/admin2` (live, before the local filtering patch is deployed)

- The page showed 29 raw page views, 4 unique visitors, 0 signups, 0 copies, and 0 upgrades/cancels.
- The raw stream was dominated by the owner browsing `/admin`, `/admin2`, `/admin/people`, `/admin/funnel`, and related pages. After removing that owner/admin-referrer noise, the current external activity is approximately 5 page views from 3 anonymous visitors, still with 0 product actions.
- This is why the raw `/admin2` number should not be used for marketing decisions until the patch is deployed.

### Classic admin and funnel consistency

- The live overview mixes incompatible data sources: its cards show 2 total users and 0 activated, while its funnel shows 15 signed up, 4 activated, and 1 paid.
- The live funnel displays `350% converted` because it divides a lifetime/people count by 0 signups in the last 30 days. That is a dashboard bug, not a business result.
- Billing shows one active subscription and one canceled subscription, but the live revenue cards are also inconsistent. Treat billing as the source of truth for subscription state.

## Seven-day test

- Use YouTube for discovery, TikTok for creative testing, and Instagram as the proof library.
- Test one morning post and one evening post per platform, using the same seven-video cohort and staggering the drops. Do not use three random posts per day as the success metric.
- Every clip should open with the exact text situation, show the conflict in the first frame, reveal a choice or reply, and end with one comment keyword.
- Measure each post at 24 and 72 hours: views, retention/engaged views, profile visits, comments, shares, bio/link clicks, and site signups. Views alone are not the bottleneck.

## Tracked bio destinations

- TikTok: `https://gula-agents2.vercel.app/tiktok?utm_source=tiktok&utm_medium=organic_social&utm_campaign=seven_day_test`
- Instagram: `https://gula-agents2.vercel.app/tiktok?utm_source=instagram&utm_medium=organic_social&utm_campaign=seven_day_test`
- YouTube: `https://gula-agents2.vercel.app/tiktok?utm_source=youtube&utm_medium=organic_social&utm_campaign=seven_day_test`

Instagram's website field must be set in the mobile app. TikTok's current web editor exposes no website field for this account; use the app if the account is eligible, otherwise keep the short domain in the bio.

## 2026-08-25 instrumentation update

- The local admin overview now counts only AI-output actions (`generate_reply`, `generate_opener`, `generate_revive`, `decode`, and `strategy_chat`), not page views or admin browsing.
- The live activity dashboard and people feed now exclude authenticated admin traffic and anonymous visits caused by `/admin` referrers, while keeping external page views and UTM sources.
- The funnel now uses a consistent all-time sequence: registered users -> activated users -> paid users. Empty denominators render as `N/A` instead of impossible percentages.
- The checked-in Supabase setup and migration now include the runtime fields used by attribution metadata, Stripe subscriptions, entitlements, strategy logs, V2 runs, copy analytics, feature flags, and admin audit events.
- The social landing-page handoff now auto-starts the first reply after a visitor taps an example; free-reply quota checks count only `generate_reply` events, not page views.
- The fixes build successfully locally, but the production URL still serves the older build. The connected Vercel account has no `gula-agents2` project, and the connected GitHub session cannot access repository settings/write deployment changes.
