/**
 * The prose layer for the website's /commands page.
 *
 * The catalog (scripts/lib/commandCatalog.js) supplies everything Discord knows: names, options, choices, which are required. What it cannot supply is why a person would want the command, because Discord's own description field is one line written for a picker — "Look up or browse MP weapon loadouts" is correct and tells a reader nothing they could not guess from the name.
 *
 * ⚠️ EVERY LINE HERE IS WRITTEN TO BE READ BY SOMEONE WHO NEEDS HELP RIGHT NOW. Harkirat, 2026-08-17 19:57 EDT: "people dont want to read essays, they just need to be guided and shown how to do something ... the user is literally only here because *they need help*." So: one sentence per command, plain verbs, no feature-selling, and an option blurb short enough to read at a glance. If a line here grows past a sentence it is the wrong line.
 *
 * ⚠️ THE GATE RUNS BOTH WAYS (assertProseCoverage). A command with no prose is a bay with a hole in it; a prose entry with no command is a description of something that no longer exists, which is worse — it reads as current. Neither is a warning, both fail the build.
 */

/**
 * `keywords` is a hand-written search vocabulary, and it exists because matching only what Discord declares is not enough: searching "loadout" matched `/gunsmiths search` alone, while `/gunsmiths list` and `/dmz` — both entirely about loadouts — matched nothing, because neither uses that word in any field the bot registers. Write the words a CODM player would actually type, including the misspellings and the plurals. Gated by SEARCH_CASES below.
 *
 * `sample` is the value the command's copy line is rendered with at build time, and it must be REAL — a reader copying the line off this page should get an answer, not an error. Weapon names are verbatim from the live Loadout collection's own casing.
 */
const COMMANDS = {
    '/help': {
        purpose: 'The same directory as this page, inside Discord.',
        keywords: 'commands directory list menu what can it do capabilities',
        options: { cmd: 'Jump straight to one command' },
    },
    '/invite': {
        purpose: 'Add Dioreo to a server, or to your own account.',
        keywords: 'add install link server account guild user install setup',
        options: {},
    },

    '/gunsmiths search': {
        purpose: "Find one MP weapon's loadout.",
        keywords: 'loadout loadouts build builds attachment attachments gunsmith class setup weapon gun mp',
        options: {
            weapon: 'Any MP weapon',
            build: 'Pick a build when a weapon has more than one',
        },
        sample: { weapon: 'AK117' },
    },
    '/gunsmiths list': {
        purpose: 'Browse a whole category, the current meta, or every build there is.',
        keywords: 'loadout loadouts build builds attachment gunsmith meta tier best category browse guns mp',
        options: { scope: 'Which set to browse' },
    },
    '/dmz': {
        purpose: 'DMZ builds, which are a separate set from the MP ones.',
        keywords: 'loadout loadouts build builds attachment gunsmith dmz weapon gun class setup',
        options: {
            weapon: 'Any DMZ weapon',
            build: 'Pick a build when a weapon has more than one',
        },
        sample: { weapon: 'OUTLAW' },
    },

    '/draws': {
        purpose: 'What is in the lucky draws this season.',
        keywords: 'lucky draw crate spin pull legendary mythic epic what is in',
        options: { page: 'Open on one of the two lists' },
    },
    '/draw prices': {
        purpose: 'What a draw costs, spin by spin.',
        keywords: 'lucky draw cost price cp spin cheapest money currency region',
        options: { region: "Your region's pricing" },
    },
    '/draw calculator': {
        purpose: "Work out the cheapest way to buy the CP you are short.",
        keywords: 'cp credits cost short top up buy budget how much calculator maths lucky draw',
        options: {},
    },

    '/calendar': {
        purpose: "This season's events, draws and playlist rotation, with dates.",
        keywords: 'events schedule playlist rotation dates season what is on when ranked',
        options: {
            page: 'Open on one section',
            view: 'Everything, or only what is still ahead',
        },
    },
    '/patch notes': {
        purpose: 'Weapon balance changes — what was buffed, what was nerfed.',
        keywords: 'balance buff nerf buffed nerfed update changes weapon meta patch season',
        options: { season: 'Look up an earlier season' },
    },
    '/season end': {
        purpose: 'A live countdown to the end of the season.',
        keywords: 'countdown ends ending finish reset time left when days',
        options: {},
    },

    '/colors': {
        purpose: 'Pull the colours out of your own Discord profile as hex values.',
        keywords: 'colour colours color hex profile avatar banner nameplate decoration palette pfp accent',
        options: {
            page: 'Which part of your profile to read',
            source: 'Your main profile, or your profile for this server',
        },
    },
    '/timestamp': {
        purpose: "Turn a time into one that shows in every reader's own timezone.",
        keywords: 'time timezone tz clock schedule utc convert date when post countdown discord timestamp',
        options: {
            datetime: 'Plain English, or a clock time',
            timezone: 'Yours, if it is not your default',
            style: 'One format, or leave blank for all nine',
            view: 'A styled panel, or plain copyable text',
        },
        // Every one of these parses under chrono-node, which is the parser /timestamp actually feeds them to. An example that did not parse would be the page walking a reader into an error.
        examples: { datetime: ['tomorrow', 'sun 4:30pm', '19:30'] },
        sample: { datetime: 'sun 4:30pm' },
    },

    '/settings': {
        purpose: 'Your saved preferences — timezone, region, and how Dioreo answers you.',
        keywords: 'preferences prefs timezone region defaults change my profile options',
        options: {},
    },
};

/**
 * `visibility` is on almost every command and means the same thing every time, so it is described ONCE rather than repeated fourteen times. Repeating it would train the reader to skip the option list, which is where the answers are.
 */
const SHARED_OPTIONS = {
    visibility: 'Who sees the answer',
};

/**
 * The two things a reader needs that are not a command. Both are a COMPARISON rather than a paragraph — the question in each case is "which of these two am I", and two columns answer that faster than prose can.
 */
const GUIDES = [
    {
        id: 'guide-visibility',
        group: 'start',
        title: 'Who sees your answer',
        sub: 'Hidden or Public',
        compare: [
            ['Hidden', 'Only you see the reply.'],
            ['Public', 'Everyone in the channel sees it.'],
        ],
        note: 'Most commands are Public unless you say otherwise. A server admin can require that Dioreo stays hidden in their server.',
    },
    {
        id: 'guide-install',
        group: 'start',
        title: 'Where you can use it',
        sub: 'Your account or a server',
        compare: [
            ['On your account', 'Works in any server, DM or group chat — even where Dioreo is not a member.'],
            ['On a server', 'Everyone there can use it without installing anything.'],
        ],
        note: 'Both work, and you can do both. Adding it to your account is the one that follows you around.',
    },
];

/**
 * THE ASK INDEX — the reader's question, in the reader's words.
 *
 * The page's groups come from the bot's own CATEGORY_DEFS, which exist because the BOT is organised that way, not because a player thinks that way: nobody arrives wanting "Utilities", they arrive wanting to know how much CP they are short. This is the layer that answers that, and it is the resting state of the page's stage.
 *
 * ⚠️ ORDER IS THE ORDER THEY APPEAR IN. It is roughly "most asked first" rather than alphabetical or grouped, because the list is read top to bottom by someone scanning for their own question. It is a judgement, not derived — if it ever needs to be derived, `/bot analytics` knows which commands actually get used.
 *
 * ⚠️ Every entry is gated against the live catalog in BOTH directions by assertAskCoverage below. An ask pointing at a command the bot no longer registers is worse than a missing one: it renders as a working link to a section that is not there.
 */
const ASKS = [
    { q: 'How much CP am I short', to: '/draw calculator' },
    { q: 'What a draw costs, spin by spin', to: '/draw prices' },
    { q: "What's in the draws this season", to: '/draws' },
    { q: 'A build for one weapon', to: '/gunsmiths search' },
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
 * Fails the build when an ask points nowhere, or when a command has no way in from the ask index. The second direction matters as much as the first: a command nobody can reach by describing what they want is invisible to every reader who does not already know its name, which is the exact failure the index exists to fix.
 */
function assertAskCoverage(catalog) {
    const livePaths = new Set(catalog.groups.flatMap(g => g.commands).map(c => c.path));
    const problems = [];
    const seen = new Set();
    for (const ask of ASKS) {
        if (!livePaths.has(ask.to)) problems.push(`the ask "${ask.q}" points at ${ask.to}, which the bot no longer registers.`);
        seen.add(ask.to);
    }
    for (const path of livePaths) {
        if (!seen.has(path)) problems.push(`${path} has no ask — nobody can reach it without already knowing its name.`);
    }
    if (problems.length) {
        throw new Error('commandProse: the ask index and the bot have drifted apart:\n  - ' +
            problems.join('\n  - ') + '\nFix ASKS in scripts/lib/commandProse.js.');
    }
}

/** The prose for one option, falling back to the shared description. */
function optionProse(commandPath, optionName) {
    const entry = COMMANDS[commandPath];
    if (entry && entry.options && entry.options[optionName]) return entry.options[optionName];
    return SHARED_OPTIONS[optionName] || null;
}

/**
 * Fails the build when the prose and the bot have drifted apart, in EITHER direction. Called by the page builder before it renders a byte.
 */
function assertProseCoverage(catalog) {
    const live = catalog.groups.flatMap(g => g.commands);
    const livePaths = new Set(live.map(c => c.path));
    const problems = [];

    for (const command of live) {
        const entry = COMMANDS[command.path];
        if (!entry) {
            problems.push(`${command.path} is on the page with no prose — it would render as a bare name.`);
            continue;
        }
        if (!entry.purpose) problems.push(`${command.path} has an entry but no purpose line.`);
        for (const option of command.options) {
            if (!optionProse(command.path, option.name)) {
                problems.push(`${command.path}'s "${option.name}" option has no description.`);
            }
        }
        for (const described of Object.keys(entry.options || {})) {
            if (!command.options.some(o => o.name === described)) {
                problems.push(`${command.path} describes an option "${described}" that the command no longer has.`);
            }
        }
    }

    for (const path of Object.keys(COMMANDS)) {
        if (!livePaths.has(path)) {
            problems.push(`prose describes ${path}, which the bot no longer registers.`);
        }
    }

    if (problems.length) {
        throw new Error(
            'commandProse: the /commands page and the bot have drifted apart:\n  - ' +
            problems.join('\n  - ') +
            '\nFix scripts/lib/commandProse.js in the same change as the command itself.'
        );
    }
}


/**
 * THE SEARCH ORACLE.
 *
 * Each case is a query a real reader would type and the FULL set of commands that must come back — full, not "at least", because a search that returns everything is as useless as one that returns nothing and only an exact set can catch both. These are the cases the previous page failed silently: it matched name, purpose, option names and choice labels, all of which are true of the bot and none of which contain the word a player uses.
 *
 * ⚠️ Add a case whenever you add a keyword set, and make it one that could FAIL. A query whose expected answer is every command proves nothing.
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

/**
 * The string the page's search actually matches against, in one place so the gate below tests the same haystack the browser does. A test that builds its own haystack tests itself.
 */
function searchHaystack(command, groupLabel) {
    const entry = COMMANDS[command.path] || {};
    return [command.path, entry.purpose || '', groupLabel || '', entry.keywords || '',
        command.options.map(o => o.name + ' ' + o.choices.join(' ')).join(' ')].join(' ').toLowerCase();
}

/**
 * Fails the build when a command has no search vocabulary at all, and when a known query does not resolve to exactly the commands it should.
 */
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

module.exports = { COMMANDS, SHARED_OPTIONS, GUIDES, ASKS, SEARCH_CASES, optionProse, searchHaystack, assertProseCoverage, assertAskCoverage, assertSearchCoverage };
