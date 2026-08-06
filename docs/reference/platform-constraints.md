# Platform constraints — things the platform will not currently let us do

*Read on demand, and before concluding that something "can't be done."*

## What this file is, and what belongs in it

This file holds **accepted constraints imposed from outside this codebase** — Discord's Components V2,
the Discord client's own rendering, and system-level dependencies. An entry here answers *"why is it
like that?"* with **"because the platform, not because we haven't got to it."**

**What does NOT belong here:**
- **Open bugs in our own code** → `docs/db-deferred-list.md`'s 🐞 Active Bugs section.
- **Work we've decided on but not built** → that same file's 🗂️ Queued or 🧹 Someday sections.
- **Design decisions we made freely** → `.claude/rules/design-decisions.md`.

The test is *whose* limitation it is. If a sufficiently determined session could fix it inside this
repo, it is not a constraint — it is work, and it belongs on a list that gets worked.

## ⚠️ These are NOT forever-constraints — re-test before citing one

**Harkirat's explicit point, and the reason this file was renamed rather than just tidied.** Every
entry below is a snapshot of what the platform allowed *on the date in the entry*. Discord ships
platform updates; a component type gains a property; a client limitation gets fixed; a feature changes
shape and stops needing the thing that was blocked.

So an entry here is **evidence, not a verdict**. Before using one as the reason something cannot be
done — especially before telling Harkirat a request is impossible — **re-test it against the current
platform** and update the entry with what you found and when. An entry that has never been re-checked
since it was written is a claim about the past being used to make a decision about the present.

The file's own history is the argument: the button-expiry entry below is here *because* a confident
"hard Discord platform wall" claim was made, pushed back on, and turned out to be wrong — twice in one
day. It is kept as a permanent refutation precisely so nobody re-derives the wrong version.

---

*Renamed from `known-issues.md` 2026-08-06 08:13 EDT, after splitting the genuine open defects out to
`docs/db-deferred-list.md` (the `patchnotes.js` chunking gap → 🐞 Active Bugs; the pagination
double-round-trip investigation and its agreed hybrid fix → 🧹 Someday). The old name had become a lie
on the tin: most of what it held were facts, not defects. Originally moved out of `CLAUDE.md`
2026-07-22 13:27 EDT; the root nav map points here.*

---

- **View Colors panel's vertical centering is unsolved.** Discord's Components V2 has no native
  vertical-align control for a Section's text relative to its accessory; a blank-emoji-line
  workaround was tried and reverted after it looked wrong on mobile. Purely cosmetic, no functional
  impact — see `.claude/rules/accent-and-colors.md` for the full history.
- **Deco page renders as a static poster, not animated**, even though its thumbnail points at the
  real animated decoration URL — confirmed a genuine Discord-client limitation (needs a manual tap
  to animate in this context), not a bug in this bot's own code. The real fix (re-encoding APNG to
  GIF via ffmpeg on every render, since GIFs DO autoplay inline) was deliberately not built — real
  per-render latency for a cosmetic nicety Harkirat said he's fine leaving static. Nameplate's own
  animated `.webm` was tried in its place for the same reason and reverted for the same tap-to-play
  limitation; that plumbing (`nameplateAnimatedUrl`) was removed rather than left dead.
- **`ffmpeg` is a real system dependency** (not an npm package — must be on `PATH`) for
  `utils/stillFrame.js`: View Colors' decoration extraction and `'dynamicProfile'`'s decoration source.
  **Largely RESOLVED — updated 2026-07-28 01:41 EDT.** This entry used to warn it was "not guaranteed on
  Render/Railway's production containers." **Both hosts are retired** — the bot has run on the GCP VM
  since the 2026-07-17 cutover, and Render was deleted in v2.35.14. Unlike an opaque container, the VM
  is provisioned explicitly and **`ffmpeg` is listed among its installed packages** (see
  `docs/reference/deployment-and-ops.md`). Kept as a flagged dependency only because it is still a
  *system* binary that a VM rebuild could omit: if decoration color extraction ever works locally but
  not live, check `ffmpeg` on the VM before assuming a code bug.
- **NOT a constraint — the standing refutation of one.** **CORRECTED 2026-07-18 (was wrong in an
  earlier same-day pass, caught when Harkirat pushed back):**
  physically disabling expired buttons IS achievable — do not reintroduce the earlier wrong claim that
  it's a hard Discord platform wall. What's actually true: **every button click is its OWN fresh
  interaction with its OWN fresh 15-minute token** — confirmed via Discord's docs and community sources,
  and consistent with the plain observed fact that draws/calendar/loadout pagination buttons (which have
  NO expiry check at all) keep working indefinitely no matter how old the message is. The 15-minute
  token lifetime applies to editing/following-up via ONE SPECIFIC interaction's own token — it does NOT
  mean a message becomes permanently uneditable after 15 minutes; each new click supplies its own valid
  token regardless of the message's age. **What this means for `/settings`' existing 15-minute expiry:
  that number is a self-imposed BUSINESS rule (Harkirat wanted settings changes to have a real
  freshness window), NOT derived from any Discord token limit** — the earlier claim that it "had to"
  be 15 minutes because of Discord's ceiling was incorrect; it could be any duration.
  **FURTHER CORRECTED same day, after this paragraph was first written:** the "only genuinely
  unavailable thing" claim (a fully proactive, zero-click update) was ALSO wrong — a scheduled
  `setTimeout` inside the bot process can hold an already-issued interaction token and fire a `PATCH`
  with it directly, entirely on its own, as long as it fires before that token's own 15-minute
  ceiling. No click, no channel-edit permission, no scheduled job outside the bot process needed —
  this is now BUILT for `/settings` (2026-07-18): see "Passive idle-timeout auto-disable" in the
  "Panel interaction locks" (see `.claude/rules/settings-and-expiry.md`) for the shipped mechanism (`utils/passiveExpiry.js`), which
  does exactly this. Still open: extending the same pattern to draws/calendar/drawprices/loadouts —
  tracked in **`docs/ROADMAP.md`** (the "Extending `utils/passiveExpiry.js`'s `schedulePanelExpiry` to
  their own render/re-render sites" item). *(Corrected 2026-07-28 01:41 EDT: this used to say "the
  roadmap item below," but nothing follows it — this was the last entry in the file, and the roadmap
  moved out to its own file on 2026-07-22.)*
