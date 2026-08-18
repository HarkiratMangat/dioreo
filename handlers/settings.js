// ==========================================
// SETTINGS — INTERACTION HANDLER
// ==========================================
// /settings — its dropdowns, binary toggles and pagination. Lifted out of handlers/router.js on 2026-08-13 17:45 EDT (docs/ROADMAP.md's index.js split). The branch bodies are VERBATIM -- only their address changed.
//
// Ownership is decided by custom_id prefix, once, before any branch runs: `set_`, `toggle_`. Those prefixes are matched by no other subsystem (checked mechanically at extraction time), so deciding ownership up front cannot change which handler wins, and every branch below keeps the exact `return` it was written with.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S, NOT THIS FILE'S. handleSettingsInteraction is awaited from inside handlers/router.js's single top-level try/catch -- do not add one here, do not register listeners, and keep every error-branch reply an AWAITED call in its own small try/catch. A bare `return interaction.reply(...)` can reject after the try has exited and escape the net. See .claude/rules/interaction-router.md.

const { buildSyntheticInteraction, resolvePanelActor } = require('../utils/interactionContext');
const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const OWNED_PREFIXES = ["set_", "toggle_", "settingstz_", "settingscur_"];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

async function route(interaction) {
        // SETTINGS MENU DROPDOWNS (Timezone & Timestamp Formats only) ⚠️ `isStringSelectMenu()` IS LOAD-BEARING, NOT DECORATION. `set_page_` (a BUTTON, handled further down) also starts with `set_`, so without this type test a page-navigation click matches HERE first, defers, and then throws on `interaction.values[0]` -- buttons have no `.values`. Pre-split these two lived in separate `isStringSelectMenu()`/`isButton()` blocks and the type check did this work structurally; flattening them into one function is what made it necessary here. Found 2026-08-13 18:45 EDT by auditing what the moved comments still asserted, after the split had already been pushed.
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith('set_')) {
            // 3rd pipe segment (2026-07-12) -- which /settings page this dropdown lives on, so re-rendering after a selection lands back on the same page instead of resetting to page 0. Only the dropdowns that live on the Preferences page (region mode/timezone/ style/accent) carry this; defaults to page 0 if absent. (A 4th `|{expiresAt}` segment used to live here for the old reactive 15-min expiry check -- removed 2026-07-18, see utils/passiveExpiry.js; expiry is now enforced passively by disabling the components themselves, not by rejecting a stale click.)
            const [action, targetUserId, pageStr] = interaction.customId.split('|');
            const currentPage = pageStr ? parseInt(pageStr, 10) : 0;
            const selectedValue = interaction.values[0];

            // Timezone "Search for your city..." sentinel (added 2026-08-15 13:14 EDT) -- MUST be checked before deferUpdate() below, since showModal() has to be the interaction's FIRST response. Every other value on this dropdown still defers+updates normally.
            if (action === 'set_timezone' && selectedValue === '__search__') {
                // Builder classes, not raw snake_case API JSON -- matches every other showModal() call in this bot (e.g. commands/manage.js's buildSearchModal). discord.js's high-level showModal() expects a ModalBuilder; sendV2Payload's raw-JSON convention is specific to its own raw REST PATCH path and does not apply here.
                const modal = new ModalBuilder()
                    .setCustomId(`settingstz_search|${targetUserId}|${currentPage}`)
                    .setTitle('Search for your timezone');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('query').setLabel('City, country, or abbreviation')
                            .setStyle(TextInputStyle.Short).setPlaceholder('e.g. "Sydney", "Brazil", "PST"')
                            .setRequired(true).setMaxLength(60)
                    )
                );
                return await interaction.showModal(modal);
            }

            // CP currency "Search for your currency..." sentinel -- same reasoning as timezone's above: showModal() must be the interaction's FIRST response, so this has to be intercepted before deferUpdate() too.
            if (action === 'set_cpcurrency' && selectedValue === '__search__') {
                const modal = new ModalBuilder()
                    .setCustomId(`settingscur_search|${targetUserId}|${currentPage}`)
                    .setTitle('Search for your currency');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('query').setLabel('Country or currency code')
                            .setStyle(TextInputStyle.Short).setPlaceholder('e.g. "Canada", "CAD"')
                            .setRequired(true).setMaxLength(60)
                    )
                );
                return await interaction.showModal(modal);
            }

            await interaction.deferUpdate(); // Extends execution context limits to handle network delays safely

            // SECURITY GATEWAY LOCK: Prevent external users from clicking inside an active configuration trace. Admin-override (2026-07-18) -- resolvePanelActor lets ALLOWED_ADMIN_ID through without being blocked, but still tells us to keep rendering targetUserId's OWN data below (never Harkirat's), via the actingUser it returns. See its own comment for why this can't just be a relaxed identity check.
            const actingUser = await resolvePanelActor(interaction, targetUserId);
            if (!actingUser) {
                // Awaited + wrapped in its own try/catch -- see the matching note above. Reworded 2026-07-18 -- clearer + says what to do instead, per Harkirat's request.
                try {
                    await interaction.followUp({ content: "🔒 **Not your dashboard!** This panel belongs to someone else — run `/settings` yourself to get your own to play with.", ephemeral: true });
                } catch (notifyError) {
                    console.error('Failed to notify user of blocked settings action (interaction likely expired):', notifyError);
                }
                return;
            }

            const UserPreference = require('../models/UserPreference');
            let prefs = await UserPreference.findOne({ discordId: targetUserId });
            if (!prefs) prefs = new UserPreference({ discordId: targetUserId });

            // Parse individual dropdown branches and update corresponding document keys
            if (action === 'set_timezone') prefs.timezone = selectedValue;
            if (action === 'set_style') prefs.timestampStyle = selectedValue;
            if (action === 'set_accent_style') prefs.accentColorStyle = selectedValue;
            // Added 2026-07-12 -- the new 3-option "Draw Prices Region" dropdown (replaces the old binary toggle_region_10/toggle_region_30 buttons, see settings.js).
            if (action === 'set_region_mode') prefs.defaultRegionMode = selectedValue;
            if (action === 'set_cpcurrency') prefs.cpCurrency = selectedValue;

            await prefs.save();

            // ⚠️ THE "Display Name Colors not set up" ONE-TIME NOTICE WAS REMOVED HERE 2026-08-13 00:00 EDT, with the style itself. It fired when a user PICKED that option and had no Nitro name gradient; the option no longer exists in /settings' dropdown, so the branch was unreachable rather than merely unused. `fetchDisplayNameColors` is still exported and still called by commands/settings.js -- but only behind its own `accentColorStyle === 'displayName'` gate, so a retired style costs no REST call on an ordinary render. The notice went; the capability did not.

            // IN-PLACE RE-DRAW REDIRECT: Call the modular command stack directly to redraw updated parameters instantly -- passes the current page through so picking an option on the Preferences page doesn't bounce back to page 0. Renders via actingUser (only swapped to a synthetic interaction when Harkirat is overriding someone else's panel -- the normal same-user case reuses the real interaction unchanged) so the redraw always reflects targetUserId's own data, never the admin's. settings.js's own execute() ends by rescheduling the passive idle-timeout using THIS interaction's fresh token -- no separate call needed here.
            const settingsCommand = interaction.client.commands.get('settings');
            const renderInteraction = actingUser === interaction.user ? interaction : buildSyntheticInteraction(interaction, { user: actingUser });
            return await settingsCommand.execute(renderInteraction, currentPage);
        }

        // SETTINGS BINARY TOGGLE BUTTONS (Public/Private & Region defaults)
        if (interaction.isButton() && interaction.customId.startsWith('toggle_')) {
            // No deferUpdate() -- single-hop UPDATE_MESSAGE (2026-08-06 22:17 EDT, pagination perf hybrid). The old comment here ("Defer to permanently safeguard against API 10062 timeouts") was blanket boilerplate from the 2026-07-06 Components V2 rewrite, not a documented incident specific to this branch -- one Mongo find + one save() is well inside the traced 3s-ACK margin the rest of this design already measured. (A 3rd `|{expiresAt}` segment used to live here for the old reactive 15-min expiry check -- removed 2026-07-18, see utils/passiveExpiry.js.)
            const [actionStr, targetUserId, variantToken] = interaction.customId.split('|');
            // Third segment carries which view this panel is in ('g' global / 's' server), so a page, subpage or refresh click stays where the user was instead of snapping back to global. Absent on any id minted before this shipped, so it degrades to global rather than throwing -- a message left open across the deploy keeps working.
            const variant = variantToken === 's' ? 'server' : 'global';

            // SECURITY GATEWAY WALL: Block rogue server members from attempting to adjust another user's preference canvas Admin-override (2026-07-18) -- see resolvePanelActor's own comment.
            const actingUser = await resolvePanelActor(interaction, targetUserId);
            if (!actingUser) {
                // Awaited + wrapped in its own try/catch -- see the matching note above. Reworded 2026-07-18 -- clearer + says what to do instead, per Harkirat's request.
                try {
                    // reply(), not followUp() (v3-pre-release review, finding #16) -- this branch deliberately never defers/replies before this point (see the "single-hop UPDATE_MESSAGE" comment above), and discord.js's followUp() throws InteractionNotReplied when called on an interaction that has neither. That throw was silently swallowed by the catch below, logging a misleading "(interaction likely expired)" while the real cause was the wrong verb -- the user just saw a bare "This interaction failed" with no explanation.
                    await interaction.reply({ content: "🔒 **Not your dashboard!** This panel belongs to someone else — run `/settings` yourself to get your own to play with.", ephemeral: true });
                } catch (notifyError) {
                    console.error('Failed to notify user of blocked settings action (interaction likely expired):', notifyError);
                }
                return;
            }

            const action = actionStr.replace('toggle_', ''); // Strip prefix to catch clean string maps
            const UserPreference = require('../models/UserPreference');

            let prefs = await UserPreference.findOne({ discordId: targetUserId });
            if (!prefs) prefs = new UserPreference({ discordId: targetUserId });

            // Parse button toggle instructions directly over to matching Atlas database document keys
            if (action === 'loadout_public') prefs.loadoutVisibility = 'public';
            if (action === 'loadout_ephemeral') prefs.loadoutVisibility = 'ephemeral';
            if (action === 'seasonal_public') prefs.seasonalVisibility = 'public';
            if (action === 'seasonal_ephemeral') prefs.seasonalVisibility = 'ephemeral';
            if (action === 'timestamp_public') prefs.timestampVisibility = 'public';
            if (action === 'timestamp_ephemeral') prefs.timestampVisibility = 'ephemeral';
            if (action === 'settings_public') prefs.settingsVisibility = 'public';
            if (action === 'settings_ephemeral') prefs.settingsVisibility = 'ephemeral';
            // Calendar's Active/All Events filter moved here from an in-page /calendar toggle (2026-07-31 14:00 EDT, per Harkirat's explicit request) -- lives on /settings' page 1 (Preferences), so the re-render below needs page 1, not the page-0 default every other toggle here uses.
            if (action === 'calfilter_active') prefs.calendarEventFilter = 'active';
            if (action === 'calfilter_all') prefs.calendarEventFilter = 'all';
            const targetPage = (action === 'calfilter_active' || action === 'calfilter_all') ? 1 : 0;
            // NOTE (removed 2026-07-12): region_10/region_30 toggle actions used to live here as a binary button. Replaced by a 3-option dropdown ("Show Last Viewed Region" / "10 CP" / "30 CP") writing to the new `defaultRegionMode` field instead -- see the `set_region_mode` branch in the generic `set_` dropdown handler above. All 4 of these visibility toggles stay on /settings' page 0 (Visibility), so no page param is needed here.

            await prefs.save(); // Write preferences live to the Atlas cluster

            // LIVE RE-DRAW ROUTE: Call the settings engine module to rewrite the canvas on screen. Renders via actingUser (see the `set_` dropdown handler's matching comment above) so an admin override never swaps in Harkirat's own data. settings.js's own execute() reschedules the passive idle-timeout using THIS interaction's fresh token at the end of its render. ⚠️ ALWAYS synthetic, even when actingUser === interaction.user (fixed 2026-08-06 22:18 EDT while removing this branch's deferUpdate() above) -- settings.js's execute() guards its deferReply() with `if (!interaction.deferred && !interaction.replied)`, which used to be false here only because deferUpdate() had already run at the top of this branch. With that call gone, passing the REAL interaction straight through would let settings.js fire a genuine deferReply() -- type 5, a NEW reply -- instead of staying single-hop. The no-op override keeps this branch on the same single-hop path as set_page_ above.
            const settingsCommand = interaction.client.commands.get('settings');
            const renderInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { }, user: actingUser });
            return await settingsCommand.execute(renderInteraction, targetPage);
        }

        // (The old B.4 CALENDAR EVENT-FILTER TOGGLE handler was removed 2026-07-31 14:00 EDT -- the Active/All Events filter moved to /settings entirely, per Harkirat's explicit request. See the generic `toggle_` handler below for `calfilter_active`/`calfilter_all`.)

        // SETTINGS PAGE NAVIGATION -- /settings paginated into 2 pages (2026-07-12, once the new region dropdown + hex codes + footer line pushed it close to Discord's 40-component cap): page 0 = Visibility toggles, page 1 = Preferences. custom_id is `set_page_{targetPage}`, same Prev/Next pattern as calendar/draws sub-pages -- the banner/profile header section stays identical on both pages (re-rendered each time, not truly "shared" state).
        if (interaction.isButton() && interaction.customId.startsWith('set_page_') && interaction.customId !== 'set_page_indicator') {
            // REVERTED to two-hop 2026-08-07 17:44 EDT (v2.60.0) -- same emoji-blank bug as `calpage_` (handlers/pagination.js) and `price_region_`/`price_subpage_` (handlers/drawprices.js), directly confirmed on THIS handler during that investigation (docs/db-deferred-list.md's "button emoji goes blank after a single-hop re-render" entry) even though it was found mid-investigation rather than part of the original report. Applying the same already-decided fix rather than leaving a confirmed-broken path in place.
            await interaction.deferUpdate();
            // custom_id shape: `set_page_{targetPage}|{userId}` -- this button previously carried NO author-lock at all (a real gap; every other settings component already embedded |userId). Page number lives before the first pipe since the action verb itself encodes it, unlike toggle_/set_ which encode the target in a separate value. (A 3rd `|{expiresAt}` segment used to live here for the old reactive 15-min expiry check -- removed 2026-07-18, see utils/passiveExpiry.js.)
            const [pagePart, targetUserId] = interaction.customId.split('|');
            const targetPage = parseInt(pagePart.replace('set_page_', ''), 10) || 0;

            // Admin-override (2026-07-18) -- see resolvePanelActor's own comment.
            const actingUser = await resolvePanelActor(interaction, targetUserId);
            if (!actingUser) {
                try {
                    await interaction.followUp({ content: "🔒 **Not your dashboard!** This panel belongs to someone else — run `/settings` yourself to get your own to play with.", ephemeral: true });
                } catch (notifyError) {
                    console.error('Failed to notify user of blocked settings action (interaction likely expired):', notifyError);
                }
                return;
            }

            // Renders via actingUser (see the `set_` dropdown handler's matching comment above) -- deferReply is no-op'd on the synthetic interaction since the REAL interaction was already deferred above (two-hop); settingsCommand.execute() must not try to ack it a second time.
            const settingsCommand = interaction.client.commands.get('settings');
            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { }, user: actingUser });
            return await settingsCommand.execute(syntheticInteraction, targetPage);
        }

        // TIMEZONE SEARCH MODAL SUBMIT (added 2026-08-15 13:14 EDT) -- reached from the "Search for your city..." sentinel above. Fuzzy-matches the typed query against utils/timezoneData.js's full expanded list (city names, country names, and abbreviations, not just IANA ids).
        if (interaction.isModalSubmit() && interaction.customId.startsWith('settingstz_search')) {
            const [, targetUserId, pageStr] = interaction.customId.split('|');
            const currentPage = pageStr ? parseInt(pageStr, 10) : 1;

            const actingUser = await resolvePanelActor(interaction, targetUserId);
            if (!actingUser) {
                try {
                    await interaction.reply({ content: "🔒 **Not your dashboard!** Run `/settings` yourself to search your own timezone.", ephemeral: true });
                } catch (notifyError) {
                    console.error('Failed to notify user of blocked timezone search (interaction likely expired):', notifyError);
                }
                return;
            }

            const query = interaction.fields.getTextInputValue('query');
            const { searchTimezones, displayLabel } = require('../utils/timezoneData');
            const matches = searchTimezones(query, 10).map(m => ({ ...m, label: displayLabel(m.tz, m.label) }));

            if (matches.length === 0) {
                return await interaction.reply({ content: `❌ No timezone matched **"${query}"** — try a bigger city near you, a country name, or an abbreviation like \`PST\`.`, ephemeral: true });
            }
            if (matches.length > 1) {
                // Multiple hits -- rather than a second select+pick round-trip (which would need its own message identity to edit back into the real panel), just list the candidates and ask for a more specific search. Keeps this a single, coherent flow.
                return await interaction.reply({
                    content: `🔎 **${matches.length} matches for "${query}"** — search again with just one of these:\n`
                        + matches.map(m => `-# 🔹 \`${m.label}\``).join('\n'),
                    ephemeral: true
                });
            }

            // Exactly one match -- save it and redraw the real /settings panel in place, same save+redraw shape the plain dropdown branch above uses.
            await interaction.deferUpdate();
            const UserPreference = require('../models/UserPreference');
            let prefs = await UserPreference.findOne({ discordId: targetUserId });
            if (!prefs) prefs = new UserPreference({ discordId: targetUserId });
            prefs.timezone = matches[0].tz;
            await prefs.save();

            const settingsCommand = interaction.client.commands.get('settings');
            const renderInteraction = actingUser === interaction.user ? interaction : buildSyntheticInteraction(interaction, { user: actingUser });
            return await settingsCommand.execute(renderInteraction, currentPage);
        }

        if (interaction.isModalSubmit() && interaction.customId.startsWith('settingscur_search')) {
            const [, targetUserId, pageStr] = interaction.customId.split('|');
            const currentPage = pageStr ? parseInt(pageStr, 10) : 1;

            const actingUser = await resolvePanelActor(interaction, targetUserId);
            if (!actingUser) {
                try {
                    await interaction.reply({ content: "🔒 **Not your dashboard!** Run `/settings` yourself to search your own currency.", ephemeral: true });
                } catch (notifyError) {
                    console.error('Failed to notify user of blocked currency search (interaction likely expired):', notifyError);
                }
                return;
            }

            const query = interaction.fields.getTextInputValue('query');
            const { searchCurrencies, currencyLabel } = require('../utils/cpCurrencyData');
            const matches = searchCurrencies(query, 10);

            if (matches.length === 0) {
                return await interaction.reply({ content: `❌ No currency matched **"${query}"** — try a country name or a 3-letter code like \`CAD\`.`, ephemeral: true });
            }
            if (matches.length > 1) {
                return await interaction.reply({
                    content: `🔎 **${matches.length} matches for "${query}"** — search again with just one of these:\n`
                        + matches.map(code => `-# 🔹 \`${currencyLabel(code)}\``).join('\n'),
                    ephemeral: true
                });
            }

            await interaction.deferUpdate();
            const UserPreference = require('../models/UserPreference');
            let prefs = await UserPreference.findOne({ discordId: targetUserId });
            if (!prefs) prefs = new UserPreference({ discordId: targetUserId });
            prefs.cpCurrency = matches[0];
            await prefs.save();

            const settingsCommand = interaction.client.commands.get('settings');
            const renderInteraction = actingUser === interaction.user ? interaction : buildSyntheticInteraction(interaction, { user: actingUser });
            return await settingsCommand.execute(renderInteraction, currentPage);
        }
}

// Returns TRUE when this subsystem owns the interaction (and has now handled it), FALSE otherwise -- the uniform contract every handlers/*.js module follows.
async function handleSettingsInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    await route(interaction);
    return true;
}

module.exports = { handleSettingsInteraction, OWNED_PREFIXES };
