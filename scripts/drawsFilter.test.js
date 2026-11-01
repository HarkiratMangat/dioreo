// scripts/drawsFilter.test.js -- /draws' date lines and its filtered list (2026-11-01 13:16 EDT, Harkirat's six tweaks): each date says what it is with the state's dot, a status filter shows one list under /today's headings, an empty picked section is a line at the top instead of a page, and a filtered view carries Reset filter beside Calculate. Also proves every filter, section and page stays under Discord's 40 components and 4,000 characters, which is where FILTERED_CHUNK comes from.
const assert = require('assert');
const draws = require('../commands/draws');
const emojis = require('../utils/emojiMap');

const now = Date.now(), D = 86400000;
const mk = (i, startOff, sec, items = 4) => ({ _id: `${sec}${i}`, title: `${sec} Draw ${i}`, date: new Date(now + startOff * D), thumbnailUrl: 'https://x/y.png', priceType: 'mythicWeapon',
    items: Array.from({ length: items }, (_, j) => ({ tier: j ? 'legendary' : 'mythic', name: `Gun${j} - Skin ${i}` })) });
// [start, end] in days from now; null = no /calendar end date.
const PLAN = [[-10, 20], [-10, 1], [3, 10], [-20, -2], [-5, null], [-12, 2], [5, null], [-30, -10]];
function season({ items = 4, noNew = false } = {}) {
    const newDraws = [], returningDraws = [], calendar = [];
    PLAN.forEach(([s, e], i) => ['New', 'Ret'].forEach(sec => {
        const d = mk(i, s, sec, items);
        (sec === 'New' ? newDraws : returningDraws).push(d);
        if (e !== null) calendar.push({ title: d.title, date: d.date, endDate: new Date(now + e * D), category: 'draw', drawType: sec === 'New' ? 'new' : 'returning' });
    }));
    return { currentSeasonTitle: 'Season 9 — Test', newDraws: noNew ? [] : newDraws, returningDraws, calendar };
}
const count = c => Array.isArray(c) ? c.reduce((n, x) => n + count(x), 0) : 1 + (c.components ? count(c.components) : 0) + (c.accessory ? 1 : 0);
const texts = c => Array.isArray(c) ? c.flatMap(texts) : [...(c.type === 10 ? [c.content] : []), ...(c.components ? texts(c.components) : [])];
const ids = c => JSON.stringify(c).match(/"custom_id":"[^"]+"/g) || [];
const mask = (...v) => v.reduce((m, x) => m | draws.filterMask(x), 0);

let failed = 0;
function t(name, fn) { try { fn(); console.log(`  ✓ ${name}`); } catch (err) { failed++; console.log(`  ✗ ${name}\n    ${err.message}`); } }

t('each date line says what it is, with the state\'s dot first', () => {
    const doc = season();
    const line = d => draws.drawDateLines(d, { seasonalDoc: doc, nowMs: now });
    const by = title => doc.newDraws.find(d => d.title === title);
    assert.match(line(by('New Draw 0')), new RegExp(`^> ${emojis.greenDotGlow} \\*\\*Started\\*\\* <t:\\d+:f> \\(<t:\\d+:R>\\)\\n> ${emojis.blank}\\u2002Ends <t:`));
    assert.match(line(by('New Draw 1')), new RegExp(`^> ${emojis.yellowDotGlow} \\*\\*Ends\\*\\* .*\\n> ${emojis.blank}\\u2002Started`), 'leaving soon leads with its end');
    assert.match(line(by('New Draw 2')), new RegExp(`^> ${emojis.lightBlueDotGlow} \\*\\*Starts\\*\\*`));
    assert.match(line(by('New Draw 3')), new RegExp(`^> ${emojis.redDotGlow} \\*\\*Ended\\*\\* .*\\n> .*Started`));
    assert.ok(!line(by('New Draw 4')).includes('Ends'), 'no /calendar end date, no end line');
    assert.strictEqual(draws.drawDateLines({ title: 'X', date: null }, { seasonalDoc: doc }), '> *Date TBA*');
    // /bot analytics renders a draw with no season: a labelled line all the same.
    assert.match(draws.buildDrawSections([{ title: 'X', date: new Date(now - D), items: [] }])[0].content, /\*\*Started\*\*/);
});

t('a status filter shows one list under /today\'s headings, each draw once', () => {
    const doc = season();
    const pages = [];
    for (let p = 0; p < 6; p++) pages.push(texts(draws.buildContainer(doc, 'new', p, 1, true, mask('live', 'leaving', 'upcoming', 'ended'))).join('\n'));
    const all = [...new Set(pages)].join('\n');
    for (const g of draws.STATUS_GROUPS) assert.ok(all.includes(`## ${emojis[g.emojiKey]} ${g.label}`), g.label);
    const titles = all.match(/### (New|Ret) Draw \d+/g);
    assert.strictEqual(new Set(titles).size, 16, 'all 16 draws');
    assert.strictEqual(titles.length, 16, 'none twice');
    assert.ok(all.indexOf('Live') < all.indexOf('Leaving soon') && all.indexOf('Leaving soon') < all.indexOf('## ' + emojis.lightBlueDotGlow), 'Live, Leaving soon, Upcoming, Ended');
    assert.ok(all.includes(`-# ${emojis.newDraws} New draw`), 'both sections: New draws are marked');
    // Live alone keeps its Leaving soon draws, under their own heading.
    const live = [0, 1, 2].map(p => texts(draws.buildContainer(doc, 'new', p, 1, true, mask('live'))).join('\n')).join('\n');
    assert.ok(live.includes('Leaving soon') && !live.includes('Upcoming') && !live.includes(`${emojis.redDotGlow} Ended`));
    // One section picked: its own title, no New marker.
    const ret = texts(draws.buildContainer(doc, 'new', 0, 1, true, mask('returning', 'ended'))).join('\n');
    assert.ok(ret.includes('Returning Draws') && !ret.includes('New draw') && !ret.includes('New Draw'));
});

t('an empty picked section is a line at the top, and the other section shows', () => {
    const out = texts(draws.buildContainer(season({ noNew: true }), 'new', 0, 1, true, mask('new', 'returning', 'ended'))).join('\n');
    assert.ok(out.includes(`-# ${emojis.warn} No New Draws match this filter.`));
    assert.ok(/### Ret Draw \d/.test(out), 'the returning draws are shown, not an empty page');
    const sectionOnly = texts(draws.buildContainer(season({ noNew: true }), 'new', 0, 1, true, mask('new', 'returning'))).join('\n');
    assert.ok(sectionOnly.includes('No New Draws match this filter.') && sectionOnly.includes('Returning Draws'));
    // Not picked by name: no line.
    assert.ok(!texts(draws.buildContainer(season({ noNew: true }), 'new', 0, 1, true, mask('ended'))).join('\n').includes('match this filter'));
});

t('Reset filter sits left of Calculate on any filtered view, and only there', () => {
    const row = out => out[0].components.filter(c => c.type === 1).pop().components;
    const filtered = row(draws.buildContainer(season(), 'new', 0, 1, true, mask('live')));
    assert.deepStrictEqual(filtered.map(b => b.label), ['Reset filter', 'Calculate']);
    assert.strictEqual(filtered[0].custom_id, 'subpage_reset');
    assert.strictEqual(filtered[0].emoji.name, emojis.parseEmoji(emojis.returnArrow).name);
    assert.deepStrictEqual(row(draws.buildContainer(season(), 'new', 0, 1, true, 0)).map(b => b.label), ['Calculate']);
});

t('every filter, section and page fits Discord: 40 components, 4,000 characters, unique ids', () => {
    let worstN = 0, worstText = 0;
    for (const doc of [season(), season({ items: 9 }), season({ noNew: true })]) {
        for (let m = 0; m < 64; m++) for (const page of ['new', 'returning']) for (let sub = 0; sub < 10; sub++) {
            const out = draws.buildContainer(doc, page, sub, 1, true, m);
            worstN = Math.max(worstN, count(out));
            worstText = Math.max(worstText, texts(out).join('').length);
            const list = ids(out);
            assert.strictEqual(new Set(list).size, list.length, `duplicate id at mask ${m} ${page} ${sub}`);
        }
    }
    assert.ok(worstN <= 40, `${worstN} components`);
    assert.ok(worstText <= 4000, `${worstText} characters`);
    console.log(`    worst: ${worstN} of 40 components, ${worstText} of 4,000 characters`);
});

console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exit(failed ? 1 : 0);
