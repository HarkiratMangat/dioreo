#!/usr/bin/env node
/**
 * Guards against the "emoji frozen at require() time" bug class.
 *
 * `utils/emojiMap.js`'s refreshEmojiIds() re-points every emoji mention at the BOOTING app's own ids, but it runs from handleBotReady -- long after every command module has been require()d. JS strings copy by value, so any module that READS an emoji value during its own require() (a module-level `const`, or an object literal built at load time) keeps the pre-sync PROD id forever. On prod that's invisible; on the dev bot -- a different Discord application -- those emojis render as broken text.
 *
 * This proxies emojiMap and records every string-valued read that happens while each module loads. A clean run reads nothing. Found four real sites on 2026-07-26 16:04 EDT that manual review missed: manage.js's PAGES table (every /manage emoji), drawprices.js's TIER_ICON (pages 1-2), seasonend.js's hardcoded BP_CODM1 literal, and shareButton.js's SHARE_BUTTON_ROW.
 *
 * Usage:  node scripts/checkEmojiCaptures.js     (exit 1 on any capture -- CI-ready)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const mapPath = require.resolve(path.join(ROOT, 'utils/emojiMap.js'));

const real = require(mapPath);
const reads = [];
let recording = false;

// Replacing the cached exports means every subsequent require() of emojiMap gets the proxy.
require.cache[mapPath].exports = new Proxy(real, {
    get(target, prop) {
        if (recording && typeof prop === 'string' && typeof target[prop] === 'string') {
            reads.push(prop);
        }
        return target[prop];
    }
});

// Every module that requires emojiMap, directly or transitively. Commands are globbed so a new one is covered automatically; the utils are listed because only some of them touch emoji.
const files = [
    ...fs.readdirSync(path.join(ROOT, 'commands')).filter(f => f.endsWith('.js'))
        .map(f => path.join(ROOT, 'commands', f)),
    ...['shareButton.js', 'paginationRow.js', 'loadoutRender.js', 'colorPaletteView.js', 'titleBlock.js']
        .map(f => path.join(ROOT, 'utils', f)),
];

recording = true;
const problems = [];
for (const file of files) {
    reads.length = 0;
    try {
        require(file);
    } catch (err) {
        problems.push(`${path.basename(file)} -- failed to load: ${err.message}`);
        continue;
    }
    if (reads.length) {
        problems.push(`${path.basename(file)} -- reads at require time: ${[...new Set(reads)].join(', ')}`);
    }
}
recording = false;

if (problems.length) {
    console.error('\n❌ Module-level emoji captures found (these render stale on any non-prod app):\n');
    problems.forEach(line => console.error('   - ' + line));
    console.error('\nFix: read `emojis.x` inside the render function, or build the containing table');
    console.error('per-render, instead of capturing it in a module-level const.\n');
    process.exit(1);
}

console.log(`✅ ${files.length} modules loaded; zero emoji values read at require() time.`);
