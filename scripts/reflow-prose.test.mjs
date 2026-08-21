#!/usr/bin/env node
/**
 * reflow-prose.test.mjs — self-test for scripts/reflow-prose.mjs.
 *
 * The point of most of these cases is NOT that reflow works — it is that the VERIFIER can fail. A conservation check that cannot reject anything is worse than no check, because it manufactures confidence (the repo has been bitten by exactly that: six hook self-tests that nothing invoked, and a `find -newermt` gate that had never once worked). So the suite feeds `verify()` known-corrupt output and asserts it says so.
 *
 * Run: npm run test:reflow  (wired into npm test)
 */

import assert from "node:assert";
import { reflow, verify } from "./reflow-prose.mjs";

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

const clean = (src) => {
  const out = reflow(src);
  const p = verify(src, out);
  assert.deepStrictEqual(p, [], `expected clean, got: ${p.join(" | ")}`);
  return out;
};

/* ── the verifier must REJECT real corruption ─────────────────────────────── */

// Added 2026-08-20 after an unbalanced fence in a plan silently collapsed NINE code blocks — an entire module implementation — onto single lines, while verify() reported success. verify() compared fenced-block CONTENT, and under a mispairing it compared the same WRONG blocks before and after, so that comparison was vacuously equal. Counting fence LINES cannot be fooled that way.
t("verifier rejects an odd number of code fences", () => {
  const malformed = [
    "Some prose.", "", "```js", "const a = 1;", "```", "",
    "More prose.", "", "```",            // opened, never closed -> odd total
    "const b = 2;",
  ].join("\n");
  const problems = verify(malformed, malformed);
  assert.ok(
    problems.some((p) => /unbalanced code fences/.test(p)),
    `expected an unbalanced-fence problem, got: ${JSON.stringify(problems)}`
  );
});

// The falsifier for the check above: a BALANCED document must NOT trip it, or the guard fails every well-formed file and gets disabled — which is worse than not having it.
t("verifier does not flag a balanced document", () => {
  const fine = ["Prose.", "", "```js", "const a = 1;", "```", "", "More prose."].join("\n");
  assert.ok(!verify(fine, fine).some((p) => /unbalanced code fences/.test(p)));
});

t("verifier rejects a dropped word", () => {
  const before = "one two three four\nfive six seven";
  const after = "one two three four five seven";
  assert.ok(verify(before, after).length, "should have rejected a dropped word");
});

t("verifier rejects a heading dissolved into prose", () => {
  const before = "# Title\n\nbody text here";
  const after = "Title\n\nbody text here";
  assert.ok(verify(before, after).length, "should have rejected a lost heading");
});

t("verifier rejects a lost quote paragraph break", () => {
  // This is the exact corruption `dior text unwrap` caused in docs/legal/TERMS.md: the bare `>` separating two quoted paragraphs was swallowed, merging them.
  const before = "> first para\n>\n> second para";
  const after = "> first para second para";
  const p = verify(before, after);
  assert.ok(
    p.some((x) => x.includes("quote paragraph breaks")),
    `should have flagged the lost break, got: ${p.join(" | ")}`
  );
});

t("verifier rejects mutated fenced-code contents", () => {
  const before = "```js\nconst a = 1;\nconst b = 2;\n```";
  const after = "```js\nconst a = 1; const b = 2;\n```";
  assert.ok(verify(before, after).length, "should have rejected a reflowed fence");
});

t("the RENDER oracle catches what the structural checks cannot", () => {
  // An indented code block absorbed into a paragraph: same tokens, same heading / table / list / quote-break counts, and no fenced block involved — so every hand-written invariant passes. Only the CommonMark render differs. This is the case that justifies carrying the markdown-it dependency at all.
  const before = "intro\n\n    code()\n";
  const after = "intro code()\n";
  const p = verify(before, after);
  assert.ok(
    p.some((x) => x.includes("rendered HTML differs")),
    `render oracle missed it, got: ${p.join(" | ") || "(no problems)"}`
  );
});

t("verifier rejects a lost table row", () => {
  const before = "| a | b |\n|---|---|\n| 1 | 2 |";
  const after = "| a | b |\n|---|---|\n1 2";
  assert.ok(verify(before, after).length, "should have rejected a lost table row");
});

/* ── reflow behaviour ─────────────────────────────────────────────────────── */

t("joins a hard-wrapped paragraph", () => {
  assert.strictEqual(clean("alpha beta\ngamma delta"), "alpha beta gamma delta");
});

t("keeps paragraphs separate across a blank line", () => {
  assert.strictEqual(clean("one\ntwo\n\nthree\nfour"), "one two\n\nthree four");
});

t("joins a list item's continuation but not the next item", () => {
  const out = clean("- first item\n  continued here\n- second item");
  assert.strictEqual(out, "- first item continued here\n- second item");
});

t("does NOT absorb an unindented line into a list item", () => {
  // CommonMark lazy continuation: renders inside the item either way, so joining changes nothing today but destroys the author's block boundary forever. Real case: CLAUDE.md's "Full setup, the emoji/DB cloning, and the caveats:".
  const src = "- item text\n  indented continuation\nStandalone sentence here.";
  assert.strictEqual(clean(src), "- item text indented continuation\nStandalone sentence here.");
});

t("still joins an unindented continuation of a PLAIN paragraph", () => {
  // The ordinary hard-wrap case — the whole point of the migration.
  assert.strictEqual(clean("alpha beta\ngamma delta\nepsilon"), "alpha beta gamma delta epsilon");
});

t("keeps a legal-doc metadata block one field per line", () => {
  // The real regression: buildLegalPages.js reads this block ONE LINE PER FIELD, so joining it folded Version and "Applies to" into the rendered Effective value on the live site. CommonMark considers both forms identical.
  const src = "**Effective date:** 4 August 2026\n**Version:** 1.5\n**Applies to:** the Bot";
  assert.strictEqual(clean(src), src);
});

t("a field line still absorbs its own wrapped tail", () => {
  const src = "**Applies to:** the Dioreo Discord application and the website\nthese documents are published on";
  assert.strictEqual(
    clean(src),
    "**Applies to:** the Dioreo Discord application and the website these documents are published on"
  );
});

t("a paragraph merely opening with bold text still joins", () => {
  assert.strictEqual(clean("**Note:** first line\nsecond line"), "**Note:** first line second line");
});

t("leaves an indented code block alone after a blank line", () => {
  const src = "intro para\n\n    code line one\n    code line two\n\nafter";
  assert.strictEqual(clean(src), src);
});

t("preserves nested list indentation", () => {
  const out = clean("- outer\n    - inner one\n      wrapped\n    - inner two");
  assert.strictEqual(
    out,
    "- outer\n    - inner one wrapped\n    - inner two"
  );
});

t("leaves fenced code completely alone", () => {
  const src = "text\n\n```sh\nline one\nline two\n```\n\nmore";
  assert.strictEqual(clean(src), "text\n\n```sh\nline one\nline two\n```\n\nmore");
});

t("leaves table rows alone", () => {
  const src = "| a | b |\n|---|---|\n| 1 | 2 |";
  assert.strictEqual(clean(src), src);
});

t("leaves headings standing alone", () => {
  assert.strictEqual(clean("# Head\nbody one\nbody two"), "# Head\nbody one body two");
});

t("keeps an HTML comment on its own physical line", () => {
  // Required by the notes file's own convention — a record comment must stay one physical line and must never be folded into the bullet above it.
  const src = "- an item\n<!-- ANSWERED 2026-08-08 11:00 EDT (Claude): a note. -->\n- next";
  assert.strictEqual(clean(src), src);
});

t("does NOT tear a paragraph on a wrapped <placeholder>", () => {
  // Real lines from docs/db-deferred-list.md (cited by content — they carried line numbers until 2026-08-14 10:12 EDT, by which point both had rotted) — prose that merely wraps onto an angle bracket. A blanket /^\s*</ rule emitted these standalone.
  const a = clean("run the command (`git show\n<sha>:package.json` matched the tag name)");
  assert.strictEqual(a, "run the command (`git show <sha>:package.json` matched the tag name)");
  const b = clean("use `dior text unwrap\n<file> [--out <dir>]` to rejoin");
  assert.strictEqual(b, "use `dior text unwrap <file> [--out <dir>]` to rejoin");
});

t("DOES protect a genuine HTML block mid-paragraph", () => {
  // docs/archive/resolved-list.md:95 — a real <details> block with no blank line before it, so "not mid-paragraph" would have missed it.
  const src = "never clarified, so ask.\n<details><summary>original item</summary>";
  assert.strictEqual(clean(src), src);
});

t("preserves a genuine two-space hard break", () => {
  const out = clean("line one  \nline two");
  assert.ok(out.includes("  \n"), `hard break lost: ${JSON.stringify(out)}`);
});

t("passes front matter through untouched", () => {
  const src = "---\nkind: reference\nstatus: live\n---\n\nbody one\nbody two";
  assert.strictEqual(clean(src), "---\nkind: reference\nstatus: live\n---\n\nbody one body two");
});

/* ── blockquotes: the case the older tool got wrong ───────────────────────── */

t("joins within a quoted paragraph", () => {
  assert.strictEqual(clean("> alpha beta\n> gamma"), "> alpha beta gamma");
});

t("PRESERVES the bare > separating two quoted paragraphs", () => {
  const out = clean("> first para\n> wrapped\n>\n> second para");
  assert.strictEqual(out, "> first para wrapped\n>\n> second para");
});

t("keeps a heading inside a quote from dissolving", () => {
  const out = clean("> ### Inner Head\n> body one\n> body two");
  assert.strictEqual(out, "> ### Inner Head\n> body one body two");
});

t("keeps a list inside a quote itemised", () => {
  const out = clean("> - one\n>   wrapped\n> - two");
  assert.strictEqual(out, "> - one wrapped\n> - two");
});

/* ── idempotence: running it twice must change nothing the second time ────── */

t("is idempotent", () => {
  const src =
    "# H\n\npara one\nwrapped\n\n- item\n  cont\n\n> quoted\n> more\n>\n> second\n\n| a | b |\n|---|---|\n";
  const once = reflow(src);
  assert.strictEqual(reflow(once), once, "second pass changed the output");
});

/* ── report ───────────────────────────────────────────────────────────────── */

if (fails.length) {
  console.error(`reflow-prose: ${pass} passed, ${fails.length} FAILED`);
  for (const f of fails) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`reflow-prose: ${pass}/${pass} checks passed`);
