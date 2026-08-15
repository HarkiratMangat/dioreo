#!/usr/bin/env python3
"""
Sync docs/reference/nameplate-decoration-catalog.json against Discord's live
collectibles-categories API.

Read-only against Discord (a single GET) and additive-only against the local
catalog: existing entries are never rewritten or removed, only genuinely new
SKUs get appended. Re-running with no new items is a no-op (the file is left
byte-identical) so a scheduled run only ever produces a git diff when Discord
actually shipped something new.

Requires a Discord USER token (self-bot territory — see the README section
in docs/reference/nameplate-decoration-catalog.md before scheduling this).
A bot token cannot substitute: verified live 2026-08-15 01:37 EDT,
`Bot <token>` against this endpoint returns 403 {"code": 20001, "message":
"Bots cannot use this endpoint"}.

All credentials are read from a gitignored .env.discord-sync file next to
this script — see ENV_TEMPLATE below for the exact keys. Nothing sensitive
is hardcoded here.

Usage:
    python3 scripts/syncNameplateCatalog.py [--file PATH] [--dry-run]
"""

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
DEFAULT_CATALOG_PATH = REPO_ROOT / "docs" / "reference" / "nameplate-decoration-catalog.json"
ENV_PATH = SCRIPT_DIR / ".env.discord-sync"

REQUEST_TIMEOUT_SECONDS = 20

# Deliberately v9, not v10 — matches the client fingerprint below; mixing API
# versions with a stale x-super-properties blob is a plausible way to trip
# Discord's Cloudflare challenge and turn a real credential problem into a
# confusing one.
API_URL = (
    "https://discord.com/api/v9/collectibles-categories/v2"
    "?include_bundles=true&variants_return_style=2&skip_num_categories=0"
)

REQUIRED_ENV_VARS = [
    "DISCORD_USER_TOKEN",
    "DISCORD_COOKIE",
    "DISCORD_INSTALLATION_ID",
    "DISCORD_SUPER_PROPERTIES",
    "DISCORD_USER_AGENT",
]

ENV_TEMPLATE = """\
# Discord self-bot credentials for scripts/syncNameplateCatalog.py.
# Gitignored (matches the repo's blanket `.env.*` pattern) — never commit this file.
# Pull fresh values from a real Discord desktop-client request to
# https://discord.com/api/v9/collectibles-categories/v2 (devtools Network tab,
# any request to discord.com/api while the shop is open) whenever the script
# starts failing — these expire; see the "When this breaks" note in
# docs/reference/nameplate-decoration-catalog.md.

DISCORD_USER_TOKEN=
DISCORD_COOKIE=
DISCORD_INSTALLATION_ID=
DISCORD_SUPER_PROPERTIES=
DISCORD_USER_AGENT=
"""

PALETTE_HEX_MAP = {
    "black": "#000000", "white": "#ffffff", "crimson": "#900007",
    "berry": "#893a99", "bubble_gum": "#dc3e97", "violet": "#730bc8",
    "cobalt": "#0131c2", "sky": "#0080b7", "teal": "#086460",
    "clover": "#047b20", "forest": "#2d5401", "lemon": "#f6cd12",
}

KEYS_TO_DROP = [
    "prices", "google_sku_ids", "name_localizations", "summary_localizations",
    "summary", "store_listing_id", "category_sku_id", "premium_type",
    "badge_override", "hide_badge", "is_first_party", "styles", "preview_assets",
    "unpublished_at",
]


def load_env_file(path):
    """Minimal .env parser (KEY=value, # comments) — stdlib only, no python-dotenv dependency."""
    values = {}
    if not path.exists():
        return values
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        values[key.strip()] = val.strip().strip('"').strip("'")
    return values


def build_headers():
    if not ENV_PATH.exists():
        ENV_PATH.write_text(ENV_TEMPLATE, encoding="utf-8")
        sys.exit(
            f"No credentials file found — created a blank template at {ENV_PATH}.\n"
            "Fill in the five DISCORD_* values (pulled from a real client request's "
            "headers) and re-run."
        )

    env = {**load_env_file(ENV_PATH), **os.environ}
    missing = [k for k in REQUIRED_ENV_VARS if not env.get(k)]
    if missing:
        sys.exit(
            "Missing required credentials in " + str(ENV_PATH) + ": " + ", ".join(missing)
        )

    return {
        "accept": "*/*",
        "accept-language": "en-US,en-CA;q=0.9",
        "authorization": env["DISCORD_USER_TOKEN"],
        "cookie": env["DISCORD_COOKIE"],
        "referer": "https://discord.com/shop?tab=avatar-decorations",
        "user-agent": env["DISCORD_USER_AGENT"],
        "x-discord-locale": "en-US",
        "x-discord-timezone": env.get("DISCORD_TIMEZONE", "America/Toronto"),
        "x-installation-id": env["DISCORD_INSTALLATION_ID"],
        "x-super-properties": env["DISCORD_SUPER_PROPERTIES"],
    }


def fetch_live_catalog():
    req = urllib.request.Request(API_URL, headers=build_headers())
    try:
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT_SECONDS) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")[:500]
        sys.exit(
            f"Discord returned HTTP {e.code} — the session in {ENV_PATH.name} is likely "
            f"stale (cookie/token/cf_clearance expire). Refresh it from a live client "
            f"request and retry.\nBody: {body}"
        )
    except urllib.error.URLError as e:
        sys.exit(f"Connection failed: {e}")


def extract_clean_item(item, category_name):
    """Reduce one raw Discord product/variant to the catalog's own field shape and order."""
    sku = item.get("sku_id")
    if not sku:
        return None

    item_type = item.get("type")
    if item_type not in (0, 2):  # 0 = decoration, 2 = nameplate
        return None

    nested_items = item.get("items") or []
    asset = item.get("asset")
    label = item.get("label")
    palette = item.get("palette")
    name = item.get("name")
    variant_label = item.get("variant_label")
    variant_value = item.get("variant_value")

    if nested_items:
        first_nested = nested_items[0]
        asset = asset or first_nested.get("asset")
        label = label or first_nested.get("label")
        palette = palette or first_nested.get("palette")

    # Field order matches the existing catalog exactly, so a no-op run stays
    # byte-identical and a real diff only ever shows genuinely new content —
    # verified against the live file 2026-08-15 01:35 EDT: name-style entries
    # are sku_id, name, asset, label, [palette, palette_hex]; variant-style
    # entries are sku_id, asset, label, [palette, palette_hex], variant_label,
    # variant_value (name and variant_label never co-occur, 0 exceptions
    # found across all 925 existing entries).
    cleaned = {"sku_id": str(sku)}
    if not variant_label and name:
        cleaned["name"] = name
    if asset:
        cleaned["asset"] = asset
    if label:
        cleaned["label"] = label
    if item_type == 2 and palette:  # decorations carry no palette/bed concept
        cleaned["palette"] = palette
        hex_val = PALETTE_HEX_MAP.get(palette)
        if hex_val:
            cleaned["palette_hex"] = hex_val
    if variant_label:
        cleaned["variant_label"] = variant_label
    if variant_value:
        cleaned["variant_value"] = variant_value

    return {
        "_cleaned": cleaned,
        "_category": category_name or "Uncategorized",
        "_type": item_type,
        "_base_sku": str(item.get("base_variant_sku_id", sku)),
        "_base_name": item.get("base_variant_name") or name or cleaned.get("label") or str(sku),
        "_richness": len(cleaned) + (1 if variant_label else 0),
    }


def collect_unique_items(live_data):
    unique = {}  # sku -> record from extract_clean_item

    def consider(product, category_name):
        for key in KEYS_TO_DROP:
            product.pop(key, None)
        record = extract_clean_item(product, category_name)
        if record is None:
            return
        sku = record["_cleaned"]["sku_id"]
        existing = unique.get(sku)
        if existing is None or record["_richness"] > existing["_richness"]:
            unique[sku] = record

    for category in live_data.get("categories", []):
        cat_name = category.get("name") or "Uncategorized"
        for product in category.get("products", []):
            consider(dict(product), cat_name)
            if product.get("type") == 2000:  # bundle/group wrapper, not itself purchasable
                for variant in product.get("variants", []):
                    consider(dict(variant), cat_name)

    return unique


def group_by_collection(unique_items):
    grouped = {}
    for record in unique_items.values():
        cat = record["_category"]
        section = "decorations" if record["_type"] == 0 else "nameplates"
        base_sku = record["_base_sku"]
        grouped.setdefault(cat, {"decorations": {}, "nameplates": {}})
        bucket = grouped[cat][section]
        if base_sku not in bucket:
            bucket[base_sku] = {
                "group_name": record["_base_name"],
                "base_sku_id": base_sku,
                "variants": [],
            }
        bucket[base_sku]["variants"].append(record["_cleaned"])
    return grouped


def merge_into_catalog(existing_catalog, new_grouped):
    existing_skus = {
        v["sku_id"]
        for sections in existing_catalog.values()
        for groups in sections.values()
        for group in groups
        for v in group.get("variants", [])
    }

    added = 0
    for cat, sections in new_grouped.items():
        if cat not in existing_catalog:
            # New collection — prepend so the newest collection reads first.
            existing_catalog = {cat: {"decorations": [], "nameplates": []}, **existing_catalog}

        for section_name, new_groups in sections.items():
            existing_list = existing_catalog[cat].setdefault(section_name, [])

            for base_sku, new_group in new_groups.items():
                fresh_variants = [v for v in new_group["variants"] if v["sku_id"] not in existing_skus]
                if not fresh_variants:
                    continue
                added += len(fresh_variants)

                existing_group = next(
                    (g for g in existing_list if g.get("base_sku_id") == base_sku), None
                )
                if existing_group is not None:
                    existing_group["variants"] = fresh_variants + existing_group["variants"]
                else:
                    existing_list.insert(0, {
                        "group_name": new_group["group_name"],
                        "base_sku_id": base_sku,
                        "variants": fresh_variants,
                    })

    return existing_catalog, added


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--file", type=Path, default=DEFAULT_CATALOG_PATH,
                         help="Catalog JSON path (default: docs/reference/nameplate-decoration-catalog.json)")
    parser.add_argument("--dry-run", action="store_true",
                         help="Fetch and diff, but don't write the file")
    args = parser.parse_args()

    stamp = datetime.now(timezone.utc).astimezone().strftime("%Y-%m-%d %H:%M %Z")
    print(f"[{stamp}] Fetching live catalog from Discord…")
    live_data = fetch_live_catalog()

    existing_catalog = {}
    if args.file.exists():
        existing_catalog = json.loads(args.file.read_text(encoding="utf-8"))

    unique_items = collect_unique_items(live_data)
    new_grouped = group_by_collection(unique_items)
    merged, added = merge_into_catalog(existing_catalog, new_grouped)

    if added == 0:
        print(f"[{stamp}] Up to date — no new SKUs found. '{args.file}' left untouched.")
        return

    print(f"[{stamp}] {added} new SKU(s) found.")
    if args.dry_run:
        print("--dry-run set: not writing.")
        return

    args.file.write_text(json.dumps(merged, indent=4), encoding="utf-8")
    print(f"[{stamp}] Wrote {args.file}. Review with `git diff` and commit on a branch when ready.")


if __name__ == "__main__":
    main()
