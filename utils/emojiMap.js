// utils/emojiMap.js

const fs = require('fs');
const path = require('path');

// Buttons have a dedicated `emoji` field ({ id, name, animated }) — unlike Text Displays, a button's `label` is plain text only, so pasting a raw "<a:Name:123>" mention string into label just shows that literal text instead of rendering the emoji. This parses the mention strings above into the object shape ButtonBuilder/the raw API expects.
function parseEmoji(mention) {
    const match = mention.match(/^<(a)?:(\w+):(\d+)>$/);
    if (!match) return undefined;
    return { animated: !!match[1], name: match[2], id: match[3] };
}

// Every mention string below is written with the PRODUCTION app's emoji ids, which stay the literal source of truth in git. The NAMES must match the apps' emoji names, because refreshEmojiIds() re-points by name: twelve /manage emojis were renamed with a DB_ prefix by Harkirat (2026-10-18 11:59 EDT, names only, same images), which is why they read DB_* here. They are also the fallback if the sync below can't run.
const emojis = {
    // /settings' "Made with love by @dior" footer -- replaced dioreo with diorHeart (2026-07-12, same day, Harkirat's follow-up correction). Animated this time (a: prefix).
    diorHeart: '<a:diorHeart:1525941004929339594>',
    mythic: '<:7Mythic_CODM:1523190107614744757>',
    legendary: '<:5Legendary_CODM:1523190105152688158>',
    legacy: '<:6Legacy_CODM:1523190105739886663>',
    epic: '<:4Epic_CODM:1523190104489857054>',
    bp: '<:BP_CODM:1523190108386365470>',
    // 2nd Battle Pass icon -- a DIFFERENT emoji from `bp` above, not a duplicate. Was hardcoded inline in seasonend.js, which meant refreshEmojiIds() never saw it and it stayed broken on the dev bot (found 2026-07-26 15:52 EDT). Every emoji must live here to be sync-able.
    bp1: '<:BP_CODM1:1523190109065707560>',
    rank: '<:Rank_7Legendary_CODM:1523190127025717360>',
    dmz: '<:DMZ_CODM:1523190115319549963>',
    cp: '<:CP_CODM:1523190109753839637>',
    // Distinct from `cp` above -- the draw-prices redesign (drawPrices_ui.json) uses this second CP icon specifically for the quote-block total line; `cp` is left alone since nothing else was asked to switch over to the new icon.
    cp2: '<:CP_CODM2:1523190111460786318>',
    // Animated icon for the draw-prices region-toggle button (drawPrices_ui.json) -- lives in the button's `emoji` field, not its `label` (see Components V2 point 4 in CLAUDE.md). Superseded as the 3-way region switcher's per-button icon 2026-08-07 15:45 EDT by the three region-specific emoji below (Harkirat provided them via diors-notes.md); kept defined since nothing else references it.
    regions: '<a:Regions:1525705441072382052>',
    // Per-region icons for the 3-way region-switch button row (drawprices.js's buildContainer), added 2026-08-07 15:45 EDT from Harkirat's diors-notes.md request -- one distinct icon per CP tier instead of the single generic `regions` icon shared across all three buttons. Re-uploaded 2026-10-15 22:27 EDT (second set, prod ids he supplied). Replaced 2026-10-15 18:02 EDT with Harkirat's new 10CP / 20CP / 30CP set (prod ids he supplied; the dev bot re-points by name). Shared by /draw prices' region switcher and the calculator's region select and Help chips, so both change together.
    region10Cp: '<a:10CP:1560477395373400135>',
    region20Cp: '<a:20CP:1560477394081423501>',
    region30Cp: '<a:30CP:1560477392328196096>',
    // Added for the command heading redesign (calendar/draws/patchnotes/settings) /manage panel redesign (2026-07-12, per the 4 mockup JSONs in Downloads) -- these are the panel's own header/action icons, distinct from the public-command-header set above.
    database: '<a:DB_Database:1524967327437815899>',
    mngAdd: '<a:DB_Add:1525262938288558200>',
    mngEdit: '<a:DB_Edit:1525262950313623772>',
    mngDelete: '<a:DB_Delete:1525262947532931163>',
    mngBulkAdd: '<a:DB_BulkAdd:1525328428201414761>',
    mngBulkReplace: '<a:DB_BulkReplace:1525262944815022170>',
    mngBulkDelete: '<a:DB_BulkDelete:1525262942906482880>',
    mngExport: '<a:DB_Export:1525262952540934264>',
    mngPurge: '<a:DB_Purge:1525327754013442129>',
    mngInfo: '<a:DB_Info:1525337539085340722>',
    // /manage's Announcement page + each announcement's own heading (2026-08-22, Harkirat-provided). Replaces the generic `mngInfo` this page borrowed when it was built -- the empty-state notice keeps mngInfo, since that one really is an info notice rather than an announcement.
    announcements: '<a:Announcements:1540916435914723490>',
    // /bot access's panel heading AND /help's "Bot Admin" category icon (2026-08-22, Harkirat-provided) -- one icon for the admin surface in both places, replacing a literal 🔑 in one and the borrowed `database` icon in the other.
    botAccess: '<a:BotAccess:1540915865506160660>',
    mngUrls: '<a:DB_URLs:1525337321568997449>',
    calendar: '<a:Calendar:1523762208050385107>',
    newDraws: '<a:NewDraws:1523837409211453613>',
    returningDraws: '<a:ReturningDraws:1523838126596817016>',
    patchNotes: '<a:PatchNotes:1523762216954888286>',
    // One per season (2026-10-19 00:30 EDT, Harkirat), beside the season's title on /patch notes and in its history dropdown (commands/patchnotes.js seasonEmoji, keyed by the season number). Seasons 8 and 9 have no patch notes yet; theirs are here for when they do.
    season6: '<a:S6TakeYourHeart:1561594930542018611>',
    season7: '<a:S7Terminated:1561595008807735447>',
    season8: '<a:S8AgainstAllFate:1561595098767163496>',
    season9: '<a:S9VampiresVsWerewolves:1561595142425550898>',
    settings: '<a:Settings:1523762203537309696>',
    timestamp: '<a:Timestamps:1523762211103969420>',
    drawPrices: '<a:DrawPrices:1525864071776305163>',
    // /draw calculator's title icon + the two per-draw upgrade "card" icons (added 2026-08-26 17:25 EDT, Harkirat uploaded to both dev+prod apps). ⚠️ id verified live against the DEV app's boot-time refreshEmojiIds() sync only -- this worktree has no prod credentials to check against. If either ever renders as broken text on prod, re-supply the PROD id per this file's own established method (a live read of /applications/{prodAppId}/emojis before writing it), same trap this file's other entries document repeatedly.
    calculator: '<a:DrawCalc:1560743128934256680>',   // DrawCalc, 2026-10-16 18:57 EDT (Harkirat; was Calculator 1542232659940343819); every calculator title uses it
    // The Saved view's Delete All button (2026-10-16 18:57 EDT).
    deleteAll: '<a:DeleteAll:1561138182681133247>',
    // The draw calculator's Keep It / Keep Them buttons (2026-10-19 12:09 EDT, Harkirat).
    keep: '<a:Keep:1561770923760033880>',
    warn: '<a:Warn:1561783059228139530>',
    mythicCard: '<:MythicCard:1542258676889288794>',   // mythicWeapon's upgrade -- "Weapon Upgrade"
    mythicCoin: '<:MythicCoin:1542258675706757150>',   // mythicCharacter's upgrade -- "Character Upgrade"
    // COST BREAKDOWN's own inline bullet + field-separator glyphs (added 2026-08-26 23:03 EDT, matching Harkirat's own exported mockup verbatim) -- smallDot prefixes each field line, blueDash joins two fields sharing one line (Balance/Region, CP Spent/CP Needed). Both static, not animated. The toggle button's two states (added same pass): simplify shows once the breakdown is expanded, expand shows while it is collapsed -- see actionRow() in commands/drawCalculator.js.
    smallDot: '<:SmallDot_SD:1542356720070697001>',
    // The simplified view's bundle bullet (2026-10-17 17:08 EDT, his draft). Prod id read from the prod app's emoji list at his word (2026-10-17 17:20 EDT).
    whiteDotGlow: '<:WhiteDotGlow_WDG:1542356488746573824>',
    blueDash: '<:BlueDash_BD:1542356720943239188>',
    // The calculator's Full Breakdown / Simple Breakdown toggle (the second was Simplify until 2026-10-17 21:33 EDT), its only user (commands/drawCalculator.js). Replaced 2026-10-15 18:02 EDT: a new Expand, and Collapse in place of the old Simplify icon (Harkirat, prod ids supplied; the dev app no longer has a Simplify emoji).
    collapse: '<a:Collapse:1561145468824854668>',
    expand: '<a:Expand:1561145493034246174>',
    b1: '<:b1:1523852972835082371>',
    // Shared pagination arrows (utils/paginationRow.js) — used by every command with a Prev/Next page row, not just one specific command's list. /invite's "Share Link" button (2026-08-22, Harkirat-provided). Distinct from `share` above, which is the "Show Everyone" button's icon -- two different actions, two different icons.
    shareHeart: '<a:ShareHeart:1539021725784739891>',
    left: '<:Left:1523864238836154449>',
    right: '<:Right:1523864237972127775>',
    // Loadout "badges" (utils/loadoutRender.js) — Meta/Best-in-category/Top-N-in-category flags shown under the weapon name. `best` and `top` are two DISTINCT emojis (Best-in-category vs. Top-N-in-category are different tiers, see buildBadgesLine()) — don't reuse one for the other. `blank` is a zero-width spacer emoji used to separate two badges on one line without a visible bullet/divider character.
    meta: '<a:Meta:1524259849745989723>',
    best: '<a:Best:1524235235070312488>',
    top: '<a:Top:1524183479997169714>',
    toxic: '<a:Toxic:1524535298380402859>',
    // PLACEHOLDERS for the Ass and Capable badges (Harkirat, 2026-10-19 16:13 EDT: "use placeholders for now. i'll give you emojis for them later on."). Plain unicode, so refreshEmojiIds() skips them and they render on every app. utils/loadoutRender.js prefers an app emoji named `Ass` / `Capable` the moment one is uploaded, so swapping in his emojis is an upload, or a mention here.
    ass: '🫏',
    capable: '✔️',
    blank: '<:blank:1524243739206352906>',
    // "View Colors" button in /settings (utils/colorPaletteView.js, handlers/colors.js's colors_view/ colors_page_ handlers) -- blurple-recolored, background-removed eyedropper icon, per Harkirat's own design pass (2026-07-13). Uploaded by Harkirat directly, not via this bot.
    eyedropper: '<a:Eyedropper:1526293991166054541>',
    // "Show Everyone" button (utils/shareButton.js, formerly the plain 🌐 globe, 2026-07-14) -- Harkirat-provided icon, lives in the button's `emoji` field via parseEmoji(), not baked into `label` (see Components V2 point 4 above).
    share: '<a:Share:1560682903795662948>',   // re-uploaded 2026-10-16 14:31 EDT   // Harkirat's new Share icon, 2026-10-16 01:18 EDT (was the orange paper plane, 1526666464625430558)
    // Patch notes "additional info" aliasing (2026-07-30 22:24 EDT) -- typing a standalone `b:`/`n:` token in the additional-info text gets swapped for these at render time (patchnotes.js's applyInfoAliases()). Harkirat-uploaded, not animated. Patch notes' buff / nerf / fix marks swapped to his animated PN_ set (2026-10-18 13:39 EDT, Harkirat).
    buff: '<a:PN_Buff:1561432978545184928>',
    nerf: '<a:PN_Nerf:1561432951080615996>',
    // "f:" alias added 2026-08-08 00:22 EDT alongside buff/nerf, same word-boundary-guarded swap in patchnotes.js's applyInfoAliases()/formatAdditionalInfo().
    fix: '<a:PN_Fix:1561432903919996968>',
    // Section heading icons for the 3-section calendar redesign's Events/Playlists pages (2026-07-31 14:00 EDT) -- Draws reuses the existing newDraws/returningDraws emojis above.
    events: '<a:Events:1532830530108653659>',
    // Re-uploaded 2026-08-08 00:22 EDT (Harkirat deleted the old id from the portal) -- new id only, same key.
    modes: '<a:Modes:1535502470086664252>',
    // /admin's panel headings (added 2026-08-10 17:07 EDT, Harkirat provided it). Prod id as usual, verified present in BOTH apps by a live read of /applications/@me/emojis before writing it -- dev's copy is 1536468996688453752 and refreshEmojiIds() re-points to it by name at boot.
    serverSettings: '<a:ServerSettings:1536468904996774008>',
    // /manage's Bulk Format Guide headings (added 2026-07-31 17:20 EDT) -- both the rich guide panel's own top header (utils/manageGuides.js) and every page's "Guide" section heading text.
    guide: '<a:DB_Guide:1532894836301238477>',
    // The calculator's "covered" and "finished" lines (2026-10-18 13:05 EDT, Harkirat: "swap the icon used beside the 'your balance covers this' line").
    checkmark: '<a:Checkmark:1561819906205290496>',   // the CURRENT final (checkmark-icon/checkmark-clean-128.avif), swapped on prod 2026-10-19 15:14 EDT (Harkirat: "Use the current final everywhere"); was the old final 1561412941004406955
    // The calculator's Add Draws and Remove buttons (2026-10-18 13:36 EDT, Harkirat supplied both).
    plus: '<a:Plus:1560408706233933845>',
    deleteBin: '<a:DeleteBin:1560788313508683807>',
    // /help's redesign (2026-08-08 20:52 EDT) -- dioreoCombo is the landing page's own logo/wordmark icon; loadouts is the Gunsmith category header icon (distinct from the DMZ-specific `dmz` icon above, since Gunsmith now covers /all + every per-category command too, not just DMZ).
    dioreoCombo: '<:DioreoCombo:1534640183230730470>',
    // /invite's Share Link line (2026-10-18 20:15 EDT, Harkirat supplied the prod id). Unused since 2026-10-21 20:10 EDT, when he took it off that line; kept so it can come back without a new id.
    dioreoKawaii: '<:DioreoKawaii3B:1534640190491070599>',
    loadouts: '<a:Loadouts:1535779248982335618>',
    // /bot analytics' change-detail diff (added 2026-08-23 12:31 EDT, Harkirat supplied both). A git-style minus/add pair, one per value line, so a before/after reads as a diff rather than as two values with an arrow between them. 🔴 They are GLYPHS carrying meaning, which is deliberate: iOS strips ANSI colour from a code fence silently (see the successor spec's rule A), so colour can never be the thing that tells "before" from "after" -- a glyph survives. ✅ VERIFIED PROD IDS, not dev's -- the exact trap the View Colors note below records, checked rather than assumed. Method: added them, let the watching dev bot re-boot, and read refreshEmojiIds()' own counters. They went 57 -> 59 re-pointed with 0 unmatched, so both emoji exist in the dev app AND their dev ids DIFFER from the ones written here (a matching id would not have counted as a re-point). Since these came from a dev-bot session that was the live risk, and it is now ruled out by the sync's own arithmetic rather than by trust.
    diffMinus: '<:DiffMinus:1541120801892208741>',
    diffAdd: '<:DiffAdd:1541120800122339419>',
    // The View Colors panel's global/server switch button (added 2026-08-12 22:14 EDT, Harkirat provided it). Prod id as usual, verified present in BOTH apps by a live read of /applications/{id}/emojis before writing it -- dev's copy is 1537280678557917275 and refreshEmojiIds() re-points to it by name at boot. ⚠️ THE ID HARKIRAT SUPPLIED WAS THE DEV ONE, and writing that here would have been wrong in a way that hides: the name sync would mask it on every healthy boot, but its `catch` deliberately KEEPS the hardcoded ids when the sync fails, so prod would render a dev emoji exactly when something else had already gone wrong. Application emoji ids are per-application; the same name is not the same id.
    showColors: '<a:ShowColors:1537280503105847486>',
    // The Refresh Colors notice's "everything is already up to date" state (added 2026-08-12 23:41 EDT). Harkirat supplied BOTH ids this time and both were confirmed by a live read before writing -- prod 1537301451506847947 (the literal, per this file's convention) and dev 1537301616229617695, which refreshEmojiIds() re-points to by name at boot.
    swatches: '<a:Swatches:1537301451506847947>',
    // /draw calculator's "Remove this Selection" mark and its Calculate button (2026-10-14 16:51 EDT, Harkirat uploaded both to both apps and supplied both ids). The PROD ids are written here, per this file's convention; refreshEmojiIds() re-points the dev bot to its own copies (Cross 1560019354446463087, Sparkles 1560022548387856534) by name at boot.
    cross: '<:Cross:1560019185747099758>',
    // /emojis' present marks (Harkirat, 2026-10-25 21:06 EDT: "use this checkmark instead of the animated one"; uploaded to prod Dioreo by him, to the dev apps from its CDN copy the same evening).
    check: '<:Check:1564082261954138202>',
    // The Calculate button's icon (2026-10-16 14:31 EDT, Harkirat's Calculate emoji replaces Sparkles; the key was `sparkles`).
    calculate: '<a:Calculate:1560700164103217263>',
    // New Calculation's icon (2026-10-16 14:31 EDT).
    newCalc: '<a:NewCalc:1561738375352946770>',   // re-uploaded 2026-10-19 09:51 EDT (Harkirat), was 1560694028608081961
    // The calculator's Save buttons (2026-10-14 17:28 EDT, Harkirat uploaded to both apps): prod id here; the dev bot re-points to its 1560041353185075250 by name at boot.
    saveStar: '<a:Save:1560682840692105346>',   // re-uploaded 2026-10-16 14:31 EDT   // Harkirat's new Save icon, 2026-10-16 09:59 EDT (was SaveStar 1560041207177023519); the key keeps its name so every Save button follows
    // The calculator's View Saved button (2026-10-16 09:59 EDT): prod id here; the dev bot re-points by name at boot.
    viewSaved: '<a:ViewSaved:1560682871151132793>',   // re-uploaded 2026-10-16 14:31 EDT
    // The calculator's Edit Selection button (2026-10-14 19:28 EDT): prod id here; the dev bot re-points to its 1560068687942123642 by name at boot. Renamed EditCalc -> Edit on every app by Harkirat (2026-10-20 13:19 EDT); the calculator's edit buttons and /autobuild's Adjust both use it.
    edit: '<a:Edit:1560408533160296519>',
    // /draw prices' Show All Draws once a filter is set (2026-10-21 13:14 EDT, Harkirat gave this prod id; swapped for his new Return 13:41 EDT). The dev app's emoji of the same name is matched at boot.
    returnArrow: '<:Return:1562521110572961882>',
    // His icon set, uploaded to the prod and dev apps on his word (2026-10-24 00:57 EDT); prod ids here, the dev bot re-points them by name at boot. Originals in the main checkout's Logos-&-Emojis/emoji-originals/ under these names. The Gunsmith Code button and /today's footer use theirs, and the single weapon-class icons sit on Copy Attachments by the build's class (2026-10-24 01:06 EDT, utils/loadoutRender.js). The split halves and the attachment icons are unused (his word: attachments "uploaded and unused for now"). GunsmithCode was REPLACED with his new art 2026-10-25 22:32 EDT (same name; the old one archived in Cloudinary and offline). Prod ids since 2026-10-25 23:07 EDT (uploaded to prod Dioreo over the VM on his 23:05 EDT word; prod Dioreo Admin holds no token on the VM, so that app still lacks them).
    gunsmithCode: '<a:GunsmithCode:1564113023025676308>',
    // His three new icons (2026-10-25 22:32 EDT): GunsmithSearch on /gunsmith's Search... button, CopyAttachments on Copy Attachments, Search as the general search icon (/emojis' Find...). Prod ids, like the rest of this map. AVIF uploads come back animated, hence `a:`.
    gunsmithSearch: '<a:GunsmithSearch:1564113024225255454>',
    copyAttachments: '<a:CopyAttachments:1564113025747918880>',
    search: '<a:Search:1564113027245281424>',
    // /gunsmith's build-number buttons, his static Number1-Number6 (2026-10-25 22:47 EDT); Prod ids.
    number1: '<:Number1:1564113028293726300>',
    number2: '<:Number2:1564113029606547466>',
    number3: '<:Number3:1564113030600589444>',
    number4: '<:Number4:1564113031162630178>',
    number5: '<:Number5:1564113032752275486>',
    number6: '<:Number6:1564113033918287944>',
    // His reminder set and the mascot's tada (uploaded 2026-10-24 18:16 EDT to Dioreo, Dioreo (Dev) and Dioreo Admin (Dev)): Remind titles the /remind panel and the reminder DMs, RemindAlert marks a heads-up or a warning, AddReminder is the icon-only bell button, ReminderEnabled marks what you follow and turning reminders on, DisableReminder marks turning them off. DioreoTada is uploaded and not used yet.
    dioreoTada: '<a:DioreoTada:1563677558589882510>',
    remind: '<a:Remind:1563677560431452180>',
    remindAlert: '<a:RemindAlert:1563677561697992724>',
    // His Set timezone icon (2026-10-25 00:19 EDT: "here's the emoji for the 'Set timezone' button… rename to 'Timezone'"); prod id, the dev bot re-points by name. Original: Diors-Builds/Logos-&-Emojis/emoji-originals/Timezone.avif.
    timezone: '<a:Timezone:1563768937202716695>',
    addReminder: '<a:AddReminder:1563677562683654214>',
    disableReminder: '<a:DisableReminder:1563677563988213831>',
    reminderEnabled: '<a:ReminderEnabled:1563677565070217247>',
    dailyUpdate: '<a:DailyUpdate:1563415690738802690>',
    attAmmunition: '<a:Att_Ammunition:1563415633805189180>',
    attBarrel: '<a:Att_Barrel:1563415634904350761>',
    attLaser: '<a:Att_Laser:1563415636258852904>',
    attMuzzle: '<a:Att_Muzzle:1563415637458423858>',
    attOptic: '<a:Att_Optic:1563415638532296825>',
    attPerk: '<a:Att_Perk:1563415639706701866>',
    attRearGrip: '<a:Att_RearGrip:1563415641312985118>',
    attStock: '<a:Att_Stock:1563415642302849024>',
    attUnderbarrel: '<a:Att_Underbarrel:1563415645276868678>',
    wcAR: '<a:WC_AR:1563415646144823437>',
    wcLMG: '<a:WC_LMG:1563415647940116530>',
    wcMarksman: '<a:WC_Marksman:1563415649051742239>',
    wcPistol: '<a:WC_Pistol:1563415650331000903>',
    wcShotgun: '<a:WC_Shotgun:1563415651605938268>',
    wcSMG: '<a:WC_SMG:1563415652717568020>',
    wcSniper: '<a:WC_Sniper:1563415653644505168>',
    wcARFlat1: '<a:WC_AR_Flat1:1563415654609059972>',
    wcARFlat2: '<a:WC_AR_Flat2:1563415655678611516>',
    wcARTilt1: '<a:WC_AR_Tilt1:1563415657389756557>',
    wcARTilt2: '<a:WC_AR_Tilt2:1563415659210350623>',
    wcLMGFlat1: '<a:WC_LMG_Flat1:1563415660002934796>',
    wcLMGFlat2: '<a:WC_LMG_Flat2:1563415661344985098>',
    wcLMGTilt1: '<a:WC_LMG_Tilt1:1563415662674583572>',
    wcLMGTilt2: '<a:WC_LMG_Tilt2:1563415663794716703>',
    wcMarksmanFlat1: '<a:WC_Marksman_Flat1:1563415665279508640>',
    wcMarksmanFlat2: '<a:WC_Marksman_Flat2:1563415666583805962>',
    wcMarksmanTilt1: '<a:WC_Marksman_Tilt1:1563415667808665700>',
    wcMarksmanTilt2: '<a:WC_Marksman_Tilt2:1563415668970496110>',
    wcPistolFlat1: '<a:WC_Pistol_Flat1:1563415670182387732>',
    wcPistolFlat2: '<a:WC_Pistol_Flat2:1563415671407116398>',
    wcPistolTilt1: '<a:WC_Pistol_Tilt1:1563415672598437978>',
    wcPistolTilt2: '<a:WC_Pistol_Tilt2:1563415674192396309>',
    wcShotgunFlat1: '<a:WC_Shotgun_Flat1:1563415675815329862>',
    wcShotgunFlat2: '<a:WC_Shotgun_Flat2:1563415676876488808>',
    wcShotgunTilt1: '<a:WC_Shotgun_Tilt1:1563415678105550878>',
    wcShotgunTilt2: '<a:WC_Shotgun_Tilt2:1563415679430823936>',
    wcSMGFlat1: '<a:WC_SMG_Flat1:1563415680919932978>',
    wcSMGFlat2: '<a:WC_SMG_Flat2:1563415681696014437>',
    wcSMGTilt1: '<a:WC_SMG_Tilt1:1563415683302424676>',
    wcSMGTilt2: '<a:WC_SMG_Tilt2:1563415684275249182>',
    wcSniperFlat1: '<a:WC_Sniper_Flat1:1563415685420417034>',
    wcSniperFlat2: '<a:WC_Sniper_Flat2:1563415686527848500>',
    wcSniperTilt1: '<a:WC_Sniper_Tilt1:1563415687832146001>',
    wcSniperTilt2: '<a:WC_Sniper_Tilt2:1563415689295958127>',
    // /calendar's status dots (2026-10-21 14:34 EDT, Harkirat: "Red with strike through for finished events, green for live, white for upcoming"); prod ids read from the prod app's emoji list, the dev app's are matched by name. lightBlueDotGlow (below) marks upcoming since 2026-10-23 14:42 EDT; whiteDotGlow stays for /admin's "follows the server".
    greenDotGlow: '<:GreenDotGlow_GDG:1542356494220140685>',
    redDotGlow: '<:RedDotGlow_RDG:1542356487882416248>',
    // /today's Ending soon and Going live headings (2026-10-23 11:51 EDT). Prod ids read from the prod app's emoji list at his word (2026-10-23 12:04 EDT); the dev app's are matched by name. Images saved in the main checkout's Logos-&-Emojis/emoji-originals/.
    yellowDotGlow: '<:YellowDotGlow_YDG:1542356489761464421>',
    blueDotGlow: '<:BlueDotGlow_BDG:1542356493347586159>',
    // Upcoming, on /calendar and /today alike (2026-10-23 14:42 EDT, Harkirat picked shade B, #7CC4FF, between the white and blue dots: "i want a sort of middle ground"). The original is Logos-&-Emojis/emoji-originals/LightBlueDotGlow_LBDG.png. Uploaded to the prod app 2026-10-23 14:43 EDT (his word, 14:42 EDT: "upload the dot to prod and dev apps"); the dev app has its own copy, re-pointed by name.
    lightBlueDotGlow: '<:LightBlueDotGlow_LBDG:1563261559776739452>',
    // /draw prices' Filter and Filter Again (2026-10-21 13:41 EDT, Harkirat's prod id; the dev app's Filter is matched by name).
    filter: '<:Filter:1562521111579590736>',
    // One icon for both copy-out buttons (2026-10-15 23:37 EDT, Harkirat): the loadout card's Copy Code and the calculator's Export. Prod id here; the dev bot re-points by name at boot.
    copyExport: '<a:CopyExport:1560682776305471600>',   // re-uploaded 2026-10-16 14:31 EDT
};

const DEV_OVERRIDE_FILE = path.join(__dirname, 'emojiMap.dev.json');

/**
 * Re-points every mention string above at the ids owned by the app we actually booted as, matching on emoji NAME.
 *
 * Why this exists: these are Discord APPLICATION emojis, and an application emoji only renders for the app that owns it. The dev bot (a separate Discord application) has its own copies of all 72 emojis under identical names but DIFFERENT ids, so the hardcoded prod ids above render as broken text there. Matching on name means one codebase serves both apps with no per-environment config, and it self-heals if an emoji is ever deleted and re-uploaded (which mints a new id).
 *
 * On prod this is a no-op that rewrites nothing — the ids already match. Deliberately fail-soft: any error leaves the hardcoded prod ids in place rather than taking the bot down over cosmetics.
 *
 * Mutates the exported object IN PLACE on purpose. Every consumer reads `emojis.foo` at render time (per interaction), not at require time, so in-place rewriting reaches all of them without a single call-site change.
 *
 * @param {import('discord.js').Client} client a logged-in client
 * @returns {Promise<{synced: number, missing: string[], overridden: number}>}
 */
async function refreshEmojiIds(client, { secondary = false } = {}) {
    const result = { synced: 0, missing: [], overridden: 0 };
    const appId = client.application?.id ?? client.user?.id;
    // The public app (the default) rewrites the map above in place, as it always has. A SECONDARY app (Dioreo Admin, 2026-10-19 13:44 EDT) gets its own copy instead, so neither app's sync clobbers the other's ids; the export below answers from it while an admin-app interaction is running.
    const target = secondary ? { ...emojis } : emojis;

    try {
        // Raw route string rather than `Routes.applicationEmojis(...)` -- the helper's availability varies across discord.js minors, the endpoint itself doesn't.
        const res = await client.rest.get(`/applications/${appId}/emojis`);
        const live = res?.items ?? res ?? [];
        const byName = new Map(live.map(e => [e.name, e]));
        if (secondary) secondaryLiveByName.set(appId, byName);
        else liveByName = byName;

        for (const [key, value] of Object.entries(target)) {
            if (typeof value !== 'string') continue;
            const parsed = parseEmoji(value);
            if (!parsed) continue;
            const match = byName.get(parsed.name);
            if (!match) { result.missing.push(`${key} (:${parsed.name}:)`); continue; }
            const next = `<${match.animated ? 'a' : ''}:${match.name}:${match.id}>`;
            if (next !== value) { target[key] = next; result.synced++; }
        }
        if (secondary) secondaryMaps.set(appId, target);
    } catch (err) {
        console.error('⚠️  Emoji id sync skipped, keeping hardcoded ids:', err?.message || err);
        return result;
    }
    if (secondary) return result;   // the dev overlay below is for the default app's map only

    // Dev-only overlay, applied AFTER the name sync so it wins. Lets a dev-bot session point individual keys at throwaway test emojis that don't exist on prod at all, without editing (and risking committing) the tracked map above. Gitignored; absent in normal operation.
    if (process.env.NODE_ENV === 'development') {
        try {
            if (fs.existsSync(DEV_OVERRIDE_FILE)) {
                const overrides = JSON.parse(fs.readFileSync(DEV_OVERRIDE_FILE, 'utf8'));
                for (const [key, mention] of Object.entries(overrides)) {
                    if (typeof mention !== 'string' || !parseEmoji(mention)) {
                        console.warn(`⚠️  emojiMap.dev.json: "${key}" is not a valid emoji mention, ignored`);
                        continue;
                    }
                    emojis[key] = mention;
                    result.overridden++;
                }
            }
        } catch (err) {
            console.error('⚠️  emojiMap.dev.json could not be read, ignoring it:', err?.message || err);
        }
    }

    return result;
}

// The live app's emojis by name, kept from the last refreshEmojiIds() run, for repoint() below.
let liveByName = null;

// A SECONDARY app's map and live emojis, keyed by application id (Dioreo Admin, 2026-10-19 13:44 EDT). Application emojis render only for the app that owns them, so an admin-app panel needs the admin app's ids. Which app is answering comes from the router's per-interaction context (utils/requestContext.js, `appId` = interaction.applicationId), which follows every await of the click, including passiveExpiry's timer, which is created inside the render. Outside an interaction, or for the public app, the default map answers.
const secondaryMaps = new Map();
const secondaryLiveByName = new Map();
function currentAppId() {
    try { return require('./requestContext').getContext()?.appId ?? null; } catch { return null; }
}

// Re-points ONE stored mention at the booted app's own copy, matching on name, the same rule refreshEmojiIds applies to the map above. For a mention that lives in the database rather than in this file: a season emoji typed into /manage on prod carries prod's id, and the dev bot's clone of that data would show it as broken text. Unknown name, or before the first sync: the mention comes back unchanged.
function repoint(mention) {
    const parsed = typeof mention === 'string' ? parseEmoji(mention) : undefined;
    const live = secondaryLiveByName.get(currentAppId()) || liveByName;
    const match = parsed && live?.get(parsed.name);
    return match ? `<${match.animated ? 'a' : ''}:${match.name}:${match.id}>` : mention;
}

emojis.parseEmoji = parseEmoji;
emojis.refreshEmojiIds = refreshEmojiIds;
emojis.repoint = repoint;

// The booted app's emoji with this exact name, or null when the app has none. For an emoji that may not exist on an app yet (the Rank Mode marks, utils/rankModes.js): a missing one renders as plain text at its call site instead of a dead mention, and appears the moment it is uploaded, after the next boot's sync.
function byName(name) {
    const live = secondaryLiveByName.get(currentAppId()) || liveByName;
    const match = live?.get(name);
    return match ? `<${match.animated ? 'a' : ''}:${match.name}:${match.id}>` : null;
}
emojis.byName = byName;

// The bot's own status glyphs in place of the Unicode ones (Harkirat, 2026-10-20 12:41 EDT, "dont patch the instance. figure out the class!": ⚠️ ❌ ✅ kept reappearing one string at a time). Call it on text at the moment it is SENT, never when it is composed, so the id is the running app's (memory project_emoji_require_time_capture). Only these three have a bot equivalent; anything else passes through.
function glyphs(text) {
    if (typeof text !== 'string') return text;
    const m = module.exports;
    return text.replace(/⚠️|⚠/g, m.warn).replace(/❌/g, m.cross).replace(/✅/g, m.checkmark);
}
emojis.glyphs = glyphs;

// Every consumer reads `emojis.foo` at render time, so answering from the current app's map here reaches all of them with no call-site change. Writes and key listings go to the default map, as before.
module.exports = new Proxy(emojis, {
    get(target, key, receiver) {
        if (typeof key === 'string' && secondaryMaps.size) {
            const map = secondaryMaps.get(currentAppId());
            if (map && typeof map[key] === 'string') return map[key];
        }
        return Reflect.get(target, key, receiver);
    },
});