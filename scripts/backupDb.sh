#!/usr/bin/env bash
# Dioreo — manual MongoDB backup. Run from the Mac (needs mongodump from mongodb-database-tools).
#
# WHY THIS EXISTS: the Atlas cluster is on the FREE (M0) tier, which provides NO automated backups at all — confirmed by Harkirat 2026-08-16 10:57 EDT. Paid tiers get continuous/snapshot backups; M0 gets nothing, so the only copy of this data is the one you take yourself. That makes an unattended `mongodump` the whole disaster-recovery story, not a nice-to-have.
#
# Writes ONE gzipped archive per run (not a directory tree) because a single file is what `mongorestore --archive` consumes, and because pruning is then a plain file operation instead of a recursive delete — the safer thing to automate.
#
# ⚠️ NEVER prints MONGODB_URI. That string carries the Atlas credentials, and this script's output is exactly the kind of thing that gets pasted into a chat or a log. Same rule index.js follows when it logs `host/dbName` rather than the URI. ✅ PROVEN RESTORABLE, not merely written: this script's very FIRST archive was restored end to end
#      on 2026-08-16 11:00 EDT — the `test` -> `diors-builds` database rename WAS a restore of it, and
#      939 documents plus 15 indexes came back with matching byte counts. A backup that has never been
#      restored is a hope; this path has been exercised on real data at least once.
#
# ⚠️ WHAT GETS DUMPED CHANGED ON 2026-08-16. Before the rename MONGODB_URI carried no database path,
#      so mongodump dumped EVERY database (which is why `--nsFrom 'test.*'` had something to act on).
#      The URI now ends in `/diors-builds`, so this dumps THAT DATABASE ONLY. Correct going forward,
#      but it means an older archive contains two databases and a new one contains one — worth knowing
#      before you wonder which is broken. The retained `test` copy is no longer being backed up; it is
#      itself a copy, so that is deliberate.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${DIOREO_BACKUP_DIR:-$REPO_DIR/local/db-backups}"
KEEP="${DIOREO_BACKUP_KEEP:-14}"     # how many archives to retain
command -v mongodump >/dev/null 2>&1 || export PATH="/opt/homebrew/bin:$PATH"

if ! command -v mongodump >/dev/null 2>&1; then
  echo "❌ mongodump not found. Install with: brew install mongodb-database-tools" >&2
  exit 1
fi

# Prefer an already-exported URI (lets a caller pass a different cluster) and fall back to .env. Read with a plain grep rather than sourcing .env — sourcing would execute the file and export every other secret in it into this shell for no reason.
if [ -z "${MONGODB_URI:-}" ]; then
  ENV_FILE="${DIOREO_ENV_FILE:-$REPO_DIR/.env}"
  [ -r "$ENV_FILE" ] || { echo "❌ No MONGODB_URI in the environment and cannot read $ENV_FILE" >&2; exit 1; }
  # || true -- under set -e/pipefail, grep exiting 1 (key absent) killed the script HERE, before the explicit "MONGODB_URI is empty" guard on the next line could ever run (v3-pre-release review, finding #11).
  MONGODB_URI="$(grep -m1 '^MONGODB_URI=' "$ENV_FILE" | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//" || true)"
fi
[ -n "${MONGODB_URI:-}" ] || { echo "❌ MONGODB_URI is empty." >&2; exit 1; }

mkdir -p "$BACKUP_DIR"
STAMP="$(date -u '+%Y-%m-%dT%H-%M-%SZ')"
ARCHIVE="$BACKUP_DIR/dioreo-$STAMP.archive.gz"
# ⚠️ KNOWN EDGE, measured 2026-08-16 15:10 EDT: two runs inside the SAME SECOND produce the same
#      filename and the second silently overwrites the first. Left as-is deliberately — any realistic
#      schedule (hourly at most) cannot collide, and the consequence is one redundant backup of an
#      identical database state rather than data loss. Documented so it is a known edge and not a
#      surprise if someone ever loops this.

echo "🗄  Backing up to $(basename "$ARCHIVE") …"
# --archive + --gzip => one compressed file. Restore with:
#   mongorestore --uri="…" --archive=<file> --gzip [--nsFrom 'old.*' --nsTo 'new.*']
mongodump --uri="$MONGODB_URI" --archive="$ARCHIVE" --gzip --quiet

# VERIFY, don't assume. mongodump exits 0 on an empty/failed-auth dump in some cases, so an archive that exists proves nothing on its own — check it has real bytes. 1KB is far below any real dump of this database (currently ~776KB uncompressed) and far above an empty-archive header.
if [ ! -s "$ARCHIVE" ]; then
  echo "❌ Archive is empty — backup FAILED. Removing the stub so it cannot be mistaken for a good backup." >&2
  rm -f "$ARCHIVE"
  exit 1
fi
BYTES="$(wc -c < "$ARCHIVE" | tr -d ' ')"
if [ "$BYTES" -lt 1024 ]; then
  echo "❌ Archive is only ${BYTES}B — implausibly small, treating as a FAILED backup." >&2
  rm -f "$ARCHIVE"
  exit 1
fi

echo "✅ Backup OK — ${BYTES} bytes"

# Retention: keep the newest $KEEP archives.
#
# Uses a GLOB, not `ls` — and not merely to satisfy shellcheck SC2012. The timestamp is embedded in the filename in a lexically-sortable form (dioreo-2026-08-16T14-59-44Z), so a plain sorted glob IS chronological order, with no dependence on mtime (which a copy, a restore or a sync can rewrite) and no parsing of ls output. Counts files rather than using `find -mtime`, so a long gap between runs can never delete the only backup you have.
shopt -s nullglob
archives=("$BACKUP_DIR"/dioreo-*.archive.gz)
TOTAL=${#archives[@]}
if [ "$TOTAL" -gt "$KEEP" ]; then
  # Oldest-first by construction; delete all but the last $KEEP.
  for old in "${archives[@]:0:$((TOTAL - KEEP))}"; do
    echo "🧹 pruning $(basename "$old")"
    rm -f "$old"
  done
  archives=("$BACKUP_DIR"/dioreo-*.archive.gz)
fi

echo "📦 $BACKUP_DIR — ${#archives[@]} archive(s) retained"
