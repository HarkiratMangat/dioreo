// Which board the spec describes (Session 4, Stage 3, 2026-10-05 15:22 EDT): Board 4: Collective's kit by default, or Board 4: Final after a bake
// (B4_KIT=local/pins2/s4/board4-final). Every generator here reads the kit's folder, URL and title from this one place; before it, eleven of them
// named docs/pins2/kit and "Board 4: Collective" each on their own, so the spec could not be regenerated from Final (FINAL.md §3 step 2).
const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../../..');
const REL = process.env.B4_KIT || 'docs/pins2/kit'; const DIR = path.join(ROOT, REL);
const TITLE = process.env.B4_TITLE || (() => { try { return (fs.readFileSync(path.join(DIR, 'board4.html'), 'utf8').match(/<title>([^<]*)<\/title>/) || [])[1] || 'Board 4: Collective'; } catch (e) { return 'Board 4: Collective'; } })();
const URL = process.env.B4_URL || `http://127.0.0.1:8900/${REL}/board4.html`;
module.exports = { ROOT, REL, DIR, TITLE, URL };
