// scripts/portalStatus.mjs — what is KNOWN about every realm, and whether it is still true.
//
// 🔴 WHY. A handoff that carries numbers carries them stale: the moment anyone commits, "Season Track
// 0.2%" is a claim about a tree that no longer exists, and the next session either trusts it (wrong) or
// re-measures everything (slow). Both happened across 2026-08-28..30. This prints the recorded state,
// the commit it was recorded at, and whether HEAD has moved since — so a session knows in one instant
// call what is known and what needs re-measuring, instead of reading a number and guessing.
//
// ⚠️ IT DOES NOT MEASURE. Re-measuring seven realms is ~4 minutes and cannot be a first command. This
// reads the geometry fixtures, which portalGeometry writes with a commit stamp, and tells you whether
// to trust them. `npm run portal:diff` remains the only thing that produces a number.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIX = path.join(ROOT, 'portal', 'fixtures', 'geometry');
const PKG = path.join(ROOT, 'docs/superpowers/mockups/2026-08-23-portal-interactive');

const sh = (c) => { try { return execSync(c, { cwd: ROOT, encoding: 'utf8' }).trim(); } catch { return ''; } };
const head = sh('git rev-parse --short HEAD');

// The reference's own fidelity, measured rather than assumed — season's mockup is a realised prototype
// and Review's is a static composition a tenth its size, so one target across seven pages was never right.
const fidelity = (realm) => {
    const f = path.join(PKG, `${realm === 'home' ? 'index' : realm}.html`);
    if (!fs.existsSync(f)) return null;
    const src = fs.readFileSync(f, 'utf8');
    return { kb: Math.round(src.length / 1024), handlers: (src.match(/addEventListener|onclick=/g) || []).length };
};

const rows = [];
for (const file of fs.readdirSync(FIX).filter((f) => f.endsWith('.json')).sort()) {
    const j = JSON.parse(fs.readFileSync(path.join(FIX, file), 'utf8'));
    const realm = j.realm || file.replace(/\.json$/, '');
    const at = j.commit || '?';
    // 🔴 COMPARE THE TWO FILES' LAST COMMITS, NOT THE STAMPED SHA AGAINST HEAD. A fixture cannot record
    // the commit it is about to be committed in, so `stamp..HEAD` counts the recording commit itself and
    // reports "1 — RE-MEASURE" immediately after every legitimate re-record. Found by running this on the
    // tree it was written for: all seven realms cried stale at once, which is the shape of a false positive
    // rather than a finding. A gate that cries wolf gets filtered, and then it is not guarding anything.
    const lastUi = sh('git log -1 --format=%ct -- portal/ui portal/vendor');
    const lastFix = sh(`git log -1 --format=%ct -- ${path.relative(ROOT, path.join(FIX, file))}`);
    const stale = lastUi && lastFix && Number(lastUi) > Number(lastFix);
    const moved = stale ? sh(`git rev-list --count ${lastFix ? '--since=@' + lastFix : ''} HEAD -- portal/ui`) : '0';
    rows.push({ realm, at, drift: Number(moved) || 0, views: Object.keys(j.views || {}), fid: fidelity(realm) });
}
const known = new Set(rows.map((r) => r.realm));
for (const realm of ['season', 'armory', 'broadcast', 'access', 'analytics', 'review', 'home']) {
    if (!known.has(realm)) rows.push({ realm, at: null, drift: 0, views: [], fid: fidelity(realm) });
}

console.log(`\nportal:status — HEAD ${head}\n`);
console.log('  realm       reference        recorded at   portal/ui commits since   views');
for (const r of rows.sort((a, b) => a.realm.localeCompare(b.realm))) {
    const fid = r.fid ? `${String(r.fid.kb).padStart(4)}KB ${String(r.fid.handlers).padStart(2)}h` : '   —      ';
    const at = r.at ? r.at.padEnd(11) : 'NEVER      ';
    const drift = r.at ? (r.drift ? `🔴 ${r.drift} — RE-MEASURE` : '✅ fresh — portal/ui unchanged since') : '—';
    console.log(`  ${r.realm.padEnd(11)} ${fid}   ${at}   ${drift.padEnd(24)} ${r.views.join(' · ')}`);
}
console.log(`
  reference fidelity is bytes + event handlers in the mockup page. Season is a realised interactive
  prototype; review and home are static compositions with ZERO handlers, so an interaction tier has
  nothing to open on them and a percentage chase there manufactures precision the source lacks.

  🔴 THIS IS NOT A QUALITY REPORT. A recorded fixture says the page's geometry has not moved since it
  was written — never that the realm matches its design. The number comes from portal:diff, and the
  diff is a FLOOR: see the plan's §0.1. Realms with no fixture have never been through the pass.
`);
