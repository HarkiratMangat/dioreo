# `vmstatus.sh` overhaul — design

**Date:** 2026-07-28 15:34 EDT
**Ships as:** v2.41.0
**Source of the ask:** `docs/diors-builds notes.md` L120 (Harkirat, verbatim spec) + the merged L124 "richer/stylized standalone output, expand the error tracker" item. Filed as `[P2 · M]` in `docs/db-deferred-list.md`.

---

## 1. The problem, as actually diagnosed

The filed spec described five improvements. Investigating them changed two, and uncovered a defect bigger than any of them.

### 1.1 The error counter could never have been right

`vmstatus.sh` reported `errors(1h)` from `journalctl … | grep -ciE "error|10062|unhandled|disconnect|reconnecting"` — a substring match over raw log text. A past session had noticed it disagreeing with `journalctl -p err` and never explained why. Both readings were wrong, for different reasons:

- **The grep over-counts.** Measured live 2026-07-28 15:05 EDT: the script reported `errors(1h): 2`, and both matches were `🔌 Shard 0 reconnecting...` — routine gateway churn, 8× in 24h.
- **`-p err` can never be non-zero.** The bot wrote everything to stdout, so journald assigned every entry priority 6. Measured across 24h: **p0–p5 = 0, p6 = 30.** `journalctl -p err` would have read 0 during a total crash.

So there was no trustworthy error signal at all — only two ways of being wrong. Expanding the display around either counter would have made a wrong number more prominent.

### 1.2 Retention was a misunderstanding — there was nothing to bump

The spec asked to raise captured history from 1,000 to ~3,000 lines. Verified: **the 1,000 cap is the AlertLog Mongo store** (`utils/alertStore.js`'s `HARD_CAP`), unrelated to logs. `/etc/systemd/journald.conf` had **no retention configuration at all**, and the journal held every `diors-bot` line since install: **620 lines, 35.7 MB, back to 2026-07-17.** The bot emits ~56 lines/day. The `25` in the script was a *display* cap.

Nothing needed raising. What the 30-day assumption needed was to be made *real* rather than incidental, so journald is now explicitly pinned.

### 1.3 The Ops Agent was already installed and unused

The Cloud Logging option was carried in as "maybe worth considering." It turned out the **Google Cloud Ops Agent was already running on the VM** — `otelopscol` (77 MB) + `core_plugin` (27 MB) + `guest_telemetry` (23 MB), ~127 MB of a 969 MB box — shipping `/var/log/syslog` as an unparsed text blob with empty severity that nothing had ever queried. Cloud Logging API: already enabled.

That removed the "is it worth the cost" question, because the cost was already being paid. It also explains the long-standing "RAM: 536/969 MB seems high" concern: **the bot itself is ~121 MB RSS**; the agents account for most of the rest.

---

## 2. Design

### 2.1 Three-tier error accounting

Kept deliberately separate, because they answer different questions and disagreement between them is diagnostic information:

| Tier | Source | Answers |
|---|---|---|
| `errors` | Cloud Logging `severity >= ERROR` | did the code report a failure |
| `alerts` | `AlertLog` in Mongo via `getAlertSummary()` | did anything actually page Harkirat |
| `noise` | gateway reconnect/resume lines | is the churn normal (never added to the error total) |

The keyword pass is retained only as a backstop for output nobody wrapped (a hard crash, an OOM kill), and is never reported as a confirmed error.

### 2.2 Severity at the source — `utils/logger.js`

systemd's `SyslogLevelPrefix` (default `yes`, active on the `diors-bot` unit) reads a leading `<N>` on each line, strips it, and records that priority. **Verified live 2026-07-28 15:20 EDT** with a throwaway `systemd-run` unit: `<3>` → PRIORITY 3, `<4>` → PRIORITY 4, unprefixed → 6.

`patchConsole()` wraps `console.error`/`warn`/`log` to prepend the marker and tee a structured JSON copy.

**Why patch `console` rather than rewire ~60 call sites:** it cannot *miss* a site, including ones added later and ones inside `utils/`; and the alternative is a sprawling mechanical diff whose only content is an import change, which is far harder to review for a real regression than one 30-line module.

Multi-line output is prefixed **per line** — journald applies the prefix per line, so an Error stack would otherwise land with its first line at priority 3 and every frame at 6.

The module is inert locally: it gates on `JOURNAL_STREAM`, which systemd sets and a terminal does not. The dev bot is unaffected.

### 2.3 Structured sink → Cloud Logging

The bot appends newline-delimited JSON (`timestamp`, `severity`, `message`, `version`, `commit`) to `logs/app.log`. `scripts/ops-agent-config.yaml` tails it with `parse_json` + `modify_fields` to lift severity into the real `LogEntry.severity` field. `scripts/logrotate-diors-bot` rotates it (`copytruncate`, because the bot holds an open stream and does not reopen on SIGHUP — a plain rename would silently stop logs forever).

Carrying `version`/`commit` **inline on every entry** is what satisfies the "which commit was running" half of the ask without correlating against restart boundaries. The built-in `syslog` pipeline stays enabled as the fallback.

### 2.4 Commit/version stamping

`logBootBanner()` emits one line at startup (`🏷️ diors-builds v2.41.0 · 9a989f1 · node v24 · pid N`) before anything else can log, so even a startup that never reaches `ClientReady` is attributable. The journald fallback path uses this marker; the Cloud Logging path reads the inline fields.

**Forward-only.** Lines written before this ships cannot be retroactively stamped.

### 2.5 Time windows

`logs [<time>] [<lines>]`, exactly as specced. `m`/`h`/`d`; single (`2h`) or range (`20h-5d` = from 5 days ago up to 20 hours ago, **excluding** the last 20h); order-independent with the line count; no time arg → newest N over the 30-day window. When a window holds more lines than were shown, the total is printed with the exact re-run command.

Parsing happens **before** the panel renders. The panel costs an SSH round-trip plus Cloud Logging queries — **measured ~10s on 2026-07-28 18:05 EDT** — and validating afterwards meant a typo cost the whole probe before reporting itself.

### 2.6 Panel

Full instrument panel (Harkirat's pick): VM · SERVICE · DEPLOY · HEALTH · ERRORS · ALERTS · ACTIVITY, with bar gauges and colour thresholds.

Two honesty rules baked in, both of which are the same class of defect this overhaul exists to fix:
- **RAM is broken out** into bot / agents / available, so the raw total never again reads as alarming.
- **When the structured sink is not deployed, the zero counts are labelled `NOT LIVE — these zeros mean NO DATA, not no errors`.** A zero that means "no source" must never be displayed as reassurance.

`ACTIVITY` is labelled **log lines/hr**, not interactions/hr. The bot does not log per-interaction, so an interaction figure would have been invented.

---

## 3. Constraints discovered

- **`/bin/bash` on Harkirat's Mac is 3.2** (checked 2026-07-28 15:40 EDT; no homebrew bash). No associative arrays, no `${var^^}`, no `mapfile`. `bash -n` does **not** catch these — they fail only at runtime. The first draft used `declare -A` and passed the syntax check.
- **BSD vs GNU:** `date` flag differs (`-r` vs `-d @`); BSD `awk` has no `mktime()`. Time comparison is therefore done by **lexicographic compare on ISO-8601 UTC strings**, which is valid and needs no parsing.
- **`journalctl` rejects ISO `T`/`Z`** and matches nothing rather than erroring — this silently returned "0 lines" for windows full of logs. It needs `YYYY-MM-DD HH:MM:SS UTC`.
- **`ps -o comm` reports `MainThread` for node**, so a `-C node` lookup returns 0. Must match on `args`.
- **Query batching:** the first draft issued 19 sequential `gcloud logging read` calls for the counters alone (~30s for a "status at a glance"). Now 3 bulk fetches, bucketed locally.

---

## 4. Deferred, deliberately

- **Sentry** — flagged in the notes addendum as complementary to the Discord webhook (stack traces, breadcrumbs, repeat-error grouping). Not built. With structured Cloud Logging now in place, the gap Sentry filled is materially smaller; re-evaluate before adopting.
- **Firestore** — remains declined (2026-07-24 review). Only the Cloud Logging half was ever carved out, and it is now done.
