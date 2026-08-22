---
kind: reference
status: live
---

# Web admin portal — production launch checklist

The portal (`portal.dioreo.app`) is fully built on `feat/portal-operation-core`, developed and verified entirely against the `Dioreo (Dev)` Discord application and a local Mongo — never against prod. Merging the branch only updates code on GitHub; none of the steps below happen automatically, and as of the last check (2026-08-21 23:48 EDT) none of them have been done. This file is the single place that tracks whether each one is.

Consolidated 2026-08-21 23:48 EDT from two places that used to say part of this each: `docs/ROADMAP.md`'s web-admin-portal bullet (the "why" and the plan links) and `docs/reference/deployment-and-ops.md`'s "Web admin portal" section (the "how" — exact commands, config keys, unit files). Both now point here for status; neither duplicates this checklist.

## Status

- [ ] **Deploy the code to the VM.** `git pull` + `scripts/deploy.sh` (or a manual first pull) once the branch has merged to `v3-pre-release`.
- [ ] **Register real Discord OAuth credentials for prod.** A redirect URI + `DISCORD_OAUTH_CLIENT_ID`/`DISCORD_OAUTH_CLIENT_SECRET` for whichever Discord application will serve the portal in prod, set in the VM's `.env` alongside `PORTAL_PUBLIC_URL`/`PORTAL_PORT`. Every session on this branch has only ever tested against the `Dioreo (Dev)` application's own client secret and an `http://localhost` redirect URI (`docs/ROADMAP.md`'s plan-3 note) — this step has never been done for prod.
- [ ] **Install the two systemd units for the first time.** `dioreo-portal.service` and `cloudflared.service` exist as files in this repo (`scripts/dioreo-portal.service`, `scripts/cloudflared-config.yml`) but have never been installed on the VM. Before installing, re-measure VM headroom (`free -m`) against the ~250MB-available threshold noted in the portal design spec §7/§12 — the VM is an `e2-micro` already running the bot as a second resident process.
- [ ] **Verify the Cloudflare Tunnel actually routes `portal.dioreo.app`.** `cloudflared-config.yml` points the hostname at `http://127.0.0.1:${PORTAL_PORT}`; confirm DNS + the tunnel credentials file are in place and the route resolves.

Full command-level detail for each step (exact systemd commands, `journalctl` checks, how to take either unit down without touching the bot) lives in `docs/reference/deployment-and-ops.md`'s "Web admin portal" section — this file tracks *whether* each step is done, that file explains *how* to do it.

## When to update this file

Check off a line the moment that step is actually done on the real VM, not when the code/config for it merges. If a step turns out to already be done (e.g. Harkirat sets up prod OAuth independently), update it here directly rather than leaving this file to rot — this is a reference doc, not a dated snapshot.

## Full audit trail

Everything that produced the portal, in order, so a future session can reconstruct the whole history without re-deriving it. All of `feat/portal-operation-core`; not yet merged as of this writing.

**Design (tracked):**
- `docs/superpowers/specs/2026-08-20-web-admin-portal-design.md` — the original spec: the operation-core algebra, the five realms, the tier-1/2/3 changeset model, OAuth, and the reasoning behind all of it. Six premises measured live, 34 defects found and fixed across three falsification passes before any code.
- `docs/superpowers/specs/2026-08-21-portal-compose-ui-design.md` — the follow-up spec for the compose UI specifically (add/edit forms, drag handles, bulk actions): resolves the tier-1-vs-Board ambiguity the parent spec left open, scopes the Components V2 preview renderer, and defines Manifest's two generic hooks.
- `docs/superpowers/mockups/2026-08-20-portal/` (tracked) — the six approved visual mockups everything above was built against; a convenience copy also sits at `local/portal-mockups/` (gitignored).

**Implementation plans (tracked):**
- `docs/superpowers/plans/2026-08-20-portal-core-operation-algebra.md` — plan 1: the shared operation core, proven on draws. Complete 2026-08-21 00:09 EDT.
- `docs/superpowers/plans/2026-08-20-portal-core-remaining-entities.md` — plan 2: the other five entities (calendar/loadouts/patchnotes/season/announcements) wired onto the same core; the old in-memory undo store retired. Complete, merged into this branch as PR #168's first range.
- `docs/superpowers/plans/2026-08-20-portal-server-and-realms.md` — plan 3: the HTTP server, OAuth, and the five browsable realms (Season/Armory/Broadcast/Access/Analytics). Complete.
- `docs/superpowers/plans/2026-08-21-portal-compose-ui.md` — the 7-task compose-UI plan (Add/edit forms, Track's drag handles, bulk actions) that turned the read-only realms from plan 3 into something that can actually stage and commit a change. All 7 tasks complete as of this file's writing.

**Session handoffs and reports (gitignored, `local/handoff/` — not reachable by `git log` or any in-repo search; listed here so their existence and rough scope survive even though the files themselves don't ship):**
- `2026-08-20-portal-build-start.md` — the kickoff note for plan 1.
- `2026-08-21-portal-session-A.md`, `2026-08-21-portal-session-B.md` / `-B-rebuilt.md` (the rebuilt copy exists because the original was briefly overwritten by a shell `mv` and had to be reconstructed live — see `docs/archive/resolved-list.md`) — plan 1/2 build sessions.
- `2026-08-21-portal-plan2-handoff.md`, `2026-08-21-portal-plan2-part2-handoff.md` — plan 2's own handoffs, closing out the remaining-entities work.
- `2026-08-21-portal-plan3-session-C.md` — plan 3's build session: server/auth/API/build/all five realm UIs, plus a code review. Left the compose UI itself as an explicitly deferred, written-up gap rather than a rushed partial version.
- `2026-08-21-portal-compose-ui-session-D.md` — this session's own handoff, written mid-way through the compose-UI build (Tasks 1-3 done, 4-7 still open at the time); superseded by the fact that Tasks 4-7 were then completed in the same session before it ended.

**Memory:** `project_web_admin_portal` (in the canonical memory store) carries the state the plan/spec files can't — mockup file paths, the SHAPE=state/COLOUR=topic convention, and what each build session actually shipped vs. what it claimed.

**Roadmap + tracking:** `docs/ROADMAP.md`'s web-admin-portal bullet (the plan links and status) and `docs/db-deferred-list.md`'s 🔔 Reminders entry both point back to this file rather than duplicating its content.
