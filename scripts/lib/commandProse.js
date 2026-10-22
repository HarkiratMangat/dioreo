/**
 * The prose layer for the website's /commands page.
 *
 * ⚠️ THERE IS NO PER-OPTION PROSE HERE ANY MORE, DELIBERATELY. Every option carries a `description` that the bot REGISTERS WITH DISCORD, and that sentence is what the client shows the reader a second after they leave this page. This file used to carry a second, hand-written sentence per option — so the page printed Discord's description, then this one, then this one again in the free-text branch: three near-identical lines under one option name, which Harkirat correctly called lazy (2026-08-19 16:00 EDT). One authoritative sentence beats three that agree. `scripts/lib/commandsPage.js` reads `option.description` straight from the catalog.
 *
 * ⚠️ EVERY LINE HERE IS WRITTEN TO BE READ BY SOMEONE WHO NEEDS HELP RIGHT NOW. Harkirat, 2026-08-17 19:57 EDT: "people dont want to read essays, they just need to be guided and shown how to do something ... the user is literally only here because *they need help*."
 *
 * ⚠️ AND IT MUST TELL THEM SOMETHING THEY COULD NOT GUESS. A line that restates the command's own name is worse than no line: it costs a read and returns nothing. That is what `facts` is for — the behaviours the bot has that a reader would never assume, like the fact that weapon search matches partial words and updates live as you type.
 *
 * ⚠️ THE GATE RUNS BOTH WAYS (assertProseCoverage). A command with no prose is a hole; a prose entry with no command describes something that no longer exists, which is worse, because it reads as current. Neither is a warning, both fail the build.
 */

/**
 * `purpose` — one sentence, in the reader's words, saying what they GET. Not what the command is called again. `facts` — up to three things the reader could not guess. Behaviours, defaults, limits. Omit rather than pad. `sample` — the value the copy line is rendered with at build time. It must be REAL: someone copying this line should get an answer, not an error. Weapon names are verbatim from the live Loadout collection's own casing. `examples` — tap-to-fill values for a free-text option. Every one must actually parse. `keywords` — the search vocabulary, in the words a CODM player types. Gated by SEARCH_CASES.
 */
const COMMANDS = {
    '/help': {
        purpose: 'Every command you can use, listed inside Discord.',
        facts: ['The `cmd` option jumps straight to one command instead of the whole list.',
                'This is the only command that answers privately unless you say otherwise.'],
        keywords: 'commands directory list menu what can it do capabilities',
    },
    '/invite': {
        purpose: 'Add Dioreo to a server, or to your own account.',
        facts: ['Adding it to your account carries it into every server, DM and group chat you are in — including servers Dioreo has never joined.',
                'Adding it to a server lets everyone there use it without installing anything.'],
        keywords: 'add install link server account guild user install setup',
    },

    '/gunsmith mp': {
        purpose: 'The attachment build for one MP weapon, or every build in a class, the meta, or all of MP.',
        facts: ['Discord searches as you type, and partial words match — "hol" finds Holger 26.',
                'With nothing typed, the top of the list opens a whole set: All META builds, All MP builds, then each class.',
                'The reply comes back in that weapon\'s category colour.'],
        sample: { weapon: 'AK117' },
        keywords: 'loadout loadouts build builds attachment attachments gunsmith class setup weapon gun mp meta category browse',
    },
    '/gunsmith dmz': {
        purpose: 'The attachment build for one DMZ weapon, or the DMZ meta, or all of DMZ.',
        facts: ['With nothing typed, the top of the list opens All META builds and All DMZ builds.',
                'A meta browse has an MP Meta / DMZ Meta switch under it.'],
        sample: { weapon: 'Fennec' },
        keywords: 'loadout loadouts build builds attachment gunsmith dmz meta weapon gun browse',
    },
    // '/dmz' prose removed while /dmz is hidden (2026-10-21 22:42 EDT); restore it with the command (docs/db-deferred-list.md, Queued).

    '/draws': {
        purpose: "What is in this season's lucky draws.",
        facts: ['Split into new draws and returning draws; `page` opens on either.'],
        keywords: 'lucky draw crate spin pull legendary mythic epic what is in',
    },
    '/draw prices': {
        purpose: 'What a draw costs, spin by spin.',
        facts: ['Your region is the price of your first spin on a Mythic or Legendary Weapon draw: 10, 20 or 30 CP.',
                'Every spin costs more than the last, and each draw lists every spin with the running total.'],
        keywords: 'lucky draw cost price cp spin cheapest money currency region',
    },
    '/draw calculator': {
        purpose: 'How much more CP you need, and the cheapest way to buy it.',
        facts: ['It starts from the spins you have already done and what you hold: CP, Mythic Cards and Mythic Coins.',
                'Bundle prices use the currency you set in `/settings`, and you can save up to 25 calculations.'],
        keywords: 'cp credits cost short top up buy budget how much calculator maths lucky draw',
    },

    '/calendar': {
        purpose: "This season's events, draws and playlist rotation, with dates.",
        facts: ['It opens on Draws; `page` jumps to Events or Playlists & Modes instead.',
                '`view` set to Active/Upcoming Only hides events that have already ended.'],
        keywords: 'events schedule playlist rotation dates season what is on when ranked',
    },
    '/patch notes': {
        purpose: 'What got buffed and what got nerfed.',
        facts: ['`season` searches earlier seasons, not just the current one.'],
        keywords: 'balance buff nerf buffed nerfed update changes weapon meta patch season',
    },
    '/season end': {
        purpose: 'How long until the Battle Pass, Ranked Series and DMZ Season end.',
        facts: ['Each one shows its exact date and a live countdown that keeps running after the message is posted.',
                'A date that has not been announced shows as TBD.'],
        keywords: 'countdown ends ending finish reset time left when days',
    },

    '/colors': {
        purpose: 'The colours in your own Discord profile, as hex values.',
        facts: ['Reads your avatar, banner, display name, nameplate and decoration.',
                'Animated avatars, banners, nameplates and decorations are sampled across the whole animation, not one frame.',
                'In a server where you have a server profile it shows that one; `source` picks main or server.'],
        keywords: 'colour colours color hex profile avatar banner nameplate decoration palette pfp accent',
    },
    '/timestamp': {
        purpose: "A time that reads correctly for every person who sees it.",
        facts: ['Plain English works — "tomorrow", "sun 4:30pm", "this saturday 7pm".',
                'Leave `style` blank for all nine formats at once, or the style you saved in `/settings`.',
                'Everyone who reads it sees it in their own timezone, not yours.'],
        examples: { datetime: ['tomorrow', 'sun 4:30pm', '19:30'] },
        sample: { datetime: 'sun 4:30pm' },
        keywords: 'time timezone tz clock schedule utc convert date when post countdown discord timestamp',
    },

    '/settings': {
        purpose: 'Your saved defaults: who sees your replies, plus your timezone, draw-price region, price currency and timestamp style.',
        facts: ['A `visibility` you pick in a command beats the default you saved here.'],
        keywords: 'preferences prefs timezone region defaults change my profile options',
    },
};

/**
 * THE ASK INDEX — the reader's question, in the reader's words.
 *
 * The page's groups come from the bot's own CATEGORY_DEFS, which exist because the BOT is organised that way, not because a player thinks that way: nobody arrives wanting "Utilities", they arrive wanting to know how much CP they are short.
 *
 * ⚠️ THESE ARE NO LONGER A LIST ON THE PAGE (Harkirat, 2026-10-20 16:25 EDT: take away the bottom "what you want to do" section and put a search at the top that takes the reader's issue in their own words). They are now the search's TRAINING PHRASES: each one is weighted into its command's search index, three of them are the "Try" examples under the field, and the placeholder cycles through all of them. ⚠️ ORDER still matters: the first, fourth and eighth are the "Try" examples, roughly most-asked first.
 *
 * ⚠️ Gated against the live catalog in BOTH directions by assertAskCoverage, and each one must rank its own command FIRST through the same ranker the browser runs (assertSearchCoverage). An ask pointing at a retired command is worse than a missing one.
 */
const ASKS = [
    { q: 'How much CP am I short', to: '/draw calculator' },
    { q: 'What a draw costs, spin by spin', to: '/draw prices' },
    { q: "What's in the draws this season", to: '/draws' },
    { q: 'The build for one weapon', to: '/gunsmith mp' },
    { q: 'Builds for a category, or the meta', to: '/gunsmith mp' },
    { q: 'DMZ builds, or the DMZ meta', to: '/gunsmith dmz' },
    // /dmz is hidden until the DMZ info update (Harkirat, 2026-10-21); its ask was { q: 'A DMZ build, straight to a weapon', to: '/dmz' }.
    { q: 'When the season ends', to: '/season end' },
    // ⚠️ Was "What's on this season, and when": every word but "season" is filler, and "season" is /season end's own name, so the ranker sent it there. The gate caught it the day the asks became search phrases.
    { q: "This season's events and dates", to: '/calendar' },
    { q: 'What got buffed or nerfed', to: '/patch notes' },
    { q: 'Post a time that reads right everywhere', to: '/timestamp' },
    { q: 'The colours in my own profile', to: '/colors' },
    { q: 'Change my timezone or region', to: '/settings' },
    { q: 'Everything Dioreo can do, inside Discord', to: '/help' },
    { q: 'Add Dioreo to a server, or to my account', to: '/invite' },
];

/**
 * THE SEARCH ORACLE.
 *
 * Each case is a query a real reader would type and the FULL set of commands that must come back — full, not "at least", because a search that returns everything is as useless as one that returns nothing and only an exact set catches both.
 */
/* ⚠️ EXACT means the list the page SHOWS, after the ranker's weak-tail cut — the same rank() call the browser makes, so the gate and the page cannot disagree. */
const SEARCH_CASES = [
    { q: 'loadout', hit: ['/gunsmith mp', '/gunsmith dmz'] },
    { q: 'attachment', hit: ['/gunsmith mp', '/gunsmith dmz'] },
    { q: 'cp', hit: ['/draw prices', '/draw calculator'] },
    { q: 'timezone', hit: ['/timestamp', '/settings'] },
    { q: 'countdown', hit: ['/season end', '/timestamp'] },
    { q: 'nerf', hit: ['/patch notes'] },
    { q: 'hex', hit: ['/colors'] },
];

/**
 * PLAIN-LANGUAGE QUERIES, and the command that must come FIRST for each. These are the sentences the ASKS do not already spell out, so they test that the ranker generalises rather than only echoing its own training phrases.
 */
const TOP_CASES = [
    { q: 'when does the season end', top: '/season end' },
    { q: 'best ak117 build', top: '/gunsmith mp' },
    { q: 'what got nerfed', top: '/patch notes' },
    { q: 'add the bot to my server', top: '/invite' },
    { q: 'my pfp colours', top: '/colors' },
    { q: 'how many cp do i need', top: '/draw calculator' },
    { q: 'convert a time for my friends', top: '/timestamp' },
    { q: 'fennec dmz', top: '/gunsmith dmz' },
];

/* Queries whose shown list must NOT include a command. Each is a defect that shipped to the preview once. */
const NOT_CASES = [
    { q: 'how much cp am i short', not: '/gunsmith mp' },
];

/**
 * THE RANKER — one function, run by the build's gate in Node AND inlined into the page with Function.prototype.toString, so the two cannot drift. ⚠️ IT MUST STAY SELF-CONTAINED ES5: nothing outside its own body is visible once it is serialised into the page, which is why every helper lives inside it.
 *
 * Matching is per WORD, not a substring of the whole query: "how much CP am I short" has no command containing it as a run, so the old substring filter returned nothing for exactly the kind of sentence the field now invites. Words are lowercased, filler is dropped, and plurals and -ed/-ing are folded so "nerfed" finds "nerf". Each word scores the best weight of any field it matches (a whole word 1, a prefix of three letters or more 0.6), so one strong field beats several weak ones. A weapon name anywhere in the query lifts the commands whose weapon option lists it.
 */
function findTools() {
    var STOP = {};
    ('a an as the i im ive me my mine to of for in on at by is are am was be it its this that what whats which who ' +
     'how when do does did can could should would will and or but with from about any some there their them ' +
     'they we our you your get got give show find want need tell know see please just really much many dioreo bot')
        .split(' ').forEach(function (w) { STOP[w] = 1; });
    var SYN = { colour: 'color', gun: 'weapon', favourite: 'favorite' };
    function stem(w) {
        if (w.length > 4 && /ies$/.test(w)) return w.slice(0, -3) + 'y';
        if (w.length > 5 && /ing$/.test(w)) return w.slice(0, -3);
        if (w.length > 4 && /ed$/.test(w)) return w.slice(0, -2);
        if (w.length > 3 && /s$/.test(w) && !/ss$/.test(w)) return w.slice(0, -1);
        return w;
    }
    function tok(s) {
        var out = [], seen = {};
        String(s).toLowerCase().replace(/['\u2019]/g, '').replace(/[^a-z0-9]+/g, ' ').split(' ').forEach(function (w) {
            if (w.length < 2 || STOP[w]) return;
            w = stem(w); w = SYN[w] || w;
            if (!seen[w]) { seen[w] = 1; out.push(w); }
        });
        return out;
    }
    function rank(q, ix) {
        var words = tok(q), lift = {};
        /* A weapon name is matched against runs of one to three RAW words glued together, so "as val" finds ASVAL and "3 line rifle" finds 3LINERIFLE. ⚠️ Never a substring of the whole squashed query: "how much cp am i short" squashes to a string that happens to contain a weapon key, and lifted the build commands for a CP question. */
        var raw = String(q).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean), runs = [];
        for (var r = 0; r < raw.length; r++) {
            for (var n = 1; n <= 3 && r + n <= raw.length; n++) runs.push(raw.slice(r, r + n).join(''));
        }
        /* A PART of a name ("holg") counts only in a query of one or two words, which is someone typing a weapon. In a sentence it must be the whole name: "short" in "how much cp am i short" is the start of SHORTY. */
        var partial = raw.length <= 2;
        ['MP', 'DMZ'].forEach(function (mode) {
            lift[mode] = (ix.weapons[mode] || []).some(function (k) {
                return runs.some(function (t) { return t === k || (partial && t.length >= 4 && k.indexOf(t) === 0); });
            });
        });
        var out = [];
        ix.cmds.forEach(function (c, i) {
            var s = 0;
            words.forEach(function (t) {
                var best = 0;
                c.f.forEach(function (field) {
                    var w = field[0], list = field[1];
                    for (var j = 0; j < list.length; j++) {
                        var m = list[j] === t ? 1 : (t.length >= 3 && list[j].indexOf(t) === 0 ? 0.6 : 0);
                        if (w * m > best) best = w * m;
                    }
                });
                s += best;
            });
            if (c.w && lift[c.w]) s += 5;
            if (s > 0) out.push({ i: i, s: s });
        });
        out.sort(function (a, b) { return b.s - a.s || a.i - b.i; });
        var top = out.length ? out[0].s : 0;
        return out.filter(function (o) { return o.s >= top * 0.35; }).slice(0, 5);
    }
    return { tok: tok, rank: rank };
}

/**
 * The index the ranker reads: per command, its words in five weighted fields — the name itself 6, its asks 4, its keywords 3, its purpose 2, and everything else (group, facts, options and their choices) 1 — plus the weapon keys per mode. `modeOf(command)` names the weapon list a command's own weapon option searches, or '' for none.
 */
function buildFindIndex(catalog, weapons, modeOf) {
    const { tok } = findTools();
    const cmds = [];
    for (const group of catalog.groups) {
        for (const command of group.commands) {
            const entry = COMMANDS[command.path] || {};
            const asks = ASKS.filter(a => a.to === command.path).map(a => a.q).join(' ');
            const rest = [group.label, (entry.facts || []).join(' '),
                command.options.map(o => o.name + ' ' + o.description + ' ' + o.choices.join(' ')).join(' ')].join(' ');
            cmds.push({
                id: command.id, path: command.path, w: modeOf(command) || '',
                f: [[6, tok(command.path)], [4, tok(asks)], [3, tok(entry.keywords || '')],
                    [2, tok(entry.purpose || '')], [1, tok(rest)]].filter(f => f[1].length),
            });
        }
    }
    const keys = list => (list || []).map(w => String(w.key || w.name).toLowerCase().replace(/[^a-z0-9]/g, '')).filter(Boolean);
    return { cmds, weapons: { MP: keys(weapons.MP), DMZ: keys(weapons.DMZ) } };
}

function assertAskCoverage(catalog) {
    const livePaths = new Set(catalog.groups.flatMap(g => g.commands).map(c => c.path));
    const dead = ASKS.filter(a => !livePaths.has(a.to)).map(a => a.to);
    if (dead.length) {
        throw new Error('commandProse.js: ASKS points at ' + dead.join(', ') + ', which the bot no longer registers.');
    }
    const reached = new Set(ASKS.map(a => a.to));
    const unreachable = [...livePaths].filter(p => !reached.has(p));
    if (unreachable.length) {
        throw new Error('commandProse.js: no ask reaches ' + unreachable.join(', ') +
            '. A command nobody can find by describing what they want is invisible to every reader ' +
            'who does not already know its name.');
    }
}

/**
 * Fails the build when a command has no purpose, when a purpose describes a command that is gone, or when a `facts` line is long enough to be an essay.
 */
function assertProseCoverage(catalog) {
    const live = catalog.groups.flatMap(g => g.commands);
    const livePaths = new Set(live.map(c => c.path));
    const missing = live.filter(c => !(COMMANDS[c.path] || {}).purpose).map(c => c.path);
    if (missing.length) throw new Error('commandProse.js: no purpose written for ' + missing.join(', ') + '.');
    // A command in DELIBERATELY_ABSENT is hidden on the record (/dmz, 2026-10-21), not gone, so its prose is parked rather than orphaned and comes back with it.
    const { DELIBERATELY_ABSENT } = require('./commandCatalog');
    const orphan = Object.keys(COMMANDS).filter(p => !livePaths.has(p) && !(p in DELIBERATELY_ABSENT));
    if (orphan.length) {
        throw new Error('commandProse.js: prose exists for ' + orphan.join(', ') +
            ', which the bot no longer registers. A description of something gone reads as current.');
    }
    const windy = [];
    for (const [path, entry] of Object.entries(COMMANDS)) {
        for (const f of entry.facts || []) if (f.length > 160) windy.push(path + ': ' + f.slice(0, 50) + '…');
        if ((entry.facts || []).length > 3) windy.push(path + ': ' + entry.facts.length + ' facts, max 3');
    }
    if (windy.length) {
        throw new Error('commandProse.js: these are too long or too many to be read at a glance —\n  ' +
            windy.join('\n  ') + '\nA fact a reader skips is worse than one that was never written.');
    }
}

function assertSearchCoverage(catalog, index) {
    const bare = [];
    for (const group of catalog.groups) {
        for (const command of group.commands) {
            const kw = ((COMMANDS[command.path] || {}).keywords || '').trim();
            if (kw.split(/\s+/).filter(Boolean).length < 3) bare.push(command.path);
        }
    }
    if (bare.length) {
        throw new Error('commandProse.js: no search keywords for ' + bare.join(', ') +
            '. A command reachable only by its own name is invisible to every reader who does not ' +
            'already know it, which is the exact failure the search field exists to fix.');
    }
    const { rank } = findTools();
    const shown = q => rank(q, index).map(o => index.cmds[o.i].path);
    const wrong = [];
    for (const { q, hit } of SEARCH_CASES) {
        const got = shown(q).sort();
        const want = hit.slice().sort();
        if (got.join('|') !== want.join('|')) wrong.push(q + ': want [' + want.join(', ') + '] got [' + got.join(', ') + ']');
    }
    for (const { q, not } of NOT_CASES) {
        if (shown(q).includes(not)) wrong.push(JSON.stringify(q) + ': must not show ' + not + ', got [' + shown(q).join(', ') + ']');
    }
    for (const { q, top } of TOP_CASES.concat(ASKS.map(a => ({ q: a.q, top: a.to })))) {
        const got = shown(q);
        if (got[0] !== top) wrong.push(JSON.stringify(q) + ': want ' + top + ' first, got [' + got.join(', ') + ']');
    }
    if (wrong.length) {
        throw new Error('commandProse.js: the search does not answer these the way SEARCH_CASES says it must —\n  ' +
            wrong.join('\n  ') + '\nEither the keywords are wrong or the expectation is; fix whichever is, ' +
            'but do not relax the case into "at least these", which is what makes a search test vacuous.');
    }
}

module.exports = {
    COMMANDS, ASKS, SEARCH_CASES, TOP_CASES, findTools, buildFindIndex,
    assertProseCoverage, assertAskCoverage, assertSearchCoverage,
};
