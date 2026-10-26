---
kind: record
status: live
---

# Intake: loadout pictures keyed by gunsmith code (Session 4's drawings, Session 5's port)

Recorded 2026-10-26 11:24 EDT by Session 4's lead. Harkirat forwarded this ask from the Dioreo-Bot project in the project chat at 2026-10-26 11:17 EDT; the coordinator relayed it as Session 5 scope, as with the permissions and season-start intakes, not to be built now. At 11:19 EDT he added: "part of it also affect's session 4 because it changes the new build drawer i think. ask it to check and review, run a think-pass on the request." It is order item 9 of the plan's §5d; its Session 4 half waits on his call.

## Checked 2026-10-26 11:24 EDT

- `/Applications/Claude Code/Dioreo-Bot` is a second checkout of this repo on `feat/loadout-gunsmith-keys` at `938d4eb5` (25 files changed against `origin/v3-pre-release`). `origin/v3-pre-release` at `200ad9ba` has neither `codeImageKey` (`utils/loadoutImageCache.js`) nor `compareBuilds` (`utils/loadoutForm.js`), so the port waits on that merge.
- The bot branch has `codeImageKey` (2 hits), `compareBuilds` (3), `label` on `models/Loadout.js` (`label: { type: String, default: '' }`, "back end only"), and `scripts/migrateLoadoutKeys.js`, which the dev database needs before the Verify line can pass.
- `core/ops/loadouts.js` `validateBuild` spreads the whole payload, so a portal-sent `label` is written. But `loadout.add` writes `buildName` exactly as sent (default `Standard Build`): only the bulk path numbers a new build `Build N` (lines 107–112) and requires the MP code (lines 66–71). Discord's single add numbers the build in its handler (`handlers/manage/loadouts.js:268`, `Build ${numbering.number}`). So nothing in core gives the portal's single add a number or a required code.
- The portal today: `portal/ui/armory.logic.js` `buildNumberOf` orders by `_id` (line 131), `displayBuildLabel` reads `buildName` (line 154), `deriveNextImageKey` mints `WEAPON-N` (line 353); `buildArmoryAddOp` sends `buildName: fields.buildName || 'Standard Build'` (line 45). `portal/ui/armory.js` uses them at lines 104, 145, 574, 793 (the Use convention chip), 929, 1248, 1269.
- Builder-2 (Session 4's board): the single-add drawer's name row is already called **Label** (optional, `maxLength` 32, the live n / 32 of §10.4 G6 row 2) but binds `buildName`; Stage names only a missing weapon or attachment (`b4/form.js` 55–57, 479); the image key reads "Set from the weapon" (311). Bulk create already parses `Label:` and says the code is "Optional · fills the slots it names"; its format sample's image is `BAL-27-6` (`b4/bulk.js` 97, 100).

Not checked: the bot branch's tests, and the migration's effect on the dev database.

## Which half is whose

| Part | Session | What it is |
|---|---|---|
| The drawer's code row on MP, required | 4 (his call) | no Optional chip; Stage and the Before staging card name a missing code; DMZ unchanged |
| The drawer's Label row | 4 (his call) | the name row is the build's label (optional, 32, n / 32); the build's number shown as automatic |
| The image key line on MP | 4 (his call) | reads `WEAPON-CODE` from the code; the Use convention chip follows; DMZ keeps `DMZ-WEAPON-N` |
| Bulk create on MP | 4 (his call) | the code line required; the format sample's image in `WEAPON-CODE` |
| `deriveNextImageKey`, the Use convention chip | 5 | mirror `codeImageKey` on MP, or send no key and let core key the picture |
| `displayBuildLabel` | 5 | read `label`, falling back to `buildName` for an unmigrated build |
| `buildNumberOf` | 5 | order by the `Build N` number, as `compareBuilds`, so "Build 2 of 5" matches `/gunsmith` |
| The drawer's payload and checks | 5 | require the code on MP; send `label`; send `buildName: Build N`; an edit changes `label`, never `buildName` |
| The portal's bulk parse | 5 | `Label:` to `label`; the code required on MP |

## What the ask leaves out (for the bot project)

1. **Numbering a single add.** Core numbers only bulk adds. Either core's `loadout.add` numbers a build sent without one (one rule for every surface, the bot branch's change), or the portal mirrors `/manage`'s numbering. My pick is core.
2. **Requiring the MP code in core.** Core requires it only on the bulk path, so a portal single add or edit could save an MP build with no code and no code-keyed picture. My pick is the same: core refuses it.
3. **Edits.** The portal's edit sends `buildName` among its dirty fields (`EDIT_DIRTY_FIELDS`, `armory.logic.js:261`); after the change an edited label must write `label`, or the build loses its number.

## His forwarding message, verbatim (2026-10-26 11:17 EDT)

> The Dioreo-Bot project changed how loadout pictures are keyed (branch feat/loadout-gunsmith-keys, merging into v3-pre-release). Please port the portal's half once it lands on v3-pre-release.
>
> Read the proposal first: /Applications/Claude Code/Dioreo-Bot/local/project/proposals/2026-10-26-pins2-loadout-code-keys.md
>
> In short:
> - MP picture keys are now WEAPON-CODE (e.g. BAL-27-1C2B4A8B9A), minted by codeImageKey() in utils/loadoutImageCache.js. DMZ keeps DMZ-WEAPON-N.
> - A build's name is always "Build N"; its label is a new `label` field on the Loadout model.
> - Builds order by their Build N number (compareBuilds in utils/loadoutForm.js), not by _id.
> - MP builds require a gunsmith code (letters and digits only).
>
> Portal changes asked for:
> 1. Armory's "Use convention" / deriveNextImageKey: stop minting WEAPON-N; use codeImageKey, or leave the key to core (core/ops/loadouts.js already re-keys an uploaded MP picture to its code).
> 2. displayBuildLabel(): read `label`, falling back to buildName for an unmigrated build.
> 3. buildNumberOf(): order by the Build N number so "Build 2 of 5" matches /gunsmith.
> 4. New Build drawer: require the code on MP.
>
> Verify: one build reads "Build 2 of 5" in both the portal and /gunsmith, and a picture added in the portal lands at WEAPON-CODE.

## The proposal, verbatim (from the Dioreo-Bot checkout's local proposals folder, the path in his message)

Written 2026-10-26 01:26 EDT by the loadout-keys lead (Dioreo-Bot, branch `feat/loadout-gunsmith-keys`). Goes to pins2 on Harkirat's word.

## What changes on the bot side

- MP picture keys are `WEAPON-CODE` (e.g. `BAL-27-1C2B4A8B9A`), minted by `utils/loadoutImageCache.js` `codeImageKey(weaponName, code)`. DMZ keeps `DMZ-WEAPON-N`.
- A build's name is always `Build N`, and its label is a new `label` field (models/Loadout.js). The number decides its place in /gunsmith (`utils/loadoutForm.js` `compareBuilds`), no longer _id order.
- The gunsmith code is required on MP builds in /manage, /autobuild and the bulk paste.
- core/ops/loadouts.js: when the portal sends `imageSourceUrl` on an MP build with a code, the picture is uploaded at the code key, whatever key the form sent.

## What the portal would need

1. Armory's "Use convention" and `deriveNextImageKey` mint `WEAPON-N`: switch to `codeImageKey` (or leave the key to core).
2. `displayBuildLabel()` reads the label off buildName: read `label`, falling back to buildName for a build not migrated yet.
3. `buildNumberOf()` orders by _id: order by the `Build N` number (`compareBuilds`), so the portal's "Build 2 of 5" matches /gunsmith.
4. The New Build drawer: require a code on MP.

## Verify

The same build reads "Build 2 of 5" in the portal and in /gunsmith, and a picture added in the portal lands at `WEAPON-CODE`.
