// ==========================================
// HELP — INTERACTION HANDLER
// ==========================================
// /help's category dropdown. Lifted out of handlers/router.js on 2026-08-13 17:45 EDT (docs/ROADMAP.md's index.js split). The branch bodies are VERBATIM -- only their address changed.
//
// Ownership is decided by custom_id prefix, once, before any branch runs: `help_category`, `help_guide_pick`, and the landing page's `help_announcements`, `help_feedback` and its pop-up's `help_fbsave`. This module serves selects, buttons and a pop-up, so every branch also tests the interaction type (.claude/rules/interaction-router.md). Those prefixes are matched by no other subsystem (checked mechanically at extraction time), so deciding ownership up front cannot change which handler wins, and every branch below keeps the exact `return` it was written with.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S, NOT THIS FILE'S. handleHelpInteraction is awaited from inside handlers/router.js's single top-level try/catch -- do not add one here, do not register listeners, and keep every error-branch reply an AWAITED call in its own small try/catch. A bare `return interaction.reply(...)` can reject after the try has exited and escape the net. See .claude/rules/interaction-router.md.

const { buildSyntheticInteraction } = require('../utils/interactionContext');
const { hasCommandAccess } = require('../utils/adminAccess');

const OWNED_PREFIXES = ["help_category", "help_command", "help_view", "help_guide_pick", "help_announcements", "help_feedback", "help_fbsave"];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

async function route(interaction) {
        // The category dropdown is gone (B6, his "sure", 2026-10-29 17:07 EDT); one on a panel posted before it opens the home page.
        if (interaction.isStringSelectMenu() && interaction.customId === 'help_category') {
            await interaction.deferUpdate();
            const helpCommand = interaction.client.commands.get('help');
            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { } });
            return await helpCommand.execute(syntheticInteraction, { cmd: null, view: null });
        }

        // THE COMMAND SWITCHER (B6): All commands or one command's page, in the view the switcher was drawn for (`help_command~text` on a typed page, plain `help_command` on a slash one, as panels before B6 sent).
        if (interaction.isStringSelectMenu() && (interaction.customId === 'help_command' || interaction.customId === 'help_command~text')) {
            await interaction.deferUpdate();
            const helpCommand = interaction.client.commands.get('help');
            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { } });
            const pick = interaction.values[0];
            return await helpCommand.execute(syntheticInteraction, { cmd: pick === 'landing' ? null : pick, view: interaction.customId.endsWith('~text') ? 'text' : 'slash' });
        }

        // THE VIEW BUTTONS (B6): Slash Command / Text Command on every page that has both, and Draw Prices' Detailed view / Simple view. `help_view~<text|slash|detail>~<page or landing>`.
        if (interaction.isButton() && interaction.customId.startsWith('help_view~')) {
            const [, view, page] = interaction.customId.split('~');
            await interaction.deferUpdate();
            const helpCommand = interaction.client.commands.get('help');
            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { } });
            return await helpCommand.execute(syntheticInteraction, { cmd: page === 'landing' ? null : page, view: view === 'detail' ? 'text' : view, detail: view === 'detail' });
        }

        // ANNOUNCEMENTS under every /help page (2026-10-27 01:23 EDT): every announcement running now, privately, built the way a delivery builds them. Nothing is marked seen, and someone who turned announcements off can still look.
        if (interaction.isButton() && interaction.customId === 'help_announcements') {
            const ann = require('../utils/announcement');
            await interaction.deferReply({ ephemeral: true });
            const components = await ann.buildActiveAnnouncementComponents();
            const { sendV2Payload } = require('../utils/sendV2Payload');
            return await sendV2Payload(interaction, components, { allowedMentions: { parse: [] } });
        }

        // BUGS & SUGGESTIONS: the button opens utils/feedback.js's pop-up, and its save DMs the owner.
        if (interaction.isButton() && interaction.customId === 'help_feedback') {
            return await require('../utils/feedback').openFeedback(interaction);
        }
        if (interaction.isModalSubmit() && interaction.customId === 'help_fbsave') {
            return await require('../utils/feedback').handleFeedbackSave(interaction);
        }

        // B2b. BOT ADMIN'S "jump to a /manage guide" DROPDOWN (item 10, added 2026-08-15 13:11 EDT). Re-checks perms.manage server-side rather than trusting the dropdown having been hidden -- same defense-in-depth every other admin-gated action in this bot uses (the dropdown is only ever RENDERED for someone who already has it, this is the click-time re-check). Opens as its own new ephemeral reply, same pattern /manage's own Guide button uses (utils/manageActions.js's openFormatGuide) -- never edits the /help page underneath it.
        if (interaction.isStringSelectMenu() && interaction.customId === 'help_guide_pick') {
            if (!(await hasCommandAccess(interaction.user.id, 'manage'))) {
                return await interaction.reply({ content: "🔒 You don't have access to `/manage`.", ephemeral: true });
            }
            const { buildGuideContainer } = require('../utils/manageGuides');
            const { sendV2Payload } = require('../utils/sendV2Payload');
            await interaction.deferReply({ ephemeral: true });
            return await sendV2Payload(interaction, buildGuideContainer(interaction.values[0]));
        }
}

// Returns TRUE when this subsystem owns the interaction (and has now handled it), FALSE otherwise -- the uniform contract every handlers/*.js module follows.
async function handleHelpInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    await route(interaction);
    return true;
}

module.exports = { handleHelpInteraction, OWNED_PREFIXES };
