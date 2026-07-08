// utils/emojiMap.js

// Buttons have a dedicated `emoji` field ({ id, name, animated }) — unlike Text Displays, a
// button's `label` is plain text only, so pasting a raw "<a:Name:123>" mention string into label
// just shows that literal text instead of rendering the emoji. This parses the mention strings
// above into the object shape ButtonBuilder/the raw API expects.
function parseEmoji(mention) {
    const match = mention.match(/^<(a)?:(\w+):(\d+)>$/);
    if (!match) return undefined;
    return { animated: !!match[1], name: match[2], id: match[3] };
}

module.exports = {
    mythic: '<:7Mythic_CODM:1523190107614744757>',
    legendary: '<:5Legendary_CODM:1523190105152688158>',
    legacy: '<:6Legacy_CODM:1523190105739886663>',
    epic: '<:4Epic_CODM:1523190104489857054>',
    bp: '<:BP_CODM:1523190108386365470>',
    rank: '<:Rank_7Legendary_CODM:1523190127025717360>',
    dmz: '<:DMZ_CODM:1523190115319549963>',
    cp: '<:CP_CODM:1523190109753839637>',
    // Added for the command heading redesign (calendar/draws/patchnotes/settings)
    calendar: '<a:Calendar:1523762208050385107>',
    newDraws: '<a:NewDraws:1523837409211453613>',
    returningDraws: '<a:ReturningDraws:1523838126596817016>',
    patchNotes: '<a:PatchNotes:1523762216954888286>',
    settings: '<a:Settings:1523762203537309696>',
    timestamp: '<a:Timestamps:1523762211103969420>',
    drawPrices: '<a:DrawPrices:1523837407189930066>',
    b1: '<:b1:1523852972835082371>',
    // Shared pagination arrows (utils/paginationRow.js) — used by every command with a Prev/Next
    // page row, not just one specific command's list.
    left: '<:Left:1523864238836154449>',
    right: '<:Right:1523864237972127775>',
    // Loadout "badges" (utils/loadoutRender.js) — Meta/Best-in-category/Top-N-in-category flags
    // shown under the weapon name. `best` and `top` are two DISTINCT emojis (Best-in-category vs.
    // Top-N-in-category are different tiers, see buildBadgesLine()) — don't reuse one for the
    // other. `blank` is a zero-width spacer emoji used to separate two badges on one line without a
    // visible bullet/divider character.
    meta: '<a:Meta:1524259849745989723>',
    best: '<a:Best:1524235235070312488>',
    top: '<a:Top:1524183479997169714>',
    blank: '<:blank:1524243739206352906>',
    parseEmoji
};