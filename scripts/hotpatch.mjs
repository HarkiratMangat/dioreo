#!/usr/bin/env node
// scripts/hotpatch.mjs — reload changed files into the RUNNING bot, or say why it can't.
//
//   node scripts/hotpatch.mjs --dry-run              # plan only, nothing changes  ← start here
//   node scripts/hotpatch.mjs --pull                 # git pull, then reload what changed
//   node scripts/hotpatch.mjs commands/drawprices.js # limit to one changed file
//
// It does NOT reload anything itself -- it cannot: a separate process has its own module cache. It hands a request to the live process over SIGUSR2 and prints what came back.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const request = {
    pull: args.includes('--pull'),
    dryRun: args.includes('--dry-run'),
    files: args.filter(a => !a.startsWith('--')),
};

function botPid() {
    // systemd first (the VM), then the instance-lock doc's pid is NOT used deliberately -- reading it needs Mongo credentials this script has no reason to hold.
    try {
        const pid = execFileSync('systemctl', ['show', 'diors-bot', '-p', 'MainPID', '--value'], { encoding: 'utf8', timeout: 3000 }).trim();
        if (/^\d+$/.test(pid) && pid !== '0') return Number(pid);
    } catch { /* not on the VM */ }
    try {
        return Number(execFileSync('pgrep', ['-f', 'node index.js'], { encoding: 'utf8', timeout: 3000 }).trim().split('\n')[0]);
    } catch { return null; }
}

const pid = botPid();
if (!pid) { console.error('✖ Could not find a running bot process (systemd unit diors-bot, or `node index.js`).'); process.exit(1); }

const resPath = path.join(ROOT, '.hotpatch-result');
fs.rmSync(resPath, { force: true });
fs.writeFileSync(path.join(ROOT, '.hotpatch-request'), JSON.stringify(request));
process.kill(pid, 'SIGUSR2');
console.log(`→ sent SIGUSR2 to pid ${pid}${request.dryRun ? ' (dry run)' : ''}`);

// Poll rather than watch: 10s is generous for a local swap, and a `git pull` is the slow part. Top-level await -- this is an .mjs file, so a real async sleep is available and there is no reason to spawn a Node process per tick just to wait.
const deadline = Date.now() + 10_000;
while (Date.now() < deadline) {
    if (fs.existsSync(resPath)) {
        const out = JSON.parse(fs.readFileSync(resPath, 'utf8'));
        console.log(JSON.stringify(out, null, 2));
        process.exit(out.error || out.plan?.verdict !== 'ALLOW' ? 1 : 0);
    }
    await new Promise(resolve => setTimeout(resolve, 200));
}
console.error('✖ No response within 10s — is the bot healthy? Check `journalctl -u diors-bot -n 50`.');
process.exit(1);
