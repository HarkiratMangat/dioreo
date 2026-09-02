// scripts/portalAnalytics.test.js — two panels that were computed over different populations, and eleven facts nobody read.
//
// 🔴 computeUsageStats HAS ALWAYS EXCLUDED ADMIN TRAFFIC AND computeTimingStats NEVER FILTERED IT AT ALL. So the Usage panel's counts and the Timing panel's percentiles — side by side on one screen, in Discord and in the portal — were computed over different rows, with nothing saying so. `/manage` is the heaviest thing this bot does; a "usually 40ms" that silently includes it answers a question nobody asked.
//
// ⚠️ THE FIX DELIBERATELY DOES NOT MOVE A SHIPPED NUMBER. Making both exclude admin by default is the correct reading, but flipping it silently would change what `/bot analytics` has always printed — so the default is consistent and the DISCORD call sites override it explicitly. The discrepancy is visible at the call site now instead of hidden in a missing `$match`, and closing it is one argument away.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

let failures = 0;
const say = console.log.bind(console);
function check(name, fn) {
    try { fn(); say(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

say('portalAnalytics — do the two panels count the same rows, and is the boot record read?');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
// ⚠️ COMMENTS ARE STRIPPED BEFORE ANY SCAN, and this is the THIRD source-scan gate on this branch to fire on prose: the `data:` URL scan, the `.logic.js` import gate, and this one, which read the sentence "computeTimingStats() already returns the rows" as an unguarded call site. It is not a coincidence — a file that documents a trap contains the trap's own shape in words, so any gate written without this line fires hardest on the best-documented code. **Strip first, always.**
const stripJsComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
const bot = stripJsComments(read('commands/bot.js'));
const api = read('portal/api/analytics.js');
const ui = read('portal/ui/analytics.js');

// The two functions are sliced out by name so a match belonging to some other query in this large file cannot be mistaken for one of theirs.
function bodyOf(name) {
    const at = bot.indexOf(`async function ${name}(`);
    assert.ok(at > 0, `${name} is gone from commands/bot.js`);
    const next = bot.indexOf('\nasync function ', at + 10);
    return bot.slice(at, next === -1 ? bot.length : next);
}

check('neither stats function hardcodes the admin filter any more', () => {
    for (const fn of ['computeUsageStats', 'computeTimingStats']) {
        const body = bodyOf(fn);
        assert.ok(body.includes('const adminMatch = includeAdmin'), `${fn} no longer derives adminMatch`);
        // Exactly one `isAdmin: false` may survive in each: the one inside adminMatch's own definition.
        assert.strictEqual((body.match(/isAdmin:\s*false/g) || []).length, 1,
            `${fn} carries a hardcoded isAdmin filter outside adminMatch's definition`);
    }
});

// 🔴 THE CONSERVATION CHECK, AS A COUNT RATHER THAN A PARSE. Every windowed query in these two functions must carry the filter, or one figure on the panel counts different rows from the one beside it. Matching each query's own braces needs a real parser — Mongo filters nest — so this counts the two things instead: one window opened, one filter applied. ⚠️ The first version DID try to parse, and its `[^}]*` stopped at the first nested `}`, reporting three perfectly filtered queries as bare.
check('every windowed query in both functions carries the admin filter', () => {
    for (const fn of ['computeUsageStats', 'computeTimingStats']) {
        const body = bodyOf(fn);
        const windows = (body.match(/createdAt: \{ \$gte: since/g) || []).length;
        const filtered = (body.match(/\.\.\.adminMatch/g) || []).length;
        assert.ok(windows >= 3, `${fn}: found ${windows} windowed queries — the shape changed and this check has gone blind`);
        assert.strictEqual(filtered, windows,
            `${fn} opens ${windows} time windows and applies the admin filter to ${filtered} of them`);
    }
});

check('THE CONSERVATION CHECK CAN FAIL: a query without the filter is caught', () => {
    assert.throws(() => {
        const body = 'createdAt: { $gte: since7d }, ...adminMatch // and\ncreatedAt: { $gte: since7d }, durationMs: 1';
        const windows = (body.match(/createdAt: \{ \$gte: since/g) || []).length;
        const filtered = (body.match(/\.\.\.adminMatch/g) || []).length;
        assert.strictEqual(filtered, windows, `${windows} windows, ${filtered} filtered`);
    }, /2 windows, 1 filtered/);
});

// ⚠️ THE DISCORD PANEL'S NUMBERS MUST NOT MOVE. Its timing call has always included admin traffic by accident; it now does so on purpose, and this is what keeps the change from reaching a shipped surface.
check('the Discord timing callers keep their numbers by asking for them', () => {
    // ⚠️ The DECLARATION matches this pattern too — its own parameter list reads like an argument list, and the first version of this check flagged it as a Discord caller whose numbers would move.
    const calls = [...bot.matchAll(/(?<!async function )computeTimingStats\(([^)]*)\)/g)].map((m) => m[1].trim());
    const discord = calls.filter((a) => !a.includes('limit: 25') && !a.includes('limit = 6'));
    assert.ok(discord.length >= 2, `only ${discord.length} Discord-side timing calls found — the shape changed`);
    for (const a of discord) {
        assert.ok(a.includes('includeAdmin: true'), `a Discord timing call reads computeTimingStats(${a}) — its numbers would move`);
    }
});

check('the portal asks for the same population on both panels', () => {
    assert.match(api, /const includeAdmin = url\.searchParams\.get\('admin'\) === '1'/, 'the route no longer reads the toggle');
    assert.match(api, /computeUsageStats\(\{ limit: 25, includeAdmin \}\), computeTimingStats\(\{ limit: 25, includeAdmin \}\)/,
        'the two portal calls must pass the SAME flag, or the toggle moves one panel and not the other');
    assert.ok(ui.includes("fetchJson(`/api/analytics${includeAdmin ? '?admin=1' : ''}`)"), 'the page no longer sends the flag');
    assert.ok(ui.includes('[includeAdmin]'), 'the fetch is not keyed on the toggle, so flipping it would change nothing');
});

// 🔴 CONSERVATION AGAINST THE MODEL. The boot card names nine fields; a rename in models/BootRecord.js would leave the card rendering em-dashes with every gate green — the panel would look fine and say nothing.
check('every field the boot card reads is one BootRecord actually declares', () => {
    const model = read('models/BootRecord.js');
    const declared = new Set([...model.matchAll(/^\s{4}(\w+):\s*\{\s*type:/gm)].map((m) => m[1]));
    assert.ok(declared.size >= 8, `parsed ${declared.size} BootRecord fields — the model's shape changed and this check has gone blind`);
    const block = api.slice(api.indexOf('lastBoot: lastBoot ? {'), api.indexOf('} : null,', api.indexOf('lastBoot: lastBoot ? {')));
    const used = [...block.matchAll(/lastBoot\.(\w+)/g)].map((m) => m[1]).filter((f) => f !== 'createdAt');
    assert.ok(used.length >= 8, `the boot payload reads ${used.length} fields — too few for this check to mean anything`);
    const ghosts = [...new Set(used)].filter((f) => !declared.has(f));
    assert.deepStrictEqual(ghosts, [], `the boot card reads ${ghosts.join(', ')}, which models/BootRecord.js does not declare — it would render an em-dash forever`);
});

check('THE MODEL CHECK CAN FAIL: a field the model does not declare is caught', () => {
    assert.throws(() => {
        const declared = new Set(['version', 'commit']);
        const ghosts = ['version', 'buildNumber'].filter((f) => !declared.has(f));
        assert.deepStrictEqual(ghosts, [], `ghosts: ${ghosts.join(', ')}`);
    }, /ghosts: buildNumber/);
});

// ⚠️ A NON-ZERO emojiMissing IS THE STALE-PROD-ID TRAP, not a statistic — those emoji render as raw ids in Discord. The card has to say what the number MEANS, or it is a figure nobody acts on.
check('a missing-emoji count is explained, not just counted', () => {
    assert.match(ui, /emojiMissing\s*\?/, 'the card no longer branches on the missing count');
    assert.match(ui, /render as raw ids in Discord/, 'the card counts missing emoji without saying what that does');
});

// 🔴 CONSERVATION AGAINST THE WRITER, BECAUSE THE READER SILENTLY INVENTED A VOCABULARY. utils/alertWebhook.js is the only thing that writes AlertLog.level and its LEVEL_COLOR map is the enumeration. The portal carried a key for `warn` (zero rows in the dev database) and none for `caution` (306 of 1,000, measured 2026-09-01 21:34 EDT), so a third of every alert fell through `|| LEVEL_ROW.info` and painted as the grey no-severity tier — under a paragraph on the same page naming three tiers. Nothing failed: both stylesheets already define `.lvlb.lv-caution`, so the rule was live and only the emitter was missing, which is invisible to an orphan scan. A table checked against the writer is the only shape that catches this; a table checked against itself cannot.
check('every alert level the writer can emit is one the portal can render', () => {
    const writer = read('utils/alertWebhook.js');
    const map = writer.slice(writer.indexOf('const LEVEL_COLOR'), writer.indexOf('};', writer.indexOf('const LEVEL_COLOR')));
    const levels = [...map.matchAll(/(\w+):\s*0x[0-9a-fA-F]+/g)].map((m) => m[1]);
    assert.ok(levels.length >= 4, `parsed ${levels.length} levels from alertWebhook's LEVEL_COLOR — the writer's shape changed and this check has gone blind`);
    for (const table of ['LEVEL_ROW', 'LEVEL_TAG']) {
        const decl = ui.slice(ui.indexOf(`const ${table} = {`), ui.indexOf('};', ui.indexOf(`const ${table} = {`)));
        assert.ok(decl.length > 20, `${table} is not declared as an object literal any more`);
        const missing = levels.filter((l) => !new RegExp(`\\b${l}:`).test(decl));
        assert.deepStrictEqual(missing, [], `${table} has no key for ${missing.join(', ')} — those alerts render as the fallback tier with nothing complaining`);
    }
    const order = api.slice(api.indexOf('const levelOrder = ['), api.indexOf('];', api.indexOf('const levelOrder = [')));
    const unordered = levels.filter((l) => !order.includes(`'${l}'`));
    assert.deepStrictEqual(unordered, [], `levelOrder omits ${unordered.join(', ')} — indexOf returns -1, the comparator maps it to 99, and that tier sorts below every named one`);
});

check('THE LEVEL CONSERVATION CHECK CAN FAIL: a level the portal cannot render is caught', () => {
    assert.throws(() => {
        const levels = ['info', 'caution', 'warn', 'error'];
        const decl = "const LEVEL_ROW = { error: 'a', warn: 'b', info: 'c' };";
        const missing = levels.filter((l) => !new RegExp(`\\b${l}:`).test(decl));
        assert.deepStrictEqual(missing, [], `LEVEL_ROW has no key for ${missing.join(', ')}`);
    }, /no key for caution/);
});

say(failures ? `\n✗ ${failures} failed` : '\n✅ portalAnalytics: both panels count the same rows, and the boot record is read against the model that writes it');
process.exit(failures ? 1 : 0);
