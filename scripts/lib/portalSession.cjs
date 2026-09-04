// scripts/lib/portalSession.cjs — minting a dev session, and PROVING a page got past the door.
//
// 🔴 THIS EXISTS BECAUSE AN UNAUTHENTICATED WALK IS INDISTINGUISHABLE FROM A CLEAN ONE. Measured
// 2026-08-30: a hand-rolled puppeteer probe of the real portal reported `textLen=784, rows=0`
// IDENTICALLY on Track, Board and Repairs, with a single `401 /auth/csrf` in the console as the only
// tell. Every downstream check then passed vacuously — no garbage values, no layout defects, no
// errors — because there was nothing on the page to be wrong. Three identical readings across views
// that must differ look like a stable measurement and are the signature of never having arrived.
//
// `scripts/portalDiff.mjs` has carried the minting half inline since it was written. This is that
// logic, extracted, plus the half it never had: an assertion that the page in front of you is the
// realm and not the sign-in door.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ⚠️ DEV MONGO ONLY, ASSERTED RATHER THAN ASSUMED — the same grep-do-not-source reasoning as
// backupDb.sh. A tool that can write a session into the production database is not a tool.
async function mintSession(root, discordId) {
    const envPath = path.join(root, '.env.dev');
    if (!fs.existsSync(envPath)) return null;
    const line = fs.readFileSync(envPath, 'utf8').split(/\r?\n/).find((l) => l.trimStart().startsWith('MONGODB_URI='));
    const uri = line ? line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '') : '';
    if (!uri) return null;
    if (!/mongodb:\/\/(localhost|127\.0\.0\.1)/.test(uri)) {
        throw new Error(`portalSession refuses to mint against a non-local database: ${uri.replace(/\/\/.*@/, '//***@')}`);
    }
    const mongoose = require('mongoose');
    await mongoose.connect(uri);
    const PortalSession = require(path.join(root, 'models/PortalSession'));
    const AdminUser = require(path.join(root, 'models/AdminUser'));
    // 🔴 THE OWNER, NOT "WHOEVER THE DATABASE LISTS FIRST" — a scoped test admin holding three realms
    // of six narrows the rail, and a tool whose own session narrows the page is measuring its setup.
    const { ALLOWED_ADMIN_ID } = require(path.join(root, 'utils/owner'));
    const who = discordId || ALLOWED_ADMIN_ID || (await AdminUser.findOne({}).lean())?.discordId;
    if (!who) { await mongoose.disconnect(); return null; }
    const raw = crypto.randomBytes(32).toString('hex');
    await PortalSession.create({
        sessionHash: crypto.createHash('sha256').update(raw).digest('hex'),
        discordId: who,
        userAgent: 'portalSession (scripts/lib/portalSession.cjs)',
    });
    await mongoose.disconnect();
    return { raw, who };
}

// The pure half, so the rule can be tested without a browser: given what the page shows, is this the
// realm or the door? Kept separate from the DOM read on purpose — the DOM read is three selectors and
// the JUDGEMENT is the part that has to be right.
//
// ⚠️ `realmNodes` ALONE IS NOT ENOUGH and that is the whole point. The failed probe had a rendered
// header and 784 characters of text; what it did not have was any row of realm content. A door is a
// page that renders — it is not a blank one.
function doorVerdict({ hasDoorMarker, realmNodes, textLen }) {
    if (hasDoorMarker) return { pastDoor: false, why: 'the sign-in door is on screen' };
    if (!realmNodes) return { pastDoor: false, why: `no realm content rendered (${textLen} chars of chrome and zero rows)` };
    return { pastDoor: true, why: null };
}

// The browser half. Throws rather than returning, because a caller that gets a page object back will
// use it, and the whole failure mode here is a well-formed measurement of the wrong page.
// 🔴 ONE LIST, BECAUSE THERE WERE TWO AND THEY DRIFTED. `assertPastDoor` below and
// `portalRealWalk`'s per-view `scan()` each carried their own copy of this selector; the copies
// disagreed (`.bcard` in one, not the other), and BOTH were missing every shape Home draws — so
// Home failed the door assertion AND would have reported `0 rows` had it got past it. Two lists
// of one thing is the defect this branch exists to remove. Adding a realm's row shape here fixes
// both readings at once.
const REALM_ROW_SELECTOR = [
    'main tr',        // Manifest tables — Armory, Analytics, Access
    'main .bar',      // Season's Track lanes
    'main li',        // any genuine list item
    'main .rec-row',  // Review's changeset records
    'main .bcard',    // Broadcast's announcement cards
    'main .att-row',  // Home's attention rows (2026-09-04 12:17 EDT)
    'main .hcard',    // Home's realm strip (2026-09-04 12:17 EDT)
].join(', ');

async function assertPastDoor(page, label) {
    const state = await page.evaluate((sel) => ({
        hasDoorMarker: !!document.querySelector('main.door, .doorcard, .dbtn'),
        // ⚠️ EVERY REALM'S ROW SHAPE HAS TO BE IN HERE OR THAT REALM CAN NEVER PASS. Added
        // 2026-09-04 12:16 EDT: Home draws its attention rows as `.att-row` anchors and its realm
        // strip as `.hcard`, and matched NONE of the five selectors below — so Home's §L ⑤
        // reported 'never got past the door' on a page that renders correctly, and the
        // instrument's own message named the one cause it was not. A missing selector and an
        // unauthenticated walk are indistinguishable from this function's return value, which
        // is why the list is now commented rather than merely correct.
        realmNodes: document.querySelectorAll(sel).length,
        textLen: String((document.querySelector('main') || {}).innerText || '').length,
    }), REALM_ROW_SELECTOR);
    const v = doorVerdict(state);
    if (!v.pastDoor) {
        throw new Error(`portalSession: ${label} never got past the door — ${v.why}.\n`
            + '  Everything measured from here would be a reading of the sign-in page, and a reading of the\n'
            + '  sign-in page is identical on every view, which is what makes it look like a stable result.');
    }
    return state;
}

module.exports = { mintSession, doorVerdict, assertPastDoor, REALM_ROW_SELECTOR };
