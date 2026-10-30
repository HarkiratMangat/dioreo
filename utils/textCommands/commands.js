// utils/textCommands/commands.js -- which slash commands a text command can run, every way to spell each, and the options its words can fill (text commands, PR 1, 2026-10-28 17:24 EDT; options added by B2, 2026-10-29). `slash` + `sub` name the real command module, so a text command runs exactly the code its slash command runs.
//
// A spelling is an ALIAS, never a typo: utils/textCommands/parse.js forgives typos separately and only within strict limits, so a plural or a short form belongs here rather than being left for the typo rule to catch. Singular and plural always both match (utils/textCommands/args.js sameWord), so a list names one of the two.
//
// THE ALIAS SETS ARE THE DESIGN SPEC'S "Per command" TABLE (docs/superpowers/specs/2026-10-28-text-commands-design.md), after Harkirat's trim of 2026-10-28 21:51 EDT. Change them there first. No alias may belong to two commands, and no value alias to two values of one command: aliasClashes() below says which, and scripts/textCommandArgs.test.js fails on any.
//
// An option is { name, keys?, values?, rest?, multi?, keyOnly?, mention?, required?, example? }:
//   name     the slash option it fills (`visibility` never: a text reply is always public)
//   keys     the words `key:value` accepts for it (default: its name)
//   values   [{ value, aliases }], value being the slash choice value (or, for draw prices' type, a LIST of them)
//   rest     takes every word nothing else claimed: 'datetime' (must parse), 'weapon' (autocomplete, or a class word), 'autocomplete'
//   multi    several values join into one comma list (draw prices' type: `legendary` is two draws)
//   keyOnly  reachable only as `key:value` (timestamp's timezone)
//   mention  takes an @mention (colors' someone)
//
// A command's `icon` is the utils/emojiMap.js key its buttons carry on the listener's own cards (a Did you mean pick shows the command's icon; B6, 2026-10-29 13:52 EDT), the same icon /help gives it.

// The patch notes value `new` / `latest` / `current`: the newest notes posted, even for a season not live yet (spec, "How words map"). bot/textCommands.js asks /patch notes' own autocomplete and takes its first, which is the newest.
const LATEST = '~latest';

// gunsmith's class words: with no weapon named, the first weapon alphabetically that has a build in that class opens (his comment in the spec: "running a bare `d gunsmith` or something would just open the 1st alphabetic gun on the catalogue"). Keys are Loadout.category values.
const CLASS_WORDS = {
    AR: ['ar', 'assault', 'assault rifle'],
    SMG: ['smg', 'sub'],
    LMG: ['lmg'],
    MARKSMAN: ['marksman', 'mr', 'dmr'],
    SNIPER: ['sniper', 'sr'],
    SHOTGUN: ['shotgun', 'sg'],
    SECONDARIES: ['secondary', 'sec', 'pistol'],
};

const ARMORIES = ['armoryMythicWeapon', 'armoryLegendaryWeapon', 'armoryLegendaryCharacter'];

// A number alone, `s8` or `season 8` means that season's notes; /patch notes' autocomplete matches its titles with spaces removed, so `season 8` finds "Season 8 …" and never "Season 18".
const seasonText = text => {
    const m = /^(?:s|season\s*)?(\d{1,2})$/i.exec(text.trim());
    return m ? `season ${m[1]}` : text;
};

const weaponOption = { name: 'weapon', rest: 'weapon', classes: CLASS_WORDS, example: 'ak117' };

// A bare class word runs gunsmith MP on that class's first build (`d smg`; his ask, B6, 2026-10-29 20:07 EDT). Only the seven main words: the short forms (sub, sr, sg, sec, mr, dmr, assault, pistol) turn up in chat, so they still need gunsmith first.
const BARE_CLASS_WORDS = { ar: 'AR', smg: 'SMG', lmg: 'LMG', marksman: 'MARKSMAN', sniper: 'SNIPER', shotgun: 'SHOTGUN', secondary: 'SECONDARIES' };

// What a person says to thank Dioreo (`@Dioreo thanks`): an emoji reply, never a help card (his ask, B6, 2026-10-29).
const THANKS = ['thanks', 'thank you', 'thank u', 'thx', 'ty', 'tysm', 'tyvm'];

const TEXT_COMMANDS = [
    { name: 'today', icon: 'dailyUpdate', slash: 'today', words: ['today', 'td', 'tdy', 'daily'] },
    {
        // `draw` shown on the help page (his ask, 2026-10-29 23:01 EDT); singular and plural always matched anyway.
        name: 'draws', icon: 'newDraws', slash: 'draws', words: ['draws', 'draw', 'd', 'lucky draws', 'ld'],
        options: [{ name: 'page', values: [{ value: 'new', aliases: ['new', 'n', 'all'] }, { value: 'returning', aliases: ['returning', 'return', 'r'] }] }],
    },
    {
        // `d events`, `d modes`, `d playlists`, `d gamemode`, `d gm` open that calendar page (his answer 2), so they are calendar's words with the page already picked.
        name: 'calendar', icon: 'calendar', slash: 'calendar', words: ['calendar', 'cal', 'c', 'schedule', 'sched', 'events', 'ev', 'playlists', 'modes', 'gamemode', 'gm'],
        presets: { events: { page: 'events' }, ev: { page: 'events' }, playlists: { page: 'playlists' }, modes: { page: 'playlists' }, gamemode: { page: 'playlists' }, gm: { page: 'playlists' } },
        options: [
            { name: 'page', values: [{ value: 'draws', aliases: ['draws', 'd'] }, { value: 'events', aliases: ['events', 'ev', 'e'] }, { value: 'playlists', aliases: ['playlists', 'modes', 'pl', 'm', 'gamemode', 'gm'] }] },
            // `new` is Live here (answer 2: `d calendar modes new` = Playlists & Modes, Live Right Now); it never works on its own.
            { name: 'filter', values: [{ value: 'over', aliases: ['past', 'ended', 'end', 'over', 'old'] }, { value: 'live', aliases: ['live', 'l', 'active', 'now', 'current', 'new'] }, { value: 'soon', aliases: ['upcoming', 'u', 'soon', 'next', 'future', 'up', 'pending'] }] },
        ],
    },
    {
        name: 'patch notes', icon: 'patchNotes', slash: 'patch', sub: 'notes', words: ['patch notes', 'patchnotes', 'patch', 'notes', 'pn', 'update'],
        options: [{ name: 'season', values: [{ value: LATEST, aliases: ['new', 'latest', 'current'] }], rest: 'autocomplete', restText: seasonText, example: 'latest' }],
    },
    { name: 'season end', icon: 'bp', slash: 'season', sub: 'end', words: ['season end', 'seasonend', 'season', 'se', 'rank end', 'rankend', 'ranked end', 'rank', 're', 'end'] },
    {
        name: 'draw prices', icon: 'drawPrices', slash: 'draw', sub: 'prices', words: ['draw prices', 'drawprices', 'prices', 'price', 'dp', 'cost', 'cp'],
        options: [
            { name: 'region', values: [{ value: 'region_10', aliases: ['10cp', '10'] }, { value: 'region_20', aliases: ['20cp', '20'] }, { value: 'region_30', aliases: ['30cp', '30'] }] },
            // The slash option is `filter`; the spec calls it type. A word naming a group shows every draw in it (his comments: legendary shows reactive and non-reactive, armory all three; mythic and advanced the same by the lead's call), which commands/drawprices.js opens as one filtered view.
            {
                name: 'filter', keys: ['type', 'filter'], multi: true,
                values: [
                    { value: ['mythicWeapon', 'mythicCharacter'], aliases: ['mythic', 'myth'] },
                    { value: ['mythicWeapon'], aliases: ['mythic weapon', 'mythic gun', 'mythic wep', 'mw'] },
                    { value: ['mythicCharacter'], aliases: ['mythic character', 'mythic char', 'mythic operator', 'mythic op', 'mc'] },
                    // leggy, leggy char, double leggy and adv wep are his (B6, 2026-10-29 17:58 EDT).
                    { value: ['legendaryGunReactive', 'legendaryGunNonReactive'], aliases: ['legendary', 'legend', 'leg', 'leggy', 'legendary weapon', 'legendary gun', 'lw', 'lg', 'reactive', 'non-reactive', 'nonreactive', 'lr', 'lnr'] },
                    { value: ['legendaryCharacterWeapon'], aliases: ['legendary character', 'legendary char', 'leggy char', 'legendary operator', 'lc', 'lcw'] },
                    { value: ['doubleLegendaryWeapons'], aliases: ['double legendary', 'double leggy', 'double', 'dl', 'dlw'] },
                    { value: ['sevenSpinLegendaryWeapon'], aliases: ['7 spins', 'seven spins', '7 spin', '7spin', '7s'] },
                    { value: ['pickYourRewardCard'], aliases: ['pick your reward', 'pick', 'pyr'] },
                    { value: ['doubleEpicCharacters'], aliases: ['double epic', 'epic', 'de', 'dec'] },
                    { value: ARMORIES, aliases: ['armory', 'armoury', 'series armory', 'series', 'sa', 'arm'] },
                    { value: ['advancedWeapon', 'advancedCharacter'], aliases: ['advanced', 'adv'] },
                    { value: ['advancedWeapon'], aliases: ['advanced weapon', 'adv weapon', 'adv wep', 'aw'] },
                    { value: ['advancedCharacter'], aliases: ['advanced character', 'adv char', 'adv operator', 'ac'] },
                ],
            },
        ],
    },
    {
        name: 'draw calculator', icon: 'calculator', slash: 'draw', sub: 'calculator', words: ['draw calculator', 'drawcalculator', 'calculator', 'calc', 'dc', 'calculate'],
        // `new` and `reset` run New Calculation (wipes the current one, restorable from the empty form); `home`, `start` and `begin` open the calculator's home (his calls, B6, 2026-10-29 20:37-20:41 EDT).
        options: [{ name: 'page', values: [{ value: 'new', aliases: ['new', 'reset'] }, { value: 'start', aliases: ['home', 'start', 'begin'] }, { value: 'saved', aliases: ['saved', 'save', 'history', 's'] }, { value: 'help', aliases: ['help', 'guide', 'h'] }] }],
    },
    // A bare weapon name (`d ak117`) runs this one too, but only for an exact weapon name: bot/textCommands.js checks it against /gunsmith mp's own suggestions.
    // `d meta` opens the MP META browse (his ask, B6, 2026-10-29 20:06 EDT); `d gs meta` / `d dmz meta` reach it through args.js.
    { name: 'gunsmith', icon: 'gunsmithSearch', slash: 'gunsmith', sub: 'mp', words: ['gunsmith', 'gs', 'mp', 'build', 'loadout', 'meta', 'gun', 'wep', 'weapon'], presets: { meta: { weapon: '~scope~MP.*.meta' } }, options: [weaponOption] },
    { name: 'gunsmith dmz', icon: 'dmz', slash: 'gunsmith', sub: 'dmz', words: ['dmz', 'dmz gs', 'dmz build', 'dmz loadout', 'gsd'], options: [weaponOption] },
    {
        // Sent as a REPLY with no date, it runs Convert Times on the replied message (his comment: "just `d timestamp` reply to a message"); alone, a one-button card opens the pop-up. No style or view (his trim).
        // `t` removed (his call, B6, 2026-10-29): too common in chat; `ts` stays.
        name: 'timestamp', icon: 'timestamp', slash: 'timestamp', words: ['timestamp', 'time', 'ts', 'convert'], replyForm: 'convertTimes',
        options: [
            { name: 'datetime', keys: ['datetime', 'date'], rest: 'datetime', required: true, example: 'tomorrow 8pm' },
            { name: 'timezone', keys: ['timezone', 'tz'], keyOnly: true },
        ],
    },
    // `d remind` posts the reminders panel in the channel, public like every text reply (his call 2026-10-28 21:56 EDT).
    { name: 'remind', icon: 'remind', slash: 'remind', words: ['remind', 'r', 'reminder', 'remindme', 'rm', 'notify', 'alert'] },
    // `d colors @name`, or `d colors` sent as a reply, shows THAT person's colours through the View Colors right-click's own code.
    { name: 'colors', icon: 'showColors', slash: 'colors', words: ['colors', 'colours', 'col', 'palette', 'accent'], replyForm: 'viewColors', options: [{ name: 'someone', keys: ['someone', 'user'], mention: true, example: '@name' }] },
    { name: 'settings', icon: 'settings', slash: 'settings', words: ['settings', 'set', 'config', 'options', 'opt', 'pref', 'preferences', 's'] },
    { name: 'help', icon: 'info', slash: 'help', words: ['help', 'h', 'commands', 'cmds', 'info', '?', 'guide'] },
    { name: 'invite', icon: 'shareHeart', slash: 'invite', words: ['invite', 'inv', 'add', 'link'] },
];

// The reply forms run a right-click module's own code: Convert Times on the replied message, View Colors on the person (stored by bot/registry.js under `name#type` as well as the name).
const REPLY_FORMS = {
    convertTimes: { module: 'Convert Times', type: 3 },
    viewColors: { module: 'View Colors', type: 2 },
};
// The command module a text command runs, and the name its server permissions and /admin rules are looked up by.
function moduleFor(client, textCommand, form = null) {
    const f = REPLY_FORMS[form];
    if (!f) return { name: textCommand.slash, command: client.commands.get(textCommand.slash) || null };
    return { name: f.module, command: client.commands.get(`${f.module}#${f.type}`) || client.commands.get(f.module) || null };
}

// help's argument is any command name or alias above, passed as the name /help itself lists (`/gunsmith mp`, `/patch notes`).
const helpNameOf = c => (c.name === 'help' ? '/help' : `/${c.slash}${c.sub ? ` ${c.sub}` : ''}`);
TEXT_COMMANDS.find(c => c.name === 'help').options = [{ name: 'cmd', keys: ['command', 'cmd'], values: TEXT_COMMANDS.map(c => ({ value: helpNameOf(c), aliases: c.words })) }];

function findTextCommand(name) {
    return TEXT_COMMANDS.find(c => c.name === name) || null;
}

// Every spelling a word list accepts, plural included, spaces removed: what two aliases must never share.
function spellings(alias) {
    const { pluralOf } = require('./args');
    const parts = alias.toLowerCase().split(/\s+/);
    const plural = pluralOf(parts[parts.length - 1]);
    return [parts.join(''), plural ? [...parts.slice(0, -1), plural].join('') : null].filter(Boolean);
}

// The rule the spec ends its alias section on: no alias may belong to two commands, and no value alias to two values of one command. Returns one line per clash, empty when there are none.
function aliasClashes(commands = TEXT_COMMANDS) {
    const clashes = [];
    const owner = new Map();
    for (const c of commands) for (const w of c.words) for (const s of spellings(w)) {
        const prev = owner.get(s);
        if (prev && prev !== c.name) clashes.push(`command word "${s}": ${prev} and ${c.name}`);
        else owner.set(s, c.name);
    }
    for (const c of commands) {
        const seen = new Map();
        for (const o of c.options || []) for (const v of o.values || []) {
            const id = `${o.name}=${[].concat(v.value).join(',')}`;
            for (const a of v.aliases) for (const s of spellings(a)) {
                const prev = seen.get(s);
                if (prev && prev !== id) clashes.push(`${c.name} value "${s}": ${prev} and ${id}`);
                else seen.set(s, id);
            }
        }
    }
    return clashes;
}

// A custom_id can't carry a space reliably across every client, so a two-word name travels as `patch.notes`.
const toIdPart = name => name.replace(/ /g, '.');
const fromIdPart = part => String(part || '').replace(/\./g, ' ');

module.exports = { TEXT_COMMANDS, findTextCommand, toIdPart, fromIdPart, aliasClashes, moduleFor, REPLY_FORMS, CLASS_WORDS, BARE_CLASS_WORDS, THANKS, LATEST };
