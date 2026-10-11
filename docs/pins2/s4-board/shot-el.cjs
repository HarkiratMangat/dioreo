// Photograph ONE element across the values of ONE board option, so a fork is looked at rather than asserted.
// Usage: node shot-el.cjs <page> <selector> <key> <v1,v2,...> [tag] [extraKey=extraVal ...]
// Traps already paid for and encoded here: a clipped screenshot is in DOCUMENT coordinates while
// getBoundingClientRect is viewport-relative; and the rect must be re-measured per shot because the board re-renders.
const http = require('http'); const fs = require('fs'); const path = require('path');
const puppeteer = require(path.resolve(__dirname, '../../../node_modules/puppeteer-core'));
const ROOT = __dirname;
const [PAGE, SEL, KEY, VALS, TAG = KEY] = process.argv.slice(2);
const EXTRA = process.argv.slice(7).map((a) => a.split('='));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
    fs.readFile(p, (err, buf) => { if (err) { res.writeHead(404); return res.end('404'); }
        res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' }); res.end(buf); });
});
server.listen(0, '127.0.0.1', async () => {
    const port = server.address().port;
    const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', userDataDir: path.join(require('os').tmpdir(), 'pins2-b3-el') });
    const page = await browser.newPage(); const errs = [];
    page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
    await page.setViewport({ width: 1282, height: 888, deviceScaleFactor: 3 });
    await page.evaluateOnNewDocument('window.claude={use:async()=>null}');
    await page.evaluateOnNewDocument(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (e) {} });
    await page.goto(`http://127.0.0.1:${port}/${PAGE}`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 2000));
    for (const [k, v] of EXTRA) await page.evaluate((a, b) => window.__b3.set(a, b), k, v);
    await new Promise((r) => setTimeout(r, 500));
    fs.mkdirSync(path.join(ROOT, 'shots'), { recursive: true });
    const out = [];
    for (const val of VALS.split(',')) {
        const clip = await page.evaluate((k, v, sel) => {
            window.__b3.set(k, v);
            const el = document.querySelector(sel); if (!el) return null;
            el.scrollIntoView({ block: 'center' });
            const r = el.getBoundingClientRect();
            return { x: Math.max(0, Math.round(r.x + scrollX - 10)), y: Math.max(0, Math.round(r.y + scrollY - 10)), width: Math.round(r.width + 20), height: Math.round(r.height + 20) };
        }, KEY, val, SEL);
        if (!clip) { out.push([val, 'selector not found']); continue; }
        await new Promise((r) => setTimeout(r, 260));
        const f = path.join(ROOT, 'shots', `${TAG}-${val}.png`);
        await page.screenshot({ path: f, clip }); out.push([val, `${clip.width}x${clip.height}`]);
    }
    console.log(JSON.stringify({ selector: SEL, shots: out, errs }, null, 1));
    await browser.close(); server.close();
});
