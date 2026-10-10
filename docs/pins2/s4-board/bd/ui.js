// Board 4: Builder · ui.js — the overlay, the toolbar and the panel, in a shadow root so neither the kit's styles nor the page's reset can
// touch them. Inspect mode turns the page's own clicks into selection (the gates' own state switches still work); Use mode gives the page back;
// holding ⌥ lends it for a moment. Plain words throughout (Harkirat, 2026-10-01: "it's so jargon"). window.__bd is the test API verify.cjs uses.
// Plan: local/pins2/s4/builder-plan.md (v3).
(function () {
  const BD = (window.BD = window.BD || {});
  const Q = new URLSearchParams(location.search); const HIDE = Q.has('bdhide'); const FRAME = Q.has('bdframe');
  const M = () => BD.measure, S = () => BD.std, C = () => BD.check, Y = () => BD.why;
  const ready = new Promise((res) => { const t0 = Date.now(); (function poll() { if (document.querySelector('#c-admin .b4-vb .incchip') || Date.now() - t0 > 25000) (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(res, 300)); else setTimeout(poll, 120); })(); });
  const api = (window.__bd = { ready, ui: {} });
  Object.defineProperties(api, { measure: { get: () => BD.measure }, why: { get: () => BD.why }, std: { get: () => BD.std }, check: { get: () => BD.check } });
  ready.then(() => { if (window.__bdFocusRestore) window.__bdFocusRestore(); if (BD.measure.setDescend) BD.measure.setDescend(true); BD.std.init(); if (FRAME) return frameMode(); if (!HIDE) mount(); api.mounted = !HIDE; });

  function frameMode() {
    parent.postMessage({ bd: 'frame', ready: true }, '*');
    addEventListener('message', async (e) => { if (!e.data || e.data.bd !== 'run') return; BD.std.load(e.data.state); const p = await C().standardVsBoard(); parent.postMessage({ bd: 'frame', result: p.map((x) => ({ gate: x.gate, what: x.what, name: x.name })) }, '*'); });
  }

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (v) => (typeof v === 'number' ? (Math.round(v * 100) / 100).toString() : String(v));
  const ICON = { x: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>', undo: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>', redo: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/></svg>', down: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>' };
  const COL = { hover: '#7fe0f0', sel: '#ffd166', miss: '#ff6fae', look: '#b39dff', col: '#7fe0f0', in: '#5ad7ea', gap: '#9be38a', size: '#ffd166', corner: '#ff9f6e', text: '#f2f4f6', icon: '#9fb7ff', bad: '#ff4d6d' };
  // one colour per kind of value, the same on the page and in the panel, so a number in the panel points at its mark on the page
  const KCOL = { height: COL.size, thick: COL.size, padL: COL.in, padR: COL.in, padY: COL.in, padX: COL.in, padT: COL.in, padB: COL.in, maxw: COL.size, s1: COL.gap, s2: COL.gap, s3: COL.gap, s4: COL.gap, s5: COL.gap, s6: COL.gap, gap: COL.gap, gap2: COL.gap, gap3: COL.gap, cw: COL.size, ispace: COL.in, ctt: COL.text, cls: COL.text, clh: COL.text, msize: COL.icon, nfs: COL.text, nfw: COL.text, bh: COL.size, bfs: COL.text, gap4: COL.gap, lw: COL.size, align: COL.gap, radius: COL.corner, edge: COL.corner, fs: COL.text, fw: COL.text, lh: COL.text, ls: COL.text, tt: COL.text, icon: COL.icon, size: COL.icon, trim: COL.text };
  const tint = (c, a) => { const n = parseInt(c.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  const ic = (d, z = 15) => `<svg viewBox="0 0 24 24" width="${z}" height="${z}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  Object.assign(ICON, { note: ic('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'), eye: ic('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'), reset: ic('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>'), minus: ic('<path d="M5 12h14"/>'), plus: ic('<path d="M12 5v14M5 12h14"/>', 14), check: ic('<path d="M20 6 9 17l-5-5"/>', 13), warn: ic('<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>', 13), magnet: ic('<path d="m6 15-4-4 6.75-6.77a7.79 7.79 0 0 1 11 11L13 22l-4-4 6.39-6.36a2.14 2.14 0 0 0-3-3L6 15"/><path d="m5 8 4 4M12 15l4 4"/>', 14), file: ic('<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h6"/>', 12), patch: ic('<rect x="3" y="8" width="18" height="8" rx="4"/><path d="M12 8v8"/>', 13), split: ic('<path d="M6 3v6a6 6 0 0 0 6 6 6 6 0 0 1 6 6M18 3v6"/>', 13), things: ic('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>', 12), layers: ic('<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>', 12), miss: ic('<path d="M3 9h8M13 13h8"/><path d="M12 3v18" stroke-dasharray="2 3"/>', 12) });
  Object.assign(ICON, { go: ic('<path d="M7 17 17 7M8 7h9v9"/>', 12), target: ic('<circle cx="12" cy="12" r="7"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>'), box0: ic('<rect x="4" y="4" width="16" height="16" rx="4"/>', 13), boxon: ic('<rect x="4" y="4" width="16" height="16" rx="4"/><path d="m8 12 3 3 5-6"/>', 13), boxpart: ic('<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8 12h8"/>', 13) });
  const KICON = { control: ic('<rect x="3" y="7" width="18" height="10" rx="5"/>', 16), text: ic('<path d="M5 6h14M12 6v13"/>', 16), icon: ic('<circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/>', 16), layout: ic('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M9 5v14M15 5v14"/>', 16), box: ic('<rect x="4" y="4" width="16" height="16" rx="3"/>', 16), divider: ic('<path d="M3 12h18"/>', 16) };
  const OPTICON = { none: '<span class="tx">aa</span>', uppercase: '<span class="tx">AA</span>', capitalize: '<span class="tx">Aa</span>', normal: '<span class="tx">auto</span>', stretch: ic('<path d="M4 3v18M20 3v18"/><rect x="8" y="6" width="3" height="12" rx="1"/><rect x="13" y="6" width="3" height="12" rx="1"/>'), 'flex-start': ic('<path d="M3 4h18"/><rect x="6" y="7" width="4" height="12" rx="1"/><rect x="14" y="7" width="4" height="7" rx="1"/>'), center: ic('<path d="M3 12h18" stroke-dasharray="2 3"/><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="8" width="4" height="8" rx="1"/>'), 'flex-end': ic('<path d="M3 20h18"/><rect x="6" y="5" width="4" height="12" rx="1"/><rect x="14" y="10" width="4" height="7" rx="1"/>'), baseline: ic('<path d="M3 15h18"/><rect x="6" y="5" width="4" height="10" rx="1"/><rect x="14" y="9" width="4" height="6" rx="1"/>') };
  const CSSTEXT = `
:host{all:initial}
*{box-sizing:border-box}
.ov{position:fixed;left:0;top:0;pointer-events:none;overflow:visible}
.ov text{font:600 10.5px 'Space Grotesk',system-ui,sans-serif;font-variant-numeric:tabular-nums}
.ov .hit{pointer-events:auto;cursor:help}
.tb,.panel,.start,.card,.toast,.pop,.ed{pointer-events:auto;font:500 12.5px/1.45 'Space Grotesk',system-ui,sans-serif;color:#e7ecf0;-webkit-font-smoothing:antialiased}
.tb{position:fixed;top:10px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:6px;padding:6px;background:rgba(15,19,23,.94);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.1);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.45);white-space:nowrap;max-width:calc(100vw - 16px);overflow-x:auto;scrollbar-width:none}
.brand{font-weight:600;color:#fff;padding:0 6px}
button{font:inherit;color:inherit;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.09);border-radius:8px;padding:5px 10px;cursor:pointer;display:inline-flex;align-items:center;gap:5px}
button:hover{background:rgba(255,255,255,.12)} button:disabled{opacity:.4;cursor:default}
button.primary{background:#7fe0f0;color:#0b1216;border-color:#7fe0f0;font-weight:600} button.primary:hover{background:#9be8f4} button.primary:disabled{opacity:.35}
button.ib{padding:5px;border-color:transparent;background:none;color:#aeb8c1} button.ib:hover{background:rgba(255,255,255,.1);color:#fff} button.ib.on{background:rgba(255,255,255,.13);color:#fff}
.seg{display:flex;gap:2px;background:rgba(255,255,255,.05);border-radius:9px;padding:2px}
.seg button{border:0;background:none;padding:4px 9px} .seg button.on{background:#e7ecf0;color:#0f1317}
select,input[type=text],input[type=number],textarea{font:inherit;color:inherit;background:#0b0f12;border:1px solid rgba(255,255,255,.15);border-radius:7px;padding:5px 7px}
textarea{width:100%;min-height:58px;resize:vertical;display:block}
.saved{color:#95a1ab;font-size:12px;padding:0 4px}
.panel{position:fixed;top:62px;right:12px;width:340px;max-height:calc(100vh - 76px);overflow:auto;background:rgba(15,19,23,.97);border:1px solid rgba(255,255,255,.1);border-radius:14px;box-shadow:0 14px 44px rgba(0,0,0,.55)}
.ph{display:flex;align-items:center;gap:8px;padding:9px 8px 9px 10px;border-bottom:1px solid rgba(255,255,255,.07);cursor:grab}
.kg{flex:none;width:28px;height:28px;border-radius:8px;display:grid;place-items:center;background:rgba(255,209,102,.14);color:#ffd166}
.ttl{flex:1;min-width:0}
.title{font-size:14px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
input.vname{display:block;width:calc(100% + 6px);font-size:14px;font-weight:600;color:#fff;background:transparent;border:1px solid transparent;padding:0 5px;margin-left:-6px}
input.vname:hover,input.vname:focus{border-color:rgba(255,255,255,.18);background:#0b0f12;outline:none}
.gates{display:flex;flex-wrap:wrap;gap:3px;margin-top:3px}
.gc{display:inline-flex;align-items:center;gap:3px;font-size:10.5px;font-weight:600;line-height:1;padding:3px 5px;border-radius:5px;background:rgba(255,255,255,.07);color:#aeb8c1;font-variant-numeric:tabular-nums}
.gc b{color:#fff;font-weight:700} .gc.vid{background:rgba(255,209,102,.16);color:#ffd166}
.sec{padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.06)} .sec:last-child{border-bottom:0}
.dia{display:block;width:100%;height:auto}
.dia text{font:600 11px 'Space Grotesk',system-ui,sans-serif;font-variant-numeric:tabular-nums}
.dia .cap{font:500 9px 'Space Grotesk',system-ui,sans-serif;fill:#7d8994}
.num{cursor:pointer} .dia .num:hover rect{stroke-opacity:1}
.kx{display:flex;gap:5px;margin-top:6px}
.kchip{padding:3px 8px;border-radius:6px;gap:6px} .kchip.on{background:#e7ecf0;color:#0f1317} .kcap{color:#8995a0;font-weight:500;font-size:11px} .kchip.on .kcap{color:#4a5560}
.knob{margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.06)}
.kh{display:flex;align-items:center;gap:7px;min-height:26px}
.dot{width:9px;height:9px;border-radius:50%;flex:none}
.kname{flex:1;min-width:0;color:#dfe5ea;font-weight:600}
.kin{width:58px;height:24px;padding:0 6px;border-radius:6px;border:1px solid #2a343c;background:#0f1418;color:#e6edf2;font:600 12px system-ui;font-variant-numeric:tabular-nums}.kin:focus{outline:2px solid #3ef0c8;outline-offset:1px}
.ruler{display:block;width:100%;height:auto;margin-top:2px;touch-action:none;outline:none;border-radius:6px}
.ruler.live{cursor:ew-resize} .ruler:focus-visible{box-shadow:0 0 0 2px rgba(127,224,240,.6)}
.ruler text{font:500 9.5px 'Space Grotesk',system-ui,sans-serif;font-variant-numeric:tabular-nums} .ruler .tk{fill:#7d8994}
.ico-seg{display:flex;gap:2px;background:rgba(255,255,255,.05);border-radius:9px;padding:2px;margin-top:4px}
.ico-seg button{flex:1;justify-content:center;border:0;background:none;padding:5px 6px;color:#aeb8c1}
.ico-seg button.on{background:#e7ecf0;color:#0f1317} .ico-seg button:disabled{opacity:.45;cursor:default} .ico-seg button.on:disabled{opacity:1}
.tx{font-weight:600;font-size:12px}
.from{display:flex;align-items:center;flex-wrap:wrap;gap:4px;margin-top:6px;color:#7d8994}
.fchip{font:500 10.5px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;padding:2px 6px;border-radius:5px;background:rgba(255,255,255,.06);color:#aeb8c1;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.acts{display:flex;align-items:center;flex-wrap:wrap;gap:6px} .acts .sp{flex:1}
.stat{display:inline-flex;align-items:center;gap:5px;padding:4px 8px;border-radius:7px;border:0;font-weight:600;font-variant-numeric:tabular-nums}
.stat.ok{background:rgba(155,227,160,.12);color:#9be3a0} .stat.bad{background:rgba(255,77,109,.15);color:#ff8fa3} .stat.warn{background:rgba(255,179,107,.14);color:#ffc58f} button.stat.warn:hover{background:rgba(255,179,107,.24)}
.tier{display:flex;align-items:center;flex-wrap:wrap;gap:5px;margin-top:6px}
.tl{width:50px;flex:none;color:#8995a0;font-size:11.5px}
.lc{gap:4px;padding:3px 7px;border-radius:6px;border:1px solid rgba(179,157,255,.6);background:rgba(179,157,255,.15);color:#e4dcff;font-weight:600;font-variant-numeric:tabular-nums}
.lc:hover{background:rgba(179,157,255,.26)} .lc b{font-weight:700;color:#fff;font-size:11px;opacity:.85}
.lc.fam{border-style:dashed} .lc.part{background:rgba(179,157,255,.07)} .lc.off{background:none;border-color:rgba(255,255,255,.16);color:#8995a0} .lc.off b{color:#8995a0}
span.lc{display:inline-flex;align-items:center;cursor:help}
.none{color:#5c6873}
.crs{max-height:60vh;overflow:auto;min-width:380px}.cr{display:grid;grid-template-columns:minmax(0,1fr) 44px 36px 92px 70px;align-items:center;gap:6px;padding:3px 0;font-variant-numeric:tabular-nums}.cr.ch{color:#8995a0;font-size:11px}.cr .cn{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left}.cr button{padding:1px 6px}.cr .go{border:0;background:none;color:#cfd7de;cursor:pointer}.cr .go:hover{color:#fff}
.lc .ex{display:inline-flex;align-items:center;margin-left:2px;padding:0 2px;border:0;background:none;color:inherit;opacity:.7;cursor:pointer}.lc .ex.on svg{transform:scaleY(-1)}.lc .ex:hover{opacity:1}
.lone{display:flex;flex-direction:column;gap:2px;margin:4px 0 2px 55px}.lrow{display:flex;align-items:center;gap:6px;min-width:0}.lrow .tk{border:0;background:none;color:#cfc2ff;padding:0;cursor:pointer}.lrow .go{border:0;background:none;color:#cfd7de;padding:2px 4px;border-radius:4px;cursor:pointer;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left}.lrow .go:hover{background:rgba(179,157,255,.15)}
.muted{color:#8995a0} .bad{color:#ffb0cf} .ok{color:#9be3a0}
h4{margin:0 0 7px;font-size:12px;font-weight:600;color:#cfd7de}
p{margin:0 0 6px}
.start{position:fixed;left:12px;bottom:12px;width:330px;padding:11px 12px 10px;background:rgba(15,19,23,.95);border:1px solid rgba(255,255,255,.1);border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.4)}
.sh{display:flex;align-items:center;gap:8px}
.gcode{font-weight:700;font-size:11.5px;color:#0b1216;background:#ffd166;border-radius:6px;padding:2px 6px}
.gname{color:#fff;font-weight:600}
.tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:9px}
.tile{display:block;text-align:left;background:rgba(255,255,255,.05);border:0;border-radius:9px;padding:7px 9px;color:inherit}
button.tile:hover{background:rgba(255,255,255,.09)}
.tile .n{display:block;font-size:19px;font-weight:700;color:#fff;font-variant-numeric:tabular-nums;line-height:1.15}
.tile .l{display:flex;align-items:center;gap:4px;color:#8995a0;font-size:11px;margin-top:1px;white-space:nowrap}
.tile.miss .n{color:#ff8fbf} .tile.miss.off .n{color:#5c6873}
.keys{display:flex;flex-wrap:wrap;gap:5px 11px;margin-top:9px;color:#8995a0;font-size:11px}
kbd{font:600 10.5px 'Space Grotesk',system-ui,sans-serif;color:#e7ecf0;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-bottom-width:2px;border-radius:5px;padding:0 5px;margin-right:4px}
.card{position:fixed;width:320px;padding:11px 12px;background:rgba(9,13,17,.97);border:1px solid rgba(127,224,240,.4);border-radius:12px;pointer-events:none;box-shadow:0 12px 34px rgba(0,0,0,.55)}
.card .big{font-size:22px;font-weight:700;color:#fff;font-variant-numeric:tabular-nums;line-height:1.1} .card .big .u{font-size:12px;color:#8995a0;margin-left:2px;font-weight:600}
.card .btw{color:#aeb8c1;font-size:11.5px;margin-top:2px}
.bar{display:flex;height:20px;border-radius:5px;overflow:hidden;margin:9px 0 7px;gap:1px}
.bar i{display:flex;align-items:center;justify-content:center;min-width:2px;font:700 10px 'Space Grotesk',system-ui,sans-serif;font-style:normal;color:#0b1014;font-variant-numeric:tabular-nums;overflow:hidden}
.card ol{margin:0;padding:0;list-style:none;display:grid;gap:3px}
.card li{display:grid;grid-template-columns:10px 38px 1fr;gap:7px;align-items:baseline;font-size:11.5px}
.card .sw{width:10px;height:10px;border-radius:3px;align-self:start;margin-top:3px}
.card .n{font-variant-numeric:tabular-nums;text-align:right;color:#fff;font-weight:600}
.card .lb{color:#cfd7de;min-width:0} .card .f{display:block;color:#6f7c87;font-size:10.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card .sum{display:flex;align-items:center;gap:5px;margin-top:6px;font-size:11.5px}
.toast{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);max-width:640px;padding:10px 14px;background:rgba(15,19,23,.98);border:1px solid rgba(255,255,255,.15);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.5)}
.toast ul{margin:6px 0 0;padding-left:18px}
.pop{position:fixed;top:56px;background:rgba(15,19,23,.98);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:10px 12px;display:grid;gap:6px;min-width:240px;max-width:420px;max-height:72vh;overflow:auto;box-shadow:0 14px 40px rgba(0,0,0,.5)}
.pop label{display:flex;gap:8px;align-items:center}
.chips{display:flex;flex-wrap:wrap;gap:4px} .chip{display:inline-flex;align-items:center;gap:3px;padding:1px 4px 1px 7px;border-radius:6px;background:rgba(255,255,255,.07);font-variant-numeric:tabular-nums}
.chip button{padding:0 3px;border:0;background:none;color:#95a1ab}
.note{border-top:1px solid rgba(255,255,255,.07);padding-top:6px}
.ed{position:fixed;width:340px;max-height:calc(100vh - 24px);overflow:auto;padding:11px 12px;background:rgba(9,13,17,.98);border:1px solid rgba(255,90,110,.45);border-radius:12px;box-shadow:0 14px 40px rgba(0,0,0,.6)}
.eh{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.ed .big{font-size:22px;font-weight:700;color:#fff;font-variant-numeric:tabular-nums;line-height:1.1} .ed .big .u{font-size:12px;color:#8995a0;margin-left:2px;font-weight:600}
.ed .btw{color:#aeb8c1;font-size:11.5px;margin-top:2px}
.ed .pc{margin:0 0 8px;padding:0;list-style:none;display:grid;gap:3px}
.ed .pc li{display:grid;grid-template-columns:10px 34px 1fr auto;gap:7px;align-items:baseline;font-size:11.5px}
.ed .sw{width:10px;height:10px;border-radius:3px;align-self:start;margin-top:3px} .ed .n{text-align:right;color:#fff;font-weight:600;font-variant-numeric:tabular-nums} .ed .lb{color:#cfd7de;min-width:0}
.rl{font-size:10.5px;font-weight:600;padding:1px 6px;border-radius:5px;background:rgba(255,255,255,.07);color:#aeb8c1;white-space:nowrap} .rl.set{color:#9be38a} .rl.goes{color:#ff8fbf} .rl.cause{color:#ffc58f}
.wantrow{display:flex;align-items:center;gap:6px;margin-top:8px} .win{width:64px;text-align:center;font-weight:700}
.ed .chips{margin-top:6px}
.fix{display:grid;gap:5px;margin:9px 0} .fr{display:flex;align-items:center;gap:7px;font-size:12px} .fr > span:not(.gc){flex:1;min-width:0} .fr.set{color:#9be38a} .fr.goes{color:#ff8fbf} .fr.warn{color:#ffc58f} .fr.bad{color:#ff8fa3} .fr b{color:#fff} label.fr{cursor:pointer;color:#cfd7de}
.cen{margin-top:10px;padding-top:9px;border-top:1px solid rgba(255,255,255,.08)} .vs{font-variant-numeric:tabular-nums;color:#fff;font-weight:600}
.lc.two{padding:0;cursor:default} .lc.two button{border:0;background:none;color:inherit;font:inherit;padding:3px 7px;border-radius:0;gap:4px} .lc.two .tk{padding:3px 3px 3px 6px} .lc.two button:hover{background:rgba(255,255,255,.1)}
button.gc{border:0;cursor:pointer;font:inherit;font-size:10.5px;font-weight:600} button.gc:hover{background:rgba(255,255,255,.16);color:#fff}
.vl{display:grid;gap:6px;min-width:320px} .vli{display:flex;align-items:center;gap:8px} .vlt{flex:1;min-width:0} .vln{font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .kg.sm{width:24px;height:24px}
.key{display:flex;flex-wrap:wrap;gap:4px 10px;margin-top:8px;color:#8995a0;font-size:11px} .key i{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:4px;vertical-align:middle}
.stl{display:grid;gap:3px;margin:6px 0 2px 56px} .str{justify-content:flex-start;font-size:11.5px;padding:3px 7px;gap:5px;color:#cfd7de} .str b{color:#fff;font-weight:700} .str.pop{display:flex;align-items:center;color:#6f7c87}
.fnd{margin-top:6px} .tools{margin-top:9px} .tl2{padding:4px 8px;font-size:12px;color:#cfd7de} .tl2.on{background:rgba(255,255,255,.14);color:#fff} .stat.on{box-shadow:inset 0 0 0 1px currentColor} button.stat.bad:hover{background:rgba(255,77,109,.25)}
[hidden]{display:none !important}
`;

  let settleT = 0; let guideMode = false; let openLook = null; let host, root, svg, tb, panel, card, toast, start, pop, ed; let inspect = true, alt = false; let hoverEl = null, sel = [], selInfo = []; let looks = [], others = [], ticked = new Set(), showLooks = false, showMembers = null;
  let breakdown = null, lastPt = [0, 0], curGate = 'C1', drawRaf = 0, scrollT = 0, mutT = 0, lastMut = 0, toastT = 0, dragBase = null, flash = null;
  let activeK = null, focusK = null, peekKey = null, noteOpen = false, refocusK = null, missFocus = -1, rdrag = null, showPatch = null, showBuilt = null, showStates = false; const badMap = new Map(), flashes = [], jumpAt = new Map();
  const layers = { miss: true, space: true, sizes: true, columns: false, dividers: false, corners: false };
  try { if (localStorage.getItem('bd-miss') === '0') layers.miss = false; } catch (e) {}
  // the check after every change (a snapshot of the board, then what moved): on by default; off, a 1px change runs nothing but itself
  // (Harkirat, 2026-10-06 15:37 EDT: a 1px change "will launch a test and freeze the board")
  let autoCheck = true; try { if (localStorage.getItem('bd-check') === '0') autoCheck = false; } catch (e) {}
  const snapIf = () => (autoCheck ? C().snap() : null);
  const LAYER_NAMES = { miss: 'Near-misses (pink) · N', space: 'Space inside and between', sizes: 'Sizes', columns: 'Columns', dividers: 'Dividers', corners: 'Nested corners' };
  const cache = { miss: null, cols: null, divs: null, corners: null };
  const board = () => document.getElementById('board');
  const inUI = (e) => !!(e.composedPath && host && e.composedPath().includes(host));
  const isTyping = (e) => { const t = e.composedPath ? e.composedPath()[0] : e.target; return t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable); };
  const chrome = (t) => { if (!t || t.nodeType !== 1 || (t.closest && t.closest('#bd-host'))) return false; const e = t instanceof SVGElement && t.tagName.toLowerCase() !== 'svg' ? t.closest('svg') || t : t; return !M().inStage(e); };

  function mount() {
    host = document.createElement('div'); host.id = 'bd-host'; host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483646';
    document.documentElement.appendChild(host); root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${CSSTEXT}${BD.guides ? BD.guides.CSS : ''}</style><svg class="ov" xmlns="http://www.w3.org/2000/svg"></svg><div class="tb"></div><div class="start"></div><div class="panel" hidden></div><div class="card" hidden></div><div class="toast" hidden></div><div class="pop" hidden></div><div class="ed" hidden></div>`;
    svg = root.querySelector('.ov'); tb = root.querySelector('.tb'); start = root.querySelector('.start'); panel = root.querySelector('.panel'); card = root.querySelector('.card'); toast = root.querySelector('.toast'); pop = root.querySelector('.pop'); ed = root.querySelector('.ed');
    buildToolbar(); bind(); S().onChange(() => { renderPanel(); renderToolbarState(); recompute(); draw(); clearTimeout(settleT); settleT = setTimeout(() => { renderPanel(); draw(); }, 550); }); S().onStatus((s) => { const el = tb.querySelector('.saved'); if (el) el.textContent = s; });
    updateGate(); recompute(); renderStart(); draw();
  }

  // ── toolbar ──
  function buildToolbar() {
    const gates = Object.entries(M().GATE_NAMES).map(([g, n]) => `<option value="${g}">${g} · ${esc(n)}</option>`).join('');
    tb.innerHTML = `<span class="brand">Board 4: Builder</span><select class="gsel" title="Go to a gate">${gates}</select>
      <div class="seg"><button class="m-in on" title="Click to select things (I)">Inspect</button><button class="m-use" title="Use the page as it is (I); hold ⌥ for a moment">Use</button></div>
      <button class="b-layers">Show ${ICON.down}</button><button class="b-vars" title="Every variant you made: open or delete">Variants ${ICON.down}</button><button class="b-lists" title="The values each knob snaps to">Scales ${ICON.down}</button><button class="b-corners" title="Every corner against its height: radius = height × 0.25">Corners ${ICON.down}</button>
      <div class="seg"><button class="v-std on" title="Board 4 with your variants applied">Mine</button><button class="v-b4" title="Board 4 exactly as it was">Original</button></div>
      <button class="b-undo" title="Undo (⌘Z)">${ICON.undo}</button><button class="b-redo" title="Redo (⇧⌘Z)">${ICON.redo}</button>
      <div class="seg"><button class="b-check${autoCheck ? ' on' : ''}" title="After each change, check the whole board for anything it moved or broke (slow on a big board). Click to turn it off; Check at 1282 still runs when you ask">Auto-check</button></div>
      <button class="b-1282" title="Session 5 compares the portal with this board at 1282 × 888: this checks your variants break nothing at that size">Check at 1282 (Session 5)</button>
      <button class="b-notes">Notes</button><span class="saved">${esc(S().status)}</span>`;
    tb.querySelector('.gsel').addEventListener('change', (e) => { curGate = e.target.value; const g = M().gateEl(curGate); if (g) g.scrollIntoView({ block: 'start' }); setTimeout(() => { recompute(); renderStart(); draw(); }, 250); });
    tb.querySelector('.m-in').onclick = () => setInspect(true); tb.querySelector('.m-use').onclick = () => setInspect(false);
    tb.querySelector('.v-std').onclick = () => S().setCompare(false); tb.querySelector('.v-b4').onclick = () => S().setCompare(true);
    tb.querySelector('.b-undo').onclick = () => S().undo(); tb.querySelector('.b-redo').onclick = () => S().redo();
    tb.querySelector('.b-layers').onclick = (e) => openPop(e.currentTarget, layersPop);
    tb.querySelector('.b-lists').onclick = (e) => openPop(e.currentTarget, listsPop);
    tb.querySelector('.b-notes').onclick = (e) => openPop(e.currentTarget, notesPop);
    tb.querySelector('.b-check').onclick = (e) => { autoCheck = !autoCheck; try { localStorage.setItem('bd-check', autoCheck ? '1' : '0'); } catch (x) {} e.currentTarget.classList.toggle('on', autoCheck); say(autoCheck ? 'Auto-check on: each change is checked against the board' : 'Auto-check off: changes are not checked; Check at 1282 still runs'); };
    tb.querySelector('.b-vars').onclick = (e) => openPop(e.currentTarget, varsPop);
    tb.querySelector('.b-corners').onclick = (e) => openPop(e.currentTarget, cornersPop);
    tb.querySelector('.b-1282').onclick = async () => {
      say('Checking at 1282 × 888, the size Session 5 compares the portal at…', true); const r = await C().at1282();
      if (r.via === 'frame') { showProblems(r.problems, 'at 1282 × 888 (Session 5’s size)'); return; }
      const p = r.proof; const diffs = [...p.flips.map((f) => `the kit's rule for ${f}`), ...p.vdiff.map((d) => `${d.sel} (${d.prop}: ${d.val}) is ${d.here}px here and ${d.there}px at 1282 × 888`), ...(p.column ? [] : [`the board column has ${p.room}px at 1282 for a ${p.widest}px gate`])];
      const named = (d) => (/(^|[\s,])\.app\b/.test(d.sel) ? 'the page frame' : /drawer/.test(d.sel) ? 'a drawer' : `the ${(d.sel.match(/\.([\w-]+)/) || [0, 'one'])[1]} box`);
      const hOnly = !p.flips.length && p.column && p.vdiff.length && p.vdiff.every((d) => /height/.test(d.prop) && !/v(w|min|max)/.test(d.val));
      const why = hOnly ? `This view won't open a 1282 frame, so I checked what could differ instead. Nothing on the board depends on the window's width: every kit size rule gives the same answer at 1282, and the ${p.widest}px board fits in the ${p.room}px it has there. Only ${[...new Set(p.vdiff.map(named))].join(' and ')} follow the window's height (${p.vdiff[0].here}px here, ${p.vdiff[0].there}px in an 888px-tall window), and the width doesn't change that. So this result is the 1282 result` : p.same ? `This view won't open a 1282 frame, so I checked what could differ instead: at 1282 × 888 nothing that sizes the board changes (every kit size rule gives the same answer, and the ${p.widest}px board fits in the ${p.room}px it has there). So this result is the 1282 result`
        : `This view won't open a 1282 frame. At 1282 × 888, ${diffs.length} thing${diffs.length > 1 ? 's' : ''} size${diffs.length > 1 ? '' : 's'} differently: ${diffs.slice(0, 3).join('; ')}${diffs.length > 3 ? ` and ${diffs.length - 3} more` : ''}. Everything else lays out the same, so the rest of this result holds at 1282`;
      showProblems(r.problems, null, why);
    };
    renderToolbarState();
  }
  function renderToolbarState() {
    if (!tb) return; tb.querySelector('.m-in').classList.toggle('on', inspect); tb.querySelector('.m-use').classList.toggle('on', !inspect);
    tb.querySelector('.v-std').classList.toggle('on', !S().compare); tb.querySelector('.v-b4').classList.toggle('on', S().compare);
    tb.querySelector('.b-undo').disabled = !S().canUndo; tb.querySelector('.b-redo').disabled = !S().canRedo; tb.querySelector('.gsel').value = curGate;
    tb.querySelector('.b-notes').textContent = `Notes${S().state.notes.length ? ' · ' + S().state.notes.length : ''}`; tb.querySelector('.b-vars').innerHTML = `Variants${S().state.variants.length ? ' · ' + S().state.variants.length : ''} ${ICON.down}`;
  }
  function openPop(btn, render) { if (!pop.hidden && pop._btn === btn) { pop.hidden = true; return; } pop._btn = btn; pop._render = render; pop.innerHTML = render(); const r = btn.getBoundingClientRect(); pop.style.left = Math.max(8, Math.min(innerWidth - 440, r.left)) + 'px'; pop.hidden = false; }
  const refreshPop = () => { if (!pop.hidden && pop._render) pop.innerHTML = pop._render(); };
  // what each colour on the page means: on the start card (the five you meet first) and in full in the Show menu
  const KEYHTML = (keys) => `<div class="key">${[['in', 'space inside'], ['gap', 'space between'], ['size', 'size'], ['corner', 'corner'], ['icon', 'icon'], ['dist', 'space to its neighbour'], ['miss', 'near-miss'], ['look', 'lookalike'], ['bad', "doesn't follow"]].filter(([k]) => !keys || keys.includes(k)).map(([k, w]) => `<span><i style="background:${COL[k]}"></i>${w}</span>`).join('')}</div>`;
  function layersPop() { return Object.entries(LAYER_NAMES).map(([k, n]) => `<label><input type="checkbox" data-layer="${k}" ${layers[k] ? 'checked' : ''}> ${esc(n)}</label>`).join('') + KEYHTML(); }
  // every variant he made, in one place: what it is, how many it holds where, open it (go to its first member and select it) or delete it
  function varsPop() { const V = S().state.variants; if (!V.length) return '<p class="muted">None yet: select a thing, then Make a variant.</p>'; return `<div class="vl">${V.map((v) => { const g = {}; for (const e of S().elsOf(v)) { const k = M().gateOf(e); g[k] = (g[k] || 0) + 1; } return `<div class="vli"><span class="kg sm">${KICON[v.kind] || KICON.box}</span><div class="vlt"><div class="vln">${esc(v.name)}</div><div class="gates"><span class="gc vid">${esc(v.id)}</span>${Object.keys(g).sort().map((k) => `<span class="gc">${k}<b>${g[k]}</b></span>`).join('')}</div></div><button data-vopen="${v.id}" title="Go to it and open its panel">Open</button><button class="ib" data-vdel="${v.id}" title="Delete this variant (⌘Z undoes)">${ICON.x}</button></div>`; }).join('')}</div>`; }
  // Corners, his rule (Harkirat, 2026-10-05 12:07 EDT): radius = height × 0.25, "8 for the 32px, 11 for the 44px because those both fall naturally
  // at the same 0.25 number, keeping the whole number cleanly instead of rounding like the 7.3->7". Every painted control and box on the board,
  // measured on its drawn box: a height that doesn't give a whole number shows the two whole picks; a pill (radius half its height) and a square
  // corner are their own shapes and are left out of the rule. Variants come first and can be set from here.
  const RATIO = 0.25; let cornerRows = [];
  function cornerOf(el) { const T = M().paintTarget(el); if (!T || T.bare) return null; const h = Math.round(T.rect.height * 2) / 2; const r = M().px(getComputedStyle(T.el, T.part === 'self' ? null : T.part).borderTopLeftRadius); return { h, r }; }
  function cornerVerdict(h, r) { if (r < 0.5) return { st: 'square' }; if (r >= h / 2 - 0.5) return { st: 'pill' }; const w = h * RATIO, wi = Math.round(w); if (Math.abs(w - wi) < 0.01) return { st: Math.abs(r - wi) < 0.5 ? 'ok' : 'off', want: wi }; const lo = Math.floor(w), hi = Math.ceil(w); return { st: Math.abs(r - lo) < 0.5 || Math.abs(r - hi) < 0.5 ? 'near' : 'off', want: null, picks: [lo, hi], exact: +w.toFixed(2) }; }
  function cornersPop() {
    cornerRows = []; const inVar = new Set(); const rows = [];
    for (const v of S().state.variants) { if (v.kind !== 'control' && v.kind !== 'box') continue; const els = S().elsOf(v); els.forEach((e) => inVar.add(e)); const c = els[0] && cornerOf(els[0]); if (!c) continue; rows.push({ v, ...c, ...cornerVerdict(c.h, c.r), n: els.length, el: els[0] }); }
    const groups = new Map(); for (const e of M().things(board())) { const k = M().kindOf(e); if ((k !== 'control' && k !== 'box') || inVar.has(e)) continue; const c = cornerOf(e); if (!c || c.r < 0.5) continue; const key = `${c.h}|${c.r}`; if (!groups.has(key)) groups.set(key, { ...c, els: [] }); groups.get(key).els.push(e); }
    const rest = [...groups.values()].map((g) => ({ ...g, ...cornerVerdict(g.h, g.r) })).filter((g) => g.st !== 'pill').sort((a, b) => a.h - b.h || a.r - b.r);
    const mark = (x) => (x.st === 'ok' ? '<span class="ok">✓</span>' : x.st === 'near' ? '<span class="ok">≈</span>' : x.st === 'pill' ? '<span class="muted">pill</span>' : x.st === 'square' ? '<span class="muted">square</span>' : '<span class="bad">off</span>');
    const want = (x) => (x.want != null ? fmt(x.want) : x.picks ? `${x.exact} → ${x.picks.join(' or ')}` : '—');
    const head = '<div class="cr ch"><span>thing</span><span>h</span><span>r</span><span>× 0.25</span><span></span></div>';
    const vrow = (x) => `<div class="cr"><span class="cn" title="${esc(x.v.name)}">${esc(x.v.id)} · ${x.n}</span><span>${fmt(x.h)}</span><span>${fmt(x.r)}</span><span>${want(x)}</span><span>${mark(x)}${x.st === 'off' && x.want != null ? `<button data-cset="${x.v.id}" data-r="${x.want}" title="Set this variant's corners to ${x.want}">Set ${x.want}</button>` : ''}</span></div>`;
    const grow2 = (x) => { const i = cornerRows.push(x.els) - 1; return `<div class="cr"><button class="cn go" data-cgo="${i}" title="Go to them (again for the next)">${esc(M().label(x.els[0]))}${x.els.length > 1 ? ` <b>${x.els.length}</b>` : ''}</button><span>${fmt(x.h)}</span><span>${fmt(x.r)}</span><span>${want(x)}</span><span>${mark(x)}</span></div>`; };
    const off = rest.filter((x) => x.st === 'off').length;
    return `<div class="crs"><p class="muted">radius = height × 0.25, on the drawn box · pills and square corners left out</p>${rows.length ? `<h4>Your variants</h4>${head}${rows.map(vrow).join('')}` : ''}<h4>Everything else · ${off} off</h4>${head}${rest.map(grow2).join('')}</div>`;
  }
  async function copyAll() { const t = JSON.stringify({ state: JSON.parse(S().exportJSON()), measured: MLOG }, null, 1); try { await navigator.clipboard.writeText(t); say('Copied everything the builder holds.'); } catch (e) { openPop(tb.querySelector('.b-notes'), () => `<p>Copy this:</p><textarea style="min-height:220px">${esc(t)}</textarea>`); } }
  function listsPop() {
    const L = S().lists; return Object.entries(S().LIST_NAMES).map(([k, n]) => `<div><h4>${esc(n)}</h4><div class="chips">${(L[k] || []).map((v) => `<span class="chip">${fmt(v)}<button data-list="${k}" data-rm="${v}" title="Remove">${ICON.x}</button></span>`).join('')}<input type="number" step="${k === 'track' ? 0.01 : 1}" data-list="${k}" data-add placeholder="add" style="width:64px"></div></div>`).join('');
  }
  function notesPop() { const N = S().state.notes.slice().reverse(); return '<button data-act="copyall" title="Everything the builder holds, as data">Copy all data for Claude</button>' + (N.length ? N.map((n) => `<div class="note"><div class="muted">${esc(n.gate || '')} · ${esc(n.name || '')}</div><div>${esc(n.text)}</div><button data-note-rm="${n.at}">Remove</button></div>`).join('') : '<p class="muted">No notes yet. Select a thing and write one in its panel; I read them from here.</p>'); }

  function setInspect(on) { inspect = on; hoverEl = null; breakdown = null; renderToolbarState(); draw(); renderStart(); }
  api.ui.setInspect = setInspect; api.ui.select = (els) => select(els); api.ui.panel = () => panel; api.ui.root = () => root;

  // ── events ──
  function bind() {
    for (const t of ['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'dblclick', 'contextmenu', 'auxclick', 'touchstart'])
      // Only his own clicks are caught. A click the kit fires from its own code (a state's script opening the Export picker, a Try row
      // picking three builds) is not his and must reach the kit, or that state never renders in the builder (found 2026-10-03 21:34 EDT:
      // C5's Picker stayed on the landing, so the walk listed elements the builder could never show).
      addEventListener(t, (e) => { if (!e.isTrusted || !inspect || alt || inUI(e) || chrome(e.target)) return; e.preventDefault(); e.stopImmediatePropagation(); if (t === 'click') onPick(e); }, true);
    addEventListener('pointermove', (e) => {
      lastPt = [e.clientX, e.clientY];
      if (!inspect || alt || inUI(e) || chrome(e.target)) { if (hoverEl) { hoverEl = null; breakdown = null; draw(); } return; }
      const el = M().thingOf(e.target, board()); if (el !== hoverEl) setHover(el); else placeCard();
    }, true);
    addEventListener('keydown', onKey, true);
    addEventListener('keyup', (e) => { if (e.key === 'Alt') { alt = false; draw(); } }, true);
    addEventListener('blur', () => { alt = false; });
    addEventListener('scroll', onScroll, true); addEventListener('resize', onScroll);
    new MutationObserver(() => { const now = Date.now(); clearTimeout(mutT); mutT = setTimeout(() => { lastMut = Date.now(); reresolve(); recompute(); renderStart(); draw(); }, now - lastMut > 1000 ? 150 : 900); }).observe(board(), { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'hidden', 'open'] });
    panel.addEventListener('click', onPanelClick); panel.addEventListener('change', onPanelChange); panel.addEventListener('pointerdown', onPanelDown); panel.addEventListener('pointermove', onPanelMove); panel.addEventListener('pointerup', onPanelUp); panel.addEventListener('pointercancel', onPanelUp); panel.addEventListener('keydown', onPanelKey); panel.addEventListener('pointerover', onPanelOver); panel.addEventListener('pointerleave', () => { if (focusK || peekKey) { focusK = null; peekKey = null; draw(); } });
    start.addEventListener('click', (e) => { if (e.target.closest('[data-act="misstoggle"]')) setMiss(!layers.miss); });
    ed.addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (!b || !edit) return; const a = b.dataset.act;
      if (a === 'eclose') closeEditor(); else if (a === 'wup' || a === 'wdn') { edit.want = Math.max(0, edit.want + (a === 'wup' ? 1 : -1)); renderEditor(); } else if (a === 'wset') { edit.want = +b.dataset.v; renderEditor(); }
      else if (a === 'eapply') { const { i, want, trim } = edit; closeEditor(); applyDist(i, want, trim); } else if (a === 'ecentre') { const { i } = edit; closeEditor(); applyCentre(i); } });
    ed.addEventListener('change', (e) => { if (!edit) return; if (e.target.matches('.win')) { edit.want = Math.max(0, Math.round(+e.target.value || 0)); renderEditor(); } else if (e.target.dataset.act === 'etrim') { edit.trim = e.target.checked; renderEditor(); } });
    ed.addEventListener('keydown', (e) => { if (e.key === 'Enter' && edit && e.target.matches('.win')) { e.preventDefault(); edit.want = Math.max(0, Math.round(+e.target.value || 0)); const { i, want, trim } = edit; closeEditor(); applyDist(i, want, trim); } });
    svg.addEventListener('click', (e) => { const g = e.target.closest('[data-di]'); if (g) openEditor(+g.dataset.di, e.clientX, e.clientY); });
    svg.addEventListener('pointerover', (e) => { const g = e.target.closest('[data-mi]'); const i = g ? +g.dataset.mi : -1; if (i !== missFocus) { missFocus = i; draw(); } });
    svg.addEventListener('pointerout', (e) => { if (missFocus < 0) return; const to = e.relatedTarget; if (to && to.closest && to.closest('[data-mi]')) return; missFocus = -1; draw(); });
    pop.addEventListener('change', onPopChange); pop.addEventListener('click', onPopClick); pop.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('[data-add]')) onPopChange(e); });
    toast.addEventListener('click', (e) => { const b = e.target.closest('[data-goto]'); if (b && flash && flash[+b.dataset.goto]) { const el = flash[+b.dataset.goto].el; el.scrollIntoView({ block: 'center' }); setTimeout(() => select([el]), 200); } else if (!e.target.closest('button')) toast.hidden = true; });
    dragPanel();
  }
  function onKey(e) {
    if (e.key === 'Alt') { alt = true; hoverEl = null; breakdown = null; draw(); return; }
    if (inUI(e) && isTyping(e)) return;
    if (inUI(e) && /^Arrow/.test(e.key)) return; // a ruler in the panel steps with the arrows; ↑ must not select the parent then
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.stopImmediatePropagation(); if (e.shiftKey) S().redo(); else S().undo(); return; }
    if (isTyping(e)) return;
    if (e.key.toLowerCase() === 'i' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); e.stopImmediatePropagation(); setInspect(!inspect); return; }
    if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); e.stopImmediatePropagation(); setMiss(!layers.miss); return; }
    if (e.key.toLowerCase() === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey && BD.guides) { e.preventDefault(); e.stopImmediatePropagation(); guideMode = !guideMode; if (guideMode && !inspect) setInspect(true); say(guideMode ? 'Click near any edge to drop a guide · G cancels' : 'No guide dropped'); return; }
    if (!inspect) return;
    if (e.key === 'Escape' && guideMode) { e.preventDefault(); e.stopImmediatePropagation(); guideMode = false; say('No guide dropped'); return; }
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); if (edit) closeEditor(); else if (!pop.hidden) pop.hidden = true; else select([]); return; }
    if (e.key === 'ArrowUp' && sel.length === 1) { e.preventDefault(); e.stopImmediatePropagation(); let p = sel[0].parentElement; while (p && p !== board() && !(M().visible(p) && M().kindOf(p))) p = p.parentElement; if (p && p !== board()) select([p]); }
  }
  function onPick(e) { const t = M().thingOf(e.target, board()); if (!t) return; if (guideMode) { guideMode = false; const side = BD.guides.dropAt(t, e.clientX, e.clientY, curGate); say(`Guide on ${M().label(t)}'s ${side} edge`); renderPanel(); draw(); return; } if (e.shiftKey) select(sel.includes(t) ? sel.filter((x) => x !== t) : [...sel, t]); else select([t]); }
  function onScroll() { if (svg) svg.style.opacity = '0'; card.hidden = true; clearTimeout(scrollT); scrollT = setTimeout(() => { updateGate(); recompute(); renderStart(); svg.style.opacity = '1'; draw(); }, 140); }
  function updateGate() { const mid = innerHeight / 2; for (const [g] of Object.entries(M().GATE_NAMES)) { const el = M().gateEl(g); if (!el) continue; const r = el.getBoundingClientRect(); if (r.top <= mid && r.bottom >= mid) { curGate = g; break; } } renderToolbarState(); }
  function reresolve() { sel = sel.map((el, i) => { if (el.isConnected) return el; const inf = selInfo[i]; try { return inf ? document.querySelectorAll(inf.sel)[inf.idx] || null : null; } catch (e) { return null; } }).filter(Boolean); if (hoverEl && !hoverEl.isConnected) hoverEl = null; }

  function setHover(el) {
    hoverEl = el; breakdown = sel.length === 1 && el && el !== sel[0] && !sel[0].contains(el) && !el.contains(sel[0]) ? M().distance(sel[0], el) : null;
    if (breakdown && !lastPt[0]) { const r = M().seen(el); lastPt = [r.right, r.bottom]; } draw();
  }
  api.ui.hover = (el) => { const r = M().seen(el); lastPt = [r.left + r.width / 2, r.top + r.height / 2]; setHover(el); return breakdown; };

  // ── selection, lookalikes ──
  let sigCache = null, sigEpoch = 0, thCache = null, thEp = '';
  // two tiers: "same" looks alike by measurement and is ticked; "family" is the same thing by name or make-up, built a little differently
  // (History's toolbar is the Armory's with a filter row added), and waits for a tick. Harkirat, 2026-10-03 15:07 EDT: "widen your similarly search"
  function lookalikes(el) {
    // signatures change only when the standard does; things change when the page does, and new ones are signed as they appear
    const ep = S().state.at + (S().compare ? 0.5 : 0); if (!sigCache || sigEpoch !== ep) { sigCache = new Map(); sigEpoch = ep; }
    if (!thCache || thEp !== lastMut + ':' + ep) { thCache = M().things(board()); thEp = lastMut + ':' + ep; }
    const sg = M().signature(el), rl = M().roleOf(el); const out = []; const vSel = S().memberOf(el);
    for (const e of thCache) {
      if (e === el || e.contains(el) || el.contains(e)) continue;
      // a thing already in the selected thing's variant is no lookalike to add: it follows already (Harkirat, 2026-10-05 11:51 EDT: "why is it
      // showing C1 7, C4 6 etc as family when i already have them all selected as part of this variant?")
      if (vSel && S().memberOf(e) === vSel) continue; let s2 = sigCache.get(e); if (!s2) { s2 = { s: M().signature(e), r: M().roleOf(e) }; sigCache.set(e, s2); }
      const why = M().similar(sg, s2.s) ? null : M().family(rl, s2.r) || ((sg.kind === 'control' || sg.kind === 'box') && M().similar(sg, s2.s, { look: true }) ? 'looks alike' : false); const tier = why === null ? 'same' : why ? 'family' : null; if (tier) out.push({ el: e, gate: M().gateOf(e), name: M().nameOf(e), tier, why: why || null });
    }
    return out;
  }
  // the selected thing's role, from the identity table (bd/identity.js) or, marked unreviewed, from the apply map's rule list
  const roleOfEl = (el) => { const R = window.BD_ROLES; if (!R || !el) return null; try { return R.classify(el, M()); } catch (e) { return null; } };
  const roleChip = (el) => { const r = roleOfEl(el); if (!r || !(r.role || r.bucket)) return ''; return `<span class="gc role" title="${esc(r.src || '')}">${esc(r.role || r.bucket)}${r.rule === 'table' ? '' : ' · unreviewed'}</span>`; };
  // a margin on a label that shares its items' box is holding the label's space up (one gap can't set both); removing it moves the items, so
  // it is never offered as a patch to remove (Harkirat, 2026-10-03 21:39 EDT: removing CATEGORY's 4px slid the chips off the search bar)
  function removable(v) {
    const p = patches(v); const holds = []; const boxes = S().elsOf(v).map((el) => M().sharedGap(el)).filter(Boolean);
    const items = p.items.filter((it) => { const held = boxes.some((sg) => { try { return sg.label.matches(it.sel); } catch (x) { return false; } }); if (held) holds.push(it); return !held; });
    return { items, vals: p.vals, holds, shared: boxes };
  }
  // the Family row says why its members are family: same job (row labels, column heads), same words, a shared class, the same parts
  const famWhy = () => { const w = [...new Set(looks.filter((l) => l.tier === 'family' && l.why && !/^same role/.test(l.why)).map((l) => l.why))]; /* the role itself is on the header */ return w.length ? ` · ${w.slice(0, 2).join(', ')}${w.length > 2 ? ' …' : ''}` : ''; };
  function otherStates(el) { const W = window.BD_WALK; if (!W || !W.views) return []; const sg = M().signature(el); const out = []; for (const v of W.views) { const n = v.things.filter((t) => M().similar(sg, t.sig)).length; if (n) out.push({ g: v.g, label: v.label, n, kind: v.kind }); } return out; }
  const MLOG = [];
  function logMeasure(el) { try { M().atRest(); const D = M().inside(el); const r = el.getBoundingClientRect(); MLOG.push({ at: new Date().toISOString(), name: M().label(el), text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40), state: ['hover', 'active', 'focus', 'focus-visible'].filter((s) => el.matches(':' + s)).join(','), dpr: window.devicePixelRatio, scroll: [scrollX, scrollY].map((x) => +x.toFixed(2)), box: [r.left, r.top, r.width, r.height].map((x) => +x.toFixed(2)), inside: D && [D.left, D.right, D.top, D.bottom].map((x) => +x.toFixed(2)), parts: D && D.parts.map((q) => `${q.kind} ${(q.node.nodeValue || '').trim().slice(0, 20)} ${[q.rect.left, q.rect.top, q.rect.width, q.rect.height].map((x) => +x.toFixed(2)).join(',')}`), font: getComputedStyle(el).font }); if (MLOG.length > 30) MLOG.shift(); } catch (e) {} }
  function select(els) {
    M().atRest(); sel = els.filter(Boolean); selInfo = sel.map((el) => { const s = M().selOf(el); let idx = 0; try { idx = [...document.querySelectorAll(s)].indexOf(el); } catch (e) {} return { sel: s, idx }; });
    if (els.length === 1) { const el0 = els[0]; setTimeout(() => logMeasure(el0), 30); setTimeout(() => logMeasure(el0), 700); } // right after the click, and once anything it set off has settled
    openLook = null; looks = sel.length === 1 ? lookalikes(sel[0]) : []; others = sel.length === 1 ? otherStates(sel[0]) : []; ticked = new Set(looks.map((l, i) => (l.tier === 'same' ? i : -1)).filter((i) => i >= 0)); activeK = null; peekKey = null; edit = null; if (ed) ed.hidden = true; showPatch = null; showBuilt = null; showStates = false; showLooks = false; showMembers = null; breakdown = null; pop.hidden = true;
    renderPanel(); renderStart(); draw();
  }
  api.ui.select = select; api.ui.lookalikes = lookalikes; api.ui.otherStates = otherStates; api.ui.patchesOf = (v) => { const r = removable(v); return { items: r.items.map((x) => x.sel), holds: r.holds.map((x) => x.sel), raw: patches(v).items.map((x) => x.sel + ' ' + (x.what || '')) }; };
  api.ui.makeFromSelection = () => makeVariant(); api.ui.setLayer = (k, on) => { layers[k] = on; recompute(); draw(); };
  api.ui.get = () => ({ inspect, sel, hoverEl, breakdown, curGate, layers: { ...layers }, cache, looks, ticked: [...ticked], activeK, focusK, missShown: lastShown.slice() });

  // ── panel: a drawing of the thing with its numbers on it; a number opens its ruler (his list as ticks, Board 4's values as pink dots) ──
  // Harkirat, 2026-10-03 15:07 EDT: "there's so much prose in your pop-up menu; things should be *designed* not stated via text only"
  const gateChips = (list) => { const c = {}; for (const g of list) if (g) c[g] = (c[g] || 0) + 1; return Object.keys(c).sort().map((g) => `<span class="gc">${g}${c[g] > 1 ? `<b>${c[g]}</b>` : ''}</span>`).join(''); };
  const memberChips = (els) => { const c = {}; for (const e of els) { const g = M().gateOf(e); if (g) c[g] = (c[g] || 0) + 1; } return Object.keys(c).sort().map((g) => `<button class="gc" data-act="mjump" data-g="${g}" title="Go to its members on ${g} (again for the next)">${g}<b>${c[g]}</b></button>`).join(''); };
  // a lookalike that only exists in another state: switch that gate there with its own switch (or its Try button), then go to them
  function goState(o) { if (!o || o.kind === 'pop') return; const g = M().gateEl(o.g); if (!g) return; const sg = sel[0] ? M().signature(sel[0]) : null; const btn = [...g.querySelectorAll(o.kind === 'try' ? '.b4-try button' : '.pb-ctl button')].find((x) => x.textContent.trim() === o.label); if (!btn) { say(`Couldn't find “${o.label}” on ${o.g}`); return; } btn.click();
    // a state takes as long as it takes to render (a drawer slides in, a picker loads): look again every 150ms for up to 2s, never once at a fixed delay
    const look = (n) => { const found = sg ? M().things(g).filter((e) => M().similar(sg, M().signature(e))) : []; if (found.length) jumpTo(found, `st|${o.g}|${o.label}`); else if (n > 0) setTimeout(() => look(n - 1), 150); else { g.scrollIntoView({ block: 'start' }); say(`${o.g} is on ${o.label}`); } };
    setTimeout(() => look(12), 200); }
  function jumpTo(els, key) { const L = els.filter((e) => e && e.isConnected); if (!L.length) return; const i = ((jumpAt.has(key) ? jumpAt.get(key) : -1) + 1) % L.length; jumpAt.set(key, i); const el = L[i]; el.scrollIntoView({ block: 'center' }); flashes.push({ el, until: performance.now() + 1800 }); say(`${i + 1} of ${L.length}${L.length > 1 ? ' · click again for the next' : ''}`); setTimeout(() => { updateGate(); recompute(); draw(); }, 60); setTimeout(() => draw(), 1850); }
  const PROP = { height: 'height', padL: 'padding-left', padR: 'padding-right', radius: 'border-top-left-radius', fs: 'font-size', fw: 'font-weight', icon: 'width', gap: 'column-gap', gap2: 'margin-left', gap3: 'margin-left', cw: 'width', ispace: 'width', ctt: 'text-transform', cls: 'letter-spacing', clh: 'line-height', msize: 'width', nfs: 'font-size', nfw: 'font-weight', bh: 'height', bfs: 'font-size', gap4: 'margin-left', lw: 'width', edge: 'border-top-width', lh: 'line-height', ls: 'letter-spacing', tt: 'text-transform', size: 'width', padY: 'padding-top', padX: 'padding-left', padT: 'padding-top', padB: 'padding-bottom', maxw: 'max-width', s1: 'margin-left', s2: 'margin-left', s3: 'margin-left', s4: 'margin-left', s5: 'margin-left', s6: 'margin-left', align: 'align-items', thick: 'height' };
  function whereRes(el, kn) {
    const prop = PROP[kn.k]; if (!prop || !Y()) return null; let target = el, pe = ''; const vb = M().visibleBox(el);
    if ((kn.k === 'radius' || kn.k === 'edge' || kn.k === 'height') && vb && vb.part !== 'self') pe = vb.part;
    if (kn.k === 'icon') target = el.querySelector('svg') || el;
    if ((kn.k === 'fs' || kn.k === 'fw') && M().kindOf(el) === 'control') target = textEl(el) || el;
    try { return Y().of(target, pe && kn.k === 'height' ? 'height' : prop, pe); } catch (e) { return null; }
  }
  function whereChips(el, kn) {
    const res = whereRes(el, kn); if (!res) return ''; const ch = []; let t = '', full = ''; try { t = Y().short(res) || ''; } catch (e) {} try { full = Y().text(res) || ''; } catch (e) {}
    const ru = res.rule || {}; const at = ru.file ? `${String(ru.file).split('/').pop()}${ru.line != null ? ':' + ru.line : ''}` : ''; const sl = ru.sel || ru.s || ru.selector || '';
    if (at) ch.push(`<span class="fchip" title="${esc(full)}">${esc(at)}</span>`); if (sl) ch.push(`<span class="fchip" title="${esc(sl)}">${esc(sl.length > 30 ? sl.slice(0, 29) + '…' : sl)}</span>`);
    if (t && (!at || !t.includes(at))) ch.push(`<span class="fchip" title="${esc(full || t)}">${esc(t.length > 38 ? t.slice(0, 37) + '…' : t)}</span>`);
    return ch.length ? `<div class="from" title="Where this value comes from">${ICON.file}${ch.join('')}</div>` : '';
  }
  let dVals = {}, dKnobs = [];
  function numG(k, x, y, t, cap) {
    if (dVals[k] == null) return ''; const txt = t != null ? String(t) : fmt(dVals[k]); const w = txt.length * 6.4 + 12; const on = activeK === k; const c = KCOL[k] || '#cfd7de'; const kn = dKnobs.find((z) => z.k === k);
    return `<g class="num${on ? ' on' : ''}" data-k="${k}"><title>${esc(kn ? kn.label : k)}</title>${cap ? `<text class="cap" x="${x}" y="${y - 13}" text-anchor="middle">${esc(cap)}</text>` : ''}<rect x="${x - w / 2}" y="${y - 9}" width="${w}" height="18" rx="5" fill="${on ? c : tint(c, 0.15)}" stroke="${c}" stroke-opacity="${on ? 0 : 0.65}"/><text x="${x}" y="${y + 4}" text-anchor="middle" fill="${on ? '#0b1014' : c}">${esc(txt)}</text></g>`;
  }
  // the thing drawn as a diagram, each number where it applies; a click on a number opens its ruler below
  function diagram(kind, vals, act, knobs) {
    dVals = vals; dKnobs = knobs; let s = '', H = 150; const blk = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="rgba(255,255,255,.07)" stroke="rgba(255,255,255,.22)"/>`;
    if (kind === 'layout' || kind === 'box') {
      H = 170; const o = { x: 10, y: 10, w: 296, h: 150 }, p = 30, r = Math.min(+vals.radius || 0, 18); const ix = o.x + p, iy = o.y + p, iw = o.w - 2 * p, ih = o.h - 2 * p; let gp = null; const slots = [];
      s += `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" rx="${r}" fill="${tint(COL.in, 0.16)}" stroke="rgba(255,255,255,.4)"/><rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="#11171c"/>`;
      const ns = [1, 2, 3, 4, 5, 6].filter((i) => vals['s' + i] != null).length; // its gaps, one setting per pair of items (Harkirat, 2026-10-06 10:58 EDT)
      if (ns) { const vert = act.axis === 'y', x0 = ix + 8, y0 = iy + 8, W = iw - 16, Hh = ih - 16, g = vert ? Math.min(16, Hh / (2 * ns + 1)) : Math.min(24, W / (2 * ns + 1)); const bw = vert ? W : (W - ns * g) / (ns + 1), bh = vert ? (Hh - ns * g) / (ns + 1) : Hh;
        for (let i = 0; i <= ns; i++) { const x = vert ? x0 : x0 + i * (bw + g), y = vert ? y0 + i * (bh + g) : y0; s += blk(x, y, bw, bh); if (i < ns) { const gx = vert ? x0 : x + bw, gy = vert ? y + bh : y0; s += `<rect x="${gx}" y="${gy}" width="${vert ? W : g}" height="${vert ? g : Hh}" fill="${tint(COL.gap, 0.32)}"/>`; slots.push([vert ? x0 + W / 2 : gx + g / 2, vert ? gy + g / 2 : y0 + Hh / 2]); } } }
      else if (vals.gap == null) s += blk(ix + 8, iy + 8, iw - 16, ih - 16);
      else if (act.axis === 'y') { const g = 22, bh = (ih - 16 - g) / 2, x = ix + 8, w = iw - 16, y1 = iy + 8; s += blk(x, y1, w, bh) + `<rect x="${x}" y="${y1 + bh}" width="${w}" height="${g}" fill="${tint(COL.gap, 0.32)}"/>` + blk(x, y1 + bh + g, w, bh); gp = [ix + iw / 2, y1 + bh + g / 2]; }
      else { const g = 36, bw = (iw - 16 - g) / 2, y = iy + 8, h = ih - 16, x1 = ix + 8; s += blk(x1, y, bw, h) + `<rect x="${x1 + bw}" y="${y}" width="${g}" height="${h}" fill="${tint(COL.gap, 0.32)}"/>` + blk(x1 + bw + g, y, bw, h); gp = [x1 + bw + g / 2, y + h / 2]; }
      if (r > 1) s += `<path d="M${o.x} ${o.y + r}A${r} ${r} 0 0 1 ${o.x + r} ${o.y}" stroke="${COL.corner}" stroke-width="2.5" fill="none"/>`;
      s += numG('padT', o.x + o.w / 2, o.y + p / 2) + numG('padB', o.x + o.w / 2, o.y + o.h - p / 2) + numG('padL', o.x + p / 2, o.y + o.h / 2) + numG('padR', o.x + o.w - p / 2, o.y + o.h / 2) + slots.map((q, i) => numG('s' + (i + 1), q[0], q[1])).join('') + (gp ? numG('gap', gp[0], gp[1]) : '') + numG('radius', o.x + 26, o.y + p / 2);
    } else if (kind === 'control') {
      // the selected thing's own pieces in their order (a dot, words, a count; an icon and words), each gap a block that touches both of its
      // neighbours, numbered with its drawn value; the first gap is the knob (Harkirat, 2026-10-05 11:55 EDT: the sketch's gap touched the icon and
      // not the label; 12:19 EDT: a chip's dot is its icon, and the gap knob only showed when the first part was an svg)
      const o = { x: 26, y: 48, w: 238, h: 62 }, r = Math.min((+vals.radius || 0) * 1.4, o.h / 2), edge = +vals.edge || 0; const cy = o.y + o.h / 2;
      s += `<defs><clipPath id="bd-cc"><rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" rx="${r}"/></clipPath></defs><rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" rx="${r}" fill="rgba(255,255,255,.06)"/>`;
      s += `<g clip-path="url(#bd-cc)"><rect x="${o.x}" y="${o.y}" width="34" height="${o.h}" fill="${tint(COL.in, 0.3)}"/><rect x="${o.x + o.w - 34}" y="${o.y}" width="34" height="${o.h}" fill="${tint(COL.in, 0.3)}"/></g>`;
      const el0 = sel[0]; const Dd = el0 && M().inside && M().descends && M().descends() ? M().inside(el0) : null; const Gd = Dd ? M().gaps(el0, Dd) : [];
      let P = Dd ? Dd.parts.map((p) => ({ kind: p.kind, t: p.kind === 'words' || p.kind === 'count' ? ((p.node.nodeType === 3 ? p.node.nodeValue : p.node.value || p.node.placeholder || '') || '').trim() : p.kind === 'badge' ? (p.node.textContent || '').trim() : '' })) : [{ kind: vals.icon != null ? 'icon' : 'none' }, { kind: 'words', t: 'Label' }];
      P = P.filter((p) => p.kind !== 'none').slice(0, 4); if (!P.some((p) => p.kind === 'words')) P.push({ kind: 'words', t: 'Label' });
      const GW = 16, F = `font:${+vals.fw || 500} 17px 'Space Grotesk',system-ui,sans-serif`; const wOf = (p) => (p.kind === 'count' ? Math.max(10, (p.t || '0').length * 9.6) : p.kind === 'words' ? Math.min(96, Math.max(10, (p.t || 'Label').slice(0, 9).length * 9.6)) : p.kind === 'badge' ? 22 : p.kind === 'mark' ? 12 : 22);
      const pieceNums = {}, pieceNumAt = []; let tx = o.x + 44; const span = P.reduce((n, p) => n + wOf(p), 0) + GW * (P.length - 1); if (tx + span > o.x + o.w - 40) tx = Math.max(o.x + 36, o.x + o.w - 40 - span); let iconX = null; const gapAt = [];
      P.forEach((p, i) => {
        if (i) { s += `<rect x="${tx}" y="${o.y + 14}" width="${GW}" height="${o.h - 28}" fill="${tint(COL.gap, 0.4)}"/>`; gapAt.push(tx + GW / 2); tx += GW; }
        const w = wOf(p);
        if (p.kind === 'words' || p.kind === 'count') { s += `<text x="${tx}" y="${cy + 6}" fill="#f2f4f6" style="${F}">${esc((p.t || 'Label').length > 9 ? p.t.slice(0, 8) + '…' : p.t || 'Label')}</text>`; if (p.kind === 'count' && vals.nfs != null && !pieceNums.count) { pieceNums.count = 1; pieceNumAt.push(['nfs', tx + w / 2]); } }
        else if (p.kind === 'mark') { s += `<circle cx="${tx + w / 2}" cy="${cy}" r="${w / 2}" fill="${tint(COL.icon, 0.35)}" stroke="${COL.icon}"/>`; if (vals.msize != null && !pieceNums.mark) { pieceNums.mark = 1; pieceNumAt.push(['msize', tx + w / 2]); } }
        else if (p.kind === 'badge') s += `<rect x="${tx}" y="${cy - 10}" width="${w}" height="20" rx="6" fill="${tint(COL.icon, 0.18)}" stroke="${COL.icon}"/><text x="${tx + w / 2}" y="${cy + 4}" text-anchor="middle" fill="#f2f4f6" style="font:600 11px system-ui">${esc((p.t || '').slice(0, 3))}</text>`;
        else { s += `<rect x="${tx}" y="${cy - 12}" width="24" height="24" rx="5" fill="${tint(COL.icon, 0.25)}" stroke="${COL.icon}"/>`; if (iconX == null) iconX = tx + 12; }
        tx += w;
      });
      s += `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" rx="${r}" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="${edge > 0 ? 1.5 : 1}"${edge > 0 ? '' : ' stroke-dasharray="3 3"'}/>`;
      if (r > 1) s += `<path d="M${o.x} ${o.y + r}A${r} ${r} 0 0 1 ${o.x + r} ${o.y}" stroke="${COL.corner}" stroke-width="2.5" fill="none"/>`;
      const hx = o.x + o.w + 18; s += `<path d="M${hx - 4} ${o.y}h8M${hx} ${o.y}v${o.h}M${hx - 4} ${o.y + o.h}h8" stroke="${COL.size}" fill="none"/>`;
      s += numG('height', hx, o.y + o.h / 2) + numG('radius', o.x + 6, o.y - 14) + numG('padL', o.x + 17, o.y + o.h + 19) + numG('padR', o.x + o.w - 17, o.y + o.h + 19) + numG('edge', o.x + o.w - 72, o.y + o.h);
      if (Dd) { const lab = (x, y, v, k) => `<text x="${x}" y="${y}" text-anchor="middle" fill="${tint(COL.in, 0.95)}" style="font:600 11px system-ui">${r1(v)}</text>`; if (vals.padL == null) s += lab(o.x + 17, o.y + o.h + 23, Dd.left); if (vals.padR == null) s += lab(o.x + o.w - 17, o.y + o.h + 23, Dd.right); s += lab(o.x + o.w / 2, o.y + 11, Dd.top) + lab(o.x + o.w / 2, o.y + o.h - 3, Dd.bottom); }
      if (vals.icon != null && iconX != null) s += numG('icon', iconX, o.y - 14);
      for (const [k, x] of pieceNumAt) s += numG(k, x, o.y - 14);
      const gkOf = (a, b) => (/icon|mark/.test(a) && /words/.test(b) ? 'gap' : /words/.test(a) && /count|badge/.test(b) ? 'gap2' : /words|count/.test(a) && /icon|mark/.test(b) ? 'gap3' : 'gap4');
      gapAt.forEach((x, i) => { const gk = gkOf(P[i].kind, P[i + 1].kind); if (gk && vals[gk] != null) s += numG(gk, x, o.y + o.h + 19); else if (Gd[i]) { const v = r1(Gd[i].px), off = Gd[0] && Math.abs(Gd[i].px - Gd[0].px) >= 0.5; s += `<text x="${x}" y="${o.y + o.h + 23}" text-anchor="middle" fill="${off ? '#ff6fae' : '#8995a0'}" style="font:600 11px system-ui">${v}</text>`; } });
      const wx = o.x + 44 + (P[0] && P[0].kind !== 'words' ? wOf(P[0]) + GW : 0); s += numG('fs', wx + 26, o.y - 14, null, 'size') + numG('fw', wx + 70, o.y - 14, null, 'weight');
    } else if (kind === 'text') {
      H = 148; const base = 86, size = 56, smp = vals.tt === 'uppercase' ? 'AG' : 'Ag', cap = base - size * 0.7, ls = Math.max(-3, Math.min(10, (+vals.ls || 0) * 4));
      s += `<line x1="44" y1="${base}" x2="272" y2="${base}" stroke="rgba(255,255,255,.2)" stroke-dasharray="3 3"/><text x="58" y="${base}" fill="#f2f4f6" style="font:${+vals.fw || 400} ${size}px 'Space Grotesk',system-ui,sans-serif;letter-spacing:${ls}px">${smp}</text>`;
      s += `<path d="M36 ${cap}h8M40 ${cap}v${base - cap}M36 ${base}h8" stroke="${COL.text}" fill="none"/>` + numG('fs', 18, (cap + base) / 2, null, 'size');
      if (vals.lh != null) { const lt = base - size * 0.92, lb = base + size * 0.26; s += `<path d="M196 ${lt}h8M200 ${lt}v${lb - lt}M196 ${lb}h8" stroke="${tint(COL.text, 0.55)}" fill="none"/>` + numG('lh', 234, (lt + lb) / 2, null, 'line'); }
      s += `<path d="M58 ${base + 14}h112M58 ${base + 10}v8M170 ${base + 10}v8" stroke="${tint(COL.text, 0.4)}" fill="none"/>` + numG('ls', 114, base + 40, null, 'spacing') + numG('fw', 268, base + 40, null, 'weight');
    } else if (kind === 'icon') {
      H = 124; const z = 64, x = 126, y = 18; s += `<rect x="${x}" y="${y}" width="${z}" height="${z}" rx="10" fill="${tint(COL.icon, 0.14)}" stroke="${COL.icon}" stroke-dasharray="3 3"/><circle cx="${x + z / 2}" cy="${y + z / 2}" r="17" fill="none" stroke="${COL.icon}" stroke-width="3"/><path d="M${x} ${y + z + 10}h${z}M${x} ${y + z + 6}v8M${x + z} ${y + z + 6}v8" stroke="${COL.icon}" fill="none"/>` + numG('size', x + z / 2, y + z + 24);
    } else if (kind === 'divider') {
      H = 84; s += `<line x1="30" y1="34" x2="286" y2="34" stroke="${COL.size}" stroke-width="${Math.max(1, Math.min(6, (+vals.thick || 1) * 2))}"/>` + numG('thick', 158, 60);
    }
    return `<svg class="dia" viewBox="0 0 316 ${H}" role="img" aria-label="Its values">${s}</svg>`;
  }
  const RX0 = 16, RX1 = 300;
  function posOf(L, x) { const n = L.length; if (n < 2) return (RX0 + RX1) / 2; if (x <= L[0]) return RX0; if (x >= L[n - 1]) return RX1; let i = 0; while (i < n - 2 && L[i + 1] < x) i++; const f = (x - L[i]) / (L[i + 1] - L[i] || 1); return RX0 + ((i + f) / (n - 1)) * (RX1 - RX0); }
  function valAt(L, p, snap, frac) { const n = L.length; if (!n) return null; if (n < 2) return L[0]; const t = Math.max(0, Math.min(1, (p - RX0) / (RX1 - RX0))) * (n - 1); if (snap) return L[Math.round(t)]; const i = Math.min(n - 2, Math.floor(t)); const x = L[i] + (L[i + 1] - L[i]) * (t - i); return frac ? Math.round(x * 2) / 2 : Math.round(x); }
  // the ruler runs past his scale's end whenever a value needs it: two more steps beyond the larger of the scale's end and the value, so dragging
  // to the end reaches further each time, and a typed value outside the scale gets its own tick (Harkirat, 2026-10-05 13:59 EDT: "what if i want
  // to extend it past 64?? why can't i custom set the number?"); any number can be typed in the knob's own field
  function rulerList(kn, x) { const L = (S().lists[kn.list] || []).filter((y) => kn.list !== 'icon' || y <= 48 || y === x); if (L.length < 2) return L; const st = L[L.length - 1] - L[L.length - 2] || 1; const top = Math.max(L[L.length - 1], typeof x === 'number' ? x : -Infinity) + 2 * st; while (L[L.length - 1] < top - 1e-9) L.push(+(L[L.length - 1] + st).toFixed(2)); if (typeof x === 'number' && !L.some((y) => Math.abs(y - x) < 1e-9)) { L.push(x); L.sort((a, b) => a - b); } return L; }
  // the ruler: his list as ticks, what Board 4 had as pink dots (bigger where more of them had it), the value as a handle to drag
  function rulerHTML(kn, val, own, dots, live, word) {
    const L = rulerList(kn, val); if (!L.length || typeof val !== 'number') return ''; const c = KCOL[kn.k] || COL.sel; const n = L.length; const sp = n > 1 ? (RX1 - RX0) / (n - 1) : 99; const step = sp >= 15 ? 1 : sp >= 7.5 ? 2 : Math.ceil(15 / sp);
    let s = `<line x1="${RX0}" y1="34" x2="${RX1}" y2="34" stroke="rgba(255,255,255,.2)" stroke-width="2" stroke-linecap="round"/>`;
    L.forEach((x, i) => { const p = posOf(L, x); s += `<line x1="${p}" y1="30" x2="${p}" y2="38" stroke="rgba(255,255,255,.32)"/>`; if ((n - 1 - i) % step === 0) s += `<text class="tk" x="${p}" y="52" text-anchor="middle">${fmt(x)}</text>`; });
    for (const [x, m] of dots) s += `<circle cx="${posOf(L, x)}" cy="21" r="${Math.min(5, 2.4 + m * 0.5)}" fill="${COL.miss}" fill-opacity=".9"><title>${esc(word)} ${fmt(x)}${kn.unit}${m > 1 ? ' ×' + m : ''}</title></circle>`;
    const hp = posOf(L, val), vt = fmt(val) + kn.unit, vw = vt.length * 6.6 + 12;
    s += `<rect class="hv" x="${hp - vw / 2}" y="0" width="${vw}" height="15" rx="4" fill="${c}"/><text class="hvt" x="${hp}" y="11" text-anchor="middle" fill="#0b1014" style="font-weight:700;font-size:10.5px">${esc(vt)}</text><circle class="hc" cx="${hp}" cy="34" r="7" fill="${live ? c : '#0f1317'}" stroke="${c}" stroke-width="2"${own ? ' stroke-dasharray="3 2"' : ''}/>`;
    return `<svg class="ruler${live ? ' live' : ''}" data-ruler="${kn.k}" viewBox="0 0 316 58"${live ? ` tabindex="0" role="slider" aria-label="${esc(kn.label)}" aria-valuenow="${val}"` : ''}>${s}</svg>`;
  }
  function paintRuler(r, L, val, kn) { const p = posOf(L, val), vt = fmt(val) + kn.unit, vw = vt.length * 6.6 + 12; const hv = r.querySelector('.hv'), ht = r.querySelector('.hvt'), hc = r.querySelector('.hc'); if (hv) { hv.setAttribute('x', p - vw / 2); hv.setAttribute('width', vw); } if (ht) { ht.setAttribute('x', p); ht.textContent = vt; } if (hc) hc.setAttribute('cx', p); r.setAttribute('aria-valuenow', val); }
  function rulerSet(r, clientX) {
    const v = S().memberOf(sel[0]); if (!v) return; const k = r.dataset.ruler; const kn = (S().KNOBS[v.kind] || []).find((x) => x.k === k); if (!kn) return; const L = rulerList(kn, v.values[k]);
    const b = r.getBoundingClientRect(); const val = valAt(L, ((clientX - b.left) / b.width) * 316, !v.own[k], kn.list === 'track'); if (val == null || val === v.values[k]) return;
    S().setValue(v.id, k, val); paintRuler(r, L, val, kn); for (const t of panel.querySelectorAll(`.dia .num[data-k="${k}"] text:last-of-type`)) t.textContent = fmt(val); draw();
  }
  function knobArea(kn, val, v, el) {
    const c = KCOL[kn.k] || COL.sel, own = v ? !!v.own[kn.k] : false; let body = '';
    if (kn.options) body = `<div class="ico-seg">${kn.options.map((o) => `<button data-act="opt" data-val="${esc(o)}" class="${o === val ? 'on' : ''}"${v ? '' : ' disabled'} title="${esc(o)}">${(OLAB[kn.k] && OLAB[kn.k][o]) || OPTICON[o] || esc(o)}</button>`).join('')}</div>`;
    else {
      const dots = new Map(); const src = v ? v.orig[kn.k] || [] : [val, ...looks.filter((l) => l.tier === 'same').map((l) => { try { return kn.read(l.el); } catch (e) { return null; } })];
      for (const x of src) if (typeof x === 'number' && Number.isFinite(x)) { const q = Math.round(x * 2) / 2; dots.set(q, (dots.get(q) || 0) + 1); }
      body = rulerHTML(kn, val, own, [...dots], !!v, v ? 'Board 4 had' : 'This and its lookalikes have');
    }
    return `<div class="knob" data-k="${kn.k}"><div class="kh"><span class="dot" style="background:${c}"></span><span class="kname">${esc(kn.capOf && kn.capOf(el) ? kn.capOf(el).replace(/^./, (x) => x.toUpperCase()) : kn.label)}</span>${v && !kn.options && typeof val === 'number' ? `<input class="kin" type="number" inputmode="decimal" step="${kn.list === 'track' ? 0.01 : 1}" value="${fmt(val)}" data-act="kin" data-k="${kn.k}" title="Type any value" aria-label="${esc(kn.label)}">` : ''}${v && !kn.options ? `<button class="tl2${own ? '' : ' on'}" data-act="snap" title="${own ? 'Takes any value: click to snap to your scale' : 'Snaps to your scale: click to allow any value'}">${ICON.magnet}${own ? 'any value' : 'on your scale'}</button>` : ''}</div>${body}${v ? '' : whereChips(el, kn)}</div>`;
  }
  const KCAP = { align: 'line up', tt: 'capitals', trim: 'letters box', w: 'width', ta: 'words', iin: 'before icon', iout: 'icon to words', gap: 'icon → words', gap2: 'words → count', gap3: 'words → icon', cw: 'width', ispace: 'around icon', ctt: 'capitals', cls: 'spacing', clh: 'line', msize: 'dot', nfs: 'count size', nfw: 'count weight', bh: 'badge height', bfs: 'badge text', gap4: 'other gap', lw: 'width', maxw: 'max width', s1: 'gap 1', s2: 'gap 2', s3: 'gap 3', s4: 'gap 4', s5: 'gap 5', s6: 'gap 6' };
  const OLAB = { trim: { normal: '<span class="tx">line</span>', 'trim-both cap alphabetic': '<span class="tx">letters</span>' } };
  const DRAWN = new Set(['padY', 'padX', 'padT', 'padB', 's1', 's2', 's3', 's4', 's5', 's6', 'gap', 'radius', 'height', 'padL', 'padR', 'edge', 'icon', 'fs', 'fw', 'lh', 'ls', 'size', 'thick']);
  function actualPad(el) { const c = getComputedStyle(el); return { t: M().px(c.paddingTop), r: M().px(c.paddingRight), b: M().px(c.paddingBottom), l: M().px(c.paddingLeft), axis: S().axisOf(el) }; }
  const titleOf = (el, kind) => (kind === 'layout' || kind === 'box' ? M().classesOf(el)[0] || el.tagName.toLowerCase() : M().nameOf(el));
  function renderPanel() {
    M().atRest(); // read the page at rest, never mid-press (bd/measure.js atRest)
    // a lookalike that has since joined the variant (made from the selection, or added) leaves the list and the Add count
    if (sel.length === 1 && looks.length) { const v0 = S().memberOf(sel[0]); if (v0) { const keep = looks.map((l, i) => ({ l, on: ticked.has(i) })).filter(({ l }) => S().memberOf(l.el) !== v0); if (keep.length !== looks.length) { looks = keep.map((x) => x.l); ticked = new Set(keep.map((x, i) => (x.on ? i : -1)).filter((i) => i >= 0)); } } }
    if (!panel) return; if (!sel.length) { panel.hidden = true; badMap.clear(); return; } panel.hidden = false;
    const el = sel[0]; const v = S().memberOf(el); const kind = (v && v.kind) || M().kindOf(el) || 'box'; const knobs = S().KNOBS[kind] || [];
    const vals = {}; for (const kn of knobs) { let x = v ? v.values[kn.k] : null; if (x == null || x === '') { try { x = kn.read(el); } catch (e) { x = null; } } if (x != null && x !== '' && !(typeof x === 'number' && !Number.isFinite(x))) vals[kn.k] = typeof x === 'number' ? +x.toFixed(2) : x; }
    if (!activeK || vals[activeK] == null) activeK = (knobs.find((k) => vals[k.k] != null) || {}).k || null;
    const act = actualPad(el); for (const [k, sd] of [['padT', 't'], ['padB', 'b'], ['padL', 'l'], ['padR', 'r']]) if (typeof vals[k] === 'number') act[sd] = vals[k]; if (v) act.axis = v.axis || act.axis;
    const els = v ? S().elsOf(v) : []; const bad = v ? S().selfCheck(v.id) : []; badMap.clear(); for (const b of bad) { if (!badMap.has(b.el)) badMap.set(b.el, []); badMap.get(b.el).push(`${b.label}: wants ${fmt(b.want)}, shows ${fmt(b.got)} (${b.why})`); }
    const h = [];
    h.push(`<div class="ph"><span class="kg" title="${esc(S().KIND_NAME[kind] || kind)}">${KICON[kind] || KICON.box}</span><div class="ttl">${v ? `<input type="text" class="vname" data-act="rename" value="${esc(v.name)}" aria-label="Variant name">` : `<div class="title">${esc(sel.length > 1 ? `${sel.length} selected` : titleOf(el, kind))}</div>`}<div class="gates">${v ? `<span class="gc vid">${esc(v.id)}</span>` : ''}${v ? memberChips(els) : gateChips(sel.map((e) => M().gateOf(e)))}${!v && sel.length === 1 ? roleChip(el) : ''}</div></div><button class="ib" data-act="home" title="Back to the selected thing">${ICON.target}</button><button class="ib${noteOpen ? ' on' : ''}" data-act="notetoggle" title="A note for Claude">${ICON.note}</button><button class="ib" data-act="close" title="Close (Esc)">${ICON.x}</button></div>`);
    if (noteOpen) h.push(`<div class="sec"><textarea data-act="notetext" placeholder="What's wrong here, or what you want"></textarea><div class="acts" style="margin-top:6px"><span class="sp"></span><button data-act="note">${ICON.plus}Add note</button></div></div>`);
    if (sel.length === 1) {
      const kn = knobs.find((k) => k.k === activeK); const lay0 = kind === 'layout' || kind === 'box', ns0 = lay0 && vals.s1 != null; const extra = knobs.filter((k) => (!DRAWN.has(k.k) || (ns0 && k.k === 'gap')) && vals[k.k] != null);
      h.push(`<div class="sec">${diagram(kind, vals, act, knobs)}${extra.length ? `<div class="kx">${extra.map((k) => `<button class="kchip num${activeK === k.k ? ' on' : ''}" data-k="${k.k}" title="${esc(k.label)}"${activeK === k.k ? '' : ` style="color:${KCOL[k.k] || '#cfd7de'}"`}><span class="kcap">${esc((lay0 && k.k === 'gap' ? 'all gaps' : (k.capOf && k.capOf(el)) || KCAP[k.k]) || k.label)}</span>${(OLAB[k.k] && OLAB[k.k][vals[k.k]]) || OPTICON[vals[k.k]] || esc(fmt(vals[k.k]))}</button>`).join('')}</div>` : ''}${kn ? knobArea(kn, vals[kn.k], v, el) : ''}</div>`);
    }
    if (sel.length === 1 && BD.guides) { try { h.push(BD.guides.panelHTML(el, curGate)); } catch (err) { console.error(err); } }
    if (v) {
      const lay = v.kind === 'layout' || v.kind === 'box'; const p = lay ? removable(v) : { items: [], vals: [], holds: [], shared: [] }; const f = lay ? findings(v) : ''; const nb = new Set(bad.map((b) => b.el)).size;
      h.push(`<div class="sec"><div class="acts">${nb ? `<button class="stat bad" data-act="jbad" title="${esc([...new Set(bad.map((b) => `${b.label}: ${b.why}`))].join('\n'))}">${ICON.warn}${nb} of ${els.length} don't follow${ICON.go}</button>` : `<span class="stat ok" title="Every member shows these values">${ICON.check}all ${els.length} follow it</span>`}</div>${p.items.length ? `<div class="acts fnd"><button class="stat warn${showPatch === v.id ? ' on' : ''}" data-act="showpatch" title="${esc(`${p.items.length} item${p.items.length > 1 ? 's' : ''} inside carry their own margins (${p.vals.join(', ')}) on top of the space between: click to see them on the page`)}">${ICON.patch}${p.items.length} extra margin${p.items.length > 1 ? 's' : ''}</button><button data-act="clear" title="Set those margins to 0 everywhere (⌘Z undoes)">Remove them</button></div>` : ''}${p.shared.length ? `<div class="acts fnd"><span class="stat warn" title="${esc(`${M().label(p.shared[0].label)} sits in the same box as its ${p.shared[0].items.length} items, so one gap sets both the space after it and the space between them; they can differ only through a margin on the label${p.holds.length ? ' (kept, not offered for removal)' : ''}. The fix is a box of its own for the items: a kit change.`)}">${ICON.split}label shares the box</span></div>` : ''}${f ? `<div class="acts fnd"><button class="stat warn${showBuilt === v.id ? ' on' : ''}" data-act="showbuilt" title="${esc(f + ': click to number each member by its build on the page. The markup is Session 5’s to fix.')}">${ICON.split}built ${(f.match(/^\d+/) || ['?'])[0]} ways</button></div>` : ''}<div class="acts tools"><button class="tl2${showMembers === v.id ? ' on' : ''}" data-act="members">${ICON.eye}Outline all</button><button class="tl2" data-act="back" title="Back to Board 4’s values (⌘Z undoes)">${ICON.reset}Original values</button><button class="tl2" data-act="out" title="Take this one out of the variant">${ICON.minus}Remove this one</button></div></div>`);
    }
    if (sel.length === 1) {
      const nt = looks.filter((_, i) => ticked.has(i)).length; const same = S().state.variants.filter((x) => (x.kind === kind || x.look) && x !== v); if (v) h.push(lookSec(v)); /* quick select: a group with a look takes any kind of element */
      const tierRow = (t, name) => { const g = {}; looks.forEach((l, i) => { if (l.tier === t) (g[l.gate] = g[l.gate] || []).push(i); }); const keys = Object.keys(g).sort();
        return `<div class="tier"><span class="tl">${name}</span>${keys.length ? keys.map((gg) => { const ix = g[gg]; const on = ix.filter((i) => ticked.has(i)).length; return `<span class="lc two${t === 'family' ? ' fam' : ''}${on === 0 ? ' off' : on < ix.length ? ' part' : ''}"><button class="tk" data-act="tickgate" data-tier="${t}" data-g="${gg}" title="${on ? 'Leave out of' : 'Include in'} the variant">${on === 0 ? ICON.box0 : on < ix.length ? ICON.boxpart : ICON.boxon}</button><button class="go" data-act="jump" data-tier="${t}" data-g="${gg}" title="${esc('Go to them (again for the next): ' + ix.slice(0, 12).map((i) => looks[i].name).join(' · ') + (ix.length > 12 ? ' …' : ''))}">${gg}<b>${ix.length}</b>${ICON.go}</button>${ix.length > 1 ? `<button class="ex${openLook === t + '|' + gg ? ' on' : ''}" data-act="lookopen" data-tier="${t}" data-g="${gg}" title="Pick them one by one">${ICON.down}</button>` : ''}</span>`; }).join('') : '<span class="none">—</span>'}</div>${(() => {
          // one by one (Harkirat, 2026-10-05 12:17 EDT: "i don't want to select all 9, i only want to select the 1 Broadcast label because the other 8
          // might look similar… but they fall in a different group"): each lookalike its own tick, its words, hover to outline it, click to go there
          const ok = openLook && openLook.startsWith(t + '|') ? g[openLook.slice(t.length + 1)] : null; if (!ok) return '';
          return `<div class="lone">${ok.map((i) => `<div class="lrow" data-li="${i}"><button class="tk" data-act="tickone" data-i="${i}" title="${ticked.has(i) ? 'Leave out of' : 'Include in'} the variant">${ticked.has(i) ? ICON.boxon : ICON.box0}</button><button class="go" data-act="jumpone" data-i="${i}" title="Go to it">${esc(looks[i].name || '·')}</button></div>`).join('')}</div>`; })()}`; };
      h.push(`<div class="sec"><div class="kh"><span class="dot" style="background:${COL.look}"></span><span class="kname">Looks like this</span><button class="ib${showLooks ? ' on' : ''}" data-act="showlooks" title="Outline them on the page">${ICON.eye}</button></div>${tierRow('same', 'Same')}${tierRow('family', 'Family' + famWhy())}${others.length ? `<div class="tier"><span class="tl">States</span><button class="lc${showStates ? '' : ' off'}" data-act="states" title="Also in other states and pop-ups: click to list them">+${others.length}</button></div>${showStates ? `<div class="stl">${others.map((o, i) => (o.kind === 'pop' ? `<span class="str pop" title="A pop-up: open it by hand in Use mode">${o.g} · ${esc(o.label)} <b>${o.n}</b></span>` : `<button class="str" data-act="gostate" data-i="${i}" title="Switch ${o.g} to this and go to them">${o.g} · ${esc(o.label)} <b>${o.n}</b>${ICON.go}</button>`)).join('')}</div>` : ''}` : ''}<div class="acts" style="margin-top:10px">${v ? `<button class="primary" data-act="addlooks"${nt ? '' : ' disabled'}>${ICON.plus}Add ${nt} lookalike${nt === 1 ? '' : 's'} to it</button>` : `<button class="primary" data-act="make">${ICON.plus}Make a variant of ${nt + 1}</button>${same.length ? `<select data-act="addto"><option value="">Add to…</option>${same.map((x) => `<option value="${x.id}">${esc(x.id)} · ${esc(x.name)}</option>`).join('')}</select>` : ''}`}</div></div>`);
    } else h.push(`<div class="sec acts"><button class="primary" data-act="make">${ICON.plus}Make a variant of ${sel.length}</button></div>`);
    const st = panel.scrollTop; panel.innerHTML = h.join(''); panel.scrollTop = st;
    if (refocusK) { const r = panel.querySelector(`svg.ruler[data-ruler="${refocusK}"]`); if (r) r.focus({ preventScroll: true }); refocusK = null; }
  }
  function patches(v) { const items = [], vals = []; for (const el of S().elsOf(v)) { const ax = v.axis; for (const k of el.children) { if (!M().visible(k)) continue; const c = getComputedStyle(k); const m = ax === 'y' ? [c.marginTop, c.marginBottom] : [c.marginLeft, c.marginRight]; const n = m.map(parseFloat); if (n.some((x) => Math.abs(x) > 0.25) && !(ax !== 'y' && (c.marginLeft === 'auto' || c.marginRight === 'auto'))) { const s = M().selOf(k); if (!items.some((x) => x.sel === s)) { items.push({ sel: s, axis: ax }); vals.push(n.filter((x) => Math.abs(x) > 0.25).map((x) => fmt(x)).join('/')); } } } } return { items, vals }; }
  function findings(v) { const shape = (e) => [...e.children].map((c) => c.tagName.toLowerCase() + (c.children.length ? `(${c.children.length})` : '')).join(' '); const g = new Map(); for (const el of S().elsOf(v)) { const k = shape(el); g.set(k, (g.get(k) || 0) + 1); } return g.size > 1 ? `${g.size} different builds among its members: ${[...g.values()].join(' / ')} of each` : ''; }
  // quick select, stage A: the look a group carries (bd/looks.js) — take it from the selected element, or clear it
  function lookSec(v) { const L = v.look; const n = L ? L.entries.length : 0; const parts = L ? [...new Set(L.entries.map((e) => e.part))].join(' · ') : ''; const states = L ? [...new Set(L.entries.map((e) => e.state).filter(Boolean))].length : 0;
    return `<div class="sec"><div class="kh"><span class="dot" style="background:${COL.look}"></span><span class="kname">Group look</span></div><div class="tier">${L ? `<span class="tl" title="${esc('From ' + L.from + ' · ' + parts)}">${n} styles · ${states} states</span><button class="lc" data-act="setlook" data-v="${v.id}" title="Take the look from this element instead">Retake</button><button class="lc off" data-act="clearlook" data-v="${v.id}" title="Members keep their own look again">Clear</button>` : `<button class="lc" data-act="setlook" data-v="${v.id}" title="Every member of ${esc(v.name)} takes this element's look: fill, ring, corners, colour, icon, hover, press, focus, motion">Use this look for the group</button>`}</div></div>`; }
  function makeVariant() { if (!sel.length) return null; const el = sel[0]; const kind = M().kindOf(el) || 'box'; const els = sel.length > 1 ? sel : [el, ...looks.filter((_, i) => ticked.has(i)).map((l) => l.el)]; const id = S().create(kind, els); afterChange(`Made ${S().get(id).name} (${id}) from ${els.length}`); return id; }
  async function afterChange(label) { const base = dragBase; dragBase = null; if (!autoCheck) { say(label); return; } const t0 = performance.now(); await C().raf2(); let probs = []; if (base) probs = C().diff(base, C().snap()); else probs = await C().standardVsBoard(); showProblems(probs, null, label, Math.round(performance.now() - t0)); }
  function onPanelClick(e) {
    const n = e.target.closest('.num'); if (n) { activeK = n.dataset.k; renderPanel(); draw(); return; }
    const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act; const v = S().memberOf(sel[0]); if (/^g(pin|del|snap|snapall|clear|go)$/.test(a)) { guideAct(a, b.dataset); return; }
    if (a === 'close') select([]);
    else if (a === 'make') makeVariant();
    else if (a === 'setlook' && t.dataset.v && sel[0]) { dragBase = snapIf(); if (S().setLook(t.dataset.v, sel[0])) afterChange(`${t.dataset.v} takes this element's look`); }
    else if (a === 'clearlook' && t.dataset.v) { dragBase = snapIf(); if (S().clearLook(t.dataset.v)) afterChange(`${t.dataset.v}: members keep their own look`); }
    else if (a === 'notetoggle') { noteOpen = !noteOpen; renderPanel(); const t = noteOpen && panel.querySelector('textarea'); if (t) t.focus(); }
    else if (a === 'showlooks') { showLooks = !showLooks; renderPanel(); draw(); }
    else if (a === 'lookopen') { const k2 = `${b.dataset.tier}|${b.dataset.g}`; openLook = openLook === k2 ? null : k2; renderPanel(); }
    else if (a === 'tickone') { const i = +b.dataset.i; if (ticked.has(i)) ticked.delete(i); else ticked.add(i); renderPanel(); draw(); }
    else if (a === 'jumpone') { const l = looks[+b.dataset.i]; if (l) jumpTo([l.el], 'one|' + b.dataset.i); }
    else if (a === 'tickgate') { const ix = looks.map((l, i) => (l.tier === b.dataset.tier && l.gate === b.dataset.g ? i : -1)).filter((i) => i >= 0); const all = ix.every((i) => ticked.has(i)); for (const i of ix) { if (all) ticked.delete(i); else ticked.add(i); } renderPanel(); draw(); }
    else if (a === 'members' && v) { showMembers = showMembers === v.id ? null : v.id; renderPanel(); draw(); }
    else if (a === 'back' && v) { S().back(v.id); afterChange(`${v.id} back to Board 4's values`); }
    else if (a === 'out' && v) { const m = v.members.find((x) => { try { return sel[0].matches(x.sel); } catch (y) { return false; } }); if (m) S().removeMember(v.id, m.sel); }
    else if (a === 'addlooks' && v) { dragBase = snapIf(); S().addMembers(v.id, looks.filter((_, i) => ticked.has(i)).map((l) => l.el)); afterChange(`Added to ${v.id}`); }
    else if (a === 'clear' && v) { dragBase = snapIf(); const p = removable(v); S().addClears(v.id, p.items); afterChange(`Cleared ${p.items.length} patches in ${v.id}`); }
    else if (a === 'snap' && v && activeK) S().setOwn(v.id, activeK, !v.own[activeK]);
    else if (a === 'opt' && v && activeK) { const val = b.dataset.val; const kn = (S().KNOBS[v.kind] || []).find((x) => x.k === activeK) || { label: activeK }; dragBase = snapIf(); S().setValue(v.id, activeK, val); S().endChange(`${v.id} ${activeK} ${val}`); afterChange(`${v.name}: ${kn.label} ${val}`); }
    else if (a === 'jump') jumpTo(looks.filter((l) => l.tier === b.dataset.tier && l.gate === b.dataset.g).map((l) => l.el), `${b.dataset.tier}|${b.dataset.g}`);
    else if (a === 'mjump' && v) jumpTo(S().elsOf(v).filter((x) => M().gateOf(x) === b.dataset.g), `m|${v.id}|${b.dataset.g}`);
    else if (a === 'home' && sel[0]) { sel[0].scrollIntoView({ block: 'center' }); flashes.push({ el: sel[0], until: performance.now() + 1500 }); setTimeout(() => { updateGate(); recompute(); draw(); }, 60); }
    else if (a === 'jbad') jumpTo([...badMap.keys()], 'bad');
    else if (a === 'states') { showStates = !showStates; renderPanel(); }
    else if (a === 'gostate') goState(others[+b.dataset.i]);
    else if (a === 'showpatch' && v) { showPatch = showPatch === v.id ? null : v.id; renderPanel(); draw(); }
    else if (a === 'showbuilt' && v) { showBuilt = showBuilt === v.id ? null : v.id; renderPanel(); draw(); }
    else if (a === 'note') { const t = panel.querySelector('[data-act="notetext"]'); if (t && t.value.trim()) { S().addNote(t.value.trim(), sel[0]); noteOpen = false; renderPanel(); say('Note added.'); } }
  }
  // guides (bd/guides.js): pin one on the selected thing's edge, remove it, and snap a thing that is off to it through the distance editor's own
  // path (applyDist), so the fix is a setting on a variant and every copy follows, never a nudge on one element. When several settings could
  // close the gap, the editor's own choice applies (the box they share); Stage 2 lists the others with how many things each moves.
  async function guideAct(a, ds) {
    const G = BD.guides;
    if (a === 'gpin') { G.add(curGate, sel[0], ds.side); say(`Guide on ${M().label(sel[0])}'s ${ds.side} edge`); renderPanel(); draw(); return; }
    if (a === 'gdel') { G.remove(curGate, ds.gid); renderPanel(); draw(); return; }
    if (a === 'gclear') { G.clear(curGate); renderPanel(); draw(); return; }
    const g = G.store(curGate).find((x) => x.id === ds.gid); if (!g) return;
    if (a === 'ggo') { const t = G.tags(curGate, g)[+ds.ti]; if (t) { t.el.scrollIntoView({ block: 'center' }); select([t.el]); } return; }
    const all = G.tags(curGate, g); const targets = a === 'gsnap' ? [all[+ds.ti]].filter(Boolean) : all.filter((t) => Math.abs(t.d) >= 0.5);
    const back = sel.slice(); let ok = 0; const no = [];
    for (const t of targets) { const r = snapOne(t.el, g); if (r === true) ok++; else no.push(`${M().label(t.el)}: ${r}`); await new Promise((res) => setTimeout(res, 60)); }
    select(back.filter((x) => x.isConnected)); say(`Snapped ${ok} of ${targets.length}${no.length ? ' · ' + no.join(' · ') : ''}`); renderPanel(); draw();
  }
  api.ui.guideAct = guideAct;
  // Snap moves the thing, never a neighbour: each space on the guide's axis is tried with the setting that would carry the thing onto the guide
  // (a space before it grows, a space after it shrinks), the page is measured, and only the best one is kept (2026-10-05 11:49 EDT: the first
  // version changed the space on the guide's own side, which moves the neighbour instead, and overshot "All 24" → SMG from -1.4 to 1.6)
  function snapOne(el, g) {
    if (!/^(left|right|top|bottom)$/.test(g.side)) return 'a centre guide snaps in Stage 2';
    const G = BD.guides, gap = () => { const p = G.pos(g); return p == null ? null : p - G.ink(el)[g.side]; };
    const d0 = gap(); if (d0 == null) return 'its guide is not on the page'; if (Math.abs(d0) < 0.5) return true;
    const ax = g.side === 'left' || g.side === 'right' ? 'x' : 'y';
    const lead = (d) => { if (d.kind === 'inside') return d.side === 'left' || d.side === 'top'; const re = M().seen(el), rb = M().seen(d.b); return ax === 'x' ? rb.right <= re.left + 0.5 : rb.bottom <= re.top + 0.5; };
    select([el]); const L0 = currentDists(); const cand = L0.map((d, i) => ({ d, i })).filter(({ d }) => (d.kind === 'inside' ? ((d.side === 'left' || d.side === 'right') ? 'x' : 'y') === ax : d.axis === ax && d.b));
    if (!cand.length) return 'nothing on that axis the builder can set yet';
    let best = null; let why = '';
    for (const { d, i } of cand) {
      const W = Math.round(d.total + (lead(d) ? d0 : -d0)); if (W < 0 || W === Math.round(d.total)) continue;
      select([el]); const res = applyDist(i, W, false); if (res && res.err) { why = res.err; continue; }
      const d1 = gap(); S().undo(); select([el]);
      if (d1 != null && Math.abs(d1) < Math.abs(d0) - 0.25 && (!best || Math.abs(d1) < Math.abs(best.d1))) best = { i, W, d1 };
    }
    if (!best) return why || 'no setting moves it closer';
    select([el]); const res = applyDist(best.i, best.W, false); if (res && res.err) return res.err;
    return Math.abs(best.d1) < 0.5 ? true : `closest is ${(+best.d1.toFixed(1))} off, in whole pixels`;
  }
  function onPanelChange(e) {
    const t = e.target; const a = t.dataset.act; const v = S().memberOf(sel[0]);
    if (a === 'rename' && v) S().rename(v.id, t.value);
    else if (a === 'kin' && v) { const k = t.dataset.k; const kn = (S().KNOBS[v.kind] || []).find((x) => x.k === k); let x = parseFloat(t.value); if (!kn || !Number.isFinite(x)) return; if (kn.list !== 'track') x = Math.round(x); S().setValue(v.id, k, x); renderPanel(); draw(); }
    else if (a === 'addto' && t.value) { dragBase = snapIf(); S().addMembers(t.value, [sel[0], ...looks.filter((_, i) => ticked.has(i)).map((l) => l.el)]); afterChange(`Added to ${t.value}`); }
  }
  // the ruler: press and drag (only that knob's rule is rewritten while held), release to check the board; arrow keys step along his list
  function onPanelDown(e) { const r = e.target.closest && e.target.closest('svg.ruler.live'); if (!r || e.button > 0) return; e.preventDefault(); try { r.setPointerCapture(e.pointerId); } catch (x) {} rdrag = r; dragBase = snapIf(); S().beginChange(); skipOffscreen(true); rulerSet(r, e.clientX); r.focus({ preventScroll: true }); }
  function onPanelMove(e) { if (rdrag) rulerSet(rdrag, e.clientX); }
  function onPanelUp() { if (!rdrag) return; const r = rdrag; rdrag = null; skipOffscreen(false); const v = S().memberOf(sel[0]); if (!v) return; const k = r.dataset.ruler; const kn = (S().KNOBS[v.kind] || []).find((x) => x.k === k) || { label: k }; refocusK = k; S().endChange(`${v.id} ${k} ${v.values[k]}`); afterChange(`${v.name}: ${kn.label} ${fmt(v.values[k])}`); }
  function onPanelKey(e) {
    const r = e.composedPath()[0]; if (!r || !r.matches || !r.matches('svg.ruler.live') || !/^Arrow(Left|Right|Up|Down)$/.test(e.key)) return; e.preventDefault(); e.stopPropagation();
    const v = S().memberOf(sel[0]); if (!v) return; const k = r.dataset.ruler; const kn = (S().KNOBS[v.kind] || []).find((x) => x.k === k); if (!kn) return; const L = rulerList(kn, v.values[k]); const cur = +v.values[k]; const up = /Right|Up/.test(e.key);
    let nv; if (v.own[k]) { const d = kn.list === 'track' ? 0.5 : 1; nv = cur + (up ? d : -d); } else { const nx = up ? L.find((x) => x > cur + 0.01) : [...L].reverse().find((x) => x < cur - 0.01); nv = nx == null ? cur : nx; }
    if (nv === cur) return; dragBase = snapIf(); refocusK = k; S().setValue(v.id, k, nv); S().endChange(`${v.id} ${k} ${nv}`); afterChange(`${v.name}: ${kn.label} ${fmt(nv)}`);
  }
  // pointing at a number in the panel dims every other mark on the page; pointing at a lookalike chip outlines those things
  function onPanelOver(e) { const n = e.target.closest('.num'), kb = e.target.closest('.knob'), lc = e.target.closest('[data-tier][data-g]'); const fk = n ? n.dataset.k : kb ? kb.dataset.k : null; const li = e.target.closest('[data-li]'); const pk = li ? 'i' + li.dataset.li : lc ? `${lc.dataset.tier}|${lc.dataset.g}` : null; if (fk !== focusK || pk !== peekKey) { focusK = fk; peekKey = pk; draw(); } }
  // while a knob is held, gates out of view are left unrendered (each keeps its own measured size, so nothing moves); all of them come back on release
  function skipOffscreen(on) {
    for (const g of Object.keys(M().GATE_NAMES)) {
      const el = M().gateEl(g); if (!el) continue;
      if (on) { if (el.dataset.bdSkip) continue; const r = el.getBoundingClientRect(); if (r.bottom >= -200 && r.top <= innerHeight + 200) continue; el.style.setProperty('contain-intrinsic-size', `auto ${Math.round(r.width)}px auto ${Math.round(r.height)}px`, 'important'); el.style.setProperty('content-visibility', 'auto', 'important'); el.dataset.bdSkip = '1'; }
      else if (el.dataset.bdSkip) { el.style.removeProperty('content-visibility'); el.style.removeProperty('contain-intrinsic-size'); delete el.dataset.bdSkip; }
    }
  }
  api.ui.dragMode = skipOffscreen;
  function onPopChange(e) {
    const t = e.target;
    if (t.dataset.layer) { if (t.dataset.layer === 'miss') { setMiss(t.checked); return; } layers[t.dataset.layer] = t.checked; recompute(); draw(); return; }
    if (t.dataset.add != null && t.value !== '') { const k = t.dataset.list; S().setList(k, [...(S().lists[k] || []), +t.value]); refreshPop(); }
  }
  function onPopClick(e) { const b = e.target.closest('button'); if (!b) return; if (b.dataset.rm != null) { const k = b.dataset.list; S().setList(k, (S().lists[k] || []).filter((x) => Math.abs(x - +b.dataset.rm) > 0.001)); refreshPop(); } if (b.dataset.noteRm) { S().removeNote(+b.dataset.noteRm); refreshPop(); } if (b.dataset.act === 'copyall') copyAll(); if (b.dataset.cset) { S().setValue(b.dataset.cset, 'radius', +b.dataset.r); refreshPop(); say(`Corners set to ${b.dataset.r}`); } if (b.dataset.cgo != null) { const els = cornerRows[+b.dataset.cgo] || []; if (els[0]) { jumpTo(els, 'c|' + b.dataset.cgo); select([els[jumpAt.get('c|' + b.dataset.cgo) || 0]]); } } if (b.dataset.vdel) { const v = S().get(b.dataset.vdel); S().remove(b.dataset.vdel); refreshPop(); say(`Deleted ${v ? v.name : 'it'} · ⌘Z brings it back`); } if (b.dataset.vopen) { const v = S().get(b.dataset.vopen); const els = v ? S().elsOf(v) : []; if (els[0]) { pop.hidden = true; els[0].scrollIntoView({ block: 'center' }); setTimeout(() => select([els[0]]), 120); } } }
  function dragPanel() { let d = null; panel.addEventListener('pointerdown', (e) => { if (!e.target.closest('.ph') || e.target.closest('button')) return; const r = panel.getBoundingClientRect(); d = [e.clientX - r.left, e.clientY - r.top]; panel.setPointerCapture(e.pointerId); }); panel.addEventListener('pointermove', (e) => { if (!d) return; panel.style.left = Math.max(0, Math.min(innerWidth - 120, e.clientX - d[0])) + 'px'; panel.style.top = Math.max(0, Math.min(innerHeight - 60, e.clientY - d[1])) + 'px'; panel.style.right = 'auto'; }); panel.addEventListener('pointerup', () => { d = null; }); panel.addEventListener('dblclick', (e) => { if (e.target.closest('.ph')) { panel.style.left = ''; panel.style.top = ''; panel.style.right = ''; } }); }

  function say(msg, keep) { toast.innerHTML = esc(msg); toast.hidden = false; clearTimeout(toastT); if (!keep) toastT = setTimeout(() => { toast.hidden = true; }, 3500); }
  function showProblems(probs, where, label, ms) {
    flash = probs; const head = label ? `${esc(label)}. ` : '';
    if (!probs.length) { toast.innerHTML = `${head}<span class="ok">Checked all nine gates${where ? ' ' + esc(where) : ''}: nothing new broke.</span>${ms != null ? ` <span class="muted">(${ms} ms)</span>` : ''}`; }
    else toast.innerHTML = `${head}<span class="bad">${probs.length} new problem${probs.length > 1 ? 's' : ''}${where ? ' ' + esc(where) : ''}:</span><ul>${probs.slice(0, 6).map((p, i) => `<li>${esc(p.gate || '')} · ${esc(p.name || '')} ${esc(p.what)} ${p.el ? `<button data-goto="${i}">Show</button>` : ''}</li>`).join('')}</ul>${probs.length > 6 ? `<span class="muted">and ${probs.length - 6} more</span>` : ''}`;
    toast.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { toast.hidden = true; }, probs.length || (label && label.length > 60) ? 20000 : 4000);
  }

  // ── start card: the gate, three numbers, the keys ──
  let thingCount = { g: null, n: 0, at: -1 };
  function renderStart() {
    if (!start) return; if (sel.length) { start.hidden = true; return; } start.hidden = false;
    const g = M().gateEl(curGate); if (!g) { start.innerHTML = ''; return; }
    if (thingCount.g !== curGate || thingCount.at !== lastMut + S().state.at) { const T = M().things(g); let inV = 0; for (const el of T) if (S().memberOf(el)) inV++; thingCount = { g: curGate, n: T.length, inV, at: lastMut + S().state.at }; }
    const m = cache.miss || { lines: [], spaces: [] };
    start.innerHTML = `<div class="sh"><span class="gcode">${esc(curGate)}</span><span class="gname">${esc(M().GATE_NAMES[curGate])}</span></div><div class="tiles"><div class="tile"><span class="n">${thingCount.n}</span><span class="l">${ICON.things}things</span></div><div class="tile"><span class="n">${thingCount.inV}</span><span class="l">${ICON.layers}in variants</span></div><button class="tile miss${layers.miss ? '' : ' off'}" data-act="misstoggle" title="${layers.miss ? 'Hide' : 'Show'} the near-misses (N)"><span class="n">${layers.miss ? m.lines.length + m.spaces.length : '–'}</span><span class="l">${ICON.miss}near-misses</span></button></div>${KEYHTML(['in', 'gap', 'size', 'dist', 'miss'])}<div class="keys">${inspect ? '<span><kbd>click</kbd>select</span><span><kbd>⇧</kbd>add</span><span><kbd>↑</kbd>parent</span><span><kbd>⌥</kbd>use the page</span><span><kbd>I</kbd>Use mode</span><span><kbd>N</kbd>near-misses</span>' : '<span><kbd>I</kbd>back to Inspect</span><span><kbd>N</kbd>near-misses</span>'}</div>`;
  }

  // ── measure and set ──
  // The space around the selected thing, measured between visible edges (letters for text, the painted edge for a box) the way his own
  // screenshots measure, each number clickable to say what he wants. Setting a number CORRECTS the build and never adds to it: the
  // relationship's own setting (a row's gap, a container's inside space) takes the value and the patches on the way (margins, a bare
  // wrapper's padding) go; nothing gets a new margin, offset or nudge, and a space no number explains is named, not patched. If rows
  // would need different values for the same look, the cause is shown instead of writing a value per row. Harkirat, 2026-10-03 15:43 EDT:
  // "how that actually renders… that's in your bucket"; 15:59 EDT: "i don't want it to just blindly change… a blind change just adds into
  // that bad coding behavior that's already present in the board, instead of correcting it". Plan § MEASURE-AND-SET (corrected).
  COL.dist = '#ff5a6e';
  const KNOBNAME = { gap: 'space between items', padY: 'space inside, top and bottom', padX: 'space inside, left and right', padL: 'space inside, left', padR: 'space inside, right', padT: 'space inside, top', padB: 'space inside, bottom' };
  const ROLE = { set: ['sets it', COL.gap], goes: ['patch', '#ff6fae'], kept: ['kept', '#6f7c87'], cause: ['the cause', '#ffb36b'] };
  let dcache = { el: null, ep: '', list: [] }, edit = null;
  function paintedParent(el) { for (let a = el.parentElement; a && a.id !== 'board'; a = a.parentElement) { if (!M().inStage(a)) return null; if (M().visibleBox(a)) return a; } return null; }
  function distLine(d) {
    const re = M().seen(d.a);
    if (d.kind === 'between') { const rb = M().seen(d.b); if (d.axis === 'x') { const [L, Rr] = rb.left >= re.right - 0.5 ? [re, rb] : [rb, re]; const y = (Math.max(L.top, Rr.top) + Math.min(L.bottom, Rr.bottom)) / 2; return { x1: L.right, y1: y, x2: Rr.left, y2: y, v: Rr.left - L.right }; } const [T, Bb] = rb.top >= re.bottom - 0.5 ? [re, rb] : [rb, re]; const x = (Math.max(T.left, Bb.left) + Math.min(T.right, Bb.right)) / 2; return { x1: x, y1: T.bottom, x2: x, y2: Bb.top, v: Bb.top - T.bottom }; }
    const rc = M().seen(d.C), vx = re.left + Math.min(8, re.width / 4), cy = (re.top + re.bottom) / 2;
    if (d.side === 'top') return { x1: vx, y1: rc.top, x2: vx, y2: re.top, v: re.top - rc.top };
    if (d.side === 'bottom') return { x1: vx, y1: re.bottom, x2: vx, y2: rc.bottom, v: rc.bottom - re.bottom };
    if (d.side === 'left') return { x1: rc.left, y1: cy, x2: re.left, y2: cy, v: re.left - rc.left };
    return { x1: re.right, y1: cy, x2: rc.right, y2: cy, v: rc.right - re.right };
  }
  // the selected thing's four spaces: to the nearest thing on each side that shares its row (else its box's edge), and to its box's top and
  // bottom; their pieces are worked out once per change, their lengths every frame
  function currentDists() {
    const el = sel[0]; if (sel.length !== 1 || !el || !el.isConnected) return [];
    const ep = `${S().state.at}:${lastMut}:${S().compare}`;
    if (dcache.el !== el || dcache.ep !== ep) {
      const list = []; const Cn = paintedParent(el);
      if (Cn) {
        const re = M().seen(el); let L = null, Rn = null, lx = -Infinity, rx = Infinity;
        for (const e of M().things(Cn)) { if (e === el || e.contains(el) || el.contains(e)) continue; const r = M().seen(e); const vo = Math.min(r.bottom, re.bottom) - Math.max(r.top, re.top); if (vo < Math.min(r.height, re.height) * 0.5) continue; if (r.right <= re.left + 0.5 && r.right > lx) { lx = r.right; L = e; } if (r.left >= re.right - 0.5 && r.left < rx) { rx = r.left; Rn = e; } }
        const btw = (b) => { const d = M().distance(el, b); return d ? { kind: 'between', a: el, b, axis: d.axis, pieces: d.pieces, sum: d.sum, total: d.total } : null; };
        const ins = (sd) => { const d = M().inset(el, Cn, sd); return d ? { kind: 'inside', a: el, C: Cn, side: sd, axis: d.axis, pieces: d.pieces, sum: d.sum, total: d.total } : null; };
        for (const x of [L ? btw(L) : ins('left'), Rn ? btw(Rn) : ins('right'), ins('top'), ins('bottom')]) if (x) list.push(x);
      }
      dcache = { el, ep, list };
    }
    for (const d of dcache.list) { if (!d.a.isConnected || (d.b && !d.b.isConnected) || (d.C && !d.C.isConnected)) { d.g = null; continue; } d.g = distLine(d); d.total = +d.g.v.toFixed(2); }
    return dcache.list;
  }
  function drawDists(parts, put) {
    currentDists().forEach((d, i) => {
      const g = d.g; if (!g) return; const c = COL.dist, flat = Math.abs(g.y2 - g.y1) < 0.5, t = r1(g.v), len = Math.hypot(g.x2 - g.x1, g.y2 - g.y1), mx = (g.x1 + g.x2) / 2, my = (g.y1 + g.y2) / 2;
      const ends = flat ? `M${g.x1} ${g.y1 - 4}v8M${g.x2} ${g.y2 - 4}v8` : `M${g.x1 - 4} ${g.y1}h8M${g.x2 - 4} ${g.y2}h8`;
      const short = flat && len < tagW(t) + 4; const tx = flat ? mx : g.x1 + tagW(t) / 2 + 5, ty = short ? Math.max(M().seen(d.a).bottom, d.b ? M().seen(d.b).bottom : -Infinity) + 10 : my;
      const tip = d.kind === 'between' ? `${M().label(d.a)} to ${M().label(d.b)}: click to set` : `${M().label(d.a)} to its box's ${d.side} edge: click to set`;
      parts.push(`<path d="M${g.x1} ${g.y1}L${g.x2} ${g.y2}${ends}" stroke="${c}" stroke-width="1.5" fill="none"/><g class="hit dist" data-di="${i}"><title>${esc(tip)}</title>${put(tx, ty, t, c, short ? [0, 18, 36] : flat ? [0, -18, 18] : d.side === 'top' ? [0, -18, -36] : [0, 18, 36])}</g>`);
    });
  }
  // what each piece of a space is: the relationship's own setting, a patch that a correction takes out, part of a thing's look, or a cause
  // that no number fixes (a wrapper spreading or stretching its items, other things in between)
  function pieceRole(p, d, P) {
    if (p.kind === 'gap' && d.kind === 'between' && p.who === P) return 'set';
    if (p.kind === 'padding' && d.kind === 'inside' && p.who === P) return 'set';
    if (p.kind === 'margin' || p.kind === 'patch') return 'goes';
    if (p.kind === 'padding' && p.who && p.who !== P && !M().visibleBox(p.who) && M().kindOf(p.who) !== 'control') return 'goes';
    if (p.kind === 'between' || (p.kind === 'leftover' && Math.abs(p.px) > 0.5)) return 'cause';
    return 'kept';
  }
  function groupOf(P) { const v = S().memberOf(P); if (v) return S().elsOf(v); return [P, ...lookalikes(P).filter((l) => l.tier === 'same').map((l) => l.el)]; }
  const isTextEdge = (p) => p.kind === 'edge' && p.who && M().kindOf(p.who) === 'text';
  // a variant made only to carry a correction starts with no values of its own, so making it changes nothing else about its members (a new
  // variant otherwise takes every knob's most common value, which would quietly re-space members that differed)
  const holderFor = (els, kind) => { const v = S().get(S().create(kind, els)); S().back(v.id); return S().get(v.id); };
  function planDist(d, W, trim) {
    const P = d.kind === 'between' ? M().common(d.a, d.b) : d.C; const out = { P, members: [], goes: [], outliers: [], textEdge: 0, onList: true, val: null, knob: null, cur: 0, err: null };
    if (!P) { out.err = 'no shared box'; return out; }
    { const sh = M().sharedGap(P); if (sh) out.warn = `${M().label(sh.label)} shares this box: one gap sets both spaces`; } const c = getComputedStyle(P), pk = M().kindOf(P), kind = pk === 'control' ? 'control' : pk === 'box' ? 'box' : 'layout'; out.kind = kind;
    { const ci0 = d.pieces.findIndex((p) => pieceRole(p, d, P) === 'cause'); if (ci0 >= 0) { const p = d.pieces[ci0]; out.err = p.kind === 'between' ? 'other things sit between them' : `${r1(p.px)} comes from ${p.from && p.from !== 'unexplained' ? p.from : 'the layout around it'}${d.kind === 'inside' && d.axis === 'y' ? ' · Centre below' : ''}`; return out; } }
    if (d.kind === 'between') { const fl = /flex/.test(c.display), gr = /grid/.test(c.display); if (!(gr || (fl && (d.axis === 'x') === /^row/.test(c.flexDirection)))) { out.err = `not spaced by a row's gap (${c.display})`; return out; } out.knob = (kind !== 'control' && S().slotFor(P, d.a, d.b)) || 'gap'; out.cur = M().px(d.axis === 'x' ? c.columnGap : c.rowGap); }
    else if (d.axis === 'y') { if (kind === 'control') { out.err = 'its top and bottom come from its height'; return out; } out.knob = d.side === 'top' ? 'padT' : 'padB'; out.cur = M().px(d.side === 'top' ? c.paddingTop : c.paddingBottom); }
    else { out.knob = d.side === 'left' ? 'padL' : 'padR'; out.cur = M().px(d.side === 'left' ? c.paddingLeft : c.paddingRight); }
    if (!(S().KNOBS[kind] || []).some((k) => k.k === out.knob)) { out.err = 'nothing here sets this space'; return out; }
    const roles = d.pieces.map((p) => pieceRole(p, d, P)); const ci = roles.indexOf('cause');
    if (ci >= 0) { const p = d.pieces[ci]; out.err = p.kind === 'between' ? 'other things sit between them' : `${r1(p.px)} comes from ${p.from && p.from !== 'unexplained' ? p.from : 'the layout around it'}`; return out; }
    out.textEdge = d.axis === 'y' ? d.pieces.filter(isTextEdge).reduce((sm, p) => sm + p.px, 0) : 0;
    const keptOf = (pcs, rl) => pcs.reduce((sm, p, i) => sm + (rl[i] === 'kept' && !(trim && isTextEdge(p)) ? p.px : 0), 0);
    // a setting read to what is drawn (a padding, a layout's own gap) takes the space itself; a plain one, what the page needs on top of what it keeps
    let rd0 = null; { const kn0 = (S().KNOBS[kind] || []).find((k) => k.k === out.knob); try { rd0 = kn0 ? kn0.read(P) : null; } catch (e) {} } const drawnK = typeof rd0 === 'number' && Math.abs(rd0 - (d.total != null ? d.total : 0)) < 0.6;
    if (!drawnK && /^s\d$/.test(out.knob)) out.knob = 'gap';
    const need = drawnK ? W : W - keptOf(d.pieces, roles); const L = S().lists.space; const sn = L.reduce((b, x) => (Math.abs(x - need) < Math.abs(b - need) ? x : b), L[0]);
    out.onList = Math.abs(sn - need) <= 0.75; out.val = out.onList ? sn : Math.round(need * 2) / 2;
    if (out.val < 0) { out.err = `what it keeps is already ${r1(W - need)}`; return out; }
    out.members = groupOf(P); const sa = M().selOf(d.a), sb = d.b ? M().selOf(d.b) : null; const seenK = new Set();
    for (const Pm of out.members) {
      const a = Pm === P ? d.a : Pm.querySelector(sa); if (!a) continue; let mm;
      if (d.kind === 'between') { const b = Pm === P ? d.b : Pm.querySelector(sb); if (!b) continue; mm = M().distance(a, b); } else mm = M().inset(a, Pm, d.side);
      if (!mm) continue; const rl = mm.pieces.map((p) => pieceRole(p, d, Pm));
      mm.pieces.forEach((p, i) => { if (rl[i] !== 'goes' || !p.who) return; const it = { sel: M().selOf(p.who), axis: d.axis, what: p.kind === 'padding' ? 'padding' : 'margin' }; const k = it.sel + '|' + it.what; if (!seenK.has(k)) { seenK.add(k); out.goes.push(it); } });
      if (rl.includes('cause')) out.outliers.push({ el: Pm, why: 'cause' }); else { const nm = drawnK ? W : W - keptOf(mm.pieces, rl); if (Math.abs(nm - out.val) > 0.75) out.outliers.push({ el: Pm, need: nm }); }
    }
    return out;
  }
  function remeasure(d, W, members, P) { const sa = M().selOf(d.a), sb = d.b ? M().selOf(d.b) : null; let ok = 0, of = 0; for (const Pm of members) { if (!Pm.isConnected) continue; const a = Pm === P ? d.a : Pm.querySelector(sa); if (!a) continue; let mm; if (d.kind === 'between') { const b = Pm === P ? d.b : Pm.querySelector(sb); if (!b) continue; mm = M().distance(a, b); } else mm = M().inset(a, Pm, d.side); if (!mm) continue; of++; if (Math.abs(mm.total - W) <= 0.5) ok++; } return { ok, of }; }
  function trimTexts(d) { const done = new Set(); for (const p of d.pieces) { if (!isTextEdge(p) || done.has(p.who)) continue; done.add(p.who); let tv = S().memberOf(p.who); if (!tv || tv.kind !== 'text') tv = holderFor(groupOf(p.who), 'text'); S().setValue(tv.id, 'trim', 'trim-both cap alphabetic'); S().endChange(`${tv.id} trim`); } }
  function applyDist(i, W, trim) {
    const d = currentDists()[i]; if (!d) return null; const p = planDist(d, W, trim); if (p.err) return { err: p.err };
    dragBase = snapIf(); if (trim && p.textEdge > 0.5) trimTexts(d);
    let v = S().memberOf(p.P); if (!v || v.kind !== p.kind) v = holderFor(p.members, p.kind);
    if (p.goes.length) S().addClears(v.id, p.goes); S().setValue(v.id, p.knob, p.val); S().endChange(`${v.id} ${p.knob} ${p.val}`);
    const rep = remeasure(d, W, p.members, p.P); afterChange(`Set ${W}: ${rep.ok} of ${rep.of} show it${p.goes.length ? ` · ${p.goes.length} patch${p.goes.length > 1 ? 'es' : ''} removed` : ''}`);
    return { ...rep, knob: p.knob, val: p.val, goes: p.goes.length };
  }
  // centring corrects why the letters sit off the middle: a margin on the way, a wrapper lining up by baseline or start, the text's own uneven
  // empty space (trim its box to the letters, for that text style everywhere); never a nudge
  function centrePlan(d) {
    const el = d.a, Cc = d.C; const up = M().inset(el, Cc, 'top'), dn = M().inset(el, Cc, 'bottom'); const out = { up: up ? up.total : 0, dn: dn ? dn.total : 0, off: 0, trim: null, trimN: 0, unblock: null, selfs: [], wrappers: [], goes: [], finds: [], any: false, err: null };
    if (!up || !dn) { out.err = 'no box around it'; return out; } out.off = (dn.total - up.total) / 2;
    for (const p of [...up.pieces, ...dn.pieces]) if ((p.kind === 'margin' || p.kind === 'patch') && p.who && Math.abs(p.px) > 0.25) { const it = { sel: M().selOf(p.who), axis: 'y', what: 'margin' }; if (!out.goes.some((g) => g.sel === it.sel)) out.goes.push(it); }
    // every step on the way lines up by the middle, or says why not: an item's own align-self overriding a centring parent is a patch that
    // goes; a parent lining its items up by baseline or start is set to the middle
    for (let q = el; q && q !== Cc; q = q.parentElement) { const p = q.parentElement; if (!p) break; const pc = getComputedStyle(p); if (!(/grid/.test(pc.display) || (/flex/.test(pc.display) && /^row/.test(pc.flexDirection)))) continue; const self = getComputedStyle(q).alignSelf; const own = self && self !== 'auto' && self !== 'normal'; if (/center/.test(own ? self : pc.alignItems)) continue; if (own && /center/.test(pc.alignItems)) out.selfs.push(q); else if (!out.wrappers.includes(p)) out.wrappers.push(p); }
    // the text's own box: a letters box set where it can't work (text-box-trim needs a plain box; a flex box holding only text ignores it) is
    // made to work; otherwise uneven empty space above and below the letters is trimmed, for that text style everywhere
    const eu = up.pieces.find((p) => p.kind === 'edge' && p.who === el), edn = dn.pieces.find((p) => p.kind === 'edge' && p.who === el);
    if (M().kindOf(el) === 'text' && eu && edn && Math.abs(eu.px - edn.px) > 0.25) { const c = getComputedStyle(el), tr = c.getPropertyValue('text-box-trim'); if (tr && tr !== 'none') { if (/flex|grid/.test(c.display) && [...document.querySelectorAll(M().selOf(el))].every((x) => ![...x.children].some((k) => M().visible(k)))) out.unblock = el; else out.finds.push('its letters box is set but not working'); } else { out.trim = el; out.trimN = groupOf(el).length; } }
    const pu = up.pieces.filter((p) => p.kind === 'padding').reduce((sm, p) => sm + p.px, 0), pd = dn.pieces.filter((p) => p.kind === 'padding').reduce((sm, p) => sm + p.px, 0); if (Math.abs(pu - pd) > 0.5) out.finds.push(`space inside: ${r1(pu)} above, ${r1(pd)} below`);
    out.any = Math.abs(out.off) > 0.25 && !!(out.trim || out.unblock || out.selfs.length || out.wrappers.length || out.goes.length); if (Math.abs(out.off) > 0.25 && !out.any && !out.finds.length) out.finds.push('nothing on its way explains it');
    return out;
  }
  function applyCentre(i) {
    const d = currentDists()[i]; if (!d) return null; const p = centrePlan(d); if (p.err || !p.any) return { err: p.err || 'nothing to correct', ok: 0, of: 0 };
    dragBase = snapIf(); const el = d.a;
    const fixes = [...p.goes, ...(p.unblock ? [{ sel: M().selOf(p.unblock), axis: 'y', what: 'display' }] : []), ...p.selfs.map((q) => ({ sel: M().selOf(q), axis: 'y', what: 'alignSelf' }))];
    if (fixes.length) { let pv = S().memberOf(d.C); if (!pv) pv = holderFor(groupOf(d.C), M().kindOf(d.C) === 'box' ? 'box' : 'layout'); S().addClears(pv.id, fixes); }
    for (const w of p.wrappers) { let wv = S().memberOf(w); if (!wv || !(S().KNOBS[wv.kind] || []).some((k) => k.k === 'align')) wv = holderFor(groupOf(w), 'layout'); S().setValue(wv.id, 'align', 'center'); S().endChange(`${wv.id} align center`); }
    if (p.trim) { let tv = S().memberOf(p.trim); if (!tv || tv.kind !== 'text') tv = holderFor(groupOf(p.trim), 'text'); S().setValue(tv.id, 'trim', 'trim-both cap alphabetic'); S().endChange(`${tv.id} trim`); }
    const boxSel = M().selOf(d.C); let ok = 0, of = 0; for (const t of groupOf(el)) { if (!t.isConnected) continue; const Cm = paintedParent(t); if (!Cm || M().selOf(Cm) !== boxSel) continue; const u = M().inset(t, Cm, 'top'), b = M().inset(t, Cm, 'bottom'); if (!u || !b) continue; of++; if (Math.abs(u.total - b.total) <= 1) ok++; }
    afterChange(`Centred ${M().label(el)}: ${ok} of ${of}`); return { ok, of };
  }
  function openEditor(i, x, y) { const D = currentDists(); if (!D[i]) return; edit = { i, want: Math.round(D[i].total), trim: false, x: x == null ? innerWidth / 2 : x, y: y == null ? innerHeight / 3 : y }; renderEditor(); }
  function closeEditor() { edit = null; if (ed) ed.hidden = true; }
  function placeEd() { const w = 340, h = ed.offsetHeight || 300; let x = edit.x + 14, y = edit.y + 14; if (x + w > innerWidth - 8) x = edit.x - w - 14; if (y + h > innerHeight - 8) y = Math.max(8, innerHeight - h - 8); ed.style.left = Math.max(8, x) + 'px'; ed.style.top = y + 'px'; }
  function fixRows(p) {
    if (p.err) return `<div class="fr bad">${ICON.warn}<span>${esc(p.err)}</span></div>`; const r = [];
    r.push(`<div class="fr set">${ICON.check}<span>${esc(KNOBNAME[p.knob] || p.knob)} <b>${r1(p.cur)} → ${r1(p.val)}</b></span><span class="gc">${p.members.length}</span></div>`);
    if (p.goes.length) r.push(`<div class="fr goes">${ICON.minus}<span>${p.goes.length} patch${p.goes.length > 1 ? 'es' : ''} removed everywhere</span></div>`);
    if (p.textEdge > 0.5) r.push(`<label class="fr opt"><input type="checkbox" data-act="etrim"${edit && edit.trim ? ' checked' : ''}><span>trim the letters' box (−${r1(p.textEdge)})</span></label>`);
    if (!p.onList) r.push(`<div class="fr warn">${ICON.warn}<span>${r1(p.val)} is off your list</span></div>`);
    if (p.outliers.length) r.push(`<div class="fr warn">${ICON.warn}<span>${p.outliers.length} of ${p.members.length} would still differ</span></div>`);
    return r.join('');
  }
  function centreRows(c) {
    if (c.err) return `<div class="fr bad">${ICON.warn}<span>${esc(c.err)}</span></div>`; const r = [];
    r.push(Math.abs(c.off) <= 0.25 ? `<div class="fr set">${ICON.check}<span>already centred</span></div>` : `<div class="fr warn">${ICON.warn}<span>${r1(Math.abs(c.off))}px ${c.off > 0 ? 'high' : 'low'}</span></div>`);
    for (const w of c.wrappers) r.push(`<div class="fr set">${ICON.check}<span>${esc(M().label(w))}: line up by the middle</span></div>`);
    for (const q of c.selfs) r.push(`<div class="fr goes">${ICON.minus}<span>${esc(M().label(q))}: its own alignment removed</span></div>`);
    if (c.unblock) r.push(`<div class="fr set">${ICON.check}<span>make its letters box work (a plain box)</span></div>`);
    if (c.trim) r.push(`<div class="fr set">${ICON.check}<span>trim its letters' box</span><span class="gc">${c.trimN}</span></div>`);
    if (c.goes.length) r.push(`<div class="fr goes">${ICON.minus}<span>${c.goes.length} patch${c.goes.length > 1 ? 'es' : ''} removed</span></div>`);
    for (const f of c.finds) r.push(`<div class="fr warn">${ICON.warn}<span>${esc(f)}</span></div>`);
    return r.join('');
  }
  function renderEditor() {
    if (!edit || !ed) return; const d = currentDists()[edit.i]; if (!d) { closeEditor(); return; } const p = planDist(d, edit.want, edit.trim);
    const P = d.pieces.filter((q) => Math.abs(q.px) >= 0.25); const tot = P.reduce((sm, q) => sm + Math.abs(q.px), 0) || 1; const rl = P.map((q) => pieceRole(q, d, p.P)); const near = S().lists.space.filter((x) => Math.abs(x - d.total) <= 12);
    let h = `<div class="eh"><div><div class="big">${r1(d.total)}<span class="u">px</span></div><div class="btw">${esc(M().label(d.a))} → ${esc(d.b ? M().label(d.b) : `its box's ${d.side} edge`)}</div></div><button class="ib" data-act="eclose" title="Close (Esc)">${ICON.x}</button></div>`;
    h += `<div class="bar">${P.map((q, i) => { const w = (Math.abs(q.px) / tot) * 100; return `<i style="flex:${w.toFixed(2)} 1 0;background:${ROLE[rl[i]][1]}">${w >= 11 ? r1(q.px) : ''}</i>`; }).join('')}</div>`;
    h += `<ol class="pc">${P.map((q, i) => `<li><span class="sw" style="background:${ROLE[rl[i]][1]}"></span><span class="n">${r1(q.px)}</span><span class="lb">${esc(q.label)}</span><span class="rl ${rl[i]}">${ROLE[rl[i]][0]}</span></li>`).join('')}</ol>`;
    h += `<div class="wantrow"><span class="kname">Make it</span><button class="ib" data-act="wdn" title="1px less">${ICON.minus}</button><input type="number" class="win" step="1" min="0" value="${edit.want}"><button class="ib" data-act="wup" title="1px more">${ICON.plus}</button></div><div class="chips">${near.map((x) => `<button class="lc${x === edit.want ? '' : ' off'}" data-act="wset" data-v="${x}">${x}</button>`).join('')}</div>`;
    if (p.warn) h += `<div class="acts fnd"><span class="stat warn">${ICON.split}${esc(p.warn)}</span></div>`;
    h += `<div class="fix">${fixRows(p)}</div><div class="acts"><span class="sp"></span><button class="primary" data-act="eapply"${p.err ? ' disabled' : ''}>Set to ${edit.want}</button></div>`;
    if (d.kind === 'inside' && d.axis === 'y') { const cp = centrePlan(d); h += `<div class="cen"><div class="kh"><span class="dot" style="background:${COL.text}"></span><span class="kname">Centre in its box</span><span class="vs">${r1(cp.up)} / ${r1(cp.dn)}</span></div><div class="fix">${centreRows(cp)}</div><div class="acts"><span class="sp"></span><button data-act="ecentre"${cp.any ? '' : ' disabled'}>Centre</button></div></div>`; }
    ed.innerHTML = h; ed.hidden = false; placeEd();
  }
  api.ui.dists = () => currentDists().map((d) => ({ ...d }));
  api.ui.planDist = (i, W, trim) => { const d = currentDists()[i]; return d ? planDist(d, W, trim) : null; };
  api.ui.applyDist = (i, W, trim) => applyDist(i, W, trim);
  api.ui.centrePlan = (i) => { const d = currentDists()[i]; return d ? centrePlan(d) : null; };
  api.ui.applyCentre = (i) => applyCentre(i);
  api.ui.openEditor = (i) => openEditor(i);

  // ── overlay ──
  function recompute() {
    const g = M().gateEl(curGate); if (!g) return;
    cache.miss = layers.miss ? missFor(g) : null; cache.cols = layers.columns ? M().columns(g) : null; cache.divs = layers.dividers ? M().dividers(g) : null; cache.corners = layers.corners ? M().corners(g) : null;
  }
  api.ui.recompute = recompute;
  // near-misses per gate, worked out when the page or the standard changes and never on a scroll; drawn for every gate on screen
  const missBy = new Map(); let lastMS = [], lastShown = [];
  function missFor(g) { const ep = `${lastMut}:${S().state.at}:${S().compare}`; let c = missBy.get(g.id); if (!c || c.ep !== ep) { c = { ep, val: M().nearMisses(g, { pairs: false }) }; missBy.set(g.id, c); } return c.val; }
  function setMiss(on) { layers.miss = !!on; try { localStorage.setItem('bd-miss', on ? '1' : '0'); } catch (e) {} recompute(); renderStart(); draw(); refreshPop(); say(on ? 'Near-misses on · N hides them' : 'Near-misses off · N shows them'); }
  function drawSpace(s, parts, pillAt = pill) {
    if (s.kids) { const K = s.kids.filter((k) => k.isConnected).map((k) => M().seen(k)); for (let i = 1; i < K.length; i++) { const a = K[i - 1], z = K[i]; if (s.axis === 'x') { const y = Math.max(a.bottom, z.bottom) + 4; parts.push(Lz(a.right, y, z.left, y, COL.miss, 1.5)); parts.push(`<text x="${(a.right + z.left) / 2 - 6}" y="${y + 11}" fill="${COL.miss}">${s.gaps[i - 1]}</text>`); } else { const x = Math.max(a.right, z.right) + 4; parts.push(Lz(x, a.bottom, x, z.top, COL.miss, 1.5)); parts.push(`<text x="${x + 4}" y="${(a.bottom + z.top) / 2 + 4}" fill="${COL.miss}">${s.gaps[i - 1]}</text>`); } } }
    else for (let i = 0; i < s.els.length; i++) { const el = s.els[i]; if (!el.isConnected) continue; const r = el.getBoundingClientRect(); if (!onScreen(r)) continue; parts.push(R(r, COL.miss, 1, '4 3')); parts.push(`<g class="nm">${pillAt(r.left, r.top, `${s.prop} ${fmt(s.vals[i])}`, COL.miss)}</g>`); }
  }
  const onScreen = (r) => r && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  const R = (r, stroke, w = 1, dash = '', fill = 'none') => `<rect x="${r.left}" y="${r.top}" width="${Math.max(0, r.width)}" height="${Math.max(0, r.height)}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
  const Lz = (x1, y1, x2, y2, c, w = 1, dash = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
  function pill(x, y, t, c, ink = '#0b1014') { const w = String(t).length * 6.1 + 10; return `<rect x="${x}" y="${y - 13}" width="${w}" height="16" rx="4" fill="${c}"/><text x="${x + 5}" y="${y - 1.5}" fill="${ink}">${esc(t)}</text>`; }
  const MARKED = new Set(['padL', 'padR', 'padT', 'padB', 'padY', 'padX', 'gap', 'height', 'radius', 'icon', 'size', 'fs']);
  const op = (kk) => (focusK && MARKED.has(focusK) && kk !== focusK ? 0.16 : 1);
  const r1 = (x) => fmt(Math.round(x * 10) / 10);
  const tagW = (t) => String(t).length * 6.1 + 10;
  function tag(x, y, t, c) { const w = tagW(t); return `<rect x="${x - w / 2}" y="${y - 8}" width="${w}" height="16" rx="4" fill="${c}"/><text x="${x}" y="${y + 3.6}" text-anchor="middle" fill="#0b1014">${esc(t)}</text>`; }
  const textEl = (el) => { const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.nodeValue.trim() && !(n.parentElement && n.parentElement.closest('svg')) ? 1 : 3) }); const n = tw.nextNode(); return n ? n.parentElement : null; };
  // the numbers of the selected thing, drawn where they apply: space inside on its edges, space between in its gaps, its size on dimension lines,
  // its corner on the corner, its icon under the icon, its text size beside the letters (Harkirat, 2026-10-03 15:07 EDT: "it's saying 12px/14px/16px
  // but wtf do those even represent? i'm not seeing them on the actual surface"). A thing being pointed at gets the bands without numbers.
  const placer = () => { const placed = []; return (x, y, t, col, offs = [0, 18, -18, 36, -36, 54]) => { const w = tagW(t); let yy = y; for (const o of offs) { yy = y + o; if (!placed.some((p) => Math.abs(p.x - x) < (p.w + w) / 2 + 2 && Math.abs(p.y - yy) < 17)) break; } placed.push({ x, y: yy, w }); return tag(x, yy, t, col); }; };
  function marks(el, parts, strong, put = placer()) {
    const k = M().kindOf(el) || 'box', ctl = k === 'control'; const c = getComputedStyle(el); const r = el.getBoundingClientRect(); const vb = M().visibleBox(el); const drawn = (ctl || k === 'box' || (k === 'layout' && S().slotAt(el, 1))) && M().descends && M().descends(); const T = drawn ? M().paintTarget(el) : null; const vr = k === 'icon' ? M().iconBox(el) : drawn ? M().seen(el) : vb ? vb.rect : r;
    const P = (q) => M().px(c['padding' + q]), Bw = (q) => M().px(c['border' + q + 'Width']); const pt = P('Top'), pr = P('Right'), pb = P('Bottom'), pl = P('Left');
    const iL = r.left + Bw('Left'), iT = r.top + Bw('Top'), iR = r.right - Bw('Right'), iB = r.bottom - Bw('Bottom'); const KP = ctl ? ['', 'padR', '', 'padL'] : ['padT', 'padR', 'padB', 'padL']; let nT = 0;
    const band = (x, y, w, h, col, kk, val, side) => { if (w < 0.25 || h < 0.25) return; let t = ''; if (strong && nT < 40 && val >= 0.5) { nT++; const lab = r1(val), tw = tagW(lab); const fits = side === 'l' || side === 'r' || side === 'g' ? w >= tw + 2 && h >= 14 : h >= 16 && w >= tw; let cx = x + w / 2, cy = y + h / 2; if (!fits) { if (side === 't') cy = r.top - 9; else if (side === 'b' || side === 'g') cy = r.bottom + 10; else if (side === 'l') cx = r.left - tw / 2 - 3; else cx = r.right + tw / 2 + 3; } t = put(cx, cy, lab, col, fits ? undefined : side === 't' ? [0, -18, -36] : side === 'b' || side === 'g' ? [0, 18, 36] : [0, 18, 36, -18]); } parts.push(`<g opacity="${op(kk)}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${tint(col, 0.3)}"/>${t}</g>`); };
    // a control or a box: the four spaces inside and the spaces between its pieces, all on drawn lines (bd/measure.js inside() and gaps()), so the
    // left space and the top space are measured to the same thing, and a gap runs from an icon's lines to the letters, never from its box
    const D = drawn ? M().inside(el) : null;
    if (layers.space && D) {
      const I = D.inner, W = D.ink, KH = ctl ? 'height' : 'padT', KHB = ctl ? 'height' : 'padB', KL = 'padL', KR = 'padR';
      band(I.left, I.top, I.width, W.top - I.top, COL.in, KH, D.top, 't'); band(I.left, W.bottom, I.width, I.bottom - W.bottom, COL.in, KHB, D.bottom, 'b');
      band(I.left, W.top, W.left - I.left, W.height, COL.in, KL, D.left, 'l'); band(W.right, W.top, I.right - W.right, W.height, COL.in, KR, D.right, 'r');
      const GG = k === 'layout' ? [1, 2, 3, 4, 5, 6].map((i) => S().slotAt(el, i)).filter(Boolean).map((sl, i) => ({ a: { rect: sl.ra }, b: { rect: sl.rb }, px: sl.g, axis: sl.prop === 'margin-top' ? 'y' : 'x', k: 's' + (i + 1) })) : M().gaps(el, D);
      for (const g of GG) { const a = g.a.rect, z = g.b.rect; if (g.axis === 'x') { const t = Math.min(a.top, z.top), b = Math.max(a.bottom, z.bottom); band(a.right, t, g.px, b - t, COL.gap, g.k || 'gap', g.px, 'g'); } else { const l = Math.min(a.left, z.left), rr = Math.max(a.right, z.right); band(l, a.bottom, rr - l, g.px, COL.gap, g.k || 'gap', g.px, 'gv'); } }
    } else if (layers.space && k !== 'text' && k !== 'icon' && k !== 'divider') {
      band(iL, iT, iR - iL, pt, COL.in, KP[0], pt, 't'); band(iL, iB - pb, iR - iL, pb, COL.in, KP[2], pb, 'b'); band(iL, iT + pt, pl, iB - iT - pt - pb, COL.in, KP[3], pl, 'l'); band(iR - pr, iT + pt, pr, iB - iT - pt - pb, COL.in, KP[1], pr, 'r');
      const items = [...el.children].filter((x) => M().visible(x) && !/absolute|fixed/.test(getComputedStyle(x).position)).map((x) => x.getBoundingClientRect());
      for (const n of el.childNodes) if (n.nodeType === 3 && n.nodeValue.trim()) { const rg = document.createRange(); rg.selectNodeContents(n); const q = rg.getBoundingClientRect(); if (q.width > 0.5) items.push(q); }
      const vert = /flex/.test(c.display) ? /^column/.test(c.flexDirection) : /grid/.test(c.display) ? items.length > 1 && Math.abs(items[1].top - items[0].top) > 1 : !ctl && !/inline/.test(c.display);
      items.sort((a, b) => (vert ? a.top - b.top : a.left - b.left));
      for (let i = 1; i < items.length && i < 80; i++) { const a = items[i - 1], z = items[i];
        if (!vert && z.left - a.right > 0.25) { const t = Math.min(a.top, z.top), b = Math.max(a.bottom, z.bottom); band(a.right, t, z.left - a.right, b - t, COL.gap, 'gap', z.left - a.right, 'g'); }
        else if (vert && z.top - a.bottom > 0.25) { const l = Math.min(a.left, z.left), rr = Math.max(a.right, z.right); band(l, a.bottom, rr - l, z.top - a.bottom, COL.gap, 'gap', z.top - a.bottom, 'gv'); } }
    }
    if (!strong) return;
    // a word, a button or an icon gets a size badge like his own shots ("165w × 34h"), clear of the four measured spaces; a layout keeps its dimension lines
    if (layers.sizes && (k === 'text' || k === 'control' || k === 'icon')) { const t = `${r1(vr.width)}w × ${r1(vr.height)}h`; parts.push(`<g opacity="${op('height')}">${put(vr.right + tagW(t) / 2 + 4, vr.top - 11, t, COL.size, [0, -18, -36])}</g>`); }
    else if (layers.sizes && k !== 'divider') { const pb2 = panel && !panel.hidden ? panel.getBoundingClientRect() : null; const left = !!pb2 && vr.right + 50 > pb2.left && vr.bottom > pb2.top && vr.top < pb2.bottom; const y = vr.top - 10, x = left ? vr.left - 10 : vr.right + 10, wt = r1(vr.width), ht = r1(vr.height);
      parts.push(`<g opacity="${op('width')}"><path d="M${vr.left} ${y - 3}v6M${vr.left} ${y}H${vr.right}M${vr.right} ${y - 3}v6" stroke="${COL.size}" fill="none"/>${put((vr.left + vr.right) / 2, y, wt, COL.size, [0, -18, -36])}</g>`);
      parts.push(`<g opacity="${op('height')}"><path d="M${x - 3} ${vr.top}h6M${x} ${vr.top}V${vr.bottom}M${x - 3} ${vr.bottom}h6" stroke="${COL.size}" fill="none"/>${put(left ? x - 4 - tagW(ht) / 2 : x + 4 + tagW(ht) / 2, (vr.top + vr.bottom) / 2, ht, COL.size, [0, 18, 36, -18])}</g>`); }
    const rc = T && !T.bare ? getComputedStyle(T.el, T.part === 'self' ? null : T.part) : vb ? getComputedStyle(el, vb.part === 'self' ? null : vb.part) : null;
    if (rc && k !== 'icon') { const rad = M().px(rc.borderTopLeftRadius); if (rad >= 1) { const rr = Math.min(rad, vr.width / 2, vr.height / 2), x = vr.left, y = vr.top; parts.push(`<g opacity="${op('radius')}"><path d="M${x} ${y + rr}A${rr} ${rr} 0 0 1 ${x + rr} ${y}" fill="none" stroke="${COL.corner}" stroke-width="2.5"/>${put(x - 6 - tagW(r1(rad)) / 2, y + 8, r1(rad), COL.corner)}</g>`); } }
    const sv = k === 'icon' ? el : ctl ? el.querySelector('svg') || (M().placedIcon && M().placedIcon(el)) : null;
    // an icon's size bracket spans its drawn lines, not its box (Harkirat, 2026-10-05 11:54 EDT: "why is there empty spacing around the icon?")
    if (sv && M().visible(sv)) { const ib = M().iconBox(sv), w = Math.max(ib.width, ib.height), y = ib.bottom + 5, kk = k === 'icon' ? 'size' : 'icon'; parts.push(`<g opacity="${op(kk)}"><path d="M${ib.left} ${y - 3}v6M${ib.left} ${y}H${ib.right}M${ib.right} ${y - 3}v6" stroke="${COL.icon}" fill="none"/>${put((ib.left + ib.right) / 2, y + 12, r1(w), COL.icon, [0, 18, 36])}</g>`); }
    const te = k === 'text' ? el : ctl ? textEl(el) : null; const lt = te && M().letters(k === 'text' ? el : te);
    if (lt && focusK === 'fs') { const fs = r1(M().px(getComputedStyle(te).fontSize)); if (k === 'text') { const x = lt.left - 7; parts.push(`<g opacity="${op('fs')}"><path d="M${x - 3} ${lt.top}h6M${x} ${lt.top}V${lt.bottom}M${x - 3} ${lt.bottom}h6" stroke="${COL.text}" fill="none"/>${put(x - 5 - tagW(fs) / 2, (lt.top + lt.bottom) / 2, fs, COL.text)}</g>`); } else if (focusK === 'fs') parts.push(`<path d="M${lt.left - 5} ${lt.top}h6M${lt.left - 2} ${lt.top}V${lt.bottom}M${lt.left - 5} ${lt.bottom}h6" stroke="${COL.text}" fill="none"/>${put(lt.left - 8 - tagW(fs) / 2, (lt.top + lt.bottom) / 2, fs, COL.text, [0, -18, 18])}`); }
  }
  function draw() { if (!svg) return; cancelAnimationFrame(drawRaf); drawRaf = requestAnimationFrame(drawNow); }
  api.ui.draw = () => drawNow();
  function drawNow() { M().atRest();
    const W = innerWidth, H = innerHeight; svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', `0 0 ${W} ${H}`); const parts = []; const put = placer();
    lastShown = []; const pp = [];
    const pillAt = (x, y, t, c) => { const w = String(t).length * 6.1 + 10; let yy = y; for (const o of [0, -18, -36, 18]) { yy = y + o; if (!pp.some((p) => x < p.x + p.w + 2 && p.x < x + w + 2 && Math.abs(p.y - yy) < 17)) break; } pp.push({ x, y: yy, w }); return pill(x, yy, t, c); };
    if (layers.miss) {
      const MS = []; const rowsDrawn = new Set();
      for (const id of Object.keys(M().GATES)) { const g = document.getElementById(id); if (!g) continue; const gr = g.getBoundingClientRect(); if (gr.bottom < 0 || gr.top > H) continue; const mm = missFor(g); MS.push(...mm.lines); for (const sp of mm.spaces) drawSpace(sp, parts, pillAt); }
      lastMS = MS;
      MS.forEach((m, i) => {
        if (!m.a.isConnected || (m.b && !m.b.isConnected) || (m.row && !m.row.isConnected)) return; if (sel.length === 1 && [m.a, m.b].some((x) => x && (x === sel[0] || sel[0].contains(x)))) return;
        const ra = M().seen(m.a); if (!onScreen(ra)) return; lastShown.push(m.a);
        if (m.row) {
          // nothing drawn through the words: the row's middle as ticks at its two ends, and beside each thing that is off, its own middle and the
          // row's joined by a bracket; the label above the thing says how far and which way
          const rc = m.row.getBoundingClientRect(), c = getComputedStyle(m.row); const mid = (rc.top + M().px(c.borderTopWidth) + M().px(c.paddingTop) + rc.bottom - M().px(c.borderBottomWidth) - M().px(c.paddingBottom)) / 2, my = (ra.top + ra.bottom) / 2;
          if (!rowsDrawn.has(m.row)) { rowsDrawn.add(m.row); parts.push(Lz(rc.left - 9, mid, rc.left - 2, mid, COL.miss, 2), Lz(rc.right + 2, mid, rc.right + 9, mid, COL.miss, 2)); }
          if (missFocus === i) parts.push(R(ra, COL.miss, 1, '3 2'), Lz(rc.left, mid, rc.right, mid, COL.miss, 1, '3 3'));
          parts.push(Lz(ra.right + 2, my, ra.right + 8, my, COL.miss, 2), Lz(ra.right + 2, mid, ra.right + 8, mid, COL.miss, 1, '2 1'), Lz(ra.right + 8, Math.min(my, mid), ra.right + 8, Math.max(my, mid), COL.miss, 1.5));
          parts.push(`<g class="hit" data-mi="${i}"><title>${esc(`${M().label(m.a)}'s middle sits ${m.d}px ${m.dir === 'high' ? 'above' : 'below'} its row's middle`)}</title>${pillAt(ra.left, ra.top - 5, `${m.d}px ${m.dir}`, COL.miss)}</g>`);
        } else {
          const rb = M().seen(m.b); const [Pp, Qr, pe, qe] = ra.top <= rb.top ? [ra, rb, m.a, m.b] : [rb, ra, m.b, m.a]; const yb = Qr.bottom + 8, dir = Qr.left > Pp.left ? 'right' : 'left'; if (missFocus === i) parts.push(R(ra, COL.miss, 1, '3 2'), R(rb, COL.miss, 1, '3 2'));
          parts.push(Lz(Pp.left, Pp.top, Pp.left, yb + 6, COL.miss, 1.25, '3 2'), Lz(Qr.left, Qr.top, Qr.left, yb + 6, COL.miss, 1.5), Lz(Math.min(Pp.left, Qr.left) - 3, yb + 6, Math.max(Pp.left, Qr.left) + 3, yb + 6, COL.miss, 1.5));
          parts.push(`<g class="hit" data-mi="${i}"><title>${esc(`${M().label(qe)}'s left edge sits ${m.d}px to the ${dir} of ${M().label(pe)}'s`)}</title>${pillAt(Math.max(Pp.left, Qr.left) + 8, yb + 20, `${m.d}px to the ${dir}`, COL.miss)}</g>`);
        }
      });
    }
    if (layers.columns && cache.cols) for (const set of cache.cols) { const pr = set.p.getBoundingClientRect(); if (!onScreen(pr)) continue; for (const c of set.cols) { parts.push(Lz(c.x, pr.top, c.x, pr.bottom, COL.col, 1, '5 4')); for (const m of c.misses) { const r = M().seen(m); parts.push(Lz(r.left, r.top, r.left, r.bottom, COL.miss, 2)); parts.push(pill(r.left + 3, r.top, `${fmt(Math.abs(r.left - c.x))}px off its column`, COL.miss)); } } }
    if (layers.dividers && cache.divs) for (const d of cache.divs) { const r = d.r || d.el.getBoundingClientRect(); if (!onScreen(r)) continue; parts.push(pill(r.left, r.top, `${d.kind} · ${fmt(d.t)}`, '#cfd7de')); }
    if (layers.corners && cache.corners) for (const c of cache.corners) { const r = M().seen(c.el); if (!onScreen(r)) continue; parts.push(R(r, COL.miss, 1, '2 2')); parts.push(pill(r.left, r.top, `corner ${fmt(c.ri)}, wants ${fmt(c.want)} inside ${fmt(c.ro)}`, COL.miss)); }
    if (showLooks || peekKey) looks.forEach((l, i) => { if (!showLooks && peekKey !== `${l.tier}|${l.gate}` && peekKey !== 'i' + i) return; if (!l.el.isConnected) return; const r = M().seen(l.el); if (!onScreen(r)) return; parts.push(R(r, COL.look, ticked.has(i) ? 2 : 1.25, l.tier === 'family' ? '5 3' : '')); });
    if (showMembers) { const v = S().get(showMembers); if (v) for (const el of S().elsOf(v)) { const r = M().seen(el); if (onScreen(r)) parts.push(R(r, COL.look, 1.5)); } }
    for (const el of sel) { if (!el.isConnected) continue; const r = M().seen(el); if (!onScreen(r)) continue; if (sel.length === 1) marks(el, parts, true, put); parts.push(R(r, COL.sel, 1.5)); { const ink = M().kindOf(el) === 'text' ? M().letters(el) : null; if (ink && ink.width < r.width - 1) parts.push(R(ink, COL.sel, 0.75, '2 2')); } if (layers.sizes && sel.length > 1) parts.push(pill(r.left, r.top - 2, `${fmt(r.width)} × ${fmt(r.height)}`, COL.sel)); }
    if (sel.length === 1 && layers.space) drawDists(parts, put);
    // a red badge on every member of the selected variant that can't show its value; pointing at one says which value and why
    if (sel.length === 1) for (const [el, why] of badMap) { if (!el.isConnected) continue; const r = M().seen(el); if (!onScreen(r)) continue; const x = r.right, y = r.top; parts.push(`<g class="hit" data-bad="1"><title>${esc(why.join('\n'))}</title><circle cx="${x}" cy="${y}" r="7" fill="${COL.bad}" stroke="#0b1014" stroke-width="1.5"/><path d="M${x} ${y - 3.6}v3.8" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><circle cx="${x}" cy="${y + 2.9}" r="1.1" fill="#fff"/></g>`); }
    if (hoverEl && !sel.includes(hoverEl) && hoverEl.isConnected) { const r = M().seen(hoverEl); if (!breakdown) marks(hoverEl, parts, false, put); parts.push(R(r, COL.hover, 1)); if (layers.sizes && !breakdown) parts.push(pill(r.left, r.bottom + 16, `${fmt(r.width)} × ${fmt(r.height)}`, COL.hover)); }
    if (breakdown) { const b = breakdown; const X = b.axis === 'x'; if (X) { const y = (Math.max(b.ra.top, b.rb.top) + Math.min(b.ra.bottom, b.rb.bottom)) / 2; parts.push(Lz(b.ra.right, y, b.rb.left, y, COL.hover, 1.5), Lz(b.ra.right, y - 5, b.ra.right, y + 5, COL.hover, 1.5), Lz(b.rb.left, y - 5, b.rb.left, y + 5, COL.hover, 1.5)); } else { const x = (Math.max(b.ra.left, b.rb.left) + Math.min(b.ra.right, b.rb.right)) / 2; parts.push(Lz(x, b.ra.bottom, x, b.rb.top, COL.hover, 1.5), Lz(x - 5, b.ra.bottom, x + 5, b.ra.bottom, COL.hover, 1.5), Lz(x - 5, b.rb.top, x + 5, b.rb.top, COL.hover, 1.5)); } }
    // things jumped to flash; a variant's extra margins, and its members numbered by how they're built, drawn on the page while their chips are on
    { const now = performance.now(); for (let i = flashes.length - 1; i >= 0; i--) { const fl = flashes[i]; if (fl.until < now || !fl.el.isConnected) { flashes.splice(i, 1); continue; } const r = M().seen(fl.el); if (onScreen(r)) parts.push(`<g data-flash="1">${R({ left: r.left - 3, top: r.top - 3, width: r.width + 6, height: r.height + 6 }, '#ffffff', 2.5)}</g>`); } }
    if (showPatch) { const v = S().get(showPatch); if (v) { const p = patches(v); for (const el of S().elsOf(v)) for (const k of el.children) { if (!p.items.some((it) => { try { return k.matches(it.sel); } catch (x) { return false; } })) continue; const r = k.getBoundingClientRect(); if (!onScreen(r)) continue; const c = getComputedStyle(k); const ml = M().px(c.marginLeft), mr = M().px(c.marginRight), mt = M().px(c.marginTop), mb = M().px(c.marginBottom); for (const [m, x, y, w, hh] of [[ml, r.left - Math.max(ml, 0), r.top, Math.abs(ml), r.height], [mr, r.right + Math.min(mr, 0), r.top, Math.abs(mr), r.height], [mt, r.left, r.top - Math.max(mt, 0), r.width, Math.abs(mt)], [mb, r.left, r.bottom + Math.min(mb, 0), r.width, Math.abs(mb)]]) { if (Math.abs(m) < 0.25) continue; parts.push(`<g data-patch="1">${R({ left: x, top: y, width: w, height: hh }, COL.miss, 1, m < 0 ? '2 2' : '', tint(COL.miss, 0.35))}${tag(x + w / 2, y - 9, r1(m), COL.miss)}</g>`); } } } }
    if (showBuilt) { const v = S().get(showBuilt); if (v) { const shape = (e) => [...e.children].map((c) => c.tagName.toLowerCase() + (c.children.length ? `(${c.children.length})` : '')).join(' '); const idx = new Map(); for (const el of S().elsOf(v)) { const k = shape(el); if (!idx.has(k)) idx.set(k, idx.size + 1); const r = M().seen(el); if (onScreen(r)) parts.push(`<g data-built="1">${tag(r.left + 10, r.top + 8, String(idx.get(k)), COL.corner)}</g>`); } } }
    if (BD.guides) { try { parts.push(BD.guides.svg({ Lz, pill: pillAt, H })); } catch (err) { console.error(err); } }
    svg.innerHTML = parts.join(''); renderCard();
  }
  const PIECE = { edge: '#6f7c87', margin: '#ffb36b', patch: '#ff6fae', padding: COL.in, border: COL.corner, gap: COL.gap, leftover: '#d7c48a', between: COL.look };
  const pcol = (p) => (p.kind === 'leftover' && p.from === 'unexplained' ? COL.bad : PIECE[p.kind] || '#8995a0');
  // the space between two things: the total, a bar split into its pieces, one row per piece
  function renderCard() {
    if (!breakdown) { card.hidden = true; return; } const b = breakdown; const P = b.pieces.filter((p) => Math.abs(p.px) >= 0.25); const tot = P.reduce((q, p) => q + Math.abs(p.px), 0) || 1;
    card.innerHTML = `<div class="big">${fmt(b.total)}<span class="u">px</span></div><div class="btw">${esc(M().label(b.a))} → ${esc(M().label(b.b))}</div><div class="bar">${P.map((p) => { const w = (Math.abs(p.px) / tot) * 100; return `<i style="flex:${w.toFixed(2)} 1 0;background:${pcol(p)}">${w >= 11 ? fmt(p.px) : ''}</i>`; }).join('')}</div><ol>${P.map((p) => `<li><span class="sw" style="background:${pcol(p)}"></span><span class="n">${fmt(p.px)}</span><span class="lb">${esc(p.label)}${p.from && p.from !== 'unexplained' ? `<span class="f">${esc(p.from)}</span>` : ''}</span></li>`).join('')}</ol>${Math.abs(b.sum - b.total) > 0.5 ? `<div class="sum bad">${ICON.warn}the pieces add up to ${fmt(b.sum)}</div>` : ''}${b.unexplained > 0.5 ? `<div class="sum bad">${ICON.warn}${fmt(b.unexplained)} px nothing explains yet</div>` : ''}`;
    card.hidden = false; placeCard();
  }
  function placeCard() { if (card.hidden) return; const w = 320, h = card.offsetHeight || 200; let x = lastPt[0] + 18, y = lastPt[1] + 18; if (x + w > innerWidth - 8) x = lastPt[0] - w - 18; if (y + h > innerHeight - 8) y = Math.max(8, innerHeight - h - 8); card.style.left = x + 'px'; card.style.top = y + 'px'; }
})();
