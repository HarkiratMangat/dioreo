// utils/owner.js
//
// The hardcoded ultimate owner, and NOTHING else. This file must never import anything.
//
// ⚠️ WHY IT IS ITS OWN FILE. This constant used to live in commands/manage.js, which meant
// utils/adminAccess.js -- the permission layer every admin surface calls -- transitively pulled in
// 39 files including discord.js, jimp and child_process just to answer "is this the owner". That is
// invisible inside the bot, where all of it is loaded anyway, and fatal for any process that is NOT
// the bot. scripts/ownerModule.test.js asserts the closure stays empty.
const ALLOWED_ADMIN_ID = '1139845545754632283';

const isOwnerId = (id) => id === ALLOWED_ADMIN_ID;

module.exports = { ALLOWED_ADMIN_ID, isOwnerId };
