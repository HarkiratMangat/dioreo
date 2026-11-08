// ==========================================
// /manage announcement — the panels
// ==========================================
// Built 2026-11-07 21:08 EST (the /manage rehaul's remaining panels, builder C2) on the pattern of the draws panel (handlers/manage/drawsPanel/): one message that changes in place, a breadcrumb and Back/Home on every inner view, one card per announcement. Every function here only BUILDS a message; routing, permission checks and saves are in ./index.js.
//
// custom_ids: `mng_an|<verb>|…`, at most 100 characters (asserted). `mng_` puts every click behind the router's /manage lock (handlers/router.js); ./index.js checks each action's own tier.
//
// An announcement's key is its Mongo `_id` (models/Announcement.js). The panel lists every announcement that has not expired, a scheduled one (startsAt in the future) included: the old page listed only the ones already live, so a scheduled announcement could not be edited or deleted from it.

const emojis = require('../../../utils/emojiMap');

const ACCENT = 0x2b2d31; // the old Announcement page's colour: /manage's flat panel grey (commands/manage.js PANEL_ACCENT; the page had no identity colour of its own)
const LIST_ROWS = 8; // rows written out on the home; the dropdown under them holds up to 25
const MAX_OPTIONS = 25;
const EXPIRED_SHOWN = 5;

function ID(...parts) {
    const id = ['mng_an', ...parts.map(p => (p === undefined || p === null ? '' : String(p)))].join('|');
    if (id.length > 100) throw new Error(`announcement custom_id over 100 characters: ${id}`);
    return id;
}
const row = (...c) => ({ type: 1, components: c });
const text = (content) => ({ type: 10, content });
const BIG = () => ({ type: 14, divider: true, spacing: 2 });
const SMALL = () => ({ type: 14, divider: false, spacing: 1 });
const btn = (parts, label, emojiStr, style = 2, disabled = false) => ({ type: 2, style, ...(label ? { label } : {}), custom_id: ID(...[].concat(parts)), disabled, ...(emojiStr ? { emoji: emojis.parseEmoji(emojiStr) } : {}) });
const crumb = (...p) => `-# ${['Announcements', ...p].join('  ›  ')}`;
const panel = (components, after = []) => [{ type: 17, accent_color: ACCENT, components }, ...after];
const homeBtn = () => btn('page', 'Home', emojis.returnArrow);
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

const unix = (d) => Math.floor(new Date(d).getTime() / 1000);
const rel = (d) => `<t:${unix(d)}:R>`;
const isScheduled = (d, now = new Date()) => Boolean(d.startsAt) && new Date(d.startsAt) > now;
// One line of what the announcement says, for a list row or a dropdown: the first line with any markdown heading or layout mark stripped, at most `max` characters.
function preview(doc, max = 100) {
    const line = String(doc.text || '').split('\n').map(x => x.replace(/^\s*(#{1,6}\s+|-#\s+)/, '').trim()).find(x => x && !/^(-{2,4}|={2,4}|\+\+)$/.test(x)) || '(no text)';
    return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}
const expiryWords = (d) => (d.expiresAt ? `expires ${rel(d.expiresAt)}` : 'never expires');
// What the row says besides its text, on a small line.
function factsLine(d, now = new Date()) {
    return [`posted ${rel(d.createdAt)}`, isScheduled(d, now) ? `**starts ${rel(d.startsAt)}**` : null, expiryWords(d), d.repeatCount ? `repeats up to ${d.repeatCount}×` : null].filter(Boolean).join(' · ');
}

// ---------- home ---------- `data` is { live, expired }: the announcements that have not expired (newest first, scheduled ones included) and the few that expired most recently.
function pageView(data, note = null, { pageRow = null, now = new Date() } = {}) {
    const live = data.live || [];
    const expired = (data.expired || []).slice(0, EXPIRED_SHOWN);
    const scheduled = live.filter(d => isScheduled(d, now)).length;
    const counts = [`${live.length - scheduled} active`, ...(scheduled ? [`${scheduled} scheduled`] : []), ...(expired.length ? [`${expired.length} recently expired`] : [])].join(' · ');
    const components = [text(`## ${emojis.dbAnnouncement} Announcements\n-# ${counts}`)];
    if (note) components.push(SMALL(), text(note));
    components.push(BIG());
    if (!live.length) components.push(text(`${emojis.cross} **Nothing is running.** Post New writes one.`));
    else {
        const lines = live.slice(0, LIST_ROWS).map((d, i) => `**${i + 1}.** ${preview(d)}\n-# ${factsLine(d, now)}`);
        if (live.length > LIST_ROWS) lines.push(`-# …and ${live.length - LIST_ROWS} more in the dropdown`);
        components.push(text(lines.join('\n').slice(0, 2400)));
        components.push({ type: 1, components: [{ type: 3, custom_id: ID('open'), placeholder: 'Open an announcement…', options: live.slice(0, MAX_OPTIONS).map((d, i) => ({ label: `${i + 1}. ${preview(d)}`.slice(0, 100), value: String(d._id), description: `${isScheduled(d, now) ? 'Scheduled' : 'Active'} · ${d.expiresAt ? 'expires' : 'never expires'}`.slice(0, 100) })) }] });
    }
    components.push(
        BIG(),
        text('-# Post…'),
        row(btn('post', 'Post New', emojis.mngAdd, 3), btn('guide', 'Guide', emojis.guide)),
    );
    if (expired.length) {
        components.push(
            SMALL(),
            text(`-# Recently expired (read only)\n${expired.map(d => `- ${preview(d, 70)} · expired ${rel(d.expiresAt)}`).join('\n')}`.slice(0, 900)),
            { type: 1, components: [{ type: 3, custom_id: ID('again'), placeholder: 'Post one again…', options: expired.map(d => ({ label: preview(d).slice(0, 100), value: String(d._id), description: 'Opens Post New with its text filled in' })) }] },
        );
    }
    return panel(components, pageRow ? [pageRow] : []);
}

// ---------- one announcement ---------- `header` sits above the card (a confirm question, a saved note); `extra` replaces the action rows. `body` is what players get: the shared renderer's text, utils/announcement.js announcementBody.
function cardView(doc, { header = null, extra = null, now = new Date() } = {}) {
    if (!doc) return null;
    const body = require('../../../utils/announcement').announcementBody(doc);
    const components = [text(crumb(preview(doc, 40)))];
    if (header) components.push(text(header), SMALL());
    components.push(
        text(`${body.slice(0, 3000)}${body.length > 3000 ? '\n…' : ''}`),
        text(`-# ${factsLine(doc, now)}${doc.bannerImageUrl ? ' · has a banner image' : ''}\n-# Layout marks on a line of their own (\`----\`, \`====\`, \`++\`) draw as dividers and gaps for players.`),
        BIG(),
    );
    if (extra) components.push(...extra);
    else components.push(row(btn(['edit', String(doc._id)], 'Edit', emojis.edit, 1), btn(['del', String(doc._id)], 'Delete', emojis.deleteBin, 4)), row(homeBtn()));
    return panel(components);
}

function resultView({ crumbs = [], title, body = [], back = 'page', backLabel = 'Back', ok = true, extraButtons = [], extraRows = [] }) {
    const backParts = [].concat(back);
    return panel([
        ...(crumbs.length ? [text(crumb(...crumbs))] : []),
        text(`### ${ok === 'warn' ? emojis.warn : ok ? emojis.checkmark : emojis.cross} ${title}`),
        ...(body.length ? [SMALL(), text(body.join('\n').slice(0, 3800))] : []),
        BIG(),
        ...extraRows,
        row(...extraButtons, btn(backParts, backLabel, emojis.returnArrow), ...(backParts[0] === 'page' ? [] : [homeBtn()])),
    ]);
}

module.exports = { ID, ACCENT, LIST_ROWS, MAX_OPTIONS, EXPIRED_SHOWN, row, text, btn, homeBtn, panel, plural, preview, isScheduled, factsLine, pageView, cardView, resultView };
