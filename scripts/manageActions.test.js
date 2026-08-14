// Conservation tests for the /manage action registry (utils/manageActions.js, 2026-08-14).
// Design: docs/superpowers/specs/2026-08-14-manage-slash-decomposition-design.md.
//
// WHAT THIS IS FOR. The registry exists because the action list used to live in two places that
// nothing compared: the button rows in commands/manage.js's buildPagesTable(), and a 220-line
// if/else in handlers/manage.js. The failure that produced was silent in both directions — a button
// with no handler renders as a button that simply does nothing when clicked, and a handler with no
// button is dead code nobody notices. Consolidating them only helps if something CHECKS they stayed
// consolidated, so these tests assert conservation both ways.
//
// Runs with no network and no DB: buildManagePage() is pure given a page key, and resolveAction()
// is never called here (it would need adminAccess's Mongo-backed permission lookup).

const assert = require('assert');
const registry = require('../utils/manageActions');
const manageCommand = require('../commands/manage');

let failures = 0;
function check(name, fn) {
    try {
        fn();
        console.log(`  ✓ ${name}`);
    } catch (error) {
        failures++;
        console.error(`  ✗ ${name}\n      ${error.message}`);
    }
}

const PAGES = manageCommand.PAGES;
const registryPages = Object.keys(registry.ACTIONS_BY_PAGE).sort();

// Walks a rendered page's components and collects every `mng_act_<page>_<id>` it actually emits.
// Deliberately reads the RENDERED OUTPUT rather than the page table, so it also covers the two
// group styles ('inline' accessories vs. plain button rows) that build their buttons differently.
function renderedActionIds(pageKey) {
    const [container] = manageCommand.buildManagePage(pageKey, {}, undefined, null);
    const ids = [];
    const walk = (node) => {
        if (!node || typeof node !== 'object') return;
        if (typeof node.custom_id === 'string' && node.custom_id.startsWith(`mng_act_${pageKey}_`)) {
            ids.push(node.custom_id.slice(`mng_act_${pageKey}_`.length));
        }
        if (node.accessory) walk(node.accessory);
        (node.components || []).forEach(walk);
    };
    walk(container);
    return ids;
}

console.log('/manage action registry — conservation\n');

check('every registry page is a real /manage page', () => {
    const unknown = registryPages.filter(p => !PAGES[p]);
    assert.deepStrictEqual(unknown, [], `registry declares page(s) with no entry in PAGES: ${unknown.join(', ')}`);
});

check('every /manage page has registry actions', () => {
    // A page with no registered action would render with no buttons at all. Only pages whose whole
    // surface is dynamic could legitimately do that, and none currently are.
    const bare = Object.keys(PAGES).filter(p => !registry.listActions(p).length);
    assert.deepStrictEqual(bare, [], `page(s) with no registered actions: ${bare.join(', ')}`);
});

check('every page scope is a real permission scope', () => {
    const { MANAGE_PAGE_SCOPES } = require('../utils/adminAccess');
    // 'manageadmins' has no permission token on purpose — it is owner-only, checked by isOwner().
    const valid = new Set([...MANAGE_PAGE_SCOPES, 'manageadmins']);
    const offenders = [];
    for (const page of registryPages) {
        for (const entry of registry.listActions(page)) {
            if (!valid.has(entry.page)) offenders.push(`${entry.page}:${entry.id} -> unknown scope "${entry.page}"`);
        }
    }
    assert.deepStrictEqual(offenders, [], `\n      ${offenders.join('\n      ')}`);
});

check('every action is filed under the page it claims', () => {
    // Not redundant with the scope check above, which only asks whether `entry.page` is a REAL scope.
    // This asks whether it is the RIGHT one. The two loadout pages are built by a factory precisely so
    // they get separate objects — if that ever became a shared const, the `entry.page = page` loop in
    // the registry would tag MP's entries as DMZ, permissions would resolve against the wrong page,
    // and every other check here would still pass.
    const offenders = [];
    for (const [page, list] of Object.entries(registry.ACTIONS_BY_PAGE)) {
        for (const entry of list) {
            if (entry.page !== page) offenders.push(`${page}:${entry.id} claims page "${entry.page}"`);
        }
    }
    assert.deepStrictEqual(offenders, [], `\n      ${offenders.join('\n      ')}`);
});

check('every RENDERED button resolves to a registry action', () => {
    // buttonFor() throws on an unregistered id, so this also proves every page renders at all.
    const offenders = [];
    for (const page of Object.keys(PAGES)) {
        for (const id of renderedActionIds(page)) {
            if (!registry.getAction(page, id)) offenders.push(`${page}:${id} rendered but not registered`);
        }
    }
    assert.deepStrictEqual(offenders, [], `\n      ${offenders.join('\n      ')}`);
});

check('every registry action is REACHABLE from its page', () => {
    // The other direction: an action nobody can click is dead weight that still reads as supported.
    const offenders = [];
    for (const page of registryPages) {
        const rendered = new Set(renderedActionIds(page));
        for (const entry of registry.listActions(page)) {
            if (!rendered.has(entry.id)) offenders.push(`${page}:${entry.id} registered but no button renders it`);
        }
    }
    assert.deepStrictEqual(offenders, [], `\n      ${offenders.join('\n      ')}`);
});

check('every action declares a callable run()', () => {
    const offenders = [];
    for (const page of registryPages) {
        for (const entry of registry.listActions(page)) {
            if (typeof entry.run !== 'function') offenders.push(`${page}:${entry.id} has no run()`);
            if (!['modal', 'file', 'confirm', 'view'].includes(entry.kind)) offenders.push(`${page}:${entry.id} has unknown kind "${entry.kind}"`);
            if (typeof entry.slash !== 'boolean') offenders.push(`${page}:${entry.id} does not declare slash`);
        }
    }
    assert.deepStrictEqual(offenders, [], `\n      ${offenders.join('\n      ')}`);
});

check('no destructive action is exposed to the slash path', () => {
    // The standing rule from the design: reaching a destructive action always costs a deliberate
    // navigation to its page. `slash` is stored per entry rather than derived from `kind` precisely
    // so this assertion has something real to compare — deriving it would make this vacuous.
    const offenders = [];
    for (const page of registryPages) {
        for (const entry of registry.listActions(page)) {
            if (entry.kind === 'confirm' && entry.slash) offenders.push(`${page}:${entry.id} is a confirm action but slash-exposed`);
        }
    }
    assert.deepStrictEqual(offenders, [], `\n      ${offenders.join('\n      ')}`);
});

check('slash actions per page fit one autocomplete response', () => {
    // Discord returns at most 25 autocomplete choices. No page is near this today; the check exists
    // so a page that grows past it fails here rather than silently truncating in the client. Same
    // defensive posture as commands/admin.js's SELECT_OPTION_CAP.
    const offenders = registryPages
        .map(p => [p, registry.listSlashActions(p).length])
        .filter(([, n]) => n > 25)
        .map(([p, n]) => `${p} exposes ${n} slash actions (max 25)`);
    assert.deepStrictEqual(offenders, [], `\n      ${offenders.join('\n      ')}`);
});

check('every purge action has a label for its scope', () => {
    // confirmPurge() reads PURGE_LABELS[page][scope] at CLICK time — a missing entry is a crash in
    // production, not a render failure, so nothing else would catch it.
    const SCOPE = { purge: 'all', purgeall: 'all', purgenew: 'new', purgereturning: 'returning' };
    const offenders = [];
    for (const page of registryPages) {
        for (const entry of registry.listActions(page)) {
            if (!(entry.id in SCOPE)) continue;
            const label = manageCommand.PURGE_LABELS[page]?.[SCOPE[entry.id]];
            if (!label) offenders.push(`${page}:${entry.id} -> PURGE_LABELS.${page}.${SCOPE[entry.id]} is missing`);
        }
    }
    assert.deepStrictEqual(offenders, [], `\n      ${offenders.join('\n      ')}`);
});

check('loadout mode is derived correctly, and only for loadout pages', () => {
    assert.strictEqual(registry.loadoutModeFor('loadouts_mp'), 'MP');
    assert.strictEqual(registry.loadoutModeFor('loadouts_dmz'), 'DMZ');
    assert.strictEqual(registry.loadoutModeFor('draws'), null);
});

check('MP and DMZ loadout pages offer the identical action set', () => {
    const ids = p => registry.listActions(p).map(a => a.id).sort();
    assert.deepStrictEqual(ids('loadouts_mp'), ids('loadouts_dmz'));
});

const total = registryPages.reduce((n, p) => n + registry.listActions(p).length, 0);
console.log(failures === 0
    ? `\nAll registry checks passed (${registryPages.length} pages, ${total} actions).`
    : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
