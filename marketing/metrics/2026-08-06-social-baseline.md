# Social Baseline - 2026-08-06

This is the comparison point for the next content batch. Counts are public profile observations, not private analytics exports.

## Current snapshot

### TikTok - @gulatextwingman

- Profile: 0 followers, 17 likes, 0 following.
- Visible post range: 0-196 views; the distribution is uneven.
- Strongest visible posts: The Moment You Lost Leverage (196), the dry `lol` recovery (154), Gula Text Wingman - The Right Move (137), busy is not rejection (133), and Dont Fumble the Reply (114).
- Weak or zero-view examples: several multi-choice, abstract, and product-heavy posts are at 0-1 views.
- Interpretation: concrete emotional situations beat feature explanations. The account needs a stronger first-frame hook and a clearer profile-to-site path before more volume is added.

### YouTube - @gulatextwingman

- Profile: 3 subscribers, 40 videos.
- Strongest visible Shorts: What Are You Looking For (1.7K), Handling Maybe (1.4K), The Move That Saves The Chat (285), ChatGPT Sounds Too Formal (204), I Came From the Future (192), and Why Are You Single? (133).
- Lower performers include several near-duplicate advice titles and generic product ads.
- Interpretation: curiosity and recognizable tension are winning. The next batch should not repeat Maybe, What Are You Looking For, ChatGPT Formal, Busy, Lol, The Move, or Right Move until a meaningfully different creative is ready.

### Instagram - @textwingmangula

- Profile: 29 posts, 0 followers, 1 following.
- Five distinct Reels were confirmed published during the two most recent passes. The account had 24 posts before that work began.
- The earlier visible Reels had view counts of 3, 1, 117, 25, 6, 4, 115, 98, 117, 52, 21, and 104; the three new posts need a 24-hour read before comparison.
- Existing captions already cover leverage, essays, cause-of-death/autopsy, neediness, and a generic Coach CTA.
- Interpretation: the profile is publishing, but it does not yet have audience proof. New Reels should use distinct visual premises and a single comment prompt, not another generic "try the app" ad.

## Upload ledger for this pass

| Asset | Cross-platform check | Status |
| --- | --- | --- |
| The Screenshot Exorcist_1080p_caption.mp4 | No matching title in the visible TikTok or YouTube inventories | Instagram published; YouTube scheduled for Aug 7, 2026 at 12:15 PM, link `https://youtube.com/shorts/SDIOBIumjI4` |
| Gula Test 01 - What She Actually Heard_1080p.mp4 | Already present in TikTok public inventory; no earlier matching Instagram post observed | Instagram published; do not re-upload to TikTok |
| Gula Test 02 - Choose Your Reply_1080p.mp4 | No matching public YouTube title; not visible in the refreshed TikTok public list | Instagram published; YouTube scheduled for Aug 8, 2026 at 12:15 PM, link `https://youtube.com/shorts/oV0J7sFm0yU`; TikTok Studio accepted a same-day queue submission, but the scheduled item was not exposed in the refreshed content table |
| Gula Test 03 - Fix It Live_1080p.mp4 | Already present in TikTok public inventory; no earlier matching YouTube title was observed | Do not re-upload to TikTok; use only if a later YouTube slot is needed |
| Texting Time Machine_1080p_caption.mp4 | No matching title in the refreshed public TikTok or YouTube inventories | TikTok Studio accepted a scheduled submission for Aug 7, 2026 at 6:45 PM; verify the scheduled tab before adding another TikTok slot |
| Text Wingman - Double Text Without Begging_1080p_caption.mp4 | No matching `double` or `begging` caption in the visible Instagram inventory | Instagram published; caption CTA is `DOUBLE`; do not repost until its first 24-hour read is recorded |
| Text Wingman - She Canceled Last Minute_1080p_caption.mp4 | No matching `cancel` caption in the visible Instagram inventory | Instagram published; caption CTA is `CANCEL`; do not repost until its first 24-hour read is recorded |
| Texting Autopsy_ The Trouble Text_1080p_caption.mp4 | Too close to existing Instagram Cause of Death/autopsy framing | Hold; do not use in the next three posts |

## HeyGen batch created this pass

These are new Video Agent projects, not reused prompts. They are still rendering/finishing motion graphics in HeyGen and should be reviewed before download or cross-platform upload.

| Project | Test variable | Status |
| --- | --- | --- |
| [Interview Answer Test](https://app.heygen.com/video-agent/383e928d9ab54215b76a8a7c00947753) | Curiosity/quiz structure; Marcus avatar; `LOOKING` CTA | Generated plan, music, captions, and scenes; finishing motion graphic |
| [2AM Ex Text](https://app.heygen.com/video-agent/451105685678449eac71b4a2a78867c6) | Reaction-first UGC; female creator direction; `EX` CTA | Generated plan, music, captions, and scenes; finishing render |
| [I’ll Let You Know Decoder](https://app.heygen.com/video-agent/18455c4afa1541d3b355f083c00fd0f0) | Game-show diagnosis; Shane avatar; `DECODER` CTA | Generated voice, plan, music, captions, and scenes; finishing motion graphic |

## Next-batch rules

1. Use one recognizable situation per video: a dry `lol`, late-night ex text, vague plan, or screenshot with one obvious mistake.
2. Put the conflict in the first frame and first spoken line. Do not open with the product name or logo.
3. Keep the core edit 15-22 seconds, with one payoff and one CTA near the end.
4. Test two creative families: human reaction/UGC and visual diagnosis/game format. Do not publish three versions of the same premise on one day.
5. Use one comment CTA such as `COACH`, `FIX`, or `SCREENSHOT`; do not stack comment, link, and follow requests in the opening.
6. Track first-second hold, three-second hold, completion, profile visits, and link clicks. Views alone are not the optimization target.
7. Do not assume three uploads per platform per day is optimal. Hold at one distinct post per platform per day until the first-second hold and completion improve, then scale the winning family.

## Website patch status

The local patch aligns the homepage and social landing page to the same promise, fixes the Instagram destination, removes production demo-mode fallbacks, removes `/app` from the sitemap, and uses the deployed Vercel domain consistently. Local verification passed. Commit `b1085af` contains the patch, but deployment is pending: Vercel CLI has no credentials and GitHub denied the authenticated `ctgula` user permission to push to `gulalabs1-droid/TextWingman.git`.
