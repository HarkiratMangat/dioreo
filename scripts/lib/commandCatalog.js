/**
 * The command catalog — what the website's /commands page knows about the bot.
 *
 * ⚠️ THIS READS THE REAL COMMAND BUILDERS. Nothing here is transcribed, and that is the whole point: a page that lists commands from a hand-written copy drifts the moment a command changes, and nothing reports it. Every name, option, choice label and required flag below comes from `commands/*.js`'s own `.toJSON()` — the identical bytes Discord itself is given.
 *
 * ⚠️ SAFE TO CALL FROM A SITE BUILD — measured 2026-08-17 20:05 EDT before this module was written, not assumed. Requiring every command module opens ZERO Mongo connections (`mongoose.connect` call count 0, `readyState` 0), leaves no handle that could hang a build, costs ~0.5s, and exits 0 even under a completely empty environment (`env -i`), which is the CI case. The only noise is three CLOUDINARY_URL warnings on stderr from the cache modules' own top-level guards. If that ever stops being true — a module that connects on require, or throws without credentials — this module is the wrong shape and the fallback is a generated, committed catalog with a staleness gate.
 *
 * ORDERING AND ADMIN-GATING COME FROM `/help`'s OWN `CATEGORY_DEFS`, deliberately. The website and the in-Discord directory then cannot disagree about how the bot is organised, and an admin command cannot leak onto a public page by being forgotten here — it is excluded by the same `requires` key that hides it in Discord. `commands/help.js`'s own header records why that array became the one source of truth: a category was half-added exactly once, appearing in the dropdown and silently missing from the directory. Harkirat, on being told: "that's a real gap that will create staleness and needs a proper solution." This module is that solution applied one surface further out.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const COMMANDS_DIR = path.join(ROOT, 'commands');

/** Discord's ApplicationCommandOptionType, for the two values that change SHAPE. */
const TYPE_SUBCOMMAND = 1;
const TYPE_SUBCOMMAND_GROUP = 2;

/**
 * Commands deliberately kept off the public page, each with the reason it is absent. ⚠️ A NAME HERE IS A DECISION ON THE RECORD, not a way to silence the completeness gate below — the gate exists precisely so that "this command is missing" can never be the *default* outcome of forgetting about it. Admin commands do NOT belong here: they are excluded structurally, by `requires`.
 */
const DELIBERATELY_ABSENT = Object.create(null);

/**
 * Where a command goes when `CATEGORY_DEFS` has no opinion.
 *
 * ⚠️ NEITHER `/help` NOR `/invite` APPEARS IN `CATEGORY_DEFS`, AND NEITHER IS A BUG. `/invite`'s absence is a DELIBERATE, FILED decision — `docs/db-deferred-list.md` records Harkirat's own instruction during the `/invite` build ("exclude it from /help for now"), and states outright that `/help cmd:invite` returning the landing page "is therefore correct today, not a bug — do not 'fix' it as an oversight". The open question filed there is placement, and it forks three ways. `/help` omitting itself is simply sensible: you are already standing in it. Both are placed here because the WEBSITE has no equivalent reason to hide either — a page whose whole job is listing commands should list them — while the bot-side decision stays exactly where it was filed.
 */
const EXTRA_PLACEMENT = {
    '/help': 'start',
    '/invite': 'start',
};

/**
 * Groups the page renders, in order. `fromHelp` is the `CATEGORY_DEFS` key this group adopts; a group with none is ours alone (the guides and `/help`). ⚠️ Labels are the page's, not `/help`'s — "Seasonal Info Commands" is right in a Discord panel that has to say what it is, and redundant in a left-hand picker on a page titled Commands.
 */
const GROUPS = [
    { key: 'start', label: 'Start here', fromHelp: null },
    { key: 'gunsmiths', label: 'Gunsmiths', fromHelp: 'gunsmiths' },
    { key: 'draws', label: 'Draws', fromHelp: 'draws' },
    { key: 'seasonal', label: 'Seasonal', fromHelp: 'seasonal' },
    { key: 'utilities', label: 'Utilities', fromHelp: 'utilities' },
    { key: 'preferences', label: 'Preferences', fromHelp: 'preferences' },
];

/** `/gunsmiths search` → `gunsmiths-search`, which is also its anchor. */
const idFor = commandPath => commandPath.replace(/^\//, '').replace(/\s+/g, '-');

/**
 * Every leaf a builder actually registers, as the string a person types. A command with subcommands has no leaf of its own — `/draw` is not usable, `/draw prices` is — so only leaves are returned.
 */
function leavesOf(json) {
    const options = json.options || [];
    const subs = options.filter(o => o.type === TYPE_SUBCOMMAND);
    const groups = options.filter(o => o.type === TYPE_SUBCOMMAND_GROUP);

    if (!subs.length && !groups.length) {
        return [{ path: `/${json.name}`, description: json.description, options }];
    }

    const leaves = subs.map(s => ({
        path: `/${json.name} ${s.name}`,
        description: s.description,
        options: s.options || [],
    }));

    for (const g of groups) {
        for (const s of (g.options || []).filter(o => o.type === TYPE_SUBCOMMAND)) {
            leaves.push({
                path: `/${json.name} ${g.name} ${s.name}`,
                description: s.description,
                options: s.options || [],
            });
        }
    }
    return leaves;
}

/** An option, reduced to what a reader needs and nothing else. */
const normalizeOption = o => ({
    name: o.name,
    description: o.description,
    required: Boolean(o.required),
    autocomplete: Boolean(o.autocomplete),
    // Discord renders the choice's NAME and never its value, so the name is the only half a reader ever sees — putting the value on the page would print a string that appears nowhere in the client.
    choices: (o.choices || []).map(c => c.name),
});

/** Loads every command module and returns its registered leaves. */
function readBuilders(dir = COMMANDS_DIR) {
    const leaves = [];
    for (const file of fs.readdirSync(dir).sort()) {
        if (!file.endsWith('.js')) continue;
        const mod = require(path.join(dir, file));
        // A module with no `data` export is not a registered command — the draw calculator lives in its own file and is registered as a subcommand of `/draw` by `commands/drawprices.js`, so it has none.
        if (!mod || !mod.data || typeof mod.data.toJSON !== 'function') continue;
        for (const leaf of leavesOf(mod.data.toJSON())) {
            leaves.push({ ...leaf, options: leaf.options.map(normalizeOption), file });
        }
    }
    return leaves;
}

/**
 * `CATEGORY_DEFS` reduced to "which command path sits in which category, and is it gated". A category-level `requires` gates every command under it; a command-level one gates that line alone — the same two-level model `commands/help.js` uses, because it IS that model, read from the same array.
 */
function readHelpPlacement(categoryDefs) {
    const placement = new Map();
    for (const category of categoryDefs) {
        // MIRRORS commands/help.js's own dispatch: `requested.detailCommands || visibleCommands(requested, perms)`. #154 gave CATEGORY_DEFS a second, finer list, and wherever it exists help.js treats it as authoritative -- gunsmiths' directory entry says `/gunsmiths` while its detail page documents `search` and `list` separately. Reading only the coarse list would still place both leaves (longest-prefix covers them), but it would compute `gated` from the PARENT: a future detail entry carrying its own `requires` would be hidden in /help and PUBLISHED on the website, silently. Preferring the finer list makes the failure loud instead -- a detail list that omits something the directory names leaves that leaf with no declared prefix, and buildCatalog throws naming it. Deliberately NOT a union of both lists: a union would paper over exactly that inconsistency.
        for (const command of category.detailCommands || category.staticCommands || []) {
            placement.set(command.name, {
                helpKey: category.key,
                gated: Boolean(category.requires || command.requires),
                // Declaration order IS the order /help renders in, and some of it is deliberate rather than incidental -- commands/help.js records that its Bot Admin list is alphabetical on Harkirat's explicit ask. Reading the array but discarding its order would reproduce the content and lose the decision.
                order: placement.size,
            });
        }
    }
    return placement;
}

/**
 * The longest declared prefix that covers a leaf. `CATEGORY_DEFS` names `/gunsmiths`, while the builder registers `/gunsmiths search` and `/gunsmiths list`; both leaves belong to the category that claimed their parent. Longest-prefix rather than exact match is what lets one array entry cover a whole subcommand tree without listing each leaf.
 */
function placementFor(commandPath, placement) {
    let best = null;
    for (const [declared, info] of placement) {
        const covers = commandPath === declared || commandPath.startsWith(declared + ' ');
        if (covers && (!best || declared.length > best.declared.length)) best = { declared, info };
    }
    return best;
}

/**
 * Builds the catalog the page renders.
 *
 * ⚠️ THROWS on a public command with nowhere to go, and that is the feature. The failure this prevents is exactly the one `/help` already has: a command that exists, works, and is invisible on the page that exists to list it. A build that fails names the command; a build that quietly drops it does not.
 */
function buildCatalog({ commandsDir = COMMANDS_DIR, categoryDefs = null } = {}) {
    const defs = categoryDefs || require(path.join(ROOT, 'commands', 'help.js')).CATEGORY_DEFS;
    const placement = readHelpPlacement(defs);
    const helpKeyToGroup = new Map(GROUPS.filter(g => g.fromHelp).map(g => [g.fromHelp, g.key]));

    const groups = new Map(GROUPS.map(g => [g.key, { ...g, commands: [] }]));
    const excluded = [];
    const unplaced = [];

    // EXTRA_PLACEMENT commands sort after everything CATEGORY_DEFS declares, in the order this module lists them -- they are ours to order, since the array that would otherwise decide has no opinion about them.
    const extraKeys = Object.keys(EXTRA_PLACEMENT);
    const extraOrder = commandPath => placement.size + extraKeys.indexOf(commandPath);

    const leafCounter = new Map();
    for (const leaf of readBuilders(commandsDir)) {
        const parent = leaf.path.split(' ')[0];
        const leafIndex = leafCounter.get(parent) || 0;
        leafCounter.set(parent, leafIndex + 1);
        if (leaf.path in DELIBERATELY_ABSENT) {
            excluded.push({ path: leaf.path, reason: DELIBERATELY_ABSENT[leaf.path] });
            continue;
        }

        const found = placementFor(leaf.path, placement);
        if (found && found.info.gated) {
            excluded.push({ path: leaf.path, reason: 'admin-gated in CATEGORY_DEFS' });
            continue;
        }

        const groupKey = found
            ? helpKeyToGroup.get(found.info.helpKey)
            : EXTRA_PLACEMENT[leaf.path];

        if (!groupKey || !groups.has(groupKey)) {
            unplaced.push(leaf.path);
            continue;
        }

        groups.get(groupKey).commands.push({
            path: leaf.path,
            id: idFor(leaf.path),
            description: leaf.description,
            options: leaf.options,
            // Sort keys, dropped before the catalog is returned. `declared` is the command's position in CATEGORY_DEFS; `leaf` is its position within its own builder, which is what keeps `/gunsmiths search` ahead of `/gunsmiths list` -- one CATEGORY_DEFS entry covers both, so the array cannot order them and the builder is the only thing that can.
            _declared: found ? found.info.order : extraOrder(leaf.path),
            _leaf: leafIndex,
        });
    }

    if (unplaced.length) {
        throw new Error(
            `commandCatalog: ${unplaced.length} public command(s) have nowhere to go on the ` +
            `/commands page: ${unplaced.join(', ')}. Every public command must appear, or the ` +
            `page silently lies about what the bot can do. Fix by adding the command to a ` +
            `category in commands/help.js's CATEGORY_DEFS (which also fixes /help), or — if it ` +
            `genuinely does not belong — by naming it in DELIBERATELY_ABSENT with a reason.`
        );
    }

    for (const group of groups.values()) {
        group.commands.sort((a, b) => a._declared - b._declared || a._leaf - b._leaf);
        for (const command of group.commands) { delete command._declared; delete command._leaf; }
    }

    return {
        groups: [...groups.values()],
        excluded,
        commandCount: [...groups.values()].reduce((n, g) => n + g.commands.length, 0),
    };
}

module.exports = { buildCatalog, GROUPS, idFor, leavesOf, placementFor, readHelpPlacement, DELIBERATELY_ABSENT, EXTRA_PLACEMENT };
