// core/ops/loadouts.js
//
// Six loadout mutations, as ops. MP and DMZ share this one file (mirroring utils/manageActions.js's loadoutModeFor) so the two pages cannot drift apart.
//
// ⚠️ Loadouts are THEIR OWN DOCUMENTS. This file uses core/mongo/document.js, never core/mongo/positional.js -- pointing the positional helper at a top-level document matches nothing and returns { ok:false, reason:'missing' }, indistinguishable from a legitimate outcome.
//
// ⚠️ AUDITED AGAINST THE REAL HANDLER (handlers/manage/loadouts.js), not transcribed from the plan document -- three real defects the plan's own draft would have shipped:
//   1. weaponKey is `weaponName.toLowerCase().replace(/\s+/g,'')` -- a PLAIN normalize, the same one both add/edit handlers use inline. It is NOT utils/loadoutRender.js's computeWeaponKeyAndBuild(), which is /autobuild's AUTO-NAMING helper: it invents its own buildName ("Build N") and imageKey from the weapon name, discarding whatever the admin typed into those two fields. Calling it here would silently overwrite an admin's real build name.
//   2. "Add Multiple" is ALREADY an upsert by {weaponKey, mode, buildName} in the real handler (existing = Loadout.findOne(...); updateOne if found, else insert) -- a blind createDocument() per parsed block would create duplicate documents on every re-run of the same paste.
//   3. "Replace Multiple" reuses the EXACT SAME modal and handler function as "Add Multiple" (manageActions.js's loadoutsActions() opens buildLoadoutsBulkAddModal for BOTH ids) -- there is no wholesale-replace behaviour for loadouts at all, unlike draws/calendar. A first draft that implemented bulkReplace as `deleteMany({mode})` + recreate would have wiped every loadout of that mode not mentioned in the paste -- the exact class of bug already found once for draws. loadout.bulkReplace therefore has the SAME apply() body as loadout.bulkAdd (kept as a distinct op type only so utils/manageActions.js's separate `bulkreplace` action id has something to resolve to -- see core/ops/index.js's registry, which forbids two actions claiming one type but allows two types sharing an apply body).
//   4. "Delete Multiple" fuzzy-matches pasted WEAPON NAMES (optionally "Weapon | Build Name" for one specific build) via utils/search.js's fuzzyMatch -- never element ids.
//   5. Both add and edit run Cloudinary structured-metadata sync (utils/loadoutImageCache.js's syncLoadoutMetadata). 🔴 BADGES ARE PER BUILD since 2026-10-19 15:59 EDT (Harkirat: "move all badge types to per build instead per weapon"). Edit and bulk paste used to copy isMeta/categoryRank/dmzRangeRank/isToxic onto every sibling build of the same weapon (propagateBadges, removed). That copy was also never reverted: an edit's inverse restored the one edited build and left the siblings changed. Now each op writes, and re-syncs metadata for, only the builds it names.
// ⚠️ MODE IS NOT PARSED FROM THE BULK TEXT, and never really was. upsertBulkBlocks() below does `{ ...rawEntry, mode }` -- the page's mode, unconditionally. The bulk format used to REQUIRE a Mode segment anyway, so a block typed `DMZ` and pasted on the MP page parsed with zero errors and saved as MP (verified live 2026-08-22). The format dropped the field on 2026-08-22 rather than the override; do not "restore" a per-block mode here without also deciding what an MP page creating DMZ builds should mean.
//   6. attachments are stored EXACTLY as typed, in the order typed -- the plan's own Interfaces line named utils/adminParser.js's orderAttachmentsBySlot as a consumed function, but it is never called anywhere in handlers/manage/loadouts.js (it belongs to /autobuild's vision-extraction pipeline). Calling it here would silently REORDER every admin-typed attachment list. Real editLoadout only carries `attachmentSlots` forward when the attachment array is BYTE-FOR-BYTE unchanged from the existing document (slot identity is otherwise meaningless) -- that comparison needs the existing doc, so it lives in loadout.edit's apply(), not this pure validator.
const { registerEntity } = require('./index');
const { updateDocument, createDocument, deleteDocument } = require('../mongo/document');
const { parseBulkLoadoutList, correctGunsmithCode } = require('../../utils/adminParser');
const { fuzzyMatch } = require('../../utils/search');
const { checkImageExists } = require('../../utils/loadoutRender');
const { syncLoadoutMetadata, uploadLoadoutImage } = require('../../utils/loadoutImageCache');
const { RANK_MODES } = require('../../utils/rankModes');
const { slotsFor } = require('../../utils/catalogue');
const Loadout = require('../../models/Loadout');

const MODES = ['MP', 'DMZ'];
const deriveWeaponKey = (weaponName) => (weaponName || '').toLowerCase().replace(/\s+/g, '');

function validateBuild(payload) {
    const errors = [];
    if (!payload?.weaponName?.trim()) errors.push('A build needs a weapon name.');
    if (!MODES.includes(payload?.mode)) errors.push(`Mode must be one of ${MODES.join(' or ')}.`);
    // Ass excludes Meta and every tier (his ruling, 2026-09-24). The parsers already drop the clash with a warning; this refuses a payload that reaches here with both, from any surface.
    if (payload?.isAss && (payload.isMeta || payload.categoryRank || payload.dmzRangeRank)) errors.push("A build can't be Ass and also Meta or ranked.");
    if (errors.length) return { ok: false, errors };

    const weaponName = payload.weaponName.trim();
    const weaponKey = deriveWeaponKey(weaponName);
    return {
        ok: true, errors: [],
        normalized: {
            payload: {
                ...payload,
                weaponName, weaponKey,
                buildName: (payload.buildName || 'Standard Build').trim(),
                category: (payload.category || 'AR').toUpperCase(),
                // Only rewritten when the caller actually supplied one -- the key must be ABSENT otherwise, not present-with-value-''. /manage's single add/edit modal never collects shareCode at all (only /autobuild sets it), and loadout.edit's apply() spreads this whole object straight into a Mongo $set -- an always-present '' would silently wipe a real gunsmith code an admin never touched. Found during handler-refactor integration.
                ...(payload.shareCode !== undefined
                    ? { shareCode: payload.shareCode ? correctGunsmithCode(payload.shareCode.trim()) : payload.shareCode }
                    : {}),
                attachments: payload.attachments || [],
                isMeta: !!payload.isMeta, isToxic: !!payload.isToxic,
                categoryRank: payload.categoryRank ?? null, dmzRangeRank: payload.dmzRangeRank ?? null,
                // The two newer badge fields are written only when the caller sent them, the same must-omit rule as shareCode above: a surface that does not know them yet (the portal, until pins2 Session 5 ports them) would otherwise clear a build's Ass flag and rank modes on every edit.
                ...(payload.isAss !== undefined ? { isAss: !!payload.isAss } : {}),
                ...(payload.rankModes !== undefined
                    ? { rankModes: payload.mode === 'DMZ' ? [] : RANK_MODES.filter(m => (payload.rankModes || []).includes(m)) }
                    : {})
            }
        }
    };
}

// A bulk paste is parsed before its page's mode is known, so the mode-dependent half of the badge rules runs here, once the op carries the mode: on DMZ a bare tier moves to dmzRangeRank (the same swap handlers/manage/loadouts.js applies to a single add or edit; before this a bulk DMZ "best" was stored on categoryRank, which a DMZ card never reads), and rank modes, MP only, are dropped with a note.
function applyModeToParsed(parsed, mode, errors) {
    if (mode !== 'DMZ') {
        // An MP build's gunsmith code is required (Harkirat, 2026-10-25 21:48 EDT), so its picture can be tied to it. A "Coming Soon" placeholder has no build yet and is exempt. Only a fresh paste reaches here: an inverse carries `parsed` and skips validate, so a Revert of an old build without a code still restores it.
        const { isPlaceholderBuild } = require('../../utils/loadoutRender');
        for (let i = parsed.length - 1; i >= 0; i--) {
            const p = parsed[i];
            if (p.shareCode || isPlaceholderBuild(p)) continue;
            errors.push(`${p.weaponName} (${p.buildName}) -- MP builds need a Code: line, so it was skipped.`);
            parsed.splice(i, 1);
        }
        return;
    }
    for (const p of parsed) {
        if (p.categoryRank && !p.dmzRangeRank) p.dmzRangeRank = p.categoryRank;
        p.categoryRank = null;
        if (p.rankModes?.length) {
            errors.push(`${p.weaponName} (${p.buildName}) -- rank modes are MP only, so ${p.rankModes.join(', ')} was left off.`);
            p.rankModes = [];
        }
    }
}

// What one parsed block writes. A new build takes the parser's defaults; an existing one keeps any field its block left out (`defaulted`), so re-pasting a build to fix its attachments no longer resets its image to the placeholder and blanks its share code (sweep finding #7, Harkirat 2026-10-20: keep the old values). An inverse's `parsed` comes from stored docs, carries no `defaulted`, and so still restores every field.
function bulkEntryWrite(rawEntry, mode, existing) {
    const { defaulted = [], ...rest } = rawEntry;
    const entry = { ...rest, mode };
    if (existing) for (const k of defaulted) delete entry[k];
    return entry;
}

// The real "Add Multiple"/"Replace Multiple" upsert -- shared by both op types (see header note #3).
async function upsertBulkBlocks(parsed, mode, session) {
    let created = 0, updated = 0;
    const touchedKeys = new Set();
    // Advisory only, matching the real pre-core handler -- never blocks the save, just reported back so the confirmation can flag a build whose Cloudinary key isn't uploaded yet.
    const missingImages = [];
    // 🔴 Every doc UPDATED in place (not created) needs its PRE-update state captured here, or a bulk invert can only delete the newly-created docs and silently leaves every in-place overwrite un-reverted -- the same class of bug draws/calendar's bulk ops already solved by replaying the whole prior array.
    const updatedPriors = [];
    const touchedBuilds = [];
    for (let rawEntry of parsed) {
        const { weaponKey } = rawEntry;
        let { buildName } = rawEntry;
        let existing = await Loadout.findOne({ weaponKey, mode, buildName }).session(session);
        // A block with no Build: line is a NEW build, numbered after the weapon's others (2026-10-26 01:19 EDT: buildName is always `Build N`, the number that orders /gunsmith). It used to be saved as "Standard Build", which numbered nothing.
        if (!existing && buildName === 'Standard Build') {
            const { buildNumberOf } = require('../../utils/loadoutForm');
            const nums = (await Loadout.find({ weaponKey, mode }).select('buildName').session(session).lean()).map(b => buildNumberOf(b.buildName) || 0);
            buildName = `Build ${Math.max(0, ...nums) + 1}`;
            rawEntry = { ...rawEntry, buildName };
            existing = null;
        }
        touchedKeys.add(weaponKey);
        touchedBuilds.push({ weaponKey, buildName });
        const entry = bulkEntryWrite(rawEntry, mode, existing);
        const imageKey = entry.imageKey ?? existing?.imageKey;
        // Slots for a pasted build: an unchanged, already-slotted build keeps its own; anything else gets the catalogue's. Before this, an update that changed the attachments left the OLD slots in place, aligned to the wrong names.
        const sameList = existing && (existing.attachments || []).length === (entry.attachments || []).length
            && (existing.attachments || []).every((a, i) => a === entry.attachments[i]);
        if (!(sameList && existing.attachmentSlots?.length)) entry.attachmentSlots = await slotsFor(entry.attachments);
        if (existing) {
            const { _id, __v, ...prior } = existing.toObject();
            updatedPriors.push({ id: String(existing._id), prior });
            // lastUpdated: the same stamp loadout.edit writes (2026-10-20, v3 sweep). `prior` above already holds the old date for the inverse.
            await Loadout.updateOne({ _id: existing._id }, { ...entry, lastUpdated: new Date() }, { session });
            updated++;
        } else {
            await Loadout.create([entry], { session });
            created++;
        }
        if (!(await checkImageExists(imageKey))) missingImages.push({ label: `${entry.weaponName} (${buildName})`, imageKey });
    }
    // Metadata for exactly the builds this paste wrote, once, after the loop. Read WITH the session: outside it a transaction's own uncommitted writes are invisible, so the sync would publish the pre-paste data. Promise.all is safe because syncLoadoutMetadata is a Cloudinary HTTP call that never touches the session.
    if (touchedBuilds.length) {
        const docs = await Loadout.find({ mode, $or: touchedBuilds }).session(session);
        await Promise.all(docs.map(d => syncLoadoutMetadata(d, d.attachmentSlots)));
    }
    return { created, updated, touchedKeys, missingImages, updatedPriors };
}

registerEntity('loadouts', {
    'loadout.add': {
        action: ['loadouts_mp:add', 'loadouts_dmz:add'], tier: 1,
        validate: (op) => validateBuild(op.payload),
        preview: async (op) => {
            const siblings = await Loadout.find({ weaponKey: op.payload.weaponKey, mode: op.payload.mode }).lean();
            return { before: { builds: siblings.length }, after: { builds: siblings.length + 1 } };
        },
        apply: async (op, { session }) => {
            // imageSourceUrl is portal-only staging (spec §10.1 row 14, uploadStagingScreenshot) or a pasted link -- never a real Loadout field, so it is stripped before it ever reaches Mongo (Mongoose would silently drop it anyway per the schema, but leaving it in `doc` would also leak it into every preview/diff downstream of this payload).
            const { imageSourceUrl, ...doc } = op.payload;
            // A picture the portal uploads at commit goes under the build's code key, whatever key its form sent (MP pictures are keyed WEAPON-CODE since 2026-10-26 01:19 EDT, utils/loadoutImageCache.js codeImageKey): a portal key minted by number is the overwrite this change exists to end.
            if (imageSourceUrl && doc.mode === 'MP' && doc.shareCode) doc.imageKey = require('../../utils/loadoutImageCache').codeImageKey(doc.weaponName, doc.shareCode) || doc.imageKey;
            // A typed build has no slot labels of its own; the catalogue supplies them (deferred-list "Copy the attachment slots ... into Loadout.attachmentSlots": until 2026-10-19 16:19 EDT only /autobuild ever wrote slots). An /autobuild payload that carries its own keeps them.
            if (!doc.attachmentSlots?.length) {
                const slots = await slotsFor(doc.attachments);
                if (slots.length) doc.attachmentSlots = slots;
            }
            const res = await createDocument({ Model: Loadout, doc, session });
            const saved = await Loadout.findById(res.id).session(session);
            // Best-effort, same tolerance as /autobuild's own Confirm step: a failed image upload never fails the build itself -- coverageFlags already has 'missing-image' to catch the result, and the admin can retry via Edit. Runs after the commit (core/changeset.js afterCommit), so an aborted changeset never leaves an uploaded image behind a build that does not exist.
            const imageKey = saved.imageKey;
            await syncLoadoutMetadata(saved);
            return {
                ok: true,
                afterCommit: (imageSourceUrl && imageKey) ? async () => {
                    const up = await uploadLoadoutImage(imageSourceUrl, imageKey);
                    return up.success ? null : `Image upload failed: ${up.error}. Fix the key later via Edit.`;
                } : undefined,
                change: { action: 'add', model: 'Loadout', target: `${op.payload.weaponName} (${op.payload.buildName})`,
                          summary: `Added loadout "${op.payload.weaponName} (${op.payload.buildName})"` },
                applied: { id: res.id }
            };
        },
        invert: (c) => ({ type: 'loadout.delete', target: { id: c.applied.id } })
    },

    'loadout.edit': {
        action: ['loadouts_mp:edit', 'loadouts_dmz:edit'], tier: 1,
        validate: (op) => op.target?.id ? validateBuild(op.payload) : { ok: false, errors: ['No build was selected.'] },
        preview: async (op) => {
            const cur = await Loadout.findById(op.target.id).lean();
            return { before: cur, after: { ...cur, ...op.payload } };
        },
        apply: async (op, { session }) => {
            const cur = await Loadout.findById(op.target.id).session(session).lean();
            if (!cur) return { ok: false, reason: 'missing' };
            // imageSourceUrl is portal-only staging, same as loadout.add above -- stripped before it can reach `set` (and therefore `prior`/the invert payload).
            const { imageSourceUrl, ...payload } = op.payload;
            // Same as loadout.add above: a picture uploaded at commit goes under the code key.
            const finalCode = payload.shareCode ?? cur.shareCode;
            if (imageSourceUrl && (payload.mode || cur.mode) === 'MP' && finalCode) payload.imageKey = require('../../utils/loadoutImageCache').codeImageKey(payload.weaponName || cur.weaponName, finalCode) || payload.imageKey;
            // Slot labels only ever come from /autobuild's vision extraction, and a plain-text edit can't supply new ones -- keep the existing mapping ONLY when the attachment list is byte-for-byte unchanged (same length + same names in the same order); any real change invalidates slot identity, so it's cleared rather than carried forward misaligned.
            const existingAttachments = cur.attachments || [];
            const newAttachments = payload.attachments || [];
            const attachmentsUnchanged = newAttachments.length === existingAttachments.length
                && newAttachments.every((a, i) => a === existingAttachments[i]);
            // Kept when the list is unchanged and already slotted; otherwise read from the catalogue, so an edit fills a build that had none and never carries old slots onto a different list.
            let attachmentSlots = attachmentsUnchanged ? (cur.attachmentSlots || []) : [];
            if (!attachmentSlots.length) attachmentSlots = await slotsFor(newAttachments);
            // lastUpdated is stamped here (2026-10-20, v3 sweep) -- nothing wrote it after a build's creation, so every card's "Updated" date and the Cloudinary Last_Updated metadata showed the creation date forever. It goes in `set`, so `prior` keeps the old date for the inverse.
            const set = { ...payload, attachmentSlots, lastUpdated: new Date() };
            const prior = Object.fromEntries(Object.keys(set).map(k => [k, cur[k]]));
            const res = await updateDocument({ Model: Loadout, id: op.target.id, expectVersion: cur.__v, set, session });
            if (!res.ok) return res;
            // Read WITH the session, or the sync publishes the pre-edit data (snapshot isolation outside the transaction).
            const saved = await Loadout.findById(op.target.id).session(session);
            if (saved) await syncLoadoutMetadata(saved, saved.attachmentSlots);
            return {
                ok: true,
                // 🔴 AFTER THE COMMIT: this key already has a live image, and overwrite:true would replace it even if this changeset later rolls back.
                afterCommit: (imageSourceUrl && set.imageKey) ? async () => {
                    const up = await uploadLoadoutImage(imageSourceUrl, set.imageKey);
                    return up.success ? null : `Image upload failed: ${up.error}.`;
                } : undefined,
                change: { action: 'edit', model: 'Loadout', target: `${cur.weaponName} (${cur.buildName})`,
                          summary: `Edited loadout "${cur.weaponName} (${cur.buildName})"` },
                applied: { id: op.target.id, prior, version: res.version }
            };
        },
        invert: (c) => ({ type: 'loadout.edit', target: { id: c.applied.id }, payload: c.applied.prior })
    },

    'loadout.delete': {
        action: ['loadouts_mp:delete', 'loadouts_dmz:delete'], tier: 1,
        validate: (op) => op.target?.id ? { ok: true, errors: [], normalized: op } : { ok: false, errors: ['No build was selected.'] },
        preview: async (op) => ({ before: { build: await Loadout.findById(op.target.id).lean() }, after: { build: null } }),
        apply: async (op, { session }) => {
            const cur = await Loadout.findById(op.target.id).session(session).lean();
            if (!cur) return { ok: false, reason: 'missing' };
            const res = await deleteDocument({ Model: Loadout, id: op.target.id, expectVersion: cur.__v, session });
            if (!res.ok) return res;
            const { _id, __v, ...rest } = cur;
            return {
                ok: true,
                change: { action: 'delete', model: 'Loadout', target: `${cur.weaponName} (${cur.buildName})`,
                          summary: `Deleted loadout "${cur.weaponName} (${cur.buildName})"` },
                applied: { removed: rest }
            };
        },
        invert: (c) => ({ type: 'loadout.add', payload: c.applied.removed })
    },

    'loadout.bulkAdd': {
        action: ['loadouts_mp:bulkadd', 'loadouts_dmz:bulkadd'], tier: 2,
        validate: (op) => {
            if (!MODES.includes(op.target?.mode)) return { ok: false, errors: ['Bulk add needs a mode (MP or DMZ).'] };
            if (op.payload?.parsed) return { ok: true, errors: [], normalized: op }; // an inverse -- do not re-parse
            const { parsed, errors } = parseBulkLoadoutList(op.payload.text || '');
            if (!parsed?.length) return { ok: false, errors: errors.length ? errors : ['Nothing in that text parsed as a loadout.'] };
            applyModeToParsed(parsed, op.target.mode, errors);
            return { ok: true, errors: [], normalized: { ...op, payload: { ...op.payload, parsed, parseErrors: errors } } };
        },
        preview: async (op) => ({ before: { builds: await Loadout.countDocuments({ mode: op.target.mode }) }, after: { touching: op.payload.parsed.length } }),
        apply: async (op, { session }) => {
            const before = await Loadout.find({ mode: op.target.mode }).session(session).lean();
            const ids = before.map(b => String(b._id));
            const { created, updated, touchedKeys, missingImages, updatedPriors } = await upsertBulkBlocks(op.payload.parsed, op.target.mode, session);
            const after = await Loadout.find({ mode: op.target.mode }).session(session).lean();
            const newIds = after.map(b => String(b._id)).filter(id => !ids.includes(id));
            return {
                ok: true,
                change: { action: 'bulkAdd', model: 'Loadout', target: `${op.target.mode} Loadouts`,
                          summary: `Bulk import ${op.target.mode} loadouts`, detail: `${created} created, ${updated} updated` },
                applied: { mode: op.target.mode, newIds, touchedKeys: [...touchedKeys], created, updated,
                           missingImages, parseErrors: op.payload.parseErrors || [], updatedPriors }
            };
        },
        // 🔴 Deleting only the newly-created ids is HALF an inverse -- any build this bulk paste overwrote IN PLACE (matched an existing {weaponKey,mode,buildName}) is left un-reverted with no error. A compound changeset restores both halves: delete what was created, and restore every overwritten doc to its captured prior state.
        invert: (c) => {
            const ops = [];
            if (c.applied.newIds?.length) ops.push({ type: 'loadout.bulkDelete', target: { mode: c.applied.mode }, payload: { ids: c.applied.newIds } });
            for (const p of c.applied.updatedPriors || []) ops.push({ type: 'loadout.edit', target: { id: p.id }, payload: p.prior });
            return ops;
        }
    },

    // Same apply() as loadout.bulkAdd -- see the header note. Kept a distinct op type only so the registry's separate `bulkreplace` action id has something to resolve to.
    'loadout.bulkReplace': {
        action: ['loadouts_mp:bulkreplace', 'loadouts_dmz:bulkreplace'], tier: 2,
        validate: (op) => {
            if (!MODES.includes(op.target?.mode)) return { ok: false, errors: ['Replace needs a mode (MP or DMZ).'] };
            if (op.payload?.parsed) return { ok: true, errors: [], normalized: op };
            const { parsed, errors } = parseBulkLoadoutList(op.payload.text || '');
            if (!parsed?.length) return { ok: false, errors: errors.length ? errors : ['Nothing in that text parsed as a loadout.'] };
            applyModeToParsed(parsed, op.target.mode, errors);
            return { ok: true, errors: [], normalized: { ...op, payload: { ...op.payload, parsed, parseErrors: errors } } };
        },
        preview: async (op) => ({ before: { builds: await Loadout.countDocuments({ mode: op.target.mode }) }, after: { touching: op.payload.parsed.length } }),
        apply: async (op, { session }) => {
            const before = await Loadout.find({ mode: op.target.mode }).session(session).lean();
            const ids = before.map(b => String(b._id));
            const { created, updated, touchedKeys, missingImages, updatedPriors } = await upsertBulkBlocks(op.payload.parsed, op.target.mode, session);
            const after = await Loadout.find({ mode: op.target.mode }).session(session).lean();
            const newIds = after.map(b => String(b._id)).filter(id => !ids.includes(id));
            return {
                ok: true,
                change: { action: 'bulkReplace', model: 'Loadout', target: `${op.target.mode} Loadouts`,
                          summary: `Bulk replace ${op.target.mode} loadouts`, detail: `${created} created, ${updated} updated` },
                applied: { mode: op.target.mode, newIds, touchedKeys: [...touchedKeys], created, updated,
                           missingImages, parseErrors: op.payload.parseErrors || [], updatedPriors }
            };
        },
        // 🔴 Deleting only the newly-created ids is HALF an inverse -- any build this bulk paste overwrote IN PLACE (matched an existing {weaponKey,mode,buildName}) is left un-reverted with no error. A compound changeset restores both halves: delete what was created, and restore every overwritten doc to its captured prior state.
        invert: (c) => {
            const ops = [];
            if (c.applied.newIds?.length) ops.push({ type: 'loadout.bulkDelete', target: { mode: c.applied.mode }, payload: { ids: c.applied.newIds } });
            for (const p of c.applied.updatedPriors || []) ops.push({ type: 'loadout.edit', target: { id: p.id }, payload: p.prior });
            return ops;
        }
    },

    'loadout.bulkDelete': {
        action: ['loadouts_mp:bulkdelete', 'loadouts_dmz:bulkdelete'], tier: 2,
        validate: (op) => {
            const hasIds = op.payload?.ids?.length > 0;
            const hasLines = op.payload?.lines?.length > 0;
            return (hasIds || hasLines) ? { ok: true, errors: [], normalized: op } : { ok: false, errors: ['Nothing was selected to delete.'] };
        },
        preview: async (op) => {
            if (op.payload.ids?.length) return { before: { removing: op.payload.ids.length } };
            const mode = op.target.mode;
            const candidates = await Loadout.find({ mode }).lean();
            let count = 0;
            for (const line of op.payload.lines || []) {
                const [weaponPart, buildPart] = line.split('|').map(p => p?.trim());
                if (!weaponPart) continue;
                const match = candidates.find(l => fuzzyMatch(weaponPart, l.weaponName));
                if (!match) continue;
                count += buildPart ? 1 : candidates.filter(l => l.weaponKey === match.weaponKey).length;
            }
            return { before: { count: candidates.length }, after: { removing: count } };
        },
        apply: async (op, { session }) => {
            const removed = []; const notFound = [];
            if (op.payload.ids?.length) {
                for (const id of op.payload.ids) {
                    const doc = await Loadout.findById(id).session(session).lean();
                    if (doc) removed.push(doc);
                }
            } else {
                const mode = op.target.mode;
                const candidates = await Loadout.find({ mode }).session(session).lean();
                for (const line of op.payload.lines || []) {
                    const [weaponPart, buildPart] = line.split('|').map(p => p?.trim());
                    if (!weaponPart) { notFound.push(`"${line}" (need at least a weapon name)`); continue; }
                    const match = candidates.find(l => fuzzyMatch(weaponPart, l.weaponName));
                    if (!match) { notFound.push(`${weaponPart} (${mode})`); continue; }
                    if (buildPart) {
                        const buildDoc = candidates.find(l => l.weaponKey === match.weaponKey && l.buildName === buildPart);
                        if (buildDoc) removed.push(buildDoc);
                        else notFound.push(`${weaponPart} | ${buildPart}`);
                    } else {
                        removed.push(...candidates.filter(l => l.weaponKey === match.weaponKey));
                    }
                }
            }
            if (!removed.length) return { ok: false, reason: 'missing' };
            await Loadout.deleteMany({ _id: { $in: removed.map(r => r._id) } }, { session });
            return {
                ok: true,
                change: { action: 'bulkDelete', model: 'Loadout', target: `${removed.length} builds`,
                          summary: `Deleted ${removed.length} loadouts in bulk`,
                          detail: notFound.length ? `Not found: ${notFound.join(', ')}` : undefined },
                applied: { removed: removed.map(({ _id, __v, ...r }) => r), mode: removed[0]?.mode }
            };
        },
        invert: (c) => ({ type: 'loadout.bulkAdd', target: { mode: c.applied.mode }, payload: { parsed: c.applied.removed } })
    }
});

module.exports = { bulkEntryWrite };
