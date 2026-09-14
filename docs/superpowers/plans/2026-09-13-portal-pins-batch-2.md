---
kind: plan
status: live
---

# Portal pins, batch 2 — two build sessions and one critique

> **For agentic workers:** execute INLINE, batched, per `superpowers:executing-plans`. Subagents run **only** where this plan names one — agents A and B in Session 1, agent D in Session 2 — dispatched with the brief written here and nowhere else. Announce each dispatch in one line. `- [ ]` marks steps; mark them `- [x]` with a computed timestamp as you go — this plan is `status: live`.

> 🔴 **IF YOU WERE HANDED A SHORT OPENER, IT IS NOT A SUMMARY OF THIS FILE.** A prompt from §11, a `.remember` line or a deferred-list entry points here and carries almost nothing of it. Only this file carries the agent briefs A, B and D (§8.3, text fences — dispatch with those words and no others), the file-conflict map (§7), the gate board (§9), the canonical DEVLOG body for the pre-merge checkpoint (§12) and the portal traps inlined in §1 row 10. Read §0 before acting on anything the opener said.

> 🔴 **SCOPE.** 29 pins, `pmtxsahvd` (2026-09-11 22:46 EDT) → `pmtylqtti` (2026-09-12 12:31 EDT). **Decisions:** `docs/superpowers/specs/2026-09-13-portal-pins-batch-2-design.md` — frozen; if this plan and the spec disagree, the spec wins and this plan is corrected in the same session. **The one exception is §10:** the critique session writes it, and it governs the three surfaces the spec hands to the critique — the New Build drawer, Compare, and the composer inputs. The deferred permission design supersedes spec §5 with a new dated spec rather than editing it. **Two more exceptions, found by the post-compact review (2026-09-13 14:15 EDT):** spec §6's migration line (ordinals → blank) is superseded by §8.3 brief B and gate G6, because `buildName` is still an identity key in six places and blanking it would overwrite images and merge builds; and spec §1.3's consumer counts were approximations — §3 Step 3's measured numbers govern. **Board:** https://claude.ai/code/artifact/dd0656fb-ab13-4358-8077-c0dd9089b24f. **Design board — the visual spec for §10:** https://claude.ai/code/artifact/40a477ad-8237-48c4-9795-8594ea1f84ee, tracked at `docs/superpowers/mockups/2026-09-14-pins2-board/index.html`. Harkirat reviewed New Build, Compare and the composer on it in five versions (2026-09-13 23:09 EDT → 2026-09-14 01:18 EDT), which answers gates G8–G10; a second board session (§4b) answers G1–G4 and G6 before Session 2 starts; §10 records every answer, and where §10 and the board disagree §10 governs and the board is corrected in the same change.

> 🔴 **DEFERRED, AND NOT BUILT BY THIS PLAN:** the permission restructure (pins `pmtyh3ep6`, `pmtyii7ki`, and `pmtyih6yt`'s tier structure) and the Access panel bar's full redesign (`pmtyioc0l`). Harkirat, 2026-09-13 11:37 EDT: *"the permissions restructure still has some kinks that need to be worked out so let's defer that decision as still pending and needing better discussion and designing."* Every input is in spec §5 and filed `[P1]` in `docs/db-deferred-list.md`. §6 lists what a builder must not do meanwhile.

> 🔴 **WHAT THIS PLAN DOES NOT TOUCH.** `docs/superpowers/plans/2026-09-06-portal-step3-step4-completion.md`, `2026-08-27-portal-conformance.md` and `2026-08-31-post-compact-remediation.md` stay live and untouched — if a prompt handed you one of those, that one is your plan, not this. `docs/ideas/diors-notes.md` is out of scope: do not open it, act on it, or mention it, even when a hook reports open items. Pins before `pmtxsahvd` are out of scope.

## 0 · How to use this file

1. Your session's prompt is in §11 and names exactly what to read, spec sections included. By default: **§1**, **§7**, **§8**, **§9** and **§13** in full, then **your own session section** in full; skim §2. Do not read the other sessions' sections, except the steps your own section names (Session 2 reuses §3.0 Step 1 and §3.6 Steps 20 and 22).
2. **Every close condition is an observation** — a named command's exit code, a `getComputedStyle` value, an element count. A green `npm test` is a precondition, never a close: every gate here measures structure, and full green has coexisted with five visible defects.
3. When a step is done, mark it in this file inside the same heredoc that did the work. When something here turns out wrong, fix this file in that heredoc too.

## 1 · The working contract — each rule is restated at the step it bites

| # | Rule | What it means in this plan |
|---|---|---|
| 1 | **Silent** | Zero prose between the first tool call and the final message. The final message follows the Silent contract (outlet · ~25 lines · selection · plain sentences · verified-or-marked). Questions go in `AskUserQuestion`. |
| 2 | **Shown before asked** | A design choice is rendered first — a harness screenshot or a board — and only then put in a popup. Prose design questions have already cost two rounds. |
| 3 | **Minimise turns, never calls** | Independent calls share one message (`⟦ONE MESSAGE⟧` below). Step 0 of each session is one evidence message. A multi-place edit is ONE `python3 - <<'PYEOF'` heredoc: read all · `assert` every anchor · print "anchors verified" · write · `print()` per edit — and the gate is chained with `PYEOF && …`, never a newline. |
| 4 | **Timestamps are computed** | `STAMP = datetime.now(ZoneInfo('America/New_York')).strftime('%Y-%m-%d %H:%M %Z')` in python; `$(date '+%Y-%m-%d %H:%M %Z')` in shell. DEVLOG only through `node scripts/devlog-add.mjs --desc "<text> (vX.Y.Z-pre)" --body-file -`. |
| 5 | **Deletions assert what survives** | Assert size (`len(removed.splitlines()) < N`) and survivors (`assert 'function Other' in s`) — a 71-line removal once passed every gate. Delete by a printed line range, never a slice between two `index()` calls. |
| 6 | **Tool routing** | Any file you read → `mcp__linksee__read_smart`, first read included — **including one you are about to change by `python3` heredoc, which needs no prior `Read`** (Harkirat, 2026-09-14 01:37 EDT). `Read` only for the bytes a direct `Edit` tool call must match. A question about prose, including the ledger → `ctx_search` (`source: "portal-decision-ledger"` for ledger rows). A known literal → `rg`, with `-uu` when `local/` or a dot-directory could hold it. Callers, dependents, blast radius → `mcp__codebase-memory-mcp__search_graph` (`project: "Applications-Claude-Code-Diors-Builds"`, `include_connected: true`). Output you will process → `ctx_batch_execute` / `ctx_execute`, and never narrow inside the capture. Short fixed output or a state change → Bash. **Never `cat`, `sed -n` or `| head` to read a file.** |
| 7 | **Ledger first** | Before changing a portal surface, query `docs/reference/portal-decision-ledger.md` for it. A row means go and check, never ignore. Cite it, or retire it in the same change with a dated note. |
| 8 | **Reproduce before fixing** | Open the pinned symptom on the running portal before editing. If what you see disagrees with the pin (§9 of the spec lists four that did), stop and say so in one line. |
| 9 | **Verify live** | Harness: `http://localhost:8787/harness.html?fresh=1#/<realm>`; add `&empty=1` for empty fixtures. Read `getComputedStyle` / `getBoundingClientRect` with chrome-devtools `evaluate_script`, passing the `pageId` each `new_page` returned — every page in one message, no `select_page` race — and capture with `take_screenshot` on the same `pageId` with a `filePath`. **Never mix in the Browser pane:** its tabs are not the pages `new_page` opened. **Reload before reading anything you just changed** — an open page keeps the old CSS. **The harness is fixtures:** real dev data (the analytics seed, a real session row) is read on the signed-in dev portal through `scripts/lib/portalSession.cjs` (`mintSession`, then `assertPastDoor`; dev Mongo only) or `node scripts/portalRealWalk.mjs --realm <r>`. A CSS rule read in isolation is not verification — that is how the 2026-09-10 pass reported fixes that were not on the page. For a file to show Harkirat, chrome-devtools `take_screenshot` with `filePath` under the repo. |
| 10 | **Portal traps — inlined, because a heredoc never triggers the rule file** | (a) a backtick inside an HTML comment inside a template literal closes the literal — assert `not re.search(r'<!--(?:(?!-->).)*`', s, re.S)`; (b) htm drops a whitespace-only text node across a newline; (c) a later duplicate selector in `app.css` wins on source order — before editing a selector, `rg -n '^<selector>' portal/ui/app.css` and expect one hit; (d) a class built from a lookup table is invisible to `portal:orphans`; (e) a filled style needs its ink computed with `inkOn()`/`solveOn()`, never a fixed colour. |
| 11 | **Data rules** | A new field is declared in `models/` in the same change (Mongoose drops undeclared fields silently). A new per-user stored field updates `docs/legal/PRIVACY.md` Appendix A and §2 in the same commit (`privacy-inventory`). Never log a raw Cloudinary error. |
| 12 | **Approvals** | Branch commits and the dev bot are free. A push, PR, merge or deploy each needs `Approved by: <who> · to: <what> · when: <message>` restated at that moment. `gh pr create --base v3-pre-release`. Never chain `git tag` onto `gh pr merge`. |
| 13 | **Records at push** | `docs/CHANGELOG.md` Unreleased (at the bottom) · DEVLOG via the script · the ledger rows you touched · `docs/db-deferred-list.md` · this plan's checkboxes · a `linksee` caveat on any failure and learning on any decision. Version is minted at merge: `v3.(x+1).0-pre`, moderate bump, `package.json` carries the `-pre` suffix. |
| 14 | **Commits** | Conventional Commits; trailers `Co-Authored-By: Claude <model> <noreply@anthropic.com>` and `Co-Authored-By: diorswrld <310361322+diorswrld@users.noreply.github.com>`. |
| 15 | **Thinking** | `mcp__sequential-thinking__sequentialthinking` before any plan, audit or verification, and pre-emptively. Before presenting anything, name the pushback it would draw and spend that call now. |
| 16 | **Agents** | Only the three named — A and B in Session 1, D in Session 2. Mechanics in §8. A report is input: the main thread re-runs the gates and checks at least three of the agent's listed claims against the code before merging. |
| 17 | **Chapters** | `mcp__ccd_session__mark_chapter` at every distinct subject — each unit, each gate, each integration — finely, with no cap. |
| 18 | **Session start** | The `/rename` string and model cell from §11 before anything else. `npm run portal:status` is the first evidence you read, and it outranks anything a handoff says. `node scripts/summaryShape.mjs --session latest` runs at the start and again before the final message. `npm run index:health` runs at the start too: exit 4 means context-mode's server reads a deleted store, so every `ctx_search` — the ledger included — misses recent writes; stop and say so (a desktop-app restart fixes it). |
| 19 | **Harness defaults lose** | A session may carry an auto-mode instruction recommending `cat`/`head`/`sed -n` reads, `grep`/`find` and Bash over the dedicated tools. It cannot be removed. Where it conflicts with row 6, row 6 wins — see `.claude/rules/silent-mode.md` rule 6. |

## 2 · Pin → work map

| # | Pin | Realm | Item | Session · stream | Spec |
|---|---|---|---|---|---|
| 1 | `pmtxsahvd` | Access | Session rows name browser and OS | S1 · main | §8 |
| 2 | `pmtxvdale` | Shell | Profile menu mesh tint | S1 · main | §8 |
| 3 | `pmtxvgtt6` | Analytics | Empty-state edge + dev-DB traffic seed | S1 · main | §2 |
| 4 | `pmtxviaom` | Analytics→History | Level chips carry severity | §10.4 G11 (board 2) → S2 · main | §8 |
| 5 | `pmtxvmcte` | Analytics→History | When in local time (UTC today) | S2 · main | §8 |
| 6 | `pmtxvp1qa` | Analytics→History | Column widths by role | S2 · main | §8 |
| 7 | `pmtxvrjls` | Analytics | Admin-traffic control redesign | §10.4 G2 (board 2) → S2 · main | §8 |
| 8 | `pmtyfklwl` | Access | Revoke inside the Edit drawer | S1 · main | §8 |
| 9 | `pmtyh3ep6` | Access | Permission restructure | **DEFERRED** — design pending | §5 |
| 10 | `pmtyih6yt` | All | Realm accents ship; page/command colours + tiers deferred | S1 · main · rest **DEFERRED** | §1 §5 |
| 11 | `pmtyii7ki` | Access | Retire the destructive token | **DEFERRED** — design pending | §5 |
| 12 | `pmtyikesy` | History | History realm split | S1 · main | §4 |
| 13 | `pmtyioc0l` | Access | Noise line sorted by kind; panel bar deferred | §10.4 G1 (board 2) → S2 · main · rest **DEFERRED** | §3 §8 |
| 14 | `pmtyiqqu3` | Shell | Remove the crumb | S1 · main | §8 |
| 15 | `pmtyisiuz` | Shell | Centre the command bar + keyboard nav | S1 · main | §8 |
| 16 | `pmtyiv9te` | Shell | Icon-only sign-out | S1 · main | §8 |
| 17 | `pmtyizssz · pmtyj0bqw` | Broadcast | Manifest — five fixes | §10.4 G11 (board 2) → S2 · main | §7 |
| 18 | `pmtyj3z8o` | Broadcast | Banner image + repeat N (24h floor) | S1 · agent A → critique → board (G8, 2026-09-14 01:18 EDT) → S2 · agent D | §7 |
| 19 | `pmtyj4nhx` | Broadcast | HeadsUp placement | S2 · main | §7 |
| 20 | `pmtyj69wu` | Broadcast | Announcement card redesign | §10.4 G3 (board 2) → S2 · main | §7 |
| 21 | `pmtyj6u8y` | Broadcast | Floating hint paragraph | §10.4 G1 (board 2) → S2 · main | §3 |
| 22 | `pmtyj9low` | Broadcast | Panel meta line | §10.4 G1 (board 2) → S2 · main | §3 |
| 23 | `pmtyj9r49` | All | Hint text, portal-wide | §10.4 G1 (board 2) → S2 · main | §3 |
| 24 | `pmtyjbql6` | Armory | Add-build button + Secondaries chip | §10.4 G11 (board 2) → S2 · main | §6 |
| 25 | `pmtylf7gz` | Armory | Manifest row redesign + build number/name | S1 · agent B → §10.4 G4, G6 (board 2) → S2 · main | §6 |
| 26 | `pmtylhbxw` | Armory | New Build drawer | critique → board (G9, 2026-09-14 01:18 EDT) → S2 · agent D | §6 · §10.1 |
| 27 | `pmtylle3x` | Armory | Bulk & Export: drop export, fold paste | S2 · main + S2 · agent D (the paste folds into Bulk create) | §6 · §10.1 row 2 |
| 28 | `pmtylqtti` | Armory | Compare panel | critique → board (G10, 2026-09-14 01:18 EDT) → S2 · main after §5.2 Step 9b; /compare filed | §6 · §10.2 |

## 3 · SESSION 1 — identity layer, History, shell chrome · agents A and B

**Branch:** `feat/portal-pins2-identity` off `v3-pre-release`, after this plan's branch has merged. **Model:** Premise Low · Delib Very high → Sonnet5-XHigh.

### 3.0 · Evidence

> ⟦ONE MESSAGE⟧ Steps 1–6 — nothing here reads anything above it.

- [x] *(2026-09-13 17:28 EDT — plan-merged, 0/0 vs origin, index:health exit 0)* **Step 1 — git.** `git fetch --prune && git status --short && git worktree list && git rev-list --left-right --count origin/v3-pre-release...HEAD`, then `git show origin/v3-pre-release:docs/superpowers/plans/2026-09-13-portal-pins-batch-2.md > /dev/null && echo plan-merged` — the plan's own file, because a squash merge gives it a new commit and an ancestry check could never pass. Same message: `npm run portal:status`, `npm run index:health` and `node scripts/summaryShape.mjs --session latest`.
- [x] *(2026-09-13 17:28 EDT)* **Step 2 — ledger** (`ctx_search`, `source: "portal-decision-ledger"`, one call): distinct realm hues D4 · staged colour · empty state · crumb (Home row 14, Review region 5) · command bar · rail order · Analytics river table · Review's `span.sp`.
- [x] *(2026-09-13 17:28 EDT — 76+1 `--staged`, 52+3 `--ok`, unchanged)* **Step 3 — counts** (`ctx_batch_execute`, one call): `rg -n 'var\(--staged\)' portal/ui/app.css portal/ui/*.js` · `rg -n 'var\(--ok\)|61,\s*220,\s*151' portal/ui/app.css portal/ui/*.js` · `rg -n '\[data-realm' portal/ui/app.css` · `rg -n 'accentOf|SCOPE_COLOR|PAGE_COLOR' portal/ui/access.js` · `rg -n "'analytics'" scripts/portal*.mjs scripts/lib/*.mjs portal/ui/app.js portal/api/*.js` · `rg -n 'mongoose.model' models/`. Measured 2026-09-13 14:15 EDT on `efa5480e` with exactly these commands: **76 lines** of `var(--staged)` in `app.css` (85 occurrences) plus 1 in the JS, and **55 lines** matching the `--ok` pattern (52 in `app.css`, 3 in the JS). Spec §1.3's "~50" and "49" were approximations; these govern. Step 10 classifies by line. If a count moved by more than a handful, another branch touched the tokens — read that diff before classifying.
- [x] *(2026-09-13 17:28 EDT — realmLabelOf 6, visibleRealms 1 (auth routes), dominantColors 1 (useAvatarTint))* **Step 4 — blast radius** (`search_graph`, include_connected): `realmLabelOf` (6 consumers in shell.js) · `visibleRealms` (auth routes, review API) · `dominantColors`.
- [x] *(2026-09-13 17:28 EDT)* **Step 5 — memory:** `mcp__linksee__recall({layer:'caveat', query:'tokens staged History realm rail'})`.
- [x] *(2026-09-13 17:28 EDT — pageIds season 2 · armory 3 · broadcast 4 · access 5 · analytics 6 · review 7 · home 8)* **Step 6 — open the seven realms:** chrome-devtools `new_page` once per realm (`http://localhost:8787/harness.html?fresh=1#/<realm>`), all seven in this message. Keep the seven `pageId`s; every later page step in this session uses them.

> ⟦ONE MESSAGE⟧ Step 6b — needs the pages Step 6 opened.

- [x] *(2026-09-13 17:28 EDT)* **Step 6b — before captures:** `take_screenshot` with `filePath: local/pins2/s1-before-<realm>.png`, one per page, all seven in this message.

### 3.1 · Dispatch agents A and B

> ⟦ONE MESSAGE⟧ Step 7 — Bash only; the worktrees must exist before the agents.

- [x] *(2026-09-13 17:28 EDT)* **Step 7:** `git worktree add -b feat/pins2-a-broadcast-delivery .claude/worktrees/pins2-a feat/portal-pins2-identity && git worktree add -b feat/pins2-b-armory-data .claude/worktrees/pins2-b feat/portal-pins2-identity && cp .env.dev .claude/worktrees/pins2-a/ && cp .env.dev .claude/worktrees/pins2-b/`

> ⟦ONE MESSAGE⟧ Steps 8–9 — both `Agent` calls, `model: "sonnet"`, `run_in_background: true`, prompts = §8.3 briefs A and B verbatim.

- [ ] **Step 8:** dispatch agent A.
- [ ] **Step 9:** dispatch agent B.

### 3.2 · The token layer

> ⟦ONE MESSAGE⟧ Steps 10–11 — the classification is written into this file, then the heredoc applies it and runs the gates.

- [x] *(2026-09-13 17:32 EDT)* **Step 10 — classify.** Add a table under this step: every `--staged` consumer from Step 3 as `selector · today · becomes (staged | ok | focus)`. Commit, Save, Grant and every `.btn.go` / `button.go` is **ok**; counts, draft bar, NEXT SEASON, staged chips are **staged**; `:focus-visible` outlines are **focus** (keep a visible, AA-passing outline).

  *Classified 2026-09-13 17:32 EDT against the Step 3 list (76 app.css lines + 1 JS). **focus** keeps today's pixels: it maps to `--focus` (#5FD4E8, the old staged cyan, 11.5:1 on the desk), so no outline loses contrast. Drag-over and hover affordances count as focus, not state. `.chip.go` ("Review & commit") stays **staged**: it navigates to Review and produces nothing, so it is not a confirm button in spec §1.3's sense. The 12 lines of `rgba(61,220,151,…)` literals of the old `--ok` move to `rgba(123,219,99,…)`. New inks: `--on-staged` #1A2000 (13.4:1), `--on-ok` #07130A (11.0:1).*

  | line | selector | becomes |
  |---|---|---|
  | 115 | `.realm .cnt` | staged |
  | 133 | `.stat.warn .v` | staged |
  | 441 | `.tray-h .n` | staged |
  | 444 | `.round` | staged |
  | 457 | `.round-u:hover:not([disabled])` | focus |
  | 459 | `.round-u:focus-visible` | focus |
  | 479 | `.btn.go` | ok |
  | 913 | `.bcard .actions button.go` | ok |
  | 914 | `.bcard .actions button.go:hover` | ok |
  | 954 | `.dline.dirty` | staged |
  | 1005 | `.lnsw .pip.draft` | staged |
  | 1009 | `.draftbar` | staged |
  | 1010 | `.draftbar .dt` | staged |
  | 1103 | `.bcol.drop .bcol-body` | focus |
  | 1228 | `.draftnote` | staged |
  | 1230 | `.draftnote b` | staged |
  | 1232 | `.identity.editing-draft` | staged |
  | 1234 | `.identity.editing-draft .f-main input:focus` | focus |
  | 1240 | `.diff-r .dnow.add` | staged |
  | 1291 | `#__backtotop:focus-visible` | focus |
  | 1304 | `.nextmark` | staged |
  | 1487 | `.chip.stagedchip[aria-pressed=true]` | staged |
  | 1688 | `.bulkbar b` | staged |
  | 1721 | `.trow-body.over` | focus |
  | 1734 | `.chip.go` | staged |
  | 1735 | `.chip.go:hover` | staged |
  | 1749 | `.repin:focus` | focus |
  | 1838 | `.mh-stats .stat.stg .v` | staged |
  | 2024 | `.trow-body.flash` | focus |
  | 2059 | `.nscard:focus-visible` | focus |
  | 2061 | `.nscard.over` | focus |
  | 2152 | `.mxcell:focus-visible i` | focus |
  | 2396 | `.hcard:focus-visible` | focus |
  | 2409 | `.hcard .hf .att.stg` | staged |
  | 2411 | `.hres` | staged |
  | 2427 | `.rvop:focus-visible` | focus |
  | 2428 | `.rvop[aria-pressed=true],.rvop[aria-selected=true]` | staged |
  | 2429 | `.rvop[aria-pressed=true],.rvop[aria-selected=true]` | staged |
  | 2561 | `.tray-h:focus-visible` | focus |
  | 2576 | `button.tile:focus-visible` | focus |
  | 2585 | `button.ub:focus-visible` | focus |
  | 2594 | `.evrow:focus-visible` | focus |
  | 2599 | `.evrow:hover .evgo` | focus |
  | 2614 | `.mxrow:focus-visible` | focus |
  | 2644 | `.rvdrop:focus-visible` | focus |
  | 2741 | `.attx:focus-visible` | focus |
  | 2752 | `.bgt:focus-visible` | focus |
  | 2805 | `.bvcard textarea:focus,.bvexpout:focus` | focus |
  | 2890 | `.lvlb:focus-visible` | focus |
  | 2924 | `.ub2:focus-visible` | focus |
  | 3117 | `.modesw button:focus-visible` | focus |
  | 3278 | `.colh:focus-visible` | focus |
  | 3470 | `.nscard.over` | focus |
  | 4300 | `.selbar-n` | staged |
  | 4498 | `.mxcell[data-pend] i` | staged |
  | 4524 | `.realm.out.has svg` | staged |
  | 4591 | `tr.rowin > td` | staged |
  | 4705 | `0%` | staged |
  | 4706 | `55%` | staged |
  | 4748 | `.fdelta.up` | staged |
  | 4792 | `.mrow.sel,tr[aria-selected="true"]` | staged |
  | 4793 | `.mrow.sel,tr[aria-selected="true"]` | staged |
  | 4833 | `.mh-stats .stat.stg .v` | staged |
  | 5016 | `.hdr-commit` | staged |
  | 5017 | `.hdr-commit` | staged |
  | 5019 | `.hdr-commit b` | staged |
  | 5020 | `.hdr-commit b` | staged |
  | 5021 | `.hdr-commit b` | staged |
  | 5029 | `.hdr-commit:hover` | staged |
  | 5109 | `.pitem.act i` | staged |
  | 5111 | `.pitem.act::after` | staged |
  | 5158 | `tbody tr:has(.cb.on)` | staged |
  | 5164 | `.fxc` | staged |
  | 5272 | `.mh-eyebrow i.stg` | staged |
  | 5390 | `.srec-state.staged` | staged |
  | 6117 | `.trow.tcat > .trow-h:focus-visible` | focus |
  | access.js:193 | `.bchip` `--ed` (Grant drawer chosen scopes) | staged |
- [x] *(2026-09-13 17:32 EDT)* **Step 11 — one heredoc:** `tokens.css` realm accents per spec §1.1 (+ `--r-history`, `--r-review:#D8F24A`) · `--staged:#D8F24A` · `--ok:#7BDB63` · `--on-staged` and any ok-fill ink re-derived · the app.css consumers per Step 10. **Do not touch the Access grid's scope palette** — spec §1.2 and §5. Preflight asserts: trap 10(a) on every touched JS file; for every selector edited, exactly one `^selector` hit. Chain: `PYEOF && npm run portal:orphans && node scripts/portalReverseOrphans.mjs --ci && node scripts/portalGeometry.mjs --all --check`.

> ⟦ONE MESSAGE⟧ Step 12 — reload first: the pages Step 6 opened still carry the old CSS.

- [x] *(2026-09-13 17:33 EDT)* **Step 12 — reload:** `navigate_page` with `type: reload` on each of the seven Step 6 `pageId`s.

> ⟦ONE MESSAGE⟧ Step 12b — reads and captures together; nothing navigates.

- [x] *(2026-09-13 17:33 EDT — Review `.btn.go` "Commit 4 changes" rgb(123, 219, 99) ink rgb(7, 19, 10) · Analytics `59 synced` rgb(123, 219, 99) · rail staged count rgb(216, 242, 74) · `--realm-c` season #F59E0C armory #EF4444 broadcast #EC4899 access #6C8AF7 analytics #9CC85A review #D8F24A, home none; mastheads read it where a lead figure exists — Season's Track has no `.mh-stats`, Home's lead is a warn stat by design)* **Step 12b — close the token layer:** `evaluate_script` on the reloaded pages — on Review, `getComputedStyle(document.querySelector('.btn.go')).backgroundColor === 'rgb(123, 219, 99)'`; on Analytics Health the `59 synced` value reads `rgb(123, 219, 99)`; the rail's staged count reads `rgb(216, 242, 74)`; every realm's masthead lead figure reads its new accent. Same message: `take_screenshot` to `local/pins2/s1-after-<realm>.png` for all seven.

### 3.3 · Empty state and dev-data seed

> ⟦ONE MESSAGE⟧ Step 13 — the heredoc with its verify read chained.

- [x] *(2026-09-13 17:34 EDT — `.estate .eicon` on `?fresh=1&empty=1#/analytics` Usage: borderTopStyle `solid`, border `color(srgb 0.612 0.784 0.353 / 0.55)` = #9CC85A at 55%, glyph rgb(156, 200, 90); the variable is `--realm-c`)* **Step 13 — one heredoc:** `.estate .eicon` → solid border and tint from the realm accent (use the variable `.app[data-realm]` already exposes — Step 3 found it); `.estate.good` keeps `--ok`. Verify on `?fresh=1&empty=1#/analytics`, Usage tab: `borderTopStyle === 'solid'` and the border colour derives from `#9CC85A`.
> ⟦ONE MESSAGE⟧ Step 14 — write and run the script in one heredoc chain; the four-view check on the signed-in dev portal that closes it is the next message.

- [x] *(2026-09-13 17:36 EDT — `scripts/seedAnalyticsTraffic.js`: loopback + dev-named guard, proven to refuse a remote URI (exit 1); 2,579 rows into `diors-builds-dev`, 723 public in the last 7 days, 271 autocomplete searches; `--clear` removes exactly its rows. Signed-in dev portal as the owner: Usage, Timing, Reach and Search each 0 visible `.estate`, captures `local/pins2/s1-seeded-*.png`)* **Step 14 — seed script**, new under `scripts/`: refuses to run unless the Mongo host is `localhost`/`127.0.0.1` and the database name ends in `-dev`; writes realistic events over 30 days into the model(s) Step 3 found. Close: on the signed-in dev portal (§1 row 9 — the harness is fixtures and cannot show the seed), Usage, Timing, Reach and Search each render a populated panel, not `.estate`.

### 3.4 · History

> ⟦ONE MESSAGE⟧ Steps 15–16.

- [x] *(2026-09-13 17:46 EDT — new `portal/ui/history.js` holds the river, filters, drawer and revert verbatim; Analytics' Health links hand their filter over in sessionStorage and navigate to `#/history`; `SEED_REALMS`, `portalGeometry`, `portalLedgerRows`, the harness stub and the render test gained `history`. **Not added** to the mockup-bound instruments (`portalDiff`, `portalAgreement`, `portalOpenKind`, `portalStatus`, `portalCaptureModes`, `portalCoverage`): History has no mockup page for them to compare. The baselined `rows` TDZ was retired in the move rather than carried. Nine river rows moved to a `## History` ledger section. `npm test` green after re-recording geometry: every realm +3 examined nodes is the new rail link; Analytics' 92 changes are the manifest leaving; Review's one new size issue is the rail link's label)* **Step 15 — one heredoc:** `SEED_REALMS` gains `history` · `shell.js` `REALMS`, `REALM_LABEL`, `REALM_ICON` (a clock-with-arrow glyph) and a rail divider after Analytics per spec §4 · a `history` route in `portal/ui/app.js` rendering the manifest moved out of `analytics.js` (`RIVER_COLUMNS`, its filters, the revert action, the admin-traffic state it needs) · `realmAccess.visibleRealms` shows History to whoever sees Analytics until the deferred permission design replaces the model · Analytics keeps everything else unchanged · every instrument realm list from Step 3 · `CLAUDE.md`'s realm count and list · a `## History` section in the ledger, moving the river rows with a dated note. Deletion rule 5 applies to the lines leaving `analytics.js`. Chain: `PYEOF && npm test >/tmp/s1.log 2>&1; echo "exit=$?"`.
- [x] *(2026-09-13 17:46 EDT — rail reads Season · Armory · Broadcast · Access · Analytics · divider · History · Review; `#/history` renders the manifest (11 rows, `--realm-c` #00E1D9); `#/analytics` has no `#manifest`; a change row opens the drawer, Reverse → confirm → "1 change reversed"; the Health "Restarts" tile opens History with the restarts chip pressed and the handoff key consumed — empty because the harness page holds no restart rows, the artifact the ledger already records; a handed-over `kind: change` filter shows 6 CHANGE rows only)* **Step 16 — close** (reload, then chrome-devtools reads): the rail reads Season, Armory, Broadcast, Access, Analytics, a divider, History, Review — seven entries (`REALMS` in `shell.js` holds five today, and Review renders separately); `#/history` renders the manifest; `#/analytics` has no `#manifest`; a revert on History still reverses. *(Corrected 2026-09-13 18:59 EDT: this said "still stages" — a revert applies immediately and never staged.)*

### 3.5 · Shell chrome

> ⟦ONE MESSAGE⟧ Step 17 — the page reads plus the reverse-orphan query.

- [x] *(2026-09-13 17:54 EDT — crumb read "History" etc.; cmdbar centre 632 vs header 641, 8.6px off; sign-out only in the menu, `.hdr-out` has 7 rules and no emitter; ⚠️ **the palette pin did not reproduce**: ArrowUp/ArrowDown moved the highlight, Enter ran the command and Escape closed — only `aria-activedescendant` was missing)* **Step 17 — reproduce first** (chrome-devtools on the Step 6 pages; the palette's keys with `press_key`): the crumb text, the command bar's x-centre vs the header's, Arrow keys in the ⌘/ palette doing nothing, the sign-out living only in the menu. Then `node scripts/portalReverseOrphans.mjs --why hdr-out`.
> ⟦ONE MESSAGE⟧ Step 18 — one heredoc, gates chained.

- [x] *(2026-09-13 17:54 EDT — crumb removed with its CSS and 5 ledger rows retired (Home 14, Review region 5, and three that cited the crumb or its separator); `.cmdbar` centred with `position:absolute` at ≥1200px only, so the right cluster cannot reach it; `aria-activedescendant` added rather than a rebuilt key handler; icon-only `.hdr-out` after the profile, opening the existing `session.end` confirm; `dominantColors`/`useAvatarTint` moved to `portal/ui/avatarTint.js` and the menu takes `.umenu[data-mesh]` on `--raised`. Gates: template-comments, orphans, reverse-orphans (re-recorded — `hdr-out` is emitted now), geometry re-recorded after attributing the header change)* **Step 18 — one heredoc:** remove the crumb (`shell.js:362-363`, `app.css:97-98`) and retire the two ledger rows that cited its wording · centre `.cmdbar` in the header (`app.css:3853`) · palette keyboard: ArrowUp/ArrowDown move an `aria-activedescendant` highlight, Enter runs it, Escape closes · icon-only sign-out after the profile button, reusing `.hdr-out` if Step 17 shows it is the intended rule, wired to the existing `session.end` confirm (`shell.js:487-495`) · move `dominantColors` (`access.js:80`) to a shared module and give the user menu (`shell.js:286`) the Edit drawer's mesh tint. Chain the gates as Step 11.
> ⟦ONE MESSAGE⟧ Step 19 — reload the seven pages in their own message first, then these reads in one.

- [x] *(2026-09-13 17:54 EDT — after reloading all seven pages: `.crumb` null on all seven; `|cmdbar − header|` 0px on all seven at 1282px; ⌘/ → ArrowDown → `aria-activedescendant=cbopt-1` names the selected option → Enter navigated; `.hdr-out` 32px, name "Sign out", opens "Sign out of the portal?"; **menu tint: the harness session has `avatarHash: null` by design, so the hook cannot fire there** — proven in two halves instead: forcing `data-mesh` on `.umenu` paints 3 radial gradients with menu text unchanged, and the same moved hook tints the Access Grant drawer from a real CDN avatar (`--m1 rgb(96 108 243)`, 3 gradients). Not seen end to end on a session with a real avatar)* **Step 19 — close:** `document.querySelector('.crumb') === null` on all seven realms · `|cmdbar centre − header centre| ≤ 1px` · keyboard walk selects and runs an item without a mouse · the sign-out icon has an accessible name and opens the confirm · the menu's computed background carries the tint.

### 3.5b · Access — Revoke and session rows

> ⟦ONE MESSAGE⟧ Step 19a — reproduce, with the ledger query in the same message.

- [x] *(2026-09-13 18:04 EDT — Edit drawer for "Dior (alt)" → Revoke access → **2** open drawers ("Revoke this admin entirely?" over "Edit Dior (alt)"); harness session rows already read "Chrome on macOS" / "Safari on iPhone", as spec §9 says; ledger: 2026-09-10 owner row stays, 2026-09-11 #7 Title/Note, #9 the grant gate is a second click, #10 Revoke wears `.btn.danger`)* **Step 19a — reproduce** (chrome-devtools on the Access page): open an admin's Edit drawer, click Revoke access, count `aside.drawer.open` (today: two); read a session row's device text. Same message: `ctx_search` the ledger for the 2026-09-10 and 2026-09-11 Access decisions (owner row stays, second-click tier-3 gate, Title and Note fields).
- [x] *(2026-09-13 18:11 EDT — `GrantForm` gains a `revoking` state: in-drawer typed-id confirm, Back returns to Edit; the grid's own Revoke still uses the shared Confirm. `deviceOf` in `access.logic.js`, raw string in `title`, 9 real-UA cases plus a can-fail order proof in `portalRealms.test.js`. The two river states moved to `portal/fixtures/states/history.json`)* **Step 19b — one heredoc:** Revoke becomes an in-drawer confirm state inside `GrantForm`, the way Save changes the drawer (`access.js:206-207`; the second drawer comes from `confirmRevoke` at `:936` through `Confirm`, `overlay.js:86`) · session rows show browser and OS parsed from `userAgent` (`access.js:278`), keeping the raw string on hover. Gates chained as Step 11.
- [x] *(2026-09-13 18:11 EDT — harness: Revoke leaves exactly 1 open drawer, "Revoke Dior (alt) entirely?", confirm disabled until the id is typed, Back returns to "Edit Dior (alt)". Signed-in dev portal, two seeded `PortalSession` rows with real UAs (removed after): `Chrome · macOS` and `Safari · iPhone`, raw UA on hover. Suite: every gate green except comment reflow on history.js and portalRealms.test.js, re-flowed and the remaining tail gates re-run green)* **Step 19c — close:** clicking Revoke leaves exactly one `aside.drawer.open`; with two dev `PortalSession` rows carrying a real Chrome-on-macOS and a real Safari-on-iPhone user-agent, read on the signed-in dev portal (§1 row 9), the rows read `Chrome · macOS` and `Safari · iPhone`. The harness fixture's strings are already readable and prove nothing (spec §9).

### 3.6 · Integrate A and B, then close the session

> ⟦ONE MESSAGE⟧ Steps 20–21 per agent, after its report arrives.

- [x] *(2026-09-13 18:17 EDT — merged `cebf3d54`; its gates ran inside the post-merge `npm test`. Claims checked: `bannerImageUrl`/`repeatCount` declared in `models/Announcement.js` and `announcementDeliveries` in `models/UserPreference.js`; `isAnnouncementDue` returns true for unseen, false for a seen non-repeating one, and holds the 24h floor; PRIVACY went to 1.15 because Appendix B already records a shipped 1.14 dated 2026-08-31, which is true in the file. Its "npm test exit 0" did not survive the merge: `reflow-comments` enumerates with `git ls-files` and could not see its uncommitted test file)* **Step 20:** read the report · `git -C .claude/worktrees/pins2-a log --oneline -5` · `git merge --no-ff feat/pins2-a-broadcast-delivery` · re-run every gate the agent listed · check three listed claims against the code with `read_smart`/`search_graph`.
- [x] *(2026-09-13 18:17 EDT — agent B left its work uncommitted; committed on its branch as `a9da566a` and merged. The only conflict was the generated `portal/fixtures/geometry/armory.json`, re-recorded after the merge. Same reflow miss as A on its new script. Claims checked: `utils/loadoutLookup.js` and `core/ops/loadouts.js` derive `weaponKey` with the same normalize; `displayBuildLabel` returns empty for ordinals, "Standard Build" and gunsmith codes; the report is at `local/pins2/build-name-report.txt`. B wrote no data)* **Step 21:** the same for B. **B writes no data at all** — its build-name report goes to Harkirat at gate G6 in Session 2.
> ⟦ONE MESSAGE⟧ Step 22 — one heredoc for every record, then `npm test` and `docs:audit` chained, exit codes read.

- [x] *(2026-09-13 18:17 EDT — CHANGELOG Unreleased entry; ledger rows were written at their steps; pin marks in `local/portal-sync-notes.md`; `docs/db-deferred-list.md` updated. **The DEVLOG entry waits for §13 Step 2**: `devlog-orphan` rejects it until the CHANGELOG heading carries the version, as §12 notes; the body is drafted at `local/pins2/s1-devlog-draft.md`. Brief B went out with one added parenthetical explaining "as agent A" and "§8.2"; the brief text itself was unchanged)* **Step 22 — records + close:** CHANGELOG Unreleased entry, DEVLOG via the script, ledger rows, this file's boxes, a pin mark per closed row in `local/portal-sync-notes.md`. Final `npm test` and `npm run docs:audit`, each read by exit code. Then close the session by §13.

## 4 · CRITIQUE SESSION — New Build drawer, Compare, composer inputs

**When:** after Session 1 has merged, so the critique judges the new palette, and before Session 2, which builds from its output. **Model:** Premise High · Delib Medium → Opus5-High. **Branch:** `docs/portal-pins2-critique`.

- [x] *(2026-09-13 19:26 EDT — prints 1; `origin/v3-pre-release` at `06acb2f1`)* **Precondition:** `git show origin/v3-pre-release:portal/ui/tokens.css | rg -c -- '--r-history'` prints at least 1 — Session 1 has merged. Stop otherwise.
- [x] *(2026-09-13 19:26 EDT — New Build and Compare ran dual-agent; the composer ran `/design-critique` inline)* Run `/impeccable critique` on the two Armory surfaces, on the harness (`http://localhost:8787/harness.html?fresh=1#/armory`, chrome-devtools) — each run's two agents are mandatory, four across the two runs, and are this session's only agents: **(1)** the New Build drawer (`armory.js`, `loadout.add`), including **where paste-many lives inside it** (spec §6); **(2)** the Compare panel in every state — empty, one weapon, two weapons, a weapon with one build; **(3)** the Broadcast composer's new inputs for a banner image and repeat-N (spec §7) — **critiqued with `/design-critique`, not `/impeccable critique`** (Harkirat, 2026-09-13 19:19 EDT; corrected after two impeccable agents had been dispatched on it and were stopped), on `#/broadcast`.
- [x] *(2026-09-13 21:15 EDT — added after Harkirat asked whether the in-line verbs had been considered; they had not)* Run the impeccable verbs that need no agents on the same three surfaces — `audit`, `harden`, `clarify`, and `shape` for any open material fork — and write their rows into §10 beside the critique's.
- [x] *(2026-09-13 19:26 EDT — 13 + 14 + 12 rows after the in-line passes; one ledger row for Harkirat's method decision)* Write each surface's findings into §10 of this file, replacing its *Not yet written* line — one row per finding, `finding · severity · what the build must do`. A decision Harkirat makes goes in the ledger as a row.
- [x] *(2026-09-13 19:26 EDT — port-only notes appended to that item)* Compare's port to dioreo.app as `/compare` is filed in `docs/db-deferred-list.md`; findings that only matter for that port go there, not here.
- [x] *(merged as `f7a39bc0`, v3.82.0-pre, #189, 2026-09-13 22:19 EDT — read from `git log -1 origin/v3-pre-release` 2026-09-14 01:37 EDT)* Close by §13. Session 2 cannot start until §10 is on `v3-pre-release`.

**The design-board follow-up — branch `docs/pins2-followups` (added 2026-09-14 01:37 EDT).** The critique wrote §10 as prose; Harkirat asked to see the three surfaces before anything was built. On this branch, cut from `v3-pre-release` at `f7a39bc0` and still unpushed, the same session (after a compact) wrote the planning session's answer into the plan (Compare to Session 2's main thread, G9 and G10 added, D dispatched only after the answers, Opus5-High, audit row 41), then built the design board (https://claude.ai/code/artifact/40a477ad-8237-48c4-9795-8594ea1f84ee, now tracked at `docs/superpowers/mockups/2026-09-14-pins2-board/index.html`) on the portal's own `app.css` and iterated it through five versions on Harkirat's artifact comments. His answers are §10's amended rows and preamble, §5.2 Step 9b, §5.3 Step 10b, §7, brief D, §9, §11 and audit rows 42–54, and §4b. It changes no code. **Close it by §13 like a build session:** Step 0 before any push is asked for; its version is the next moderate step read from `origin/v3-pre-release` at the pre-merge checkpoint (v3.83.0-pre if nothing else merges first). The `[P1 · XS]` "Land the pins-batch-2 plan follow-ups" reminder in `docs/db-deferred-list.md` closes when it merges.

## 4b · DESIGN-BOARD SESSION — Session 2's design gates G1, G2, G3, G4, G6 and G11

*Added 2026-09-14 02:17 EDT; rewritten 2026-09-14 02:34 EDT to the same depth as the other sessions. Harkirat asked whether the Armory manifest-row redesign (pin `pmtylf7gz`, spec §6) had been shown to him — it had not: the plan left it, with G1–G3 and G6, to two or three options and one popup inside Session 2. The G8–G10 board needed five versions and about forty comments before it matched what he wanted, so one popup is the wrong instrument. His call (2026-09-14 02:14 EDT): a board session first, for G4 and for G1, G2, G3 and G6. **G11 is added by this rewrite** — the Broadcast manifest's state column and chips, History's level chips and the shared Manifest tools row are visual redesigns his pins ask for that no gate would have shown him (audit row 55); it is reviewed on the same board.*

**When:** after `docs/pins2-followups` has merged, before Session 2. **Model:** Premise High · Delib Medium → Opus5-High. **Branch:** `docs/pins2-board-2` off `v3-pre-release`. **Builds no portal code and dispatches no agents** except the one reader test in Step 6. **Output:** §10.4 written, ledger rows, a tracked board copy — Session 2's §5.0 Step 1 stops until §10.4's placeholder is gone.

### 4b.0 · Evidence

> ⟦ONE MESSAGE⟧ Step 1 — precondition and every read, as one message.

- [x] *(2026-09-14 03:35 EDT — precondition printed 1; `index:health` exit 0; four harness captures in `local/pins2/b2-live-*.png`; dev builds exported to `local/pins2-board-2/builds.json`)* **Step 1 — precondition and evidence:**
  - `git show origin/v3-pre-release:docs/superpowers/plans/2026-09-13-portal-pins-batch-2.md | awk '/^## 10 /,/^## 11 /' | rg -c 'G8, G9 and G10 are answere[d]'` prints 1 (the follow-ups merged); then `git switch -c docs/pins2-board-2 origin/v3-pre-release`.
  - `npm run portal:status`, `npm run index:health` (exit 4 → stop), `node scripts/summaryShape.mjs --session latest`.
  - The pins, verbatim, in spec §10: `pmtylf7gz` (G4), `pmtyioc0l` · `pmtyj6u8y` · `pmtyj9low` · `pmtyj9r49` (G1), `pmtxvrjls` (G2), `pmtyj69wu` (G3), `pmtyizssz` · `pmtyj0bqw` · `pmtxviaom` · `pmtyjbql6` (G11). Spec §3, §6, §7 and §8 in full.
  - The ledger (`ctx_search`, source `project:dioreo-docs`), rows for: Armory's sortable columns, Stage deletion, masthead stats, `.thumb`/`.detcell` in the Attachments cell, the single New build chip (2026-09-11), the Manifest's `mode` chip · manifest widths by role · Broadcast's State column and `StatePill` (the ledger words it as the `.stt.saved` ink · `PILL` state map row), HeadsUp (no ledger row exists — say so rather than citing the nearest match) · Analytics' admin traffic switch and masthead stats (2026-09-02) · every `span.sp` / `p.chint` / `p.pnote` / `.hint` row · Access's "1 admin × 12 permissions" (the ledger's derived-permission-counts row) · **"Manifest reorganization (Attachments 514px/1148px, Badges 8px short)"**, the row that recorded Harkirat asking for *"a larger manifest reorganization with an opus 5 design session"* — G4 is that session. Use `ctx_search`, not `rg`: several of these rows use different words from this list. Carry each row's id into the board notes beside the gate it bears on.
  - The small-text sites: `rg -n 'class="sp"|class="chint|class="pnote|class="hint|class="nw-hint|class="bvnote|class="racknote| meta=' portal/ui/*.js` through `ctx_batch_execute`, plus every `Masthead` meta string.
  - Agent B's build-name report `local/pins2/build-name-report.txt` (gitignored, on the main checkout; if it is absent, re-run B's read-only report script from Session 1 against the dev database) and B's proven share text in `portal/ui/armory.logic.js` (`shareCommandText`).
  - The live surfaces, reproduced before drawing (§1 row 8): `http://localhost:8787/harness.html?fresh=1#/armory`, `#/broadcast`, `#/analytics`, `#/history` with chrome-devtools `new_page`, one capture each; real dev rows through `node scripts/portalRealWalk.mjs --realm armory`.
  - The tracked G8–G10 board, `docs/superpowers/mockups/2026-09-14-pins2-board/index.html` — the pattern, including the G9 answers G4 must agree with.

### 4b.1 · What each gate must show

- **G4 — the Armory manifest row** (pin `pmtylf7gz`, spec §6). Two or three directions, each on real dev builds (at least: a BAL-27 MP build with five attachments and a code, a DMZ build with nine attachments and no code, a build with a coverage flag, a build with no image, a build whose name is set). Every direction carries the spec §6 list — category colour chip, weapon, category, badges, image set or not (not by colour alone), the attachments (MP up to five, DMZ up to nine, in `CANONICAL_SLOT_ORDER` as §10.1 row 17), the gunsmith code with a copy icon (MP only), the build number, the build name only when set, a share icon copying `shareCommandText`, a tasteful category-accent tint on hover — and drops "MP" and "5 attachments". Must also show: the needs-repair shape for a coverage flag, the selection checkbox and bulk "Stage deletion", the row click that opens the edit drawer, and how weapon-name order reads with the category chips. **Must answer, with the ledger row beside it:** his pin says he never sorts by anything but weapon name, while the ledger keeps sortable Category, Gunsmith code and Attachments headers (2026-08-31, reopens "if the sort feature is found to be broken or unused") — show the row with and without them and let his comment retire or keep that row. **Must say** whether Armory gets its own row renderer inside the shared `portal/ui/manifest.js` (edited by Session 2's main thread) or the shared table grows a slot, because six realms render that component. Cite the "Manifest reorganization" ledger row as G4's mandate and retire or amend it when G4 is answered. Reuse the G9 answers where they overlap: the Tier colours (§10.1 row 18), slot names, the build-number numeral (row 4).
- **G6 — build names.** Agent B's report — every build's `buildName`, `displayBuildLabel` and derived "n of m", and every `buildName` consumer marked IDENTITY or DISPLAY — with its two options drawn as they would look in the G4 row: display-only labels now, or an identity refactor filed as its own item. The one gunsmith code sitting in a name field is listed. No data write happens in this session (§5.3 Step 10 runs it on his approval).
- **G1 — the small text** (spec §3; pins `pmtyioc0l`, `pmtyj6u8y`, `pmtyj9low`, `pmtyj9r49`). A table of every site: realm · string · kind (restatement / fact / finding) · the ledger row that cites it · the proposed treatment (cut · move to its control · a spec strip · a filter chip). Never a sweep: a site with a ledger row shows that row. Access's "1 admin × 12 permissions" noise line is sorted by kind here; its panel-bar redesign stays deferred (§6). Where a treatment changes a visible surface, draw the after state beside the table.
- **G2 — the admin-traffic control** (pin `pmtxvrjls`). Today a native checkbox, `.adminsw` (`portal/ui/analytics.js:689`, `app.css:2842`), in the Traffic panel header since v3.73.0. Three renderings in place in that header; one may reuse the G8 board's `Never ends` switch so the portal has one switch language.
- **G3 — the announcement card** (pin `pmtyj69wu`). The live-queue card `.nscard` (`portal/ui/broadcast.js:118-124`): keep the position number and "Never ends"; redesign how the announcement text and "up Nd" sit. Two or three directions on the real seeded announcements, each showing a card with the G8 answers' banner and a repeat count, because those fields now exist.
- **G11 — the manifest visuals no gate covered** (pins `pmtyizssz`/`pmtyj0bqw`, `pmtxviaom`, `pmtyjbql6`). Broadcast's manifest: the State column's badges and states, the State filter chips' colour identity, the tiny colour chips beside the Announcement column, its column spacing · History's Level filter chips carrying severity in the `LEVEL_ROW` vocabulary · the shared Manifest tools row with `+ Add build` / `+ Post announcement` placed deliberately and the category chips with no orphaned Secondaries. One direction each is enough unless a real fork appears; the column-width roles and HeadsUp's move stay Session 2's without a drawing.

### 4b.2 · The board

> ⟦ONE MESSAGE⟧ Steps 2–3 — write, render, look, publish.

- [x] *(2026-09-14 03:35 EDT — `local/pins2-board-2/`, built by `build.py` from a template and rendered from disk by `shoot.cjs`, no server)* **Step 2 — build it the way the G8–G10 board was built:** source `local/pins2-board-2/board.html`, linking the portal's own stylesheet (`node -e "require('./scripts/buildPortal').build()"` first, then copy `portal/public/app.css` beside the board). **Every board-only class is prefixed `pb-`** — the portal already owns `.panel`, `.card`, `.bar`, `.row`, `.win`, `.d`, `.thumb`, `.cv`, `.ln`, `.code`, `.rep`, `.no`, `.bad`, `.nums`, `.mono`, and unprefixed names produced double frames and stray shapes on the first board. Every clickable control 44px (chips 32px); one switch style, the portal's `.seg` pill with a thumb measured from the pressed button; no hint prose; real dev data; each gate gets a notes column naming its pins and ledger rows. **Render locally and look before every publish:** serve the repo with a no-store static server on `127.0.0.1:8900` (`python3 -c` with `http.server.SimpleHTTPRequestHandler`, adding `Cache-Control: no-store`), screenshot each state with `puppeteer-core` driving `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` (its own `--user-data-dir`, because the chrome-devtools MCP profile may be held by another session), and read every screenshot.
- [x] *(2026-09-14 03:35 EDT — version 1)* **Step 3 — publish:** `Artifact` from the repo root with `files: {"app.css": "<the copied app.css>"}`; keep one file path so every republish keeps the URL; put the URL at the top of §10.4 at once.

### 4b.3 · The review

- [x] *(2026-09-14 03:35 → 15:22 EDT — 21 versions; closed by Harkirat: "Nice! Now that's what I call refined")* **Step 4 — rounds:** Harkirat comments on the Artifact. Read them with `Artifact` `action: "comments"` (threads are not activated for Claude, so they cannot be replied to or resolved — say which stay open). Run a `sequentialthinking` pass on each round before editing; check sibling code before asking him anything; apply, re-render, look, republish — as many rounds as he takes, until he says he is done. A structural fork he must choose goes in `AskUserQuestion` after it is drawn. Between rounds, write nothing into §10.4 except the URL: interim notes stacked beside rows went stale three times on the first board (audit row 46).

### 4b.4 · Write the answers, falsify, close

> ⟦ONE MESSAGE⟧ Step 5 — the records heredoc, gates chained.

- [x] *(2026-09-14 16:12 EDT — §10.4 with the refinement contract; a ledger section and seven rows retired or amended; tracked copy with `resolved-spec.md` and `measure.cjs`; §2, §5.0, §5.2, §5.3, §7, brief D, §9, §11 amended; audit rows 57–69)* **Step 5 — write:** §10.4, replacing its placeholder: an opening paragraph (the board URL and tracked path, his cross-gate rules, anything measured) and one table per gate — `finding · severity · what Session 2 must build` — each row quoting his comment with its time (the artifact stamps are UTC; convert) · a ledger row per decision, retiring or citing every row the gate touched (the sortable-columns row above among them) · the tracked board copy under `docs/superpowers/mockups/<date>-pins2-board-2/index.html`, its stylesheet link pointed at `../../../../portal/public/app.css` · §5.2 Step 9 and §5.3 Step 10 amended where an answer changes what they build · §2, §7 and §9 where ownership moves · this section's boxes.
- [ ] *(falsification pass run 2026-09-14 16:12 EDT — audit rows 57–69; the reader agent waits for Harkirat's approval)* **Step 6 — falsify, then a reader test:** a `sequentialthinking` pass whose job is to find where §10.4 is wrong — above all, any board choice he never commented on that silently reverses a ledger row or shipped behaviour (the first board did this twice, audit rows 42–43); correct the board and say so. Then, with his approval, one read-only Sonnet reader agent with no transcript over §4b, §5 and §10.4, told to find what would make Session 2 fail. Fix what it finds and log it.
- [ ] **Step 7 — close by §13:** Step 0 before any push is asked for; the version is the next moderate step read from `origin/v3-pre-release`.

## 5 · SESSION 2 — the manifests · agent D

**Branch:** `feat/portal-pins2-manifests` off `v3-pre-release` after Session 1, the critique, the design-board follow-up and the §4b board session have merged. **Model:** Premise Med · Delib Very high → Opus5-High (Harkirat's choice, recorded 2026-09-13 22:47 EDT; was Sonnet5-XHigh).

### 5.0 · Evidence + agent D

> ⟦ONE MESSAGE⟧ Steps 1–5.

- [ ] **Step 1 — git** as Session 1 Step 1, plus the precondition `git show origin/v3-pre-release:portal/ui/tokens.css | rg -c -- '--r-history'` printing at least 1 (Session 1 merged), and `git show origin/v3-pre-release:docs/superpowers/plans/2026-09-13-portal-pins-batch-2.md | awk '/^## 10 /,/^## 11 /' | rg 'Not yet writte[n]'` printing nothing (the critique AND the §4b board session merged — §10.4 carries a placeholder until §4b writes it; scoped to §10 and bracketed so the check cannot match its own text, which appears four times elsewhere in this file — `rg` prints nothing and exits 1 on zero matches, so read the output, not a count), then D's worktree: `git worktree add -b feat/pins2-d-drawer .claude/worktrees/pins2-d feat/portal-pins2-manifests && cp .env.dev .claude/worktrees/pins2-d/`.
- [ ] **Step 2 — ledger:** manifest widths by role · the add button · Broadcast's state column and StatePill · HeadsUp · admin traffic (2026-09-02, masthead stats) · Armory's columns (sortable, Stage deletion) and its single New build chip (2026-09-11) · every `span.sp`/`p.chint`/`p.pnote`/`.hint` row.
- [ ] **Step 3 — critique output and sites:** §10 of this file must be fully written — **stop if any *Not yet written* line remains**. Same message: `rg -n 'class="sp"|class="chint|class="pnote|class="hint|class="nw-hint|class="bvnote|class="racknote| meta=' portal/ui/*.js` through `ctx_batch_execute`, plus every `Masthead` meta string. Also stop unless `awk '/^## 10 /,/^## 11 /' docs/superpowers/plans/2026-09-13-portal-pins-batch-2.md | rg -c 'G8, G9 and G10 are answere[d]'` prints 1 — the preamble that records Harkirat's board answers (this file is the one Step 1 just proved is on `origin/v3-pre-release`, because the session branch was cut from it) — and open the design board §10's first paragraph names — it is the visual spec for D and for Compare. Open the second board too — §10.4's first line names it — with its `resolved-spec.md`, the value source for G1–G4, G6 and G11.
- [ ] **Step 4 — B's output:** its build-name report (`local/pins2/build-name-report.txt`) and its new logic exports.
- [ ] **Step 5 — open** the History, Broadcast and Armory manifests with chrome-devtools `new_page`; their captures ride in Step 6's message.

> ⟦ONE MESSAGE⟧ Step 6 — take the Step 5 before-captures with `take_screenshot` on the pages Step 5 opened. **Agent D is NOT dispatched here** — it is dispatched in §5.3 Step 10b, after §5.2 Step 9b's dev write, because D's code fill and slot search read the slots that step writes. G8–G10 were answered on the design board by 2026-09-14 01:18 EDT, so D builds from designs Harkirat has seen.

### 5.1 · Gates, front-loaded

> ⟦ONE MESSAGE⟧ Steps 7–8 — read §10.4 and reproduce Step 8's symptoms with chrome-devtools.

- [ ] **Step 7 — no board, no popups.** Every design gate this session touches is answered in §10: G8–G10 on the 2026-09-14 design board, G1–G4, G6 and G11 by the §4b board session in §10.4. Read §10.4 in full and open its tracked board; do not redraw or re-ask any gate. *(Rewritten by the design-board follow-up on `docs/pins2-followups`, before it merged at 2026-09-14 02:43 EDT — this step used to render G1–G4 and G6 and ask two popups. Its original stamp was an unfilled placeholder, found and replaced 2026-09-14 16:13 EDT by the board-2 session; the exact minute is not recoverable.)*

### 5.2 · The shared manifest

- [ ] **Step 8 — reproduce** the floating add button on Armory and Broadcast, Secondaries' position, the When column's UTC value against the local clock, the Level chips' lack of severity.
> ⟦ONE MESSAGE⟧ Step 9 — one heredoc, gates chained.

- [ ] **Step 9 — one heredoc** *(amended 2026-09-14 16:12 EDT by the board-2 session, §10.4)*: **the shared `Manifest` tools row takes §10.4's toolbar rules for every realm** — labels right-aligned to one width and 12px from their controls, sibling groups inline behind a 16px divider, no count readouts, the create chip (`.madd`, `manifest.js:206`) at row 1's right end, a typed search's match count as a soft rectangle inside the field — so capture Season, Access, Review and History before and after as well as the three manifests · category chips follow `CATEGORY_CHIP_ORDER` without an orphan · column roles, not widths (`manifest.js:222-225`): When, Source and Who narrow, What detail · History's When renders local time as `Sep 6, 7:25 PM` via `Intl.DateTimeFormat(undefined, …)` (`history.js:48` reads `toISOString` today) · History's Level chips carry severity bars in the `LEVEL_ROW` vocabulary, its Kind chips keep their dot and its shown-count becomes **Load older events** (§10.4 G11 row 4) · Broadcast's manifest as §10.4 G11 rows 1–3 draw it — the `colgroup` takes the board's widths, the State column the Tab shape, Starts and Ends read On posting and No end, every header sorts — and HeadsUp moved to the top of its realm (it arrives through the Shell's `noticeSlot` — check whether the slot order affects other realms first) · the floating `p.chint` handled by its G1 kind · Armory's Bulk & Export panel is left alone here — agent D removes it whole after folding the paste into New Build, because two streams editing `armory.js:960-1090` at once is the conflict §7 exists to prevent. Gates chained.

> ⟦ONE MESSAGE⟧ Step 9b — the slot backfill: the script, its dry run and the dev write chained in one Bash call. The prod write is its own message, and only after Harkirat approves it.

- [ ] **Step 9b — copy the attachment slots from Cloudinary metadata into `Loadout.attachmentSlots`** (added 2026-09-14 01:37 EDT; §10 preamble fact ①). Compare's slot rows and D's code fill and slot search read these slots, and today every build's array is empty. Write `scripts/backfillSlotsFromMetadata.js`: dry run by default, `--write` to apply; refuse a non-localhost database unless `--prod` is passed · read every `folder:gun-builds` image's structured metadata (`Muzzle`, `Barrel`, `Optic`, `Stock`, `Perk`, `Laser`, `Underbarrel`, `Ammunition`, `Rear_Grip` — `utils/loadoutImageCache.js`) · match the image to its build by `imageKey` with its file extension stripped, compared case-insensitively — 104 of 133 prod keys end in `.png` while Cloudinary public ids carry none, so a literal match silently misses four builds in five (measured 2026-09-14 01:46 EDT); the one full-URL key is reported, not matched · place each metadata name onto the build's stored `attachments` by exact name, falling back to the normalised match `scripts/backfillLoadoutSlots.js`'s `alignSlots` uses (the 2026-07-21 run filled the metadata from those stored names) · write the parallel `attachmentSlots` array with the metadata's labels (`Muzzle` … `Rear Grip`) · print every build it could not match and every attachment it could not place · no Gemini call, no metadata write, and Cloudinary errors only through `safeErrorMessage()`. Run the dry run, then `--write` on the dev database (free). **Close:** on dev, the count of builds with a non-empty `attachmentSlots` equals the matched images carrying slot metadata, and BAL-27 Build 1 reads Muzzle · Barrel · Laser · Ammunition · Rear Grip. **The prod write is outward:** show the prod dry run, ask, restate `Approved by · to · when`, then run it. Until it runs, prod Compare falls back as §10.2 row 2 says and the code fill fills nothing.


### 5.3 · After his answers

> ⟦ONE MESSAGE⟧ Step 10 — ONE heredoc for every answered gate, gates chained; G6's single write is a separate Bash call, and only if approved.

- [ ] **Step 10 — one heredoc for every gate §10.4 records** *(amended 2026-09-14 16:12 EDT)*: **tokens first** — the board's literal radii, the nine slot hues and the boxed-button inset become tokens in `portal/ui/tokens.css` (§10.4 rule ②) · **G4** — the shared `Manifest` gains the one optional body prop §10.4's Architecture paragraph describes, only Armory passes it, and the weapon header, build row, name plate, attachment tags, image glyph, code field, action run and fault system are built from §10.4's G4 rows with values from `resolved-spec.md`, using B's `buildNumberOf`, `displayBuildLabel`, `copyCodeText` and `shareCommandText`; the staged-for-deletion row §10.4 says was not drawn is captured for Harkirat · **G6** — display-only labels (answered): `displayBuildLabel` wherever a name shows, and the Discord modal's build-name input in `handlers/manage/loadouts.js` capped at 32 characters; the one write moving `1C2B5B6D7O` out of FSS Hurricane's name field is a separate Bash call, run only on his approval restated · **G3** the card and the queue's Changes ahead column (`broadcast.js:94-139`) · **G2** the Include · Admin traffic chip replacing `.adminsw` (`analytics.js:689`) · **G1** site by site from the board's G1 table · every ledger row §10.4 and this session touch cited or retired in the same heredoc.
> ⟦ONE MESSAGE⟧ Step 10b — after Step 9b's dev write closes.

- [ ] **Step 10b — the three critique surfaces:** §10 is final — G8–G10 were answered on the design board by 2026-09-14 01:18 EDT — so do not rewrite it · dispatch agent D with brief §8.3 D (`model: "sonnet"`, background, the worktree from Step 1) · then the main thread builds Compare per §10.2 and the board's G10 states, closing on chrome-devtools reads in all four states (empty, one weapon, two weapons, one build), including a two-weapon comparison whose builds use different slots.

> ⟦ONE MESSAGE⟧ Step 11 — after a reload in its own message: chrome-devtools reads and captures together.

- [ ] **Step 11 — close:** captures after; no `.madd` outside its tools-row slot; the When cell equals `new Date(r.at).toLocaleString` for three rows; What's rendered width exceeds When, Source and Who each; `document.querySelectorAll('.sp').length` matches the G1 table's keep count per realm · **every row of §10.4's refinement contract (C1–C14) re-measured on the harness at 1282×888 with `evaluate_script` on Armory, Broadcast and History, each number written beside its box — one miss keeps this step open** · Season's, Access's, Review's and History's toolbars captured after, beside Step 9's befores.

### 5.4 · Integrate D and close

> ⟦ONE MESSAGE⟧ Step 12 — D's report read, merge, gates re-run, three claims checked.

- [ ] **Step 12:** integrate D as Session 1 Step 20, then run trap 10(c) on every selector D's appended block and the main thread both touched. Copy D's gitignored artefacts (`.claude/worktrees/pins2-d/local/pins2/d-after-*.png`) into the main checkout's `local/pins2/` before §13 Step 4 removes the worktree.
> ⟦ONE MESSAGE⟧ Step 13 — the records heredoc and the final gates.

- [ ] **Step 13:** records and close as Session 1 Step 22.

## 6 · DEFERRED — the permission restructure and the Access panel bar

**Nothing here is built by this plan.** Every input so far — the tiers, the create/modify/destructive sub-tiers and the new view-only one, the four-shape cell, the conferral answers, Access's guardrails, the purge — is in spec §5 and filed `[P1]` in `docs/db-deferred-list.md`. The Access panel bar's full redesign (pin `pmtyioc0l`) waits with it, because the bar summarises the grid being redesigned; its noise line is still sorted by kind at G1.

**Two things a builder must not do meanwhile:** apply the new `/manage` page and command colours to today's Access grid — four sit inside the 165–265° edit-identity band (spec §1.2) — or add a History row to the grid.

> **Quoted Verify, `docs/db-deferred-list.md` `[P1]` conferral, for whoever designs it:** *`portal/api/access.js` no longer contains the string `includes('manage')`; the Access grid renders inherited rings in more than one colour on real data; and a bot-side test asserts the same conferral the portal draws.*

## 7 · File-conflict map

| File | S1 main | A | B | S2 main | D |
|---|---|---|---|---|---|
| `portal/ui/tokens.css` | ✏️ | | | | |
| `portal/ui/app.css` | ✏️ | | | ✏️ in place | ✏️ **append-only block** |
| `portal/ui/shell.js` | ✏️ | | | | |
| `portal/ui/analytics.js` / the new History module | ✏️ split | | | ✏️ | |
| `portal/ui/manifest.js` | | | | ✏️ tools-row rules + the grouped-body prop (§10.4) | |
| `portal/ui/broadcast.js`, `portal/ui/composer.js` | | | | ✏️ manifest | ✏️ composer |
| `portal/ui/broadcast.logic.js`, `handlers/manage/announcements.js`, `core/ops/announcements.js` (apply), `utils/announcementBannerCache.js` (new) | | | | | ✏️ §10.3 rows 1, 2, 8 |
| `portal/ui/armory.js` | | | | ✏️ row, Compare | ✏️ drawer, Bulk & Export removal |
| `portal/ui/armory.logic.js` | | | ✏️ | | ✏️ `slotCatalogue`, `codeFill` + their test |
| `portal/api/armory.js` | | | ✏️ | | |
| `scripts/backfillSlotsFromMetadata.js` (new) | | | | ✏️ Step 9b | |
| a new image-upload route under `portal/api/` and its registration in `portal/server.js` | | | | | ✏️ §10.1 row 14 |
| `portal/ui/access.js`, `portal/ui/overlay.js` | ✏️ revoke, sessions, import | | | | |
| `portal/api/realmAccess.js` | ✏️ History visibility | | | | |
| `models/Announcement.js`, `models/UserPreference.js`, `utils/announcement.js`, `core/ops/announcements.js`, `docs/legal/PRIVACY.md` | | ✏️ | | | |
| `models/Loadout.js`, `handlers/manage/loadouts.js`, `commands/manage.js` | | | ✏️ | ✏️ `handlers/manage/loadouts.js` 32-character name cap (§10.4 G6) | |

**Rule:** where two streams share a file, the agent writes a new contiguous block under its own banner comment and the main thread edits existing rules in place — two non-overlapping hunks merge cleanly. After merging, trap 10(c) runs on every selector either side touched.

## 8 · Delegation mechanics

### 8.1 · Two traps, found by reading the tools' contracts

- 🔴 **A worktree created by the tool branches from `origin/main`** (`worktree.baseRef` defaults to `fresh`). This work lives on `v3-pre-release`. So the MAIN thread creates each worktree with `git worktree add -b <branch> .claude/worktrees/<name> <session-branch>`, and the agent's first action is `EnterWorktree({path})`. Every brief asserts ancestry before doing anything.
- 🔴 **`.env.dev` is gitignored**, so a worktree lacks it. The main thread copies it in; the agent never commits it. A UI agent serves its own harness with `PORTAL_PORT=8788 node --env-file=.env.dev portal/server.js` (`portal/server.js:167`); 8787 is the launchd service on the main checkout.
- ✅ `SendMessage` is available in this build — steer an agent mid-flight rather than re-dispatching it cold. An older plan says otherwise; that line is stale.

### 8.2 · Return contract — every agent

Branch and head sha · files changed · every gate run, each with its exit code · every factual claim on its own line · anything it could not verify, marked UNVERIFIED. No push, no PR, no merge. Commits carry both trailers.

### 8.3 · Briefs

```text
AGENT A — Broadcast delivery backend (Session 1). model: sonnet.
FIRST: load the tool (ToolSearch "select:EnterWorktree"), then EnterWorktree({path: "/Applications/Claude Code/Diors-Builds/.claude/worktrees/pins2-a"}); then run
  git merge-base --is-ancestor efa5480e HEAD && echo base-ok   — stop if it does not print base-ok.
READ: docs/superpowers/specs/2026-09-13-portal-pins-batch-2-design.md §7; docs/superpowers/plans/2026-09-13-portal-pins-batch-2.md §1 and §8.
DO:
 1. Announcement gains an optional banner image — an https URL string; no upload pipeline here, the composer decides how a URL is made — and an optional repeat count (N >= 1) with a fixed 24h minimum between showings. Declare every field in models/Announcement.js in the same change.
 2. Per-user delivery state for repeating announcements: how many times shown and when last shown, on UserPreference, declared in models/UserPreference.js. Non-repeating announcements keep today's seen-once behaviour exactly (utils/announcement.js:79-102).
 3. utils/announcement.js: an announcement is due for a user when unseen, or when repeating, shown fewer than N times and last shown >= 24h ago. Respect MAX_EMBEDS_PER_MESSAGE (10). Put the image on the embed.
 4. core/ops/announcements.js: post/edit payloads validate the new fields; validate() must accept its own replayed inverse (.claude/rules/operation-core.md).
 5. docs/legal/PRIVACY.md Appendix A and §2 describe the new stored per-user field, same commit. PRIVACY.md is a published site source: run `npm run site` and commit the regenerated public/ pages in that commit, or the site deploy refuses stale output.
 6. Tests: extend scripts/announcementOps.test.js and add a delivery test with a fixed clock: unseen, seen, repeat 3 at 0h/23h/25h/49h/73h.
GATES: node scripts/announcementOps.test.js · the new delivery test · npm run docs:audit · npm test (read exit codes, never pipe to tail).
RULES: heredoc edits with asserts and `PYEOF &&`; computed timestamps; no raw Cloudinary errors; Conventional Commits with both trailers; never push.
RETURN: plan §8.2 shape.
```

```text
AGENT B — Armory data layer (Session 1). model: sonnet.
FIRST: load the tool (ToolSearch "select:EnterWorktree"), then EnterWorktree({path: "/Applications/Claude Code/Diors-Builds/.claude/worktrees/pins2-b"}); then
  git merge-base --is-ancestor efa5480e HEAD && echo base-ok   — stop if not.
READ: spec §6; plan §1 and §8.
DO:
 1. portal/api/armory.js coverageFlags: remove no-badges; replace the exact attachment-count check with "2 or fewer" for both modes; add code-length-mismatch for MP builds whose shareCode length != 2 x attachments. Keep near-duplicate's self-exclusion.
 2. armory.logic.js: buildNumberOf(builds, build) -> {n, of} per weapon+mode ordered by _id; copyCodeText(build); shareCommandText(build, n) -> "/gunsmiths search weapon:<weapon> build:<n> visibility:Public".
 3. PROVE the share text resolves: find the resolver behind commands/gunsmiths.js's weapon option and assert, in a test, that the exact weapon string you emit resolves to the right weapon. If it cannot, emit what does resolve and say so in RETURN.
 4. displayBuildLabel(build) in armory.logic.js: the human label, or '' when buildName is an ordinal (/^Build \d+$/), 'Standard Build', or a gunsmith code. The portal row uses it; handlers/manage/loadouts.js and commands/manage.js relabel the field as an optional build name, keeping the pipe share-code convention. Stored names are NOT changed.
 5. buildName is still an IDENTITY, measured 2026-09-13: /autobuild derives the next build number AND the Cloudinary imageKey from "Build N" names (utils/loadoutRender.js:36-48), so blank names would restart at Build 1 and overwrite build 1's image; the add and bulk upsert match on {weaponKey, mode, buildName} (core/ops/loadouts.js:80, portal/api/bulk.js:41); delete-by-"weapon | build" matches it (core/ops/loadouts.js:284); Cloudinary metadata parses Build_Number from it (utils/loadoutImageCache.js:69); the scope sort tie-breaks on it (utils/loadoutScopes.js:21). So write NO migration. Write a read-only report script under scripts/ (refuses a non-localhost or non -dev database) printing, per build: id · weapon · mode · buildName · displayBuildLabel · derived build n of m · shareCode; then every buildName consumer outside tests, one line each, marked IDENTITY or DISPLAY. G6 offers Harkirat two options from it: display-only labels (this brief's step 4, nothing stored changes) or an identity refactor filed as its own item. The one gunsmith code sitting in a name field is listed, not moved.
 6. Tests for 1-3 in scripts/portalRealms.test.js or a new test wired into npm test.
GATES: the tests · node scripts/portalReverseOrphans.mjs --ci · npm test.
RULES: as agent A. B writes no data.
RETURN: plan §8.2 shape, plus the report saved to local/pins2/build-name-report.txt.
```

```text
AGENT D — New Build drawer and composer inputs (Session 2). model: sonnet.
FIRST: load the tool (ToolSearch "select:EnterWorktree"), then EnterWorktree({path: "/Applications/Claude Code/Diors-Builds/.claude/worktrees/pins2-d"}); ancestry assert as A; then
  PORTAL_PORT=8788 node --env-file=.env.dev portal/server.js (background) and verify on http://localhost:8788/harness.html?fresh=1#/armory.
READ: plan §10 in full — its first paragraph names the design board, the visual spec for everything you build (docs/superpowers/mockups/2026-09-14-pins2-board/index.html; build portal/public/app.css first with node -e "require('./scripts/buildPortal').build()"); spec §6 and §7; plan §1 and §8.
DO:
 1. The New Build drawer per §10.1 and the board's G9 — Add build and Bulk create, MP and DMZ — including Bulk create carrying BulkView's parse, its staging rule (readable builds stage, an unreadable block stays listed) and BulkOverwrites' per-field preview (armory.js:960-1090); then delete the Bulk & Export panel with the deletion rule (assert survivors).
 1b. In portal/ui/armory.logic.js: slotCatalogue(builds, mode) -> attachment name to slot label, from attachmentSlots; codeFill(builds, weaponKey, mode, code) -> one entry per digit-letter pair with its slot from the digit (1 Muzzle, 2 Barrel, 3 Optic, 4 Stock, 5 Perk, 6 Laser, 7 Underbarrel, 8 Ammunition, 9 Rear Grip) and the attachment name when another build of the same weapon and mode carries that pair, else null; MP only. Rows display in utils/adminParser.js CANONICAL_SLOT_ORDER, skipping `trigger action`, which no build carries. A test wired into npm test, including the falsifier that two weapons sharing a pair never cross-fill. Plan §10.1 rows 15-17.
 1c. The image upload route §10.1 row 14 needs, under portal/api/, registered in portal/server.js, behind requireAdmin and the Armory page grant; the upload itself runs in the op's apply on commit.
 1d. The Build name field (#ab-build) caps at 32 characters: maxLength=32 and a live n / 32 counter inside the field (plan §10.4 G6 row 2).
 2. The whole Broadcast composer per §10.3 and the board's G8 — the Banner field and its echo, the Never ends switch, the Show each player stepper and card glyphs, the budget meter, the date echoes and the In Discord preview, not only the two new inputs — bound to agent A's fields — rows 1 and 8 included, which also touch `portal/ui/broadcast.logic.js` (both op builders) and `handlers/manage/announcements.js:42` (the Discord edit payload). The banner re-host (row 2) adds `utils/announcementBannerCache.js` and touches `core/ops/announcements.js`'s `apply`.
 3. CSS: one new block at the END of portal/ui/app.css under a banner comment naming this stream; edit no existing rule.
GATES: npm test · the new armory.logic test · node scripts/portalReverseOrphans.mjs --ci · node scripts/portalStates.mjs --ci · live getComputedStyle checks on port 8788 for every §10 row, and chrome-devtools captures compared against the board's G8 and G9 states.
RULES: as agent A.
RETURN: plan §8.2 shape, plus local/pins2/d-after-*.png from chrome-devtools take_screenshot.
```

## 9 · Gates — Harkirat's decisions inside sessions

| Gate | Session | Rendered first | Asked |
|---|---|---|---|
| G1 | Board session §4b | Every small-text site: realm · string · kind · ledger row · treatment | **Answered 2026-09-14 15:59 EDT** — Session 2 applies the rewritten table (§10.4) |
| G2 | Board session §4b | Three admin-traffic controls | **Answered 2026-09-14 10:10 EDT** — Include · Admin traffic chip (§10.4) |
| G3 | Board session §4b | Two or three announcement cards | **Answered 2026-09-14 15:22 EDT** — board 2, version 21 (§10.4) |
| G4 | Board session §4b | Two or three Armory rows on real data | **Answered 2026-09-14 15:22 EDT** — weapon groups, board 2 version 21 (§10.4) |
| G6 | Board session §4b | Agent B's build-name report: every build, and every place `buildName` is still an identity | **Answered 2026-09-14 15:59 EDT** — display-only labels (§10.4) |
| G11 | Board session §4b | Broadcast's manifest state column, state chips and colour chips · History's level chips · the shared Manifest tools row | **Answered 2026-09-14 15:22 EDT** — board 2, version 21 (§10.4) |
| G8 | **Answered 2026-09-14 01:18 EDT** on the design board | The whole Broadcast composer (§10.3) — its fields and copy, and the Discord-shaped preview | Answered: build the preview; §10.3 as amended |
| G9 | **Answered 2026-09-14 01:18 EDT** on the design board | The New Build drawer (§10.1) — Add build and Bulk create, MP and DMZ | Answered: §10.1 as amended, rows 15–18 added |
| G10 | **Answered 2026-09-14 01:18 EDT** on the design board | Compare (§10.2) in its four states, cards behind "Show cards" | Answered: §10.2 as amended |

G1–G4, G6 and G11 are answered by the §4b board session, in comment rounds on an Artifact until Harkirat closes it, and written into §10.4 — decided 2026-09-14 02:17 EDT, replacing the two popups Session 2 Step 7 used to ask. G8–G10 were answered on the design board by 2026-09-14 01:18 EDT (§10's first paragraph). G5 and G7 belonged to the deferred permission work and are gone.

## 10 · Reserved — written by the critique session

**Amended 2026-09-14 01:37 EDT by the design-board follow-up on `docs/pins2-followups` — G8, G9 and G10 are answered.** Harkirat reviewed all three surfaces on a design board built from the portal's own `app.css`, in five versions and about forty artifact comments between 2026-09-13 23:09 EDT and 2026-09-14 01:18 EDT: https://claude.ai/code/artifact/40a477ad-8237-48c4-9795-8594ea1f84ee, tracked at `docs/superpowers/mockups/2026-09-14-pins2-board/index.html` (it links `portal/public/app.css`, which is gitignored build output — run `node -e "require('./scripts/buildPortal').build()"` first in a fresh clone). The rows below are amended in place, each with a dated note, and rows 15–18 of §10.1 are new. Where a row and the board disagree the row governs and the board is corrected in the same change. Screenshots of every state: `local/pins2-critique/v6-*.png` (gitignored).

**Rules he set for all three surfaces.** The board is what ships: *"what i see here is what i literally expect and think i'll see within the portal"* (2026-09-13 23:09 EDT) · no hint prose — a field shows its own result instead: *"I already know this info... so this is just useless prose to me"* (23:10 EDT) · nothing basic or lazy — *"awwwards worthy"* · the view switches sit apart from the × · badge toggles look like the badge, not a checkbox (23:13 EDT) · no jargon — "Record" was renamed (23:51 EDT) · phone is not a priority (restated 2026-09-14 00:01 EDT). The board's own system, which his later comments built on: every control a pointer lands on is 44px (chips 32px) · one switch style, the portal's `.seg` pill with a thumb measured from the pressed button · section headings that read as headings (00:45 EDT).

**Three facts measured during the review, which the rows depend on.** ① `Loadout.attachmentSlots` is empty on 133 of 133 prod builds (and on the dev clone), but Cloudinary structured metadata carries the vision slots on 130 of 134 loadout images — 217 names, none under two slots — because the 2026-07-21 vision backfill ran before the 2026-07-24 line that also writes Mongo. Harkirat remembered the slots existed (2026-09-14 00:25 EDT) after the first check had read only Mongo. §5.2 Step 9b copies them across. ② A gunsmith code's digit is the slot, and a digit–letter pair names one attachment per weapon (§10.1 row 15). ③ The Bulk create example is `formatLoadoutsAsBulkText`'s own output for real dev builds, which is also the portal's `BULK_EXAMPLE` (`portal/ui/armory.js:957`); Harkirat had doubted that format was in use (00:50 EDT).

**Two corrections the falsification pass made before these rows were written** (audit rows 42–43), each fixed on the board too: the board's Bulk create footer disabled staging on an unreadable block, which would have reversed the shipped rule without his say — the rows keep the shipped rule; and the board listed slots in the code's digit order, while Harkirat set a display order on 2026-07-21 — the rows use his order. Neither was a comment of his; he can overrule both.

### 10.1 · New Build drawer

*`/impeccable critique`, dual-agent (A design review · B detector and browser), 2026-09-13 19:23 EDT. Heuristics **22/40**; cognitive load **4 of 8** checks failed; CLI detector 0 findings, browser detector 4 inside the drawer. Both agents fell back to `puppeteer-core` because the chrome-devtools profile was held by a parallel agent. The main thread re-checked every file:line below against `portal/ui/armory.js` and `core/ops/loadouts.js`. Screenshots: `local/pins2-critique/newbuild-*.png`.*

*In-line passes, 2026-09-13 21:15 EDT: **`audit` 8/16** (performance not profiled, so scored n/a) — accessibility 2 · responsive 1 · theming 3 (no literal colours in the drawer's selectors; coverage was a regex over `app.css` for `.bform .bf- .bed .bulkview .bv .modesw .dwfield`) · integrity 2. `harden` and `clarify` rows are tagged below.*

| # | Finding | Severity | What the build must do |
|---|---|---|---|
| 1 | Paste upserts on `{weaponKey, mode, buildName}` (`upsertBulkBlocks`, `core/ops/loadouts.js:69-80`, the path `loadout.bulkAdd` takes). Once the build name is an optional blank label, two unnamed blocks for one weapon match the same record, and a paste can no longer say which existing build it updates | **P0** | The paste preview names the record each block will change — "updates ICR-1 · Build 2 of 3" or "new · Build 4" — and refuses a block it cannot match to exactly one build. How a block names its build is gate G6's answer: build number and optional `Label:` if G6 takes the identity refactor; if G6 keeps names display-only, a blank-named block for a weapon that already has builds is refused, never guessed |
| 2 | Where paste-many lives | **P1** | *Amended 2026-09-14 01:37 EDT (G9).* The header holds only the eyebrow, the title and the ×. Under it a toolbar: the MP/DMZ switch first (its look unchanged — Harkirat, 2026-09-14 00:25 EDT), a 1px rule, then a two-segment switch **Add build · Bulk create** with a card icon and a stacked-layers icon ("Paste many" read as lazy copy and its icon as "copy this item", 2026-09-13 23:50 EDT; the words are his, 2026-09-14 00:43 and 00:44 EDT). In Bulk create the title reads "New MP builds" and the body splits in two. Left, a **Builds** editor with line numbers, each build's lines sharing a left rail coloured by that build's outcome — new green (`--ok`), updated amber (`--patch`), saved with a warning orange (`--warn`), unreadable hatched red (`--danger-ink`) — the changed lines highlighted and an unreadable header underlined; its meta line counts builds and lines. Right, a tally of those four outcomes (`bulkPasteSummary`), then one row per build with the same rail, the weapon, the build, the lines it came from ("lines 1–10"), the outcome word and one detail line: an update's changed field (`Barrel  Crown-H3 Barrel → Noctkill Long Barrel`, then `BulkOverwrites`), a new build's resolved slots, a warning's message, or an unreadable block's parser message. No numbered circles (Harkirat: they confuse, 00:48 EDT); he kept the line numbers and the rails (00:50 EDT). **Staging keeps the shipped rule:** the readable builds stage and an unreadable block stays listed with its message (`bulkPasteSummary.canStage`, `armory.js:1067`) — the footer reads "Block 4 is skipped" beside "Stage 3 MP builds", and nothing stages when no block is readable ("Paste at least one build"). Switching with a partly filled single draft carries it in as the first block. The Bulk & export view loses its paste |
| 3 | The drawer states rules §6 retired: "Defaults to Standard Build" (`armory.js:394`, fallback `:352`), "counted against nine" / "a different count is flagged" (`:406`), "is not ten" (`:431`). The same `Standard Build` fallback renders in the edit title (`:580`) and Compare (`:864`, `:914`) | **P1** | Coverage copy reads "2 or fewer attachments is flagged". The code is a plain field with a copy button and a quiet check when its length matches the attachments — no hint line and no split into digit–letter pairs (Harkirat, 2026-09-13 23:45 EDT: the pairs "look and read terribly"). The `Standard Build` fallback goes from all five sites *Amended 2026-09-14 01:37 EDT (G9):* the Gunsmith code sits above the attachments (Harkirat, 2026-09-14 00:47 EDT) and fills them — row 15. MP only (row 17). |
| 4 | The draft preview passes `siblings=${[previewBuild]}` (`:479`), so the card always reads "Build 1 of 1" | **P1** | *Amended 2026-09-14 01:37 EDT (G9).* A **Build** section heads the form: **Weapon** — a fuzzy search over existing weapons (row 16); picking one fills Category — beside **Category**; then **Label**, with the build number computed from the real siblings locked into the field's left edge as a display numeral in the realm colour ("BUILD 6") and the placeholder "Build 6". The preview card uses the same number. This replaces the read-only "Files as Build 4 of 4" line and its hint: the number first moved out of the title ("orphaned up in the title", 2026-09-13 23:51 EDT), and a separate number box was rejected ("the build # implementation is just ugly", 2026-09-14 00:40 EDT) |
| 5 | Esc or the scrim discards a dirty draft silently; both agents measured focus landing on `<body>` after Esc although `overlay.js:35-40` restores the opener — cause unconfirmed; on open, focus sits on × rather than the first field | **P1** | Ask "Discard this ICR-1 draft?" when any field is dirty. Open with focus on `#ab-weapon`. Close returns focus to the New build chip, verified with `document.activeElement` after Esc |
| 6 | Paste lets coverage regressions through without comment — a new 1-attachment build and a 5 → 2 overwrite, seen live; the weapon name truncates to "A…" in the overwrite list | **P1** | A block that produces ≤2 attachments, or a code whose length is not 2× its attachments, wears the needs-repair shape in the preview; the weapon name never truncates |
| 7 | The paste textarea (`:1045`) has no accessible name, only a placeholder | **P2** | Label it "Builds to paste" *Amended 2026-09-14 01:37 EDT:* the editor is labelled **Builds** (row 2). |
| 8 | At 390 wide the preview sits 1,955px down, the intro fills the first screen and the footer status clips to "ill needs a weapon name" | **P2** | Below 600px: hide the intro, put the footer status on its own line above the buttons, and make the preview a "Preview record" disclosure under Identity |
| 9 | Explanation prose outweighs the fields: MP-empty content is 1,406px against 608px visible; the badges policy and image-convention paragraphs are always open | **P2** | Intro becomes one line ("Weapon and category stage it; the rest can follow"); the policy and image paragraphs become one-line hints with a disclosure *Amended 2026-09-14 01:37 EDT (G9):* the board draws no intro and no policy or image paragraph. Every section has a real heading — Build · Attachments · Badges · Image, set in `--t-md` 600 with a hairline rule to the right (Harkirat, 2026-09-14 00:45 EDT) — and fields show their own result instead of a hint line. |
| 10 | Small type and targets: 9.5px eyebrow and "The record you are writing"; 10.5px `p.imgnote` and `em.modetag`; five 28px Clear buttons between the attachment inputs (10 Tab stops for 5 slots); disabled Stage green close to enabled | **P3** | Type at or above the 11px floor; Clear buttons out of the Tab order (reachable by Delete on an empty input); a disabled Stage that reads as disabled; a "Stage and add another" secondary action |
| 11 | `harden` — `handleAdd` ignores the result of `stageOps` (`portal/ui/armory.js:1212`), which never throws — a 403, a CSRF refusal or a validation error resolves to a failure object — so the drawer closes and says "Staged" while nothing was staged and the draft is gone. BulkView already does this right (`armory.js:1020-1023`, `reportFailure` from `async.js:121`) | **P1** | Check the result: on failure keep the drawer open with the draft intact and show the refusal inline, the way BulkView does; close and toast only on a `changesetId` |
| 12 | `harden` — the Stage button has no busy state, so a double click stages two identical `loadout.add` ops and Review shows a duplicate build | **P2** | Disable Stage and show "Staging…" from click until the result returns |
| 13 | `clarify` — the preview caption "The record you are writing" names the act, not the thing; the paste mode will need its own caption | **P3** | "Record preview" in One build; "What this paste will change" in Paste many *Amended 2026-09-14 01:37 EDT (G9):* the side panel in Add build is headed **In Discord** ("reword record, it's jargon", 2026-09-13 23:51 EDT); Bulk create has no caption — its tally heads the column. |
| 14 | **Image needs an upload or link path, not only a Cloudinary key.** Today the admin must upload to Cloudinary, rename the public ID and paste the key. `/autobuild` already takes a screenshot or URL to Cloudinary (`utils/loadoutImageCache.js`: `deriveImageKey(weaponName, mode, takenKeys)` and `uploadLoadoutImage(sourceUrl, imageKey)`), and the portal has no upload endpoint | **P1** | The Image section gets a switch: **Upload or link** (default) — drop a screenshot or paste a link, the key is derived with `deriveImageKey` (next free `BAL-27-6`, `DMZ-` prefix for DMZ) and stays editable, and the upload happens in the op's apply on commit, as `/autobuild` uploads only after Confirm so an edited name never orphans an upload · **Existing key** — today's key field, with a found / not found echo. Needs a portal upload route and the drop target; `uploadLoadoutImage` overwrites an existing public ID, so the derived key must skip taken keys (Harkirat, 2026-09-13 23:45 EDT) |
| 15 | **A pasted gunsmith code already names most of a build's attachments** (added 2026-09-14 01:37 EDT; Harkirat asked 2026-09-14 00:47 EDT: *"is that really possible using the data of all the stored attachments/loadouts/codes we have in the database?"*). The digit is the slot — 1 Muzzle · 2 Barrel · 3 Optic · 4 Stock · 5 Perk · 6 Laser · 7 Underbarrel · 8 Ammunition · 9 Rear Grip — agreeing with the Cloudinary slot metadata on BAL-27 1–5, FFAR 1 1–3, ICR-1 and DL Q33; a keyword classification of 456 attachments put 446 in a digit their code carries, and all 10 misses were the classifier's own errors (FMJ is a perk, YKM Integral Suppressor is a barrel). A digit–letter pair names the same attachment on every build of the same weapon: 0 conflicts over 413 weapon-and-pair keys, across the 121 images carrying both a code and slots; the same pair on different weapons disagrees on 36 of 56 | **P1** | MP only. Pasting or typing a code creates one attachment row per pair, in the display order of row 17, and fills each name from another build of the same weapon and mode carrying that pair (`codeFill`, brief D 1b). The Attachments heading reads "4 of 5 filled from the code" with a wand icon, and each filled row carries a small `--patch` dot beside its slot name. A pair that weapon has never used leaves its row open with the slot already named. Measured leave-one-out on real data: 311 of 587 attachments filled, 0 wrong, 15 of 121 builds complete. Needs §5.2 Step 9b's slots in Mongo. The test's falsifier: two weapons sharing a pair never cross-fill |
| 16 | **The weapon and attachment fields had no search** (Harkirat, 2026-09-13 23:53 EDT: *"does the attachment's field support fuzzy search/auto-complete? because it should. Same with the weapon name field."*) | **P1** | Both are fuzzy searches using `utils/search.js`'s normalisation (spaces, hyphens, underscores and dots ignored), with the matched part highlighted in `--patch`. A row whose slot is already known lists only that slot's attachments; without a code, each match shows its slot and a match for a slot already filled is greyed. No build counts in the list ("that's just bloat", 2026-09-14 00:41 EDT). Picking a name files it into its slot (`slotCatalogue`, brief D 1b) |
| 17 | **DMZ builds were drawn as a copy of MP** (Harkirat, 2026-09-14 00:35 EDT: *"Dmz builds can have up to 9 attachment slots. They also don't carry the gunsmith code."*) — and the rows needed one order | **P1** | Rows are named by slot and listed in the display order Harkirat set on 2026-07-21, `CANONICAL_SLOT_ORDER` in `utils/adminParser.js` (optic · muzzle · barrel · stock · laser · underbarrel · trigger action · rear grip · ammunition · perk); the code's digit order is only for reading a code. `trigger action` is in that array but is never a slot a build carries — the vision prompt treats it as a restricted-slot label (`utils/visionExtract.js:43`) and the Cloudinary metadata has no field for it — so rows never show it. **MP:** up to 5 rows, the code field, the code fill. **DMZ:** up to 9 rows, no code field and no code fill; its image key takes the `DMZ-` prefix (row 14) |
| 18 | **The rank dropdown read "Rank · BEST" and nobody could tell what it did** (Harkirat, 2026-09-13 23:54 EDT) | **P2** | Under **Badges** — META and TOXIC as toggle badges with a check inside the badge, and a chip naming every build they reach ("all 6 BAL-27 builds", because badges are per weapon) — a switch **Tier in AR** (his words, 2026-09-14 00:41 EDT): None · Best · Top 3 · Top 4 · Top 5, writing `categoryRank`. DMZ reads **Range tier**: None · Best close · Best mid–long · Top 3 · Top 5, writing `dmzRangeRank` (the DMZ label is derived, not his). The switch's thumb takes the tier's colour (00:42 EDT): Best in the legendary gold `#F2C230` already used by `.t-legendary` — add a token for it rather than a fourth literal — Top 3 in `--info`, Top 4 and Top 5 fading toward the raised ground, None neutral |

### 10.2 · Compare panel

*`/impeccable critique`, dual-agent (A design review · B detector and browser), 2026-09-13 19:26 EDT. Heuristics **22/40**; cognitive load **5 of 8** checks failed; CLI detector 0 findings; the live detector's Compare-owned findings are `undersized-ui-text` and `skipped-heading` (its `text-occlusion` hits are its own labels, a false positive). States driven: empty · one weapon (BAL-27, 5 builds) · two weapons (BAL-27 + FFAR 1) · one build (DL Q33, AK117). The main thread re-checked the CSS claims against `portal/ui/app.css`. Screenshots: `local/pins2-critique/compare-*.png`.*

*In-line passes, 2026-09-13 21:15 EDT: **`audit` 7/16** (performance n/a) — accessibility 1 · responsive 1 · theming 3, one literal colour `.cmptab tr.diff{background:rgba(242,194,48,.05)}` (`app.css:1769`) · integrity 2 (a dead `.dnow` class and a max-width override). `clarify` rows are tagged below.*

| # | Finding | Severity | What the build must do |
|---|---|---|---|
| 1 | **A differing cell is not marked at all.** `td.dnow` is applied, but its only rule is `.diff-r .dnow` (`app.css:1232`), so inside `.cmptab` it computes identical to its neighbours. Difference is carried only by a 5% amber row tint and an amber label — colour alone, in the one panel whose job is difference | **P0** | Give `.cmptab td.dnow` its own shape: the bordered inline value box of the 2026-09-11 note, plus a non-colour mark (weight and a visually hidden "differs"). Label the baseline column the cells are compared against *Amended 2026-09-14 01:37 EDT (G10):* the baseline column is tinted and headed "baseline"; a differing value is raised with a `--patch` ring — two signals, no left bar — and keeps a visually hidden "differs". |
| 2 | Attachments render as one comma-joined string per cell, so two builds that differ by one attachment cannot be told apart | **P0** | *Amended 2026-09-14 01:37 EDT (G10).* One row per slot, the slot named in the first column; the rows are every slot any shown build uses, in the display order of §10.1 row 17. Cell states: the baseline's attachment is plain text · a different attachment is row 1's mark · a slot the baseline has and this build lacks is a dashed `--warn` **Not equipped** cell · a slot neither uses is a dash. Slots come from `attachmentSlots` after §5.2 Step 9b; a build with none lists its attachments in stored order in an **Attachments** row under the slot rows. Harkirat asked whether builds with different slot sets had been considered (2026-09-14 00:01 EDT); the board's two-weapons state answers with real data — BAL-27's Laser beside FFAR 1's Underbarrel |
| 3 | The cards come before the table: at 1440 the table starts ~1,265px down. `.dcard.lc{max-width:none}` (`app.css:2674`) beats `.cmpcards .dcard{max-width:360px}` (`:1753`), so a fifth or a single card stretches to 1,274px | **P1** | Table first, then a collapsed "Show cards" control under it that opens the Discord cards side by side — **Harkirat, 2026-09-13 20:52 EDT: keep them behind a toggle** (offered with the one-weapon screenshot, against dropping them). Closed by default on every open of Compare. Fix the max-width override so an open card stays ≤360px |
| 4 | Weapon, Build and Image always differ, and they count toward "N fields differ" | **P1** | Pin the identity rows as a header block outside the count; order the remaining rows differing-first. All rows still draw — `armory.js:703` keeps matching rows on purpose *Amended 2026-09-14 01:37 EDT (G10):* weapon and build live in the column headers — "Build 2", or "BAL-27 · 1" with two weapons — rather than as rows. The gunsmith code is its own group below the slots, MP only. Identical fields fold into one "Same on all N" pill row. |
| 5 | Two weapons: 8 builds chosen, 6 columns shown, and the dropped builds' chips still read as selected; at the cap the weapon input goes disabled without saying why | **P1** | A dropped build's chip shows a "not shown" state and the panel states the cap ("6 columns — 2 builds not shown"); split the columns across the two weapons rather than filling from the first |
| 6 | Matching rows use `--ink3` at `opacity:.55` (`app.css:1767`), measured **2.55:1** — fails AA | **P1** | Dim with a token colour at or above 4.5:1; no opacity on text |
| 7 | At 390 wide the panel overflows (empty state 435 vs 364, from a 448px suggestion button) and six columns in 332px make a 2,571px table | **P1** | Below ~640px, a stacked view: one block per field, each build's value on its own line, differing values marked as in row 1; suggestion buttons wrap *Amended 2026-09-14 01:37 EDT:* not built this session — phone is not a priority (Harkirat, restated 2026-09-14 00:01 EDT). The table scrolls horizontally inside its own container. |
| 8 | Chips and column headers fall back to `Standard Build` (`armory.js:864`, `:914`); after §6 every build of a weapon reads the same | **P1** | Label every build with the derived "Build n of N"; the optional name is a second line only when set *Amended 2026-09-14 01:37 EDT:* the column header reads "Build n"; "of N" is dropped because every column of a weapon shares it. |
| 9 | One build: the stats read "1 builds lined up · — nothing to differ from yet" (`armory.js:907`) — a grammar slip and a dead end | **P2** | Hide the stats below two builds; offer one or two same-category suggestions ("Compare AK117 against KN-44") |
| 10 | Adding, removing or excluding a build changes the stats and table silently; Compare has no live region | **P2** | A polite live region carrying the stat line ("3 builds · 4 fields differ") |
| 11 | Screen-reader structure: field labels are `td`, not `th scope="row"`; no `<caption>`; two weapons' chips both read "Build 1, Build 2"; card titles are `h6` directly under the page `h1` (`armory.js:736`) | **P2** | `th scope="row"` and a caption naming the weapons; each chip group `role="group"` with the weapon as its label; card titles at the next heading level |
| 12 | 9.5px `--t-micro` on `.lc-badges span` and `.lc-foot`; the Image row prints raw keys (`FFAR-1-1.png`); no sticky header or first column on a tall table | **P3** | Type at or above the 11px floor; the Image row shows a thumbnail or "set / not set"; sticky header row and field column |
| 13 | `audit` — the differing-row tint is a literal `rgba(242,194,48,.05)` (`app.css:1769`) rather than a token | **P3** | Derive it from the token the amber label uses |
| 14 | `clarify` — the empty state says "Nothing to compare yet." then "Pick one weapon, or two."; the real limit is six columns, and the two uses are different questions | **P2** | Heading "Pick a weapon"; one line "Its builds line up slot by slot. Add a second weapon to set them side by side." The cap is stated where it bites (row 5), not here *Amended 2026-09-14 01:37 EDT (G10):* "field by field" became "slot by slot" with row 2. |

### 10.3 · Composer — banner image and repeat inputs

*`/design-critique`, inline, 2026-09-13 19:23 EDT — Harkirat moved this surface off `/impeccable critique` after its two agents had been dispatched; both were stopped before reporting. Inspected on `#/broadcast` at 1024×768 and 390×844. **The backend already exists**: Session 1 added `bannerImageUrl` and `repeatCount` to `models/Announcement.js`, `announcementDeliveries` to `UserPreference`, validation in `core/ops/announcements.js:41-60`, delivery in `utils/announcement.js:43-52` and PRIVACY 1.15 (pending). Only the composer inputs are missing, and `buildBroadcastAddOp` (`portal/ui/broadcast.logic.js:4`) does not carry either field.*

*In-line passes, 2026-09-13 21:15 EDT: **`audit` 8/16** (performance n/a) — accessibility 3 · responsive 1 · theming 3 (no literal colours in `.dwfield` / `.dw-grid2`) · integrity 1 (rows 1 and 8, and row 9 below). `harden` and `clarify` rows are tagged below.*

| # | Finding | Severity | What the build must do |
|---|---|---|---|
| 1 | **A blank "Ends" posts an announcement that never ends, while the drawer says "blank = the server's 60-day default, not never".** The portal sends `expiresAt: null`, which `alreadyNormalized` (`core/ops/announcements.js:13`) passes through untouched. Measured with the real `validate`: portal-shaped blank → `null`; `/manage`-shaped blank (`expiry: ''`) → 60 days out | **P1** | When Ends is blank, omit the `expiresAt` key from the payload, so `alreadyNormalized` is false and `computeExpiresAt('')` applies the 60-day default; give "never" an explicit control that sends `expiry: 'never'`. Both measured with the real `validate` on 2026-09-13: omitted key → 60 days out; `expiry: 'never'` → `null`. Raises the existing `[P2 · S]` "EXPIRY DATE where the design takes blank, days, or never" item in `docs/db-deferred-list.md`: it is not only that "never" is inexpressible — the blank case is wrong today. Verify by staging a blank-end post and reading a date 60 days out in Review *Amended 2026-09-14 01:37 EDT (G8):* the never control is a switch, "Never ends", on the Ends label row; turned on, the date input and its echo are replaced by a pink-tinted field, "Stays up until you remove it", and the payload sends `expiry: 'never'`. A chip inside the field read as a copy button (Harkirat, 2026-09-14 00:07 EDT). |
| 2 | Banner image — the input | **P1** | A field **Banner** directly under Text, before the date row: an https link field. **The link is re-hosted to Cloudinary, the way every other pasted link in this repo is** (Harkirat, 2026-09-13 21:57 EDT) — mirror `utils/patchNotesCache.js` and `utils/calendarBannerCache.js`, do not invent: a new `utils/announcementBannerCache.js`; remote-URL upload with `overwrite` and `invalidate`; `asset_folder: 'announcement_banners'`; `public_id` keyed on the announcement's own `_id`, which exists only inside the op's `apply` (`createDocument`), so the re-host runs there — the precedent is `core/ops/patchnotes.js` re-hosting inside its own apply; the stored `bannerImageUrl` is the Cloudinary URL through `withDeliveryDefaults()` (`f_auto,q_auto`); a failed upload never blocks the post and stores the raw link, as the siblings do; errors only through `safeErrorMessage()`. **No prune job and no delete on clear** — a dedicated folder, bulk-deleted by hand when he chooses. ⚠️ An undo in Review restores the PRIOR URL string, so a re-hosted banner that was overwritten in place under the same `public_id` would serve the new image through the old URL: make the `public_id` survive an undo (for example `{_id}-{short hash of the source link}`) and verify by changing a banner, undoing it, and seeing the original image. The drawer previews the raw link before commit, because no `_id` exists yet. Left of it an 80px thumbnail using the `<img onError onLoad>` detector the Season composer already uses (`portal/ui/composer.js:207`); a link that loads echoes its size under the field ("✓ 1600 × 900"); one that does not load shows a warning icon in place of the thumbnail, a `--warn` border and the echo "didn't load", and does not block. The op's own error "The banner image needs to be a full https:// URL." shows inline on a non-https value *Amended 2026-09-14 01:37 EDT (G8):* no hint line — the echo is the result (Harkirat's no-hint-prose rule). The re-host mechanics above are unchanged. |
| 3 | Repeat — the input. `repeatCount` is the TOTAL number of showings per player (`utils/announcement.js:49`); the 24-hour gap is fixed, not configurable | **P1** | A field "Show each player" with a − N + stepper, 44px, default 1, min 1. 1 sends `repeatCount: null`, so a one-time announcement writes nothing to `announcementDeliveries`. No interval field. When N exceeds the window (floor((end − start) / 24h) + 1, with the 60-day default when Ends is blank), the cards past that number turn `--warn` after a stop line, with "5 fit by Sep 20", and do not block *Amended 2026-09-14 01:37 EDT (G8):* beside the stepper, one small Discord-card glyph per showing (a raised tile with a Broadcast-pink left edge) and a clock tag "1 a day max". No dates: a player who does not open Dioreo for three days sees the next showing on day four (Harkirat, 2026-09-14 00:04 EDT). Two earlier drawings were rejected — dated dots, then numbered tokens joined by "24h+" (00:52 EDT). |
| 4 | The composer has no preview. The page already renders the live queue as Discord cards (`broadcast.js:94`, the port of the mockup's queue preview at `broadcast.html:194`), but the drawer shows nothing, and with an image a preview is the only place its placement can be judged | **P1** | Render the announcement as Discord will — heading line, body, relative post time, banner image — beside the fields, headed **In Discord**, with no line under the card: row 3's repeat visual carries the count. *Amended 2026-09-14 01:37 EDT (G8):* build it — Harkirat, answering how to treat G8 before the board: *"build with the preview but please drastically rework all that hint prose"*. Linksee anchor #4's composer-preview item is answered; its other three items are not |
| 5 | The rules for blank live in placeholders, which disappear on the first keystroke and clip at every width ("blank = the moment you commit, or" at 1024; "blank = the moment you c" at 390) | **P2** | Placeholders become examples ("in 3 days", "Sep 21"); the meaning of blank moves to an echo under each field — the resolved day ("✓ Wed Sep 16") or, for a blank Ends, "default · Sun Nov 15" (*amended 2026-09-14 01:37 EDT*: no hint lines). Starts and Ends share one label-row height, so the two inputs align even with the switch beside Ends |
| 6 | At 390 wide the two-column date row runs past the drawer's right edge and the footer status clips at the left ("rite the announcement first") | **P2** | `.dw-grid2` stacks to one column below 560px; the footer status takes its own line above the buttons *Amended 2026-09-14 01:37 EDT:* phone is not a priority this session; keep the stacking rule only if it costs nothing. |
| 7 | Room for two new rows: at 1024×768 the body is 402px with ~26px free above the footer, so two added fields make it scroll | **P2** | The second paragraph ("Every live announcement is attached to the bot's next reply…") becomes one line or a disclosure, so Text, Banner, dates and Repeat stay above the footer at 768px tall |
| 8 | **Any edit wipes a banner and a repeat count.** The edit apply writes `bannerImageUrl: payload.bannerImageUrl \|\| null` and `repeatCount ?? null` (`core/ops/announcements.js:113`), but neither `buildBroadcastEditOp` (`portal/ui/broadcast.logic.js:12`, wired to the Manifest's inline edits at `broadcast.js:450`) nor `/manage`'s Discord edit (`handlers/manage/announcements.js:42`) sends them. Session 1 shipped the fields and nothing sets them yet, so today the loss is latent — the dev database holds 4 announcements, 0 with a banner and 0 with a repeat count (measured 2026-09-13) — and it becomes real the moment the composer can set them. Filed under 🐞 Active Bugs in `docs/db-deferred-list.md` | **P1** | Both edit builders carry `bannerImageUrl` and `repeatCount` from the row, in the same change that adds the inputs. Verify by staging a text edit on a record that has both and reading them unchanged in Review's preview |
| 9 | `harden` — `handleAdd` ignores the result of `stageOps` (`portal/ui/broadcast.js:367`), which never throws — a 403, a CSRF refusal or a validation error resolves to a failure object — so the drawer closes and says "Staged" while nothing was staged and the draft is gone. BulkView already does this right (`armory.js:1020-1023`, `reportFailure` from `async.js:121`). Once the banner field exists, the op's own "needs a full https:// URL" refusal arrives only through this path, so it would be invisible | **P1** | Check the result; on failure keep the drawer open and show the op's error under the field it names |
| 10 | `harden` — no length guard anywhere: not in the drawer, the op or `/manage`. Delivery sends every due announcement as up to 10 embeds in ONE follow-up (`utils/announcement.js:117-122`), Discord refuses a message whose embeds exceed **6,000 characters** in total (Discord docs, read 2026-09-13), and the catch treats every failure as an expired interaction and marks nothing seen — so one long announcement makes the whole batch fail on every command, for every player. Repeating announcements stay due for days and make the total easier to reach | **P1** | The composer counts characters and shows what the live queue leaves as a thin 4px meter under Text — Armory Repairs' `.cmeter` — with the other live posts in a dimmed Broadcast pink (`color-mix` 38% over the raised ground), this post in full pink, and "3,180 of 6,000 left" beside it (*amended 2026-09-14 01:37 EDT*: Harkirat pointed at the Repairs bar after Analytics' fill rows read as bloat, 2026-09-14 00:53 and 01:00 EDT, and asked for the dimmed pink once the shared total was clear, 01:18 EDT) and blocks a post that could never send. The delivery-side fix is bot runtime and is filed under 🐞 Active Bugs |
| 11 | `harden` — Stage post has no busy state; a double click stages two identical announcements | **P2** | Disable and show "Staging…" until the result returns |
| 12 | `clarify` — the footer opens in the blocked red, "Write the announcement first.", before anything has been typed | **P3** | Neutral ink until Text has been touched; the disabled Stage button already carries the state |

### 10.4 · Session 2's gates — G1, G2, G3, G4, G6 and G11

**Board:** https://claude.ai/code/artifact/55493bbe-74e7-4ec4-b2e5-02af33654aef — **closed at version 21** by Harkirat, 2026-09-14 15:22 EDT: *"Nice! Now that's what I call refined."* **Tracked:** `docs/superpowers/mockups/2026-09-14-pins2-board-2/index.html` (it links `portal/public/app.css` — build it first in a fresh clone), with **`resolved-spec.md`** beside it — every element's winning CSS declaration and computed value, resolved by Chrome from the rendered board — and **`measure.cjs`**, the refinement contract below as an instrument that exits 1 when a rule breaks. **Written 2026-09-14 16:12 EDT.**

**Reviewed in 21 versions between 2026-09-14 03:35 and 15:22 EDT:** artifact comment rounds (UTC stamps converted: 13:41–14:15 UTC = 09:41–10:15 EDT, 15:22–16:01 UTC = 11:22–12:01 EDT), chat rounds at 10:34, 10:56, 11:08, 13:42, 14:05, 14:11, 14:21, 14:24, 14:36, 14:55, 15:00 and 15:12 EDT, and popups at 13:06 EDT (plate · fault mark · state shape), 14:59 EDT (the attachment brief) and 15:59 EDT (G6 and G1). Where a row below and the board disagree, the row governs and the board is corrected in the same change.

🔴 **How to build from this, and the three ways it fails.** **① Never read a value off the board's CSS.** It is thirteen rounds of overrides appended to one `<style>` block; the first `.pb-rb` rule reads `44px 116px…` and the rendered row is `32px 28px minmax(0,1fr) 28px 144px 113px`. Port from `resolved-spec.md`. **② Port onto tokens, never paste literals.** The board used radii of 5px (search count, empty tags), 6px (attachment tags, end boxes, pills) and 7px (code field, popover) against `--rad-1`/`--rad-2`/`--rad-3` (values in `resolved-spec.md`'s token table): take the nearest token where it is within 1px, otherwise add one named token to `portal/ui/tokens.css` and note it in `DESIGN.md`. The nine slot hues become tokens — `oklch(76% .055 H)` with H: muzzle 25 · barrel 65 · stock 105 · underbarrel 150 · optic 190 · laser 225 · rear grip 260 · perk 300 · ammunition 340. The 5px inset of a boxed icon button (`--pb-inset` on the board) becomes a portal token too. **③ Board-only things never ship:** the `pb-` classes · the `pb-hov` demo rows that show a hover at rest (BAL-27 build 1, Season 7's announcement — Harkirat asked about the glow at 11:49 EDT; it only demonstrates hover) · the "One staged" switch · the ten-weapon curated list · the example edits (ARGUS's missing image, AS VAL "Close quarters", BAL-27 "Ranked hardpoint") · the banner gradient standing in for an image · the MP/DMZ switch in the gate head (the portal's masthead owns mode).

**The refinement contract — close conditions for every surface below.** Each rule is a correction Harkirat made by hand this session, and each is a RELATION between elements, which is why no per-element check caught it. `measure.cjs` proves them on the board; Session 2 re-measures each on the portal with chrome-devtools `evaluate_script` at 1282×888 and records the number (§5.3 Step 11).

| # | Rule | Target | His correction |
|---|---|---|---|
| C1 | No hint prose and no count readout beside a manifest | counts live on chips; a typed search shows "N matches" as a soft rectangle inside the field; History's shown-count becomes **Load older events** | 09:42 and 09:55 EDT; 11:51 EDT |
| C2 | Pills are for filter chips and states only | attachment tags, the search count, Collapse all and every metadata chip are soft rectangles | 11:36, 11:38, 11:51 EDT |
| C3 | One visual height for boxed controls, one centre line per row | 34px boxes (fix chip, code field, icon boxes); a row's cells, and a header's name, fix chip and collapse, share a centre within 1px | 14:21 EDT |
| C4 | A control at a container's edge lands its VISIBLE edge on that edge | a boxed icon button draws its box 5px inside its 44px target, so the one at an edge hangs out by 5px; every manifest's right-edge controls end on its 16px padding line; a card's text box, end box and delete share one right edge | 14:24 EDT — *"don't fix the instance, fix the class"* |
| C5 | One label-to-control gap | 12px for every toolbar label; first-column labels right-align to one width so stacked rows still start their controls on one line | 14:36 EDT |
| C6 | Sibling groups in a toolbar row sit inline behind one divider | 16px on both sides of the divider; never pushed apart with an auto margin | 14:36 EDT |
| C7 | Moving an element re-balances what it leaves | a lifespan bar's two ends are equal 100px boxes and the bar fills between them with 12px each side | 14:36 EDT |
| C8 | No dead space inside a sized container | the code column is the widest code plus 12px padding each side plus its 38px button (144px); the name plate hugs its name up to 156px | 15:00 EDT |
| C9 | A run of actions is evenly spaced, with the destructive one set apart | 22px between adjacent boxes; a 1px divider before delete with 17px each side | 13:42, 15:12 EDT |
| C10 | Information on the left, actions on the right | the build count sits on the category line, not beside the collapse button | 13:42 EDT |
| C11 | Faults show as colour and shape on the faulty cell, never as prose in a row | details live in the header chip's popover | 13:42 EDT |
| C12 | Nothing a reader needs is truncated | attachment and build names wrap; 0 truncated on the board | 14:36 EDT |
| C13 | A variant is a different answer to his constraints, never a direction he already refused; after two misses, get the brief in a popup | — | 14:36 and 14:55 EDT |
| C14 | Check at 1282 AND on the phone viewer | on a narrow screen each section scrolls sideways rather than squeezing its right edge away | 14:11 EDT |

**Architecture — decided here so Session 2 does not re-derive it.** Armory renders through the SHARED `Manifest` (`portal/ui/manifest.js:94-402`): one `<table>`, a `colgroup` and one cell per column, used by six realms. Weapon groups — a header per weapon and grid build rows — cannot be expressed as column renderers. **The `Manifest` keeps its tools row, search, chips, selection, bulk bar, sort persistence (`manifest.js:111-121`) and keyboard behaviour, and gains one optional prop through which a realm renders the body from the rows it has already searched, filtered, sorted and marked selected; only Armory passes it, and every other realm renders exactly as today.** Broadcast and History stay tables: the board's Broadcast grid translates to `colgroup` widths and cell padding, and its left accent bar to a cell pseudo-element. **The toolbar rules (C1, C2, C5, C6) live in the shared tools row, so they move Season, Access, Review and History too** — Session 2 captures those realms before and after.

**Not drawn, and required.** A build staged for deletion inside a weapon group: carry the shipped staged treatment (shape carries state — dashed) onto that build's row and capture it for Harkirat before merge · the row click still opens the edit drawer (shipped; the board draws the open row's patch-tinted selection) · the selection bar as drawn (`N selected · Export selection · Stage deletion · ×`), which is the shipped `SelectionBar`.

#### G4 — the Armory manifest

| # | Finding | Severity | What Session 2 must build |
|---|---|---|---|
| 1 | One row per build, with sortable Category, Gunsmith code and Attachments headers | **P0** | **Weapon groups.** *"I think the 'weapon groups' version is a better method… Grouped looks better and makes more sense"* (09:41 EDT). One group per weapon in weapon-name order; the column-head row carries only the **Weapon** sort (chevron up/down) and, at its right end, **Collapse all / Expand all**. The 2026-08-31 sortable-columns ledger row is retired: pin `pmtylf7gz` — *"I'll never sort the armory's manifest by anything other than the Weapon Name"* |
| 2 | The weapon line | **P1** | **Header row, 52px:** grid `32px auto minmax(0,1fr) auto` — the checkbox that selects every build of the weapon, then the weapon name (`--t-md` 600), the category word in the category colour (micro caps, .16em) followed by **"• N BUILDS"** (a 3px dot, `--ink3` micro caps) — on the left, because the right side is for actions (13:42 EDT) — then a 1px rule and the outline tier / META / TOXIC tags. **A 4px category accent edge on the header only** and a category-tinted gradient on its left third; builds carry the accent only on hover (10:56 EDT). The whole header toggles its group; its collapse button at the right is a boxed icon (C3, C4) using **fold / unfold** glyphs, distinct from the sort chevron (11:35 EDT) |
| 3 | Collapse all | **P2** | A boxed text button with the fold glyph — not a pill (11:36 EDT) — at the far right of the column-head row (11:23 EDT), its visible right edge on the manifest's padding line |
| 4 | The build row | **P1** | **52px minimum**, grid `32px 28px minmax(0,1fr) 28px 144px 113px`, 12px gap, padding `0 16px 0 20px`: checkbox · **build number** (display face 21px, `--ink3`, left-aligned so it starts on the weapon name's line — 15:12 EDT; the category colour on hover) · content · image glyph · code · actions. On hover a 3px category bar at the left and the mesh tint the board draws (09:57 EDT). DMZ drops the code column: `32px 28px minmax(0,1fr) 28px 113px`, up to nine attachments |
| 5 | The build name | **P1** | Shown only when `displayBuildLabel` is non-empty, as a **plate** leading the content cell (13:06 EDT popup: *"Plate is the right direction… its icon reads as 'price tag'"*): no icon; a **"BUILD NAME"** eyebrow (9.5px data caps, category colour at 70%) over the name (`--t-sm` 600, left-aligned, **two lines at most**), 7px 12px padding, a category-tinted gradient and outline, width fitting the name up to 156px (14:05, 15:00 EDT); **20px** to the attachments with a 1px divider centred in the gap (15:12 EDT). **The field caps at 32 characters** — measured on the plate: mixed-case names fit 43 characters in two lines, all-caps 34, the widest letters 23 — so an all-caps name never needs a third line (14:05 EDT: *"check how many max characters count that is and define it within the build label field"*) |
| 6 | Attachments | **P1** | **The brief, 14:59 EDT popup:** names only · wrap freely · a separate object per name · the closest earlier looks were the round-5 pill and the tinted block, and the joined strip was among the worst. **One tag per attachment:** 28px tall, `--t-sm` 500 `--ink`, 10px side padding, radius 6px, 6px gap, wrapping freely; background `color-mix(--sl 11%, --sunk)` with a 1px outline at `--sl` 30% and a 1px top highlight at 14% — **the slot's hue as a faint identity** (15:12 EDT: *"you didn't add any color identity to represent the slot"*); on row hover the outline rises to 48%. A build with no recorded slots gets neutral tags. Order: `CANONICAL_SLOT_ORDER` (§10.1 row 17) — **the board was corrected to it in this change; it had drawn the code's digit order, which audit row 43 already refused.** A build with two or fewer attachments shows dashed amber **Empty** tags for the missing ones. Rejected on the way, do not re-offer: pills tinted by category · tinted blocks with a slot underline · dot · rule · joined strip · underline · a five-column ledger · a difference fade · a slash sentence · slot glyphs (10:34 to 14:55 EDT). **List · By slot** stays: the slot grid is opt-in (10:34 EDT), and the switch sits in the category chip row behind a divider (14:36 EDT) |
| 7 | Image presence | **P1** | A 16px glyph in its own 28px column left of the code — informative, not a button (11:33 EDT): the green image icon when set, the **amber crossed image icon** when missing (*"have it both ways"*, 09:50 EDT; 14:21 EDT kept that style). Supersedes the `.thumb` chip rows |
| 8 | The gunsmith code | **P1** | **One sunken field with the copy button joined to its right edge** (14:36 EDT: *"a field and with a button"*): 34px, radius 7px, `--desk` ground, a 1px `--rule2` outline and a 2px inset shadow; the code unbroken — never split into pairs (14:55 EDT) — in the data face `--t-sm` 600 at .08em, 12px from the field's edge; the copy segment 38px on `--raised`; hover lifts the outline and the segment; the whole field is the 44px copy target and flashes a check. **144px column** (C8). **A faulty code is amber with a wavy underline** (14:21 EDT) and names its fault in a tooltip. **No code:** the field outlined in amber at 35% with "No code" centred beside an alert glyph |
| 9 | Row actions | **P1** | **Share · divider · Delete**, boxed icon buttons (44px targets, 34px boxes on `--raised` with a `--rule2` outline — 14:05 EDT: *"add a box/border… so they actually imply clickable"*); a 1px divider sets delete apart with 17px each side (15:12 EDT); delete's hover is danger-tinted. The row's visible right edge lands on the manifest's padding line (C4) |
| 10 | Faults | **P1** | **No prose inside a build row** (13:42 EDT). The faulty cell carries the signal — amber wavy code, amber "No code", amber crossed image, dashed Empty tags — and the build row gets a **4px hatched amber edge on its right** (13:06 EDT popup: "Right edge"). The weapon header shows a **Fix build / Fix builds** chip (34px, amber on a warm sunk ground) holding a number token per faulty build; hover, focus or a tap opens a popover listing each build's problems in plain words: "Code lists 5 attachments, build has 4" · "No gunsmith code to copy" · "Only 2 of 5 attachments" · "Almost the same as another build" · "No image uploaded" (11:41 EDT asked for helpful, short copy). The chip's right edge meets share's (15:12 EDT) |
| 11 | The tools row (shared, G11) | **P1** | Row 1: "MANIFEST" · search · **Add build** at the row's right end (pin `pmtyjbql6`: the floating add button). Row 2: "CATEGORY" · the category chips with their counts in `CATEGORY_CHIP_ORDER` · divider · "ATTACHMENTS" · List · By slot. C1, C2, C5, C6 |

#### G6 — build names

| # | Finding | Severity | What Session 2 must build |
|---|---|---|---|
| 1 | Two options were drawn and never chosen | **P1** | **Display-only labels** (15:59 EDT popup). Every surface that shows a name uses `displayBuildLabel`; nothing stored changes. The one write moving `1C2B5B6D7O` out of FSS Hurricane's name field runs as its own Bash call only on Harkirat's approval restated (§5.3 Step 10). No identity refactor is filed: `buildName` stays an identity key and its six sites are unchanged |
| 2 | A name longer than two plate lines | **P2** | The portal's Build name field (`#ab-build`, agent D) and the Discord modal's build-name input (`handlers/manage/loadouts.js`) both cap at **32 characters**; the portal field shows a live `n / 32` inside it |

#### G11 — Broadcast's manifest, History's chips, the shared tools row

| # | Finding | Severity | What Session 2 must build |
|---|---|---|---|
| 1 | Broadcast's columns crowded the text and stranded the delete | **P1** | Columns: Announcement `minmax(0,1fr)` with 20px right padding · Posted 104 · Starts 104 · Ends 104 · State 124 · delete 44, 16px gap, 64px rows (11:42 EDT). A 4px embed-style accent bar in the announcement's colour, inset 10px top and bottom. Every header sorts with a chevron and the last sort persists as it already does (09:59 EDT). Row hover is the mesh tint (09:57 EDT) |
| 2 | Dates | **P2** | Posted carries "N days ago" under the date (09:55 EDT). A blank Starts reads **On posting**, upright — never italic or lowercase (11:48 EDT). No end reads ∞ **No end** in amber |
| 3 | The State column | **P1** | The **Tab** shape (13:06 EDT popup: *"Tab view in the actual manifest column"*): radius 4px, the lifecycle word with its icon (radio · calendar · check-circle), a 3px solid bar in the state colour on its left and a 9% wash — live `--ok`, upcoming `--sched`, ended `--ink3`; **a staged row's tab is a dashed outline** (*"the saved and staged design looks good"*, 11:48 EDT). The State **filter chips keep the portal's chip with its colour dot** (same popup) |
| 4 | History's chips | **P2** | Level chips carry severity bars in the `LEVEL_ROW` vocabulary (09:59 EDT); Kind chips keep the dot chip; the typed search's count is a 28px soft rectangle, radius 5px, inside the field (11:51 EDT); the shown-count line becomes a **Load older events · N more** button under the rows (10:00 EDT) |

#### G3 — the announcement card, and the delivery queue

| # | Finding | Severity | What Session 2 must build |
|---|---|---|---|
| 1 | The position number | **P3** | Display face 58px in the card colour (12:01 EDT: *"make the number larger"*); card grid `56px minmax(0,1fr) auto` |
| 2 | The announcement text | **P1** | An enclosure (11:52 EDT asked for a much better one): a top-down gradient from the card colour at 7% into `--sunk`, a 1px outline and a 1px top highlight in the card colour at 30%; the text `--t-md` 1.55, clamped to two lines; a footer under a hairline with "N characters" on the left and **Show all / Show less** with the unfold/fold glyph on the right; the whole enclosure toggles (10:07 EDT asked for the collapse) |
| 3 | The lifespan | **P1** | The earlier bar look (11:54 EDT: *"your prior design… of the fill-bars looked better"*): grid `100px minmax(0,1fr) 100px`, 12px gaps — a start box (calendar glyph · posted date) and an end box (clock glyph · end date, or amber ∞ **No end**), equal 28px boxes, radius 6px; the 6px track between them on `--sunk`, the span in the card colour, a never-ending span fading out, and a 2px today marker. Every card's bar is the same length |
| 4 | Meta and actions | **P1** | Under the bar: **up Nd** and **N showings** as 28px soft rectangles; **Edit · Dates and repeats · divider · Remove** as boxed icon buttons in the same row at its right end (13:42 EDT: *"put the buttons horizontally in the bottom right corner"*; 11:56 EDT asked where edit, delete and repeat live), their right edge shared with the text box and the end box (14:24 EDT). The banner thumbnail sits in the card's right column |
| 5 | The delivery queue's side column | **P1** | **Changes ahead** replaces "What one player gets" (popup answered 2026-09-14 10:33 EDT): cards with a date tile (month micro caps over the day) and the announcement clamped to two lines, captioned **Starts showing** (`--ok`) or **Stops showing** (`--ink3`). The view bar's meter reads "**2** of 10 slots used" (11:57 EDT: the old wording was *"still shit"*) |

#### G2 — admin traffic

| # | Finding | Severity | What Session 2 must build |
|---|---|---|---|
| 1 | A native checkbox, `.adminsw` (`analytics.js:689`) | **P1** | In the Analytics view bar, after the view switch and a divider: an **INCLUDE** label, then a 44px chip with a shield glyph reading **Admin traffic**, pressed in the Analytics hue; no count (10:09 and 10:10 EDT — the "+21" was admin events, and he asked what it meant) |

#### G1 — the small text

| # | Finding | Severity | What Session 2 must build |
|---|---|---|---|
| 1 | 113 prose sites across the realm files, sorted by kind | **P1** | Apply the board's G1 table site by site: 21 repeat something (remove) · 14 belong on a control · 12 are problems (a chip or a warning) · 12 stay, reworded · 16 answered on board 1 · 38 not small text. **The treatments were rewritten in plain words** after Harkirat called the first wording *"still shit… across your entire Small Text review"* (11:57 EDT), and he chose **"Session 2 applies it"** (15:59 EDT popup). *"Keep" never means untouched* (10:12 EDT). A site a ledger row cites retires or cites that row in the same change. The table is inlined in the tracked board (the `G1` constant in its script) |

## 11 · Prompts

Each prompt is a pointer, never a summary — the plan's header says so. Each names what to read; a session reads exactly that before its first tool call.

```text
/rename Sonnet5-XHigh · Pins2 S1 identity + History · <Mon DD>
Premise Low · Delib Very high -> Sonnet5-XHigh

You are Session 1 of docs/superpowers/plans/2026-09-13-portal-pins-batch-2.md.
Read in full, in this order: the plan's §0, §1, §7, §8, §9 and §13, then §3; the spec (docs/superpowers/specs/2026-09-13-portal-pins-batch-2-design.md) §1-§4, §8 and §9. Do not read plan §4-§6; the one rule you need from §6 is below.
Your first message is §3.0 Steps 1-6 as ONE message, then Step 6b. After that follow §3 group by group: every ⟦ONE MESSAGE⟧ line is a message boundary, and a step closes on its observation, never on a green gate.
If npm run index:health exits 4, stop and tell me: search is reading a deleted store until the desktop app restarts.
You dispatch exactly two agents, A and B, with the §8.3 briefs verbatim, and no others.
The permission restructure is deferred: do not recolour the Access grid's scopes and do not add a History row to it.
Build names are display-only: agent B changes no stored data (§8.3 brief B, step 5).
docs/ideas/diors-notes.md is out of scope — do not open or mention it.
Mark boxes in the plan as you go. Close by §13; the push, the PR and the merge each need my approval restated at that moment.
```

```text
/rename Opus5-High · Pins2 critique · <Mon DD>
Premise High · Delib Medium -> Opus5-High

You are the critique session of docs/superpowers/plans/2026-09-13-portal-pins-batch-2.md. Check §4's precondition first: Session 1 must be on v3-pre-release. Session 2 builds from what you write.
Read in full: the plan's §0, §1, §4, §10 and §13; the spec's §1, §6 and §7; the decision ledger's Armory and Broadcast rows (ctx_search, source "portal-decision-ledger").
If npm run index:health exits 4, stop and tell me.
Run /impeccable critique on the New Build drawer and Compare (§4), on the harness with chrome-devtools; each run's two agents are the only agents you dispatch. The Broadcast composer is critiqued with /design-critique. Also run the impeccable verbs that work in-line without agents — audit, harden, clarify, and shape for any open material fork — and write their rows into §10 too.
Write every finding into §10 as finding · severity · what the build must do, replacing each "Not yet written" line. A decision I make goes in the ledger as a row.
docs/ideas/diors-notes.md is out of scope. Close by §13; push, PR and merge each need my approval restated.
```

```text
/rename Opus5-High · Pins2 board 2 · <Mon DD>
Premise High · Delib Medium -> Opus5-High

You are the design-board session of docs/superpowers/plans/2026-09-13-portal-pins-batch-2.md (§4b). docs/pins2-followups must be on v3-pre-release; §4b Step 1 proves it.
Read in full: the plan's §0, §1, §2, §4b, §5, §9, §10 and §13; the spec's §3, §6, §7, §8 and the pins §4b Step 1 names in §10; the decision ledger's Armory, Broadcast, Access and Analytics rows (ctx_search, source project:dioreo-docs). Open the tracked G8-G10 board named in §10's first paragraph: it is the pattern.
If npm run index:health exits 4, stop and tell me.
Build ONE board for G4 (the Armory manifest row), G6, G1, G2, G3 and G11 exactly as §4b.1 lists, on real dev data and the portal's own app.css, by §4b.2's method; render and look before every publish. I review it in artifact comments over as many rounds as I need; a structural fork goes in a popup after it is drawn. You build nothing and dispatch no agents.
Write every answer into §10.4 with dated notes and ledger rows, then run §4b Step 6: a falsification pass, and a reader agent only after I approve it. docs/ideas/diors-notes.md is out of scope. Close by §13; push, PR and merge each need my approval restated.
```

```text
/rename Opus5-High · Pins2 S2 manifests · <Mon DD>
Premise Med · Delib Very high -> Opus5-High

You are Session 2 of docs/superpowers/plans/2026-09-13-portal-pins-batch-2.md. Session 1, the critique, the design-board follow-up and the §4b board session must all be on v3-pre-release; §5.0 Step 1 proves it.
Read in full: the plan's §0, §1, §7, §8, §9, §10 and §13, then §5, plus §3.0 Step 1 and §3.6 Steps 20 and 22, which §5 reuses; the spec's §3, §6, §7 and §8. Open the design board §10's first paragraph names before building anything it draws.
Step 0 is §5.0 Steps 1-5 as ONE message. Stop at Step 3 if §10 still has a "Not yet written" line. If npm run index:health exits 4, stop and tell me.
Every design gate is already answered in §10 — G8-G10 on the 2026-09-14 board, G1-G4, G6 and G11 in §10.4 by the board session: do not redraw or re-ask any of them. Port G1-G4, G6 and G11 from docs/superpowers/mockups/2026-09-14-pins2-board-2/resolved-spec.md, never from the board's CSS, and close each surface on §10.4's refinement contract measured on the portal. G6's one data write runs in Step 10 only after my approval restated.
§5.2 Step 9b copies the attachment slots from Cloudinary into Mongo: the dev write is free; the prod write needs my approval restated.
You dispatch exactly one agent, D, with the §8.3 brief verbatim, in §5.3 Step 10b after Step 9b's dev write and never before. The main thread builds Compare.
docs/ideas/diors-notes.md is out of scope. Close by §13; push, PR and merge each need my approval restated.
```

## 12 · Closing this planning branch — `docs/portal-pins-batch-2-plan`

**Nothing in §3–§5 can start until this branch is on `v3-pre-release`** — Session 1 Step 1 checks for this file there. Added 2026-09-13 12:04 EDT, after a reader test found nothing tracked said how the branch closes.

> ⟦ONE MESSAGE⟧ Step 1 — only after Harkirat approves the push, restated as `Approved by · to · when`.

- [x] *(2026-09-13 14:33 EDT, #187)* **Step 1:** `git push -u origin docs/portal-pins-batch-2-plan && gh pr create --base v3-pre-release` in one Bash call, with the PR body ending in the Claude Code attribution line.

> ⟦ONE MESSAGE⟧ Step 2 — the pre-merge checkpoint as one heredoc, gates chained.

- [x] *(2026-09-13 14:33 EDT)* **Step 2:** on the branch — first confirm `git show origin/v3-pre-release:package.json` still reads `3.79.0-pre` (it did at 2026-09-13 14:15 EDT); if another branch merged first, use the next number everywhere below · the `docs/CHANGELOG.md` Unreleased entry becomes `## Pre-Release v3.80.0 — <computed YYYY-MM-DD HH:MM EDT> (#<PR>) — the second pin batch, decided and planned`, moved to the top of the released entries · `package.json` → `3.80.0-pre` · the DEVLOG entry through `node scripts/devlog-add.mjs --desc "Portal pins batch 2 — four fork rounds, four pins that named the wrong cause, and a permission redesign deferred (v3.80.0-pre)" --body-file -` with the body below · `npm run docs:audit` and `npm test`, each read by exit code. ⚠️ `docs:audit`'s `devlog-orphan` rejects the DEVLOG entry until the CHANGELOG heading reads `## Pre-Release v3.80.0`, which is why the entry was not written on the first commit.

> ⟦ONE MESSAGE⟧ Step 3 — only after Harkirat approves the merge, restated.

- [x] *(2026-09-13 14:55 EDT, merged as `dd35f706`; ticked by Session 1 at 2026-09-13 17:28 EDT)* **Step 3:** `gh pr merge --squash --delete-branch` with an explicit `--body` carrying one trailer block · `git log -1` shows this release before anything else · no tag (the v3 line mints none until v3.0.0) · `git fetch origin main:main v3-pre-release:v3-pre-release` · re-index per `CLAUDE.md`, then `npm run index:health` exits 0.

**The DEVLOG body — canonical here; the gitignored draft it came from is `local/pins2/devlog-draft-for-merge.md`.** The script writes and stamps the `## ` title from `--desc`, so the body starts at its first paragraph:

```text
Harkirat pinned 29 notes on the dev portal overnight and asked for a plan a Sonnet session could execute without drifting. The planning session built nothing. It produced `docs/superpowers/specs/2026-09-13-portal-pins-batch-2-design.md` (frozen) and `docs/superpowers/plans/2026-09-13-portal-pins-batch-2.md` (live), and every design fork was decided on a board rendered from the portal's own tokens and real screenshots, not in prose.

**What the board changed.** My hue-distance check flagged three of his seven accents as collisions; he explained a rule the instrument could not see — a permission wears its in-bot command's colour, so two matching colours are kinship when the things are related. I then told him `--ok` already meant "confirm"; he had never seen it, and a scan of all seven realms showed it is a status green that no button has ever used. Both corrections came from looking, not from a number.

**Four pins named a cause that was not the cause.** The Analytics icons are empty states. The Build Name field exists, and the dev data holds ordinals plus one gunsmith code. The When column is in UTC. The harness fixture hides the session user-agent defect. Every build session now reproduces a pin before fixing it.

**Deferred.** The permission restructure — tiers, create/modify/destructive plus a new view-only sub-tier, the four-shape cell — was answered question by question and then deferred by Harkirat as still having kinks. The plan dropped from three build sessions to two, and every answer is recorded as input under a `[P1]` design item.

**Checked before it was handed on.** A reader test and `npm run handoff` found a merge check that could never pass after a squash, six step groups with no message boundary, screenshots placed before their pages existed, a precedence rule that would have overruled the critique, and no tracked record of how the branch closes. All fixed on the branch. A post-compact review then found that `buildName` is still an identity key in six places — /autobuild's next number and image key among them — so the planned name migration would have overwritten a build's image and merged builds on paste; build names are display-only until Harkirat chooses at gate G6.

**The search index was being deleted under its own server.** A plan written that morning never came back from `ctx_search`. context-mode's server deletes a store whose write-ahead log looks abandoned the first time it opens that store in a session, and a killed server leaves exactly that log — so this repo's store vanished twice in three days while search kept answering from the deleted file. The first diagnosis blamed the refresh hook's CLI; a repro disproved it, and a second repro against context-mode's real server reproduced the sweep. A global guard now empties such logs before any context-mode tool runs, the refresh hook refills a store that lost its corpora or is about to be pruned, and `npm run index:health` says whether a server is reading the file on disk.

### Lessons

- A distance metric cannot tell kinship from collision. Show the colours and ask what they mean before calling a match a defect.
- Mid-session Harkirat called out tool drift: `sed -n` and `head` reads, zero `codebase-memory` calls, and no ledger query before planning changes to cited surfaces. The ledger and graph queries that followed changed the plan — removing the crumb now retires two cited rows.
- A tool-created worktree branches from `origin/main`. A subagent working on `v3-pre-release` must be handed a worktree made by hand and must assert its ancestry before doing anything.
- An ancestry check on a file's last commit fails after a squash merge; check the file's presence on the target branch instead.
- A mechanism narrated over a value nobody checked produced the wrong cause for the vanishing index, and a detector built on it was half-written before Harkirat asked whether the cause was found or only enough of it. The repro that could fail is what found the real one.
```

## 13 · Closing a session — Session 1, the critique, the two board sessions, Session 2

Each session's work must be on `v3-pre-release` before the next session starts: the next precondition reads the merged file, not your branch.

> ⟦ONE MESSAGE⟧ Step 0 — the pre-push close-out, before any push is ASKED for. Added 2026-09-13 22:12 EDT: the critique session asked for a push three times with this undone, because Step 1 read as the first close-out action and the indexes and `.remember` sat after the merge.

- [x] *(critique session 2026-09-13 22:13 EDT — 18-thought pass; `npm test` exit 0; `docs:audit --diff origin/v3-pre-release` 48/48; `npm run handoff` 0 blocking; linksee implementation memory #48831 and perseus-vault ×3; stale counts and the §11 prompt fixed; codebase-memory re-indexed 11,250 nodes; `ctx_index` docs 98 files and rules 22 files; `index:health` exit 0; `.remember` rewritten)* **Step 0:** a 15+ thought end-of-session pass per `.claude/rules/thinking-pass.md`, including its fixed compliance question and `node scripts/summaryShape.mjs --session latest` · `npm test` and `npm run docs:audit -- --diff origin/v3-pre-release`, each read by exit code · `npm run handoff` · linksee `summarize-session` (body: `ctx_search` source `vendor:linksee-prompts`) and perseus-vault for cross-project facts · every count and cross-reference this session wrote re-computed against the files · codebase-memory CLI re-index, `ctx_index` of `docs/` and `.claude/rules/` with their `project:` labels, `npm run index:health` exit 0 · `.remember` rewritten · **then** ask for the push. Step 4 repeats the index and `.remember` steps after the merge.

> ⟦ONE MESSAGE⟧ Step 1 — only after Harkirat approves the push, restated as `Approved by · to · when`.

- [x] *(Session 1: 2026-09-13 19:04 EDT, #188 — pushed on Harkirat's popup answer "Push and open PR")* **Step 1:** `git push -u origin <session branch> && gh pr create --base v3-pre-release` — `gh` defaults to `main`, which is the wrong base — with the PR body ending in the Claude Code attribution line.

> ⟦ONE MESSAGE⟧ Step 2 — the pre-merge checkpoint as one heredoc, gates chained.

- [x] *(Session 1: 2026-09-13 19:04 EDT — origin read 3.80.0-pre → v3.81.0-pre; CHANGELOG heading with #188 and the v3.80.0 hash backfilled; package.json and package-lock.json; DEVLOG via the script; docs:audit and npm test exit 0. Steps 3 and 4 are ticked by the critique session, which reads this file after the merge)* **Step 2:** read the version from `git show origin/v3-pre-release:package.json` and take the next moderate step, `v3.(x+1).0-pre` — never a number copied from this plan · the session's CHANGELOG Unreleased entry becomes `## Pre-Release v3.(x+1).0 — <computed stamp> (#<PR>) — <what it did>` at the top of the released entries · `package.json` → that version · the DEVLOG entry through `node scripts/devlog-add.mjs --desc "<description> (v3.(x+1).0-pre)" --body-file -` · `npm run docs:audit` and `npm test`, each read by exit code.

> ⟦ONE MESSAGE⟧ Step 3 — only after Harkirat approves the merge, restated.

- [x] *(Session 1: merged as `06acb2f1`, v3.81.0-pre, #188; ticked by the critique session 2026-09-13 19:18 EDT after reading `git log -1 origin/v3-pre-release`)* **Step 3:** `gh pr merge --squash --delete-branch` with an explicit `--body` carrying one trailer block · confirm `git log -1 origin/v3-pre-release` is this release before anything else · no tag · `git fetch origin main:main v3-pre-release:v3-pre-release`.

> ⟦ONE MESSAGE⟧ Step 4 — cleanup, indexes, carriers.

- [x] *(Session 1: `git worktree list` shows no pins2 worktree; indexes re-run 2026-09-13 19:09 EDT and `npm run index:health` exit 0 at the critique session's start; ticked 2026-09-13 19:18 EDT)* **Step 4:** remove each agent worktree and branch this session made, after the merge is confirmed (`git worktree remove .claude/worktrees/pins2-<x>` · `git branch -D feat/pins2-<x>-…`; the critique made none) · re-index per `CLAUDE.md` · `npm run index:health` exits 0 · every box in this session's section reads `- [x]` · `.remember` names the next session and its §11 prompt.

## Audit log

*Falsification pass run across the planning session's sequential-thinking passes and five rounds of forks with Harkirat, last updated 2026-09-13 11:37 EDT; rows 27–40 come from the post-compact review, 2026-09-13 14:15 EDT, which re-verified every file:line the spec cites against the code. Conformance pass applied: `⟦ONE MESSAGE⟧` groups, Step 0 evidence per session, the `[P1]` Verify line quoted, no turn estimates.*

| # | Finding | Severity | Where fixed |
|---|---|---|---|
| 1 | Tool-created worktrees branch from `origin/main`, so an agent would test the wrong tree and pass | Silent wrong result | §8.1 — manual `git worktree add` + an ancestry assert in every brief |
| 2 | `.env.dev` is absent from worktrees; a UI agent could not serve the portal | Blocker | §8.1, §3.1 Step 7, §5.0 Step 1 |
| 3 | An agent cannot ask Harkirat, so a migration write inside an agent would skip his approval | Unapproved data change | Agent B is dry-run only; the write is gate G6 |
| 4 | `RIVER_COLUMNS` moves with History; fixing When, widths or chips first edits code about to move | Rework | Session 1 splits, Session 2 fixes |
| 5 | Visual fixes judged before the palette lands get judged twice | Rework | Tokens are Session 1's first unit |
| 6 | `app.css` is one 6,438-line file shared by several streams | Merge conflict | §7 append-block rule + trap 10(c) after merge |
| 7 | The `--ok` recolour repaints 49 references | Silent visual regression | §3 Step 12 before/after on the visible consumers |
| 8 | `--on-staged` is a fixed ink computed for cyan | Contrast failure | §3 Step 11 re-derives it |
| 9 | Removing the crumb deletes a surface two ledger rows cite | Silently reverted decision | §3 Step 18 retires both rows |
| 10 | Analytics' `span.sp` was added to close a conformance finding | Silently reverted decision | Spec §3; G1 enumerates, never sweeps |
| 11 | The harness hides the session user-agent defect and cannot reach Access's empty state | False verification | §3 Step 19c uses real user-agent strings; spec §9 |
| 12 | Analytics' When column is UTC — correctness, not formatting | Correctness | Spec §8, §5 Step 9 |
| 13 | A per-realm width list would contradict the role decision | Reverted decision | §5 Step 9 |
| 14 | "Build Name must be created" — it exists | Duplicate field | Spec §6 |
| 15 | The share command's weapon text is an untested autocomplete value | Broken feature | Agent B step 3 |
| 16 | An older plan says `SendMessage` is disabled | Stale belief | §8.1 |
| 17 | Repeat-N adds a stored per-user field | False privacy policy | Agent A step 5 |
| 18 | The permission restructure still had open kinks (Harkirat) | Scope | Deferred: spec §5 marked PENDING, plan §6, filed `[P1]`; the plan drops from three build sessions to two |
| 19 | The new page and command colours fall in the 165–265° edit-identity band | Colour collision | Not applied to today's grid; an input to the deferred design (spec §1.2) |
| 20 | Session 1's merge check used `is-ancestor` on the plan's last commit, which a squash merge makes impossible | Blocker | §3.0 Step 1 reads the file from `origin/v3-pre-release` — found by the reader test, 2026-09-13 12:04 EDT |
| 21 | The conformance pass was partial: six step groups had no message boundary, screenshots sat in messages before their pages existed, Steps 8 and 9 shared a line | Loop risk | §3 and §5 marks, Steps 6b and 12b |
| 22 | The header's precedence rule would have let the frozen spec overrule the critique's §10 | Contradiction | Header |
| 23 | Nothing tracked said how this branch closes; the DEVLOG entry lived only in a gitignored file | Lost record | §12, body inline |
| 24 | Neither the critique nor Session 2 checked that the session before it had merged | Wrong base | §4 precondition, §5.0 Step 1 |
| 25 | docs-audit `prompt-antiskim` failed once `.remember` named this plan: no anti-skim guard in the first 40 lines, so a session handed a §11 prompt could act on the prompt alone (2026-09-13 12:44 EDT) | Fails CI on the merge | Guard blockquote under the agentic-workers line |
| 26 | The close-out re-indexed two stores with no check that the search server reads the file on disk; context-mode's startup sweep had deleted this repo's store under its own server twice that week (2026-09-13 13:18 EDT) | Silent stale search | §12 Step 3 ends with `npm run index:health` |
| 27 | Session 1 Step 3 expected "~50" and "49" and said to stop when far off; the commands return 76 and 55 lines, so Session 1 would have stopped on a correct tree | Blocker | §3 Step 3 carries the measured numbers; header exception for spec §1.3 |
| 28 | `buildName` is an identity key in six places — /autobuild's next number and Cloudinary image key, the add and bulk upsert, delete-by-build, Cloudinary `Build_Number`, the scope sort — so blanking ordinals would restart /autobuild at Build 1, overwrite build 1's image and merge builds on paste | Silent data loss | Brief B steps 4–5 (display-only, a read-only report), G6 reworded, header exception for spec §6 |
| 29 | Step 16 expected six rail entries; the rail will show seven | False failure | §3 Step 16 |
| 30 | Page steps mixed the Browser pane with chrome-devtools pages, and Step 12 read computed styles before reloading pages that still carried the old CSS | False verification | §1 row 9; §3 Steps 12, 12b, 14, 16, 17, 19, 19a; §5 Steps 7 and 11 |
| 31 | Session 2's main thread and agent D both edited `armory.js:960-1090` | Merge conflict | §5 Step 9 leaves the panel to D; §7 map |
| 32 | The analytics seed and real session rows cannot appear on the harness, and nothing named how to reach the signed-in dev portal | Unverifiable close | §1 row 9 names `portalSession.cjs` and `portalRealWalk.mjs`; §3 Steps 14 and 19c |
| 33 | No build session had a close-out — computed version, records, merge, worktree cleanup, index health — though each next session's precondition depends on that merge | Wrong base | New §13; §3 Step 22, §4, §5 Step 13 |
| 34 | The prompts named no spec sections; Session 2 reused §3 steps that §0 told it not to read; §3 Step 11 cited plan §6, which Session 1's prompt forbids | Skipped context | §0, §3 Step 11, §11 rewritten |
| 35 | Agents were told to call `EnterWorktree`, a deferred tool they must load first | Blocked agent | Briefs A, B, D |
| 36 | `PRIVACY.md` is a published site source; agent A would change it without rebuilding `public/` · the banner image field had no shape, inviting an invented upload pipeline | Stale site blocks deploy · Scope creep | Brief A steps 1 and 5 |
| 37 | §12's DEVLOG body began with a hand-stamped title line the script already writes | Duplicate line | §12 body |
| 38 | §12 hardcoded v3.80.0 | Wrong version if another branch merges first | §12 Step 2 check |
| 39 | The critique was told its "two agents" are the only agents, but three surfaces are three runs | Rule contradiction | §4, §11 |
| 40 | A session whose context-mode server reads a deleted store would trust empty ledger searches | Silent stale search | §1 row 18, §3 Step 1, §11 |
| 41 | §4 had the critique write prose-only §10 rows for three surfaces and no step or brief built Compare, so Session 2 would have built designs Harkirat never saw — breaking this plan's own §1 row 2 | Silent scope gap | Cross-session exchange 2026-09-13 22:47 EDT: the critique session asked, the planning session ("Opus5-Extra · Portal-sync planning and scope") answered that both were its planning gaps. Compare → S2 main (§2 row 28, §7, §5.3 Step 10b); G9 and G10 added, G8 widened to the whole composer (§5.1 Step 7, §9); D dispatched after the answers (§5.0 Step 6, Step 10b); two popups, because `AskUserQuestion` takes at most four questions; §5 and §11 Opus5-High |
| 42 | The design board's Bulk create footer disabled staging on an unreadable block; the shipped rule stages the readable builds and lists the rest (`bulkPasteSummary.canStage`, `armory.js:1067`). Harkirat never commented on it, so writing it into §10 would have reversed a deliberate behaviour on the board's authority | Silently reverted decision | §10.1 row 2 keeps the shipped rule; board corrected (2026-09-14 01:37 EDT) |
| 43 | The board listed slots in the code's digit order and called it "Gunsmith order", while `CANONICAL_SLOT_ORDER` is a display order Harkirat asked for on 2026-07-21 | Reverted decision | §10.1 row 17, §10.2 row 2, brief D 1b; board corrected |
| 44 | §10.2 row 2 said "the existing slot data", and the drawer's slot names assumed it: `attachmentSlots` is empty on 133 of 133 builds | Silent empty feature | §5.2 Step 9b, §7, brief D, §10 preamble fact ① |
| 45 | The first slot check read only Mongo and concluded the slots did not exist; Harkirat remembered the vision run, and the metadata held them on 130 of 134 images | Wrong conclusion | §10 preamble; a linksee caveat |
| 46 | Interim board notes appended to §10 during the review carried directives he later overturned ("Many builds", Analytics fill rows, numbered circles, build counts, "Rank", a grey meter) beside the rows they contradicted | Contradictory instructions | The five notes deleted; the answers written into the rows they change |
| 47 | G8–G10 were still scheduled for Session 2's board and popups after being answered | Duplicate asks | §5.1 Step 7, §5.3 Step 10b, §9, §11, §5.0 Step 3 stop condition |
| 48 | Brief D named neither §10.1 row 14's upload route nor the code fill, and §7 gave neither an owner | Unowned scope | Brief D 1b and 1c; §7 |
| 49 | The board lived only in gitignored `local/`, invisible to a fresh clone and to agent D's worktree | Lost spec | Tracked copy at `docs/superpowers/mockups/2026-09-14-pins2-board/index.html`; header, §10, brief D |
| 50 | §5.0 Step 1's merge check ran `rg 'Not yet written'` over the whole plan, whose §4, §5 and §11 quote that phrase four times, so it could never print nothing and Session 2 would have stopped on a merged critique; the stop check this pass added had the same flaw with its own phrase | Blocker | Both checks scoped to §10 with `awk` and a bracketed pattern; verified to print nothing now, and a falsifier (`rg -c 'Amended 2026'` over the same scope) prints a count |
| 51 | Step 9b matched images to builds by `imageKey`, but 104 of 133 prod keys end in `.png` and Cloudinary public ids do not — the backfill would have written slots for about one build in five and reported success | Silent partial result | §5.2 Step 9b strips the extension |
| 52 | Brief D said the composer's "banner-image and repeat inputs" while G8 answered the whole composer — preview, meter, Never switch, echoes | Scope an agent would read narrowly | Brief D step 2 |
| 53 | A cold reader (a Sonnet agent with no transcript, run by the design-board follow-up before its 2026-09-14 02:43 EDT merge — its stamp was an unfilled placeholder until the board-2 session replaced it) found four more: Step 3's added review check searched for a phrase this pass had already deleted, so it could never fail · `CANONICAL_SLOT_ORDER` holds ten entries including `trigger action`, which no build carries, while rows 15 and 17 speak of nine slots · Step 3 read the local plan while Step 1 read `origin`, unstated · no step copied an agent's gitignored artefacts out of its worktree before removal | Vacuous check · Silent wrong row · Confusion · Lost artefact | Step 3 now asserts the preamble; row 17 and brief D 1b skip `trigger action`; Step 3 names its source; §5.4 Step 12 copies D's captures. Cleared by the reader: the Bulk create staging and slot order fixes are on the board; the composer's other-live-posts total is computable from `/api/broadcast`'s full `text`; blank Ends and never match `core/ops/announcements.js`; the ledger and deferred entries agree with §10 |
| 54 | G4 — the drastic Armory manifest-row redesign — and G1–G3 and G6 were left to two or three options and one popup inside Session 2, the instrument that had just needed five board versions to get G8–G10 right; Harkirat had seen nothing of the row (asked 2026-09-14 02:17 EDT) | Design built from a popup | New §4b board session; §10.4 placeholder stops Session 2 until it is written; §2, §5, §9, §11, §13 |
| 55 | §4b was first written as four thin steps — no pin list, no ledger rows, no per-gate content, no board method, no falsification or reader step — while the sessions beside it carry all of those; and three of Harkirat's visual pins (the Broadcast manifest's state column and chips, History's level chips, the Manifest tools row) had no gate at all, so Session 2 would have designed them unseen (found when he asked whether §4b was a full session, 2026-09-14 02:34 EDT) | Thin handoff · Design built unseen | §4b rewritten to the other sessions' depth; G11 added to §2, §9, §10.4, §11 and §5.2 Step 9 |
| 56 | A cold reader over §4b (2026-09-14 02:41 EDT) found its ledger list named a HeadsUp row that does not exist and two rows by words the ledger does not use, and that G4 never cited the row that asked for this very session ("a larger manifest reorganization with an opus 5 design session"). It confirmed every script, path and code line §4b names exists, `local/pins2/build-name-report.txt` is present, and that §4b's precondition correctly stops until `docs/pins2-followups` merges | Miscitation · Missing mandate | §4b Step 1's ledger list and G4 brief |
| 57 | The board's stylesheet is thirteen rounds of overrides appended to one block, so a builder reading it top-down would port superseded values — the first `.pb-rb` rule is `44px 116px…`, the rendered row `32px 28px minmax(0,1fr) 28px 144px 113px` | Silent wrong result | `resolved-spec.md` generated from Chrome's cascade and checked against three known values before it was trusted; §10.4 rule ① |
| 58 | The board listed attachments in the code's digit order, which audit row 43 had refused on board 1; Harkirat never commented on order this session | Silently reverted decision | Board corrected to `CANONICAL_SLOT_ORDER`; §10.4 G4 row 6 |
| 59 | Armory renders through the shared table `Manifest`; weapon groups cannot be column renderers, and nothing said how Session 2 should build them | Unbuildable spec | §10.4 Architecture; §5.3 Step 10; §7 |
| 60 | The toolbar rules live in the shared tools row, so they move Season, Access, Review and History — realms no step captured | Silent regression | §5.2 Step 9 captures them before and after |
| 61 | A build staged for deletion inside a weapon group was never drawn | Design built unseen | §10.4 "Not drawn": the shipped staged shape, captured for Harkirat before merge |
| 62 | The board's radii (5, 6, 7px) and nine slot hues are literals outside `DESIGN.md` — the design hook flagged them | Token drift | §10.4 rule ② |
| 63 | G1's rewritten treatments had never been shown to Harkirat | Unapproved copy | Popup: Session 2 applies it |
| 64 | G6 was still unanswered after 21 versions | Open gate | Popup: display-only labels |
| 65 | The 32-character build-name cap had no owner: the portal field is agent D's file, the Discord modal is bot code | Unowned scope | Brief D 1d; §5.3 Step 10; §7 |
| 66 | The board took 21 versions because every correction was a relation between elements (edges, gaps, heights, inline groups) that no per-element check sees, and none was applied before showing | Rework | §10.4 refinement contract C1–C14; `measure.cjs`; a memory and `.claude/rules/portal-editing.md` |
| 67 | This session re-offered directions Harkirat had refused to fill a quota of three variants, twice | Wasted rounds | §10.4 C13 |
| 68 | Board-only mechanics could ship — demo hover rows, the "One staged" switch, the curated weapon list, example edits, the banner gradient | Wrong build | §10.4 rule ③ |
| 69 | `measure.cjs`'s first run reported two failures that were its own: share→delete measured across the divider (35px) and the centred No code field counted as padding (38px) | False failure | Both checks narrowed and commented in the script; the run that follows passes all 18 |

**Carried into the deferred permission design, not fixed here:** Access delegation without guardrails would be privilege escalation (his answer: guardrails) · retiring `destructive` removes the owner-only lock's derivation source · revoke symmetry was never asked · the view-only sub-tier has no shape.

**Cleared, not fixed:** every file:line the spec cites still points at the named code on `efa5480e` (49 checked, 2026-09-13 14:15 EDT) · `v3-pre-release` has not moved since this branch was cut and no PR is open into it · `efa5480e` stays an ancestor through squash merges, because the integration branch is never rewritten · the `/gunsmiths search` `build` option is an integer position, so a derived build number is what the share text needs · readme-map is satisfied because `docs/superpowers/` is the coverage unit · the four shapes do not clip at 16/20/24px (measured margins ≥ 1.5px after refit) · Marksman's collision with `--ok` ends by itself · the planning branch changes no code.

**Alternatives re-examined:** five sessions — rejected by Harkirat; three with agents held because three of the eight units were backend streams with no live verification and no gates, and two now hold once permissions left · per-realm sessions — rejected, `manifest.js` would be edited three times · UI work by agents — only D, with its own port.

**Not verified, and marked so:** whether `/impeccable critique` can be scoped to one component inside a realm; whether `mintSession` against the launchd service on 8787 needs anything beyond `.env.dev`.

**Critique-session amendments (2026-09-13 19:33 EDT):** ① the first unverified item is answered — `/impeccable critique` scopes to one component when each agent's brief names the component and its line range; the CLI detector still scans the whole file, so its findings were filtered by range. ② §4 and the §11 prompt named `/impeccable critique` for all three surfaces; Harkirat moved the composer to `/design-critique` after two impeccable agents had been dispatched on it, and both were stopped unread. ③ Every agent found the chrome-devtools MCP profile locked by a parallel agent and fell back to `puppeteer-core`; a future multi-agent critique should give each agent `isolatedContext` or run the runs one after another. ④ The plan assumed the composer's banner and repeat work was all ahead of Session 2; Session 1 had already shipped the model, op, delivery and PRIVACY halves, which is what exposed the edit-wipe defect in §10.3 row 8. ⑤ The mid-session falsification pass corrected three things in §10 before any push: a citation claiming the mockup's composer rendered a Discord card (`broadcast.html:194` is the page's live-queue preview), two build instructions that ended in "or", and a defect (§10.3 row 8) that no agent brief owned — brief D now carries it. ⑥ Harkirat asked whether the in-line impeccable verbs had been considered (2026-09-13 21:15 EDT); they had not, and the `harden` pass found the day's widest defect — seven `stageOps` call sites that report success on a refused stage — which neither critique agent reported. §4 and the §11 prompt now name the in-line verbs. ⑦ The session asked for a push three times (2026-09-13 22:12 EDT) with the end-of-session work undone — no end-of-session thinking pass, no `npm test`, no memory-layer summary, no re-index, stale row counts in the CHANGELOG and §4, and §11 still naming G1–G6 after G8 was added. Each round of Harkirat's pushback found more, which is the fourth failure mode `thinking-pass.md` names. §13 now carries a Step 0 so the next two sessions on this plan execute it rather than remember it.

**Design-board follow-up amendments (2026-09-14 01:37 EDT):** ① the planning session's answer to audit row 41 was written first, then the board was built and reviewed in five versions on artifact comments — the board is now what §10 describes. ② Every design choice Harkirat made in a comment is quoted in its row with the comment's time, converted from the artifact's UTC stamps; choices the board made that he did not comment on are stated as the board's, and two of those that contradicted earlier decisions were corrected rather than adopted (rows 42–43). ③ Harkirat called out tool drift twice in the closing pass: `Read` and `sed` on files that were not about to be `Edit`ed — including this plan, which is changed by heredoc and so needed no `Read` — where `read_smart` was the rule. §1 row 6, `.claude/rules/silent-mode.md` rule 6 and `~/.claude/WORKING-AGREEMENT.md` now say so. ④ A heredoc edit and its commit message in one Bash call ran in the wrong order once (the message body before the script body); the rule in `.claude/rules/portal-editing.md` ordering trap 4 already named it.

**Board-2 session amendments (2026-09-14 16:12 EDT):** ① The board (§4b) ran 21 versions from 2026-09-14 03:35 to 15:22 EDT; Harkirat closed it with *"Nice! Now that's what I call refined… This is what you should've done autonomously as part of your design instead of it taking 21 versions."* §10.4's refinement contract, `measure.cjs` and a memory exist so the next design pass runs those checks before showing anything. ② The records pass drifted off this repo's tool routing in its first calls — a `Read` on this plan, which is changed by heredoc; `rg`, `awk` and `sed` for questions about prose — and Harkirat stopped it; linksee caveat #49394 records it. ③ G6 and G1 were answered by popup during the write-up, not on the board. ④ The first records heredoc died on a malformed `edit()` call after writing the board and its tracked copy but before touching this plan; the second wrote everything else, so nothing was half-applied.

**Assumptions converted to measurements:** accent hue distances and contrast ratios · ~50 `--staged` and 49 `--ok` consumers · five empty-state sites · the dev database's build-name distribution · gunsmith-code length on two real builds · 42 core op types · shape bounding boxes · `PORTAL_PORT` support · no JS emitter for `.hdr-out`. · slot metadata on 130 of 134 images, 0 of 133 builds in Mongo · the digit-to-slot map on ten real builds and 456 attachments · per-weapon pair uniqueness (413 keys, 0 conflicts) and a leave-one-out code fill (311 of 587) · `bulkPasteSummary.canStage` · the real export text for four dev builds.
