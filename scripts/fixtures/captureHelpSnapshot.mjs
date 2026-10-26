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

const snapshot = {};
for (const [permsName, perms] of Object.entries(PERM_MATRICES)) {
    snapshot[permsName] = {};
    // Landing page.
    snapshot[permsName].landing = await helpCommand.buildContainer(null, 16743772, perms, fakeClient);
    // Every category this perms matrix can see, plus every category regardless (buildContainer itself falls back to the landing page for a restricted key, and that fallback is worth pinning too).
    for (const cat of helpCommand.CATEGORY_DEFS) {
        snapshot[permsName][cat.key] = await helpCommand.buildContainer(cat.key, 16743772, perms, fakeClient);
    }
}

process.stdout.write(JSON.stringify(snapshot, null, 2) + '\n');
