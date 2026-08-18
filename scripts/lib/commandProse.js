/**
 * The prose layer for the website's /commands page.
 *
 * The catalog (scripts/lib/commandCatalog.js) supplies everything Discord knows:
 * names, options, choices, which are required. What it cannot supply is why a
 * person would want the command, because Discord's own description field is one
 * line written for a picker — "Look up or browse MP weapon loadouts" is correct
 * and tells a reader nothing they could not guess from the name.
 *
 * ⚠️ EVERY LINE HERE IS WRITTEN TO BE READ BY SOMEONE WHO NEEDS HELP RIGHT NOW.
 * Harkirat, 2026-08-17 19:57 EDT: "people dont want to read essays, they just
 * need to be guided and shown how to do something ... the user is literally only
 * here because *they need help*." So: one sentence per command, plain verbs, no
 * feature-selling, and an option blurb short enough to read at a glance. If a
 * line here grows past a sentence it is the wrong line.
 *
 * ⚠️ THE GATE RUNS BOTH WAYS (assertProseCoverage). A command with no prose is a
 * bay with a hole in it; a prose entry with no command is a description of
 * something that no longer exists, which is worse — it reads as current. Neither
 * is a warning, both fail the build.
 */

/**
 * `sample` is the value the Composer opens with, and it must be REAL — a reader
 * copying the line off this page should get an answer, not an error. Weapon
 * names are verbatim from the live Loadout collection's own casing.
 */
const COMMANDS = {
    '/help': {
        purpose: 'The same directory as this page, inside Discord.',
        options: { cmd: 'Jump straight to one command' },
    },
    '/invite': {
        purpose: 'Add Dioreo to a server, or to your own account.',
        options: {},
    },

    '/gunsmiths search': {
        purpose: "Find one MP weapon's loadout.",
        options: {
            weapon: 'Any MP weapon',
            build: 'Pick a build when a weapon has more than one',
        },
        sample: { weapon: 'AK117' },
    },
    '/gunsmiths list': {
        purpose: 'Browse a whole category, the current meta, or every build there is.',
        options: { scope: 'Which set to browse' },
    },
    '/dmz': {
        purpose: 'DMZ builds, which are a separate set from the MP ones.',
        options: {
            weapon: 'Any DMZ weapon',
            build: 'Pick a build when a weapon has more than one',
        },
        sample: { weapon: 'OUTLAW' },
    },

    '/draws': {
        purpose: 'What is in the lucky draws this season.',
        options: { page: 'Open on one of the two lists' },
    },
    '/draw prices': {
        purpose: 'What a draw costs, spin by spin.',
        options: { region: "Your region's pricing" },
    },
    '/draw calculator': {
        purpose: "Work out the cheapest way to buy the CP you are short.",
        options: {},
    },

    '/calendar': {
        purpose: "This season's events, draws and playlist rotation, with dates.",
        options: {
            page: 'Open on one section',
            view: 'Everything, or only what is still ahead',
        },
    },
    '/patch notes': {
        purpose: 'Weapon balance changes — what was buffed, what was nerfed.',
        options: { season: 'Look up an earlier season' },
    },
    '/season end': {
        purpose: 'A live countdown to the end of the season.',
        options: {},
    },

    '/colors': {
        purpose: 'Pull the colours out of your own Discord profile as hex values.',
        options: {
            page: 'Which part of your profile to read',
            source: 'Your main profile, or your profile for this server',
        },
    },
    '/timestamp': {
        purpose: "Turn a time into one that shows in every reader's own timezone.",
        options: {
            datetime: 'Plain English, or a clock time',
            timezone: 'Yours, if it is not your default',
            style: 'One format, or leave blank for all nine',
            view: 'A styled panel, or plain copyable text',
        },
        // Every one of these parses under chrono-node, which is the parser
        // /timestamp actually feeds them to. An example that did not parse would
        // be the page walking a reader into an error.
        examples: { datetime: ['tomorrow', 'sun 4:30pm', '19:30'] },
        sample: { datetime: 'sun 4:30pm' },
    },

    '/settings': {
        purpose: 'Your saved preferences — timezone, region, and how Dioreo answers you.',
        options: {},
    },
};

/**
 * `visibility` is on almost every command and means the same thing every time,
 * so it is described ONCE rather than repeated fourteen times. Repeating it
 * would train the reader to skip the option list, which is where the answers are.
 */
const SHARED_OPTIONS = {
    visibility: 'Who sees the answer',
};

/**
 * The two things a reader needs that are not a command. Both are a COMPARISON
 * rather than a paragraph — the question in each case is "which of these two am
 * I", and two columns answer that faster than prose can.
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

/** The prose for one option, falling back to the shared description. */
function optionProse(commandPath, optionName) {
    const entry = COMMANDS[commandPath];
    if (entry && entry.options && entry.options[optionName]) return entry.options[optionName];
    return SHARED_OPTIONS[optionName] || null;
}

/**
 * Fails the build when the prose and the bot have drifted apart, in EITHER
 * direction. Called by the page builder before it renders a byte.
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

module.exports = { COMMANDS, SHARED_OPTIONS, GUIDES, optionProse, assertProseCoverage };
