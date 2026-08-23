// core/ops/index.js
//
// THE OP CONTRACT. Every mutation in this system is a value — { type, target, payload } — and this module is the only thing that knows how a type maps to behaviour. Entities register here; nothing else may.
//
// ⚠️ The op vocabulary is DERIVED from utils/manageActions.js, never declared beside it. That registry exists because two hand-synced copies of the action list was judged unacceptable, and a third copy here would recreate that bug across two runtimes. scripts/coreOps.test.js asserts conservation in both directions.
const REGISTRY = new Map();          // opType -> { validate, preview, apply, invert }
const ACTION_TO_OP = new Map();      // "page:actionId" -> opType
const OP_TO_ACTION = new Map();      // opType -> "page:actionId"
const OP_TO_PAGE = new Map();        // opType -> page key, for ops that have NO action (see registerEntity)

function registerEntity(entity, opTypes) {
    for (const [type, impl] of Object.entries(opTypes)) {
        if (REGISTRY.has(type)) throw new Error(`duplicate op type "${type}"`);
        for (const verb of ['validate', 'preview', 'apply', 'invert']) {
            if (typeof impl[verb] !== 'function') throw new Error(`${type} is missing ${verb}()`);
        }
        REGISTRY.set(type, impl);
        // 🔴 `action` is a STRING OR AN ARRAY. The mapping is genuinely many-to-one: draws alone has TEN mutating actions and seven op types — addnew/addreturning are one op differing by payload, purgenew/purgereturning/purgeall are one op differing by scope. A 1:1 Map cannot express that, and coreOps.test.js's conservation check could never pass over one.
        const actions = impl.action ? (Array.isArray(impl.action) ? impl.action : [impl.action]) : [];
        for (const a of actions) {
            if (ACTION_TO_OP.has(a)) throw new Error(`action "${a}" is already claimed by "${ACTION_TO_OP.get(a)}"`);
            ACTION_TO_OP.set(a, type);
        }
        if (actions.length) OP_TO_ACTION.set(type, actions);
        // 🔴 `page` EXISTS FOR INVERSE-ONLY OPS, and giving them an `action` instead would be wrong. Six ops here (patchnote.removeSeason/restoreSeason/editSeason/restore, season.restoreSnapshot/restoreDraft) are reachable ONLY as another op's invert() target -- there is no /manage button for them and there must not be one. Without a declared page, core/changeset.js's pageForOp() fell back to `op.type.split('.')[0]`, which stamped ChangeLog.page with `patchnote` (SINGULAR) -- a key utils/adminAccess.js's MANAGE_PAGE_SCOPES does not contain, so hasManagePageAccess(userId, row.page) could never match a `manage.patchnotes` grant and silently denied every scoped admin. season.restoreDraft was worse in both directions: it recorded `season`, so reverting a discarded DRAFT was gated on manage.season rather than manage.seasondraft.
        if (impl.page) {
            // Two spellings of the same fact must never coexist -- if an op somehow has both, they have to agree, and a boot-time throw is far cheaper than a wrong permission check nobody can see.
            if (actions.length && !actions.some(a => a.split(':')[0] === impl.page)) {
                throw new Error(`op "${type}" declares page "${impl.page}" but its actions live on ${actions.map(a => a.split(':')[0]).join('/')}`);
            }
            OP_TO_PAGE.set(type, impl.page);
        }
    }
}

function resolveOp(type) {
    const impl = REGISTRY.get(type);
    if (!impl) throw new Error(`unknown op type "${type}"`);
    return impl;
}

const listOpTypes = () => [...REGISTRY.keys()];
const opTypeForAction = (page, actionId) => ACTION_TO_OP.get(`${page}:${actionId}`) || null;
const actionForOpType = (type) => OP_TO_ACTION.get(type) || null;   // an ARRAY of `page:id` keys, or null
const pageForOpType = (type) => OP_TO_PAGE.get(type) || null;       // an explicit page key for an action-less op, or null

// 🔴 ORDER IS LOAD-BEARING AND THIS IS NOT STYLE. `module.exports` is assigned FIRST, then the entities are required. Entities do `const { registerEntity } = require('./index')`, so if that require sits ABOVE this assignment, `module.exports` is still the default `{}` at that moment and `registerEntity` is `undefined` — a hard TypeError on load, before a single test runs. An earlier draft of this plan had exactly that shape and would have failed on the first `require`.
module.exports = { registerEntity, resolveOp, listOpTypes, opTypeForAction, actionForOpType, pageForOpType };

// AFTER the export, never before. Entities self-register as a side effect of being required.
require('./draws');
require('./calendar');
require('./loadouts');
require('./patchnotes');
require('./season');
require('./announcements');
