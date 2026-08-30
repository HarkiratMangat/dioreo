// portal/ui/composer.js — ESM. The in-page composer: the adopted design's own "add to the season" surface.
//
// 🔴 IT IS INLINE, NOT A DRAWER, AND THAT IS THE DESIGN RATHER THAN A LAYOUT CHOICE. The composer sits directly above the Track it is adding to, so the thing you are describing and the picture of where it lands are on screen together. A drawer covers the Track, which means composing a date range while unable to see the range.
//
// 🔴 AND THE FORM FOLLOWS THE RECORD. A draw has one date; an event has a window. The fields change with the type rather than showing a union of every type's fields with the irrelevant ones greyed out — that shape is how a form starts lying about what the record holds.
//
// composerReason/composerFields come from composer.logic.js, loaded as a classic script — see track.js's header for why every .logic.js sibling here loads that way.
import { h } from '../vendor/preact.mjs';
import { conforming } from './conform.js';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect, useRef } from '../vendor/preact-hooks.mjs';
import { fetchJson } from './httpClient.js';
import { DiscordCard } from './v2Render.js';

const DAY = { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' };
const fmtDay = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString(undefined, DAY);

// 🔴 THE DATE IS PARSED BY THE SERVER, WHICH IS THE POINT RATHER THAN AN IMPLEMENTATION DETAIL. `chrono-node` has understood "in 3 weeks" for this bot since /manage was built, and the portal was the one surface that made you click through a calendar instead. Shipping a second parser to the browser would put two implementations behind one promise — the echo would show what the CLIENT resolved while the server stored what chrono resolved — so this asks /api/parse-date, which calls the bot's own parseAdminDate. See portal/api/dates.js.
//
// ⚠️ Debounced, and every reply is checked against the value that is in the field NOW. Typing "sep" then "sep 21" fires two requests, and nothing guarantees they come back in that order; without the guard the slower "sep" reply overwrites the newer "sep 21" answer and the echo contradicts the field it sits under.
function SmartDate({ id, label, value, iso, placeholder, onChange }) {
    const latest = useRef(value);
    latest.current = value;
    useEffect(() => {
        const raw = String(value || '').trim();
        if (!raw) { onChange(value, null); return undefined; }
        const t = setTimeout(() => {
            fetchJson(`/api/parse-date?q=${encodeURIComponent(raw)}`)
                .then((d) => { if (latest.current === value) onChange(value, d.iso || null); })
                .catch(() => {});
        }, 220);
        return () => clearTimeout(t);
    }, [value]);

    const raw = String(value || '').trim();
    return html`
        <!-- The design wraps only the NAME field in nw-f; a date field is a bare div, and the extra class
             carries the form's own column padding onto two boxes that are already inside nw-dates. -->
        <div class=${conforming() ? null : 'nw-f'}>
            <label class="nw-l" for=${id}>${label}</label>
            <input class="nw-i nw-smart" id=${id} type="text" autocomplete="off" spellcheck="false"
                   placeholder=${placeholder} value=${value}
                   onInput=${(e) => onChange(e.target.value, null)} />
            <!-- ⚠️ NOT the generic hint class. The sheet draws this specific line — nw-date-echo, with ok and
                 bad states — because it is a RESULT, not a hint: it reports what the server resolved
                 and whether it resolved at all, and it had been rendering in the generic muted grey that
                 says neither. -->
            <!-- The design creates this line ONCE and rewrites its class, so an untouched date field still
                 carries an empty echo. Rendering it only when there is text made the element itself a
                 state, which is a different shape from the one the stylesheet reserves space for. -->
            ${!raw && !conforming() ? null : html`
                <span class=${'nw-date-echo' + (!raw ? '' : (iso ? ' ok' : ' bad'))}>
                    ${!raw ? '' : (iso ? `${fmtDay(iso)}  ·  ${iso}` : 'not a date yet')}
                </span>`}
        </div>
    `;
}

// ⚠️ "PASTE ANYTHING NEEDS TO BE MORE INTUITIVE." The intuitive version is not a better drawer — it is not being a drawer. The field sits inside the composer, beside the form it replaces, and parses as you type: one thing to look at, and the demonstration and the control are the same object.
//
// 🔴 THE PARSING IS THE BOT'S OWN, over HTTP. utils/adminParser.js has ingested pasted lists for /manage since it was built, including the traps already paid for there — a date written "July 16, 2026" splitting across two comma fields, a bulleted Notes paste arriving as one physical line. A browser reimplementation would preview rows the bot would then read differently, which is the one thing a preview must not do. ⚠️ THE RAW TEXT IS PASSED ALONG WITH THE PARSED ROWS, because the two callers need different halves. Staging into the LIVE season builds one op per row from the parsed values; staging into the DRAFT sends the text, because core/ops/season.js's draft bulk ops parse server-side and resolve draw thumbnails while they are at it — reconstructing that text from the rows would be a second, lossier serializer for a string this component already has.
function PasteZone({ kind, onStageAll }) {
    const [open, setOpen] = useState(false);
    const [text, setText] = useState('');
    const [rows, setRows] = useState([]);
    const latest = useRef('');
    latest.current = text;

    useEffect(() => {
        if (!open || !text.trim()) { setRows([]); return undefined; }
        const t = setTimeout(() => {
            fetchJson('/api/parse-bulk', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ kind, text }),
            }).then((d) => { if (latest.current === text) setRows(d.rows || []); }).catch(() => {});
        }, 280);
        return () => clearTimeout(t);
    }, [text, kind, open]);

    const ok = rows.filter((r) => r.ok);
    if (!open) {
        return html`<div class="pz shut"><button type="button" class="pz-open" onClick=${() => setOpen(true)}>Or paste a list instead</button></div>`;
    }
    return html`
        <div class="pz">
            <button type="button" class="pz-open" onClick=${() => { setOpen(false); setText(''); setRows([]); }}>Close the paste box</button>
            <textarea class="pz-in" rows="4" spellcheck="false" value=${text}
                      placeholder=${kind === 'draw' || kind === 'returning'
                          ? 'Crimson Moonlight, Fennec, Sep 3\nJudgment Day, AK117, Sep 10'
                          : 'Clan Wars — Sep 3 to Sep 12\nDouble CP Weekend — Sep 5'}
                      onInput=${(e) => setText(e.target.value)}></textarea>
            <div class="pz-out">
                ${rows.length ? html`
                    <div class="pz-rows">
                        ${rows.map((r, i) => html`
                            <div class=${'pz-r' + (r.ok ? '' : ' bad')} key=${i}>
                                <i class="pz-d"></i>
                                <span class="pz-k">${kind}</span>
                                <span class="pz-n">${r.name || 'unnamed'}</span>
                                <span class="pz-w">${r.start ? (r.end && r.end !== r.start ? `${r.start} → ${r.end}` : r.start) : 'no date found'}</span>
                            </div>`)}
                    </div>
                    <div class="pz-act">
                        <!-- 🔴 A LINE THE PARSER COULD NOT READ IS SHOWN, NEVER DROPPED. A paste where three of eight lines fell out silently is exactly the failure a preview exists to prevent, and the count says both numbers so the difference is unmissable. -->
                        <span class="pz-sum">${ok.length} of ${rows.length} ${rows.length === 1 ? 'line' : 'lines'} understood</span>
                        <button class="pill lead" disabled=${!ok.length}
                                onClick=${() => onStageAll(ok, text)}>Stage ${ok.length}</button>
                    </div>` : null}
            </div>
        </div>
    `;
}

// 🔴 IT SAYS WHAT THE RECORD WILL BE, IN THE SENTENCE THE BOT WOULD USE — not a second copy of the form's own fields. The composer already draws a ghost onto the Track (below), which answers WHERE; this answers WHAT, because the Track cannot show a name or tell a one-date release from a window that happens to be a day long.
//
// ⚠️ IT RENDERS NOTHING UNTIL THERE IS SOMETHING TRUE TO SAY. `.nwhost .nw-prev:empty{display:none}` is in the adopted sheet, so an empty preview must be genuinely EMPTY rather than a wrapper holding a placeholder — a "nothing yet" line would reserve 76px of the composer forever and defeat the rule.
function ComposePreview({ state, type }) {
    const ghost = composeGhostFor(state, type);
    const name = (state.name || '').trim();
    // 🔴 A DATE ALONE IS NOT SOMETHING TRUE TO SAY. With the first date pre-filled the way the design
    // pre-fills it, this rendered a card titled "Name" for a record nobody had named yet — 153px of
    // preview above a form still on its first field, where the design shows none. The rule this file
    // already states ("nothing until there is something true to say") needed the name in its condition.
    if (!ghost || !type || !name) return html`<div class="nw-prev"></div>`;
    const window = ghost.shape === 'point' || ghost.end === ghost.start
        ? fmtDay(ghost.start)
        : `${fmtDay(ghost.start)} → ${fmtDay(ghost.end)}`;
    // ⚠️ THE CARD, NOT A SENTENCE. The first version of this read the record back as prose, which is a second way of saying what the fields above already say. What nothing else on the page can say is what it will look like in Discord — the surface every one of these records exists for.
    return html`
        <div class="nw-prev">
            <${DiscordCard} accent=${type.hex} title=${name || type.nameLabel || 'Unnamed'}
                            sub=${type.label}
                            rows=${[[ghost.shape === 'point' ? 'Releases' : 'Runs', window]]} />
        </div>
    `;
}

export function Composer({ types, initialType, onStage, onStageMany, onCancel, onLive }) {
    // 🔴 THE DESIGN BRINGS ITS COMPOSER INTO VIEW AND THIS DID NOT. On a season whose masthead is 510px
    // tall the form opened below the fold, so pressing Add appeared to do nothing at all — the failure is
    // silent and looks like a dead button. It is also why two fold-height captures of the same moment
    // framed different parts of the page.
    const hostRef = useRef(null);

    useEffect(() => {
        const el = hostRef.current;
        // ⚠️ NOT SYNCHRONOUSLY, AND NOT rAF. The effect runs before the masthead has finished laying the
        // section out, so an immediate call scrolls against a box that is still zero-height; rAF is banned
        // here because it does not fire in a background tab, which is where every measurement runs.
        const t = setTimeout(() => {
            if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'auto' });
        }, 60);
        return () => clearTimeout(t);
    }, []);
    // The design opens with the first date already set to today — its Track ghost reads "+ Aug 24" and the
    // echo under the field reads it back resolved. An empty field is not the same offer: it asks the reader
    // to supply a date the page already knows, and it is why the mockup's date column measures 151px against
    // an empty 150.
    const todayISO = () => new Date().toISOString().slice(0, 10);
    const [state, setState] = useState({ type: initialType || null, name: '',
        aText: conforming() ? todayISO() : '', aIso: conforming() ? todayISO() : '',
        bText: '', bIso: null });
    const type = types.find((t) => t.key === state.type) || null;

    // 🔴 THE LIVE GHOST NEVER FIRED ON OPEN. onLive was called from the field handlers only, so the Track
    // drew nothing until somebody typed — even though the composer opens with a date already in it and the
    // design's Track shows a `+ Aug 24` marker the moment it appears. The preview is state, not an event.
    useEffect(() => { if (onLive) onLive(composeGhostFor(state, (types || []).find((t) => t.key === state.type) || null)); }, [state.type, state.aIso, state.bIso, state.name]);

    // 🔴 THE SIGNATURE MOMENT, and the one thing /manage structurally cannot do: it answers "when" with a line of text, and this draws the item where it will land, in its own lane, before it is staged. The composer does not own the Track, so it reports and the page draws — the alternative is a second miniature timeline beside the real one, which is two axes disagreeing about the same season.
    //
    // ⚠️ The ISO date is reported, never the typed text. `aText` is only what the field shows so a repaint does not throw away half-typed words; `aIso` is what the server resolved. A ghost placed from the raw text would jump around while somebody types "sep" on the way to "sep 21".
    useEffect(() => {
        if (!onLive) return;
        onLive(composeGhostFor(state, type));
    }, [state.type, state.name, state.aIso, state.bIso]);
    const reason = composerReason(state, type);
    const set = (patch) => setState((prev) => ({ ...prev, ...patch }));

    // Switching type keeps the name and drops the dates: the name is about the thing, the dates are about a shape that just changed. Keeping a "closes" value through a switch to a one-date type would carry a field the record no longer has.
    const pickType = (key) => set({ type: key, aText: '', aIso: null, bText: '', bIso: null });

    // ⚠️ THE MASTHEAD'S ADD CHIPS WERE DEAD ONCE THE COMPOSER WAS OPEN. They call setShowAdd(key), which lands here as `initialType` — and `useState(initialType)` reads its argument once and ignores every later value, so pressing "Playlist" while composing a draw looked like a switch and did nothing. Adopting the new value is the same act as pressing this composer's own type chip, so it goes through pickType rather than a second code path with its own idea of what a switch means.
    useEffect(() => {
        if (initialType && initialType !== state.type) pickType(initialType);
    }, [initialType]);

    return html`
        <section ref=${hostRef} class=${conforming() ? 'nwhost nw-host' : 'nwhost'} aria-label="Add to the season">
            <div class="nw">
                <div class="nw-types" role="group" aria-label="What are you adding">
                    ${types.map((t) => html`
                        <button type="button" key=${t.key} class=${'nw-chip' + (state.type === t.key ? ' on' : '')}
                                style=${`--c:${t.hex}`} aria-pressed=${state.type === t.key ? 'true' : 'false'}
                                onClick=${() => pickType(t.key)}>
                            <span class="nw-dot"></span>${t.label}
                            <em>${t.shape === 'point' ? 'one date' : 'a window'}</em>
                        </button>`)}
                </div>
                ${type && onStageMany ? html`
                    <div class="nw-paste">
                        <${PasteZone} kind=${type.key} onStageAll=${(rows, raw) => onStageMany(type.key, rows, raw)} />
                    </div>` : null}
                <div class="nw-form">
                    ${!type ? html`
                        <p class="nw-hint">Pick what you are adding. The form follows the record — a release asks for
                            one date, a window asks for two.</p>`
                    : html`
                        <div class="nw-f nw-f-name">
                            <label class="nw-l" for="nw-name">${type.nameLabel || 'Name'}</label>
                            <input class="nw-i" id="nw-name" type="text" autocomplete="off" spellcheck="false"
                                   placeholder=${type.placeholder || ''} value=${state.name}
                                   onInput=${(e) => set({ name: e.target.value })} />
                        </div>
                        <div class=${'nw-dates' + (type.shape === 'point' ? ' one' : '')}>
                            <${SmartDate} id="nw-a" label=${type.shape === 'point' ? (type.dateLabel || 'Releases') : 'Opens'}
                                          value=${state.aText} iso=${state.aIso} placeholder="sep 21, in 3 weeks, tomorrow"
                                          onChange=${(aText, aIso) => set({ aText, aIso })} />
                            ${type.shape === 'span' ? html`
                                <${SmartDate} id="nw-b" label="Closes" value=${state.bText} iso=${state.bIso}
                                              placeholder="end of the month"
                                              onChange=${(bText, bIso) => set({ bText, bIso })} />` : null}
                        </div>
                        ${type.shape === 'point' ? html`
                            <p class="nw-note">${type.pointNote || 'This has no end date — the record stores one date.'}</p>` : null}`}
                </div>
                <${ComposePreview} state=${state} type=${type} />
                <div class="nw-act">
                    <!-- The reason sits beside the button rather than under the offending field: it is the answer to "why can I not press this", and it belongs where the question is asked. -->
                    <span class="nw-why">${reason || 'Ready to stage.'}</span>
                    <button class="pill" onClick=${onCancel}>Cancel</button>
                    <button class="pill lead" disabled=${Boolean(reason)}
                            onClick=${() => onStage(state.type, composerFields(state, type))}>${conforming() && type ? `Stage ${type.single || String(type.label).toLowerCase()}` : 'Stage it'}</button>
                </div>
            </div>
        </section>
    `;
}
