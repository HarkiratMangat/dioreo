/**
 * chronicle.js — the site's THIRD page family: the changelog and devlog pages.
 *
 * ─── why this is a third family, and not a reuse of either existing one ───────
 *
 * public/legal/ already has two page classes, and CLAUDE.md is explicit that they
 * must not collapse into each other:
 *
 *   shell()      the four numbered legal instruments. Cold graphite, hairline
 *                rules, squared corners, a numbered 01/02/03 margin index. The
 *                numbers are the whole point: they say "these bind you".
 *   warmShell()  contributing / contributors. Rounded, warm radial wash, glow,
 *                and NO numbers anywhere, because an invitation must never enter
 *                the number series.
 *
 * A release history is neither an instrument nor an invitation. It is a record of
 * what happened — so it takes its own family rather than borrowing the grammar of
 * obligation or the grammar of welcome. That is the same argument that keeps the
 * first two apart, applied once more.
 *
 * ─── THREE ARCHITECTURES, not three tints of one ────────────────────────────
 *
 * ⚠️ The first version of this file was one layout with three colour schemes, and
 * Harkirat rejected it on sight — correctly. Every page had the legal shell's
 * masthead stack, its document column and its rail, so "three identities" amounted
 * to an accent swap. Colour is the weakest possible carrier of identity: it is the
 * one thing a reader stops noticing after two seconds.
 *
 * What separates these three now is the GRID — what an entry physically is, where
 * the date lives, and what the eye does going down the page:
 *
 *   CHANGELOG-SUMMARY.md  broadcast  a NOTICE BOARD. The newest release is a hero
 *                                    panel; everything older is a two-column deck
 *                                    of compact cards. You scan, you do not read.
 *   CHANGELOG.md          record     a LEDGER. Each entry is a row: a fixed
 *                                    monospace key column (version · date · PR ·
 *                                    commit) beside the prose. Reads like a log.
 *   DEVLOG.md             notebook   a TIMELINE. A literal spine down the page
 *                                    with a node per entry, dates in the margin,
 *                                    lessons pushed out to the opposite side.
 *
 * They still share the bar, the nav and the footer, because that is what makes the
 * site one site and lets a reader cross between all nine pages — that part was in
 * the brief. Everything below the bar is each page's own.
 *
 * A voice therefore supplies its own masthead(), its own compose(), and its own
 * CSS. The skeleton below is deliberately thin: it owns the <head>, the chrome and
 * the scroll tracker, and nothing about layout.
 *
 * ─── the notebook voice is deliberately the quiet one ────────────────────────
 *
 * broadcast and record each take a hue from the two arcs of the wheel that BRAND
 * had left empty. The devlog does NOT take a third one. Six accents were already
 * in play before this file existed, and a seventh competing colour would have made
 * the site read as a swatch library. Its identity is near-achromatic — graphite ink
 * on warm paper with a single muted ochre — and restraint is a strong enough
 * signal precisely BECAUSE the other five pages are colourful. It is the one page
 * that looks like it was written rather than published.
 *
 * ─── contract with the build ────────────────────────────────────────────────
 *
 * Nothing is imported from buildLegalPages.js. Every shared piece of chrome — the
 * tokens, the component CSS, the switcher, the nav, the footer, the parser — is
 * PASSED IN as the `C` bundle. That direction is deliberate: buildLegalPages.js had
 * just absorbed 27 commits when this was written, and extracting two thousand lines
 * out of it to share them would have been a refactor of the most recently churned
 * file in the repo. A one-way parameter has none of that risk and no circular
 * require. If a piece of chrome is missing from `C`, this file fails loudly at the
 * point of use rather than rendering a page with a hole in it — see requireChrome().
 *
 * ⚠️ Write PLAIN `:hover` rules in the CSS below. They are wrapped in
 * `(hover:hover) and (pointer:fine)` mechanically by guardCss() at the single point
 * where a stylesheet reaches disk. Hand-writing the media query here is how the
 * guard's own audit ends up with something it cannot parse.
 */

'use strict';

/* Every key this module reaches for on the chrome bundle. Checked once, up front,
   so a missing piece is a build failure naming the piece — not a page that renders
   with a blank header and passes every content check, which is exactly the class of
   fault the legal build has been bitten by twice. */
const CHROME_KEYS = [
    'esc', 'parseBlocks', 'linkifyRefs', 'slug',
    'TOKENS', 'COMPONENT_CSS', 'SWITCHER_CSS', 'THEME_BOOT', 'THEME_JS', 'NAV_JS', 'GOO_SVG',
    'wordmark', 'repoBtn', 'installBtn', 'themeBtn', 'navSwitcher', 'mobileNav', 'pageFoot',
];

function requireChrome(C) {
    const missing = CHROME_KEYS.filter(k => C[k] === undefined);
    if (missing.length) {
        throw new Error(
            'chronicle.js: the chrome bundle is missing ' + missing.join(', ') +
            '. These are passed in from buildLegalPages.js; a page rendered without them ' +
            'would still pass the content gate, so this throws instead.'
        );
    }
    return C;
}

/* ══════════════════════════════ parsing ══════════════════════════════════ */

/**
 * Splits one of the three records into entries.
 *
 * All three are `## `-delimited, but their headings carry different fields, and the
 * parser is deliberately tolerant rather than three separate regexes: a heading it
 * cannot decompose still becomes an entry with a title, which degrades to a plain
 * dated block instead of vanishing. A record page that silently drops an entry it
 * could not parse is worse than one that renders it plainly.
 *
 *   CHANGELOG        ## v2.47.0 — 2026-08-01 03:05 EDT (#61 · `a4b17d6`) — Title
 *   CHANGELOG-SUMMARY ## v2.47.0 — August 1, 2026
 *                    ## v2.18.0–v2.18.3 — July 14–16, 2026     (a retired range)
 *                    ## 🔜 Coming soon                          (no version at all)
 *   DEVLOG           ## 2026-07-13 — The color-panel saga: one report, five root causes
 *
 * `# ` headings become PART markers rather than entries. Only DEVLOG has them
 * (Part A / Part B), and they are structural dividers in the timeline, not items in it.
 */
function parseChronicle(md, C) {
    const lines = md.split('\n');
    const entries = [];
    const parts = [];
    let preamble = [];
    let cur = null;

    const push = () => {
        if (cur) { cur.raw = cur.buf.join('\n').trim(); delete cur.buf; entries.push(cur); }
        cur = null;
    };

    for (const line of lines) {
        const h1 = line.match(/^#\s+(.+?)\s*$/);
        const h2 = line.match(/^##\s+(.+?)\s*$/);

        if (h2) {
            push();
            cur = { ...splitEntryHeading(h2[1], C), buf: [], part: parts.length ? parts[parts.length - 1].id : null };
            continue;
        }
        if (h1) {
            push();
            // The document's own title is not a part marker — it is the page title,
            // and the masthead renders it. Only later h1s divide the timeline.
            const text = h1[1];
            const id = 'part-' + C.slug(text).slice(0, 40);
            if (parts.length === 0 && entries.length === 0 && preamble.length === 0) {
                continue; // the leading "# DEVLOG — Dior's Builds"
            }
            // DEVLOG's in-document index is an h1 like the two Part markers, but it
            // is navigation rather than a division of the timeline. Demoting it into
            // the preamble as an h2 is what lets foldIndex() collapse it — and keeps
            // its heading words in the page, so the content gate stays satisfied.
            if (/table of contents/i.test(text) && entries.length === 0) {
                preamble.push('## ' + text);
                continue;
            }
            parts.push({ id, text });
            continue;
        }
        if (cur) cur.buf.push(line);
        else preamble.push(line);
    }
    push();

    // A part marker that arrives before any entry belongs to the entries that
    // FOLLOW it, which the loop above already records. Marking each part with the
    // index of its first entry is what lets the renderer interleave them without
    // re-scanning.
    for (const p of parts) {
        p.firstEntry = entries.findIndex(e => e.part === p.id);
    }

    return { entries, parts, preamble: preamble.join('\n').trim() };
}

/**
 * Pulls version / date / PR / hash / title out of one entry heading.
 *
 * Order matters: the PR block is removed BEFORE the title is split off, because the
 * hash inside it is delimited by backticks and the title separator is an em dash —
 * leaving the block in place makes "(#61 · `a4b17d6`)" part of whichever field the
 * split happens to land it in.
 */
function splitEntryHeading(raw, C) {
    let rest = raw;
    const out = { version: null, range: false, date: null, pr: null, hash: null, title: '', heading: raw };

    // (#61 · `a4b17d6`) or (#61)
    const prm = rest.match(/\(#(\d+)(?:\s*[·|,]\s*`([0-9a-f]{7,40})`)?\)/);
    if (prm) {
        out.pr = prm[1];
        out.hash = prm[2] || null;
        rest = (rest.slice(0, prm.index) + rest.slice(prm.index + prm[0].length)).replace(/\s{2,}/g, ' ');
    }

    // Leading version, possibly a retired range ("v2.18.0–v2.18.3").
    const vm = rest.match(/^(v\d+\.\d+(?:\.\d+)?)(?:\s*[–—]\s*(v\d+\.\d+(?:\.\d+)?))?\s*(?:[—–]\s*)?/);
    if (vm) {
        out.version = vm[1];
        if (vm[2]) { out.range = true; out.versionEnd = vm[2]; }
        rest = rest.slice(vm[0].length);
    } else {
        // DEVLOG: a bare ISO date, sometimes a two-day span ("2026-07-14/15").
        const dm = rest.match(/^(\d{4}-\d{2}-\d{2}(?:\/\d{1,2})?)\s*(?:[—–]\s*)?/);
        if (dm) { out.date = dm[1]; rest = rest.slice(dm[0].length); }
    }

    // What remains is either "<date> — <title>" or just one of the two. An em/en
    // dash separates them; a hyphen does not, because titles contain hyphens.
    const parts = rest.split(/\s+[—–]\s+/);
    if (out.date === null && parts.length > 1) {
        out.date = parts.shift().trim();
        out.title = parts.join(' — ').trim();
    } else {
        out.title = parts.join(' — ').trim();
    }
    if (!out.title && out.date && out.version === null) { out.title = out.date; out.date = null; }

    out.id = C.slug(
        (out.version || out.date || out.title || 'entry').replace(/\./g, '-')
    ) || 'entry';
    return out;
}

/* ══════════════════════════════ the voices ═══════════════════════════════ */

/**
 * A voice is everything that differs between the three pages. The skeleton below
 * consumes exactly these fields, so adding a fourth record later is a data change.
 *
 * `entryHead` is a function rather than a template flag because the three pages do
 * not merely style the same header differently — they show DIFFERENT FIELDS. The
 * summary has no PR and no commit; the devlog has no version at all. A single
 * parameterised header would have to render empty slots for the fields a given
 * record does not carry, and empty slots are how a design starts looking generated.
 */
const VOICES = {

    /* ── broadcast ────────────────────────────────────────────────────────────
       The player-facing page, and the only one a stranger is likely to land on.
       Poster register: an oversized version numeral doing the work a date does
       elsewhere, one card per release, generous measure, rounded corners. It reads
       as an announcement because that is what it is. No section rail — the summary
       is short enough that an index would be furniture. */
    broadcast: {
        name: 'broadcast',
        rail: false,
        /* ⚠️ The version is drawn ONCE, at display size, and it IS the heading.
           The first version of this had a big translucent version numeral as a
           watermark AND a small h2 repeating it, so every card read "v2.47.0
           v2.47.0 August 1, 2026" — the same duplicated-label mistake the nav
           indicator is documented for, arrived at from the opposite direction.
           Making the numeral itself the h2 removes the duplicate and is the more
           poster-like answer anyway: on this page the version IS the headline. */
        entryHead: (e, C) => `
          <div class="cxh cxh-b">
            <h2 id="${e.id}" class="cxbig">${C.esc(e.version || e.title)}</h2>
            ${e.date ? `<span class="cxd">${C.esc(e.date)}</span>` : ''}
            ${e.version && e.title ? `<span class="cxsub">${C.esc(e.title)}</span>` : ''}
          </div>`,
        css: `
/* One card per release. The numeral is a watermark rather than a label: it sits
   behind the heading at low contrast, so the eye gets the version without the
   version getting a line of its own. */
.cxe{position:relative;margin:0 0 1.15rem;padding:1.5rem clamp(1.1rem,3vw,2rem) 1.35rem;
  border:1px solid var(--rule);border-radius:18px;
  background:color-mix(in srgb,var(--card) 82%,transparent);overflow:hidden}
.cxe::before{content:"";position:absolute;inset:0 auto 0 0;width:3px;
  background:linear-gradient(180deg,var(--accent),color-mix(in srgb,var(--glow) 70%,transparent))}
.cxh-b{margin:0 0 1rem}
/* The version at display size. Monospace because a version number is a token, not
   a word, and the tabular figures keep a column of them optically aligned as you
   scroll — which is most of what makes the page scan as a series. */
.cxbig{margin:0;font-family:var(--mono);font-size:clamp(1.7rem,4.4vw,2.5rem);
  font-weight:800;letter-spacing:-.035em;line-height:1;color:var(--accent)}
.cxd{display:inline-block;margin:.5rem .6rem 0 0;font-family:var(--mono);font-size:.62rem;
  letter-spacing:.14em;text-transform:uppercase;color:var(--ink3)}
.cxsub{display:block;margin:.35rem 0 0;color:var(--ink);font-size:1rem;font-weight:600}
.cxe:hover{border-color:color-mix(in srgb,var(--accent) 40%,var(--rule))}
/* The "Coming soon" block leads the page and is not a release, so it is drawn as
   a forecast rather than a card: dashed, unfilled, explicitly not-yet. Its heading
   is prose rather than a version, so it drops to prose size too. */
.cxe.cxe-soon{border-style:dashed;background:transparent}
.cxe.cxe-soon .cxbig{font-family:inherit;font-size:1.25rem;letter-spacing:-.01em;
  font-weight:700;color:var(--ink)}
`,
    },

    /* ── record ───────────────────────────────────────────────────────────────
       The developer-facing changelog. Engineering register: dense, a monospace
       metadata strip carrying version · date · PR · commit, hairline dividers
       instead of cards, and a rail down the side listing every version. It is
       squared like the legal set — but on warm-neutral paper, never the cold
       graphite, because it is a record and not an instrument. */
    record: {
        name: 'record',
        rail: true,
        entryHead: (e, C) => `
          <div class="cxh cxh-r">
            <h2 id="${e.id}">${C.esc(e.title || e.version || '')}</h2>
            <div class="cxmeta">
              ${e.version ? `<span class="cxm cxm-v">${C.esc(e.version)}</span>` : ''}
              ${e.date ? `<span class="cxm">${C.esc(e.date)}</span>` : ''}
              ${e.pr ? `<span class="cxm">#${C.esc(e.pr)}</span>` : ''}
              ${e.hash ? `<span class="cxm cxm-h">${C.esc(e.hash)}</span>` : ''}
            </div>
          </div>`,
        css: `
/* No cards. A record is a continuous document, and boxing each entry would imply
   they are independent when the whole value is reading them in sequence. */
.cxe{margin:0 0 2.4rem;padding:0 0 2rem;border-bottom:1px solid var(--rule)}
.cxe:last-child{border-bottom:0}
.cxh-r h2{margin:0 0 .5rem;font-size:1.1rem;letter-spacing:-.01em;line-height:1.35}
.cxmeta{display:flex;flex-wrap:wrap;gap:.35rem;margin:0 0 1rem}
.cxm{font-family:var(--mono);font-size:.6rem;letter-spacing:.1em;text-transform:uppercase;
  padding:.2rem .45rem;border:1px solid var(--rule);border-radius:4px;color:var(--ink3);
  background:color-mix(in srgb,var(--card) 60%,transparent)}
.cxm-v{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 45%,var(--rule));
  font-weight:700}
.cxm-h{text-transform:none;letter-spacing:.04em}
/* A bold lead sentence opens most entries in this file. It is doing the job of a
   sub-heading, so it is allowed to look like one without the source having to
   change into something a plain Markdown reader would render worse. */
.cxe > p > strong:first-child{color:var(--ink)}
.cxe p{font-size:.94rem}
.cxe li{font-size:.94rem}
`,
    },

    /* ── notebook ─────────────────────────────────────────────────────────────
       The devlog. Long-form reading register — a wider measure, more air, and the
       `### Lesson` blocks lifted out of the flow as margin notes, because in the
       source they are the payload and in a plain render they disappear into the
       body. Near-achromatic on purpose: see the header comment. */
    notebook: {
        name: 'notebook',
        rail: true,
        entryHead: (e, C) => `
          <div class="cxh cxh-n">
            ${e.date ? `<span class="cxdate">${C.esc(e.date)}</span>` : ''}
            <h2 id="${e.id}">${C.esc(e.title || e.date || '')}</h2>
          </div>`,
        css: `
/* A notebook's MARGIN rule, not its horizontal ones.
   ⚠️ Ruled horizontal lines were tried first and removed after looking at them.
   A repeating gradient has one fixed interval; the prose line-height is ~1.74rem
   and the headings, lists and code blocks are all something else, so the rules
   drifted out of phase within a screen and struck through the text instead of
   sitting under it. No single interval can align across mixed leading, so the
   whole idea is unsound rather than mistuned — a vertical margin rule carries the
   same "written, not published" signal and has nothing to stay in phase with. */
.cxdoc{padding-left:clamp(0px,2.2vw,1.6rem);
  border-left:1px solid color-mix(in srgb,var(--accent) 22%,transparent)}
@media (max-width:980px){.cxdoc{border-left:0;padding-left:0}}
.cxe{margin:0 0 3rem;padding:0 0 .5rem}
.cxh-n{margin:0 0 1rem;padding:0 0 .55rem;border-bottom:1px solid var(--rule)}
.cxdate{display:block;font-family:var(--mono);font-size:.6rem;letter-spacing:.18em;
  text-transform:uppercase;color:var(--accent);margin:0 0 .3rem}
.cxh-n h2{margin:0;font-size:1.22rem;font-weight:600;letter-spacing:-.01em;line-height:1.35}
.cxe p{font-size:.98rem;line-height:1.78}
/* The lessons are the reason this document exists, so they leave the column. */
.cxlesson{margin:1.3rem 0;padding:.9rem 1.1rem;border-left:2px solid var(--accent);
  background:color-mix(in srgb,var(--accent) 6%,transparent);border-radius:0 10px 10px 0}
.cxlesson > .cxlesson-l{display:block;font-family:var(--mono);font-size:.58rem;
  letter-spacing:.18em;text-transform:uppercase;color:var(--accent);margin:0 0 .4rem}
.cxlesson p:last-child,.cxlesson ul:last-child{margin-bottom:0}
/* Part A / Part B. A full-width divider, because they split the document in half. */
.cxpart{margin:3.5rem 0 2rem;padding:1.1rem 0 0;border-top:2px solid var(--accent)}
.cxpart h2{margin:0;font-size:1.4rem;letter-spacing:-.02em}
`,
    },
};

/* ══════════════════════════════ rendering ════════════════════════════════ */

/**
 * Wraps `### Lesson` / `### Lessons` sections in the notebook voice.
 *
 * Operates on the rendered markup rather than the source for one reason: the
 * heading text is what identifies a lesson block, and matching it after rendering
 * means the match is against the same string a reader sees. It is also why this
 * cannot silently half-apply — chronicleStructAudit() counts what it actually did
 * and compares against a DECLARED expectation, not against a re-run of this code.
 */
function liftLessons(html) {
    let n = 0;
    // A lesson runs from its own <h3> to the next heading of any level, or the end.
    const out = html.replace(
        /<h3([^>]*)>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h[123]|$)/g,
        (whole, attrs, headInner, body) => {
            const text = headInner.replace(/<[^>]*>/g, '').trim().toLowerCase();
            if (!/^lessons?\b/.test(text)) return whole;
            n++;
            return `<div class="cxlesson"><span class="cxlesson-l">` +
                headInner.replace(/<[^>]*>/g, '') + `</span>${body}</div>`;
        }
    );
    return { html: out, count: n };
}

/**
 * Wraps a long in-document index in a disclosure.
 *
 * DEVLOG carries a ~60-line greppable table of contents written for `rg`, not for a
 * reader — "jump by searching the entry text, not a line number". Dropping it would
 * be content loss the verifier would correctly report, and leaving it inline puts
 * sixty lines of navigation ahead of the first word of the document. A disclosure
 * keeps every word in the page (so the gate stays honest) and keeps it out of the
 * way (so the page stays readable). It is open on no page by default.
 */
function foldIndex(html, C) {
    return html.replace(
        /<h2([^>]*)>([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2|$)/,
        (whole, attrs, headInner, body) => {
            const text = headInner.replace(/<[^>]*>/g, '').toLowerCase();
            if (!/table of contents/.test(text)) return whole;
            return `<details class="cxfold"><summary>${headInner.replace(/<[^>]*>/g, '')}</summary>` +
                `<div class="cxfold-b">${body}</div></details>`;
        }
    );
}

/**
 * Builds one chronicle page.
 *
 * `page` carries the same fields as a PAGES/EXTRA_PAGES entry plus `voice`, and the
 * caller has already read and parsed the source. Everything shared with the other
 * two families arrives on `C` — see the contract note at the top of this file.
 */
function chronicleShell({ page, parsed, C, stats }) {
    requireChrome(C);
    const voice = VOICES[page.voice];
    if (!voice) throw new Error(`chronicle.js: unknown voice "${page.voice}" for ${page.out}`);

    const { esc } = C;
    const bodyParts = [];
    const slots = [];
    let lessons = 0;

    if (parsed.preamble) {
        const pre = C.parseBlocks(parsed.preamble);
        bodyParts.push(`<div class="cxlede">${foldIndex(pre.html, C)}</div>`);
    }

    parsed.entries.forEach((e, i) => {
        // A part marker introduces the entry it precedes, so it is emitted here
        // rather than as its own pass over the list — interleaving after the fact
        // was the version that put Part B's divider at the bottom of the page.
        const part = parsed.parts.find(p => p.firstEntry === i);
        if (part) {
            bodyParts.push(`<div class="cxpart"><h2 id="${part.id}">${esc(part.text)}</h2></div>`);
            slots.push({ id: part.id, num: '', text: part.text, part: true });
        }

        const blocks = C.parseBlocks(e.raw);
        let inner = blocks.html;
        if (voice.name === 'notebook') {
            const lifted = liftLessons(inner);
            inner = lifted.html;
            lessons += lifted.count;
        }
        inner = C.linkifyRefs(inner, new Set());

        const soon = !e.version && /coming soon/i.test(e.title);
        bodyParts.push(
            `<article class="cxe${soon ? ' cxe-soon' : ''}">` +
            voice.entryHead(e, C) +
            inner +
            `</article>`
        );
        slots.push({
            id: e.id,
            num: e.version || e.date || '',
            text: e.title || e.version || e.date || '',
        });
    });

    const railSlots = voice.rail
        ? slots.map(s => `<a href="#${s.id}" class="slot${s.part ? ' slot-p' : ''}">` +
            `<i>${esc(s.num || '—')}</i><span>${esc(s.text)}</span></a>`).join('')
        : '';

    const cur = { out: page.out, dir: page.dir };
    const desc = page.blurb;

    return {
        html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title)} — Dior's Builds</title>
<meta name="description" content="${esc(desc)}">
<meta name="color-scheme" content="dark light">
${C.THEME_BOOT}
<meta property="og:title" content="${esc(page.title)} — Dior's Builds">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%2316131B'/%3E%3Crect x='6' y='6' width='20' height='4' rx='2' fill='${encodeURIComponent(page.accent)}'/%3E%3Crect x='6' y='14' width='20' height='4' rx='2' fill='%236E6782'/%3E%3Crect x='6' y='22' width='13' height='4' rx='2' fill='%236E6782'/%3E%3C/svg%3E">
<style>
${C.TOKENS}
:root{--accent:${page.accent};--glow:${page.glow}}
${C.COMPONENT_CSS}

.bar{position:fixed;inset:0 0 auto;height:54px;z-index:60;display:flex;align-items:center;
  gap:1.5rem;padding:0 clamp(1rem,3vw,2rem);background:color-mix(in srgb,var(--desk) 88%,transparent);
  backdrop-filter:blur(14px) saturate(1.3);border-bottom:1px solid var(--rule)}
.bar nav{margin-left:auto;display:flex;align-items:center;gap:.6rem}
#prog{position:fixed;top:53px;left:0;height:2px;width:0;z-index:61;background:var(--accent)}

${C.SWITCHER_CSS}

/* ── the chronicle skeleton, shared by all three voices ─────────────────
   Same two-part layout discipline as shell(): .page is only the centred
   wrapper and .cxcols carries the grid, with the footer inside .page but
   OUTSIDE the grid. A sticky element is bounded by its containing block, not
   by its own height, so a footer left inside the grid lets the rail travel
   across it — measured at 236px past the document on the legal pages before
   that was fixed. Do not fold these back together here either. */
.page{max-width:1220px;margin:0 auto;padding:54px clamp(1rem,3vw,2rem) 0}
.cxcols{display:grid;grid-template-columns:${voice.rail ? '210px minmax(0,1fr)' : 'minmax(0,1fr)'};
  gap:clamp(1.5rem,4vw,3.2rem);align-items:start}
@media (max-width:980px){.cxcols{grid-template-columns:1fr;gap:0}}
.cxdoc{position:relative;min-width:0;max-width:${voice.name === 'notebook' ? '74ch' : '82ch'};
  padding:clamp(2rem,6vh,3.4rem) 0 3rem}
${voice.rail ? '' : '.cxdoc{margin:0 auto}'}

/* Masthead. Deliberately NOT the legal masthead: no clause number, no revision,
   no jurisdiction line. A record is dated, not effective. */
.cxmast{margin:0 0 2.2rem}
.cxmast .lab{display:block;font-family:var(--mono);font-size:.58rem;letter-spacing:.22em;
  text-transform:uppercase;color:var(--accent);margin:0 0 .5rem}
.cxmast h1{margin:0;font-size:clamp(1.8rem,4.4vw,2.6rem);letter-spacing:-.03em;line-height:1.1}
.cxmast .cxlede-t{margin:.8rem 0 0;color:var(--ink2);max-width:56ch}
.cxcount{margin:1rem 0 0;font-family:var(--mono);font-size:.6rem;letter-spacing:.14em;
  text-transform:uppercase;color:var(--ink3)}

.cxlede{margin:0 0 2.4rem;color:var(--ink2)}
.cxlede p{font-size:.95rem}

/* The folded in-document index — see foldIndex(). */
.cxfold{margin:1.4rem 0;border:1px solid var(--rule);border-radius:12px;
  background:color-mix(in srgb,var(--card) 55%,transparent)}
.cxfold > summary{cursor:pointer;padding:.7rem 1rem;font-family:var(--mono);font-size:.62rem;
  letter-spacing:.14em;text-transform:uppercase;color:var(--ink2);list-style:none}
.cxfold > summary::-webkit-details-marker{display:none}
.cxfold > summary::after{content:"+";float:right;color:var(--accent)}
.cxfold[open] > summary::after{content:"−"}
.cxfold > summary:hover{color:var(--ink)}
.cxfold-b{padding:0 1rem 1rem;max-height:60vh;overflow:auto}
.cxfold-b li{font-size:.84rem}

/* The rail. Same mechanics as the legal rail, and the same JS drives it — the
   slot markup is identical on purpose so one implementation tracks both. */
.rail{position:sticky;top:74px;max-height:calc(100vh - 96px);overflow:auto;
  padding:clamp(2rem,6vh,3.4rem) 0 2rem}
.rail .lab{display:block;font-family:var(--mono);font-size:.56rem;letter-spacing:.2em;
  text-transform:uppercase;color:var(--ink3);margin:0 0 .7rem}
.slot{display:flex;gap:.5rem;padding:.3rem .45rem;border-radius:6px;text-decoration:none;
  color:var(--ink3);font-size:.76rem;line-height:1.35;border-left:2px solid transparent}
.slot i{flex:0 0 auto;font-style:normal;font-family:var(--mono);font-size:.62rem;
  color:var(--ink3);opacity:.8}
.slot span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.slot.on{color:var(--ink);border-left-color:var(--accent);
  background:color-mix(in srgb,var(--accent) 8%,transparent)}
.slot.on i{color:var(--accent)}
.slot:hover{color:var(--ink)}
.slot-p{margin-top:.6rem;color:var(--ink2);font-weight:600}
@media (max-width:980px){.rail{display:none}}

${voice.css}
</style>
</head>
<body>
${C.GOO_SVG}

<div class="bar">
  ${C.wordmark('../legal/', cur)}
  <nav>
    ${C.navSwitcher(cur)}
    ${C.repoBtn}
    ${C.installBtn()}
    ${C.themeBtn()}
  </nav>
</div>
<div id="prog"></div>
${C.mobileNav(cur, voice.rail ? railSlots : '')}

<div class="page">
  <div class="cxcols">
    ${voice.rail ? `<aside class="rail" id="rail">
      <span class="lab">${esc(page.railLabel || 'Releases')}</span>
      <div class="slots" id="slots">${railSlots}</div>
    </aside>` : ''}

    <main class="cxdoc">
      <header class="cxmast">
        <span class="lab">${esc(page.kicker)}</span>
        <h1>${esc(page.title)}</h1>
        <p class="cxlede-t">${esc(page.lede)}</p>
        <p class="cxcount">${esc(stats)}</p>
      </header>
      ${bodyParts.join('\n')}
    </main>
  </div>

  ${C.pageFoot(cur)}
</div>

<button class="totop" id="totop" aria-label="Back to top">
  <svg class="tt-ring" viewBox="0 0 46 46" aria-hidden="true" focusable="false">
    <circle class="tt-trk" cx="23" cy="23" r="20"/>
    <circle class="tt-bar" cx="23" cy="23" r="20"/>
  </svg>
  <span class="tt-ar" aria-hidden="true"><i></i><i></i></span>
</button>

<script>
(function(){
  /* The same progress/rail tracker the legal pages run. It keys on section id
     rather than on an index into a flat list, because the index is rendered twice
     (desktop rail + mobile panel) and exactly one copy is visible at any width —
     an index-based version highlighted whichever copy sat later in the DOM. */
  var prog=document.getElementById('prog');
  var top=document.getElementById('totop'), ttBar=top&&top.querySelector('.tt-bar');
  var slots=[].slice.call(document.querySelectorAll('.slot'));
  var rail=document.querySelector('.rail'), lastId=null;
  var ids=[],seen={};
  slots.forEach(function(a){
    var id=a.getAttribute('href').slice(1);
    if(!seen[id]){ seen[id]=1; ids.push(id); }
  });
  var heads=ids.map(function(id){return document.getElementById(id)});
  var queued=false;
  function paint(){
    var h=document.documentElement, max=h.scrollHeight-h.clientHeight;
    var frac=max>0?h.scrollTop/max:0;
    if(prog) prog.style.width=(frac*100)+'%';
    if(top){
      top.classList.toggle('on', h.scrollTop>h.clientHeight*0.6);
      if(ttBar) ttBar.style.strokeDashoffset=(125.66*(1-frac)).toFixed(2);
    }
    var cur=-1;
    for(var i=0;i<heads.length;i++){
      if(heads[i]&&heads[i].getBoundingClientRect().top<=130) cur=i;
    }
    if(max>0&&h.scrollTop>=max-2) cur=heads.length-1;
    var curId=cur>=0?ids[cur]:null;
    for(var j=0;j<slots.length;j++){
      slots[j].classList.toggle('on', slots[j].getAttribute('href').slice(1)===curId);
    }
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
    var curEl=document.getElementById('railcur');
    if(curEl){
      var t=curId?document.querySelector('.slot[href="#'+curId+'"] span'):null;
      curEl.textContent=t?t.textContent:'';
    }
    queued=false;
  }
  if(top){
    top.addEventListener('click',function(){
      top.classList.remove('fire');
      void top.offsetWidth;
      top.classList.add('fire');
      var slow=matchMedia('(prefers-reduced-motion:reduce)').matches;
      scrollTo({top:0,behavior:slow?'auto':'smooth'});
    });
    top.addEventListener('animationend',function(){ top.classList.remove('fire'); });
  }
  addEventListener('scroll',function(){ if(!queued){queued=true;requestAnimationFrame(paint);} },{passive:true});
  addEventListener('resize',paint); paint();
})();
${C.THEME_JS}
${C.NAV_JS}
</script>
</body>
</html>`,
        entries: parsed.entries.length,
        parts: parsed.parts.length,
        lessons,
    };
}

module.exports = { parseChronicle, splitEntryHeading, chronicleShell, VOICES, CHROME_KEYS };
