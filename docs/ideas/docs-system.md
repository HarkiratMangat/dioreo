# Dioreo — a documentation system

**A guide and a proposal.** Written 2026-08-05 23:13 EDT out of a mini brainstorming side-session.

> ⚠️ **Nothing here is decided, agreed or committed.** No code has been written and no tool has been
> adopted. This exists so the thinking survives the session and can be argued with later — including
> the conclusion that none of it is worth doing yet, which is a live option and is scored honestly in
> §9. Every recommendation carries its reasoning rather than its authority.
>
> **This document is not the definitive answer and not the end of the discussion.** It is one
> session's thinking, written down. Harkirat is explicitly still open to other ideas, other tools and
> other shapes entirely — including approaches nobody has raised yet — and Claude should keep looking
> rather than treat this file as settled. **Nothing has been concretely planned or outlined.** The
> phases in §7 are a sketch of *an* order, not a chosen one; the "settled" table in §8.1 records
> reasoning that seemed sound at the time and is open to being overturned by a better argument or a
> tool nobody had checked. If a future session finds something that beats what's here, **the right
> response is to change this file, not to defend it.**

**How to read this.** §1–§3 establish where things stand and what any answer has to survive; read those
first, because most conventional documentation advice fails here for reasons that only become obvious
once the constraints are visible. §4 is what the documents actually *are*. §5 is tooling. §6–§8 are
assembly, sequencing and the decisions still outstanding. §9 is the honest case for doing nothing.

---

## 1. Summary

Two questions were asked in one session: *what tooling would build an interactive docs system*, and
*what should that system actually document* — namely a help doc for the bot's commands and a guide to
the admin surfaces (`/manage`, `/autobuild`, Cloudinary caching, the Gemini/Vertex extraction).

**They turn out to have the same answer applied twice.**

- **On tooling:** don't adopt a documentation framework. Extend the generator that already exists. The
  gap is search and structure, not authoring — there are already ~16,400 lines of written prose and
  nobody can search a word of it.
- **On content:** don't write a command reference. **Generate** it from the `SlashCommandBuilder`
  definitions, because that source of truth already exists and any copy of it will drift.

Both are the same principle: **derive from the source of truth; never maintain a second copy of
state.** That is already this project's governing idea — it is why `docs-audit` exists, why the memory
index carries a structural test instead of a file count, and why "no duplicated state in prose" is a
standing rule. It matters more for documentation than anywhere else, because documentation is *entirely*
copied state unless it is deliberately derived.

**If exactly one thing is ever done, do Pagefind** (§5.1). Smallest change, largest reach, no decisions
required, and it cheaply tests whether the "extend rather than replace" premise actually holds.

---

## 2. Where things stand

Measured 2026-08-05 22:50 EDT. Every judgement below rests on these numbers.

| | |
|---|---|
| `scripts/buildLegalPages.js` | **10,037 lines** (+ `scripts/lib/chronicle.js` at 1,177) |
| Prose already written | **~16,400 lines as measured 2026-08-05** — DEVLOG 4,802 · CHANGELOG 4,232 · `.claude/rules/` 3,621 · db-deferred-list 1,547 · `docs/reference/` 1,041 · CLAUDE.md 507 · ROADMAP 451. ⚠️ **A dated snapshot, not live state** — it had already rotted by 2026-08-06 08:32 EDT (DEVLOG 5,242 after the design-history fold; `docs/reference/` smaller by the same move). The figure is here to size the *problem*, and the order of magnitude is what matters. Re-derive with `wc -l` rather than trusting these numbers. |
| Built site | 10 HTML pages, 4.2 MB — including **3 parked `public/changelog/` pages** |
| Search | **None.** All 5 matches for search-library names in the generator are the word "search" in comments |
| Code surface | 12 commands · 32 utils · 6 models |
| Build entry points | **Two** — `dior legal build` (CLI repo) and `npm run site` |

**Read the first row against the second.** This is not a project that lacks a documentation system. It
is a project with a mature bespoke generator and an enormous body of writing that cannot be searched,
navigated or linked into.

### The three content families

`dioreo.app` would carry three families with different audiences, lifecycles and voices. They share a
generator, a search index, a design system and a domain — and nothing else.

| Family | Status | Audience | Lifecycle |
|---|---|---|---|
| **Legal & project documents** — Terms, Privacy, Licence, Notice, Contributing, Contributors | ✅ Live | Anyone; Discord requires two of them public | Rare, binding when it changes |
| **Records** — Changelog, Summary, DEVLOG | ⚠️ **Built, parked, withdrawn from nav** | Maintainers, curious users | Every release |
| **Player help** — the command reference | ❌ Doesn't exist | CODM players arriving from Discord | Must track the code exactly |
| **Admin manual** — `/manage`, `/autobuild`, backend, ops | ❌ Doesn't exist | Harkirat and any successor | Changes when the admin surfaces do |

**That second row is the most important fact in this document.** A docs surface already exists, fully
generated and styled, and is simply unreachable. Any plan that builds something new before reviving
that is solving the wrong problem first.

---

## 3. The constraints that shape every choice

Most "best docs tool" advice is written for a greenfield project with no design opinions and no privacy
posture. Neither applies. **Score any candidate on all five of these before reading its feature list.**

### 3.1 What network requests does it make at runtime?

`docs/legal/PRIVACY.md` §2.6 promises *"no analytics, no third-party scripts."* That is a published,
binding document which Discord requires to be publicly linked. Any tool injecting a third-party script
or calling a third-party endpoint costs a policy amendment, a sub-processor disclosure, a policy
version bump and a site rebuild — **before a line of code is written**.

This is the same trap that disqualified Sentry during the GitHub Student Pack triage, and it recurs
constantly because the tools that violate it are exactly the popular ones. **Ask this before asking
what a tool does.**

### 3.2 Does it emit committable static files?

`public/` is committed build output, served directly by Cloudflare Pages with an **empty build
command**. Anything adopted must write static files into the tree, or the Pages configuration changes —
a separate decision with its own blast radius.

### 3.3 Who owns the design?

There is already a 10k-line generator carrying a real visual identity: the metaball nav, the accent
system, sticky headings, measured a11y and contrast rules. A tool bringing its own opinionated theme
means **two design systems on one domain**. That is a permanent tax, not a one-time cost.

### 3.4 How many build entry points does it add?

There are already **two**, and that duplication has already produced a real defect — the CLI path, the
one that actually publishes, was for a time the *less* safe of the two. A third is a liability with a
known failure mode in this repo.

### 3.5 Can its content silently go stale?

The criterion generic advice omits and this project cares about most. The entire records culture here —
`docs-audit`, hook coverage, the conservation rule — exists because a document that drifts is worse
than no document: **it manufactures confidence.** Prefer tools whose content is derived from a source
of truth, and prefer a gate that fails when coverage shrinks over a convention that asks someone to
remember.

---

## 4. What the documents should be

Two products. Conflating them is the main way this goes wrong.

| | **Doc A — Player help** | **Doc B — Admin manual** |
|---|---|---|
| **Reader** | A CODM player who found the bot in Discord | Harkirat, and any future admin or successor |
| **Arrives** | From a link in the bot, or a search engine | Deliberately, already knowing it exists |
| **Their question** | *"What does `/draws` do, and why is it showing me this?"* | *"How do I add a season's draws without breaking the cache?"* |
| **Reads** | One page, scanning, on a phone, mid-conversation | Start to finish once, then returns to one step |
| **Voice** | Plain, short, example-first, no jargon | Procedural, precise, consequence-aware; assumes competence |
| **Failure mode** | **Drift** — it describes a command that changed | **Incompleteness** — the one step needed isn't there |
| **Length tolerance** | Very low | High, if well-sectioned |

The two failure modes differ, so the two defences differ: **Doc A needs generation and a coverage gate.
Doc B needs a completeness pass and a maintenance trigger.**

### 4.1 Doc A — the player-facing command help

#### Generate it, don't write it

Every one of the 12 `commands/*.js` modules exports `data: new SlashCommandBuilder()` carrying
`.setName()`, `.setDescription()`, typed options each with their own description, `addChoices()`
values, required flags, and `setIntegrationTypes()`. Verified 2026-08-05 — `commands/draws.js`:

```js
data: new SlashCommandBuilder()
    .setName('draws')
    .setDescription('View new and returning draws this season')
    .addStringOption(o => o.setName('page')
        .setDescription('Jump directly to New Draws or Returning Draws')
        .addChoices({ name: 'New Draws', value: 'new' }, { name: 'Returning Draws', value: 'returning' }))
    .addBooleanOption(o => o.setName('hidden')
        .setDescription('True = only you can see this response. False = everyone in the chat can see it.'))
```

**Those option descriptions are already written in player-facing voice.** The command reference is
substantially authored already — it is just trapped inside the code, surfacing only in Discord's option
hints where nobody reads it carefully.

**So: `require()` all 12 modules, call `.data.toJSON()`, emit `commands.json`, render the site from
it.**

Why this matters beyond convenience: **Discord renders its own command picker from that same object.**
Documentation generated from it therefore *cannot drift from what the user sees in the client*.
Hand-written command docs always drift — that is their defining failure mode in every project that has
ever had them. This removes it **structurally rather than by discipline**, which is the principle
behind every gate in this repo. Rename an option and the docs change on the next build with nobody
touching a markdown file; add a command and it appears — bare, but present and correct.

#### The split

| Generated — never drifts | Hand-written overlay — the actual value |
|---|---|
| Command name and description | What it's *for*, in one sentence a player recognises |
| Every option: name, type, description, required flag | **Quirks** — why a result looks odd, what the edge cases are |
| Choice values and display names | Worked examples with real inputs and outputs |
| User-install availability / context | Screenshots or rendered output |
| Admin-only status | Cross-links: "if you wanted X, use `/y` instead" |
| Subcommand tree | Known limitations, and what is deliberately unsupported |

#### The overlay pattern

One file per command — `docs/help/<command>.md` — holding **only** what cannot be generated. The build
merges spec + overlay into a page. Two properties worth designing for deliberately:

1. **A command with no overlay still produces a usable page.** Spec-only is thin, not broken. The
   system is never in a failed state, only an incomplete one — so it ships after the *first* overlay
   rather than the twelfth.
2. **An overlay for a command that no longer exists is an error, not a stale page.** Deletion must be
   loud.

#### The gate that keeps it alive

A `docs-audit` check asserting **every command in `commands/` has an overlay, and every overlay maps to
a real command** — the same shape as the hook-coverage check in `.claude/hooks/run-all-tests.sh`, and
for the same reason: coverage computed from what is on disk means deleting a file **fails** the suite
rather than quietly shrinking it.

This repo has already paid for both halves of that lesson: six self-tests that nothing invoked, and a
gate that fired too late to prevent anything. Without this check, a new undocumented command ships
silently — which is precisely how documentation stops being trustworthy.

Two refinements worth considering: **WARN on a thin overlay, ERROR on a missing one**, so "exists but
says nothing" is visible without blocking; and **assert each overlay mentions every option by name**,
since an option added later and left undocumented is the most common real drift.

#### The 12 commands

Sketch only — real content comes from the rules files and from using the bot.

| Command | What its overlay owes a reader |
|---|---|
| `/draws` | New vs Returning framing; what "this season" means and when it rolls over |
| `/draw prices` | The CP pricing model; the Advanced Double Legendary page and why it's separate |
| `/dmz` | DMZ loadouts vs MP; the partial-slot caveat |
| `/calendar` | The All-Season view; what Events vs other pages contain |
| `/patch notes` | Multi-season navigation; why images sometimes don't load *(known issue)* |
| `/seasonend` | Countdown semantics; timezone handling |
| `/timestamp` | The style dropdown, `view`, and why Discord renders it per-viewer |
| `/settings` | Author-lock, region mode, the passive idle-timeout auto-disable |
| `/colors` | Accent extraction, the View Colors panel, Refresh Colors and its cooldown |
| `/alerts` | Admin-facing — likely belongs in Doc B |
| `/manage` | Admin-only — Doc B |
| `/autobuild` | Admin-only — Doc B |

**That table answers a design question by itself:** three of twelve are admin surfaces, so the help
index must **partition by audience** rather than list all twelve to a player. The
`setIntegrationTypes` and permission data in the generated spec can drive that partition automatically,
so the split cannot drift either.

#### The interactive layer

Ascending cost, each independently shippable.

1. **Dev-bot screenshots.** `Dioreo (Dev)` exists precisely so real output can be produced without
   touching prod. Free and honest. ⚠️ Screenshots are the classic docs-rot vector — they age silently
   and nothing checks them. If used, record which version each was captured at, so staleness is at
   least *detectable*.
2. **Short GIFs for multi-step flows.** `gifski` and `gifsicle` are already installed. A six-second GIF
   of a pagination or dropdown interaction beats four hundred words, and for state transitions it isn't
   close.
3. **Render real Components V2 payloads to HTML.** The prize, and the only screenshot-equivalent that
   satisfies §3.5 — because it is generated from the same code path the bot uses, it cannot go stale.
   Nothing off-the-shelf does this, and for a Discord bot it is the most convincing thing a help page
   can contain: the reader sees the artefact, not a description of it. Expanded below, because "just
   render the payloads" hides four real problems.

   **The load-bearing design rule: call the real render path, never reimplement it.** If the docs build
   imports the same `utils/` builders the bot uses, the output is correct by construction. If it
   reimplements V2-to-HTML separately, it is **worse than a screenshot** — a second implementation that
   looks authoritative and drifts silently, which is the precise failure §3.5 exists to prevent. This
   single decision determines whether the feature is the best thing in the system or the worst.

   **Where fixtures come from.** Two options with different trade-offs. *Hand-written fixture JSON* is
   stable, reviewable and diffable, but is itself a copy of state that can drift from what the models
   actually hold. *Captured from the dev bot* is real but bulky, and snapshots age. A reasonable middle:
   capture once from the dev bot, commit the result as a fixture, and add a check that the fixture still
   satisfies the current Mongoose schema — which reuses the schema as the source of truth rather than
   adding a new one.

   ⚠️ **The emoji trap, which is specific to this codebase and easy to walk into.** Emoji ids are
   captured at **render** time, never at require time, because a module-level literal freezes whatever
   id was loaded first — which is the **prod** id. A docs build rendering V2 payloads would hit exactly
   this: either it needs a live client to resolve emoji, or it renders broken emoji, or it hardcodes
   prod ids into published HTML. `scripts/checkEmojiCaptures.js` already exists and CI already runs it;
   any renderer must be brought under the same rule rather than discovering it later.

   ⚠️ **The 40-component recursive limit.** Discord caps a V2 message at 40 components counted
   recursively, and exceeding it has caused a real production crash, which is why long lists are
   chunked. A docs page showing a full render must either respect the same chunking or make clear it is
   showing one page of several — otherwise the documentation depicts a message the bot cannot actually
   send.

   **Interactivity is the open question.** Buttons, selects and pagination cannot function in static
   HTML. Three honest answers: render the default state only and say so; render each state as a separate
   static frame with the reader stepping through them; or accept a small amount of page JS to switch
   between pre-rendered states — which is still §3.1-clean, since it is first-party and ships no
   third-party request. **The third is probably right**, but it is the first place in this plan where
   shipping any JS at all gets argued for, so it deserves a deliberate decision rather than drift.

### 4.2 Doc B — the admin operations manual

#### The source material exists; it is just written for an agent

Almost none of this needs research. It needs **re-shaping for a human operator**.

| Topic | Where the knowledge already lives |
|---|---|
| `/manage`: pages, add / bulk / edit / delete, purge, export, patch-notes single-entry, per-page accents, the admin lock | `.claude/rules/manage-panel.md` |
| `/autobuild`: the pipeline, the Gemini → Vertex migration, live-test fixes, open follow-ups | `.claude/rules/autobuild.md` |
| Cloudinary caching, the image workflow, structured metadata, **the secret-logging ban** | `.claude/rules/loadout-images-and-metadata.md` |
| `/draw prices` data model and final layout | `.claude/rules/draw-prices.md` |
| Settings, author-lock, passive expiry, region mode | `.claude/rules/settings-and-expiry.md` |
| Data models and **the schema-save gotcha** | `.claude/rules/models.md` |
| Loadouts, badges, autocomplete, category synonyms | `.claude/rules/loadouts.md` |
| VM, systemd, deploy, alerting, monitoring, the dev bot | `docs/reference/deployment-and-ops.md` |
| Emoji capture-at-render-time | `project_emoji_require_time_capture` memory + `scripts/checkEmojiCaptures.js` |

**The translation problem is real and worth naming.** These files are written to stop an agent making a
specific mistake, so they lead with the prohibition and the incident. A human operator needs the
opposite order: *here is the task, here are the steps, here is what will bite you.* A copy-paste job
produces a collection of warning labels, not a manual.

#### Proposed structure

1. **Orientation** — what the bot is, what it stores, where it runs, what the admin surfaces are. One
   page, read once.
2. **Routine data work** — the repeated tasks: adding a season's draws, updating patch notes, adding a
   loadout, correcting a bad entry. **Task-shaped, not feature-shaped.**
3. **`/manage` reference** — page by page, a GIF per flow. The feature-shaped counterpart to (2), for
   when you know what you want and need the exact steps.
4. **`/autobuild`** — the pipeline end to end: attachment → Vertex extraction → fuzzy match →
   confirm/edit review → write. What to do when extraction is wrong, and why the review step is
   non-optional.
5. **Backend behaviour you must understand to avoid breaking things** — Cloudinary caching and its
   invalidation triggers, the schema-save gotcha, emoji capture timing, the three-tier error model.
6. **Operations** — deploy, status, logs, alerts, the dev bot, what to do when the VM misbehaves.
7. **Troubleshooting runbook** — symptom → likely cause → check → fix. The section used at 2 a.m.,
   reachable in one click from anywhere.

Sections 1–5 are new writing; §6 overlaps the already-filed ops-guide item; §7 can be assembled largely
from `docs/reference/platform-constraints.md` and the DEVLOG's war stories.

#### The fork that must be decided first: public or private?

`/manage` is admin-locked by Discord ID, so **nothing here depends on obscurity for security**, and the
source is public anyway. But publishing broadcasts the operational workflow.

| Option | For | Against |
|---|---|---|
| **Public on `dioreo.app`** | Simplest; consistent with a source-available project; search and nav for free | Broadcasts the workflow; invites "why can't I use `/manage`" |
| **Repo-only markdown** | Zero build work; diffable; versioned with the code | No search, no rendered diagrams, no nav — the retrieval problem stays |
| **Built but unlinked** | Exactly what `public/changelog/` is today, so precedent exists; full tooling, low discoverability | Security by obscurity — honest only if nothing depends on it, which here it doesn't |
| **Cloudflare Access on a path** | Real access control; free at this scale | Adds an auth dependency to a site whose selling point is static files and nothing else |

**No recommendation offered, deliberately.** This is a values call about how open the project is, not a
technical one.

#### ⚠️ What must never be published, whichever way that goes

- **Account identifiers.** `docs/reference/deployment-and-ops.md` contains a **GCP billing account ID**.
  It is not a credential and cannot be used to charge anything — this is not an incident — but it must
  not propagate into a document written for a wider audience. Carry the *procedure*, never the
  identifiers. Same for service-account emails, VM instance names, webhook URLs, database hostnames.
- **Raw error objects.** A troubleshooting section that says "paste the error" is a genuine
  credential-leak vector here: the Cloudinary Admin API's rejected promise carries the account's **live
  API key and secret** in plaintext, which is why the codebase has a hard invariant about it. The
  guide must say *sanitised message*, explicitly, every time it asks for an error.

### 4.3 How each document dies, and the defence

| Document | Death | Defence |
|---|---|---|
| Doc A | A command changes; the page doesn't | Generate the spec; gate the overlays; render output from live code, not screenshots |
| Doc A | Screenshots age silently | Prefer generated V2 renders; stamp versions on any real screenshot |
| Doc B | Written once, never touched again | Tie it to a trigger — any change to `/manage`, `/autobuild`, the Cloudinary flow or a model requires a doc pass in the same change, exactly as `PRIVACY.md` is tied to `UserPreference` |
| Doc B | Grows into an unnavigable wall | Task-shaped sections separate from feature-shaped reference, plus search |
| Both | Written for the wrong reader | Draft, then re-read *as* that reader — Doc A on a phone mid-conversation, Doc B at 2 a.m. with something broken |

### 4.4 Distribution — how anyone finds these documents at all

**Everything above silently assumes the reader arrives.** Nothing in this plan says how, and for Doc A
that is the highest-leverage unanswered question in the whole document. **A help site unreachable from
inside Discord is a help site nobody reads** — and the readers are, by definition, already in Discord
when the question occurs to them. A perfect command reference nobody can find loses to a mediocre one
linked from the bot.

#### The idea that ties the system together

`commands.json` (§4.1) does not have to feed only the website. **It can feed an in-Discord surface
too — one derived source, two presentations, neither able to drift from the other or from the bot.**
That is the strongest single idea in this document, and until now it was a footnote.

#### Options, cheapest first

1. **A link in existing command responses.** A subtle footer or a button on the panels that already
   render. Zero new commands, no new surface to maintain, and it reaches people at the exact moment
   they are confused. Cheapest and probably highest-yield.
2. **The bot's App Directory listing and profile description.** Free, static, already exists as a
   field, and currently doing no work.
3. **A `/help` command.** Lists the player-facing commands with one-line descriptions and links,
   generated from the same `commands.json`. Respects the existing `hidden` convention so it can default
   to ephemeral.
4. **Per-command deep links** — `/help command:draws` returning that command's summary inline plus a
   link to the full page. The richest, and the most work.

#### Constraints any in-Discord surface inherits

- **User-installed only.** The bot has no guild presence and no standing permissions, so anything here
  must ride the interaction-response mechanism like every other command.
- **The 40-component recursive limit** applies to a `/help` panel exactly as it does elsewhere; twelve
  commands with buttons will approach it.
- **Ephemeral by default** is almost certainly right — help is for the asker, not the channel.

#### ⚠️ The scope difference worth naming

Options 1, 3 and 4 are **bot features**, not documentation. They change code, need testing on the dev
bot, and require a **deploy** — unlike everything else in this plan, which is docs-only and ships with
a site publish. That makes distribution the one part of this system that touches the running bot, and
it should be scoped and scheduled as bot work rather than folded in as a docs task.

#### Discoverability outside Discord

Doc A's pages are public and indexable, and a player searching the web for a specific CODM question is
a real arrival path with nothing to land on today. This is the same family of problem as the missing
share descriptions fixed in v2.55.2 — worth handling deliberately (titles, descriptions, structured
headings) rather than discovering later that every help page shares one generic preview.

---

## 5. Tooling

### 5.1 Tier 1 — highest value

**Pagefind — the single biggest gap.** Static search that indexes the **built HTML** after the build
completes, then ships a self-contained JS + WASM bundle into `public/`. No server, no account, no index
to host, and **zero third-party requests**. Explicitly designed to bolt onto any generator including a
hand-rolled one, so `buildLegalPages.js` doesn't change — you add a post-build step and a search input.

```bash
npx pagefind --site public          # after the existing build writes public/
```

Roughly one devDependency, one line in the build script, one input element and a small init snippet in
the page template. An optional prebuilt UI component exists if styling a result list from scratch isn't
appealing.

**How it actually works**, because it shapes three decisions below: it crawls the finished HTML, honours
`data-pagefind-body` to decide what counts as content, and **fragments the index** so a browser
downloads only the shards a given query needs. A 4.2 MB site therefore does not mean a 4.2 MB download —
which is what makes static search viable at all at this size.

**⚠️ The multi-audience problem — unaddressed until now, and it needs deciding at adoption.** There are
three content families today and four under this plan (§2), all landing in **one index**. A player
searching *"purge"* must not be dropped into the admin manual; someone looking for a licence clause must
not get a DEVLOG war story. Pagefind supports **filters** via `data-pagefind-filter` attributes, so the
generator would tag each page with its family and the UI would default-scope to wherever the reader
already is, with an explicit "search everything" escape. Small work, but not zero — and far cheaper
decided now than retrofitted once four families are indexed.

**⚠️ Exclude the chrome, or every result matches every page.** `data-pagefind-ignore` needs to go on the
nav, the footer and the metaball furniture. Without it the shared navigation text appears in every page's
indexed body and relevance collapses. This is the single most common way a first Pagefind integration
disappoints, and it looks like "the search is bad" rather than "the index is wrong."

**⚠️ It lands in the middle of §3.4 immediately.** Pagefind is a *post-build* step, so it must be added
to **both** `dior legal build` and `npm run site`. Miss the CLI one — the path that actually publishes —
and the site ships unindexed while local builds look fine. That is the existing two-entry-point defect
recurring, which is precisely why this makes a good first phase: it exercises the riskiest structural
weakness in the build on the cheapest possible change.

**One thing to decide, not discover: does the index get committed?** `public/` is committed build output,
so consistency says yes — but a search index is a pile of generated shards, and committing it adds real
diff noise to every documentation change and puts it under CI's `public/`-staleness comparison. The
alternative, generating it at deploy time, conflicts with Cloudflare Pages running an empty build
command. **Committing is probably right**; the point is to choose deliberately rather than find out via
a 400-file diff.

16,400 lines of unsearchable prose is the actual problem, and this is the cheapest possible fix. It is
also a good *first* move for a second reason: it honestly tests whether extending a 10k-line generator
is comfortable. If it's painful, that is real evidence for reconsidering the generator — far better
learned here than three document families in.

> ⚠️ **The corollary matters as much as the recommendation.** Algolia DocSearch is the obvious
> alternative, is free for docs sites, and is **wrong here** — a third-party script making third-party
> requests, falsifying §2.6 exactly as Sentry would. Pagefind costs nothing in policy terms because
> nothing leaves the reader's browser.

**Revive `public/changelog/`.** Three pages already built, already styled, currently unreachable.
Cheaper than anything new. Two coupled facts to handle when they become reachable: CI deliberately
**excludes** `public/changelog/` from the `public/`-staleness gate, and `deploy-site.yml` deliberately
**skips** changelog-only changes. Both were correct for pages nobody could reach and both become wrong
the moment somebody can.

**D2 for diagrams — not Mermaid.** D2 (`terrastruct/d2`) is a CLI emitting **SVG at build time**.
Mermaid's usual integration is a runtime renderer — a third-party script by another name, and even
self-hosted it is a JS bundle doing layout in the reader's browser. Build-time SVG sidesteps §3.1
entirely and keeps pages zero-JS. Pair with **`svgo`**, since the output gets committed.

```bash
d2 --theme 200 docs/diagrams/router.d2 public/img/router.svg
```

Worth diagramming: the interaction router, the three-tier error model, the loadout/Cloudinary pipeline,
the autobuild extraction flow.

### 5.2 Tier 2 — quality and correctness

Unglamorous, and what actually keeps 16,400 lines from rotting.

- **`lychee`** (Rust, fast) — link checker. `docs-audit`'s `xref` check already verifies repo paths
  named in docs, but **external URL rot is uncovered**, and a docs site is mostly links.
- **`vale`** — prose linter with configurable rules, fully offline. For a project this opinionated about
  voice, Vale is what makes "voice" **enforceable rather than aspirational**. Three specific jobs here,
  in descending order of value:

  1. **The rename is a documented rule with no gate behind it.** CLAUDE.md states plainly: *"Use
     'Dioreo' everywhere in new writing."* Nothing checks that. Vale can, and it is exactly the class of
     rule this project otherwise turns into a hook.
     ⚠️ **But a naive rule would be wrong**, and the reason is the interesting part. The record files —
     `CHANGELOG.md`, `CHANGELOG-SUMMARY.md`, `DEVLOG.md`, `docs/archive/**` and the dated specs —
     **deliberately keep the old name**, because that is what the project was called when those entries
     were written; the rename is recorded as a milestone, never backdated. A repo-wide rule would fire
     on thousands of *correct* historical lines, get muted within a day, and end up worse than nothing.
     The rule must be **path-scoped to new writing only**, mirroring the boundary CLAUDE.md already
     draws. That boundary is the whole design of the check.
  2. **Two documents, two voices** (§4). Doc A is plain, short, example-first; Doc B is procedural and
     assumes competence. Vale configs can be scoped by path, so `docs/help/**` and `docs/admin/**` can
     carry genuinely different rules — sentence length and jargon limits on one, precision and
     imperative mood on the other.
  3. **The generic wins** — banned filler, weasel words, inconsistent terminology.

  ⚠️ **Where Vale projects die is rule tuning.** Importing a large third-party style package produces
  hundreds of findings on day one, all of them ignorable, and the tool gets switched off. Start with
  **one rule that matters** — the rename — prove it fires correctly on new writing and stays silent on
  the records, and only then add more.
- **`markdownlint-cli2`** — structural consistency. Cheap, boring, catches heading-level drift, which
  `docs-audit`'s `record-structure` check already proved matters here.
- **`shiki`** — syntax highlighting at **build time**, emitting styled HTML. The alternatives (Prism,
  highlight.js) ship a runtime script. Any docs site showing code needs this, and choosing the
  build-time option early avoids a §3.1 collision later.
- **`remark` / `rehype`** — the markdown AST ecosystem. Not needed today, but the natural upgrade path
  if `chronicle.js` outgrows string manipulation. Worth knowing exists before hand-rolling a parser.

### 5.3 Tier 3 — code-derived content

- **`dependency-cruiser`** (or the lighter `madge`) — module graph → SVG, and, more importantly, the
  ability to **assert architectural rules in CI**.

  **Be honest about why it is on a documentation list:** it produces a diagram. But the diagram is the
  lesser half, and its value *decays* as the graph grows, whereas the rules get more valuable. At 12
  commands / 32 utils / 6 models the picture is still legible; it will not always be.

  *Invariants plausibly worth asserting here* — each would need checking against the real import graph
  before being encoded, since a rule that codifies a violation is worse than none: no `commands/`
  module importing from `scripts/` (build and migration tooling should never be on the bot's runtime
  path); no `utils/` module importing from `commands/` (layering — utilities should not depend on their
  callers); and no orphan modules, which quietly accumulate and are exactly what a "dead code" question
  is usually asking about.

  **The framing that justifies it:** this is *architecture testing* that happens to emit a picture, not
  documentation that happens to check things. If it earns a place, it earns it in CI.
- **`codebase-memory-mcp`** — already installed and indexing this repo. `get_architecture`,
  `search_graph` and `trace_path` can **feed** an architecture page rather than adding a new tool.
- **Skip JSDoc / TypeDoc.** This is a bot, not a library — nobody imports it, so the API surface isn't
  where the value is. The quirks and the reasoning are, and those are prose that already exists.

### 5.4 MCPs

**No MCP is needed to build a docs site, and that is worth saying plainly.** MCPs help *author and
retrieve*; they do not *generate*. The relevant ones are already installed: `codebase-memory-mcp` for
structural queries feeding architecture content, `context7` for current framework docs *if* a framework
is ever adopted, and `linksee`/`perseus-vault` for recalling prior decisions during the writing pass.
Nothing new should be installed for this.

### 5.5 Services

| Service | Verdict |
|---|---|
| **Cloudflare Pages** | Already in use, already auto-deploying, free at this scale. No reason to move |
| **Cloudflare Web Analytics** | The only analytics not requiring a §2.6 amendment — cookieless, first-party. Available if ever wanted; not needed |
| **Cloudflare Access** | Real access control if any part should be gated. Free at this scale, but adds an auth dependency to a static site |
| **Netlify / Vercel** | No advantage over what works. Migration for its own sake |
| **GitHub Pages** | Strictly worse — Cloudflare Pages is already wired with a custom domain and auto-deploy |
| **Mintlify** | Declined *here*, but on hosting rather than quality — it is the strongest "just buy it" candidate and gets a full treatment in **§5.9**, including a capability this plan cannot match |
| **GitBook / ReadMe / Notion** | Declined — content leaves the repo, so it drifts from the code and stops being diffable. See §5.8 |
| **Read the Docs** | Sphinx/Python-oriented. Wrong ecosystem |

### 5.6 Apps — and one genuinely good find

**Obsidian is already compatible with this project's markdown corpus, today, with zero build work.**

The memory store and `CLAUDE.md` already use `[[wikilink]]` syntax — `[[feedback_verify_before_claiming]]`,
`[[project_git_workflow]]` — which is Obsidian's *native* link format. Pointing it at
`~/.claude/projects/-Applications-Claude-Code-Diors-Builds/memory/` renders that whole store as a
navigable, backlinked graph immediately: no conversion, no build, no publishing. The `.claude/rules/`
files and `docs/` cross-reference each other heavily and would benefit the same way.

This is an **authoring and exploration** tool, not a publishing one — which is exactly the gap it
fills, because the retrieval problem is as bad locally as it is on the site. Worth twenty minutes
before building anything.

*What it actually gives:* the wikilink graph rendered and navigable, **backlinks** (which memory files
currently have no way to show — you can see what a file links *to*, never what links *at* it), instant
local search across the whole corpus, and an outline view over documents like DEVLOG that are far past
the length where scrolling works.

*Where it fits best:* point it at the memory store first, since that corpus is already
wikilink-native. `.claude/rules/` and `docs/` cross-reference each other heavily by path rather than by
wikilink, so they gain less automatically — though Obsidian's unlinked-mentions view surfaces those
too.

⚠️ **Two practical gotchas worth knowing before opening a vault:**
- Obsidian writes a **`.obsidian/` config directory into whatever folder you open as a vault.** Opening
  the memory store or the repo root creates an untracked directory there; gitignore it, or open a parent
  folder instead. Minor, but surprising the first time.
- **Do not casually edit memory files in it.** Their frontmatter shape (`name`, `description`,
  `metadata.type`) is load-bearing and read by tooling; Obsidian's property editor can normalise YAML in
  ways nothing here expects. Read freely, write carefully.

*What it is not:* a publishing path. Obsidian Publish exists, is hosted and paid, and gets exactly the
§5.9 analysis — it would be a second site with a third party in front of it.

Others: **MarkEdit** (already in use for the notes file — keep). Nothing else earns a place.

### 5.7 If a framework is wanted anyway

Fair to consider, so scored honestly against §3.

**Astro + Starlight — the only one worth taking seriously**, and worth the same full treatment as
Mintlify got in §5.9, because it is the serious *self-hosted* alternative in the way Mintlify is the
serious hosted one.

*What it gives:* islands architecture with **zero JS by default**, **Pagefind built in** rather than
bolted on, native Cloudflare Pages deploy producing committable static output, strong a11y defaults,
and — the part that matters most here — it renders existing markdown under a **custom layout**, so
this site's identity is portable rather than discarded. It also brings **content collections with
schema-validated frontmatter**, which is genuinely hard to replicate by hand: a typed contract for
every document, failing the build when a page is missing a required field. For a system built around
"derive, don't copy", that is philosophically aligned rather than merely convenient.

*Scored:* passes §3.1 (zero third-party at runtime), §3.2 (static, committable) and §3.5 (markdown in
git, schema-validated). Costs §3.3 and §3.4 — **unless it fully replaces the existing generator**,
which is the whole difficulty.

*The honest migration cost:* 10,037 lines of rendering logic, plus `chronicle.js`, plus the metaball
nav, the accent system, the measured contrast rules and the sticky headings. None of that is
markdown — it is bespoke rendering that would have to be ported to Astro components. That is not a
weekend, and a half-finished port leaves the site in a state where neither system fully owns it.

> ⚠️ **The partial-adoption trap.** "Use Astro for the new families and keep the existing generator for
> legal and records" sounds like the pragmatic middle and is **the two-design-systems problem wearing a
> disguise**. It also makes §3.4 strictly worse — three build entry points instead of two — and puts the
> seam directly between the pages a reader navigates between. If Astro is ever adopted, it should be
> adopted wholly, as a deliberate migration with the identity ported first.

*When it becomes the right answer:* if the generator becomes the actual bottleneck rather than a
suspected one — the honest test being whether Phase 0 (§7) is painful — or if a second person ever has
to maintain this, at which point "a maintained framework everyone knows" beats "10k bespoke lines only
one person has read."
- **11ty (Eleventy)** — the choice if the goal is migrating the hand-rolled builder to something
  maintained *without* changing the output much. No framework lock-in, plain JS, philosophically
  closest to what exists. The lowest-violence migration path available.
- **Docusaurus / VitePress** — decline. Too visually opinionated for a site carrying this much custom
  design; both fail §3.3 outright.

### 5.8 Rejected, with reasons

| Rejected | Why |
|---|---|
| Docusaurus / VitePress | Two design systems on one domain; too opinionated for this identity |
| **Mintlify** | Genuinely docs-as-code, so it is **not** the same category as the row below — see **§5.9**, which examines it properly and corrects an earlier mistake |
| GitBook / ReadMe / Notion | Content leaves the repo → drifts from the code, stops being diffable — plus third-party scripts. Fails §3.1, §3.2 and §3.5 together |
| Algolia DocSearch | Third-party script → falsifies `PRIVACY.md` §2.6 |
| Mermaid runtime rendering | Same problem; use D2's build-time SVG |
| Prism / highlight.js | Runtime highlighting; use Shiki at build time |
| JSDoc / TypeDoc | Nobody imports this project; API surface isn't where the value is |
| Hosted analytics on the docs | Same §2.6 problem; Cloudflare Web Analytics is the only acceptable option, and isn't needed |
| A new MCP for docs | MCPs author and retrieve; they don't build. The useful ones are installed |

### 5.9 A closer look — Mintlify, and hosted docs platforms generally

Worth its own section for two reasons: it is the strongest candidate in the "just buy it" category, and
an earlier version of this analysis got it wrong.

#### The correction

An earlier draft grouped Mintlify with GitBook, ReadMe and Notion under *"content leaves the repo."*
**That is wrong for Mintlify.** It is genuinely docs-as-code — the MDX lives in your own git repo, with
PR previews and a local dev server. On §3.5, the criterion this document weighs most heavily, Mintlify
is **strong, not weak**. Bracketing it with WYSIWYG-database tools was a lazy grouping and the reasoning
below replaces it.

#### Where it genuinely wins — stated properly, not strawmanned

- **Time-to-good.** A polished, navigable, searchable docs site in an afternoon, against weeks of
  extending a hand-rolled generator. This is real, and it is the main honest reason people choose it.
- **Someone else maintains it.** No 10,037-line generator to own, no build pipeline to debug.
- **AI chat over the docs — and nothing in this plan replicates it.** Pagefind gives keyword search. It
  does *not* answer *"why does the indicator flicker on my iPhone."* If conversational Q&A over the
  documentation is genuinely wanted, §5.1 has no equivalent and this document should not pretend
  otherwise. That is a real capability gap, not a rounding error.
- **Docs-as-code discipline** — PR previews, versioned with the code, reviewable in a diff.

#### What rules it out *here* — a different axis entirely

Not quality, and not drift. **Hosting.** Mintlify serves the pages, which means its search backend, its
analytics, and its AI chat (an LLM call per reader question) all run against your readers.

| Criterion | Verdict |
|---|---|
| **§3.1 network requests** | **Decisive.** This is not a script you can strip out — it *is* the product. Against a published, Discord-required promise of *"no analytics, no third-party scripts"* on the same brand, it collides directly |
| **§3.2 committable static output** | Fails. There is no `public/` to commit; they host. Cloudflare Pages becomes redundant for the docs, or you run two hosting stacks under one brand |
| **§3.3 design ownership** | Fails by design. Not designing it is precisely what you are buying — which collides head-on with 10k lines of bespoke identity. The result is two sites that look nothing like each other |
| **§3.4 build entry points** | Adds a third, and one you do not control |
| **§3.5 drift** | **Passes** — genuinely a strength |

Two of its headline features are also **dead weight here**: the API playground built from an OpenAPI
spec (this project has no HTTP API at all), and versioned/i18n docs (not needed now).

#### The framing that actually decides it

**Mintlify is the right answer for a project that wants documentation and does not want to own a
website. Dioreo already owns one** — with a design identity, a privacy posture, and a working deploy
pipeline. The cost was never the subscription. The cost is that you would have **two sites**.

#### The middle path worth keeping on the table

Use a hosted platform for the **admin manual only**. It dodges three of the four objections at once:
separate domain, audience of one, design identity irrelevant — and §2.6 is a promise about *this*
website, so a separate internal site plausibly is not engaged by it.

⚠️ **Read §2.6's exact wording before relying on that**, rather than assuming it. And weigh the
counter-argument: the admin manual exists largely for bus-factor reasons, and putting it behind a
vendor cuts against that.

#### What to verify before committing either way

Do not act on recalled specifics — offers and features rotate, and this analysis was written against a
knowledge cutoff:

1. **The current tier structure**, and what is actually included at the free / open-source level.
2. **Whether any static export or self-host path exists.** If it does, the §3.1 and §3.2 verdicts above
   change substantially, and this section should be rewritten rather than cited.

#### The generalisable rule

This reasoning is not really about one vendor. **For any hosted documentation platform, the question is
not "is it good" — it usually is — but "does this project already own the surface it would replace?"**
Where the answer is yes, a hosted platform does not add a docs site; it adds a *second* site, with a
second design, a second deploy path, and a third party between you and your readers. Where the answer
is no, it is very likely the correct choice.

---

## 6. The system, assembled

### 6.1 Information architecture

Sketch, not a commitment — nav staging on this site is measured rather than guessed, so this would need
the same treatment.

```
dioreo.app/
├─ /                     Homepage (live)
├─ /help/                Player help          ← NEW
│   ├─ /help/draws
│   ├─ /help/calendar
│   └─ …one page per player-facing command, generated + overlay
├─ /admin/               Admin manual         ← NEW, audience decision pending (§4.2)
│   ├─ /admin/manage
│   ├─ /admin/autobuild
│   ├─ /admin/backend
│   └─ /admin/runbook
├─ /changelog/           Records (built, currently unlinked)
│   ├─ /changelog/detailed
│   └─ /changelog/devlog
└─ /terms /privacy /license /notice /contributing /contributors   (live)
```

URLs are already flat (`/terms`, not `/legal/terms`) since the 2026-08-05 domain move, so `/help/x` and
`/admin/x` are the consistent extension rather than a regression to nesting.

### 6.2 The build pipeline

**Everything below is build-time. The published page ships zero third-party JS.**

```
SOURCES                              DERIVED                        OUTPUT
───────────────────────────────────────────────────────────────────────────────
docs/legal/*.md          ┐
LICENSE NOTICE           │
CONTRIBUTING CONTRIBUTORS├──────────►                          ┐
docs/CHANGELOG*.md       │                                     │
docs/DEVLOG.md           ┘                                     │
                                                               │
commands/*.js ──► require() + .data.toJSON() ──► commands.json ├──► buildLegalPages.js ──► public/
docs/help/*.md   (overlay prose) ─────────────────────────────►│
docs/admin/*.md  (manual prose) ──────────────────────────────►│
docs/diagrams/*.d2 ──► d2 ──► svgo ──► public/img/*.svg ──────►│
fixtures/*.json ──► V2 render ──► static HTML ────────────────►┘
                                                                        │
                                                                        ▼
                                                            npx pagefind --site public
                                                                        │
                                                                        ▼
                                                          commit public/ ──► Cloudflare Pages
```

Three things this makes visible that prose doesn't:

1. **Pagefind runs last, over finished HTML.** That is why it works with a hand-rolled generator, and
   why it's the cheapest addition — it doesn't care how the HTML was made.
2. **Every derived artefact is produced at build time**, so nothing is fetched or computed in the
   reader's browser. §3.1 stays satisfied *by construction* rather than by vigilance.
3. **`commands.json` is derived, not a source.** Never hand-edited, never authoritative — the same
   relationship `public/` has to its sources today.

### 6.3 What this touches in existing machinery

Easy to underestimate; none of it is optional if the system ships.

| Machinery | What has to change |
|---|---|
| **`scripts/buildLegalPages.js`** | Gains three content families. Already 10k lines — the moment to consider splitting it into modules, itself a real refactor with real risk |
| **Both build entry points** | `dior legal build` and `npm run site` must **both** gain any new step or they diverge. This has already caused one real defect |
| **`.github/workflows/ci.yml`** | The `public/`-staleness gate excludes `public/changelog/`. New output dirs must be **explicitly** included or excluded — silence means "included", and a wrong default either fails every PR or hides real staleness |
| **`.github/workflows/deploy-site.yml`** | Path filters deliberately skip changelog/devlog-only changes. `docs/help/**` and `docs/admin/**` must be added as publish triggers, or docs edits never reach the site — the exact failure that once produced a stale live headline |
| **`scripts/docs-audit.mjs`** | Gains the help-coverage check; possibly an admin-doc trigger check |
| **`.claude/rules/legal-site.md`** | Must document the new families, or the next session touching the generator has no map |
| **The generator's name** | `buildLegalPages.js` already builds the whole site; three more families make the name actively misleading. A rename must move four references at once — decide deliberately rather than letting it rot |

---

## 7. Phased plan

Ordered so each phase is independently useful, none blocks on an undecided question, and the cheapest
evidence arrives first.

**Phase 0 — Pagefind** *(no decisions required)*. Static search over the site as it exists.
**Exit:** search works across all 10 live pages; zero third-party requests; both build entry points
updated. **Why first:** cheapest real improvement, benefits every existing page, and an honest test of
the central premise.

**Phase 1 — Revive `public/changelog/`.** **Exit:** reachable, in the nav, in the search index, and the
CI/deploy exclusions revisited rather than inherited.

**Phase 2 — Generate the command spec.** `commands.json` from `.data.toJSON()`, rendered bare.
**Exit:** every command has a correct page with no prose written; the audience partition works; a new
command appears automatically.

**Phase 3 — Overlays + the coverage gate.** **Exit:** the gate fails on a missing overlay; overlays
filled one at a time, useful from the first.

**Phase 4 — Admin manual.** *Blocked on the public/private fork and the merge-with-ops-guide question.*
**Exit:** the seven sections exist; the runbook is one click from anywhere.

**Phase 5 — The interactive layer.** D2 diagrams, `/manage` GIFs, and last the **Components V2 → HTML
renderer**. **Exit:** at least the autobuild pipeline and the three-tier error model are diagrams
rather than paragraphs; at least one command page shows real rendered output.

**Phases 0–3 are unblocked today. Phase 4 needs two answers. Phase 5 is deliberately last, because it
is expensive to redo if the layout moves.**

---

## 8. Decisions

### 8.1 Settled by reasoning — arguable, but with stated grounds

| Decision | Ground |
|---|---|
| Extend the existing generator; don't adopt a framework | §3.3 and §3.4; 10k lines and a real identity already exist |
| Pagefind, not Algolia | Algolia is a third-party script → falsifies §2.6 |
| D2 build-time SVG, not Mermaid runtime | Same reasoning |
| Shiki, not Prism/highlight.js | Same again — highlight at build time |
| Generate the command reference from `SlashCommandBuilder` | Discord renders from the same object, so generated docs cannot drift |
| Player help and admin manual are two products | Different readers, voices and failure modes |
| Skip JSDoc/TypeDoc | Nobody imports this project |
| No new MCP | MCPs author and retrieve; they don't build |

### 8.2 Genuinely open

1. **Admin manual: public, repo-only, built-but-unlinked, or gated?** A values call. No recommendation
   offered.
2. **Does the admin manual merge with the filed `[P3 · M]` ops-guide item**, or sit beside it? They are
   the data-administration and infrastructure halves of one manual; separate authorship risks two
   half-guides.
3. **How do readers find any of this?** Fully treated in **§4.4**, and probably the highest-leverage
   question in the document — a help site unreachable from inside Discord is a help site nobody reads.
   The specific open choice is which surface: a link in existing command responses (cheapest), the App
   Directory listing, a `/help` command, or per-command deep links. ⚠️ Three of those four are **bot
   features**, so they need a deploy and belong in bot scope, not docs scope.
4. **Does `buildLegalPages.js` get split and/or renamed** as part of this, or absorb three more
   families at 10k lines?
5. **Where does the DEVLOG's lessons material belong?** Probably neither document — a third audience
   again, and pretending otherwise turns a manual into a memoir.
6. **Is any of this worth doing right now?** See §9.

---

## 9. Risks, and the case for doing nothing

### 9.1 Risk register

| Risk | Severity | Mitigation |
|---|---|---|
| The two build entry points diverge again | **High** — has happened once | Any new step lands in both, same change; consider consolidating first |
| `deploy-site.yml` path filters miss the new sources | **High** — silent; stale live site | Add paths in the same PR as the first new family; assert the live page after publish, as the workflow already does |
| CI staleness gate defaults wrongly on new dirs | Medium | Decide include/exclude explicitly; never inherit silence |
| `buildLegalPages.js` becomes unmaintainable at 13k+ lines | Medium | Modularise before Phase 4, not after |
| Screenshots rot silently | Medium | Prefer generated V2 renders; stamp versions otherwise |
| Admin manual written once, never updated | Medium | Tie to a change trigger, as `PRIVACY.md` is tied to `UserPreference` |
| Troubleshooting invites pasting raw errors | **High** — credential-leak vector | Say "sanitised message" explicitly, every time |
| Scope creep turns this into a site rewrite | Medium | Phases 0–1 touch no new content; stop after either if value is unclear |

### 9.2 The honest case for doing nothing

Nothing here is broken. No user is blocked. The bot works, the site is live, the records are current.
The costs of inaction are real but slow: 16,400 lines stay unsearchable, three built pages stay dark,
new readers keep re-deriving what is already written, and `chronicle-drift` keeps warning about output
nobody reads.

**Nothing gets worse over time** — which is exactly why this belongs on a someday list rather than a
roadmap, and why Phase 0 is scoped to be worth doing even if nothing follows it.

### 9.3 Effort vs. impact

| Option | Effort | Impact | Verdict |
|---|---|---|---|
| Pagefind | XS–S | High | **Do this first** |
| Revive `public/changelog/` | S | Medium–High | Cheap; already built |
| Generate `commands.json` | S | High | No prose required to be useful |
| Overlays + coverage gate | M (incremental) | High | Useful from the first overlay |
| D2 diagrams | S each | High for complex subsystems | Alongside content |
| `lychee` | XS | Medium | Bundle with any CI touch |
| `markdownlint-cli2` | XS | Low–Medium | Bundle |
| `vale` | S (rules need tuning) | Medium–High | Worth it given how much voice matters here |
| `shiki` | S | Medium | Needed as soon as code appears on the site |
| `dependency-cruiser` | S | Medium | CI rule-assertions beat the diagram |
| Obsidian | XS | Medium–High locally | Try before building anything |
| Admin manual | L | High for the bus factor | Blocked on §8.2 (1) and (2) |
| Distribution — a link in existing responses | XS | **High** | The cheapest thing on this table with the largest reach; see §4.4 |
| Distribution — a `/help` command | S–M | High | Bot work, needs a deploy — scope separately |
| V2 → HTML renderer | L | High and unique | The reward; last |
| Astro/Starlight migration | L | High but redundant | Only if the generator becomes the bottleneck |

---

## Appendix — publishing boundary

**Where this document itself lives.** `docs/ideas/` — **tracked in git but never published**, verified
2026-08-06 00:12 EDT: neither `scripts/buildLegalPages.js` nor `scripts/lib/chronicle.js` reads
anything from it, so nothing here reaches `dioreo.app`. It is "public" only in the sense that the
repository is public. That is the right tier for this file: a tracked pointer in
`docs/db-deferred-list.md` resolves for anyone with the repo, instead of naming a path only one
machine can see.

`docs/ideas/` is the **forward-looking, maintained** area — proposals and parked ideas that get
*edited* as thinking changes, as opposed to `docs/superpowers/specs/`, whose dated documents are
snapshots that get *superseded* rather than revised. This file belongs here precisely because its
opening banner instructs a future session to change it rather than defend it.

`local/` and the memory store at
`~/.claude/projects/-Applications-Claude-Code-Diors-Builds/memory/` are **not publishable**, and
`docs/ideas/Harkirats-Space.md` is private. `.claude/rules/` and `docs/` are already public in a public repo,
so those are fair game.

When re-shaping any of it for a wider audience, carry the **procedure** and never the account
identifiers — see §4.2 for the specific hazards (the GCP billing account ID, and raw Cloudinary error
objects).
