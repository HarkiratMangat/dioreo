# Known open issues (flagged, not silently patched)

*Read on demand / when touching a flagged area. Moved from CLAUDE.md on 2026-07-22 13:27 EDT; root
CLAUDE.md's nav map points here. Also cross-check `docs/db-deferred-list.md` (🐞 Active Bugs — this
project's confirmed bugs moved in-repo 2026-07-25 21:43 EDT; `/Applications/Claude Code/meta-deferred-list.md`
now only holds cross-project ones).*

- `calendar.js` and `draws.js` both have defensive component-count chunking;
  `patchnotes.js`'s media carousel does not (untested at scale — likely fine since
  patch note screenshots per entry are usually few, but not empirically verified
  the way draws/calendar chunking was).
- **View Colors panel's vertical centering is unsolved.** Discord's Components V2 has no native
  vertical-align control for a Section's text relative to its accessory; a blank-emoji-line
  workaround was tried and reverted after it looked wrong on mobile. Purely cosmetic, no functional
  impact — see `.claude/rules/accent-and-colors.md` for the full history.
- **Deco page renders as a static poster, not animated**, even though its thumbnail points at the
  real animated decoration URL — confirmed a genuine Discord-client limitation (needs a manual tap
  to animate in this context), not a bug in this bot's own code. The real fix (re-encoding APNG to
  GIF via ffmpeg on every render, since GIFs DO autoplay inline) was deliberately not built — real
  per-render latency for a cosmetic nicety Harkirat said he's fine leaving static. Nameplate's own
  animated `.webm` was tried in its place for the same reason and reverted for the same tap-to-play
  limitation; that plumbing (`nameplateAnimatedUrl`) was removed rather than left dead.
- **`ffmpeg` is a real system dependency** (not an npm package — must be on `PATH`) for
  `utils/stillFrame.js`: View Colors' decoration extraction and `'dynamicProfile'`'s decoration source.
  **Largely RESOLVED — updated 2026-07-28 01:41 EDT.** This entry used to warn it was "not guaranteed on
  Render/Railway's production containers." **Both hosts are retired** — the bot has run on the GCP VM
  since the 2026-07-17 cutover, and Render was deleted in v2.35.14. Unlike an opaque container, the VM
  is provisioned explicitly and **`ffmpeg` is listed among its installed packages** (see
  `docs/reference/deployment-and-ops.md`). Kept as a flagged dependency only because it is still a
  *system* binary that a VM rebuild could omit: if decoration color extraction ever works locally but
  not live, check `ffmpeg` on the VM before assuming a code bug.
- **Pagination/toggle clicks (draws' New/Returning switch, calendar/draw-prices sub-page nav, etc.)
  have a structural double network round-trip, not a CPU/DB bug** (investigated 2026-07-14, Harkirat
  flagged it "feels slow"). Traced every `await` on the hot path for both `/draws`' view-switch and
  `/calendar`'s sub-page nav: 1 `deferUpdate()` round-trip, 2 concurrent Mongo reads (`prefs` +
  `SeasonalData`), then a SEPARATE `rest.patch(Routes.webhookMessage(...))` round-trip to actually
  update the message — `buildContainer()` itself is pure sync string-building, no image/attachment
  work happens on this path at all. Ruled out the earlier View-Colors-incident-style cause too:
  Harkirat's own saved `accentColorStyle` is `'preset'`, which returns `presetHex` immediately with
  no live Discord fetch, so that's not contributing here. The real fix — answering with a single
  direct `UPDATE_MESSAGE` interaction response instead of defer-then-patch — would cut one full
  network hop per click, but touches every paginated command (draws/calendar/drawprices/settings/
  colors/loadouts), a broader refactor than anything else done this session. **Deliberately deferred
  to a future session** (Harkirat's explicit call — ship the smaller asks first) rather than attempted
  alongside the panel-lock/share-button/timestamp-format work above. **When we do tackle it, the agreed
  shape is a HYBRID, not a blanket conversion** (Harkirat's call, 2026-07-14): split by what each
  handler does before it can respond. Pure string-building paginated commands (draws, calendar,
  drawprices, settings) → single `UPDATE_MESSAGE` (one hop; they finish well inside Discord's 3s ACK
  window, so the margin `deferUpdate()` buys isn't needed). Anything that does heavy work before
  replying — View Colors (k-means extraction, swatch/gradient PNG generation, the ffmpeg still-frame)
  and any attachment-generating path → KEEP defer-then-patch, since blowing the 3s ACK is a real risk
  there. Heuristic: "does this path do CPU or image/network work before it replies?" → heavy stays
  defer, light goes single-hop.
- **CORRECTED 2026-07-18 (was wrong in an earlier same-day pass, caught when Harkirat pushed back):**
  physically disabling expired buttons IS achievable — do not reintroduce the earlier wrong claim that
  it's a hard Discord platform wall. What's actually true: **every button click is its OWN fresh
  interaction with its OWN fresh 15-minute token** — confirmed via Discord's docs and community sources,
  and consistent with the plain observed fact that draws/calendar/loadout pagination buttons (which have
  NO expiry check at all) keep working indefinitely no matter how old the message is. The 15-minute
  token lifetime applies to editing/following-up via ONE SPECIFIC interaction's own token — it does NOT
  mean a message becomes permanently uneditable after 15 minutes; each new click supplies its own valid
  token regardless of the message's age. **What this means for `/settings`' existing 15-minute expiry:
  that number is a self-imposed BUSINESS rule (Harkirat wanted settings changes to have a real
  freshness window), NOT derived from any Discord token limit** — the earlier claim that it "had to"
  be 15 minutes because of Discord's ceiling was incorrect; it could be any duration.
  **FURTHER CORRECTED same day, after this paragraph was first written:** the "only genuinely
  unavailable thing" claim below (a fully proactive, zero-click update) was ALSO wrong — a scheduled
  `setTimeout` inside the bot process can hold an already-issued interaction token and fire a `PATCH`
  with it directly, entirely on its own, as long as it fires before that token's own 15-minute
  ceiling. No click, no channel-edit permission, no scheduled job outside the bot process needed —
  this is now BUILT for `/settings` (2026-07-18): see "Passive idle-timeout auto-disable" in the
  "Panel interaction locks" (see `.claude/rules/settings-and-expiry.md`) for the shipped mechanism (`utils/passiveExpiry.js`), which
  does exactly this. Still open: extending the same pattern to draws/calendar/drawprices/loadouts —
  tracked in **`docs/ROADMAP.md`** (the "Extending `utils/passiveExpiry.js`'s `schedulePanelExpiry` to
  their own render/re-render sites" item). *(Corrected 2026-07-28 01:41 EDT: this used to say "the
  roadmap item below," but nothing follows it — this is the last entry in the file, and the roadmap
  moved out to its own file on 2026-07-22.)*

