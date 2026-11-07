// scripts/drawsFilter.test.js -- /draws' date lines and its filtered list (2026-11-01 13:16 EDT, Harkirat's six tweaks): each date says what it is with the state's dot, a status filter shows one list under /today's headings, an empty picked section is a line at the top instead of a page, and a filtered view carries Reset Filter beside Calculate. Also proves every filter, section and page stays under Discord's 40 components and 4,000 characters, which is where FILTERED_CHUNK comes from.
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
    // bpStart 8 days ago: every draw that started before it carries the From Season tag, so the budget case below counts those lines too.
    return { currentSeasonTitle: 'Season 9 — Test', bpStart: new Date(now - 8 * D), newDraws: noNew ? [] : newDraws, returningDraws, calendar };
}
const count = c => Array.isArray(c) ? c.reduce((n, x) => n + count(x), 0) : 1 + (c.components ? count(c.components) : 0) + (c.accessory ? 1 : 0);
const texts = c => Array.isArray(c) ? c.flatMap(texts) : [...(c.type === 10 ? [c.content] : []), ...(c.components ? texts(c.components) : [])];
const ids = c => JSON.stringify(c).match(/"custom_id":"[^"]+"/g) || [];
const mask = (...v) => v.reduce((m, x) => m | draws.filterMask(x), 0);

let failed = 0;
function t(name, fn) { try { fn(); console.log(`  ✓ ${name}`); } catch (err) { failed++; console.log(`  ✗ ${name}\n    ${err.message}`); } }

t('each date line is his template: small text, the dot and what happened, then the date that matters', () => {
    const doc = { ...season(), bpStart: undefined };   // no season start: nothing reads as carried over
    const line = d => draws.drawDateLines(d, { seasonalDoc: doc, nowMs: now });
    const by = title => doc.newDraws.find(d => d.title === title);
    const R = '<t:\\d+:R>', F = '<t:\\d+:f>';
    const date = `\\n> -# ${emojis.blank} ${F}$`;
    assert.match(line(by('New Draw 0')), new RegExp(`^> -# ${emojis.greenDotGlow} \\*\\*Live\\*\\* · \\*\\*Ends\\*\\* ${R}${date}`));
    assert.match(line(by('New Draw 1')), new RegExp(`^> -# ${emojis.yellowDotGlow} \\*\\*Ending\\*\\* ${R}${date}`), 'leaving soon');
    assert.match(line(by('New Draw 2')), new RegExp(`^> -# ${emojis.lightBlueDotGlow} \\*\\*Releasing\\*\\* ${R}${date}`));
    assert.match(line(by('New Draw 3')), new RegExp(`^> -# ${emojis.redDotGlow} \\*\\*Ended\\*\\* ${R}$`), 'ended: no date line');
    assert.match(line(by('New Draw 4')), new RegExp(`^> -# ${emojis.greenDotGlow} \\*\\*Live\\*\\* · since ${R}${date}`), 'no /calendar end date: live, over its start date');
    // The end line shows the END date for a live draw with one.
    const end = Math.floor(new Date(doc.calendar.find(c => c.title === 'New Draw 0').endDate).getTime() / 1000);
    assert.ok(line(by('New Draw 0')).endsWith(`<t:${end}:f>`));
    assert.strictEqual(draws.drawDateLines({ title: 'X', date: null }, { seasonalDoc: doc }), '> -# *Date TBA*');
    // /bot analytics renders a draw with no season: a labelled line all the same.
    assert.match(draws.buildDrawSections([{ title: 'X', date: new Date(now - D), items: [] }])[0].content, /\*\*Live\*\* · since <t:/);
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
    assert.ok(all.includes(`## ${emojis.greenDotGlow} Active now`) && !all.includes(`## ${emojis.greenDotGlow} Live`), "/calendar's heading, Active now (14:51 EDT)");
    assert.ok(all.indexOf('Active now') < all.indexOf('Leaving soon') && all.indexOf('Leaving soon') < all.indexOf('## ' + emojis.lightBlueDotGlow), 'Active now, Leaving soon, Upcoming, Ended');
    assert.ok(!all.includes('New draw\n'), 'no New draw line under a title (14:46 EDT, his call)');
    assert.ok(all.includes(`## ${emojis.filter} Filtered Draws`), 'both sections: his title');
    // Live alone keeps its Leaving soon draws, under their own heading.
    const live = [0, 1, 2].map(p => texts(draws.buildContainer(doc, 'new', p, 1, true, mask('live'))).join('\n')).join('\n');
    assert.ok(live.includes('Leaving soon') && !live.includes('Upcoming') && !live.includes(`${emojis.redDotGlow} Ended`));
    // One section picked: its own title, no New marker.
    const ret = texts(draws.buildContainer(doc, 'new', 0, 1, true, mask('returning', 'ended'))).join('\n');
    assert.ok(ret.includes('Returning Draws') && !ret.includes('New draw') && !ret.includes('New Draw'));
});

t('an empty picked section is a line at the top, and the other section shows', () => {
    const out = texts(draws.buildContainer(season({ noNew: true }), 'new', 0, 1, true, mask('new', 'returning', 'ended'))).join('\n');
    assert.ok(out.includes(`${emojis.warn} *Zero (0) **New Draws** this season.*`), out.slice(0, 400));
    assert.ok(/### Ret Draw \d/.test(out), 'the returning draws are shown, not an empty page');
    const sectionOnly = texts(draws.buildContainer(season({ noNew: true }), 'new', 0, 1, true, mask('new', 'returning'))).join('\n');
    assert.ok(sectionOnly.includes('**New Draws** this season.') && sectionOnly.includes('Returning Draws'), 'no New draws at all: says so, not "match this filter"');
    // With New draws that just don't match: where they stand right now.
    const standing = texts(draws.buildContainer(season(), 'new', 0, 1, true, mask('new', 'returning', 'leaving'))).join('\n');
    assert.ok(!standing.includes('Zero (0)'), 'New has leaving-soon draws here');
    const doc = season(); doc.newDraws = doc.newDraws.filter(d => !/ [15]$/.test(d.title));
    const now2 = texts(draws.buildContainer(doc, 'new', 0, 1, true, mask('new', 'returning', 'leaving'))).join('\n');
    assert.match(now2, new RegExp(`\\*Zero \\(0\\) \\*\\*New Draws\\*\\* match this filter\\.\\*\\n-# ${emojis.newDraws} \\*\\*New Draws:\\*\\* ${emojis.greenDotGlow} \`2\` live${emojis.blank} ${emojis.lightBlueDotGlow} \`2\` upcoming${emojis.blank} ${emojis.redDotGlow} \`2\` ended`), now2.slice(0, 500));
    // Not picked by name: no line.
    assert.ok(!texts(draws.buildContainer(season({ noNew: true }), 'new', 0, 1, true, mask('ended'))).join('\n').includes('match this filter'));
});

t('the class (14:32 EDT, "Work the class!"): every empty list says it the same way, with no empty page', () => {
    // No filter, no New draws: no New page, a line at the top of Returning's.
    const plain = draws.buildContainer(season({ noNew: true }), 'new', 0, 1, true, 0);
    const text = texts(plain).join('\n');
    assert.ok(text.includes('Returning Draws') && text.includes(`${emojis.warn} *Zero (0) **New Draws** this season.*`), text.slice(0, 400));
    assert.ok(!/currently no|No draws match/.test(text));
    assert.ok(!JSON.stringify(plain).includes('subpage_new_'), 'the pager never walks into an empty New page');
    // A filter that leaves nothing at all: each kept section's line, with where it stands now.
    const doc = season(); doc.calendar = doc.calendar.filter(c => !/ [15]$/.test(c.title));
    const none = texts(draws.buildContainer(doc, 'new', 0, 1, true, mask('leaving'))).join('\n');
    for (const name of ['New Draws', 'Returning Draws']) assert.ok(none.includes(`*Zero (0) **${name}** match this filter.*`), name);
    assert.match(none, /-# <a:ReturningDraws:\d+> \*\*Returning Draws:\*\* /);
    // The helper itself: an empty season has no count line.
    const { emptyNote } = require('../utils/emptyNote');
    assert.strictEqual(emptyNote({ label: 'X', emoji: '', counts: [{ emojiKey: 'greenDotGlow', label: 'live', n: 0 }] }), `${emojis.warn} *Zero (0) **X** this season.*`);
});

t('Reset Filter sits left of Calculate on any filtered view, and only there', () => {
    const row = out => out[0].components.filter(c => c.type === 1).pop().components;
    const filtered = row(draws.buildContainer(season(), 'new', 0, 1, true, mask('live')));
    assert.deepStrictEqual(filtered.map(b => b.label), ['Reset Filter', 'Calculate']);
    assert.strictEqual(filtered[0].custom_id, 'subpage_reset');
    assert.strictEqual(filtered[0].emoji.name, emojis.parseEmoji(emojis.returnArrow).name);
    assert.deepStrictEqual(row(draws.buildContainer(season(), 'new', 0, 1, true, 0)).map(b => b.label), ['Calculate']);
});

t('a draw that started before this season says which season it came from, in either section (2026-11-01 14:36 EDT, his pick)', () => {
    const doc = season();
    const from = title => draws.carriedFromSeason([...doc.newDraws, ...doc.returningDraws].find(d => d.title === title), doc);
    assert.strictEqual(from('New Draw 0'), 'Season 8', 'started 10 days ago, the season began 8 days ago: the one before');
    assert.strictEqual(from('Ret Draw 0'), 'Season 8', 'a Returning draw too');
    assert.strictEqual(from('New Draw 4'), null, 'started this season');
    assert.strictEqual(from('New Draw 2'), null, 'not started yet');
    assert.strictEqual(draws.carriedFromSeason(doc.newDraws[0], { ...doc, bpStart: undefined }), null, 'no season start set: no tag');
    const held = { ...doc, patchNotes: [{ title: 'Season 7: Old', seasonStart: new Date(now - 60 * D), seasonEnd: new Date(now - 25 * D) }] };
    assert.strictEqual(draws.carriedFromSeason(doc.newDraws[7], held), 'Season 7', 'the past season whose dates hold the start');
    // His layout (14:48 EDT): the top line says Ongoing since in place of Live, the end moves to the second line, the date to the third. No italic.
    const R = '<t:\\d+:R>', F = '<t:\\d+:f>';
    const line = d => draws.drawDateLines(d, { seasonalDoc: doc, nowMs: now });
    assert.match(line(doc.newDraws[0]), new RegExp(`^> -# ${emojis.greenDotGlow} \\*\\*Ongoing\\*\\* since Season 8\\n> -# ${emojis.blank} \\*\\*Ends\\*\\* ${R}\\n> -# ${emojis.blank} ${F}$`));
    assert.match(line(doc.returningDraws[1]), new RegExp(`^> -# ${emojis.yellowDotGlow} \\*\\*Ongoing\\*\\* since Season 8\\n> -# ${emojis.blank} \\*\\*Ending\\*\\* ${R}\\n> -# ${emojis.blank} ${F}$`), 'leaving soon: yellow, Ending');
    assert.match(line(doc.newDraws[3]), new RegExp(`^> -# ${emojis.redDotGlow} \\*\\*Ended\\*\\* ${R}$`), 'an ended one is just Ended');
    assert.match(line(doc.newDraws[4]), /\*\*Live\*\* · since/, 'started this season: unchanged');
    const page = texts(draws.buildContainer(doc, 'new', 0)).join('\n');
    assert.ok(!page.includes('_**Ongoing'), 'no separate line any more');
    const grouped = texts(draws.buildContainer(doc, 'new', 0, undefined, false, mask('live'))).join('\n');
    assert.ok(grouped.includes('### New Draw 0\n> -#'), 'nothing between the title and the dates');
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
