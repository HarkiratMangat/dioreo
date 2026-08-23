// core/ops/loadouts.js
//
// Six loadout mutations, as ops. MP and DMZ share this one file (mirroring utils/manageActions.js's loadoutModeFor/pageForLoadoutMode) so the two pages cannot drift apart.
//
// ⚠️ Loadouts are THEIR OWN DOCUMENTS. This file uses core/mongo/document.js, never core/mongo/positional.js -- pointing the positional helper at a top-level document matches nothing and returns { ok:false, reason:'missing' }, indistinguishable from a legitimate outcome.
//
// ⚠️ AUDITED AGAINST THE REAL HANDLER (handlers/manage/loadouts.js), not transcribed from the plan document -- three real defects the plan's own draft would have shipped:
//   1. weaponKey is `weaponName.toLowerCase().replace(/\s+/g,'')` -- a PLAIN normalize, the same one both add/edit handlers use inline. It is NOT utils/loadoutRender.js's computeWeaponKeyAndBuild(), which is /autobuild's AUTO-NAMING helper: it invents its own buildName ("Build N") and imageKey from the weapon name, discarding whatever the admin typed into those two fields. Calling it here would silently overwrite an admin's real build name.
//   2. "Add Multiple" is ALREADY an upsert by {weaponKey, mode, buildName} in the real handler (existing = Loadout.findOne(...); updateOne if found, else insert) -- a blind createDocument() per parsed block would create duplicate documents on every re-run of the same paste.
//   3. "Replace Multiple" reuses the EXACT SAME modal and handler function as "Add Multiple" (manageActions.js's loadoutsActions() opens buildLoadoutsBulkAddModal for BOTH ids) -- there is no wholesale-replace behaviour for loadouts at all, unlike draws/calendar. A first draft that implemented bulkReplace as `deleteMany({mode})` + recreate would have wiped every loadout of that mode not mentioned in the paste -- the exact class of bug already found once for draws. loadout.bulkReplace therefore has the SAME apply() body as loadout.bulkAdd (kept as a distinct op type only so utils/manageActions.js's separate `bulkreplace` action id has something to resolve to -- see core/ops/index.js's registry, which forbids two actions claiming one type but allows two types sharing an apply body).
//   4. "Delete Multiple" fuzzy-matches pasted WEAPON NAMES (optionally "Weapon | Build Name" for one specific build) via utils/search.js's fuzzyMatch -- never element ids.
//   5. Both add and edit run Cloudinary structured-metadata sync (utils/loadoutImageCache.js's syncLoadoutMetadata) and edit additionally PROPAGATES badges (isMeta/categoryRank/ dmzRangeRank/isToxic) to every sibling build sharing weaponKey+mode -- badges describe the WEAPON, not one build variant. Propagation is deliberately NOT done on add (a blank badges field there is the common case and would silently wipe existing siblings' badges).
// ⚠️ MODE IS NOT PARSED FROM THE BULK TEXT, and never really was. upsertBulkBlocks() below does `{ ...rawEntry, mode }` -- the page's mode, unconditionally. The bulk format used to REQUIRE a Mode segment anyway, so a block typed `DMZ` and pasted on the MP page parsed with zero errors and saved as MP (verified live 2026-08-22). The format dropped the field on 2026-08-22 rather than the override; do not "restore" a per-block mode here without also deciding what an MP page creating DMZ builds should mean.
//   6. attachments are stored EXACTLY as typed, in the order typed -- the plan's own Interfaces line named utils/adminParser.js's orderAttachmentsBySlot as a consumed function, but it is never called anywhere in handlers/manage/loadouts.js (it belongs to /autobuild's vision-extraction pipeline). Calling it here would silently REORDER every admin-typed attachment list. Real editLoadout only carries `attachmentSlots` forward when the attachment array is BYTE-FOR-BYTE unchanged from the existing document (slot identity is otherwise meaningless) -- that comparison needs the existing doc, so it lives in loadout.edit's apply(), not this pure validator.
const { registerEntity } = require('./index');
const { updateDocument, createDocument, deleteDocument } = require('../mongo/document');
const { parseBulkLoadoutList, correctGunsmithCode } = require('../../utils/adminParser');
const { fuzzyMatch } = require('../../utils/search');
const { checkImageExists } = require('../../utils/loadoutRender');
const { syncLoadoutMetadata } = require('../../utils/loadoutImageCache');
const Loadout = require('../../models/Loadout');

const MODES = ['MP', 'DMZ'];
const deriveWeaponKey = (weaponName) => (weaponName || '').toLowerCase().replace(/\s+/g, '');

function validateBuild(payload) {
    const errors = [];
    if (!payload?.weaponName?.trim()) errors.push('A build needs a weapon name.');
    if (!MODES.includes(payload?.mode)) errors.push(`Mode must be one of ${MODES.join(' or ')}.`);
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
                categoryRank: payload.categoryRank ?? null, dmzRangeRank: payload.dmzRangeRank ?? null
            }
        }
    };
}

async function propagateBadges({ weaponKey, mode, excludeId, isMeta, categoryRank, dmzRangeRank, isToxic, session }) {
    return await Loadout.updateMany(
        { weaponKey, mode, ...(excludeId ? { _id: { $ne: excludeId } } : {}) },
        { isMeta, categoryRank, dmzRangeRank, isToxic },
        { session }
    );
}

// ⚠️ MUST read WITH the transaction's own session -- a read with no session against a document inside an in-flight transaction does not see that transaction's own uncommitted writes (Mongo transactions use snapshot isolation outside the session), so this would otherwise sync Cloudinary metadata from PRE-edit data every time. Found during a second-pass audit, not the first.
async function syncSiblings(weaponKey, mode, session) {
    // Promise.all is safe here specifically because syncLoadoutMetadata is a pure Cloudinary HTTP call -- it never touches `session`, so there's no MongoDB ClientSession concurrent-use hazard (a session must not have 2+ in-flight operations at once; that constraint is why the DB-session-bound loops elsewhere in this file stay sequential).
    await Promise.all((await Loadout.find({ weaponKey, mode }).session(session)).map(sib => syncLoadoutMetadata(sib, sib.attachmentSlots)));
}

// The real "Add Multiple"/"Replace Multiple" upsert -- shared by both op types (see header note #3).
async function upsertBulkBlocks(parsed, mode, session) {
    let created = 0, updated = 0;
    const touchedKeys = new Set();
    // Advisory only, matching the real pre-core handler -- never blocks the save, just reported back so the confirmation can flag a build whose Cloudinary key isn't uploaded yet.
    const missingImages = [];
    // 🔴 Every doc UPDATED in place (not created) needs its PRE-update state captured here, or a bulk invert can only delete the newly-created docs and silently leaves every in-place overwrite un-reverted -- the same class of bug draws/calendar's bulk ops already solved by replaying the whole prior array.
    const updatedPriors = [];
    for (const rawEntry of parsed) {
        const entry = { ...rawEntry, mode };
        const { weaponKey, buildName, imageKey } = entry;
        touchedKeys.add(weaponKey);
        const existing = await Loadout.findOne({ weaponKey, mode, buildName }).session(session);
        if (existing) {
            const { _id, __v, ...prior } = existing.toObject();
            updatedPriors.push({ id: String(existing._id), prior });
            await Loadout.updateOne({ _id: existing._id }, entry, { session });
            updated++;
        } else {
            await Loadout.create([entry], { session });
            created++;
        }
        await propagateBadges({
            weaponKey, mode, session,
            isMeta: entry.isMeta, categoryRank: entry.categoryRank, dmzRangeRank: entry.dmzRangeRank, isToxic: entry.isToxic
        });
        if (!(await checkImageExists(imageKey))) missingImages.push({ label: `${entry.weaponName} (${buildName})`, imageKey });
    }
    // Synced once per weaponKey after the whole loop (not per-block), same as the real handler -- a paste with several builds of one weapon shouldn't re-sync the same siblings repeatedly. MISSING from the first draft of this function: touchedKeys was collected and returned but never actually used to sync anything -- found in a second-pass audit, not the first.
    for (const weaponKey of touchedKeys) {
        await syncSiblings(weaponKey, mode, session);
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
            const res = await createDocument({ Model: Loadout, doc: op.payload, session });
            const doc = await Loadout.findById(res.id).session(session);
            await syncLoadoutMetadata(doc);
            return {
                ok: true,
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
            // Slot labels only ever come from /autobuild's vision extraction, and a plain-text edit can't supply new ones -- keep the existing mapping ONLY when the attachment list is byte-for-byte unchanged (same length + same names in the same order); any real change invalidates slot identity, so it's cleared rather than carried forward misaligned.
            const existingAttachments = cur.attachments || [];
            const newAttachments = op.payload.attachments || [];
            const attachmentsUnchanged = newAttachments.length === existingAttachments.length
                && newAttachments.every((a, i) => a === existingAttachments[i]);
            const set = { ...op.payload, attachmentSlots: attachmentsUnchanged ? (cur.attachmentSlots || []) : [] };
            const prior = Object.fromEntries(Object.keys(set).map(k => [k, cur[k]]));
            const res = await updateDocument({ Model: Loadout, id: op.target.id, expectVersion: cur.__v, set, session });
            if (!res.ok) return res;
            const propagateResult = await propagateBadges({
                weaponKey: op.payload.weaponKey, mode: op.payload.mode, excludeId: op.target.id, session,
                isMeta: op.payload.isMeta, categoryRank: op.payload.categoryRank, dmzRangeRank: op.payload.dmzRangeRank, isToxic: op.payload.isToxic
            });
            await syncSiblings(op.payload.weaponKey, op.payload.mode, session);
            return {
                ok: true,
                change: { action: 'edit', model: 'Loadout', target: `${cur.weaponName} (${cur.buildName})`,
                          summary: `Edited loadout "${cur.weaponName} (${cur.buildName})"`,
                          detail: propagateResult.modifiedCount ? `Badges also synced to ${propagateResult.modifiedCount} other build(s) of this weapon.` : undefined },
                applied: { id: op.target.id, prior, version: res.version, propagatedCount: propagateResult.modifiedCount }
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
