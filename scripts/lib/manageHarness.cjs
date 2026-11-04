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

// A failed op rolls back, as a real transaction would: the document is put back as it was before the set began.
mongoose.startSession = async () => ({ withTransaction: async fn => { const saved = clone(state.doc); const savedChanges = state.changes.length; try { return await fn(); } catch (e) { state.doc = saved; state.changes.length = savedChanges; throw e; } }, endSession: async () => {} });
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

module.exports = { OWNER, state, reset, modal, id: () => String(new mongoose.Types.ObjectId()) };
