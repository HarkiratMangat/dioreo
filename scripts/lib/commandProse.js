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
        purpose: 'Every command Dioreo has, listed inside Discord.',
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

    '/gunsmiths search': {
        purpose: 'The attachment build for one MP weapon.',
        facts: ['Discord searches as you type, and partial words match — "hol" finds Holger 26.',
                'A weapon with more than one build opens on the first; `build` jumps to another.',
                'The reply comes back in that weapon\'s category colour.'],
        sample: { weapon: 'AK117' },
        keywords: 'loadout loadouts build builds attachment attachments gunsmith class setup weapon gun mp',
    },
    '/gunsmiths list': {
        purpose: 'Every build in one category, the current meta, or all of them.',
        facts: ['Eleven scopes: the seven weapon categories, all MP builds, the MP and DMZ meta picks, and all of DMZ.',
                'The reply takes the colour of whichever scope you pick.'],
        keywords: 'loadout loadouts build builds attachment gunsmith meta tier best category browse guns mp',
    },
    '/dmz': {
        purpose: 'DMZ builds, which are a separate set from the MP ones.',
        facts: ['DMZ weapons are ranked by combat range rather than by category.',
                'Searching here never returns an MP build, and vice versa.'],
        sample: { weapon: 'OUTLAW' },
        keywords: 'loadout loadouts build builds attachment gunsmith dmz weapon gun class setup',
    },

    '/draws': {
        purpose: "What is in this season's lucky draws.",
        facts: ['Split into new draws and returning draws; `page` opens on either.'],
        keywords: 'lucky draw crate spin pull legendary mythic epic what is in',
    },
    '/draw prices': {
        purpose: 'What a draw costs, spin by spin.',
        facts: ['CP prices differ by region, so pick the one that matches your account.',
                'Every spin in a draw costs more than the last — the table shows each step.'],
        keywords: 'lucky draw cost price cp spin cheapest money currency region',
    },
    '/draw calculator': {
        purpose: 'How much more CP you need, and the cheapest way to buy it.',
        facts: ['Works out the top-up bundles that reach your target with the least waste.'],
        keywords: 'cp credits cost short top up buy budget how much calculator maths lucky draw',
    },

    '/calendar': {
        purpose: "This season's events, draws and playlist rotation, with dates.",
        facts: ['`view` hides anything that has already finished.'],
        keywords: 'events schedule playlist rotation dates season what is on when ranked',
    },
    '/patch notes': {
        purpose: 'What got buffed and what got nerfed.',
        facts: ['`season` searches earlier seasons, not just the current one.'],
        keywords: 'balance buff nerf buffed nerfed update changes weapon meta patch season',
    },
    '/season end': {
        purpose: 'A live countdown to the end of the season.',
        facts: ['The countdown is live — it keeps counting down in the message after it is posted.'],
        keywords: 'countdown ends ending finish reset time left when days',
    },

    '/colors': {
        purpose: 'The colours in your own Discord profile, as hex values.',
        facts: ['Reads your avatar, banner, display name, nameplate and decoration.',
                'Animated avatars and nameplates are sampled from a still frame.',
                '`source` switches between your main profile and your profile for this server.'],
        keywords: 'colour colours color hex profile avatar banner nameplate decoration palette pfp accent',
    },
    '/timestamp': {
        purpose: "A time that reads correctly for every person who sees it.",
        facts: ['Plain English works — "tomorrow", "sun 4:30pm", "in 2 hours".',
                'Leave `style` blank and you get all nine formats at once.',
                'Everyone who reads it sees it in their own timezone, not yours.'],
        examples: { datetime: ['tomorrow', 'sun 4:30pm', '19:30'] },
        sample: { datetime: 'sun 4:30pm' },
        keywords: 'time timezone tz clock schedule utc convert date when post countdown discord timestamp',
    },

    '/settings': {
        purpose: 'Your saved timezone, region, and how Dioreo answers you.',
        facts: ['What you set here becomes the default for every other command.'],
        keywords: 'preferences prefs timezone region defaults change my profile options',
    },
};

/**
 * THE ASK INDEX — the reader's question, in the reader's words.
 *
 * The page's groups come from the bot's own CATEGORY_DEFS, which exist because the BOT is organised that way, not because a player thinks that way: nobody arrives wanting "Utilities", they arrive wanting to know how much CP they are short.
 *
 * ⚠️ ORDER IS THE ORDER THEY APPEAR IN — roughly most-asked first, because the list is read top to bottom by someone scanning for their own question. It is a judgement, not derived.
 *
 * ⚠️ Gated against the live catalog in BOTH directions by assertAskCoverage. An ask pointing at a retired command is worse than a missing one: it renders as a working link to nothing.
 */
const ASKS = [
    { q: 'How much CP am I short', to: '/draw calculator' },
    { q: 'What a draw costs, spin by spin', to: '/draw prices' },
    { q: "What's in the draws this season", to: '/draws' },
    { q: 'The build for one weapon', to: '/gunsmiths search' },
    { q: 'Builds for a category, or the meta', to: '/gunsmiths list' },
    { q: 'The same, but for DMZ', to: '/dmz' },
    { q: 'When the season ends', to: '/season end' },
    { q: "What's on this season, and when", to: '/calendar' },
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
const SEARCH_CASES = [
    { q: 'loadout', hit: ['/gunsmiths search', '/gunsmiths list', '/dmz'] },
    { q: 'attachment', hit: ['/gunsmiths search', '/gunsmiths list', '/dmz'] },
    { q: 'cp', hit: ['/draw prices', '/draw calculator'] },
    { q: 'timezone', hit: ['/timestamp', '/settings'] },
    { q: 'countdown', hit: ['/season end', '/timestamp'] },
    { q: 'nerf', hit: ['/patch notes'] },
    { q: 'hex', hit: ['/colors'] },
];

/** The string the page's search matches against, in one place so the gate tests the same haystack the browser does. */
function searchHaystack(command, groupLabel) {
    const entry = COMMANDS[command.path] || {};
    return [command.path, entry.purpose || '', groupLabel || '', entry.keywords || '',
        (entry.facts || []).join(' '),
        command.options.map(o => o.name + ' ' + o.description + ' ' + o.choices.join(' ')).join(' ')]
        .join(' ').toLowerCase();
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
    const orphan = Object.keys(COMMANDS).filter(p => !livePaths.has(p));
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

function assertSearchCoverage(catalog) {
    const bare = [];
    const byPath = new Map();
    for (const group of catalog.groups) {
        for (const command of group.commands) {
            byPath.set(command.path, { command, group });
            const kw = ((COMMANDS[command.path] || {}).keywords || '').trim();
            if (kw.split(/\s+/).filter(Boolean).length < 3) bare.push(command.path);
        }
    }
    if (bare.length) {
        throw new Error('commandProse.js: no search keywords for ' + bare.join(', ') +
            '. A command reachable only by its own name is invisible to every reader who does not ' +
            'already know it, which is the exact failure the search field exists to fix.');
    }
    const wrong = [];
    for (const { q, hit } of SEARCH_CASES) {
        const got = [...byPath.values()]
            .filter(({ command, group }) => searchHaystack(command, group.label).includes(q.toLowerCase()))
            .map(({ command }) => command.path).sort();
        const want = hit.slice().sort();
        if (got.join('|') !== want.join('|')) wrong.push(q + ': want [' + want.join(', ') + '] got [' + got.join(', ') + ']');
    }
    if (wrong.length) {
        throw new Error('commandProse.js: the search does not answer these the way SEARCH_CASES says it must —\n  ' +
            wrong.join('\n  ') + '\nEither the keywords are wrong or the expectation is; fix whichever is, ' +
            'but do not relax the case into "at least these", which is what makes a search test vacuous.');
    }
}

module.exports = {
    COMMANDS, ASKS, SEARCH_CASES, searchHaystack,
    assertProseCoverage, assertAskCoverage, assertSearchCoverage,
};
