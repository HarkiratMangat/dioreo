// scripts/auditLoadouts.js
//
// A read-only audit of every gunsmith build (Harkirat, 2026-11-06 19:17 EST: "a build data audit ... let's do this next"). Writes nothing to the database. Usage: node --env-file=<env> scripts/auditLoadouts.js [--pictures] [--out <file.md>]
//   --pictures  also asks Cloudinary for each build's picture (one HEAD request per option)
//   --out       writes the report as Markdown; without it the report prints
//
// `auditBuilds(builds, catalogue)` is pure (scripts/auditLoadouts.test.js pins it): each finding is { kind, weapon, build, detail }.
const MP_EQUIP_CAP = 5;

function auditBuilds(builds, { knownAttachment = () => true, isPlaceholder = () => false } = {}) {
    const lo = require('../utils/loadoutOptions');
    const form = require('../utils/loadoutForm');
    const { gunsmithCodeProblem } = require('../utils/adminParser');
    const findings = [];
    const add = (kind, b, tag, detail) => findings.push({ kind, weapon: b.weaponName, build: tag, mode: b.mode, detail });
    const byWeapon = {};
    for (const b of builds) (byWeapon[`${b.weaponKey}|${b.mode}`] = byWeapon[`${b.weaponKey}|${b.mode}`] || []).push(b);
    for (const group of Object.values(byWeapon)) {
        const sorted = [...group].sort(form.compareBuilds);
        // Numbering: Build 1..N with no gap and no repeat, and no legacy name holding a label.
        const nums = sorted.map(b => form.buildNumberOf(b.buildName));
        sorted.forEach((b, i) => {
            if (isPlaceholder(b)) return;
            if (nums[i] === null) add('name', b, b.buildName, 'not named "Build N" (an older build holding its label as its name)');
        });
        const real = nums.filter(n => n !== null);
        if (new Set(real).size !== real.length) add('numbering', sorted[0], '-', `two builds share a number (${real.join(', ')})`);
        else if (real.length && Math.max(...real) !== real.length) add('numbering', sorted[0], '-', `numbers have a gap (${[...real].sort((a, z) => a - z).join(', ')})`);
        // Category: one per weapon.
        const cats = [...new Set(sorted.filter(b => !isPlaceholder(b)).map(b => b.category))];
        if (cats.length > 1) add('category', sorted[0], '-', `builds disagree on class: ${cats.join(', ')}`);
        const seenCodes = new Map(), seenSets = new Map();
        for (const b of sorted) {
            if (isPlaceholder(b)) { if (sorted.length > 1) add('placeholder', b, b.buildName, 'a Coming Soon placeholder beside real builds'); continue; }
            const n = form.buildNumberOf(b.buildName) ?? '?';
            if (b.isAss && (b.isMeta || b.categoryRank || b.dmzRangeRank)) add('badges', b, String(n), 'Ass together with Meta or a tier');
            lo.optionsOf(b).forEach((o, i) => {
                const tag = lo.optionTag(n, i);
                const atts = (o.attachments || []).filter(a => String(a || '').trim());
                if (b.mode === 'MP') {
                    if (!o.shareCode) add('code', b, tag, 'MP build with no gunsmith code');
                    else {
                        const p = gunsmithCodeProblem(o.shareCode);
                        if (p) add('code', b, tag, `code \`${o.shareCode}\` ${p}`);
                        const key = String(o.shareCode).toUpperCase();
                        if (seenCodes.has(key)) add('duplicate', b, tag, `same code as ${seenCodes.get(key)}`); else seenCodes.set(key, tag);
                    }
                    if (atts.length > MP_EQUIP_CAP) add('attachments', b, tag, `${atts.length} attachments; MP equips ${MP_EQUIP_CAP}`);
                }
                if (!atts.length) add('attachments', b, tag, 'no attachments');
                if (new Set(atts.map(a => a.toLowerCase())).size !== atts.length) add('attachments', b, tag, 'an attachment listed twice');
                const set = [...atts].map(a => a.toLowerCase()).sort().join('|');
                if (set && seenSets.has(set)) add('duplicate', b, tag, `same attachments as ${seenSets.get(set)}`); else if (set) seenSets.set(set, tag);
                const unknown = atts.filter(a => !knownAttachment(a));
                if (unknown.length) add('catalogue', b, tag, `not in the catalogue: ${unknown.join(', ')}`);
                if ((o.attachmentSlots || []).length && o.attachmentSlots.length !== (o.attachments || []).length) add('slots', b, tag, `${o.attachmentSlots.length} slot labels for ${(o.attachments || []).length} attachments`);
                if (!o.imageKey) add('picture', b, tag, 'no picture key');
            });
        }
    }
    return findings;
}

const KIND_ORDER = ['code', 'duplicate', 'numbering', 'name', 'category', 'attachments', 'catalogue', 'slots', 'badges', 'placeholder', 'picture', 'picture-missing'];
const KIND_LABEL = { code: 'Gunsmith codes', duplicate: 'Duplicates', numbering: 'Build numbering', name: 'Build names', category: 'Class (category)', attachments: 'Attachments', catalogue: 'Names the catalogue lacks', slots: 'Slot labels', badges: 'Badges', placeholder: 'Placeholders', picture: 'Pictures (no key)', 'picture-missing': 'Pictures that do not load' };

function report(findings, { total, db, at }) {
    const lines = [`# Gunsmith build audit`, '', `Read ${at} from \`${db}\`: ${total} builds, ${findings.length} findings.`, '', '| Kind | Count |', '|---|---|'];
    for (const k of KIND_ORDER) { const n = findings.filter(f => f.kind === k).length; if (n) lines.push(`| ${KIND_LABEL[k]} | ${n} |`); }
    for (const k of KIND_ORDER) {
        const list = findings.filter(f => f.kind === k);
        if (!list.length) continue;
        lines.push('', `## ${KIND_LABEL[k]} (${list.length})`, '', '| Weapon | Mode | Build | Detail |', '|---|---|---|---|');
        for (const f of list.sort((a, b) => a.weapon.localeCompare(b.weapon))) lines.push(`| ${f.weapon} | ${f.mode} | ${f.build} | ${f.detail.replace(/\|/g, '/')} |`);
    }
    return lines.join('\n') + '\n';
}

if (require.main === module) {
    (async () => {
        const mongoose = require('mongoose');
        await mongoose.connect(process.env.MONGODB_URI);
        const Loadout = require('../models/Loadout');
        const catalogue = require('../utils/catalogue');
        const { isPlaceholderBuild, buildImageUrl } = require('../utils/loadoutRender');
        const lo = require('../utils/loadoutOptions');
        const form = require('../utils/loadoutForm');
        const idx = await catalogue.getCatalogueIndex();
        const builds = await Loadout.find({}).lean();
        const findings = auditBuilds(builds, { knownAttachment: a => idx.attachments.has(catalogue.normKey(a)), isPlaceholder: isPlaceholderBuild });
        if (process.argv.includes('--pictures')) {
            const { isRealImageKey } = require('../utils/loadoutImageCache');
            const jobs = [];
            for (const b of builds) {
                if (isPlaceholderBuild(b)) continue;
                const n = form.buildNumberOf(b.buildName) ?? '?';
                lo.optionsOf(b).forEach((o, i) => { if (o.imageKey && isRealImageKey(o.imageKey)) jobs.push({ b, tag: lo.optionTag(n, i), url: buildImageUrl(o.imageKey, o.imageVersion) }); });
            }
            for (let i = 0; i < jobs.length; i += 8) {
                await Promise.all(jobs.slice(i, i + 8).map(async j => {
                    const r = await fetch(j.url, { method: 'HEAD' }).catch(() => null);
                    if (!r || !r.ok) findings.push({ kind: 'picture-missing', weapon: j.b.weaponName, build: j.tag, mode: j.b.mode, detail: `picture \`${j.b.imageKey}\` answers ${r ? r.status : 'no response'}` });
                }));
            }
        }
        const at = new Date().toLocaleString('en-CA', { timeZone: 'America/New_York', hour12: false }).replace(',', '') + ' ET';
        const text = report(findings, { total: builds.length, db: mongoose.connection.name, at });
        const i = process.argv.indexOf('--out');
        if (i !== -1 && process.argv[i + 1]) { require('fs').writeFileSync(process.argv[i + 1], text); console.log(`${builds.length} builds, ${findings.length} findings -> ${process.argv[i + 1]}`); }
        else console.log(text);
        await mongoose.disconnect();
    })().catch(e => { console.error(e.message); process.exit(1); });
}

module.exports = { auditBuilds, report };
