---
kind: spec
status: frozen
---

# Server-admin visibility policy — design

**Written 2026-08-10 15:38 EDT.** Designed with Harkirat in session `Opus5-H · Server admin controls · Aug 10`, from handoff `local/handoff/2026-08-09-session-B-server-admin-controls.md`. Third of the three-session v3 guild-install arc: guild install (v3.1.1-pre, PR #105) → per-server colours (v3.2.0, PR #106) → **this**.

Roadmap entry: `docs/ROADMAP.md`'s v3 section, `[P1 · L · Opus5-High · 🧩needs-design · 🔗bundle]`, filed 2026-08-09 11:47 EDT and treated as a **launch blocker** for the v3 guild install.

## Why this exists

> "we need a command for server admins (separate from my own admin commands) to allow/restrict certain permissions, commands, usage, channels, restrict or redirect messages, etc whatever else for the bot. **We don't want the bot to run freely bypassing everyone's oversight.**" — Harkirat, 2026-08-09 11:47 EDT

Shipping a guild-installable bot with no server-side controls means any member can invoke it in any channel with no moderator recourse. That is how a bot gets mass-kicked or reported, and it is far cheaper to design in than to retrofit.

## The reframe that shaped this design

The original brief said "restrict or redirect messages". Both halves were re-scoped during the design, and the reasons are load-bearing:

- **The bot holds zero standing guild permissions** (invited with `permissions=0`; see root `CLAUDE.md`'s hard invariant). It cannot delete a message, hide an invocation, or post into a channel outside the interaction that triggered it. A true redirect — answering in `#bot-commands` instead of where the command was run — requires real channel permissions on the invite link. **Redirect is therefore scratched from this feature entirely** (Harkirat, 2026-08-10 15:22 EDT), not deferred as a smaller version of the same thing.
- **"Blocked in this channel" means forced-ephemeral, not refused.** Harkirat's call, and it is the better model: the bot stays usable everywhere, and the only lever an admin pulls is whether its output is *visible to the channel*. Since the bot is slash-command-only, an ephemeral answer is a complete, non-degraded experience for the invoker while being invisible to everyone else. This also happens to be the one thing we can enforce with zero permissions, because we control our own response flags.

So this feature is not an access-control system. **It is a response-visibility policy engine**, and naming it that way in code and docs prevents a future session from re-growing it into a permissions layer the bot cannot back up.

## What Discord already does natively — and the gaps this fills

Measured by Harkirat 2026-08-10 15:38 EDT. Both permissions below are settable **per role and per channel**:

| Discord permission | Effect when disabled |
|---|---|
| **Use Application Commands** | Removes usage of *every* slash command, from every app. |
| **Use External Apps** | Forces *user-installed* ("external") apps' output to ephemeral. |

This is a much larger native surface than the roadmap entry assumed, and it retires the original assumption that user-installed invocations are ungoverned. Three gaps remain, and they are the whole justification for building anything:

1. **Guild-installed Dioreo is not an "external" app.** Once a server installs the bot, "Use External Apps" no longer governs it, so admins lose the native force-ephemeral lever precisely in the configuration v3 is launching. ⚠️ **UNVERIFIED — this is the premise that sizes the feature, and it must be tested before the sizing is quoted anywhere as fact.** Test: in 𝔇𝔯𝔢𝔞𝔪𝔩𝔞𝔫𝔡 (where the dev bot *is* guild-installed), disable **Use External Apps** for a role and run a public Dioreo command as a member holding it. Public output → gap is real. Ephemeral output → gap 1 does not exist and this feature rests on gaps 2 and 3 alone.
2. **Both native permissions are blunt — they hit every app at once.** An admin who wants to quiet Dioreo specifically, while leaving other apps public, has no native way to express that.
3. **No per-command targeting for a user-installed app.** Quieting one Dioreo command natively means disabling Use Application Commands, which kills every slash command from every app in that channel. `ephemeralCommands` gives per-app, per-command recourse with no collateral.

⚠️ **Nothing in this feature refuses a command, and that is a platform limit rather than a scoping choice** (settled 2026-08-10 15:47 EDT, after Harkirat asked whether a restricted command could be removed from the server's command list outright). **A bot cannot hide a global slash command inside one guild.** Guild-scoped registration does not delete global commands — Discord merges both sets, so omitting a command from a guild's list leaves the global one visible. The only native mechanism that removes one command in one server is application command permissions, which can only be written with an OAuth2 bearer token from a MANAGE_GUILD user; the bot cannot set them for itself. Admins already hold that lever directly in Server Settings → Integrations, and it does not apply to user-installed invocations at all. So every rule in this design resolves to public-or-ephemeral, and a later session should not "finish" it by adding a refusal path.

Gaps 2 and 3 hold regardless of how gap 1 resolves, so the feature ships either way; only its headline justification changes.

## Data model — `models/GuildSettings.js`

```js
guildId           String    // unique, required
defaultVisibility String    // 'public' | 'ephemeral', default 'public'
channelRules      [{ channelId: String, visibility: String }]
roleRules         [{ roleId: String, visibility: String, channelIds: [String] }]  // [] = all channels
ephemeralCommands [String]  // command names forced ephemeral server-wide
updatedBy         String    // discord id of the admin who last saved
updatedAt         Date
```

**No document is created until an admin saves a rule.** A server that never configures anything costs zero writes and one cached negative lookup. ⚠️ Every field above must exist in the Mongoose schema before any code assigns it — the repo's standing schema-save gotcha (`.claude/rules/models.md`): an undeclared field persists in memory and silently reverts on the next fetch.

## Precedence — highest tier wins

0. **Admin bypass** — owner / `ADMINISTRATOR` / `MANAGE_GUILD` skip tier 1 entirely and resolve from tier 2 down. Deliberately narrow (Harkirat, 2026-08-10 15:47 EDT): it exempts admins from the *command* rule only, never from the channel or role rules, because those they set for the whole server including themselves. The intent behind a command rule is "this one is noisy, keep it out of the channel for members" — the admins who set it should still be able to run it publicly.
1. A command named in `ephemeralCommands` → `ephemeral`, **above** channel and role rules rather than below them
2. A `roleRule` the member holds whose `channelIds` contains the current channel
3. A `roleRule` the member holds with an empty `channelIds` (server-wide)
4. A `channelRule` for the current channel
5. `defaultVisibility`

Tier 1 applies only where a command name exists — chat-input and autocomplete interactions. A button or select click skips it, which is correct rather than a gap: a component interaction edits a message whose ephemerality Discord fixed when it was first sent, so a command rule has nothing left to decide there.

**Same-tier conflict** — the member holds two roles with opposite values at the same tier — resolves to **`public`**. This mirrors Discord's own role-overwrite semantics, where an explicit allow beats a deny, so admins already hold the right intuition. An admin who needs a hard quiet uses the channel tier (which is less specific and therefore loses to a role grant by design) or removes the role grant itself.

The four configurations Harkirat named all express directly:

| Intent | Configuration |
|---|---|
| Ephemeral server-wide, public in a few channels | `defaultVisibility: 'ephemeral'` + `channelRules` of `'public'` |
| Public server-wide, ephemeral in some channels | `defaultVisibility: 'public'` + `channelRules` of `'ephemeral'` |
| `@roleA` public everywhere despite an ephemeral default | `roleRules: [{ roleA, 'public', [] }]` |
| `@roleB` public in select channels only | `roleRules: [{ roleB, 'public', [c1, c2] }]` |

## The server policy is a ceiling, not a floor

- Effective policy `ephemeral` → **forced**. The user's `visibility` command option and their saved `UserPreference` are both ignored.
- Effective policy `public` → **permitted, not forced**. The user's own option and preference still decide.

A server can quiet the bot; it can never make someone louder than they chose to be. This is the narrow reading of "server wins" that Harkirat selected, and it keeps `/settings` meaningful: a server rule may never alter a user's timezone, palette, region, or any other preference — only where and how loudly the bot speaks.

## Where the gate lives

The obvious design is to make `utils/ephemeral.js`'s `resolveEphemeral()` policy-aware and pass the policy in at its call sites. **It was built that way first and then removed.** `resolveEphemeral` is called by only nine commands — `/help`, `/timestamp`, `/colors` and the **eight per-category weapon commands built dynamically in `index.js`** never touch it — so it would have become an optional argument at nine sites where *forgetting* it looks identical to passing it, silently un-clamping a server's rule. That is the exact failure mode this feature exists to prevent.

Instead there are **two choke points nothing routes around**, on the same reasoning as `utils/logger.js`'s `patchConsole()` — one patch that cannot be forgotten beats a rule that must be remembered:

1. **`attachGuildPolicy()` wraps `reply` / `deferReply` / `followUp`** on the interaction itself when the verdict is `ephemeral`. No command can bypass it and no new command has to remember it. The wrapper preserves an explicit numeric `flags` (Components V2 sends pass `32768`) by OR-ing in the ephemeral bit rather than replacing it — dropping that flag would render a V2 payload as a blank message.
2. **`utils/sendV2Payload.js` strips the "Show Everyone" row** on the way out. That button does not edit the ephemeral message; it posts a brand new, genuinely public one, so leaving it live under an ephemeral rule hands every member a one-click bypass. Every caller that can add the row already routes through this function. `index.js`'s `share_public` handler re-checks server-side as well, because a panel opened *before* an admin set the rule still has the button sitting on it.

The policy is resolved **once per interaction** in `index.js`'s `interactionCreate` choke point — before the anti-spam guard, before any routing — and attached to the interaction object. Two consequences that must not be missed:

- **`buildSyntheticInteraction()` must copy the resolved policy through.** A button re-invoking a slash command's `execute()` builds a synthetic interaction, and `Object.assign` is already banned here for dropping non-enumerable properties (a real past crash). The policy is one more field that has to survive that hop or every panel navigation silently reverts to the unclamped default.
- **DM and user-install contexts have no `guildId`.** Policy resolves to `null` there and behaviour is exactly as today.

Resolution reads the invoking member's role ids from the interaction payload. **No REST call on the common path, and no `GUILD_MEMBERS` privileged intent** — that intent gates *enumerating* members, which this never does. A per-guild in-process cache keyed by `guildId`, invalidated on save from the panel, keeps the DB out of the hot path.

## The command — `/server`

A Components V2 panel for server admins, deliberately distinct from `/manage` (Harkirat's owner-level panel, gated by `ALLOWED_ADMIN_ID`, staying user-install-only). Name confirmed by Harkirat 2026-08-10 15:47 EDT over `/serversettings`.

- `setIntegrationTypes([0, 1])` — it must work in a server where the bot is only user-installed, because that is a configuration that still needs admin controls.
- **The runtime check is the real gate**, not `setDefaultMemberPermissions`: that field is ignored for user-installed invocations. Admin resolves as `ADMINISTRATOR` or `MANAGE_GUILD` from the interaction's computed member permissions, or an `owner_id` match.
- `setDefaultMemberPermissions(ManageGuild)` is set anyway, so the command does not clutter the picker for ordinary members where the bot *is* guild-installed. Defence in depth, not the gate.

## Out of scope — filed, not dropped

Recorded in `docs/db-deferred-list.md` in the same change as this spec:

- **Response redirect** (answer in a different channel) — needs real channel permissions on the invite link; a genuinely different ask about the bot's permission posture, not a smaller version of this.
- **Audit log of server-admin config changes** — who changed what, when.
- **Per-command role gating** (as opposed to visibility) — Discord's Integrations UI already covers this for guild installs.
- **Message-content moderation** of any kind — needs the privileged MESSAGE CONTENT intent, already v4.

## Verification plan

Behavioural, on the dev bot in 𝔇𝔯𝔢𝔞𝔪𝔩𝔞𝔫𝔡 — the v3.1.1 lesson was that **zero slash commands were ever actually invoked in a test guild**, so nothing here is claimed from a passing syntax check:

1. `interaction.memberPermissions` carries computed permissions for a guild invocation (the premise that avoids all REST calls).
2. `/server` is refused for a non-admin member and accepted for an admin.
3. A channel rule of `ephemeral` forces a public-by-preference command to ephemeral in that channel, and leaves it public elsewhere.
4. A role rule scoped to specific channels beats the channel rule inside them and not outside them.
5. A command named in `ephemeralCommands` is forced ephemeral for an ordinary member and stays public for an admin, and the clamp covers one of the dynamically-built weapon commands.
6. Gap 1's Use External Apps test, above.
