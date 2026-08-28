# Social Distribution Audit - 2026-08-25

This audit combines native YouTube Studio analytics, public TikTok and Instagram profile data, and the first-party People/Live dashboards. Public profile counts are directional; retention and follower conversion must be read in each platform's native analytics.

## Current Read

### YouTube - @gulatextwingman

- Last 28 days shown in YouTube Studio: Jul 28-Aug 24, 2026.
- Views: 8,009; engaged views: 2,689; likes: 75; subscribers: +1.
- Discovery is working: 92.0% of Shorts views came from the Shorts feed and 6.7% from YouTube search.
- The main leak is the first-second decision: 33.5% stayed to watch and 66.5% swiped away.
- Strong visible topics: intense honesty (1.5K), the reply that avoids sounding desperate (1.1K), "we need to talk" with no context (1.1K), and late-night "you up?" (965).
- The channel has 77 videos and 3 subscribers. Reach is materially ahead of audience conversion.

### TikTok - @gulatextwingman

- Public profile: 0 followers and 51 likes.
- Best visible posts: "I'm bored" (305 views), "I don't know what I want" (302), "Hey" feels risky (283), "I had fun" (279), and the paragraph-panic reply (264).
- The winning pattern matches YouTube: a recognizable text situation in the opening frame, followed by a choice or concrete replacement reply.
- The current captions are clear, but the profile is not converting reach into followers. Keep one keyword comment CTA and make the bio destination the tracked `/tiktok` page.

### Instagram - @textwingmangula

- Public profile after today's uploads: 56 posts, 0 followers, 1 following.
- Four new Reels were published and verified on the profile:
  - [2 AM ex text](https://www.instagram.com/textwingmangula/reel/Dcd2KC4JaRc/) - keyword `EX`
  - [liked story, ignored text](https://www.instagram.com/textwingmangula/reel/Dcd2g7iJUyN/) - keyword `STORY`
  - [slow reply](https://www.instagram.com/textwingmangula/reel/Dcd2mYIpdLL/) - keyword `SLOW`
  - [emotional essay recovery](https://www.instagram.com/textwingmangula/reel/Dcd2vuFpiuS/) - keyword `ESSAY`
- A deeper refresh exposed older ex and slow-reply premises that were not in the first lazy-loaded grid. The new files/captions are different, but `EX` and `SLOW` are topic overlaps; the `STORY` and `ESSAY` Reels are cleaner tests. Do not delete the overlaps without an explicit cleanup decision.

## First-Party Funnel

- Current People dashboard: 16 people in the selected range, 3 new this week, 0 registered, 0 activated, 0 replies.
- Source mix: direct 8, YouTube 4, Facebook 2, site referrer 1, Bing 1.
- Current Live dashboard is still contaminated by owner/admin page views in production: 14 raw page views and 4 raw unique visitors today, 0 signups, and all 14 raw actions are page views. Treat the net external figure as lower than the raw number until the local admin filtering patch is deployed.
- This confirms the bottleneck is not only reach. The journey from profile click to an actual product action is still empty in first-party data.

## Decision

Use YouTube as the primary discovery channel, TikTok as the creative-testing channel, and Instagram as the proof library. Do not use three random posts per day as the success metric. For the next seven days, run the same daily cohort at one morning slot and one evening slot on each platform, with at least six hours between posts. Use the third slot only when it is a genuinely new winner/variation.

Every video should follow this structure:

1. Exact text conflict in frame one.
2. Human reaction or a surprising interpretation.
3. Two or three reply choices, with the winning reply revealed.
4. One keyword comment CTA.
5. A two-second Gula Text Wingman CTA after the viewer already wants the answer.

Measure at 24 and 72 hours: views, engaged/stayed-to-watch rate, profile visits, comments, shares, link clicks, and signups. A view is not a win unless it produces a profile visit or a product action.

## Next HeyGen Batch

Generate three distinct portrait tests after HeyGen is reauthenticated. Do not reuse the ex or slow-reply premise in this batch.

### 1. Calendar Dodge

Hook: `THEY WON'T NAME A DAY. STOP TREATING IT LIKE A PLAN.` Show "I'll let you know," eliminate the vague reply, and reveal: `Cool - hit me when you have a day in mind.` Keyword: `KNOW`.

### 2. Dating-App Interview

Hook: `STOP ANSWERING "WHAT ARE YOU LOOKING FOR?" LIKE A JOB INTERVIEW.` Show three answers, reject the over-eager and evasive options, and reveal a clear, curious answer. Keyword: `INTERVIEW`.

### 3. Emotional Essay Recovery

Hook: `IF YOU NEED SIX PARAGRAPHS TO EXPLAIN THE TEXT, PAUSE.` Show the anxious apology beside a shorter human reply. Keyword: `ESSAY`.

Change presenter and voice for each. Keep each 12-18 seconds, portrait 9:16, creator-style framing, large captions, and no product mention before the reveal. The videos must be labeled as AI-generated on Instagram.

## Access Blocker

The HeyGen connector returned an OAuth reauthentication-required error, and the active HeyGen browser tab is at the sign-in screen. Fastlane is also at its sign-in screen. New renders can resume as soon as either account is reauthenticated; the local downloaded library remains available for distribution in the meantime.

## Live Checkpoint - 2026-08-27

This checkpoint was captured from the signed-in in-app browser and local media inventory. It distinguishes public results from staged work; staged uploads have not been counted as published.

### Platform read

- YouTube `@gulatextwingman`: 3 subscribers (+1 in the last 28 days), 8.3K views and 8.6 watch hours in the last 28 days. The strongest current 48-hour Short is `When They Come Back Three Days Later, Say This` at 248 views; the dashboard also shows `Not Looking For Anything Serious...` at 651 views, `Sorry, I Forgot To Reply...` at 8, `They Won't Name A Day...` at 66, and the latest random-selfie Short at 0 during its first 2 hours 33 minutes. Reach exists, but subscriber conversion is still weak.
- TikTok `@gulatextwingman`: 2.3K views in the last 7 days (+51.9%), 4 profile views (+2), 26 likes (+12), and 0 shares/comments. Discovery is 97.2% For You and 2.8% Search. The public account remains at 0 followers, with the latest visible posts on Aug 22. The gap is profile action and conversation, not merely distribution.
- Instagram `@textwingmangula`: 56 public posts, 0 followers, 1 following. The account has a library, but no meaningful audience signal yet. Two new Reels are staged below; they are not public until the final Share action.

### Gula admin read

- `/admin/people`: in the selected 7-day window, 5 new people this week versus 13 last week, 18 total people, 18 anonymous, 0 registered, 0 activated, and 0% generated-reply rate. Cumulative source counts shown are direct 9, YouTube 4, Bing 2, Facebook 2, and the site referrer 1. The rows are predominantly desktop traffic from the US, with no customer reply behavior.
- `/admin2`: 1 online in each 5-minute, 15-minute, and 1-hour window; 4 page views; 2 unique visitors; 0 signups; 4 actions; 0 copies; 0 upgrades/cancels. The 7-event stream is dominated by owner/admin page views plus crawler-like traffic, so raw activity is not customer traction.
- `/admin/funnel` and `/admin` disagree materially. Funnel shows 0 signups in 30 days, 4 activated, 14 free, and 1 paid with an impossible-looking 350% conversion; overview shows 6 total users, 33 generations in 7 days, 2 activated, 1 paid, $16.99 MRR, and 6.67% overall conversion. Do not optimize against these funnel percentages until event definitions and owner/bot filtering are unified.

### Fresh asset and queue status

- Fastlane asset: `/Users/ct/Downloads/fastlane-ugc-make-me-laugh.mp4`, 720x1280, 8.06 seconds, 3.6 MB. It uses a fresh AI-generated creator portrait and a short “Make me laugh” delivery. Fastlane has 56 credits remaining after this single 8-second render, so more UGC renders should wait for a deliberate concept choice or more credits.
- HeyGen asset: `/Users/ct/Downloads/HeyGen-They-Said-Youre-Trouble.mp4`, 1080x1920, 16.17 seconds, 6.5 MB. It is a distinct six-scene “You're trouble” choice/reveal short and was visually checked against the current public catalog.
- TikTok: both fresh assets are staged in separate composers with non-duplicate captions, brand disclosure, AI-generated disclosure, and clean content checks. The Fastlane draft is set for Aug 27 at 3:05 PM; the HeyGen draft is set for Aug 27 at 3:10 PM. The Schedule buttons remain unclicked.
- YouTube: both fresh assets are uploaded to the correct `gula textwingman` Studio channel, have title/description metadata, “not made for kids,” AI-use disclosure, and no copyright issues. They are staged for Aug 28 at 8:30 AM and 10:00 AM local time. The Schedule buttons remain unclicked.
- Instagram: both fresh assets are staged as Reels with platform-specific captions and AI labels. The Share buttons remain unclicked.

### Updated access status

Fastlane is authenticated and produced one fresh UGC render. HeyGen is authenticated; the “You're Trouble” render completed, while the separate voice-note render failed and was not counted or staged. The next measurement window begins only after the staged posts are actually published/scheduled.
