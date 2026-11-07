// scripts/timestampButtons.test.js -- /timestamp's button row (2026-11-01 15:19 EDT, Harkirat's panel update): Edit Timestamp's form and what its submit changes, and Set Timezone / My Timezone saving the presser's own zone. No database and no Discord: the models, /remind's save and the render are stubbed.
const assert = require('assert');
const path = require('path');
const stub = (rel, exportsObj) => { const f = require.resolve(path.join('..', rel)); require.cache[f] = { id: f, filename: f, loaded: true, exports: exportsObj }; };
const saved = [];
let prefsById = {};
stub('models/UserPreference', { findOne: async ({ discordId }) => prefsById[discordId] || null });
stub('utils/accentColor', { getAccentColorForCommand: async () => 7 });
stub('utils/sendV2Payload', { sendV2Payload: async () => {} });
stub('utils/timezoneBox', {
    saveZone: async (id, tz) => { saved.push([id, tz]); },
    userZone: async () => null,
    zoneModal: (owner, current, prefix) => ({ title: 'Set your timezone', custom_id: `${prefix}:${owner}`, components: [] }),
});
const H = { ...require('../handlers/timestamp'), ...require('../utils/timestampPanel') };
const timestamp = require('../commands/timestamp');

const U = 1792540320;
// A panel as Discord hands it back: the container, the button row, the dropdown.
function panelMessage({ owner = 'u1', zoneSet = false, flags = 32768, style = 'short_list' } = {}) {
    return {
        flags: { bitfield: flags },
        components: [
            { type: 17, components: [{ type: 10, content: '## Timestamp Codes' }] },
            timestamp.panelActionRow(owner, zoneSet),
            { type: 1, components: [{ type: 3, custom_id: `tsmenu|${U}|America/Vancouver|in 2 hours`, options: timestamp.STYLE_SELECT_OPTIONS.map(o => ({ ...o, default: o.value === style })) }] },
        ],
    };
}
const runs = [];
function fake({ customId, user = 'u1', message = panelMessage(), fields = {}, values = [], kind = 'button' }) {
    const calls = [];
    const i = {
        customId, user: { id: user }, message, values, calls, deferred: false, replied: false,
        client: { commands: new Map([['timestamp', { ...timestamp, execute: async (_s, state) => runs.push(state) }]]) },
        isButton: () => kind === 'button', isModalSubmit: () => kind === 'modal', isStringSelectMenu: () => kind === 'select',
        fields: {
            getTextInputValue: id => { if (!(id in fields)) throw new Error('no field'); return fields[id]; },
            getStringSelectValues: id => { if (!(id in fields)) throw new Error('no field'); return [].concat(fields[id]); },
        },
        showModal: async m => calls.push(['modal', m]),
        deferUpdate: async () => { i.deferred = true; calls.push(['deferUpdate']); },
        deferReply: async o => { i.deferred = true; calls.push(['deferReply', o]); },
        reply: async o => { i.replied = true; calls.push(['reply', o]); },
        followUp: async o => calls.push(['followUp', o]),
        editReply: async o => calls.push(['editReply', o]),
    };
    return i;
}

let failures = 0;
async function check(name, fn) { try { runs.length = 0; saved.length = 0; prefsById = {}; await fn(); console.log(`  ok   ${name}`); } catch (e) { failures++; console.error(`  FAIL ${name}\n       ${e.stack}`); } }

(async () => {
    await check('the panel says whose it is, its zone colour, its parse and its view', async () => {
        const s = H.panelState(panelMessage({ zoneSet: true, flags: 32768 | 64 }), 'x');
        assert.deepStrictEqual([s.ownerId, s.ownerHasZone, s.unix, s.tz, s.queryInput, s.style, s.ephemeral, s.isTextMode], ['u1', true, String(U), 'America/Vancouver', 'in 2 hours', 'short_list', true, false]);
        assert.strictEqual(H.panelState({ flags: { bitfield: 0 }, components: [], interactionMetadata: { user: { id: 'u9' } } }, 'x').ownerId, 'u9', 'a panel from before the row: the interaction that made it');
    });
    await check('Edit Timestamp opens his five-part form, filled from the panel', async () => {
        const i = fake({ customId: 'tsedit|u1' });
        assert.strictEqual(await H.handleTimestampInteraction(i), true);
        const [kind, m] = i.calls[0];
        assert.strictEqual(kind, 'modal');
        assert.strictEqual(m.custom_id, 'tseditm|u1');
        const by = id => m.components.find(c => c.component.custom_id === id).component;
        assert.strictEqual(m.components.length, 5);
        assert.strictEqual(by('when').value, 'in 2 hours', '(1) the date and time, prefilled');
        assert.ok(by('zone').options.length && by('zone').options.length <= 25, '(2) a quick pick');
        assert.strictEqual(by('zonequery').type, 4, '(3) a typed timezone');
        assert.strictEqual(by('view').options.find(o => o.default).value, 'embed', '(4) the view');
        assert.strictEqual(by('style').options.find(o => o.default).value, 'short_list', '(5) the format');
    });
    await check('the owner submits the same view: their panel changes in place, re-read in the zone they typed', async () => {
        const i = fake({ kind: 'modal', customId: 'tseditm|u1', fields: { when: 'tomorrow 8pm', zone: [], zonequery: 'tokyo', view: 'embed', style: 'longDate' } });
        await H.handleTimestampInteraction(i);
        assert.deepStrictEqual(i.calls.map(c => c[0]), ['deferUpdate']);
        const r = runs[0];
        assert.deepStrictEqual([r.tz, r.queryInput, r.style, r.isTextMode, r.ownerId, r.ownerHasZone], ['Asia/Tokyo', 'tomorrow 8pm', 'longDate', false, 'u1', false]);
        assert.strictEqual(r.unix, timestamp.parseQuery('tomorrow 8pm', 'Asia/Tokyo').unix);
    });
    await check('a change of view is a new message (a panel cannot switch by an edit)', async () => {
        const i = fake({ kind: 'modal', customId: 'tseditm|u1', fields: { when: 'tomorrow 8pm', view: 'text', style: 'all_formats' } });
        await H.handleTimestampInteraction(i);
        assert.deepStrictEqual(i.calls[0], ['deferReply', { flags: 0 }]);
        assert.deepStrictEqual([runs[0].isTextMode, runs[0].style, runs[0].tz], [true, null, 'America/Vancouver']);
    });
    await check("someone else's Edit gives them their own private panel and leaves the owner's alone", async () => {
        prefsById.u2 = { timezone: 'Europe/London', timezoneSetAt: new Date() };
        const i = fake({ kind: 'modal', user: 'u2', customId: 'tseditm|u1', fields: { when: 'tomorrow 8pm', view: 'embed', style: 'short_list' } });
        await H.handleTimestampInteraction(i);
        assert.deepStrictEqual(i.calls[0], ['deferReply', { flags: 64 }]);
        assert.deepStrictEqual([runs[0].ownerId, runs[0].ownerHasZone, runs[0].ephemeral], ['u2', true, true]);
    });
    await check('a time or zone that cannot be read is answered privately, and nothing renders', async () => {
        const bad = fake({ kind: 'modal', customId: 'tseditm|u1', fields: { when: 'blorp', view: 'embed', style: 'short_list' } });
        await H.handleTimestampInteraction(bad);
        const zone = fake({ kind: 'modal', customId: 'tseditm|u1', fields: { when: 'tomorrow 8pm', zonequery: 'qqqqzz', view: 'embed', style: 'short_list' } });
        await H.handleTimestampInteraction(zone);
        assert.strictEqual(runs.length, 0);
        assert.ok(bad.calls[0][1].content.includes('Could not read') && bad.calls[0][1].flags === 64);
        assert.ok(zone.calls[0][1].content.includes('No timezone matches'));
    });
    await check('Set Timezone opens the shared box; a pick saves the PRESSER\'s zone and turns the owner\'s button grey', async () => {
        const open = fake({ customId: 'tszone|u1', user: 'u2' });
        await H.handleTimestampInteraction(open);
        assert.strictEqual(open.calls[0][1].custom_id, 'tszonem:u2');
        const own = fake({ kind: 'modal', customId: 'tszonem:u1', fields: { zone: 'Asia/Tokyo' } });
        await H.handleTimestampInteraction(own);
        assert.deepStrictEqual(saved, [['u1', 'Asia/Tokyo']]);
        assert.deepStrictEqual(own.calls.map(c => c[0]), ['deferUpdate', 'followUp']);
        assert.strictEqual(runs[0].ownerHasZone, true);
        assert.ok(own.calls[1][1].content.includes('Timezone set to'));
        const other = fake({ kind: 'modal', user: 'u2', customId: 'tszonem:u2', fields: { zone: 'Europe/London' } });
        await H.handleTimestampInteraction(other);
        assert.deepStrictEqual(other.calls.map(c => c[0]), ['reply'], "someone else's press: a private confirmation, the panel untouched");
        assert.strictEqual(runs.length, 1);
    });
    await check('a search with several matches asks which one, and the pick saves it', async () => {
        const i = fake({ kind: 'modal', customId: 'tszonem:u1', fields: { query: 'america' } });
        await H.handleTimestampInteraction(i);
        assert.ok(i.calls[0][1].components[0].components[0].custom_id === 'tszonepick:u1');
        const pick = fake({ kind: 'select', customId: 'tszonepick:u1', values: ['America/Chicago'] });
        await H.handleTimestampInteraction(pick);
        assert.deepStrictEqual(saved.at(-1), ['u1', 'America/Chicago']);
    });
    process.exit(failures ? 1 : 0);
})();
