// utils/textCommands/permissions.js -- a text command obeys the server's own switches for Dioreo's commands: Server Settings → Integrations → Dioreo, per command or for the whole app, by role, member and channel (Harkirat, 2026-10-28 17:52 EDT: "yes, the admin commands should be able to restrict @mention and prefix commands as well").
//
// Discord applies these overrides to slash commands itself. A text command is a plain message, so nothing applies them unless this does. What is deliberately NOT checked is the channel-wide Use Application Commands permission: that is the block text commands exist to get around (decided the same day, his pick). An admin who wants Dioreo out of a channel denies its Send Messages there.
//
// The resolution follows Discord's documented order for command permissions: a member override beats a role override, a role override beats @everyone; a channel override beats "all channels"; a command-level answer beats the app-level one; Administrator bypasses all of it; anything unset is allowed.
const { Routes, PermissionFlagsBits } = require('discord.js');

const CACHE_MS = 10 * 60 * 1000;
const cache = new Map();

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
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.list;
    const appId = client.application?.id || client.user?.id;
    const list = await client.rest.get(Routes.guildApplicationCommandsPermissions(appId, guildId));
    cache.set(guildId, { at: Date.now(), list });
    return list;
}

// For a text command's run or a button that runs one. Fails OPEN when Discord can't be asked (the slash command would work in that case too), logging why.
async function textCommandAllowed({ client, guildId, member, userId, channel }, slashName) {
    if (!guildId) return true;
    try {
        const overrides = await guildOverrides(client, guildId);
        if (!overrides?.length) return true;
        // Captured every boot by bot/registry.js from the registration response (the dev and prod apps have different ids).
        const commandId = client.commandIds?.get?.(slashName) ?? null;
        const roleIds = member?.roles?.cache ? [...member.roles.cache.keys()] : (Array.isArray(member?.roles) ? member.roles : []);
        const isAdministrator = Boolean(member?.permissions?.has?.(PermissionFlagsBits.Administrator));
        return allowedByOverrides(overrides, {
            appId: client.application?.id || client.user?.id, commandId, guildId, userId, roleIds,
            channelId: channel?.id, parentId: channel?.isThread?.() ? channel.parentId : null, isAdministrator,
        });
    } catch (err) {
        console.error('Text commands: could not read the server\'s command permissions; allowing:', err?.message || err);
        return true;
    }
}

module.exports = { allowedByOverrides, textCommandAllowed };
