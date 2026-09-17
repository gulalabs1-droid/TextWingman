# Profile Click Fix - 2026-09-04

## Verified update - 2026-09-05

- Instagram native Website link was added through the mobile app and verified on the public profile. The canonical Instagram URL below is now a real clickable link.
- Instagram bio was saved through the in-app browser and verified on the public profile: `Paste the text they sent. Get the read + 3 replies in 10 seconds. Try it free below.` The old raw URL is removed.
- TikTok web editor still has no Website field. Opening Business verification leads to document-verification onboarding with a Terms of Service checkbox and Get started button. No application or agreement was submitted. This does not establish that verification will guarantee Website eligibility.
- iPhone Mirroring is locked again at the Mac-login screen. TikTok mobile Website eligibility remains unverified pending reconnection.
- Attribution correction: a shared bio link should keep `utm_content=profile`. A per-video `utm_content=tw-###` identifies a creative only when the visitor follows that specific link; shared bio traffic cannot reliably be assigned to individual videos.

The sections below retain the Sep 4 snapshot. This update supersedes the Instagram blocker and remaining Instagram action.

## Scope

Fresh verification of the live social profiles and the tracked landing URL. The goal is to stop losing visitors between a profile view and the first site session without claiming a profile edit succeeded when the platform rejected it.

## Live results

### YouTube - fixed

The correct channel, `@gulatextwingman`, now has this published primary profile link:

```text
https://gula-agents2.vercel.app/tiktok?utm_source=youtube&utm_medium=organic_social&utm_campaign=profile_bio&utm_content=profile
```

YouTube Studio showed `Changes published` and `All changes saved`. A fresh server-side request to the public channel confirmed the canonical `profile_bio` URL is present and the older `organic` profile URL is no longer the active target.

### TikTok - native link still blocked

The correct account is `@gulatextwingman`. TikTok's current web profile editor exposes Username, Name, and Bio, but no native Website field. The account's Business verification control is not complete. Attempts to save a shorter fallback bio in the web editor did not persist, so the public fallback remains:

```text
Paste text -> get reply in 10s. Free: gula-agents2.vercel.app/tiktok?src=tiktok
```

This is visible text, not a verified native website link. Do not describe it as clickable. The canonical URL to use if TikTok unlocks the Website field is:

```text
https://gula-agents2.vercel.app/tiktok?utm_source=tiktok&utm_medium=organic_social&utm_campaign=profile_bio&utm_content=profile
```

Do not switch to a Business account or begin verification automatically: that can affect access to music and other creator features. Make that tradeoff deliberately from the account owner app.

### Instagram - native link still requires mobile

The correct account is `@textwingmangula`. Instagram's desktop editor explicitly says Website edits are available only in the mobile app. The attempted desktop bio save did not persist, and the public profile still shows the old fallback URL:

```text
https://gula-agents2.vercel.app/tiktok?src=instagram
```

The canonical URL to enter in Instagram's native Website field from the mobile app is:

```text
https://gula-agents2.vercel.app/tiktok?utm_source=instagram&utm_medium=organic_social&utm_campaign=profile_bio&utm_content=profile
```

The Mac iPhone Mirroring window was locked and requested the Mac login, so the native Instagram field could not be changed in this pass.

## Landing-page verification

Each canonical platform URL returned HTTP 200 from production. The deployed `/tiktok` page already shows the paste box and an example result immediately, carries the UTM parameters forward, and presents the free-reply action before the visitor has to hunt for the product.

## Operating rule

Use one promise in every profile and video CTA:

```text
Paste the text they sent. Get the read + 3 replies in 10 seconds. Free.
```

Use the platform's native Website field whenever available. Track every post with `utm_source`, `utm_medium=organic_social`, `utm_campaign=profile_bio` or a campaign-specific name, and `utm_content=tw-###` for the individual asset. Never reuse `src=` links or the old `utm_medium=bio` template in new posts.

## Remaining actions

1. Open Instagram's mobile app, replace the Website field with the canonical Instagram URL, and save.
2. Reopen the TikTok profile in the account owner's app. If a Website field is available, use the canonical TikTok URL; otherwise keep the short fallback and do not call it a clickable link.
3. After each mobile edit, test from a logged-out browser and confirm the URL preserves the expected source and content parameters.
