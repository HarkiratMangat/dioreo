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
 * WHY A HAND-ROLLED PARSER AND NOT `marked`:
 * This repo carries no Markdown dependency, and NOTICE §3 commits us to re-auditing
 * the dependency tree (for copyleft) on every addition. The input here is a closed
 * set — two files we author ourselves — so a parser covering exactly the constructs
 * they use is cheaper and lower-risk than a new supply-chain entry. It is NOT a
 * general-purpose Markdown implementation and should not be reused as one.
 * `verify()` below guards the real risk (silently dropped content).
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
 * Cloudflare Pages setup: no build command, output directory `public`.
 * No API token, and nothing in .env — Pages deploys via dashboard Git integration
 * or `wrangler login`. A Cloudflare credential must never enter the bot's runtime env.
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
    teal: '#17A2A2'       // Cyber Teal     — commands/timestamp.js
};

const PAGES = [
    {
        file: 'TERMS.md', out: 'terms.html', title: 'Terms of Service',
        short: 'Terms', kicker: 'Agreement',
        accent: BRAND.amber, glow: BRAND.plum,
        blurb: 'What the bot does, what you agree to, and the limits of what we promise.'
    },
    {
        file: 'PRIVACY.md', out: 'privacy.html', title: 'Privacy Policy',
        short: 'Privacy', kicker: 'Data',
        accent: BRAND.teal, glow: BRAND.emerald,
        blurb: 'Every field stored about you, where it lives, and how to have it deleted.'
    }
];

/* ─────────────────────────── inline formatting ─────────────────────────── */

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Exactly what the deployed site contains, relative to a page inside legal/.
// Keep this in step with build()/buildCompanions() — if a new file starts being
// published, add it here or its cross-references stay inert text.
const PUBLISHED_TARGETS = new Set([
    'terms.html', 'privacy.html', 'index.html', '',
    '../LICENSE', '../NOTICE',
]);
const isPublished = href => PUBLISHED_TARGETS.has(href.split('#')[0]);

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
        // source markdown points at — CLAUDE.md, ROADMAP.md, models/*.js, the
        // rules files — exists only in the repo, which a reader may not be able to
        // see (and the repo may be private at any time). Emitting those as links
        // publishes guaranteed 404s inside a legal document, so they degrade to
        // plain text instead. Verified by the build's own link audit, which found
        // seven dead links the first time this ran.
        return isPublished(href)
            ? `<a href="${href}">${t}</a>`
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
        return seg.replace(/§\s?(\d+[A-Za-z]?(?:\.\d+[a-z]?)?)/g, (whole, n) => {
            const id = 's-' + n.toLowerCase();
            return ids.has(id) ? `<a class="xref" href="#${id}">§${n}</a>` : whole;
        });
    }).join('');
}

/* ───────────────────────────── block parsing ───────────────────────────── */

function parseBlocks(md) {
    const lines = md.split('\n');
    const out = [];
    const toc = [];
    let i = 0;

    const isListStart = l => /^\s*([-*]|\d+\.)\s+/.test(l);

    while (i < lines.length) {
        const line = lines[i];
        if (!line.trim()) { i++; continue; }

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
:root[data-theme=light]{
  --desk:#DCD8D1; --paper:#FCFBF9; --raised:#F2F0EB;
  --rule:#DED9D0; --rule2:#C9C3B8;
  --ink:#191521; --ink2:#544E5E; --ink3:#8A8393;
  --shadow:0 20px 50px -30px rgba(40,32,50,.45);
}
@media (prefers-color-scheme:light){
  :root:not([data-theme=dark]){
    --desk:#DCD8D1; --paper:#FCFBF9; --raised:#F2F0EB;
    --rule:#DED9D0; --rule2:#C9C3B8;
    --ink:#191521; --ink2:#544E5E; --ink3:#8A8393;
    --shadow:0 20px 50px -30px rgba(40,32,50,.45);
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

/* ──────────────────────────────── template ─────────────────────────────── */

// `out` identifies the current page so the active nav tab is DERIVED rather than
// inferred from the title. The previous `short === 'Terms' ? ... : 'privacy'`
// test silently assumed there would only ever be two pages, and quietly marked
// anything else as Privacy.
function shell({ title, short, kicker, accent, glow, body, toc, meta, other, otherShort, out = '' }) {
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

/* ── top bar ─────────────────────────────────────────────────────── */
.bar{position:fixed;inset:0 0 auto;height:54px;z-index:60;display:flex;align-items:center;
  gap:1.5rem;padding:0 clamp(1rem,3vw,2rem);background:color-mix(in srgb,var(--desk) 88%,transparent);
  backdrop-filter:blur(14px) saturate(1.3);border-bottom:1px solid var(--rule)}
.mark{display:flex;align-items:center;gap:.6rem;text-decoration:none;color:var(--ink);
  font-family:var(--display);font-weight:700;font-size:.9rem;letter-spacing:-.01em;white-space:nowrap}
.mark b{display:block;width:3px;height:17px;background:var(--accent)}
.bar nav{margin-left:auto;display:flex;align-items:center;gap:.35rem}
.tab{font-family:var(--mono);font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;
  text-decoration:none;color:var(--ink3);padding:.42rem .7rem;border:1px solid transparent}
.tab:hover{color:var(--ink2)}
.tab.on{color:var(--ink);border-color:var(--rule2);background:var(--raised)}
#th{margin-left:.4rem;width:32px;height:28px;display:grid;place-items:center;cursor:pointer;
  background:none;border:1px solid var(--rule2);color:var(--ink3);font-size:.85rem;line-height:1}
#th:hover{color:var(--ink)}
#prog{position:fixed;top:53px;left:0;height:2px;width:0;z-index:61;background:var(--accent)}

/* ── layout ──────────────────────────────────────────────────────── */
.page{max-width:1220px;margin:0 auto;padding:54px clamp(1rem,3vw,2rem) 0;
  display:grid;grid-template-columns:200px minmax(0,1fr);gap:clamp(1.5rem,4vw,3.5rem);align-items:start}
@media (max-width:980px){.page{grid-template-columns:1fr;gap:0}}

/* ── rail: the section index, tracking position ──────────────────── */
.rail{position:sticky;top:76px;padding:2.6rem 0 2rem;max-height:calc(100vh - 96px);
  overflow-y:auto;scrollbar-width:thin}
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
@media (max-width:980px){
  .rail{position:static;max-height:none;padding:1.6rem 0 0}
  .rail>.lab{cursor:pointer;padding:.8rem 1rem;border:1px solid var(--rule);
    background:var(--paper);margin:0;display:flex;justify-content:space-between;align-items:center}
  .rail>.lab::after{content:"+";font-size:.9rem}
  .rail.open>.lab::after{content:"–"}
  .slots{display:none;padding-top:.7rem}
  .rail.open .slots{display:block}
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
  .bar,#prog,.rail,.anchor,#th{display:none!important}
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
  <a class="mark" href="./"><b></b> Dior's Builds</a>
  <nav>
    <a class="tab${out === 'terms.html' ? ' on' : ''}" href="./terms.html">Terms</a>
    <a class="tab${out === 'privacy.html' ? ' on' : ''}" href="./privacy.html">Privacy</a>
    <button id="th" title="Toggle light or dark" aria-label="Toggle light or dark">◐</button>
  </nav>
</div>
<div id="prog"></div>

<div class="page">
  <aside class="rail" id="rail">
    <span class="lab">Sections</span>
    <div class="slots">${slots}</div>
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
    <p><a href="./terms.html">Terms</a> · <a href="./privacy.html">Privacy</a> · <a href="mailto:harkirat117@gmail.com">harkirat117@gmail.com</a></p>
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
    queued=false;
  }
  addEventListener('scroll',function(){ if(!queued){queued=true;requestAnimationFrame(paint);} },{passive:true});
  addEventListener('resize',paint); paint();

  var rail=document.getElementById('rail');
  rail.querySelector('.lab').addEventListener('click',function(){ rail.classList.toggle('open'); });
  slots.forEach(function(a){ a.addEventListener('click',function(){ rail.classList.remove('open'); }); });

  // Theme choice is per-browser and deliberately never sent anywhere.
  var btn=document.getElementById('th');
  try{ var s=localStorage.getItem('db-theme'); if(s) document.documentElement.setAttribute('data-theme',s); }catch(e){}
  btn.addEventListener('click',function(){
    var d=document.documentElement, cur=d.getAttribute('data-theme');
    if(!cur) cur=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';
    var next=cur==='dark'?'light':'dark';
    d.setAttribute('data-theme',next);
    try{ localStorage.setItem('db-theme',next); }catch(e){}
  });
})();
</script>
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

    return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Legal — Dior's Builds</title>
<meta name="description" content="Terms of Service and Privacy Policy for Dior's Builds, an unofficial Call of Duty: Mobile Discord bot.">
<meta name="color-scheme" content="dark light">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%2316131B'/%3E%3Crect x='6' y='7' width='20' height='3' fill='%23F2994A'/%3E%3Crect x='6' y='14' width='14' height='3' fill='%236E6782'/%3E%3Crect x='6' y='21' width='17' height='3' fill='%236E6782'/%3E%3C/svg%3E">
<style>
${TOKENS}
:root{--accent:${BRAND.amber}}
body{min-height:100vh;display:flex;align-items:center;padding:clamp(2rem,8vh,6rem) clamp(1.2rem,5vw,2rem)}
.wrap{width:100%;max-width:780px;margin:0 auto}
.mark{display:flex;align-items:center;gap:.6rem;margin-bottom:clamp(2.5rem,9vh,5rem);
  font-family:var(--display);font-weight:700;font-size:.9rem;color:var(--ink);letter-spacing:-.01em}
.mark b{display:block;width:3px;height:17px;background:${BRAND.amber}}
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
</style></head><body>
<div class="wrap">
  <div class="mark"><b></b> Dior's Builds</div>
  <span class="lab">Legal</span>
  <h1>The fine print,<br>written to be read.</h1>
  <p class="lede">Two documents. What you agree to by using the bot, and exactly what it stores about you — down to the individual database field.</p>
  <div class="list">${rows}</div>
  <div class="foot">
    <p>Dior's Builds is an unofficial fan project and is not affiliated with Activision Publishing, Inc., TiMi Studio Group, Tencent, or Discord Inc.</p>
    <p>Questions, corrections, or a privacy request — <a href="mailto:harkirat117@gmail.com">harkirat117@gmail.com</a></p>
  </div>
</div></body></html>`;
}

/* ───────────────────────────────── build ───────────────────────────────── */

function build() {
    fs.mkdirSync(OUT, { recursive: true });
    const built = [];

    for (const page of PAGES) {
        const md = fs.readFileSync(path.join(SRC, page.file), 'utf8');

        // Pull the metadata straight out of the document, so the page can never
        // advertise a version or date the source doesn't actually carry.
        const ver = (md.match(/^\*\*Version:\*\*\s*(.+)$/m) || [])[1];
        const eff = (md.match(/^\*\*Effective date:\*\*\s*(.+)$/m) || [])[1];
        const meta = [];
        if (eff) meta.push(`Effective <b>${esc(eff.trim())}</b>`);
        if (ver) meta.push(`Revision <b>${esc(ver.trim())}</b>`);
        meta.push('Ontario, Canada');

        // Strip the H1 and the metadata block; the masthead renders them instead.
        const src = md
            .replace(/^#\s+.*$/m, '')
            .replace(/^\*\*(Effective date|Version|Applies to):\*\*.*$/gm, '')
            .trim();

        const parsed = parseBlocks(src);
        const ids = new Set(parsed.toc.map(t => t.id));
        // Stripping the metadata block leaves the rule that separated it from the
        // content as the first element, which renders as dead space under the
        // masthead. Drop a leading (or trailing) rule.
        const html = linkifyRefs(
            parsed.html.replace(/^\s*<hr>\s*/, '').replace(/\s*<hr>\s*$/, ''),
            ids
        );

        const otherPage = PAGES.find(p => p !== page);
        fs.writeFileSync(path.join(OUT, page.out), shell({
            ...page, body: html, toc: parsed.toc, meta,
            other: otherPage.out, otherShort: otherPage.short
        }));

        const xrefs = (html.match(/class="xref"/g) || []).length;
        built.push({ ...page, sections: parsed.toc.filter(t => !t.sub).length });
        console.log(`  ✓ ${page.out}  ${parsed.toc.filter(t => !t.sub).length} sections · ${xrefs} live §-refs · ${(html.length / 1024).toFixed(1)} KB`);
    }

    fs.writeFileSync(path.join(OUT, 'index.html'), indexPage(built));
    console.log('  ✓ index.html');
    buildCompanions();
    return built;
}

/**
 * TERMS.md and PRIVACY.md link to `../LICENSE`, `../NOTICE`, and
 * `../CONTRIBUTING.html` — the licence and CLA a reader is entitled to reach from
 * the documents that cite them. Those resolve one level ABOVE the legal/
 * directory, so the deployed site root has to carry them or every one of those
 * links 404s in a published legal document. Caught exactly that way: the first
 * deploy plan uploaded `public/legal` alone, which would have shipped three dead
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

    // CONTRIBUTING.md is deliberately NOT published. It was, briefly, and a link
    // audit showed why that is wrong: it cross-references CLAUDE.md, ROADMAP.md,
    // CONTRIBUTORS.md and docs/reference/, none of which are published, so it
    // shipped four dead links. It is also a document about working on the repo —
    // moot to a reader who cannot see the repo. PUBLISHED_TARGETS below is what
    // makes references to it render as plain text instead of broken links.
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
        ).join(' ') + ' ';

        // Mirror build()'s own removals: the H1 and the metadata block are moved
        // into the masthead by design, so they are not expected in the body.
        const md = fs.readFileSync(path.join(SRC, page.file), 'utf8')
            .replace(/^#\s+.*$/m, '')
            .replace(/^\*\*(Effective date|Version|Applies to):\*\*.*$/gm, '');

        const srcWords = words(md
            .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')   // link text survives, target doesn't
            .replace(/https?:\/\/\S+/g, ' ')
            .replace(/<!--[\s\S]*?-->/g, ' ')
            // Ordered-list markers ("1.", "2.") are structure, not content: an
            // <ol> renders its numbers with CSS counters, so the literal digit
            // correctly never appears in the rendered text. Without this the
            // check reports ~17 false misses per document.
            .replace(/^\s*\d+\.\s+/gm, ' '));

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

console.log('Building legal pages →', path.relative(ROOT, OUT));
const built = build();
console.log('\nVerifying rendered output against source:');
const contentOk = verify(built);
console.log('\nAuditing internal links:');
const linksOk = linkAudit();
const ok = contentOk && linksOk;
console.log(ok
    ? '\nDone. All content accounted for and every link resolves.'
    : '\nFAILED — see the findings above.');
process.exit(ok ? 0 : 1);
