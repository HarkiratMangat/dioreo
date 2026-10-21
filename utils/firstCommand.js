// utils/firstCommand.js -- records when a user first ran a command of their own (added 2026-10-20 17:53 EDT, Harkirat: "start tracking that"). Called by handlers/router.js AFTER a slash or right-click command has run, never for buttons, selects or modals, so using someone else's panel never counts. After, not before: a first-time user's command may itself create their UserPreference with find-then-save, and an upsert racing that save would make the save fail with a duplicate key. $min makes the write idempotent and order-proof: it sets the field when missing and otherwise keeps the earlier date, so a backfill run before or after this cannot move anyone's date later. The Set skips the database for users already written this process; a restart costs each user one no-op write.
const UserPreference = require('../models/UserPreference');

const recorded = new Set();

async function noteFirstCommand(userId, at = new Date(), model = UserPreference) {
    if (!userId || recorded.has(userId)) return false;
    await model.updateOne({ discordId: userId }, { $min: { firstCommandAt: at } }, { upsert: true });
    recorded.add(userId);
    return true;
}

// Never lets a database hiccup reach the command that already replied.
function noteFirstCommandSafely(userId) {
    noteFirstCommand(userId).catch((error) => console.error('Failed to record firstCommandAt:', error));
}

module.exports = { noteFirstCommand, noteFirstCommandSafely, _recorded: recorded };
