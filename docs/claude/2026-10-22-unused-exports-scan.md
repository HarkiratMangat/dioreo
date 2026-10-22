---
kind: record
status: frozen
---

# Exports that no other file references — scan of 2026-10-22

*Written 2026-10-22 from the housekeeping sweep's think-pass (#216). Frozen: a snapshot of what the tree held on that date, not a to-do list that stays true.*

Every module under `commands/`, `handlers/`, `core/`, `bot/` and `utils/` was loaded and its `module.exports` keys listed (89 keys across 45 files). A key is listed here when its name appears as an identifier in no other tracked code file: not a caller, not a test, not a script, not a hook. Mongoose model internals and JSON data files were excluded.

## How to read it

- **It is a candidate list, never a delete list.** An export can be public API on purpose, kept for a test written later, or reached by a computed name (`emojis[key]`, a template string) that no identifier search can see. The `emojiMap.js` keys in particular are looked up by string.
- **The sweep removed only the two it could prove dead** (`noteCommandSafely`, `regionsWithData`): zero references anywhere, and no comment or rule that documents them as intentional.
- **To act on one:** search for the name in docs and comments first, then delete it from the file *and* from `module.exports` in one change, and run the full suite.

## The list

| File | Exports with no outside reference |
|---|---|
| `bot/lifecycle.js` | `formatPing`, `runBasketExpiry` |
| `bot/registry.js` | `MESSAGE_COMMAND_CAP`, `belongsOnAdminApp`, `capMessageCommands` |
| `commands/addToPatchNotes.js` | `COMMAND_NAME`, `listedSeasons` |
| `commands/bot.js` | `PAGE_META`, `buildAccessPanel`, `buildHotpatchPanel` |
| `commands/calendar.js` | `FILTER_OPTIONS`, `entryState` |
| `commands/drawCalculator.js` | `ADVANCED_GOAL_TEXT`, `SETUP_CONTAINER_BUDGET`, `buildCostBlock`, `buildMissingBasketPanel`, `buildProgressPanel`, `buildSavedPanel`, `groupForDisplay`, `isDoubleCPEventLive`, `metaOf`, `progressTitle`, `regionBalanceSection`, `usedTypes` |
| `commands/drawprices.js` | `UPGRADE_LABEL`, `formatCP`, `upgradeEmoji` |
| `commands/embedtest.js` | `MODAL_ID` |
| `commands/help.js` | `resolveCommandToCategory` |
| `commands/manage.js` | `buildAnnouncementListBlocks`, `buildDraftStatusText`, `buildPastSeasonsOptions` |
| `commands/patchnotes.js` | `HISTORY_SHOWN`, `INFO_TEXT_BUDGET` |
| `core/changeset.js` | `pagesForOp` |
| `core/permissions.js` | `scopeKind` |
| `handlers/manage/retry.js` | `captureModalValues` |
| `handlers/manage/shared.js` | `resolveManagePanelMatches` |
| `utils/adminAccess.js` | `getGrants` |
| `utils/announcementBannerCache.js` | `isOurDeliveryUrl` |
| `utils/autobuildBulk.js` | `MAX_SCREENSHOTS`, `applyResult`, `batchDuplicateOf`, `flagsOf` |
| `utils/autobuildPipeline.js` | `resolveCategoryAndBadges`, `writeLoadoutDoc` |
| `utils/botPresence.js` | `ROTATE_MS` |
| `utils/calendarBannerCache.js` | `VALID_PAGES` |
| `utils/catalogue.js` | `CATEGORY_KEYS` |
| `utils/cloudObservability.js` | `LOG_COUNT_CAP` |
| `utils/cloudinaryArchive.js` | `ARCHIVE_ROOT`, `archiveFolderFor` |
| `utils/cloudinaryClient.js` | `AKAMAI_SHARED_CDN`, `CF_SHARED_CDN`, `PreloadedFile`, `SHARED_CDN`, `cloudinary_js_config`, `provisioning`, `search_folders` |
| `utils/cloudinaryDeliveryUrl.js` | `DEFAULT_TRANSFORM` |
| `utils/colorExtract.js` | `deserializePalette`, `perceptualDistanceHex`, `serializePalette` |
| `utils/colorNames.js` | `MAX_MATCH_DISTANCE`, `baseWordOf`, `pickName` |
| `utils/colorPaletteView.js` | `SOURCE_ORDER` |
| `utils/drawCost.js` | `upgradeShape` |
| `utils/drawEndReminder.js` | `REMIND_WINDOW_DAYS`, `drawEndCustomId` |
| `utils/drawTypes.js` | `UNKNOWN_TYPE` |
| `utils/embedTester.js` | `EDIT_BUTTON_ID` |
| `utils/emojiMap.js` | `blueDash`, `dioreoKawaii`, `season6`, `season8` |
| `utils/firstCommand.js` | `noteFirstCommandSafely` |
| `utils/hotpatch.js` | `BOUNDARIES` |
| `utils/inviteLinks.js` | `FALLBACK_CLIENT_ID`, `GUILD_PERMISSIONS` |
| `utils/logger.js` | `LOG_FILE` |
| `utils/nameplatePalettes.js` | `NAMEPLATE_PALETTES` |
| `utils/patchNoteSource.js` | `MAX_IMAGES` |
| `utils/patchNotesCache.js` | `buildPatchMetadata` |
| `utils/shareButton.js` | `SHARE_BUTTON_ENABLED` |
| `utils/statsPanel.js` | `commandLabel` |
| `utils/timezoneData.js` | `ALL_TIMEZONES` |
| `utils/userStats.js` | `noteBuildOpened`, `noteShare` |
