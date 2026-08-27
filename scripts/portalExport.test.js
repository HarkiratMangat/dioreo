// scripts/portalExport.test.js — the export strip, and the class of button that runs and does nothing.
//
// 🔴 TWO REALMS SHIPPED A DEAD EXPORT BUTTON. Season's and Armory's "Export selection" both called `window.open('data:text/plain;…')`, and browsers block that as a top-level navigation: measured in this app, the call returns `null`, throws nothing, and the page does not change. So the button ran, said nothing and produced no file — the worst possible shape for an export, because export is what the one-way confirmations name as the way back. The check below is a source scan rather than a behaviour test, because the defect is a *mechanism* and the mechanism is visible in the source: nothing in `portal/ui` may open a `data:` URL.
//
// ⚠️ AND SEASON'S EXPORT WAS A CAPTION. It emitted `title — window`, which nothing reads back — so even if the navigation had worked, what came out was not a backup. The scopes are the bot's own formatters now, and the client/server conservation check below asserts that every scope the UI offers names a route the server actually registers.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

let failures = 0;
const say = console.log.bind(console);
function check(name, fn) {
    try { fn(); say(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

say('portalExport — does the export produce a file, in a format something reads back?');

const ROOT = path.join(__dirname, '..');
const UI = path.join(ROOT, 'portal', 'ui');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const uiFiles = fs.readdirSync(UI).filter((f) => f.endsWith('.js'));

const { recordExport, exportRecords, exportRecord, clearExports, exportSummary } = require('../portal/ui/exportPanel.logic');

// ── THE MECHANISM ───────────────────────────────────────────────────────────────────────────── ⚠️ COMMENTS ARE STRIPPED FIRST, AND THE FIRST VERSION OF THIS DID NOT — so it flagged three files whose only offence was DESCRIBING the defect in the comment that records it. A source-scan gate that cannot tell code from prose fires hardest on the files that document the bug best, which trains the next person to delete the comment rather than keep the rule.
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

check('nothing in portal/ui opens a data: URL — that navigation is blocked and fails silently', () => {
    const offenders = uiFiles.filter((f) => /\bopen\(\s*[`'"]data:/.test(stripComments(fs.readFileSync(path.join(UI, f), 'utf8'))));
    assert.deepStrictEqual(offenders, [], `${offenders.join(', ')} still hands a data: URL to open(), which browsers block — the button will run and produce nothing`);
    // The rule is only worth having if the scan can still SEE code, so prove the stripper did not blank the files.
    const code = uiFiles.map((f) => stripComments(fs.readFileSync(path.join(UI, f), 'utf8'))).join('');
    assert.ok(code.includes('fetchJson('), 'stripComments removed the code as well as the comments — this check is now vacuous');
});

check('THE MECHANISM CHECK CAN FAIL: a data: URL open is caught', () => {
    assert.throws(() => {
        const src = "globalThis.open(`data:text/plain;charset=utf-8,${x}`, '_blank');";
        assert.ok(!/\bopen\(\s*[`'"]data:/.test(src), 'a data: URL open slipped through');
    }, /slipped through/);
});

// ⚠️ ONE MECHANISM, NOT A WORKING ONE AND A BROKEN ONE. The Blob-and-anchor path was already proven by the changeset export; extracting it means a new export cannot reach for the other kind by accident.
check('every download goes through download.js, including the changeset export', () => {
    const dl = read('portal/ui/download.js');
    assert.match(dl, /a\.download = filename/, 'download.js no longer sets the download attribute, so the anchor navigates instead of saving');
    assert.match(dl, /requestAnimationFrame\(\(\) => URL\.revokeObjectURL/, 'the next-frame revoke is gone — revoking in the same tick has been observed to cancel the download');
    const compose = read('portal/ui/composeClient.js');
    assert.ok(compose.includes("import { downloadText } from './download.js'"), 'composeClient no longer uses the shared mechanism');
    assert.ok(!/createObjectURL/.test(compose), 'composeClient built its own Blob again — there must be one mechanism, not two');
});

// ── CLIENT/SERVER CONSERVATION ────────────────────────────────────────────────────────────────
//
// 🔴 A SCOPE NAMING A ROUTE NOBODY REGISTERS IS A BUTTON THAT 404s. The strip is data-driven, so the URLs live in the realm files as strings and nothing else connects them to the server — which is exactly the seam a conservation check exists for.
check('every export scope the UI offers names a route the server registers', () => {
    const urls = new Set();
    for (const f of uiFiles) {
        const src = fs.readFileSync(path.join(UI, f), 'utf8');
        for (const m of src.matchAll(/url:\s*[`'"]([^`'"]*\/api\/[^`'"?]+)/g)) urls.add(m[1]);
    }
    assert.ok(urls.size >= 2, `found ${urls.size} export scope urls — too few for this check to mean anything`);
    const api = fs.readdirSync(path.join(ROOT, 'portal', 'api'))
        .filter((f) => f.endsWith('.js'))
        .map((f) => fs.readFileSync(path.join(ROOT, 'portal', 'api', f), 'utf8')).join('\n');
    // A route is registered as an escaped regex literal: /api/season/export appears as \/api\/season\/export.
    const missing = [...urls].filter((u) => !api.includes(u.replace(/\//g, '\\/')));
    assert.deepStrictEqual(missing, [], `${missing.join(', ')} is offered by an export scope and registered by no route`);
});

check('THE ROUTE CONSERVATION CHECK CAN FAIL: a scope pointing nowhere is caught', () => {
    assert.throws(() => {
        const api = String.raw`/^\/api\/season\/export$/`;
        const missing = ['/api/season/export', '/api/moon/export'].filter((u) => !api.includes(u.replace(/\//g, '\\/')));
        assert.deepStrictEqual(missing, [], `missing: ${missing.join(', ')}`);
    }, /missing: \/api\/moon\/export/);
});

// ⚠️ EVERY SCOPE STATES ITS OWN SHAPE, because one line claiming "the format the paste box accepts" is false for three of Season's four — the calendar is prefixed bullets and patch notes re-import through nothing at all. A note is not decoration here; it is the difference between holding a backup and believing you do.
check('every export scope carries its own note, count, unit and filename', () => {
    // ⚠️ SPLIT ON THE SCOPE BOUNDARY, NEVER ON A BRACE. The first version matched up to the first `}`, which lands inside `${todayIso()}` in the filename template — so every scope appeared to end three keys early and the check reported a missing note that was right there.
    const REQUIRED = ['id:', 'label:', 'unit:', 'count:', 'url:', 'filename:', 'note:'];
    let scopesSeen = 0;
    for (const f of uiFiles) {
        const src = fs.readFileSync(path.join(UI, f), 'utf8');
        const chunks = src.split(/\{\s*id:\s*[`'"][a-z]+\.[^`'"]+[`'"]/).slice(1);
        for (const chunk of chunks) {
            const body = chunk.slice(0, 700);
            if (!body.includes('url:')) continue;
            scopesSeen++;
            for (const key of REQUIRED.filter((k) => k !== 'id:')) {
                assert.ok(body.includes(key), `an export scope in ${f} is missing ${key}`);
            }
        }
    }
    assert.ok(scopesSeen >= 4, `only ${scopesSeen} export scopes parsed — the shape changed and this check has gone blind`);
});

// ── RETENTION ─────────────────────────────────────────────────────────────────────────────────
check('the summary counts SCOPES taken, not downloads', () => {
    clearExports();
    const scopes = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    assert.strictEqual(exportSummary(scopes), '3 formats');
    recordExport('a', { label: 'A', rows: 2, bytes: 10, body: 'xx' });
    assert.strictEqual(exportSummary(scopes), '1 of 3 exported this session');
    recordExport('a', { label: 'A', rows: 2, bytes: 10, body: 'xx' });
    assert.strictEqual(exportSummary(scopes), '1 of 3 exported this session', 'taking the same scope twice is one thing exported');
    assert.strictEqual(exportSummary([]), '', 'a realm with no scopes says nothing rather than "0 formats"');
});

// 🔴 "4 FORMATS" SAYS HOW MANY BUTTONS THERE ARE AND NOTHING ABOUT WHAT YOU WOULD GET, which is the one thing worth knowing before taking a backup. The counts were already on every scope and unused.
check('the summary leads with how much DATA is behind the export, when the scopes know', () => {
    clearExports();
    const counted = [{ id: 'a', count: 14 }, { id: 'b', count: 23 }, { id: 'c', count: 2 }];
    assert.strictEqual(exportSummary(counted), '39 items · 3 formats');
    assert.strictEqual(exportSummary([{ id: 'a', count: 1 }]), '1 item · 1 format', 'both nouns singularise');
    // ⚠️ NOT VACUOUS: a scope set with no counts must still produce the OLD line rather than "0 items".
    assert.strictEqual(exportSummary([{ id: 'a' }, { id: 'b' }]), '2 formats', 'no count anywhere falls back rather than inventing a zero');
    assert.strictEqual(exportSummary([{ id: 'a', count: 0 }]), '1 format', 'a real zero is not worth stating either');
    // Progress replaces inventory once anything has been taken -- the more useful fact at that moment.
    recordExport('a', { label: 'A', rows: 2, bytes: 10, body: 'xx' });
    assert.strictEqual(exportSummary(counted), '1 of 3 exported this session');
});

// 🔴 THE KEPT COPY IS THE BYTES THAT WERE HANDED OVER. A retained export that re-derives itself on "take it again" is a different document wearing the same name, which defeats the only thing retention is for.
check('a kept copy holds the exact body, and "take it again" has something to give back', () => {
    clearExports();
    recordExport('season.calendar', { label: 'Calendar', rows: 23, bytes: 917, body: 'e• 8/1 - 8/9 | Clan Wars' });
    const rec = exportRecord('season.calendar');
    assert.strictEqual(rec.body, 'e• 8/1 - 8/9 | Clan Wars');
    assert.strictEqual(rec.rows, 23);
    assert.ok(rec.at > 0, 'a record with no time cannot be listed in order');
    assert.strictEqual(exportRecord('nothing.here'), null);
});

check('records list newest first', () => {
    clearExports();
    recordExport('old', { label: 'Old', body: 'x' });
    const rec = exportRecord('old');
    rec.at -= 60000;
    recordExport('new', { label: 'New', body: 'y' });
    assert.deepStrictEqual(exportRecords().map((r) => r.id), ['new', 'old']);
});

// ⚠️ THE MOCKUP'S EMPTY STATE IS FALSE HERE and carrying it across would have promised a safeguard this build does not have: it reads "One-way operations stay locked until there is one", but the one-way strip deliberately does not gate on a session export — the interlock is the changeset export at Review.
check('the empty state does not claim a lock this portal does not have', () => {
    const src = read('portal/ui/exportPanel.js');
    assert.ok(!/stay locked until/.test(src), 'the strip claims one-way operations are locked until an export exists, which is not true here');
    assert.match(src, /live until you\s+reload/, 'the empty state must say the kept copies are page-lived, or it implies a durability it does not have');
    assert.match(src, /changeset export on Review/, 'and it must name where the real safeguard is');
});

say(failures ? `\n✗ ${failures} failed` : '\n✅ portalExport: one download mechanism, every scope routed, and retention that says what it actually keeps');
process.exit(failures ? 1 : 0);
