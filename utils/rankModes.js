// utils/rankModes.js
//
// The Rank Mode badge family (Harkirat's spec, 2026-09-25 23:28 EDT, designed on Board 4): the ranked modes a build is recommended for. MP only, any number of them per build (his 2026-09-26 16:26 EDT), stored in this order. One list, read by the model's enum, the parser, the card and the bulk export, so a seventh mode is one line here.
const RANK_MODES = ['HP', 'S&D', 'DOM', 'TDM', 'FTL', 'Control'];

// What an admin may type on the Badges line. The aliases are the board's (docs/pins2/kit/b4/bulkformat.js): snd and sd for S&D, ctrl for Control.
const RANK_MODE_TOKENS = { hp: 'HP', 's&d': 'S&D', snd: 'S&D', sd: 'S&D', dom: 'DOM', tdm: 'TDM', ftl: 'FTL', control: 'Control', ctrl: 'Control' };

// The application emoji each mode is drawn with, looked up BY NAME at render time (utils/emojiMap.js's byName), because the animated set is made in a parallel session and lands on the dev and prod apps after this code. A name with no emoji on the app renders as the bare word, never as a broken mention. Discord emoji names take letters, digits and underscores only, so S&D is SnD.
const RANK_MODE_EMOJI = { HP: 'RM_HP', 'S&D': 'RM_SnD', DOM: 'RM_DOM', TDM: 'RM_TDM', FTL: 'RM_FTL', Control: 'RM_Control' };

// The stored names, lower-cased, are what the bulk export and the edit modal write back.
const rankModeToken = (m) => m.toLowerCase();

module.exports = { RANK_MODES, RANK_MODE_TOKENS, RANK_MODE_EMOJI, rankModeToken };
