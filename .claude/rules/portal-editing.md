---
kind: rule
status: live
paths:
  - "portal/ui/**"
  - "portal/fixtures/**"
  - "scripts/portal*"
  - "docs/superpowers/mockups/2026-08-23-portal-interactive/**"
---

# Editing the portal — the traps that only matter once you are IN the file

*Created 2026-09-01. **This carries the traps, NOT the procedure.** The procedure (order of operations, close conditions, the approval boundary) is in the Part's own prompt, because a path-scoped rule fires when you read a matching file and a session's first ten calls are `git log`, a build, `preview_start`, `portal:status` and three audits — none of which reads one. **A rule that arrives at triage cannot carry what is needed at turn zero, and a rule that duplicates the prompt is the disagreeing-repetition defect three cold readers named seven times in one day.** One home per fact.*

> 🔴 **⚠️ THIS RULE MAY RARELY FIRE, AND THAT IS A MEASURED TENSION IN THIS REPO'S OWN CONVENTIONS, NOT A COMPLAINT.** Path-scoped rules load when Claude READS a matching file. The working contract mandates that multi-site edits go through ONE `python3` heredoc — and a heredoc opens the file in a subprocess, which is not a Read. **So the more faithfully a session follows the batching discipline, the less likely this rule reaches it.** Measured once, on 2026-09-01: a session edited `portal/ui/app.css`, `manifest.js` and `broadcast.js` repeatedly through heredocs and `sed`, and no portal-adjacent rule ever appeared in its context — while `plan-drafting.md` DID appear, attached to a `Read` of a plan file. One session is one data point. **Falsifier: deliberately `Read` a `portal/ui` file at the start of a portal session and report whether this rule arrives.** If it does not, the honest conclusion is that `CLAUDE.md`'s navigation map advertises thirteen rules as *"load automatically when you touch matching code"* while touching-by-heredoc does not count — which would explain why portal traps keep being re-learned in-session and re-written into the plan instead of arriving from the rule that already held them.

> 🔴 **THE MOCKUP PACKAGE IS IN SCOPE AS OF 2026-09-03 00:22 EDT, AND IT WAS NOT BEFORE — WHICH IS HOW ITS OWN TRAP CLASS BIT IN A FILE THIS RULE COULD NOT REACH.** The globs were `portal/ui/**`, `portal/fixtures/**`, `scripts/portal*`. The design package holds the OTHER half of every conformance edit, and a session that edits `review.html` four times gets no rule at all. Measured the same night: a slice-based deletion in `review.html` left a stray `};`, the whole mockup script died at parse time, and `portalDiff` reported a confident 5.7% with `main` and `nav.rail` as its top regions — which is what a dead page looks like to an instrument that cannot tell. **Parse-check the mockup after every edit:** `new Function(scriptBody)` over what is between its `<script>` tags costs nothing and catches exactly this.

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

## 🔴 BOTH SIDES READ THE SAME FIXTURE FILE — so a data difference is NOT the default explanation

`portal/ui/harness/stub.js:67` is `const F_ = window.FIX` — **the mockup's own `docs/superpowers/mockups/2026-08-23-portal-interactive/assets/fixtures.js`**. The harness does not carry a second copy of the data; it reads the design's. So when a number differs between the two pages, "the fixtures disagree" is usually the wrong first hypothesis, and the render is the right one.

**The exception is real and it is documented in the stub itself:** `foldByCommand()` folds command+subcommand rows to production's `$group by command`, which the mockup's `cmds()` does not do. That makes a per-command COUNT divergence **correct** on Analytics — `.ub2`, `.durrow` and every per-command signature — and "fixing" the stub to stop folding reintroduces the >100%-share defect its own comment records. ⚠️ Same shape as the announcement cap `?fresh=1` exists for: a deliberate demo override, not a bug.

## 🔴 THE WRITE GOES IN THE LOOP, NOT AFTER IT (measured twice, 2026-09-01)

The batching contract mandates one `python3` heredoc for N edits, with `assert <anchor> in s` before each replacement and a `print()` per edit. **Written the obvious way it silently discards work:**

```python
for each edit:  assert anchor;  s = s.replace(...);  print(label)
io.open(p,'w').write(s)          # ← ONE call, AFTER the loop
```

An assert on edit 5 raises before that write, so edits 1–4 are lost **after printing that they landed**. It happened twice in one session on `portal/ui/access.js` and `ANALYTICS-PROMPT.md`; the first time the built asset still carried the old markup two instrument runs later, which reads as *"the build is not picking up my change"* rather than *"the edit never landed"*.

**Write inside the helper, once per edit** — read, assert, replace, write, print. It costs nothing, and it makes a partial batch a partial success instead of a total loss reported as a success. If you keep a single trailing write, the `print()`s are not the receipt: `rg` the new anchor in the source **and** in `portal/public/ui/<realm>.js` before believing them.


## The four ORDERING traps — added 2026-09-03 22:32 EDT, Part 6b

Each one cost a wasted verification round, and none is visible from the file you are editing.

**1 · `portal:bust` runs AFTER `reflow-comments --write`, never before.** The reflow rewrites comments inside the mockup package's own `docs/superpowers/mockups/2026-08-23-portal-interactive/assets/shell.js`, which invalidates the `?v=` stamp the bust just wrote — so the sequence bust → reflow leaves `portal:refs` red with *"modified after its stamp"*, and the two warnings it prints alongside (*"1 page with a syntax error"*, *"1 identifier called but never declared"*) are the stale-stamp path reading an old file, not real defects. Two rounds were lost to reading them as real.

**2 · `portalGeometry --realm <r> --write` runs LAST, immediately before the commit.** It records the CURRENT tree; every edit after it invalidates it again. Re-recording when the check first complains and then continuing to edit produces a fixture that is already stale when it is committed — and `npm test` fails on it two runs later, which reads as a new defect.

**3 · A backgrounded `npm test > log 2>&1; echo "exit=$?"; tail log` EXITS 0 WHATEVER THE SUITE DID.** A compound command exits with its LAST command, so the trailing `echo` and `tail` succeed and the harness reports *"completed (exit code 0)"* for a failing suite. **Read the recorded `exit=` line out of the task's own output file.** A commit message shipped on this branch claiming a green suite that had exited 1. It is [[feedback_pipe_masks_exit_status]] in a shape that memory does not name.

**4 · A `git commit -F - <<'MSGEOF'` nested inside a `python3 - <<'PYEOF'` command line feeds the commit message to PYTHON.** Bash reads heredocs in the order the redirections appear, not the order the commands run. Keep a scripted edit and its commit in two calls, or write the message to a file first.

⚠️ **And an assert is scoped to the EDIT, not to the file.** Asserting that a short declaration is absent from a 5,000-line stylesheet fails on any unrelated rule that happens to end the same way. Assert the exact text you removed, and assert a SURVIVOR beside it.
