// ==========================================
// Discord's message-component rules, checked before a panel is sent
// ==========================================
// Added 2026-11-12 19:29 EST (gunsmith-autobuild-fixes, Harkirat: "any other bugs like this ... and why tf these even happened"). Discord refuses a WHOLE message (50035 Invalid Form Body) when one component breaks a rule, and a refused panel edit used to reach only the log: the panel simply did not move. Three freezes had this one shape: /autobuild's Save All (two saves into one build put the same value in a select twice, 2026-11-12), Promote to Live (a duplicate custom_id, 2026-11-11) and /help (an emoji id the app did not own, 2026-10-29). Each panel only had the limit tests its author thought of; this is the one copy of the rules, run by utils/sendV2Payload.js on every send and by the tests. Pure: it returns the problems, it never throws or blocks.
//
// The rules (Discord's API reference, Message Components): custom_id unique per message and at most 100 characters · a select has 1 to 25 options with unique values, each label, value and description at most 100 characters, a placeholder at most 150 · an action row holds at most 5 buttons, or exactly one select · a button label at most 80 · at most 40 components in all, nested ones counted · Text Displays at most 4,000 characters in all.

const SELECTS = new Set([3, 5, 6, 7, 8]);

function checkComponents(components) {
    const problems = [];
    const ids = new Map();
    let total = 0;
    let textChars = 0;
    const walk = (c) => {
        if (!c || typeof c.type !== 'number') return;
        total++;
        if (typeof c.custom_id === 'string') {
            if (ids.has(c.custom_id)) problems.push(`duplicate custom_id "${c.custom_id}"`);
            ids.set(c.custom_id, true);
            if (c.custom_id.length > 100) problems.push(`custom_id over 100 characters: "${c.custom_id.slice(0, 40)}…"`);
        }
        if (c.type === 10 && typeof c.content === 'string') textChars += c.content.length;
        if (c.type === 1) {
            const kids = c.components || [];
            if (kids.length > 5) problems.push(`an action row holds ${kids.length} components (5 at most)`);
            if (kids.some(k => SELECTS.has(k?.type)) && kids.length > 1) problems.push('a select shares its action row');
            if (!kids.length) problems.push('an empty action row');
        }
        if (c.type === 2 && typeof c.label === 'string' && c.label.length > 80) problems.push(`button label over 80 characters: "${c.label.slice(0, 30)}…"`);
        if (c.type === 3) {
            const opts = c.options || [];
            const name = c.custom_id || 'a select';
            if (opts.length < 1 || opts.length > 25) problems.push(`${name} has ${opts.length} options (1 to 25)`);
            const values = opts.map(o => o?.value);
            const seen = new Set();
            for (const v of values) { if (seen.has(v)) problems.push(`${name} repeats the option value "${v}"`); seen.add(v); }
            for (const o of opts) {
                if (String(o?.label ?? '').length > 100) problems.push(`${name} has an option label over 100 characters`);
                if (String(o?.value ?? '').length > 100) problems.push(`${name} has an option value over 100 characters`);
                if (o?.description && String(o.description).length > 100) problems.push(`${name} has an option description over 100 characters`);
            }
            if (c.placeholder && c.placeholder.length > 150) problems.push(`${name}'s placeholder is over 150 characters`);
        }
        for (const k of ['components', 'accessory']) {
            const v = c[k];
            if (Array.isArray(v)) v.forEach(walk); else if (v) walk(v);
        }
    };
    (components || []).forEach(c => walk(c));
    if (total > 40) problems.push(`${total} components (40 at most)`);
    if (textChars > 4000) problems.push(`${textChars} characters of text (4,000 at most)`);
    return problems;
}

module.exports = { checkComponents };
