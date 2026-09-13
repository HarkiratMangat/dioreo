---
kind: plan
status: live
---

# Portal pins, batch 2 — two build sessions and one critique

> **For agentic workers:** execute INLINE, batched, per `superpowers:executing-plans`. Subagents run **only** where this plan names one — agents A and B in Session 1, agent D in Session 2 — dispatched with the brief written here and nowhere else. Announce each dispatch in one line. `- [ ]` marks steps; mark them `- [x]` with a computed timestamp as you go — this plan is `status: live`.

> 🔴 **IF YOU WERE HANDED A SHORT OPENER, IT IS NOT A SUMMARY OF THIS FILE.** A prompt from §11, a `.remember` line or a deferred-list entry points here and carries almost nothing of it. Only this file carries the agent briefs A, B and D (§8.3, text fences — dispatch with those words and no others), the file-conflict map (§7), the gate board (§9), the canonical DEVLOG body for the pre-merge checkpoint (§12) and the portal traps inlined in §1 row 10. Read §0 before acting on anything the opener said.

> 🔴 **SCOPE.** 29 pins, `pmtxsahvd` (2026-09-11 22:46 EDT) → `pmtylqtti` (2026-09-12 12:31 EDT). **Decisions:** `docs/superpowers/specs/2026-09-13-portal-pins-batch-2-design.md` — frozen; if this plan and the spec disagree, the spec wins and this plan is corrected in the same session. **The one exception is §10:** the critique session writes it, and it governs the three surfaces the spec hands to the critique — the New Build drawer, Compare, and the composer inputs. The deferred permission design supersedes spec §5 with a new dated spec rather than editing it. **Two more exceptions, found by the post-compact review (2026-09-13 14:15 EDT):** spec §6's migration line (ordinals → blank) is superseded by §8.3 brief B and gate G6, because `buildName` is still an identity key in six places and blanking it would overwrite images and merge builds; and spec §1.3's consumer counts were approximations — §3 Step 3's measured numbers govern. **Board:** https://claude.ai/code/artifact/dd0656fb-ab13-4358-8077-c0dd9089b24f.

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
| 6 | **Tool routing** | A file you will not `Edit` → `mcp__linksee__read_smart`, first read included. `Read` only for the exact bytes an `Edit` matches. A question about prose, including the ledger → `ctx_search` (`source: "portal-decision-ledger"` for ledger rows). A known literal → `rg`, with `-uu` when `local/` or a dot-directory could hold it. Callers, dependents, blast radius → `mcp__codebase-memory-mcp__search_graph` (`project: "Applications-Claude-Code-Diors-Builds"`, `include_connected: true`). Output you will process → `ctx_batch_execute` / `ctx_execute`, and never narrow inside the capture. Short fixed output or a state change → Bash. **Never `cat`, `sed -n` or `| head` to read a file.** |
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
| 4 | `pmtxviaom` | Analytics→History | Level chips carry severity | S2 · main | §8 |
| 5 | `pmtxvmcte` | Analytics→History | When in local time (UTC today) | S2 · main | §8 |
| 6 | `pmtxvp1qa` | Analytics→History | Column widths by role | S2 · main | §8 |
| 7 | `pmtxvrjls` | Analytics | Admin-traffic control redesign | S2 · main · G2 | §8 |
| 8 | `pmtyfklwl` | Access | Revoke inside the Edit drawer | S1 · main | §8 |
| 9 | `pmtyh3ep6` | Access | Permission restructure | **DEFERRED** — design pending | §5 |
| 10 | `pmtyih6yt` | All | Realm accents ship; page/command colours + tiers deferred | S1 · main · rest **DEFERRED** | §1 §5 |
| 11 | `pmtyii7ki` | Access | Retire the destructive token | **DEFERRED** — design pending | §5 |
| 12 | `pmtyikesy` | History | History realm split | S1 · main | §4 |
| 13 | `pmtyioc0l` | Access | Noise line sorted by kind; panel bar deferred | S2 · main · G1 · rest **DEFERRED** | §3 §8 |
| 14 | `pmtyiqqu3` | Shell | Remove the crumb | S1 · main | §8 |
| 15 | `pmtyisiuz` | Shell | Centre the command bar + keyboard nav | S1 · main | §8 |
| 16 | `pmtyiv9te` | Shell | Icon-only sign-out | S1 · main | §8 |
| 17 | `pmtyizssz · pmtyj0bqw` | Broadcast | Manifest — five fixes | S2 · main | §7 |
| 18 | `pmtyj3z8o` | Broadcast | Banner image + repeat N (24h floor) | S1 · agent A → critique → S2 · agent D | §7 |
| 19 | `pmtyj4nhx` | Broadcast | HeadsUp placement | S2 · main | §7 |
| 20 | `pmtyj69wu` | Broadcast | Announcement card redesign | S2 · main · G3 | §7 |
| 21 | `pmtyj6u8y` | Broadcast | Floating hint paragraph | S2 · main · G1 | §3 |
| 22 | `pmtyj9low` | Broadcast | Panel meta line | S2 · main · G1 | §3 |
| 23 | `pmtyj9r49` | All | Hint text, portal-wide | S2 · main · G1 | §3 |
| 24 | `pmtyjbql6` | Armory | Add-build button + Secondaries chip | S2 · main | §6 |
| 25 | `pmtylf7gz` | Armory | Manifest row redesign + build number/name | S1 · agent B → S2 · main · G4, G6 | §6 |
| 26 | `pmtylhbxw` | Armory | New Build drawer | critique → S2 · agent D | §6 |
| 27 | `pmtylle3x` | Armory | Bulk & Export: drop export, fold paste | S2 · main + S2 · agent D | §6 |
| 28 | `pmtylqtti` | Armory | Compare panel | critique; /compare filed | §6 |

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
- [x] *(2026-09-13 17:46 EDT — rail reads Season · Armory · Broadcast · Access · Analytics · divider · History · Review; `#/history` renders the manifest (11 rows, `--realm-c` #00E1D9); `#/analytics` has no `#manifest`; a change row opens the drawer, Reverse → confirm → "1 change reversed"; the Health "Restarts" tile opens History with the restarts chip pressed and the handoff key consumed — empty because the harness page holds no restart rows, the artifact the ledger already records; a handed-over `kind: change` filter shows 6 CHANGE rows only)* **Step 16 — close** (reload, then chrome-devtools reads): the rail reads Season, Armory, Broadcast, Access, Analytics, a divider, History, Review — seven entries (`REALMS` in `shell.js` holds five today, and Review renders separately); `#/history` renders the manifest; `#/analytics` has no `#manifest`; a revert on History still stages.

### 3.5 · Shell chrome

> ⟦ONE MESSAGE⟧ Step 17 — the page reads plus the reverse-orphan query.

- [ ] **Step 17 — reproduce first** (chrome-devtools on the Step 6 pages; the palette's keys with `press_key`): the crumb text, the command bar's x-centre vs the header's, Arrow keys in the ⌘/ palette doing nothing, the sign-out living only in the menu. Then `node scripts/portalReverseOrphans.mjs --why hdr-out`.
> ⟦ONE MESSAGE⟧ Step 18 — one heredoc, gates chained.

- [ ] **Step 18 — one heredoc:** remove the crumb (`shell.js:362-363`, `app.css:97-98`) and retire the two ledger rows that cited its wording · centre `.cmdbar` in the header (`app.css:3853`) · palette keyboard: ArrowUp/ArrowDown move an `aria-activedescendant` highlight, Enter runs it, Escape closes · icon-only sign-out after the profile button, reusing `.hdr-out` if Step 17 shows it is the intended rule, wired to the existing `session.end` confirm (`shell.js:487-495`) · move `dominantColors` (`access.js:80`) to a shared module and give the user menu (`shell.js:286`) the Edit drawer's mesh tint. Chain the gates as Step 11.
> ⟦ONE MESSAGE⟧ Step 19 — reload the seven pages in their own message first, then these reads in one.

- [ ] **Step 19 — close:** `document.querySelector('.crumb') === null` on all seven realms · `|cmdbar centre − header centre| ≤ 1px` · keyboard walk selects and runs an item without a mouse · the sign-out icon has an accessible name and opens the confirm · the menu's computed background carries the tint.

### 3.5b · Access — Revoke and session rows

> ⟦ONE MESSAGE⟧ Step 19a — reproduce, with the ledger query in the same message.

- [ ] **Step 19a — reproduce** (chrome-devtools on the Access page): open an admin's Edit drawer, click Revoke access, count `aside.drawer.open` (today: two); read a session row's device text. Same message: `ctx_search` the ledger for the 2026-09-10 and 2026-09-11 Access decisions (owner row stays, second-click tier-3 gate, Title and Note fields).
- [ ] **Step 19b — one heredoc:** Revoke becomes an in-drawer confirm state inside `GrantForm`, the way Save changes the drawer (`access.js:206-207`; the second drawer comes from `confirmRevoke` at `:936` through `Confirm`, `overlay.js:86`) · session rows show browser and OS parsed from `userAgent` (`access.js:278`), keeping the raw string on hover. Gates chained as Step 11.
- [ ] **Step 19c — close:** clicking Revoke leaves exactly one `aside.drawer.open`; with two dev `PortalSession` rows carrying a real Chrome-on-macOS and a real Safari-on-iPhone user-agent, read on the signed-in dev portal (§1 row 9), the rows read `Chrome · macOS` and `Safari · iPhone`. The harness fixture's strings are already readable and prove nothing (spec §9).

### 3.6 · Integrate A and B, then close the session

> ⟦ONE MESSAGE⟧ Steps 20–21 per agent, after its report arrives.

- [ ] **Step 20:** read the report · `git -C .claude/worktrees/pins2-a log --oneline -5` · `git merge --no-ff feat/pins2-a-broadcast-delivery` · re-run every gate the agent listed · check three listed claims against the code with `read_smart`/`search_graph`.
- [ ] **Step 21:** the same for B. **B writes no data at all** — its build-name report goes to Harkirat at gate G6 in Session 2.
> ⟦ONE MESSAGE⟧ Step 22 — one heredoc for every record, then `npm test` and `docs:audit` chained, exit codes read.

- [ ] **Step 22 — records + close:** CHANGELOG Unreleased entry, DEVLOG via the script, ledger rows, this file's boxes, a pin mark per closed row in `local/portal-sync-notes.md`. Final `npm test` and `npm run docs:audit`, each read by exit code. Then close the session by §13.

## 4 · CRITIQUE SESSION — New Build drawer, Compare, composer inputs

**When:** after Session 1 has merged, so the critique judges the new palette, and before Session 2, which builds from its output. **Model:** Premise High · Delib Medium → Opus5-High. **Branch:** `docs/portal-pins2-critique`.

- [ ] **Precondition:** `git show origin/v3-pre-release:portal/ui/tokens.css | rg -c -- '--r-history'` prints at least 1 — Session 1 has merged. Stop otherwise.
- [ ] Run `/impeccable critique` on each surface, on the harness (`http://localhost:8787/harness.html?fresh=1#/armory` and `#/broadcast`, chrome-devtools) — each run's two agents are mandatory, six across the three runs, and are this session's only agents: **(1)** the New Build drawer (`armory.js`, `loadout.add`), including **where paste-many lives inside it** (spec §6); **(2)** the Compare panel in every state — empty, one weapon, two weapons, a weapon with one build; **(3)** the Broadcast composer's new inputs for a banner image and repeat-N (spec §7).
- [ ] Write each surface's findings into §10 of this file, replacing its *Not yet written* line — one row per finding, `finding · severity · what the build must do`. A decision Harkirat makes goes in the ledger as a row.
- [ ] Compare's port to dioreo.app as `/compare` is filed in `docs/db-deferred-list.md`; findings that only matter for that port go there, not here.
- [ ] Close by §13. Session 2 cannot start until §10 is on `v3-pre-release`.

## 5 · SESSION 2 — the manifests · agent D

**Branch:** `feat/portal-pins2-manifests` off `v3-pre-release` after Session 1 and the critique have merged. **Model:** Premise Low · Delib Very high → Sonnet5-XHigh.

### 5.0 · Evidence + agent D

> ⟦ONE MESSAGE⟧ Steps 1–5.

- [ ] **Step 1 — git** as Session 1 Step 1, plus the precondition `git show origin/v3-pre-release:portal/ui/tokens.css | rg -c -- '--r-history'` printing at least 1 (Session 1 merged), and `git show origin/v3-pre-release:docs/superpowers/plans/2026-09-13-portal-pins-batch-2.md | rg 'Not yet written'` printing nothing (the critique merged — `rg` prints nothing and exits 1 on zero matches, so read the output, not a count), then D's worktree: `git worktree add -b feat/pins2-d-drawer .claude/worktrees/pins2-d feat/portal-pins2-manifests && cp .env.dev .claude/worktrees/pins2-d/`.
- [ ] **Step 2 — ledger:** manifest widths by role · the add button · Broadcast's state column and StatePill · HeadsUp · admin traffic (2026-09-02, masthead stats) · Armory's columns (sortable, Stage deletion) and its single New build chip (2026-09-11) · every `span.sp`/`p.chint`/`p.pnote`/`.hint` row.
- [ ] **Step 3 — critique output and sites:** §10 of this file must be fully written — **stop if any *Not yet written* line remains**. Same message: `rg -n 'class="sp"|class="chint|class="pnote|class="hint|class="nw-hint|class="bvnote|class="racknote| meta=' portal/ui/*.js` through `ctx_batch_execute`, plus every `Masthead` meta string.
- [ ] **Step 4 — B's output:** its build-name report (`local/pins2/build-name-report.txt`) and its new logic exports.
- [ ] **Step 5 — open** the History, Broadcast and Armory manifests with chrome-devtools `new_page`; their captures ride in Step 6's message.

> ⟦ONE MESSAGE⟧ Step 6 — dispatch agent D with brief §8.3 D, `model: "sonnet"`, background, and take the Step 5 before-captures with `take_screenshot` on the pages Step 5 opened.

### 5.1 · Gates, front-loaded

> ⟦ONE MESSAGE⟧ Steps 7–8 — write and publish the board, the popup, and Step 8's chrome-devtools reproduction, which does not need his answers.

- [ ] **Step 7 — one board, one popup.** Render, on one Artifact: **G1** the small-text table — every site with realm, string, kind (restatement / fact / finding), ledger row and proposed treatment, Access's "1 admin × 12 permissions" included; **G2** three renderings of the admin-traffic control; **G3** two or three announcement-card redesigns; **G4** two or three Armory manifest rows on real dev data, carrying everything spec §6 lists; **G6** agent B's build-name report with its two options (brief B step 5). Then one `AskUserQuestion`. **Build 5.2 while he looks** — it does not depend on the answers.

### 5.2 · The shared manifest

- [ ] **Step 8 — reproduce** the floating add button on Armory and Broadcast, Secondaries' position, the When column's UTC value against the local clock, the Level chips' lack of severity.
> ⟦ONE MESSAGE⟧ Step 9 — one heredoc, gates chained.

- [ ] **Step 9 — one heredoc:** the tools row places `.madd` deliberately (`manifest.js:206`) and the category chips follow `CATEGORY_CHIP_ORDER` without an orphan · column roles, not widths (`manifest.js:222-225`): When, Source and Who narrow, What detail · History's When renders local time as `Sep 6, 7:25 PM` via `Intl.DateTimeFormat(undefined, …)` · Level chips take `LEVEL_ROW`'s severity classes · Broadcast's five column fixes, and HeadsUp moved to the top of its realm (it arrives through the Shell's `noticeSlot` — check whether the slot order affects other realms first) · the floating `p.chint` handled by its kind · Armory's Bulk & Export panel is left alone here — agent D removes it whole after folding the paste into New Build, because two streams editing `armory.js:960-1090` at once is the conflict §7 exists to prevent. Gates chained.

### 5.3 · After his answers

> ⟦ONE MESSAGE⟧ Step 10 — ONE heredoc for every answered gate, gates chained; G6's single write is a separate Bash call, and only if approved.

- [ ] **Step 10 — one heredoc for every answered gate:** G1 applied site by site, each ledger row cited or retired · G2 control · G3 card · G4 row, using B's derived build number and copy/share builders · G6: if he picks display-only labels, apply `displayBuildLabel` and, only if he approves it, move the one gunsmith code out of its name field in a single write; if he picks the identity refactor, file it `[P1]` with B's dependents list and build nothing more for names here.
> ⟦ONE MESSAGE⟧ Step 11 — after a reload in its own message: chrome-devtools reads and captures together.

- [ ] **Step 11 — close:** captures after; no `.madd` outside its tools-row slot; the When cell equals `new Date(r.at).toLocaleString` for three rows; What's rendered width exceeds When, Source and Who each; `document.querySelectorAll('.sp').length` matches the G1 table's keep count per realm.

### 5.4 · Integrate D and close

> ⟦ONE MESSAGE⟧ Step 12 — D's report read, merge, gates re-run, three claims checked.

- [ ] **Step 12:** integrate D as Session 1 Step 20, then run trap 10(c) on every selector D's appended block and the main thread both touched.
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
| `portal/ui/manifest.js` | | | | ✏️ | |
| `portal/ui/broadcast.js`, `portal/ui/composer.js` | | | | ✏️ manifest | ✏️ composer |
| `portal/ui/armory.js` | | | | ✏️ row | ✏️ drawer, Bulk & Export removal |
| `portal/ui/armory.logic.js`, `portal/api/armory.js` | | | ✏️ | | |
| `portal/ui/access.js`, `portal/ui/overlay.js` | ✏️ revoke, sessions, import | | | | |
| `portal/api/realmAccess.js` | ✏️ History visibility | | | | |
| `models/Announcement.js`, `models/UserPreference.js`, `utils/announcement.js`, `core/ops/announcements.js`, `docs/legal/PRIVACY.md` | | ✏️ | | | |
| `models/Loadout.js`, `handlers/manage/loadouts.js`, `commands/manage.js` | | | ✏️ | | |

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
READ: plan §10 (the critique's findings) in full; spec §6 and §7; plan §1 and §8.
DO:
 1. The New Build drawer per §10.1, including paste-many carrying BulkView's parse and BulkOverwrites' per-field preview (armory.js:960-1090); then delete the Bulk & Export panel with the deletion rule (assert survivors).
 2. The Broadcast composer's banner-image and repeat inputs per §10.3, bound to agent A's fields.
 3. CSS: one new block at the END of portal/ui/app.css under a banner comment naming this stream; edit no existing rule.
GATES: npm test · node scripts/portalReverseOrphans.mjs --ci · node scripts/portalStates.mjs --ci · live getComputedStyle checks on port 8788 for every §10 row.
RULES: as agent A.
RETURN: plan §8.2 shape, plus local/pins2/d-after-*.png from chrome-devtools take_screenshot.
```

## 9 · Gates — Harkirat's decisions inside sessions

| Gate | Session | Rendered first | Asked |
|---|---|---|---|
| G1 | S2 | Every small-text site: realm · string · kind · ledger row · treatment | Keep / cut / change per site, overruling any row |
| G2 | S2 | Three admin-traffic controls | Which one |
| G3 | S2 | Two or three announcement cards | Which one |
| G4 | S2 | Two or three Armory rows on real data | Which one |
| G6 | S2 | Agent B's build-name report: every build, and every place `buildName` is still an identity | Display-only labels now, or an identity refactor filed as its own item? |

All five go on ONE board with ONE popup at Session 2 Step 7. G5 and G7 belonged to the deferred permission work and are gone.

## 10 · Reserved — written by the critique session

### 10.1 · New Build drawer
- [ ] *Not yet written.*

### 10.2 · Compare panel
- [ ] *Not yet written.*

### 10.3 · Composer — banner image and repeat inputs
- [ ] *Not yet written.*

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
Run /impeccable critique on the three surfaces §4 names, on the harness with chrome-devtools. Each run's two agents are the only agents you dispatch.
Write every finding into §10 as finding · severity · what the build must do, replacing each "Not yet written" line. A decision I make goes in the ledger as a row.
docs/ideas/diors-notes.md is out of scope. Close by §13; push, PR and merge each need my approval restated.
```

```text
/rename Sonnet5-XHigh · Pins2 S2 manifests · <Mon DD>
Premise Low · Delib Very high -> Sonnet5-XHigh

You are Session 2 of docs/superpowers/plans/2026-09-13-portal-pins-batch-2.md. Session 1 and the critique must both be on v3-pre-release; §5.0 Step 1 proves it.
Read in full: the plan's §0, §1, §7, §8, §9, §10 and §13, then §5, plus §3.0 Step 1 and §3.6 Steps 20 and 22, which §5 reuses; the spec's §3, §6, §7 and §8.
Step 0 is §5.0 Steps 1-5 as ONE message. Stop at Step 3 if §10 still has a "Not yet written" line. If npm run index:health exits 4, stop and tell me.
G1-G4 and G6 go to me on ONE board with ONE popup (Step 7); build §5.2 while I look. G6 is a data decision: show agent B's build-name report, and run no write I have not approved.
You dispatch exactly one agent, D, with the §8.3 brief verbatim.
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

## 13 · Closing a build session — Session 1, the critique, Session 2

Each session's work must be on `v3-pre-release` before the next session starts: the next precondition reads the merged file, not your branch.

> ⟦ONE MESSAGE⟧ Step 1 — only after Harkirat approves the push, restated as `Approved by · to · when`.

- [ ] **Step 1:** `git push -u origin <session branch> && gh pr create --base v3-pre-release` — `gh` defaults to `main`, which is the wrong base — with the PR body ending in the Claude Code attribution line.

> ⟦ONE MESSAGE⟧ Step 2 — the pre-merge checkpoint as one heredoc, gates chained.

- [ ] **Step 2:** read the version from `git show origin/v3-pre-release:package.json` and take the next moderate step, `v3.(x+1).0-pre` — never a number copied from this plan · the session's CHANGELOG Unreleased entry becomes `## Pre-Release v3.(x+1).0 — <computed stamp> (#<PR>) — <what it did>` at the top of the released entries · `package.json` → that version · the DEVLOG entry through `node scripts/devlog-add.mjs --desc "<description> (v3.(x+1).0-pre)" --body-file -` · `npm run docs:audit` and `npm test`, each read by exit code.

> ⟦ONE MESSAGE⟧ Step 3 — only after Harkirat approves the merge, restated.

- [ ] **Step 3:** `gh pr merge --squash --delete-branch` with an explicit `--body` carrying one trailer block · confirm `git log -1 origin/v3-pre-release` is this release before anything else · no tag · `git fetch origin main:main v3-pre-release:v3-pre-release`.

> ⟦ONE MESSAGE⟧ Step 4 — cleanup, indexes, carriers.

- [ ] **Step 4:** remove each agent worktree and branch this session made, after the merge is confirmed (`git worktree remove .claude/worktrees/pins2-<x>` · `git branch -D feat/pins2-<x>-…`; the critique made none) · re-index per `CLAUDE.md` · `npm run index:health` exits 0 · every box in this session's section reads `- [x]` · `.remember` names the next session and its §11 prompt.

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

**Carried into the deferred permission design, not fixed here:** Access delegation without guardrails would be privilege escalation (his answer: guardrails) · retiring `destructive` removes the owner-only lock's derivation source · revoke symmetry was never asked · the view-only sub-tier has no shape.

**Cleared, not fixed:** every file:line the spec cites still points at the named code on `efa5480e` (49 checked, 2026-09-13 14:15 EDT) · `v3-pre-release` has not moved since this branch was cut and no PR is open into it · `efa5480e` stays an ancestor through squash merges, because the integration branch is never rewritten · the `/gunsmiths search` `build` option is an integer position, so a derived build number is what the share text needs · readme-map is satisfied because `docs/superpowers/` is the coverage unit · the four shapes do not clip at 16/20/24px (measured margins ≥ 1.5px after refit) · Marksman's collision with `--ok` ends by itself · the planning branch changes no code.

**Alternatives re-examined:** five sessions — rejected by Harkirat; three with agents held because three of the eight units were backend streams with no live verification and no gates, and two now hold once permissions left · per-realm sessions — rejected, `manifest.js` would be edited three times · UI work by agents — only D, with its own port.

**Not verified, and marked so:** whether `/impeccable critique` can be scoped to one component inside a realm; whether `mintSession` against the launchd service on 8787 needs anything beyond `.env.dev`.

**Assumptions converted to measurements:** accent hue distances and contrast ratios · ~50 `--staged` and 49 `--ok` consumers · five empty-state sites · the dev database's build-name distribution · gunsmith-code length on two real builds · 42 core op types · shape bounding boxes · `PORTAL_PORT` support · no JS emitter for `.hdr-out`.
