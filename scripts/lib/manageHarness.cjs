// scripts/lib/manageHarness.cjs -- drive /manage's handlers end to end with no database and no Discord (code-housekeeping, 2026-11-04 12:08 EST). Why: the /manage handlers write prod data and ran 12–18% of their lines under npm test, because every path goes through core/changeset.js's commitSet, which needs a Mongo session. This stands in for exactly what that path touches: the one SeasonalData document (findOne, updateOne with $set / $push / $pull and the positional `.$.` writes core/mongo/positional.js builds, countDocuments), the session, the ChangeLog writer, the owner check, Cloudinary's thumbnail resolver and the draw catalogue. Everything else, ops, handlers and panels, runs for real. Use: require this BEFORE anything under handlers/ or core/, then `harness.reset({ newDraws: [...] })` per check and `harness.modal(customId, fields)` for an interaction.
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const req = rel => require(path.join(ROOT, rel));
const mongoose = req('node_modules/mongoose');

const clone = v => JSON.parse(JSON.stringify(v ?? null));
const OWNER = req('utils/owner').ALLOWED_ADMIN_ID;   // the real owner id, so every gate (checkOps, checkRevert, the panels) treats the test's user as the owner
const state = { doc: null, changes: [] };

// A filter matches the one document when every key holds: docType, a top-level field, `<array>._id` (that element exists) and `<array>.<field>` (that element's field equals the value: the guard positional.js adds).
function elementOf(doc, filter) {
    const idKey = Object.keys(filter).find(k => k.endsWith('._id'));
    if (!idKey) return { arrayPath: null, el: null };
    const arrayPath = idKey.slice(0, -'._id'.length);
    const arr = arrayPath.split('.').reduce((o, k) => o?.[k], doc) || [];
    return { arrayPath, el: arr.find(e => String(e._id) === String(filter[idKey])) || null };
}
function matches(doc, filter = {}) {
    if (!doc) return false;
    const { arrayPath, el } = elementOf(doc, filter);
    for (const [k, v] of Object.entries(filter)) {
        if (arrayPath && k === `${arrayPath}._id`) { if (!el) return false; continue; }
        if (arrayPath && k.startsWith(`${arrayPath}.`)) { if (JSON.stringify(clone(el[k.slice(arrayPath.length + 1)])) !== JSON.stringify(clone(v))) return false; continue; }
        if (JSON.stringify(clone(k.split('.').reduce((o, p) => o?.[p], doc))) !== JSON.stringify(clone(v))) return false;
    }
    return true;
}
const setPath = (obj, dotted, value) => { const ks = dotted.split('.'); const last = ks.pop(); const t = ks.reduce((o, k) => (o[k] ??= {}), obj); t[last] = value; };
const getPath = (obj, dotted) => dotted.split('.').reduce((o, k) => o?.[k], obj);
const withId = v => (v && typeof v === 'object' && !Array.isArray(v) && !v._id ? { _id: String(new mongoose.Types.ObjectId()), ...v } : v);

function query(value) {
    const q = { select: () => q, lean: () => q, session: () => q, sort: () => q, limit: () => q, exec: () => Promise.resolve(clone(value)), then: (ok, bad) => Promise.resolve(clone(value)).then(ok, bad) };
    return q;
}

const SeasonalData = req('models/SeasonalData');
SeasonalData.findOne = (filter = {}) => query(matches(state.doc, filter) ? state.doc : null);
SeasonalData.countDocuments = async (filter = {}) => (matches(state.doc, filter) ? 1 : 0);
SeasonalData.updateOne = async (filter = {}, update = {}) => {
    if (!matches(state.doc, filter)) return { matchedCount: 0, modifiedCount: 0 };
    const { el } = elementOf(state.doc, filter);
    let modified = 0;
    for (const [k, v] of Object.entries(update.$set || {})) {
        if (k.includes('.$.')) { const [, field] = k.split('.$.'); el[field] = clone(v); } else setPath(state.doc, k, clone(Array.isArray(v) ? v.map(withId) : v));
        modified = 1;
    }
    for (const k of Object.keys(update.$unset || {})) { if (k.includes('.$.')) delete el[k.split('.$.')[1]]; modified = 1; }
    for (const [k, v] of Object.entries(update.$push || {})) { const arr = getPath(state.doc, k) || []; arr.push(withId(clone(v))); setPath(state.doc, k, arr); modified = 1; }
    for (const [k, v] of Object.entries(update.$pull || {})) {
        const arr = getPath(state.doc, k) || []; const keep = arr.filter(e => String(e._id) !== String(v._id));
        if (keep.length !== arr.length) modified = 1; setPath(state.doc, k, keep);
    }
    return { matchedCount: 1, modifiedCount: modified };
};

// A failed op rolls back, as a real transaction would: the document is put back as it was before the set began. Reads that check for a live connection first (utils/catalogue.js) take the stand-ins as connected. Every model is compiled first: compiling one against a 'connected' connection with no driver behind it throws.
for (const f of require('fs').readdirSync(path.join(ROOT, 'models')).filter(f => f.endsWith('.js'))) req(`models/${f}`);
Object.defineProperty(mongoose.connection, 'readyState', { get: () => 1, configurable: true });
mongoose.startSession = async () => ({ withTransaction: async fn => { const saved = clone(state.doc); const savedChanges = state.changes.length; const savedRows = Object.fromEntries(Object.entries(collections).map(([n, c]) => [n, clone(c.rows)])); try { return await fn(); } catch (e) { state.doc = saved; state.changes.length = savedChanges; for (const [n, c] of Object.entries(collections)) { c.rows.length = 0; c.rows.push(...savedRows[n]); } throw e; } }, endSession: async () => {} });
const changeStore = req('utils/changeStore');
changeStore.recordChangeIn = async (session, fields) => { const changeId = `T${state.changes.length + 1}`; state.changes.push({ changeId, ...clone(fields) }); return { changeId }; };
const adminAccess = req('utils/adminAccess');
const cloudinaryCache = req('utils/cloudinaryCache');
cloudinaryCache.resolveThumbnail = async (title, url) => ({ url: url || null });
// No delegated admins: only the owner may write, so a non-admin's attempt is refused by the real permission check.
const AdminUser = req('models/AdminUser');
AdminUser.find = () => query([]);
AdminUser.findOne = () => query(null);
const drawCatalog = req('utils/drawCatalog');
drawCatalog.loadCatalog = async () => [];

// A whole collection in memory, for the models that hold many documents (Loadout, CatalogueItem, VisionRead). Documents go in through `new Model(doc)`, so schema defaults and casting apply as they would on a save. Filters support what this code base sends: plain equality on dotted paths, a RegExp, and $in / $nin / $ne / $exists / $regex / $or / $and.
function fieldOf(doc, p) { return p.split('.').reduce((o, k) => o?.[k], doc); }
function same(a, b) { return JSON.stringify(clone(a)) === JSON.stringify(clone(b)); }
function test(value, cond) {
    if (cond instanceof RegExp) return Array.isArray(value) ? value.some(v => cond.test(String(v))) : value != null && cond.test(String(value));
    if (cond && typeof cond === 'object' && !Array.isArray(cond) && Object.keys(cond).some(k => k.startsWith('$'))) {
        return Object.entries(cond).every(([op, v]) => {
            if (op === '$in') return v.some(x => (Array.isArray(value) ? value.some(y => same(y, x)) : same(value, x)));
            if (op === '$nin') return !v.some(x => same(value, x));
            if (op === '$ne') return !same(value, v);
            if (op === '$exists') return (value !== undefined) === Boolean(v);
            if (op === '$regex') return new RegExp(v, cond.$options || '').test(String(value ?? ''));
            if (op === '$options') return true;
            if (op === '$gt') return value > v; if (op === '$gte') return value >= v; if (op === '$lt') return value < v; if (op === '$lte') return value <= v;
            throw new Error(`manageHarness: query operator ${op} is not emulated`);
        });
    }
    return Array.isArray(value) && !Array.isArray(cond) ? value.some(v => same(v, cond)) : same(value, cond);
}
function docMatches(doc, filter = {}) {
    return Object.entries(filter || {}).every(([k, v]) => {
        if (k === '$or') return v.some(f => docMatches(doc, f));
        if (k === '$and') return v.every(f => docMatches(doc, f));
        return test(fieldOf(doc, k), v);
    });
}
function memoryCollection(Model) {
    const rows = [];
    const toRow = d => ({ __v: 0, ...clone(new Model(d).toObject({ virtuals: false })) });   // a saved document carries __v, which core/mongo/document.js's versioned writes match on
    const applyUpdate = (row, update, inserting) => {
        const plain = Object.keys(update).some(k => !k.startsWith('$')) ? { $set: update } : update;
        for (const [k, v] of Object.entries(plain.$set || {})) setPath(row, k, clone(v));
        if (inserting) for (const [k, v] of Object.entries(plain.$setOnInsert || {})) setPath(row, k, clone(v));
        for (const k of Object.keys(plain.$unset || {})) { const ks = k.split('.'); const last = ks.pop(); const t = ks.reduce((o, x) => o?.[x], row); if (t) delete t[last]; }
        for (const [k, v] of Object.entries(plain.$inc || {})) setPath(row, k, (getPath(row, k) || 0) + v);
        for (const [k, v] of Object.entries(plain.$push || {})) { const arr = getPath(row, k) || []; arr.push(...(v && v.$each ? v.$each : [v]).map(clone)); setPath(row, k, arr); }
        for (const [k, v] of Object.entries(plain.$addToSet || {})) { const arr = getPath(row, k) || []; for (const x of (v && v.$each ? v.$each : [v])) if (!arr.some(y => same(y, x))) arr.push(clone(x)); setPath(row, k, arr); }
        for (const [k, v] of Object.entries(plain.$pull || {})) setPath(row, k, (getPath(row, k) || []).filter(x => !(v && typeof v === 'object' ? docMatches(x, v) : same(x, v))));
    };
    const list = (filter) => rows.filter(r => docMatches(r, filter));
    const byId = id => ({ _id: String(id) });
    const api = {
        rows,
        seed(docs) { rows.length = 0; for (const d of docs) rows.push(toRow(d)); },
        find: (filter) => query(list(filter)),
        findOne: (filter) => query(list(filter)[0] || null),
        findById: (id) => query(list(byId(id))[0] || null),
        countDocuments: async (filter) => list(filter).length,
        exists: async (filter) => (list(filter)[0] ? { _id: list(filter)[0]._id } : null),
        distinct: async (field, filter) => [...new Set(list(filter).map(r => fieldOf(r, field)))],
        aggregate: async () => [],
        create: async (docs) => { const many = Array.isArray(docs); const made = (many ? docs : [docs]).map(toRow); rows.push(...made); const out = made.map(clone); return many ? out : out[0]; },
        insertMany: async (docs) => api.create(docs),
        updateOne: async (filter, update, opts = {}) => {
            const row = list(filter)[0];
            if (!row) { if (opts.upsert) { const n = toRow(Object.fromEntries(Object.entries(filter).filter(([k]) => !k.startsWith('$')))); applyUpdate(n, update, true); rows.push(n); return { matchedCount: 0, modifiedCount: 0, upsertedCount: 1 }; } return { matchedCount: 0, modifiedCount: 0 }; }
            applyUpdate(row, update, false); return { matchedCount: 1, modifiedCount: 1 };
        },
        updateMany: async (filter, update) => { const hit = list(filter); hit.forEach(r => applyUpdate(r, update, false)); return { matchedCount: hit.length, modifiedCount: hit.length }; },
        findOneAndUpdate: (filter, update, opts = {}) => { const before = clone(list(filter)[0] || null); const done = api.updateOne(filter, update, opts).then(() => (opts.new || opts.returnDocument === 'after' ? clone(list(filter)[0] || null) : before)); return Object.assign(query(null), { then: (a, b) => done.then(a, b), lean: () => done, session: () => ({ lean: () => done, then: (a, b) => done.then(a, b) }) }); },
        findByIdAndUpdate: (id, update, opts) => api.findOneAndUpdate(byId(id), update, opts),
        deleteOne: async (filter) => { const i = rows.findIndex(r => docMatches(r, filter)); if (i < 0) return { deletedCount: 0 }; rows.splice(i, 1); return { deletedCount: 1 }; },
        deleteMany: async (filter) => { const keep = rows.filter(r => !docMatches(r, filter)); const n = rows.length - keep.length; rows.length = 0; rows.push(...keep); return { deletedCount: n }; },
        findByIdAndDelete: (id) => { const r = list(byId(id))[0] || null; return query(r).then ? Object.assign(query(r), { then: (a, b) => api.deleteOne(byId(id)).then(() => clone(r)).then(a, b) }) : null; },
    };
    Object.assign(Model, api);
    return api;
}
const collections = { Loadout: memoryCollection(req('models/Loadout')), CatalogueItem: memoryCollection(req('models/CatalogueItem')), VisionRead: memoryCollection(req('models/VisionRead')) };
// Loadout pictures: uploads and copies succeed without Cloudinary, and every key "exists".
const loadoutImageCache = req('utils/loadoutImageCache');
loadoutImageCache.uploadLoadoutImage = async () => ({ success: true });
loadoutImageCache.copyLoadoutImage = async () => ({ success: true });
req('utils/loadoutRender').checkImageExists = async () => true;

// One modal submit or button press, recording every message the handler sends.
function modal(customId, fields = {}, { selects = {}, values = [], user = OWNER } = {}) {
    const sent = [];
    const interaction = {
        customId, values, user: { id: user, username: 'tester' }, applicationId: 'APP', token: 'TOKEN', replied: false, deferred: false,
        client: { commands: new Map(), user: { id: 'BOT' }, rest: { patch: async () => ({}), post: async () => ({}) } },
        fields: {
            getTextInputValue: k => (k in fields ? fields[k] : ''),
            getStringSelectValues: k => { if (!(k in selects)) throw new Error(`no select ${k}`); return selects[k]; },
            fields: new Map()
        },
        isButton: () => false, isStringSelectMenu: () => false, isModalSubmit: () => true,
        deferReply: async () => { interaction.deferred = true; },
        deferUpdate: async () => { interaction.deferred = true; },
        reply: async p => { interaction.replied = true; sent.push(p); return { id: `m${sent.length}` }; },
        followUp: async p => { sent.push(p); return { id: `m${sent.length}` }; },
        editReply: async p => { sent.push(p); return { id: `m${sent.length}` }; },
        update: async p => { sent.push(p); return { id: `m${sent.length}` }; },
        showModal: async p => { sent.push({ modal: p }); },
        sent,
        text: () => JSON.stringify(sent)
    };
    return interaction;
}

function reset(doc = {}) {
    state.doc = { docType: 'global', currentSeasonTitle: 'Season 9: Test', newDraws: [], returningDraws: [], calendar: [], patchNotes: [], ...clone(doc) };   // the arrays Mongoose stores as [] by default
    state.changes = [];
}

module.exports = { OWNER, state, reset, modal, collections, id: () => String(new mongoose.Types.ObjectId()) };
