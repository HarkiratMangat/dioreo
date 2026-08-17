#!/usr/bin/env node
/**
 * reflow-comments.test.mjs — self-test for scripts/reflow-comments.mjs.
 *
 * Every case here is a REGRESSION for a defect that was actually observed
 * during development (an audit run before this ever touched the tree, per
 * feedback_verify_before_claiming's standing practice: prove on a known
 * case before trusting a tool on unknown ones). Four were live bugs, not
 * hypotheticals: a shebang line silently merged into the file's first
 * comment (acorn's `allowHashBang` reports the `#!` line itself as a fake
 * Line comment); every multi-line `/** *\/` JSDoc block in the repo being
 * silently skipped (the closer-detection regex could never match, because
 * acorn's block-comment `value` never includes the closing delimiter); a
 * double-indented first output line; and a shell scanner line-counter
 * desync on backslash-newline continuations (29 of 60 tracked .sh files use
 * them). Two more were found by manual inspection of real output: `===`
 * decorative section borders and `Usage:`-style literal example lines both
 * getting merged into surrounding prose.
 *
 * Run: node scripts/reflow-comments.test.mjs  (wired into npm test)
 */

import assert from "node:assert";
import { reflowJs, verifyJs, reflowSh, verifySh } from "./reflow-comments.mjs";

let pass = 0;
const fails = [];
function t(name, fn) {
  try {
    fn();
    pass++;
  } catch (e) {
    fails.push(`${name}: ${e.message}`);
  }
}

const cleanJs = (src) => {
  const { text, blocks } = reflowJs(src);
  const p = verifyJs(src, text, blocks);
  assert.deepStrictEqual(p, [], `expected clean, got: ${p.join(" | ")}`);
  return text;
};
const cleanSh = (src) => {
  const { text, blocks } = reflowSh(src);
  const p = verifySh(src, text, blocks);
  assert.deepStrictEqual(p, [], `expected clean, got: ${p.join(" | ")}`);
  return text;
};

/* ── JS: the shebang bug ──────────────────────────────────────────────── */

t("shebang is never merged into the first comment block", () => {
  const src =
    "#!/usr/bin/env node\n// first line of the real comment\n// second line continues it\nconst x = 1;\n";
  const out = cleanJs(src);
  assert.ok(out.startsWith("#!/usr/bin/env node\n"), "shebang must survive untouched at line 1");
  const afterShebang = out.slice("#!/usr/bin/env node\n".length);
  assert.ok(
    !afterShebang.includes("usr/bin/env"),
    `shebang text leaked into the comment body: ${JSON.stringify(out)}`
  );
});

/* ── JS: the JSDoc closer bug (this whole path was dead before the fix) ── */

t("a multi-line /** */ JSDoc block actually gets reflowed", () => {
  const src =
    "/**\n * first sentence continues\n * onto this second line.\n */\nfunction f() {}\n";
  const out = cleanJs(src);
  assert.strictEqual(
    out,
    "/**\n * first sentence continues onto this second line.\n */\nfunction f() {}\n"
  );
});

t("a JSDoc block whose closer shares a line with content is left untouched", () => {
  const src = "/**\n * wrapped across\n * two lines, closer inline */\nfunction f() {}\n";
  const out = cleanJs(src);
  assert.strictEqual(out, src, "should be a byte-identical no-op");
});

t("@param/@returns tags each stay their own line", () => {
  const src =
    "/**\n * Does the thing.\n * @param {string} a - first\n * @returns {number} the result\n */\nfunction f(a) {}\n";
  const out = cleanJs(src);
  assert.strictEqual(
    out,
    "/**\n * Does the thing.\n * @param {string} a - first\n * @returns {number} the result\n */\nfunction f(a) {}\n"
  );
});

/* ── JS: the double-indent bug ────────────────────────────────────────── */

t("a nested // run keeps its original indentation, not doubled", () => {
  const src =
    "function f() {\n  if (x) {\n    // first line of a nested run\n    // second line continues it\n    doThing();\n  }\n}\n";
  const out = cleanJs(src);
  assert.ok(
    out.includes("    // first line of a nested run second line continues it"),
    `expected single 4-space indent, got: ${JSON.stringify(out)}`
  );
  assert.ok(!out.includes("        //"), "indentation must not be doubled");
});

/* ── JS: decorative borders and literal examples must not be swallowed ── */

t("a decorative === border line stays its own line, in any style", () => {
  for (const ch of ["=", "-", "_", "*", "~"]) {
    const border = ch.repeat(20);
    const src = `// ${border}\n// TITLE\n// ${border}\n// body text continues\n// onto a second line\nconst x = 1;\n`;
    const out = cleanJs(src);
    const lines = out.split("\n");
    assert.strictEqual(lines[0], `// ${border}`, `border char ${ch} was merged`);
    assert.strictEqual(lines[2], `// ${border}`, `border char ${ch} was merged`);
  }
});

t("indented literal example lines after a field-like opener stay separate", () => {
  const src =
    "/**\n * Usage:\n *   cmd --check <file>   verify only\n *   cmd --write <file>   rewrite in place\n */\n";
  const out = cleanJs(src);
  const lines = out.split("\n");
  assert.strictEqual(lines[1], " * Usage:");
  assert.strictEqual(lines[2], " *   cmd --check <file>   verify only");
  assert.strictEqual(lines[3], " *   cmd --write <file>   rewrite in place");
});

t("a bulleted list still joins its own wrapped continuation", () => {
  const src =
    "// - first bullet point that\n//   wraps onto a second line\n// - second bullet, one line\nconst x = 1;\n";
  const out = cleanJs(src);
  assert.ok(out.includes("// - first bullet point that wraps onto a second line"));
  assert.ok(out.includes("// - second bullet, one line"));
});

t("a blank // line inside a run separates two paragraphs", () => {
  const src = "// first paragraph\n// continues here\n//\n// second paragraph starts\nconst x = 1;\n";
  const out = cleanJs(src);
  assert.strictEqual(
    out,
    "// first paragraph continues here\n//\n// second paragraph starts\nconst x = 1;\n"
  );
});

/* ── JS: a run of length 1 is a correct no-op ─────────────────────────── */

t("a single-line // comment is never touched", () => {
  const src = "// just one line, nothing to join\nconst x = 1;\n";
  const { text } = reflowJs(src);
  assert.strictEqual(text, src);
});

t("a trailing // comment sharing a line with code is never touched", () => {
  const src = "const x = 1; // trailing note\nconst y = 2;\n";
  const { text } = reflowJs(src);
  assert.strictEqual(text, src);
});

/* ── JS: a `//` inside a regex literal must never be read as a comment ── */

t("a regex literal containing // is not mistaken for a comment", () => {
  const src = "const r = /http:\\/\\//;\nconst y = 2;\n";
  const { text } = reflowJs(src);
  assert.strictEqual(text, src, "regex content must survive untouched");
});

/* ── JS: verify() must actually be able to fail ───────────────────────── */

t("reflow is idempotent on content with an odd leading-space count", () => {
  // Regression for a real non-idempotency bug: a comment line with exactly
  // one stray leading space (e.g. "//  (1) Strip a cosmetic...", doubled
  // space after `//`) fell into a gap between the join-at-indent-0 rule and
  // the old verbatim-at-indent->=2 rule, silently opening a NEW paragraph
  // instead of being preserved — and that paragraph's flush() trimmed the
  // stray space away, so a second pass classified the same content
  // differently than the first. Found by re-running --check against
  // already-written output in the real repo and getting a nonzero diff.
  const src =
    "// Two jobs:\n//  (1) first job description that is fairly long here\n//      continues wrapped onto this line\n// (2) second job\nconst x = 1;\n";
  const pass1 = reflowJs(src).text;
  const pass2 = reflowJs(pass1).text;
  assert.strictEqual(pass2, pass1, "a second reflow pass must be a no-op");
});

t("verifyJs rejects a dropped word", () => {
  const src = "// one two three\n// four five six\nconst x = 1;\n";
  const { blocks } = reflowJs(src);
  const corrupted = "// one two three four six\nconst x = 1;\n";
  const p = verifyJs(src, corrupted, blocks);
  assert.ok(p.length, "should have rejected a dropped word");
});

/* ── shell: heredoc bodies are never touched ──────────────────────────── */

t("a #-led line inside a heredoc body is not treated as a comment", () => {
  const src =
    "#!/usr/bin/env bash\ncat <<'EOF'\n# this is literal heredoc payload, not a comment\nEOF\necho done\n";
  const out = cleanSh(src);
  assert.strictEqual(out, src, "heredoc body must survive byte-identical");
});

/* ── shell: the backslash-continuation line-counter bug ──────────────── */

t("a backslash-continued command before a comment run doesn't desync line counting", () => {
  const src =
    'some_command --flag1 \\\n  --flag2 \\\n  --flag3\n# first comment line\n# second comment line\necho done\n';
  const out = cleanSh(src);
  assert.ok(
    out.includes("# first comment line second comment line"),
    `expected the two comment lines joined, got: ${JSON.stringify(out)}`
  );
});

t("a backslash-continuation inside a double-quoted string doesn't desync line counting", () => {
  const src = 'x="line one \\\ncontinues"\n# first comment line\n# second comment line\necho done\n';
  const out = cleanSh(src);
  assert.ok(out.includes("# first comment line second comment line"));
});

/* ── shell: single/double quotes spanning lines are left alone ───────── */

t("a multi-line single-quoted string is never touched, even if a line starts with #", () => {
  const src = "awk '\n# not a comment, this is inside the awk script\n{ print }\n' file.txt\n";
  const { text } = reflowSh(src);
  assert.strictEqual(text, src);
});

/* ── shell: run grouping / no-op cases ────────────────────────────────── */

t("a single-line # comment is never touched", () => {
  const src = "# just one line\necho hi\n";
  const { text } = reflowSh(src);
  assert.strictEqual(text, src);
});

t("the shebang line itself is never grouped with a following comment run", () => {
  const src = "#!/usr/bin/env bash\n# first real comment line\n# second real comment line\necho hi\n";
  const out = cleanSh(src);
  assert.ok(out.startsWith("#!/usr/bin/env bash\n"));
  assert.ok(out.includes("# first real comment line second real comment line"));
});

t("a trailing inline # comment sharing a line with code is never touched", () => {
  const src = "echo hi # trailing note\necho bye\n";
  const { text } = reflowSh(src);
  assert.strictEqual(text, src);
});

if (fails.length) {
  console.log(`${pass} passed, ${fails.length} FAILED\n`);
  for (const f of fails) console.log(`  ✗ ${f}`);
  process.exit(1);
} else {
  console.log(`${pass} passed, 0 failed`);
}
