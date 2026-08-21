#!/usr/bin/env node
/**
 * reflow-prose.mjs — convert hard-wrapped Markdown prose to soft-wrapped (one logical line per paragraph / list item / quoted paragraph).
 *
 * WHY THIS EXISTS, AND WHY IT IS NOT `dior text unwrap`
 * -----------------------------------------------------
 * The policy decision (2026-08-08 11:00 EDT, Harkirat) is that prose in this repo is soft-wrapped: a paragraph is ONE physical line, and the editor wraps it for display. The reason is searchability — measured at the time of the decision, 13,582 of 21,020 prose lines (64.6%) continued a sentence onto the next line, so a majority of multi-word phrases physically did not exist on any single line and `rg` could not match them.
 *
 * `~/.config/dior/scripts/unwrap-hard-breaks.js` (`dior text unwrap`) does the same job for one-off pasted text, and its paragraph/list/fence handling is sound. It is NOT used for this repo's migration because its blockquote handling loses structure: `flushQuote()` emits `"> " + parts.join(" ")`, so an N-line quote collapses to a single `>` marker. That destroys a bare `>` line, which is a paragraph BREAK inside a quote. Measured on this repo before writing this file: it merged two separate quoted paragraphs in docs/legal/TERMS.md into one, and dropped 15 `>` markers there, 24 in docs/README.md, 3 in CLAUDE.md. Nested quotes and headings inside a quote have the same problem.
 *
 * This version handles a blockquote by stripping the marker, reflowing the inner content THROUGH THE SAME FUNCTION, then restoring the marker per output line. Nesting, headings, lists and blank separators inside quotes all then work by construction rather than by a special case.
 *
 * THE INVARIANT — this is the part that makes the migration trustworthy
 * ---------------------------------------------------------------------
 * Reflowing may only ever DELETE newlines and leading indentation. It must never add, drop, or reorder a single non-whitespace character. So:
 *
 *     tokens(before) === tokens(after)      where tokens = text.split(/\s+/)
 *
 * must hold exactly, for every file. `--check` asserts it and exits non-zero on violation. This is a real check, not a vacuous one: running it against the older tool FAILS on the files listed above, which is how those bugs were found. Structural counts (headings, table rows, fenced blocks, HTML-comment lines) are asserted separately, because a token stream alone cannot prove a heading did not dissolve into a paragraph.
 *
 * Usage:
 *   node scripts/reflow-prose.mjs --check <file>...   verify only, write nothing
 *   node scripts/reflow-prose.mjs --write <file>...   rewrite in place
 */

import fs from "node:fs";
import { pathToFileURL } from "node:url";
// Constant command, no interpolation — nothing user-supplied reaches the shell.
import { execSync } from "node:child_process";

// An INDEPENDENT oracle. The hand-written invariants below are written against the same assumptions as the reflow code itself, so on their own they amount to grading my own homework. A real CommonMark implementation does not share those assumptions: if the rendered HTML is unchanged, the reflow is semantically null by definition, including for edge cases nobody thought to enumerate.
//
// It is not sufficient on its own either — see isFieldLine: CommonMark called the legal metadata block identical while the site generator, which reads it one line per field, did not. Independent oracle AND structural invariants AND a real build; each covers what the others miss.
//
// devDependency, so a production `npm install --omit=dev` drops it. If it is missing the check SKIPS LOUDLY rather than passing quietly — a verification that silently downgrades to nothing is the failure mode this whole file exists to avoid.
let md = null;
let mdError = null;
try {
  const { default: MarkdownIt } = await import("markdown-it");
  md = new MarkdownIt("commonmark", { html: true });
} catch (e) {
  mdError = e.message;
}

/* ─────────────────────────── line classification ────────────────────────── */

const isFence = (l) => l.match(/^\s*(```+|~~~+)/);
const isHeading = (l) => /^\s{0,3}#{1,6}(\s|$)/.test(l);
const isHR = (l) => /^\s{0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/.test(l);
const isTableRow = (l) =>
  /^\s*\|.*\|\s*$/.test(l) || /^\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+$/.test(l);
// Raw-HTML lines must not be folded into prose. Deciding what counts is subtler than "starts with `<`", which is what the older tool used and what the first version of this file used — measured against the real docs, that rule tore ordinary sentences apart:
//   docs/db-deferred-list.md  "…(`git show\n  <sha>:package.json` matched…"
//   docs/db-deferred-list.md  "…`dior text unwrap\n  <file> [--out <dir>]…"
// (Cited by CONTENT, not by line. These carried `:203` and `:731` until 2026-08-14 10:12 EDT, by which point both pointed at unrelated items — one at a live-test entry, the other at a blank line — because the list is edited constantly. A line number in a comment is a copy of state that nothing updates; the quoted text is the durable reference and is what a reader would search for anyway.) Both are paragraph continuations that merely happen to wrap onto a `<`, and both would have been ripped out of their paragraph and emitted standalone.
//
// "Not mid-paragraph" does not work either, in both directions: a genuine `<details>` block sits mid-paragraph at docs/archive/resolved-list.md:95, while the notes file's `<!-- ANSWERED … -->` records sit INSIDE list items by convention and must stay on their own physical line.
//
// So: comments are always block-level, and any other angle-bracket line counts only when the tag is an actual HTML element. `sha`, `file` and `dir` are not.
const HTML_TAGS = new Set([
  "a", "abbr", "b", "blockquote", "br", "code", "dd", "details", "div", "dl",
  "dt", "em", "figcaption", "figure", "h1", "h2", "h3", "h4", "h5", "h6", "hr",
  "i", "img", "kbd", "li", "ol", "p", "picture", "pre", "s", "samp", "section",
  "small", "span", "strong", "sub", "summary", "sup", "table", "tbody", "td",
  "tfoot", "th", "thead", "tr", "u", "ul", "video",
]);
function isHtml(l) {
  if (/^\s*<!--/.test(l)) return true;
  const m = l.match(/^\s*<\/?([a-zA-Z][a-zA-Z0-9-]*)/);
  return !!m && HTML_TAGS.has(m[1].toLowerCase());
}
const listMarker = (l) => l.match(/^(\s*)([-*+]|\d{1,9}[.)])(\s+)/);

// A line OPENING with `**Label:**` is a field, and always starts a new logical line — it is never absorbed as a continuation of the line above.
//
// This is not cosmetic. docs/legal/TERMS.md and PRIVACY.md open with a metadata block of consecutive field lines:
//     **Effective date:** 4 August 2026
//     **Version:** 1.5
//     **Applies to:** …
// and scripts/buildLegalPages.js reads that block ONE LINE PER FIELD. Joining them folded Version and "Applies to" inside the rendered "Effective" value on the live site. CommonMark calls the two forms identical — it is one paragraph either way — so the render-equivalence oracle passed it, and the token and structural invariants did too. It was caught only by rebuilding the site and diffing public/. That is the standing lesson here: semantic equivalence under a general parser does not cover a consumer that reads LINE STRUCTURE.
//
// Paragraphs that merely begin with bold text are unaffected: their continuations do not themselves start with `**Label:**`, so they still join.
const isFieldLine = (l) => /^\s*\*\*[^*\n]+:\*\*/.test(l);

// A genuine Markdown hard break: two+ trailing spaces, or an odd run of trailing backslashes. Joining across one would change rendering, so it ends the logical line. The older tool detected these and then trimmed the trailing spaces off anyway, silently degrading the break — here the marker is re-emitted.
function hardBreak(raw) {
  if (/ {2,}$/.test(raw)) return "  ";
  const t = raw.replace(/[ \t]+$/, "");
  const run = t.match(/\\+$/);
  if (run && run[0].length % 2 === 1) return "";
  return null;
}

/* ──────────────────────────────── the reflow ────────────────────────────── */

export function reflow(text) {
  const lines = text.split("\n");
  const out = [];

  // Front matter is data, not prose — passed through untouched.
  let i = 0;
  if (lines[0] !== undefined && lines[0].trim() === "---") {
    out.push(lines[0]);
    i = 1;
    while (i < lines.length) {
      out.push(lines[i]);
      const closed = lines[i].trim() === "---";
      i++;
      if (closed) break;
    }
  }

  let para = null; // { prefix, parts }
  const flush = () => {
    if (para) {
      out.push(para.prefix + para.parts.join(" ") + (para.trail || ""));
      para = null;
    }
  };

  for (; i < lines.length; i++) {
    const raw = lines[i];

    // ── fenced code: verbatim, including the fence lines themselves
    const fence = isFence(raw);
    if (fence) {
      flush();
      out.push(raw);
      const char = fence[1][0];
      i++;
      for (; i < lines.length; i++) {
        out.push(lines[i]);
        if (lines[i].trim().startsWith(char.repeat(3))) break;
      }
      continue;
    }

    // ── blockquote: strip marker, reflow the inside recursively, restore marker. This is the case the older tool got wrong.
    const bq = raw.match(/^(\s*>[ \t]?)/);
    if (bq) {
      flush();
      const body = [];
      const marker = raw.match(/^\s*>/)[0] + " ";
      for (; i < lines.length; i++) {
        const m = lines[i].match(/^(\s*>[ \t]?)(.*)$/);
        if (!m) break;
        body.push(m[2]);
      }
      i--;
      for (const l of reflow(body.join("\n")).split("\n")) {
        // A blank line inside a quote is a bare `>` — the paragraph separator whose loss merged two distinct quoted paragraphs in TERMS.md.
        out.push(l.trim() === "" ? marker.trimEnd() : marker + l);
      }
      continue;
    }

    if (raw.trim() === "") {
      flush();
      out.push(raw);
      continue;
    }

    // ── structural lines stand alone
    if (isHeading(raw) || isHR(raw) || isTableRow(raw) || isHtml(raw)) {
      flush();
      out.push(raw);
      continue;
    }

    const indent = raw.match(/^[ \t]*/)[0].length;

    // ── indented code block (4+ spaces, and not a continuation of a list item)
    if (!para && indent >= 4) {
      out.push(raw);
      continue;
    }

    const marker = listMarker(raw);
    if (marker) {
      flush();
      const head = marker[1].length + marker[2].length + marker[3].length;
      para = {
        prefix: raw.slice(0, head),
        parts: [raw.slice(head).trim()],
        isList: true,
      };
      const hb = hardBreak(raw);
      if (hb !== null) {
        para.trail = hb;
        flush();
      }
      continue;
    }

    // ── a field line always opens a new logical line, never a continuation. It still absorbs its OWN wrapped tail: TERMS.md's `**Applies to:**` value runs onto a second line, and that second line is not itself a field.
    if (isFieldLine(raw)) {
      flush();
      para = { prefix: raw.match(/^[ \t]*/)[0], parts: [raw.trim()] };
      const hb = hardBreak(raw);
      if (hb !== null) {
        para.trail = hb;
        flush();
      }
      continue;
    }

    // ── continuation of the current paragraph or list item
    //
    // A list item only absorbs a continuation that is INDENTED (>= 2). An unindented line after a list item is a CommonMark "lazy continuation" — it renders inside the item either way, so joining it changes nothing today, but it destroys the author's block boundary permanently and cannot be recovered by inspection afterwards. CLAUDE.md has real cases ("Full setup, the emoji/DB cloning, and the caveats: …" under the dev-bot bullet) where the line is plainly meant to stand on its own and is merely missing a blank line. Across a 44-file mechanical migration the conservative branch is the correct one: under-joining is visible and fixable, over-joining is silent and permanent.
    //
    // Plain paragraphs are NOT subject to this — an unindented continuation is exactly what ordinary hard-wrapped prose looks like, and joining it is the whole point of the migration.
    if (para) {
      if (para.isList && indent < 2) {
        flush();
      } else {
        para.parts.push(raw.trim());
        const hb = hardBreak(raw);
        if (hb !== null) {
          para.trail = hb;
          flush();
        }
        continue;
      }
    }

    para = { prefix: raw.match(/^[ \t]*/)[0], parts: [raw.trim()] };
    const hb = hardBreak(raw);
    if (hb !== null) {
      para.trail = hb;
      flush();
    }
  }

  flush();
  return out.join("\n");
}

/* ───────────────────────────── the verifier ─────────────────────────────── */

// Blockquote markers are STRUCTURE, not content: joining four quoted lines into one legitimately turns four `>` into one, so counting them as content tokens makes the invariant reject correct output. They are stripped here and asserted separately below. (Found by this check failing on its own tool's correct output — the first version tokenized them and flagged every quote.)
const tokens = (s) =>
  s
    .split("\n")
    .map((l) => l.replace(/^\s*(?:>[ \t]?)+/, ""))
    .join("\n")
    .split(/\s+/)
    .filter(Boolean);

const countOf = (s, pred) => s.split("\n").filter(pred).length;

// A bare `>` is a paragraph BREAK inside a quote. Losing one merges two distinct quoted paragraphs — the exact corruption the older tool caused in docs/legal/TERMS.md — so its count is an invariant in its own right.
const isQuoteBreak = (l) => /^\s*>[ \t]*$/.test(l);

// Fenced-block contents must survive byte-identically, so they are compared as whole strings rather than counted.
function fences(s) {
  const res = [];
  const lines = s.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const f = isFence(lines[i]);
    if (!f) continue;
    const char = f[1][0];
    const buf = [lines[i]];
    for (i++; i < lines.length; i++) {
      buf.push(lines[i]);
      if (lines[i].trim().startsWith(char.repeat(3))) break;
    }
    res.push(buf.join("\n"));
  }
  return res;
}

// 🔴 AN ODD NUMBER OF FENCE LINES MEANS THE DOCUMENT IS MALFORMED, AND REFLOW SILENTLY CORRUPTS IT.
// The fence skipping above pairs fences positionally, so one unbalanced fence makes a later OPENING
// fence get consumed as the CLOSE of an earlier block — every code block after that point lands
// outside any fence and is reflowed as prose. Measured 2026-08-20: an unbalanced fence in a plan
// collapsed NINE code blocks, including an entire module implementation, onto single lines.
// verify() did not catch it, because it computed the same wrong block boundaries before and after,
// so the fenced-content comparison was vacuously equal. This counts fence LINES, which is the one
// thing that cannot be fooled by a mispairing.
const fenceLineCount = (s) => s.split("\n").filter((l) => isFence(l)).length;

export function verify(before, after) {
  const problems = [];

  const tb = tokens(before);
  const ta = tokens(after);
  if (tb.length !== ta.length) {
    let n = 0;
    while (n < tb.length && n < ta.length && tb[n] === ta[n]) n++;
    problems.push(
      `token count ${tb.length} → ${ta.length}; first divergence at ${n}: ` +
        `expected ${JSON.stringify(tb.slice(n, n + 6).join(" "))} ` +
        `got ${JSON.stringify(ta.slice(n, n + 6).join(" "))}`
    );
  } else {
    for (let n = 0; n < tb.length; n++) {
      if (tb[n] !== ta[n]) {
        problems.push(
          `token ${n} changed: ${JSON.stringify(tb[n])} → ${JSON.stringify(ta[n])}`
        );
        break;
      }
    }
  }

  // Structure: a token stream alone cannot prove a heading did not dissolve into a paragraph, or a table row into prose.
  for (const [name, pred] of [
    ["headings", isHeading],
    ["table rows", isTableRow],
    ["html/comment lines", isHtml],
    ["quote paragraph breaks", isQuoteBreak],
    // Reflow joins continuations into their item; it must never create or destroy an item. A continuation that itself begins with `- ` was already a separate item before reflow, so the count is invariant either way — which makes a change here a genuine structural break, not a false positive.
    ["list markers", (l) => !!listMarker(l)],
  ]) {
    const b = countOf(before, pred);
    const a = countOf(after, pred);
    if (b !== a) problems.push(`${name}: ${b} → ${a}`);
  }

  // Checked FIRST and reported as its own problem: everything below assumes fences pair correctly.
  const fbCount = fenceLineCount(before);
  if (fbCount % 2 !== 0) {
    problems.push(`unbalanced code fences: ${fbCount} fence lines (odd). One fence is missing its pair, so reflow would treat later code blocks as prose and collapse them. Fix the document before reflowing.`);
  }

  const fb = fences(before);
  const fa = fences(after);
  if (fb.length !== fa.length) {
    problems.push(`fenced blocks: ${fb.length} → ${fa.length}`);
  } else {
    for (let n = 0; n < fb.length; n++) {
      if (fb[n] !== fa[n]) {
        problems.push(`fenced block ${n} content changed`);
        break;
      }
    }
  }

  // Independent semantic oracle, run last so a structural finding reports first. Joining lines turns "\n" into " " inside a <p>, which is identical in HTML — so collapsing whitespace runs is correct normalization here, not a cheat: inter-tag structure carries the meaning and stays fully under comparison.
  if (md) {
    const norm = (h) => h.replace(/\s+/g, " ").replace(/> </g, "><").trim();
    if (norm(md.render(before)) !== norm(md.render(after))) {
      problems.push("rendered HTML differs (CommonMark) — reflow is not semantically neutral");
    }
  } else {
    problems.push(
      `RENDER CHECK SKIPPED — markdown-it unavailable (${mdError}). ` +
        `Run \`npm install\` to restore it; do not read this run as verified.`
    );
  }

  return problems;
}

/* ──────────────────────────────────  CLI  ───────────────────────────────── */

function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  let files = args.filter((a) => !a.startsWith("--"));

  // With no paths, default to every tracked Markdown file. Resolved here rather than as a shell pipeline in package.json so the npm script stays portable (BSD vs GNU `grep -z` differ) and the file set is defined in one place. hookify.env-protection.local.md is excluded: a plugin-owned file on someone else's schema, not ours to reformat.
  if (!files.length) {
    files = execSync("git ls-files -z '*.md'", { encoding: "buffer" })
      .toString("utf8")
      .split("\0")
      .filter(Boolean)
      .filter((f) => !f.includes("hookify"));
  }

  if (!files.length) {
    process.stderr.write("Usage: reflow-prose.mjs [--check|--write] [file...]\n");
    process.exit(2);
  }

  let failed = 0;
  let changed = 0;
  for (const f of files) {
    const before = fs.readFileSync(f, "utf8");
    const after = reflow(before);
    const problems = verify(before, after);
    if (problems.length) {
      failed++;
      process.stdout.write(`FAIL  ${f}\n`);
      for (const p of problems) process.stdout.write(`        ${p}\n`);
      continue;
    }
    if (before !== after) {
      changed++;
      if (write) fs.writeFileSync(f, after, "utf8");
      process.stdout.write(
        `${write ? "wrote" : "ok   "} ${f}  ` +
          `${before.split("\n").length} → ${after.split("\n").length} lines\n`
      );
    }
  }

  process.stdout.write(
    `\n${files.length} file(s): ${changed} ${write ? "changed" : "would change"}, ` +
      `${failed} failed verification\n`
  );
  // ⚠️ --check FAILS on "would change", not only on "failed verification" (fixed 2026-08-14 10:01 EDT). CLAUDE.md has claimed since the soft-wrap convention shipped that `npm test` makes a hard-wrapped paragraph fail the suite; it did not. `docs:reflow` is wired into `npm test` in --check mode, and this line exited 0 whenever the only finding was that a file WOULD change — which is exactly the finding it exists to report. The gate printed its warning into a passing run and blocked nothing, and one file (docs/ROADMAP.md) was sitting hard-wrapped under it. `failed` still means the reflow could not round-trip safely, which is a different and worse condition; both now fail, and --write still exits 0 because it has just fixed them.
  process.exit(failed || (!write && changed) ? 1 : 0);
}

// The CLI runs ONLY when this file is the entry point. Without the guard, a test doing `import { verify }` executed the whole CLI against the TEST's argv and then called process.exit() — which killed the test process before a single assertion ran, while still printing a confident "0 failed verification". A first attempt guarded only the usage-error branch and left the loop below it exposed, which looks fixed and is not; hence one function, one call site.
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main();
}
