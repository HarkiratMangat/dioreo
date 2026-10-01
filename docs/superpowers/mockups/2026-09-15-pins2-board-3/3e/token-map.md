---
kind: reference
status: live
---

# Board 3-E — every custom property the design reads, against the portal

> 🔴 **CORRECTED 2026-09-21 10:17 EDT:** the L1 lab's 36 variables were labelled COMPONENT (*set by the rule that uses it*). No rule sets them — the lab writes them onto `:root` from JavaScript and the rules read them with a fallback. Two fallbacks disagreed with his saved values (`--gh-chip-x` 30 vs **20**, `--r-warn-img` 18 vs **14**), fixed in the kit at commit `a315c2c`. Each row now carries his saved value.

*Generated 2026-09-21 09:37 EDT. Values are resolved on the running board (`resolved-spec/tokens.md`); "portal" means defined in `portal/ui/tokens.css`, `app.css` or `v2card.css`.*

🔴 **This is the table that makes a verbatim port safe.** Board 2 told Session 5 to port the winning declaration "tokens intact", which was right for a board built on portal tokens. Board 3-E's declarations read tokens the portal does not have. Porting `.b3-btn2.stage` verbatim writes `var(--b3-fill)` and `var(--b3-under)` into a stylesheet where both resolve to nothing, and the button renders transparent — with no error anywhere.

| Class | Count | Meaning |
|---|---|---|
| **PORTAL** | 153 | Already a portal token. Ports unchanged |
| **BOARD TOKEN** | 35 | `--b3-*`. Map to the named portal token where the values match; otherwise it is a NEW token, and **naming tokens is Session 4's job** (§5c: "standardize element designs and tokens") |
| **JS-ONLY** | 18 | `--h1-*`. Exists only because `b3/state.js` stamps it at runtime; no stylesheet defines it. His saved values are given |
| **COMPONENT** | 149 | Set on an element by its own rule (`--c`, `--m`, `--sl`…). Travels with that rule |

| Token | Value on the board | Uses | Class | What to do |
|---|---|---|---|---|
| `--b3-amb` | — | 7 | **BOARD TOKEN** | set per component — ports with its rule |
| `--b3-ang` | `0deg` | 1 | **BOARD TOKEN** | **NEW TOKEN** — no portal token holds this value; Session 4 names it |
| `--b3-cdu` | `url("data:image/svg+xml,%3Csvg xmlns='http:/…")` | 2 | **BOARD TOKEN** | **NEW TOKEN** — no portal token holds this value; Session 4 names it |
| `--b3-check` | `url("data:image/svg+xml,%3Csvg xmlns='http:/…")` | 2 | **BOARD TOKEN** | **NEW TOKEN** — no portal token holds this value; Session 4 names it |
| `--b3-clock` | `url("data:image/svg+xml,%3Csvg xmlns='http:/…")` | 2 | **BOARD TOKEN** | **NEW TOKEN** — no portal token holds this value; Session 4 names it |
| `--b3-cud` | `url("data:image/svg+xml,%3Csvg xmlns='http:/…")` | 2 | **BOARD TOKEN** | **NEW TOKEN** — no portal token holds this value; Session 4 names it |
| `--b3-d1` | `.15s` | 73 | **BOARD TOKEN** | **NEW TOKEN** — no portal token holds this value; Session 4 names it |
| `--b3-d2` | `.22s` | 6 | **BOARD TOKEN** | **NEW TOKEN** — no portal token holds this value; Session 4 names it |
| `--b3-d3` | `.3s` | 1 | **BOARD TOKEN** | **NEW TOKEN** — no portal token holds this value; Session 4 names it |
| `--b3-edge` | — | 4 | **BOARD TOKEN** | set per component — ports with its rule |
| `--b3-fill` | — | 15 | **BOARD TOKEN** | set per component — ports with its rule |
| `--b3-foldw` | — | 3 | **BOARD TOKEN** | set per component — ports with its rule |
| `--b3-glow` | — | 3 | **BOARD TOKEN** | set per component — ports with its rule |
| `--b3-hatch` | `repeating-linear-gradient(-45deg,#FF7A45 0 2.5px,transparent 2.5px 5px` | 7 | **BOARD TOKEN** | **NEW TOKEN** — no portal token holds this value; Session 4 names it |
| `--b3-layers` | `url("data:image/svg+xml,%3Csvg xmlns='http:/…")` | 2 | **BOARD TOKEN** | **NEW TOKEN** — no portal token holds this value; Session 4 names it |
| `--b3-lift` | `0 24px 48px -16px rgba(0,0,0,.8)` | 2 | **BOARD TOKEN** | **NEW TOKEN** — no portal token holds this value; Session 4 names it |
| `--b3-plus` | `url("data:image/svg+xml,%3Csvg xmlns='http:/…")` | 2 | **BOARD TOKEN** | **NEW TOKEN** — no portal token holds this value; Session 4 names it |
| `--b3-plusdk` | `url("data:image/svg+xml,%3Csvg xmlns='http:/…")` | 2 | **BOARD TOKEN** | **NEW TOKEN** — no portal token holds this value; Session 4 names it |
| `--b3-repeat` | `url("data:image/svg+xml,%3Csvg xmlns='http:/…")` | 2 | **BOARD TOKEN** | **NEW TOKEN** — no portal token holds this value; Session 4 names it |
| `--b3-reveal` | `260ms` | 9 | **BOARD TOKEN** | same value as portal `--dur-toast-out`, `--dur-toast-out` — map to it |
| `--b3-reveal-ease` | `cubic-bezier(.22, .61, .36, 1)` | 4 | **BOARD TOKEN** | **NEW TOKEN** — no portal token holds this value; Session 4 names it |
| `--b3-ring` | `inset 0 0 0 1px #3A4752` | 88 | **BOARD TOKEN** | **NEW TOKEN** — no portal token holds this value; Session 4 names it |
| `--b3-speck` | — | 1 | **BOARD TOKEN** | set per component — ports with its rule |
| `--b3-text` | `url("data:image/svg+xml,%3Csvg xmlns='http:/…")` | 2 | **BOARD TOKEN** | **NEW TOKEN** — no portal token holds this value; Session 4 names it |
| `--b3-tip-clip` | — | 1 | **BOARD TOKEN** | set per component — ports with its rule |
| `--b3-tip-down` | `polygon(0 0,100% 0,50% 100%)` | 2 | **BOARD TOKEN** | **NEW TOKEN** — no portal token holds this value; Session 4 names it |
| `--b3-tip-fill` | — | 1 | **BOARD TOKEN** | set per component — ports with its rule |
| `--b3-tip-h` | `7px` | 1 | **BOARD TOKEN** | **NEW TOKEN** — no portal token holds this value; Session 4 names it |
| `--b3-tip-ring` | — | 1 | **BOARD TOKEN** | set per component — ports with its rule |
| `--b3-tip-up` | `polygon(50% 0,100% 100%,0 100%)` | 2 | **BOARD TOKEN** | **NEW TOKEN** — no portal token holds this value; Session 4 names it |
| `--b3-tip-w` | `14px` | 1 | **BOARD TOKEN** | same value as portal `--gap`, `--gap` — map to it |
| `--b3-tr` | `.11em` | 70 | **BOARD TOKEN** | **NEW TOKEN** — no portal token holds this value; Session 4 names it |
| `--b3-tr-tight` | `.06em` | 17 | **BOARD TOKEN** | **NEW TOKEN** — no portal token holds this value; Session 4 names it |
| `--b3-tr-wide` | `.14em` | 30 | **BOARD TOKEN** | **NEW TOKEN** — no portal token holds this value; Session 4 names it |
| `--b3-under` | — | 3 | **BOARD TOKEN** | set per component — ports with its rule |
| `--h1-cell` | `22px` | 2 | **JS-ONLY** | **22px** — his saved value. Becomes a literal, or a token Session 4 names |
| `--h1-chip` | `6px` | 2 | **JS-ONLY** | **6px** — his saved value. Becomes a literal, or a token Session 4 names |
| `--h1-col` | `36px` | 1 | **JS-ONLY** | **36px** — his saved value. Becomes a literal, or a token Session 4 names |
| `--h1-day` | `52px` | 1 | **JS-ONLY** | **52px** — his saved value. Becomes a literal, or a token Session 4 names |
| `--h1-head` | `16px` | 1 | **JS-ONLY** | **16px** — his saved value. Becomes a literal, or a token Session 4 names |
| `--h1-kind` | `110px` | 2 | **JS-ONLY** | **110px** — his saved value. Becomes a literal, or a token Session 4 names |
| `--h1-l` | `22px` | 3 | **JS-ONLY** | **22px** — his saved value. Becomes a literal, or a token Session 4 names |
| `--h1-lab` | `16px` | 3 | **JS-ONLY** | **16px** — his saved value. Becomes a literal, or a token Session 4 names |
| `--h1-labw` | `56px` | 3 | **JS-ONLY** | **56px** — his saved value. Becomes a literal, or a token Session 4 names |
| `--h1-r` | `22px` | 2 | **JS-ONLY** | **22px** — his saved value. Becomes a literal, or a token Session 4 names |
| `--h1-row` | `10px` | 1 | **JS-ONLY** | **10px** — his saved value. Becomes a literal, or a token Session 4 names |
| `--h1-rowh` | `44px` | 1 | **JS-ONLY** | **44px** — his saved value. Becomes a literal, or a token Session 4 names |
| `--h1-rowp` | `11px` | 1 | **JS-ONLY** | **11px** — his saved value. Becomes a literal, or a token Session 4 names |
| `--h1-srchh` | `44px` | 1 | **JS-ONLY** | **44px** — his saved value. Becomes a literal, or a token Session 4 names |
| `--h1-srchw` | `340px` | 1 | **JS-ONLY** | **340px** — his saved value. Becomes a literal, or a token Session 4 names |
| `--h1-top` | `16px` | 1 | **JS-ONLY** | **16px** — his saved value. Becomes a literal, or a token Session 4 names |
| `--h1-undo` | `90px` | 4 | **JS-ONLY** | **90px** — his saved value. Becomes a literal, or a token Session 4 names |
| `--h1-who` | `100px` | 2 | **JS-ONLY** | **100px** — his saved value. Becomes a literal, or a token Session 4 names |
| `--a` | — | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--atbg` | — | 2 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--atink` | — | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--atlit` | — | 5 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--atlit-hi` | — | 2 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--atring` | — | 5 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--atring-hi` | — | 2 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--atts-l` | `0px` | 2 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--atts-r` | `34px` | 2 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--atw` | — | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--av-src` | — | 7 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--avatar-a` | `#3A4C5A` | 7 | **PORTAL** | ports as is |
| `--b` | — | 4 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--bc` | — | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--box-inset` | `5px` | 10 | **PORTAL** | ports as is |
| `--c` | — | 380 | **PORTAL** | ports as is |
| `--ci` | — | 8 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--ci-bg` | — | 2 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--code-js` | `end` | 2 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`end`** — port as a literal or a Session-4 token name, never as `var(--code-js, fallback)` |
| `--code-w` | — | 4 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--colsc` | — | 2 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--ctl-min` | `auto` | 1 | **PORTAL** | ports as is |
| `--ctl-pad` | `1px 6px` | 1 | **PORTAL** | ports as is |
| `--ctl-pl` | — | 1 | **PORTAL** | ports as is |
| `--ctl-rad` | `0` | 1 | **PORTAL** | ports as is |
| `--d` | — | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--danger-edge` | `#54322F` | 37 | **PORTAL** | ports as is |
| `--danger-ink` | `#FF8A85` | 82 | **PORTAL** | ports as is |
| `--data` | `"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace` | 492 | **PORTAL** | ports as is |
| `--dc-bg` | `#2B2D31` | 3 | **PORTAL** | ports as is |
| `--dc-body` | `#DBDEE1` | 8 | **PORTAL** | ports as is |
| `--dc-code` | `#A8B0B8` | 1 | **PORTAL** | ports as is |
| `--dc-dim` | `#949BA4` | 9 | **PORTAL** | ports as is |
| `--dc-ink` | `#F2F3F5` | 7 | **PORTAL** | ports as is |
| `--dc-mute` | `#B5BAC1` | 6 | **PORTAL** | ports as is |
| `--dc-rule` | `#3A3C41` | 9 | **PORTAL** | ports as is |
| `--dc-sunk` | `#1E1F22` | 7 | **PORTAL** | ports as is |
| `--del` | `#FF6B6B` | 40 | **PORTAL** | ports as is |
| `--desk` | `#0F1418` | 33 | **PORTAL** | ports as is |
| `--display` | `"Big Shoulders Display","Space Grotesk",-apple-system,BlinkMacSystemFo` | 25 | **PORTAL** | ports as is |
| `--dlen` | — | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--dsc` | `#5865F2` | 3 | **PORTAL** | ports as is |
| `--dsc-hover` | `#4752C4` | 1 | **PORTAL** | ports as is |
| `--dur-1` | `130ms` | 83 | **PORTAL** | ports as is |
| `--dur-2` | `180ms` | 22 | **PORTAL** | ports as is |
| `--dur-3` | `320ms` | 14 | **PORTAL** | ports as is |
| `--dur-toast-in` | `460ms` | 1 | **PORTAL** | ports as is |
| `--dur-toast-out` | `260ms` | 1 | **PORTAL** | ports as is |
| `--ease` | `cubic-bezier(.2,.8,.3,1)` | 165 | **PORTAL** | ports as is |
| `--ease-soft` | `cubic-bezier(.22,1,.36,1)` | 4 | **PORTAL** | ports as is |
| `--ed` | — | 16 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--edge` | `22px` | 1 | **PORTAL** | ports as is |
| `--ev` | `#4A90D9` | 12 | **PORTAL** | ports as is |
| `--ev-ink` | `#25A570` | 2 | **PORTAL** | ports as is |
| `--f` | — | 2 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--fb` | `0px` | 12 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--fc` | — | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--fdy` | — | 2 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--fill` | — | 2 | **PORTAL** | ports as is |
| `--fl` | — | 6 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--fo` | — | 20 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--focus` | `#5FD4E8` | 75 | **PORTAL** | ports as is |
| `--focus-07` | `rgba(95,212,232,.07)` | 1 | **PORTAL** | ports as is |
| `--focus-13` | `rgba(95,212,232,.13)` | 1 | **PORTAL** | ports as is |
| `--fr` | — | 6 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--from` | — | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--ft` | `0px` | 12 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--fx-l` | — | 4 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--fx-r` | — | 4 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--gap` | `14px` | 1 | **PORTAL** | ports as is |
| `--gc` | — | 2 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--gh-cat-range` | `18px` | 1 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`18px`** — port as a literal or a Session-4 token name, never as `var(--gh-cat-range, fallback)` |
| `--gh-chip-x` | — | 1 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`20px`** — port as a literal or a Session-4 token name, never as `var(--gh-chip-x, fallback)` |
| `--gh-div-badge` | `12px` | 1 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`12px`** — port as a literal or a Session-4 token name, never as `var(--gh-div-badge, fallback)` |
| `--gh-name-cat` | `9px` | 1 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`9px`** — port as a literal or a Session-4 token name, never as `var(--gh-name-cat, fallback)` |
| `--gh-pl` | `16px` | 1 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`16px`** — port as a literal or a Session-4 token name, never as `var(--gh-pl, fallback)` |
| `--gh-pr` | `16px` | 1 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`16px`** — port as a literal or a Session-4 token name, never as `var(--gh-pr, fallback)` |
| `--gh-range-div` | `12px` | 1 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`12px`** — port as a literal or a Session-4 token name, never as `var(--gh-range-div, fallback)` |
| `--glo` | — | 3 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--gut` | `24px` | 1 | **PORTAL** | ports as is |
| `--gutter` | `138px` | 8 | **PORTAL** | ports as is |
| `--hdr-h` | `52px` | 4 | **PORTAL** | ports as is |
| `--hi` | `#232C34` | 123 | **PORTAL** | ports as is |
| `--hi-gut` | — | 2 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--hi-head` | — | 2 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--hi-l` | — | 3 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--hi-r` | — | 3 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--info` | `#409AD0` | 26 | **PORTAL** | ports as is |
| `--ink` | `#E8EDF1` | 524 | **PORTAL** | ports as is |
| `--ink2` | `#9DAAB4` | 302 | **PORTAL** | ports as is |
| `--ink3` | `#85939F` | 652 | **PORTAL** | ports as is |
| `--ink4` | `#5C6A75` | 143 | **PORTAL** | ports as is |
| `--inset-06` | `rgba(255,255,255,.06)` | 1 | **PORTAL** | ports as is |
| `--inset-09` | `rgba(255,255,255,.09)` | 3 | **PORTAL** | ports as is |
| `--inset-14` | `rgba(255,255,255,.14)` | 1 | **PORTAL** | ports as is |
| `--inset-16` | `rgba(255,255,255,.16)` | 2 | **PORTAL** | ports as is |
| `--inset-22` | `rgba(255,255,255,.22)` | 2 | **PORTAL** | ports as is |
| `--inset-35` | `rgba(255,255,255,.35)` | 1 | **PORTAL** | ports as is |
| `--k` | — | 3 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--kg` | — | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--lab-bg` | — | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--lab-div` | — | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--lab-fam` | `"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace` | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--lab-gap` | `1.1ch` | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--lab-ink` | — | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--lab-ml` | — | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--lab-order` | — | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--lab-pad` | — | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--lab-rad` | — | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--lab-ring` | — | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--lab-sep` | `""` | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--lab-size` | `9.5px` | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--lab-tr` | `.11em` | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--lab-tt` | `uppercase` | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--lab-w` | `700` | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--lc` | — | 18 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--lh-body` | `1.5` | 1 | **PORTAL** | ports as is |
| `--lh-ic-n` | `10px` | 1 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`10px`** — port as a literal or a Session-4 token name, never as `var(--lh-ic-n, fallback)` |
| `--lh-n-w` | `11px` | 1 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`11px`** — port as a literal or a Session-4 token name, never as `var(--lh-n-w, fallback)` |
| `--lh-pl` | `26px` | 1 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`26px`** — port as a literal or a Session-4 token name, never as `var(--lh-pl, fallback)` |
| `--lh-pr` | `10px` | 1 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`10px`** — port as a literal or a Session-4 token name, never as `var(--lh-pr, fallback)` |
| `--lh-ui` | `1.35` | 4 | **PORTAL** | ports as is |
| `--lh-vl-vt` | `12px` | 1 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`12px`** — port as a literal or a Session-4 token name, never as `var(--lh-vl-vt, fallback)` |
| `--lift` | `2px` | 2 | **PORTAL** | ports as is |
| `--lit` | `0.06` | 6 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--live` | — | 20 | **PORTAL** | ports as is |
| `--m` | — | 8 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--m1` | — | 5 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--m2` | — | 4 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--m3` | — | 4 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--m4` | — | 2 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--marks-w` | — | 4 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--mk` | — | 6 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--mode-dmz` | `#3DA5F5` | 5 | **PORTAL** | ports as is |
| `--mode-mp` | `#FF3430` | 3 | **PORTAL** | ports as is |
| `--mono` | `"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace` | 5 | **PORTAL** | ports as is |
| `--n` | — | 3 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--nw` | — | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--o` | — | 8 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--ok` | `#7BDB63` | 165 | **PORTAL** | ports as is |
| `--on-accent` | `#07090A` | 42 | **PORTAL** | ports as is |
| `--on-ok` | `#07130A` | 7 | **PORTAL** | ports as is |
| `--on-staged` | `#1A2000` | 5 | **PORTAL** | ports as is |
| `--overlay-62` | `rgba(6,9,11,.62)` | 1 | **PORTAL** | ports as is |
| `--overlay-66` | `rgba(6,9,11,.66)` | 1 | **PORTAL** | ports as is |
| `--ow-c-min` | `88px` | 1 | **PORTAL** | ports as is |
| `--ow-pill-min` | `126px` | 1 | **PORTAL** | ports as is |
| `--p` | — | 2 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--paper` | `#171E24` | 65 | **PORTAL** | ports as is |
| `--patch` | `#F2C230` | 210 | **PORTAL** | ports as is |
| `--pb-inset` | `5px` | 8 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--pcb` | — | 11 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--pcbg` | — | 4 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--ph` | — | 5 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--pk` | — | 6 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--plot-l` | `138px` | 2 | **PORTAL** | ports as is |
| `--pn` | `#F2C230` | 3 | **PORTAL** | ports as is |
| `--press` | `1px` | 1 | **PORTAL** | ports as is |
| `--r-access` | `#6C8AF7` | 1 | **PORTAL** | ports as is |
| `--r-analytics` | `#9CC85A` | 6 | **PORTAL** | ports as is |
| `--r-armory` | `#EF4444` | 8 | **PORTAL** | ports as is |
| `--r-att-code` | `30px` | 2 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`30px`** — port as a literal or a Session-4 token name, never as `var(--r-att-code, fallback)` |
| `--r-broadcast` | `#EC4899` | 12 | **PORTAL** | ports as is |
| `--r-code-warn` | `20px` | 2 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`20px`** — port as a literal or a Session-4 token name, never as `var(--r-code-warn, fallback)` |
| `--r-history` | `#00E1D9` | 3 | **PORTAL** | ports as is |
| `--r-img-x` | `30px` | 3 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`30px`** — port as a literal or a Session-4 token name, never as `var(--r-img-x, fallback)` |
| `--r-n-att` | `30px` | 1 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`30px`** — port as a literal or a Session-4 token name, never as `var(--r-n-att, fallback)` |
| `--r-pl` | `7px` | 1 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`7px`** — port as a literal or a Session-4 token name, never as `var(--r-pl, fallback)` |
| `--r-pr` | `16px` | 1 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`16px`** — port as a literal or a Session-4 token name, never as `var(--r-pr, fallback)` |
| `--r-review` | `#D8F24A` | 26 | **PORTAL** | ports as is |
| `--r-season` | `#F59E0C` | 2 | **PORTAL** | ports as is |
| `--r-tag` | `4px` | 1 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`4px`** — port as a literal or a Session-4 token name, never as `var(--r-tag, fallback)` |
| `--r-warn-img` | — | 2 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`14px`** — port as a literal or a Session-4 token name, never as `var(--r-warn-img, fallback)` |
| `--rad-1` | `3px` | 155 | **PORTAL** | ports as is |
| `--rad-2` | `6px` | 231 | **PORTAL** | ports as is |
| `--rad-3` | `10px` | 58 | **PORTAL** | ports as is |
| `--rad-box` | `8px` | 14 | **PORTAL** | ports as is |
| `--rad-pill` | `999px` | 68 | **PORTAL** | ports as is |
| `--rad-round` | `50%` | 22 | **PORTAL** | ports as is |
| `--radius` | `6px` | 1 | **PORTAL** | ports as is |
| `--rail-w` | `88px` | 5 | **PORTAL** | ports as is |
| `--raised` | `#1F272E` | 144 | **PORTAL** | ports as is |
| `--rc` | — | 4 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--rc-a` | — | 3 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--reach` | — | 2 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--realm-c` | — | 17 | **PORTAL** | ports as is |
| `--rec-x` | — | 2 | **PORTAL** | ports as is |
| `--row-selected` | `#20303B` | 1 | **PORTAL** | ports as is |
| `--rowcols` | — | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--rule` | `#2A343D` | 222 | **PORTAL** | ports as is |
| `--rule2` | `#3A4752` | 291 | **PORTAL** | ports as is |
| `--rule3` | `#1C242A` | 66 | **PORTAL** | ports as is |
| `--s1` | `4px` | 7 | **PORTAL** | ports as is |
| `--s2` | `8px` | 40 | **PORTAL** | ports as is |
| `--s3` | `12px` | 49 | **PORTAL** | ports as is |
| `--s4` | `16px` | 39 | **PORTAL** | ports as is |
| `--s5` | `24px` | 19 | **PORTAL** | ports as is |
| `--s6` | `32px` | 2 | **PORTAL** | ports as is |
| `--sched` | `#A680FB` | 6 | **PORTAL** | ports as is |
| `--scrim-28` | `rgba(0,0,0,.28)` | 1 | **PORTAL** | ports as is |
| `--scrim-40` | `rgba(0,0,0,.4)` | 2 | **PORTAL** | ports as is |
| `--scrim-45` | `rgba(0,0,0,.45)` | 1 | **PORTAL** | ports as is |
| `--scrim-50` | `rgba(0,0,0,.5)` | 1 | **PORTAL** | ports as is |
| `--scrim-70` | `rgba(0,0,0,.7)` | 1 | **PORTAL** | ports as is |
| `--scrim-80` | `rgba(0,0,0,.8)` | 4 | **PORTAL** | ports as is |
| `--scrim-85` | `rgba(0,0,0,.85)` | 4 | **PORTAL** | ports as is |
| `--scrim-90` | `rgba(0,0,0,.9)` | 17 | **PORTAL** | ports as is |
| `--scrim-95` | `rgba(0,0,0,.95)` | 1 | **PORTAL** | ports as is |
| `--sev` | — | 2 | **PORTAL** | ports as is |
| `--sl` | — | 67 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--sl-unknown` | `#94A3B3` | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--slotcols` | — | 9 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--smg` | `#FFD23F` | 2 | **PORTAL** | ports as is |
| `--stage-h` | — | 2 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--staged` | `#D8F24A` | 66 | **PORTAL** | ports as is |
| `--stem` | — | 1 | **PORTAL** | ports as is |
| `--sunk` | `#0B0F12` | 314 | **PORTAL** | ports as is |
| `--sv` | — | 5 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--sw` | — | 3 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--sx` | `50%` | 2 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--sy` | `50%` | 2 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--t` | — | 1107 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--t-att-code` | `30px` | 3 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`30px`** — port as a literal or a Session-4 token name, never as `var(--t-att-code, fallback)` |
| `--t-base` | `13px` | 96 | **PORTAL** | ports as is |
| `--t-code-warn` | `20px` | 3 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`20px`** — port as a literal or a Session-4 token name, never as `var(--t-code-warn, fallback)` |
| `--t-display` | `44px` | 9 | **PORTAL** | ports as is |
| `--t-epic` | `#C0A3D4` | 3 | **PORTAL** | ports as is |
| `--t-epic-edge` | `rgba(142,107,166,.4)` | 1 | **PORTAL** | ports as is |
| `--t-epic-wash` | `rgba(142,107,166,.18)` | 1 | **PORTAL** | ports as is |
| `--t-figure` | `34px` | 6 | **PORTAL** | ports as is |
| `--t-h1` | `22px` | 7 | **PORTAL** | ports as is |
| `--t-hero` | `26px` | 2 | **PORTAL** | ports as is |
| `--t-img-x` | `30px` | 3 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`30px`** — port as a literal or a Session-4 token name, never as `var(--t-img-x, fallback)` |
| `--t-lg` | `16.5px` | 28 | **PORTAL** | ports as is |
| `--t-md` | `14.5px` | 67 | **PORTAL** | ports as is |
| `--t-micro` | `9.5px` | 242 | **PORTAL** | ports as is |
| `--t-mythic` | `#E254DE` | 3 | **PORTAL** | ports as is |
| `--t-mythic-edge` | `rgba(226,84,222,.35)` | 1 | **PORTAL** | ports as is |
| `--t-mythic-wash` | `rgba(226,84,222,.15)` | 1 | **PORTAL** | ports as is |
| `--t-n-w` | `20px` | 1 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`20px`** — port as a literal or a Session-4 token name, never as `var(--t-n-w, fallback)` |
| `--t-pl` | `30px` | 1 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`30px`** — port as a literal or a Session-4 token name, never as `var(--t-pl, fallback)` |
| `--t-pr` | `16px` | 1 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`16px`** — port as a literal or a Session-4 token name, never as `var(--t-pr, fallback)` |
| `--t-rail` | `9px` | 1 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`9px`** — port as a literal or a Session-4 token name, never as `var(--t-rail, fallback)` |
| `--t-sm` | `12px` | 395 | **PORTAL** | ports as is |
| `--t-w-att` | `30px` | 1 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`30px`** — port as a literal or a Session-4 token name, never as `var(--t-w-att, fallback)` |
| `--t-warn-img` | — | 2 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`18px`** — port as a literal or a Session-4 token name, never as `var(--t-warn-img, fallback)` |
| `--t-xl` | `19px` | 11 | **PORTAL** | ports as is |
| `--t-xs` | `10.5px` | 221 | **PORTAL** | ports as is |
| `--tap` | `44px` | 68 | **PORTAL** | ports as is |
| `--tc` | — | 38 | **PORTAL** | ports as is |
| `--th-in` | — | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--tier-best` | `#F2C230` | 1 | **PORTAL** | ports as is |
| `--tink` | — | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--tint-hover` | `9%` | 4 | **PORTAL** | ports as is |
| `--tint-lift` | `14%` | 2 | **PORTAL** | ports as is |
| `--title` | `"Instrument Serif",Georgia,"Times New Roman",serif` | 2 | **PORTAL** | ports as is |
| `--topic-accent` | — | 5 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--tr-display` | `-.028em` | 2 | **PORTAL** | ports as is |
| `--tr-fig` | `.004em` | 3 | **PORTAL** | ports as is |
| `--tr-figure` | `-.02em` | 1 | **PORTAL** | ports as is |
| `--tr-h1` | `-.015em` | 11 | **PORTAL** | ports as is |
| `--tr-micro` | `.1em` | 53 | **PORTAL** | ports as is |
| `--tr-title` | `-.006em` | 1 | **PORTAL** | ports as is |
| `--tx` | — | 10 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--tx1` | `14%` | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--tx2` | `68%` | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--tx3` | `44%` | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--ty1` | `38%` | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--ty2` | `64%` | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--ty3` | `12%` | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--ui` | `"Space Grotesk",-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,` | 412 | **PORTAL** | ports as is |
| `--v-code` | `8px` | 2 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`8px`** — port as a literal or a Session-4 token name, never as `var(--v-code, fallback)` |
| `--v-group` | `20px` | 1 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`20px`** — port as a literal or a Session-4 token name, never as `var(--v-group, fallback)` |
| `--v-head-h` | `44px` | 1 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`44px`** — port as a literal or a Session-4 token name, never as `var(--v-head-h, fallback)` |
| `--v-head-row` | `12px` | 1 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`12px`** — port as a literal or a Session-4 token name, never as `var(--v-head-row, fallback)` |
| `--v-row-h` | `44px` | 3 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`44px`** — port as a literal or a Session-4 token name, never as `var(--v-row-h, fallback)` |
| `--v-tag` | `18px` | 1 | **JS-ONLY · L1 lab** | stamped on `:root` by the L1 lab (`gates/armory.js:1142`); his saved `spacing/list` value is **`18px`** — port as a literal or a Session-4 token name, never as `var(--v-tag, fallback)` |
| `--v2-accent` | — | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--warn` | `#FF7A45` | 371 | **PORTAL** | ports as is |
| `--warn-ink` | `#FF9E72` | 103 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--win-06` | `rgba(31,138,94,.06)` | 1 | **PORTAL** | ports as is |
| `--win-10` | `rgba(31,138,94,.10)` | 1 | **PORTAL** | ports as is |
| `--win-12` | `rgba(31,138,94,.12)` | 1 | **PORTAL** | ports as is |
| `--win-18` | `rgba(31,138,94,.18)` | 1 | **PORTAL** | ports as is |
| `--win-20` | `rgba(31,138,94,.20)` | 1 | **PORTAL** | ports as is |
| `--win-45` | `rgba(31,138,94,.45)` | 2 | **PORTAL** | ports as is |
| `--xf-dur` | — | 3 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--xf-ease` | — | 4 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--xf-fh` | — | 3 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--xf-fr` | — | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--xf-nl` | — | 2 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--xf-ns` | — | 5 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--xf-nt` | — | 5 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--xf-nw` | — | 4 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--xf-pb` | — | 2 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--xf-pt` | — | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--xf-rest` | — | 3 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--xf-ts` | — | 2 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--xf-tx` | — | 2 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--xf-ty` | — | 4 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--xtop` | — | 2 | **COMPONENT** | set by the rule that uses it; ports with that rule |
| `--z` | — | 1 | **COMPONENT** | set by the rule that uses it; ports with that rule |
