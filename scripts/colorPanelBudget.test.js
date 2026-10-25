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
t('/colors: the image link leads the footer, left of Refresh, and the copy hint sits under the divider (2026-10-25 12:25 EDT)', async () => {
    // Harkirat, 2026-10-25 12:25 EDT: "move \"Tap on the #HEX color code to copy it.\" below the divider" and "move the \"avatar\" \"banner\" etc button to the footer, left of the \"refresh colors\" button". Reverses the 2026-10-21 17:23 move to the top, for /colors only.
    const { components } = await render('avatar', { avatar: palette, avatarFullUrl: CDN });
    const [container, footer] = components;
    const hintIdx = container.components.findIndex(c => c.type === 10 && /HEX/.test(c.content));
    assert.ok(hintIdx > 0, 'the copy hint is not a plain text line');
    assert.ok(container.components[hintIdx - 1].type === 14 && container.components[hintIdx - 1].divider, 'the divider is not right above the hint');
    assert.ok(!container.components.some(c => c.type === 9 && c.accessory?.type === 2), 'an image link is still inside the panel');
    assert.deepStrictEqual(footer.components.map(b => b.label), ['Avatar', 'Refresh Colors']);
    assert.deepStrictEqual(footer.components[0], { type: 2, style: 5, label: 'Avatar', url: CDN });
});

t('the right-click keeps its image link beside the copy hint at the top, the divider under it (2026-10-25 12:41 EDT)', async () => {
    // "since we don't do a \"refresh colors\" button for the right click command, leave the \"avatar\" banner\" etc buttons at the top". A Section carries ONE accessory, so the button rides on the copy-hint line, never on the avatar heading.
    const { components } = await buildColorPalettePanel({
        source: 'avatar', subpage: 0, data: { avatar: palette, avatarFullUrl: CDN, inGuild: true },
        targetUserId: '1', avatarThumbnailUrl: CDN, variant: 'global',
        readOnly: true, makePageId: k => `vc_page|1|${k}|g|p`, makeSubpageId: (k, n) => `vc_page|1|${k}|g|${n}`
    });
    const container = components[0];
    const hintIdx = container.components.findIndex(c => c.type === 9 && /HEX/.test(JSON.stringify(c.components)));
    assert.ok(hintIdx >= 0, 'the copy hint is not a Section');
    assert.deepStrictEqual(container.components[hintIdx].accessory, { type: 2, style: 5, label: 'Avatar', url: CDN });
    assert.ok(container.components[hintIdx + 1].type === 14 && container.components[hintIdx + 1].divider, 'the divider is not right under the hint');
    assert.strictEqual(components[1], undefined, 'the right-click grew a footer row');
});

t('the heading keeps its thumbnail — the download button never displaces it', async () => {
    // The thumbnail is the subject of the page. Trading it for the button would be the other way of satisfying the one-accessory rule, and it is the wrong one.
    const { components } = await render('avatar', { avatar: palette, avatarFullUrl: CDN });
    const heading = components[0].components.find(c => c.type === 9 && c.accessory?.type === 11);
    assert.ok(heading, 'the avatar heading lost its thumbnail accessory');
});

t('each page links its own image, and the Name page none', async () => {
    // On /colors the image link is the footer's style-5 button (2026-10-25 12:25 EDT).
    const link = async (source, extra) => (await render(source, extra)).components[1]?.components.find(b => b.style === 5);
    assert.strictEqual((await link('banner', { banner: palette, bannerUrl: CDN, bannerFullUrl: CDN + '?size=4096' })).url, CDN + '?size=4096');
    const np = await link('nameplate', { nameplate: palette.slice(0, 4), nameplateUrl: 'https://cdn.discordapp.com/assets/collectibles/x/static.png' });
    assert.deepStrictEqual([np.label, np.url], ['Nameplate', 'https://cdn.discordapp.com/assets/collectibles/x/asset.webm'], 'with no render yet, the nameplate links its original animated file');
    const deco = await link('decoration', { decoration: palette.slice(0, 4), decorationUrl: 'https://cdn.discordapp.com/avatar-decoration-presets/a.png' });
    assert.strictEqual(deco.url, 'https://cdn.discordapp.com/avatar-decoration-presets/a.png?passthrough=true');
    // With a render, both open our lossless WebP, the permanent Cloudinary copy first (2026-10-21 17:40 EDT).
    const npWebp = await link('nameplate', { nameplate: palette.slice(0, 4), nameplateUrl: 'https://cdn.discordapp.com/assets/collectibles/x/static.png', nameplateWebp: { discordCdnUrl: 'https://cdn.discordapp.com/attachments/1/2/x.webp', cloudinaryUrl: 'https://res.cloudinary.com/x.webp' } });
    assert.strictEqual(npWebp.url, 'https://res.cloudinary.com/x.webp', 'the permanent Cloudinary copy, not an expiring attachment link');
    const decoWebp = await link('decoration', { decoration: palette.slice(0, 4), decorationUrl: 'https://cdn.discordapp.com/avatar-decoration-presets/a.png', decorationWebp: { cloudinaryUrl: 'https://res.cloudinary.com/d.webp' } });
    assert.strictEqual(decoWebp.url, 'https://res.cloudinary.com/d.webp');
    assert.strictEqual(await link('name', { displayNameColors: ['112233', '445566'] }), undefined, 'the Name page has a link');
});

t('the open page is green and disabled', async () => {
    // Was red (style 4) until 2026-10-19 12:11 EDT (Harkirat: "set the main /color command's active selection to green-disabled").
    const { components } = await render('avatar', { avatar: palette, avatarFullUrl: CDN, banner: palette, bannerUrl: CDN });
    const pageRow = components[0].components.filter(c => c.type === 1).pop();
    const open = pageRow.components.find(b => b.label === 'Avatar');
    assert.ok(open.style === 3 && open.disabled, JSON.stringify(open));
});

t('read-only (the View Colors right-click): its own ids, no Refresh or hint, an accent, the extra hint, lacking pages absent, under budget', async () => {
    const { components } = await buildColorPalettePanel({
        source: 'avatar', subpage: 1,
        data: { avatar: palette, avatarFullUrl: CDN, hasServerProfile: true, inGuild: true },
        targetUserId: '1', avatarThumbnailUrl: CDN, variant: 'global',
        readOnly: true, makePageId: k => `vc_page|1|${k}|g|0`, makeSubpageId: (k, n) => `vc_page|1|${k}|g|${n}`,
        makeVariantId: (flag, k) => `vc_page|1|${k}|${flag}|p`,
        accentColor: 0x123456, extraHint: '-# **No custom banner detected.**'
    });
    const flat = JSON.stringify(components);
    assert.ok(!/colors_/.test(flat), 'a /colors id leaked into the read-only panel');
    assert.ok(!/Refresh Colors|different part of your profile/.test(flat), 'the hint block or Refresh is back');
    assert.strictEqual(components[0].accent_color, 0x123456);
    assert.ok(/No custom banner detected/.test(flat));
    assert.ok(!/"label":"Banner"/.test(flat.replace(/"style":5[^}]*/g, '')), 'a page the person lacks has a button');
    assert.ok(/vc_page\|1\|avatar\|g\|0/.test(flat), 'the pager does not use the right-click ids');
    // The Main/Server Profile row on the right-click too (2026-10-25 12:41 EDT), through its own ids.
    assert.ok(/"custom_id":"vc_page\|1\|avatar\|s\|p"/.test(flat), 'the right-click has no View Server Profile button on its own ids');
    assert.strictEqual(components[1], undefined, 'nothing under it: the image link stays in the panel');
    assert.ok(countComponents(components) <= LIMIT);
});

t('the right-click without its own variant ids draws no profile row rather than borrowing /colors ids', async () => {
    const { components } = await buildColorPalettePanel({
        source: 'avatar', subpage: 0, data: { avatar: palette, avatarFullUrl: CDN, hasServerProfile: true, inGuild: true },
        targetUserId: '1', avatarThumbnailUrl: CDN, variant: 'global',
        readOnly: true, makePageId: k => `vc_page|1|${k}|g|p`, makeSubpageId: (k, n) => `vc_page|1|${k}|g|${n}`
    });
    assert.ok(!/View (Main|Server) Profile|vc_viewing/.test(JSON.stringify(components)));
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

t('Refresh is the footer\'s only PRIMARY, last, with its icon', async () => {
    const { components } = await render('avatar', { avatar: palette, avatarFullUrl: CDN });
    const buttons = components[1].components;
    assert.strictEqual(buttons.filter(b => b.style === 1).length, 1, 'the row no longer has exactly one primary action');
    assert.strictEqual(buttons[buttons.length - 1].label, 'Refresh Colors', 'Refresh Colors is no longer last (2026-10-25 12:25 EDT)');
    assert.ok(buttons[buttons.length - 1].emoji?.id, 'Refresh Colors lost its emoji');
    assert.ok(!buttons.some(b => String(b.custom_id || '').startsWith('colors_variant_')), 'the profile switch is back in the footer');
});

t('both profile buttons sit right above the page tabs: the open one green, disabled, no emoji; the other grey with the emoji (2026-10-25 12:30-12:37 EDT)', async () => {
    for (const variant of ['global', 'server']) {
        const { components } = await buildColorPalettePanel({
            source: 'avatar', subpage: 1, data: { avatar: palette, avatarFullUrl: CDN, banner: palette, bannerUrl: CDN, hasServerProfile: true, inGuild: true },
            targetUserId: '1', avatarThumbnailUrl: CDN, variant
        });
        const rows = components[0].components.filter(c => c.type === 1);
        const [profileRow, pageRow] = rows.slice(-2);
        assert.deepStrictEqual(pageRow.components.map(b => b.label), ['Avatar', 'Banner'], 'the page tabs are not last');
        const [main, server] = profileRow.components;
        const open = variant === 'server' ? server : main;
        const other = variant === 'server' ? main : server;
        assert.deepStrictEqual([main.label, server.label], variant === 'server' ? ['View Main Profile', 'Server Profile'] : ['Main Profile', 'View Server Profile']);
        assert.ok(open.style === 3 && open.disabled && !open.emoji, JSON.stringify(open));
        assert.ok(other.style === 2 && !other.disabled && other.emoji?.id, JSON.stringify(other));
        assert.strictEqual(other.custom_id, `colors_variant_${variant === 'server' ? 'g' : 's'}_avatar_1|1`, 'the switch does not keep the page and sub-page');
    }
});

t('the profile row is absent entirely without a server profile', async () => {
    // With no override both views resolve to identical images, so a switch would visibly do nothing.
    const { components } = await buildColorPalettePanel({
        source: 'avatar', subpage: 0,
        data: { avatar: palette, avatarFullUrl: CDN, hasServerProfile: false, inGuild: true },
        targetUserId: '1', avatarThumbnailUrl: CDN, variant: 'global'
    });
    assert.ok(!/colors_variant_|Profile"/.test(JSON.stringify(components)), 'a profile button rendered with no server profile to switch to');
});

t('page tabs run alphabetically and the name page is "Username"; the hex shares the name\'s line, and labels are bold not code (2026-10-25 12:25-12:41 EDT)', async () => {
    const { components } = await render('name', { avatar: palette, banner: palette, bannerUrl: CDN, nameplate: palette.slice(0, 4), nameplateUrl: CDN, decoration: palette.slice(0, 4), decorationUrl: CDN, displayNameColors: ['112233', '445566'] });
    const flat = JSON.stringify(components);
    const pageRow = components[0].components.filter(c => c.type === 1).pop();
    assert.deepStrictEqual(pageRow.components.map(b => b.label), ['Avatar', 'Banner', 'Deco', 'Nameplate', 'Username']);
    assert.ok(/Username Colors/.test(flat), 'the heading is not "Username Colors"');
    assert.ok(/Extracted from: \*\*Main Profile\*\*/.test(flat) && /Updated your profile\? \*\*Refresh Colors\*\*/.test(flat), 'a label is still in code font');
    assert.ok(/\*\* · `#[0-9A-F]{6}`\\n> /.test(flat) && !/Hex: /.test(flat), 'a swatch row still has its own "Hex:" line');
});

(async () => {
    for (const run of pending) await run();
    console.log(`\n  ${passed} passed, ${failed} failed\n`);
    process.exit(failed ? 1 : 0);
})();
