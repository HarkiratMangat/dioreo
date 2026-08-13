---
kind: rule
status: live
paths:
  - "commands/server.js"
  - "utils/guildPolicy.js"
  - "models/GuildSettings.js"
  - "utils/ephemeral.js"
  - "utils/shareButton.js"
---

# `/server` — the server-admin response-visibility policy

*Loads when you touch `commands/server.js`, `utils/guildPolicy.js`, `models/GuildSettings.js`, `utils/ephemeral.js` or `utils/shareButton.js`. Shipped on the v3 line 2026-08-10 15:55 EDT, as the launch blocker for the guild install. Full design + the rejected alternatives: `docs/superpowers/specs/2026-08-10-server-admin-visibility-policy-design.md`. The per-USER side of visibility is `.claude/rules/settings-and-expiry.md`; Harkirat's own owner-level panel is `.claude/rules/manage-panel.md`.*

## The one-line model

**A server can quiet the bot. It can never make someone louder than they chose to be.** An `ephemeral` verdict is a ceiling that overrides both the `visibility` command option and the saved `UserPreference`. A `public` verdict is only a *permission* — the user's own choice still decides. So a server rule never rewrites a personal preference, it only constrains where and how loudly the bot speaks.

## 🚫 Nothing here refuses a command, and that is a PLATFORM limit

Do not "finish" this feature by adding a refusal path. **A bot cannot hide a global slash command inside one guild.** Guild-scoped registration does not delete global commands — Discord merges both sets, so omitting a command from a guild's list leaves the global one visible. The only native mechanism that removes one command in one server is application command permissions, which can only be written with an **OAuth2 bearer token from a MANAGE_GUILD user**; the bot cannot set them for itself.

Admins already hold the real levers natively, **per role and per channel** (measured by Harkirat 2026-08-10 15:38 EDT): disabling **Use Application Commands** removes every slash command from every app, and disabling **Use External Apps** forces app output to ephemeral.

⚠️ **"Use External Apps" governs a GUILD-INSTALLED app too — measured 2026-08-10 18:04 EDT, and it refutes the premise this feature was originally sized on.** The design assumed a guild-installed bot is not "external", so admins would lose that lever in exactly the configuration v3 launches. They do not. Harkirat re-ran the test in 𝔇𝔯𝔢𝔞𝔪𝔩𝔞𝔫𝔡 with a member who does **not** have Dioreo (Dev) user-installed — the invocation could therefore only come from the guild-installed copy — and disabling the permission for the channel forced `/colors` ephemeral. **So this feature's channel and role tiers duplicate, in shape, a native per-role/per-channel overwrite Discord already ships.**

**Two things justify it, and they are narrower than the records first claimed — do not restate the old sizing:**
1. **Per-app targeting.** The native lever is all-or-nothing: quieting Dioreo in a channel quiets *every* app there. `/server` quiets this bot alone.
2. **Per-command targeting.** Nothing native can force `/colors` ephemeral while `/help` stays public. `ephemeralCommands` is the only route to that, for guild- and user-installed invocations alike.

Because the tiers mirror a native mechanism, they deliberately mirror its **semantics** too — same-tier conflicts resolve to `public`, exactly as an explicit allow beats a deny in Discord's own role overwrites, so an admin's existing intuition transfers. **Before adding any tier here, check whether a native permission already expresses it**; the first three attempts at sizing this feature all overstated the gap, and the correction cost a full pass over six documents.

## Precedence — highest tier wins

0. **Admin bypass** — owner / `ADMINISTRATOR` / `MANAGE_GUILD` skip tier 1 and resolve from tier 2 down. Deliberately narrow: it exempts admins from the *command* rule only, never from channel or role rules, which they set for the whole server including themselves.
1. `ephemeralCommands` — a command named here is ephemeral, **above** channel and role rules
2. A role rule the member holds, scoped to this channel
3. A role rule the member holds, server-wide (`channelIds: []`)
4. A channel rule for this channel
5. `defaultVisibility` (`public` by default)

⚠️ **THREADS INHERIT THEIR PARENT CHANNEL'S RULE, and this is not optional.** In a thread `interaction.channelId` is the **thread's** id, so without inheritance a rule on `#general` silently stops applying the moment conversation moves into a thread of `#general` — failing **open**, in a feature whose entire job is to restrict, and threads are created continuously so an admin can never pre-empt them by listing each one. `parentChannelId` comes free from `interaction.channel.parentId` in the payload (no REST call, no intent). A rule on the **thread itself** still beats the inherited one. Channel-scoped *role* rules inherit identically, or the two tiers would disagree about what "in this channel" means. Covered by five named cases in the test — **no automated check in this repo could have found this**, because every other case passes `channelId` as an opaque string and cannot tell a thread id from a channel id.

**Same-tier conflict → `public`**, mirroring Discord's own role-overwrite semantics where an explicit allow beats a deny. Tier 1 only applies where a command name exists (chat-input and autocomplete); a button or select click skips it, which is correct — a component interaction edits a message whose ephemerality Discord fixed when it was first sent.

`resolveVisibility()` is a pure function and is covered by `scripts/guildPolicy.test.js`, wired into `npm test`. Every configuration Harkirat named while designing this is pinned there. **Extend that test before changing any tier** — half its cases exist only to catch a tier silently reordering another.

## ⚠️ Enforcement lives at TWO choke points, and NOT in the commands

The obvious design — make `resolveEphemeral()` policy-aware and pass the policy in — **was built and then removed.** `resolveEphemeral` is called by only nine commands: `/help`, `/timestamp`, `/colors` and the **eight per-category weapon commands built dynamically in `bot/registry.js`** never touch it. It would have become an optional argument at nine sites where *forgetting* it looks identical to passing it. The two choke points nothing routes around:

1. **`attachGuildPolicy()` wraps `reply` / `deferReply` / `followUp`** on the interaction when the verdict is `ephemeral`. Called once per interaction at the top of `handlers/router.js`'s `handleInteraction`, before the anti-spam guard. Same reasoning as `utils/logger.js`'s `patchConsole()`: one patch that cannot be forgotten beats a rule that must be remembered.
   - The wrapper **OR-s** the ephemeral bit into an existing numeric `flags` rather than replacing it — Components V2 sends pass `32768`, and dropping that renders a blank message.
   - It assigns **own enumerable** properties, so `buildSyntheticInteraction()` carries the clamp through to a button re-invoking a command's `execute()`. Without that, a panel would render clamped on first invocation and unclamped on every navigation click.
2. **`utils/sendV2Payload.js` strips the "Show Everyone" row** when `dioreoPolicy.allowShare === false`. That button does not edit the ephemeral message — it posts a **brand new, genuinely public one**, so leaving it live under an ephemeral rule is a one-click bypass. `handlers/share.js`'s `share_public` handler re-checks server-side too, because a panel opened *before* the rule was set still has the button on it.

## Other things already paid for

- **The admin check costs zero REST calls.** `interaction.memberPermissions` carries Discord's computed permissions, so `isServerAdmin()` reads the payload. **No `GUILD_MEMBERS` intent** — that gates *enumerating* members, which this never does. `memberRoleIds()` handles both shapes: a real `GuildMember` (`roles.cache`) and a raw `APIInteractionGuildMember` (`roles` as an id array), the latter being the norm for a user-installed invocation in a server the bot has not joined.
- **`setDefaultMemberPermissions(ManageGuild)` on `/server` is NOT the gate.** Discord ignores it for user-installed invocations — exactly the case this feature covers — so `execute()` and `handleComponent()` both re-check for real. The field is there only to keep the command out of ordinary members' pickers where the bot *is* guild-installed.
- **`client.gateableCommandNames` is built in `index.js` from the `commands` array that is about to be registered**, not from `client.commands` or a readdir of `commands/*.js` — both of those miss the eight weapon commands and `all`. A hand-maintained list would go stale the first time a command is added.
- **A null settings lookup is cached deliberately.** The common case is a server with no rules at all; caching only the hits would leave exactly that case hitting Mongo on every interaction. Writes go through `updateGuildSettings()`, which invalidates in the same place it mutates.
- **`GuildSettings.updatedBy` is a Discord user ID and therefore personal data** — disclosed in `docs/legal/PRIVACY.md` §2.1a and Appendix A. ⚠️ `docs-audit`'s `privacy-model-coverage` did not catch this on its own: its heuristic was the three literal names `discordId`/`userId`/`user_id`, so it reported a **vacuous pass** while the new model went unexamined. The heuristic was widened to include actor fields in the same change. If you add a model, do not read that check's green as proof of disclosure.
