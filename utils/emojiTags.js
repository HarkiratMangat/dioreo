// utils/emojiTags.js -- what each custom emoji can stand for, beyond its name (2026-11-11 14:55 EST, Harkirat: "in the emoji map, you should add aliases and tags/keywords to help you classify the emojis we have incase their specific name is different than what else they can be used for").
//
// Picking an emoji used to mean remembering its name: "Review Drafted Draws" got the Battle Pass icon and Search Draws the gunsmith search icon because nothing said which emoji means "review" or "next season". `findEmoji('review')` answers that from this table.
//
// TAGS holds the curated words per emojiMap key (lower case, several words allowed). Every key also gets the words of its own name and its Discord emoji name for free (`tagsFor`), so a family like the stat-bar parts or the weapon-class variants needs no entry. scripts/emojiTags.test.js fails if TAGS names a key emojiMap does not have.
const TAGS = {
    // brand
    diorHeart: ['made with love', 'credit', 'heart', 'signature'],
    dioreoCombo: ['brand', 'logo', 'mascot', 'dioreo'], dioreoKawaii: ['brand', 'mascot', 'cute', 'invite'], dioreoTada: ['announcement', 'celebrate', 'new', 'launch'],
    dioreowrld: ['brand', 'world'], dioreoSparkles: ['new', 'shiny', 'magic', 'sparkle'], earlySupporter: ['badge', 'supporter', 'thanks'],
    // rarity and game
    mythic: ['rarity', 'tier', 'mythic', 'm'], legendary: ['rarity', 'tier', 'legendary', 'l'], legacy: ['rarity', 'tier', 'legacy', 'lg'], epic: ['rarity', 'tier', 'epic', 'e'],
    bp: ['battle pass', 'season', 'next season', 'season start', 'draft', 'staged'], bp1: ['battle pass', 'season'], rank: ['ranked', 'rank', 'mp'], dmz: ['dmz', 'extraction'],
    cp: ['cod points', 'currency', 'price', 'cost', 'money'], cp2: ['cod points', 'total', 'price'], doubleCp: ['double cp', '2x', 'bonus', 'cod points'],
    mythicCard: ['mythic', 'card', 'draw'], mythicCoin: ['mythic', 'coin', 'currency'],
    season6: ['season', 'season 6'], season7: ['season', 'season 7'], season8: ['season', 'season 8'], season9: ['season', 'season 9', 'current season'], season10: ['season', 'season 10', 'next season', 'anniversary', 'draft', 'review draft'],
    // /manage and data
    database: ['database', 'index', 'data', 'storage', 'draw index'], mngAdd: ['add', 'new', 'create'], mngEdit: ['edit', 'change'], mngDelete: ['delete', 'remove'],
    mngBulkAdd: ['bulk add', 'many', 'paste'], mngBulkReplace: ['bulk replace', 'replace'], mngBulkDelete: ['bulk delete', 'remove many'], mngExport: ['export', 'download', 'file'],
    mngPurge: ['purge', 'wipe', 'clear all'], mngInfo: ['info', 'about', 'help'], mngUrls: ['links', 'urls', 'pictures'], pasteImport: ['paste', 'bulk paste', 'import'], checkIndex: ['check names', 'check again', 'check index', 'draw index check', 'verify', 'look up'],
    copyExport: ['export', 'copy', 'file', 'download'], deleteBin: ['delete', 'remove', 'trash', 'bin'], deleteAll: ['delete all', 'wipe', 'purge'], broom: ['clean', 'tidy', 'clear'],
    plus: ['add', 'quick add', 'new', 'plus', 'create'], edit: ['edit', 'change', 'modify', 'update'], filter: ['filter', 'select', 'narrow', 'funnel', 'view selected'],
    checkmark: ['done', 'saved', 'yes', 'ok', 'select all', 'selected', 'success'], check: ['tick', 'selected', 'yes'], cross: ['no', 'error', 'clear', 'cancel', 'fail', 'miss'],
    keep: ['revert', 'undo', 'keep', 'restore'], returnArrow: ['back', 'home', 'return', 'previous', 'way back'], left: ['previous', 'left', 'page back'], right: ['next', 'right', 'page forward'],
    expand: ['open', 'expand', 'details', 'view', 'expand view', 'card'], collapse: ['close', 'collapse', 'less'], guide: ['guide', 'help', 'how to', 'format', 'manual'],
    search: ['search', 'find', 'look up', 'magnifier', 'results'], gunsmithSearch: ['gunsmith search', 'find build', 'loadout search'], viewSaved: ['saved', 'review', 'view saved', 'history', 'look back'],
    eyedropper: ['colour', 'color', 'pick', 'sample'], warn: ['warning', 'needs a look', 'missing', 'attention', 'gap'], info: ['info', 'note', 'tip'], helpHint: ['hint', 'help', 'tip'],
    locked: ['locked', 'private', 'owner only'], accessDenied: ['denied', 'no access', 'blocked'], botAccess: ['access', 'admins', 'permissions'], serverSettings: ['server', 'admin', 'policy'],
    accept: ['accept', 'approve', 'yes'], pending: ['pending', 'waiting', 'review', 'queue'], deny: ['deny', 'reject', 'no'], dispute: ['dispute', 'appeal', 'report'],
    feedback: ['feedback', 'bug', 'suggestion', 'report'], credit: ['credit', 'author', 'made by'], share: ['share', 'show everyone', 'public'], shareHeart: ['share', 'invite', 'link'],
    command: ['command', 'slash', 'text command'], cooldown: ['cooldown', 'wait', 'timer', 'slow down'], offPrivate: ['off', 'private', 'hidden'], onPublic: ['on', 'public', 'shown'],
    // seasonal content
    calendar: ['calendar', 'dates', 'schedule', 'events'], newDraws: ['new draw', 'new draws', 'draw', 'lucky draw'], returningDraws: ['returning draw', 'returning draws', 'rerun', 'draw'],
    patchNotes: ['patch notes', 'update', 'changes'], events: ['events', 'event'], modes: ['modes', 'playlists', 'playlist', 'mode'], announcements: ['announcement', 'news', 'post'],
    dbAnnouncement: ['announcement', 'post'], news: ['news', 'leaks', 'official', 'triage'], dailyUpdate: ['daily update', 'reset', 'today'], timestamp: ['timestamp', 'time', 'date', 'end date', 'clock'],
    timezone: ['timezone', 'zone', 'time'], remind: ['reminder', 'bell', 'notify'], remindAlert: ['heads up', 'alert', 'warning'], addReminder: ['add reminder', 'bell', 'subscribe'],
    disableReminder: ['turn off', 'unsubscribe', 'mute'], reminderEnabled: ['following', 'on', 'subscribed'],
    drawPrices: ['draw prices', 'price', 'cost'], calculator: ['calculator', 'calc', 'cost'], calculate: ['calculate', 'run'], newCalc: ['new calculation', 'start over'], saveStar: ['save', 'favourite', 'star'],
    // gunsmith
    loadouts: ['loadouts', 'builds', 'gunsmith'], gunsmithList: ['lists', 'gunsmith list'], gunsmithCode: ['code', 'gunsmith code', 'share code'], copyAttachments: ['copy', 'attachments'],
    meta: ['meta', 'best', 'badge'], best: ['best', 'badge'], top3: ['top 3', 'tier', 'badge'], top5: ['top 5', 'tier', 'badge'], toxic: ['toxic', 'badge'], ass: ['ass', 'badge'], hm: ['honourable mention', 'badge'],
    buff: ['buff', 'stronger', 'patch'], nerf: ['nerf', 'weaker', 'patch'], fix: ['fix', 'bug fix', 'patch'], diffAdd: ['added', 'plus', 'diff'], diffMinus: ['removed', 'minus', 'diff'],
    // colours and dots
    settings: ['settings', 'preferences', 'options'], showColors: ['colours', 'colors', 'palette'], swatches: ['swatches', 'palette'],
    greenDotGlow: ['active', 'live', 'on', 'status'], yellowDotGlow: ['leaving soon', 'ending soon', 'soon', 'status'], redDotGlow: ['ended', 'over', 'off', 'status'],
    blueDotGlow: ['upcoming', 'status'], lightBlueDotGlow: ['upcoming', 'not yet', 'status'], whiteDotGlow: ['neutral', 'status'], smallDot: ['bullet', 'dot', 'unselected'], blank: ['spacer', 'indent', 'blank'],
};

const words = (s) => String(s || '').replace(/([a-z])([A-Z0-9])/g, '$1 $2').replace(/[_\-]+/g, ' ').toLowerCase().split(/\s+/).filter(Boolean);

// Every word a key answers to: the curated ones, then its own name's and its Discord name's.
function tagsFor(key) {
    const mention = require('./emojiMap')[key];
    const discordName = typeof mention === 'string' ? (mention.match(/^<a?:(\w+):\d+>$/) || [])[1] : '';
    return [...new Set([...(TAGS[key] || []), ...words(key), ...words(discordName)])];
}

// The emojiMap keys that fit a word or phrase, best first: a curated phrase match, then a curated word, then a word of the name.
function findEmoji(query) {
    const q = String(query || '').toLowerCase().trim();
    if (!q) return [];
    const map = require('./emojiMap');
    const keys = Object.keys(map).filter(k => typeof map[k] === 'string' && /^<a?:\w+:\d+>$/.test(map[k]));
    const score = (k) => {
        const curated = TAGS[k] || [];
        if (curated.includes(q)) return 3;
        if (curated.some(t => t.split(' ').includes(q) || q.split(' ').every(w => t.includes(w)))) return 2;
        return tagsFor(k).includes(q) ? 1 : 0;
    };
    return keys.map(k => [k, score(k)]).filter(([, s]) => s).sort((a, b) => b[1] - a[1]).map(([k]) => k);
}

module.exports = { TAGS, tagsFor, findEmoji };
