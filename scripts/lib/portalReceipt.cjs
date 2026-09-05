// scripts/lib/portalReceipt.cjs — a dated note that an instrument RAN on a realm.
//
// 🔴 WHY. §L names six conditions for closing a Part, and four of them are "did you run X against the current code".
// On 2026-09-01 a Part was one summary away from being reported closed with `portal:inventory` — the plan's own stated
// close condition (§0.5a R4) — never having been run on that realm once, because `portal:audit`'s five sections
// RESEMBLE the inventory's four lists and I substituted the result I had for the one I did not. Three other mistakes
// that session had the same shape. `portalGeometry` was already immune to this because it writes a fixture with a
// commit stamp and `portalStatus` reports its staleness; the instruments that print to stdout and write nothing had no
// such memory, so "unrun" and "run and clean" looked identical the next morning.
//
// ⚠️ A RECEIPT IS NOT A RESULT, AND IT MUST NEVER BE READ AS ONE. It records that a command executed at a commit. It
// says nothing about what it reported or whether anyone read it — and the mistake it is aimed at (believing a
// near-neighbour instrument answered the question) is a reading failure, which no timestamp can see. It closes the
// "unrun and unnoticed" half only. `portalStatus` prints that limit beside the table rather than leaving it implied.
//
// ⚠️ GITIGNORED, deliberately. It is evidence about THIS working tree, not a fact about the repo — a receipt travelling
// in a commit would tell a fresh clone that something ran there, which is exactly the stale-green class this exists to
// fight. A clone with no receipts correctly reports everything as unrun.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const DIR = path.join(ROOT, 'local', '.portal-receipts');

function record(tool, realm, note = '') {
    try {
        fs.mkdirSync(DIR, { recursive: true });
        let commit = ''; try { commit = execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf8' }).trim(); } catch { /* not a repo */ }
        // 🔴 A COMMIT SHA ALONE IS A CLAIM THE RECEIPT CANNOT SUPPORT. Every instrument here runs against the
        // WORKING TREE, so stamping only `rev-parse HEAD` says "ran at this commit" for a run that measured
        // something that commit does not contain — which is how `portalStatus` came to contradict §L row 7. The
        // portal surfaces are the ones that matter: a dirty `docs/` does not change what a realm renders.
        let dirty = null;
        try {
            dirty = execSync('git status --porcelain -- portal docs/superpowers/mockups/2026-08-23-portal-interactive',
                { cwd: ROOT, encoding: 'utf8' }).trim() !== '';
        } catch { /* not a repo — leave it unknown rather than asserting clean */ }
        fs.writeFileSync(path.join(DIR, `${realm}.${tool}.json`),
            JSON.stringify({ tool, realm, commit, dirty, at: new Date().toISOString(), note }, null, 2) + '\n');
    } catch { /* a receipt that cannot be written must never take the instrument down with it */ }
}

// Every receipt for one realm, newest first, with whether portal/ui has moved since each was written.
function readAll(realm) {
    let files = []; try { files = fs.readdirSync(DIR); } catch { return []; }
    // 🔴 COUNT COMMITS SINCE THE RECEIPT'S OWN SHA — DO NOT COMPARE ITS WALL CLOCK AGAINST THE LAST portal/ui COMMIT.
    // `portalStatus`'s geometry check carries this exact warning three lines from where this was first written, and it
    // was written wrong anyway: a receipt is recorded BEFORE the commit that carries the work, so a timestamp compare
    // reports every instrument stale the moment you commit — all five went red on a realm whose instruments had just
    // been run. A gate that cries wolf gets filtered, and then it is not guarding anything. Same defect, same file,
    // same day as the R11 lesson: read the neighbour before writing the sibling.
    return files.filter((f) => f.startsWith(realm + '.') && f.endsWith('.json')).map((f) => {
        const j = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
        let since = 0;
        if (j.commit) {
            try { since = Number(execSync(`git rev-list --count ${j.commit}..HEAD -- portal/ui portal/vendor`, { cwd: ROOT, encoding: 'utf8' }).trim()) || 0; } catch { since = 0; }
        }
        return { ...j, since, stale: since > 0 };
    }).sort((a, b) => b.at.localeCompare(a.at));
}

module.exports = { record, readAll, DIR };
