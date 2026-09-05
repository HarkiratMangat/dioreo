#!/usr/bin/env node
// scripts/portalLedgerRows.mjs — how many decisions does the ledger already carry for a realm?
//
// 🔴 WHY IT EXISTS. `portal:sweep` printed seven percentages and nothing else, and the percentage is the metric
// §0.7d retired — it is a pointer to code worth reading, never a score. But the sweep is the FIRST artifact of a
// session, so a number standing alone at the top of the log is read as a grade no matter what the plan says. A
// realm closes on the ENUMERATION: are its regions exactly the cited set. This prints the other half of that
// sentence, so the two arrive together and neither can be read as the whole answer.
//
// ⚠️ IT COUNTS ROWS, NOT DIFFERENCES, AND THE TWO ARE NOT THE SAME NUMBER. One ledger row can cover several
// regions (Season's `+16px` cascade offsets the whole page) and several rows can cover one. So the shortfall
// printed beside it is a PROMPT — "this many regions have no row naming them" — and not a defect count. Saying so
// in the output is the point: an instrument that does not state its coverage lets every reader assume it covers
// everything.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const LEDGER = path.join(ROOT, 'docs/reference/portal-decision-ledger.md');

// A section is `## <Realm> — …`; its rows are the table lines under it. The header and separator rows are
// dropped by requiring a cell that is not all dashes.
// ⚠️ THE SEVEN REALMS, DECLARED. The first version counted every `##` in the file, so `How to read a row`,
// `Overlay tier` and `Instruments` came back looking like realms with 0, 16 and 6 decisions — and, worse, the
// realm that was genuinely ABSENT could not be told from the sections that were merely not realms. Declaring
// the list is what makes a missing section visible: **Analytics had no ledger section at all**, at 14.1% and
// 41 regions with zero recorded decisions, and this listing is what found it.
export const REALMS = ['season', 'armory', 'broadcast', 'access', 'analytics', 'review', 'home'];

export function rowsPerRealm(text) {
    const out = Object.fromEntries(REALMS.map((r) => [r, null]));
    let current = null;
    for (const line of String(text || '').split('\n')) {
        const h = /^##\s+([A-Za-z-]+)/.exec(line);
        if (h) {
            const name = h[1].toLowerCase();
            current = (name === 'cross-realm' || REALMS.includes(name)) ? name : null;
            if (current && out[current] === null) out[current] = 0;
            else if (current === 'cross-realm' && !('cross-realm' in out)) out['cross-realm'] = 0;
            continue;
        }
        if (!current) continue;
        if (!line.startsWith('|')) continue;
        const cells = line.split('|').slice(1, -1);
        if (cells.length < 2) continue;
        if (cells.every((c) => /^[\s:-]*$/.test(c))) continue;      // the separator row
        if (/^\s*(Surface|Realm|#|What)\b/.test(cells[0])) continue; // the header row
        out[current] += 1;
    }
    return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    const counts = rowsPerRealm(fs.readFileSync(LEDGER, 'utf8'));
    const want = process.argv[2];
    if (want) { const n = counts[want.toLowerCase()]; process.stdout.write(n === null || n === undefined ? 'none' : String(n)); process.exit(0); }
    console.log('\nledger rows per realm — decisions already recorded, NOT a count of differences\n');
    for (const [realm, n] of Object.entries(counts)) {
        console.log(`  ${realm.padEnd(12)} ${n === null ? '  — NO SECTION IN THE LEDGER' : String(n).padStart(3)}`);
    }
    console.log('\n  A realm closes on the ENUMERATION — are its regions exactly the cited set — never on a percentage.');
    console.log('  One row can cover many regions and many rows can cover one, so this is a prompt, not a score.\n');
}
