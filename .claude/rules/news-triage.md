---
kind: rule
status: live
paths:
  - "utils/newsTriage/**"
  - "bot/newsWatch.js"
  - "handlers/news.js"
  - "models/NewsCard.js"
  - "models/NewsCursor.js"
  - "models/NewsSkip.js"
  - "scripts/newsTriage*.js"
---

# News-channel triage — followed news posts become /manage drafts

*Loads when you touch the pipeline, the watcher, the card's handler or its two models. Built 2026-11-04 20:18 EST on `feat/news-channel-triage`; the design, his answers and the measurements are in `local/project/features/news-channel-triage/` (design.md, spec.md) and `local/project/decisions.md` (rounds 1–3, 2026-11-04). Every decision here is Harkirat's unless it says otherwise.*

## What it does

A post in a followed news channel (`NEWS_WATCH`: #leaks from Leakers on Duty, #official-codm-news from CODM) → at most one card from **Dioreo Admin** in `NEWS_CHANNEL` (#news-distill on prod, #testing-spam on the dev bot). Each item on the card has a button that opens the **/manage box** it needs, filled in: Add New/Returning Draw, Add Event/Mode, the **Next Season Draft**'s draws or calendar box with the line added, or the Add to Patch Notes panel for that post. **Nothing on a card writes**: /manage's own submit does, behind the router's /manage lock, with its own validation and undo. At 00:05 UTC a skipped list posts the day's uncarded posts with a **Make a card** dropdown.

## The three steps, and why each is where it is

1. **Code first, free** (`filter.js` `prefilter`): no draw/event/mode/patch word, a link only, a shop deal, or a region word with no "Global" → no AI call. Measured on 602 #leaks posts: about two-thirds skip here.
2. **The AI** (`model.js`, Gemini on Vertex through `utils/visionExtract.js` `vertexGenerate`, the same project and billing as /autobuild): per item kind, new/returning/cancelled/changed, name, rewards, start/end **as written**, which season the post means, region, confirmed/expected. Harkirat's call (2026-11-04 19:28 EST): judging next season vs this one is "exactly where the ai model's judgement comes into play". Two-thirds of Global draw posts needed that judgement in the dry run.
3. **Code again** (`resolve.js`): dates read with chrono against the **post's** time in UTC; **a date beats words** for live vs draft (on or after the live season's `bpEnd` → draft); DrawCatalog makes a known draw returning; a draw or event already on the live season or in the draft, **with the same start day**, is dropped. A season post for next season becomes a **Set Next Season Title & Start** row, which opens the draft's Titles & Dates box and fills only what the draft is missing.

## Traps already paid for

- 🔴 **The AI's "another region" is trusted only when the post's words name a region** (`namesRegion`). On 2026-11-04 it read "Grim Duo Draw will be coming tomorrow", text with no region at all, as another region's from its picture, which would have dropped a Global draw in silence. Off the picture alone it is a warning on the card.
- 🔴 **A card is composed under Dioreo Admin's app id** (`pipeline.js` `asApp`). It is posted outside an interaction, so `utils/emojiMap.js` had no app in context and the card read `:DB_Info:` — the same trap `utils/buildSubmissions.js` `composeAs` closes for DMs.
- **Day-only dates are written out in UTC**, never as a Discord `<t:…:D>`: admin dates are 00:00 UTC and the tag showed Nov 17 as Nov 16 west of UTC.
- **Markdown and the "final patch notes are subject to change" line are stripped before anything reads the text**: chrono cannot read `November 27th__**`, and the disclaimer reads as a rumour.
- **The model gets dates as words and never computes one**, so a catch-up after downtime reads "tomorrow" against the post, not against the bot's clock.
- **Dev and prod never card into one channel**: each env sets its own `NEWS_CHANNEL`. The dev bot reads the real #leaks, which is the whole test.
- 🔒 **The AI is shown only images from Discord's own hosts** (`model.js` `allowedImageUrl`: cdn.discordapp.com, media.discordapp.net, images-ext-N.discordapp.net; an embed's picture through its `proxy_url`), with no redirects and a size cap read while streaming. A post's links are third-party data. And **each button checks the tier of the page its box writes** (`handlers/news.js` `mayOpen`: the right-click Add-to keys for live, `resolveAction('seasondraft', …)` for the draft), as /manage does per click. Both from the commit security review, 2026-11-04 20:27 EST.
- 🔴 **A season starts ON the live season's `bpEnd`, so the live-vs-draft test is `>=`, never `>`** (2026-11-04 22:12 EST). With `>`, CODM's own Season 10 post sent all eight 11/12 playlists to the live season, because `bpEnd` is 2026-11-12 00:00 UTC and 11/12 is that same instant. No unit test caught it; the live output did.
- **Discord sends a message update for things that are not edits**: a link's embed loading a moment after posting, and a crosspost whose source was deleted (flag `1 << 3`). The watcher notes "edited" only when `editedTimestamp` is set, and "deleted" for the flag.
- **A draft box that cannot take the line says so**: the Next Season Draft's boxes hold 4,000 characters and the calendar one replaces the whole staged list, so a line that would not fit comes back as a private reply to paste, never a box with the line silently missing.
- **A Discord image link expires** (signed, about a day), so a draw box re-reads the source post for its image at click time; /manage re-hosts it to Cloudinary on save. A trailer post's attachment is a video, so its box has no image.

## Limits, on purpose

- One card per post, at most 8 items shown (`card.js` `MAX_ITEMS`, pinned under 40 components and 4,000 characters by the test), the rest counted in a note. Five hid three playlists of CODM's own season post.
- `NEWS_DAILY_MODEL_CAP` (default 60) AI calls a day; three failures in a row pause reads for an hour with one alert.
- The skipped list is stored (`models/NewsSkip.js`: ids and a reason, never the text) and its titles re-read from the channel at 00:05 UTC, so a restart keeps it. Every post's outcome is also one log line.
- Cancellations and changes show as info with no box: change those in /manage.
- **The AI's read of a long post varies between runs**, and gemini-3.8-flash no longer takes a `temperature` to pin it. CODM's Season 10 post (8 items) came back with 6 live and 8 on a replay, the two events missing the first time. Open post on the card is the check; raising `thinking_level` for this task is the lever if it keeps happening.
- #stats-n-loadouts is not watched (his F1 answer).

## Tests and the dev run

`scripts/newsTriage.test.js` (in `npm test`) pins the filter, the dates in three time zones' worth of cases, live-vs-draft routing, that every box line parses back through /manage's own parsers, the card's 40-component and 100-character-id limits, and the AI answer's shaping. `node --env-file=.env.dev scripts/newsTriageReplay.js <channel> --find "words" [--dry]` runs one real post through the whole pipeline on the dev bot (one Vertex call: $0.003 to $0.02 measured on the dev bot, more for a long post with pictures).
