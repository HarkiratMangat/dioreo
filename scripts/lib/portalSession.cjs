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
    // 🔴 `main .rec-row` HAD NO EMITTER ANYWHERE — replaced 2026-09-04 20:08 EDT, the same defect as the
    // `.hcard` entry removed from this list four hours earlier and for the same reason: a dead selector in
    // a list like this reads as coverage. Review draws its staged changes as `OpRow` children of `.rvlist`
    // (`portal/ui/review.js:223`) and its empty state as `.rvnone`; nothing in either the portal or the
    // mockup emits `rec-row`. Found because `portalDiff` adopted this rule and Review immediately refused —
    // which is the assertion working, on a gap that had been invisible while the caller used `main.door`.
    'main .rvlist > *',  // Review's staged changes (2026-09-04 20:08 EDT)
    // 🔴 ACCESS'S SECOND VIEW HAD NO ROW SHAPE IN THIS LIST EITHER — added 2026-09-04 20:09 EDT, found by the
    // zero-row assertion `portalRealWalk` gained in the same session. `By permission` is the permission MATRIX:
    // `<div id="by-scope">` with one `.scope` card per permission (`access.js:303`) — no table, no `li`. So the
    // view walked at 0 rows and passed for as long as the count was printed and never asserted. ⚠️ This is the
    // THIRD entry this list has been missing (Home's, Review's, this one) and the second found the same way:
    // a realm's row shape stays invisible until something REFUSES on it.
    'main .scope',    // Access's By-permission scope cards (2026-09-04 20:10 EDT)
    'main .bcard',    // Broadcast's announcement cards
    // 🔴 `:not(.clear)` IS THE WHOLE POINT OF THIS LINE — added 2026-09-04 14:19 EDT by the §L ⑥ reality
    // agent, against the version added four hours earlier in the same session. `AttentionList`'s
    // EMPTY branch emits `att-row clear`, and `fetchJson` never throws while `HomeRealm` fails only
    // on `!data` — so with all seven `/api/*` answering 500 the page renders `0 NEEDS YOU / 0 LIVE
    // NOW / 0 STAGED` above "Nothing needs you right now", and a bare `.att-row` made THAT satisfy
    // the door assertion. The first version of this fix turned a false NEGATIVE into a false
    // POSITIVE, which is strictly worse: this function exists to stop a well-formed reading of the
    // wrong page, and a total API failure is exactly that page.
    // ⚠️ The empty state is a legitimate Home. It is excluded anyway, because a walk cannot tell it
    // apart from the failure that renders identically — and the two must not be conflated by an
    // instrument whose whole job is that distinction. A genuinely-empty Home fails this walk and
    // says so, which is the honest answer rather than the convenient one.
    'main .att-row:not(.clear)',  // Home's attention rows (2026-09-04 14:19 EDT)
    // 🔴 THE LINE ABOVE LEFT A CONDITIONAL FALSE NEGATIVE AND THIS IS THE OTHER HALF — 2026-09-04 19:48 EDT.
    // Excluding `.clear` correctly stops an all-500s Home passing, but it also fails a Home that is
    // simply CLEAN: nothing needing attention is the good state, and an instrument that cannot tell it
    // from a dead backend reports a defect on a healthy page. `.sclock` is Home's season clock, which
    // renders from `/api/season` — so it is present on a live-and-empty Home and absent when the
    // endpoints are down, which is exactly the axis `.att-row` alone could not separate.
    'main .sclock',   // Home's season clock — live-but-empty is not the door (2026-09-04 19:48 EDT)
    // ⚠️ `main .hcard` WAS HERE AND HAS NO EMITTER ANYWHERE — removed 2026-09-04 14:19 EDT, also by the ⑥
    // agent: zero occurrences in `portal/ui/*.js`, zero in the mockup's `index.html`, `hcards: 0` on
    // the live page. It survives only as 21 CSS rules and a row in the reverse-orphans accepted-debt
    // baseline, whose comment asserts Home draws it. A dead selector in a list like this is not
    // harmless — it reads as coverage.
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
