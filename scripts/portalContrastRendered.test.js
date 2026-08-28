// scripts/portalContrastRendered.test.js — contrast measured on RENDERED elements.
//
// The gap audit's §8, in full. `scripts/buildPortal.js`'s portalContrastAudit checks the token table and every rule that declares a `color`, resolving var() chains statically — 157 pairs, and it found three real defects. What it structurally cannot see is a fallback that fires on ONE element while the same rule is fine on another, because whether `--topic-accent` is set is decided by JS at render time, not by the stylesheet. Measured: `--topic-accent` is set 0 times in CSS and 4 times inline from JS, against 14 fallback references.
//
// So this renders the real components, walks every element that paints text, and reads the COMPUTED colour against the nearest ancestor that actually paints a background — which is the only way to know what a reader sees.
//
// ⚠️ puppeteer-core, not puppeteer: it uses a Chrome already on the machine instead of downloading its own (~150MB). PUPPETEER_EXECUTABLE_PATH overrides the search; on GitHub Actions' ubuntu images Chrome is preinstalled at a known path. If no browser resolves, this SKIPS LOUDLY rather than passing — a contrast gate that silently checks nothing is the failure mode it exists to prevent.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { build } = require('./buildPortal');

const CONTRAST_MIN = 4.5;
const ROOT = path.join(__dirname, '..');

// ⚠️ THE CANDIDATE LIST MOVED TO scripts/lib/chromePath.cjs so `portalGeometry.mjs` reads the identical one. Two copies would drift, and the drift is silent: a machine where one resolves Chrome and the other does not shows a green suite beside a "no browser" skip, with nothing saying they disagree.
const { CHROME_CANDIDATES, findChrome } = require('./lib/chromePath.cjs');

// The fixture is a real portal page: the built stylesheet, plus markup covering the cases the static pass cannot reach — a row whose topic accent IS set beside one where it is not, every state pill, the kind chips, the KPI tiles, the access grid cells and the review gate.
function fixtureHtml(css) {
    return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>
<div class="app">
<header id="hdr"><button class="mk"><span class="glyph"></span>DIOREO<b>/</b>PORTAL</button>
  <span class="crumb">season <b>›</b> Track</span><span class="sp"></span>
  <div class="cmdbar"><span class="cb-mag"></span><input class="cb-in" placeholder="Search, or run a command"><kbd>⌘K</kbd></div>
  <span class="sp"></span><a class="hdr-commit" href="#/review"><b>3</b><span>staged · review</span></a>
  <span class="who"><span class="av"></span><span class="id">1139845545754632283</span><span class="role">owner</span></span></header>
<nav class="rail"><a class="realm" href="#/season" style="--c:var(--r-season)" aria-current="page">season</a>
  <a class="realm" href="#/armory" style="--c:var(--r-armory)">armory</a>
  <span class="rail-rule"></span>
  <a class="realm out has" href="#/review" style="--c:var(--r-review)">Review<span class="cnt">3</span></a></nav>
<main>
  <div class="masthead"><div class="mh-id">
    <div class="mh-eyebrow"><span><i>14</i>live now</span><span><i class="stg">3</i>staged</span><span><i class="warn">1</i>flags</span></div>
    <h1>Season 7</h1><span class="job">2026-08-01 → 2026-09-04</span>
    <div class="sclock" data-tier="running"><div class="sc-face"><span class="sc-u"><b>14</b><i>days</i></span><span class="sc-sep">:</span><span class="sc-u sec"><b>09</b><i>sec</i></span></div><div class="sc-when">until <b>Sep 10</b> · BATTLE PASS</div></div>
    <div class="mh-add"><span class="mh-add-k">Add</span><button class="pill mh-t" style="--c:var(--draw)"><span class="dot"></span>Draw</button></div>
  </div>
    <div class="mh-stats"><span class="stat"><span class="v">14</span> <span class="k">days left</span></span>
      <span class="stat hot"><span class="v">3</span> <span class="k">staged</span></span>
      <span class="stat bad"><span class="v">1</span> <span class="k">conflict</span></span></div></div>
  <div class="ph"><span class="t">Season</span><div class="seg" role="tablist"><button role="tab" aria-pressed="true">Track</button><button role="tab" aria-pressed="false">Board</button></div></div>

  <div class="panel"><div class="ph"><span class="t">Season track</span>
    <span class="rt"><span class="leg live"><i></i>live</span><span class="leg stag"><i></i>staged</span><span class="leg conf"><i></i>conflict</span></span></div>
    <div class="lanes">
      <div class="lane"><span class="nm">New draws</span><div class="tk">
        <div class="bar live" style="--topic-accent:var(--draw);left:0;width:40%"><span class="bl">Iron Wolf</span></div></div></div>
    <!-- The ADOPTED Track vocabulary (portal/ui/track.css, scoped under #track). The legacy
         live/stag/exp classes above are Broadcast's and stay: both are live in the portal during the
         migration, and a fixture that covered only one of them would leave the other unmeasured. -->
    <div id="track"><div class="lanes"><div class="lane"><div class="tk">
      <div class="bar saved" style="--c:var(--draw);left:0;width:40%"><span class="bl">Adopted saved bar</span></div>
      <div class="bar staged" style="--c:var(--play);left:45%;width:20%"><span class="bl">Adopted staged bar</span></div>
      <div class="bar conflict" style="left:70%;width:20%"><span class="bl">Adopted conflict bar</span></div>
      <span class="pt" style="--c:var(--ret);left:95%"></span></div>
      <button class="lnh"><span class="lnh-t">Lane</span><span class="lnh-n">3</span></button></div></div></div>
      <div class="lane"><span class="nm">Events</span><div class="tk">
        <!-- the case the static pass cannot see: same rule, NO topic accent set -->
        <div class="bar live" style="left:0;width:40%"><span class="bl">Unaccented bar</span></div></div></div>
    </div>
    <div class="flags"><span class="flag"><b>Nightfall</b> ends 6 days after the battle pass.</span></div>
    <div class="callout"><b>Heads up:</b> this announcement has no expiry.</div>
    <div class="callout bad"><b>This permanently removes 4 draws.</b></div>
  </div>

  <div class="panel"><div class="mtools"><span class="srch"><input placeholder="Search…"></span>
      <button class="chip" aria-pressed="false">Type: all</button><button class="chip" aria-pressed="true">State: staged</button>
      <span class="rt">39 of 39 shown</span><button class="accent-fill">+ Add</button></div>
    <div class="twrap"><table><thead><tr><th></th><th>Item</th><th>State</th></tr></thead><tbody>
      <tr><td><input type="checkbox"></td><td class="n"><span class="dot" style="--topic-accent:var(--draw)"></span>Accented row</td>
        <td><span class="stt live" style="--topic-accent:var(--draw)">LIVE</span></td></tr>
      <!-- and the same pill with NOTHING set on it -->
      <tr><td><input type="checkbox"></td><td class="n"><span class="dot"></span>Unaccented row</td>
        <td><span class="stt live">LIVE</span></td></tr>
      <tr><td><input type="checkbox"></td><td class="n">Staged</td><td><span class="stt stag">STAGED</span></td></tr>
      <tr><td><input type="checkbox"></td><td class="n">Scheduled</td><td><span class="stt sched">SCHEDULED</span></td></tr>
      <tr><td><input type="checkbox"></td><td class="n">Expired</td><td><span class="stt exp">EXPIRED</span></td></tr>
      <tr><td><input type="checkbox"></td><td class="n">Conflict</td><td><span class="stt conf">CONFLICT</span></td></tr>
      <tr class="sel"><td><input type="checkbox" checked></td><td class="n">Selected row</td><td><span class="stt live">LIVE</span></td></tr>
      <tr class="preview-sel"><td><input type="checkbox"></td><td class="n">Preview-selected row</td><td class="d">Aug 12 → Aug 22</td></tr>
    </tbody></table></div>
    <div class="bulk"><span>2 selected</span><button>Export selection</button><button class="danger">Stage deletion</button>
      <span class="note">Destructive actions stage — they never fire from here.</span></div>
  </div>

  <div class="panel"><div class="cols">
    <div class="col"><h4>Draft<span class="ct">0</span></h4><p class="colnote">Started, not yet staged.</p></div>
    <div class="col"><h4>Blocked<span class="ct bad">1</span></h4>
      <button class="card t3 blocked"><div class="ch"><span class="tr">T3</span><span class="cn">Delete draw</span></div>
        <span class="cd">1 operation</span><span class="inv"><b>Undo would restore the draw</b></span>
        <div class="why">Must be exported first.<span class="holder">Download</span></div></button></div>
    <div class="col gate"><h4>Ready<span class="ct">0</span></h4><button class="commit">Review 1 ready</button>
      <button class="commit" disabled>Commit</button></div>
  </div></div>

  <div class="panel"><div class="review"><div class="oplist"><h5>Operations</h5></div><div class="revbody">
    <div class="revhead"><span class="ttl">Delete draw</span><span class="tierbadge t3">Tier 3 — irreversible</span></div>
    <div class="diffs"><div class="diff"><h6>Before</h6><div class="rows">
      <div class="r del"><span class="s">−</span><span class="k">draw</span><span class="v">Iron Wolf</span></div></div></div>
      <div class="diff"><h6>After</h6><div class="rows">
        <div class="r add"><span class="s">+</span><span class="k">draw</span><span class="v">—</span></div></div></div></div>
    <div class="gate"><h6>Before this can commit</h6><p class="why">Tier 3 destroys state.</p>
      <div class="step done"><span class="n">1</span><span class="lbl">Previewed</span></div>
      <div class="step"><span class="n">2</span><span class="lbl">Download</span><button>Export .txt</button></div></div>
  </div></div><div class="revfoot"><span class="tally">Ready to commit</span><button>Keep staged</button></div></div>

  <div class="panel"><div class="kpis">
    <div class="kpi ok"><h5>Uptime</h5><span class="v">14d 6h</span><span class="sub">since the last deploy</span>
      <div class="spark"><i style="height:40%"></i><i class="tip" style="height:100%"></i></div></div>
    <div class="kpi bad"><h5>Errors 24h</h5><span class="v">3</span><span class="sub">91 lower-level alerts</span></div>
  </div>
  <div class="srcline"><span>SOURCES</span><span>BootRecord · AlertLog</span><span class="rt">2 restarts</span></div>
  <div class="riverfilters"><span class="kind change">CHANGE</span><span class="kind alert">ALERT</span>
    <span class="kind boot">BOOT</span><span class="src">PORTAL</span><span class="rt">one stream</span></div></div>

  <div class="panel"><div class="gwrap"><table class="grid"><thead>
    <tr><th class="who">Admin</th><th class="grp">Commands</th></tr></thead><tbody>
    <tr><td class="who"><b>411000000000000001</b><span>granted 2026-08-13</span></td>
      <td><span class="cel on">✓</span><span class="cel inh">✓</span><span class="cel">✓</span></td></tr></tbody></table></div>
    <div class="glegend"><span><span class="cel on">✓</span>granted directly</span><span><span class="cel inh">✓</span>inherited</span></div>
    <div class="scopes"><div class="scope spof"><span class="nm">manage.draws</span>
      <span class="holder owner">owner</span><span class="holder">…00001</span><span class="flag">⚠ single point</span></div></div>
    <div class="grantrow"><input placeholder="Discord ID"><button class="accent-fill">Grant</button>
      <span class="hint">A new admin starts with nothing granted.</span></div></div>

  <div class="panel"><div class="air">
    <div class="ruler"><span style="left:0%">2026-08-01</span><span data-end style="left:100%">2026-09-19</span></div>
    <div class="lanes">
      <div class="lane"><span class="nm">Season 7 is live</span><div class="tk">
        <div class="bar live forever" style="--topic-accent:#F2C230;left:0;width:80%"><span class="bl">no expiry →</span></div></div></div>
      <div class="lane"><span class="nm">Clan wars</span><div class="tk">
        <div class="bar stag" style="--topic-accent:#8A6BD1;left:20%;width:30%"><span class="bl">scheduled</span></div></div></div>
      <div class="lane"><span class="nm">Unaccented</span><div class="tk">
        <div class="bar live" style="left:10%;width:20%"><span class="bl">no accent set</span></div></div></div>
    </div></div></div>

  <div class="panel"><div class="ph"><span class="t">Live preview</span></div><div class="pb">
    <div class="v2-card" style="--v2-accent:#FF3430"><h1>FENNEC — Close Quarters</h1>
      <p class="v2-small">SMG · Meta build</p><h3>Attachments</h3>
      <p>MIP Light Flash Guard</p><blockquote>A quoted note about this build.</blockquote>
      <hr class="v2-sep"><div class="v2-row"><button>Share</button><button>Copy code</button></div></div>
    <div class="v2-card"><h1>Unaccented card</h1><p>No --v2-accent set on this one.</p></div>
    <p class="v2-empty">Click a row to preview its Discord card.</p></div></div>

  <div class="panel"><div class="slots"><div class="slot" style="--topic-accent:#F2C230">
    <span class="sl">SLOT 1 — TOP</span><span class="tx">Season 7 is live</span>
    <span class="mt">up 19d · <span class="warn">no expiry</span></span></div>
    <!-- and a slot with no accent set -->
    <div class="slot"><span class="sl">SLOT 2</span><span class="tx">Unaccented slot</span><span class="mt">up 9d</span></div></div>
    <p class="empty">Nothing is showing right now.</p></div>

  <div class="panel"><div class="catsec" style="--cat:#FF3430"><div class="cathead">
      <span class="nm">AR</span><span class="ln"></span><span class="ct">17 weapons</span></div>
    <div class="wcards"><button class="wcard"><span class="nm">AK-47</span>
      <span class="mt">3 builds · <span class="dupe">dupe?</span></span><span class="noimg">no image</span></button></div></div>
    <div class="covwrap"><table class="cov"><tbody><tr style="--cat:#FF3430"><td class="who">AR</td>
      <td><span class="covcell zero">0</span></td><td><button class="covcell hit">4</button></td>
      <td><button class="covcell hit on">2</button></td></tr></tbody></table></div>
    <p class="covnote">Every cell is a filter.</p></div>
</main>
<div class="door"><h1>DIOREO<b>/</b>PORTAL</h1><p class="tag">bot management</p>
  <a class="door-cta" href="/auth/login">Continue with Discord</a>
  <div class="facts"><h2>What this asks for</h2><ul><li><span class="y">✓</span> your user ID</li>
    <li><span class="n">×</span> no email</li></ul></div></div>
<div class="tray"><div class="tray-item">A change failed<button>Undo</button><button class="dismiss">×</button></div></div>
</body></html>`;
}

(async () => {
    const chrome = findChrome();
    if (!chrome) {
        // 🔴 LOUD SKIP, NEVER A PASS. A contrast gate that quietly checks nothing when the browser is missing reports exactly what a clean run reports, which is how a dead gate survives.
        console.error('  ⚠ SKIPPED — no Chrome found. Tried:\n      ' + CHROME_CANDIDATES.join('\n      '));
        console.error('    Set PUPPETEER_EXECUTABLE_PATH to run this check. NOT a pass.');
        process.exit(0);
    }

    build();
    const css = fs.readFileSync(path.join(ROOT, 'portal', 'public', 'app.css'), 'utf8');
    const puppeteer = require('puppeteer-core');
    const browser = await puppeteer.launch({ executablePath: chrome, args: ['--no-sandbox'] });
    let failures = 0;
    try {
        const page = await browser.newPage();
        await page.setContent(fixtureHtml(css), { waitUntil: 'load' });

        const { out: findings, skipped } = await page.evaluate((MIN) => {
            const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null;
                const p = m[1].split(',').map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
            const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
                return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
            const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
            // The background a reader actually sees: the nearest ancestor painting a non-transparent colour. ⚠️ THE 0.85 THRESHOLD IS A DELIBERATE LIMIT, stated rather than silent: a row tint like `tr.sel td` (alpha .06) is walked PAST rather than composited, so the probe reports the panel's colour beneath it. At that alpha the effective luminance shift is under a percent, but a future tint heavy enough to matter would be measured against the wrong ground -- if one is ever added, composite here instead of skipping. A transparent element shows its parent's, which is the whole reason a rule-level static check cannot answer this.
            const paintedBg = (el) => { for (let n = el; n; n = n.parentElement) {
                const cs = getComputedStyle(n);
                // 🔴 A GRADIENT MAKES THE BACKGROUND UNKNOWABLE HERE, and reporting it anyway is a FALSE POSITIVE -- computed backgroundColor for a gradient is transparent, so the walk falls through to the panel and measures text against a colour it is not on. Caught live: `.air .bar.forever`'s black label reported 1.25:1 while actually sitting on the solid gold end of its own gradient. Skipped, and COUNTED, because a silent skip is how a gate quietly stops covering something.
                if (cs.backgroundImage && cs.backgroundImage !== 'none') return null;
                const c = parse(cs.backgroundColor); if (c && c.a > 0.85) return c; }
                return { r: 15, g: 20, b: 24, a: 1 }; };
            const out = []; let skipped = 0;
            for (const el of document.querySelectorAll('body *')) {
                const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
                if (!own) continue;                                   // only elements painting their OWN text
                const cs = getComputedStyle(el);
                if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') continue;
                if (el.closest('.sr-only')) continue;
                const fg = parse(cs.color); if (!fg || fg.a < 0.85) continue;
                const bg = paintedBg(el);
                if (!bg) { skipped++; continue; }
                const r = ratio(fg, bg);
                if (r < MIN) out.push({
                    what: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).replace(/\s+/g, '.') : ''),
                    text: el.textContent.trim().slice(0, 30), color: cs.color, bg: `rgb(${Object.values(bg).slice(0, 3).join(',')})`,
                    ratio: Math.round(r * 100) / 100, size: cs.fontSize,
                });
            }
            return { out, skipped };
        }, CONTRAST_MIN);

        const measured = await page.evaluate(() => document.querySelectorAll('body *').length);
        if (findings.length) {
            console.error(`  ✗ ${findings.length} rendered element(s) below ${CONTRAST_MIN}:1 (of ${measured} walked):`);
            for (const f of findings) console.error(`      ${f.ratio}:1  ${f.what}  ${f.color} on ${f.bg}  ${f.size}  “${f.text}”`);
            failures = 1;
        } else {
            console.log(`  ✓ every rendered element painting text meets ${CONTRAST_MIN}:1 (${measured} elements walked, ${skipped} skipped over a gradient)`);
        }

        // 🔴 THE FALSIFIER. A gate that cannot fail manufactures confidence, and this one is easy to write vacuously — a selector typo, an over-eager `continue`, a transparent-background rule that swallows everything. Inject the original login button and require it to be caught.
        const caught = await page.evaluate(() => {
            const el = document.querySelector('.door-cta');
            el.style.setProperty('background', '#1F272E', 'important');
            el.style.setProperty('color', '#000000', 'important');
            const cs = getComputedStyle(el);
            const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); const p = m[1].split(',').map(Number); return { r: p[0], g: p[1], b: p[2] }; };
            const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
                return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
            const [x, y] = [lum(parse(cs.color)), lum(parse(cs.backgroundColor))].sort((a, b) => b - a);
            return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100;
        });
        assert.ok(caught < CONTRAST_MIN, `the injected login button measured ${caught}:1 — the probe is not reading computed style`);
        console.log(`  ✓ THE PROBE CAN FAIL: the original login button reads ${caught}:1 when reinstated`);
    } finally {
        await browser.close();
    }
    process.exit(failures);
})().catch((e) => { console.error('  ✗ harness failed\n      ' + e.stack); process.exit(1); });
