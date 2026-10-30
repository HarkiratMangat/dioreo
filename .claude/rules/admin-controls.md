---
kind: rule
status: live
paths:
  - "commands/admin.js"
  - "utils/guildPolicy.js"
  - "models/GuildSettings.js"
  - "utils/ephemeral.js"
  - "utils/shareButton.js"
---

# `/admin` — the server-admin response-visibility policy

*Loads when you touch `commands/admin.js`, `utils/guildPolicy.js`, `models/GuildSettings.js`, `utils/ephemeral.js` or `utils/shareButton.js`. Shipped on the v3 line 2026-08-10 15:55 EDT, as the launch blocker for the guild install. Full design + the rejected alternatives: `docs/superpowers/specs/2026-08-10-server-admin-visibility-policy-design.md`. The per-USER side of visibility is `.claude/rules/settings-and-expiry.md`; Harkirat's own owner-level panel is `.claude/rules/manage-panel.md`.*

## The one-line model

**A server can quiet the bot. It can never make someone louder than they chose to be.** An `ephemeral` verdict is a ceiling that overrides both the `visibility` command option and the saved `UserPreference`. A `public` verdict is only a *permission* — the user's own choice still decides. So a server rule never rewrites a personal preference, it only constrains where and how loudly the bot speaks.

## 🚫 Nothing here refuses a command, and that is a PLATFORM limit

Do not "finish" this feature by adding a refusal path. **A bot cannot hide a global slash command inside one guild.** Guild-scoped registration does not delete global commands — Discord merges both sets, so omitting a command from a guild's list leaves the global one visible. The only native mechanism that removes one command in one server is application command permissions, which can only be written with an **OAuth2 bearer token from a MANAGE_GUILD user**; the bot cannot set them for itself.

Admins already hold the real levers natively, **per role and per channel** (measured by Harkirat 2026-08-10 15:38 EDT): disabling **Use Application Commands** removes every slash command from every app, and disabling **Use External Apps** forces app output to ephemeral.

⚠️ **"Use External Apps" governs a GUILD-INSTALLED app too — measured 2026-08-10 18:04 EDT, and it refutes the premise this feature was originally sized on.** The design assumed a guild-installed bot is not "external", so admins would lose that lever in exactly the configuration v3 launches. They do not. Harkirat re-ran the test in 𝔇𝔯𝔢𝔞𝔪𝔩𝔞𝔫𝔡 with a member who does **not** have Dioreo (Dev) user-installed — the invocation could therefore only come from the guild-installed copy — and disabling the permission for the channel forced `/colors` ephemeral. **So this feature's channel and role tiers duplicate, in shape, a native per-role/per-channel overwrite Discord already ships.**

**Two things justify it, and they are narrower than the records first claimed — do not restate the old sizing:**
1. **Per-app targeting.** The native lever is all-or-nothing: quieting Dioreo in a channel quiets *every* app there. `/admin` quiets this bot alone.
2. **Per-command targeting.** Nothing native can force `/colors` private while `/help` stays public. A command's own settings (`commandSettings`, below) are the only route to that, for guild- and user-installed invocations alike.

Because the tiers mirror a native mechanism, they deliberately mirror its **semantics** too — same-tier conflicts resolve to `public`, exactly as an explicit allow beats a deny in Discord's own role overwrites, so an admin's existing intuition transfers. **Before adding any tier here, check whether a native permission already expresses it**; the first three attempts at sizing this feature all overstated the gap, and the correction cost a full pass over six documents.

## The per-command model — which rule set, then which rule (2026-10-22 18:42 EDT)

**Server settings cover every command; a command with its own settings uses only those.** Harkirat found the old single list of tiers confusing ("man idk, this is confusing ... build it out autonomously"), and a flat command tier could not express his own example (/calendar private everywhere except #a and #b, @test private in #a, @Power public everywhere, @Famila public in #c but private in #a). So a command can carry a whole rule set of its own: `GuildSettings.commandSettings[]`, one `{ command, defaultVisibility, channelRules, roleRules }` per command path. `commandEntry()` finds a command's set (its full path, then its bare name, which covers every subcommand); the legacy `ephemeralCommands[]` still reads as a set that is private everywhere.

Inside whichever set applies, the first that matches decides:

1. A role rule the member holds, scoped to this channel
2. A role rule the member holds, everywhere (`channelIds: []`)
3. A channel rule for this channel (a thread inherits its parent's, below)
4. That set's `defaultVisibility` (the server's is `public` by default; a new command set starts from the server's)

**Admin bypass:** the owner, `ADMINISTRATOR` and `MANAGE_GUILD` skip a command's own settings and resolve from the server's set. Deliberately narrow: they still follow the server's channel and role rules, which they set for everyone including themselves.

`explainVisibility()` returns the verdict with the tier that decided it, for Check a Member. His /calendar example is resolved from a stored record in `scripts/guildPolicyEnforcement.test.js`.

⚠️ **THREADS INHERIT THEIR PARENT CHANNEL'S RULE, and this is not optional.** In a thread `interaction.channelId` is the **thread's** id, so without inheritance a rule on `#general` silently stops applying the moment conversation moves into a thread of `#general` — failing **open**, in a feature whose entire job is to restrict, and threads are created continuously so an admin can never pre-empt them by listing each one. `parentChannelId` comes free from `interaction.channel.parentId` in the payload (no REST call, no intent). A rule on the **thread itself** still beats the inherited one. Channel-scoped *role* rules inherit identically, or the two tiers would disagree about what "in this channel" means. Covered by five named cases in the test — **no automated check in this repo could have found this**, because every other case passes `channelId` as an opaque string and cannot tell a thread id from a channel id.

**Same-tier conflict → `public`**, mirroring Discord's own role-overwrite semantics where an explicit allow beats a deny. A command's own settings apply only where a command name exists (chat-input, autocomplete, a right-click command); a button or select click resolves from the server's set, which is correct — a component interaction edits a message whose ephemerality Discord fixed when it was first sent.

`resolveVisibility()` is a pure function and is covered by `scripts/guildPolicy.test.js`, wired into `npm test`. Every configuration Harkirat named while designing this is pinned there. **Extend that test before changing any tier** — half its cases exist only to catch a tier silently reordering another.

## ⚠️ Enforcement lives at TWO choke points, and NOT in the commands

The obvious design — make `resolveEphemeral()` policy-aware and pass the policy in — **was built and then removed.** `resolveEphemeral` is called by nine commands (`/gunsmith`, `/colors`, `/settings`, `/draws`, `/draw prices`, the draw calculator, `/calendar`, `/patch notes`, `/season end`), plus `handlers/drawCalc.js` and `utils/loadoutLookup.js`; `/help` and `/timestamp` never call it. It would have become an optional argument at eleven sites where *forgetting* it looks identical to passing it. The two choke points nothing routes around:

1. **`attachGuildPolicy()` wraps `reply` / `deferReply` / `followUp`** on the interaction when the verdict is `ephemeral`. Called once per interaction at the top of `handlers/router.js`'s `handleInteractionInner` (wrapped by `handleInteraction`), before the anti-spam guard. Same reasoning as `utils/logger.js`'s `patchConsole()`: one patch that cannot be forgotten beats a rule that must be remembered.
   - The wrapper **OR-s** the ephemeral bit into an existing numeric `flags` rather than replacing it — Components V2 sends pass `32768`, and dropping that renders a blank message.
   - It assigns **own enumerable** properties, so `buildSyntheticInteraction()` carries the clamp through to a button re-invoking a command's `execute()`. Without that, a panel would render clamped on first invocation and unclamped on every navigation click.
2. **`utils/sendV2Payload.js` strips the "Show Everyone" row** when `dioreoPolicy.allowShare === false`. That button does not edit the ephemeral message — it posts a **brand new, genuinely public one**, so leaving it live under an ephemeral rule is a one-click bypass. `handlers/share.js`'s `share_public` handler re-checks server-side too, because a panel opened *before* the rule was set still has the button on it. ⏸️ The button is off bot-wide (`SHARE_BUTTON_ENABLED = false` in `utils/shareButton.js`, so no reply gets the row), which leaves the strip mattering only for panels posted before that and for the day it is switched back on.

## Two ceilings outside the panel

- **Rules apply only while Dioreo is in the server** (2026-10-22 17:05 EDT, Harkirat: "The whole point of like the server admin stuff is if the bot's actually in there. Otherwise, it just becomes too restricted."). `botInGuild()` reads the Guilds cache, and `attachGuildPolicy()` returns without a verdict when the bot is not there, so a member's own install follows Discord's channel permissions. The rules are kept, and the panel says they do nothing until the bot is added back.
- **Discord's own permissions win.** Use Application Commands off means no commands at all; Use External Apps off means every answer is private, whatever a rule here says. The panel shows it: `discordGate()` reads @everyone's permissions from the cache (Overview's Here line, the Channels warning), and Check a Member reads one member's (`readMember()`, a single-member fetch, no intent). Dioreo cannot override it: that needs Manage Roles, which it does not ask for (his call 2026-10-22).

## The panel (`commands/admin.js`)

- **Pages:** Overview · Channels · Roles · Commands, with Help as its own private message (2026-10-22 23:39 EDT). A page has a **scope**, blank for the server or one command path, carried as the last field of every custom_id (`id|arg|scope`, built by `sid()`), so a click inside a command's pages edits only that command's set (`editTarget()`). `admin_check*` ids never carry a scope.
- **Commands tab:** one string select (`admin_cmd_open`), each option marked by a state dot; at most 25 options, any past that named on the page. It was a button per command until his mobile review.
- **Clear buttons** are Section accessories inside the container, beside the text they clear. They show only when there is something to clear, because a select saves only on click-outside and Escape cancels.
- **No pings:** every render sends `allowedMentions: { parse: [] }`, since the panel can be posted publicly (the `visibility` option).
- **Wording:** a panel reads **Private**, never Hidden (2026-10-22 19:01 EDT); the stored value stays `'ephemeral'`, and the bot-wide `visibility` option keeps its Hidden choice (his "leave it").
- **Tools on Overview:** Check a Member (member select, role select or an ID pop-up; the whole picture, no channel to pick), Export Log, Reset Everything (two presses).

## The text-command switch and prefix (B7, 2026-10-30 13:41 EDT)

- **Config Text Commands / Config Slash Commands** (his labels, 2026-10-29 23:28 EDT; his pick 1A): one blurple button in its own row under Overview's tabs flips the whole panel between the two rule sets. The text view is the same tabs read as **On/Off** (`WORDS[VIEW]`), plus a Prefix block (Edit Prefix, Reset to d). Its ids are `admin_t_…`, rewritten by `textIds()`; `SHARED_IDS` (`admin_view`, `admin_log`, `admin_help`) are the same on both.
- **Stored** in `GuildSettings.textRules` (the same shape as the visibility set: `'public'` = On, `'ephemeral'` = Off) and `GuildSettings.textPrefixes`, resolved by `explainVisibility` through `explainTextCommand`. Off is SILENCE, never a private answer: a message cannot be private, which is why the Open privately card was retired.
- **Server admins skip every text rule** (his "sure", 2026-10-30 12:47 EDT), so an admin can always test; Check a Member's text copy says so. It is the one place the admin bypass applies to a rule set rather than to a command's own settings.
- **Resets:** Reset Slash Rules and Reset Text Rules, one per view (his "'reset everything' implies everything"). `/bot servers`' owner reset clears both, and the prefix.

## The change log, the notice and the owner tool

- **`GuildSettingsLog`** — every save goes through `updateGuildSettings()`, which writes one row (`describeChanges()` → `logGuildChange()`): who, `source` (`admin` or `owner`), what. Nothing deletes a row but its 60-day TTL, so Reset Everything cannot hide a change. Export Log turns the ids into names.
- **`PolicyNotice`** — when a rule made someone's public answer private, `sendPolicyNotice()` (called from `handlers/router.js` after the command answers) tells them why, at most twice per version of the server's rules, keyed by the HMAC user hash.
- **`/bot servers`** (owner only, `commands/bot.js` + `handlers/bot.js`) — view, reset or delete one server's settings by ID; each action is logged in that server's log with `source: 'owner'`. Since B7 it also carries a checkup (in the server, where Dioreo can't post, Integrations rules, 7 days of uses and errors, reply limits, the week's misfires) and Reply Limits, Leave Server and Block Server, which are the owner's (`utils/botControls.js`), not the server's, and are not in its `/admin` settings.

## Other things already paid for

- **The admin check costs zero REST calls.** `interaction.memberPermissions` carries Discord's computed permissions, so `isServerAdmin()` reads the payload. **No `GUILD_MEMBERS` intent** — that gates *enumerating* members, which this never does. `memberRoleIds()` handles both shapes: a real `GuildMember` (`roles.cache`) and a raw `APIInteractionGuildMember` (`roles` as an id array), the latter being the norm for a user-installed invocation in a server the bot has not joined.
- **`setDefaultMemberPermissions(ManageGuild)` on `/admin` is NOT the gate.** Discord ignores it for user-installed invocations — exactly the case this feature covers — so `execute()` and `handleComponent()` both re-check for real. The field is there only to keep the command out of ordinary members' pickers where the bot *is* guild-installed.
- **`client.gateableCommandNames` is built in `bot/registry.js` from the `commands` array that is about to be registered**, not from `client.commands` or a readdir of `commands/*.js`. A hand-maintained list would go stale the first time a command is added.
- **A null settings lookup is cached deliberately.** The common case is a server with no rules at all; caching only the hits would leave exactly that case hitting Mongo on every interaction. Writes go through `updateGuildSettings()`, which invalidates in the same place it mutates.
- **`GuildSettings.updatedBy` and `GuildSettingsLog.actorId` are Discord user IDs and therefore personal data** — disclosed in `docs/legal/PRIVACY.md` §2.1a and Appendix A, with `PolicyNotice`'s hashed id. ⚠️ `docs-audit`'s `privacy-model-coverage` did not catch this on its own: its heuristic was the three literal names `discordId`/`userId`/`user_id`, so it reported a **vacuous pass** while the new model went unexamined. The heuristic was widened to include actor fields in the same change. If you add a model, do not read that check's green as proof of disclosure.
