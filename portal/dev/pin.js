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

    var ON = false, frozen = null, region = null, shotData = null, count = 0;
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
        '#__pinbox.region{border-style:dashed;background:rgba(95,212,232,.10);border-color:#5FD4E8}',
        '#__pinlab.region{background:#5FD4E8;color:#00151A}',
        '#__pinpop .shot{margin-top:8px;border:1px dashed #3A4752;border-radius:6px;padding:9px;text-align:center;',
        '  font:600 10.5px/1.4 ui-sans-serif,system-ui,sans-serif;color:#5C6A75;cursor:text}',
        '#__pinpop .shot.has{border-style:solid;border-color:#5FD4E8;color:#5FD4E8;padding:5px}',
        '#__pinpop .shot img{max-width:100%;border-radius:4px;display:block}',
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
        + '<div class="shot" id="__pinshot">\u2318\u21e7 4 to crop, then \u2318V here to attach it</div>'
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
        if (!ON) return;
        // A drag past six pixels is a REGION, and the box switches to a dashed cyan so the two kinds are never confused on screen.
        if (down && (Math.abs(e.clientX - down.x) > 6 || Math.abs(e.clientY - down.y) > 6)) {
            dragging = true;
            var l = Math.min(down.x, e.clientX), t = Math.min(down.y, e.clientY);
            var w = Math.abs(e.clientX - down.x), h = Math.abs(e.clientY - down.y);
            box.className = 'region'; lab.className = 'region';
            box.style.cssText += ';display:block;left:' + l + 'px;top:' + t + 'px;width:' + w + 'px;height:' + h + 'px';
            lab.textContent = 'region ' + Math.round(w) + '\u00d7' + Math.round(h);
            lab.style.display = 'block'; lab.style.left = Math.max(4, l) + 'px'; lab.style.top = (t > 22 ? t - 20 : t + h + 4) + 'px';
            return;
        }
        if (frozen || region) return;
        box.className = ''; lab.className = '';
        var n = document.elementFromPoint(e.clientX, e.clientY);
        if (!n || mine(n)) return hide();
        draw(n);
    }, true);

    // 🔴 BLANK SPACE IS ALWAYS SOME ELEMENT'S PADDING, GAP OR MARGIN, AND NAMING WHICH IS THE WHOLE ANSWER (2026-09-09 21:55 EDT). Harkirat: *"what if i want to annotate an area that doesn't fall within an element? such as a blank space area?"* A rectangle at x,y would send a reader hunting; the OWNER of the space plus its two neighbours is a line that can be acted on. The owner is the nearest common ancestor of what surrounds the region — not `elementFromPoint`, which in a gap returns the container but tells you nothing about what the gap is BETWEEN.
    function ancestors(n) { var a = []; while (n && n !== document.body) { a.push(n); n = n.parentElement; } return a; }
    function ownerOf(rect) {
        var pts = [[rect.left + 2, rect.top + 2], [rect.right - 2, rect.top + 2], [rect.left + 2, rect.bottom - 2],
            [rect.right - 2, rect.bottom - 2], [rect.left + rect.width / 2, rect.top + rect.height / 2]];
        var chains = pts.map(function (p) { var n = document.elementFromPoint(p[0], p[1]); return mine(n) ? [] : ancestors(n); }).filter(function (c) { return c.length; });
        if (!chains.length) return document.body;
        return chains[0].find(function (n) { return chains.every(function (c) { return c.indexOf(n) >= 0; }); }) || document.body;
    }
    function neighbour(rect, dx, dy) {
        var x = rect.left + rect.width / 2 + dx, y = rect.top + rect.height / 2 + dy;
        if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) return null;
        var n = document.elementFromPoint(x, y);
        return (!n || mine(n)) ? null : n;
    }
    function describeRegion(rect) {
        var own = ownerOf(rect), cs = getComputedStyle(own);
        var above = neighbour(rect, 0, -(rect.height / 2 + 6)), below = neighbour(rect, 0, rect.height / 2 + 6);
        var left = neighbour(rect, -(rect.width / 2 + 6), 0), right = neighbour(rect, rect.width / 2 + 6, 0);
        var one = function (n) { return n ? selectorFor(n).split(' > ').pop() + (n.textContent.trim() ? ' "' + n.textContent.trim().slice(0, 24) + '"' : '') : '\u2014'; };
        return {
            owner: selectorFor(own),
            spacing: 'padding ' + cs.padding + ' · gap ' + (cs.gap === 'normal' ? '\u2014' : cs.gap) + ' · margin ' + cs.margin,
            above: one(above), below: one(below), left: one(left), right: one(right),
        };
    }

    function openPop(anchorRect, selText) {
        document.getElementById('__pinsel').textContent = selText;
        pop.style.display = 'block';
        pop.style.left = Math.min(window.innerWidth - 336, Math.max(8, anchorRect.left)) + 'px';
        pop.style.top = Math.min(window.innerHeight - 300, anchorRect.bottom + 8) + 'px';
        shotData = null;
        var sz = document.getElementById('__pinshot');
        sz.className = 'shot'; sz.textContent = '\u2318\u21e7 4 to crop, then \u2318V here to attach it';
        document.getElementById('__pintext').value = '';
        document.getElementById('__pintext').focus();
    }

    // 🔴 EVERY PIN PATH RUNS ON MOUSEUP, NOT CLICK. A drag that starts on an element and ends in a gap fires a click on their common ancestor, so a click-driven tool cannot tell a pin from a region at all. `click` below only BLOCKS — the portal's own handlers open drawers and stage changes, and a pin must never be a click on the app.
    var down = null, dragging = false;
    document.addEventListener('mousedown', function (e) {
        if (!ON || mine(e.target)) return;
        e.preventDefault(); e.stopPropagation();
        down = { x: e.clientX, y: e.clientY, el: e.target }; dragging = false;
    }, true);
    document.addEventListener('mouseup', function (e) {
        if (!ON || !down || mine(e.target)) { down = null; return; }
        e.preventDefault(); e.stopPropagation();
        if (dragging) {
            var r = { left: Math.min(down.x, e.clientX), top: Math.min(down.y, e.clientY) };
            r.width = Math.abs(e.clientX - down.x); r.height = Math.abs(e.clientY - down.y);
            r.right = r.left + r.width; r.bottom = r.top + r.height;
            region = r; region.info = describeRegion(r); frozen = null;
            openPop(r, 'region ' + Math.round(r.width) + '\u00d7' + Math.round(r.height) + ' in ' + region.info.owner);
        } else {
            frozen = down.el; region = null; draw(frozen);
            openPop(frozen.getBoundingClientRect(), selectorFor(frozen));
        }
        down = null; dragging = false;
    }, true);
    document.addEventListener('click', function (e) { if (ON && !mine(e.target)) { e.preventDefault(); e.stopPropagation(); } }, true);

    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ON) setMode(false); }, true);
    pop.addEventListener('click', function (e) { e.stopPropagation(); }, true);
    document.getElementById('__pincancel').addEventListener('click', function () { frozen = null; region = null; shotData = null; pop.style.display = 'none'; hide(); });

    // 🔴 THE BROWSER CANNOT SCREENSHOT ITSELF, SO THE CROP ARRIVES BY CLIPBOARD (2026-09-09 21:57 EDT). Harkirat: *"can it also give me an option to take and attach a cropped screenshot… so you have the issue presented to you straight up, instead you having to frantically go search for it in the code."* ⌘⇧4 crops with whatever padding he wants included, and this takes the paste. It also beats anything the page could render of itself: it captures what the COMPOSITOR drew — font rendering, subpixel AA, a GPU-composited shadow — none of which a DOM-to-canvas trick reproduces.
    pop.addEventListener('paste', function (e) {
        var items = (e.clipboardData || {}).items || [];
        for (var i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== 0) continue;
            e.preventDefault();
            var fr = new FileReader();
            fr.onload = function () {
                shotData = fr.result;
                var z = document.getElementById('__pinshot');
                z.className = 'shot has'; z.innerHTML = '';
                var img = document.createElement('img'); img.src = shotData; z.appendChild(img);
            };
            fr.readAsDataURL(items[i].getAsFile());
            return;
        }
    }, true);
    document.getElementById('__pinshot').addEventListener('click', function () { document.getElementById('__pintext').focus(); });
    document.getElementById('__pinsave').addEventListener('click', async function () {
        var text = document.getElementById('__pintext').value.trim();
        if (!text || (!frozen && !region)) return;
        var app = document.querySelector('.app');
        var r = region || frozen.getBoundingClientRect();
        // 🔴 FIVE FIELDS PIN A FRAME EXACTLY, AND THREE OF THEM WERE MISSING. Selector and rect say WHERE on the page; scroll and viewport say WHICH page — the same selector sits somewhere else, and sometimes in a different layout, at another width or scroll offset. Without them a reader reproduces an approximation and then argues with it.
        var body = {
            kind: region ? 'region' : 'element',
            realm: (app && app.dataset.realm) || 'unknown',
            route: location.hash || '#/',
            selector: region ? region.info.owner : selectorFor(frozen),
            shows: region ? '' : (frozen.textContent || '').trim().slice(0, 120),
            rect: Math.round(r.width) + '×' + Math.round(r.height) + ' at ' + Math.round(r.left) + ',' + Math.round(r.top),
            scroll: Math.round(window.scrollX) + ',' + Math.round(window.scrollY),
            viewport: window.innerWidth + '×' + window.innerHeight,
            region: region ? region.info : null,
            shot: shotData || null,
            text: text,
        };
        await fetch('/__pin/note', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).catch(function () {});
        count++; tally.textContent = count + (count === 1 ? ' pin' : ' pins');
        frozen = null; region = null; shotData = null; pop.style.display = 'none'; hide();
    });
})();
