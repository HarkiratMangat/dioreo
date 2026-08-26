// portal/ui/palette.js — ESM. The command bar, which until now rendered completely and did nothing.
//
// 🔴 A LYING AFFORDANCE IS WORSE THAN A MISSING ONE. The header's widest control was a search field with an onInput handler that was never passed, a ⌘K hint bound to no listener, and no results surface at all — so the one thing in the chrome that invites you to type was the one thing that could not answer. The mockup's own note calls the older 44px chip "a keyboard shortcut wearing a button's clothes"; a full-width input that swallows keystrokes is worse than that, because the chip at least never claimed to be a field.
//
// paletteHits/paletteBlocked come from palette.logic.js, loaded as a plain CLASSIC <script> before this module — see track.js's header comment for why that is the real cross-runtime resolution here.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect, useRef } from '../vendor/preact-hooks.mjs';

// A command is { label, group, accent, keywords, local, run }. `run` is the whole contract: the bar never navigates by convention or by parsing the label, so a command that goes nowhere is a command somebody forgot to give a body — visible in the source rather than at the moment somebody presses Enter on it.
export function CommandBar({ commands = [], realmLabel }) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [sel, setSel] = useState(0);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    const hits = paletteHits(commands, query);
    const active = Math.min(sel, Math.max(0, hits.length - 1));

    // ⌘K / Ctrl-K. Bound to the document because that is what a global shortcut means, and guarded by paletteBlocked because `inert` on the header stops the pointer and the tab order but not this listener — see palette.logic.js for the full note.
    useEffect(() => {
        const onKey = (e) => {
            if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'k') return;
            if (paletteBlocked(document)) return;
            e.preventDefault();
            const el = inputRef.current;
            if (!el) return;
            el.focus(); el.select();
            setOpen(true);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    // Keeping the highlighted row on screen matters most in the case nobody tests: an empty query lists every command, so the selection can be well below the fold before a single character is typed.
    useEffect(() => {
        if (!open) return;
        const node = listRef.current && listRef.current.querySelector('[aria-selected="true"]');
        if (node) node.scrollIntoView({ block: 'nearest' });
    }, [open, active, query]);

    function runCommand(command) {
        if (!command || typeof command.run !== 'function') return;
        setQuery(''); setOpen(false); setSel(0);
        if (inputRef.current) inputRef.current.blur();
        command.run();
    }

    function onKeyDown(e) {
        if (e.key === 'Escape') { setQuery(''); setOpen(false); e.target.blur(); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setSel(Math.min(active + 1, hits.length - 1)); return; }
        if (e.key === 'ArrowUp') { e.preventDefault(); setSel(Math.max(active - 1, 0)); return; }
        if (e.key === 'Enter' && hits[active]) { e.preventDefault(); runCommand(hits[active]); }
    }

    // 🔴 THE DROPDOWN OPENS ON INTENT, NOT ON FOCUS. The mockup shipped every page with its palette already unrolled, and the cause was one line: an audit sweep called el.focus() on every input, which fired a `focus` handler and painted the list. Programmatic focus is not intent. Pointerdown, typing and ArrowDown are; nothing else opens this.
    return html`
        <div class=${'cmdbar' + (open ? ' on' : '')}>
            <span class="cb-mag" aria-hidden="true"></span>
            <input class="cb-in" ref=${inputRef} value=${query} autocomplete="off" spellcheck="false"
                   role="combobox" aria-expanded=${open ? 'true' : 'false'} aria-controls="cbList" aria-autocomplete="list"
                   placeholder=${realmLabel ? `Search ${realmLabel}, or run a command` : 'Search, or run a command'}
                   aria-label=${realmLabel ? `Search ${realmLabel}, or run a command` : 'Search, or run a command'}
                   onPointerDown=${() => setOpen(true)}
                   onInput=${(e) => { setQuery(e.target.value); setSel(0); setOpen(true); }}
                   onKeyDown=${onKeyDown}
                   onBlur=${() => setTimeout(() => setOpen(false), 130)} />
            <kbd>⌘K</kbd>
            <div class="cb-drop" hidden=${!open}>
                <div class="plist" id="cbList" role="listbox" ref=${listRef}
                     aria-label="Commands and pages">
                    ${hits.length ? hits.map((c, i) => html`
                        <button class="pitem" role="option" key=${c.label} aria-selected=${i === active ? 'true' : 'false'}
                                onMouseEnter=${() => setSel(i)}
                                onMouseDown=${(e) => e.preventDefault()}
                                onClick=${() => runCommand(c)}>
                            <i style=${`--c:${c.accent || 'var(--ink3)'}`} aria-hidden="true"></i>
                            ${c.label}
                            ${c.group ? html`<span class="pk">${c.group}</span>` : null}
                        </button>`)
                    : html`<p class="pnone">Nothing matches “${query.trim()}”. Try a realm name, a view, or an action such as “review”.</p>`}
                </div>
            </div>
        </div>
    `;
}
