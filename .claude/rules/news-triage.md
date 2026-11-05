---
kind: rule
status: live
paths:
  - "utils/newsTriage/**"
  - "core/ops/season.js"
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

A post in a followed news channel (`NEWS_WATCH`: #leaks from Leakers on Duty, #official-codm-news from CODM) → at most one card from **Dioreo Admin** in `NEWS_CHANNEL` (#news-distill on prod, #testing-spam on the dev bot). Each item on the card has a button that opens the **/manage box** it needs, filled in: Add New/Returning Draw, Add Event/Mode, the **Next Season Draft**'s draws or calendar box with the line added, or the Add to Patch Notes panel for that post. **This season's items: nothing on a card writes**; /manage's own submit does, behind the router's /manage lock, with its own validation and undo. **Next season's items are written straight into the Next Season Draft** (below). At 00:05 UTC a skipped list posts the day's uncarded posts with a **Make a card** dropdown.

## The three steps, and why each is where it is

1. **Code first, free** (`filter.js` `prefilter`): no draw/event/mode/patch word, a link only, a shop deal, or a region word with no "Global" → no AI call. Measured on 602 #leaks posts: about two-thirds skip here.
2. **The AI** (`model.js`, Gemini on Vertex through `utils/visionExtract.js` `vertexGenerate`, the same project and billing as /autobuild): per item kind, new/returning/cancelled/changed, name, rewards, start/end **as written**, which season the post means, region, confirmed/expected. Harkirat's call (2026-11-04 19:28 EST): judging next season vs this one is "exactly where the ai model's judgement comes into play". Two-thirds of Global draw posts needed that judgement in the dry run.
3. **Code again** (`resolve.js`): dates read with chrono against the **post's** time in UTC; **a date beats words** for live vs draft (on or after the live season's `bpEnd` → draft); DrawCatalog makes a known draw returning; a draw or event already on the live season or in the draft, **with the same start day**, is dropped. A season post for next season becomes a **Set Next Season Title & Start** row, which opens the draft's Titles & Dates box and fills only what the draft is missing.

## Auto-drafting the Next Season Draft (2026-11-05 00:08 EST, Harkirat's "yeah")

Next-season items skip the buttons: `utils/newsTriage/draftMerge.js` plans the change against the current draft and `core/ops/season.js`'s `season.newsDraft` writes it through `commitSet` (as the owner, `source: 'news'`), so it is in History and the card's **Undo draft changes** reverts it by id. The draft is staged: nothing reaches players until his Promote to Live. This season's items keep their buttons; `NEWS_AUTODRAFT=0` puts every item back on buttons.

What the merge does, each rule from the 60-day Season 9 backtest (draft rows matching his: 38 of 53, 22 of 23 calendar rows with his exact dates, 4 extra rows, no duplicates; `local/project/features/news-channel-triage/season9-backtest.md`):
- **One item, one row.** A later post about the same item updates its row (dates, end date, a better name); typos count as the same name (two edits apart). Name matching is stricter than `resolve.js`'s `sameName`: containment counts only when the shorter name is 80% of the longer, because "Halloween Sale" updated the Halloween Series Armory under the loose rule.
- **A better source wins.** Official channel 3, a confirmed leak 2, an expected leak 1; a lower rank never overwrites a higher one's date.
- **An expected leak with no date is held** (listed under the card, not drafted): dateless early leaks drafted "Hunger Draw"-style half names and events that never ran.
- **A dateless confirmed item sits on the season start as a placeholder** (`newsSource.dated: false`), replaced by the first post that gives a real date.
- **His rows are never touched**: a row with no `newsSource`, or one whose `newsSource.sig` no longer matches (he edited it), is left alone, even by a cancellation. A /manage bulk draft edit re-parses the box and so takes ownership of every row in it.
- **A cancellation removes** the row news triage wrote.
- **Kinds he never lists are not drafted, and he picks them** (2026-11-05 15:26 EST, his pick 3): `draftMerge.js` `KIND_GROUPS` (crates & lucky boxes, boosts & supply drops, streams & tournaments, festivals, stores, offers & sales, login events), chosen in the daily briefing's **Never drafted** dropdown and saved as `BotControls.newsSkipKinds` by anyone with the Next Season Draft tier (`handlers/news.js` `setKinds`). Missing means `DEFAULT_SKIP`, the old fixed list (his Season 9 list had none of those and did have a sale). A picked chip shows about 30 characters, so labels stay short (the test pins it). Patch notes keep their Add to Patch Notes button.
- **A draw row needs an image**, as /manage's bulk draft add requires. The post's picture is used only when the post is official and names one draw, else an image already cached under the name; with none, the calendar row is drafted and the card keeps an Add button for the draw.
- **Carry-over**, daily in the ten days before the next season starts (`pipeline.carryOver`): live rows still running at its start are copied into the draft, because Promote to Live replaces the live lists with the draft's (the Herrscher draws were re-added by hand in Season 9). Live rows with no end date that started in the last month are listed to check. One card per season.
- **Names are cleaned in `model.js`** (mentions, @everyone, links): a name is the one free-text field that can travel from a post to /draws.

## What he sees, and why (2026-11-05 11:10 EST, Harkirat: "put yourself in my eyes… what info do I NEED and want to KNOW?")

- **The daily briefing** (00:05 UTC, every day, `card.js` `buildBriefing`, `pipeline.js` `gatherBriefing`): the last 24 hours (posts read by the AI, their cost, cards, draft rows written, failed reads) · the **Next Season Draft's readiness** (title, BP start and end, Ranked and DMZ, row counts, draws with no image, rows with no end date, rows only a leak has named) · **what the bot may be wrong about** (open live fixes) · **is each channel still delivering** (last post per followed channel, flagged after three days) · the skipped list with Make a card. A quiet day still posts, so silence never reads as health.
- **Live fixes** (`resolve.js` `liveFix`): a post that moves or completes the dates of something already on the live bot is a **Fix the dates on the bot** item, showing the bot's dates beside the post's and opening /manage's Edit box (draw or calendar) with the post's dates filled in. Before, a new end date was dropped as "already on /draws" (Black Hole's end moved Nov 7 → Nov 17 in Season 9 and nothing said so), and a moved start got an Add button that would have made a second row. Wrong live dates also reach players through /remind DMs.
- **Season parts**: a season post's battle pass, Ranked and DMZ parts (`part`) fill the draft's own titles and dates, each only when still empty (a default title like "Ranked Series" counts as empty). CODM's Season 10 post had filed the DMZ season as an event.
- **Double CP** (`doubleCP`) is read and set on the calendar row, because it changes /draw prices and the calculator.
- **The promote check** (2026-11-05 15:26 EST, his pick 4, `pipeline.js` `promoteCheck`, `card.js` `buildPromoteCheck`): once per season, at the daily run when the next season starts within two days, a card ticking what is set (title, BP end, Ranked, DMZ, row counts) and warning about what is not: draws with no image, a draw with no calendar row, rows with no end date, rows dated before the season (not carried over), the same title twice, seasons that do not meet (live `bpEnd` vs draft `bpStart`), rows only a leak has named. The last step stays his: Promote to Live in /manage.
- **A leak's picture never becomes a draw thumbnail**: only an official post's picture is used, since a #leaks image carries the leaker's watermark.

## The AI's cost (2026-11-05 11:10 EST, Harkirat: "are you utilizing capabilities of the model to save money/tokens such as caching")

Measured live on the Season 9 calendar image (22 rows) and a one-draw text post, `utils/visionExtract.js` `vertexGenerate` options, set per read by `model.js` `readOptions` (env `NEWS_FLEX`, `NEWS_THINKING`, `NEWS_IMAGE_RES`, `NEWS_SCHEMA`):

| Read | Calendar image | One-draw text post |
|---|---|---|
| Before: standard tier, medium thinking | $0.080 (16,985 thinking tokens), 132 s | $0.0037 |
| **Now: Flex PayGo + low thinking** | **$0.0045**, 26 s, same 22 rows and dates | **$0.0010** |

- **Flex PayGo**: half price for a request that can wait (minutes); global endpoint only, one header. News can wait.
- **Thinking `low`**: thinking tokens bill as output (5x input) and were most of the bill; low read the same rows.
- **Not used, and why**: implicit caching needs a 6,144-token shared prefix on 3.8 Flash and a news prompt is ~1,900, so it never hits; explicit caching has the same floor plus storage. `responseSchema` made answers worse (dates and stray text inside fields, one row of 22), and a medium image resolution read the calendar as one row.
- **Over the whole Season 9 backtest** (2026-11-05 11:43 EST): 218 reads cost $0.22 on Flex + low thinking against $1.47 before, and the auto-draft still matched 38 of 53 Season 9 rows. Two draws (Grim Duo, the Halloween armory) got a different start date than the medium-thinking read gave. A network drop now gets the same one retry as a timeout (7 of 218 reads failed without it).
- The free prefilter still keeps about two-thirds of posts away from the AI. The cost log (`vision_call_cost`) now records cached tokens and the traffic type, and prices both.

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
- 🔴 **The Season 9 backtest (2026-11-04 23:28 EST) found seven defects no unit test could, each now pinned by `scripts/newsTriage.test.js`.** The method: 60 days of #leaks (552 posts) replayed in order as if auto-drafting from an empty season, scored against prod's real Season 9 (35 items). The current build found 21; the fixed one finds 33. The two left are a CN-only post (Triple Threat) and "Herrscher's Arsenal" series points never posted as a draw. The defects:
  - A read kept only 8 items, so the official Season 9 calendar image (22 rows) lost 14. Reads keep 40 now; the card still shows 8.
  - The calendar image then TIMED OUT at the 90 s Vertex default: the season's most important post, lost with one log line. News reads get 3 minutes and one retry after a timeout, 429 or 5xx.
  - "returning tomorrow for all version except CN version" was dropped as another region. `GLOBAL` now reads "except CN" as Global.
  - Day-first slash dates ("03/11" on a Halloween sales image) read as March 11 and sent four live draws into the next season's draft. A post is day-first when any slash date's first number is over 12; otherwise a reading months away is swapped when the swap lands near the post (`readSlashDate`).
  - Test-server posts passed because "Global Public Test Server" says Global. `TEST` is checked after the region gate and before Global can override it.
  - "Sale" was not a tracked word, and the AI filed the Halloween Sale as "other". Sales are events now.
  - "China" was missing from `REGION`.
- **Names follow his house style, taught as rules in the prompt** (keep the game's own colons, drop " - ", drop a parenthesis that only names the reward, end with Draw / Mythic Drop / Series Armory / MP Playlist / MP Mode / BR Mode / Themed Event); a catalogue match supplies the name outright; a season title is "Season N — Title" (`seasonTitle`, Harkirat 2026-11-04 23:28 EST: "i dont use : in my titles"). ⚠️ The rules were written after reading Season 9's names, so the backtest's name scores are a little optimistic.
- **The model is told which channel a post came from** (official, or the leaks channel that reposts official calendars and also posts datamines). Only 5 official posts existed in the window (followed 2026-10-29), so official-vs-leak was judged mostly from reposts.
- **A Discord image link expires** (signed, about a day), so a draw box re-reads the source post for its image at click time; /manage re-hosts it to Cloudinary on save. A trailer post's attachment is a video, so its box has no image.

## Limits, on purpose

- One card per post, at most 8 items shown (`card.js` `MAX_ITEMS`, pinned under 40 components and 4,000 characters by the test), the rest counted in a note. Five hid three playlists of CODM's own season post.
- `NEWS_DAILY_MODEL_CAP` (default 60) AI calls a day; three failures in a row pause reads for an hour with one alert.
- The skipped list is stored (`models/NewsSkip.js`: ids and a reason, never the text) and its titles re-read from the channel at 00:05 UTC, so a restart keeps it. Every post's outcome is also one log line.
- A cancellation of a live item shows as info with no box: delete it in /manage. A date change to a live item is a Fix the dates item (above).
- **The AI's read of a long post varies between runs**, and gemini-3.8-flash no longer takes a `temperature` to pin it. CODM's Season 10 post (8 items) came back with 6 live and 8 on a replay, the two events missing the first time. Open post on the card is the check; `NEWS_THINKING=medium` is the lever if it keeps happening (it costs up to 18x more on a calendar image).
- #stats-n-loadouts is not watched (his F1 answer).

## Tests and the dev run

`scripts/newsTriage.test.js` (in `npm test`) pins the filter, the dates in three time zones' worth of cases, live-vs-draft routing, that every box line parses back through /manage's own parsers, the card's 40-component and 100-character-id limits, and the AI answer's shaping. `node --env-file=.env.dev scripts/newsTriageReplay.js <channel> --find "words" [--dry]` runs one real post through the whole pipeline on the dev bot (one Vertex call: about $0.001 for a short post and $0.005 for a season calendar image on Flex + low thinking).
