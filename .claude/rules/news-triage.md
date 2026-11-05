---
kind: rule
status: live
paths:
  - "utils/newsTriage/**"
  - "bot/newsWatch.js"
  - "handlers/news.js"
  - "models/NewsCard.js"
  - "models/NewsCursor.js"
  - "scripts/newsTriage*.js"
---

# News-channel triage — followed news posts become /manage drafts

*Loads when you touch the pipeline, the watcher, the card's handler or its two models. Built 2026-11-04 20:18 EST on `feat/news-channel-triage`; the design, his answers and the measurements are in `local/project/features/news-channel-triage/` (design.md, spec.md) and `local/project/decisions.md` (rounds 1–3, 2026-11-04). Every decision here is Harkirat's unless it says otherwise.*

## What it does

A post in a followed news channel (`NEWS_WATCH`: #leaks from Leakers on Duty, #official-codm-news from CODM) → at most one card from **Dioreo Admin** in `NEWS_CHANNEL` (#news-distill on prod, #testing-spam on the dev bot). Each item on the card has a button that opens the **/manage box** it needs, filled in: Add New/Returning Draw, Add Event/Mode, the **Next Season Draft**'s draws or calendar box with the line added, or the Add to Patch Notes panel for that post. **Nothing on a card writes**: /manage's own submit does, behind the router's /manage lock, with its own validation and undo. At 00:05 UTC a skipped list posts the day's uncarded posts with a **Make a card** dropdown.

## The three steps, and why each is where it is

1. **Code first, free** (`filter.js` `prefilter`): no draw/event/mode/patch word, a link only, a shop deal, or a region word with no "Global" → no AI call. Measured on 602 #leaks posts: about two-thirds skip here.
2. **The AI** (`model.js`, Gemini on Vertex through `utils/visionExtract.js` `vertexGenerate`, the same project and billing as /autobuild): per item kind, new/returning/cancelled/changed, name, rewards, start/end **as written**, which season the post means, region, confirmed/expected. Harkirat's call (2026-11-04 19:28 EST): judging next season vs this one is "exactly where the ai model's judgement comes into play". Two-thirds of Global draw posts needed that judgement in the dry run.
3. **Code again** (`resolve.js`): dates read with chrono against the **post's** time in UTC; **a date beats words** for live vs draft (after the live season's `bpEnd` → draft); DrawCatalog makes a known draw returning; a draw or event already on the live season or in the draft is dropped.

## Traps already paid for

- 🔴 **The AI's "another region" is trusted only when the post's words name a region** (`namesRegion`). On 2026-11-04 it read "Grim Duo Draw will be coming tomorrow", text with no region at all, as another region's from its picture, which would have dropped a Global draw in silence. Off the picture alone it is a warning on the card.
- 🔴 **A card is composed under Dioreo Admin's app id** (`pipeline.js` `asApp`). It is posted outside an interaction, so `utils/emojiMap.js` had no app in context and the card read `:DB_Info:` — the same trap `utils/buildSubmissions.js` `composeAs` closes for DMs.
- **Day-only dates are written out in UTC**, never as a Discord `<t:…:D>`: admin dates are 00:00 UTC and the tag showed Nov 17 as Nov 16 west of UTC.
- **Markdown and the "final patch notes are subject to change" line are stripped before anything reads the text**: chrono cannot read `November 27th__**`, and the disclaimer reads as a rumour.
- **The model gets dates as words and never computes one**, so a catch-up after downtime reads "tomorrow" against the post, not against the bot's clock.
- **Dev and prod never card into one channel**: each env sets its own `NEWS_CHANNEL`. The dev bot reads the real #leaks, which is the whole test.
- **A Discord image link expires** (signed, about a day), so a draw box re-reads the source post for its image at click time; /manage re-hosts it to Cloudinary on save. A trailer post's attachment is a video, so its box has no image.

## Limits, on purpose

- One card per post, at most 5 items shown (`card.js` `MAX_ITEMS`), the rest counted in a note.
- `NEWS_DAILY_MODEL_CAP` (default 60) AI calls a day; three failures in a row pause reads for an hour with one alert.
- The skipped list's titles live in memory until 00:05 UTC: a restart loses that day's list, never a card.
- Cancellations and changes show as info with no box: change those in /manage.
- #stats-n-loadouts is not watched (his F1 answer).

## Tests and the dev run

`scripts/newsTriage.test.js` (in `npm test`) pins the filter, the dates in three time zones' worth of cases, live-vs-draft routing, that every box line parses back through /manage's own parsers, the card's 40-component and 100-character-id limits, and the AI answer's shaping. `node --env-file=.env.dev scripts/newsTriageReplay.js <channel> --find "words" [--dry]` runs one real post through the whole pipeline on the dev bot (one Vertex call, about $0.003).
