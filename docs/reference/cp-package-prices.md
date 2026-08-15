---
kind: reference
status: live
---

# CP package prices by currency

Companion to `cp-package-prices.json`. What it holds, where it came from, and the traps that make a re-crawl easy to get wrong.

## What this is

The real-money price of each of the six in-game COD Points bundles, in every currency the official CODM web store sells in. It exists because **`/draw calculator`'s purchase optimizer cannot give correct advice from USD alone** — see the design spec at `docs/superpowers/specs/2026-08-15-draw-cost-calculator-design.md`.

Apple and Google assign price-point values **directly per storefront**. They are tier-locked, not rate-locked: a local price stays fixed regardless of exchange-rate movement until someone changes it. Crucially the tiers are **not proportional to one another**, so the cheapest way to buy a given amount of CP genuinely differs by country.

**In 17 of the 41 currencies here, "just buy the biggest pack" is wrong.** Best value by tier position:

| Best value sits at | Currencies |
|---|---|
| **Tier 1 — the *smallest* pack** | NOK, SEK |
| Tier 4 | PLN, HUF |
| Tier 5 | CZK, DKK, CHF, NZD, COP |
| Tier 6 — the biggest pack | AED, QAR, EUR, CAD, PKR, CLP, PEN, RON |
| Monotonic (bigger always better) | the other 24, including USD, GBP, JPY, BRL |

## Schema

```jsonc
{
  "schemaVersion": 1,
  "capturedAt": "<ISO-8601 UTC>",
  "inGameBundlesCp": [80, 420, 880, 2400, 5000, 10800],
  "currencies": {
    "CAD": {
      "country": "Canada",
      "locales": ["en-ca", "fr-ca"],   // every store locale billing in this currency
      "prices":  [0.99, 6.99, 12.99, 34.99, 69.99, 129.99]  // aligns index-for-index with inGameBundlesCp
    }
  }
}
```

`prices` is in **major units as the store displays them** — not minor units — because currencies here differ in exponent (JPY and CLP have no decimal places, KWD and BHD have three). A consumer that needs integer arithmetic should scale by a known per-currency exponent rather than assuming 100.

## Provenance

Captured 2026-08-15 16:29 EDT from `https://store.callofdutymobile.com/<locale>/codm/`, the official store operated for Activision by Coda Payments.

Prices are read from the **embedded JSON payload**, not from rendered text. The page carries two `<script type="application/json">` blocks; the second (~57KB) parses into a flat array of ~767 entries in a devalue/Nuxt style where integers inside objects are **indices into that same array**. Product objects carry `title`, `currency`, `pricePoints` and `strikethroughPrice`; price objects carry `price`, `publisherPrice`, `discountAmount` and `hasDiscount`.

**Validated, not assumed.** The extraction reproduced all three price tables Harkirat supplied from his own stores — `en-us`, `en-ca` and `en-ie` — exactly. Ten further rows (JPY, NOK, TRY, ZAR, MXN, CHF, PKR, HUF, COP, KWD) were re-fetched live and compared against the committed file after transcription.

## 🔴 Traps for anyone re-crawling

**1. `publisherPrice` is the price you want; `price` is the promotional one.** A live "35% off first purchase" promo runs on the store.

**2. `hasDiscount` is a liar.** It reads `false` on visibly discounted items — an `en-ca` object showed `price=4.54, publisherPrice=6.99, hasDiscount=false, discountAmount=0`. **Never branch on it.** Take `publisherPrice` unconditionally; to detect a discount, compare `price !== publisherPrice`.

**3. The web store's CP quantities are NOT the in-game quantities.** It sells 88 / 160 / 460 / 960 / 2600 / 5400 / 11200 (or 11600) CP — web-exclusive bonus amounts — while the game sells 80 / 420 / 880 / 2400 / 5000 / 10800. The **price points are identical**, so bundles map by ascending tier position, never by CP amount.

**4. The CP ladder is not uniform across storefronts.** Four distinct ladders were observed; most sell 11,600 CP at the sixth rung rather than 11,200, and some carry only seven rungs instead of ten. Matching "smallest web tier ≥ each in-game tier" is stable across all four.

**5. The payload array is deduplicated.** A repeated value collapses to a single index — `34.99` appears once and is referenced by two products — so any "read the numbers near this product" heuristic is wrong. Resolve through object fields.

**6. Non-CP products share the price space.** A "100 MYTHIC CARDS" upgrade item and event bundles such as `"2,600 CP "` (note the comma and trailing space in its title) also carry prices. Matching titles on `^\d+\s*CP$` excludes them; a naive "six lowest prices" does not.

**7. Two products can share a price.** `88 CP` and `160 CP` are both the cheapest tier. Deduplicating prices before taking six would silently shift every tier.

**8. Do not parse rendered display text.** Formatting varies — `de-de` renders `99,99 €` with a trailing symbol and comma decimal, `ja-jp` uses `¥160` with no decimals, and `ar-*` locales differ again. An early regex attempt over display text silently returned partial data for `de-de`. The JSON gives the number and an ISO currency code directly.

## Known gap

**`sv-se` is not captured.** Its page loads normally with both JSON blocks and prices present, but its product titles do not match the `^\d+\s*CP$` pattern the extractor keys on, so it yields no products. **No data is lost** — SEK is captured from `en-se`, the same storefront. Worth revisiting only if a locale-specific title format turns out to affect other locales too; the 70 that succeeded cover all 41 currencies the store sells in.

✅ **Independently confirmed 2026-08-15 17:49 EDT** — Harkirat manually checked `sv-se`'s live prices (9,00 kr / 69,00 kr / 129,00 kr / 299,00 kr / 599,00 kr / 1295,00 kr) and they match the committed `en-se`-sourced SEK row exactly.

## Refreshing

Prices change rarely (tier-locked, not rate-linked) but not never — a storefront repricing, or Apple/Google adjusting a territory's tiers, would make this stale. There is no automated refresh. **Re-run the capture before any release that leans on these figures**, and diff against the committed file rather than overwriting it blind: a changed price is a real event worth reading, not noise.
