// Board 3 version 2 — captures the dev portal's real API answers so the board can run the portal's own components on real data.
// Run from the repo root: node --env-file=.env.dev local/pins2-board-3/v2/capture.cjs
// Writes local/pins2-board-3/v2/data/*.json. Reads only; the one write is a dev PortalSession row, which mintSession refuses to make off localhost.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const { mintSession } = require(path.join(ROOT, 'scripts/lib/portalSession.cjs'));
const BASE = 'http://127.0.0.1:8787';
const OUT = path.join(__dirname, 'data');

(async () => {
    const s = await mintSession(ROOT, null);
    if (!s) throw new Error('no session minted');
    const headers = { cookie: `portal_session=${s.raw}` };
    const get = async (p) => {
        const r = await fetch(BASE + p, { headers });
        const body = await r.json();
        if (r.status !== 200) throw new Error(`${p} → ${r.status} ${JSON.stringify(body).slice(0, 200)}`);
        return body;
    };
    fs.mkdirSync(OUT, { recursive: true });
    const routes = {
        csrf: '/auth/csrf',
        armory: '/api/armory',
        review: '/api/review',
        broadcast: '/api/broadcast',
        analytics: '/api/analytics',
        analytics300: '/api/analytics?river=300',
        changeset: '/api/changeset',
    };
    const got = {};
    for (const [k, p] of Object.entries(routes)) {
        got[k] = await get(p);
        fs.writeFileSync(path.join(OUT, `${k}.json`), JSON.stringify(got[k]));
        const b = got[k];
        const keys = b && typeof b === 'object' ? Object.keys(b).map((x) => `${x}${Array.isArray(b[x]) ? `[${b[x].length}]` : ''}`).join(' ') : typeof b;
        console.log(k.padEnd(13), String(JSON.stringify(b).length).padStart(8), 'B ·', keys);
    }
    const list = Array.isArray(got.armory) ? got.armory : (got.armory.builds || got.armory.rows || got.armory.loadouts || []);
    const previews = {};
    for (const b of list) previews[b._id] = await get(`/api/armory/preview?id=${b._id}`);
    fs.writeFileSync(path.join(OUT, 'previews.json'), JSON.stringify(previews));
    console.log('previews     ', Object.keys(previews).length, 'builds', JSON.stringify(previews).length, 'B · first keys', Object.keys(Object.values(previews)[0] || {}).join(' '));
})().catch((e) => { console.error(e); process.exit(1); });
