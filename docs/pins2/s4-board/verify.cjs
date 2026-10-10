// Board 3 (redo) — serves the kit over http (ES modules do not load from file://), opens it in Chrome with a mock db
// capability, and checks what the board claims: no console errors, every gate and pick rendered, each fix measurable in
// computed style with the switch on AND off, and a pick that actually writes. Screenshots land in shots/.
// Usage: node verify.cjs [tag] [width]
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require(path.resolve(__dirname, '../../../node_modules/puppeteer-core'));

const ROOT = __dirname;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml' };
const tag = process.argv[2] || 'a';
const width = Number(process.argv[3]) || 1282;

const server = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
    fs.readFile(p.endsWith(path.sep) ? path.join(p, 'index.html') : p, (err, buf) => {
        if (err) { res.writeHead(404); return res.end('404'); }
        res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' });
        res.end(buf);
    });
});

const MOCK_DB = `
window.__dbWrites = [];
const docs = new Map();
const subs = new Map();
const fire = (p) => (subs.get(p) || []).forEach((fn) => fn({ exists: docs.has(p), data: () => docs.get(p) }));
window.claude = {
    use: async (name) => (name !== 'db' ? null : {
        doc: (p) => ({
            set: async (data) => { docs.set(p, data); window.__dbWrites.push({ path: p, data }); fire(p); },
            get: async () => ({ exists: docs.has(p), data: () => docs.get(p) }),
            onSnapshot: (fn) => { subs.set(p, [...(subs.get(p) || []), fn]); fn({ exists: docs.has(p), data: () => docs.get(p) }); return () => {}; },
        }),
    }),
};`;

server.listen(0, '127.0.0.1', async () => {
    const port = server.address().port;
    const browser = await puppeteer.launch({
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        headless: 'new', userDataDir: path.join(require('os').tmpdir(), 'pins2-board-3-redo-chrome'),
    });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => { const t = 'PAGEERROR ' + String(e.stack || e).slice(0, 700); if (!errors.includes(t)) errors.push(t); });
    page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE ' + m.text().slice(0, 300)); });
    page.on('requestfailed', (r) => errors.push('REQFAIL ' + r.url()));
    page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    await page.setViewport({ width, height: 1000, deviceScaleFactor: 1 });
    await page.evaluateOnNewDocument(MOCK_DB);
    await page.evaluateOnNewDocument(() => { try { localStorage.removeItem('pins2-board-3-redo'); } catch (e) { /* private window */ } });
    await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 1400));

    const census = await page.evaluate(() => ({
        gates: document.querySelectorAll('.g-gate').length,
        picks: document.querySelectorAll('.dk-row').length,
        options: document.querySelectorAll('.dk-o').length,
        controls: document.querySelectorAll('.g-ctls .seg').length,
        order: [...document.querySelectorAll('.g-gate')].map((g) => g.id.replace('g-', '')),
        stages: document.querySelectorAll('.g-stage').length,
        manifests: document.querySelectorAll('.mtools').length,
        weaponGroups: document.querySelectorAll('.wg').length,
        buildRows: document.querySelectorAll('.wg-r').length,
        missingPins: (document.querySelector('.g-missing') || {}).textContent || null,
        gatesWithoutStage: [...document.querySelectorAll('.g-gate')].filter((g) => !g.querySelector('.g-stage')).map((g) => g.id),
        frames: document.querySelectorAll('iframe').length,
        overlays: document.querySelectorAll('.drawer, .cmdbar, .selbar').length,
        waiting: document.querySelectorAll('.g-wait').length,
        pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
    }));

    const px = (sel, prop) => page.evaluate(([s, p]) => {
        const el = document.querySelector(s);
        return el ? getComputedStyle(el)[p] : null;
    }, [sel, prop]);

    const setKey = (k, v) => page.evaluate(([kk, vv]) => window.__b3.set(kk, vv), [k, v]);

    const fixed = {
        headRow: await px('.wg-heads', 'minHeight'),
        buildRow: await px('.wg-r', 'minHeight'),
        codeCursor: await px('.wg-code', 'cursor'),
        secondaries: await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--sec').trim()),
        foldIcon: await page.evaluate(() => { const u = document.querySelector('.wg-fold use'); return u && u.getAttribute('href'); }),
        accentRadius: await page.evaluate(() => { const el = document.querySelector('.wg-h'); return el ? getComputedStyle(el, '::before').borderRadius : null; }),
    };
    const cbAlign = await page.evaluate(() => {
        const gate = document.getElementById('g-armory-manifest');
        if (!gate) return 'no manifest surface';
        const box = (sel) => { const el = gate.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return { left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height) }; };
        const pad = (sel) => { const el = gate.querySelector(sel); return el ? getComputedStyle(el).paddingLeft + ' / ' + getComputedStyle(el).gridTemplateColumns : null; };
        return {
            headBox: box('.wg-heads .cb'), weaponBox: box('.wg-h .cb'), rowBox: box('.wg-r .cb'),
            headCell: box('.wg-heads .wg-cb'), weaponCell: box('.wg-h .wg-cb'), rowCell: box('.wg-r .wg-cb'),
            headsPad: pad('.wg-heads'), weaponPad: pad('.wg-h'), rowPad: pad('.wg-r'),
        };
    });

    await setKey('a1', 'now');
    await new Promise((r) => setTimeout(r, 400));
    const cbAlignToday = await page.evaluate(() => {
        const gate = document.getElementById('g-armory-manifest');
        if (!gate) return 'no manifest surface';
        const left = (sel) => { const el = gate.querySelector(sel); return el ? Math.round(el.getBoundingClientRect().left) : null; };
        return { head: left('.wg-heads .cb'), weapon: left('.wg-h .cb'), row: left('.wg-r .cb') };
    });
    await setKey('a1', 'fixed');
    await new Promise((r) => setTimeout(r, 400));

    const toolsRow = await page.evaluate(() => {
        const surface = document.getElementById('g-armory-manifest');
        const r2 = surface && surface.querySelector('.mt-r2');
        if (!r2) return 'no tools row';
        const groups = [...r2.children];
        const tops = groups.map((g) => Math.round(g.getBoundingClientRect().top));
        const last = groups[groups.length - 1];
        const chips = [...document.querySelectorAll('.mt-r2 .chip')].map((c) => c.textContent.trim());
        const sec = [...document.querySelectorAll('.mt-r2 .chip')].find((c) => /secondaries/i.test(c.textContent));
        return {
            groups: groups.length, wrap: getComputedStyle(r2).flexWrap,
            overflow: r2.scrollWidth - r2.clientWidth,
            inline: (() => { if (groups.length < 2) return null; const a = groups[0].getBoundingClientRect(), b = last.getBoundingClientRect();
                return b.left >= a.right - 1 && b.top < a.bottom && b.bottom > a.top; })(),
            rowHeights: tops.length ? groups.map((g) => Math.round(g.getBoundingClientRect().height)) : [],
            divider: last ? (() => { const cs = getComputedStyle(last, '::before'); return cs.content !== 'none' ? `${cs.width} x ${cs.height} ${cs.backgroundColor}` : getComputedStyle(last).boxShadow; })() : null,
            centres: (() => { const a = groups[0].getBoundingClientRect(), b = last.getBoundingClientRect();
                return Math.round(a.top + a.height / 2) === Math.round(b.top + b.height / 2); })(),
            air: (() => { const chips = [...groups[0].querySelectorAll('.chip')]; if (!chips.length) return null;
                const lastChip = chips[chips.length - 1].getBoundingClientRect(), b = last.getBoundingClientRect();
                const inner = last.firstElementChild.getBoundingClientRect();
                return `${Math.round(b.left - lastChip.right)} before / ${Math.round(inner.left - b.left)} after`; })(),
            attachmentsLast: Boolean(last && /attachments/i.test(last.textContent)),
            categories: chips, secondariesAccent: sec ? getComputedStyle(sec).getPropertyValue('--c').trim() : null,
        };
    });

    await setKey('a1', 'now');
    await setKey('e4', 'now');
    await new Promise((r) => setTimeout(r, 600));
    const today = {
        headRow: await px('.wg-heads', 'minHeight'),
        buildRow: await px('.wg-r', 'minHeight'),
        codeCursor: await px('.wg-code', 'cursor'),
        foldIcon: await page.evaluate(() => { const u = document.querySelector('.wg-fold use'); return u && u.getAttribute('href'); }),
    };
    await setKey('a1', 'fixed');
    await setKey('e4', 'a');

    // every option of every fork renders its stage without throwing
    const forks = await page.evaluate(() => [...document.querySelectorAll('.dk-row')].map((el) => ({
        fork: el.dataset.fork, options: [...el.querySelectorAll('.dk-see')].length,
    })));
    const before = errors.length;
    for (const f of forks) {
        const n = f.options;
        for (let i = 0; i < n; i += 1) {
            await page.evaluate(([fork, idx]) => {
                const el = document.querySelector(`.dk-row[data-fork="${fork}"]`);
                const b = el && el.querySelectorAll('.dk-see')[idx];
                if (b) b.click();
            }, [f.fork, i]);
            await new Promise((r) => setTimeout(r, 120));
        }
    }
    const optionErrors = errors.slice(before);

    // a pick writes
    await page.evaluate(() => { const b = document.querySelector('.dk-row[data-fork="p1"] .dk-take'); if (b) b.click(); });
    await new Promise((r) => setTimeout(r, 500));
    const writes = await page.evaluate(() => window.__dbWrites);
    const structure = await page.evaluate(() => {
        const gates = [...document.querySelectorAll('.g-gate')];
        const silent = gates.filter((g) => !g.querySelector('.dk-row')).map((g) => g.id);
        return {
            surfaces: gates.map((g) => g.id),
            surfacesWithNoDecision: silent,
            portedRows: document.querySelectorAll('.g-ported tbody tr').length,
            portedPins: [...document.querySelectorAll('.g-ported th')].map((t) => t.textContent.trim()),
            coverageBanner: document.querySelector('.g-missing') ? document.querySelector('.g-missing').textContent : null,
            removedStillPresent: ['g-build-drawer', 'g-broadcast-manifest', 'g-composer'].filter((id) => document.getElementById(id)),
            // The manifest stage is the specimen every design is judged on, so it has to CARRY the cases. He had
            // never seen a TOP 3 badge because no weapon on the stage had one (2026-09-16 14:01 EDT). A missing kind is a
            // failure now rather than something he has to notice.
            // The CLAIMS check is deliberately NOT here: see audit.cjs. Placed in this evaluate it reported all
            // five as false (2026-09-16 15:55 EDT) because verify clicks through every option first, so the board is in
            // whatever state the last click left and the selection bar is not even open. A check that cannot see
            // its subject gives a confident wrong answer. audit.cjs opens the list and sets the state, then reads.
            stageCarries: (() => { const g = document.getElementById('g-armory-manifest');
                if (!g) return null;
                const seen = new Set();
                g.querySelectorAll('.b3-bdg').forEach((el) => seen.add(el.dataset.t || el.dataset.k));
                const want = ['meta', 'best', 'top3', 'top5', 'toxic'];
                return { badges: [...seen].filter(Boolean).sort(), missingBadges: want.filter((k) => !seen.has(k)),
                         weapons: g.querySelectorAll('.wg').length, problems: g.querySelectorAll('.b3-fchip').length }; })(),
            // A duplicate id is invisible until something resolves one: `#manifest` existed twice (the shared Manifest and
            // History's panel), so every comment placed on History re-anchored to the Armory manifest at the top of the page.
            // Checked as a class rather than as that one id, because the next collision will have a different name.
            duplicateIds: (() => { const seen = new Map();
                document.querySelectorAll('[id]').forEach((el) => seen.set(el.id, (seen.get(el.id) || 0) + 1));
                return [...seen].filter(([, n]) => n > 1).map(([id, n]) => `${id}\u00d7${n}`); })(),
        };
    });
    const recorded = await page.evaluate(() => { const el = document.querySelector('.dk-row[data-fork="p1"]'); return el ? el.className + ' :: ' + el.querySelector('.dk-st').textContent : 'no decision row'; });

    // ── the five defects of 2026-09-15 21:01 EDT, each pinned as the number that was wrong.
    const hoverIn = async (sel) => { const el = await page.$(`#g-armory-manifest ${sel}`); if (!el) return false; await el.hover(); await new Promise((r) => setTimeout(r, 420)); return true; };
    const mouseAway = () => page.mouse.move(4, 4).then(() => new Promise((r) => setTimeout(r, 320)));
    await page.evaluate(() => { const el = document.getElementById('g-armory-manifest'); if (el) el.scrollIntoView({ block: 'start' }); });
    await new Promise((r) => setTimeout(r, 600));
    await mouseAway();
    const READ = () => {
        const g2 = document.getElementById('g-armory-manifest');
        const q = (s) => g2 && g2.querySelector(s);
        const clear = (c) => !c || /rgba\(0, 0, 0, 0\)/.test(c) || c === 'transparent';
        const pcx = (el) => { if (!el) return null; const cs = getComputedStyle(el, '::before'); const h = el.getBoundingClientRect();
            const L = parseFloat(cs.left); const R = parseFloat(cs.right);
            return Number.isNaN(L) || Number.isNaN(R) ? null : { cx: +((h.left + L + h.right - R) / 2).toFixed(1), right: +(h.right - R).toFixed(1), lit: !clear(cs.backgroundColor), ring: cs.boxShadow !== 'none' } };
        const fb = q('.wg-ib.wg-fbtn'); const icon = fb && fb.querySelector('.ic');
        const fold = q('.wg-fold'); const chip = q('.b3-fchip, .wg-fsum'); const share = q('.wg-r .wg-acts .wg-ib');
        const igb = q('.wg-code .wg-igb');
        return {
            foldIconOffset: fb && icon ? +(icon.getBoundingClientRect().left + icon.getBoundingClientRect().width / 2 - pcx(fb).cx).toFixed(1) : null,
            collapseAllRestLit: fold ? pcx(fold).lit : null, collapseAllRestRing: fold ? pcx(fold).ring : null,
            collapseAllSelfBg: fold ? getComputedStyle(fold).backgroundColor : null,
            chipRight: chip ? +chip.getBoundingClientRect().right.toFixed(1) : null,
            shareBoxRight: share ? pcx(share).right : null,
            igbBg: igb ? getComputedStyle(igb).backgroundColor : null,
        };
    };
    const dRest = await page.evaluate(READ);
    await hoverIn('.wg-code .wg-igf'); const dField = await page.evaluate(READ); await mouseAway();
    await hoverIn('.wg-code .wg-igb'); const dCopy = await page.evaluate(READ); await mouseAway();
    await hoverIn('.wg-fold'); const dFold = await page.evaluate(READ); await mouseAway();
    const wOf = () => page.evaluate(() => { const el = document.querySelector('#g-armory-manifest .wg-ib.wg-fbtn'); return el ? +el.getBoundingClientRect().width.toFixed(1) : null; });
    const revealRest = await wOf();
    const fbEl = await page.$('#g-armory-manifest .wg-ib.wg-fbtn');
    const revealSamples = [];
    if (fbEl) { const t0 = Date.now(); await fbEl.hover();
        for (let i = 0; i < 8; i += 1) { revealSamples.push({ ms: Date.now() - t0, w: await wOf() }); await new Promise((r) => setTimeout(r, 45)); } }
    await new Promise((r) => setTimeout(r, 500));
    const revealSettled = await wOf();
    await mouseAway();
    const defects = {
        d1_foldIconOffCentre: dRest.foldIconOffset,                                  // was -4.0, want 0
        d2_collapseAllBoxAtRest: { lit: dRest.collapseAllRestLit, ring: dRest.collapseAllRestRing, selfBgOnHover: dFold.collapseAllSelfBg },
        d3_tintIsScopedToSegment: dField.igbBg !== dCopy.igbBg,                      // was false: field and button were identical
        d4_chipVsShareRightEdge: { chip: dRest.chipRight, share: dRest.shareBoxRight, gap: dRest.chipRight != null && dRest.shareBoxRight != null ? +(dRest.chipRight - dRest.shareBoxRight).toFixed(1) : null },
        d5_reveal: { rest: revealRest, settled: revealSettled, samples: revealSamples,
            intermediateFrames: revealSamples.map((r) => r.w).filter((ww) => ww > revealRest + 1 && ww < revealSettled - 1).length },
    };

    fs.mkdirSync(path.join(ROOT, 'shots'), { recursive: true });
    const shoot = async (name, sel) => {
        const el = sel ? await page.$(sel) : null;
        const file = path.join(ROOT, 'shots', `${tag}-${name}.png`);
        if (el) await el.screenshot({ path: file }); else await page.screenshot({ path: file, fullPage: false });
        return path.relative(ROOT, file);
    };
    const shots = [];
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 400));
    shots.push(await shoot('top', null));
    for (const id of ['armory-manifest', 'build-drawer', 'repairs', 'command', 'export', 'queue', 'broadcast-manifest', 'composer', 'history', 'shared']) {
        await page.evaluate((gid) => { const el = document.getElementById(`g-${gid}`); if (el) el.scrollIntoView({ block: 'start' }); }, id);
        await new Promise((r) => setTimeout(r, 400));
        shots.push(await shoot(id, `#g-${id}`));
    }

    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await new Promise((r) => setTimeout(r, 700));
    const phone = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        widest: [...document.querySelectorAll('.g-gate, .pk, .pidx, .g-settled')]
            .map((el) => Math.round(el.getBoundingClientRect().width)).sort((a, b) => b - a)[0],
    }));
    shots.push(await shoot('phone', null));
    await page.setViewport({ width: 1282, height: 1000 });
    await new Promise((r) => setTimeout(r, 600));
    shots.push(await shoot('tools', '#g-armory-manifest .mtools'));

    console.log(JSON.stringify({ defects, census, fixed, cbAlign, cbAlignToday, toolsRow, today, optionErrors, writes, recorded, structure, phone, shots, errors }, null, 1));
    await browser.close();
    server.close();
});
