// Freeze the META badge at chosen 30fps slots and photograph it at 3x, so the cel can be LOOKED AT rather than
// measured. Anchor #23. `animation-delay` is forced to 0 first because `--ph` is a NEGATIVE delay and
// `animation.currentTime` includes the delay — setting currentTime without that override samples the wrong frame.
const http = require('http'); const fs = require('fs'); const path = require('path');
const puppeteer = require(path.resolve(__dirname, '../../../node_modules/puppeteer-core'));
const ROOT = __dirname;
const PAGE = process.argv[2] || 'board3d.html';
const SLOTS = (process.argv[3] || '0,4,8,12,16,21,25,29,34,40,46,64,68,72,78,90').split(',').map(Number);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
    fs.readFile(p, (err, buf) => {
        if (err) { res.writeHead(404); return res.end('404'); }
        res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' });
        res.end(buf);
    });
});
const MOCK_DB = `window.claude={use:async()=>null};`;
server.listen(0, '127.0.0.1', async () => {
    const port = server.address().port;
    const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', userDataDir: path.join(require('os').tmpdir(), 'pins2-b3-volt') });
    const page = await browser.newPage();
    const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
    await page.setViewport({ width: 1282, height: 888, deviceScaleFactor: 3 });
    await page.evaluateOnNewDocument(MOCK_DB);
    await page.evaluateOnNewDocument(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (e) {} });
    await page.goto(`http://127.0.0.1:${port}/${PAGE}`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 2200));
    const found = await page.evaluate(() => {
        const el = document.querySelector('.b3-bdg[data-k=meta]');
        if (!el) return null;
        el.scrollIntoView({ block: 'center' });
        const st = document.createElement('style');
        st.textContent = '.b3-bdg[data-k=meta],.b3-bdg[data-k=meta]::after,.b3-bdg[data-k=meta] .b3-zap{animation-delay:0s !important}';
        document.head.appendChild(st);
        return true;
    });
    if (!found) { console.log(JSON.stringify({ error: 'no META badge on page', errs })); await browser.close(); server.close(); return; }
    await new Promise((r) => setTimeout(r, 600));
    fs.mkdirSync(path.join(ROOT, 'shots'), { recursive: true });
    const info = await page.evaluate(() => {
        const el = document.querySelector('.b3-bdg[data-k=meta]');
        const r = el.getBoundingClientRect();
        const anims = el.getAnimations({ subtree: true }).map((a) => (a.effect.pseudoElement || '') + ':' + (a.animationName || ''));
        const af = getComputedStyle(el, '::after');
        const chain = []; for (let n = el; n && n !== document.body; n = n.parentElement) { const c = getComputedStyle(n); chain.push(n.className + '|of:' + c.overflow + '|cn:' + c.contain + '|cl:' + c.clipPath); }
        return { x: r.x, y: r.y, w: r.width, h: r.height, anims, cs: af.maskImage, afBox: [af.width, af.height, af.left, af.top], afMask: [af.maskSize, af.maskPosition], chain };
    });
    // \u26a0\ufe0f RE-MEASURE BEFORE EVERY SHOT. The first cut measured once and reused the rect for all sixteen
    // frames; the list re-rendered under it and every crop landed on empty table rows, sixteen byte-identical files
    // that looked like "the animation does not run". The rect is not stable across a re-render.
    const pad = 50;
    for (const slot of SLOTS) {
        const clip = await page.evaluate((s) => {
            // \u26a0\ufe0f FREEZE THROUGH CSS, NOT THROUGH THE ANIMATION OBJECT. Pausing the Animation and setting
            // currentTime works until Preact re-renders the row, which discards the paused animation and starts a
            // fresh running one — three different slots came back byte-identical that way, which reads exactly like
            // "the animation is dead". A negative `animation-delay` plus `animation-play-state:paused` in a
            // stylesheet survives any number of re-renders because it is a property of the RULE, not the node.
            let st = document.getElementById('__freeze'); if (!st) { st = document.createElement('style'); st.id = '__freeze'; document.head.appendChild(st); }
            // \u26a0\ufe0f LAND MID-CELL. `s * 33.33` sits exactly on a step boundary and floating point drops it to the cell
            // BEFORE the one asked for \u2014 slots 8 and 68, the two loudest frames in the cel, photographed as empty and
            // read for a minute as \u201cthe animation does not draw\u201d. Half a step in is unambiguous.
            st.textContent = '.b3-bdg[data-k=meta],.b3-bdg[data-k=meta]::after,.b3-bdg[data-k=meta] .b3-zap{animation-delay:-' + ((s + 0.5) * 33.33).toFixed(1) + 'ms !important;animation-play-state:paused !important}';
            const el = document.querySelector('.b3-bdg[data-k=meta]');
            const r = el.getBoundingClientRect();
            // \u26a0\ufe0f `page.screenshot({clip})` is in DOCUMENT coordinates; getBoundingClientRect is VIEWPORT-relative.
            // Without the scroll offset every crop lands wherever the page happens to be scrolled to — which is why the
            // first sixteen frames came back byte-identical and looked like proof the animation was dead.
            return { x: Math.max(0, Math.round(r.x + scrollX - 50)), y: Math.max(0, Math.round(r.y + scrollY - 50)), width: Math.round(r.width + 100), height: Math.round(r.height + 100) };
        }, slot);
        await new Promise((r) => setTimeout(r, 90));
        await page.screenshot({ path: path.join(ROOT, 'shots', `volt-${String(slot).padStart(2, '0')}.png`), clip });
    }
    console.log(JSON.stringify({ info, slots: SLOTS.length, errs }, null, 1));
    await browser.close(); server.close();
});
