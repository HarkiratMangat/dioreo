// One-off capture tool for scripts/helpBodySnapshot.test.js's fixture (v3-pre-release review finding #49). Run BEFORE refactoring commands/help.js to freeze current output, and again AFTER only if a rendering change is deliberate -- never to "make the test pass".
//   node scripts/fixtures/captureHelpSnapshot.mjs > scripts/fixtures/helpBodySnapshot.json
import helpCommand from '../../commands/help.js';

const fakeClient = { commandIds: new Map() }; // no ids populated -> mentionCommand() falls back to plain `/cmd` text, deterministic either side of the refactor.

const PERM_MATRICES = {
    anonymous: { serverAdmin: false, botAdmin: false, manage: false, bot: false, botAccess: false, autobuild: false },
    serverAdminOnly: { serverAdmin: true, botAdmin: false, manage: false, bot: false, botAccess: false, autobuild: false },
    fullBotAdmin: { serverAdmin: true, botAdmin: true, manage: true, bot: true, botAccess: true, autobuild: true },
    partialBotAdmin: { serverAdmin: false, botAdmin: true, manage: false, bot: true, botAccess: false, autobuild: false }
};

// One entry per page and view this matrix may open (B6, 2026-10-30 00:15 EDT: one page per command, each typed and slash, utils/helpPages.js), keyed `<page or home> <view>`.
const { default: H } = await import('../../utils/helpPages.js');
const snapshot = {};
for (const [permsName, perms] of Object.entries(PERM_MATRICES)) {
    snapshot[permsName] = {};
    // /bot's subcommands are one page with a dropdown; each is captured as its own page, matching the test's pageNames().
    const names = helpCommand.visiblePageNames(perms).flatMap(n => (n === '/bot' ? helpCommand.visibleBotSubs(perms) : [n]));
    const views = [[null, 'text'], [null, 'slash'], ...names.flatMap(n => (H.hasTextView(n) ? [[n, 'text'], [n, 'slash']] : [[n, 'slash']])), ...(names.includes('/draw prices') ? [['/draw prices', 'detail']] : [])];
    for (const [cmd, view] of views) snapshot[permsName][`${cmd || 'home'} ${view}`] = await helpCommand.buildHelpMessage({ perms, client: fakeClient, cmd, view: view === 'detail' ? 'text' : view, detail: view === 'detail' });
}

process.stdout.write(JSON.stringify(snapshot, null, 2) + '\n');
