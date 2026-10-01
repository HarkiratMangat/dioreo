// board4-menu-fit.cjs — does every dropdown list in Board 4's build drawer open fully inside the drawer, 10px off its field?
// Written 2026-09-28 20:35 EDT after Harkirat found the weapon/category list, opened upward, cut off at the form column's top — a case the
// class-K measurements never produced because they ran in a 960px-tall window where the lists always had room to open downward.
// Run from the repo root with the board served (preview_start "repo-static"):
//   H=700 node docs/pins2/instruments/board4-menu-fit.cjs
// H is the window height (default 960); short windows are what force a list upward. Each combobox in the drawer is opened with its field
// scrolled to the column's top and to its bottom, then after typing one letter (the list shrinks and must stay anchored), then with the PAGE
// scrolled so the field sits 90px off the window's floor — his case: the list is forced upward and must still fit.
// Prints one line per case: direction, gap to the field, list height, list top against the column top, and INSIDE or CLIPPED.
const puppeteer = require('puppeteer-core');
const H = Number(process.env.H || 960);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
    const br = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
    const p = await br.newPage(); await p.setViewport({ width: 1440, height: H, deviceScaleFactor: 2 });
    const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
    await p.goto('http://localhost:8900/docs/pins2/kit/board4.html', { waitUntil: 'networkidle0', timeout: 60000 }); await wait(2500);
    await p.evaluate(() => { const h = [...document.querySelectorAll('h1,h2,h3')].find((x) => x.textContent.trim() === 'New build'); let g = h; while (!g.querySelector('.seg')) g = g.parentElement; [...g.querySelector('.seg').querySelectorAll('button')].find((b) => b.textContent.trim() === 'Add · filled').click(); });
    await wait(900);
    const ids = await p.evaluate(() => { const d = document.querySelector('.drawer .f-form').closest('.drawer'); d.scrollIntoView({ block: 'start' }); return [...d.querySelectorAll('input[role=combobox]')].map((i) => i.id); });
    const out = []; let clipped = 0;
    for (const id of ids.slice(0, 4)) for (const where of ['top', 'bottom', 'filter', 'low']) {
        await p.evaluate(() => document.querySelector('.drawer .f-form').closest('.drawer').scrollIntoView({ block: 'start' }));   // each case starts from the same page position
        await p.evaluate((id, where) => { const i = document.getElementById(id); const col = i.closest('.f-form'); const f = i.closest('.f-pick'); const cr = col.getBoundingClientRect(), fr = f.getBoundingClientRect(); col.scrollTop += where === 'top' ? (fr.top - cr.top - 24) : (fr.bottom - cr.bottom + 24); if (where === 'low') { col.scrollTop = 0; const r = i.getBoundingClientRect(); window.scrollBy(0, r.bottom - (innerHeight - 90)); } }, id, where);
        await wait(300);
        const inp = await p.$('#' + id); const b = await inp.boundingBox(); await p.mouse.click(b.x + 20, b.y + b.height / 2); await wait(450);
        if (where === 'filter') { await p.keyboard.type('a'); await wait(300); }
        const m = await p.evaluate((id) => {
            const i = document.getElementById(id); const ul = document.getElementById(id + '-list'); if (!ul) return 'no list';
            const col = i.closest('.f-form').getBoundingClientRect(), dr = i.closest('.drawer').getBoundingClientRect(), u = ul.getBoundingClientRect(), f = i.closest('.f-pick').getBoundingClientRect();
            const up = u.bottom <= f.top + 1; const gap = up ? f.top - u.bottom : u.top - f.bottom; const fixed = getComputedStyle(ul).position === 'fixed';
            // visible only inside every ancestor that clips it: a mask hides a fixed child too, an overflow clip hides an absolute one
            let top = 0, bot = innerHeight; for (let a = ul.parentElement; a && a !== document.body; a = a.parentElement) { const cs = getComputedStyle(a); const masked = (cs.maskImage && cs.maskImage !== 'none') || (cs.webkitMaskImage && cs.webkitMaskImage !== 'none'); const clips = !fixed && cs.overflowY !== 'visible'; if (masked || clips) { const r = a.getBoundingClientRect(); top = Math.max(top, r.top); bot = Math.min(bot, r.bottom); } }
            const inside = u.top >= top - 0.5 && u.bottom <= bot + 0.5;
            // and nothing sits ON it: a header or footer painted above the list covers it without clipping it
            const hit = (y) => { const e = document.elementFromPoint(u.left + u.width / 2, y); return !!e && ul.contains(e); };
            const shown = hit(u.top + 6) && hit(u.bottom - 6);
            return `${up ? 'up  ' : 'down'} gap ${gap.toFixed(1).padStart(5)} h ${String(Math.round(u.height)).padStart(3)} top ${Math.round(u.top)} (col ${Math.round(col.top)}) ${!inside ? 'CLIPPED' : !shown ? 'COVERED' : 'INSIDE'} ${fixed ? 'fixed' : 'absolute'}`;
        }, id);
        if (/CLIPPED|COVERED/.test(m)) clipped++;
        out.push(`${id.padEnd(8)} ${where.padEnd(7)} ${m}`);
        await p.mouse.click(20, 300); await wait(300);   // close by a click in the page's left margin, clear of the drawer (a click at the top could land on its ×)
    }
    const sc = await p.evaluate(() => { const i = document.querySelector('.drawer input[role=combobox]'); i.click(); return new Promise((res) => setTimeout(() => { const had = !!document.getElementById(i.id + '-list'); i.closest('.f-form').scrollTop += 40; setTimeout(() => res(`an outside scroll closes the list: ${had && !document.getElementById(i.id + '-list')}`), 250); }, 300)); });
    console.log(`window 1440x${H}\n${out.join('\n')}\n${sc}\nclipped ${clipped} · page errors ${errs.length} ${errs.slice(0, 2).join(' ')}`);
    await br.close();
    process.exitCode = clipped ? 2 : 0;
})();
