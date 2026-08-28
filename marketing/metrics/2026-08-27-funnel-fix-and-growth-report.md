# Text Wingman Funnel Repair and Growth Report

**Checkpoint:** 2026-08-27 (America/New_York)

## Executive diagnosis

The current bottleneck is not simply posting volume. The platforms are giving the account some discovery, but very little intent is turning into profile visits, site sessions, replies, or signups. The most actionable live signal is TikTok: approximately 2,300 views in the last 7 days produced 4 profile visits, 26 likes, and zero comments or shares. That is about a **0.17% view-to-profile-visit rate**. YouTube has more reach, but the account still has only 3 subscribers from roughly 8.3K recent views. Instagram has 56 posts and 0 followers, so it is currently a proof library rather than a discovery engine.

This means we should not scale random volume yet. We should scale a measured creative loop: a recognizable texting situation in the first frame, an immediate choice or conflict, a useful reply reveal, and one clear next action. The CTA should move viewers into the tracked `/tiktok` landing page, not ask them to remember a brand name.

## Live baseline before the code repair

| Surface | Observed baseline | Meaning |
| --- | --- | --- |
| YouTube | 81 public videos, 3 subscribers; about 8.3K views and 8.6 watch hours in the recent Studio window; 92% Shorts feed, 6.7% Search, 33.5% stayed vs 66.5% swiped | Discovery exists, but the first-frame hold and subscription conversion are weak. The best visible topics were concrete scenarios such as “What Are You Looking For,” “Too Intense,” and “Maybe.” |
| TikTok | 0 followers, 57 likes; about 2.3K views in 7d, 4 profile views, 26 likes, 0 comments, 0 shares; 97.2% For You and 2.8% Search | TikTok is distributing impressions, but the creative is not creating enough curiosity or profile intent. |
| Instagram | 56 posts, 0 followers; public profile analytics were not dependable in the browser audit | Treat as a credibility and retargeting surface until profile visits and follows start moving. |
| Admin people | Conflicting historical views: one page showed 5 new people in the selected week, 18 total and 18 anonymous; another showed 6 registered profiles and one paid account | The disagreement came from different tables, time windows, anonymous keys, and definitions. These numbers should not be used for growth decisions until the new deployment is live. |
| Admin live/funnel | `/admin2` showed 4 page views, 2 unique visitors, 0 signups and 4 actions; the funnel showed impossible conversion math such as 350% in an older view | Owner/admin inspection and crawler events were contaminating the same counters, while the funnel mixed all-time and period denominators. |

## Root causes and fixes

### 1. The admin funnel was not measuring one journey

The old overview, people feed, funnel page, and live page each counted different populations. Some counted profiles, some counted raw usage rows, some treated any non-page event as a product action, and some used a fingerprint made only from user-agent plus language. This created both false duplication and impossible percentages.

The project now has one canonical funnel in `lib/admin-funnel.ts` and one API at `/api/admin/funnel?days=30`. All dashboards use the same stages and exclude admin routes, known admin accounts, and crawler-like agents. Rates return an em dash when the denominator is absent instead of manufacturing a percentage.

### 2. Meaningful client events were not reaching the first-party database

The site sent many events only to Vercel Analytics. The database saw page views and server-side usage rows, but not reliably the steps between a social click and a signup. `lib/analytics.ts`, `components/PageViewTracker.tsx`, and `/api/track` now persist canonical events with the page, referrer, UTM values, visitor ID, session ID, and safe event properties.

### 3. Anonymous visitors were collapsing together

The previous anonymous identity was effectively `user-agent + language`, so different people could look like one visitor. The client now creates a first-party `tw_vid` cookie plus local/session storage IDs. Server rate limiting and analytics use that identity, with fingerprint/IP fallback for old traffic. Historical anonymous counts cannot be perfectly reconstructed; the clean comparison window starts after deployment.

### 4. The DM funnel had no measurable handoff

The product can generate a reply, but the old dashboard could not reliably distinguish a request, a successful output, a copy, or “I sent this.” The canonical events now support this path:

`video_view -> profile_visit -> tracked_bio_click -> landing_session -> composer_start -> reply_request -> reply_success -> reply_copy -> reply_sent -> signup -> paid`

The social-platform DM itself remains manual because there is no safe, authorized cross-platform DM API in this app. The right operating loop is to use one comment keyword, reply to real comments, and direct interested people to the platform-specific bio URL. Do not mass-DM cold users.

## Canonical definitions after deployment

- **External visitor:** unique registered user, first-party visitor ID, or legacy fingerprint/IP fallback, after internal/bot filtering.
- **Landing session:** a unique session that views `/` or `/tiktok`, or emits `landing_view`.
- **Composer start:** a unique session that starts the composer, selects an example, or begins screenshot input.
- **Reply request:** a `generate_reply` server request or an explicitly named `reply_request` event.
- **Reply success:** a rendered `reply_success`, `decode`, `generate_opener`, `generate_revive`, or `strategy_chat` result.
- **Reply copy/sent:** the user copied a result or marked it as sent in the app.
- **Signup:** a non-admin profile created in the selected period.
- **Paid:** a non-admin active or trialing subscription.

## What was changed in the project

- Added canonical event aliases and stage classifiers in `lib/analytics-events.ts`.
- Added durable request identity in `lib/request-identity.ts` and wired it into generation, usage, decode, opener, revive, and strategy routes.
- Made client events first-party database events, not only Vercel events.
- Added `/api/admin/funnel` and rebuilt the overview, funnel, people, and live-admin calculations around the same definitions.
- Replaced the people endpoint's dependency on legacy `admin_people` views with direct event aggregation that understands visitor/session IDs.
- Added `supabase/migrations/004_first_party_funnel_indexes.sql` for visitor, session, and event indexes.
- Added signup-start, signup-complete, sign-in, reply-success, copy, and sent-stage instrumentation.

The code is typechecked locally. It still needs the Supabase migration and production deployment before the live admin pages will show the repaired data.

## The next 7 days

### Distribution cadence

Use one strong morning post and one strong evening post per platform, using the same creative cohort on TikTok, YouTube Shorts, and Instagram. Do not treat three random posts per day as the success metric. A third post is justified only when it has a different job: scenario test, reply reveal, or direct-response CTA.

Use the same video on all three platforms so the creative comparison is valid. Add a unique `video_id` and platform-specific UTM bio link. Schedule YouTube and TikTok; post Instagram manually when needed. Leave enough time to answer comments rather than flooding the account.

### Creative rules

- Put the exact text situation in frame one: “They said ‘maybe’,” “They came back after three days,” or “You sent a paragraph and now regret it.”
- Show the bad/common response before naming the product. The viewer should recognize themselves before hearing “Gula Text Wingman.”
- Reveal one reply with a reason it works, not three generic AI options.
- End with one CTA: “Comment `REPLY` if you want the exact text, then use the link in bio.” Keep the keyword and destination consistent for the whole test.
- Build lookalikes from the strongest YouTube angles rather than making broad “AI dating coach” ads. The winner-like topics are concrete, emotionally familiar, and easy to judge in one second.
- Keep the presenter or avatar secondary to the text exchange. A generic avatar introduction is a weak hook; use the face as a reaction or payoff.

### DM and site handoff

1. Pin a comment that repeats the single keyword and says the tool is free to try.
2. Reply to every genuine comment within the first day with a short, human answer and the profile/bio route.
3. Use the platform-specific tracked bio links already defined in `lib/site.ts`.
4. Make the first landing-page action the paste box or example chip. Do not send traffic to a social page that makes the viewer hunt for the product.
5. Ask for signup only after the visitor sees a useful reply. The free result is the activation event; the account is the retention and paid-conversion step.

## Decision thresholds

Review each post at 24 and 72 hours. Record views, stayed/engaged view rate, average watch time or completion, profile visits, comments, shares, bio/link clicks, landing sessions, composer starts, reply requests, reply successes, copies/sends, signups, and paid conversions.

For the first 7-day test, use these directional thresholds:

- TikTok view-to-profile-visit: move from 0.17% toward at least 0.5%, then 1%+ before increasing volume.
- Platform profile-to-bio click: target at least 10% of profile visitors; if this is low, fix the profile promise and pinned content before making more videos.
- Landing session to composer start: target 60%+.
- Composer start to reply request: target 50%+.
- Reply request to reply success: target 90%+; any large failure means product latency or an API issue, not a marketing issue.
- Reply success to copy/sent: target 30%+ initially.
- Qualified reply-success visitor to signup: target 5%+ initially; optimize the signup prompt after the visitor has seen value.

Do not call a creative a winner from views alone. A winner creates profile visits, tracked landing sessions, and replies. A high-view video with no downstream action is an awareness asset, not a customer-acquisition winner.

## Immediate launch checklist

1. Run `supabase/migrations/004_first_party_funnel_indexes.sql` in the production Supabase project.
2. Deploy the current Windsurf project so `/api/track`, `/api/admin/funnel`, and the identity changes are live.
3. Visit the public homepage and `/tiktok` once from a non-admin browser, submit an example, copy the result, and confirm the events appear in `/admin/funnel` and `/admin2`.
4. Start a fresh 7-day reporting window; label all new videos with `video_id`, hook, avatar, CTA, and platform.
5. After 24 and 72 hours, keep the top two downstream performers, rewrite the bottom two hooks, and only then expand the batch.

