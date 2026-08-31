---
kind: reference
status: live
---

# Product

<!-- impeccable:product-schema 1 -->

*Scope: the **Dioreo admin portal** (`portal.dioreo.app`). The Discord bot's in-client panels and the public `dioreo.app` document site are separate surfaces and are not covered by this record. Written 2026-08-30 11:13 EDT during an impeccable `init` trial; product facts confirmed by Harkirat in that session's interview.*

## Platform

web

## Users

The portal's primary user is **Harkirat, operating alone today** — the sole admin of Dioreo, who knows every affordance because he specified it. He arrives already knowing what he came to change: a draw's dates are wrong, a season needs its track filled in, a loadout image is broken. He is not exploring.

**A second admin is a real near-term possibility, not a hypothetical.** `models/AdminUser.js` and the per-page permission scopes (`hasManagePageAccess`) already exist in the codebase, so the data model is built for several admins with different reach. The design consequence is a middle path, confirmed in the interview: dense defaults for the operator who knows the tool, but affordances that stay discoverable rather than being designed out — the portal should not become unreadable to its second user in exchange for saving its first user a pixel.

## Product Purpose

The portal is the **depth surface** for administering Dioreo's content. Its counterpart is Discord: the settled division (recorded in the `project_discord_glance_portal_depth` memory) is that **Discord is a glance** — one question, one screenful — and **the portal is depth** — pagers, filters, exports, bulk work, and anything that needs more room than a Discord message can hold.

Success is that a content change Harkirat could previously only make through `/manage`'s modal chain can be made faster, with more of the surrounding state visible, and with the same safety guarantees.

## Positioning

The portal drives the **operation core** (`core/`) — the same algebra of `validate` / `preview` / `apply` / `invert` that backs `/manage`. It is not a second implementation of the admin surface; it is a second *driver* of one implementation. That is the mechanism a neighboring admin panel could not truthfully copy: every mutation is a value that can be previewed before it lands and inverted after it does, so undo is a property of the data model rather than a feature bolted onto the UI.

## Operating Context

- Reached at `portal.dioreo.app` through a Cloudflare Tunnel; served by `portal/server.js` with Discord OAuth (`portal/auth.js`) as the only way in.
- Organised into **realms** — `season`, `armory`, `broadcast`, `access`, `analytics` — each a distinct administrative territory rather than a page of a settings tree. Season carries its own views (Board, Track, Repairs).
- The work is **editing live content that players see**: draws, calendar entries, patch notes, loadouts, seasons, announcements. A mistake is visible in Discord immediately, which is why preview-and-invert is load-bearing rather than decorative.
- Sessions are short and errand-shaped. The portal is opened to do a specific thing and closed.

## ⚠️ Which facts here are CACHES

Several statements below copy something the codebase already states authoritatively, and **nothing checks them** — `docs-audit` validates this file's shape, never its content. Treat each as a pointer that may have rotted, and read the source before relying on it: the realm list is `REALMS` in `portal/ui/`; the operation list is the contents of `core/ops/`; the stack is `package.json` plus CLAUDE.md's runtime-layout table; the permission rule is `.claude/rules/operation-core.md`. Add a realm or an op and this file is silently wrong. The facts that are NOT caches — and are the reason this file exists — are the Users section, the `Undecided:` line, and the Product Principles.

## Capabilities and Constraints

- Every mutation routes through `core/ops/*` — `announcements`, `calendar`, `draws`, `loadouts`, `patchnotes`, `season`. `portal/` contains no business logic of its own.
- `validate()` on any op runs on **both** a fresh submission and a replayed inverse, so the UI must not assume its own field shapes survive a round trip.
- Permission scoping is per-page, not per-user-role: an op with no `/manage` action must declare `page:`, and that column is the scope permission is checked against.
- The frontend is **Preact + htm** in `portal/ui/`, deliberately buildless-adjacent — no JSX compile step in the authoring path.
- **The design authority is a set of mockups, and conformance to them is measured, not judged.** `npm run portal:audit` and the overlay tooling produce a numeric difference against the mockup; a realm is closed when that number is small, not when it looks right. ⚠️ **That was true until 2026-08-31, when the two rendering modes collapsed into one.** There is no stand-down flag any more: the portal renders one thing, which is what is measured and what ships. Where the design was wrong — a promise of a safeguard that does not exist, a status line that would assert a broken image was healthy, a keyboard path the design omits — the portal's version was kept and says so in a comment. **So the number has a floor made of those decisions, and a realm closes when the remaining regions are exactly them.**
- **Undecided:** whether the portal ever serves a non-admin reader. Nothing in the current record answers this and future work must not assume either way.

## Brand Commitments

- The product is **Dioreo**. The former name "Dior's Builds" is retired for new writing but is still a protected Brand Asset under the licence — retiring a name did not release it.
- The codebase is **source-available, not open source** (Dioreo Source-Available License v1.1). The portal must never be described or styled as an open-source admin tool.
- The public site at `dioreo.app` carries an established visual identity (the metaball nav, the document-page families). The portal is a sibling of that identity, not a copy of it, and the mockups are the binding statement of what it looks like.

## Evidence on Hand

- **Real content and real data.** Every realm edits live production records; there is no seeded demo dataset. Screens should be designed against real season/draw/loadout shapes, not invented ones.
- **The mockups are the design evidence** and take precedence over inference from the built portal — with the standing caveat (memory `feedback_read_the_already_built_layer`) that `portal/ui/*` has at times been *ahead* of the mockup that specifies it, so a mismatch is a question, not automatically a defect in the code.
- **No testimonials, customers, benchmarks, pricing, or user counts exist.** Future work must not fabricate any of these; the product has one confirmed user.

## Product Principles

1. **Depth is the portal's job.** Anything that fits in a glance belongs in Discord; the portal earns its existence on the work Discord cannot hold.
2. **Preview before apply, invert after.** Safety is a property of the operation core and the UI must expose it, never route around it.
3. **Dense for the operator, legible for the next one.** Density is chosen, not maximal — the second admin must still be able to find things.
4. **Conformance is a number.** Where a mockup exists, agreement with it is measured; taste is not the closing argument.
5. **One implementation, two drivers.** The portal and `/manage` share `core/`; a capability that exists in only one of them is a gap to explain, not a feature.

## Accessibility & Inclusion

No product-specific accessibility requirement has been established for the portal. The public site holds the repo's existing WCAG AA contrast discipline (both themes), and the portal inherits that expectation by convention rather than by a stated requirement.
