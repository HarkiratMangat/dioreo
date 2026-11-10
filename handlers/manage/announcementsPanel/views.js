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
const EXPIRED_PAGE = 8; // rows a page of the Expired list (2026-11-09, the /manage audit's finding 10)
const FIND_SHOWN = 15; // matches a search lists; the dropdown under them opens one

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
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : /(s|sh|ch|x)$/.test(w) ? 'es' : 's'}`;

const unix = (d) => Math.floor(new Date(d).getTime() / 1000);
const rel = (d) => `<t:${unix(d)}:R>`;
const isScheduled = (d, now = new Date()) => Boolean(d.startsAt) && new Date(d.startsAt) > now;
// One line of what the announcement says, for a list row or a dropdown: the first line with any markdown heading or layout mark stripped, at most `max` characters.
function preview(doc, max = 100) {
    const line = String(doc.text || '').split('\n').map(x => x.replace(/^\s*(#{1,6}\s+|-#\s+)/, '').trim()).find(x => x && !/^(-{2,4}|={2,4}|\+\+)$/.test(x)) || '(no text)';
    return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}
// A dropdown label cannot draw a custom emoji, so its `<:name:id>` markup would show as raw text there (the lead, 2026-11-07 21:21 EST, click-testing): labels drop it; text rows keep it.
const plainLabel = (t) => String(t).replace(/<a?:\w+:\d+>\s*/g, '').trim() || '(emoji only)';
const isExpired = (d, now = new Date()) => Boolean(d.expiresAt) && new Date(d.expiresAt) <= now;
const expiryWords = (d, now = new Date()) => (d.expiresAt ? `${isExpired(d, now) ? '**expired**' : 'expires'} ${rel(d.expiresAt)}` : 'never expires');
// What the row says besides its text, on a small line.
function factsLine(d, now = new Date()) {
    return [`posted ${rel(d.createdAt)}`, isScheduled(d, now) ? `**starts ${rel(d.startsAt)}**` : null, expiryWords(d, now), d.repeatCount ? `repeats up to ${d.repeatCount}×` : null].filter(Boolean).join(' · ');
}

// ---------- home ---------- `data` is { live, expired }: the announcements that have not expired (newest first, scheduled ones included) and the few that expired most recently.
function pageView(data, note = null, { pageRow = null, now = new Date() } = {}) {
    const live = data.live || [];
    const expired = (data.expired || []).slice(0, EXPIRED_SHOWN);
    const expiredCount = data.expiredCount ?? expired.length;
    const scheduled = live.filter(d => isScheduled(d, now)).length;
    const counts = [`${live.length - scheduled} active`, ...(scheduled ? [`${scheduled} scheduled`] : []), ...(expiredCount ? [`${expiredCount} expired`] : [])].join(' · ');
    const components = [text(`## ${emojis.dbAnnouncement} Announcements\n-# ${counts}`)];
    if (note) components.push(SMALL(), text(note));
    components.push(BIG());
    if (!live.length) components.push(text(`${emojis.cross} **Nothing is running.** Post New writes one.`));
    else {
        const lines = live.slice(0, LIST_ROWS).map((d, i) => `**${i + 1}.** ${preview(d)}\n-# ${factsLine(d, now)}`);
        if (live.length > LIST_ROWS) lines.push(`-# …and ${live.length - LIST_ROWS} more in the dropdown`);
        components.push(text(lines.join('\n').slice(0, 2400)));
        components.push({ type: 1, components: [{ type: 3, custom_id: ID('open'), placeholder: 'Open an announcement…', options: live.slice(0, MAX_OPTIONS).map((d, i) => ({ label: `${i + 1}. ${plainLabel(preview(d))}`.slice(0, 100), value: String(d._id), description: `${isScheduled(d, now) ? 'Scheduled' : 'Active'} · ${d.expiresAt ? 'expires' : 'never expires'}`.slice(0, 100) })) }] });
    }
    components.push(
        BIG(),
        text('-# Post…'),
        // Search and Expired (2026-11-09, the /manage audit's finding 10): an expired announcement was a read-only line with no card, and nothing found an old one by its words.
        row(btn('post', 'Post New', emojis.mngAdd, 3), btn('find', 'Search', emojis.search), btn(['exp', 0], `Expired · ${expiredCount}`, emojis.expand, 2, !expiredCount), btn('guide', 'Guide', emojis.guide)),
    );
    if (expired.length) {
        components.push(
            SMALL(),
            text(`-# Recently expired\n${expired.map(d => `- ${preview(d, 70)} · expired ${rel(d.expiresAt)}`).join('\n')}`.slice(0, 900)),
            { type: 1, components: [{ type: 3, custom_id: ID('again'), placeholder: 'Post one again…', options: expired.map(d => ({ label: plainLabel(preview(d)).slice(0, 100), value: String(d._id), description: 'Opens Post New with its text filled in' })) }] },
        );
    }
    return panel(components, pageRow ? [pageRow] : []);
}

// ---------- one announcement ---------- `header` sits above the card (a confirm question, a saved note); `extra` replaces the action rows. `body` is what players get: the shared renderer's text, utils/announcement.js announcementBody.
function cardView(doc, { header = null, extra = null, now = new Date() } = {}) {
    if (!doc) return null;
    // The announcement as players get it: the delivered Container itself (utils/announcement.js buildAnnouncementContainer, its own accent, layout marks drawn as dividers and gaps, the banner, the permanent footer), then the admin panel under it. Before this the text was shown raw and `----` / `++` read as literal marks (the lead's click-test, 2026-11-07 21:21 EST).
    const delivered = require('../../../utils/announcement').buildAnnouncementContainer(doc);
    const components = [text(crumb(plainLabel(preview(doc, 40))))];
    if (header) components.push(text(header), SMALL());
    components.push(text(`-# ${factsLine(doc, now)}${doc.bannerImageUrl ? ' · has a banner image' : ''}\n-# Above: exactly what players get.`), BIG());
    if (extra) components.push(...extra);
    // A live one: Edit · End Now · Delete. An expired one: Post Again (Post New with its text) · Delete, and back to the Expired list (2026-11-09, the /manage audit's finding 10).
    else if (isExpired(doc, now)) components.push(row(btn(['againid', String(doc._id)], 'Post Again', emojis.mngAdd, 3), btn(['del', String(doc._id)], 'Delete', emojis.deleteBin, 4)), row(btn(['exp', 0], 'Expired', emojis.returnArrow), homeBtn()));
    else components.push(row(btn(['edit', String(doc._id)], 'Edit', emojis.edit, 1), btn(['end', String(doc._id)], isScheduled(doc, now) ? 'Cancel It' : 'End Now', emojis.pending), btn(['del', String(doc._id)], 'Delete', emojis.deleteBin, 4)), row(homeBtn()));
    return fitPanel(delivered, components);
}

// A message holds 4,000 characters of text in all, and a long announcement nearly fills that alone: cut its longest text box by the overflow and say so, so the panel still fits. Delivery is untouched (players get the full text).
function fitPanel(delivered, components) {
    const out = [delivered, ...panel(components)];
    const boxes = (c) => (c.components || []).filter(x => x.type === 10);
    const over = out.flatMap(boxes).reduce((n, x) => n + x.content.length, 0) - 3950;
    if (over > 0) {
        const longest = boxes(delivered).sort((x, y) => y.content.length - x.content.length)[0];
        const note = '\n-# …cut here to fit the panel; players get the full text.';
        if (longest) longest.content = longest.content.slice(0, Math.max(0, longest.content.length - over - note.length)) + note;
    }
    return out;
}

// ---------- a draft ---------- (Harkirat, 2026-11-09 10:57 EST: "for the /manage announcement command, seeing an embed rendered draft of the announcement before "posting it". So it's able to be tweaked or discarded or confirmed"; built 2026-11-09 12:11 EST.) The announcement exactly as players will get it, then Post (Save for an edit) · Edit · Discard. Nothing is written until Post. `doc` is the draft drawn as an announcement; `token` keys it in ./index.js's memory. `check` is core's own validation of the drafted values (core/changeset.js validateSet): its expiry and start as real times, or the errors that would refuse Post, shown here with Post disabled rather than after the press.
function draftView(doc, { token, kind = 'post', header = null, check = { ok: true, errors: [] } }) {
    const delivered = require('../../../utils/announcement').buildAnnouncementContainer(doc);
    const when = check.ok
        ? [check.expiresAt ? `expires ${rel(check.expiresAt)}` : 'never expires', check.startsAt ? `**starts ${rel(check.startsAt)}**` : 'shows right away'].join(' · ')
        : `${emojis.warn} ${check.errors.join(' ')}`.slice(0, 600);
    const components = [
        text(crumb(kind === 'edit' ? plainLabel(preview(doc, 40)) : 'Post New', 'Draft')),
        ...(header ? [text(header), SMALL()] : []),
        text(`### ${emojis.edit} Draft · not ${kind === 'edit' ? 'saved' : 'posted'} yet\n-# ${when}\n-# Above: exactly what players will get.`),
        BIG(),
        row(btn(['dpost', token], kind === 'edit' ? 'Save' : 'Post', emojis.checkmark, 3, !check.ok), btn(['dedit', token], 'Edit', emojis.edit, 1), btn(['ddisc', token], 'Discard', emojis.deleteBin, 4)),
    ];
    return fitPanel(delivered, components);
}

// ---------- a list of announcements ---------- The Expired list (`exp|<page>`) and a search's matches share one shape: numbered rows with their facts, a dropdown that opens one (`open`, the home's own), and the rows the caller passes under it.
function listBlock(items, start, now) {
    const lines = items.map((d, i) => `**${start + i + 1}.** ${preview(d, 80)}\n-# ${factsLine(d, now)}`);
    const pick = { type: 1, components: [{ type: 3, custom_id: ID('open'), placeholder: 'Open one…', options: items.slice(0, MAX_OPTIONS).map((d, i) => ({ label: `${start + i + 1}. ${plainLabel(preview(d))}`.slice(0, 100), value: String(d._id), description: (isExpired(d, now) ? 'Expired' : isScheduled(d, now) ? 'Scheduled' : 'Active').slice(0, 100) })) }] };
    return [text(lines.join('\n').slice(0, 3000)), pick];
}
function expiredView(docs, { page = 0, total = 0, now = new Date() } = {}) {
    const pages = Math.max(1, Math.ceil(total / EXPIRED_PAGE));
    const components = [text(crumb('Expired')), text(`### ${emojis.expand} Expired announcements\n-# ${plural(total, 'announcement')} · page ${page + 1} of ${pages}. Open one to post it again or delete it.`), BIG()];
    if (!docs.length) components.push(text(`${emojis.cross} Nothing has expired.`));
    else components.push(...listBlock(docs, page * EXPIRED_PAGE, now));
    components.push(BIG(), row(
        btn(['exp', Math.max(0, page - 1), 'p'], null, emojis.left, 2, page <= 0),
        btn(['exp', Math.min(pages - 1, page + 1), 'n'], null, emojis.right, 2, page >= pages - 1),
        btn('find', 'Search', emojis.search),
        homeBtn(),
    ));
    return panel(components);
}
function findView(query, hits, { now = new Date() } = {}) {
    const shown = hits.slice(0, FIND_SHOWN);
    const components = [text(crumb('Search')), text(`### ${emojis.search} \`${String(query).slice(0, 60)}\`\n-# ${hits.length ? `${plural(hits.length, 'match')}${hits.length > FIND_SHOWN ? `, the newest ${FIND_SHOWN} shown` : ''}` : 'No announcement has every one of those words.'}`), BIG()];
    if (shown.length) components.push(...listBlock(shown, 0, now));
    components.push(BIG(), row(btn('find', 'Search Again', emojis.search, 1), homeBtn()));
    return panel(components);
}
function findModal() {
    return { title: 'Search announcements', custom_id: ID('findm'), components: [{ type: 18, label: 'Words to find', description: 'Every word must appear. Searches active, scheduled and expired ones.', component: { type: 4, custom_id: 'q', style: 1, required: true, max_length: 100, placeholder: 'double xp' } }] };
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

module.exports = { ID, ACCENT, LIST_ROWS, MAX_OPTIONS, EXPIRED_SHOWN, EXPIRED_PAGE, FIND_SHOWN, isExpired, expiredView, findView, findModal, row, text, btn, homeBtn, panel, plural, preview, plainLabel, isScheduled, factsLine, pageView, cardView, draftView, resultView };
