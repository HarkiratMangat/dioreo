---
kind: rule
status: live
paths:
  - "portal/ui/**"
  - "portal/fixtures/**"
  - "scripts/portal*"
---

# Editing the portal — the traps that only matter once you are IN the file

*Created 2026-09-01. **This carries the traps, NOT the procedure.** The procedure (order of operations, close conditions, the approval boundary) is in the Part's own prompt, because a path-scoped rule fires when you read a matching file and a session's first ten calls are `git log`, a build, `preview_start`, `portal:status` and three audits — none of which reads one. **A rule that arrives at triage cannot carry what is needed at turn zero, and a rule that duplicates the prompt is the disagreeing-repetition defect three cold readers named seven times in one day.** One home per fact.*

> 🔴 **⚠️ THIS RULE MAY RARELY FIRE, AND THAT IS A MEASURED TENSION IN THIS REPO'S OWN CONVENTIONS, NOT A COMPLAINT.** Path-scoped rules load when Claude READS a matching file. The working contract mandates that multi-site edits go through ONE `python3` heredoc — and a heredoc opens the file in a subprocess, which is not a Read. **So the more faithfully a session follows the batching discipline, the less likely this rule reaches it.** Measured once, on 2026-09-01: a session edited `portal/ui/app.css`, `manifest.js` and `broadcast.js` repeatedly through heredocs and `sed`, and no portal-adjacent rule ever appeared in its context — while `plan-drafting.md` DID appear, attached to a `Read` of a plan file. One session is one data point. **Falsifier: deliberately `Read` a `portal/ui` file at the start of a portal session and report whether this rule arrives.** If it does not, the honest conclusion is that `CLAUDE.md`'s navigation map advertises thirteen rules as *"load automatically when you touch matching code"* while touching-by-heredoc does not count — which would explain why portal traps keep being re-learned in-session and re-written into the plan instead of arriving from the rule that already held them.

## The five that have each cost real time

| Trap | What it does | The move |
|---|---|---|
| **A backtick inside an HTML comment inside a template literal** | An ODD number breaks the parse and `node --check` catches it. An **EVEN** number closes and reopens the literal — the file parses, every gate goes green, and the page renders wrong | Say the character's name in words. `npm run portal:template-comments` is the only thing that sees it |
| **htm drops a whitespace-only text node that spans a newline** | Renders `otherwise atcreatedAt` on screen while the source reads correctly — and every text comparison in this repo normalises whitespace, so nothing but the overlay can see it | Keep prose containing inline tags on ONE physical line, or end the line with `${' '}` |
| **A duplicate CSS selector is invisible to every gate** | Two rules, last one wins, nothing reports it | `rg -n '<class>' portal/ui/app.css` BEFORE writing a rule for it. Assert `count == 1` in the heredoc |
| **A class built from a lookup table** | `RANK_KEY` emitted `t-t3` against `.t-top3`; `PILL` emitted `stag`/`sched`/`exp`/`conf` against three defined classes. **Both shipped. Both sat in `portal/fixtures/reverse-orphans.json` as accepted debt** — a ratchet's baseline is by construction a list of things already agreed to live with | Read the baseline FILE, not the exit code. `portal:reverse-orphans --why <class>` — and ⚠️ its evaluator gives up at a nested parenthesised ternary and reports those classes as emitted by nothing |
| **A filled style whose ink is a fixed colour** | `--on-accent` is near-black: right on a light fill, **2.86:1 on a dark one**. The design computes `inkOn()` per surface at runtime; this tree does not | Any new `.stt`/`.bar`/`.bdg` state must state which fill it is for. See `docs/db-deferred-list.md`'s open entry |

## Two conventions that are not obvious from the code

- 🔴 **A conform CSS rule must NEVER change an element's class SIGNATURE** — the audit's LCS walk pairs on tag+classes, so an added class desynchronises every node beneath it and the instrument reports differences it created. Use a data attribute (`main[data-modal]`).
- ⚠️ **`portal/public/` is BUILD OUTPUT and is gitignored.** Sources are `portal/ui/`. Nothing in `portal/public` is ever edited, and it does not exist in a fresh clone until `node -e "require('./scripts/buildPortal').build()"` runs — which is why the build precedes starting the harness server, not the other way round.

## 🔴 THE WRITE GOES IN THE LOOP, NOT AFTER IT (measured twice, 2026-09-01)

The batching contract mandates one `python3` heredoc for N edits, with `assert <anchor> in s` before each replacement and a `print()` per edit. **Written the obvious way it silently discards work:**

```python
for each edit:  assert anchor;  s = s.replace(...);  print(label)
io.open(p,'w').write(s)          # ← ONE call, AFTER the loop
```

An assert on edit 5 raises before that write, so edits 1–4 are lost **after printing that they landed**. It happened twice in one session on `portal/ui/access.js` and `ANALYTICS-PROMPT.md`; the first time the built asset still carried the old markup two instrument runs later, which reads as *"the build is not picking up my change"* rather than *"the edit never landed"*.

**Write inside the helper, once per edit** — read, assert, replace, write, print. It costs nothing, and it makes a partial batch a partial success instead of a total loss reported as a success. If you keep a single trailing write, the `print()`s are not the receipt: `rg` the new anchor in the source **and** in `portal/public/ui/<realm>.js` before believing them.
