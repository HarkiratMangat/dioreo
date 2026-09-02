#!/usr/bin/env node
// rulesBudget.mjs -- a RATCHET on .claude/rules/, the largest unmeasured context cost in the repo.
//
// WHY THIS EXISTS (2026-09-02 15:53 EDT)
// ------------------------------------------------
// Measured this session with the InstructionsLoaded audit hook: a path-scoped rule loads when Claude READS or EDITS a matching file, once per session, and it loads WHOLE -- a `Read` with `limit: 12` pulled in the entire 9,256B of hotpatch.md. The tree totals 651,223B across 20 files, so touching one file in commands/ can inject a median 72,420B and at worst 187,237B (~47k tokens, three rules at once on handlers/colors.js). None of it was budgeted, gated, or measured.
//
// The contrast is the point: SIX budget arguments and FOUR raises have been spent on MEMORY.md, which is 25,000B loaded -- the smallest always-on layer in the system -- while a tier seven times the size of the root CLAUDE.md sat beside it with no ceiling at all.
//
// WHY A RATCHET RATHER THAN A CEILING. A hard ceiling at any honest number fails four files today, and a gate that fails on arrival gets switched off -- this repo has the receipts (the bare-date branch was narrowed from 18% precision for exactly that reason). A ratchet is enforceable on day one: every rule is pinned at its current size and may only ever get SMALLER. The four oversized files are recorded as debt in the open, the way portal/fixtures/reverse-orphans.json records its own, and the number in the baseline is the thing that has to go down.
//
// TARGET is the line a NEW rule must meet, and it is measured rather than chosen: 14 of the 20 existing rules are already under 30,000B, so it is the size this tree mostly already respects.
//
// ⚠️ THIS MEASURES BYTES, NOT VALUE. A small rule is not automatically a good one and a large rule is not automatically waste -- what makes the big four suspect is that they are ENCYCLOPEDIAS in a tier that is INJECTED, and the same content is already queryable: ctx-index-refresh.sh indexes .claude/rules/ under project:dioreo-rules before every ctx_search. Splitting one means keeping the trap where the injection is (small, automatic, exactly where a trap belongs) and moving the reference half to docs/reference/, which is indexed too. Nothing has to be deleted for the number to fall.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, '.claude', 'rules');
const BASELINE = join(DIR, 'size-baseline.json');
const TARGET = 30000;

export function measure(dir = DIR) {
    return Object.fromEntries(
        readdirSync(dir).filter((f) => f.endsWith('.md')).sort()
            .map((f) => [f, Buffer.byteLength(readFileSync(join(dir, f)))]),
    );
}

// Exported so the test can drive the whole decision without touching the real tree -- a checker that can only be run against the repo it guards cannot be shown to FAIL, and an unfailable check is the vacuous pass this repo has three memories about.
export function evaluate(sizes, baseline, target = TARGET) {
    const errors = [], warns = [];
    for (const [name, bytes] of Object.entries(sizes)) {
        const cap = baseline[name];
        if (cap === undefined) {
            if (bytes > target) {
                errors.push(`${name} is new and ${bytes}B, over the ${target}B line a new rule must meet. Keep the TRAP here and move the reference half to docs/reference/ (already indexed). If it genuinely has to ship at this size, add it to size-baseline.json in the same commit so the number is visible in the diff.`);
            }
        } else if (bytes > cap) {
            errors.push(`${name} GREW: ${bytes}B against a pinned ${cap}B (+${bytes - cap}). This tier only ratchets DOWN. Move the new prose to docs/reference/ or a dated spec, or -- if the growth is genuinely a trap that belongs in the injected tier -- raise the pin deliberately in the same commit.`);
        }
        if (bytes > target) warns.push(`${name} ${bytes}B (${(bytes / target).toFixed(1)}x the ${target}B line)`);
    }
    // A pin for a file that no longer exists is stale state, and stale state in a baseline is how a deleted rule silently frees budget nobody meant to grant.
    for (const name of Object.keys(baseline)) {
        if (!(name in sizes)) errors.push(`size-baseline.json pins ${name}, which no longer exists. Remove the pin in the same commit that removed the rule.`);
    }
    return { errors, warns };
}

const args = process.argv.slice(2);
if (args.includes('--write')) {
    writeFileSync(BASELINE, JSON.stringify(measure(), null, 2) + '\n');
    console.log(`rules budget: baseline rewritten from disk (${Object.keys(measure()).length} rules)`);
    process.exit(0);
}

const sizes = measure();
const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, 'utf8')) : {};
const { errors, warns } = evaluate(sizes, baseline);
const total = Object.values(sizes).reduce((a, b) => a + b, 0);

console.log(`rules budget: ${Object.keys(sizes).length} rules, ${total}B total, ${warns.length} over the ${TARGET}B line`);
for (const w of warns) console.log(`  WARN  ${w}`);
for (const e of errors) console.log(`  ERROR ${e}`);
if (errors.length) {
    console.log(`\n${errors.length} error(s). This tier is INJECTED -- a rule is paid in full the moment you read any file matching its globs, whether or not you needed it.`);
    process.exit(1);
}
