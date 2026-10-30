// utils/textCommands/args.js -- reads the words after a text command into its slash command's own options (text commands B2, 2026-10-29). Pure, apart from the date check: a date must parse with /timestamp's own parser, which bot/textCommands.js passes in as `checkDatetime` (commands/timestamp.js expandShorthand + utils/timestampHelper.js, never a copy).
//
// The grammar is the design spec's "Options and aliases" section (docs/superpowers/specs/2026-10-28-text-commands-design.md), Harkirat's trim of 2026-10-28 21:51 EDT:
//   - words fill options in any order; a word matches a value by its name or any alias, singular or plural, or (where parse.js allows typos) a one-letter typo by parse.js's own isTypoOf;
//   - `option:value` always works;
//   - a rest option takes every word nothing else claimed (timestamp's date, gunsmith's weapon, patch notes' season);
//   - `visibility` is never a text option: a text reply is always public (utils/textCommands/adapter.js).
// What the words mean once read (a leftover word, a date that does not parse, a weapon to look up) is parse.js's and bot/textCommands.js's call, not this file's.

// Singular and plural always both match (spec). A one-letter word has no plural, so `d` never becomes `ds`.
function pluralOf(word) {
    if (!word || word.length < 2) return null;
    return /[^aeiou]y$/.test(word) ? `${word.slice(0, -1)}ies` : `${word}s`;
}
function sameWord(typed, word) {
    return typed === word || pluralOf(word) === typed || pluralOf(typed) === word;
}

// `utc+5`, `gmt-4`, `UTC+5:30`: a fixed offset, which the date parser reads inside the date text.
const OFFSET = /^(utc|gmt)\s*[+-]\s*\d{1,2}(:?\d{2})?$/i;

const mentionId = token => (/^<@!?(\d+)>$/.exec(token) || [])[1] || null;
const squash = s => String(s || '').toLowerCase().replace(/[\s\-_.]/g, '');

// Without a checker from the caller, chrono alone (utils/timestampHelper.js), with no shorthand expansion. Deliberately NOT a require of commands/timestamp.js: this file is required by bot/textCommands.js, which is structural to the hotpatch planner (utils/hotpatch.js), so any require edge from here into commands/ would make that command un-hot-patchable. bot/textCommands.js reaches /timestamp's expansion through client.commands instead, the router's own late-bound door.
function defaultCheckDatetime(text) {
    return Boolean(require('../timestampHelper').generateTimestamps(text)?.unix);
}

// Every value alias of these options, longest first, so `legendary character` wins over `legendary` and `mythic weapon` over `mythic`.
function valueIndex(options) {
    const out = [];
    for (const opt of options) for (const val of opt.values || []) for (const alias of val.aliases) {
        const parts = alias.toLowerCase().split(/\s+/);
        out.push({ opt, val, parts, joined: parts.join('') });
    }
    return out.sort((a, b) => b.parts.length - a.parts.length || b.joined.length - a.joined.length);
}

function matchValueAt(lower, i, index, allowTypos) {
    for (const e of index) {
        const n = e.parts.length;
        if (i + n > lower.length) continue;
        if (e.parts.every((p, k) => (k === n - 1 ? sameWord(lower[i + k], p) : lower[i + k] === p))) return { ...e, used: n };
    }
    // A one-word alias typed with a space or dash in it: `10 cp`, `non reactive`.
    for (const n of [3, 2]) {
        if (i + n > lower.length) continue;
        const span = lower.slice(i, i + n).join('');
        const e = index.find(x => x.parts.length === 1 && sameWord(span, x.joined));
        if (e) return { ...e, used: n };
    }
    if (!allowTypos) return null;
    const { isTypoOf } = require('./parse');
    const hits = index.filter(e => e.parts.length === 1 && isTypoOf(lower[i], e.joined));
    // Two different values a typo could be is a guess, and a guess is not made.
    return new Set(hits.map(h => h.val)).size === 1 ? { ...hits[0], used: 1, typo: true } : null;
}

// The class a word names, for gunsmith's rest: `smg`, `snipers`, `assault rifle`.
function classOf(text, classes) {
    const typed = squash(text);
    if (!typed || !classes) return null;
    for (const [category, words] of Object.entries(classes)) {
        for (const w of words) if (sameWord(typed, squash(w))) return category;
    }
    return null;
}

// tokens: the words after the command. Returns { options, leftover, missing, autocomplete, unresolved, hasArgs }:
//   options       { optionName: value } for the adapter's getString(); a multi option is a comma list
//   leftover      words nothing understood
//   missing       required options with no value (only timestamp's date)
//   autocomplete  [{ option, text, first? }] still to resolve through the slash command's own suggestions
//   unresolved    { option, text } when a date did not parse
// commandJson (the slash command's toJSON(), optional) only narrows choice values to ones the command really has.
function parseArgs(tokens, textCommand, commandJson = null, { allowTypos = false, prefill = {}, checkDatetime = defaultCheckDatetime } = {}) {
    const options = (textCommand?.options || []).filter(o => o.name !== 'visibility');
    const values = { ...prefill };
    const multi = new Map();
    const leftover = [], restWords = [], autocomplete = [], missing = [];
    let unresolved = null;
    let restFromKey = null;
    const restOpt = options.find(o => o.rest);
    const index = valueIndex(options);
    const lower = tokens.map(t => t.toLowerCase());
    const choicesOf = name => {
        const node = (commandJson?.options || []).find(o => o.type === 1 && o.name === textCommand.sub)?.options || commandJson?.options || [];
        return node.find(o => o.name === name)?.choices?.map(c => c.value) || null;
    };
    const assign = (opt, value) => {
        if (opt.multi) {
            const set = multi.get(opt.name) || new Set();
            for (const v of [].concat(value)) set.add(v);
            multi.set(opt.name, set);
            return true;
        }
        if (values[opt.name] !== undefined) return false;
        const choices = choicesOf(opt.name);
        if (choices && !opt.rest && !choices.includes(value)) return false;
        values[opt.name] = value;
        return true;
    };
    for (let i = 0; i < tokens.length;) {
        const tok = tokens[i];
        const kv = /^([a-z]+):(.+)$/i.exec(tok);
        const keyed = kv && options.find(o => (o.keys || [o.name]).includes(kv[1].toLowerCase()));
        if (keyed) {
            const text = kv[2];
            let ok;
            if (keyed.rest) {
                ok = values[keyed.name] === undefined && restFromKey === null;
                if (ok) restFromKey = text;
            } else if (keyed.mention) ok = Boolean(mentionId(text)) && assign(keyed, mentionId(text));
            else if (keyed.keyOnly) ok = assign(keyed, text);
            else {
                const own = index.filter(e => e.opt === keyed);
                const m = matchValueAt([text.toLowerCase()], 0, own, allowTypos);
                const raw = (keyed.values || []).find(v => typeof v.value === 'string' && v.value.toLowerCase() === text.toLowerCase());
                ok = m ? assign(keyed, m.val.value) : raw ? assign(keyed, raw.value) : false;
            }
            if (!ok) leftover.push(tok);
            i++;
            continue;
        }
        const mentionOpt = options.find(o => o.mention);
        if (mentionOpt && mentionId(tok)) {
            if (!assign(mentionOpt, mentionId(tok))) leftover.push(tok);
            i++;
            continue;
        }
        const m = matchValueAt(lower, i, index, allowTypos);
        if (m && (m.opt.multi || values[m.opt.name] === undefined) && assign(m.opt, m.val.value)) { i += m.used; continue; }
        const used = m ? m.used : 1;
        (restOpt ? restWords : leftover).push(...tokens.slice(i, i + used));
        i += used;
    }
    for (const [name, set] of multi) values[name] = [...set].join(',');
    if (restOpt) {
        const filled = values[restOpt.name] !== undefined;
        const words = restFromKey !== null ? [restFromKey, ...restWords] : restWords;
        let text = words.join(' ').trim();
        if (filled && words.length) leftover.push(...words);
        else if (!filled && restOpt.rest === 'datetime' && text) {
            // B6, his calls 2026-10-29 20:49-20:53 EDT: an offset given with tz: (`tz:utc+5`) joins the date text, where /timestamp's parser already reads it; a zone named at the END of the date (`fri 6pm tokyo`, `8pm new york`) is the zone, exact names only, when what is left still reads as a date.
            if (values.timezone && OFFSET.test(values.timezone)) { text = `${text} ${values.timezone}`; delete values.timezone; }
            if (values.timezone === undefined) {
                const parts = text.split(/\s+/);
                for (const n of [2, 1]) {
                    if (parts.length <= n) continue;
                    const zone = require('../timezoneData').exactTimezone(parts.slice(-n).join(' '));
                    const date = parts.slice(0, -n).join(' ');
                    if (zone && (!checkDatetime || checkDatetime(date))) { values.timezone = zone; text = date; break; }
                }
            }
            if (checkDatetime && !checkDatetime(text)) unresolved = { option: restOpt.name, text };
            else values[restOpt.name] = text;
        } else if (!filled && restOpt.rest === 'weapon') {
            // No weapon, or only a class word: the first weapon alphabetically with a build (commands/gunsmith.js reads `~first~`, which no weaponKey can be).
            const category = classOf(text, restOpt.classes);
            // `d gs meta` / `d dmz meta`: that mode's META browse (his ask, B6, 2026-10-29 20:06 EDT); commands/gunsmith.js opens `~scope~` as the dropdown's All META row.
            if (sameWord(squash(text), 'meta')) values[restOpt.name] = `~scope~${textCommand.sub === 'dmz' ? 'DMZ' : 'MP'}.*.meta`;
            else if (!text || category) values[restOpt.name] = `~first~${category || ''}`;
            else autocomplete.push({ option: restOpt.name, text });
        } else if (!filled && restOpt.rest === 'autocomplete' && text) {
            autocomplete.push({ option: restOpt.name, text: restOpt.restText ? restOpt.restText(text) : text });
        }
    }
    const { LATEST } = require('./commands');
    for (const opt of options) {
        if (values[opt.name] === LATEST) { delete values[opt.name]; autocomplete.push({ option: opt.name, text: '', first: true }); }
    }
    for (const opt of options) {
        if (opt.required && values[opt.name] === undefined && unresolved?.option !== opt.name) missing.push(opt.name);
    }
    return { options: values, leftover, missing, autocomplete, unresolved, hasArgs: tokens.length > 0 && leftover.length < tokens.length };
}

module.exports = { parseArgs, sameWord, pluralOf, classOf };
