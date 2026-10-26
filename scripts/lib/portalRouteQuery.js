// scripts/lib/portalRouteQuery.js — the routes that refuse a request naming no scope.
//
// 🔴 ONE QUANTITY, ONE AUTHORITY. Two test files drive every GET route with its bare path — portalRoutes against the real handlers, portalHarness against the fixture stub — and two of those routes now answer 400 without a scope, on purpose: an export that names nothing used to answer 200 with an empty string, which reads as "there was nothing to export" rather than "you did not say what to export". Those are very different when the file is the stated way back from a purge.
//
// ⚠️ The map lives here rather than in either test because a copy in each is a copy that drifts: the one in the harness test would keep passing while the real route's contract changed, which is the exact shape of defect this whole branch has been finding. ⚠️ FIVE ROUTES NOW, NOT TWO. Broadcast, Access and Analytics gained export routes on 2026-08-27 and the harness gate failed on all three within one run -- not because the stubs were wrong, but because a route absent from this map is driven with a bare path, answers 400, and reports as "the stub omits text, count". That is the map doing its job: a new export cannot be added in one place.
module.exports = {
    '/api/armory/export': '?mode=MP',
    '/api/season/export': '?scope=calendar',
    '/api/broadcast/export': '?scope=all',
    '/api/access/export': '?scope=admins',
    '/api/analytics/export': '?scope=usage',
};
