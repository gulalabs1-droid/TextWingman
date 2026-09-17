# Link Leak Fix

**Audit date:** 2026-09-01 (America/New_York)
**Project:** Gula Text Wingman

> **Superseded:** This is a historical snapshot of the intended/observed state on Sep 1. The fresh Sep 4 browser audit is authoritative because Instagram and TikTok did not retain the desktop bio edits. See [2026-09-04-profile-click-fix.md](2026-09-04-profile-click-fix.md) for the current state and canonical URLs.

## Changes applied

- TikTok `@gulatextwingman` bio now includes the compact tracked destination: `gula-agents2.vercel.app/tiktok?src=tiktok`.
- Instagram `@textwingmangula` display name is now `Gula Text Wingman | Texting Coach`; its bio identifies Gula Text Wingman and includes the tracked destination: `https://gula-agents2.vercel.app/tiktok?src=instagram`.
- YouTube `@gulatextwingman` descriptions were updated for the scheduled Sep 2-7 Shorts, the Sep 1 public Short, and the highest-view Dead Chat Short. Raw URLs were replaced with: `Try Gula Text Wingman free. Tap the first link on my channel.`
- The YouTube channel profile already has the first-link destination with YouTube attribution and remains the primary clickable path.

## Verification

- TikTok public profile shows the updated bio.
- Instagram public profile shows the updated bio.
- The social landing URLs return HTTP 200 and preserve `src` / UTM parameters through the landing flow.
- The landing flow generated three replies and exposed the save/signup CTA in a clean-browser test.

## Remaining limitation

- TikTok did not expose a native website field because Business Verification is not complete. The compact URL is in the public bio as a fallback; complete TikTok business verification later to unlock the native website field.
- Instagram desktop explicitly locks the Website field to mobile. The tracked URL is in the bio; the native Instagram website field still requires the Instagram mobile app.
- YouTube Shorts descriptions should not rely on raw URLs because YouTube makes those URLs non-clickable; future descriptions must use the channel-link CTA.
