// Conservation tests for the /manage action registry (utils/manageActions.js, 2026-08-14). Design: docs/superpowers/specs/2026-08-14-manage-slash-decomposition-design.md.
//
// WHAT THIS IS FOR. The registry exists because the action list used to live in two places that nothing compared: the button rows in commands/manage.js's buildPagesTable(), and a 220-line if/else in handlers/manage.js. The failure that produced was silent in both directions — a button with no handler renders as a button that simply does nothing when clicked, and a handler with no button is dead code nobody notices. Consolidating them only helps if something CHECKS they stayed consolidated, so these tests assert conservation both ways.
//
// Runs with no network and no DB: buildManagePage() is pure given a page key, and resolveAction() is never called here (it would need adminAccess's Mongo-backed permission lookup).

const assert = require('assert');
const fs = require('fs');
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

// Walks a rendered page's components and collects every `mng_act_<page>_<id>` it actually emits. Deliberately reads the RENDERED OUTPUT rather than the page table, so it also covers the two group styles ('inline' accessories vs. plain button rows) that build their buttons differently.
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
    // A page with no registered action would render with no buttons at all. Only pages whose whole surface is dynamic could legitimately do that, and none currently are.
    const bare = Object.keys(PAGES).filter(p => !registry.listActions(p).length);
    assert.deepStrictEqual(bare, [], `page(s) with no registered actions: ${bare.join(', ')}`);
});

check('every page scope is a real permission scope', () => {
    const { MANAGE_PAGE_SCOPES } = require('../utils/adminAccess');
    // 'manageadmins' retired 2026-08-16 -- moved to /bot access, which is owner-only by its own isOwner() check and is no longer a /manage page or a registry entry at all.
    const valid = new Set(MANAGE_PAGE_SCOPES);
    const offenders = [];
    for (const page of registryPages) {
        for (const entry of registry.listActions(page)) {
            if (!valid.has(entry.page)) offenders.push(`${entry.page}:${entry.id} -> unknown scope "${entry.page}"`);
        }
    }
    assert.deepStrictEqual(offenders, [], `\n      ${offenders.join('\n      ')}`);
});

check('every action is filed under the page it claims', () => {
    // Not redundant with the scope check above, which only asks whether `entry.page` is a REAL scope. This asks whether it is the RIGHT one. The two loadout pages are built by a factory precisely so they get separate objects — if that ever became a shared const, the `entry.page = page` loop in the registry would tag MP's entries as DMZ, permissions would resolve against the wrong page, and every other check here would still pass.
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
    // The standing rule from the design: reaching a destructive action always costs a deliberate navigation to its page. `slash` is stored per entry rather than derived from `kind` precisely so this assertion has something real to compare — deriving it would make this vacuous.
    const offenders = [];
    for (const page of registryPages) {
        for (const entry of registry.listActions(page)) {
            if (entry.kind === 'confirm' && entry.slash) offenders.push(`${page}:${entry.id} is a confirm action but slash-exposed`);
        }
    }
    assert.deepStrictEqual(offenders, [], `\n      ${offenders.join('\n      ')}`);
});

check('slash actions per page fit one autocomplete response', () => {
    // Discord returns at most 25 autocomplete choices. No page is near this today; the check exists so a page that grows past it fails here rather than silently truncating in the client. Same defensive posture as commands/admin.js's SELECT_OPTION_CAP.
    const offenders = registryPages
        .map(p => [p, registry.listSlashActions(p).length])
        .filter(([, n]) => n > 25)
        .map(([p, n]) => `${p} exposes ${n} slash actions (max 25)`);
    assert.deepStrictEqual(offenders, [], `\n      ${offenders.join('\n      ')}`);
});

check('every purge action has a label for its scope', () => {
    // confirmPurge() reads PURGE_LABELS[page][scope] at CLICK time — a missing entry is a crash in production, not a render failure, so nothing else would catch it.
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

// Stage 3 (2026-08-14 18:05 EDT) -- the action: slash option + its scoped autocomplete route.

check("/manage's action option is registered with autocomplete on", () => {
    const actionOption = manageCommand.data.options.find(o => o.name === 'action');
    assert.ok(actionOption, '/manage has no "action" option');
    assert.strictEqual(actionOption.autocomplete, true, '"action" option does not have autocomplete enabled');
});

check('listSlashActions returns only slash:true entries for the requested page', () => {
    for (const page of registryPages) {
        const slashIds = new Set(registry.listSlashActions(page).map(a => a.id));
        for (const entry of registry.listActions(page)) {
            assert.strictEqual(slashIds.has(entry.id), entry.slash,
                `${page}:${entry.id} -- listSlashActions() disagrees with its own slash:${entry.slash} flag`);
        }
    }
});

check('listSlashActions returns nothing for an unknown page', () => {
    assert.deepStrictEqual(registry.listSlashActions('not_a_real_page'), []);
});

check("resolveAction() alone does NOT block a slash:false entry -- the SLASH CALLER must", () => {
    // Real bug, found by a completeness sweep 2026-08-14 18:38 EDT: resolveAction() only checks ownership/page-scope, never `slash`. commands/manage.js's action-dispatch branch is the one caller that must enforce it -- Discord's autocomplete not SUGGESTING a confirm-kind id is not the same as REJECTING one a user types directly (autocomplete choices aren't server-enforced). This pins the fact that stays true (resolveAction alone is insufficient) and the source-scan below pins that manage.js actually compensates for it.
    const confirmEntry = registryPages
        .flatMap(p => registry.listActions(p))
        .find(a => a.kind === 'confirm');
    assert.ok(confirmEntry, 'no confirm-kind entry exists to test against');
    assert.strictEqual(confirmEntry.slash, false, 'test fixture assumption: confirm entries are slash:false');
});

check('commands/manage.js\'s action dispatch checks entry.slash before running', () => {
    const src = fs.readFileSync(require.resolve('../commands/manage.js'), 'utf8');
    // Anchors on the exact guard clause immediately before the run() call -- a plain substring search for 'resolved.entry.slash' anywhere nearby is NOT enough: this file also sets resolved.reason = 'unknown' on the non-slash branch, which contains that same substring and would keep a weaker check green even with the run()-guarding condition removed. Verified by deliberately reverting the guard and confirming this exact check fails (2026-08-14 18:40 EDT).
    const runCallIdx = src.indexOf('return await resolved.entry.run(');
    assert.ok(runCallIdx > -1, 'could not find the action dispatch\'s run() call at all');
    const precedingIf = src.lastIndexOf('if (', runCallIdx);
    const guardClause = src.slice(precedingIf, src.indexOf(')', precedingIf) + 1);
    assert.strictEqual(guardClause, 'if (resolved.ok && resolved.entry.slash)',
        `the if-condition guarding resolved.entry.run() is "${guardClause}", missing the slash check -- ` +
        'without it, a slash:false destructive action (purge/wipe/promote/discard) is reachable by ' +
        'typing its id directly, since autocomplete suggestions are not server-enforced');
});

const total = registryPages.reduce((n, p) => n + registry.listActions(p).length, 0);
console.log(failures === 0
    ? `\nAll registry checks passed (${registryPages.length} pages, ${total} actions).`
    : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
