/**
 * chronicle.js — the site's THIRD page family: the changelog and devlog pages.
 *
 * ─── the design this implements ──────────────────────────────────────────────
 *
 * "The Armory Terminal", Harkirat's own changelog design from 2026-07-11 (memory
 * `project_changelog_redesign`). It is a committed single dark world — a
 * gunsmith/ordnance terminal — and it deliberately does NOT use the bot's brand
 * palette, which is the whole reason it reads as a different place from the legal
 * site rather than a recoloured copy of it:
 *
 *   gunmetal near-black  #0C100E   green-biased, not neutral
 *   phosphor             #E9E7DE   off-white, never pure
 *   Martian Mono                   squarish mechanical face, version stamps
 *   Instrument Sans                humanist, reading copy
 *
 * And its central idea, which is the "identity shift" Harkirat asked to keep:
 * **the pages are not three websites, they are three OPERATORS reading the same
 * terminal.** The world is constant; who is at the console changes, and with them
 * the type, the density, the signal colour, and how much machine detail is exposed.
 *
 *   CHANGELOG-SUMMARY.md   PATCH NOTES     humanist, roomy, no machine detail.
 *                                          A NOTICE BOARD: newest release is a
 *                                          hero panel, the rest a deck of cards.
 *                                          Signal: tracer amber #FF9E3D.
 *
 *   CHANGELOG.md           FIELD ENGINEER  monospace everything, commit SHAs and
 *                                          PR numbers exposed, dense, scanlines.
 *                                          A LEDGER: fixed key column beside the
 *                                          prose, plus the ordnance-belt rail and
 *                                          the solo-era/collab-era break.
 *                                          Signal: phosphor green #7CE38B.
 *
 *   DEVLOG.md              LOG KEEPER      the third operator, added when the
 *                                          devlog became a published page. A
 *                                          TIMELINE: a spine that draws itself
 *                                          down the page, a node per entry, and
 *                                          the Lesson blocks pushed out into the
 *                                          margin as debriefs.
 *                                          Signal: ice #8FB8FF.
 *
 * ⚠️ The first attempt at this file was one layout in three accent colours, and it
 * was rejected on sight — correctly. Colour is the weakest carrier of identity; a
 * reader stops seeing it in two seconds. What separates these three is the GRID:
 * what an entry physically IS, where the date lives, and what the eye does going
 * down the page. If a future change makes all three use the same wrapper again,
 * the identities are gone no matter how many hues are in play.
 *
 * The bar, the nav and the footer ARE shared with the legal site — that was in the
 * brief, it is what makes nine pages one site, and it is why the token overrides
 * below re-skin the shared chrome into this world for free.
 *
 * ─── assets ─────────────────────────────────────────────────────────────────
 *
 * Everything is SELF-HOSTED from public/assets/ and nothing is fetched from a CDN
 * at runtime. That is not a preference: the Privacy Policy is published on this
 * same origin and documents what is collected, and a CDN font or script would hand
 * every visitor's IP to a third party the policy does not disclose — which would
 * make a published legal document false. Fonts are Martian Mono and Instrument Sans
 * (both SIL OFL 1.1); the animation library is Motion One (MIT). All three are
 * attributed in NOTICE, and all three are permissive — NOTICE §3 commits to a tree
 * with no copyleft in it.
 *
 * ─── contract with the build ────────────────────────────────────────────────
 *
 * Nothing is imported from buildLegalPages.js. Every shared piece of chrome is
 * PASSED IN as the `C` bundle, one way. buildLegalPages.js had just absorbed 27
 * commits when this was written, and lifting two thousand lines out of it to share
 * them would have been a refactor of the most recently churned file in the repo.
 * requireChrome() throws on a missing key rather than rendering a page with a hole
 * that a content gate would happily call complete.
 *
 * ⚠️ Write PLAIN `:hover` rules. guardCss() wraps them in
 * `(hover:hover) and (pointer:fine)` at the single point where a stylesheet reaches
 * disk. Hand-writing the query here is how the guard's audit ends up unparseable.
 * ⚠️ No backticks inside the CSS strings — this file is template literals, and a
 * backtick in a stylesheet comment ends the string with a SyntaxError pointing at
 * CSS. It has happened three times on this site now. `node --check` catches it.
 */

'use strict';

const CHROME_KEYS = [
    'esc', 'parseBlocks', 'linkifyRefs', 'slug',
    'TOKENS', 'COMPONENT_CSS', 'SWITCHER_CSS', 'THEME_BOOT', 'THEME_JS', 'NAV_JS', 'GOO_SVG',
    'MORPH_JS',
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
 * parser is tolerant rather than three separate regexes: a heading it cannot
 * decompose still becomes an entry with a title, which degrades to a plain dated
 * block instead of vanishing. A page that silently drops an entry it could not
 * parse is worse than one that renders it plainly.
 *
 *   CHANGELOG         ## v2.47.0 - 2026-08-01 03:05 EDT (#61 · hash) - Title
 *   CHANGELOG-SUMMARY ## v2.47.0 - August 1, 2026
 *                     ## v2.18.0-v2.18.3 - July 14-16, 2026      (a retired range)
 *                     ## Coming soon                             (no version)
 *   DEVLOG            ## 2026-07-13 - The color-panel saga
 *
 * `# ` headings become PART markers, not entries. Only DEVLOG has them (Part A /
 * Part B): they divide the timeline rather than sit in it.
 */
function parseChronicle(md, C) {
    const lines = md.split('\n');
    const entries = [];
    const parts = [];
    const preamble = [];
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
            cur = {
                ...splitEntryHeading(h2[1], C), buf: [],
                part: parts.length ? parts[parts.length - 1].id : null,
            };
            continue;
        }
        if (h1) {
            push();
            const text = h1[1];
            if (parts.length === 0 && entries.length === 0 && preamble.length === 0) {
                continue; // the document's own title; the masthead renders it
            }
            // DEVLOG's in-document index is an h1 like the Part markers, but it is
            // navigation, not a division of the timeline. Demoting it into the
            // preamble as an h2 lets foldIndex() collapse it while keeping its words
            // in the page, so the content gate stays satisfied.
            if (/table of contents/i.test(text) && entries.length === 0) {
                preamble.push('## ' + text);
                continue;
            }
            parts.push({ id: 'part-' + C.slug(text).slice(0, 40), text });
            continue;
        }
        if (cur) cur.buf.push(line);
        else preamble.push(line);
    }
    push();

    for (const p of parts) p.firstEntry = entries.findIndex(e => e.part === p.id);

    return { entries, parts, preamble: preamble.join('\n').trim() };
}

/**
 * Pulls version / date / PR / hash / title out of one entry heading.
 *
 * Order matters: the PR block is removed BEFORE the title is split off, because the
 * hash inside it is backtick-delimited and the title separator is an em dash — leave
 * the block in and it joins whichever field the split lands it in.
 */
function splitEntryHeading(raw, C) {
    let rest = raw;
    const out = { version: null, range: false, date: null, pr: null, hash: null, title: '', heading: raw };

    const prm = rest.match(/\(#(\d+)(?:\s*[·|,]\s*`([0-9a-f]{7,40})`)?\)/);
    if (prm) {
        out.pr = prm[1];
        out.hash = prm[2] || null;
        rest = (rest.slice(0, prm.index) + rest.slice(prm.index + prm[0].length)).replace(/\s{2,}/g, ' ');
    }

    const vm = rest.match(/^(v\d+\.\d+(?:\.\d+)?)(?:\s*[–—]\s*(v\d+\.\d+(?:\.\d+)?))?\s*(?:[—–]\s*)?/);
    if (vm) {
        out.version = vm[1];
        if (vm[2]) { out.range = true; out.versionEnd = vm[2]; }
        rest = rest.slice(vm[0].length);
    } else {
        const dm = rest.match(/^(\d{4}-\d{2}-\d{2}(?:\/\d{1,2})?)\s*(?:[—–]\s*)?/);
        if (dm) { out.date = dm[1]; rest = rest.slice(dm[0].length); }
    }

    const bits = rest.split(/\s+[—–]\s+/);
    if (out.date === null && bits.length > 1) {
        out.date = bits.shift().trim();
        out.title = bits.join(' — ').trim();
    } else {
        out.title = bits.join(' — ').trim();
    }
    if (!out.title && out.date && out.version === null) { out.title = out.date; out.date = null; }

    // Entry titles are set as headings and listed in the rail, and both go through
    // esc() rather than the inline Markdown formatter — so a title containing a code
    // span or emphasis printed its own markers, and the rail read
    // "Earlier milestones `[backfill". Stripping the markers is safe for every gate:
    // they are punctuation, and both verify() and chronicleStructAudit() compare on a
    // letters-and-digits reduction that discards them from BOTH sides anyway.
    out.title = out.title.replace(/[`*_]/g, '').trim();

    out.id = C.slug((out.version || out.date || out.title || 'entry').replace(/\./g, '-')) || 'entry';
    // A release whose MODERATE and MINOR are both zero is a milestone; the ordnance
    // belt draws those as filled rounds and everything else as hollow ticks.
    out.major = !!(out.version && /^v\d+\.0\.0$/.test(out.version));
    return out;
}

/* ══════════════════════════ shared world tokens ══════════════════════════ */

/**
 * The terminal world, applied to all three pages.
 *
 * These OVERRIDE the site tokens rather than extending them, which is what re-skins
 * the shared bar, nav and footer into this world without touching their code.
 *
 * The light variant is a daylight terminal, not a white page. The site has a theme
 * toggle and breaking it on three of nine pages would be worse than the reference's
 * single-theme-dark choice is good — but turning the console into white paper would
 * lose the world entirely, so light means "sunlit gunmetal".
 */
const WORLD = `
@font-face{font-family:'Martian Mono';font-style:normal;font-weight:400;font-display:swap;
  src:url(../assets/martian-mono-400.woff2) format('woff2')}
@font-face{font-family:'Martian Mono';font-style:normal;font-weight:700;font-display:swap;
  src:url(../assets/martian-mono-700.woff2) format('woff2')}
@font-face{font-family:'Instrument Sans';font-style:normal;font-weight:400;font-display:swap;
  src:url(../assets/instrument-sans-400.woff2) format('woff2')}
@font-face{font-family:'Instrument Sans';font-style:normal;font-weight:600;font-display:swap;
  src:url(../assets/instrument-sans-600.woff2) format('woff2')}

/* ⚠️ --ink3 was #6B7A6D dark / #63705F light, and BOTH failed WCAG AA for small
   text (4.22:1 and 3.82:1 measured against their own backgrounds). It carries the
   dates, the version stamps and the operator line — all small monospace, i.e. the
   text that needs contrast MOST. Nudged to the nearest value that clears 4.5:1
   keeping hue and saturation. Do not darken them back for looks. */
:root{
  --desk:#0C100E; --card:#121A15; --ink:#E9E7DE; --ink2:#A3B0A4; --ink3:#778779;
  --rule:#1E2A22;
  --mono:'Martian Mono',ui-monospace,SFMono-Regular,Menlo,monospace;
  --sans:'Instrument Sans',ui-sans-serif,system-ui,sans-serif;
  --serif:'Instrument Sans',ui-sans-serif,system-ui,sans-serif;
}
:root[data-theme="light"]{
  --desk:#DCDDD4; --card:#E9EAE1; --ink:#12180F; --ink2:#3C4A3D; --ink3:#576253;
  --rule:#C2C7B8;
}
@media (prefers-color-scheme:light){
  :root:not([data-theme="dark"]){
    --desk:#DCDDD4; --card:#E9EAE1; --ink:#12180F; --ink2:#3C4A3D; --ink3:#576253;
    --rule:#C2C7B8;
  }
}
body{font-family:var(--sans);background:var(--desk);color:var(--ink)}
h1,h2,h3,h4{font-family:var(--sans)}
code,pre{font-family:var(--mono)}

/* The boot overlay. display:none by default and shown by script, so a reader with
   JavaScript off gets the page immediately instead of a black rectangle — the
   sequence is decoration and must never be load-bearing. */
.boot{display:none;position:fixed;inset:0;z-index:200;background:var(--desk);
  align-items:center;justify-content:center}
.boot.go{display:flex}
.boot-in{font-family:var(--mono);font-size:.72rem;line-height:2;color:var(--sig);
  min-width:min(30rem,80vw)}
.boot-in b{display:block;font-weight:400;white-space:pre;opacity:0}
.boot-cur{display:inline-block;width:.55em;height:1em;vertical-align:-.12em;
  background:var(--sig);animation:bl 1s steps(2) infinite}
@keyframes bl{50%{opacity:0}}
@media (prefers-reduced-motion:reduce){.boot{display:none!important}}

/* Every page in this world gets the signal colour as its accent, so the shared
   chrome (indicator, buttons, focus rings) picks it up with no extra wiring. */
`;

/* ══════════════════════════════ the voices ═══════════════════════════════ */

const esc0 = s => String(s == null ? '' : s);

/**
 * A voice owns its masthead, its composition and its CSS. The skeleton owns the
 * <head>, the chrome and the scroll tracker, and nothing about layout.
 */
const VOICES = {

    /* ══ PATCH NOTES — the notice board ═════════════════════════════════════
       The only page a stranger is likely to land on, so it is the least machine-like
       of the three: humanist type, no SHAs, no PR numbers, generous spacing. The
       newest release is a hero panel because on a notice board the current notice is
       the point; everything behind it is a deck you scan rather than read. */
    broadcast: {
        name: 'broadcast',
        operator: 'PATCH NOTES',
        sig: '#FF9E3D',
        sigLight: '#994C00',
        rail: false,

        masthead: (page, stats, C) => `
      <header class="pn-mast">
        <div class="pn-op"><span class="pn-dot" aria-hidden="true"></span>OPERATOR // ${C.esc('PATCH NOTES')}</div>
        <h1>${C.esc(page.title)}</h1>
        <p class="pn-lede">${C.esc(page.lede)}</p>
        <div class="pn-tick"><span>${C.esc(stats)}</span><span class="pn-clk" id="clk"></span></div>
      </header>`,

        compose: (entries, parts, render, C) => {
            const soon = entries.filter(e => !e.version && /coming soon/i.test(e.title));
            const rest = entries.filter(e => !soon.includes(e));
            const hero = rest[0];
            const deck = rest.slice(1);

            const soonHtml = soon.map(e => `
      <section class="pn-soon" data-entry id="${e.id}-w">
        <div class="pn-soon-l">INCOMING</div>
        <h2 id="${e.id}">${C.esc(e.title)}</h2>
        ${render(e)}
      </section>`).join('');

            const heroHtml = hero ? `
      <section class="pn-hero" data-entry data-rv>
        <div class="pn-hero-t">LATEST</div>
        <h2 id="${hero.id}" class="pn-v">${C.esc(hero.version || hero.title)}</h2>
        ${hero.date ? `<div class="pn-d">${C.esc(hero.date)}</div>` : ''}
        <div class="pn-hero-b">${render(hero)}</div>
      </section>` : '';

            const deckHtml = deck.length ? `<div class="pn-deck">${deck.map(e => `
        <article class="pn-card" data-entry data-rv>
          <h2 id="${e.id}" class="pn-cv">${C.esc(e.version || e.title)}</h2>
          ${e.date ? `<div class="pn-d">${C.esc(e.date)}</div>` : ''}
          <div class="pn-cb">${render(e)}</div>
        </article>`).join('')}</div>` : '';

            return soonHtml + heroHtml + deckHtml;
        },

        css: `
.pn-wrap{max-width:1100px;margin:0 auto;padding:calc(54px + clamp(2rem,7vh,4rem)) clamp(1rem,4vw,2rem) 5rem}
.pn-mast{margin:0 0 2.6rem}
.pn-op{display:flex;align-items:center;gap:.5rem;font-family:var(--mono);font-size:.58rem;
  letter-spacing:.22em;color:var(--sig);margin:0 0 .9rem}
.pn-dot{width:7px;height:7px;border-radius:50%;background:var(--sig);
  box-shadow:0 0 0 0 color-mix(in srgb,var(--sig) 70%,transparent);animation:pnp 2.4s ease-out infinite}
@keyframes pnp{70%{box-shadow:0 0 0 11px transparent}100%{box-shadow:0 0 0 0 transparent}}
.pn-mast h1{margin:0;font-size:clamp(2.2rem,6.5vw,4rem);letter-spacing:-.035em;line-height:.98;
  font-weight:600}
.pn-lede{margin:1rem 0 0;max-width:44ch;color:var(--ink2);font-size:1.02rem;line-height:1.6}
.pn-tick{display:flex;gap:1rem;margin:1.4rem 0 0;padding:.6rem 0 0;border-top:1px solid var(--rule);
  font-family:var(--mono);font-size:.58rem;letter-spacing:.16em;text-transform:uppercase;color:var(--ink3)}
.pn-clk{margin-left:auto;color:var(--sig)}

/* INCOMING — dashed, unfilled, explicitly not-yet. It is a forecast, not a release,
   so it must not look like one. */
.pn-soon{margin:0 0 2.4rem;padding:1.4rem clamp(1rem,3vw,1.8rem);border:1px dashed var(--rule);
  border-radius:3px;background:transparent}
.pn-soon-l{font-family:var(--mono);font-size:.56rem;letter-spacing:.22em;color:var(--ink3);margin:0 0 .5rem}
.pn-soon h2{margin:0 0 .8rem;font-size:1.15rem;font-weight:600}

/* The hero. The version is set at poster scale and IS the heading — an earlier
   version had a big translucent numeral behind a small h2 repeating it, so every
   card read the version twice. */
.pn-hero{position:relative;margin:0 0 2.2rem;padding:clamp(1.4rem,4vw,2.4rem);
  border:1px solid color-mix(in srgb,var(--sig) 34%,var(--rule));border-radius:3px;
  background:linear-gradient(160deg,color-mix(in srgb,var(--sig) 9%,var(--card)),var(--card) 60%);
  overflow:hidden}
.pn-hero::after{content:"";position:absolute;inset:auto -30% -60% auto;width:60%;aspect-ratio:1;
  border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--sig) 18%,transparent),transparent 70%);
  pointer-events:none}
.pn-hero-t{font-family:var(--mono);font-size:.56rem;letter-spacing:.24em;color:var(--sig);margin:0 0 .6rem}
.pn-v{margin:0;font-family:var(--mono);font-weight:700;letter-spacing:-.045em;line-height:.9;
  font-size:clamp(2.4rem,8vw,4.6rem);color:var(--ink)}
.pn-d{margin:.55rem 0 0;font-family:var(--mono);font-size:.6rem;letter-spacing:.16em;
  text-transform:uppercase;color:var(--ink3)}
.pn-hero-b{margin:1.4rem 0 0;max-width:62ch}
.pn-hero-b p:first-child{margin-top:0}

/* The deck. Two columns on a wide screen, and the cards are equal-height blocks
   rather than a masonry flow, because a ragged bottom edge on a wall of releases
   reads as broken rather than as designed. */
.pn-deck{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1rem}
.pn-card{padding:1.2rem 1.3rem;border:1px solid var(--rule);border-radius:3px;background:var(--card);
  transition:border-color .25s,transform .25s}
.pn-card:hover{border-color:color-mix(in srgb,var(--sig) 45%,var(--rule));transform:translateY(-2px)}
.pn-cv{margin:0;font-family:var(--mono);font-size:1.5rem;font-weight:700;letter-spacing:-.03em;
  color:var(--sig);line-height:1}
.pn-cb{margin:.9rem 0 0;font-size:.92rem;color:var(--ink2)}
.pn-cb p{margin:0 0 .6rem}
.pn-cb li{font-size:.9rem}
.pn-cb strong{color:var(--ink)}
@media (prefers-reduced-motion:reduce){.pn-card:hover{transform:none}.pn-dot{animation:none}}
`,
    },

    /* ══ FIELD ENGINEER — the ledger ════════════════════════════════════════
       Everything the notice board hides is exposed here: PR number, commit SHA, the
       exact timestamp. Monospace throughout, a fixed key column beside the prose so
       the page reads down like a log, the ordnance-belt rail from the reference
       design, and the era break where the solo era becomes the collab era. */
    record: {
        name: 'record',
        operator: 'FIELD ENGINEER',
        sig: '#7CE38B',
        sigLight: '#176D24',
        rail: true,

        masthead: (page, stats, C) => `
      <header class="lg-mast">
        <div class="lg-op">OPERATOR // ${C.esc('FIELD ENGINEER')}<span class="lg-clk" id="clk"></span></div>
        <h1>${C.esc(page.title)}</h1>
        <p class="lg-lede">${C.esc(page.lede)}</p>
        <div class="lg-head" aria-hidden="true">
          <span>VERSION</span><span>STAMP</span><span>PR</span><span>COMMIT</span>
        </div>
        <div class="lg-stats">${C.esc(stats)}</div>
      </header>`,

        compose: (entries, parts, render, C) => {
            let out = '';
            let eraDone = false;
            entries.forEach((e, i) => {
                const part = parts.find(p => p.firstEntry === i);
                if (part) {
                    out += `<div class="lg-part" id="${part.id}"><span>${C.esc(part.text)}</span></div>`;
                }
                // The structural break from the reference: everything below v2.0.0 is
                // the solo era. Placed before the FIRST v1 entry, since the file runs
                // newest-first.
                if (!eraDone && e.version && /^v1\./.test(e.version)) {
                    eraDone = true;
                    out += `<div class="lg-era"><i aria-hidden="true"></i>
              <b>SOLO ERA</b><span>everything below predates the collaboration</span></div>`;
                }
                out += `
      <article class="lg-row${e.major ? ' lg-maj' : ''}" data-entry data-rv>
        <div class="lg-k">
          <h2 id="${e.id}" class="lg-v">${C.esc(e.version || e.date || '—')}</h2>
          ${e.date && e.version ? `<span class="lg-s">${C.esc(e.date)}</span>` : ''}
          ${e.pr ? `<span class="lg-s lg-pr">#${C.esc(e.pr)}</span>` : ''}
          ${e.hash ? `<span class="lg-s lg-h">${C.esc(e.hash)}</span>` : ''}
        </div>
        <div class="lg-b">
          ${e.title && e.version ? `<p class="lg-t">${C.esc(e.title)}</p>` : ''}
          ${render(e)}
        </div>
      </article>`;
            });
            return out;
        },

        css: `
.lg-wrap{max-width:1180px;margin:0 auto;
  padding:calc(54px + clamp(2rem,6vh,3.4rem)) clamp(1rem,3vw,2rem) 5rem}
/* Scanlines. Very low contrast and fixed to the viewport, so they read as the
   surface of a screen rather than as texture printed onto the content. */
.lg-scan{position:fixed;inset:0;z-index:1;pointer-events:none;opacity:.45;
  background:repeating-linear-gradient(180deg,transparent 0 2px,rgba(0,0,0,.18) 2px 3px)}
:root[data-theme="light"] .lg-scan{opacity:.16}
@media (prefers-reduced-motion:reduce){.lg-scan{display:none}}

.lg-mast{margin:0 0 2rem}
.lg-op{display:flex;font-family:var(--mono);font-size:.58rem;letter-spacing:.22em;
  color:var(--sig);margin:0 0 .9rem}
.lg-clk{margin-left:auto;color:var(--ink3)}
.lg-mast h1{margin:0;font-family:var(--mono);font-weight:700;
  font-size:clamp(1.9rem,5vw,3rem);letter-spacing:-.05em;line-height:1}
.lg-lede{margin:.9rem 0 0;max-width:56ch;color:var(--ink2);font-size:.96rem}
.lg-stats{margin:.7rem 0 0;font-family:var(--mono);font-size:.58rem;letter-spacing:.16em;
  text-transform:uppercase;color:var(--ink3)}
/* A schema row, not a title. It states the shape of every row beneath it, which is
   what makes the key column read as data rather than as decoration. */
/* Wide enough that the four labels do not run into each other — at 15rem "VERSION"
   and "STAMP" collided and read as one word. */
.lg-head{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1rem;margin:1.5rem 0 0;
  padding:.5rem 0;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);
  font-family:var(--mono);font-size:.52rem;letter-spacing:.16em;color:var(--ink3);max-width:26rem}

/* The row. A fixed key column and the prose beside it; below 860 the key becomes a
   header strip above the prose rather than a cramped column. */
.lg-row{display:grid;grid-template-columns:11.5rem minmax(0,1fr);gap:clamp(1rem,3vw,2.2rem);
  padding:1.5rem 0;border-bottom:1px solid var(--rule)}
.lg-k{position:sticky;top:76px;align-self:start;display:flex;flex-direction:column;gap:.3rem}
.lg-v{margin:0;font-family:var(--mono);font-size:1.05rem;font-weight:700;letter-spacing:-.02em;
  color:var(--sig);line-height:1.2}
.lg-maj .lg-v{font-size:1.35rem}
.lg-s{font-family:var(--mono);font-size:.56rem;letter-spacing:.1em;color:var(--ink3)}
.lg-pr::before{content:"PR "}
.lg-h{color:var(--ink2)}
.lg-t{margin:0 0 .8rem;font-family:var(--sans);font-size:1.02rem;font-weight:600;color:var(--ink);
  line-height:1.4}
.lg-b{min-width:0;font-size:.93rem}
.lg-b p{margin:0 0 .7rem}
.lg-b li{font-size:.92rem}
.lg-row:hover .lg-v{text-shadow:0 0 14px color-mix(in srgb,var(--sig) 60%,transparent)}

.lg-part{margin:2.6rem 0 0;padding:.7rem 0;border-top:2px solid var(--sig);
  font-family:var(--mono);font-size:.72rem;letter-spacing:.18em;color:var(--sig)}
/* The era break. A rule that says what changed about the project, not about the page. */
.lg-era{display:flex;align-items:center;gap:.8rem;margin:2.4rem 0 .6rem;padding:.8rem 0;
  border-top:1px dashed color-mix(in srgb,var(--sig) 40%,var(--rule));
  font-family:var(--mono);font-size:.58rem;letter-spacing:.18em;color:var(--ink3)}
.lg-era b{color:var(--sig);font-weight:400}
.lg-era i{width:9px;height:9px;border:1px solid var(--sig);transform:rotate(45deg);flex:0 0 auto}

@media (max-width:860px){
  .lg-row{grid-template-columns:1fr;gap:.7rem}
  .lg-k{position:static;flex-direction:row;flex-wrap:wrap;align-items:baseline;gap:.55rem}
  .lg-head{display:none}
}
`,
    },

    /* ══ LOG KEEPER — the timeline ══════════════════════════════════════════
       The third operator, added when the devlog became a published page. This one is
       neither scanning nor auditing — it is reading a journal, so the page is a
       literal spine with a node per entry, the date out in the margin, and the
       Lesson blocks pushed to the opposite side as debriefs. It exposes no machine
       detail at all: the devlog has no versions and no commits, and inventing a key
       column for it would have been the layout wearing a costume. */
    notebook: {
        name: 'notebook',
        operator: 'LOG KEEPER',
        sig: '#8FB8FF',
        sigLight: '#0052E1',
        rail: true,

        masthead: (page, stats, C) => `
      <header class="tl-mast">
        <div class="tl-op">OPERATOR // ${C.esc('LOG KEEPER')}<span class="tl-clk" id="clk"></span></div>
        <h1>${C.esc(page.title)}</h1>
        <p class="tl-lede">${C.esc(page.lede)}</p>
        <div class="tl-stats">${C.esc(stats)}</div>
      </header>`,

        compose: (entries, parts, render, C) => {
            let out = '<div class="tl">';
            // The spine is drawn by an SVG line whose dash offset is animated on
            // scroll. It sits behind the items rather than being a border on them, so
            // it can run continuously past the gaps between entries.
            out += '<span class="tl-line" aria-hidden="true"><i id="tlfill"></i></span>';
            entries.forEach((e, i) => {
                const part = parts.find(p => p.firstEntry === i);
                if (part) {
                    out += `<div class="tl-station" id="${part.id}">
              <span class="tl-node tl-node-b" aria-hidden="true"></span>
              <b>${C.esc(part.text)}</b></div>`;
                }
                out += `
      <article class="tl-item" data-entry data-rv>
        <span class="tl-node" aria-hidden="true"></span>
        ${e.date ? `<div class="tl-date">${C.esc(e.date)}</div>` : ''}
        <div class="tl-body">
          <h2 id="${e.id}">${C.esc(e.title || e.date || '')}</h2>
          ${render(e)}
        </div>
      </article>`;
            });
            return out + '</div>';
        },

        css: `
.tl-wrap{max-width:1160px;margin:0 auto;
  padding:calc(54px + clamp(2rem,7vh,3.6rem)) clamp(1rem,4vw,2rem) 5rem}
.tl-mast{margin:0 0 3rem;max-width:60ch}
.tl-op{display:flex;font-family:var(--mono);font-size:.58rem;letter-spacing:.22em;
  color:var(--sig);margin:0 0 .9rem}
.tl-clk{margin-left:auto;color:var(--ink3)}
.tl-mast h1{margin:0;font-size:clamp(2.1rem,6vw,3.4rem);letter-spacing:-.035em;line-height:1;
  font-weight:600}
.tl-lede{margin:1rem 0 0;color:var(--ink2);font-size:1.02rem;line-height:1.65}
.tl-stats{margin:.9rem 0 0;font-family:var(--mono);font-size:.58rem;letter-spacing:.16em;
  text-transform:uppercase;color:var(--ink3)}

/* The spine. A 2px track with a filled portion that follows scroll progress, so the
   page has a physical sense of how far through the journey you are. */
.tl{position:relative;padding-left:10.5rem}
.tl-line{position:absolute;left:8.25rem;top:.6rem;bottom:0;width:2px;
  background:color-mix(in srgb,var(--ink) 12%,transparent)}
.tl-line i{position:absolute;inset:0 0 auto 0;height:0;display:block;background:var(--sig);
  box-shadow:0 0 12px color-mix(in srgb,var(--sig) 65%,transparent)}

.tl-item{position:relative;margin:0 0 2.8rem}
.tl-node{position:absolute;left:-2.37rem;top:.45rem;width:11px;height:11px;border-radius:50%;
  background:var(--desk);border:2px solid color-mix(in srgb,var(--ink) 26%,transparent);
  transition:border-color .3s,box-shadow .3s,transform .3s}
.tl-item.on .tl-node{border-color:var(--sig);box-shadow:0 0 0 4px color-mix(in srgb,var(--sig) 18%,transparent);
  transform:scale(1.25)}
.tl-date{position:absolute;left:-10.5rem;top:.2rem;width:7.4rem;text-align:right;
  font-family:var(--mono);font-size:.58rem;letter-spacing:.1em;color:var(--ink3);line-height:1.5}
.tl-item.on .tl-date{color:var(--sig)}
.tl-body{min-width:0;max-width:70ch}
.tl-body h2{margin:0 0 .7rem;font-size:1.22rem;font-weight:600;letter-spacing:-.015em;line-height:1.35}
.tl-body p{font-size:.98rem;line-height:1.75}

.tl-station{position:relative;margin:3.4rem 0 2rem}
.tl-station b{font-family:var(--mono);font-size:.74rem;letter-spacing:.16em;color:var(--sig);
  font-weight:400}
.tl-node-b{left:-2.5rem;top:.1rem;width:15px;height:15px;border-radius:2px;transform:rotate(45deg);
  border-color:var(--sig);background:var(--desk)}

/* Debriefs. The lessons are why the devlog exists, so they leave the reading column
   entirely rather than sitting inside it as another blockquote. */
.tl-lesson{position:relative;margin:1.4rem 0;padding:.95rem 1.1rem;border-radius:3px;
  border:1px solid color-mix(in srgb,var(--sig) 30%,var(--rule));
  background:color-mix(in srgb,var(--sig) 7%,transparent)}
.tl-lesson > .tl-lesson-l{display:block;font-family:var(--mono);font-size:.55rem;
  letter-spacing:.2em;color:var(--sig);margin:0 0 .5rem}
/* The "DEBRIEF //" prefix is CSS content, never DOM text — see liftLessons(). */
.tl-lesson > .tl-lesson-l::before{content:"DEBRIEF // "}
.tl-lesson p:last-child,.tl-lesson ul:last-child{margin-bottom:0}

@media (max-width:900px){
  .tl{padding-left:1.6rem}
  .tl-line{left:.25rem}
  .tl-node{left:-1.42rem}
  .tl-node-b{left:-1.55rem}
  .tl-date{position:static;width:auto;text-align:left;margin:0 0 .3rem}
}
@media (prefers-reduced-motion:reduce){
  .tl-node{transition:none}
  .tl-item.on .tl-node{transform:none}
}
`,
    },
};

/* ══════════════════════════════ rendering ════════════════════════════════ */

/**
 * Wraps `### Lesson` / `### Lessons` sections as debriefs, for the LOG KEEPER.
 *
 * Matched after rendering rather than in the source, so the match is against the
 * same string a reader sees. It cannot silently half-apply: chronicleStructAudit()
 * counts what actually reached the page against a declared expectation.
 */
/**
 * Heading markup → plain label text.
 *
 * ⚠️ The permalink anchor must be removed as an ELEMENT, before tags are stripped.
 * Stripping tags alone deletes the <a> and keeps its text, so the pilcrow survived
 * into every label the two functions below build — the devlog's index summary read
 * "TABLE OF CONTENTS¶" and each debrief "Lessons¶". A stray glyph, and also a
 * fabricated character in a place the source never put one.
 */
const labelOf = headInner => headInner
    .replace(/<a\b[^>]*class="[^"]*\banchor\b[^"]*"[\s\S]*?<\/a>/g, '')
    .replace(/<[^>]*>/g, '')
    .trim();

function liftLessons(html) {
    let n = 0;
    const out = html.replace(
        /<h3([^>]*)>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h[123]|$)/g,
        (whole, attrs, headInner, body) => {
            const text = headInner.replace(/<[^>]*>/g, '').trim().toLowerCase();
            if (!/^lessons?\b/.test(text)) return whole;
            n++;
            // ⚠️ The "DEBRIEF //" label is drawn by CSS content on an aria-hidden
            // span, NOT emitted as text. Emitting it put an invented word between a
            // heading and the source's own following sentence, which broke seven
            // content runs — the same failure the ledger's direction marks and the
            // ghost plate's label already hit on the warm pages. If a mark's meaning
            // is decorative, it belongs in the stylesheet.
            return `<div class="tl-lesson"><span class="tl-lesson-l">` +
                labelOf(headInner) + `</span>${body}</div>`;
        }
    );
    return { html: out, count: n };
}

/**
 * Folds a long in-document index into a disclosure.
 *
 * DEVLOG carries a ~60-line greppable index written for ripgrep, not for a reader.
 * Dropping it is content loss the verifier would correctly report; leaving it inline
 * puts sixty lines of navigation ahead of the document's first word. A disclosure
 * keeps every word in the page and out of the way.
 */
function foldIndex(html) {
    return html.replace(
        /<h2([^>]*)>([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2|$)/,
        (whole, attrs, headInner, body) => {
            const text = headInner.replace(/<[^>]*>/g, '').toLowerCase();
            if (!/table of contents/.test(text)) return whole;
            return `<details class="cfold"><summary>${labelOf(headInner)}</summary>` +
                `<div class="cfold-b">${body}</div></details>`;
        }
    );
}

/** Builds one chronicle page. */
function chronicleShell({ page, parsed, C, stats }) {
    requireChrome(C);
    const voice = VOICES[page.voice];
    if (!voice) throw new Error(`chronicle.js: unknown voice "${page.voice}" for ${page.out}`);

    const { esc } = C;
    let lessons = 0;

    // One renderer, handed to the voice, so a voice cannot forget to linkify or to
    // lift lessons — the composition decides WHERE a body goes, never what it is.
    const render = e => {
        let inner = C.parseBlocks(e.raw).html;
        if (voice.name === 'notebook') {
            const lifted = liftLessons(inner);
            inner = lifted.html;
            lessons += lifted.count;
        }
        return C.linkifyRefs(inner, new Set());
    };

    const preambleHtml = parsed.preamble
        ? `<div class="clede">${foldIndex(C.parseBlocks(parsed.preamble).html)}</div>`
        : '';

    const body = voice.compose(parsed.entries, parsed.parts, render, C);

    // The rail doubles as the mobile "On this page" index, so it is built even when
    // the desktop rail is off — mobileNav takes it either way.
    const slots = [];
    parsed.entries.forEach((e, i) => {
        const part = parsed.parts.find(p => p.firstEntry === i);
        if (part) slots.push({ id: part.id, num: '', text: part.text, part: true });
        slots.push({
            id: e.id,
            num: e.version || e.date || '',
            text: e.title || e.version || e.date || '',
            major: e.major,
        });
    });
    const railSlots = slots.map(s =>
        `<a href="#${s.id}" class="slot${s.part ? ' slot-p' : ''}${s.major ? ' slot-m' : ''}">` +
        `<i>${esc(s.num || '—')}</i><span>${esc(s.text)}</span></a>`).join('');

    const cur = { out: page.out, dir: page.dir };
    const wrap = voice.name === 'broadcast' ? 'pn-wrap' : voice.name === 'record' ? 'lg-wrap' : 'tl-wrap';

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title)} — Dior's Builds</title>
<meta name="description" content="${esc(page.blurb)}">
<meta name="color-scheme" content="dark light">
${C.THEME_BOOT}
<meta property="og:title" content="${esc(page.title)} — Dior's Builds">
<meta property="og:description" content="${esc(page.blurb)}">
<meta property="og:type" content="website">
<link rel="preload" as="font" type="font/woff2" href="../assets/martian-mono-700.woff2" crossorigin>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%230C100E'/%3E%3Crect x='5' y='14' width='22' height='3' fill='${encodeURIComponent(voice.sig)}'/%3E%3Ccircle cx='16' cy='8' r='3' fill='${encodeURIComponent(voice.sig)}'/%3E%3C/svg%3E">
<style>
${C.TOKENS}
${WORLD}
/* ⚠️ TWO signal values per voice, and the light one is NOT optional.
   The three signals are tuned for a near-black terminal and are close to
   invisible on the daylight variant — measured against #DCDDD4 they scored
   1.50, 1.16 and 1.47 to 1, against a 4.5 minimum. That is not "a bit low", it
   is text a sighted reader cannot make out, and it covers the version numerals,
   the dates and the operator line. The light values keep each hue and its
   saturation and only drop lightness until they clear 4.5:1. contrastAudit()
   re-measures both themes from the built CSS on every run. */
:root{--accent:${voice.sig};--glow:${voice.sig};--sig:${voice.sig}}
:root[data-theme="light"]{--accent:${voice.sigLight};--glow:${voice.sigLight};--sig:${voice.sigLight}}
@media (prefers-color-scheme:light){
  :root:not([data-theme="dark"]){--accent:${voice.sigLight};--glow:${voice.sigLight};--sig:${voice.sigLight}}
}
${C.COMPONENT_CSS}

.bar{position:fixed;inset:0 0 auto;height:54px;z-index:60;display:flex;align-items:center;
  gap:1.5rem;padding:0 clamp(1rem,3vw,2rem);background:color-mix(in srgb,var(--desk) 88%,transparent);
  backdrop-filter:blur(14px) saturate(1.3);border-bottom:1px solid var(--rule)}
.bar nav{margin-left:auto;display:flex;align-items:center;gap:.6rem}
#prog{position:fixed;top:53px;left:0;height:2px;width:0;z-index:61;background:var(--sig)}

${C.SWITCHER_CSS}

/* ── print ────────────────────────────────────────────────────────────────
   COMPONENT_CSS already hides the bar, rail, mobile nav and back-to-top. These
   are this family's own decorative layers, and every one of them prints badly:
   the scanline overlay lays grey stripes across the whole page, the boot panel
   would cover it entirely if a print began mid-sequence, and the timeline spine
   and its glow become stray rules down the margin. A changelog is a plausible
   thing to print or save as a PDF, so it should come out as the document rather
   than as a photograph of a screen. Reveal-armed entries are forced visible too:
   printing does not scroll, so an unrevealed entry would print blank. */
@media print{
  .lg-scan,.boot,.tl-line,.tl-node,.tl-node-b{display:none!important}
  .rv-armed [data-rv]{opacity:1!important;transform:none!important}
  .tl{padding-left:0}
  .tl-date{position:static;width:auto;text-align:left;margin:0 0 .2rem}
  .cxfold-b{max-height:none;overflow:visible}
  .pn-hero,.pn-card,.pn-soon,.cxfold{border-color:#999;background:none}
  .pn-hero::after{display:none}
}

/* ── styles for markup the SHARED parser emits ────────────────────────────
   parseBlocks() and linkifyRefs() emit .anchor and .xref on every page they
   render, but the rules for them live inside shell()'s own template, not in
   COMPONENT_CSS. So these pages were emitting both completely unstyled: the
   heading pilcrow showed permanently in the browser's default link purple
   instead of appearing on hover, and every cross-reference link rendered as a
   raw UA link. Caught by looking at the page, not by any gate — content
   presence and link resolution were both green the whole time. */
/* Ordinary prose links. shell() styles these with a .doc a selector, and these pages
   have no .doc for it to match — so every Markdown link in all three records was
   rendering in the browser's default link purple. Same underline treatment as the
   legal pages, since a link is a link everywhere here; only the colour changes. */
.pn-cb a,.pn-hero-b a,.lg-b a,.tl-body a,.clede a,.pn-soon a{
  color:var(--ink);text-decoration:underline;text-underline-offset:.19em;
  text-decoration-thickness:1px;
  text-decoration-color:color-mix(in srgb,var(--sig) 60%,transparent)}
.pn-cb a:hover,.pn-hero-b a:hover,.lg-b a:hover,.tl-body a:hover,.clede a:hover,
.pn-soon a:hover{text-decoration-color:var(--sig)}

.anchor{margin-left:.5rem;color:var(--ink3);text-decoration:none;font-size:.75em;
  opacity:0;transition:opacity .15s}
h2:hover .anchor,h3:hover .anchor{opacity:1}
.anchor:hover{color:var(--sig)}
/* No hover to reveal it on touch, so it is either permanently invisible or
   permanent clutter. Neither earns the space. */
@media (hover:none){.anchor{display:none}}
.xref{color:var(--sig);text-decoration:none;
  border-bottom:1px solid color-mix(in srgb,var(--sig) 35%,transparent)}
.xref:hover{border-bottom-color:var(--sig)}

/* ── the folded in-document index ─────────────────────────────────────── */
.clede{margin:0 0 2.4rem;color:var(--ink2);max-width:70ch}
.clede p{font-size:.95rem}
.cfold{margin:1.4rem 0;border:1px solid var(--rule);border-radius:3px;background:var(--card)}
.cfold > summary{cursor:pointer;padding:.7rem 1rem;font-family:var(--mono);font-size:.58rem;
  letter-spacing:.16em;text-transform:uppercase;color:var(--ink2);list-style:none}
.cfold > summary::-webkit-details-marker{display:none}
.cfold > summary::after{content:"+";float:right;color:var(--sig)}
.cfold[open] > summary::after{content:"–"}
.cfold > summary:hover{color:var(--ink)}
.cfold-b{padding:0 1rem 1rem;max-height:58vh;overflow:auto}
.cfold-b li{font-size:.82rem}

/* ── the ordnance belt ────────────────────────────────────────────────────
   The version rail from the reference design: a milestone release is a filled
   round, a patch is a hollow tick, and the one you are inside lights up. It is
   the same .slot markup the legal rail uses so ONE scroll tracker drives both. */
.rail{position:sticky;top:74px;max-height:calc(100vh - 96px);overflow:auto;
  padding:calc(54px + clamp(2rem,6vh,3.4rem)) .4rem 2rem 0}
.rail .lab{display:block;font-family:var(--mono);font-size:.52rem;letter-spacing:.2em;
  text-transform:uppercase;color:var(--ink3);margin:0 0 .8rem}
.slot{position:relative;display:flex;gap:.5rem;align-items:baseline;padding:.26rem 0 .26rem 1.1rem;
  text-decoration:none;color:var(--ink3);font-size:.72rem;line-height:1.35}
.slot::before{content:"";position:absolute;left:0;top:.55em;width:5px;height:5px;border-radius:50%;
  border:1px solid color-mix(in srgb,var(--ink) 34%,transparent);transition:all .25s}
.slot.slot-m::before{width:9px;height:9px;left:-2px;background:color-mix(in srgb,var(--ink) 34%,transparent)}
.slot i{flex:0 0 auto;font-style:normal;font-family:var(--mono);font-size:.58rem;color:var(--ink3)}
.slot span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.slot.on{color:var(--ink)}
.slot.on i{color:var(--sig)}
.slot.on::before{border-color:var(--sig);background:var(--sig);
  box-shadow:0 0 9px color-mix(in srgb,var(--sig) 80%,transparent)}
.slot:hover{color:var(--ink)}
.slot-p{margin-top:.7rem;color:var(--ink2)}
@media (max-width:980px){.rail{display:none}}

/* ── layout shell ─────────────────────────────────────────────────────────
   .cols carries the grid and the footer sits OUTSIDE it, inside .page. A sticky
   element is bounded by its containing block, not its own height, so a footer left
   inside the grid lets the rail travel across it — measured at 236px past the
   document on the legal pages before that split was made. Do not fold them back. */
.page{margin:0 auto}
.cols{display:grid;grid-template-columns:${voice.rail ? '13rem minmax(0,1fr)' : 'minmax(0,1fr)'};
  gap:clamp(1rem,3vw,2rem);align-items:start;max-width:1400px;margin:0 auto;
  padding:0 clamp(1rem,3vw,2rem)}
@media (max-width:980px){.cols{grid-template-columns:1fr;gap:0;padding:0}}

/* Reveal-on-scroll. The class is added by script; without JS the content is simply
   visible, which is why the hidden state lives on .rv-armed and not on the element
   itself. Nothing on this site may depend on script to be readable. */
.rv-armed [data-rv]{opacity:0;transform:translateY(14px)}
.rv-armed [data-rv].rv-in{opacity:1;transform:none;
  transition:opacity .55s cubic-bezier(.2,.7,.3,1),transform .55s cubic-bezier(.2,.7,.3,1)}
@media (prefers-reduced-motion:reduce){
  .rv-armed [data-rv]{opacity:1;transform:none}
}

${voice.css}
</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${C.GOO_SVG}
${voice.name === 'record' ? '<div class="lg-scan" aria-hidden="true"></div>' : ''}

<div class="boot" id="boot" aria-hidden="true"><div class="boot-in" id="bootin"></div></div>

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
${C.mobileNav(cur, railSlots)}

<div class="page">
  <div class="cols">
    ${voice.rail ? `<aside class="rail" id="rail">
      <span class="lab">${esc(page.railLabel || 'Index')}</span>
      <div class="slots" id="slots">${railSlots}</div>
    </aside>` : ''}
    <main class="${wrap}" id="main" tabindex="-1">
      ${voice.masthead(page, stats, C)}
      ${preambleHtml}
      ${body}
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

<script src="../assets/motion.min.js"></script>
<script>
(function(){
  var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ── boot sequence ───────────────────────────────────────────────────
     Decoration, and it is treated as such: it only ever runs when script is
     available AND motion is welcome, it is skipped on any repeat visit within
     the session, and it can never be the reason content is not on screen. */
  (function boot(){
    if(reduce) return;
    try{ if(sessionStorage.getItem('db-booted')) return; }catch(e){ return; }
    var box=document.getElementById('boot'), inn=document.getElementById('bootin');
    if(!box||!inn) return;
    var lines=${JSON.stringify([
        'DIOR/BUILDS ORDNANCE TERMINAL',
        'auth .............. ok',
        'record ............ ' + page.file.toLowerCase(),
        'operator .......... ' + voice.operator,
        'mounting log ......',
    ])};
    box.classList.add('go');
    inn.innerHTML=lines.map(function(l){return '<b>'+l+'</b>'}).join('')
      +'<span class="boot-cur"></span>';
    var els=[].slice.call(inn.querySelectorAll('b')), i=0;
    var iv=setInterval(function(){
      if(i<els.length){ els[i].style.opacity=1; i++; return; }
      clearInterval(iv);
      setTimeout(function(){
        box.style.transition='opacity .45s'; box.style.opacity=0;
        setTimeout(function(){ box.classList.remove('go'); },460);
      },260);
    },130);
    try{ sessionStorage.setItem('db-booted','1'); }catch(e){}
  })();

  /* ── reveal on scroll ────────────────────────────────────────────────
     Motion One's inView where available, IntersectionObserver otherwise, and
     nothing at all if neither exists — in which case .rv-armed is never added
     and every entry is simply visible. */
  (function reveal(){
    if(reduce) return;
    var items=[].slice.call(document.querySelectorAll('[data-rv]'));
    if(!items.length||!('IntersectionObserver' in window)) return;
    document.body.classList.add('rv-armed');
    var io=new IntersectionObserver(function(es){
      es.forEach(function(en){
        if(!en.isIntersecting) return;
        var el=en.target;
        io.unobserve(el);
        if(window.Motion&&window.Motion.animate){
          window.Motion.animate(el,{opacity:[0,1],transform:['translateY(14px)','none']},
            {duration:.55,easing:[.2,.7,.3,1]});
          el.classList.add('rv-in');
        } else { el.classList.add('rv-in'); }
      });
    },{rootMargin:'0px 0px -8% 0px',threshold:.04});
    items.forEach(function(el){ io.observe(el); });

    function sweep(){
      items.forEach(function(el){
        if(el.classList.contains('rv-in')) return;
        if(el.getBoundingClientRect().top<innerHeight){ el.classList.add('rv-in'); io.unobserve(el); }
      });
    }
    /* Anything already above the fold at load is revealed immediately — waiting
       for a scroll that may never come is how a hero ends up invisible. */
    requestAnimationFrame(sweep);
    /* A page loaded in a BACKGROUND tab gets throttled frames and fires no
       intersection callbacks at all, so the sweep above can be skipped entirely;
       run it again when the page is actually looked at. */
    document.addEventListener('visibilitychange',function(){
      if(!document.hidden) sweep();
    });

    /* ⚠️ SAFETY NET, and it is the important line in this block.
       Everything above hides content first and reveals it on a signal. If that
       signal never arrives — a hidden container, a throttled frame, an observer
       that never fires, a script error later in the file — the reader is left
       with a page of invisible entries and no way to recover. An animation is
       never worth that risk, so the armed state simply expires: after 2.5s the
       hiding class is dropped wholesale and anything still unrevealed becomes
       visible. Items already revealed keep their transition and look unchanged.
       The worst case is now "it appeared without animating", never "it is gone".
       This is deliberately NOT verified by the preview pane, which cannot fire
       intersection callbacks while hidden — it exists precisely because that
       failure mode cannot be tested away. */
    setTimeout(function(){ document.body.classList.remove('rv-armed'); },2500);
  })();

  /* ── live UTC clock ──────────────────────────────────────────────────
     The reference design's own detail. Rendered by script only, so it never
     ships a stale time in the HTML. */
  (function clock(){
    var el=document.getElementById('clk');
    if(!el) return;
    function t(){
      var d=new Date();
      el.textContent=d.toISOString().slice(11,19)+' UTC';
    }
    t(); setInterval(t,1000);
  })();

  /* ── scroll tracking: progress bar, rail, spine, back-to-top ─────────
     Keys on section id rather than an index into a flat list, because the index
     is rendered twice (desktop rail + mobile panel) and exactly one copy is
     visible at any width — an index-based version highlighted whichever copy sat
     later in the DOM, which on a phone was the wrong one. */
  var prog=document.getElementById('prog');
  var top=document.getElementById('totop'), ttBar=top&&top.querySelector('.tt-bar');
  var slots=[].slice.call(document.querySelectorAll('.slot'));
  var rail=document.querySelector('.rail'), lastId=null;
  var fill=document.getElementById('tlfill');
  var tlItems=[].slice.call(document.querySelectorAll('.tl-item'));
  var ids=[],seen={};
  slots.forEach(function(a){
    var id=a.getAttribute('href').slice(1);
    if(!seen[id]){ seen[id]=1; ids.push(id); }
  });
  var heads=ids.map(function(id){return document.getElementById(id)});
  var queued=false;
  function paint(){
    var h=document.documentElement, max=h.scrollHeight-h.clientHeight;
    /* ⚠️ CLAMPED — iOS rubber-band scrolling reports scrollTop below 0 and past
       max, and a mobile URL bar showing or hiding changes clientHeight, and so
       max, mid-scroll. Unclamped, the progress bar and the ring jump and re-draw
       whenever the page is overscrolled past either end. */
    var frac=max>0?Math.min(1,Math.max(0,h.scrollTop/max)):0;
    if(prog) prog.style.width=(frac*100)+'%';
    if(top){
      /* ⚠️ .on IS OWNED BY MORPH_JS NOW — its back-to-top module animates a birth
         across many frames, and a second handler toggling the same class from a
         scroll position would fight it every frame. Progress stays here. */
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
    /* The spine fills to the lowest node that has crossed the reading line. */
    if(fill&&tlItems.length){
      var last=null;
      for(var k=0;k<tlItems.length;k++){
        if(tlItems[k].getBoundingClientRect().top<=160) last=tlItems[k];
        tlItems[k].classList.toggle('on', tlItems[k]===last);
      }
      var wrapEl=document.querySelector('.tl');
      if(last&&wrapEl){
        var y=last.getBoundingClientRect().top-wrapEl.getBoundingClientRect().top+8;
        fill.style.height=Math.max(0,y)+'px';
      } else { fill.style.height='0px'; }
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
          if(rail.scrollTo) rail.scrollTo({top:want,behavior:reduce?'auto':'smooth'});
          else rail.scrollTop=want;
        }
      }
    }
    var curEl=document.getElementById('railcur');
    if(curEl){
      var t2=curId?document.querySelector('.slot[href="#'+curId+'"] span'):null;
      curEl.textContent=t2?t2.textContent:'';
    }
    queued=false;
  }
  /* The click handler moved to MORPH_JS along with .on — pressing the button
     starts a destruction animation, and the arrow's fire keyframes are the
     reduced-motion path for it rather than a separate effect. One place. */
  addEventListener('scroll',function(){ if(!queued){queued=true;requestAnimationFrame(paint);} },{passive:true});
  addEventListener('resize',paint); paint();
})();
${C.THEME_JS}
${C.NAV_JS}
${C.MORPH_JS}
</script>
</body>
</html>`;

    return {
        html,
        // Counted from the MARKUP that was actually produced, not from the array it
        // was produced out of — a composition that drops an entry must be visible to
        // the gate, and an array length cannot see that.
        //
        // ⚠️ Matched as an ATTRIBUTE ON A TAG, never as the bare string. A loose
        // /data-entry/ match reported 115 entries for 113 headings, because the
        // changelog's own prose contains the phrase "loadout data-entry UX" twice.
        // A gate that content can trip is not measuring the code.
        entries: (html.match(/<(?:article|section)[^>]*\sdata-entry(?=[\s>])/g) || []).length,
        parts: parsed.parts.length,
        lessons,
    };
}

module.exports = { parseChronicle, splitEntryHeading, chronicleShell, VOICES, CHROME_KEYS, WORLD };
