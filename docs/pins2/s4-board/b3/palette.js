// Board 3 version 2 — BOARD ONLY. P7: command search. A word finds what it names — actions by the fields they touch, badges and weapons as things to find, realms and views to go to — grouped Do · Find · Go. An action, a badge and a weapon typed together compose one step, and Enter opens its drawer filled in, so nothing stages without the drawer.
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect, useRef } from '../vendor/preact-hooks.mjs';
import { Icon } from '../ui/icons.js';
import { hooks } from './state.js';
import { __board } from '../ui/httpClient.js';

/* global CATEGORY_CHIP_LABEL */

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const words = (q) => String(q || '').toLowerCase().split(/\s+/).filter(Boolean);
const BADGES = [
    { k: 'meta', label: 'META', icon: 'zap', syn: ['meta'], test: (b) => b.isMeta, c: '#38D6F0' },
    { k: 'best', label: 'BEST', icon: 'crown', syn: ['best'], test: (b) => b.categoryRank === 'best', c: '#F2C230' },
    { k: 'top3', label: 'TOP 3', icon: 'star', syn: ['top3', 'top'], test: (b) => b.categoryRank === 'top3', c: '#CAD5DF' },
    { k: 'toxic', label: 'TOXIC', icon: 'skull', syn: ['toxic'], test: (b) => b.isToxic, c: '#9BE23C' },
    { k: 'top5', label: 'TOP 5', icon: 'award', syn: ['top5'], test: (b) => b.categoryRank === 'top5', c: '#A98BFF' },
    { k: 'capable', label: 'CAPABLE', icon: 'thumbs-up', syn: ['capable'], test: (b) => b.categoryRank === 'capable', c: '#5B9BFF' },
    { k: 'ass', label: 'ASS', icon: 'poop', syn: ['ass'], test: (b) => b.isAss, c: '#C08A55' },
    { k: 'mode-hp', label: 'HP', icon: 'm-hp', syn: ['hp', 'hardpoint', 'mode'], test: (b) => b.mode !== 'DMZ' && (b.rankModes || []).includes('HP'), c: '#E4ECF4' },
    { k: 'mode-snd', label: 'S&D', icon: 'm-snd', syn: ['s&d', 'snd', 'search', 'mode'], test: (b) => b.mode !== 'DMZ' && (b.rankModes || []).includes('S&D'), c: '#E4ECF4' },
    { k: 'mode-dom', label: 'DOM', icon: 'm-dom', syn: ['dom', 'domination', 'mode'], test: (b) => b.mode !== 'DMZ' && (b.rankModes || []).includes('DOM'), c: '#E4ECF4' },
    { k: 'mode-tdm', label: 'TDM', icon: 'm-tdm', syn: ['tdm', 'deathmatch', 'mode'], test: (b) => b.mode !== 'DMZ' && (b.rankModes || []).includes('TDM'), c: '#E4ECF4' },
    { k: 'mode-ftl', label: 'FTL', icon: 'm-ftl', syn: ['ftl', 'frontline', 'mode'], test: (b) => b.mode !== 'DMZ' && (b.rankModes || []).includes('FTL'), c: '#E4ECF4' },
    { k: 'mode-ctrl', label: 'Control', icon: 'm-ctrl', syn: ['control', 'ctrl', 'mode'], test: (b) => b.mode !== 'DMZ' && (b.rankModes || []).includes('Control'), c: '#E4ECF4' },
];
const DO_WORDS = { badge: ['badge', 'badges', 'tag', 'tier', 'rank', 'meta', 'toxic', 'best', 'top3', 'top5', 'capable', 'ass', 'mode', 'modes', 'hp', 's&d', 'dom', 'tdm', 'ftl', 'control'], edit: ['edit', 'change', 'fix'], add: ['new', 'add', 'create', 'build'], bulk: ['bulk', 'paste', 'many', 'import'] };
const VIEW_WORDS = { 'Tier board': ['tier', 'board', 'badges', 'rank', 'rack'], Repairs: ['repair', 'repairs', 'fix', 'problems', 'broken', 'faults'], Compare: ['compare', 'diff', 'duplicate'] };

const goArmory = (fn) => { if (!(location.hash || '').includes('armory')) { location.hash = '#/armory'; setTimeout(fn, 650); } else fn(); };

function matchWord(w, list) { return list.some((x) => x === w || (w.length >= 3 && x.startsWith(w))); }

function search(q, commands) {
    const ws = words(q);
    const all = __board.builds().filter((b) => b.mode === 'MP');
    const weapons = [...new Set(all.map((b) => b.weaponName))];
    const weaponHit = weapons.map((w) => ({ w, score: ws.some((x) => norm(x) === norm(w)) ? 2 : ws.some((x) => x.length >= 2 && norm(w).startsWith(norm(x))) ? 1 : 0 }))
        .filter((x) => x.score).sort((a, b) => b.score - a.score || a.w.length - b.w.length);
    const badgeHit = BADGES.filter((bd) => ws.some((x) => matchWord(x, bd.syn)));
    const badgeWord = ws.some((x) => matchWord(x, DO_WORDS.badge));
    const out = { compose: null, doo: [], find: [], go: [] };

    const exactWeapon = weaponHit.find((x) => x.score === 2) || (weaponHit.length === 1 ? weaponHit[0] : null);
    if (exactWeapon && badgeHit.length) {
        const list = all.filter((b) => b.weaponName === exactWeapon.w);
        out.compose = { badge: badgeHit[0], weapon: exactWeapon.w, list, has: list.some(badgeHit[0].test),
            run: () => goArmory(() => hooks.armoryBulkEdit && hooks.armoryBulkEdit(list.map((b) => String(b._id)), { addBadge: badgeHit[0].k })) };
    }
    if (badgeWord) {
        out.doo.push({ id: 'badges', icon: 'tag', c: 'var(--r-armory)', title: html`Set <mark>badges</mark> on builds`, sub: 'META, TOXIC and the tier, on the builds you pick', tag: 'Armory',
            run: () => goArmory(() => hooks.armoryView && hooks.armoryView('Tier board')) });
    }
    if (ws.some((x) => matchWord(x, DO_WORDS.add)) || badgeWord) {
        out.doo.push({ id: 'add', icon: 'plus', c: 'var(--r-armory)', title: 'Add build', sub: badgeWord ? html`its form has the <mark>badge</mark> toggles` : 'one build, the code fills the attachments', tag: 'Armory',
            run: () => goArmory(() => hooks.armoryNew && hooks.armoryNew('add')) });
    }
    if (ws.some((x) => matchWord(x, DO_WORDS.bulk))) {
        out.doo.push({ id: 'bulk', icon: 'layers', c: 'var(--r-armory)', title: 'Bulk create', sub: 'paste many builds, blocks separated by a blank line', tag: 'Armory', run: () => goArmory(() => hooks.armoryNew && hooks.armoryNew('bulk')) });
    }
    if (exactWeapon && ws.some((x) => matchWord(x, DO_WORDS.edit))) {
        const list = all.filter((b) => b.weaponName === exactWeapon.w);
        out.doo.push({ id: 'editw', icon: 'square-pen', c: 'var(--r-armory)', title: `Edit ${exactWeapon.w}’s builds`, sub: `${list.length} build${list.length === 1 ? '' : 's'} in one drawer`, tag: 'Armory',
            run: () => goArmory(() => hooks.armoryBulkEdit && hooks.armoryBulkEdit(list.map((b) => String(b._id)))) });
    }
    for (const c of commands) {
        if (['armory', 'broadcast', 'commit', 'account'].includes(c.group) && ws.length && ws.every((x) => matchWord(x, words(c.label).concat((c.keywords || []).flatMap(words))))) {
            if (!out.doo.some((d) => d.title === c.label)) out.doo.push({ id: c.label, icon: c.group === 'commit' ? 'check' : c.group === 'account' ? 'log-out' : 'square-pen', c: c.accent || 'var(--ink3)', title: c.label, sub: null, tag: c.group, run: c.run });
        }
    }
    for (const bd of badgeHit) {
        const hit = all.filter(bd.test);
        out.find.push({ id: 'b' + bd.k, icon: bd.icon, c: bd.c, title: bd.label, sub: `${hit.length} builds · ${new Set(hit.map((b) => b.weaponName)).size} weapons`, run: () => goArmory(() => hooks.armoryBadgeFilter && hooks.armoryBadgeFilter(bd.k)) });
    }
    for (const { w } of weaponHit.slice(0, 4)) {
        const list = all.filter((b) => b.weaponName === w);
        const cat = list[0].category;
        out.find.push({ id: 'w' + w, icon: 'layers', c: list[0].accent || 'var(--ink3)', title: w, sub: `${list.length} build${list.length === 1 ? '' : 's'} · ${(typeof CATEGORY_CHIP_LABEL !== 'undefined' && CATEGORY_CHIP_LABEL[cat]) || cat}${badgeHit[0] && list.some(badgeHit[0].test) ? ` · already ${badgeHit[0].label}` : ''}`,
            run: () => goArmory(() => hooks.armoryFindWeapon && hooks.armoryFindWeapon(w)) });
    }
    for (const [view, vw] of Object.entries(VIEW_WORDS)) {
        if (ws.some((x) => matchWord(x, vw))) out.go.push({ id: 'v' + view, icon: 'layout-grid', c: 'var(--r-armory)', title: view, sub: view === 'Tier board' ? html`<mark>badges</mark> by tier` : view === 'Repairs' ? 'builds that need work' : 'every build of a weapon, side by side', tag: 'Armory', run: () => goArmory(() => hooks.armoryView && hooks.armoryView(view)) });
    }
    for (const c of commands) {
        if ((c.group === 'realm' || c.group === 'home' || c.group === 'view') && ws.length && ws.some((x) => matchWord(x, words(c.label)))) {
            if (!out.go.some((g) => norm(g.title) === norm(c.label))) out.go.push({ id: c.label, icon: c.group === 'view' ? 'eye' : 'arrow-up-right', c: c.accent || 'var(--ink3)', title: c.label, sub: null, tag: c.group === 'view' ? 'view' : 'realm', run: c.run });
        }
    }
    return out;
}

export function B3CommandBar({ commands = [], realmLabel }) {
    const [q, setQ] = useState('');
    const [open, setOpen] = useState(false);
    const [sel, setSel] = useState(0);
    const input = useRef(null);
    const res = search(q, commands);
    const flat = [...(res.compose ? [{ id: 'compose', run: res.compose.run }] : []), ...res.doo, ...res.find, ...res.go];
    const active = Math.min(sel, Math.max(0, flat.length - 1));

    useEffect(() => {
        const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === '/') { e.preventDefault(); input.current && input.current.focus(); setOpen(true); } };
        document.addEventListener('keydown', onKey);
        hooks.paletteType = (text) => { if (!input.current) return; input.current.focus(); setQ(text); setSel(0); setOpen(true); };
        return () => { document.removeEventListener('keydown', onKey); delete hooks.paletteType; };
    }, []);

    const run = (item) => { if (!item) return; setQ(''); setOpen(false); setSel(0); input.current && input.current.blur(); item.run(); };
    const onKeyDown = (e) => {
        if (e.key === 'Escape') { setQ(''); setOpen(false); e.target.blur(); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setSel(Math.min(active + 1, flat.length - 1)); return; }
        if (e.key === 'ArrowUp') { e.preventDefault(); setSel(Math.max(active - 1, 0)); return; }
        if (e.key === 'Enter' && flat[active]) { e.preventDefault(); run(flat[active]); }
    };
    let idx = res.compose ? 1 : 0;
    const row = (item, group) => { const i = idx++; return html`
        <button type="button" class=${'b3-cmdr' + (i === active ? ' on' : '')} key=${group + item.id} role="option" aria-selected=${i === active ? 'true' : 'false'} style=${`--c:${item.c}`}
                onMouseEnter=${() => setSel(i)} onMouseDown=${(e) => e.preventDefault()} onClick=${() => run(item)}>
            <i><${Icon} name=${item.icon} /></i>
            <span class="t"><b>${item.title}</b>${item.sub ? html`<small>${item.sub}</small>` : null}</span>
            ${item.tag ? html`<em>${item.tag}</em>` : html`<span></span>`}
        </button>`; };
    const empty = q.trim() && !flat.length;

    return html`
        <div class=${'cmdbar b3-cmdbar' + (open ? ' on' : '')}>
            <${Icon} name="search" cls="b3-cmdmag" />
            <input class="cb-in" data-bare ref=${input} value=${q} autocomplete="off" spellcheck="false" role="combobox" aria-expanded=${open ? 'true' : 'false'} aria-controls="b3cmdList"
                   placeholder=${realmLabel ? `Search ${realmLabel}, or run a command` : 'Search, or run a command'} aria-label="Search, or run a command"
                   onPointerDown=${() => setOpen(true)} onInput=${(e) => { setQ(e.target.value); setSel(0); setOpen(true); }} onKeyDown=${onKeyDown}
                   onBlur=${() => setTimeout(() => setOpen(false), 140)} />
            <kbd>⌘/</kbd>
            ${open && q.trim() ? html`
                <div class="b3-cmd" role="listbox" id="b3cmdList" aria-label="Results">
                    ${res.compose ? html`
                        <button type="button" class=${'b3-compose' + (active === 0 ? ' on' : '')} onMouseEnter=${() => setSel(0)} onMouseDown=${(e) => e.preventDefault()} onClick=${() => run(flat[0])}>
                            <span class="row">
                                <span class="b3-tok verb"><${Icon} name="tag" />Set badge</span>
                                <span class="b3-tok badge" style=${`--c:${res.compose.badge.c}`}>${res.compose.badge.label}</span>
                                <span class="b3-joiner">on</span>
                                <span class="b3-tok weap" style=${`--c:${res.compose.list[0].accent}`}><i></i>${res.compose.weapon}<em>${res.compose.list.length} build${res.compose.list.length === 1 ? '' : 's'}</em></span>
                            </span>
                            <span class="go"><span>${res.compose.has ? `${res.compose.weapon} is already ${res.compose.badge.label} — opens its builds to change it` : `Opens Edit builds with ${res.compose.badge.label} added; it stages, nothing is live until Review`}</span><kbd>↵</kbd></span>
                        </button>` : null}
                    <div class="b3-cmdl">
                        ${res.doo.length ? html`<p class="b3-cmds">Do</p>${res.doo.map((x) => row(x, 'd'))}` : null}
                        ${res.find.length ? html`<p class="b3-cmds">Find</p>${res.find.map((x) => row(x, 'f'))}` : null}
                        ${res.go.length ? html`<p class="b3-cmds">Go</p>${res.go.map((x) => row(x, 'g'))}` : null}
                        ${empty ? html`<p class="b3-cmdnone"><b>Nothing named “${q.trim()}”.</b> Try an action (edit, new, badge), a weapon (cx9), a badge (meta) or a view (repairs).</p>` : null}
                    </div>
                    <div class="b3-cmdf"><span><kbd>↑</kbd><kbd>↓</kbd>move</span><span><kbd>↵</kbd>open</span><span><kbd>esc</kbd>close</span></div>
                </div>` : null}
        </div>`;
}
