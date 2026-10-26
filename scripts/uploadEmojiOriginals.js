// Uploads Harkirat's emoji originals (the main checkout's Logos-&-Emojis/emoji-originals, gitignored, on this Mac only) to Cloudinary's `emoji-originals/` folder, one asset per emoji named after it, so /emojis' Sync (utils/emojiSync.js) can reach the real files from the VM too. His ask, 2026-10-25 20:41 EDT: "ig this means you should upload our emoji folder to cloudinary".
//
//   node --env-file=.env.dev scripts/uploadEmojiOriginals.js            # dry run: what would go up
//   node --env-file=.env.dev scripts/uploadEmojiOriginals.js --write    # upload the ones not there yet
//   ... --write --overwrite                                             # replace ones already there (a redrawn emoji)
//
// The folder is new and nothing else writes to it, so this cannot touch an existing asset (the reason utils/cloudinaryDevGuard.js refuses dev writes elsewhere). ⚠️ Never log a raw Cloudinary error: its rejected object carries the account's key and secret (CLAUDE.md); only the message is printed.
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

const FOLDER = 'emoji-originals';
const MAIN = '/Applications/Claude Code/Diors-Builds';
const DIRS = [path.join(MAIN, 'Logos-&-Emojis', 'emoji-originals'), path.join(__dirname, '..', 'Logos-&-Emojis', 'emoji-originals')];
const EXT = new Set(['.avif', '.webp', '.gif', '.png', '.jpg', '.jpeg']);
const safe = (err) => err?.error?.message || err?.message || String(err).slice(0, 200);

(async () => {
    const write = process.argv.includes('--write');
    const overwrite = process.argv.includes('--overwrite');
    const dir = DIRS.find(d => fs.existsSync(d));
    if (!dir) { console.error('No emoji-originals folder found in', DIRS.join(' or ')); process.exit(1); }
    const files = fs.readdirSync(dir).filter(f => EXT.has(path.extname(f).toLowerCase())).sort();
    let existing = new Set();
    try {
        let cursor;
        do {
            const res = await cloudinary.api.resources({ type: 'upload', prefix: `${FOLDER}/`, max_results: 500, next_cursor: cursor });
            for (const r of res.resources) existing.add(r.public_id.slice(FOLDER.length + 1));
            cursor = res.next_cursor;
        } while (cursor);
    } catch (e) { console.error('Could not list the folder:', safe(e)); process.exit(1); }
    const todo = files.filter(f => overwrite || !existing.has(path.parse(f).name));
    console.log(`${files.length} originals in ${dir}; ${existing.size} already in ${FOLDER}/; ${todo.length} to upload${write ? '' : ' (dry run, pass --write)'}`);
    if (!write) return;
    let ok = 0, bad = 0;
    for (const f of todo) {
        const name = path.parse(f).name;
        try {
            await cloudinary.uploader.upload(path.join(dir, f), { public_id: `${FOLDER}/${name}`, resource_type: 'image', overwrite, unique_filename: false, use_filename: false });
            ok++;
        } catch (e) { bad++; console.error(`  ✗ ${f}: ${safe(e)}`); }
    }
    console.log(`uploaded ${ok}, failed ${bad}`);
})();
