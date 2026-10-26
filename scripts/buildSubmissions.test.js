// Submit a Build and Dispute a Build (utils/buildSubmissions.js, Harkirat's /gunsmith review, 2026-10-25 16:40-17:08 EDT): the pop-ups discord.js accepts, the parsing of what was typed, and the owner's DM cards in each state. No database, no Discord.
const assert = require('assert');
const { ModalBuilder } = require('discord.js');
const S = require('../utils/buildSubmissions');

let passed = 0, failed = 0;
function t(name, fn) { try { fn(); passed++; console.log(`  PASS  ${name}`); } catch (e) { failed++; console.log(`  FAIL  ${name}\n        ${e.message}`); } }

const flat = c => [c, ...((c.components || []).flatMap(flat)), ...(c.accessory ? flat(c.accessory) : []), ...(c.component ? flat(c.component) : [])];
const sub = { _id: 'abc123', discordId: '42', mode: 'MP', category: 'AR', weaponName: 'AK-47', gunsmithCode: '1A2B', attachments: ['Monolithic Suppressor', 'No Stock'], notes: 'great for SnD', credited: false, hasScreenshot: true, status: 'pending' };

t('the Submit a Build pop-up: weapon filled in, an optional screenshot, the code (MP only), attachments and notes, and the credit choice; discord.js accepts it', () => {
    const mp = S.submitModal({ mode: 'MP', weaponName: 'AK-47', category: 'AR' });
    assert.deepStrictEqual(mp.components.map(c => c.label), ['Weapon', 'Screenshot', 'Gunsmith Code', 'Attachments and notes', 'Credit']);
    assert.strictEqual(mp.components[0].component.value, 'AK-47');
    assert.strictEqual(mp.components[1].component.required, false, 'the screenshot is preferred, not required');
    assert.ok(/kept privately/.test(mp.components[4].description), 'the pop-up says the ID is kept privately even when anonymous');
    assert.ok(mp.components.every(c => !c.description || c.description.length <= 100));
    assert.strictEqual(mp.custom_id, 'gsb~subsave~MP~AR');
    new ModalBuilder(mp).toJSON();
    const dmz = S.submitModal({ mode: 'DMZ', weaponName: 'FENNEC' });
    assert.ok(!dmz.components.some(c => c.label === 'Gunsmith Code'), 'a DMZ build has no code');
    new ModalBuilder(dmz).toJSON();
});

t('"attachments one per line, anything else after a blank line"', () => {
    assert.deepStrictEqual(S.parseDetails('1. Monolithic Suppressor\n- No Stock\n\nUse it on Hardpoint.\nReally.'), { attachments: ['Monolithic Suppressor', 'No Stock'], notes: 'Use it on Hardpoint.\nReally.' });
    assert.deepStrictEqual(S.parseDetails(''), { attachments: [], notes: '' });
});

t('the owner card: Read Screenshot only with a screenshot, then Approve and Deny; the submitter named whatever they chose', () => {
    const ids = S.submissionCard(sub).flatMap(flat).map(c => c.custom_id).filter(Boolean);
    assert.deepStrictEqual(ids, ['gsb~sub~read~abc123', 'gsb~sub~ok~abc123', 'gsb~sub~no~abc123']);
    assert.ok(JSON.stringify(S.submissionCard(sub)).includes('<@42>') && JSON.stringify(S.submissionCard(sub)).includes('anonymous'));
    const noShot = S.submissionCard({ ...sub, hasScreenshot: false }).flatMap(flat).map(c => c.custom_id).filter(Boolean);
    assert.deepStrictEqual(noShot, ['gsb~sub~ok~abc123', 'gsb~sub~no~abc123']);
    const approved = JSON.stringify(S.submissionCard({ ...sub, status: 'approved', resolvedAt: new Date(0) }, { note: 'saved as Build 1' }));
    assert.ok(approved.includes('Approved') && approved.includes('saved as Build 1') && !approved.includes('gsb~sub~'), 'once decided the buttons go');
});

t('Approve opens their fields to fix typos first; discord.js accepts it', () => {
    const m = S.approveModal(sub);
    assert.strictEqual(m.custom_id, 'gsb~subok~abc123');
    assert.strictEqual(m.components[0].component.value, 'AK-47 | AR');
    assert.strictEqual(m.components[2].component.value, 'Monolithic Suppressor\nNo Stock');
    new ModalBuilder(m).toJSON();
});

t('the dispute pop-up and the build it names', () => {
    const m = S.disputeModal();
    assert.deepStrictEqual(m.components.map(c => c.label), ['Which build', 'What you want', 'Proof', 'Your original screenshot', 'Notes']);
    new ModalBuilder(m).toJSON();
    assert.deepStrictEqual(S.parseBuildText('AK117 Build 2'), { name: 'AK117', number: 2 });
    assert.deepStrictEqual(S.parseBuildText('Locus - build #3'), { name: 'Locus', number: 3 });
    assert.deepStrictEqual(S.parseBuildText('BP50'), { name: 'BP50', number: null });
});

t('the dispute card: Remove / Change credit only when the build was found; the anonymous submitter is shown to the owner', () => {
    const dis = { _id: 'd1', discordId: '7', buildText: 'AK117 Build 2', ask: 'credit', proofUrl: 'https://x.com/p/1', notes: '', status: 'pending' };
    const build = { weaponName: 'AK117', buildName: 'Build 2', category: 'AR', mode: 'MP', submittedBy: { discordId: '42', credited: false } };
    const found = JSON.stringify(S.disputeCard(dis, build));
    assert.ok(found.includes('<@42>') && found.includes('anonymous to players') && found.includes('wants credit instead'));
    const buttons = S.disputeCard(dis, null).flatMap(flat).filter(c => c.type === 2);
    assert.deepStrictEqual(buttons.map(b => [b.label, Boolean(b.disabled)]), [['Remove build', true], ['Change credit', true], ['Deny', false], ['More info', false]]);
    assert.ok(JSON.stringify(S.disputeCard({ ...dis, status: 'credited', resolvedAt: new Date(0) }, build)).includes('Credit changed to them'));
});

t('one submission or dispute per person every 10 minutes', () => {
    assert.strictEqual(S.RATE_MS, 10 * 60 * 1000);
});

(async () => {
    // Two pop-ups sent at once by the same person: the second is turned away while the first is still sending, and the claim is released afterwards.
    const replies = []; let release; const ran = [];
    const fake = { user: { id: '9' }, reply: async (r) => replies.push(r.content) };
    const first = S.oneAtATime(fake, () => new Promise(r => { ran.push(1); release = r; }));
    await S.oneAtATime(fake, async () => ran.push(2));
    t('a second submission sent at once waits for the first', () => { assert.deepStrictEqual(ran, [1]); assert.ok(/still sending/.test(replies[0])); });
    release(); await first;
    await S.oneAtATime(fake, async () => ran.push(3));
    t('the claim is released once the first has sent', () => assert.deepStrictEqual(ran, [1, 3]));
    t('a DM is composed under the id of the app that sends it, so its emojis are that app\'s', () => {
        const seen = S.composeAs({ application: { id: 'public-app' } }, () => require('../utils/requestContext').getContext().appId);
        assert.strictEqual(seen, 'public-app');
        assert.strictEqual(S.composeAs({}, 'plain text'), 'plain text');
    });
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
})();

