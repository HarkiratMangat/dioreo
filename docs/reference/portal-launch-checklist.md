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
