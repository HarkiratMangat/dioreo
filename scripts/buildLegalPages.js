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
    // These two are separated by hue, not lightness: amber ~28°, teal ~180°,
    // violet ~268°, rose ~345°. Four clearly distinct positions on the wheel.
    violet: '#9B6BE3',
    rose: '#E8657F',

    // The same argument again, one level out. The two warm pages first used
    // emerald and gold, which are neighbours of the teal and amber already taken
    // by privacy and terms — so the invitation pages read as more of the legal
    // set rather than as something else. These sit in the two genuinely empty
    // arcs of the wheel: lime ~74° (between amber and teal) and azure ~211°
    // (between teal and violet), and both are far brighter and more saturated
    // than anything in the legal four, which separates them by value as well.
    lime: '#B6E24A',
    azure: '#5AA9FF'
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
        accent: BRAND.rose, glow: BRAND.plum,
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
        kicker: 'Join in', accent: BRAND.lime, glow: '#E4F291',
        lede: 'Bug reports, security findings, ideas, code — all of it welcome, and all of it credited.',
        badge: 'Open to anyone',
        blurb: 'How to report a bug, send a fix, and what the CLA actually asks of you.'
    },
    {
        file: 'CONTRIBUTORS.md', kind: 'md', root: true, out: 'contributors.html',
        title: 'Contributors', short: 'Contributors',
        kicker: 'Credit', accent: BRAND.azure, glow: '#9BCBFF',
        lede: 'Everyone who has made this better, credited under the name they chose.',
        badge: 'Your name goes here',
        blurb: 'Who helped build this, and how credit works. Bug reports count.'
    }
];

/* ─────────────────────────── inline formatting ─────────────────────────── */

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Exactly what the deployed site contains, relative to a page inside legal/.
// Keep this in step with build()/buildCompanions() — if a new file starts being
// published, add it here or its cross-references stay inert text.
const PUBLISHED_TARGETS = new Set([
    'terms.html', 'privacy.html', 'license.html', 'notice.html', 'index.html', '',
    'contributing.html', 'contributors.html',
    '../LICENSE', '../NOTICE',
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
    const hit = PUBLISHED_MAP.get(p.toLowerCase());
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
                `<a class="anchor" href="#${id}" aria-label="Link to this section">¶</a></h${lvl}>`
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
            out.push(
                '<div class="tw"><table><thead><tr>' +
                head.map(c => `<th>${inline(c)}</th>`).join('') +
                '</tr></thead><tbody>' +
                rows.map(r => '<tr>' + r.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') +
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
                    `<a class="anchor" href="#${id}" aria-label="Link to this section">¶</a></h2>`
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
                `<a class="anchor" href="#${id}" aria-label="Link to this section">¶</a></h3>`
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
    const colsBlock = grp => {
        // Dedent to the group's own left edge so the block doesn't carry the
        // source file's absolute indentation into a narrower page column.
        const cut = Math.min(...grp.map(indentOf));
        return `<pre class="cols">${grp.map(l => inlineText(l.slice(cut))).join('\n')}</pre>`;
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
  --ink:#EDE9F3; --ink2:#A9A1B9; --ink3:#6E6782;
  --shadow:0 24px 60px -28px rgba(0,0,0,.85);
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
  --ink:#171320; --ink2:#4A4454; --ink3:#736C80;
  --shadow:0 20px 50px -30px rgba(40,32,50,.3);
}
@media (prefers-color-scheme:light){
  :root:not([data-theme=dark]){
    --desk:#D6D1CA; --paper:#FDFCFA; --raised:#EFEBE3;
    --rule:#CBC3B4; --rule2:#A39A8B;
    --ink:#171320; --ink2:#4A4454; --ink3:#736C80;
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

/* ─────────────── shared components: wordmark, repo, theme switch ───────── */

const REPO_URL = 'https://github.com/HarkiratMangat/diors-builds';

// Matches the bot's own sign-off. commands/settings.js closes its panel with
// `-# {diorHeart} Made with love by @dior`, so the site says the same thing in
// the same words rather than inventing a second voice for the same person.
const DIOR_SIG = '<span class="hrt" aria-hidden="true">&#9825;</span> Made with love by <b>dior</b>';
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
  target="_blank" rel="noopener noreferrer" data-spot>
  <span class="ins-gl" aria-hidden="true"></span>
  <span class="ins-ic" aria-hidden="true">${DISCORD_MARK}</span>
  <span class="ins-t">${big ? 'Add to Discord' : 'Install'}</span>
  <span class="ins-ar" aria-hidden="true">&#8599;</span>
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
const wordmark = href => href
    ? `<a class="mark live" href="${href}">
    <span class="glyph" aria-hidden="true"><i></i><i></i><i></i></span>
    <span class="wm">Dior&#8217;s Builds</span>
    <span class="go" aria-hidden="true">&#8250;</span>
  </a>`
    : `<div class="mark">
    <span class="glyph" aria-hidden="true"><i></i><i></i><i></i></span>
    <span class="wm">Dior&#8217;s Builds</span>
  </div>`;

// Collapsed to the mark alone, expanding to reveal the label on hover/focus.
// NOTE: this is the ONLY repo link on the site, and it is a navigation
// affordance, not a citation. That distinction is deliberate — a citation inside
// a legal document must resolve (the repo's visibility can change at any time,
// per TERMS §7.1), whereas a nav button that stops working is a dead button and
// not a defective legal instrument. TERMS §20 still deliberately withholds the
// repo as a *contact* route, which this does not change.
const repoBtn = `<a class="ghb" href="${REPO_URL}" target="_blank" rel="noopener noreferrer"
  data-spot title="View the source on GitHub">
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
        <mask id="thm-cut">
          <rect width="24" height="24" fill="#000"/>
          <circle cx="12" cy="12" r="7.4" fill="#fff"/>
          <circle class="cut" cx="12" cy="12" r="6.6" fill="#000"/>
        </mask>
        <g class="rays" stroke-width="1.8" stroke-linecap="round">
          <line x1="12" y1="1.2" x2="12" y2="3.4"/><line x1="12" y1="20.6" x2="12" y2="22.8"/>
          <line x1="1.2" y1="12" x2="3.4" y2="12"/><line x1="20.6" y1="12" x2="22.8" y2="12"/>
          <line x1="4.4" y1="4.4" x2="6" y2="6"/><line x1="18" y1="18" x2="19.6" y2="19.6"/>
          <line x1="19.6" y1="4.4" x2="18" y2="6"/><line x1="6" y1="18" x2="4.4" y2="19.6"/>
        </g>
        <rect class="orb" width="24" height="24" mask="url(#thm-cut)"/>
        <g class="craters"><circle cx="10.4" cy="9.6" r="1.15"/><circle cx="8.7" cy="14.2" r=".8"/><circle cx="13" cy="13.6" r=".62"/></g>
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
const NAV_GROUPS = [PAGES, EXTRA_PAGES];

/**
 * One DOM, two layouts. The same .seg controls are laid out horizontally in the
 * bar on desktop and vertically inside a sheet on mobile — not duplicated per
 * breakpoint, because two copies would put every nav link in the accessibility
 * tree twice and would let the two drift apart.
 *
 * The sheet is what the hamburger opens. On a phone the horizontal track is only
 * ~40px per tab, which is below the 44px touch target and far too tight to drag
 * along; stacked, each row is a comfortable target and the indicator follows the
 * thumb DOWN the list instead of across it.
 */
const navSwitcher = out => `<button class="burger" id="burger" aria-expanded="false"
    aria-controls="navwrap" aria-label="Open navigation">
    <i></i><i></i><i></i>
  </button>
  <div class="navwrap" id="navwrap">${navGroups(out)}</div>`;

const navGroups = out => NAV_GROUPS.map(grp => {
    const at = grp.findIndex(p => p.out === out);
    return `<div class="seg" data-at="${at}" style="--n:${grp.length};--i:${at < 0 ? 0 : at}">
      <span class="seg-ink" aria-hidden="true"></span>
      ${grp.map(p => `<a class="tab${p.out === out ? ' on' : ''}" href="./${p.out}"` +
        ` data-accent="${p.accent}"` +
        `${p.out === out ? ' aria-current="page"' : ''}>${esc(p.short)}</a>`).join('')}
    </div>`;
}).join('<span class="seg-gap" aria-hidden="true"></span>');

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
const pageFoot = (out, sig) => `<p class="sig">${sig || DIOR_SIG}</p>
  <footer class="foot">
    <p class="disc">Dior&#8217;s Builds is an unofficial fan project. Not affiliated with Activision Publishing, Inc., TiMi Studio Group, Tencent, or Discord Inc.</p>
    <nav class="endnav">${[...PAGES, ...EXTRA_PAGES]
        .filter(p => p.out !== out)
        .map(p => `<a href="./${p.out}">${esc(p.short)}</a>`)
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
  <summary><span class="rv-i" aria-hidden="true"></span>Prefer email? Reveal address</summary>
  <div class="rv-b">
    <a href="mailto:harkirat117@gmail.com">harkirat117@gmail.com</a>
    <span>The formal route. Named in the Terms and Privacy Policy for legal notices,
    rights requests, and takedowns.</span>
  </div>
</details>`;

const COMPONENT_CSS = `
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
.mark{display:inline-flex;align-items:center;gap:.7rem;text-decoration:none;color:var(--ink);
  font-family:var(--display);font-weight:800;font-size:1.06rem;letter-spacing:-.028em;
  white-space:nowrap;position:relative;padding:.25rem 0}
.glyph{display:grid;gap:3px;width:20px;flex:0 0 20px}
.glyph i{display:block;height:3px;background:var(--ink3);border-radius:1.5px;
  transform-origin:left center;
  transition:width .34s cubic-bezier(.16,.84,.28,1),background .34s}
.glyph i:nth-child(1){width:100%;background:var(--accent)}
.glyph i:nth-child(2){width:56%}
.glyph i:nth-child(3){width:78%}
.mark.live .glyph i:nth-child(1){animation:tick 4.2s ease-in-out infinite}
@keyframes tick{0%,84%,100%{opacity:1}92%{opacity:.34}}

/* The shine. A masked gradient swept across the letterforms — text, not a bar
   under it, so the mark itself is what responds. */
.wm{position:relative;background-image:linear-gradient(100deg,
  var(--ink) 38%,color-mix(in srgb,var(--accent) 92%,white) 50%,var(--ink) 62%);
  background-size:280% 100%;background-position:130% 0;
  -webkit-background-clip:text;background-clip:text;
  transition:background-position .62s cubic-bezier(.3,.7,.2,1)}
.mark.live:hover .wm,.mark.live:focus-visible .wm{-webkit-text-fill-color:transparent;
  background-position:-30% 0}
.go{font-family:var(--mono);font-size:.9rem;line-height:1;color:var(--accent);
  opacity:0;transform:translateX(-6px);transition:opacity .26s,transform .26s}
.mark.live:hover .go,.mark.live:focus-visible .go{opacity:1;transform:translateX(0)}
.mark.live:hover .glyph i,.mark.live:focus-visible .glyph i{width:100%;background:var(--accent)}
.mark.live:hover .glyph i:nth-child(2){transition-delay:.06s}
.mark.live:hover .glyph i:nth-child(3){transition-delay:.12s}
.mark.live:hover .glyph i:nth-child(1){animation:none}

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
  color:var(--desk);background:var(--accent);border:1px solid var(--accent);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.34),
    0 2px 10px -5px color-mix(in srgb,var(--accent) 80%,transparent);
  transition:box-shadow .32s,transform .22s cubic-bezier(.2,.8,.2,1)}
.ins-ic{position:relative;z-index:2;display:grid;place-items:center;
  width:22px;height:22px;flex:0 0 22px;border-radius:50%;
  background:color-mix(in srgb,var(--desk) 20%,transparent);
  box-shadow:inset 0 1px 2px color-mix(in srgb,var(--desk) 34%,transparent);
  transition:transform .34s cubic-bezier(.3,1.5,.5,1)}
.ins-ic svg{width:13px;height:auto;display:block}
.ins-t,.ins-ar{position:relative;z-index:2}
.ins-ar{font-size:.8rem;opacity:0;width:0;transform:translateX(-4px);
  transition:opacity .26s,width .26s,transform .26s}
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
  box-shadow:inset 0 1px 0 rgba(255,255,255,.44),
    0 8px 22px -7px color-mix(in srgb,var(--accent) 82%,transparent)}
.ins:hover .ins-gl,.ins:focus-visible .ins-gl{opacity:1}
.ins:hover .ins-ic,.ins:focus-visible .ins-ic{transform:scale(1.1) rotate(-6deg)}
.ins:hover .ins-ar,.ins:focus-visible .ins-ar{opacity:1;width:.8rem;transform:translateX(0)}
.ins:active{transform:translateY(0) scale(.98)}
@media (prefers-reduced-motion:reduce){
  .ins:hover::after,.ins:focus-visible::after{animation:none}
  .ins:hover,.ins:focus-visible,.ins:active{transform:none}
  .ins:hover .ins-ic,.ins:focus-visible .ins-ic{transform:none}
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
.thm-kn{position:absolute;top:2px;left:2px;width:26px;height:26px;border-radius:50%;
  display:grid;place-items:center;
  background:radial-gradient(120% 120% at 32% 26%,rgba(255,255,255,.20),rgba(255,255,255,.07));
  border:1px solid rgba(255,255,255,.24);
  box-shadow:0 2px 6px -1px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.28);
  transform:translateX(0);
  transition:transform .52s cubic-bezier(.5,-0.24,.28,1.32),
    background .5s,border-color .5s,box-shadow .5s}
.thm-kn svg{width:16px;height:16px;overflow:visible}
/* moon */
.thm-kn .orb{fill:#DCE4F7}
.thm-kn .craters{fill:#9FADCC;opacity:1;transition:opacity .3s}
.thm-kn .cut{transform:translate(7.4px,-7.4px);
  transition:transform .5s cubic-bezier(.2,.8,.2,1)}
.thm-kn .rays{stroke:#F2A93B;opacity:0;transform:scale(.5);transform-origin:12px 12px;
  transition:opacity .32s,transform .46s cubic-bezier(.2,.8,.2,1)}

/* The hover peek leans the knob toward where it is going. It no longer fades the
   clouds up behind the moon: clouds belong to the daytime sky, and previewing
   them at night just put weather behind a moon for no reason. */
.thm:hover .thm-kn{transform:translateX(5px)}

/* LIGHT: knob crosses, the mask occluder is pushed clear so the disc fills, rays
   fan out, the orb warms to a sun, craters go, clouds replace stars. */
:root[data-theme=light] .thm-tr{background:linear-gradient(168deg,#7CBAF0,#AFDCF7 60%,#D8EEFB)}
:root[data-theme=light] .thm-kn{transform:translateX(28px);
  background:radial-gradient(120% 120% at 32% 26%,rgba(255,255,255,.95),rgba(255,255,255,.72));
  border-color:rgba(255,255,255,.95);
  box-shadow:0 2px 7px -1px rgba(40,70,110,.34),inset 0 1px 0 rgba(255,255,255,.9)}
:root[data-theme=light] .thm:hover .thm-kn{transform:translateX(23px)}
:root[data-theme=light] .thm-kn .cut{transform:translate(30px,-30px)}
:root[data-theme=light] .thm-kn .orb{fill:#F2A93B}
:root[data-theme=light] .thm-kn .craters{opacity:0}
:root[data-theme=light] .thm-kn .rays{opacity:1;transform:scale(1)}
:root[data-theme=light] .thm-st{opacity:0}
:root[data-theme=light] .thm-cl{opacity:1}
:root[data-theme=light] .thm:hover .thm-st{opacity:.35}
@media (prefers-color-scheme:light){
  :root:not([data-theme=dark]) .thm-tr{background:linear-gradient(168deg,#7CBAF0,#AFDCF7 60%,#D8EEFB)}
  :root:not([data-theme=dark]) .thm-kn{transform:translateX(28px);
    background:radial-gradient(120% 120% at 32% 26%,rgba(255,255,255,.95),rgba(255,255,255,.72));
    border-color:rgba(255,255,255,.95);
    box-shadow:0 2px 7px -1px rgba(40,70,110,.34),inset 0 1px 0 rgba(255,255,255,.9)}
  :root:not([data-theme=dark]) .thm:hover .thm-kn{transform:translateX(23px)}
  :root:not([data-theme=dark]) .thm-kn .cut{transform:translate(30px,-30px)}
  :root:not([data-theme=dark]) .thm-kn .orb{fill:#F2A93B}
  :root:not([data-theme=dark]) .thm-kn .craters{opacity:0}
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
.rv-i{position:relative;width:24px;height:10px;flex:0 0 24px;overflow:hidden;
  border:1px solid var(--rule2);border-radius:3px}
.rv-i::after{content:"";position:absolute;inset:0;background:var(--accent);
  transform:translateX(0);transition:transform .44s cubic-bezier(.16,.84,.28,1)}
.rev[open] .rv-i::after{transform:translateX(101%)}
.rev summary:hover .rv-i::after{transform:translateX(48%)}
.rev[open] summary:hover .rv-i::after{transform:translateX(101%)}
.rv-b{display:grid;gap:.35rem;margin-top:.65rem;padding:.75rem .95rem;
  border-radius:8px;border:1px solid var(--rule);border-left:2px solid var(--accent);
  background:var(--raised);animation:uncover .4s cubic-bezier(.2,.8,.2,1) both}
.rv-b a{color:var(--ink);font-size:.78rem;letter-spacing:.02em}
.rv-b span{color:var(--ink3);line-height:1.7;letter-spacing:.03em;max-width:52ch}
@keyframes uncover{from{opacity:0;clip-path:inset(0 0 100% 0)}
  to{opacity:1;clip-path:inset(0 0 0 0)}}
@media (prefers-reduced-motion:reduce){.rv-b{animation:none}}

/* ── the shared page footer ───────────────────────────────────────────
   One definition for all three templates. It used to be three, which is how the
   legal pages ended up with a plainer footer than the warm ones for no reason
   anybody chose.

   The affiliation disclaimer is deliberately the QUIETEST thing on the page: it
   is a notice that has to be present, not something anyone is meant to read on
   the way past. Small, wide-tracked, --ink3, and capped to a comfortable measure
   so it never becomes a grey slab. */
.foot{border-top:1px solid var(--rule);padding:2.2rem 0 3.4rem;
  display:flex;flex-direction:column;align-items:center;gap:1.4rem;text-align:center}
.disc{margin:0;font-family:var(--mono);font-size:.58rem;line-height:1.85;
  letter-spacing:.05em;color:var(--ink3);opacity:.72;max-width:60ch}
/* The link row: mono, wide-tracked, dot-separated, with the accent drawn under
   the one you are pointing at. */
.endnav{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;
  gap:.15rem .75rem;font-family:var(--mono);font-size:.68rem;letter-spacing:.14em;
  text-transform:uppercase}
.endnav a{color:var(--ink2);text-decoration:none;padding:.3rem .1rem;
  border-bottom:1px solid transparent;
  transition:color .22s,border-color .22s}
.endnav a:hover{color:var(--ink);border-bottom-color:var(--accent)}
.endnav span{color:var(--ink3);opacity:.45}
/* The sign-off sits ABOVE the footer rule and OUTSIDE .foot on purpose. It is
   the closing line of the document, not site chrome, and on the warm pages it is
   lifted straight out of the source — where it runs on from the last paragraph
   ("Thanks for being here — genuinely. / ♡ Made with love by dior"). Put it below
   the link row and five nav labels land inside that sentence: verify() reports
   the run missing, correctly, because a reader meets the nav mid-sentence too. */
.sig{margin:2.6rem 0 0;text-align:center;
  font-family:var(--mono);font-size:.68rem;letter-spacing:.05em;color:var(--ink3)}
.sig b{color:var(--ink2);font-weight:600}
.hrt{color:var(--accent);display:inline-block;animation:pulse 2.6s ease-in-out infinite}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.18)}}
@media (prefers-reduced-motion:reduce){.hrt{animation:none}}
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
const NAV_JS = `
(function(){
  var segs=[].slice.call(document.querySelectorAll('.seg'));
  if(!segs.length) return;
  var still=matchMedia('(prefers-reduced-motion:reduce)').matches;
  var hex=function(c){ c=c.replace('#','');
    return [parseInt(c.slice(0,2),16),parseInt(c.slice(2,4),16),parseInt(c.slice(4,6),16)]; };
  var blend=function(a,b,t){ var A=hex(a),B=hex(b);
    return 'rgb('+Math.round(A[0]+(B[0]-A[0])*t)+','
                +Math.round(A[1]+(B[1]-A[1])*t)+','
                +Math.round(A[2]+(B[2]-A[2])*t)+')'; };

  segs.forEach(function(seg){
    var tabs=[].slice.call(seg.querySelectorAll('.tab'));
    var n=tabs.length; if(!n) return;
    var cols=tabs.map(function(a){ return a.getAttribute('data-accent'); });
    /* home is the tab for the page you are ON, or null for the other group */
    var home=parseInt(seg.getAttribute('data-at'),10);
    if(isNaN(home)||home<0) home=null;
    var base=home===null?0:home;
    var pos=base, m=0, tgt=base, mTgt=0, prev=base, raf=0;
    var dragging=false, moved=false, x0=0, unit=1;
    var clamp=function(v){ return Math.max(0,Math.min(n-1,v)); };
    /* The same control is horizontal in the bar and vertical in the mobile sheet.
       Rather than track a breakpoint in script — which would then have to agree
       with the media query forever — the axis is READ from the layout the CSS
       actually applied. */
    var vert=function(){ return getComputedStyle(seg).gridAutoFlow.indexOf('row')===0; };
    var unitOf=function(){ var r=seg.getBoundingClientRect();
      return ((vert()?r.height:r.width)-6)/n; };
    var at=function(e){ return vert()?e.clientY:e.clientX; };
    var edge=function(){ var r=seg.getBoundingClientRect();
      return vert()?r.top:r.left; };

    function apply(){
      seg.style.setProperty('--i',pos);
      var near=clamp(Math.round(pos));
      seg.style.setProperty('--c2',cols[near]);
      if(home===null){
        /* No page of yours in this group, so there is nothing to blend FROM —
           the indicator simply wears the colour of whatever you point at. */
        seg.style.setProperty('--c1',cols[near]);
        seg.style.setProperty('--m',0);
        seg.style.setProperty('--cm',cols[near]);
      }else{
        seg.style.setProperty('--m',m);
        seg.style.setProperty('--cm',blend(cols[home],cols[near],m));
      }
    }
    function frame(){
      pos+=(tgt-pos)*0.19;
      m+=(mTgt-m)*0.16;
      var v=Math.abs(pos-prev); prev=pos;
      seg.style.setProperty('--sx',(1+Math.min(v*1.7,0.22)).toFixed(3));
      apply();
      if(Math.abs(tgt-pos)>0.001||Math.abs(mTgt-m)>0.004||v>0.001){
        raf=requestAnimationFrame(frame);
      }else{
        pos=tgt; m=mTgt; seg.style.setProperty('--sx',1); apply(); raf=0;
      }
    }
    function run(){
      if(still){ pos=tgt; m=mTgt; apply(); return; }
      if(!raf) raf=requestAnimationFrame(frame);
    }
    function aim(c){
      var p=(c-edge()-3)/unitOf();
      var idx=clamp(Math.round(p-0.5));
      /* Magnetic: it settles ON a tab but leans toward the cursor inside it, so
         it genuinely tracks your hand instead of stepping between slots. */
      tgt=idx+Math.max(-0.34,Math.min(0.34,(p-0.5)-idx))*0.42;
      mTgt=home===null?0:Math.min(1,Math.abs(idx-home));
    }

    seg.addEventListener('pointermove',function(e){
      if(dragging){
        var dx=at(e)-x0;
        if(Math.abs(dx)>3) moved=true;
        pos=tgt=clamp(base+dx/unit);
        mTgt=m=home===null?0:Math.min(1,Math.abs(Math.round(pos)-home));
        apply();
        return;
      }
      /* Touch drives the vertical sheet — that is the whole point of it — but
         must not fire hover behaviour on the desktop bar. */
      if(e.pointerType==='touch'&&!vert()) return;
      seg.classList.add('hot'); aim(at(e)); run();
    });
    seg.addEventListener('pointerleave',function(){
      if(dragging) return;
      seg.classList.remove('hot');
      tgt=base; mTgt=0; run();
    });
    seg.addEventListener('pointerdown',function(e){
      if(e.button||n<2) return;
      dragging=true; moved=false; x0=at(e); unit=unitOf(); base=pos;
      seg.classList.add('drag','hot');
      try{ seg.setPointerCapture(e.pointerId); }catch(err){}
    });
    var release=function(){
      if(!dragging) return;
      dragging=false; seg.classList.remove('drag');
      var t=clamp(Math.round(pos));
      base=home===null?0:home;
      tgt=t; mTgt=home===null?0:Math.min(1,Math.abs(t-home)); run();
      if(moved&&t!==home) location.href=tabs[t].getAttribute('href');
    };
    seg.addEventListener('pointerup',release);
    seg.addEventListener('pointercancel',release);
    /* A drag that ends over a tab must not also fire that tab's click. */
    seg.addEventListener('click',function(e){
      if(moved){ e.preventDefault(); e.stopPropagation(); moved=false; }
    },true);
    tabs.forEach(function(a,idx){
      a.addEventListener('focus',function(){
        if(dragging) return;
        seg.classList.add('hot'); tgt=idx;
        mTgt=home===null?0:Math.min(1,Math.abs(idx-home)); run();
      });
      a.addEventListener('blur',function(){
        if(dragging||seg.contains(document.activeElement)) return;
        seg.classList.remove('hot'); tgt=base; mTgt=0; run();
      });
      a.addEventListener('keydown',function(e){
        var d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;
        if(!d) return;
        e.preventDefault();
        location.href=tabs[(idx+d+n)%n].getAttribute('href');
      });
    });
    apply();
  });

  /* The sheet. aria-expanded is the single source of truth for both the open
     state and the icon, so they cannot disagree. */
  var burger=document.getElementById('burger'), wrap=document.getElementById('navwrap');
  if(burger&&wrap){
    var sheet=function(){ return getComputedStyle(burger).display!=='none'; };
    var setOpen=function(v){
      burger.setAttribute('aria-expanded',v?'true':'false');
      wrap.classList.toggle('open',v);
      /* inert keeps a closed sheet out of the tab order and the accessibility
         tree. Only while it IS a sheet — on desktop the same element is the
         always-visible bar nav and must never be inert. */
      wrap.toggleAttribute('inert',sheet()&&!v);
    };
    addEventListener('resize',function(){
      if(!sheet()){ wrap.removeAttribute('inert'); wrap.classList.remove('open');
        burger.setAttribute('aria-expanded','false'); }
      else setOpen(burger.getAttribute('aria-expanded')==='true');
    });
    setOpen(false);
    burger.addEventListener('click',function(){
      setOpen(burger.getAttribute('aria-expanded')!=='true');
    });
    document.addEventListener('keydown',function(e){
      if(e.key==='Escape'&&burger.getAttribute('aria-expanded')==='true'){
        setOpen(false); burger.focus();
      }
    });
    /* A tap outside closes it. Pointerdown rather than click so it beats the
       sheet's own drag handling. */
    document.addEventListener('pointerdown',function(e){
      if(burger.getAttribute('aria-expanded')!=='true') return;
      if(wrap.contains(e.target)||burger.contains(e.target)) return;
      setOpen(false);
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
.seg{position:relative;display:grid;grid-auto-flow:column;grid-auto-columns:1fr;
  border-radius:999px;border:1px solid var(--rule2);padding:3px;
  background:color-mix(in srgb,var(--ink) 7%,transparent);isolation:isolate;
  --c1:var(--accent);--m:0;--sx:1;touch-action:pan-y;cursor:grab}
.seg.drag{cursor:grabbing}
.seg-ink{position:absolute;z-index:0;top:3px;bottom:3px;left:3px;overflow:hidden;
  width:calc((100% - 6px)/var(--n));border-radius:999px;background:var(--paper);
  border:1px solid color-mix(in srgb,var(--cm,var(--c1)) 60%,transparent);
  box-shadow:0 2px 9px -4px rgba(0,0,0,.55),
    0 0 14px -6px color-mix(in srgb,var(--cm,var(--c1)) 70%,transparent);
  transform:translateX(calc(var(--i) * 100%)) scaleX(var(--sx));
  transition:transform .34s cubic-bezier(.22,.9,.24,1)}
/* Straight to the finger while dragging; eased at every other time. */
.seg.drag .seg-ink,.seg.live .seg-ink{transition:none}
/* The mesh: two soft lobes per colour, cross-faded by --m. Both colours are on
   screen at once mid-hover, which is the whole point — you see the page you are
   leaving bleeding into the one you are about to open. */
.seg-ink::before,.seg-ink::after{content:"";position:absolute;inset:-45%;
  transition:opacity .3s linear}
.seg-ink::before{opacity:calc(1 - var(--m));background:
  radial-gradient(42% 62% at 24% 26%,color-mix(in srgb,var(--c1) 62%,transparent),transparent 72%),
  radial-gradient(48% 68% at 76% 78%,color-mix(in srgb,var(--c1) 34%,transparent),transparent 74%)}
.seg-ink::after{opacity:var(--m);background:
  radial-gradient(42% 62% at 30% 74%,color-mix(in srgb,var(--c2,var(--c1)) 62%,transparent),transparent 72%),
  radial-gradient(48% 68% at 70% 22%,color-mix(in srgb,var(--c2,var(--c1)) 34%,transparent),transparent 74%)}
.tab{position:relative;z-index:1;font-family:var(--mono);font-size:.66rem;letter-spacing:.1em;
  text-transform:uppercase;text-decoration:none;color:var(--ink2);padding:.4rem .8rem;
  text-align:center;border-radius:999px;transition:color .2s}
.tab:hover{color:var(--ink)}
.tab.on{color:var(--accent);font-weight:700}
@media (max-width:640px){
  .tab{padding:.4rem .45rem;font-size:.6rem;letter-spacing:.05em}
}
/* A group you are not currently inside shows no indicator until you point at
   it, so exactly one indicator on screen is ever "yours". */
.seg[data-at="-1"] .seg-ink{opacity:0;transition:opacity .3s,transform .34s cubic-bezier(.22,.9,.24,1)}
.seg[data-at="-1"].hot .seg-ink{opacity:1}
.seg-gap{width:.45rem;flex:0 0 auto}

/* Six tabs in two groups is 812px of navigation at full size — nearly twice what
   the old single four-tab control took — so it has to give way in stages rather
   than push the wordmark off the bar. Measured at 1280: nav 812px, total ~990px,
   which clears 1024 and nothing below it.
     1180  tighter tabs
     1000  the group you are NOT in collapses away; the one you are in remains,
           because that is the one showing you where you are. Measured: at 900px
           with both groups shown the bar still overflowed even with tight tabs,
           so this threshold is set from the measurement, not from a round number
      620  the switcher goes entirely — every one of these links is in the page
           footer, and on those widths the section rail is the primary navigation */
.navwrap{display:flex;align-items:center}
.burger{display:none}

@media (max-width:1180px){
  .tab{padding:.4rem .58rem;font-size:.62rem;letter-spacing:.07em}
}
/* Bounded BELOW as well: under 620px the sheet takes over and wants both groups
   in it. An unbounded max-width rule here would hide the legal group inside the
   mobile sheet, which is the one place there is room for it. */
@media (min-width:621px) and (max-width:1000px){
  .seg[data-at="-1"],.seg-gap{display:none}
}

/* ── mobile: the sheet ────────────────────────────────────────────────
   The bar keeps only the wordmark and the controls; navigation moves behind the
   hamburger. Inside the sheet the same .seg becomes a vertical track: the ink
   travels down it, stretches along Y instead of X, and follows a thumb drag.
   touch-action:none is required on the vertical track or the browser claims the
   gesture for page scrolling before the pointer handlers ever see it. */
@media (max-width:620px){
  .burger{display:grid;place-content:center;gap:4px;width:32px;height:32px;padding:0;
    -webkit-appearance:none;appearance:none;background:transparent;cursor:pointer;
    border:1px solid var(--rule2);border-radius:999px;color:inherit}
  .burger i{display:block;width:14px;height:1.5px;border-radius:2px;background:var(--ink2);
    transition:transform .3s cubic-bezier(.2,.8,.2,1),opacity .2s,background .2s}
  .burger[aria-expanded=true]{border-color:var(--accent)}
  .burger[aria-expanded=true] i{background:var(--accent)}
  .burger[aria-expanded=true] i:nth-child(1){transform:translateY(5.5px) rotate(45deg)}
  .burger[aria-expanded=true] i:nth-child(2){opacity:0}
  .burger[aria-expanded=true] i:nth-child(3){transform:translateY(-5.5px) rotate(-45deg)}

  .navwrap{position:fixed;top:54px;left:0;right:0;z-index:59;
    flex-direction:column;align-items:stretch;gap:.55rem;
    padding:.85rem clamp(1rem,4vw,1.4rem) 1.1rem;
    background:color-mix(in srgb,var(--desk) 96%,transparent);
    backdrop-filter:blur(14px) saturate(1.3);border-bottom:1px solid var(--rule);
    /* Closed state is opacity + pointer-events, with the inert attribute set
       from script. It was visibility:hidden, swapped deliberately: inert removes
       the closed sheet from the tab order AND the accessibility tree, which is
       the property actually wanted here, and it stays correct mid-transition when
       opacity is part-way. visibility would also have worked; inert is simply the
       better tool for "this whole subtree is not currently available". */
    transform:translateY(-14px);opacity:0;pointer-events:none;
    transition:transform .32s cubic-bezier(.2,.85,.25,1),opacity .26s}
  .navwrap.open{transform:none;opacity:1;pointer-events:auto}

  .seg{grid-auto-flow:row;grid-auto-columns:auto;width:100%;
    touch-action:none;cursor:default}
  .seg-ink{left:3px;right:3px;top:3px;bottom:auto;width:auto;
    height:calc((100% - 6px)/var(--n));
    transform:translateY(calc(var(--i) * 100%)) scaleY(var(--sx))}
  /* 44px minimum touch target (WCAG 2.5.5). Padding alone gave 34px here, which
     would have made the sheet fail the very requirement it exists to satisfy —
     min-height is set explicitly so a later type change cannot silently shrink it. */
  .tab{display:flex;align-items:center;min-height:44px;padding:0 .95rem;
    font-size:.68rem;letter-spacing:.1em;text-align:left}
  .seg-gap{display:none}
}
`;

/* ──────────────────────────────── template ─────────────────────────────── */

// `out` identifies the current page so the active nav tab is DERIVED rather than
// inferred from the title. The previous `short === 'Terms' ? ... : 'privacy'`
// test silently assumed there would only ever be two pages, and quietly marked
// anything else as Privacy.
function shell({ title, short, kicker, accent, glow, body, toc, meta, out = '' }) {
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
.rail{position:sticky;top:76px;align-self:start;padding:2.6rem 0 2rem;
  max-height:calc(100vh - 96px);overflow-y:auto;scrollbar-width:thin}
.rail::-webkit-scrollbar{width:3px}
.rail::-webkit-scrollbar-thumb{background:var(--rule2)}
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
.slot.on i{color:var(--accent)}
.slot.on span{color:var(--ink);font-weight:650}
/* ── mobile section index ─────────────────────────────────────────────
   It used to be position:static, so the opener scrolled away with the top of
   the page and became unreachable exactly when a long document needs it most.
   It is now STICKY directly beneath the fixed bar, so it is in reach at every
   scroll position, and it names the section you are currently in — the desktop
   rail already tracks that, and on mobile it is the only positional cue there is.
   The open list is height-capped and scrolls internally so it can never grow past
   the viewport on a 22-section document. */
@media (max-width:980px){
  .rail{position:sticky;top:54px;z-index:50;max-height:none;padding:0;
    margin:0 0 1.6rem;background:color-mix(in srgb,var(--desk) 94%,transparent);
    backdrop-filter:blur(12px) saturate(1.2)}
  .rail>.lab{cursor:pointer;padding:.72rem 1rem;border:1px solid var(--rule);
    background:var(--paper);margin:0;display:flex;gap:.6rem;align-items:center;
    width:100%;-webkit-appearance:none;appearance:none;text-align:left;
    font-family:var(--mono);font-size:.63rem;letter-spacing:.16em;
    text-transform:uppercase;color:var(--ink3)}
  .rail>.lab .cur{display:block;margin-left:auto;color:var(--ink2);letter-spacing:.04em;
    text-transform:none;font-size:.68rem;overflow:hidden;text-overflow:ellipsis;
    white-space:nowrap;max-width:52%}
  .rail>.lab::after{content:"+";font-size:.95rem;color:var(--accent);flex:0 0 auto;
    transition:transform .24s}
  .rail.open>.lab::after{transform:rotate(45deg)}
  .slots{display:none;padding:.6rem 0;border:1px solid var(--rule);border-top:0;
    background:var(--paper);max-height:min(58vh,420px);overflow-y:auto}
  .rail.open .slots{display:block}
  .slot{padding-left:1rem}
}

/* ── the document ────────────────────────────────────────────────── */
.doc{background:var(--paper);border:1px solid var(--rule);box-shadow:var(--shadow);
  padding:clamp(1.6rem,4.5vw,4rem);margin-bottom:3rem;position:relative;min-width:0}
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
.idx{font-family:var(--mono);font-size:.7rem;font-weight:500;color:var(--accent);
  letter-spacing:.02em;font-variant-numeric:tabular-nums;display:block;margin-bottom:.45rem}
.doc h3 .idx{color:var(--ink3);margin-bottom:.3rem}
@media (min-width:1120px){
  .idx{position:absolute;left:-3.6rem;top:.34em;margin:0;text-align:right;width:2.6rem}
  .doc h3 .idx{left:-3.6rem;top:.28em}
}
.anchor{margin-left:.5rem;color:var(--rule2);text-decoration:none;font-size:.75em;
  opacity:0;transition:opacity .15s}
.doc h2:hover .anchor,.doc h3:hover .anchor{opacity:1}
.anchor:hover{color:var(--accent)}
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
.xref{font-family:var(--mono);font-size:.86em;color:var(--accent)!important;
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
.authoritative a{color:var(--ink)}
h3.clause{display:flex;align-items:baseline;gap:.55rem;margin:2.5rem 0 .6rem;
  font-size:1rem;font-weight:700}
h3.clause .idx{color:var(--accent);margin:0;flex:0 0 auto;font-size:.76rem}
@media (min-width:1120px){h3.clause .idx{position:absolute;left:-4.2rem;top:.3em;
  text-align:right;width:3.2rem}}
h3.clause .ht:empty{display:none}
/* A clause with no title phrase leaves only the index; without this its body
   would start against the heading's bottom margin and read as orphaned. */
h3.clause:has(.ht:empty){margin-bottom:.15rem}
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
pre.cols{font-family:var(--mono);font-size:.76rem;line-height:1.72;color:var(--ink2);
  background:var(--raised);border:1px solid var(--rule);padding:.8rem 1rem;
  margin:0 0 1.1rem;overflow-x:auto;white-space:pre;max-width:100%}
pre.cols a{color:var(--ink)}

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

/* ── footer ──────────────────────────────────────────────────────── */
/* No grid-column here any more: the footer left the grid when .cols was introduced,
   so grid-column:1/-1 had become an inert declaration describing a layout that no
   longer exists. It spans the full .page width simply by being a block child of it. */

@media print{
  .bar,#prog,.rail,.anchor,.thm,.ghb{display:none!important}
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

<div class="bar">
  ${wordmark('./')}
  <nav>
    ${navSwitcher(out)}
    ${repoBtn}
    ${installBtn()}
    ${themeBtn()}
  </nav>
</div>
<div id="prog"></div>

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
      <button class="lab" id="railbtn" aria-expanded="false" aria-controls="slots">Sections<span class="cur" id="railcur"></span></button>
      <div class="slots" id="slots">${slots}</div>
    </aside>

    <main class="doc">
      <header class="mast">
        <span class="lab">${esc(kicker)}</span>
        <h1>${esc(title)}</h1>
        <div class="rule"></div>
        <div class="meta">${meta.map(m => `<span>${m}</span>`).join('')}</div>
      </header>
      ${body}
    </main>
  </div>

  <!-- Same footer as every other page: see pageFoot(). PAGES already contains
       Notice, so the hand-added ../NOTICE link that used to sit here produced two
       "Notice" entries side by side. The email stays off it — that belongs on the
       landing page and in the Privacy Policy. -->
  ${pageFoot(out)}
</div>

<script>
(function(){
  var prog=document.getElementById('prog');
  var slots=[].slice.call(document.querySelectorAll('.slot'));
  var heads=slots.map(function(a){return document.getElementById(a.getAttribute('href').slice(1))});
  var queued=false;
  function paint(){
    var h=document.documentElement, max=h.scrollHeight-h.clientHeight;
    prog.style.width=(max>0?h.scrollTop/max*100:0)+'%';
    var cur=-1;
    /* Viewport-relative, not offsetTop. offsetTop is measured from the nearest
       POSITIONED ancestor, and the headings sit inside .doc, which is
       position:relative — so it was being compared against a document-space
       scroll value and every heading read low by the masthead's height. */
    for(var i=0;i<heads.length;i++){
      if(heads[i]&&heads[i].getBoundingClientRect().top<=130) cur=i;
    }
    /* At the bottom of the document the last headings can never cross the 130px
       line — the page simply runs out of scroll before they get there — so the
       final section could never highlight and the rail stayed stuck on whichever
       one did cross it (Contact, on Privacy, with Appendix A unreachable).
       Clamping to the last section at scroll end is what makes the rail agree
       with what is actually on screen. */
    if(max>0&&h.scrollTop>=max-2) cur=heads.length-1;
    for(var j=0;j<slots.length;j++) slots[j].classList.toggle('on', j===cur);
    // Mirror the tracked section into the mobile opener. On desktop the rail
    // shows position by itself; on mobile the list is collapsed, so without this
    // there is no positional cue anywhere on a 22-section document.
    var curEl=document.getElementById('railcur');
    if(curEl){
      var t=cur>=0?slots[cur].querySelector('span'):null;
      curEl.textContent=t?t.textContent:'';
    }
    queued=false;
  }
  addEventListener('scroll',function(){ if(!queued){queued=true;requestAnimationFrame(paint);} },{passive:true});
  addEventListener('resize',paint); paint();

  var rail=document.getElementById('rail'), rbtn=document.getElementById('railbtn');
  rbtn.addEventListener('click',function(){
    var open=rail.classList.toggle('open');
    rbtn.setAttribute('aria-expanded', open?'true':'false');
  });
  slots.forEach(function(a){ a.addEventListener('click',function(){
    rail.classList.remove('open'); rbtn.setAttribute('aria-expanded','false');
  }); });

})();
${THEME_JS}
${NAV_JS}
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
        + '<span class="cpy-i" aria-hidden="true">&#9106;</span>'
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
            return '<div class="wall"><div class="plate ghost">'
                + '<span class="plate-n" aria-hidden="true"></span>'
                + `<span class="plate-r">${em[1]}</span></div></div>`;
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
            .replace('♡', '<span class="hrt" aria-hidden="true">&#9825;</span>');
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
    return { body: parts.join('\n'), sig, spine: !!spec.spine, hits: WARM_HITS };
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
  var b=document.querySelector('.cpy');
  if(b&&navigator.clipboard){
    var s=document.querySelector('.cpy-s'),t=b.querySelector('.cpy-t');
    b.addEventListener('click',function(){
      var el=document.getElementById(b.getAttribute('data-copy'));
      if(!el)return;
      navigator.clipboard.writeText(el.textContent.trim()).then(function(){
        b.setAttribute('data-done','');t.textContent='Copied';
        if(s)s.textContent='Copied to clipboard';
        setTimeout(function(){b.removeAttribute('data-done');t.textContent='Copy';
          if(s)s.textContent='';},2400);
      });
    });
  } else if(b){b.parentNode.removeChild(b);}
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

function warmShell({ title, kicker, accent, glow, lede, badge, body, out, sig, spine }) {
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — Dior's Builds</title>
<meta name="description" content="${esc(lede)}">
<meta name="color-scheme" content="dark light">
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
  letter-spacing:.14em;text-transform:uppercase;color:var(--accent);
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
.card li::marker{color:var(--accent)}
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
pre.code[data-lang]::before{content:attr(data-lang);position:absolute;top:.5rem;right:.75rem;
  font-family:var(--mono);font-size:.56rem;letter-spacing:.16em;text-transform:uppercase;
  color:var(--ink3)}
.card .ref{font-family:var(--mono);font-size:.86em;color:var(--ink2);
  border-bottom:1px dotted var(--rule)}
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
.opts{display:grid;grid-template-columns:repeat(auto-fit,minmax(228px,1fr));gap:.85rem;
  margin:1.3rem 0}
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
.ldg-m{grid-column:1;grid-row:1/span 2;width:26px;height:26px;border-radius:50%;
  display:grid;place-items:center;font-family:var(--mono);font-size:.78rem;line-height:1;
  margin-top:.1rem}
.ldg-r[data-d=out] .ldg-m{color:var(--accent);
  background:color-mix(in srgb,var(--accent) 15%,transparent);
  border:1px solid color-mix(in srgb,var(--accent) 36%,transparent)}
.ldg-r[data-d=hold] .ldg-m,.ldg-r[data-d=check] .ldg-m{color:var(--ink);
  background:var(--raised);border:1px solid var(--rule2)}
.ldg-r[data-d=none] .ldg-m{color:var(--ink3);border:1px dashed var(--rule2)}
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
.card .slip-t{flex:1 1 17rem;margin:0;font-family:var(--mono);font-size:.78rem;
  line-height:1.7;color:var(--ink);word-break:break-word}
.cpy{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;gap:.45rem;
  min-height:44px;padding:0 1.05rem;border-radius:999px;cursor:pointer;
  font-family:var(--mono);font-size:.64rem;letter-spacing:.13em;text-transform:uppercase;
  color:var(--accent);background:color-mix(in srgb,var(--accent) 13%,transparent);
  border:1px solid color-mix(in srgb,var(--accent) 42%,transparent);
  transition:background .2s,color .2s,border-color .2s}
.cpy:hover{background:color-mix(in srgb,var(--accent) 22%,transparent)}
.cpy[data-done]{color:var(--ink);border-color:var(--rule2);background:var(--raised)}
.cpy-i{font-size:.85rem}
/* Visually hidden, still announced. The button label also changes, so a sighted
   user gets the same confirmation without the live region. */
.cpy-s{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);
  white-space:nowrap}

/* ── the credit wall. A plate is engraved: inset highlight along the top edge,
      name in display type. The ghost plate is the page's actual argument — the
      empty space is the offer, so it is drawn as a reserved object rather than
      apologised for in italics. */
.wall{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:.9rem;
  margin:1.4rem 0}
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
  animation:wait 5s ease-in-out infinite}
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
@media print{.bar,.thm,.ghb,.ins,.cpy,.node{display:none!important}
  body{background:#fff;color:#000}.card{border:0;box-shadow:none;border-radius:0}
  .plate,.opt,.prom,.slip,.ldg{box-shadow:none;animation:none}}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
html{scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
</style>
</head>
<body>

<div class="bar">
  ${wordmark('./')}
  <!-- The same two-group switcher the legal pages carry, so the navigation never
       changes shape as you move around the site. It replaces the old "‹ Legal"
       back button, which could only ever go one place. -->
  <nav>
    ${navSwitcher(out)}
    ${repoBtn}
    ${installBtn()}
    ${themeBtn()}
  </nav>
</div>

<div class="wrap">
  <header class="hero">
    <span class="chip">${esc(badge)}</span>
    <h1>${esc(title)}</h1>
    <p class="lede">${esc(lede)}</p>
  </header>
  <main class="card${spine ? ' spine' : ''}">${body}</main>
  <!-- The footer is pageFoot(), identical on every page. The sign-off is the one
       the SOURCE file ends with, lifted out of the body by warmCompose so it
       shows once; DIOR_SIG is the fallback when a source carries no closing line.
       No bottom theme tray: the header already has the switch, and offering the
       same control twice on one screen is clutter. (The landing page is the
       exception — it has no fixed header, so its switch lives at the foot.) -->
  ${pageFoot(out, sig)}
</div>
<script>${THEME_JS}${NAV_JS}${WARM_JS}</script>
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
        'contributors.html': '<svg viewBox="0 0 14 14" aria-hidden="true">'
            + '<circle class="d" cx="2.4" cy="7" r="1.7"/>'
            + '<circle class="d" cx="7" cy="7" r="1.7"/>'
            + '<circle class="d" cx="11.6" cy="7" r="1.7"/></svg>'
    };
    const invites = EXTRA_PAGES.map(p => `
      <a class="inv" href="${p.out}" style="--ia:${p.accent}">
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
          <span class="arw"><i>&#8594;</i></span>
        </span>
      </a>`).join('');

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
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%2316131B'/%3E%3Crect x='6' y='7' width='20' height='3' fill='%23F2994A'/%3E%3Crect x='6' y='14' width='14' height='3' fill='%236E6782'/%3E%3Crect x='6' y='21' width='17' height='3' fill='%236E6782'/%3E%3C/svg%3E">
<style>
${TOKENS}
:root{--accent:${BRAND.amber}}
${COMPONENT_CSS}
body{min-height:100vh;display:flex;align-items:center;padding:clamp(2rem,8vh,6rem) clamp(1.2rem,5vw,2rem)}
.wrap{width:100%;max-width:780px;margin:0 auto}
.top{display:flex;align-items:center;gap:.6rem;margin-bottom:clamp(2.5rem,9vh,5rem)}
.top .ghb{margin-left:auto}
h1{font-family:var(--display);font-weight:800;letter-spacing:-.05em;line-height:.9;
  font-size:clamp(3rem,13vw,6.5rem);margin:.8rem 0 1.4rem;color:var(--ink)}
.lede{font-family:var(--serif);font-size:1.1rem;line-height:1.7;color:var(--ink2);
  max-width:46ch;margin:0 0 clamp(2.2rem,7vh,3.6rem)}
.list{border-top:1px solid var(--rule)}
.entry{display:grid;grid-template-columns:2.6rem 1fr auto;gap:1.4rem;align-items:baseline;
  padding:1.7rem .4rem;text-decoration:none;color:inherit;border-bottom:1px solid var(--rule);
  position:relative;transition:padding-left .22s}
.entry::before{content:"";position:absolute;left:0;top:0;bottom:-1px;width:0;
  background:var(--accent);transition:width .22s}
.entry:hover{padding-left:1.3rem}
.entry:hover::before{width:3px}
.entry i{font-family:var(--mono);font-style:normal;font-size:.7rem;color:var(--ink3);
  letter-spacing:.1em;font-variant-numeric:tabular-nums}
.entry:hover i{color:var(--accent)}
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
  align-items:flex-start;text-align:left;border-top:0;padding:0}
.foot .disc{max-width:66ch}
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
.invite{display:grid;grid-template-columns:repeat(auto-fit,minmax(286px,1fr));gap:1.1rem;
  margin-top:clamp(2.2rem,6vh,3rem)}
.inv{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 46px;
  text-decoration:none;color:inherit;border-radius:14px;background:var(--paper);
  border:1px solid var(--rule);
  transition:transform .38s cubic-bezier(.16,.84,.28,1),box-shadow .38s,border-color .38s}
.inv-b{padding:1.35rem 1.4rem 1.3rem;min-width:0}
.inv-s{position:relative;border-radius:0 13px 13px 0;
  display:grid;grid-template-rows:1fr auto;align-items:center;justify-items:center;
  padding:.9rem 0 .8rem;
  border-left:2px dashed color-mix(in srgb,var(--ia) 40%,var(--rule));
  background:color-mix(in srgb,var(--ia) 6%,transparent);
  transition:background .38s}
/* the punched notches — background-coloured, straddling the top and bottom edge */
.inv-s::before,.inv-s::after{content:"";position:absolute;left:-7px;width:12px;height:12px;
  border-radius:50%;background:var(--desk)}
.inv-s::before{top:-7px}
.inv-s::after{bottom:-7px}
.inv-sw{writing-mode:vertical-rl;transform:rotate(180deg);
  font-family:var(--mono);font-size:.57rem;letter-spacing:.24em;text-transform:uppercase;
  color:color-mix(in srgb,var(--ia) 72%,var(--ink3))}
.inv:hover,.inv:focus-visible{transform:translateY(-4px) rotate(-.35deg);
  border-color:color-mix(in srgb,var(--ia) 44%,var(--rule));
  box-shadow:0 24px 50px -28px color-mix(in srgb,var(--ia) 65%,transparent)}
.inv:hover .inv-s,.inv:focus-visible .inv-s{background:color-mix(in srgb,var(--ia) 18%,transparent)}
@media (prefers-reduced-motion:reduce){
  .inv:hover,.inv:focus-visible{transform:none}
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
.inv-m .pv,.inv-m .ph{stroke:currentColor;stroke-width:2;stroke-linecap:round;
  transition:transform .42s cubic-bezier(.16,.84,.28,1)}
.inv:hover .inv-m .pv{transform:rotate(90deg);transform-origin:7px 7px}
.inv-m .d{fill:currentColor;opacity:.35}
.inv:hover .inv-m .d{animation:roll 1.4s ease-in-out infinite}
.inv:hover .inv-m .d:nth-child(2){animation-delay:.18s}
.inv:hover .inv-m .d:nth-child(3){animation-delay:.36s}
@keyframes roll{0%,100%{opacity:.35}45%{opacity:1}}

.inv .ik{font-family:var(--mono);font-size:.6rem;letter-spacing:.15em;
  text-transform:uppercase;color:var(--ia)}
.inv h3{font-family:var(--display);font-size:1.24rem;font-weight:750;letter-spacing:-.025em;
  color:var(--ink);margin:.75rem 0 .4rem}
.inv p{font-family:var(--serif);font-size:.95rem;line-height:1.62;color:var(--ink2);margin:0}
/* The arrow lives in the stub now, where the thumb would go. */
.inv .arw{display:grid;place-items:center;width:22px;height:22px;border-radius:50%;
  color:var(--ia);background:color-mix(in srgb,var(--ia) 14%,transparent);
  transition:background .3s}
.inv .arw i{font-style:normal;font-size:.78rem;line-height:1;
  transition:transform .3s cubic-bezier(.16,.84,.28,1)}
.inv:hover .arw{background:color-mix(in srgb,var(--ia) 26%,transparent)}
.inv:hover .arw i{transform:translateX(3px)}
@media (prefers-reduced-motion:reduce){
  .inv:hover .arw i{transform:none}
  .inv:hover .inv-m .d{animation:none;opacity:1}
}

/* The switch sits at the BOTTOM here rather than in the top-right, at Harkirat's
   request: on a landing page the masthead should be the only thing competing for
   the top of the screen. */
.tray{margin-top:clamp(1.8rem,5vh,2.8rem);padding-top:1.4rem;border-top:1px solid var(--rule);
  display:flex;align-items:center;gap:.7rem}
.tray .lab{margin-right:auto}
</style></head><body>
<div class="wrap">
  <div class="top">
    ${wordmark(null)}
    ${repoBtn}
    ${installBtn()}
  </div>
  <span class="lab">Legal</span>
  <h1>The fine print,<br>written to be read.</h1>
  <p class="lede">${esc(lede)}</p>
  <div class="list">${rows}</div>
  <div class="invite">${invites}</div>
  <div class="foot">
    <p class="disc">Dior's Builds is an unofficial fan project and is not affiliated with Activision Publishing, Inc., TiMi Studio Group, Tencent, Discord Inc., or with the rights holders of any content the game features under licence.</p>
    <p class="contact">Questions, corrections, or a privacy request — reach <b class="dh">diorswrld</b> on Discord.</p>
    ${emailReveal}
  </div>
  <div class="tray">
    <span class="lab">Appearance</span>
    ${themeBtn()}
  </div>
</div>
<script>${THEME_JS}</script>
</body></html>`;
}

/* ───────────────────────── source location + head strip ────────────────── */

// The Markdown sources live in docs/legal; the plain-text instruments live at the
// repo root. One helper so build() and verify() can never disagree about where a
// page's source is — they read it independently, and a mismatch there would make
// the verifier compare a page against the wrong file and still report 100%.
const sourcePath = page => page.root
    ? path.join(ROOT, page.file)
    : path.join(SRC, page.file);

// Both strips are shared with verify() for the same reason: whatever build()
// removes from the body, the verifier must not expect to find in it.
const stripMdHead = md => md
    .replace(/^#\s+.*$/m, '')
    .replace(/^\*\*(Effective date|Version|Applies to):\*\*.*$/gm, '')
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
            note = `<p class="authoritative">This page is a formatted reading copy. ` +
                `The <a href="../${page.file}">plain-text ${esc(page.file)}</a> is the ` +
                `authoritative instrument, and governs if the two ever differ.</p>`;
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

        fs.writeFileSync(path.join(OUT, page.out), shell({
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
        fs.writeFileSync(path.join(OUT, page.out), warmShell({
            ...page, body: html, sig: comp.sig, spine: comp.spine
        }));
        built.push({ ...page, sections: parsed.toc.filter(t => !t.sub).length, extra: true });
        const applied = Object.entries(comp.hits).map(([k, v]) => `${k}×${v}`).join(' ');
        console.log(`  ✓ ${page.out}  ${parsed.toc.filter(t => !t.sub).length} sections · ${(html.length / 1024).toFixed(1)} KB · ${applied}`);
    }

    // Only the numbered legal set goes in the numbered list.
    fs.writeFileSync(path.join(OUT, 'index.html'), indexPage(built.filter(p => !p.extra)));
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
    fs.writeFileSync(path.join(root, '_redirects'), '/ /legal/ 302\n');
    console.log('  ✓ _redirects (/ → /legal/)');

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
        const out = fs.readFileSync(path.join(OUT, page.out), 'utf8');
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
            .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
            .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
            .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/&\w+;/g, ' ')
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

        const srcWords = words(cleaned);

        const missing = [];
        const total = Math.max(1, Math.floor(srcWords.length / RUN));
        for (let i = 0; i + RUN <= srcWords.length; i += RUN) {
            const run = srcWords.slice(i, i + RUN).join(' ');
            if (!rendered.includes(' ' + run + ' ')) missing.push(run);
        }
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
        const html = fs.readFileSync(path.join(OUT, page.out), 'utf8');
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
        const html = fs.readFileSync(path.join(OUT, page.out), 'utf8');

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
                const dir = path.resolve(OUT, path.dirname(cand));
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

console.log('Building legal pages →', path.relative(ROOT, OUT));
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
const ok = contentOk && linksOk && structOk && xrefOk && warmOk;
// Names each property that was actually checked, rather than one word that reads
// as "the output is correct". Five gates test five different things, and a pass
// on one has already been mistaken for a pass on another once.
console.log(ok
    ? '\nDone. Content complete · links resolve · aligned blocks intact · '
      + 'cross-refs live · warm structure applied.'
    : '\nFAILED — see the findings above.');
process.exit(ok ? 0 : 1);
