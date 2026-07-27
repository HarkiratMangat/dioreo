# Deployment, Ops & Stack — reference

*Read on demand (ops/deploy sessions, or when touching deploy scripts). Moved from CLAUDE.md's Stack /
Deployment & Ops (GCP) / Version-tagging sections on 2026-07-22 13:27 EDT. Root CLAUDE.md keeps a
2-line deploy summary + a stack pointer. Quick command card: memory `reference_vm_bot_commands`.*

## Stack
- discord.js v14 (`^14.26.4`), Node.js v26, run locally on a Mac (`node index.js`)
- MongoDB Atlas via Mongoose
- `chrono-node` for natural-language date parsing (admin input)
- `dayjs` (+ utc/timezone plugins) for user-facing timestamp conversion
- `jimp` for accent-color extraction (pure JS, no native binary — see `.claude/rules/accent-and-colors.md`)
- `ffmpeg` (system binary, not an npm package — must be on `PATH`) — `utils/stillFrame.js` uses it
  to pull one still frame from APNG/animated sources Jimp can't decode (avatar decorations), for the
  View Colors panel and `'dynamicProfile'` accent style. Confirmed present on this Mac already; not
  guaranteed on every host — if it's ever missing, still-frame extraction (and only that — every
  other image path in the bot is unaffected) fails loudly rather than silently producing garbage.
- `color-namer` (added 2026-07-13) — pure JS, only depends on `chroma-js`; used by the View Colors
  panel to turn an extracted hex into a real name ("Royal Blue") via its `'ntc'` palette. Checked via
  `npm audit` before adding — zero NEW vulnerabilities (only the pre-existing discord.js/undici/xlsx
  ones already tracked in memory as deferred).
- `cloudinary` (added 2026-07-12) — draw thumbnail caching (`utils/cloudinaryCache.js`); auto-reads
  the existing `CLOUDINARY_URL` env var on require, no explicit config call needed. Also backs patch
  notes' own season-based image cache (`utils/patchNotesCache.js`, shipped 2026-07-13) on the same
  account, separate folder/retention rules — see the Patch Notes Cloudinary caching note further
  down rather than duplicating the design here.
- `xlsx` — NOT used at bot runtime anymore (see `.claude/rules/loadouts.md`); only referenced by
  `scripts/migrateBuildsToMongo.js`, a one-time/re-runnable migration tool, not something the
  bot itself ever calls.
- **CI (added 2026-07-25)** — `.github/workflows/ci.yml`, deliberately minimal since there's no test
  framework or lint config in this repo yet: `npm ci` + `npm run check` (runs `node --check` across
  every JS file, the same manual check that was already done before every commit) + a non-blocking
  `npm audit --audit-level=high`. Runs on pushes to `main` and on any PR targeting `main`. Only
  triggers for PRs whose head branch already contains this workflow file, so the 3 PRs open before
  this shipped (#2, #9, #10) won't get CI until they merge `main` in or get rebased onto it.
- **🟢 DEPLOYMENT: the bot runs on a GCP Compute Engine VM (cutover 2026-07-17). Render is RETIRED.**
  Full setup, deploy flow, and monitoring/alerting live in the **"## Deployment & Ops (GCP)"** section
  below — that's the authoritative reference. **⚠️ The GitHub repo went PRIVATE 2026-07-18** — the VM
  pulls via a dedicated read-only SSH deploy key now, not anonymous HTTPS (see that section for the full
  setup; only matters if `git pull` on the VM ever fails with an auth error). In short: VM
  `diors-builds-bot` (e2-micro, `us-east1-b`,
  project `gen-lang-client-0549308254`) runs the bot under **systemd** (unit `diors-bot`, auto-restart on
  crash + reboot). **Deploy is git-based, and separate from merge (Branch → Commit → Push → PR → Merge →
  Deploy workflow, adopted 2026-07-24 12:24 EDT):** a merge lands code on `main`; deploy is the deliberate
  next step that makes the VM run it — `./scripts/deploy.sh` (or the raw `cd ~/diors-builds && git pull &&
  sudo systemctl restart diors-bot`) → verify `scripts/vmstatus.sh`. A merge can sit undeployed
  indefinitely. Render's free tier was
  proven unable to hold the Discord gateway (10-14 min connects → zombie sockets; identical code connects
  in seconds on the VM) — see memory [[project_deployment_migration_render_to_gcp]] + DEVLOG's 2026-07-17
  entry. **Render service `srv-d850b2og4nts73fhpfog` is SUSPENDED — do NOT deploy to it or treat it as
  live; delete ~2026-07-24 once GCP proves reliable.**
- *(HISTORICAL — Render, retired 2026-07-17, kept for reference until the service is deleted.)* Was
  git-connected auto-deploy off `main` (turned off 2026-07-16 after the Gateway hang, then the host
  abandoned 2026-07-17). Suspend/resume via REST (`POST /v1/services/{id}/suspend|resume`, `RENDER_API_KEY`
  in `.env`). — **Railway is NOT connected to a git source at all**
  (confirmed 2026-07-12 via `railway status --json`: the `diors-builds` service's `source` is
  `{ image: null, repo: null }` — it's deployed purely from local CLI snapshot uploads, there's no
  auto-deploy toggle to flip because there's nothing to auto-deploy from). Harkirat was explicitly
  asked whether to connect it to the GitHub repo (`connect_service_source` MCP tool can do this) and
  said no, leave it CLI-only — don't connect it without asking again first, this was a deliberate
  choice, not an oversight. Railway needs an explicit `railway up --detach` from this repo's root
  after every push meant to reach it — don't assume a `git push` alone puts new code on Railway;
  verify via `railway logs --deployment` (checks the boot-banner timestamp) or `railway status`
  before trusting it's live.
- **Railway's free tier blocks CLI deploys (`railway up`) during peak hours, 8 AM–8 PM
  America/New_York** (confirmed live 2026-07-12: `railway up --detach` returned "Free-tier deploys
  to us-east4-eqdc4a are not available during peak hours... upgrade your plan" instead of deploying)
  — if a deploy is needed during that window, it has to wait until after 8 PM ET or the plan needs
  upgrading; there's no workaround on the current tier. Keep the local instance running as the
  fallback until an off-peak deploy actually goes through and is verified live.
- **Render suspend/resume: the `render` CLI (v2.21.0) has no `suspend` subcommand at all** —
  confirmed via `--help` on every relevant command (`render services`, `render services update`,
  etc.) and the `render-cli` skill's own docs; don't waste time guessing at CLI flag names for this,
  it isn't there. The only way to suspend/resume is Render's REST API directly:
  `POST https://api.render.com/v1/services/{serviceId}/suspend` (and `.../resume`), auth'd with
  `Authorization: Bearer $RENDER_API_KEY`. **`RENDER_API_KEY` already lives in this project's own
  `.env`** (same file `BOT_TOKEN`/`CLOUDINARY_URL` live in) — `grep "^RENDER_API_KEY=" .env` is all
  that's needed to get it for a `curl` call; don't go looking anywhere else for it. Specifically:
  reading `~/.render/cli.yaml` (the CLI's own personal cross-project OAuth session file, which lives
  *outside* this project directory entirely) to extract a token for this same purpose was correctly
  blocked by the safety classifier as credential exploration — a project's own `.env` is a normal,
  already-in-scope file for working in this repo; a personal `~/.` config file outside the project is
  a meaningfully different, more sensitive thing to go digging through, even for the same end goal.
  `diors-builds`' service ID is `srv-d850b2og4nts73fhpfog` (Ohio region, `dashboard.render.com/web/
  srv-d850b2og4nts73fhpfog`) — confirmed via `render services --output json`.


## Deployment & Ops (GCP) — added 2026-07-17 (authoritative deployment reference)
The bot runs on a **GCP Compute Engine VM**, migrated off Render's free tier on 2026-07-17 after Render
was proven unable to hold the Discord gateway (10-14 min connects → silent zombie sockets; identical code
connects in seconds on the VM). Full story: [[project_deployment_migration_render_to_gcp]] + DEVLOG's
2026-07-17 entry. Quick command card: [[reference_vm_bot_commands]].

- **The VM:** `diors-builds-bot` · **e2-micro** (2 shared/burst vCPU, 1 GB RAM — ample; bot uses ~112 MB
  / ~1% CPU) · zone `us-east1-b` · Debian 12 · 30 GB pd-standard · project `gen-lang-client-0549308254`
  · billing account `01FB53-3A80FB-BC32B1` (holds the $300 + $10/mo credits) · **$0 always-free tier**.
  External IP `34.24.101.143` (changed from `34.24.175.5` on 2026-07-20 when the VM was stopped/
  restarted to add the `cloud-platform` scope for the Vertex AI migration below — see "Loadout
  automation" further down) — can change on stop/start, don't hardcode it.
- **How the bot runs:** under **systemd**, unit **`diors-bot`** (`/etc/systemd/system/diors-bot.service`),
  user `harkirat`, WorkingDirectory `~/diors-builds`, `ExecStart=/usr/bin/node index.js`, `Restart=always`
  → auto-restarts on crash AND on VM reboot. Logs → journald (`sudo journalctl -u diors-bot`). Installed
  on the VM: Node 24, npm, git, **ffmpeg** (system binary for `utils/stillFrame.js`). Secrets live in
  `~/diors-builds/.env` (scp'd from the Mac; includes `LOG_WEBHOOK_URL`).
- **Deploy = git-based, a separate step AFTER merge** (re-scoped 2026-07-24 12:24 EDT — code reaches
  `main` via a squash-merge now, not a direct push): on the VM run **`./scripts/deploy.sh`**
  (added 2026-07-20; does `git pull` → writes the `.restart-reason` marker → `sudo systemctl restart
  diors-bot` → `vmstatus.sh`) → verify. `./scripts/deploy.sh manual` restarts WITHOUT pulling (e.g. after
  an `.env` change). The old raw `cd ~/diors-builds && git pull && sudo systemctl restart diors-bot` still
  works, but skipping deploy.sh means the "Bot online" alert can't label the restart as a deliberate deploy
  (it'll correctly show as "automatic/unattended" — see the alert restart-labeling note below). **A merge
  alone does NOT update the VM** — deploy is asked separately every time, and a merged version can sit
  undeployed indefinitely. No auto-deploy-on-merge (considered and deferred — see `docs/ROADMAP.md`'s
  "Process / tooling" section). See [[feedback_push_means_full_cycle]], [[project_git_workflow]].
- **Repo went PRIVATE 2026-07-18** (was public; Harkirat's call, unrelated to any security incident) —
  this broke the VM's `git pull`, which had been pulling anonymously over a plain `https://github.com/...`
  remote (worked fine on a public repo, silently requires auth the moment it isn't). Fixed with a
  **dedicated read-only SSH deploy key**, not by reusing Harkirat's personal GitHub token (extracting his
  `gh auth token` was correctly blocked by the safety classifier — same class of "personal credential
  extraction" as the earlier `~/.render/cli.yaml` block — a purpose-built deploy key is the right call
  anyway, least-privilege). Setup: generated an ed25519 keypair ON the VM (`~/.ssh/diors_deploy_key`, no
  passphrase) → registered its public half as a **read-only** GitHub deploy key via `gh repo deploy-key
  add` (listed on GitHub as "diors-builds-bot VM (read-only, auto-deploy pull)") → added a `Host
  github.com` block to the VM's `~/.ssh/config` pinning `IdentityFile ~/.ssh/diors_deploy_key` +
  `IdentitiesOnly yes` → switched the VM's remote from `https://github.com/HarkiratMangat/diors-builds.git`
  to `git@github.com:HarkiratMangat/diors-builds.git`. **The deploy steps above are otherwise unchanged**
  (`git pull` on the VM now authenticates via this key transparently) — this only matters if `git pull`
  on the VM ever fails with an auth error again: check this key/config before assuming something else broke.
  Rotate/revoke via the repo's GitHub Settings → Deploy keys.
- **Monitoring ("never blind again"):**
  - `scripts/vmstatus.sh` — one-shot health: VM state, systemd status, restart count, gateway state, 1h
    error count, RAM/load/disk. `scripts/vmstatus.sh logs [N]` tails N log lines.
  - `scripts/vmpeaks.sh` — historical **CPU peaks** (12h/24h/72h/7d/30d) via Cloud Monitoring (CPU is
    hypervisor-level, no agent needed). On e2-micro, >100% = bursting above the 0.25-vCPU baseline
    (normal). **RAM peaks** were added 2026-07-17 (`rampeak()`, `agent.googleapis.com/memory/percent_used`
    state=`used`) — those DO need the Ops Agent (guest memory is invisible to GCP without it), so the RAM
    rows read "(no data … yet)" until enough post-install history accrues (that's expected, not a bug).
  - **Discord alerting** (`utils/alertWebhook.js`) — posts crashes / gateway disconnect+reconnect+error /
    DB failure / uncaught rejection, plus a "Bot online" ping on each (re)start, to a private Discord
    channel via `LOG_WEBHOOK_URL` (SECRET — `.env` only, never the repo). Throttled 1/min, never throws,
    never blocks. Wired into index.js's process/client/shard handlers at 8 sites. **Plus a daily
    "still healthy" heartbeat** (added 2026-07-17) — an info-level, NON-pinging alert every 24h with
    uptime/servers/gateway-latency/memory, so a long quiet uptime is proven-alive instead of ambiguous
    (with only trouble+startup alerts, "healthy" and "the VM/alerter is dead" look identical). Fired from
    a `setInterval(24h).unref()` on `ClientReady`, skipped if the gateway isn't currently ready; NOT fired
    on boot ("Bot online" already covers startup, and a restart resets the timer but emits its own boot
    ping, so no health gap is left uncovered).
    - **Severity is 4 levels** (reshaped 2026-07-17): `info`🟢 (Bot online / Gateway resumed / heartbeat),
      `caution`🟡 (Reconnecting to Discord — transient websocket blip, self-recovering; reworded from
      "Gateway reconnecting" 2026-07-20 so it can't read as "restarting"), `warn`🟠 (Gateway disconnected —
      lost), `error`🔴 (crash / uncaught / DB failure / shard error). **Pings fire on `warn` + `error`
      only** (`shouldPing = opts.ping ?? (level==='error' || level==='warn')`); yellow/green never ping.
      **⚠️ The reconnect→resume PAIR ('Reconnecting to Discord' + 'Gateway resumed') is now `silent`
      (2026-07-20, v2.27.0 — Harkirat's call): still LOGGED to the alert store, but NOT posted to Discord.**
      They fire every 1-3h as routine, self-recovering gateway churn (Discord cycling sessions / tiny
      network blips — sub-second, resumed with full event replay = zero data loss), so they're pure channel
      noise. Suppressing them from Discord is safe because the genuinely-bad case — a reconnect that FAILS
      to resume — still surfaces loudly via the separate `warn`🟠 'Gateway disconnected' handler (which
      pings). Verified live 2026-07-20 that these WERE firing every 1-3h with clean sub-second resumes (VM
      journal). `sendAlert(..., { silent: true })` is the general mechanism (see next bullet).
      Every alert body carries a proper Discord `<t:unix:F> · <t:unix:R>` timestamp (in the DESCRIPTION —
      Discord doesn't parse `<t:>` in an embed footer). The "Bot online" gateway ping shows "measuring…"
      when `client.ws.ping` is still -1 (it's -1 until the first gateway heartbeat, which lands after
      ClientReady) instead of the old nonsensical "-1ms" — see `formatPing()`.
    - **SHIPPED 2026-07-20 (v2.26.0) — persistent alert log + `/alerts`.** Every alert `sendAlert` posts is
      now persisted to Mongo (`models/AlertLog.js`) with a short human-referenceable id — `MMMDD-NN` on the
      **UTC** day, e.g. `Jul20-03` ("the 3rd alert on Jul 20") — generated race-free via an atomic per-day
      counter (`models/AlertCounter.js`, `findOneAndUpdate($inc)`; a `count()+1` would collide a same-second
      crash burst on the unique `alertId`). `utils/alertStore.js` owns the store + read helpers, keeping
      `alertWebhook.js` lean. **The store write is an INDEPENDENT fire-and-forget from the webhook POST**
      (neither awaits the other) — a Mongo outage can't block a Discord alert (a DB failure is itself an
      alert) and vice versa; `sendAlert` stays sync / never-throws / never-blocks and just mirrors what was
      actually sent (post-throttle). Because of that decoupling the id is deliberately NOT on the live embed
      (that would couple it to a Mongo round-trip); it lives in `/alerts` + the export. Retention is hybrid:
      older than **30 days** OR beyond a **1000** hard cap, pruned ≤1/hour. **The store is a SUPERSET of the
      channel, not a mirror (changed 2026-07-20, v2.27.0):** `sendAlert(title, detail, level, { silent:true })`
      logs to the store but SKIPS the Discord POST — used for the routine reconnect/resume pair above; those
      docs carry `silent:true` (new `AlertLog.silent` field) so a future `/status` can pull exactly the
      reconnect history without ever cluttering the channel. A silent alert never pings (there's no message).
      **⚠️ Two downstream decisions deferred to when `/status` is built:** (1) `/alerts`' recent-list + export
      currently include silent docs, which will visually dominate given their frequency — likely wants a
      filter/section split so real alerts stay legible; (2) high-frequency silent docs eat the shared 1000
      cap, so a real crash could get pruned sooner — may want silent docs on their own retention. Neither is
      addressed yet (Harkirat's framing: log them now, sort out the /status presentation later). The admin-only **`/alerts`** command (`commands/alerts.js`,
      auto-gated by adding `alerts_` to index.js's centralized panel-guard prefix list) is a V2 panel:
      severity summary (24h/7d counts + last error id/time), a paginated newest-first recent list (each
      with its id), an **Export Log** button (a `.txt` fuller than the embed, via `buildAlertExport()`), and
      a **"What alerts mean?"** explainer subpage. **Deployed to the VM 2026-07-21 (v2.26.0); the store is
      verified LIVE in production** — the boot's own "Bot online" alert wrote the first real doc (`Jul21-01`,
      UTC rollover confirmed working). Verified offline too (id atomicity, `formatUptime` tiers, panel build
      ≤40 components, roundtrip). **Still NOT click-tested:** the interactive `/alerts` panel itself
      (Export Log / explainer / pagination) in Discord — needs a real admin click-through.
    - **Escalating uptime format (2026-07-20)** — `utils/alertStore.js`'s `formatUptime()`, in every alert
      footer (was raw `up 730m`): always the top TWO units — `42Min` → `3H 42Min` → `2D 22H` → `1W 3D` →
      `1M 3W` → `1Y 2M`. Minutes render as `Min` so a bare `M` is unambiguously months (Harkirat's tier-1
      example wrote `M` for minutes but his own unit legend says `M`=months, so `Min` won). Fixed unit
      sizes: week 7d, month 30d, year 365d.
    - **Manual-vs-automatic restart labeling (2026-07-20).** The bot can't natively know WHY systemd started
      it, so `scripts/deploy.sh` (the VM-side deploy — see the Deploy bullet above) writes a gitignored
      `.restart-reason` marker right before restarting; index.js's `readRestartReason()` reads + CONSUMES it
      on `ClientReady` (only if fresh, <10 min, so a stale marker can't mislabel a later crash-restart). The
      "Bot online" alert now reads **🚀 Manual deploy** / **🔧 Manual restart** / **♻️ Automatic/unattended
      restart** (with `systemd NRestarts` as raw context on the automatic path — its reset semantics are
      fuzzy, so not over-interpreted). No marker => automatic (a crash-recovery, OR a bare `systemctl
      restart` that skipped deploy.sh). A manual `systemctl stop` can't self-alert (process is down) — an
      accepted gap; the marker distinguishes the meaningful case (deliberate restart vs crash-recovery).
- **Render (retired):** service `srv-d850b2og4nts73fhpfog` **SUSPENDED** (not deleted). Keep as fallback
  until ~2026-07-24, then delete once GCP proves reliable. Do NOT deploy to it.
- **Ops Agent — INSTALLED 2026-07-17** (was deferred; the earlier install-script 404 was transient — the
  official `add-google-cloud-ops-agent-repo.sh --also-install` worked fine on retry). google-cloud-ops-agent
  v2.70.0, all 3 units active (wrapper + fluent-bit for logs + otel-collector for metrics); adds guest
  RAM/disk metrics + log forwarding, and unlocks `vmpeaks.sh`'s RAM peaks. **⚠️ GOTCHA (cost me the RAM
  data at first):** the agent silently drops every metric/log with `PermissionDenied SERVICE_DISABLED`
  until the project's **Cloud Monitoring API AND Cloud Logging API are enabled** — both were OFF on this
  project (only the hypervisor CPU read path worked without them, which is why CPU peaks were fine but RAM
  stayed empty). Fixed with `gcloud services enable monitoring.googleapis.com logging.googleapis.com`
  (both free-tier at one-e2-micro scale) + an agent restart; export errors went to zero. If RAM peaks ever
  go blank again, check those two APIs are still enabled and the otel-collector isn't erroring
  (`journalctl -u google-cloud-ops-agent-opentelemetry-collector | grep -i denied`) before suspecting the
  query. **Still deferred:** guest disk-usage peaks in `vmpeaks.sh` (the agent now provides the metric).

## Local dev bot — `Dio (Dev)` (built 2026-07-26 13:45 EDT, first-ever local instance)
*Authoritative setup reference. The one-paragraph invariant version lives in the root `CLAUDE.md`.*

Before 2026-07-26 13:45 EDT there was **no way to try a change before it hit prod** — every visual/behavioural
check meant merging, deploying to the VM, and eyeballing the live bot Harkirat's own users were using.
`Dio (Dev)` closes that: a **second, fully separate Discord application** that runs the same codebase
against isolated local data, so any branch or PR can be exercised live in Discord first.

**Run it:**
```bash
node --watch --env-file=.env.dev index.js
```
- `--watch` is Node's built-in file watcher: on any change in the module graph it does a **full process
  restart** (new PID, new gateway + Mongo connection, `index.js` re-run top to bottom). It is **not**
  hot-reload — Node's module cache is immutable once loaded, so a restart is the only correct answer.
  Switching branches restarts it too, which is what makes "test any PR" a one-command operation.
  Node explicitly documents `--watch` as **not for production**; this is a local-dev tool only. It does
  NOT satisfy the roadmap's partial-hot-reload item (`docs/ROADMAP.md`), which is about avoiding a VM
  redeploy — a different problem.
- **Caveat:** every restart re-registers all 20 global slash commands, which Discord rate-limits. Rapid
  saves can surface registration errors in the log; harmless (they're already registered).

**What's separate from prod, and what's shared:**
| Thing | Dev | Note |
|---|---|---|
| Discord application | `Dio (Dev)` `1529636846248919263` | separate app + token; user-install only (`[1]`), same as prod |
| Database | `mongodb://localhost:27017/diors-builds-dev` | local `mongod` via `brew services` (`mongodb/brew` tap, a **trusted** third-party tap). Seeded by `mongodump` (read-only on prod) → `mongorestore --nsFrom='test.*' --nsTo='diors-builds-dev.*'` |
| Alert webhook | its own `LOG_WEBHOOK_URL`, own channel | must NOT be prod's — see the dotenv trap below |
| Emojis | its own 72 application-emoji copies | same names, different ids — see below |
| Cloudinary / Vertex AI (`GCP_*`) | **shared with prod** | deliberate. Vertex needs no new credentials: it uses the local `gcloud` ADC already on Harkirat's Mac |

**⚠️ The dotenv backfill trap (cost a real leak on the first boot).** `index.js:38` calls
`dotenv.config()` **after** `--env-file` has loaded. dotenv does not override already-set vars, but it
**does backfill any var the env-file didn't set** — so *omitting* a key from `.env.dev` silently inherits
prod's value rather than unsetting it. `LOG_WEBHOOK_URL` was left out on the assumption that meant "off",
and the dev bot inherited the real prod alert webhook. **Fix: set it explicitly blank**, not absent
(`utils/alertWebhook.js`'s `if (!url) return` makes empty a clean no-op). Sanity check: the boot line
`injected env (N) from .env` — N is how many prod vars leaked in; it should only ever be genuinely-dead keys.

**⚠️ Application emojis are per-application.** An application emoji renders ONLY for the app that owns it,
so the dev bot cannot use prod's ids. All 72 were cloned to the dev app under identical names (3 animated
ones — `Database`, `BulkDelete`, `Edit` — needed re-encoding at 96px to fit Discord's 256 KB cap). The
code side is `utils/emojiMap.js`'s **`refreshEmojiIds(client)`**, called from `handleBotReady`: it matches
on emoji NAME and re-points every mention string at the booting app's own ids. Verified a true no-op on
prod (0 rewrites, 0 unmatched) and a full re-point on dev (39/39). Fail-soft — any error keeps the
hardcoded prod ids. An optional gitignored `utils/emojiMap.dev.json` overlay (applied only when
`NODE_ENV=development`, after the name sync) lets a dev session point individual keys at throwaway test
emojis that don't exist on prod.

**⚠️ Never run a local instance on the PROD token.** Prod is single-token: two gateway connections on the
same token make Discord route each interaction to one of them at random (see the
`feedback_multiple_bot_instances` memory). Two instances on **different** tokens — which is exactly what
prod-on-VM plus dev-on-Mac is — is safe and is the entire point. The old blanket "stop any local run
before deploying" rule only ever applied to same-token runs.

**Killing the dev process does NOT remove its commands from the `/` picker — use
`scripts/devCommands.js` (added 2026-07-26 21:47 EDT).** Slash-command registration is stored on
Discord's side against the **application**, not the process: `index.js` writes it once per boot with
`rest.put(Routes.applicationCommands(client.user.id), …)` and Discord keeps it indefinitely. Because the
bot is user-installed, `Dio (Dev)`'s 20 commands therefore follow Harkirat into every server and DM,
duplicating prod's identical list, whether or not anything is running. Picking one just yields
"The application did not respond" after the 3s interaction timeout.

```bash
node scripts/devCommands.js list     # what the dev app currently has registered
node scripts/devCommands.js clear    # register an empty list -> gone from the picker
```

There is no "restore" mode on purpose — **the next dev-bot boot re-registers everything**, since that
PUT runs on every startup. Two independent safeguards keep this off prod: the script reads `.env.dev`
**directly off disk** rather than through `process.env` (a `dotenv`-based script could hold the prod
token via the backfill behavior described above), and it aborts if `.env.dev`'s `BOT_TOKEN` matches
`.env`'s. It also prints the resolved application name/id before acting — if that ever says
`Dior's Builds` instead of `Dio (Dev)`, stop. Verified 2026-07-26 21:47 EDT: cleared 20 commands from
`Dio (Dev)` (`1529636846248919263`) while prod (`Dior's Builds`, `1491474871778021550`) kept all 20.

**Secrets hygiene:** `.env.dev` is covered by `.gitignore`'s `.env.*` glob, by a `.git/info/exclude`
entry (so it stays ignored even on branches that predate that glob), and by the `block-env-staging`
hookify rule, whose pattern already matches `.env.dev`.

## Version tagging (added 2026-07-16; re-scoped to merge-time 2026-07-24 12:24 EDT)
The `vMAJOR.MODERATE.MINOR` convention itself is defined in `docs/SESSION-START.md` (tracked in git,
canonical source — don't duplicate the full rules here). **Under the Branch → Commit → Push → PR → Merge
→ Deploy workflow (adopted 2026-07-24 12:24 EDT), the version-earning unit is the MERGED PR, not the push** — a
squash-merge collapses a branch to one commit on `main`, and that squash commit is what gets tagged.
`docs/CHANGELOG.md`'s "Unreleased" section holds the proposed number for whatever's on the open branch/PR
awaiting merge. **Each merged PR's version gets an actual git tag** on the squash commit (e.g. `v2.18.1`),
complementing (not replacing) the CHANGELOG entry — the CHANGELOG's proposed number is the human-readable
plan, the tag is the permanent, unambiguous marker once it's real. This makes `git describe --tags` give
free, zero-maintenance visibility into exactly how many commits deep past the last merged version you are.
(Historically — pre-2026-07-24 — the tag landed on the last commit of a direct push to `main`; that model
is retired now that all work flows through a branch + squash-merge first.)

**Backfilled tags: `v2.17.3` (`426a444`), `v2.18.0` (`5c403a7`), and `v2.18.1` (`1600b8e`)** — found
by cross-checking `CHANGELOG.md` directly against `git log`, not by guessing from commit messages
alone (an earlier pass here missed `v2.18.1` entirely — it bundles 3 commits, `f7b4575`/`c4b1c19`/
`1600b8e`, pushed together as one version per the existing "one push, one number" rule, and none of
the 3 commit messages themselves say "v2.18.1"). Confirmed via `git describe --tags` after tagging:
`v2.18.1-1-gcf6cad7` — exactly matches `git status`'s "ahead of origin by 1 commit," i.e. only the
current HEAD is genuinely unreleased. **FULL BACKFILL COMPLETED 2026-07-21 — every version now has a
tag: `v1.0.0` → `v2.30.2`, 58 tags, zero gaps.** The earlier "deliberately did NOT backfill further back
than v2.17.3" stance was based on a false premise (that pre-v2.17.3 versions had "no unambiguous 1:1
commit mapping" because of same-day multi-version bumps). In fact **almost every pre-v2.17.3 CHANGELOG
entry already cites its own commit hash in the description** — the mapping was sitting right there. The two
that didn't (`v2.6.0`, `v2.7.0`) were resolved from the git log: `v2.6.0` → `043a3bc` (the LAST commit of
its multi-commit bundle, per the tag-on-last-commit convention), `v2.7.0` → `23ce7fc`. The whole mapping
was verified **monotonic** (every tag's commit date ascends with its version) before pushing — so there's
no guessing and no wrong tag. `git describe --tags` now works cleanly against any commit in the repo's
history. The pre-2026-07-21 backfilled tags (`v2.17.3`/`v2.18.0`/`v2.18.1`) mentioned above are unchanged.

