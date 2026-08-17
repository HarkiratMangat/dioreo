#!/usr/bin/env node
/**
 * reflow-comments.mjs — soft-wrap BLOCK code comments (multi-line `//` runs and `/** *\/` JSDoc headers in .js/.mjs; multi-line `#` runs in .sh) the same way scripts/reflow-prose.mjs did for Markdown: one logical line per paragraph/list-item, letting the editor wrap it for display.
 *
 * WHY A SEPARATE SCRIPT, NOT A REUSE OF reflow-prose.mjs
 * --------------------------------------------------------
 * reflow-prose.mjs is a Markdown parser. It knows nothing about comment syntax, string/template/regex literals containing `//`, or shell quoting and heredocs — feeding code through it would either do nothing (fenced blocks pass through verbatim) or, if the fence detection were bypassed, corrupt live code. This file is a from-scratch implementation scoped to comment BLOCKS only, deliberately narrower in what it touches than the Markdown reflow is.
 *
 * SCOPE, matching the filed recommendation (docs/db-deferred-list.md, 2026-08-08): only BLOCK comments — a run of 2+ consecutive full-line `//` (or `#`) comments, or a multi-line `/** *\/` header whose continuation lines each start with `*`. A single-line comment is a no-op (nothing to join). A trailing `// comment` or `# comment` sharing a line with code is NEVER touched — the recommendation explicitly leaves those alone, and touching them would mean editing a line that also contains real code.
 *
 * THE INVARIANT
 * -------------
 * Every byte outside an identified, reflowed comment block must be BYTE-IDENTICAL before and after. This holds by CONSTRUCTION: the output is built by splicing replacement text into the exact [start,end) offsets of qualifying comment blocks in the original source and copying everything else verbatim — there is no line-by-line rebuild that could drift. Inside a reflowed block, the invariant is: comment TEXT tokens (words, split on whitespace, after stripping the `//`/`#`/`*` marker) are conserved exactly — same principle as reflow-prose.mjs's token check.
 *
 * HOW COMMENTS ARE FOUND
 * -----------------------
 * .js/.mjs: via `acorn`'s real parser (`onComment`), not a hand-rolled lexer. A hand-written scanner has to reproduce JS's string/template/regex rules to avoid mistaking `//` inside a regex literal (`/http:\/\//`) or a multi-line template literal for a real comment; acorn already solves that correctly as a side effect of actually parsing the file, which is a much stronger guarantee than a bespoke lexer could offer for the size of this change (192 files). Added as a devDependency for exactly this file.
 *
 * .sh: no equivalent parser dependency was pulled in — the shell grammar needed here is much narrower (only full-line `#...` comments are ever touched, never inline trailing ones), so a hand-rolled scanner tracking just single/double quotes and heredoc bodies covers it. Heredoc bodies are the dangerous case: a line that merely LOOKS like `^\s*#comment` inside a heredoc is literal payload (real committed .sh files pass heredoc bodies containing `#`-led JSON/text to `cat >file <<'EOF'`), and joining it into a neighboring "comment" would silently corrupt the script's behavior without necessarily breaking `bash -n`. Heredoc-body byte content is therefore asserted conserved as its own invariant, on top of the general non-comment-bytes-identical guarantee.
 *
 * Usage:
 *   node scripts/reflow-comments.mjs --check <file>...   verify only, write nothing
 *   node scripts/reflow-comments.mjs --write <file>...   rewrite in place
 */

import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { execFileSync, execSync } from "node:child_process";
import * as acorn from "acorn";

/* ─────────────────────── shared paragraph/list/field reflow ─────────────────────── */
// Operates on CONTENT lines already stripped of their comment marker (`// `, `# `, or ` * `) — each entry is { indent, text }, where `indent` is leading whitespace remaining after that strip (used the same way reflow-prose.mjs uses list/verbatim indent: >=4 while no paragraph is open means "verbatim, pass through unchanged", the safety valve that protects deliberately-aligned example/usage lines like `Usage:\n  cmd --check ...` from being merged into one nonsensical line).

const listMarker = (s) => s.match(/^(\s*)([-*+•]|\d{1,9}[.)])(\s+)/);
const isFieldLine = (s) => /^@[A-Za-z][\w-]*\b/.test(s);
// A decorative section-border line (`// ===...===`, `// ---...---`), used throughout this repo both as a pseudo-heading underline and as a standalone banner around a comment's title. Must stand alone — joining it into a title or paragraph turns a visual section break into running prose. Measured before fixing this: 204 such lines across the tracked .js/.mjs/.sh tree, all a single repeated character.
const isRule = (s) => /^([-=_*~])\1{2,}$/.test(s);

function reflowContentLines(rawLines) {
  const out = [];
  let para = null; // { parts, isList }
  const flush = () => {
    if (para) {
      out.push(para.parts.join(" "));
      para = null;
    }
  };

  for (const raw of rawLines) {
    if (raw.trim() === "") {
      flush();
      out.push("");
      continue;
    }

    const indent = raw.match(/^[ \t]*/)[0].length;
    const trimmed = raw.trim();

    if (isRule(trimmed)) {
      flush();
      out.push(trimmed);
      continue;
    }

    const marker = listMarker(raw);
    if (marker) {
      flush();
      const head = marker[1].length + marker[2].length + marker[3].length;
      para = { parts: [raw.slice(0, head) + raw.slice(head).trim()], isList: true };
      continue;
    }

    if (isFieldLine(trimmed)) {
      flush();
      para = { parts: [trimmed] };
      continue;
    }

    if (para && para.isList) {
      // A list item's own wrapped sentence continues indented (this is how "//   - foo bar\n//     baz" is written); indent<2 ends the item.
      if (indent >= 2) {
        para.parts.push(trimmed);
        continue;
      }
      flush();
    } else if (para) {
      // Real hard-wrapped prose in this codebase always continues FLUSH (indent 0) with its opener — confirmed across the corpus. Any positive indent here is a deliberately separated example/alignment line, e.g. "Usage:\n  cmd --check ...\n  cmd --write ...": each of those must stay its own line, not run together into one command. (An earlier version joined unconditionally whenever a paragraph was open, which is exactly what broke that case.)
      if (indent === 0) {
        para.parts.push(trimmed);
        continue;
      }
      flush();
    }

    if (indent >= 1) {
      // Verbatim/example line with nothing open to continue: pass through unchanged and don't open a paragraph, so consecutive example lines (like the two `Usage:` commands) each stay on their own line instead of collapsing into one another.
      //
      // Threshold is 1, not the more conservative-looking 2: a line with EXACTLY one stray leading space (a real case — a source comment read " (1) Strip a cosmetic..." with a doubled space after `//`) fell through this gap when it was 2, landing in the fallback below and opening a NEW joinable paragraph instead of being preserved. That paragraph's own flush() then emitted the line with its stray space TRIMMED OFF, so a second reflow pass saw indent=0 where the first pass saw indent=1 — different classification, different output — a real non-idempotency bug (found by re-running --check against already-reflowed output and getting a nonzero diff). Anything indented at all now takes the same verbatim path, which preserves bytes exactly and is stable under repeated runs.
      out.push(raw);
      continue;
    }

    para = { parts: [trimmed] };
  }

  flush();
  return out;
}

// Token conservation for one comment block: words survive, in order.
function contentTokens(lines) {
  return lines.join("\n").split(/\s+/).filter(Boolean);
}

/* ──────────────────────────── .js / .mjs via acorn ──────────────────────────── */

function lineStartOffsets(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\n") starts.push(i + 1);
  }
  return starts;
}

function offsetToLine(starts, offset) {
  // binary search: last start <= offset
  let lo = 0, hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= offset) lo = mid; else hi = mid - 1;
  }
  return lo; // 0-indexed line number
}

function parseComments(text) {
  const comments = [];
  const onComment = (block, value, start, end) => {
    comments.push({ block, value, start, end });
  };
  const opts = { ecmaVersion: "latest", allowHashBang: true, onComment };
  try {
    acorn.parse(text, { ...opts, sourceType: "module" });
    return comments;
  } catch (e1) {
    comments.length = 0;
    try {
      acorn.parse(text, { ...opts, sourceType: "script" });
      return comments;
    } catch (e2) {
      return null; // unparseable — caller skips loudly
    }
  }
}

// A comment "starts fresh on its own line" when nothing but whitespace precedes it on that physical line — required for both `//` runs (so we never touch a comment trailing real code) and `/** */` headers.
function ownLine(text, starts, start) {
  const line = offsetToLine(starts, start);
  const lineStart = starts[line];
  return text.slice(lineStart, start).trim() === "";
}

function buildJsBlocks(text) {
  const comments = parseComments(text);
  if (comments === null) return null;
  const starts = lineStartOffsets(text);
  const blocks = [];

  // ── group adjacent full-line `//` comments at identical column into runs
  //
  // `allowHashBang` makes acorn report the `#!...` shebang itself via onComment (start=0, value stripped of the `#!` marker) so the parser can skip it — it is NOT a real `//` comment. Without this filter it was silently merged into the file's first comment block, corrupting its content (confirmed live on every file with a shebang: the token stream gained "usr/bin/env node" at the front of the first paragraph).
  const lineComments = comments
    .filter((c) => !c.block && ownLine(text, starts, c.start) && text.slice(c.start, c.start + 2) === "//")
    .map((c) => ({ ...c, line: offsetToLine(starts, c.start), col: c.start - starts[offsetToLine(starts, c.start)] }))
    .sort((a, b) => a.start - b.start);

  let i = 0;
  while (i < lineComments.length) {
    let j = i;
    while (
      j + 1 < lineComments.length &&
      lineComments[j + 1].line === lineComments[j].line + 1 &&
      lineComments[j + 1].col === lineComments[i].col
    ) {
      j++;
    }
    if (j > i) {
      // run of 2+ — content is everything after `//` (one optional space)
      const rawLines = lineComments
        .slice(i, j + 1)
        .map((c) => c.value.replace(/^ /, ""));
      blocks.push({
        start: lineComments[i].start,
        end: lineComments[j].end,
        indentCol: lineComments[i].col,
        kind: "line-run",
        rawLines,
      });
    }
    i = j + 1;
  }

  // ── /** ... */ headers: fresh on own line, multi-line, every continuation line starts with `*` (the JSDoc convention this repo actually uses — verified: 79 `/**` blocks, all `* `-per-line). Anything that doesn't match that shape is left untouched rather than guessed at.
  for (const c of comments) {
    if (!c.block) continue;
    if (!ownLine(text, starts, c.start)) continue;
    const startLine = offsetToLine(starts, c.start);
    const endLine = offsetToLine(starts, c.end);
    if (startLine === endLine) continue; // single-line block comment: no-op
    if (!c.value.startsWith("*")) continue; // not `/**`
    // acorn's block-comment `value` is ONLY the interior text between `/*` and `*/` — the closer is never part of it. So the last split-line here is NOT " */"; it's exactly the closer's leading whitespace (e.g. " " for the conventional " */" own-line close), and matching it against a `\*\/` regex can never succeed. (An earlier version did exactly that and it silently disabled this whole code path — every multi-line `/** */` in the repo was skipped with zero indication.)
    const bodyLines = c.value.split("\n").slice(1); // drop first line (after `/**`)
    const lastRaw = bodyLines[bodyLines.length - 1];
    if (lastRaw.trim() !== "") continue; // closer shares a line with content — leave alone
    const middle = bodyLines.slice(0, -1);
    if (!middle.every((l) => /^\s*\*(\s|$)/.test(l))) continue; // not all `* `-prefixed
    const rawLines = middle.map((l) => l.replace(/^\s*\*[ \t]?/, ""));
    const indentCol = c.start - starts[startLine];
    blocks.push({
      start: c.start,
      end: c.end,
      indentCol,
      kind: "jsdoc",
      closingIndent: lastRaw,
      rawLines,
    });
  }

  blocks.sort((a, b) => a.start - b.start);
  return blocks;
}

function renderJsBlock(block) {
  const pad = " ".repeat(block.indentCol);
  const logical = reflowContentLines(block.rawLines);
  if (block.kind === "line-run") {
    // The FIRST output line lands exactly at block.start, whose leading whitespace is already preserved in the untouched prefix (the splice never includes it) — only subsequent lines are entirely inside the replaced span and need `pad` re-added.
    return logical
      .map((l) => (l === "" ? "//" : "// " + l))
      .join("\n" + pad);
  }
  // jsdoc — `/**` itself IS inside the replaced span (block.start is its own `/`), so it must be emitted literally; the closing line reuses its ORIGINAL captured indent rather than re-deriving it from `pad`, so a closer that wasn't perfectly column-aligned with the opener is left as the author had it.
  const body = logical
    .map((l) => (l === "" ? pad + " *" : pad + " * " + l))
    .join("\n");
  return "/**\n" + body + "\n" + block.closingIndent + "*/";
}

export function reflowJs(text) {
  const blocks = buildJsBlocks(text);
  if (blocks === null) return { text, skipped: true };
  let out = "";
  let cursor = 0;
  for (const b of blocks) {
    out += text.slice(cursor, b.start);
    out += renderJsBlock(b);
    cursor = b.end;
  }
  out += text.slice(cursor);
  return { text: out, skipped: false, blocks };
}

// Shared by verifyJs/verifySh. Checks TWO things per block, against the REAL `after` text the caller passed in — not a re-derivation from `blocks` alone, which would validate the render function's self- consistency but stay blind to any divergence between `blocks` and the actual splice that produced `after` (a bug a first version of this file had: it never referenced `after` at all, so its own regression test could not make it fail).
//   1. The bytes actually sitting at this block's position in `after` match `renderJsBlock`/`renderShBlock`'s output exactly — this is what would catch a splice/offset bug in reflow's reconstruction loop, tracked here via a running `delta` since every prior block can change length.
//   2. Content tokens (words, in order) are conserved between the original slice and the rendered replacement — this is what catches a paragraph-joining bug (a dropped or reordered word).
function verifyBlocks(before, after, blocks, renderFn, stripContent) {
  const problems = [];
  if (!blocks) return problems;
  let delta = 0;
  for (const b of blocks) {
    const beforeSlice = before.slice(b.start, b.end);
    const rendered = renderFn(b);
    const afterStart = b.start + delta;
    const actual = after.slice(afterStart, afterStart + rendered.length);
    if (actual !== rendered) {
      problems.push(`offset ${b.start}: actual output does not match the expected render (splice/offset bug)`);
    }
    const tb = contentTokens(stripContent(beforeSlice, b));
    const ta = contentTokens(stripContent(rendered, b));
    if (tb.length !== ta.length || tb.some((t, n) => t !== ta[n])) {
      problems.push(`comment token mismatch at offset ${b.start}: ${tb.length} → ${ta.length} tokens`);
    }
    delta += rendered.length - (b.end - b.start);
  }
  return problems;
}

function stripJsContent(slice, b) {
  return b.kind === "line-run"
    ? slice.split("\n").map((l) => l.replace(/^\s*\/\/[ \t]?/, ""))
    : slice.split("\n").slice(1, -1).map((l) => l.replace(/^\s*\*[ \t]?/, ""));
}

export function verifyJs(before, after, blocks) {
  return verifyBlocks(before, after, blocks, renderJsBlock, stripJsContent);
}

/* ───────────────────────────────── .sh scanner ───────────────────────────────── */
// Hand-rolled: only full-line `#...` comments are ever candidates, so the only state that matters is (a) are we inside a single/double quote that may legitimately span physical lines in POSIX shell, and (b) are we inside a heredoc body. Both are tracked with a single forward char scan.

function scanShComments(text) {
  const n = text.length;
  const starts = lineStartOffsets(text);
  const comments = []; // { start, end, line, indentLen }
  const heredocBodyRanges = []; // [start,end) byte ranges that must stay untouched

  let i = 0;
  let inSingle = false;
  let inDouble = false;
  const heredocQueue = []; // {delim, stripTabs}
  let line = 0;

  const isLineStart = (pos) => text.slice(starts[line], pos).trim() === "";

  while (i < n) {
    // ── heredoc body mode: consume line by line until the queue drains
    if (heredocQueue.length) {
      const lineStart = i;
      let lineEnd = text.indexOf("\n", i);
      if (lineEnd === -1) lineEnd = n;
      const rawLine = text.slice(lineStart, lineEnd);
      const top = heredocQueue[0];
      const cmp = top.stripTabs ? rawLine.replace(/^\t+/, "") : rawLine;
      if (cmp === top.delim) {
        heredocQueue.shift();
      } else {
        heredocBodyRanges.push([lineStart, lineEnd]);
      }
      i = lineEnd < n ? lineEnd + 1 : n;
      line++;
      continue;
    }

    const ch = text[i];

    if (ch === "\n") {
      i++;
      line++;
      continue;
    }

    if (inSingle) {
      if (ch === "'") inSingle = false;
      i++;
      continue;
    }

    if (inDouble) {
      if (ch === "\\") {
        // A backslash-escaped newline still advances the physical line count. Skipping it blindly (`i += 2`) desyncs `line` from every comment found afterward, corrupting adjacency grouping for any file using `\`-continued commands inside a double-quoted string — a real pattern, not hypothetical: 29 of 60 tracked .sh files use trailing-backslash continuations.
        if (text[i + 1] === "\n") line++;
        i += 2;
        continue;
      }
      if (ch === '"') inDouble = false;
      i++;
      continue;
    }

    if (ch === "\\") {
      // Same line-continuation case as above, in bare code state — e.g. `some_command --flag \` followed by indented args on the next line.
      if (text[i + 1] === "\n") line++;
      i += 2;
      continue;
    }

    if (ch === "'") {
      inSingle = true;
      i++;
      continue;
    }

    if (ch === '"') {
      inDouble = true;
      i++;
      continue;
    }

    // here-string `<<<` is single-line, not a body — must be checked before `<<`
    if (ch === "<" && text[i + 1] === "<" && text[i + 2] === "<") {
      i += 3;
      continue;
    }

    if (ch === "<" && text[i + 1] === "<") {
      const m = text
        .slice(i + 2)
        .match(/^(-|~)?\s*(?:'([^']*)'|"([^"]*)"|([A-Za-z_][A-Za-z0-9_]*))/);
      if (m) {
        const delim = m[2] ?? m[3] ?? m[4];
        heredocQueue.push({ delim, stripTabs: m[1] === "-" });
        i += 2 + m[0].length;
        continue;
      }
      i += 2;
      continue;
    }

    if (ch === "#") {
      // shebang: only meaningful as line 0, col 0
      const fullLine = isLineStart(i);
      let end = text.indexOf("\n", i);
      if (end === -1) end = n;
      if (fullLine && !(line === 0 && text[i + 1] === "!")) {
        comments.push({ start: i, end, line, indentLen: i - starts[line] });
      }
      i = end; // leave the \n for the main loop to consume
      continue;
    }

    i++;
  }

  return { comments, heredocBodyRanges };
}

function buildShBlocks(text) {
  const { comments } = scanShComments(text);
  const blocks = [];
  let i = 0;
  while (i < comments.length) {
    let j = i;
    while (
      j + 1 < comments.length &&
      comments[j + 1].line === comments[j].line + 1 &&
      comments[j + 1].indentLen === comments[i].indentLen
    ) {
      j++;
    }
    if (j > i) {
      const rawLines = comments
        .slice(i, j + 1)
        .map((c) => text.slice(c.start, c.end).replace(/^#[ \t]?/, ""));
      blocks.push({
        start: comments[i].start,
        end: comments[j].end,
        indentCol: comments[i].indentLen,
        rawLines,
      });
    }
    i = j + 1;
  }
  return blocks;
}

function renderShBlock(block) {
  const pad = " ".repeat(block.indentCol);
  const logical = reflowContentLines(block.rawLines);
  // Same first-line-is-already-indented reasoning as renderJsBlock.
  return logical.map((l) => (l === "" ? "#" : "# " + l)).join("\n" + pad);
}

export function reflowSh(text) {
  const blocks = buildShBlocks(text);
  let out = "";
  let cursor = 0;
  for (const b of blocks) {
    out += text.slice(cursor, b.start);
    out += renderShBlock(b);
    cursor = b.end;
  }
  out += text.slice(cursor);
  return { text: out, blocks };
}

function stripShContent(slice) {
  return slice.split("\n").map((l) => l.replace(/^\s*#[ \t]?/, ""));
}

export function verifySh(before, after, blocks) {
  const problems = verifyBlocks(before, after, blocks, renderShBlock, stripShContent);
  // Heredoc-body conservation: re-scan the OUTPUT and compare total body byte content against the input. Since reflow only ever replaces bytes strictly inside comment-block spans and heredoc bodies are never classified as comment blocks (scanShComments skips them outright), this is a defense-in-depth cross-check, not the primary guarantee.
  const hbBefore = scanShComments(before).heredocBodyRanges.map(([s, e]) => before.slice(s, e));
  const hbAfter = scanShComments(after).heredocBodyRanges.map(([s, e]) => after.slice(s, e));
  if (hbBefore.join("\n") !== hbAfter.join("\n")) {
    problems.push("heredoc body content changed");
  }
  return problems;
}

/* ──────────────────────────────────── CLI ──────────────────────────────────── */

function externalCheck(file, text) {
  const ext = file.slice(file.lastIndexOf("."));
  try {
    if (ext === ".sh") {
      execFileSync("bash", ["-n", "/dev/stdin"], { input: text, stdio: ["pipe", "pipe", "pipe"] });
    } else {
      execFileSync("node", ["--check", "/dev/stdin"], { input: text, stdio: ["pipe", "pipe", "pipe"] });
    }
    return null;
  } catch (e) {
    return (e.stderr || e.message || String(e)).toString().trim();
  }
}

function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  let files = args.filter((a) => !a.startsWith("--"));

  if (!files.length) {
    files = execSync("git ls-files -z '*.js' '*.mjs' '*.sh'", { encoding: "buffer" })
      .toString("utf8")
      .split("\0")
      .filter(Boolean)
      .filter((f) => !f.includes("node_modules"));
  }

  if (!files.length) {
    process.stderr.write("Usage: reflow-comments.mjs [--check|--write] [file...]\n");
    process.exit(2);
  }

  let failed = 0;
  let changed = 0;
  let skipped = 0;

  for (const f of files) {
    const before = fs.readFileSync(f, "utf8");
    const isSh = f.endsWith(".sh");
    let after, blocks, wasSkipped = false;

    if (isSh) {
      ({ text: after, blocks } = reflowSh(before));
    } else {
      const r = reflowJs(before);
      after = r.text;
      blocks = r.blocks;
      wasSkipped = r.skipped;
    }

    if (wasSkipped) {
      skipped++;
      process.stdout.write(`SKIP  ${f}  (unparseable by acorn as module or script)\n`);
      continue;
    }

    if (before === after) continue;

    const problems = isSh ? verifySh(before, after, blocks) : verifyJs(before, after, blocks);
    if (!problems.length) {
      const err = externalCheck(f, after);
      if (err) problems.push(`syntax check failed:\n${err}`);
    }

    if (problems.length) {
      failed++;
      process.stdout.write(`FAIL  ${f}\n`);
      for (const p of problems) process.stdout.write(`        ${p}\n`);
      continue;
    }

    changed++;
    if (write) fs.writeFileSync(f, after, "utf8");
    process.stdout.write(
      `${write ? "wrote" : "ok   "} ${f}  ${blocks.length} block(s) reflowed\n`
    );
  }

  process.stdout.write(
    `\n${files.length} file(s): ${changed} ${write ? "changed" : "would change"}, ` +
      `${failed} failed verification, ${skipped} skipped\n`
  );
  process.exit(failed || (!write && changed) ? 1 : 0);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main();
}
