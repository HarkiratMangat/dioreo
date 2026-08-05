---
paths:
  - "scripts/buildLegalPages.js"
  - "scripts/lib/chronicle.js"
  - "public/**"
  - "docs/legal/**"
  - "LICENSE"
  - "NOTICE"
  - "CONTRIBUTING.md"
  - "CONTRIBUTORS.md"
---

# The published site — flat `public/*.html` at the site root, and `public/changelog/`

*Loads when you touch the generator, its output, or any of the nine sources it renders. Split out of
the root `CLAUDE.md` on 2026-08-01 23:40 EDT, where it had grown to 286 lines — 43% of a file that is
loaded in full on EVERY session, including every session that never goes near the site. The root
file's own opening states it is "invariants + a navigation map"; this is subsystem craft, which is
what the `.claude/rules/` system exists for.*

⚠️ **The hard invariants stay in `CLAUDE.md` as well, deliberately.** Only the project-root file is
re-injected after `/compact`; a path-scoped rule reloads only on the next matching file read. So
"`public/**` is build output, never hand-edit it" and the build command live in both places on
purpose. Everything below is the detail — read it before changing any of it.

---

## Build and sources

**Run `npm run site` after editing ANY source** — it syntax-checks both build scripts first, and a
backtick in a CSS comment inside a template literal is a `SyntaxError` that has broken the build
repeatedly. `dior legal build` runs the same builder WITHOUT that pre-check (a known wart, filed in
`meta-deferred-list.md`). `dior legal check` compares live bytes against the local build.

⚠️ **You do not normally deploy by hand.** `.github/workflows/deploy-site.yml` publishes to Cloudflare
Pages on any merge to `main` that touches the site, and **skips changelog/devlog-only changes on
purpose** — those pages are withdrawn from the nav, so a publish for them reaches no reader. The
workflow rebuilds and refuses to publish a stale `public/`, then asserts the live `<title>` matches
what it uploaded, because a 200 can be served from cache while the site is down. Until
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` exist as repo secrets it verifies the build and
skips the upload with a visible warning rather than going red.

⚠️ **Never hand-edit a file in `public/`** — the next build overwrites it. Change the Markdown or the
generator, re-run the build, commit both. `public/` is committed on purpose: Cloudflare Pages serves
it directly with an empty build command, so nothing has to run on their side.

---

- 🏠 **`indexPage()` IS THE SITE'S FRONT DOOR, NOT A LEGAL INDEX** (changed 2026-08-04 14:36 EDT). It
  opened on the kicker "Legal" and the headline "The fine print, in plain sight", which was correct
  while four documents were the only thing on the site. The record pages have shipped since and a
  help/docs section is planned, so a reader arriving at `/` met a page that introduced the paperwork
  and never said what the bot was. The hero now introduces **Dioreo** and the legal set keeps the
  numbered list in the same place under its own `.lab-sec` label.
  - ⚠️ **The `${count} documents` line is DERIVED and must stay derived** — it moved into the legal
    section as its sub-line rather than being replaced by prose, so it still cannot claim "four"
    after a fifth document lands. Same reason it was written that way originally.
  - ⚠️ **"Unofficial" leads the kicker.** The trademark notice at the foot is an obligation and stays;
    this is about the first three words on the page not implying a relationship the last three deny.
- 🧱 **A fenced code block is `.cw` = a header strip (`.cw-h`) plus the `<pre>`, and the control lives
  in the strip** (rebuilt 2026-08-04 14:28 EDT). The copy button used to float ON the code, which cost
  three separate workarounds — an opaque background (or the line ran through it), reserved right
  padding, and a 3.6rem top pad on coarse pointers so a long line could not slide under a
  permanently-visible 44px target — and still read on a phone as a big disc in an empty band.
  A header removes the collision structurally. **If you ever move the control back over the code, all
  three workarounds have to come back with it.** Also:
  - The language label moved to `.cw-h[data-lang]::before`; `pre.code[data-lang]::before` is
    suppressed inside `.cw` so there is exactly one label. A bare `pre.code` still gets the corner one.
  - `--cpy-bed` carries whatever surface the copy glyph's opaque top sheet is drawn on. There are
    three of them now (the slip's accent pill, plain `--raised`, the strip's tint); hard-coding it is
    what produced the visibly darker notch the slip rule had to patch by hand.
  - The hover-reveal is **gone on purpose** — a control that is part of the block's furniture should
    not be conditional on a hover a touch device never has.
  - `.cpy-p` is the confirmation bubble. It is **empty in the markup** and its word is CSS `content`
    — see the run-alignment note further down for what a literal label costs.
- **THREE page classes, and the distinctions are deliberate** (third added 2026-08-01 16:40 EDT). `PAGES` is the
  numbered legal set (terms · privacy · license · notice) rendered by `shell()`: squared corners,
  hairline rules, cold graphite, a numbered margin index, and the `01/02/03` series on the landing page.
  `EXTRA_PAGES` is contributing + contributors rendered by `warmShell()`: rounded, warm radial wash,
  glow, **no numbers anywhere**. The number series is what tells a reader "these bind you", so an
  invitation must never enter it. Don't collapse the two templates.
  `CHRONICLE_PAGES` is the record — What's New · Changelog · Devlog — rendered by
  **`scripts/lib/chronicle.js`**, which is neither an instrument nor an invitation and so takes its own
  family. It implements **"The Armory Terminal"**, Harkirat's own changelog design from 2026-07-11
  (memory `project_changelog_redesign`): a committed dark world — gunmetal `#0C100E`, phosphor
  `#E9E7DE`, Martian Mono + Instrument Sans — that **deliberately does not use the bot's palette**,
  which is precisely what stops it reading as a recoloured legal page. Its idea is the identity shift
  Harkirat asked to keep: **not three websites, three OPERATORS at one terminal.** The world is
  constant; who is at the console changes, and with them the type, density, signal and how much
  machine detail is exposed.
  - **PATCH NOTES** (What's New, tracer `#FF9E3D`) — a *notice board*: hero panel for the newest
    release, card deck behind it, humanist type, **no** PR/commit detail.
  - **FIELD ENGINEER** (Changelog, phosphor `#7CE38B`) — a *ledger*: fixed monospace key column
    (version · date · PR · commit) beside the prose, the **ordnance-belt rail** (filled round for
    `x.0`, hollow tick for a patch), the solo-era break, scanlines.
  - **LOG KEEPER** (Devlog, ice `#8FB8FF`) — a *timeline*: a spine that fills on scroll, a node per
    entry, dates in the margin, `### Lesson` blocks pushed out as debriefs.
  ⚠️ **What separates the three is the GRID, never the palette.** The first attempt was the legal
  shell in three accent colours and was rejected on sight: same masthead stack, same document column,
  same rail. A reader stops seeing colour in two seconds. If a change makes all three share one entry
  wrapper again, the identities are gone however many hues are in play.
  ⚠️ **Horizontal ruled-paper lines were tried and REMOVED.** A repeating gradient has one interval;
  prose leading is ~1.74rem and headings/lists/code are each something else, so the rules drift out of
  phase within a screen and strike through the text. Unsound, not mistuned. Don't reintroduce them.
- ⌨️ **`CMD_JS` is the landing page's animated command line** (shipped 2026-08-05 16:49 EDT). A
  typewriter under the lede that types a real slash command, holds it, backspaces to `/` and moves on.
  Emitted only by `indexPage()`; it returns after one `getElementById` if `#cmd-line` is absent, the
  same self-selecting shape `MORPH_JS`'s modules use.
  - 🚨 **`/ar`, `/smg`, `/lmg`, `/marksman`, `/sniper`, `/shotgun` and `/secondaries` ARE REAL
    COMMANDS, and `rg '\.setName\(' commands/*.js` WILL TELL YOU THEY ARE NOT.** They are registered
    at boot in `index.js`'s `handleBotReady()` from `Loadout.distinct('category', { mode: 'MP' })`
    with `SECONDARIES` merged in, so they exist in the live command list and in no source file's
    registration block. A handoff wrote them off as invented on exactly that missing-grep-hit
    evidence and Harkirat caught it. **Absence from `commands/` is not absence from Discord** —
    check the dynamic registration too. Same trap, different shape, as
    `feedback_not_checkable_is_usually_unexamined`: the search ran, it just could not see the thing.
  - ⚠️ **Admin and PoC commands are deliberately excluded** — `/manage`, `/alerts`, `/autobuild`.
    They are registered and would "work", but two are locked to Harkirat and one is unfinished.
  - ⚠️ **The reduced-motion check is in JS because the global rule cannot reach this.**
    `COMPONENT_CSS`'s reduced-motion override kills transitions and keyframes; a `setTimeout`-driven
    `textContent` swap is neither, so it would have run at full speed for a reader who asked for
    less. It goes still on one WHOLE command, not the bare `/` — a lone slash reads as a page
    waiting for something that never arrives. Bound live, so toggling the OS setting takes effect.
  - ⚠️ **`#cmd-line` KEEPS `aria-hidden="true"` now that it carries real content, and that is a
    decision.** It duplicates nothing (the lede states what the bot does), its text is rewritten
    every ~50ms so a reader landing on it gets a partial string, and `aria-live` would be worse
    still — a region announcing every keystroke. Revisit only if this becomes the only place a
    command is named.
  - ⚠️ **Do not write a CSS comment containing braces.** The first build of this failed
    `hoverGuardAudit` because a comment here spelled out the global reduced-motion rule in full
    syntax. Describe such rules in prose. The gate is right and the same class of mistake once
    destroyed eight rules via a comma in a comment.
  - ⚠️ **It COMPOSES lines, it does not hold a list.** `SPECS` carries the sixteen commands and each
    renders freshly every time it comes up: bare about two showings in five, otherwise with a
    randomly picked option and sometimes a second. Option VALUES are real and each was checked
    against its own source — the weapon pools are the live `loadouts` collection grouped by
    category, the choice labels are the **`name:` half of the real `addChoices(...)`** (Discord
    renders the name, never the value, so `page:New Draws` is right and `page:new` would be a
    string no reader ever sees), and every `datetime:` sample was run through **chrono-node**,
    which is the parser `/timestamp` actually feeds them to.
  - ⚠️ **The order is a shuffled full pass, and the SEAM is the only place a repeat can happen.**
    Every command appears once per cycle, so within a cycle they are the whole list apart — but the
    last of one cycle can be the first of the next. `spaced()` rejects such an order: an item `d`
    places from the end of the old one must land at index `4-d` or later in the new one, which
    leaves **at least three** other commands between showings. Harkirat's ask and his number.
    Shuffling harder does not fix this, because each pass is individually fine.
  - ⚠️ **TWO caps keep `white-space:nowrap` safe — `MAXLEN` 32 for a one-option line, `MAXLEN2` 30
    once a second option lands.** The pool is FILTERED to values that still fit rather than
    truncated, since a half-written option reads as a bug. **Two caps, not one, because characters
    are not the whole width**: each chip carries its own padding, so a two-option line spends four
    lots of it. A single flat cap has to be set for the widest shape and then starves the narrow
    one — at a flat 30, `/calendar page Playlists & Modes` and **every** `/draw prices` option were
    silently filtered out despite painting 260px into a 281px box. **That is the failure mode to
    watch: the cap does not error, it just quietly stops offering things.** Measured at 320px at
    the font clamp's floor — one pair at 31 chars = 260px, two pairs at 30 chars = 270px, box
    281px, zero document overflow. Re-measure both shapes if the padding, the gap or the floor
    moves.
  - ⚠️ **THE LAYOUT MIRRORS DISCORD'S OWN, checked against a screenshot of a real used command**
    rather than from memory — an earlier guess at it was wrong. Discord draws the command as bold
    plain text, then puts the option NAME and the VALUE each in their own box, **one continuous
    pill with only the outer corners rounded** and **no colon** (two adjacent boxes already
    separate the pair). `.cmd-c` is the only emphasised token (`--accent-t`, 700); both boxes are
    regular weight 400. **The beds are different materials on purpose**: the option name is a
    neutral grey mixed from `--ink` (10%), the value a coral tint mixed from `--accent` (**26%**) —
    the grey says "label", the tint says "your selection". The grey inverts correctly per theme with
    no second declaration, since `--ink` is near-white on the dark page and near-black on the light
    one. Measured text-on-bed: grey 12.04 dark / 11.88 light, accent 9.75 / 12.00. ⚠️ **26%, not
    11%** — a faint 11% tint was tried and read *darker* than the grey beside it, inverting the
    point, since the value should be the more present of the two.
  - ⚠️ **The boxes are `inline-block`, and THAT is what contains descenders — not padding.** An
    inline box paints its background over the font's **content area**, which comes from the face's
    ascent/descent metrics and is shorter than the glyphs actually drawn, so the legs of p, g and y
    hung below the chip at any horizontal padding. An inline-block's background covers its content
    box, whose height is the line-height, so the whole glyph range is inside it by construction.
    `vertical-align:baseline` keeps the chips on the command's baseline.
    ⚠️ **Arithmetic got this wrong and the render got it right.** A canvas `TextMetrics` check
    reported 1.7px of clearance and therefore no clipping; a screenshot showed the legs plainly
    outside the box — the font the canvas measured was not the box the browser painted. Same lesson
    as the nav indicator's dilation: when a model and a rasterisation disagree, believe the pixels.
  - ⚠️ **`.cmd-o:has(+ .cmd-v:empty)` restores the full radius while the value is still empty.**
    Splitting a pill means each half must know whether the other is there, and mid-typing the value
    IS absent — without this the option name sits as a square-edged stub for the whole time it
    types. Degrades to that square edge for a few hundred ms if `:has()` is unavailable.
    🚫 **Two rejected attempts, recorded so they are not retried.** (1) `--ink2` at 500 — a neutral
    grey read thin and washed out on an otherwise warm line. (2) `--accent-t` mixed 85% toward
    `--desk` — cleared AA at 5.56 / 5.20 but read **muddy**, and the reason is a property of the
    mix rather than of the number: *moving a saturated hue toward a near-black ground desaturates
    it*, so every "dimmed" coral lands in brown. **The same trap sits under the site's light-theme
    `--accent-t` formula** (38% accent + near-black), which turns amber into `#67432D` and gold
    into olive — so a future second hue here must **hand-tune its light value**, never inherit that
    formula. Measured alternatives if it ever comes up: amber `#F2994A` dark needs about `#8A4E08`
    light (5.26:1); the inherited formula's `#A85F0F`/`#B3690F` region fails AA at 3.88 / 3.38.
    Rendered
    flat, `/ar weapon:AK117` reads as one long command name and the reader cannot see the
    structure. The typewriter therefore reveals **per-segment spans**, not a string — anything that
    flattens it back to `textContent` keeps working and silently loses the meaning.
    **`.cmd-v:empty` is load-bearing**: an empty span still carries the chip's padding, so without
    it a bare coloured blob sits on the line the whole time it types. And the chip's contrast is
    **hand-checked, because `contrastAudit()` cannot see a `color-mix()` surface** — measured
    13.30:1 light / 12.88:1 dark at 12% and 12.91 / 11.97 at 16%, so 14% is bounded by the pair.
  - ⚠️ **Two backtick failures in two builds.** Comments inside the `CMD_JS` template literal, and
    inside `indexPage()`'s CSS, quoted option names with backticks — each terminated the string and
    failed `node --check` with a SyntaxError pointing at prose. Quote with `"` inside any template
    literal. Same family as the no-regex rule: what reads as documentation is program text.
  - Verified in-browser: five loads gave five different opening commands, and a 260-sample run of
    the emitted script covered all sixteen commands with a minimum same-command gap of exactly 3
    and nothing over the cap.
- **Web assets are VENDORED into `public/assets/`, never CDN-linked** (fonts + Motion One). This is a
  privacy obligation, not a preference: the Privacy Policy is served from this same origin, and a
  third-party CDN would disclose every visitor's IP to a party the policy does not name. All three are
  permissive (OFL / MIT) and attributed in `NOTICE` §1 — **add any new vendored asset there too.**
- **`chronicle.js` never imports from `buildLegalPages.js`** — every shared piece (tokens, component
  CSS, switcher, nav, footer, parser) is passed in as the `CHROME` bundle, one way. That was chosen over
  extracting ~2,000 lines out of a file that had just absorbed 27 commits. `requireChrome()` throws on a
  missing key, because a page rendered without its header would still pass the content gate.
- ⚠️ **Two output directories now, and `dir` carries it.** Pages default to `dir:'legal'`; the three
  chronicle pages set `dir:'changelog'`. Never write a bare `./name.html` nav link again — use
  **`hrefTo(target, from)`**, because two pages are now called `index.html` and a bare name no longer
  identifies one. That is also why the nav helpers take a `{out, dir}` page rather than a filename.
  `PAGE_ALIASES` maps a source name to a different output name (`CHANGELOG-SUMMARY.md` → `index.html`);
  without it every cross-reference between the three records goes inert with **nothing reporting it** —
  `linkAudit` has no href to resolve and `crossRefAudit` resolves by basename against the deploy tree,
  where `changelog-summary.html` legitimately does not exist.
- ⚠️ **CHRONICLE_PAGES IS WITHDRAWN FROM THE NAV** (2026-08-01 21:15 EDT) — off the desktop switcher,
  the mobile strip and the footer, everywhere **except inside `/changelog/` itself**, where the three
  pages keep their group so a reader who arrives by link is not stranded with no route between them
  (`navSetFor(cur)`). The pages are still built, deployed, reachable, and seen by every gate. This
  finishes the earlier withdrawal of the record row from the landing page, which left the tabs still
  advertising a section the page had stopped offering.
- ⚠️ **THE BAR NOW COMES IN TWO SIZES, and each has its own MEASURED staging.** `data-fit` on
  `.navwrap` selects the regime, and **`navSwitcher()` THROWS on a tab count with no measured staging**
  rather than letting it inherit numbers that do not apply to it.
  **Six tabs:** full-size above **1060**, tightened down to 981 — and that is the whole staging, because
  six tightened tabs still fit at 981, so this set needs **no chip tier at all**.
  **Nine tabs:** full above **1465** → tightened to **1300** → chips to **980**.
  Requirements measured 2026-08-01 21:40 EDT in a browser: six tabs need 1049 full / 936 tightened;
  nine need 1452 / 1277 / 919. ⚠️ **Do not arithmetic these from the old numbers** — the tabs went to
  700 weight and 1.02rem padding in the same pass, which moved every one of them.
  The chip is real markup, not a `::before` — a pseudo-element cannot be a link, and the link surviving
  is the whole point of the tier. It carries no `tabindex="-1"`: `display:none` already removes it from
  the tab order, and the attribute would still apply at the one width where the chip IS the only
  keyboard route to that group.
  ⚠️ **A tier boundary is only correct if BOTH sides of it fit** — check the width just above a boundary
  as well as just below. An early staging (1240/1100) was wrong at BOTH ends and was caught only by
  measuring the bar in a browser; reading the CSS could not have found it. Verified at the tightest
  width of every tier: 1465 / 1300 / 981 for nine, 1061 / 1059 / 981 for six, all zero overflow. The
  thresholds keep margin **because the chronicle pages' webfonts use `font-display:swap`** — the bar
  lays out with fallback metrics first, so a boundary with zero spare overflows on every cold load.
  ⚠️ **`.bar nav` is `margin-left:auto`, so its right edge is ALWAYS flush** — "distance from the nav
  to the viewport edge" measures nothing. Test overflow with `bar.scrollWidth > bar.clientWidth`.
- ⚠️ **A NAV TAB HAS NO `:hover` COLOUR RULE, and must never get one back.** The label's colour is
  driven per frame by `--cov` (how much of that tab's box the pill actually covers). A
  `.tab:hover{color:…}` rule is `(0,2,0)` against `.tab`'s own `(0,1,0)`, so it **beat the coverage
  colour outright**: for the whole time the pointer sat on a tab the label was pinned near-white, on
  top of the pill that had just arrived under it, and it only went dark when you moved away and the
  rule stopped applying. Harkirat reported this four times before it was found (2026-08-01 21:55 EDT).
  ⚠️ **A scripted `mouseenter` CANNOT reproduce it** — a dispatched event does not create a `:hover`
  state, so every measurement of the hovered tab read the correct colour while the screen showed the
  wrong one. Verify hover states by moving the real cursor and asserting `el.matches(':hover')` first.
  ⚠️ **`.tab.on`'s `--rest` IS `var(--accent-t)` — this line said `var(--ink)` and was wrong**
  (corrected 2026-08-03 14:53 EDT). The code has read `.tab.on{--rest:var(--accent-t)}` throughout, and
  the built page shows it: with the pill on Notice, the current page's own tab is still accent-tinted.
  So the current tab's label off the pill is the accent (`--accent-t` is the raw accent in dark and a
  38%-accent/`#120E1C` mix in light), and only `--cov` carries it to near-black as the pill arrives.
  Two prose numbers here had gone stale against the code at once — the exact rot
  `feedback_no_duplicated_state_in_prose` describes. **Read `paint()`, not this paragraph.**
  ⚠️ **The crossover band is SYMMETRIC — `band(0.28,0.72,cov)`, centred on 0.5**, and the only reason
  it is written down at all is that the superseded value is easy to "restore" by mistake. The earlier
  **0.30/0.58** was biased early to compensate for `cov` measuring the tab's PADDING box; once `cov`
  was changed to measure the LABEL, `cov` 0.5 means half the glyphs are on the pill, and the bias
  became a distortion. Width 0.44 is deliberate — the label spends about a fifth of the move in the
  mid tone. **Do not re-tighten it toward the old numbers without re-deriving what `cov` measures.**
- ⚠️ **The desktop pill is ASSEMBLED on page load, and that is not a second animation system.**
  `birth()` is just a move whose source has no width: set `srcX = dstX` and `srcW = 0` and every line
  of `paint()` already does the right thing — the tail is skipped, the neck collapses, and the head
  grows from the destination's own centre through the same spring. It therefore shares the goo ramp,
  the anisotropic dilation compensation, the label's coverage colour and the settle, and cannot drift
  from them. Only the droplets differ: with nothing to tear off, they start on a wide **ring** around
  the pill's centre and fall inward, which is the mobile choreography. **It plays once, on load, and
  only for the group that owns the current page** — a group you are not in has no pill at rest, so a
  burst there would announce an indicator about to vanish. Snapped under `prefers-reduced-motion` and
  on coarse pointers. Measured: 14 droplets, width 0 → 88 → settles 85, `morph` on at frame 0 and off
  at the end, the other group at 0 droplets, nothing returning after the sweep.
- ⚠️ **`sectionise()` wraps each top-level `<h2>` and its clauses in a `<section class="dsec">`, and
  that is what makes the sticky section headings possible.** What bounds a sticky element is its
  CONTAINING BLOCK; `parseBlocks()` emits headings as flat siblings, so without the wrappers they all
  pin at the same offset and cover each other instead of handing off. **The split is on a line-initial
  `<h2`**, because Terms opens with a callout blockquote containing an h2 of its own on the same line
  — splitting on every `<h2` would cut that element in half. It lives in `shell()`, NOT in
  `parseBlocks()`, because the warm and chronicle templates share that parser and each has a gate keyed
  to the shape it emits today. Two consequences that bit immediately: section spacing had to move onto
  `.dsec` (inside a section the h2 is `:first-child`, which the existing rule zeroes), and `.idx` needs
  `top:calc(.34em + .9rem)` to absorb the sticky band's padding or every section number sits high.
  The `.stuck` class carrying the pinned shadow is toggled from the rect the scrollspy already reads.
- ⚠️ **The nav is TWO controls — a desktop switcher and a mobile menu — and they must stay separate**
  (rebuilt 2026-07-31 23:55 EDT). Sharing one control across breakpoints is what broke it: a
  pointer-driven indicator that has to be a horizontal track AND a vertical thumb-follower does neither
  well, and every hover rule it carried latched on first tap on a touch screen. **There is no drag
  gesture and nothing may intercept a tab's click.** The retired version began a drag on every
  `pointerdown` and a capture-phase handler cancelled the navigation whenever the pointer moved >3px
  between press and release — so an ordinary click with a little hand drift was swallowed silently.
  Demonstrated in Chrome against the live build: identical synthetic clicks reached the link at 0px of
  drift and never reached it at 6px. The desktop indicator morphs by tracking its two edges on
  asymmetric springs (an expanding edge moves ~2x faster than a contracting one); it measures real tab
  boxes, so nothing sets `--n`/`--i` and the pill cannot exceed the track.
- ⚠️ **Every hover rule belongs inside `@media (hover:hover) and (pointer:fine)`.** On touch, `:hover`
  latches until you tap elsewhere, which is what left buttons "stuck mid-phase" on the phone. Touch
  feedback goes through `:active`, which releases itself. **This is applied MECHANICALLY at the single
  point where a stylesheet reaches disk (`guardCss`/`writePage`), not by hand** — a comment claimed
  every rule was guarded and sixty were not. Don't hand-write the query in new CSS; write the plain
  `:hover` rule and let the transform wrap it. ⚠️ **Comments are never part of a selector prelude.**
  The first version of that transform kept them, so a comment containing a **comma** was split as if
  it were a selector list and the rewritten rule was written into the middle of the comment —
  destroying eight rules while reporting success. `hoverGuardAudit` re-parses the built CSS for
  unguarded `:hover`, brace balance, and braces inside comments, because a transform that reports its
  own success is not a check.
- ⚠️ **The two surfaces use DIFFERENT metaball engines on purpose. Do not unify them.**
  *Desktop* (`.seg-ink`) uses the SVG `#dbgoo` `feColorMatrix` alpha crush: it multiplies ALPHA and
  leaves RGB alone, so the indicator keeps its own colour over the translucent glass header — no bed,
  no blend, no duplicated label. *Mobile* (`.mgw`/`.mgo`) uses the CSS `blur(7px) contrast(20) blur(0)`
  crush, because **on iOS an SVG filter renders the swarm as hard circles where the CSS chain renders
  it as liquid** (measured, same device, two panels on one page). The CSS crush can only threshold
  colour, so it needs an opaque black bed plus a blend to erase it — which is why `.mbar` is opaque and
  is NOT a scroller (a scroll container composites its contents and drops the blend, leaving a black
  rectangle). Making the desktop header opaque to match would destroy the frosted bar; that trade was
  considered and refused.
  - ⛔ **LIGHT MODE INVERTS THE SOURCE COLOURS, NEVER THE RESULT — `invert(1)` MUST NOT COME BACK**
    (fixed 2026-08-04 12:54 EDT). Light needs the mirror of the dark trick: a white bed (multiply's
    identity), black blobs, plate on `screen`. The obvious route is a fourth filter function, and that
    is what shipped first. On iOS it painted the **accent plate** inverted — a lime rectangle across
    the bar on the violet License page (`invert(#9B6BE3)` = `#64941C`), yellow on citron Contributors.
    The plate is a **sibling** of the filtered element, so a filter reaching it means the light chain
    **composites** wrongly, not merely blends wrongly — consistent with this file's older note that
    iOS silently drops colour functions after blur+contrast on this same element.
    `--goo-bed` / `--goo-ink` are theme tokens carrying the bed, the pill plate and the disc colours,
    so both themes now run the **identical three-function chain** and no light-only filter remains.
    ⚠️ **THAT DID NOT FIX THE ARTEFACT — confirmed on device, 2026-08-04 13:02 EDT.** It is kept
    because it is strictly simpler than a fourth filter function and removes one variable, but the
    light-mode artefact **is still open** and still visible while the birth animation plays. Do not
    read the tokens as a fix. Full history, the four spent attempts and where to look next:
    `docs/db-deferred-list.md` → 🐞 Active Bugs → `[P2 · M]` mobile nav liquid indicator.
    ⚠️ **Four attempts are spent and each moved WHEN it appeared without removing it** — the
    progression is the evidence, so do not restart at the top of it. The list, what was kept and
    where to look next are in `docs/db-deferred-list.md`; the one thing to carry in your head is that
    **the retire-on-birth fix IS kept and IS why the artefact no longer follows scrolling** — that
    part was real, and only the light-mode birth window remains.
    ⚠️ `.mgw.spent` is `display:none`, never `visibility:hidden`/`opacity:0` — an invisible element
    stays in the layer tree and iOS keeps compositing a blended one. That is a **hardening**, not the
    artefact fix; keep the two straight, because while the chain was still wrong the visibility
    version read as clean in dark and broken in light, which invites the wrong conclusion.
- ⚠️ **THE MORPH IS NO LONGER ONLY THE NAV — `MORPH_JS` carries four more surfaces** (shipped
  2026-08-03 13:09 EDT, v2.51.0, out of the PoC in `local/morph-poc/`). One constant, emitted on **every**
  template, containing four modules that **select themselves out of the DOM** rather than being
  switched on per page: the reveal's morphing mark and the scroll-linked landing rows exist only on
  the landing page, the back-to-top only where that button is, and the liquid cursor everywhere.
  A module whose element is absent returns after one `querySelector`. `GOO_SVG` gained `#dbgoo-r`,
  `#dbgoo-c` and `#dbgoo-p` beside the nav's `#dbgoo` — same alpha-crush matrix, different blur and
  **region**, and a region is a percentage of the FILTERED ELEMENT's box, so it is never portable
  between surfaces.
  - ⚠️ **`MORPH_JS` OWNS `.on` ON THE BACK-TO-TOP. Both host scripts had to give it up.** `shell()`'s
    inline script and `chronicle.js`'s each toggled that class from their own scroll handler, and a
    birth animates across ~42 frames — two writers fought every one. The hosts keep the ring's
    progress and the `--lift` that parks the button above the footer; state, click, and the
    reduced-motion `fire` fallback all live in the module. **A new template that grows a `.totop`
    inherits the behaviour by having the button — do not re-add a toggle.**
    ✅ **`warmShell()` grew one on 2026-08-04 14:35 EDT and this held exactly as written.** The CSS was
    already in `COMPONENT_CSS` and the behaviour already in `MORPH_JS`; both had been loading on
    Contributing and Contributors for weeks and doing nothing, because the only missing piece was the
    button. It now comes from the shared `TOTOP_HTML` — **emit that constant, never a copy of the
    markup**, and put it OUTSIDE the page wrapper (a fixed element is trapped by any ancestor
    carrying a filter, transform or `backdrop-filter`). The host's half — the ring's dash offset and
    `--lift` — is `TOTOP_TRACK_JS` for a template with no scroll loop of its own; `shell()` keeps
    doing it inside the loop it already runs for the scrollspy and the progress bar, so it does
    **not** include that constant. Two hosts, one writer per property, still.
  - 🚫 **ITS `aria-label` MUST NOT BE THE EXACT STRING "Back to top" — uBLOCK ORIGIN HIDES THE
    BUTTON IF IT IS** (found 2026-08-05 18:35 EDT, on Harkirat's own browser, where the control
    simply was not there). **Fanboy's Annoyance List** carries the *generic* cosmetic rule
    `##[aria-label="Back to top"]` — no domain prefix, so it applies to this site like any other —
    and uBlock's "Ignore generic cosmetic filters" is off by default. Both generators now say
    `aria-label="Scroll back to top of page"`; the visible `data-tip` still reads "Back to top".
    ⚠️ **The obvious suspect is the class name and the class name is INNOCENT.** Verified against
    the live lists: Fanboy filters `.gotop-btn` and `.gotop-wrapper` but not a bare `gotop`, and
    its only `##.totop` rule is domain-scoped to unrelated sites. Renaming the class would have
    been pure wasted work. **The attribute was the whole of it.**
    ⚠️ Checked before choosing the replacement, so the new wording is not another guess: that is
    the *only* generic `aria-label` rule mentioning "top", the list contains **no** substring
    (`[aria-label*=]`) aria-label rules at all, and nothing filters `data-tip`. Also swept
    AdGuard Annoyances (65k lines), AdGuard Privacy (152k) and uBlock Annoyances — no
    to-top cosmetic rules and no collision with the new label.
    ⚠️ **Generalise the lesson, not the string:** an icon-only control's accessible name is markup
    a filter list can collide with, and the failure is *silent* — no console error, no layout gap,
    the element is simply `display:none`. Any new icon-only control deserves the same check.
  - ⚠️ **`prefers-reduced-motion` builds NOTHING liquid.** No cursor layer, no `html.liq`, no
    `.tt-ink` — a reduced-motion reader gets the site exactly as it shipped. That matters more than
    usual here because the cursor sets `cursor:none !important` site-wide; a hidden pointer with
    nothing drawn in its place is the worst failure this could have, which is also why `html.liq` is
    not applied until the first `pointermove` has actually seeded the swarm.
  - ⚠️ **NO REGEXES IN `MORPH_JS`.** It is emitted from inside a template literal, so the generator
    eats a lone backslash: an escaped paren written in the source reaches the page as a bare paren
    and becomes a capture group. That changes a regex's MEANING without changing its SYNTAX, so
    `scriptSyntaxAudit()` — which only parses — cannot catch it. Colour parsing is hand-scanned.
  - ⚠️ **The mark is desktop-only and that is the design, not a gap.** The buds merging need the SVG
    crush, which iOS renders as hard circles; touch keeps the original `.rv-i` sliding fill, which is
    a complete treatment rather than a degraded one. The **label swap and the strike-through run on
    every pointer type** — they are information, not decoration. The back-to-top drops only its
    FILTER on touch (`.totop.nogoo`) and only its BIRTH, never the whole animation: hiding a surface
    from a platform that cannot render it is what once took the effect off mobile entirely.
  - ⛔ **Do not try the CSS blur/contrast crush on the back-to-top.** Built and measured
    2026-08-03 12:03 EDT: the masses merged and the bed rendered as a solid square, because `.totop` is
    `position:fixed; z-index:55` — its own stacking context, so `lighten` composites inside it.
    The nav works because it sits ON a bar. Full record in `reference_goo_metaball_recipe`.
  - ⚠️ **Module 5 is the nav pill's CONTAINED MESH** (added 2026-08-03 15:59 EDT). A field of five
    blobs inside `.ib-a`/`.ib-b`, on the same `0.85 + c*0.21` rhythm as every other morph, carrying
    the mixture of the liquid cursor's colour (the page accent, which it keeps everywhere) and the
    hovered tab's. Each piece mixes against **its own** inline fill, so mid-move the tail stirs the
    colour you are leaving and the head the one you are arriving at. The stadium border-box clips it
    for free — nothing masks it. Three findings that cost real time and must not be re-derived:
    - ⛔ **`mix-blend-mode` on `.cur-ink` DOES NOTHING — do not try it again without measuring the
      painted pixel.** The property applies (computed style reads `screen`) and the render is
      unchanged: over the violet pill the swarm core stayed `rgb(212,78,99)` where a working screen
      gives `rgb(237,146,236)` — blending against black, not against the pill. Not the filter, the
      opacity, the nesting or the transform; hand-built probes carrying each, and all at once,
      blended correctly against the same pill in the same frame.
    - ⚠️ **The swarm's ALPHA is half the effect.** `.cur-ink` paints solid `currentColor` at
      z-index 60, so over the pill it is an opaque blob ON TOP of the mesh — the first working
      version was invisible for exactly that reason while every measurement said it was fine.
      Module 5 drops that layer to `0.42` while over the bar and clears it on the way out; it writes
      **only** opacity there, module 2 keeps colour and transform.
    - ⚠️ **Layers composite with plain alpha, NOT `background-blend-mode:screen`.** Five screened
      layers pile into a near-white core, and white defeats the whole point — two ACCENTS are
      mixing. Under plain alpha the field's ceiling is the mixture itself.
    - Label contrast is **safer** than the flat pill and was checked, not assumed: worst case across
      all nine accents as page × all nine as tab is **6.25:1**, where the flat pills bottom out at
      **5.07:1**. Luminance is monotonic along a linear RGB segment, so the composite is bounded by
      its endpoints. Re-run it if the mix, the lift or an accent moves.
  - ⚠️ **`accentOf()` judges a borrowed ink against the CHIP'S OWN FILL, not the page ground**
    (changed 2026-08-03 15:57 EDT). `.ins` is `color:#141021` on `background:var(--accent)` in both
    themes; against the page ground that near-black passed on light paper and failed at 1.16:1 on
    the dark page, so the dark blob over the Install button was a light-mode-only accident. It is
    the seat the swarm sits on that decides. **The back-to-top is unaffected and it is NOT because
    of this test** — its background computes to `color(srgb …)`, which `parseCol()` does not read,
    so it never counts as a chip at all. The same is true of any `color-mix()` background. Teaching
    `parseCol()` that syntax would hand those controls' ink to the swarm for the first time.
  - ⚠️ **The text caret is a STACK OF MERGED MASSES, not a squashed cluster**
    (rebuilt 2026-08-03 16:59 EDT). Squashing the swarm thin and tall rasterises as a short lozenge
    about an x-height long — a Gaussian erodes a curve in proportion to its curvature and the alpha
    crush thresholds the ends away, so **thinner also means shorter**. The masses are spread along Y
    instead and merged by the filter, which cannot erode an end because another mass is there. Four
    constraints, each measured, each of which broke it when guessed:
    - **The stack is ordered centre-out (0, +1, −1, +2, −2 …), not by index.** By index, mass 0 —
      lag 0, the fastest — sits at the top and mass 6 — lag 1.10 — at the bottom, so the bar hangs
      from its top edge with the bottom dragging. Centre-out puts the fastest mass in the middle.
    - **Follow rates are equalised in text mode too** (`k` → 0.46). Symmetry alone still let the
      outer masses arrive late and the bar flexed like a whip.
    - **The mass radius is set by the PAINT FLOOR (~4.5px painted), not by their mean.** At the mean
      of 3.79 they paint 3.5px wide and the crush eats the whole stack.
    - **Its length is the line box under the pointer**, read from the caret rect `onGlyphs()` already
      computes, so it matches the text it sits in.
    Rasterised at rest: **6.4 × 22.5px on a 23px line, lean 0.02**. It keeps **75%** of its body
    through a click, because the burst's travel, opacity *and* scale are all damped in text mode —
    the scale term was missed first time and it was the one actually erasing the caret.
  - ⚠️ **Verifying it needs a LIVE renderer, and two things impersonate one.** A sleeping display and
    a backgrounded tab both present as `document.hidden` with rAF dead; the tell for the display is
    `screencapture -x` failing with *"could not create image from display"*. And the **coarse-pointer
    and reduced-motion branches cannot be reached by resizing a window** — `fine` gates them, not
    width — so they need CDP `Emulation.setEmulatedMedia` against a headless Chromium.
- ⚠️ **THE DESKTOP INDICATOR'S GEOMETRY IS MEASURED, NOT DERIVED — don't "simplify" its constants.**
  The goo filter dilates every edge it paints, so attaching it at the start of a move and dropping it
  at the end steps the pill's size. Four fixes failed before one worked (2026-08-01 21:40 EDT), and the
  reason all three wrong ones were wrong is the same: **the dilation is ANISOTROPIC.** Measured by
  rasterising `#dbgoo` over a 100×25 rounded rect into a canvas at 4×:

      stdDeviation   0.6   1.2   1.8   2.4   3.0   3.6
      dW per side   0.25  0.25  0.25  0.50  0.50  0.50
      dH per side   0.25  0.25  0.50  0.75  1.00  1.25

  At full blur the **height grows 2.5× as much as the width** — a 25px pill is short relative to a 3.6
  blur, so its caps (pure curvature) spread far more than its flanks. Correcting only width is
  invisible; correcting height by the width figure overshoots and snaps outward. **Ramping the blur
  does NOT cancel it either** — the dilation is proportional to the blur, so ramping spreads the same
  size change over ~76ms instead of removing it. The shipped constants are *solved* (feed a pre-shrunk
  rect back through until it paints true size), which lands dH at 1.125, not the 1.25 the table reads
  or the 1.26 an `erfc` derivation gives. **Re-measure with the canvas method if the blur, the crush
  matrix or the pill height changes.** Full story: memory `feedback_measure_the_renderer_not_the_model`.
- ⚠️ **Other bounded quantities in that animation, each of which caused a visible bug:** a droplet's
  rotation is clamped against its travel distance (the keyframes `rotate()` *then* `translate()`, so
  `sin(r) × distance` became vertical fling — 100px below a 54px bar, and it got worse as the nav grew);
  the vertical throw is capped by the bar's half-height minus radius minus blur (~10.5px, so the
  scatter that reads as "coming apart" must be HORIZONTAL); the arrival sits within 2px of the centre
  line (or a droplet protrudes past a formed pill); and every droplet lands by 0.90 of the move (or
  stragglers rain into a pill that has already settled).
- ⚠️ **The indicator's accent comes from a BLEND, never a fitted filter chain.**
  `multiply(white, accent)` IS accent and `multiply(black, accent)` IS black, exactly, for any accent.
  An earlier version fitted `sepia/saturate/hue-rotate/brightness` per accent — exact on paper, visibly
  desaturated on screen, and **two different clamping models both failed to predict what the browser
  paints**. Don't reintroduce fitted chains; a new accent needs no work under the blend. The tint plate
  must stay inside the bed's opaque core (`-80` inside `-110`), or blending against a partly
  transparent backdrop shows the plate's own colour as a square around the effect. Full record:
  memory `reference_goo_metaball_recipe`.
- **The site's only repo link is the header button, and that is on purpose.** A citation inside a legal
  document must resolve (repo visibility can change — TERMS §7.1), so in-prose repo references still
  degrade to inert text via `PUBLISHED_TARGETS`. A nav button that 404s is a dead button, not a
  defective instrument. TERMS §20 still withholds the repo as a *contact* route.
- **The homepage leads with Discord (`diorswrld`) and hides the email behind a `<details>` reveal.** It
  is `<details>`, not a script, because a data subject must be able to reach the controller with JS
  disabled (PRIVACY §13 / GDPR Art. 13). The wording says Discord is *fastest* and email is *canonical* —
  which is what the documents say; claiming Discord was "primary" would contradict TERMS §20.
- **Never hand-edit a file in `public/`** — the next build overwrites it. Change the Markdown, re-run
  the build, commit both. `public/` is committed on purpose: Cloudflare Pages serves it directly with
  an empty build command, so nothing has to run on their side.
- **Every page carries a skip link as its first focusable element, and `a11yAudit()` enforces it.**
  WCAG 2.4.1 Bypass Blocks is Level A and the site failed it everywhere until 2026-08-01 20:05 EDT: nine nav tabs
  plus three controls meant ~13 tab stops before the document, on every page. The link is hidden by
  **clipping**, never `display:none`/`visibility:hidden` — those remove it from the focus order and
  make it unreachable. Its target carries **`tabindex="-1"`**, because a plain `<main>` is not
  focusable and a fragment jump then scrolls without moving focus. The gate also asserts one `<h1>`
  per page. It exists because the first attempt HALF applied — both warm pages got the link and
  neither got the target, shipping a control that jumped nowhere, which is worse than no link.
- ⚠️ **Each chronicle voice carries TWO signal values, and `sigLight` is not optional.** The terminal
  signals are tuned for a near-black console and are close to invisible on the daylight variant —
  measured 1.50 / 1.16 / 1.47 against a 4.5:1 minimum, covering the version numerals, the dates and the
  operator line. `--ink3` failed in *both* themes too. **`contrastAudit()` re-measures the TOKEN
  MATRIX from the BUILT CSS on every run** — `--sig`/`--ink`/`--ink2`/`--ink3` against `--desk` *and*
  `--card`, in both themes. Tune a colour against the **harder** background of its theme: dark
  theme's `--card` is *lighter* than its `--desk`, so a value tuned only against `--desk` still fails
  on cards — which is exactly what happened.
  ⚠️ **It does NOT check individual rules, and this line used to claim it checked "every
  text/background pair", which is how a green gate gets read as cover it does not give** (corrected
  2026-08-03 16:37 EDT). It reads `--name: #hex` declarations only: a rule that paints its own
  surface — `.tipx` mixes one out of `--ink` and `--desk` — is invisible to it, and so is any
  `color-mix()`, `rgb()` or `color()` value. **A new component that sets its own background must have
  its contrast worked out by hand; the build passing is not evidence about it.**
  ⚠️ **That gate shipped BLIND on its first version and passed 63 pairs while the signals were still at
  1.47:1.** It matched only the *first* `:root{}` block, which is the legal `TOKENS` — `--sig` is
  declared in a later block and was never read. It merges every matching block in document order now.
  Caught only by reverting a known-bad value and watching it stay green: **prove a new gate against
  broken input, every time.**
- ⚠️ **`scriptSyntaxAudit()` parses every emitted inline `<script>`, and it exists because a build
  shipped a DEAD NAV while every other gate passed** (2026-08-01 22:05 EDT). A comment block was
  inserted one line below the `*/` that closed the previous comment, so the client script carried bare
  prose in statement position; the indicator IIFE died at parse time — no tab had a `--cov`, no group
  went hot, the pill never moved — and the build still reported content complete, links resolving,
  contrast AA and no credentials. **`node --check` on the generator cannot catch this**, and that is
  the trap worth remembering: the client code lives inside a template literal, so to the generator it
  is a *string*, syntactically perfect right up until a browser parses it. The gate shells out to
  `node --check` rather than `new Function()` — both would find it, but a subprocess that can only
  parse cannot turn into an execution path as the page content grows. Proven against the broken build
  before being trusted: it named all nine pages and failed the build.
- **`secretScan()` gates the published output against credential-SHAPED strings** (added with the
  chronicle family). `DEVLOG.md` is published in full and is the one source written candidly for us
  rather than for a reader — it discusses tokens, hosts and a past incident. It was clean when published
  (measured: 0 tokens, 0 Discord IDs, 0 emails); this gate is what keeps that true as it grows. It
  matches **shapes, never names** — `BOT_TOKEN` as a name is discussed throughout and is not a secret,
  and a name-matching gate would fire constantly, get muted, and then catch nothing.
- **`chronicleStructAudit()` catches RENDERER-side entry loss; `docs:audit`'s `summary-orphan` catches
  SOURCE-side loss. They are not redundant** — proven, because the obvious test confused them: deleting
  a heading from the source left the struct audit green (source and rendered counts both fell), and it
  only fires when the *parser* drops an entry. That distinction is why both exist.
- The build **verifies itself**: it re-reads its own output and asserts every multi-word run from the
  source survived rendering, then reports a percentage. It is not a "it didn't crash" check — treat
  anything below 100% as lost content, but confirm against the source before believing it, because
  several of its failures were verifier bugs, not real loss: ordered-list markers, stop-words, and
  (2026-07-30 00:40 EDT) **an undecoded HTML entity becoming a WORD** — `&middot;` reduces to the token
  `"middot"` and `&#9825;` to `"9825"`, which then sits *inside* an intact source run and splits it.
  It now decodes numeric/hex/named entities; that is safe because an entity resolves to exactly one
  character, so decoding can only *remove* a fabricated word, never supply a source word the page
  doesn't render.
  - 🚨 **ITS RUNS ARE SLICED FROM WORD ONE AT A FIXED STRIDE, SO ITS COVERAGE IS AN ALIGNMENT, NOT A
    GUARANTEE — and a real defect can hide behind that for as long as the word count holds.** Proven
    2026-08-04 14:34 EDT: the CLA slip's copy button carried a literal `>Copy<`, which is a text node
    sitting between the CLA line and the paragraph after it, so the rendered text read "…in §5 of the
    LICENSE **copy** If you'd rather…". Four days of 100% passes. Renaming the project removed one
    word far upstream, every boundary shifted by one, and the very next build reported the run
    missing. **The defect was always there; only the arithmetic changed.** So: (a) never write a
    visible word into the markup between two pieces of document text — `withCopyButtons()` already
    had that rule and `asSlip()` predated it, which is exactly how it was missed; draw such labels
    with CSS `content` keyed off a data attribute, and never write them from script either; and
    (b) when a run failure appears after an unrelated edit, **check whether it is a newly-exposed
    defect before assuming your edit caused it** — the region here was byte-identical across both
    builds and a diff of the output said so immediately.
- **The build prints its gate roster on every run — read that output, don't trust a count written here.**
  A number in prose is a copy of state nothing updates: this line said "THREE", then "FIVE", and was
  wrong within a day both times (`classCollisionAudit()` made it six on 2026-07-30). Each gate tests a
  DIFFERENT property and passing one proves nothing about the others.
- `warmStructAudit()` (added 2026-07-30 00:40 EDT) asserts every
  treatment each warm page **declares** in `WARM_STRUCT` actually fired. The warm treatments key off
  source heading text, so renaming a heading in `CONTRIBUTING.md` would silently drop that section back
  to plain prose — and **no other gate can see it**: all words still present, no links changed, no aligned
  columns, no cross-references. `WARM_STRUCT` is declared rather than sniffed so the check can't draw its
  expectations from the code under test.
- **Decorative text belongs in CSS, never the DOM.** The ledger's direction marks and the ghost plate's
  "Your name" label are drawn with CSS `content` on `aria-hidden` spans. Emitting them as HTML text put
  invented characters between a section's heading and its first source sentence, breaking `verify()` runs.
  The alternative — teaching `verify()` to ignore `aria-hidden` text — was rejected because it would hide
  real content loss just as well. If a mark's meaning is already carried by adjacent prose, it is
  reinforcement, and it goes in the stylesheet.
- ⚠️ **`.page` is only the centred wrapper; `.cols` carries the two-column grid, and the footer sits in
  `.page` OUTSIDE `.cols`. Do not fold these back together.** A sticky element is bounded by its
  containing block, not its own height, so while the footer was a third child of the grid the section
  rail was free to travel across it — measured at 1440×900 on Terms, 236px past the document and 126px
  into the footer. `align-self:start` does **not** fix this and was wrongly documented as doing so for a
  day. The footer must also stay *inside* `.page`, or it stretches to the full viewport width instead of
  the document column.
- It renders every `§N` cross-reference into a working anchor. That is why the parser only ever
  rewrites text nodes — touching markup would corrupt existing `href`s.

## Previewing it locally (`.claude/launch.json`, added 2026-08-02 00:40 EDT)

`preview_start` with the config named **`legal-site`**. It serves `public/` over HTTP.

⚠️ **This is the ONLY previewable surface in the repo, and that is not an oversight.** The bot has no
HTTP server at all — `PORT` is commented out in `.env` deliberately and nothing reads it — so
`node --watch --env-file=.env.dev index.js` has nothing a browser pane can open. Do not add a launch
configuration for it; it would be an entry that can never preview.

Two deliberate choices in that file, both of which fail silently if undone:
- **`runtimeExecutable` is `sh -c`, not `python3`.** `python3 -m http.server` takes its port
  POSITIONALLY and ignores `$PORT`, so with a bare executable the harness's assigned port is accepted
  and then ignored, and the server keeps trying the hardcoded one. The shell expands it;
  `${PORT:-8899}` keeps the documented default when run by hand, and `exec` stops the shell lingering
  as a stray parent.
- **`autoPort: true`.** Nothing depends on the number — this is static files, with no OAuth callback,
  webhook or CORS origin bound to it. 8899 is frequently already held by an older preview, and
  yielding the port is correct; killing someone else's server is not.

✅ **The site root serves the landing page directly now** (flattened 2026-08-05 14:43 EDT when
dioreo.app went live — `build()` writes `index.html` straight to `public/`). This used to require going
to **`/legal/`** locally, because the real landing page lived there and only `public/_redirects` — a
Cloudflare Pages feature a plain static server doesn't implement — pointed `/` at it. That caveat is
retired: the local preview server now shows the same page at `/` a live deploy does, no redirect needed
either place.

⚠️ **It binds localhost, so it cannot reach a phone.** For device testing run
`python3 -m http.server 8899 --bind 0.0.0.0 --directory public` and browse the machine's LAN address.
