---
kind: plan
status: live
---

# Text commands — build plan (three cloud builders, one integration branch)

*Written 2026-10-28 21:05 EDT by the text-commands lead. Design: `docs/superpowers/specs/2026-10-28-text-commands-design.md`, read it in full first. Harkirat, 2026-10-28 20:59 EDT: the builders run as standalone Claude Code cloud threads, one after another, each on a sub-branch merged into the text-commands branch; the lead verifies at the end and pushes and merges it into `main`.*

## Branches

| Branch | What | Who |
| --- | --- | --- |
| `feat/text-commands` | the integration branch (already holds the foundation: parser, adapter, listener, permissions, 13 commits) | the lead |
| `feat/text-commands-b1-records` | B1 | builder 1 |
| `feat/text-commands-b2-options` | B2, started only after B1 is merged | builder 2 |
| `feat/text-commands-b3-help` | B3, started only after B2 is merged | builder 3 |

## Every builder, in this order

1. `npm ci`, then `git fetch origin --tags` and `git checkout -B <your branch> origin/feat/text-commands`. Your harness may name a `claude/…` branch: ignore it, Harkirat's prompt gives you this one and permission to push it and `feat/text-commands`.
2. **Predecessor check.** B2: `git log origin/feat/text-commands --oneline | rg "feat/text-commands-b1-records"` must show B1's merge; B3 the same for `b2-options`. Missing → stop, reply "BLOCKED: <predecessor> not merged yet".
3. Do your unit below. Write only the files under Owns. One `python3` heredoc for edits that touch several places (assert every anchor, `print()` per edit, timestamps computed, never typed), the test chained with `&&`.
4. Run your Test command and `npm run docs:audit > /tmp/audit.log 2>&1; echo exit=$?` (read the exit code, never pipe it to `tail`). The audit must have no ERROR. If an ERROR names only tags or version history, check whether it also fails on a clean `origin/feat/text-commands`; if so, report it and go on.
5. `git diff --name-only origin/feat/text-commands...HEAD` must list only your Owns files.
6. Commit (Conventional Commits, e.g. `feat(text-commands): …`), with this trailer block:
   ```
   Co-Authored-By: diorswrld <310361322+diorswrld@users.noreply.github.com>
   ```
   plus your harness's own Claude line.
7. Push your branch. Then `git checkout feat/text-commands && git pull --ff-only origin feat/text-commands && git merge --no-ff <your branch> && git push origin feat/text-commands`, then `git push origin --delete <your branch>`. A push gate may ask for an approval line: `Approved by: Harkirat · to: push <your branch> and merge it into feat/text-commands · when: his prompt that started this thread`.
7b. **B2 only, if the work runs long:** commit each phase on your branch as it passes its tests. If you cannot finish, push your branch, do NOT merge it, and reply "BLOCKED: <what is left>" so the work continues from your branch.
8. Reply with: the test output, the audit's ERROR/WARN counts, the merge commit hash, and anything you could not do. Never touch `main`, `public/`, `portal/**`, `docs/pins2/**`, never run `npm run site` or `npm run portal*`, never start the bot (there is no token here). A wrong or unclear spec → "BLOCKED: <what>"; never rewrite it.

## B1 — records

**Owns:** `CLAUDE.md` · `.claude/rules/text-commands.md` (new) · `.claude/rules/interaction-router.md` · `docs/legal/PRIVACY.md` · `docs/legal/TERMS.md` · `docs/reference/platform-constraints.md` · `docs/ROADMAP.md` · COMMENT-ONLY edits in `utils/inviteLinks.js` (~line 25) and `models/SearchTerm.js` (~line 8)
**Test:** `npm run docs:audit`, 0 ERRORs. Run it first as the baseline (it passes today only because this plan names the three text-command tests; your rule file must name them too, by path).

1. **CLAUDE.md**, section "The bot answers ONLY through interactions":
   - Add one more exception, same style and dating as the others, WITHOUT a number (the existing ones number themselves inconsistently in code comments; do not renumber them, do not add a count): text commands (`bot/textCommands.js`) answer a message that starts with `@Dioreo` or a prefix (`/`, `d`, `dior`) with an ordinary reply in that channel, public, never pinging; where a server's `/admin` rule forces hidden, an Open privately card instead; where Dioreo can't post, one DM to that member per channel per day. His words are in the spec.
   - Rewrite the sentence "Intents stay `Guilds` only, so PRIVACY's 'we cannot read your messages' still holds": intents are now `Guilds` + `GuildMessages`, plus `MessageContent` only when the app's flags grant it (bot/textCommands.js reads them before login). Keep it true; date it.
   - Add a row to the Navigation map's rules table for `.claude/rules/text-commands.md`.
2. **.claude/rules/text-commands.md** (new; front matter `kind: rule`, `status: live`, `paths:` = `utils/textCommands/**`, `bot/textCommands.js`, `handlers/textCommands.js`): the trigger rules and why (the chat guard principle, the typo table with the 2026-10-28 measurement), the adapter's three rules, the Open privately and Did you mean buttons, the dev prefixes and why (prod and dev share Dioreoland), the Message Content flag check, the message cache 0 + sweepers and why, the can't-post DM, the server command-permission check (`utils/textCommands/permissions.js`, his yes 2026-10-28 17:52 EDT: Integrations overrides obeyed, channel-wide Use Application Commands ignored; fails closed; 1-minute cache dropped on `applicationCommandPermissionsUpdate`), the plain-message fallback where Read Message History is denied, that `/colors`' swatch images need Attach Files in the channel, and a **Tests** section naming each test file by path: `scripts/textCommandParse.test.js`, `scripts/textCommandAdapter.test.js`, `scripts/textCommandPermissions.test.js` (docs:audit's `scripts-documented` check matches paths; later units append their own here). Copy the reasoning from the code comments, not new claims.
3. **.claude/rules/interaction-router.md**: in the custom_id prefix table add `txtpriv_` `txtrun_` → `textCommands.js`; one short paragraph that `bot/textCommands.js` is a second entry point beside `interactionCreate`, with its own try/catch, reusing `buildInteractionContext` so analytics and log attribution match.
4. **docs/legal/PRIVACY.md → v1.12** (no announcement, his call): follow the file's own versioning block (`**Version:** 1.11`, line 10) and history table (row `| 1.11 | 27 October 2026 |`). Every sentence below is now FALSE and must be made true: the headline paragraph "We don't read your messages" (line ~19); §2.4b's "whether you arrived by slash command, button, dropdown, autocomplete or modal" (add: or a text command, and which form: mention, `/`, `d`, `dior`, the new `via` field in `models/AnalyticsEvent.js`); §2.4b's ⚠️ paragraph "This is not message content…the Message Content permission the Bot does not hold"; §3; the Appendix row "Your messages"; and the verification row ~636 ("constructed with `GatewayIntentBits.Guilds` only"). Then run the class sweep below for anything this list missed. The new truth: Discord now tells Dioreo that a message was posted in the servers it's in (who, where, when), and sends the text only when the message mentions Dioreo or, where Discord grants Message Content, starts with a prefix; Dioreo reads only those, ignores every other message, and never stores a message; running a text command creates the same preferences record a slash command does; the can't-post DM. Update the verification row near line 636 ("constructed with `GatewayIntentBits.Guilds` only") to the new truth. Keep the file's voice. Wording is HIS to approve: end your reply with the changed sentences quoted so the lead can show him.
5. **docs/legal/TERMS.md** line ~140 ("does not have Discord's Message Content permission, does not read ordinary messages"): make it true in the same terms, and bump TERMS by its own versioning (`**Version:** 1.6`) and history table.
8. **The class sweep** (do not trust the list above to be complete): search the tree, outside `node_modules`, `local/`, `docs/archive/`, the three changelogs and the frozen `docs/superpowers/specs/`, for `message content`, `read your messages`, `only through interactions`, `answers ONLY through`, `Guilds\` only`, `GatewayIntentBits.Guilds` (case-insensitive). For each hit decide: now false → fix (only in files you own); a dated measurement still true when Message Content is off (the forward-snapshot notes in `utils/patchNoteSource.js`, `commands/addToPatchNotes.js`, `.claude/rules/commands-overview.md`) → leave; a frozen spec → leave. List every hit with its verdict in your final reply.
6. **docs/reference/platform-constraints.md**: a dated entry: a server with ~50+ bots stops listing newer bots' slash commands (「𝐆𝐇𝐎𝐒𝐓」, 1433978538620616745, 54 bot roles, Dioreo missing from the phone's In This Server list, 2026-10-28 15:54 EDT; user-reported, not in Discord's docs); text commands get around it. Plus: Message Content is a portal toggle under 100 servers even for a verified bot (both apps showed flag bit 19 after he toggled, 2026-10-28 17:08 EDT); approval at 100+. Plus: a role mention carries no text without Message Content (spike, 2026-10-28 16:37 EDT). The file's own rule: an entry is evidence, dated.
7. **docs/ROADMAP.md**: the v4 "text/prefix commands and the MESSAGE CONTENT intent" item moves to v3.x as in progress, with this branch; strike, don't delete; keep "Deliberately NOT in scope" lines true.

## B2 — options, autocomplete and reply-to forms

**Owns:** `utils/autocomplete.js` (new) · `handlers/router.js` (ONLY the autocomplete block, `if (interaction.isAutocomplete())` to its closing brace) · `utils/textCommands/args.js` (new) · `utils/textCommands/commands.js` · `utils/textCommands/parse.js` · `utils/textCommands/adapter.js` · `bot/textCommands.js` · `handlers/textCommands.js` · `scripts/textCommandArgs.test.js` (new) · `scripts/textCommandListener.test.js` (new) · `scripts/textCommandParse.test.js` · `scripts/textCommandAdapter.test.js` · `scripts/testManifest.mjs` (two lines, right after `textCommandPermissions.test.js`) · `.claude/rules/text-commands.md` (add your two tests to its Tests list, and a short Options section) · `commands/gunsmith.js` (ONLY: `requestedBuild` reads a text-only build value the adapter supplies; the slash command's options do not change) · `commands/timestamp.js` (ONLY: if its shorthand expansion lives inside `execute`, move it into an exported function with no behaviour change, so the text path calls the same code)
**Test:** `node scripts/textCommandArgs.test.js && node scripts/textCommandListener.test.js && node scripts/textCommandParse.test.js && node scripts/textCommandAdapter.test.js && node scripts/textCommandPermissions.test.js && node scripts/handlerRouting.test.js`

### Phase 1 — move the router's autocomplete into a callable function (no behaviour change)

Verified 2026-10-28 18:00 EDT: autocomplete is NOT one function. `handlers/router.js` (from `if (interaction.isAutocomplete())`, ~line 271) delegates `remind` and `timestamp` to `command.autocomplete()`, but patch notes `season`, help `cmd` and the gunsmith/dmz `weapon` lists are written INLINE in the router. Move the body inside that block's `try` VERBATIM into `utils/autocomplete.js` as `async function runAutocomplete(interaction)` (same returns: it calls `interaction.respond(...)`). The router keeps its `markHandler`, `instrumentAutocomplete` and try/catch, and calls `require('../utils/autocomplete').runAutocomplete(interaction)` lazily inside the branch (handlers/router.js is the hotpatch boundary; see `.claude/rules/hotpatch.md`). Prove it moved byte-for-byte: your heredoc extracts the old body, writes it, and asserts the new file contains it unchanged.

### Phase 2 — the options grammar

**The spec is the design file's "Options and aliases" section: its two tables, every alias and value as written, singular and plural both matching, and its Open note.** Build it exactly; if anything is unclear or contradicts the code, end BLOCKED.

- `commands.js`: every command in the Per command table, with its aliases; per entry the options in the order positional words fill them, and keyword values. Dump each public command's real options first: `node -e` over `commands/*.js` `data.toJSON()`. Never `visibility`. Admin commands stay out.
- `args.js` (pure): `parseArgs(tokens, textCommand, commandJson, { allowTypos })` → `{ options, leftover, missing, autocomplete: [{option, text}] }`; values by name, alias or choice value, case-insensitive, singular or plural, the `isTypoOf` rule from parse.js; `key:value` always; a rest option (timestamp `datetime`, gunsmith `weapon`) takes what is left.
- `parse.js`: a matched command passes its remaining tokens to `parseArgs`. After `d`/`dior`: anything left over → silent, and a rest option must RESOLVE or the message is silent (`dior gunsmith skins are cool`, `d timestamp is wrong lol`): the weapon needs one confident autocomplete hit, the timestamp must parse with `commands/timestamp.js`'s own parser. After `@Dioreo` or `/`: leftover → `kind: 'usage'`; a required option missing → `kind: 'needsInput'`; an unresolved rest → a one-line "No match". A bare weapon name (`d ak117`) runs gunsmith MP only for an exact weapon name or alias. Every existing row of `textCommandParse.test.js` keeps passing.
- `adapter.js`: `buildOptions({ sub, values })` answers `getString/getInteger/getBoolean/getNumber/getUser` from `values`; `createTextInteraction(message, { textCommand, via, values, targetUser, targetMessage })`.
- Every word maps as the spec's "How words map" table says. Gunsmith's build number is text-only and never re-added to the slash command (his 2026-10-25 call); a trailing number is a build only under the spec's rule. Timestamp parsing goes through `utils/timestampHelper.js` and `commands/timestamp.js`'s own expansion, never a copy.
- Remind: `when` is required and picks the option (`releases` or `leaving`); the item resolves through `/remind`'s own autocomplete for that side (`utils/reminders.js` `autocompleteChoices`). Without `when`, `d remind black hole` is silent after `d`/`dior` and gets a usage hint after `@Dioreo`. The public reply says only on/off and the title, with the button that opens the panel privately.
- Calendar shortcut command words (`events`, `ev`, `playlists`, `modes`, `gamemode`, `gm`) open that page; `new`/`returning` after a page word pick the New/Returning split only where the page has one.

### Phase 3 — the listener

- Autocomplete options: call `runAutocomplete` with a fake autocomplete interaction (`commandName`, `options.getSubcommand()`, `options.getFocused(true)` → `{ name, value: text }`, `respond(list)` captures). Do NOT call `instrumentAutocomplete` (no search analytics from text). One confident hit → its `value`; several → Did you mean (up to 5 buttons); none → "No match for “text”." (only after `@Dioreo`/`/`).
- Buttons carry the value: `txtrun_<command>~<value>` when ≤ 100 characters, else an in-memory store for 15 minutes (`txtrun_~<id>`, "Run it again" when expired). Keep the explicit `startsWith('txtpriv_')` / `startsWith('txtrun_')` branches (handlerRouting check 9) and the permission check + policy re-resolution already in handlers/textCommands.js.
- `usage` → one line built from the command's options; `needsInput` → a card whose button (`txtrun_<command>~open`) runs the command's empty slash path, where `showModal` works because a click is an interaction (gunsmith's `~search~` path).
- Reply forms: a message that REPLIES to another (`message.reference`) with `d times` / `d convert` runs `commands/convertTimes.js` with `targetMessage` (fetched with the bot token); `d colors` as a reply, or `d colors @user`, runs `commands/viewColors.js` with `targetUser`. Public, the right-click modules' own code. Check both modules' `execute` for what they read off the interaction first.
- `via` gains `+args` when options were given.

### Tests

Also: a table-driven test that every command alias and value alias in `commands.js` resolves to what the spec says, and that no alias belongs to two commands and no value alias to two values of one command (prove it fails by adding a clash). Rows for `d time in a minute`, `d gs type 19`, `d gs ak117 2`, `d remind live black hole`, `d r end black hole`, `d remind black hole` (silent), `d modes`, `d events`, `d new` (silent), `d prices na`, `d prices la`, `d prices global`.

`textCommandArgs.test.js` (≥ 30 rows: `d calendar upcoming`, `d calendar filter:upcoming`, `d draws returning`, `d gs ak117`, `d gunsmith ak 117`, `d timestamp tomorrow 8pm`, `d draw prices na`, `dior calender upcomming`, `d calendar what is this` → silent, `@Dioreo calendar what` → usage, `d gunsmith` → needsInput…). `textCommandListener.test.js`: drive `onMessage` with fake messages and stub command modules that record the interaction they get (options arrive; ambiguous autocomplete → Did you mean; reply-to `d times` passes `targetMessage`; `dior gunsmith skins are cool` sends nothing). Prove each new test can fail (break a rule, see red, restore) and name the mutation.

## B3 — help and docs

**Owns:** `commands/help.js` · `utils/commandMentions.js` · `scripts/lib/commandsPage.js` · `scripts/lib/commandProse.js` · `scripts/helpTextCommands.test.js` (new) · `scripts/testManifest.mjs` (ONE line, right after `helpAnnouncement.test.js`) · `.claude/rules/text-commands.md` (add your test to its Tests list)
**Test:** `node scripts/helpTextCommands.test.js && node scripts/helpAnnouncement.test.js`

1. **/help**: a short "Text commands" part on the landing page (one block, no new page): `@Dioreo today` works everywhere Dioreo can post; `d today`, `dior today` and `/today` where Discord grants Message Content (read `client.textMessageContent`, set by bot/textCommands.js); one line on why ("when this server hides slash commands"). Match the panel's existing style; count components (the 40 cap) and say the count in your reply.
2. **Slash mentions in text replies**: `mentionCommand(client, path)` returns `` `d draws` `` instead of `</draws:id>` when `require('./requestContext').getContext()?.handler === 'textCommands'` (bot/textCommands.js sets that) — a slash mention is plain text exactly where text commands are needed. Same for any helper that formats a command name for display; find every caller with `rg -n "mentionCommand\\("`.
3. **The site's /commands page** (`scripts/lib/commandsPage.js` / `commandProse.js`): one short note under the intro that every public command also works as `@Dioreo <command>` or `d <command>`, in the page's voice. Do NOT run the site build or touch `public/` (the lead does).
4. **Test** `scripts/helpTextCommands.test.js`: the help landing contains the text-commands block and stays ≤ 40 components; `mentionCommand` returns the text form inside a fake context with `handler: 'textCommands'` and the slash form otherwise. Prove it can fail.

## The lead, after B3 is merged (on this Mac)

1. `git pull`; read each unit's diff against its Owns and the spec.
2. `git merge origin/main` if `main` moved; `npm run site` and commit `public/` (PRIVACY, TERMS and the /commands page changed).
3. `TEST_CACHE=0 npm test` and `npm run docs:audit`, exit codes read.
4. Show Harkirat the help card, the Did you mean card and the can't-post DM on the dev bot in #testing-spam, then click-test on the dev bot in Dioreoland: every row of the Per command table that has an argument, the reply-to forms, Did you mean, needsInput, the chat guards.
5. Show Harkirat the PRIVACY and TERMS wording; his yes before the merge.
6. Records: `package.json` 3.3.0, CHANGELOG + CHANGELOG-SUMMARY + DEVLOG (`scripts/devlog-add.mjs`), backfill the previous entry's hash.
7. Push; `gh pr create --base main`; restate his approval (2026-10-28 20:59 EDT: "push and merge the text-commands branch into main"); squash merge with one trailer block; tag `v3.3.0`; delete the branch; refresh refs and the indexes. Deploy is NOT part of this; it waits for his word.

## Audit log

Deep think-pass, 2026-10-28 21:05 EDT (his ask: "distill the plan and spec so far with a deep /think-pass for this situation"), 15 thoughts, 7 checks. What it changed:

1. *Cloud clones see only GitHub.* The spec, plan, aliases and prompts lived in gitignored `local/`; they now live in this plan and the design spec, committed and pushed before B1 starts.
2. *The old prompts forbade committing and pushing,* the opposite of the new flow; each builder now owns its sub-branch's git, with explicit permission over the cloud harness's `claude/…` branch default.
3. *Mac-only tools* (`read_smart`, codebase-memory, the dev bot, local Mongo, absolute `/Applications` paths) were named as mandatory; removed. The builders' tests need no database or token (checked).
4. *No CI runs on `feat/text-commands`* (`ci.yml` triggers on `main` only): each builder runs its tests and `docs:audit` before merging; full CI runs on the final PR.
5. *Sequential order is load-bearing*: B2 and B3 now append their tests to B1's rule file (the parallel plan forbade it), and B3's /help reads B2's aliases.
6. *`public/` would churn*: no builder runs the site build; the lead runs it once after B3.
7. *A builder started early*: each checks its predecessor's merge commit first.
8. *A bad unit*: `--no-ff` merges make one unit revertable; the Owns diff check runs before each merge.
9. *His "d modes new"* has no meaning in the code yet (modes have no New/Returning split): recorded as Open in the spec, asked.
10. *"text-commands" vs the convention*: the existing `feat/text-commands` is the integration branch (it already holds the foundation); sub-branches follow `<type>/<kebab>`.
11. *Process*: the near-miss was carrying Mac tool rules into cloud prompts. Check every instruction against where it will run.

Content pass, 2026-10-28 21:09 EDT, after his correction ("hooks and stuff aren't an issue. the main focus should be the actual plan, spec, the work on-hand, the files needed, the quality of work"), 7 thoughts, 3 checks. What it changed:

12. *The spec told B2 to re-add `build` to `/gunsmith`*, which he removed on 2026-10-25, and B2 did not own `commands/gunsmith.js`, so it would have stopped BLOCKED. Now text-only, with a minimal owned change.
13. *Timestamp has no exported parser* (`utils/timestampHelper.js` holds chrono; the shorthand expansion sits inside `execute`): B2 owns extracting it, not copying it.
14. *Remind's group list was my guess*: groups are whatever `/remind`'s autocomplete pins; `when` picks the option.
15. *Value words mapped to nothing*: a "How words map" table now covers every non-obvious value.
16. *One-letter timestamp styles would eat date words* (`d time in a minute`): dropped. *Numbers in weapon names* (`type 19`) vs a build number: a rule.
17. *His answer 2's shortcut words* were never in the spec: added. *Alias clashes*: a test now enforces none.
18. *B2 is the heaviest unit*: per-phase commits and a no-merge BLOCKED path if it can't finish. *Process*: the first pass spent a third of its thoughts on infrastructure he didn't need; content comes first.
