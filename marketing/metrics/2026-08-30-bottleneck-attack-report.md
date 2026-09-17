# Growth Bottleneck Attack Report

**Audit date:** 2026-08-30 (America/New_York)  
**Product:** Gula Text Wingman  
**Question:** What is blocking distribution from becoming customers, and what should we do next?

## Executive Decision

Do not respond to the current results by adding more random posts or changing pricing again. The strongest signal is that YouTube can distribute a specific texting problem, but the funnel is not yet converting attention into measurable product use. The immediate operating order is:

1. Reconcile Stripe and make it the revenue source of truth.
2. Make one normal, non-admin customer journey measurable from social click through reply, signup, and checkout.
3. Increase profile intent with stronger first-frame conflict and a visible product demonstration.
4. Run a controlled seven-day cohort, then scale only the creative patterns that produce downstream actions.

## Current Baseline

### YouTube Shorts

- 8,414 views in the last 28 days, up more than 999% versus the previous period.
- 8.7 watch hours in the last 28 days.
- 3 total subscribers, with only +1 in the last 28 days.
- 1,311 views in the last 48 hours.
- `The Reply That Revives a Dead Chat`: approximately 1,206 views, 98.3% Shorts-feed reach, 46.3% stayed to watch, 53.7% swiped away, 569 engaged views, and approximately 7 seconds average view duration.
- Other strong themes are concrete situations: intense honesty, `We need to talk`, `You up?`, and `I had fun` sounding like goodbye.

**Read:** YouTube is the current discovery leader. The channel has a repeatable premise signal, but the hold rate is not yet a breakout signal and subscriber conversion is weak. This is awareness, not validated customer acquisition.

### TikTok

- 1.1K video views in the last 7 days, down 58.6% versus the prior seven days.
- 1 profile view, down 80% versus the prior period.
- 17 likes, 0 comments, 0 shares, and 0 followers in the current native read.
- 92.4% of traffic came from For You and 7.6% from Search.
- Search demand includes `bumble opening messages`, `non cringe ways to double text`, and how to respond to `thinking about you` or `thanks`.
- Top recent posts are recognizable prompts: `I don't know what I want` (329 lifetime views), `I'm bored` (320), and `You owe me a coffee` (165).
- Audience is 92% male, 92.7% ages 18-34, and 95.1% U.S.

**Read:** TikTok is distributing clips, but the account is not creating profile intent. The audience and search terms are useful; the problem is the bridge from the first-second hook to the profile promise.

### Instagram

- Public profile: 60 posts, 0 followers, 1 following.
- The latest four fresh Reels were publicly visible, but had 0, 1, 0, and 1 likes respectively and no meaningful comment activity.
- The public web surface does not expose reliable native Insights. Reach, profile visits, saves, shares, and follows must be read in the Instagram app.

**Read:** Instagram is currently a proof library, not a discovery channel. More posting alone will not fix it until the profile, creative opening, and manual engagement create a reason to follow.

### First-party funnel

Fresh Growth OS and Funnel views show:

- 19 external visitors and 19 landing sessions in the last 30 days.
- 14 external visitors in the last 7 days.
- 2 composer starts, 3 recorded requests, 0 recorded reply successes, 0 signups, and 0 paid users in the external acquisition funnel.
- Landing to composer: 2/19, or 10.5%.
- Composer to recorded success: 0/2.
- Top source in the current 30-day view: YouTube with 10 visitors; direct 4; Facebook 3; other sources 1 each.
- No imported platform metric rows and no creative with a `video_id` reaching the site, so the creative revenue leaderboard is currently blind.
- UTM coverage is only 40.5%; 31 events are missing session IDs; 18 sources are unknown.
- The clean browser test generated three replies and successfully copied one, but the event was excluded or did not appear in the external success count. This proves the visible UI can work; it does not prove production telemetry is reliable.

**Read:** The largest verified acquisition drop is landing session to composer start. The largest *measurement* risk is composer start to reply success. Do not use the zero-success number to conclude the generator is broken until a normal customer-like session proves the event handoff.

### Revenue and admin truth

- Billing shows 2 app subscription rows: 1 active and 1 canceled.
- Stripe currently reports 0 active subscriptions and the app flags 1 stale active row.
- Growth OS reports `$43.29` MRR from app subscription rows, while the classic admin reports `$13.91/mo` and the billing view says the active app row is stale.
- The account/user tables include owner, admin, beta, and old low-activity accounts that pollute classic totals.

**Read:** `$43.29` MRR is not verified cash revenue. Stripe must be the source of truth before any growth report claims paid conversion.

## Bottleneck Map

### P0: Revenue and measurement are not trustworthy

The current admin pages disagree about users, activation, MRR, and subscriptions. The product flow also sends important client events asynchronously, while the server-side `generate_reply` record does not carry the full session and attribution context. This makes it impossible to know whether content, product activation, or tracking is responsible for a zero-success funnel.

**Fix now:**

- Reconcile the stale app subscription against Stripe and remove or mark it stale; never count it as active revenue.
- Make Stripe webhook state the billing authority; display app-recorded state separately when it differs.
- Make `/admin`, `/admin/funnel`, and `/admin/growth` consume one canonical funnel and one canonical billing summary.
- Exclude owner/admin/beta/probe activity from customer conversion metrics, but show it in a separate internal activity panel.
- Persist `visitor_id`, `session_id`, `page`, `referrer`, all UTM values, and `video_id` on the server-side generation record.
- Guarantee `reply_success`, `reply_copy`, `reply_sent`, and signup CTA events with awaited requests or `navigator.sendBeacon` before navigation.
- Add a visible `last event received`, event error count, and deployment version to Growth OS.

### P0: The activation handoff is too weak

The landing page is serviceable: it leads with paste-and-generate and offers a one-tap demo. But a visitor can get a reply and leave after copying it. The post-result save/signup step is not yet the dominant next action, and the current external data shows only 2 composer starts from 19 sessions.

**Fix now:**

- Keep the first free reply above the fold and show the result without forcing a detour.
- After the result, put a primary inline CTA directly beside it: `Save this reply and keep the thread free`.
- Keep a secondary CTA: `Try another text`.
- Ask for a free account after value is delivered, with no card; preserve the original UTM and `video_id` through signup.
- Keep `Gula Text Wingman` and the actual reply visible in the result so the product is remembered, not just copied.
- Add a compact proof line near the result: `Paste another message when they reply.`
- Test on a 390px viewport: the reply, copy button, save CTA, and next-text CTA should appear without an unexpected scroll or hidden action.

### P1: Social reach is not becoming profile intent

YouTube has reach, TikTok has FYP distribution, and Instagram has almost no audience signal. The current content often reveals a useful reply, but it does not consistently make the viewer feel they must visit the profile now.

**Creative rule for the next cohort:**

1. Put the exact incoming text and the emotional conflict in frame one.
2. Show a human reaction or recognizable situation in the first half-second.
3. Show the bad reply and the better reply; make the contrast visually obvious.
4. Show the Gula Text Wingman result or paste box briefly after the useful reveal.
5. End with one action, not three: `Paste the text in the free tool in bio.`

Do not open with a logo, an AI-dating-coach introduction, an abstract lesson, or a generic rizz claim. Use Fastlane-style reaction/UGC for the opening and HeyGen for a concise explanation or reply reveal.

### P1: The test design is too volume-led

Three posts per day is not automatically better. With no reliable `video_id` attribution, higher volume creates more files but not more learning. For the next seven days, use two controlled posts per day per platform: one morning test and one late-afternoon/evening test, with the same video files cross-posted everywhere.

Recommended starting windows in Eastern Time:

- YouTube: 9:15 AM and 6:15 PM.
- TikTok: 9:15 AM and 4:15-5:15 PM, based on the current viewer activity signal.
- Instagram: 9:15 AM and 4:15-5:15 PM manually until native Insights are available.

Use a third post only when it is a genuinely different live-reply or a direct lookalike of a winner. Do not add more scheduled posts to the existing queue until the current future queue and attribution registry are reconciled.

## Seven-Day Attack Plan

### Today: restore truth

- Reconcile Stripe and the stale app subscription.
- Run one normal non-admin customer-like session in a clean browser with a real harmless text: landing -> paste -> generate -> copy -> signup CTA -> checkout start.
- Verify the exact event sequence in Growth OS and the database-backed admin view.
- If the UI generates and copies but `reply_success` remains absent, fix instrumentation before any new creative batch.
- Create a creative registry row for every video with `video_id`, platform, hook, avatar/source, CTA, file fingerprint, and publish time.
- Make every profile link unique by platform and cohort, for example:
  `https://gula-agents2.vercel.app/tiktok?utm_source=tiktok&utm_medium=organic_social&utm_campaign=aug30_test&utm_content=dead_chat_a&utm_term=profile`

### Days 1-3: run the controlled cohort

- Publish the same two videos on TikTok, YouTube Shorts, and Instagram.
- Use one dead-chat lookalike and one recognizable objection, not two generic product ads.
- Answer every genuine comment with the corresponding keyword within 24 hours; never use a keyword CTA that nobody will answer.
- Track at 24 hours: views, stayed/engaged rate, average percentage viewed, profile visits, comments, shares, saves, bio clicks, site sessions, composer starts, reply successes, copies, signups, checkout starts, and paid users.

### Days 4-7: promote winners, not volume

- Keep the strongest downstream creative in both daily slots.
- Make one variable change at a time: first frame, human reaction, reply wording, or CTA.
- Use YouTube as the primary discovery channel, TikTok as the creative-test channel, and Instagram as the proof/retargeting library.
- Manually recruit 10-20 qualified testers from viewers, commenters, and personal network. Give them a real-text use case and record each person in the lead queue.
- Do not wait for virality to find the first customer; direct tester conversations are the fastest way to discover whether the product delivers enough value to pay for.

## Decision Thresholds

- **Profile visits below 0.5% of views:** change the first frame and profile promise before producing more videos. TikTok is currently about 0.09% (1 profile visit from 1.1K views), so this is the immediate social-intent gap.
- **Profile visits but no bio clicks:** fix the profile field, link placement, and promise.
- **Site sessions but composer starts below 60%:** fix the landing handoff and mobile prominence.
- **Composer starts but no recorded successes:** fix instrumentation or generation reliability; do not blame the creative yet.
- **Recorded successes but no signup:** make the save/signup CTA more immediate and reduce friction.
- **Checkout starts but no payment:** only then test pricing, starting with the already-considered `$9.99/month` experiment.
- **High views with no downstream action:** label the video awareness-only; do not call it a customer-acquisition winner.

## Creative Batch Direction

The next batch should be six lookalikes around the proven concrete-text pattern, each with a unique `video_id`:

1. `They came back after three days: do not reward the disappearing act with a paragraph.`
2. `They ask what you want but avoid choosing a day.`
3. `You sent a paragraph and got "lol."`
4. `They say "we need to talk" and give no context.`
5. `They say "I'm bored" and expect you to carry the whole conversation.`
6. `They say "you're funny"; "thanks" quietly ends the momentum.`

Each should be 9-15 seconds, English only, vertical, captioned, and built around one specific incoming text. The product mention belongs after the useful reply, not before it.

## What We Should Not Do

- Do not add more random volume to compensate for weak profile intent.
- Do not change price while checkout demand is effectively unmeasured.
- Do not count the app's `$43.29` MRR as cash while Stripe says there are zero active subscriptions.
- Do not treat automated browser tests, admin activity, or internal probes as customers.
- Do not infer Instagram Insights from public likes alone.
- Do not call the 1.2K YouTube Short viral; call it a promising premise that deserves controlled lookalikes.

## CEO Scorecard

The next goal is not "three posts per day." It is one attributable customer journey per cohort:

`view -> profile visit -> bio click -> landing session -> composer start -> successful reply -> copy/save -> signup -> checkout -> paid`

Until every arrow is observable and one real person completes it, the highest-return work is measurement and activation. Once that path is proven, the same YouTube premise and TikTok search language can be scaled aggressively with confidence.
