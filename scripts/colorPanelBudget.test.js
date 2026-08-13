// scripts/colorPanelBudget.test.js
// Regression test for the View Colors panel's COMPONENT BUDGET and the placements that spend it.
// Added 2026-08-12 22:18 EDT, when Download Avatar/Banner moved inside the container.
// Run: `node scripts/colorPanelBudget.test.js` (also via `npm test`).
//
// ⚠️ WHY THIS EXISTS. Components V2 allows 40 components per message, COUNTED RECURSIVELY — containers,
// sections, text, buttons and thumbnails all count, nested however deep. Exceeding it is a hard
// `COMPONENT_MAX_TOTAL_COMPONENTS_EXCEEDED` send failure, and this repo has already taken that as a real
// production crash once (see `.claude/rules/rendering-and-ui.md`; `draws.js` and `calendar.js` chunk
// their output specifically to stay under it).
//
// ⚠️ THE FAILURE MODE IS A SLOW LEAK, WHICH IS WHY PROSE DOES NOT HOLD IT. Nothing about adding one
// more button or one more swatch row announces that it was the one that crossed the line, and the panel
// looks perfect at 39. Moving the download buttons from the bottom action row INTO the container turned
// one text component into a section + text + button, which is why the number is now worth asserting
// rather than remembering.
const assert = require('assert');
const { buildColorPalettePanel } = require('../utils/colorPaletteView');

let failed = 0;
let passed = 0;
const pending = [];
// Counted, never hardcoded -- a literal total in the summary rots the moment a case is added.
function t(name, fn) {
    pending.push(async () => {
        try {
            await fn();
            passed++;
            console.log(`  PASS  ${name}`);
        } catch (err) {
            failed++;
            console.log(`  FAIL  ${name}\n        ${err.message}`);
        }
    });
}

const LIMIT = 40;
// The same recursive count Discord applies: every component object, plus anything nested in
// `components`, `accessory` or `items`. A count that walked only `components` would miss exactly the
// thumbnails and button accessories this panel is full of.
const countComponents = node => Array.isArray(node)
    ? node.reduce((n, x) => n + countComponents(x), 0)
    : (node && typeof node === 'object')
        ? 1 + countComponents(node.components || []) + (node.accessory ? countComponents(node.accessory) : 0) + countComponents(node.items || [])
        : 0;

// A full 8-swatch palette is the worst case the ladder can produce for avatar/banner.
const palette = Array.from({ length: 8 }, (_, i) => ({ hex: 0x112233 + i * 0x101010, percent: 12, origin: 'structure' }));
const CDN = 'https://cdn.discordapp.com/a.png';
const render = (source, extra = {}) => buildColorPalettePanel({
    source,
    subpage: 0,
    data: { hasServerProfile: true, inGuild: true, ...extra },
    targetUserId: '1',
    avatarThumbnailUrl: CDN,
    variant: 'global'
});

console.log('\nthe View Colors panel — component budget and the placements that spend it\n');

t('a full avatar page stays under the 40-component ceiling', async () => {
    const { components } = await render('avatar', { avatar: palette, avatarFullUrl: CDN });
    const n = countComponents(components);
    assert.ok(n <= LIMIT, `avatar page renders ${n} components, over the ${LIMIT} ceiling`);
});

t('a full banner page stays under the 40-component ceiling', async () => {
    const { components } = await render('banner', { banner: palette, bannerUrl: CDN, bannerFullUrl: CDN });
    const n = countComponents(components);
    assert.ok(n <= LIMIT, `banner page renders ${n} components, over the ${LIMIT} ceiling`);
});

t('there is real headroom left, not a page sitting on the line', async () => {
    // A page at 39 passes the two cases above and crashes on the next swatch, button or divider anyone
    // adds. Asserting slack is what makes this a budget rather than a tripwire.
    const { components } = await render('avatar', { avatar: palette, avatarFullUrl: CDN });
    const n = countComponents(components);
    assert.ok(LIMIT - n >= 4, `only ${LIMIT - n} components of headroom left (${n}/${LIMIT})`);
});

// --- The placements themselves. Each was a deliberate decision and each is invisible from the outside.
t('Download Avatar sits in the bottom action row, not inside the container', async () => {
    // ⚠️ IT WAS MOVED INSIDE FOR ONE EVENING (2026-08-12 22:15 EDT) AND REVERTED AT 23:41 on
    // Harkirat's call after seeing it rendered. Asserted in this direction so the move cannot creep
    // back in unnoticed -- and the finding that came out of it still stands: a Section carries exactly
    // ONE accessory, thumbnail OR button, so it could never have joined the avatar heading anyway.
    const { components } = await render('avatar', { avatar: palette, avatarFullUrl: CDN });
    const [container, actionRow] = components;
    assert.ok(actionRow.components.some(b => b.label === 'Download Avatar'), 'Download Avatar is missing from the bottom row');
    assert.ok(!JSON.stringify(container).includes('Download'), 'a download button is back inside the container');
    const hint = container.components.find(c => c.type === 10 && /HEX/.test(c.content || ''));
    assert.ok(hint, 'the copy hint is no longer a plain text component');
});

t('the heading keeps its thumbnail — the download button never displaces it', async () => {
    // The thumbnail is the subject of the page. Trading it for the button would be the other way of
    // satisfying the one-accessory rule, and it is the wrong one.
    const { components } = await render('avatar', { avatar: palette, avatarFullUrl: CDN });
    const heading = components[0].components.find(c => c.type === 9 && c.accessory?.type === 11);
    assert.ok(heading, 'the avatar heading lost its thumbnail accessory');
});

t('a page with no full-res original shows no download button at all', async () => {
    // Name/Nameplate/Deco have nothing worth downloading -- the button is per-source, not per-panel.
    const { components } = await render('nameplate', { nameplate: palette.slice(0, 4), nameplateUrl: CDN });
    assert.ok(!JSON.stringify(components).includes('Download'), 'a download button rendered on a page with no full-res original');
    assert.ok(JSON.stringify(components[0]).includes('HEX'), 'the copy hint vanished');
});

t('Refresh is the row\'s only PRIMARY, and both interactive buttons carry icons', async () => {
    // The view switch is lateral navigation and stays grey on purpose (Harkirat was 50/50 on it,
    // 2026-08-12 22:11 EDT); two blurple buttons would leave neither reading as the main thing. The
    // download button is a style-5 Link, which Discord renders grey and which carries no emoji.
    const { components } = await render('avatar', { avatar: palette, avatarFullUrl: CDN });
    const buttons = components[1].components;
    assert.strictEqual(buttons.filter(b => b.style === 1).length, 1, 'the row no longer has exactly one primary action');
    assert.strictEqual(buttons[0].label, 'Refresh Colors', 'Refresh Colors is no longer the leading button');
    const swtch = buttons.find(b => String(b.custom_id || '').startsWith('colors_variant_'));
    assert.strictEqual(swtch?.style, 2, 'the global/server switch is no longer secondary/grey');
    for (const b of buttons.filter(b => b.custom_id)) assert.ok(b.emoji?.id, `"${b.label}" lost its emoji`);
});

t('the view switch is absent entirely without a server profile', async () => {
    // With no override both views resolve to identical images, so the button would visibly do nothing.
    const { components } = await buildColorPalettePanel({
        source: 'avatar', subpage: 0,
        data: { avatar: palette, avatarFullUrl: CDN, hasServerProfile: false, inGuild: true },
        targetUserId: '1', avatarThumbnailUrl: CDN, variant: 'global'
    });
    assert.ok(!JSON.stringify(components[1]).includes('colors_variant_'), 'the view switch rendered with no server profile to switch to');
});

(async () => {
    for (const run of pending) await run();
    console.log(`\n  ${passed} passed, ${failed} failed\n`);
    process.exit(failed ? 1 : 0);
})();
