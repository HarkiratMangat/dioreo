#!/usr/bin/env node
/**
 * buildLegalPages.js — renders docs/legal/*.md into styled, self-contained HTML
 * in public/legal/, for hosting on Cloudflare Pages.
 *
 * WHY A BUILD SCRIPT AND NOT HAND-WRITTEN HTML:
 * The Markdown files are the legally operative source of truth (PRIVACY.md's own
 * Appendix C points readers at them, and the ToS cites section numbers). Keeping a
 * hand-maintained HTML copy guarantees the two drift apart, and a privacy policy
 * that contradicts itself across two published URLs is worse than having none. So
 * the .md stays canonical and the HTML is generated. Re-run after ANY edit:
 *
 *     node scripts/buildLegalPages.js
 *
 * WHY A HAND-ROLLED PARSER AND NOT marked:
 * This repo carries no Markdown dependency, and NOTICE §3 commits us to re-auditing
 * the dependency tree (for copyleft) on every addition. The input is a closed set —
 * files we author ourselves — so a parser covering exactly the constructs they use
 * is cheaper and lower-risk than a new supply-chain entry. It is NOT a
 * general-purpose Markdown implementation and should not be reused as one.
 * verify() below guards the real risk (silently dropped content).
 *
 * TWO PARSERS, TWO TEMPLATES:
 *   parseBlocks()     Markdown  → docs/legal/TERMS.md, PRIVACY.md, and the two
 *                               root invitation docs
 *   parsePlainLegal() plain text → LICENSE and NOTICE, whose structure is carried
 *                               entirely by === banners and indentation
 *   shell()           the numbered legal set (squared, cold, margin index)
 *   warmShell()       contributing/contributors (rounded, warm, unnumbered)
 *
 * ⚠️ The CSS lives inside JS template literals, so a BACKTICK anywhere in a
 * stylesheet comment terminates the string and breaks the build with an error
 * pointing at CSS. It happened twice while this was written. Run
 * `node --check scripts/buildLegalPages.js` before a full run.
 *
 * DESIGN DIRECTION — "spec sheet", not "docs site":
 * The first version of this page was a gradient header over rounded cards in a
 * system sans: the shape you get for any product, which is why it read as a parked
 * domain. This one is built from the product's own world. Dior's Builds is a
 * Gunsmith bot — weapon spec sheets, attachment slots, numbered builds — so the
 * page borrows that typographic system rather than a generic dark-SaaS one:
 *
 *   · Three type roles doing distinct jobs — heavy sans for display, a SERIF for
 *     body prose (unusual here, and the reason 4,000 words stay readable), and
 *     monospace for every label, index, and table cell.
 *   · Squared corners and hairline rules. A document, not an app card.
 *   · Section numbers live in the margin as a real column, because these documents
 *     genuinely cite each other by number — the numbering is the reference system,
 *     not decoration.
 *   · SIGNATURE: every "§N" in the prose is a working link (see linkifyRefs), and
 *     the left rail tracks which section you are in. A legal document whose
 *     cross-references actually resolve.
 *
 * Cloudflare Pages setup: no build command, output directory public.
 * No API token, and nothing in .env — Pages deploys via dashboard Git integration
 * or wrangler login. A Cloudflare credential must never enter the bot's runtime env.
 */

const fs = require('fs');
const path = require('path');
// The third page family. See the header of that file for why it is a separate
// family and why the dependency runs one way (this file hands it CHROME).
const { parseChronicle, chronicleShell } = require('./lib/chronicle');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'docs', 'legal');
const OUT = path.join(ROOT, 'public', 'legal');

// Brand palette, mirrored from the commands' PRESET_ACCENT values so the legal
// pages read as part of the product. Values copied deliberately rather than
// required from commands/ — those modules pull in discord.js and a live config,
// which a static docs build must not depend on. If a PRESET_ACCENT is ever
// re-picked, update it here too.
const BRAND = {
    plum: '#6B4E7D',      // Plum Fortune   — commands/draws.js
    harbor: '#3A5068',    // Slate Harbor   — commands/calendar.js
    gold: '#F2C230',      // Patch Gold     — commands/patchnotes.js
    emerald: '#1F8A5E',   // CP Emerald     — commands/drawprices.js
    amber: '#F2994A',     // Neon Amber     — commands/seasonend.js
    teal: '#17A2A2',      // Cyber Teal     — commands/timestamp.js

    // SITE-ONLY, not PRESET_ACCENT values. The four legal pages need four
    // distinguishable hues, and the first attempt used gold for the licence and
    // harbor for the notice — different SHADES of the amber and teal already
    // taken by terms and privacy, which read as the same two colours twice.
    // Separated by hue, not lightness.
    violet: '#9B6BE3',
    crimson: '#FF5264',

    // The same argument again, one level out. The two warm pages first used
    // emerald and gold, which are neighbours of the teal and amber already
    // taken by privacy and terms — so the invitation pages read as more of the
    // legal set rather than as something else.
    periwinkle: '#8B9BFF',
    citron: '#F8FF4A',

    /* The LANDING page's own accent, added 2026-08-03 15:52 EDT. It used to be
       BRAND.amber — the identical value to Terms — so the index and the first
       instrument in the series wore the same colour and the landing page read
       as a page of the set rather than as its cover.
       ⚠️ ITS PLACEMENT IS FORCED, and it is worth knowing why before "improving"
       it. The arc between crimson (354°) and amber (28°) is only 34° wide, and
       coral has to live inside it, so the best achievable separation is the
       midpoint: 11° gives 17° of clearance each way and every other choice in
       that region gives less. That is under the 30° line the six tab hues are
       held to — deliberately, because this hue is NEVER a tab. It appears as
       page chrome and as the liquid cursor on a page whose own nav has no
       indicator, so it is never seen at tab size beside crimson. The other
       direction was checked and is worse: 40-50° sits ~12° from amber and ~14°
       from citron at once. */
    coral: '#FF7D5C',

    /* ⚠️ THE SIX SITE HUES, MEASURED — and the only number that matters is the
       TIGHTEST PAIR, because a set is exactly as distinct as its closest two.
       Sorted: amber 28° · citron 62° · teal 180° · periwinkle 232° ·
       violet 264° · crimson 354°.
       Gaps around the wheel: 34 · 118 · 52 · 32 · 90 · 34. The binding
       constraint is periwinkle against violet at 32°, which clears the 30°
       collision line but not by much — under 30 two accents read as the same
       colour at tab size, whatever their names say.
       Chosen 2026-08-01 18:01 EDT with the Accent Lab
       (/Applications/Claude Code/design-tools/accent-lab/), which scores every
       combination on that tightest gap and re-measures WCAG AA in both themes.
       ⚠️ Do NOT change one of these in isolation — moving any single hue can
       collapse a gap somewhere else on the wheel. Re-score the whole set. */

    // ── the chronicle family: NOT part of this palette ──────────────────────
    // These three are the Armory Terminal's signal colours, and they deliberately
    // sit OUTSIDE the brand system above. That was Harkirat's own call in the
    // original changelog design (memory `project_changelog_redesign`): the record
    // is a different world — a gunmetal ordnance terminal — and picking its colours
    // from the bot's palette is exactly what would have made it read as another
    // legal page in a new accent. They live here only so the nav tabs, the landing
    // page cards and the page itself cannot disagree about a page's signal.
    tracer: '#FF9E3D',    // What's New  — PATCH NOTES operator (the original signal)
    phosphor: '#7CE38B',  // Changelog   — FIELD ENGINEER operator
    ice: '#8FB8FF'        // Devlog      — LOG KEEPER operator
};


// `kind` selects the parser: 'md' for the Markdown sources in docs/legal, 'text'
// for the plain-text legal instruments at the repo root. `root: true` means the
// source sits at the repo root rather than in docs/legal.
const PAGES = [
    {
        file: 'TERMS.md', kind: 'md', out: 'terms.html', title: 'Terms of Service',
        short: 'Terms', kicker: 'Agreement',
        accent: BRAND.amber, glow: BRAND.plum,
        blurb: 'What the bot does, what you agree to, and the limits of what we promise.'
    },
    {
        file: 'PRIVACY.md', kind: 'md', out: 'privacy.html', title: 'Privacy Policy',
        short: 'Privacy', kicker: 'Data', 
        accent: BRAND.teal, glow: BRAND.emerald,
        blurb: 'Every field stored about you, where it lives, and how to have it deleted.'
    },
    {
        // The licence is rendered as a THIRD page for readability, but the verbatim
        // plain-text copy at /LICENSE stays the authoritative instrument and this
        // page says so in its masthead. See the note above buildCompanions().
        file: 'LICENSE', kind: 'text', root: true, out: 'license.html',
        title: 'Source-Available License',
        short: 'License', kicker: 'Licence',
        accent: BRAND.violet, glow: BRAND.plum,
        blurb: 'Read it, study it, run it on your own machine. Source-available, not open source.'
    },
    {
        // Incorporated into LICENSE by reference (§7.1), so it is an operative
        // document and belongs with the other three rather than off to one side.
        file: 'NOTICE', kind: 'text', root: true, out: 'notice.html',
        title: 'Notices & Attributions',
        short: 'Notice', kicker: 'Attribution', 
        accent: BRAND.crimson, glow: BRAND.plum,
        blurb: 'Every dependency and its licence, the marks that are not ours, and where AI helped.'
    }
];

/**
 * The two pages that are NOT legal instruments, kept out of PAGES on purpose.
 *
 * PAGES drives the numbered switcher and the numbered list on the landing page —
 * the "01 / 02 / 03" system. These two must not appear there, because the number
 * series is what tells a reader "these are the documents that bind you", and an
 * invitation to help is not one of those.
 *
 * They get their own template (warmShell) with a deliberately inverted visual
 * vocabulary: the legal pages are squared corners, hairline rules, cold graphite
 * and a numbered margin index — the grammar of obligation. These are rounded, warm,
 * glowing, unnumbered. Same three type roles, same palette family, so the site
 * stays one site; opposite posture, so the two kinds never feel interchangeable.
 */
const EXTRA_PAGES = [
    {
        file: 'CONTRIBUTING.md', kind: 'md', root: true, out: 'contributing.html',
        title: 'Contributing', short: 'Contributing',
        kicker: 'Join in', accent: BRAND.periwinkle, glow: '#C3CBFF',
        lede: 'Bug reports, security findings, ideas, code — all of it welcome, and all of it credited.',
        badge: 'Open to anyone',
        blurb: 'How to report a bug, send a fix, and what the CLA actually asks of you.'
    },
    {
        file: 'CONTRIBUTORS.md', kind: 'md', root: true, out: 'contributors.html',
        title: 'Contributors', short: 'Contributors',
        kicker: 'Roll call', accent: BRAND.citron, glow: '#FBFFB0',
        lede: 'Everyone who has made this better, credited under the name they chose.',
        // "Your name goes here" read as a sales pitch on a page whose actual
        // subject is that crediting is a binding obligation under LICENSE §5.6.
        // This says the same thing the page does.
        badge: 'Credit, in writing',
        blurb: 'Who helped build this, and how credit works. Bug reports count.'
    }
];

/**
 * The THIRD page family: the release history and the devlog.
 *
 * Rendered by scripts/lib/chronicle.js, which explains at length why this is a new
 * family rather than a reuse of either existing one, and why the three pages share
 * one skeleton with three voices. The short version: a record of what happened is
 * neither an instrument (PAGES) nor an invitation (EXTRA_PAGES), and the three
 * sources differ in register rather than in structure.
 *
 * These render into public/changelog/ rather than public/legal/, which is what the
 * `dir` field carries. Everything else on the site is one flat directory, so `dir`
 * defaults to 'legal' and only these three set it — see hrefTo().
 *
 * `docs: true` means the source sits in docs/ rather than docs/legal/ or the repo
 * root, which is the third and last source location sourcePath() has to know about.
 */
const CHRONICLE_PAGES = [
    {
        file: 'CHANGELOG-SUMMARY.md', kind: 'md', docs: true, dir: 'changelog',
        out: 'index.html', voice: 'broadcast',
        title: "What's New", short: "What's New", kicker: 'Releases',
        accent: BRAND.tracer, glow: '#FFD9A8',
        lede: 'Every update to the bot, in plain language — what changed and when.',
        railLabel: 'Releases',
        blurb: 'What changed in each release of Dior’s Builds, in plain language.'
    },
    {
        file: 'CHANGELOG.md', kind: 'md', docs: true, dir: 'changelog',
        out: 'detailed.html', voice: 'record',
        title: 'Changelog', short: 'Changelog', kicker: 'The record',
        accent: BRAND.phosphor, glow: '#BFF5CC',
        lede: 'The full technical history: one entry per merged pull request, with the reasoning kept in.',
        railLabel: 'Versions',
        blurb: 'The detailed, developer-facing release history.'
    },
    {
        file: 'DEVLOG.md', kind: 'md', docs: true, dir: 'changelog',
        out: 'devlog.html', voice: 'notebook',
        title: 'Devlog', short: 'Devlog', kicker: 'The journey',
        accent: BRAND.ice, glow: '#C9DDFF',
        lede: 'The story behind the bot — the bugs, the dead ends, and what each one taught us.',
        railLabel: 'Entries',
        blurb: 'Discoveries, real root causes, the things we walked back, and the lessons.'
    }
];

/* Every page on the site, in nav order. Several places need "all of them" and each
   used to spell out its own [...PAGES, ...EXTRA_PAGES], which is how a new family
   ends up wired into four of five places. */
const ALL_PAGES = [...PAGES, ...EXTRA_PAGES, ...CHRONICLE_PAGES];

const dirOf = p => p.dir || 'legal';

/**
 * A relative href from one page to another.
 *
 * Every link on the site used to be `./name.html`, which was correct while there
 * was exactly one output directory. There are two now. Relative rather than
 * root-absolute on purpose: the local preview (`python3 -m http.server --directory
 * public`) and any `file://` spot-check both keep working, and Cloudflare Pages
 * serves the tree as-is either way. linkAudit() resolves every one of these against
 * the real deploy tree, so a mistake here fails the build rather than the site.
 */
const hrefTo = (target, from) => {
    const a = dirOf(from), b = dirOf(target);
    // The landing page of a directory is addressed as the directory itself, so the
    // published URL is /changelog/ rather than /changelog/index.html.
    const leaf = target.out === 'index.html' && b !== a ? '' : target.out;
    if (a === b) return './' + (target.out === 'index.html' ? '' : target.out);
    return '../' + b + '/' + leaf;
};

/* ─────────────────────────── inline formatting ─────────────────────────── */

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Exactly what the deployed site contains, relative to a page inside legal/.
// Keep this in step with build()/buildCompanions() — if a new file starts being
// published, add it here or its cross-references stay inert text.
const PUBLISHED_TARGETS = new Set([
    'terms.html', 'privacy.html', 'license.html', 'notice.html', 'index.html', '',
    'contributing.html', 'contributors.html',
    '../LICENSE', '../NOTICE',
    // The chronicle family, as addressed from a page inside changelog/ …
    'detailed.html', 'devlog.html',
    // … and from a page inside legal/.
    '../changelog/', '../changelog/detailed.html', '../changelog/devlog.html',
]);

/**
 * Source filename → published filename, for the pages whose output is not simply
 * the source name with a new extension.
 *
 * The three chronicle sources cross-reference each other by their real filenames
 * ("see [CHANGELOG-SUMMARY.md](CHANGELOG-SUMMARY.md)"), and the .md→.html rewrite
 * turns those into CHANGELOG-SUMMARY.html — which is not what gets written, because
 * the summary is that directory's landing page. Without this map every one of those
 * references degrades to inert text, and NOTHING reports it: linkAudit() has no href
 * to resolve, and crossRefAudit() resolves by basename against the deploy tree, where
 * CHANGELOG-SUMMARY.html legitimately does not exist. That is the same silent failure
 * mode that left Terms' and Privacy's references to each other dead on the live site.
 */
const PAGE_ALIASES = new Map([
    ['changelog-summary.html', 'index.html'],
    ['changelog.html', 'detailed.html'],
    ['devlog.html', 'devlog.html'],
]);
// Case-insensitive lookup that returns the CORRECTLY-CASED published name.
//
// The sources write their cross-links as [Privacy Policy](PRIVACY.md) — uppercase,
// matching the filename on disk — and the .md→.html rewrite preserved that case,
// producing PRIVACY.html. PUBLISHED_TARGETS holds lowercase privacy.html, so the
// set lookup missed and Terms' references to Privacy (and Privacy's to Terms)
// silently degraded to inert grey text while ../LICENSE, which happens to match
// exactly, stayed a live link. linkAudit() cannot see this class of fault at all:
// an inert span has no href, so there is nothing for it to resolve and fail on.
const PUBLISHED_MAP = new Map([...PUBLISHED_TARGETS].map(t => [t.toLowerCase(), t]));
const resolvePublished = href => {
    const [p, hash] = href.split('#');
    // Aliases first: a source name that renders to a DIFFERENT output name must be
    // translated before the allowlist is consulted, or it misses and goes inert.
    // Applied on the basename so it works from either directory.
    const lower = p.toLowerCase();
    const aliased = PAGE_ALIASES.has(lower.replace(/^.*\//, ''))
        ? lower.replace(/[^/]+$/, PAGE_ALIASES.get(lower.replace(/^.*\//, '')))
        : lower;
    const hit = PUBLISHED_MAP.get(aliased);
    return hit === undefined ? null : hit + (hash ? '#' + hash : '');
};

/**
 * Prefix applied to relative links for the page currently being rendered.
 *
 * The Markdown sources sit at two different depths but all render into
 * public/legal/. docs/legal/*.md links out with `../../LICENSE`, which the rewrite
 * below folds to `../LICENSE`. The two ROOT sources (CONTRIBUTING.md,
 * CONTRIBUTORS.md) link out with a bare `LICENSE` — correct from the repo root and
 * wrong by exactly one level once rendered a directory down. Every such link was
 * silently degrading to inert text, which is why the Contributing page discussed
 * the licence in four places and linked it in none.
 *
 * Module-level rather than threaded through parseBlocks → inline, which would mean
 * a parameter on every block type for one value. build() sets it per page.
 */
let LINK_BASE = '';

function inline(s) {
    // Code spans are extracted FIRST and reinserted last, so their contents are
    // never treated as markup (a literal `**` inside code must stay literal).
    // The sentinel must be a character the source can never contain and that
    // esc() leaves alone — NUL qualifies on both counts. A space-delimited
    // ` N ` sentinel was tried first and was wrong: it also matches any bare
    // number in ordinary prose ("30 days", "§ 4"), which then resolves to an
    // out-of-range index and throws.
    const codes = [];
    s = s.replace(/`([^`]+)`/g, (_, c) => `\x00${codes.push(c) - 1}\x00`);

    s = esc(s);
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, h) => {
        const ext = /^https?:|^mailto:/.test(h);
        if (ext) return `<a href="${h}" target="_blank" rel="noopener noreferrer">${t}</a>`;
        // .md cross-links become .html so they resolve in the built site
        const href = h.replace(/\.md(#.*)?$/i, '.html$1').replace(/^\.\.\/\.\.\//, '../');
        // Only a handful of targets are actually deployed. Everything else the
        // source markdown points at — CLAUDE.md, ROADMAP.md, the model files, the
        // rules files — exists only in the repo, which a reader may not be able to
        // see (and the repo may be private at any time). Emitting those as links
        // publishes guaranteed 404s inside a legal document, so they degrade to
        // plain text instead. Verified by the build's own link audit, which found
        // seven dead links the first time this ran.
        // RESOLVE, then lift — not lift, then resolve.
        //
        // A blanket LINK_BASE prefix on every root-relative link was wrong: the two
        // root-authored pages both render into legal/, so CONTRIBUTORS.md is a
        // SAME-directory neighbour and ../CONTRIBUTORS.html pointed out of the tree.
        // Only root files published verbatim beside legal/ (LICENSE, NOTICE) need the
        // extra level. Asking the allowlist which of the two a target actually is
        // settles it without special-casing filenames.
        const pub = resolvePublished(href)
            || (LINK_BASE ? resolvePublished(LINK_BASE + href) : null);
        return pub
            ? `<a href="${pub}">${t}</a>`
            : `<span class="ref">${t}</span>`;
    });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s.,;:)]|$)/g, '$1<em>$2</em>');
    s = s.replace(/\x00(\d+)\x00/g, (m, i) =>
        codes[+i] === undefined ? m : `<code>${esc(codes[+i])}</code>`);
    return s;
}

const slug = s => s.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');

// Headings in these documents are numbered, and the documents cite each other by
// that number constantly ("see §15", "§4.11 applies"). So the number is the real
// identifier, not the prose — deriving the id from it makes every cross-reference
// linkable and stable even if a heading is later reworded.
function splitHeading(raw) {
    const m = raw.match(/^(\d+[A-Za-z]?(?:\.\d+[a-z]?)?)\.?\s+(.*)$/);
    if (m) return { num: m[1], text: m[2], id: 's-' + m[1].toLowerCase() };
    return { num: null, text: raw, id: slug(raw) };
}

/**
 * Turns every "§N" in the rendered body into a link to that section — the payoff
 * of the id scheme above. Operates only on text nodes (never inside a tag or an
 * existing anchor), so it can't corrupt markup or nest links.
 */
function linkifyRefs(html, ids) {
    const parts = html.split(/(<[^>]+>)/);
    let inAnchor = false;
    return parts.map(seg => {
        if (seg.startsWith('<')) {
            if (/^<a\b/i.test(seg)) inAnchor = true;
            else if (/^<\/a>/i.test(seg)) inAnchor = false;
            return seg;
        }
        if (inAnchor) return seg;
        seg = seg.replace(/§\s?(\d+[A-Za-z]?(?:\.\d+[a-z]?)?)/g, (whole, n) => {
            const id = 's-' + n.toLowerCase();
            return ids.has(id) ? `<a class="xref" href="#${id}">§${n}</a>` : whole;
        });
        // The plain-text licence spells its cross-references out in full
        // ("under Section 4.11", "notices under Section 14.7") rather than with §.
        // Same payoff, different spelling, so it is handled here rather than by
        // rewriting the source — the source is the authoritative wording.
        return seg.replace(/\bSection\s(\d+[A-Za-z]?(?:\.\d+[a-z]?)?)/g, (whole, n) => {
            const id = 's-' + n.toLowerCase();
            return ids.has(id) ? `<a class="xref" href="#${id}">Section&nbsp;${n}</a>` : whole;
        });
    }).join('');
}

/* ───────────────────────────── block parsing ───────────────────────────── */

function parseBlocks(md) {
    // HTML comments are stripped HERE, at the single funnel every Markdown source
    // passes through, rather than per caller.
    //
    // This is not cosmetic. CONTRIBUTORS.md keeps its "format for new entries"
    // template inside a comment, complete with a worked example row. Without this
    // the comment rendered as visible content and the live credits page listed a
    // fabricated contributor (`@example`, "Fixed pagination crash on 2-page
    // loops", v2.42.0) as though it were real. verify() only caught it as a side
    // effect of the surrounding prose no longer being contiguous.
    md = md.replace(/<!--[\s\S]*?-->/g, '');
    const lines = md.split('\n');
    const out = [];
    const toc = [];
    let i = 0;

    const isListStart = l => /^\s*([-*]|\d+\.)\s+/.test(l);

    while (i < lines.length) {
        const line = lines[i];
        if (!line.trim()) { i++; continue; }

        // ── fenced code block ──
        // Added 2026-07-29 23:05 EDT. TERMS.md and PRIVACY.md contain no fences, so
        // this parser never needed them; publishing CONTRIBUTING.md widened the
        // input set and the omission surfaced as literal ``` markers on the page,
        // the language tag absorbed into the code, and multi-line blocks flattened
        // onto one line. Note verify() still reported 100% throughout — every WORD
        // was present, just structured wrongly. Handle the fence BEFORE the <hr>
        // rule below, which would otherwise not match but ordering here is load-
        // bearing for any future fence style.
        const fence = line.match(/^\s*```+\s*([\w-]*)\s*$/);
        if (fence) {
            const lang = fence[1];
            const buf = [];
            i++;
            while (i < lines.length && !/^\s*```+\s*$/.test(lines[i])) { buf.push(lines[i]); i++; }
            i++; // consume the closing fence
            out.push(
                `<pre class="code"${lang ? ` data-lang="${esc(lang)}"` : ''}>` +
                `<code>${esc(buf.join('\n'))}</code></pre>`
            );
            continue;
        }

        if (/^\s*(-{3,}|={3,}|\*{3,})\s*$/.test(line)) { out.push('<hr>'); i++; continue; }

        const h = line.match(/^(#{1,6})\s+(.*)$/);
        if (h) {
            const lvl = h[1].length;
            const raw = h[2].trim();
            if (lvl === 1) { out.push(`<h1>${inline(raw)}</h1>`); i++; continue; }

            const { num, text, id } = splitHeading(raw);
            if (lvl === 2) toc.push({ id, num, text, sub: false });
            if (lvl === 3) toc.push({ id, num, text, sub: true });

            // The index sits in the margin as its own element rather than inline
            // in the title, so the numbering column stays optically aligned down
            // the whole document.
            const chip = num ? `<span class="idx" aria-hidden="true">${num}</span>` : '';
            out.push(
                `<h${lvl} id="${id}" class="${num ? 'numbered' : 'plain'}">${chip}` +
                `<span class="ht">${inline(text)}</span>` +
                `<a class="anchor" href="#${id}" data-tip="Link to section" aria-label="Link to this section">¶</a></h${lvl}>`
            );
            i++; continue;
        }

        // table
        if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
            const cells = r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
            const head = cells(line);
            i += 2;
            const rows = [];
            while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(cells(lines[i])); i++; }
            // ⚠️ data-label is what makes the narrow-screen stacked layout possible: below
            // 620px the <thead> is taken out of the visual flow and every cell reprints its
            // own column name from this attribute. Derived from the RAW source cell with
            // markdown emphasis stripped, never from inline()'s HTML — an attribute cannot
            // carry markup, so a <code> span in a header would reach the page as visible
            // escaped angle brackets. Quotes are escaped here because esc() deliberately
            // does not: everywhere else it feeds text content, where a quote is harmless.
            const labelOf = c => esc(c.replace(/`|\*\*|__|(?<![A-Za-z0-9])[*_](?![A-Za-z0-9])/g, '').trim())
                .replace(/"/g, '&quot;');
            // ⚠️ THE ROLES ARE REDUNDANT ON DESKTOP AND LOAD-BEARING ON A PHONE. The
            // narrow-screen rules set display:block on the table, its groups, its rows and
            // its cells, and a browser drops the implicit table semantics the moment it
            // stops laying the element out as a table — so a screen reader would read four
            // orphaned strings with no column names attached. Re-declaring the same roles
            // the elements already have natively costs nothing where the layout is intact
            // and is what keeps the header association alive where it is not.
            out.push(
                '<div class="tw"><table role="table"><thead role="rowgroup"><tr role="row">' +
                head.map(c => `<th role="columnheader" scope="col">${inline(c)}</th>`).join('') +
                '</tr></thead><tbody role="rowgroup">' +
                rows.map(r => '<tr role="row">' + r.map((c, ci) =>
                    `<td role="cell" data-label="${labelOf(head[ci] || '')}">${inline(c)}</td>`).join('') + '</tr>').join('') +
                '</tbody></table></div>'
            );
            continue;
        }

        // blockquote (callout)
        if (/^\s*>/.test(line)) {
            const buf = [];
            while (i < lines.length && /^\s*>/.test(lines[i])) { buf.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
            const inner = parseBlocks(buf.join('\n')).html;
            // Documents use ⚠️ / 🔴 / >>> to mark genuinely load-bearing warnings;
            // those get the caution treatment, ordinary asides stay quiet.
            const warn = /⚠️|🔴|>>>/.test(buf.join(' ')) ? ' warn' : '';
            out.push(`<blockquote class="callout${warn}">${inner}</blockquote>`);
            continue;
        }

        // lists
        if (isListStart(line)) {
            const ordered = /^\s*\d+\./.test(line);
            const items = [];
            while (i < lines.length) {
                if (isListStart(lines[i])) {
                    items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, ''));
                    i++;
                    while (i < lines.length && lines[i].trim() && !isListStart(lines[i]) &&
                           /^\s{2,}/.test(lines[i]) && !/^\s*\|/.test(lines[i])) {
                        items[items.length - 1] += ' ' + lines[i].trim();
                        i++;
                    }
                } else if (!lines[i].trim() && i + 1 < lines.length && isListStart(lines[i + 1])) {
                    i++;
                } else break;
            }
            const tag = ordered ? 'ol' : 'ul';
            out.push(`<${tag}>` + items.map(t => `<li>${inline(t)}</li>`).join('') + `</${tag}>`);
            continue;
        }

        // paragraph — join soft-wrapped lines
        const buf = [];
        while (i < lines.length && lines[i].trim() && !/^#{1,6}\s/.test(lines[i]) && !/^\s*>/.test(lines[i]) &&
               !isListStart(lines[i]) && !/^\s*\|/.test(lines[i]) && !/^\s*(-{3,}|={3,})\s*$/.test(lines[i])) {
            buf.push(lines[i].trim()); i++;
        }
        if (buf.length) out.push(`<p>${inline(buf.join(' '))}</p>`);
    }

    // `blocks` is the same content as `html`, un-joined. warmCompose() needs the
    // top-level block boundaries to group sections, and it must NOT recover them by
    // splitting `html` on newlines: fenced code blocks and blockquotes both contain
    // embedded newlines, so that split would tear them apart mid-block.
    return { html: out.join('\n'), toc, blocks: out };
}

/* ─────────────────── plain-text legal instruments (LICENSE) ─────────────── */

/**
 * Inline handling for PLAIN TEXT sources. Deliberately NOT inline().
 *
 * LICENSE is not Markdown: a *, _, [ or backtick in it is a literal
 * character of the operative wording, so interpreting any of them as markup would
 * silently rewrite a legal instrument. This escapes, auto-links bare URLs and
 * email addresses, and does nothing else.
 *
 * In particular it does NOT prettify: -- stays --, (c) stays (c). That is
 * a considered choice, not an oversight — verify() normalises punctuation away,
 * so a character substitution here would pass every check while leaving the
 * styled page and the authoritative /LICENSE textually different. The cheapest way
 * to guarantee they agree is to not transform anything.
 */
function inlineText(s) {
    s = esc(s);
    // URLs first, so an address inside a URL isn't also matched as an email.
    // Trailing sentence punctuation is excluded from the href.
    s = s.replace(/(https?:\/\/[^\s<)]+?)([.,;:)]*)(?=\s|$)/g,
        (_, url, tail) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>${tail}`);
    s = s.replace(/(^|[\s(])([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g,
        (_, pre, mail) => `${pre}<a href="mailto:${mail}">${mail}</a>`);
    return s;
}

/**
 * Parses the plain-text licence into the same {html, toc} shape parseBlocks()
 * returns, so both feed one template.
 *
 * A HEADING IS A LINE BETWEEN TWO === BANNERS — nothing else. The obvious
 * alternative (treat ALL-CAPS lines as titles) is wrong here and would have
 * corrupted the document: §10 NO WARRANTY and §11 LIMITATION OF LIABILITY are
 * multi-line all-caps *prose*, as warranty disclaimers conventionally are, and 17
 * of those lines match a caps-title test. The banner rule was checked against the
 * whole file: 38 banner lines, exactly 19 headings, no false positives.
 *
 * Everything else is distinguished by indentation, which this document uses
 * consistently:
 *   col 0 N.M  Lead-in. body  a numbered clause      → <h3> + margin index
 *   indent 5                    clause body/continuation
 *   indent 7 (a) … / 11       lettered sub-items
 *   indent 4 - … / 6          bullet list (the plain-English summary)
 *   indent 4 (no bullet)        an address or identifier block → <pre>
 *   col 0 prose                 an ordinary paragraph
 */
function parsePlainLegal(txt) {
    const lines = txt.split('\n');
    const out = [];
    const toc = [];
    const isBanner = s => /^={3,}$/.test((s || '').trim());
    const indentOf = s => s.match(/^ */)[0].length;
    let i = 0;

    // The all-caps disclaimer paragraphs are real prose, but a wall of capitals in
    // a serif at reading size is punishing. They get their own class so CSS can
    // set them smaller and looser instead of dropping them to sentence case —
    // which would alter the document. Legal convention is that the capitals ARE
    // the emphasis, so they are preserved and made survivable.
    const isShout = t => {
        const letters = t.replace(/[^A-Za-z]/g, '');
        return letters.length > 40 &&
            letters.replace(/[^A-Z]/g, '').length / letters.length > 0.9;
    };
    const para = buf => {
        const t = buf.join(' ').trim();
        if (t) out.push(`<p${isShout(t) ? ' class="shout"' : ''}>${inlineText(t)}</p>`);
        buf.length = 0;
    };

    while (i < lines.length) {
        const line = lines[i];

        // ── heading: banner / one-to-three title lines / banner ──
        // NOTICE wraps some titles across two lines, so the closing banner is
        // located rather than assumed to be at i+2. Without this the `===` rules
        // fall through to the paragraph branch and print as literal equals signs.
        if (isBanner(line)) {
            let j = i + 1;
            while (j < lines.length && j <= i + 3 && (lines[j] || '').trim() && !isBanner(lines[j])) j++;
            if (j > i + 1 && isBanner(lines[j])) {
                const raw = lines.slice(i + 1, j).map(s => s.trim()).join(' — ');
                const { num, text, id } = splitHeading(raw);
                toc.push({ id, num, text, sub: false });
                const chip = num ? `<span class="idx" aria-hidden="true">${num}</span>` : '';
                out.push(
                    `<h2 id="${id}" class="${num ? 'numbered' : 'plain'}">${chip}` +
                    `<span class="ht">${inlineText(text)}</span>` +
                    `<a class="anchor" href="#${id}" data-tip="Link to section" aria-label="Link to this section">¶</a></h2>`
                );
                i = j + 1;
                continue;
            }
            // A banner with no closing partner is decoration, not a heading. It
            // MUST still be consumed HERE: the col-0 paragraph loop below excludes
            // banner lines by design, so falling through without advancing `i`
            // spins forever. It did — the build hung outright on NOTICE.
            i++;
            continue;
        }
        if (!line.trim()) { i++; continue; }

        // ── numbered clause at col 0: "4.2  Distribution. Distribute, …" ──
        const cl = line.match(/^(\d+[A-Z]?\.\d+)\s{1,3}(.*)$/);
        if (cl) {
            const id = 's-' + cl[1].toLowerCase();
            toc.push({ id, num: cl[1], text: cl[2].slice(0, 60), sub: true });

            // A short leading phrase ending in a period, followed by a capital, is
            // this document's clause title ("Deployment.", "Commercial use.").
            // Bounded at 60 chars so an ordinary short first sentence isn't
            // mistaken for one.
            const lead = cl[2].match(/^([A-Z][^.]{2,58}\.)(\s+[A-Z(].*)?$/);
            let titleTxt = lead ? lead[1] : '';
            let firstBody = lead ? (lead[2] || '').trim() : cl[2];
            // NOTICE writes some sub-headings as a bare all-caps label with no
            // trailing period ("4A.1  EMOJI"), which the lead-in test above can't
            // see. Without this the label became a body paragraph under an empty
            // heading.
            if (!lead && /^[A-Z][A-Z0-9 ,&()/-]{1,48}$/.test(cl[2].trim())) {
                titleTxt = cl[2].trim();
                firstBody = '';
            }

            out.push(
                `<h3 id="${id}" class="clause"><span class="idx" aria-hidden="true">${cl[1]}</span>` +
                // Empty when the clause has no title phrase (most of §1, where the
                // clause opens on a quoted defined term). It must be genuinely
                // EMPTY, not a placeholder: a `&#8203;` here was rendered into the
                // document text as the literal token "8203", because tag-stripping
                // leaves numeric entities behind. `h3.clause .ht:empty` hides it.
                `<span class="ht">${titleTxt ? inlineText(titleTxt) : ''}</span>` +
                `<a class="anchor" href="#${id}" data-tip="Link to section" aria-label="Link to this section">¶</a></h3>`
            );
            i++;

            // Gather the clause body: every following line indented at least 2,
            // plus the blank lines between its paragraphs. Stops at the next col-0
            // line or banner, which is what ends a clause in this document.
            const body = firstBody ? [firstBody] : [];
            const region = [];
            while (i < lines.length) {
                if (!lines[i].trim()) {
                    if (i + 1 < lines.length && lines[i + 1].trim() && indentOf(lines[i + 1]) < 2) break;
                    region.push('');
                    i++;
                    continue;
                }
                if (indentOf(lines[i]) < 2 || isBanner(lines[i])) break;
                region.push(lines[i]);
                i++;
            }
            out.push(renderIndented(body, region));
            continue;
        }

        // ── an ordinary paragraph, or an indented block outside any clause ──
        if (indentOf(line) >= 2) {
            const region = [];
            while (i < lines.length && (!lines[i].trim() || (indentOf(lines[i]) >= 2 && !isBanner(lines[i])))) {
                if (!lines[i].trim() && i + 1 < lines.length && lines[i + 1].trim() && indentOf(lines[i + 1]) < 2) break;
                region.push(lines[i]);
                i++;
            }
            out.push(renderIndented([], region));
            continue;
        }

        const buf = [];
        while (i < lines.length && lines[i].trim() && indentOf(lines[i]) === 0 &&
               !isBanner(lines[i]) && !/^(\d+[A-Z]?\.\d+)\s{1,3}/.test(lines[i])) {
            buf.push(lines[i].trim());
            i++;
        }
        para(buf);
    }

    return { html: out.join('\n'), toc };
}

/**
 * Renders one indented region (a clause body, or a standalone indented block).
 * head is text already taken from a clause's own first line, which continues
 * into the region's first paragraph.
 *
 * Blank lines separate paragraphs. A deeper indent than the paragraph baseline
 * means a sub-item, which is how this document expresses "(a) … (b) … (c)" lists
 * and how it sets addresses and the SPDX identifier apart.
 */
function renderIndented(head, region) {
    const indentOf = s => s.match(/^ */)[0].length;

    // ── column-aligned tables ────────────────────────────────────────────
    // NOTICE holds its dependency and trademark tables together with runs of
    // spaces (39 of its 260 lines). Joining those into prose destroys them, and
    // nothing downstream would notice: verify() normalises whitespace, so a
    // mangled table still reports 100% content present.
    //
    // The unit of detection is the blank-line-delimited GROUP, not the line. A
    // table's continuation rows are ordinary single-spaced text sitting under the
    // second column, so they don't match the column pattern themselves — but they
    // belong to the same block. If any line in a group is column-aligned, the
    // whole group is preformatted.
    const groups = [];
    let g = [];
    for (const l of region) {
        if (!l.trim()) { if (g.length) { groups.push(g); g = []; } continue; }
        g.push(l);
    }
    if (g.length) groups.push(g);

    const isCols = grp => grp.some(l => /\S {2,}\S/.test(l));
    // Class is "aligned", NOT "cols". It was "cols", which collided with the
    // page LAYOUT grid of the same name in shell() — so every one of NOTICE's
    // dependency and trademark blocks computed display:grid with a 200px first
    // track and spilled its lines out of it. The three content gates could not
    // see it: every word was present, every link resolved, and every aligned
    // line was still inside a <pre>. Only measuring the rendered box caught it.
    const colsBlock = grp => {
        // Dedent to the group's own left edge so the block doesn't carry the
        // source file's absolute indentation into a narrower page column.
        const cut = Math.min(...grp.map(indentOf));
        return `<pre class="aligned">${grp.map(l => inlineText(l.slice(cut))).join('\n')}</pre>`;
    };

    const out = [];
    let buf = head.slice();
    let list = null;      // open lettered/bulleted list, as an array of item texts
    let pre = null;       // open verbatim block (address, identifier)
    const flushPara = () => {
        const t = buf.join(' ').trim();
        // "Exception:", "Carve-out:", "For clarity" — the document's own signal
        // that what follows narrows or explains the clause above it. Marking them
        // is styling of existing text, not added content.
        if (t) {
            const aside = /^(Exception|Carve-out|Carve out|For clarity|Note|Example)\b/.test(t);
            out.push(`<p class="sub${aside ? ' aside' : ''}">${inlineText(t)}</p>`);
        }
        buf = [];
    };
    const flushList = () => {
        if (list && list.length) {
            out.push('<ul class="lettered">' +
                list.map(t => `<li>${inlineText(t.trim())}</li>`).join('') + '</ul>');
        }
        list = null;
    };
    // inlineText per line rather than esc on the whole block, so the email address
    // and repo URL in §17 stay clickable. `white-space:pre` keeps the line breaks.
    const flushPre = () => {
        if (pre && pre.length) {
            out.push(`<pre class="block">${pre.map(inlineText).join('\n')}</pre>`);
        }
        pre = null;
    };
    const flushAll = () => { flushPara(); flushList(); flushPre(); };

    // The paragraph baseline is the shallowest indent present; anything deeper is
    // a sub-item. Derived rather than hard-coded to 5, because the summary block
    // near the top of the licence sits at 2/4/6 instead.
    const depths = region.filter(l => l.trim()).map(indentOf);
    const base = depths.length ? Math.min(...depths) : 0;

    // A region that is ENTIRELY short unpunctuated unmarked lines is a verbatim
    // block, not prose: the SPDX identifier in §16 and the postal/email/repo block
    // in §17. Detected up front because the per-line rule below requires a deeper
    // indent than the baseline, and in these two cases every line IS the baseline —
    // which silently rendered a copy-me identifier as a serif sentence.
    const body = region.filter(l => l.trim());
    if (!head.length && body.length && body.length <= 6 &&
        body.every(l => l.trim().length < 80 && !/[.;:,]$/.test(l.trim()) &&
                        !/^(-\s|\([a-z0-9]+\)\s)/i.test(l.trim()))) {
        return `<pre class="block">${body.map(l => inlineText(l.trim())).join('\n')}</pre>`;
    }

    // Groups are dispatched whole. A column-aligned group becomes preformatted
    // regardless of what surrounds it, which is what lets NOTICE §5 carry prose
    // paragraphs and aligned trademark tables in the same region.
    groups.forEach((grp, gi) => {
        if (isCols(grp)) { flushAll(); out.push(colsBlock(grp)); return; }

        for (const raw of grp) {
            const ind = indentOf(raw);
            const t = raw.trim();

            // A bullet or a lettered marker opens (or continues) a list.
            const marker = /^(-\s+|\([a-z]\)\s|\(?[ivx]+\)\s)/i.test(t);
            if (marker && ind >= base) {
                flushPara(); flushPre();
                if (!list) list = [];
                list.push(t.replace(/^-\s+/, ''));
                continue;
            }
            // Deeper than the list marker → continuation of the current item.
            if (list && ind > base) { list[list.length - 1] += ' ' + t; continue; }

            // An indented line with no marker and no prose around it is a verbatim
            // block: the postal/email address in §17 and the SPDX identifier in §16.
            // Short, no terminal punctuation, and deeper than the baseline.
            if (!list && ind > base && t.length < 80 && !/[.;:]$/.test(t) && buf.length === 0) {
                flushList();
                if (!pre) pre = [];
                pre.push(t);
                continue;
            }

            flushList(); flushPre();
            buf.push(t);
        }
        // A blank line ended this group, so nothing may straddle into the next.
        if (gi < groups.length) flushAll();
    });
    flushAll();
    return out.join('\n');
}

/* ──────────────────────── shared design tokens (CSS) ───────────────────── */

const TOKENS = `
:root{
  --gold:${BRAND.gold};
  /* "desk" is the surface the document sits on; "paper" is the document. Warm
     plum-tinted graphite rather than neutral slate, derived from Plum Fortune —
     a generic near-black is the thing that made the first version anonymous. */
  --desk:#16131B; --paper:#1D1926; --raised:#241F30;
  --rule:#302A3E; --rule2:#3D3550;
  --ink:#EDE9F3; --ink2:#A9A1B9; --ink3:#8C84A3;
  /* Accent used as TEXT. The six accents are tuned for a dark ground; on light
     paper the same values measured 1.0-2.0:1 — the active tab label, the status
     chips and the ticket stubs were effectively invisible. Borders and fills
     keep --accent; only glyphs and type use this. */
  --accent-t:var(--accent);
  --shadow:0 24px 60px -28px rgba(0,0,0,.85);
  /* The gooey nav's own easing, taken from the reference implementation. It
     overshoots to 1.274 and settles through four decaying bounces, which no
     cubic-bezier can express — a bezier can overshoot once and only once. The
     pill assembling under it is what stops the effect reading as a fade. */
  --spring:linear(0, 0.068, 0.19 2.7%, 0.804 8.1%, 1.037, 1.199 13.2%, 1.245, 1.27 15.8%, 1.274, 1.272 17.4%, 1.249 19.1%, 0.996 28%, 0.949, 0.928 33.3%, 0.926, 0.933 36.8%, 1.001 45.6%, 1.013, 1.019 50.8%, 1.018 54.4%, 1 63.1%, 0.995 68%, 1.001 85%, 1);
  --display:-apple-system,"SF Pro Display","Segoe UI",system-ui,"Helvetica Neue",Arial,sans-serif;
  --serif:"Iowan Old Style",Charter,"Palatino Linotype",Palatino,Georgia,"Times New Roman",serif;
  --mono:ui-monospace,"SF Mono",SFMono-Regular,Menlo,"Cascadia Mono",Consolas,monospace;
}
/* LIGHT MODE. The rules used to be #DED9D0 on #FCFBF9 paper — about 1.15:1,
   which is to say invisible: every divider, table border and callout edge that
   structures these documents simply vanished in light mode while looking fine in
   dark. Light is not dark with the values flipped; the same separation needs more
   contrast on a bright ground. --rule now sits near 1.9:1 against paper and
   --rule2 near 2.9:1, and --raised is pulled further from --paper so callouts and
   table headers read as distinct surfaces rather than the same cream. */
:root[data-theme=light]{
  --desk:#D6D1CA; --paper:#FDFCFA; --raised:#EFEBE3;
  --rule:#CBC3B4; --rule2:#A39A8B;
  --ink:#171320; --ink2:#4A4454; --ink3:#5C5568;
  --accent-t:color-mix(in srgb,var(--accent) 38%,#120E1C);
  --shadow:0 20px 50px -30px rgba(40,32,50,.3);
}
@media (prefers-color-scheme:light){
  :root:not([data-theme=dark]){
    --desk:#D6D1CA; --paper:#FDFCFA; --raised:#EFEBE3;
    --rule:#CBC3B4; --rule2:#A39A8B;
    --ink:#171320; --ink2:#4A4454; --ink3:#5C5568;
    --accent-t:color-mix(in srgb,var(--accent) 38%,#120E1C);
    --shadow:0 20px 50px -30px rgba(40,32,50,.3);
  }
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--desk);color:var(--ink);font-family:var(--serif);
  -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
::selection{background:color-mix(in srgb,var(--accent) 32%,transparent)}
:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:1px}
.lab{font-family:var(--mono);font-size:.66rem;letter-spacing:.18em;text-transform:uppercase;
  color:var(--ink3);font-weight:500}
`;

/* ─────────────── the hover guard ────────────────────────────────────────
 * On a touch screen :hover LATCHES: it applies on tap and stays applied until
 * you tap something else. That is why the Discord button was photographed mid
 * "hover" on a phone -- glowing, icon scaled and rotated, lifted a pixel -- and
 * why it then looked misaligned against the GitHub button beside it. The stuck
 * state and the alignment complaint were one defect.
 *
 * This was previously handled by writing (hover:hover) queries BY HAND, and a
 * comment claimed every rule was inside one. It was not: 60 rules were not, and
 * a twelve-line script found them in a second. Hand discipline across a 3,700
 * line generator is not a mechanism, so the guard is applied MECHANICALLY here,
 * to the finished stylesheet, and audited afterwards on the built output.
 *
 * :focus-visible is deliberately left OUTSIDE the guard. Wrapping a combined
 * "a:hover,a:focus-visible" rule whole would drop keyboard focus styling on any
 * device that also has a touchscreen, which is most laptops now -- so the
 * selector list is SPLIT and only the :hover half is moved.
 */
const HOVER_Q = '@media (hover:hover) and (pointer:fine)';

/* Split a selector list on top-level commas only. :is(a,b) and :not(a,b) hold
   commas that are not selector boundaries, and so does an attribute value like
   [title="a, b"] — quotes have to be tracked as well as parens. */
const splitSel = sel => {
    const out = []; let d = 0, q = '', cur = '';
    for (const ch of sel) {
        if (q) { cur += ch; if (ch === q) q = ''; continue; }
        if (ch === '"' || ch === "'") q = ch;
        else if (ch === '(') d++;
        else if (ch === ')') d--;
        else if (ch === ',' && d === 0) { out.push(cur); cur = ''; continue; }
        cur += ch;
    }
    out.push(cur);
    return out.filter(x => x.trim());
};

let guarded = 0;
/* ⚠️ COMMENTS ARE NEVER PART OF THE PRELUDE. They used to be buffered along with
 * the selector, and the first comment containing a COMMA was then split as if it
 * were a selector list — which wrote the rewritten rule into the middle of the
 * comment and left the :hover half sitting outside its guard with a stray brace
 * after it. Eight rules in the built output were destroyed that way, silently,
 * while the transform reported having guarded them. The output gate below now
 * re-parses the built CSS rather than trusting this function's own count.
 */
const guardCss = css => {
    let out = '', com = '', sel = '', i = 0;
    const stack = [];                       // open at-rule preludes
    const inGuard = () => stack.some(p => /hover\s*:\s*hover/.test(p));
    while (i < css.length) {
        const c = css[i];
        if (c === '/' && css[i + 1] === '*') {           // comments pass through
            const e = css.indexOf('*/', i + 2), k = e < 0 ? css.length : e + 2;
            com += css.slice(i, k); i = k; continue;
        }
        if (c === '"' || c === "'") {                    // strings stay in the selector
            let j = i + 1;
            while (j < css.length && css[j] !== c) { if (css[j] === '\\') j++; j++; }
            sel += css.slice(i, j + 1); i = j + 1; continue;
        }
        if (c === '{') {
            const prelude = sel; out += com; com = ''; sel = ''; i++;
            if (/^\s*@/.test(prelude)) { stack.push(prelude); out += prelude + '{'; continue; }
            let d = 1, j = i;                            // a style rule: take its body whole
            while (j < css.length && d > 0) {
                if (css[j] === '{') d++;
                else if (css[j] === '}') d--;
                if (d > 0) j++;
            }
            const decls = css.slice(i, j);
            i = j + 1;
            if (!/:hover/.test(prelude) || inGuard()) { out += prelude + '{' + decls + '}'; continue; }
            const parts = splitSel(prelude);
            const hov = parts.filter(p => /:hover/.test(p));
            const rest = parts.filter(p => !/:hover/.test(p));
            guarded++;
            if (rest.length) out += rest.join(',') + '{' + decls + '}';
            out += HOVER_Q + '{' + hov.join(',') + '{' + decls + '}}';
            continue;
        }
        if (c === '}') { stack.pop(); out += com + sel + '}'; com = ''; sel = ''; i++; continue; }
        sel += c; i++;
    }
    return out + com + sel;
};

/* The gate for the above. It parses what actually reached disk — a transform
 * that reports its own success is not a check, which is the whole lesson of the
 * bug it exists to catch. Three properties, because they fail independently:
 * every :hover rule is behind the guard, the braces still balance, and no rule
 * text ended up inside a comment. */
const hoverGuardAudit = pages => {
    let ok = true;
    for (const [name, html] of pages) {
        const css = (html.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';
        const bad = [];
        let depth = 0, bal = 0, i = 0, sel = '';
        const stack = [];
        while (i < css.length) {
            const c = css[i];
            if (c === '/' && css[i + 1] === '*') {
                const e = css.indexOf('*/', i + 2), k = e < 0 ? css.length : e + 2;
                const body = css.slice(i, k);
                if (/[{}]/.test(body)) bad.push('brace inside comment: ' + body.slice(0, 60).replace(/\s+/g, ' '));
                i = k; continue;
            }
            if (c === '{') {
                bal++;
                if (/^\s*@/.test(sel)) { stack.push(sel); sel = ''; i++; depth++; continue; }
                let d = 1, j = i + 1;
                while (j < css.length && d > 0) { if (css[j] === '{') d++; else if (css[j] === '}') d--; if (d > 0) j++; }
                if (/:hover/.test(sel) && !stack.some(p => /hover\s*:\s*hover/.test(p)))
                    bad.push('unguarded :hover — ' + sel.trim().replace(/\s+/g, ' ').slice(0, 70));
                i = j + 1; bal--; sel = ''; continue;
            }
            if (c === '}') { bal--; depth--; stack.pop(); sel = ''; i++; continue; }
            sel += c; i++;
        }
        if (bal !== 0) bad.push('unbalanced braces (' + bal + ')');
        if (bad.length) {
            ok = false;
            console.log('  ✗ ' + name + ':');
            bad.slice(0, 8).forEach(b => console.log('      ' + b));
            if (bad.length > 8) console.log('      … and ' + (bad.length - 8) + ' more');
        }
    }
    if (ok) console.log('  ✓ every :hover rule is behind (hover:hover), braces balance, comments intact');
    return ok;
};

/* Every page goes through here, so a stylesheet cannot reach disk unguarded.
   What it wrote is kept so hoverGuardAudit can re-read it at the end. */
const guardedPages = [];
const writePage = (dest, html) => {
    const outHtml = html.replace(/<style>([\s\S]*?)<\/style>/g,
        (m, css) => '<style>' + guardCss(css) + '</style>');
    guardedPages.push([path.basename(dest), outHtml]);
    fs.writeFileSync(dest, outHtml);
};

/* ─────────────── shared components: wordmark, repo, theme switch ───────── */

const REPO_URL = 'https://github.com/HarkiratMangat/diors-builds';
/* The controller's Discord profile. Deliberately a bare user link rather than an
   invite: it is a contact route for a person, not a server to join, and the
   documents name it that way. */
const DISCORD_URL = 'https://discord.com/users/1139845545754632283';

// Matches the bot's own sign-off. commands/settings.js closes its panel with
// `-# {diorHeart} Made with love by @dior`, so the site says the same thing in
// the same words rather than inventing a second voice for the same person.
const DIOR_SIG = '<span class="hrt" aria-hidden="true">&#9825;</span> Made with love by '
    + `<a class="sig-a" href="${DISCORD_URL}" target="_blank" rel="noopener noreferrer" data-tip="Message on Discord">dior</a>`;
const INSTALL_URL = 'https://discord.com/oauth2/authorize?client_id=1491474871778021550';

/**
 * The install call to action, and the ONLY filled-accent element on the site.
 * Everything else is outlined or plain, so this reads as the single primary
 * action without needing to be large or loud about it.
 *
 * big is the landing-page hero variant. The compact one lives in the header of
 * every page, so the action is always one click away no matter how deep into a
 * document someone has scrolled.
 */
// The Discord mark, drawn on its OWN 127x96 viewBox rather than squeezed into a
// 24x24 grid. The previous path was authored for 24x24 but its geometry ran past
// the box, so the wordmark's ears were clipped off at the top — visible on the
// hero button. Using the mark's native aspect ratio means nothing has to be
// guessed or scaled by hand.
const DISCORD_MARK = `<svg viewBox="0 0 127.14 96.36" aria-hidden="true"><path fill="currentColor" d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69Zm42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53s-5.04 12.69-11.43 12.69Z"/></svg>`;

// data-spot opts the control into the cursor-tracked highlight in THEME_JS.
const installBtn = (big = false) => `<a class="ins${big ? ' big' : ''}" href="${INSTALL_URL}"
  target="_blank" rel="noopener noreferrer" data-spot
  data-tip="Add to Discord"
  aria-label="Install Dior&#8217;s Builds on Discord">
  <span class="ins-gl" aria-hidden="true"></span>
  <span class="ins-ic" aria-hidden="true">${DISCORD_MARK}</span>
  <span class="ins-t">${big ? 'Add to Discord' : 'Install'}</span>
  <span class="ins-ar" aria-hidden="true"><svg viewBox="0 0 10 10"><path d="M2.5 7.5 7.5 2.5M4.1 2.5h3.4v3.4"/></svg></span>
</a>`;

/**
 * The wordmark. It was previously a static accent bar plus text, and the first
 * thing Harkirat said about the live site was that he could not tell whether it
 * was clickable. So it now carries a permanent, slow idle animation — a highlight
 * that sweeps the three bars every few seconds — because a hover state cannot
 * advertise interactivity to someone who has not hovered yet. The three bars are
 * the same motif as the favicon and stand for attachment slots on a spec sheet.
 *
 * href is a parameter because on the index page this must NOT be a link (you are
 * already there) — and there it deliberately gets no animation either, so that
 * "moves" and "is clickable" keep meaning the same thing across the site.
 */
// `cur` is the page being rendered ({out, dir}), or null on the landing page.
// It was a bare filename until the site gained a second directory — two pages now
// share the name index.html, so a filename alone no longer identifies a page.
const wordmark = (href, cur) => {
    const here = cur ? ALL_PAGES.find(p => p.out === cur.out && dirOf(p) === dirOf(cur)) : null;
    const body = `<span class="mk-s">
      <span class="wm">Dior&#8217;s Builds</span>
      ${here ? `<span class="mk-ctx"><i aria-hidden="true"></i>${esc(here.title)}</span>` : ''}
    </span>`;
    return href
        ? `<a class="mark live" href="${href}">
    ${body}
    <span class="go" aria-hidden="true">&#8250;</span>
  </a>`
        : `<div class="mark">
    ${body}
  </div>`;
};

// Collapsed to the mark alone, expanding to reveal the label on hover/focus.
// NOTE: this is the ONLY repo link on the site, and it is a navigation
// affordance, not a citation. That distinction is deliberate — a citation inside
// a legal document must resolve (the repo's visibility can change at any time,
// per TERMS §7.1), whereas a nav button that stops working is a dead button and
// not a defective legal instrument. TERMS §20 still deliberately withholds the
// repo as a *contact* route, which this does not change.
const repoBtn = `<a class="ghb" href="${REPO_URL}" target="_blank" rel="noopener noreferrer"
  data-spot data-tip="Source on GitHub">
  <span class="ghb-ic" aria-hidden="true"><svg viewBox="0 0 16 16"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-2.98-.88-2.98-2.9 0-.83.3-1.51.79-2.04-.08-.2-.35-1 .08-2.08 0 0 .66-.21 2.16.79a7.3 7.3 0 0 1 1.97-.27c.67 0 1.34.09 1.97.27 1.5-1.01 2.16-.79 2.16-.79.43 1.08.16 1.88.08 2.08.49.53.79 1.21.79 2.04 0 2.03-1.21 2.7-2.99 2.9.31.27.58.79.58 1.6 0 1.15-.01 2.09-.01 2.38 0 .21.15.46.55.38A7.99 7.99 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg></span>
  <span class="ghb-t"><b>Source</b></span>
</a>`;

/**
 * The light/dark switch. Replaces a ◐ glyph in a box.
 *
 * It is a real switch — a track the knob travels along — and the knob morphs
 * between a rayed sun and a crescent moon. The crescent is cut by an SVG mask
 * whose occluding circle is moved with transform, NOT with cx/cy: the
 * geometry attributes are animatable as CSS in current browsers but not
 * dependably in older Safari, and a half-applied mask renders as a plain disc
 * with no error anywhere.
 *
 * role="switch" plus aria-checked is the honest markup here — it is a binary
 * control with a state, and a bare <button> would announce neither.
 */
const themeBtn = (cls = '') => `<button id="th" class="thm ${cls}" role="switch"
  aria-checked="false" aria-label="Switch between light and dark">
  <span class="thm-tr" aria-hidden="true">
    <span class="thm-sky">
      <span class="thm-st"><i></i><i></i><i></i><i></i><i></i></span>
      <span class="thm-cl"><i></i><i></i></span>
    </span>
    <span class="thm-kn">
      <svg viewBox="0 0 24 24">
        <defs>
          <radialGradient id="thm-lit" cx="34%" cy="30%" r="78%">
            <stop offset="0" stop-color="#FFFFFF"/>
            <stop offset="0.6" stop-color="#E4EAF9"/>
            <stop offset="1" stop-color="#C3CDE8"/>
          </radialGradient>
          <radialGradient id="thm-sun" cx="34%" cy="30%" r="80%">
            <stop offset="0" stop-color="#FFE49A"/>
            <stop offset="0.5" stop-color="#F2A93B"/>
            <stop offset="1" stop-color="#E08A1E"/>
          </radialGradient>
        </defs>
        <mask id="thm-cut">
          <rect width="24" height="24" fill="#000"/>
          <circle cx="12" cy="12" r="7.4" fill="#fff"/>
          <circle class="cut" cx="12" cy="12" r="7" fill="#000"/>
        </mask>
        <g class="rays" stroke-width="1.8" stroke-linecap="round">
          <line x1="12" y1="1.2" x2="12" y2="3.4"/><line x1="12" y1="20.6" x2="12" y2="22.8"/>
          <line x1="1.2" y1="12" x2="3.4" y2="12"/><line x1="20.6" y1="12" x2="22.8" y2="12"/>
          <line x1="4.4" y1="4.4" x2="6" y2="6"/><line x1="18" y1="18" x2="19.6" y2="19.6"/>
          <line x1="19.6" y1="4.4" x2="18" y2="6"/><line x1="6" y1="18" x2="4.4" y2="19.6"/>
        </g>
        <g class="moon">
          <rect class="orb" width="24" height="24" mask="url(#thm-cut)"/>
          <g class="craters" mask="url(#thm-cut)">
            <circle cx="8.6" cy="13.6" r="1.5"/>
            <circle cx="10.2" cy="16.4" r="1.05"/>
            <circle cx="7.6" cy="10.2" r="0.85"/>
          </g>
        </g>
      </svg>
    </span>
  </span>
</button>`;

/**
 * The page switcher, carried by EVERY page so the navigation never changes shape
 * as you move around the site.
 *
 * TWO groups, not one list: the four legal instruments in one pill, the two
 * invitation pages in another. That split is the same distinction the whole site
 * is built on — documents that bind you versus an offer — and putting all six in
 * a single track would quietly say they are the same kind of thing.
 *
 * A group you are not currently inside has data-at="-1": its indicator is hidden
 * until you point at it, so exactly one indicator is ever "yours".
 */
/* ⚠️ CHRONICLE_PAGES IS WITHDRAWN FROM THE NAV, not deleted — the same call that
   took the record row off the landing page, finished. Leaving the row off the
   home page while the tabs still advertised it was half a job: the reader was
   invited into a section the page itself had stopped offering.
   The three pages are still BUILT, still deployed and still reachable at
   /changelog/ (and /changelog via _redirects); every gate — linkAudit,
   crossRefAudit, PUBLISHED_TARGETS, contrastAudit — still sees them, so an
   in-prose reference to them still resolves to a real link.
   To restore: put CHRONICLE_PAGES back here, add 'Releases' back to the labels
   below, restore it in pageFoot()'s endnav, and RE-MEASURE the desktop staging —
   the breakpoints in SWITCHER_CSS are measured for the tab count, not derived. */
const NAV_GROUPS = [PAGES, EXTRA_PAGES];

/* ⚠️ WITHDRAWN IS NOT UNREACHABLE, and the difference is load-bearing. If the
   record group vanished from the nav on EVERY page, the three chronicle pages
   would have no route to each other either — you could reach /changelog/ from a
   link and then be stranded on it, with the mobile strip carrying no tab for the
   page you are actually on. So a reader who is already inside the section still
   gets its group; nobody outside it is invited in. */
const navSetFor = cur => (cur && dirOf(cur) === 'changelog')
    ? [...NAV_GROUPS, CHRONICLE_PAGES]
    : NAV_GROUPS;
const navLabelFor = gi => NAV_GROUP_LABELS[gi] || 'Releases';

/* What each group is called once it is stacked in the mobile menu, where the
   pills are no longer side by side to make the distinction for themselves. The
   labels are also what the collapsed desktop chips show between 981 and 1100px —
   see SWITCHER_CSS, where the staging is re-derived for three groups. */
const NAV_GROUP_LABELS = ['Documents', 'Community'];

/**
 * DESKTOP navigation — the segmented switcher in the bar.
 *
 * Desktop and mobile are now two separate controls rather than one control
 * restyled at a breakpoint. Sharing them sounded economical and produced most of
 * the mobile bugs: an indicator that has to work as a horizontal pointer track
 * AND a vertical thumb-follower does neither well, and every hover effect it
 * carried stuck to the first tap on a touch screen. The cost is that the six
 * links appear twice in the DOM; exactly one copy is display:none at any width,
 * and the pair is generated from the same PAGES data, so they cannot drift.
 *
 * ⚠️ The track is a FLEX row, not equal-width grid columns, because the
 * indicator now measures each tab's real box (offsetLeft/offsetWidth) instead of
 * assuming every tab is 1/n of the track. That is what lets the pill fit
 * "Contributing" and "Notice" correctly, and it is why nothing here sets --n.
 */
/* ⚠️ data-fit IS THE BREAKPOINT REGIME, and it exists because the bar now comes in
   two sizes. Withdrawing the record group left six tabs on every page except the
   three inside /changelog/, which still carry nine for their own navigation — and a
   single staging cannot serve both: the nine-tab thresholds tighten a six-tab bar at
   1440px, where it has 390px to spare, and the six-tab thresholds overflow a nine-tab
   bar by 200px. Each regime's numbers are MEASURED (see SWITCHER_CSS).
   A count this does not know about is a build failure rather than a silently wrong
   nav — the whole point is that these numbers are measured, so an unmeasured count
   must not quietly inherit someone else's. */
const navSwitcher = cur => {
    const n = navSetFor(cur).reduce((a, g) => a + g.length, 0);
    if (n !== 6 && n !== 9) {
        throw new Error(`navSwitcher: ${n} tabs has no measured breakpoint staging. ` +
            'Measure it (bar.scrollWidth > bar.clientWidth, both sides of every boundary), ' +
            'add a data-fit tier in SWITCHER_CSS, then allow the count here.');
    }
    return `<div class="navwrap" data-fit="${n}">${navGroups(cur)}</div>`;
};

const isHere = (p, cur) => cur && p.out === cur.out && dirOf(p) === dirOf(cur);

const navGroups = (cur, i0 = 0) => navSetFor(cur).map((grp, gi) => {
    const at = grp.findIndex(p => isHere(p, cur));
    /* ⚠️ THE COLLAPSED CHIP IS REAL MARKUP, NOT A ::before.
       Between 981 and 1100px the groups you are not in give up their tabs (nine
       tabs do not fit beside the wordmark). With two groups the old rule simply
       hid the other one and the footer carried the loss; with three it would hide
       TWO, taking two thirds of the site out of the bar. So a hidden group leaves
       a labelled chip that still links to its first page. A pseudo-element could
       have drawn the label but cannot be a link, and the link surviving is the
       entire point of the tier. */
    const first = grp[0];
    return `<div class="seg" data-at="${at}" data-label="${esc(navLabelFor(gi))}">
      <span class="seg-ink" aria-hidden="true"><i class="ib ib-a"></i><i class="ib ib-c"></i><i class="ib ib-b"></i></span>
      <a class="segchip" href="${hrefTo(first, cur || first)}">${esc(navLabelFor(gi))}</a>
      ${grp.map(p => `<a class="tab${isHere(p, cur) ? ' on' : ''}" href="${hrefTo(p, cur || p)}"` +
        ` data-accent="${p.accent}"` +
        `${isHere(p, cur) ? ' aria-current="page"' : ''}>${esc(p.short)}</a>`).join('')}
    </div>`;
}).join('<span class="seg-gap" aria-hidden="true"></span>');

/**
 * MOBILE navigation — one disclosure holding every destination on the site.
 *
 * This replaces two rejected attempts (a two-tab rail and a bottom sheet), both
 * of which carried the desktop indicator into a touch context and inherited its
 * pointer handling. There is no indicator here and no gesture: a button that
 * names where you are, opening one panel of plain rows. Everything a thumb can
 * touch is a link or a button, and the only animation is the panel's own height.
 *
 * Pages and sections live in the SAME panel because they answer the same
 * question — "where can I go from here" — and two collapsing menus a thumb-width
 * apart was the complaint that started this. `slots` is the section index, which
 * only the legal template has; the warm pages simply omit that group.
 */
const mobileNav = (cur, slots) => {
    /* One scrollable row, no disclosure. Nothing to open means the current page
       and its neighbours are always on screen, which is the whole point — the
       previous three attempts all hid the answer behind a tap. The hairline
       between the groups is the SAME distinction the numbered/unnumbered page
       classes make: four instruments that bind you, then two invitations. */
    const tab = p => `<a class="mtab${isHere(p, cur) ? ' on' : ''}" href="${hrefTo(p, cur || p)}"` +
        `${isHere(p, cur) ? ' aria-current="page"' : ''} style="--row:${p.accent}">` +
        `${esc(p.short)}</a>`;
    /* .mbar and .mstrip are two elements on purpose — see the CSS. The
       indicator has to sit outside the scroller, which is why it is a sibling
       of the strip rather than a child of it. */
    return `<aside class="mnav" id="mnav">
  <div class="mbar">
    <span class="mgw" id="mgw" aria-hidden="true"><span class="mgo"></span><i class="mtint"></i></span>
    <nav class="mstrip" id="mstrip" aria-label="Pages">
      ${navSetFor(cur).map(grp => grp.map(tab).join('')).join('<span class="ms-sep" aria-hidden="true"></span>')}
    </nav>
  </div>
  ${slots ? `<details class="msecd">
    <summary><span class="msd-l">On this page</span><span class="mt-at" id="railcur"></span></summary>
    <div class="mp-list msec">${slots}</div>
  </details>` : ''}
</aside>`;
};

/**
 * The site footer, shared by all three templates so the links, the separators and
 * the sign-off are identical everywhere.
 *
 * The affiliation disclaimer rides along on every page. It is a trademark notice,
 * and a reader can arrive on any one of these pages directly from a search
 * result — a notice that only appears on the page you happened not to land on
 * does not do its job. NOTICE §2 remains the authoritative version; this is the
 * short form.
 */
/* ⚠️ ONE STRING, TWO PLACES. This was typed out twice — once here and once at the
   foot of the landing page — and the two copies had drifted into saying different
   things: the footer named "Activision, TiMi, Tencent, or Discord" and the landing
   page also disclaimed "the rights holders of any content the game features under
   licence". Harkirat noticed the disclaimer differed between the home page and the
   legal pages, and he was reading two genuinely different notices.
   The landing page's is the one kept, because it is strictly the more complete of
   the two and a trademark notice has no business being shorter on the pages that
   ARE the legal instruments. Never re-inline this: a notice duplicated in prose is
   a notice that will disagree with itself again. */
const TRADEMARK_NOTE = 'Dior&#8217;s Builds is an unofficial fan project and is not '
    + 'affiliated with Activision Publishing, Inc., TiMi Studio Group, Tencent, '
    + 'Discord Inc., or with the rights holders of any content the game features '
    + 'under licence.';

/* `disc` is false on the four legal instruments, and only there. Each of those
   documents now CLOSES with this same notice as part of its own text, so printing
   it again in the chrome a centimetre below said the same thing twice on one
   screen — which is what Harkirat was looking at. The warm and chronicle pages
   carry no such closing line, so they keep the footer's copy. */
const pageFoot = (cur, sig, disc = true) => `<footer class="foot${disc ? '' : ' nodisc'}">
    <p class="sig">${sig || DIOR_SIG}</p>
    ${disc ? `<p class="disc">${TRADEMARK_NOTE}</p>` : ''}
    <nav class="endnav">${navSetFor(cur).flat()
        .filter(p => !isHere(p, cur))
        .map(p => `<a href="${hrefTo(p, cur || p)}">${esc(p.short)}</a>`)
        .join('<span>&middot;</span>')}</nav>
  </footer>`;

/**
 * Discord-first contact, with the email behind a reveal.
 *
 * Built on <details>/<summary> rather than a script ON PURPOSE. A privacy policy
 * has to give a data subject a working way to reach the controller (PRIVACY §13,
 * and GDPR Art. 13 requires the controller's contact details), so the address must
 * be present in the markup and openable with JavaScript disabled. A JS-gated
 * reveal would make the statutory contact route conditional on scripting.
 *
 * The wording is also chosen so it cannot contradict the documents: Discord is the
 * FASTEST route, email remains the CANONICAL one, which is exactly what TERMS §20
 * and PRIVACY §13 say. Saying "Discord is the primary method" on this page while
 * the binding documents name email would have been a real inconsistency.
 */
const emailReveal = `<details class="rev">
  <summary data-tip="Show the email address"><span class="rv-i" aria-hidden="true"></span><span class="rv-q">Prefer email?</span><span class="rv-a">Reveal</span></summary>
  <div class="rv-b">
    <a href="mailto:harkirat117@gmail.com">harkirat117@gmail.com</a>
    <span>The formal route. Named in the Terms and Privacy Policy for legal notices,
    rights requests, and takedowns.</span>
  </div>
</details>`;

const COMPONENT_CSS = `
/* ── skip link ────────────────────────────────────────────────────────
   WCAG 2.4.1 Bypass Blocks is Level A, and this site failed it on every page:
   the bar carries nine nav tabs plus the source, install and theme controls, so
   a keyboard or switch user tabbed through about thirteen widgets before
   reaching a word of the document — on every page, every time.

   Hidden by CLIPPING rather than by display:none or visibility:hidden, both of
   which remove an element from the focus order entirely and would make this a
   link nobody can ever reach. It is the first focusable thing in the body. */
.skip{position:absolute;left:.5rem;top:.5rem;z-index:200;
  padding:.55rem .9rem;border-radius:6px;
  background:var(--accent);color:#0F0C16;font-family:var(--mono);font-size:.62rem;
  letter-spacing:.14em;text-transform:uppercase;text-decoration:none;font-weight:700;
  clip-path:inset(50%);white-space:nowrap}
.skip:focus{clip-path:none;outline:2px solid var(--ink);outline-offset:2px}

/* ── shared reset for the label buttons ───────────────────────────────
   .lab is a <button> in the section rail. Without this reset it inherits the
   platform's default button chrome, which rendered as a grey box floating above
   the rail on DESKTOP — the mobile rules were scoped to a media query, so the
   desktop path got the element change with none of the styling. */
button.lab{-webkit-appearance:none;appearance:none;background:none;border:0;
  padding:0;margin:0;font:inherit;text-align:left;cursor:default;color:var(--ink3)}

/* ── wordmark ─────────────────────────────────────────────────────────
   Three bars = attachment slots on a Gunsmith spec sheet, the same motif as the
   favicon. The interaction is that motif behaving like the thing it depicts:
   on hover the slots LOCK IN — they align to full width in sequence and go
   accent — and a light passes across the wordmark once. The only always-on
   movement is a single slow pulse on the top bar, because three staggered idle
   loops competed with everything else in the bar and read as noise. */
.mark{display:inline-flex;align-items:center;gap:.62rem;text-decoration:none;color:var(--ink);
  white-space:nowrap;position:relative;padding:.25rem 0;min-width:0}

/* ⚠️ THERE IS NO LOGO MARK BESIDE THE WORDMARK, and that is the second time this
   slot has been emptied on purpose. It held three stacked bars first, which is
   the universal glyph for a menu, so readers tried to tap it expecting one to
   open. It then held a rounded square carrying a "D" — which was worse in a
   quieter way: a single letter in a box is the most generic mark there is, it
   said nothing the wordmark next to it does not already say in full, and it made
   the site's identity a placeholder logo rather than the typography.

   The wordmark alone is the mark. Do not "restore the logo" without an actual
   drawn mark to put there; another letter-in-a-square is not one. */
.mk-s{display:flex;flex-direction:column;gap:.05rem;min-width:0}
/* The wordmark is allowed to be squeezed; it is NOT allowed to overflow. Without
   this it kept its full 90px of text inside a 31px box and simply drew across
   the buttons beside it — the "too tight" header was really this one missing
   rule. Truncation is the honest failure mode for a flexible label. */
.wm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wm{font-family:var(--display);font-weight:800;font-size:1.02rem;letter-spacing:-.028em;
  line-height:1.16;position:relative;background-image:linear-gradient(100deg,
  var(--ink) 38%,color-mix(in srgb,var(--accent) 92%,white) 50%,var(--ink) 62%);
  background-size:280% 100%;background-position:130% 0;
  -webkit-background-clip:text;background-clip:text;
  transition:background-position .62s cubic-bezier(.3,.7,.2,1)}

/* The context line names the document you are in. It is hidden on desktop on
   purpose — the switcher is right there saying the same thing, and a header
   that states it twice is noise. Below 980 the switcher is gone. */
.mk-ctx{display:none}
.go{font-family:var(--mono);font-size:.9rem;line-height:1;color:var(--accent-t);
  opacity:0;transform:translateX(-6px);transition:opacity .26s,transform .26s}

/* ⚠️ :focus-visible stays OUTSIDE the hover guard. Guarding both together would
   drop the keyboard focus styling on any device with a touchscreen, which is
   most laptops now. Split, always. */
.mark.live:focus-visible .wm{-webkit-text-fill-color:transparent;background-position:-30% 0}
.mark.live:focus-visible .go{opacity:1;transform:translateX(0)}
@media (hover:hover) and (pointer:fine){
  .mark.live:hover .wm{-webkit-text-fill-color:transparent;background-position:-30% 0}
  .mark.live:hover .go{opacity:1;transform:translateX(0)}
}

/* ── action controls: pills ───────────────────────────────────────────
   ROUNDED, deliberately. The site's rule is squared = the documents that bind
   you, rounded = an invitation. An action is an invitation, so the earlier
   squared repo/install buttons contradicted the rule the rest of the site is
   built on. Every interactive control in the bar is now a pill; only document
   chrome stays squared. */
/* Every control in the bar is 32px tall so the icons, the switcher and the
   switch sit on one optical line. The old 30px height with a 30px icon plate
   inside a 1px border left the plate 2px wider than the content box, so the
   GitHub mark was pushed off-centre and clipped by overflow:hidden — that is the
   whole "logo is not properly aligned" bug, and it is why the plate is now sized
   from the CONTENT box rather than matched to the outer height. */
.ghb,.ins{border-radius:999px;height:32px;position:relative;isolation:isolate}

/* repo — a capsule that opens. The mark holds still on its plate and the label
   is uncovered as the capsule grows past it. */
.ghb{display:inline-flex;align-items:center;justify-content:flex-start;
  overflow:hidden;text-decoration:none;color:var(--ink2);
  border:1px solid var(--rule2);background:transparent;
  width:32px;padding:0;transition:width .42s cubic-bezier(.16,.84,.28,1),
  color .22s,border-color .22s}
.ghb-ic{position:relative;z-index:1;display:grid;place-items:center;
  width:30px;height:30px;flex:0 0 30px}
.ghb-ic svg{width:15px;height:15px;display:block}
.ghb-t{position:relative;z-index:1;overflow:hidden;padding-right:.9rem}
.ghb-t b{display:block;font-family:var(--mono);font-size:.65rem;font-weight:600;
  letter-spacing:.13em;text-transform:uppercase;white-space:nowrap;
  transform:translateX(-8px);opacity:0;
  transition:transform .42s cubic-bezier(.16,.84,.28,1),opacity .3s}
.ghb:hover,.ghb:focus-visible{width:108px;color:var(--ink);
  border-color:color-mix(in srgb,var(--accent) 60%,var(--ink3))}
.ghb:hover .ghb-t b,.ghb:focus-visible .ghb-t b{transform:translateX(0);opacity:1}
/* the cursor-tracked light */
.ghb::after{content:"";position:absolute;inset:0;z-index:0;border-radius:inherit;
  opacity:0;transition:opacity .3s;background:radial-gradient(64% 150% at
    var(--px,50%) var(--py,50%),color-mix(in srgb,var(--accent) 30%,transparent),
    transparent 72%)}
.ghb:hover::after,.ghb:focus-visible::after{opacity:1}

/* install — the one filled control on the site, and the only place a second
   ambient effect is justified. Three things happen and each has a reason: the
   fill is lit from the cursor, a single edge-light passes once on hover (not a
   loop — an idle sheen competes with the theme switch), and the mark sits in a
   recessed disc so the button reads as a physical key rather than a coloured
   rectangle with a logo dropped on it. */
.ins{display:inline-flex;align-items:center;gap:.55rem;overflow:hidden;
  text-decoration:none;padding:0 .5rem 0 .35rem;
  font-family:var(--mono);font-size:.66rem;letter-spacing:.13em;
  text-transform:uppercase;font-weight:700;
  color:#141021;background:var(--accent);border:1px solid var(--accent);
  /* ⚠️ AN INSET TOP HIGHLIGHT ON A PILL DRAWS AN ARC, NOT AN EDGE. inset 0 1px 0
     paints a 1px band across the top of the BORDER BOX, and where the box curves
     away the band follows it — so at 999px radius it read as a bright line drawn
     around the top half of the button and stopping dead at each side. Harkirat
     asked whether it was meant to be there; it was meant to be a material rim and
     it was not one. A spread ring is even all the way round, which is what a rim
     actually looks like. */
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.13),
    0 2px 10px -5px color-mix(in srgb,var(--accent) 80%,transparent);
  transition:box-shadow .32s,transform .22s cubic-bezier(.2,.8,.2,1)}
/* Taller, heavier and wider than the repo capsule beside it. These two were the
   same 32px pill, which gave the primary action on the site exactly as much
   presence as a link to the source. */
/* ⚠️ THE LEFT PADDING IS THE ICON'S CONCENTRIC GAP, and that is why it is not the
   same number as the right. The pill is 37px tall, so its cap radius is 18.5px;
   the Discord disc is 22px, radius 11px. A disc reads as sitting concentrically
   inside a cap only when the gap equals the difference — 7.5px, which is .47rem.
   At the old symmetric .95rem the disc was 15.2px from the left edge and 7.5px
   from the top and bottom, so the crescent of space around it was twice as thick
   on one axis as the other: the "different amounts of curve". The right side
   keeps more room because it ends in a text run's terminal, not a circle. */
.ins{height:37px;font-weight:700;letter-spacing:.14em;padding-inline:.47rem .85rem}
.ins .ins-t{font-size:.7rem;font-weight:800}
.ins-ic{position:relative;z-index:2;display:grid;place-items:center;
  width:22px;height:22px;flex:0 0 22px;border-radius:50%;
  background:color-mix(in srgb,var(--desk) 20%,transparent);
  box-shadow:inset 0 1px 2px color-mix(in srgb,var(--desk) 34%,transparent);
  transition:transform .34s cubic-bezier(.3,1.5,.5,1)}
.ins-ic svg{width:13px;height:auto;display:block}
.ins-t,.ins-ar{position:relative;z-index:2}
/* ⚠️ THE COLLAPSED ARROW MUST CANCEL ITS OWN FLEX GAP, and this is why the pill
   looked lopsided: a zero-WIDTH flex item is still a flex ITEM, so the .55rem
   gap between the label and the arrow was drawn even with the arrow collapsed.
   Measured on Terms at 1440: 16.20px of space before the Discord mark against
   24.99px after the label — the 8.8px difference is exactly that gap. The
   negative margin removes it while collapsed and returns to 0 as the arrow opens. */
/* ⚠️ DRAWN, NOT TYPED — the same lesson as the invitation cards' arrow. The
   travel arrow was the character U+2197, which the mono stack sets on its own
   baseline at its own optical weight: it sat low and light beside a 700-weight
   cap-height label and read as misaligned, because it WAS aligned — to a baseline
   the label does not share. An SVG in a centred grid cell has no font metrics to
   disagree with. overflow:hidden is what lets it stay drawn while the box is
   collapsed to zero width. */
.ins-ar{display:grid;place-items:center;overflow:hidden;
  opacity:0;width:0;transform:translateX(-4px);
  margin-inline-start:-.55rem;
  transition:opacity .26s,width .26s,margin-inline-start .26s,transform .26s}
.ins-ar svg{width:11px;height:11px;display:block;flex:0 0 11px;
  fill:none;stroke:currentColor;stroke-width:1.55;
  stroke-linecap:round;stroke-linejoin:round}
/* the cursor-tracked light, over the fill */
.ins-gl{position:absolute;inset:0;z-index:1;opacity:0;transition:opacity .3s;
  background:radial-gradient(58% 150% at var(--px,50%) var(--py,50%),
    rgba(255,255,255,.62),transparent 68%)}
/* the single pass of edge-light */
.ins::after{content:"";position:absolute;z-index:1;top:-60%;bottom:-60%;width:36px;
  left:-60px;transform:skewX(-18deg);pointer-events:none;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent)}
.ins:hover::after,.ins:focus-visible::after{animation:swipe .62s cubic-bezier(.3,.7,.3,1)}
@keyframes swipe{to{left:118%}}
.ins:hover,.ins:focus-visible{transform:translateY(-1px);
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.20),
    0 8px 22px -7px color-mix(in srgb,var(--accent) 82%,transparent)}
.ins:hover .ins-gl,.ins:focus-visible .ins-gl{opacity:1}
.ins:hover .ins-ic,.ins:focus-visible .ins-ic{transform:scale(1.1) rotate(-6deg)}
.ins:hover .ins-ar,.ins:focus-visible .ins-ar{opacity:1;width:11px;
  margin-inline-start:0;transform:translateX(0)}
.ins:active{transform:translateY(0) scale(.98)}
@media (prefers-reduced-motion:reduce){
  .ins:hover::after,.ins:focus-visible::after{animation:none}
  .ins:hover,.ins:focus-visible,.ins:active{transform:none}
  .ins:hover .ins-ic,.ins:focus-visible .ins-ic{transform:none}
}
/* On a 390px phone the bar measured 404px of content — wordmark 144 + a 24px gap
   + three controls — so the theme switch sat past the right edge with the padding
   eaten. The install button collapses to its mark and the gap tightens, which
   brings it to ~315px. The GitHub button deliberately survives instead: it is the
   ONLY repo link on the entire site, so dropping it on mobile would remove that
   route altogether, whereas the install label is recoverable from the icon plus
   the accessible name. */
@media (max-width:620px){
  /* ⚠️ .bar.bar, not .bar — and the doubled class is load-bearing.
     The base .bar rule lives in the SHELLS, which are concatenated after
     COMPONENT_CSS, so at equal specificity the desktop values won no matter
     what this media query said. The whole block was dead: measured at 375px it
     was still reporting gap:1.5rem and padding:1rem, which is why the wordmark
     was being squeezed until it painted over the repo button. Doubling the class
     makes this override immune to where the file happens to concatenate it. */
  .bar.bar{gap:.6rem;padding:0 .75rem}
  .bar.bar nav{gap:.5rem}
  /* The context line goes. It names the page you are on, and directly beneath it
     the strip names the page you are on with a filled pill — saying it twice in
     54px of header is what made the mark fight the buttons for width.
     The wordmark also drops a step, because at 1.02rem it still truncated to
     "Dior's B..." on a 393px phone, and a truncated wordmark is worse than a
     slightly smaller whole one. */
  .mk-ctx.mk-ctx{display:none}
  .wm{font-size:.85rem}
  /* 19px of the mark's width was its own padding — a hover affordance, on a
     surface that has no hover. Reclaiming it is what actually gives the wordmark
     room; every other lever here was worth 2-4px and would have been pixel
     chasing. */
  .mark.mark{padding:0}
  /* The little travel arrow is a hover-reveal, and it was costing the wordmark
     19px (itself plus its gap) on a surface where it can never be revealed.
     That 19px is exactly what "Dior's Buil..." was short of. */
  .mark .go{display:none}
  /* ⚠️ ONE rule, BOTH axes, for the icon-only control. The desktop rule gives
     .ins height:37px while this one set only width:32px, so on a phone the
     Discord button rendered as a 32x37 egg — a specificity trap, not a drawing
     mistake: the height came from a rule nobody was looking at.
     .ins keeps its LABEL here. A bare circular Discord glyph reads as a sign-in
     or an avatar, which is the opposite of what it does — it is an outbound
     install link, and the word is what says so. The repo button stays a circle
     because it is secondary and its mark is self-explanatory. */
  .ghb{width:38px;height:38px;flex:0 0 38px;padding:0;justify-content:center}
  /* ⚠️ THE MARK WAS SITTING 3.2px OUTSIDE ITS OWN BUTTON HERE, and the cause is
     that opacity:0 hides INK and KEEPS THE BOX. Measured: the collapsed control
     is 38px with a 36px content box, but its flex line still carries the 30px
     icon plate PLUS the label's 14.4px of padding-right = 44.4px. With
     justify-content:center the 8.4px of overflow splits evenly, so the GitHub
     glyph is pushed 3.2px past the left edge with 11.2px of slack on the right,
     and the button's own overflow:hidden clips it. The <b> being opacity:0 is
     exactly what made this invisible to a style read — the label looked absent
     and was still occupying the line.
     Taking the label OUT of the line is the fix rather than trimming its
     padding, because at this width it can never be revealed: .ghb only shows it
     by growing to 108px on hover, and there is no hover here. It also costs no
     accessibility — the label is not the accessible name. With .ghb-t removed
     from the tree the name falls back to the link's own title ("View the source
     on GitHub"), which is more informative than the word "Source" it replaces. */
  .ghb .ghb-t{display:none}
  /* And the capsule must not open to 108px around a label that is not there.
     This matters on a narrow DESKTOP window, which is the one place a fine
     pointer and this breakpoint coexist. */
  .ghb:hover,.ghb:focus-visible{width:38px}
  .ins{height:38px;width:auto;flex:0 0 auto;padding:0 .82rem;gap:.4rem;
    justify-content:center}
  .ins-t{display:inline-flex;font-size:.6rem;letter-spacing:.11em}
  .ins-ar{display:none}
}

/* ── THE SIGNATURE: the theme switch as a small sky ───────────────────
   This is the one place the design spends its boldness, so it is the one place
   with real depth. It is a sky you carry the sun and moon across:
     dark  — a cratered crescent, stars behind it
     light — a rayed sun, clouds behind it
   Both states are furnished; the first version left light mode as a plain white
   disc with nothing in it.
   The sun and moon carry their OWN colours (warm yellow, pale blue-grey) and
   NOT the page accent — a violet moon read as an unidentifiable blob. Only the
   track border and focus ring follow the accent.
   Hovering PEEKS: the knob leans toward the far side and the destination's
   furniture fades up, so the control shows you what pressing it will do. */
/* Geometry, stated once because it was wrong before: the track is 60x32 with a
   1px border, so the CONTENT box is 58x30. The knob is 26px inset 2px, which
   leaves exactly 2px on every side and gives a travel of 58-2-26-2 = 28px. The
   previous knob was inset 3px inside a 28px content box, so it had 3px above and
   1px below — that is the "moon/sun aren't properly aligned" bug. Any change to
   the track size has to re-derive the travel or the knob stops at the wrong end. */
.thm{-webkit-appearance:none;appearance:none;background:none;border:0;padding:0;
  cursor:pointer;color:inherit;line-height:0;flex:0 0 auto;border-radius:999px}
.thm-tr{display:block;position:relative;width:60px;height:32px;border-radius:999px;
  border:1px solid var(--rule2);overflow:hidden;
  background:linear-gradient(168deg,#171430,#2B2446 62%,#3A2F52);
  transition:background .5s cubic-bezier(.4,0,.3,1),border-color .3s,box-shadow .3s}
.thm:hover .thm-tr,.thm:focus-visible .thm-tr{border-color:var(--accent);
  box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 16%,transparent)}
.thm-sky{position:absolute;inset:0}

/* stars — dark only, in the half the knob is not occupying */
.thm-st i{position:absolute;border-radius:50%;background:#EDEAF6;width:2px;height:2px;
  opacity:.85;animation:twinkle 3.6s ease-in-out infinite}
.thm-st i:nth-child(1){left:36px;top:8px}
.thm-st i:nth-child(2){left:45px;top:15px;animation-delay:.6s}
.thm-st i:nth-child(3){left:49px;top:7px;width:1.5px;height:1.5px;animation-delay:1.2s}
.thm-st i:nth-child(4){left:40px;top:22px;width:1.5px;height:1.5px;animation-delay:1.8s}
.thm-st i:nth-child(5){left:51px;top:20px;width:1.5px;height:1.5px;animation-delay:2.4s}
@keyframes twinkle{0%,100%{opacity:.2}50%{opacity:1}}
.thm-st{transition:opacity .4s}

/* clouds — light only. Each cloud is one element plus two box-shadow lobes, so
   it has an actual cloud silhouette instead of reading as a rounded bar. */
.thm-cl{position:absolute;inset:0;opacity:0;transition:opacity .45s}
.thm-cl i{position:absolute;background:#fff;border-radius:999px}
.thm-cl i:nth-child(1){left:6px;top:18px;width:17px;height:7px;opacity:.95;
  box-shadow:4px -4px 0 -1px #fff,10px -2px 0 -1.5px #fff;
  animation:drift 7s ease-in-out infinite}
.thm-cl i:nth-child(2){left:5px;top:7px;width:11px;height:5px;opacity:.55;
  box-shadow:5px -2px 0 -1px #fff;
  animation:drift 9.5s ease-in-out infinite reverse}
@keyframes drift{0%,100%{transform:translateX(0)}50%{transform:translateX(5px)}}

/* The knob is a real plate now — a circle with its own edge and shadow — and the
   sun or moon is an icon sitting ON it, rather than the bare celestial body
   floating in the track with nothing to hold it. */
/* ⚠️ ONE CIRCLE, CONCENTRIC. This carried an off-centre highlight (at 32% 26%)
   plus a shadow pushed 2px down plus an inset light along the top — three
   circles with three different centres, which at any magnification reads as a
   misaligned disc sitting behind the moon rather than as one lit plate. The
   gradient is centred now and the only offset left is a soft drop shadow. */
.thm-kn{position:absolute;top:2px;left:2px;width:26px;height:26px;border-radius:50%;
  display:grid;place-items:center;
  background:radial-gradient(100% 100% at 50% 50%,rgba(255,255,255,.15),rgba(255,255,255,.04));
  border:1px solid rgba(255,255,255,.22);
  box-shadow:0 1px 5px -1px rgba(0,0,0,.45),inset 0 0 0 .5px rgba(255,255,255,.10);
  transform:translateX(0);
  transition:transform .52s cubic-bezier(.5,-0.24,.28,1.32),
    background .5s,border-color .5s,box-shadow .5s}
.thm-kn svg{width:17px;height:17px;overflow:visible}
/* ⚠️ THE BODY IS LIT, NOT FLAT, and it is filled by a GRADIENT REFERENCE. An SVG
   shape whose fill rule goes missing paints BLACK with no warning — that is
   worth knowing before anyone "tidies" this: losing this one line produces a
   black crescent and, in light mode, a black sun ringed by orange rays.
   A crescent's whole job is to say "sphere", and a flat fill says "shape". */
.thm-kn .orb{fill:url(#thm-lit)}
/* Craters. FILLED, never stroked: a hairline is a third of a pixel once the svg
   renders at 17px, which is what killed the first attempt at these. They sit
   inside the lune by construction — each is at least its own radius clear of
   both the outer rim and the cut circle — and they carry the same mask, so
   nothing can spill past the terminator. No craters on the sun. */
.thm-kn .craters{opacity:.5;transition:opacity .4s}
.thm-kn .craters circle{fill:#7C89AE}
/* ⚠️ A THINNER crescent means moving the cut circle CLOSER to the orb centre,
   which is the opposite of the intuition. What is left is a lune whose width
   along the axis is R + D - r (orb radius, centre distance, cut radius). The
   old values — R 7.4, r 6.6, D 10.46 — give 11.27 out of a 14.8 diameter, so
   that shape was a gibbous with a bite taken out of it, not a crescent at all;
   pushing the cut FURTHER out only makes the bite shallower. R 7.4, r 7, D 6.11
   gives 6.5, a full-bodied crescent, with the horn tips landing at ±61.5 degrees
   so they read as horns instead of wrapping into a ring.
   D is 6.11 along the 45-degree diagonal, hence 6.11/sqrt(2) = 4.32 per axis.
   Light mode still slides the cut to (30,-30): 42.4 apart clears 7.4+7, so the
   disc reads as a full sun with nothing bitten out of it. */
/* ⚠️ THE OLD RE-CENTRING WAS THE MISALIGNMENT, not the cure for it, and it is
   worth stating exactly how — because the reasoning was careful and still wrong.
   It centred the lune on its AXIS MIDPOINT: the shape runs from -R to (D-r)
   along the axis, so that midpoint sits 4.7 units down-left of the disc centre,
   and the whole moon group was pushed back by 4.7 to compensate.

   But the axis midpoint is not what an eye reads as the centre of a crescent —
   the BOUNDING BOX is, and the bounding box was already centred, because it is
   dominated by the outer arc, which is drawn around (12,12) by construction.
   Measured for the shipped geometry: the lune spans x 4.60–19.09 and y
   4.91–19.40, a box centred at (11.85, 12.15). It needed a 0.15 nudge. It was
   given 3.32, which threw the moon into the top-right corner of its own knob.

   So the translate is the bbox correction and nothing else: 0.15. An earlier
   version added ~0.75 of optical nudge on top, on the reasoning that a
   crescent's ink sits on the lower-left of its box; on screen that just read as
   off-centre again. Light mode returns it to zero so the sun, which is a plain
   disc about (12,12), stays concentric.

   Width is R + D - r = 7.4 + 6.11 - 7 = 6.5 of a 14.8 diameter (44%), up from
   36%. Horn tips at ±61.5 degrees. 36% read as a fingernail at 17px; 3.1 and
   4.4 were tried on the way here and read as cheaper still.

   ⚠️ THE EARTHSHINE DISC IS GONE, and it is not coming back. It was a full circle
   at 20% opacity behind the crescent, meant to read as the unlit limb catching
   light bounced off the earth. On a 26px knob it read as a grey smudge — a
   shadow of a moon that is not there. What it was reaching for (the sense that
   the body is round and lit from one side) is carried by the orb's gradient
   instead, which costs nothing and adds no second circle. */
.thm-kn .moon{transform:translate(.15px,-.15px);
  transition:transform .5s cubic-bezier(.2,.8,.2,1)}
.thm-kn .cut{transform:translate(4.32px,-4.32px);
  transition:transform .5s cubic-bezier(.2,.8,.2,1)}
.thm-kn .rays{stroke:#F2A93B;opacity:0;transform:scale(.5);transform-origin:12px 12px;
  transition:opacity .32s,transform .46s cubic-bezier(.2,.8,.2,1)}

/* The hover peek leans the knob toward where it is going. It no longer fades the
   clouds up behind the moon: clouds belong to the daytime sky, and previewing
   them at night just put weather behind a moon for no reason. */
.thm:hover .thm-kn{transform:translateX(5px)}

/* LIGHT: knob crosses, the mask occluder is pushed clear so the disc fills, rays
   fan out, the orb fills from a crescent to a sun, clouds replace stars. */
:root[data-theme=light] .thm-tr{background:linear-gradient(168deg,#7CBAF0,#AFDCF7 60%,#D8EEFB)}
:root[data-theme=light] .thm-kn{transform:translateX(28px);
  background:radial-gradient(100% 100% at 50% 50%,rgba(255,255,255,.97),rgba(255,255,255,.80));
  border-color:rgba(255,255,255,.95);
  box-shadow:0 1px 6px -1px rgba(40,70,110,.30),inset 0 0 0 .5px rgba(255,255,255,.9)}
:root[data-theme=light] .thm:hover .thm-kn{transform:translateX(23px)}
:root[data-theme=light] .thm-kn .cut{transform:translate(30px,-30px)}
:root[data-theme=light] .thm-kn .moon{transform:none}
:root[data-theme=light] .thm-kn .craters{opacity:0}
:root[data-theme=light] .thm-kn .orb{fill:url(#thm-sun)}
:root[data-theme=light] .thm-kn .rays{opacity:1;transform:scale(1)}
:root[data-theme=light] .thm-st{opacity:0}
:root[data-theme=light] .thm-cl{opacity:1}
:root[data-theme=light] .thm:hover .thm-st{opacity:.35}
@media (prefers-color-scheme:light){
  :root:not([data-theme=dark]) .thm-tr{background:linear-gradient(168deg,#7CBAF0,#AFDCF7 60%,#D8EEFB)}
  :root:not([data-theme=dark]) .thm-kn{transform:translateX(28px);
    background:radial-gradient(100% 100% at 50% 50%,rgba(255,255,255,.97),rgba(255,255,255,.80));
    border-color:rgba(255,255,255,.95);
    box-shadow:0 1px 6px -1px rgba(40,70,110,.30),inset 0 0 0 .5px rgba(255,255,255,.9)}
  :root:not([data-theme=dark]) .thm:hover .thm-kn{transform:translateX(23px)}
  :root:not([data-theme=dark]) .thm-kn .cut{transform:translate(30px,-30px)}
  :root:not([data-theme=dark]) .thm-kn .moon{transform:none}
  :root:not([data-theme=dark]) .thm-kn .craters{opacity:0}
  :root:not([data-theme=dark]) .thm-kn .orb{fill:url(#thm-sun)}
  :root:not([data-theme=dark]) .thm-kn .rays{opacity:1;transform:scale(1)}
  :root:not([data-theme=dark]) .thm-st{opacity:0}
  :root:not([data-theme=dark]) .thm-cl{opacity:1}
  :root:not([data-theme=dark]) .thm:hover .thm-st{opacity:.35}
}
@media (prefers-reduced-motion:reduce){
  .thm-st i,.thm-cl i{animation:none}
  .thm:hover .thm-kn{transform:translateX(0)}
  :root[data-theme=light] .thm:hover .thm-kn{transform:translateX(28px)}
}

/* ── Discord handle + email reveal ──────────────────────────────────── */
.dh{font-family:var(--mono);font-weight:600;color:var(--ink);letter-spacing:.02em;
  background:color-mix(in srgb,var(--accent) 16%,transparent);
  border-radius:4px;padding:.1em .36em}
.rev{margin-top:.7rem;font-family:var(--mono);font-size:.66rem;letter-spacing:.04em}
.rev summary{cursor:pointer;display:inline-flex;align-items:center;gap:.5rem;
  color:var(--ink3);list-style:none;transition:color .2s}
.rev summary::-webkit-details-marker{display:none}
.rev summary:hover{color:var(--ink)}
/* The original sliding-fill mark, restored 2026-08-01 23:10 EDT. An envelope that
   opened was tried and rejected: the fill sliding out of a slot says "something is
   being uncovered", which is what this control does, and the envelope only said
   "email" — which the words beside it already say. */
.rv-i{position:relative;width:24px;height:10px;flex:0 0 24px;overflow:hidden;
  border:1px solid var(--rule2);border-radius:3px}
.rv-i::after{content:"";position:absolute;inset:0;background:var(--accent);
  transform:translateX(0);transition:transform .44s cubic-bezier(.16,.84,.28,1)}
.rev[open] .rv-i::after{transform:translateX(101%)}
.rev summary:hover .rv-i::after{transform:translateX(48%)}
.rev[open] summary:hover .rv-i::after{transform:translateX(101%)}
.rv-q{color:var(--ink3);transition:color .2s ease}
/* ⚠️ EXACTLY .dh's TREATMENT, INCLUDING ITS TEXT COLOUR. A first version kept the
   16% accent wash but coloured the word in the accent too, which made a small
   mono word the loudest thing in the contact block — louder than the Discord
   handle it was supposed to match. .dh is accent-tinted GROUND with ordinary ink
   on top; the tint is the highlight, the text is not. */
.rv-a{border-radius:4px;padding:.1em .36em;font-weight:600;
  color:var(--ink3);background:transparent;
  transition:color .22s ease,background .22s ease}
.rev[open] .rv-a,.rev summary:hover .rv-a{color:var(--ink);
  background:color-mix(in srgb,var(--accent) 16%,transparent)}
.rev summary:hover .rv-q{color:var(--ink2)}
.rev summary:focus-visible{outline:2px solid var(--accent);outline-offset:3px;
  border-radius:5px}
.rv-b{display:grid;gap:.35rem;margin-top:.65rem;padding:.75rem .95rem;
  border-radius:8px;border:1px solid var(--rule);border-left:2px solid var(--accent);
  background:var(--raised);animation:uncover .4s cubic-bezier(.2,.8,.2,1) both}
.rv-b a{color:var(--ink);font-size:.78rem;letter-spacing:.02em}
.rv-b span{color:var(--ink3);line-height:1.7;letter-spacing:.03em;max-width:52ch}
@keyframes uncover{from{opacity:0;clip-path:inset(0 0 100% 0)}
  to{opacity:1;clip-path:inset(0 0 0 0)}}
@media (prefers-reduced-motion:reduce){.rv-b{animation:none}}

/* ── the reveal's mark, as liquid ──────────────────────────────────────
   DESKTOP ONLY, BY DESIGN — the class .rv-anim is added from script and only on
   a fine pointer, so a phone keeps the original sliding fill above untouched.
   This is not a gap waiting to be filled: the buds MERGING with the core is the
   one thing here that genuinely needs the SVG filter, and an SVG filter renders
   a swarm as hard circles on iOS. That trade is taken knowingly on this surface.
   Do not "fix" it by tuning the filter, and do not hide the surface from touch
   instead — an earlier pass gated the whole mark behind the fine-pointer test and
   the result was a mark that simply never changed on a phone.

   ⚠️ THE LAYER HANGS OFF .foot, NOT OFF THE <details>. A closed <details> renders
   none of its children but <summary>, so a layer parented to it does not exist
   while the control is shut — which is why the mark was once invisible at rest
   while its inline styles read perfect the whole time.

   ⚠️ AND IT IS var(--accent), NOT currentColor. currentColor here resolves to the
   summary's --ink3/--ink ramp, which is how it once came out white. */
.rv-host{position:relative}
/* Load-bearing, not cosmetic: the goo sits BEFORE .rev in tree order, and two
   positioned siblings at z-index auto/0 paint in tree order. Make .rev static and
   it drops to the background step, putting the liquid over the panel. */
.rev{position:relative}
.rev.rv-anim summary{position:relative}
/* the original slot hands over to the morph rather than the two coexisting */
.rev.rv-anim .rv-i{border-color:transparent}
.rev.rv-anim .rv-i::after{opacity:0}
.rv-goo{position:absolute;left:0;top:0;pointer-events:none;z-index:0;
  filter:url(#dbgoo-r)}
/* ⚠️ THE RESTING PILL IS AN UNFILTERED ELEMENT, AND IT HAS TO BE — MEASURED.
   A shape smaller than roughly 4x the blur's sigma cannot keep its own geometry,
   because the crush thresholds what survives and the outer boundary is all the
   blur ever softens. This mark is 14x6.5 against #dbgoo-r's sigma 3.2 — half its
   own height — so the filter owns the silhouette whatever radius is asked for.
   Rasterised at 12x and measured by the run of columns at full height (a stadium
   has straight flanks, an ellipse reaches full height only at its centre):

       rest shape        flat run, filter OFF    flat run, THROUGH the filter
       pill (999px)              70.2%                      36.4%
       ellipse (50%)             34.5%                      32.4%

   So filtering collapses a 36-point distinction to 4: a pill and an oval come out
   the same shape. The plate draws the rest state crisply and hands over to the
   filtered mark as it wakes, which is what "breaking away" actually is. This is
   the same mechanism a resting RECTANGLE needed before the card was abandoned —
   the rectangle went with it, the mechanism is sound and comes back for the pill.
   ⚠️ It must stay OUTSIDE .rv-goo. Inside, it would be filtered too and there
   would be nothing crisp left to hand over. */
.rv-plate{position:absolute;left:0;top:0;pointer-events:none;z-index:0;
  background:var(--accent);border-radius:999px;
  will-change:transform,opacity}
/* ⚠️ NO border-radius HERE — it is written per frame as an eight-value string, and
   that is what makes the OUTLINE deform rather than a fixed shape being scaled.
   A fixed radius on this rule would flatten the whole effect. */
.rv-m{position:absolute;left:0;top:0;background:var(--accent);
  will-change:transform,width,height,border-radius}
/* the masses that bud off the core while it is awake and re-merge with it */
.rv-bud{position:absolute;left:0;top:0;width:12px;height:12px;border-radius:50%;
  background:var(--accent);transform:scale(0);will-change:transform}
/* Once the address is on screen the question has been answered, so leaving
   "Prefer email?" standing reads as though it were still being asked. Struck
   through, it is a record of a question already dealt with — which is also what
   the control's own label now says, since it reads "Hide" while open. A muted
   rule: this is a state, not emphasis. */
.rev[open] .rv-q{text-decoration:line-through;
  text-decoration-color:color-mix(in srgb,currentColor 55%,transparent)}
/* the label rides above the liquid, so it never needs a second copy */
.rev.rv-anim .rv-a,.rev.rv-anim .rv-q{position:relative;z-index:1}
.rev.rv-anim .rv-b{position:relative;z-index:1}

/* ── the shared page footer ───────────────────────────────────────────
   One definition for all three templates. It used to be three, which is how the
   legal pages ended up with a plainer footer than the warm ones for no reason
   anybody chose.

   The affiliation disclaimer is deliberately the QUIETEST thing on the page: it
   is a notice that has to be present, not something anyone is meant to read on
   the way past. Small, wide-tracked, --ink3, and capped to a comfortable measure
   so it never becomes a grey slab. */
/* Two columns: the notice on the left, the links top-right, the sign-off under
   the links. GRID PLACEMENT does the arranging, which is what lets the sign-off
   stay EARLY in the DOM while rendering LAST — see the note on .sig below. That
   ordering is load-bearing, so this must not be rewritten as a flex column. */
/* ⚠️ COLUMN ONE CARRIES A FLOOR, and without it the footer collapsed on any page
   whose document column is narrower than the legal set has. An auto track sizes
   to max-content, and the end-nav's max-content is one unwrapped row of every page
   on the site — 750px once there were nine. On Contributing that left the notice
   a 71px-wide column and wrapped it into a 302px-tall grey noodle. With a floor
   on column one the nav is forced to wrap instead, which is what it has
   flex-wrap for. Re-check this if the site ever gains a tenth page. */
.foot{padding:2.2rem 0 3.4rem;
  display:grid;grid-template-columns:minmax(min(100%,38ch),1fr) auto;
  column-gap:clamp(1.5rem,5vw,4rem);row-gap:.4rem;
  align-items:start;text-align:left}
/* Quiet, but it still has to be READABLE — it measured 2.3:1 with the opacity
   applied, and it is a notice we are obliged to show. Same size, full opacity. */
.disc{grid-column:1;grid-row:1;align-self:start;
  margin:0;font-family:var(--mono);font-size:.6rem;line-height:1.85;
  letter-spacing:.05em;color:var(--ink3);max-width:52ch}
/* The link row: mono, wide-tracked, dot-separated, with the accent drawn under
   the one you are pointing at. */
.endnav{grid-column:2;grid-row:1/span 2;align-self:start;
  display:flex;flex-wrap:wrap;justify-content:flex-end;align-items:center;
  gap:.15rem .75rem;font-family:var(--mono);font-size:.68rem;letter-spacing:.14em;
  text-transform:uppercase}
.endnav a{color:var(--ink2);text-decoration:none;padding:.3rem .1rem;
  border-bottom:1px solid transparent;
  transition:color .22s,border-color .22s}
.endnav a:hover{color:var(--ink);border-bottom-color:var(--accent)}
.endnav span{color:var(--ink3);opacity:.45}
/* ⚠️ The sign-off is FIRST in the footer's DOM and LAST on screen, and the split
   is deliberate. On the warm pages this line is lifted straight out of the
   source, where it runs on from the last paragraph ("Thanks for being here —
   genuinely. / ♡ Made with love by dior"). If the five nav labels sit between
   those two in the DOM, they land inside that sentence: verify() reports the run
   missing, correctly, because a reader meets the nav mid-sentence too.
   Grid placement moves it below the links visually without moving it in the
   document. Do not "tidy" this by reordering the markup to match the layout. */
/* Left column, under the notice. It used to sit bottom-RIGHT under the link row,
   which put the two mono lines on opposite corners with nothing tying them
   together; both belong to the site rather than to the navigation. On the four
   legal pages the notice is gone entirely, so grid row 1 collapses to nothing and
   this is simply the bottom-left line. */
.sig{grid-column:1;grid-row:2;text-align:left;justify-self:start;margin:.85rem 0 0;
  font-family:var(--mono);font-size:.68rem;letter-spacing:.05em;color:var(--ink3)}
/* ⚠️ WITH NO NOTICE ABOVE IT, THE SIGN-OFF MOVES UP A ROW. On the four legal pages
   the notice is part of the document, so the footer's row 1 is empty — leaving the
   sign-off in row 2 dropped it a whole line below the link row it should sit level
   with, which is what looked unaligned. Row 1 puts the two on one baseline, and the
   .85rem top margin has to go with it or the alignment is off by that much. */
.foot.nodisc .sig{grid-row:1;margin-top:0}
.foot.nodisc .endnav{grid-row:1}
/* One column once the two would fight for width; the notice leads, as it does
   on every other narrow layout here. */
@media (max-width:760px){
  .foot{grid-template-columns:minmax(0,1fr);row-gap:1.3rem}
  .disc{grid-row:auto;max-width:none}
  .endnav{grid-column:1;justify-content:flex-start}
  .sig{grid-column:1;text-align:left;margin:0}
}
.sig b,.sig .sig-a{color:var(--ink2);font-weight:600}
/* The sign-off's name is a link to the controller's Discord profile. Underlined on
   hover only: a permanent underline in a 0.68rem mono line reads as clutter, and
   the name is already the only emphasised word in it. */
.sig .sig-a{text-decoration:none;border-bottom:1px solid transparent;
  transition:color .22s,border-color .22s}
.sig .sig-a:hover{color:var(--ink);border-bottom-color:var(--accent)}
.sig .sig-a:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:3px}
/* .dh is an anchor now, not a <b>. Same chip, plus the affordances a link owes. */
a.dh{text-decoration:none;transition:background .22s,color .22s}
a.dh:hover{color:var(--ink);background:color-mix(in srgb,var(--accent) 28%,transparent)}
a.dh:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
/* ── back to top ──────────────────────────────────────────────────────
   The ring IS the scroll position, so the control answers "how much is left"
   as well as "take me back" — on a 22-section document that is worth more than
   a bare arrow. It is driven from the SAME scroll handler that feeds the
   progress bar and the section rail, so the three can never disagree.
   The arrow is two chevrons in a 12px window: hovering slides the pair up so
   the second takes the first's place, and clicking fires the group off the top
   and brings it back in from below. */
/* ⚠️ IT PARKS ON THE FOOTER RATHER THAN FLOATING OVER IT. A fixed control at a
   fixed offset from the viewport bottom sits on top of whatever the page ends
   with, and on a short window — Harkirat's Arc window, where the chrome eats the
   viewport — that was the footer's own link row, with the button covering the
   last two entries. Hiding it at the bottom is the usual answer and it is the
   wrong one here: the bottom of the document is precisely where "back to top" is
   worth most.
   So --lift is written from the script each frame: zero until the footer's top
   edge reaches the button, then exactly the overlap, so it rides up ahead of the
   footer and never crosses it. It is a variable rather than a direct transform
   write because .totop.on owns the transform — a script setting style.transform
   would have fought the entry animation. */
.totop{--lift:0px;
  position:fixed;right:clamp(.9rem,3vw,2rem);bottom:clamp(.9rem,3vw,2rem);
  z-index:55;width:46px;height:46px;display:grid;place-items:center;cursor:pointer;
  -webkit-appearance:none;appearance:none;border:1px solid var(--rule2);border-radius:50%;
  background:color-mix(in srgb,var(--paper) 90%,transparent);
  backdrop-filter:blur(12px) saturate(1.25);
  opacity:0;transform:translateY(14px) scale(.88);pointer-events:none;
  transition:opacity .34s ease,transform .46s cubic-bezier(.22,.9,.24,1),border-color .3s ease}
/* No transition on the parked position: --lift tracks scroll, so easing it would
   make the button lag the footer it is supposed to stay clear of. */
.totop.on{opacity:1;transform:translateY(calc(var(--lift) * -1));pointer-events:auto;
  transition:opacity .34s ease,border-color .3s ease}
.totop:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
/* ⚠️ inset:-1px, not 0. An absolutely positioned child resolves inset against the
   PADDING box, which is 44px inside this button's 1px border — but the svg is
   46px, so it hung 1px down and right and its ring stopped being concentric with
   the border it sits in. Covering the border box instead puts both circles on one
   centre, which is the only way a ring around a button reads as a single object. */
.tt-ring{position:absolute;inset:-1px;width:46px;height:46px;transform:rotate(-90deg)}
.tt-trk{fill:none;stroke:var(--rule);stroke-width:1.5}
/* dasharray is 2*pi*r at r=20; the script writes the offset from scroll */
.tt-bar{fill:none;stroke:var(--accent);stroke-width:1.5;stroke-linecap:round;
  stroke-dasharray:125.66;stroke-dashoffset:125.66}
.tt-ar{position:relative;display:block;width:12px;height:12px;overflow:hidden}
.tt-ar i{position:absolute;left:0;width:12px;height:12px;display:block;
  transition:transform .42s cubic-bezier(.22,.9,.24,1)}
.tt-ar i::before{content:"";position:absolute;left:2px;top:4px;width:7px;height:7px;
  border-left:1.7px solid var(--ink);border-top:1.7px solid var(--ink);transform:rotate(45deg)}
.tt-ar i:nth-child(1){top:0}
.tt-ar i:nth-child(2){top:12px}
@media (hover:hover) and (pointer:fine){
  .totop:hover{border-color:color-mix(in srgb,var(--accent) 60%,transparent)}
  .totop:hover .tt-ar i{transform:translateY(-12px)}
}
@keyframes ttFire{
  0%{transform:translateY(0);opacity:1}
  36%{transform:translateY(-20px);opacity:0}
  37%{transform:translateY(15px);opacity:0}
  100%{transform:translateY(0);opacity:1}
}
.totop.fire .tt-ar{animation:ttFire .6s cubic-bezier(.3,0,.2,1)}
@media (prefers-reduced-motion:reduce){
  .totop{transition:opacity .2s ease}
  .tt-ar i{transition:none}
  .totop.fire .tt-ar{animation:none}
}

/* ── back to top, coalescing ───────────────────────────────────────────
   The control assembles from droplets falling inward when it first arrives, and
   comes apart upward when pressed. Every rule below has to sit AFTER .totop:hover
   and .totop.on: they are all (0,2,0), so source order is what decides, and
   .totop.birth has to win over both while the liquid is on screen.

   ⚠️ visibility, NOT JUST opacity:0. A filtered element still allocates its
   filter REGION at opacity 0 — #dbgoo-c is 260% of a 44px layer, a ~114px disc,
   and that disc is exactly the size of the "gradient circle stuck behind the
   button" this was reported as. visibility:hidden takes it out of the paint tree
   between births, so there is nothing left to leak on any platform.

   ⚠️ COARSE POINTERS DROP THE FILTER, NOT THE ANIMATION (.nogoo). An earlier pass
   skipped the whole effect on touch, which quietly removed the animation from
   mobile; the artefact was the SVG filter misbehaving on iOS, not the droplets.
   Unfiltered they converge as crisp circles instead of coalescing as liquid — an
   honest downgrade, and it cannot produce the artefact.
   ⛔ AND THE CSS BLUR/CONTRAST CRUSH IS NOT THE FIX FOR THAT. It was built and
   measured (2026-08-03 12:02 EDT): the masses merged correctly and the recipe's
   black bed rendered as a SOLID SQUARE. The bed erases itself by blending against
   an opaque backdrop, and .totop is position:fixed with z-index:55 — its own
   stacking context — so mix-blend-mode:lighten composites INSIDE it, against a
   background .birth has just made transparent. Black against nothing stays black.
   Giving the button an opaque background does not help either: the bed is inset
   -90px, far outside a 46px control. The nav can use that recipe because it sits
   ON a bar; a floating control has no surface to sit on. Do not re-attempt it. */
.tt-ink{position:absolute;inset:0;z-index:0;pointer-events:none;
  opacity:0;visibility:hidden}
.totop.birth .tt-ink{opacity:1;visibility:visible}
.tt-goo{position:absolute;inset:0}
.totop.birth .tt-goo{filter:url(#dbgoo-c)}
.totop.nogoo.birth .tt-goo{filter:none}
/* The real chrome stands down while the liquid is on screen. transition:none is
   what lets the launch drop opacity to 0 instantly at the end — handing that fade
   to .totop's own transition is what made the button appear to come back after a
   tap, because .birth is also what hides the ring and the arrow. */
.totop.birth{background:transparent;border-color:transparent;transition:none}
.totop.birth .tt-ring,.totop.birth .tt-ar{opacity:0}
.tt-blob{position:absolute;left:50%;top:50%;width:44px;height:44px;
  margin:-22px 0 0 -22px;border-radius:50%;background:var(--accent);
  transform:scale(0);will-change:transform}
.tt-d{position:absolute;left:50%;top:50%;width:12px;height:12px;
  margin:-6px 0 0 -6px;border-radius:50%;background:var(--accent);
  opacity:0;will-change:transform}

/* ── the liquid cursor ─────────────────────────────────────────────────
   It REPLACES the pointer rather than following it. An earlier version left the
   native arrow on screen and trailed a blob behind it, which read as exactly what
   it was: two things, one chasing the other.

   ⚠️ THE NATIVE ARROW IS HIDDEN ONLY WHILE THE EFFECT IS LIVE, and html.liq is
   removed the instant it is not — on pointerleave, on visibilitychange, and under
   reduced motion, where the layer never exists at all. A hidden cursor with
   nothing drawn in its place is the worst failure this could have, so the class is
   also not applied until the first pointermove has actually seeded the swarm.
   !important because the site sets cursor:pointer on its own controls at a
   specificity a bare html rule cannot beat, and a control still showing an arrow
   breaks the illusion at exactly the moment the cursor is saying something.

   ⚠️ NO :hover COLOUR RULE MAY EVER BE ADDED FOR THIS. The swarm is retinted per
   frame from the surface under the pointer, written inline; a (0,2,0) hover
   selector would beat a per-frame inline value outright. That trap already cost
   four reports on the nav. */
html.liq,html.liq *{cursor:none !important}
/* fixed, not absolute: a cursor belongs to the viewport, which removes every
   scroll-compensation term at the source rather than correcting for it */
.cur-ink{position:fixed;left:0;top:0;width:220px;height:220px;
  pointer-events:none;z-index:60;opacity:0;
  transition:opacity .22s ease;filter:url(#dbgoo-p)}
.cur-ink.on{opacity:.82}
/* quieter over prose, where it sits on top of what is actually being read */
.cur-ink.on.soft{opacity:.72}
/* currentColor, not var(--accent): the swarm is retinted per frame from the
   accent under the pointer, and inheriting one colour off the container is ONE
   style write a frame instead of seven. */
.cur-d{position:absolute;left:0;top:0;border-radius:50%;
  background:currentColor;will-change:transform}
@media (prefers-reduced-motion:reduce){.cur-ink{display:none}}
/* It is a fixed layer that exists for as long as the page does, so without this
   it would print on every sheet of a legal document. */
@media print{.cur-ink{display:none!important}}

.hrt{color:var(--accent-t);display:inline-block;animation:pulse 2.6s ease-in-out infinite}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.18)}}
@media (prefers-reduced-motion:reduce){.hrt{animation:none}}

/* ── the hint ─────────────────────────────────────────────────────────────
   Replaces the native title= tooltip, which the OS draws in its own font, in
   its own colours, after its own delay, with no way to match anything around
   it. One control had one; the rest announced themselves only to screen
   readers.

   ⚠️ IT IS DECORATIVE, aria-hidden, AND THAT IS DELIBERATE. Every control it
   describes already carries its own accessible name (aria-label, or visible
   text). Wiring aria-describedby to this as well would make a screen reader
   read most of them twice. The hint adds nothing for assistive tech and
   everything for a sighted pointer, so it is scoped to exactly that.

   ⚠️ NO :hover RULE. It is driven by a class from MORPH_JS, because the thing
   that positions it has to measure the trigger anyway, and a CSS-only tooltip
   cannot flip off a viewport edge. That also keeps it out of guardCss's way.

   It is a capsule rather than the legal family's squared card on purpose: it
   floats over every one of the three page families, and the one shape all
   three already share is the pill in their own nav. The accent dot is what
   ties it to the page it is on — the type is deliberately neutral so the
   colour is the only thing that changes between pages. */
.tipx{position:fixed;left:0;top:0;z-index:70;pointer-events:none;
  display:flex;align-items:center;justify-content:center;text-align:center;
  /* ⚠️ width:max-content IS LOAD-BEARING, not a nicety. The capsule is centred
     by left + translate(-50%), and a transform does not affect LAYOUT — so a
     fixed element whose left sits near the right edge is shrink-wrapped by the
     space remaining to that edge before the transform ever moves it. Measured
     on the back-to-top: "Back to top" came out 56px wide and 4.2 lines tall,
     overlapping the button. max-content sizes it to its text first and lets the
     transform place it afterwards. */
  width:max-content;max-width:min(72vw,22rem);
  font-family:var(--mono);font-size:.56rem;font-weight:600;line-height:1.25;
  letter-spacing:.13em;text-transform:uppercase;
  /* ⚠️ BUILT FROM --desk AND --ink ONLY, and that is not a style preference.
     The first version used var(--card) and var(--rule2), and neither survives
     the trip across the three page families. --card is declared ONLY by
     chronicle.js, so on the legal and warm pages it resolved to nothing and the
     hint had NO BACKGROUND AT ALL — reported as "so transparent", which it
     literally was. --rule2 has the opposite failure: chronicle emits the legal
     TOKENS and then overrides --desk/--card/--ink on top, so --rule2 survives
     with the legal palette's purple and would have dragged it into the terminal
     world. --desk and --ink are the two every family redefines, so mixing the
     surface out of them lands native on all three. Check that before reaching
     for any other token here. */
  color:var(--ink);
  background:color-mix(in srgb,
    color-mix(in srgb,var(--ink) 9%,var(--desk)) 94%, transparent);
  border:1px solid color-mix(in srgb,var(--ink) 24%,var(--desk));
  border-radius:999px;
  /* even on all four sides now the leading dot is gone — it was .58/.68 to
     balance the dot's optical weight, which read as crushed once removed */
  padding:.46rem .8rem;
  /* the 6% of translucency left above is there to be blurred — fully opaque and
     the backdrop-filter would be doing nothing at all */
  backdrop-filter:blur(12px) saturate(1.2);
  -webkit-backdrop-filter:blur(12px) saturate(1.2);
  box-shadow:0 12px 30px -14px rgba(0,0,0,.8),
    0 0 0 4px color-mix(in srgb,var(--accent) 8%,transparent);
  opacity:0;transform:translate(-50%,2px) scale(.97);transform-origin:50% 120%;
  transition:opacity .15s ease,transform .22s cubic-bezier(.2,.85,.28,1)}
/* wraps onto a second line rather than running off a phone-width viewport,
   balanced so a two-line hint does not leave one word alone on the second */
.tipx-t{display:block;white-space:normal;text-wrap:balance;line-height:1.5}
.tipx.on{opacity:1;transform:translate(-50%,0) scale(1)}
/* below the trigger instead of above it, when there is no room above */
.tipx.under{transform-origin:50% -20%;transform:translate(-50%,-2px) scale(.97)}
.tipx.under.on{transform:translate(-50%,0) scale(1)}
@media (prefers-reduced-motion:reduce){
  .tipx{transition:opacity .12s ease;transform:translate(-50%,0)}
  .tipx.on,.tipx.under,.tipx.under.on{transform:translate(-50%,0)}
}
@media print{.tipx{display:none!important}}
`;

// One implementation, used by both templates. `aria-checked` is kept in step with
// the resolved theme rather than assumed — the initial state can come from the OS
// preference, not just from a click.
const THEME_JS = `
(function(){
  var d=document.documentElement, btn=document.getElementById('th');
  function resolved(){
    return d.getAttribute('data-theme') ||
      (matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');
  }
  function sync(){ if(btn) btn.setAttribute('aria-checked', resolved()==='light'?'true':'false'); }
  /* Until the switch is pressed, NOTHING is stored and the OS setting is the
     source of truth — which means it can change while the page is open. The CSS
     follows that live through the media query, but aria-checked would not, so a
     screen reader would announce "off" on a page that had just gone light. Only
     re-syncs while no explicit choice exists; once one is stored it must win. */
  try{
    var mq=matchMedia('(prefers-color-scheme:dark)');
    var onSystemChange=function(){ if(!d.getAttribute('data-theme')) sync(); };
    if(mq.addEventListener) mq.addEventListener('change',onSystemChange);
    else if(mq.addListener) mq.addListener(onSystemChange);
  }catch(e){}
  // Theme choice is per-browser and deliberately never sent anywhere.
  try{ var s=localStorage.getItem('db-theme'); if(s) d.setAttribute('data-theme',s); }catch(e){}
  sync();
  if(btn) btn.addEventListener('click',function(){
    var next=resolved()==='dark'?'light':'dark';
    d.setAttribute('data-theme',next);
    try{ localStorage.setItem('db-theme',next); }catch(e){}
    sync();
  });

  /* Cursor-tracked highlight on the action controls. The light source is where
     your pointer actually is, so the control looks lit rather than merely
     recoloured — a fixed hover gradient is the tell that nothing is really
     responding to you. Pure enhancement: --px/--py have defaults in CSS, so
     without this script the controls simply light from their centre. */
  Array.prototype.forEach.call(document.querySelectorAll('[data-spot]'),function(el){
    el.addEventListener('pointermove',function(e){
      var r=el.getBoundingClientRect();
      el.style.setProperty('--px',((e.clientX-r.left)/r.width*100).toFixed(1)+'%');
      el.style.setProperty('--py',((e.clientY-r.top)/r.height*100).toFixed(1)+'%');
    });
  });
})();`;

/**
 * The switcher behaviour, shared by every template.
 *
 * The tabs stay ordinary links, so keyboard, middle-click, "open in new tab" and
 * no-JS all behave exactly as they did; this only adds pointer behaviour on top.
 * Point at the track and the indicator eases toward the tab under your cursor,
 * stretching slightly along its direction of travel, while the mesh cross-fades
 * from the colour of the page you are on to the colour of the page you are
 * pointing at. Drag it and it tracks your finger 1:1, then snaps and navigates.
 *
 * There is deliberately NO load-time entrance animation any more. The old one
 * slid the indicator in from the previous page's index, which needed a class on
 * the control, a sessionStorage read before first paint, and animation-fill-mode
 * both — and that class was what collided with .go and made the entire switcher
 * invisible. The hover behaviour communicates far more than the entrance did,
 * and it costs none of that machinery.
 */
/**
 * The morphing indicator, and the mobile menu.
 *
 * ⚠️ THE BUG THIS REPLACES — worth recording so it is not reinvented. The old
 * control began a drag on EVERY pointerdown anywhere on the track, and a
 * capture-phase click handler cancelled the link's navigation whenever the
 * pointer had travelled more than 3px between press and release. Its own
 * fallback then only navigated if the ROUNDED settled index differed from the
 * starting one — which a few pixels of drift never changes. So an ordinary click
 * with a little hand movement was swallowed whole: no navigation, no error,
 * nothing in the console. Reproduced in Chrome 2026-07-31 23:40 EDT by pressing
 * a tab and releasing 5px away. Nothing here intercepts clicks any more; tabs are
 * plain links and the navigation is the browser's.
 *
 * HOW THE MORPH WORKS. The indicator is not a fixed pill that slides. Its two
 * edges are tracked separately, and an edge that is EXPANDING the pill moves
 * about twice as fast as one that is CONTRACTING it. So the pill always reaches
 * the tab you are pointing at before its tail lets go — it stretches across the
 * gap, then gathers itself. That asymmetry is the entire effect, it is four
 * lines, and there is no keyframe or duration to keep in sync with anything.
 */
const NAV_JS = `
(function(){
  var still=matchMedia('(prefers-reduced-motion:reduce)').matches;
  /* Hover behaviour is bound only where hover exists. On a touch screen a
     :hover state latches on first tap and stays until you tap elsewhere, which
     is what left buttons "stuck mid-phase" all over the mobile site. */
  var fine=matchMedia('(hover:hover) and (pointer:fine)');
  var hex=function(c){ c=c.replace('#','');
    return [parseInt(c.slice(0,2),16),parseInt(c.slice(2,4),16),parseInt(c.slice(4,6),16)]; };
  var mix=function(a,b,t){ var A=hex(a),B=hex(b);
    return [Math.round(A[0]+(B[0]-A[0])*t),
            Math.round(A[1]+(B[1]-A[1])*t),
            Math.round(A[2]+(B[2]-A[2])*t)]; };
  var rgba=function(v,a){ return 'rgba('+v[0]+','+v[1]+','+v[2]+','+a+')'; };

  /* The goo blur, ramped rather than switched.
     There is ONE filter element shared by every group, so each group reports the
     blur it wants and the largest wins for that frame — with a single group
     morphing at a time (you can only point at one) that is exact, and if two are
     mid-move the stronger blur simply covers both. Reporting 0 and having every
     group report 0 leaves the filter harmless rather than needing to be removed. */
  var GOO_SD = 3.6;                     // must match GOO_SVG's feGaussianBlur
  var gooEl = document.querySelector('#dbgoo feGaussianBlur');
  var gooWant = {};
  function gooBlur(key, v){
    if(!gooEl) return;
    gooWant[key] = v;
    var mx = 0;
    for(var k in gooWant) if(gooWant[k] > mx) mx = gooWant[k];
    gooEl.setAttribute('stdDeviation', mx.toFixed(2));
  }

  [].slice.call(document.querySelectorAll('.seg')).forEach(function(seg, segIx){
    var tabs=[].slice.call(seg.querySelectorAll('.tab'));
    var ink=seg.querySelector('.seg-ink');
    var n=tabs.length; if(!n||!ink) return;
    var cols=tabs.map(function(a){ return a.getAttribute('data-accent'); });
    /* home is the tab for the page you are ON, or null for the other group */
    var home=parseInt(seg.getAttribute('data-at'),10);
    if(isNaN(home)||home<0) home=null;

    var A=ink.querySelector('.ib-a'), B=ink.querySelector('.ib-b'),
        C=ink.querySelector('.ib-c');
    var idx=home===null?0:home;
    var srcX=0,srcW=0,dstX=0,dstW=0;
    var p=1, t0=0, raf=0, sweep=0, litT=0;
    var cFrom=cols[idx], cTo=cols[idx];
    /* 760ms, not the ~200ms this ran at originally. The reference travels its
       pill over TWO seconds, which is the only reason its break is legible at
       all — at 200ms the tail had dissolved before the head arrived and there
       was nothing on screen to see. This is the most important number here. */
    var DUR=760;

    function H(){ return ink.clientHeight||26; }
    function box(i){ return [tabs[i].offsetLeft, tabs[i].offsetWidth]; }
    /* The tab's horizontal padding, so paint() can measure coverage of the LABEL
       rather than of the whole tab. Cached rather than read per frame: every tab
       carries the same padding, and it only changes when the breakpoint does — a
       getComputedStyle per tab per frame would force a style resolve 6 times a
       frame to learn a number that changes twice in the life of the page. */
    var padX=0;
    function padMeasure(){ padX = parseFloat(getComputedStyle(tabs[0]).paddingLeft) || 0; }
    padMeasure();
    function band(a,b,x){ x=Math.max(0,Math.min(1,(x-a)/(b-a))); return x*x*(3-2*x); }
    /* A damped spring, the one thing the mobile indicator has that this did not.
       Everything here eased with smoothstep, which decelerates into its target
       and stops dead — correct, and inert. This overshoots by about 5% around
       x=0.35 and rings down to exactly 1, so the arriving pill inflates a little
       past the tab and settles onto it. 5%, not the reference's 27%: its pill
       springs from nothing in the middle of a bar and has nowhere to land, ours
       has to come to rest on a specific word. Width is the right thing to spring
       because border-radius:999px keeps the caps circular at any width — a
       scaleX would have flattened them into ellipses at the peak. */
    function spr(x){ return x>=1 ? 1 : 1 - Math.exp(-8*x)*Math.cos(7.2*x); }
    function rgbOf(c){ return 'rgb('+hex(c).join(',')+')'; }
    function tween(t){ return 'rgb('+mix(cFrom,cTo,Math.max(0,Math.min(1,t))).join(',')+')'; }

    /* THE PILL COMES APART, it does not slide.
       The source shrinks away by 55% and the destination does not start forming
       until 28%, so around the middle of the move there is barely any pill on
       screen at all and the droplets are the only thing carrying the shape.
       That deliberate near-absence is the effect — an indicator that travels
       intact reads as a marker being repositioned, which is what this was. */
    function paint(){
      /* Blur in over the first 8% and out over the last 10%, so the filter is at
         zero strength on the frame it is attached and on the frame it is dropped.
         Every droplet has landed by 0.90 of the move (see spray()), so the fade
         never catches one mid-flight and turns it into a hard dot. */
      var bl = GOO_SD * band(0,0.08,p) * (1 - band(0.90,1,p));
      gooBlur(segIx, bl);
      var aw=srcW*(1-band(0.04,0.55,p));
      var bw=dstW*spr(band(0.28,1,p));
      /* ⚠️ The tail collapses toward the edge FACING the destination. It used
         to be pinned at srcX and only lose width, so on a left-to-right move
         the leftover slid LEFT — away from where the eye was going — and the
         whole thing read as the old pill fleeing rather than being drawn
         across. The head already grew from its centre; the tail did not. */
      var tailX = dstX>=srcX ? srcX+srcW-aw : srcX;
      /* ⚠️ THE DILATION IS CANCELLED BY RAMPING THE BLUR, NOT BY RESIZING.
         The filter inflates every edge: the crush thresholds blurred alpha at
         8/22 = 0.364 while a solid edge blurs to 0.5, so the painted contour sits
         outside the true edge and the pill renders fatter with flattened caps.
         Attaching that on the first frame of a move and dropping it on the last
         is what made the pill "increase in size" as motion started and "snap into
         shape" as it ended.
         Two attempts at correcting the GEOMETRY by a derived constant (1.26px per
         side) both failed: first only the width was corrected, which changed
         nothing visible, and then correcting the height over-shot and the pill
         snapped by EXPANDING instead of shrinking. The lesson is that the exact
         dilation depends on the whole filter chain and on how the browser
         rasterises it, and a number derived on paper is not it — the same trap
         recorded for the accent-colour fitting in reference_goo_metaball_recipe.
         So the blur is ramped 0 -> full -> 0 across the move instead. The
         dilation is a function of the blur, so it goes to zero on its own at both
         ends and the attach/detach are no-ops WITHOUT anyone needing to know what
         the constant is. See gooBlur() above.

         ⚠️ THE RAMP ALONE WAS NOT ENOUGH, and the reason is worth keeping. The
         dilation is PROPORTIONAL to the blur, so ramping the blur down over the
         last 10% of the move does not remove the size change — it spreads it over
         those ~76ms. The pill still visibly shrinks at the end, and still visibly
         grows over the first ~61ms, which is exactly what a snap looks like when
         nothing else on screen is moving. Ramping made it smoother, not absent.
         So the geometry is compensated by the CURRENT blur on every frame, which
         holds the painted size constant at every point in the move AND collapses
         to zero at both ends on its own.

         ⚠️ THE DILATION IS ANISOTROPIC, and that is why three attempts failed.
         Measured by rasterising THIS filter chain over a 100x25 rounded rect into
         a canvas at 4x and reading the alpha extents (0.25px resolution):

             stdDeviation   0.6   1.2   1.8   2.4   3.0   3.6
             dW per side   0.25  0.25  0.25  0.50  0.50  0.50
             dH per side   0.25  0.25  0.50  0.75  1.00  1.25

         At full blur the height grows 2.5x as much as the width. A 25px-tall pill
         is short relative to a 3.6 blur, so its caps — which are pure curvature —
         dilate far more than its flanks do. Every earlier attempt assumed one
         isotropic number: correcting only the width was invisible because width
         barely moves, and then correcting the height BY THE WIDTH FIGURE (1.26,
         derived from erfc) overshot and made it snap outward instead.
         The constants below are not that table directly — they are SOLVED, by
         feeding a pre-shrunk rect back through the same filter and searching for
         the shrink that paints exactly 100x25 again:

             stdDeviation   1.2    1.8    2.4    3.0    3.6
             dH that lands  0.25   0.50   0.625  0.75   1.125

         which is why dilH is two segments rather than one slope. Do not replace
         any of this with a derivation — the erfc figure was 1.26 and the truth at
         full blur is 1.125 vertically and 0.50 horizontally. Re-measure with the
         canvas method if the blur, the crush matrix or the pill's height changes;
         the measuring script is in the session log for 2026-08-01 17:05 EDT. */
      var dilW = Math.min(0.50, 0.20 * bl);
      var dilH = bl <= 3 ? 0.25 * bl : 0.75 + (bl - 3) * 0.625;
      var dil = dilW;
      /* ⚠️ The tail collapses in BOTH dimensions. It used to lose width while
         keeping the pill's full height, so it ended as a narrow full-height bar
         that the goo dilated into a standing capsule — a fragment left hanging
         beside the pill that looked, exactly as Harkirat put it, like it had hit
         a wall. It did: it shrank horizontally and then stopped. Tapering the
         height as the width goes lets it die like a droplet instead. The head
         gets the same treatment so it emerges as a blob rather than unrolling
         from a full-height sliver. */
      /* ⚠️ THE DILATION IS TWO-DIMENSIONAL. An earlier pass compensated only the
         WIDTH and the x-position and left the height alone, which fixed nothing
         visible: measured frame-by-frame off a 2x capture, the settled pill was
         54px tall while the filter was attached and 49px the frame after it
         detached, and jumped back to 54 the frame a move began. 5 device px is
         2.5 CSS px is 1.25 per side — the dilation, in the one axis that was
         never corrected. That step IS the "snaps into shape abruptly, and then
         when the motion starts it increases in size".
         The pill's height is the ink box less its 3px insets, so shrinking it by
         the same 1.26px per side is a scaleY factor. Folded into the taper below
         rather than done in CSS because .ib-c shares the .ib class and a
         .seg.morph .ib rule setting top would out-specify the neck's own
         top:50% and knock it off the centre line. */
      var ph = Math.max(1, H() - 6);
      var vcomp = (ph - 2*dilH) / ph;
      var sy = w => Math.max(0.14, Math.min(1, w/26)) * vcomp;
      A.style.transform='translateX('+(tailX+dil)+'px) scaleY('+sy(aw).toFixed(3)+')';
      A.style.width=Math.max(0,aw-2*dil)+'px';
      /* Grows from its own centre, so it inflates into place rather than
         unrolling from one edge. */
      B.style.transform='translateX('+(dstX+(dstW-bw)/2+dil)+'px) scaleY('+sy(bw).toFixed(3)+')';
      B.style.width=Math.max(0,bw-2*dil)+'px';
      /* The neck exists only while the mass is tearing. Past 40% the droplets
         are the only bridge, which is what makes the break read as a break. */
      var l=Math.min(tailX+aw,dstX), r=Math.max(tailX,dstX);
      C.style.transform='translate('+l+'px,-50%)';
      C.style.width=Math.max(0,r-l)+'px';
      /* ⚠️ The neck also thins with DISTANCE, not just with time.
         It used to span src→dst whatever the gap, so a long move (Terms →
         Contributing is four tabs) drew one continuous mass across half the bar
         — the pill stopped reading as a pill and became a smear. A membrane that
         long is not what a tearing droplet does anyway. Past about three pill
         widths of separation the neck is gone entirely and the droplets carry the
         connection, which is what they are FOR and what the comment above already
         claims happens. Short hops between neighbours are unaffected. */
      /* Capped at 0.5: the neck THINS with distance, it does not disappear.
         Suppressing it outright on long moves was a mistake — the neck IS the
         tear. Without it a long move reads as "the old pill shrinks here and a
         new one appears over there", with droplets in between but nothing
         connecting them, and the breaking-apart stops being legible at all.
         Half thickness keeps the membrane visible without letting it draw a
         solid bar across half the nav. */
      var span=Math.max(0,r-l);
      var reach=Math.min(0.5,span/(Math.max(dstW,srcW,1)*3));
      /* ⚠️ THE NECK IS A BELL, NOT A DECAY — it grows, peaks, and snaps.
         It used to start at full height on frame ONE, which meant the very first
         thing a move drew was a uniform ribbon spanning the whole gap, at full
         length, before a single droplet existed. That reads as a rubber band
         being stretched between two points, not as a mass tearing: the
         connection was established instantly and then broke up.
         On a SHORT hop it was worse and is what made neighbouring tabs feel like
         "a sluggish morph" rather than a pop — the gap is small, so the instant
         ribbon simply welded the two pills into one blob that widened and
         narrowed, and they were never separate at any point in the move.
         sin() from 0 gives height 0 at p=0, a peak around p=0.25 while the source
         is actually stretching, and nothing left by p=0.5 — after which the
         droplets are the only bridge, which is what they are for. */
      var bell=Math.sin(Math.PI*band(0,0.5,p));
      /* ⚠️ THE EXPONENT IS WHAT LETS A LONG MOVE COME APART, and it is set against
         the crush threshold rather than by eye. #dbgoo blurs at stdDeviation 3.6
         and thresholds alpha at 8/22 = 0.364, so a horizontal bar only survives
         the crush above about 3.4px tall. Traced frame by frame in Chrome on a
         Terms-to-Notice move, the neck peaked at 7.7px while spanning a 183px
         gap — a ribbon twice as thick as it needed to be to stay welded, held
         for ~350ms. The droplets were all there (14 of them, the whole time);
         they were simply strung on a wire, which is why it never read as
         breaking apart.
         The power drops the peak to ~2.7px at reach 0.5 — a long move, which
         now parts — while leaving reach 0.048 (neighbouring tabs) at 0.88 of
         its old height. Those sit 9px apart and SHOULD merge: two metaballs
         that close genuinely are one blob, and forcing a break there would be
         the effect lying about distance.
         ⚠️ Re-derive if stdDeviation or the crush matrix changes. */
      C.style.height=Math.max(0,H()*0.5*bell*Math.pow(1-reach,2.5))+'px';
      /* Colour is per PIECE and solid, not one ramp across the whole control.
         The ramp was why the colour lagged: a piece sitting on the destination
         still carried some of the origin's hue until the move ended. Now the
         new pill is its own colour from the first frame it exists, the residue
         keeps the old one, and only the parts in between are a transition. */
      A.style.backgroundImage='none'; A.style.background=rgbOf(cFrom);
      B.style.backgroundImage='none'; B.style.background=rgbOf(cTo);
      var fwd=dstX>=srcX;
      C.style.backgroundImage='linear-gradient(90deg,'
        +rgbOf(fwd?cFrom:cTo)+','+rgbOf(fwd?cTo:cFrom)+')';
      C.style.backgroundSize='100% 100%';
      C.style.backgroundPosition='0 0';

      /* ⚠️ THE LABEL FOLLOWS THE PILL'S GEOMETRY, NOT A DELAYED CLASS, and this
         replaces lit()'s styling entirely. The old scheme toggled .lit at
         DUR*0.8 — 608ms into a 760ms move — so for the first four fifths the
         arriving label sat at --ink2 (a light lavender grey) ON TOP of a solid
         accent pill, and then flipped to near-black and 700 weight in a single
         frame. Three complaints, one cause: "why is the text white", "the
         weight snaps from thin to medium", and "on Terms it stays orange then
         switches to black at the end". A discrete state cannot describe a
         continuous one.

         Coverage is the honest quantity: how much of this tab's LABEL the pill
         actually covers right now, taking whichever of the two pieces covers it
         more.

         ⚠️ THE LABEL, NOT THE TAB'S BOX — and getting this wrong is why the
         timing could not be tuned into feeling right, only traded between two
         kinds of wrong. A tab carries 1.02rem of padding on each side, so about
         33px of a ~63px tab is padding. Measuring the padding box meant "half
         covered" could mean the pill had not reached a single letter yet, and the
         relationship between the number and what the eye sees changed with every
         label's length: "Notice" and "Contributing" crossed over at visibly
         different moments in their own moves. Against the content box, 0.5 means
         half the glyphs are on the pill, on every tab, at every width — so the
         crossover can be placed once and be right everywhere.

         ⚠️ THE HEAD IS PAINTED CENTRED, so its rect must be too. This used the
         destination's own left edge with the head's current width, i.e. a rect
         growing from the LEFT, while the element is positioned at
         dstX+(dstW-bw)/2 and inflates from its centre. For the destination tab
         the total overlap came out the same by luck, but it was accumulating on
         the wrong side of the word — the label committed as the pill's leading
         edge passed, rather than as the pill spread out under it — and for the
         NEIGHBOURING tab it was simply wrong. Both pieces are also inset by the
         goo's own dilation, so these are the exact rects being painted.

         Read nothing from layout here. box() is offsetLeft/offsetWidth, which
         the browser has cached since the last reflow; padX is cached from the
         last resize; the pill's extent is already in hand.

         ⚠️ COVERAGE IS TWO-DIMENSIONAL, and leaving out the second dimension is
         what made the switch fire early and read as a separate event. Both pieces
         are tapered in HEIGHT as they narrow (sy() below: a piece under 26px wide
         is scaled down to as little as 0.14 of the pill's height) so that they die
         like droplets instead of standing full-height slivers. A head that is
         30px wide but a fifth of the pill's height sits BESIDE the glyphs, not
         under them — but a horizontal-only overlap scores it as fully covering.
         Measured before this was added: on a Terms -> Notice hover the label was
         fully committed to near-black 84ms into a 760ms move, while the pill was
         still visibly assembling out of droplets. Multiplying by the taper is what
         holds the colour until there is actually a pill under the word. */
      var shown = home!==null || seg.classList.contains('hot');
      var tap = w => Math.max(0.14, Math.min(1, w/26));
      var piece = [[tailX+dil, aw-2*dil, tap(aw)],[dstX+(dstW-bw)/2+dil, bw-2*dil, tap(bw)]];
      for(var q=0;q<n;q++){
        var tb=box(q), cov=0;
        var lx=tb[0]+padX, lw=tb[1]-2*padX;
        if(shown && lw>0){
          for(var k=0;k<2;k++){
            var s=piece[k][0], w=piece[k][1];
            if(w<=0) continue;
            var ov=Math.min(lx+lw, s+w) - Math.max(lx, s);
            if(ov>0) cov=Math.max(cov, (ov/lw) * piece[k][2]);
          }
        }
        /* ⚠️ CENTRED ON 0.5, NOT BIASED. band() is a smoothstep, so its output is
           0.5 exactly when cov is (a+b)/2 — and now that cov measures the LABEL,
           cov 0.5 means half the glyphs are on the pill, which is precisely the
           moment the label's colour should be halfway between the two. a+b=1 is
           what ties the colour to the pill instead of to the clock.
           The earlier 0.30/0.58 was biased early to compensate for measuring the
           padding box, where the pill reached the letters much later than the
           number implied. With the honest quantity the bias is not needed and the
           crossover can be symmetric, which is what makes the two halves of a
           move feel the same. Width 0.44 is a deliberate choice over something
           snappier: the label passes through the mid tone for roughly a fifth of
           the move, and a smoothstep spends most of that near its endpoints. */
        tabs[q].style.setProperty('--cov', band(0.28,0.72,cov).toFixed(3));
      }
    }
    function step(now){
      p=Math.min(1,(now-t0)/DUR);
      /* Drop the goo the instant the move settles. A Gaussian blur erodes a
         curve in proportion to its curvature, so thresholding a resting stadium
         flattens its caps into a rounded rectangle — see the .seg-ink note. */
      if(p>=1){ cFrom=cTo; seg.classList.remove('morph'); }
      paint();
      raf = p<1 ? requestAnimationFrame(step) : 0;
    }

    /* The droplets, and the reason they behave the way the reference's do.
       Its particles START on a wide radius and END on a tight one — they fly
       INWARD and the pill scales up as they arrive, so the shape looks
       assembled out of them. Ours additionally have somewhere to go, so each
       one leaves the pill being broken, is flung out on its own angle, and then
       converges into the centre of the pill being built. */
    function spray(){
      clearTimeout(sweep);
      [].slice.call(ink.querySelectorAll('.pt')).forEach(function(n){ n.remove(); });
      if(still) return;
      /* ⚠️ THE VERTICAL THROW IS BOUNDED ON PURPOSE — do not scale it back up.
         This used to reach 0.60h from the centre line. h is the ink box (31px),
         so that is 18.6px, and a droplet is up to 20px wide, and the goo filter
         blurs it by about another 7px: roughly 36px from the centre of a bar
         whose half-height is 27. The droplets therefore fell OUT of the bar and
         hung over the page content — "particles exploding vertically all over
         the place", which is exactly what it looked like.
         The budget now: 0.28h (8.7px) of throw + an 8px radius + ~7px of blur =
         ~24px, comfortably inside the 27px half-bar. Nothing is clipped, which
         matters — clipping at the bar edge would slice droplets mid-flight and
         draw a hard horizontal line, which reads worse than the overflow did.
         If you change h, the pill height or the blur, re-do this arithmetic. */
      /* ⚠️ THE VERTICAL BUDGET IS FIXED BY THE BAR; THE SCATTER LIVES SIDEWAYS.
         Half the bar is 27px. A droplet is up to 19px wide (9.5px radius) and the
         goo blur adds roughly 7px, so the most a droplet centre may leave the
         centre line by is 27 - 9.5 - 7 = 10.5px, which at h=31 is 0.34h. The old
         0.60h was 18.6px and that is exactly why they fell out of the bar.
         So the separation that makes the pill READ as coming apart has to be
         horizontal - along the path, where there is no such limit. That is the
         lever: spread along the run, and count. An earlier pass cut the vertical
         throw AND the horizontal scatter AND the count AND the size together, and
         the effect disappeared - the droplets stayed so close to the pill that the
         alpha crush simply fused them back into it and it read as one blob with a
         bump. Change ONE of these at a time and look at it. */
      var n=14, h=H(), max=0;
      var EZ=['cubic-bezier(.32,.72,.36,1)','cubic-bezier(.18,.86,.32,1)',
              'cubic-bezier(.45,.55,.25,1)','cubic-bezier(.25,.9,.45,.98)'];
      var sc=srcX+srcW/2, dc=dstX+dstW/2, run=dc-sc;
      for(var i=0;i<n;i++){
        var el=document.createElement('i');
        el.className='pt';
        /* Jittered by nearly a full slot either way rather than a fixed 0.6 rad
           bias, so the ring of departure angles stops reading as a ring. */
        var a=(i/n)*Math.PI*2+(Math.random()-0.5)*(Math.PI*2/n)*1.9;
        var x0=srcX+srcW*(0.08+0.84*Math.random());
        /* y0 is the spawn point, at opacity 0 and scale .15 - never seen, so it
           costs nothing visually and is not part of the budget above. */
        var y0=(Math.random()-0.5)*h*0.45;
        var t=0.10+0.80*Math.random();
        var x1=sc+run*t+Math.cos(a)*22;
        /* ⚠️ RE-DERIVED, because the droplets are shorter now. The old cap was
           27 - 9.5 - 7 = 10.5px (0.34h): half a 19px-wide DISC plus the blur.
           A droplet is at most 11px TALL now, so the same arithmetic gives
           27 - 5.5 - 7 = 14.5px, which is 0.47h. The extra 4px is spent on
           spread, not on flinging anything out of the bar — the bound is still
           the bar's half-height and nothing may exceed it. */
        var y1=Math.sin(a)*(h*0.10+Math.random()*h*0.37);
        var x2=dc+Math.cos(a)*(4+Math.random()*10);
        /* ⚠️ THE ARRIVAL IS ALMOST ON THE CENTRE LINE, and that is not fussiness.
           The pill is 25px tall, so its half-height is 12.5. A droplet is up to
           19px across — 9.5px of radius — and it reaches this stop at full scale
           and full opacity. At the old ±4px of vertical offset that is 13.5px
           from the centre: the droplet stuck out past the top or bottom edge of
           a pill that had already finished forming, and read as a stray ball
           parked on it. ±2px keeps every droplet inside (9.5 + 2 < 12.5).
           Variety at the arrival is carried HORIZONTALLY by x2, where the pill is
           49px wide and there is room for it. */
        /* Same re-derivation at the arrival: the pill's half-height is 12.5 and
           a droplet's half-height is now at most 5.5, so 3.5px of offset still
           lands it fully inside (5.5 + 3.5 < 12.5) where 2px was the limit for
           a 9.5px-radius disc. */
        var y2=Math.sin(a)*(0.4+Math.random()*3.1);
        /* ⚠️ EVERY DROPLET MUST LAND BEFORE THE PILL DOES. This is a hard cap,
           not a tuning value, and the old numbers broke it arithmetically:
           dur reached 0.92*DUR and del reached i*0.014*DUR + 44ms, which at i=13
           is another 0.18*DUR — so the slowest droplet finished at 1.10*DUR,
           about 120ms AFTER the pill had settled. Those stragglers were seen
           dropping into a pill that was already sitting there, which is the
           "delay/lag of the particles dropping into the pill from above/below"
           at the end of the move.
           The droplets are supposed to BUILD the pill, so the pill arriving is
           the last thing that happens. dur is therefore clamped against this
           droplet's own delay so del+dur can never exceed the move itself. */
        /* ⚠️ UNORDERED. This was i*DUR*0.010 + jitter, so the launch order was
           the DOM order and the burst read as a sweep from one end. The hard cap
           below (del+dur <= 0.90*DUR) is what actually protects the arrival, so
           the delay itself is free to be random. */
        var del=Math.round(Math.random()*DUR*0.15);
        var dur=Math.round(Math.max(DUR*0.30,
                  Math.min(DUR*(0.42+Math.random()*0.46), DUR*0.90-del)));
        if(dur+del>max) max=dur+del;
        var rot=(Math.random()-0.5)*2; rot = (rot>0 ? rot+0.35 : rot-0.35)*26;
        /* ⚠️ CLAMP THE ROTATION AGAINST THE TRAVEL DISTANCE. This is the actual
           cause of droplets "exploding vertically" far outside the bar, and it is
           not the y values — those are small.
           The keyframes apply rotate(r) then translate(x,y), in that order, so the
           translation happens in the ROTATED frame and a horizontal offset is
           converted into a vertical one by sin(r). --x1 grows with how far the
           pill travels — up to ~350px across a four-tab group — while r was a
           fixed ±31deg at the last stop. sin(31deg) x 350px is ~180px of purely
           vertical displacement, which is how droplets ended up 100px BELOW a
           54px bar, on top of the page. Measured before this clamp: 85px above
           and 100px below.
           So r is bounded per droplet by the offset it is actually rotating:
           allow at most PERP px of perpendicular swing. Short hops keep the full
           bow (the thing the rotation is for, see the keyframe note); long moves
           get almost none, which is correct — nothing about a droplet crossing
           the bar should send it out of the bar. Divided by 1.2 because the final
           keyframe multiplies rot by that. */
        var PERP=9;
        var reach=Math.max(Math.abs(x1),Math.abs(x2),1);
        var cap=Math.asin(Math.min(1,PERP/reach))*180/Math.PI/1.2;
        rot=Math.max(-cap,Math.min(cap,rot));
        /* ⚠️ THE 11px FLOOR WAS DERIVED FOR A CIRCLE, AND THAT WAS THE WHOLE
           PROBLEM. It came from 1-exp(-(d/2)^2/(2*3.6^2)) = 0.364, which is the
           smallest CIRCLE the crush will paint. Every droplet therefore had to
           be at least 11px in BOTH axes, so they could only ever be fat discs —
           "too thick and blobby", and fourteen of the same lozenge besides.

           But the crush does not threshold on diameter, it thresholds on blurred
           peak alpha, and an elongated shape reaches that with far less
           thickness. Rasterised through a replica of #dbgoo and read off the
           canvas (# solid, + faint, . invisible):

               h =    3  4  5  6  7  8 10 12
               w= 8   .  .  .  .  #  #  #  #
               w=10   .  .  .  #  #  #  #  #
               w=12   .  .  +  #  #  #  #  #
               w=14   .  .  #  #  #  #  #  #
               w=18   .  +  #  #  #  #  #  #
               w=22   .  +  #  #  #  #  #  #

           So a 22x5 lozenge paints solid where an 8x5 does not: thickness can go
           to 5px as long as the droplet is long. minW() below is that table, and
           nothing is spawned outside it — a droplet that cannot paint is worse
           than no droplet, because it still costs layout and still occupies one
           of the fourteen slots.
           ⚠️ Re-measure the table if stdDeviation or the crush matrix changes. */
        var ph=5+Math.random()*6;                       // 5 - 11 tall
        var minW = ph<5.5 ? 14 : ph<6.5 ? 10 : 8;       // from the table above
        var pw=Math.min(24, Math.max(minW, ph*(1+Math.random()*1.9)));
        /* Not ellipses — blobs. Four independent corner radii give each droplet
           an asymmetric silhouette, so a pass never shows the same shape twice,
           and the crush keeps the edges liquid rather than geometric. */
        var r4=function(){ return (38+Math.random()*24).toFixed(0)+'%'; };
        var br=r4()+' '+r4()+' '+r4()+' '+r4()+' / '+r4()+' '+r4()+' '+r4()+' '+r4();
        el.style.cssText='--w:'+pw.toFixed(1)+'px;--ph:'+ph.toFixed(1)+'px;--br:'+br+';'
          +'--x0:'+x0.toFixed(1)+'px;--y0:'+y0.toFixed(1)+'px;'
          +'--x1:'+x1.toFixed(1)+'px;--y1:'+y1.toFixed(1)+'px;'
          +'--x2:'+x2.toFixed(1)+'px;--y2:'+y2.toFixed(1)+'px;'
          /* The merge point: the destination pill's own centre. See ptFly's last
             keyframe — the droplet has to arrive INSIDE the pill for the alpha
             crush to fuse them, not near it. */
          +'--x3:'+dc.toFixed(1)+'px;'
          +'--rot:'+rot.toFixed(0)+'deg;'
          +'--t:'+dur+'ms;--d:'+del+'ms;'
          /* A per-droplet easing is the cheapest real randomiser here: fourteen
             droplets on one curve arrive in formation however scattered their
             paths are. */
          +'--ez:'+EZ[(Math.random()*EZ.length)|0]+';'
          +'--pc:'+tween(run?(x1-sc)/run:1)+';'
          /* The colour it ARRIVES in. Without this the droplet kept its
             spawn-time tween colour all the way onto the destination pill and
             showed as a darker patch inside it — see the ptFly note. */
          +'--pc2:'+rgbOf(cTo);
        ink.appendChild(el);
      }
      sweep=setTimeout(function(){
        [].slice.call(ink.querySelectorAll('.pt')).forEach(function(n){ n.remove(); });
      }, max+140);
    }

    /* ── the pill's ARRIVAL, played once, on page load ──────────────────────
       Harkirat's ask: the desktop pill should be ASSEMBLED out of converging
       droplets when a page loads, the way the mobile indicator already is, and
       then behave normally — the hover morph — for the rest of the visit.

       ⚠️ It is not a second animation system. A birth is just a move whose SOURCE
       has no width: set srcX = dstX and srcW = 0 and every line of paint() already
       does the right thing — the tail is skipped (its width is zero), the neck
       spans nothing (l and r collapse to the same x), and the head grows from the
       destination's own centre through the same spring. So this shares the goo
       ramp, the dilation compensation, the label's coverage colour and the settle,
       and cannot drift away from them.

       What differs is only where the droplets come FROM. In a move they are torn
       off a departing pill and carried along the run; here there is nothing to
       tear, so they start on a wide ring around the pill's centre and fall inward
       — which is the mobile choreography, and reads as the shape being assembled
       rather than delivered.

       ⚠️ ONLY the group that owns the current page. A group you are not in has no
       pill at rest, so there is nothing to create and a burst of droplets would
       announce an indicator that is about to vanish. */
    function sprayBirth(){
      if(!ink) return;
      clearTimeout(sweep);
      var n=14, h=H(), max=0;
      var EZ=['cubic-bezier(.32,.72,.36,1)','cubic-bezier(.18,.86,.32,1)',
              'cubic-bezier(.45,.55,.25,1)','cubic-bezier(.25,.9,.45,.98)'];
      var dc=dstX+dstW/2;
      /* The ring. Wide enough that the droplets are clearly separate objects
         before they converge — inside about 40px the crush fuses them into the
         forming pill immediately and the whole thing reads as a fade-in. Scaled
         off the pill's own width so it stays proportionate on a tightened bar. */
      var R0=Math.max(58,dstW*1.25), R1=Math.max(74,dstW*1.7);
      for(var i=0;i<n;i++){
        var el=document.createElement('i');
        el.className='pt';
        var a=(i/n)*Math.PI*2+(Math.random()-0.5)*(Math.PI*2/n)*1.9;
        var rr=R0+Math.random()*(R1-R0);
        /* ⚠️ THE VERTICAL BOUND IS THE SAME ONE THE MOVE OBEYS. The bar is 54px,
           so the pill's half-height is 27; a droplet is at most 11px tall and the
           blur reaches ~7px, leaving 14.5px of usable throw. A ring is a circle in
           principle and a very flat ellipse here on purpose — the scatter that
           reads as "coming together" has to be HORIZONTAL, because vertical space
           does not exist. */
        var ry=h*0.42;
        var x0=dc+Math.cos(a)*rr*1.18, y0=Math.sin(a)*ry*1.1;
        var x1=dc+Math.cos(a)*rr,      y1=Math.sin(a)*ry;
        var x2=dc+Math.cos(a)*(4+Math.random()*10);
        var y2=Math.sin(a)*(0.4+Math.random()*3.1);
        var del=Math.round(Math.random()*DUR*0.16);
        var dur=Math.round(Math.max(DUR*0.34,
                  Math.min(DUR*(0.46+Math.random()*0.42), DUR*0.90-del)));
        if(dur+del>max) max=dur+del;
        var rot=(Math.random()-0.5)*2; rot=(rot>0?rot+0.35:rot-0.35)*26;
        var PERP=9;
        var reach=Math.max(Math.abs(x1),Math.abs(x2),1);
        var cap=Math.asin(Math.min(1,PERP/reach))*180/Math.PI/1.2;
        rot=Math.max(-cap,Math.min(cap,rot));
        var ph=5+Math.random()*6;
        var minW = ph<5.5 ? 14 : ph<6.5 ? 10 : 8;
        var pw=Math.min(24, Math.max(minW, ph*(1+Math.random()*1.9)));
        var r4=function(){ return (38+Math.random()*24).toFixed(0)+'%'; };
        var br=r4()+' '+r4()+' '+r4()+' '+r4()+' / '+r4()+' '+r4()+' '+r4()+' '+r4();
        /* One colour throughout: there is no gradient to tween across, because
           there is no pill being left behind. */
        var c=rgbOf(cTo);
        el.style.cssText='--w:'+pw.toFixed(1)+'px;--ph:'+ph.toFixed(1)+'px;--br:'+br+';'
          +'--x0:'+x0.toFixed(1)+'px;--y0:'+y0.toFixed(1)+'px;'
          +'--x1:'+x1.toFixed(1)+'px;--y1:'+y1.toFixed(1)+'px;'
          +'--x2:'+x2.toFixed(1)+'px;--y2:'+y2.toFixed(1)+'px;'
          +'--x3:'+dc.toFixed(1)+'px;'
          +'--rot:'+rot.toFixed(0)+'deg;'
          +'--t:'+dur+'ms;--d:'+del+'ms;'
          +'--ez:'+EZ[(Math.random()*EZ.length)|0]+';'
          +'--pc:'+c+';--pc2:'+c;
        ink.appendChild(el);
      }
      sweep=setTimeout(function(){
        [].slice.call(ink.querySelectorAll('.pt')).forEach(function(n){ n.remove(); });
      }, max+140);
    }

    function birth(){
      var b=box(home);
      idx=home;
      srcX=dstX=b[0]; srcW=0; dstW=b[1];
      cFrom=cTo=cols[home];
      p=0; t0=performance.now();
      seg.classList.add('morph');
      lit(home,DUR*0.55);
      sprayBirth();
      if(!raf) raf=requestAnimationFrame(step);
    }

    function aim(i,snap){
      var b=box(i);
      if(snap||still){
        idx=i; srcX=dstX=b[0]; srcW=dstW=b[1]; p=1;
        cFrom=cTo=cols[i]; seg.classList.remove('morph'); lit(i); paint(); return;
      }
      /* ⚠️ THE EARLY RETURN MUST STILL REPAINT — this is the exact mirror of the
         bug in rest(), at the other end of the same journey. Nothing has to MOVE
         when you point at the tab the pill is already parked on, so this returns
         before starting a frame loop. But for a group you are not in, the pill was
         INVISIBLE a moment ago: paint() gates coverage on -shown-, which is false
         until .hot goes on, so the last --cov written for these tabs was 0. The
         indicator then fades in over the label via CSS while the label is still
         painted for a bare bar, i.e. dull ink on a bright pill.
         It only showed on the FIRST tab of a cold group, because idx is left at 0
         by the initial snap — hover any other tab first and aim() takes the normal
         path, which is why moving to Contributors and back "fixed" it. */
      if(i===idx&&p>=1){ lit(i); paint(); return; }
      /* Break from where the pill actually IS. Mid-flight the destination is
         the only piece with real size, so that is what the next move tears. */
      var bw=dstW*spr(band(0.28,1,p));
      if(bw>6){ srcX=dstX+(dstW-bw)/2; srcW=bw; cFrom=cTo; }
      else { srcW=Math.max(srcW*(1-band(0.04,0.55,p)),10); }
      idx=i; dstX=b[0]; dstW=b[1]; cTo=cols[i];
      p=0; t0=performance.now();
      seg.classList.add('morph');
      lit(i,DUR*0.8); spray();
      if(!raf) raf=requestAnimationFrame(step);
    }
    /* The inverted label is only correct while the pill is actually UNDER it,
       and that is true in TWO senses. It must not apply to a group whose
       indicator is hidden — that painted "Contributing" near-black on the dark
       bar and the label vanished. And it must not apply the instant a move
       STARTS, because the destination pill does not exist until 28%.
       0.8, not 0.4: the destination pill's width is dstW*band(0.28,1,p), so at
       p=0.4 it is 11px behind a 79px label and at p=0.65 still only 41px. The
       label was going near-black while more than half of it sat on the dark bar,
       which is the same defect as the vanished "Contributing" in a slower form.
       band reaches ~0.9 at p=0.81, so the swap waits until the pill is actually
       under the word it is inverting. */
    /* ⚠️ CLEARING AND SETTING ARE TWO DIFFERENT MOMENTS, and treating them as
       one is what made a label unreadable while you were hovering. This used to
       toggle every tab in a single pass at DUR*0.8 — so the tab the pill was
       LEAVING kept its near-black for 600ms after the pill had gone, sitting on
       the dark bar with nothing behind it. The delay is right for the arriving
       label and wrong for the departing one; they are opposite events.
       The old label is dropped on the same frame the move starts, which hands it
       back to .tab's own 0.3s colour transition, so it fades up to readable ink
       as the pill peels off it rather than snapping. */
    function lit(i,delay){
      clearTimeout(litT);
      var vis = home!==null || seg.classList.contains('hot');
      tabs.forEach(function(a,j){ if(j!==i) a.classList.remove('lit'); });
      var set=function(){ tabs.forEach(function(a,j){ a.classList.toggle('lit', vis&&j===i); }); };
      if(delay) litT=setTimeout(set,delay); else set();
    }
    /* ⚠️ THIS PATH MUST REPAINT, and not doing so is what left a nav label stuck
       near-black on the dark bar. paint() gates coverage on -shown-, which is
       false for a group you are not in the moment -hot- comes off — but on this
       branch nothing called paint(), and if the move had already SETTLED there
       was no rAF left to call it either (step() sets raf=0 at p>=1). So every tab
       in that group kept the --cov of its last frame until the next hover.
       That is the whole of "sometimes": it happened only when you paused on the
       tab long enough for the move to finish before leaving it, which is why a
       quick pass over the bar never showed it. */
    function rest(){
      seg.classList.remove('hot');
      if(home===null){ clearTimeout(litT);
        tabs.forEach(function(a){ a.classList.remove('lit'); });
        paint(); return; }
      aim(home,false);
    }

    tabs.forEach(function(a,i){
      a.addEventListener('mouseenter',function(){
        if(!fine.matches) return;
        seg.classList.add('hot'); aim(i,false);
      });
      a.addEventListener('focus',function(){ seg.classList.add('hot'); aim(i,false); });
      a.addEventListener('blur',function(){
        if(!seg.contains(document.activeElement)) rest();
      });
      /* Arrows move FOCUS along the group — the standard behaviour for a set of
         related links. The old handler navigated on keydown, so pressing an
         arrow while reading the bar loaded a different document. */
      a.addEventListener('keydown',function(e){
        var d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;
        if(!d) return;
        e.preventDefault();
        tabs[(i+d+n)%n].focus();
      });
    });
    seg.addEventListener('mouseleave',function(){ if(fine.matches) rest(); });

    /* ⚠️ THE FIRST PAINT IS THE ONE PLACE AN ANIMATION FROM ZERO WIDTH IS RIGHT.
       It used to snap, on the reasoning that growing a pill out of nothing reads
       as a glitch — true when it happens mid-visit, for no reason the reader can
       see. On ARRIVAL it is the opposite: the page has just been replaced, so
       every element is new, and the indicator assembling itself is the one moment
       that explains what it is. It plays once and never again; hovering from then
       on is the ordinary morph.
       Snapped still for a group that owns no page (nothing to create), and under
       prefers-reduced-motion. The still flag already covers coarse pointers. */
    if(home!==null && !still && !matchMedia('(prefers-reduced-motion:reduce)').matches){
      birth();
    } else {
      aim(home===null?0:home,true);
    }
    addEventListener('resize',function(){ padMeasure(); aim(idx,true); });
  });

  /* ── the mobile strip ─────────────────────────────────────────────────
     The indicator here is deliberately NOT the desktop morph. There is no
     hover on a phone, so there is no "moving between two known points" to
     animate — a tap is a single discrete event. So this clones the reference
     implementation's choreography instead: particles appear on a WIDE radius
     and converge INWARD while the pill scales up from nothing, which reads as
     the shape being assembled rather than moved.

     It plays on PAGE LOAD, not only on tap. Each tab is a real link to a real
     document, so a tap tears the page down mid-animation and you would never
     see it; arriving is the moment that has time for it. */
  var strip=document.getElementById('mstrip'), gw=document.getElementById('mgw');
  if(strip&&gw){
    var goo=gw.firstElementChild;
    var mtabs=[].slice.call(strip.querySelectorAll('.mtab'));
    var cur=mtabs.indexOf(strip.querySelector('.mtab.on'));
    if(cur<0) cur=0;
    var mstill=matchMedia('(prefers-reduced-motion:reduce)').matches;
    var bar=gw.parentNode;

    function noise(n){ return n/2 - Math.random()*n; }
    /* One angle per particle, walked outward-to-inward along it — that is what
       makes the swarm read as converging on a point rather than swirling around
       one. y is squashed for the clipping reason given in the CSS. */
    function xy(dist,i,total){
      var a=((360+noise(8))/total*i)*Math.PI/180;
      return [dist*Math.cos(a), dist*Math.sin(a)*0.34];
    }

    /* The indicator lives OUTSIDE the scroller (the blend needs it to), so its
       x has to be tracked by hand. That is the whole price of keeping
       mix-blend-mode working, and it is cheaper than the alternative, which is
       no effect at all.
       ⚠️ Measured from RECTS, not from offsetLeft minus scrollLeft. The
       arithmetic version was correct at the instant it ran and wrong 17px later:
       scroll-snap re-settles the strip after reveal() sets scrollLeft, so the
       cached scrollLeft was stale before the first paint. A rect difference is
       whatever is true right now and cannot go stale. */
    function follow(){
      var t=mtabs[cur]; if(!t) return;
      gw.style.transform='translateX('
        +(t.getBoundingClientRect().left-bar.getBoundingClientRect().left)+'px)';
    }

    function place(i,animate){
      var t=mtabs[i]; if(!t) return;
      cur=i; follow();
      gw.style.width=t.offsetWidth+'px';
      gw.style.top=t.offsetTop+'px';
      gw.style.height=t.offsetHeight+'px';
      gw.style.setProperty('--row',t.style.getPropertyValue('--row'));
      if(!animate||mstill){ goo.classList.add('on'); return; }
      /* Clear, reflow, spray, THEN arm the pill on the next frame. Painting the
         pill first and re-animating it a moment later is what made the old
         version look glitchy: you saw the pill, saw it vanish, saw it grow. */
      goo.classList.remove('on');
      [].slice.call(goo.querySelectorAll('.mpt')).forEach(function(n){ n.remove(); });
      /* The forced reflow is what restarts the animation, and it is enough on
         its own. Arming the pill inside requestAnimationFrame instead looked
         equivalent and was not: rAF does not run in a backgrounded tab, so a
         page loaded in one came forward with no indicator at all. Nothing here
         needs to wait for a frame. */
      void goo.offsetWidth;
      spray();
      goo.classList.add('on');
    }

    function spray(){
      var N=15;
      for(var i=0;i<N;i++){
        (function(i){
          var t=Math.round(1200+noise(600));
          var a=xy(90,N-i,N), b=xy(10+noise(7),N-i,N);
          var rot=noise(10); rot = rot>0 ? (rot+5)*10 : (rot-5)*10;
          var el=document.createElement('i'); el.className='mpt';
          var dot=document.createElement('b'); dot.className='mpd';
          /* White, always. The wrapper's filter is what puts the accent back —
             a coloured particle would be crushed to a primary by contrast(20)
             long before anyone saw the colour. */
          el.style.cssText='--sx:'+a[0].toFixed(1)+'px;--sy:'+a[1].toFixed(1)+'px;'
            +'--ex:'+b[0].toFixed(1)+'px;--ey:'+b[1].toFixed(1)+'px;'
            +'--rot:'+rot.toFixed(0)+'deg;--sc:'+(1+noise(0.2)).toFixed(2)+';'
            +'--t:'+t+'ms';
          el.appendChild(dot); goo.appendChild(el);
          setTimeout(function(){ el.remove(); },t);
        })(i);
      }
    }

    /* Keep where you are on screen without yanking the page around it. */
    function reveal(){
      var t=mtabs[cur]; if(!t) return;
      strip.scrollLeft = Math.max(0, t.offsetLeft + t.offsetWidth/2 - strip.clientWidth/2);
    }
    function live(){ return getComputedStyle(strip).display!=='none'; }

    /* Listener FIRST: reveal() scrolls the strip, and a listener attached after
       that has already missed the event it exists for. The two timers catch the
       snap settling afterwards — deliberately timers and not rAF, because rAF
       does not run in a backgrounded tab and this has to be right when the tab
       is first looked at, not when it is first painted. */
    strip.addEventListener('scroll',follow,{passive:true});
    if(live()){
      reveal(); place(cur,true);
      setTimeout(follow,0); setTimeout(follow,160);
    }
    addEventListener('resize',function(){ if(live()){ reveal(); place(cur,false); } });
    /* A tap moves the indicator immediately even though the page is about to be
       replaced: on a slow connection that is the only feedback the tap landed. */
    mtabs.forEach(function(a,i){
      a.addEventListener('click',function(){ cur=i; place(i,true); });
    });
  }
})();`;

const SWITCHER_CSS = `
/* ── segmented page switcher ──────────────────────────────────────────
   Was three bordered boxes, which read as inert. Now one segmented control
   with an indicator that slides. Because these are separate documents and not
   an SPA, the slide happens on LOAD: the indicator animates in from the
   previous tab's position, so arriving on a page shows you the move you just
   made. --i is the active index, --n the tab count, both known at build time,
   so no measuring in JS and nothing to go wrong on first paint. */
/* A pill group, matching the other action controls. Three things were wrong
   before: the inactive labels sat on --ink3 (the faintest ink token) so they
   genuinely were close to invisible; the active marker was a 15%-alpha tint that
   barely registered; and each tab carried an 01/02 number chip that duplicated
   the landing page's numbering inside an already-crowded bar.
   Now: inactive labels on --ink2, the active tab is a raised pill with an accent
   border and accent text, and the numbers are gone. */
/* --c1 is the page you are ON, --c2 the page you are pointing AT, --m how far
   between them, --cm the interpolated colour JS computes for the edge and glow.
   The knob does not jump between tabs: it eases toward the pointer and stretches
   slightly in the direction it is travelling, so it reads as one soft object
   being pulled rather than a marker being repositioned. */
/* ── segmented page switcher (desktop only) ───────────────────────────
   Two pills: the four instruments that bind you, and the two invitations.

   It has to READ as a control. "I literally thought they were just normal
   text" was the complaint, and the answer is structural rather than
   decorative: the track is a sunken field with a visible inset shadow, the
   tabs are divided by hairlines while the control is at rest, the cursor is
   a pointer (it used to be "grab", promising a drag that no longer exists),
   and the tab you are on always carries a filled indicator.

   The hairlines fade out the moment you point at the control, so the morph
   travels across clean ground instead of over a set of fixed dividers. The
   control looks like segments when idle and like one fluid object in use.

   --c1 is the page you are ON, --c2 the page you are pointing AT, --m how
   far between them, --cm the interpolated colour JS computes for the edge
   and the glow. Width and position come from JS in pixels; there is no --n
   and no --i any more, because the indicator measures the real tabs. */
.seg{position:relative;display:flex;align-items:center;gap:var(--gap);--gap:.95rem;
  border-radius:999px;border:1px solid var(--rule2);padding:3px;
  /* The track must be DARKER than the blob, or the indicator reads as a recess
     instead of a raised pill and all but disappears. It used to be a 9% --ink
     wash, which is LIGHTER than --paper in the dark theme — the old build got
     away with it only because the pill carried an accent border, and a goo
     filter cannot keep a 1px border (the blur dilutes it and the alpha crush
     hardens whatever is left into a smear). A black wash darkens whatever is
     behind it in either theme, so one value serves both. */
  background:color-mix(in srgb,#000 24%,transparent);
  box-shadow:inset 0 1px 2px rgba(0,0,0,.32);
  isolation:isolate;--c1:var(--accent);--m:0}
/* The indicator is a GOO LAYER holding two blobs, not one pill.

   .ib-a is the shape you are LEAVING: it stays where it was and shrinks in
   place. .ib-b is the traveller: it moves to the tab you are pointing at and
   grows into it. While both exist the metaball filter fuses them, so the
   indicator visibly tears away from its old position, necks, and reforms on the
   new one — instead of a rigid pill sliding along a rail.

   ⚠️ EACH PIECE CARRIES ONE SOLID ACCENT, and the colour is per PIECE rather
   than one ramp across the control. A single track-wide gradient was why the
   colour appeared to lag: a blob sitting on the destination still carried some
   of the origin's hue until the move ended. Now the piece being built is its
   own colour from the first frame it exists, the residue keeps the old one, and
   only the neck between them is a transition.
   The route NOT taken was a --paper (untinted) pill: the active tab's label
   sits directly on this fill, and on --paper the tightest pair is
   violet-on-dark at 4.60, dropping to 4.28 at a 6% tint and 3.76 at 16% — so
   any tint at all failed AA and the colour had to live somewhere else. A SOLID
   accent with the label inverted to near-black passes everywhere instead:
   worst pair 5.07 across all six accents and every mid-gradient blend. The
   label is .66rem, so the large-text 3.0 threshold does not apply.
   Re-measure if you touch either the fill or --accent-t.

   (The goo is an SVG filter rather than the CSS blur/contrast recipe the
   reference implementation uses. CSS contrast() crushes the COLOUR channels, so
   it forces monochrome blobs on a black bed plus mix-blend-mode and a duplicated
   text layer to get a readable label. The feColorMatrix here multiplies ALPHA
   only and leaves RGB untouched, so a --paper blob stays --paper and both themes
   work with no inversion and no second copy of the text.) */
/* inset:0 is the PADDING box, so the pill clears the track by exactly the
   track's own 3px padding on all four sides. It used to be inset a further 2px
   top and bottom, giving 5px of vertical clearance against 3px horizontal — the
   pill was a slightly different shape from the groove it sits in. */
/* ⚠️ The goo runs ONLY during a move. A Gaussian blur erodes a curve in
   proportion to its curvature, so thresholding a stadium afterwards flattens its
   semicircular caps far more than the long straight edges — the resting pill came
   out a rounded RECTANGLE sitting inside a true stadium track, and read as the
   wrong shape. At rest there is nothing to fuse anyway: a single blob needs no
   metaball filter. So it is attached for the duration of the morph and removed
   when that settles, which also means the idle bar pays no filter cost. */
.seg-ink{position:absolute;z-index:0;inset:0;pointer-events:none}
.seg.morph .seg-ink{filter:url(#dbgoo)}
/* ⚠️ The 3px vertical inset MATCHES the track's 3px padding, and that is the
   whole point. .seg-ink spans the padding box so its x-axis lines up with the
   tabs' offsetLeft — which already includes that padding — but nothing insets
   the pill vertically, so a full-height pill cleared the track by 3px at the
   sides and 0px top and bottom. Concentric or it reads as the wrong shape. */
.ib{position:absolute;top:3px;bottom:3px;left:0;width:0;border-radius:999px;
  background:var(--accent);will-change:transform,width}
/* The neck. Two blobs only fuse where their blurs overlap — about 14px at
   stdDeviation 7 — but adjacent tabs are ~79px apart, so tail and head alone
   would read as two separate pills rather than one stretching mass. This spans
   the gap between them, and its HEIGHT is what carries the effect: thick at the
   moment of the break, thinning as the tail dissolves, until it drops under the
   blur threshold and the alpha crush snaps it. That snap is the metaball. */
.ib-c{top:50%;bottom:auto;height:0}
/* The droplets. They live INSIDE the filtered layer, which is the whole point:
   on their own they would be loose dots, but blurred and alpha-crushed together
   with the pill they read as material being thrown off it and gathered back. */
/* ⚠️ WIDTH AND HEIGHT ARE INDEPENDENT, and --br is four asymmetric corner radii
   rather than a circle. A droplet used to be a disc of one size because the
   crush's floor was derived for a circle; it is not, so these are blobs of
   varying length, thickness and silhouette. The margin has to centre on BOTH
   axes separately now — using --w for the vertical offset would hang every
   long droplet below its own path. */
.pt{position:absolute;top:50%;left:0;width:var(--w);height:var(--ph,var(--w));
  margin:calc(var(--ph,var(--w)) / -2) 0 0 calc(var(--w) / -2);
  border-radius:var(--br,50%);background:var(--pc);opacity:0;pointer-events:none;
  animation:ptFly var(--t) var(--d) var(--ez,cubic-bezier(.32,.72,.36,1)) both}
/* ⚠️ --y2 is READ here, and it did not used to be: the last two stops were
   pinned to y=0, so every droplet landed on the pill's centre line and the
   arrival looked like a row of dots sliding into a slot. The reference's
   particles converge on a small RADIUS around the destination, which is what
   makes the new shape look built out of them rather than filled in. Keep the
   endpoint scale small — a droplet that is still large when it lands does not
   get absorbed by the alpha crush, it reads as a stray dot beside the pill. */
/* ⚠️ The rotation is not decoration and it is not visible on its own — a circle
   spun about its centre looks identical. It matters because the droplet is
   translated FIRST and rotated second, so the rotation swings the whole
   trajectory: the path bows instead of running straight, and fourteen droplets
   each bowing by a different amount stop arriving in formation. Straight-line
   droplets were the largest remaining tell that this was fourteen elements on
   fourteen paths rather than one mass coming apart. Borrowed from the
   reference's own particle keyframes, which rotate to 1.2x the declared angle
   by the end for exactly this reason. */
@keyframes ptFly{
  0%{opacity:0;transform:rotate(0deg) translate(var(--x0),var(--y0)) scale(.15)}
  26%{opacity:1;transform:rotate(calc(var(--rot) * .5)) translate(var(--x1),var(--y1)) scale(1)}
  72%{opacity:1;background:var(--pc);transform:rotate(calc(var(--rot) * .9)) translate(var(--x2),var(--y2)) scale(.9)}
  100%{opacity:0;background:var(--pc2);transform:rotate(0deg) translate(var(--x3),0px) scale(.8)}
}
/* ⚠️ THE LAST STOP MERGES — INSIDE the pill, and it must not PARK there.
   Two wrong versions preceded this one and each looked wrong in a different way,
   so the constraints are worth stating together:

   (a) It first ended at scale(.1)/opacity 0 wherever the droplet happened to be.
       The goo filter only paints a droplet above ~10.6px of diameter, so a tenth
       of scale dropped it below the threshold while it was still OUTSIDE the
       pill — droplets evaporated in mid-air instead of being taken in.
   (b) The fix for (a) held the droplet at opacity 1 and near-full scale on the
       destination until the sweep timer removed it. That PARKED it: for several
       frames the finished pill carried visible darker blotches — the droplets
       sitting on top of it in their spawn-time colour — and then popped clean
       when the timer fired. Read as "the particles get stuck and then merge".

   So the ending has to do three things at once: arrive on the destination's
   centre line (so the fuse happens inside the pill's mass), arrive in the
   DESTINATION's colour rather than the colour it was born with (so it is
   indistinguishable from the pill before it goes), and fade to nothing there (so
   there is no parked state waiting on a timer). Rotation returns to 0 at the end
   so translate(--x3,0) actually lands on the centre rather than being swung off
   it. The fade is invisible because it happens on top of an opaque pill of the
   same colour — which is precisely the condition (a) failed to meet. */
@media (prefers-reduced-motion:reduce){ .pt{display:none} }
.goodef{position:absolute;width:0;height:0;overflow:hidden}

/* ⚠️ ONE WEIGHT FOR EVERY TAB, always. The active tab used to jump to 700 the
   instant the pill's class landed, which read as the text changing font
   mid-animation — and font-weight cannot tween between discrete values, so
   there was no way to soften it. The pill IS the emphasis; it does not need
   the label to shout as well. It also means a label never changes width, so
   the geometry the indicator measures stays put. */
.tab{position:relative;z-index:1;display:block;white-space:nowrap;cursor:pointer;
  font-family:var(--mono);font-size:.66rem;letter-spacing:.1em;
  /* 600, and the same 600 in every state. A label that changes weight when the
     pill arrives is a snap the eye reads as a glitch — font-weight cannot tween —
     and it would also change the tab's width, which is the geometry the indicator
     measures. Heavier than the 400 it was because these are the site's primary
     navigation and they were the lightest type in the bar. */
  font-weight:700;
  text-transform:uppercase;text-decoration:none;
  padding:.42rem 1.02rem;border-radius:999px;
  /* --cov is written every frame by paint(): 0 = no pill over me, 1 = fully
     covered. --rest is what this tab looks like with no pill on it. */
  --cov:0; --rest:var(--ink2);
  color:color-mix(in srgb,#120E1C calc(var(--cov) * 100%),var(--rest));
  transition:color .2s ease}
/* ⚠️ NO TRANSITION WHILE MOVING. --cov already changes every frame, so an eased
   transition on top of it is not smoothing — it is pure lag, and it would land
   the label's colour a fifth of a second after the pill settles. The transition
   exists only for the jump when a group you are not in shows or hides its
   indicator, which is not a per-frame change. */
/* ⚠️ A SHORT TRANSITION DURING THE MOVE, NOT NONE. This was transition:none, on
   the reasoning that --cov already changes every frame so an eased transition on
   top of it is pure lag. That is true of a quantity which changes SLOWLY — and
   this one does not: measured on a Terms -> Notice hover, coverage crosses from
   nothing to complete in about 84ms of a 760ms move, so the label flipped in two
   frames while the pill spent the other 90% of the move assembling around it. A
   step that fast inside a slow animation reads as a separate event, which is
   exactly what did not feel seamless.
   130ms is chosen against that 84ms traverse: long enough to spread the flip over
   roughly eight frames, short enough that the colour still lands well before the
   pill settles and never trails it. Do not raise it much — past about 200ms the
   label visibly finishes after the pill does, which is the lag the original note
   was right to warn about. */
.seg.morph .tab{transition:color .13s ease-out}
/* ⚠️ THE CURRENT TAB IS NOT PAINTED IN ITS OWN ACCENT, and this is the whole bug
   behind "the white nav text is not legible". --rest is what a tab looks like with
   no pill on it, and setting it to the accent meant the label and the pill beneath
   it were THE SAME COLOUR. Measured on contributors.html: settled off-pill the
   label computed rgb(248,255,74) against a pill of rgb(248,255,74). Worse, every
   partial-coverage frame mixed from near-black TOWARD the accent, so mid-move the
   label passed through a washed-out light tint sitting on a bright pill — which is
   exactly the frame in Harkirat's screenshot, and no amount of tuning the crossover
   fixes a mix whose far end is the pill's own colour.
   ⚠️ RESTORED to the accent 2026-08-01 22:30 EDT after being briefly changed to
   --ink, which cost the current tab its identity: with the pill parked elsewhere,
   "Terms" went bright white instead of amber and no longer read as the page you
   are on. Two other fixes are what make the accent safe again, and BOTH are
   load-bearing — if either is undone this becomes illegible immediately:
     1. The .tab:hover colour rule is gone. That was pinning the label
        near-white while the pointer was on it, which is what the accent was
        wrongly blamed for.
     2. The crossover band is 0.30/0.58, so --rest is only reached when the pill
        covers 30% or less of the tab. Between 30% and 58% the mix runs toward the
        accent for about six frames; above 58% the label is fully near-black. The
        old 0.22/0.72 band spent half the move in that range, which is where
        accent-on-accent actually became unreadable. */
.tab.on{--rest:var(--accent-t)}
/* The label sitting ON the pill. A solid accent fill is far too light to carry
   accent-coloured text, so the tab the indicator currently covers flips to
   near-black — the same inversion the reference makes when its white pill
   arrives. Measured against all six accents AND every mid-gradient blend of
   them: worst pair is violet at 5.07, so this clears AA in both themes without
   needing a second copy of the text laid over the pill. .lit follows the
   INDICATOR, not the page, which is why hovering another tab moves it. */
/* ⚠️ .tab.on.lit CARRIES THE WEIGHT ON PURPOSE. The label under the pill has to
   be dark, and the current page tab is BOTH .on and .lit at rest — two rules of
   equal specificity, so the winner came down to cascade order and .on was taking
   it. That painted the label in the accent ON TOP OF a pill of the same accent:
   invisible at worst, unreadable at best, and it got obvious the moment an
   accent went bright (citron on citron). Measured on contributors.html: computed
   colour was rgb(248,255,74) against a pill of rgb(248,255,74).
   The three-class selector cannot lose that race.
   ⚠️ .tab.on ALONE keeps the accent colour, and must: mid-morph the pill travels
   away from the current tab, and a dark label with nothing behind it would
   vanish into the bar. Dark is for -a pill is under me-, not for -I am current-. */
/* ⚠️ .lit NO LONGER STYLES ANYTHING BY DEFAULT — it is kept as the fallback for
   engines without color-mix(), where --cov cannot be interpolated and the label
   would otherwise sit light-on-accent. There the old discrete behaviour is
   strictly better than nothing. lit() itself stays load-bearing: it is what
   clears the marker when a group you are not in goes cold. */
@supports not (color:color-mix(in srgb,#000 50%,#fff)){
  .tab.on.lit,.tab.lit{color:#120E1C}
}
.tab:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
/* Segment dividers — the affordance at rest. Drawn on the tab rather than the
   track so they land in the gaps whatever each label measures. */
/* No dividers. Spacing separates the tabs instead, which also gives the
   indicator somewhere to travel — with the tabs touching it had to stretch
   directly across a neighbouring label. */
/* ⚠️ THERE IS NO :hover COLOUR ON A TAB, AND THERE MUST NOT BE. There used to be
   a .tab:hover colour rule — a brightening affordance from before the tabs
   had an indicator at all. It is a (0,2,0) selector against .tab's own (0,1,0), so
   it BEAT the coverage colour outright: for the entire time the pointer sat on a
   tab, the label was pinned near-white — on top of the pill that had just arrived
   underneath it. Releasing the pointer released the rule, so the label went dark at
   the exact moment the pill began to LEAVE. That inversion is what Harkirat kept
   reporting, and it is why a scripted mouseenter could never reproduce it: a
   dispatched event does not create a :hover state, so every measurement of the
   hovered tab read the correct colour while the screen showed the wrong one.
   The pill IS the hover feedback. A second, contradictory one is not needed. */
/* A group you are not currently inside shows no indicator until you point at
   it, so exactly one indicator on screen is ever "yours". */
.seg[data-at="-1"] .seg-ink{opacity:0;transition:opacity .3s}
.seg[data-at="-1"].hot .seg-ink{opacity:1}
.seg-gap{width:.45rem;flex:0 0 auto}

/* THE BAR COMES IN TWO SIZES NOW, and each has its own MEASURED staging. Six tabs
   on every page; nine on the three inside /changelog/, which keep their own group
   so a reader already in that section is not stranded there. data-fit on .navwrap
   selects the regime — see navSwitcher(), which refuses to build an unmeasured one.

   Measured 2026-08-01 21:40 EDT, in a browser, on the widest page of each set. The method is
   the only one that works: neutralise the media queries, read the nav's real width
   at each tab size, and add the bar's own chrome (32+32 padding + a 24 gap + the
   108px wordmark). Reading the CSS cannot find these numbers and neither can
   arithmetic on the old ones — the tabs went to 600 weight and 1.02rem of padding
   in this same pass, which moved every one of them.

       tabs   full-size needs   tightened needs   chips-only needs
        6          1049              936                 -
        9          1452             1277                919

   ⚠️ A TIER BOUNDARY IS ONLY CORRECT IF BOTH SIDES OF IT FIT. That is what caught
   the previous staging's first attempt (1240/1100), which was wrong at both ends
   and shipped a nav running off the edge at two common laptop widths. Every
   boundary below is checked one pixel above as well as one below:
     · six tabs, 1060: full needs 1049 above it, tightened needs 936 below. Six
       tightened tabs still fit at 981, so this set needs NO chip tier at all —
       tightening carries it the whole way to the mobile handoff.
     · nine tabs, 1465: full needs 1452 above, tightened 1277 below.
     · nine tabs, 1300: tightened needs 1277 above, chips-only 919 below.

   The margins are deliberate rather than tight: the chronicle pages' webfonts load
   with font-display:swap, so the bar is first laid out with FALLBACK metrics, and a
   boundary with no spare room overflows during the swap on every cold load.

   ⚠️ Why a chip rather than hiding the group. The two-group version hid the whole
   seg, which cost one group in a narrow band and was recoverable from the footer.
   At nine tabs the same rule hides TWO — two thirds of the bar's destinations at
   once — so a hidden group leaves a labelled chip that still links to its first
   page. It is real markup, not a ::before, because a pseudo-element cannot be a
   link and the link surviving is the entire point of the tier. */
.navwrap{display:flex;align-items:center}

/* No tabindex is needed to keep the chip out of the tab order while it is hidden —
   a display:none element is not focusable — and adding tabindex="-1" would have been
   actively wrong, since it would still apply at the one width where the chip IS the
   only keyboard route to that group. */
.segchip{display:none;font-family:var(--mono);font-size:.6rem;letter-spacing:.1em;
  text-transform:uppercase;color:var(--ink3);text-decoration:none;
  padding:.42rem .55rem;border-radius:7px;white-space:nowrap}
.segchip:hover{color:var(--ink);background:color-mix(in srgb,var(--ink) 7%,transparent)}
.segchip:focus-visible{outline:2px solid var(--accent);outline-offset:2px}

/* ── six tabs: tighten below 1060, and that is the whole staging ── */
@media (max-width:1059px){
  .navwrap[data-fit="6"] .tab{padding:.42rem .62rem;font-size:.62rem;letter-spacing:.07em}
  .navwrap[data-fit="6"] .seg{--gap:.6rem}
}

/* ── nine tabs: tighten below 1465, chips below 1300 ── */
@media (max-width:1464px){
  .navwrap[data-fit="9"] .tab{padding:.42rem .62rem;font-size:.62rem;letter-spacing:.07em}
  .navwrap[data-fit="9"] .seg{--gap:.6rem}
}
@media (min-width:981px) and (max-width:1299px){
  /* A group you are not in shows its chip instead of its tabs. The indicator goes
     with them — .seg-ink measures real tab boxes, and there are none to measure. */
  .navwrap[data-fit="9"] .seg[data-at="-1"] .tab{display:none}
  .navwrap[data-fit="9"] .seg[data-at="-1"] .seg-ink{display:none}
  .navwrap[data-fit="9"] .seg[data-at="-1"] .segchip{display:inline-block}
  .navwrap[data-fit="9"] .seg[data-at="-1"]{padding:0}
}

/* Desktop shows no mobile menu. */
.mnav{display:none}

/* ── mobile navigation: a swipeable strip ─────────────────────────────
   Every page in one scrollable row, nothing to open. The three previous
   attempts (two-tab rail, bottom sheet, disclosure) all put the answer to
   "where am I and what else is there" behind a tap; this states it.

   No hover rules live in here AT ALL. On touch a :hover latches until you tap
   something else, which is what made every earlier version feel stuck. Touch
   feedback is :active, which releases itself.

   Tabs are 44px tall inside a 52px band, clearing WCAG 2.5.5. */
@media (max-width:980px){
  .bar .navwrap{display:none}
  .mk-ctx{display:flex;align-items:center;gap:.34rem;min-width:0;
    font-family:var(--mono);font-size:.53rem;letter-spacing:.15em;
    text-transform:uppercase;color:var(--ink3);
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .mk-ctx i{flex:0 0 auto;width:5px;height:5px;border-radius:50%;
    background:var(--accent)}
  .mnav{display:block;position:sticky;top:54px;z-index:40}

  /* ⚠️ THE BAR AND THE SCROLLER ARE TWO ELEMENTS, AND THEY HAVE TO STAY APART.
     The indicator below is a metaball layer: it paints an opaque black bed and
     erases the bed with mix-blend-mode. A blend needs two things a scroller
     cannot give it — an OPAQUE backdrop to blend against, and no scroll
     container between it and that backdrop. Put the layer inside the strip and
     the blend is dropped and you get a black rectangle instead; that was
     measured in the prototype before it was measured here.
     The background is OPAQUE on purpose. It used to be color-mix(paper 96%)
     with a backdrop-filter, and the blend formula weights the source by
     (1 - backdrop alpha), so a 4%-transparent backdrop is a 4% black wash
     across the whole bar. Deterministic beats pretty here.
     overflow:hidden clips the swarm to the bar, which is also deliberate — see
     the y-squash note on the particles. */
  .mbar{position:relative;isolation:isolate;overflow:hidden;
    background:var(--paper);
    border-top:1px solid var(--rule);border-bottom:1px solid var(--rule)}
  .mstrip{position:relative;z-index:1;display:flex;align-items:stretch;gap:.3rem;
    overflow-x:auto;overscroll-behavior-x:contain;
    scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;
    padding:.5rem .75rem;
    scrollbar-width:none}
  .mstrip::-webkit-scrollbar{display:none}

  .mtab{position:relative;z-index:1;flex:0 0 auto;scroll-snap-align:center;
    display:flex;align-items:center;min-height:44px;padding:0 .8rem;
    border-radius:999px;text-decoration:none;
    font-family:var(--mono);font-size:.66rem;letter-spacing:.1em;
    text-transform:uppercase;color:var(--ink2);
    transition:color .28s ease}
  /* Same inversion the desktop pill uses, and measured the same way: a solid
     accent is far too light to carry accent-coloured text, and near-black on
     the six accents bottoms out at 5.07 which clears AA. */
  .mtab.on{color:#120E1C;font-weight:700}
  /* The crisp resting pill. The goo layer draws a pill of its own — that is what
     the particles fuse into — but thresholding a blurred stadium erodes its caps
     a little, and this is the shape you are left looking at for the rest of the
     page. Same box, same colour, painted unfiltered on top, so the fluid reads
     as assembling into it rather than as a second object. */
  /* inset 4px, not 0: the tap target stays the full 44px the guideline asks
     for, but the pill you actually see is 36px. Filling the target edge to edge
     made the indicator read as a block rather than a marker. */
  .mtab::after{content:"";position:absolute;inset:4px 0;z-index:-1;border-radius:999px;
    background:var(--row);scale:0;opacity:0}
  .mtab.on::after{animation:mgPill 2s var(--spring) .2s both}
  .mtab:active{background:color-mix(in srgb,var(--ink) 10%,transparent)}
  .ms-sep{flex:0 0 1px;align-self:center;height:20px;background:var(--rule2);
    margin:0 .3rem}

  /* ── the indicator: a metaball layer ──────────────────────────────────
     Two elements and two SHORT filter chains, and they cannot be merged. .mgo
     blurs a field of white discs and crushes it to a hard two-tone image;
     .mgw recolours the finished result. Written as one seven-function chain on
     one element, iOS applied the blur and the contrast and silently DROPPED the
     four colour functions after them — the fluid came out white while the tab's
     own pill, which is never filtered, stayed accent-coloured. That is what the
     split buys.
     There is no SVG filter here, also deliberately. An SVG filter's region is a
     percentage of the element's box; the swarm spawns at radius 90 around a box
     about 90x44, and everything outside the region paints UNFILTERED — which is
     exactly what made the particles read as hard circles instead of liquid.
     Chrome expands the region to cover overflow, Safari honours what you wrote.
     A CSS chain has no region at all. */
  .mgw{position:absolute;left:0;top:0;width:0;height:0;z-index:0;
    pointer-events:none;mix-blend-mode:lighten}
  .mgo{position:absolute;inset:0;filter:blur(7px) contrast(20) blur(0)}
  /* The bed. contrast() thresholds colour, not alpha, so the discs need
     something opaque behind them or there is nothing to threshold. Black,
     and large: the plate below has to sit entirely within the bed's OPAQUE
     core, and blur(7px) softens the bed's own edge over about 21px. */
  .mgo::before{content:"";position:absolute;inset:-110px;z-index:-2;background:#000}
  .mgo::after{content:"";position:absolute;inset:4px 0;z-index:-1;background:#fff;
    border-radius:100vw;scale:0;opacity:0}
  .mgo.on::after{animation:mgPill 2s var(--spring) .2s both}
  @keyframes mgPill{to{scale:1;opacity:1}}

  /* ⚠️ THE COLOUR IS A BLEND, NOT A FILTER — and that is the second attempt.
     The first recoloured the crushed white image with a fitted
     sepia/saturate/hue-rotate/brightness chain. Composed on paper it lands every
     accent exactly; rendered, it does not, and the error is large enough to see
     (a difference-blend test against the true accent glowed on four of the six).
     Filter chains clamp somewhere the arithmetic does not model, so the whole
     approach was fitting a curve to a function nobody has the real form of.
     A blend needs no model. multiply(white, accent) IS accent and
     multiply(black, accent) IS black, exactly, for every accent that will ever
     exist — so a plain accent plate multiplied over the crushed image colours
     the blobs and leaves the bed alone. .mgw carries mix-blend-mode, which makes
     it a stacking context, which makes it an isolation group: the plate blends
     with the goo INSIDE it and the finished group blends with the bar outside.
     The one trap, and the reason an earlier attempt at this was abandoned: the
     plate must stay inside the bed's opaque core. Blending against a
     partly-transparent backdrop leaves the plate's own colour showing, which
     reads as an accent-coloured square around the whole effect. -80 inside
     -110 is well clear of the blurred edge. */
  .mtint{position:absolute;inset:-80px;z-index:1;background:var(--row);
    mix-blend-mode:multiply;pointer-events:none}

  /* ⚠️ LIGHT MODE IS NOT THE SAME TRICK, and it cannot be.
     lighten erases the black bed only because the backdrop is darker than the
     blobs. On near-white paper it erases the BLOBS instead and the bar stays
     empty. So light mode inverts the crushed image — the bed comes out white,
     which is the identity for multiply — and the plate switches to screen,
     whose identities are the mirror image: screen(white, accent) is white and
     screen(black, accent) is accent. Same two exact rules, read the other way
     up. */
  :root[data-theme=light] .mgw{mix-blend-mode:multiply}
  :root[data-theme=light] .mgo{filter:blur(7px) contrast(20) blur(0) invert(1)}
  :root[data-theme=light] .mtint{mix-blend-mode:screen}
  @media (prefers-color-scheme:light){
    :root:not([data-theme=dark]) .mgw{mix-blend-mode:multiply}
    :root:not([data-theme=dark]) .mgo{filter:blur(7px) contrast(20) blur(0) invert(1)}
    :root:not([data-theme=dark]) .mtint{mix-blend-mode:screen}
  }

  /* Particle geometry is the reference implementation's, unchanged: fifteen
     20px discs spawning on a radius of 90 and converging INWARD to 10, each
     running 1200±300ms and started 350ms in so they are already mid-flight on
     the first frame. Two nested elements because the travel and the swelling
     need different timing functions and one element carries only one.
     The single deviation is the y squash. .mbar has to clip (an unclipped bed
     paints black wherever there is no opaque backdrop under it), and a circular
     radius-90 swarm in a 60px bar would spend most of its flight outside the
     clip. Squashing y keeps the whole swarm on screen; x is untouched, and x is
     the axis the pill actually grows along. */
  .mpt{position:absolute;top:calc(50% - 8px);left:calc(50% - 8px);
    display:block;width:20px;height:20px;border-radius:100%;opacity:0;
    transform-origin:center;animation:mptFly var(--t) ease 1 -350ms}
  .mpd{display:block;width:20px;height:20px;border-radius:100%;
    background:#fff;opacity:1;transform-origin:center;
    animation:mptPop var(--t) ease 1 -350ms}
  @keyframes mptFly{
    0%{transform:rotate(0deg) translate(var(--sx),var(--sy));opacity:1;
      animation-timing-function:cubic-bezier(.55,0,1,.45)}
    70%{transform:rotate(calc(var(--rot) * .5)) translate(calc(var(--ex) * 1.2),calc(var(--ey) * 1.2));
      opacity:1;animation-timing-function:ease}
    85%{transform:rotate(calc(var(--rot) * .66)) translate(var(--ex),var(--ey));opacity:1}
    100%{transform:rotate(calc(var(--rot) * 1.2)) translate(calc(var(--ex) * .5),calc(var(--ey) * .5));
      opacity:1}
  }
  @keyframes mptPop{
    0%{scale:0;opacity:0;animation-timing-function:cubic-bezier(.55,0,1,.45)}
    25%{scale:calc(var(--sc) * .25)}
    38%{opacity:1}
    65%{scale:var(--sc);opacity:1;animation-timing-function:ease}
    85%{scale:var(--sc);opacity:1}
    100%{scale:0;opacity:0}
  }
  @media (prefers-reduced-motion:reduce){
    .mgo.on::after,.mtab.on::after{animation:none;scale:1;opacity:1}
    .mpt{display:none}
  }

  /* The section index is no longer in a menu with the pages — it is not the
     same question. It sits with the document it indexes, closed by default. */
  .msecd{border-bottom:1px solid var(--rule);
    background:color-mix(in srgb,var(--paper) 96%,transparent)}
  .msecd>summary{display:flex;align-items:center;gap:.5rem;min-height:44px;
    padding:0 .9rem;cursor:pointer;list-style:none;
    font-family:var(--mono);font-size:.6rem;letter-spacing:.16em;
    text-transform:uppercase;color:var(--ink3)}
  .msecd>summary::-webkit-details-marker{display:none}
  .msecd>summary::after{content:"";flex:0 0 auto;width:7px;height:7px;
    margin-left:.2rem;border-right:1.5px solid var(--ink2);
    border-bottom:1.5px solid var(--ink2);transform:translateY(-2px) rotate(45deg);
    transition:transform .3s cubic-bezier(.22,.9,.24,1)}
  .msecd[open]>summary::after{transform:translateY(1px) rotate(225deg)}
  .msecd>summary:active{background:color-mix(in srgb,var(--ink) 9%,transparent)}
  .mt-at{margin-left:auto;font-size:.62rem;letter-spacing:.02em;text-transform:none;
    color:var(--ink2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
    max-width:52%}
  .mp-list{max-height:min(58vh,460px);overflow-y:auto;padding-bottom:.3rem}
  .msec .slot{display:flex;align-items:center;gap:.6rem;min-height:44px;
    padding:0 .9rem;border-left:2px solid transparent}
  .msec .slot.on{border-left-color:var(--accent);
    background:color-mix(in srgb,var(--accent) 10%,transparent)}
  .msec .slot:active{background:color-mix(in srgb,var(--ink) 9%,transparent)}
}
`;
/**
 * The metaball filter behind the navigation indicator.
 *
 * ⚠️ THE REGION MUST CONTAIN THE DROPLETS, NOT JUST THE PILL. An SVG filter's
 * region is a percentage of the filtered element's box, and anything outside it
 * is not filtered at all — it paints as a raw, unblurred, unfused circle. The
 * indicator layer is only ~32px tall, so the old y="-60%" height="220%" reached
 * ±19px, and the desktop spray already travels ±19px: passing by luck. The
 * mobile strip's swarm goes further. Chrome quietly expands the region to cover
 * overflow, Safari honours what is declared, so this fails on a phone ONLY —
 * which is exactly how it was found, with a CSS-filter version rendering
 * correctly beside it on the same device. A CSS filter chain has no region;
 * an SVG one does, and it has to be declared for the widest thing inside it.
 *
 * Blur, then crush the alpha channel back to hard edges with a colour matrix.
 * Two separate shapes that come within a blur radius of each other fuse into one
 * silhouette with a pinched neck — which is the entire reason the indicator can
 * BREAK APART and reform rather than slide as a rigid pill.
 *
 * color-interpolation-filters="sRGB" is not optional: the default is linearRGB
 * and the blobs come out visibly washed and pale against the same token colour
 * used everywhere else on the page.
 *
 * The filter region is enlarged well past the default -10%/+10%, because the
 * blur on a 26px-tall element is clipped by the default box and that shears the
 * top and bottom off the merged shape.
 */
// ⚠️ The collapsing style is INLINE, not in a stylesheet. .goodef lived in
// SWITCHER_CSS, which the landing page does not include — so on that page the svg
// kept its intrinsic 300x150 and took part in layout, shoving the whole document
// sideways. A fragment injected into three templates with three different CSS
// compositions cannot depend on any one of them having styled it.
/* Four alpha-crush filters, one per surface. The MATRIX is identical in all of
   them — it multiplies ALPHA and leaves RGB alone, which is the whole reason the
   liquid cursor can be recoloured per frame (a CSS blur/contrast crush drives
   every channel to 0 or 1 and maps amber and lime to the same yellow).
   What differs per filter is the blur radius and the REGION, and neither is
   cosmetic:
     · a filter region is a percentage of the FILTERED ELEMENT's box, and anything
       outside it is simply not painted, so a region sized for one element is
       wrong for another;
     · a filtered element allocates its region even at opacity 0 — #dbgoo-c at
       260% of a 44px layer is a ~114px disc, and that disc is what once showed as
       "a gradient circle stuck behind the button". That is why .tt-ink carries
       visibility:hidden between births rather than opacity alone.
   ⚠️ On iOS an SVG filter renders a metaball swarm as HARD CIRCLES where the CSS
   chain renders it as liquid (measured, same device, two panels on one page).
   Every surface below either accepts that trade knowingly (the reveal's mark,
   which is why the mobile mark stays the original sliding fill) or drops the
   filter on a coarse pointer (the back-to-top). The liquid cursor never runs on
   touch at all, so the question does not arise there. */
const GOO_SVG = `<svg class="goodef" aria-hidden="true" focusable="false"
 style="position:absolute;width:0;height:0;overflow:hidden"><filter id="dbgoo"
 x="-60%" y="-260%" width="220%" height="620%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceGraphic" stdDeviation="3.6" result="blur"/>
<feColorMatrix in="blur" type="matrix"
 values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -8"/>
</filter>
<!-- the reveal's mark. Its layer spans .foot, not the <details> — a CLOSED
     <details> renders none of its children but <summary>, so a layer parented to
     it does not exist while the control is shut, which is why the mark was once
     invisible at rest while its inline styles read perfect. The region is
     therefore a margin around a box that is already tall; re-check it if that
     host ever changes size class. -->
<!-- ⚠️ stdDeviation 3.2. Lower values were built and compared live on 2026-08-03
     13:46 EDT and this one was kept, so the sweep below is evidence FOR the
     current setting rather than a note about a pending change.
     Merging is a function of mass size / sigma, so lowering the blur to sharpen
     the mark trades directly against the buds fusing with the core — which is the
     one thing on this surface that needs the filter at all. Measured by counting
     connected components in the rasterised silhouette across 12 frames (four
     masses exist, so a LOWER count means more of them have fused):
       sigma  3.2 -> mean 2.00 bodies, max 2      SHIPPED
       sigma  2.9 -> mean 2.17, max 3
       sigma  2.7 -> mean 2.00, max 2             the one free reduction
       sigma  2.4 -> mean 2.08, max 3
       sigma  2.0 -> mean 2.42, max 3             visibly a core plus a loose dot
     ⚠️ Classify those pixels by HUE, not by distance from the background, if this
     is ever re-run. The crush is an ALPHA matrix, so the mark keeps its accent at
     every alpha while the neighbouring TEXT does not — the first version of that
     probe counted glyphs as blobs and reported three bodies at every sigma,
     including this one. R-B separates them outright: accent is +168, ink is ~0. -->
<filter id="dbgoo-r" x="-8%" y="-22%" width="116%" height="144%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceGraphic" stdDeviation="3.2" result="blur"/>
<feColorMatrix in="blur" type="matrix"
 values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -8"/>
</filter>
<!-- back-to-top: droplets start up to 96px out from a 44px layer, so the region
     has to be generous in both axes. -->
<filter id="dbgoo-c" x="-80%" y="-80%" width="260%" height="260%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceGraphic" stdDeviation="3.6" result="blur"/>
<feColorMatrix in="blur" type="matrix"
 values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -8"/>
</filter>
<!-- the liquid cursor. A smaller blur than the rest: its masses are 2.2-5.6px
     radius, and merging is a function of mass size / sigma, not of spacing. -->
<filter id="dbgoo-p" x="-18%" y="-18%" width="136%" height="136%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceGraphic" stdDeviation="2.9" result="blur"/>
<feColorMatrix in="blur" type="matrix"
 values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -8"/>
</filter></svg>`;

/**
 * Applies the stored theme before the document paints.
 *
 * THEME_JS runs at the end of <body> — measured at character 105,831 of a
 * 116,587-character page — so a reader who had chosen light mode watched the
 * entire page render dark and then flip, on every single navigation. The switch
 * itself has to stay at the end (it binds a button), but READING the preference
 * has to happen in <head>, and it is deliberately tiny and dependency-free so it
 * cannot become a render-blocking cost of its own.
 */
const THEME_BOOT = '<script>try{var t=localStorage.getItem(\'db-theme\');'
    + 'if(t)document.documentElement.setAttribute(\'data-theme\',t);}catch(e){}<\/script>';

/* ──────────────────────────────── template ─────────────────────────────── */

// `out` identifies the current page so the active nav tab is DERIVED rather than
// inferred from the title. The previous `short === 'Terms' ? ... : 'privacy'`
// test silently assumed there would only ever be two pages, and quietly marked
// anything else as Privacy.
/**
 * Wrap each top-level <h2> and everything beneath it in a <section>.
 *
 * ⚠️ THIS IS WHAT MAKES A STICKY HEADING POSSIBLE AT ALL, and it cannot be done in
 * CSS. What bounds a sticky element is its CONTAINING BLOCK — the same fact that
 * once let the section rail travel 126px into the footer. parseBlocks() emits the
 * headings as FLAT SIBLINGS of the prose, so every h2 shares one containing block:
 * they would all stick at the same offset and simply cover each other, swapping
 * instantly instead of the outgoing heading being pushed up by the incoming
 * section. Give each heading a section and the hand-off is free.
 *
 * ⚠️ THE SPLIT IS ON A LINE-INITIAL <h2, NOT ON EVERY <h2. Terms opens with a
 * callout blockquote that contains an h2 of its own, emitted inline on the same
 * line as the <blockquote> tag; splitting on every h2 would cut that element in
 * half and produce unbalanced markup. Measured on the built page: 22 of the 23 h2s
 * begin a line, and the one that does not is exactly that callout.
 *
 * Done here rather than in parseBlocks() because parseBlocks is shared — the warm
 * pages and all three chronicle voices consume it through CHROME, and each has its
 * own structural gate keyed to the shape it emits today. Only the legal shell wants
 * sections, so only the legal shell adds them.
 */
function sectionise(html) {
    const parts = html.split(/\n(?=<h2 )/);
    if (parts.length < 2) return html;
    // Anything before the first heading (the callout, the lead-in) stays a direct
    // child of .doc: it belongs to no section, and wrapping it would give the page
    // a sticky heading it does not have.
    const head = parts.shift();
    return [head, ...parts.map(p => `<section class="dsec">\n${p}\n</section>`)].join('\n');
}

function shell({ title, short, kicker, accent, glow, body, toc, meta, out = '', dir }) {
    // The nav helpers identify a page by directory AND filename now — two pages on
    // the site are called index.html, so a bare name no longer picks one out.
    const cur = { out, dir };
    const slots = toc.filter(t => !t.sub).map(t =>
        `<a href="#${t.id}" class="slot"><i>${t.num ? esc(t.num) : '—'}</i><span>${esc(t.text)}</span></a>`
    ).join('');

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — Dior's Builds</title>
<meta name="description" content="${esc(title)} for Dior's Builds, an unofficial Call of Duty: Mobile Discord bot.">
<meta name="color-scheme" content="dark light">
${THEME_BOOT}
<meta property="og:title" content="${esc(title)} — Dior's Builds">
<meta property="og:description" content="${esc(title)} for Dior's Builds, an unofficial Call of Duty: Mobile Discord bot.">
<meta property="og:type" content="website">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%2316131B'/%3E%3Crect x='6' y='7' width='20' height='3' fill='${encodeURIComponent(accent)}'/%3E%3Crect x='6' y='14' width='14' height='3' fill='%236E6782'/%3E%3Crect x='6' y='21' width='17' height='3' fill='%236E6782'/%3E%3C/svg%3E">
<style>
${TOKENS}
:root{--accent:${accent};--glow:${glow}}
${COMPONENT_CSS}

/* ── top bar ─────────────────────────────────────────────────────── */
.bar{position:fixed;inset:0 0 auto;height:54px;z-index:60;display:flex;align-items:center;
  gap:1.5rem;padding:0 clamp(1rem,3vw,2rem);background:color-mix(in srgb,var(--desk) 88%,transparent);
  backdrop-filter:blur(14px) saturate(1.3);border-bottom:1px solid var(--rule)}
.bar nav{margin-left:auto;display:flex;align-items:center;gap:.6rem}
#prog{position:fixed;top:53px;left:0;height:2px;width:0;z-index:61;background:var(--accent)}

${SWITCHER_CSS}

/* ── layout ──────────────────────────────────────────────────────── */
/* .page centres and bounds; .cols is the grid. The footer sits in .page and OUTSIDE
   .cols on purpose — see the markup comment: it is what stops the sticky rail from
   travelling into the footer, and keeping it in .page is what stops it stretching to
   the full viewport width. Do not fold these two back together. */
.page{max-width:1220px;margin:0 auto;padding:54px clamp(1rem,3vw,2rem) 0}
.cols{display:grid;grid-template-columns:200px minmax(0,1fr);
  gap:clamp(1.5rem,4vw,3.5rem);align-items:start}
@media (max-width:980px){.cols{grid-template-columns:1fr;gap:0}}

/* ── rail: the section index, tracking position ──────────────────── */
/* align-self:start stops the rail STRETCHING to its grid row's full height, which is
   worth having on its own — but it does NOT keep the rail out of the footer, and this
   comment claimed it did from 2026-07-29 until it was actually measured in a browser
   on 2026-07-30 00:00 EDT. What bounds a sticky element is its CONTAINING BLOCK, not
   its own height, so shrinking the box changed nothing: at 1440x900, scrolled to the
   bottom of Terms, the rail still sat 126px inside the footer. The real fix is
   structural and lives in .cols — see the markup comment above it. Keeping this note
   because "the CSS looks like it should work" is exactly how the bug survived a fix. */
/* ⚠️ NO SECOND SCROLLBAR. The rail is taller than the viewport on every one of
   these documents, so it has to scroll — but a visible bar beside the page's own
   bar reads as two independent things to operate, and the reader has no reason
   to operate this one: the script below keeps the tracked section in view, so
   the rail follows the page rather than waiting to be dragged. The bar is
   removed, not the scrolling.
   The mask is what stops that being a lie. With the bar gone, a hard crop at the
   top and bottom edges says "this list ends here"; a 2rem fade says it continues,
   which is true. mask-image, not a gradient overlay, because the rail sits on the
   page background and an overlay would need to know that colour. */
.rail{position:sticky;top:76px;align-self:start;padding:2.6rem 0 3.4rem;
  max-height:calc(100vh - 96px);overflow-y:auto;scrollbar-width:none;
  -webkit-mask-image:linear-gradient(180deg,transparent 0,#000 2rem,
    #000 calc(100% - 2rem),transparent 100%);
  mask-image:linear-gradient(180deg,transparent 0,#000 2rem,
    #000 calc(100% - 2rem),transparent 100%)}
.rail::-webkit-scrollbar{width:0;height:0}
.rail>.lab{display:block;margin-bottom:1rem;padding-left:.85rem}
/* The tracked-section readout is a MOBILE affordance only. paint() fills it on
   every viewport, so on desktop it rendered as a bare text node welded to the
   label with no separator — "SECTIONSWHO IS RESPONSIBLE FOR YOUR DATA". The
   desktop rail already shows position by highlighting the slot itself, so the
   readout is redundant there as well as broken. Hidden in CSS rather than
   guarded in JS: a viewport check in script would have to be re-run on resize
   and can disagree with the media query that actually governs the layout. */
.rail>.lab .cur{display:none}
.slot{display:grid;grid-template-columns:2.1rem 1fr;align-items:baseline;gap:.15rem;
  padding:.34rem 0 .34rem .8rem;text-decoration:none;border-left:2px solid var(--rule);
  transition:border-color .18s,color .18s}
.slot i{font-family:var(--mono);font-style:normal;font-size:.68rem;color:var(--ink3);
  font-variant-numeric:tabular-nums}
.slot span{font-family:var(--display);font-size:.8rem;line-height:1.35;color:var(--ink2);
  font-weight:500;letter-spacing:-.005em}
.slot:hover{border-left-color:var(--ink3)}
.slot:hover span{color:var(--ink)}
.slot.on{border-left-color:var(--accent)}
.slot.on i{color:var(--accent-t)}
.slot.on span{color:var(--ink);font-weight:650}
/* Below 980 the rail is replaced wholesale by .mnav, the single mobile
   control. It is not restyled for small screens any more — it is hidden. */
@media (max-width:980px){ .rail{display:none} }
.mnav{position:sticky;top:54px;z-index:50;margin:0 0 1.6rem}

/* ── the document ────────────────────────────────────────────────── */
/* ⚠️ --gut IS THE STICKY BAND'S REACH, AND IT IS DERIVED FROM THE PADDING ON PURPOSE.
   The pinned heading widens itself leftwards to cover the margin-number strip (see the
   .dsec>h2 rules below). That reach used to be a hard -3.8rem, while the gutter it
   reaches into is fluid (4.5vw) — so between 1120px, where the rule switches on, and
   ~1351px, where 4.5vw finally grows to 3.8rem, the band and the number BOTH hung
   outside .doc. Measured live at 1216px: band 5.0px out, number 1.8px out; worst case
   9.4px at 1120px. Capping the reach at the padding makes the overhang impossible at
   every width rather than only above one.
   Keep --pad as the single source of truth: the constant and the padding were written
   out separately, which is exactly how they drifted apart. */
.doc{--pad:clamp(1.6rem,4.5vw,4rem);
  --gut:min(3.8rem,var(--pad));
  --num:min(3.6rem,var(--gut));
  background:var(--paper);border:1px solid var(--rule);box-shadow:var(--shadow);
  padding:var(--pad);margin-bottom:3rem;position:relative;min-width:0}
.doc::before{content:"";position:absolute;inset:0 0 auto;height:3px;
  background:linear-gradient(90deg,var(--accent),var(--glow) 70%,transparent)}

.mast{margin-bottom:3.2rem}
.mast h1{font-family:var(--display);font-weight:800;letter-spacing:-.045em;line-height:.93;
  font-size:clamp(2.4rem,7vw,4.15rem);margin:.7rem 0 0;color:var(--ink)}
.mast .rule{height:1px;background:var(--rule);margin:1.6rem 0 .9rem}
.mast .meta{font-family:var(--mono);font-size:.7rem;letter-spacing:.09em;color:var(--ink3);
  text-transform:uppercase;display:flex;flex-wrap:wrap;gap:.35rem 1.1rem}
.mast .meta b{color:var(--ink2);font-weight:500}

/* ── headings: number lives in the margin ────────────────────────── */
.doc h2,.doc h3{font-family:var(--display);color:var(--ink);position:relative;scroll-margin-top:76px}
.doc h2{font-size:1.42rem;font-weight:750;letter-spacing:-.022em;line-height:1.22;
  margin:3.6rem 0 1.15rem;padding-bottom:.7rem;border-bottom:1px solid var(--rule)}
.doc h3{font-size:1.04rem;font-weight:700;letter-spacing:-.012em;margin:2.4rem 0 .75rem}
.doc h2:first-child,.doc h3:first-child{margin-top:0}

/* ── sections, and the heading that stays with you ────────────────────
   Every top-level heading and its clauses are wrapped by sectionise(). The
   spacing between sections moved onto the WRAPPER: inside a section the h2 is
   :first-child, so the existing rule above zeroes its top margin, and leaving the
   3.6rem there would have collapsed the gap between every section on the page. */
.doc .dsec{margin-top:3.6rem}
.doc .dsec:first-child{margin-top:0}

/* ⚠️ SCOPED TO DESKTOP ON PURPOSE. Below 980 the mobile nav is itself sticky at
   top:54px and about 52px tall, so a heading sticking to the same offset would sit
   underneath it — and that width already has the -On this page- control naming the
   section you are in, which is what a sticky heading is for.
   The background is not decoration: a sticky element with a transparent background
   has the document scrolling visibly through its glyphs. It only needs to span the
   content box, because .doc's padding is a gutter no text can enter. */
@media (min-width:981px){
  /* The shadow only exists while the heading is pinned — see the .stuck toggle in
     the scroll script. Without it a line of prose sliding under the band came to
     rest exactly on the heading's rule and read as a struck-through sentence. */
  .doc .dsec>h2.stuck{box-shadow:0 10px 12px -10px rgba(0,0,0,.32)}
  /* ⚠️ THE BAND HAS TO CLEAR THE PROSE OUT, AND A HARD EDGE CANNOT. A sticky
     heading with a solid background hides whatever is behind it and nothing more,
     so the line of text arriving underneath is sliced across the middle and its
     bottom half sits bright against the rule. The band gets a short fade below it
     instead, so a line dissolves as it goes under rather than being cut.
     top:100% and no pointer-events: it hangs below the border box, over the
     heading's own bottom margin, and must never eat a click on the prose. */
  .doc .dsec>h2::after{content:"";position:absolute;left:0;right:0;top:100%;
    height:15px;pointer-events:none;opacity:0;transition:opacity .18s ease;
    background:linear-gradient(var(--paper),transparent)}
  .doc .dsec>h2.stuck::after{opacity:1}
  .doc .dsec>h2{position:sticky;top:54px;z-index:4;background:var(--paper);
    padding-top:.9rem;padding-bottom:.78rem;
    transition:box-shadow .18s ease;
    /* The rule under the heading is its own border-bottom, so it travels with it
       and the stuck heading always reads as a closed band rather than as text
       floating over the prose. */
    margin-bottom:1.15rem}
  /* ⚠️ THE MARGIN INDEX HAS TO ABSORB THE STICKY PADDING. .idx is positioned
     top:.34em against the heading's PADDING box, which used to start at the text.
     Adding .9rem of padding-top for the sticky band pushed the heading's text down
     and left the number where it was, so every section number sat high — visible
     immediately, and only on the numbered legal set. The number is aligned to the
     text, so it has to move with it.
     The background is insurance: the number sits outside the heading's own band,
     in .doc's padding gutter.
     ⚠️ THE BAND MUST SPAN THE GUTTER TOO. A background patch behind the number is
     not enough: the number of the section you are LEAVING scrolls up through that
     same gutter and passed clean beside the pinned one, so two section numbers were
     on screen at once, one of them half-clipped. Widening the heading's own box
     leftwards by the gutter (negative margin + equal padding) makes the band cover
     the whole strip, and the number's offset moves with it — --gut minus --num, which
     is the old 0.2rem once the gutter is wide enough to hold both, and 0 while it is
     not, which sits the number flush inside the band's left edge instead of outside
     it. Both reaches are capped at .doc's own padding — see the --gut note above. */
  @media (min-width:1120px){
    .doc .dsec>h2{margin-left:calc(var(--gut) * -1);padding-left:var(--gut)}
    .doc .dsec>h2 .idx{top:calc(.34em + .9rem);left:calc(var(--gut) - var(--num))}
  }
}
.idx{font-family:var(--mono);font-size:.7rem;font-weight:500;color:var(--accent-t);
  letter-spacing:.02em;font-variant-numeric:tabular-nums;display:block;margin-bottom:.45rem}
.doc h3 .idx{color:var(--ink3);margin-bottom:.3rem}
@media (min-width:1120px){
  /* The fallback keeps any .idx rendered outside .doc — where --num is not declared —
     at exactly the offset it had before this became fluid. Without it an undeclared
     custom property makes the whole declaration invalid and left falls back to auto,
     which moves the number into the text instead of the margin. */
  .idx{position:absolute;left:calc(var(--num,3.6rem) * -1);top:.34em;margin:0;
    text-align:right;width:2.6rem}
  .doc h3 .idx{left:calc(var(--num,3.6rem) * -1);top:.28em}
}
.anchor{margin-left:.5rem;color:var(--rule2);text-decoration:none;font-size:.75em;
  opacity:0;transition:opacity .15s}
.doc h2:hover .anchor,.doc h3:hover .anchor{opacity:1}
.anchor:hover{color:var(--accent-t)}
/* On a touch device there is no hover to reveal it, so a per-heading ¶ is either
   permanently invisible or permanent clutter. Neither is worth the space. */
@media (hover:none){.anchor{display:none}}

/* ── prose ───────────────────────────────────────────────────────── */
.doc p,.doc li{font-family:var(--serif);font-size:1.055rem;line-height:1.78;color:var(--ink2)}
.doc p{margin:0 0 1.15rem;max-width:72ch}
.doc strong{color:var(--ink);font-weight:600}
.doc em{font-style:italic}
.doc ul,.doc ol{margin:0 0 1.25rem;padding-left:1.35rem;max-width:72ch}
.doc li{margin:.5rem 0}
.doc li::marker{color:var(--ink3);font-family:var(--mono);font-size:.85em}
.doc a{color:var(--ink);text-decoration:underline;text-underline-offset:.19em;
  text-decoration-thickness:1px;text-decoration-color:color-mix(in srgb,var(--accent) 60%,transparent)}
.doc a:hover{text-decoration-color:var(--accent)}
/* The signature: live cross-references, set apart from ordinary links. */
.xref{font-family:var(--mono);font-size:.86em;color:var(--accent-t)!important;
  text-decoration:none!important;border-bottom:1px dotted color-mix(in srgb,var(--accent) 55%,transparent);
  padding-bottom:1px;white-space:nowrap}
.xref:hover{border-bottom-style:solid;background:color-mix(in srgb,var(--accent) 12%,transparent)}
/* A reference to a repo file that is NOT published (see PUBLISHED_TARGETS). Styled
   as a named thing rather than a link, so it reads as deliberate instead of broken. */
.ref{font-family:var(--mono);font-size:.86em;color:var(--ink2);
  border-bottom:1px dotted var(--rule);padding-bottom:1px}
.doc code{font-family:var(--mono);font-size:.83em;background:var(--raised);
  border:1px solid var(--rule);padding:.11em .36em;color:var(--ink);word-break:break-word}
.doc hr{border:0;border-top:1px solid var(--rule);margin:2.8rem 0}

/* ── plain-text licence: clauses, sub-paragraphs, capitals ────────────
   Only the LICENSE page uses these. The source is plain text whose structure is
   carried entirely by indentation, so the job here is to make that structure
   visible without altering a character of it. */
.authoritative{font-family:var(--mono)!important;font-size:.72rem!important;line-height:1.7;
  letter-spacing:.03em;color:var(--ink3)!important;border:1px solid var(--rule2);
  border-left:3px solid var(--accent);padding:.75rem 1rem;margin:0 0 2.4rem!important;
  max-width:72ch}
.authoritative{display:flex;align-items:center;gap:1rem 1.4rem;flex-wrap:wrap;
  justify-content:space-between}
.authoritative p{margin:0;flex:1 1 34ch}
.authoritative a{color:var(--ink)}
/* Download the instrument. The arrow is drawn rather than typed so it inherits
   the button's colour in both themes and cannot fall back to a missing glyph. */
.dl{display:inline-flex;align-items:center;gap:.55rem;flex:0 0 auto;min-height:38px;
  padding:.45rem .95rem;border-radius:999px;border:1px solid var(--rule2);
  background:color-mix(in srgb,var(--ink) 7%,transparent);
  font-family:var(--mono);font-size:.64rem;letter-spacing:.12em;text-transform:uppercase;
  text-decoration:none;transition:border-color .25s,background .25s}
.dl-i{position:relative;width:9px;height:11px;flex:0 0 auto}
.dl-i::before{content:"";position:absolute;left:3.6px;top:0;width:1.6px;height:7px;
  background:currentColor}
.dl-i::after{content:"";position:absolute;left:.6px;top:3.6px;width:6px;height:6px;
  border-left:1.6px solid currentColor;border-bottom:1.6px solid currentColor;
  transform:rotate(-45deg)}
.dl:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
@media (hover:hover) and (pointer:fine){
  .dl:hover{border-color:color-mix(in srgb,var(--accent) 60%,transparent);
    background:color-mix(in srgb,var(--accent) 13%,transparent)}
  .dl:hover .dl-i{animation:dlBob .62s ease}
}
@keyframes dlBob{0%{transform:translateY(0)}42%{transform:translateY(3px)}100%{transform:translateY(0)}}
@media (prefers-reduced-motion:reduce){.dl:hover .dl-i{animation:none}}
h3.clause{display:flex;align-items:baseline;gap:.55rem;margin:2.5rem 0 .6rem;
  font-size:1rem;font-weight:700}
h3.clause .idx{color:var(--accent-t);margin:0;flex:0 0 auto;font-size:.76rem}
h3.clause .ht:empty{display:none}
@media (min-width:1120px){
  h3.clause .idx{position:absolute;left:-4.2rem;top:.3em;text-align:right;width:3.2rem}
  /* ⚠️ A clause with no title phrase is JUST a number, and the empty heading was
     still generating a 14.5px box plus a bottom margin. That pushed the clause
     text down while the number stayed pinned to the heading, leaving the number
     stranded above the sentence it labels — measured at 13.3px, which reads as a
     misalignment because it is one. Collapsing the box to zero puts the number on
     the clause's own first line, which is where a margin index belongs.
     Only inside this query: below 1120px the index is an in-flow flex item and
     zero height would clip it. */
  h3.clause:has(.ht:empty){height:0;margin:2.4rem 0 0}
  h3.clause:has(.ht:empty) .anchor{display:none}
}
@media (max-width:1119px){
  h3.clause:has(.ht:empty){margin-bottom:.15rem}
}
p.sub{font-family:var(--serif);font-size:1.02rem;line-height:1.76;color:var(--ink2);
  margin:0 0 .95rem;max-width:70ch}
p.sub.aside{border-left:2px solid var(--rule2);padding-left:1rem;color:var(--ink2);
  font-size:.97rem;background:linear-gradient(90deg,color-mix(in srgb,var(--accent) 5%,transparent),transparent 60%)}
ul.lettered{list-style:none;margin:0 0 1.05rem;padding-left:1.1rem;max-width:70ch}
ul.lettered li{font-family:var(--serif);font-size:1.01rem;line-height:1.72;color:var(--ink2);
  margin:.34rem 0}
/* Legal convention treats the capitals in a warranty disclaimer AS the emphasis,
   so they are preserved rather than down-cased — but a wall of capital serif at
   reading size is genuinely hard going, hence the smaller, looser, mono setting. */
p.shout{font-family:var(--mono);font-size:.8rem;line-height:1.85;letter-spacing:.015em;
  color:var(--ink2);background:var(--raised);border:1px solid var(--rule);
  padding:1rem 1.15rem;margin:0 0 1.1rem;max-width:74ch}
pre.block{font-family:var(--mono);font-size:.82rem;line-height:1.75;color:var(--ink);
  background:var(--raised);border:1px solid var(--rule);border-left:3px solid var(--accent);
  padding:.85rem 1.1rem;margin:0 0 1.15rem;max-width:72ch;overflow-x:auto;white-space:pre}
/* Column-aligned tables (NOTICE's dependency and trademark lists). The alignment
   IS the structure, so it must not wrap — hence its own horizontal scroll rather
   than letting the page body scroll, which is the rule for every wide element. */
pre.aligned{font-family:var(--mono);font-size:.76rem;line-height:1.72;color:var(--ink2);
  background:var(--raised);border:1px solid var(--rule);padding:.8rem 1rem;
  margin:0 0 1.1rem;overflow-x:auto;white-space:pre;max-width:100%}
pre.aligned a{color:var(--ink)}

/* ── callouts ────────────────────────────────────────────────────── */
.callout{margin:1.7rem 0;padding:1.15rem 1.35rem;background:var(--raised);
  border:1px solid var(--rule);border-left:3px solid var(--accent);max-width:72ch}
.callout>:last-child{margin-bottom:0}
.callout p{max-width:none}
.callout.warn{border-left-color:var(--gold);
  background:color-mix(in srgb,var(--gold) 9%,var(--raised))}
.callout h2,.callout h3{margin:0 0 .6rem;border:0;padding:0;font-size:.95rem;
  letter-spacing:.02em;text-transform:uppercase;font-weight:700}
.callout h2 .idx,.callout h3 .idx{display:none}
.callout .anchor{display:none}

/* ── tables: technical readout ───────────────────────────────────── */
.tw{overflow-x:auto;margin:1.7rem 0;border:1px solid var(--rule);background:var(--raised)}
.doc table{border-collapse:collapse;width:100%;min-width:min(540px,100%)}
.doc th,.doc td{padding:.7rem .85rem;text-align:left;vertical-align:top;
  border-bottom:1px solid var(--rule)}
.doc th{font-family:var(--mono);font-size:.63rem;letter-spacing:.13em;text-transform:uppercase;
  color:var(--ink3);font-weight:500;white-space:nowrap;background:var(--paper)}
.doc td{font-family:var(--serif);font-size:.95rem;line-height:1.6;color:var(--ink2)}
.doc tbody tr:last-child td{border-bottom:0}
.doc tbody tr:hover td{background:color-mix(in srgb,var(--accent) 6%,transparent)}

/* ⚠️ NARROW SCREENS GET A STACK, NOT A SCROLLER, AND THAT IS THE WHOLE POINT.
   Measured on a 375px viewport before this existed: .tw had a 288px content box
   around a table whose columns could not compress below 340px, so every one of
   these tables side-scrolled AND clipped its last column. Three columns of prose
   in 288px is about 95px each, which is narrower than the words inside them, so
   the code chips broke mid-token and a four-letter value wrapped across three
   lines. A column narrower than its own longest word cannot be fixed by tuning,
   only by removing the column constraint.
   min-width has to be reset explicitly: min(540px,100%) resolves against the
   wrapper, so it was already yielding to the wrapper and doing nothing useful,
   but it still pins the table to the wrapper's width once display goes to block.
   Every one of these tables is a KEY plus attributes about the key — Discord user
   ID, db-theme, version 1.4 — so the first cell becomes the card's title strip and
   the rest carry their column name above the value. That shape is structural, not
   a match on header text, which is why it does not rot the way the warm treatments
   warn about. */
@media (max-width:620px){
  .tw{overflow-x:visible;border:0;background:none}
  .doc table{display:block;min-width:0;width:100%}
  /* Clipped, never display:none. The column names are the only thing tying a value
     to its meaning, and a screen reader loses the native header association the
     moment display:block strips the table roles — so the header row stays in the
     accessibility tree and the roles are re-declared on the markup itself. */
  .doc thead{position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;
    overflow:hidden;clip-path:inset(50%);white-space:nowrap}
  .doc tbody{display:block}
  .doc tbody tr{display:block;margin:0 0 .8rem;border:1px solid var(--rule);
    background:var(--raised);overflow:hidden}
  .doc tbody tr:last-child{margin-bottom:0}
  .doc td{display:block;padding:.6rem .85rem;border-bottom:1px solid var(--rule)}
  .doc td::before{content:attr(data-label);display:block;margin-bottom:.22rem;
    font-family:var(--mono);font-size:.57rem;letter-spacing:.13em;text-transform:uppercase;
    color:var(--ink3);font-weight:500}
  /* The key cell reads as the card's heading: same family and weight the document
     gives an h3, on the paper tone so the strip separates from the attributes under
     it without needing a second border. */
  .doc tbody td:first-child{background:var(--paper);font-family:var(--display);
    font-weight:650;color:var(--ink);font-size:.92rem;line-height:1.35}
  .doc tbody tr td:last-child{border-bottom:0}
  /* A row-wide tint on a card that already has its own surface just muddies it, and
     there is no hover on the devices this branch is for. */
  .doc tbody tr:hover td{background:none}
  .doc tbody tr:hover td:first-child{background:var(--paper)}
}

/* ── footer ──────────────────────────────────────────────────────── */
/* No grid-column here any more: the footer left the grid when .cols was introduced,
   so grid-column:1/-1 had become an inert declaration describing a layout that no
   longer exists. It spans the full .page width simply by being a block child of it. */

@media print{
  .bar,#prog,.rail,.anchor,.thm,.ghb,.mnav,.totop,.ins{display:none!important}
  .authoritative{border:1px solid #999}
  p.shout,pre.block{border:1px solid #999;background:#fff;color:#000;break-inside:avoid}
  body{background:#fff;color:#000}
  .page{max-width:none;padding:0}
  /* .cols carries the grid now, so the print reset has to flatten IT — resetting
     .page alone would have left the 200px rail column reserved on paper. */
  .cols{display:block}
  .doc{border:0;box-shadow:none;padding:0;background:#fff}
  .doc::before{display:none}
  .doc p,.doc li,.doc td{color:#000}
  .idx{position:static!important;color:#000;display:inline;margin-right:.5rem}
  .xref{color:#000!important;border:0}
  .tw,.callout{border:1px solid #999;break-inside:avoid}
  .doc h2,.doc h3{break-after:avoid}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
html{scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>\n${GOO_SVG}

<div class="bar">
  ${wordmark('./', cur)}
  <nav>
    ${navSwitcher(cur)}
    ${repoBtn}
    ${installBtn()}
    ${themeBtn()}
  </nav>
</div>
<div id="prog"></div>
${mobileNav(cur, slots)}

<div class="page">
  <!-- .cols carries the two-column grid; .page is only the centred wrapper. The
       split is load-bearing and was measured, not guessed (2026-07-30).

       The footer used to be a third child of the grid itself, and that is what put
       the sticky rail INTO it: a sticky element's travel is bounded by its
       containing block, and with the footer inside that same block the rail was
       free to slide across the footer's row. At 1440x900 on Terms it ran 236px
       past the end of the document and 126px into the footer. align-self:start
       does NOT fix this — it sizes the rail's own box and leaves the containing
       block exactly as tall as before, which is why the earlier blind fix looked
       right in the CSS and changed nothing on screen.

       Lifting the footer OUT of the grid but leaving it in .page is what makes the
       rail stop: the rail's containing block is now .cols, which ends with the
       document. It has to stay inside .page, though — as a direct child of <body>
       it stretched to the full 1440px viewport instead of the 1156px document
       column. Both halves were verified in a live browser at the scrolled-to-bottom
       position, which is the only place the bug is visible at all. -->
  <div class="cols">
    <aside class="rail" id="rail">
      <span class="lab">Sections</span>
      <div class="slots" id="slots">${slots}</div>
    </aside>

    <main class="doc" id="main" tabindex="-1">
      <header class="mast">
        <span class="lab">${esc(kicker)}</span>
        <h1>${esc(title)}</h1>
        <div class="rule"></div>
        <div class="meta">${meta.map(m => `<span>${m}</span>`).join('')}</div>
      </header>
      ${sectionise(body)}
    </main>
  </div>

  <!-- Same footer as every other page: see pageFoot(). PAGES already contains
       Notice, so the hand-added ../NOTICE link that used to sit here produced two
       "Notice" entries side by side. The email stays off it — that belongs on the
       landing page and in the Privacy Policy. -->
  ${pageFoot(cur, null, false)}
</div>

<!-- Back to top. A fixed element is trapped by any ancestor carrying a filter,
     transform or backdrop-filter, which is exactly what once anchored a fixed
     control to the 54px bar instead of the viewport, so this sits outside .page. -->
<button class="totop" id="totop" data-tip="Back to top" aria-label="Back to top">
  <svg class="tt-ring" viewBox="0 0 46 46" aria-hidden="true" focusable="false">
    <circle class="tt-trk" cx="23" cy="23" r="20"/>
    <circle class="tt-bar" cx="23" cy="23" r="20"/>
  </svg>
  <span class="tt-ar" aria-hidden="true"><i></i><i></i></span>
</button>

<script>
(function(){
  var prog=document.getElementById('prog');
  var top=document.getElementById('totop'), ttBar=top&&top.querySelector('.tt-bar');
  /* Cached, not read per frame: getComputedStyle forces a style resolve, and this
     value only changes with the viewport (it is a clamp of vw). */
  var foot=document.querySelector('.foot'), ttBase=0, ttPad=0;
  function ttMeasure(){
    ttBase=top?parseFloat(getComputedStyle(top).bottom)||0:0;
    ttPad=foot?parseFloat(getComputedStyle(foot).paddingTop)||0:0;
  }
  ttMeasure();
  var slots=[].slice.call(document.querySelectorAll('.slot'));
  var rail=document.querySelector('.rail'), lastId=null;
  /* The section index is rendered TWICE — once in the desktop rail, once in the
     mobile control — and exactly one of the two is display:none at any width.
     So tracking has to key on the section ID, not on a position in this array:
     the old code highlighted slots[cur] out of a flat list of 44, which meant
     whichever copy sat later in the DOM won and the other never lit up. On a
     phone that was the visible one — the Sections list never showed where you
     were, while the hidden desktop rail was faithfully highlighting itself. */
  var ids=[],seen={};
  slots.forEach(function(a){
    var id=a.getAttribute('href').slice(1);
    if(!seen[id]){ seen[id]=1; ids.push(id); }
  });
  var heads=ids.map(function(id){return document.getElementById(id)});
  var queued=false;
  function paint(){
    var h=document.documentElement, max=h.scrollHeight-h.clientHeight;
    /* ⚠️ CLAMPED. iOS rubber-band scrolling reports scrollTop below 0 and past
       max, and the URL bar showing or hiding changes clientHeight — and therefore
       max — mid-scroll. Unclamped, the progress bar and the ring both jumped and
       re-drew themselves whenever the page was overscrolled past either end,
       which is the "resets the circle outline" report. */
    var frac=max>0?Math.min(1,Math.max(0,h.scrollTop/max)):0;
    prog.style.width=(frac*100)+'%';
    if(top){
      /* ⚠️ .on IS OWNED BY MORPH_JS NOW, not by this loop. Its back-to-top module
         runs a birth animation across many frames, and a second handler toggling
         the same class from a scroll position would fight it every frame. What
         stays here is the ring's progress and the --lift that parks the button
         above the footer — position, not state, and each has exactly one writer. */
      if(ttBar) ttBar.style.strokeDashoffset=(125.66*(1-frac)).toFixed(2);
      /* Park above the footer. base is the button's own CSS bottom offset, so the
         un-lifted bottom edge sits at innerHeight-base; anything below the
         footer's top edge (less a 12px breathing gap) is overlap, and the lift is
         exactly that. Read the footer's rect, never the button's — the button's
         own rect already includes the lift, which would feed back on itself. */
      /* ⚠️ IT PARKS ON THE FOOTER'S CONTENT, NOT ON ITS BOX. The footer carries
         2.2rem of top padding, so stopping at the box's top edge left the button
         hovering over the bottom-right corner of the document card, in the gap
         where nothing needed covering. Clearing the first line of actual footer
         text instead lets it settle INTO that gap, which is where it belongs and
         is also 35px lower. */
      if(foot){
        var ft=foot.getBoundingClientRect().top + ttPad;
        var over=(h.clientHeight-ttBase)-ft+12;
        top.style.setProperty('--lift',(over>0?over:0).toFixed(1)+'px');
      }
    }
    var cur=-1;
    /* Viewport-relative, not offsetTop. offsetTop is measured from the nearest
       POSITIONED ancestor, and the headings sit inside .doc, which is
       position:relative — so it was being compared against a document-space
       scroll value and every heading read low by the masthead's height. */
    /* ⚠️ .stuck IS TOGGLED FROM THE RECT THE SCROLLSPY ALREADY READS. A pinned
       heading needs a shadow and a resting one must not have it, and CSS cannot
       tell the two apart — but this loop already measures every heading's top on
       every frame, so the answer is free. A sentinel element plus a second
       IntersectionObserver would have cost a node per section and a second source
       of truth about where a heading is.
       The test is "within a pixel of the sticky offset", not "above it": once the
       section ends the heading is pushed to a negative top and is no longer pinned,
       and a <= test would have left the shadow on all the way up the page.
       Below 981 the sticky rule is off entirely, so nothing may latch there. */
    var wide=matchMedia('(min-width:981px)').matches;
    for(var i=0;i<heads.length;i++){
      if(!heads[i]) continue;
      var ht=heads[i].getBoundingClientRect().top;
      if(ht<=130) cur=i;
      heads[i].classList.toggle('stuck', wide && ht>52.5 && ht<55.5);
    }
    /* At the bottom of the document the last headings can never cross the 130px
       line — the page simply runs out of scroll before they get there — so the
       final section could never highlight and the rail stayed stuck on whichever
       one did cross it (Contact, on Privacy, with Appendix A unreachable).
       Clamping to the last section at scroll end is what makes the rail agree
       with what is actually on screen. */
    if(max>0&&h.scrollTop>=max-2) cur=heads.length-1;
    var curId=cur>=0?ids[cur]:null;
    for(var j=0;j<slots.length;j++){
      slots[j].classList.toggle('on', slots[j].getAttribute('href').slice(1)===curId);
    }
    /* Keep the tracked slot inside the rail's own scroll box, so the rail
       travels with the page instead of needing to be scrolled separately.
       scrollTop is set directly rather than through scrollIntoView: that call
       walks every scrollable ancestor and will move the PAGE when the element
       is not fully in the viewport, which on a sticky rail means the page
       scrolling itself in response to being scrolled. Only fires when the
       tracked section actually changes — this function runs on every frame of
       scroll, and a per-frame smooth scroll never converges. */
    if(rail&&curId&&curId!==lastId){
      lastId=curId;
      var sEl=rail.querySelector('.slot[href="#'+curId+'"]');
      if(sEl){
        var pad=56, et=sEl.offsetTop, eh=sEl.offsetHeight, want=null;
        if(et<rail.scrollTop+pad) want=Math.max(0,et-pad);
        else if(et+eh>rail.scrollTop+rail.clientHeight-pad)
          want=et+eh-rail.clientHeight+pad;
        if(want!==null){
          if(rail.scrollTo) rail.scrollTo({top:want,
            behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});
          else rail.scrollTop=want;
        }
      }
    }
    // Mirror the tracked section into the mobile opener. On desktop the rail
    // shows position by itself; on mobile the list is collapsed, so without this
    // there is no positional cue anywhere on a 22-section document.
    var curEl=document.getElementById('railcur');
    if(curEl){
      var t=curId?document.querySelector('.slot[href="#'+curId+'"] span'):null;
      curEl.textContent=t?t.textContent:'';
    }
    queued=false;
  }
  /* The click handler moved to MORPH_JS with .on, for the same reason: pressing
     the button starts a destruction animation, and the arrow's fire keyframes
     are the REDUCED-MOTION path rather than a separate effect that could run
     alongside it. Both live in one place now. */
  addEventListener('scroll',function(){ if(!queued){queued=true;requestAnimationFrame(paint);} },{passive:true});
  addEventListener('resize',function(){ ttMeasure(); paint(); }); paint();


})();
${THEME_JS}
${NAV_JS}
${MORPH_JS}
</script>
</body>
</html>`;
}

/* ─────────────────── warm template: contributing / contributors ────────── */

/**
 * The non-legal pages. Every choice here is the deliberate inverse of shell():
 * rounded instead of squared, a warm radial wash instead of a flat desk, a single
 * centred column instead of a rail-plus-document grid, and NO section numbers —
 * the numbered margin index is the legal set's signature and must not leak here.
 *
 * The header keeps the same wordmark, repo, install and theme controls so the site
 * still reads as one site; the four-tab switcher is replaced by a single route
 * back to the legal index, because a reader here is not choosing between documents.
 */
/* ─────────── warm-page composition: contributing / contributors ─────────── */

/**
 * The legal pages are prose in a frame on purpose — a statute reads as a statute.
 * These two are not statutes, and rendering them the same way is what made them
 * read as a Markdown dump in a rounded box.
 *
 * So each one gets structure derived from what its content actually IS:
 *
 *   contributing  A path. Understand the licence, pick a lane, set up, follow the
 *                 conventions, open the PR, sign the CLA. Order carries real
 *                 information, so the sections hang off a spine — but with NO
 *                 numerals: the 01/02/03 series is the legal set's, and it means
 *                 "this binds you". Inside it, two sub-structures:
 *                   · the four ways to contribute are PARALLEL, not sequential →
 *                     option tiles, so a reader picks rather than reads through
 *                   · the CLA is genuinely two-sided — what leaves your hands vs
 *                     what stays in them → a ledger, marked by direction
 *   contributors  A wall. No spine: it has three sections, and the truth of the
 *                 page is one filled plate beside empty space.
 *
 * Signature object per page, one each, nothing more:
 *   contributing  the consent slip — the single line a reader must physically take
 *                 away, given a tear edge and a copy button
 *   contributors  the plate — engraved for the maintainer, ghosted and waiting for
 *                 the next name
 *
 * WARM_STRUCT is declared rather than sniffed so warmStructAudit() can fail when a
 * source heading is renamed. Without that, the treatment would silently stop
 * matching and the page would quietly revert to the plain prose it started as —
 * the same class of failure as a check that draws its expectations from the code
 * it is testing.
 */
const WARM_STRUCT = {
    'contributing.html': {
        spine: true,
        sections: {
            'ways to contribute': 'options',
            'contributor licence agreement (cla)': 'ledger'
        },
        // The slip is found by content, not by heading: it is the line itself that
        // matters, and it sits under a heading ("How to confirm it") whose wording
        // is far more likely to change than the sentence a contributor must paste.
        slip: 'I have read and agree'
    },
    'contributors.html': {
        spine: false,
        sections: {
            'maintainer': 'plates',
            'contributors': 'plates',
            'how credit works': 'promises'
        }
    }
};

// What leaves your hands, and what stays in them. Only the direction NAME is
// emitted; the glyph itself is drawn from CSS.
//
// That is not a style preference. Emitting the mark as HTML text put "↗" into the
// document between a section's lead paragraph and its first heading, which broke
// four of verify()'s source runs — the run was contiguous in the source and no
// longer contiguous in the output. A decorative mark that a screen reader must be
// told to ignore has no business in the DOM in the first place, so moving it to
// CSS fixes the accessibility story and the verifier in one move. The alternative
// on offer was teaching verify() to skip aria-hidden text, which would have opened
// a hole big enough to hide real content loss in.
const LEDGER_DIRS = [
    [/granting/, 'out'],
    [/you keep/, 'hold'],
    [/confirming/, 'check'],
    [/not getting/, 'none']
];

let WARM_HITS = {};
const warmHit = k => { WARM_HITS[k] = (WARM_HITS[k] || 0) + 1; };

const stripTags = s => s.replace(/<[^>]*>/g, '').trim();
const headingInner = h => (h.match(/<span class="ht">([\s\S]*?)<\/span>/) || [, ''])[1];
const headingText = h => stripTags(headingInner(h)).toLowerCase();

// Split a section body at its <h3> boundaries. Anything before the first one is
// lead-in prose that belongs to the section, not to a sub-group.
function byH3(body) {
    const pre = [];
    const groups = [];
    for (const b of body) {
        const h = b.match(/^<h3 id="([^"]+)"/);
        if (h) { groups.push({ id: h[1], head: b, text: headingText(b), body: [] }); continue; }
        (groups.length ? groups[groups.length - 1].body : pre).push(b);
    }
    return { pre, groups };
}

function asOptions(body) {
    const { pre, groups } = byH3(body);
    const tiles = groups.map(g => {
        // Each lane is marked with an emoji in the source. It carries nothing a
        // screen reader needs — "lady beetle, Bug reports" is worse than "Bug
        // reports" — so it is lifted out of the accessible name into an
        // aria-hidden mark and kept as pure visual.
        const inner = headingInner(g.head);
        const em = inner.match(/^\s*(\p{Extended_Pictographic}️?)\s*/u);
        const head = em ? g.head.replace(inner, inner.slice(em[0].length)) : g.head;
        const mark = em ? `<span class="opt-m" aria-hidden="true">${em[1]}</span>` : '';
        return `<article class="opt">${mark}${head}<div>${g.body.join('\n')}</div></article>`;
    }).join('');
    if (tiles) warmHit('options');
    return pre.join('\n') + (tiles ? `<div class="opts">${tiles}</div>` : '');
}

function asSlip(block, mark) {
    if (!mark || !block.startsWith('<pre class="code"') || !block.includes(mark)) return block;
    const line = (block.match(/<code>([\s\S]*?)<\/code>/) || [, ''])[1];
    warmHit('slip');
    // No label above the line: the source paragraph immediately before it already
    // says "Include this line in your pull request description". A second caption
    // would be the same job done twice.
    return '<div class="slip">'
        + `<p class="slip-t" id="cla-line">${line}</p>`
        + '<button class="cpy" type="button" data-copy="cla-line">'
        // ⚠️ The same DRAWN glyph the floating code-copy button uses, not a
        // character. This was U+2372 (⍲), which is an APL operator — it renders as
        // whatever each platform has for it, looked like nothing in particular, and
        // meant nothing at all. Two overlapping sheets is what "copy" looks like.
        + '<span class="cpy-g" aria-hidden="true"></span>'
        + '<span class="cpy-t">Copy</span></button>'
        + '<span class="cpy-s" role="status" aria-live="polite"></span></div>';
}

function asLedger(body, slipMark) {
    const { pre, groups } = byH3(body);
    const rows = [];
    const rest = [];
    for (const g of groups) {
        const dir = LEDGER_DIRS.find(([re]) => re.test(g.text));
        if (dir) {
            rows.push(`<div class="ldg-r" data-d="${dir[1]}">`
                + '<span class="ldg-m" aria-hidden="true"></span>'
                + `${g.head}<div>${g.body.join('\n')}</div></div>`);
        } else {
            // "How to confirm it" is an instruction, not a side of the ledger, so it
            // stays outside it — and it is where the slip lives.
            rest.push(g.head + '<div>'
                + g.body.map(b => asSlip(b, slipMark)).join('\n') + '</div>');
        }
    }
    if (rows.length) warmHit('ledger');
    return pre.join('\n')
        + (rows.length ? `<div class="ldg">${rows.join('')}</div>` : '')
        + rest.join('\n');
}

function asPlates(body) {
    return body.map(b => {
        if (b.startsWith('<div class="tw"')) {
            // Our own table markup, so the shape is fixed: one <tr> per row, one
            // <td> per cell, and inline() never emits a nested </td>.
            const tb = (b.match(/<tbody>([\s\S]*?)<\/tbody>/) || [, ''])[1];
            const plates = [...tb.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(m => {
                const c = [...m[1].matchAll(/<td>([\s\S]*?)<\/td>/g)].map(x => x[1]);
                return `<div class="plate"><span class="plate-n">${c[0] || ''}</span>`
                    + `<span class="plate-r">${c.slice(1).join(' · ')}</span></div>`;
            }).join('');
            if (!plates) return b;
            warmHit('plates');
            // The column headers survive as a legend above the wall rather than as
            // a label on every plate. Dropping them was real content loss, caught
            // by verify() ("name role harkirat mangat...") — a plate needs no NAME
            // label above a name, but the header row is still authored text, and
            // the documented format for future entries adds Contribution and First
            // shipped in, which are NOT self-describing once three values sit on
            // one plate. A legend covers both cases with one line.
            const th = [...b.matchAll(/<th>([\s\S]*?)<\/th>/g)].map(x => stripTags(x[1]));
            const legend = th.length
                ? `<p class="wall-l">${th.join(' &middot; ')}</p>` : '';
            return `${legend}<div class="wall">${plates}</div>`;
        }
        // "*No external contributions yet — this is where your name goes.*" is the
        // most important sentence on the page, and italic body text is the weakest
        // possible way to say it. It becomes the empty plate itself: the invitation
        // IS the object.
        //
        // Nothing is invented in it beyond the "Your name" affordance — a
        // FABRICATED contributor row once reached the live site from an HTML
        // comment, so the plate carries the source's own words and no plausible
        // name, handle, or contribution.
        const em = b.match(/^<p><em>([\s\S]*?)<\/em><\/p>$/);
        if (em) {
            warmHit('plates');
            // The name slot's "Your name" is drawn by CSS, not emitted here. It is a
            // label whose entire meaning is already stated by the sentence beside it
            // ("...this is where your name goes"), so it is reinforcement rather than
            // information — the same test the ledger's direction marks had to pass.
            // Emitting it put invented text BETWEEN the "Contributors" heading and the
            // source's own sentence, which broke that run in verify(). The alternative
            // was teaching verify() to ignore aria-hidden text, and that would hide
            // real content loss just as effectively as it hides this.
            /* The empty plate is a ROUTE, not a caption. It says "this is where
               your name goes" and then did nothing about it; pointing it at the
               contributing guide turns the page's one statement of intent into
               the one thing a reader might act on. No invented text — the source
               sentence is unchanged, only wrapped. */
            return '<div class="wall"><a class="plate ghost" href="./contributing.html">'
                + '<span class="plate-n" aria-hidden="true"></span>'
                + `<span class="plate-r">${em[1]}</span></a></div>`;
        }
        return b;
    }).join('\n');
}

function asPromises(body) {
    return body.map(b => {
        if (!/^<ul>/.test(b)) return b;
        const items = [...b.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => m[1]);
        if (items.length < 2) return b;
        warmHit('promises');
        const cards = items.map(t => {
            const m = t.match(/^<strong>([\s\S]*?)<\/strong>\s*([\s\S]*)$/);
            return '<article class="prom">'
                + `<h4>${m ? m[1] : ''}</h4><p>${m ? m[2] : t}</p></article>`;
        }).join('');
        return `<div class="proms">${cards}</div>`;
    }).join('\n');
}

/**
 * Groups a parsed warm page into sections and applies its declared treatments.
 * Returns the body, the lifted sign-off, and which treatments actually fired.
 */
/* A real copy control on every code block. The CLA slip already had one because
   that line MUST be pasted somewhere; the setup commands are the same job and had
   nothing. Applied to the composed HTML rather than at parse time on purpose: by
   this point asSlip() has already claimed the CLA block, so anything still a
   pre.code is an ordinary code block and cannot be double-wrapped.
   The button is a SIBLING of the pre, never a child — text inside the pre joins
   its textContent, which would both split a verify() run and end up inside what
   the copy control copies. */
let CPY_N = 0;
function withCopyButtons(html) {
    return html.replace(/<pre class="code"([^>]*)>([\s\S]*?)<\/pre>/g, (m, attrs, inner) => {
        const id = 'code-' + (++CPY_N);
        warmHit('copy');
        return '<div class="cw"><pre class="code"' + attrs + ' id="' + id + '">' + inner + '</pre>'
            /* ⚠️ NO TEXT in this button, and the icon is drawn in CSS rather than
               typed as a glyph. Both the word "Copy" and a character icon join the
               page text between the code block and the prose after it, which split
               three verify() runs that span that boundary — caught by gate 1 on the
               first build. An icon-only control is the convention for a code block
               anyway; the accessible name comes from aria-label and the result is
               announced through the live region beside it. */
            + '<button class="cpy cpy-f" type="button" data-tip="Copy" aria-label="Copy code" data-copy="' + id + '">'
            + '<span class="cpy-g" aria-hidden="true"></span></button>'
            + '<span class="cpy-s" role="status" aria-live="polite"></span></div>';
    });
}

function warmCompose(blocks, out) {
    const spec = WARM_STRUCT[out];
    if (!spec) return { body: blocks.join('\n'), sig: '', spine: false, hits: {} };
    WARM_HITS = {};

    // Lift the closing sign-off out of the body. Both sources end with the same
    // line the bot's /settings panel closes with, which is correct when the file is
    // read on GitHub — but the template also renders a sign-off, so leaving it in
    // the body printed it twice. Lifting beats deleting: the page still shows the
    // words the file actually carries, rather than a second hardcoded copy that
    // could drift away from it.
    let sig = '';
    const last = blocks[blocks.length - 1] || '';
    if (/^<p>[^<]*Made with love by/.test(last)) {
        sig = last.replace(/^<p>/, '').replace(/<\/p>$/, '')
            .replace('♡', '<span class="hrt" aria-hidden="true">&#9825;</span>')
            /* The name links to the controller's Discord profile here too. The
               legal pages get it from DIOR_SIG; this sign-off is lifted from the
               source file, so the <b> the parser produced is upgraded in place
               rather than the line being replaced by a second hardcoded copy —
               which is the whole reason it is lifted instead of deleted. */
            .replace('<b>dior</b>',
                `<a class="sig-a" href="${DISCORD_URL}" target="_blank" rel="noopener noreferrer">dior</a>`);
        blocks = blocks.slice(0, -1);
        warmHit('sig');
    }

    const lead = [];
    const secs = [];
    for (const b of blocks) {
        // The source rules separated sections when they were a flat run of prose.
        // The section frames do that job now, so a horizontal rule between two
        // framed blocks is a divider dividing nothing.
        if (b === '<hr>') continue;
        const h = b.match(/^<h2 id="([^"]+)"/);
        if (h) { secs.push({ head: b, text: headingText(b), body: [] }); continue; }
        (secs.length ? secs[secs.length - 1].body : lead).push(b);
    }

    const parts = [];
    if (lead.length) parts.push(`<div class="lead">${lead.join('\n')}</div>`);
    for (const s of secs) {
        const treat = spec.sections[s.text];
        let inner;
        if (treat === 'options') inner = asOptions(s.body);
        else if (treat === 'ledger') inner = asLedger(s.body, spec.slip);
        else if (treat === 'plates') inner = asPlates(s.body);
        else if (treat === 'promises') inner = asPromises(s.body);
        else inner = s.body.join('\n');
        parts.push(`<section class="sec"${treat ? ` data-t="${treat}"` : ''}>`
            + `<span class="node" aria-hidden="true"></span>${s.head}`
            + `<div class="sec-b">${inner}</div></section>`);
    }
    return { body: withCopyButtons(parts.join('\n')), sig, spine: !!spec.spine, hits: WARM_HITS };
}

/**
 * GATE 5. Every treatment a page declares must have actually fired.
 *
 * The treatments key off source heading text, so renaming "Ways to contribute" in
 * CONTRIBUTING.md would stop matching and the tiles would become a plain run of
 * h3s and paragraphs — a silent revert to the exact design this pass replaced.
 * verify() cannot see it (every word still present), linkAudit() cannot see it (no
 * links change), structureAudit() cannot see it (no aligned columns involved).
 * Different property, so: different gate.
 */
/**
 * GATE 6. No class name may be shared between a layout container and a content
 * block in the same page.
 *
 * Born from a real defect that shipped: the parser emitted <pre class="cols">
 * for NOTICE's aligned dependency tables, and shell()'s page layout used
 * .cols{display:grid;grid-template-columns:200px minmax(0,1fr)} for the
 * rail-plus-document grid. Same name, one stylesheet — so all twelve blocks
 * computed display:grid with a 200px first track and spilled their lines out of
 * it, on the live site.
 *
 * None of the content gates could see it. Every word was present (verify), every
 * link resolved (linkAudit), every aligned line was still inside a <pre>
 * (structureAudit), and no reference was inert (crossRefAudit). The document was
 * intact; only its RENDERED BOX was wrong, and a static build cannot measure
 * that. What a static build CAN do is refuse to let the two namespaces overlap,
 * which is the condition that made the bug possible.
 */
function classCollisionAudit() {
    const bad = [];
    // Both output directories. Reading only OUT would have left the entire third
    // page family unchecked by this gate while it still reported a pass.
    const files = [OUT, path.join(ROOT, 'public', 'changelog')]
        .filter(d => fs.existsSync(d))
        .flatMap(d => fs.readdirSync(d).filter(n => n.endsWith('.html')).map(n => path.join(d, n)));
    for (const full of files) {
        const f = path.relative(path.join(ROOT, 'public'), full);
        const html = fs.readFileSync(full, 'utf8');
        const grab = re => {
            const set = new Set();
            for (const m of html.matchAll(re)) {
                m[1].trim().split(/\s+/).filter(Boolean).forEach(c => set.add(c));
            }
            return set;
        };
        const layout = grab(/<(?:div|aside|main|section|nav|footer|header)\b[^>]*\sclass="([^"]+)"/g);
        const content = grab(/<(?:pre|code|table|blockquote)\b[^>]*\sclass="([^"]+)"/g);
        for (const c of content) {
            if (layout.has(c)) {
                bad.push(`${f}: "${c}" is used by BOTH a layout container and a `
                    + 'content block — one stylesheet, so their rules apply to each other');
            }
        }
    }
    if (bad.length) {
        console.error('\n  ✗ class-name collisions:');
        bad.forEach(b => console.error(`      ${b}`));
        return false;
    }
    console.log('  ✓ no layout/content class-name collisions');
    return true;
}

function warmStructAudit(results) {
    const bad = [];
    for (const [out, spec] of Object.entries(WARM_STRUCT)) {
        const hits = results[out];
        if (!hits) { bad.push(`${out}: page was never composed`); continue; }
        const want = new Set(Object.values(spec.sections));
        if (spec.slip) want.add('slip');
        want.add('sig');
        for (const t of want) {
            if (!hits[t]) {
                bad.push(`${out}: treatment "${t}" matched nothing — `
                    + 'a source heading or marker was renamed, so this section '
                    + 'silently rendered as plain prose');
            }
        }
    }
    if (bad.length) {
        console.error('\n  ✗ warm-page structure:');
        bad.forEach(b => console.error(`      ${b}`));
        return false;
    }
    const n = Object.values(results).reduce(
        (a, h) => a + Object.values(h).reduce((x, y) => x + y, 0), 0);
    console.log(`  ✓ warm structure: ${n} treatment(s) applied across `
        + `${Object.keys(WARM_STRUCT).length} page(s)`);
    return true;
}

// Copy button + spine reveal. Both degrade to a fully usable page with no JS at
// all: the slip line is selectable text on its own, and a spine node is styled
// visible by default — .on only brightens it.
const WARM_JS = `
(function(){
  /* EVERY copy control, not just the first. This was a single querySelector, so
     adding buttons to the code blocks would have left all but one of them inert —
     a control that looks live and silently does nothing. */
  Array.prototype.forEach.call(document.querySelectorAll('.cpy'),function(b){
    if(!navigator.clipboard){ b.parentNode.removeChild(b); return; }
    var t=b.querySelector('.cpy-t');
    var s=b.parentNode.querySelector('.cpy-s');
    b.addEventListener('click',function(){
      var el=document.getElementById(b.getAttribute('data-copy'));
      if(!el)return;
      navigator.clipboard.writeText(el.textContent.trim()).then(function(){
        b.setAttribute('data-done','');if(t)t.textContent='Copied';
        if(s)s.textContent='Copied to clipboard';
        setTimeout(function(){b.removeAttribute('data-done');if(t)t.textContent='Copy';
          if(s)s.textContent='';},2400);
      });
    });
  });
  var secs=document.querySelectorAll('.spine .sec');
  if(!secs.length)return;
  var on=function(el){el.classList.add('on')};
  if(!('IntersectionObserver' in window)||
     matchMedia('(prefers-reduced-motion:reduce)').matches){
    Array.prototype.forEach.call(secs,on);return;
  }
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting){on(e.target);io.unobserve(e.target)}})
  },{rootMargin:'0px 0px -18% 0px'});
  Array.prototype.forEach.call(secs,function(s){io.observe(s)});
})();`;

/* ────────────────────────── the fluid morph, client side ────────────────── */

/**
 * Four surfaces, one script, emitted on every page.
 *
 * Each module SELECTS ITSELF out of the DOM rather than being switched on by the
 * template, so nothing has to remember which page carries which surface: the
 * reveal's mark and the landing rows exist only on the landing page, the
 * back-to-top only on the document and chronicle pages, and the cursor everywhere.
 * A module whose element is absent returns immediately and costs one querySelector.
 *
 * ⚠️ THE BACK-TO-TOP MODULE OWNS `.on` NOW. Both host scripts used to toggle it
 * from their own scroll handler; that has been removed in both, because two
 * handlers writing the same class would fight over every frame of a birth. What
 * stays in the hosts is the ring's stroke offset and the --lift that parks the
 * button above the footer — position and progress, not state, and each has exactly
 * one writer.
 *
 * ⚠️ NO REGULAR EXPRESSIONS IN HERE, DELIBERATELY. This code lives inside a JS
 * template literal, so a backslash is consumed by the generator before a browser
 * ever sees it: `\\(` written here reaches the page as `(`, which turns an escaped
 * literal paren into a capture group. That changes a regex's MEANING without
 * changing its syntax, so scriptSyntaxAudit() — which only parses — could not
 * catch it. Colour parsing is hand-scanned instead; it is a dozen lines and cannot
 * fail that way.
 *
 * The design record for every constant here, and the dead ends behind them, is in
 * docs/db-deferred-list.md and the reference_goo_metaball_recipe memory.
 */
const MORPH_JS = `
(function(){
  var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  var fine=matchMedia('(hover:hover) and (pointer:fine)').matches;

  function el(t,c){var n=document.createElement(t);if(c)n.className=c;return n;}
  function rnd(a,b){return a+Math.random()*(b-a);}
  function cl01(x){return x<0?0:x>1?1:x;}
  function ease(x,k){return 1-Math.pow(1-cl01(x),k);}
  function scrollY_(){return window.scrollY||document.documentElement.scrollTop||0;}

  /* every run of digits in a string, in order — enough to read rgb()/rgba() */
  function nums(s){
    var out=[],cur='',i,ch;
    for(i=0;i<s.length;i++){
      ch=s.charAt(i);
      if((ch>='0'&&ch<='9')||ch==='.')cur+=ch;
      else if(cur){out.push(parseFloat(cur));cur='';}
    }
    if(cur)out.push(parseFloat(cur));
    return out;
  }
  function parseCol(c){
    c=(c||'').trim();
    if(!c)return null;
    if(c.charAt(0)==='#'){
      var h=c.slice(1);
      if(h.length===3)h=h.charAt(0)+h.charAt(0)+h.charAt(1)+h.charAt(1)
                       +h.charAt(2)+h.charAt(2);
      if(h.length<6)return null;
      return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),
              parseInt(h.slice(4,6),16)];
    }
    if(c.indexOf('rgb')===0){
      var q=nums(c.slice(c.indexOf('(')+1));
      if(q.length<3)return null;
      return [q[0],q[1],q[2]];
    }
    return null;
  }
  /* a colour that actually paints — 'transparent' and a zero alpha both fail */
  function opaque(c){
    c=(c||'').trim();
    if(!c||c==='transparent')return false;
    var q=nums(c.indexOf('(')>=0?c.slice(c.indexOf('(')+1):'');
    if(q.length>3&&q[3]===0)return false;
    return !!parseCol(c);
  }
  function mix(a,b,t){
    var x=parseCol(a),y=parseCol(b);
    if(!x||!y)return b;
    return 'rgb('+Math.round(x[0]+(y[0]-x[0])*t)+','
                 +Math.round(x[1]+(y[1]-x[1])*t)+','
                 +Math.round(x[2]+(y[2]-x[2])*t)+')';
  }
  function lum(c){
    var q=parseCol(c);
    if(!q)return null;
    var l=[],i,v;
    for(i=0;i<3;i++){
      v=q[i]/255;
      l.push(v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4));
    }
    return 0.2126*l[0]+0.7152*l[1]+0.0722*l[2];
  }
  /* nearest ancestor that actually paints, so a colour can be judged against the
     ground it will be seen on rather than against an assumption about the theme */
  function groundOf(node){
    for(var n=node;n&&n!==document;n=n.parentElement){
      var c=getComputedStyle(n).backgroundColor;
      if(opaque(c))return c;
    }
    return '#0F0D14';
  }

  /* ══ 1 · the reveal's mark ══════════════════════════════════════════════
     The mark wakes, deforms in place and sleeps. It is a control's indicator,
     not the source of a liquid: an earlier design had it pour into the panel
     below and the whole spill apparatus was abandoned after four rounds. */
  (function(){
    var det=document.querySelector('.rev');
    if(!det)return;
    var sum=det.querySelector('summary');
    var slot=det.querySelector('.rv-i');
    if(!sum||!slot)return;

    /* The label swap runs on EVERY pointer type and under reduced motion, because
       it is information rather than decoration: "Reveal" is what the control does
       while shut, and once the address is on screen the only thing left to do is
       put it away. The strike-through on the question is pure CSS for the same
       reason. Both degrade correctly with JS off — the <details> still opens, and
       a statutory contact route may not depend on scripting (PRIVACY 13). */
    var actionLabel=det.querySelector('.rv-a');
    function syncLabel(){
      if(actionLabel)actionLabel.textContent=det.open?'Hide':'Reveal';
    }
    syncLabel();
    det.addEventListener('toggle',syncLabel);

    /* ⚠️ DESKTOP ONLY, AND THE FILTER IS WHY. The buds merging with the core is
       the one thing on this surface that genuinely needs the SVG crush, and an
       SVG filter renders a swarm as hard circles on iOS. So touch keeps the
       site's original sliding fill, which is a complete treatment in its own
       right rather than a degraded one. */
    if(!fine||reduce)return;

    det.classList.add('rv-anim');
    var host=det.parentElement||det;
    host.classList.add('rv-host');
    var goo=el('span','rv-goo');
    goo.setAttribute('aria-hidden','true');
    var mark=el('span','rv-m');
    goo.appendChild(mark);
    /* the crisp resting pill — see .rv-plate in the stylesheet for why the filter
       cannot draw this one, and outside .rv-goo so it stays unfiltered */
    var plate=el('span','rv-plate');
    plate.setAttribute('aria-hidden','true');

    var MK_W=14,MK_H=6.5,BUDMAX=6,BUD_R=3.4;
    var buds=[],bi,bn;
    for(bi=0;bi<3;bi++){
      bn=el('span','rv-bud');
      goo.appendChild(bn);
      buds.push({n:bn,ph:rnd(0,6.28),sp:rnd(1.1,1.9),orb:rnd(1.7,2.7),
                 dir:bi%2?1:-1,r0:rnd(1.5,3.5),r1:rnd(1.6,3.2),rj:rnd(0.85,1.15)});
    }
    host.insertBefore(goo,det);
    host.insertBefore(plate,det);

    var aliveT=0,hovering=false,raf=0;
    function aliveWanted(){return hovering||det.open;}

    function draw(now){
      var tsec=now/1000;
      var R=host.getBoundingClientRect(),S=slot.getBoundingClientRect();
      goo.style.width=R.width+'px';
      goo.style.height=R.height+'px';
      var cxp=S.left-R.left+S.width/2;
      var cys=S.top-R.top+S.height/2;

      var mW=MK_W*(1+0.07*aliveT*Math.sin(tsec*1.90+0.7));
      var mH=MK_H*(1+0.14*aliveT*Math.sin(tsec*2.70));
      mark.style.width=mW.toFixed(2)+'px';
      mark.style.height=mH.toFixed(2)+'px';

      /* ⚠️ 0.85 + c*0.21 SPANS 0.85-2.32 rad/s, WHICH IS THE LIQUID CURSOR'S OWN
         BAND — its masses pulse at 1.1-2.3 and orbit at 0.9-3.2, and matching the
         cursor is what this was asked for. Every alternative below was BUILT and
         compared against it live on 2026-08-03 13:49 EDT, and this one was kept;
         the table is therefore evidence for the current value, not a menu of
         pending options. The whole reason these coefficients are written down
         rather than tuned by eye is that the mean shape-change per 0.14s across
         the eight radii is a real, reproducible number:

             0.39 + c*0.12   1.88   flat — eight near-identical rotating ovals
             0.55 + c*0.17   2.62   the v11 band
             0.70 + c*0.19   3.13   the midpoint between the two ends
             0.85 + c*0.21   3.65   SHIPPED
             1.05 + c*0.26   4.19
             1.30 + c*0.32   6.11   frantic

         The topological events — a lobe separating with a visible neck, a pinched
         two-lobed hourglass — come from THIS LINE and not from the buds, because
         it is opposing corners hitting their extremes that pinches the outline.
         Below roughly the v11 band they stop happening within a glance.

         ⚠️ AND THE REST STATE IS A PILL, NOT AN OVAL. Every other control on the
         site is a stadium (border-radius:999px on .ghb and .ins), and a lone
         ellipse read as a different vocabulary. A stadium is not "50% everywhere":
         it is a corner radius of HALF THE HEIGHT in both axes, which as a
         percentage of a 14x6.5 box is 23.2% horizontally and 50% vertically — so
         the two halves of the eight-value string need different rest values, and
         they are derived from the live box rather than hardcoded so the mark stays
         a true stadium while it breathes. The awake target is unchanged; only what
         it eases FROM has moved, which is why the rate figures above still hold. */
      var pillH=(mH/2)/mW*100;      // a stadium's cap radius, as a % of the width
      var rr8='',c8,w8,rest;
      for(c8=0;c8<8;c8++){
        rest=c8<4?pillH:50;         // first four are horizontal radii, last four vertical
        w8=50+26*Math.sin(tsec*(0.85+c8*0.21)+c8*2.1);
        rr8+=(rest+(w8-rest)*aliveT).toFixed(1)+'%'+(c8===3?' / ':c8===7?'':' ');
      }
      mark.style.borderRadius=rr8;

      /* ── the handover ────────────────────────────────────────────────────
         The crisp plate owns the rest state and the filtered mark owns every
         awake one, crossfading over the first fifth of the wake so the pill is
         seen to break apart rather than to be swapped out. Quick on purpose: the
         two are the same colour and nearly the same size, so a slow dissolve just
         reads as the edge going soft.
         ⚠️ visibility, not opacity alone, while the goo is idle. A filtered
         element still allocates its filter REGION at opacity 0, and that region
         is what once showed as a stray disc parked behind a control. */
      var hand=Math.min(1,aliveT*5);
      plate.style.width=MK_W.toFixed(2)+'px';
      plate.style.height=MK_H.toFixed(2)+'px';
      plate.style.transform='translate('+(cxp-MK_W/2).toFixed(2)+'px,'
        +(cys-MK_H/2).toFixed(2)+'px)';
      plate.style.opacity=(1-hand).toFixed(3);
      goo.style.opacity=hand.toFixed(3);
      goo.style.visibility=hand<0.004?'hidden':'visible';

      var tilt=8*aliveT*Math.sin(tsec*0.90+1.3);
      mark.style.transform='translate('+(cxp-mW/2).toFixed(2)+'px,'
        +(cys-mH/2).toFixed(2)+'px) rotate('+tilt.toFixed(2)+'deg)';

      /* The buds ORBIT rather than shuttle: each walks a continuous ellipse at its
         own rate and direction, so a neck thins somewhere unpredictable and
         re-merges somewhere else. Deriving the orbit rate from the radius clock
         gave ~0.86 rad/s and looked static, so it is its own constant.
         At aliveT 0 the radius goes to 0, which puts them under the crush's paint
         floor — they stop being drawn rather than fading out. */
      for(var i=0;i<buds.length;i++){
        var bd=buds[i],bph=tsec*bd.sp+bd.ph;
        var ang=bd.dir*tsec*bd.orb+bd.ph;
        var rad=bd.r0+bd.r1*Math.sin(bph*1.3);
        var br=BUD_R*bd.rj*aliveT*(0.68+0.5*(0.5+0.5*Math.sin(bph*0.8+1.1)));
        var bxo=cxp+Math.cos(ang)*(mW*0.40+rad);
        var byo=cys+Math.sin(ang)*(mH*0.95+rad*0.8);
        bd.n.style.transform='translate('+(bxo-BUDMAX).toFixed(2)+'px,'
          +(byo-BUDMAX).toFixed(2)+'px) scale('+(br/BUDMAX).toFixed(3)+')';
      }
    }

    function loop(now){
      var want=aliveWanted()?1:0;
      aliveT+=(want-aliveT)*0.12;
      if(Math.abs(want-aliveT)<0.004)aliveT=want;
      draw(now);
      if(aliveT>0.002)raf=requestAnimationFrame(loop);
      else{raf=0;draw(now);}
    }
    function kick(){if(!raf)raf=requestAnimationFrame(loop);}
    function setHover(h){hovering=h;kick();}
    sum.addEventListener('pointerenter',function(){setHover(true);});
    sum.addEventListener('pointerleave',function(){setHover(false);});
    sum.addEventListener('focus',function(){setHover(true);});
    sum.addEventListener('blur',function(){setHover(false);});
    det.addEventListener('toggle',kick);
    addEventListener('resize',function(){draw(performance.now());});
    draw(performance.now());
    if(aliveWanted())kick();
  })();

  /* ══ 2 · the liquid cursor ══════════════════════════════════════════════ */
  (function(){
    if(!fine||reduce)return;

    var BOX=220,HALF=BOX/2;
    var ink=el('div','cur-ink');
    ink.setAttribute('aria-hidden','true');

    /* Seven masses. lag 0 is the tip you actually point with; the rest trail, so
       the body smears into a teardrop when you move and gathers when you stop.
       orb/w give each one a slow orbit at its own rate and direction, which is
       what stops the silhouette repeating — a single circle read as dead. */
    var spec=[
      {R:5.6,lag:0.00,orb:1.8,w:0.9,k:0.62},
      {R:5.0,lag:0.09,orb:3.4,w:-1.3,k:0.52},
      {R:4.3,lag:0.19,orb:4.6,w:1.7,k:0.44},
      {R:3.7,lag:0.32,orb:4.0,w:-2.2,k:0.36},
      {R:3.1,lag:0.62,orb:2.8,w:2.7,k:0.22},
      {R:2.6,lag:0.86,orb:1.9,w:-3.2,k:0.16},
      {R:2.2,lag:1.10,orb:1.4,w:2.3,k:0.12}
    ];
    var parts=[],si,dot;
    for(si=0;si<spec.length;si++){
      dot=el('span','cur-d');
      dot.style.width=(spec[si].R*2).toFixed(1)+'px';
      dot.style.height=(spec[si].R*2).toFixed(1)+'px';
      dot.style.marginLeft=(-spec[si].R).toFixed(1)+'px';
      dot.style.marginTop=(-spec[si].R).toFixed(1)+'px';
      ink.appendChild(dot);
      parts.push({n:dot,s:spec[si],x:0,y:0,ph:rnd(0,6.28),os:rnd(1.1,2.3),ba:0,bd:0});
    }
    document.body.appendChild(ink);

    var cx=0,cy=0,seeded=false,on=true;
    var cen={x:0,y:0,px:0,py:0};
    var raf=0,hitT=0,lastHost=null;
    /* ⚠️ THE CRUSH DOES THE DESTROYING. At the apex a trailing mass is scaled to
       about a third of its radius, which puts it under the ~4.5px paint floor
       measured for this filter — so it genuinely stops being painted rather than
       fading, then is drawn back in as the parts return and re-merge. */
    var BURST=620,burstAt=-1e9;
    var sx=1,sy=1,spread=1,tsx=1,tsy=1,tspread=1;
    var beam=0,tbeam=0;   /* 0 = blob, 1 = fully a text caret */
    var lineH=20;         /* the line box under the pointer, from onGlyphs() */
    /* ⚠️ THE SEVEN MASSES ARE DELIBERATELY UNEQUAL — 5.6 down to 2.2 — because a
       teardrop needs a heavy head and a thin tail. Stacked into a caret that
       taper becomes a defect: the small masses at one end erode away under the
       crush and the bar hangs off-centre, which is exactly how it rasterised.
       So text mode eases every mass toward ONE radius; the swarm keeps its
       tapered silhouette everywhere else.
       ⚠️ THAT RADIUS IS SET BY THE PAINT FLOOR, NOT BY THE MEAN. Easing to the
       mean (3.79) was tried and rasterised as a short lozenge again: at 0.46 of
       horizontal scale a 3.79 mass paints 3.5px wide, under the ~4.5px floor
       this filter thresholds at, so the crush ate the whole stack. 6.0 paints
       ~5.5px and survives, which is what makes the bar continuous. Re-measure
       it if stdDeviation on #dbgoo-p or the crush matrix changes. */
    var RBEAM=6.2;

    var baseCol=(getComputedStyle(document.body)
                  .getPropertyValue('--accent')||'').trim()||'#F2994A';
    var tgtCol=baseCol,curCol=baseCol,wroteCol='';

    /* ⚠️ NOT EVERY SURFACE ANNOUNCES ITSELF THE SAME WAY, and assuming --accent
       was the whole story left two surfaces flat. Measured on the live page: the
       landing rows scope --accent (and custom properties inherit, so the computed
       value under the pointer is already the nearest one); the .inv tickets scope
       --ia instead and leave --accent at the page value; and the GitHub button
       scopes no variable at all, its identity being its own color.
       So the chain runs most-local-first, and the --accent step compares against
       the PAGE value rather than merely reading it — equal means nothing in scope
       has overridden it, which is what separates a row from open prose. */
    function accentOf(e){
      var cs=getComputedStyle(e);
      var ia=cs.getPropertyValue('--ia').trim();
      if(ia)return ia;
      var ac=cs.getPropertyValue('--accent').trim();
      if(ac&&ac!==baseCol)return ac;
      /* ⚠️ ONLY BORROW THE INK OF A CONTROL THAT PAINTS ITS OWN CHIP. This step
         exists for the GitHub capsule, whose identity really is its color. But a
         landing row and the reveal's <summary> match the same selector list and
         their color is the body text ramp, so borrowing it turned the swarm
         near-white over "Terms" and over "Prefer email?". Judging by COLOUR cannot
         separate those cases — both wanted and unwanted are --ink-family. Judging
         by whether the element draws a box can: a chip has an edge, a text surface
         does not. Row 01 proves the guard is needed at all, because its scoped
         --accent EQUALS the page accent and so falls through to here. */
      var h=e.closest('a,button,summary,[role="button"]');
      if(h){
        var hs=getComputedStyle(h),c=hs.color;
        var chip=(parseFloat(hs.borderTopWidth)>0&&opaque(hs.borderTopColor))
              ||opaque(hs.backgroundColor);
        /* the chip's OWN fill is the ground the swarm will be seen against; a
           chip identified only by its border has none, so fall back to the page */
        var seat=opaque(hs.backgroundColor)?hs.backgroundColor:groundOf(h);
        if(c&&chip&&legible(c,seat))return c;
      }
      return ac||baseCol;
    }
    /* ⚠️ A CONTROL'S OWN color IS NOT ALWAYS WORTH WEARING. The back-to-top
       computes to black — its ring paints from --accent, but the element's color
       is rgb(0,0,0) — so the step above once handed the swarm black and it
       disappeared into the page on hover. Rejecting on CONTRAST against the page
       ground rather than on darkness keeps that right in both themes: a near-white
       candidate on light paper fails the same test. Everything wanted passes
       comfortably (the GitHub lavender-grey 7.3:1, the darkest row accent 5.7:1);
       black is 1.16:1. */
    /* ⚠️ JUDGED AGAINST THE SURFACE IT WILL SIT ON, NOT AGAINST THE PAGE, and
       that correction is what makes the Install button behave the same way in
       both themes (changed 2026-08-03 15:57 EDT).
       .ins is color:#141021 on background:var(--accent) in BOTH themes. Tested
       against the PAGE ground, that near-black passed on light paper and failed
       at 1.16:1 on the dark page — so the swarm went dark over the button in
       light mode and fell back to the page accent in dark mode, which is orange
       on orange and all but invisible. Harkirat saw the light-mode version,
       liked it, and asked for it in dark mode; it was never a light-mode
       flourish, it was this test asking about the wrong background.
       The swarm is drawn ON the chip, so the chip's own fill is the ground that
       decides whether its ink is legible. #141021 on amber clears comfortably in
       either theme, so the dark blob is now the behaviour in both.
       ⚠️ The back-to-top — the case this test was built for — is untouched, and
       MEASURED so rather than argued: the swarm stays at the page accent over it
       in both themes. The reason is not this test at all, which is worth writing
       down because the obvious explanation is wrong. Its background computes to
       color(srgb 0.11 0.10 0.15 / 0.9), and parseCol() reads # and rgb() only,
       so opaque() is false, so it never counts as a chip and never reaches the
       colour-borrowing branch. Any control whose background is a color-mix()
       lands the same way, because Chrome serialises those as color(srgb …).
       Teaching parseCol() that syntax is therefore NOT a tidy-up — it would make
       those controls chips for the first time and hand the swarm their ink.
       A chip with no opaque fill of its own falls back to the page ground. */
    function legible(c,ground){
      var a=lum(c),b=lum(ground||groundOf(document.body));
      if(a==null||b==null)return true;
      return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05)>=1.6;
    }
    /* ⚠️ THE FORM IS THE AFFORDANCE. A cursor that replaces the arrow has to say
       what the arrow said: an I-beam over prose, a wider softer halo over anything
       pressable. Doing it by squashing the same body keeps it one creature rather
       than a set of swapped icons. */
    function shapeFor(m){
      /* ⚠️ THE BEAM IS A CARET, AND A CARET'S JOB IS TO SAY WHICH LETTER.
         Three separate faults were reported together on 2026-08-03 16:40 EDT —
         it nearly vanished on click, it breathed too hard, and it was hard to
         tell where the selection would start — and only the second is about
         breathing. They are fixed by the eased 0-1 'beam', which says how far
         into text mode the swarm is, applied in tick() to the LAG, the
         breathing and the click burst. See each site there.
         The targets here only do the shape: thinner and taller, because a
         caret's precision is horizontal and its legibility is vertical. */
      if(m==='text'){tsx=0.39;tsy=0.50;tspread=0.30;}
      else if(m==='link'){tsx=1.5;tsy=1.5;tspread=1.9;}
      else{tsx=1;tsy=1;tspread=1;}
      tbeam=(m==='text')?1:0;
      ink.classList.toggle('soft',m==='text');
    }
    /* ⚠️ ONE elementFromPoint SERVES BOTH QUESTIONS — it is a hit test, cheap but
       not free, and the shape and the colour both want the same element. */
    /* ⚠️ A PARAGRAPH'S BOX IS NOT ITS TEXT, and treating them as the same thing
       is what put the I-beam on half the page. A <p> is a block: it spans the
       full measure, so its box covers the ragged right of every line and the
       whole width below the last one. closest('p') therefore said "text" while
       the pointer sat in open space several centimetres from a glyph — reported
       2026-08-03 16:21 EDT with a screenshot of exactly that.
       The caret is the honest test. caretRangeFromPoint snaps to the nearest
       insertion point, so its rect sits AT the end of a short line while the
       pointer is out in the margin; requiring the pointer to be within a glyph's
       width of it turns "inside the block" into "on the writing". 14px is about
       one character at body size, which keeps the beam from flickering off in
       the gaps between words. */
    function onGlyphs(x,y){
      var r=null,rg,cp;
      if(document.caretRangeFromPoint){
        rg=document.caretRangeFromPoint(x,y);
        if(rg)r=rg.getBoundingClientRect();
      }else if(document.caretPositionFromPoint){
        cp=document.caretPositionFromPoint(x,y);
        if(cp&&cp.offsetNode){
          rg=document.createRange();
          rg.setStart(cp.offsetNode,cp.offset);
          rg.collapse(true);
          r=rg.getBoundingClientRect();
        }
      }
      /* No caret API, or a caret with no box: fall back to the old behaviour
         rather than losing the I-beam entirely. */
      if(!r)return true;
      if(!r.width&&!r.height)return true;
      /* the caret rect is the LINE BOX, so this is the height the beam should
         be — measured off the text it is actually over, not assumed */
      if(r.height>6&&r.height<80)lineH=r.height;
      return x>=r.left-14&&x<=r.right+14&&y>=r.top-3&&y<=r.bottom+3;
    }
    function probe(){
      var e=document.elementFromPoint(cx,cy);
      if(!e)return;
      shapeFor(
        e.closest('a,button,summary,[role="button"],input,select,textarea,label')?'link'
        :(e.closest('p,li,h1,h2,h3,h4,td,blockquote,code,.lede,.disc,dd,dt')
          &&onGlyphs(cx,cy))?'text':'idle');
      /* ⚠️ RESOLVE ONCE PER SURFACE, NOT ONCE PER SAMPLE. .ghb transitions its own
         color over 220ms on hover, so sampling every 90ms walked the swarm up that
         ramp (a white flash) and then dropped it. Latching on the surface reads the
         colour once on arrival and holds it. */
      var h=e.closest('.inv,.entry,a,button,summary,[role="button"]')||document.body;
      if(h===lastHost)return;
      lastHost=h;
      var v=accentOf(e);
      if(v)tgtCol=v;
    }

    function tick(now){
      var t=now/1000;
      /* VIEWPORT COORDINATES, and the layer is position:fixed. Positioning it in
         the document and adding scrollY is only correct when the document itself
         is the scroller; a pointer lives in viewport space, so there is no scroll
         term left to get wrong. */
      cen.x+=(cx-cen.x)*0.62;
      cen.y+=(cy-cen.y)*0.62;
      var dvx=cen.x-cen.px,dvy=cen.y-cen.py;
      cen.px=cen.x;cen.py=cen.y;
      var sp=Math.min(1,Math.sqrt(dvx*dvx+dvy*dvy)/24);

      if(now-hitT>90){hitT=now;probe();}
      sx+=(tsx-sx)*0.16;sy+=(tsy-sy)*0.16;
      spread+=(tspread-spread)*0.16;
      beam+=(tbeam-beam)*0.16;
      /* Eased per frame rather than by a CSS transition: the target changes every
         time the pointer crosses a boundary, and a transition would restart from
         wherever it had reached and stutter. mix() rounds to whole channels, so
         the write stops by itself once it has arrived. */
      curCol=mix(curCol,tgtCol,0.09);
      if(curCol!==wroteCol){ink.style.color=curCol;wroteCol=curCol;}

      var ox=cen.x-HALF,oy=cen.y-HALF;
      ink.style.transform='translate('+ox.toFixed(1)+'px,'+oy.toFixed(1)+'px)';

      for(var i=0;i<parts.length;i++){
        var p=parts[i],s=p.s;
        var ang=p.ph+t*s.w;
        /* the orbit itself is squashed by the shape, so becoming an I-beam is a
           deformation of the same cluster rather than a different object */
        var gx=Math.cos(ang)*s.orb*spread*sx*(1-0.45*sp);
        var gy=Math.sin(ang)*s.orb*spread*sy*(1-0.45*sp);
        /* ⚠️ THE LAG IS WHY IT WAS HARD TO AIM. Seven masses trailing the
           pointer put the swarm's visible centre BEHIND the true position, so
           the thing you were reading as the caret sat a few pixels back from
           the letter it would actually select from. A teardrop wants that
           smear; a caret must not have it, so text mode pulls the trail in to
           a quarter and the masses stack into one bar on the real x. */
        var lagK=8.5*(1-0.76*beam);
        /* ⚠️ AND THE FOLLOW RATES ARE EQUALISED TOO. Symmetry alone is not
           enough: the masses lerp at their own k, 0.62 down to 0.12, so the
           outer ones would still arrive late and the bar would flex like a
           whip on every move. In text mode they converge on one rate and the
           caret travels as a single object. */
        var kk=s.k+beam*(0.46-s.k);
        /* ⚠️ THE CARET IS A STACK OF MASSES, NOT ONE SQUASHED ELLIPSE, and that
           is the whole difference. Squashing the cluster to 0.24 wide and 2.85
           tall looked right in the numbers and rasterised as a SHORT LOZENGE
           about an x-height long: a Gaussian erodes a curve in proportion to
           its curvature, so a thin tall ellipse loses its ends first and the
           alpha crush then thresholds them away. Making it thinner made it
           shorter — the same anisotropy the nav pill's dilation table records,
           running the other way.
           So the masses are spread along Y instead and left round enough to
           survive on their own. The crush merges them into one continuous bar,
           which is what the filter is FOR, and the bar cannot be eroded from
           the ends because there is another mass there. Its length is the line
           box measured under the pointer, so the caret matches the text it is
           sitting in rather than a constant. */
        /* ⚠️ THE STACK IS ORDERED FROM THE CENTRE OUT, NOT TOP TO BOTTOM.
           Laid out by raw index it put mass 0 — lag 0, the one that tracks the
           pointer instantly — at the TOP, and mass 6 — lag 1.10, the slowest —
           at the bottom. The bar was therefore pinned by its top edge with its
           bottom dragging behind, reported exactly that way. Ordering by
           distance from the middle (0, +1, -1, +2, -2, ...) puts the fastest
           mass at the CENTRE and fans the laggards symmetrically above and
           below, so the thing that stays under the pointer is the middle of the
           caret, which is where the eye reads its position. */
        var half=(parts.length-1)/2;
        var ord=(i%2?1:-1)*Math.ceil(i/2);
        var stack=beam*(ord/Math.max(1,half))*lineH*0.45;
        p.x+=((cen.x+gx-dvx*s.lag*lagK)-p.x)*kk;
        p.y+=((cen.y+gy+stack-dvy*s.lag*lagK)-p.y)*kk;
        /* the breathing is what makes the blob feel alive and what makes the
           caret feel unsteady, so it is damped as the beam forms, not removed */
        var scl=(1+0.17*(1-0.66*beam)*Math.sin(p.ph*2+t*p.os))*(1-0.26*sp*s.lag);
        var bx=0,by=0;
        var bt=(now-burstAt)/BURST;
        if(bt>=0&&bt<1){
          /* ⚠️ THE TIP STAYS. The first burst scaled every mass to a third, which
             put ALL of them under the paint floor — the pointer vanished outright
             mid-drag, which is unusable when the native arrow is hidden. Only the
             trailing masses fly out and evaporate; the tip moves and shrinks a
             little and never leaves the screen. */
          /* ⚠️ THE BURST IS SUPPRESSED IN TEXT MODE. Its whole design is that
             trailing masses fall under the paint floor and stop being drawn —
             correct for a blob, catastrophic for a caret, because a click is
             exactly the moment you need to see where it is. Reported as "it
             nearly disappears upon a click". */
          var out=Math.sin(Math.PI*Math.pow(bt,0.55))*(1-0.82*beam);
          var w=s.lag;
          bx=Math.cos(p.ba)*p.bd*out*(0.18+w);
          by=Math.sin(p.ba)*p.bd*out*(0.18+w);
          /* ⚠️ DAMPED BY beam TOO. Scaling only the travel and the opacity left
             this line at full strength, and it is the one that actually removes
             the caret: measured, the bar still lost half its height on a click
             (20.5px down to 8.9px) while the other two were already suppressed. */
          scl*=1-(0.14+0.5*w)*(1-0.86*beam)*Math.sin(Math.PI*Math.pow(bt,0.8));
          if(w>0.25)p.n.style.opacity=String(1-(0.92-0.74*beam)*out);
        }else if(p.n.style.opacity!==''){p.n.style.opacity='';}
        var eq=1+beam*(RBEAM/s.R-1);
        p.n.style.transform='translate('+(p.x-ox+bx).toFixed(1)+'px,'
          +(p.y-oy+by).toFixed(1)+'px) scale('+(scl*sx*eq).toFixed(3)+','
          +(scl*sy*eq).toFixed(3)+')';
      }

      /* ⚠️ NO IDLE FADE-OUT WHILE THIS IS THE POINTER. An earlier version faded the
         swarm after 2.6s of stillness — harmless when it merely followed the arrow,
         catastrophic now that it replaces it, because cursor:none stays applied and
         holding still would leave no pointer on screen at all. */
      raf=requestAnimationFrame(tick);
    }

    /* ⚠️ THE ARROW IS NOT HIDDEN UNTIL THE SWARM IS ACTUALLY DRAWN. html.liq used
       to go on at load, but .cur-ink only becomes visible on the first pointermove
       — so a reader who had not moved the mouse yet had no arrow AND no swarm. The
       class now goes on at the same moment the masses are seeded. */
    function wake(){
      ink.classList.add('on');
      if(on)document.documentElement.classList.add('liq');
      if(!raf)raf=requestAnimationFrame(tick);
    }
    function sleep(){
      ink.classList.remove('on');
      document.documentElement.classList.remove('liq');
      cancelAnimationFrame(raf);raf=0;
    }
    addEventListener('pointermove',function(ev){
      if(!on||ev.pointerType==='touch')return;
      cx=ev.clientX;cy=ev.clientY;
      if(!seeded){
        seeded=true;
        cen.x=cen.px=cx;cen.y=cen.py=cy;
        for(var i=0;i<parts.length;i++){parts[i].x=cen.x;parts[i].y=cen.y;}
      }
      wake();
    },{passive:true});
    /* no scroll handler at all: in viewport space the pointer does not move when
       the page does, so there is nothing to compensate for */
    addEventListener('pointerdown',function(ev){
      if(!on||ev.pointerType==='touch')return;
      burstAt=performance.now();
      for(var i=0;i<parts.length;i++){
        parts[i].ba=rnd(0,6.283);
        parts[i].bd=rnd(24,62)*(0.6+parts[i].s.lag*0.7);
      }
      wake();
    },{passive:true});
    addEventListener('pointerleave',sleep);
    addEventListener('pointerenter',function(){
      if(on&&seeded)document.documentElement.classList.add('liq');
    });
    /* ⚠️ NO blur HANDLER. One was added so an alt-tab could not strand the page
       without a pointer, and it backfired: any overlay taking focus — a screen
       recorder, devtools, a notification — fires blur while the pointer is still
       over the page, which stripped cursor:none AND cancelled the frame loop.
       visibilitychange covers the case that actually matters. */
    document.addEventListener('visibilitychange',function(){
      if(document.hidden)sleep();
    });
    addEventListener('pagehide',sleep);
  })();

  /* ══ 3 · landing rows and tickets, scroll-linked ════════════════════════
     ⚠️ ON A PHONE THOSE ROWS HAD NO ANIMATION WHATSOEVER, and the reason is
     structural rather than a missing feature: every rule that drives them — the
     wiping bar, the accent wash, the number's colour — sits inside
     (hover:hover), which the build applies MECHANICALLY to every :hover rule on
     the site. That is correct (on touch, :hover latches until you tap elsewhere)
     and it also means nothing there can ever fire. POSITION is the only input a
     phone has, so the same treatment gets a different driver. */
  (function(){
    var wrap=document.querySelector('main.wrap');
    var list=document.querySelector('.list');
    if(!wrap||!list)return;
    var rows=[].slice.call(list.querySelectorAll('.entry'))
      .concat([].slice.call(document.querySelectorAll('.inv')));
    if(!rows.length)return;

    /* Any coarse pointer, and also a narrow window so this is testable without
       reaching for a phone. */
    var mq=matchMedia('(max-width:700px)');
    function wanted(){return !fine||mq.matches;}

    var cur=-1,queued=0,lastY=scrollY_(),dir=1;
    function pick(){
      queued=0;
      if(!wrap.classList.contains('scrolly'))return;
      var y=scrollY_();
      if(Math.abs(y-lastY)>1){dir=y>lastY?1:-1;lastY=y;}
      /* ⚠️ THE LINE LEADS THE SCROLL, and that is what stops it feeling late.
         A fixed line only marks a row once the row has reached it, so on the way
         down the highlight always trails what you are looking at. Offsetting the
         line by a tenth of the viewport in the direction of travel moves it DOWN
         while scrolling down, which is the direction rows arrive from, so a row is
         claimed on approach instead of on arrival — and symmetrically on the way
         back up. 0.46 rather than dead centre because the row being read sits
         above the middle of a phone screen, not on it. */
      var line=innerHeight*(0.46+dir*0.10);
      var best=-1,bestD=1e9,i,r,d;
      for(i=0;i<rows.length;i++){
        r=rows[i].getBoundingClientRect();
        if(r.bottom<8||r.top>innerHeight-8)continue;
        d=Math.abs(r.top+r.height/2-line);
        if(d<bestD){bestD=d;best=i;}
      }
      if(best===cur)return;
      if(cur>=0&&rows[cur])rows[cur].classList.remove('act');
      cur=best;
      if(cur>=0)rows[cur].classList.add('act');
    }
    function onScroll(){if(!queued)queued=requestAnimationFrame(pick);}
    function sync(){
      var want=wanted(),i;
      wrap.classList.toggle('scrolly',want);
      if(!want){
        for(i=0;i<rows.length;i++)rows[i].classList.remove('act');
        cur=-1;
      }else{cur=-1;pick();}
    }
    addEventListener('scroll',onScroll,{passive:true});
    addEventListener('resize',function(){sync();onScroll();},{passive:true});
    if(mq.addEventListener)mq.addEventListener('change',sync);
    sync();
  })();

  /* ══ 4 · back to top, coalescing ════════════════════════════════════════ */
  (function(){
    var tt=document.getElementById('totop');
    if(!tt)return;
    function past(){return scrollY_()>innerHeight*0.6;}

    /* Under reduced motion the shipped behaviour is kept exactly as it was — a
       plain appear/disappear plus the arrow's own fire animation. This branch is
       the whole reason the hosts could hand ownership of .on over: there is
       always exactly one writer, and here it is this one. */
    if(reduce){
      var plain=function(){tt.classList.toggle('on',past());};
      addEventListener('scroll',plain,{passive:true});
      tt.addEventListener('click',function(){
        tt.classList.remove('fire');
        void tt.offsetWidth;
        tt.classList.add('fire');
        scrollTo({top:0,behavior:'auto'});
      });
      tt.addEventListener('animationend',function(){tt.classList.remove('fire');});
      plain();
      return;
    }

    var tink=el('span','tt-ink');
    tink.setAttribute('aria-hidden','true');
    var tgoo=el('span','tt-goo');
    var blob=el('span','tt-blob');
    tgoo.appendChild(blob);
    var TN=16,tds=[],ti,td;
    for(ti=0;ti<TN;ti++){td=el('span','tt-d');tgoo.appendChild(td);tds.push(td);}
    tink.appendChild(tgoo);
    tt.insertBefore(tink,tt.firstChild);
    /* the swarm runs on touch too — only its FILTER is dropped there */
    if(!fine)tt.classList.add('nogoo');

    var born=false,traf=0,busy=false,settling=false,settleT=0;
    function ringRoll(lo,hi){
      var out=[],k;
      for(k=0;k<TN;k++)
        out.push({a:(k/TN)*Math.PI*2+rnd(-0.5,0.5),r:rnd(lo,hi),
                  dl:Math.random()*0.26,sz:rnd(0.6,1.25)});
      return out;
    }
    /* ⚠️ NO BIRTH ON TOUCH, AND ONLY THE BIRTH. The coalescence is the part that
       needs masses to MERGE, and merging needs the filter iOS renders as hard
       circles; the launch reads fine as plain droplets flying apart, so only the
       arrival is dropped and the button simply appears. This is narrower than an
       earlier guard, which skipped both and quietly took the whole effect off
       mobile. */
    function birth(){
      if(!fine){tt.classList.add('on');busy=false;return;}
      busy=true;
      tt.classList.add('on','birth');
      var seat=ringRoll(30,58),dur=rnd(560,760),s0=performance.now();
      cancelAnimationFrame(traf);
      (function frame(now){
        var q=Math.min(1,(now-s0)/dur),i,g,u,rr;
        blob.style.transform='translate(0,0) scale('+ease(q,2.6).toFixed(3)+')';
        for(i=0;i<TN;i++){
          g=seat[i];u=cl01((q-g.dl)/(0.90-g.dl));
          rr=g.r*Math.pow(1-u,2.3);
          tds[i].style.opacity=(u<=0||u>=1)?'0':'1';
          tds[i].style.transform='translate('+(Math.cos(g.a)*rr).toFixed(2)+'px,'
            +(Math.sin(g.a)*rr).toFixed(2)+'px) scale('
            +(g.sz*(0.45+0.55*Math.sin(Math.PI*Math.min(u,1)))).toFixed(3)+')';
        }
        if(q<1)traf=requestAnimationFrame(frame);
        else{
          tt.style.transition='background .14s ease,border-color .14s ease';
          tt.classList.remove('birth');busy=false;
          setTimeout(function(){tt.style.transition='';},200);
        }
      })(s0);
    }
    function launch(){
      if(busy)return;
      busy=true;settling=true;
      clearTimeout(settleT);
      settleT=setTimeout(function(){settling=false;born=false;},2600);
      tt.classList.add('birth');
      var seat=ringRoll(44,96),s0=performance.now();
      cancelAnimationFrame(traf);
      scrollTo({top:0,behavior:'smooth'});
      (function frame(now){
        var q=Math.min(1,(now-s0)/560),i,g,u,rr,k;
        var sq=q<0.18?1+q*0.9:1.16-ease((q-0.18)/0.82,1.8)*1.16;
        blob.style.transform='translate(0,'+(-26*ease(q,2.1)).toFixed(2)
          +'px) scale('+Math.max(0,sq).toFixed(3)+')';
        for(i=0;i<TN;i++){
          g=seat[i];u=cl01((q-g.dl*0.6)/(1-g.dl*0.6));
          rr=g.r*ease(u,1.7);
          tds[i].style.opacity=String(u>=1?0:(1-u*u)*0.95);
          tds[i].style.transform='translate('+(Math.cos(g.a)*rr*0.55).toFixed(2)
            +'px,'+(-Math.abs(Math.sin(g.a))*rr-rr*0.35).toFixed(2)
            +'px) scale('+(g.sz*(1-u*0.75)).toFixed(3)+')';
        }
        if(q<1)traf=requestAnimationFrame(frame);
        else{
          /* ⚠️ ORDER MATTERS, AND THIS IS THE "IT COMES BACK AFTER YOU TAP IT"
             BUG. Measured: on is never re-added after a launch, but the control's
             computed opacity ran 0.91 -> 0.33 -> 0.02 between 604ms and 846ms.
             Removing on and birth in one statement hands the fade to the .totop
             transition, and birth is also what hides the ring and the arrow — so
             for ~300ms after the liquid has flown away the REAL button chrome pops
             back and fades out behind it. It never was a second birth, which is
             why two fixes aimed at the threshold missed it.
             Drop on while birth still applies (.totop.birth carries
             transition:none, so it goes to 0 instantly), flush that state, and
             only then drop birth. */
          tt.classList.remove('on');
          void tt.offsetWidth;
          tt.classList.remove('birth');
          blob.style.transform='scale(0)';
          for(k=0;k<TN;k++)tds[k].style.opacity='0';
          busy=false;
        }
      })(s0);
    }
    addEventListener('scroll',function(){
      if(busy)return;
      /* ⚠️ RE-ARM ON ARRIVAL, NOT ON CROSSING THE LINE. Clearing the flag the
         moment the threshold was no longer passed let a momentum bounce push it
         back over and start a second birth. It re-arms only once the page has
         genuinely reached the top. */
      if(settling){
        tt.classList.remove('on');
        if(scrollY_()<4){settling=false;born=false;clearTimeout(settleT);}
        return;
      }
      var p=past();
      if(p&&!born){born=true;birth();}
      else if(p)tt.classList.add('on');
      else tt.classList.remove('on');
    },{passive:true});
    tt.addEventListener('click',launch);
  })();

  /* ══ 5 · the nav pill's contained mesh ══════════════════════════════════
     A field of blobs living INSIDE the indicator, on the same rhythm as every
     other morph on the site, carrying the mixture of two colours: the liquid
     cursor's (the page's accent, which it keeps everywhere) and the hovered
     tab's (the pill it is standing on). Hover Notice from the Terms page and
     the crimson pointer stirs crimson through the amber pill; hover Privacy
     and it stirs the same crimson through teal.

     ⚠️ THE SWARM'S ALPHA IS HALF THE EFFECT. .cur-ink paints its masses as
     SOLID currentColor at z-index 60, so over the pill it is an opaque blob
     sitting on top of the mesh — the first working version of this was
     invisible for exactly that reason and measured fine the whole time.
     Dropping the layer's opacity while it is over the bar lets the pill through
     it, so what you see under the pointer is the two colours composited. This
     module writes ONLY opacity on that element and only while over the bar,
     and clears it on the way out; module 2 keeps colour and transform, so the
     two never write the same property.

     ⚠️ mix-blend-mode ON .cur-ink DOES NOT WORK AND IS NOT THE ANSWER. The
     property applies — computed style reads back 'screen' — and the painted
     result is unchanged: over the violet pill the swarm core stayed at
     rgb(212,78,99) where a working screen gives rgb(237,146,236), which is the
     signature of blending against black rather than against the pill. It is not
     the filter, the opacity, the nesting or the transform; hand-built probes
     carrying each of those, and all of them at once, blended correctly against
     the same pill in the same frame. If you try it again, MEASURE THE PAINTED
     PIXEL — the computed style will tell you it is on while the screen shows it
     doing nothing.

     ⚠️ THE LAYERS COMPOSITE WITH PLAIN ALPHA, NOT background-blend-mode:screen.
     Five screened layers pile up to a near-white core, and white is the one
     thing this must not be — the point is that two ACCENTS are mixing. Under
     plain alpha the ceiling of the field is the mixture itself, so no amount of
     overlap can leave the pill↔cursor range.

     ⚠️ Label contrast is SAFER than the flat pill, not riskier, and that was
     checked rather than assumed: across all nine accents as page × all nine as
     tab, the strongest blob's worst contrast against the label is 6.25:1, where
     the shipped flat pills bottom out at 5.07:1. Relative luminance is monotonic
     along a linear RGB segment, so the composite between pill and blob is
     bounded by its endpoints and cannot dip below either. Re-run that if the
     mix, the lift or an accent changes.

     ⚠️ The blobs are CLIPPED BY THE PILL FOR FREE — a background paints inside
     the border box and the border box is a 999px stadium. Nothing masks it,
     which is why the field stays inside the shape even while paint() is tearing
     that shape in half. The tail and the head each mix against THEIR OWN fill,
     read from the inline background paint() writes, so mid-move the piece you
     are leaving stirs the old colour and the arriving one stirs the new. */
  (function(){
    if(!fine||reduce)return;
    var segs=[].slice.call(document.querySelectorAll('.seg')).map(function(seg){
      return {ink:seg.querySelector('.seg-ink'),
              pieces:[seg.querySelector('.ib-a'),seg.querySelector('.ib-b')],
              tabs:[].slice.call(seg.querySelectorAll('.tab')),
              mx:0,mx2:0,tx:0,amt:0,hot:null,clean:true};
    }).filter(function(g){return g.ink&&g.pieces[0]&&g.pieces[1]&&g.tabs.length;});
    if(!segs.length)return;

    var BLOBS=5, RX=40, RY=22, ORBIT=20, RATE=1.5, STR=1.5,
        FOLLOW=0.16, MIXV=0.9, LIFT=0.14, SWARM=0.42;

    var curInk=document.querySelector('.cur-ink');
    var page=parseCol(getComputedStyle(document.body).getPropertyValue('--accent'))
             ||[242,153,74];
    segs.forEach(function(g){
      g.hot=parseCol(g.tabs[0].getAttribute('data-accent'))||page;
    });
    function blend(a,b,t){
      return [Math.round(a[0]+(b[0]-a[0])*t),Math.round(a[1]+(b[1]-a[1])*t),
              Math.round(a[2]+(b[2]-a[2])*t)];
    }
    /* Raise HSL lightness, leaving hue and saturation exactly alone. NOT a mix
       toward white, and not a channel multiply either: multiplying by 255/max
       is a no-op on any accent that already has a channel at 255, which is most
       of this palette, so the control did nothing on most of the bar. */
    function lift(c,t){
      if(t<=0)return c;
      var r=c[0]/255,g2=c[1]/255,b=c[2]/255;
      var mx=Math.max(r,g2,b),mn=Math.min(r,g2,b),l=(mx+mn)/2;
      if(mx===mn)return c;
      var d=mx-mn, s=l>0.5?d/(2-mx-mn):d/(mx+mn), h;
      if(mx===r)h=(g2-b)/d+(g2<b?6:0); else if(mx===g2)h=(b-r)/d+2; else h=(r-g2)/d+4;
      h/=6;
      l=Math.min(1,l+t*(1-l));
      var q=l<0.5?l*(1+s):l+s-l*s, p=2*l-q;
      function ch(x){
        if(x<0)x+=1; if(x>1)x-=1;
        if(x<1/6)return p+(q-p)*6*x;
        if(x<1/2)return q;
        if(x<2/3)return p+(q-p)*(2/3-x)*6;
        return p;
      }
      return [Math.round(ch(h+1/3)*255),Math.round(ch(h)*255),Math.round(ch(h-1/3)*255)];
    }
    function field(g,piece,t){
      var r=piece.getBoundingClientRect();
      if(r.width<1.5)return '';
      var pill=parseCol(piece.style.backgroundColor)||g.hot;
      var cur=(curInk&&parseCol(curInk.style.color))||page;
      var h=r.height||25, out='', i;
      for(i=0;i<BLOBS;i++){
        var rate=0.85+i*0.21, ph=i*2.1;
        /* odd blobs hang off the LAGGING follower, so the field stretches when
           the pointer moves and gathers when it stops */
        var base=(i%2)?(g.mx2-r.left):(g.mx-r.left);
        var ox=Math.cos(t*rate+ph)*ORBIT*(0.62+0.38*Math.sin(t*0.53+i));
        var oy=Math.sin(t*rate*0.71+ph)*h*0.19;
        var rx=RX*(0.48+0.52*((i%3)/2))*(1+0.30*Math.sin(t*(0.9+i*0.17)+ph));
        var ry=RY*(1+0.24*Math.sin(t*(1.1+i*0.13)+ph));
        var c=lift(blend(pill,cur,MIXV*(0.5+0.5*((i%3)/2))),LIFT*((i%2)?1:0.45));
        var a=STR*g.amt*(0.62-i*0.05);
        if(a<0)a=0;
        /* rgba(c,0), never 'transparent' — that is rgba(0,0,0,0), so an sRGB
           ramp to it runs through black and every blob gets a dirty edge */
        out+=(i?',':'')+'radial-gradient('+rx.toFixed(1)+'px '+ry.toFixed(1)+'px at '
          +(base+ox).toFixed(1)+'px '+(h/2+oy).toFixed(1)+'px,rgba('+c+','+a.toFixed(3)
          +') 0%,rgba('+c+','+(a*0.46).toFixed(3)+') 42%,rgba('+c+',0) 100%)';
      }
      return out;
    }
    /* ⚠️ paint() rewrites .style.background on these pieces EVERY FRAME of a
       move, and the shorthand clears background-image. So the field is also
       re-applied from a MutationObserver on the style attribute, which fires as
       a microtask after each write and before paint. The rAF alone loses every
       frame where paint() runs after it; the observer alone never fires while
       the bar is at rest. */
    var writing=false;
    function draw(g,t){
      writing=true;
      for(var i=0;i<g.pieces.length;i++){
        var v=field(g,g.pieces[i],t);
        if(g.pieces[i].style.backgroundImage!==v)g.pieces[i].style.backgroundImage=v;
      }
      writing=false;
    }
    function clear(g){
      writing=true;
      for(var i=0;i<g.pieces.length;i++)g.pieces[i].style.backgroundImage='';
      writing=false;
    }
    segs.forEach(function(g){
      var o=new MutationObserver(function(){
        if(!writing&&g.amt>0.012)draw(g,performance.now()/1000);
      });
      g.pieces.forEach(function(p){
        o.observe(p,{attributes:true,attributeFilter:['style']});
      });
    });

    var px=-1e4,py=-1e4,raf=0;
    addEventListener('pointermove',function(e){
      if(e.pointerType==='touch')return;
      px=e.clientX;py=e.clientY;
      if(!raf)raf=requestAnimationFrame(tick);
    },{passive:true,capture:true});

    function tick(now){
      var t=now/1000*RATE, any=false, live=false, i, j;
      for(i=0;i<segs.length;i++){
        var g=segs[i], ir=g.ink.getBoundingClientRect(), hot=null;
        for(j=0;j<g.tabs.length;j++){
          var tr=g.tabs[j].getBoundingClientRect();
          if(px>=tr.left&&px<=tr.right&&py>=tr.top&&py<=tr.bottom){hot=g.tabs[j];break;}
        }
        /* the bar's own box, not just the tabs: crossing the gap between two
           tabs must not blink the field out and back */
        var over=!!hot||(px>=ir.left&&px<=ir.right&&py>=ir.top-8&&py<=ir.bottom+8);
        if(hot){var hc=parseCol(hot.getAttribute('data-accent'));if(hc)g.hot=hc;}
        if(over){g.tx=px;any=true;}
        g.amt+=((over?1:0)-g.amt)*0.11;
        g.mx+=(g.tx-g.mx)*FOLLOW;
        g.mx2+=(g.tx-g.mx2)*(FOLLOW*0.42);
        if(g.amt>0.012){ draw(g,t); g.clean=false; live=true; }
        else if(!g.clean){ clear(g); g.clean=true; }
      }
      if(curInk){
        var wa=any?String(SWARM):'';
        if(curInk.style.opacity!==wa)curInk.style.opacity=wa;
      }
      /* stop the loop once the field has faded out, so a reader who never goes
         near the bar pays nothing for this after the pointer leaves */
      raf = live ? requestAnimationFrame(tick) : 0;
    }
  })();

  /* ══ 6 · the hint ═══════════════════════════════════════════════════════
     One floating capsule, reused, positioned over whatever [data-tip] the
     pointer or the keyboard is on. It replaces the native title= tooltip, which
     drew in the OS's font after the OS's delay and could not be styled at all.

     ⚠️ A CONTROL MUST NOT CARRY BOTH title= AND data-tip — the browser would
     draw its own tooltip underneath this one. The repo button had the only
     title on the site and it was removed in the same change.

     ⚠️ POINTER TRIGGERS ARE GATED ON fine, FOCUS TRIGGERS ARE NOT. On a touch
     screen pointerenter fires on tap, so an ungated hint would flash on every
     link a thumb touches, one frame before the page navigates away. Keyboard
     focus is a real request to know what something is on any device, so
     focusin/focusout stay live.

     ⚠️ It hides on scroll, on wheel and on click. A position:fixed capsule
     anchored to an element that has moved is worse than no hint: it points at
     the wrong control with total confidence. */
  (function(){
    var tipEl=null,showT=0,cur=null,pending=null;
    function build(){
      if(tipEl)return tipEl;
      tipEl=el('div','tipx');
      tipEl.setAttribute('aria-hidden','true');
      var t=el('span','tipx-t');
      tipEl.appendChild(t);
      document.body.appendChild(tipEl);
      return tipEl;
    }
    function place(node){
      var tip=build();
      tip.lastChild.textContent=node.getAttribute('data-tip')||'';
      /* measured with the class off, so the transform is not folded into the
         box the arithmetic is done against */
      tip.classList.remove('on');
      var r=node.getBoundingClientRect(), tr=tip.getBoundingClientRect();
      var GAP=10, under=r.top-tr.height-GAP<6;
      tip.classList.toggle('under',under);
      var y=under?r.bottom+GAP:r.top-tr.height-GAP;
      /* clamped so a control at the edge of the bar does not push it off screen;
         the capsule is centre-anchored, hence the half-width either side */
      var half=tr.width/2, x=r.left+r.width/2;
      if(x-half<8)x=8+half;
      if(x+half>innerWidth-8)x=innerWidth-8-half;
      tip.style.left=x.toFixed(1)+'px';
      tip.style.top=Math.max(6,y).toFixed(1)+'px';
      tip.classList.add('on');
      cur=node;
    }
    function hide(){
      clearTimeout(showT);
      cur=null;pending=null;
      if(tipEl)tipEl.classList.remove('on');
    }
    /* ⚠️ A DELAY ALONE DOES NOT STOP FALSE TRIGGERS, and raising it further is
       the wrong lever — it just makes the wanted case feel broken too. The
       trigger is a pointer that has COME TO REST on a control; a pointer still
       travelling across one is passing through. So the timer checks that the
       pointer has actually stopped and reschedules itself if it has not,
       which is what turns "hovered for 420ms" into "settled here". */
    var lastMove=0,lastX=-1e4,lastY=-1e4;
    if(fine)addEventListener('pointermove',function(e){
      lastMove=performance.now();lastX=e.clientX;lastY=e.clientY;
    },{passive:true,capture:true});
    /* ⚠️ pending IS NOT A TIDY-UP. Without it, every pointerover on a CHILD of
       the trigger restarted the timer, so crossing a button's icon and then its
       label reset the wait twice and the hint could take three delays to arrive
       — or never, on a control with several children. Re-asking for the node
       that is already queued is a no-op now. */
    function want(node,delay){
      if(!node||node===cur||node===pending)return;
      pending=node;
      clearTimeout(showT);
      showT=setTimeout(function fire(){
        if(fine&&performance.now()-lastMove<130){ showT=setTimeout(fire,130); return; }
        pending=null;
        place(node);
      },delay);
    }
    function tipOf(e){
      var n=e.target;
      return n&&n.closest?n.closest('[data-tip]'):null;
    }
    if(fine){
      document.addEventListener('pointerover',function(e){
        if(e.pointerType==='touch')return;
        var n=tipOf(e);
        if(!n){ if(cur)hide(); return; }
        /* 700ms, not the 190 this started at and not the 420 that followed.
           Reported as naggy at both: a hint that arrives while you are still
           deciding whether you wanted it reads as an interruption, and the
           delay is what separates a nudge from a nag. Paired with the settle
           check below, which is the half that stops sweep-through triggers —
           raising the delay alone would only have made the WANTED case feel
           broken too. */
        want(n,700);
      },true);
      /* ⚠️ pointerout FIRES ON EVERY INTERNAL BOUNDARY, and reading it as "the
         pointer left" is what made the hint strobe across a single button —
         reported 2026-08-03 16:40 EDT with a recording of it appearing and
         vanishing three times inside the Source capsule. Moving from .ghb-ic to
         .ghb-t is a pointerout on the icon whose target still resolves to the
         same trigger, so the old check hid it and pointerover then queued it
         again. relatedTarget is the element being entered: if it is still
         inside the same trigger, nothing has been left. */
      document.addEventListener('pointerout',function(e){
        var n=tipOf(e);
        if(!n)return;
        var to=e.relatedTarget;
        if(to&&n.contains(to))return;
        /* ⚠️ relatedTarget IS NOT ENOUGH ON A CONTROL THAT RESIZES. .ghb grows
           from 32px to its full width over 420ms on hover, so a pointer that
           has not moved can fall outside the box for a frame and come back —
           pointerout fires with relatedTarget outside, and the hint hid and
           re-queued. Ask the geometry instead: if the pointer is still within
           the trigger's current rect, nothing has been left. */
        var r=n.getBoundingClientRect();
        if(lastX>=r.left-1&&lastX<=r.right+1&&lastY>=r.top-1&&lastY<=r.bottom+1)return;
        hide();
      },true);
    }
    document.addEventListener('focusin',function(e){
      var n=tipOf(e);
      if(n)want(n,0); else hide();
    },true);
    document.addEventListener('focusout',hide,true);
    addEventListener('scroll',hide,{passive:true,capture:true});
    addEventListener('wheel',hide,{passive:true});
    addEventListener('click',hide,true);
    addEventListener('blur',hide);
  })();
})();`;

function warmShell({ title, kicker, accent, glow, lede, badge, body, out, sig, spine, dir }) {
    // See the same note in shell(): a page is identified by directory AND filename.
    const cur = { out, dir };
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — Dior's Builds</title>
<meta name="description" content="${esc(lede)}">
<meta name="color-scheme" content="dark light">
${THEME_BOOT}
<meta property="og:title" content="${esc(title)} — Dior's Builds">
<meta property="og:description" content="${esc(lede)}">
<meta property="og:type" content="website">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%2316131B'/%3E%3Ccircle cx='16' cy='16' r='9' fill='${encodeURIComponent(accent)}'/%3E%3C/svg%3E">
<style>
${TOKENS}
:root{--accent:${accent};--glow:${glow}}
${COMPONENT_CSS}

.bar{position:fixed;inset:0 0 auto;height:54px;z-index:60;display:flex;align-items:center;
  gap:1.5rem;padding:0 clamp(1rem,3vw,2rem);background:color-mix(in srgb,var(--desk) 88%,transparent);
  backdrop-filter:blur(14px) saturate(1.3);border-bottom:1px solid var(--rule)}
.bar nav{margin-left:auto;display:flex;align-items:center;gap:.6rem}

${SWITCHER_CSS}

/* The warm wash. This is the single strongest signal that you have left the
   legal set — those pages sit on flat graphite with no colour behind them. */
body{min-height:100vh;background:
  radial-gradient(120% 80% at 50% -12%,color-mix(in srgb,var(--accent) 15%,transparent),transparent 62%),
  radial-gradient(90% 60% at 88% 8%,color-mix(in srgb,var(--glow) 12%,transparent),transparent 55%),
  var(--desk)}
/* 760px wasted most of a desktop window, and it was also what forced the footer
   nav to wrap "Contributors" onto a line of its own with half the row empty. The
   structured blocks (tiles, ledger, plates, promise cards) all want the extra
   width — they are auto-fit grids and simply gain a column. Running PROSE does
   not, so it is capped below; the ragged right on paragraphs is deliberate and
   is what keeps a 950px card readable. */
.wrap{max-width:950px;margin:0 auto;padding:calc(54px + clamp(2.6rem,9vh,5rem)) clamp(1.2rem,5vw,2rem) 4rem}

.hero{text-align:center;margin-bottom:clamp(2.4rem,7vh,3.6rem)}
.chip{display:inline-flex;align-items:center;gap:.45rem;font-family:var(--mono);font-size:.63rem;
  letter-spacing:.14em;text-transform:uppercase;color:var(--accent-t);
  border:1px solid color-mix(in srgb,var(--accent) 42%,transparent);border-radius:999px;
  padding:.32rem .8rem;background:color-mix(in srgb,var(--accent) 10%,transparent)}
.chip::before{content:"";width:5px;height:5px;border-radius:50%;background:var(--accent);
  animation:beat 2.2s ease-in-out infinite}
@keyframes beat{0%,100%{opacity:.35;transform:scale(.85)}50%{opacity:1;transform:scale(1.15)}}
.hero h1{font-family:var(--display);font-weight:800;letter-spacing:-.045em;line-height:.95;
  font-size:clamp(2.6rem,9vw,4.4rem);margin:1rem 0 .9rem;color:var(--ink)}
.hero .lede{font-family:var(--serif);font-size:1.12rem;line-height:1.68;color:var(--ink2);
  max-width:44ch;margin:0 auto}

/* Rounded, soft-shadowed, no top hairline — the legal .doc is the opposite of
   each of those. */
.card{background:color-mix(in srgb,var(--paper) 92%,transparent);
  border:1px solid var(--rule);border-radius:16px;padding:clamp(1.5rem,4.5vw,2.8rem);
  box-shadow:0 30px 70px -34px rgba(0,0,0,.7);backdrop-filter:blur(6px)}

.card h2{font-family:var(--display);font-size:1.3rem;font-weight:750;letter-spacing:-.022em;
  color:var(--ink);margin:2.6rem 0 .9rem;scroll-margin-top:76px}
.card h2:first-child{margin-top:0}
.card h3{font-family:var(--display);font-size:1.02rem;font-weight:700;
  letter-spacing:-.01em;color:var(--ink);margin:1.9rem 0 .6rem}
.card p,.card li{font-family:var(--serif);font-size:1.04rem;line-height:1.76;color:var(--ink2);
  max-width:68ch}
.card p{margin:0 0 1.05rem}
.card strong{color:var(--ink);font-weight:600}
.card ul,.card ol{margin:0 0 1.15rem;padding-left:1.3rem}
.card li{margin:.42rem 0}
.card li::marker{color:var(--accent-t)}
.card a{color:var(--ink);text-decoration:underline;text-underline-offset:.18em;
  text-decoration-color:color-mix(in srgb,var(--accent) 65%,transparent)}
.card a:hover{text-decoration-color:var(--accent)}
.card code{font-family:var(--mono);font-size:.83em;background:var(--raised);
  border:1px solid var(--rule);border-radius:4px;padding:.11em .36em;color:var(--ink);
  word-break:break-word}
.card hr{border:0;border-top:1px solid var(--rule);margin:2.4rem 0}
/* Fenced code blocks. The language tag is shown as a corner label rather than
   dropped, so a reader can tell a shell snippet from a config one. */
pre.code{position:relative;margin:1.3rem 0;padding:1rem 1.15rem;border-radius:10px;
  background:var(--raised);border:1px solid var(--rule);overflow-x:auto}
pre.code code{display:block;font-family:var(--mono);font-size:.8rem;line-height:1.75;
  color:var(--ink);white-space:pre;background:none;border:0;padding:0}
pre.code[data-lang]::before{content:attr(data-lang);position:absolute;top:.5rem;left:1.15rem;
  font-family:var(--mono);font-size:.56rem;letter-spacing:.16em;text-transform:uppercase;
  color:var(--ink3)}
.card .ref{font-family:var(--mono);font-size:.86em;color:var(--ink2);
  border-bottom:1px dotted var(--rule)}
/* The code block and its copy control. The control sits OUTSIDE the pre so it
   cannot scroll away with a long line, and so its own label never becomes part of
   what gets copied. */
.cw{position:relative}
.cw pre.code[data-lang]{padding-top:1.75rem}
/* ⚠️ min-height:0 is required. The base .cpy is a labelled pill with
   min-height:44px for its touch target, and that MIN wins over a plain height —
   so this came out 30px wide by 44px tall: a vertical oval with the mark riding
   high in it. An icon-only control has to reset the floor before it can be
   square. The 44px target returns on coarse pointers, where it is the thing that
   actually matters and the button is always visible rather than hover-revealed. */
/* ⚠️ .cpy.cpy-f, not .cpy-f — these two selectors carry the SAME specificity and
   this block is defined ABOVE the base .cpy, so a single class lost on source
   order and the base won silently. That left min-height:44px and 1.05rem of
   horizontal padding in force: the button rendered 35.6x44 (a vertical oval) and
   the padding squeezed the drawn mark to ZERO width inside it. Measured, not
   guessed. An icon-only control has to beat the labelled pill it derives from. */
.cpy.cpy-f{position:absolute;top:.5rem;right:.55rem;z-index:1;
  padding:0;gap:0;min-height:0;width:34px;height:34px}
/* The 44px target returns where it actually matters — a coarse pointer, where
   this control is always visible rather than revealed on hover. */
@media (hover:none){.cpy.cpy-f{width:44px;height:44px}}
/* The copy mark: two offset sheets, becoming a tick once the text is on the
   clipboard. Drawn, not typed — see the note in withCopyButtons(). */
.cpy-g{position:relative;display:block;width:12.5px;height:13px}
.cpy-g::before,.cpy-g::after{content:"";position:absolute;box-sizing:border-box;
  border:1.4px solid currentColor;border-radius:2px;transition:opacity .18s ease}
.cpy-g::before{left:0;top:0;width:8.5px;height:9.5px}
.cpy-g::after{left:4px;top:3.5px;width:8.5px;height:9.5px;background:var(--raised)}
.cpy-f[data-done] .cpy-g::before{opacity:0}
.cpy-f[data-done] .cpy-g::after{left:1px;top:2px;width:10px;height:5.5px;
  border-width:0 0 1.7px 1.7px;border-radius:0;background:none;transform:rotate(-45deg)}
@media (hover:hover) and (pointer:fine){
  .cw .cpy-f{opacity:0;transition:opacity .22s ease}
  .cw:hover .cpy-f,.cw .cpy-f:focus-visible{opacity:1}
}
.card blockquote.callout{margin:1.5rem 0;padding:1.05rem 1.25rem;border-radius:12px;
  background:color-mix(in srgb,var(--accent) 8%,var(--raised));
  border:1px solid color-mix(in srgb,var(--accent) 26%,var(--rule))}
.card blockquote.callout>:last-child{margin-bottom:0}
.card blockquote.callout.warn{background:color-mix(in srgb,var(--gold) 10%,var(--raised));
  border-color:color-mix(in srgb,var(--gold) 34%,var(--rule))}
.card .anchor{display:none}
.card .idx{display:none}

/* Any table that survives un-composed still needs to render. CONTRIBUTORS' own
   tables become plates below; this is the fallback for a future warm source. */
.tw{overflow-x:auto;margin:1.5rem 0;border-radius:12px;border:1px solid var(--rule);
  background:color-mix(in srgb,var(--accent) 6%,var(--raised))}
.card table{border-collapse:collapse;width:100%}
.card th{font-family:var(--mono);font-size:.6rem;letter-spacing:.14em;text-transform:uppercase;
  color:var(--ink3);font-weight:500;padding:.7rem .95rem;text-align:left;
  border-bottom:1px solid var(--rule)}
.card td{font-family:var(--serif);font-size:1rem;padding:.9rem .95rem;color:var(--ink2);
  border-bottom:1px solid var(--rule);vertical-align:top}
.card tbody tr:last-child td{border-bottom:0}

/* ── section frames + the spine ──────────────────────────────────────────
   Only contributing gets the spine (.card.spine). It is a path with an order
   that matters. Contributors is a wall, and hanging three plates off a timeline
   would be a device borrowed rather than earned. */
.sec{position:relative;margin:0 0 2.5rem}
.sec:last-child{margin-bottom:0}
.card .sec>h2{margin-top:0}
.lead{margin:0 0 2.2rem}
.card .lead>p:first-child{font-size:1.12rem;line-height:1.72;color:var(--ink)}
.card .lead>p:last-child{margin-bottom:0}
.sec-b>:last-child{margin-bottom:0}
.node{display:none}
.spine .sec{padding-left:2.05rem}
.spine .sec::before{content:"";position:absolute;left:4.5px;top:.75rem;bottom:-2.5rem;width:1px;
  background:var(--rule)}
.spine .sec:last-child::before{bottom:0;
  background:linear-gradient(var(--rule),transparent)}
.spine .node{display:block;position:absolute;left:0;top:.42rem;width:10px;height:10px;
  border-radius:50%;background:var(--paper);
  border:1px solid color-mix(in srgb,var(--accent) 45%,var(--rule));
  transition:background .5s ease,box-shadow .5s ease}
.spine .sec.on>.node{background:var(--accent);
  box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 16%,transparent)}

/* ── ways to contribute: four parallel lanes, so tiles rather than a run of
      subheadings a reader has to read through to choose between ───────────── */
/* ⚠️ TWO fixed columns, not auto-fit. auto-fit with a 228px minimum fits THREE
   tracks at this card's width, so the four lanes came out as three thin blocks
   with a single stranded tile underneath — an arrangement that implies the last
   one is different when all four are parallel. Four items want 2x2. */
.opts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.85rem;
  margin:1.3rem 0}
@media (max-width:640px){.opts{grid-template-columns:1fr}}
.opt{border:1px solid var(--rule);border-radius:14px;padding:1.1rem 1.2rem;
  background:color-mix(in srgb,var(--raised) 62%,transparent);
  transition:border-color .25s,transform .25s}
.opt:hover{border-color:color-mix(in srgb,var(--accent) 42%,var(--rule));transform:translateY(-2px)}
.opt-m{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;font-size:.95rem;
  background:color-mix(in srgb,var(--accent) 12%,transparent);
  border:1px solid color-mix(in srgb,var(--accent) 28%,transparent);margin-bottom:.65rem}
.card .opt h3{margin:0 0 .5rem;font-size:1rem}
.card .opt p,.card .opt li{font-size:.95rem;line-height:1.62}
.card .opt>div>:last-child{margin-bottom:0}

/* ── the CLA ledger. Two sides: what leaves your hands, what stays in them.
      The out-rows carry the accent tint; everything you keep stays neutral. */
.ldg{margin:1.4rem 0;display:grid;gap:1px;background:var(--rule);
  border:1px solid var(--rule);border-radius:14px;overflow:hidden}
.ldg-r{background:var(--paper);padding:1.15rem 1.3rem 1.05rem;
  display:grid;grid-template-columns:26px 1fr;column-gap:.85rem}
.ldg-r[data-d=out]{background:color-mix(in srgb,var(--accent) 7%,var(--paper))}
/* ⚠️ NOT a circle, and not a filled chip. A 26px bordered circle at the head of
   every row of an agreement reads as a radio button — something to click, confirm
   or fill in — which is precisely the wrong signal on the page explaining what you
   are agreeing to. The mark is bare now: the glyph alone in the direction's
   colour, with the row carrying an edge instead. Nothing here is interactive. */
.ldg-m{grid-column:1;grid-row:1/span 2;width:20px;height:22px;
  display:grid;place-items:center;font-family:var(--mono);font-size:.95rem;line-height:1;
  margin-top:.08rem;background:none;border:0;border-radius:0}
.ldg-r{border-left:2px solid transparent}
.ldg-r[data-d=out] .ldg-m{color:var(--accent-t)}
.ldg-r[data-d=out]{border-left-color:color-mix(in srgb,var(--accent) 55%,transparent)}
.ldg-r[data-d=hold] .ldg-m,.ldg-r[data-d=check] .ldg-m{color:var(--ink2)}
.ldg-r[data-d=hold],.ldg-r[data-d=check]{border-left-color:var(--rule2)}
.ldg-r[data-d=none] .ldg-m{color:var(--ink3)}
.ldg-r[data-d=none]{border-left-color:color-mix(in srgb,var(--ink3) 45%,transparent)}
.card .ldg-r>h3{grid-column:2;grid-row:1;margin:0 0 .45rem;font-size:1rem}
.ldg-r>div{grid-column:2;grid-row:2}
.ldg-r>div>:last-child{margin-bottom:0}
.card .ldg-r p,.card .ldg-r li{font-size:.97rem;line-height:1.68}

/* ── the consent slip. The one thing on this page a reader has to physically
      take away, so it looks detachable: a dashed tear edge down the left and a
      real copy control. The line stays selectable text if JS never runs. */
.slip{position:relative;margin:1.3rem 0;padding:.95rem 1.15rem .95rem 1.55rem;
  border-radius:12px;background:var(--raised);border:1px solid var(--rule);
  display:flex;flex-wrap:wrap;align-items:center;gap:.7rem 1rem}
.slip::before{content:"";position:absolute;left:.62rem;top:.7rem;bottom:.7rem;
  border-left:2px dashed color-mix(in srgb,var(--accent) 48%,var(--rule))}
/* ⚠️ THE BUTTON GOES TO THE EDGE, and the line takes only the room it needs.
   flex:1 1 17rem let the text claim the whole row, so once the CLA line wrapped to
   two lines the button sat immediately after the shorter second line with a wide
   empty gutter to its right — reading as though it belonged to that line rather
   than to the slip. max-content caps the text at its natural width and margin-left
   auto pins the button to the right edge, where a control on a strip belongs. */
.card .slip-t{flex:0 1 auto;max-width:max-content;margin:0;font-family:var(--mono);
  font-size:.78rem;line-height:1.7;color:var(--ink);word-break:break-word}
.slip .cpy{margin-left:auto}
.cpy{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;gap:.45rem;
  min-height:44px;padding:0 1.05rem;border-radius:999px;cursor:pointer;
  font-family:var(--mono);font-size:.64rem;letter-spacing:.13em;text-transform:uppercase;
  color:var(--accent-t);background:color-mix(in srgb,var(--accent) 13%,transparent);
  border:1px solid color-mix(in srgb,var(--accent) 42%,transparent);
  transition:background .2s,color .2s,border-color .2s}
.cpy:hover{background:color-mix(in srgb,var(--accent) 22%,transparent)}
.cpy[data-done]{color:var(--ink);border-color:var(--rule2);background:var(--raised)}
/* The top sheet of the copy glyph is an opaque cut-out, so it has to match the
   surface it sits on. In the floating variant that is --raised; inside the labelled
   pill it is the pill's own accent-washed fill, and --raised there left a visibly
   darker notch through the drawing. */
.slip .cpy .cpy-g::after{background:color-mix(in srgb,var(--accent) 13%,var(--raised))}
/* Visually hidden, still announced. The button label also changes, so a sighted
   user gets the same confirmation without the live region. */
.cpy-s{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);
  white-space:nowrap}

/* ── the credit wall. A plate is engraved: inset highlight along the top edge,
      name in display type. The ghost plate is the page's actual argument — the
      empty space is the offer, so it is drawn as a reserved object rather than
      apologised for in italics. */
/* ⚠️ auto-FILL with a capped track, not auto-FIT with 1fr. With a single real
   contributor, auto-fit collapses the empty tracks and stretches that one plate
   across the entire card — a name floating in a wide grey band, which is most of
   why this page read as lifeless. Capping the track keeps a plate plate-sized and
   lets the wall grow into an actual wall as names arrive. */
.wall{display:grid;grid-template-columns:repeat(auto-fill,minmax(232px,268px));
  gap:.9rem;margin:1.4rem 0;justify-content:start}
@media (max-width:560px){.wall{grid-template-columns:1fr}}
@media (hover:hover) and (pointer:fine){
  .plate:not(.ghost){transition:transform .3s cubic-bezier(.22,.9,.24,1),
    border-color .3s ease,box-shadow .3s ease}
  .plate:not(.ghost):hover{transform:translateY(-3px);
    border-color:color-mix(in srgb,var(--accent) 48%,var(--rule));
    box-shadow:inset 0 1px 0 color-mix(in srgb,white 16%,transparent),
      0 22px 40px -22px rgba(0,0,0,.85)}
}
.plate{position:relative;border-radius:14px;padding:1.15rem 1.25rem;overflow:hidden;
  display:flex;flex-direction:column;gap:.45rem;
  background:linear-gradient(158deg,color-mix(in srgb,var(--accent) 10%,var(--raised)),
    var(--raised) 70%);
  border:1px solid color-mix(in srgb,var(--accent) 28%,var(--rule));
  box-shadow:inset 0 1px 0 color-mix(in srgb,white 12%,transparent),
    0 16px 34px -24px rgba(0,0,0,.8)}
.plate-n{font-family:var(--display);font-size:1.22rem;font-weight:800;letter-spacing:-.028em;
  color:var(--ink);line-height:1.2}
.plate-r{font-family:var(--mono);font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;
  color:var(--ink2)}
/* A slow sheen across the engraved name. The point of this page is that being on
   it feels good; a static row of table cells does not do that. */
.plate:not(.ghost) .plate-n strong{background:linear-gradient(100deg,var(--ink) 30%,
  color-mix(in srgb,var(--accent) 85%,var(--ink)) 50%,var(--ink) 70%);
  background-size:220% 100%;-webkit-background-clip:text;background-clip:text;
  -webkit-text-fill-color:transparent;animation:plate 6s ease-in-out infinite}
@keyframes plate{0%,70%{background-position:120% 0}100%{background-position:-20% 0}}
.plate.ghost{background:none;box-shadow:none;border-style:dashed;
  text-decoration:none;color:inherit;cursor:pointer;
  animation:wait 5s ease-in-out infinite}
.plate.ghost:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
@media (hover:hover) and (pointer:fine){
  .plate.ghost{transition:border-color .3s ease,background .3s ease,transform .3s cubic-bezier(.22,.9,.24,1)}
  .plate.ghost:hover{transform:translateY(-3px);border-style:solid;
    border-color:color-mix(in srgb,var(--accent) 55%,transparent);
    background:color-mix(in srgb,var(--accent) 7%,transparent);animation-play-state:paused}
}
/* The waiting slot's label lives here rather than in the DOM — see asPlates(). */
.plate.ghost .plate-n{color:var(--ink3)}
.plate.ghost .plate-n::before{content:"Your name"}
.plate.ghost .plate-r{font-family:var(--serif);font-size:.95rem;line-height:1.6;
  letter-spacing:0;text-transform:none;color:var(--ink2)}
@keyframes wait{0%,100%{border-color:color-mix(in srgb,var(--accent) 20%,var(--rule))}
  50%{border-color:color-mix(in srgb,var(--accent) 58%,var(--rule))}}

/* ── how credit works: four guarantees, so four plainly-bounded cards. The
      accent hairline underlines each one rather than boxing it in colour. */
.proms{display:grid;grid-template-columns:repeat(auto-fit,minmax(218px,1fr));gap:.85rem;
  margin:1.3rem 0}
.prom{position:relative;border:1px solid var(--rule);border-radius:13px;
  padding:1.05rem 1.15rem 1.1rem;background:color-mix(in srgb,var(--accent) 5%,var(--raised))}
.prom::after{content:"";position:absolute;left:1.15rem;right:1.15rem;bottom:0;height:1px;
  background:linear-gradient(90deg,var(--accent),transparent);opacity:.55}
.card .prom h4{font-family:var(--display);font-size:.95rem;font-weight:750;
  letter-spacing:-.012em;color:var(--ink);margin:0 0 .4rem}
.card .prom p{font-family:var(--serif);font-size:.93rem;line-height:1.62;
  color:var(--ink2);margin:0}

@media (prefers-reduced-motion:reduce){
  .chip::before{animation:none}
  .plate:not(.ghost) .plate-n strong{animation:none;-webkit-text-fill-color:var(--ink)}
  .plate.ghost{animation:none;border-color:color-mix(in srgb,var(--accent) 42%,var(--rule))}
}

/* The sign-off now comes FIRST (see the markup), so it carries the gap away from the
   document and the nav's hairline sits below it, separating site chrome from the
   letter rather than cutting the letter off from its own last line. */
@media (prefers-reduced-motion:reduce){.hrt{animation:none}}
@media print{.bar,.thm,.ghb,.ins,.cpy,.node,.mnav{display:none!important}
  body{background:#fff;color:#000}.card{border:0;box-shadow:none;border-radius:0}
  .plate,.opt,.prom,.slip,.ldg{box-shadow:none;animation:none}}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
html{scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>\n${GOO_SVG}

<div class="bar">
  ${wordmark('./', cur)}
  <!-- The same two-group switcher the legal pages carry, so the navigation never
       changes shape as you move around the site. It replaces the old "‹ Legal"
       back button, which could only ever go one place. -->
  <nav>
    ${navSwitcher(cur)}
    ${repoBtn}
    ${installBtn()}
    ${themeBtn()}
  </nav>
</div>

${mobileNav(cur, '')}
<div class="wrap">
  <header class="hero">
    <span class="chip">${esc(badge)}</span>
    <h1>${esc(title)}</h1>
    <p class="lede">${esc(lede)}</p>
  </header>
  <main class="card${spine ? ' spine' : ''}" id="main" tabindex="-1">${body}</main>
  <!-- The footer is pageFoot(), identical on every page. The sign-off is the one
       the SOURCE file ends with, lifted out of the body by warmCompose so it
       shows once; DIOR_SIG is the fallback when a source carries no closing line.
       No bottom theme tray: the header already has the switch, and offering the
       same control twice on one screen is clutter. (The landing page is the
       exception — it has no fixed header, so its switch lives at the foot.) -->
  ${pageFoot(cur, sig, false)}
</div>
<script>${THEME_JS}${NAV_JS}${WARM_JS}${MORPH_JS}</script>
</body>
</html>`;
}

/* ──────────────────────────── index landing page ───────────────────────── */

function indexPage(built) {
    const rows = built.map((p, n) => `
      <a class="entry" href="${p.out}" style="--accent:${p.accent};--glow:${p.glow}">
        <i>${String(n + 1).padStart(2, '0')}</i>
        <div>
          <h2>${esc(p.title)}</h2>
          <p>${esc(p.blurb)}</p>
        </div>
        <em>${p.sections} sections</em>
      </a>`).join('');

    // Derived from what was actually built, so it can't claim "two documents"
    // after a third one is added — which is exactly what it said before the
    // licence page landed.
    const marks = {
        'contributing.html': '<svg viewBox="0 0 14 14" aria-hidden="true">'
            + '<line class="ph" x1="1.5" y1="7" x2="12.5" y2="7"/>'
            + '<line class="pv" x1="7" y1="1.5" x2="7" y2="12.5"/></svg>',
        // Three ruled lines of unequal length — a credits list — which extend to
        // meet each other on hover: entries being filled in. The three dots this
        // replaces read as a loading spinner, which is the one thing this page is
        // not doing. The bars are also the site's own wordmark motif.
        'contributors.html': '<svg viewBox="0 0 14 14" aria-hidden="true">'
            + '<line class="ln" x1="2" y1="3.6" x2="12" y2="3.6"/>'
            + '<line class="ln" x1="2" y1="7" x2="8.4" y2="7"/>'
            + '<line class="ln" x1="2" y1="10.4" x2="5.6" y2="10.4"/></svg>'
    };
    // ⚠️ hrefTo, not a bare p.out. The chronicle pages live in a different
    // directory AND one of them is called index.html — the same name as this page.
    // A bare href would have pointed the site's biggest new section at the page the
    // reader is already on, and linkAudit() could not have caught it: the target
    // resolves perfectly, it is simply the wrong file.
    const here = { out: 'index.html', dir: 'legal' };
    const invRow = list => list.map(p => `
      <a class="inv" href="${hrefTo(p, here)}" style="--ia:${p.accent}">
        <span class="inv-b">
          <span class="inv-h">
            <span class="inv-m" aria-hidden="true">${marks[p.out] || ''}</span>
            <span class="ik">${esc(p.kicker)}</span>
          </span>
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.blurb)}</p>
        </span>
        <span class="inv-s" aria-hidden="true">
          <span class="inv-sw">${esc(p.short)}</span>
          <span class="arw"><i aria-hidden="true"></i></span>
        </span>
      </a>`).join('');

    const invites = invRow(EXTRA_PAGES);
    // ⚠️ THE RECORD ROW IS OFF THE LANDING PAGE, deliberately, and invRow() still
    // knows how to build it — this is a hidden feature, not a deleted one.
    // The pages themselves are still built, still deployed and still reachable at
    // /changelog/; what is withdrawn is the landing page's invitation to go there.
    // A landing page that offers everything equally offers nothing in particular,
    // and this one exists to put four legal documents in front of a reader.
    // To restore: uncomment, and put the two lines back in the markup below.
    // const chronicle = invRow(CHRONICLE_PAGES);

    const n = built.length;
    const count = ['no', 'One', 'Two', 'Three', 'Four', 'Five'][n] || String(n);
    // Four parallel clauses, one per document, each naming a thing the reader
    // actually wants to know. The previous version buried an em-dash aside
    // ("down to the individual database field") mid-sentence and then trailed off
    // on "the terms the source code is published under", which is the weakest way
    // to end a line and left the fourth document unmentioned entirely.
    const lede = `${count} document${n === 1 ? '' : 's'}: what you agree to, what the bot `
        + 'stores about you, what you may do with the code, and who owns what it shows you.';

    return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Legal — Dior's Builds</title>
<meta name="description" content="${esc(built.map(p => p.title).join(', '))} for Dior's Builds, an unofficial Call of Duty: Mobile Discord bot.">
<meta name="color-scheme" content="dark light">
${THEME_BOOT}
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%2316131B'/%3E%3Crect x='6' y='7' width='20' height='3' fill='%23FF7D5C'/%3E%3Crect x='6' y='14' width='14' height='3' fill='%236E6782'/%3E%3Crect x='6' y='21' width='17' height='3' fill='%236E6782'/%3E%3C/svg%3E">
<style>
${TOKENS}
:root{--accent:${BRAND.coral}}
${COMPONENT_CSS}
body{min-height:100vh;display:flex;align-items:center;padding:clamp(2rem,8vh,6rem) clamp(1.2rem,5vw,2rem)}
.wrap{width:100%;max-width:780px;margin:0 auto}
.top{display:flex;align-items:center;gap:.6rem;margin-bottom:clamp(2.5rem,9vh,5rem)}
.top .ghb{margin-left:auto}
/* ⚠️ -.038em, not -.05em. The face DOES have ligatures — the fi in "fine" is a
   real one and is correct typography — but at -.05em on a ~66px display size the
   tracking was pulling unrelated pairs into contact too: the comma sat on the t of
   "print", and the n of "plain" touched the s of "sight". That collision is what
   made the ligature look like a rendering fault rather than a ligature. Easing the
   tracking separates the pairs and leaves the ligature alone.
   ⚠️ LIGATURES STAY ON — Harkirat's decision, 2026-08-02 00:40 EDT. They are the browser
   default and nothing here disables them; the fi ligature in "fine" is meant to be there.
   Do NOT "fix" this later by adding font-variant-ligatures:none. If the type ever
   looks wrong again the suspect is the TRACKING, which pulls unrelated pairs into
   contact, not the ligature. */
h1{font-family:var(--display);font-weight:800;letter-spacing:-.038em;line-height:.9;
  font-size:clamp(3rem,13vw,6.5rem);margin:.8rem 0 1.4rem;color:var(--ink)}
.lede{font-family:var(--serif);font-size:1.1rem;line-height:1.7;color:var(--ink2);
  max-width:46ch;margin:0 0 clamp(2.2rem,7vh,3.6rem)}
.list{border-top:1px solid var(--rule)}
/* ⚠️ Durations here are long enough to be SEEN and eased to decelerate. At .22s
   linear the row snapped rather than moved — the whole page read as abrupt for
   this reason, not because anything was missing. The rule wipes in from the top
   rather than widening, which is the motion a marker being drawn actually makes. */
.entry{display:grid;grid-template-columns:2.6rem 1fr auto;gap:1.4rem;align-items:baseline;
  padding:1.7rem .4rem;text-decoration:none;color:inherit;border-bottom:1px solid var(--rule);
  position:relative;
  transition:padding-left .42s cubic-bezier(.22,.9,.24,1),background .42s ease}
.entry:hover{background:linear-gradient(90deg,
  color-mix(in srgb,var(--accent) 7%,transparent),transparent 42%)}
.entry::before{content:"";position:absolute;left:0;top:0;bottom:-1px;width:3px;
  background:var(--accent);transform:scaleY(0);transform-origin:top;
  transition:transform .44s cubic-bezier(.22,.9,.24,1)}
.entry:hover::before{transform:scaleY(1)}
.entry i,.entry h2,.entry em{transition:color .34s ease}
.entry:hover{padding-left:1.3rem}
/* ⚠️ --accent-t must be REDECLARED here. Custom properties resolve where they are
   DECLARED, not where they are used: --accent-t:var(--accent) computes on :root,
   where --accent is amber, and inherits that finished value. Overriding --accent
   per row therefore did nothing and every number hovered orange. */
.entry{--accent-t:var(--accent)}
:root[data-theme=light] .entry{--accent-t:color-mix(in srgb,var(--accent) 38%,#120E1C)}
@media (prefers-color-scheme:light){
  :root:not([data-theme=dark]) .entry{--accent-t:color-mix(in srgb,var(--accent) 38%,#120E1C)}
}
.entry i{font-family:var(--mono);font-style:normal;font-size:.7rem;color:var(--ink3);
  letter-spacing:.1em;font-variant-numeric:tabular-nums}
.entry:hover i{color:var(--accent-t)}
.entry h2{font-family:var(--display);font-size:1.3rem;font-weight:750;letter-spacing:-.025em;
  margin:0 0 .35rem;color:var(--ink)}
.entry p{font-family:var(--serif);font-size:.98rem;line-height:1.65;color:var(--ink2);margin:0;max-width:44ch}
.entry em{font-family:var(--mono);font-style:normal;font-size:.66rem;letter-spacing:.1em;
  text-transform:uppercase;color:var(--ink3);white-space:nowrap}
@media (max-width:620px){
  .entry{grid-template-columns:2.2rem 1fr;gap:1rem}
  .entry em{display:none}
}
/* The landing page keeps a left-aligned, borderless footer: it is a block of
   contact information, not the end of a document. Every property the shared
   .foot sets is overridden explicitly rather than left to cascade order. */
.foot{margin-top:clamp(2.5rem,8vh,4rem);display:flex;flex-direction:column;gap:.5rem;
  align-items:flex-start;text-align:left;padding:0}
.foot .disc{max-width:66ch}
.disc.fine{margin:clamp(2.4rem,7vh,3.6rem) 0 0;font-size:.56rem;line-height:1.9;
  letter-spacing:.06em;max-width:74ch;color:var(--ink3)}
.contact{margin:0;font-family:var(--mono);font-size:.68rem;line-height:1.75;
  letter-spacing:.04em;color:var(--ink3);max-width:62ch}
.contact a{color:var(--ink2)}
/* ── invitation cards: contributing / contributors ────────────────────
   Deliberately NOT rows in the numbered list above. The 01/02/03 series means
   "documents that bind you"; these are an offer. So: rounded where those are
   squared, warm where those are cold, and side by side rather than stacked in a
   ledger. The visual grammar carries the distinction on its own. */
/* ── invitation TICKETS ───────────────────────────────────────────────
   These are not cards with a hover effect bolted on; they are a different kind
   of object from the numbered rows above, and the form says so. A ticket has a
   torn stub, so each one is split by a perforation with the notches punched
   through it, and the stub carries the destination's name turned on its side.

   The tear is also a cross-reference: the Contributing page's CLA line — the one
   thing on this whole site a reader physically takes away — is rendered as a
   slip with the same dashed edge. Paper you tear off and carry, as against the
   engraved plates on the Contributors page. Two materials, two meanings.

   No overflow:hidden on .inv — the notches have to straddle the card edge to
   read as bitten out of it. That is why the stub carries its own right-hand
   radius instead of relying on the parent to clip it. */
:root[data-theme=light] .inv{--ia-t:color-mix(in srgb,var(--ia) 38%,#120E1C)}
@media (prefers-color-scheme:light){
  :root:not([data-theme=dark]) .inv{--ia-t:color-mix(in srgb,var(--ia) 38%,#120E1C)}
}
.invite{display:grid;grid-template-columns:repeat(auto-fit,minmax(286px,1fr));gap:1.1rem;
  margin-top:clamp(2.2rem,6vh,3rem)}
.inv{--ia-t:var(--ia);position:relative;display:grid;grid-template-columns:minmax(0,1fr) 46px;
  text-decoration:none;color:inherit;border-radius:14px;background:var(--paper);
  border:1px solid var(--rule);
  transition:transform .38s cubic-bezier(.16,.84,.28,1),box-shadow .38s,border-color .38s}
.inv-b{position:relative;z-index:1;padding:1.35rem 1.4rem 1.3rem;min-width:0}
/* ⚠️ THE GLOW IS AN ABSOLUTE ::before, NOT A grid ITEM. .inv is display:grid, so a
   pseudo-element in normal flow would take a track of its own and shove the stub
   off the card. Absolute positioning removes it from the grid entirely. It also
   has to sit UNDER the text, which is why .inv-b is positioned: an unpositioned
   block paints below a positioned sibling regardless of source order. */
.inv::before{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;
  border-radius:14px;opacity:0;transition:opacity .38s ease;
  background:radial-gradient(128% 96% at 16% 0%,
    color-mix(in srgb,var(--ia) 15%,transparent),transparent 64%)}
.inv:hover::before,.inv:focus-visible::before{opacity:1}
.inv-s{position:relative;z-index:1;border-radius:0 13px 13px 0;
  display:grid;grid-template-rows:1fr auto;align-items:center;justify-items:center;
  padding:.9rem 0 .8rem;
  background:color-mix(in srgb,var(--ia) 6%,transparent);
  transition:background .38s}
/* ⚠️ THE PERFORATION BELONGS TO THE CARD, NOT TO THE STUB — this is the whole
   reason the tear reads. It used to be a border-left on .inv-s, so every transform
   that moved the stub carried the dashed line with it, away from the two notches
   the card's mask punches at a fixed --nx. That is why the line appeared to slide
   right on hover and why it made no sense: on real paper the perforation is printed
   across the sheet and STAYS while the stub comes away from it.
   Anchored here at --nx, it is clipped by the same mask that cuts the notches, so
   the line runs exactly between the two holes at every card width.
   background-size sets the tile a repeating gradient repeats over and the stops
   inside it are absolute px, so growing the tile from 10 to 15 keeps a 5px dash and
   stretches the GAP to 10 — the perforation opening up rather than moving. Hard
   stops, so there is no interpolation range and no grey fringe between dash and gap. */
.inv::after{content:"";position:absolute;z-index:2;top:0;bottom:0;
  left:calc(var(--nx) - 1px);width:2px;pointer-events:none;
  background-image:repeating-linear-gradient(180deg,
    color-mix(in srgb,var(--ia) 40%,var(--rule)) 0 5px,transparent 5px 10px);
  background-size:2px 10px;
  transition:background-size .44s cubic-bezier(.34,1.06,.44,1)}
.inv:hover::after,.inv:focus-visible::after{background-size:2px 15px}
/* The torn fibres, which only exist once there is a gap for them to be seen in.
   At rest it is invisible and the edge is clean, because an untorn ticket has no
   ragged edge to show.
   ⚠️ TWO GRADIENTS WITH CO-PRIME PERIODS, and that is the whole trick. A single
   repeating gradient beside the perforation gave two evenly dashed verticals a few
   pixels apart, which read as a second perforation rather than as a torn edge —
   the eye finds the regularity immediately. 7px against 11px only realign every
   77px, so over a 160px stub the marks land in a pattern that does not repeat
   within view. Paper colour, not accent: fibres are the sheet giving way, and an
   accent-coloured edge would have read as printed rule again. */
.inv-s::before{content:"";position:absolute;left:-1px;top:0;bottom:0;width:2px;
  opacity:0;pointer-events:none;
  background-image:
    repeating-linear-gradient(180deg,var(--ink3) 0 3px,transparent 3px 7px),
    repeating-linear-gradient(180deg,var(--ink3) 0 2px,transparent 2px 11px);
  transition:opacity .3s ease .06s}
.inv:hover .inv-s::before,.inv:focus-visible .inv-s::before{opacity:.45}
/* ⚠️ The notches are MASKED OUT of the card, not painted over it. They used to be
   discs filled with --desk, which only matches the page where the page is a flat
   colour — and it is not: there is a radial glow behind these cards, so each notch
   read as a dark disc stuck to the edge rather than a hole bitten out of it.
   A mask removes the pixels, so whatever is behind shows through and it stays
   correct in both themes and anywhere the backdrop changes. */
.inv{--nx:calc(100% - 46px);
  -webkit-mask:
    radial-gradient(circle 7px at var(--nx) 0,transparent 98%,#000 100%),
    radial-gradient(circle 7px at var(--nx) 100%,transparent 98%,#000 100%);
  -webkit-mask-composite:source-in;
  mask:
    radial-gradient(circle 7px at var(--nx) 0,transparent 98%,#000 100%),
    radial-gradient(circle 7px at var(--nx) 100%,transparent 98%,#000 100%);
  mask-composite:intersect}
.inv-sw{writing-mode:vertical-rl;transform:rotate(180deg);
  font-family:var(--mono);font-size:.57rem;letter-spacing:.24em;text-transform:uppercase;
  color:color-mix(in srgb,var(--ia-t) 72%,var(--ink3))}
/* ⚠️ THE CARD NO LONGER ROTATES. A -.35deg tilt on the whole card plus the stub's
   own rotation compounded on the arrow badge at the bottom of the stub, which is
   what made it look wrongly aligned on hover. The tear carries the paper character
   now; the card only lifts. */
.inv:hover,.inv:focus-visible{transform:translateY(-4px);
  border-color:color-mix(in srgb,var(--ia) 44%,var(--rule));
  box-shadow:0 24px 50px -28px color-mix(in srgb,var(--ia) 65%,transparent)}
/* The stub lifts and skews away from the body along the perforation, so the card
   reads as beginning to tear rather than simply rising. It stops well short of
   detaching — a ticket half-torn is an invitation; a ticket in two pieces is a
   used one. */
/* ⚠️ THE STUB TEARS AWAY; IT DOES NOT HINGE. Two earlier versions moved the stub
   as one rigid piece — first a translate+rotate that dragged the perforation with
   it, then a rotateY hinge that pinned the left edge and only lifted. Neither is a
   tear: a tear is a SEPARATION that PROPAGATES, and it has to leave a visible gap.
   transform-origin is left TOP, not left centre, and that is the mechanism. A
   rotation about the top corner leaves the top nearly closed and opens the bottom
   by height*sin(angle) — on a ~168px stub at 1.15deg that is 3.4px, on top of the
   5px translate, so the gap runs 5px at the top to 8.4px at the bottom. That wedge
   IS the tear running down the perforation, and it comes free without any keyframes.
   The shadow cast back onto the card is what makes the gap read as a gap rather
   than as a lighter stripe: it is the only cue that the two pieces are now at
   different depths.
   It stops well short of detaching — a ticket half-torn is an invitation; a ticket
   in two pieces is a used one. */
.inv:hover .inv-s,.inv:focus-visible .inv-s{background:color-mix(in srgb,var(--ia) 18%,transparent);
  transform:translateX(5px) rotate(1.15deg);
  box-shadow:-7px 0 12px -7px rgba(0,0,0,.6)}
.inv-s{transform-origin:left top;
  transition:background .42s ease,transform .46s cubic-bezier(.32,1.06,.4,1),
    box-shadow .42s ease}
@media (prefers-reduced-motion:reduce){
  .inv:hover .inv-s,.inv:focus-visible .inv-s{transform:none}
}
@media (prefers-reduced-motion:reduce){
  .inv:hover,.inv:focus-visible{transform:none}
}

/* ── the SCROLL-DRIVEN mirror of every hover treatment above ───────────
   ⚠️ THIS EXISTS BECAUSE A PHONE HAS NO HOVER AT ALL, and not by oversight: the
   build wraps every :hover rule on the site in (hover:hover) and (pointer:fine)
   MECHANICALLY, which is correct — on touch, :hover latches until you tap
   somewhere else — and it also means every rule that drives these rows and cards
   is unreachable there. So a phone got four rows and two tickets with no state
   of any kind. Position is the only input it has, and .act is the same treatment
   on a different driver: the script marks whichever row or ticket is nearest a
   reading line that leads the scroll.
   ⚠️ These must NOT be written as :hover rules or folded into the ones above.
   The guard transform would put them straight back behind (hover:hover), which
   is precisely the query that cannot match on the device they exist for.
   The scope class sits on main.wrap rather than on .list, because the tickets
   are in .invite and both families take the same driver. */
.wrap.scrolly .entry.act{padding-left:1.3rem;
  background:linear-gradient(90deg,
    color-mix(in srgb,var(--accent) 7%,transparent),transparent 42%)}
.wrap.scrolly .entry.act::before{transform:scaleY(1)}
.wrap.scrolly .entry.act i{color:var(--accent-t)}
.wrap.scrolly .inv.act{transform:translateY(-4px);
  border-color:color-mix(in srgb,var(--ia) 44%,var(--rule));
  box-shadow:0 24px 50px -28px color-mix(in srgb,var(--ia) 65%,transparent)}
.wrap.scrolly .inv.act::before{opacity:1}
.wrap.scrolly .inv.act::after{background-size:2px 15px}
.wrap.scrolly .inv.act .inv-s{background:color-mix(in srgb,var(--ia) 18%,transparent);
  transform:translateX(5px) rotate(1.15deg);
  box-shadow:-7px 0 12px -7px rgba(0,0,0,.6)}
.wrap.scrolly .inv.act .inv-s::before{opacity:.45}
/* If a fine pointer is ALSO present — a narrow desktop window, which is how this
   is testable without reaching for a phone — hover would mark a second row and
   two would read as active at once. Scroll wins while scrolly is on. */
@media (hover:hover) and (pointer:fine){
  .wrap.scrolly .entry:hover{background:none;padding-left:.4rem}
  .wrap.scrolly .entry:hover::before{transform:scaleY(0)}
  .wrap.scrolly .entry.act:hover{padding-left:1.3rem;
    background:linear-gradient(90deg,
      color-mix(in srgb,var(--accent) 7%,transparent),transparent 42%)}
  .wrap.scrolly .entry.act:hover::before{transform:scaleY(1)}
}
@media (prefers-reduced-motion:reduce){
  .wrap.scrolly .inv.act{transform:none}
  .wrap.scrolly .inv.act .inv-s{transform:none}
}

.inv-h{display:flex;align-items:center;gap:.6rem}
/* A small mark per card, animated in a way that means something: the plus draws
   itself open (an invitation to add), and the three dots light in sequence (a
   list of names filling up). */
.inv-m{position:relative;width:26px;height:26px;flex:0 0 26px;border-radius:8px;
  display:grid;place-items:center;color:var(--ia);
  background:color-mix(in srgb,var(--ia) 14%,transparent);
  border:1px solid color-mix(in srgb,var(--ia) 34%,transparent)}
.inv-m svg{width:14px;height:14px;display:block;overflow:visible}
/* ⚠️ transform-origin belongs on the BASE rule, not the hover rule. It was set
   only while hovered, so on the way back the origin reverted to the default —
   the centre of the line's own bounding box, not the centre of the mark — and
   the stroke swung in from somewhere else entirely instead of unwinding. Both
   ends of a reversible transition need the same pivot. */
.inv-m .pv,.inv-m .ph{stroke:currentColor;stroke-width:2;stroke-linecap:round;
  transform-origin:7px 7px;
  transition:transform .52s cubic-bezier(.34,1.12,.42,1)}
.inv:hover .inv-m .pv{transform:rotate(90deg)}
.inv-m .ln{stroke:currentColor;stroke-width:2;stroke-linecap:round;
  transform-origin:2px 7px;opacity:.55;
  transition:transform .5s cubic-bezier(.34,1.1,.44,1),opacity .4s ease}
.inv-m .ln:nth-child(2){transition-delay:.06s}
.inv-m .ln:nth-child(3){transition-delay:.12s}
.inv:hover .inv-m .ln{opacity:1}
.inv:hover .inv-m .ln:nth-child(2){transform:scaleX(1.5625)}
.inv:hover .inv-m .ln:nth-child(3){transform:scaleX(2.7778)}

.inv .ik{font-family:var(--mono);font-size:.6rem;letter-spacing:.15em;
  text-transform:uppercase;color:var(--ia-t)}
.inv h3{font-family:var(--display);font-size:1.24rem;font-weight:750;letter-spacing:-.025em;
  color:var(--ink);margin:.75rem 0 .4rem}
.inv p{font-family:var(--serif);font-size:.95rem;line-height:1.62;color:var(--ink2);margin:0}
/* The arrow lives in the stub now, where the thumb would go. */
.inv .arw{display:grid;place-items:center;width:22px;height:22px;border-radius:50%;
  color:var(--ia-t);background:color-mix(in srgb,var(--ia) 14%,transparent);
  transition:background .3s}
/* Drawn rather than typed. The arrow glyph came in at whatever weight the mono
   face had, which was far too thin beside the display type it sits under. */
/* ⚠️ A ROTATED SQUARE IS WIDER THAN ITS SIDE. The head is a 6.2px box turned 45deg,
   so its tip reaches 6.2/sqrt(2) = 4.38px from its own centre, not 3.1 — at right:.5px
   the point stuck 0.78px out of an 11px box that place-items:center was centring.
   right must be at least 4.38-3.1 = 1.28 for the ink to stay inside; 12px and
   1.3px puts the tip at 11.98 and the drawn arrow centred on the box it is in. */
.inv .arw i{position:relative;display:block;width:12px;height:9px;
  transition:transform .38s cubic-bezier(.34,1.1,.44,1)}
.inv .arw i::before{content:"";position:absolute;left:0;top:3.6px;width:9.5px;height:1.9px;
  border-radius:1px;background:currentColor}
.inv .arw i::after{content:"";position:absolute;right:1.3px;top:1.4px;width:6.2px;height:6.2px;
  border-right:1.9px solid currentColor;border-top:1.9px solid currentColor;
  border-radius:0 1px 0 0;transform:rotate(45deg)}
.inv:hover .arw{background:color-mix(in srgb,var(--ia) 26%,transparent)}
.inv:hover .arw i{transform:translateX(3px)}
@media (prefers-reduced-motion:reduce){
  .inv:hover .arw i{transform:none}
  .inv:hover .inv-m .ln{transform:none;opacity:1}
}

/* A section label between the two invite rows. Without it the six cards read as
   one undifferentiated grid, which is exactly the collapse the three page families
   exist to avoid. */
/* ⚠️ KEPT ON PURPOSE THOUGH NOTHING CURRENTLY USES IT. Its only element was the
   -The record- label above the changelog row, which is withdrawn from the landing
   page rather than deleted. Removing this would make the -uncomment to restore-
   note above a lie: the row would come back unstyled. */
.lab-sec{display:block;margin:1.9rem 0 .7rem}

/* The switch sits at the BOTTOM here rather than in the top-right, at Harkirat's
   request: on a landing page the masthead should be the only thing competing for
   the top of the screen. */
.tray{margin-top:clamp(1.8rem,5vh,2.8rem);padding-top:1.4rem;border-top:1px solid var(--rule);
  display:flex;align-items:center;gap:.7rem}
.tray .lab{margin-right:auto}
</style></head><body>
<!-- ⚠️ THE LANDING PAGE HAD NO FILTER DEFS AT ALL until the morph port — it is the
     one template that never carried GOO_SVG, because it is also the one without a
     nav bar to put an indicator in. It now needs them for the reveal's mark and
     for the liquid cursor, and a filter that nothing on a given page references
     costs nothing: the <svg> is 0x0 and hidden. -->
<a class="skip" href="#main">Skip to content</a>\n${GOO_SVG}
<main class="wrap" id="main" tabindex="-1">
  <div class="top">
    ${wordmark(null)}
    ${repoBtn}
    ${installBtn()}
  </div>
  <span class="lab">Legal</span>
  <h1>The fine print,<br>in plain sight.</h1>
  <p class="lede">${esc(lede)}</p>
  <div class="list">${rows}</div>
  <div class="invite">${invites}</div>
  <div class="foot">
    <p class="contact">Questions, corrections, or a privacy request — reach <a class="dh" href="${DISCORD_URL}" target="_blank" rel="noopener noreferrer" data-tip="Message on Discord">diorswrld</a> on Discord.</p>
    ${emailReveal}
  </div>
  <div class="tray">
    <span class="lab">Appearance</span>
    ${themeBtn()}
  </div>
  <!-- The trademark notice sits last and reads quietest. It is an obligation, not
       an invitation, and it was competing with the contact block for the end of
       the page — which is the one place a reader is actually deciding what to do
       next. Still on every page, still full opacity: quiet is a matter of size and
       placement, never of contrast. -->
  <p class="disc fine">${TRADEMARK_NOTE}</p>
</main>
<script>${THEME_JS}${MORPH_JS}</script>
</body></html>`;
}

/* ───────────────────────── source location + head strip ────────────────── */

// The Markdown sources live in docs/legal; the plain-text instruments live at the
// repo root. One helper so build() and verify() can never disagree about where a
// page's source is — they read it independently, and a mismatch there would make
// the verifier compare a page against the wrong file and still report 100%.
// Three source locations now: docs/legal/ (the default), the repo root (`root`),
// and docs/ (`docs`, the three chronicle records).
const sourcePath = page => page.root
    ? path.join(ROOT, page.file)
    : page.docs
        ? path.join(ROOT, 'docs', page.file)
        : path.join(SRC, page.file);

// Two output directories now: public/legal/ and public/changelog/. Everything that
// reads a built page goes through this rather than joining OUT, so a page in the
// new directory cannot be silently skipped by a gate that only knows the old one.
const outDirFor = page => dirOf(page) === 'legal'
    ? OUT
    : path.join(ROOT, 'public', dirOf(page));
const outPath = page => path.join(outDirFor(page), page.out);

// Both strips are shared with verify() for the same reason: whatever build()
// removes from the body, the verifier must not expect to find in it.
// ⚠️ The continuation clause is load-bearing. These fields are WRAPPED in the
// source — "**Applies to:** ... and the website" / "these documents are published
// on (the "Site")" is one logical line across two — and `.*$` stops at the first
// newline, so the remainder survived the strip and rendered as an orphaned
// sentence fragment directly under the masthead on both Terms and Privacy. It
// read as though a paragraph had been cut in half, because it had been. The
// trailing group consumes any following line that is not blank, another **field**,
// a rule, a heading or a quote — i.e. exactly the wrapped remainder and nothing
// past the head block. Verified against both files: 47 and 36 characters removed,
// and §1.1's operative definition of the Site untouched.
const stripMdHead = md => md
    .replace(/^#\s+.*$/m, '')
    .replace(/^\*\*(?:Effective date|Version|Applies to):\*\*[^\n]*(?:\n(?![ \t]*$|\*\*|---|#|>)[^\n]*)*/gm, '')
    .trim();

// Drops a plain-text document's own title block, which the masthead renders
// instead. Two shapes exist across these files and both must go, or the page
// prints its own title twice:
//   LICENSE — a title line followed by "Version 1.0, 28 July 2026"
//   NOTICE  — a banner-delimited block whose title spans TWO lines
// Only the title block. The copyright line below it is operative text and stays.
const stripTextHead = txt => {
    const banner = /^\s*={3,}\n[\s\S]*?\n={3,}\n/;
    if (banner.test(txt)) return txt.replace(banner, '');
    return txt.replace(/^[^\n]*\nVersion\s+[\d.]+,[^\n]*\n/, '');
};

/* ───────────────────────────────── build ───────────────────────────────── */

// Which warm treatments actually fired, per page. Populated by build() and read by
// warmStructAudit() — kept outside build() so the gate cannot be handed a fresh
// empty object and report a clean pass on nothing.
const warmResults = {};

// Same idea for the chronicle pages: what each one actually rendered, read back by
// chronicleStructAudit(). Populated by build(), declared out here so the gate can
// never be handed a fresh empty object and report a clean pass on nothing.
const chronicleResults = {};

/**
 * Everything scripts/lib/chronicle.js needs from this file, handed over explicitly.
 *
 * The dependency runs ONE WAY on purpose. Sharing these by moving them into a
 * common module would have meant lifting roughly two thousand lines out of the file
 * that had just absorbed 27 commits of change — a refactor with real regression
 * surface, bought for no benefit the parameter does not already provide. chronicle.js
 * asserts every key is present before it renders anything (requireChrome), so a
 * missing piece fails the build naming the piece, rather than producing a page with
 * a blank header that would still pass the content gate.
 */
const CHROME = {
    esc, parseBlocks, linkifyRefs, slug,
    TOKENS, COMPONENT_CSS, SWITCHER_CSS, THEME_BOOT, THEME_JS, NAV_JS, GOO_SVG,
    MORPH_JS,
    wordmark, repoBtn, installBtn, themeBtn, navSwitcher, mobileNav, pageFoot,
};

function build() {
    fs.mkdirSync(OUT, { recursive: true });
    const built = [];

    for (const page of PAGES) {
        const raw = fs.readFileSync(sourcePath(page), 'utf8');
        // Root sources render into legal/, one level below where they were authored.
        LINK_BASE = page.root ? '../' : '';
        const meta = [];
        let parsed;
        let note = '';

        if (page.kind === 'text') {
            // The licence carries its version on its second line
            // ("Version 1.0, 28 July 2026") rather than in a metadata block.
            const vm = raw.match(/^Version\s+([\d.]+),\s*(.+)$/m);
            if (vm) {
                meta.push(`Effective <b>${esc(vm[2].trim())}</b>`);
                meta.push(`Revision <b>${esc(vm[1].trim())}</b>`);
            }
            meta.push('Ontario, Canada');
            parsed = parsePlainLegal(stripTextHead(raw));
            // Stated on the page itself, not just in a build comment: this render
            // is for reading, and the plain-text file is the instrument. Without
            // this a reader has two copies and no way to know which governs.
            //
            // Named from page.file rather than hardcoded — this said "the
            // plain-text LICENSE" on the NOTICE page, pointing a reader at the
            // wrong document to resolve a discrepancy in the one they were reading.
            // The download sits HERE rather than in the masthead because this is
            // the one place that explains why the plain-text file matters: it is
            // the instrument, and the page you are reading is not. A reader who
            // needs to keep or quote the governing text wants it at that moment.
            note = `<div class="authoritative">` +
                `<p>This page is a formatted reading copy. ` +
                `The <a href="../${page.file}">plain-text ${esc(page.file)}</a> is the ` +
                `authoritative instrument, and governs if the two ever differ.</p>` +
                `<a class="dl" href="../${page.file}" download="${esc(page.file)}.txt" data-tip="Download the plain text">` +
                `<span class="dl-i" aria-hidden="true"></span>` +
                `Download ${esc(page.file)}</a></div>`;
        } else {
            // Pull the metadata straight out of the document, so the page can never
            // advertise a version or date the source doesn't actually carry.
            const ver = (raw.match(/^\*\*Version:\*\*\s*(.+)$/m) || [])[1];
            const eff = (raw.match(/^\*\*Effective date:\*\*\s*(.+)$/m) || [])[1];
            if (eff) meta.push(`Effective <b>${esc(eff.trim())}</b>`);
            if (ver) meta.push(`Revision <b>${esc(ver.trim())}</b>`);
            meta.push('Ontario, Canada');
            parsed = parseBlocks(stripMdHead(raw));
        }

        const ids = new Set(parsed.toc.map(t => t.id));
        // Stripping the metadata block leaves the rule that separated it from the
        // content as the first element, which renders as dead space under the
        // masthead. Drop a leading (or trailing) rule.
        const html = note + linkifyRefs(
            parsed.html.replace(/^\s*<hr>\s*/, '').replace(/\s*<hr>\s*$/, ''),
            ids
        );

        writePage(path.join(OUT, page.out), shell({
            ...page, body: html, toc: parsed.toc, meta
        }));

        const xrefs = (html.match(/class="xref"/g) || []).length;
        built.push({ ...page, sections: parsed.toc.filter(t => !t.sub).length });
        console.log(`  ✓ ${page.out}  ${parsed.toc.filter(t => !t.sub).length} sections · ${xrefs} live §-refs · ${(html.length / 1024).toFixed(1)} KB`);
    }

    // The invitation pages. Same Markdown parser, different template — and they
    // are appended to `built` so the verifier covers them exactly like the rest.
    // An unverified page is the one that quietly rots.
    for (const page of EXTRA_PAGES) {
        const md = fs.readFileSync(sourcePath(page), 'utf8');
        LINK_BASE = page.root ? '../' : '';
        const parsed = parseBlocks(stripMdHead(md));
        const ids = new Set(parsed.toc.map(t => t.id));
        // Compose BEFORE linkifying: warmCompose matches on our own block markup,
        // and linkifyRefs only ever rewrites text nodes, so it is safe either way —
        // but composing first keeps the patterns it matches against simple.
        const comp = warmCompose(parsed.blocks, page.out);
        const html = linkifyRefs(comp.body, ids);
        warmResults[page.out] = comp.hits;
        writePage(path.join(OUT, page.out), warmShell({
            ...page, body: html, sig: comp.sig, spine: comp.spine
        }));
        built.push({ ...page, sections: parsed.toc.filter(t => !t.sub).length, extra: true });
        const applied = Object.entries(comp.hits).map(([k, v]) => `${k}×${v}`).join(' ');
        console.log(`  ✓ ${page.out}  ${parsed.toc.filter(t => !t.sub).length} sections · ${(html.length / 1024).toFixed(1)} KB · ${applied}`);
    }

    // The chronicle family. Same Markdown parser again, a third template, and the
    // pages are appended to `built` so every gate covers them exactly like the
    // rest — an unverified page is the one that quietly rots.
    fs.mkdirSync(path.join(ROOT, 'public', 'changelog'), { recursive: true });
    for (const page of CHRONICLE_PAGES) {
        const md = fs.readFileSync(sourcePath(page), 'utf8');
        LINK_BASE = '';
        const parsed = parseChronicle(stripMdHead(md), CHROME);
        const stats = `${parsed.entries.length} entries` +
            (parsed.parts.length ? ` · ${parsed.parts.length} parts` : '');
        const res = chronicleShell({ page, parsed, C: CHROME, stats });
        writePage(outPath(page), res.html);
        chronicleResults[page.out] = {
            entries: res.entries, parts: res.parts, lessons: res.lessons,
            sourceEntries: (md.match(/^## /gm) || []).length,
            // Expectations read from the SOURCE, evidence read from the written
            // FILE. Neither side comes from the renderer, so a renderer that drops
            // a heading cannot also erase the expectation that it should not have.
            headings: (md.match(/^#{1,2} .*$/gm) || []).map(h => h.replace(/^#+\s*/, '')),
            rendered: ' ' + fs.readFileSync(outPath(page), 'utf8')
                .replace(/<script[\s\S]*?<\/script>/g, ' ')
                .replace(/<style[\s\S]*?<\/style>/g, ' ')
                .replace(/<[^>]+>/g, ' ')
                .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() + ' ',
        };
        built.push({ ...page, sections: parsed.entries.length, chronicle: true });
        console.log(`  ✓ ${dirOf(page)}/${page.out}  ${res.entries} entries · ` +
            `${res.parts} parts · ${res.lessons} lessons · ${(res.html.length / 1024).toFixed(1)} KB`);
    }

    // Only the numbered legal set goes in the numbered list.
    writePage(path.join(OUT, 'index.html'), indexPage(built.filter(p => !p.extra && !p.chronicle)));
    console.log('  ✓ index.html');
    buildCompanions();
    return built;
}

/**
 * TERMS.md and PRIVACY.md link to ../LICENSE, ../NOTICE, and
 * ../CONTRIBUTING.html — the licence and CLA a reader is entitled to reach from
 * the documents that cite them. Those resolve one level ABOVE the legal/
 * directory, so the deployed site root has to carry them or every one of those
 * links 404s in a published legal document. Caught exactly that way: the first
 * deploy plan uploaded public/legal alone, which would have shipped three dead
 * links out of documents whose whole value is being verifiable.
 *
 * LICENSE and NOTICE are served as plain text on purpose — they are the
 * authoritative instruments, and rendering them through this parser would put a
 * lossy transformation between the reader and the operative wording. CONTRIBUTING
 * is prose about a process, so it renders like the other pages.
 */
function buildCompanions() {
    const root = path.join(ROOT, 'public');

    for (const f of ['LICENSE', 'NOTICE']) {
        fs.copyFileSync(path.join(ROOT, f), path.join(root, f));
        console.log(`  ✓ ${f} (verbatim)`);
    }

    // The landing page lives at legal/index.html, so the site ROOT would otherwise
    // 404 — confirmed live on the first deploy. A redirect is used rather than a
    // second copy of the index at the root, because two landing pages drift and
    // the pages' own nav ("Dior's Builds" → "./") already resolves to legal/.
    // /security is a memorable route that has to keep working even if the source
    // repository goes private (TERMS §7.1 reserves exactly that). SECURITY.md is
    // deliberately repo-only — it serves GitHub's "Report a vulnerability" flow,
    // which needs a public repo to exist at all — but the REPORTING ROUTE must
    // not depend on that, and a researcher needs it precisely when something is
    // wrong. The published Contributing page already carries the full section,
    // so this points at it rather than duplicating the text into a second place
    // that could then drift.
    // /install is a shareable route for the Discord authorization link — short
    // enough to say out loud, and stable even if the OAuth URL gains or loses
    // parameters later. It is built FROM INSTALL_URL rather than written out
    // again, so the redirect and every install button on the site can never
    // disagree about the client id.
    //
    // 302, not 301: a permanent redirect gets cached hard by browsers, and this
    // one points at a third party whose URL shape is not ours to fix forever.
    fs.writeFileSync(path.join(root, '_redirects'),
        '/ /legal/ 302\n'
        + '/security /legal/contributing#security-vulnerabilities 302\n'
        // The chronicle family's landing page. Pages already serves the directory
        // index, so this exists for the bare, no-slash form a person types or a
        // Discord message carries — /changelog, not /changelog/.
        + '/changelog /changelog/ 302\n'
        + `/install ${INSTALL_URL} 302\n`);
    console.log('  ✓ _redirects (/ → /legal/, /security → contributing#security, '
        + '/changelog → /changelog/, /install → Discord)');

    // CONTRIBUTING.md and CONTRIBUTORS.md ARE published now (2026-07-29 22:17 EDT), via
    // EXTRA_PAGES and warmShell. This reverses an earlier decision, so the reason
    // it was reversed is worth keeping: CONTRIBUTING was pulled the first time
    // because a link audit found it shipped four dead links and because it
    // documents working on a repo the reader might not be able to see. Both
    // objections are now answered — CONTRIBUTORS.md is published so that link
    // resolves, the rest degrade to inert text via PUBLISHED_TARGETS, and the
    // header carries a repo link on every page. linkAudit() enforces the first
    // part on every build rather than trusting this note.
}

/**
 * Guards the one failure mode that actually matters here: the parser silently
 * dropping content, which would publish an incomplete legal document. Compares
 * the visible text of each rendered page against its source and reports any
 * sentence-length run of source words that never made it through.
 */
function verify(built) {
    let bad = 0;
    // BOTH sides go through the identical reduction — lowercase, letters/digits
    // only, single-spaced. An earlier version filtered short words out of the
    // source but not the rendered text, so every run containing "of" or "the"
    // reported as missing. Comparing like with like is the whole point.
    const words = s => s
        .replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
        .toLowerCase().replace(/[^a-z0-9]+/g, ' ')
        .trim().split(' ').filter(Boolean);

    const RUN = 8;

    for (const page of built) {
        const out = fs.readFileSync(outPath(page), 'utf8');
        const rendered = ' ' + words(out
            .replace(/<script[\s\S]*?<\/script>/g, ' ')
            .replace(/<style[\s\S]*?<\/style>/g, ' ')
            .replace(/<[^>]+>/g, ' ')
            // EVERY entity, not a hand-picked four. An undecoded entity does not
            // vanish under words()' [^a-z0-9] pass — it becomes a WORD. `&middot;`
            // reduces to "middot" and `&#9825;` to "9825", and that fabricated word
            // lands inside an otherwise-intact source run and breaks it. Measured on
            // this build: 12 entities across 7 pages, and "middot" alone accounted
            // for a reported miss of "name role harkirat mangat..." whose every word
            // was in fact rendered.
            //
            // This cannot open a hole for real content loss, which is the only reason
            // it is safe: an entity resolves to exactly ONE character, so decoding
            // can only ever REMOVE a fabricated word, never supply a source word the
            // page does not visibly render. Same principle as the ordered-list and
            // stop-word fixes below — compare like with like.
            //
            // Runs after tag-stripping on purpose, so a decoded `<` cannot be mistaken
            // for markup. The trailing catch-all covers named entities nothing emits
            // yet: every one is a single character that words() would reduce to a
            // separator anyway (`&eacute;` → é → ' ', exactly as the source side
            // reduces it), so a future `&hellip;` cannot silently revive this bug.
            //
            // ⚠️ ORDER: `&amp;` is decoded LAST, and the named catch-all skips it.
            // A source that DISCUSSES an entity writes it literally — DEVLOG explains
            // this very bug with `&middot;` inside a code span — and that renders as
            // `&amp;middot;`, which a reader sees as the visible text "&middot;".
            // Decoding &amp; first turned it into a real `&middot;` that the catch-all
            // below then deleted, so a word the page genuinely displays was scored as
            // missing. Decoding it last leaves the literal text intact, and a real
            // `&middot;` in the output still reduces to a separator exactly as before.
            .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
            .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
            .replace(/&(?!amp;)\w+;/g, ' ')
            .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
            // Symmetry: URLs are stripped from the source side below, so they must
            // go from here too. The plain-text licence prints a bare URL in its
            // contact block, which stays visible after tag-stripping and split an
            // otherwise-intact run — a false miss caused purely by the two sides
            // being reduced differently. Comparing like with like is the point.
            .replace(/https?:\/\/\S+/g, ' ')
        ).join(' ') + ' ';

        // Mirror build()'s own removals: the H1 and the metadata block are moved
        // into the masthead by design, so they are not expected in the body.
        const rawSrc = fs.readFileSync(sourcePath(page), 'utf8');
        let cleaned = page.kind === 'text' ? stripTextHead(rawSrc) : stripMdHead(rawSrc);

        // ORDER MATTERS, and getting it wrong is silent. The Markdown link unwrap
        // MUST run before URLs are stripped: `https?://\S+` is greedy to the next
        // space, so it eats the link's own closing paren, and the unwrap pattern's
        // `[^)]*` then runs on across newlines to the next `)` anywhere in the
        // document — swallowing real prose and reporting it as missing. That is
        // exactly what happened here (3 false misses in TERMS, 5 in PRIVACY).
        if (page.kind === 'md') {
            cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
        }
        cleaned = cleaned
            .replace(/https?:\/\/\S+/g, ' ')
            .replace(/<!--[\s\S]*?-->/g, ' ');

        if (page.kind === 'text') {
            // The plain-text licence has no Markdown to unwrap. Its `===` banner
            // rules are pure decoration and are not rendered, so they must not be
            // expected in the output either.
            cleaned = cleaned.replace(/^={3,}$/gm, ' ');
        } else {
            // Ordered-list markers ("1.", "2.") are structure, not content: an
            // <ol> renders its numbers with CSS counters, so the literal digit
            // correctly never appears in the rendered text. Without this the
            // check reports ~17 false misses per document.
            cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, ' ');
            // Code-fence lines are structure too, and the language tag on them is
            // metadata: it is rendered as a CSS-generated corner label, so it is
            // deliberately absent from the document text. Same reasoning as above —
            // the alternative is four permanent false misses naming "bash".
            cleaned = cleaned.replace(/^\s*```+\s*[\w-]*\s*$/gm, ' ');
        }

        // A chronicle page DECOMPOSES its entry headings. "## v2.47.0 — 2026-08-01
        // 03:05 EDT (#61) — Title" is rendered as a title plus separate metadata
        // chips, in a different order and with the punctuation gone; the devlog's
        // h1 dividers move too. Every word still reaches the page — but a run that
        // straddles a heading no longer matches, exactly as the legal masthead's
        // fields do not, which is why stripMdHead() removes those from this side.
        // Same principle, same place: whatever build() moves, verify() must not
        // expect to find in its original position.
        //
        // This does NOT leave headings unchecked. chronicleStructAudit() asserts
        // every source heading produced an entry AND that its text reached the page
        // — a different property, in its own gate, rather than a hole in this one.
        // SEGMENTS, not one flat stream. Everything except a chronicle page is a
        // single segment, which is byte-for-byte the behaviour this check has always
        // had — the legal pages must stay at 100% and this must not be what moves them.
        //
        // A chronicle page is segmented at its entry boundaries because its headings
        // are removed just above. Without the split, the tail of one release ran
        // straight into the head of the next in the SOURCE while the page still had
        // the heading between them, manufacturing ~96 "missing" runs that no reader
        // would ever miss. Segmenting also makes the check stricter than the flat
        // version was: a run can no longer straddle two releases and match on text
        // that happens to sit next to it.
        const segments = page.chronicle
            ? cleaned.split(/^#{1,2}\s+.*$/gm).map(s => s.trim()).filter(Boolean)
            : [cleaned];

        const missing = [];
        let total = 0;
        for (const seg of segments) {
            const srcWords = words(seg);
            total += Math.floor(srcWords.length / RUN);
            for (let i = 0; i + RUN <= srcWords.length; i += RUN) {
                const run = srcWords.slice(i, i + RUN).join(' ');
                if (!rendered.includes(' ' + run + ' ')) missing.push(run);
            }
        }
        total = Math.max(1, total);
        const srcWords = words(cleaned);
        const pct = ((1 - missing.length / total) * 100).toFixed(1);
        if (missing.length) {
            bad++;
            console.log(`  ✗ ${page.out}: ${pct}% of source runs present; ${missing.length}/${total} missing`);
            missing.slice(0, 6).forEach(m => console.log(`      · "${m}"`));
        } else {
            console.log(`  ✓ ${page.out}: 100% of source content present (${srcWords.length} words, ${total} runs checked)`);
        }
    }
    return bad === 0;
}

/**
 * Walks every built page and resolves each internal href against the deploy tree.
 *
 * This exists because it caught SEVEN dead links the first time it ran, on output
 * that looked completely fine and reported 100% content present — the content
 * verifier and this check fail on genuinely different things. A legal document's
 * value is that its citations can be followed, so a 404 behind "see the LICENSE"
 * is a real defect, not cosmetic. External URLs are not fetched (a build must not
 * depend on the network); only same-site paths are resolved.
 */
function linkAudit() {
    const root = path.join(ROOT, 'public');
    const walk = d => fs.readdirSync(d, { withFileTypes: true })
        .flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);

    let checked = 0;
    const dead = [];
    for (const file of walk(root).filter(f => f.endsWith('.html'))) {
        const html = fs.readFileSync(file, 'utf8');
        for (const m of html.matchAll(/href="([^"]+)"/g)) {
            const raw = m[1];
            if (/^(https?:|mailto:|#|data:)/.test(raw)) continue;
            const rel = raw.split('#')[0];
            if (rel === '') continue;
            checked++;
            let target = path.resolve(path.dirname(file), rel);
            if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
                target = path.join(target, 'index.html');
            }
            if (!fs.existsSync(target)) {
                dead.push(`${path.relative(ROOT, file)} → ${raw}`);
            }
        }
    }

    if (dead.length) {
        console.log(`  ✗ ${dead.length} DEAD internal link(s) of ${checked} checked:`);
        dead.forEach(d => console.log(`      ${d}`));
        console.log('    Either publish the target, or add it to PUBLISHED_TARGETS so the');
        console.log('    reference renders as plain text instead of a broken link.');
        return false;
    }
    console.log(`  ✓ all ${checked} internal links resolve`);
    return true;
}

/**
 * Third gate, and it exists for the same reason the second one does.
 *
 * The plain-text sources hold their dependency and trademark tables together with
 * runs of spaces — the ALIGNMENT is the structure. Joining those rows into a
 * paragraph destroys the table while changing not one word, so verify() still
 * reports 100% content present and linkAudit() still finds every link. Two green
 * gates, a wrecked document. This checks the property they can't see.
 *
 * The invariant: every column-aligned source line must end up inside a <pre>, or
 * be a heading. Headings are the legitimate exception — a clause number followed
 * by two spaces ("4A.1  EMOJI") looks column-aligned to any simple test, and an
 * earlier version of this check reported five of them as defects.
 */
function structureAudit(built) {
    const norm = s => s.replace(/\s+/g, ' ').trim();
    let bad = 0;

    for (const page of built.filter(p => p.kind === 'text')) {
        const html = fs.readFileSync(outPath(page), 'utf8');
        const inPre = new Set(
            [...html.matchAll(/<pre[^>]*>([\s\S]*?)<\/pre>/g)]
                .flatMap(m => m[1].replace(/<[^>]+>/g, '').split('\n'))
                .map(norm)
        );
        const inHead = new Set(
            [...html.matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/g)]
                .map(m => norm(m[1].replace(/<[^>]+>/g, ' ')))
        );

        const aligned = fs.readFileSync(sourcePath(page), 'utf8')
            .split('\n').filter(l => /\S {2,}\S/.test(l));
        const lost = aligned.filter(l => {
            const n = norm(l);
            if (inPre.has(n)) return false;
            // A heading line: its number and text both land in the heading, but
            // joined differently, so compare on the collapsed form.
            return ![...inHead].some(h => h.includes(n) || n.includes(h.replace(/\s*¶$/, '')));
        });

        if (lost.length) {
            bad++;
            console.log(`  ✗ ${page.out}: ${lost.length} column-aligned line(s) of ${aligned.length} not preserved:`);
            lost.slice(0, 6).forEach(l => console.log(`      ${JSON.stringify(l.slice(0, 74))}`));
        } else {
            console.log(`  ✓ ${page.out}: all ${aligned.length} column-aligned lines preserved verbatim`);
        }
    }
    return bad === 0;
}

/**
 * Fourth gate: a cross-reference that SHOULD be a link and isn't.
 *
 * The other three can only inspect what was emitted. This one compares the source
 * against the output: for every Markdown link whose target is a published file,
 * the rendered page must contain an anchor to it. A reference that quietly
 * degraded to inert text emits no href, so linkAudit() has nothing to resolve and
 * reports success — which is exactly how Terms' and Privacy's references to each
 * other sat dead on the live site while all three gates were green. The trigger
 * was case: PRIVACY.md became PRIVACY.html and the allowlist held privacy.html.
 */
function crossRefAudit(built) {
    let bad = 0;
    let examined = 0;

    for (const page of built.filter(p => p.kind === 'md')) {
        const src = fs.readFileSync(sourcePath(page), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
        const html = fs.readFileSync(outPath(page), 'utf8');
        const pageOut = outDirFor(page);

        const want = new Set();
        for (const m of src.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)) {
            if (/^https?:|^mailto:/.test(m[2])) continue;
            const href = m[2].replace(/\.md(#.*)?$/i, '.html$1').replace(/^\.\.\/\.\.\//, '../');
            const rel = href.split('#')[0];
            if (!rel) continue;
            // GROUND TRUTH IS THE DEPLOY TREE, not PUBLISHED_TARGETS.
            //
            // The first version of this gate asked resolvePublished() whether the
            // target was published — the same function whose bug it existed to
            // catch. Breaking that function therefore emptied `want`, and the gate
            // reported "all 0 cross-references" and PASSED. A check that draws its
            // expectations from the code under test cannot fail. Resolving against
            // the files actually written to public/ is independent of the
            // allowlist, the case handling, and the rewrite rules alike.
            //
            // Case-insensitive on purpose: the filesystem here is case-insensitive,
            // so existsSync would happily confirm PRIVACY.html and hide the very
            // mismatch being hunted. The directory listing is compared instead.
            // BOTH candidate depths are tried: the link as written, and the same
            // link lifted one level. A root-authored page renders into legal/, so
            // its bare `LICENSE` is correct only as `../LICENSE` — and checking
            // just the as-written form made this gate SKIP those links entirely
            // rather than flag them, which is how the licence stayed unlinked in
            // four places on the Contributing page while every gate was green.
            const base = path.basename(rel);
            const deployRoot = path.join(ROOT, 'public');
            let found = null;
            for (const cand of [rel, '../' + rel]) {
                // Resolved against the page's OWN output directory, not a hardcoded
                // OUT — the chronicle pages render into public/changelog/, and
                // resolving their links from public/legal/ would ask the wrong
                // directory whether the target exists.
                const dir = path.resolve(pageOut, path.dirname(cand));
                // MUST stay inside the deploy tree. Without this guard the lifted
                // candidate walked out of public/ and matched the repo's own
                // models/UserPreference.js, reporting a correctly-inert reference
                // as a defect. Only files that are actually shipped count.
                if (dir !== deployRoot && !dir.startsWith(deployRoot + path.sep)) continue;
                if (!fs.existsSync(dir)) continue;
                const actual = fs.readdirSync(dir).find(e => e.toLowerCase() === base.toLowerCase());
                if (actual) { found = path.join(path.dirname(cand), actual).replace(/\\/g, '/'); break; }
            }
            if (found) want.add(found);
        }

        examined += want.size;
        const missing = [...want].filter(t => !html.includes(`href="${t}`));
        if (missing.length) {
            bad++;
            console.log(`  ✗ ${page.out}: ${missing.length} reference(s) to a DEPLOYED file rendered as inert text:`);
            missing.forEach(t => console.log(`      → ${t}  (exists in public/, but no anchor points at it)`));
        } else {
            console.log(`  ✓ ${page.out}: ${want.size} cross-reference(s) to deployed files, all live links`);
        }
    }

    // A gate that examined nothing has verified nothing, and must not read as a
    // pass. These documents cite each other constantly; zero means the matcher
    // broke, not that the documents stopped cross-referencing.
    if (examined === 0) {
        console.log('  ✗ examined 0 cross-references — the matcher is broken, not the documents');
        return false;
    }
    return bad === 0;
}

/**
 * Gate: every entry in a chronicle SOURCE became an entry on the page.
 *
 * The other gates cannot see this failure. verify() compares words, and a heading
 * that stops being parsed as a heading still contributes all of its words to the
 * body — that is precisely how v2.44.0's changelog entry lost its heading and was
 * absorbed into the entry above it with every content check still green. linkAudit
 * and crossRefAudit look at hrefs; structureAudit only looks at the plain-text
 * pages. So: count `## ` in the source, count entries rendered, and require them
 * to agree.
 *
 * The expectation comes from the SOURCE rather than from a re-run of the parser,
 * for the same reason WARM_STRUCT is declared rather than sniffed: a check that
 * derives its expectations from the code under test cannot fail.
 */
function chronicleStructAudit(results) {
    const bad = [];
    for (const [out, r] of Object.entries(results)) {
        // The heading half. verify() no longer looks at heading lines on these
        // pages (it cannot — they are decomposed and reordered), so the words in
        // them are checked HERE instead of nowhere. Compared on the same
        // letters-and-digits reduction verify() uses, so punctuation and the
        // rearranged order are not mistaken for loss.
        const flat = r.rendered;
        for (const h of r.headings) {
            const want = h.replace(/[^a-z0-9]+/gi, ' ').trim().toLowerCase();
            if (!want) continue;
            if (!want.split(' ').every(w => flat.includes(' ' + w + ' '))) {
                bad.push(`changelog/${out}: heading "${h.slice(0, 60)}" did not reach the page`);
            }
        }
        if (r.entries !== r.sourceEntries) {
            bad.push(`changelog/${out}: source has ${r.sourceEntries} "## " headings but ` +
                `${r.entries} entries rendered — an entry was dropped or two were merged`);
        }
        if (r.entries === 0) {
            bad.push(`changelog/${out}: rendered ZERO entries — the heading matcher is broken, ` +
                `not the document`);
        }
    }
    if (bad.length) {
        console.error('  ✗ chronicle structure:');
        bad.forEach(b => console.error(`      ${b}`));
        return false;
    }
    const line = Object.entries(results)
        .map(([o, r]) => `${o} ${r.entries}/${r.sourceEntries}`).join(' · ');
    console.log(`  ✓ every source entry rendered (${line})`);
    return true;
}

/**
 * Gate: the structural accessibility guarantees hold on every page.
 *
 * Three things, all Level A or close to it, all trivially checkable and none
 * visible to any other gate:
 *
 *  · a skip link exists, is the FIRST focusable element in the body, and its
 *    target id actually exists on the page. WCAG 2.4.1 Bypass Blocks — this site
 *    failed it everywhere until now: the bar carries nine nav tabs plus three
 *    controls, so a keyboard user tabbed through ~13 widgets before the document.
 *  · exactly one h1 per page.
 *  · the skip target is focusable (tabindex="-1"), because a plain <main> is not,
 *    and browsers have historically differed on whether a fragment jump moves
 *    focus there or only scrolls — which makes the link work visually and do
 *    nothing for a screen reader.
 *
 * Added because the first attempt at the skip link HALF applied: both warm pages
 * got the link and neither got the target, so two pages shipped a control that
 * jumped nowhere. A link to a missing anchor is worse than no link at all.
 */
/**
 * Parse every inline <script> in the built output and fail on a syntax error.
 *
 * ⚠️ THIS GATE EXISTS BECAUSE A BROKEN NAV SHIPPED AND EVERY OTHER GATE PASSED
 * (2026-08-01 22:05 EDT). A comment block was inserted one line below the `*​/`
 * that closed the previous comment, so the client script carried bare prose in
 * statement position. The whole indicator IIFE died at parse time: no tab had a
 * --cov, no group went hot, the pill never moved. The build reported content
 * complete, links resolving, contrast AA and no credentials — because not one of
 * those gates looks at whether the JavaScript it just wrote can be parsed.
 *
 * `node --check` on the generator cannot catch it either, and that is the trap:
 * this code lives inside a template literal, so to the generator it is a STRING.
 * It is syntactically perfect right up until a browser tries to run it.
 *
 * ⚠️ It shells out to `node --check` rather than using new Function(). Both would
 * find the error, but new Function() COMPILES the string inside this process,
 * and the honest description of this gate is "parse a file we just wrote to
 * disk" — a subprocess that can only ever parse cannot become an execution path
 * later, however the page content evolves. The temp file is written under
 * os.tmpdir() and removed straight after.
 */
function scriptSyntaxAudit(built) {
    const { execFileSync } = require('child_process');
    const tmp = path.join(require('os').tmpdir(), `db-script-check-${process.pid}.js`);
    let bad = 0, checked = 0;
    // Same page set a11yAudit() uses: every built page plus the landing page,
    // which is not in `built` because it has no Markdown source.
    for (const file of [...built.map(outPath), path.join(OUT, 'index.html')]) {
        const out = path.relative(path.join(ROOT, 'public'), file);
        const html = fs.readFileSync(file, 'utf8');
        const scripts = html.match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g) || [];
        scripts.forEach((block, i) => {
            const code = block.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '');
            if (!code.trim()) return;
            checked++;
            fs.writeFileSync(tmp, code);
            try { execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' }); }
            catch (e) {
                bad++;
                const msg = String(e.stderr || e.message).split('\n')
                    .find(l => /Error/.test(l)) || 'does not parse';
                console.log(`  ✗ ${out}: inline script #${i + 1} — ${msg.trim()}`);
            }
        });
    }
    try { fs.unlinkSync(tmp); } catch { /* nothing to clean up */ }
    if (!bad) console.log(`  ✓ all ${checked} inline scripts parse`);
    return bad === 0;
}

function a11yAudit(built) {
    const bad = [];
    const pages = [...built.map(outPath), path.join(OUT, 'index.html')];
    for (const file of pages) {
        const name = path.relative(path.join(ROOT, 'public'), file);
        const html = fs.readFileSync(file, 'utf8');

        const skip = html.match(/<a class="skip" href="#([\w-]+)"/);
        if (!skip) { bad.push(`${name}: no skip link (WCAG 2.4.1)`); continue; }

        const target = skip[1];
        const targetTag = html.match(new RegExp(`<[^>]*id="${target}"[^>]*>`));
        if (!targetTag) {
            bad.push(`${name}: skip link points at #${target}, which does not exist on the page`);
        } else if (!/tabindex="-1"/.test(targetTag[0])) {
            bad.push(`${name}: skip target #${target} is not focusable (needs tabindex="-1")`);
        }

        // FIRST focusable: nothing that can take focus may precede it in the body.
        const body = (html.match(/<body[^>]*>([\s\S]*)/) || [, ''])[1];
        const before = body.slice(0, body.indexOf('<a class="skip"'));
        if (/<(?:a\s|button|input|select|textarea|details)/.test(before)) {
            bad.push(`${name}: something focusable precedes the skip link, so it is not the first stop`);
        }

        const h1s = (html.match(/<h1[\s>]/g) || []).length;
        if (h1s !== 1) bad.push(`${name}: ${h1s} <h1> elements; expected exactly 1`);
    }
    if (bad.length) {
        console.error('  ✗ accessibility:');
        bad.forEach(b => console.error(`      ${b}`));
        return false;
    }
    console.log(`  ✓ all ${pages.length} pages: skip link first + target focusable, one h1`);
    return true;
}

/**
 * Gate: the text colours a page ships actually meet WCAG AA in BOTH themes.
 *
 * Added after measuring the chronicle pages and finding that every signal colour
 * failed catastrophically in light theme — 1.50, 1.16 and 1.47 against a 4.5
 * minimum, i.e. text a sighted reader cannot make out, covering the version
 * numerals, the dates and the operator line. `--ink3` failed in BOTH themes
 * (4.22 and 3.82) and carries most of the small monospace type on the site.
 *
 * None of this was visible to any other gate, and it was nearly missed by eye too:
 * the washed-out light-theme heading looked like the reveal animation mid-fade.
 * Contrast is arithmetic, so it should never have depended on noticing.
 *
 * Values are parsed from the BUILT stylesheet rather than from the constants that
 * produced it — the point is what shipped. Both the dark `:root` block and the
 * `:root[data-theme="light"]` override are checked, against that theme's own
 * background.
 */
const CONTRAST_MIN = 4.5;

function contrastAudit(built) {
    const srgb = c => (c /= 255) <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    const lum = h => {
        const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
        return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
    };
    const ratio = (a, b) => {
        const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
        return (x + 0.05) / (y + 0.05);
    };
    const norm = h => h.length === 4
        ? '#' + [1, 2, 3].map(i => h[i] + h[i]).join('') : h.toLowerCase();

    const bad = [];
    let checked = 0;
    for (const page of built) {
        const css = (fs.readFileSync(outPath(page), 'utf8')
            .match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1];
        // Only pages that declare their own world are covered; the legal templates
        // inherit the site tokens and are out of scope for this change.
        // ⚠️ EVERY matching block, merged in document order — not the first one.
        // The first version took `css.match(/:root\{...\}/)`, which is the legal
        // site's TOKENS block; `--sig` is declared in a LATER :root block, so it was
        // never read and the gate reported "63 pairs pass" while the light-theme
        // signals were still at 1.47:1. Proven blind by reverting a known-bad value
        // and watching it stay green, which is the only reason this was caught.
        // Later declarations win, exactly as the cascade resolves them.
        const merge = re => [...css.matchAll(re)].map(m => m[1]).join(';');
        const themes = [
            ['dark', merge(/:root\{([^}]*)\}/g)],
            ['light', merge(/:root\[data-theme="light"\]\{([^}]*)\}/g)],
        ];
        let base = {};
        for (const [name, block] of themes) {
            const vars = {};
            for (const m of block.matchAll(/--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,6})/g)) {
                vars[m[1]] = norm(m[2]);
            }
            if (name === 'dark') base = vars;
            const desk = vars.desk || base.desk;
            const card = vars.card || base.card;
            if (!desk) continue;
            for (const fg of ['sig', 'ink', 'ink2', 'ink3']) {
                const v = vars[fg] || base[fg];
                if (!v) continue;
                for (const [bgName, bg] of [['desk', desk], ['card', card]]) {
                    if (!bg) continue;
                    checked++;
                    const r = ratio(v, bg);
                    if (r < CONTRAST_MIN) {
                        bad.push(`${dirOf(page)}/${page.out} [${name}]: --${fg} ${v} on --${bgName} ` +
                            `${bg} is ${r.toFixed(2)}:1, below the ${CONTRAST_MIN}:1 AA minimum for small text`);
                    }
                }
            }
        }
    }
    if (bad.length) {
        console.error('  ✗ contrast below WCAG AA:');
        [...new Set(bad)].forEach(b => console.error(`      ${b}`));
        return false;
    }
    console.log(`  ✓ all ${checked} text/background pairs meet ${CONTRAST_MIN}:1 in both themes`);
    return true;
}

/**
 * Gate: markup the SHARED parser emits is styled by whatever template renders it.
 *
 * `parseBlocks()`, `inline()` and `linkifyRefs()` emit the same handful of classes
 * on every page, but each template carries its own stylesheet. When the chronicle
 * family was added, `.anchor` and `.xref` had rules only inside `shell()` — so the
 * new pages shipped every heading pilcrow permanently visible in the browser's
 * default link purple, and every §-cross-reference as a raw UA link.
 *
 * No existing gate could see it. The content was all present, the links all
 * resolved, the cross-references were live, the classes did not collide, and the
 * hover guard was clean. It was found by opening the page — which is exactly the
 * kind of thing that should not require someone to remember to look.
 *
 * The class list is DECLARED, not sniffed from the stylesheets, for the same reason
 * WARM_STRUCT is: a check that reads its expectations out of the thing it is testing
 * cannot fail. A class only has to be styled on a page that actually USES it.
 *
 * ⚠️ WHAT IT DOES NOT CATCH, stated so nobody trusts it further than it goes: it
 * asks only whether the template's stylesheet mentions the selector AT ALL. A class
 * that is styled but styled WRONGLY, or styled for one state and not another, passes
 * cleanly. It catches "this template forgot this class entirely" — which is the
 * failure that actually shipped — and nothing finer. Proven by removing every
 * `.anchor` rule from chronicle.js and watching all three pages fail; removing just
 * one of the four `.anchor` rules does NOT fail, and that is a real limit, not an
 * oversight.
 */
// Only classes that are MEANINGLESS unstyled belong here. `.ht` is deliberately
// absent: it is a structural hook that warmCompose() and headingInner() match on,
// it is an inline span that inherits its heading's type, and the warm pages have
// rendered correctly without a rule for it since they shipped. Listing it made the
// gate fire on three healthy pages on its first run — a check that flags working
// output gets muted, and a muted check catches nothing.
const PARSER_CLASSES = ['anchor', 'xref', 'ref'];

function parserStyleAudit(built) {
    const bad = [];
    let checked = 0;
    for (const page of built) {
        const html = fs.readFileSync(outPath(page), 'utf8');
        const css = (html.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1];
        for (const cls of PARSER_CLASSES) {
            // Used in the MARKUP (a class attribute), not merely mentioned anywhere.
            if (!new RegExp(`class="[^"]*\\b${cls}\\b`).test(html)) continue;
            checked++;
            if (!new RegExp(`\\.${cls}\\b`).test(css)) {
                bad.push(`${dirOf(page)}/${page.out}: emits .${cls} but its stylesheet never styles it`);
            }
        }
    }
    if (bad.length) {
        console.error('  ✗ parser-emitted markup left unstyled:');
        bad.forEach(b => console.error(`      ${b}`));
        return false;
    }
    console.log(`  ✓ all ${checked} uses of shared-parser markup are styled by their template`);
    return true;
}

/**
 * Gate: no live credential reached a published page.
 *
 * DEVLOG.md is published in full at Harkirat's decision, and it is the one source
 * on this site written candidly for us rather than for a reader — it discusses
 * tokens, env vars, hosts and a past security incident. It is clean today, and that
 * was measured rather than assumed (zero tokens, zero Discord IDs, zero emails).
 * The value of a gate here is that it stays true as the file GROWS: a future session
 * pasting a real connection string into a devlog entry would otherwise publish it.
 *
 * Patterns, deliberately, not a word list. `BOT_TOKEN` as a NAME is discussed
 * throughout and is not a secret; a Discord token's actual shape is. Matching names
 * would fire constantly, get muted, and then catch nothing.
 */
const SECRET_PATTERNS = [
    [/mongodb(?:\+srv)?:\/\/[^\s"'<]*:[^\s"'<@]+@/i, 'a MongoDB URI carrying credentials'],
    [/\b[MN][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27}\b/, 'a Discord bot token'],
    [/\bsk-[A-Za-z0-9]{20,}\b/, 'an OpenAI-style secret key'],
    [/\bAIza[0-9A-Za-z_-]{35}\b/, 'a Google API key'],
    [/cloudinary:\/\/\d+:[^\s"'<@]+@/i, 'a Cloudinary URL with its API secret'],
    [/\bghp_[A-Za-z0-9]{36}\b/, 'a GitHub personal access token'],
];

function secretScan(built) {
    const bad = [];
    let scanned = 0;
    for (const page of built) {
        const html = fs.readFileSync(outPath(page), 'utf8');
        scanned++;
        for (const [re, what] of SECRET_PATTERNS) {
            const m = html.match(re);
            if (m) bad.push(`${dirOf(page)}/${page.out}: looks like ${what} — "${m[0].slice(0, 24)}…"`);
        }
    }
    if (bad.length) {
        console.error('  ✗ possible credential in published output:');
        bad.forEach(b => console.error(`      ${b}`));
        return false;
    }
    console.log(`  ✓ no credential-shaped strings in ${scanned} published pages`);
    return true;
}

console.log('Building the site →', path.relative(ROOT, path.join(ROOT, 'public')));
const built = build();
console.log('\nVerifying rendered output against source:');
const contentOk = verify(built);
console.log('\nAuditing internal links:');
const linksOk = linkAudit();
console.log('\nChecking column-aligned blocks survived:');
const structOk = structureAudit(built);
console.log('\nChecking cross-references to published files are live:');
const xrefOk = crossRefAudit(built);
console.log('\nChecking the warm pages kept their structure:');
const warmOk = warmStructAudit(warmResults);
console.log('\nChecking layout and content class names do not overlap:');
const classOk = classCollisionAudit();
console.log('\nChecking the hover guard rewrote the stylesheets cleanly:');
const hoverOk = hoverGuardAudit(guardedPages);
console.log('\nChecking every source entry became an entry on the page:');
const chronOk = chronicleStructAudit(chronicleResults);
console.log('\nChecking the emitted client scripts parse:');
const scriptOk = scriptSyntaxAudit(built);
console.log('\nChecking structural accessibility (skip link, landmarks, headings):');
const a11yOk = a11yAudit(built);
console.log('\nChecking text contrast meets WCAG AA in both themes:');
const contrastOk = contrastAudit(built);
console.log('\nChecking shared-parser markup is styled on every template that emits it:');
const parserOk = parserStyleAudit(built);
console.log('\nScanning published output for credential-shaped strings:');
const secretOk = secretScan(built);
const ok = contentOk && linksOk && structOk && xrefOk && warmOk && classOk && hoverOk
    && chronOk && parserOk && scriptOk && a11yOk && contrastOk && secretOk;
// Names each property that was actually checked, rather than one word that reads
// as "the output is correct". Each gate tests a different thing, and a pass on
// one has already been mistaken for a pass on another once. Read this roster
// rather than a count written down somewhere — it grows.
console.log(ok
    ? '\nDone. Content complete · links resolve · aligned blocks intact · '
      + 'cross-refs live · warm structure applied · class names distinct · '
      + 'hover guard clean · every source entry rendered · parser markup styled · '
      + 'scripts parse · skip links land · contrast AA · no credentials published.'
    : '\nFAILED — see the findings above.');
process.exit(ok ? 0 : 1);
