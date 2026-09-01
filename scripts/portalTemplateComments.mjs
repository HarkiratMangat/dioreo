// scripts/portalTemplateComments.mjs — a backtick inside an HTML comment inside a tagged template is a SILENT render bug.
//
// 🔴 THE DEFECT. `html`…`` is a tagged template literal, and a backtick inside it ENDS it — the parser does not care that
// the backtick is sitting inside an `<!-- … -->` comment, because to the parser there is no comment there at all, only text.
// An ODD number of backticks breaks the parse, and `node --check` catches that. An EVEN number CLOSES AND REOPENS the
// template: the prose between the two backticks becomes expression context, the file parses, every gate goes green, and the
// page renders wrong — blank, or with the comment's words evaluated as identifiers. That silent variant is what this exists
// for. It is already on the portal's "five silent-render traps" list and it has now cost turns in `armory.js` twice and in
// `manifest.js` once, each time in a comment written to explain a fix.
//
// 🔴 WHY NO OFF-THE-SHELF TOOL FINDS IT, and why reaching for one is the wrong move here. A template literal is a single
// leaf token: ast-grep, jscodeshift, ts-morph, eslint and prettier all see one string and nothing inside it. `eslint.config.mjs`
// in this repo carries the opposite lesson — a standard tool beat eight turns of hand-rolling — so this file states its reason
// for existing: there is no general tool with a view of the interior of a template literal's text.
//
// 🔴 AND THE RULE IT MECHANISES. The standing heredoc convention is `assert <anchor> in s` before each replacement. That is an
// ANCHOR assert: it proves you are editing the right place, and it passed cleanly on every edit that produced this bug. Nothing
// in the convention checks that the PAYLOAD is valid where it lands. This gate is that check, hoisted out of one session's
// discretion — which is this repo's own convention for a checkable rule (`reference_enforcement_hooks`: it becomes a mechanism,
// not another sentence).
//
// ⚠️ NO `--write`. A gate that repairs its own findings is a diary, not a test. The fix is a judgement call — drop the
// backticks, or re-word — and it belongs to whoever wrote the comment.
//
// ⚠️ NOT A RATCHET, unlike `portalReverseOrphans`. There is no legitimate instance of this to baseline: every occurrence is a
// bug. A zero-tolerance gate needs no fixture file and cannot rot into a list of names nothing renders.
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
// ⚠️ `PORTAL_TPLCOMMENT_ROOT` repoints the scan at a fixture tree — the only way the self-test can prove the matcher CAN fire,
// which is the half that stops a checker from silently matching nothing (§0.5a R7). Same technique as `PORTAL_REVERSE_ROOT`.
const UI = process.env.PORTAL_TPLCOMMENT_ROOT
    ? path.resolve(process.env.PORTAL_TPLCOMMENT_ROOT)
    : path.join(ROOT, 'portal', 'ui');

// ⚠️ SCOPE IS `portal/ui` AND ITS SUBDIRECTORIES, never `portal/public`. The build concatenates sources into `portal/public`,
// so scanning both reports every finding twice and a fixed source keeps failing against its stale copy. The harness IS in
// scope: it renders real components, so a broken template there fails a real page.
function jsFiles(dir) {
    const out = [];
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) out.push(...jsFiles(p));
        else if (e.name.endsWith('.js') || e.name.endsWith('.mjs')) out.push(p);
    }
    return out;
}

// The identifier immediately before an opening backtick, so a finding can say WHICH tag it is in. Untagged templates are
// still scanned — the defect is a property of template literals, not of `html` specifically.
function tagBefore(src, tick) {
    let j = tick - 1;
    while (j >= 0 && /\s/.test(src[j])) j--;
    let end = j + 1;
    while (j >= 0 && /[\w$.]/.test(src[j])) j--;
    return end > j + 1 ? src.slice(j + 1, end) : '';
}

function skipQuoted(src, i) {
    const q = src[i];
    i++;
    while (i < src.length) {
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === q || src[i] === '\n') return i + 1;
        i++;
    }
    return i;
}

// A hand-written lexer, because the whole point is to see INSIDE a token every parser treats as opaque. It tracks four
// contexts — code, template text, `${}` expression, and brace depth within one — so that a backtick in a JS block comment,
// in a quoted string, or in an expression slot is correctly NOT a finding.
export function scanSource(src, file = '<source>') {
    const findings = [];
    const lineOf = (idx) => src.slice(0, idx).split('\n').length;
    const stack = [];                                    // {kind:'tpl'|'expr', tag?, depth?}
    const top = () => stack[stack.length - 1];
    let i = 0;
    while (i < src.length) {
        const ctx = top();
        if (ctx && ctx.kind === 'tpl') {
            if (src[i] === '\\') { i += 2; continue; }
            if (src.startsWith('${', i)) { stack.push({ kind: 'expr', depth: 0 }); i += 2; continue; }
            if (src[i] === '`') { stack.pop(); i++; continue; }
            if (src.startsWith('<!--', i)) {
                const open = i;
                let j = i + 4;
                while (j < src.length) {
                    if (src.startsWith('-->', j)) break;
                    if (src[j] === '`') {
                        findings.push({
                            file, line: lineOf(j), tag: ctx.tag || '(untagged)',
                            comment: src.slice(open, Math.min(open + 72, src.length)).replace(/\s+/g, ' '),
                        });
                        break;                            // one finding per comment; the first backtick is the one that ends it
                    }
                    j++;
                }
                i = open + 4;                             // resume INSIDE the comment, so a second broken comment is still seen
                continue;
            }
            i++;
            continue;
        }
        // code, or the inside of a ${} slot
        if (src.startsWith('//', i)) { const e = src.indexOf('\n', i); i = e < 0 ? src.length : e + 1; continue; }
        if (src.startsWith('/*', i)) { const e = src.indexOf('*/', i + 2); i = e < 0 ? src.length : e + 2; continue; }
        if (src[i] === "'" || src[i] === '"') { i = skipQuoted(src, i); continue; }
        if (src[i] === '`') { stack.push({ kind: 'tpl', tag: tagBefore(src, i) }); i++; continue; }
        if (ctx && ctx.kind === 'expr') {
            if (src[i] === '{') { ctx.depth++; i++; continue; }
            if (src[i] === '}') { if (ctx.depth === 0) stack.pop(); else ctx.depth--; i++; continue; }
        }
        i++;
    }
    return findings;
}

function main() {
    if (!fs.existsSync(UI)) { console.log(`\n❌ nothing to scan: ${UI} does not exist`); process.exit(1); }
    const files = jsFiles(UI);
    const findings = files.flatMap((f) => scanSource(fs.readFileSync(f, 'utf8'), path.relative(ROOT, f)));
    // ⚠️ A SCAN THAT EXAMINED NOTHING IS NOT A PASS. `portal/ui` is full of `html` templates; if none were found the extractor
    // is broken, and reporting "clean" would be the exact silent-success this gate exists to prevent.
    const templates = files.reduce((n, f) => n + (fs.readFileSync(f, 'utf8').match(/html`/g) || []).length, 0);
    if (!files.length || !templates) {
        console.log(`\n❌ examined ${files.length} file(s) and found ${templates} tagged template(s) — the extractor is not reading what it thinks it is.`);
        process.exit(1);
    }
    if (findings.length) {
        console.log(`\n❌ ${findings.length} backtick(s) inside an HTML comment inside a template literal — each one ends the template early:\n`);
        for (const f of findings) console.log(`   ${f.file}:${f.line}  in ${f.tag}\`…\`\n      ${f.comment}…\n`);
        console.log('   Remove the backticks or re-word. An EVEN number still parses, so a green suite says nothing here.');
        process.exit(1);
    }
    console.log(`\n✅ ${files.length} file(s), ${templates} tagged template(s), no backtick inside an HTML comment.`);
}

// ⚠️ `pathToFileURL`, NEVER a hand-built `file://` + argv[1]. This repo lives at "/Applications/Claude Code/Diors-Builds" —
// the space percent-encodes in `import.meta.url` and does not in `process.argv[1]`, so the naive comparison is FALSE here and
// `main()` silently never runs: the CLI printed nothing and exited 0 on a deliberately broken fixture. Caught by this file's
// own end-to-end case on its first run, which is exactly the §0.5a R7 failure — a guard swallowing the failure it was written
// for — reproduced inside the gate written to prevent one.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
