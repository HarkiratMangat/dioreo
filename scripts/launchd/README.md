---
kind: reference
status: live
---

# The dev portal's launchd agents — this Mac's answer to the VM's systemd units

*Written 2026-09-05 11:21 EDT. The prod portal runs on the GCP VM under systemd as `dioreo-portal` + `cloudflared`; `docs/reference/deployment-and-ops.md` documents those. **These two agents are the same arrangement on Harkirat's Mac**, for `dev-portal.dioreo.app`.*

🔴 **THE COPIES HERE ARE THE TRACKED ONES; the live copies are in `~/Library/LaunchAgents/`, with `$HOME` expanded.** They are tracked for the same reason `scripts/cloudflared-dev-config.yml` is: a machine-local file that nothing in the repo records is a machine-local file that cannot be rebuilt. Edit here, then install.

| Agent | Runs | Why it is its own unit |
|---|---|---|
| `app.dioreo.dev-portal` | `node --env-file=.env.dev portal/server.js` in the repo, on `127.0.0.1:8787` | A portal crash must not take down the tunnel |
| `app.dioreo.dev-tunnel` | `cloudflared --config ~/.cloudflared/dioreo-dev.yml tunnel run` | The tunnel dying must take down only REACHABILITY, never the server. **Prod separates them for exactly this reason** and the split is deliberate here too |

⚠️ **NEITHER RUNS THE DEV BOT.** The bot is a separate process (`node --watch --env-file=.env.dev index.js`) and is deliberately not a standing agent: it signs into Discord as a live application, and an unattended 24/7 login is a different decision from serving a local port. The portal does not need it — **they meet at the database, not at the process.** Both read `mongodb://localhost:27017/diors-builds-dev`, so a portal edit is visible to the bot the moment the bot next reads, running or not.

## Install

```bash
mkdir -p ~/Library/Logs/dioreo   # launchd does NOT create it, and an agent whose log path is missing starts and writes nothing
cp scripts/launchd/*.plist ~/Library/LaunchAgents/
sed -i "" "s|\$HOME|$HOME|g" ~/Library/LaunchAgents/app.dioreo.dev-*.plist
launchctl bootstrap "gui/$(id -u)" ~/Library/LaunchAgents/app.dioreo.dev-portal.plist
launchctl bootstrap "gui/$(id -u)" ~/Library/LaunchAgents/app.dioreo.dev-tunnel.plist
```

## Operate

```bash
launchctl print "gui/$(id -u)/app.dioreo.dev-portal" | grep -E "state|pid|last exit"
launchctl kickstart -k "gui/$(id -u)/app.dioreo.dev-portal"   # restart after a code change
launchctl bootout "gui/$(id -u)/app.dioreo.dev-tunnel"        # take the hostname offline, server untouched
tail -f ~/Library/Logs/dioreo/dev-portal.log
```

⚠️ **`RunAtLoad` + `KeepAlive` means the tunnel is up whenever the Mac is**, so `dev-portal.dioreo.app` is publicly resolvable and reachable while it runs. It is outbound-only — no inbound firewall rule, no port forwarding, the Mac's IP never referenced — and the door is Discord OAuth against the DEV app with `isOwnerId()` hardcoded to Harkirat's id. `bootout` the tunnel agent to take it offline without stopping the server.

🔴 **THE DISCORD REDIRECT URI IS THE ONE THING HERE THAT IS UNVERIFIED, AND IT IS THE LIKELIEST FAILURE.** `docs/db-deferred-list.md` records Harkirat registering `https://dev.portal.dioreo.app/auth/callback` on the `Dioreo (Dev)` application on 2026-08-28 — **the DOT form**. The hostname changed to `dev-portal` afterwards, because Universal SSL covers one label and not two, and **that entry was never updated**. So the URI this portal actually sends may not be registered. ⚠️ **It cannot be probed from a terminal**: measured 2026-09-05 14:46 EDT, an obviously unregistered `redirect_uri` returns the SAME 302 to Discord's login as the real one, so a curl check here cannot fail and proves nothing. **The only test is a sign-in.** If it errors with *Invalid OAuth2 redirect_uri*, add `https://dev-portal.dioreo.app/auth/callback` to the dev application's redirect list and retry.

⚠️ **`.env.dev` IS READ ONCE, AT START.** `KeepAlive` restarts the process on a crash, never on a file change, so rotating a dev secret leaves the running portal on the old value with nothing to indicate it. Same remedy as the line below.

⚠️ **The portal does NOT hot-reload.** `--watch` is the dev BOT's flag; this agent runs plain `node`, so a change under `portal/` needs `launchctl kickstart -k`. That is deliberate — a watcher restarting mid-request is worse than an explicit restart — but it is the thing most likely to make a change look like it did not land.
