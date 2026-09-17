# CEO Distribution Checkpoint

**Date:** 2026-08-28 (America/New_York)
**Goal:** run a clean creative cohort across TikTok, YouTube Shorts, and Instagram without confusing volume with traction.

## Cohort shipped

| Video ID | Local export | Shape | Length | Hook | CTA |
| --- | --- | --- | ---: | --- | --- |
| `aug28_heygen_stranger` | `/Users/ct/Downloads/Gula - Hey Stranger reaction_1080p_caption.mp4` | 1080x1920 | 11.0s | They came back with "hey stranger" | Comment `STRANGER` |
| `aug28_heygen_prove_it` | `/Users/ct/Downloads/Gula - Prove It TikTok Ad_1080p_caption.mp4` | 1080x1920 | 15.1s | They said "prove it" | Comment `PROVE` |
| `aug28_heygen_funny` | `/Users/ct/Downloads/Gula Text Wingman - You're Funny Roast_1080p_caption.mp4` | 1080x1920 | 9.0s | "You're funny" is where "thanks" kills the chat | Comment `FUNNY` |

All three exports have different SHA-256 fingerprints. An exact-file duplicate audit across `/Users/ct/Downloads` and `/Users/ct/Documents` found only older duplicate copies; none of these three fresh exports matched another local file.

## Platform placement

### Instagram

Three fresh Reels were confirmed shared on 2026-08-28:

- `aug28_heygen_prove_it`: published with the `PROVE` caption and AI label.
- `aug28_heygen_stranger`: published with the `STRANGER` caption and AI label.
- `aug28_heygen_funny`: published with the `FUNNY` caption and AI label.

### TikTok

The same three files are scheduled, not dumped back-to-back:

- `aug28_heygen_prove_it`: 2026-09-02 at 9:15 AM.
- `aug28_heygen_stranger`: 2026-09-02 at 7:15 PM.
- `aug28_heygen_funny`: 2026-09-03 at 9:15 AM.

TikTok confirmed video IDs `7679004478963485965`, `7679004868312386829`, and `7679005364477578510` in that order. The `FUNNY` scheduled row retained a small caption typo after the editor preview; do not repost it to fix copy. Correct it in-place if TikTok exposes edit, otherwise treat the existing scheduled post as the control and fix the next variant.

### YouTube Shorts

- `fastlane_guy`: confirmed scheduled for 2026-08-29 at 7:15 PM, `https://youtube.com/shorts/J4Hf2ZVMS7Y`.
- `aug28_heygen_prove_it`: confirmed scheduled for 2026-09-02 at 12:00 AM, `https://youtube.com/shorts/_eo6AmnWJeY`.

The HeyGen `STRANGER` draft was fully packaged, passed the visible copyright check, and is now confirmed scheduled for 2026-09-02 at 7:15 PM, `https://youtube.com/shorts/slgT5j3s6gQ`. The `FUNNY` file was not present in the queue audit, so it was uploaded as a new draft, packaged with the tracked description, passed the visible copyright check, and is now confirmed scheduled for 2026-09-03 at 9:15 AM, `https://youtube.com/shorts/s5gRuccLxT4`.

## Live analytics checkpoint

### First-party funnel (`/admin2`)

The current live read shows 11 external views, 6 external visitors, 3 product events, 3 reply requests, 0 reply successes, 3 copies, 0 signups, and 0 upgrades/cancels. Today’s tracked sources are `ceo_test` (6 visits), `youtube` (4), and `www.facebook.com` (1). Page counts are approximately `/tiktok` (9), `/app` (1), and `/pricing` (1).

The immediate bottleneck is activation, not reach: visitor-to-signup is 0%. A clean session accepted sample text, generated three replies, and responded to a copy action, but the admin count remained at 0 reply successes. The UI flow works; the deployed telemetry is not recording the expected product-success event, so treat the success metric as under-recorded until that instrumentation is reconciled.

The 1-day funnel currently reads 6 visitors -> 7 landing views -> 2 composer starts -> 0 reply successes -> 0 signups -> 0 paid users. Internal/bot events excluded: 205. This is sufficient to pause volume expansion and fix measurement plus activation before adding another random cohort.

### Native platform reads

- TikTok Studio, last 7 days: 1.2K video views (-48.3% versus the prior period), 3 profile views, 20 likes (-23.1%), no comments, and 0 shares. Traffic was 95.1% For You and 4.9% Search; Following, Personal profile, and Sound were 0%.
- YouTube public channel: 3 subscribers and 81 public videos. The strongest recent themes remain concrete text situations: intense honesty (~1.5K), `We Need To Talk` (~1.1K), the desperate-reply prevention Short (~1.1K), and `You Up?` (~968).
- Instagram public profile: 0 followers in the last verified public read. The three fresh Reels are published; the next useful Instagram read is Reel reach, profile visits, saves, shares, and follows, not post count.

### Decision for the next 24 hours

Do not increase volume until the staged YouTube action is confirmed and the clean funnel test records a successful reply. If the success event remains zero while copies continue, fix instrumentation or the generate/copy handoff first. If success is confirmed but signups remain zero, test the signup prompt and landing handoff; do not change pricing yet.

## Public baseline

- YouTube: 3 subscribers, 81 public videos. Recent strong themes remain concrete situations: intense honesty (~1.5K), "we need to talk" (~1.1K), the desperate-reply prevention Short (~1.1K), and "you up?" (~968).
- TikTok: 0 followers and 57 likes on the public profile. Prior native snapshot was about 1.2K views in 7d, 3 profile visits, and 95.1% For You traffic.
- Instagram: 0 followers on the public profile. The three new Reels are now published, so the next read should use Reel reach, profile visits, shares, saves, and follows rather than the post count.
- Site: public `/tiktok` uses the tracked platform landing route and the single promise: "Paste the text they sent. Get the read + reply in 10 seconds. Free."
- Billing: the live pricing page shows `$12.99/month` and `$99.99/year`; annual displays `$8.33/month` and `36%` savings. Keep pricing frozen for this test window.

## Operating rules

1. Use one morning and one evening post per platform per day for seven days; a third post is allowed only for a genuinely different live-reply or winning-hook variant.
2. Use the same file on all three platforms. Platform-specific titles/captions are fine, but the `video_id`, hook, and CTA must stay stable.
3. At 24 and 72 hours record views, stayed/engaged rate, average watch/completion, profile visits, comments, shares, saves, bio/site sessions, composer starts, reply successes, signups, and paid users.
4. Rank by profile visits, tracked sessions, replies, and signups per 1,000 views. A high-view post with no downstream action is awareness, not a customer-acquisition winner.
5. If profile visits remain below 0.5% of views, change the first frame or profile CTA. If site sessions arrive but composer starts do not, fix the landing handoff before producing more videos. If reply success is healthy but signups are zero, test the signup prompt, not the hook.
6. Reply manually to every genuine comment within the first day using its keyword. Do not mass-DM or create duplicate CTA comments.

## Next creative batch

Do not spend more generation credits until this cohort has a 24-hour read. The next batch should be lookalikes of the strongest downstream hook, not six unrelated ads: "they came back after three days," "they ask what you want but avoid a day," and "you sent a paragraph and got `lol`." Keep the exact text in frame one, show one bad reply and one replacement, and say "Gula Text Wingman" only after the viewer sees the useful move.
