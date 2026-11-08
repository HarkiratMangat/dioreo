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

A post in a followed news channel (`NEWS_WATCH`: #leaks from Leakers on Duty, #official-codm-news from CODM) → at most one card from **Dioreo Admin** in `NEWS_CHANNEL` (#news-distill on prod, #testing-spam on the dev bot). Each item on the card has a button that opens the **/manage box** it needs, filled in: Add New/Returning Draw, Add Event/Mode, the **Next Season Draft**'s draws or calendar box with the line added, or the Add to Patch Notes panel for that post. **This season's items: nothing on a card writes**; /manage's own submit does, behind the router's /manage lock, with its own validation and undo. **Next season's items are written straight into the Next Season Draft** (below). At 00:05 UTC a **daily briefing** posts (below), ending with the day's uncarded posts and a **Make a card** dropdown.

## The three steps, and why each is where it is

1. **Code first, free** (`filter.js` `prefilter`): no draw/event/mode/patch word, a link only, a shop deal, or a region word with no "Global" → no AI call. Measured on 602 #leaks posts: about two-thirds skip here.
2. **The AI** (`model.js`, Gemini on Vertex through `utils/visionExtract.js` `vertexGenerate`, the same project and billing as /autobuild): per item kind, new/returning/cancelled/changed, name, rewards, start/end **as written**, which season the post means, region, confirmed/expected. Harkirat's call (2026-11-04 19:28 EST): judging next season vs this one is "exactly where the ai model's judgement comes into play". Two-thirds of Global draw posts needed that judgement in the dry run.
3. **Code again** (`resolve.js`): dates read with chrono against the **post's** time in UTC; **a date beats words** for live vs draft (on or after the live season's `bpEnd` → draft); DrawCatalog makes a known draw returning only when it first ran in an EARLIER season than the item's (its `releaseSeason`/`releaseYear`; a document with none is an older draw), and the bot's own list wins for a draw it already has; a draw or event already on the live season with the same dates is dropped, and with different dates becomes a **live fix**; next-season items go to the draft merge (below). With `NEWS_AUTODRAFT=0` a next-season season post is a **Set Next Season Title & Start** row instead.

## Auto-drafting the Next Season Draft (2026-11-05 00:08 EST, Harkirat's "yeah")

Next-season items skip the buttons: `core/ops/season.js`'s `season.newsDraft` plans the change with `utils/newsTriage/draftMerge.js` INSIDE its transaction, against the draft as it is then (a Flex read can take minutes; a plan made before it could add a row he typed meanwhile — 2026-11-05 15:35 EST), and writes it through `commitSet` (as the owner, `source: 'news'`), so it is in History and the card's **Undo draft changes** reverts it by id. The draft is staged: nothing reaches players until his Promote to Live. This season's items keep their buttons; `NEWS_AUTODRAFT=0` puts every item back on buttons.

What the merge does, each rule from the 60-day Season 9 backtest (draft rows matching his: 38 of 53, 22 of 23 calendar rows with his exact dates, 4 extra rows, no duplicates; `local/project/features/news-channel-triage/season9-backtest.md`):
- **One item, one row.** A later post about the same item updates its row (dates, end date, a better name); typos count as the same name (two edits apart). 🔴 **Every skip, live fix, merge and card dedupe uses ONE strict match, `resolve.js` `strictName`** (2026-11-05 17:14 EST): containment counts only when the shorter name is 80% of the longer, and a number or numeral names a different item (Street Fighter Series Armory II is not the first one). The loose `sameName` is for the draw-index lookup only (`catalogueMatch`); used for skips and fixes it told "Nuketown Halloween" it was the live Nuketown playlist and "Halloween Sale" the Halloween armory.
- **One post naming an item twice is one item** (2026-11-05 17:14 EST): the first mention wins and later ones only fill what it left out, and a post that cancels an item and also announces it is moving it (the cancellation is dropped). Planned one after the other, a re-read of the same post rewrote the row every time.
- **A better source wins.** Official channel 3, a confirmed leak 2, an expected leak 1; a lower rank never overwrites a date a higher one set, even when it says the date changed (until 2026-11-05 17:14 EST a leak's "changed" could; it may still fill a date left empty).
- **The draft holds the next season only** (2026-11-05 17:14 EST): a season numbered past the next one (live title + 1), or a date on or after the draft season's own end, is a later season. The leak of Season 10 dated November 12 had made the Season 9 draft "Season 10" on the backtest.
- **An expected leak with no date is held** (listed under the card, not drafted): dateless early leaks drafted "Hunger Draw"-style half names and events that never ran.
- **A dateless confirmed item sits on the season start as a placeholder** (`newsSource.dated: false`), replaced by the first post that gives a real date.
- **His rows are never touched**: a row with no `newsSource`, or one whose `newsSource.sig` no longer matches (he edited it), is left alone, even by a cancellation. A /manage bulk draft edit re-parses the box and so takes ownership of every row in it.
- **A cancellation removes** the row news triage wrote.
- **Kinds he never lists are not drafted, and he picks them** (2026-11-05 15:26 EST, his pick 3): `draftMerge.js` `KIND_GROUPS` (crates & lucky boxes, boosts & supply drops, streams & tournaments, festivals, stores, offers & sales, login events), chosen in the daily briefing's **Never drafted** dropdown and saved as `BotControls.newsSkipKinds` by anyone with the Next Season Draft tier (`handlers/news.js` `setKinds`). Missing means `DEFAULT_SKIP`, the old fixed list (his Season 9 list had none of those and did have a sale). A picked chip shows about 30 characters, so labels stay short (the test pins it). Patch notes keep their Add to Patch Notes button.
- **A draw row needs an image**, as /manage's bulk draft add requires. The post's picture is used only when the post is official and names one draw, else an image already cached under the name; with none, the calendar row is drafted and the card keeps an Add button for the draw.
- **Carry-over**, every day of the ten before the next season starts (`pipeline.carryOver`, planned inside the op): live rows still running at its start are copied into the draft, because Promote to Live replaces the live lists with the draft's (the Herrscher draws were re-added by hand in Season 9). It used to run once, on the first day, missing anything added later in the window. A card posts only on a day it added rows; live rows with no end date are listed in the briefing and the promote check. 🔄 **A still-running draw is carried even when its calendar row is already in the draft** (2026-11-08 12:52 EST): Alchemy Stars had its row (news-written under its calendar name) and no draw, so Promote would have dropped it from /draws; the draw is found by its /draws name or as the same draw (`isSameDrawTitle`) and keeps its /draws name. The Season 9 backtest was re-run after it: 38 of 53, 24 starts right, 4 extra, 0 duplicates, unchanged. With auto-promote set, the promote check says so instead of asking him to promote by hand.
- 🔴 **Undo is refused once the draft has moved to another season** (2026-11-05 15:35 EST, `draftMerge.js` `undoAllowed`): a card lives 30 days, so its Undo can be pressed after Promote to Live and a new season's posts. Simulated, that wiped the next season's title. Season fields are also restored only where they still hold the value the change set.
- **A card Discord refuses is never silent** (`postCardOrUndo`): text over 4,000 characters is cut to fit (`card.js` `fitText`; a full card measured 6,073), and a send that still fails deletes the card record and alerts with the draft change id.
- **An edited post that wrote draft rows is read again** and merged (same source, so rows update); a deleted one notes on its card that its rows are still in the draft.
- **Names are cleaned in `model.js`** (mentions, @everyone, links): a name is the one free-text field that can travel from a post to /draws.

### What a fresh review found (2026-11-05 20:19 EST, worker R1, `local/project/features/news-channel-triage/review-R1.md`)

Fifteen of its sixteen findings were real and are fixed, each with a check in `scripts/newsTriage.test.js` (`R1#n`):
- 🔴 **A month and day already reached is the post's own year** (`resolve.js` `readDate`): chrono's `forwardDate` read "live now, 11/5 – 11/19" posted Nov 5 as Nov 5 the next year, which sent a live draw to the draft or dropped it.
- 🔴 **No end from a post is written All Season, with `newsSource.noEnd`**: /manage's calendar box cannot write a missing end, so the null end came back as "Invalid Date" and the box's save dropped the row. The box now writes "All Season" for any row with no end, and its 2X CP marker.
- 🔴 **A /manage draft box save keeps the news rows it did not change** (`draftMerge.js` `keepNewsRows`, called from `season.bulkDraftDraws` and `season.bulkDraftCalendar`): every save used to re-make every row, so Undo found nothing and still said Undone, and later posts treated the rows as his.
- **Undo puts back only what is still as it left it**, says so when nothing is left to undo, and keeps the draft active while it holds rows. It is refused for a change made before the season had a title once the draft has been emptied (`afterOf` keeps the row ids).
- **A lower source cannot cancel a higher one's row**; it becomes a note.
- **A carried row follows its live row** until Promote (an extended end is carried; a deleted live row's copy goes), and nothing is removed on an empty live read.
- **A better source replaces a season field news triage set** (`draft.newsSeasonSet` records each one's rank and value); one he changed is kept.
- **MP and BR versions of a mode are two items** in the strict match.
- **An edit to a post with no card is read again** (`recheckEdited`), behind any read in flight.
- **The cap counts calls, not posts, and survives a restart**: a retry takes a slot, the day's count is saved in `BotControls.newsReadDay`/`newsReadCalls`, and Make a card will not read the same post twice in a day.
- **Catch-up holds a channel's cursor** while it runs, so a new post cannot move it past posts not yet read, and it alerts when it stops at 500.
- Posts the cap kept from the AI come first in the skipped list; the draft season's end is taken as 75 days after its start when none is set; closing a card takes a tier that can act on one.
- **Not fixed, plausible only:** a slow database could keep a card's box from opening inside Discord's 3 seconds (`handlers/news.js` `openItem` reads the card, two permissions and the draft before `showModal`). Watch the dev soak for an "interaction failed".

## What he sees, and why (2026-11-05 11:10 EST, Harkirat: "put yourself in my eyes… what info do I NEED and want to KNOW?")

- **The daily briefing** (00:05 UTC, every day, `card.js` `buildBriefing`, `pipeline.js` `gatherBriefing`): the counts since the last briefing or the last restart, said as such (posts read by the AI, their cost, cards, draft rows written, failed reads) · the **Next Season Draft's readiness** (title, BP start and end, Ranked and DMZ, row counts, draws with no image, rows with no end date, rows still only expected, live rows that may run into it) · **what the bot may be wrong about** (live fixes, re-checked against the live rows each time rather than whether a button was clicked) · **is each channel still delivering** (last post per followed channel, flagged after three days) · the skipped list with Make a card. A quiet day still posts, so silence never reads as health.
- **Live fixes** (`resolve.js` `liveFix`): a post that moves or completes the dates of something already on the live bot is a **Fix the dates on the bot** item, showing the bot's dates beside the post's and opening /manage's Edit box (draw or calendar) with the post's dates filled in. Before, a new end date was dropped as "already on /draws" (Black Hole's end moved Nov 7 → Nov 17 in Season 9 and nothing said so), and a moved start got an Add button that would have made a second row. Wrong live dates also reach players through /remind DMs.
- **Season parts**: a season post's battle pass, Ranked and DMZ parts (`part`) fill the draft's own titles and dates, each only when still empty (a default title like "Ranked Series" counts as empty). CODM's Season 10 post had filed the DMZ season as an event.
- **Double CP** (`doubleCP`) is read and set on the calendar row, because it changes /draw prices and the calculator.
- **The promote check** (2026-11-05 15:26 EST, his pick 4, `pipeline.js` `promoteCheck`, `card.js` `buildPromoteCheck`): once per season, at the daily run (or start-up) when the next season starts within 30 hours (the day before; two days fired a day early, 2026-11-05 15:35 EST), a card ticking what is set (title, BP end, Ranked, DMZ, row counts) and warning about what is not: draws with no image, a draw with no calendar row, rows with no end date, rows dated before the season (not carried over), the same title twice, seasons that do not meet (live `bpEnd` vs draft `bpStart`), rows the AI judged expected and nothing confirmed, live rows with no end date that may run into the season. The last step stays his: Promote to Live in /manage.
- **A leak's picture never becomes a draw thumbnail**: only an official post's picture is used, since a #leaks image carries the leaker's watermark.

## The AI's cost (2026-11-05 11:10 EST, Harkirat: "are you utilizing capabilities of the model to save money/tokens such as caching")

Measured live on the Season 9 calendar image (22 rows) and a one-draw text post, `utils/visionExtract.js` `vertexGenerate` options, set per read by `model.js` `readOptions` (env `NEWS_FLEX`, `NEWS_THINKING`, `NEWS_IMAGE_RES`, `NEWS_SCHEMA`):

| Read | Calendar image | One-draw text post |
|---|---|---|
| Before: standard tier, medium thinking | $0.080 (16,985 thinking tokens), 132 s | $0.0037 |
| **Now: Flex PayGo + low thinking** | **$0.0045**, 26 s, same 22 rows and dates | **$0.0010** |

- **Flex PayGo**: half price for a request that can wait (minutes); global endpoint only, one header. News can wait. A failed read retries once on the **standard** tier, since Flex is shortest on capacity on exactly the busy days.
- **Thinking `low`**: thinking tokens bill as output (5x input) and were most of the bill; low read the same rows.
- **Not used, and why**: implicit caching needs a 6,144-token shared prefix on 3.8 Flash and a news prompt is ~1,900, so it never hits; explicit caching has the same floor plus storage. `responseSchema` made answers worse (dates and stray text inside fields, one row of 22), and a medium image resolution read the calendar as one row.
- **Over the whole Season 9 backtest** (2026-11-05 11:43 EST): 218 reads cost $0.22 on Flex + low thinking against $1.47 before, and the auto-draft still matched 38 of 53 Season 9 rows. Two draws (Grim Duo, the Halloween armory) got a different start date than the medium-thinking read gave. A network drop now gets the same one retry as a timeout (7 of 218 reads failed without it).
- The free prefilter still keeps about two-thirds of posts away from the AI. The cost log (`vision_call_cost`) now records cached tokens and the traffic type, and prices both.

## Traps already paid for

- 🔴 **The AI's "another region" is trusted only when the post's words name a region** (`namesRegion`). On 2026-11-04 it read "Grim Duo Draw will be coming tomorrow", text with no region at all, as another region's from its picture, which would have dropped a Global draw in silence. Off the picture alone it is a warning on the card.
- 🔴 **A card is composed under Dioreo Admin's app id** (`pipeline.js` `asApp`). It is posted outside an interaction, so `utils/emojiMap.js` had no app in context and the card read `:DB_Info:` — the same trap `utils/buildSubmissions.js` `composeAs` closes for DMs.
- 🔴 **"Today's daily reset" is the NEXT 00:00 UTC after the post, never the post's own UTC day** (2026-11-07, `resolve.js` `nextReset`). #leaks posted "Sapphire Winter Draw will be coming on today's daily reset" at 17:53 UTC on Nov 7; read as "today" in UTC it said Nov 7, and the card told him the bot's correct Nov 8 was wrong. Only a phrase that is nothing but the reset is read this way ("today's update", "daily refresh" and "tonight" alone count), with a two-hour grace for "live now with today's reset"; a written date beside it still wins, and "tomorrow's reset" stays chrono's "tomorrow" (Grim Duo: "coming tomorrow" at 15:18 UTC went live the next UTC day). ⚠️ **"Today" alone is still the post's UTC day**: "live today" means the reset that passed, and the start words carry no tense to tell it from "coming today". A dismissed card is left out of the daily briefing's fixes, so a wrong one stops showing once he dismisses it.
- 🔴 **Being in the draw index is not being returning** (same card, 2026-11-07). The index holds this season's new draws too, because a draw saved into New gets that season on insert (`utils/drawCatalog.js` `insertFields`), so "in the index, therefore returning" called a brand-new draw returning. Compare the index's `releaseSeason`/`releaseYear` with the item's season (`firstRanThisSeasonOrLater`: the same season, or a later one with both years known, is new), and let the bot's own list decide a draw it already has. ⚠️ A document with no season is still read as returning, and the warning says "no season recorded": seasons are written only when a document is created, so a draw indexed before he added it as New never gets one.
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
- Catch-up after downtime reads up to 500 posts per channel, oldest first (2026-11-05 15:37 EST; it was one page of 100).
- `NEWS_DAILY_MODEL_CAP` (default 60) AI calls a day; three failures in a row pause reads for an hour with one alert.
- The skipped list is stored (`models/NewsSkip.js`: ids and a reason, never the text) and its titles re-read from the channel at 00:05 UTC, so a restart keeps it. Every post's outcome is also one log line.
- A cancellation of a live item shows as info with no box: delete it in /manage. A date change to a live item is a Fix the dates item (above).
- **The AI's read of a long post varies between runs**, and gemini-3.8-flash no longer takes a `temperature` to pin it. CODM's Season 10 post (8 items) came back with 6 live and 8 on a replay, the two events missing the first time. Open post on the card is the check; `NEWS_THINKING=medium` is the lever if it keeps happening (it costs up to 18x more on a calendar image).
- #stats-n-loadouts is not watched (his F1 answer).

## Tests and the dev run

🔴 **The rules every code path keeps are tests over the code itself** (`scripts/newsTriage.test.js`, the `rule:` checks, 2026-11-05 17:14 EST), so a new path that skips one fails the suite instead of waiting for a review. Each was broken once on purpose to prove it fails:
1. Every AI read is `pipeline.js` `aiRead`, and every caller takes a read slot (`takeReadSlot`) before it; a failed read pauses and alerts whoever started it.
2. Every Next Season Draft write is the `season.newsDraft` op through `commitDraft`, with an author and `source: 'news'`; the handler writes only an Undo.
3. Every draft write leaves a card with Undo (`storeCard` + `postCardOrUndo`), or an alert naming the change id.
4. Every message goes to `NEWS_CHANNEL` with `allowed_mentions: { parse: [] }`; the handler and the watcher post nothing themselves.
5. Every button and dropdown checks access before it acts (`allowed`, then `mayOpen` or `resolveAction`), and a card made or an Undo pressed is checked as the clicker.
6. A name decides a skip, fix or merge only through `strictName`.

**The scenario grid** (`scripts/newsTriageGrid.test.js`, in `npm test`, 2026-11-05 17:14 EST): seeded runs of generated posts (official and leaked, every kind and change, dated and dateless, names that are the same item and names that only look alike) through the merge, from a draft holding his rows, a row he edited and a row news triage wrote. After every post: his rows unchanged · live items never touch the draft · every written row's sig matches · no item twice · skipped kinds never drafted · a lower source never moves a date a higher one set · the same post read again changes nothing · Undo restores the draft exactly; and undoing every post restores the start. `GRID_SEEDS=3000` for a longer run. It found the two-mentions-in-one-post and leak-"changed" defects above on its first run.

⚠️ **Re-run the Season 9 backtest after any change to `resolve.js` or `draftMerge.js`.** It replays the cached AI reads, so it costs nothing, but it lives on this Mac only (the posts are messages from his server and never go in the repo): `local/project/features/news-channel-triage/season9-backtest.md` says where. The "Season 10" title regression shipped in a commit because the backtest was not re-run after the change that caused it.

`scripts/newsTriage.test.js` (in `npm test`) pins the filter, the dates in three time zones' worth of cases, live-vs-draft routing, that every box line parses back through /manage's own parsers, the card's 40-component and 100-character-id limits, and the AI answer's shaping. `node --env-file=.env.dev scripts/newsTriageReplay.js <channel> --find "words" [--dry]` runs one real post through the whole pipeline on the dev bot (one Vertex call: about $0.001 for a short post and $0.005 for a season calendar image on Flex + low thinking).
