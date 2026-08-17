// ==========================================
// SHARE — INTERACTION HANDLER
// ==========================================
// the "Show Everyone" button. Lifted out of handlers/router.js on 2026-08-13 17:45 EDT (docs/ROADMAP.md's index.js split). The branch bodies are VERBATIM -- only their address changed.
//
// Ownership is decided by custom_id prefix, once, before any branch runs: `share_public`. Those prefixes are matched by no other subsystem (checked mechanically at extraction time), so deciding ownership up front cannot change which handler wins, and every branch below keeps the exact `return` it was written with.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S, NOT THIS FILE'S. handleShareInteraction is awaited from inside handlers/router.js's single top-level try/catch -- do not add one here, do not register listeners, and keep every error-branch reply an AWAITED call in its own small try/catch. A bare `return interaction.reply(...)` can reject after the try has exited and escape the net. See .claude/rules/interaction-router.md.

// (no shared interaction helpers needed here -- these branches never build a synthetic interaction or resolve a panel owner. See utils/interactionContext.js if that changes.)

const OWNED_PREFIXES = ["share_public"];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

async function route(interaction) {
        // 0. "SHARE PUBLICLY" — attached below any ephemeral response's own components (see
        // utils/shareButton.js). Doesn't touch the original ephemeral message at all — Discord hands us the FULL original message (content/embeds/components) directly in this click's own interaction payload, ephemeral or not, so there's nothing to look up or reconstruct. We just strip the ephemeral flag and the share button itself, then respond to THIS button click with that same content as a public message.
        //
        // NOTE (fixed during review): this used to defer ephemeral, then try to POST a brand new message directly to the channel via `rest.post(Routes.channelMessages(...))` using the bot's own token. That requires the bot to actually hold View Channel/Send Messages permission in that channel -- but this bot is USER-INSTALLED ONLY, never added to any guild as a member with roles/permissions, so that raw channel POST always fails with DiscordAPIError[50001] "Missing Access" in a real server channel (confirmed live). The fix: don't touch the channel directly at all -- just answer the button-click interaction itself with a NON-ephemeral deferReply + rest.patch('@original'), the exact same interaction-response webhook mechanism every other command in this bot already uses successfully in guilds it was never added to. Interaction responses don't need any standing channel permissions, which is the whole reason a user-installed bot can answer slash commands in a server at all -- so routing "Share Publicly" through that same mechanism (instead of a raw bot-token channel message) makes it work everywhere the bot can already respond, no permissions to check or configure.
        if (interaction.customId === 'share_public') {
            // SERVER VISIBILITY POLICY (2026-08-10 15:49 EDT, v3). This button does not edit the ephemeral message -- it posts a brand new, genuinely public one, so under a forced- ephemeral rule it is a one-click bypass. utils/shareButton.js already declines to RENDER it in that case; this re-check is the one that matters, because a panel opened before the admin set the rule still has the button sitting on it.
            if (interaction.dioreoPolicy && interaction.dioreoPolicy.allowShare === false) {
                // Reports the policy block into the interaction's analytics event -- "how often is a server's visibility rule actually biting" is only answerable if the enforcement point says so. The guard itself is unchanged.
                require('../utils/eventStore').markOutcome('blocked_by_policy');
                try {
                    await interaction.reply({
                        content: "🔇 **This server keeps Dioreo's answers private here.** A server admin set that, so this one stays visible only to you.",
                        ephemeral: true,
                    });
                } catch (notifyError) {
                    console.error('Failed to notify user of blocked share (interaction likely expired):', notifyError);
                }
                return;
            }

            const { SHARE_BUTTON_CUSTOM_ID } = require('../utils/shareButton');
            const msg = interaction.message;

            const embeds = (msg.embeds || []).map(e => (typeof e.toJSON === 'function' ? e.toJSON() : e));
            const rawComponents = (msg.components || []).map(c => (typeof c.toJSON === 'function' ? c.toJSON() : c));

            // Drop the share row itself — a message that's already public doesn't need a button offering to make it public. We only ever add it as its OWN dedicated row (never mixed into an existing row), so dropping any row that contains it is safe and precise.
            const components = rawComponents.filter(entry => {
                if (entry.type !== 1) return true;
                return !(entry.components || []).some(c => c.custom_id === SHARE_BUTTON_CUSTOM_ID);
            });

            // Preserve the Components V2 flag (32768) if present, but strip EPHEMERAL (64) — this response IS the public copy now, not a private confirmation about one.
            const flags = (msg.flags?.bitfield || 0) & ~64;

            await interaction.deferReply(); // public — no ephemeral flag
            const { sendV2Payload } = require('../utils/sendV2Payload');
            return sendV2Payload(interaction, components, { content: msg.content || '', embeds, flags });
        }
}

// Returns TRUE when this subsystem owns the interaction (and has now handled it), FALSE otherwise -- the uniform contract every handlers/*.js module follows.
async function handleShareInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    await route(interaction);
    return true;
}

module.exports = { handleShareInteraction, OWNED_PREFIXES };
