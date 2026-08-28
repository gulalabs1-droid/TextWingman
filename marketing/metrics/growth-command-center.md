# Growth Command Center

The admin Growth OS at `/admin/growth` is the operating dashboard for acquisition and revenue conversion.

## One-time setup

Run `supabase/migrations/005_growth_command_center.sql` in the production Supabase SQL editor. The migration creates:

- `marketing_creatives` for the canonical `video_id`, hook, avatar, CTA, format, and status.
- `social_creative_metrics` for dated native platform snapshots.
- `marketing_leads` for real comment and DM follow-up.

The service-role admin API reads these tables. They are protected by RLS and have no public write path.

## Daily operating loop

1. Create one unique `video_id` for each creative and use the Campaign Links page to create the tracked destination.
2. Import the latest native totals for each video on TikTok, YouTube, and Instagram. Enter one snapshot per date; the leaderboard uses the newest snapshot per video/platform so cumulative totals are not double-counted.
3. Log genuine comments and DMs in the lead queue. Move the lead through `replied`, `clicked`, `tried`, `signed_up`, and `paid` only when that step is confirmed.
4. Review the bottleneck at 24 hours and 72 hours. Change one variable at a time: hook, format, CTA, or landing-page handoff.
5. Rank creative by paid customers per 1,000 views, then by site visits and successful replies when paid volume is too small to rank.

## Measurement rules

- `siteVisits` is calculated from first-party events carrying the same `video_id`.
- `replies` is a successful product-output event, not a social comment.
- `signups` are attributed only when a first-party event carrying the `video_id` exists before registration.
- `paidConversions` includes users with a recorded successful subscription, even if the subscription later cancels. Current MRR includes only active or trialing subscriptions.
- Platform profile visits, bio clicks, views, likes, comments, shares, and saves are imported from the native platform dashboards because the app does not have authorized access to those private analytics APIs.
- Missing data is displayed as `--` and produces a measurement-gap recommendation instead of a fabricated conversion rate.
