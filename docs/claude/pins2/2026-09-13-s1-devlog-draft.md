---
kind: record
status: frozen
---

Session 1 of the second pin batch built the identity layer, split History out of Analytics, reworked the shell chrome, and ran two agents for the backend and data work that needed no live page. It followed `docs/superpowers/plans/2026-09-13-portal-pins-batch-2.md` §3 and the frozen spec.

**Colour.** Every realm accent moved except Analytics. History got its own cyan, and Review got a real accent for the first time, which overturns the old rule that Review stays colourless. `--staged` became Review's lime. `--ok` became a green that confirm buttons now fill with, so Commit, Save and Grant take the colour of the state they produce. The 76 staged consumers were sorted one by one instead of find-and-replaced. Focus rings map to `--focus`, which keeps the old cyan and its contrast, so no outline got fainter.

**History.** The event river, its filters, its drawer and revert moved whole into `portal/ui/history.js`. Analytics' Health tiles and level rows used to filter the river on the same page. Routing matches the hash exactly, so the filter now reaches History through sessionStorage. Nine ledger rows moved with the river, and a baselined temporal-dead-zone entry was fixed during the move instead of being carried over.

**Shell.** The crumb is gone, and the five ledger rows that cited it were retired. The command bar is centred on the header. The palette pin did not reproduce: the arrow keys, Enter and Escape already worked. What was missing was `aria-activedescendant`, so a screen reader heard none of it. Sign-out now sits beside the profile as an icon, and the account menu wears the avatar mesh from the Access drawer.

**Access.** Revoke now confirms inside the Edit drawer, the way Save does, instead of stacking a second drawer. The typed-id gate is unchanged. Session rows name the browser and OS. That was proven on the signed-in dev portal with two real user-agent strings, because the harness fixture was already readable and hid the defect.

**Seeded data.** `scripts/seedAnalyticsTraffic.js` wrote 30 days of traffic into the dev database, so Usage, Timing, Reach and Search can finally be judged with data in them.

**The think-pass before the merge.** Asked to falsify the session rather than review it, the pass found work that every gate had passed: a Review sentence pointing at Analytics for undo, three staged surfaces still glowing the old cyan through alias tokens a search for `var(--staged)` could not see, a seed that would have left fake roll-ups behind, a modal label sitting exactly on Discord's 45-character limit, ledger rows made false by agent B's new predicate, and design records describing the portal as it was. The account-menu tint had never been seen working until a session with a real avatar hash was minted for it. Harkirat had to push for that pass twice.

### Lessons

- A pin can name a symptom that the code no longer has. Reproduce it before fixing, or the session rebuilds a working key handler.
- Moving code between files moves its baselined findings too. The ratchet reports the entry as new in one file and fixed in the other, so fix it during the move.
- A harness session with no avatar cannot show an avatar tint. When the fixture cannot reach a state, split the proof into the rule painting and the hook firing somewhere it can.
- A gate asks whether the thing you changed landed. The think-pass has to ask what else READS the thing you changed: here that was an alias token, a predicate's other surface, a copy line, a Discord limit and a session field.
