// Board 3 version 2 — serves the kit over http (ES modules do not load from file://), opens each hash in Chrome and saves a screenshot.
// Usage: node shoot.cjs <tag> "<hash>[,<hash>…]" [width]   e.g. node shoot.cjs a "#/armory,#/history" 1282
// Prints console errors and a small DOM census per hash so a blank page cannot pass for a rendered one.
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require(path.resolve(__dirname, '../../../node_modules/puppeteer-core'));
const ROOT = __dirname;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml' };
const tag = process.argv[2] || 'x';
const hashes = (process.argv[3] || '#/armory').split(',');
const width = Number(process.argv[4]) || 1282;
const server = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
    fs.readFile(p.endsWith(path.sep) ? path.join(p, 'index.html') : p, (err, buf) => {
        if (err) { res.writeHead(404); return res.end('404'); }
        res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' });
        res.end(buf);
    });
});
server.listen(0, '127.0.0.1', async () => {
    const port = server.address().port;
    const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', userDataDir: path.join(require('os').tmpdir(), 'pins2-board-3-v2-chrome') });
    const out = [];
    for (const hash of hashes) {
        const p = await b.newPage(); const errs = [];
        p.on('pageerror', (e) => errs.push('PAGEERROR ' + String(e).slice(0, 300)));
        p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
        p.on('requestfailed', (r) => errs.push('REQFAIL ' + r.url()));
        p.on('response', (r) => { if (r.status() >= 400) errs.push(`${r.status()} ${r.url()}`); });
        await p.setViewport({ width, height: 900, deviceScaleFactor: 1 });
        await p.evaluateOnNewDocument(() => { try { localStorage.setItem('pins2-board-3-v2-seen', '1'); } catch (e) {} });
        await p.goto(`http://127.0.0.1:${port}/index.html${hash}`, { waitUntil: 'networkidle0' });
        await p.evaluate(() => document.fonts.ready);
        await new Promise((r) => setTimeout(r, 900));
        const census = await p.evaluate(() => ({ ovf: Math.max(document.documentElement.scrollWidth - innerWidth, (document.querySelector('main') || document.body).scrollWidth - (document.querySelector('main') || document.body).clientWidth), textLen: document.body.innerText.length, rows: document.querySelectorAll('tr, .wg, .wg-row, [role=row]').length, panels: document.querySelectorAll('.panel').length, title: (document.querySelector('h1') || {}).textContent }));
        if (process.env.ACT) { await p.evaluate(`(async () => { ${process.env.ACT} })()`).catch((e) => errs.push('ACT ' + e.message)); await new Promise((r) => setTimeout(r, 700)); }
        census.ovfAfter = await p.evaluate(() => { const m = document.querySelector('main') || document.body; return Math.max(document.documentElement.scrollWidth - innerWidth, m.scrollWidth - m.clientWidth); });
        if (process.env.HOVER) { await p.hover(process.env.HOVER).catch((e) => errs.push('HOVER ' + e.message)); await new Promise((r) => setTimeout(r, 450)); }
        const file = path.join(ROOT, 'shots', `${tag}-${hash.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'root'}.png`);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        await p.screenshot({ path: file, fullPage: false });
        out.push({ hash, census, errors: errs, file: path.relative(ROOT, file) });
        await p.close();
    }
    console.log(JSON.stringify(out, null, 1));
    await b.close(); server.close();
});
