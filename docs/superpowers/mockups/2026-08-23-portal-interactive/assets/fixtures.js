/* assets/fixtures.js — the data every page reads.
 *
 * 🔴 THE RULE THIS FILE EXISTS TO ENFORCE (COMPANION §3.9): a fixture a human TYPES is a
 * fixture a human can INVENT. Armory and Analytics were moved onto exported data on
 * 2026-08-24 after hand-authored ones produced errors that changed the design; Season,
 * Broadcast and Access followed the same day, and for the same reason — the authored ones
 * carried a draw with a start AND an end (the schema has one `date`), an announcement with
 * a `title` and a `body` (the schema has one `text`), and an `editor` role that exists
 * nowhere in this system at all.
 *
 * Regenerate with:  node .export-fixtures.mjs > /tmp/block.js
 * Do not hand-edit anything inside the EXPORTED block. Derived helpers live below it.
 */
window.FIX = (function () {

  /* ══════════════════════ EXPORTED, NOT AUTHORED ══════════════════════
   * Everything from here to the end of this comment's block was written by
   * .export-fixtures.mjs reading mongodb://localhost:27017/diors-builds-dev and the
   * bot's own registries. Do not hand-edit — re-run the script. Exported 2026-08-24 17:26Z.
   * Counts at export: 3 new draws · 11 returning · 23 calendar rows
   * · 2 patch notes · 4 announcements · 3 granted admins · 0 live sessions.
   * ══════════════════════════════════════════════════════════════════ */
  const season = {"currentSeasonTitle":"Season 7 — Terminated","bpTitle":"BP Season 7: Terminated","rankTitle":"Ranked Series 2 2026","dmzTitle":"DMZ Season 1","bpEnd":"2026-09-10","rankEnd":"2026-09-10","dmzEnd":"2026-11-11","bpEndTBD":false,"rankEndTBD":false,"dmzEndTBD":false,"drawsBannerUrl":"https://media.discordapp.net/attachments/666276040976629761/1532092355207888976/RDT_20260729_21244171742366302560126.jpg?ex=6a777532&is=6a7623b2&hm=23caab865174f411b5865d7095982a1e38435a368f701823f9a74cc0223557c9&=&format=webp","eventsBannerUrl":"https://media.discordapp.net/attachments/666276040976629761/1531453373545578736/HOReGcDWYAAfwJB.jpg?ex=6a77c519&is=6a767399&hm=8c5c2ac4ed58fb53d405f68d77d3000cabb6899e964a8a9252c39b3bc043c4cb&=&format=webp","playlistsBannerUrl":"https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1786150319/calendar_banners/playlists.webp"};
  const newDraws = [{"_id":"6a6ca13efa1395786556f815","title":"Judgment Day - It Goes Two","date":"2026-08-07","thumbnailUrl":"https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1785454766/temp_draws/judgment-day-it-goes-two.jpg","items":[{"tier":"legendary","name":"HS0405 - Final Judgement"},{"tier":"epic","name":"Model T-800"},{"tier":"legendary","name":"BP50 - Mimetic Execution"},{"tier":"epic","name":"Model T-1000"},{"tier":"comment","name":"Acquire Both Terminators to Unlock Their Legendary Features"}]},{"_id":"6a6ca13efa1395786556f81b","title":"Undead Legion Series Armory","date":"2026-08-11","thumbnailUrl":"https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1785455202/temp_draws/undead-legion-series-armory.jpg","items":[{"tier":"legendary","name":"Krig-6 - Revenant Vanguard"},{"tier":"legendary","name":"FFAR - Revenant Reavers"},{"tier":"legendary","name":"MG82 - Revenant Warlords"},{"tier":"legendary","name":"SKS - Revenant Conquerors"}]},{"_id":"6a6ca13efa1395786556f820","title":"The Widow's Bite Draw","date":"2026-09-01","thumbnailUrl":"https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1785455202/temp_draws/the-widow-s-bite-draw.png","items":[{"tier":"legendary","name":"Cronen Squall - Widow’s Bite"},{"tier":"epic","name":"Lyra - Widow’s Sentinel"}]}];
  const returningDraws = [{"_id":"6a6bfdccab1ccccca215b188","title":"Molten Fusion Draw","date":"2026-08-09","thumbnailUrl":"https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1785462147/temp_draws/molten-fusion-draw.jpg","items":[{"tier":"legendary","name":"AK117 - Meltdown"},{"tier":"epic","name":"Seraph - Sicaria"}]},{"_id":"6a6bfdccab1ccccca215b18e","title":"Thermal Core Draw","date":"2026-08-13","thumbnailUrl":"https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1785462147/temp_draws/thermal-core-draw.jpg","items":[{"tier":"legendary","name":"M4 - Thermal Shroud"},{"tier":"epic","name":"Kreuger - Jungle Scarred"}]},{"_id":"6a6bfdccab1ccccca215b194","title":"Deepstar Wraith Mythic Drop","date":"2026-08-14","thumbnailUrl":"https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1785504469/temp_draws/deepstar-wraith-mythic-drop.jpg","items":[{"tier":"mythic","name":"Type 25 - Deepstar Piercer"},{"tier":"epic","name":"Tiangu - Deepstar Assassin"}]},{"_id":"6a6bfdccab1ccccca215b19a","title":"Double Tap Draw","date":"2026-08-16","thumbnailUrl":"https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1785462147/temp_draws/double-tap-draw.jpg","items":[{"tier":"legendary","name":"DL Q33 - Zealot"},{"tier":"legendary","name":"QQ9 - Melting Point"},{"tier":"epic","name":"Grinch - Nightfang"}]},{"_id":"6a6bfdccab1ccccca215b1a0","title":"Longquan Sword Draw","date":"2026-08-18","thumbnailUrl":"https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1785462147/temp_draws/longquan-sword-draw.jpg","items":[{"tier":"legendary","name":"Sword - Darkheart"},{"tier":"epic","name":"CBR4 - Flawless"}]},{"_id":"6a6bfdccab1ccccca215b1a3","title":"Girls Frontline Draw","date":"2026-08-21","thumbnailUrl":"https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1785462219/temp_draws/girls-frontline-draw.jpg","items":[{"tier":"legendary","name":"ASM10 - Sleek Defiance"},{"tier":"epic","name":"Scylla - Shadow Of Deception"}]},{"_id":"6a6bfdccab1ccccca215b1a6","title":"Void Implosion Draw","date":"2026-08-22","thumbnailUrl":"https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1785504995/temp_draws/void-implosion-draw.jpg","items":[{"tier":"legendary","name":"M4 - Void Implosion"},{"tier":"epic","name":"Dusk - Otherworld Ensemble"},{"tier":"comment","name":"*aka* Jupiter Cannon Draw"}]},{"_id":"6a6bfde3ab1ccccca215b234","title":"Wisterian Visage Draw","date":"2026-08-22","thumbnailUrl":"https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1785504951/temp_draws/wisterian-visage-draw.jpg","items":[{"tier":"legendary","name":"ICR-1 - Wisterian Visage"},{"tier":"epic","name":"Kestral - Twilight Symphony"},{"tier":"comment","name":"*aka* Midnight Crescendo Draw"}]},{"_id":"6a6bfde3ab1ccccca215b237","title":"Bloody Seas Draw","date":"2026-08-25","thumbnailUrl":"https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1785462243/temp_draws/bloody-seas-draw.jpg","items":[{"tier":"legendary","name":"USS 9 - Spectral Seas"},{"tier":"epic","name":"Nyx - Bloodlace"}]},{"_id":"6a6bfde3ab1ccccca215b23d","title":"Dawnbringer Mythic Drop","date":"2026-08-28","thumbnailUrl":"https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1785505087/temp_draws/dawnbringer-mythic-drop.webp","items":[{"tier":"mythic","name":"Sophia - Dawn's Renewal"},{"tier":"legendary","name":"CBR4 - Faithful Dawn"}]},{"_id":"6a6bfde3ab1ccccca215b240","title":"Chaos & Order Mythic Drop","date":"2026-09-04","thumbnailUrl":"https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1785462243/temp_draws/chaos-order-mythic-drop.jpg","items":[{"tier":"mythic","name":"Oden - Divine Smite"},{"tier":"epic","name":"Prophet - Arbiter"}]}];
  const calendar = [{"_id":"6a767a873e75f88cec77da80","title":"Hardpoint Mayhem MP Mode","date":"2026-08-06","endDate":"2026-08-19","isOngoing":false,"category":"playlist","isDoubleCP":false},{"_id":"6a767a873e75f88cec77da81","title":"COD Point Rush Week 1","date":"2026-08-06","endDate":"2026-08-12","isOngoing":false,"category":"event","isDoubleCP":false},{"_id":"6a767a873e75f88cec77da82","title":"Nuketown Dedicated MP Playlist","date":"2026-08-06","endDate":"2026-08-12","isOngoing":false,"category":"playlist","isDoubleCP":false},{"_id":"6a767a873e75f88cec77da84","title":"Hardcore Collection MP Playlist","date":"2026-08-06","endDate":"2026-08-12","isOngoing":false,"category":"playlist","isDoubleCP":false},{"_id":"6a767a873e75f88cec77da85","title":"Lockdown BR Mode","date":"2026-08-06","endDate":"2026-09-09","isOngoing":false,"category":"playlist","isDoubleCP":false},{"_id":"6a767a873e75f88cec77da86","title":"Krai BR","date":"2026-08-06","endDate":"2026-08-19","isOngoing":false,"category":"playlist","isDoubleCP":false},{"_id":"6a767a873e75f88cec77da87","title":"Terminator 2 Themed Event","date":"2026-08-07","endDate":"2026-08-30","isOngoing":false,"category":"event","isDoubleCP":false},{"_id":"6a767a873e75f88cec77da88","title":"Judgment Day - It Goes Two Draw","date":"2026-08-07","endDate":null,"isOngoing":true,"category":"draw","isDoubleCP":false},{"_id":"6a767a873e75f88cec77da89","title":"Undead Legion Series Armory","date":"2026-08-11","endDate":"2026-09-19","isOngoing":false,"category":"draw","isDoubleCP":false},{"_id":"6a767a873e75f88cec77da8a","title":"Nuketown 10v10 MP Playlist","date":"2026-08-13","endDate":"2026-08-19","isOngoing":false,"category":"playlist","isDoubleCP":false},{"_id":"6a767a873e75f88cec77da8b","title":"RC Car Racing MP Mode","date":"2026-08-13","endDate":"2026-08-26","isOngoing":false,"category":"playlist","isDoubleCP":false},{"_id":"6a767a873e75f88cec77da8c","title":"Cranked MP Mode","date":"2026-08-13","endDate":"2026-08-26","isOngoing":false,"category":"playlist","isDoubleCP":false},{"_id":"6a767a873e75f88cec77da8d","title":"COD Point Rush Week 2","date":"2026-08-13","endDate":"2026-08-19","isOngoing":false,"category":"event","isDoubleCP":false},{"_id":"6a767a873e75f88cec77da83","title":"Attack of the Undead MP Mode","date":"2026-08-20","endDate":"2026-08-26","isOngoing":false,"category":"playlist","isDoubleCP":false},{"_id":"6a767a873e75f88cec77da8e","title":"Operator Skill Overdrive MP Mode","date":"2026-08-20","endDate":"2026-09-09","isOngoing":false,"category":"playlist","isDoubleCP":false},{"_id":"6a767a873e75f88cec77da8f","title":"Rebirth Island BR","date":"2026-08-20","endDate":"2026-09-09","isOngoing":false,"category":"playlist","isDoubleCP":false},{"_id":"6a767a873e75f88cec77da90","title":"Attack of the Undead MP Mode","date":"2026-08-20","endDate":"2026-08-26","isOngoing":false,"category":"playlist","isDoubleCP":false},{"_id":"6a767a873e75f88cec77da91","title":"COD Point Rush Week 3","date":"2026-08-20","endDate":"2026-08-26","isOngoing":false,"category":"event","isDoubleCP":false},{"_id":"6a767a873e75f88cec77da92","title":"Safeguard MP Mode","date":"2026-08-27","endDate":"2026-09-02","isOngoing":false,"category":"playlist","isDoubleCP":false},{"_id":"6a767a873e75f88cec77da93","title":"Ground War MP Mode","date":"2026-08-27","endDate":"2026-09-09","isOngoing":false,"category":"playlist","isDoubleCP":false},{"_id":"6a767a873e75f88cec77da94","title":"COD Point Rush Week 4","date":"2026-08-27","endDate":"2026-09-02","isOngoing":false,"category":"event","isDoubleCP":false},{"_id":"6a767a873e75f88cec77da95","title":"Widow's Bite Draw","date":"2026-09-01","endDate":"2026-09-14","isOngoing":false,"category":"draw","isDoubleCP":false},{"_id":"6a767a873e75f88cec77da96","title":"COD Point Rush Week 5","date":"2026-09-03","endDate":"2026-09-09","isOngoing":false,"category":"event","isDoubleCP":false}];
  const patchNotes = [{"_id":"6a4bd78c9b44d22e27107d2c","title":"Season 6 — Take Your Heart","titleOverride":"","description":"","releaseDate":"2026-07-06T16:27:56.919Z","images":["https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1784513838/patch_notes/6a4bd78c9b44d22e27107d2c/0.webp","https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1784513838/patch_notes/6a4bd78c9b44d22e27107d2c/1.webp","https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1784513839/patch_notes/6a4bd78c9b44d22e27107d2c/2.webp","https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1784513840/patch_notes/6a4bd78c9b44d22e27107d2c/3.webp","https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1784513840/patch_notes/6a4bd78c9b44d22e27107d2c/4.webp"]},{"_id":"6a6740f9c6d8d2d12145bba4","title":"Season 7 — Terminated","titleOverride":"","description":"# Fennec (DMZ only), Ultra Extended Mag, n: Ammo capacity reduced from 40 Rounds to 20 Rounds\n#AK47 (DMZ only), Ultra 5.45 Mag, B: Increased blunt damage to body when hitting Armor\n# LK24, OWC Marksman Barrel, f: Fixed Damage Multiplier Error\n# Wildcard, Skill Overdrive, b: Reduced Operator Skill cost, b: Reduced Operator charge loss on death, Overkill, f: Fixed an issue that caused abnormal weapon swap speed","releaseDate":"2026-07-22T11:20:00.000Z","images":["https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1785151737/patch_notes/6a6740f9c6d8d2d12145bba4/0.webp","https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1785151738/patch_notes/6a6740f9c6d8d2d12145bba4/1.webp","https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1785151739/patch_notes/6a6740f9c6d8d2d12145bba4/2.webp","https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1785151740/patch_notes/6a6740f9c6d8d2d12145bba4/3.webp","https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1785151741/patch_notes/6a6740f9c6d8d2d12145bba4/4.webp","https://res.cloudinary.com/dr6dn61eh/image/upload/v1786156364/patch_notes/6a6740f9c6d8d2d12145bba4/5.png"]}];
  const draft = {"active":false,"currentSeasonTitle":"","bpTitle":"Battle Pass","rankTitle":"Ranked Series","dmzTitle":"DMZ Season","bpEnd":null,"rankEnd":null,"dmzEnd":null,"bpEndTBD":false,"rankEndTBD":false,"dmzEndTBD":false,"newDraws":0,"returningDraws":0,"calendar":0};
  const announcements = [{"_id":"6a8b3ed48c812c59751d92e4","text":"SESSIONB-SEED S6 wrap-up — thanks for playing season 6.","createdAt":"2026-07-14T18:41:24.976Z","createdBy":"1139845545754632283","expiresAt":"2026-08-11T18:41:24.976Z","startsAt":null,"color":3373990,"state":"expired","reach":0},{"_id":"6a8b3ed48c812c59751d92e1","text":"SESSIONB-SEED Season 7 is live — Reckoning drops today: new draws, a reworked ranked reset, and the battle pass runs to Sep 4.","createdAt":"2026-08-04T18:41:24.976Z","createdBy":"1139845545754632283","expiresAt":null,"startsAt":null,"color":15909424,"state":"live","reach":0},{"_id":"6a8b3ed48c812c59751d92e2","text":"SESSIONB-SEED Double CP this weekend — 2x CP on every purchase from Aug 11 to Aug 15. Use /draw calculator to price a pull first.","createdAt":"2026-08-14T18:41:24.976Z","createdBy":"1139845545754632283","expiresAt":"2026-08-25T18:41:24.976Z","startsAt":null,"color":2067038,"state":"live","reach":0},{"_id":"6a8b3ed48c812c59751d92e3","text":"SESSIONB-SEED Clan wars sign-ups open Aug 24 and close Aug 31.","createdAt":"2026-08-22T18:41:24.976Z","createdBy":"411000000000000001","expiresAt":"2026-09-02T18:41:24.976Z","startsAt":"2026-08-26T18:41:24.976Z","color":9071569,"state":"scheduled","reach":0}];
  const accessAdmins = [{"discordId":"411000000000000002","grants":{"manage":{"direct":false,"inherited":false,"held":false},"autobuild":{"direct":false,"inherited":false,"held":false},"bot":{"direct":false,"inherited":false,"held":false},"manage.draws":{"direct":false,"inherited":false,"held":false},"manage.calendar":{"direct":true,"inherited":false,"held":true},"manage.loadouts_mp":{"direct":false,"inherited":false,"held":false},"manage.loadouts_dmz":{"direct":false,"inherited":false,"held":false},"manage.patchnotes":{"direct":false,"inherited":false,"held":false},"manage.seasondraft":{"direct":false,"inherited":false,"held":false},"manage.season":{"direct":false,"inherited":false,"held":false},"manage.announcement":{"direct":true,"inherited":false,"held":true}},"permissions":["manage.calendar","manage.announcement"],"grantedBy":"1139845545754632283","note":"SESSIONB-SEED calendar helper","grantedAt":"2026-08-23"},{"discordId":"411000000000000001","grants":{"manage":{"direct":true,"inherited":false,"held":true},"autobuild":{"direct":false,"inherited":false,"held":false},"bot":{"direct":true,"inherited":false,"held":true},"manage.draws":{"direct":false,"inherited":true,"held":true},"manage.calendar":{"direct":false,"inherited":true,"held":true},"manage.loadouts_mp":{"direct":false,"inherited":true,"held":true},"manage.loadouts_dmz":{"direct":false,"inherited":true,"held":true},"manage.patchnotes":{"direct":false,"inherited":true,"held":true},"manage.seasondraft":{"direct":false,"inherited":true,"held":true},"manage.season":{"direct":false,"inherited":true,"held":true},"manage.announcement":{"direct":false,"inherited":true,"held":true}},"permissions":["manage","bot"],"grantedBy":"1139845545754632283","note":"SESSIONB-SEED moderator","grantedAt":"2026-08-23"},{"discordId":"411000000000000003","grants":{"manage":{"direct":false,"inherited":false,"held":false},"autobuild":{"direct":false,"inherited":false,"held":false},"bot":{"direct":false,"inherited":false,"held":false},"manage.draws":{"direct":false,"inherited":false,"held":false},"manage.calendar":{"direct":false,"inherited":false,"held":false},"manage.loadouts_mp":{"direct":true,"inherited":false,"held":true},"manage.loadouts_dmz":{"direct":true,"inherited":false,"held":true},"manage.patchnotes":{"direct":false,"inherited":false,"held":false},"manage.seasondraft":{"direct":false,"inherited":false,"held":false},"manage.season":{"direct":false,"inherited":false,"held":false},"manage.announcement":{"direct":false,"inherited":false,"held":false}},"permissions":["manage.loadouts_mp","manage.loadouts_dmz"],"grantedBy":"1139845545754632283","note":"SESSIONB-SEED gunsmith","grantedAt":"2026-08-23"}];
  const accessScopes = [{"key":"manage","label":"Manage","kind":"command"},{"key":"autobuild","label":"Autobuild","kind":"command"},{"key":"bot","label":"Bot","kind":"command"},{"key":"manage.draws","label":"Draws","kind":"page"},{"key":"manage.calendar","label":"Calendar","kind":"page"},{"key":"manage.loadouts_mp","label":"MP","kind":"page"},{"key":"manage.loadouts_dmz","label":"DMZ","kind":"page"},{"key":"manage.patchnotes","label":"Patch Notes","kind":"page"},{"key":"manage.seasondraft","label":"Season Draft","kind":"page"},{"key":"manage.season","label":"Season","kind":"page"},{"key":"manage.announcement","label":"Announcement","kind":"page"}];
  const spof = [{"scope":"manage","discordId":"411000000000000001"},{"scope":"bot","discordId":"411000000000000001"},{"scope":"manage.draws","discordId":"411000000000000001"},{"scope":"manage.patchnotes","discordId":"411000000000000001"},{"scope":"manage.seasondraft","discordId":"411000000000000001"},{"scope":"manage.season","discordId":"411000000000000001"}];
  const sessions = [];
  const changeLogRows = [{"changeId":"Aug22-28","page":"draws","action":"add","model":"SeasonalData","target":"Test Draw","summary":"Added new draw \"Test Draw\"","undone":false,"at":"2026-08-22T19:38:26.181Z","inverseType":"draw.delete"},{"changeId":"Aug22-27","page":"draws","action":"edit","model":"SeasonalData","target":"Deepstar Wraith Mythic Drop","summary":"Edited draw \"Deepstar Wraith Mythic Drop\"","undone":false,"at":"2026-08-22T19:37:23.040Z","inverseType":"draw.edit"},{"changeId":"Aug22-26","page":"announcement","action":"delete","model":"Announcement","target":"CTXVERIFY Edited","summary":"Deleted an announcement","undone":false,"at":"2026-08-22T03:32:48.752Z","inverseType":"announcement.post"},{"changeId":"Aug22-25","page":"announcement","action":"delete","model":"Announcement","target":"CTXVERIFY Bad Order","summary":"Deleted an announcement","undone":false,"at":"2026-08-22T03:32:48.725Z","inverseType":"announcement.post"},{"changeId":"Aug22-24","page":"announcement","action":"add","model":"Announcement","target":"CTXVERIFY Bad Order","summary":"Posted a new announcement","undone":false,"at":"2026-08-22T03:32:48.699Z","inverseType":"announcement.delete"},{"changeId":"Aug22-23","page":"announcement","action":"edit","model":"Announcement","target":"CTXVERIFY Edited","summary":"Edited an announcement","undone":false,"at":"2026-08-22T03:32:48.672Z","inverseType":"announcement.edit"},{"changeId":"Aug22-22","page":"announcement","action":"add","model":"Announcement","target":"CTXVERIFY Announcement","summary":"Posted a new announcement","undone":false,"at":"2026-08-22T03:32:48.636Z","inverseType":"announcement.delete"},{"changeId":"Aug22-21","page":"loadouts_mp","action":"bulkDelete","model":"Loadout","target":"1 builds","summary":"Deleted 1 loadouts in bulk","undone":false,"at":"2026-08-22T03:32:48.601Z","inverseType":"loadout.bulkAdd"},{"changeId":"Aug22-20","page":"loadouts_mp","action":"edit","model":"Loadout","target":"CTXVERIFY Rifle (Test)","summary":"Edited loadout \"CTXVERIFY Rifle (Test)\"","undone":false,"at":"2026-08-22T03:32:48.567Z","inverseType":"loadout.edit"},{"changeId":"Aug22-19","page":"loadouts_mp","action":"add","model":"Loadout","target":"CTXVERIFY Rifle (Test)","summary":"Added loadout \"CTXVERIFY Rifle (Test)\"","undone":false,"at":"2026-08-22T03:32:48.524Z","inverseType":"loadout.delete"},{"changeId":"Aug22-18","page":"calendar","action":"delete","model":"SeasonalData","target":"CTXVERIFY Event Renamed","summary":"Deleted calendar event \"CTXVERIFY Event Renamed\"","undone":false,"at":"2026-08-22T03:32:48.491Z","inverseType":"calendar.add"},{"changeId":"Aug22-17","page":"calendar","action":"edit","model":"SeasonalData","target":"CTXVERIFY Event","summary":"Edited calendar event \"CTXVERIFY Event\"","undone":false,"at":"2026-08-22T03:32:48.463Z","inverseType":"calendar.edit"}];
  const MANAGE_ACTIONS = {"draws":[{"id":"addnew","label":"Add New","kind":"modal","slash":true},{"id":"addreturning","label":"Add Returning","kind":"modal","slash":true},{"id":"edit","label":"Edit","kind":"modal","slash":true},{"id":"delete","label":"Delete","kind":"modal","slash":true},{"id":"bulkadd","label":"Add Multiple","kind":"modal","slash":true},{"id":"bulkreplace","label":"Replace Multiple","kind":"modal","slash":true},{"id":"bulkdelete","label":"Delete Multiple","kind":"modal","slash":true},{"id":"purgenew","label":"Purge New Draws Only","kind":"confirm","slash":false},{"id":"purgereturning","label":"Purge Returning Draws Only","kind":"confirm","slash":false},{"id":"purgeall","label":"Purge All Draws Data","kind":"confirm","slash":false},{"id":"exportnew","label":"Export New Draws","kind":"file","slash":true},{"id":"exportreturning","label":"Export Returning Draws","kind":"file","slash":true},{"id":"formatguide","label":"Guide","kind":"view","slash":true}],"calendar":[{"id":"add","label":"Add","kind":"modal","slash":true},{"id":"edit","label":"Edit","kind":"modal","slash":true},{"id":"delete","label":"Delete","kind":"modal","slash":true},{"id":"addmultiple","label":"Add","kind":"modal","slash":true},{"id":"replacemultiple","label":"Replace","kind":"modal","slash":true},{"id":"deletemultiple","label":"Delete","kind":"modal","slash":true},{"id":"banners","label":"Banners","kind":"modal","slash":true},{"id":"purge","label":"Purge","kind":"confirm","slash":false},{"id":"export","label":"Export","kind":"file","slash":true},{"id":"formatguide","label":"Guide","kind":"view","slash":true}],"loadouts_mp":[{"id":"add","label":"Add","kind":"modal","slash":true},{"id":"edit","label":"Edit","kind":"modal","slash":true},{"id":"delete","label":"Delete","kind":"modal","slash":true},{"id":"bulkadd","label":"Add","kind":"modal","slash":true},{"id":"bulkreplace","label":"Replace","kind":"modal","slash":true},{"id":"bulkdelete","label":"Delete","kind":"modal","slash":true},{"id":"exportupto5","label":"Up To 5","kind":"modal","slash":true},{"id":"exportcategory","label":"Category","kind":"modal","slash":true},{"id":"exportall","label":"All","kind":"file","slash":true},{"id":"formatguide","label":"Guide","kind":"view","slash":true}],"loadouts_dmz":[{"id":"add","label":"Add","kind":"modal","slash":true},{"id":"edit","label":"Edit","kind":"modal","slash":true},{"id":"delete","label":"Delete","kind":"modal","slash":true},{"id":"bulkadd","label":"Add","kind":"modal","slash":true},{"id":"bulkreplace","label":"Replace","kind":"modal","slash":true},{"id":"bulkdelete","label":"Delete","kind":"modal","slash":true},{"id":"exportupto5","label":"Up To 5","kind":"modal","slash":true},{"id":"exportcategory","label":"Category","kind":"modal","slash":true},{"id":"exportall","label":"All","kind":"file","slash":true},{"id":"formatguide","label":"Guide","kind":"view","slash":true}],"patchnotes":[{"id":"dateinfo","label":"Date/Info","kind":"modal","slash":true},{"id":"urls1","label":"URLs 1","kind":"modal","slash":true},{"id":"urls2","label":"URLs 2","kind":"modal","slash":true},{"id":"addseason","label":"Add New Season","kind":"modal","slash":true},{"id":"purge","label":"Purge","kind":"confirm","slash":false},{"id":"formatguide","label":"Guide","kind":"view","slash":true}],"seasondraft":[{"id":"settitles","label":"Titles & Deadlines","kind":"modal","slash":true},{"id":"bulkdraws","label":"Draws","kind":"modal","slash":true},{"id":"bulkcalendar","label":"Calendar","kind":"modal","slash":true},{"id":"promote","label":"Promote to Live","kind":"confirm","slash":false},{"id":"discard","label":"Discard Draft","kind":"confirm","slash":false},{"id":"formatguide","label":"Guide","kind":"view","slash":true}],"announcement":[{"id":"post","label":"Post New Announcement","kind":"modal","slash":true},{"id":"formatguide","label":"Guide","kind":"view","slash":true}]};
  const OP_TYPES = ["draw.add","draw.delete","draw.edit","draw.bulkAdd","draw.bulkReplace","draw.bulkDelete","draw.purge","calendar.add","calendar.delete","calendar.edit","calendar.bulkAdd","calendar.bulkReplace","calendar.bulkDelete","calendar.setBanners","calendar.purge","loadout.add","loadout.edit","loadout.delete","loadout.bulkAdd","loadout.bulkReplace","loadout.bulkDelete","patchnote.setDateInfo","patchnote.setUrls1","patchnote.setUrls2","patchnote.addSeason","patchnote.removeSeason","patchnote.restoreSeason","patchnote.editSeason","patchnote.purge","patchnote.restore","season.setTitlesDeadlines","season.startNew","season.promoteDraft","season.restoreSnapshot","season.discardDraft","season.restoreDraft","season.setDraftTitlesDeadlines","season.bulkDraftDraws","season.bulkDraftCalendar","announcement.post","announcement.edit","announcement.delete"];
  const OP_TIERS = {"draw.add":1,"draw.delete":1,"draw.edit":1,"draw.bulkAdd":2,"draw.bulkReplace":2,"draw.bulkDelete":2,"draw.purge":3,"calendar.add":1,"calendar.delete":1,"calendar.edit":1,"calendar.bulkAdd":2,"calendar.bulkReplace":2,"calendar.bulkDelete":2,"calendar.setBanners":1,"calendar.purge":3,"loadout.add":1,"loadout.edit":1,"loadout.delete":1,"loadout.bulkAdd":2,"loadout.bulkReplace":2,"loadout.bulkDelete":2,"patchnote.setDateInfo":1,"patchnote.setUrls1":1,"patchnote.setUrls2":1,"patchnote.addSeason":2,"patchnote.removeSeason":2,"patchnote.restoreSeason":2,"patchnote.editSeason":1,"patchnote.purge":3,"patchnote.restore":3,"season.setTitlesDeadlines":1,"season.startNew":3,"season.promoteDraft":3,"season.restoreSnapshot":3,"season.discardDraft":2,"season.restoreDraft":2,"season.setDraftTitlesDeadlines":1,"season.bulkDraftDraws":2,"season.bulkDraftCalendar":2,"announcement.post":1,"announcement.edit":1,"announcement.delete":1};
  const PERM_TOKENS = ["manage","autobuild","bot","manage.draws","manage.calendar","manage.loadouts_mp","manage.loadouts_dmz","manage.patchnotes","manage.seasondraft","manage.season","manage.announcement"];
  const OWNER_ID = "1139845545754632283";
  /* ═══════════════════ SEASON — derived, never a second copy ═══════════════════ */

  /* The three deadline lines season.setTitlesDeadlines edits, in modal order.
   * Season End is Neon Amber in the bot; Ranked is MP red and DMZ is DMZ blue, sampled from
   * those two emoji. Using blue for Ranked (as an earlier draft did) actively contradicted the
   * bot, where blue means DMZ. */
  const LINES = [
    { key:'bp',   label:'BATTLE PASS', titleKey:'bpTitle',   endKey:'bpEnd',   tbdKey:'bpEndTBD',   hex:'#F2994A' },
    { key:'rank', label:'RANKED',      titleKey:'rankTitle', endKey:'rankEnd', tbdKey:'rankEndTBD', hex:'#FF3430' },
    { key:'dmz',  label:'DMZ',         titleKey:'dmzTitle',  endKey:'dmzEnd',  tbdKey:'dmzEndTBD',  hex:'#337BA6' }
  ];

  /* ⚠️ FOUR TIERS, LOWERCASE, PLUS ONE THING THAT IS NOT A TIER. utils/adminParser.js's
   * resolveTier stores the full lowercase word; TIER_SHORTHAND is its reverse, used to rebuild
   * bulk text. `comment` is the "-# note" item type — free text rendered as Discord subtext,
   * NOT a rarity — and the real data has three of them ("Acquire Both Terminators…",
   * "*aka* Jupiter Cannon Draw", "*aka* Midnight Crescendo Draw"). An earlier fixture invented
   * ['LEG','EPIC'] abbreviations and had no concept of a comment at all, so every one of those
   * three would have rendered as a rarity badge. */
  const TIERS = {
    mythic:    { label:'Mythic',    short:'m',  hex:'#FF4FD8' },
    legendary: { label:'Legendary', short:'l',  hex:'#F2C230' },
    legacy:    { label:'Legacy',    short:'lg', hex:'#8FA1B3' },
    epic:      { label:'Epic',      short:'e',  hex:'#AE72E0' }
  };
  const TIER_ORDER = ['mythic', 'legendary', 'legacy', 'epic'];
  const isComment = (it) => it.tier === 'comment';

  /* ⚠️ SIX LANES, AND THREE OF THEM HOLD POINTS. This is the correction that changed the
   * design rather than just the field names. models/SeasonalData.js gives a draw ONE field —
   * `date` — and no end at all; only a `calendar` row has both `date` and `endDate`. The
   * shipped portal (portal/ui/season.js's toTrackItems) papers over this by synthesising
   * `startDate: item.date` and letting barGeometry's `Math.max(1, …)` floor render a draw as a
   * 1%-wide band, which still reads as a duration. A draw is a RELEASE, so it gets a marker.
   * See COMPANION §5.2. */
  const LANES = [
    { key:'newDraws',       label:'New draws',    kind:'point', hex:'#AE72E0', source:'newDraws' },
    { key:'returningDraws', label:'Returning',    kind:'point', hex:'#E8639B', source:'returningDraws' },
    { key:'drawWindow',     label:'Draw windows', kind:'span',  hex:'#6B4E7D', source:"calendar category:'draw'" },
    { key:'event',          label:'Events',       kind:'span',  hex:'#4A90D9', source:"calendar category:'event'" },
    { key:'playlist',       label:'Playlists',    kind:'span',  hex:'#2CC4C4', source:"calendar category:'playlist'" },
    { key:'patchNotes',     label:'Patch notes',  kind:'point', hex:'#F2C230', source:'patchNotes' }
  ];
  /* `type` is an ALIAS of `key`, kept because the Track, the Board and the Manifest all index
   * lanes by it. One alias in one place beats renaming the same concept at 20 call sites. */
  LANES.forEach(l => { l.type = l.key; l.bar = l.hex; });
  const LANE_BY_KEY = Object.fromEntries(LANES.map(l => [l.key, l]));
  const TYPE_LABEL = Object.fromEntries(LANES.map(l => [l.key, l.label]));

  /* utils/search.js's isSameDrawTitle, ported verbatim — NOT the generic fuzzyMatch every
   * other search route uses. commands/calendar.js's getDrawSectionEntries dedupes explicit
   * calendar draw rows against newDraws/returningDraws with exactly this, and real title pairs
   * routinely fail a substring test: the live data holds "The Widow's Bite Draw" (a draw) and
   * "Widow's Bite Draw" (its calendar row). Two shared DISTINCTIVE words, never one. */
  const GENERIC_DRAW_WORDS = new Set(['draw','draws','drop','drops','series','armory','armories',
                                      'redux','mythic','double','the','and','for','with','from','into']);
  const distinctiveDrawTokens = (title) => new Set(
    (title || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
      .filter(w => w.length >= 3 && !GENERIC_DRAW_WORDS.has(w)));
  function isSameDrawTitle(a, b) {
    const A = distinctiveDrawTokens(a), B = distinctiveDrawTokens(b);
    let shared = 0; for (const w of A) if (B.has(w)) shared++;
    return shared >= 2;
  }

  /* 🔴 THE ONE PLACE the six arrays become one list. Every Season surface reads this, so a
   * lane rule cannot be right on the Track and wrong on the Manifest.
   *
   * `windowId` / `drawId` are the LINK commands/calendar.js's auto-merge computes at render
   * time: a draw with no matching explicit calendar row is served SYNTHETIC and tagged
   * `dateOnly: true`, which renders as "Releases <date>" and — per isEventEnded — NEVER counts
   * as ended. That is the single most useful thing this page can show an admin, and no
   * hand-authored fixture could ever have surfaced it: 11 of the 14 real draws have no window. */
  /* Where an open-ended bar is DRAWN to. Not a fake end date — `openEnded` is what the Track
   * reads to strip the bar's right edge, exactly as Broadcast does for expiresAt: null. This is
   * only so the geometry has a number. */
  const HORIZON = '2027-06-30';

  function seasonItems() {
    const out = [];
    const drawRows = calendar.filter(e => e.category === 'draw');
    const pushDraw = (d, laneKey) => {
      const win = drawRows.find(e => isSameDrawTitle(e.title, d.title)) || null;
      out.push({ id:d._id, lane:laneKey, kind:'point', title:d.title, date:d.date,
                 thumbnailUrl:d.thumbnailUrl, items:d.items,
                 windowId: win ? win._id : null, dateOnly: !win,
                 tiers: TIER_ORDER.filter(t => d.items.some(i => i.tier === t)),
                 comments: d.items.filter(isComment).length });
    };
    newDraws.forEach(d => pushDraw(d, 'newDraws'));
    returningDraws.forEach(d => pushDraw(d, 'returningDraws'));
    for (const e of calendar) {
      const laneKey = e.category === 'draw' ? 'drawWindow' : e.category;
      const draw = e.category === 'draw'
        ? ([...newDraws, ...returningDraws].find(d => isSameDrawTitle(e.title, d.title)) || null) : null;
      out.push({ id:e._id, lane:laneKey, kind:'span', title:e.title, date:e.date, endDate:e.endDate,
                 isOngoing:e.isOngoing, isDoubleCP:e.isDoubleCP, category:e.category,
                 drawId: draw ? draw._id : null, orphan: e.category === 'draw' && !draw });
    }
    for (const n of patchNotes) {
      /* patchnotes.js's displayTitle(): ALWAYS `titleOverride || title`, never title alone. */
      out.push({ id:n._id, lane:'patchNotes', kind:'point', title:(n.titleOverride || n.title),
                 baseTitle:n.title, titleOverride:n.titleOverride, date:(n.releaseDate || '').slice(0, 10),
                 description:n.description, images:n.images, imageCount:n.images.length });
    }
    /* The Track/Board/Manifest read `name`/`type`/`start`/`end`; the schema says `title`/`lane`/
     * `date`/`endDate`. Aliased HERE, once, rather than renamed at 20 call sites — and for a
     * POINT, start === end, which is the honest encoding of "this has no duration" rather than
     * the shipped portal's synthetic startDate + a Math.max(1,…) width floor that still paints a
     * draw as a short band. renderers test `kind === 'point'` and draw a marker. */
    for (const it of out) {
      it.name  = it.title;
      it.type  = it.lane;
      it.start = it.date;
      /* 🔴 A SPAN CAN HAVE NO endDate, AND THE SCHEMA MEANS SOMETHING SPECIFIC BY IT.
       * `isOngoing: true` is the "All Season" bulk entry — endDate is null and
       * commands/calendar.js's isEventEnded resolves it against bpEnd instead (and never, while
       * bpEndTBD). The live document has exactly one: "Judgment Day - It Goes Two Draw". Leaving
       * `end` null put a null into every date computation on the page and rendered a literal
       * "NaN days" — caught by the audit, not by reading the code. */
      it.openEnded = it.kind === 'span' && !it.endDate && (!it.isOngoing || season.bpEndTBD);
      it.end = it.kind !== 'span' ? it.date
             : it.endDate ? it.endDate
             : (it.isOngoing && !season.bpEndTBD && season.bpEnd) ? season.bpEnd
             : HORIZON;
      it.state = 'saved';          // nothing in the live document is portal-staged
      it.draft = false;            // the real draft is INACTIVE — see `draft.active` above
      it.detail = it.kind === 'point' && it.items
        ? `${it.items.length} item${it.items.length === 1 ? '' : 's'}`
        : it.imageCount !== undefined ? `${it.imageCount} image${it.imageCount === 1 ? '' : 's'}`
        : it.isOngoing ? 'runs all season'
        : it.isDoubleCP ? '2× CP' : '—';
    }
    return out;
  }
  const items = seasonItems();

  /* ═══ SEASON REPAIRS ═══ the same mechanical/judgement split Armory uses, and every check
   * below fires on the REAL document — which is the entire argument for exporting fixtures.
   * A set of tidy hand-written draws has no duplicate row, no expiring banner and no draw
   * missing its window, so none of these findings could have been discovered by designing
   * against one. Two checks correctly report ZERO, and both are load-bearing rather than
   * decorative: see their notes. */
  const CP_TOKEN = '(?:cp|cod\\s*points?)';
  const DOUBLE_CP = new RegExp(`\\b(?:2\\s*x\\s*${CP_TOKEN}|${CP_TOKEN}\\s*x?\\s*2|double\\s*${CP_TOKEN})\\b`, 'i');
  function seasonRepairs() {
    const spans = items.filter(i => i.kind === 'span');
    const draws = items.filter(i => i.lane === 'newDraws' || i.lane === 'returningDraws');
    const bpEnd = season.bpEnd;
    const seen = new Map();
    const dupes = [];
    for (const e of calendar) {
      const k = e.title.toLowerCase() + '|' + e.date;
      if (seen.has(k)) dupes.push({ id:e._id, label:e.title, why:`identical to ${seen.get(k)} — same title, same start` });
      else seen.set(k, e._id.slice(-6));
    }
    return [
      { id:'dupe-calendar', kind:'mechanical', label:'Duplicate calendar rows',
        note:'Same title, same start date. /calendar renders both, so a player sees the entry twice.',
        hits: dupes },
      { id:'expiring-banner', kind:'mechanical', label:'Banner on an expiring Discord link',
        note:'A media.discordapp.net URL is SIGNED — it carries an `ex=` parameter and 404s once that passes. utils/calendarBannerCache.js re-hosts these through Cloudinary; these never went through it.',
        hits: BANNERS.filter(b => bannerHost(season[b.key]) === 'discord')
                     .map(b => ({ id:b.key, label:`${b.label} banner`, why:'signed Discord CDN link — will expire' })) },
      { id:'past-bp', kind:'mechanical', label:'Runs past the battle pass',
        note:`Ends after ${bpEnd || 'the battle-pass end, which is not set'}. Not automatically wrong — a DMZ or ranked-tail event legitimately can — but it is the one thing a season calendar cannot show you.`,
        hits: !bpEnd ? [] : spans.filter(i => i.endDate && i.endDate > bpEnd)
                     .map(i => ({ id:i.id, label:i.title, why:`ends ${i.endDate}, ${Math.round((new Date(i.endDate) - new Date(bpEnd)) / 86400000)} days past` })) },
      { id:'orphan-window', kind:'mechanical', label:'Draw window with no draw',
        note:"An explicit calendar draw row matching no entry in newDraws/returningDraws. commands/calendar.js defaults an orphan's drawType to 'new' — arbitrary, and stated as such in its own comment. Reports zero here, and CAN fire: rename any draw and its window orphans immediately.",
        hits: items.filter(i => i.lane === 'drawWindow' && i.orphan)
                   .map(i => ({ id:i.id, label:i.title, why:'matches no draw by isSameDrawTitle' })) },
      { id:'no-window', kind:'judgement', label:'Draw served synthetic',
        note:'No explicit calendar row, so commands/calendar.js synthesises a `dateOnly` entry that renders as "Releases <date>" — and isEventEnded() returns false for it FOREVER. It leaves /calendar only when the season rollover drops it from the array. That is by design; whether you want it is the judgement.',
        hits: draws.filter(i => i.dateOnly).map(i => ({ id:i.id, label:i.title, why:`releases ${i.date}, no window, never ends` })) },
      { id:'untagged-2xcp', kind:'judgement', label:'Looks like a 2× CP event, not flagged',
        note:'isDoubleCP drives /draw calculator\'s pricing, so a miss quotes someone the wrong purchase. The rule needs BOTH a CP token AND a doubling indicator — corrected twice live on 2026-08-22 because "CP Rebate Offer" is not a 2× event and neither is "2x Weapon XP". Reports zero here, and that is the corrected rule WORKING: five "COD Point Rush" rows carry a CP token and no doubling word.',
        hits: spans.filter(i => !i.isDoubleCP && DOUBLE_CP.test(i.title))
                   .map(i => ({ id:i.id, label:i.title, why:'title matches the 2× CP pattern' })) }
    ];
  }

  /* commands/calendar.js's isEventEnded, verbatim — the ONLY definition of "ended" on this
   * page. A dateOnly draw never ends; an isOngoing row ends when the battle pass does (and
   * never, while bpEndTBD). Anything else compares its own endDate. */
  function isEventEnded(it, nowMs) {
    if (it.dateOnly) return false;
    if (it.kind === 'point') return false;
    if (it.isOngoing) { if (season.bpEndTBD) return false; return Boolean(season.bpEnd) && new Date(season.bpEnd).getTime() <= nowMs; }
    return it.endDate ? new Date(it.endDate).getTime() <= nowMs : false;
  }

  /* The Season banners, as a list, because two of the three real values are the finding.
   * A media.discordapp.net URL is a SIGNED link with an `ex=` expiry parameter — it 404s once
   * that passes. utils/calendarBannerCache.js exists to re-host these through Cloudinary, and
   * two of the three never went through it. */
  const BANNERS = [
    { key:'drawsBannerUrl',     label:'Draws',     page:'calendar' },
    { key:'eventsBannerUrl',    label:'Events',    page:'calendar' },
    { key:'playlistsBannerUrl', label:'Playlists', page:'calendar' }
  ];
  const bannerHost = (url) => !url ? 'none'
    : url.includes('res.cloudinary.com') ? 'cloudinary'
    : /(?:media|cdn)\.discordapp\.(?:net|com)/.test(url) ? 'discord' : 'external';

  const destroys = [...newDraws, ...returningDraws].slice(0, 4).map(d => ({
    name: d.title, meta: `${d.items.length} item${d.items.length === 1 ? '' : 's'} · releases ${d.date}` }));

  /* ═══ ARMORY ═══ ⚠️ THESE ARE REAL DOCUMENTS, exported from the dev collection
   * (mongodb://localhost:27017/diors-builds-dev, 133 loadouts) on 2026-08-24 — not invented.
   * An earlier version of this file made them up, and the invented shapes were WRONG in ways
   * that changed the design: `attachments` is an ARRAY OF NAMES, never a count; `categoryRank`
   * is 'best'/'top{N}', never S/A/B; `buildName` is a variant label like "Build 1", not a code;
   * `shareCode` is the real 10-character Gunsmith code. Field names and values below are the
   * schema's, verbatim (models/Loadout.js). */

  /* The REAL collection profile, for anything that needs to reason about scale:
   *   133 loadouts — 125 MP, 8 DMZ
   *   MP by category: AR 35 · SMG 26 · SNIPER 19 · MARKSMAN 14 · LMG 12 · SHOTGUN 10 · SECONDARIES 9
   *   categoryRank values in use: null · best · top3 · top4 · top5
   *   dmzRangeRank values in use: null · best-close · best-midlong · top3 · top5
   *   attachments per build: 123 have exactly 5; the rest run 1, 4, 6, 7, 8, 9
   *   34 meta · 10 toxic · 123 carry a shareCode · 2 carry a description · 0 carry attachmentSlots
   *   1 imageKey is a full external URL; the rest are bare Cloudinary keys, some with a .png suffix */
  const LOADOUT_STATS = { total:133, MP:125, DMZ:8,
    byCategory:{ AR:35, SMG:26, SNIPER:19, MARKSMAN:14, LMG:12, SHOTGUN:10, SECONDARIES:9 },
    withCode:123, withDesc:2, withSlots:0, meta:34, toxic:10 };

  /* Cloudinary delivery, copied from utils/loadoutRender.js's buildImageUrl() so the portal
   * and the bot cannot disagree about where an image lives. */
  const CLOUD_BASE = 'https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1/';
  const imageUrl = k => !k ? '' : (k.startsWith('http') ? k : CLOUD_BASE + k);

  /* The badge grammar, exactly as utils/adminParser.js's parseLoadoutBadges() accepts it.
   * `best` and `top{N}` are mutually exclusive tiers of one ranking; meta and toxic are
   * independent flags. DMZ builds never set categoryRank; MP builds never set dmzRangeRank. */
  const BADGE_TOKENS = ['meta', 'best', 'toxic', 'top3', 'top4', 'top5'];
  const DMZ_RANGE_TOKENS = ['best-close', 'best-midlong', 'top3-close', 'top3-midlong', 'top5-close', 'top5-midlong'];
  const RANK_ORDER = ['best', 'top3', 'top4', 'top5', null];
  const RANK_LABEL = { best:'Best in category', top3:'Top 3', top4:'Top 4', top5:'Top 5', null:'Unranked' };

  const CATS = [
    { key:'AR',          label:'Assault',      hex:'#FF3B5C' },
    { key:'SMG',         label:'SMG',          hex:'#FFD23F' },
    { key:'LMG',         label:'LMG',          hex:'#845EC2' },
    { key:'MARKSMAN',    label:'Marksman',     hex:'#3DDC97' },
    { key:'SNIPER',      label:'Sniper',       hex:'#4361EE' },
    { key:'SHOTGUN',     label:'Shotgun',      hex:'#F6A93B' },
    { key:'SECONDARIES', label:'Secondaries',  hex:'#3E6E8E' }   // #023047 lifted to carry text
  ];

  const builds = [
    { id:"6a4c692095a4f5a6c3375488", weaponKey:"locus", weaponName:"LOCUS", category:"SNIPER", mode:"MP", buildName:"Build 1",
      attachments:["YKM Lightweight Short", "OWC Skeleton Stock", "Strippled Grip Tape", "Stopping Power Reload", "FMJ"],
      attachmentSlots:[], imageKey:"LOCUS-1",
      description:"No suppressor build... FMJ allows 1 tap through walls.", shareCode:"2A4B5A8C9C",
      isMeta:true, isToxic:false, categoryRank:"best", dmzRangeRank:null, lastUpdated:"2026-04-08" },
    { id:"6a4c692095a4f5a6c3375489", weaponKey:"locus", weaponName:"LOCUS", category:"SNIPER", mode:"MP", buildName:"Build 2",
      attachments:["YKM Lightweight Short", "OWC Skeleton Stock", "Strippled Grip Tape", "Stopping Power Reload", "OWC Light Supressor"],
      attachmentSlots:[], imageKey:"LOCUS-2",
      description:"Suppressed build... this cannot 1 tap wallbang.", shareCode:"1B2A4B8C9C",
      isMeta:true, isToxic:false, categoryRank:"best", dmzRangeRank:null, lastUpdated:"2026-04-08" },
    { id:"6a4c692095a4f5a6c33754d0", weaponKey:"switchbladex9", weaponName:"SWITCHBLADE X9", category:"SMG", mode:"MP", buildName:"Build 1",
      attachments:["Monolithic Suppressor", "MIP Extended Light Barrel", "YKM Light Stock", "Extended Mag A", "Granulated Grip Tape"],
      attachmentSlots:[], imageKey:"SWITCHBLADE-X9-1.png",
      description:"", shareCode:"1C2C4A8A9A",
      isMeta:true, isToxic:false, categoryRank:"best", dmzRangeRank:null, lastUpdated:"2026-04-08" },
    { id:"6a4c692095a4f5a6c33754d1", weaponKey:"switchbladex9", weaponName:"SWITCHBLADE X9", category:"SMG", mode:"MP", buildName:"Build 2",
      attachments:["Tactical Suppressor", "MIP Extended Light Barrel", "Extended Mag A", "Granulated Grip Tape", "Disable"],
      attachmentSlots:[], imageKey:"SWITCHBLADE-X9-2.png",
      description:"", shareCode:"1A2C5F8A9A",
      isMeta:true, isToxic:false, categoryRank:"best", dmzRangeRank:null, lastUpdated:"2026-04-08" },
    { id:"6a4c692095a4f5a6c337548e", weaponKey:"man-o-war", weaponName:"MAN-O-WAR", category:"AR", mode:"MP", buildName:"Build 1",
      attachments:["OWC Light Suppressor", "MIP Strike Stock", "Thermite Ammo", "Granulated Grip Tape", "Wounding"],
      attachmentSlots:[], imageKey:"MAN-O-WAR-1.png",
      description:"", shareCode:"1B4C5C8C9A",
      isMeta:true, isToxic:true, categoryRank:null, dmzRangeRank:null, lastUpdated:"2026-04-08" },
    { id:"6a4c692095a4f5a6c337548f", weaponKey:"man-o-war", weaponName:"MAN-O-WAR", category:"AR", mode:"MP", buildName:"Build 2",
      attachments:["OWC Light Suppressor", "MIP Light Barrel (Short)", "Thermite Ammo", "Granulated Grip Tape", "Wounding"],
      attachmentSlots:[], imageKey:"MAN-O-WAR-2.png",
      description:"", shareCode:"1B2A5C8C9A",
      isMeta:true, isToxic:true, categoryRank:null, dmzRangeRank:null, lastUpdated:"2026-04-08" },
    { id:"6a4c692095a4f5a6c33754ae", weaponKey:"na-45", weaponName:"NA-45", category:"SNIPER", mode:"MP", buildName:"Build 1",
      attachments:["OWC Light Compensator", "RTC Steady Stock", "Light Trigger", "High Explosive Ammo", "Sleight of Hand"],
      attachmentSlots:[], imageKey:"NA-45-1.png",
      description:"", shareCode:"1C4C5A7G8C",
      isMeta:false, isToxic:true, categoryRank:null, dmzRangeRank:null, lastUpdated:"2026-04-08" },
    { id:"6a4c692095a4f5a6c33754df", weaponKey:"striker", weaponName:"STRIKER", category:"SHOTGUN", mode:"MP", buildName:"Build 1",
      attachments:["Choke", "RTC Retractable Barrel", "Granulated Grip Tape", "RTC Laser 1mW", "Fast Reload Reload Case"],
      attachmentSlots:[], imageKey:"STRIKER-1.png",
      description:"", shareCode:"1F2C6A8B9A",
      isMeta:true, isToxic:true, categoryRank:"best", dmzRangeRank:null, lastUpdated:"2026-04-08" },
    { id:"6a4c692095a4f5a6c3375493", weaponKey:"dr-h", weaponName:"DR-H", category:"AR", mode:"MP", buildName:"Build 1",
      attachments:["Tactical Suppressor", "OWC Ranger", "No Stock", "25 Round OTM Mag", "Granulated Grip Tape"],
      attachmentSlots:[], imageKey:"DR-H-1.png",
      description:"", shareCode:"1A2B4A8C9A",
      isMeta:true, isToxic:false, categoryRank:"top3", dmzRangeRank:null, lastUpdated:"2026-04-08" },
    { id:"6a4c692095a4f5a6c3375494", weaponKey:"dr-h", weaponName:"DR-H", category:"AR", mode:"MP", buildName:"Build 2",
      attachments:["Tactical Suppressor", "OWC Ranger", "MIP Strike Stock", "25 Round OTM Mag", "Granulated Grip Tape"],
      attachmentSlots:[], imageKey:"DR-H-2.png",
      description:"", shareCode:"1A2B4D8C9A",
      isMeta:true, isToxic:false, categoryRank:"top3", dmzRangeRank:null, lastUpdated:"2026-04-08" },
    { id:"6a4c692095a4f5a6c33754b4", weaponKey:"lw3-tundra", weaponName:"LW3-TUNDRA", category:"SNIPER", mode:"MP", buildName:"Build 1",
      attachments:["28.2\" Tiger Team", "Bandit Steady Stock", "7 Rnd", "Serpent Wrap", "FMJ"],
      attachmentSlots:[], imageKey:"LW3-TUNDRA-1.png",
      description:"", shareCode:"2F4D5A8A9E",
      isMeta:true, isToxic:false, categoryRank:"top3", dmzRangeRank:null, lastUpdated:"2026-04-08" },
    { id:"6a4c692095a4f5a6c33754b5", weaponKey:"lw3-tundra", weaponName:"LW3-TUNDRA", category:"SNIPER", mode:"MP", buildName:"Build 2",
      attachments:["26.5\" Hammer Forged", "Bandit Steady Stock", "Striker Foregrip", "7 Rnd", "Serpent Wrap"],
      attachmentSlots:[], imageKey:"LW3-TUNDRA-2.png",
      description:"", shareCode:"2B4D7B8A9E",
      isMeta:true, isToxic:false, categoryRank:"top3", dmzRangeRank:null, lastUpdated:"2026-04-08" },
    { id:"6a4c692095a4f5a6c3375490", weaponKey:"kn-44", weaponName:"KN-44", category:"AR", mode:"MP", buildName:"Build 1",
      attachments:["Monolithic Suppressor", "OWC Ranger", "No Stock", "38 Round Fast Reload", "Granulated Grip Tape"],
      attachmentSlots:[], imageKey:"KN-44-1.png",
      description:"", shareCode:"1C2B4A8B9A",
      isMeta:false, isToxic:false, categoryRank:"top5", dmzRangeRank:null, lastUpdated:"2026-04-08" },
    { id:"6a4c692095a4f5a6c3375491", weaponKey:"hvk-30", weaponName:"HVK-30", category:"AR", mode:"MP", buildName:"Build 1",
      attachments:["Monolithic Suppressor", "MIP Light", "MIP Strike Stock", "Large Caliber Ammo", "Granulated Grip Tape"],
      attachmentSlots:[], imageKey:"HVK-30-1.png",
      description:"", shareCode:"1C2A4C8C9A",
      isMeta:false, isToxic:false, categoryRank:"top5", dmzRangeRank:null, lastUpdated:"2026-04-08" },
    { id:"6a4c692095a4f5a6c3375492", weaponKey:"hvk-30", weaponName:"HVK-30", category:"AR", mode:"MP", buildName:"Build 2",
      attachments:["Monolithic Suppressor", "OWC Marksman", "YKM Combat Stock", "Large Caliber Ammo", "Granulated Grip Tape"],
      attachmentSlots:[], imageKey:"HVK-30-2.png",
      description:"", shareCode:"1C2B4B8C9A",
      isMeta:false, isToxic:false, categoryRank:"top5", dmzRangeRank:null, lastUpdated:"2026-04-08" },
    { id:"6a4c692095a4f5a6c3375499", weaponKey:"oden", weaponName:"ODEN", category:"AR", mode:"MP", buildName:"Build 1",
      attachments:["Monolithic Suppressor", "YKM Combat Stock", "Operator Foregrip", "Granulated Grip Tape", "FMJ"],
      attachmentSlots:[], imageKey:"ODEN-1.png",
      description:"", shareCode:"1D4B5A7C9A",
      isMeta:false, isToxic:false, categoryRank:"top5", dmzRangeRank:null, lastUpdated:"2026-04-08" },
    { id:"6a4c692095a4f5a6c337548b", weaponKey:"lk24", weaponName:"LK24", category:"AR", mode:"MP", buildName:"Build 1",
      attachments:["Tactical Suppressor", "OWC Ranger", "No Stock", "50 Round Extended Mag", "Granulated Grip Tape"],
      attachmentSlots:[], imageKey:"LK24-1.png",
      description:"", shareCode:"1A2A4A8B9A",
      isMeta:true, isToxic:false, categoryRank:"top4", dmzRangeRank:null, lastUpdated:"2026-04-08" },
    { id:"6a4c692095a4f5a6c337548c", weaponKey:"lk24", weaponName:"LK24", category:"AR", mode:"MP", buildName:"Build 2",
      attachments:["Tactical Suppressor", "OWC Marksman", "MIP Strike Stock", "50 Round Extended Mag", "Granulated Grip Tape"],
      attachmentSlots:[], imageKey:"LK24-2.png",
      description:"", shareCode:"1A2B4D8B9A",
      isMeta:true, isToxic:false, categoryRank:"top4", dmzRangeRank:null, lastUpdated:"2026-04-08" },
    { id:"6a4f20a89f3ac5961a2fb9e1", weaponKey:"so-14", weaponName:"SO-14", category:"MARKSMAN", mode:"DMZ", buildName:"Build 1",
      attachments:["Gauge-9 Mono", "15.9\" Lachmann Rapp Barrel", "FTAC RTP-40 Stock", "Disable", "Corio LAZ-44 V3", "Demo Firm Grip", "25 Round Mag", "Cronen EM55 Grip"],
      attachmentSlots:[], imageKey:"DMZ-SO-14-1",
      description:"", shareCode:"",
      isMeta:false, isToxic:false, categoryRank:null, dmzRangeRank:"top3", lastUpdated:"2026-07-09" },
    { id:"6a4f20a89f3ac5961a2fb9e2", weaponKey:"type19", weaponName:"TYPE 19", category:"AR", mode:"DMZ", buildName:"Build 1",
      attachments:["North-Industry Heavyweight Suppressor", "Accurate/Supportive Long Barrel", "Thermal Sight", "Agile Stock", "FMJ", "Aim Assist Laser", "Stable Bipod", "Hi-Accuracy Sniper Ammo", "Polymer Grip"],
      attachmentSlots:[], imageKey:"DMZ-TYPE-19-1",
      description:"", shareCode:"",
      isMeta:true, isToxic:false, categoryRank:null, dmzRangeRank:"top5", lastUpdated:"2026-07-09" },
    { id:"6a4f20a89f3ac5961a2fb9e3", weaponKey:"type19", weaponName:"TYPE 19", category:"AR", mode:"DMZ", buildName:"Build 2",
      attachments:["North-Industry Heavyweight Suppressor", "Accurate/Supportive Long Barrel", "Thermal Sight", "Steady Stock", "Long Shot", "Aim Assist Laser", "Stable Bipod", "Fast Reload Mag", "Polymer Grip"],
      attachmentSlots:[], imageKey:"DMZ-TYPE-19-2",
      description:"", shareCode:"",
      isMeta:true, isToxic:false, categoryRank:null, dmzRangeRank:"top5", lastUpdated:"2026-07-09" },
    { id:"6a4f20a89f3ac5961a2fb9e4", weaponKey:"asval", weaponName:"AS VAL", category:"AR", mode:"DMZ", buildName:"Build 1",
      attachments:["MIP Quick Response Barrel", "OWC 4.4X Tactical Scope", "OWC Ranger Stock", "Wounding", "OWC Laser - Tactical", "Ranger Foregrip", "15 Round FMJ", "Granulated Grip Tape"],
      attachmentSlots:[], imageKey:"DMZ-AS-VAL-1",
      description:"", shareCode:"",
      isMeta:true, isToxic:false, categoryRank:null, dmzRangeRank:"best-midlong", lastUpdated:"2026-07-09" },
    { id:"6a4ecc7e2b715e5e00e0a124", weaponKey:"pharo", weaponName:"PHARO", category:"SMG", mode:"MP", buildName:"Coming Soon",
      attachments:["Coming soon — check back later!"],
      attachmentSlots:[], imageKey:"https://placehold.co/1024x576/1a1a1a/e5e5e5?text=Coming+Soon",
      description:"", shareCode:"",
      isMeta:false, isToxic:true, categoryRank:null, dmzRangeRank:null, lastUpdated:"2026-07-08" },
    { id:"6a4f2586d6a2af1f89c1ec7a", weaponKey:"j358", weaponName:"J358", category:"SECONDARIES", mode:"DMZ", buildName:"Build 1",
      attachments:["MIP Light Flash Guard", "J358 Short", "Sleight of Hand", "MIP Laser 5mW", "Stopping Power Reload", "Hammer Grip"],
      attachmentSlots:[], imageKey:"DMZ-J358-1",
      description:"", shareCode:"",
      isMeta:false, isToxic:true, categoryRank:null, dmzRangeRank:null, lastUpdated:"2026-07-21" },
    { id:"6a4f2db36628dd1734313267", weaponKey:"machinepistol", weaponName:"MACHINE PISTOL", category:"SECONDARIES", mode:"MP", buildName:"Build 1",
      attachments:["M1929 Silencer", "VDD 35MM Short", "Rapid Action", "7.62 GORENKO 40 Round Mags", "Stippled Grip"],
      attachmentSlots:[], imageKey:"MACHINE-PISTOL-1",
      description:"", shareCode:"1E2B7D8A9I",
      isMeta:false, isToxic:false, categoryRank:"best", dmzRangeRank:null, lastUpdated:"2026-07-09" },
    { id:"6a4f2db36628dd1734313268", weaponKey:"l-car9", weaponName:"L-CAR 9", category:"SECONDARIES", mode:"MP", buildName:"Build 1",
      attachments:["Agency Suppressor", "Light Weight Stock", "5mW Combat Laser", "BO Foregrip", "Fast Extended Mag A"],
      attachmentSlots:[], imageKey:"L-CAR-9-1",
      description:"", shareCode:"1B4A6B7C8C",
      isMeta:false, isToxic:false, categoryRank:"top3", dmzRangeRank:null, lastUpdated:"2026-07-09" },
    { id:"6a4f2db36628dd1734313269", weaponKey:"l-car9", weaponName:"L-CAR 9", category:"SECONDARIES", mode:"MP", buildName:"Build 2",
      attachments:["Agency Suppressor", "Light Weight Stock", "5mW Combat Laser", "Striker Foregrip", "Extended Mag A"],
      attachmentSlots:[], imageKey:"L-CAR-9-2",
      description:"", shareCode:"1B4A6B7A8A",
      isMeta:false, isToxic:false, categoryRank:"top3", dmzRangeRank:null, lastUpdated:"2026-07-09" },
    { id:"6a4c692095a4f5a6c33754dc", weaponKey:"by15", weaponName:"BY15", category:"SHOTGUN", mode:"MP", buildName:"Build 1",
      attachments:["Marauder Suppressor", "RTC Extended Light Barrel", "No Stock", "500gr Slug", "OWC Laser - Tactical"],
      attachmentSlots:[], imageKey:"BY15-1.png",
      description:"", shareCode:"1C2A4A6C8B",
      isMeta:false, isToxic:false, categoryRank:"top5", dmzRangeRank:null, lastUpdated:"2026-04-08" },
    { id:"6a4c692095a4f5a6c33754dd", weaponKey:"hs0405", weaponName:"HS0405", category:"SHOTGUN", mode:"MP", buildName:"Build 1",
      attachments:["Choke", "RTC Extended Light Barrel", "No Stock", "MIP Laser 5mW", "Thunder Rounds"],
      attachmentSlots:[], imageKey:"HS0405-1.png",
      description:"", shareCode:"1F2A4A6B8C",
      isMeta:false, isToxic:false, categoryRank:"top3", dmzRangeRank:null, lastUpdated:"2026-04-08" },
    { id:"6a4c692095a4f5a6c33754de", weaponKey:"hs0405", weaponName:"HS0405", category:"SHOTGUN", mode:"MP", buildName:"Build 2",
      attachments:["Choke", "RTC Extended Light Barrel", "No Stock", "Stippled Grip Tape", "MIP Laser 5mW"],
      attachmentSlots:[], imageKey:"HS0405-2.png",
      description:"", shareCode:"1F2A4A6B9C",
      isMeta:false, isToxic:false, categoryRank:"top3", dmzRangeRank:null, lastUpdated:"2026-04-08" },
    { id:"6a4c692095a4f5a6c33754e5", weaponKey:"kilobolt-action", weaponName:"KILO BOLT-ACTION", category:"MARKSMAN", mode:"MP", buildName:"Build 1",
      attachments:["Tactical Suppressor", "YKM Combat Stock", "Thermite Reload", "Stippled Grip Tape", "Fast Switch"],
      attachmentSlots:[], imageKey:"KILO-BOLT-ACTION-1.png",
      description:"", shareCode:"1A4B5H8C9C",
      isMeta:false, isToxic:false, categoryRank:null, dmzRangeRank:null, lastUpdated:"2026-04-08" },
    { id:"6a4c692095a4f5a6c33754e6", weaponKey:"kilobolt-action", weaponName:"KILO BOLT-ACTION", category:"MARKSMAN", mode:"MP", buildName:"Build 2",
      attachments:["MIP Extended Light Barrel", "YKM Light Stock", "OWC Stopping Power Reload", "Granulated Grip Tape", "Sleight of Hand"],
      attachmentSlots:[], imageKey:"KILO-BOLT-ACTION-2.png",
      description:"", shareCode:"2A4A5B8B9A",
      isMeta:false, isToxic:false, categoryRank:null, dmzRangeRank:null, lastUpdated:"2026-04-08" },
    { id:"6a4c692095a4f5a6c33754e7", weaponKey:"kilobolt-action", weaponName:"KILO BOLT-ACTION", category:"MARKSMAN", mode:"MP", buildName:"Build 3",
      attachments:["YKM Combat Stock", "OWC Stopping Power Reload", "Granulated Grip Tape", "OWC Laser - Tactical", "Fast Switch"],
      attachmentSlots:[], imageKey:"KILO-BOLT-ACTION-3.png",
      description:"", shareCode:"4B5H6A8B9A",
      isMeta:false, isToxic:false, categoryRank:null, dmzRangeRank:null, lastUpdated:"2026-04-08" },
    { id:"6a4c692095a4f5a6c33754b9", weaponKey:"ul736", weaponName:"UL736", category:"LMG", mode:"MP", buildName:"Build 1",
      attachments:["Tactical Suppressor", "RTC 25.4\" Extended Barrel", "RTC Steady Stock", "50 Round Reload", "Disable"],
      attachmentSlots:[], imageKey:"UL736-1.png",
      description:"", shareCode:"1A2B4C5D9A",
      isMeta:false, isToxic:false, categoryRank:null, dmzRangeRank:null, lastUpdated:"2026-04-08" },
    { id:"6a4c692095a4f5a6c33754ba", weaponKey:"ul736", weaponName:"UL736", category:"LMG", mode:"MP", buildName:"Build 2",
      attachments:["RTC 25.4\" Extended Barrel", "RTC Steady Stock", "50 Round Reload", "Granulated Grip Tape", "OWC Laser - Tactical"],
      attachmentSlots:[], imageKey:"UL736-2.png",
      description:"", shareCode:"2B4C6C8A9A",
      isMeta:false, isToxic:false, categoryRank:null, dmzRangeRank:null, lastUpdated:"2026-04-08" },
    { id:"6a4c692095a4f5a6c33754bb", weaponKey:"rpd", weaponName:"RPD", category:"LMG", mode:"MP", buildName:"Build 1",
      attachments:["Monolithic Suppressor", "Cooling Compressor Barrel", "RTC Steady Stock", "Granulated Grip Tape", "FMJ"],
      attachmentSlots:[], imageKey:"RPD-1.png",
      description:"", shareCode:"1C2D4D5A9A",
      isMeta:false, isToxic:false, categoryRank:null, dmzRangeRank:null, lastUpdated:"2026-04-08" }
  ];

  /* 🔴 THE ONE PLACE THE ARMORY'S COUNTS ARE DECIDED. Armory's masthead read "31 builds · 28 need
   * repair" while Home's card read "133 builds · 33 need repair" — the same collection, the same
   * words, two numbers. Armory was counting the exported MP sample; Home was counting the real
   * collection total against defects found in the whole 36-row sample. Both were internally
   * consistent and together they were incoherent, which is exactly the failure a shared derivation
   * exists to prevent.
   *
   * `sample` is what this mockup can actually see and reason about; `total` is what the collection
   * holds. A surface may show either — but it must SAY which, and both must come from here. */
  const armoryDefect = (b) =>
    (b.mode === 'MP' && !b.shareCode) || !b.imageKey || (b.imageKey || '').startsWith('http') ||
    (b.attachments || []).length !== 5 || b.lastUpdated < '2026-04-26' ||
    (b.mode === 'MP' && b.isMeta && !b.categoryRank);
  const ARMORY_COUNTS = {
    total: LOADOUT_STATS.total,                       // the real collection
    sample: builds.length,                            // what was exported into this package
    MP: builds.filter(b => b.mode === 'MP').length,
    DMZ: builds.filter(b => b.mode === 'DMZ').length,
    ranked: builds.filter(b => b.categoryRank || b.dmzRangeRank).length,
    needRepair: builds.filter(armoryDefect).length
  };

  /* ═══════════════════ BROADCAST — derived ═══════════════════
   * models/Announcement.js has SIX fields: text, createdAt, createdBy, expiresAt, color,
   * startsAt. It has no title, no body, no pin and no view counter, and none of those are
   * omissions — utils/announcement.js's buildAnnouncementEmbed records that the title header
   * was REMOVED at Harkirat's direct correction, because a heading is typed into the text as
   * markdown. An earlier fixture here invented `title`/`body`/`pinned`/`views`.
   *
   * ⚠️ REACH IS REAL OR IT IS ABSENT. The only record of delivery is
   * UserPreference.seenAnnouncementIds. Exported above and measured 2026-08-24: 21 preference
   * documents, one with a non-empty seen list, and every announcement's count is 0. So the
   * page shows reach only where it is non-zero. `views: 12840` was fabricated telemetry, which
   * is the worst kind of fixture error — it looks exactly like data. */
  const ACCENT_FALLBACK = '#F2C230';   // --patch, 12.53:1 on #000. See portal/ui/broadcast.js.
  const annAccent = (a) => (typeof a.color === 'number' ? '#' + a.color.toString(16).padStart(6, '0') : ACCENT_FALLBACK);
  /* utils/announcement.js's own delivery constraints — not decoration, they bound the page. */
  const MAX_EMBEDS_PER_MESSAGE = 10;   // Discord's cap; oldest unseen first, the rest wait.
  const DEFAULT_EXPIRY_DAYS = 60;      // what a BLANK expiry means, decided in one place.
  /* ⚠️ computeExpiresAt accepts blank / "never" / "none" / a whole number of DAYS. NEVER an
   * absolute date. core/ops/announcements.js's own header records that an earlier draft of its
   * test assumed an absolute date and would have rejected every valid post. */
  const EXPIRY_INPUT = { blank:`${DEFAULT_EXPIRY_DAYS}-day default`, never:'never / none', days:'a whole number of days' };

  /* ═══════════════════ ACCESS — derived ═══════════════════
   * ⚠️ THERE ARE TWO ROLES, NOT THREE. The hardcoded owner (utils/owner.js) and a Mongo-granted
   * admin. An earlier fixture carried an `editor` role — "granted scopes, no destructive
   * action" — which exists in no model, no utility and no route. It was not unenforced, it was
   * FICTIONAL, and describing it as a gap invited someone to build it.
   *
   * ⚠️ ELEVEN GRANTABLE TOKENS, NOT SEVEN. Three commands (utils/adminAccess.js's
   * ADMIN_COMMANDS) and eight /manage pages (MANAGE_PAGE_SCOPES). The earlier list had seven
   * page scopes and no commands at all, so it could not represent a real admin in the dev
   * database who holds ["manage","bot"] — and it dropped `season`, the pseudo-page whose whole
   * purpose is that editing what is LIVE and staging what is NEXT are different blast radii. */
  const ROLE_META = {
    owner: { label:'Owner', note:'Hardcoded in utils/owner.js. Every scope implicitly, forever. Not a row you can edit — isOwner() short-circuits every check before the allowlist is even read.' },
    admin: { label:'Admin', note:'One AdminUser document. Holds exactly the tokens on its permissions array, which must never be empty — an admin with nothing granted should be revoked, not parked in limbo.' }
  };

  /* Colour is BORROWED, never invented: Access is the achromatic realm, so each scope wears
   * the accent of the realm it governs. A page scope with no portal realm behind it (season,
   * seasondraft) takes the Season identity amber. */
  const SCOPE_HEX = {
    manage:'#8FA1B3', autobuild:'#17A2A2', bot:'#1F8A5E',
    'manage.draws':'#AE72E0', 'manage.calendar':'#4A90D9', 'manage.loadouts_mp':'#FF3430',
    'manage.loadouts_dmz':'#337BA6', 'manage.patchnotes':'#F2C230', 'manage.seasondraft':'#F2994A',
    'manage.season':'#F2994A', 'manage.announcement':'#F2C230'
  };
  /* Which portal realm each token actually reaches — read off portal/api/*.js's own page lists
   * (SEASON_PAGES / ARMORY_PAGES / BROADCAST_PAGES) rather than guessed. A token with no realm
   * is reachable only in Discord, and saying so is the point. */
  const SCOPE_REALM = {
    manage:'—', autobuild:'—', bot:'analytics',
    'manage.draws':'season', 'manage.calendar':'season', 'manage.patchnotes':'season',
    'manage.seasondraft':'season', 'manage.season':'season',
    'manage.loadouts_mp':'armory', 'manage.loadouts_dmz':'armory',
    'manage.announcement':'broadcast'
  };
  const SCOPE_META = Object.fromEntries(accessScopes.map(s => [s.key, {
    ...s, hex: SCOPE_HEX[s.key] || '#8FA1B3', realm: SCOPE_REALM[s.key] || '—' }]));
  const SCOPES = accessScopes.map(s => s.key);
  const SPOF = new Set(spof.map(s => s.scope));
  /* A scope nobody but the owner holds. Distinct from a single point of failure and the real
   * data has one (autobuild) — singlePointsOfFailure() only reports ids.length === 1. */
  const unheld = SCOPES.filter(k => !accessAdmins.some(a => a.grants[k] && a.grants[k].held));

  /* PortalSession, not a Discord session. 12h TTL swept by Mongo; no IP is stored anywhere
   * (an earlier fixture had an `ip` column). "Signed in now" is DERIVED from lastSeenAt inside
   * 15 minutes, because a browser session has no logout event unless someone clicks one —
   * recency is the only honest signal there is. Exported live: zero rows, so the empty state
   * IS the state, and it has to be designed rather than assumed away. */
  const SESSION_TTL_HOURS = 12;
  const SESSION_LIVE_MS = 15 * 60 * 1000;
  const ADMIN_CACHE_TTL_MS = 60 * 1000;   // utils/adminAccess.js — a revoke that skips
  // invalidateAdminCache() is up to a minute late inside the bot. That belongs in the copy.

  /* ═══ ANALYTICS ═══ ⚠️ REAL AGGREGATES, computed on 2026-08-24 from the dev database:
   * 496 analyticsevents · 998 alertlogs · 303 bootrecords · 26 analyticsrollups · 22 changelogs.
   * An earlier version of this file invented six commands and a flat "usage" number, which
   * hid every dimension the observability layer actually records. The real event carries
   * outcome, entry, context, installType, isAdmin, ackMs, durationMs, a per-dependency
   * timing array and an autocomplete search object — see models/AnalyticsEvent.js. */

  /* The SIX outcomes and SEVEN entry points, verbatim from the schema's own comments. */
  const OUTCOMES = ['ok','error','expired','blocked_by_policy','swallowed_by_cooldown','rejected_admin'];
  const ENTRIES  = ['slash','button','select','autocomplete','modal','synthetic','background'];
  const OUTCOME_LABEL = { ok:'OK', error:'Error', expired:'Expired',
    blocked_by_policy:'Blocked by policy', swallowed_by_cooldown:'Swallowed by cooldown',
    rejected_admin:'Rejected — not admin' };
  const ENTRY_LABEL = { slash:'Slash command', button:'Button', select:'Select menu',
    autocomplete:'Autocomplete', modal:'Modal submit', synthetic:'Synthetic', background:'Background job' };

  /* 🔴 Discord's interaction ACK deadline is 3 seconds. That is the number that matters and
   * it is the axis the timing view is drawn against — not an invented "target". */
  const ACK_DEADLINE_MS = 3000;

  const cmdStats = [
    {
      "command": "webp_nameplate",
      "subcommand": null,
      "n": 137,
      "ok": 137,
      "ack": 0,
      "dur": 2819
    },
    {
      "command": "webp_decoration",
      "subcommand": null,
      "n": 107,
      "ok": 107,
      "ack": 0,
      "dur": 1483
    },
    {
      "command": "colors",
      "subcommand": null,
      "n": 81,
      "ok": 81,
      "ack": 80,
      "dur": 1742
    },
    {
      "command": "mng",
      "subcommand": null,
      "n": 68,
      "ok": 68,
      "ack": 4,
      "dur": 257
    },
    {
      "command": "bot",
      "subcommand": null,
      "n": 51,
      "ok": 49,
      "ack": 3,
      "dur": 584
    },
    {
      "command": "help",
      "subcommand": null,
      "n": 14,
      "ok": 14,
      "ack": 7,
      "dur": 667
    },
    {
      "command": "bot",
      "subcommand": "analytics",
      "n": 10,
      "ok": 10,
      "ack": 26,
      "dur": 3381
    },
    {
      "command": "invite",
      "subcommand": null,
      "n": 8,
      "ok": 8,
      "ack": 12,
      "dur": 783
    },
    {
      "command": "manage",
      "subcommand": null,
      "n": 6,
      "ok": 6,
      "ack": 15,
      "dur": 2158
    },
    {
      "command": "add",
      "subcommand": null,
      "n": 4,
      "ok": 2,
      "ack": 3,
      "dur": 515
    },
    {
      "command": "gunsmiths",
      "subcommand": null,
      "n": 4,
      "ok": 4,
      "ack": 0,
      "dur": 0
    },
    {
      "command": "edit",
      "subcommand": null,
      "n": 2,
      "ok": 1,
      "ack": 2,
      "dur": 426
    }
  ];

  /* Per-dependency timings, aggregated by name (never per call — that is what keeps the
   * array bounded). The story here is real: Atlas is 52ms across 437 calls, while the WebP
   * nameplate pipeline is a 3.5-SECOND outlier on a single call. */
  const depStats = [
    {
      "name": "webp_nameplate",
      "events": 1,
      "ms": 3553,
      "calls": 1
    },
    {
      "name": "cloudinary",
      "events": 3,
      "ms": 1078,
      "calls": 8
    },
    {
      "name": "webp_decoration",
      "events": 1,
      "ms": 842,
      "calls": 1
    },
    {
      "name": "discord_rest",
      "events": 101,
      "ms": 461,
      "calls": 101
    },
    {
      "name": "discord_user_fetch",
      "events": 5,
      "ms": 355,
      "calls": 5
    },
    {
      "name": "atlas",
      "events": 130,
      "ms": 52,
      "calls": 437
    }
  ];

  const outcomeStats = [
    {
      "outcome": "ok",
      "n": 491
    },
    {
      "outcome": "error",
      "n": 5
    }
  ];
  const entryStats = [
    {
      "entry": "background",
      "n": 320
    },
    {
      "entry": "button",
      "n": 66
    },
    {
      "entry": "select",
      "n": 61
    },
    {
      "entry": "slash",
      "n": 29
    },
    {
      "entry": "modal",
      "n": 15
    },
    {
      "entry": "autocomplete",
      "n": 5
    }
  ];

  /* Reach: where the interaction came from, and how the app was installed. `installType`
   * null means Discord omitted authorizingIntegrationOwners for that event. */
  const reachStats = [
    {
      "context": "guild",
      "installType": "guild",
      "n": 140
    },
    {
      "context": "guild",
      "installType": null,
      "n": 70
    },
    {
      "context": "dm",
      "installType": null,
      "n": 254
    },
    {
      "context": "guild",
      "installType": "user",
      "n": 32
    }
  ];
  const adminSplit = { product: 360, admin: 136 };

  /* ackMs buckets. 170 of 171 measured acks landed under 100ms; one fell in 250–500ms. */
  const ackBuckets = [
    {
      "from": 0,
      "n": 170
    },
    {
      "from": 250,
      "n": 1
    }
  ];

  const alertStats = [
    {
      "level": "info",
      "n": 717,
      "pinged": 0
    },
    {
      "level": "caution",
      "n": 258,
      "pinged": 0
    },
    {
      "level": "error",
      "n": 23,
      "pinged": 23
    }
  ];
  const alertSample = [
    {
      "level": "info",
      "title": "Bot online",
      "detail": "\u267b\ufe0f Automatic/unattended restart",
      "pinged": false,
      "rssMb": 162,
      "uptimeSec": 2,
      "at": "2026-08-23 17:17"
    },
    {
      "level": "info",
      "title": "Bot online",
      "detail": "\u267b\ufe0f Automatic/unattended restart",
      "pinged": false,
      "rssMb": 160,
      "uptimeSec": 2,
      "at": "2026-08-23 17:17"
    },
    {
      "level": "info",
      "title": "Bot online",
      "detail": "\u267b\ufe0f Automatic/unattended restart",
      "pinged": false,
      "rssMb": 167,
      "uptimeSec": 1,
      "at": "2026-08-23 17:09"
    },
    {
      "level": "info",
      "title": "Bot online",
      "detail": "\u267b\ufe0f Automatic/unattended restart",
      "pinged": false,
      "rssMb": 149,
      "uptimeSec": 3,
      "at": "2026-08-23 17:05"
    },
    {
      "level": "info",
      "title": "Bot online",
      "detail": "\u267b\ufe0f Automatic/unattended restart",
      "pinged": false,
      "rssMb": 105,
      "uptimeSec": 6,
      "at": "2026-08-23 17:02"
    }
  ];
  const memStats = { avgMb: 132, maxMb: 174, minMb: 31 };

  /* ChangeLog — every /manage and portal write, with its inverse. `undone` is the flag the
   * undo path sets; none of these have been undone. */
  const changeLog = [
    {
      "page": "draws",
      "action": "add",
      "model": "SeasonalData",
      "target": "Test Draw",
      "summary": "Added new draw \"Test Draw\"",
      "undone": false,
      "at": "2026-08-22 19:38"
    },
    {
      "page": "draws",
      "action": "edit",
      "model": "SeasonalData",
      "target": "Deepstar Wraith Mythic Drop",
      "summary": "Edited draw \"Deepstar Wraith Mythic Drop\"",
      "undone": false,
      "at": "2026-08-22 19:37"
    },
    {
      "page": "announcement",
      "action": "delete",
      "model": "Announcement",
      "target": "CTXVERIFY Edited",
      "summary": "Deleted an announcement",
      "undone": false,
      "at": "2026-08-22 03:32"
    },
    {
      "page": "announcement",
      "action": "delete",
      "model": "Announcement",
      "target": "CTXVERIFY Bad Order",
      "summary": "Deleted an announcement",
      "undone": false,
      "at": "2026-08-22 03:32"
    },
    {
      "page": "announcement",
      "action": "add",
      "model": "Announcement",
      "target": "CTXVERIFY Bad Order",
      "summary": "Posted a new announcement",
      "undone": false,
      "at": "2026-08-22 03:32"
    },
    {
      "page": "announcement",
      "action": "edit",
      "model": "Announcement",
      "target": "CTXVERIFY Edited",
      "summary": "Edited an announcement",
      "undone": false,
      "at": "2026-08-22 03:32"
    }
  ];

  /* SearchTerm — the collection that answers "what did people look for and NOT find".
   * One row exists today, and it is a zero-result: someone typed "ad" into /manage's action
   * field and got nothing back. */
  const searchTerms = [
    { term:'ad', command:'manage', field:'action', searches:1, zeroResults:1, picked:0,
      firstSeen:'2026-08-22', lastSeen:'2026-08-22' }
  ];

  const bootStats = { boots:303, lastVersion:'3.66.0-pre', lastCommit:'356832f', host:'local',
    kind:'automatic', guilds:2, emojiSynced:59, emojiMissing:0, commandsRegistered:16,
    mongoOk:true, cloudinaryConfigured:true };

  const OBS_TOTALS = { events:496, alerts:998, boots:303, rollups:26, changes:22, searchTerms:1 };

  /* ═══ REVIEW ═══ a sample changeset, seeded on demand so the commit screen is explorable
   * without staging anything first.
   *
   * ⚠️ EVERY `op` HERE IS A REAL REGISTERED TYPE, asserted by .schema-gate.mjs against
   * core/ops's own listOpTypes(). The previous set named `draws.edit`, `draws.delete` and
   * `loadouts.setRank` — the first two are pluralised versions of real ops (`draw.edit`,
   * `draw.delete`) and the third does not exist at all: a rank change is an ordinary
   * loadout.edit. It also showed an 'S' rank, which is not this bot's vocabulary either. */
  const sampleOps = [
    { id:'sample-1', tier:1, name:'Season identity', verb:'2 fields changed', realm:'season',
      op:'season.setTitlesDeadlines',
      rows:[['Season title','Season 7 — Terminated','Season 7 — Terminated (Extended)'],
            ['Battle Pass ends','Sep 10, 2026','Sep 17, 2026']] },
    { id:'sample-2', tier:1, name:"The Widow's Bite Draw", verb:'release date changed', realm:'season',
      op:'draw.edit',
      rows:[['Releases','Sep 1, 2026','Sep 3, 2026'],
            ['Window','Widow’s Bite Draw · Sep 1 → Sep 14','unchanged — the window is its own calendar row']] },
    { id:'sample-3', tier:1, name:'AK117 — Meta Build', verb:'rank assigned', realm:'armory',
      op:'loadout.edit',
      rows:[['categoryRank','top3','best'],
            ['Badges','meta','meta — propagated to 1 other AK117 MP build']] },
    { id:'sample-4', tier:1, name:'Molten Fusion Draw', verb:'deleted', realm:'season',
      op:'draw.delete', destroys:true,
      rows:[['Draw','Molten Fusion Draw','removed'],['Items','2','—'],['Releases','Aug 9, 2026','—']] }
  ];

  return {
    /* SEASON — exported */ season, draft, newDraws, returningDraws, calendar, patchNotes,
    /* SEASON — derived */  LINES, items, LANES, LANE_BY_KEY, TYPE_LABEL, TIERS, TIER_ORDER,
                            isComment, isSameDrawTitle, isEventEnded, seasonItems,
                            BANNERS, bannerHost, destroys, seasonRepairs, today:'2026-08-24',

    /* BROADCAST */         announcements, annAccent, ACCENT_FALLBACK,
                            MAX_EMBEDS_PER_MESSAGE, DEFAULT_EXPIRY_DAYS, EXPIRY_INPUT,

    /* ACCESS */            accessAdmins, accessScopes, SCOPES, SCOPE_META, ROLE_META, spof, SPOF,
                            unheld, sessions, OWNER_ID, SESSION_TTL_HOURS, SESSION_LIVE_MS,
                            ADMIN_CACHE_TTL_MS,

    /* REGISTRIES */        OP_TYPES, OP_TIERS, PERM_TOKENS, MANAGE_ACTIONS, changeLogRows,

    /* REVIEW */            sampleOps,

    /* ARMORY */            CATS, builds, ARMORY_COUNTS, armoryDefect,
                            LOADOUT_STATS, CLOUD_BASE, imageUrl, BADGE_TOKENS, DMZ_RANGE_TOKENS,
                            RANK_ORDER, RANK_LABEL,

    /* ANALYTICS */         OUTCOMES, ENTRIES, OUTCOME_LABEL, ENTRY_LABEL, ACK_DEADLINE_MS,
                            cmdStats, depStats, outcomeStats, entryStats, reachStats, adminSplit,
                            ackBuckets, alertStats, alertSample, memStats, changeLog, searchTerms,
                            bootStats, OBS_TOTALS };
})();
