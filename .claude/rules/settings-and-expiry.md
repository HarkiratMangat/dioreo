---
paths:
  - "commands/settings.js"
  - "utils/passiveExpiry.js"
---

# `/settings` — author-lock, passive idle-timeout, admin override

*Loads when you touch `commands/settings.js` or `utils/passiveExpiry.js`. The per-user panel locks
(also covering View Colors / `/colors`). The `/manage` admin-only guard is separate —
`.claude/rules/manage-panel.md`. Accent-style options: `.claude/rules/accent-and-colors.md`. The
`/settings` 2-page layout + region-mode history: `docs/reference/design-history.md`.*

## Panel interaction locks — `/settings` (author-lock + passive idle auto-disable)
Original gap (2026-07-14): `/settings` had NO author-lock on some components (`set_page_` carried no
`userId`) and no expiry mechanism existed anywhere in the bot. (`/manage`'s own separate admin-only
guard is documented in `.claude/rules/manage-panel.md`.)
- **`/settings` fix (original, 2026-07-14): author-lock via `|userId` on every custom_id**, plus a
  REACTIVE expiry (a deadline value encoded as a further pipe segment, checked on click, replying
  "run `/settings` again" if stale). **⚠️ The expiry HALF of this is SUPERSEDED (2026-07-18) — see
  the "Passive idle-timeout auto-disable" subsection right below.** The author-lock (`|userId`,
  checked in every `toggle_`/`set_`/`set_page_`/`colors_view` handler) is UNCHANGED and still exactly
  as described here; only the expiry mechanism was replaced. `set_page_` also needed a real fix of its
  own at the time: its custom_id used to be a bare `set_page_{N}` with no pipe segments at all, so
  adding `|userId` required switching its parsing from a blind `.replace('set_page_', '')` to a proper
  `.split('|')` — that part is also unchanged.

### Passive idle-timeout auto-disable (2026-07-18) — replaces `/settings`' old reactive expiry
The reactive design above could only ever reply "this panel expired" AFTER a stale click already
failed — the buttons themselves stayed visually live forever, since Discord genuinely CAN'T disable a
message with zero interaction at all (see `docs/reference/known-issues.md` (button-expiry mechanics),
which this section makes concrete). Replaced with a real passive mechanism: `utils/passiveExpiry.js`'s
`schedulePanelExpiry(interaction, messageId, components)`.
- **Mechanism**: every render of `/settings` — the initial slash-command invocation AND every
  button/select re-render — ends by calling `schedulePanelExpiry` with THAT interaction's own token
  (each interaction gets its own fresh ~15-minute token, confirmed via Discord's docs and this
  session's own corrected investigation — see "Known open issues"). It holds a `setTimeout(10 min)`
  per messageId in an in-memory `Map`; any later interaction on the same message cancels the pending
  timer and reschedules fresh from ITS OWN token — a genuine **sliding idle window**, not a fixed
  deadline anchored to creation (the OLD design's explicit choice, now inverted on purpose). If 10
  straight minutes pass with no interaction, the timer fires entirely on its own and PATCHes
  `@original` directly (same raw-REST pattern `sendV2Payload` already uses, bypassing the normal
  interaction-reply lifecycle) to recursively walk the message's Components V2 tree and set
  `disabled: true` on every button (type 2) and select (type 3) — no error message, the panel just
  goes visibly dead. 10 minutes was chosen as a plain self-imposed UX window, comfortably inside the
  ~15-minute token ceiling; it is NOT derived from any Discord-side limit.
- **No `fetchReply()` needed even on the very first render** (unlike `dynamicProfile`'s message-id
  caching, which hit exactly this problem — see `.claude/rules/accent-and-colors.md`) — `sendV2Payload`'s
  underlying `rest.patch()` call already returns the PATCHed message's own JSON body, so
  `settings.js` just reads `sentMessage.id` straight off its own send call.
- **Every `|{expiresAt}` custom_id segment was removed** (`toggle_*`, `set_*`, `set_page_`,
  `colors_view` all dropped their trailing segment) along with the 4 reactive
  `Date.now() > parseInt(expiresAtStr, 10)` checks in `index.js` — Discord itself now refuses a click
  on an actually-disabled button, so there's nothing left for a reactive check to catch. The author-
  lock `|userId` segment is untouched on all of them.
- **Scoped to `/settings` only, on purpose** — the roadmap's "extend expiry checks to more commands"
  item (draws/calendar/drawprices/loadouts have none at all) is still open; this is the first
  implementation, not a bot-wide change. The standalone View Colors panel (opened via `colors_view`)
  still has NO timeout of its own (Harkirat's explicit "`/settings` only" call, unchanged) — it's
  unaffected either way since it's a separate message.
- **In-memory only, keyed by messageId** — a bot restart mid-countdown just loses that one pending
  timer (the panel silently stays clickable a bit longer than intended, never shorter, and the next
  genuine `/settings` render re-arms it normally). Accepted at this scale per Harkirat's explicit call,
  not worth a persistent store for a 10-minute UX nicety.

### Admin override on the per-user panel locks (2026-07-18, v2 quick-wins batch)
Harkirat (`ALLOWED_ADMIN_ID`) was getting the same "not your panel" denial as any random third party
the moment he clicked a component on someone else's `/settings` or View Colors message (e.g. one made
public via Show Everyone, or while investigating a live bug report) — every one of the 7 per-user
author-lock sites (`toggle_`, generic `set_`, `set_page_`, `colors_view`, `colors_page_`,
`colors_subpage_`, `colors_refresh_`) checked `interaction.user.id !== targetUserId` with no exception.
**`/manage`'s own admin-only guard needed no change at all** — it already only ever lets
`ALLOWED_ADMIN_ID` through, there's no "someone else's panel" concept for a single shared admin panel.
- **The critical constraint (Harkirat's explicit spec): the override must NOT swap in Harkirat's own
  data.** Every one of these panels is already keyed by whichever discordId is embedded in the
  custom_id (`targetUserId`) for DB reads/writes, but several call sites downstream also re-derive that
  same person's LIVE profile data straight off `interaction.user` (avatar/banner URL, username,
  createdAt — `settings.js`, `utils/colorPalette.js`'s `getSourceImageInfo`) — simply relaxing the
  identity check to `!== targetUserId && !== ALLOWED_ADMIN_ID` without also fixing what `.user` resolves
  to would have silently rendered Harkirat's own avatar/banner/prefs on someone else's panel the moment
  he clicked through.
- **Fix: `index.js`'s new `resolvePanelActor(interaction, targetUserId)`** returns the discord.js User
  object callers should treat as "whose data is this" — `interaction.user` unchanged for the normal
  same-user case, a fresh `interaction.client.users.fetch(targetUserId)` (never cached/guessed) when
  Harkirat is overriding someone else's panel, or `null` to deny a genuine non-admin. Callers only build
  a synthetic interaction (via the existing `buildSyntheticInteraction`, overriding just `.user`) when
  the returned user differs from `interaction.user` — the ordinary same-user path is completely
  unchanged, zero extra overhead. `deferReply()`/`deferUpdate()`/`sendV2Payload()` all stay on the REAL
  interaction throughout (they only need token/applicationId, identical either way) — only the calls
  that actually read `.user` to decide whose data to show (`settingsCommand.execute(...)`,
  `getPalettePanelData(...)`, `avatarThumbnailUrl`) get the swapped-user synthetic.
- **Every "action blocked" denial message was reworded the same session** (bundled in since it's the
  same code) — clearer, a little lighter, and says what to do instead, e.g. `/manage`'s admin-only guard
  now reads "🔒 **This one's admin-only.** ... try any of the bot's public commands instead!" and the
  `/settings`/View Colors locks read "🔒 **Not your dashboard!** ... run `/settings` yourself" /
  "🔒 **Those aren't your colors!** Run `/colors` ...". Deliberately light, not the "bully broke people"
  gag (that's still reserved for its own future personality pass, see `docs/ROADMAP.md`) — this
  was just a plain clarity/tone pass.
