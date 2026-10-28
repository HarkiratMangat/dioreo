// utils/textCommands/permissions.js -- a text command obeys the server's own switches for Dioreo's commands: Server Settings → Integrations → Dioreo, per command or for the whole app, by role, member and channel (Harkirat, 2026-10-28 17:52 EDT: "yes, the admin commands should be able to restrict @mention and prefix commands as well").
//
// Discord applies these overrides to slash commands itself. A text command is a plain message, so nothing applies them unless this does. What is deliberately NOT checked is the channel-wide Use Application Commands permission: that is the block text commands exist to get around (decided the same day, his pick). An admin who wants Dioreo out of a channel denies its Send Messages there.
//
// The resolution follows Discord's documented order for command permissions: a member override beats a role override, a role override beats @everyone; a channel override beats "all channels"; a command-level answer beats the app-level one; Administrator bypasses all of it; anything unset is allowed.
const { Routes, PermissionFlagsBits } = require('discord.js');

// One minute, and dropped at once when Discord says the permissions changed (applicationCommandPermissionsUpdate, wired in bot/textCommands.js): a switch an admin just flipped must bite on the next message, not ten minutes later (security review, 2026-10-28 17:55 EDT).
const CACHE_MS = 60 * 1000;
// A failure to read is remembered for a minute too, so a denied member can't make every message cost a REST call.
const FAILURE_MS = 60 * 1000;
const cache = new Map();
// Bumped by every invalidation. A read that started before an update arrived must not be cached over it (security review, 2026-10-28 17:56 EDT): it would hold the pre-update list for a minute.
const generation = new Map();

function invalidateGuildOverrides(guildId) {
    cache.delete(guildId);
    generation.set(guildId, (generation.get(guildId) || 0) + 1);
}

// One level's answer for each dimension: true / false / undefined (nothing set).
function levelAnswer(permissions, { userId, roleIds, channelId, parentId, guildId }) {
    const list = permissions || [];
    let member;
    const user = list.find(p => p.type === 2 && p.id === userId);
    if (user) member = user.permission;
    else {
        const roles = list.filter(p => p.type === 1 && p.id !== guildId && roleIds.includes(p.id));
        if (roles.length) member = roles.some(p => p.permission);
        else {
            const everyone = list.find(p => p.type === 1 && p.id === guildId);
            if (everyone) member = everyone.permission;
        }
    }
    let channel;
    const allChannelsId = String(BigInt(guildId) - 1n);
    const exact = list.find(p => p.type === 3 && (p.id === channelId || (parentId && p.id === parentId)));
    if (exact) channel = exact.permission;
    else {
        const all = list.find(p => p.type === 3 && p.id === allChannelsId);
        if (all) channel = all.permission;
    }
    return { member, channel };
}

// Pure: is this member allowed to run this command here, given the guild's override list? `overrides` is Discord's GuildApplicationCommandPermissions array.
function allowedByOverrides(overrides, { appId, commandId, guildId, userId, roleIds = [], channelId, parentId = null, isAdministrator = false }) {
    if (isAdministrator) return true;
    const ctx = { userId, roleIds, channelId, parentId, guildId };
    const app = levelAnswer((overrides || []).find(o => o.id === appId)?.permissions, ctx);
    const cmd = commandId ? levelAnswer((overrides || []).find(o => o.id === commandId)?.permissions, ctx) : {};
    const member = cmd.member !== undefined ? cmd.member : (app.member !== undefined ? app.member : true);
    const channel = cmd.channel !== undefined ? cmd.channel : (app.channel !== undefined ? app.channel : true);
    return member && channel;
}

async function guildOverrides(client, guildId) {
    const hit = cache.get(guildId);
    if (hit && Date.now() - hit.at < (hit.failed ? FAILURE_MS : CACHE_MS)) {
        if (hit.failed) throw new Error('permissions unreadable (cached failure)');
        return hit.list;
    }
    const appId = client.application?.id || client.user?.id;
    const startedAt = generation.get(guildId) || 0;
    const current = () => (generation.get(guildId) || 0) === startedAt;
    try {
        const list = await client.rest.get(Routes.guildApplicationCommandsPermissions(appId, guildId));
        if (current()) cache.set(guildId, { at: Date.now(), list });
        return list;
    } catch (err) {
        if (current()) cache.set(guildId, { at: Date.now(), failed: true });
        throw err;
    }
}

// For a text command's run or a button that runs one. Fails CLOSED (security review, 2026-10-28 17:55 EDT): if Discord can't be asked, or the server has overrides but this command's id or the member is unknown, the text command stays silent rather than risk running something an admin switched off. A server with no overrides at all is the common case and costs one cached read a minute.
async function textCommandAllowed({ client, guildId, member, userId, channel, channelId }, slashName) {
    if (!guildId) return true;
    try {
        const overrides = await guildOverrides(client, guildId);
        if (!overrides?.length) return true;
        // Captured every boot by bot/registry.js from the registration response (the dev and prod apps have different ids).
        const commandId = client.commandIds?.get?.(slashName) ?? null;
        if (!commandId || !member) return false;
        const roleIds = member?.roles?.cache ? [...member.roles.cache.keys()] : (Array.isArray(member?.roles) ? member.roles : []);
        const isAdministrator = Boolean(member?.permissions?.has?.(PermissionFlagsBits.Administrator));
        return allowedByOverrides(overrides, {
            appId: client.application?.id || client.user?.id, commandId, guildId, userId, roleIds,
            channelId: channel?.id || channelId, parentId: channel?.isThread?.() ? channel.parentId : null, isAdministrator,
        });
    } catch (err) {
        console.error('Text commands: could not read the server\'s command permissions; staying silent:', err?.message || err);
        return false;
    }
}

module.exports = { allowedByOverrides, textCommandAllowed, invalidateGuildOverrides };
