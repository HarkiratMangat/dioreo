// scripts/textCommandPermissions.test.js -- text commands obey a server's Integrations → Dioreo switches (utils/textCommands/permissions.js; Harkirat, 2026-10-28 17:52 EDT). Each row is an override set Discord can return and the answer it must give. Written 2026-10-28 17:54 EDT.
const assert = require('assert');
const { allowedByOverrides } = require('../utils/textCommands/permissions');

const G = '1000', APP = 'app', CMD = 'cmd', ROLE = 'r1', OTHER = 'r2', USER = 'u1', CH = 'c1', CH2 = 'c2';
const ALL_CH = String(BigInt(G) - 1n);
const base = { appId: APP, commandId: CMD, guildId: G, userId: USER, roleIds: [ROLE], channelId: CH };
const role = (id, permission) => ({ id, type: 1, permission });
const user = (id, permission) => ({ id, type: 2, permission });
const chan = (id, permission) => ({ id, type: 3, permission });
const at = (id, permissions) => ({ id, permissions });

const rows = [
    ['nothing set', [], {}, true],
    ['command off for @everyone', [at(CMD, [role(G, false)])], {}, false],
    ['command off for @everyone, on for his role', [at(CMD, [role(G, false), role(ROLE, true)])], {}, true],
    ['command off for his role', [at(CMD, [role(ROLE, false)])], {}, false],
    ['his role off, another role on (not his)', [at(CMD, [role(ROLE, false), role(OTHER, true)])], {}, false],
    ['one of his roles on beats another off', [at(CMD, [role(ROLE, false), role(OTHER, true)])], { roleIds: [ROLE, OTHER] }, true],
    ['member override beats role', [at(CMD, [role(ROLE, false), user(USER, true)])], {}, true],
    ['command off in this channel', [at(CMD, [chan(CH, false)])], {}, false],
    ['command off in another channel only', [at(CMD, [chan(CH2, false)])], {}, true],
    ['off in all channels, on in this one', [at(CMD, [chan(ALL_CH, false), chan(CH, true)])], {}, true],
    ['off in all channels', [at(CMD, [chan(ALL_CH, false)])], {}, false],
    ['thread inherits its parent channel', [at(CMD, [chan(CH, false)])], { channelId: 'thread1', parentId: CH }, false],
    ['whole app off for @everyone', [at(APP, [role(G, false)])], {}, false],
    ['app off, command on for @everyone', [at(APP, [role(G, false)]), at(CMD, [role(G, true)])], {}, true],
    ['Administrator bypasses', [at(CMD, [role(G, false)])], { isAdministrator: true }, true],
    ['another command off', [at('cmd2', [role(G, false)])], {}, true],
];
let failed = 0;
for (const [name, overrides, extra, want] of rows) {
    const got = allowedByOverrides(overrides, { ...base, ...extra });
    if (got !== want) { failed++; console.log(`✗ ${name}: got ${got}, want ${want}`); }
}
if (failed) { console.error(`${failed} of ${rows.length} failed`); process.exit(1); }
console.log(`textCommandPermissions: ${rows.length} rows passed`);
