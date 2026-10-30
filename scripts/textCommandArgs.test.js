// scripts/textCommandArgs.test.js -- the text-command options grammar (utils/textCommands/args.js, read through utils/textCommands/parse.js with the REAL command list): the spec's "Options and aliases" section after Harkirat's trim of 2026-10-28 21:51 EDT. Each row is a message someone could type and what Dioreo must make of it. Then every alias in utils/textCommands/commands.js resolves to what the spec says, no alias belongs to two commands or two values (and a planted clash is caught), and every value is a choice the slash command really has. Written 2026-10-29 (text commands B2).
const assert = require('assert');
const { parseTextCommand } = require('../utils/textCommands/parse');
const { TEXT_COMMANDS, aliasClashes, LATEST } = require('../utils/textCommands/commands');
const { pluralOf } = require('../utils/textCommands/args');

const BOT = '111';
// The date check bot/textCommands.js passes in: /timestamp's own expansion, then its chrono helper.
const { expandShorthand } = require('../commands/timestamp');
const { generateTimestamps } = require('../utils/timestampHelper');
const checkDatetime = text => Boolean(generateTimestamps(expandShorthand(text))?.unix);
const v = (text, extra = {}) => parseTextCommand(text, { botId: BOT, prefixes: ['d', 'dior'], commands: TEXT_COMMANDS, checkDatetime, ...extra });
const M = `<@${BOT}>`;
const LEG = 'legendaryGunReactive,legendaryGunNonReactive';
const ARM = 'armoryMythicWeapon,armoryLegendaryWeapon,armoryLegendaryCharacter';

// [message, expected (a partial verdict), parse options]
const rows = [
    ['d calendar upcoming', { kind: 'run', command: 'calendar', values: { filter: 'soon' } }],
    ['d calendar filter:upcoming', { kind: 'run', command: 'calendar', values: { filter: 'soon' } }],
    ['d calendar filter:past', { kind: 'run', values: { filter: 'over' } }],
    ['d calendar events upcoming', { kind: 'run', values: { page: 'events', filter: 'soon' } }],
    ['d calendar upcoming events', { kind: 'run', values: { page: 'events', filter: 'soon' } }],
    ['dior calender upcomming', { kind: 'run', command: 'calendar', values: { filter: 'soon' }, fuzzy: true }],
    ['d calendar is wild today', { kind: null }],
    ['d calendar what is this', { kind: null }],
    ['d calendar filter:purple', { kind: 'run', command: 'calendar', values: {} }], // B6: one word nothing understood is ignored after d
    ['d calendar filter:purple yo', { kind: null }],                   // two are chat
    ['d calendar visibility:public', { kind: 'run', command: 'calendar', values: {} }], // visibility is never a text option: the word is ignored
    [`${M} calendar what`, { kind: 'run', command: 'calendar', values: {} }],   // clearly addressed: an unknown word is ignored (the spec's rules table)
    [`${M} calendar purple`, { kind: 'run', command: 'calendar', values: {} }],
    [`${M} calendar purple upcoming`, { kind: 'run', command: 'calendar', values: { filter: 'soon' } }],  // ...and the words it did understand still count
    ['@calendar purple', { kind: null }],
    ['d calendar modes new', { kind: 'run', values: { page: 'playlists', filter: 'live' } }],
    ['d modes', { kind: 'run', command: 'calendar', values: { page: 'playlists' } }],
    ['d events', { kind: 'run', command: 'calendar', values: { page: 'events' } }],
    ['d gm', { kind: 'run', command: 'calendar', values: { page: 'playlists' } }],
    ['d event', { kind: 'run', command: 'calendar', values: { page: 'events' } }],      // singular of a plural alias
    ['d new', { kind: null }],                                         // new never works alone (answer 2)
    ['d returning', { kind: null }],
    ['d draws returning', { kind: 'run', command: 'draws', values: { page: 'returning' } }],
    ['d draws r', { kind: 'run', values: { page: 'returning' } }],
    ['d draws n', { kind: 'run', values: { page: 'new' } }],
    ['dior draws o', { kind: 'run', command: 'draws', values: {} }],   // a stray key is still forgiven
    [`${M} draws pls`, { kind: 'run', command: 'draws', values: {} }],  // the spec's own row: trailing text ignored
    ['d draws pls', { kind: 'run', command: 'draws', values: {} }],    // B6: one more word is ignored after d (his rule, 2026-10-29 14:29 EDT)
    ['d draws pls now', { kind: null }],
    ['d gs ak117', { kind: 'run', command: 'gunsmith', autocomplete: [{ option: 'weapon', text: 'ak117' }] }],
    ['d gunsmith ak 117', { kind: 'run', command: 'gunsmith', autocomplete: [{ option: 'weapon', text: 'ak 117' }] }],
    ['d gs type 19', { kind: 'run', command: 'gunsmith', autocomplete: [{ option: 'weapon', text: 'type 19' }] }],
    ['d gunsmith', { kind: 'run', command: 'gunsmith', values: { weapon: '~first~' } }],
    ['d gs smg', { kind: 'run', values: { weapon: '~first~SMG' } }],
    ['d gs assault rifles', { kind: 'run', values: { weapon: '~first~AR' } }],
    ['d meta pistols', { kind: 'run', command: 'gunsmith', values: { weapon: '~scope~MP.*.meta' } }], // B6: `d meta` is the META browse; one more word is ignored after d
    ['d meta', { kind: 'run', command: 'gunsmith', values: { weapon: '~scope~MP.*.meta' } }],
    ['d gs meta', { kind: 'run', command: 'gunsmith', values: { weapon: '~scope~MP.*.meta' } }],
    ['d dmz meta', { kind: 'run', command: 'gunsmith dmz', values: { weapon: '~scope~DMZ.*.meta' } }],
    ['d smg', { kind: 'run', command: 'gunsmith', values: { weapon: '~first~SMG' } }], // B6: a bare main class word
    ['d snipers', { kind: 'run', command: 'gunsmith', values: { weapon: '~first~SNIPER' } }],
    ['d secondary', { kind: 'run', command: 'gunsmith', values: { weapon: '~first~SECONDARIES' } }],
    ['d sub', { kind: null }],                       // the short class forms still need gunsmith first
    ['d smg is busted', { kind: null }],
    ['d dmz', { kind: 'run', command: 'gunsmith dmz', values: { weapon: '~first~' } }],
    ['d dmz fennec', { kind: 'run', command: 'gunsmith dmz', autocomplete: [{ option: 'weapon', text: 'fennec' }] }],
    ['dior gunsmith skins are cool', { kind: 'run', autocomplete: [{ option: 'weapon', text: 'skins are cool' }] }],  // silenced by the listener: no confident weapon
    ['d ak117', { kind: null, weaponGuess: 'ak117' }],
    ['dak117', { kind: null, weaponGuess: null }],                     // glued forms must be exact
    [`${M} ak117`, { kind: 'help', weaponGuess: 'ak117' }],
    ['d timestamp tomorrow 8pm', { kind: 'run', command: 'timestamp', values: { datetime: 'tomorrow 8pm' } }],
    ['d time in a minute', { kind: 'run', command: 'timestamp', values: { datetime: 'in a minute' } }],
    ['d ts tom 8pm', { kind: 'run', values: { datetime: 'tom 8pm' } }],         // /timestamp's own shorthand (tom = tomorrow)
    ['d ts tomorrow 8pm tz:est', { kind: 'run', values: { datetime: 'tomorrow 8pm', timezone: 'est' } }],
    ['d ts friday 6pm timezone:toronto', { kind: 'run', values: { datetime: 'friday 6pm', timezone: 'toronto' } }],
    ['d t friday 6pm', { kind: null }],              // B6: `t` is no longer timestamp's
    ['d ts fri 6pm tokyo', { kind: 'run', values: { datetime: 'fri 6pm', timezone: 'Asia/Tokyo' } }], // B6: a zone named at the end
    ['d ts 8pm new york', { kind: 'run', values: { datetime: '8pm', timezone: 'America/Toronto' } }],
    ['d ts 8pm tz:utc+5', { kind: 'run', values: { datetime: '8pm utc+5' } }], // B6: an offset joins the date text
    ['d ts sat 5pm', { kind: 'run', values: { datetime: 'sat 5pm' } }],    // `sat` stays a day, never a zone
    ['d ts 8pm to 10pm', { kind: 'run', values: { datetime: '8pm to 10pm' } }],
    ['d calc new', { kind: 'run', command: 'draw calculator', values: { page: 'new' } }], // B6: New Calculation
    ['d calc reset', { kind: 'run', command: 'draw calculator', values: { page: 'new' } }],
    ['d calc home', { kind: 'run', command: 'draw calculator', values: { page: 'start' } }],
    ['d price leggy', { kind: 'run', command: 'draw prices', values: { filter: 'legendaryGunReactive,legendaryGunNonReactive' } }], // B6: his new aliases
    ['d price leggy char', { kind: 'run', command: 'draw prices', values: { filter: 'legendaryCharacterWeapon' } }],
    ['d price double leggy', { kind: 'run', command: 'draw prices', values: { filter: 'doubleLegendaryWeapons' } }],
    ['d price adv wep', { kind: 'run', command: 'draw prices', values: { filter: 'advancedWeapon' } }],
    ['d draw', { kind: 'run', command: 'draws' }],
    ['d timestamp is wrong lol', { kind: null }],
    [`${M} timestamp is wrong lol`, { kind: 'noMatch', command: 'timestamp', text: 'is wrong lol' }],
    ['d timestamp', { kind: 'needsInput', command: 'timestamp', missing: ['datetime'] }],
    ['d timestamp', { kind: 'run', command: 'timestamp', form: 'convertTimes', values: {} }, { isReply: true }],
    ['d convert', { kind: 'run', form: 'convertTimes' }, { isReply: true }],
    ['d timestamp tomorrow 8pm', { kind: 'run', form: null, values: { datetime: 'tomorrow 8pm' } }, { isReply: true }],
    ['d prices 20cp', { kind: 'run', command: 'draw prices', values: { region: 'region_20' } }],
    ['d prices 20 cp', { kind: 'run', values: { region: 'region_20' } }],
    ['d prices legendary', { kind: 'run', values: { filter: LEG } }],
    ['d prices armory', { kind: 'run', values: { filter: ARM } }],
    ['d prices series armory', { kind: 'run', values: { filter: ARM } }],
    ['d prices legendary character', { kind: 'run', values: { filter: 'legendaryCharacterWeapon' } }],
    ['d prices mythic 30', { kind: 'run', values: { filter: 'mythicWeapon,mythicCharacter', region: 'region_30' } }],
    ['d prices type:mw', { kind: 'run', values: { filter: 'mythicWeapon' } }],
    ['d prices non reactive', { kind: 'run', values: { filter: LEG } }],
    ['d pn latest', { kind: 'run', command: 'patch notes', values: {}, autocomplete: [{ option: 'season', text: '', first: true }] }],
    ['d pn s8', { kind: 'run', autocomplete: [{ option: 'season', text: 'season 8' }] }],
    ['d patch notes season 8', { kind: 'run', autocomplete: [{ option: 'season', text: 'season 8' }] }],
    ['d update 8', { kind: 'run', autocomplete: [{ option: 'season', text: 'season 8' }] }],
    ['d pn terminated', { kind: 'run', autocomplete: [{ option: 'season', text: 'terminated' }] }],
    ['d calc saved', { kind: 'run', command: 'draw calculator', values: { page: 'saved' } }],
    ['d dc help', { kind: 'run', values: { page: 'help' } }],
    ['d help gs', { kind: 'run', command: 'help', values: { cmd: '/gunsmith mp' } }],
    ['d help patch notes', { kind: 'run', values: { cmd: '/patch notes' } }],
    ['d help cmd:cal', { kind: 'run', values: { cmd: '/calendar' } }],
    ['d colors <@555>', { kind: 'run', command: 'colors', form: 'viewColors', values: { someone: '555' } }],
    ['d colors', { kind: 'run', command: 'colors', form: 'viewColors' }, { isReply: true }],
    ['d colors', { kind: 'run', command: 'colors', form: null }],
    ['d remind', { kind: 'run', command: 'remind' }],
    ['d today is cold', { kind: null }],
    ['d cal upcoming', { kind: 'run', command: 'calendar', values: { filter: 'soon' } }],
    ['d lucky draws', { kind: 'run', command: 'draws' }],
    ['d rank end', { kind: 'run', command: 'season end' }],
];

let failed = 0;
for (const [msg, want, extra] of rows) {
    const got = v(msg, extra);
    const bad = Object.entries(want).filter(([k, val]) => {
        try { assert.deepStrictEqual(got[k] ?? null, val ?? null); return false; } catch { return true; }
    });
    if (bad.length) { failed++; console.log(`✗ ${JSON.stringify(msg)}${extra ? ' ' + JSON.stringify(extra) : ''} -> ${JSON.stringify(got)}\n    want ${JSON.stringify(want)}`); }
}

// Every command word, singular and plural, runs its command; every value alias fills its value.
let aliasChecks = 0;
for (const c of TEXT_COMMANDS) {
    const forms = w => { const parts = w.split(' '); const p = pluralOf(parts[parts.length - 1]); return p ? [w, [...parts.slice(0, -1), p].join(' ')] : [w]; };
    for (const w of c.words) for (const f of forms(w)) {
        aliasChecks++;
        const got = v(`d ${f}`);
        if (got.command !== c.name) { failed++; console.log(`✗ command word "d ${f}" -> ${JSON.stringify(got)} (want ${c.name})`); }
    }
    for (const o of c.options || []) for (const val of o.values || []) for (const a of val.aliases) for (const f of forms(a)) {
        aliasChecks++;
        const got = v(`d ${c.words[0]} ${f}`);
        const ok = val.value === LATEST
            ? got.autocomplete?.[0]?.first === true
            : got.values?.[o.name] === [].concat(val.value).join(',');
        if (!ok) { failed++; console.log(`✗ value "d ${c.words[0]} ${f}" -> ${JSON.stringify(got)} (want ${o.name}=${[].concat(val.value).join(',')})`); }
    }
}

// No alias in two places, and the check can fail: plant a clash of each kind.
assert.deepStrictEqual(aliasClashes(), [], 'the real list has no clash');
const planted = TEXT_COMMANDS.map(c => ({ ...c, words: c.name === 'today' ? [...c.words, 'cal'] : c.words }));
assert.ok(aliasClashes(planted).some(l => l.includes('"cal"')), 'a word on two commands is caught');
const pluralClash = TEXT_COMMANDS.map(c => ({ ...c, words: c.name === 'invite' ? [...c.words, 'sets'] : c.words }));
assert.ok(aliasClashes(pluralClash).some(l => l.includes('"sets"')), 'a plural of another command\'s word is caught');
const valueClash = TEXT_COMMANDS.map(c => (c.name !== 'draws' ? c : { ...c, options: [{ ...c.options[0], values: [c.options[0].values[0], { ...c.options[0].values[1], aliases: [...c.options[0].values[1].aliases, 'n'] }] }] }));
assert.ok(aliasClashes(valueClash).some(l => l.includes('draws value "n"')), 'a value alias on two values is caught');

// Every value is a choice the slash command really has (help's are the names /help itself lists).
const modules = { draws: 'draws', calendar: 'calendar', draw: 'drawprices' };
for (const c of TEXT_COMMANDS) for (const o of c.options || []) {
    if (!o.values || o.values.every(val => val.value === LATEST)) continue;
    let choices;
    if (c.name === 'help') choices = require('../commands/help').searchEntries({}).map(e => e.name).concat('/help');
    else {
        const json = require(`../commands/${modules[c.slash]}`).data.toJSON();
        const node = c.sub ? json.options.find(x => x.name === c.sub).options : json.options;
        choices = node.find(x => x.name === o.name).choices.map(x => x.value);
    }
    for (const val of o.values) for (const one of [].concat(val.value)) {
        if (!choices.includes(one)) { failed++; console.log(`✗ ${c.name} ${o.name}: "${one}" is not a choice of the slash command`); }
    }
}

if (failed) { console.error(`${failed} failed`); process.exit(1); }
console.log(`textCommandArgs: ${rows.length} rows, ${aliasChecks} alias checks, 3 planted clashes caught, every value a real choice`);
