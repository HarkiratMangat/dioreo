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

    var ON = false, USE = false, altHeld = false, frozen = null, region = null, shotData = null, count = 0;
    // 🔴 PIN MODE OWNED EVERY CLICK, SO A DRAWER COULD NOT BE OPENED AT ALL (2026-09-10 10:47 EDT). Harkirat: *"when i have it enabled, i'm unable to click open a drawer, and if i open it prior to clicking the pins toggle, it'll auto close the drawer. As such, none of my prior pins were able to review drawer items."* Interception is right for pinning and fatal for REACHING the thing to pin, so the mode has a third state now: `USE` suspends interception without leaving pin mode — the tally, the popup position and the pin count all survive — and holding Option does the same for one click. `interacting()` is the single predicate every handler below asks.
    function interacting() { return USE || altHeld; }
    var css = document.createElement('style');
    css.textContent = [
        '#__pinbar{position:fixed;right:14px;bottom:14px;z-index:2147483000;display:flex;gap:8px;align-items:center;',
        '  background:#141A1F;border:1px solid #2A343D;border-radius:9px;padding:8px 10px;font:600 12px/1 ui-sans-serif,system-ui,sans-serif;color:#9DAAB4;box-shadow:0 10px 34px rgba(0,0,0,.6)}',
        '#__pinbar button{font:inherit;padding:6px 10px;border-radius:6px;border:1px solid #3A4752;background:transparent;color:#E8EDF1;cursor:pointer}',
        '#__pinbar button.on{background:#FF5D3B;border-color:#FF5D3B;color:#fff}',
        '#__pinbar button.use.on{background:#5FD4E8;border-color:#5FD4E8;color:#00151A}',
        '#__pinbar .hint{font:500 10.5px/1.4 ui-sans-serif,system-ui,sans-serif;color:#5C6A75;max-width:154px}',
        '#__pinbox{position:fixed;z-index:2147482000;pointer-events:none;border:2px solid #FF5D3B;border-radius:3px;background:rgba(255,93,59,.10);display:none}',
        '#__pinlab{position:fixed;z-index:2147482001;pointer-events:none;background:#FF5D3B;color:#fff;font:600 10.5px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;padding:3px 6px;border-radius:3px;white-space:nowrap;display:none;max-width:60vw;overflow:hidden;text-overflow:ellipsis}',
        '#__pinpop{position:fixed;z-index:2147483001;width:320px;background:#141A1F;border:1px solid #FF5D3B;border-radius:9px;padding:11px;display:none;box-shadow:0 14px 40px rgba(0,0,0,.7);font:400 13px/1.5 ui-sans-serif,system-ui,sans-serif;color:#E8EDF1}',
        '#__pinpop .grab{margin:-4px -4px 7px;padding:5px 6px;border-radius:6px;background:#0B0F12;cursor:grab;',
        '  font:600 10px/1.4 ui-sans-serif,system-ui,sans-serif;color:#5C6A75;letter-spacing:.06em;text-align:center;user-select:none}',
        '#__pinpop.dragging .grab{cursor:grabbing}',
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
    // The second control is what makes a drawer reachable. It shows only while pin mode is on, because outside pin mode the page is already usable and a button that changes nothing is noise.
    var useBtn = document.createElement('button'); useBtn.className = 'use';
    useBtn.textContent = '🖱 use the page'; useBtn.style.display = 'none';
    var hint = document.createElement('span'); hint.className = 'hint'; hint.textContent = '';
    var tally = document.createElement('span'); tally.textContent = '0 pins';
    bar.appendChild(btn); bar.appendChild(useBtn); bar.appendChild(hint); bar.appendChild(tally);
    document.body.appendChild(bar);
    var box = el('div', '__pinbox'), lab = el('div', '__pinlab'), pop = el('div', '__pinpop');
    document.body.appendChild(box); document.body.appendChild(lab); document.body.appendChild(pop);
    pop.innerHTML = '<div class="grab" id="__pingrab">\u283f drag me out of the way</div>'
        + '<div class="sel" id="__pinsel"></div><textarea id="__pintext" placeholder="What is wrong here?"></textarea>'
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

    function paint() {
        btn.classList.toggle('on', ON);
        btn.textContent = ON ? '📍 pin mode ON' : '📍 pin mode OFF';
        useBtn.style.display = ON ? '' : 'none';
        useBtn.classList.toggle('on', USE);
        hint.textContent = !ON ? '' : (USE ? 'clicks go to the page — open a drawer, then switch back'
                                           : 'click to pin • hold ⌥ to use the page');
        // The crosshair has to tell the truth about which state you are in, or the first click is a guess.
        document.body.classList.toggle('__pinning', ON && !interacting());
    }
    function setMode(on) {
        ON = on; if (!on) USE = false;
        frozen = null; hide(); pop.style.display = 'none';
        paint();
    }
    function setUse(on) { USE = on; frozen = null; region = null; hide(); pop.style.display = 'none'; paint(); }
    btn.addEventListener('click', function (e) { e.stopPropagation(); setMode(!ON); });
    useBtn.addEventListener('click', function (e) { e.stopPropagation(); setUse(!USE); });

    // 🔴 THE APP'S OWN DISMISS LISTENERS SIT ON `document` IN THE BUBBLE PHASE (shell.js:263 is one: `document.addEventListener('pointerdown', away)`), and this overlay only ever swallowed `click`. So pressing the pin toggle sent a pointerdown all the way up to document and closed whatever was open — which is exactly the "it'll auto close the drawer" symptom, and it is a DIFFERENT cause from the interception above. Stopping it on OUR OWN elements in the BUBBLE phase is what fixes it without repeating this file's own capture-phase mistake: the event still reaches the button inside the bar, and is stopped only once it has finished bubbling through our own UI.
    ['pointerdown', 'mousedown', 'mouseup', 'click', 'dblclick'].forEach(function (t) {
        bar.addEventListener(t, function (e) { e.stopPropagation(); });
        pop.addEventListener(t, function (e) { e.stopPropagation(); });
    });

    document.addEventListener('mousemove', function (e) {
        if (!ON) return;
        if (interacting()) return hide();
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

    // 🔴 THE POPUP SAT ON TOP OF THE THING BEING PINNED (@@S@@). Harkirat: *"please allow me to move/drag away this pop up, because it blocks areas around the element that i might want screenshotted."* His own test crop is the proof — he pasted a slice of the popup instead of the element. Two fixes, because either alone leaves the case the other covers: it now OPENS on whichever side of the element has room, and it can be DRAGGED, with the dragged position kept for the rest of the session so a deliberate placement is not undone by the next pin.
    var popPos = null;
    function openPop(anchorRect, selText) {
        document.getElementById('__pinsel').textContent = selText;
        pop.style.display = 'block';
        if (popPos) { pop.style.left = popPos.x + 'px'; pop.style.top = popPos.y + 'px'; }
        else {
            var W = 336, H = 300, m = 10;
            var below = window.innerHeight - anchorRect.bottom, above = anchorRect.top;
            var right = window.innerWidth - anchorRect.right, left = anchorRect.left;
            var x, y;
            if (right > W + m) { x = anchorRect.right + m; y = anchorRect.top; }
            else if (left > W + m) { x = anchorRect.left - W - m; y = anchorRect.top; }
            else if (below > H + m) { x = anchorRect.left; y = anchorRect.bottom + m; }
            else if (above > H + m) { x = anchorRect.left; y = anchorRect.top - H - m; }
            else { x = anchorRect.left; y = anchorRect.bottom + m; }     // nowhere fits: fall back, and the drag bar is why that is survivable
            pop.style.left = Math.min(window.innerWidth - W - 4, Math.max(4, x)) + 'px';
            pop.style.top = Math.min(window.innerHeight - 140, Math.max(4, y)) + 'px';
        }
        shotData = null;
        var sz = document.getElementById('__pinshot');
        sz.className = 'shot'; sz.textContent = '\u2318\u21e7 4 to crop, then \u2318V here to attach it';
        document.getElementById('__pintext').value = '';
        document.getElementById('__pintext').focus();
    }

    // 🔴 EVERY PIN PATH RUNS ON MOUSEUP, NOT CLICK. A drag that starts on an element and ends in a gap fires a click on their common ancestor, so a click-driven tool cannot tell a pin from a region at all. `click` below only BLOCKS — the portal's own handlers open drawers and stage changes, and a pin must never be a click on the app.
    var down = null, dragging = false;
    document.addEventListener('mousedown', function (e) {
        if (!ON || interacting() || mine(e.target)) return;
        e.preventDefault(); e.stopPropagation();
        down = { x: e.clientX, y: e.clientY, el: e.target }; dragging = false;
    }, true);
    document.addEventListener('mouseup', function (e) {
        if (!ON || interacting() || !down || mine(e.target)) { down = null; return; }
        e.preventDefault(); e.stopPropagation();
        if (dragging) {
            var r = { left: Math.min(down.x, e.clientX), top: Math.min(down.y, e.clientY) };
            r.width = Math.abs(e.clientX - down.x); r.height = Math.abs(e.clientY - down.y);
            r.right = r.left + r.width; r.bottom = r.top + r.height;
            region = r; region.info = describeRegion(r); frozen = null;
            openPop(r, 'region ' + Math.round(r.width) + '\u00d7' + Math.round(r.height) + ' in ' + region.info.owner);
        } else {
            // ⚠️ RESOLVE THE ELEMENT FROM THE POINT, NOT FROM `e.target` (2026-09-09 22:03 EDT). A mousedown whose target is not an Element — the document itself, an SVG node in some browsers — has no `getBoundingClientRect`, and the handler threw before the popup could open, which reads as a dead tool rather than an error. `elementFromPoint` always answers with an Element or null, and null is a no-op rather than a throw.
            var hit = document.elementFromPoint(down.x, down.y);
            if (!hit || mine(hit)) { hide(); return; }
            frozen = hit; region = null; draw(frozen);
            openPop(frozen.getBoundingClientRect(), selectorFor(frozen));
        }
        down = null; dragging = false;
    }, true);
    document.addEventListener('click', function (e) { if (ON && !interacting() && !mine(e.target)) { e.preventDefault(); e.stopPropagation(); } }, true);

    // Escape steps back ONE state rather than always killing the mode: from "use the page" it returns to pinning, and only from pinning does it turn the overlay off. Option held is the same suspend for one click, so it repaints on the way in and on the way out; a window blur has to clear it or the flag survives an app-switch and the tool looks dead on return.
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Alt' && ON && !altHeld) { altHeld = true; paint(); return; }
        if (e.key !== 'Escape' || !ON) return;
        if (USE) setUse(false); else setMode(false);
    }, true);
    document.addEventListener('keyup', function (e) { if (e.key === 'Alt' && altHeld) { altHeld = false; paint(); } }, true);
    window.addEventListener('blur', function () { if (altHeld) { altHeld = false; paint(); } });
    // 🔴 A `pop.addEventListener` CLICK HANDLER IN CAPTURE PHASE STOOD HERE AND IT KILLED BOTH BUTTONS (removed 2026-09-09 22:03 EDT). Harkirat: *"umm nothing happens when i click Save pin or Cancel."* Capture runs from the document DOWN to the target, so calling stopPropagation on the popup meant the event never reached the buttons inside it — Save and Cancel had listeners that could not fire. It was unnecessary as well as harmful: every document-level handler above already returns early on `mine(e.target)`, so a click inside the popup was never going to be read as a pin. ⚠️ AND MY OWN CHECK WALKED STRAIGHT PAST IT. I "verified" cancel by invoking the button and reading back a literal `ready: true` I had written into the same expression — a value that could not have come out false. The EFFECT was never asserted: whether the popup closed, whether a note landed. Assert the effect, never a constant you wrote beside it.
    document.getElementById('__pincancel').addEventListener('click', function () { frozen = null; region = null; shotData = null; pop.style.display = 'none'; hide(); });

    // 🔴 THE BROWSER CANNOT SCREENSHOT ITSELF, SO THE CROP ARRIVES BY CLIPBOARD (2026-09-09 21:57 EDT). Harkirat: *"can it also give me an option to take and attach a cropped screenshot… so you have the issue presented to you straight up, instead you having to frantically go search for it in the code."* ⌘⇧4 crops with whatever padding he wants included, and this takes the paste. It also beats anything the page could render of itself: it captures what the COMPOSITOR drew — font rendering, subpixel AA, a GPU-composited shadow — none of which a DOM-to-canvas trick reproduces.
    (function () {
        var g = document.getElementById('__pingrab'), from = null;
        g.addEventListener('mousedown', function (e) {
            e.preventDefault(); e.stopPropagation();
            from = { x: e.clientX, y: e.clientY, l: parseFloat(pop.style.left) || 0, t: parseFloat(pop.style.top) || 0 };
            pop.classList.add('dragging');
        });
        // On the WINDOW, not the popup: a fast drag outruns the cursor and the pointer leaves the element it started on, which is how a drag that only listens on its handle sticks halfway.
        window.addEventListener('mousemove', function (e) {
            if (!from) return;
            e.preventDefault();
            var x = Math.min(window.innerWidth - 60, Math.max(-280, from.l + e.clientX - from.x));
            var y = Math.min(window.innerHeight - 40, Math.max(0, from.t + e.clientY - from.y));
            pop.style.left = x + 'px'; pop.style.top = y + 'px';
        }, true);
        window.addEventListener('mouseup', function () {
            if (!from) return;
            from = null; pop.classList.remove('dragging');
            popPos = { x: parseFloat(pop.style.left), y: parseFloat(pop.style.top) };
        }, true);
    })();

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
