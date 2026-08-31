// .export-fixtures.mjs — regenerates the SEASON / BROADCAST / ACCESS block of assets/fixtures.js straight out of the dev database. Run with:  node .export-fixtures.mjs > /tmp/block.js
//
// ⚠️ THIS SCRIPT IS THE POINT. The previous fixtures for these three realms were hand-authored, and every one of them was wrong in a way that changed the design (a draw with a start AND an end; an announcement with a `title` and a `body`; an `editor` role). A fixture that a human types is a fixture a human can invent. Exporting removes the opportunity. See COMPANION §3.9.
//
// It also reads the REGISTRY rather than a second list: op types come from core/ops's own listOpTypes(), scopes from utils/adminAccess's MANAGE_PAGE_SCOPES/ADMIN_COMMANDS, and the human labels from portal/api/access.js's PAGE_LABELS/COMMAND_LABELS. Nothing below is retyped.
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
// 🔴 REPO IS DERIVED, NEVER HARDCODED. It read `/Applications/Claude Code/Diors-Builds` until 2026-08-31 -- an absolute path to one laptop -- so this could only ever run on that machine. CI failed with `Cannot find module '/Applications/Claude Code/Diors-Builds/core/ops'` the first time the branch was pushed, and the reason it took six days to surface is that `portal:gate` joined `npm test` on 2026-08-25 while the branch was not pushed until 2026-08-31: nothing ran it anywhere but here. ⚠️ Walking up to the nearest package.json also survives the package being moved, which a fixed count of `..` would not.
const repoRoot = () => {
    let dir = dirname(fileURLToPath(import.meta.url));
    while (!existsSync(join(dir, 'package.json'))) {
        const up = dirname(dir);
        if (up === dir) throw new Error('no package.json above the mockup package');
        dir = up;
    }
    return dir;
};
const REPO = repoRoot();

const mongoose = require(`${REPO}/node_modules/mongoose`);
await mongoose.connect('mongodb://localhost:27017/diors-builds-dev');

const SeasonalData = require(`${REPO}/models/SeasonalData`);
const Announcement = require(`${REPO}/models/Announcement`);
const AdminUser    = require(`${REPO}/models/AdminUser`);
const PortalSession= require(`${REPO}/models/PortalSession`);
const UserPreference = require(`${REPO}/models/UserPreference`);
const ChangeLog    = require(`${REPO}/models/ChangeLog`);
const ops          = require(`${REPO}/core/ops`);
const { MANAGE_PAGE_SCOPES, ADMIN_COMMANDS } = require(`${REPO}/utils/adminAccess`);
const { buildPermissionMatrix, singlePointsOfFailure } = require(`${REPO}/portal/api/access`);
const { announcementState } = require(`${REPO}/portal/api/broadcast`);
// ⚠️ THE EXPORT NAME IS `ALLOWED_ADMIN_ID`. This destructured `OWNER_ID`, which utils/owner.js has never exported, so it resolved to undefined and the `||` below silently emitted a retyped literal — under a header that says "Nothing below is retyped." A fallback that hides a wrong name is worse than a crash, because the output looks correct. No fallback now: if the module stops exporting it, this fails loudly rather than freezing today's value into the fixtures.
const { ALLOWED_ADMIN_ID: OWNER_ID } = require(`${REPO}/utils/owner`);
if (!OWNER_ID) throw new Error('utils/owner.js no longer exports ALLOWED_ADMIN_ID — fix this import rather than hardcoding an id.');

const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);
const j   = (v) => JSON.stringify(v);

// ── SeasonalData ──────────────────────────────────────────────────────────────
const doc = await SeasonalData.findOne({ docType: 'global' }).lean();
const stripIds = (arr, keep = []) => (arr || []).map((x) => {
    const o = { ...x, _id: String(x._id) };
    for (const k of keep) if (o[k]) o[k] = (o[k] || []).map((i) => ({ ...i, _id: String(i._id) }));
    return o;
});

const season = {
    currentSeasonTitle: doc.currentSeasonTitle, bpTitle: doc.bpTitle, rankTitle: doc.rankTitle, dmzTitle: doc.dmzTitle,
    bpEnd: day(doc.bpEnd), rankEnd: day(doc.rankEnd), dmzEnd: day(doc.dmzEnd),
    bpEndTBD: !!doc.bpEndTBD, rankEndTBD: !!doc.rankEndTBD, dmzEndTBD: !!doc.dmzEndTBD,
    drawsBannerUrl: doc.drawsBannerUrl || '', eventsBannerUrl: doc.eventsBannerUrl || '', playlistsBannerUrl: doc.playlistsBannerUrl || ''
};
const newDraws = stripIds(doc.newDraws, ['items']).map((d) => ({ _id: d._id, title: d.title, date: day(d.date), thumbnailUrl: d.thumbnailUrl || '', items: (d.items || []).map((i) => ({ tier: i.tier, name: i.name })) }));
const returningDraws = stripIds(doc.returningDraws, ['items']).map((d) => ({ _id: d._id, title: d.title, date: day(d.date), thumbnailUrl: d.thumbnailUrl || '', items: (d.items || []).map((i) => ({ tier: i.tier, name: i.name })) }));
const calendar = stripIds(doc.calendar).map((e) => ({ _id: e._id, title: e.title, date: day(e.date), endDate: day(e.endDate), isOngoing: !!e.isOngoing, category: e.category, isDoubleCP: !!e.isDoubleCP }));
const patchNotes = stripIds(doc.patchNotes).map((p) => ({ _id: p._id, title: p.title, titleOverride: p.titleOverride || '', description: p.description || '', releaseDate: p.releaseDate ? new Date(p.releaseDate).toISOString() : null, images: p.images || [] }));
const draft = {
    active: !!doc.draft?.active, currentSeasonTitle: doc.draft?.currentSeasonTitle || '',
    bpTitle: doc.draft?.bpTitle || '', rankTitle: doc.draft?.rankTitle || '', dmzTitle: doc.draft?.dmzTitle || '',
    bpEnd: day(doc.draft?.bpEnd), rankEnd: day(doc.draft?.rankEnd), dmzEnd: day(doc.draft?.dmzEnd),
    bpEndTBD: !!doc.draft?.bpEndTBD, rankEndTBD: !!doc.draft?.rankEndTBD, dmzEndTBD: !!doc.draft?.dmzEndTBD,
    newDraws: (doc.draft?.newDraws || []).length, returningDraws: (doc.draft?.returningDraws || []).length, calendar: (doc.draft?.calendar || []).length
};

// ── Announcements ─────────────────────────────────────────────────────────────
const now = new Date();
const annRows = await Announcement.find({}).sort({ createdAt: 1 }).lean();
const announcements = [];
for (const a of annRows) {
    // REACH IS REAL OR IT IS ABSENT. Counted from UserPreference.seenAnnouncementIds, the only record of delivery that exists. Measured 2026-08-24: every count is 0, because these were seeded and no user has ever run a command against them. A column that is always 0 teaches nothing, so the page must show reach only where it is non-zero — never a fabricated number.
    const reach = await UserPreference.countDocuments({ seenAnnouncementIds: a._id });
    announcements.push({ _id: String(a._id), text: a.text, createdAt: new Date(a.createdAt).toISOString(), createdBy: a.createdBy,
                         expiresAt: a.expiresAt ? new Date(a.expiresAt).toISOString() : null,
                         startsAt: a.startsAt ? new Date(a.startsAt).toISOString() : null,
                         color: a.color, state: announcementState(a, now), reach });
}

// ── Access ────────────────────────────────────────────────────────────────────
const admins = await AdminUser.find({}).lean();
const matrix = buildPermissionMatrix(admins);
const spof = singlePointsOfFailure(admins);
// ⚠️ grantedAt: buildPermissionMatrix DERIVES this from the ObjectId and its comment claims AdminUser has "no timestamp at all". It does — `grantedAt` has been declared since 566b3ca (2026-08-13), ten days before that file was last touched, and every real document carries it. The stored value is also the more correct one: an ObjectId timestamp is the DOCUMENT's creation and never moves when permissions are later edited. Filed; the fixture uses the stored field.
const byId = new Map(admins.map((a) => [a.discordId, a]));
const accessAdmins = matrix.admins.map((r) => ({ ...r, note: byId.get(r.discordId)?.note || '',
                                                 grantedBy: byId.get(r.discordId)?.grantedBy || null,
                                                 grantedAt: day(byId.get(r.discordId)?.grantedAt) }));
const sessions = (await PortalSession.find({ revokedAt: null }).sort({ lastSeenAt: -1 }).lean())
    .map((s) => ({ sessionHash: s.sessionHash, discordId: s.discordId, createdAt: new Date(s.createdAt).toISOString(),
                   lastSeenAt: new Date(s.lastSeenAt).toISOString(), userAgent: s.userAgent || '' }));

const changeLogRows = (await ChangeLog.find({}).sort({ createdAt: -1 }).limit(12).lean())
    .map((c) => ({ changeId: c.changeId, page: c.page, action: c.action, model: c.model, target: c.target,
                   summary: c.summary, undone: !!c.undone, at: new Date(c.createdAt).toISOString(),
                   inverseType: c.inverse?.type || null }));

const out = [];
const P = (s) => out.push(s);
P(`  /* ══════════════════════ EXPORTED, NOT AUTHORED ══════════════════════`);
P(`   * Everything from here to the end of this comment's block was written by`);
P(`   * .export-fixtures.mjs reading mongodb://localhost:27017/diors-builds-dev and the`);
P(`   * bot's own registries. Do not hand-edit — re-run the script. Exported ${new Date().toISOString().slice(0, 16).replace('T', ' ')}Z.`);
P(`   * Counts at export: ${newDraws.length} new draws · ${returningDraws.length} returning · ${calendar.length} calendar rows`);
P(`   * · ${patchNotes.length} patch notes · ${announcements.length} announcements · ${admins.length} granted admins · ${sessions.length} live sessions.`);
P(`   * ══════════════════════════════════════════════════════════════════ */`);
P(`  const season = ${j(season)};`);
P(`  const newDraws = ${j(newDraws)};`);
P(`  const returningDraws = ${j(returningDraws)};`);
P(`  const calendar = ${j(calendar)};`);
P(`  const patchNotes = ${j(patchNotes)};`);
P(`  const draft = ${j(draft)};`);
P(`  const announcements = ${j(announcements)};`);
P(`  const accessAdmins = ${j(accessAdmins)};`);
P(`  const accessScopes = ${j(matrix.scopes)};`);
P(`  const spof = ${j(spof)};`);
P(`  const sessions = ${j(sessions)};`);
P(`  const changeLogRows = ${j(changeLogRows)};`);
// 🔴 THE /manage ACTION REGISTRY, exported whole. The deferred item this pass closed demanded "enumerate the entity's actions from manageActions.js and confirm each is reachable in the mockup or DELIBERATELY NAMED AS ABSENT" — the exact check the Armory rebuild was born from (Loadouts had ten actions; the mockup implemented three and named none of the rest). It was not run until a completeness sweep asked for it, and it found 24 of 37 unaccounted for. A surface cannot answer "what can an admin do here" from a list it does not have, so here is the list.
P(`  const MANAGE_ACTIONS = ${j(Object.fromEntries(Object.entries(require(`${REPO}/utils/manageActions`).ACTIONS_BY_PAGE).map(([page, list]) => [page, list.map((a) => ({ id: a.id, label: a.label, kind: a.kind, slash: !!a.slash }))])))};`);
P(`  const OP_TYPES = ${j(ops.listOpTypes())};`);
// 🔴 A TIER IS DERIVED, NEVER STATED. "Write directly when you can guarantee an exact inverse, stage when you cannot" (2026-08-20 spec §5) is a rule about the OP, so the answer lives in the op registry and nowhere else. Three surfaces had hand-typed a delete as tier 3 on the intuition that deleting is scary; core/ops says tier 1, because apply() captures the whole document first and the inverse is exact. Stating it by hand is precisely what §4.4 forbids, and it went unnoticed until this map made disagreement checkable.
P(`  const OP_TIERS = ${j(Object.fromEntries(ops.listOpTypes().map((t) => [t, ops.resolveOp(t).tier])))};`);
P(`  const PERM_TOKENS = ${j([...ADMIN_COMMANDS, ...MANAGE_PAGE_SCOPES.map((p) => `manage.${p}`)])};`);
P(`  const OWNER_ID = ${j(OWNER_ID)};`);
console.log(out.join('\n'));
await mongoose.disconnect();
