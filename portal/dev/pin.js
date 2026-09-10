// portal/dev/pin.js — the annotation overlay, mounted INSIDE the dev portal.
//
// 🔴 WHY IT LIVES IN THE PAGE RATHER THAN BESIDE IT. `scripts/portalSync.mjs` puts the mockup and the portal side by side and pins by COORDINATE, which is right for comparing two designs and wrong for annotating one running app: a coordinate moves when anything above it re-renders, and half the screen is spent on a mockup you are not commenting on. Harkirat, 2026-09-09 21:39 EDT: *"i dont want it running side by side, i just want it running as an overlay over the dev-portal. and i also want the pin selection to actually show me the element I am highlighting/setting the pin on. a selection visual box or something."*
//
// 🔴 AND IT CANNOT BE A PROXY, WHICH IS THE FIRST THING ANYONE WILL TRY. `portal/auth.js` derives the origin from the REQUEST — the session cookie is host-only by design, and the OAuth `redirect_uri` must be an origin actually registered on the Discord application. Serving the live portal under another origin therefore breaks sign-in and would need a new redirect URI registered, which is Harkirat's to do. Mounted in the page there is no second origin at all.
//
// ⚠️ DEV ONLY, ENFORCED BY THE SERVER. `portal/server.js` serves this file and accepts its notes only when `NODE_ENV !== 'production'`, and injects the script tag on the same condition. Nothing here ships.
(function () {
    if (window.__dioreoPin) return;                       // a reload of the SPA must not mount two overlays
    window.__dioreoPin = true;

    var ON = false, frozen = null, count = 0;
    var css = document.createElement('style');
    css.textContent = [
        '#__pinbar{position:fixed;right:14px;bottom:14px;z-index:2147483000;display:flex;gap:8px;align-items:center;',
        '  background:#141A1F;border:1px solid #2A343D;border-radius:9px;padding:8px 10px;font:600 12px/1 ui-sans-serif,system-ui,sans-serif;color:#9DAAB4;box-shadow:0 10px 34px rgba(0,0,0,.6)}',
        '#__pinbar button{font:inherit;padding:6px 10px;border-radius:6px;border:1px solid #3A4752;background:transparent;color:#E8EDF1;cursor:pointer}',
        '#__pinbar button.on{background:#FF5D3B;border-color:#FF5D3B;color:#fff}',
        '#__pinbox{position:fixed;z-index:2147482000;pointer-events:none;border:2px solid #FF5D3B;border-radius:3px;background:rgba(255,93,59,.10);display:none}',
        '#__pinlab{position:fixed;z-index:2147482001;pointer-events:none;background:#FF5D3B;color:#fff;font:600 10.5px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;padding:3px 6px;border-radius:3px;white-space:nowrap;display:none;max-width:60vw;overflow:hidden;text-overflow:ellipsis}',
        '#__pinpop{position:fixed;z-index:2147483001;width:320px;background:#141A1F;border:1px solid #FF5D3B;border-radius:9px;padding:11px;display:none;box-shadow:0 14px 40px rgba(0,0,0,.7);font:400 13px/1.5 ui-sans-serif,system-ui,sans-serif;color:#E8EDF1}',
        '#__pinpop .sel{font:600 10.5px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;color:#FF9F45;word-break:break-all;margin-bottom:7px}',
        '#__pinpop textarea{width:100%;height:86px;background:#0B0F12;border:1px solid #3A4752;border-radius:6px;color:#E8EDF1;font:inherit;padding:7px;resize:vertical}',
        '#__pinpop .row{display:flex;gap:7px;margin-top:8px}',
        '#__pinpop .row button{flex:1;font:600 12px/1 ui-sans-serif,system-ui,sans-serif;padding:8px;border-radius:6px;border:1px solid #3A4752;background:transparent;color:#E8EDF1;cursor:pointer}',
        '#__pinpop .row button.save{background:#FF5D3B;border-color:#FF5D3B;color:#fff}',
        'body.__pinning, body.__pinning *{cursor:crosshair !important}',
    ].join('\n');
    document.head.appendChild(css);

    var bar = el('div', '__pinbar');
    var btn = document.createElement('button'); btn.textContent = '📍 pin mode OFF';
    var tally = document.createElement('span'); tally.textContent = '0 pins';
    bar.appendChild(btn); bar.appendChild(tally); document.body.appendChild(bar);
    var box = el('div', '__pinbox'), lab = el('div', '__pinlab'), pop = el('div', '__pinpop');
    document.body.appendChild(box); document.body.appendChild(lab); document.body.appendChild(pop);
    pop.innerHTML = '<div class="sel" id="__pinsel"></div><textarea id="__pintext" placeholder="What is wrong here?"></textarea>'
        + '<div class="row"><button class="save" id="__pinsave">Save pin</button><button id="__pincancel">Cancel</button></div>';

    function el(tag, id) { var n = document.createElement(tag); n.id = id; return n; }
    function mine(n) { return !!(n && n.closest && n.closest('#__pinbar,#__pinpop,#__pinbox,#__pinlab')); }

    // 🔴 A SELECTOR THAT SURVIVES A RE-RENDER, which a coordinate does not. Walk up to four levels, preferring an id, then tag+classes, and add :nth-of-type only where the path is still ambiguous. Capped because a full path from <html> is both unreadable and MORE fragile — every wrapper between here and the root becomes a way for it to break.
    function selectorFor(n) {
        var parts = [], depth = 0;
        while (n && n.nodeType === 1 && n !== document.body && depth < 4) {
            if (n.id) { parts.unshift('#' + n.id); break; }
            var s = n.tagName.toLowerCase();
            var cls = (typeof n.className === 'string' ? n.className : '').trim();
            if (cls) s += '.' + cls.split(/\s+/).slice(0, 3).join('.');
            var sibs = n.parentElement ? [].filter.call(n.parentElement.children, function (c) { return c.tagName === n.tagName; }) : [];
            if (sibs.length > 1) s += ':nth-of-type(' + ([].indexOf.call(n.parentElement.children, n) + 1) + ')';
            parts.unshift(s); n = n.parentElement; depth++;
        }
        return parts.join(' > ');
    }
    function label(n) {
        var r = n.getBoundingClientRect();
        return selectorFor(n).split(' > ').pop() + '  ' + Math.round(r.width) + '×' + Math.round(r.height);
    }
    function draw(n) {
        var r = n.getBoundingClientRect();
        box.style.cssText += ';display:block;left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px';
        lab.textContent = label(n);
        lab.style.display = 'block';
        lab.style.left = Math.max(4, r.left) + 'px';
        lab.style.top = (r.top > 22 ? r.top - 20 : r.bottom + 4) + 'px';
    }
    function hide() { box.style.display = 'none'; lab.style.display = 'none'; }

    function setMode(on) {
        ON = on; frozen = null; hide(); pop.style.display = 'none';
        btn.classList.toggle('on', on);
        btn.textContent = on ? '📍 pin mode ON — click an element' : '📍 pin mode OFF';
        document.body.classList.toggle('__pinning', on);
    }
    btn.addEventListener('click', function (e) { e.stopPropagation(); setMode(!ON); });

    document.addEventListener('mousemove', function (e) {
        if (!ON || frozen) return;
        var n = document.elementFromPoint(e.clientX, e.clientY);
        if (!n || mine(n)) return hide();
        draw(n);
    }, true);

    // Capture phase, and it must be: the portal's own handlers open drawers and stage changes, and a pin is not a click on the app.
    document.addEventListener('click', function (e) {
        if (!ON || mine(e.target)) return;
        e.preventDefault(); e.stopPropagation();
        frozen = e.target;
        draw(frozen);
        document.getElementById('__pinsel').textContent = selectorFor(frozen);
        var r = frozen.getBoundingClientRect();
        pop.style.display = 'block';
        pop.style.left = Math.min(window.innerWidth - 336, Math.max(8, r.left)) + 'px';
        pop.style.top = Math.min(window.innerHeight - 210, r.bottom + 8) + 'px';
        document.getElementById('__pintext').value = '';
        document.getElementById('__pintext').focus();
    }, true);

    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ON) setMode(false); }, true);
    pop.addEventListener('click', function (e) { e.stopPropagation(); }, true);
    document.getElementById('__pincancel').addEventListener('click', function () { frozen = null; pop.style.display = 'none'; hide(); });
    document.getElementById('__pinsave').addEventListener('click', async function () {
        var text = document.getElementById('__pintext').value.trim();
        if (!text || !frozen) return;
        var r = frozen.getBoundingClientRect();
        var app = document.querySelector('.app');
        await fetch('/__pin/note', {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                realm: (app && app.dataset.realm) || 'unknown',
                route: location.hash || '#/',
                selector: selectorFor(frozen),
                shows: (frozen.textContent || '').trim().slice(0, 120),
                rect: Math.round(r.width) + '×' + Math.round(r.height) + ' at ' + Math.round(r.left) + ',' + Math.round(r.top),
                text: text,
            }),
        }).catch(function () {});
        count++; tally.textContent = count + (count === 1 ? ' pin' : ' pins');
        frozen = null; pop.style.display = 'none'; hide();
    });
})();
