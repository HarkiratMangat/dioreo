// Board 4: Builder-2 · empties.cjs — the empty states the walk does not reach (Session 4, R1, 2026-10-04 12:08 EDT). For every gate and every
// state of its head switch, every visible text field in the gate is given a query nothing matches ("zzqx"), and the gate's shot set (fidlib
// shotSet: the window, its end, every scroller paged) is compared on both kits; the field is cleared after. That reaches the manifests'
// "No builds match", Export's and the Armory's "Nothing matches", History's empty list, and a picker's empty menu.
// Usage: node bd-tools/empties.cjs [--ref <dir>] [--cand <dir>] [--sizes 1480x834,1282x888] [--gates C1,...] [--label name]
const path = require('path'); const fs = require('fs');
const L = require('./fidlib.cjs'); const { ROOT } = L;
const { PNG } = require(path.join(ROOT, 'node_modules/pngjs'));
const pixelmatch = require(path.join(ROOT, 'node_modules/pixelmatch'));
const A = (() => { const o = {}; const v = process.argv.slice(2); for (let i = 0; i < v.length; i++) { const k = v[i]; if (!k.startsWith('--')) continue; const n = v[i + 1]; if (n === undefined || n.startsWith('--')) o[k.slice(2)] = true; else { o[k.slice(2)] = n; i++; } } return o; })();
const REF = A.ref || 'local/pins2/s4/ref-kit', CAND = A.cand || 'local/pins2/s4/builder-2'; const LABEL = A.label || 'empties';
const SIZES = (A.sizes || '1480x834,1282x888').split(',').map((s) => s.split('x').map(Number)); const GSEL = A.gates ? A.gates.split(',') : L.GATES.map((g) => g[0]);
const OUT = path.join(ROOT, 'local/pins2/s4/rebuild/empties', LABEL); fs.mkdirSync(OUT, { recursive: true });
const dec = (b) => PNG.sync.read(Buffer.isBuffer(b) ? b : Buffer.from(b));
const TYPE = (id, i, v) => { const f = [...document.getElementById(id).querySelectorAll('input:not([type]),input[type=text],input[type=search],textarea')].filter((e) => !e.disabled && e.getBoundingClientRect().width > 4)[i]; if (!f) return false;
  const set = Object.getOwnPropertyDescriptor(f instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set; f.focus(); set.call(f, v); f.dispatchEvent(new Event('input', { bubbles: true })); return true; };
(async () => {
  const { server, base } = await L.serve(); const rows = [];
  for (const [W, H] of SIZES) { const size = `${W}x${H}`; const bs = await Promise.all([L.launch(W, H), L.launch(W, H)]);
    try { const Ks = await Promise.all([L.openKit(bs[0], base, REF, W, H), L.openKit(bs[1], base, CAND, W, H)]);
      for (const [gid, id] of L.GATES.filter((g) => GSEL.includes(g[0]))) {
        await Promise.all(Ks.map((K) => K.load())); const states = [['rest', -1], ...(await L.actions(Ks[0].p, id)).filter((a) => a[0] === 'state').map((a) => [a[2], a[1]])];
        for (const [st, si] of states) {
          await Promise.all(Ks.map((K) => K.load())); if (si >= 0) await Promise.all(Ks.map((K) => L.act(K, id, 'state', si)));
          const nf = await Ks[0].p.evaluate((id) => [...document.getElementById(id).querySelectorAll('input:not([type]),input[type=text],input[type=search],textarea')].filter((e) => !e.disabled && e.getBoundingClientRect().width > 4).length, id);
          for (let i = 0; i < nf; i++) {
            const ok = await Promise.all(Ks.map(async (K) => { const r = await K.p.evaluate(TYPE, id, i, 'zzqx'); await L.sleep(150); await L.quiet(K.p); return r; }));
            if (!ok[0] || !ok[1]) { rows.push({ size, gid, st, field: i, ok: false, why: 'field missing on one side' }); continue; }
            const [sa, sb] = await Promise.all(Ks.map((K) => L.shotSet(K, id)));
            let ch = 0; const names = (x) => x.map((s) => s.name).join(','); if (names(sa) !== names(sb)) ch += 1e6;
            for (const a of sa) { const b = sb.find((s) => s.name === a.name); if (!b) continue; const x = dec(a.png), y = dec(b.png); const o = new PNG({ width: x.width, height: x.height }); const n = pixelmatch(x.data, y.data, o.data, x.width, x.height, { threshold: 0, includeAA: true, diffMask: true }); ch += n;
              if (n) fs.writeFileSync(path.join(OUT, `${size}_${gid}_${st}_f${i}_${a.name}.png`.replace(/[^\w.-]+/g, '_')), PNG.sync.write(o)); }
            const empty = await Ks[1].p.evaluate((id) => !!document.getElementById(id).querySelector('.empty, .b3-xt-none, .b3-hi-empty, [role=status]'), id);
            rows.push({ size, gid, st, field: i, changed: ch, emptyShown: empty });
            await Promise.all(Ks.map(async (K) => { await K.p.evaluate(TYPE, id, i, ''); await K.p.keyboard.press('Escape'); await L.quiet(K.p); }));
          }
        }
      }
    } finally { await Promise.all(bs.map((b) => b.close())); } }
  server.close(); fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(rows, null, 1));
  const bad = rows.filter((r) => r.changed || r.ok === false); console.log(`empties ${LABEL}: ${rows.length} field states · ${rows.filter((r) => r.emptyShown).length} showed an empty state · ${bad.length} differ`);
  for (const r of bad) console.log(`  DIFF ${r.size} ${r.gid} ${r.st} field ${r.field}: ${r.changed ?? r.why}`); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('empties failed:', e && e.stack || e); process.exit(2); });
