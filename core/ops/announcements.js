// core/ops/announcements.js
//
// Three announcement mutations, as ops. Announcements are THEIR OWN DOCUMENTS (models/Announcement.js), so this uses core/mongo/document.js -- never core/mongo/positional.js, which would match nothing against a top-level document and return { ok:false, reason:'missing' }, indistinguishable from a legitimate outcome.
//
// ⚠️ `expiresAt` semantics: the real handler (handlers/manage/announcements.js) never accepts an absolute expiry date -- utils/announcement.js's computeExpiresAt() only understands blank (60-day default), "never"/"none", or a whole number of DAYS FROM NOW. `validatePost` below reproduces that exact contract via payload.expiry (a raw string), NOT payload.expiresAt as an absolute date string -- an earlier draft of this op's own test assumed the latter and would have rejected every valid post. `startsAt` (new field, this task) IS an absolute admin date, parsed the same UTC-0 way every other admin date field is (adminParser.js's parseAdminDate) -- "starts on" reads naturally as a calendar date, unlike "expires in".
const mongoose = require('mongoose');
const { registerEntity } = require('./index');
const { updateDocument, createDocument, deleteDocument } = require('../mongo/document');
const { computeExpiresAt, generateAccentColor } = require('../../utils/announcement');
const { parseAdminDate } = require('../../utils/adminParser');
const { cacheAnnouncementBanner } = require('../../utils/announcementBannerCache');
const Announcement = require('../../models/Announcement');

// An invert()-produced payload already carries a real `expiresAt` (Date|null) and `startsAt` (Date|null) -- re-running it through computeExpiresAt/parseAdminDate would either fail outright (a Date is not a day-count string) or, worse, silently reinterpret it. `hasOwnProperty` (not a truthy check) is required because `expiresAt: null` ("never expires") is a legitimate, real value.
const alreadyNormalized = (payload) => payload && Object.prototype.hasOwnProperty.call(payload, 'expiresAt');

function truncate(text) {
    return text.length > 60 ? `${text.slice(0, 57)}...` : text;
}

function validatePost(payload) {
    const errors = [];
    const text = (payload?.text || '').trim();
    if (!text) errors.push('An announcement needs text.');

    let expiresAt;
    if (alreadyNormalized(payload)) {
        expiresAt = payload.expiresAt;
    } else {
        expiresAt = computeExpiresAt(payload?.expiry ?? '');
        if (expiresAt === undefined) {
            errors.push(`"${payload?.expiry}" wasn't understood -- leave it blank for the 60-day default, type a whole number of days, or type "never".`);
        }
    }

    let startsAt = payload?.startsAt ?? null;
    if (startsAt && !(startsAt instanceof Date)) {
        const parsed = parseAdminDate(startsAt);
        if (!parsed) errors.push(`Could not read the start date "${startsAt}".`);
        startsAt = parsed;
    }

    // Optional banner image (added 2026-09-13 17:34 EDT, portal pins batch 2, spec section 7) -- an https URL string, or null for "no image". No upload pipeline here: the composer decides how a URL is produced, this op only ever validates the string it is handed. The raw shape (a string or null/blank) never differs between a fresh submission and a replayed invert, so this needs no alreadyNormalized-style branch.
    let bannerImageUrl = payload?.bannerImageUrl;
    bannerImageUrl = (bannerImageUrl == null ? '' : String(bannerImageUrl)).trim() || null;
    if (bannerImageUrl && !/^https:\/\/\S+$/i.test(bannerImageUrl)) {
        errors.push('The banner image needs to be a full https:// URL.');
    }

    // Optional repeat count (same task) -- a whole number >= 1, or null for the pre-existing one-time-only behaviour. The 24h minimum between showings is fixed (utils/announcement.js's MIN_HOURS_BETWEEN_REPEATS) and is not itself an input here.
    let repeatCount = payload?.repeatCount;
    if (repeatCount === undefined || repeatCount === null || repeatCount === '') {
        repeatCount = null;
    } else {
        const n = Number(repeatCount);
        if (!Number.isInteger(n) || n < 1) {
            errors.push('Repeat count must be a whole number of 1 or more, or left blank to show only once.');
            repeatCount = null;
        } else {
            repeatCount = n;
        }
    }

    if (errors.length) return { ok: false, errors };
    if (startsAt && expiresAt && startsAt > expiresAt) {
        return { ok: false, errors: ['An announcement that starts after it expires can never show.'] };
    }
    return {
        ok: true, errors: [],
        normalized: {
            payload: {
                text, expiresAt, startsAt, bannerImageUrl, repeatCount,
                color: payload?.color ?? null,
                createdAt: payload?.createdAt ?? null,
                createdBy: payload?.createdBy ?? null
            }
        }
    };
}

registerEntity('announcements', {
    'announcement.post': {
        action: 'announcement:post', tier: 1,
        validate: (op) => validatePost(op.payload),
        preview: (op) => ({ before: {}, after: { text: op.payload.text, expiresAt: op.payload.expiresAt, startsAt: op.payload.startsAt } }),
        apply: async (op, { session, actorId }) => {
            const color = op.payload.color ?? generateAccentColor();
            // Minted ahead of the write (same move as core/ops/patchnotes.js's addSeason) so the banner re-host below has a real _id to key its Cloudinary public_id on before the document exists.
            const _id = new mongoose.Types.ObjectId();
            let bannerImageUrl = op.payload.bannerImageUrl || null;
            let bannerUploadError = null;
            if (bannerImageUrl) {
                const up = await cacheAnnouncementBanner(String(_id), bannerImageUrl);
                bannerImageUrl = up.url;
                if (!up.cached && up.error) bannerUploadError = up.error;
            }
            const doc = {
                _id,
                text: op.payload.text,
                createdBy: op.payload.createdBy || actorId,
                expiresAt: op.payload.expiresAt,
                startsAt: op.payload.startsAt || null,
                bannerImageUrl,
                repeatCount: op.payload.repeatCount ?? null,
                color
            };
            if (op.payload.createdAt) doc.createdAt = op.payload.createdAt;
            const res = await createDocument({ Model: Announcement, doc, session });
            return {
                ok: true,
                change: { action: 'add', model: 'Announcement', target: truncate(op.payload.text), summary: 'Posted a new announcement',
                          detail: bannerUploadError ? `Banner image upload failed: ${bannerUploadError}. The raw link was stored instead.` : undefined },
                applied: { id: res.id, color, createdAt: doc.createdAt || new Date(), createdBy: doc.createdBy, expiresAt: doc.expiresAt, startsAt: doc.startsAt, bannerImageUrl: doc.bannerImageUrl, repeatCount: doc.repeatCount }
            };
        },
        invert: (c) => ({ type: 'announcement.delete', target: { id: c.applied.id } })
    },

    'announcement.edit': {
        action: 'announcement:edit', tier: 1,
        validate: (op) => op.target?.id ? validatePost(op.payload) : { ok: false, errors: ['No announcement was selected.'] },
        preview: async (op) => ({ before: await Announcement.findById(op.target.id).lean(), after: op.payload }),
        apply: async (op, { session }) => {
            const cur = await Announcement.findById(op.target.id).session(session).lean();
            if (!cur) return { ok: false, reason: 'missing' };
            let bannerImageUrl = op.payload.bannerImageUrl || null;
            let bannerUploadError = null;
            // Only re-hosts when the value actually CHANGED and is not already one of our own delivery URLs -- an edit that leaves the banner field untouched (the common Discord-modal path, which resends the CURRENT value verbatim, see handlers/manage/announcements.js) must not re-upload the same asset under a fresh hash on every unrelated text/date fix.
            if (bannerImageUrl && bannerImageUrl !== cur.bannerImageUrl) {
                const up = await cacheAnnouncementBanner(op.target.id, bannerImageUrl);
                bannerImageUrl = up.url;
                if (!up.cached && up.error) bannerUploadError = up.error;
            }
            const set = { text: op.payload.text, expiresAt: op.payload.expiresAt, startsAt: op.payload.startsAt || null, bannerImageUrl, repeatCount: op.payload.repeatCount ?? null };
            const res = await updateDocument({ Model: Announcement, id: op.target.id, expectVersion: cur.__v, set, session });
            if (!res.ok) return res;
            return {
                ok: true,
                change: { action: 'edit', model: 'Announcement', target: truncate(op.payload.text), summary: 'Edited an announcement',
                          detail: bannerUploadError ? `Banner image upload failed: ${bannerUploadError}. The raw link was stored instead.` : undefined },
                applied: { id: op.target.id, prior: { text: cur.text, expiresAt: cur.expiresAt, startsAt: cur.startsAt || null, bannerImageUrl: cur.bannerImageUrl || null, repeatCount: cur.repeatCount ?? null }, expiresAt: set.expiresAt, startsAt: set.startsAt, bannerImageUrl: set.bannerImageUrl, repeatCount: set.repeatCount }
            };
        },
        invert: (c) => ({ type: 'announcement.edit', target: { id: c.applied.id }, payload: c.applied.prior })
    },

    'announcement.delete': {
        action: 'announcement:delete', tier: 1,
        validate: (op) => op.target?.id ? { ok: true, errors: [], normalized: op } : { ok: false, errors: ['No announcement was selected.'] },
        preview: async (op) => ({ before: { announcement: await Announcement.findById(op.target.id).lean() }, after: { announcement: null } }),
        apply: async (op, { session }) => {
            const cur = await Announcement.findById(op.target.id).session(session).lean();
            if (!cur) return { ok: false, reason: 'missing' };
            const res = await deleteDocument({ Model: Announcement, id: op.target.id, expectVersion: cur.__v, session });
            if (!res.ok) return res;
            const { _id, __v, ...rest } = cur;
            return {
                ok: true,
                change: { action: 'delete', model: 'Announcement', target: truncate(cur.text), summary: 'Deleted an announcement' },
                applied: { removed: rest }
            };
        },
        invert: (c) => ({ type: 'announcement.post', payload: { ...c.applied.removed } })
    }
});
