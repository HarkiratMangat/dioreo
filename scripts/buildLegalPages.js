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
    rose: '#E8657F'
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
        kicker: 'Join in', accent: BRAND.emerald, glow: BRAND.teal,
        lede: 'Bug reports, security findings, ideas, code — all of it welcome, and all of it credited.',
        badge: 'Open to anyone',
        blurb: 'How to report a bug, send a fix, and what the CLA actually asks of you.'
    },
    {
        file: 'CONTRIBUTORS.md', kind: 'md', root: true, out: 'contributors.html',
        title: 'Contributors', short: 'Contributors',
        kicker: 'Credit', accent: BRAND.gold, glow: BRAND.amber,
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

    return { html: out.join('\n'), toc };
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

const installBtn = (big = false) => `<a class="ins${big ? ' big' : ''}" href="${INSTALL_URL}"
  target="_blank" rel="noopener noreferrer">
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
  title="View the source on GitHub">
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
.ghb,.ins{border-radius:999px;height:30px}

/* repo — icon-only, opening on hover. The label is revealed by a clip, and the
   icon holds still. It used to spin 360°, which is the stock "look, animation"
   move and reads as filler. */
.ghb{display:inline-flex;align-items:center;justify-content:flex-start;
  overflow:hidden;text-decoration:none;color:var(--ink2);
  border:1px solid var(--rule2);background:transparent;
  width:30px;padding:0;transition:width .38s cubic-bezier(.16,.84,.28,1),
  color .22s,border-color .22s,background .22s}
.ghb-ic{display:grid;place-items:center;width:30px;height:30px;flex:0 0 30px}
.ghb-ic svg{width:15px;height:15px;display:block}
.ghb-t{overflow:hidden;padding-right:.85rem}
.ghb-t b{display:block;font-family:var(--mono);font-size:.65rem;font-weight:600;
  letter-spacing:.13em;text-transform:uppercase;white-space:nowrap;
  transform:translateX(-8px);opacity:0;
  transition:transform .38s cubic-bezier(.16,.84,.28,1),opacity .3s}
.ghb:hover,.ghb:focus-visible{width:106px;color:var(--ink);border-color:var(--ink3);
  background:color-mix(in srgb,var(--ink) 7%,transparent)}
.ghb:hover .ghb-t b,.ghb:focus-visible .ghb-t b{transform:translateX(0);opacity:1}

/* install — the one filled control on the site. Motion on hover only: the fill
   brightens from the leading edge and the arrow steps out. No idle sheen loop
   and no pulsing ring; two ambient loops on a single button was the clearest
   case of decoration competing with the theme switch for attention. */
.ins{position:relative;display:inline-flex;align-items:center;gap:.5rem;
  overflow:hidden;text-decoration:none;padding:0 .95rem;
  font-family:var(--mono);font-size:.66rem;letter-spacing:.13em;
  text-transform:uppercase;font-weight:700;
  color:var(--desk);background:var(--accent);border:1px solid var(--accent);
  transition:box-shadow .3s,filter .22s}
.ins-ic{display:grid;place-items:center;width:16px;height:16px;flex:0 0 16px;
  position:relative;z-index:1}
.ins-ic svg{width:16px;height:auto;display:block}
.ins-t,.ins-ar{position:relative;z-index:1}
.ins-ar{font-size:.8rem;opacity:0;width:0;transform:translateX(-4px);
  transition:opacity .26s,width .26s,transform .26s}
.ins-gl{position:absolute;inset:0;z-index:0;opacity:0;
  background:radial-gradient(120% 180% at 0% 50%,rgba(255,255,255,.5),transparent 62%);
  transition:opacity .3s}
.ins:hover,.ins:focus-visible{filter:brightness(1.06);
  box-shadow:0 5px 20px -6px color-mix(in srgb,var(--accent) 70%,transparent)}
.ins:hover .ins-gl,.ins:focus-visible .ins-gl{opacity:1}
.ins:hover .ins-ar,.ins:focus-visible .ins-ar{opacity:1;width:.8rem;transform:translateX(0)}
.ins:active{filter:brightness(.97)}

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
.thm{-webkit-appearance:none;appearance:none;background:none;border:0;padding:0;
  cursor:pointer;color:inherit;line-height:0;flex:0 0 auto;border-radius:999px}
.thm-tr{display:block;position:relative;width:56px;height:30px;border-radius:999px;
  border:1px solid var(--rule2);overflow:hidden;
  background:linear-gradient(165deg,#1B1830,#2A2340);
  transition:background .5s cubic-bezier(.4,0,.3,1),border-color .3s,box-shadow .3s}
.thm:hover .thm-tr,.thm:focus-visible .thm-tr{border-color:var(--accent);
  box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 16%,transparent)}
.thm-sky{position:absolute;inset:0}

/* stars — dark only */
.thm-st i{position:absolute;border-radius:50%;background:#EDEAF6;width:2px;height:2px;
  opacity:.85;animation:twinkle 3.6s ease-in-out infinite}
.thm-st i:nth-child(1){left:34px;top:7px}
.thm-st i:nth-child(2){left:43px;top:14px;animation-delay:.6s}
.thm-st i:nth-child(3){left:47px;top:6px;width:1.5px;height:1.5px;animation-delay:1.2s}
.thm-st i:nth-child(4){left:38px;top:21px;width:1.5px;height:1.5px;animation-delay:1.8s}
.thm-st i:nth-child(5){left:49px;top:19px;width:1.5px;height:1.5px;animation-delay:2.4s}
@keyframes twinkle{0%,100%{opacity:.2}50%{opacity:1}}
.thm-st{transition:opacity .4s}

/* clouds — light only. Two soft lozenges, drifting slowly. */
.thm-cl{position:absolute;inset:0;opacity:0;transition:opacity .45s}
.thm-cl i{position:absolute;background:#fff;border-radius:999px;opacity:.92}
.thm-cl i:nth-child(1){left:7px;top:17px;width:16px;height:6px;
  box-shadow:5px -4px 0 -1px #fff;animation:drift 7s ease-in-out infinite}
.thm-cl i:nth-child(2){left:5px;top:8px;width:10px;height:4px;opacity:.6;
  animation:drift 9s ease-in-out infinite reverse}
@keyframes drift{0%,100%{transform:translateX(0)}50%{transform:translateX(4px)}}

.thm-kn{position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;
  display:grid;place-items:center;
  transform:translateX(0);
  transition:transform .52s cubic-bezier(.5,-0.24,.28,1.32)}
.thm-kn svg{width:22px;height:22px;overflow:visible}
/* moon */
.thm-kn .orb{fill:#CFD8EA}
.thm-kn .craters{fill:#A8B3CC;opacity:1;transition:opacity .3s}
.thm-kn .cut{transform:translate(7.4px,-7.4px);
  transition:transform .5s cubic-bezier(.2,.8,.2,1)}
.thm-kn .rays{stroke:#F6C560;opacity:0;transform:scale(.5);transform-origin:12px 12px;
  transition:opacity .32s,transform .46s cubic-bezier(.2,.8,.2,1)}

/* the hover peek — leans toward the destination and previews its furniture */
.thm:hover .thm-kn{transform:translateX(5px)}
.thm:hover .thm-cl{opacity:.28}

/* LIGHT: knob crosses, mask occluder is pushed clear so the disc fills, rays fan
   out, the orb warms to a sun, craters go, clouds replace stars. */
:root[data-theme=light] .thm-tr{background:linear-gradient(165deg,#8FC4EF,#C9E4F7)}
:root[data-theme=light] .thm-kn{transform:translateX(26px)}
:root[data-theme=light] .thm:hover .thm-kn{transform:translateX(21px)}
:root[data-theme=light] .thm-kn .cut{transform:translate(30px,-30px)}
:root[data-theme=light] .thm-kn .orb{fill:#F6C560}
:root[data-theme=light] .thm-kn .craters{opacity:0}
:root[data-theme=light] .thm-kn .rays{opacity:1;transform:scale(1)}
:root[data-theme=light] .thm-st{opacity:0}
:root[data-theme=light] .thm-cl{opacity:1}
:root[data-theme=light] .thm:hover .thm-st{opacity:.35}
@media (prefers-color-scheme:light){
  :root:not([data-theme=dark]) .thm-tr{background:linear-gradient(165deg,#8FC4EF,#C9E4F7)}
  :root:not([data-theme=dark]) .thm-kn{transform:translateX(26px)}
  :root:not([data-theme=dark]) .thm:hover .thm-kn{transform:translateX(21px)}
  :root:not([data-theme=dark]) .thm-kn .cut{transform:translate(30px,-30px)}
  :root:not([data-theme=dark]) .thm-kn .orb{fill:#F6C560}
  :root:not([data-theme=dark]) .thm-kn .craters{opacity:0}
  :root:not([data-theme=dark]) .thm-kn .rays{opacity:1;transform:scale(1)}
  :root:not([data-theme=dark]) .thm-st{opacity:0}
  :root:not([data-theme=dark]) .thm-cl{opacity:1}
  :root:not([data-theme=dark]) .thm:hover .thm-st{opacity:.35}
}
@media (prefers-reduced-motion:reduce){
  .thm-st i,.thm-cl i{animation:none}
  .thm:hover .thm-kn{transform:translateX(0)}
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
})();`;

/* ──────────────────────────────── template ─────────────────────────────── */

// `out` identifies the current page so the active nav tab is DERIVED rather than
// inferred from the title. The previous `short === 'Terms' ? ... : 'privacy'`
// test silently assumed there would only ever be two pages, and quietly marked
// anything else as Privacy.
function shell({ title, short, kicker, accent, glow, body, toc, meta, out = '' }) {
    const slots = toc.filter(t => !t.sub).map(t =>
        `<a href="#${t.id}" class="slot"><i>${t.num ? esc(t.num) : '—'}</i><span>${esc(t.text)}</span></a>`
    ).join('');

    const active = Math.max(0, PAGES.findIndex(p => p.out === out));
    // Default: no travel. The real starting position comes from sessionStorage in
    // the inline script below, because only the browser knows which page you came
    // from — inventing a direction at build time would animate the wrong way for
    // half of all navigations.
    const from = active;

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
.seg{position:relative;display:grid;grid-auto-flow:column;grid-auto-columns:1fr;
  border-radius:999px;border:1px solid var(--rule2);padding:3px;
  background:color-mix(in srgb,var(--ink) 7%,transparent);isolation:isolate}
.seg-ink{position:absolute;z-index:0;top:3px;bottom:3px;left:3px;
  width:calc((100% - 6px)/var(--n));border-radius:999px;background:var(--paper);
  border:1px solid color-mix(in srgb,var(--accent) 55%,transparent);
  box-shadow:0 2px 9px -4px rgba(0,0,0,.55);
  transform:translateX(calc(var(--i) * 100%))}
/* Only animates once JS has supplied a real previous index — see the inline
   script under the switcher. Without JS the indicator is simply already correct. */
.seg.go .seg-ink{animation:segIn .5s cubic-bezier(.2,.85,.2,1) both}
@keyframes segIn{
  from{transform:translateX(calc(var(--from) * 100%))}
  to{transform:translateX(calc(var(--i) * 100%))}
}
.tab{position:relative;z-index:1;font-family:var(--mono);font-size:.66rem;letter-spacing:.1em;
  text-transform:uppercase;text-decoration:none;color:var(--ink2);padding:.4rem .8rem;
  text-align:center;border-radius:999px;transition:color .2s}
.tab:hover{color:var(--ink)}
.tab.on{color:var(--accent);font-weight:700}
@media (max-width:640px){
  .tab{padding:.4rem .45rem;font-size:.6rem;letter-spacing:.05em}
}

/* ── layout ──────────────────────────────────────────────────────── */
.page{max-width:1220px;margin:0 auto;padding:54px clamp(1rem,3vw,2rem) 0;
  display:grid;grid-template-columns:200px minmax(0,1fr);gap:clamp(1.5rem,4vw,3.5rem);align-items:start}
@media (max-width:980px){.page{grid-template-columns:1fr;gap:0}}

/* ── rail: the section index, tracking position ──────────────────── */
/* align-self:start is what keeps this out of the footer. Without it the rail
   stretches to the full height of its grid row, and a sticky element can travel
   the whole of its own box — so at the bottom of a long document it slid down
   over the footer that follows. Constrained to its own content height, it stops
   where the document stops. */
.rail{position:sticky;top:76px;align-self:start;padding:2.6rem 0 2rem;
  max-height:calc(100vh - 96px);overflow-y:auto;scrollbar-width:thin}
.rail::-webkit-scrollbar{width:3px}
.rail::-webkit-scrollbar-thumb{background:var(--rule2)}
.rail>.lab{display:block;margin-bottom:1rem;padding-left:.85rem}
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
  .rail>.lab .cur{margin-left:auto;color:var(--ink2);letter-spacing:.04em;
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
.foot{grid-column:1/-1;border-top:1px solid var(--rule);padding:2rem 0 3.5rem;
  display:flex;flex-wrap:wrap;gap:.7rem 2rem;align-items:baseline}
.foot p{margin:0;font-family:var(--mono);font-size:.7rem;line-height:1.7;
  letter-spacing:.04em;color:var(--ink3);max-width:60ch}
.foot a{color:var(--ink2)}

@media print{
  .bar,#prog,.rail,.anchor,.thm,.ghb{display:none!important}
  .authoritative{border:1px solid #999}
  p.shout,pre.block{border:1px solid #999;background:#fff;color:#000;break-inside:avoid}
  body{background:#fff;color:#000}
  .page{display:block;max-width:none;padding:0}
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
    <div class="seg" style="--n:${PAGES.length};--i:${active};--from:${from}">
      <span class="seg-ink" aria-hidden="true"></span>
      ${PAGES.map(p => `<a class="tab${p.out === out ? ' on' : ''}" href="./${p.out}"` +
        `${p.out === out ? ' aria-current="page"' : ''}>${esc(p.short)}</a>`).join('\n      ')}
    </div>
    ${repoBtn}
    ${installBtn()}
    ${themeBtn()}
  </nav>
</div>
<script>
/* Runs during parse, before first paint, so setting --from can't flash. Only the
   browser knows which tab you were on last, hence sessionStorage rather than a
   build-time guess. */
(function(){
  var seg=document.querySelector('.seg');
  if(!seg) return;
  var i=${active}, prev=null;
  try{ prev=sessionStorage.getItem('db-tab'); sessionStorage.setItem('db-tab',i); }catch(e){}
  if(prev!==null&&prev!==''&&+prev!==i){ seg.style.setProperty('--from',+prev); seg.classList.add('go'); }
})();
</script>
<div id="prog"></div>

<div class="page">
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

  <footer class="foot">
    <p>Dior's Builds is an unofficial fan project. Not affiliated with Activision Publishing, Inc., TiMi Studio Group, or Discord Inc.</p>
    <!-- PAGES already contains Notice, so the hand-added ../NOTICE link that used
         to sit here produced two "Notice" entries side by side. The email is gone
         too: it belongs on the landing page and in the Privacy Policy, and
         repeating it in every page footer is just noise. -->
    <p>${PAGES.map(p => `<a href="./${p.out}">${esc(p.short)}</a>`).join(' · ')}
      · ${EXTRA_PAGES.map(p => `<a href="./${p.out}">${esc(p.short)}</a>`).join(' · ')}</p>
  </footer>
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
    var cur=-1, y=h.scrollTop+130;
    for(var i=0;i<heads.length;i++){ if(heads[i]&&heads[i].offsetTop<=y) cur=i; }
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
function warmShell({ title, kicker, accent, glow, lede, badge, body, out }) {
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
.back{display:inline-flex;align-items:center;gap:.4rem;font-family:var(--mono);font-size:.66rem;
  letter-spacing:.11em;text-transform:uppercase;text-decoration:none;color:var(--ink3);
  border:1px solid var(--rule2);height:28px;padding:0 .6rem;transition:color .2s,border-color .2s}
.back:hover{color:var(--ink);border-color:var(--ink3)}
.back i{font-style:normal;transition:transform .24s}
.back:hover i{transform:translateX(-3px)}

/* The warm wash. This is the single strongest signal that you have left the
   legal set — those pages sit on flat graphite with no colour behind them. */
body{min-height:100vh;background:
  radial-gradient(120% 80% at 50% -12%,color-mix(in srgb,var(--accent) 15%,transparent),transparent 62%),
  radial-gradient(90% 60% at 88% 8%,color-mix(in srgb,var(--glow) 12%,transparent),transparent 55%),
  var(--desk)}
.wrap{max-width:760px;margin:0 auto;padding:calc(54px + clamp(2.6rem,9vh,5rem)) clamp(1.2rem,5vw,2rem) 4rem}

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
.card p,.card li{font-family:var(--serif);font-size:1.04rem;line-height:1.76;color:var(--ink2)}
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

/* CONTRIBUTORS' tables become credit plates rather than data grids: centred,
   generous, with the name as display type. It is a wall of names, not a readout. */
.tw{overflow-x:auto;margin:1.5rem 0;border-radius:12px;border:1px solid var(--rule);
  background:color-mix(in srgb,var(--accent) 6%,var(--raised))}
.card table{border-collapse:collapse;width:100%}
.card th{font-family:var(--mono);font-size:.6rem;letter-spacing:.14em;text-transform:uppercase;
  color:var(--ink3);font-weight:500;padding:.7rem .95rem;text-align:left;
  border-bottom:1px solid var(--rule)}
.card td{font-family:var(--serif);font-size:1rem;padding:.9rem .95rem;color:var(--ink2);
  border-bottom:1px solid var(--rule);vertical-align:top}
.card tbody tr:last-child td{border-bottom:0}
.card td:first-child strong{font-family:var(--display);font-size:1.06rem;font-weight:750;
  letter-spacing:-.02em;color:var(--ink)}
/* A slow sheen across the credit plate. The point of this page is that being on
   it feels good; a static table does not do that. */
.card td:first-child strong{background:linear-gradient(100deg,var(--ink) 30%,
  color-mix(in srgb,var(--accent) 85%,var(--ink)) 50%,var(--ink) 70%);
  background-size:220% 100%;-webkit-background-clip:text;background-clip:text;
  -webkit-text-fill-color:transparent;animation:plate 6s ease-in-out infinite}
@keyframes plate{0%,70%{background-position:120% 0}100%{background-position:-20% 0}}
@media (prefers-reduced-motion:reduce){
  .chip::before{animation:none}
  .card td:first-child strong{animation:none;-webkit-text-fill-color:var(--ink)}
}

.foot{margin-top:2.6rem;padding-top:1.5rem;border-top:1px solid var(--rule);
  display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:.1rem .6rem;
  font-family:var(--mono);font-size:.66rem;letter-spacing:.06em;text-transform:uppercase}
.foot a{color:var(--ink2);text-decoration:none;padding:.3rem .1rem;
  border-bottom:1px solid transparent;transition:color .2s,border-color .2s}
.foot a:hover{color:var(--ink);border-bottom-color:var(--accent)}
.foot span{color:var(--ink3);opacity:.5}
.sig{margin:1.4rem 0 0;text-align:center;font-family:var(--mono);font-size:.68rem;
  letter-spacing:.05em;color:var(--ink3)}
.sig b{color:var(--ink2);font-weight:600}
.hrt{color:var(--accent);display:inline-block;animation:pulse 2.6s ease-in-out infinite}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.18)}}
@media (prefers-reduced-motion:reduce){.hrt{animation:none}}
@media print{.bar,.thm,.ghb,.ins{display:none!important}
  body{background:#fff;color:#000}.card{border:0;box-shadow:none;border-radius:0}}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
html{scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
</style>
</head>
<body>

<div class="bar">
  ${wordmark('./')}
  <nav>
    <a class="back" href="./"><i>&#8249;</i> Legal</a>
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
  <main class="card">${body}</main>
  <!-- No bottom theme tray here. The header on this template already carries the
       switch, and offering the same control twice on one screen is just clutter.
       (The landing page is the exception: it has no fixed header, so its switch
       lives at the foot.) The four legal pages are listed by name rather than
       collapsed behind "Legal documents" — there are only four, so a group label
       hides more than it saves. The email is deliberately absent: it is on the
       landing page and in the Privacy Policy, which is enough. -->
  <nav class="foot">
    ${PAGES.map(p => `<a href="./${p.out}">${esc(p.short)}</a>`).join('<span>·</span>')}
    ${EXTRA_PAGES.filter(p => p.out !== out).map(p => `<span>·</span><a href="./${p.out}">${esc(p.short)}</a>`).join('')}
  </nav>
  <p class="sig">${DIOR_SIG}</p>
</div>
<script>${THEME_JS}</script>
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
        <span class="inv-h">
          <span class="inv-m" aria-hidden="true">${marks[p.out] || ''}</span>
          <span class="ik">${esc(p.kicker)}</span>
        </span>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.blurb)}</p>
        <span class="arw">Open <i>&#8594;</i></span>
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
.foot{margin-top:clamp(2.5rem,8vh,4rem);display:flex;flex-direction:column;gap:.5rem}
.foot p{margin:0;font-family:var(--mono);font-size:.68rem;line-height:1.75;letter-spacing:.04em;
  color:var(--ink3);max-width:62ch}
.foot a{color:var(--ink2)}
/* ── invitation cards: contributing / contributors ────────────────────
   Deliberately NOT rows in the numbered list above. The 01/02/03 series means
   "documents that bind you"; these are an offer. So: rounded where those are
   squared, warm where those are cold, and side by side rather than stacked in a
   ledger. The visual grammar carries the distinction on its own. */
.invite{display:grid;grid-template-columns:repeat(auto-fit,minmax(258px,1fr));gap:1rem;
  margin-top:clamp(2.2rem,6vh,3rem)}
.inv{position:relative;display:block;text-decoration:none;color:inherit;
  border-radius:16px;padding:1.45rem 1.5rem 1.35rem;background:var(--paper);
  border:1px solid var(--rule);
  transition:transform .34s cubic-bezier(.16,.84,.28,1),box-shadow .34s}

/* ONE effect, not four. The previous card stacked a lift, a border-gradient
   fade, a diagonal light sweep and a coloured shadow — four things firing at once,
   which is what made it read as effects-for-their-own-sake rather than a design.
   What remains is a single conic gradient rotating slowly around the card edge,
   masked to a 1px ring. It is the same "live readout" idea as the wordmark's
   slots, and it belongs to the card's own accent so the two cards never animate
   identically. */
.inv::before{content:"";position:absolute;inset:-1px;border-radius:17px;padding:1.4px;
  background:conic-gradient(from var(--a,0deg),transparent 0deg,
    color-mix(in srgb,var(--ia) 92%,white) 42deg,transparent 96deg,transparent 360deg);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;mask-composite:exclude;
  opacity:0;transition:opacity .34s;animation:orbit 3.6s linear infinite paused}
.inv:hover,.inv:focus-visible{transform:translateY(-3px);
  box-shadow:0 20px 44px -26px color-mix(in srgb,var(--ia) 55%,transparent)}
.inv:hover::before,.inv:focus-visible::before{opacity:1;animation-play-state:running}
@property --a{syntax:"<angle>";inherits:false;initial-value:0deg}
@keyframes orbit{to{--a:360deg}}

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
.inv .arw{display:inline-flex;align-items:center;gap:.4rem;margin-top:.95rem;
  font-family:var(--mono);font-size:.63rem;letter-spacing:.12em;text-transform:uppercase;
  color:var(--ia)}
.inv .arw i{font-style:normal;transition:transform .3s cubic-bezier(.16,.84,.28,1)}
.inv:hover .arw i{transform:translateX(5px)}
@media (prefers-reduced-motion:reduce){
  .inv::before{animation:none}
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
    <p>Dior's Builds is an unofficial fan project and is not affiliated with Activision Publishing, Inc., TiMi Studio Group, Tencent, Discord Inc., or with the rights holders of any content the game features under licence.</p>
    <p>Questions, corrections, or a privacy request — reach <b class="dh">diorswrld</b> on Discord.</p>
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
        const html = linkifyRefs(
            parsed.html.replace(/^\s*<hr>\s*/, '').replace(/\s*<hr>\s*$/, ''),
            ids
        );
        fs.writeFileSync(path.join(OUT, page.out), warmShell({ ...page, body: html }));
        built.push({ ...page, sections: parsed.toc.filter(t => !t.sub).length, extra: true });
        console.log(`  ✓ ${page.out}  ${parsed.toc.filter(t => !t.sub).length} sections · ${(html.length / 1024).toFixed(1)} KB`);
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
            .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
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
const ok = contentOk && linksOk && structOk && xrefOk;
// Names each property that was actually checked, rather than one word that reads
// as "the output is correct". Three gates test three different things, and a pass
// on one has already been mistaken for a pass on another once.
console.log(ok
    ? '\nDone. Content complete · links resolve · aligned blocks intact · cross-refs live.'
    : '\nFAILED — see the findings above.');
process.exit(ok ? 0 : 1);
