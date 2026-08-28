// scripts/lib/chromePath.cjs — the ONE list of places a Chrome might be, shared by every check that needs a real browser.
//
// ⚠️ It exists for the same reason `portalClassProps.mjs` does: two copies of a list drift, and the drift is silent. `portalContrastRendered.test.js` had the only copy; `portalGeometry.mjs` needs the identical resolution or a machine where one finds Chrome and the other does not produces a green suite beside a "no browser" skip, with nothing saying they disagree.
//
// 🔴 A MISSING BROWSER IS A LOUD SKIP, NEVER A PASS. Both consumers print the candidate list and say plainly that nothing was checked — a browser-backed gate that quietly measures nothing looks exactly like a clean run.
const fs = require('fs');

const CHROME_CANDIDATES = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
].filter(Boolean);

function findChrome() {
    return CHROME_CANDIDATES.find((p) => { try { return fs.statSync(p).isFile(); } catch { return false; } }) || null;
}

module.exports = { CHROME_CANDIDATES, findChrome };
