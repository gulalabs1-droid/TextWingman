# Text Wingman Video Factory

This folder generates short-form ads for TikTok, Instagram Reels, and YouTube Shorts.

The system is built around a script bank plus reusable Remotion templates, so new videos come from adding rows instead of manually editing timelines.

## Commands

Validate scripts:

```bash
npm run videos:validate
```

Open Remotion Studio:

```bash
npm run videos:studio
```

Render one video:

```bash
npm run videos:render -- --id=tw-001
```

Render a quick preview still:

```bash
npm run videos:still -- --id=tw-001
```

Render the first 10:

```bash
npm run videos:render -- --limit=10
```

Render by template:

```bash
npm run videos:render -- --template=wrong-right
```

Preview what would render:

```bash
npm run videos:render -- --limit=10 --dry-run
```

Outputs land in:

```text
marketing/videos/output/
```

## Creative System

Each script in `scripts.json` contains:

- `hook`: the first two seconds.
- `incoming`: what the other person sent.
- `badReply`: what the user was about to send.
- `goodReply`: the Text Wingman answer.
- `why`: the strategic reason it works.
- `cta`: final call to action.
- `campaign` and `contentSlug`: used for naming and UTM planning.

## Templates

`wrong-right`

Best for fast, direct performance ads. Show the bad reply, then the Wingman reply.

`group-chat`

Positions Text Wingman as faster and clearer than asking friends.

`screenshot-analyzer`

Sells the product mechanic: upload a screenshot, get the read, send the winner.

## Review Loop

1. Render 30 videos.
2. Watch them at 1x speed without sound.
3. Kill anything that feels stiff, unclear, or visually crowded.
4. Pick 10 for posting.
5. Track each post by creative ID.
6. Make new variants from the top 2 hooks.

## Posting IDs

Use this convention:

```text
TW-001-WYD-HOOKA-CTA1
```

Suggested UTM:

```text
/app?utm_source=tiktok&utm_campaign=wyd&utm_content=tw-001-wyd
```

## Human Review Gate

This factory automates production, not taste. Always review before posting or spending money.
