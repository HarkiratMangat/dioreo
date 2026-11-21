// scripts/commandError.test.js What a person sees when a command, button or form fails (utils/commandError.js, added 2026-11-21 12:19 EST): whose fault it is, what to try, a Report button that opens Bugs & Suggestions, a Ref, a private answer when nothing was deferred, a follow-up when the reply cannot be edited, the "trouble reaching Discord" wording while utils/restGuard.js knows calls are failing, and the Ref carried onto the owner's feedback card.
const assert = require('assert');
const { failureText, tellUserItFailed, refFromMessage, errorRef } = require('../utils/commandError');
const { FEEDBACK_BUTTON_ID, feedbackCard } = require('../utils/feedback');
const guard = require('../utils/restGuard');

function fake({ deferred = false, editFails = false, id = '1234567890123456789' } = {}) {
    const calls = [];
    return {
        calls, id, deferred, replied: false,
        isAutocomplete: () => false,
        editReply: async (p) => { calls.push(['edit', p]); if (editFails) throw new Error('V2 message'); },
        reply: async (p) => calls.push(['reply', p]),
        followUp: async (p) => calls.push(['followUp', p]),
    };
}

(async () => {
    guard._resetTrouble();
    const text = failureText('/timestamp', 'abc123');
    const lines = text.split('\n');
    assert.strictEqual(lines.length, 4, 'title, whose fault, hint, Ref');
    assert.ok(/^<a?:\w+:\d+> \*\*\/timestamp didn't work\*\*$/.test(lines[0]) || lines[0].endsWith("**/timestamp didn't work**"), lines[0]);
    assert.strictEqual(lines[1], 'Something went wrong on our side, not yours.');
    assert.ok(lines[2].startsWith('-# ') && lines[2].includes('**Report**'));
    assert.strictEqual(lines[3], '-# Ref `abc123`');
    assert.ok(failureText(null, null).includes("**That didn't work**"));
    assert.strictEqual(failureText(null, null).split('\n').length, 3, 'no Ref line without a Ref');
    assert.ok(!/There was an error executing/.test(text));

    // Deferred: the reply itself becomes the note, with the Report button and the Ref.
    let ix = fake({ deferred: true });
    assert.strictEqual(await tellUserItFailed(ix, '/timestamp'), 'edited');
    const [kind, p] = ix.calls[0];
    assert.strictEqual(kind, 'edit');
    assert.strictEqual(p.components[0].components[0].custom_id, FEEDBACK_BUTTON_ID);
    assert.ok(p.content.includes(`Ref \`${errorRef(ix)}\``) && errorRef(ix) === '456789');

    // Nothing deferred: a private reply.
    ix = fake();
    assert.strictEqual(await tellUserItFailed(ix, 'that'), 'replied');
    assert.strictEqual(ix.calls[0][1].flags, 64);

    // The reply cannot take text: a private follow-up instead.
    ix = fake({ deferred: true, editFails: true });
    assert.strictEqual(await tellUserItFailed(ix, 'that'), 'followup');
    assert.strictEqual(ix.calls[1][0], 'followUp');
    assert.strictEqual(ix.calls[1][1].flags, 64);

    // A button whose panel was already deferred: never edit the panel, follow up privately under it.
    ix = { ...fake({ deferred: true }), isMessageComponent: () => true };
    assert.strictEqual(await tellUserItFailed(ix, 'that'), 'followup');
    assert.ok(!ix.calls.some(c => c[0] === 'edit'), 'the panel is left alone');

    // Autocomplete is never answered this way.
    assert.strictEqual(await tellUserItFailed({ isAutocomplete: () => true }, 'x'), null);

    // While Discord calls are failing, the note says so instead of suggesting a quick retry.
    guard.noteTrouble();
    ix = fake({ deferred: true });
    await tellUserItFailed(ix, '/draws');
    assert.ok(ix.calls[0][1].content.includes('trouble reaching Discord'));
    guard._resetTrouble();

    // The Ref travels to the owner's feedback card when Report was pressed under the note.
    assert.strictEqual(refFromMessage({ content: text }), 'abc123');
    assert.strictEqual(refFromMessage({ content: 'no ref here' }), null);
    const card = feedbackCard({ kind: 'bug', message: 'it broke', userId: '42', username: 'u', ref: 'abc123' });
    assert.ok(JSON.stringify(card).includes('About a failed command · Ref'));
    assert.ok(!JSON.stringify(feedbackCard({ kind: 'bug', message: 'x', userId: '42', username: 'u' })).includes('failed command'));
    console.log('ok: the failure note says whose fault, what to try, Report and Ref, in every reply state, and carries the Ref to the feedback card');
})().catch(err => { console.error(err); process.exit(1); });
