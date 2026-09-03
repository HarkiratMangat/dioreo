#!/usr/bin/env node
// autofixSafety.test.mjs — one invariant over EVERY hook that rewrites instead of reporting.
//
// WHY THIS EXISTS (2026-09-02 20:15 EDT)
// ------------------------------------------------
// A `/code-review` pass found seven defects behind a fully green suite. Three were the same thing in three files, and all three were auto-corrections that corrupted the exact thing they existed to protect:
//   · timestamp-check   detector scoped to today, substitution not -> rewrote a CORRECT historical
//                       stamp sitting on the same line as the real target.
//   · merge-delete-...  detector matched a merge after `;`/`&&`/`|`, the fix appended to the END of
//                       the line -> the flag landed on the next program.
//   · rg-flag-guard     spliced correctly, then ran a tidy-up replace over the WHOLE command ->
//                       collapsed a double space inside a quoted search pattern.
//
// Each passed the "does the hook know the ONE right value" test that governs promoting a gate to correcting. That test is necessary and NOT sufficient. The shared shape underneath is narrower and checkable: **the target was described twice, and the two descriptions drifted.** Detector vs substitution. Detector vs placement. Splice vs tidy-up.
//
// So the invariant here is not "is the fix right" -- it is the one property all three violated:
//
//     A CORRECTING HOOK'S OUTPUT MUST DIFFER FROM ITS INPUT ONLY AT THE THING IT CAME FOR.
//
// Everything else in the payload -- a neighbouring correct value, the inside of a quoted span, the command after the separator -- must come back byte-identical. Each case below carries the target AND a near-miss that must survive, because a case with only a target cannot fail this way. This is the same reasoning `scripts/reflow-prose.mjs:272` already records for its own rewriter: a verify that recomputes the same wrong boundaries before and after is vacuously equal.
//
// 🔴 THE ROSTER IS READ OFF DISK, NEVER HAND-MAINTAINED. A new hook that emits `updatedInput` and has no case here FAILS this suite. That is the half that does not rot: a checklist in a doc protects only the hooks whose authors read it, and this repo has measured what prose is worth (`grep` 788x against a rule that had been written down for months). run-all-tests.sh computes its coverage the same way and for the same reason.
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HOOKS = join(dirname(fileURLToPath(import.meta.url)), '..', '.claude', 'hooks');
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
const tz = new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', timeZoneName: 'short' }).split(' ').pop();

// A near-miss is a value the hook must recognise as NOT its target while a real target sits beside it. Anything listed in `survives` is asserted back byte-identical in the rewritten payload.
const CASES = {
    'timestamp-check.sh': [
        {
            name: 'a correct historical stamp beside today\'s placeholder',
            args: ['pre'],
            input: { new_string: `filed ${today} 09:xx ${tz} — see the 2026-08-03 18:12 ${tz} incident` },
            survives: ['2026-08-03 18:12', 'incident', 'filed'],
            expect: 'rewrite',
        },
        {
            // Found by an adversarial pass, not by this suite: TS-EXAMPLE was exempt from DETECTION and not from SUBSTITUTION, so an exempt line was rewritten whenever any other line in the same write triggered the branch. The escape hatch is exactly the text that must never be touched, which makes it the worst possible place for the drift to land.
            name: 'a TS-EXAMPLE line beside a real placeholder',
            args: ['pre'],
            input: { new_string: `the bad shape is ${today} 09:xx ${tz}   TS-EXAMPLE\nfiled ${today} 11:xx ${tz}` },
            survives: [`the bad shape is ${today} 09:xx ${tz}   TS-EXAMPLE`],
            expect: 'rewrite',
        },
        {
            name: 'a correct stamp for TODAY, beside a placeholder',
            args: ['pre'],
            input: { new_string: `a ${today} 11:47 ${tz} note, and a ${today} 09:xx ${tz} one` },
            survives: [`${today} 11:47`],
            expect: 'rewrite',
        },
    ],
    'rg-flag-guard.sh': [
        {
            name: 'a double space inside the quoted search pattern',
            args: [],
            input: { command: 'rg -rn "foo  bar" docs/' },
            survives: ['"foo  bar"', 'docs/'],
            expect: 'rewrite',
        },
        {
            name: 'a flag-shaped string inside the pattern',
            args: [],
            input: { command: "rg -rn 'pass -E to iconv' notes.md" },
            survives: ["'pass -E to iconv'", 'notes.md'],
            expect: 'rewrite',
        },
    ],
    'merge-delete-branch-autofix.sh': [
        {
            name: 'a separator inside a quoted body is not a chain',
            args: [],
            input: { command: 'gh pr merge 42 --squash --body "fixes a && b"' },
            survives: ['"fixes a && b"', 'gh pr merge 42 --squash'],
            expect: 'rewrite',
        },
    ],
};

const text0 = (u) => u.command ?? u.new_string ?? u.content ?? '';

const rewriting = readdirSync(HOOKS)
    .filter((f) => f.endsWith('.sh') && !f.endsWith('.test.sh'))
    .filter((f) => readFileSync(join(HOOKS, f), 'utf8').includes('updatedInput'))
    .sort();

let pass = 0, fail = 0;
console.log('autofix safety — a correcting hook may change only what it came for\n');
console.log(`  roster read off disk: ${rewriting.join(', ')}\n`);

for (const hook of rewriting) {
    if (!CASES[hook]) {
        console.log(`  ✗ ${hook} emits updatedInput and has NO adversarial case here.`);
        console.log('      Add one: a payload carrying its target AND a near-miss that must survive.');
        console.log('      A case with only a target cannot catch the defect this file exists for.');
        fail++;
        continue;
    }
    for (const c of CASES[hook]) {
        let out;
        try {
            out = execFileSync('bash', [join(HOOKS, hook), ...c.args], {
                input: JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: '/x/a.md', ...c.input } }),
                encoding: 'utf8',
            });
        } catch (e) { out = e.stdout || ''; }

        const j = out.trim() ? JSON.parse(out) : null;
        const u = j?.hookSpecificOutput?.updatedInput;
        // 🔴 EVERY CASE STATES THE OUTCOME IT EXPECTS -- corrected 2026-09-02 20:26 EDT by an adversarial pass over this file, written about an hour after it shipped. The first version scored "did not rewrite" as a PASS unconditionally, so a hook whose autofix broke entirely -- a bad regex, an unresolved variable, a jq error swallowed by 2>/dev/null -- would turn this whole suite green. The file whose stated purpose is catching a correcting hook that misbehaves could not notice one that had stopped correcting. That is the vacuous pass this repo has three memories about, written by the person who had just quoted them.
        if (!u) {
            if (c.expect === 'quiet') {
                console.log(`  ✓ ${hook}: ${c.name} — correctly left alone`);
                pass++;
            } else {
                console.log(`  ✗ ${hook}: ${c.name}`);
                console.log('      expected a rewrite and got none. Either the target stopped being detected,');
                console.log('      or the autofix broke and is now silently doing nothing.');
                fail++;
            }
            continue;
        }
        if (c.expect === 'quiet') {
            console.log(`  ✗ ${hook}: ${c.name} — expected NO rewrite, got: ${JSON.stringify(text0(u))}`);
            fail++;
            continue;
        }
        const text = u.command ?? u.new_string ?? u.content ?? '';
        const lost = c.survives.filter((s) => !text.includes(s));
        if (lost.length) {
            console.log(`  ✗ ${hook}: ${c.name}`);
            console.log(`      the rewrite destroyed: ${lost.map((s) => JSON.stringify(s)).join(', ')}`);
            console.log(`      got: ${JSON.stringify(text)}`);
            fail++;
        } else {
            console.log(`  ✓ ${hook}: ${c.name}`);
            pass++;
        }
    }
}

console.log(`\n  ${pass} passed, ${fail} failed`);
if (fail) {
    console.log('\n  A correcting hook changed something it did not come for. That is the shape three');
    console.log('  hooks shipped at once behind a green suite: the target described twice, and the two');
    console.log('  descriptions drifted. Splice at the site the detector found; never tidy afterwards.');
    process.exit(1);
}
