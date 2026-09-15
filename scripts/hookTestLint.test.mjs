// scripts/hookTestLint.test.mjs — lints every .claude/hooks/*.test.sh for the two hook-test habits that cost this suite flakes and waits.
//
// Added 2026-09-14 20:54 EDT. The five rules for writing a hook self-test are in docs/reference/enforcement-hooks.md § "Writing a hook self-test"; these two are the ones a scan can decide. (1) A pipe into `grep -q` under `pipefail`: grep exits at its first match, the writer takes SIGPIPE, and pipefail reports a found needle as a failure — self-check.test.sh failed exactly this way under load, and this lint's first run found a second such pipe in the same file. (2) A bare `sleep`: two tests slept a second per fixture only to separate two timestamps, which backdating does for free. A genuine wait says why on its own line: `# sleep-ok: <reason>`.
//
// ⚠️ WHOLE-LINE COMMENTS ARE NOT CODE. The comments that explain these rules quote the patterns they forbid, and a lint that read them would flag its own documentation.
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOOKS = path.join(ROOT, '.claude', 'hooks');

export function lintHookTest(text) {
    const out = [];
    const pipefail = /^\s*set\s+-[a-z]*o\s+pipefail\b/m.test(text);
    text.split('\n').forEach((line, i) => {
        if (/^\s*#/.test(line) || !line.trim()) return;
        if (pipefail && /\|\s*grep\b[^|]*\s-[A-Za-z]*q/.test(line)) out.push({ line: i + 1, rule: 'pipe-into-grep-q', text: line.trim() });
        if (/(^|[;&|(\s])sleep\s+[0-9.]+/.test(line) && !/#\s*sleep-ok:/.test(line)) out.push({ line: i + 1, rule: 'sleep', text: line.trim() });
    });
    return out;
}

let passed = 0;
const check = (label, fn) => { fn(); passed++; console.log(`  ✓ ${label}`); };
console.log('hook self-test lint\n');

check('the real pre-fix self-check pipe is caught', () => {
    const before = "set -uo pipefail\ncheck()  { if printf '%s' \"$OUT\" | grep -qF -- \"$2\"; then ok \"$1\"; else bad \"$1\" \"missing: $2\"; fi; }\n";
    assert.deepStrictEqual(lintHookTest(before).map((v) => v.rule), ['pipe-into-grep-q']);
});
check('the same pipe WITHOUT pipefail is left alone — no SIGPIPE turns into a failure there', () => {
    assert.deepStrictEqual(lintHookTest("check() { if printf '%s' \"$OUT\" | grep -qF -- x; then :; fi; }\n"), []);
});
check('a here-string, and a comment quoting the bad pipe, are both clean', () => {
    assert.deepStrictEqual(lintHookTest("set -euo pipefail\n# never `printf | grep -q`\nif grep -qF -- x <<< \"$OUT\"; then :; fi\n"), []);
});
check('a bare sleep is caught; a commented one and a marked one are not', () => {
    const found = lintHookTest("  sleep 1\n# no sleep 1 here\nsleep 2  # sleep-ok: waits for the port to bind\n");
    assert.deepStrictEqual(found.map((v) => [v.line, v.rule]), [[1, 'sleep']]);
});
check('every hook self-test in the tree is clean', () => {
    const files = fs.readdirSync(HOOKS).filter((f) => f.endsWith('.test.sh'));
    assert.ok(files.length > 20, `found only ${files.length} hook tests — the scan itself is broken`);
    const bad = files.flatMap((f) => lintHookTest(fs.readFileSync(path.join(HOOKS, f), 'utf8')).map((v) => `${f}:${v.line} [${v.rule}] ${v.text}`));
    assert.deepStrictEqual(bad, [], `hook self-tests break a rule in docs/reference/enforcement-hooks.md § Writing a hook self-test:\n  ${bad.join('\n  ')}`);
});

console.log(`\n✅ ${passed} cases — both rules proven able to fail on the real broken input, and the tree is clean.`);
