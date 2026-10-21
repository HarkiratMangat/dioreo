// scripts/colorPanelBudget.test.js Regression test for the View Colors panel's COMPONENT BUDGET and the placements that spend it. Added 2026-08-12 22:18 EDT, when Download Avatar/Banner moved inside the container. Run: `node scripts/colorPanelBudget.test.js` (also via `npm test`).
//
// ⚠️ WHY THIS EXISTS. Components V2 allows 40 components per message, COUNTED RECURSIVELY — containers, sections, text, buttons and thumbnails all count, nested however deep. Exceeding it is a hard `COMPONENT_MAX_TOTAL_COMPONENTS_EXCEEDED` send failure, and this repo has already taken that as a real production crash once (see `.claude/rules/rendering-and-ui.md`; `draws.js` and `calendar.js` chunk their output specifically to stay under it).
//
// ⚠️ THE FAILURE MODE IS A SLOW LEAK, WHICH IS WHY PROSE DOES NOT HOLD IT. Nothing about adding one more button or one more swatch row announces that it was the one that crossed the line, and the panel looks perfect at 39. Moving the download buttons from the bottom action row INTO the container turned one text component into a section + text + button, which is why the number is now worth asserting rather than remembering.
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
// The same recursive count Discord applies: every component object, plus anything nested in `components`, `accessory` or `items`. A count that walked only `components` would miss exactly the thumbnails and button accessories this panel is full of.
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
    // A page at 39 passes the two cases above and crashes on the next swatch, button or divider anyone adds. Asserting slack is what makes this a budget rather than a tripwire.
    const { components } = await render('avatar', { avatar: palette, avatarFullUrl: CDN });
    const n = countComponents(components);
    assert.ok(LIMIT - n >= 4, `only ${LIMIT - n} components of headroom left (${n}/${LIMIT})`);
});

// --- The placements themselves. Each was a deliberate decision and each is invisible from the outside.
t('each page\'s image link sits beside the copy hint at the top, with the divider under it (2026-10-21 17:27 EDT)', async () => {
    // Harkirat, 2026-10-21 17:23 EDT: "remove the avatar/color button from the outside footer. instead add a button in the top section saying \"avatar\""; option A and the divider move at 17:27. This reverses the 2026-08-12 revert that had kept the links in the bottom row. A Section carries ONE accessory, so the button rides on the copy-hint line, never on the avatar heading.
    const { components } = await render('avatar', { avatar: palette, avatarFullUrl: CDN });
    const [container, actionRow] = components;
    const hintIdx = container.components.findIndex(c => c.type === 9 && /HEX/.test(JSON.stringify(c.components)));
    assert.ok(hintIdx >= 0, 'the copy hint is not a Section');
    assert.deepStrictEqual(container.components[hintIdx].accessory, { type: 2, style: 5, label: 'Avatar', url: CDN });
    assert.ok(container.components[hintIdx + 1].type === 14 && container.components[hintIdx + 1].divider, 'the divider is not right under the hint');
    assert.ok(!actionRow.components.some(b => b.style === 5), 'an image link is still in the bottom row');
});

t('the heading keeps its thumbnail — the download button never displaces it', async () => {
    // The thumbnail is the subject of the page. Trading it for the button would be the other way of satisfying the one-accessory rule, and it is the wrong one.
    const { components } = await render('avatar', { avatar: palette, avatarFullUrl: CDN });
    const heading = components[0].components.find(c => c.type === 9 && c.accessory?.type === 11);
    assert.ok(heading, 'the avatar heading lost its thumbnail accessory');
});

t('each page links its own image, and the Name page none', async () => {
    const link = async (source, extra) => (await render(source, extra)).components[0].components.find(c => c.type === 9 && c.accessory?.type === 2)?.accessory;
    assert.strictEqual((await link('banner', { banner: palette, bannerUrl: CDN, bannerFullUrl: CDN + '?size=4096' })).url, CDN + '?size=4096');
    const np = await link('nameplate', { nameplate: palette.slice(0, 4), nameplateUrl: 'https://cdn.discordapp.com/assets/collectibles/x/static.png' });
    assert.deepStrictEqual([np.label, np.url], ['Nameplate', 'https://cdn.discordapp.com/assets/collectibles/x/asset.webm'], 'the nameplate links its original animated file');
    const deco = await link('decoration', { decoration: palette.slice(0, 4), decorationUrl: 'https://cdn.discordapp.com/avatar-decoration-presets/a.png' });
    assert.strictEqual(deco.url, 'https://cdn.discordapp.com/avatar-decoration-presets/a.png?passthrough=true');
    assert.strictEqual(await link('name', { displayNameColors: ['112233', '445566'] }), undefined, 'the Name page has a link');
});

t('the open page is green and disabled', async () => {
    // Was red (style 4) until 2026-10-19 12:11 EDT (Harkirat: "set the main /color command's active selection to green-disabled").
    const { components } = await render('avatar', { avatar: palette, avatarFullUrl: CDN, banner: palette, bannerUrl: CDN });
    const pageRow = components[0].components.filter(c => c.type === 1).pop();
    const open = pageRow.components.find(b => b.label === 'Avatar');
    assert.ok(open.style === 3 && open.disabled, JSON.stringify(open));
});

t('read-only (the View Colors right-click): its own ids, no Refresh, switch or hint block, an accent, the extra hint, lacking pages absent, under budget', async () => {
    const { components } = await buildColorPalettePanel({
        source: 'avatar', subpage: 1,
        data: { avatar: palette, avatarFullUrl: CDN, hasServerProfile: true, inGuild: true },
        targetUserId: '1', avatarThumbnailUrl: CDN, variant: 'global',
        readOnly: true, makePageId: k => `vc_page|1|${k}|g|0`, makeSubpageId: (k, n) => `vc_page|1|${k}|g|${n}`,
        accentColor: 0x123456, extraHint: '-# **No custom banner detected.**'
    });
    const flat = JSON.stringify(components);
    assert.ok(!/colors_/.test(flat), 'a /colors id leaked into the read-only panel');
    assert.ok(!/Refresh Colors|different part of your profile/.test(flat), 'the hint block or Refresh is back');
    assert.strictEqual(components[0].accent_color, 0x123456);
    assert.ok(/No custom banner detected/.test(flat));
    assert.ok(!/"label":"Banner"/.test(flat.replace(/"style":5[^}]*/g, '')), 'a page the person lacks has a button');
    assert.ok(/vc_page\|1\|avatar\|g\|0/.test(flat), 'the pager does not use the right-click ids');
    assert.strictEqual(components[1], undefined, 'nothing under it: the image link moved into the panel');
    assert.ok(countComponents(components) <= LIMIT);
});

t('no panel ever carries two identical custom_ids, on any page or sub-page, in either mode', async () => {
    // A duplicate makes Discord refuse the whole message (2026-10-19 12:20 EDT: the read-only open-page button and the pager's page-1 arrow were the same id). Walked across both modes and both sub-pages.
    const viewColors = require('../commands/viewColors');
    const ids = viewColors.pageId('1', 'g');
    for (const readOnly of [false, true]) for (const subpage of [0, 1]) {
        const { components } = await buildColorPalettePanel({
            source: 'avatar', subpage,
            data: { avatar: palette, avatarFullUrl: CDN, banner: palette, bannerUrl: CDN, bannerFullUrl: CDN, hasServerProfile: true, inGuild: true },
            targetUserId: '1', avatarThumbnailUrl: CDN, variant: 'global',
            ...(readOnly ? { readOnly, makePageId: k => ids(k, 'p'), makeSubpageId: (k, n) => ids(k, n) } : {})
        });
        const all = JSON.stringify(components).match(/"custom_id":"[^"]+"/g) || [];
        assert.strictEqual(new Set(all).size, all.length, `duplicate custom_id (readOnly=${readOnly}, subpage=${subpage}): ${all.join(' ')}`);
    }
});

t('Refresh is the row\'s only PRIMARY, and both interactive buttons carry icons', async () => {
    // The view switch is lateral navigation and stays grey on purpose (Harkirat was 50/50 on it, 2026-08-12 22:11 EDT); two blurple buttons would leave neither reading as the main thing. The download button is a style-5 Link, which Discord renders grey and which carries no emoji.
    const { components } = await render('avatar', { avatar: palette, avatarFullUrl: CDN });
    const buttons = components[1].components;
    assert.strictEqual(buttons.filter(b => b.style === 1).length, 1, 'the row no longer has exactly one primary action');
    // Refresh Colors leads the row again since the image links moved into the panel (2026-10-21 17:23 EDT).
    assert.strictEqual(buttons[0].label, 'Refresh Colors', 'the row no longer starts with Refresh Colors');
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
