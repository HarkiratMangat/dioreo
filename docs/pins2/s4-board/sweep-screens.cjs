// LOOK AT THE WHOLE BOARD, not at the element I already suspect. Written 2026-09-16 16:18 EDT after Harkirat asked how the
// board 2 session verified its work: it shot the board in full 888px screens, top to bottom, and READ every one --
// `local/pins2-board-2/at1282.cjs`, 142 frames. My shots.cjs clips one selector, so it can only ever confirm what I
// was already thinking about. A close button that painted under its own header was invisible to every check I ran and
// obvious in one full screen.
// Usage: node sweep-screens.cjs [tag] [click:<sel>|<sel>] [set:k=v ...]
const http = require('http'); const fs = require('fs'); const path = require('path');
const puppeteer = require(path.resolve(__dirname, '../../../node_modules/puppeteer-core'));
const ROOT = __dirname;
const TAG = (process.argv[2] && !process.argv[2].includes(':')) ? process.argv[2] : 'w';
const SET = process.argv.filter((a) => a.startsWith('set:')).map((a) => a.slice(4).split('='));
const CLICK = (process.argv.find((a) => a.startsWith('click:')) || '').slice(6);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
    fs.readFile(p.endsWith(path.sep) ? path.join(p, 'index.html') : p, (err, buf) => {
        if (err) { res.writeHead(404); return res.end('404'); }
        res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' });
        res.end(buf);
    });
});
const MOCK_DB = `
window.__dbWrites = []; const docs = new Map(); const subs = new Map();
const fire = (p) => (subs.get(p) || []).forEach((fn) => fn({ exists: docs.has(p), data: () => docs.get(p) }));
window.claude = { use: async (n) => (n !== 'db' ? null : { doc: (p) => ({
    set: async (d) => { docs.set(p, d); window.__dbWrites.push({ path: p, data: d }); fire(p); },
    get: async () => ({ exists: docs.has(p), data: () => docs.get(p) }),
    onSnapshot: (fn) => { subs.set(p, [...(subs.get(p) || []), fn]); fn({ exists: docs.has(p), data: () => docs.get(p) }); return () => {}; },
}) }) };`;
server.listen(0, '127.0.0.1', async () => {
    const port = server.address().port;
    const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', userDataDir: path.join(require('os').tmpdir(), 'pins2-b3-sweep') });
    const page = await browser.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));
    await page.setViewport({ width: 1282, height: 888, deviceScaleFactor: 1 });
    await page.evaluateOnNewDocument(MOCK_DB);
    // ⚠️ removeItem on ONE key left the rest of the board's saved state alive, and because the profile dir persists
    // between runs the sweep shot twelve screens with a drawer open over every one of them — a discovery pass that
    // could discover nothing. clear() is the only reset that matches what the board writes. (2026-09-16 20:55 EDT)
    await page.evaluateOnNewDocument(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (e) { /* private */ } });
    await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 1800));
    for (const [k, v] of SET) await page.evaluate((a, b) => window.__b3.set(a, b), k, v);
    for (const sel of CLICK.split('|').map((x) => x.trim()).filter(Boolean)) {
        await page.evaluate((s) => { const el = document.querySelector(s); if (el) { el.scrollIntoView({ block: 'center' }); el.click(); } }, sel);
        await new Promise((r) => setTimeout(r, 500));
    }
    await new Promise((r) => setTimeout(r, 400));
    fs.mkdirSync(path.join(ROOT, 'shots'), { recursive: true });
    const H = await page.evaluate(() => document.documentElement.scrollHeight);
    let i = 0;
    for (let y = 0; y < H; y += 888) {
        await page.evaluate((yy) => window.scrollTo(0, yy), y);
        await new Promise((r) => setTimeout(r, 200));
        await page.screenshot({ path: path.join(ROOT, 'shots', `${TAG}-${String(i++).padStart(2, '0')}.png`) });
    }
    console.log(JSON.stringify({ height: H, screens: i, errors: errs }, null, 1));
    await browser.close(); server.close();
});
