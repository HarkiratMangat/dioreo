// scripts/loadoutBulkFormat.test.js
// Covers the three loadout changes shipped 2026-08-22: the labelled-block bulk format (replacing the seven-segment positional pipe line), the image-key-or-URL intake, and the cross-cutting failed-submission retry.
//
// ⚠️ EVERY ASSERTION HERE IS ABLE TO FAIL. The old format's own test would have been vacuous -- it asserted a parse succeeded, which the redesign also does. The discriminating checks are: the OLD format must now be REJECTED (not merely re-parsed differently), a typo'd key must ERROR rather than become an attachment, and a formatter->parser round trip must reproduce the FIELD VALUES, not just a non-empty result.
const assert = require('assert');
const { parseBulkLoadoutList, formatLoadoutsAsBulkText } = require('../utils/adminParser');
const { deriveImageKey, isHttpImageSource } = require('../utils/loadoutImageCache');
const retry = require('../handlers/manage/retry');

let passed = 0;
function check(name, fn) { fn(); passed++; console.log(`  ✓ ${name}`); }

// ────────────────────────────────────────────────────────── the labelled-block format
const BLOCK = [
    'BAL-27 | AR',
    'Build: Aggressive Flex',
    'Image: BAL-27-1',
    'Code: 1I2C6B8A9D',
    'Badges: meta, best',
    '- Gauge-9 Mono',
    '- Crown-H3 Barrel',
].join('\n');

check('a full labelled block parses every field', () => {
    const { parsed, errors } = parseBulkLoadoutList(BLOCK);
    assert.deepStrictEqual(errors, []);
    assert.strictEqual(parsed.length, 1);
    const p = parsed[0];
    assert.strictEqual(p.weaponName, 'BAL-27');
    assert.strictEqual(p.category, 'AR');
    assert.strictEqual(p.buildName, 'Aggressive Flex');
    assert.strictEqual(p.imageKey, 'BAL-27-1');
    assert.strictEqual(p.shareCode, '1I2C6B8A9D');
    assert.strictEqual(p.isMeta, true);
    assert.strictEqual(p.categoryRank, 'best');
    assert.deepStrictEqual(p.attachments, ['Gauge-9 Mono', 'Crown-H3 Barrel']);
});

check('every labelled line is optional, and order does not matter', () => {
    const { parsed, errors } = parseBulkLoadoutList('KILO-141 | AR\nBadges: toxic\nBuild: Stealth\n- OWC Skeleton Stock');
    assert.deepStrictEqual(errors, []);
    assert.strictEqual(parsed[0].buildName, 'Stealth');
    assert.strictEqual(parsed[0].isToxic, true);
    assert.strictEqual(parsed[0].shareCode, '');
});

check('a bare header + bare attachment lines is the minimum, and buildName defaults', () => {
    const { parsed, errors } = parseBulkLoadoutList('FENNEC | SMG\nZed Foregrip');
    assert.deepStrictEqual(errors, []);
    assert.strictEqual(parsed[0].buildName, 'Standard Build');
    assert.deepStrictEqual(parsed[0].attachments, ['Zed Foregrip']);
});

// The whole point of "no back-compat": an old file must FAIL, not half-import. Under the old positional reading this exact line was valid, so this assertion genuinely discriminates between the two parsers.
check('the OLD seven-segment pipe format is REJECTED with an error naming the new shape', () => {
    const old = 'BAL-27 | AR | MP | Build 1 | BAL-27-1 | 1I2C6B8A9D | meta,best\nGauge-9 Mono';
    const { parsed, errors } = parseBulkLoadoutList(old);
    assert.strictEqual(parsed.length, 0, 'an old-format block must not import at all');
    assert.strictEqual(errors.length, 1);
    assert.ok(/OLD pipe format/.test(errors[0]), errors[0]);
    assert.ok(/Weapon \| Category/.test(errors[0]), 'the error must name the format that replaced it');
});

check('a header missing either half is rejected', () => {
    assert.ok(/first line/.test(parseBulkLoadoutList('BAL-27\n- Gauge-9 Mono').errors[0]));
    assert.ok(/first line/.test(parseBulkLoadoutList('BAL-27 |\n- Gauge-9 Mono').errors[0]));
});

// A typo'd key silently becoming an attachment is the exact silent-wrong-result the redesign exists to remove.
// Audit finding: a stray trailing pipe used to be diagnosed as "the OLD pipe format", which is a wrong diagnosis of a right rejection -- and the old format's own optional trailing segments make this the most likely typo of all.
check('a stray trailing pipe is a typo, not the old format', () => {
    const { parsed, errors } = parseBulkLoadoutList('BAL-27 | AR |\n- Gauge-9 Mono');
    assert.deepStrictEqual(errors, [], 'a trailing empty segment should just be ignored');
    assert.strictEqual(parsed[0].category, 'AR');
    // ...but a REAL third segment is still the old format and must still be caught.
    assert.ok(/OLD pipe format/.test(parseBulkLoadoutList('BAL-27 | AR | MP\n- Gauge-9 Mono').errors[0]));
});

check('a typo\'d field key ERRORS rather than becoming an attachment', () => {
    const { parsed, errors } = parseBulkLoadoutList('BAL-27 | AR\nBuld: Aggressive Flex\n- Gauge-9 Mono');
    assert.strictEqual(parsed.length, 0);
    assert.ok(/unrecognized field "Buld:"/.test(errors[0]), errors[0]);
});

check('a leading bullet forces a colon-bearing line to be read as an attachment', () => {
    const { parsed, errors } = parseBulkLoadoutList('BAL-27 | AR\n- Ammo: 40 Round Mag');
    assert.deepStrictEqual(errors, []);
    assert.deepStrictEqual(parsed[0].attachments, ['Ammo: 40 Round Mag']);
});

check('a block with no attachment lines is rejected', () => {
    assert.ok(/no attachment lines/.test(parseBulkLoadoutList('BAL-27 | AR\nBuild: Flex').errors[0]));
});

check('an unrecognized badge token is advisory -- the build still parses', () => {
    const { parsed, errors } = parseBulkLoadoutList('BAL-27 | AR\nBadges: meta, sparkly\n- Gauge-9 Mono');
    assert.strictEqual(parsed.length, 1);
    assert.strictEqual(parsed[0].isMeta, true);
    assert.ok(/unrecognized badge token/.test(errors[0]));
});

check('blocks are separated by a blank line and parse independently', () => {
    const { parsed, errors } = parseBulkLoadoutList(`${BLOCK}\n\nFENNEC | SMG\n- Zed Foregrip`);
    assert.deepStrictEqual(errors, []);
    assert.strictEqual(parsed.length, 2);
});

// ────────────────────────────────────────────────────────── Mode is gone, both ways
check('MODE is neither required nor accepted -- the page supplies it', () => {
    // Not required: the minimum block above already proves that. Not accepted: a third pipe segment is now the old-format error, so there is no way to smuggle a mode in.
    const { parsed } = parseBulkLoadoutList(BLOCK);
    assert.ok(!('mode' in parsed[0]), 'a parsed entry must carry no mode at all -- core/ops/loadouts.js sets it from the page');
});

check('the exporter emits NO Mode, so a DMZ export cannot reassign itself on paste', () => {
    const text = formatLoadoutsAsBulkText([{ weaponName: 'AK117', category: 'AR', mode: 'DMZ', buildName: 'Ranged', imageKey: 'DMZ-AK117-1', attachments: ['Optic'] }]);
    assert.ok(!/DMZ\b(?!-AK117)/.test(text.split('\n')[0]), 'the header line must not carry a mode');
    assert.ok(!/^Mode:/m.test(text), 'there is no Mode: field');
});

// ────────────────────────────────────────────────────────── round trip
check('formatLoadoutsAsBulkText round-trips back through the parser with identical values', () => {
    const doc = {
        weaponName: 'BAL-27', category: 'AR', buildName: 'Aggressive Flex', imageKey: 'BAL-27-1',
        shareCode: '1I2C6B8A9D', attachments: ['Gauge-9 Mono', 'Crown-H3 Barrel'],
        isMeta: true, categoryRank: 'best', dmzRangeRank: null, isToxic: false,
    };
    const { parsed, errors } = parseBulkLoadoutList(formatLoadoutsAsBulkText([doc]));
    assert.deepStrictEqual(errors, []);
    for (const k of ['weaponName', 'category', 'buildName', 'imageKey', 'shareCode', 'isMeta', 'categoryRank', 'isToxic']) {
        assert.deepStrictEqual(parsed[0][k], doc[k], `field "${k}" did not survive the round trip`);
    }
    assert.deepStrictEqual(parsed[0].attachments, doc.attachments);
});

check('an empty optional field is OMITTED from the export, not emitted blank', () => {
    const text = formatLoadoutsAsBulkText([{ weaponName: 'FENNEC', category: 'SMG', buildName: 'CQB', imageKey: '', shareCode: '', attachments: ['Zed Foregrip'] }]);
    assert.ok(!/Code:/.test(text) && !/Image:/.test(text) && !/Badges:/.test(text), text);
});

check('a raw-URL imageKey is not round-tripped as an Image: line', () => {
    const text = formatLoadoutsAsBulkText([{ weaponName: 'LOCUS', category: 'SNIPER', buildName: 'Quickscope', imageKey: 'https://i.imgur.com/x.png', attachments: ['Optic'] }]);
    assert.ok(!/Image:/.test(text), text);
});

// ────────────────────────────────────────────────────────── image key derivation
check('isHttpImageSource tells a pasted URL from a bare Public ID', () => {
    assert.strictEqual(isHttpImageSource('https://cdn.discordapp.com/a/b.png'), true);
    assert.strictEqual(isHttpImageSource('http://example.com/x.jpg'), true);
    assert.strictEqual(isHttpImageSource('BAL-27-1'), false);
    assert.strictEqual(isHttpImageSource(''), false);
    assert.strictEqual(isHttpImageSource(undefined), false);
});

check('deriveImageKey skips keys already taken instead of overwriting them', () => {
    assert.strictEqual(deriveImageKey('BAL-27', 'MP', []), 'BAL-27-1');
    assert.strictEqual(deriveImageKey('BAL-27', 'MP', ['BAL-27-1']), 'BAL-27-2');
    assert.strictEqual(deriveImageKey('BAL-27', 'MP', ['BAL-27-1', 'BAL-27-2']), 'BAL-27-3');
    // Case-insensitive, because a hand-named legacy asset may differ in case from what we mint.
    assert.strictEqual(deriveImageKey('BAL-27', 'MP', ['bal-27-1']), 'BAL-27-2');
});

check('a multi-word weapon name hyphenates, and DMZ keys are prefixed so they cannot collide with MP', () => {
    assert.strictEqual(deriveImageKey('FSS Hurricane', 'MP', []), 'FSS-HURRICANE-1');
    assert.strictEqual(deriveImageKey('AK117', 'DMZ', []), 'DMZ-AK117-1');
    // The MP key being taken must NOT push the DMZ key along -- they are different namespaces.
    assert.strictEqual(deriveImageKey('AK117', 'DMZ', ['AK117-1']), 'DMZ-AK117-1');
});

// ────────────────────────────────────────────────────────── failed-submission retry
check('every /manage add/edit/bulk modal the retry table claims is actually resolvable', () => {
    for (const id of ['add_draw_new', 'add_draw_returning', 'edit_draw_abc123_new', 'modal_draws_bulk_add_both', 'modal_draws_bulk_replace_both',
                      'modal_calendar_add', 'edit_calendar_abc123', 'modal_calendar_bulk_add', 'modal_calendar_bulk_replace',
                      'add_loadout_MP', 'add_loadout_DMZ', 'edit_loadout_abc123', 'modal_loadouts_bulk_add_MP', 'modal_loadouts_bulk_add_DMZ']) {
        assert.ok(retry.specFor(id), `no retry spec matched "${id}"`);
    }
});

// Patch notes has no free-form paste path, so it is deliberately absent -- and failWithRetry must degrade to a plain error there rather than throwing inside an error handler.
check('a modal with no retry spec resolves to null rather than throwing', () => {
    assert.strictEqual(retry.specFor('modal_patch_dateinfo'), null);
    assert.strictEqual(retry.specFor('modal_calendar_banners'), null);
});

check('every retry spec can actually rebuild its modal', () => {
    for (const id of ['add_draw_new', 'edit_draw_abc123_returning', 'modal_draws_bulk_replace_both', 'modal_calendar_add',
                      'edit_calendar_abc123', 'modal_calendar_bulk_add', 'add_loadout_DMZ', 'edit_loadout_abc123', 'modal_loadouts_bulk_add_MP']) {
        const json = retry.specFor(id).rebuild(id).toJSON();
        assert.ok(json.components.length > 0, `rebuilding "${id}" produced no fields`);
    }
});

check('buildRetryModal refills the failed values, and an expired token returns null', () => {
    assert.strictEqual(retry.buildRetryModal('nosuchtoken'), null);
    retry.pendingModalRetries.set('tok', {
        modalCustomId: 'add_loadout_MP',
        values: { weapon: 'BAL-27', build: 'Aggressive Flex | 1I2C6B8A9D', attachments: 'Gauge-9 Mono', image: 'BAL-27-1', meta: 'AR | meta' },
    });
    const json = retry.buildRetryModal('tok');
    const byId = Object.fromEntries(json.components.flatMap(r => r.components).map(c => [c.custom_id, c.value]));
    assert.strictEqual(byId.weapon, 'BAL-27');
    assert.strictEqual(byId.build, 'Aggressive Flex | 1I2C6B8A9D');
    assert.strictEqual(byId.image, 'BAL-27-1');
    retry.pendingModalRetries.delete('tok');
});

// The snippet is only useful if it survives a paste back into the real bulk parser -- asserting its SHAPE would pass against a format the parser rejects.
check('the loadout retry snippet re-imports cleanly through the real bulk parser', () => {
    const snippet = retry.loadoutSnippet({
        weapon: 'BAL-27', build: 'Aggressive Flex | 1I2C6B8A9D', meta: 'AR | meta, best',
        image: 'BAL-27-1', attachments: 'Gauge-9 Mono\nCrown-H3 Barrel',
    });
    const { parsed, errors } = parseBulkLoadoutList(snippet);
    assert.deepStrictEqual(errors, []);
    assert.strictEqual(parsed[0].buildName, 'Aggressive Flex');
    assert.strictEqual(parsed[0].shareCode, '1I2C6B8A9D');
    assert.strictEqual(parsed[0].isMeta, true);
});

check('the draw retry snippet re-imports cleanly through the real draw parser', () => {
    const { parseBulkDrawList } = require('../utils/adminParser');
    const snippet = retry.drawSnippet({ title: 'Mythic Drop', items: 'm Hero\nl Gun', date: 'July 15', url: 'https://x.jpg' });
    const [parsed] = parseBulkDrawList(snippet);
    assert.ok(parsed, `"${snippet}" did not re-parse`);
    assert.strictEqual(parsed.title, 'Mythic Drop');
    assert.strictEqual(parsed.items.length, 2);
});

check('the combined "paste as one line" field wins over the separate draw fields', () => {
    assert.strictEqual(retry.drawSnippet({ combined: 'A, m B, July 1', title: 'ignored' }), 'A, m B, July 1');
});

check('a blank calendar End Date reconstructs as "All Season", which its own parser understands', () => {
    assert.strictEqual(retry.calendarSnippet({ start_date: '7/2', end_date: '', title: 'Nuketown' }), '7/2 - All Season | Nuketown');
});

check('codeBlock uses inline code for one line and a fence for many, and cannot break out of its own fence', () => {
    assert.strictEqual(retry.codeBlock('one line'), '`one line`');
    assert.ok(retry.codeBlock('a\nb').startsWith('```\n'));
    const hostile = retry.codeBlock('a\n```\nnot markdown');
    assert.ok(!/\n```\n(?!$)/.test(hostile.slice(4)), 'a pasted fence must not terminate the wrapper early');
});

console.log(`  ✓ ${passed} loadout bulk-format / image-intake / retry checks passed`);
