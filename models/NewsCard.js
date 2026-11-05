// models/NewsCard.js -- one record per card Dioreo Admin posts in #news-distill for a post in a followed news channel (news-channel-triage, built 2026-11-04 20:02 EST).
//
// It holds the card's and the source post's ids and the items AS READ: game data (a draw's name, its dates, new or returning, where it goes). NEVER the post's text: a button re-reads the post from the channel when it needs it. No user id: the posts come from another server's announcement webhook. Deleted 30 days after the card is posted.
//
// ⚠️ SCHEMA-SAVE GOTCHA (root CLAUDE.md): a field not declared here is silently dropped on save.
const mongoose = require('mongoose');

const newsItemSchema = new mongoose.Schema({
    kind: { type: String, default: '' },          // draw | event | mode | patch
    change: { type: String, default: '' },        // new | returning | cancelled | changed | info
    name: { type: String, default: '' },
    rewards: [{ tier: { type: String }, name: { type: String } }],
    startText: { type: String, default: '' },     // the date words as the post wrote them
    endText: { type: String, default: '' },
    start: { type: Date, default: null },
    end: { type: Date, default: null },
    where: { type: String, default: 'live' },     // live | draft
    action: { type: String, default: 'info' },    // draw | calendar | patch | info
    drawType: { type: String, default: 'new' },   // new | returning
    certainty: { type: String, default: '' },     // confirmed | expected
    catalogueTitle: { type: String, default: '' },
    warnings: [{ type: String }],
    state: { type: String, default: 'open' },     // open | opened
    // A live item whose dates the post moves or completes (2026-11-05 11:06 EST): which live row, and the bot's own dates beside the post's.
    fixList: { type: String, default: '' },      // newDraws | returningDraws | calendar
    fixId: { type: String, default: '' },
    fixDrawType: { type: String, default: '' },
    curStart: { type: Date, default: null },
    curEnd: { type: Date, default: null },
    doubleCP: { type: Boolean, default: false },
    part: { type: String, default: '' },
}, { _id: false });

const newsCardSchema = new mongoose.Schema({
    sourceChannelId: { type: String, required: true },
    sourceMessageId: { type: String, required: true },
    sourceName: { type: String, default: '' },
    jumpUrl: { type: String, default: '' },
    postedAt: { type: Date, required: true },
    cardChannelId: { type: String, default: null },
    cardMessageId: { type: String, default: null },
    items: { type: [newsItemSchema], default: [] },
    dismissed: { type: Boolean, default: false },
    notes: [{ type: String }],
    // What news triage wrote into the Next Season Draft for this post (2026-11-04 23:59 EST): the ChangeLog id its Undo button reverts, one line per item, and why the rest were not drafted. Game data only.
    draftChangeId: { type: String, default: '' },
    draftLines: [{ type: String }],
    draftNotes: [{ type: String }],
    draftUndone: { type: Boolean, default: false },
    expireAt: { type: Date, required: true, expires: 0 },
}, { timestamps: true });
newsCardSchema.index({ sourceChannelId: 1, sourceMessageId: 1 }, { unique: true });

module.exports = mongoose.model('NewsCard', newsCardSchema);
