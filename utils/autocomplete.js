// utils/autocomplete.js -- every slash-command autocomplete answer the bot gives, lifted out of handlers/router.js's `isAutocomplete()` branch unchanged (text commands B2, 2026-10-29) so a text command can ask the same question: `d gs ak117` resolves its weapon through exactly the list /gunsmith mp would suggest (bot/textCommands.js). The router keeps markHandler, instrumentAutocomplete and the try/catch, and requires this module lazily inside the branch, because handlers/router.js is the hotpatch boundary (.claude/rules/hotpatch.md).
//
// The body below is the router's, moved byte-for-byte apart from its indentation (8 spaces less): `focusedValue`, `commandName` and the search helpers are read here instead of above the router's try. Each route still answers by calling interaction.respond(...), so a caller that wants the list passes an interaction whose respond() captures it.
async function runAutocomplete(interaction) {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    const commandName = interaction.commandName;
    // NOTE (fixed during review): every autocomplete site below used a plain `.includes()` (or an equivalent raw Mongo $regex), which requires the query to appear as a literal, contiguous substring of the stored name -- so typing "dlq" never matched "DL Q33", since the space between "DL" and "Q33" breaks that literal sequence. fuzzyMatch() strips spaces/punctuation from both sides first, so this now matches. Applied consistently across every autocomplete route in the bot, not just one.
    const { fuzzyMatch, findWeaponMatches } = require('../utils/search');

    // NOTE (removed 2026-07-09): /manage used to have its own autocomplete route here, for its search options (draws/loadouts/calendar/patchnotes edit/delete autocomplete). That entire subcommand-group/option structure was replaced by the button+modal panel (see manage.js) -- Edit/Delete now collect their search query through a one-field modal instead of a slash-command autocomplete option, resolved in handlers/manage/shared.js's `mng_search_` modal-submit handler. Nothing on /manage triggers autocomplete anymore.

    // === USER FRONT-END AUTOCOMPLETE (/patch) === Required because we changed the base command name to 'patch' for subcommands
    if (commandName === 'patch') {
        const SeasonalData = require('../models/SeasonalData');
        const { displayTitle } = require('../commands/patchnotes');
        const doc = await SeasonalData.findOne({ docType: 'global' }).lean(); // read-only here
        if (!doc || !doc.patchNotes) return await interaction.respond([]);

        // displayTitle() strips the legacy "Balance Changes for..." prefix AND prefers a manual titleOverride (2026-07-24), same as the main render + history dropdown, so this stays consistent with what's actually shown everywhere else. Newest first (2026-10-19 00:30 EDT): every season is kept now, so the 25 shown should be the recent ones.
        const filtered = doc.patchNotes.slice().reverse()
            .filter(p => fuzzyMatch(focusedValue, displayTitle(p)))
            .slice(0, 25);

        return await interaction.respond(filtered.map(p => ({ name: displayTitle(p), value: p._id.toString() })));
    }

    // /remind's set: option -- the categories pinned first, then this season's entries (utils/reminders.js autocompleteChoices).
    if (commandName === 'remind') return await interaction.client.commands.get('remind').autocomplete(interaction);
    // /timestamp's timezone: option -- every zone the runtime knows (utils/timezoneData.js), 2026-10-24 21:16 EDT.
    if (commandName === 'timestamp') return await interaction.client.commands.get('timestamp').autocomplete(interaction);

    // === ROUTE B2: /help's cmd: option -- suggests every real command from commands/help.js's staticCommands (/gunsmith is one entry, not one per subcommand) ===
    if (commandName === 'help') {
        const { helpChoices, helpPerms } = require('../commands/help');
        // Restricted entries are suggested only to someone who could use them, through the SAME permission set the page itself uses (commands/help.js helpPerms; this branch built its own without `botAccess` until 2026-10-25, hiding /emojis and the owner-only /bot commands from the owner). It also matches alias keywords, look-alikes and typos -- see commands/help.js. Each choice shows the name with a short plain line (utils/helpSearch.js choiceLabel); its value stays the bare name.
        return await interaction.respond(await helpChoices(focusedValue, await helpPerms(interaction)));
    }

    // === ROUTE B3 (stage 3, 2026-08-14 18:05 EDT): /manage's action: option -- scoped by the subcommand it sits on (it was a sibling `content` option until 2026-10-28 12:11 EDT), since Discord cannot scope one option's static choices by another option's live value (the whole reason this is autocomplete, not a `choices()` list -- see the registry's comment in utils/manageActions.js). NOTE (removed 2026-07-09, re-added here for a different reason): /manage's old autocomplete route was for search-by-name (draws/loadouts/ calendar/patchnotes edit/delete), replaced by the one-field search modal and never coming back. This route only ever suggests ACTION IDS off the registry, never touches a collection. ===
    if (commandName === 'manage') {
        const page = require('../commands/manage').sectionOf(interaction);
        // Was a bare `respond([])` -- Discord's autocomplete dropdown just showed nothing with no explanation, which read as "the command is broken" rather than "pick Content first" (real click-test feedback, 2026-08-22). A single non-selectable-in-spirit suggestion is a clearer signal than an empty list; its value can never match a real registry id, so picking it just falls through to resolveAction()'s 'unknown' branch below (commands/manage.js) -- normal page render, no error.
        if (!page) return await interaction.respond([{ name: '⚠️ Pick a Content type first, then Action', value: '__pick_content_first__' }]);
        // Same admin gate execute() itself opens with, checked here too so a non-admin never even sees the action names -- an autocomplete interaction carries no customId, so the router's prefix guard doesn't cover this route the way it covers buttons/selects/modals. Every admin sees every page's actions (the permission restructure, 2026-10-19 19:25 EDT): picking one they lack the tier for gets the same warning the button would.
        const { hasCommandAccess } = require('../utils/adminAccess');
        if (!(await hasCommandAccess(interaction.user.id, 'manage'))) return await interaction.respond([]);
        const { listSlashActions } = require('../utils/manageActions');
        const filtered = listSlashActions(page)
            .filter(a => fuzzyMatch(focusedValue, a.label))
            .slice(0, 25); // Hard Discord API limit -- defensive even though no page is close today
        return await interaction.respond(filtered.map(a => ({ name: a.label, value: a.id })));
    }

    if (interaction.commandName === 'bot' && interaction.options.getSubcommand() === 'hotpatch') {
        const { isOwner } = require('../utils/adminAccess');
        if (!isOwner(interaction.user.id)) return await interaction.respond([]);
        // Offers the CHANGED set, which is the only thing `file` may name -- so the option is self-documenting rather than something to memorise. ⚠️ changedRuntimeFiles(), NOT runHotpatch(): this fires per KEYSTROKE inside Discord's 3s autocomplete budget. One `git diff` is fine; building the require graph reads 128 files and is exactly the kind of event-loop block that produced 10062s here before (commands/settings.js:54).
        const { changedRuntimeFiles } = require('../utils/hotpatch');
        const changed = changedRuntimeFiles();
        const typed = (interaction.options.getFocused() || '').toLowerCase();
        return await interaction.respond(changed.filter(f => f.toLowerCase().includes(typed)).slice(0, 25).map(f => ({ name: f, value: f })));
    }

    // Standard Loadout Dictionary Autocomplete Mapping (/dmz, /gunsmith mp, /gunsmith dmz)
    const Loadout = require('../models/Loadout');
    let queryFilter = {};

    if (commandName === 'dmz') {
        queryFilter.mode = 'DMZ';
    } else if (commandName === 'gunsmith') {
        const sub = interaction.options.getSubcommand();
        if (sub !== 'mp' && sub !== 'dmz') return await interaction.respond([]);
        queryFilter.mode = sub === 'dmz' ? 'DMZ' : 'MP';
    } else {
        return await interaction.respond([]);
    }

    const matchingWeapons = await Loadout.find(queryFilter).select('weaponName weaponKey category isMeta categoryRank isToxic attachments').lean();
    // A weapon whose only builds are "Coming Soon" placeholders is listed like a catalogue weapon with no build ("— Build pending") and is never a featured pick.
    const { isPlaceholderBuild } = require('../utils/loadoutRender');
    const uniqueMap = new Map();
    // One entry per weapon, carrying the best badges among its builds (badges are per build since 2026-10-19), for the featured list below.
    const rankOf = r => ({ best: 1, top3: 3, top5: 5, capable: 6 })[r] ?? 50;
    matchingWeapons.forEach(w => {
        const prev = uniqueMap.get(w.weaponKey);
        const noBuild = isPlaceholderBuild(w);
        uniqueMap.set(w.weaponKey, prev ? { ...prev, noBuild: prev.noBuild && noBuild, isMeta: prev.isMeta || w.isMeta, isToxic: prev.isToxic || w.isToxic, categoryRank: rankOf(w.categoryRank) < rankOf(prev.categoryRank) ? w.categoryRank : prev.categoryRank } : { ...w, noBuild });
    });
    const distinctChoices = Array.from(uniqueMap.values());
    // /gunsmith mp also offers the catalogue's weapons that have no build yet (2026-10-27 23:30 EDT, Harkirat: "the bot should have the weapon, even without a build. it would just say 'no build yet'"). Picking one opens the same No build yet card that typing its name already did; before this the search said "No options match" for them. The value is the weapon's name, which utils/loadoutLookup.js resolves to that card.
    if (commandName === 'gunsmith' && queryFilter.mode === 'MP') {
        const { normKey } = require('../utils/catalogue');
        const CatalogueItem = require('../models/CatalogueItem');
        const known = new Set(distinctChoices.map(w => normKey(w.weaponName)));
        for (const w of await CatalogueItem.find({ kind: 'weapon', dmzOnly: { $ne: true } }).select('name key category').lean()) {
            if (!known.has(w.key || normKey(w.name))) distinctChoices.push({ weaponName: w.name, weaponKey: w.name, category: w.category, noBuild: true });
        }
    }

    // BUG FIX (2026-07-12, found live): this list had no sort at all -- Mongo returns docs in natural/insertion order, so whichever weapon happened to be migrated/added FIRST (LOCUS, from the original builds.xlsx migration) always showed up first regardless of category or alphabetical order. Originally sorted by a hand-confirmed CATEGORY_SORT_ORDER list (AR/SMG/LMG only, pending Harkirat confirming the rest); per his 2026-07-12 follow-up request, dropped that in favor of just sorting category alphabetically too, then weapon name alphabetically within each category. Only affects display order -- doesn't change which weapons match the typed query.
    distinctChoices.sort((a, b) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return a.weaponName.localeCompare(b.weaponName);
    });

    const { displayCategoryLabel } = require('../utils/loadoutRender');

    // /gunsmith mp and dmz open with their browse rows (All META, All MP / All DMZ, then each MP class), then the weapons (Harkirat, 2026-10-19 19:43 EDT). The rows filter with the same fuzzyMatch as the weapons, so typing "ak" leaves only weapons; their budget comes off the 25 first, so a row can never push every weapon out of view.
    if (commandName === 'gunsmith') {
        const { browseRows } = require('../utils/loadoutScopes');
        const mode = queryFilter.mode;
        const cats = mode === 'MP' ? [...new Set(distinctChoices.map(w => w.category))].sort() : [];
        // A row shows when its own words match, or when the query names its class ("assault" shows All AR builds, as findWeaponMatches shows the AR weapons beside it).
        const { resolveCategorySynonyms, isGenericWeaponQuery, typoDistance } = require('../utils/search');
        const synonyms = resolveCategorySynonyms(focusedValue);
        const generic = isGenericWeaponQuery(focusedValue);
        const rows = browseRows(mode, cats, { hasMeta: matchingWeapons.some(w => w.isMeta) })
            .filter(r => !focusedValue || generic || fuzzyMatch(focusedValue, r.label) || synonyms.some(c => r.value === `MP.${c}.std`) || (!synonyms.length && /^(META|MP|DMZ)$/.test(r.label.split(' ')[1]) && typoDistance(focusedValue, r.label.split(' ')[1]) !== Infinity))
            .map(r => ({ name: `▸ ${r.label}`, value: `~scope~${r.value}` }));
        // When the matches outnumber the 25 Discord shows, the last row says so (Harkirat, 2026-10-24 09:45 EDT: "since only 25 items appear, can we better state to a user that can they search the weapon name?"). Picking that row opens the weapon search pop-up (`~search~<mode>`, 2026-10-25 23:12 EDT, his ask; it opened the mode's whole browse on its first weapon until then).
        const matched = findWeaponMatches(focusedValue, distinctChoices);
        const room = 25 - rows.length;
        const more = matched.length > room;
        // Nothing typed: a few of each class's best instead of the alphabet's first class (featuredWeapons, his 2026-10-25 23:25 EDT ask). A weapon with no build yet is never one of the featured picks; it shows when its name is typed.
        const shown = focusedValue ? matched : require('../utils/search').featuredWeapons(matched.filter(w => !w.noBuild), more ? room - 1 : room);
        const weaponRows = shown
            .slice(0, more ? room - 1 : room)
            .map(w => ({ name: (mode === 'MP' ? `[${displayCategoryLabel(w.category)}] ${w.weaponName}` : w.weaponName) + (w.noBuild ? ' — Build pending' : ''), value: w.weaponKey }));
        if (more) weaponRows.push({ name: `▸ Type a name to search all ${matched.length} ${focusedValue ? 'matches' : 'weapons'}`, value: `~search~${mode}` });
        return await interaction.respond([...rows, ...weaponRows]);
    }

    // /dmz: unchanged -- plain weapon names, no category prefix (that's gunsmith-only, and /dmz has no per-category split -- see models/Loadout.js on categoryRank/DMZ). findWeaponMatches (2026-07-18) also expands recognized category synonyms (e.g. "pistol"/"smg"/"assault rifle") so typing a weapon-class term surfaces every weapon in that category, not just weapons whose own name happens to contain that word -- see utils/search.js's own comment for the full reasoning + the synonym list.
    const filteredChoices = findWeaponMatches(focusedValue, distinctChoices)
        .slice(0, 25); // Hard Discord API limit of 25 choices maximum
    return await interaction.respond(filteredChoices.map(w => ({ name: w.weaponName, value: w.weaponKey })));

}

module.exports = { runAutocomplete };
