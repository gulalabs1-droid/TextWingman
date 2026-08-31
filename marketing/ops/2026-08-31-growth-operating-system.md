# Gula Text Wingman Growth Operating System

**Audit date:** 2026-08-31 (America/New_York)
**Purpose:** Turn social reach into attributable product use, conversations, signups, and paid customers.

## Executive Decision

Do not run an all-day TikTok LIVE or add random posting volume. The current account has reach but almost no profile intent: TikTok shows about 5.9K views and 11 profile visits in 28 days (0.19%), 0 comments, and 0 shares. Instagram has 61 public posts but 0 followers. The immediate objective is to fix the bridge from attention to a real text submission, then use controlled content and direct outreach to find the first 10 active testers.

The operating order is:

1. Repair profile link plumbing and attribution.
2. Run a seven-day two-post cohort with the same videos on TikTok, YouTube Shorts, and Instagram.
3. Reply to every genuine comment and turn useful comments into the next video.
4. Seed distribution through creator collaborations and helpful community replies.
5. Apply for LIVE access, then run one attended 20-30 minute clinic rather than an unattended all-day stream.

## Current Signal

### TikTok

- Last 28 days: 5.9K video views, 11 profile views, 57 likes, 0 comments, 0 shares.
- Traffic: 84.4% For You and 15.6% Search.
- Profile visit rate: 11 / 5,900 = 0.19%.
- Search language already reaching the account includes:
  - how to react when she replies after a long time
  - Tinder conversation starters
  - good rizz lines when someone says WYF
  - what to say when she says tell me something about you
- Current profile has 0 followers and no dedicated website field exposed.
- Scheduled feed was already populated through at least September 4. Reconcile that queue before adding more posts.

### Instagram

- Public profile: 61 posts, 0 followers, 1 following.
- The bio contains a URL as text, but the dedicated Website field is blank in the desktop editor. Instagram says link editing is mobile-only.
- A Broadcast Channel is not exposed in the current desktop inbox. It is a retention tool, not an acquisition fix for a profile with 0 followers.

### First-party funnel

- Current external traffic has reached the site, but there are no verified external reply successes or paid conversions.
- The Growth OS has creative and lead tracking locally, but social metric imports and `video_id` coverage must be maintained for downstream attribution.
- Stripe remains the revenue source of truth. Do not label app-recorded MRR as cash revenue when Stripe disagrees.

## The Agent System

Every agent produces a draft or a review queue. No agent should mass-post, mass-comment, or auto-DM.

### 1. TikTok Search Agent

Each morning, open Creator Search Insights and capture the top relevant search phrase plus one content-gap phrase. Create two briefs using the exact phrase in the first frame, spoken line, and caption. Prioritize the current account language, not generic "rizz":

- "How to react when she replies after a long time"
- "Tinder conversation starters that do not sound forced"
- "What to say when she says maybe"
- "What to say when she says tell me something about you"
- "Texting message editing: fix this needy reply"

Output fields: date, phrase, content gap, audience location, hook, incoming text, bad reply, better reply, Gula proof moment, CTA, `video_id`, and publish slots.

### 2. Comment-to-Video Agent

At least once per day, collect genuine TikTok, YouTube, and Instagram comments. Redact names, handles, phone numbers, and identifying details. Cluster them by situation, then produce one next-video brief for the most repeated question. Keep the commenter wording as the hook when it is safe and useful. The creator approves the final script.

### 3. Instagram Comment Agent

For an eligible Professional account, use Meta-approved comment or Live comment webhooks only after the account and permissions are configured. The agent may draft a reply and put it in an approval queue. It must never send unsolicited bulk DMs or pretend to be the creator. Log the comment, response status, profile visit, tracked site visit, and signup when attribution is available.

### 4. Community Agent

Find relevant questions in dating and texting communities. Draft useful answers first and attach the Gula link only where rules allow it and the answer genuinely calls for a tool. Keep a daily review queue of ten high-quality replies, not ten copy-pasted promotions. Never automate link-spam, vote manipulation, or unsolicited direct messages.

### 5. Live Copilot

After LIVE access is approved, the copilot can read submitted text, redact personal information, generate three reply options, and display them in a private creator overlay. The creator chooses the answer and says it on stream. The stream format:

1. Viewer submits an anonymized text.
2. Host reads the situation.
3. Copilot shows read, bad reply, and better reply.
4. Host explains why the better reply works.
5. Viewer gets the free tool CTA.

Run one 20-30 minute attended clinic first. Only move to two sessions per week if viewers submit texts and the stream produces profile visits or site sessions.

### 6. Broadcast Channel

Do not create one yet. Once Instagram has a real engaged audience and exposes the feature, use it for daily prompts, polls, reply examples, and reminders to submit a text. It is for retention and repeat engagement, not a substitute for discovery.

## Seven-Day Test

Use the same two source videos on all three platforms so platform response is comparable. Stagger rather than dump posts together.

| Slot | YouTube Shorts | TikTok | Instagram |
| --- | --- | --- | --- |
| Morning | 9:15 AM ET | 9:15 AM ET | 9:15 AM ET |
| Evening | 6:15 PM ET | 4:15-5:15 PM ET | 4:15-5:15 PM ET |

Every video must contain:

1. Exact incoming text and conflict in frame one.
2. Recognizable human reaction or situation immediately.
3. Bad reply versus better reply.
4. A brief real Gula Text Wingman result or paste-box moment.
5. One CTA: "Paste the text in the free tool in bio."

Use Fastlane-style reaction openings and HeyGen for the concise explanation or reply reveal. Do not begin with a logo, an abstract coach introduction, or a generic product pitch.

## Measurement Rules

At 24 and 72 hours, record the same fields for every `video_id`:

- Views, average percentage viewed, stayed-to-watch or equivalent, likes, comments, shares, saves.
- Profile visits, bio clicks, tracked site sessions, composer starts, reply successes, copies, signups, checkout starts, paid users.

Decision rules:

- Profile visits below 0.5% of views: rewrite the first frame, proof moment, or profile promise before making more variants.
- Profile visits but no bio clicks: fix the dedicated profile link and CTA.
- Site sessions but no composer starts: simplify the landing handoff.
- Composer starts but no reply success: fix event tracking or generation reliability before judging the creative.
- Reply successes but no signup: make save/signup the primary next action.
- Checkout starts but no payment: only then test price.

## Immediate Action Queue

### Safe to prepare now

- Keep the tracked bio links generated in `lib/site.ts` and use one `video_id` per creative.
- Build the first five search-led scripts above.
- Create a creative registry row before each cross-platform upload.
- Prepare a manual comment and community review queue.
- Prepare the Live overlay and clinic script without broadcasting.

### Needs account-owner confirmation at the exact action

- Submit TikTok's LIVE Studio access application.
- Switch TikTok from Personal to Business if a profile website link is worth giving up the general music library for.
- Edit Instagram's Website field in the mobile app.
- Publish comments, send replies, create a Broadcast Channel, or start a LIVE.
- Install and run OBS or TikTok LIVE Studio.

## Success Target

The target is not a viral view count. It is one observable customer journey per cohort:

`view -> profile visit -> bio click -> landing session -> composer start -> reply success -> copy/save -> signup -> checkout -> paid`

Scale only the creative and distribution paths that move that chain.

